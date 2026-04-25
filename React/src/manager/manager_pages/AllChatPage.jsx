import { useState, useEffect } from 'react'
import '../App_manager.css'

const API_BASE = 'http://localhost:5000'
const FILE_BASE = API_BASE

async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`)
    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.message || `GET ${path} 실패`)
    }

    return data
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

function normalizeList(data, key) {
    if (Array.isArray(data)) return data
    if (Array.isArray(data?.[key])) return data[key]
    if (Array.isArray(data?.data)) return data.data
    if (Array.isArray(data?.result)) return data.result
    return []
}

function getLoginUser() {
    try {
        const saved =
            localStorage.getItem('loginUser') ||
            localStorage.getItem('user') ||
            localStorage.getItem('currentUser')

        if (!saved) return {}

        const parsed = JSON.parse(saved)

        if (parsed.user) return parsed.user
        if (parsed.employee) return parsed.employee
        if (parsed.data?.user) return parsed.data.user
        if (parsed.result?.user) return parsed.result.user

        return parsed
    } catch {
        return {}
    }
}

function getLoginEmployeeId(user) {
    return (
        user.employee_id ||
        user.employeeId ||
        user.id ||
        null
    )
}

function getLoginName(user) {
    return (
        user.name ||
        user.displayName ||
        user.display_name ||
        user.username ||
        user.email ||
        'manager'
    )
}

const Icons = {
    Plus: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    ),
    Hash: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" x2="20" y1="9" y2="9" />
            <line x1="4" x2="20" y1="15" y2="15" />
            <line x1="10" x2="8" y1="3" y2="21" />
            <line x1="16" x2="14" y1="3" y2="21" />
        </svg>
    ),
    Send: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m22 2-7 20-4-9-9-4Z" />
            <path d="M22 2 11 13" />
        </svg>
    ),
    Paperclip: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
        </svg>
    ),
    Smile: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" x2="9.01" y1="9" y2="9" />
            <line x1="15" x2="15.01" y1="9" y2="9" />
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

function PageHeader({ title, description, actionText = '채팅방 관리', onAction }) {
    return (
        <div className="page-header-block">
            <div>
                <h1 className="page-title">{title}</h1>
                <p className="page-description">{description}</p>
            </div>

            <button className="btn btn-primary btn-sm" onClick={onAction}>
                <Icons.Plus className="sm" />
                {actionText}
            </button>
        </div>
    )
}

function ChatSection({ showRoomManager }) {
    const loginUser = getLoginUser()
    const loginUserId = getLoginEmployeeId(loginUser)
    const loginUserName = getLoginName(loginUser)

    const [activeChannel, setActiveChannel] = useState('')
    const [activeRoomId, setActiveRoomId] = useState(null)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [error, setError] = useState('')
    const [showEmoji, setShowEmoji] = useState(false)

    const [channels, setChannels] = useState([])
    const [employees, setEmployees] = useState([])
    const [selectedMemberIds, setSelectedMemberIds] = useState([])
    const [newRoomName, setNewRoomName] = useState('')
    const [roomMessage, setRoomMessage] = useState('')

    const emojiList = ['😀', '😂', '😎', '👍', '🔥', '❤️', '👏', '🎉']

    useEffect(() => {
        loadChatRooms()
        loadEmployees()
    }, [])

    useEffect(() => {
        if (!activeRoomId) return

        loadChatLogs(activeRoomId)

        const timer = setInterval(() => {
            loadChatLogs(activeRoomId, true)
        }, 2000)

        return () => clearInterval(timer)
    }, [activeRoomId])

    async function loadEmployees() {
        try {
            const data = await apiGet('/api/employees')
            const list = normalizeList(data, 'employees')
            setEmployees(list)
        } catch {
            setEmployees([])
        }
    }

    async function loadChatRooms() {
        try {
            setError('')

            if (!loginUserId) {
                setError('로그인 사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
                setChannels([])
                setActiveRoomId(null)
                setActiveChannel('')
                setMessages([])
                return
            }

            const data = await apiGet(`/api/chatrooms?employee_id=${loginUserId}`)
            const rooms = normalizeList(data, 'chatrooms')

            const converted = rooms.map((room) => ({
                id: room.room_id,
                name: room.room_name,
                unread: 0,
            }))

            setChannels(converted)

            if (converted.length > 0) {
                setActiveRoomId((prevRoomId) => {
                    const exists = converted.some((room) => room.id === prevRoomId)

                    if (exists) {
                        const currentRoom = converted.find((room) => room.id === prevRoomId)
                        setActiveChannel(currentRoom.name)
                        return prevRoomId
                    }

                    setActiveChannel(converted[0].name)
                    return converted[0].id
                })
            } else {
                setActiveRoomId(null)
                setActiveChannel('')
                setMessages([])
            }
        } catch (err) {
            setError(err.message)
            setChannels([])
            setActiveRoomId(null)
            setActiveChannel('')
            setMessages([])
        }
    }

    async function loadChatLogs(roomId = activeRoomId, silent = false) {
        try {
            if (!silent) {
                setError('')
            }

            if (!roomId) {
                setMessages([])
                return
            }

            const data = await apiGet(`/api/chatlogs?room_id=${roomId}`)
            const rows = normalizeList(data, 'chatlogs')

            const converted = rows.map((log) => {
                const senderId = String(log.sender_id || '')
                const myId = String(loginUserId || '')

                return {
                    id: log.id || log.message_id || log.chat_id,
                    roomId: log.room_id,
                    senderId: log.sender_id,
                    user: {
                        name: log.user || log.name || log.sender_name || senderId || '알 수 없음',
                        avatar: '',
                    },
                    content: log.message || log.content || '',
                    time: log.time || log.send_at || '',
                    isMe: senderId === myId,
                    fileName: log.file_name || null,
                    fileUrl: log.file_url ? `${FILE_BASE}${log.file_url}` : null,
                }
            })

            setMessages(converted)
        } catch (err) {
            if (!silent) {
                setError(err.message)
            }
        }
    }

    async function handleSend() {
        if (!message.trim()) return

        if (!loginUserId) {
            setError('로그인 사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
            return
        }

        if (!activeRoomId) {
            setError('채팅방을 선택하세요.')
            return
        }

        try {
            setError('')

            await apiPost('/api/chatlogs', {
                room_id: activeRoomId,
                sender_id: loginUserId,
                message: message.trim(),
            })

            setMessage('')
            await loadChatLogs(activeRoomId)
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleDeleteChat(chatId) {
        try {
            setError('')

            await apiDelete(`/api/chatlogs/${chatId}`)
            await loadChatLogs(activeRoomId)
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleUploadChatFile(e) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!loginUserId) {
            setError('로그인 사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
            e.target.value = ''
            return
        }

        if (!activeRoomId) {
            setError('채팅방을 선택하세요.')
            e.target.value = ''
            return
        }

        try {
            setError('')

            const formData = new FormData()
            formData.append('file', file)
            formData.append('user', loginUserName)
            formData.append('sender_id', loginUserId)
            formData.append('room_id', activeRoomId)

            const res = await fetch(`${API_BASE}/api/chatlogs/upload`, {
                method: 'POST',
                body: formData,
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || '채팅 파일 업로드 실패')
            }

            await loadChatLogs(activeRoomId)
        } catch (err) {
            setError(err.message)
        }

        e.target.value = ''
    }

    function toggleMember(employeeId) {
        setSelectedMemberIds((prev) => {
            if (prev.includes(employeeId)) {
                return prev.filter((id) => id !== employeeId)
            }

            return [...prev, employeeId]
        })
    }

    async function handleCreateRoom() {
        try {
            setRoomMessage('')
            setError('')

            if (!loginUserId) {
                setError('로그인 사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
                return
            }

            if (!newRoomName.trim()) {
                setError('채팅방 이름을 입력하세요.')
                return
            }

            await apiPost('/api/chatrooms', {
                room_name: newRoomName.trim(),
                employee_id: loginUserId,
                created_by: loginUserId,
                member_ids: selectedMemberIds,
            })

            setNewRoomName('')
            setSelectedMemberIds([])
            setRoomMessage('채팅방이 생성되었습니다.')
            await loadChatRooms()
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleDeleteRoom(roomId) {
        const ok = window.confirm('이 채팅방을 삭제하시겠습니까?')
        if (!ok) return

        try {
            setRoomMessage('')
            setError('')

            await apiDelete(`/api/chatrooms/${roomId}`)

            setRoomMessage('채팅방이 삭제되었습니다.')
            await loadChatRooms()
        } catch (err) {
            setError(err.message)
        }
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

    function handleChannelClick(channel) {
        setActiveChannel(channel.name)
        setActiveRoomId(channel.id)
    }

    return (
        <div className="card chat-card">
            <div className="chat-header">
                <div className="chat-header-left">
                    <h3>채팅</h3>

                    <div className="chat-channel-badge">
                        <Icons.Hash className="sm" />
                        <span>{activeChannel || '채팅방 없음'}</span>
                    </div>
                </div>

                <div className="channel-tabs">
                    {channels.map((channel) => (
                        <button
                            key={channel.id}
                            onClick={() => handleChannelClick(channel)}
                            className={`channel-tab ${activeChannel === channel.name ? 'active' : ''}`}
                        >
                            #{channel.name}
                        </button>
                    ))}
                </div>
            </div>

            {showRoomManager && (
                <div className="chat-room-manager">
                    <div className="chat-room-create">
                        <input
                            className="admin-input"
                            placeholder="새 채팅방 이름"
                            value={newRoomName}
                            onChange={(e) => setNewRoomName(e.target.value)}
                        />

                        <button className="btn btn-primary btn-sm" onClick={handleCreateRoom}>
                            생성
                        </button>
                    </div>

                    <div className="chat-room-member-select">
                        <p className="chat-room-member-title">초대할 직원 선택</p>

                        <div className="chat-room-member-list">
                            {employees.map((emp) => {
                                const employeeId = emp.employee_id || emp.employeeId || emp.id
                                const checked = selectedMemberIds.includes(employeeId)
                                const isMe = String(employeeId) === String(loginUserId)

                                return (
                                    <label key={employeeId} className={`chat-room-member-option ${isMe ? 'disabled' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={checked || isMe}
                                            disabled={isMe}
                                            onChange={() => toggleMember(employeeId)}
                                        />

                                        <span>
                                            {emp.name || '-'} / {emp.department || '-'} / {emp.position || '-'}
                                            {isMe ? ' (나)' : ''}
                                        </span>
                                    </label>
                                )
                            })}

                            {employees.length === 0 && (
                                <div className="empty-state">직원 목록이 없습니다.</div>
                            )}
                        </div>
                    </div>

                    {roomMessage && <div className="page-success">{roomMessage}</div>}

                    <div className="chat-room-list">
                        {channels.map((room) => (
                            <div key={room.id} className="chat-room-item">
                                <span>#{room.name}</span>

                                <button
                                    className="btn btn-destructive btn-sm"
                                    onClick={() => handleDeleteRoom(room.id)}
                                >
                                    삭제
                                </button>
                            </div>
                        ))}

                        {channels.length === 0 && (
                            <div className="empty-state">초대된 채팅방이 없습니다.</div>
                        )}
                    </div>
                </div>
            )}

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

                {messages.length === 0 && !error && (
                    <div className="empty-state">채팅 내역이 없습니다.</div>
                )}
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
                        placeholder="메시지를 입력하세요."
                        disabled={!activeRoomId}
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
    const [showRoomManager, setShowRoomManager] = useState(false)

    return (
        <>
            <PageHeader
                title="전체 채팅"
                description="전 직원 대상 단체 채팅방 화면입니다."
                actionText="채팅방 관리"
                onAction={() => setShowRoomManager((prev) => !prev)}
            />

            <div className="full-width-card">
                <ChatSection showRoomManager={showRoomManager} />
            </div>
        </>
    )
}

export default AllChatPage