from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from db import get_conn
import os
import time

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "chat_files")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_CHAT_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".gif", ".webp",
    ".mp4", ".webm", ".mov", ".avi"
}


def is_allowed_chat_file(filename):
    ext = os.path.splitext(filename or "")[1].lower()
    return ext in ALLOWED_CHAT_EXTENSIONS


def make_chat_file_url(message_id):
    return f"/api/chat/files/{message_id}"


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
                    cm.message_id,
                    cm.room_id,
                    cm.sender_id,
                    e.name AS sender_name,
                    e.position AS sender_position,
                    '' AS sender_avatar,
                    cm.content,
                    cm.message_type,
                    cm.file_name,
                    cm.file_path,
                    cm.file_size,
                    cm.mime_type,
                    cm.is_notice,
                    DATE_FORMAT(cm.send_at, '%%p %%h:%%i') AS time,
                    cm.send_at
                FROM chat_messages cm
                LEFT JOIN employees e
                    ON cm.sender_id = e.employee_id
                WHERE cm.room_id = %s
                  AND IFNULL(cm.is_deleted, 0) = 0
                ORDER BY cm.message_id ASC
                """,
                (room_id,)
            )

            messages = cur.fetchall()

        for message in messages:
            if message.get("message_type") == "FILE":
                message["file_url"] = make_chat_file_url(message["message_id"])
            else:
                message["file_url"] = None

        return jsonify({
            "success": True,
            "messages": messages
        })

    except Exception as e:
        print("메시지 조회 오류:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

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

#공지 등록 api
@chat_bp.route("/rooms/<int:room_id>/notice", methods=["POST"])
def register_room_notice(room_id):
    data = request.get_json(silent=True) or {}

    message_id = data.get("message_id")

    if not message_id:
        return jsonify({
            "success": False,
            "message": "message_id가 필요합니다."
        }), 400

    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            # 1. 해당 메시지가 이 방에 실제 존재하는지 확인
            cur.execute(
                """
                SELECT message_id
                FROM chat_messages
                WHERE room_id = %s
                  AND message_id = %s
                  AND IFNULL(is_deleted, 0) = 0
                LIMIT 1
                """,
                (room_id, message_id)
            )

            if not cur.fetchone():
                return jsonify({
                    "success": False,
                    "message": "공지로 등록할 메시지를 찾을 수 없습니다."
                }), 404

            # 2. 같은 방의 기존 공지를 전부 내림
            cur.execute(
                """
                UPDATE chat_messages
                SET is_notice = 0
                WHERE room_id = %s
                """,
                (room_id,)
            )

            # 3. 선택한 메시지만 공지로 등록
            cur.execute(
                """
                UPDATE chat_messages
                SET is_notice = 1
                WHERE room_id = %s
                  AND message_id = %s
                """,
                (room_id, message_id)
            )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "공지로 등록되었습니다."
        })

    except Exception as e:
        if conn:
            conn.rollback()

        print("공지 등록 오류:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


#공지 조회 api
@chat_bp.route("/rooms/<int:room_id>/notice", methods=["GET"])
def get_room_notice(room_id):
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    cm.message_id,
                    cm.room_id,
                    cm.sender_id,
                    e.name AS sender_name,
                    e.position AS sender_position,
                    cm.content,
                    cm.is_notice
                FROM chat_messages cm
                LEFT JOIN employees e
                    ON cm.sender_id = e.employee_id
                WHERE cm.room_id = %s
                  AND cm.is_notice = 1
                  AND IFNULL(cm.is_deleted, 0) = 0
                ORDER BY cm.message_id DESC
                LIMIT 1
                """,
                (room_id,)
            )

            notice = cur.fetchone()

        return jsonify({
            "success": True,
            "notice": notice
        })

    except Exception as e:
        print("공지 조회 오류:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


#공지 해제 api
@chat_bp.route("/rooms/<int:room_id>/notice", methods=["DELETE"])
def clear_room_notice(room_id):
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE chat_messages
                SET is_notice = 0
                WHERE room_id = %s
                """,
                (room_id,)
            )

        conn.commit()

        return jsonify({
            "success": True,
            "message": "공지 등록이 해제되었습니다."
        })

    except Exception as e:
        if conn:
            conn.rollback()

        print("공지 내리기 오류:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()

#파일 업로드 api
@chat_bp.route("/files", methods=["POST"])
def upload_chat_file():
    conn = None

    try:
        room_id = request.form.get("room_id", type=int)
        sender_id = request.form.get("sender_id", type=int)

        if not room_id:
            return jsonify({"success": False, "message": "room_id가 필요합니다."}), 400

        if not sender_id:
            return jsonify({"success": False, "message": "sender_id가 필요합니다."}), 400

        if "file" not in request.files:
            return jsonify({"success": False, "message": "업로드할 파일이 없습니다."}), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({"success": False, "message": "파일명이 비어 있습니다."}), 400

        if not is_allowed_chat_file(file.filename):
            return jsonify({
                "success": False,
                "message": "사진 또는 동영상 파일만 업로드할 수 있습니다."
            }), 400

        original_name = file.filename
        safe_name = secure_filename(original_name)

        if not safe_name:
            safe_name = f"chat_file_{int(time.time())}"

        saved_name = f"{int(time.time())}_{sender_id}_{safe_name}"
        save_path = os.path.join(UPLOAD_DIR, saved_name)

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT 1
                FROM chat_room_members
                WHERE room_id = %s
                  AND employee_id = %s
                LIMIT 1
                """,
                (room_id, sender_id)
            )

            if not cur.fetchone():
                return jsonify({
                    "success": False,
                    "message": "이 채팅방의 멤버가 아니므로 파일을 보낼 수 없습니다."
                }), 403

        file.save(save_path)

        file_size = os.path.getsize(save_path)
        mime_type = file.mimetype or "application/octet-stream"

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO chat_messages (
                    room_id,
                    sender_id,
                    content,
                    message_type,
                    file_name,
                    file_path,
                    file_size,
                    mime_type,
                    is_deleted,
                    is_notice,
                    send_at
                )
                VALUES (%s, %s, %s, 'FILE', %s, %s, %s, %s, 0, 0, NOW())
                """,
                (
                    room_id,
                    sender_id,
                    original_name,
                    original_name,
                    saved_name,
                    file_size,
                    mime_type
                )
            )

            message_id = cur.lastrowid

        conn.commit()

        return jsonify({
            "success": True,
            "message": "파일 업로드 완료",
            "message_id": message_id,
            "file_url": make_chat_file_url(message_id)
        })

    except Exception as e:
        if conn:
            conn.rollback()

        print("파일 업로드 오류:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()



#파일 보기 api
@chat_bp.route("/files/<int:message_id>", methods=["GET"])
def get_chat_file(message_id):
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    file_name,
                    file_path,
                    mime_type
                FROM chat_messages
                WHERE message_id = %s
                  AND message_type = 'FILE'
                  AND IFNULL(is_deleted, 0) = 0
                LIMIT 1
                """,
                (message_id,)
            )

            row = cur.fetchone()

        if not row:
            return jsonify({
                "success": False,
                "message": "파일을 찾을 수 없습니다."
            }), 404

        saved_name = os.path.basename(row["file_path"])

        return send_from_directory(
            UPLOAD_DIR,
            saved_name,
            as_attachment=False,
            download_name=row["file_name"]
        )

    except Exception as e:
        print("파일 조회 오류:", e)
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


