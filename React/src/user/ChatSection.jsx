import { useState, useEffect, useRef } from 'react'
import Icons from './Icons'
import Avatar from './Avatar'

// 추가: Flask API 주소
const API_BASE = `http://localhost:5000`

const FALLBACK_TEAM_MEMBERS = [] //8번부터 실시간 때 수정 

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null
  const numberValue = Number(value)
  return Number.isNaN(numberValue) ? null : numberValue
}

function normalizeCurrentUser(currentUser) {
  if (!currentUser) return null

  const id = toNumber(currentUser.employee_id ?? currentUser.id)

  return {
    ...currentUser,
    id,
    employee_id: id,
    name: currentUser.name || '사용자',
    position: currentUser.position || currentUser.role || '직책 없음',
    avatar: currentUser.avatar || '',
  }
}

function normalizeRoom(room) {
  const id = toNumber(room.id ?? room.room_id)

  return {
    ...room,
    id,
    room_id: id,
    name: room.name || room.room_name || '채팅방',
    unread: room.unread || 0,
  }
}

function normalizeMember(member) {
  const id = toNumber(member.id ?? member.employee_id)

  return {
    ...member,
    id,
    employee_id: id,
    name: member.name || '이름 없음',
    role: member.role || member.position || member.department || '직책 없음',
    avatar: member.avatar || '',
  }
} //54번까지 실시간 때 수정

//파일 업로드 헬퍼 함수
function makeFullFileUrl(fileUrl) {
  if (!fileUrl) return ''
  if (fileUrl.startsWith('http')) return fileUrl
  return `${API_BASE}${fileUrl}`
}

function isImageFile(mimeType = '') {
  return mimeType.startsWith('image/')
}

function isVideoFile(mimeType = '') {
  return mimeType.startsWith('video/')
}//까지 파일 업로드 헬퍼 함수


                                   //실시간 때 currentUser 추가
