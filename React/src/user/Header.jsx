import { useState } from 'react'
import Icons from './Icons'
import Avatar from './Avatar'

function Header({ sidebarCollapsed, onMenuClick }) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const notifications = [
    { id: 1, text: '김사라님이 댓글을 남겼습니다.', time: '5분 전', read: false },
    { id: 2, text: '새 업무가 할당되었습니다.', time: '30분 전', read: false },
    { id: 3, text: '디자인 리뷰 회의가 곧 시작됩니다.', time: '1시간 전', read: false },
    { id: 4, text: '파일이 업로드되었습니다.', time: '2시간 전', read: true },
  ]
  const unreadCount = notifications.filter(n => !n.read).length

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
            <span>5명 온라인</span>
          </div>
          <div className="status-item">
            <div className="status-dot meeting" />
            <span>3명 회의 중</span>
          </div>
        </div>

        <div className="notification-wrapper">
          <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
            <Icons.Bell />
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </button>
          {showNotifications && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <span>알림</span>
                <button className="btn-text-sm">모두 읽음</button>
              </div>
              {notifications.map(n => (
                <div key={n.id} className={`notification-item ${!n.read ? 'unread' : ''}`}>
                  <div className="notification-dot" />
                  <div>
                    <p className="notification-text">{n.text}</p>
                    <p className="notification-time">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="user-profile">
          <Avatar
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face"
            name="홍길동"
          />
          <div className="user-info">
            <span className="user-name">홍길동</span>
            <span className="user-role">프로덕트 리드</span>
          </div>
          <Icons.ChevronDown className="sm" />
        </button>
      </div>
    </header>
  )
}

export default Header