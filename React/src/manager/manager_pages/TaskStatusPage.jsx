import { useEffect, useState } from 'react'
import '../App_manager.css'

const API_BASE = 'http://localhost:5000'

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

function PageHeader({ title, description, actionText = '새로고침', onAction }) {
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

function SummaryCards({ cards }) {
    return (
        <div className="summary-grid">
            {cards.map((card) => (
                <div className="summary-card" key={card.label}>
                    <p className="summary-card-label">{card.label}</p>
                    <p className="summary-card-value">{card.value}</p>
                    <p className="summary-card-sub">{card.sub}</p>
                </div>
            ))}
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

function StatusBadge({ children, tone = 'default' }) {
    return <span className={`status-badge ${tone}`}>{children}</span>
}

function normalizeTasks(data) {
    if (Array.isArray(data)) return data
    if (Array.isArray(data.tasks)) return data.tasks
    if (Array.isArray(data.data)) return data.data
    if (Array.isArray(data.result)) return data.result
    return []
}

function getStatusText(status) {
    if (status === 'TODO') return '대기'
    if (status === 'IN_PROGRESS') return '진행중'
    if (status === 'DONE') return '완료'
    if (status === 'HOLD') return '보류'

    if (status === 'todo') return '대기'
    if (status === 'in-progress') return '진행중'
    if (status === 'done') return '완료'
    if (status === 'hold') return '보류'

    return status || '-'
}

function getStatusTone(status) {
    if (status === 'TODO' || status === 'todo') return 'default'
    if (status === 'IN_PROGRESS' || status === 'in-progress') return 'blue'
    if (status === 'DONE' || status === 'done') return 'green'
    if (status === 'HOLD' || status === 'hold') return 'orange'

    return 'default'
}

function getPriorityText(priority) {
    if (priority === 'HIGH') return '높음'
    if (priority === 'MEDIUM') return '보통'
    if (priority === 'LOW') return '낮음'

    if (priority === 'high') return '높음'
    if (priority === 'medium') return '보통'
    if (priority === 'low') return '낮음'

    return priority || '-'
}

function getPriorityTone(priority) {
    if (priority === 'HIGH' || priority === 'high') return 'orange'
    if (priority === 'MEDIUM' || priority === 'medium') return 'blue'
    if (priority === 'LOW' || priority === 'low') return 'green'

    return 'default'
}

function isDelayed(task) {
    if (!task.due_date) return false

    const today = new Date()
    const dueDate = new Date(task.due_date)

    today.setHours(0, 0, 0, 0)
    dueDate.setHours(0, 0, 0, 0)

    const status = task.status

    return dueDate < today && status !== 'DONE' && status !== 'done'
}

function AdminTable({ tasks, loading, onChangeStatus, onDelete }) {
    return (
        <div className="table-wrap">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>업무명</th>
                        <th>담당자</th>
                        <th>담당 부서</th>
                        <th>우선순위</th>
                        <th>상태</th>
                        <th>마감일</th>
                        <th>생성일</th>
                        <th>관리</th>
                    </tr>
                </thead>

                <tbody>
                    {loading && (
                        <tr>
                            <td colSpan="8">업무 목록을 불러오는 중입니다.</td>
                        </tr>
                    )}

                    {!loading && tasks.length === 0 && (
                        <tr>
                            <td colSpan="8">등록된 업무가 없습니다.</td>
                        </tr>
                    )}

                    {!loading &&
                        tasks.map((task) => (
                            <tr key={task.task_id}>
                                <td>{task.title || '-'}</td>

                                <td>{task.assigned_to_name || '-'}</td>

                                <td>{task.assigned_to_department || task.department || '-'}</td>

                                <td>
                                    <StatusBadge tone={getPriorityTone(task.priority)}>
                                        {getPriorityText(task.priority)}
                                    </StatusBadge>
                                </td>

                                <td>
                                    <StatusBadge tone={getStatusTone(task.status)}>
                                        {getStatusText(task.status)}
                                    </StatusBadge>
                                </td>

                                <td>{task.due_date || '-'}</td>

                                <td>{task.created_at || '-'}</td>

                                <td>
                                    <div className="table-actions">
                                        <button
                                            className="btn btn-outline btn-sm"
                                            onClick={() => onChangeStatus(task.task_id, 'IN_PROGRESS')}
                                        >
                                            진행
                                        </button>

                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => onChangeStatus(task.task_id, 'DONE')}
                                        >
                                            완료
                                        </button>

                                        <button
                                            className="btn btn-destructive btn-sm"
                                            onClick={() => onDelete(task.task_id)}
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                </tbody>
            </table>
        </div>
    )
}

function TaskStatusPage() {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')

    useEffect(() => {
        loadTasks()
    }, [])

    async function loadTasks() {
        try {
            setLoading(true)
            setError('')
            setMessage('')

            const data = await apiGet('/api/tasks')
            const list = normalizeTasks(data)

            setTasks(list)
        } catch (err) {
            setError(err.message)
            setTasks([])
        } finally {
            setLoading(false)
        }
    }

    async function handleChangeStatus(taskId, status) {
        try {
            setError('')
            setMessage('')

            await apiPatch(`/api/tasks/${taskId}/status`, {
                status,
            })

            setMessage('업무 상태가 변경되었습니다.')
            await loadTasks()
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleDeleteTask(taskId) {
        const ok = window.confirm('이 업무를 삭제하시겠습니까?')
        if (!ok) return

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

    const totalCount = tasks.length

    const todoCount = tasks.filter((task) => {
        return task.status === 'TODO' || task.status === 'todo'
    }).length

    const progressCount = tasks.filter((task) => {
        return task.status === 'IN_PROGRESS' || task.status === 'in-progress'
    }).length

    const doneCount = tasks.filter((task) => {
        return task.status === 'DONE' || task.status === 'done'
    }).length

    const delayedCount = tasks.filter((task) => isDelayed(task)).length

    return (
        <>
            <PageHeader
                title="업무 현황"
                description="전체 업무 진행 현황을 조회하고 상태를 관리하는 페이지입니다."
                actionText="새로고침"
                onAction={loadTasks}
            />

            <SummaryCards
                cards={[
                    { label: '전체 업무', value: totalCount, sub: 'DB 등록 업무 수' },
                    { label: '대기', value: todoCount, sub: '아직 시작 전' },
                    { label: '진행 중', value: progressCount, sub: '처리 중인 업무' },
                    { label: '완료', value: doneCount, sub: '완료 처리됨' },
                    { label: '지연', value: delayedCount, sub: '마감일 초과' },
                ]}
            />

            {error && <div className="page-error">{error}</div>}
            {message && <div className="page-success">{message}</div>}

            <InfoCard title="업무 진행 목록" desc="업무명, 담당자, 부서, 우선순위, 상태, 마감일을 조회합니다.">
                <AdminTable
                    tasks={tasks}
                    loading={loading}
                    onChangeStatus={handleChangeStatus}
                    onDelete={handleDeleteTask}
                />
            </InfoCard>
        </>
    )
}

export default TaskStatusPage