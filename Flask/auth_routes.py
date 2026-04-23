from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_conn, get_role_values

auth_bp = Blueprint("auth", __name__)

@auth_bp.route("/dbtest", methods=["GET"])
def dbtest():
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT NOW() AS now_time")
            row = cur.fetchone()
        return jsonify({
            "success": True,
            "time": str(row["now_time"])
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route("/register-options", methods=["GET"])
def register_options():
    conn = None
    try:
        conn = get_conn()
        roles = get_role_values(conn)
        return jsonify({
            "success": True,
            "roles": roles
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "roles": []
        }), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route("/register", methods=["POST"])
def register():
    conn = None
    try:
        data = request.get_json(silent=True) or {}

        emp_code = (data.get("emp_code") or "").strip()
        name = (data.get("name") or "").strip()
        email = (data.get("email") or "").strip()
        phone = (data.get("phone") or "").strip()
        department = (data.get("department") or "").strip()
        position = (data.get("position") or "").strip()
        password = (data.get("password") or "").strip()
        role = (data.get("role") or "").strip()

        if not emp_code or not name or not email or not password:
            return jsonify({
                "success": False,
                "message": "사번, 이름, 이메일, 비밀번호는 필수입니다."
            }), 400

        conn = get_conn()
        roles = get_role_values(conn)
        if roles:
            if role not in roles:
                role = roles[0]
        elif not role:
            role = "employee"

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
                    "message": "이미 사용 중인 사번 또는 이메일입니다."
                }), 409

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
                    created_at
                )
                VALUES
                (
                    %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW()
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
                    generate_password_hash(password),
                    1
                )
            )
            new_id = cur.lastrowid

        conn.commit()

        return jsonify({
            "success": True,
            "message": "회원가입이 완료되었습니다.",
            "employee_id": new_id
        })
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route("/login", methods=["POST"])
def login():
    conn = None
    try:
        data = request.get_json(silent=True) or {}

        login_id = (data.get("login_id") or "").strip()
        password = (data.get("password") or "").strip()

        if not login_id or not password:
            return jsonify({
                "success": False,
                "message": "이메일 또는 사번, 비밀번호를 입력하세요."
            }), 400

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    employee_id,
                    emp_code,
                    name,
                    email,
                    phone,
                    department,
                    position,
                    role,
                    password_hash,
                    is_active,
                    created_at
                FROM employees
                WHERE email = %s OR emp_code = %s
                LIMIT 1
                """,
                (login_id, login_id)
            )
            employee = cur.fetchone()

        if not employee:
            return jsonify({
                "success": False,
                "message": "존재하지 않는 계정입니다."
            }), 404

        if not employee["is_active"]:
            return jsonify({
                "success": False,
                "message": "비활성화된 계정입니다."
            }), 403

        if not check_password_hash(employee["password_hash"], password):
            return jsonify({
                "success": False,
                "message": "비밀번호가 올바르지 않습니다."
            }), 401

        employee.pop("password_hash", None)

        return jsonify({
            "success": True,
            "message": "로그인 성공",
            "employee": employee
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500
    finally:
        if conn:
            conn.close()



