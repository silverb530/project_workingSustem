import { useEffect, useState } from 'react'
import TaskSection from './TaskSection'
import ChatSection from './ChatSection'
import FileBoard from './FileBoard'
import MeetingSection from './MeetingSection'

const API_BASE = 'http://localhost:5000'

function getAuthToken() {
    return (
        localStorage.getItem('token') ||
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

    useEffect(() => {
        loadDashboard()
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