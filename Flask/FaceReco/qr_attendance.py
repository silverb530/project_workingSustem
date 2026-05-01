from flask import Blueprint, request, jsonify
from datetime import date, datetime
import json
import cv2

from db import execute_query
from FaceReco.camera import get_latest_frame

qr_attendance_bp = Blueprint("qr_attendance", __name__)


def decode_qr_from_frame(frame):
    detector = cv2.QRCodeDetector()

    candidates = []

    # 1. 원본
    candidates.append(frame)

    # 2. 확대
    bigger = cv2.resize(frame, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
    candidates.append(bigger)

    # 3. 흑백
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    candidates.append(gray)

    # 4. 흑백 확대
    gray_big = cv2.resize(gray, None, fx=2.0, fy=2.0, interpolation=cv2.INTER_CUBIC)
    candidates.append(gray_big)

    # 5. 대비 향상
    equalized = cv2.equalizeHist(gray_big)
    candidates.append(equalized)

    # 6. 샤픈
    blurred = cv2.GaussianBlur(gray_big, (0, 0), 3)
    sharpened = cv2.addWeighted(gray_big, 1.8, blurred, -0.8, 0)
    candidates.append(sharpened)

    # 7. 이진화
    _, thresh = cv2.threshold(
        gray_big,
        0,
        255,
        cv2.THRESH_BINARY + cv2.THRESH_OTSU
    )
    candidates.append(thresh)

    for img in candidates:
        qr_text, points, _ = detector.detectAndDecode(img)

        if qr_text:
            print("스캔된 QR:", qr_text)
            return qr_text.strip()

    print("QR 인식 실패")
    return None


def parse_json_safe(text):
    try:
        return json.loads(text)
    except Exception:
        return None


def same_qr_data(db_qr_data, scanned_qr_text):
    """
    DB의 qr_data와 스캔된 QR 문자열을 비교한다.
    1. 문자열 완전 일치
    2. JSON이면 JSON 객체 비교
    """
    if not db_qr_data or not scanned_qr_text:
        return False

    db_text = str(db_qr_data).strip()
    scan_text = str(scanned_qr_text).strip()

    if db_text == scan_text:
        return True

    db_json = parse_json_safe(db_text)
    scan_json = parse_json_safe(scan_text)

    if db_json is not None and scan_json is not None:
        return db_json == scan_json

    return False


def find_employee_by_qr(qr_text):
    """
    QR 문자열에서 employee_id를 읽어서 직원을 찾는다.
    우선 JSON QR을 기준으로 처리하고,
    완전 일치 qr_data 검색은 보조 방식으로 둔다.
    """

    qr_json = parse_json_safe(qr_text)

    if qr_json:
        qr_type = qr_json.get("type")
        employee_id = qr_json.get("employee_id")
        email = qr_json.get("email")

        if qr_type not in ["employee_access", "employee_qr"]:
            return None

        if not employee_id:
            return None

        if email:
            rows = execute_query(
                """
                SELECT employee_id, name, department, position, qr_data, is_active
                FROM employees
                WHERE employee_id = %s
                  AND email = %s
                  AND is_active = 1
                LIMIT 1
                """,
                (employee_id, email)
            )
        else:
            rows = execute_query(
                """
                SELECT employee_id, name, department, position, qr_data, is_active
                FROM employees
                WHERE employee_id = %s
                  AND is_active = 1
                LIMIT 1
                """,
                (employee_id,)
            )

        if rows:
            return rows[0]

        return None

    rows = execute_query(
        """
        SELECT employee_id, name, department, position, qr_data, is_active
        FROM employees
        WHERE qr_data = %s
          AND is_active = 1
        LIMIT 1
        """,
        (qr_text,)
    )
     
    return rows[0] if rows else None


def check_in_by_qr(employee_id):
    today = date.today()
    now = datetime.now()

    existing = execute_query(
        """
        SELECT *
        FROM attendance
        WHERE employee_id = %s
          AND work_date = %s
        LIMIT 1
        """,
        (employee_id, today)
    )

    if existing:
        return {
            "result": "fail",
            "message": "이미 출근 처리되었습니다."
        }

    execute_query(
        """
        INSERT INTO attendance
            (employee_id, work_date, check_in_time, check_in_method, status)
        VALUES
            (%s, %s, %s, 'QR', 'PRESENT')
        """,
        (employee_id, today, now),
        fetch=False
    )

    return {
        "result": "success",
        "message": f"출근 완료! ({now.strftime('%H:%M')})",
        "time": now.strftime("%Y-%m-%d %H:%M:%S")
    }


def check_out_by_qr(employee_id):
    today = date.today()
    now = datetime.now()

    existing = execute_query(
        """
        SELECT *
        FROM attendance
        WHERE employee_id = %s
          AND work_date = %s
        LIMIT 1
        """,
        (employee_id, today)
    )

    if not existing:
        return {
            "result": "fail",
            "message": "출근 기록이 없습니다."
        }

    if existing[0].get("check_out_time"):
        return {
            "result": "fail",
            "message": "이미 퇴근 처리되었습니다."
        }

    execute_query(
        """
        UPDATE attendance
        SET check_out_time = %s,
            check_out_method = 'QR'
        WHERE employee_id = %s
          AND work_date = %s
        """,
        (now, employee_id, today),
        fetch=False
    )

    return {
        "result": "success",
        "message": f"퇴근 완료! ({now.strftime('%H:%M')})",
        "time": now.strftime("%Y-%m-%d %H:%M:%S")
    }


@qr_attendance_bp.route("/api/attendance/qr-scan", methods=["POST"])
def qr_scan_attendance():
    data = request.get_json(silent=True) or {}
    mode = data.get("mode")

    if mode not in ["출근", "퇴근"]:
        return jsonify({
            "result": "fail",
            "success": False,
            "message": "출근 또는 퇴근을 선택하세요."
        }), 400

    frame = get_latest_frame()

    if frame is None:
        return jsonify({
            "result": "fail",
            "success": False,
            "message": "카메라 프레임을 가져올 수 없습니다."
        }), 503

    qr_text = decode_qr_from_frame(frame)
    print("스캔된 QR 원문:", repr(qr_text))

    if not qr_text:
        return jsonify({
            "result": "fail",
            "success": False,
            "message": "QR 코드를 찾지 못했습니다. QR을 카메라 중앙에 맞춰주세요."
        }), 400

    employee = find_employee_by_qr(qr_text)

    if not employee:
        return jsonify({
            "result": "fail",
            "success": False,
            "message": "등록되지 않은 QR 코드입니다.",
            "qr_text": qr_text
        }), 404

    if mode == "출근":
        result = check_in_by_qr(employee["employee_id"])
    else:
        result = check_out_by_qr(employee["employee_id"])

    success = result["result"] == "success"

    return jsonify({
        "result": result["result"],
        "success": success,
        "message": result["message"],
        "time": result.get("time"),
        "employee": {
            "employee_id": employee["employee_id"],
            "name": employee["name"],
            "department": employee["department"],
            "position": employee["position"],
        }
    })