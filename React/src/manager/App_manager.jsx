import { useEffect, useState } from 'react'
import './App_manager.css'
import DashboardPage from './manager_pages/DashboardPage.jsx'
import EmployeeListPage from './manager_pages/EmployeeListPage.jsx'
import FaceRegisterPage from './manager_pages/FaceRegisterPage.jsx'
import AttendanceStatusPage from './manager_pages/AttendanceStatusPage.jsx'
import AttendanceLogPage from './manager_pages/AttendanceLogPage.jsx'
import UnregisteredFacePage from './manager_pages/UnregisteredFacePage.jsx'

// 은비 얼굴등록 추가
import RegistFaceRecoPage from './manager_pages/RegistFaceRecoPage.jsx'

import TaskStatusPage from './manager_pages/TaskStatusPage.jsx'
import TaskAssignPage from './manager_pages/TaskAssignPage.jsx'
import NoticePage from './manager_pages/NoticePage.jsx'
import AllChatPage from './manager_pages/AllChatPage.jsx'
import FileSharePage from './manager_pages/FileSharePage.jsx'
import AccountManagePage from './manager_pages/AccountManagePage.jsx'
import RemoteApprovePage from './manager_pages/RemoteApprovePage.jsx'
import RemoteSessionPage from './manager_pages/RemoteSessionPage.jsx'
import NoticeBoardPage from './manager_pages/NoticeBoardPage.jsx'

function getLoginUser() {
    try {
        const saved =
            sessionStorage.getItem('loginUser') ||
            sessionStorage.getItem('loginUser') ||
            sessionStorage.getItem('user') ||
            sessionStorage.getItem('user')

        if (!saved) return {}

        const parsed = JSON.parse(saved)

        if (parsed.user) {
            return parsed.user
        }

        return parsed
    } catch {
        return {}
    }
}

function getLoginName(user) {
    return (
        user.name ||
        user.displayName ||
        user.display_name ||
        user.username ||
        user.email ||
        '관리자'
    )
}

function getLoginRoleText(user) {
    if (user.role === 'ADMIN') {
        return '시스템 관리자'
    }

    if (user.role === 'MANAGER') {
        return '매니저'
    }

    if (user.role === 'EMPLOYEE') {
        return '직원'
    }

    if (user.position) {
        return user.position
    }

    return user.role || '관리자'
}

function clearAuthStorage() {
    sessionStorage.removeItem('loginUser')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('jwt')
    sessionStorage.removeItem('authToken')

    sessionStorage.removeItem('loginUser')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('jwt')
    sessionStorage.removeItem('authToken')
}

function getStoredToken() {
    return (
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken') ||
        sessionStorage.getItem('access_token') ||
        sessionStorage.getItem('access_token') ||
        sessionStorage.getItem('jwt') ||
        sessionStorage.getItem('jwt') ||
        sessionStorage.getItem('authToken') ||
        sessionStorage.getItem('authToken') ||
        ''
    )
}

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1]
        if (!base64Url) return null

        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
                .join('')
        )

        return JSON.parse(jsonPayload)
    } catch {
        return null
    }
}

function getLoginRole() {
    const user = getLoginUser()
    const token = getStoredToken()
    const payload = token ? parseJwt(token) : null

    return String(
        user.role ||
        user.admin_role ||
        user.adminRole ||
        payload?.role ||
        payload?.admin_role ||
        payload?.adminRole ||
        ''
    ).toUpperCase()
}

function isTokenExpired() {
    const token = getStoredToken()
    const payload = token ? parseJwt(token) : null

    if (!payload?.exp) {
        return false
    }

    const now = Math.floor(Date.now() / 1000)
    return payload.exp < now
}

function canAccessManagerPage() {
    const token = getStoredToken()
    const role = getLoginRole()

    if (!token) {
        return false
    }

    if (isTokenExpired()) {
        return false
    }

    return role === 'ADMIN'
}

