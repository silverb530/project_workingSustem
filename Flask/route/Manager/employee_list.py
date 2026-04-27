from flask import Blueprint, jsonify
from db import get_conn

# [보안 추가] JWT 토큰이 있는 로그인 사용자만 직원 목록 조회 가능
from security.auth_decorators import login_required

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