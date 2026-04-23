import pymysql
import re

DB_CONFIG = {
    "host": "192.168.0.15",
    "user": "remoteuser",
    "password": "1234",
    "database": "remote_work_system",
    "charset": "utf8mb4",
    "cursorclass": pymysql.cursors.DictCursor,
    "autocommit": False
}

def get_conn():
    return pymysql.connect(**DB_CONFIG)

def get_role_values(conn):
    sql = """
        SELECT COLUMN_TYPE
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = %s
          AND TABLE_NAME = 'employees'
          AND COLUMN_NAME = 'role'
    """
    with conn.cursor() as cur:
        cur.execute(sql, (DB_CONFIG["database"],))
        row = cur.fetchone()

    if not row or not row.get("COLUMN_TYPE"):
        return []

    column_type = row["COLUMN_TYPE"]
    return re.findall(r"'([^']+)'", column_type)