const Icons = {
    LayoutDashboard: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" />
        </svg>
    ),
    CheckSquare: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" /><path d="m9 12 2 2 4-4" />
        </svg>
    ),
    MessageCircle: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
        </svg>
    ),
    FolderOpen: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2" />
        </svg>
    ),
    Video: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5" /><rect x="2" y="6" width="14" height="12" rx="2" />
        </svg>
    ),
    Users: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    ),
    Calendar: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" />
        </svg>
    ),
    Settings: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" />
        </svg>
    ),
    ChevronLeft: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
        </svg>
    ),
    ChevronDown: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
        </svg>
    ),
    Plus: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" /><path d="M12 5v14" />
        </svg>
    ),
    Search: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
        </svg>
    ),
    Bell: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
    ),
    Menu: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="12" y2="12" /><line x1="4" x2="20" y1="6" y2="6" /><line x1="4" x2="20" y1="18" y2="18" />
        </svg>
    ),
    Circle: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
        </svg>
    ),
    Clock: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    CheckCircle: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
        </svg>
    ),
    Flag: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" x2="4" y1="22" y2="15" />
        </svg>
    ),
    MoreHorizontal: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
        </svg>
    ),
    Hash: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="9" y2="9" /><line x1="4" x2="20" y1="15" y2="15" /><line x1="10" x2="8" y1="3" y2="21" /><line x1="16" x2="14" y1="3" y2="21" />
        </svg>
    ),
    Send: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" />
        </svg>
    ),
    Paperclip: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
    ),
    Smile: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><path d="M8 14s1.5 2 4 2 4-2 4-2" /><line x1="9" x2="9.01" y1="9" y2="9" /><line x1="15" x2="15.01" y1="9" y2="9" />
        </svg>
    ),
    FileText: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" />
        </svg>
    ),
    FileSpreadsheet: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M8 13h2" /><path d="M14 13h2" /><path d="M8 17h2" /><path d="M14 17h2" />
        </svg>
    ),
    Image: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" /><circle cx="9" cy="9" r="2" /><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    ),
    Folder: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>
    ),
    Grid: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1" /><rect width="7" height="7" x="14" y="3" rx="1" /><rect width="7" height="7" x="14" y="14" rx="1" /><rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
    ),
    List: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" x2="21" y1="6" y2="6" /><line x1="8" x2="21" y1="12" y2="12" /><line x1="8" x2="21" y1="18" y2="18" /><line x1="3" x2="3.01" y1="6" y2="6" /><line x1="3" x2="3.01" y1="12" y2="12" /><line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
    ),
    Upload: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" x2="12" y1="3" y2="15" />
        </svg>
    ),
    Phone: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
    ),
    Mic: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" /><path d="M19 10v2a7 7 0 0 1-14 0v-2" /><line x1="12" x2="12" y1="19" y2="22" />
        </svg>
    ),
    ScreenShare: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3" /><path d="M8 21h8" /><path d="M12 17v4" /><path d="m17 8 5-5" /><path d="M17 3h5v5" />
        </svg>
    ),
}

function Avatar({ src, name, size = 'md', className = '' }) {
    const [imgError, setImgError] = useState(false)

    return (
        <div className={`avatar ${size} ${className}`}>
            {src && !imgError ? (
                <img src={src} alt={name} onError={() => setImgError(true)} />
            ) : (
                name?.[0] || '?'
            )}
        </div>
    )
}

