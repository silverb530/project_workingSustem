import subprocess
import time
import re
import json

VNC_PORT   = 5900
VNC_HOST   = "192.168.0.101"
FLASK_PORT = 5000
NOVNC_PORT = 6080
NOVNC_PATH = "./novnc"

urls = {}

def run(cmd, label):
    print(f"[시작] {label}")
    proc = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    return proc

def extract_tunnel_url(proc, label, timeout=30):
    start = time.time()
    while time.time() - start < timeout:
        line = proc.stdout.readline()
        if not line:
            continue
        match = re.search(r'https://[a-zA-Z0-9\-]+\.trycloudflare\.com', line)
        if match:
            url = match.group(0)
            print(f"[URL] {label} → {url}")
            return url
    print(f"[경고] {label} URL 추출 실패")
    return None

if __name__ == "__main__":
    print("=" * 50)
    print("  WorkFlow 원격 접속 서버 시작")
    print("=" * 50)

    ws_proc = run(
        ['python', '-m', 'websockify', str(NOVNC_PORT),
         f'{VNC_HOST}:{VNC_PORT}', '--web', NOVNC_PATH],
        "websockify (noVNC)"
    )
    time.sleep(1)

    flask_proc = run(['python', 'app.py'], "Flask 서버")
    time.sleep(2)

    cf_flask = run(
        ['cloudflared', 'tunnel', '--url', f'http://localhost:{FLASK_PORT}'],
        "Cloudflare (Flask API)"
    )
    urls['api'] = extract_tunnel_url(cf_flask, "Flask API")

    cf_novnc = run(
        ['cloudflared', 'tunnel', '--url', f'http://localhost:{NOVNC_PORT}'],
        "Cloudflare (noVNC)"
    )
    urls['novnc'] = extract_tunnel_url(cf_novnc, "noVNC")

    # URL을 파일로 저장
    with open('urls.json', 'w') as f:
        json.dump(urls, f)
    print("[저장] urls.json 저장 완료")

    print("\n" + "=" * 50)
    print("  접속 정보")
    print("=" * 50)
    print(f"  Flask API : {urls.get('api',  '추출 실패')}")
    print(f"  noVNC     : {urls.get('novnc','추출 실패')}")
    print("=" * 50)
    print("\n  종료하려면 Ctrl+C\n")

    try:
        while True:
            time.sleep(5)
    except KeyboardInterrupt:
        print("\n[종료] 서버를 종료합니다...")
        for proc in [ws_proc, flask_proc, cf_flask, cf_novnc]:
            proc.terminate()
        print("[완료] 모든 프로세스 종료")