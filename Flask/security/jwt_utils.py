#jwt_utils.py
import jwt
from datetime import datetime, timedelta
from config import JWT_SECRET_KEY, JWT_EXPIRE_HOURS


def create_token(user):
    payload = {
        "employee_id": str(user.get("employee_id")),
        "name": user.get("name"),
        "email": user.get("email"),
        "role": user.get("role"),
        "exp": datetime.utcnow() + timedelta(hours=JWT_EXPIRE_HOURS),
        "iat": datetime.utcnow()
    }

    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")


def verify_token(token):
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
        return {
            "success": True,
            "user": payload
        }

    except jwt.ExpiredSignatureError:
        return {
            "success": False,
            "message": "토큰이 만료되었습니다."
        }

    except jwt.InvalidTokenError:
        return {
            "success": False,
            "message": "유효하지 않은 토큰입니다."
        }