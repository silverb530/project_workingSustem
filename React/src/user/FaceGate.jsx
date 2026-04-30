import { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000';

const S = {
    wrap: {
        padding: '32px',
        fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
    },
    inner: {
        maxWidth: '600px',
    },
    header: {
        marginBottom: '28px',
    },
    title: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#1a1d23',
        margin: 0,
    },
    subtitle: {
        fontSize: '13px',
        color: '#8b8fa8',
        marginTop: '4px',
    },
    tabs: {
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        background: '#e5e7eb',
        borderRadius: '10px',
        padding: '4px',
    },
    tab: (active) => ({
        flex: 1,
        padding: '9px 0',
        borderRadius: '7px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: '600',
        transition: 'all 0.18s',
        background: active ? '#fff' : 'transparent',
        color: active ? '#1a1d23' : '#6b7280',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.09)' : 'none',
    }),
    card: {
        background: '#fff',
        borderRadius: '16px',
        padding: '28px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
        border: '1px solid #eef0f5',
        marginBottom: '20px',
    },
    camBox: {
        position: 'relative',
        width: '100%',
        aspectRatio: '4/3',
        background: '#0d1117',
        borderRadius: '12px',
        overflow: 'hidden',
    },
    camImg: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
    },
    liveBadge: {
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: '#ef4444',
        color: '#fff',
        fontSize: '10px',
        fontWeight: '700',
        padding: '3px 8px',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        gap: '5px',
    },
    liveDot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: '#fff',
        animation: 'blink 1.2s ease-in-out infinite',
    },
    modeRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginTop: '20px',
    },
    modeBtn: (active, color) => ({
        padding: '14px 0',
        borderRadius: '10px',
        border: `2px solid ${active ? color : '#e5e7eb'}`,
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: '700',
        background: active ? color + '15' : '#fafafa',
        color: active ? color : '#6b7280',
        transition: 'all 0.15s',
    }),
    verifyBtn: (disabled) => ({
        width: '100%',
        marginTop: '14px',
        padding: '14px 0',
        borderRadius: '10px',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '15px',
        fontWeight: '700',
        background: disabled
            ? '#e5e7eb'
            : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: disabled ? '#9ca3af' : '#fff',
        transition: 'all 0.18s',
        boxShadow: disabled ? 'none' : '0 4px 12px rgba(59,130,246,0.3)',
    }),
    statusBox: (type) => ({
        marginTop: '14px',
        padding: '12px 16px',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '600',
        background: type === 'success' ? '#f0fdf4' : type === 'fail' ? '#fef2f2' : '#f8fafc',
        color: type === 'success' ? '#16a34a' : type === 'fail' ? '#dc2626' : '#475569',
        border: `1px solid ${type === 'success' ? '#bbf7d0' : type === 'fail' ? '#fecaca' : '#e2e8f0'}`,
        textAlign: 'center',
    }),
    cardTitle: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#1a1d23',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    dot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        background: '#3b82f6',
        display: 'inline-block',
        flexShrink: 0,
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        padding: '10px 14px',
        fontSize: '12px',
        fontWeight: '600',
        color: '#6b7280',
        textAlign: 'center',
        borderBottom: '2px solid #f3f4f6',
    },
    td: {
        padding: '12px 14px',
        fontSize: '13px',
        color: '#374151',
        borderBottom: '1px solid #f3f4f6',
        textAlign: 'center',
    },
    badge: (type) => ({
        display: 'inline-block',
        padding: '3px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '700',
        background: type === '출근' ? '#dbeafe' : '#fce7f3',
        color: type === '출근' ? '#1d4ed8' : '#be185d',
    }),
    emptyRow: {
        textAlign: 'center',
        padding: '32px',
        color: '#9ca3af',
        fontSize: '13px',
    },
}

const getStatusType = (status) => {
    if (!status) return null;
    if (status.startsWith('✅')) return 'success';
    if (status.startsWith('❌')) return 'fail';
    return 'loading';
}

