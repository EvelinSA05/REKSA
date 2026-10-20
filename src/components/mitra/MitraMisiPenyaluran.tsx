import { useState } from "react";
import { MisiItem, apiService } from "../../services/api";
import { AppIcon } from "../common/Icons";
import { MissionLiveTrackingMap } from "../common/MissionLiveTrackingMap";

interface MitraMisiPenyaluranProps {
  misiList: MisiItem[];
  userOrg?: string;
  userName?: string;
  onRefresh?: () => Promise<void> | void;
  notify?: (msg: string) => void;
  onNavigateToHistory: () => void;
  onNavigateToBursa: () => void;
}

export function MitraMisiPenyaluran({
  misiList,
  userOrg = "Satgas BPBD / Mitra Kemanusiaan",
  userName = "Arif Nugroho",
  onRefresh,
  notify,
  onNavigateToHistory,
  onNavigateToBursa,
}: MitraMisiPenyaluranProps) {
  const activeMissions = misiList.filter((m) => m.status_tahapan !== "Selesai");

  const [selectedMisiId, setSelectedMisiId] = useState<number | null>(
    activeMissions[0]?.id || null
  );

  // Obstacle reporting modal
  const [obstacleModalMisi, setObstacleModalMisi] = useState<MisiItem | null>(null);
  const [obstacleType, setObstacleType] = useState("Akses Jalan Terputus (Longsor)");
  const [obstacleNotes, setObstacleNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const currentMission = activeMissions.find((m) => m.id === selectedMisiId) || activeMissions[0];

  const states = [
    { title: "Menunggu Persiapan", desc: "Pengecekan logistik" },
    { title: "Siap Berangkat", desc: "Armada siaga" },
    { title: "Dalam Perjalanan", desc: "Menuju lokasi" },
    { title: "Tiba di Lokasi & Diserahkan", desc: "Penyaluran fisik" },
    { title: "Menunggu Konfirmasi", desc: "Verifikasi penerimaan" },
  ];

  const getStepIndex = (status: string) => {
    if (status === "Diterima" || status === "Baru") return 0;
    if (status === "Disiapkan") return 1;
    if (status === "Dalam Pengiriman") return 2;
    if (status === "Tiba di Lokasi" || status === "Tiba di Lokasi & Diserahkan") return 3;
    if (status === "Menunggu Konfirmasi Penerimaan") return 4;
    const idx = states.findIndex((s) => s.title === status);
    return idx >= 0 ? idx : 0;
  };

  const handleAdvanceStep = async (misi: MisiItem) => {
    try {
      setIsUpdating(true);
      const res = await apiService.advanceMisiStep(misi.id);
      if (res.success) {
        notify?.(`Tahapan misi ${misi.kode_misi} diperbarui ke '${res.data.status_tahapan}'!`);
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal memperbarui tahapan misi.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleConfirmFinalReceipt = async (misi: MisiItem) => {
    try {
      setIsUpdating(true);
      const res = await apiService.confirmReceiptKebutuhan(misi.kebutuhan_id, {
        diterima_volume: misi.muatan,
        catatan: "Dikonfirmasi serah terima tuntas oleh pelaksana armada di lokasi bencana.",
      });
      if (res.success) {
        notify?.(`Misi penyaluran ${misi.kode_misi} berhasil diselesaikan tuntas! Kasus resmi selesai.`);
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal mengonfirmasi serah terima tuntas.");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReportObstacle = async () => {
    if (!obstacleModalMisi) return;
    try {
      setIsUpdating(true);
      const res = await apiService.reportObstacleMisi(obstacleModalMisi.id, {
        status_kendala: obstacleType,
        catatan_lapangan: obstacleNotes,
      });
      if (res.success) {
        notify?.(`Kendala lapangan [${obstacleType}] berhasil dilaporkan ke Posko!`);
        setObstacleModalMisi(null);
        setObstacleNotes("");
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal mengirimkan laporan kendala.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (activeMissions.length === 0) {
    return (
      <main className="workspace mitra-tasks-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
        <div className="workspace-title" style={{ marginBottom: "24px" }}>
          <div>
            <span className="eyebrow" style={{ color: "#80866e", letterSpacing: "0.06em", fontWeight: 700 }}>
              OPERASIONAL LOGISTIK LAPANGAN
            </span>
            <h1 style={{ fontSize: "1.75rem", color: "#013220", fontWeight: 800, margin: "4px 0 8px" }}>
              Misi Penyaluran Aktif
            </h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "0.92rem" }}>
              Tidak ada surat tugas misi penyaluran aktif yang sedang berjalan saat ini.
            </p>
          </div>
        </div>

        <div className="reksa-empty-state" style={{ background: "#ffffff", borderRadius: "16px", padding: "48px 24px", border: "1px solid rgba(1, 50, 32, 0.1)", textAlign: "center" }}>
          <div className="reksa-empty-icon" style={{ background: "#f0fdf4", color: "#013220", width: "56px", height: "56px", borderRadius: "50%", margin: "0 auto 16px", display: "grid", placeItems: "center" }}>
            <AppIcon name="truck" size={28} />
          </div>
          <h3 className="reksa-empty-title" style={{ fontSize: "1.2rem", color: "#013220", fontWeight: 800, margin: "0 0 6px" }}>
            Semua Misi Telah Selesai Tuntas
          </h3>
          <p className="reksa-empty-desc" style={{ color: "#64748b", fontSize: "0.88rem", maxWidth: "520px", margin: "0 auto 20px" }}>
            Organisasi Anda belum memiliki misi distribusi yang sedang berjalan. Ajukan komitmen bantuan pada Bursa Bantuan Terbuka untuk mendapatkan penugasan resmi dari Posko BPBD.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="reksa-btn reksa-btn-primary"
              onClick={onNavigateToBursa}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                background: "#013220",
                color: "#ffffff",
                fontWeight: 700,
                padding: "10px 18px",
                borderRadius: "10px",
                border: "none",
                cursor: "pointer",
              }}
            >
              <span>Buka Bursa Bantuan Terbuka</span>
              <AppIcon name="arrow-right" size={15} />
            </button>
            <button
              type="button"
              className="reksa-btn reksa-btn-secondary"
              onClick={onNavigateToHistory}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "10px",
                border: "1.5px solid rgba(1, 50, 32, 0.2)",
                color: "#013220",
                fontWeight: 700,
                background: "#ffffff",
                cursor: "pointer",
              }}
            >
              <span>Lihat Riwayat Selesai</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  const currentIdx = getStepIndex(currentMission?.status_tahapan || "");

  return (
    <main className="workspace mitra-tasks-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
      {/* 1. HEADER SECTION */}
      <div className="workspace-title" style={{ marginBottom: "22px" }}>
        <div>
          <span className="eyebrow" style={{ color: "#80866e", letterSpacing: "0.06em", fontWeight: 700 }}>
            PELAKSANAAN OPERASIONAL LOGISTIK
          </span>
          <h1 style={{ fontSize: "1.75rem", color: "#013220", fontWeight: 800, margin: "4px 0 8px" }}>
            Konsol Misi Penyaluran Lapangan
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.92rem", maxWidth: "780px" }}>
            Perbarui tahapan pergerakan armada secara real-time, laporkan hambatan rute bila ada kendala, dan tuntaskan serah terima logistik di titik tujuan.
          </p>
        </div>
        <button
          type="button"
          className="reksa-btn reksa-btn-secondary"
          onClick={onNavigateToHistory}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#ffffff",
            border: "1.5px solid rgba(1, 50, 32, 0.2)",
            color: "#013220",
            fontWeight: 700,
            padding: "10px 18px",
            borderRadius: "10px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.03)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span>Riwayat Selesai</span>
          <AppIcon name="arrow-right" size={14} />
        </button>
      </div>

      {/* 2. STATISTIC METRIC CARDS (MONOCHROME) */}
      <div className="posko-metrics-grid-4" style={{ marginBottom: "24px" }}>
        {/* Card 1: Misi Aktif */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Misi Aktif
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="truck" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {activeMissions.length} Misi
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Armada bergerak di lapangan
          </small>
        </div>

        {/* Card 2: Tahapan Terkini */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Tahapan Terkini
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="clock" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            Tahap {currentIdx + 1} / 5
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {states[currentIdx]?.title || "Dalam proses"}
          </small>
        </div>

        {/* Card 3: Muatan Distribusi */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Muatan Aktif
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="box" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {currentMission.muatan}
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {currentMission.armada_info || "Armada Mitra"}
          </small>
        </div>

        {/* Card 4: Status Hambatan */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Kendala Terlapor
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="alert-triangle" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {activeMissions.filter((m) => m.status_kendala).length} Kendala
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            {currentMission.status_kendala ? "Ada laporan jalur" : "Rute operasional lancar"}
          </small>
        </div>
      </div>

      {/* 3. MISSION SELECTOR TABS (if multiple active missions) */}
      {activeMissions.length > 1 && (
        <div className="cases-pill-filters" style={{ marginBottom: "20px" }}>
          {activeMissions.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`case-filter-btn ${m.id === currentMission.id ? "active" : ""}`}
              onClick={() => setSelectedMisiId(m.id)}
            >
              {m.kode_misi} ({m.muatan})
            </button>
          ))}
        </div>
      )}

      {/* 4. ACTIVE MISSION CONSOLE CARD */}
      <div
        className="reksa-card"
        style={{
          padding: "28px",
          background: "#ffffff",
          borderRadius: "18px",
          border: currentMission.status_kendala
            ? "1.5px solid #fca5a5"
            : "1px solid rgba(1, 50, 32, 0.12)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Header Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  color: "#013220",
                  fontFamily: "monospace",
                  background: "#f1f5f9",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  letterSpacing: "0.02em",
                }}
              >
                {currentMission.kode_misi}
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  background: "#f0fdf4",
                  color: "#15803d",
                  border: "1px solid #bbf7d0",
                }}
              >
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                <span>Tahap: {currentMission.status_tahapan || "Diterima"}</span>
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", margin: "4px 0 12px" }}>
              <h2 style={{ margin: 0, fontSize: "1.35rem", color: "#013220", fontWeight: 800 }}>
                Muatan Distribusi:
              </h2>
              <span
                style={{
                  fontSize: "1.05rem",
                  fontWeight: 800,
                  color: "#15803d",
                  background: "#f0fdf4",
                  padding: "3px 12px",
                  borderRadius: "8px",
                  border: "1px solid #bbf7d0",
                }}
              >
                {currentMission.muatan}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="reksa-btn"
            onClick={() => {
              setObstacleModalMisi(currentMission);
              setObstacleType("Akses Jalan Terputus (Longsor)");
              setObstacleNotes("");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 16px",
              borderRadius: "10px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <AppIcon name="alert" size={15} />
            <span>Laporkan Kendala Lapangan</span>
          </button>
        </div>

        {/* Structured Mission Metadata Box */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "14px 24px",
            padding: "14px 18px",
            background: "#f8fafc",
            borderRadius: "12px",
            border: "1px solid #f1f5f9",
            marginBottom: "22px",
            fontSize: "0.84rem",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <AppIcon name="truck" size={15} style={{ color: "#15803d" }} />
            <span style={{ color: "#64748b" }}>Armada:</span>
            <strong style={{ color: "#0f172a" }}>{currentMission.armada_info || "Armada Logistik"}</strong>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <AppIcon name="user" size={15} style={{ color: "#15803d" }} />
            <span style={{ color: "#64748b" }}>Petugas PIC:</span>
            <strong style={{ color: "#0f172a" }}>{currentMission.responder_name || userName}</strong>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <AppIcon name="users" size={15} style={{ color: "#15803d" }} />
            <span style={{ color: "#64748b" }}>Satgas / Mitra:</span>
            <strong style={{ color: "#0f172a" }}>{currentMission.organisasi || userOrg}</strong>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <AppIcon name="pin" size={15} style={{ color: "#15803d" }} />
            <span style={{ color: "#64748b" }}>Tujuan Distribusi:</span>
            <strong style={{ color: "#0f172a" }}>
              {currentMission.kebutuhan ? `${currentMission.kebutuhan.citizen_name || 'Keluarga Penerima'} (${currentMission.kebutuhan.desa || 'Desa Terdampak'}, Kec. ${currentMission.kebutuhan.kecamatan || 'Sidoarjo'})` : 'Titik Lokasi Warga Bencana'}
            </strong>
          </div>
        </div>

        {/* Obstacle Alert Banner if active */}
        {currentMission.status_kendala && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              padding: "14px 18px",
              marginBottom: "22px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              color: "#991b1b",
              fontSize: "0.88rem",
            }}
          >
            <div style={{ marginTop: "2px", flexShrink: 0 }}>
              <AppIcon name="alert" size={18} />
            </div>
            <div>
              <strong style={{ display: "block", color: "#991b1b" }}>
                KENDALA TERLAPOR: [{currentMission.status_kendala}]
              </strong>
              <p style={{ margin: "4px 0 0", color: "#7f1d1d", fontSize: "0.84rem" }}>
                {currentMission.catatan_lapangan}
              </p>
            </div>
          </div>
        )}

        {/* REAL-TIME GIS FLEET TRACKING MAP & TELEMETRY */}
        <div style={{ marginBottom: "26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AppIcon name="map" size={16} style={{ color: "#013220" }} />
              <label style={{ fontSize: "0.82rem", fontWeight: 800, color: "#013220", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Peta Pelacakan Real-Time Armada Logistik
              </label>
            </div>
            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
              Memantau pergerakan armada secara langsung dari Posko BPBD ke lokasi warga
            </span>
          </div>

          <MissionLiveTrackingMap
            mission={currentMission}
            height="420px"
            onReportObstacle={() => {
              setObstacleModalMisi(currentMission);
              setObstacleType("Akses Jalan Terputus (Longsor)");
              setObstacleNotes("");
            }}
          />
        </div>

        {/* 5-STAGE PROGRESSION TRACKER */}
        <div style={{ marginBottom: "26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tahapan Status Operasional Armada (5 Tahap):
            </label>
            <span style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: 600 }}>
              Tahap {currentIdx + 1} dari 5 Selesai
            </span>
          </div>

          <div className="stage-tracker-grid">
            {states.map((s, i) => {
              const isDone = i <= currentIdx;
              const isCurrent = i === currentIdx;

              return (
                <div
                  key={s.title}
                  className={`stage-tracker-card ${isCurrent ? "current" : isDone ? "done" : ""}`}
                  style={{
                    background: isCurrent ? "#f0fdf4" : isDone ? "#f8fafc" : "#ffffff",
                    border: isCurrent
                      ? "2px solid #013220"
                      : isDone
                      ? "1px solid #86efac"
                      : "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "14px 12px",
                    textAlign: "center",
                    transition: "all 0.15s ease",
                    boxShadow: isCurrent ? "0 2px 8px rgba(1, 50, 32, 0.08)" : "none",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: isDone ? "#013220" : "#e2e8f0",
                      color: isDone ? "#ffffff" : "#64748b",
                      fontSize: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 8px",
                      fontWeight: 700,
                    }}
                  >
                    {isDone ? <AppIcon name="check" size={14} /> : i + 1}
                  </div>
                  <strong style={{ display: "block", fontSize: "0.82rem", color: isCurrent ? "#013220" : "#334155", lineHeight: 1.3, marginBottom: "3px" }}>
                    {s.title}
                  </strong>
                  <span style={{ display: "block", fontSize: "0.72rem", color: "#64748b", lineHeight: 1.2 }}>
                    {s.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTION CONTROLS FOOTER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            paddingTop: "20px",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <div style={{ fontSize: "0.86rem", color: "#64748b", maxWidth: "560px" }}>
            {currentIdx < 3 ? (
              <span>Klik tombol aksi begitu armada siap bergerak atau telah menyelesaikan tahapan saat ini.</span>
            ) : currentIdx === 3 ? (
              <span style={{ color: "#b45309", fontWeight: 600 }}>
                Logistik telah diserahkan di lokasi. Siap beralih ke konfirmasi penerimaan fisik terukur.
              </span>
            ) : (
              <span style={{ color: "#15803d", fontWeight: 600 }}>
                Logistik telah tiba dan siap dituntaskan dengan penandatanganan serah terima.
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {currentIdx < 4 && (
              <button
                type="button"
                className="reksa-btn reksa-btn-primary"
                disabled={isUpdating}
                onClick={() => handleAdvanceStep(currentMission)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#013220",
                  color: "#ffffff",
                  fontWeight: 700,
                  padding: "10px 22px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  opacity: isUpdating ? 0.7 : 1,
                  boxShadow: "0 2px 8px rgba(1, 50, 32, 0.15)",
                }}
              >
                <span>
                  {isUpdating
                    ? "Menyimpan..."
                    : currentIdx === 0
                    ? "Armada Siap Berangkat"
                    : currentIdx === 1
                    ? "Mulai Perjalanan Menuju Lokasi"
                    : currentIdx === 2
                    ? "Tiba di Lokasi & Serahkan Bantuan"
                    : "Ajukan Menunggu Konfirmasi"}
                </span>
                <AppIcon name="arrow-right" size={14} />
              </button>
            )}

            {(currentIdx === 3 || currentIdx === 4) && (
              <button
                type="button"
                className="reksa-btn reksa-btn-success"
                disabled={isUpdating}
                onClick={() => handleConfirmFinalReceipt(currentMission)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#15803d",
                  color: "#ffffff",
                  fontWeight: 700,
                  padding: "10px 22px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  opacity: isUpdating ? 0.7 : 1,
                  boxShadow: "0 2px 8px rgba(21, 128, 61, 0.2)",
                }}
              >
                <AppIcon name="check" size={15} />
                <span>{isUpdating ? "Memproses..." : "Konfirmasi Serah Terima Selesai Tuntas"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* OBSTACLE MODAL */}
      {obstacleModalMisi && (
        <div className="modal-backdrop" onClick={() => setObstacleModalMisi(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(560px, 95%)",
              textAlign: "left",
              borderRadius: "20px",
              padding: "28px 32px",
              background: "#ffffff",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
              position: "relative",
              border: "1px solid rgba(185, 28, 28, 0.15)",
            }}
          >
            {/* CLOSE BUTTON IN TOP RIGHT CORNER */}
            <button
              type="button"
              onClick={() => setObstacleModalMisi(null)}
              style={{
                position: "absolute",
                top: "20px",
                right: "20px",
                background: "#f1f5f9",
                border: "none",
                borderRadius: "50%",
                cursor: "pointer",
                color: "#64748b",
                width: "36px",
                height: "36px",
                display: "grid",
                placeItems: "center",
                transition: "all 0.15s ease",
                zIndex: 10,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#e2e8f0";
                e.currentTarget.style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#f1f5f9";
                e.currentTarget.style.color = "#64748b";
              }}
              title="Tutup dialog"
            >
              <AppIcon name="x" size={18} />
            </button>

            {/* HEADER */}
            <div style={{ marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", paddingRight: "46px" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#b91c1c", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                LAPORAN SITUASI DARURAT LAPANGAN
              </span>
              <h2 style={{ fontSize: "1.3rem", color: "#b91c1c", margin: 0, fontWeight: 800 }}>
                Kendala Lapangan: {obstacleModalMisi.kode_misi}
              </h2>
            </div>

            <p style={{ color: "#64748b", fontSize: "0.86rem", marginBottom: "18px", lineHeight: 1.4 }}>
              Posko Koordinator BPBD akan segera menerima laporan ini untuk melakukan koordinasi penyesuaian rute atau pengiriman bantuan darurat.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Kategori Kendala:
                </label>
                <select
                  value={obstacleType}
                  onChange={(e) => setObstacleType(e.target.value)}
                  className="reksa-input-field"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "0.88rem" }}
                >
                  <option value="Akses Jalan Terputus (Longsor)">Akses Jalan Terputus (Longsor / Jembatan Rusak)</option>
                  <option value="Kerusakan Armada / Kendaraan Mogok">Kerusakan Armada / Kendaraan Mogok / Pecah Ban</option>
                  <option value="Keterlambatan Akibat Cuaca Ekstrem">Keterlambatan Akibat Cuaca Ekstrem / Hujan Badai</option>
                  <option value="Perubahan Volume di Titik Kumpul">Perubahan Volume / Kondisi Logistik di Titik Kumpul</option>
                  <option value="Kendala Keamanan atau Jalur Evakuasi">Kendala Keamanan atau Jalur Evakuasi</option>
                  <option value="Lainnya">Kendala Operasional Lainnya</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Rincian &amp; Tindakan Mitigasi Lapangan:
                </label>
                <textarea
                  rows={4}
                  value={obstacleNotes}
                  onChange={(e) => setObstacleNotes(e.target.value)}
                  placeholder="Contoh: Jalur utama tertutup longsor, armada memutar via rute alternatif. Estimasi waktu kedatangan tertunda 40 menit."
                  className="reksa-textarea-field"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "0.88rem", resize: "vertical" }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: "10px",
                marginTop: "24px",
                borderTop: "1px solid #f1f5f9",
                paddingTop: "18px",
              }}
            >
              <button
                type="button"
                className="reksa-btn reksa-btn-secondary"
                disabled={isUpdating}
                onClick={() => setObstacleModalMisi(null)}
                style={{ padding: "8px 18px", borderRadius: "8px", fontWeight: 600 }}
              >
                Batal
              </button>
              <button
                type="button"
                className="reksa-btn reksa-btn-danger"
                disabled={isUpdating || !obstacleNotes.trim()}
                onClick={handleReportObstacle}
                style={{
                  background: "#b91c1c",
                  color: "#ffffff",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  cursor: isUpdating || !obstacleNotes.trim() ? "not-allowed" : "pointer",
                  opacity: isUpdating || !obstacleNotes.trim() ? 0.6 : 1,
                  border: "none",
                }}
              >
                <AppIcon name="alert" size={15} />
                <span>{isUpdating ? "Mengirimkan..." : "Kirim Laporan Kendala"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
