import { useState } from 'react'
import Icons from './Icons'

function Sidebar({ collapsed, onToggle, activeSection, onSectionChange }) {
    const [settingsOpen, setSettingsOpen] = useState(false)
    const [boardOpen, setBoardOpen] = useState(true)

    const navItems = [
        { id: 'dashboard', label: '대시보드', icon: Icons.LayoutDashboard },
        { id: 'tasks', label: '업무관리', icon: Icons.CheckSquare, badge: 3 },
        { id: 'chat', label: '실시간 채팅', icon: Icons.MessageCircle, badge: 3 },
        { id: 'meetings', label: '화상회의', icon: Icons.Video },
        { id: 'team', label: '팀원', icon: Icons.Users },
        { id: 'calendar', label: '캘린더', icon: Icons.Calendar },
        { id: 'facegate', label: '안면인식 출퇴근', icon: Icons.Scan },
        { id: 'remote', label: '원격 PC 접속', icon: Icons.Monitor },
    ]

    const workspaces = [
        { name: '프로덕트팀', colorClass: 'primary' },
        { name: '마케팅', colorClass: 'accent' },
        { name: '개발팀', colorClass: 'chart-3' },
    ]

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="logo">
                    <div className="logo-icon">
                        <Icons.LayoutDashboard className="sm" />
                    </div>
                    {!collapsed && <span className="logo-text">TeamFlow</span>}
                </div>
                {!collapsed && (
                    <button className="collapse-btn" onClick={onToggle}>
                        <Icons.ChevronLeft className="sm" />
                    </button>
                )}
                {collapsed && (
                    <button className="collapse-btn expand-btn" onClick={onToggle}>
                        <Icons.ChevronRight className="sm" />
                    </button>
                )}
            </div>

            <nav className="nav">
                {navItems.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => onSectionChange(item.id)}
                        className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                    >
                        <item.icon />
                        {!collapsed && (
                            <>
                                <span className="nav-item-label">{item.label}</span>
                                {item.badge && <span className="nav-badge">{item.badge}</span>}
                            </>
                        )}
                    </button>
                ))}

                <div className="nav-group">
                    <button
                        className={`nav-item ${activeSection === 'files' ? 'active' : ''}`}
                        onClick={() => {
                            if (collapsed) {
                                onToggle()
                                return
                            }

                            setBoardOpen(prev => !prev)
                        }}
                    >
                        <Icons.FolderOpen />
                        {!collapsed && (
                            <>
                                <span className="nav-item-label">게시판 자료실</span>
                                <span className={`group-arrow ${boardOpen ? 'open' : ''}`}>⌄</span>
                            </>
                        )}
                    </button>

                    {!collapsed && boardOpen && (
                        <div className="sub-nav">
                            <button
                                onClick={() => onSectionChange('files')}
                                className={`sub-nav-item ${activeSection === 'files' ? 'active' : ''}`}
                            >
                                <span className="sub-nav-dot" />
                                <span className="sub-nav-label">게시판</span>
                            </button>
                        </div>
                    )}
                </div>
            </nav>

            {!collapsed && (
                <div className="workspaces">
                    <div className="workspaces-header">
                        <span className="workspaces-title">워크스페이스</span>
                        <button className="btn btn-icon btn-ghost sm">
                            <Icons.Plus className="sm" />
                        </button>
                    </div>
                    {workspaces.map((ws) => (
                        <button key={ws.name} className="workspace-item">
                            <div className={`workspace-dot ${ws.colorClass}`} />
                            <span>{ws.name}</span>
                        </button>
                    ))}
                </div>
            )}

            <div className="sidebar-footer">
                {!collapsed && settingsOpen && (
                    <div className="settings-popover">
                        <button
                            className={`settings-popover-item ${activeSection === 'mypage' ? 'active' : ''}`}
                            onClick={() => {
                                onSectionChange('mypage')
                                setSettingsOpen(false)
                            }}
                        >
                            <Icons.Users className="sm" />
                            <span>마이페이지</span>
                        </button>
                    </div>
                )}

                <button
                    className={`nav-item ${settingsOpen || activeSection === 'mypage' ? 'active' : ''}`}
                    onClick={() => setSettingsOpen(prev => !prev)}
                >
                    <Icons.Settings />
                    {!collapsed && <span className="nav-item-label">설정</span>}
                </button>
            </div>
        </aside>
    )
}

export default Sidebar