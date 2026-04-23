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

function TaskAssignPage() {
  return (
    <>
      <PageHeader
        title="업무 할당"
        description="직원에게 업무를 생성하고 배정하는 페이지입니다."
        actionText="배정 저장"
      />
      <div className="two-column-layout">
        <InfoCard title="업무 생성" desc="새로운 업무를 등록합니다.">
          <div className="form-grid">
            <input className="admin-input" placeholder="업무 제목" />
            <input className="admin-input" placeholder="담당 부서" />
            <input className="admin-input" placeholder="담당 직원" />
            <input className="admin-input" placeholder="마감일" />
            <textarea className="admin-textarea" placeholder="업무 설명" />
          </div>
        </InfoCard>

        <InfoCard title="최근 배정 업무" desc="최근 생성된 업무 목록입니다.">
          <ul className="plain-list">
            <li>근태 대시보드 개편 → 김민수</li>
            <li>공지사항 권한 수정 → 박서연</li>
            <li>파일 업로드 UI 개선 → 이도윤</li>
            <li>미등록 인원 검수 → 최하린</li>
          </ul>
        </InfoCard>
      </div>
    </>
  )
}

export default TaskAssignPage

