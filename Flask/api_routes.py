from flask import Blueprint, jsonify, request, send_from_directory
from common_service import load_urls
from remote_service import start_remote, stop_remote, get_remote_status
from log_db import get_recent_logs
from file_service import list_pc_files, get_download_target, save_uploaded_file
from system_service import get_system_info

api_bp = Blueprint("api_bp", __name__)


@api_bp.route("/api/urls", methods=["GET"])
def get_urls():
    try:
        return jsonify(load_urls())
    except Exception:
        return jsonify({"error": "urls.json 없음"}), 500


@api_bp.route("/api/remote/start", methods=["POST"])
def start_remote_route():
    data, status = start_remote(request.remote_addr)
    return jsonify(data), status


@api_bp.route("/api/remote/stop", methods=["POST"])
def stop_remote_route():
    data, status = stop_remote(request.remote_addr)
    return jsonify(data), status


@api_bp.route("/api/remote/status", methods=["GET"])
def remote_status_route():
    data, status = get_remote_status()
    return jsonify(data), status


@api_bp.route("/api/log/list", methods=["GET"])
def get_logs_route():
    return jsonify({"logs": get_recent_logs(50)})


@api_bp.route("/api/pc/files", methods=["GET"])
def list_pc_files_route():
    path = request.args.get("path")
    try:
        return jsonify(list_pc_files(path))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@api_bp.route("/api/pc/download", methods=["GET"])
def download_pc_file_route():
    path = request.args.get("path")
    if not path:
        return jsonify({"error": "path 값이 없습니다."}), 400

    folder, filename = get_download_target(path)
    return send_from_directory(folder, filename, as_attachment=True)


@api_bp.route("/api/pc/upload", methods=["POST"])
def upload_to_pc_route():
    path = request.args.get("path")

    if "file" not in request.files:
        return jsonify({"error": "파일 없음"}), 400

    file = request.files["file"]
    return jsonify(save_uploaded_file(file, path))


@api_bp.route("/api/system/info", methods=["GET"])
def system_info_route():
    return jsonify(get_system_info())