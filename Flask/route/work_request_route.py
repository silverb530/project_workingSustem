import os
import uuid
from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
from db import get_conn

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "work_requests")
os.makedirs(UPLOAD_DIR, exist_ok=True)

work_request_bp = Blueprint("work_request", __name__)


def _init_table():
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS work_requests (
                    request_id           INT AUTO_INCREMENT PRIMARY KEY,
                    title                VARCHAR(200) NOT NULL,
                    description          TEXT,
                    requester_id         INT NOT NULL,
                    requester_department VARCHAR(100) NOT NULL,
                    target_department    VARCHAR(100) NOT NULL,
                    status               ENUM('PENDING','ACCEPTED','IN_PROGRESS','COMPLETED','REJECTED')
                                         NOT NULL DEFAULT 'PENDING',
                    priority             ENUM('LOW','MEDIUM','HIGH') NOT NULL DEFAULT 'MEDIUM',
                    due_date             DATE,
                    accepted_at          DATETIME,
                    started_at           DATETIME,
                    completed_at         DATETIME,
                    rejected_at          DATETIME,
                    rejection_reason     VARCHAR(500),
                    created_at           DATETIME NOT NULL DEFAULT NOW()
                )
            """)
            conn.commit()
    except Exception as e:
        print(f"[work_request] 테이블 초기화 오류: {e}")
    finally:
        if conn:
            conn.close()


def _init_files_table():
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("""
                CREATE TABLE IF NOT EXISTS work_request_files (
                    file_id       INT AUTO_INCREMENT PRIMARY KEY,
                    request_id    INT NOT NULL,
                    original_name VARCHAR(500) NOT NULL,
                    stored_name   VARCHAR(500) NOT NULL,
                    file_path     VARCHAR(1000) NOT NULL,
                    file_size     BIGINT,
                    mime_type     VARCHAR(200),
                    uploaded_at   DATETIME NOT NULL DEFAULT NOW()
                )
            """)
            conn.commit()
    except Exception as e:
        print(f"[work_request_files] 테이블 초기화 오류: {e}")
    finally:
        if conn:
            conn.close()


try:
    _init_table()
    _init_files_table()
except Exception as e:
    print(f"[work_request] import 중 오류: {e}")


def _fmt(row):
    for f in ('accepted_at', 'started_at', 'completed_at', 'rejected_at', 'created_at'):
        if row.get(f):
            row[f] = row[f].strftime('%Y-%m-%d %H:%M:%S')
    if row.get('due_date'):
        row['due_date'] = row['due_date'].strftime('%Y-%m-%d')
    return row


# 보낸 요청 목록 (내 부서가 요청한 것) - department 쿼리 파라미터로 받음
@work_request_bp.route("/api/work-requests/sent", methods=["GET"])
def get_sent_requests():
    dept = (request.args.get("department") or "").strip()
    if not dept:
        return jsonify({"success": False, "message": "부서 정보가 없습니다.", "requests": []}), 400
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT wr.*, e.name AS requester_name
                FROM work_requests wr
                LEFT JOIN employees e ON wr.requester_id = e.employee_id
                WHERE wr.requester_department = %s
                ORDER BY wr.created_at DESC
            """, (dept,))
            rows = [_fmt(r) for r in cur.fetchall()]
        return jsonify({"success": True, "requests": rows})
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "requests": []}), 500
    finally:
        if conn: conn.close()


