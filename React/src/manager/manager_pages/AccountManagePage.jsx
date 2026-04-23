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

function AccountManagePage() {
  return (
    <>
      <PageHeader
        title="계정 관리"
        description="관리자 계정 설정 및 비밀번호를 변경하는 페이지입니다."
        actionText="저장"
      />
      <div className="two-column-layout">
        <InfoCard title="기본 정보" desc="관리자 계정 기본 정보입니다.">
          <div className="form-grid">
            <input className="admin-input" defaultValue="홍길동" />
            <input className="admin-input" defaultValue="admin@company.com" />
            <input className="admin-input" defaultValue="시스템 관리자" />
          </div>
        </InfoCard>

        <InfoCard title="보안 설정" desc="비밀번호와 접근 보안을 관리합니다.">
          <div className="form-grid">
            <input className="admin-input" type="password" placeholder="현재 비밀번호" />
            <input className="admin-input" type="password" placeholder="새 비밀번호" />
            <input className="admin-input" type="password" placeholder="새 비밀번호 확인" />
          </div>
        </InfoCard>
      </div>
    </>
  )
}

export default AccountManagePage
