from flask import Blueprint, request, jsonify, g
from werkzeug.security import check_password_hash, generate_password_hash

from db import get_conn
from security.auth_decorators import login_required


profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")


def ok(**kwargs):
    return jsonify({"success": True, **kwargs})


def fail(message, status=400):
    return jsonify({"success": False, "message": message}), status


def nullable_text(value):
    value = (value or "").strip()
    return value if value else None


@profile_bp.route("/me", methods=["GET"])
@login_required
def get_my_profile():
    employee_id = int(g.current_user.get("employee_id"))

    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    employee_id,
                    name,
                    email,
                    phone,
                    department,
                    position,
                    role,
                    is_active,
                    created_at
                FROM employees
                WHERE employee_id = %s
                LIMIT 1
                """,
                (employee_id,)
            )

            employee = cur.fetchone()

        if not employee:
            return fail("직원 정보를 찾을 수 없습니다.", 404)

        employee["id"] = employee["employee_id"]

        return ok(employee=employee)

    except Exception as e:
        return fail(str(e), 500)

    finally:
        if conn:
            conn.close()


@profile_bp.route("/me", methods=["PUT"])
@login_required
def update_my_profile():
    employee_id = int(g.current_user.get("employee_id"))
    data = request.get_json(silent=True) or {}

    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    phone = nullable_text(data.get("phone"))
    department = nullable_text(data.get("department"))
    position = nullable_text(data.get("position"))

    current_password = data.get("current_password") or ""
    new_password = data.get("new_password") or ""

    if not name:
        return fail("이름은 비워둘 수 없습니다.", 400)

    if not email:
        return fail("이메일은 비워둘 수 없습니다.", 400)

    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT employee_id, password_hash
                FROM employees
                WHERE employee_id = %s
                LIMIT 1
                """,
                (employee_id,)
            )

            employee = cur.fetchone()

            if not employee:
                return fail("직원 정보를 찾을 수 없습니다.", 404)

            cur.execute(
                """
                SELECT employee_id
                FROM employees
                WHERE email = %s
                  AND employee_id <> %s
                LIMIT 1
                """,
                (email, employee_id)
            )

            if cur.fetchone():
                return fail("이미 다른 사용자가 사용 중인 이메일입니다.", 409)

            update_fields = [
                "name = %s",
                "email = %s",
                "phone = %s",
                "department = %s",
                "position = %s"
            ]

            params = [
                name,
                email,
                phone,
                department,
                position
            ]

            if new_password:
                if len(new_password) < 4:
                    return fail("새 비밀번호는 4자 이상이어야 합니다.", 400)

                stored_hash = employee.get("password_hash")

                if not current_password:
                    return fail("비밀번호를 변경하려면 현재 비밀번호를 입력해야 합니다.", 400)

                if not stored_hash or not check_password_hash(stored_hash, current_password):
                    return fail("현재 비밀번호가 일치하지 않습니다.", 401)

                update_fields.append("password_hash = %s")
                params.append(generate_password_hash(new_password))

            params.append(employee_id)

            cur.execute(
                f"""
                UPDATE employees
                SET {", ".join(update_fields)}
                WHERE employee_id = %s
                """,
                tuple(params)
            )

            cur.execute(
                """
                SELECT
                    employee_id,
                    name,
                    email,
                    phone,
                    department,
                    position,
                    role,
                    is_active,
                    created_at
                FROM employees
                WHERE employee_id = %s
                LIMIT 1
                """,
                (employee_id,)
            )

            updated_employee = cur.fetchone()
            updated_employee["id"] = updated_employee["employee_id"]

        conn.commit()

        return ok(
            message="내 정보가 수정되었습니다.",
            employee=updated_employee
        )

    except Exception as e:
        if conn:
            conn.rollback()

        return fail(str(e), 500)

    finally:
        if conn:
            conn.close()