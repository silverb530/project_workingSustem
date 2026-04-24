import { useState } from 'react'
import './App_user.css'
import Sidebar from './Sidebar'
import Header from './Header'
import DashboardSection from './DashboardSection'
import TaskSection from './TaskSection'
import ChatSection from './ChatSection'
import FileBoard from './FileBoard'
import MeetingSection from './MeetingSection'
import TeamSection from './TeamSection'
import CalendarSection from './CalendarSection'
import FaceGate from './FaceGate'
import RemoteNode from './RemoteNode'

function App_user() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeSection, setActiveSection] = useState('dashboard')

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <DashboardSection onSectionChange={setActiveSection} />
      case 'tasks':
        return (
          <div className="content-wrapper">
            <div className="welcome-section">
              <h1>업무관리</h1>
              <p>팀의 모든 업무를 한눈에 파악하세요.</p>
            </div>
            <TaskSection />
          </div>
        )
      case 'chat':
        return (
          <div className="content-wrapper">
            <div className="welcome-section">
              <h1>실시간 채팅</h1>
              <p>팀원들과 실시간으로 소통하세요.</p>
            </div>
            <ChatSection />
          </div>
        )
      case 'files':
        return (
          <div className="content-wrapper">
            <div className="welcome-section">
              <h1>게시판·자료실</h1>
              <p>팀 자료를 공유하고 관리하세요.</p>
            </div>
            <FileBoard />
          </div>
        )
      case 'meetings':
        return <MeetingSection />
      case 'team':
        return <TeamSection />
      case 'calendar':
        return <CalendarSection />
      case 'facegate':
        return <FaceGate />
      case 'remote':
        return <RemoteNode />
      default:
        return <DashboardSection onSectionChange={setActiveSection} />
    }
  }

  return (
    <div className="dashboard">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />

      <Header
        sidebarCollapsed={sidebarCollapsed}
        onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className={`main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
        {renderContent()}
      </main>
    </div>
  )
}

export default App_user