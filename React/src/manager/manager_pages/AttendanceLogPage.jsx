import '../App_manager.css'

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

function AttendanceLogPage() {
  const rows = [
    ['김민수', '2026-04-23', '08:57', '18:10', '정상'],
    ['박서연', '2026-04-23', '09:14', '18:05', '지각'],
    ['이도윤', '2026-04-23', '-', '-', '결근'],
    ['최하린', '2026-04-23', '08:49', '17:58', '정상'],
  ]

  return (
    <>
      <PageHeader
        title="출퇴근 기록"
        description="기간별 출퇴근 이력 조회 및 다운로드가 가능한 페이지입니다."
        actionText="기록 다운로드"
      />
      <InfoCard title="출퇴근 이력 테이블" desc="기간 조건에 따라 조회된 출퇴근 기록입니다.">
        <AdminTable
          columns={['직원명', '날짜', '출근 시각', '퇴근 시각', '판정']}
          rows={rows}
        />
      </InfoCard>
    </>
  )
}

export default AttendanceLogPage
