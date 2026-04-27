import { useState, useEffect } from 'react'
import axios from 'axios'
import '../App_manager.css'

function RemoteApprovePage() {
  const [requests, setRequests] = useState([])
  const admin = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchRequests = async () => {
    try {
      const res = await axios.get('/manage/remote/requests/pending')
      setRequests(res.data.requests || [])
    } catch {}
  }

  useEffect(() => {
    fetchRequests()
    const interval = setInterval(fetchRequests, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleApprove = async (request_id, action) => {
    try {
      await axios.post('/manage/remote/request/approve', {
        request_id,
        approved_by: admin.employee_id,
        action
      })
      fetchRequests()
    } catch {
      alert('처리 실패')
    }
  }

  return (
    <>
      <div className="page-header-block">
        <div>
          <h1 className="page-title">원격 접속 승인</h1>
          <p className="page-description">사원의 원격 PC 접속 요청을 승인하거나 거절합니다.</p>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-header-left">
            <h3>대기 중인 요청</h3>
            <p>승인 대기 중인 원격 접속 요청 목록입니다. 5초마다 자동 갱신됩니다.</p>
          </div>
        </div>
        <div className="card-content">
          {requests.length === 0 ? (
            <p style={{ padding: '20px', color: '#888', textAlign: 'center' }}>대기 중인 요청이 없습니다.</p>
          ) : (
            <div className="table-wrap" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>요청 시간</th>
                    <th>사원 ID</th>
                    <th>이름</th>
                    <th>접속 PC</th>
                    <th>승인</th>
                    <th>거절</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => (
                    <tr key={r.request_id}>
                      <td>{String(r.requested_at)}</td>
                      <td>{r.employee_id}</td>
                      <td>{r.name}</td>
                      <td>{r.pc_name}</td>
                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleApprove(r.request_id, 'approved')}
                        >
                          승인
                        </button>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#C0392B', color: '#fff', border: 'none' }}
                          onClick={() => handleApprove(r.request_id, 'rejected')}
                        >
                          거절
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
    </>
  )
}

export default RemoteApprovePage
