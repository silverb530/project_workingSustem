import { useEffect, useState, useMemo } from 'react'
import '../App_manager.css'

const API_BASE = 'http://localhost:5000'

function authHeaders() {
    const token = sessionStorage.getItem('token')
    return { Authorization: token ? `Bearer ${token}` : '' }
}

async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || `GET ${path} 실패`)
    return data
}

const STATUS_MAP = {
    PRESENT: { label: '출근',  tone: 'green'   },
    NORMAL:  { label: '정상',  tone: 'green'   },
    LATE:    { label: '지각',  tone: 'orange'  },
    ABSENT:  { label: '결근',  tone: 'red'     },
    LEAVE:   { label: '휴가',  tone: 'blue'    },
}

const STATUS_OPTIONS = ['', 'PRESENT', 'NORMAL', 'LATE', 'ABSENT', 'LEAVE']

function StatusBadge({ value }) {
    const info = STATUS_MAP[value] || { label: value || '-', tone: 'default' }
    return <span className={`status-badge ${info.tone}`}>{info.label}</span>
}

function AttendanceLogPage() {
    const [records, setRecords]   = useState([])
    const [loading, setLoading]   = useState(false)
    const [error, setError]       = useState('')

    const [inputName,   setInputName]   = useState('')
    const [inputDate,   setInputDate]   = useState('')
    const [inputStatus, setInputStatus] = useState('')

    const [filterName,   setFilterName]   = useState('')
    const [filterDate,   setFilterDate]   = useState('')
    const [filterStatus, setFilterStatus] = useState('')

    const [page, setPage] = useState(1)
    const PAGE_SIZE = 10

    useEffect(() => { loadData() }, [])

    async function loadData() {
        try {
            setLoading(true)
            setError('')
            const data = await apiGet('/api/attendance')
            setRecords(Array.isArray(data.attendance) ? data.attendance : [])
        } catch (err) {
            setError(err.message)
            setRecords([])
        } finally {
            setLoading(false)
        }
    }

    function applySearch() {
        setFilterName(inputName)
        setFilterDate(inputDate)
        setFilterStatus(inputStatus)
        setPage(1)
    }

    function handleReset() {
        setInputName(''); setInputDate(''); setInputStatus('')
        setFilterName(''); setFilterDate(''); setFilterStatus('')
        setPage(1)
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') applySearch()
    }

    const filtered = useMemo(() => records.filter((r) => {
        const nameMatch   = filterName   === '' || (r.employee_name || '').includes(filterName)
        const dateMatch   = filterDate   === '' || (r.work_date || '') === filterDate
        const statusMatch = filterStatus === '' || r.status === filterStatus
        return nameMatch && dateMatch && statusMatch
    }), [records, filterName, filterDate, filterStatus])

    const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const pagedRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <>
            {/* 헤더 */}
            <div className="att-page-header">
                <div>
                    <h1 className="att-page-title">출퇴근 기록</h1>
                    <p className="att-page-date">전체 출퇴근 이력 조회</p>
                </div>
            </div>

            {error && <div className="page-error">{error}</div>}

            {/* 검색 */}
            <div className="card">
                <div className="card-content" style={{ paddingTop: 20 }}>
                    <div className="emp-filter-row">
                        <div className="filter-group">
                            <span className="filter-label">이름</span>
                            <input
                                className="filter-input"
                                placeholder="이름 입력"
                                value={inputName}
                                onChange={(e) => setInputName(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <div className="filter-group">
                            <span className="filter-label">날짜</span>
                            <input
                                type="date"
                                className="filter-input"
                                value={inputDate}
                                onChange={(e) => setInputDate(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <div className="filter-group">
                            <span className="filter-label">상태</span>
                            <select
                                className="filter-select"
                                value={inputStatus}
                                onChange={(e) => setInputStatus(e.target.value)}
                                onKeyDown={handleKeyDown}
                            >
                                {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>
                                        {s === '' ? '전체' : STATUS_MAP[s]?.label || s}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter-actions">
                            <button className="btn btn-primary btn-sm emp-filter-btn" onClick={applySearch}>검색</button>
                            <button className="btn btn-outline btn-sm emp-filter-btn" onClick={handleReset}>초기화</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 테이블 */}
            <div className="card">
                <div className="card-header">
                    <div className="card-header-left">
                        <h3>출퇴근 기록</h3>
                        <p>총 {filtered.length}건</p>
                    </div>
                </div>
                <div className="card-content">
                    <div className="table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>이름</th>
                                    <th>날짜</th>
                                    <th>출근 시간</th>
                                    <th>퇴근 시간</th>
                                    <th>출근 방법</th>
                                    <th>퇴근 방법</th>
                                    <th>상태</th>
                                    <th>비고</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && <tr><td colSpan={8}>불러오는 중...</td></tr>}
                                {!loading && filtered.length === 0 && <tr><td colSpan={8}>데이터가 없습니다.</td></tr>}
                                {!loading && pagedRecords.map((r, i) => (
                                    <tr key={i}>
                                        <td>{r.employee_name || '-'}</td>
                                        <td>{r.work_date || '-'}</td>
                                        <td>{r.check_in_time || '-'}</td>
                                        <td>{r.check_out_time || '-'}</td>
                                        <td>{r.check_in_method || '-'}</td>
                                        <td>{r.check_out_method || '-'}</td>
                                        <td><StatusBadge value={r.status} /></td>
                                        <td>{r.note || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="pagination">
                        <button onClick={() => setPage(1)} disabled={page === 1}>«</button>
                        <button onClick={() => setPage((p) => p - 1)} disabled={page === 1}>‹</button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                            <button key={p} className={p === page ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>
                        ))}
                        <button onClick={() => setPage((p) => p + 1)} disabled={page === totalPages}>›</button>
                        <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
                    </div>
                </div>
            </div>
        </>
    )
}

export default AttendanceLogPage
