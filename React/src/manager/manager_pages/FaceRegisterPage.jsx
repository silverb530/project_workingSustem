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

function FaceRegisterPage() {
  const rows = [
    ['김민수', '등록 완료', '100장', '2026-04-22', '정상'],
    ['박서연', '등록 진행중', '74장', '2026-04-22', '촬영 필요'],
    ['이도윤', '미등록', '0장', '-', '대상자'],
  ]

  return (
    <>
      <PageHeader
        title="얼굴 등록"
        description="직원 얼굴 사진 100장 촬영 및 등록 상태를 관리합니다."
        actionText="촬영 시작"
      />
      <SummaryCards
        cards={[
          { label: '등록 완료', value: '83', sub: '기준 충족' },
          { label: '진행 중', value: '11', sub: '추가 촬영 필요' },
          { label: '미등록', value: '6', sub: '우선 처리 대상' },
        ]}
      />
      <div className="two-column-layout">
        <InfoCard title="등록 현황" desc="사진 등록 수량과 등록 상태를 보여줍니다.">
          <AdminTable
            columns={['직원명', '상태', '등록 이미지 수', '최근 등록일', '비고']}
            rows={rows}
          />
        </InfoCard>

        <InfoCard title="촬영 가이드" desc="얼굴 등록 품질 기준입니다.">
          <ul className="plain-list">
            <li>정면/좌측/우측 포함 다양한 각도 촬영</li>
            <li>밝은 조명과 무표정 기준 유지</li>
            <li>안경/마스크 여부 별도 분리 수집</li>
            <li>최소 100장 등록 후 검수 완료 처리</li>
          </ul>
        </InfoCard>
      </div>
    </>
  )
}

export default FaceRegisterPage
