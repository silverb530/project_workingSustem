import subprocess
import sys
from config import NOVNC_PATH
from log_db import log_access

websockify_proc = None


def start_remote(ip):
    global websockify_proc

    if websockify_proc and websockify_proc.poll() is None:
        return {"status": "already_running"}, 200

    try:
        websockify_proc = subprocess.Popen(
            [
                sys.executable,
                "-m",
                "websockify",
                "6080",
                "localhost:5900",
                "--web",
                NOVNC_PATH
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

        log_access(ip, "connected")

        subprocess.Popen([
            "powershell",
            "-Command",
            f'Add-Type -AssemblyName System.Windows.Forms; '
            f'[System.Windows.Forms.MessageBox]::Show("RPi({ip})에서 원격 접속했습니다", "원격 접속 알림")'
        ])

        return {"status": "started"}, 200

    except Exception as e:
        return {"error": str(e)}, 500


def stop_remote(ip):
    global websockify_proc

    if websockify_proc and websockify_proc.poll() is None:
        websockify_proc.terminate()
        websockify_proc = None
        log_access(ip, "disconnected")
        return {"status": "stopped"}, 200

    return {"status": "not_running"}, 200


def get_remote_status():
    global websockify_proc
    running = websockify_proc is not None and websockify_proc.poll() is None
    return {"running": running}, 200