from flask import Blueprint, request, jsonify
from db import get_conn

chat_room_bp = Blueprint("chat_room", __name__)


@chat_room_bp.route("/api/chatrooms", methods=["GET"])
def get_chatrooms():
    conn = None

    try:
        employee_id = request.args.get("employee_id")

        conn = get_conn()

        with conn.cursor() as cur:
            if employee_id:
                cur.execute("""
                    SELECT
                        cr.room_id,
                        cr.room_name,
                        cr.deleted_id,
                        cr.created_at
                    FROM chat_rooms cr
                    INNER JOIN chat_room_members crm
                        ON cr.room_id = crm.room_id
                    WHERE crm.employee_id = %s
                      AND (cr.deleted_id = 0 OR cr.deleted_id IS NULL)
                    ORDER BY cr.room_id ASC
                """, (employee_id,))
            else:
                cur.execute("""
                    SELECT
                        room_id,
                        room_name,
                        deleted_id,
                        created_at
                    FROM chat_rooms
                    WHERE deleted_id = 0 OR deleted_id IS NULL
                    ORDER BY room_id ASC
                """)

            rows = cur.fetchall()

        return jsonify({
            "success": True,
            "chatrooms": rows
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "chatrooms": []
        }), 500

    finally:
        if conn:
            conn.close()


@chat_room_bp.route("/api/chatrooms", methods=["POST"])
def create_chatroom():
    conn = None

    try:
        data = request.get_json(silent=True) or {}

        room_name = (data.get("room_name") or data.get("name") or "").strip()

        created_by = (
            data.get("created_by")
            or data.get("employee_id")
            or data.get("user_id")
        )

        member_ids = data.get("member_ids") or data.get("members") or []

        if not room_name:
            return jsonify({
                "success": False,
                "message": "채팅방 이름을 입력하세요."
            }), 400

        if not created_by:
            return jsonify({
                "success": False,
                "message": "로그인 사용자 정보를 찾을 수 없습니다."
            }), 400

        try:
            created_by = int(created_by)
        except:
            return jsonify({
                "success": False,
                "message": "생성자 ID가 올바르지 않습니다."
            }), 400

        final_member_ids = set()
        final_member_ids.add(created_by)

        if isinstance(member_ids, list):
            for member_id in member_ids:
                try:
                    final_member_ids.add(int(member_id))
                except:
                    pass

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO chat_rooms (
                    room_name,
                    deleted_id,
                    created_at
                )
                VALUES (
                    %s,
                    0,
                    NOW()
                )
            """, (room_name,))

            room_id = cur.lastrowid

            for member_id in final_member_ids:
                cur.execute("""
                    INSERT INTO chat_room_members (
                        room_id,
                        employee_id
                    )
                    VALUES (
                        %s,
                        %s
                    )
                """, (room_id, member_id))

            conn.commit()

        return jsonify({
            "success": True,
            "message": "채팅방이 생성되었습니다.",
            "room_id": room_id
        })

    except Exception as e:
        if conn:
            conn.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


@chat_room_bp.route("/api/chatrooms/<int:room_id>", methods=["DELETE"])
def delete_chatroom(room_id):
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                UPDATE chat_rooms
                SET deleted_id = 1
                WHERE room_id = %s
            """, (room_id,))

            conn.commit()

        return jsonify({
            "success": True,
            "message": "채팅방이 삭제되었습니다."
        })

    except Exception as e:
        if conn:
            conn.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


@chat_room_bp.route("/api/chatrooms/<int:room_id>/members", methods=["GET"])
def get_chatroom_members(room_id):
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    crm.room_id,
                    crm.employee_id,
                    e.name,
                    e.department,
                    e.position,
                    e.email
                FROM chat_room_members crm
                LEFT JOIN employees e
                    ON crm.employee_id = e.employee_id
                WHERE crm.room_id = %s
                ORDER BY e.name ASC
            """, (room_id,))

            rows = cur.fetchall()

        return jsonify({
            "success": True,
            "members": rows
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "members": []
        }), 500

    finally:
        if conn:
            conn.close()


@chat_room_bp.route("/api/chatrooms/<int:room_id>/members", methods=["POST"])
def add_chatroom_member(room_id):
    conn = None

    try:
        data = request.get_json(silent=True) or {}
        employee_id = data.get("employee_id")

        if not employee_id:
            return jsonify({
                "success": False,
                "message": "추가할 직원을 선택하세요."
            }), 400

        try:
            employee_id = int(employee_id)
        except:
            return jsonify({
                "success": False,
                "message": "직원 ID가 올바르지 않습니다."
            }), 400

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                SELECT COUNT(*) AS cnt
                FROM chat_room_members
                WHERE room_id = %s
                  AND employee_id = %s
            """, (room_id, employee_id))

            row = cur.fetchone()

            if row and row["cnt"] > 0:
                return jsonify({
                    "success": False,
                    "message": "이미 채팅방에 추가된 직원입니다."
                }), 400

            cur.execute("""
                INSERT INTO chat_room_members (
                    room_id,
                    employee_id
                )
                VALUES (
                    %s,
                    %s
                )
            """, (room_id, employee_id))

            conn.commit()

        return jsonify({
            "success": True,
            "message": "채팅방 멤버가 추가되었습니다."
        })

    except Exception as e:
        if conn:
            conn.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


@chat_room_bp.route("/api/chatrooms/<int:room_id>/members/<int:employee_id>", methods=["DELETE"])
def delete_chatroom_member(room_id, employee_id):
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM chat_room_members
                WHERE room_id = %s
                  AND employee_id = %s
            """, (room_id, employee_id))

            conn.commit()

        return jsonify({
            "success": True,
            "message": "채팅방 멤버가 삭제되었습니다."
        })

    except Exception as e:
        if conn:
            conn.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()