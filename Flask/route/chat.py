from flask import Blueprint, request, jsonify
from db import get_conn
from datetime import datetime, date
from db import execute_query

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")


def json_safe(value):
    if isinstance(value, dict):
        return {k: json_safe(v) for k, v in value.items()}
    if isinstance(value, list):
        return [json_safe(v) for v in value]
    if isinstance(value, (datetime, date)):
        return value.strftime("%Y-%m-%d %H:%M:%S")
    return value


@chat_bp.route("/members", methods=["GET"])
def get_members():
    """추가: 채팅방 초대용 팀원 목록 조회"""
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    employee_id AS id,
                    name,
                    COALESCE(position, role, department, '') AS role,
                    '' AS avatar
                FROM employees
                WHERE COALESCE(is_active, 1) = 1
                ORDER BY employee_id
                """
            )
            members = cur.fetchall()

        return jsonify({"success": True, "members": json_safe(members)})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if conn:
            conn.close()


@chat_bp.route("/rooms", methods=["GET"])
def get_rooms():
    """추가: 사용자가 참여 중이고 deleted_id=0인 채팅방 목록 조회"""
    employee_id = request.args.get("employee_id")

    if not employee_id:
        return jsonify({"success": False, "message": "employee_id가 필요합니다."}), 400

    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    r.room_id AS id,
                    r.room_name AS name,
                    r.room_type AS type,
                    r.created_at,
                    COUNT(m.member_id) AS member_count
                FROM chat_rooms r
                INNER JOIN chat_room_members my
                    ON my.room_id = r.room_id
                   AND my.employee_id = %s
                LEFT JOIN chat_room_members m
                    ON m.room_id = r.room_id
                WHERE r.deleted_id = 0
                GROUP BY r.room_id, r.room_name, r.room_type, r.created_at
                ORDER BY r.created_at ASC, r.room_id ASC
                """,
                (employee_id,)
            )
            rooms = cur.fetchall()

        return jsonify({"success": True, "rooms": json_safe(rooms)})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if conn:
            conn.close()


@chat_bp.route("/rooms", methods=["POST"])
def create_room():
    """추가: chat_rooms INSERT 후, 자기 자신 포함 member_ids를 chat_room_members에 INSERT"""
    data = request.get_json(silent=True) or {}

    room_type = (data.get("room_type") or "GROUP").upper()
    room_name = (data.get("room_name") or "").strip()
    member_ids = data.get("member_ids") or []
    creator_id = data.get("creator_id")

    if room_type not in ("DIRECT", "GROUP"):
        return jsonify({"success": False, "message": "room_type은 DIRECT 또는 GROUP이어야 합니다."}), 400

    if not room_name:
        if room_type == "DIRECT":
            room_name == "개인 채팅"
        return jsonify({"success": False, "message": "room_name이 필요합니다."}), 400

    if creator_id and int(creator_id) not in [int(x) for x in member_ids]:
        member_ids.append(creator_id)

    member_ids = list(dict.fromkeys([int(x) for x in member_ids]))

    if room_type == "DIRECT" and len(member_ids) != 2:
        return jsonify({"success": False, "message": "개인 채팅방은 본인 포함 2명이어야 합니다."}), 400

    if room_type == "GROUP" and len(member_ids) < 3:
        return jsonify({"success": False, "message": "단체 채팅방은 본인 포함 3명 이상이어야 합니다."}), 400

    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO chat_rooms (room_type, room_name, deleted_id, created_at)
                VALUES (%s, %s, 0, NOW())
                """,
                (room_type, room_name)
            )
            room_id = cur.lastrowid

            for employee_id in member_ids:
                cur.execute(
                    """
                    INSERT INTO chat_room_members (room_id, employee_id, joined_at)
                    VALUES (%s, %s, NOW())
                    """,
                    (room_id, employee_id)
                )

            # 선택 사항: 방 생성 안내 메시지 저장
            if creator_id:
                cur.execute(
                    """
                    INSERT INTO chat_messages (room_id, sender_id, content, is_deleted, send_at)
                    VALUES (%s, %s, %s, 0, NOW())
                    """,
                    (room_id, str(creator_id), "채팅방이 생성되었습니다.")
                )

        conn.commit()

        return jsonify({
            "success": True,
            "room": {
                "id": room_id,
                "name": room_name,
                "type": room_type,
                "member_ids": member_ids
            }
        })

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if conn:
            conn.close()


@chat_bp.route("/rooms/<int:room_id>", methods=["DELETE"])
def delete_room(room_id):
    """추가: 채팅방 삭제는 실제 DELETE가 아니라 chat_rooms.deleted_id = 1"""
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE chat_rooms
                SET deleted_id = 1
                WHERE room_id = %s
                """,
                (room_id,)
            )
            affected = cur.rowcount

        conn.commit()
        return jsonify({"success": True, "affected": affected})

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if conn:
            conn.close()


