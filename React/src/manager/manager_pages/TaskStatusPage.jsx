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

function TaskStatusPage() {
  const rows = [
    ['홈 화면 개편', '디자인팀', <StatusBadge tone="blue">진행중</StatusBadge>, '2026-04-25'],
    ['근태 API 수정', '개발팀', <StatusBadge tone="green">완료</StatusBadge>, '2026-04-23'],
    ['공지 게시판 정리', '운영팀', <StatusBadge tone="orange">검토중</StatusBadge>, '2026-04-26'],
  ]

  return (
    <>
      <PageHeader
        title="업무 현황"
        description="전체 업무 진행 현황을 조회하는 페이지입니다."
        actionText="업무 생성"
      />
      <SummaryCards
        cards={[
          { label: '전체 업무', value: '42', sub: '이번 주 기준' },
          { label: '진행 중', value: '16', sub: '우선순위 포함' },
          { label: '완료', value: '21', sub: '금주 누적' },
          { label: '지연', value: '5', sub: '관리자 확인 필요' },
        ]}
      />
      <InfoCard title="업무 진행 목록" desc="부서별 주요 업무 상태입니다.">
        <AdminTable
          columns={['업무명', '담당 부서', '상태', '마감일']}
          rows={rows}
        />
      </InfoCard>
    </>
  )
}

export default TaskStatusPage

