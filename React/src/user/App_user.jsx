import { useState, useEffect, useRef } from 'react'
import './App_user.css'

// ===============================
// 아이콘 컴포넌트 (인라인 SVG)
// ===============================
const Icons = {
  LayoutDashboard: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
    </svg>
  ),
  CheckSquare: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="m9 12 2 2 4-4"/>
    </svg>
  ),
  MessageCircle: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
  ),
  FolderOpen: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Video: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m16 13 5.223 3.482a.5.5 0 0 0 .777-.416V7.87a.5.5 0 0 0-.752-.432L16 10.5"/><rect x="2" y="6" width="14" height="12" rx="2"/>
    </svg>
  ),
  Users: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Calendar: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
    </svg>
  ),
  Settings: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  ChevronLeft: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m15 18-6-6 6-6"/>
    </svg>
  ),
  ChevronDown: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  ),
  ChevronRight: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6"/>
    </svg>
  ),
  Plus: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14"/><path d="M12 5v14"/>
    </svg>
  ),
  Search: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
    </svg>
  ),
  Bell: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  ),
  Menu: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>
    </svg>
  ),
  Circle: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),
  Clock: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  CheckCircle: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Flag: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" x2="4" y1="22" y2="15"/>
    </svg>
  ),
  MoreHorizontal: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
    </svg>
  ),
  Hash: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" x2="20" y1="9" y2="9"/><line x1="4" x2="20" y1="15" y2="15"/><line x1="10" x2="8" y1="3" y2="21"/><line x1="16" x2="14" y1="3" y2="21"/>
    </svg>
  ),
  Send: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>
    </svg>
  ),
  Paperclip: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
    </svg>
  ),
  Smile: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" x2="9.01" y1="9" y2="9"/><line x1="15" x2="15.01" y1="9" y2="9"/>
    </svg>
  ),
  FileText: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>
    </svg>
  ),
  FileSpreadsheet: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h2"/><path d="M14 13h2"/><path d="M8 17h2"/><path d="M14 17h2"/>
    </svg>
  ),
  Image: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>
    </svg>
  ),
  Folder: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
    </svg>
  ),
  Grid: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
    </svg>
  ),
  List: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>
    </svg>
  ),
  Upload: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
    </svg>
  ),
  Phone: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
    </svg>
  ),
  Mic: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
    </svg>
  ),
  MicOff: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/>
    </svg>
  ),
  VideoOff: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.66 6H14a2 2 0 0 1 2 2v2.5l5.248-3.062A.5.5 0 0 1 22 7.87v8.196"/><path d="M16 16a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2"/><line x1="2" x2="22" y1="2" y2="22"/>
    </svg>
  ),
  ScreenShare: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="m17 8 5-5"/><path d="M17 3h5v5"/>
    </svg>
  ),
  X: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  ),
  Edit: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Trash: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Download: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
    </svg>
  ),
  Mail: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  ),
  Pin: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/>
    </svg>
  ),
  MessageSquare: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Star: ({ className = '', filled = false }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
}

// ===============================
// 아바타 컴포넌트
// ===============================
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

// ===============================
// 모달 컴포넌트
// ===============================
function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn btn-icon btn-ghost sm" onClick={onClose}><Icons.X className="sm" /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}

// ===============================
// 사이드바 컴포넌트
// ===============================
function Sidebar({ collapsed, onToggle, activeSection, onSectionChange }) {
  const navItems = [
    { id: 'dashboard', label: '대시보드', icon: Icons.LayoutDashboard },
    { id: 'tasks', label: '업무관리', icon: Icons.CheckSquare, badge: 3 },
    { id: 'chat', label: '실시간 채팅', icon: Icons.MessageCircle, badge: 3 },
    { id: 'files', label: '게시판·자료실', icon: Icons.FolderOpen },
    { id: 'meetings', label: '화상회의', icon: Icons.Video },
    { id: 'team', label: '팀원', icon: Icons.Users },
    { id: 'calendar', label: '캘린더', icon: Icons.Calendar },
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
        <button className="nav-item">
          <Icons.Settings />
          {!collapsed && <span className="nav-item-label">설정</span>}
        </button>
      </div>
    </aside>
  )
}

// ===============================
// 헤더 컴포넌트
// ===============================
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

// ===============================
// 대시보드 섹션
// ===============================
function DashboardSection({ onSectionChange }) {
  return (
    <div className="content-wrapper">
      <div className="welcome-section">
        <h1>안녕하세요, 홍길동님 👋</h1>
        <p>오늘 팀의 진행 상황을 확인하세요.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card" onClick={() => onSectionChange('tasks')} style={{cursor:'pointer'}}>
          <p className="stat-label">진행 중인 업무</p>
          <p className="stat-value">12</p>
          <p className="stat-change positive">이번 주 +3</p>
        </div>
        <div className="stat-card" onClick={() => onSectionChange('team')} style={{cursor:'pointer'}}>
          <p className="stat-label">팀원 수</p>
          <p className="stat-value">8</p>
          <p className="stat-change neutral">5명 온라인</p>
        </div>
        <div className="stat-card" onClick={() => onSectionChange('files')} style={{cursor:'pointer'}}>
          <p className="stat-label">공유된 파일</p>
          <p className="stat-value">47</p>
          <p className="stat-change positive">이번 달 +12</p>
        </div>
        <div className="stat-card" onClick={() => onSectionChange('meetings')} style={{cursor:'pointer'}}>
          <p className="stat-label">오늘 회의</p>
          <p className="stat-value">3</p>
          <p className="stat-change warning">1개 진행 중</p>
        </div>
      </div>

      <div className="main-grid">
        <div className="grid-column">
          <TaskSection mini />
          <FileBoard mini />
        </div>
        <div className="grid-column">
          <ChatSection mini />
          <MeetingSection mini />
        </div>
      </div>
    </div>
  )
}