function ChatSection({ mini = false, currentUser }) {
  
  // 실시간 채팅 때 추가
  const loginUser = normalizeCurrentUser(currentUser)
  const currentUserId = loginUser?.id ?? null
  const currentUserName = loginUser?.name || '사용자'

  // 수정: 채팅방은 DB의 room_id 기준으로 관리
  const [activeChannelId, setActiveChannelId] = useState(null)
  const [message, setMessage] = useState('')
  const [channels, setChannels] = useState([])
  const [allMessages, setAllMessages] = useState({})
  const [teamMembers, setTeamMembers] = useState(FALLBACK_TEAM_MEMBERS)
  const [emojiOpen, setEmojiOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [roomNotice, setRoomNotice] = useState(null) //채팅 공지 기능 때 추가
  const messagesContainerRef = useRef(null) //실시간 채팅 때, 추가
  const messagesEndRef = useRef(null)

  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const shouldAutoScrollRef = useRef(true)  //76~78번, 실시간 때 추가
  const prevChannelRef = useRef(null)
  const prevMessageCountRef = useRef(0)
  
  const emojis = ['😊','😂','👍','🎉','❤️','🔥','✅','🚀','💡','📌']

  // 추가: 채팅방 생성 모달 상태
  const [showRoomModal, setShowRoomModal] = useState(false)
  const [newRoomName, setNewRoomName] = useState('')
  const [newRoomType, setNewRoomType] = useState('group')
  const [selectedMemberIds, setSelectedMemberIds] = useState([])

  const activeChannel = channels.find(c => c.id === activeChannelId)
  const messages = allMessages[activeChannelId] || []

  const scrollToBottom = (behavior = 'smooth') => { //실시간 때, 추가
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

   const handleMessagesScroll = () => { //실시간 채팅 때 추가
    const box = messagesContainerRef.current
    if (!box) return

    const distanceFromBottom = box.scrollHeight - box.scrollTop - box.clientHeight
    shouldAutoScrollRef.current = distanceFromBottom <= 80
  }

  useEffect(() => {// 103부터 실시간 채팅 때, 추가
    if (!activeChannelId || mini) return

    const channelChanged = prevChannelRef.current !== activeChannelId
    if (channelChanged) {
      shouldAutoScrollRef.current = true
      prevChannelRef.current = activeChannelId
    }

    if (shouldAutoScrollRef.current) {
      setTimeout(() => scrollToBottom(channelChanged ? 'auto' : 'smooth'), 0)
    }

    prevMessageCountRef.current = messages.length
  }, [activeChannelId, messages.length, mini]) //117까지 실시간 채팅 때, 추가

  // 추가: 최초 실행 시 팀원 목록과 채팅방 목록을 DB에서 불러옴
  useEffect(() => {
    if (!currentUserId) return // 실시간 채팅 때, 추가

    fetchMembers()
    fetchRooms()
  }, [currentUserId]) //실시간 채팅 때, 수정

    // 추가: 선택된 채팅방의 메시지를 DB에서 불러오고, 1초마다 갱신
  useEffect(() => {
    if (!activeChannelId || !currentUserId) return //실시간 채팅 때, 수정
    fetchRoomNotice(activeChannelId) //채팅 공지 때 추가
    fetchMessages(activeChannelId)

    const timer = setInterval(() => {fetchMessages(activeChannelId) 
    fetchRoomNotice(activeChannelId)}, 1000) //채팅 공지 때 수정

    return () => clearInterval(timer)
  }, [activeChannelId, currentUserId]) //실시간 채팅 때, 수정

   // 추가: DB에서 팀원 목록 조회
  const fetchMembers = async () => { //실//실시간 채팅 때, 새롭게 수정
    try {
      const res = await fetch(`${API_BASE}/api/chat/members`)
      const data = await res.json()

      if (data.success && Array.isArray(data.members)) {
        const filtered = data.members.map(normalizeMember).filter(member=> member.id && Number(member.id) !== Number(currentUserId))
        setTeamMembers(filtered)
      }
    } catch (error) {
      console.error('팀원 목록 조회 실패:', error)
    }
  }

   // 추가: DB에서 내가 참여 중인 채팅방 목록 조회
  const fetchRooms = async () => {
     if (!currentUserId) return //실시간 때, 추가

    try {
      const res = await fetch(`${API_BASE}/api/chat/rooms?employee_id=${currentUserId}`)
      const data = await res.json()

      if (data.success && Array.isArray(data.rooms)) { //실시간 때 수정
        const nextRooms = data.rooms.map(normalizeRoom).filter(room => room.id)
        setChannels(nextRooms)

        setActiveChannelId(prev => { // 실시간 때, 추가
          if (prev && nextRooms.some(room => room.id === prev)) return prev
          return nextRooms[0]?.id || null
        })
      }
    } catch (error) {
      console.error('채팅방 목록 조회 실패:', error)
    }
  }

    // 추가: DB에서 특정 채팅방 메시지 조회
  const fetchMessages = async (roomId) => {
    if (!roomId || !currentUserId) return //실시간 때 추가

    try {
      const res = await fetch(`${API_BASE}/api/chat/messages/${roomId}`)
      const data = await res.json()

      if (data.success && Array.isArray(data.messages)) { //실시간 때, 수정
         setAllMessages(prev => ({
          ...prev,
          [roomId]: data.messages.map(msg => {
            const senderId = toNumber(msg.sender_id)
            const isMe = Number(senderId) === Number(currentUserId)
            //파일 업로드 때 추가
            return {  
              id: msg.id ?? msg.message_id,
              messageId: msg.message_id ?? msg.id,
              roomId: msg.room_id,
              senderId,
              user: {
                name: isMe ? currentUserName : (msg.sender_name || '알 수 없음'),
                avatar: msg.sender_avatar || '',
              },
              content: msg.content,
              time: msg.time || msg.send_at || '',
              isMe,

              messageType: msg.message_type || 'TEXT',
              fileName: msg.file_name || msg.content || '',
              fileUrl: makeFullFileUrl(msg.file_url),
              fileSize: msg.file_size || 0,
              mimeType: msg.mime_type || '',
            }
          }),
        }))
      }
    } catch (error) {
      console.error('메시지 조회 실패:', error)
    }
  }

  // 수정: 메시지 전송 시 chat_messages에 INSERT
  const sendMessage = async () => {
    if (!message.trim()) return
    if (!activeChannelId || !currentUserId) { //실시간 때 수정
      alert('로그인 사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
      return
    }

    const content = message.trim()
    setMessage('')
    shouldAutoScrollRef.current = true //실시간 때 추가

    try {
      const res = await fetch(`${API_BASE}/api/chat/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ //실시간 때 수정
          room_id: activeChannelId,
          sender_id: currentUserId,
          content,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.message || '메시지 전송에 실패했습니다.')
        setMessage(content)
        return
      }

      await fetchMessages(activeChannelId)
      setTimeout(() => scrollToBottom('smooth'), 0) //실시간 때 추가
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      alert('Flask 서버와 연결할 수 없습니다.')
      setMessage(content)
    } 
  }

  //파일 업로드 때 추가
  const uploadChatFile = async (file) => {
    if (!file) return

    if (!activeChannelId || !currentUserId) {
      alert('로그인 사용자 정보 또는 채팅방 정보를 찾을 수 없습니다.')
      return
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      alert('사진 또는 동영상 파일만 업로드할 수 있습니다.')
      return
    }

    const formData = new FormData()
    formData.append('room_id', activeChannelId)
    formData.append('sender_id', currentUserId)
    formData.append('file', file)

    setUploading(true)
    shouldAutoScrollRef.current = true

    try {
      const res = await fetch(`${API_BASE}/api/chat/files`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.message || '파일 업로드에 실패했습니다.')
        return
      }

      await fetchMessages(activeChannelId)
      setTimeout(() => scrollToBottom('smooth'), 0)
    } catch (error) {
      console.error('파일 업로드 실패:', error)
      alert('Flask 서버와 연결할 수 없습니다.')
    } finally {
      setUploading(false)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    uploadChatFile(file)
  }//까지 파일 업로드 때 추가

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // 수정: 채팅방 이동은 room_id 기준
  const switchChannel = (channelId) => {
    shouldAutoScrollRef.current = true //실시간 때 수정
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
  const toggleMember = (memberId) => { //실시간 때 수정
    const numericMemberId = Number(memberId) 

    setSelectedMemberIds(prev => {
      if (newRoomType === 'private') return prev.includes(numericMemberId) ? [] : [numericMemberId]
      
      return prev.includes(numericMemberId)
        ? prev.filter(id => id !== numericMemberId)
        : [...prev, numericMemberId]
    })
  }

  // 수정: 채팅방 생성 시 chat_rooms와 chat_room_members에 INSERT
  const createRoom = async () => {
    if (loading) return

     if (!currentUserId) { //실시간 때 추가
      alert('로그인 사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
      return
    }

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
    const memberIds = Array.from(new Set([currentUserId, ...selectedMemberIds]))  //추가 수정

    setLoading(true)

    try {
      const res = await fetch(`${API_BASE}/api/chat/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_type: newRoomType === 'private' ? 'DIRECT' : 'GROUP',
          room_name: roomName,
          creator_id: currentUserId, //실시간 때 수정
          member_ids: memberIds,
        }),
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.message || '채팅방 생성에 실패했습니다.')
        return
      }

      await fetchRooms()
      setActiveChannelId(normalizeRoom(data.room).id) //실시간 때 수정
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

  //공지 등록 때, 409부터 452까지 추가
  const registerNotice = async (msg) => {
  if (!activeChannelId || !currentUserId) {
    alert('채팅방 또는 사용자 정보를 찾을 수 없습니다.')
    return
  }

  const messageId = msg.messageId || msg.message_id || msg.id

  if (!messageId) {
    alert('메시지 ID를 찾을 수 없습니다.')
    return
  }

  if (!window.confirm('이 메시지를 공지로 등록할까요?')) {
    return
  }

  try {
    const res = await fetch(`${API_BASE}/api/chat/rooms/${activeChannelId}/notice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message_id: messageId,
        created_by: currentUserId,
      }),
    })

    const data = await res.json()

    if (!data.success) {
      alert(data.message || '공지 등록에 실패했습니다.')
      return
    }

    await fetchRoomNotice(activeChannelId)
    await fetchMessages(activeChannelId)
  } catch (error) {
    console.error('공지 등록 실패:', error)
    alert('Flask 서버와 연결할 수 없습니다.')
  }
}

//공지 내리기 때 454부터 483까지 추가
  const clearNotice = async () => {
    if (!activeChannelId) {
      alert('채팅방 정보를 찾을 수 없습니다.')
      return
    }

    if (!window.confirm('현재 공지를 내릴까요?')) {
      return
    }

    try {
      const res = await fetch(`${API_BASE}/api/chat/rooms/${activeChannelId}/notice`, {
        method: 'DELETE',
      })

      const data = await res.json()

      if (!data.success) {
        alert(data.message || '공지 내리기에 실패했습니다.')
        return
      }

      setRoomNotice(null)
      await fetchMessages(activeChannelId)
    } catch (error) {
      console.error('공지 내리기 실패:', error)
      alert('Flask 서버와 연결할 수 없습니다.')
    }
  }

  //공지 불러오기 때 486부터 501까지 추가
  const fetchRoomNotice = async (roomId) => {
    if (!roomId) return

    try {
      const res = await fetch(`${API_BASE}/api/chat/rooms/${roomId}/notice`)
      const data = await res.json()

      if (data.success && data.notice) {
        setRoomNotice(data.notice)
      } else {
        setRoomNotice(null)
      }
    } catch (error) {
      console.error('공지 조회 실패:', error)
    }
  }
  


  //파일 업로드 때 추가
  const renderMessageBubble = (msg) => {
    const isFileMessage = String(msg.messageType || '').toUpperCase() === 'FILE'

    if (isFileMessage) {
      const fileInfo = {
        originalName: msg.fileName || msg.content || '첨부 파일',
        mimeType: msg.mimeType || '',
        url: msg.fileUrl || '',
      }

      const fileTypeLabel = isImageFile(fileInfo.mimeType)
        ? '이미지 파일'
        : isVideoFile(fileInfo.mimeType)
        ? '동영상 파일'
        : '첨부 파일'

      const handleDownload = async () => {
        if (!fileInfo.url) {
          alert('파일 주소를 찾을 수 없습니다.')
          return
        }

        try {
          const response = await fetch(fileInfo.url)

          if (!response.ok) {
            throw new Error('파일 다운로드 실패')
          }

          const blob = await response.blob()
          const blobUrl = window.URL.createObjectURL(blob)

          const a = document.createElement('a')
          a.href = blobUrl
          a.download = fileInfo.originalName || 'download'
          document.body.appendChild(a)
          a.click()
          a.remove()

          window.URL.revokeObjectURL(blobUrl)
        } catch (error) {
          console.error(error)
          alert('파일 다운로드에 실패했습니다.')
        }
      }

      return (
        <div className="message-bubble file-message-bubble">
          <div
            className="chat-file-card"
            onClick={handleDownload}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleDownload()
              }
            }}
          >
            <div className="chat-file-left">
              <div className="chat-file-icon">
                {isImageFile(fileInfo.mimeType) ? '🖼️' : isVideoFile(fileInfo.mimeType) ? '🎬' : '📎'}
              </div>

              <div className="chat-file-info">
                <div className="chat-file-name">
                  {fileInfo.originalName}
                </div>
                <div className="chat-file-type">
                  {fileTypeLabel}
                </div>
              </div>
            </div>

            <button
              type="button"
              className="chat-file-download-btn"
              onClick={(e) => {
                e.stopPropagation()
                handleDownload()
              }}
            >
              다운로드
            </button>
          </div>
        </div>
      )
    }

    return <div className="message-bubble">{msg.content}</div>
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

      {/*공지 등록 때, 추가*/}
      {roomNotice && (
        <div className="chat-notice-bar">
          <div className="chat-notice-content">
            <div className="chat-notice-icon">📢</div>

            <div className="chat-notice-text">
              <strong>공지</strong>
              <p>{roomNotice.content}</p>
            </div>
          </div>

          <button
            className="chat-notice-close"
            onClick={clearNotice}
            title="공지 내리기"
          >
            ×
          </button>
        </div>
      )}


      {!currentUserId ? ( //실시간 때 추가
        <div className="chat-messages">
          <p style={{ color: '#64748b', fontSize: 14 }}>
            로그인 사용자 정보를 불러오는 중입니다.
          </p>
        </div>
      ) : (
      <div className="chat-messages" // 실시간 때 수정
          ref={messagesContainerRef}
          onScroll={handleMessagesScroll}>
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.isMe ? 'mine' : ''}`}>
            <Avatar src={msg.user.avatar} name={msg.user.name} />
            <div className="message-content">
              <div className="message-header">
                <span className="message-name">{msg.user.name}</span>
                <span className="message-time">{msg.time}</span>

                <button
                  type="button"
                  className="message-notice-btn"
                  onClick={() => registerNotice(msg)}
                  title="공지 등록"
                >
                  공지 등록
                </button>

                <button
                  type="button"
                  className="message-delete"
                  onClick={() => deleteMessage(msg.id)}
                  title="메시지 삭제"
                >
                  🗑
                </button>
              </div>
              {renderMessageBubble(msg)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      )}

      <div className="chat-input-wrapper">
        {emojiOpen && !mini && (
          <div className="emoji-picker">
            {emojis.map(e => (
              <button key={e} className="emoji-btn" onClick={() => { setMessage(prev => prev + e); setEmojiOpen(false) }}>{e}</button>
            ))}
          </div>
        )}

        <div className="chat-input">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <button
            type="button"
            className="btn btn-icon btn-ghost sm"
            title="사진/동영상 첨부"
            onClick={() => fileInputRef.current?.click()}
            disabled={!currentUserId || !activeChannelId || uploading}
          >
            {uploading ? '...' : <Icons.Paperclip className="sm" />}
          </button>

          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="메시지를 입력하세요... (Enter로 전송)"
            disabled={!currentUserId || !activeChannelId} 
          />{/*실시간 때 수정*/}
          {!mini && (
            <button className="btn btn-icon btn-ghost sm" onClick={() => setEmojiOpen(!emojiOpen)} title="이모지">
              <Icons.Smile className="sm" />
            </button>
          )}
          <button className="btn btn-primary btn-icon sm" onClick={sendMessage} title="전송" disabled={!currentUserId || !activeChannelId}>
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