import { useState } from "react";
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
        action={<div className="trust-badge"><Icon name="check" /> Terhubung ke Posko BPBD</div>} 
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

      {/* 2. REKAPITULASI KEBUTUHAN - SEMUA LAPORAN ANDA */}
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
                  style={isClarification ? { borderColor: "#f59e0b", background: "#fffdf5" } : undefined}
                >
                  <div className="all-case-card-header">
                    <span className="all-case-code">{c.id}</span>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {isClarification && (
                        <span style={{ fontSize: "0.74rem", background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                          ⚠️ Klarifikasi
                        </span>
                      )}
                      <Pill tone={isCritical ? "critical" : isHigh ? "high" : "medium"}>{c.urgency}</Pill>
                    </div>
                  </div>

                  <div className="all-case-card-content">
                    <div className="all-case-main-info">
                      <div className="all-case-photo-thumb">
                        <img 
                          src={getFieldEvidencePhoto(c.item, c.fotoBukti)} 
                          alt={c.item} 
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1593113598332-cd288d649433?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&q=80";
                          }}
                        />
                      </div>
                      <div className="all-case-text-details">
                        <h4>{c.item}</h4>
                        <div className="all-case-location">
                          <Icon name="pin" />
                          <span>{c.location} · {c.kk}</span>
                        </div>
                      </div>
                    </div>

                    <div className="all-case-metrics">
                      <div className="metric-box">
                        <small>Jumlah Diminta</small>
                        <strong>{c.qty}</strong>
                      </div>
                      <div className="metric-box">
                        <small>Tanggal Lapor</small>
                        <span>{c.date || "Hari ini"}</span>
                      </div>
                    </div>

                    {isClarification && (
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", padding: "8px 10px", marginTop: "8px", fontSize: "0.8rem", color: "#92400e" }}>
                        <strong>Petugas BPBD:</strong> "{c.pertanyaanKlarifikasi || "Mohon berikan rincian data tambahan."}"
                      </div>
                    )}

                    <div className="all-case-progress-wrap" style={{ marginTop: "12px" }}>
                      <div className="progress-labels">
                        <span>Status Alur</span>
                        <span className="status-name">{c.status}</span>
                      </div>
                      <Progress value={cPercent} />
                    </div>
                  </div>

                  <div className="all-case-card-footer">
                    <div className="case-status-indicator">
                      <i className={`status-dot ${isDone ? "done" : isClarification ? "warning" : "active"}`} style={isClarification ? { background: "#f59e0b" } : undefined} />
                      <span>{c.status}</span>
                    </div>
                    {isClarification ? (
                      <button 
                        className="btn-case-action" 
                        onClick={() => setClarificationModalCase(c)}
                        style={{ background: "#b45309", color: "#ffffff", border: "none", fontWeight: 700, padding: "6px 12px", borderRadius: "8px" }}
                      >
                        Respon <Icon name="next" />
                      </button>
                    ) : (
                      <button 
                        className="btn-case-action" 
                        onClick={() => { update({ activeCaseId: c.id }); setPage("case"); }}
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
