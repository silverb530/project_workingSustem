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
                            <td colSpan={columns.length}>출퇴근 기록을 불러오는 중입니다.</td>
                        </tr>
                    )}

                    {!loading && rows.length === 0 && (
                        <tr>
                            <td colSpan={columns.length}>출퇴근 기록이 없습니다.</td>
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

function getStatusText(status) {
    if (status === 'PRESENT') return '출근'
    if (status === 'LATE') return '지각'
    if (status === 'ABSENT') return '결근'
    if (status === 'LEAVE') return '휴가'
    if (status === 'NORMAL') return '정상'
    return status || '-'
}

function getStatusTone(status) {
    if (status === 'PRESENT' || status === 'NORMAL') return 'success'
    if (status === 'LATE') return 'warning'
    if (status === 'ABSENT') return 'danger'
    return 'default'
}

function AttendanceLogPage() {
    const [attendance, setAttendance] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        loadAttendance()
    }, [])

    async function loadAttendance() {
        try {
            setLoading(true)
            setError('')

            const data = await apiGet('/api/attendance')

            let list = []

            if (Array.isArray(data)) {
                list = data
            } else if (Array.isArray(data.attendance)) {
                list = data.attendance
            } else if (Array.isArray(data.data)) {
                list = data.data
            } else if (Array.isArray(data.result)) {
                list = data.result
            }

            setAttendance(list)
        } catch (err) {
            setError(err.message)
            setAttendance([])
        } finally {
            setLoading(false)
        }
    }

    const rows = attendance.map((item) => [
        item.employee_name || item.name || `직원 ${item.employee_id}`,
        item.work_date || '-',
        item.check_in_time || '-',
        item.check_out_time || '-',
        <StatusBadge tone={getStatusTone(item.status)}>
            {getStatusText(item.status)}
        </StatusBadge>,
    ])

    const totalCount = attendance.length

    const presentCount = attendance.filter((item) => {
        return item.status === 'PRESENT' || item.status === 'NORMAL'
    }).length

    const notCheckedOutCount = attendance.filter((item) => {
        return item.check_in_time && !item.check_out_time
    }).length

    return (
        <>
            <PageHeader
                title="출퇴근 기록"
                description="데이터베이스에 저장된 출근, 퇴근 기록을 조회합니다."
                actionText="새로고침"
                onAction={loadAttendance}
            />

            <SummaryCards
                cards={[
                    { label: '전체 기록', value: totalCount, sub: 'DB 저장 기록 수' },
                    { label: '출근 기록', value: presentCount, sub: 'PRESENT 상태 기준' },
                    { label: '퇴근 미처리', value: notCheckedOutCount, sub: '퇴근 시간이 없는 기록' },
                ]}
            />

            {error && <div className="page-error">{error}</div>}

            <InfoCard title="출퇴근 이력 테이블" desc="직원명, 날짜, 출근 시각, 퇴근 시각, 판정을 표시합니다.">
                <AdminTable
                    columns={['직원명', '날짜', '출근 시각', '퇴근 시각', '판정']}
                    rows={rows}
                    loading={loading}
                />
            </InfoCard>
        </>
    )
}

export default AttendanceLogPage