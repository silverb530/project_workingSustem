from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_conn, get_role_values
from datetime import datetime, date

auth_bp = Blueprint("auth", __name__)


def make_json_safe(data):
    if isinstance(data, dict):
        return {k: make_json_safe(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [make_json_safe(v) for v in data]
    elif isinstance(data, (datetime, date)):
        return data.strftime("%Y-%m-%d %H:%M:%S")
    else:
        return data


@auth_bp.route("/app/login", methods=["GET"])
def dbtest():
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("SELECT NOW() AS now_time")
            row = cur.fetchone()

        return jsonify({
            "success": True,
            "result": "success",
            "message": "DB 연결 성공",
            "time": str(row["now_time"])
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


@auth_bp.route("/register-options", methods=["GET"])
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


@auth_bp.route("/register", methods=["POST"])
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
                    created_at
                )
                VALUES
                (
                    %s, %s, %s, %s, %s, %s, %s, %s, 1, NOW()
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
                    password_hash
                )
            )

            new_id = cur.lastrowid

        conn.commit()

        return jsonify({
            "success": True,
            "result": "success",
            "message": "회원가입이 완료되었습니다.",
            "employee_id": new_id
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


@auth_bp.route("/login", methods=["POST"])
@auth_bp.route("/app/login", methods=["POST"])
def login():
    conn = None
    try:
        data = request.get_json(silent=True) or {}

        login_id = (
            data.get("id")
            or data.get("login_id")
            or data.get("email")
            or data.get("emp_code")
            or data.get("username")
            or ""
        ).strip()

        password = (
            data.get("pw")
            or data.get("password")
            or ""
        ).strip()

        if not login_id:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "이메일 또는 사번을 입력하세요."
            }), 400

        if not password:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "비밀번호를 입력하세요."
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
                WHERE employee_id = %s
                   OR email = %s
                   OR emp_code = %s
                LIMIT 1
                """,
                (login_id, login_id, login_id)
            )

            employee = cur.fetchone()

        if not employee:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "존재하지 않는 계정입니다."
            }), 404

        if employee.get("is_active") != 1:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "비활성화된 계정입니다."
            }), 403

        password_hash = employee.get("password_hash")

        if not password_hash:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "비밀번호 정보가 없는 계정입니다."
            }), 500

        if not check_password_hash(password_hash, password):
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "비밀번호가 올바르지 않습니다."
            }), 401

        employee.pop("password_hash", None)
        employee = make_json_safe(employee)

        return jsonify({
            "success": True,
            "result": "success",
            "message": "로그인 성공",
            "employee": employee,
            "user": employee
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