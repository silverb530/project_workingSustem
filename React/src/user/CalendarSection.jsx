import { useState } from 'react'
import Icons from './Icons'
import Modal from './Modal'

const TYPE_CONFIG = {
  meeting:  { label: '회의',       color: '#6366f1', bg: '#eef2ff' },
  client:   { label: '클라이언트', color: '#f59e0b', bg: '#fffbeb' },
  deadline: { label: '마감',       color: '#ef4444', bg: '#fef2f2' },
}

function fmt(y, m, d) {
  return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
}
function offset(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return fmt(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

function CalendarSection() {
  const today    = new Date()
  const todayStr = fmt(today.getFullYear(), today.getMonth() + 1, today.getDate())

  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [events, setEvents] = useState([
    { id: 1, title: '디자인 리뷰',     date: todayStr,         time: '14:00', type: 'meeting'  },
    { id: 2, title: '스프린트 계획',   date: todayStr,         time: '16:30', type: 'meeting'  },
    { id: 3, title: '클라이언트 미팅', date: offset(today, 1), time: '10:00', type: 'client'   },
    { id: 4, title: '발표 자료 마감',  date: offset(today, 2), time: '종일',  type: 'deadline' },
    { id: 5, title: '주간 팀 회의',    date: offset(today, 3), time: '09:00', type: 'meeting'  },
  ])
  const [showModal, setShowModal]     = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [newEvent, setNewEvent]       = useState({ title: '', time: '', type: 'meeting' })

  const year       = currentDate.getFullYear()
  const month      = currentDate.getMonth()
  const monthNames = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
  const dayNames   = ['일','월','화','수','목','금','토']

  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // 6줄 고정 (42칸)
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length < 42) cells.push(null)

  const dateStr        = (day) => fmt(year, month + 1, day)
  const getEvents      = (day) => events.filter(e => e.date === dateStr(day))
  const isToday        = (day) => dateStr(day) === todayStr
  const upcomingEvents = [...events].filter(e => e.date >= todayStr).sort((a,b) => a.date.localeCompare(b.date))

  const addEvent = () => {
    if (!newEvent.title.trim() || !selectedDay) return
    setEvents(prev => [...prev, {
      id: Date.now(), title: newEvent.title,
      date: dateStr(selectedDay), time: newEvent.time || '종일', type: newEvent.type,
    }])
    setNewEvent({ title: '', time: '', type: 'meeting' })
    setShowModal(false)
  }
  const deleteEvent = (id) => setEvents(prev => prev.filter(e => e.id !== id))

  return (
    <div className="content-wrapper">
      <div className="welcome-section">
        <h1>캘린더</h1>
        <p>예정된 일정을 확인하고 관리하세요.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'start' }}>

        {/* ── 달력 카드 ── */}
        <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb',
                      overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>

          {/* 월 네비게이션 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '18px 24px', borderBottom: '1px solid #f3f4f6' }}>
            <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} style={navBtn}>
              <Icons.ChevronLeft />
            </button>
            <span style={{ fontWeight: 700, fontSize: '16px', color: '#111827' }}>
              {year}년 {monthNames[month]}
            </span>
            <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} style={navBtn}>
              <Icons.ChevronRight />
            </button>
          </div>

          {/* ★ table 레이아웃 - 열 너비 완벽히 동일하게 고정 */}
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', margin: 0 }}>
            <colgroup>
              {dayNames.map((_, i) => <col key={i} style={{ width: `${100/7}%` }} />)}
            </colgroup>

            {/* 요일 헤더 */}
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                {dayNames.map((d, i) => (
                  <th key={d} style={{
                    padding: '10px 0',
                    textAlign: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: i === 0 ? '#ef4444' : i === 6 ? '#6366f1' : '#9ca3af',
                    fontStyle: 'normal',
                  }}>
                    {d}
                  </th>
                ))}
              </tr>
            </thead>

            {/* 날짜 */}
            <tbody>
              {Array.from({ length: 6 }).map((_, rowIdx) => (
                <tr key={rowIdx}>
                  {Array.from({ length: 7 }).map((_, colIdx) => {
                    const day       = cells[rowIdx * 7 + colIdx]
                    const dayEvs    = day ? getEvents(day) : []
                    const todayCell = day && isToday(day)
                    const isLastRow = rowIdx === 5

                    return (
                      <td
                        key={colIdx}
                        onClick={() => { if (day) { setSelectedDay(day); setShowModal(true) } }}
                        style={{
                          height: '88px',
                          verticalAlign: 'top',
                          padding: '7px 5px',
                          borderRight: colIdx < 6 ? '1px solid #f3f4f6' : 'none',
                          borderBottom: !isLastRow ? '1px solid #f3f4f6' : 'none',
                          cursor: day ? 'pointer' : 'default',
                          background: day ? '#fff' : '#fafafa',
                          transition: 'background 0.12s',
                        }}
                        onMouseEnter={e => { if (day) e.currentTarget.style.background = '#f5f3ff' }}
                        onMouseLeave={e => { if (day) e.currentTarget.style.background = '#fff' }}
                      >
                        {day && (
                          <>
                            {/* 날짜 숫자 */}
                            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '3px' }}>
                              <span style={{
                                width: '26px', height: '26px', borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: todayCell ? 700 : 400,
                                background: todayCell ? '#6366f1' : 'transparent',
                                color: todayCell ? '#fff'
                                     : colIdx === 0 ? '#ef4444'
                                     : colIdx === 6 ? '#6366f1'
                                     : '#374151',
                              }}>
                                {day}
                              </span>
                            </div>

                            {/* 이벤트 칩 */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                              {dayEvs.slice(0, 2).map(ev => (
                                <div key={ev.id} style={{
                                  fontSize: '10px',
                                  padding: '2px 4px',
                                  borderRadius: '3px',
                                  background: TYPE_CONFIG[ev.type]?.bg || '#f3f4f6',
                                  color: TYPE_CONFIG[ev.type]?.color || '#374151',
                                  fontWeight: 500,
                                  overflow: 'hidden',
                                  whiteSpace: 'nowrap',
                                  textOverflow: 'ellipsis',
                                }}>
                                  {ev.title}
                                </div>
                              ))}
                              {dayEvs.length > 2 && (
                                <span style={{ fontSize: '10px', color: '#9ca3af', paddingLeft: '2px' }}>
                                  +{dayEvs.length - 2}개
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── 사이드 패널 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* 오늘 카드 */}
          <div style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                        borderRadius: '16px', padding: '20px', color: '#fff',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
            <p style={{ margin: 0, fontSize: '12px', opacity: 0.85 }}>오늘</p>
            <p style={{ margin: '4px 0 0', fontSize: '36px', fontWeight: 700, lineHeight: 1 }}>
              {today.getDate()}
            </p>
            <p style={{ margin: '6px 0 0', fontSize: '13px', opacity: 0.85 }}>
              {year}년 {monthNames[today.getMonth()]} {dayNames[today.getDay()]}요일
            </p>
          </div>

          {/* 다가오는 일정 */}
          <div style={{ background: '#fff', borderRadius: '16px', border: '1px solid #e5e7eb',
                        overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, fontSize: '14px', color: '#111827' }}>다가오는 일정</span>
              <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: '11px',
                             padding: '2px 8px', borderRadius: '99px', fontWeight: 600 }}>
                {upcomingEvents.length}건
              </span>
            </div>
            <div style={{ maxHeight: '380px', overflowY: 'auto' }}>
              {upcomingEvents.length === 0 ? (
                <p style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                  다가오는 일정이 없습니다.
                </p>
              ) : upcomingEvents.map(ev => (
                <div key={ev.id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '11px 18px', borderBottom: '1px solid #f9fafb',
                }}>
                  <div style={{ width: '4px', height: '36px', borderRadius: '2px', flexShrink: 0,
                                background: TYPE_CONFIG[ev.type]?.color || '#6366f1' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#111827',
                                overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {ev.title}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                      {ev.date} · {ev.time}
                    </p>
                  </div>
                  <button onClick={() => deleteEvent(ev.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer',
                                   color: '#d1d5db', fontSize: '18px', padding: '2px', lineHeight: 1 }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── 모달 ── */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={selectedDay ? `${year}년 ${monthNames[month]} ${selectedDay}일` : '일정 추가'}
      >
        {selectedDay && getEvents(selectedDay).length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', color: '#6b7280', fontWeight: 600, marginBottom: '8px' }}>이 날의 일정</p>
            {getEvents(selectedDay).map(ev => (
              <div key={ev.id} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: '8px', marginBottom: '6px',
                background: TYPE_CONFIG[ev.type]?.bg || '#f3f4f6',
              }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: TYPE_CONFIG[ev.type]?.color }}>
                  {ev.title}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>{ev.time}</span>
                  <button onClick={() => deleteEvent(ev.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer',
                                   color: '#9ca3af', fontSize: '16px', padding: 0, lineHeight: 1 }}>×</button>
                </div>
              </div>
            ))}
            <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: '16px 0' }} />
          </div>
        )}

        <div className="form-group">
          <label>제목 *</label>
          <input className="form-input" placeholder="일정 제목을 입력하세요"
                 value={newEvent.title}
                 onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                 onKeyDown={e => e.key === 'Enter' && addEvent()} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>시간</label>
            <input className="form-input" type="time" value={newEvent.time}
                   onChange={e => setNewEvent({ ...newEvent, time: e.target.value })} />
          </div>
          <div className="form-group">
            <label>유형</label>
            <select className="form-input" value={newEvent.type}
                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}>
              <option value="meeting">회의</option>
              <option value="client">클라이언트</option>
              <option value="deadline">마감</option>
            </select>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={addEvent}>추가</button>
        </div>
      </Modal>
    </div>
  )
}

const navBtn = {
  background: '#f3f4f6', border: 'none', borderRadius: '8px',
  width: '32px', height: '32px', cursor: 'pointer', color: '#374151',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
}

export default CalendarSection