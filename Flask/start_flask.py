from flask import Flask
from flask_cors import CORS
from auth_routes import auth_bp  # 승민 추가
from api_routes import api_bp
from log_db import init_db

app = Flask(__name__)
CORS(app)  # React(다른 포트)에서 오는 요청을 허용하기 위해 꼭 필요합니다!

@app.route('/')
def hello():
    return "Remote Work System Backend Running!"

app.register_blueprint(auth_bp)  # 승민 추가
app.register_blueprint(api_bp)

if __name__ == '__main__':
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)