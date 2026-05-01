import { useEffect, useState } from 'react'
import '../App_manager.css'

const API_BASE = 'http://localhost:5000'

function getStoredJson(key) {
    try {
        const value = sessionStorage.getItem(key) || sessionStorage.getItem(key)
        if (!value) return null
        return JSON.parse(value)
    } catch {
        return null
    }
}

function getAuthToken() {
    const directToken =
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken') ||
        sessionStorage.getItem('access_token') ||
        sessionStorage.getItem('access_token') ||
        sessionStorage.getItem('jwt') ||
        sessionStorage.getItem('jwt') ||
        ''

    if (directToken) return directToken

    const loginUser = getStoredJson('loginUser')
    const authUser = getStoredJson('authUser')
    const user = loginUser || authUser || {}

    return (
        user.token ||
        user.accessToken ||
        user.access_token ||
        user.jwt ||
        user?.user?.token ||
        user?.user?.accessToken ||
        user?.user?.access_token ||
        user?.user?.jwt ||
        ''
    )
}

async function apiGet(path) {
    const token = getAuthToken()

    if (!token) {
        throw new Error('로그인이 필요합니다.')
    }

    const res = await fetch(`${API_BASE}${path}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    })

    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.message || `GET ${path} 실패`)
    }

    return data
}

async function apiPost(path, body = null) {
    const token = getAuthToken()

    if (!token) {
        throw new Error('로그인이 필요합니다.')
    }

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
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

function getLoginUser() {
    try {
        const saved =
            sessionStorage.getItem('loginUser') ||
            sessionStorage.getItem('loginUser') ||
            sessionStorage.getItem('authUser') ||
            sessionStorage.getItem('authUser')

        if (!saved) return {}

        const parsed = JSON.parse(saved)

        if (parsed.user) {
            return parsed.user
        }

        return parsed
    } catch {
        return {}
    }
}

function getLoginEmployeeId() {
    const user = getLoginUser()

    return (
        user.employee_id ||
        user.employeeId ||
        user.id ||
        null
    )
}

const Icons = {
    Plus: ({ className = '' }) => (
        <svg
            className={`icon ${className}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
        </svg>
    ),
}

function PageHeader({ title, description, actionText = '추가', onAction }) {
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

function InfoCard({ title, desc, children }) {
    return (
        <div className="card">
            <div className="card-header">
                <div className="card-header-left">
                    <h3>{title}</h3>
                    <p>{desc}</p>
                </div>
            </div>

            <div className="card-content">{children}</div>
        </div>
    )
}

function getPriorityText(priority) {
    if (priority === 'HIGH') return '높음'
    if (priority === 'MEDIUM') return '보통'
    if (priority === 'LOW') return '낮음'
    return priority || '-'
}

function getStatusText(status) {
    if (status === 'TODO') return '대기'
    if (status === 'IN_PROGRESS') return '진행중'
    if (status === 'DONE') return '완료'
    if (status === 'HOLD') return '보류'
    return status || '-'
}

function normalizeEmployees(data) {
    if (Array.isArray(data)) return data
    if (Array.isArray(data.employees)) return data.employees
    if (Array.isArray(data.data)) return data.data
    if (Array.isArray(data.result)) return data.result
    return []
}

function normalizeTasks(data) {
    if (Array.isArray(data)) return data
    if (Array.isArray(data.tasks)) return data.tasks
    if (Array.isArray(data.data)) return data.data
    if (Array.isArray(data.result)) return data.result
    return []
}

//11번에 {currentUser?.name || '사용자'}로 수정
function TaskAssignPage() {
    const [employees, setEmployees] = useState([])
    const [recentTasks, setRecentTasks] = useState([])

    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [priority, setPriority] = useState('MEDIUM')
    const [dueDate, setDueDate] = useState('')

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    useEffect(() => {
        const token = getAuthToken()

        if (!token) {
            setError('로그인이 필요합니다.')
            setEmployees([])
            setRecentTasks([])
            return
        }

        loadEmployees()
        loadTasks()
    }, [])

    async function loadEmployees() {
        try {
            setError('')

            const data = await apiGet('/api/employees')
            const list = normalizeEmployees(data)

            setEmployees(list)
        } catch (err) {
            setError(err.message)
            setEmployees([])
        }
    }

    async function loadTasks() {
        try {
            const data = await apiGet('/api/tasks')
            const list = normalizeTasks(data)

            setRecentTasks(list)
        } catch {
            setRecentTasks([])
        }
    }

    async function handleCreateTask() {
        try {
            setLoading(true)
            setError('')
            setMessage('')

            const token = getAuthToken()

            if (!token) {
                setError('로그인이 필요합니다.')
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

            const assignedBy = getLoginEmployeeId()

            if (!assignedBy) {
                setError('로그인한 사용자 정보를 찾을 수 없습니다. 다시 로그인하세요.')
                return
            }

            await apiPost('/api/tasks', {
                title: title.trim(),
                description: description.trim(),
                assigned_to: Number(assignedTo),
                assigned_by: Number(assignedBy),
                priority,
                due_date: dueDate || null,
            })

            setTitle('')
            setDescription('')
            setAssignedTo('')
            setPriority('MEDIUM')
            setDueDate('')

            setMessage('업무가 배정되었습니다.')
            await loadTasks()
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <PageHeader
                title="업무 할당"
                description="직원에게 업무를 생성하고 배정하는 페이지입니다."
                actionText={loading ? '저장 중...' : '배정 저장'}
                onAction={handleCreateTask}
            />

            {error && <div className="page-error">{error}</div>}
            {message && <div className="page-success">{message}</div>}

            <div className="two-column-layout">
                <InfoCard title="업무 생성" desc="새로운 업무를 등록합니다.">
                    <div className="form-grid">
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
                    </div>
                </InfoCard>

                <InfoCard title="최근 배정 업무" desc="최근 생성된 업무 목록입니다.">
                    <ul className="plain-list">
                        {recentTasks.slice(0, 8).map((task) => (
                            <li key={task.task_id}>
                                {task.title} → {task.assigned_to_name || '미지정'} / {getPriorityText(task.priority)} / {getStatusText(task.status)}
                            </li>
                        ))}

                        {recentTasks.length === 0 && (
                            <li>최근 배정된 업무가 없습니다.</li>
                        )}
                    </ul>
                </InfoCard>
            </div>
        </>
    )
}

export default TaskAssignPage