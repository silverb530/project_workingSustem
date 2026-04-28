import { useState, useEffect, useCallback, useRef } from 'react'
import { io } from 'socket.io-client'
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
import MyPage from './MyPage'
import NoticeSection from './NoticeSection'

// 관리자 게시판과 같은 게시판을 유저 페이지에서도 사용
// 같은 /api/boards API를 사용하므로 관리자 게시판과 유저 게시판이 서로 연동됨
import NoticeBoardPage from '../manager/manager_pages/NoticeBoardPage.jsx'

const LOGIN_PATH = '/'

function clearAuthStorage() {
    localStorage.removeItem('loginUser')
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('jwt')
    localStorage.removeItem('authToken')

    sessionStorage.removeItem('loginUser')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('jwt')
    sessionStorage.removeItem('authToken')
}

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

function normalizeList(data, key) {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.[key])) return data[key]
    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data?.result)) return data.result
    return []
}

function getUnreadCountFromRoom(room) {
    const value =
        room.unread_count ??
        room.unreadCount ??
        room.unread ??
        room.new_count ??
        room.newCount ??
        room.badge ??
        0

    const count = Number(value)

    if (Number.isNaN(count)) {
        return 0
    }

    return count
}

function App_user() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [activeSection, setActiveSection] = useState('dashboard')
    const [currentUser, setCurrentUser] = useState(null)
    const [taskBadge, setTaskBadge] = useState(0)
    const [chatBadge, setChatBadge] = useState(0)
    const [authChecked, setAuthChecked] = useState(false)
    const [notifications, setNotifications] = useState([])
    const readNotifIdsRef = useRef(new Set(JSON.parse(localStorage.getItem('readNotifIds') || '[]')))

    useEffect(() => {
        const savedUser = localStorage.getItem('loginUser') || localStorage.getItem('user')

        if (!savedUser) {
            clearAuthStorage()
            window.location.replace(LOGIN_PATH)
            return
        }

        try {
            const parsedUser = normalizeLoginUser(JSON.parse(savedUser))

            if (!parsedUser || !parsedUser.employee_id) {
                clearAuthStorage()
                window.location.replace(LOGIN_PATH)
                return
            }

            setCurrentUser(parsedUser)
            setAuthChecked(true)
        } catch (error) {
            console.error('로그인 사용자 정보 파싱 실패:', error)
            clearAuthStorage()
            setCurrentUser(null)
            window.location.replace(LOGIN_PATH)
        }
    }, [])

    function handleLogout() {
        clearAuthStorage()
        setCurrentUser(null)
        window.location.replace(LOGIN_PATH)
    }

    const saveReadIds = (ids) => {
        localStorage.setItem('readNotifIds', JSON.stringify([...ids]))
    }

    // 알림 API 폴링 (3초마다 최신 알림 동기화)
    const pollNotifications = useCallback(async (employeeId) => {
        if (!employeeId) return

        try {
            const [chatRes, meetingRes] = await Promise.all([
                fetch(`${API_BASE}/api/chat/notifications/${employeeId}`),
                fetch(`${API_BASE}/api/meetings/notifications/${employeeId}`),
            ])

            const chatData = await chatRes.json()
            const meetingData = await meetingRes.json()

            const chatNotifs = chatData.success ? (chatData.notifications || []) : []
            const meetingNotifs = meetingData.success ? (meetingData.notifications || []) : []

            const readIds = readNotifIdsRef.current
            const merged = [...meetingNotifs, ...chatNotifs].map(n => ({
                ...n,
                read: readIds.has(String(n.id)),
            }))

            setNotifications(merged)
        } catch {
            // 무시
        }
    }, [])

    // 3초 폴링 + Socket.IO 실시간 push 병행
    useEffect(() => {
        if (!currentUser?.employee_id) return

        const employeeId = currentUser.employee_id

        pollNotifications(employeeId)
        const timer = setInterval(() => pollNotifications(employeeId), 3000)

        const socket = io(API_BASE, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
        })

        socket.on('connect', () => {
            socket.emit('register-online', {
                user_id: employeeId,
                user_name: currentUser.name || '사용자',
            })
        })

        // Socket.IO push 수신 시 즉시 반영 (폴링 간격 없이 즉각)
        socket.on('new-notification', (notification) => {
            setNotifications(prev => {
                const exists = prev.some(n => n.id === notification.id)
                if (exists) return prev
                const readIds = readNotifIdsRef.current
                return [{ ...notification, read: readIds.has(String(notification.id)) }, ...prev]
            })
        })

        return () => {
            clearInterval(timer)
            socket.emit('unregister-online')
            socket.disconnect()
        }
    }, [currentUser?.employee_id, currentUser?.name, pollNotifications])

    const handleMarkAllNotificationsRead = useCallback(() => {
        setNotifications(prev => {
            prev.forEach(n => readNotifIdsRef.current.add(String(n.id)))
            saveReadIds(readNotifIdsRef.current)
            return prev.map(n => ({ ...n, read: true }))
        })
    }, [])

    const handleNotificationClick = (notification) => {
        readNotifIdsRef.current.add(String(notification.id))
        saveReadIds(readNotifIdsRef.current)
        setNotifications(prev =>
            prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
        )
        if (notification.section) {
            handleSectionChange(notification.section)
        }
    }

    // 미처리 받은 요청 수 조회 (사이드바 뱃지용)
    const refreshTaskBadge = useCallback(async (dept) => {
        if (!dept) {
            setTaskBadge(0)
            return
        }

        try {
            const res = await fetch(`${API_BASE}/api/work-requests/received?department=${encodeURIComponent(dept)}`)
            const data = await res.json()

            if (data.success) {
                setTaskBadge((data.requests || []).filter(r => r.status === 'PENDING').length)
            } else {
                setTaskBadge(0)
            }
        } catch {
            setTaskBadge(0)
        }
    }, [])

    // 실시간 채팅 안 읽은 메시지 수 조회 (사이드바 뱃지용)
    const refreshChatBadge = useCallback(async (employeeId) => {
        if (!employeeId) {
            setChatBadge(0)
            return
        }

        try {
            const res = await fetch(`${API_BASE}/api/chatrooms?employee_id=${employeeId}`)
            const data = await res.json()

            if (!res.ok) {
                setChatBadge(0)
                return
            }

            const rooms = normalizeList(data, 'chatrooms')
            const totalUnread = rooms.reduce((sum, room) => sum + getUnreadCountFromRoom(room), 0)

            setChatBadge(totalUnread)
        } catch {
            setChatBadge(0)
        }
    }, [])

    useEffect(() => {
        if (currentUser?.department) {
            refreshTaskBadge(currentUser.department)
        }
    }, [currentUser?.department, refreshTaskBadge])

    useEffect(() => {
        if (currentUser?.employee_id) {
            refreshChatBadge(currentUser.employee_id)

            const timer = setInterval(() => {
                refreshChatBadge(currentUser.employee_id)
            }, 5000)

            return () => clearInterval(timer)
        }
    }, [currentUser?.employee_id, refreshChatBadge])

    const handleSectionChange = (section) => {
        setActiveSection(section)

        if (section === 'chat') {
            setChatBadge(0)

            if (currentUser?.employee_id) {
                setTimeout(() => {
                    refreshChatBadge(currentUser.employee_id)
                }, 500)
            }
        }

        if (section === 'tasks' && currentUser?.department) {
            setTimeout(() => {
                refreshTaskBadge(currentUser.department)
            }, 500)
        }
    }

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard':
                return (
                    <DashboardSection
                        onSectionChange={handleSectionChange}
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

            case 'mypage':
                return (
                    <MyPage
                        currentUser={currentUser}
                        onUserUpdated={(updatedUser) => {
                            setCurrentUser(normalizeLoginUser(updatedUser))
                        }}
                    />
                )

            default:
                return (
                    <DashboardSection
                        onSectionChange={handleSectionChange}
                        currentUser={currentUser}
                    />
                )
        }
    }

    if (!authChecked) {
        return null
    }

    return (
        <div className="dashboard">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                activeSection={activeSection}
                onSectionChange={handleSectionChange}
                taskBadge={taskBadge}
                chatBadge={chatBadge}
            />

            <Header
                sidebarCollapsed={sidebarCollapsed}
                onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                currentUser={currentUser}
                onLogout={handleLogout}
                notifications={notifications}
                onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
                onNotificationClick={handleNotificationClick}
            />

            <main className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
                {renderContent()}
            </main>
        </div>
    )
}

export default App_user