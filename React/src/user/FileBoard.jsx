import { useEffect, useState } from 'react'
import Icons from './Icons'

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

function FileBoard({ mini = false, onSectionChange }) {
    const [boards, setBoards] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        loadBoards()
    }, [])

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

    function handleGoBoard() {
        if (typeof onSectionChange === 'function') {
            onSectionChange('files')
            return
        }

        alert('게시판으로 이동하려면 FileBoard에 onSectionChange를 전달해야 합니다.')
    }

    const recentBoards = boards.slice(0, mini ? 4 : 8)

    return (
        <div className="card">
            <div className="card-header">
                <div className="card-header-left">
                    <h3>게시판·자료실</h3>
                    <p>최근 게시글 및 첨부파일 현황</p>
                </div>

                <div className="files-header-actions">
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={loadBoards}
                    >
                        새로고침
                    </button>

                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleGoBoard}
                    >
                        게시판으로 이동
                    </button>
                </div>
            </div>

            <div className="card-content">
                {loading && (
                    <p className="page-description">게시글을 불러오는 중...</p>
                )}

                {error && (
                    <div className="page-error">{error}</div>
                )}

                {!loading && !error && recentBoards.length === 0 && (
                    <div className="empty-state">등록된 게시글이 없습니다.</div>
                )}

                {!loading && !error && recentBoards.length > 0 && (
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                        }}
                    >
                        {recentBoards.map((board) => (
                            <button
                                key={board.board_id}
                                type="button"
                                onClick={handleGoBoard}
                                style={{
                                    width: '100%',
                                    border: '1px solid #eef2f7',
                                    background: '#ffffff',
                                    borderRadius: '14px',
                                    padding: '14px 16px',
                                    textAlign: 'left',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px',
                                }}
                            >
                                <div style={{ minWidth: 0, flex: 1 }}>
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            marginBottom: '6px',
                                        }}
                                    >
                                        <strong
                                            style={{
                                                color: '#111827',
                                                fontSize: mini ? '15px' : '16px',
                                                fontWeight: 700,
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                whiteSpace: 'nowrap',
                                                display: 'block',
                                                maxWidth: '100%',
                                            }}
                                        >
                                            {board.title || '(제목 없음)'}
                                        </strong>

                                        {Number(board.file_count || 0) > 0 && (
                                            <span
                                                style={{
                                                    color: '#475569',
                                                    fontSize: '14px',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                📎
                                            </span>
                                        )}

                                        {Number(board.comment_count || 0) > 0 && (
                                            <span
                                                style={{
                                                    color: '#4f46e5',
                                                    fontSize: '14px',
                                                    fontWeight: 700,
                                                    flexShrink: 0,
                                                }}
                                            >
                                                [{board.comment_count}]
                                            </span>
                                        )}
                                    </div>

                                    <div
                                        style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            gap: '6px',
                                            color: '#64748b',
                                            fontSize: '13px',
                                        }}
                                    >
                                        <span>{board.category || '일반'}</span>
                                        <span>·</span>
                                        <span>{board.author_name || board.author_id || '-'}</span>
                                        <span>·</span>
                                        <span>{board.created_at || '-'}</span>
                                        <span>·</span>
                                        <span>조회 {board.view_count ?? 0}</span>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        color: '#6b7280',
                                        fontSize: '13px',
                                        flexShrink: 0,
                                    }}
                                >
                                    보기
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {!loading && !error && boards.length > recentBoards.length && (
                    <div style={{ marginTop: '14px', textAlign: 'center' }}>
                        <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            onClick={handleGoBoard}
                        >
                            전체 게시글 보기
                        </button>
                    </div>
                )}

                {/* 파일 업로드 모달 */}

                {/* 게시글 작성 모달 */}
            </div>
        </div>
    )
}

export default FileBoard