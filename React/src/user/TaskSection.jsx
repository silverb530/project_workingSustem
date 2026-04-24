import { useState } from 'react'
import Icons from './Icons'
import Avatar from './Avatar'
import Modal from './Modal'

function TaskSection({ mini = false }) {
  const [tasks, setTasks] = useState([
    { id: 1, title: '랜딩 페이지 히어로 섹션 업데이트', priority: 'high', status: 'in-progress', dueDate: '오늘', assignee: { name: '김사라', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop&crop=face' }, tags: ['디자인', '마케팅'] },
    { id: 2, title: '1분기 분석 보고서 검토', priority: 'medium', status: 'todo', dueDate: '내일', assignee: { name: '이민준', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face' }, tags: ['분석'] },
    { id: 3, title: '클라이언트 프레젠테이션 준비', priority: 'high', status: 'todo', dueDate: '4월 24일', assignee: { name: '박지연', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face' }, tags: ['클라이언트', '발표'] },
    { id: 4, title: '인증 버그 수정', priority: 'low', status: 'done', dueDate: '4월 20일', assignee: { name: '최민호', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face' }, tags: ['개발', '버그'] },
  ])
  const [showModal, setShowModal] = useState(false)
  const [filter, setFilter] = useState('all')
  const [newTask, setNewTask] = useState({ title: '', priority: 'medium', dueDate: '', tags: '' })
  const [editingId, setEditingId] = useState(null)
  const [openMenuId, setOpenMenuId] = useState(null)

  const toggleStatus = (id) => {
    setTasks(tasks.map(t => {
      if (t.id !== id) return t
      const next = t.status === 'todo' ? 'in-progress' : t.status === 'in-progress' ? 'done' : 'todo'
      return { ...t, status: next }
    }))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id))
    setOpenMenuId(null)
  }

  const addTask = () => {
    if (!newTask.title.trim()) return
    const task = {
      id: Date.now(),
      title: newTask.title,
      priority: newTask.priority,
      status: 'todo',
      dueDate: newTask.dueDate || '미정',
      assignee: { name: '홍길동', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face' },
      tags: newTask.tags ? newTask.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    }
    setTasks([...tasks, task])
    setNewTask({ title: '', priority: 'medium', dueDate: '', tags: '' })
    setShowModal(false)
  }

  const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter)
  const doneCount = tasks.filter(t => t.status === 'done').length

  const StatusIcon = ({ status }) => {
    if (status === 'done') return <Icons.CheckCircle />
    if (status === 'in-progress') return <Icons.Clock />
    return <Icons.Circle />
  }

  const content = (
    <div className="card">
      <div className="card-header">
        <div className="card-header-left">
          <h3>업무관리</h3>
          <p>총 {tasks.length}건, {doneCount}건 완료</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
          <Icons.Plus className="sm" />
          업무 추가
        </button>
      </div>
      {!mini && (
        <div className="filter-tabs">
          {[['all','전체'],['todo','할 일'],['in-progress','진행 중'],['done','완료']].map(([v,l]) => (
            <button key={v} className={`filter-tab ${filter===v?'active':''}`} onClick={() => setFilter(v)}>{l}</button>
          ))}
        </div>
      )}
      <div className="card-content">
        <div className="task-list">
          {filtered.map((task) => (
            <div key={task.id} className={`task-item ${task.status === 'done' ? 'completed' : ''}`}>
              <button className={`task-status-btn ${task.status}`} onClick={() => toggleStatus(task.id)} title="상태 변경">
                <StatusIcon status={task.status} />
              </button>
              <div className="task-content">
                <p className={`task-title ${task.status === 'done' ? 'completed' : ''}`}>{task.title}</p>
                <div className="task-tags">
                  {task.tags.map((tag) => (
                    <span key={tag} className="task-tag">{tag}</span>
                  ))}
                </div>
              </div>
              <div className="task-meta">
                <Icons.Flag className={`sm task-priority ${task.priority}`} />
                <span className="task-date">{task.dueDate}</span>
                <Avatar src={task.assignee.avatar} name={task.assignee.name} size="sm" />
                <div className="dropdown-wrapper">
                  <button className="btn btn-icon btn-ghost sm task-more" onClick={() => setOpenMenuId(openMenuId === task.id ? null : task.id)}>
                    <Icons.MoreHorizontal className="sm" />
                  </button>
                  {openMenuId === task.id && (
                    <div className="dropdown-menu">
                      <button className="dropdown-item" onClick={() => { toggleStatus(task.id); setOpenMenuId(null) }}>
                        <Icons.CheckCircle className="sm" /> 상태 변경
                      </button>
                      <button className="dropdown-item danger" onClick={() => deleteTask(task.id)}>
                        <Icons.Trash className="sm" /> 삭제
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">해당하는 업무가 없습니다.</div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="새 업무 추가">
        <div className="form-group">
          <label>업무 제목 *</label>
          <input className="form-input" placeholder="업무 내용을 입력하세요" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>우선순위</label>
            <select className="form-input" value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})}>
              <option value="high">높음</option>
              <option value="medium">중간</option>
              <option value="low">낮음</option>
            </select>
          </div>
          <div className="form-group">
            <label>마감일</label>
            <input className="form-input" type="date" value={newTask.dueDate} onChange={e => setNewTask({...newTask, dueDate: e.target.value})} />
          </div>
        </div>
        <div className="form-group">
          <label>태그 (쉼표로 구분)</label>
          <input className="form-input" placeholder="예: 디자인, 개발" value={newTask.tags} onChange={e => setNewTask({...newTask, tags: e.target.value})} />
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>취소</button>
          <button className="btn btn-primary" onClick={addTask}>추가</button>
        </div>
      </Modal>
    </div>
  )
  return content
}

export default TaskSection