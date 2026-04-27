import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Icons from './Icons';

const API = 'http://localhost:5000';

const STUN = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

function PeerVideo({ peer }) {
    const ref = useRef(null);

    useEffect(() => {
        if (ref.current && peer.stream) {
            ref.current.srcObject = peer.stream;
        }
    }, [peer.stream]);

    return (
        <div style={S.tile}>
            {peer.stream
                ? <video ref={ref} autoPlay playsInline style={S.video} />
                : <div style={S.noVideo}><span style={S.avatar}>{(peer.user_name || '?')[0]}</span></div>
            }
            <div style={S.tileName}>{peer.user_name || '참여자'}</div>
        </div>
    );
}

function MeetingRoom({ room, onLeave }) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const [peers, setPeers] = useState({});
    const [micOn, setMicOn] = useState(true);
    const [camOn, setCamOn] = useState(true);
    const [elapsed, setElapsed] = useState(0);

    const localVideoRef = useRef(null);
    const localStreamRef = useRef(null);
    const socketRef = useRef(null);
    const peerConnsRef = useRef({});
    const peerNamesRef = useRef({});
    const timerRef = useRef(null);

    const createPeerConn = (sid) => {
        const pc = new RTCPeerConnection(STUN);
        peerConnsRef.current[sid] = pc;

        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track =>
                pc.addTrack(track, localStreamRef.current)
            );
        }

        pc.ontrack = ({ streams }) => {
            setPeers(prev => ({
                ...prev,
                [sid]: { ...prev[sid], stream: streams[0] },
            }));
        };

        pc.onicecandidate = ({ candidate }) => {
            if (candidate && socketRef.current) {
                socketRef.current.emit('ice-candidate', { to: sid, candidate });
            }
        };

        return pc;
    };

    const removePeer = (sid) => {
        if (peerConnsRef.current[sid]) {
            peerConnsRef.current[sid].close();
            delete peerConnsRef.current[sid];
        }
        delete peerNamesRef.current[sid];
        setPeers(prev => {
            const next = { ...prev };
            delete next[sid];
            return next;
        });
    };

    useEffect(() => {
        let mounted = true;

        const init = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
                localStreamRef.current = stream;
                if (localVideoRef.current) localVideoRef.current.srcObject = stream;
            } catch (err) {
                console.warn('카메라/마이크 권한 없음:', err.message);
            }

            if (!mounted) return;

            const socket = io(API, { transports: ['websocket', 'polling'] });
            socketRef.current = socket;

            socket.on('connect', () => {
                socket.emit('join-room', {
                    room_id: room.room_id,
                    user_id: user.employee_id,
                    user_name: user.name || '참여자',
                });
            });

            // 기존 참여자 목록 수신 → 각각에게 offer 전송 (내가 initiator)
            socket.on('room-users', async (users) => {
                for (const u of users) {
                    peerNamesRef.current[u.socket_id] = { user_name: u.user_name, user_id: u.user_id };
                    setPeers(prev => ({
                        ...prev,
                        [u.socket_id]: { stream: null, user_name: u.user_name, user_id: u.user_id },
                    }));

                    const pc = createPeerConn(u.socket_id);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socket.emit('offer', { to: u.socket_id, offer });
                }
            });

            // 새 참여자 입장 알림 → 이름만 저장, offer를 기다림
            socket.on('user-joined', ({ socket_id, user_name, user_id }) => {
                peerNamesRef.current[socket_id] = { user_name, user_id };
                setPeers(prev => ({
                    ...prev,
                    [socket_id]: { stream: null, user_name, user_id },
                }));
            });

            // offer 수신 → answer 생성 (내가 responder)
            socket.on('offer', async ({ from, offer }) => {
                const info = peerNamesRef.current[from] || {};
                if (!peerConnsRef.current[from]) {
                    createPeerConn(from);
                    setPeers(prev => prev[from] ? prev : {
                        ...prev,
                        [from]: { stream: null, user_name: info.user_name || '참여자', user_id: info.user_id },
                    });
                }
                const pc = peerConnsRef.current[from];
                await pc.setRemoteDescription(new RTCSessionDescription(offer));
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { to: from, answer });
            });

            // answer 수신
            socket.on('answer', async ({ from, answer }) => {
                const pc = peerConnsRef.current[from];
                if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
            });

            // ICE candidate 수신
            socket.on('ice-candidate', async ({ from, candidate }) => {
                const pc = peerConnsRef.current[from];
                if (pc && candidate) {
                    try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
                }
            });

            // 참여자 퇴장
            socket.on('user-left', ({ socket_id }) => removePeer(socket_id));
        };

        init();
        timerRef.current = setInterval(() => setElapsed(p => p + 1), 1000);

        return () => {
            mounted = false;
            clearInterval(timerRef.current);
            if (socketRef.current) {
                socketRef.current.emit('leave-room', { room_id: room.room_id });
                socketRef.current.disconnect();
            }
            Object.values(peerConnsRef.current).forEach(pc => pc.close());
            localStreamRef.current?.getTracks().forEach(t => t.stop());
        };
    }, []);

    const toggleMic = () => {
        localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !micOn; });
        setMicOn(p => !p);
    };

    const toggleCam = () => {
        localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !camOn; });
        setCamOn(p => !p);
    };

    const handleLeave = () => {
        clearInterval(timerRef.current);
        if (socketRef.current) {
            socketRef.current.emit('leave-room', { room_id: room.room_id });
            socketRef.current.disconnect();
        }
        Object.values(peerConnsRef.current).forEach(pc => pc.close());
        localStreamRef.current?.getTracks().forEach(t => t.stop());
        onLeave();
    };

    const fmt = (s) => {
        const h = String(Math.floor(s / 3600)).padStart(2, '0');
        const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
        const sec = String(s % 60).padStart(2, '0');
        return `${h}:${m}:${sec}`;
    };

    const peerList = Object.entries(peers);
    const total = 1 + peerList.length;
    const cols = total <= 1 ? 1 : total <= 4 ? 2 : 3;

    return (
        <div style={S.room}>
            <div style={S.header}>
                <h2 style={S.title}>{room.title}</h2>
                <div style={S.liveBadge}>
                    <span style={S.liveDot} />
                    진행 중 &nbsp;{fmt(elapsed)}
                </div>
                <span style={S.count}>{total}명 참여 중</span>
            </div>

            <div style={{ ...S.grid, gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
                <div style={S.tile}>
                    <video ref={localVideoRef} autoPlay muted playsInline style={S.video} />
                    {!camOn && (
                        <div style={S.noVideo}>
                            <span style={S.avatar}>{(user.name || '나')[0]}</span>
                        </div>
                    )}
                    <div style={S.tileName}>{user.name || '나'} (나)</div>
                </div>

                {peerList.map(([sid, peer]) => (
                    <PeerVideo key={sid} peer={peer} />
                ))}
            </div>

            <div style={S.controls}>
                <button style={S.ctrlBtn(micOn)} onClick={toggleMic}>
                    {micOn ? <Icons.Mic /> : <Icons.MicOff />}
                    <span style={S.ctrlLabel}>{micOn ? '음소거' : '음소거 해제'}</span>
                </button>
                <button style={S.ctrlBtn(camOn)} onClick={toggleCam}>
                    {camOn ? <Icons.Video /> : <Icons.VideoOff />}
                    <span style={S.ctrlLabel}>{camOn ? '카메라 끄기' : '카메라 켜기'}</span>
                </button>
                <button style={S.leaveBtn} onClick={handleLeave}>
                    <Icons.Phone />
                    <span style={S.ctrlLabel}>나가기</span>
                </button>
            </div>
        </div>
    );
}

const S = {
    room: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#0d1117',
        borderRadius: '16px',
        overflow: 'hidden',
        padding: '20px',
        gap: '16px',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        flexShrink: 0,
    },
    title: {
        color: '#fff',
        fontSize: '18px',
        fontWeight: '700',
        margin: 0,
    },
    liveBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        background: '#1e2329',
        border: '1px solid #ef4444',
        borderRadius: '6px',
        padding: '4px 10px',
        color: '#ef4444',
        fontSize: '12px',
        fontWeight: '600',
    },
    liveDot: {
        width: '6px',
        height: '6px',
        borderRadius: '50%',
        background: '#ef4444',
        display: 'inline-block',
        animation: 'blink 1.2s ease-in-out infinite',
    },
    count: {
        color: '#8b8fa8',
        fontSize: '13px',
        marginLeft: 'auto',
    },
    grid: {
        flex: 1,
        display: 'grid',
        gap: '12px',
        minHeight: 0,
    },
    tile: {
        position: 'relative',
        background: '#1e2329',
        borderRadius: '12px',
        overflow: 'hidden',
        aspectRatio: '16/9',
    },
    video: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        display: 'block',
    },
    noVideo: {
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1e2329',
    },
    avatar: {
        width: '64px',
        height: '64px',
        borderRadius: '50%',
        background: '#3b82f6',
        color: '#fff',
        fontSize: '28px',
        fontWeight: '700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        lineHeight: '64px',
        textAlign: 'center',
    },
    tileName: {
        position: 'absolute',
        bottom: '8px',
        left: '10px',
        color: '#fff',
        fontSize: '12px',
        fontWeight: '600',
        background: 'rgba(0,0,0,0.55)',
        padding: '2px 8px',
        borderRadius: '4px',
    },
    controls: {
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        flexShrink: 0,
    },
    ctrlBtn: (on) => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '12px 20px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        background: on ? '#1e2329' : '#374151',
        color: on ? '#fff' : '#9ca3af',
        transition: 'all 0.15s',
    }),
    leaveBtn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        padding: '12px 28px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        background: '#ef4444',
        color: '#fff',
        transition: 'all 0.15s',
    },
    ctrlLabel: {
        fontSize: '11px',
        fontWeight: '600',
    },
};

export default MeetingRoom;
