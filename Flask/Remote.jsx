import { useState, useEffect } from "react";
import axios from "axios";

const API = "https://xxxx.trycloudflare.com"; // Cloudflare Tunnel URL로 교체

export default function RemoteDesktop() {
  const [status, setStatus] = useState("stopped"); // stopped | starting | running
  const [sysInfo, setSysInfo] = useState(null);
  const token = localStorage.getItem("token");

  const headers = { Authorization: `Bearer ${token}` };

  // PC 시스템 정보 주기적 갱신
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await axios.get(`${API}/api/system/info`, { headers });
        setSysInfo(res.data);
      } catch {}
    };
    fetchInfo();
    const interval = setInterval(fetchInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  // 원격 접속 상태 확인
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await axios.get(`${API}/api/remote/status`, { headers });
        setStatus(res.data.running ? "running" : "stopped");
      } catch {}
    };
    checkStatus();
  }, []);

  const startRemote = async () => {
    setStatus("starting");
    try {
      await axios.post(`${API}/api/remote/start`, {}, { headers });
      setStatus("running");
    } catch {
      setStatus("stopped");
      alert("원격 접속 시작 실패");
    }
  };

  const stopRemote = async () => {
    await axios.post(`${API}/api/remote/stop`, {}, { headers });
    setStatus("stopped");
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>🖥️ 원격 PC 접속</h2>

      {/* PC 시스템 정보 */}
      {sysInfo && (
        <div style={styles.infoRow}>
          <InfoCard label="CPU" value={`${sysInfo.cpu}%`} />
          <InfoCard label="메모리" value={`${sysInfo.memory}%`} />
          <InfoCard label="디스크" value={`${sysInfo.disk}%`} />
        </div>
      )}

      {/* 접속 제어 버튼 */}
      <div style={styles.btnRow}>
        {status === "stopped" && (
          <button style={styles.btnStart} onClick={startRemote}>
            원격 접속 시작
          </button>
        )}
        {status === "starting" && (
          <button style={styles.btnDisabled} disabled>
            연결 중...
          </button>
        )}
        {status === "running" && (
          <button style={styles.btnStop} onClick={stopRemote}>
            접속 종료
          </button>
        )}
        <span style={styles.statusBadge(status)}>
          {status === "stopped" ? "● 연결 안됨" : status === "starting" ? "● 연결 중" : "● 연결됨"}
        </span>
      </div>

      {/* noVNC 화면 */}
      {status === "running" && (
        <iframe
          src={`${API.replace('https', 'http').replace('5000', '6080')}/vnc.html?autoconnect=true&resize=scale`}
          style={styles.iframe}
          title="Remote Desktop"
        />
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
  container: {
    padding: "24px",
    fontFamily: "sans-serif",
    maxWidth: "1000px",
    margin: "0 auto",
  },
  title: { fontSize: "20px", marginBottom: "20px" },
  infoRow: { display: "flex", gap: "12px", marginBottom: "20px" },
  infoCard: {
    flex: 1, background: "#f5f5f5", borderRadius: "8px",
    padding: "14px", textAlign: "center",
  },
  infoLabel: { fontSize: "12px", color: "#888", marginBottom: "4px" },
  infoValue: { fontSize: "22px", fontWeight: "700" },
  btnRow: { display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" },
  btnStart: {
    padding: "10px 24px", background: "#2C5F2E", color: "#fff",
    border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px",
  },
  btnStop: {
    padding: "10px 24px", background: "#C0392B", color: "#fff",
    border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px",
  },
  btnDisabled: {
    padding: "10px 24px", background: "#aaa", color: "#fff",
    border: "none", borderRadius: "8px", fontSize: "14px",
  },
  statusBadge: (status) => ({
    fontSize: "13px",
    color: status === "running" ? "#2C5F2E" : status === "starting" ? "#C17D3C" : "#aaa",
  }),
  iframe: {
    width: "100%", height: "600px",
    border: "1px solid #ddd", borderRadius: "8px",
  },
};
