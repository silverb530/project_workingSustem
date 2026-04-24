import { useState } from 'react'
import Icons from './Icons'
import Avatar from './Avatar'
import Modal from './Modal'

function TeamSection() {
  const [members, setMembers] = useState([
    { id: 1, name: '김사라', role: '디자이너', status: 'online', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face', email: 'sarah@teamflow.com', phone: '010-1234-5678', tasks: 4 },
    { id: 2, name: '이민준', role: '개발자', status: 'online', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face', email: 'minjun@teamflow.com', phone: '010-2345-6789', tasks: 7 },
    { id: 3, name: '박지연', role: '마케터', status: 'meeting', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face', email: 'jiyeon@teamflow.com', phone: '010-3456-7890', tasks: 2 },
    { id: 4, name: '최민호', role: '개발자', status: 'offline', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face', email: 'minho@teamflow.com', phone: '010-4567-8901', tasks: 5 },
    { id: 5, name: '정유진', role: 'PM', status: 'online', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=32&h=32&fit=crop&crop=face', email: 'yujin@teamflow.com', phone: '010-5678-9012', tasks: 3 },
  ])
  const [showModal, setShowModal] = useState(false)
  const [showDetail, setShowDetail] = useState(null)
  const [newMember, setNewMember] = useState({ name: '', role: '', email: '' })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const statusLabel = { online: '온라인', meeting: '회의 중', offline: '오프라인' }
  const statusColors = { online: '#22c55e', meeting: '#f59e0b', offline: '#94a3b8' }

  const addMember = () => {
    if (!newMember.name.trim() || !newMember.role.trim()) return
    const member = {
      id: Date.now(),
      name: newMember.name,
      role: newMember.role,
      status: 'offline',
      avatar: '',
      email: newMember.email,
      phone: '',
      tasks: 0,
    }
    setMembers(prev => [...prev, member])
    setNewMember({ name: '', role: '', email: '' })
    setShowModal(false)
  }

  const removeMember = (id) => {
    setMembers(prev => prev.filter(m => m.id !== id))
    if (showDetail?.id === id) setShowDetail(null)
  }

  const filtered = members
    .filter(m => filterStatus === 'all' || m.status === filterStatus)
    .filter(m => m.name.includes(searchTerm) || m.role.includes(searchTerm))

  const onlineCount = members.filter(m => m.status === 'online').length
  const meetingCount = members.filter(m => m.status === 'meeting').length

  return (
    <div className="content-wrapper">
      <div className="welcome-section">
        <h1>팀원</h1>
        <p>현재 팀 구성원 현황입니다.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <p className="stat-label">전체 팀원</p>
          <p className="stat-value">{members.length}</p>
          <p className="stat-change neutral">활성 멤버</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">온라인</p>
          <p className="stat-value">{onlineCount}</p>
          <p className="stat-change positive">현재 접속 중</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">회의 중</p>
          <p className="stat-value">{meetingCount}</p>
          <p className="stat-change warning">미팅 참여</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">오프라인</p>
          <p className="stat-value">{members.filter(m=>m.status==='offline').length}</p>
          <p className="stat-change neutral">자리 비움</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <h3>팀원 목록</h3>
            <p>총 {members.length}명</p>
          </div>
          <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
            <div className="search-wrapper" style={{width:'180px'}}>
              <Icons.Search className="search-icon sm" />
              <input type="text" className="search-input" placeholder="이름, 역할 검색" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{paddingRight:'8px'}} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
              <Icons.Plus className="sm" />팀원 초대
            </button>
          </div>
        </div>

        <div className="filter-tabs">
          {[['all','전체'],['online','온라인'],['meeting','회의 중'],['offline','오프라인']].map(([v,l]) => (
            <button key={v} className={`filter-tab ${filterStatus===v?'active':''}`} onClick={() => setFilterStatus(v)}>{l}</button>
          ))}
        </div>

        <div className="card-content">
          <div className="team-grid">
            {filtered.map((m) => (
              <div key={m.id} className="team-card" onClick={() => setShowDetail(m)}>
                <div className="team-card-header">
                  <div className="team-avatar-wrapper">
                    <Avatar src={m.avatar} name={m.name} size="lg" />
                    <div className="team-status-dot" style={{background: statusColors[m.status]}} />
                  </div>
                  <button className="btn btn-icon btn-ghost sm team-more" onClick={e => { e.stopPropagation(); removeMember(m.id) }} title="제거">
                    <Icons.X className="sm" />
                  </button>
                </div>
                <div className="team-card-body">
                  <p className="team-name">{m.name}</p>
                  <p className="team-role">{m.role}</p>
                  <div className="team-status-label" style={{color: statusColors[m.status]}}>
                    <div className="status-dot" style={{background: statusColors[m.status], width:'6px', height:'6px', flexShrink:0}} />
                    {statusLabel[m.status]}
                  </div>
                  <div className="team-tasks">
                    <Icons.CheckSquare className="sm" />
                    <span>진행 업무 {m.tasks}건</span>
                  </div>
                </div>
                <div className="team-card-actions">
                  <button className="btn btn-outline btn-sm" onClick={e => e.stopPropagation()}>
                    <Icons.MessageCircle className="sm" />메시지
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={e => e.stopPropagation()}>
                    <Icons.Mail className="sm" />이메일
                  </button>
                </div>
              </div>
            ))}
          </div>
          {filtered.length === 0 && <div className="empty-state">검색 결과가 없습니다.</div>}
        </div>
      </div>

      {/* 팀원 상세 모달 */}
      <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title="팀원 상세 정보">
        {showDetail && (
          <div className="member-detail">
            <div className="member-detail-header">
              <Avatar src={showDetail.avatar} name={showDetail.name} size="lg" />
              <div>
                <h3>{showDetail.name}</h3>
                <p className="team-role">{showDetail.role}</p>
                <div className="team-status-label" style={{color: statusColors[showDetail.status]}}>
                  <div className="status-dot" style={{background: statusColors[showDetail.status], width:'6px', height:'6px'}} />
                  {statusLabel[showDetail.status]}
                </div>
              </div>
            </div>
            <div className="member-detail-info">
              {showDetail.email && <div className="detail-row"><Icons.Mail className="sm" /><span>{showDetail.email}</span></div>}
              {showDetail.phone && <div className="detail-row"><Icons.Phone className="sm" /><span>{showDetail.phone}</span></div>}
              <div className="detail-row"><Icons.CheckSquare className="sm" /><span>진행 중인 업무: {showDetail.tasks}건</span></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowDetail(null)}>닫기</button>
              <button className="btn btn-primary">메시지 보내기</button>
            </div>
          </div>
        )}
      </Modal>

      {/* 팀원 초대 모달 */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="팀원 초대">
        <div className="form-group">
          <label>이름 *</label>
          <input className="form-input" placeholder="이름을 입력하세요" value={newMember.name} onChange={e => setNewMember({...newMember, name: e.target.value})} />
        </div>
        <div className="form-group">
          <label>역할 *</label>
          <input className="form-input" placeholder="예: 개발자, 디자이너" value={newMember.role} onChange={e => setNewMember({...newMember, role: e.target.value})} />
        </div>
        <div className="form-group">
          <label>이메일</label>
          <input className="form-input" type="email" placeholder="이메일 주소" value={newMember.email} onChange={e => setNewMember({...newMember, email: e.target.value})} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={addMember}>초대</button>
        </div>
      </Modal>
    </div>
  )
}

export default TeamSection