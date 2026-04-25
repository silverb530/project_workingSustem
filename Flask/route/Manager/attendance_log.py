from flask import Blueprint, jsonify
from db import get_conn

attendance_bp = Blueprint("attendance", __name__)


@attendance_bp.route("/api/attendance", methods=["GET"])
def get_attendance_logs():
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    a.attendance_id,
                    a.employee_id,
                    e.name AS employee_name,
                    DATE_FORMAT(a.work_date, '%Y-%m-%d') AS work_date,
                    DATE_FORMAT(a.check_in_time, '%H:%i:%s') AS check_in_time,
                    DATE_FORMAT(a.check_out_time, '%H:%i:%s') AS check_out_time,
                    a.check_in_method,
                    a.check_out_method,
                    a.status,
                    a.note,
                    DATE_FORMAT(a.created_at, '%Y-%m-%d %H:%i:%s') AS created_at
                FROM attendance a
                LEFT JOIN employees e
                    ON a.employee_id = e.employee_id
                ORDER BY a.work_date DESC, a.check_in_time DESC
            """)

            rows = cur.fetchall()

        return jsonify({
            "success": True,
            "attendance": rows
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "attendance": []
        }), 500

    finally:
        if conn:
            conn.close()