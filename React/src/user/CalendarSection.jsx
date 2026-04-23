import { useState } from 'react'
import Icons from './Icons'
import Modal from './Modal'

function CalendarSection() {
  const today = new Date()
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState([
    { id: 1, title: '디자인 리뷰', date: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`, time: '14:00', type: 'meeting', color: '#6366f1' },
    { id: 2, title: '스프린트 계획', date: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`, time: '16:30', type: 'meeting', color: '#6366f1' },
    { id: 3, title: '클라이언트 미팅', date: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()+1).padStart(2,'0')}`, time: '10:00', type: 'client', color: '#f59e0b' },
    { id: 4, title: '발표 자료 마감', date: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()+2).padStart(2,'0')}`, time: '종일', type: 'deadline', color: '#ef4444' },
    { id: 5, title: '주간 팀 회의', date: `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()+3).padStart(2,'0')}`, time: '09:00', type: 'meeting', color: '#6366f1' },
  ])
  const [showModal, setShowModal] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [newEvent, setNewEvent] = useState({ title: '', time: '', type: 'meeting', color: '#6366f1' })

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
  const dayNames = ['일','월','화','수','목','금','토']

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const dateStr = (day) => `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
  const getEventsForDay = (day) => events.filter(e => e.date === dateStr(day))
  const isToday = (day) => dateStr(day) === `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`

  const addEvent = () => {
    if (!newEvent.title.trim() || !selectedDay) return
    const ev = {
      id: Date.now(),
      title: newEvent.title,
      date: dateStr(selectedDay),
      time: newEvent.time || '종일',
      type: newEvent.type,
      color: newEvent.type === 'meeting' ? '#6366f1' : newEvent.type === 'client' ? '#f59e0b' : '#ef4444',
    }
    setEvents(prev => [...prev, ev])
    setNewEvent({ title: '', time: '', type: 'meeting', color: '#6366f1' })
    setShowModal(false)
  }

  const handleDayClick = (day) => {
    setSelectedDay(day)
    setShowModal(true)
  }

  const deleteEvent = (id) => {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const upcomingEvents = events
    .filter(e => e.date >= `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`)
    .sort((a,b) => a.date.localeCompare(b.date))

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="content-wrapper">
      <div className="welcome-section">
        <h1>캘린더</h1>
        <p>예정된 일정을 확인하고 관리하세요.</p>
      </div>

      <div className="calendar-layout">
        <div className="calendar-card card">
          <div className="card-header">
            <button className="btn btn-icon btn-ghost" onClick={prevMonth}><Icons.ChevronLeft /></button>
            <h3>{year}년 {monthNames[month]}</h3>
            <button className="btn btn-icon btn-ghost" onClick={nextMonth}><Icons.ChevronRight /></button>
          </div>
          <div className="calendar-grid">
            {dayNames.map(d => <div key={d} className="calendar-day-name">{d}</div>)}
            {cells.map((day, i) => (
              <div
                key={i}
                className={`calendar-cell ${day ? 'active' : ''} ${day && isToday(day) ? 'today' : ''}`}
                onClick={() => day && handleDayClick(day)}
              >
                {day && (
                  <>
                    <span className="calendar-day-num">{day}</span>
                    <div className="calendar-events-dots">
                      {getEventsForDay(day).slice(0,3).map(e => (
                        <div key={e.id} className="event-dot" style={{background: e.color}} title={e.title} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="calendar-sidebar">
          <div className="card">
            <div className="card-header">
              <div className="card-header-left"><h3>다가오는 일정</h3><p>{upcomingEvents.length}건</p></div>
            </div>
            <div className="card-content">
              <div className="event-list">
                {upcomingEvents.map(ev => (
                  <div key={ev.id} className="event-item">
                    <div className="event-color-bar" style={{background: ev.color}} />
                    <div className="event-content">
                      <p className="event-title">{ev.title}</p>
                      <p className="event-meta">{ev.date} · {ev.time}</p>
                    </div>
                    <button className="btn btn-icon btn-ghost sm" onClick={() => deleteEvent(ev.id)}><Icons.Trash className="sm" /></button>
                  </div>
                ))}
                {upcomingEvents.length === 0 && <div className="empty-state">다가오는 일정이 없습니다.</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={`일정 추가 - ${selectedDay ? dateStr(selectedDay) : ''}`}>
        <div className="form-group">
          <label>제목 *</label>
          <input className="form-input" placeholder="일정 제목" value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>시간</label>
            <input className="form-input" type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} />
          </div>
          <div className="form-group">
            <label>유형</label>
            <select className="form-input" value={newEvent.type} onChange={e => setNewEvent({...newEvent, type: e.target.value})}>
              <option value="meeting">회의</option>
              <option value="client">클라이언트</option>
              <option value="deadline">마감</option>
            </select>
          </div>
        </div>
        {selectedDay && getEventsForDay(selectedDay).length > 0 && (
          <div className="form-group">
            <label>이 날의 일정</label>
            {getEventsForDay(selectedDay).map(e => (
              <div key={e.id} className="day-event-chip">
                <span style={{color: e.color}}>●</span> {e.title} {e.time}
                <button className="btn-text-sm" onClick={() => deleteEvent(e.id)}>삭제</button>
              </div>
            ))}
          </div>
        )}
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={addEvent}>추가</button>
        </div>
      </Modal>
    </div>
  )
}

export default CalendarSection