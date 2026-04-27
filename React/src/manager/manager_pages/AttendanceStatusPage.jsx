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

function AttendanceStatusPage() {
  return (
    <>
      <PageHeader
        title="출퇴근 현황"
        description="오늘 출퇴근 전체 현황을 요약 조회하는 페이지입니다."
        actionText="현황 새로고침"
      />
      <SummaryCards
        cards={[
          { label: '출근 완료', value: '91', sub: '정상 출근' },
          { label: '지각', value: '7', sub: '확인 필요' },
          { label: '결근', value: '3', sub: '인사팀 알림' },
          { label: '재택 근무', value: '18', sub: '원격 접속 중' },
        ]}
      />
      <InfoCard title="실시간 출근 현황" desc="팀별 금일 출근 현황입니다.">
        <div className="status-grid">
          <div className="status-panel">
            <h4>개발팀</h4>
            <p>출근 24 / 지각 2 / 재택 5</p>
          </div>
          <div className="status-panel">
            <h4>디자인팀</h4>
            <p>출근 11 / 지각 1 / 재택 2</p>
          </div>
          <div className="status-panel">
            <h4>인사팀</h4>
            <p>출근 8 / 지각 0 / 재택 1</p>
          </div>
          <div className="status-panel">
            <h4>영업팀</h4>
            <p>출근 19 / 지각 4 / 재택 3</p>
          </div>
        </div>
      </InfoCard>
    </>
  )
}

export default AttendanceStatusPage
