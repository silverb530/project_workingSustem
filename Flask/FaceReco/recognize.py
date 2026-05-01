from flask import Blueprint, jsonify, request
from db import execute_query
from insightface.app import FaceAnalysis
import numpy as np
import cv2, os

recognize_bp = Blueprint("recognize", __name__)

face_app = FaceAnalysis(name='buffalo_l', providers=['CPUExecutionProvider'])
face_app.prepare(ctx_id=0, det_size=(160, 160))

known_embeddings = []
known_ids = []
THRESHOLD = 0.5
CACHE_FILE = "employees/embeddings_cache.npz"


def load_employees():
    global known_embeddings, known_ids
    known_embeddings = []
    known_ids = []

    if os.path.exists(CACHE_FILE):
        data = np.load(CACHE_FILE, allow_pickle=True)
        known_embeddings = list(data['embeddings'])
        known_ids = list(data['ids'])
        print(f"[INFO] 캐시에서 {len(known_ids)}명 로드 완료: {known_ids}")
        return

    _build_embeddings()


def _build_embeddings():
    global known_embeddings, known_ids
    known_embeddings = []
    known_ids = []
    emp_dir = "employees"
    if not os.path.exists(emp_dir):
        print("[WARN] employees 디렉토리가 없습니다.")
        return
    for emp_id in os.listdir(emp_dir):
        person_dir = os.path.join(emp_dir, emp_id)
        if not os.path.isdir(person_dir):
            continue
        embeddings = []
        for img_file in os.listdir(person_dir):
            if not img_file.endswith('.jpg'):
                continue
            img = cv2.imread(os.path.join(person_dir, img_file))
            if img is None:
                continue
            faces = face_app.get(img)
            if faces:
                emb = faces[0].embedding
                if emb is not None:
                    embeddings.append(emb)
        valid = [e for e in embeddings if e is not None]
        if valid:
            known_embeddings.append(np.mean(valid, axis=0))
            known_ids.append(emp_id)

    if known_ids:
        np.savez(CACHE_FILE, embeddings=known_embeddings, ids=known_ids)
    print(f"[INFO] 총 {len(known_ids)}명 임베딩 계산 및 캐시 저장 완료: {known_ids}")


def rebuild_employees():
    if os.path.exists(CACHE_FILE):
        os.remove(CACHE_FILE)
        print("[INFO] 임베딩 캐시 삭제됨 - 재빌드 시작")
    _build_embeddings()


def cosine_similarity(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))


@recognize_bp.route('/api/face/check-registered', methods=['GET'])
def check_registered():
    employee_id = request.args.get('employee_id')
    result = execute_query(
        "SELECT * FROM employee_faces WHERE employee_id = %s AND is_active = 1",
        (employee_id,)
    )
    if result:
        return jsonify({"registered": True})
    return jsonify({"registered": False})


@recognize_bp.route('/api/face/verify', methods=['POST'])
def verify_face():
    session_employee_id = str(request.form.get('employee_id'))
    file = request.files.get('image')

    if not file:
        return jsonify({"result": "fail", "message": "이미지가 전송되지 않았습니다."}), 400

    nparr = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({"result": "fail", "message": "이미지 디코딩 실패"}), 400

    h, w = frame.shape[:2]
    if max(h, w) > 640:
        scale = 640 / max(h, w)
        frame = cv2.resize(frame, (int(w * scale), int(h * scale)))

    faces = face_app.get(frame)
    print(f"[DEBUG] 감지된 얼굴 수: {len(faces)}, 등록 직원 수: {len(known_ids)}")

    if not faces:
        return jsonify({"result": "fail", "message": "얼굴을 인식할 수 없습니다."})

    embedding = faces[0].embedding
    best_score = 0
    best_id = None

    for i, known_emb in enumerate(known_embeddings):
        score = cosine_similarity(embedding, known_emb)
        print(f"[DEBUG] {known_ids[i]} 유사도: {score:.4f}")
        if score > best_score:
            best_score = score
            best_id = known_ids[i]

    print(f"[DEBUG] 최고 유사도: {best_score:.4f}, 매칭 ID: {best_id}, 세션 ID: {session_employee_id}")

    if best_score < THRESHOLD or best_id is None:
        return jsonify({"result": "fail", "message": f"얼굴 인식 실패 (유사도: {best_score:.2f})"})

    if best_id != session_employee_id:
        return jsonify({"result": "fail", "message": "본인 얼굴이 아닙니다."})

    user = execute_query(
        "SELECT employee_id, name FROM employees WHERE employee_id = %s",
        (best_id,)
    )
    if not user:
        return jsonify({"result": "fail", "message": "직원 정보를 찾을 수 없습니다."})

    return jsonify({
        "result": "success",
        "employee_id": user[0]['employee_id'],
        "name": user[0]['name'],
        "score": round(float(best_score), 4)
    })


@recognize_bp.route('/api/face/identify', methods=['POST'])
def identify_face():
    file = request.files.get('image')

    if not file:
        return jsonify({"result": "fail", "message": "이미지가 전송되지 않았습니다."}), 400

    nparr = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({"result": "fail", "message": "이미지 디코딩 실패"}), 400

    faces = face_app.get(frame)
    if not faces:
        return jsonify({"result": "fail", "message": "얼굴을 인식할 수 없습니다."})

    embedding = faces[0].embedding
    best_score = 0
    best_id = None

    for i, known_emb in enumerate(known_embeddings):
        score = cosine_similarity(embedding, known_emb)
        if score > best_score:
            best_score = score
            best_id = known_ids[i]

    if best_score < THRESHOLD or best_id is None:
        return jsonify({"result": "fail", "message": f"등록되지 않은 얼굴입니다. (유사도: {best_score:.2f})"})

    user = execute_query(
        "SELECT employee_id, name FROM employees WHERE employee_id = %s",
        (best_id,)
    )
    if not user:
        return jsonify({"result": "fail", "message": "직원 정보를 찾을 수 없습니다."})

    return jsonify({
        "result": "success",
        "employee_id": user[0]['employee_id'],
        "name": user[0]['name']
    })


@recognize_bp.route('/api/face/reload', methods=['POST'])
def reload_face_db():
    load_employees()
    return jsonify({"result": "success", "count": len(known_ids)})
