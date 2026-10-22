import { useState, useEffect, useMemo } from "react";
import {
  CaseRecord,
  SharedState,
  RouterProps,
  PortalPage,
  PageHead,
  Icon,
  Button,
  Pill,
  Progress,
  getCaseProgress,
  getFieldEvidencePhoto,
} from "../../App";
import { CitizenClarificationModal } from "./CitizenClarificationModal";
import { MissionLiveTrackingMap } from "../common/MissionLiveTrackingMap";
import { PetaSebaranPenanganan } from "./PetaSebaranPenanganan";
import { PersBaranResponBantuan } from "./PersBaranResponBantuan";
import { AppIcon } from "../common/Icons";
import { MisiItem, apiService } from "../../services/api";

interface CitizenDashboardProps {
  state: SharedState;
  update: RouterProps["update"];
  setPage: RouterProps["setPage"];
  name: string;
}

export function CitizenDashboard({ state, update, setPage, name }: CitizenDashboardProps) {
  const [selectedQuick, setSelectedQuick] = useState(0);
  const [clarificationModalCase, setClarificationModalCase] = useState<CaseRecord | null>(null);
  
  const currentCases = (state.casesList || []).filter(
    (c) => Boolean(c.isOwn && !c.id.startsWith("RK-UJI-") && !c.id.includes("TEST"))
  );
  const hasCases = currentCases.length > 0;
  const clarificationCases = currentCases.filter((c) => c.status === "Perlu Klarifikasi");

  // Real-time logistic tracking missions for citizen
  const [localMisiList, setLocalMisiList] = useState<MisiItem[]>(state.misiList || []);
  const [selectedMisiId, setSelectedMisiId] = useState<number | null>(null);

  useEffect(() => {
    if (state.misiList && state.misiList.length > 0) {
      setLocalMisiList(state.misiList);
    } else {
      apiService
        .getMisi()
        .then((res) => {
          if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
            setLocalMisiList(res.data);
          }
        })
        .catch(() => {});
    }
  }, [state.misiList]);

  // Determine which missions belong to this citizen or should be tracked
  const displayMissions = useMemo(() => {
    const allMissions = localMisiList.length > 0 ? localMisiList : (state.misiList || []);
    if (allMissions.length === 0) return [];

    const citizenCaseIds = currentCases.map((c) => c.id);
    const citizenMatched = allMissions.filter((m) => {
      const matchName =
        m.kebutuhan?.citizen_name &&
        name &&
        (m.kebutuhan.citizen_name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(m.kebutuhan.citizen_name.toLowerCase()));
      const matchCase = m.kebutuhan?.kode_kasus && citizenCaseIds.includes(m.kebutuhan.kode_kasus);
      return matchName || matchCase;
    });

    if (citizenMatched.length > 0) {
      const active = citizenMatched.filter((m) => m.status_tahapan !== "Selesai");
      const done = citizenMatched.filter((m) => m.status_tahapan === "Selesai");
      return active.length > 0 ? [...active, ...done] : citizenMatched;
    }

    const activeAll = allMissions.filter((m) => m.status_tahapan !== "Selesai");
    return activeAll.length > 0 ? activeAll : allMissions;
  }, [localMisiList, state.misiList, currentCases, name]);

  const currentMission = useMemo(() => {
    if (displayMissions.length === 0) return null;
    if (selectedMisiId) {
      const found = displayMissions.find((m) => m.id === selectedMisiId);
      if (found) return found;
    }
    return displayMissions[0];
  }, [displayMissions, selectedMisiId]);

  const quickItems = [
    { 
      icon: "plus", 
      title: "Buat Laporan", 
      copy: "Sampaikan kebutuhan darurat pascabencana.", 
      page: "report" as PortalPage,
      badge: "Utama"
    },
    { 
      icon: "file", 
      title: "Laporan Saya", 
      copy: "Pantau alur verifikasi & penanganan posko.", 
      page: "cases" as PortalPage,
      badge: clarificationCases.length > 0
        ? `⚠️ ${clarificationCases.length} Klarifikasi`
        : hasCases
        ? `${currentCases.length} Aktif`
        : "0 Laporan"
    },
    { 
      icon: "help", 
      title: "Pusat Bantuan", 
      copy: "Temukan SOP layanan dan kontak bantuan.", 
      page: "help" as PortalPage,
      badge: "Panduan"
    }
  ];

  return (
    <main className="workspace citizen-home">
      <PageHead 
        eyebrow="Layanan masyarakat" 
        title={`Halo, ${name.split(" ")[0]}. Pantau perjalanan bantuanmu.`} 
        copy="Setiap laporan memiliki langkah berikutnya yang jelas hingga bantuan diterima." 
      />

      {/* CALLOUT KLARIFIKASI MENDESAK DARI BPBD */}
      {clarificationCases.length > 0 && (
        <section
          style={{
            background: "#fffbeb",
            border: "1.5px solid #f59e0b",
            borderRadius: "16px",
            padding: "20px 24px",
            marginBottom: "24px",
            boxShadow: "0 8px 24px rgba(245, 158, 11, 0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: "14px", maxWidth: "680px" }}>
            <div
              style={{
                width: "46px",
                height: "46px",
                borderRadius: "12px",
                background: "#fef3c7",
                color: "#b45309",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.4rem",
                flexShrink: 0,
                border: "1px solid #fde68a",
              }}
            >
              ⚠️
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <strong style={{ color: "#92400e", fontSize: "1.05rem" }}>
                  Tindakan Diperlukan: {clarificationCases.length} Laporan Memerlukan Klarifikasi Anda
                </strong>
                <span
                  style={{
                    fontSize: "0.75rem",
                    background: "#d97706",
                    color: "#ffffff",
                    padding: "2px 8px",
                    borderRadius: "6px",
                    fontWeight: 700,
                  }}
                >
                  Mendesak
                </span>
              </div>
              <p style={{ margin: "4px 0 0", color: "#78350f", fontSize: "0.88rem", lineHeight: 1.5 }}>
                Petugas Posko BPBD mengajukan instruksi klarifikasi untuk melengkapi data atau foto fisik lapangan sebelum kuota bantuan diverifikasi.
              </p>
              <div style={{ marginTop: "10px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {clarificationCases.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setClarificationModalCase(c)}
                    style={{
                      fontSize: "0.82rem",
                      background: "#ffffff",
                      border: "1px solid #f59e0b",
                      color: "#92400e",
                      padding: "4px 10px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    <span>💬 #{c.id} ({c.item})</span>
                    <span style={{ fontSize: "0.75rem", textDecoration: "underline", color: "#b45309" }}>Jawab &raquo;</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <Button
              onClick={() => {
                if (clarificationCases.length === 1) {
                  setClarificationModalCase(clarificationCases[0]);
                } else {
                  setPage("cases");
                }
              }}
              style={{
                background: "#b45309",
                color: "#ffffff",
                border: "none",
                fontWeight: 700,
                padding: "12px 20px",
                borderRadius: "10px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 4px 12px rgba(180, 83, 9, 0.25)",
              }}
            >
              <Icon name="check" />{" "}
              {clarificationCases.length === 1
                ? "Jawab Klarifikasi Sekarang"
                : "Buka Semua Kasus Klarifikasi"}
            </Button>
          </div>
        </section>
      )}

      {/* 1. DISASTER HERO BANNER */}
      <section className="citizen-disaster-banner">
        <img 
          src="/beranda-disaster-banner.jpg" 
          alt="Dokumentasi Operasi Kemanusiaan Pascabencana" 
          className="citizen-disaster-banner-bg" 
        />
        <div className="citizen-disaster-banner-overlay" />
        <div className="citizen-disaster-banner-content">
          <div className="citizen-disaster-banner-main">
            <h2>Tanggap Cepat Kebutuhan Logistik Warga</h2>
            <p>
              Sampaikan kebutuhan darurat keluarga Anda. Setiap laporan diteruskan langsung ke sistem komando Posko BPBD dan responder lapangan untuk verifikasi cepat dan distribusi terukur.
            </p>
            <div className="citizen-banner-action-row">
              <Button variant="light" onClick={() => setPage("report")}>
                <Icon name="plus" /> Buat Laporan Baru
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL-TIME LOGISTICS FLEET TRACKING MAP FOR CITIZEN */}
      {currentMission && (
        <section className="citizen-tracking-section" style={{ marginBottom: "32px" }}>
          <div
            className="section-title"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              flexWrap: "wrap",
              gap: "12px",
              marginBottom: "16px",
            }}
          >
            <div>
              <span className="eyebrow" style={{ color: "var(--forest, #013220)", fontWeight: 700, letterSpacing: "0.06em" }}>
                PELACAKAN LOGISTIK REAL-TIME
              </span>
              <h2
                style={{
                  fontSize: "1.45rem",
                  fontWeight: 800,
                  color: "var(--forest, #013220)",
                  margin: "4px 0 0",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <span>Peta Pelacakan Real-Time Armada Logistik</span>
                {currentMission.status_tahapan && (
                  <span
                    style={{
                      fontSize: "0.74rem",
                      fontWeight: 700,
                      padding: "3px 10px",
                      borderRadius: "999px",
                      background:
                        currentMission.status_tahapan === "Dalam Pengiriman"
                          ? "#dcfce7"
                          : currentMission.status_tahapan === "Tiba di Lokasi & Diserahkan"
                          ? "#e0e7ff"
                          : currentMission.status_tahapan === "Selesai"
                          ? "#f0fdf4"
                          : "#f1f5f9",
                      color:
                        currentMission.status_tahapan === "Dalam Pengiriman"
                          ? "#15803d"
                          : currentMission.status_tahapan === "Tiba di Lokasi & Diserahkan"
                          ? "#3730a3"
                          : currentMission.status_tahapan === "Selesai"
                          ? "#166534"
                          : "#475569",
                      border: "1px solid currentColor",
                    }}
                  >
                    {currentMission.status_tahapan}
                  </span>
                )}
              </h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "0.85rem" }}>
                Pemantauan pergerakan armada secara langsung dari posko ke titik warga.
              </p>
            </div>

            {/* Mission Selector Tabs (if more than 1 mission) */}
            {displayMissions.length > 1 && (
              <div 
                className="mission-selector-tabs"
                style={{ 
                  display: "flex", 
                  gap: "6px", 
                  overflowX: "auto", 
                  maxWidth: "100%", 
                  paddingBottom: "4px",
                  WebkitOverflowScrolling: "touch"
                }}
              >
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", alignSelf: "center", whiteSpace: "nowrap" }}>
                  Misi:
                </span>
                {displayMissions.map((m) => {
                  const isSel = m.id === currentMission.id;
                  const shortCode = (m.kode_misi || "Misi").replace(/^MISI-ASG-?/i, "Misi ");
                  let shortCategory = m.kebutuhan?.kategori_kebutuhan || m.muatan || "Bantuan";
                  if (shortCategory.includes("&")) {
                    shortCategory = shortCategory.split("&")[0].trim();
                  }
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMisiId(m.id)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "8px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        border: isSel ? "1.5px solid #013220" : "1px solid #cbd5e1",
                        background: isSel ? "#013220" : "#ffffff",
                        color: isSel ? "#ffffff" : "#334155",
                        whiteSpace: "nowrap",
                        flexShrink: 0,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {shortCode}: {shortCategory}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mission Route & Driver Meta Info Card (Responsive) */}
          <div className="mission-route-meta-card">
            <div className="mission-meta-route-group">
              <div className="mission-meta-item">
                <small>Posko Asal</small>
                <strong>
                  <AppIcon name="shield" size={14} style={{ color: "#013220", flexShrink: 0 }} />
                  <span>
                    {(currentMission.posko?.nama_posko || "Posko BPBD")
                      .replace(/\s*\(Komando Wilayah\)/gi, "")
                      .replace(/Provinsi\s*/gi, "")
                      .trim()}
                  </span>
                </strong>
              </div>

              <span className="mission-meta-arrow" style={{ display: "inline-flex", alignItems: "center" }}>
                <AppIcon name="arrow-right" size={13} style={{ color: "#94a3b8" }} />
              </span>

              <div className="mission-meta-item">
                <small>Tujuan Warga</small>
                <strong>
                  <AppIcon name="pin" size={14} style={{ color: "#b91c1c", flexShrink: 0 }} />
                  <span>
                    {currentMission.kebutuhan?.desa
                      ? `${currentMission.kebutuhan.desa}${currentMission.kebutuhan.kecamatan ? `, ${currentMission.kebutuhan.kecamatan}` : ""}`
                      : "Lokasi Pemohon"}
                  </span>
                </strong>
              </div>

              <span className="mission-meta-pipe" style={{ color: "#cbd5e1" }}>|</span>

              <div className="mission-meta-item">
                <small>Muatan</small>
                <strong>
                  <AppIcon name="box" size={14} style={{ color: "#047857", flexShrink: 0 }} />
                  <span>{currentMission.muatan || currentMission.kebutuhan?.kategori_kebutuhan || "Paket Bantuan"}</span>
                </strong>
              </div>
            </div>

            <div className="mission-meta-driver">
              <small>Pengemudi / Satgas</small>
              <strong style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <AppIcon name="user" size={14} style={{ color: "#475569", flexShrink: 0 }} />
                <span>{currentMission.responder_name || currentMission.organisasi || "Relawan Satgas Penyalur"}</span>
              </strong>
            </div>
          </div>

          <MissionLiveTrackingMap
            mission={currentMission}
            height="440px"
          />
        </section>
      )}

      {/* 3. REKAPITULASI KEBUTUHAN - SEMUA LAPORAN ANDA */}
      <section className="all-cases-overview-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">Rekapitulasi Kebutuhan</span>
            <h2>{hasCases ? `Semua Laporan Anda (${currentCases.length})` : "Laporan Kebutuhan Anda"}</h2>
          </div>
          {hasCases && (
            <button onClick={() => setPage("cases")}>
              Buka Manajemen Laporan <Icon name="next" />
            </button>
          )}
        </div>

        {hasCases ? (
          <div className="all-cases-grid">
            {currentCases.map((c) => {
              const cPercent = getCaseProgress(c.status);
              const isCritical = c.urgency === "Kritis" || c.urgency === "Sangat mendesak";
              const isHigh = c.urgency === "Tinggi" || c.urgency === "Perlu segera";
              const isDone = c.status === "Selesai";
              const isClarification = c.status === "Perlu Klarifikasi";

              return (
                <div 
                  className={`all-case-card ${isCritical ? "priority-critical" : ""}`} 
                  key={c.id}
                  style={isClarification ? { borderColor: "#f59e0b", background: "#fffdfa" } : undefined}
                >
                  <div className="case-card-header">
                    <div className="case-code-badge">{c.id}</div>
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                      {isClarification && (
                        <span style={{ fontSize: "0.74rem", background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                          ⚠️ Klarifikasi
                        </span>
                      )}
                      <Pill tone={isCritical ? "critical" : isHigh ? "high" : "medium"}>{c.urgency}</Pill>
                    </div>
                  </div>

                  <div className="case-card-body">
                    <div className="case-card-main-row">
                      <div className="case-photo-badge">
                        <img 
                          src={getFieldEvidencePhoto(c.item, c.fotoBukti)} 
                          alt={c.item} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1593113598332-cd288d649433?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&q=80";
                          }}
                        />
                      </div>
                      <div className="case-card-header-info">
                        <div className="case-item-name-row">
                          <h3 className="case-item-title">{c.item}</h3>
                          <span className="case-beneficiary-tag">
                            <Icon name="user" /> {c.kk}
                          </span>
                        </div>
                        <div className="case-card-location">
                          <Icon name="pin" />
                          <span className="case-location-text" title={c.location}>{c.location}</span>
                        </div>
                      </div>
                    </div>

                    {isClarification && (
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", padding: "10px 12px", marginBottom: "14px", fontSize: "0.82rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b45309", fontWeight: 700 }}>
                          <Icon name="check" /> Instruksi Posko BPBD:
                        </div>
                        <div style={{ color: "#78350f", marginTop: "3px", lineHeight: 1.4, fontWeight: 500 }}>
                          "{c.pertanyaanKlarifikasi || "Mohon berikan rincian data tambahan untuk laporan kebutuhan ini."}"
                        </div>
                      </div>
                    )}

                    <div className="case-card-quantity">
                      <div>
                        <small style={{ display: "block", fontSize: "0.72rem", color: "#616852", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: "2px" }}>
                          Volume Diminta
                        </small>
                        <strong style={{ fontSize: "1rem", color: "var(--forest)", fontWeight: 700 }}>
                          {c.qty}
                        </strong>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <small style={{ display: "block", fontSize: "0.72rem", color: "#616852", textTransform: "uppercase", letterSpacing: "0.04em", fontWeight: 600, marginBottom: "2px" }}>
                          Tanggal Lapor
                        </small>
                        <span style={{ fontSize: "0.85rem", color: "var(--forest)", fontWeight: 600 }}>
                          {c.date || "Hari ini"}
                        </span>
                      </div>
                    </div>

                    <div className="all-case-card-progress" style={{ margin: "14px 0 16px" }}>
                      <div className="card-progress-labels">
                        <span style={{ fontSize: "0.78rem", color: "#616852", fontWeight: 600 }}>Status Alur</span>
                        <strong style={{ fontSize: "0.8rem", color: isDone ? "#15803d" : "#013220", fontWeight: 700 }}>
                          {c.status} ({cPercent}%)
                        </strong>
                      </div>
                      <Progress value={cPercent} />
                    </div>
                  </div>

                  <div className="case-card-footer">
                    <div className="case-status-indicator">
                      <i className={`status-dot ${isDone ? "done" : isClarification ? "warning" : "active"}`} style={isClarification ? { background: "#f59e0b" } : undefined} />
                      <span style={{ fontSize: "0.82rem", fontWeight: 600, color: isClarification ? "#b45309" : "var(--forest)" }}>{c.status}</span>
                    </div>
                    {isClarification ? (
                      <button 
                        type="button"
                        className="btn-case-action" 
                        onClick={() => setClarificationModalCase(c)}
                        style={{ 
                          background: "#b45309", 
                          color: "#ffffff", 
                          border: "none", 
                          fontWeight: 700, 
                          padding: "7px 16px", 
                          borderRadius: "999px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.82rem",
                          boxShadow: "0 2px 8px rgba(180, 83, 9, 0.25)"
                        }}
                      >
                        Respon <Icon name="next" />
                      </button>
                    ) : (
                      <button 
                        type="button"
                        className="btn-case-action" 
                        onClick={() => { update({ activeCaseId: c.id }); setPage("case"); }}
                        style={{ 
                          background: "var(--forest)", 
                          color: "#ffffff", 
                          border: "none", 
                          fontWeight: 600, 
                          padding: "7px 18px", 
                          borderRadius: "999px",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.82rem",
                          boxShadow: "0 2px 8px rgba(1, 50, 32, 0.15)",
                          transition: "all 0.2s ease"
                        }}
                      >
                        Pantau <Icon name="next" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-overview-card">
            <div className="empty-icon-box"><Icon name="file" /></div>
            <h3>Belum Ada Laporan Aktif</h3>
            <p>Saat Anda menyampaikan kebutuhan mendesak, perjalanan bantuan dari posko hingga mitra responder akan terpantau lengkap di sini.</p>
            <Button onClick={() => setPage("report")} className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px", fontSize: "0.92rem", fontWeight: 600 }}>
              <Icon name="plus" /> Buat Laporan Kebutuhan Sekarang
            </Button>
          </div>
        )}
      </section>

      {/* 4. PETA SEBARAN DUA WARNA (CHOROPLETH) PENANGANAN MITRA & BPBD */}
      <PetaSebaranPenanganan
        cases={state.casesList}
        misiList={localMisiList}
      />

      {/* 5. RINGKASAN  (REAL DATA) */}
      <PersBaranResponBantuan
        cases={state.casesList}
        misiList={localMisiList}
      />

      {/* QUICK ACCESS SECTION */}
      <section className="quick-access">
        <div className="section-title">
          <div>
            <span className="eyebrow">Aksi Mandiri</span>
            <h2>Akses Cepat Layanan</h2>
          </div>
          <button onClick={() => setPage("cases")}>Lihat semua laporan <Icon name="next" /></button>
        </div>
        <div className="quick-access-grid">
          {quickItems.map((item, idx) => (
            <button 
              key={item.title} 
              className={`quick-card ${selectedQuick === idx ? "featured" : ""}`} 
              onMouseEnter={() => setSelectedQuick(idx)}
              onClick={() => { setSelectedQuick(idx); setPage(item.page); }}
            >
              <div className="quick-card-top">
                <div className="quick-icon-box">
                  <Icon name={item.icon} />
                </div>
                <span className="quick-badge">{item.badge}</span>
              </div>
              <div className="quick-card-body">
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
              <div className="quick-card-action">
                <span>Buka Layanan</span>
                <span className="quick-arrow"><Icon name="next" /></span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* REALTIME NOTIFICATIONS SECTION */}
      <section className="notifications-section">
        <div className="section-title">
          <div>
            <span className="eyebrow">Pembaruan Langsung</span>
            <h2>Notifikasi Terbaru</h2>
          </div>
          <button onClick={() => setPage("notifications")}>Lihat semua <Icon name="next" /></button>
        </div>
        
        <div className="notif-card-container">
          {hasCases ? (
            currentCases.slice(0, 3).map((c, idx) => {
              const notifTag = c.status === "Selesai"
                ? "Tuntas"
                : c.status === "Perlu Klarifikasi"
                ? "Klarifikasi Posko"
                : c.status === "Dalam Pengiriman"
                ? "Distribusi"
                : c.status === "Dalam Verifikasi"
                ? "Verifikasi Posko"
                : "Penyaluran";

              const notifText = c.status === "Perlu Klarifikasi"
                ? `Petugas Posko BPBD meminta klarifikasi untuk kebutuhan ${c.item} (${c.qty}). Segera berikan tanggapan.`
                : c.status === "Selesai" 
                ? `Penyaluran bantuan ${c.item} (${c.qty}) telah selesai diterima warga.`
                : c.status === "Dalam Pengiriman"
                ? `Armada responder sedang dalam perjalanan mendistribusikan ${c.item} (${c.qty}).`
                : c.status === "Dalam Verifikasi"
                ? `Laporan kebutuhan ${c.item} (${c.qty}) tercatat dan dalam proses verifikasi Posko BPBD.`
                : `Kebutuhan ${c.item} telah dipublikasikan ke mitra responder relawan.`;

              return (
                <button 
                  className={`notif-item ${idx === 0 || c.status === "Perlu Klarifikasi" ? "unread" : ""}`} 
                  onClick={() => {
                    if (c.status === "Perlu Klarifikasi") {
                      setClarificationModalCase(c);
                    } else {
                      update({ activeCaseId: c.id });
                      setPage("case");
                    }
                  }} 
                  key={c.id}
                >
                  <div className="notif-item-left">
                    <div className={`notif-icon-circle ${idx === 0 || c.status === "Perlu Klarifikasi" ? "new" : ""}`} style={c.status === "Perlu Klarifikasi" ? { background: "#fef3c7", color: "#b45309" } : undefined}>
                      <Icon name="bell" />
                      {(idx === 0 || c.status === "Perlu Klarifikasi") && <span className="notif-dot-pulse" style={c.status === "Perlu Klarifikasi" ? { background: "#f59e0b" } : undefined} />}
                    </div>
                    <div className="notif-item-content">
                      <div className="notif-header-line">
                        <span className="notif-tag" style={c.status === "Perlu Klarifikasi" ? { background: "#fef3c7", color: "#92400e" } : undefined}>{notifTag}</span>
                        <small>{c.date || "Hari ini"} · {c.id}</small>
                      </div>
                      <strong>{notifText}</strong>
                    </div>
                  </div>
                  <div className="notif-item-arrow">
                    <Icon name="next" />
                  </div>
                </button>
              );
            })
          ) : (
            <div style={{ padding: "28px", textAlign: "center", background: "#fbfbf8", border: "1px solid rgba(1,50,32,0.08)", borderRadius: "14px", color: "#6a7369" }}>
              <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>🔔</div>
              <strong>Belum Ada Notifikasi Baru</strong>
              <p style={{ margin: "4px 0 0", fontSize: "0.88rem" }}>Aktivitas dan pembaruan penanganan akan muncul otomatis saat ada laporan yang diproses.</p>
            </div>
          )}
        </div>
      </section>

      {/* CLARIFICATION RESPONSE MODAL */}
      {clarificationModalCase && (
        <CitizenClarificationModal
          caseData={clarificationModalCase}
          onClose={() => setClarificationModalCase(null)}
          onSuccess={(updated) => {
            const updatedCases = currentCases.map((c) => (c.id === updated.id ? updated : c));
            localStorage.setItem("reksa_cases_db", JSON.stringify(updatedCases));
            update(
              { casesList: updatedCases, status: "Dalam Verifikasi" },
              `Jawaban klarifikasi untuk kasus ${updated.id} berhasil dikirim ke Posko BPBD.`
            );
          }}
        />
      )}
    </main>
  );
}
