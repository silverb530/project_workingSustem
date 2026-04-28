from flask import Blueprint, jsonify
from db import get_conn
from security.auth_decorators import login_required

face_manage_bp = Blueprint("face_manage", __name__)


@face_manage_bp.route("/api/employees/unregistered-face", methods=["GET"])
@login_required
def get_unregistered_face_employees():
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    e.employee_id,
                    e.name,
                    e.department,
                    e.position,
                    e.email
                FROM employees e
                LEFT JOIN employee_faces ef
                    ON e.employee_id = ef.employee_id AND ef.is_active = 1
                WHERE e.is_active = 1 AND ef.face_id IS NULL
                ORDER BY e.department, e.name
            """)
            rows = cur.fetchall()
        return jsonify({"success": True, "employees": rows})
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "employees": []}), 500
    finally:
        if conn:
            conn.close()
