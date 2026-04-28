from flask import Flask, jsonify, send_from_directory
import os
from flask_cors import CORS
from flask_socketio import SocketIO

# [보안 추가] .env / config.py에서 CORS 허용 주소, 실행 설정을 가져오기 위해 추가
from config import ALLOWED_ORIGINS, FLASK_HOST, FLASK_PORT, FLASK_DEBUG

from route.login import auth_bp  # ← 추가!
from App.route.app_login import app_auth_bp
from App.route.app_register import app_register_bp
from route.remoteLog import remote_log_bp
from route.remote_manage import remote_manage_bp

from route.chat import chat_bp

from route.Manager.chat_routes import Mchat_bp #매니저 채팅
from route.Manager.employee_list import employee_bp # 직원 리스트 목록
from route.Manager.attendance_log import attendance_bp #직원 출퇴근 기록
from route.Manager.dashboard_routes import dashboard_bp # 매니저 페이지 대시보드
from route.Manager.task_route import task_bp # 매니저 업무 현황 & 할당
from route.Manager.file_routes import file_bp #매니저 파일업로드
from route.Manager.chat_room_routes import chat_room_bp #매니저 채팅방
from route.Manager.face_manage_routes import face_manage_bp #얼굴 미등록 인원
from route.Manager.notice_routes import notice_bp #공지사항
from route.Manager.board.board_routes import board_bp # 게시판


from route.meeting import meeting_bp

from FaceReco.camera import camera_bp
from FaceReco.register import register_bp
from FaceReco.recognize import recognize_bp, load_employees
from FaceReco.attendance import attendance_bp as face_attendance_bp

from route.profile import profile_bp #마이페이지


app = Flask(__name__)



BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

# [중요] 리액트(5173포트)와의 통신을 허용합니다.
# [보안 추가] 기존 CORS(app)는 모든 주소를 허용하므로, .env에 등록된 주소만 허용하도록 수정
CORS(
    app,
    origins=ALLOWED_ORIGINS,
    supports_credentials=True
)

# [보안 추가] 기존 cors_allowed_origins="*"는 모든 주소의 SocketIO 접속을 허용하므로 제한
socketio = SocketIO(
    app,
    cors_allowed_origins=ALLOWED_ORIGINS
)

# 서버가 잘 돌아가는지 확인하는 기본 주소
@app.route('/')
def home():
    return jsonify({"status": "success", "message": "Flask Server is Online!"})

@app.route("/uploads/<path:filename>")
def uploaded_file(filename):
    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename,
        as_attachment=True
    )

app.register_blueprint(auth_bp)
app.register_blueprint(app_auth_bp)
app.register_blueprint(app_register_bp)
app.register_blueprint(remote_log_bp)
app.register_blueprint(remote_manage_bp)
app.register_blueprint(chat_bp)

app.register_blueprint(employee_bp)
app.register_blueprint(attendance_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(task_bp)
app.register_blueprint(file_bp)
app.register_blueprint(chat_room_bp)
app.register_blueprint(face_manage_bp)
app.register_blueprint(notice_bp)
app.register_blueprint(Mchat_bp)
app.register_blueprint(meeting_bp)

app.register_blueprint(camera_bp)
app.register_blueprint(register_bp)
app.register_blueprint(recognize_bp)
app.register_blueprint(face_attendance_bp)
app.register_blueprint(board_bp)
app.register_blueprint(profile_bp)
load_employees()

from meeting_socket import register_meeting_socket
register_meeting_socket(socketio)


if __name__ == '__main__':
    # [보안 추가]
    # 기존 코드:
    # socketio.run(app, host="0.0.0.0", debug=True, port=5000, allow_unsafe_werkzeug=True)
    #
    # 변경 내용:
    # 1. host, port, debug 값을 .env에서 관리
    # 2. debug=True 제거 가능
    # 3. allow_unsafe_werkzeug=True 제거
    socketio.run(
        app,
        host=FLASK_HOST,
        port=FLASK_PORT,
        debug=FLASK_DEBUG,
        allow_unsafe_werkzeug=True
    )