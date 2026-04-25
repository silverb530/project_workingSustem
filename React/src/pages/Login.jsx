import React, { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import '../manager/App_manager.css'

const Login = () => {
    const [id, setId] = useState('')
    const [pw, setPw] = useState('')
    const navigate = useNavigate()

    const handleLogin = async (e) => {
        e.preventDefault()

        try {
            const response = await axios.post('/route/login', {
                id: id,
                pw: pw,
            })

            const data = response.data

                

            if (data.success || data.result === 'success') {
                const loginUser = data.user

                localStorage.removeItem('loginUser')
                localStorage.setItem('loginUser', JSON.stringify(loginUser))
                localStorage.setItem('user', JSON.stringify(loginUser))

                alert(`${loginUser.name}님, 환영합니다!`)

                if (loginUser.role === 'ADMIN') {
                    navigate('/AppManager')
                } else {
                    navigate('/user')
                }

                return
            }

            alert(data.message || '로그인 실패')
        } catch (error) {
            if (error.response) {
                alert(error.response.data.message || '로그인 실패')
            } else {
                alert('서버에 연결할 수 없습니다.')
            }
        }
    }

    return (
        <div className="login-page">
            <div className="login-card">
                <h2>출퇴근 관리 시스템 로그인</h2>

                <form onSubmit={handleLogin} className="login-form">
                    <input
                        type="text"
                        placeholder="ID"
                        value={id}
                        onChange={(e) => setId(e.target.value)}
                    />

                    <input
                        type="password"
                        placeholder="Password"
                        value={pw}
                        onChange={(e) => setPw(e.target.value)}
                    />

                    <button type="submit">로그인</button>
                </form>
                <p style={{ marginTop: 12, fontSize: 13, textAlign: 'center' }}>
                    계정이 없으신가요? <a href="/register">회원가입</a>
                </p>
            </div>
        </div>
    )
}

export default Login