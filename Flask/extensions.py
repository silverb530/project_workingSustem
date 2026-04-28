_socketio = None


def set_socketio(sio):
    global _socketio
    _socketio = sio


def get_socketio():
    return _socketio
