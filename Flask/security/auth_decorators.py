from functools import wraps
from flask import request, jsonify, g
from security.jwt_utils import verify_token


def get_token_from_header():
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None

    return auth_header.replace("Bearer ", "").strip()


def login_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        token = get_token_from_header()

        if not token:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": "로그인이 필요합니다."
            }), 401

        result = verify_token(token)

        if not result["success"]:
            return jsonify({
                "success": False,
                "result": "fail",
                "message": result["message"]
            }), 401

        g.current_user = result["user"]

        return func(*args, **kwargs)

    return wrapper


def role_required(*allowed_roles):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            token = get_token_from_header()

            if not token:
                return jsonify({
                    "success": False,
                    "result": "fail",
                    "message": "로그인이 필요합니다."
                }), 401

            result = verify_token(token)

            if not result["success"]:
                return jsonify({
                    "success": False,
                    "result": "fail",
                    "message": result["message"]
                }), 401

            g.current_user = result["user"]

            user_role = str(g.current_user.get("role", "")).upper()
            allowed = [str(role).upper() for role in allowed_roles]

            if user_role not in allowed:
                return jsonify({
                    "success": False,
                    "result": "fail",
                    "message": "접근 권한이 없습니다."
                }), 403

            return func(*args, **kwargs)

        return wrapper

    return decorator