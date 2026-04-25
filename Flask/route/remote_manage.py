from flask import Blueprint, jsonify, request
from db import execute_query
from datetime import datetime

remote_manage_bp = Blueprint('remote_manage', __name__, url_prefix='/manage')


@remote_manage_bp.route('/pc/mine', methods=['GET'])
def get_my_pc():
    employee_id = request.args.get('employee_id')
    rows = execute_query(
        "SELECT pc_id, pc_name, ip_address, port FROM pc_registry WHERE auth_code = %s AND status = 'active'",
        (str(employee_id),)
    )
    return jsonify({'pc': rows[0] if rows else None})


@remote_manage_bp.route('/pc/list', methods=['GET'])
def get_pc_list():
    rows = execute_query(
        "SELECT pc_id, pc_name, ip_address, port FROM pc_registry WHERE status = 'active'"
    )
    return jsonify({'pcs': rows if rows else []})


@remote_manage_bp.route('/pc/register', methods=['POST'])
def register_pc():
    data       = request.get_json() or {}
    pc_name    = data.get('pc_name')
    auth_code  = data.get('auth_code')
    ip_address = data.get('ip_address')
    port       = data.get('port', 5001)

    existing = execute_query(
        "SELECT pc_id FROM pc_registry WHERE auth_code = %s", (auth_code,)
    )
    if existing:
        execute_query(
            "UPDATE pc_registry SET ip_address = %s, port = %s WHERE auth_code = %s",
            (ip_address, port, auth_code), fetch=False
        )
        return jsonify({'result': 'updated', 'pc_id': existing[0]['pc_id']})

    execute_query(
        "INSERT INTO pc_registry (pc_name, auth_code, ip_address, port) VALUES (%s, %s, %s, %s)",
        (pc_name, auth_code, ip_address, port), fetch=False
    )
    return jsonify({'result': 'registered'})


@remote_manage_bp.route('/remote/request', methods=['POST'])
def request_access():
    data        = request.get_json() or {}
    employee_id = data.get('employee_id')
    pc_id       = data.get('pc_id')

    existing = execute_query(
        "SELECT request_id FROM remote_access_requests WHERE employee_id = %s AND pc_id = %s AND status = 'pending'",
        (employee_id, pc_id)
    )
    if existing:
        return jsonify({'request_id': existing[0]['request_id'], 'status': 'pending'})

    execute_query(
        "INSERT INTO remote_access_requests (employee_id, pc_id) VALUES (%s, %s)",
        (employee_id, pc_id), fetch=False
    )
    result = execute_query(
        "SELECT request_id FROM remote_access_requests WHERE employee_id = %s AND pc_id = %s ORDER BY request_id DESC LIMIT 1",
        (employee_id, pc_id)
    )
    return jsonify({'request_id': result[0]['request_id'], 'status': 'pending'})


@remote_manage_bp.route('/remote/request/status', methods=['GET'])
def check_request_status():
    request_id = request.args.get('request_id')
    rows = execute_query(
        "SELECT status, disconnected_at FROM remote_access_requests WHERE request_id = %s", (request_id,)
    )
    if not rows:
        return jsonify({'status': 'not_found'}), 404
    return jsonify({
        'status': rows[0]['status'],
        'disconnected_at': str(rows[0]['disconnected_at']) if rows[0]['disconnected_at'] else None
    })


@remote_manage_bp.route('/remote/requests/pending', methods=['GET'])
def get_pending_requests():
    rows = execute_query('''
        SELECT r.request_id, e.name, e.employee_id, p.pc_name, p.ip_address, r.requested_at
        FROM remote_access_requests r
        JOIN employees e ON r.employee_id = e.employee_id
        JOIN pc_registry p ON r.pc_id = p.pc_id
        WHERE r.status = 'pending'
        ORDER BY r.requested_at ASC
    ''')
    return jsonify({'requests': rows if rows else []})


@remote_manage_bp.route('/remote/sessions', methods=['GET'])
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
        r['approved_at']    = fmt(r['approved_at'])
        r['disconnected_at'] = fmt(r['disconnected_at'])
        result.append(r)
    return jsonify({'sessions': result})


@remote_manage_bp.route('/remote/disconnect', methods=['POST'])
def disconnect_session():
    data       = request.get_json() or {}
    request_id = data.get('request_id')
    execute_query(
        "UPDATE remote_access_requests SET disconnected_at = %s WHERE request_id = %s",
        (datetime.now().strftime('%Y-%m-%d %H:%M:%S'), request_id),
        fetch=False
    )
    return jsonify({'result': 'ok'})


@remote_manage_bp.route('/remote/reconnect', methods=['POST'])
def reconnect_session():
    data       = request.get_json() or {}
    request_id = data.get('request_id')
    execute_query(
        "UPDATE remote_access_requests SET disconnected_at = NULL WHERE request_id = %s",
        (request_id,), fetch=False
    )
    return jsonify({'result': 'ok'})


@remote_manage_bp.route('/remote/request/approve', methods=['POST'])
def approve_request():
    data        = request.get_json() or {}
    request_id  = data.get('request_id')
    approved_by = data.get('approved_by')
    action      = data.get('action')  # 'approved' or 'rejected'

    execute_query(
        "UPDATE remote_access_requests SET status = %s, approved_by = %s, approved_at = %s WHERE request_id = %s",
        (action, approved_by, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), request_id),
        fetch=False
    )
    return jsonify({'result': action})
