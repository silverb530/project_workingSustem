from flask import Blueprint, jsonify, request, g
from db import execute_query
from datetime import datetime
from security.auth_decorators import login_required, role_required

remote_manage_bp = Blueprint('remote_manage', __name__, url_prefix='/manage')


def get_current_employee_id():
    try:
        return int(g.current_user.get("employee_id"))
    except:
        return None


def is_admin_or_manager():
    role = str(g.current_user.get("role", "")).upper()
    return role in ("ADMIN", "MANAGER")


@remote_manage_bp.route('/pc/mine', methods=['GET'])
@login_required
def get_my_pc():
    employee_id = get_current_employee_id()

    if not employee_id:
        return jsonify({
            'success': False,
            'message': '로그인 사용자 정보를 찾을 수 없습니다.',
            'pc': None
        }), 401

    rows = execute_query(
        "SELECT pc_id, pc_name, ip_address, port FROM pc_registry WHERE auth_code = %s AND status = 'active'",
        (str(employee_id),)
    )

    return jsonify({
        'success': True,
        'pc': rows[0] if rows else None
    })


@remote_manage_bp.route('/pc/list', methods=['GET'])
@role_required("ADMIN", "MANAGER")
def get_pc_list():
    rows = execute_query(
        "SELECT pc_id, pc_name, ip_address, port FROM pc_registry WHERE status = 'active'"
    )

    return jsonify({
        'success': True,
        'pcs': rows if rows else []
    })


@remote_manage_bp.route('/pc/register', methods=['POST'])
@login_required
def register_pc():
    data = request.get_json() or {}

    current_employee_id = get_current_employee_id()

    if not current_employee_id:
        return jsonify({
            'success': False,
            'message': '로그인 사용자 정보를 찾을 수 없습니다.'
        }), 401

    pc_name = data.get('pc_name')
    auth_code = str(current_employee_id)
    ip_address = data.get('ip_address')
    port = data.get('port', 5001)

    if not pc_name:
        return jsonify({
            'success': False,
            'message': 'PC 이름을 입력하세요.'
        }), 400

    if not ip_address:
        return jsonify({
            'success': False,
            'message': 'IP 주소를 입력하세요.'
        }), 400

    existing = execute_query(
        "SELECT pc_id FROM pc_registry WHERE auth_code = %s",
        (auth_code,)
    )

    if existing:
        execute_query(
            "UPDATE pc_registry SET pc_name = %s, ip_address = %s, port = %s, status = 'active' WHERE auth_code = %s",
            (pc_name, ip_address, port, auth_code),
            fetch=False
        )

        return jsonify({
            'success': True,
            'result': 'updated',
            'pc_id': existing[0]['pc_id']
        })

    execute_query(
        "INSERT INTO pc_registry (pc_name, auth_code, ip_address, port, status) VALUES (%s, %s, %s, %s, 'active')",
        (pc_name, auth_code, ip_address, port),
        fetch=False
    )

    return jsonify({
        'success': True,
        'result': 'registered'
    })


@remote_manage_bp.route('/remote/request', methods=['POST'])
@login_required
def request_access():
    data = request.get_json() or {}

    employee_id = get_current_employee_id()
    pc_id = data.get('pc_id')

    if not employee_id:
        return jsonify({
            'success': False,
            'message': '로그인 사용자 정보를 찾을 수 없습니다.'
        }), 401

    if not pc_id:
        return jsonify({
            'success': False,
            'message': 'PC 정보를 찾을 수 없습니다.'
        }), 400

    existing = execute_query(
        "SELECT request_id FROM remote_access_requests WHERE employee_id = %s AND pc_id = %s AND status = 'pending'",
        (employee_id, pc_id)
    )

    if existing:
        return jsonify({
            'success': True,
            'request_id': existing[0]['request_id'],
            'status': 'pending'
        })

    execute_query(
        "INSERT INTO remote_access_requests (employee_id, pc_id) VALUES (%s, %s)",
        (employee_id, pc_id),
        fetch=False
    )

    result = execute_query(
        "SELECT request_id FROM remote_access_requests WHERE employee_id = %s AND pc_id = %s ORDER BY request_id DESC LIMIT 1",
        (employee_id, pc_id)
    )

    return jsonify({
        'success': True,
        'request_id': result[0]['request_id'],
        'status': 'pending'
    })


