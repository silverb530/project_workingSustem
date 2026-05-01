import { useState, useEffect, useRef } from 'react'
import Icons from './Icons'
import Modal from './Modal'
import { API_BASE } from '../config'

const STATUS_STEPS = [
  { key: 'PENDING',     label: '신청 중' },
  { key: 'ACCEPTED',   label: '접수 완료' },
  { key: 'IN_PROGRESS',label: '처리중' },
  { key: 'COMPLETED',  label: '처리 완료' },
]

const PRIORITY_LABEL = { LOW: '낮음', MEDIUM: '중간', HIGH: '높음' }
const PRIORITY_COLOR = { LOW: '#3db88b', MEDIUM: '#f59e0b', HIGH: '#e5484d' }

function StatusStepper({ status }) {
  if (status === 'REJECTED') {
    return (
      <span style={{
        display: 'inline-block', padding: '3px 10px', borderRadius: 20,
        background: '#fee2e2', color: '#e5484d', fontSize: 12, fontWeight: 600
      }}>거절됨</span>
    )
  }

  const currentIdx = STATUS_STEPS.findIndex(s => s.key === status)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'nowrap' }}>
      {STATUS_STEPS.map((step, idx) => (
        <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700,
              background: idx < currentIdx ? '#5b6eae' : idx === currentIdx ? '#5b6eae' : '#e8ebf2',
              color: idx <= currentIdx ? '#fff' : '#9ba3bf',
              border: idx === currentIdx ? '2px solid #3d4f8c' : '2px solid transparent',
              transition: 'all 0.3s',
            }}>
              {idx < currentIdx ? '✓' : idx + 1}
            </div>
            <span style={{
              fontSize: 11, fontWeight: idx === currentIdx ? 700 : 400,
              color: idx <= currentIdx ? '#5b6eae' : '#9ba3bf',
              whiteSpace: 'nowrap'
            }}>{step.label}</span>
          </div>
          {idx < STATUS_STEPS.length - 1 && (
            <div style={{
              width: 32, height: 2, margin: '0 2px', marginBottom: 16,
              background: idx < currentIdx ? '#5b6eae' : '#e8ebf2',
              transition: 'background 0.3s',
            }} />
          )}
        </div>
      ))}
    </div>
  )
}

