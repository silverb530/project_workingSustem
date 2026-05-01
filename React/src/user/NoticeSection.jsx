import { useEffect, useState } from 'react'

const API_BASE = 'http://localhost:5000'

function getAuthToken() {
    return (
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        ''
    )
}

async function apiGet(path) {
    const token = getAuthToken()
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || 'API 요청 실패')
    return data
}

function NoticeSection() {
    const [notices, setNotices] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [selectedNotice, setSelectedNotice] = useState(null)

    useEffect(() => {
        loadNotices()
    }, [])

    async function loadNotices() {
        try {
            setLoading(true)
            setError('')
            const data = await apiGet('/api/notices')
            setNotices(data.notices || [])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const pinnedNotices = notices.filter(n => Number(n.is_pinned) === 1)
    const normalNotices = notices.filter(n => Number(n.is_pinned) !== 1)

    return (
        <div className="content-wrapper">
            {/* 헤더 */}
            <div className="welcome-section">
                <h1>공지사항 📢</h1>
                <p>관리자가 등록한 공지사항을 확인하세요.</p>
            </div>

            {/* 새로고침 버튼 */}
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                    onClick={loadNotices}
                    style={{ background: '#f3f4f6', border: '1px solid #e5e7eb',
                             borderRadius: '8px', padding: '8px 16px',
                             cursor: 'pointer', fontSize: '13px', color: '#374151' }}
                >
                    🔄 새로고침
                </button>
            </div>

            {error && (
                <div className="page-error">{error}</div>
            )}

            {loading && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                    불러오는 중...
                </div>
            )}

            {!loading && notices.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px', color: '#9ca3af' }}>
                    등록된 공지사항이 없습니다.
                </div>
            )}

            {/* 📌 고정 공지 */}
            {!loading && pinnedNotices.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#d97706',
                                marginBottom: '8px', letterSpacing: '0.05em' }}>
                        📌 고정 공지
                    </p>
                    {pinnedNotices.map((n) => (
                        <NoticeCard
                            key={n.notice_id}
                            notice={n}
                            selected={selectedNotice?.notice_id === n.notice_id}
                            onSelect={() =>
                                setSelectedNotice(
                                    selectedNotice?.notice_id === n.notice_id ? null : n
                                )
                            }
                            pinned
                        />
                    ))}
                </div>
            )}

            {/* 일반 공지 */}
            {!loading && normalNotices.length > 0 && (
                <div>
                    <p style={{ fontSize: '12px', fontWeight: 600, color: '#6b7280',
                                marginBottom: '8px', letterSpacing: '0.05em' }}>
                        일반 공지
                    </p>
                    {normalNotices.map((n) => (
                        <NoticeCard
                            key={n.notice_id}
                            notice={n}
                            selected={selectedNotice?.notice_id === n.notice_id}
                            onSelect={() =>
                                setSelectedNotice(
                                    selectedNotice?.notice_id === n.notice_id ? null : n
                                )
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// 공지 카드 컴포넌트
function NoticeCard({ notice: n, selected, onSelect, pinned }) {
    return (
        <div
            onClick={onSelect}
            style={{
                background: selected ? '#faf5ff' : '#fff',
                border: `1px solid ${pinned ? '#fde68a' : '#e5e7eb'}`,
                borderLeft: `4px solid ${pinned ? '#f59e0b' : '#7c3aed'}`,
                borderRadius: '10px',
                padding: '16px 20px',
                marginBottom: '10px',
                cursor: 'pointer',
                transition: 'all 0.15s',
            }}
        >
            {/* 제목 행 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {pinned && (
                    <span style={{ background: '#fef3c7', color: '#d97706',
                                   fontSize: '11px', padding: '2px 6px',
                                   borderRadius: '4px', fontWeight: 600, flexShrink: 0 }}>
                        📌 고정
                    </span>
                )}
                <span style={{ fontWeight: 600, fontSize: '15px', color: '#111827', flex: 1, textAlign: 'left' }}>
    {n.title}
</span>
                <span style={{ fontSize: '12px', color: '#9ca3af', flexShrink: 0 }}>
                    {n.created_at
                        ? new Date(n.created_at).toLocaleDateString('ko-KR')
                        : '-'}
                </span>
            </div>

            {/* 작성자 */}
            <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#6b7280' }}>
                작성자: {n.author_name || '관리자'}
            </p>

            {/* 클릭 시 내용 펼치기 */}
            {selected && (
                <div style={{
                    marginTop: '14px',
                    padding: '14px',
                    background: '#f3f4f6',
                    borderRadius: '8px',
                    fontSize: '14px',
                    color: '#374151',
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap',   // 줄바꿈 유지
                }}>
                    {n.content}
                </div>
            )}

            {/* 접기/펼치기 힌트 */}
            <p style={{ margin: '8px 0 0', fontSize: '11px',
                        color: '#c4b5fd', textAlign: 'right' }}>
                {selected ? '▲ 접기' : '▼ 내용 보기'}
            </p>
        </div>
    )
}

export default NoticeSection