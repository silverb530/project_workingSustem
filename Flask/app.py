from flask import Flask, jsonify, request
from flask_cors import CORS
from route.login import auth_bp
from App.route.app_login import app_auth_bp
from route.remoteLog import remote_log_bp

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

if __name__ == '__main__':
    # 5000번 포트로 서버 실행
    app.run(host="0.0.0.0", debug=True, port=5000)