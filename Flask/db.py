import pymysql
import re
from config import DB_CONFIG as BASE_DB_CONFIG

DB_CONFIG = {
    **BASE_DB_CONFIG,
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


def execute_query(sql, params=None, fetch=True):
    """
    모든 쿼리를 처리하는 만능 함수
    - sql: 쿼리 문장
    - params: 쿼리에 들어갈 변수 (튜플 형태)
    - fetch: 데이터를 가져올지(SELECT), 아니면 실행만 할지(INSERT/UPDATE)
    """
    conn = get_conn()
    result = None
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params or ())

            if fetch:
                # SELECT일 경우 데이터 가져오기
                result = cur.fetchall()
            else:
                # INSERT, UPDATE, DELETE일 경우 커밋해서 반영하기
                conn.commit()
                result = cur.rowcount  # 몇 줄이 영향받았는지 반환

    except Exception as e:
        print(f"❌ DB 에러 발생: {e}")
        conn.rollback()  # 에러 나면 되돌리기
    finally:
        conn.close()

    return result

# db.py 파일 맨 아래에 추가
# if __name__ == "__main__":
#     print("--- DB 연결 테스트 시작 ---")

#     # 1. 단순 쿼리 테스트 (DB 현재 시간 가져오기)
#     test_sql = "select * from employees"
#     result = execute_query(test_sql)

#     if result:
#         print("✅ 연결 성공!")
#         print(f"현재 DB 시간: {result[0]}")
#     else:
#         print("❌ 연결 실패... 설정을 다시 확인해주세요.")