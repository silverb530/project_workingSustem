import { useEffect, useState } from 'react'
import TaskSection from './TaskSection'
import ChatSection from './ChatSection'
import FileBoard from './FileBoard'
import MeetingSection from './MeetingSection'

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
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.message || 'API 요청 실패')
    }

    return data
}

//11번에 {currentUser?.name || '사용자'}로 수정
function DashboardSection({ onSectionChange, currentUser }) {
    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    // ✅ 공지사항 state 추가
    const [notices, setNotices] = useState([])
    const [noticeLoading, setNoticeLoading] = useState(true)
    const [selectedNotice, setSelectedNotice] = useState(null)

    useEffect(() => {
        loadDashboard()
        loadNotices() // ✅ 공지사항도 같이 불러오기
    }, [])

    async function loadDashboard() {
        try {
            setLoading(true)
            setError('')

            const data = await apiGet('/api/dashboard')
            setDashboardData(data)
        } catch (err) {
            setError(err.message)
            setDashboardData(null)
        } finally {
            setLoading(false)
        }
    }

    // ✅ 공지사항 불러오기 함수 추가
    async function loadNotices() {
        try {
            const data = await apiGet('/api/notices')
            setNotices(data.notices || [])
        } catch (err) {
            console.error('공지사항 불러오기 실패:', err)
        } finally {
            setNoticeLoading(false)
        }
    }

    return (
        <div className="content-wrapper">
            <div className="welcome-section">
                <h1>안녕하세요, {currentUser?.name || '사용자'}님 👋</h1>
                <p>오늘 팀의 진행 상황을 확인하세요.</p>
            </div>

            {error && (
                <div className="page-error">
                    {error}
                </div>
            )}

            <div className="stats-row">
                <div
                    className="stat-card"
                    onClick={() => onSectionChange('tasks')}
                    style={{ cursor: 'pointer' }}
                >
                    <p className="stat-label">오늘 업무</p>
                    <p className="stat-value">
                        {loading ? '...' : dashboardData?.today_tasks ?? 0}
                    </p>
                    <p className="stat-change positive">Flask API 연동</p>
                </div>

                <div
                    className="stat-card"
                    onClick={() => onSectionChange('team')}
                    style={{ cursor: 'pointer' }}
                >
                    <p className="stat-label">온라인 사용자</p>
                    <p className="stat-value">
                        {loading ? '...' : dashboardData?.online_users ?? 0}
                    </p>
                    <p className="stat-change neutral">현재 접속 인원</p>
                </div>

                <div
                    className="stat-card"
                    onClick={() => onSectionChange('files')}
                    style={{ cursor: 'pointer' }}
                >
                    <p className="stat-label">긴급 알림</p>
                    <p className="stat-value">
                        {loading ? '...' : dashboardData?.urgent_alerts ?? 0}
                    </p>
                    <p className="stat-change warning">즉시 확인 필요</p>
                </div>

                <div
                    className="stat-card"
                    onClick={() => onSectionChange('meetings')}
                    style={{ cursor: 'pointer' }}
                >
                    <p className="stat-label">카메라 상태</p>
                    <p className="stat-value">
                        {loading ? '...' : dashboardData?.devices?.camera ?? 'idle'}
                    </p>
                    <p className="stat-change neutral">장치 상태</p>
                </div>
            </div>

            {/* ✅ 공지사항 카드 추가 */}
            <div style={{ background: '#fff', borderRadius: '12px',
                          border: '1px solid #e5e7eb', overflow: 'hidden', marginBottom: '24px' }}>

                {/* 헤더 */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f3f4f6',
                              display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>📢</span>
                    <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>공지사항</h2>
                    <span style={{ marginLeft: 'auto', background: '#ede9fe', color: '#7c3aed',
                                   fontSize: '12px', padding: '2px 8px',
                                   borderRadius: '99px', fontWeight: 600 }}>
                        {notices.length}건
                    </span>
                </div>

                {/* 목록 */}
                <div>
                    {noticeLoading && (
                        <p style={{ padding: '20px', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
                            불러오는 중...
                        </p>
                    )}

                    {!noticeLoading && notices.length === 0 && (
                        <p style={{ padding: '20px', color: '#9ca3af', textAlign: 'center', margin: 0 }}>
                            등록된 공지사항이 없습니다.
                        </p>
                    )}

                    {!noticeLoading && notices.map((n, idx) => (
                        <div
                            key={n.notice_id}
                            onClick={() =>
                                setSelectedNotice(
                                    selectedNotice?.notice_id === n.notice_id ? null : n
                                )
                            }
                            style={{
                                padding: '14px 24px',
                                borderBottom: idx < notices.length - 1 ? '1px solid #f3f4f6' : 'none',
                                cursor: 'pointer',
                                background: selectedNotice?.notice_id === n.notice_id ? '#faf5ff' : '#fff',
                                transition: 'background 0.15s',
                            }}
                        >
                            {/* 제목 행 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {Number(n.is_pinned) === 1 && (
                                    <span style={{ background: '#fef3c7', color: '#d97706',
                                                   fontSize: '11px', padding: '2px 6px',
                                                   borderRadius: '4px', fontWeight: 600 }}>
                                        📌 고정
                                    </span>
                                )}
                                <span style={{ fontWeight: 600, fontSize: '14px', color: '#111827' }}>
                                    {n.title}
                                </span>
                                <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#9ca3af' }}>
                                    {n.created_at
                                        ? new Date(n.created_at).toLocaleDateString('ko-KR')
                                        : '-'}
                                </span>
                            </div>

                            {/* 작성자 */}
                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>
                                {n.author_name || '관리자'}
                            </p>

                            {/* 클릭 시 내용 펼치기 */}
                            {selectedNotice?.notice_id === n.notice_id && (
                                <div style={{
                                    marginTop: '10px', padding: '12px',
                                    background: '#f3f4f6', borderRadius: '8px',
                                    fontSize: '14px', color: '#374151', lineHeight: '1.6'
                                }}>
                                    {n.content}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="main-grid">
                <div className="grid-column">
                    <TaskSection mini />
                    <FileBoard mini />
                </div>

                <div className="grid-column">
                    <ChatSection mini currentUser={currentUser} />
                    <MeetingSection mini />
                </div>
            </div>
        </div>
    )
}

export default DashboardSection