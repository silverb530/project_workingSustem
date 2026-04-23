import { useState, useEffect } from 'react'
import '../App_manager.css'

const API_BASE = 'http://192.168.0.116:5000'
const FILE_BASE = API_BASE

async function apiGet(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`GET ${path} 실패`)
  return res.json()
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


function PageHeader({ title, description, actionText = '추가' }) {
  return (
    <div className="page-header-block">
      <div>
        <h1 className="page-title">{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      <button className="btn btn-primary btn-sm">
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

function AdminTable({ columns, rows }) {
  return (
    <div className="table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              {row.map((cell, i) => (
                <td key={i}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ children, tone = 'default' }) {
  return <span className={`status-badge ${tone}`}>{children}</span>
}

function NoticePage() {
  const [notices, setNotices] = useState([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadNotices()
  }, [])

  async function loadNotices() {
    try {
      setError('')
      const data = await apiGet('/api/notices')
      setNotices(data)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleCreateNotice() {
    try {
      setMessage('')
      setError('')
      await apiPost('/api/notices', { title, content })
      setTitle('')
      setContent('')
      setMessage('공지 등록 완료')
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
      />

      <div className="two-column-layout">
        <InfoCard title="공지 작성" desc="제목과 내용을 입력하세요.">
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
            <button className="btn btn-primary" onClick={handleCreateNotice}>
              공지 등록
            </button>
          </div>
          {message && <div className="page-success">{message}</div>}
          {error && <div className="page-error">{error}</div>}
        </InfoCard>

        <InfoCard title="공지 목록" desc="Flask 서버에 저장된 공지입니다.">
          <div className="notice-list">
            {notices.map((notice) => (
              <div key={notice.id} className="notice-item">
                <h4>{notice.title}</h4>
                <p>{notice.content}</p>
                <span>{notice.created_at}</span>
              </div>
            ))}
          </div>
        </InfoCard>
      </div>
    </>
  )
}

export default NoticePage
