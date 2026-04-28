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

async function apiPut(path, body) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.message || `PUT ${path} 실패`)
    return data
}

const ROLE_OPTIONS = ['', 'ADMIN', 'MANAGER', 'EMPLOYEE']
const ROLE_LABELS = { ADMIN: '관리자', MANAGER: '매니저', EMPLOYEE: '직원' }
const ROLE_TONES  = { ADMIN: 'red',   MANAGER: 'blue',    EMPLOYEE: 'green' }

function StatusBadge({ value, tone }) {
    return <span className={`status-badge ${tone}`}>{value}</span>
}

function EditModal({ employee, onClose, onSaved }) {
    const [form, setForm]     = useState({ ...employee })
    const [saving, setSaving] = useState(false)
    const [error, setError]   = useState('')

    function handleChange(e) {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        try {
            setSaving(true)
            setError('')
            await apiPut(`/api/employees/${employee.employee_id}`, {
                name: form.name, email: form.email, phone: form.phone,
                department: form.department, position: form.position,
                role: form.role, is_active: form.is_active,
            })
            onSaved()
        } catch (err) {
            setError(err.message)
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>직원 정보 수정</h3>
                    <button type="button" className="modal-close" onClick={onClose}>✕</button>
                </div>
                <form onSubmit={handleSubmit} className="modal-form">
                    <label>이름<input name="name" value={form.name || ''} onChange={handleChange} required autoFocus /></label>
                    <label>이메일<input name="email" value={form.email || ''} onChange={handleChange} /></label>
                    <label>전화번호<input name="phone" value={form.phone || ''} onChange={handleChange} /></label>
                    <label>부서<input name="department" value={form.department || ''} onChange={handleChange} /></label>
                    <label>직급<input name="position" value={form.position || ''} onChange={handleChange} /></label>
                    <label>
                        권한구분
                        <select name="role" value={form.role || 'EMPLOYEE'} onChange={handleChange}>
                            {ROLE_OPTIONS.filter(Boolean).map((r) => (
                                <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        활성 여부
                        <select name="is_active" value={String(form.is_active ?? 1)} onChange={handleChange}>
                            <option value="1">활성</option>
                            <option value="0">비활성</option>
                        </select>
                    </label>
                    {error && <p className="form-error">{error}</p>}
                    <div className="modal-actions">
                        <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>취소</button>
                        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                            {saving ? '저장 중...' : '저장'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

function EmployeeListPage() {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading]     = useState(false)
    const [error, setError]         = useState('')
    const [editTarget, setEditTarget] = useState(null)

    const [inputName, setInputName] = useState('')
    const [inputRole, setInputRole] = useState('')
    const [inputDept, setInputDept] = useState('')

    const [filterName, setFilterName] = useState('')
    const [filterRole, setFilterRole] = useState('')
    const [filterDept, setFilterDept] = useState('')

    const [page, setPage] = useState(1)
    const PAGE_SIZE = 10

    useEffect(() => { loadEmployees() }, [])

    async function loadEmployees() {
        try {
            setLoading(true)
            setError('')
            const data = await apiGet('/api/employees')
            const list = Array.isArray(data) ? data
                : Array.isArray(data.employees) ? data.employees : []
            setEmployees(list)
        } catch (err) {
            setError(err.message)
            setEmployees([])
        } finally {
            setLoading(false)
        }
    }

    const departmentOptions = useMemo(() => {
        const depts = employees.map((e) => e.department).filter((d) => d && d.trim() !== '')
        return Array.from(new Set(depts)).sort()
    }, [employees])

    function applySearch() {
        setFilterName(inputName)
        setFilterRole(inputRole)
        setFilterDept(inputDept)
        setPage(1)
    }

    function handleReset() {
        setInputName(''); setInputRole(''); setInputDept('')
        setFilterName(''); setFilterRole(''); setFilterDept('')
        setPage(1)
    }

    function handleKeyDown(e) {
        if (e.key === 'Enter') applySearch()
    }

    const filtered = useMemo(() => employees.filter((emp) => {
        const nameMatch = filterName === '' || (emp.name || '').includes(filterName)
        const roleMatch = filterRole === '' || emp.role === filterRole
        const deptMatch = filterDept === '' || emp.department === filterDept
        return nameMatch && roleMatch && deptMatch
    }), [employees, filterName, filterRole, filterDept])

    const totalPages      = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
    const pagedEmployees  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

    return (
        <div className="emp-list-wrap">

            {/* 페이지 헤더 */}
            <div className="emp-page-header">
                <div className="emp-page-header-info">
                    <h1 className="emp-page-header-title">직원 목록</h1>
                    <p className="emp-page-header-desc">전체 직원 정보를 조회하고 수정합니다.</p>
                </div>
                <div className="emp-page-header-count">
                    <span className="emp-count-num">{employees.length}</span>
                    <span className="emp-count-label">전체 직원</span>
                </div>
            </div>

            {error && <div className="page-error">{error}</div>}

            {/* 검색 필터 */}
            <div className="card">
                <div className="card-content" style={{ paddingTop: 20 }}>
                    <div className="emp-filter-row">
                        <span className="filter-label">이름</span>
                        <input
                            className="filter-input"
                            placeholder="이름 입력"
                            value={inputName}
                            onChange={(e) => setInputName(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                        <span className="filter-label">권한구분</span>
                        <select
                            className="filter-select"
                            value={inputRole}
                            onChange={(e) => setInputRole(e.target.value)}
                            onKeyDown={handleKeyDown}
                        >
                            <option value="">전체</option>
                            {ROLE_OPTIONS.filter(Boolean).map((r) => (
                                <option key={r} value={r}>{ROLE_LABELS[r] || r}</option>
                            ))}
                        </select>
                        <span className="filter-label">부서</span>
                        <select
                            className="filter-select"
                            value={inputDept}
                            onChange={(e) => setInputDept(e.target.value)}
                            onKeyDown={handleKeyDown}
                        >
                            <option value="">전체</option>
                            {departmentOptions.map((d) => (
                                <option key={d} value={d}>{d}</option>
                            ))}
                        </select>
                        <button className="btn btn-primary btn-sm emp-filter-btn" onClick={applySearch}>검색</button>
                        <button className="btn btn-secondary btn-sm emp-filter-btn" onClick={handleReset}>초기화</button>
                    </div>
                </div>
            </div>

            {/* 직원 목록 */}
            <div className="card">
                <div className="card-header">
                    <div className="card-header-left">
                        <h3>직원 목록</h3>
                        <p>총 {filtered.length}명</p>
                    </div>
                </div>
                <div className="card-content">
                    <div className="table-wrap">
                        <table className="admin-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>이름</th>
                                    <th>이메일</th>
                                    <th>전화번호</th>
                                    <th>부서</th>
                                    <th>직급</th>
                                    <th>가입일</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && <tr><td colSpan={7}>불러오는 중...</td></tr>}
                                {!loading && filtered.length === 0 && <tr><td colSpan={7}>직원 데이터가 없습니다.</td></tr>}
                                {!loading && pagedEmployees.map((emp) => (
                                    <tr key={emp.employee_id}>
                                        <td>{emp.employee_id}</td>
                                        <td>
                                            <span className="name-link" onClick={() => setEditTarget(emp)}>
                                                {emp.name || '-'}
                                            </span>
                                        </td>
                                        <td>{emp.email ?? '-'}</td>
                                        <td>{emp.phone ?? '-'}</td>
                                        <td>{emp.department ?? '-'}</td>
                                        <td>{emp.position ?? '-'}</td>
                                        <td>{emp.created_at || '-'}</td>
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

            {editTarget && (
                <EditModal
                    employee={editTarget}
                    onClose={() => setEditTarget(null)}
                    onSaved={() => { setEditTarget(null); loadEmployees() }}
                />
            )}
        </div>
    )
}

export default EmployeeListPage
