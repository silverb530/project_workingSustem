# config.py
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

DB_PATH = os.path.join(BASE_DIR, "remote_work.db")
URLS_JSON_PATH = os.path.join(BASE_DIR, "urls.json")
NOVNC_PATH = os.path.join(BASE_DIR, "novnc")

UPLOAD_FOLDER = r"C:\remote_uploads"
DEFAULT_PC_PATH = r"C:\\"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)