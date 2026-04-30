from flask import Blueprint, request, jsonify
from db import get_conn
from security.auth_decorators import role_required

task_bp = Blueprint("task", __name__)


@task_bp.route("/api/tasks", methods=["GET"])
@role_required("ADMIN", "MANAGER")
def get_tasks():
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                SELECT
                    t.task_id,
                    t.title,
                    t.description,
                    t.assigned_to,
                    t.assigned_by,
                    t.priority,
                    t.status,
                    DATE_FORMAT(t.due_date, '%Y-%m-%d') AS due_date,
                    DATE_FORMAT(t.started_at, '%Y-%m-%d %H:%i:%s') AS started_at,
                    DATE_FORMAT(t.completed_at, '%Y-%m-%d %H:%i:%s') AS completed_at,
                    DATE_FORMAT(t.created_at, '%Y-%m-%d %H:%i:%s') AS created_at,
                    e1.name AS assigned_to_name,
                    e1.department AS assigned_to_department,
                    e1.position AS assigned_to_position,
                    e2.name AS assigned_by_name
                FROM tasks t
                LEFT JOIN employees e1
                    ON t.assigned_to = e1.employee_id
                LEFT JOIN employees e2
                    ON t.assigned_by = e2.employee_id
                ORDER BY t.created_at DESC, t.task_id DESC
            """)

            rows = cur.fetchall()

        return jsonify({
            "success": True,
            "tasks": rows
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "message": str(e),
            "tasks": []
        }), 500

    finally:
        if conn:
            conn.close()


@task_bp.route("/api/tasks", methods=["POST"])
@role_required("ADMIN", "MANAGER")
def create_task():
    conn = None

    try:
        data = request.get_json(silent=True) or {}

        title = (data.get("title") or "").strip()
        description = (data.get("description") or "").strip()
        assigned_to = data.get("assigned_to")
        assigned_by = data.get("assigned_by") or 1
        priority = data.get("priority") or "MEDIUM"
        due_date = data.get("due_date") or None

        if not title:
            return jsonify({
                "success": False,
                "message": "업무 제목을 입력하세요."
            }), 400

        if not assigned_to:
            return jsonify({
                "success": False,
                "message": "담당 직원을 선택하세요."
            }), 400

        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                INSERT INTO tasks (
                    title,
                    description,
                    assigned_to,
                    assigned_by,
                    priority,
                    status,
                    due_date,
                    created_at
                )
                VALUES (
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    'TODO',
                    %s,
                    NOW()
                )
            """, (
                title,
                description,
                assigned_to,
                assigned_by,
                priority,
                due_date
            ))

            conn.commit()

            task_id = cur.lastrowid

        return jsonify({
            "success": True,
            "message": "업무가 배정되었습니다.",
            "task_id": task_id
        })

    except Exception as e:
        if conn:
            conn.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


@task_bp.route("/api/tasks/<int:task_id>/status", methods=["PATCH"])
@role_required("ADMIN", "MANAGER")
def update_task_status(task_id):
    conn = None

    try:
        data = request.get_json(silent=True) or {}
        status = data.get("status")

        allowed_status = ["TODO", "IN_PROGRESS", "DONE", "HOLD"]

        if status not in allowed_status:
            return jsonify({
                "success": False,
                "message": "잘못된 업무 상태입니다."
            }), 400

        conn = get_conn()

        with conn.cursor() as cur:
            if status == "IN_PROGRESS":
                cur.execute("""
                    UPDATE tasks
                    SET
                        status = %s,
                        started_at = IFNULL(started_at, NOW())
                    WHERE task_id = %s
                """, (status, task_id))

            elif status == "DONE":
                cur.execute("""
                    UPDATE tasks
                    SET
                        status = %s,
                        completed_at = NOW()
                    WHERE task_id = %s
                """, (status, task_id))

            else:
                cur.execute("""
                    UPDATE tasks
                    SET status = %s
                    WHERE task_id = %s
                """, (status, task_id))

            conn.commit()

        return jsonify({
            "success": True,
            "message": "업무 상태가 변경되었습니다."
        })

    except Exception as e:
        if conn:
            conn.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()


@task_bp.route("/api/tasks/<int:task_id>", methods=["DELETE"])
@role_required("ADMIN", "MANAGER")
def delete_task(task_id):
    conn = None

    try:
        conn = get_conn()

        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM task_reports
                WHERE task_id = %s
            """, (task_id,))

            cur.execute("""
                DELETE FROM tasks
                WHERE task_id = %s
            """, (task_id,))

            conn.commit()

        return jsonify({
            "success": True,
            "message": "업무가 삭제되었습니다."
        })

    except Exception as e:
        if conn:
            conn.rollback()

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500

    finally:
        if conn:
            conn.close()