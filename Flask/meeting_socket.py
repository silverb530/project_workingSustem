from flask_socketio import emit, join_room, leave_room
from flask import request

# 메모리에서 방별 참여자 관리: {room_id: {socket_id: {user_id, user_name}}}
room_users = {}

# 온라인 접속자 관리: {socket_id: {user_id, user_name}}
online_users = {}


def get_online_count():
    unique_users = set()

    for sid, info in online_users.items():
        user_id = info.get("user_id")

        if user_id is not None and user_id != "":
            unique_users.add(str(user_id))
        else:
            unique_users.add(str(sid))

    return len(unique_users)


def get_meeting_count():
    unique_users = set()

    for room_id, users in room_users.items():
        for sid, info in users.items():
            user_id = info.get("user_id")

            if user_id is not None and user_id != "":
                unique_users.add(str(user_id))
            else:
                unique_users.add(str(sid))

    return len(unique_users)


def get_presence_counts():
    return {
        "online_count": get_online_count(),
        "meeting_count": get_meeting_count()
    }


def emit_presence_counts(socketio):
    socketio.emit("presence-counts", get_presence_counts())


def get_sids_for_user(user_id):
    """특정 유저 ID에 연결된 모든 socket ID 반환"""
    return [
        sid for sid, info in online_users.items()
        if str(info.get("user_id")) == str(user_id)
    ]


def push_notification_to_user(socketio, user_id, notification):
    """특정 유저에게 실시간 알림 push"""
    for sid in get_sids_for_user(user_id):
        socketio.emit("new-notification", notification, room=sid)


def register_meeting_socket(socketio):

    @socketio.on("connect")
    def handle_connect():
        emit("presence-counts", get_presence_counts())

    @socketio.on("register-online")
    def handle_register_online(data):
        sid = request.sid

        user_id = data.get("user_id")
        user_name = data.get("user_name", "사용자")

        online_users[sid] = {
            "user_id": user_id,
            "user_name": user_name
        }

        emit_presence_counts(socketio)

    @socketio.on("unregister-online")
    def handle_unregister_online():
        sid = request.sid

        if sid in online_users:
            online_users.pop(sid)

        emit_presence_counts(socketio)

    @socketio.on("request-presence-counts")
    def handle_request_presence_counts():
        emit("presence-counts", get_presence_counts())

    @socketio.on("join-room")
    def handle_join(data):
        room_id = str(data.get("room_id", ""))
        user_id = data.get("user_id")
        user_name = data.get("user_name", "참여자")
        sid = request.sid

        if not room_id:
            return

        join_room(room_id)

        if room_id not in room_users:
            room_users[room_id] = {}

        stale_sids = [
            s for s, info in room_users[room_id].items()
            if str(info.get("user_id")) == str(user_id)
        ]

        for stale in stale_sids:
            del room_users[room_id][stale]
            socketio.emit("user-left", {"socket_id": stale}, room=room_id)

        existing = [
            {
                "socket_id": s,
                "user_id": info["user_id"],
                "user_name": info["user_name"]
            }
            for s, info in room_users[room_id].items()
        ]

        emit("room-users", existing)

        room_users[room_id][sid] = {
            "user_id": user_id,
            "user_name": user_name
        }

        socketio.emit(
            "user-joined",
            {
                "socket_id": sid,
                "user_id": user_id,
                "user_name": user_name
            },
            room=room_id,
            skip_sid=sid
        )

        emit_presence_counts(socketio)

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
            {
                "from": request.sid,
                "candidate": data["candidate"]
            },
            to=data["to"]
        )

    @socketio.on("leave-room")
    def handle_leave(data):
        room_id = str(data.get("room_id", ""))
        sid = request.sid

        if not room_id:
            return

        leave_room(room_id)

        if room_id in room_users and sid in room_users[room_id]:
            room_users[room_id].pop(sid)

            if not room_users[room_id]:
                del room_users[room_id]

        socketio.emit("user-left", {"socket_id": sid}, room=room_id)

        emit_presence_counts(socketio)

    @socketio.on("disconnect")
    def handle_disconnect():
        sid = request.sid

        if sid in online_users:
            online_users.pop(sid)

        for room_id, users in list(room_users.items()):
            if sid in users:
                users.pop(sid)

                socketio.emit("user-left", {"socket_id": sid}, room=room_id)

                if not users:
                    del room_users[room_id]

        emit_presence_counts(socketio)