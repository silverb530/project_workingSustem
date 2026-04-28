import { useEffect, useState, useMemo } from 'react'
import '../App_manager.css'

const API_BASE = 'http://localhost:5000'

function authHeaders() {
    const token = localStorage.getItem('token')
    return { Authorization: token ? `Bearer ${token}` : '' }
}

async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || `GET ${path} 실패`)
    return data
}

function UnregisteredFacePage() {
    const [records, setRecords] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError]     = useState('')

    const [inputName, setInputName] = useState('')
    const [inputDept, setInputDept] = useState('')

    const [filterName, setFilterName] = useState('')
    const [filterDept, setFilterDept] = useState('')

    const [page, setPage] = useState(1)
    const PAGE_SIZE = 10

    useEffect(() => { loadData() }, [])

    async function loadData() {
        try {
            setLoading(true)
            setError('')
            const data = await apiGet('/api/employees/unregistered-face')
            setRecords(Array.isArray(data.employees) ? data.employees : [])
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
        setPage(1)
    }

    function handleReset() {
        setInputName(''); setInputDept('')
        setFilterName(''); setFilterDept('')
        setPage(1)
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') applySearch()
    }

    const filtered = useMemo(() => records.filter((r) => {
        const nameMatch = filterName === '' || (r.name || '').includes(filterName)
        const deptMatch = filterDept === '' || r.department === filterDept
        return nameMatch && deptMatch
    }), [records, filterName, filterDept])

    const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const pagedRecords = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <>
            {/* 헤더 */}
            <div className="att-page-header" style={{ borderLeftColor: '#f59e0b' }}>
                <div>
                    <h1 className="att-page-title">미등록 인원</h1>
                    <p className="att-page-date">얼굴 등록이 완료되지 않은 직원 목록</p>
                </div>
                <div className="att-unreg-count">
                    <span className="att-unreg-num">{records.length}</span>
                    <span className="att-unreg-label">미등록</span>
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
                        <h3>미등록 인원 목록</h3>
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
                                    <th>이메일</th>
                                    <th>등록 상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && <tr><td colSpan={5}>불러오는 중...</td></tr>}
                                {!loading && filtered.length === 0 && (
                                    <tr><td colSpan={5}>미등록 인원이 없습니다.</td></tr>
                                )}
                                {!loading && pagedRecords.map((r, i) => (
                                    <tr key={i}>
                                        <td>{r.name || '-'}</td>
                                        <td>{r.department || '-'}</td>
                                        <td>{r.position || '-'}</td>
                                        <td>{r.email || '-'}</td>
                                        <td>
                                            <span className="status-badge orange">미등록</span>
                                        </td>
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

export default UnregisteredFacePage