function FaceGate() {
    const [tab, setTab] = useState('check');
    const [mode, setMode] = useState(null);
    const [status, setStatus] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [logs, setLogs] = useState([]);

    const user = JSON.parse(localStorage.getItem('user'));

    useEffect(() => {
        if (tab === 'record') {
            axios.get(`${API}/api/attendance/my?employee_id=${user.employee_id}`)
                .then(res => setLogs(res.data));
        }
    }, [tab]);

    const captureSnapshot = async () => {
        const res = await fetch(`${API}/api/camera/feed/snapshot?t=${Date.now()}`);
        if (!res.ok) throw new Error('스냅샷 요청 실패');
        return await res.blob();
    };

    const handleVerify = async () => {
        if (!mode) return alert('출근 또는 퇴근을 먼저 선택하세요!');

        const check = await axios.get(`${API}/api/face/check-registered?employee_id=${user.employee_id}`);
        if (!check.data.registered) {
            alert('등록된 얼굴이 없습니다. 얼굴 등록 먼저 해주세요!');
            return;
        }

        setIsVerifying(true);
        setStatus('얼굴 인식 중...');

        try {
            const imageBlob = await captureSnapshot();
            const formData = new FormData();
            formData.append('image', imageBlob, 'snapshot.jpg');
            formData.append('employee_id', user.employee_id);

            const verify = await axios.post(`${API}/api/face/verify`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (verify.data.result !== 'success') {
                setStatus('❌ ' + verify.data.message);
                setIsVerifying(false);
                return;
            }

            const url = mode === '출근' ? '/api/attendance/checkin' : '/api/attendance/checkout';
            const result = await axios.post(`${API}${url}`, {
                employee_id: verify.data.employee_id
            });
            setStatus(result.data.result === 'success'
                ? `✅ ${verify.data.name}님 ${result.data.message} (유사도: ${Math.round(verify.data.score * 100)}%)`
                : '❌ ' + result.data.message
            );
        } catch (err) {
            console.error(err);
            setStatus('❌ 서버 오류');
        }

        setIsVerifying(false);
    };

    return (
        <>
            <style>{`
                @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
                @keyframes scanPulse { 0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,0.5);border-color:#3b82f6;} 50%{box-shadow:0 0 0 8px rgba(59,130,246,0);border-color:#60a5fa;} }
                @keyframes scanLine { 0%{top:0%} 100%{top:100%} }
                .fg-mode-btn:hover { opacity: 0.85; }
                .fg-verify-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(59,130,246,0.38) !important; }
            `}</style>

            <div style={S.wrap}>
              <div style={S.inner}>
                <div className="team-page-header" style={{ marginBottom: 24 }}>
                    <div>
                        <h1 className="team-page-title">안면인식 출퇴근</h1>
                        <p className="team-page-desc">👤 {user?.name} · {user?.employee_id}</p>
                    </div>
                </div>

                <div style={S.tabs}>
                    {[['check', '출 / 퇴근 체크'], ['record', '내 출근 기록']].map(([id, label]) => (
                        <button key={id} style={S.tab(tab === id)} onClick={() => setTab(id)}>
                            {label}
                        </button>
                    ))}
                </div>

                {tab === 'check' && (
                    <div style={S.card}>
                        <div style={S.cardTitle}>
                            <span style={S.dot} />카메라
                        </div>

                        <div style={S.camBox}>
                            <img
                                src={`${API}/api/camera/feed`}
                                alt="camera"
                                style={S.camImg}
                            />
                            <div style={S.liveBadge}>
                                <div style={S.liveDot} />
                                LIVE
                            </div>
                            {isVerifying && (
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    border: '3px solid #3b82f6',
                                    borderRadius: '12px',
                                    background: 'rgba(59,130,246,0.06)',
                                    animation: 'scanPulse 1.2s ease-in-out infinite',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <div style={{
                                        position: 'absolute', left: 0, right: 0, height: '2px',
                                        background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)',
                                        animation: 'scanLine 1.2s linear infinite',
                                    }} />
                                    <span style={{
                                        color: '#fff', fontSize: '13px', fontWeight: '700',
                                        background: 'rgba(0,0,0,0.65)',
                                        padding: '6px 14px', borderRadius: '8px',
                                    }}>
                                        얼굴 인식 중...
                                    </span>
                                </div>
                            )}
                        </div>

                        <div style={S.modeRow}>
                            <button
                                className="fg-mode-btn"
                                style={S.modeBtn(mode === '출근', '#2563eb')}
                                onClick={() => setMode('출근')}
                            >
                                🌅 출근
                            </button>
                            <button
                                className="fg-mode-btn"
                                style={S.modeBtn(mode === '퇴근', '#dc2626')}
                                onClick={() => setMode('퇴근')}
                            >
                                🌙 퇴근
                            </button>
                        </div>

                        <button
                            className="fg-verify-btn"
                            style={S.verifyBtn(isVerifying)}
                            onClick={handleVerify}
                            disabled={isVerifying}
                        >
                            {isVerifying ? '⏳ 인식 중...' : '얼굴 인식'}
                        </button>

                        {status && (
                            <div style={S.statusBox(getStatusType(status))}>
                                {status}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'record' && (
                    <div style={S.card}>
                        <div style={S.cardTitle}>
                            <span style={S.dot} />출근 기록
                        </div>
                        <table style={S.table}>
                            <thead>
                                <tr>
                                    <th style={S.th}>날짜</th>
                                    <th style={S.th}>출근</th>
                                    <th style={S.th}>퇴근</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={3} style={S.emptyRow}>기록이 없습니다</td>
                                    </tr>
                                ) : logs.map((log, i) => (
                                    <tr key={i}>
                                        <td style={S.td}>{log.work_date}</td>
                                        <td style={S.td}>
                                            {log.check_in_time
                                                ? <span style={S.badge('출근')}>{log.check_in_time.slice(11, 16)}</span>
                                                : <span style={{ color: '#d1d5db' }}>-</span>}
                                        </td>
                                        <td style={S.td}>
                                            {log.check_out_time
                                                ? <span style={S.badge('퇴근')}>{log.check_out_time.slice(11, 16)}</span>
                                                : <span style={{ color: '#d1d5db' }}>-</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
              </div>
            </div>
        </>
    );
}

export default FaceGate;
