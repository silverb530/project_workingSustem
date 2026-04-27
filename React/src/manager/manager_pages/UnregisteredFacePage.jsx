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

function UnregisteredFacePage() {
  const rows = [
    ['박지훈', '개발팀', '미등록', '사진 없음', '삭제/등록 필요'],
    ['한유진', '디자인팀', '부분 등록', '32장 등록', '추가 촬영'],
    ['오민재', '영업팀', '미등록', '검색 불가', '우선 처리'],
  ]

  return (
    <>
      <PageHeader
        title="미등록 인원"
        description="미등록 인원 검출 사진과 대상을 조회 및 정리하는 페이지입니다."
        actionText="대상 정리"
      />
      <InfoCard title="미등록 인원 목록" desc="출입 기록과 얼굴 등록 DB를 대조한 결과입니다.">
        <AdminTable
          columns={['이름', '부서', '등록 상태', '검출 정보', '조치']}
          rows={rows}
        />
      </InfoCard>
    </>
  )
}

export default UnregisteredFacePage
