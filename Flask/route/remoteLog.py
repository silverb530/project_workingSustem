from flask import Blueprint, jsonify, request
from db import execute_query

remote_log_bp = Blueprint('remote_log', __name__)


@remote_log_bp.route('/api/log/list', methods=['GET'])
def get_logs():
    rows = execute_query('''
        SELECT l.log_id, e.name, l.ip_address, l.url_path, l.status_code, l.accessed_at
        FROM access_logs l
        LEFT JOIN employees e ON l.employee_id = e.employee_id
        ORDER BY l.log_id DESC LIMIT 50
    ''')
    return jsonify({ 'logs': rows if rows else [] })


@remote_log_bp.route('/api/log/active', methods=['GET'])
def get_active_sessions():
    rows = execute_query('''
        SELECT l.log_id, e.name, e.employee_id, l.ip_address, l.accessed_at
        FROM access_logs l
        LEFT JOIN employees e ON l.employee_id = e.employee_id
        WHERE l.log_id IN (
            SELECT MAX(log_id) FROM access_logs
            WHERE employee_id IS NOT NULL GROUP BY employee_id
        )
        AND l.url_path = '/api/remote/start'
        ORDER BY l.accessed_at DESC
    ''')
    return jsonify({ 'sessions': rows if rows else [] })


@remote_log_bp.route('/api/log/list/date', methods=['GET'])
def get_logs_by_date():
    date = request.args.get('date')
    rows = execute_query('''
        SELECT l.log_id, e.name, l.ip_address, l.url_path, l.status_code, l.accessed_at
        FROM access_logs l
        LEFT JOIN employees e ON l.employee_id = e.employee_id
        WHERE DATE(l.accessed_at) = %s
        ORDER BY l.log_id DESC
    ''', (date,))
    return jsonify({ 'logs': rows if rows else [] })
