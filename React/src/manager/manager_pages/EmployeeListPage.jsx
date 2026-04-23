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

function EmployeeListPage() {
  const rows = [
    ['E-001', '김민수', '개발팀', '대리', '재직', '정상'],
    ['E-002', '박서연', '인사팀', '사원', '재직', '정상'],
    ['E-003', '이도윤', '디자인팀', '과장', '재직', '주의'],
    ['E-004', '최하린', '영업팀', '사원', '휴직', '중지'],
  ]

  return (
    <>
      <PageHeader
        title="직원 목록"
        description="직원 조회, 등록, 수정, 삭제를 수행하는 관리 페이지입니다."
        actionText="직원 추가"
      />
      <SummaryCards
        cards={[
          { label: '전체 직원', value: '128', sub: '이번 달 3명 증가' },
          { label: '재직 중', value: '119', sub: '정상 근무' },
          { label: '휴직/비활성', value: '9', sub: '관리 필요' },
        ]}
      />
      <InfoCard title="직원 관리 테이블" desc="직원 기본 정보와 현재 상태를 조회합니다.">
        <AdminTable
          columns={['사번', '이름', '부서', '직급', '재직 상태', '계정 상태']}
          rows={rows}
        />
      </InfoCard>
    </>
  )
}

export default EmployeeListPage
