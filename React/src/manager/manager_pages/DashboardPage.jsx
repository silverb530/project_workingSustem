import { useState, useEffect } from 'react'
import '../App_manager.css'

const API_BASE = `http://${window.location.hostname}:5000`
const FILE_BASE = API_BASE
const LOGIN_PATH = '/'

function getAuthToken() {
    const tokenKeys = [
        'token',
        'accessToken',
        'jwt',
        'authToken',
    ]

    const userKeys = [
        'loginUser',
        'adminUser',
        'currentUser',
        'authUser',
    ]

    const stores = [localStorage, sessionStorage]

    for (const store of stores) {
        for (const key of tokenKeys) {
            const token = store.getItem(key)

            if (token) {
                return token
            }
        }

        for (const key of userKeys) {
            try {
                const saved = store.getItem(key)

                if (!saved) continue

                const parsed = JSON.parse(saved)

                if (parsed?.token) return parsed.token
                if (parsed?.accessToken) return parsed.accessToken
                if (parsed?.jwt) return parsed.jwt
                if (parsed?.data?.token) return parsed.data.token
                if (parsed?.result?.token) return parsed.result.token
            } catch {
            }
        }
    }

    return null
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

async function apiPatch(path, body = null) {
    const options = {
        method: 'PATCH',
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

function pickUserObject(value) {
    if (!value || typeof value !== 'object') return null

    if (value.user && typeof value.user === 'object') return pickUserObject(value.user)
    if (value.employee && typeof value.employee === 'object') return pickUserObject(value.employee)
    if (value.data?.user && typeof value.data.user === 'object') return pickUserObject(value.data.user)
    if (value.result?.user && typeof value.result.user === 'object') return pickUserObject(value.result.user)

    return value
}

function getLoginUser() {
    const keys = [
        'loginUser',
        'adminUser',
        'currentUser',
        'authUser',
    ]

    const stores = [localStorage, sessionStorage]

    for (const store of stores) {
        for (const key of keys) {
            try {
                const saved = store.getItem(key)
                if (!saved) continue

                const parsed = JSON.parse(saved)
                const user = pickUserObject(parsed)

                if (!user) continue

                const employeeId = user.employee_id || user.employeeId || user.id

                if (employeeId) {
                    return user
                }
            } catch {
            }
        }
    }

    return null
}

function getLoginName(user) {
    if (!user) return ''

    return (
        user.name ||
        user.displayName ||
        user.display_name ||
        user.username ||
        user.email ||
        ''
    )
}

function getLoginEmployeeId(user) {
    if (!user) return null

    return (
        user.employee_id ||
        user.employeeId ||
        user.id ||
        null
    )
}

function LoginRequiredRedirect() {
    useEffect(() => {
        window.location.replace(LOGIN_PATH)
    }, [])

    return null
}

const Icons = {
    Plus: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    ),
    Search: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    ),
    Calendar: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M8 2v4" />
            <path d="M16 2v4" />
            <rect width="18" height="18" x="3" y="4" rx="2" />
            <path d="M3 10h18" />
        </svg>
    ),
    Circle: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
        </svg>
    ),
    Clock: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    ),
    CheckCircle: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
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
    FileText: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M10 9H8" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
        </svg>
    ),
    FileSpreadsheet: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M8 13h2" />
            <path d="M14 13h2" />
            <path d="M8 17h2" />
            <path d="M14 17h2" />
        </svg>
    ),
    Image: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
        </svg>
    ),
    Folder: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
        </svg>
    ),
    Grid: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
            <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
    ),
    List: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" x2="21" y1="6" y2="6" />
            <line x1="8" x2="21" y1="12" y2="12" />
            <line x1="8" x2="21" y1="18" y2="18" />
            <line x1="3" x2="3.01" y1="6" y2="6" />
            <line x1="3" x2="3.01" y1="12" y2="12" />
            <line x1="3" x2="3.01" y1="18" y2="18" />
        </svg>
    ),
    Upload: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
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

