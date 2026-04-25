from flask import Flask, jsonify
from flask_cors import CORS
from route.login import auth_bp
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

from route.Manager.notice_routes import notice_bp #공지사항


app = Flask(__name__)

# [중요] 리액트(5173포트)와의 통신을 허용합니다.
CORS(app)

# 서버가 잘 돌아가는지 확인하는 기본 주소
@app.route('/')
def home():
    return jsonify({"status": "success", "message": "Flask Server is Online!"})

app.register_blueprint(auth_bp)
app.register_blueprint(app_auth_bp)
app.register_blueprint(remote_log_bp)
app.register_blueprint(remote_manage_bp)
app.register_blueprint(app_register_bp)
app.register_blueprint(chat_bp)

app.register_blueprint(employee_bp)
app.register_blueprint(attendance_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(task_bp)
app.register_blueprint(file_bp)
app.register_blueprint(chat_room_bp)

app.register_blueprint(notice_bp) # 공지사항 페이지 연결


app.register_blueprint(Mchat_bp) #매니져 채팅



if __name__ == '__main__':
    # 5000번 포트로 서버 실행
    app.run(host="0.0.0.0", debug=True, port=5000)