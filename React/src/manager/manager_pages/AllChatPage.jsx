import { useState, useEffect } from 'react'
import '../App_manager.css'

const API_BASE = 'http://localhost:5000'
const FILE_BASE = API_BASE
const ROOM_PAGE_SIZE = 10 //채팅 로그 때 추가

function getStoredJson(key) {
    try {
        const value = localStorage.getItem(key) || sessionStorage.getItem(key)

        if (!value) {
            return null
        }

        return JSON.parse(value)
    } catch {
        return null
    }
}

function getAuthToken() {
    const directToken =
        localStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken') ||
        localStorage.getItem('access_token') ||
        sessionStorage.getItem('access_token') ||
        localStorage.getItem('jwt') ||
        sessionStorage.getItem('jwt') ||
        localStorage.getItem('authToken') ||
        sessionStorage.getItem('authToken') ||
        ''

    if (directToken) {
        return directToken
    }

    const loginUser = getStoredJson('loginUser')
    const user = getStoredJson('user')
    const currentUser = getStoredJson('currentUser')
    const authUser = getStoredJson('authUser')
    const saved = loginUser || user || currentUser || authUser || {}

    return (
        saved.token ||
        saved.accessToken ||
        saved.access_token ||
        saved.jwt ||
        saved.authToken ||
        saved?.user?.token ||
        saved?.user?.accessToken ||
        saved?.user?.access_token ||
        saved?.user?.jwt ||
        saved?.user?.authToken ||
        saved?.data?.token ||
        saved?.data?.accessToken ||
        saved?.data?.access_token ||
        saved?.result?.token ||
        saved?.result?.accessToken ||
        saved?.result?.access_token ||
        ''
    )
}

function getAuthHeaders(extraHeaders = {}) {
    const token = getAuthToken()

    if (!token) {
        return extraHeaders
    }

    return {
        ...extraHeaders,
        Authorization: `Bearer ${token}`,
    }
}

async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'GET',
        headers: getAuthHeaders(),
    })

    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.message || `GET ${path} 실패`)
    }

    return data
}

