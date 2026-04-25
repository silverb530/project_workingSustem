from flask import Blueprint, jsonify
from db import get_conn

employee_bp = Blueprint("employee", __name__)


@employee_bp.route("/api/employees", methods=["GET"])
def get_employees():
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    employee_id,
                    name,
                    department,
                    position
                FROM employees
                WHERE is_active = 1
                ORDER BY employee_id ASC
            """)

            rows = cur.fetchall()

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