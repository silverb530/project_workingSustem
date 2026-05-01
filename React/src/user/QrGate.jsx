import { useEffect, useState } from 'react'
import axios from 'axios'
import { API_BASE } from '../config'

const S = {
    wrap: {
        padding: '32px',
        fontFamily: "'Pretendard', 'Apple SD Gothic Neo', sans-serif",
    },
    inner: {
        maxWidth: '600px',
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
        background: '#2563eb',
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
            : 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)',
        color: disabled ? '#9ca3af' : '#fff',
        transition: 'all 0.18s',
        boxShadow: disabled ? 'none' : '0 4px 12px rgba(37,99,235,0.3)',
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
    guideBox: {
        marginTop: '14px',
        padding: '12px 14px',
        borderRadius: '10px',
        background: '#f8fafc',
        color: '#64748b',
        fontSize: '13px',
        lineHeight: 1.6,
        border: '1px solid #e2e8f0',
        textAlign: 'center',
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
    tabs: { //qr 인식 때 추가
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
        background: active ? '#fff' : 'transparent',
        color: active ? '#1a1d23' : '#6b7280',
        boxShadow: active ? '0 1px 4px rgba(0,0,0,0.09)' : 'none',
    }),
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
}

const getStatusType = (status) => {
    if (!status) return null
    if (status.startsWith('✅')) return 'success'
    if (status.startsWith('❌')) return 'fail'
    return 'loading'
}

function QrGate() {
    const [tab, setTab] = useState('check')
    const [mode, setMode] = useState(null)
    const [status, setStatus] = useState('')
    const [isScanning, setIsScanning] = useState(false)
    const [logs, setLogs] = useState([])

    const user = JSON.parse(sessionStorage.getItem('user') || '{}')

    useEffect(() => {
        if (tab === 'record' && user?.employee_id) {
            fetchLogs()
        }
    }, [tab])

    const fetchLogs = async () => {
        try {
            const res = await axios.get(
                `${API_BASE}/api/attendance/my?employee_id=${user.employee_id}`
            )
            setLogs(Array.isArray(res.data) ? res.data : [])
        } catch (err) {
            console.error(err)
            setLogs([])
        }
    }

    const handleQrScan = async () => {
        if (!mode) {
            alert('출근 또는 퇴근을 먼저 선택하세요!')
            return
        }

        setIsScanning(true)
        setStatus('QR 인식 중...')

        try {
            const res = await axios.post(`${API_BASE}/api/attendance/qr-scan`, {
                mode,
            })

            const data = res.data

            if (data.result === 'success' || data.success === true) {
                setStatus(`✅ ${data.employee?.name || '직원'}님 ${data.message}`)
            } else {
                setStatus(`❌ ${data.message || 'QR 인식에 실패했습니다.'}`)
            }
        } catch (err) {
            console.error(err)

            const message =
               err.response?.data?.message ||
               'QR 인식 중 서버 오류가 발생했습니다.'

            setStatus(`❌ ${message}`)
        }

        setIsScanning(false)
    }

    return (
        <>
            <style>{`
                @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
                .qr-mode-btn:hover { opacity: 0.85; }
                .qr-verify-btn:hover:not(:disabled) {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 16px rgba(37,99,235,0.38) !important;
                }
            `}</style>

            <div style={S.wrap}>
                <div style={S.inner}>
                    <div className="team-page-header" style={{ marginBottom: 24 }}>
                        <div>
                            <h1 className="team-page-title">QR 출퇴근</h1>
                            <p className="team-page-desc">
                                직원별 고유 QR 코드를 카메라로 인식하여 출근/퇴근을 처리합니다.
                            </p>
                        </div>
                    </div>

                    <div style={S.tabs}>
                        {[
                            ['check', '출 / 퇴근 체크'],
                            ['record', '내 출근 기록'],
                        ].map(([id, label]) => (
                            <button
                                key={id}
                                style={S.tab(tab === id)}
                                onClick={() => setTab(id)}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {tab === 'check' && (
                        <div style={S.card}>
                            <div style={S.cardTitle}>
                                <span style={S.dot} />
                                QR 카메라
                            </div>

                            <div style={S.camBox}>
                                <img
                                    src={`${API_BASE}/api/camera/feed`}
                                    alt="qr-camera"
                                    style={S.camImg}
                                />

                                <div style={S.liveBadge}>
                                    <div style={S.liveDot} />
                                    QR LIVE
                                </div>
                            </div>

                            <div style={S.modeRow}>
                                <button
                                    className="qr-mode-btn"
                                    style={S.modeBtn(mode === '출근', '#2563eb')}
                                    onClick={() => setMode('출근')}
                                >
                                    🌅 출근
                                </button>

                                <button
                                    className="qr-mode-btn"
                                    style={S.modeBtn(mode === '퇴근', '#dc2626')}
                                    onClick={() => setMode('퇴근')}
                                >
                                    🌙 퇴근
                                </button>
                            </div>

                            <button
                                className="qr-verify-btn"
                                style={S.verifyBtn(isScanning)}
                                onClick={handleQrScan}
                                disabled={isScanning}
                            >
                                {isScanning ? '⏳ QR 인식 중...' : 'QR 인식'}
                            </button>

                            {status && (
                                <div style={S.statusBox(getStatusType(status))}>
                                    {status}
                                </div>
                            )}

                            <div style={S.guideBox}>
                                직원 QR 코드를 카메라 중앙에 맞추고 출근/퇴근을 선택한 뒤 QR 인식을 누르세요.
                            </div>
                        </div>
                    )}

                    {tab === 'record' && (
                        <div style={S.card}>
                            <div style={S.cardTitle}>
                                <span style={S.dot} />
                                출근 기록
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
                                            <td colSpan={3} style={S.emptyRow}>
                                                기록이 없습니다
                                            </td>
                                        </tr>
                                    ) : (
                                        logs.map((log, i) => (
                                            <tr key={i}>
                                                <td style={S.td}>{log.work_date}</td>
                                                <td style={S.td}>
                                                    {log.check_in_time ? (
                                                        <span style={S.badge('출근')}>
                                                            {log.check_in_time.slice(11, 16)}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#d1d5db' }}>-</span>
                                                    )}
                                                </td>
                                                <td style={S.td}>
                                                    {log.check_out_time ? (
                                                        <span style={S.badge('퇴근')}>
                                                            {log.check_out_time.slice(11, 16)}
                                                        </span>
                                                    ) : (
                                                        <span style={{ color: '#d1d5db' }}>-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default QrGate