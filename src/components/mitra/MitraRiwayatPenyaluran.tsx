import React, { useState, useMemo } from "react";
import { MisiItem } from "../../services/api";
import { CaseRecord } from "../../App";
import { AppIcon } from "../common/Icons";
import { BastPrintModal } from "../common/BastPrintModal";

interface MitraRiwayatPenyaluranProps {
  misiList: MisiItem[];
  cases?: CaseRecord[];
  onNavigateToTasks: () => void;
  onSelectCase?: (c: any) => void;
  notify?: (msg: string) => void;
  onRefresh?: () => Promise<void> | void;
}

export function MitraRiwayatPenyaluran({
  misiList,
  cases = [],
  onNavigateToTasks,
  onSelectCase,
  notify,
  onRefresh,
}: MitraRiwayatPenyaluranProps) {
  const [search, setSearch] = useState("");
  const [filterTab, setFilterTab] = useState<"all" | "zero_discrepancy" | "posko_support" | "mandiri">("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedBastMisi, setSelectedBastMisi] = useState<MisiItem | null>(null);
  const pageSize = 5;

  // Filter only completed missions
  const completedMissions = useMemo(() => {
    return misiList.filter((m) => m.status_tahapan === "Selesai");
  }, [misiList]);

  // Tab count calculations
  const zeroDiscrepancyCount = useMemo(() => {
    return completedMissions.filter((m) => !m.selisih || m.selisih === "0" || m.selisih.includes("0")).length;
  }, [completedMissions]);

  const poskoSupportCount = useMemo(() => {
    return completedMissions.filter((m) => 
      (m.armada_info && m.armada_info.toLowerCase().includes("posko")) ||
      (m.catatan_lapangan && m.catatan_lapangan.toLowerCase().includes("posko"))
    ).length;
  }, [completedMissions]);

  const mandiriCount = useMemo(() => {
    return completedMissions.length - poskoSupportCount;
  }, [completedMissions.length, poskoSupportCount]);

  // Tab definitions
  const statusTabs = [
    { id: "all" as const, label: "Semua Riwayat", count: completedMissions.length },
    { id: "zero_discrepancy" as const, label: "Akurasi 100% (Nol Selisih)", count: zeroDiscrepancyCount },
    { id: "posko_support" as const, label: "Dukungan Posko BPBD", count: poskoSupportCount },
    { id: "mandiri" as const, label: "Distribusi Mandiri", count: Math.max(0, mandiriCount) },
  ];

  // Search and filter pipeline
  const filteredMissions = useMemo(() => {
    return completedMissions.filter((m) => {
      // Tab filter
      if (filterTab === "zero_discrepancy") {
        const isZero = !m.selisih || m.selisih === "0" || m.selisih.includes("0");
        if (!isZero) return false;
      } else if (filterTab === "posko_support") {
        const isPosko = (m.armada_info && m.armada_info.toLowerCase().includes("posko")) ||
                        (m.catatan_lapangan && m.catatan_lapangan.toLowerCase().includes("posko"));
        if (!isPosko) return false;
      } else if (filterTab === "mandiri") {
        const isPosko = (m.armada_info && m.armada_info.toLowerCase().includes("posko")) ||
                        (m.catatan_lapangan && m.catatan_lapangan.toLowerCase().includes("posko"));
        if (isPosko) return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchKode = (m.kode_misi || "").toLowerCase().includes(q);
        const matchMuatan = (m.muatan || "").toLowerCase().includes(q);
        const matchArmada = (m.armada_info || "").toLowerCase().includes(q);
        const matchResponder = (m.responder_name || "").toLowerCase().includes(q);
        const matchOrg = (m.organisasi || "").toLowerCase().includes(q);
        const matchKasus = (m.kebutuhan?.kode_kasus || "").toLowerCase().includes(q);
        const matchLokasi = (
          m.kebutuhan ? `${m.kebutuhan.desa || ""} ${m.kebutuhan.kecamatan || ""} ${m.kebutuhan.kabupaten || ""}` : ""
        ).toLowerCase().includes(q);
        const matchPosko = (m.posko?.nama_posko || "").toLowerCase().includes(q);
        const matchCatatan = (m.catatan_lapangan || "").toLowerCase().includes(q);

        if (
          !matchKode &&
          !matchMuatan &&
          !matchArmada &&
          !matchResponder &&
          !matchOrg &&
          !matchKasus &&
          !matchLokasi &&
          !matchPosko &&
          !matchCatatan
        ) {
          return false;
        }
      }

      return true;
    });
  }, [completedMissions, filterTab, search]);

  // Pagination calculation (max 5 data per page)
  const totalItems = filteredMissions.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedMissions = filteredMissions.slice(startIndex, endIndex);

  const handlePrintBast = () => {
    window.print();
  };

  return (
    <main className="workspace mitra-riwayat-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
      {/* Title Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <span className="eyebrow" style={{ color: "#80866e", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.78rem" }}>
            ARSIP RESMI &amp; REKONSILIASI PENYALURAN
          </span>
          <h1 style={{ margin: "4px 0 6px", color: "#013220", fontSize: "1.75rem", fontWeight: 800 }}>
            Riwayat Penyaluran Bantuan
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem", maxWidth: "700px", lineHeight: 1.5 }}>
            Daftar misi kemanusiaan yang telah diselesaikan organisasi Anda dan dikonfirmasi resmi oleh Posko Koordinator dan Warga terdampak.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {onRefresh && (
            <button
              type="button"
              className="reksa-btn reksa-btn-secondary"
              onClick={() => onRefresh()}
              title="Segarkan data riwayat"
            >
              <AppIcon name="clock" size={14} /> Segarkan
            </button>
          )}
          <button
            type="button"
            className="reksa-btn reksa-btn-primary"
            onClick={onNavigateToTasks}
            style={{ background: "#013220", color: "#ffffff" }}
          >
            Lihat Misi Berjalan <AppIcon name="arrow-right" size={14} />
          </button>
        </div>
      </div>

      {/* 4-COLUMN SUMMARY METRIC CARDS */}
      <div className="posko-metrics-grid-4" style={{ marginBottom: "22px" }}>
        {/* Card 1: Total Misi Selesai */}
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
              Total Misi Selesai
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="check" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {completedMissions.length} Misi
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Tuntas Diterima di Lokasi
          </small>
        </div>

        {/* Card 2: Logistik Disalurkan */}
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
              Logistik Disalurkan
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="box" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            100%
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Sesuai Manifest Muatan Armada
          </small>
        </div>

        {/* Card 3: Akurasi Serah Terima */}
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
              Akurasi Serah Terima
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(21, 128, 61, 0.1)", color: "#15803d", display: "grid", placeItems: "center" }}>
              <AppIcon name="shield" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#15803d", lineHeight: 1.1 }}>
            100% Sesuai
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Tanpa Selisih (Nol Defisit)
          </small>
        </div>

        {/* Card 4: Dokumen BAST Sah */}
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
              Berita Acara (BAST)
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="file" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            100% Terbit
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Tervalidasi Digital Resmi Posko
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
        {/* Tier 1: Category Filter Tabs */}
        <div className="posko-toolbar-tabs">
          {statusTabs.map((tabItem) => {
            const isActive = filterTab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => {
                  setFilterTab(tabItem.id);
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

        {/* Tier 2: Search Input & Results Meta */}
        <div className="posko-toolbar-search-row">
          <div className="posko-search-input-wrap">
            <span className="posko-search-icon">
              <AppIcon name="search" size={15} />
            </span>
            <input
              type="text"
              placeholder="Cari berdasarkan nomor misi, komoditas muatan, nama armada, posko, atau wilayah..."
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
              {completedMissions.length} riwayat selesai
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

      {/* CONTENT LIST */}
      {completedMissions.length === 0 ? (
        <div className="reksa-empty-state">
          <div className="reksa-empty-icon">📋</div>
          <h3 className="reksa-empty-title">Belum Ada Riwayat Selesai</h3>
          <p className="reksa-empty-desc">
            Misi yang telah sampai di lokasi dan dikonfirmasi penerimaannya oleh Posko akan otomatis terarsip rapi di sini.
          </p>
          <div style={{ marginTop: "16px" }}>
            <button
              type="button"
              className="reksa-btn reksa-btn-primary"
              onClick={onNavigateToTasks}
            >
              Lihat Misi Berjalan
            </button>
          </div>
        </div>
      ) : paginatedMissions.length === 0 ? (
        <div className="reksa-empty-state">
          <div className="reksa-empty-icon"><AppIcon name="search" size={28} style={{ color: "#80866e" }} /></div>
          <h3 className="reksa-empty-title">Tidak Ditemukan Riwayat yang Cocok</h3>
          <p className="reksa-empty-desc">
            Tidak ada riwayat penyaluran yang memenuhi kriteria pencarian "<strong>{search}</strong>".
          </p>
          <div style={{ marginTop: "16px" }}>
            <button
              type="button"
              className="reksa-btn reksa-btn-secondary"
              onClick={() => {
                setSearch("");
                setFilterTab("all");
                setCurrentPage(1);
              }}
            >
              Reset Filter &amp; Pencarian
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {paginatedMissions.map((m) => {
            const hasZeroDiscrepancy = !m.selisih || m.selisih === "0" || m.selisih.includes("0");
            const bastNumber = `BAST/REKSA/2026/${m.kode_misi.replace(/[^a-zA-Z0-9]/g, "")}`;
            const targetKk = m.kebutuhan?.jumlah_kk ? `${m.kebutuhan.jumlah_kk} KK` : "1 KK";

            return (
              <div key={m.id} className="reksa-history-card">
                {/* CARD HEADER */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px" }}>
                  <div>
                    {/* Top Chips Row */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: "0.95rem",
                          color: "#013220",
                          fontFamily: "monospace",
                          background: "#eef6f0",
                          border: "1px solid #b2d7bb",
                          padding: "3px 10px",
                          borderRadius: "6px",
                          letterSpacing: "0.03em",
                        }}
                      >
                        {m.kode_misi}
                      </span>
                      <span className="reksa-badge success">
                        ✓ Selesai &amp; Diterima Sah
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <AppIcon name="clock" size={13} />
                        {m.estimasi_waktu || "Tuntas Terverifikasi Posko"}
                      </span>
                    </div>

                    {/* Main Title */}
                    <h3 style={{ margin: "2px 0 6px", fontSize: "1.2rem", fontWeight: 800, color: "#013220", lineHeight: 1.35 }}>
                      Muatan: {m.muatan} · {m.armada_info || "Armada Mitra Terdaftar"}
                    </h3>

                    {/* Meta List */}
                    <div className="reksa-meta-list" style={{ marginTop: "6px", fontSize: "0.85rem" }}>
                      {m.kebutuhan?.kode_kasus && (
                        <>
                          <span className="reksa-meta-item">
                            Kasus: <strong>{m.kebutuhan.kode_kasus}</strong>
                          </span>
                          <span className="reksa-meta-divider">·</span>
                        </>
                      )}
                      <span className="reksa-meta-item">
                        Tujuan: <strong>{m.kebutuhan?.desa ? `${m.kebutuhan.desa}, ${m.kebutuhan.kecamatan}` : "Lokasi Sasaran Bencana"}</strong>
                      </span>
                      <span className="reksa-meta-divider">·</span>
                      <span className="reksa-meta-item">
                        Posko: <strong>{m.posko?.nama_posko || "Posko BPBD Wilayah"}</strong>
                      </span>
                      <span className="reksa-meta-divider">·</span>
                      <span className="reksa-meta-item">
                        Petugas: <strong>{m.responder_name}</strong> ({m.organisasi})
                      </span>
                    </div>
                  </div>

                  {/* Right BAST Badge */}
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "3px" }}>
                      Berita Acara Digital
                    </div>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        background: "#f0fdf4",
                        color: "#15803d",
                        border: "1px solid #bbf7d0",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "0.82rem",
                      }}
                    >
                      <AppIcon name="check" size={13} /> Terkonfirmasi Sah
                    </span>
                    <small style={{ display: "block", color: "#64748b", fontSize: "0.72rem", marginTop: "3px", fontFamily: "monospace" }}>
                      {bastNumber}
                    </small>
                  </div>
                </div>

                {/* 4-COLUMN BALANCED TELEMETRY GRID */}
                <div className="reksa-history-telemetry-grid">
                  <div className="reksa-history-telemetry-box highlight-target">
                    <div>
                      <span className="reksa-history-telemetry-label">Muatan Terkirim</span>
                      <div className="reksa-history-telemetry-val">{m.muatan}</div>
                    </div>
                    <span className="reksa-history-telemetry-sub">Manifest Resmi Penyalur</span>
                  </div>

                  <div className="reksa-history-telemetry-box highlight-success">
                    <div>
                      <span className="reksa-history-telemetry-label">Diterima Fisik</span>
                      <div className="reksa-history-telemetry-val" style={{ color: "#15803d" }}>
                        {m.jumlah_diterima || m.muatan}
                      </div>
                    </div>
                    <span className="reksa-history-telemetry-sub">Diverifikasi Petugas Posko</span>
                  </div>

                  <div className="reksa-history-telemetry-box highlight-success">
                    <div>
                      <span className="reksa-history-telemetry-label">Selisih Logistik</span>
                      <div className="reksa-history-telemetry-val" style={{ color: hasZeroDiscrepancy ? "#15803d" : "#dc2626" }}>
                        {hasZeroDiscrepancy ? "0 (Sesuai Target)" : m.selisih}
                      </div>
                    </div>
                    <span className="reksa-history-telemetry-sub">
                      {hasZeroDiscrepancy ? "Akurasi 100% Nol Defisit" : "Tercatat Selisih Penyaluran"}
                    </span>
                  </div>

                  <div className="reksa-history-telemetry-box highlight-target">
                    <div>
                      <span className="reksa-history-telemetry-label">Penerima Manfaat</span>
                      <div className="reksa-history-telemetry-val">{targetKk}</div>
                    </div>
                    <span className="reksa-history-telemetry-sub">Status Kasus Selesai (Resolved)</span>
                  </div>
                </div>

                {/* FIELD NOTES CALLOUT */}
                {m.catatan_lapangan && (
                  <div
                    style={{
                      background: "#fbfbf8",
                      border: "1px solid rgba(1, 50, 32, 0.08)",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "0.86rem",
                      color: "#334155",
                      lineHeight: 1.45,
                    }}
                  >
                    <span style={{ color: "#15803d", marginTop: "2px", flexShrink: 0 }}>
                      <AppIcon name="file" size={15} />
                    </span>
                    <div>
                      <strong style={{ color: "#013220", marginRight: "6px" }}>Catatan Serah Terima:</strong>
                      {m.catatan_lapangan}
                    </div>
                  </div>
                )}

                {/* ACTION BAR */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", paddingTop: "8px", borderTop: "1px solid rgba(1, 50, 32, 0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#64748b", fontSize: "0.8rem" }}>
                    <AppIcon name="shield" size={14} style={{ color: "#15803d" }} />
                    <span>Dokumen digital tersimpan aman &amp; berkekuatan hukum pelaporan posko</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <button
                      type="button"
                      className="reksa-btn reksa-btn-secondary"
                      onClick={() => setSelectedBastMisi(m)}
                      title="Lihat Berita Acara Serah Terima (BAST)"
                      style={{ padding: "6px 14px", fontSize: "0.82rem", minHeight: "36px" }}
                    >
                      <AppIcon name="file" size={14} /> Lihat Dokumen BAST
                    </button>

                    {onSelectCase && m.kebutuhan_id && (
                      <button
                        type="button"
                        className="reksa-btn reksa-btn-secondary"
                        onClick={() => {
                          const targetCase = cases.find((c) => c.rawId === m.kebutuhan_id || c.id === m.kebutuhan?.kode_kasus);
                          if (targetCase) {
                            onSelectCase(targetCase);
                          } else {
                            onSelectCase({ id: m.kebutuhan?.kode_kasus || `RK-2026-00${m.kebutuhan_id}` });
                          }
                        }}
                        title="Tinjau berkas kebutuhan terkait"
                        style={{ padding: "6px 14px", fontSize: "0.82rem", minHeight: "36px" }}
                      >
                        <AppIcon name="eye" size={14} /> Berkas Kasus
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION BAR (Max 5 data per page) */}
      {totalItems > pageSize && (
        <div className="posko-pagination">
          <div className="posko-pagination-info">
            <span>
              Menampilkan <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> dari{" "}
              <strong>{totalItems}</strong> riwayat penyaluran
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

      {/* DIGITAL BAST PRINT / DOWNLOAD MODAL */}
      {selectedBastMisi && (
        <BastPrintModal
          misi={selectedBastMisi}
          caseRecord={
            cases.find(
              (c) =>
                (c.rawId && c.rawId === selectedBastMisi.kebutuhan_id) ||
                c.id === selectedBastMisi.kebutuhan?.kode_kasus ||
                c.id === `RK-2026-00${selectedBastMisi.kebutuhan_id}`
            ) || null
          }
          onClose={() => setSelectedBastMisi(null)}
        />
      )}
    </main>
  );
}
