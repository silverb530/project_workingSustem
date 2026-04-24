import { useState, useRef } from 'react'
import Icons from './Icons'
import Avatar from './Avatar'
import Modal from './Modal'

function MeetingSection({ mini = false }) {
  const [meetings, setMeetings] = useState([
    { id: 1, title: '디자인 리뷰', time: '오후 2:00', duration: '45분', participants: [{ name: '김사라', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face' }, { name: '이민준', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face' }, { name: '박지연', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face' }], isLive: true },
    { id: 2, title: '스프린트 계획', time: '오후 4:30', duration: '1시간', participants: [{ name: '최민호', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face' }, { name: '정유진', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=32&h=32&fit=crop&crop=face' }], isLive: false },
    { id: 3, title: '클라이언트 미팅', time: '내일 오전 10:00', duration: '30분', participants: [{ name: '클라이언트', avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=32&h=32&fit=crop&crop=face' }], isLive: false },
  ])
  const [showModal, setShowModal] = useState(false)
  const [newMeeting, setNewMeeting] = useState({ title: '', time: '', duration: '30분' })
  const [inMeeting, setInMeeting] = useState(false)
  const [activeMeetingId, setActiveMeetingId] = useState(null)
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)

  const startMeeting = (meetingId) => {
    setActiveMeetingId(meetingId)
    setInMeeting(true)
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed(prev => prev + 1), 1000)
  }

  const endMeeting = () => {
    setInMeeting(false)
    setActiveMeetingId(null)
    clearInterval(timerRef.current)
    setElapsed(0)
  }

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600).toString().padStart(2,'0')
    const m = Math.floor((secs % 3600) / 60).toString().padStart(2,'0')
    const s = (secs % 60).toString().padStart(2,'0')
    return `${h}:${m}:${s}`
  }

  const addMeeting = () => {
    if (!newMeeting.title.trim()) return
    const mtg = {
      id: Date.now(),
      title: newMeeting.title,
      time: newMeeting.time || '미정',
      duration: newMeeting.duration,
      participants: [{ name: '홍길동', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face' }],
      isLive: false,
    }
    setMeetings(prev => [...prev, mtg])
    setNewMeeting({ title: '', time: '', duration: '30분' })
    setShowModal(false)
  }

  const deleteMeeting = (id) => {
    setMeetings(prev => prev.filter(m => m.id !== id))
  }

  const liveMeeting = meetings.find(m => m.isLive)
  const otherMeetings = meetings.filter(m => !m.isLive)

  // In-meeting view
  if (inMeeting && !mini) {
    const mtg = meetings.find(m => m.id === activeMeetingId)
    return (
      <div className="content-wrapper">
        <div className="meeting-room">
          <div className="meeting-room-header">
            <h2>{mtg?.title || '즉석 회의'}</h2>
            <div className="live-badge"><div className="live-dot" /><span>진행 중 {formatTime(elapsed)}</span></div>
          </div>
          <div className="video-grid">
            {[{ name: '홍길동 (나)', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&crop=face' }, ...(mtg?.participants || [])].map((p, i) => (
              <div key={i} className="video-tile">
                <div className="video-avatar-placeholder">
                  <Avatar src={p.avatar} name={p.name} size="lg" />
                </div>
                <div className="video-name">{p.name}</div>
              </div>
            ))}
          </div>
          <div className="meeting-controls">
            <button className={`control-btn ${!micOn ? 'off' : ''}`} onClick={() => setMicOn(!micOn)} title={micOn ? '마이크 끄기' : '마이크 켜기'}>
              {micOn ? <Icons.Mic /> : <Icons.MicOff />}
              <span>{micOn ? '음소거' : '음소거 해제'}</span>
            </button>
            <button className={`control-btn ${!camOn ? 'off' : ''}`} onClick={() => setCamOn(!camOn)} title={camOn ? '카메라 끄기' : '카메라 켜기'}>
              {camOn ? <Icons.Video /> : <Icons.VideoOff />}
              <span>{camOn ? '화면 끄기' : '화면 켜기'}</span>
            </button>
            <button className="control-btn" title="화면 공유">
              <Icons.ScreenShare />
              <span>화면 공유</span>
            </button>
            <button className="control-btn end-call" onClick={endMeeting}>
              <Icons.Phone />
              <span>나가기</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={mini ? 'card' : 'content-wrapper'}>
      {!mini && <div className="welcome-section"><h1>화상회의</h1><p>언제든지 팀원들과 연결하세요.</p></div>}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <h3>화상회의</h3>
            <p>회의 {meetings.length}건 예정</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Icons.Plus className="sm" />일정 추가
          </button>
        </div>
        <div className="card-content">
          <div className="meeting-actions">
            <button className="btn btn-outline" onClick={() => startMeeting(null)}>
              <Icons.Video className="sm" />즉석 회의 시작
            </button>
            <button className="btn btn-outline btn-icon"><Icons.Phone className="sm" /></button>
          </div>

          {liveMeeting && (
            <div className="live-meeting">
              <div className="live-meeting-content">
                <div className="live-meeting-header">
                  <div className="live-badge"><div className="live-dot" /><span>진행 중</span></div>
                  <span className="live-duration">{formatTime(elapsed)}</span>
                </div>
                <h4 className="live-meeting-title">{liveMeeting.title}</h4>
                <div className="live-meeting-footer">
                  <div className="live-participants">
                    {liveMeeting.participants.map((p, i) => <Avatar key={i} src={p.avatar} name={p.name} size="sm" />)}
                  </div>
                  <div className="live-controls">
                    <button className={`live-control-btn ${!micOn?'off':''}`} onClick={() => setMicOn(!micOn)}>{micOn ? <Icons.Mic className="sm" /> : <Icons.MicOff className="sm" />}</button>
                    <button className={`live-control-btn ${!camOn?'off':''}`} onClick={() => setCamOn(!camOn)}>{camOn ? <Icons.Video className="sm" /> : <Icons.VideoOff className="sm" />}</button>
                    <button className="live-control-btn"><Icons.ScreenShare className="sm" /></button>
                    {inMeeting && activeMeetingId === liveMeeting.id
                      ? <button className="btn btn-destructive btn-sm" onClick={endMeeting}>나가기</button>
                      : <button className="btn btn-primary btn-sm" onClick={() => startMeeting(liveMeeting.id)}>입장</button>
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="meeting-list">
            {otherMeetings.map((meeting) => (
              <div key={meeting.id} className="meeting-item">
                <div className="meeting-icon-wrapper"><Icons.Calendar /></div>
                <div className="meeting-content">
                  <p className="meeting-title">{meeting.title}</p>
                  <div className="meeting-time">
                    <Icons.Clock className="sm" />
                    <span>{meeting.time}</span>
                    <span>-</span>
                    <span>{meeting.duration}</span>
                  </div>
                </div>
                <div className="meeting-participants">
                  {meeting.participants.slice(0, 3).map((p, i) => <Avatar key={i} src={p.avatar} name={p.name} size="sm" />)}
                </div>
                <button className="btn btn-outline btn-sm meeting-join" onClick={() => startMeeting(meeting.id)}>입장</button>
                {!mini && (
                  <button className="btn btn-icon btn-ghost sm" onClick={() => deleteMeeting(meeting.id)}><Icons.Trash className="sm" /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="회의 일정 추가">
        <div className="form-group">
          <label>회의 제목 *</label>
          <input className="form-input" placeholder="회의 제목을 입력하세요" value={newMeeting.title} onChange={e => setNewMeeting({...newMeeting, title: e.target.value})} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>시간</label>
            <input className="form-input" type="datetime-local" value={newMeeting.time} onChange={e => setNewMeeting({...newMeeting, time: e.target.value})} />
          </div>
          <div className="form-group">
            <label>소요 시간</label>
            <select className="form-input" value={newMeeting.duration} onChange={e => setNewMeeting({...newMeeting, duration: e.target.value})}>
              <option>15분</option>
              <option>30분</option>
              <option>45분</option>
              <option>1시간</option>
              <option>2시간</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={addMeeting}>추가</button>
        </div>
      </Modal>
    </div>
  )
}

export default MeetingSection