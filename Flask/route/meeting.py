from flask import Blueprint, request, jsonify
from db import get_conn

meeting_bp = Blueprint("meeting", __name__)

# 아래 테이블이 없으면 먼저 생성:
# CREATE TABLE IF NOT EXISTS meeting_rooms (
#   room_id      INT AUTO_INCREMENT PRIMARY KEY,
#   title        VARCHAR(200) NOT NULL,
#   host_id      INT NOT NULL,
#   scheduled_at DATETIME,
#   duration     VARCHAR(20) DEFAULT '30분',
#   status       ENUM('scheduled','live','ended') DEFAULT 'scheduled',
#   created_at   DATETIME DEFAULT NOW()
# );
#
# CREATE TABLE IF NOT EXISTS meeting_invites (
#   id          INT AUTO_INCREMENT PRIMARY KEY,
#   room_id     INT NOT NULL,
#   employee_id INT NOT NULL,
#   UNIQUE KEY uq_room_employee (room_id, employee_id)
# );


@meeting_bp.route("/api/meetings/employees", methods=["GET"])
def get_meeting_employees():
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT employee_id, name, department, position
                FROM employees
                WHERE is_active = 1 AND role != 'ADMIN'
                ORDER BY name ASC
            """)
            rows = cur.fetchall()
        return jsonify({"success": True, "employees": rows})
    except Exception as e:
        return jsonify({"success": False, "message": str(e), "employees": []}), 500
    finally:
        if conn:
            conn.close()


@meeting_bp.route("/api/meetings", methods=["GET"])
def get_meetings():
    user_id = request.args.get("user_id", type=int)
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            if user_id:
                cur.execute("""
                    SELECT
                        r.room_id,
                        r.title,
                        r.host_id,
                        e.name AS host_name,
                        DATE_FORMAT(r.scheduled_at, '%%Y-%%m-%%dT%%H:%%i') AS scheduled_at,
                        r.duration,
                        r.status,
                        DATE_FORMAT(r.created_at, '%%Y-%%m-%%d %%H:%%i') AS created_at
                    FROM meeting_rooms r
                    LEFT JOIN employees e ON r.host_id = e.employee_id
                    WHERE r.status != 'ended'
                      AND (
                        r.host_id = %s
                        OR EXISTS (
                            SELECT 1 FROM meeting_invites mi
                            WHERE mi.room_id = r.room_id AND mi.employee_id = %s
                        )
                      )
                    ORDER BY r.created_at DESC
                """, (user_id, user_id))
            else:
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
        title        = (data.get("title") or "").strip()
        host_id      = data.get("host_id") or 1
        scheduled_at = data.get("scheduled_at") or None
        duration     = data.get("duration") or "30분"
        invited_ids  = data.get("invited_ids") or []

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

            for emp_id in invited_ids:
                if emp_id != host_id:
                    cur.execute(
                        "INSERT IGNORE INTO meeting_invites (room_id, employee_id) VALUES (%s, %s)",
                        (room_id, emp_id)
                    )
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

            # 화상회의 알림 조회 api
            @meeting_bp.route("/api/meetings/notifications/<int:employee_id>", methods=["GET"])
            def get_meeting_notifications(employee_id):
                conn = None

                try:
                    conn = get_conn()

                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            SELECT
                                r.room_id,
                                r.title,
                                r.host_id,
                                e.name AS host_name,
                                DATE_FORMAT(r.scheduled_at, '%%Y-%%m-%%d %%H:%%i') AS scheduled_at,
                                DATE_FORMAT(r.created_at, '%%Y-%%m-%%d %%H:%%i') AS created_at,
                                DATE_FORMAT(r.created_at, '%%m/%%d %%H:%%i') AS time
                            FROM meeting_rooms r
                            INNER JOIN meeting_invites mi
                                ON r.room_id = mi.room_id
                            LEFT JOIN employees e
                                ON r.host_id = e.employee_id
                            WHERE mi.employee_id = %s
                              AND r.status != 'ended'
                            ORDER BY r.created_at DESC
                            LIMIT 20
                            """,
                            (employee_id,)
                        )

                        rows = cur.fetchall()

                    notifications = []

                    for row in rows:
                        host_name = row.get("host_name") or "관리자"
                        title = row.get("title") or "화상회의"

                        notifications.append({
                            "id": f"meeting-{row.get('room_id')}",
                            "type": "MEETING_INVITE",
                            "section": "meetings",
                            "room_id": row.get("room_id"),
                            "text": f"{host_name}님이 '{title}' 회의에 초대했습니다.",
                            "time": row.get("time"),
                            "created_at": row.get("created_at"),
                            "read": False
                        })

                    return jsonify({
                        "success": True,
                        "notifications": notifications
                    })

                except Exception as e:
                    print("화상회의 알림 조회 오류:", e)
                    return jsonify({
                        "success": False,
                        "message": str(e),
                        "notifications": []
                    }), 500

                finally:
                    if conn:
                        conn.close()