@remote_manage_bp.route('/remote/request/status', methods=['GET'])
@login_required
def check_request_status():
    request_id = request.args.get('request_id')
    employee_id = get_current_employee_id()

    if not request_id:
        return jsonify({
            'success': False,
            'message': '요청 ID가 없습니다.',
            'status': 'not_found'
        }), 400

    rows = execute_query(
        """
        SELECT
            request_id,
            employee_id,
            status,
            disconnected_at
        FROM remote_access_requests
        WHERE request_id = %s
        """,
        (request_id,)
    )

    if not rows:
        return jsonify({
            'success': False,
            'status': 'not_found'
        }), 404

    row = rows[0]

    if not is_admin_or_manager() and int(row['employee_id']) != int(employee_id):
        return jsonify({
            'success': False,
            'message': '접근 권한이 없습니다.'
        }), 403

    return jsonify({
        'success': True,
        'status': row['status'],
        'disconnected_at': str(row['disconnected_at']) if row['disconnected_at'] else None
    })


@remote_manage_bp.route('/remote/requests/pending', methods=['GET'])
@role_required("ADMIN", "MANAGER")
def get_pending_requests():
    rows = execute_query('''
        SELECT r.request_id, e.name, e.employee_id, p.pc_name, p.ip_address, r.requested_at
        FROM remote_access_requests r
        JOIN employees e ON r.employee_id = e.employee_id
        JOIN pc_registry p ON r.pc_id = p.pc_id
        WHERE r.status = 'pending'
        ORDER BY r.requested_at ASC
    ''')

    return jsonify({
        'success': True,
        'requests': rows if rows else []
    })


@remote_manage_bp.route('/remote/sessions', methods=['GET'])
@role_required("ADMIN", "MANAGER")
def get_sessions():
    rows = execute_query('''
        SELECT r.request_id, e.name, e.employee_id,
               p.pc_name, p.ip_address,
               r.approved_at, r.disconnected_at, r.status
        FROM remote_access_requests r
        JOIN employees e ON r.employee_id = e.employee_id
        JOIN pc_registry p ON r.pc_id = p.pc_id
        WHERE r.status = 'approved'
        ORDER BY r.approved_at DESC
    ''')

    def fmt(val):
        if val is None:
            return None
        return val.strftime('%Y-%m-%d %H:%M:%S') if hasattr(val, 'strftime') else str(val)

    result = []

    for r in (rows or []):
        r['approved_at'] = fmt(r['approved_at'])
        r['disconnected_at'] = fmt(r['disconnected_at'])
        result.append(r)

    return jsonify({
        'success': True,
        'sessions': result
    })


@remote_manage_bp.route('/remote/disconnect', methods=['POST'])
@role_required("ADMIN", "MANAGER")
def disconnect_session():
    data = request.get_json() or {}
    request_id = data.get('request_id')

    if not request_id:
        return jsonify({
            'success': False,
            'message': '요청 ID가 없습니다.'
        }), 400

    execute_query(
        "UPDATE remote_access_requests SET disconnected_at = %s WHERE request_id = %s",
        (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), request_id),
        fetch=False
    )

    return jsonify({
        'success': True,
        'result': 'ok'
    })


@remote_manage_bp.route('/remote/reconnect', methods=['POST'])
@role_required("ADMIN", "MANAGER")
def reconnect_session():
    data = request.get_json() or {}
    request_id = data.get('request_id')

    if not request_id:
        return jsonify({
            'success': False,
            'message': '요청 ID가 없습니다.'
        }), 400

    execute_query(
        "UPDATE remote_access_requests SET disconnected_at = NULL WHERE request_id = %s",
        (request_id,),
        fetch=False
    )

    return jsonify({
        'success': True,
        'result': 'ok'
    })


@remote_manage_bp.route('/remote/request/approve', methods=['POST'])
@role_required("ADMIN", "MANAGER")
def approve_request():
    data = request.get_json() or {}
    request_id = data.get('request_id')
    approved_by = data.get('approved_by') or get_current_employee_id()
    action = data.get('action')  # 'approved' or 'rejected'

    if not request_id:
        return jsonify({
            'success': False,
            'message': '요청 ID가 없습니다.'
        }), 400

    if action not in ('approved', 'rejected'):
        return jsonify({
            'success': False,
            'message': '처리 상태가 올바르지 않습니다.'
        }), 400

    if not approved_by:
        return jsonify({
            'success': False,
            'message': '승인자 정보를 찾을 수 없습니다.'
        }), 401

    execute_query(
        "UPDATE remote_access_requests SET status = %s, approved_by = %s, approved_at = %s WHERE request_id = %s",
        (action, approved_by, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), request_id),
        fetch=False
    )

    return jsonify({
        'success': True,
        'result': action
    })