# 받은 요청 목록 (내 부서가 처리해야 하는 것) - department 쿼리 파라미터로 받음
@work_request_bp.route("/api/work-requests/received", methods=["GET"])
def get_received_requests():
    dept = (request.args.get("department") or "").strip()
    if not dept:
        return jsonify({"success": False, "message": "부서 정보가 없습니다.", "requests": []}), 400
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT wr.*, e.name AS requester_name
                FROM work_requests wr
                LEFT JOIN employees e ON wr.requester_id = e.employee_id
                WHERE wr.target_department = %s
                ORDER BY wr.created_at DESC
            """, (dept,))
            rows = [_fmt(r) for r in cur.fetchall()]
        return jsonify({"success": True, "requests": rows})
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "requests": []}), 500
    finally:
        if conn: conn.close()


# 새 업무 요청 등록 (requester 정보는 프론트에서 전달)
@work_request_bp.route("/api/work-requests", methods=["POST"])
def create_work_request():
    data = request.get_json(silent=True) or {}

    title            = (data.get("title") or "").strip()
    description      = (data.get("description") or "").strip()
    target_department= (data.get("target_department") or "").strip()
    priority         = data.get("priority") or "MEDIUM"
    due_date         = data.get("due_date") or None
    requester_id     = data.get("requester_id")
    requester_dept   = (data.get("requester_department") or "").strip()

    if not title:
        return jsonify({"success": False, "message": "업무 제목을 입력하세요."}), 400
    if not target_department:
        return jsonify({"success": False, "message": "담당 부서를 선택하세요."}), 400
    if not requester_dept:
        return jsonify({"success": False, "message": "요청자 부서 정보가 없습니다."}), 400
    if requester_dept == target_department:
        return jsonify({"success": False, "message": "같은 부서에는 요청할 수 없습니다."}), 400

    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO work_requests
                    (title, description, requester_id, requester_department, target_department, priority, due_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (title, description, requester_id, requester_dept, target_department, priority, due_date))
            conn.commit()
            new_id = cur.lastrowid
        return jsonify({"success": True, "message": "업무 요청이 등록되었습니다.", "request_id": new_id})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()


# 상태 변경 (수락 / 처리중 / 완료 / 거절) - department를 body로 받아 검증
@work_request_bp.route("/api/work-requests/<int:req_id>/status", methods=["PATCH"])
def update_status(req_id):
    data = request.get_json(silent=True) or {}
    new_status       = data.get("status")
    dept             = (data.get("department") or "").strip()
    rejection_reason = (data.get("rejection_reason") or "").strip()

    if new_status not in ("ACCEPTED", "IN_PROGRESS", "COMPLETED", "REJECTED"):
        return jsonify({"success": False, "message": "잘못된 상태입니다."}), 400

    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM work_requests WHERE request_id = %s", (req_id,))
            row = cur.fetchone()
            if not row:
                return jsonify({"success": False, "message": "요청을 찾을 수 없습니다."}), 404
            if dept and row["target_department"] != dept:
                return jsonify({"success": False, "message": "권한이 없습니다."}), 403

            if new_status == "ACCEPTED":
                cur.execute("UPDATE work_requests SET status='ACCEPTED', accepted_at=NOW() WHERE request_id=%s", (req_id,))
            elif new_status == "IN_PROGRESS":
                cur.execute("UPDATE work_requests SET status='IN_PROGRESS', started_at=NOW() WHERE request_id=%s", (req_id,))
            elif new_status == "COMPLETED":
                cur.execute("UPDATE work_requests SET status='COMPLETED', completed_at=NOW() WHERE request_id=%s", (req_id,))
            elif new_status == "REJECTED":
                cur.execute("""
                    UPDATE work_requests SET status='REJECTED', rejected_at=NOW(), rejection_reason=%s
                    WHERE request_id=%s
                """, (rejection_reason, req_id))
            conn.commit()
        return jsonify({"success": True, "message": "상태가 변경되었습니다."})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()


# 업무 요청에 파일 업로드
@work_request_bp.route("/api/work-requests/<int:req_id>/files", methods=["POST"])
def upload_request_file(req_id):
    if 'file' not in request.files:
        return jsonify({"success": False, "message": "파일이 없습니다."}), 400

    file = request.files['file']
    if not file or not file.filename:
        return jsonify({"success": False, "message": "파일을 선택하세요."}), 400

    original_name = file.filename
    safe_name = secure_filename(original_name) or f"file_{uuid.uuid4().hex}"
    stored_name = f"{uuid.uuid4().hex}_{safe_name}"
    file_path = os.path.join(UPLOAD_DIR, stored_name)
    file.save(file_path)

    file_size = os.path.getsize(file_path)
    mime_type = file.mimetype

    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO work_request_files
                    (request_id, original_name, stored_name, file_path, file_size, mime_type)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (req_id, original_name, stored_name, file_path, file_size, mime_type))
            conn.commit()
            file_id = cur.lastrowid
        return jsonify({"success": True, "file_id": file_id, "original_name": original_name})
    except Exception as e:
        if conn: conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()


# 업무 요청 파일 목록 조회
@work_request_bp.route("/api/work-requests/<int:req_id>/files", methods=["GET"])
def get_request_files(req_id):
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT file_id, request_id, original_name, file_size, mime_type,
                       uploaded_at
                FROM work_request_files
                WHERE request_id = %s
                ORDER BY uploaded_at ASC
            """, (req_id,))
            rows = cur.fetchall()
        for r in rows:
            if r.get('uploaded_at'):
                r['uploaded_at'] = r['uploaded_at'].strftime('%Y-%m-%d %H:%M')
        return jsonify({"success": True, "files": rows})
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "files": []}), 500
    finally:
        if conn: conn.close()


# 파일 다운로드
@work_request_bp.route("/api/work-requests/files/<int:file_id>/download", methods=["GET"])
def download_request_file(file_id):
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT original_name, file_path FROM work_request_files WHERE file_id = %s", (file_id,))
            row = cur.fetchone()
        if not row:
            return jsonify({"success": False, "message": "파일을 찾을 수 없습니다."}), 404
        if not os.path.exists(row['file_path']):
            return jsonify({"success": False, "message": "서버에 파일이 없습니다."}), 404
        return send_file(row['file_path'], as_attachment=True, download_name=row['original_name'])
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn: conn.close()


# 전체 부서 목록 (인증 불필요 - 부서명은 민감 정보 아님)
@work_request_bp.route("/api/work-requests/departments", methods=["GET"])
def get_departments():
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT DISTINCT department FROM employees
                WHERE department IS NOT NULL AND department != ''
                ORDER BY department
            """)
            rows = cur.fetchall()
        return jsonify({"success": True, "departments": [r["department"] for r in rows]})
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "departments": []}), 500
    finally:
        if conn: conn.close()
