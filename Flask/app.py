from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # React(다른 포트)에서 오는 요청을 허용하기 위해 꼭 필요합니다!

@app.route('/')
def hello():
    return "Remote Work System Backend Running!"

if __name__ == '__main__':
    app.run(debug=True, port=5000)