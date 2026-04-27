import os
from dotenv import load_dotenv

load_dotenv()


def get_bool(key, default=False):
    value = os.getenv(key)

    if value is None:
        return default

    return value.lower() in ("true", "1", "yes", "y")


def get_int(key, default=0):
    try:
        return int(os.getenv(key, default))
    except:
        return default


DB_CONFIG = {
    "host": os.getenv("DB_HOST", "127.0.0.1"),
    "user": os.getenv("DB_USER", "root"),
    "password": os.getenv("DB_PASSWORD", ""),
    "database": os.getenv("DB_NAME", "remote_work_system"),
    "charset": os.getenv("DB_CHARSET", "utf8mb4"),
}

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change_this_secret_key")
JWT_EXPIRE_HOURS = get_int("JWT_EXPIRE_HOURS", 12)

ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
    if origin.strip()
]

FLASK_HOST = os.getenv("FLASK_HOST", "0.0.0.0")
FLASK_PORT = get_int("FLASK_PORT", 5000)
FLASK_DEBUG = get_bool("FLASK_DEBUG", False)