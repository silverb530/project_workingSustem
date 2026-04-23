import os
from datetime import datetime
from config import UPLOAD_FOLDER, DEFAULT_PC_PATH


def list_pc_files(path=None):
    path = path or DEFAULT_PC_PATH
    items = os.listdir(path)
    result = []

    for item in items:
        full_path = os.path.join(path, item)
        try:
            result.append({
                "name": item,
                "path": full_path,
                "is_dir": os.path.isdir(full_path),
                "size": os.path.getsize(full_path) if not os.path.isdir(full_path) else 0,
                "modified": datetime.fromtimestamp(
                    os.path.getmtime(full_path)
                ).strftime("%Y-%m-%d %H:%M:%S")
            })
        except Exception:
            pass

    return {
        "files": result,
        "current_path": path
    }


def get_download_target(path):
    folder = os.path.dirname(path)
    filename = os.path.basename(path)
    return folder, filename


def save_uploaded_file(file, path=None):
    target_path = path or UPLOAD_FOLDER
    os.makedirs(target_path, exist_ok=True)

    save_path = os.path.join(target_path, file.filename)
    file.save(save_path)

    return {
        "status": "uploaded",
        "filename": file.filename
    }