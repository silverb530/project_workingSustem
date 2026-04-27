import TaskSection from './TaskSection'
import ChatSection from './ChatSection'
import FileBoard from './FileBoard'
import MeetingSection from './MeetingSection'

//11번에 {currentUser?.name || '사용자'}로 수정
function DashboardSection({ onSectionChange, currentUser  }) {
  return (
    <div className="content-wrapper">
      <div className="welcome-section">
        <h1>안녕하세요, {currentUser?.name || '사용자'}님 👋</h1>
        <p>오늘 팀의 진행 상황을 확인하세요.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card" onClick={() => onSectionChange('tasks')} style={{cursor:'pointer'}}>
          <p className="stat-label">진행 중인 업무</p>
          <p className="stat-value">12</p>
          <p className="stat-change positive">이번 주 +3</p>
        </div>
        <div className="stat-card" onClick={() => onSectionChange('team')} style={{cursor:'pointer'}}>
          <p className="stat-label">팀원 수</p>
          <p className="stat-value">8</p>
          <p className="stat-change neutral">5명 온라인</p>
        </div>
        <div className="stat-card" onClick={() => onSectionChange('files')} style={{cursor:'pointer'}}>
          <p className="stat-label">공유된 파일</p>
          <p className="stat-value">47</p>
          <p className="stat-change positive">이번 달 +12</p>
        </div>
        <div className="stat-card" onClick={() => onSectionChange('meetings')} style={{cursor:'pointer'}}>
          <p className="stat-label">오늘 회의</p>
          <p className="stat-value">3</p>
          <p className="stat-change warning">1개 진행 중</p>
        </div>
      </div>

      <div className="main-grid">
        <div className="grid-column">
          <TaskSection mini />
          <FileBoard mini />
        </div>
        <div className="grid-column">
          <ChatSection mini currentUser={currentUser}/> {/*실시간 때 수정*/}/>
          <MeetingSection mini />
        </div>
      </div>
    </div>
  )
}

export default DashboardSection