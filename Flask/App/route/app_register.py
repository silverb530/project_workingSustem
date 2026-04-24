from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from db import get_conn, get_role_values
import json

app_register_bp = Blueprint("app_register", __name__)


@app_register_bp.route("/register-options", methods=["GET"])
def register_options():
    conn = None
    try:
        conn = get_conn()
        roles = get_role_values(conn)

        if not roles:
            roles = ["employee", "manager", "admin"]

        return jsonify({
            "success": True,
            "result": "success",
            "roles": roles
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "result": "fail",
            "message": str(e),
            "roles": []
        }), 500

    finally:
        if conn:
            conn.close()


@app_register_bp.route("/register", methods=["POST"])
@app_register_bp.route("/app/register", methods=["POST"])
def register():
    conn = None
    try:
        data = request.get_json(silent=True) or {}

        emp_code = (data.get("emp_code") or data.get("employeeCode") or data.get("id") or "").strip()
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()
        phone = (data.get("phone") or "").strip()
        department = (data.get("department") or "").strip()
        position = (data.get("position") or "").strip()
        role = (data.get("role") or "").strip()
        password = (data.get("password") or data.get("pw") or "").strip()

        if not emp_code:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "사번을 입력하세요."
            }), 400

        if not name:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "이름을 입력하세요."
            }), 400

        if not email:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "이메일을 입력하세요."
            }), 400

        if not password:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "비밀번호를 입력하세요."
            }), 400

        conn = get_conn()

        roles = get_role_values(conn)
        if roles:
            if role not in roles:
                role = roles[0]
        else:
            if not role:
                role = "employee"

        qr_data = json.dumps({
            "type": "employee_access",
            "emp_code": emp_code
        }, ensure_ascii=False)

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT employee_id
                FROM employees
                WHERE emp_code = %s OR email = %s
                LIMIT 1
                """,
                (emp_code, email)
            )
            exists = cur.fetchone()

            if exists:
                return jsonify({
                    "success": False,
                    "result": "fail",
                    "message": "이미 사용 중인 사번 또는 이메일입니다."
                }), 409

            password_hash = generate_password_hash(password)

            cur.execute(
                """
                INSERT INTO employees
                (
                    emp_code,
                    name,
                    email,
                    phone,
                    department,
                    position,
                    role,
                    password_hash,
                    is_active,
                    created_at,
                    qr_data
                )
                VALUES
                (
                    %s, %s, %s, %s, %s, %s, %s, %s, 1, NOW(), %s
                )
                """,
                (
                    emp_code,
                    name,
                    email,
                    phone,
                    department,
                    position,
                    role,
                    password_hash,
                    qr_data
                )
            )

            new_id = cur.lastrowid

        conn.commit()

        return jsonify({
            "success": True,
            "result": "success",
            "message": "회원가입이 완료되었습니다.",
            "employee_id": new_id,
            "qr_data": qr_data
        })

    except Exception as e:
        if conn:
            conn.rollback()

        return jsonify({
            "success": False,
            "result": "fail",
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()