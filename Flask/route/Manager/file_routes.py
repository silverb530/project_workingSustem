from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from db import get_conn
from security.auth_decorators import role_required
import os
import time

file_bp = Blueprint("file", __name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads", "shared_files")

os.makedirs(UPLOAD_DIR, exist_ok=True)


def get_file_type(mime_type, file_name):
    mime_type = mime_type or ""
    file_name = file_name or ""

    ext = os.path.splitext(file_name)[1].lower()

    if mime_type.startswith("image/"):
        return "image"

    if mime_type == "application/pdf" or ext == ".pdf":
        return "pdf"

    if ext in [".xlsx", ".xls", ".csv"]:
        return "spreadsheet"

    if ext in [".doc", ".docx", ".txt", ".ppt", ".pptx"]:
        return "document"

    return "file"


def format_file_size(size):
    try:
        size = int(size or 0)
    except:
        size = 0

    if size >= 1024 * 1024:
        return f"{size / (1024 * 1024):.1f} MB"

    if size >= 1024:
        return f"{size / 1024:.1f} KB"

    return f"{size} B"


@file_bp.route("/api/files", methods=["GET"])
@role_required("ADMIN", "MANAGER")
def get_files():
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    sf.file_id,
                    sf.file_name,
                    sf.file_path,
                    sf.file_size,
                    sf.mime_type,
                    sf.uploaded_by,
                    sf.is_deleted,
                    DATE_FORMAT(sf.uploaded_at, '%Y-%m-%d %H:%i:%s') AS uploaded_at,
                    e.name AS uploaded_by_name
                FROM shared_files sf
                LEFT JOIN employees e
                    ON sf.uploaded_by = e.employee_id
                WHERE sf.is_deleted = 0 OR sf.is_deleted IS NULL
                ORDER BY sf.uploaded_at DESC, sf.file_id DESC
            """)

            rows = cur.fetchall()

        files = []

        for row in rows:
            files.append({
                "id": row["file_id"],
                "file_id": row["file_id"],
                "name": row["file_name"],
                "file_name": row["file_name"],
                "file_path": row["file_path"],
                "file_url": f"/api/files/download/{row['file_id']}",
                "size": format_file_size(row["file_size"]),
                "file_size": row["file_size"],
                "mime_type": row["mime_type"],
                "type": get_file_type(row["mime_type"], row["file_name"]),
                "uploaded_by": row["uploaded_by"],
                "uploaded_by_name": row["uploaded_by_name"],
                "modified": row["uploaded_at"],
                "uploaded_at": row["uploaded_at"],
            })

        return jsonify({
            "success": True,
            "files": files
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "files": []
        }), 500

    finally:
        if conn:
            conn.close()


@file_bp.route("/api/files/upload", methods=["POST"])
@role_required("ADMIN", "MANAGER")
def upload_file():
    conn = None

    try:
        if "file" not in request.files:
            return jsonify({
                "success": False,
                "message": "업로드할 파일이 없습니다."
            }), 400

        file = request.files["file"]

        if file.filename == "":
            return jsonify({
                "success": False,
                "message": "파일명이 비어 있습니다."
            }), 400

        uploaded_by = request.form.get("uploaded_by") or request.form.get("user_id") or 1

        original_name = file.filename
        safe_name = secure_filename(original_name)

        if not safe_name:
            safe_name = f"upload_{int(time.time())}"

        timestamp = int(time.time())
        saved_name = f"{timestamp}_{safe_name}"
        save_path = os.path.join(UPLOAD_DIR, saved_name)

        file.save(save_path)

        file_size = os.path.getsize(save_path)
        mime_type = file.mimetype or "application/octet-stream"

        db_path = f"uploads/shared_files/{saved_name}"

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO shared_files (
                    file_name,
                    file_path,
                    file_size,
                    mime_type,
                    uploaded_by,
                    is_deleted,
                    uploaded_at
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    0,
                    NOW()
                )
            """, (
                original_name,
                db_path,
                file_size,
                mime_type,
                uploaded_by
            ))

            conn.commit()
            file_id = cur.lastrowid

        return jsonify({
            "success": True,
            "message": "파일 업로드 완료",
            "file_id": file_id
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


@file_bp.route("/api/files/download/<int:file_id>", methods=["GET"])
@role_required("ADMIN", "MANAGER")
def download_file(file_id):
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    file_name,
                    file_path
                FROM shared_files
                WHERE file_id = %s
                  AND (is_deleted = 0 OR is_deleted IS NULL)
            """, (file_id,))

            row = cur.fetchone()

        if not row:
            return jsonify({
                "success": False,
                "message": "파일을 찾을 수 없습니다."
            }), 404

        file_path = row["file_path"]
        saved_name = os.path.basename(file_path)

        return send_from_directory(
            UPLOAD_DIR,
            saved_name,
            as_attachment=True,
            download_name=row["file_name"]
        )

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


@file_bp.route("/api/files/<int:file_id>", methods=["DELETE"])
@role_required("ADMIN", "MANAGER")
def delete_file(file_id):
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                UPDATE shared_files
                SET is_deleted = 1
                WHERE file_id = %s
            """, (file_id,))

            conn.commit()

        return jsonify({
            "success": True,
            "message": "파일이 삭제되었습니다."
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