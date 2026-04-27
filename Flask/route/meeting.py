from flask import Blueprint, request, jsonify
from db import get_conn

meeting_bp = Blueprint("meeting", __name__)

# DB에 아래 테이블이 없으면 먼저 생성 필요:
# CREATE TABLE IF NOT EXISTS meeting_rooms (
#   room_id   INT AUTO_INCREMENT PRIMARY KEY,
#   title     VARCHAR(200) NOT NULL,
#   host_id   INT NOT NULL,
#   scheduled_at DATETIME,
#   duration  VARCHAR(20) DEFAULT '30분',
#   status    ENUM('scheduled','live','ended') DEFAULT 'scheduled',
#   created_at DATETIME DEFAULT NOW()
# );


@meeting_bp.route("/api/meetings", methods=["GET"])
def get_meetings():
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    r.room_id,
                    r.title,
                    r.host_id,
                    e.name AS host_name,
                    DATE_FORMAT(r.scheduled_at, '%Y-%m-%dT%H:%i') AS scheduled_at,
                    r.duration,
                    r.status,
                    DATE_FORMAT(r.created_at, '%Y-%m-%d %H:%i') AS created_at
                FROM meeting_rooms r
                LEFT JOIN employees e ON r.host_id = e.employee_id
                WHERE r.status != 'ended'
                ORDER BY r.created_at DESC
            """)
            rows = cur.fetchall()
        return jsonify({"success": True, "meetings": rows})
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "meetings": []}), 500
    finally:
        if conn:
            conn.close()


@meeting_bp.route("/api/meetings", methods=["POST"])
def create_meeting():
    conn = None
    try:
        data = request.get_json(silent=True) or {}
        title = (data.get("title") or "").strip()
        host_id = data.get("host_id") or 1
        scheduled_at = data.get("scheduled_at") or None
        duration = data.get("duration") or "30분"

        if not title:
            return jsonify({"success": False, "message": "회의 제목을 입력하세요."}), 400

        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO meeting_rooms (title, host_id, scheduled_at, duration, status, created_at)
                   VALUES (%s, %s, %s, %s, 'scheduled', NOW())""",
                (title, host_id, scheduled_at or None, duration)
            )
            room_id = cur.lastrowid
        conn.commit()
        return jsonify({"success": True, "room_id": room_id})
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn:
            conn.close()


@meeting_bp.route("/api/meetings/<int:room_id>", methods=["DELETE"])
def delete_meeting(room_id):
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE meeting_rooms SET status = 'ended' WHERE room_id = %s",
                (room_id,)
            )
        conn.commit()
        return jsonify({"success": True})
    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500
    finally:
        if conn:
            conn.close()
