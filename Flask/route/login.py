from flask import Blueprint, request, jsonify
from db import execute_query
from werkzeug.security import check_password_hash

auth_bp = Blueprint("auth", __name__)

@auth_bp.route('/route/login', methods=['POST'])
def login():

    data = request.json  # 리액트가 보낸 { "id": "...", "pw": "..." } 받기
    user_id = data.get('id')
    user_pw = data.get('pw')

    # 1. DB에서 해당 아이디와 비번이 일치하는 직원이 있는지 확인
    sql = "SELECT * FROM employees WHERE employee_id = %s "
    user = execute_query(sql, (user_id,))

    if user:
        stored_hash = user[0]['password_hash']

        # 로그인 성공: 사용자 정보를 리액트로 돌려줌
        if check_password_hash(stored_hash, user_pw):
            print(user[0])
            return jsonify({
                "result": "success",
                "user": user[0]  # 첫 번째 검색 결과 전달
            })
    else:
        
        # 로그인 실패
        return jsonify({
            "result": "fail", 
            "message": "아이디 또는 비밀번호가 틀렸습니다."
        }), 401
    