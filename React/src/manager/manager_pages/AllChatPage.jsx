import { useState, useEffect } from 'react'
import '../App_manager.css'

const API_BASE = 'http://192.168.0.116:5000'
const FILE_BASE = API_BASE

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path} 실패`)
  return res.json()
}

async function apiDelete(path) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'DELETE',
  })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || `${path} 삭제 실패`)
  }

  return data
}

async function apiPost(path, body = null) {
  const options = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  }

  if (body !== null) {
    options.body = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}${path}`, options)
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.message || `${path} 요청 실패`)
  }

  return data
}

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
  ScreenShare: ({ className = '' }) => (
    <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-3"/><path d="M8 21h8"/><path d="M12 17v4"/><path d="m17 8 5-5"/><path d="M17 3h5v5"/>
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

function PageHeader({ title, description, actionText = '추가' }) {
  return (
    <div className="page-header-block">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      <button className="btn btn-primary btn-sm">
        <Icons.Plus className="sm" />
        {actionText}
      </button>
    </div>
  )
}

function ChatSection() {
  const [activeChannel, setActiveChannel] = useState('기술팀')
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [error, setError] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)

  const emojiList = ['😀', '😂', '😎', '👍', '🔥', '❤️', '👏', '🎉']

  const channels = [
    { id: 1, name: '전체', unread: 0 },
    { id: 2, name: '제품팀', unread: 3 },
    { id: 3, name: '디자인팀', unread: 0 },
  ]

  useEffect(() => {
    loadChatLogs()
  }, [])

  async function loadChatLogs() {
    try {
      setError('')
      const data = await apiGet('/api/chatlogs')
      const converted = data.map((log) => ({
        id: log.id,
        user: { name: log.user, avatar: '' },
        content: log.message || '',
        time: log.time,
        isMe: log.user === 'manager',
        fileName: log.file_name || null,
        fileUrl: log.file_url ? `${FILE_BASE}${log.file_url}` : null,
      }))
      setMessages(converted)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleSend() {
    if (!message.trim()) return

    try {
      await apiPost('/api/chatlogs', {
        user: 'manager',
        message: message.trim(),
      })
      setMessage('')
      await loadChatLogs()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDeleteChat(chatId) {
    try {
      await apiDelete(`/api/chatlogs/${chatId}`)
      await loadChatLogs()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUploadChatFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setError('')

      const formData = new FormData()
      formData.append('file', file)
      formData.append('user', 'manager')

      const res = await fetch(`${API_BASE}/api/chatlogs/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.message || '채팅 파일 업로드 실패')
      }

      await loadChatLogs()
    } catch (err) {
      setError(err.message)
    }

    e.target.value = ''
  }

  function addEmoji(emoji) {
    setMessage((prev) => prev + emoji)
    setShowEmoji(false)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="card chat-card">
      <div className="chat-header">
        <div className="chat-header-left">
          <h3>채팅</h3>
          <div className="chat-channel-badge">
            <Icons.Hash className="sm" />
            <span>{activeChannel}</span>
          </div>
        </div>
        <div className="channel-tabs">
          {channels.map((channel) => (
            <button
              key={channel.id}
              onClick={() => setActiveChannel(channel.name)}
              className={`channel-tab ${activeChannel === channel.name ? 'active' : ''}`}
            >
              #{channel.name}
              {channel.unread > 0 && <span className="channel-unread">{channel.unread}</span>}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="page-error">{error}</div>}

      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.isMe ? 'mine' : ''}`}>
            <Avatar src={msg.user.avatar} name={msg.user.name} />
            <div className="message-content">
              <div className="message-header">
                <span className="message-name">{msg.user.name}</span>
                <span className="message-time">{msg.time}</span>
              </div>

              {msg.content && <div className="message-bubble">{msg.content}</div>}

              {msg.fileUrl && (
                <a
                  href={msg.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="chat-file-link"
                  download
                >
                  📎 {msg.fileName}
                </a>
              )}

              <button
                className="btn btn-outline btn-sm chat-delete-btn"
                onClick={() => handleDeleteChat(msg.id)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="chat-input-wrapper">
        {showEmoji && (
          <div className="emoji-picker">
            {emojiList.map((emoji) => (
              <button key={emoji} className="emoji-btn" onClick={() => addEmoji(emoji)}>
                {emoji}
              </button>
            ))}
          </div>
        )}

        <div className="chat-input">
          <label className="btn btn-icon btn-ghost sm clip-upload-label">
            <Icons.Paperclip className="sm" />
            <input type="file" hidden onChange={handleUploadChatFile} />
          </label>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요..."
          />

          <button className="btn btn-icon btn-ghost sm" onClick={() => setShowEmoji((prev) => !prev)}>
            <Icons.Smile className="sm" />
          </button>

          <button className="btn btn-primary btn-icon sm" onClick={handleSend}>
            <Icons.Send className="sm" />
          </button>
        </div>
      </div>
    </div>
  )
}

function AllChatPage() {
  return (
    <>
      <PageHeader
        title="전체 채팅"
        description="전 직원 대상 단체 채팅방 화면입니다."
        actionText="채팅방 관리"
      />
      <div className="full-width-card">
        <ChatSection />
      </div>
    </>
  )
}

export default AllChatPage
