import { useState, useEffect } from "react";
import { CaseRecord } from "../../App";
import { MisiItem, apiService } from "../../services/api";
import { AppIcon } from "../common/Icons";
import { MissionLiveTrackingMap } from "../common/MissionLiveTrackingMap";
import { BastPrintModal } from "../common/BastPrintModal";

interface PoskoDistribusiPenerimaanProps {
  misiList: MisiItem[];
  cases: CaseRecord[];
  onRefresh?: () => Promise<void> | void;
  notify?: (msg: string) => void;
  onSelectCase: (c: CaseRecord) => void;
  selectedCaseId?: string;
}

export function PoskoDistribusiPenerimaan({
  misiList,
  cases,
  onRefresh,
  notify,
  onSelectCase,
  selectedCaseId,
}: PoskoDistribusiPenerimaanProps) {
  const [tab, setTab] = useState<"all" | "active" | "arrived" | "completed">("active");
  const [search, setSearch] = useState(selectedCaseId || "");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    if (selectedCaseId) {
      setSearch(selectedCaseId);
      const target = selectedCaseId.toLowerCase();
      const foundMisi = misiList.find(
        (m) =>
          m.kebutuhan?.kode_kasus?.toLowerCase() === target ||
          m.kode_misi?.toLowerCase() === target ||
          String(m.kebutuhan_id) === target.replace(/\D/g, "")
      );
      if (foundMisi) {
        if (foundMisi.status_tahapan === "Selesai") {
          setTab("completed");
        } else if (
          foundMisi.status_tahapan === "Tiba di Lokasi & Diserahkan" ||
          foundMisi.status_tahapan === "Menunggu Konfirmasi Penerimaan"
        ) {
          setTab("arrived");
        } else {
          setTab("active");
        }
      }
    }
  }, [selectedCaseId, misiList]);

  // Receipt confirmation modal
  const [confirmModalMisi, setConfirmModalMisi] = useState<MisiItem | null>(null);
  const [receivedVolumeInput, setReceivedVolumeInput] = useState("");
  const [confirmNotesInput, setConfirmNotesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live Fleet Tracking Modal
  const [trackingModalMisi, setTrackingModalMisi] = useState<MisiItem | null>(null);

  // Digital BAST Print/Download Modal
  const [selectedBastMisi, setSelectedBastMisi] = useState<MisiItem | null>(null);

  const activeMissions = misiList.filter((m) => m.status_tahapan !== "Selesai");
  const arrivedMissions = misiList.filter(
    (m) =>
      m.status_tahapan === "Tiba di Lokasi & Diserahkan" ||
      m.status_tahapan === "Menunggu Konfirmasi Penerimaan"
  );
  const completedMissions = misiList.filter((m) => m.status_tahapan === "Selesai");

  const statusTabs = [
    { id: "all" as const, label: "Semua Misi", count: misiList.length },
    { id: "active" as const, label: "Misi Aktif", count: activeMissions.length },
    { id: "arrived" as const, label: "Perlu Konfirmasi", count: arrivedMissions.length },
    { id: "completed" as const, label: "Selesai Diterima", count: completedMissions.length },
  ];

  const filteredMissions = misiList.filter((m) => {
    // Tab filter
    if (tab === "active" && m.status_tahapan === "Selesai") return false;
    if (tab === "arrived") {
      const isArr =
        m.status_tahapan === "Tiba di Lokasi & Diserahkan" ||
        m.status_tahapan === "Menunggu Konfirmasi Penerimaan";
      if (!isArr) return false;
    }
    if (tab === "completed" && m.status_tahapan !== "Selesai") return false;

    // Search query filter
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchKode = (m.kode_misi || "").toLowerCase().includes(q);
      const matchOrg = (m.organisasi || "").toLowerCase().includes(q);
      const matchResponder = (m.responder_name || "").toLowerCase().includes(q);
      const matchArmada = (m.armada_info || "").toLowerCase().includes(q);
      const matchMuatan = (m.muatan || "").toLowerCase().includes(q);
      const matchTujuan = (
        m.kebutuhan ? `${m.kebutuhan.desa || ""} ${m.kebutuhan.kecamatan || ""}` : ""
      )
        .toLowerCase()
        .includes(q);
      const matchKendala = (m.status_kendala || "").toLowerCase().includes(q);
      const matchCatatan = (m.catatan_lapangan || "").toLowerCase().includes(q);

      if (
        !matchKode &&
        !matchOrg &&
        !matchResponder &&
        !matchArmada &&
        !matchMuatan &&
        !matchTujuan &&
        !matchKendala &&
        !matchCatatan
      ) {
        return false;
      }
    }

    return true;
  });

  const totalItems = filteredMissions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedMissions = filteredMissions.slice(startIndex, endIndex);

  const openConfirmModal = (misi: MisiItem) => {
    setConfirmModalMisi(misi);
    setReceivedVolumeInput(misi.muatan);
    setConfirmNotesInput("Diterima tuntas oleh Koordinator Posko dan disaksikan perwakilan warga.");
  };

  const handleConfirmReceipt = async () => {
    if (!confirmModalMisi) return;
    try {
      setIsSubmitting(true);
      const res = await apiService.confirmReceiptKebutuhan(confirmModalMisi.kebutuhan_id, {
        diterima_volume: receivedVolumeInput || confirmModalMisi.muatan,
        catatan: confirmNotesInput,
      });

      if (res.success) {
        if (res.is_fully_fulfilled) {
          notify?.(`Penerimaan tuntas dikonfirmasi! Kasus resmi diselesaikan (RESOLVED).`);
        } else {
          notify?.(`Penerimaan parsial tercatat (${receivedVolumeInput}). Sisa kekurangan ${res.kekurangan_penerimaan || 0} tetap terbuka.`);
        }
        setConfirmModalMisi(null);
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal mengonfirmasi penerimaan bantuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="workspace posko-distribusi-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
      {/* Title bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <span className="eyebrow" style={{ color: "#80866e", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.78rem" }}>
            MONITORING LOGISTIK &amp; SERAH TERIMA FISIK
          </span>
          <h1 style={{ margin: "4px 0 6px", color: "#013220", fontSize: "1.75rem", fontWeight: 800 }}>
            Distribusi &amp; Penerimaan Lapangan
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem", maxWidth: "680px", lineHeight: 1.5 }}>
            Pantau misi pergerakan armada mitra di lapangan, tangani laporan kendala akses, dan lakukan konfirmasi penerimaan fisik terukur (BAST).
          </p>
        </div>
        <div className="posko-status-live-badge">
          <span className="live-indicator-dot" /> {activeMissions.length} Misi Penyaluran Aktif
        </div>
      </div>

      {/* REFINED 4-COLUMN STAT METRIC CARDS (Monochrome & Balanced) */}
      <div className="posko-metrics-grid-4">
        {/* Card 1: Total Misi */}
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
              Total Seluruh Misi
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="layers" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {misiList.length} Misi
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Surat Misi Penyaluran Terbit
          </small>
        </div>

        {/* Card 2: Sedang Bergerak */}
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
              Sedang Bergerak
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="truck" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {activeMissions.length} Armada
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Dalam Perjalanan ke Lokasi
          </small>
        </div>

        {/* Card 3: Perlu Konfirmasi */}
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
              Perlu Konfirmasi Fisik
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="clock" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {arrivedMissions.length} Misi
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Tiba &amp; Siap Serah Terima
          </small>
        </div>

        {/* Card 4: Selesai */}
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
              Selesai &amp; Rekonsiliasi
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="check" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {completedMissions.length} Misi
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Berita Acara (BAST) Sah
          </small>
        </div>
      </div>

      {/* 2-TIER FILTER TOOLBAR */}
      <div
        className="posko-filter-toolbar"
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          border: "1px solid rgba(1, 50, 32, 0.08)",
          boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
          marginBottom: "20px",
          overflow: "hidden",
        }}
      >
        {/* Row 1: Status Pills with Count Badges */}
        <div className="posko-toolbar-tabs">
          {statusTabs.map((tabItem) => {
            const isActive = tab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => {
                  setTab(tabItem.id);
                  setCurrentPage(1);
                }}
                className={`posko-tab-pill ${isActive ? "active" : ""}`}
              >
                <span>{tabItem.label}</span>
                <span className={`tab-count-badge ${isActive ? "badge-active" : ""}`}>
                  {tabItem.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Row 2: Search Input and Results Counter */}
        <div className="posko-toolbar-search-row">
          <div className="posko-search-input-wrap">
            <span className="posko-search-icon">
              <AppIcon name="search" size={15} />
            </span>
            <input
              type="text"
              placeholder="Cari berdasarkan kode misi, nama armada, organisasi, narahubung, muatan, atau tujuan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="posko-search-input"
            />
            {search && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="posko-search-clear-btn"
                title="Hapus kata kunci pencarian"
              >
                ×
              </button>
            )}
          </div>

          <div className="posko-search-meta">
            <span className="posko-search-count-text">
              Menampilkan <strong>{totalItems > 0 ? `${startIndex + 1}-${endIndex}` : 0}</strong> dari{" "}
              {misiList.length} misi
              {totalPages > 1 && ` (Halaman ${validPage}/${totalPages})`}
            </span>
            {search && (
              <span className="posko-search-query-tag">
                Filter: "{search}"
              </span>
            )}
          </div>
        </div>
      </div>

      {/* LIST OF MISSIONS */}
      {filteredMissions.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px dashed #cbd5e1",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: "rgba(1,50,32,0.06)",
              color: "#013220",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 12px",
            }}
          >
            <AppIcon name="truck" size={24} />
          </div>
          <h3 style={{ margin: "0 0 6px", color: "#013220", fontSize: "1.1rem", fontWeight: 700 }}>
            Tidak Ada Misi Penyaluran
          </h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem" }}>
            Belum ada armada mitra yang diberangkatkan atau tidak ada data yang sesuai dengan filter pencarian Anda.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {paginatedMissions.map((m) => {
            const isCompleted = m.status_tahapan === "Selesai";
            const isArrived =
              m.status_tahapan === "Tiba di Lokasi & Diserahkan" ||
              m.status_tahapan === "Menunggu Konfirmasi Penerimaan";
            const hasObstacle = Boolean(m.status_kendala);

            const matchedCase = cases.find(
              (c) =>
                c.id === m.kebutuhan?.kode_kasus ||
                c.id === `RK-${m.kebutuhan_id}` ||
                c.id === `RK-2026-000${m.kebutuhan_id}`
            );

            const statusClass = isCompleted
              ? "status-verified"
              : isArrived
              ? "status-clarify"
              : "status-pending";

            return (
              <div
                key={m.id}
                className="posko-case-card"
                style={{
                  border: hasObstacle
                    ? "1px solid #fecaca"
                    : isCompleted
                    ? "1px solid #bbf7d0"
                    : isArrived
                    ? "1px solid #fde68a"
                    : "1px solid rgba(1, 50, 32, 0.12)",
                }}
              >
                {/* 1. Header Row */}
                <div className="posko-case-header-row">
                  <div className="posko-case-badges">
                    <span className="posko-case-id-badge">{m.kode_misi}</span>
                    <span className={`posko-case-status-badge ${statusClass}`}>
                      Tahapan: {m.status_tahapan}
                    </span>
                    {hasObstacle && (
                      <span className="posko-case-urgency-badge urgency-kritis">
                        ⚠️ Kendala Lapangan
                      </span>
                    )}
                  </div>

                  <div className="posko-case-date">
                    <AppIcon name="calendar" size={13} style={{ color: "#80866e" }} />
                    <span>{m.estimasi_waktu || "14 Okt 2026"}</span>
                  </div>
                </div>

                {/* 2. Title */}
                <div>
                  <h3 className="posko-case-title">
                    Muatan: {m.muatan} · {m.organisasi}
                  </h3>
                </div>

                {/* 3. Metadata Row */}
                <div className="posko-case-meta-row">
                  <span className="posko-case-meta-item">
                    <AppIcon name="user" size={13} style={{ color: "#80866e" }} />
                    <span>Narahubung Armada: <strong>{m.responder_name}</strong></span>
                  </span>
                  <span className="posko-case-meta-item">
                    <AppIcon name="truck" size={13} style={{ color: "#80866e" }} />
                    <span>Armada: <strong>{m.armada_info}</strong></span>
                  </span>
                  <span className="posko-case-meta-item">
                    <AppIcon name="pin" size={13} style={{ color: "#80866e" }} />
                    <span>Tujuan: <strong>{m.kebutuhan ? `${m.kebutuhan.desa || ''}, ${m.kebutuhan.kecamatan || ''}` : 'Posko Wilayah'}</strong></span>
                  </span>
                </div>

                {/* 4. Obstacle Alert Callout */}
                {hasObstacle && (
                  <div className="reksa-info-box alert-red" style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                    <AppIcon name="alert" size={16} style={{ color: "#dc2626", marginTop: "2px" }} />
                    <div>
                      <strong style={{ display: "block", marginBottom: "2px" }}>
                        LAPORAN KENDALA DARI ARMADA MITRA: [{m.status_kendala}]
                      </strong>
                      <p style={{ margin: 0, fontSize: "0.84rem" }}>{m.catatan_lapangan}</p>
                    </div>
                  </div>
                )}

                {/* 5. Telemetry Box */}
                <div className="posko-bursa-balance-box">
                  <div className="posko-bursa-balance-grid">
                    <div>
                      <span className="posko-bursa-metric-label">Tujuan Distribusi</span>
                      <strong className="posko-bursa-metric-val">
                        {m.kebutuhan ? `${m.kebutuhan.desa || ''}, ${m.kebutuhan.kecamatan || ''}` : 'Posko Lapangan'}
                      </strong>
                    </div>

                    <div>
                      <span className="posko-bursa-metric-label">Muatan Terkirim</span>
                      <strong className="posko-bursa-metric-val">{m.muatan}</strong>
                    </div>

                    <div>
                      <span className="posko-bursa-metric-label">Status Serah Terima</span>
                      <strong
                        className="posko-bursa-metric-val"
                        style={{ color: isCompleted ? "#15803d" : "#b45309" }}
                      >
                        {m.jumlah_diterima ? `${m.jumlah_diterima} (Sah)` : "Menunggu Serah Terima"}
                      </strong>
                    </div>

                    <div>
                      <span className="posko-bursa-metric-label">Selisih Fisik</span>
                      <strong
                        className="posko-bursa-metric-val"
                        style={{
                          color: m.selisih && m.selisih !== "0" ? "#dc2626" : "#15803d",
                        }}
                      >
                        {m.selisih ? m.selisih : "0 (Akurat Sesuai)"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 6. Dedicated Footer Action Bar */}
                <div className="posko-case-footer-row">
                  <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                    {matchedCase && (
                      <button
                        type="button"
                        className="btn-case-view"
                        onClick={() => onSelectCase(matchedCase)}
                        title="Buka dokumen detail dan pemeriksaan kasus warga"
                      >
                        <AppIcon name="file" size={14} />
                        <span>Detail Kasus Terkait</span>
                        <AppIcon name="arrow-right" size={13} />
                      </button>
                    )}

                    <button
                      type="button"
                      className="btn-case-view"
                      onClick={() => setTrackingModalMisi(m)}
                      title="Pantau posisi GPS armada logistik secara langsung di peta"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "7px",
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        color: "#15803d",
                        fontWeight: 700,
                      }}
                    >
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: isCompleted ? "#94a3b8" : "#16a34a",
                          boxShadow: isCompleted ? "none" : "0 0 6px #16a34a",
                          display: "inline-block",
                        }}
                      />
                      <AppIcon name="map" size={13} />
                      <span>Lacak GPS Armada</span>
                    </button>
                  </div>

                  <div className="posko-case-actions-cluster">
                    {!isCompleted ? (
                      <button
                        type="button"
                        className="btn-case-verify"
                        onClick={() => openConfirmModal(m)}
                        title="Konfirmasi serah terima fisik barang dan terbitkan BAST"
                      >
                        <AppIcon name="check" size={14} />
                        <span>Konfirmasi Penerimaan (BAST)</span>
                      </button>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span
                          className="posko-case-status-badge status-verified"
                          style={{ padding: "6px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <AppIcon name="check" size={13} />
                          <span>✓ Diterima Tuntas</span>
                        </span>
                        <button
                          type="button"
                          className="btn-bast-download"
                          onClick={() => setSelectedBastMisi(m)}
                          style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                          title="Cetak Berita Acara Serah Terima untuk arsip resmi BPBD"
                        >
                          <AppIcon name="file" size={13} />
                          <span>Cetak BAST Digital</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. Pagination Card */}
      {filteredMissions.length > 0 && (
        <div className="posko-pagination-card">
          <div className="posko-pagination-info">
            <span>
              Menampilkan <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> dari{" "}
              <strong>{totalItems}</strong> misi penyaluran
            </span>
            <span className="posko-pagination-limit-badge">Maks. {pageSize} data per halaman</span>
          </div>

          <div className="posko-pagination-controls">
            <button
              type="button"
              className="posko-page-nav-btn"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage(validPage - 1)}
              title="Halaman sebelumnya"
            >
              <span>&larr;</span> Sebelumnya
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`posko-page-num-btn ${p === validPage ? "active" : ""}`}
                onClick={() => setCurrentPage(p)}
                title={`Ke halaman ${p}`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              className="posko-page-nav-btn"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage(validPage + 1)}
              title="Halaman selanjutnya"
            >
              Selanjutnya <span>&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM RECEIPT MODAL */}
      {confirmModalMisi && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(500px, 95%)", textAlign: "left", borderRadius: "16px", padding: "26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "1.25rem", color: "#013220", margin: 0, fontWeight: 800 }}>
                Konfirmasi Penerimaan: {confirmModalMisi.kode_misi}
              </h2>
              <button
                type="button"
                onClick={() => setConfirmModalMisi(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
              >
                <AppIcon name="x" size={18} />
              </button>
            </div>

            <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "16px" }}>
              Armada: <strong>{confirmModalMisi.organisasi}</strong> · Muatan Dikirim: <strong>{confirmModalMisi.muatan}</strong>
            </p>

            <label className="reksa-form-label">
              Jumlah Aktual yang Dikonfirmasi Diterima:
            </label>
            <input
              type="text"
              value={receivedVolumeInput}
              onChange={(e) => setReceivedVolumeInput(e.target.value)}
              placeholder="Contoh: 500 L atau 380 Paket"
              className="reksa-input-field"
              style={{ marginBottom: "14px" }}
            />

            <label className="reksa-form-label">
              Catatan Berita Acara Penerimaan (Koordinator Posko / Warga):
            </label>
            <textarea
              rows={3}
              value={confirmNotesInput}
              onChange={(e) => setConfirmNotesInput(e.target.value)}
              placeholder="Contoh: Bantuan diterima fisik dalam kondisi baik, disaksikan perwakilan RT."
              className="reksa-textarea-field"
              style={{ marginBottom: "18px" }}
            />

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "12px" }}>
              <button
                type="button"
                className="btn-case-view"
                disabled={isSubmitting}
                onClick={() => setConfirmModalMisi(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-case-verify"
                disabled={isSubmitting}
                onClick={handleConfirmReceipt}
              >
                {isSubmitting ? "Menyimpan..." : "Konfirmasi & Rekonsiliasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LIVE FLEET TRACKING MODAL */}
      {trackingModalMisi && (
        <div className="modal-backdrop" onClick={() => setTrackingModalMisi(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(960px, 96%)",
              maxWidth: "960px",
              textAlign: "left",
              borderRadius: "20px",
              padding: "24px",
              background: "#ffffff",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
              position: "relative",
              border: "1px solid rgba(1, 50, 32, 0.15)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setTrackingModalMisi(null)}
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
            >
              <AppIcon name="x" size={18} />
            </button>

            <div style={{ marginBottom: "16px", paddingRight: "44px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "4px" }}>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    color: "#013220",
                    background: "#f1f5f9",
                    padding: "3px 10px",
                    borderRadius: "6px",
                  }}
                >
                  {trackingModalMisi.kode_misi}
                </span>
                <span
                  style={{
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: "9999px",
                    background: "#f0fdf4",
                    color: "#15803d",
                    border: "1px solid #bbf7d0",
                  }}
                >
                  Tahapan: {trackingModalMisi.status_tahapan}
                </span>
              </div>
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#013220", margin: "4px 0" }}>
                Pelacakan Real-Time Armada: {trackingModalMisi.armada_info}
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.86rem", margin: 0 }}>
                Muatan: <strong style={{ color: "#0f172a" }}>{trackingModalMisi.muatan}</strong> · Mitra:{" "}
                <strong style={{ color: "#0f172a" }}>{trackingModalMisi.organisasi}</strong> · PIC:{" "}
                <strong style={{ color: "#0f172a" }}>{trackingModalMisi.responder_name}</strong>
              </p>
            </div>

            <MissionLiveTrackingMap
              mission={trackingModalMisi}
              height="440px"
            />
          </div>
        </div>
      )}

      {/* DIGITAL BAST PRINT / DOWNLOAD MODAL */}
      {selectedBastMisi && (
        <BastPrintModal
          misi={selectedBastMisi}
          onClose={() => setSelectedBastMisi(null)}
        />
      )}
    </main>
  );
}

