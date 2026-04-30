import os
import uuid
from datetime import datetime, date

from flask import Blueprint, request, jsonify, send_file, g
from werkzeug.utils import secure_filename

from db import get_conn
from security.auth_decorators import login_required

board_bp = Blueprint("board", __name__)

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "boards")

os.makedirs(UPLOAD_DIR, exist_ok=True)


def make_json_safe(data):
    if isinstance(data, dict):
        return {k: make_json_safe(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [make_json_safe(v) for v in data]
    elif isinstance(data, (datetime, date)):
        return data.strftime("%Y-%m-%d %H:%M:%S")
    else:
        return data


def success_options_response():
    return jsonify({
        "success": True,
        "message": "OPTIONS OK"
    }), 200


def get_current_employee_id():
    try:
        return int(g.current_user.get("employee_id"))
    except:
        return None


def is_admin_or_manager():
    role = str(g.current_user.get("role", "")).upper()
    return role in ("ADMIN", "MANAGER")


def is_owner(author_id):
    current_employee_id = get_current_employee_id()

    try:
        return int(author_id) == int(current_employee_id)
    except:
        return False


def get_request_data():
    json_data = request.get_json(silent=True)

    if isinstance(json_data, dict):
        return json_data

    return {}


def get_request_value(*names, default=""):
    for name in names:
        value = request.form.get(name)

        if value is not None:
            return value

    for name in names:
        value = request.values.get(name)

        if value is not None:
            return value

    json_data = get_request_data()

    for name in names:
        value = json_data.get(name)

        if value is not None:
            return value

    data = json_data.get("data")

    if isinstance(data, dict):
        for name in names:
            value = data.get(name)

            if value is not None:
                return value

    result = json_data.get("result")

    if isinstance(result, dict):
        for name in names:
            value = result.get(name)

            if value is not None:
                return value

    return default


def get_board_input_data():
    title = get_request_value(
        "title",
        "board_title",
        "boardTitle",
        default=""
    )

    content = get_request_value(
        "content",
        "board_content",
        "boardContent",
        default=""
    )

    category = get_request_value(
        "category",
        "board_category",
        "boardCategory",
        default="일반"
    )

    author_id = get_request_value(
        "author_id",
        "authorId",
        "employee_id",
        "employeeId",
        "user_id",
        "userId",
        default=""
    )

    title = str(title).strip()
    content = str(content).strip()
    category = str(category or "일반").strip()
    author_id = str(author_id).strip()

    return title, content, category, author_id


def save_board_files(conn, board_id, files):
    if not files:
        return

    with conn.cursor() as cur:
        for file in files:
            if not file or not file.filename:
                continue

            original_name = file.filename
            safe_name = secure_filename(original_name)

            if not safe_name:
                safe_name = f"file_{uuid.uuid4().hex}"

            stored_name = f"{uuid.uuid4().hex}_{safe_name}"
            file_path = os.path.join(UPLOAD_DIR, stored_name)

            file.save(file_path)

            file_size = os.path.getsize(file_path)
            mime_type = file.mimetype

            cur.execute(
                """
                INSERT INTO board_files (
                    board_id,
                    original_name,
                    stored_name,
                    file_path,
                    file_size,
                    mime_type
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    board_id,
                    original_name,
                    stored_name,
                    file_path,
                    file_size,
                    mime_type
                )
            )


@board_bp.route("/api/boards", methods=["GET"])
@login_required
def get_boards():
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    b.board_id,
                    b.title,
                    b.content,
                    b.category,
                    b.author_id,
                    b.view_count,
                    b.created_at,
                    b.updated_at,
                    e.name AS author_name,
                    COUNT(DISTINCT bf.file_id) AS file_count,
                    COUNT(DISTINCT bc.comment_id) AS comment_count
                FROM boards b
                LEFT JOIN employees e
                    ON b.author_id = e.employee_id
                LEFT JOIN board_files bf
                    ON b.board_id = bf.board_id
                LEFT JOIN board_comments bc
                    ON b.board_id = bc.board_id
                GROUP BY
                    b.board_id,
                    b.title,
                    b.content,
                    b.category,
                    b.author_id,
                    b.view_count,
                    b.created_at,
                    b.updated_at,
                    e.name
                ORDER BY b.board_id DESC
                """
            )

            boards = cur.fetchall()

        return jsonify({
            "success": True,
            "boards": make_json_safe(boards)
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


@board_bp.route("/api/boards/<int:board_id>", methods=["GET"])
@login_required
def get_board_detail(board_id):
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                UPDATE boards
                SET view_count = view_count + 1
                WHERE board_id = %s
                """,
                (board_id,)
            )

            cur.execute(
                """
                SELECT
                    b.board_id,
                    b.title,
                    b.content,
                    b.category,
                    b.author_id,
                    b.view_count,
                    b.created_at,
                    b.updated_at,
                    e.name AS author_name
                FROM boards b
                LEFT JOIN employees e
                    ON b.author_id = e.employee_id
                WHERE b.board_id = %s
                """,
                (board_id,)
            )

            board = cur.fetchone()

            if not board:
                conn.rollback()

                return jsonify({
                    "success": False,
                    "message": "게시글을 찾을 수 없습니다."
                }), 404

            cur.execute(
                """
                SELECT
                    file_id,
                    board_id,
                    original_name,
                    file_size,
                    mime_type,
                    uploaded_at
                FROM board_files
                WHERE board_id = %s
                ORDER BY file_id ASC
                """,
                (board_id,)
            )

            files = cur.fetchall()

            cur.execute(
                """
                SELECT
                    bc.comment_id,
                    bc.board_id,
                    bc.author_id,
                    bc.content,
                    bc.created_at,
                    bc.updated_at,
                    e.name AS author_name
                FROM board_comments bc
                LEFT JOIN employees e
                    ON bc.author_id = e.employee_id
                WHERE bc.board_id = %s
                ORDER BY bc.comment_id ASC
                """,
                (board_id,)
            )

            comments = cur.fetchall()

        conn.commit()

        return jsonify({
            "success": True,
            "board": make_json_safe(board),
            "files": make_json_safe(files),
            "comments": make_json_safe(comments)
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


@board_bp.route("/api/boards", methods=["POST", "OPTIONS"])
@login_required
def create_board():
    conn = None

    if request.method == "OPTIONS":
        return success_options_response()

    try:
        title, content, category, author_id = get_board_input_data()
        current_employee_id = get_current_employee_id()

        print("===== 게시글 등록 요청 확인 =====")
        print("content_type:", request.content_type)
        print("form:", request.form.to_dict())
        print("values:", request.values.to_dict())
        print("json:", get_request_data())
        print("files:", request.files)
        print("title:", title)
        print("content:", content)
        print("category:", category)
        print("author_id:", author_id)

        if not title:
            return jsonify({
                "success": False,
                "message": "게시글 제목을 입력하세요."
            }), 400

        if not content:
            return jsonify({
                "success": False,
                "message": "게시글 내용을 입력하세요."
            }), 400

        if not current_employee_id:
            return jsonify({
                "success": False,
                "message": "로그인 사용자 정보를 찾을 수 없습니다."
            }), 401

        if not author_id:
            author_id = str(current_employee_id)

        if not is_admin_or_manager() and not is_owner(author_id):
            return jsonify({
                "success": False,
                "message": "접근 권한이 없습니다."
            }), 403

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO boards (
                    title,
                    content,
                    category,
                    author_id
                )
                VALUES (%s, %s, %s, %s)
                """,
                (
                    title,
                    content,
                    category,
                    author_id
                )
            )

            board_id = cur.lastrowid

        files = request.files.getlist("files")
        save_board_files(conn, board_id, files)

        conn.commit()

        return jsonify({
            "success": True,
            "message": "게시글 등록 완료",
            "board_id": board_id
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


@board_bp.route("/api/boards/<int:board_id>", methods=["PUT", "OPTIONS"])
@login_required
def update_board(board_id):
    conn = None

    if request.method == "OPTIONS":
        return success_options_response()

    try:
        title, content, category, author_id = get_board_input_data()

        if not title:
            return jsonify({
                "success": False,
                "message": "게시글 제목을 입력하세요."
            }), 400

        if not content:
            return jsonify({
                "success": False,
                "message": "게시글 내용을 입력하세요."
            }), 400

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    board_id,
                    author_id
                FROM boards
                WHERE board_id = %s
                """,
                (board_id,)
            )

            board = cur.fetchone()

            if not board:
                conn.rollback()

                return jsonify({
                    "success": False,
                    "message": "게시글을 찾을 수 없습니다."
                }), 404

            if not is_admin_or_manager() and not is_owner(board.get("author_id")):
                conn.rollback()

                return jsonify({
                    "success": False,
                    "message": "접근 권한이 없습니다."
                }), 403

            cur.execute(
                """
                UPDATE boards
                SET
                    title = %s,
                    content = %s,
                    category = %s
                WHERE board_id = %s
                """,
                (
                    title,
                    content,
                    category,
                    board_id
                )
            )

        files = request.files.getlist("files")
        save_board_files(conn, board_id, files)

        conn.commit()

        return jsonify({
            "success": True,
            "message": "게시글 수정 완료"
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


@board_bp.route("/api/boards/<int:board_id>", methods=["DELETE", "OPTIONS"])
@login_required
def delete_board(board_id):
    conn = None

    if request.method == "OPTIONS":
        return success_options_response()

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    board_id,
                    author_id
                FROM boards
                WHERE board_id = %s
                """,
                (board_id,)
            )

            board = cur.fetchone()

            if not board:
                conn.rollback()

                return jsonify({
                    "success": False,
                    "message": "게시글을 찾을 수 없습니다."
                }), 404

            if not is_admin_or_manager() and not is_owner(board.get("author_id")):
                conn.rollback()

                return jsonify({
                    "success": False,
                    "message": "접근 권한이 없습니다."
                }), 403

            cur.execute(
                """
                SELECT file_path
                FROM board_files
                WHERE board_id = %s
                """,
                (board_id,)
            )

            files = cur.fetchall()

            cur.execute(
                """
                DELETE FROM board_comments
                WHERE board_id = %s
                """,
                (board_id,)
            )

            cur.execute(
                """
                DELETE FROM board_files
                WHERE board_id = %s
                """,
                (board_id,)
            )

            cur.execute(
                """
                DELETE FROM boards
                WHERE board_id = %s
                """,
                (board_id,)
            )

            if cur.rowcount == 0:
                conn.rollback()

                return jsonify({
                    "success": False,
                    "message": "게시글을 찾을 수 없습니다."
                }), 404

        conn.commit()

        for file in files:
            file_path = file.get("file_path")

            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                except:
                    pass

        return jsonify({
            "success": True,
            "message": "게시글 삭제 완료"
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


@board_bp.route("/api/boards/<int:board_id>/comments", methods=["POST", "OPTIONS"])
@login_required
def create_board_comment(board_id):
    conn = None

    if request.method == "OPTIONS":
        return success_options_response()

    try:
        content = get_request_value(
            "content",
            "comment",
            "comment_content",
            "commentContent",
            default=""
        )

        author_id = get_request_value(
            "author_id",
            "authorId",
            "employee_id",
            "employeeId",
            "user_id",
            "userId",
            default=""
        )

        content = str(content).strip()
        author_id = str(author_id).strip()
        current_employee_id = get_current_employee_id()

        print("===== 댓글 등록 요청 확인 =====")
        print("content_type:", request.content_type)
        print("form:", request.form.to_dict())
        print("values:", request.values.to_dict())
        print("json:", get_request_data())
        print("board_id:", board_id)
        print("content:", content)
        print("author_id:", author_id)

        if not content:
            return jsonify({
                "success": False,
                "message": "댓글 내용을 입력하세요."
            }), 400

        if not current_employee_id:
            return jsonify({
                "success": False,
                "message": "로그인 사용자 정보를 찾을 수 없습니다."
            }), 401

        if not author_id:
            author_id = str(current_employee_id)

        if not is_admin_or_manager() and not is_owner(author_id):
            return jsonify({
                "success": False,
                "message": "접근 권한이 없습니다."
            }), 403

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT board_id
                FROM boards
                WHERE board_id = %s
                """,
                (board_id,)
            )

            board = cur.fetchone()

            if not board:
                conn.rollback()

                return jsonify({
                    "success": False,
                    "message": "게시글을 찾을 수 없습니다."
                }), 404

            cur.execute(
                """
                INSERT INTO board_comments (
                    board_id,
                    author_id,
                    content
                )
                VALUES (%s, %s, %s)
                """,
                (
                    board_id,
                    author_id,
                    content
                )
            )

            comment_id = cur.lastrowid

        conn.commit()

        return jsonify({
            "success": True,
            "message": "댓글 등록 완료",
            "comment_id": comment_id
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


@board_bp.route("/api/boards/comments/<int:comment_id>", methods=["DELETE", "OPTIONS"])
@login_required
def delete_board_comment(comment_id):
    conn = None

    if request.method == "OPTIONS":
        return success_options_response()

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    comment_id,
                    author_id
                FROM board_comments
                WHERE comment_id = %s
                """,
                (comment_id,)
            )

            comment = cur.fetchone()

            if not comment:
                conn.rollback()

                return jsonify({
                    "success": False,
                    "message": "댓글을 찾을 수 없습니다."
                }), 404

            if not is_admin_or_manager() and not is_owner(comment.get("author_id")):
                conn.rollback()

                return jsonify({
                    "success": False,
                    "message": "접근 권한이 없습니다."
                }), 403

            cur.execute(
                """
                DELETE FROM board_comments
                WHERE comment_id = %s
                """,
                (comment_id,)
            )

            if cur.rowcount == 0:
                conn.rollback()

                return jsonify({
                    "success": False,
                    "message": "댓글을 찾을 수 없습니다."
                }), 404

        conn.commit()

        return jsonify({
            "success": True,
            "message": "댓글 삭제 완료"
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


@board_bp.route("/api/boards/files/<int:file_id>/download", methods=["GET"])
@login_required
def download_board_file(file_id):
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT
                    original_name,
                    file_path
                FROM board_files
                WHERE file_id = %s
                """,
                (file_id,)
            )

            file = cur.fetchone()

        if not file:
            return jsonify({
                "success": False,
                "message": "파일을 찾을 수 없습니다."
            }), 404

        file_path = file.get("file_path")
        original_name = file.get("original_name")

        if not file_path or not os.path.exists(file_path):
            return jsonify({
                "success": False,
                "message": "서버에 파일이 존재하지 않습니다."
            }), 404

        return send_file(
            file_path,
            as_attachment=True,
            download_name=original_name
        )

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()