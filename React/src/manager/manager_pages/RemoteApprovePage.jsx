import { useState, useEffect } from 'react'
import axios from 'axios'
import '../App_manager.css'

const API_BASE = `http://${window.location.hostname}:5000`

function getStoredToken() {
    return (
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken') ||
        sessionStorage.getItem('access_token') ||
        sessionStorage.getItem('access_token') ||
        sessionStorage.getItem('jwt') ||
        sessionStorage.getItem('jwt') ||
        sessionStorage.getItem('authToken') ||
        sessionStorage.getItem('authToken') ||
        ''
    )
}

function getLoginUser() {
    try {
        const saved =
            sessionStorage.getItem('loginUser') ||
            sessionStorage.getItem('loginUser') ||
            sessionStorage.getItem('user') ||
            sessionStorage.getItem('user')

        if (!saved) return {}

        const parsed = JSON.parse(saved)

        if (parsed.user) {
            return parsed.user
        }

        return parsed
    } catch {
        return {}
    }
}

function clearAuthStorage() {
    sessionStorage.removeItem('loginUser')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('jwt')
    sessionStorage.removeItem('authToken')

    sessionStorage.removeItem('loginUser')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('accessToken')
    sessionStorage.removeItem('access_token')
    sessionStorage.removeItem('jwt')
    sessionStorage.removeItem('authToken')
}

function getAuthHeaders() {
    const token = getStoredToken()

    return {
        Authorization: `Bearer ${token}`,
    }
}

function handleAuthError(error) {
    if (error?.response?.status === 401) {
        clearAuthStorage()
        window.location.replace('/')
        return true
    }

    return false
}

function RemoteApprovePage() {
    const [requests, setRequests] = useState([])
    const admin = getLoginUser()

    const fetchRequests = async () => {
        try {
            const token = getStoredToken()

            if (!token) {
                clearAuthStorage()
                window.location.replace('/')
                return
            }

            const res = await axios.get(`${API_BASE}/manage/remote/requests/pending`, {
                headers: getAuthHeaders(),
            })

            setRequests(res.data.requests || [])
        } catch (error) {
            if (handleAuthError(error)) return
            console.error('원격 접속 요청 목록 조회 실패:', error)
        }
    }

    useEffect(() => {
        fetchRequests()

        const interval = setInterval(fetchRequests, 5000)

        return () => clearInterval(interval)
    }, [])

    const handleApprove = async (request_id, action) => {
        try {
            const token = getStoredToken()

            if (!token) {
                clearAuthStorage()
                window.location.replace('/')
                return
            }

            await axios.post(
                `${API_BASE}/manage/remote/request/approve`,
                {
                    request_id,
                    approved_by: admin.employee_id,
                    action,
                },
                {
                    headers: getAuthHeaders(),
                }
            )

            fetchRequests()
        } catch (error) {
            if (handleAuthError(error)) return
            console.error('원격 접속 요청 처리 실패:', error)
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
                        <p style={{ padding: '20px', color: '#888', textAlign: 'center' }}>
                            대기 중인 요청이 없습니다.
                        </p>
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