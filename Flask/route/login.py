from flask import Blueprint, request, jsonify
from db import execute_query, get_conn
from werkzeug.security import check_password_hash, generate_password_hash
import json

# [보안 추가] 로그인 성공 시 JWT 토큰을 발급하기 위해 추가
from security.jwt_utils import create_token

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/route/login", methods=["POST"])
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    user_id = (
        data.get("id")
        or data.get("employee_id")
        or data.get("employeeId")
        or data.get("username")
    )

    user_pw = (
        data.get("pw")
        or data.get("password")
    )

    if not user_id or not user_pw:
        return jsonify({
            "success": False,
            "result": "fail",
            "message": "아이디와 비밀번호를 입력하세요."
        }), 400

    sql = """
        SELECT
            employee_id,
            name,
            email,
            phone,
            department,
            position,
            role,
            password_hash,
            is_active,
            qr_data
        FROM employees
        WHERE employee_id = %s
        LIMIT 1
    """

    users = execute_query(sql, (user_id,))

    if not users:
        return jsonify({
            "success": False,
            "result": "fail",
            "message": "아이디 또는 비밀번호가 틀렸습니다."
        }), 401

    user = users[0]

    if user.get("is_active") != 1:
        return jsonify({
            "success": False,
            "result": "fail",
            "message": "비활성화된 계정입니다."
        }), 403

    stored_hash = user.get("password_hash")

    if not stored_hash or not check_password_hash(stored_hash, user_pw):
        return jsonify({
            "success": False,
            "result": "fail",
            "message": "아이디 또는 비밀번호가 틀렸습니다."
        }), 401

    login_user = {
        "employee_id": user.get("employee_id"),
        "name": user.get("name"),
        "email": user.get("email"),
        "phone": user.get("phone"),
        "department": user.get("department"),
        "position": user.get("position"),
        "role": user.get("role"),
        "qr_data": user.get("qr_data")
    }

    # [보안 추가] 로그인 성공한 사용자 정보를 기반으로 JWT 토큰 생성
    token = create_token(login_user)

    return jsonify({
        "success": True,
        "result": "success",
        "message": "로그인 성공",

        # [보안 추가] 프론트/앱에서 이후 API 요청 시 Authorization 헤더에 넣어 사용할 토큰
        "token": token,
        "token_type": "Bearer",

        "user": login_user
    })


@auth_bp.route('/route/my-ip', methods=['GET'])
def get_my_ip():
    ip = request.headers.get('X-Forwarded-For', request.remote_addr)
    ip = ip.split(',')[0].strip()
    return jsonify({'ip': ip})


def make_qr_data(employee_id, name, email):
    return json.dumps({
        "type": "employee_access",
        "employee_id": str(employee_id),
        "email": email,
        "name": name
    }, ensure_ascii=False)


@auth_bp.route('/route/register', methods=['POST'])
def web_register():
    data = request.get_json() or {}

    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip()
    password = (data.get('password') or '').strip()
    phone = (data.get('phone') or '').strip()
    department = (data.get('department') or '').strip()
    position = (data.get('position') or '').strip()
    pc_name = (data.get('pc_name') or '').strip()
    ip_address = (data.get('ip_address') or '').strip()

    if not name or not email or not password or not ip_address:
        return jsonify({
            'success': False,
            'result': 'fail',
            'message': '필수 항목을 모두 입력하세요.'
        }), 400

    conn = get_conn()

    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT employee_id FROM employees WHERE email = %s LIMIT 1",
                (email,)
            )

            if cur.fetchone():
                return jsonify({
                    'success': False,
                    'result': 'fail',
                    'message': '이미 사용 중인 이메일입니다.'
                }), 409

            password_hash = generate_password_hash(password)

            cur.execute(
                """
                INSERT INTO employees (
                    name,
                    email,
                    phone,
                    department,
                    position,
                    role,
                    password_hash,
                    is_active,
                    created_at
                )
                VALUES (%s, %s, %s, %s, %s, 'EMPLOYEE', %s, 1, NOW())
                """,
                (
                    name,
                    email,
                    phone,
                    department,
                    position,
                    password_hash
                )
            )

            employee_id = cur.lastrowid

            qr_data = make_qr_data(employee_id, name, email)

            cur.execute(
                """
                UPDATE employees
                SET qr_data = %s
                WHERE employee_id = %s
                """,
                (
                    qr_data,
                    employee_id
                )
            )

            cur.execute(
                """
                INSERT INTO pc_registry (
                    pc_name,
                    auth_code,
                    ip_address,
                    port,
                    status
                )
                VALUES (%s, %s, %s, 5001, 'active')
                """,
                (
                    pc_name or f"{name}의 PC",
                    str(employee_id),
                    ip_address
                )
            )

        conn.commit()

        return jsonify({
            'success': True,
            'result': 'success',
            'message': '회원가입 성공',
            'employee_id': employee_id,
            'qr_data': qr_data
        })

    except Exception as e:
        conn.rollback()

        return jsonify({
            'success': False,
            'result': 'fail',
            'message': str(e)
        }), 500

    finally:
        conn.close()