import { useState, useEffect } from 'react';
import Icons from './Icons';
import Avatar from './Avatar';
import Modal from './Modal';
import MeetingRoom from './MeetingRoom';

const API = 'http://localhost:5000';

function MeetingSection({ mini = false }) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [meetings, setMeetings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [newMeeting, setNewMeeting] = useState({ title: '', scheduled_at: '', duration: '30분' });
    const [activeMeeting, setActiveMeeting] = useState(null);

    const fetchMeetings = async () => {
        try {
            const res = await fetch(`${API}/api/meetings`);
            const data = await res.json();
            if (data.success) setMeetings(data.meetings);
        } catch (e) {
            console.error('회의 목록 조회 실패:', e);
        }
    };

    useEffect(() => {
        fetchMeetings();
    }, []);

    const addMeeting = async () => {
        if (!newMeeting.title.trim()) return;
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/meetings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: newMeeting.title,
                    host_id: user.employee_id || 1,
                    scheduled_at: newMeeting.scheduled_at || null,
                    duration: newMeeting.duration,
                }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchMeetings();
                setNewMeeting({ title: '', scheduled_at: '', duration: '30분' });
                setShowModal(false);
            }
        } catch (e) {
            console.error('회의 생성 실패:', e);
        }
        setLoading(false);
    };

    const deleteMeeting = async (roomId, e) => {
        e.stopPropagation();
        if (!window.confirm('이 회의를 삭제할까요?')) return;
        try {
            await fetch(`${API}/api/meetings/${roomId}`, { method: 'DELETE' });
            setMeetings(prev => prev.filter(m => m.room_id !== roomId));
        } catch (e) {
            console.error('회의 삭제 실패:', e);
        }
    };

    const enterMeeting = (meeting) => {
        setActiveMeeting(meeting);
    };

    const leaveMeeting = () => {
        setActiveMeeting(null);
        fetchMeetings();
    };

    const startInstant = async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/meetings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: '즉석 회의',
                    host_id: user.employee_id || 1,
                    duration: '30분',
                }),
            });
            const data = await res.json();
            if (data.success) {
                await fetchMeetings();
                const res2 = await fetch(`${API}/api/meetings`);
                const data2 = await res2.json();
                const created = data2.meetings?.find(m => m.room_id === data.room_id);
                if (created) enterMeeting(created);
            }
        } catch (e) {
            console.error('즉석 회의 생성 실패:', e);
        }
        setLoading(false);
    };

    const fmtTime = (scheduled_at) => {
        if (!scheduled_at) return '미정';
        const d = new Date(scheduled_at);
        if (isNaN(d)) return scheduled_at;
        return d.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // 회의실 진입 시 화상회의 화면
    if (activeMeeting && !mini) {
        return (
            <div className="content-wrapper" style={{ height: 'calc(100vh - 80px)', display: 'flex', flexDirection: 'column' }}>
                <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
                <MeetingRoom room={activeMeeting} onLeave={leaveMeeting} />
            </div>
        );
    }

    return (
        <div className={mini ? 'card' : 'content-wrapper'}>
            {!mini && (
                <div className="welcome-section">
                    <h1>화상회의</h1>
                    <p>언제든지 팀원들과 연결하세요.</p>
                </div>
            )}

            <div className="card">
                <div className="card-header">
                    <div className="card-header-left">
                        <h3>화상회의</h3>
                        <p>회의 {meetings.length}건</p>
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
                        <Icons.Plus className="sm" />일정 추가
                    </button>
                </div>

                <div className="card-content">
                    {!mini && (
                        <div className="meeting-actions">
                            <button className="btn btn-outline" onClick={startInstant} disabled={loading}>
                                <Icons.Video className="sm" />즉석 회의 시작
                            </button>
                        </div>
                    )}

                    {meetings.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px', color: '#9ca3af', fontSize: '14px' }}>
                            예정된 회의가 없습니다
                        </div>
                    ) : (
                        <div className="meeting-list">
                            {meetings.map((meeting) => (
                                <div key={meeting.room_id} className="meeting-item">
                                    <div className="meeting-icon-wrapper">
                                        <Icons.Video />
                                    </div>
                                    <div className="meeting-content">
                                        <p className="meeting-title">{meeting.title}</p>
                                        <div className="meeting-time">
                                            <Icons.Clock className="sm" />
                                            <span>{fmtTime(meeting.scheduled_at)}</span>
                                            <span>-</span>
                                            <span>{meeting.duration}</span>
                                            {meeting.host_name && (
                                                <span style={{ color: '#8b8fa8' }}>· {meeting.host_name}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        className="btn btn-primary btn-sm meeting-join"
                                        onClick={() => enterMeeting(meeting)}
                                    >
                                        입장
                                    </button>
                                    {!mini && (
                                        <button
                                            className="btn btn-icon btn-ghost sm"
                                            onClick={(e) => deleteMeeting(meeting.room_id, e)}
                                        >
                                            <Icons.Trash className="sm" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="회의 일정 추가">
                <style>{`
                    .mtg-input {
                        width: 100%; padding: 11px 14px;
                        border: 1.5px solid #e5e7eb; border-radius: 10px;
                        font-size: 14px; color: #1a1d23; background: #f9fafb;
                        outline: none; transition: border-color 0.15s, box-shadow 0.15s;
                        box-sizing: border-box; font-family: inherit;
                    }
                    .mtg-input:focus { border-color: #3b82f6; background: #fff; box-shadow: 0 0 0 3px rgba(59,130,246,0.12); }
                    .mtg-input::placeholder { color: #b0b5c3; }
                    .mtg-select {
                        appearance: none;
                        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
                        background-repeat: no-repeat; background-position: right 12px center;
                        padding-right: 36px; cursor: pointer;
                    }
                `}</style>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* 섹션 1 : 회의 제목 */}
                    <div style={F.section}>
                        <div style={F.sectionHeader}>
                            <span style={F.sectionNum}>1</span>
                            <span style={F.sectionTitle}>회의 제목</span>
                            <span style={{ color: '#ef4444', fontSize: '12px' }}>필수</span>
                        </div>
                        <input
                            className="mtg-input"
                            placeholder="예: 주간 팀 미팅, 프로젝트 리뷰..."
                            value={newMeeting.title}
                            onChange={e => setNewMeeting({ ...newMeeting, title: e.target.value })}
                            onKeyDown={e => e.key === 'Enter' && addMeeting()}
                            autoFocus
                        />
                    </div>

                    {/* 섹션 2 : 일정 정보 */}
                    <div style={F.section}>
                        <div style={F.sectionHeader}>
                            <span style={F.sectionNum}>2</span>
                            <span style={F.sectionTitle}>일정 정보</span>
                            <span style={{ color: '#9ca3af', fontSize: '12px' }}>선택</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={F.label}>날짜 / 시간</label>
                                <input
                                    className="mtg-input"
                                    type="datetime-local"
                                    value={newMeeting.scheduled_at}
                                    onChange={e => setNewMeeting({ ...newMeeting, scheduled_at: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <label style={F.label}>소요 시간 <span style={{ color:'#9ca3af', fontWeight:400 }}>(참고용)</span></label>
                                <select
                                    className="mtg-input mtg-select"
                                    value={newMeeting.duration}
                                    onChange={e => setNewMeeting({ ...newMeeting, duration: e.target.value })}
                                >
                                    <option>15분</option>
                                    <option>30분</option>
                                    <option>45분</option>
                                    <option>1시간</option>
                                    <option>2시간</option>
                                </select>
                            </div>
                        </div>
                        <p style={F.hint}>⏱ 소요 시간은 표시용이며, 시간이 지나도 자동으로 종료되지 않습니다.</p>
                    </div>

                    {/* 안내 */}
                    <div style={F.infoBox}>
                        <Icons.Video className="sm" />
                        <span>회의방이 생성되면 팀원들이 목록에서 바로 입장할 수 있습니다.</span>
                    </div>

                    {/* 버튼 */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                        <button style={F.cancelBtn} onClick={() => setShowModal(false)}>취소</button>
                        <button
                            style={F.submitBtn(loading || !newMeeting.title.trim())}
                            onClick={addMeeting}
                            disabled={loading || !newMeeting.title.trim()}
                        >
                            {loading ? '생성 중...' : '🎥  회의 만들기'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}

const F = {
    section: {
        background: '#f8fafc',
        border: '1.5px solid #e9edf3',
        borderRadius: '12px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    sectionHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '2px',
    },
    sectionNum: {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: '#3b82f6',
        color: '#fff',
        fontSize: '11px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        lineHeight: '20px',
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: '13px',
        fontWeight: '700',
        color: '#1a1d23',
        flex: 1,
    },
    label: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#6b7280',
    },
    hint: {
        margin: 0,
        fontSize: '11px',
        color: '#9ca3af',
        lineHeight: '1.5',
    },
    infoBox: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 14px',
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '8px',
        fontSize: '12px',
        color: '#2563eb',
    },
    cancelBtn: {
        padding: '10px 20px',
        borderRadius: '8px',
        border: '1.5px solid #e5e7eb',
        background: '#fff',
        color: '#374151',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer',
    },
    submitBtn: (disabled) => ({
        padding: '10px 22px',
        borderRadius: '8px',
        border: 'none',
        background: disabled ? '#e5e7eb' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
        color: disabled ? '#9ca3af' : '#fff',
        fontSize: '13px',
        fontWeight: '700',
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: disabled ? 'none' : '0 4px 12px rgba(59,130,246,0.3)',
        transition: 'all 0.15s',
    }),
};

export default MeetingSection;
