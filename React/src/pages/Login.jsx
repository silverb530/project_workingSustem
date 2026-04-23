import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AppManager from '../manager/App_manager';

const Login = () => {
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            // 5000번 포트의 Flask 서버로 로그인 요청 전송!
            const response = await axios.post('http://localhost:5000/route/login', {
                id: id,
                pw: pw
            });

            if (response.data.result === "success") {

                alert(response.data.user.name + "님, 환영합니다!");
                if (response.data.user.role == "ADMIN") {
                    navigate('/AppManager'); // 로그인 성공 시 대시보드로 이동
                }
                else {
                    navigate('/user'); // 로그인 성공 시 대시보드로 이동
                }
               
            }
        } catch (error) {
            if (error.response) {
                // 서버가 응답은 했지만 실패 (401 등)
                alert(error.response.data.message);
            } else {
                // 네트워크 오류 (서버 미실행, CORS 등)
                alert("서버에 연결할 수 없습니다.");
            }
        }
    };
    return (
        <div style={{ padding: "20px" }}>
            <h2>출퇴근 관리 시스템 로그인</h2>
            <form onSubmit={handleLogin}>
                <input type="text" placeholder="ID" value={id} onChange={(e) => setId(e.target.value)} /><br />
                <input type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} /><br />
                <button type="submit">로그인</button>
            </form>
        </div>
    );
};

export default Login;