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
        conn.rollback() # 에러 나면 되돌리기
    finally:
        conn.close()
    
    return result