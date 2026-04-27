from flask_socketio import emit, join_room, leave_room
from flask import request

# 메모리에서 방별 참여자 관리: {room_id: {socket_id: {user_id, user_name}}}
room_users = {}


def register_meeting_socket(socketio):

    @socketio.on("join-room")
    def handle_join(data):
        room_id = str(data.get("room_id", ""))
        user_id = data.get("user_id")
        user_name = data.get("user_name", "참여자")
        sid = request.sid

        join_room(room_id)

        if room_id not in room_users:
            room_users[room_id] = {}

        # 이미 방에 있는 사람 목록을 새로 입장한 사람에게 전송
        existing = [
            {"socket_id": s, "user_id": info["user_id"], "user_name": info["user_name"]}
            for s, info in room_users[room_id].items()
        ]
        emit("room-users", existing)

        # 새 참여자 등록
        room_users[room_id][sid] = {"user_id": user_id, "user_name": user_name}

        # 기존 참여자들에게 새 사람 입장 알림
        socketio.emit(
            "user-joined",
            {"socket_id": sid, "user_id": user_id, "user_name": user_name},
            room=room_id,
            skip_sid=sid,
        )

    @socketio.on("offer")
    def handle_offer(data):
        emit("offer", {"from": request.sid, "offer": data["offer"]}, to=data["to"])

    @socketio.on("answer")
    def handle_answer(data):
        emit("answer", {"from": request.sid, "answer": data["answer"]}, to=data["to"])

    @socketio.on("ice-candidate")
    def handle_ice(data):
        emit(
            "ice-candidate",
            {"from": request.sid, "candidate": data["candidate"]},
            to=data["to"],
        )

    @socketio.on("leave-room")
    def handle_leave(data):
        room_id = str(data.get("room_id", ""))
        sid = request.sid
        leave_room(room_id)
        if room_id in room_users and sid in room_users[room_id]:
            room_users[room_id].pop(sid)
            if not room_users[room_id]:
                del room_users[room_id]
        socketio.emit("user-left", {"socket_id": sid}, room=room_id)

    @socketio.on("disconnect")
    def handle_disconnect():
        sid = request.sid
        for room_id, users in list(room_users.items()):
            if sid in users:
                users.pop(sid)
                if not users:
                    del room_users[room_id]
                socketio.emit("user-left", {"socket_id": sid}, room=room_id)
                break
