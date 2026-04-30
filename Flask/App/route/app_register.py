from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from db import get_conn, get_role_values
import json

app_register_bp = Blueprint("app_register", __name__)


def get_default_employee_role(roles):
    if "EMPLOYEE" in roles:
        return "EMPLOYEE"
    if "employee" in roles:
        return "employee"
    return "EMPLOYEE"


@app_register_bp.route("/register-options", methods=["GET"])
def register_options():
    conn = None
    try:
        conn = get_conn()
        roles = get_role_values(conn)

        if not roles:
            roles = ["EMPLOYEE", "MANAGER", "ADMIN"]

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


@app_register_bp.route("/check-duplicate", methods=["GET"])
@app_register_bp.route("/app/check-duplicate", methods=["GET"])
def check_duplicate():
    conn = None
    try:
        email = (request.args.get("email") or "").strip()

        if not email:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "이메일을 입력하세요."
            }), 400

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT employee_id
                FROM employees
                WHERE email = %s
                LIMIT 1
                """,
                (email,)
            )

            if cur.fetchone():
                return jsonify({
                    "success": False,
                    "result": "fail",
                    "message": "이미 사용 중인 이메일입니다."
                }), 409

        return jsonify({
            "success": True,
            "result": "success",
            "message": "사용 가능한 이메일입니다."
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "result": "fail",
            "message": str(e)
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

        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()
        phone = (data.get("phone") or "").strip()
        department = (data.get("department") or "").strip()
        position = (data.get("position") or "").strip()
        role = (data.get("role") or "").strip()
        password = (data.get("password") or data.get("pw") or "").strip()

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
        if not roles:
            roles = ["EMPLOYEE", "MANAGER", "ADMIN"]

        default_role = get_default_employee_role(roles)

        if request.path.startswith("/app/"):
            role = default_role
        else:
            if not role or role not in roles:
                role = default_role

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT employee_id
                FROM employees
                WHERE email = %s
                LIMIT 1
                """,
                (email,)
            )

            if cur.fetchone():
                return jsonify({
                    "success": False,
                    "result": "fail",
                    "message": "이미 사용 중인 이메일입니다."
                }), 409

            password_hash = generate_password_hash(password)

            cur.execute(
                """
                INSERT INTO employees
                (
                    name,
                    email,
                    phone,
                    department,
                    position,
                    role,
                    password_hash,
                    is_active,
                    created_at
                )
                VALUES
                (
                    %s, %s, %s, %s, %s, %s, %s, 1, NOW()
                )
                """,
                (
                    name,
                    email,
                    phone,
                    department,
                    position,
                    role,
                    password_hash
                )
            )

            new_id = cur.lastrowid

            qr_data = json.dumps({
                "type": "employee_access",
                "employee_id": new_id,
                "email": email,
                "name": name,
                "phone": phone,
                "department": department,
                "position": position,
                "role": role,
                "is_active": 1
            }, ensure_ascii=False)

            cur.execute(
                """
                UPDATE employees
                SET qr_data = %s
                WHERE employee_id = %s
                """,
                (qr_data, new_id)
            )

        conn.commit()

        return jsonify({
            "success": True,
            "result": "success",
            "message": "회원가입이 완료되었습니다.",
            "employee_id": new_id,
            "role": role,
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