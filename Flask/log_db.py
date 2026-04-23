import sqlite3
from datetime import datetime
from config import DB_PATH


def get_conn():
    return sqlite3.connect(DB_PATH)


def init_db():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS access_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT,
            status TEXT,
            created_at TEXT
        )
    """)
    conn.commit()
    conn.close()


def log_access(ip, status):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO access_logs (ip, status, created_at) VALUES (?, ?, ?)",
        (ip, status, datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    )
    conn.commit()
    conn.close()


def get_recent_logs(limit=50):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM access_logs ORDER BY id DESC LIMIT ?", (limit,))
    rows = cur.fetchall()
    conn.close()

    return [
        {
            "id": row[0],
            "ip": row[1],
            "status": row[2],
            "created_at": row[3]
        }
        for row in rows
    ]