@chat_bp.route("/notifications/<int:employee_id>", methods=["GET"])
def get_chat_notifications(employee_id):
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    employee_id,
                    name,
                    department
                FROM employees
                WHERE employee_id = %s
                LIMIT 1
                """,
                (employee_id,)
            )

            me = cur.fetchone()

            if not me:
                return jsonify({
                    "success": False,
                    "message": "직원 정보를 찾을 수 없습니다.",
                    "notifications": []
                }), 404

            cur.execute(
                """
                SELECT
                    cm.message_id,
                    cm.room_id,
                    r.room_name,
                    cm.sender_id,
                    e.name AS sender_name,
                    cm.content,
                    DATE_FORMAT(cm.send_at, '%%Y-%%m-%%d %%H:%%i') AS created_at,
                    DATE_FORMAT(cm.send_at, '%%m/%%d %%H:%%i') AS time
                FROM chat_messages cm
                INNER JOIN chat_room_members crm
                    ON cm.room_id = crm.room_id
                INNER JOIN chat_rooms r
                    ON cm.room_id = r.room_id
                LEFT JOIN employees e
                    ON cm.sender_id = e.employee_id
                WHERE crm.employee_id = %s
                  AND cm.sender_id != %s
                  AND IFNULL(cm.is_deleted, 0) = 0
                  AND IFNULL(r.deleted_id, 0) = 0
                ORDER BY cm.message_id DESC
                LIMIT 20
                """,
                (employee_id, employee_id)
            )

            rows = cur.fetchall()

        my_name = me.get("name") or ""
        my_department = me.get("department") or ""

        notifications = []

        for row in rows:
            content = row.get("content") or ""
            sender_name = row.get("sender_name") or "알 수 없음"
            room_name = row.get("room_name") or "채팅방"

            mention_targets = []

            if my_name:
                mention_targets.append(f"@{my_name}")

            if my_department:
                mention_targets.append(f"@{my_department}")

            is_mention = any(target in content for target in mention_targets)

            notification_type = "CHAT_MENTION" if is_mention else "CHAT_MESSAGE"

            if is_mention:
                text = f"{sender_name}님이 {room_name}에서 나를 태그했습니다."
            else:
                text = f"{sender_name}님이 {room_name}에 새 메시지를 보냈습니다."

            notifications.append({
                "id": f"chat-{row.get('message_id')}",
                "type": notification_type,
                "section": "chat",
                "room_id": row.get("room_id"),
                "text": text,
                "time": row.get("time"),
                "created_at": row.get("created_at"),
                "read": False
            })

        return jsonify({
            "success": True,
            "notifications": notifications
        })

    except Exception as e:
        print("채팅 알림 조회 오류:", e)
        return jsonify({
            "success": False,
            "message": str(e),
            "notifications": []
        }), 500

    finally:
        if conn:
            conn.close()