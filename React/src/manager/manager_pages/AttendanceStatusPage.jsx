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

const STATUS_TONE = {
    '출근 중':   'green',
    '퇴근 완료': 'blue',
    '미출근':    'default',
}

const STATUS_OPTIONS = ['', '출근 중', '퇴근 완료', '미출근']

function StatusBadge({ value }) {
    return <span className={`status-badge ${STATUS_TONE[value] || 'default'}`}>{value}</span>
}

function SummaryCard({ label, value, tone }) {
    return (
        <div className={`att-summary-card att-summary-${tone}`}>
            <p className="att-summary-value">{value}</p>
            <p className="att-summary-label">{label}</p>
        </div>
    )
}

function AttendanceStatusPage() {
    const [records, setRecords]   = useState([])
    const [loading, setLoading]   = useState(false)
    const [error, setError]       = useState('')

    const [inputName,   setInputName]   = useState('')
    const [inputDept,   setInputDept]   = useState('')
    const [inputStatus, setInputStatus] = useState('')

    const [filterName,   setFilterName]   = useState('')
    const [filterDept,   setFilterDept]   = useState('')
    const [filterStatus, setFilterStatus] = useState('')

    const [page, setPage] = useState(1)
    const PAGE_SIZE = 10

    const today = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric', weekday: 'short'
    })

    useEffect(() => { loadData() }, [])

    async function loadData() {
        try {
            setLoading(true)
            setError('')
            const data = await apiGet('/api/attendance/today')
            setRecords(Array.isArray(data.attendance) ? data.attendance : [])
        } catch (err) {
            setError(err.message)
            setRecords([])
        } finally {
            setLoading(false)
        }
    }

    const deptOptions = useMemo(() => {
        const depts = records.map((r) => r.department).filter((d) => d && d.trim())
        return Array.from(new Set(depts)).sort()
    }, [records])

    function applySearch() {
        setFilterName(inputName)
        setFilterDept(inputDept)
        setFilterStatus(inputStatus)
        setPage(1)
    }

    function handleReset() {
        setInputName(''); setInputDept(''); setInputStatus('')
        setFilterName(''); setFilterDept(''); setFilterStatus('')
        setPage(1)
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') applySearch()
    }

    const filtered = useMemo(() => records.filter((r) => {
        const nameMatch   = filterName   === '' || (r.name || '').includes(filterName)
        const deptMatch   = filterDept   === '' || r.department === filterDept
        const statusMatch = filterStatus === '' || r.today_status === filterStatus
        return nameMatch && deptMatch && statusMatch
    }), [records, filterName, filterDept, filterStatus])

    const totalPages     = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const pagedRecords   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    const countOf = (status) => records.filter((r) => r.today_status === status).length

    return (
        <>
            {/* 헤더 */}
            <div className="att-page-header">
                <div>
                    <h1 className="att-page-title">출퇴근 현황</h1>
                    <p className="att-page-date">{today} 기준</p>
                </div>
            </div>

            {/* 요약 카드 */}
            <div className="att-summary-grid">
                <SummaryCard label="전체 직원"   value={records.length}        tone="total"  />
                <SummaryCard label="출근 중"      value={countOf('출근 중')}    tone="in"     />
                <SummaryCard label="퇴근 완료"    value={countOf('퇴근 완료')}  tone="out"    />
                <SummaryCard label="미출근"       value={countOf('미출근')}     tone="absent" />
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
                            <span className="filter-label">부서</span>
                            <select
                                className="filter-select"
                                value={inputDept}
                                onChange={(e) => setInputDept(e.target.value)}
                                onKeyDown={handleKeyDown}
                            >
                                <option value="">전체</option>
                                {deptOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
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
                                    <option key={s} value={s}>{s === '' ? '전체' : s}</option>
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
                        <h3>출퇴근 현황</h3>
                        <p>총 {filtered.length}명</p>
                    </div>
                </div>
                <div className="card-content">
                    <div className="table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>이름</th>
                                    <th>부서</th>
                                    <th>직급</th>
                                    <th>출근 시간</th>
                                    <th>퇴근 시간</th>
                                    <th>출근 방법</th>
                                    <th>상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && <tr><td colSpan={7}>불러오는 중...</td></tr>}
                                {!loading && filtered.length === 0 && <tr><td colSpan={7}>데이터가 없습니다.</td></tr>}
                                {!loading && pagedRecords.map((r, i) => (
                                    <tr key={i}>
                                        <td>{r.name || '-'}</td>
                                        <td>{r.department || '-'}</td>
                                        <td>{r.position || '-'}</td>
                                        <td>{r.check_in_time || '-'}</td>
                                        <td>{r.check_out_time || '-'}</td>
                                        <td>{r.check_in_method || '-'}</td>
                                        <td><StatusBadge value={r.today_status} /></td>
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

export default AttendanceStatusPage
