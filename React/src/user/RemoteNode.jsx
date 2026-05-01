import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function RemoteNode() {
  const [myPc, setMyPc]                 = useState(null);
  const [selectedPcId, setSelectedPcId] = useState('');
  const [approvalState, setApprovalState] = useState('idle'); // idle | pending | approved | rejected
  const [requestId, setRequestId]       = useState(null);

  const [status, setStatus]       = useState("stopped");
  const selfStopped = useRef(false);
  const [sysInfo, setSysInfo]     = useState(null);
  const [novncUrl, setNovncUrl]   = useState(null);
  const [tab, setTab]             = useState("remote");
  const [pcPath, setPcPath]       = useState("C:\\");
  const [pcFiles, setPcFiles]     = useState([]);
  const [dragOver, setDragOver]   = useState(false);
  const [uploading, setUploading] = useState(false);

  const token      = localStorage.getItem("token");
  const headers    = { Authorization: `Bearer ${token}` };
  const user       = JSON.parse(localStorage.getItem('user') || '{}');
  const employeeId = user.employee_id || null;

  // 내 PC 로드
  useEffect(() => {
    if (!employeeId) return;
    axios.get(`/manage/pc/mine?employee_id=${employeeId}`, { headers })
      .then(res => {
        if (res.data.pc) {
          setMyPc(res.data.pc);
          setSelectedPcId(res.data.pc.pc_id);
        }
      }).catch(() => {});
  }, [employeeId]);

  // noVNC URL 로드
  useEffect(() => {
    axios.get("/api/urls").then(res => setNovncUrl(res.data.novnc)).catch(() => {});
  }, []);

  // 승인 폴링
  useEffect(() => {
    if (approvalState !== 'pending' || !requestId) return;
    const poll = setInterval(async () => {
      try {
        const res = await axios.get(`/manage/remote/request/status?request_id=${requestId}`);
        if (res.data.status === 'approved') setApprovalState('approved');
        else if (res.data.status === 'rejected') setApprovalState('rejected');
      } catch {}
    }, 3000);
    return () => clearInterval(poll);
  }, [approvalState, requestId]);

  // 관리자 강제 종료 감지 (승인 후)
  useEffect(() => {
    if (approvalState !== 'approved' || !requestId) return;
    const poll = setInterval(async () => {
      try {
        const res = await axios.get(`/manage/remote/request/status?request_id=${requestId}`);
        if (res.data.disconnected_at && !selfStopped.current) {
          clearInterval(poll);
          setStatus("stopped");
          setApprovalState('idle');
          setRequestId(null);
          alert('관리자에 의해 원격 접속이 종료되었습니다.');
        }
      } catch {}
    }, 5000);
    return () => clearInterval(poll);
  }, [approvalState, requestId]);

  // 시스템 정보 (승인 후)
  useEffect(() => {
    if (approvalState !== 'approved') return;
    const fetchInfo = async () => {
      try {
        const res = await axios.get("/api/system/info", { headers });
        setSysInfo(res.data);
      } catch {}
    };
    fetchInfo();
    const interval = setInterval(fetchInfo, 5000);
    return () => clearInterval(interval);
  }, [approvalState]);

  // 원격 상태 확인 (승인 후)
  useEffect(() => {
    if (approvalState !== 'approved') return;
    axios.get("/api/remote/status", { headers })
      .then(res => setStatus(res.data.running ? "running" : "stopped"))
      .catch(() => {});
  }, [approvalState]);

  const requestAccess = async () => {
    if (!selectedPcId) { alert('PC를 선택해주세요'); return; }
    try {
      const res = await axios.post('/manage/remote/request', { employee_id: employeeId, pc_id: selectedPcId }, { headers });
      setRequestId(res.data.request_id);
      setApprovalState('pending');
    } catch { alert('접속 요청 실패'); }
  };

  const startRemote = async () => {
    selfStopped.current = false;
    setStatus("starting");
    try {
      if (requestId) {
        await axios.post("/manage/remote/reconnect", { request_id: requestId }, { headers }).catch(() => {});
      }
      await axios.post("/api/remote/start", { employee_id: employeeId }, { headers });
      setStatus("running");
    } catch (err) {
      setStatus("stopped");
      alert(err.response?.status === 403 ? "관리자 승인이 필요합니다" : "원격 접속 시작 실패");
    }
  };

  const stopRemote = async () => {
    selfStopped.current = true;
    await axios.post("/api/remote/stop", { employee_id: employeeId }, { headers });
    if (requestId) {
      await axios.post("/manage/remote/disconnect", { request_id: requestId }, { headers }).catch(() => {});
    }
    setStatus("stopped");
  };

  const fetchPcFiles = async (path) => {
    try {
      const res = await axios.get("/api/pc/files", { params: { path } });
      setPcFiles(res.data.files);
      setPcPath(res.data.current_path);
    } catch { alert("파일 목록 불러오기 실패"); }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post("/api/pc/upload", formData, { params: { path: pcPath } });
      alert(file.name + " 업로드 완료");
      fetchPcFiles(pcPath);
    } catch { alert("업로드 실패"); }
    setUploading(false);
  };

  const goUp = () => {
    const parts = pcPath.replace(/\\/g, "/").split("/").filter(Boolean);
    if (parts.length <= 1) return;
    parts.pop();
    fetchPcFiles(parts.join("\\") + "\\");
  };

  // === PC 선택 화면 ===
  if (approvalState === 'idle') return (
    <div className="content-wrapper">
      <div className="welcome-section"><h1>원격 PC 접속</h1></div>
      <div style={styles.approvalBox}>
        {myPc ? (
          <>
            <p style={styles.approvalTitle}>내 PC에 원격 접속을 요청합니다.</p>
            <div style={styles.pcInfo}>
              <span>PC 이름: <strong>{myPc.pc_name}</strong></span>
              <span>IP: <strong>{myPc.ip_address}</strong></span>
            </div>
            <button style={styles.btnStart} onClick={requestAccess}>접속 요청</button>
          </>
        ) : (
          <p style={{ color: '#888', fontSize: 14 }}>등록된 PC가 없습니다. 관리자에게 문의하세요.</p>
        )}
      </div>
    </div>
  );

  // === 승인 대기 화면 ===
  if (approvalState === 'pending') return (
    <div className="content-wrapper">
      <div className="welcome-section"><h1>원격 PC 접속</h1></div>
      <div style={styles.approvalBox}>
        <p style={styles.approvalTitle}>⏳ 관리자 승인 대기 중...</p>
        <p style={{ color: '#888', fontSize: 14 }}>관리자가 승인하면 자동으로 진행됩니다.</p>
        <button style={styles.btnSm} onClick={() => { setApprovalState('idle'); setRequestId(null); }}>취소</button>
      </div>
    </div>
  );

  // === 거절 화면 ===
  if (approvalState === 'rejected') return (
    <div className="content-wrapper">
      <div className="welcome-section"><h1>원격 PC 접속</h1></div>
      <div style={styles.approvalBox}>
        <p style={styles.approvalTitle}>❌ 접속 요청이 거절되었습니다.</p>
        <button style={styles.btnStart} onClick={() => { setApprovalState('idle'); setRequestId(null); }}>다시 요청</button>
      </div>
    </div>
  );

  // === 승인 후 원격 접속 화면 ===
  return (
    <div className="content-wrapper">
      <div className="welcome-section"><h1>원격 PC 접속</h1></div>

      {sysInfo && (
        <div style={styles.infoRow}>
          <InfoCard label="CPU"    value={`${sysInfo.cpu}%`}    />
          <InfoCard label="메모리" value={`${sysInfo.memory}%`} />
          <InfoCard label="디스크" value={`${sysInfo.disk}%`}   />
        </div>
      )}

      <div style={styles.tabRow}>
        <button style={styles.tab(tab === "remote")} onClick={() => setTab("remote")}>원격 접속</button>
        <button style={styles.tab(tab === "files")}  onClick={() => { setTab("files"); fetchPcFiles(pcPath); }}>파일 전송</button>
      </div>

      {tab === "remote" && (
        <div>
          <div style={styles.btnRow}>
            {status === "stopped"  && <button style={styles.btnStart}    onClick={startRemote}>원격 접속 시작</button>}
            {status === "starting" && <button style={styles.btnDisabled} disabled>연결 중...</button>}
            {status === "running"  && <button style={styles.btnStop}     onClick={stopRemote}>접속 종료</button>}
            <span style={styles.statusBadge(status)}>
              {status === "stopped" ? "● 연결 안됨" : status === "starting" ? "● 연결 중" : "● 연결됨"}
            </span>
          </div>
          {status === "running" && novncUrl && (
            <iframe src={`${novncUrl}/vnc.html?autoconnect=true&resize=scale`} style={styles.iframe} title="Remote Desktop" />
          )}
        </div>
      )}

      {tab === "files" && (
        <div style={styles.fileLayout}>
          <div style={styles.filePanel}>
            <div style={styles.panelTitle}>RPi 파일을 PC로 업로드</div>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{ border: "2px dashed #2C5F2E", borderRadius: 8, padding: 40, textAlign: "center",
                background: dragOver ? "#d4e8d4" : "#f0f7f0", color: "#2C5F2E", fontSize: 14, cursor: "pointer" }}
            >
              {uploading ? "업로드 중..." : dragOver ? "놓으면 업로드!" : "RPi 파일을 여기에 드래그"}
            </div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>저장 위치 (PC): {pcPath}</div>
          </div>

          <div style={styles.filePanel}>
            <div style={styles.panelTitle}>PC 파일을 RPi로 다운로드</div>
            <div style={styles.pathBar}>
              <button style={styles.btnSm} onClick={goUp}>상위 폴더</button>
              <span style={styles.pathText}>{pcPath}</span>
            </div>
            <div style={styles.fileList}>
              {pcFiles.sort((a, b) => b.is_dir - a.is_dir).map(f => (
                <div key={f.path} style={styles.fileItem}>
                  <span style={{ cursor: f.is_dir ? "pointer" : "default", flex: 1 }} onClick={() => f.is_dir && fetchPcFiles(f.path)}>
                    {f.is_dir ? "📁" : "📄"} {f.name}
                  </span>
                  {!f.is_dir && <span style={{ fontSize: 11, color: "#888", marginRight: 8 }}>{(f.size / 1024).toFixed(1)} KB</span>}
                  {!f.is_dir && (
                    <a href={`/api/pc/download?path=${encodeURIComponent(f.path)}`} download style={{ textDecoration: "none", fontSize: 13 }}>
                      다운로드
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const InfoCard = ({ label, value }) => (
  <div style={styles.infoCard}>
    <div style={styles.infoLabel}>{label}</div>
    <div style={styles.infoValue}>{value}</div>
  </div>
);

const styles = {
  approvalBox:  { textAlign: 'center', padding: '40px 20px', border: '1px solid #eee', borderRadius: 8, maxWidth: 400, margin: '0 auto' },
  approvalTitle:{ fontSize: 18, fontWeight: 600, marginBottom: 20 },
  pcInfo:       { display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20, fontSize: 14, color: '#555' },
  infoRow:      { display: "flex", gap: "12px", marginBottom: "20px" },
  infoCard:     { flex: 1, background: "#f5f5f5", borderRadius: "8px", padding: "14px", textAlign: "center" },
  infoLabel:    { fontSize: "12px", color: "#888", marginBottom: "4px" },
  infoValue:    { fontSize: "22px", fontWeight: "700" },
  tabRow:       { display: "flex", gap: "8px", marginBottom: "20px" },
  tab: (active) => ({
    padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
    background: active ? "#2C5F2E" : "#f0f0f0",
    color: active ? "#fff" : "#333", fontWeight: active ? 600 : 400,
  }),
  btnRow:       { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  btnStart:     { padding: "10px 24px", background: "#2C5F2E", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  btnStop:      { padding: "10px 24px", background: "#C0392B", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px" },
  btnDisabled:  { padding: "10px 24px", background: "#aaa", color: "#fff", border: "none", borderRadius: "8px", fontSize: "14px" },
  btnSm:        { padding: "4px 10px", fontSize: "12px", border: "1px solid #ddd", borderRadius: "4px", cursor: "pointer", background: "#f5f5f5" },
  statusBadge:  (status) => ({ fontSize: "13px", color: status === "running" ? "#2C5F2E" : status === "starting" ? "#C17D3C" : "#aaa" }),
  iframe:       { width: "100%", height: "600px", border: "1px solid #ddd", borderRadius: "8px" },
  fileLayout:   { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" },
  filePanel:    { border: "1px solid #ddd", borderRadius: "8px", padding: "16px" },
  panelTitle:   { fontSize: "14px", fontWeight: 600, marginBottom: "12px" },
  pathBar:      { display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" },
  pathText:     { fontSize: "12px", color: "#555", fontFamily: "monospace", wordBreak: "break-all" },
  fileList:     { maxHeight: "400px", overflowY: "auto", border: "1px solid #eee", borderRadius: "6px" },
  fileItem:     { display: "flex", alignItems: "center", padding: "8px 12px", borderBottom: "1px solid #eee", fontSize: "13px" },
};
