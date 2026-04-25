import { useEffect, useState } from 'react'
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

const Icons = {
    Plus: ({ className = '' }) => (
        <svg
            className={`icon ${className}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h14" />
            <path d="M12 5v14" />
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

function AdminTable({ columns, rows, loading }) {
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
                    {loading && (
                        <tr>
                            <td colSpan={columns.length}>직원 목록을 불러오는 중입니다.</td>
                        </tr>
                    )}

                    {!loading && rows.length === 0 && (
                        <tr>
                            <td colSpan={columns.length}>직원 데이터가 없습니다.</td>
                        </tr>
                    )}

                    {!loading &&
                        rows.map((row, idx) => (
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

function EmployeeListPage() {
    const [employees, setEmployees] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        loadEmployees()
    }, [])

    async function loadEmployees() {
        try {
            setLoading(true)
            setError('')

            const data = await apiGet('/api/employees')

            let list = []

            if (Array.isArray(data)) {
                list = data
            } else if (Array.isArray(data.employees)) {
                list = data.employees
            } else if (Array.isArray(data.data)) {
                list = data.data
            } else if (Array.isArray(data.result)) {
                list = data.result
            }

            setEmployees(list)
        } catch (err) {
            setError(err.message)
            setEmployees([])
        } finally {
            setLoading(false)
        }
    }

    const rows = employees.map((emp) => [
        emp.name || '-',
        emp.department || '-',
        emp.position || '-',
    ])

    const departmentCount = new Set(
        employees
            .map((emp) => emp.department)
            .filter((value) => value && value.trim() !== '')
    ).size

    const positionCount = new Set(
        employees
            .map((emp) => emp.position)
            .filter((value) => value && value.trim() !== '')
    ).size

    return (
        <>
            <PageHeader
                title="직원 목록"
                description="데이터베이스에 등록된 직원의 이름, 부서, 직급을 조회합니다."
                actionText="새로고침"
                onAction={loadEmployees}
            />

            <SummaryCards
                cards={[
                    { label: '전체 직원', value: employees.length, sub: 'DB 등록 직원 수' },
                    { label: '부서 수', value: departmentCount, sub: '등록된 부서 기준' },
                    { label: '직급 수', value: positionCount, sub: '등록된 직급 기준' },
                ]}
            />

            {error && <div className="page-error">{error}</div>}

            <InfoCard title="직원 목록 테이블" desc="이름, 부서, 직급 정보만 표시합니다.">
                <AdminTable
                    columns={['이름', '부서', '직급']}
                    rows={rows}
                    loading={loading}
                />
            </InfoCard>
        </>
    )
}

export default EmployeeListPage