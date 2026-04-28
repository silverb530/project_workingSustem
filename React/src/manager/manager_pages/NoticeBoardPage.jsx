import { useState, useEffect, useRef } from 'react'
import '../App_manager.css'

const API_BASE = `http://${window.location.hostname}:5000`

async function readJsonResponse(res, fallbackMessage) {
    let data = {}

    try {
        data = await res.json()
    } catch {
        data = {}
    }

    if (!res.ok) {
        throw new Error(data.message || fallbackMessage)
    }

    return data
}

async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`)
    return readJsonResponse(res, `GET ${path} 실패`)
}

async function apiDelete(path) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'DELETE',
    })

    return readJsonResponse(res, `${path} 삭제 실패`)
}

async function apiPostForm(path, formData) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        body: formData,
    })

    return readJsonResponse(res, `${path} 요청 실패`)
}

async function apiPutForm(path, formData) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        body: formData,
    })

    return readJsonResponse(res, `${path} 수정 실패`)
}

function formatFileSize(size) {
    const value = Number(size || 0)

    if (value >= 1024 * 1024) {
        return `${(value / 1024 / 1024).toFixed(1)} MB`
    }

    if (value >= 1024) {
        return `${(value / 1024).toFixed(1)} KB`
    }

    return `${value} B`
}

function getLoginUser() {
    try {
        const saved = localStorage.getItem('loginUser')
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

function getLoginName(user) {
    return (
        user.name ||
        user.displayName ||
        user.display_name ||
        user.username ||
        user.email ||
        '사용자'
    )
}

function NoticeBoardPage() {
    const [mode, setMode] = useState('list')

    const [boards, setBoards] = useState([])
    const [selectedBoard, setSelectedBoard] = useState(null)
    const [selectedFiles, setSelectedFiles] = useState([])
    const [comments, setComments] = useState([])

    const [title, setTitle] = useState('')
    const [content, setContent] = useState('')
    const [category, setCategory] = useState('일반')
    const [uploadFiles, setUploadFiles] = useState([])
    const [editingBoardId, setEditingBoardId] = useState(null)

    const [commentContent, setCommentContent] = useState('')
    const [searchKeyword, setSearchKeyword] = useState('')
    const [categoryFilter, setCategoryFilter] = useState('전체')

    const [message, setMessage] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [detailLoading, setDetailLoading] = useState(false)

    const titleRef = useRef(null)
    const contentRef = useRef(null)
    const categoryRef = useRef(null)
    const commentRef = useRef(null)

    const loginUser = getLoginUser()
    const authorId = loginUser.employee_id || loginUser.id || 1
    const loginName = getLoginName(loginUser)

    useEffect(() => {
        loadBoards()
    }, [])

    const filteredBoards = boards.filter((board) => {
        const keyword = searchKeyword.trim().toLowerCase()
        const boardCategory = board.category || '일반'

        if (categoryFilter !== '전체' && boardCategory !== categoryFilter) {
            return false
        }

        if (!keyword) {
            return true
        }

        const targetText = [
            board.title,
            board.content,
            board.category,
            board.author_name,
            board.author_id,
        ].join(' ').toLowerCase()

        return targetText.includes(keyword)
    })

    async function loadBoards() {
        try {
            setLoading(true)
            setError('')

            const data = await apiGet('/api/boards')

            if (Array.isArray(data)) {
                setBoards(data)
            } else {
                setBoards(data.boards || [])
            }
        } catch (err) {
            setError(err.message)
            setBoards([])
        } finally {
            setLoading(false)
        }
    }

    async function handleOpenBoard(boardId) {
        try {
            setDetailLoading(true)
            setMessage('')
            setError('')

            const data = await apiGet(`/api/boards/${boardId}`)

            setSelectedBoard(data.board || null)
            setSelectedFiles(data.files || [])
            setComments(data.comments || [])
            setMode('detail')

            await loadBoards()
        } catch (err) {
            setError(err.message)
            setSelectedBoard(null)
            setSelectedFiles([])
            setComments([])
        } finally {
            setDetailLoading(false)
        }
    }

    function resetForm() {
        setTitle('')
        setContent('')
        setCategory('일반')
        setUploadFiles([])
        setEditingBoardId(null)

        const fileInput = document.getElementById('board-file-input')

        if (fileInput) {
            fileInput.value = ''
        }
    }

    function makeFormData(inputTitle, inputContent, inputCategory) {
        const formData = new FormData()

        formData.append('title', inputTitle)
        formData.append('content', inputContent)
        formData.append('category', inputCategory)
        formData.append('author_id', authorId)

        uploadFiles.forEach((file) => {
            formData.append('files', file)
        })

        return formData
    }

    async function handleCreateOrUpdateBoard() {
        try {
            setMessage('')
            setError('')

            const inputTitle = (titleRef.current?.value ?? title).trim()
            const inputContent = (contentRef.current?.value ?? content).trim()
            const inputCategory = categoryRef.current?.value || category

            setTitle(inputTitle)
            setContent(inputContent)
            setCategory(inputCategory)

            if (!inputTitle) {
                setError('게시글 제목을 입력하세요.')
                return
            }

            if (!inputContent) {
                setError('게시글 내용을 입력하세요.')
                return
            }

            const formData = makeFormData(inputTitle, inputContent, inputCategory)

            if (editingBoardId) {
                await apiPutForm(`/api/boards/${editingBoardId}`, formData)
                setMessage('게시글 수정 완료')
            } else {
                await apiPostForm('/api/boards', formData)
                setMessage('게시글 등록 완료')
            }

            resetForm()
            setSelectedBoard(null)
            setSelectedFiles([])
            setComments([])
            setMode('list')
            await loadBoards()
        } catch (err) {
            setError(err.message)
        }
    }

    function handleFileChange(e) {
        const files = Array.from(e.target.files || [])
        setUploadFiles(files)
    }

    function handleWriteNew() {
        resetForm()
        setMessage('')
        setError('')
        setMode('write')
    }

    function handleEdit(board) {
        setEditingBoardId(board.board_id)
        setTitle(board.title || '')
        setContent(board.content || '')
        setCategory(board.category || '일반')
        setUploadFiles([])
        setMessage('')
        setError('')
        setMode('write')

        const fileInput = document.getElementById('board-file-input')

        if (fileInput) {
            fileInput.value = ''
        }
    }

    async function handleDelete(boardId) {
        if (!window.confirm('게시글을 삭제할까요?')) {
            return
        }

        try {
            setMessage('')
            setError('')

            await apiDelete(`/api/boards/${boardId}`)
            setMessage('게시글 삭제 완료')

            if (selectedBoard?.board_id === boardId) {
                setSelectedBoard(null)
                setSelectedFiles([])
                setComments([])
                setMode('list')
            }

            await loadBoards()
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleCreateComment() {
        try {
            setMessage('')
            setError('')

            if (!selectedBoard?.board_id) {
                setError('게시글을 먼저 선택하세요.')
                return
            }

            const inputComment = (commentRef.current?.value ?? commentContent).trim()

            if (!inputComment) {
                setError('댓글 내용을 입력하세요.')
                return
            }

            const formData = new FormData()
            formData.append('author_id', authorId)
            formData.append('content', inputComment)

            await apiPostForm(`/api/boards/${selectedBoard.board_id}/comments`, formData)

            setCommentContent('')

            if (commentRef.current) {
                commentRef.current.value = ''
            }

            await handleOpenBoard(selectedBoard.board_id)
        } catch (err) {
            setError(err.message)
        }
    }

    async function handleDeleteComment(commentId) {
        if (!window.confirm('댓글을 삭제할까요?')) {
            return
        }

        try {
            setMessage('')
            setError('')

            await apiDelete(`/api/boards/comments/${commentId}`)

            if (selectedBoard?.board_id) {
                await handleOpenBoard(selectedBoard.board_id)
            }
        } catch (err) {
            setError(err.message)
        }
    }

    function handleDownloadFile(fileId) {
        window.open(`${API_BASE}/api/boards/files/${fileId}/download`, '_blank')
    }

    function handleBackToList() {
        setMode('list')
        setSelectedBoard(null)
        setSelectedFiles([])
        setComments([])
        setMessage('')
        setError('')
        loadBoards()
    }

    function renderListPage() {
        return (
            <div className="card">
                <div className="card-header">
                    <div className="card-header-left">
                        <h3>게시판</h3>
                        <p>게시글 제목을 누르면 상세 내용을 볼 수 있습니다.</p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleWriteNew}
                    >
                        글쓰기
                    </button>
                </div>

                <div className="card-content">
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
                        <input
                            className="admin-input"
                            placeholder="제목, 내용, 작성자 검색"
                            value={searchKeyword}
                            onChange={(e) => setSearchKeyword(e.target.value)}
                        />

                        <select
                            className="admin-input"
                            style={{ maxWidth: '160px' }}
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                        >
                            <option value="전체">전체</option>
                            <option value="일반">일반</option>
                            <option value="질문">질문</option>
                            <option value="공유">공유</option>
                            <option value="건의">건의</option>
                            <option value="자료">자료</option>
                        </select>

                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={loadBoards}
                        >
                            새로고침
                        </button>
                    </div>

                    {loading && <p className="page-description">불러오는 중...</p>}
                    {message && <div className="page-success">{message}</div>}
                    {error && <div className="page-error">{error}</div>}

                    {!loading && filteredBoards.length === 0 && (
                        <div className="empty-state">등록된 게시글이 없습니다.</div>
                    )}

                    {filteredBoards.length > 0 && (
                        <div style={{ overflowX: 'auto' }}>
                            <table
                                style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '14px',
                                }}
                            >
                                <thead>
                                    <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <th style={{ width: '70px', padding: '12px', textAlign: 'center' }}>번호</th>
                                        <th style={{ padding: '12px', textAlign: 'left' }}>제목</th>
                                        <th style={{ width: '120px', padding: '12px', textAlign: 'center' }}>분류</th>
                                        <th style={{ width: '120px', padding: '12px', textAlign: 'center' }}>작성자</th>
                                        <th style={{ width: '160px', padding: '12px', textAlign: 'center' }}>작성일</th>
                                        <th style={{ width: '80px', padding: '12px', textAlign: 'center' }}>조회</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredBoards.map((board) => (
                                        <tr
                                            key={board.board_id}
                                            style={{ borderBottom: '1px solid #f1f5f9' }}
                                        >
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                {board.board_id}
                                            </td>

                                            <td style={{ padding: '12px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenBoard(board.board_id)}
                                                    style={{
                                                        border: 'none',
                                                        background: 'transparent',
                                                        padding: 0,
                                                        cursor: 'pointer',
                                                        color: '#1f2937',
                                                        fontWeight: 700,
                                                        textAlign: 'left',
                                                    }}
                                                >
                                                    {board.title}

                                                    {Number(board.file_count || 0) > 0 && (
                                                        <span style={{ marginLeft: '6px' }}>
                                                            📎
                                                        </span>
                                                    )}

                                                    {Number(board.comment_count || 0) > 0 && (
                                                        <span style={{ marginLeft: '6px', color: '#4f46e5' }}>
                                                            [{board.comment_count}]
                                                        </span>
                                                    )}
                                                </button>
                                            </td>

                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                {board.category || '일반'}
                                            </td>

                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                {board.author_name || board.author_id || '-'}
                                            </td>

                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                {board.created_at || '-'}
                                            </td>

                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                {board.view_count ?? 0}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    function renderWritePage() {
        return (
            <div className="card">
                <div className="card-header">
                    <div className="card-header-left">
                        <h3>{editingBoardId ? '게시글 수정' : '게시글 작성'}</h3>
                        <p>제목, 분류, 내용과 첨부파일을 입력하세요.</p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={handleBackToList}
                    >
                        목록으로
                    </button>
                </div>

                <div className="card-content">
                    <div className="form-grid">
                        <input
                            ref={titleRef}
                            className="admin-input"
                            placeholder="게시글 제목"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />

                        <select
                            ref={categoryRef}
                            className="admin-input"
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <option value="일반">일반</option>
                            <option value="질문">질문</option>
                            <option value="공유">공유</option>
                            <option value="건의">건의</option>
                            <option value="자료">자료</option>
                        </select>

                        <textarea
                            ref={contentRef}
                            className="admin-textarea"
                            placeholder="게시글 내용"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            style={{ minHeight: '280px' }}
                        />

                        <input
                            id="board-file-input"
                            className="admin-input"
                            type="file"
                            multiple
                            onChange={handleFileChange}
                        />

                        {uploadFiles.length > 0 && (
                            <div className="page-description">
                                선택된 파일: {uploadFiles.map((file) => file.name).join(', ')}
                            </div>
                        )}

                        {editingBoardId && (
                            <div className="page-description">
                                수정 시 새 파일을 선택하면 기존 첨부파일은 유지되고 새 파일이 추가됩니다.
                            </div>
                        )}

                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={handleCreateOrUpdateBoard}
                            >
                                {editingBoardId ? '수정 완료' : '등록'}
                            </button>

                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={handleBackToList}
                            >
                                취소
                            </button>
                        </div>
                    </div>

                    {message && <div className="page-success">{message}</div>}
                    {error && <div className="page-error">{error}</div>}
                </div>
            </div>
        )
    }

    function renderDetailPage() {
        if (detailLoading) {
            return (
                <div className="card">
                    <div className="card-content">
                        <p className="page-description">게시글 불러오는 중...</p>
                    </div>
                </div>
            )
        }

        if (!selectedBoard) {
            return (
                <div className="card">
                    <div className="card-content">
                        <p className="page-description">선택된 게시글이 없습니다.</p>

                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={handleBackToList}
                        >
                            목록으로
                        </button>
                    </div>
                </div>
            )
        }

        return (
            <div className="card">
                <div className="card-header">
                    <div className="card-header-left">
                        <h3>{selectedBoard.title}</h3>
                        <p>
                            {selectedBoard.category || '일반'}
                            {' · '}
                            작성자: {selectedBoard.author_name || selectedBoard.author_id || '-'}
                            {' · '}
                            작성일: {selectedBoard.created_at || '-'}
                            {' · '}
                            조회수: {selectedBoard.view_count ?? 0}
                        </p>
                    </div>

                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={handleBackToList}
                    >
                        목록으로
                    </button>
                </div>

                <div className="card-content">
                    {message && <div className="page-success">{message}</div>}
                    {error && <div className="page-error">{error}</div>}

                    <div
                        style={{
                            minHeight: '240px',
                            padding: '22px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '14px',
                            background: '#fff',
                            whiteSpace: 'pre-wrap',
                            lineHeight: 1.7,
                            marginBottom: '22px',
                        }}
                    >
                        {selectedBoard.content}
                    </div>

                    <div
                        style={{
                            padding: '18px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '14px',
                            marginBottom: '22px',
                        }}
                    >
                        <h4 style={{ marginBottom: '12px' }}>첨부파일</h4>

                        {selectedFiles.length === 0 && (
                            <p className="page-description">첨부파일이 없습니다.</p>
                        )}

                        {selectedFiles.map((file) => (
                            <div
                                key={file.file_id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px',
                                    padding: '10px 0',
                                    borderBottom: '1px solid #f1f5f9',
                                }}
                            >
                                <div>
                                    <p style={{ margin: 0, fontWeight: 600 }}>
                                        📎 {file.original_name}
                                    </p>

                                    <span>
                                        {formatFileSize(file.file_size)}
                                        {' · '}
                                        {file.uploaded_at || '-'}
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={() => handleDownloadFile(file.file_id)}
                                >
                                    다운로드
                                </button>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '22px' }}>
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={() => handleEdit(selectedBoard)}
                        >
                            수정
                        </button>

                        <button
                            type="button"
                            className="btn btn-destructive btn-sm"
                            onClick={() => handleDelete(selectedBoard.board_id)}
                        >
                            삭제
                        </button>
                    </div>

                    <div
                        style={{
                            padding: '18px',
                            border: '1px solid #e5e7eb',
                            borderRadius: '14px',
                        }}
                    >
                        <h4 style={{ marginBottom: '14px', textAlign: 'center' }}>댓글 {comments.length}개</h4>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
                            <input
                                ref={commentRef}
                                className="admin-input"
                                placeholder={`${loginName}님, 댓글을 입력하세요.`}
                                value={commentContent}
                                onChange={(e) => setCommentContent(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCreateComment()
                                    }
                                }}
                            />

                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={handleCreateComment}
                            >
                                등록
                            </button>
                        </div>

                        {comments.length === 0 && (
                            <p className="page-description">등록된 댓글이 없습니다.</p>
                        )}

                        {comments.map((comment) => (
                            <div
                                key={comment.comment_id}
                                style={{
                                    padding: '12px 0',
                                    borderBottom: '1px solid #f1f5f9',
                                    textAlign: 'left',
                                }}
                            >
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        gap: '12px',
                                    }}
                                >
                                    <div style={{ textAlign: 'left' }}>
                                        <strong>{comment.author_name || comment.author_id || '사용자'}</strong>

                                        <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '13px' }}>
                                            {comment.created_at || '-'}
                                        </span>
                                    </div>

                                    <button
                                        type="button"
                                        className="btn btn-outline btn-sm"
                                        onClick={() => handleDeleteComment(comment.comment_id)}
                                    >
                                        삭제
                                    </button>
                                </div>

                                <p
                                    style={{
                                        margin: '8px 0 0',
                                        whiteSpace: 'pre-wrap',
                                        textAlign: 'left',
                                        width: '100%',
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {comment.content}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <>
            <div
                className="page-header-block"
                style={{
                    position: 'relative',
                    justifyContent: 'center',
                    textAlign: 'center',
                }}
            >
                <div style={{ width: '100%' }}>
                    <h1 className="page-title">게시판</h1>

                    <p className="page-description">
                        게시글 작성, 첨부파일 다운로드, 댓글 작성이 가능한 게시판입니다.
                    </p>
                </div>
            </div>

            {mode === 'list' && renderListPage()}
            {mode === 'write' && renderWritePage()}
            {mode === 'detail' && renderDetailPage()}
        </>
    )
}

export default NoticeBoardPage