async function apiDelete(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
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
        headers: getAuthHeaders({
            'Content-Type': 'application/json',
        }),
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

//채팅 로그 때 추가
function normalizeRoomType(type) {
    const value = String(type || '').toUpperCase()

    if (value === 'DIRECT' || value === 'PRIVATE' || value === 'DM') {
        return 'DIRECT'
    }

    return 'GROUP'
}

//채팅 로그 때 추가
function getRoomTypeLabel(type) {
    return normalizeRoomType(type) === 'DIRECT' ? '개인' : '그룹'
}

function getLoginUser() {
    try {
        const saved =
            localStorage.getItem('loginUser') ||
            sessionStorage.getItem('loginUser') ||
            localStorage.getItem('user') ||
            sessionStorage.getItem('user') ||
            localStorage.getItem('currentUser') ||
            sessionStorage.getItem('currentUser')

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
    const [roomPage, setRoomPage] = useState(1) //채팅 로그 때 추가
    const [selectedMemberIds, setSelectedMemberIds] = useState([])
    const [newRoomName, setNewRoomName] = useState('')
    const [roomMessage, setRoomMessage] = useState('')

    const emojiList = ['😀', '😂', '😎', '👍', '🔥', '❤️', '👏', '🎉']

    //채팅 로그 때 추가
    const [detailOpen, setDetailOpen] = useState(false)
    const [selectedRoom, setSelectedRoom] = useState(null)
    const [detailMessages, setDetailMessages] = useState([])

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

    //관리자 채팅 로그 확인 때, 추가
    async function loadChatRooms() {
        try {
            setError('')

            // 관리자 전체 채팅 페이지이므로 employee_id 없이 전체 채팅방 조회
            const data = await apiGet('/api/chatrooms')
            const rooms = normalizeList(data, 'chatrooms')

            const converted = rooms.map((room) => {
                const rawType =
                    room.room_type ||
                    room.type ||
                    room.roomType ||
                    room.chat_type ||
                    room.chatType ||
                    'GROUP'

                return {
                    id: room.room_id || room.id,
                    name: room.room_name || room.name || `채팅방 ${room.room_id || room.id}`,
                    type: normalizeRoomType(rawType),
                    createdAt: room.created_at || room.createdAt || '',
                    deletedId: room.deleted_id ?? 0,
                    unread: 0,
                }
            }).filter((room) => room.id && Number(room.deletedId) === 0)

            setChannels(converted)
            setRoomPage(1) //채팅 로그 때 추가

            if (converted.length > 0) {
                const selectedRoom =
                    converted.find((room) => String(room.id) === String(activeRoomId)) ||
                    converted[0]

                setActiveRoomId(selectedRoom.id)
                setActiveChannel(selectedRoom.name)
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
                headers: getAuthHeaders(),
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

    //채팅 로그 때 수정
    async function handleRoomTitleClick(room) {
        try {
            setError('')

            setSelectedRoom(room)
            setActiveChannel(room.name)
            setActiveRoomId(room.id)
            setDetailOpen(true)

            const data = await apiGet(`/api/chatlogs?room_id=${room.id}`)
            const rows = normalizeList(data, 'chatlogs')

            const converted = rows.map((log) => ({
                id: log.id || log.message_id || log.chat_id,
                roomId: log.room_id,
                senderId: log.sender_id,
                userName: log.user || log.name || log.sender_name || String(log.sender_id || '알 수 없음'),
                content: log.message || log.content || '',
                time: log.time || log.send_at || '',
                messageType: log.message_type || 'TEXT',
                fileName: log.file_name || '',
                fileUrl: log.file_url ? `${FILE_BASE}${log.file_url}` : '',
                mimeType: log.mime_type || '',
                isNotice: Number(log.is_notice || 0) === 1,
            }))

            setDetailMessages(converted)
        } catch (err) {
            setError(err.message)
            setDetailMessages([])
        }
    }

    //채팅 로그 때 추가
    function closeDetailView() {
        setDetailOpen(false)
        setSelectedRoom(null)
        setDetailMessages([])
    }

    //채팅 로그 때 추가
    const totalRoomPages = Math.max(1, Math.ceil(channels.length / ROOM_PAGE_SIZE))

    const safeRoomPage = Math.min(roomPage, totalRoomPages)

    const pagedChannels = channels.slice(
        (safeRoomPage - 1) * ROOM_PAGE_SIZE,
        safeRoomPage * ROOM_PAGE_SIZE
    )

    const roomPageNumbers = Array.from(
        { length: totalRoomPages },
        (_, index) => index + 1
    ) //채팅 로그 때 추가

    //채팅 로그 때 대대적으로 수정
    return (
        <div className="admin-chat-log-page">
            <div className="admin-chat-log-list-card">
                <div className="admin-chat-log-toolbar">
                    <h3>채팅 로그</h3>

                    <div className="admin-chat-log-search">
                        <input
                            type="text"
                            placeholder="채팅방명 검색"
                        />
                    </div>
                </div>

                {error && <div className="page-error">{error}</div>}

                <div className="admin-chat-log-table-wrap">
                    <table className="admin-chat-log-table">
                        <thead>
                            <tr>
                                <th className="check-col">
                                    <input type="checkbox" />
                                </th>
                                <th>채팅방명 / 제목</th>
                                <th>개인 / 그룹</th>
                                <th>생성일자</th>
                            </tr>
                        </thead>

                        <tbody>
                            {pagedChannels.map((room) => (
                                <tr key={room.id}>
                                    <td>
                                        <input type="checkbox" />
                                    </td>

                                    <td>
                                        <button
                                            type="button"
                                            className="admin-chat-room-title-btn"
                                            onClick={() => handleRoomTitleClick(room)}
                                        >
                                            {room.name}
                                        </button>
                                    </td>

                                    <td>
                                        <span className={`admin-room-type-badge ${normalizeRoomType(room.type).toLowerCase()}`}>
                                            {getRoomTypeLabel(room.type)}
                                        </span>
                                    </td>

                                    <td>
                                        {room.createdAt
                                            ? String(room.createdAt).slice(0, 16)
                                            : '-'}
                                    </td>
                                </tr>
                            ))}

                            {channels.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="admin-chat-log-empty">
                                        생성된 채팅방이 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="admin-chat-log-pagination">
                    <button
                        type="button"
                        onClick={() => setRoomPage(1)}
                        disabled={safeRoomPage === 1}
                    >
                        ≪
                    </button>

                    <button
                        type="button"
                        onClick={() => setRoomPage((prev) => Math.max(1, prev - 1))}
                        disabled={safeRoomPage === 1}
                    >
                        ‹
                    </button>

                    {roomPageNumbers.map((page) => (
                        <button
                            key={page}
                            type="button"
                            className={safeRoomPage === page ? 'active' : ''}
                            onClick={() => setRoomPage(page)}
                        >
                            {page}
                        </button>
                    ))}

                    <button
                        type="button"
                        onClick={() => setRoomPage((prev) => Math.min(totalRoomPages, prev + 1))}
                        disabled={safeRoomPage === totalRoomPages}
                    >
                        ›
                    </button>

                    <button
                        type="button"
                        onClick={() => setRoomPage(totalRoomPages)}
                        disabled={safeRoomPage === totalRoomPages}
                    >
                        ≫
                    </button>
                </div>
            </div>

            {detailOpen && selectedRoom && (
                <div className="admin-chat-detail-overlay">
                    <div className="admin-chat-detail-card">
                        <div className="admin-chat-detail-header">
                            <div>
                                <h3>{selectedRoom.name}</h3>
                                <p>채팅방 ID: {selectedRoom.id}</p>
                            </div>

                            <button
                                type="button"
                                className="admin-chat-detail-close"
                                onClick={closeDetailView}
                            >
                                ×
                            </button>
                        </div>

                        <div className="admin-chat-detail-table-wrap">
                            <table className="admin-chat-detail-table">
                                <thead>
                                    <tr>
                                        <th>이름</th>
                                        <th>내용</th>
                                        <th>입력 날짜/시간</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {detailMessages.map((msg) => (
                                        <tr key={msg.id}>
                                            <td>{msg.userName}</td>

                                            <td>
                                                {msg.messageType === 'FILE' ? (
                                                    <div className="admin-detail-file-row">
                                                        <span>
                                                            📎 {msg.fileName || msg.content || '첨부 파일'}
                                                        </span>

                                                        {msg.fileUrl && (
                                                            <a
                                                                href={msg.fileUrl}
                                                                download
                                                                target="_blank"
                                                                rel="noreferrer"
                                                            >
                                                                다운로드
                                                            </a>
                                                        )}
                                                    </div>
                                                ) : (
                                                    msg.content
                                                )}

                                                {msg.isNotice && (
                                                    <span className="admin-detail-notice-badge">
                                                        공지
                                                    </span>
                                                )}
                                            </td>

                                            <td>{msg.time ? String(msg.time).slice(0, 19) : '-'}</td>
                                        </tr>
                                    ))}

                                    {detailMessages.length === 0 && (
                                        <tr>
                                            <td colSpan="3" className="admin-chat-log-empty">
                                                채팅 내역이 없습니다.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
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