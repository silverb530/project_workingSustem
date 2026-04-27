from flask import Blueprint, jsonify
from db import get_conn

# [보안 추가] JWT 토큰이 있는 로그인 사용자만 대시보드 조회 가능
from security.auth_decorators import login_required

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/api/dashboard", methods=["GET"])
@login_required
def get_dashboard():
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                SELECT COUNT(*) AS online_users
                FROM employees
                WHERE is_active = 1
            """)
            online_row = cur.fetchone()

            cur.execute("""
                SELECT COUNT(*) AS today_tasks
                FROM tasks
                WHERE DATE(created_at) = CURDATE()
            """)
            task_row = cur.fetchone()

        return jsonify({
            "success": True,
            "today_tasks": task_row["today_tasks"] if task_row else 0,
            "online_users": online_row["online_users"] if online_row else 0,
            "urgent_alerts": 0,
            "devices": {
                "camera": "idle"
            }
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "today_tasks": 0,
            "online_users": 0,
            "urgent_alerts": 0,
            "devices": {
                "camera": "idle"
            }
        }), 500

    finally:
        if conn:
            conn.close()