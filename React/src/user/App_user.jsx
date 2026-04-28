import { useState, useEffect, useCallback } from 'react'
import './App_user.css'
import { API_BASE } from '../config'
import Sidebar from './Sidebar'
import Header from './Header'
import DashboardSection from './DashboardSection'
import WorkRequestSection from './WorkRequestSection'
import ChatSection from './ChatSection'
import MeetingSection from './MeetingSection'
import TeamSection from './TeamSection'
import CalendarSection from './CalendarSection'
import FaceGate from './FaceGate'
import RemoteNode from './RemoteNode'
import NoticeSection from './NoticeSection'

// 관리자 게시판과 같은 게시판을 유저 페이지에서도 사용
// 같은 /api/boards API를 사용하므로 관리자 게시판과 유저 게시판이 서로 연동됨
import NoticeBoardPage from '../manager/manager_pages/NoticeBoardPage.jsx'

function normalizeLoginUser(rawUser) {
    if (!rawUser) return null
    const employeeId = rawUser.employee_id ?? rawUser.id
    return {
        ...rawUser,
        employee_id: employeeId !== undefined && employeeId !== null ? Number(employeeId) : null,
        id: employeeId !== undefined && employeeId !== null ? Number(employeeId) : null,
        name: rawUser.name || '사용자',
        position: rawUser.position || rawUser.role || '직책 없음',
    }
}

function App_user() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [activeSection, setActiveSection] = useState('dashboard')
    const [currentUser, setCurrentUser] = useState(null)
    const [taskBadge, setTaskBadge] = useState(0)

    useEffect(() => {
        const savedUser = localStorage.getItem('loginUser') || localStorage.getItem('user')
        if (!savedUser) {
            setCurrentUser(null)
            return
        }

        try {
            setCurrentUser(normalizeLoginUser(JSON.parse(savedUser)))
        } catch (error) {
            console.error('로그인 사용자 정보 파싱 실패:', error)
            setCurrentUser(null)
        }
    }, [])

    // 미처리 받은 요청 수 조회 (사이드바 뱃지용)
    const refreshTaskBadge = useCallback(async (dept) => {
        if (!dept) return

        try {
            const res = await fetch(`${API_BASE}/api/work-requests/received?department=${encodeURIComponent(dept)}`)
            const data = await res.json()

            if (data.success) {
                setTaskBadge((data.requests || []).filter(r => r.status === 'PENDING').length)
            }
        } catch { }
    }, [])

    useEffect(() => {
        if (currentUser?.department) {
            refreshTaskBadge(currentUser.department)
        }
    }, [currentUser?.department, refreshTaskBadge])

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return (
                    <DashboardSection
                        onSectionChange={setActiveSection}
                        currentUser={currentUser}
                    />
                )

            case 'tasks':
                return (
                    <div className="content-wrapper">
                        <div className="welcome-section">
                            <h1>업무 요청</h1>
                            <p>부서간 업무 요청을 등록하고 처리하세요.</p>
                        </div>
                        <WorkRequestSection
                            currentUser={currentUser}
                            onTaskUpdate={() => refreshTaskBadge(currentUser?.department)}
                        />
                    </div>
                )

            case 'chat':
                return (
                    <div className="content-wrapper">
                        <div className="welcome-section">
                            <h1>실시간 채팅</h1>
                            <p>팀원들과 실시간으로 소통하세요.</p>
                        </div>
                        <ChatSection currentUser={currentUser} />
                    </div>
                )

            case 'files':
                return (
                    <div className="content-wrapper">
                        <NoticeBoardPage />
                    </div>
                )

            case 'meetings':
                return <MeetingSection />

            case 'team':
                return <TeamSection />

            case 'calendar':
                return <CalendarSection />

            case 'notice':
                return <NoticeSection />

            case 'facegate':
                return <FaceGate />

            case 'remote':
                return <RemoteNode />

            default:
                return (
                    <DashboardSection
                        onSectionChange={setActiveSection}
                        currentUser={currentUser}
                    />
                )
        }
    }

    return (
        <div className="dashboard">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                taskBadge={taskBadge}
            />

            <Header
                sidebarCollapsed={sidebarCollapsed}
                onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                currentUser={currentUser}
            />

            <main className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
                {renderContent()}
            </main>
        </div>
    )
}

export default App_user