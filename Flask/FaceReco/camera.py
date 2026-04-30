from flask import Blueprint, Response, jsonify
import cv2, threading, time

camera_bp = Blueprint("camera", __name__)

_lock = threading.Lock()
_latest_frame = None
_thread = None


def _capture_loop():
    global _latest_frame
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("[ERROR] 카메라를 열 수 없습니다 (index 0). 카메라 연결을 확인하세요.")
        return
    print("[INFO] 카메라 캡처 스레드 시작됨")
    while True:
        ret, frame = cap.read()
        if ret:
            with _lock:
                _latest_frame = frame
        else:
            time.sleep(0.01)


def _ensure_started():
    global _thread
    if _thread is None or not _thread.is_alive():
        _thread = threading.Thread(target=_capture_loop, daemon=True)
        _thread.start()
        time.sleep(0.5)


def get_latest_frame():
    _ensure_started()
    for _ in range(60):
        with _lock:
            if _latest_frame is not None:
                return _latest_frame.copy()
        time.sleep(0.05)
    return None


def generate_frames():
    _ensure_started()
    while True:
        with _lock:
            frame = _latest_frame.copy() if _latest_frame is not None else None
        if frame is None:
            time.sleep(0.033)
            continue
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
        yield (b'--frame\r\nContent-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        time.sleep(0.033)


@camera_bp.route('/api/camera/feed')
def video_feed():
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


@camera_bp.route('/api/camera/feed/snapshot')
def camera_snapshot():
    frame = get_latest_frame()
    if frame is None:
        return jsonify({"error": "카메라를 사용할 수 없습니다"}), 503
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
    return Response(buffer.tobytes(), mimetype='image/jpeg')