// ===============================
// 업무관리 섹션 (완전 기능)
// ===============================
function TaskSection({ mini = false }) {
  const [tasks, setTasks] = useState([
    { id: 1, title: '랜딩 페이지 히어로 섹션 업데이트', priority: 'high', status: 'in-progress', dueDate: '오늘', assignee: { name: '김사라', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face' }, tags: ['디자인', '마케팅'] },
    { id: 2, title: '1분기 분석 보고서 검토', priority: 'medium', status: 'todo', dueDate: '내일', assignee: { name: '이민준', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face' }, tags: ['분석'] },
    { id: 3, title: '클라이언트 프레젠테이션 준비', priority: 'high', status: 'todo', dueDate: '4월 24일', assignee: { name: '박지연', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face' }, tags: ['클라이언트', '발표'] },
    { id: 4, title: '인증 버그 수정', priority: 'low', status: 'done', dueDate: '4월 20일', assignee: { name: '최민호', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face' }, tags: ['개발', '버그'] },
  ])
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', dueDate: '', tags: '' })
  const [editingId, setEditingId] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  const toggleStatus = (id) => {
    setTasks(tasks.map(t => {
      if (t.id !== id) return t
      const next = t.status === 'todo' ? 'in-progress' : t.status === 'in-progress' ? 'done' : 'todo'
      return { ...t, status: next }
    }))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id))
    setOpenMenuId(null)
  }

  const addTask = () => {
    if (!newTask.title.trim()) return
    const task = {
      id: Date.now(),
      title: newTask.title,
      priority: newTask.priority,
      status: 'todo',
      dueDate: newTask.dueDate || '미정',
      assignee: { name: '홍길동', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face' },
      tags: newTask.tags ? newTask.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }
    setTasks([...tasks, task])
    setNewTask({ title: '', priority: 'medium', dueDate: '', tags: '' })
    setShowModal(false)
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const doneCount = tasks.filter(t => t.status === 'done').length

  const StatusIcon = ({ status }) => {
    if (status === 'done') return <Icons.CheckCircle />
    if (status === 'in-progress') return <Icons.Clock />
    return <Icons.Circle />
  }

  const content = (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <h3>업무관리</h3>
          <p>총 {tasks.length}건, {doneCount}건 완료</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Icons.Plus className="sm" />
          업무 추가
        </button>
      </div>
      {!mini && (
        <div className="filter-tabs">
          {[['all','전체'],['todo','할 일'],['in-progress','진행 중'],['done','완료']].map(([v,l]) => (
            <button key={v} className={`filter-tab ${filter===v?'active':''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      )}
      <div className="card-content">
        <div className="task-list">
          {filtered.map((task) => (
            <div key={task.id} className={`task-item ${task.status === 'done' ? 'completed' : ''}`}>
              <button className={`task-status-btn ${task.status}`} onClick={() => toggleStatus(task.id)} title="상태 변경">
                <StatusIcon status={task.status} />
              </button>
              <div className="task-content">
                <p className={`task-title ${task.status === 'done' ? 'completed' : ''}`}>{task.title}</p>
                <div className="task-tags">
                  {task.tags.map((tag) => (
                    <span key={tag} className="task-tag">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="task-meta">
                <Icons.Flag className={`sm task-priority ${task.priority}`} />
                <span className="task-date">{task.dueDate}</span>
                <Avatar src={task.assignee.avatar} name={task.assignee.name} size="sm" />
                <div className="dropdown-wrapper">
                  <button className="btn btn-icon btn-ghost sm task-more" onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}>
                    <Icons.MoreHorizontal className="sm" />
                  </button>
                  {openMenuId === task.id && (
                    <div className="dropdown-menu">
                      <button className="dropdown-item" onClick={() => { toggleStatus(task.id); setOpenMenuId(null) }}>
                        <Icons.CheckCircle className="sm" /> 상태 변경
                      </button>
                      <button className="dropdown-item danger" onClick={() => deleteTask(task.id)}>
                        <Icons.Trash className="sm" /> 삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">해당하는 업무가 없습니다.</div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="새 업무 추가">
        <div className="form-group">
          <label>업무 제목 *</label>
          <input className="form-input" placeholder="업무 내용을 입력하세요" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>우선순위</label>
            <select className="form-input" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
              <option value="high">높음</option>
              <option value="medium">중간</option>
              <option value="low">낮음</option>
            </select>
          </div>
          <div className="form-group">
            <label>마감일</label>
            <input className="form-input" type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
          </div>
        </div>
        <div className="form-group">
          <label>태그 (쉼표로 구분)</label>
          <input className="form-input" placeholder="예: 디자인, 개발" value={newTask.tags} onChange={e => setNewTask({...newTask, tags: e.target.value})} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={addTask}>추가</button>
        </div>
      </Modal>
    </div>
  )
  return content
}

// ===============================
// 실시간 채팅 섹션 (완전 기능)
// ===============================
function ChatSection({ mini = false }) {
  const [activeChannel, setActiveChannel] = useState('프로덕트팀')
  const [message, setMessage] = useState('')
  const [channels, setChannels] = useState([
    { id: 1, name: '일반', unread: 0 },
    { id: 2, name: '프로덕트팀', unread: 3 },
    { id: 3, name: '디자인', unread: 0 },
  ])
  const [allMessages, setAllMessages] = useState({
    '일반': [
      { id: 1, user: { name: '이민준', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face' }, content: '오늘 날씨 좋네요!', time: '오전 9:00', isMe: false },
    ],
    '프로덕트팀': [
      { id: 1, user: { name: '김사라', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face' }, content: '안녕하세요! 대시보드 새 목업 작업을 마쳤습니다. 의견 주시면 감사하겠습니다!', time: '오전 10:24', isMe: false },
      { id: 2, user: { name: '이민준', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face' }, content: '멋지네요! 새로운 카드 레이아웃이 특히 마음에 들어요.', time: '오전 10:26', isMe: false },
      { id: 3, user: { name: '나', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face' }, content: '좋은 의견이에요! 인터랙션을 높이기 위해 부드러운 호버 효과를 추가합시다.', time: '오전 10:28', isMe: true },
      { id: 4, user: { name: '김사라', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face' }, content: '네, 오늘 퇴근 전까지 준비해 드릴게요!', time: '오전 10:30', isMe: false },
    ],
    '디자인': [
      { id: 1, user: { name: '박지연', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face' }, content: '새 컬러 팔레트 검토해 주세요.', time: '오전 11:00', isMe: false },
    ],
  })
  const [showNewChannel, setShowNewChannel] = useState(false)
  const [newChannelName, setNewChannelName] = useState('')
  const [emojiOpen, setEmojiOpen] = useState(false)
  const messagesEndRef = useRef(null)
  const emojis = ['😊','😂','👍','🎉','❤️','🔥','✅','🚀','💡','📌']

  const messages = allMessages[activeChannel] || []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!message.trim()) return
    const now = new Date()
    const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
    const newMsg = {
      id: Date.now(),
      user: { name: '나', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face' },
      content: message,
      time: timeStr,
      isMe: true,
    }
    setAllMessages(prev => ({
      ...prev,
      [activeChannel]: [...(prev[activeChannel] || []), newMsg],
    }))
    setMessage('')
    // Mark channel as read
    setChannels(prev => prev.map(c => c.name === activeChannel ? { ...c, unread: 0 } : c))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const switchChannel = (name) => {
    setActiveChannel(name)
    setChannels(prev => prev.map(c => c.name === name ? { ...c, unread: 0 } : c))
  }

  const addChannel = () => {
    if (!newChannelName.trim()) return
    const name = newChannelName.trim()
    setChannels(prev => [...prev, { id: Date.now(), name, unread: 0 }])
    setAllMessages(prev => ({ ...prev, [name]: [] }))
    setActiveChannel(name)
    setNewChannelName('')
    setShowNewChannel(false)
  }

  return (
    <div className="card chat-card">
      <div className="chat-header">
        <div className="chat-header-left">
          <h3>실시간 채팅</h3>
          <div className="chat-channel-badge">
            <Icons.Hash className="sm" />
            <span>{activeChannel}</span>
          </div>
        </div>
        <div className="channel-tabs">
          {channels.map((channel) => (
            <button key={channel.id} onClick={() => switchChannel(channel.name)} className={`channel-tab ${activeChannel === channel.name ? 'active' : ''}`}>
              #{channel.name}
              {channel.unread > 0 && <span className="channel-unread">{channel.unread}</span>}
            </button>
          ))}
          {!mini && (
            <button className="channel-tab add-channel" onClick={() => setShowNewChannel(!showNewChannel)} title="채널 추가">
              <Icons.Plus className="sm" />
            </button>
          )}
        </div>
      </div>

      {showNewChannel && !mini && (
        <div className="new-channel-bar">
          <input className="form-input" placeholder="채널 이름" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addChannel()} />
          <button className="btn btn-primary btn-sm" onClick={addChannel}>추가</button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowNewChannel(false)}>취소</button>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.isMe ? 'mine' : ''}`}>
            <Avatar src={msg.user.avatar} name={msg.user.name} />
            <div className="message-content">
              <div className="message-header">
                <span className="message-name">{msg.user.name}</span>
                <span className="message-time">{msg.time}</span>
              </div>
              <div className="message-bubble">{msg.content}</div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-wrapper">
        {emojiOpen && !mini && (
          <div className="emoji-picker">
            {emojis.map(e => (
              <button key={e} className="emoji-btn" onClick={() => { setMessage(prev => prev + e); setEmojiOpen(false) }}>{e}</button>
            ))}
          </div>
        )}
        <div className="chat-input">
          <button className="btn btn-icon btn-ghost sm" title="파일 첨부">
            <Icons.Paperclip className="sm" />
          </button>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Enter로 전송)"
          />
          {!mini && (
            <button className="btn btn-icon btn-ghost sm" onClick={() => setEmojiOpen(!emojiOpen)} title="이모지">
              <Icons.Smile className="sm" />
            </button>
          )}
          <button className="btn btn-primary btn-icon sm" onClick={sendMessage} title="전송">
            <Icons.Send className="sm" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ===============================
// 게시판·자료실 섹션 (완전 기능)
// ===============================
function FileBoard({ mini = false }) {
  const [viewMode, setViewMode] = useState('grid')
  const [activeTab, setActiveTab] = useState('files')
  const [files, setFiles] = useState([
    { id: 1, name: '브랜드 가이드라인.pdf', type: 'pdf', size: '2.4 MB', modified: '2시간 전', pinned: true },
    { id: 2, name: '1분기 보고서.xlsx', type: 'spreadsheet', size: '856 KB', modified: '어제', pinned: false },
    { id: 3, name: '히어로 이미지.png', type: 'image', size: '1.2 MB', modified: '3일 전', pinned: false },
    { id: 4, name: '프로젝트 에셋', type: 'folder', size: '파일 12개', modified: '1주일 전', pinned: false },
  ])
  const [posts, setPosts] = useState([
    { id: 1, title: '4월 업데이트 공지사항', author: '홍길동', date: '2024-04-22', views: 24, comments: 3, pinned: true },
    { id: 2, title: '스프린트 회고 결과 공유', author: '김사라', date: '2024-04-20', views: 18, comments: 5, pinned: false },
    { id: 3, title: '신규 입사자 온보딩 가이드', author: '이민준', date: '2024-04-18', views: 42, comments: 1, pinned: false },
  ])
  const [showFileModal, setShowFileModal] = useState(false)
  const [showPostModal, setShowPostModal] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '' })
  const [selectedFile, setSelectedFile] = useState(null)
  const [openFileMenuId, setOpenFileMenuId] = useState(null)
  const fileInputRef = useRef(null)

  const FileIcon = ({ type }) => {
    switch (type) {
      case 'pdf': return <Icons.FileText className={`xl file-icon ${type}`} />
      case 'spreadsheet': return <Icons.FileSpreadsheet className={`xl file-icon ${type}`} />
      case 'image': return <Icons.Image className={`xl file-icon ${type}`} />
      case 'folder': return <Icons.Folder className={`xl file-icon ${type}`} />
      default: return <Icons.FileText className="xl file-icon" />
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    let type = 'pdf'
    if (['xlsx','csv'].includes(ext)) type = 'spreadsheet'
    else if (['png','jpg','jpeg','gif','webp'].includes(ext)) type = 'image'
    const newFile = {
      id: Date.now(),
      name: file.name,
      type,
      size: `${(file.size / 1024).toFixed(0)} KB`,
      modified: '방금',
      pinned: false,
    }
    setFiles(prev => [...prev, newFile])
    setShowFileModal(false)
  }

  const deleteFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
    setOpenFileMenuId(null)
  }

  const togglePin = (id) => {
    setFiles(prev => prev.map(f => f.id === id ? { ...f, pinned: !f.pinned } : f))
    setOpenFileMenuId(null)
  }

  const addPost = () => {
    if (!newPost.title.trim()) return
    const post = {
      id: Date.now(),
      title: newPost.title,
      author: '홍길동',
      date: new Date().toISOString().split('T')[0],
      views: 0,
      comments: 0,
      pinned: false,
    }
    setPosts(prev => [...prev, post])
    setNewPost({ title: '', content: '' })
    setShowPostModal(false)
  }

  const sortedFiles = [...files].sort((a, b) => b.pinned - a.pinned)

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <h3>게시판·자료실</h3>
          <p>{activeTab === 'files' ? '파일 및 폴더 관리' : '게시판 글 목록'}</p>
        </div>
        <div className="files-header-actions">
          {!mini && (
            <div className="tab-pills">
              <button className={`tab-pill ${activeTab==='files'?'active':''}`} onClick={() => setActiveTab('files')}>자료실</button>
              <button className={`tab-pill ${activeTab==='board'?'active':''}`} onClick={() => setActiveTab('board')}>게시판</button>
            </div>
          )}
          {activeTab === 'files' ? (
            <>
              {!mini && (
                <div className="view-toggle">
                  <button className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Icons.Grid className="sm" /></button>
                  <button className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}><Icons.List className="sm" /></button>
                </div>
              )}
              <button className="btn btn-outline btn-sm" onClick={() => setShowFileModal(true)}>
                <Icons.Upload className="sm" />업로드
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={() => setShowPostModal(true)}>
              <Icons.Plus className="sm" />글쓰기
            </button>
          )}
        </div>
      </div>

      <div className="card-content">
        {activeTab === 'files' ? (
          viewMode === 'grid' ? (
            <div className="files-grid">
              {sortedFiles.map((file) => (
                <div key={file.id} className="file-card" style={{position:'relative'}}>
                  {file.pinned && <div className="pin-badge"><Icons.Pin className="xs" /></div>}
                  <div className={`file-icon-wrapper ${file.type}`}><FileIcon type={file.type} /></div>
                  <p className="file-name">{file.name}</p>
                  <p className="file-meta">{file.size} - {file.modified}</p>
                  <div className="file-card-actions">
                    <button className="btn btn-icon btn-ghost xs" onClick={() => setOpenFileMenuId(openFileMenuId === file.id ? null : file.id)}><Icons.MoreHorizontal className="xs" /></button>
                    {openFileMenuId === file.id && (
                      <div className="dropdown-menu file-dropdown">
                        <button className="dropdown-item" onClick={() => togglePin(file.id)}><Icons.Pin className="sm" /> {file.pinned ? '고정 해제' : '고정'}</button>
                        <button className="dropdown-item" onClick={() => {}}><Icons.Download className="sm" /> 다운로드</button>
                        <button className="dropdown-item danger" onClick={() => deleteFile(file.id)}><Icons.Trash className="sm" /> 삭제</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="files-list">
              {sortedFiles.map((file) => (
                <div key={file.id} className="file-list-item">
                  {file.pinned && <Icons.Pin className="sm" style={{color:'var(--primary)',marginRight:'4px'}} />}
                  <div className={`file-list-icon file-icon-wrapper ${file.type}`}><FileIcon type={file.type} /></div>
                  <div className="file-list-content">
                    <p className="file-name">{file.name}</p>
                    <p className="file-meta">{file.size}</p>
                  </div>
                  <span className="file-list-date">{file.modified}</span>
                  <button className="btn btn-icon btn-ghost sm" onClick={() => {}}><Icons.Download className="sm" /></button>
                  <div className="dropdown-wrapper">
                    <button className="btn btn-icon btn-ghost sm file-list-more" onClick={() => setOpenFileMenuId(openFileMenuId === file.id ? null : file.id)}><Icons.MoreHorizontal className="sm" /></button>
                    {openFileMenuId === file.id && (
                      <div className="dropdown-menu">
                        <button className="dropdown-item" onClick={() => togglePin(file.id)}><Icons.Pin className="sm" /> {file.pinned ? '고정 해제' : '고정'}</button>
                        <button className="dropdown-item danger" onClick={() => deleteFile(file.id)}><Icons.Trash className="sm" /> 삭제</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="board-list">
            {posts.map(post => (
              <div key={post.id} className="board-item">
                {post.pinned && <Icons.Pin className="sm pin-icon" />}
                <div className="board-item-content">
                  <p className="board-title">{post.title}</p>
                  <div className="board-meta">
                    <span>{post.author}</span>
                    <span>·</span>
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>조회 {post.views}</span>
                    <span>·</span>
                    <span><Icons.MessageSquare className="xs" /> {post.comments}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 파일 업로드 모달 */}
      <Modal isOpen={showFileModal} onClose={() => setShowFileModal(false)} title="파일 업로드">
        <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
          <Icons.Upload />
          <p>클릭하여 파일 선택</p>
          <p className="file-meta">PDF, Excel, 이미지 등 지원</p>
          <input ref={fileInputRef} type="file" style={{display:'none'}} onChange={handleFileUpload} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowFileModal(false)}>취소</button>
        </div>
      </Modal>

      {/* 게시글 작성 모달 */}
      <Modal isOpen={showPostModal} onClose={() => setShowPostModal(false)} title="새 글 작성">
        <div className="form-group">
          <label>제목 *</label>
          <input className="form-input" placeholder="제목을 입력하세요" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} />
        </div>
        <div className="form-group">
          <label>내용</label>
          <textarea className="form-input form-textarea" placeholder="내용을 입력하세요" value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} rows={5} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowPostModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={addPost}>등록</button>
        </div>
      </Modal>
    </div>
  )
}

// ===============================
// 화상회의 섹션 (완전 기능)
// ===============================
function MeetingSection({ mini = false }) {
  const [meetings, setMeetings] = useState([
    { id: 1, title: '디자인 리뷰', time: '오후 2:00', duration: '45분', participants: [{ name: '김사라', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face' }, { name: '이민준', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face' }, { name: '박지연', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face' }], isLive: true },
    { id: 2, title: '스프린트 계획', time: '오후 4:30', duration: '1시간', participants: [{ name: '최민호', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face' }, { name: '정유진', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=32&h=32&fit=crop&crop=face' }], isLive: false },
    { id: 3, title: '클라이언트 미팅', time: '내일 오전 10:00', duration: '30분', participants: [{ name: '클라이언트', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=32&h=32&fit=crop&crop=face' }], isLive: false },
  ])
  const [showModal, setShowModal] = useState(false)
  const [newMeeting, setNewMeeting] = useState({ title: '', time: '', duration: '30분' })
  const [inMeeting, setInMeeting] = useState(false)
  const [activeMeetingId, setActiveMeetingId] = useState(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)

  const startMeeting = (meetingId) => {
    setActiveMeetingId(meetingId)
    setInMeeting(true)
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000)
  }

  const endMeeting = () => {
    setInMeeting(false)
    setActiveMeetingId(null)
    clearInterval(timerRef.current)
    setElapsed(0)
  }

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2,'0')
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2,'0')
    const s = (secs % 60).toString().padStart(2,'0')
    return `${h}:${m}:${s}`
  }

  const addMeeting = () => {
    if (!newMeeting.title.trim()) return
    const mtg = {
      id: Date.now(),
      title: newMeeting.title,
      time: newMeeting.time || '미정',
      duration: newMeeting.duration,
      participants: [{ name: '홍길동', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face' }],
      isLive: false,
    }
    setMeetings(prev => [...prev, mtg])
    setNewMeeting({ title: '', time: '', duration: '30분' })
    setShowModal(false)
  }

  const deleteMeeting = (id) => {
    setMeetings(prev => prev.filter(m => m.id !== id))
  }

  const liveMeeting = meetings.find(m => m.isLive)
  const otherMeetings = meetings.filter(m => !m.isLive)

  // In-meeting view
  if (inMeeting && !mini) {
    const mtg = meetings.find(m => m.id === activeMeetingId)
    return (
      <div className="content-wrapper">
        <div className="meeting-room">
          <div className="meeting-room-header">
            <h2>{mtg?.title || '즉석 회의'}</h2>
            <div className="live-badge"><div className="live-dot" /><span>진행 중 {formatTime(elapsed)}</span></div>
          </div>
          <div className="video-grid">
            {[{ name: '홍길동 (나)', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face' }, ...(mtg?.participants || [])].map((p, i) => (
              <div key={i} className="video-tile">
                <div className="video-avatar-placeholder">
                  <Avatar src={p.avatar} name={p.name} size="lg" />
                </div>
                <div className="video-name">{p.name}</div>
              </div>
            ))}
          </div>
          <div className="meeting-controls">
            <button className={`control-btn ${!micOn ? 'off' : ''}`} onClick={() => setMicOn(!micOn)} title={micOn ? '마이크 끄기' : '마이크 켜기'}>
              {micOn ? <Icons.Mic /> : <Icons.MicOff />}
              <span>{micOn ? '음소거' : '음소거 해제'}</span>
            </button>
            <button className={`control-btn ${!camOn ? 'off' : ''}`} onClick={() => setCamOn(!camOn)} title={camOn ? '카메라 끄기' : '카메라 켜기'}>
              {camOn ? <Icons.Video /> : <Icons.VideoOff />}
              <span>{camOn ? '화면 끄기' : '화면 켜기'}</span>
            </button>
            <button className="control-btn" title="화면 공유">
              <Icons.ScreenShare />
              <span>화면 공유</span>
            </button>
            <button className="control-btn end-call" onClick={endMeeting}>
              <Icons.Phone />
              <span>나가기</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={mini ? 'card' : 'content-wrapper'}>
      {!mini && <div className="welcome-section"><h1>화상회의</h1><p>언제든지 팀원들과 연결하세요.</p></div>}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <h3>화상회의</h3>
            <p>회의 {meetings.length}건 예정</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Icons.Plus className="sm" />일정 추가
          </button>
        </div>
        <div className="card-content">
          <div className="meeting-actions">
            <button className="btn btn-outline" onClick={() => startMeeting(null)}>
              <Icons.Video className="sm" />즉석 회의 시작
            </button>
            <button className="btn btn-outline btn-icon"><Icons.Phone className="sm" /></button>
          </div>

          {liveMeeting && (
            <div className="live-meeting">
              <div className="live-meeting-content">
                <div className="live-meeting-header">
                  <div className="live-badge"><div className="live-dot" /><span>진행 중</span></div>
                  <span className="live-duration">{formatTime(elapsed)}</span>
                </div>
                <h4 className="live-meeting-title">{liveMeeting.title}</h4>
                <div className="live-meeting-footer">
                  <div className="live-participants">
                    {liveMeeting.participants.map((p, i) => <Avatar key={i} src={p.avatar} name={p.name} size="sm" />)}
                  </div>
                  <div className="live-controls">
                    <button className={`live-control-btn ${!micOn?'off':''}`} onClick={() => setMicOn(!micOn)}>{micOn ? <Icons.Mic className="sm" /> : <Icons.MicOff className="sm" />}</button>
                    <button className={`live-control-btn ${!camOn?'off':''}`} onClick={() => setCamOn(!camOn)}>{camOn ? <Icons.Video className="sm" /> : <Icons.VideoOff className="sm" />}</button>
                    <button className="live-control-btn"><Icons.ScreenShare className="sm" /></button>
                    {inMeeting && activeMeetingId === liveMeeting.id
                      ? <button className="btn btn-destructive btn-sm" onClick={endMeeting}>나가기</button>
                      : <button className="btn btn-primary btn-sm" onClick={() => startMeeting(liveMeeting.id)}>입장</button>
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="meeting-list">
            {otherMeetings.map((meeting) => (
              <div key={meeting.id} className="meeting-item">
                <div className="meeting-icon-wrapper"><Icons.Calendar /></div>
                <div className="meeting-content">
                  <p className="meeting-title">{meeting.title}</p>
                  <div className="meeting-time">
                    <Icons.Clock className="sm" />
                    <span>{meeting.time}</span>
                    <span>-</span>
                    <span>{meeting.duration}</span>
                  </div>
                </div>
                <div className="meeting-participants">
                  {meeting.participants.slice(0, 3).map((p, i) => <Avatar key={i} src={p.avatar} name={p.name} size="sm" />)}
                </div>
                <button className="btn btn-outline btn-sm meeting-join" onClick={() => startMeeting(meeting.id)}>입장</button>
                {!mini && (
                  <button className="btn btn-icon btn-ghost sm" onClick={() => deleteMeeting(meeting.id)}><Icons.Trash className="sm" /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="회의 일정 추가">
        <div className="form-group">
          <label>회의 제목 *</label>
          <input className="form-input" placeholder="회의 제목을 입력하세요" value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>시간</label>
            <input className="form-input" type="datetime-local" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} />
          </div>
          <div className="form-group">
            <label>소요 시간</label>
            <select className="form-input" value={newMeeting.duration} onChange={e => setNewMeeting({...newMeeting, duration: e.target.value})}>
              <option>15분</option>
              <option>30분</option>
              <option>45분</option>
              <option>1시간</option>
              <option>2시간</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={addMeeting}>추가</button>
        </div>
      </Modal>
    </div>
  )
}

// ===============================
// 팀원 섹션 (완전 기능)
// ===============================
function TeamSection() {
  const [members, setMembers] = useState([
    { id: 1, name: '김사라', role: '디자이너', status: 'online', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face', email: 'sarah@teamflow.com', phone: '010-1234-5678', tasks: 4 },
    { id: 2, name: '이민준', role: '개발자', status: 'online', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face', email: 'minjun@teamflow.com', phone: '010-2345-6789', tasks: 7 },
    { id: 3, name: '박지연', role: '마케터', status: 'meeting', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face', email: 'jiyeon@teamflow.com', phone: '010-3456-7890', tasks: 2 },
    { id: 4, name: '최민호', role: '개발자', status: 'offline', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face', email: 'minho@teamflow.com', phone: '010-4567-8901', tasks: 5 },
    { id: 5, name: '정유진', role: 'PM', status: 'online', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=32&h=32&fit=crop&crop=face', email: 'yujin@teamflow.com', phone: '010-5678-9012', tasks: 3 },
  ])
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [newMember, setNewMember] = useState({ name: '', role: '', email: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const statusLabel = { online: '온라인', meeting: '회의 중', offline: '오프라인' }
  const statusColors = { online: '#22c55e', meeting: '#f59e0b', offline: '#94a3b8' }

  const addMember = () => {
    if (!newMember.name.trim() || !newMember.role.trim()) return
    const member = {
      id: Date.now(),
      name: newMember.name,
      role: newMember.role,
      status: 'offline',
      avatar: '',
      email: newMember.email,
      phone: '',
      tasks: 0,
    }
    setMembers(prev => [...prev, member])
    setNewMember({ name: '', role: '', email: '' })
    setShowModal(false)
  }

  const removeMember = (id) => {
    setMembers(prev => prev.filter(m => m.id !== id))
    if (showDetail?.id === id) setShowDetail(null)
  }

  const filtered = members
    .filter(m => filterStatus === 'all' || m.status === filterStatus)
    .filter(m => m.name.includes(searchTerm) || m.role.includes(searchTerm))

  const onlineCount = members.filter(m => m.status === 'online').length
  const meetingCount = members.filter(m => m.status === 'meeting').length

  return (
    <div className="content-wrapper">
      <div className="welcome-section">
        <h1>팀원</h1>
        <p>현재 팀 구성원 현황입니다.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <p className="stat-label">전체 팀원</p>
          <p className="stat-value">{members.length}</p>
          <p className="stat-change neutral">활성 멤버</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">온라인</p>
          <p className="stat-value">{onlineCount}</p>
          <p className="stat-change positive">현재 접속 중</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">회의 중</p>
          <p className="stat-value">{meetingCount}</p>
          <p className="stat-change warning">미팅 참여</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">오프라인</p>
          <p className="stat-value">{members.filter(m=>m.status==='offline').length}</p>
          <p className="stat-change neutral">자리 비움</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <h3>팀원 목록</h3>
            <p>총 {members.length}명</p>
          </div>
          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <div className="search-wrapper" style={{width:'180px'}}>
              <Icons.Search className="search-icon sm" />
              <input type="text" className="search-input" placeholder="이름, 역할 검색" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{paddingRight:'8px'}} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Icons.Plus className="sm" />팀원 초대
            </button>
          </div>
        </div>

        <div className="filter-tabs">
          {[['all','전체'],['online','온라인'],['meeting','회의 중'],['offline','오프라인']].map(([v,l]) => (
            <button key={v} className={`filter-tab ${filterStatus===v?'active':''}`} onClick={() => setFilterStatus(v)}>{l}</button>
          ))}
        </div>

        <div className="card-content">
          <div className="team-grid">
            {filtered.map((m) => (
              <div key={m.id} className="team-card" onClick={() => setShowDetail(m)}>
                <div className="team-card-header">
                  <div className="team-avatar-wrapper">
                    <Avatar src={m.avatar} name={m.name} size="lg" />
                    <div className="team-status-dot" style={{background: statusColors[m.status]}} />
                  </div>
                  <button className="btn btn-icon btn-ghost sm team-more" onClick={e => { e.stopPropagation(); removeMember(m.id) }} title="제거">
                    <Icons.X className="sm" />
                  </button>
                </div>
                <div className="team-card-body">
                  <p className="team-name">{m.name}</p>
                  <p className="team-role">{m.role}</p>
                  <div className="team-status-label" style={{color: statusColors[m.status]}}>
                    <div className="status-dot" style={{background: statusColors[m.status], width:'6px', height:'6px', flexShrink:0}} />
                    {statusLabel[m.status]}
                  </div>
                  <div className="team-tasks">
                    <Icons.CheckSquare className="sm" />
                    <span>진행 업무 {m.tasks}건</span>
                  </div>
                </div>
                <div className="team-card-actions">
                  <button className="btn btn-outline btn-sm" onClick={e => e.stopPropagation()}>
                    <Icons.MessageCircle className="sm" />메시지
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={e => e.stopPropagation()}>
                    <Icons.Mail className="sm" />이메일
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && <div className="empty-state">검색 결과가 없습니다.</div>}
        </div>
      </div>

      {/* 팀원 상세 모달 */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="팀원 상세 정보">
        {showDetail && (
          <div className="member-detail">
            <div className="member-detail-header">
              <Avatar src={showDetail.avatar} name={showDetail.name} size="lg" />
              <div>
                <h3>{showDetail.name}</h3>
                <p className="team-role">{showDetail.role}</p>
                <div className="team-status-label" style={{color: statusColors[showDetail.status]}}>
                  <div className="status-dot" style={{background: statusColors[showDetail.status], width:'6px', height:'6px'}} />
                  {statusLabel[showDetail.status]}
                </div>
              </div>
            </div>
            <div className="member-detail-info">
              {showDetail.email && <div className="detail-row"><Icons.Mail className="sm" /><span>{showDetail.email}</span></div>}
              {showDetail.phone && <div className="detail-row"><Icons.Phone className="sm" /><span>{showDetail.phone}</span></div>}
              <div className="detail-row"><Icons.CheckSquare className="sm" /><span>진행 중인 업무: {showDetail.tasks}건</span></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowDetail(null)}>닫기</button>
              <button className="btn btn-primary">메시지 보내기</button>
            </div>
          </div>
        )}
      </Modal>

      {/* 팀원 초대 모달 */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="팀원 초대">
        <div className="form-group">
          <label>이름 *</label>
          <input className="form-input" placeholder="이름을 입력하세요" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
        </div>
        <div className="form-group">
          <label>역할 *</label>
          <input className="form-input" placeholder="예: 개발자, 디자이너" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} />
        </div>
        <div className="form-group">
          <label>이메일</label>
          <input className="form-input" type="email" placeholder="이메일 주소" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={addMember}>초대</button>
        </div>
      </Modal>
    </div>
  )
}

// ===============================
// 캘린더 섹션 (완전 기능)
// ===============================
function CalendarSection() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState([
    { id: 1, title: '디자인 리뷰', date: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`, time: '14:00', type: 'meeting', color: '#6366f1' },
    { id: 2, title: '스프린트 계획', date: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`, time: '16:30', type: 'meeting', color: '#6366f1' },
    { id: 3, title: '클라이언트 미팅', date: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()+1).padStart(2,'0')}`, time: '10:00', type: 'client', color: '#f59e0b' },
    { id: 4, title: '발표 자료 마감', date: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()+2).padStart(2,'0')}`, time: '종일', type: 'deadline', color: '#ef4444' },
    { id: 5, title: '주간 팀 회의', date: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()+3).padStart(2,'0')}`, time: '09:00', type: 'meeting', color: '#6366f1' },
  ])
  const [showModal, setShowModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [newEvent, setNewEvent] = useState({ title: '', time: '', type: 'meeting', color: '#6366f1' })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
  const dayNames = ['일','월','화','수','목','금','토']

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const dateStr = (day) => `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  const getEventsForDay = (day) => events.filter(e => e.date === dateStr(day))
  const isToday = (day) => dateStr(day) === `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const addEvent = () => {
    if (!newEvent.title.trim() || !selectedDay) return
    const ev = {
      id: Date.now(),
      title: newEvent.title,
      date: dateStr(selectedDay),
      time: newEvent.time || '종일',
      type: newEvent.type,
      color: newEvent.type === 'meeting' ? '#6366f1' : newEvent.type === 'client' ? '#f59e0b' : '#ef4444',
    }
    setEvents(prev => [...prev, ev])
    setNewEvent({ title: '', time: '', type: 'meeting', color: '#6366f1' })
    setShowModal(false)
  }

  const handleDayClick = (day) => {
    setSelectedDay(day)
    setShowModal(true)
  }

  const deleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const upcomingEvents = events
    .filter(e => e.date >= `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`)
    .sort((a,b) => a.date.localeCompare(b.date))

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="content-wrapper">
      <div className="welcome-section">
        <h1>캘린더</h1>
        <p>예정된 일정을 확인하고 관리하세요.</p>
      </div>

      <div className="calendar-layout">
        <div className="calendar-card card">
          <div className="card-header">
            <button className="btn btn-icon btn-ghost" onClick={prevMonth}><Icons.ChevronLeft /></button>
            <h3>{year}년 {monthNames[month]}</h3>
            <button className="btn btn-icon btn-ghost" onClick={nextMonth}><Icons.ChevronRight /></button>
          </div>
          <div className="calendar-grid">
            {dayNames.map(d => <div key={d} className="calendar-day-name">{d}</div>)}
            {cells.map((day, i) => (
              <div
                key={i}
                className={`calendar-cell ${day ? 'active' : ''} ${day && isToday(day) ? 'today' : ''}`}
                onClick={() => day && handleDayClick(day)}
              >
                {day && (
                  <>
                    <span className="calendar-day-num">{day}</span>
                    <div className="calendar-events-dots">
                      {getEventsForDay(day).slice(0,3).map(e => (
                        <div key={e.id} className="event-dot" style={{background: e.color}} title={e.title} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="calendar-sidebar">
          <div className="card">
            <div className="card-header">
              <div className="card-header-left"><h3>다가오는 일정</h3><p>{upcomingEvents.length}건</p></div>
            </div>
            <div className="card-content">
              <div className="event-list">
                {upcomingEvents.map(ev => (
                  <div key={ev.id} className="event-item">
                    <div className="event-color-bar" style={{background: ev.color}} />
                    <div className="event-content">
                      <p className="event-title">{ev.title}</p>
                      <p className="event-meta">{ev.date} · {ev.time}</p>
                    </div>
                    <button className="btn btn-icon btn-ghost sm" onClick={() => deleteEvent(ev.id)}><Icons.Trash className="sm" /></button>
                  </div>
                ))}
                {upcomingEvents.length === 0 && <div className="empty-state">다가오는 일정이 없습니다.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`일정 추가 - ${selectedDay ? dateStr(selectedDay) : ''}`}>
        <div className="form-group">
          <label>제목 *</label>
          <input className="form-input" placeholder="일정 제목" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>시간</label>
            <input className="form-input" type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
          </div>
          <div className="form-group">
            <label>유형</label>
            <select className="form-input" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})}>
              <option value="meeting">회의</option>
              <option value="client">클라이언트</option>
              <option value="deadline">마감</option>
            </select>
          </div>
        </div>
        {selectedDay && getEventsForDay(selectedDay).length > 0 && (
          <div className="form-group">
            <label>이 날의 일정</label>
            {getEventsForDay(selectedDay).map(e => (
              <div key={e.id} className="day-event-chip">
                <span style={{color: e.color}}>●</span> {e.title} {e.time}
                <button className="btn-text-sm" onClick={() => deleteEvent(e.id)}>삭제</button>
              </div>
            ))}
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={addEvent}>추가</button>
        </div>
      </Modal>
    </div>
  )
}

// ===============================
// 메인 앱 컴포넌트
// ===============================
function App_user() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection onSectionChange={setActiveSection} />
      case 'tasks':
        return (
          <div className="content-wrapper">
            <div className="welcome-section">
              <h1>업무관리</h1>
              <p>팀의 모든 업무를 한눈에 파악하세요.</p>
            </div>
            <TaskSection />
          </div>
        )
      case 'chat':
        return (
          <div className="content-wrapper">
            <div className="welcome-section">
              <h1>실시간 채팅</h1>
              <p>팀원들과 실시간으로 소통하세요.</p>
            </div>
            <ChatSection />
          </div>
        )
      case 'files':
        return (
          <div className="content-wrapper">
            <div className="welcome-section">
              <h1>게시판·자료실</h1>
              <p>팀 자료를 공유하고 관리하세요.</p>
            </div>
            <FileBoard />
          </div>
        )
      case 'meetings':
        return <MeetingSection />
      case 'team':
        return <TeamSection />
      case 'calendar':
        return <CalendarSection />
      default:
        return <DashboardSection onSectionChange={setActiveSection} />
    }
  }

  return (
    <div className="dashboard">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <Header
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {renderContent()}
      </main>
    </div>
  )
}

export default App_user