function Sidebar({
    collapsed,
    onToggle,
    activeSection,
    onSectionChange,
    openGroups,
    onToggleGroup,
}) {
    const menuGroups = [
        {
            id: 'dashboardGroup',
            label: '대시보드',
            icon: Icons.LayoutDashboard,
            items: [
                { id: 'dashboard', label: '대시보드' },
            ],
        },
        {
            id: 'employeeGroup',
            label: '직원 관리',
            icon: Icons.Users,
            items: [
                { id: 'employeeList', label: '직원 목록' },
                { id: 'unregisteredFace', label: '미등록 인원' },
                { id: 'registFaceReco', label: '얼굴 인식 등록' },
            ],
        },
        {
            id: 'attendanceGroup',
            label: '출퇴근 관리',
            icon: Icons.Calendar,
            items: [
                { id: 'attendanceStatus', label: '출퇴근 현황' },
                { id: 'attendanceLog', label: '출퇴근 기록' },
            ],
        },
        {
            id: 'chatNoticeGroup',
            label: '채팅/공지',
            icon: Icons.MessageCircle,
            items: [
                { id: 'allChat', label: '전체 채팅', badge: 3 },
            ],
        },
        {
            id: 'fileGroup',
            label: '게시판 자료실',
            icon: Icons.FolderOpen,
            items: [
                { id: 'noticeBoard', label: '게시판' },
            ],
        },
        {
            id: 'remoteGroup',
            label: '원격 접속 관리',
            icon: Icons.ScreenShare,
            items: [
                { id: 'remoteApprove', label: '접속 승인' },
                { id: 'remoteSession', label: '접속 현황' },
            ],
        },
    ]

    const isGroupActive = (group) =>
        group.items.some((item) => item.id === activeSection)

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <button
                    className="logo logo-button"
                    onClick={onToggle}
                >
                    <div className="logo-icon">
                        <Icons.LayoutDashboard className="sm" />
                    </div>
                    {!collapsed && <span className="logo-text">관리자 메뉴</span>}
                </button>

                {!collapsed && (
                    <button className="collapse-btn" onClick={onToggle}>
                        <Icons.ChevronLeft className="sm" />
                    </button>
                )}
            </div>

            <nav className="nav">
                {menuGroups.map((group) => {
                    const Icon = group.icon
                    const opened = openGroups[group.id]

                    return (
                        <div key={group.id} className="nav-group">
                            <button
                                className={`nav-item nav-group-trigger ${isGroupActive(group) ? 'active' : ''}`}
                                onClick={() => {
                                    if (collapsed) {
                                        onToggle()
                                        return
                                    }
                                    onToggleGroup(group.id)
                                }}
                            >
                                <Icon />
                                {!collapsed && (
                                    <>
                                        <span className="nav-item-label">{group.label}</span>
                                        <span className={`group-arrow ${opened ? 'open' : ''}`}>⌄</span>
                                    </>
                                )}
                            </button>

                            {!collapsed && opened && (
                                <div className="sub-nav">
                                    {group.items.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => onSectionChange(item.id)}
                                            className={`sub-nav-item ${activeSection === item.id ? 'active' : ''}`}
                                        >
                                            <span className="sub-nav-dot" />
                                            <span className="sub-nav-label">{item.label}</span>
                                            {item.badge && <span className="nav-badge">{item.badge}</span>}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </nav>

            <div className="sidebar-footer">
                <button
                    className={`nav-item ${activeSection === 'accountManage' ? 'active' : ''}`}
                    onClick={() => onSectionChange('accountManage')}
                >
                    <Icons.Settings />
                    {!collapsed && <span className="nav-item-label">시스템 설정</span>}
                </button>
            </div>
        </aside>
    )
}

function Header({ sidebarCollapsed, onMenuClick, onLogout }) {
    const loginUser = getLoginUser()
    const loginName = getLoginName(loginUser)
    const loginRoleText = getLoginRoleText(loginUser)

    function handleLogoutClick() {
        const ok = window.confirm('로그아웃 하시겠습니까?')

        if (!ok) {
            return
        }

        if (typeof onLogout === 'function') {
            onLogout()
            return
        }

        clearAuthStorage()
        window.location.replace('/')
    }

    return (
        <header className={`header ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="header-left">
                <button className="icon-btn" onClick={onMenuClick} style={{ display: 'none' }}>
                    <Icons.Menu />
                </button>

                {/*<div className="search-wrapper">*/}
                {/*    <Icons.Search className="search-icon sm" />*/}
                {/*    */}{/*<input type="text" placeholder="검색..." className="search-input" />*/}
                {/*    <span className="search-kbd">Cmd+K</span>*/}
                {/*</div>*/}
            </div>

            <div className="header-right">
                <div className="status-indicators">
                    <div className="status-item">
                        <div className="status-dot online" />
                        <span>온라인 5명</span>
                    </div>

                    <div className="status-item">
                        <div className="status-dot meeting" />
                        <span>회의 중 3명</span>
                    </div>
                </div>

                <button className="icon-btn">
                    <Icons.Bell />
                    <span className="notification-badge">4</span>
                </button>

                <button className="user-profile" type="button">
                    <Avatar
                        src=""
                        name={loginName}
                    />

                    <div className="user-info">
                        <span className="user-name">{loginName}</span>
                        <span className="user-role">{loginRoleText}</span>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={handleLogoutClick}
                    style={{
                        border: 'none',
                        background: '#ef4444',
                        color: '#ffffff',
                        padding: '12px 22px',
                        borderRadius: '14px',
                        fontSize: '16px',
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

function AppManager() {
    const [authChecked, setAuthChecked] = useState(false)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [activeSection, setActiveSection] = useState('dashboard')
    const [openGroups, setOpenGroups] = useState({
        dashboardGroup: true,
        employeeGroup: false,
        attendanceGroup: false,
        taskGroup: true,
        chatNoticeGroup: false,
        fileGroup: false,
        remoteGroup: false,
    })

    useEffect(() => {
        const token = getStoredToken()
        const role = getLoginRole()

        if (!token || isTokenExpired()) {
            clearAuthStorage()
            window.location.replace('/')
            return
        }

        if (role !== 'ADMIN') {
            window.location.replace('/user')
            return
        }

        if (!canAccessManagerPage()) {
            window.location.replace('/user')
            return
        }

        setAuthChecked(true)
    }, [])

    const handleToggleGroup = (groupId) => {
        setOpenGroups((prev) => ({
            ...prev,
            [groupId]: !prev[groupId],
        }))
    }

    function handleLogout() {
        clearAuthStorage()
        window.location.replace('/')
    }

    const renderSection = () => {
        switch (activeSection) {
            case 'dashboard':
                return <DashboardPage />
            case 'employeeList':
                return <EmployeeListPage />
            case 'faceRegister':
                return <FaceRegisterPage />
            case 'attendanceStatus':
                return <AttendanceStatusPage />
            case 'attendanceLog':
                return <AttendanceLogPage />
            case 'unregisteredFace':
                return <UnregisteredFacePage />
            case 'registFaceReco':
                return <RegistFaceRecoPage />
            case 'allChat':
                return <AllChatPage />
            case 'fileShare':
                return <FileSharePage />
            case 'accountManage':
                return <AccountManagePage />
            case 'remoteApprove':
                return <RemoteApprovePage />
            case 'remoteSession':
                return <RemoteSessionPage />
            case 'noticeBoard':
                return <NoticeBoardPage />
            default:
                return <DashboardPage />
        }
    }

    if (!authChecked) {
        return null
    }

    return (
        <div className="admin-layout">
            <Sidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed((prev) => !prev)}
                activeSection={activeSection}
                onSectionChange={setActiveSection}
                openGroups={openGroups}
                onToggleGroup={handleToggleGroup}
            />

            <div className={`main-shell ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <Header
                    sidebarCollapsed={sidebarCollapsed}
                    onMenuClick={() => setSidebarCollapsed((prev) => !prev)}
                    onLogout={handleLogout}
                />

                <main className="content-area">
                    {renderSection()}
                </main>
            </div>
        </div>
    )
}

export default AppManager