function TaskSection() {
    const loginUser = getLoginUser()
    const loginEmployeeId = getLoginEmployeeId(loginUser)

    const [tasks, setTasks] = useState([])
    const [employees, setEmployees] = useState([])
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [showForm, setShowForm] = useState(false)

    const [title, setTitle] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [priority, setPriority] = useState('MEDIUM')
    const [dueDate, setDueDate] = useState('')
    const [description, setDescription] = useState('')

    useEffect(() => {
        loadTasks()
        loadEmployees()
    }, [])

    async function loadTasks() {
        try {
            setError('')
            const data = await apiGet('/api/tasks')
            setTasks(normalizeList(data, 'tasks'))
        } catch (err) {
            setError(err.message)
            setTasks([])
        }
    }

    async function loadEmployees() {
        try {
            const data = await apiGet('/api/employees')
            setEmployees(normalizeList(data, 'employees'))
        } catch {
            setEmployees([])
        }
    }

    async function handleCreateTask() {
        try {
            setError('')
            setMessage('')

            if (!loginEmployeeId) {
                setError('로그인 사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
                return
            }

            if (!title.trim()) {
                setError('업무 제목을 입력하세요.')
                return
            }

            if (!assignedTo) {
                setError('담당 직원을 선택하세요.')
                return
            }

            await apiPost('/api/tasks', {
                title: title.trim(),
                description: description.trim(),
                assigned_to: Number(assignedTo),
                assigned_by: Number(loginEmployeeId),
                priority,
                due_date: dueDate || null,
            })

            setTitle('')
            setAssignedTo('')
            setPriority('MEDIUM')
            setDueDate('')
            setDescription('')
            setShowForm(false)

            setMessage('업무가 추가되었습니다.')
            await loadTasks()
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleDeleteTask(taskId) {
        try {
            setError('')
            setMessage('')

            await apiDelete(`/api/tasks/${taskId}`)

            setMessage('업무가 삭제되었습니다.')
            await loadTasks()
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleChangeTaskStatus(task) {
        try {
            setError('')
            setMessage('')

            let nextStatus = 'IN_PROGRESS'

            if (task.status === 'TODO' || !task.status) {
                nextStatus = 'IN_PROGRESS'
            } else if (task.status === 'IN_PROGRESS') {
                nextStatus = 'DONE'
            } else if (task.status === 'DONE') {
                nextStatus = 'TODO'
            }

            await apiPatch(`/api/tasks/${task.task_id}`, {
                status: nextStatus,
            })

            setMessage('업무 상태가 변경되었습니다.')
            await loadTasks()
        } catch (err) {
            setError(err.message)
        }
    }

    function getStatusText(status) {
        if (status === 'TODO') return '대기'
        if (status === 'IN_PROGRESS') return '진행중'
        if (status === 'DONE') return '완료'
        if (status === 'HOLD') return '보류'

        if (status === 'todo') return '대기'
        if (status === 'in-progress') return '진행중'
        if (status === 'done') return '완료'

        return status || '대기'
    }

    const StatusIcon = ({ status }) => {
        switch (status) {
            case 'DONE':
            case 'done':
                return <Icons.CheckCircle />
            case 'IN_PROGRESS':
            case 'in-progress':
                return <Icons.Clock />
            default:
                return <Icons.Circle />
        }
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-header-left">
                    <h3>업무</h3>
                    <p>총 {tasks.length}건</p>
                </div>

                <button className="btn btn-primary btn-sm" onClick={() => setShowForm((prev) => !prev)}>
                    <Icons.Plus className="sm" />
                    업무 추가
                </button>
            </div>

            <div className="card-content">
                {showForm && (
                    <div className="meeting-create-form">
                        <input
                            className="admin-input"
                            placeholder="업무 제목"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <select
                            className="admin-input"
                            value={assignedTo}
                            onChange={(e) => setAssignedTo(e.target.value)}
                        >
                            <option value="">담당 직원 선택</option>
                            {employees.map((emp) => (
                                <option key={emp.employee_id} value={emp.employee_id}>
                                    {emp.name} / {emp.department || '-'} / {emp.position || '-'}
                                </option>
                            ))}
                        </select>

                        <select
                            className="admin-input"
                            value={priority}
                            onChange={(e) => setPriority(e.target.value)}
                        >
                            <option value="LOW">낮음</option>
                            <option value="MEDIUM">보통</option>
                            <option value="HIGH">높음</option>
                        </select>

                        <input
                            className="admin-input"
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                        />

                        <textarea
                            className="admin-textarea"
                            placeholder="업무 설명"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />

                        <div className="meeting-create-actions">
                            <button className="btn btn-primary btn-sm" onClick={handleCreateTask}>
                                저장
                            </button>

                            <button className="btn btn-outline btn-sm" onClick={() => setShowForm(false)}>
                                취소
                            </button>
                        </div>
                    </div>
                )}

                {error && <div className="page-error">{error}</div>}
                {message && <div className="page-success">{message}</div>}

                <div className="task-list">
                    {tasks.map((task) => (
                        <div
                            key={task.id || task.task_id}
                            className={`task-item ${task.status === 'DONE' || task.status === 'done' ? 'completed' : ''}`}
                        >
                            <button
                                className={`task-status-btn ${task.status || 'TODO'}`}
                                onClick={() => handleChangeTaskStatus(task)}
                                title="상태 변경"
                            >
                                <StatusIcon status={task.status} />
                            </button>

                            <div className="task-content">
                                <p className={`task-title ${task.status === 'DONE' || task.status === 'done' ? 'completed' : ''}`}>
                                    {task.title || task.task_title || '업무'}
                                </p>

                                <div className="task-sub-info">
                                    <span>부서: {task.assigned_to_department || task.department || '-'}</span>
                                    <span>담당자: {task.assigned_to_name || task.assignee || '-'}</span>
                                    <span>상태: {getStatusText(task.status)}</span>
                                </div>

                                {task.description && (
                                    <div className="task-tags">
                                        <span className="task-tag">{task.description}</span>
                                    </div>
                                )}
                            </div>

                            <div className="task-meta">
                                <span className="task-date">{task.due_date || '-'}</span>

                                <button
                                    className="btn btn-destructive btn-sm"
                                    onClick={() => handleDeleteTask(task.id || task.task_id)}
                                >
                                    삭제
                                </button>
                            </div>
                        </div>
                    ))}

                    {tasks.length === 0 && !error && (
                        <div className="empty-state">등록된 업무가 없습니다.</div>
                    )}
                </div>
            </div>
        </div>
    )
}

function ChatSection() {
    const loginUser = getLoginUser()
    const loginName = getLoginName(loginUser)
    const loginEmployeeId = getLoginEmployeeId(loginUser)

    const [activeChannel, setActiveChannel] = useState('')
    const [activeRoomId, setActiveRoomId] = useState(null)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])
    const [channels, setChannels] = useState([])
    const [error, setError] = useState('')
    const [showEmoji, setShowEmoji] = useState(false)

    const emojiList = ['😀', '😂', '😎', '👍', '🔥', '❤️', '👏', '🎉']

    useEffect(() => {
        loadChatRooms()
    }, [])

    useEffect(() => {
        if (!activeRoomId) return

        loadChatLogs(activeRoomId)

        const timer = setInterval(() => {
            loadChatLogs(activeRoomId, true)
        }, 2000)

        return () => clearInterval(timer)
    }, [activeRoomId])

    async function loadChatRooms() {
        try {
            setError('')

            if (!loginEmployeeId) {
                setError('로그인 사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
                setChannels([])
                setActiveChannel('')
                setActiveRoomId(null)
                setMessages([])
                return
            }

            const data = await apiGet(`/api/chatrooms?employee_id=${loginEmployeeId}`)
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
                setActiveChannel('')
                setActiveRoomId(null)
                setMessages([])
            }
        } catch (err) {
            setError(err.message)
            setChannels([])
            setActiveChannel('')
            setActiveRoomId(null)
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
            const logs = normalizeList(data, 'chatlogs')

            const converted = logs.map((log) => {
                const senderId = String(log.sender_id || '')
                const myId = String(loginEmployeeId || '')

                return {
                    id: log.id || log.message_id || log.chat_id,
                    user: {
                        name: log.user || log.name || log.sender_name || senderId || '알 수 없음',
                        avatar: '',
                    },
                    content: log.message || log.content || '',
                    time: log.time || log.send_at || '',
                    isMe: senderId === myId,
                    fileName: log.file_name || null,
                    fileUrl: log.file_url ? makeFileUrl(log.file_url) : null,
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

        if (!loginEmployeeId) {
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
                user: loginName,
                sender_id: loginEmployeeId,
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

        if (!loginEmployeeId) {
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
            formData.append('user', loginName)
            formData.append('sender_id', loginEmployeeId)
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

function FileBoard() {
    const loginUser = getLoginUser()
    const loginEmployeeId = getLoginEmployeeId(loginUser)

    const [viewMode, setViewMode] = useState('grid')
    const [files, setFiles] = useState([])
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    useEffect(() => {
        loadFiles()
    }, [])

    async function loadFiles() {
        try {
            setError('')
            const data = await apiGet('/api/files')
            setFiles(normalizeList(data, 'files'))
        } catch (err) {
            setError(err.message)
            setFiles([])
        }
    }

    async function handleDeleteFile(fileId) {
        try {
            setError('')
            setMessage('')
            await apiDelete(`/api/files/${fileId}`)
            setMessage('파일이 삭제되었습니다.')
            await loadFiles()
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleUploadFile(e) {
        const file = e.target.files?.[0]
        if (!file) return

        if (!loginEmployeeId) {
            setError('로그인 사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.')
            e.target.value = ''
            return
        }

        try {
            setError('')
            setMessage('')

            const formData = new FormData()
            formData.append('file', file)
            formData.append('uploaded_by', loginEmployeeId)

            const res = await fetch(`${API_BASE}/api/files/upload`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: formData,
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || '파일 업로드 실패')
            }

            setMessage('파일 업로드 완료')
            await loadFiles()
        } catch (err) {
            setError(err.message)
        }

        e.target.value = ''
    }

    function openFile(file) {
        const fileUrl = file.file_url || file.url
        if (!fileUrl) return
        window.open(`${FILE_BASE}${fileUrl}`, '_blank')
    }

    const FileIcon = ({ type }) => {
        switch (type) {
            case 'pdf':
                return <Icons.FileText className={`xl file-icon ${type}`} />
            case 'spreadsheet':
                return <Icons.FileSpreadsheet className={`xl file-icon ${type}`} />
            case 'image':
                return <Icons.Image className={`xl file-icon ${type}`} />
            case 'folder':
                return <Icons.Folder className={`xl file-icon ${type}`} />
            default:
                return <Icons.FileText className="xl file-icon" />
        }
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-header-left">
                    <h3>파일</h3>
                    <p>최근 파일과 폴더</p>
                </div>

                <div className="files-header-actions">
                    <div className="view-toggle">
                        <button
                            className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Icons.Grid className="sm" />
                        </button>

                        <button
                            className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <Icons.List className="sm" />
                        </button>
                    </div>

                    <label className="btn btn-outline btn-sm file-upload-label">
                        <Icons.Upload className="sm" />
                        업로드
                        <input type="file" hidden onChange={handleUploadFile} />
                    </label>
                </div>
            </div>

            <div className="card-content">
                {error && <div className="page-error">{error}</div>}
                {message && <div className="page-success">{message}</div>}

                {viewMode === 'grid' ? (
                    <div className="files-grid">
                        {files.map((file) => (
                            <div key={file.id || file.file_id} className="file-card">
                                <div className={`file-icon-wrapper ${file.type}`}>
                                    <FileIcon type={file.type} />
                                </div>

                                <p className="file-name">{file.name || file.file_name}</p>
                                <p className="file-meta">{file.size || '-'} - {file.modified || file.uploaded_at || '-'}</p>

                                <div className="file-actions">
                                    <button className="btn btn-outline btn-sm" onClick={() => openFile(file)}>
                                        다운로드
                                    </button>

                                    <button
                                        className="btn btn-destructive btn-sm file-delete-btn"
                                        onClick={() => handleDeleteFile(file.id || file.file_id)}
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        ))}

                        {files.length === 0 && !error && (
                            <div className="empty-state">등록된 파일이 없습니다.</div>
                        )}
                    </div>
                ) : (
                    <div className="files-list">
                        {files.map((file) => (
                            <div key={file.id || file.file_id} className="file-list-item">
                                <div className={`file-list-icon file-icon-wrapper ${file.type}`}>
                                    <FileIcon type={file.type} />
                                </div>

                                <div className="file-list-content">
                                    <p className="file-name">{file.name || file.file_name}</p>
                                    <p className="file-meta">{file.size || '-'}</p>
                                </div>

                                <span className="file-list-date">{file.modified || file.uploaded_at || '-'}</span>

                                <button className="btn btn-outline btn-sm" onClick={() => openFile(file)}>
                                    다운로드
                                </button>

                                <button
                                    className="btn btn-destructive btn-sm"
                                    onClick={() => handleDeleteFile(file.id || file.file_id)}
                                >
                                    삭제
                                </button>
                            </div>
                        ))}

                        {files.length === 0 && !error && (
                            <div className="empty-state">등록된 파일이 없습니다.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function MeetingSection() {
    const loginUser = getLoginUser()
    const loginName = getLoginName(loginUser)

    const [meetings, setMeetings] = useState([])
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(true)

    const [newMeetingTitle, setNewMeetingTitle] = useState('')
    const [newMeetingTime, setNewMeetingTime] = useState('')
    const [newMeetingDuration, setNewMeetingDuration] = useState('')
    const [showMeetingForm, setShowMeetingForm] = useState(false)

    useEffect(() => {
        loadMeetings()
    }, [])

    async function loadMeetings() {
        try {
            setLoading(true)
            setError('')
            const data = await apiGet('/api/meetings')
            setMeetings(normalizeList(data, 'meetings'))
        } catch (err) {
            setError(err.message)
            setMeetings([])
        } finally {
            setLoading(false)
        }
    }

    async function handleJoinMeeting(meetingId) {
        try {
            setError('')
            setMessage('')
            await apiPost(`/api/meetings/${meetingId}/join`, { user: loginName })
            setMessage('회의 참가 완료')
            await loadMeetings()
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleStartMeeting(meetingId) {
        try {
            setError('')
            setMessage('')
            await apiPost(`/api/meetings/${meetingId}/start`)
            setMessage('회의가 시작되었습니다.')
            await loadMeetings()
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleLeaveMeeting(meetingId) {
        try {
            setError('')
            setMessage('')
            await apiPost(`/api/meetings/${meetingId}/leave`)
            setMessage('회의에서 나갔습니다.')
            await loadMeetings()
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleDeleteMeeting(meetingId) {
        try {
            setError('')
            setMessage('')
            await apiDelete(`/api/meetings/${meetingId}`)
            setMessage('회의가 삭제되었습니다.')
            await loadMeetings()
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleCreateMeeting() {
        try {
            setError('')
            setMessage('')

            if (!newMeetingTitle.trim()) {
                setError('회의 제목을 입력하세요.')
                return
            }

            await apiPost('/api/meetings', {
                title: newMeetingTitle.trim(),
                time: newMeetingTime.trim() || '미정',
                duration: newMeetingDuration.trim() || '미정',
                participants: [loginName || '사용자'],
            })

            setMessage('회의가 추가되었습니다.')
            setNewMeetingTitle('')
            setNewMeetingTime('')
            setNewMeetingDuration('')
            setShowMeetingForm(false)

            await loadMeetings()
        } catch (err) {
            setError(err.message)
        }
    }

    const liveMeeting = meetings.find((m) => m.is_live)
    const otherMeetings = meetings.filter((m) => !m.is_live)

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-header-left">
                    <h3>미팅</h3>
                    <p>{loading ? '불러오는 중...' : `예정된 회의 ${meetings.length}건`}</p>
                </div>

                <button
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowMeetingForm((prev) => !prev)}
                >
                    <Icons.Plus className="sm" />
                    일정 추가
                </button>
            </div>

            <div className="card-content">
                {showMeetingForm && (
                    <div className="meeting-create-form">
                        <input
                            className="admin-input"
                            placeholder="회의 제목"
                            value={newMeetingTitle}
                            onChange={(e) => setNewMeetingTitle(e.target.value)}
                        />

                        <input
                            className="admin-input"
                            placeholder="회의 시간 예: 오후 5:00"
                            value={newMeetingTime}
                            onChange={(e) => setNewMeetingTime(e.target.value)}
                        />

                        <input
                            className="admin-input"
                            placeholder="회의 길이 예: 30분"
                            value={newMeetingDuration}
                            onChange={(e) => setNewMeetingDuration(e.target.value)}
                        />

                        <div className="meeting-create-actions">
                            <button className="btn btn-primary btn-sm" onClick={handleCreateMeeting}>저장</button>
                            <button className="btn btn-outline btn-sm" onClick={() => setShowMeetingForm(false)}>취소</button>
                        </div>
                    </div>
                )}

                {error && <div className="page-error">{error}</div>}
                {message && <div className="page-success">{message}</div>}

                {liveMeeting && (
                    <div className="live-meeting">
                        <div className="live-meeting-content">
                            <div className="live-meeting-header">
                                <div className="live-badge">
                                    <div className="live-dot" />
                                    <span>현재 진행 중</span>
                                </div>

                                <span className="live-duration">LIVE</span>
                            </div>

                            <h4 className="live-meeting-title">{liveMeeting.title}</h4>

                            <div className="live-meeting-footer">
                                <div className="live-participants">
                                    {(liveMeeting.participants || []).map((name, i) => (
                                        <Avatar key={i} name={name} size="sm" />
                                    ))}
                                </div>

                                <div className="live-controls">
                                    <button
                                        className="btn btn-destructive btn-sm"
                                        onClick={() => handleLeaveMeeting(liveMeeting.id)}
                                    >
                                        나가기
                                    </button>

                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleDeleteMeeting(liveMeeting.id)}
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="meeting-list">
                    {otherMeetings.map((meeting) => (
                        <div key={meeting.id} className="meeting-item">
                            <div className="meeting-icon-wrapper">
                                <Icons.Calendar />
                            </div>

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
                                {(meeting.participants || []).slice(0, 3).map((name, i) => (
                                    <Avatar key={i} name={name} size="sm" />
                                ))}
                            </div>

                            <button className="btn btn-outline btn-sm" onClick={() => handleJoinMeeting(meeting.id)}>
                                참가
                            </button>

                            <button className="btn btn-primary btn-sm" onClick={() => handleStartMeeting(meeting.id)}>
                                시작
                            </button>

                            <button className="btn btn-destructive btn-sm" onClick={() => handleDeleteMeeting(meeting.id)}>
                                삭제
                            </button>
                        </div>
                    ))}

                    {otherMeetings.length === 0 && !liveMeeting && !error && (
                        <div className="empty-state">등록된 회의가 없습니다.</div>
                    )}
                </div>
            </div>
        </div>
    )
}

function DashboardPage() {
    const loginUser = getLoginUser()

    if (!loginUser) {
        return <LoginRequiredRedirect />
    }

    const loginName = getLoginName(loginUser)

    const [dashboardData, setDashboardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        loadDashboard()
    }, [])

    async function loadDashboard() {
        try {
            setLoading(true)
            setError('')
            const data = await apiGet('/api/dashboard')
            setDashboardData(data)
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="welcome-section">
                <h1>안녕하세요, {loginName}님</h1>
                <p>오늘 팀과 시스템 전반 현황을 확인할 수 있습니다.</p>
            </div>

            {error && <div className="page-error">{error}</div>}

            <div className="stats-row">
                <div className="stat-card">
                    <p className="stat-label">오늘 업무</p>
                    <p className="stat-value">{loading ? '...' : dashboardData?.today_tasks ?? 0}</p>
                    <p className="stat-change positive">Flask API 연동</p>
                </div>

                <div className="stat-card">
                    <p className="stat-label">온라인 사용자</p>
                    <p className="stat-value">{loading ? '...' : dashboardData?.online_users ?? 0}</p>
                    <p className="stat-change neutral">현재 접속 인원</p>
                </div>

                <div className="stat-card">
                    <p className="stat-label">긴급 알림</p>
                    <p className="stat-value">{loading ? '...' : dashboardData?.urgent_alerts ?? 0}</p>
                    <p className="stat-change warning">즉시 확인 필요</p>
                </div>

                <div className="stat-card">
                    <p className="stat-label">카메라 상태</p>
                    <p className="stat-value">{loading ? '...' : dashboardData?.devices?.camera ?? 'idle'}</p>
                    <p className="stat-change neutral">장치 상태</p>
                </div>
            </div>

            <div className="main-grid">
                <div className="grid-column">
                    <TaskSection />
                    <FileBoard />
                </div>

                <div className="grid-column">
                    <ChatSection />
                    <MeetingSection />
                </div>
            </div>
        </>
    )
}

export default DashboardPage