import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '', email: '', password: '', phone: '',
        department: '', position: '', pc_name: '', ip_address: ''
    });
    const [loading, setLoading] = useState(false);
    const [ipLoading, setIpLoading] = useState(true);

    useEffect(() => {
        axios.get('/route/my-ip')
            .then(res => {
                setForm(prev => ({ ...prev, ip_address: res.data.ip }));
                setIpLoading(false);
            })
            .catch(() => setIpLoading(false));
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.email || !form.password || !form.ip_address) {
            alert('이름, 이메일, 비밀번호, PC IP 주소는 필수입니다.');
            return;
        }
        setLoading(true);
        try {
            const res = await axios.post('/route/register', {
                ...form,
                pc_name: form.pc_name || `${form.name}의 PC`
            });
            if (res.data.result === 'success') {
                alert(`회원가입 완료!\n사원번호: ${res.data.employee_id}\n로그인 시 사원번호를 ID로 사용하세요.`);
                navigate('/');
            }
        } catch (err) {
            alert(err.response?.data?.message || '회원가입 실패');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>회원가입</h2>
                <form onSubmit={handleSubmit}>
                    <div style={styles.row}>
                        <Field label="이름 *" name="name" value={form.name} onChange={handleChange} />
                        <Field label="이메일 *" name="email" type="email" value={form.email} onChange={handleChange} />
                    </div>
                    <div style={styles.row}>
                        <Field label="비밀번호 *" name="password" type="password" value={form.password} onChange={handleChange} />
                        <Field label="전화번호" name="phone" value={form.phone} onChange={handleChange} placeholder="010-0000-0000" />
                    </div>
                    <div style={styles.row}>
                        <Field label="부서" name="department" value={form.department} onChange={handleChange} />
                        <Field label="직위" name="position" value={form.position} onChange={handleChange} />
                    </div>

                    <hr style={styles.divider} />
                    <p style={styles.sectionLabel}>원격 접속 PC 정보</p>

                    <div style={styles.row}>
                        <Field label="PC 이름" name="pc_name" value={form.pc_name} onChange={handleChange} placeholder="미입력 시 이름+의 PC" />
                        <Field label={ipLoading ? "PC IP 주소 * (감지 중...)" : "PC IP 주소 * (자동 감지)"} name="ip_address" value={form.ip_address} onChange={handleChange} placeholder="예) 192.168.0.101" />
                    </div>

                    <button type="submit" style={styles.btn} disabled={loading}>
                        {loading ? '처리 중...' : '가입하기'}
                    </button>
                </form>
                <p style={styles.loginLink}>
                    이미 계정이 있으신가요? <Link to="/">로그인</Link>
                </p>
            </div>
        </div>
    );
};

const Field = ({ label, name, type = 'text', value, onChange, placeholder }) => (
    <div style={{ flex: 1 }}>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 4, color: '#555' }}>{label}</label>
        <input
            type={type} name={name} value={value} onChange={onChange}
            placeholder={placeholder}
            style={{ width: '100%', padding: '8px 10px', border: '1px solid #ddd', borderRadius: 6, fontSize: 14, boxSizing: 'border-box' }}
        />
    </div>
);

const styles = {
    container: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' },
    card: { background: '#fff', padding: '36px 40px', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.1)', width: '100%', maxWidth: 580 },
    title: { marginBottom: 24, fontSize: 22, fontWeight: 700, color: '#2C5F2E' },
    row: { display: 'flex', gap: 16, marginBottom: 16 },
    divider: { border: 'none', borderTop: '1px solid #eee', margin: '20px 0 12px' },
    sectionLabel: { fontSize: 13, fontWeight: 600, color: '#2C5F2E', marginBottom: 12 },
    btn: { width: '100%', padding: '10px', background: '#2C5F2E', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 8 },
    loginLink: { textAlign: 'center', marginTop: 16, fontSize: 13, color: '#888' },
};

export default Register;