@chat_bp.route("/messages/<int:room_id>", methods=["GET"])
def get_messages(room_id):
    """추가: is_deleted=0인 메시지만 조회"""
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    msg.message_id AS id,
                    msg.room_id,
                    msg.sender_id,
                    COALESCE(emp.name, msg.sender_id) AS sender_name,
                    '' AS sender_avatar,
                    msg.content,
                    msg.send_at,
                    DATE_FORMAT(msg.send_at, '%%p %%h:%%i') AS time
                FROM chat_messages msg
                LEFT JOIN employees emp
                    ON emp.employee_id = msg.sender_id 
                WHERE msg.room_id = %s
                  AND msg.is_deleted = 0
                ORDER BY msg.send_at ASC, msg.message_id ASC
                """,
                (room_id,)
            )
            messages = cur.fetchall()

        return jsonify({"success": True, "messages": json_safe(messages)})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if conn:
            conn.close()


@chat_bp.route("/messages", methods=["POST"])
def create_message():
    """추가: 메시지 전송 시 chat_messages INSERT"""
    data = request.get_json(silent=True) or {}

    room_id = data.get("room_id")
    sender_id = data.get("sender_id")
    content = (data.get("content") or "").strip()

    if not room_id:
        return jsonify({"success": False, "message": "room_id가 필요합니다."}), 400

    if not sender_id:
        return jsonify({"success": False, "message": "sender_id가 필요합니다."}), 400

    if not content:
        return jsonify({"success": False, "message": "content가 필요합니다."}), 400

    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO chat_messages (room_id, sender_id, content, is_deleted, send_at)
                VALUES (%s, %s, %s, 0, NOW())
                """,
                (room_id, str(sender_id), content)
            )
            message_id = cur.lastrowid

        conn.commit()
        return jsonify({"success": True, "message_id": message_id})

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if conn:
            conn.close()


@chat_bp.route("/messages/<int:message_id>", methods=["DELETE"])
def delete_message(message_id):
    """추가: 메시지 삭제는 실제 DELETE가 아니라 chat_messages.is_deleted = 1"""
    conn = None
    try:
        conn = get_conn()
        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE chat_messages
                SET is_deleted = 1
                WHERE message_id = %s
                """,
                (message_id,)
            )
            affected = cur.rowcount

        conn.commit()
        return jsonify({"success": True, "affected": affected})

    except Exception as e:
        if conn:
            conn.rollback()
        return jsonify({"success": False, "message": str(e)}), 500

    finally:
        if conn:
            conn.close()


"""추가: 사용자 조회함"""
@chat_bp.route("/employees/<int:employee_id>", methods=["GET"])
def get_employee(employee_id):
    sql = """
        SELECT employee_id, name, position
        FROM employees
        WHERE employee_id = %s
          AND is_active = 1
    """
    rows = execute_query(sql, (employee_id,), fetch=True)

    if not rows:
        return jsonify({"success": False, "message": "사용자를 찾을 수 없습니다."}), 404

    return jsonify({
        "success": True,
        "employee": rows[0]
    })