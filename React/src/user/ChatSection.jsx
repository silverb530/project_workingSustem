import { useState, useEffect, useRef } from 'react'
import Icons from './Icons'
import Avatar from './Avatar'

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

export default ChatSection