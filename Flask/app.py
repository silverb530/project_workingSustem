from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import subprocess
import psutil
import sqlite3
import os
import json
from datetime import datetime

app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    }
})

websockify_proc = None
DB_PATH       = 'remote_work.db'
UPLOAD_FOLDER = 'C:\\remote_uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur  = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS access_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip TEXT, status TEXT, created_at TEXT
        )
    ''')
    conn.commit()
    conn.close()

def log_access(ip, status):
    conn = sqlite3.connect(DB_PATH)
    cur  = conn.cursor()
    cur.execute(
        'INSERT INTO access_logs (ip, status, created_at) VALUES (?, ?, ?)',
        (ip, status, datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
    )
    conn.commit()
    conn.close()

@app.route('/api/urls', methods=['GET'])
def get_urls():
    try:
        with open('urls.json', 'r') as f:
            urls = json.load(f)
        return jsonify(urls)
    except:
        return jsonify({ 'error': 'urls.json 없음' }), 500

@app.route('/api/remote/start', methods=['POST'])
def start_remote():
    global websockify_proc
    if websockify_proc and websockify_proc.poll() is None:
        return jsonify({ 'status': 'already_running' })
    try:
        websockify_proc = subprocess.Popen(
            ['python', '-m', 'websockify', '6080',
             'localhost:5900', '--web', './novnc'],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )
        ip = request.remote_addr
        log_access(ip, 'connected')
        subprocess.Popen([
            'powershell', '-Command',
            f'Add-Type -AssemblyName System.Windows.Forms; '
            f'[System.Windows.Forms.MessageBox]::Show('
            f'"RPi({ip})에서 원격 접속했습니다", "원격 접속 알림")'
        ])
        return jsonify({ 'status': 'started' })
    except Exception as e:
        return jsonify({ 'error': str(e) }), 500

@app.route('/api/remote/stop', methods=['POST'])
def stop_remote():
    global websockify_proc
    if websockify_proc and websockify_proc.poll() is None:
        websockify_proc.terminate()
        websockify_proc = None
        ip = request.remote_addr
        log_access(ip, 'disconnected')
        return jsonify({ 'status': 'stopped' })
    return jsonify({ 'status': 'not_running' })

@app.route('/api/remote/status', methods=['GET'])
def remote_status():
    global websockify_proc
    running = websockify_proc is not None and websockify_proc.poll() is None
    return jsonify({ 'running': running })

@app.route('/api/log/list', methods=['GET'])
def get_logs():
    conn = sqlite3.connect(DB_PATH)
    cur  = conn.cursor()
    cur.execute('SELECT * FROM access_logs ORDER BY id DESC LIMIT 50')
    rows = cur.fetchall()
    conn.close()
    return jsonify({ 'logs': [
        { 'id': r[0], 'ip': r[1], 'status': r[2], 'created_at': r[3] }
        for r in rows
    ]})

@app.route('/api/pc/files', methods=['GET'])
def list_pc_files():
    path = request.args.get('path', 'C:\\')
    try:
        items = os.listdir(path)
        result = []
        for item in items:
            full_path = os.path.join(path, item)
            try:
                result.append({
                    'name'    : item,
                    'path'    : full_path,
                    'is_dir'  : os.path.isdir(full_path),
                    'size'    : os.path.getsize(full_path) if not os.path.isdir(full_path) else 0,
                    'modified': datetime.fromtimestamp(
                        os.path.getmtime(full_path)
                    ).strftime('%Y-%m-%d %H:%M:%S')
                })
            except:
                pass
        return jsonify({ 'files': result, 'current_path': path })
    except Exception as e:
        return jsonify({ 'error': str(e) }), 500

@app.route('/api/pc/download', methods=['GET'])
def download_pc_file():
    path     = request.args.get('path')
    folder   = os.path.dirname(path)
    filename = os.path.basename(path)
    return send_from_directory(folder, filename, as_attachment=True)

@app.route('/api/pc/upload', methods=['POST'])
def upload_to_pc():
    path = request.args.get('path', UPLOAD_FOLDER)
    if 'file' not in request.files:
        return jsonify({ 'error': '파일 없음' }), 400
    file = request.files['file']
    save_path = os.path.join(path, file.filename)
    file.save(save_path)
    return jsonify({ 'status': 'uploaded', 'filename': file.filename })

@app.route('/api/system/info', methods=['GET'])
def system_info():
    return jsonify({
        'cpu':    psutil.cpu_percent(interval=1),
        'memory': psutil.virtual_memory().percent,
        'disk':   psutil.disk_usage('C:\\').percent,
    })

if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)