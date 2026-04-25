from flask import Blueprint, request, jsonify
from db import get_conn
from datetime import datetime, date

Mchat_bp = Blueprint("Mchat", __name__)


def make_json_safe(data):
    if isinstance(data, dict):
        return {k: make_json_safe(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [make_json_safe(v) for v in data]
    elif isinstance(data, (datetime, date)):
        return data.strftime("%Y-%m-%d %H:%M:%S")
    else:
        return data


@Mchat_bp.route("/api/chatlogs", methods=["GET"])
@Mchat_bp.route("/app/chatlogs", methods=["GET"])
def get_chatlogs():
    conn = None
    try:
        room_id = request.args.get("room_id", "1")

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    cm.message_id AS id,
                    cm.message_id,
                    cm.room_id,
                    cm.sender_id,
                    cm.content AS message,
                    cm.is_deleted,
                    cm.send_at AS time,
                    e.name AS user
                FROM chat_messages cm
                LEFT JOIN employees e
                    ON cm.sender_id = e.employee_id
                WHERE cm.room_id = %s
                  AND cm.is_deleted = 0
                ORDER BY cm.send_at ASC, cm.message_id ASC
                """,
                (room_id,)
            )

            rows = cur.fetchall()

        result = []

        for row in rows:
            if not row.get("user"):
                row["user"] = str(row.get("sender_id") or "알 수 없음")

            result.append(row)

        return jsonify(make_json_safe(result))

    except Exception as e:
        print("❌ 채팅 조회 에러:", e)
        return jsonify({
            "success": False,
            "result": "fail",
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


@Mchat_bp.route("/api/chatlogs", methods=["POST"])
@Mchat_bp.route("/app/chatlogs", methods=["POST"])
def create_chatlog():
    conn = None
    try:
        data = request.get_json(silent=True) or {}

        room_id = data.get("room_id") or 1
        sender_id = data.get("sender_id") or data.get("user_id") or data.get("employee_id") or 1
        content = (data.get("message") or data.get("content") or "").strip()

        if not content:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "메시지를 입력하세요."
            }), 400

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO chat_messages
                (
                    room_id,
                    sender_id,
                    content,
                    is_deleted,
                    send_at
                )
                VALUES
                (
                    %s, %s, %s, 0, NOW()
                )
                """,
                (
                    room_id,
                    sender_id,
                    content
                )
            )

            new_id = cur.lastrowid

        conn.commit()

        return jsonify({
            "success": True,
            "result": "success",
            "message": "메시지가 전송되었습니다.",
            "id": new_id,
            "message_id": new_id
        })

    except Exception as e:
        if conn:
            conn.rollback()

        print("❌ 채팅 등록 에러:", e)
        return jsonify({
            "success": False,
            "result": "fail",
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


@Mchat_bp.route("/api/chatlogs/<int:message_id>", methods=["DELETE"])
@Mchat_bp.route("/app/chatlogs/<int:message_id>", methods=["DELETE"])
def delete_chatlog(message_id):
    conn = None
    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE chat_messages
                SET is_deleted = 1
                WHERE message_id = %s
                  AND is_deleted = 0
                """,
                (message_id,)
            )

            deleted_count = cur.rowcount

        conn.commit()

        if deleted_count == 0:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "삭제할 메시지를 찾을 수 없습니다."
            }), 404

        return jsonify({
            "success": True,
            "result": "success",
            "message": "메시지가 삭제되었습니다.",
            "message_id": message_id
        })

    except Exception as e:
        if conn:
            conn.rollback()

        print("❌ 채팅 삭제 에러:", e)
        return jsonify({
            "success": False,
            "result": "fail",
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()