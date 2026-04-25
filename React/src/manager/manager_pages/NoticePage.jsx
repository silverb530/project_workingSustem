import { useState, useEffect } from 'react'
import '../App_manager.css'

const API_BASE = 'http://localhost:5000'

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

async function apiPut(path, body = null) {
    const options = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
    }

    if (body !== null) {
        options.body = JSON.stringify(body)
    }

    const res = await fetch(`${API_BASE}${path}`, options)
    const data = await res.json()

    if (!res.ok) {
        throw new Error(data.message || `${path} 수정 실패`)
    }

    return data
}

function PageHeader({ title, description, actionText = '새로고침', onAction }) {
    return (
        <div className="page-header-block">
            <div>
                <h1 className="page-title">{title}</h1>
                <p className="page-description">{description}</p>
            </div>

            <button className="btn btn-primary btn-sm" onClick={onAction}>
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

function NoticePage() {
    const [notices, setNotices] = useState([])
    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [isPinned, setIsPinned] = useState(false)
    const [editingNoticeId, setEditingNoticeId] = useState(null)
    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const getLoginUser = () => {
        try {
            const saved = localStorage.getItem('loginUser')
            if (!saved) return {}
            return JSON.parse(saved)
        } catch {
            return {}
        }
    }

    const loginUser = getLoginUser()
    const authorId = loginUser.employee_id || loginUser.id || 3

    useEffect(() => {
        loadNotices()
    }, [])

    async function loadNotices() {
        try {
            setLoading(true)
            setError('')

            const data = await apiGet('/api/notices')

            if (Array.isArray(data)) {
                setNotices(data)
            } else {
                setNotices(data.notices || [])
            }
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    function resetForm() {
        setTitle('')
        setContent('')
        setIsPinned(false)
        setEditingNoticeId(null)
    }

    async function handleCreateOrUpdateNotice() {
        try {
            setMessage('')
            setError('')

            if (!title.trim()) {
                setError('공지 제목을 입력하세요.')
                return
            }

            if (!content.trim()) {
                setError('공지 내용을 입력하세요.')
                return
            }

            const body = {
                title,
                content,
                author_id: authorId,
                is_pinned: isPinned,
            }

            if (editingNoticeId) {
                await apiPut(`/api/notices/${editingNoticeId}`, body)
                setMessage('공지 수정 완료')
            } else {
                await apiPost('/api/notices', body)
                setMessage('공지 등록 완료')
            }

            resetForm()
            await loadNotices()
        } catch (err) {
            setError(err.message)
        }
    }

    function handleEdit(notice) {
        setEditingNoticeId(notice.notice_id)
        setTitle(notice.title || '')
        setContent(notice.content || '')
        setIsPinned(Number(notice.is_pinned) === 1)
        setMessage('')
        setError('')
    }

    async function handleDelete(noticeId) {
        if (!window.confirm('공지사항을 삭제할까요?')) {
            return
        }

        try {
            setMessage('')
            setError('')

            await apiDelete(`/api/notices/${noticeId}`)
            setMessage('공지 삭제 완료')
            await loadNotices()
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <>
            <PageHeader
                title="공지사항"
                description="공지 작성과 조회를 수행하는 페이지입니다."
                actionText="새로고침"
                onAction={loadNotices}
            />

            <div className="two-column-layout">
                <InfoCard
                    title={editingNoticeId ? '공지 수정' : '공지 작성'}
                    desc="제목과 내용을 입력하세요."
                >
                    <div className="form-grid">
                        <input
                            className="admin-input"
                            placeholder="공지 제목"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <textarea
                            className="admin-textarea"
                            placeholder="공지 내용"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />

                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                            <input
                                type="checkbox"
                                checked={isPinned}
                                onChange={(e) => setIsPinned(e.target.checked)}
                            />
                            상단 고정
                        </label>

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="btn btn-primary" onClick={handleCreateOrUpdateNotice}>
                                {editingNoticeId ? '공지 수정' : '공지 등록'}
                            </button>

                            {editingNoticeId && (
                                <button className="btn btn-outline" onClick={resetForm}>
                                    취소
                                </button>
                            )}
                        </div>
                    </div>

                    {message && <div className="page-success">{message}</div>}
                    {error && <div className="page-error">{error}</div>}
                </InfoCard>

                <InfoCard title="공지 목록" desc="Flask 서버에 저장된 공지입니다.">
                    {loading && <p className="page-description">불러오는 중...</p>}

                    {!loading && notices.length === 0 && (
                        <p className="page-description">등록된 공지사항이 없습니다.</p>
                    )}

                    <div className="notice-list">
                        {notices.map((notice) => (
                            <div key={notice.notice_id} className="notice-item">
                                <h4>
                                    {Number(notice.is_pinned) === 1 ? '📌 ' : ''}
                                    {notice.title}
                                </h4>

                                <p>{notice.content}</p>

                                <span>
                                    작성자: {notice.author_name || notice.author_id || '-'}
                                    {' · '}
                                    작성일: {notice.created_at || '-'}
                                </span>

                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleEdit(notice)}
                                    >
                                        수정
                                    </button>

                                    <button
                                        className="btn btn-destructive btn-sm"
                                        onClick={() => handleDelete(notice.notice_id)}
                                    >
                                        삭제
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </InfoCard>
            </div>
        </>
    )
}

export default NoticePage