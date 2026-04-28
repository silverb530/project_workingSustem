import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import Icons from './Icons'
import Avatar from './Avatar'
import { API_BASE } from '../config'

//실시간 채팅 때, currentUser 추가
function Header({
    sidebarCollapsed,
    onMenuClick,
    currentUser,
    onLogout,
    notifications = [],
    onMarkAllNotificationsRead,
    onNotificationClick,
}) {
    const [showNotifications, setShowNotifications] = useState(false)
    const [searchValue, setSearchValue] = useState('')
    const [onlineCount, setOnlineCount] = useState(0)
    const [meetingCount, setMeetingCount] = useState(0)

    const unreadCount = notifications.filter(n => !n.read).length

    useEffect(() => {
        const employeeId = currentUser?.employee_id || currentUser?.id

        if (!employeeId) {
            setOnlineCount(0)
            setMeetingCount(0)
            return
        }

        const socket = io(API_BASE, {
            transports: ['websocket', 'polling'],
            withCredentials: true,
        })

        socket.on('connect', () => {
            socket.emit('register-online', {
                user_id: employeeId,
                user_name: currentUser?.name || '사용자',
            })

            socket.emit('request-presence-counts')
        })

        socket.on('presence-counts', data => {
            setOnlineCount(Number(data?.online_count || 0))
            setMeetingCount(Number(data?.meeting_count || 0))
        })

        return () => {
            socket.emit('unregister-online')
            socket.off('presence-counts')
            socket.disconnect()
        }
    }, [currentUser?.employee_id, currentUser?.id, currentUser?.name])

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

    function handleLogoutClick() {
        const ok = window.confirm('로그아웃 하시겠습니까?')

        if (!ok) {
            return
        }

        setShowNotifications(false)

        if (typeof onLogout === 'function') {
            onLogout()
            return
        }

        clearAuthStorage()
        window.location.replace('/')
    }

    function getNotificationIcon(type) {
        if (type === 'CHAT_MENTION') return '💬'
        if (type === 'CHAT_MESSAGE') return '💬'
        if (type === 'MEETING_INVITE') return '🎥'
        return '🔔'
    }

    return (
        <header className={`header ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="header-left">
                <button className="icon-btn" onClick={onMenuClick}>
                    <Icons.Menu />
                </button>

                <div className="search-wrapper">
                    <Icons.Search className="search-icon sm" />
                    <input
                        type="text"
                        value={searchValue}
                        onChange={e => setSearchValue(e.target.value)}
                        placeholder="검색어를 입력하세요..."
                        className="search-input"
                    />
                    <span className="search-kbd">Cmd+K</span>
                </div>
            </div>

            <div className="header-right">
                <div className="status-indicators">
                    <div className="status-item">
                        <div className="status-dot online" />
                        <span>{onlineCount}명 온라인</span>
                    </div>

                    <div className="status-item">
                        <div className="status-dot meeting" />
                        <span>{meetingCount}명 회의 중</span>
                    </div>
                </div>

                <div className="notification-wrapper">
                    <button
                        className="icon-btn"
                        onClick={() => setShowNotifications(!showNotifications)}
                    >
                        <Icons.Bell />
                        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                    </button>

                    {showNotifications && (
                        <div className="notification-dropdown">
                            <div className="notification-header">
                                <span>알림</span>
                                <button
                                    type="button"
                                    className="btn-text-sm"
                                    onClick={onMarkAllNotificationsRead}
                                >
                                    모두 읽음
                                </button>
                            </div>

                            {notifications.length === 0 && (
                                <div className="notification-item">
                                    <div className="notification-dot" />
                                    <div>
                                        <p className="notification-text">새 알림이 없습니다.</p>
                                        <p className="notification-time">-</p>
                                    </div>
                                </div>
                            )}

                            {notifications.map(n => (
                                <button
                                    key={n.id}
                                    type="button"
                                    className={`notification-item ${!n.read ? 'unread' : ''}`}
                                    onClick={() => {
                                        if (typeof onNotificationClick === 'function') {
                                            onNotificationClick(n)
                                        }

                                        setShowNotifications(false)
                                    }}
                                    style={{
                                        width: '100%',
                                        border: 'none',
                                        background: 'transparent',
                                        textAlign: 'left',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <div className="notification-dot" />

                                    <div>
                                        <p className="notification-text">
                                            <span style={{ marginRight: '6px' }}>
                                                {getNotificationIcon(n.type)}
                                            </span>
                                            {n.text}
                                        </p>
                                        <p className="notification-time">{n.time || '-'}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div
                    className="user-profile"
                    style={{
                        cursor: 'default',
                    }}
                >
                    <Avatar
                        src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
                        name={currentUser?.name || '사용자'}
                    />

                    <div className="user-info">
                        <span className="user-name">{currentUser?.name || '로딩중...'}</span>
                        <span className="user-role">{currentUser?.position || '직책 없음'}</span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleLogoutClick}
                    style={{
                        border: 'none',
                        background: '#ef4444',
                        color: '#ffffff',
                        padding: '10px 16px',
                        borderRadius: '10px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                    }}
                >
                    로그아웃
                </button>
            </div>
        </header>
    )
}

export default Header