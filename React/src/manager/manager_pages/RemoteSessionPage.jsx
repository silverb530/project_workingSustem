import { useState, useEffect } from 'react'
import axios from 'axios'
import '../App_manager.css'

function RemoteSessionPage() {
  const [sessions, setSessions] = useState([])

  const fetchSessions = async () => {
    try {
      const res = await axios.get('/manage/remote/sessions')
      setSessions(res.data.sessions || [])
    } catch {}
  }

  useEffect(() => {
    fetchSessions()
    const interval = setInterval(fetchSessions, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleDisconnect = async (request_id) => {
    if (!confirm('접속을 강제 종료하시겠습니까?')) return
    try {
      await axios.post('/manage/remote/disconnect', { request_id })
      fetchSessions()
    } catch {
      alert('처리 실패')
    }
  }

  const active   = sessions.filter(s => !s.disconnected_at)
  const inactive = sessions.filter(s =>  s.disconnected_at)

  const formatDate = (val) => {
    if (!val) return '-'
    return String(val).replace('T', ' ').slice(0, 19)
  }

  return (
    <>
      <div className="page-header-block">
        <div>
          <h1 className="page-title">원격 접속 현황</h1>
          <p className="page-description">현재 원격 접속 중인 사원 및 접속 이력을 확인합니다. 5초마다 자동 갱신됩니다.</p>
        </div>
      </div>

      {/* 현재 접속 중 */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div className="card-header-left">
            <h3>현재 접속 중</h3>
            <p>접속 종료 시간이 없는 활성 세션입니다.</p>
          </div>
          <span className="status-badge green">{active.length}명 접속 중</span>
        </div>
        <div className="card-content">
          {active.length === 0 ? (
            <p style={{ padding: '20px', color: '#888', textAlign: 'center' }}>현재 접속 중인 사원이 없습니다.</p>
          ) : (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>사원번호</th>
                    <th>이름</th>
                    <th>PC 이름</th>
                    <th>PC IP</th>
                    <th>접속 시작</th>
                    <th>강제 종료</th>
                  </tr>
                </thead>
                <tbody>
                  {active.map(s => (
                    <tr key={s.request_id}>
                      <td>{s.employee_id}</td>
                      <td>{s.name}</td>
                      <td>{s.pc_name}</td>
                      <td><code style={styles.ipCode}>{s.ip_address}</code></td>
                      <td>{formatDate(s.approved_at)}</td>
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#C0392B', color: '#fff', border: 'none' }}
                          onClick={() => handleDisconnect(s.request_id)}
                        >
                          종료
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 접속 이력 */}
      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <h3>접속 이력</h3>
            <p>종료된 원격 접속 기록입니다.</p>
          </div>
        </div>
        <div className="card-content">
          {inactive.length === 0 ? (
            <p style={{ padding: '20px', color: '#888', textAlign: 'center' }}>접속 이력이 없습니다.</p>
          ) : (
            <div className="table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>사원번호</th>
                    <th>이름</th>
                    <th>PC 이름</th>
                    <th>PC IP</th>
                    <th>접속 시작</th>
                    <th>접속 종료</th>
                  </tr>
                </thead>
                <tbody>
                  {inactive.map(s => (
                    <tr key={s.request_id}>
                      <td>{s.employee_id}</td>
                      <td>{s.name}</td>
                      <td>{s.pc_name}</td>
                      <td><code style={styles.ipCode}>{s.ip_address}</code></td>
                      <td>{formatDate(s.approved_at)}</td>
                      <td>{formatDate(s.disconnected_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const styles = {
  ipCode: { background: '#f0f0f0', padding: '2px 6px', borderRadius: 4, fontSize: 13, fontFamily: 'monospace' }
}

export default RemoteSessionPage
