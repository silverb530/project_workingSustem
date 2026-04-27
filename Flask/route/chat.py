from flask import Blueprint, request, jsonify
from db import get_conn

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")


def ok(**kwargs):
    return jsonify({"success": True, **kwargs})


def fail(message, status=400):
    return jsonify({"success": False, "message": message}), status


@chat_bp.route("/employees/<int:employee_id>", methods=["GET"])
def get_employee(employee_id):
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
                    is_active
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
        employee["avatar"] = ""

        return ok(employee=employee)

    except Exception as e:
        return fail(str(e), 500)

    finally:
        if conn:
            conn.close()


@chat_bp.route("/members", methods=["GET"])
def get_members():
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    employee_id AS id,
                    employee_id,
                    name,
                    department,
                    position,
                    role,
                    '' AS avatar
                FROM employees
                WHERE IFNULL(is_active, 1) = 1
                ORDER BY employee_id ASC
                """
            )

            members = cur.fetchall()

        return ok(members=members)

    except Exception as e:
        return fail(str(e), 500)

    finally:
        if conn:
            conn.close()


@chat_bp.route("/rooms", methods=["GET"])
def get_rooms():
    employee_id = request.args.get("employee_id", type=int)

    if not employee_id:
        return fail("employee_id가 필요합니다.", 400)

    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT DISTINCT
                    r.room_id AS id,
                    r.room_id,
                    r.room_type,
                    r.room_name AS name,
                    r.room_name,
                    0 AS unread,
                    r.created_at
                FROM chat_rooms r
                INNER JOIN chat_room_members m
                    ON r.room_id = m.room_id
                WHERE m.employee_id = %s
                  AND IFNULL(r.deleted_id, 0) = 0
                ORDER BY r.created_at ASC, r.room_id ASC
                """,
                (employee_id,)
            )

            rooms = cur.fetchall()

        return ok(rooms=rooms)

    except Exception as e:
        return fail(str(e), 500)

    finally:
        if conn:
            conn.close()


@chat_bp.route("/rooms", methods=["POST"])
def create_room():
    data = request.get_json(silent=True) or {}

    room_type = (data.get("room_type") or "GROUP").upper()
    room_name = (data.get("room_name") or "").strip()
    creator_id = data.get("creator_id")
    member_ids = data.get("member_ids") or []

    if room_type not in ("DIRECT", "GROUP"):
        room_type = "GROUP"

    if not room_name:
        return fail("채팅방 이름이 필요합니다.", 400)

    if not creator_id:
        return fail("creator_id가 필요합니다.", 400)

    try:
        creator_id = int(creator_id)
        member_ids = [int(member_id) for member_id in member_ids]
    except Exception:
        return fail("member_ids는 직원 ID 숫자 목록이어야 합니다.", 400)

    member_ids = list(dict.fromkeys([creator_id, *member_ids]))

    if room_type == "DIRECT" and len(member_ids) != 2:
        return fail("개인 채팅방은 본인 포함 2명이어야 합니다.", 400)

    if room_type == "GROUP" and len(member_ids) < 3:
        return fail("단체 채팅방은 본인 포함 3명 이상이어야 합니다.", 400)

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

            for member_id in member_ids:
                cur.execute(
                    """
                    INSERT INTO chat_room_members (room_id, employee_id, joined_at)
                    VALUES (%s, %s, NOW())
                    """,
                    (room_id, member_id)
                )

        conn.commit()

        return ok(room={
            "id": room_id,
            "room_id": room_id,
            "name": room_name,
            "room_name": room_name,
            "room_type": room_type,
            "unread": 0,
        })

    except Exception as e:
        if conn:
            conn.rollback()

        return fail(str(e), 500)

    finally:
        if conn:
            conn.close()


@chat_bp.route("/rooms/<int:room_id>", methods=["DELETE"])
def delete_room(room_id):
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

            cur.execute(
                """
                UPDATE chat_messages
                SET is_deleted = 1
                WHERE room_id = %s
                """,
                (room_id,)
            )

        conn.commit()

        return ok(message="채팅방이 삭제되었습니다.")

    except Exception as e:
        if conn:
            conn.rollback()

        return fail(str(e), 500)

    finally:
        if conn:
            conn.close()


@chat_bp.route("/messages/<int:room_id>", methods=["GET"])
def get_messages(room_id):
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    cm.message_id AS id,
                    cm.message_id,
                    cm.room_id,
                    cm.sender_id,
                    e.name AS sender_name,
                    e.position AS sender_position,
                    '' AS sender_avatar,
                    cm.content,
                    DATE_FORMAT(cm.send_at, '%%p %%h:%%i') AS time,
                    DATE_FORMAT(cm.send_at, '%%Y-%%m-%%d %%H:%%i:%%s') AS send_at
                FROM chat_messages cm
                LEFT JOIN employees e
                    ON cm.sender_id = e.employee_id
                WHERE cm.room_id = %s
                  AND IFNULL(cm.is_deleted, 0) = 0
                ORDER BY cm.send_at ASC, cm.message_id ASC
                """,
                (room_id,)
            )

            messages = cur.fetchall()

        return ok(messages=messages)

    except Exception as e:
        return fail(str(e), 500)

    finally:
        if conn:
            conn.close()


@chat_bp.route("/messages", methods=["POST"])
def send_message():
    data = request.get_json(silent=True) or {}

    room_id = data.get("room_id")
    sender_id = data.get("sender_id")
    content = (data.get("content") or "").strip()

    if not room_id:
        return fail("room_id가 필요합니다.", 400)

    if not sender_id:
        return fail("sender_id가 필요합니다.", 400)

    if not content:
        return fail("메시지 내용이 비어 있습니다.", 400)

    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT 1
                FROM chat_room_members
                WHERE room_id = %s AND employee_id = %s
                LIMIT 1
                """,
                (room_id, sender_id)
            )

            if not cur.fetchone():
                return fail("이 채팅방의 멤버가 아니므로 메시지를 보낼 수 없습니다.", 403)

            cur.execute(
                """
                INSERT INTO chat_messages (room_id, sender_id, content, is_deleted, send_at)
                VALUES (%s, %s, %s, 0, NOW())
                """,
                (room_id, sender_id, content)
            )

            message_id = cur.lastrowid

        conn.commit()

        return ok(message_id=message_id)

    except Exception as e:
        if conn:
            conn.rollback()

        return fail(str(e), 500)

    finally:
        if conn:
            conn.close()


@chat_bp.route("/messages/<int:message_id>", methods=["DELETE"])
def delete_message(message_id):
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

        conn.commit()

        return ok(message="메시지가 삭제되었습니다.")

    except Exception as e:
        if conn:
            conn.rollback()

        return fail(str(e), 500)

    finally:
        if conn:
            conn.close()