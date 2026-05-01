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

function getLoginUser() {
    try {
        const saved = sessionStorage.getItem('loginUser')
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
        1
    )
}

function normalizeFiles(data) {
    if (Array.isArray(data)) return data
    if (Array.isArray(data.files)) return data.files
    if (Array.isArray(data.data)) return data.data
    if (Array.isArray(data.result)) return data.result
    return []
}

const Icons = {
    Plus: ({ className = '' }) => (
        <svg className={`icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14" />
            <path d="M12 5v14" />
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

function FileBoard() {
    const [viewMode, setViewMode] = useState('grid')
    const [files, setFiles] = useState([])
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadFiles()
    }, [])

    async function loadFiles() {
        try {
            setLoading(true)
            setError('')

            const data = await apiGet('/api/files')
            setFiles(normalizeFiles(data))
        } catch (err) {
            setError(err.message)
            setFiles([])
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteFile(fileId) {
        const ok = window.confirm('이 파일을 삭제하시겠습니까?')
        if (!ok) return

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

        try {
            setError('')
            setMessage('')

            const formData = new FormData()
            formData.append('file', file)
            formData.append('uploaded_by', getLoginEmployeeId())

            const res = await fetch(`${API_BASE}/api/files/upload`, {
                method: 'POST',
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

    function openFile(file) {
        const fileUrl = file.file_url || file.url

        if (!fileUrl) return

        window.open(`${FILE_BASE}${fileUrl}`, '_blank')
    }

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-header-left">
                    <h3>파일</h3>
                    <p>{loading ? '불러오는 중...' : `최근 파일과 폴더 ${files.length}개`}</p>
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
                                <p className="file-meta">
                                    {file.size || '-'} - {file.modified || file.uploaded_at || '-'}
                                </p>

                                <div className="file-actions">
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={() => openFile(file)}
                                    >
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

                        {files.length === 0 && !loading && !error && (
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

                                <span className="file-list-date">
                                    {file.modified || file.uploaded_at || '-'}
                                </span>

                                <button
                                    className="btn btn-outline btn-sm"
                                    onClick={() => openFile(file)}
                                >
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

                        {files.length === 0 && !loading && !error && (
                            <div className="empty-state">등록된 파일이 없습니다.</div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

function FileSharePage() {
    const [files, setFiles] = useState([])

    useEffect(() => {
        loadSummary()
    }, [])

    async function loadSummary() {
        try {
            const data = await apiGet('/api/files')
            setFiles(normalizeFiles(data))
        } catch {
            setFiles([])
        }
    }

    const totalCount = files.length

    const thisWeekCount = files.filter((file) => {
        const dateText = file.uploaded_at || file.modified
        if (!dateText) return false

        const uploadedDate = new Date(dateText)
        const now = new Date()
        const diff = now - uploadedDate
        const sevenDays = 7 * 24 * 60 * 60 * 1000

        return diff >= 0 && diff <= sevenDays
    }).length

    const imageCount = files.filter((file) => file.type === 'image').length

    return (
        <>
            <PageHeader
                title="파일 공유"
                description="파일 업로드, 다운로드, 삭제를 관리하는 페이지입니다."
                actionText="새로고침"
                onAction={loadSummary}
            />

            <SummaryCards
                cards={[
                    { label: '전체 파일', value: totalCount, sub: '공유 중' },
                    { label: '이번 주 업로드', value: thisWeekCount, sub: '최근 7일 기준' },
                    { label: '이미지 파일', value: imageCount, sub: '이미지 타입 기준' },
                ]}
            />

            <div className="full-width-card">
                <FileBoard />
            </div>
        </>
    )
}

export default FileSharePage