from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)

# [중요] 리액트(5173포트)와의 통신을 허용합니다.
CORS(app)

# 서버가 잘 돌아가는지 확인하는 기본 주소
@app.route('/')
def home():
    return jsonify({"status": "success", "message": "Flask Server is Online!"})

# 리액트에서 로그인 버튼 눌렀을 때 응답할 주소
@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    print(f"리액트에서 보낸 데이터: {data}")
    
    # 지금은 테스트용으로 무조건 성공 반환
    return jsonify({
        "result": "success",
        "message": f"{data.get('id')}님, 연결 성공!",
        "user_name": "은비"
    })

if __name__ == '__main__':
    # 5000번 포트로 서버 실행
    app.run(debug=True, port=5000)