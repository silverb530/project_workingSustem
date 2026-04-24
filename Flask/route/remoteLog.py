from flask import Blueprint, jsonify, request
from db import execute_query

remote_log_bp = Blueprint('remote_log', __name__)


@remote_log_bp.route('/api/log/list', methods=['GET'])
def get_logs():
    rows = execute_query(
        'SELECT log_id, ip_address, url_path, status_code, accessed_at FROM access_logs ORDER BY log_id DESC LIMIT 50'
    )
    return jsonify({ 'logs': rows if rows else [] })


@remote_log_bp.route('/api/log/list/ip', methods=['GET'])
def get_logs_by_ip():
    ip = request.args.get('ip')
    rows = execute_query(
        'SELECT log_id, ip_address, url_path, status_code, accessed_at FROM access_logs WHERE ip_address = %s ORDER BY log_id DESC LIMIT 50',
        (ip,)
    )
    return jsonify({ 'logs': rows if rows else [] })


@remote_log_bp.route('/api/log/list/date', methods=['GET'])
def get_logs_by_date():
    date = request.args.get('date')  # YYYY-MM-DD
    rows = execute_query(
        'SELECT log_id, ip_address, url_path, status_code, accessed_at FROM access_logs WHERE DATE(accessed_at) = %s ORDER BY log_id DESC',
        (date,)
    )
    return jsonify({ 'logs': rows if rows else [] })
