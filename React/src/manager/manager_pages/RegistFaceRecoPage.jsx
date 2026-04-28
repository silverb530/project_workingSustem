import { useState, useEffect, useRef } from 'react'
import '../App_manager.css'

const API = 'http://localhost:5000';
const S = {
    page: {
        padding: '28px 32px',
        fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
    },
    title: { fontSize: '22px', fontWeight: '700', color: '#1a1d23', margin: 0 },
    desc: { fontSize: '13px', color: '#8b8fa8', marginTop: '4px', marginBottom: '28px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' },
    card: {
        background: '#fff', borderRadius: '16px', padding: '28px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)', border: '1px solid #eef0f5',
    },
    cardTitle: {
        fontSize: '15px', fontWeight: '700', color: '#1a1d23',
        marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px',
    },
    dot: { width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' },
    camBox: {
        position: 'relative', width: '100%', aspectRatio: '4/3',
        background: '#0d1117', borderRadius: '12px', overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    camImg: { width: '100%', height: '100%', objectFit: 'cover', display: 'block' },
    liveBadge: {
        position: 'absolute', top: '12px', left: '12px',
        background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: '700',
        padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '5px',
    },
    progressBar: {
        width: '100%', height: '6px', background: '#e5e7eb',
        borderRadius: '999px', marginTop: '14px', overflow: 'hidden',
    },
    progressFill: {
        height: '100%', background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
        borderRadius: '999px', transition: 'width 0.3s ease',
    },
    progressLabel: { fontSize: '12px', color: '#6b7280', marginTop: '6px', textAlign: 'center' },
    camControls: { display: 'flex', gap: '10px', marginTop: '14px' },
    formGroup: { marginBottom: '16px' },
    label: { display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' },
    required: { color: '#ef4444', marginLeft: '3px' },
    input: {
        width: '100%', padding: '10px 14px', borderRadius: '8px',
        border: '1.5px solid #e5e7eb', fontSize: '14px', color: '#1a1d23',
        background: '#fafafa', outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.15s, box-shadow 0.15s',
    },
    btnRow: { display: 'flex', gap: '10px', marginTop: '24px' },
    btnPrimary: {
        flex: 1, padding: '11px 0',
        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: '#fff', border: 'none', borderRadius: '8px',
        fontSize: '14px', fontWeight: '600', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    },
    btnSecondary: {
        flex: 1, padding: '11px 0', background: '#f3f4f6', color: '#374151',
        border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
    },
    toast: {
        position: 'fixed', bottom: '32px', left: '50%', transform: 'translateX(-50%)',
        color: '#fff', padding: '12px 24px', borderRadius: '10px',
        fontSize: '14px', fontWeight: '500', zIndex: 9999,
        display: 'flex', alignItems: 'center', gap: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    },
    errorText: { color: '#ef4444', fontSize: '12px', marginTop: '4px' },
}

const CAPTURE_MAX = 100

function RegistFaceRecoPage() {
    const [streaming, setStreaming] = useState(false)
    const [capturing, setCapturing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [done, setDone] = useState(false)
    const [form, setForm] = useState({ name: '', empId: '' })
    const [errors, setErrors] = useState({})
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [toast, setToast] = useState(null)
    const pollRef = useRef(null)
    const imgRef = useRef(null)

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type })
        setTimeout(() => setToast(null), 2800)
    }

    const stopPolling = () => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }

    useEffect(() => () => stopPolling(), [])

    const startStream = () => {
        setStreaming(true)
        setDone(false)
        setProgress(0)
    }

    const reset = () => {
        stopPolling()
        setStreaming(false)
        setCapturing(false)
        setDone(false)
        setProgress(0)
        setErrors({})
        if (imgRef.current) imgRef.current.src = ''
    }

    const startCapture = async () => {
        const e = {}
        if (!form.name.trim()) e.name = '이름을 입력해주세요'
        if (!form.empId.trim()) e.empId = '사번을 입력해주세요'
        setErrors(e)
        if (Object.keys(e).length > 0) return

        try {
            const res = await fetch(`${API}/api/face/register/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: form.empId }),
            })
            if (res.status === 404) {
                const data = await res.json()
                showToast(data.error || '존재하지 않는 사번입니다.', 'error')
                return
            }
            if (!res.ok) throw new Error()
            setCapturing(true)
            setProgress(0)
            showToast('촬영을 시작합니다! 카메라를 바라봐 주세요.')

            pollRef.current = setInterval(async () => {
                try {
                    const sr = await fetch(`${API}/api/face/register/status`)
                    const data = await sr.json()
                    const pct = Math.round((data.count / CAPTURE_MAX) * 100)
                    setProgress(pct)
                    if (!data.capturing && data.count >= CAPTURE_MAX) {
                        stopPolling()
                        setCapturing(false)
                        setDone(true)
                        setStreaming(false)
                        if (imgRef.current) imgRef.current.src = ''
                        showToast('촬영이 완료되었습니다! 등록을 확정해주세요.')
                    }
                } catch { /* 무시 */ }
            }, 500)
        } catch {
            showToast('서버 연결 오류', 'error')
        }
    }

    const handleRegister = async () => {
        setIsSubmitting(true)
        try {
            const res = await fetch(`${API}/api/face/register/confirm`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: form.empId, name: form.name }),
            })
            if (!res.ok) throw new Error()
            const name = form.name
            setForm({ name: '', empId: '' })
            setDone(false)
            setProgress(0)
            showToast(`${name} 님 등록 완료!`)
        } catch {
            showToast('서버 갱신 오류 - 서버를 재시작해주세요.', 'error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
            <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes slideUp{from{transform:translateX(-50%) translateY(10px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
        .rfrp-input:focus{border-color:#3b82f6!important;box-shadow:0 0 0 3px rgba(59,130,246,0.12)!important;}
        .rfrp-btn-p:hover:not(:disabled){opacity:0.88;transform:translateY(-1px);}
        .rfrp-btn-s:hover{background:#e5e7eb!important;}
      `}</style>

            <div style={S.page}>
                <div className="att-page-header" style={{ marginBottom: 28 }}>
                    <div>
                        <h1 className="att-page-title">얼굴 인식 등록</h1>
                        <p className="att-page-date">서버 카메라로 직원 얼굴을 촬영하여 출입 인식 DB에 등록합니다.</p>
                    </div>
                </div>

                <div style={S.grid}>
                    {/* 카메라 카드 */}
                    <div style={S.card}>
                        <div style={S.cardTitle}><span style={S.dot} />카메라 스트림</div>

                        <div style={S.camBox}>
                            {streaming ? (
                                <>
                                    <img
                                        ref={imgRef}
                                        src={`${API}/api/face/register/feed`}
                                        style={S.camImg}
                                        alt="카메라 스트림"
                                    />
                                    <div style={S.liveBadge}>
                                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#fff', animation: 'blink 1.2s ease-in-out infinite' }} />
                                        LIVE
                                    </div>
                                </>
                            ) : done ? (
                                <div style={{ textAlign: 'center', color: '#fff' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>✅</div>
                                    <div style={{ fontSize: '14px', fontWeight: '600' }}>촬영 완료!</div>
                                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>아래에서 등록을 확정해주세요</div>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', color: '#4a5568' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '12px', opacity: 0.5 }}>📷</div>
                                    <p style={{ fontSize: '13px', color: '#6b7280' }}>스트림 시작 버튼을 눌러주세요</p>
                                </div>
                            )}
                        </div>

                        {capturing && (
                            <>
                                <div style={S.progressBar}>
                                    <div style={{ ...S.progressFill, width: `${progress}%` }} />
                                </div>
                                <p style={S.progressLabel}>
                                    촬영 중... {progress}% ({Math.round(progress * CAPTURE_MAX / 100)}/{CAPTURE_MAX}장)
                                </p>
                            </>
                        )}

                        <div style={S.camControls}>
                            {!streaming && !done && (
                                <button style={S.btnPrimary} className="rfrp-btn-p" onClick={startStream}>
                                    📷 스트림 시작
                                </button>
                            )}
                            {capturing && (
                                <button style={{ ...S.btnSecondary, background: '#fee2e2', color: '#dc2626' }} onClick={reset}>
                                    ✕ 취소
                                </button>
                            )}
                        </div>
                    </div>

                    {/* 정보 입력 카드 */}
                    <div style={S.card}>
                        <div style={S.cardTitle}><span style={S.dot} />직원 정보 입력</div>

                        <div style={S.formGroup}>
                            <label style={S.label}>직원 이름<span style={S.required}>*</span></label>
                            <input
                                style={{ ...S.input, ...(errors.name ? { borderColor: '#ef4444' } : {}) }}
                                className="rfrp-input"
                                placeholder="예) 홍길동"
                                value={form.name}
                                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                            />
                            {errors.name && <p style={S.errorText}>{errors.name}</p>}
                        </div>

                        <div style={S.formGroup}>
                            <label style={S.label}>사번 / ID<span style={S.required}>*</span></label>
                            <input
                                style={{ ...S.input, ...(errors.empId ? { borderColor: '#ef4444' } : {}) }}
                                className="rfrp-input"
                                placeholder="예) EMP-0042"
                                value={form.empId}
                                onChange={(e) => setForm((f) => ({ ...f, empId: e.target.value }))}
                            />
                            {errors.empId && <p style={S.errorText}>{errors.empId}</p>}
                        </div>

                        <div style={S.btnRow}>
                            {done ? (
                                <button
                                    style={{ ...S.btnPrimary, opacity: isSubmitting ? 0.7 : 1 }}
                                    className="rfrp-btn-p"
                                    onClick={handleRegister}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? '⏳ 등록 중...' : '✅ 등록 확정'}
                                </button>
                            ) : (
                                <button
                                    style={{ ...S.btnPrimary, opacity: (streaming && !capturing) ? 1 : 0.45, cursor: (streaming && !capturing) ? 'pointer' : 'not-allowed' }}
                                    className="rfrp-btn-p"
                                    onClick={(streaming && !capturing) ? startCapture : undefined}
                                    disabled={!streaming || capturing}
                                >
                                    🎯 촬영 시작
                                </button>
                            )}
                            <button style={S.btnSecondary} className="rfrp-btn-s" onClick={reset}>
                                초기화
                            </button>
                        </div>

                        <div style={{ marginTop: '20px', padding: '14px', background: '#f8f9fc', borderRadius: '10px' }}>
                            <p style={{ fontSize: '12px', fontWeight: '700', color: '#374151', marginBottom: '8px' }}>📋 등록 순서</p>
                            {[
                                ['1', '이름과 사번을 먼저 입력'],
                                ['2', '스트림 시작으로 카메라 연결'],
                                ['3', '촬영 시작으로 100장 자동 촬영'],
                                ['4', '촬영 완료 후 등록 확정'],
                            ].map(([n, t]) => (
                                <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <span style={{
                                        width: '20px', height: '20px', borderRadius: '50%', background: '#3b82f6',
                                        color: '#fff', fontSize: '11px', fontWeight: '700',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                    }}>{n}</span>
                                    <span style={{ fontSize: '12px', color: '#6b7280' }}>{t}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {toast && (
                <div style={{ ...S.toast, background: toast.type === 'error' ? '#dc2626' : '#1a1d23', animation: 'slideUp 0.25s ease' }}>
                    {toast.msg}
                </div>
            )}
        </>
    )
}

export default RegistFaceRecoPage
