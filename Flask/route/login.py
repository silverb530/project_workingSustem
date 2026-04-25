from flask import Blueprint, request, jsonify
from db import execute_query
from werkzeug.security import check_password_hash

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/route/login", methods=["POST"])
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    user_id = (
        data.get("id")
        or data.get("employee_id")
        or data.get("employeeId")
        or data.get("username")
    )

    user_pw = (
        data.get("pw")
        or data.get("password")
    )

    if not user_id or not user_pw:
        return jsonify({
            "success": False,
            "result": "fail",
            "message": "아이디와 비밀번호를 입력하세요."
        }), 400

    sql = """
        SELECT
            employee_id,
            name,
            email,
            phone,
            department,
            position,
            role,
            password_hash,
            is_active
        FROM employees
        WHERE employee_id = %s
        LIMIT 1
    """

    users = execute_query(sql, (user_id,))

    if not users:
        return jsonify({
            "success": False,
            "result": "fail",
            "message": "아이디 또는 비밀번호가 틀렸습니다."
        }), 401

    user = users[0]

    if user.get("is_active") != 1:
        return jsonify({
            "success": False,
            "result": "fail",
            "message": "비활성화된 계정입니다."
        }), 403

    stored_hash = user.get("password_hash")

    if not stored_hash or not check_password_hash(stored_hash, user_pw):
        return jsonify({
            "success": False,
            "result": "fail",
            "message": "아이디 또는 비밀번호가 틀렸습니다."
        }), 401

    login_user = {
        "employee_id": user.get("employee_id"),
        "name": user.get("name"),
        "email": user.get("email"),
        "phone": user.get("phone"),
        "department": user.get("department"),
        "position": user.get("position"),
        "role": user.get("role")
    }

    return jsonify({
        "success": True,
        "result": "success",
        "message": "로그인 성공",
        "user": login_user
    })