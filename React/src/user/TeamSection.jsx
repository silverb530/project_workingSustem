import { useEffect, useState, useMemo } from 'react'

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

const PAGE_SIZE = 10

function TeamSection() {
    const [employees, setEmployees]     = useState([])
    const [loading, setLoading]         = useState(false)
    const [error, setError]             = useState('')
    const [inputSearch, setInputSearch] = useState('')
    const [search, setSearch]           = useState('')
    const [page, setPage]               = useState(1)

    useEffect(() => { loadData() }, [])

    async function loadData() {
        try {
            setLoading(true)
            setError('')
            const data = await apiGet('/api/employees')
            const list = Array.isArray(data.employees) ? data.employees : []
            setEmployees(list.filter((e) => e.is_active))
        } catch (err) {
            setError(err.message)
            setEmployees([])
        } finally {
            setLoading(false)
        }
    }

    function applySearch() {
        setSearch(inputSearch)
        setPage(1)
    }

    function handleReset() {
        setInputSearch('')
        setSearch('')
        setPage(1)
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') applySearch()
    }

    const filtered = useMemo(() =>
        employees.filter((e) =>
            search === '' || (e.name || '').includes(search)
        ),
        [employees, search]
    )

    const deptCount = useMemo(() => {
        const depts = new Set(employees.map((e) => e.department).filter(Boolean))
        return depts.size
    }, [employees])

    const totalPages     = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const pagedEmployees = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <div className="content-wrapper">

            {/* 헤더 */}
            <div className="team-page-header">
                <div>
                    <h1 className="team-page-title">팀원</h1>
                    <p className="team-page-desc">전체 구성원 정보를 조회합니다.</p>
                </div>
            </div>

            {/* 통계 */}
            <div className="stats-row team-stats-row">
                <div className="stat-card">
                    <p className="stat-label">전체 직원</p>
                    <p className="stat-value">{employees.length}</p>
                    <p className="stat-change neutral">재직 중</p>
                </div>
                <div className="stat-card">
                    <p className="stat-label">부서 수</p>
                    <p className="stat-value">{deptCount}</p>
                    <p className="stat-change neutral">개 부서</p>
                </div>
            </div>

            {error && <div className="team-error">{error}</div>}

            {/* 검색 */}
            <div className="card team-search-card">
                <div className="card-content" style={{ paddingTop: 16 }}>
                    <div className="team-search-row">
                        <span className="team-search-label">이름</span>
                        <input
                            className="team-search-input"
                            placeholder="이름을 입력하세요"
                            value={inputSearch}
                            onChange={(e) => setInputSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <button className="btn btn-primary btn-sm team-search-btn" onClick={applySearch}>검색</button>
                        <button className="team-reset-btn btn-sm team-search-btn" onClick={handleReset}>초기화</button>
                    </div>
                </div>
            </div>

            {/* 테이블 */}
            <div className="card">
                <div className="card-header">
                    <div className="card-header-left">
                        <h3>팀원 목록</h3>
                        <p>총 {filtered.length}명</p>
                    </div>
                </div>
                <div className="card-content" style={{ paddingTop: 0 }}>
                    <div className="team-table-wrap">
                        <table className="team-table">
                            <thead>
                                <tr>
                                    <th>이름</th>
                                    <th>직급</th>
                                    <th>부서</th>
                                    <th>전화번호</th>
                                    <th>이메일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr><td colSpan={5} className="team-table-empty">불러오는 중...</td></tr>
                                )}
                                {!loading && filtered.length === 0 && (
                                    <tr><td colSpan={5} className="team-table-empty">검색 결과가 없습니다.</td></tr>
                                )}
                                {!loading && pagedEmployees.map((emp) => (
                                    <tr key={emp.employee_id}>
                                        <td className="team-table-name">{emp.name || '-'}</td>
                                        <td>{emp.position || '-'}</td>
                                        <td>{emp.department || '-'}</td>
                                        <td>{emp.phone || '-'}</td>
                                        <td>{emp.email || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="team-pagination">
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
        </div>
    )
}

export default TeamSection
