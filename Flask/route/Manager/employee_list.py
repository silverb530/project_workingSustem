from flask import Blueprint, jsonify, request
from db import get_conn
from security.auth_decorators import login_required, role_required

employee_bp = Blueprint("employee", __name__)


@employee_bp.route("/api/employees", methods=["GET"])
@login_required
def get_employees():
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
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
                WHERE is_active = 1
                ORDER BY employee_id ASC
            """)

            rows = cur.fetchall()

        for row in rows:
            if row.get("created_at"):
                row["created_at"] = row["created_at"].strftime("%Y-%m-%d %H:%M")

        return jsonify({
            "success": True,
            "employees": rows
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "employees": []
        }), 500

    finally:
        if conn:
            conn.close()


@employee_bp.route("/api/employees/<int:employee_id>", methods=["PUT"])
@role_required("ADMIN")
def update_employee(employee_id):
    conn = None

    try:
        body = request.get_json(silent=True) or {}

        name = (body.get("name") or "").strip()
        email = (body.get("email") or "").strip()
        phone = (body.get("phone") or "").strip()
        department = (body.get("department") or "").strip()
        position = (body.get("position") or "").strip()
        role = (body.get("role") or "").strip().upper()
        is_active = int(body.get("is_active") if body.get("is_active") is not None else 1)

        if not name:
            return jsonify({
                "success": False,
                "message": "이름은 필수입니다."
            }), 400

        if role not in ("ADMIN", "MANAGER", "EMPLOYEE"):
            return jsonify({
                "success": False,
                "message": "유효하지 않은 권한입니다."
            }), 400

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                UPDATE employees
                SET
                    name = %s,
                    email = %s,
                    phone = %s,
                    department = %s,
                    position = %s,
                    role = %s,
                    is_active = %s
                WHERE employee_id = %s
            """, (
                name,
                email,
                phone,
                department,
                position,
                role,
                is_active,
                employee_id
            ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "직원 정보가 수정되었습니다."
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