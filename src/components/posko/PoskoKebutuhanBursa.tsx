import { useState } from "react";
import { CaseRecord, getFieldEvidencePhoto } from "../../App";
import { BursaItem, PenawaranItem } from "../../services/api";
import { AppIcon } from "../common/Icons";

interface PoskoKebutuhanBursaProps {
  cases: CaseRecord[];
  bursaList: BursaItem[];
  penawaranList: PenawaranItem[];
  onNavigateToOffers: () => void;
  onSelectCase: (c: CaseRecord) => void;
}

export function PoskoKebutuhanBursa({
  cases,
  bursaList,
  penawaranList,
  onNavigateToOffers,
  onSelectCase,
}: PoskoKebutuhanBursaProps) {
  const [filterCategory, setFilterCategory] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; location?: string } | null>(null);

  // Filter verified cases (either in bursaList or status is Kebutuhan Terbuka / Sebagian / Teralokasi / Selesai)
  const verifiedCases = cases.filter((c) => {
    const s = (c.status || "").toLowerCase();
    return (
      s.includes("terbuka") ||
      s.includes("sebagian") ||
      s.includes("teralokasi") ||
      s.includes("pengiriman") ||
      s.includes("selesai")
    );
  });

  const statusTabs = [
    { label: "Semua", count: verifiedCases.length },
    {
      label: "Terbuka",
      count: verifiedCases.filter((c) => (c.status || "").toLowerCase().includes("terbuka")).length,
    },
    {
      label: "Sebagian Terpenuhi",
      count: verifiedCases.filter((c) => (c.status || "").toLowerCase().includes("sebagian")).length,
    },
    {
      label: "Teralokasi Penuh",
      count: verifiedCases.filter(
        (c) =>
          (c.status || "").toLowerCase().includes("teralokasi") ||
          (c.status || "").toLowerCase().includes("pengiriman")
      ).length,
    },
    {
      label: "Selesai",
      count: verifiedCases.filter((c) => (c.status || "").toLowerCase().includes("selesai")).length,
    },
  ];

  const categories = ["Semua", ...Array.from(new Set(verifiedCases.map((c) => c.item).filter(Boolean)))];

  const filteredItems = verifiedCases.filter((c) => {
    if (filterCategory !== "Semua" && c.item !== filterCategory) return false;
    if (filterStatus !== "Semua") {
      const s = (c.status || "").toLowerCase();
      if (filterStatus === "Terbuka" && !s.includes("terbuka")) return false;
      if (filterStatus === "Sebagian Terpenuhi" && !s.includes("sebagian")) return false;
      if (
        filterStatus === "Teralokasi Penuh" &&
        !s.includes("teralokasi") &&
        !s.includes("pengiriman")
      )
        return false;
      if (filterStatus === "Selesai" && !s.includes("selesai")) return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchId = (c.id || "").toLowerCase().includes(q);
      const matchItem = (c.item || "").toLowerCase().includes(q);
      const matchLocation = (c.location || "").toLowerCase().includes(q);
      const matchReporter = ((c as any).reporter || (c as any).name || "").toLowerCase().includes(q);
      const matchNotes = (c.notes || "").toLowerCase().includes(q);
      if (!matchId && !matchItem && !matchLocation && !matchReporter && !matchNotes) {
        return false;
      }
    }
    return true;
  });

  const totalItems = filteredItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const pendingOffersCount = penawaranList.filter((p) => p.status === "Diajukan").length;

  return (
    <main className="workspace posko-bursa-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
      {/* Title bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <span className="eyebrow" style={{ color: "#80866e", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.78rem" }}>
            MANAJEMEN LOGISTIK &amp; PEMENUHAN POSKO
          </span>
          <h1 style={{ margin: "4px 0 6px", color: "#013220", fontSize: "1.75rem", fontWeight: 800 }}>
            Kebutuhan &amp; Bursa Bantuan
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem", maxWidth: "680px", lineHeight: 1.5 }}>
            Pantau kebutuhan warga yang telah diverifikasi, pantau neraca kekurangan alokasi secara transparan, dan kelola penugasan armada mitra.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToOffers}
          style={{
            background: "#013220",
            color: "#ffffff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
            fontSize: "0.88rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            transition: "background 0.2s ease",
          }}
        >
          <AppIcon name="handshake" size={16} />
          <span>Lihat Penawaran Mitra ({pendingOffersCount} Menunggu)</span>
          <AppIcon name="arrow-right" size={14} />
        </button>
      </div>

      {/* REFINED STAT METRIC CARDS */}
      <div className="posko-metrics-grid-4">
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
              Kebutuhan Sah
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="box" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {verifiedCases.length} Kasus
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Terverifikasi Posko Wilayah
          </small>
        </div>

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
              Alokasi Sah Aktif
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="truck" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {penawaranList.filter((p) => p.status === "Disetujui").length} Komitmen
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Surat Misi Penyaluran Terbit
          </small>
        </div>

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
              Kekurangan Terbuka
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="alert" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {verifiedCases.filter((c) => c.status === "Kebutuhan Terbuka" || c.status === "Sebagian Terpenuhi").length} Item
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Terbuka di Bursa bagi Mitra
          </small>
        </div>

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
              Penerimaan Tuntas
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="check" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {verifiedCases.filter((c) => c.status === "Selesai").length} Kasus
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            100% Selesai &amp; Berita Acara Sah
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
            const isActive = filterStatus === tabItem.label;
            return (
              <button
                key={tabItem.label}
                type="button"
                onClick={() => {
                  setFilterStatus(tabItem.label);
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

        {/* Row 2: Search Input, Category Select, and Results Counter */}
        <div className="posko-toolbar-search-row">
          <div className="posko-search-input-wrap">
            <span className="posko-search-icon">
              <AppIcon name="search" size={15} />
            </span>
            <input
              type="text"
              placeholder="Cari berdasarkan kode kasus, komoditas, lokasi, atau catatan..."
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

          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <div className="posko-category-select-wrap">
              <AppIcon name="tag" size={14} style={{ color: "#80866e" }} />
              <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase" }}>
                Kategori:
              </span>
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="posko-category-select"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="posko-search-meta">
              <span className="posko-search-count-text">
                Menampilkan <strong>{totalItems > 0 ? `${startIndex + 1}-${endIndex}` : 0}</strong> dari{" "}
                {verifiedCases.length} kebutuhan
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
      </div>

      {/* CARDS LIST */}
      {filteredItems.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px dashed #cbd5e1",
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(1,50,32,0.06)", color: "#013220", display: "grid", placeItems: "center", margin: "0 auto 12px" }}>
            <AppIcon name="box" size={24} />
          </div>
          <h3 style={{ margin: "0 0 6px", color: "#013220", fontSize: "1.1rem", fontWeight: 700 }}>
            Tidak Ada Kebutuhan yang Sesuai
          </h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem" }}>
            Semua kebutuhan telah selesai atau belum ada data yang sesuai dengan filter pencarian Anda.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {paginatedItems.map((c) => {
            const targetNum = parseInt(c.qty.replace(/[^0-9]/g, "")) || 1000;
            const unit = c.qty.replace(/[0-9.,]/g, "").trim() || "Unit";

            // Find matching offers
            const approvedOffers = penawaranList.filter(
              (p) => p.kebutuhan_id === parseInt(c.id.replace(/[^0-9]/g, "")) && p.status === "Disetujui"
            );
            const allocatedFromOffers = approvedOffers.reduce((sum, p) => sum + (p.volume_disetujui_angka || 0), 0);
            const allocatedNum =
              allocatedFromOffers > 0
                ? allocatedFromOffers
                : c.status === "Teralokasi Penuh" || c.status === "Selesai"
                ? targetNum
                : 0;

            const shortageAlloc = Math.max(0, targetNum - allocatedNum);
            const isFinished = c.status === "Selesai";
            const pctAlloc = Math.min(100, Math.round((allocatedNum / targetNum) * 100));

            // Recommendation advice text
            let adviceNote = "";
            let adviceTone: "teal" | "amber" | "green" = "teal";

            if (allocatedNum === 0) {
              adviceNote = "Kebutuhan sah belum memiliki komitmen mitra: Siap diklaim oleh mitra bantuan di Bursa Kemitraan.";
              adviceTone = "amber";
            } else if (allocatedNum < targetNum) {
              adviceNote = `Alokasi tahap 1 berjalan (${allocatedNum} ${unit}). Sisa kekurangan ${shortageAlloc} ${unit} tetap terbuka di Bursa.`;
              adviceTone = "amber";
            } else if (!isFinished) {
              adviceNote = "Alokasi penuh: Armada mitra sedang menjalankan penyaluran. Pantau serah terima fisik di menu Distribusi.";
              adviceTone = "teal";
            } else {
              adviceNote = "Seluruh kebutuhan terkonfirmasi tuntas diterima fisik oleh warga dan posko (BAST Sah).";
              adviceTone = "green";
            }

            const urgencyClass = (c.urgency || "sedang").toLowerCase().replace(/\s+/g, "-");
            const statusClass = isFinished
              ? "status-verified"
              : shortageAlloc > 0
              ? "status-pending"
              : "status-verified";

            return (
              <div
                key={c.id}
                className="posko-case-card card-verified"
                style={{
                  border: isFinished
                    ? "1px solid #bbf7d0"
                    : shortageAlloc > 0
                    ? "1px solid #fde68a"
                    : "1px solid rgba(1, 50, 32, 0.12)",
                }}
              >
                {/* 1. Header Row */}
                <div className="posko-case-header-row">
                  <div className="posko-case-badges">
                    <span className="posko-case-id-badge">{c.id}</span>
                    <span className={`posko-case-urgency-badge urgency-${urgencyClass}`}>
                      Prioritas {c.urgency}
                    </span>
                    <span className={`posko-case-status-badge ${statusClass}`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="posko-case-date">
                    <AppIcon name="calendar" size={13} style={{ color: "#80866e" }} />
                    <span>{c.date || "10 Okt 2026"}</span>
                  </div>
                </div>

                {/* 2. Main Body with Visual Evidence Thumbnail */}
                <div className="posko-case-body-main" style={{ marginBottom: "14px" }}>
                  {/* Visual Photo Thumbnail */}
                  <div
                    className="posko-case-photo-thumb"
                    onClick={() =>
                      setPreviewImage({
                        src: getFieldEvidencePhoto(c.item, c.fotoBukti),
                        title: `Kebutuhan ${c.item} · ${c.qty}`,
                        location: c.location,
                      })
                    }
                    title="Klik untuk memperbesar foto dokumentasi"
                  >
                    <img
                      src={getFieldEvidencePhoto(c.item, c.fotoBukti)}
                      alt={c.item}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1547683905-f686c993aae5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=1200&q=82";
                      }}
                      className="posko-case-photo-img"
                    />
                    <div className="posko-case-photo-badge">
                      <AppIcon name="camera" size={11} />
                      <span>{c.fotoBukti ? "Foto Pelapor" : "Dokumentasi"}</span>
                    </div>
                    <div className="posko-case-photo-zoom" title="Klik untuk memperbesar">
                      🔍
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="posko-case-info-col">
                    <h3 className="posko-case-title">
                      Kebutuhan {c.item} · {c.qty}
                    </h3>

                    <div className="posko-case-meta-row">
                      <span className="posko-case-meta-item">
                        <AppIcon name="pin" size={13} style={{ color: "#80866e" }} />
                        <span>{c.location}</span>
                      </span>
                      <span className="posko-case-meta-item">
                        <AppIcon name="users" size={13} style={{ color: "#80866e" }} />
                        <span><strong>{(c.kk || "").toString().toLowerCase().includes("kk") ? c.kk : `${c.kk} KK`}</strong> Terdampak</span>
                      </span>
                      {(c.applicantName || (c as any).reporter) && (
                        <span className="posko-case-meta-item">
                          <AppIcon name="user" size={13} style={{ color: "#80866e" }} />
                          <span>Pelapor: <strong>{c.applicantName || (c as any).reporter}</strong></span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 4. Unified Balance Panel */}
                <div className="posko-bursa-balance-box">
                  <div className="posko-bursa-balance-grid">
                    <div>
                      <span className="posko-bursa-metric-label">Target Kebutuhan</span>
                      <strong className="posko-bursa-metric-val">{c.qty}</strong>
                    </div>

                    <div>
                      <span className="posko-bursa-metric-label">Alokasi Sah Aktif</span>
                      <strong
                        className="posko-bursa-metric-val"
                        style={{ color: allocatedNum > 0 ? "#15803d" : "#64748b" }}
                      >
                        {allocatedNum} {unit}
                      </strong>
                    </div>

                    <div>
                      <span className="posko-bursa-metric-label">Sisa Defisit Terbuka</span>
                      <strong
                        className="posko-bursa-metric-val"
                        style={{ color: shortageAlloc > 0 ? "#b45309" : "#15803d" }}
                      >
                        {shortageAlloc > 0 ? `${shortageAlloc} ${unit}` : "0 (Tuntas)"}
                      </strong>
                    </div>

                    <div>
                      <span className="posko-bursa-metric-label">Status Pemenuhan</span>
                      <strong
                        className="posko-bursa-metric-val"
                        style={{ color: pctAlloc >= 100 ? "#15803d" : "#013220" }}
                      >
                        {pctAlloc}% Terpenuhi
                      </strong>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="posko-bursa-progress-track">
                    <div
                      className="posko-bursa-progress-fill"
                      style={{
                        width: `${pctAlloc}%`,
                        background: pctAlloc >= 100 ? "#15803d" : "#013220",
                      }}
                    />
                  </div>
                </div>

                {/* 5. Recommendation Advisory Callout */}
                <div className={`posko-bursa-advice-box advice-${adviceTone}`}>
                  <AppIcon
                    name={adviceTone === "green" ? "check" : adviceTone === "amber" ? "alert" : "info"}
                    size={15}
                  />
                  <span>
                    <strong>Rekomendasi Tindakan:</strong> {adviceNote}
                  </span>
                </div>

                {/* 6. Dedicated Footer Action Bar */}
                <div className="posko-case-footer-row">
                  <button
                    type="button"
                    onClick={() => onSelectCase(c)}
                    className="btn-case-view"
                    title="Buka dokumen detail dan pemeriksaan kasus"
                  >
                    <AppIcon name="file" size={14} />
                    <span>Detail Kasus</span>
                  </button>

                  <div className="posko-case-actions-cluster">
                    <button
                      type="button"
                      onClick={onNavigateToOffers}
                      className="btn-case-verify"
                      title="Kelola alokasi dan penugasan armada mitra bantuan"
                    >
                      <AppIcon name="handshake" size={14} />
                      <span>Kelola Alokasi Mitra</span>
                      <AppIcon name="arrow-right" size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION CARD */}
      {filteredItems.length > 0 && (
        <div className="posko-pagination-card">
          <div className="posko-pagination-info">
            <span>
              Menampilkan <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> dari{" "}
              <strong>{totalItems}</strong> kebutuhan
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
      {/* Lightbox Photo Preview Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            zIndex: 100000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            animation: "fadeIn 0.2s ease",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              overflow: "hidden",
              maxWidth: "680px",
              width: "100%",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                background: "#013220",
                color: "#ffffff",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <AppIcon name="camera" size={16} />
                <span style={{ fontWeight: 700, fontSize: "0.92rem" }}>
                  {previewImage.title}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                style={{
                  background: "rgba(255, 255, 255, 0.15)",
                  border: "none",
                  color: "#ffffff",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: "#0b130e",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "280px",
                maxHeight: "65vh",
              }}
            >
              <img
                src={previewImage.src}
                alt={previewImage.title}
                style={{
                  width: "100%",
                  maxHeight: "65vh",
                  objectFit: "contain",
                  display: "block",
                }}
              />
            </div>

            {previewImage.location && (
              <div
                style={{
                  padding: "12px 18px",
                  background: "#f8faf9",
                  borderTop: "1px solid #e2e8f0",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.82rem",
                  color: "#475569",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <AppIcon name="pin" size={13} style={{ color: "#013220" }} />
                  <span>{previewImage.location}</span>
                </span>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  Dokumentasi Bencana Terverifikasi
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

