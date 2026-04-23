import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AppManager from '../manager/App_manager';

const Login = () => {
    const [id, setId] = useState('');
    const [pw, setPw] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            // 5000번 포트의 Flask 서버로 로그인 요청 전송!
            const response = await axios.post('http://localhost:5000/api/login', {
                id: id,
                pw: pw
            });

            if (response.data.result === "success") {
                alert(response.data.user_name + "님, 환영합니다!");
                navigate('/AppManager'); // 로그인 성공 시 대시보드로 이동
            }
        } catch (error) {
            console.error("로그인 에러:", error);
            alert("서버 연결에 실패했어요. Flask가 켜져 있는지 확인해보세요!");
        }
    };

    return (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
            <h1>Remote Work System</h1>
            <input type="text" placeholder="사번 입력" onChange={(e) => setId(e.target.value)} /><br />
            <input type="password" placeholder="비밀번호" onChange={(e) => setPw(e.target.value)} /><br />
            <button onClick={handleLogin}>로그인하기</button>
        </div>
    );
};

export default Login;