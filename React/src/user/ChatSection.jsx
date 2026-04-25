import { useState, useEffect, useRef } from 'react'
import Icons from './Icons'
import Avatar from './Avatar'

// 추가: Flask API 주소
const API_BASE = 'http://localhost:5000'

// 추가: 현재 로그인 사용자 임시값
// 나중에 로그인 정보가 App_user.jsx에서 props로 내려오면 이 값을 교체하면 됨
const CURRENT_USER = {
  id: 1,
 name: '나',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
}

// 추가: DB 연결 실패 시 화면 표시용 예비 팀원 목록
const FALLBACK_TEAM_MEMBERS = [
  {
    id: 2,
    name: '김사라',
    role: '디자이너',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face',
  },
  {
    id: 3,
    name: '이민준',
    role: '개발자',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
  },
  {
    id: 4,
    name: '박지연',
    role: '기획자',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face',
  },
  {
    id: 5,
    name: '홍길동',
    role: '프로덕트 매니저',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
  },
]

function ChatSection({ mini = false }) {
  // 수정: 채팅방은 DB의 room_id 기준으로 관리
  const [activeChannelId, setActiveChannelId] = useState(null)
  const [message, setMessage] = useState('')
  const [channels, setChannels] = useState([])
  const [allMessages, setAllMessages] = useState({})
  const [teamMembers, setTeamMembers] = useState(FALLBACK_TEAM_MEMBERS)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const emojis = ['😊','😂','👍','🎉','❤️','🔥','✅','🚀','💡','📌']

  // 추가: 채팅방 생성 모달 상태
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomType, setNewRoomType] = useState('group')
  const [selectedMemberIds, setSelectedMemberIds] = useState([])

  const activeChannel = channels.find(c => c.id === activeChannelId)
  const messages = allMessages[activeChannel] || []

  useEffect(() => {
    if (mini) return
   
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 추가: 최초 실행 시 팀원 목록과 채팅방 목록을 DB에서 불러옴
  useEffect(() => {
    fetchMembers()
    fetchRooms()
  }, [])

    // 추가: 선택된 채팅방의 메시지를 DB에서 불러오고, 1초마다 갱신
  useEffect(() => {
    if (!activeChannelId) return

    fetchMessages(activeChannelId)
    const timer = setInterval(() => fetchMessages(activeChannelId), 1000)

    return () => clearInterval(timer)
  }, [activeChannelId])

   // 추가: DB에서 팀원 목록 조회
  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/members`)
      const data = await res.json()

      if (data.success && Array.isArray(data.members)) {
        const filtered = data.members.filter(m => Number(m.id) !== Number(CURRENT_USER.id))
        setTeamMembers(filtered.length > 0 ? filtered : FALLBACK_TEAM_MEMBERS)
      }
    } catch (error) {
      console.error('팀원 목록 조회 실패:', error)
    }
  }

   // 추가: DB에서 내가 참여 중인 채팅방 목록 조회
  const fetchRooms = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/rooms?employee_id=${CURRENT_USER.id}`)
      const data = await res.json()

      if (data.success && Array.isArray(data.rooms)) {
        setChannels(data.rooms)

        if (!activeChannelId && data.rooms.length > 0) {
          setActiveChannelId(data.rooms[0].id)
        }
      }
    } catch (error) {
      console.error('채팅방 목록 조회 실패:', error)
    }
  }

    // 추가: DB에서 특정 채팅방 메시지 조회
  const fetchMessages = async (roomId) => {
    try {
      const res = await fetch(`${API_BASE}/api/chat/messages/${roomId}`)
      const data = await res.json()

      if (data.success && Array.isArray(data.messages)) {
        setAllMessages(prev => ({
          ...prev,
          [roomId]: data.messages.map(msg => ({
            id: msg.id,
            senderId: msg.sender_id,
            user: {
              name: Number(msg.sender_id) === Number(CURRENT_USER.id) ? CURRENT_USER.name: msg.sender_name,
              avatar: msg.sender_avatar || '',
            },
            content: msg.content,
            time: msg.time,
            isMe: Number(msg.sender_id) === Number(CURRENT_USER.id),
          })),
        }))
      }
    } catch (error) {
      console.error('메시지 조회 실패:', error)
    }
  }

  // 수정: 메시지 전송 시 chat_messages에 INSERT
  const sendMessage = async () => {
    if (!message.trim()) return
    if (!activeChannelId) return

    const content = message.trim()
    setMessage('')

    try {
      const res = await fetch(`${API_BASE}/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_id: activeChannelId,
          sender_id: CURRENT_USER.id,
          content: content,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.message || '메시지 전송에 실패했습니다.')
        setMessage(content)
        return
      }

      await fetchMessages(activeChannelId)
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      alert('Flask 서버와 연결할 수 없습니다.')
      setMessage(content)
    } 
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 수정: 채팅방 이동은 room_id 기준
  const switchChannel = (channelId) => {
    setActiveChannelId(channelId)
    setChannels(prev => prev.map(c => c.id === channelId ? { ...c, unread: 0 } : c))
  }

  // 수정: 메시지 삭제 시 chat_messages.is_deleted = 1
  const deleteMessage = async (messageId) => {
    if (!window.confirm('이 메시지를 삭제할까요?')) return

    try {
      const res = await fetch(`${API_BASE}/api/chat/messages/${messageId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.message || '메시지 삭제에 실패했습니다.')
        return
      }

      setAllMessages(prev => ({
        ...prev,
        [activeChannelId]: (prev[activeChannelId] || []).filter(msg => msg.id !== messageId),
      }))
    } catch (error) {
      console.error('메시지 삭제 실패:', error)
      alert('Flask 서버와 연결할 수 없습니다.')
    }
  }

   // 추가: 초대할 팀원 선택
  const toggleMember = (memberId) => {
    setSelectedMemberIds(prev => {
      if (newRoomType === 'private') return prev.includes(memberId) ? [] : [memberId]
      return prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    })
  }

  // 수정: 채팅방 생성 시 chat_rooms와 chat_room_members에 INSERT
  const createRoom = async () => {
    if (loading) return

    if (newRoomType === 'private' && selectedMemberIds.length !== 1) {
      alert('개인 채팅방은 팀원 1명을 선택해야 합니다.')
      return
    }

    if (newRoomType === 'group' && selectedMemberIds.length < 2) {
      alert('단체 채팅방은 팀원 2명 이상을 선택해야 합니다.')
      return
    }

    const invitedNames = selectedMemberIds
      .map(id => teamMembers.find(m => Number(m.id) === Number(id))?.name)
      .filter(Boolean)

    const roomName = newRoomType === 'private'
      ? invitedNames[0]
      : (newRoomName.trim() || `${invitedNames.join(', ')} 채팅방`)

    // 추가: 자기 자신도 chat_room_members에 들어가야 하므로 member_ids에 CURRENT_USER.id 포함
    const memberIds = Array.from(new Set([CURRENT_USER.id, ...selectedMemberIds]))

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_type: newRoomType === 'private' ? 'DIRECT' : 'GROUP',
          room_name: roomName,
          creator_id: CURRENT_USER.id,
          member_ids: memberIds,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.message || '채팅방 생성에 실패했습니다.')
        return
      }

      await fetchRooms()
      setActiveChannelId(data.room.id)
      closeRoomModal()
    } catch (error) {
      console.error('채팅방 생성 실패:', error)
      alert('Flask 서버와 연결할 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

   // 추가: 채팅방 생성 모달 닫기
  const closeRoomModal = () => {
    setShowRoomModal(false)
    setNewRoomName('')
    setNewRoomType('group')
    setSelectedMemberIds([])
  }

  // 수정: 채팅방 삭제 시 chat_rooms.deleted_id = 1
  const deleteRoom = async (roomId, e) => {
    e.stopPropagation()

    if (channels.length <= 1) {
      alert('마지막 채팅방은 삭제할 수 없습니다.')
      return
    }

    if (!window.confirm('이 채팅방을 삭제할까요? 채팅 내용도 함께 숨겨집니다.')) return

    try {
      const res = await fetch(`${API_BASE}/api/chat/rooms/${roomId}`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.message || '채팅방 삭제에 실패했습니다.')
        return
      }

      const remaining = channels.filter(c => c.id !== roomId)
      setChannels(remaining)
      setAllMessages(prev => {
        const next = { ...prev }
        delete next[roomId]
        return next
      })

      if (activeChannelId === roomId) setActiveChannelId(remaining[0]?.id || null)
    } catch (error) {
      console.error('채팅방 삭제 실패:', error)
      alert('Flask 서버와 연결할 수 없습니다.')
    }
  }

  return (
    <div className="card chat-card">
      <div className="chat-header">
        <div className="chat-header-left">
          <h3>실시간 채팅</h3>
          <div className="chat-channel-badge">
            <Icons.Hash className="sm" />
            <span>{activeChannel?.name || '채팅방'}</span>
          </div>
        </div>

        <div className="channel-tabs">
          {channels.map((channel) => (
            <button key={channel.id} onClick={() => switchChannel(channel.id)} className={`channel-tab ${activeChannelId === channel.id ? 'active' : ''}`}>
              #{channel.name}
              <span
                className="channel-delete"
                onClick={(e) => deleteRoom(channel.id, e)}
                title="채팅방 삭제"
              >
                ×
              </span>
              {channel.unread > 0 && <span className="channel-unread">{channel.unread}</span>}
            </button>
          ))}
          {!mini && (
            <button className="channel-tab add-channel" onClick={() => setShowRoomModal(true)} title="채팅방 만들기">
              <Icons.Plus className="sm" />
            </button>
          )}
        </div>
      </div>


      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.isMe ? 'mine' : ''}`}>
            <Avatar src={msg.user.avatar} name={msg.user.name} />
            <div className="message-content">
              <div className="message-header">
                <button
                  className="message-delete"
                  onClick={() => deleteMessage(msg.id)}
                  title="메시지 삭제"
                >
                  🗑
                </button>
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

      {showRoomModal && (
        <div className="chat-modal-backdrop">
          <div className="chat-room-modal">
            <div className="chat-room-modal-header">
              <h3>채팅방 만들기</h3>
              <button className="modal-close-btn" onClick={closeRoomModal}>×</button>
            </div>

            <div className="room-type-tabs">
              <button
                className={`room-type-tab ${newRoomType === 'private' ? 'active' : ''}`}
                onClick={() => {
                  setNewRoomType('private')
                  setSelectedMemberIds([])
                }}
              >
                개인 채팅
              </button>
              <button
                className={`room-type-tab ${newRoomType === 'group' ? 'active' : ''}`}
                onClick={() => {
                  setNewRoomType('group')
                  setSelectedMemberIds([])
                }}
              >
                단체 채팅
              </button>
            </div>

            {newRoomType === 'group' && (
              <div className="room-name-box">
                <label>단체 채팅방 이름</label>
                <input
                  className="form-input"
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                  placeholder="예: 프로젝트 회의방"
                />
              </div>
            )}

            <div className="invite-section-title">
              초대할 팀원 선택
              <span>{newRoomType === 'private' ? '1명 선택' : '2명 이상 선택'}</span>
            </div>

            <div className="invite-member-list">
              {teamMembers.map(member => (
                <button
                  type="button"
                  key={member.id}
                  className={`invite-member-item ${selectedMemberIds.includes(member.id) ? 'selected' : ''}`}
                  onClick={() => toggleMember(member.id)}
                >
                  <Avatar src={member.avatar} name={member.name} />
                  <div className="invite-member-info">
                    <strong>{member.name}</strong>
                    <span>{member.role}</span>
                  </div>
                  <div className="invite-check">
                    {selectedMemberIds.includes(member.id) ? '✓' : ''}
                  </div>
                </button>
              ))}
            </div>

            <div className="modal-actions">
              <button className="btn btn-outline" onClick={closeRoomModal}>취소</button>
              <button className="btn btn-primary" onClick={createRoom} disabled={loading}>
                {loading ? '생성 중...' : '생성'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatSection