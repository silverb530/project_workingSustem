import { useEffect, useState } from 'react'
import { API_BASE } from '../config'
//서명 없는 UTF-8로 저장해야 글이 안 깨짐
function MyPage({ currentUser, onUserUpdated }) {
  const [form, setForm] = useState({
    employee_id: '',
    name: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    role: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  })

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')

  const fetchProfile = async () => {
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const res = await fetch(`${API_BASE}/api/profile/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || '내 정보를 불러오지 못했습니다.')
      }

      const employee = data.employee

      setForm(prev => ({
        ...prev,
        employee_id: employee.employee_id || '',
        name: employee.name || '',
        email: employee.email || '',
        phone: employee.phone || '',
        department: employee.department || '',
        position: employee.position || '',
        role: employee.role || '',
        current_password: '',
        new_password: '',
        confirm_password: '',
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setLoading(false)
      setError('로그인 정보가 없습니다. 다시 로그인해주세요.')
      return
    }

    fetchProfile()
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target

    setForm(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setSaving(true)
    setError('')
    setMessage('')

    if (form.new_password && form.new_password !== form.confirm_password) {
      setSaving(false)
      setError('새 비밀번호와 확인 비밀번호가 일치하지 않습니다.')
      return
    }

    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        department: form.department,
        position: form.position,
      }

      if (form.new_password) {
        payload.current_password = form.current_password
        payload.new_password = form.new_password
      }

      const res = await fetch(`${API_BASE}/api/profile/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.message || '내 정보 수정에 실패했습니다.')
      }

      const updatedUser = data.employee

      const nextLoginUser = {
        ...(currentUser || {}),
        ...updatedUser,
        id: updatedUser.employee_id,
      }

      localStorage.setItem('loginUser', JSON.stringify(nextLoginUser))
      localStorage.setItem('user', JSON.stringify(nextLoginUser))

      if (onUserUpdated) {
        onUserUpdated(nextLoginUser)
      }

      setForm(prev => ({
        ...prev,
        current_password: '',
        new_password: '',
        confirm_password: '',
      }))

      setMessage('내 정보가 수정되었습니다.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="content-wrapper">
        <div className="mypage-card">
          <p>내 정보를 불러오는 중입니다...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="content-wrapper">
      <div className="welcome-section">
        <h1>마이페이지</h1>
        <p>내 계정 정보와 연락처, 비밀번호를 수정할 수 있습니다.</p>
      </div>

      <form className="mypage-card" onSubmit={handleSubmit}>
        <div className="mypage-header">
          <div>
            <h2>{form.name || '사용자'}</h2>
            <p>{form.department || '부서 없음'} · {form.position || '직책 없음'}</p>
          </div>

          <div className="mypage-role-badge">
            {form.role || 'EMPLOYEE'}
          </div>
        </div>

        {message && <div className="mypage-alert success">{message}</div>}
        {error && <div className="mypage-alert error">{error}</div>}

        <div className="mypage-section-title">기본 정보</div>

        <div className="mypage-grid">
          <label className="mypage-field">
            <span>사원 ID</span>
            <input
              value={form.employee_id}
              disabled
            />
          </label>

          <label className="mypage-field">
            <span>권한</span>
            <input
              value={form.role}
              disabled
            />
          </label>

          <label className="mypage-field">
            <span>이름</span>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="이름"
            />
          </label>

          <label className="mypage-field">
            <span>이메일</span>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="이메일"
            />
          </label>

          <label className="mypage-field">
            <span>전화번호</span>
            <input
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="010-0000-0000"
            />
          </label>

          <label className="mypage-field">
            <span>부서</span>
            <input
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="부서"
            />
          </label>

          <label className="mypage-field">
            <span>직책</span>
            <input
              name="position"
              value={form.position}
              onChange={handleChange}
              placeholder="직책"
            />
          </label>
        </div>

        <div className="mypage-section-title">비밀번호 변경</div>

        <div className="mypage-grid">
          <label className="mypage-field">
            <span>현재 비밀번호</span>
            <input
              type="password"
              name="current_password"
              value={form.current_password}
              onChange={handleChange}
              placeholder="현재 비밀번호"
            />
          </label>

          <label className="mypage-field">
            <span>새 비밀번호</span>
            <input
              type="password"
              name="new_password"
              value={form.new_password}
              onChange={handleChange}
              placeholder="새 비밀번호"
            />
          </label>

          <label className="mypage-field">
            <span>새 비밀번호 확인</span>
            <input
              type="password"
              name="confirm_password"
              value={form.confirm_password}
              onChange={handleChange}
              placeholder="새 비밀번호 확인"
            />
          </label>
        </div>

        <div className="mypage-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={fetchProfile}
            disabled={saving}
          >
            다시 불러오기
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? '저장 중...' : '정보 수정'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default MyPage