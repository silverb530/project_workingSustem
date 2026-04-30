from flask import Blueprint, request, jsonify, Response
from FaceReco.camera import get_latest_frame
from db import execute_query
import cv2, os, time, threading

register_bp = Blueprint("register", __name__)

face_cascade = cv2.CascadeClassifier(
    cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
)

cap_state = {"employee_id": None, "capturing": False, "count": 0}
CAPTURE_MAX = 100


def _reload_employees():
    def _run():
        try:
            from FaceReco.recognize import rebuild_employees
            rebuild_employees()
            print("[INFO] 얼굴 임베딩 DB 재빌드 완료")
        except Exception as e:
            print(f"[WARN] 얼굴 임베딩 재빌드 실패: {e}")
    threading.Thread(target=_run, daemon=True).start()


def generate_register_frames():
    while True:
        frame = get_latest_frame()
        if frame is None:
            time.sleep(0.033)
            continue

        if cap_state['capturing'] and cap_state['count'] < CAPTURE_MAX:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_cascade.detectMultiScale(gray, 1.3, 5)

            for (x, y, w, h) in faces:
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

                save_dir = f"employees/{cap_state['employee_id']}"
                os.makedirs(save_dir, exist_ok=True)
                img_path = f"{save_dir}/{cap_state['count']:03d}.jpg"
                cv2.imwrite(img_path, frame)
                cap_state['count'] += 1

                if cap_state['count'] >= CAPTURE_MAX:
                    cap_state['capturing'] = False

                    execute_query(
                        """INSERT INTO employee_faces
                           (employee_id, image_path, capture_seq, is_active)
                           VALUES (%s, %s, %s, 1)
                           ON DUPLICATE KEY UPDATE is_active = 1""",
                        (cap_state['employee_id'], save_dir, CAPTURE_MAX),
                        fetch=False
                    )

                    _reload_employees()

            label = f"Capturing: {cap_state['count']}/{CAPTURE_MAX}"
            cv2.putText(frame, label, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        time.sleep(0.033)


@register_bp.route('/api/face/register/start', methods=['POST'])
def register_start():
    data = request.get_json()
    employee_id = str(data.get('employee_id', '')).strip()

    row = execute_query(
        "SELECT employee_id FROM employees WHERE employee_id = %s",
        (employee_id,)
    )
    if not row:
        return jsonify({"error": "존재하지 않는 사번입니다."}), 404

    cap_state['employee_id'] = employee_id
    cap_state['capturing'] = True
    cap_state['count'] = 0
    return jsonify({"message": "촬영 시작!"})


@register_bp.route('/api/face/register/status')
def register_status():
    return jsonify(cap_state)


@register_bp.route('/api/face/register/feed')
def register_feed():
    return Response(generate_register_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')


@register_bp.route('/api/face/register/confirm', methods=['POST'])
def register_confirm():
    _reload_employees()
    return jsonify({"result": "success"})
