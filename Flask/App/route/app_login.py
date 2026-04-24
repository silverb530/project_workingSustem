from flask import Blueprint, request, jsonify
from db import execute_query
from werkzeug.security import check_password_hash
from datetime import datetime, date

app_auth_bp = Blueprint("app_auth", __name__)


def make_json_safe(data):
    if isinstance(data, dict):
        return {k: make_json_safe(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [make_json_safe(v) for v in data]
    elif isinstance(data, (datetime, date)):
        return data.strftime("%Y-%m-%d %H:%M:%S")
    else:
        return data


@app_auth_bp.route("/app/login", methods=["POST"])
def app_login():
    try:
        data = request.get_json(silent=True) or {}

        user_id = (
            data.get("id")
            or data.get("login_id")
            or data.get("email")
            or data.get("employee_id")
            or ""
        ).strip()

        user_pw = (
            data.get("pw")
            or data.get("password")
            or ""
        ).strip()

        if not user_id or not user_pw:
            return jsonify({
                "result": "fail",
                "success": False,
                "message": "아이디와 비밀번호를 입력하세요."
            }), 400

        if user_id.isdigit():
            sql = """
                SELECT *
                FROM employees
                WHERE employee_id = %s
                LIMIT 1
            """
            user = execute_query(sql, (int(user_id),))
        else:
            sql = """
                SELECT *
                FROM employees
                WHERE email = %s
                LIMIT 1
            """
            user = execute_query(sql, (user_id,))

        if not user:
            return jsonify({
                "result": "fail",
                "success": False,
                "message": "아이디 또는 비밀번호가 틀렸습니다."
            }), 401

        employee = user[0]
        stored_hash = employee.get("password_hash")

        if not stored_hash:
            return jsonify({
                "result": "fail",
                "success": False,
                "message": "비밀번호 정보가 없습니다."
            }), 500

        if not check_password_hash(stored_hash, user_pw):
            return jsonify({
                "result": "fail",
                "success": False,
                "message": "아이디 또는 비밀번호가 틀렸습니다."
            }), 401

        employee.pop("password_hash", None)

        if "employee_id" in employee:
            employee["employee_id"] = str(employee["employee_id"])

        if not employee.get("qr_data"):
            employee["qr_data"] = f'{{"type":"employee_access","employee_id":"{employee.get("employee_id", "")}"}}'

        employee = make_json_safe(employee)

        return jsonify({
            "result": "success",
            "success": True,
            "message": "로그인 성공",
            "user": employee,
            "employee": employee
        }), 200

    except Exception as e:
        print("❌ DB 에러 발생:", e)
        return jsonify({
            "result": "fail",
            "success": False,
            "message": str(e)
        }), 500