function WorkRequestSection({ currentUser, onTaskUpdate }) {
  const [tab, setTab] = useState('received')
  const [sentList, setSentList] = useState([])
  const [receivedList, setReceivedList] = useState([])
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectTarget, setRejectTarget] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [form, setForm] = useState({ title: '', description: '', target_department: '', priority: 'MEDIUM', due_date: '' })
  const [submitting, setSubmitting] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  const token = sessionStorage.getItem('token')
  const authHeader = { Authorization: `Bearer ${token}` }

  const fetchAll = async () => {
    const dept = currentUser?.department || ''
    if (!dept) return

    setLoading(true)
    try {
      const [sentRes, recvRes] = await Promise.all([
        fetch(`${API_BASE}/api/work-requests/sent?department=${encodeURIComponent(dept)}`),
        fetch(`${API_BASE}/api/work-requests/received?department=${encodeURIComponent(dept)}`),
      ])
      const sentData = await sentRes.json()
      const recvData = await recvRes.json()
      if (sentData.success) setSentList(sentData.requests || [])
      if (recvData.success) setReceivedList(recvData.requests || [])
    } catch (e) {
      console.error('업무 요청 로드 실패:', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/work-requests/departments`)
      const data = await res.json()
      if (data.success) {
        // 내 부서는 선택지에서 제외
        const myDept = currentUser?.department || ''
        setDepartments((data.departments || []).filter(d => d !== myDept))
      }
    } catch (e) {
      console.error('부서 목록 로드 실패:', e)
    }
  }

  useEffect(() => {
    if (currentUser?.department) {
      fetchAll()
    }
  }, [currentUser?.department])

  useEffect(() => {
    fetchDepartments()
  }, [])

  const handleCreate = async () => {
    if (!form.title.trim()) return alert('업무 제목을 입력하세요.')
    if (!form.target_department) return alert('담당 부서를 선택하세요.')
    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE}/api/work-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          requester_id: currentUser?.employee_id,
          requester_department: currentUser?.department,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setShowModal(false)
        setForm({ title: '', description: '', target_department: '', priority: 'MEDIUM', due_date: '' })
        await fetchAll()
        onTaskUpdate?.()
        setTab('sent')
      } else {
        alert(data.message || '등록 실패')
      }
    } catch { alert('서버 오류') }
    finally { setSubmitting(false) }
  }

  const updateStatus = async (reqId, newStatus, reason = '') => {
    try {
      const res = await fetch(`${API_BASE}/api/work-requests/${reqId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          rejection_reason: reason,
          department: currentUser?.department,
        }),
      })
      const data = await res.json()
      if (data.success) {
        fetchAll()
        onTaskUpdate?.()
      } else alert(data.message || '상태 변경 실패')
    } catch { alert('서버 오류') }
  }

  const openRejectModal = (req) => {
    setRejectTarget(req)
    setRejectReason('')
    setShowRejectModal(true)
  }

  const handleReject = async () => {
    if (!rejectTarget) return
    await updateStatus(rejectTarget.request_id, 'REJECTED', rejectReason)
    setShowRejectModal(false)
    setRejectTarget(null)
  }

  const STATUS_FILTER_OPTS = [
    { value: 'all', label: '전체' },
    { value: 'PENDING', label: '신청 중' },
    { value: 'ACCEPTED', label: '접수 완료' },
    { value: 'IN_PROGRESS', label: '처리중' },
    { value: 'COMPLETED', label: '처리 완료' },
    { value: 'REJECTED', label: '거절됨' },
  ]

  const currentList = tab === 'sent' ? sentList : receivedList
  const filtered = filterStatus === 'all' ? currentList : currentList.filter(r => r.status === filterStatus)

  const pendingCount = receivedList.filter(r => r.status === 'PENDING').length

  return (
    <div className="card">
      {/* 헤더 - 3컬럼: 빈공간 / 제목(중앙) / 버튼 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '20px 20px 16px' }}>
        <div />
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--foreground)' }}>업무 요청</h3>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: 'var(--muted-foreground)' }}>부서간 업무 요청을 관리합니다</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Icons.Plus className="sm" />
            업무 추가
          </button>
        </div>
      </div>

      {/* 탭 */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 20px' }}>
        <button
          onClick={() => setTab('received')}
          style={{
            padding: '10px 16px', fontSize: 14, fontWeight: tab === 'received' ? 700 : 400,
            color: tab === 'received' ? 'var(--primary)' : 'var(--muted-foreground)',
            borderBottom: tab === 'received' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'none', border: 'none', borderRadius: 0, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          받은 요청
          {pendingCount > 0 && (
            <span style={{
              background: '#e5484d', color: '#fff', borderRadius: 10,
              fontSize: 11, fontWeight: 700, padding: '1px 7px', minWidth: 20, textAlign: 'center'
            }}>{pendingCount}</span>
          )}
        </button>
        <button
          onClick={() => setTab('sent')}
          style={{
            padding: '10px 16px', fontSize: 14, fontWeight: tab === 'sent' ? 700 : 400,
            color: tab === 'sent' ? 'var(--primary)' : 'var(--muted-foreground)',
            borderBottom: tab === 'sent' ? '2px solid var(--primary)' : '2px solid transparent',
            background: 'none', border: 'none', borderRadius: 0, cursor: 'pointer',
          }}
        >
          보낸 요청
        </button>
      </div>

      {/* 상태 필터 */}
      <div style={{ display: 'flex', gap: 6, padding: '12px 20px', flexWrap: 'wrap' }}>
        {STATUS_FILTER_OPTS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilterStatus(opt.value)}
            style={{
              padding: '4px 12px', borderRadius: 16, fontSize: 12, cursor: 'pointer',
              border: '1px solid',
              borderColor: filterStatus === opt.value ? 'var(--primary)' : 'var(--border)',
              background: filterStatus === opt.value ? 'var(--primary)' : '#fff',
              color: filterStatus === opt.value ? '#fff' : 'var(--muted-foreground)',
              fontWeight: filterStatus === opt.value ? 600 : 400,
            }}
          >{opt.label}</button>
        ))}
      </div>

      {/* 리스트 */}
      <div className="card-content">
        {loading ? (
          <div className="empty-state">불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {tab === 'received' ? '받은 업무 요청이 없습니다.' : '보낸 업무 요청이 없습니다.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(req => (
              <RequestCard
                key={req.request_id}
                req={req}
                tab={tab}
                onAccept={() => updateStatus(req.request_id, 'ACCEPTED')}
                onStart={() => updateStatus(req.request_id, 'IN_PROGRESS')}
                onComplete={() => updateStatus(req.request_id, 'COMPLETED')}
                onReject={() => openRejectModal(req)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 업무 추가 모달 - 커스텀 디자인 */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
          backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1000, padding: 20,
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520,
            boxShadow: '0 24px 64px rgba(0,0,0,0.2)', overflow: 'hidden',
          }}>
            {/* 모달 헤더 */}
            <div style={{
              background: 'linear-gradient(135deg, #5b6eae 0%, #3d4f8c 100%)',
              padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 14,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icons.Plus style={{ color: '#fff', width: 22, height: 22 }} />
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>업무 추가</h2>
                <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: '2px 0 0' }}>
                  다른 부서에 업무를 요청합니다
                </p>
              </div>
              <button onClick={() => setShowModal(false)} style={{
                width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.15)',
                border: 'none', color: '#fff', cursor: 'pointer', fontSize: 18, lineHeight: 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>×</button>
            </div>

            {/* 모달 바디 */}
            <div style={{ padding: '28px 28px 8px' }}>
              {/* 업무 제목 */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  업무 제목 <span style={{ color: '#e5484d' }}>*</span>
                </label>
                <input
                  placeholder="어떤 업무를 요청하시겠어요?"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
                    border: '1.5px solid #e5e7eb', outline: 'none', boxSizing: 'border-box',
                    fontFamily: 'inherit', color: '#111827', background: '#ffffff',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#5b6eae'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* 상세 내용 */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                  상세 내용 <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>(선택)</span>
                </label>
                <textarea
                  placeholder="업무에 대한 구체적인 내용을 입력하세요"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  style={{
                    width: '100%', padding: '10px 14px', borderRadius: 10, fontSize: 14,
                    border: '1.5px solid #e5e7eb', outline: 'none', resize: 'vertical',
                    fontFamily: 'inherit', color: '#111827', background: '#ffffff', boxSizing: 'border-box',
                  }}
                  onFocus={e => e.target.style.borderColor = '#5b6eae'}
                  onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                />
              </div>

              {/* 담당 부서 */}
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                  담당 부서 <span style={{ color: '#e5484d' }}>*</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {departments.map(d => (
                    <button
                      key={d}
                      onClick={() => setForm({ ...form, target_department: d })}
                      style={{
                        padding: '7px 16px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                        border: '1.5px solid',
                        borderColor: form.target_department === d ? '#5b6eae' : '#e5e7eb',
                        background: form.target_department === d ? '#5b6eae' : '#fff',
                        color: form.target_department === d ? '#fff' : '#6b7394',
                        fontWeight: form.target_department === d ? 700 : 400,
                        transition: 'all 0.15s',
                      }}
                    >{d}</button>
                  ))}
                  {departments.length === 0 && (
                    <span style={{ fontSize: 13, color: '#9ca3af' }}>부서 목록을 불러오는 중...</span>
                  )}
                </div>
              </div>

              {/* 우선순위 + 마감일 */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 8 }}>
                    우선순위
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[
                      { value: 'LOW', label: '낮음', color: '#3db88b' },
                      { value: 'MEDIUM', label: '중간', color: '#f59e0b' },
                      { value: 'HIGH', label: '높음', color: '#e5484d' },
                    ].map(p => (
                      <button
                        key={p.value}
                        onClick={() => setForm({ ...form, priority: p.value })}
                        style={{
                          flex: 1, padding: '7px 0', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                          border: '1.5px solid',
                          borderColor: form.priority === p.value ? p.color : '#e5e7eb',
                          background: form.priority === p.value ? p.color + '15' : '#fff',
                          color: form.priority === p.value ? p.color : '#6b7394',
                          fontWeight: form.priority === p.value ? 700 : 400,
                          transition: 'all 0.15s',
                        }}
                      >{p.label}</button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    마감일 <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 400 }}>(선택)</span>
                  </label>
                  <input
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm({ ...form, due_date: e.target.value })}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 10, fontSize: 13,
                      border: '1.5px solid #e5e7eb', outline: 'none', boxSizing: 'border-box',
                      fontFamily: 'inherit', color: '#111827', background: '#ffffff',
                    }}
                    onFocus={e => e.target.style.borderColor = '#5b6eae'}
                    onBlur={e => e.target.style.borderColor = '#e5e7eb'}
                  />
                </div>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div style={{ padding: '16px 28px 24px', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setShowModal(false)} style={{
                padding: '10px 22px', borderRadius: 10, fontSize: 14, cursor: 'pointer',
                border: '1.5px solid #e5e7eb', background: '#fff', color: '#6b7394', fontWeight: 500,
              }}>취소</button>
              <button onClick={handleCreate} disabled={submitting} style={{
                padding: '10px 28px', borderRadius: 10, fontSize: 14, cursor: submitting ? 'not-allowed' : 'pointer',
                border: 'none', background: 'linear-gradient(135deg, #5b6eae, #3d4f8c)',
                color: '#fff', fontWeight: 700, opacity: submitting ? 0.7 : 1,
                boxShadow: '0 4px 12px rgba(91,110,174,0.35)',
              }}>
                {submitting ? '등록 중...' : '업무 추가'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 거절 사유 모달 */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="거절 사유 입력">
        <div className="form-group">
          <label>거절 사유 (선택)</label>
          <textarea
            className="form-input"
            placeholder="거절 사유를 입력하세요"
            rows={3}
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={() => setShowRejectModal(false)}>취소</button>
          <button
            className="btn"
            style={{ background: '#e5484d', color: '#fff' }}
            onClick={handleReject}
          >거절 확인</button>
        </div>
      </Modal>
    </div>
  )
}

function RequestCard({ req, tab, onAccept, onStart, onComplete, onReject }) {
  const [files, setFiles] = useState([])
  const [pendingFile, setPendingFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  // 처리중, 완료, 보낸 요청의 완료 상태 모두 파일 표시
  const showFiles = ['IN_PROGRESS', 'COMPLETED'].includes(req.status)

  useEffect(() => {
    if (showFiles) fetchFiles()
  }, [req.request_id, req.status])

  const [fileError, setFileError] = useState('')

  const fetchFiles = async () => {
    setFileError('')
    try {
      const res = await fetch(`${API_BASE}/api/work-requests/${req.request_id}/files`)
      const data = await res.json()
      if (data.success) setFiles(data.files || [])
      else { setFiles([]); setFileError(data.message || '파일 조회 실패') }
    } catch (e) { setFiles([]); setFileError('서버 연결 실패') }
  }

  const handleUpload = async () => {
    if (!pendingFile) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', pendingFile)
    try {
      const res = await fetch(`${API_BASE}/api/work-requests/${req.request_id}/files`, {
        method: 'POST', body: fd,
      })
      const data = await res.json()
      if (data.success) {
        setPendingFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ''
        fetchFiles()
      } else alert(data.message || '업로드 실패')
    } catch { alert('업로드 오류') }
    finally { setUploading(false) }
  }

  return (
    <div style={{
      border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px',
      background: '#fff', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* 상단: 우선순위+날짜(우측) / 부서+제목(중앙) */}
      <div style={{ position: 'relative' }}>
        {/* 우선순위 + 날짜 - 우측 상단 고정 */}
        <div style={{ position: 'absolute', top: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 3 }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: PRIORITY_COLOR[req.priority] + '20', color: PRIORITY_COLOR[req.priority] }}>
            {PRIORITY_LABEL[req.priority]}
          </span>
          {req.due_date && <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>마감: {req.due_date}</span>}
        </div>
        {/* 부서 + 제목 - 가운데 정렬 */}
        <div style={{ textAlign: 'center', paddingRight: 80 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: '#eef0f6', color: 'var(--primary)' }}>
              {req.requester_department}
            </span>
            <Icons.ChevronRight className="sm" />
            <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 10, background: '#f0faf6', color: '#3db88b' }}>
              {req.target_department}
            </span>
          </div>
          <p style={{ fontWeight: 700, color: 'var(--foreground)', fontSize: 15, margin: 0 }}>{req.title}</p>
          {req.description && (
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginTop: 4 }}>{req.description}</p>
          )}
        </div>
      </div>

      {/* 상태 스테퍼 - 가운데 정렬 */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <StatusStepper status={req.status} />
      </div>

      {/* 거절 사유 */}
      {req.status === 'REJECTED' && req.rejection_reason && (
        <p style={{ fontSize: 12, color: '#e5484d', background: '#fee2e2', padding: '6px 10px', borderRadius: 8 }}>
          거절 사유: {req.rejection_reason}
        </p>
      )}

      {/* 첨부파일 영역 (처리중 / 처리완료일 때 표시) */}
      {showFiles && (
        <div style={{ background: '#f7f8fb', borderRadius: 8, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted-foreground)', margin: 0 }}>
              📎 첨부파일 {files.length > 0 ? `(${files.length})` : ''}
            </p>
            <button onClick={fetchFiles} style={{ fontSize: 11, color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>새로고침</button>
          </div>
          {fileError && <p style={{ fontSize: 12, color: '#e5484d', margin: 0 }}>오류: {fileError}</p>}
          {files.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {files.map(f => (
                <a
                  key={f.file_id}
                  href={`${API_BASE}/api/work-requests/files/${f.file_id}/download`}
                  style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Icons.Download className="sm" />
                  {f.original_name}
                  <span style={{ fontSize: 11, color: 'var(--muted-foreground)', marginLeft: 4 }}>
                    {f.uploaded_at}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', margin: 0 }}>첨부된 파일이 없습니다.</p>
          )}

          {/* 파일 업로드 (처리중 + 받은탭에서만) */}
          {tab === 'received' && req.status === 'IN_PROGRESS' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
              <input
                ref={fileInputRef}
                type="file"
                style={{ display: 'none' }}
                onChange={e => setPendingFile(e.target.files[0] || null)}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                  border: '1px dashed var(--primary)', background: '#fff', color: 'var(--primary)', fontWeight: 600,
                }}
              >
                파일 선택
              </button>
              {pendingFile && (
                <>
                  <span style={{ fontSize: 12, color: 'var(--foreground)' }}>
                    {pendingFile.name}
                  </span>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    style={{
                      padding: '5px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                      border: 'none', background: 'var(--primary)', color: '#fff', fontWeight: 600,
                    }}
                  >
                    {uploading ? '업로드 중...' : '업로드'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* 하단: 메타 + 액션 버튼 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
          요청자: {req.requester_name || '-'} · {(req.created_at || '').slice(0, 10)}
        </span>

        {tab === 'received' && (
          <div style={{ display: 'flex', gap: 8 }}>
            {req.status === 'PENDING' && (
              <>
                <button onClick={onAccept} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer' }}>수락</button>
                <button onClick={onReject} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#fff', color: '#e5484d', border: '1px solid #e5484d', cursor: 'pointer' }}>거절</button>
              </>
            )}
            {req.status === 'ACCEPTED' && (
              <button onClick={onStart} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#f59e0b', color: '#fff', border: 'none', cursor: 'pointer' }}>처리 시작</button>
            )}
            {req.status === 'IN_PROGRESS' && (
              <button onClick={onComplete} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: '#3db88b', color: '#fff', border: 'none', cursor: 'pointer' }}>처리 완료</button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default WorkRequestSection
