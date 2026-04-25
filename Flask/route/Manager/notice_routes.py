from flask import Blueprint, request, jsonify
from db import get_conn
from datetime import datetime, date

notice_bp = Blueprint("notice", __name__)


def make_json_safe(data):
    if isinstance(data, dict):
        return {k: make_json_safe(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [make_json_safe(v) for v in data]
    elif isinstance(data, (datetime, date)):
        return data.strftime("%Y-%m-%d %H:%M:%S")
    else:
        return data


@notice_bp.route("/api/notices", methods=["GET"])
@notice_bp.route("/app/notices", methods=["GET"])
def get_notices():
    conn = None
    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    n.notice_id,
                    n.title,
                    n.content,
                    n.author_id,
                    n.is_pinned,
                    n.is_deleted,
                    n.created_at,
                    n.updated_at,
                    e.name AS author_name
                FROM notices n
                LEFT JOIN employees e
                    ON n.author_id = e.employee_id
                WHERE n.is_deleted = 0
                ORDER BY n.is_pinned DESC, n.created_at DESC
                """
            )
            rows = cur.fetchall()

        return jsonify({
            "success": True,
            "result": "success",
            "notices": make_json_safe(rows)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "result": "fail",
            "message": str(e),
            "notices": []
        }), 500

    finally:
        if conn:
            conn.close()


@notice_bp.route("/api/notices", methods=["POST"])
@notice_bp.route("/app/notices", methods=["POST"])
def create_notice():
    conn = None
    try:
        data = request.get_json(silent=True) or {}

        title = (data.get("title") or "").strip()
        content = (data.get("content") or "").strip()
        author_id = data.get("author_id")
        is_pinned = 1 if data.get("is_pinned") else 0

        if not title:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "제목을 입력하세요."
            }), 400

        if not content:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "내용을 입력하세요."
            }), 400

        if not author_id:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "작성자 ID가 없습니다."
            }), 400

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO notices
                (
                    title,
                    content,
                    author_id,
                    is_pinned,
                    is_deleted,
                    created_at,
                    updated_at
                )
                VALUES
                (
                    %s, %s, %s, %s, 0, NOW(), NOW()
                )
                """,
                (
                    title,
                    content,
                    author_id,
                    is_pinned
                )
            )

            new_id = cur.lastrowid

        conn.commit()

        return jsonify({
            "success": True,
            "result": "success",
            "message": "공지사항이 등록되었습니다.",
            "notice_id": new_id
        })

    except Exception as e:
        if conn:
            conn.rollback()

        return jsonify({
            "success": False,
            "result": "fail",
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


@notice_bp.route("/api/notices/<int:notice_id>", methods=["PUT"])
@notice_bp.route("/app/notices/<int:notice_id>", methods=["PUT"])
def update_notice(notice_id):
    conn = None
    try:
        data = request.get_json(silent=True) or {}

        title = (data.get("title") or "").strip()
        content = (data.get("content") or "").strip()
        is_pinned = 1 if data.get("is_pinned") else 0

        if not title:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "제목을 입력하세요."
            }), 400

        if not content:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "내용을 입력하세요."
            }), 400

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE notices
                SET
                    title = %s,
                    content = %s,
                    is_pinned = %s,
                    updated_at = NOW()
                WHERE notice_id = %s
                  AND is_deleted = 0
                """,
                (
                    title,
                    content,
                    is_pinned,
                    notice_id
                )
            )

        conn.commit()

        return jsonify({
            "success": True,
            "result": "success",
            "message": "공지사항이 수정되었습니다."
        })

    except Exception as e:
        if conn:
            conn.rollback()

        return jsonify({
            "success": False,
            "result": "fail",
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


@notice_bp.route("/api/notices/<int:notice_id>", methods=["DELETE"])
@notice_bp.route("/app/notices/<int:notice_id>", methods=["DELETE"])
def delete_notice(notice_id):
    conn = None
    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE notices
                SET
                    is_deleted = 1,
                    updated_at = NOW()
                WHERE notice_id = %s
                """,
                (notice_id,)
            )

        conn.commit()

        return jsonify({
            "success": True,
            "result": "success",
            "message": "공지사항이 삭제되었습니다."
        })

    except Exception as e:
        if conn:
            conn.rollback()

        return jsonify({
            "success": False,
            "result": "fail",
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()