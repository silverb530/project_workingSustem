# 출퇴근관련 쿼리모음
from flask import Blueprint, request, jsonify
from db import execute_query
from datetime import date, datetime

attendance_bp = Blueprint("face_attendance", __name__)

@attendance_bp.route('/api/attendance/checkin', methods=['POST'])
def check_in():
    data = request.get_json()
    employee_id = data.get('employee_id')
    today = date.today()
    now = datetime.now()

    existing = execute_query(
        "SELECT * FROM attendance WHERE employee_id = %s AND work_date = %s",
        (employee_id, today)
    )
    if existing:
        return jsonify({"result": "fail", "message": "이미 출근 처리되었습니다."})

    execute_query(
        """INSERT INTO attendance (employee_id, work_date, check_in_time, check_in_method, status)
           VALUES (%s, %s, %s, 'FACE', 'PRESENT')""",
        (employee_id, today, now), fetch=False
    )
    return jsonify({"result": "success", "message": f"출근 완료! ({now.strftime('%H:%M')})"})

@attendance_bp.route('/api/attendance/checkout', methods=['POST'])
def check_out():
    data = request.get_json()
    employee_id = data.get('employee_id')
    today = date.today()
    now = datetime.now()

    existing = execute_query(
        "SELECT * FROM attendance WHERE employee_id = %s AND work_date = %s",
        (employee_id, today)
    )
    if not existing:
        return jsonify({"result": "fail", "message": "출근 기록이 없습니다."})
    if existing[0]['check_out_time']:
        return jsonify({"result": "fail", "message": "이미 퇴근 처리되었습니다."})

    execute_query(
        """UPDATE attendance SET check_out_time = %s, check_out_method = 'FACE'
           WHERE employee_id = %s AND work_date = %s""",
        (now, employee_id, today), fetch=False
    )
    return jsonify({"result": "success", "message": f"퇴근 완료! ({now.strftime('%H:%M')})"})

@attendance_bp.route('/api/attendance/my', methods=['GET'])
def my_attendance():
    employee_id = request.args.get('employee_id')
    logs = execute_query(
        """SELECT work_date, check_in_time, check_out_time, status
           FROM attendance WHERE employee_id = %s
           ORDER BY work_date DESC LIMIT 30""",
        (employee_id,)
    )
    result = []
    for row in (logs or []):
        result.append({
            "work_date": str(row['work_date']),
            "check_in_time": str(row['check_in_time']) if row['check_in_time'] else None,
            "check_out_time": str(row['check_out_time']) if row['check_out_time'] else None,
            "status": row['status']
        })
    return jsonify(result)