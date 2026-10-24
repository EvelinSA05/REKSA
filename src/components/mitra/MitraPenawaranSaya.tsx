import { useState, useMemo } from "react";
import { PenawaranItem, BursaItem } from "../../services/api";
import { AppIcon } from "../common/Icons";
import { getFieldEvidencePhoto } from "../../App";

interface MitraPenawaranSayaProps {
  penawaranList: PenawaranItem[];
  bursaList: BursaItem[];
  userOrg?: string;
  onNavigateToTasks: () => void;
  onNavigateToBursa: () => void;
}

export function MitraPenawaranSaya({
  penawaranList,
  bursaList,
  userOrg = "Satgas BPBD / Mitra Kemanusiaan",
  onNavigateToTasks,
  onNavigateToBursa,
}: MitraPenawaranSayaProps) {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "all">("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; location?: string } | null>(null);
  const pageSize = 5;

  const myOffers: PenawaranItem[] = useMemo(() => {
    let localSaved: any[] = [];
    try {
      const s = localStorage.getItem("reksa_penawaran_db");
      if (s) localSaved = JSON.parse(s);
    } catch {}

    const combined = [...penawaranList];
    localSaved.forEach((lo) => {
      if (!combined.some((p) => p.id === lo.id || p.kode_penawaran === lo.kode_penawaran)) {
        combined.unshift(lo);
      }
    });

    const list = [...combined];
    bursaList.forEach((b) => {
      if (b.status === "Klaim Diajukan" && b.claimed_org) {
        const exists = list.some((p) => p.bursa_id === b.id);
        if (!exists) {
          list.push({
            id: b.id,
            kode_penawaran: `PROP-${b.id}`,
            bursa_id: b.id,
            kebutuhan_id: b.kebutuhan_id,
            posko_id: b.posko_id,
            mitra_name: b.claimedBy?.name || "Mitra Bantuan",
            organisasi: b.claimed_org || userOrg,
            jenis_bantuan: b.item_bantuan,
            jumlah_tawaran: b.claimed_volume || b.target_volume,
            volume_angka: parseInt((b.claimed_volume || b.target_volume).replace(/[^0-9]/g, "")) || 500,
            satuan: (b.claimed_volume || b.target_volume).replace(/[0-9.,]/g, "").trim() || "Unit",
            armada_info: b.claimed_armada || "",
            catatan: b.claim_notes || "Tawaran diajukan.",
            status: "Diajukan",
            created_at: b.published_at || new Date().toISOString(),
          });
        }
      }
    });
    return list;
  }, [penawaranList, bursaList, userOrg]);

  // Counts for metric cards and tab badges
  const totalOffers = myOffers.length;
  const countPending = myOffers.filter((o) => o.status === "Diajukan").length;
  const countApproved = myOffers.filter((o) => o.status === "Disetujui").length;
  const countRejected = myOffers.filter((o) => o.status === "Ditolak").length;

  const filtered = useMemo(() => {
    return myOffers.filter((o) => {
      if (tab === "pending" && o.status !== "Diajukan") return false;
      if (tab === "approved" && o.status !== "Disetujui") return false;
      if (tab === "rejected" && o.status !== "Ditolak") return false;

      if (search.trim()) {
        const q = search.toLowerCase();
        const code = (o.kode_penawaran || "").toLowerCase();
        const item = (o.jenis_bantuan || "").toLowerCase();
        const org = (o.organisasi || "").toLowerCase();
        const notes = (o.catatan || "").toLowerCase();
        return code.includes(q) || item.includes(q) || org.includes(q) || notes.includes(q);
      }
      return true;
    });
  }, [myOffers, tab, search]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedItems = filtered.slice(startIndex, startIndex + pageSize);

  const handleTabChange = (newTab: "pending" | "approved" | "rejected" | "all") => {
    setTab(newTab);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  return (
    <main className="workspace mitra-penawaran-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
      {/* 1. HEADER SECTION */}
      <div className="workspace-title" style={{ marginBottom: "22px" }}>
        <div>
          <span className="eyebrow" style={{ color: "#80866e", letterSpacing: "0.06em", fontWeight: 700 }}>
            PENGELOLAAN KOMITMEN MITRA
          </span>
          <h1 style={{ fontSize: "1.75rem", color: "#013220", fontWeight: 800, margin: "4px 0 8px" }}>
            Daftar Penawaran Saya
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.92rem", maxWidth: "780px" }}>
            Pantau status verifikasi penawaran logistik yang diajukan organisasi Anda, persetujuan Koordinator Posko, dan surat penugasan misi lapangan.
          </p>
        </div>
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
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.15)",
            cursor: "pointer",
            border: "none",
          }}
        >
          <AppIcon name="box" size={16} />
          <span>Tambah Penawaran Baru</span>
        </button>
      </div>

      {/* 2. STATISTIC METRIC CARDS */}
      <div className="posko-metrics-grid-4" style={{ marginBottom: "24px" }}>
        {/* Card 1: Total Penawaran */}
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
              Total Penawaran
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="file" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {totalOffers} Proposal
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Semua riwayat pengajuan
          </small>
        </div>

        {/* Card 2: Menunggu Keputusan */}
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
              Menunggu Keputusan
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="clock" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {countPending} Proposal
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Sedang ditinjau Koordinator
          </small>
        </div>

        {/* Card 3: Disetujui Posko */}
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
              Disetujui Posko
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="check" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {countApproved} Alokasi
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Siap eksekusi misi lapangan
          </small>
        </div>

        {/* Card 4: Ditolak */}
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
              Ditolak Posko
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="x" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {countRejected} Proposal
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Perlu penyesuaian kuota
          </small>
        </div>
      </div>

      {/* 3. TOOLBAR: FILTER TABS & SEARCH */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "22px" }}>
        <div className="cases-pill-filters" style={{ margin: 0 }}>
          <button
            type="button"
            className={`case-filter-btn ${tab === "all" ? "active" : ""}`}
            onClick={() => handleTabChange("all")}
          >
            Semua ({myOffers.length})
          </button>
          <button
            type="button"
            className={`case-filter-btn ${tab === "pending" ? "active" : ""}`}
            onClick={() => handleTabChange("pending")}
          >
            Menunggu Keputusan ({countPending})
          </button>
          <button
            type="button"
            className={`case-filter-btn ${tab === "approved" ? "active" : ""}`}
            onClick={() => handleTabChange("approved")}
          >
            Disetujui Posko ({countApproved})
          </button>
          <button
            type="button"
            className={`case-filter-btn ${tab === "rejected" ? "active" : ""}`}
            onClick={() => handleTabChange("rejected")}
          >
            Ditolak ({countRejected})
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "260px", flex: "1 1 280px", maxWidth: "380px" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari kode penawaran, komoditas..."
            className="posko-search-input"
            style={{
              width: "100%",
              paddingLeft: "36px",
              paddingRight: "14px",
              paddingTop: "9px",
              paddingBottom: "9px",
              borderRadius: "10px",
              border: "1px solid rgba(1, 50, 32, 0.15)",
              fontSize: "0.86rem",
            }}
          />
          <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }}>
            <AppIcon name="search" size={15} />
          </div>
          {search && (
            <button
              type="button"
              onClick={() => handleSearchChange("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "#94a3b8",
                display: "grid",
                placeItems: "center",
              }}
            >
              <AppIcon name="x" size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 4. LIST OF OFFERS */}
      {filtered.length === 0 ? (
        <div className="reksa-empty-state" style={{ background: "#ffffff", borderRadius: "16px", padding: "48px 24px", border: "1px solid rgba(1, 50, 32, 0.1)", textAlign: "center" }}>
          <div className="reksa-empty-icon" style={{ background: "#f0fdf4", color: "#013220", width: "56px", height: "56px", borderRadius: "50%", margin: "0 auto 16px", display: "grid", placeItems: "center" }}>
            <AppIcon name="handshake" size={28} />
          </div>
          <h3 className="reksa-empty-title" style={{ fontSize: "1.2rem", color: "#013220", fontWeight: 800, margin: "0 0 6px" }}>
            Belum Ada Penawaran pada Status Ini
          </h3>
          <p className="reksa-empty-desc" style={{ color: "#64748b", fontSize: "0.88rem", maxWidth: "520px", margin: "0 auto 18px" }}>
            {search
              ? "Tidak ada penawaran logistik yang cocok dengan kata kunci pencarian Anda."
              : "Organisasi Anda belum memiliki pengajuan penawaran logistik pada status filter ini."}
          </p>
          <button
            type="button"
            className="reksa-btn reksa-btn-secondary"
            onClick={onNavigateToBursa}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "9px 18px",
              borderRadius: "10px",
              border: "1.5px solid rgba(1, 50, 32, 0.2)",
              color: "#013220",
              fontWeight: 700,
              background: "#ffffff",
              cursor: "pointer",
            }}
          >
            <span>Buka Bursa Bantuan Terbuka</span>
            <AppIcon name="arrow-right" size={15} />
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {paginatedItems.map((o) => {
            const isPending = o.status === "Diajukan";
            const isApproved = o.status === "Disetujui";
            const isRejected = o.status === "Ditolak";
            const deliveryMethod = o.metode_penyaluran === "mandiri" ? "Penyaluran Mandiri (Armada Sendiri)" : "Diserahkan ke Gudang / Posko BPBD";

            // Clean commodity title to eliminate duplicate volume like "(12 Paket / Unit) · 12 Paket / Unit"
            const cleanTitle = (o.jenis_bantuan || "").replace(/\s*\(\d+[^)]*\)\s*$/, "").trim() || o.jenis_bantuan;

            return (
              <div
                key={o.id}
                className="reksa-card"
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: isApproved
                    ? "1.5px solid #86efac"
                    : isRejected
                    ? "1.5px solid #fca5a5"
                    : "1px solid rgba(1, 50, 32, 0.12)",
                  padding: "24px",
                  boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
                  transition: "box-shadow 0.15s ease",
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: "0.92rem",
                        color: "#013220",
                        fontFamily: "monospace",
                        background: "#f1f5f9",
                        padding: "3px 10px",
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                        letterSpacing: "0.02em",
                      }}
                    >
                      {o.kode_penawaran}
                    </span>

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "9999px",
                        background: isApproved ? "#f0fdf4" : isRejected ? "#fef2f2" : "#fffbeb",
                        color: isApproved ? "#15803d" : isRejected ? "#dc2626" : "#b45309",
                        border: `1px solid ${isApproved ? "#bbf7d0" : isRejected ? "#fecaca" : "#fde68a"}`,
                      }}
                    >
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          background: isApproved ? "#16a34a" : isRejected ? "#dc2626" : "#f59e0b",
                          display: "inline-block",
                        }}
                      />
                      <span>{isApproved ? "Disetujui Posko" : isRejected ? "Ditolak" : "Menunggu Keputusan"}</span>
                    </span>
                  </div>

                  {/* Action Button */}
                  {isApproved && (
                    <button
                      type="button"
                      className="reksa-btn reksa-btn-primary"
                      onClick={onNavigateToTasks}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "#013220",
                        color: "#ffffff",
                        fontWeight: 700,
                        padding: "8px 18px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        border: "none",
                        boxShadow: "0 2px 6px rgba(1, 50, 32, 0.15)",
                      }}
                    >
                      <span>Buka Konsol Misi Lapangan</span>
                      <AppIcon name="arrow-right" size={15} />
                    </button>
                  )}
                </div>

                {/* Main Body with Visual Evidence Photo Thumbnail */}
                <div className="posko-case-body-main" style={{ marginBottom: "14px" }}>
                  <div
                    className="posko-case-photo-thumb"
                    onClick={() => {
                      const photoUrl = getFieldEvidencePhoto(cleanTitle, (o as any).foto_bukti || o.kebutuhan?.foto_bukti);
                      setPreviewImage({
                        src: photoUrl,
                        title: `Proposal Komitmen: ${cleanTitle}`,
                        location: `Organisasi: ${o.organisasi} · Tawaran: ${o.jumlah_tawaran} (${deliveryMethod})`,
                      });
                    }}
                    title="Klik untuk memperbesar foto dokumentasi komoditas"
                  >
                    <img
                      src={getFieldEvidencePhoto(cleanTitle, (o as any).foto_bukti || o.kebutuhan?.foto_bukti)}
                      alt={cleanTitle}
                      className="posko-case-photo-img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    <div className="posko-case-photo-badge">
                      <AppIcon name="camera" size={11} />
                      <span>Foto Komoditas</span>
                    </div>
                    <div className="posko-case-photo-zoom" title="Klik untuk memperbesar">
                      <AppIcon name="search" size={13} style={{ color: "#ffffff" }} />
                    </div>
                  </div>

                  <div className="posko-case-info-col">
                    {/* Commodity Title & Offered Quantity */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", margin: "0 0 10px" }}>
                      <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#013220", fontWeight: 800 }}>
                        {cleanTitle}
                      </h3>
                      <span
                        style={{
                          fontSize: "0.95rem",
                          fontWeight: 800,
                          color: "#15803d",
                          background: "#f0fdf4",
                          padding: "3px 12px",
                          borderRadius: "8px",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        {o.jumlah_tawaran}
                      </span>
                    </div>

                    {/* Structured Metadata Box */}
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                        gap: "10px",
                        padding: "12px 16px",
                        background: "#f8fafc",
                        borderRadius: "12px",
                        border: "1px solid #f1f5f9",
                        marginBottom: "12px",
                        fontSize: "0.83rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <AppIcon name="users" size={14} style={{ color: "#15803d" }} />
                        <span style={{ color: "#64748b" }}>Organisasi:</span>
                        <strong style={{ color: "#0f172a" }}>{o.organisasi}</strong>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <AppIcon name="truck" size={14} style={{ color: "#15803d" }} />
                        <span style={{ color: "#64748b" }}>Metode:</span>
                        <strong style={{ color: "#0f172a" }}>{deliveryMethod}</strong>
                      </div>

                      {o.armada_info && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <AppIcon name="file" size={14} style={{ color: "#15803d" }} />
                          <span style={{ color: "#64748b" }}>Armada:</span>
                          <strong style={{ color: "#0f172a" }}>{o.armada_info}</strong>
                        </div>
                      )}

                      {o.waktu_kesiapan && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <AppIcon name="clock" size={14} style={{ color: "#15803d" }} />
                          <span style={{ color: "#64748b" }}>Kesiapan:</span>
                          <strong style={{ color: "#0f172a" }}>{o.waktu_kesiapan}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Notice Boxes */}
                {isPending && (
                  <div
                    style={{
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "0.85rem",
                      color: "#92400e",
                      marginBottom: o.catatan ? "10px" : "0",
                    }}
                  >
                    <div style={{ marginTop: "2px", flexShrink: 0 }}>
                      <AppIcon name="clock" size={16} />
                    </div>
                    <div>
                      <strong>Menunggu Keputusan Posko:</strong> Proposal bantuan logistik Anda sedang ditinjau oleh Koordinator Posko Wilayah. Surat penugasan resmi akan diterbitkan setelah alokasi disetujui.
                    </div>
                  </div>
                )}

                {isApproved && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "0.85rem",
                      color: "#166534",
                      marginBottom: o.catatan ? "10px" : "0",
                    }}
                  >
                    <div style={{ marginTop: "2px", flexShrink: 0 }}>
                      <AppIcon name="check" size={16} />
                    </div>
                    <div>
                      <strong>Alokasi Resmi Disetujui:</strong> Koordinator Posko telah menetapkan pemenuhan sebesar <strong>{o.jumlah_disetujui || o.jumlah_tawaran}</strong>. Misi penyaluran lapangan resmi telah aktif.
                    </div>
                  </div>
                )}

                {isRejected && (
                  <div
                    style={{
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "0.85rem",
                      color: "#991b1b",
                      marginBottom: o.catatan ? "10px" : "0",
                    }}
                  >
                    <div style={{ marginTop: "2px", flexShrink: 0 }}>
                      <AppIcon name="x" size={16} />
                    </div>
                    <div>
                      <strong>Alasan Penolakan dari Posko:</strong> {o.alasan_penolakan || "Spesifikasi bantuan atau waktu kesiapan belum sesuai dengan prioritas darurat posko saat ini."}
                    </div>
                  </div>
                )}

                {/* Catatan Operasional */}
                {o.catatan && (
                  <div
                    style={{
                      background: "#fcfdfd",
                      border: "1px solid rgba(1, 50, 32, 0.08)",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      fontSize: "0.84rem",
                      color: "#475569",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "8px",
                      marginTop: "10px",
                    }}
                  >
                    <div style={{ marginTop: "2px", flexShrink: 0, color: "#15803d" }}>
                      <AppIcon name="file" size={14} />
                    </div>
                    <div>
                      <strong style={{ color: "#013220" }}>Catatan Operasional:</strong> {o.catatan}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 5. PAGINATION (5 ITEMS PER PAGE) */}
      {filtered.length > pageSize && (
        <div className="posko-pagination-card" style={{ marginTop: "24px" }}>
          <div className="posko-pagination-info">
            <span>
              Menampilkan <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + pageSize, filtered.length)}</strong> dari{" "}
              <strong>{filtered.length}</strong> penawaran
            </span>
            <span className="posko-pagination-limit-badge">Maks. {pageSize} data per halaman</span>
          </div>

          <div className="posko-pagination-controls">
            <button
              type="button"
              className="posko-page-nav-btn"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage(validCurrentPage - 1)}
              title="Halaman sebelumnya"
            >
              <span>&larr;</span> Sebelumnya
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`posko-page-num-btn ${p === validCurrentPage ? "active" : ""}`}
                onClick={() => setCurrentPage(p)}
                title={`Ke halaman ${p}`}
              >
                {p}
              </button>
            ))}

            <button
              type="button"
              className="posko-page-nav-btn"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage(validCurrentPage + 1)}
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
              maxWidth: "680px",
              width: "100%",
              overflow: "hidden",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            <div style={{ position: "relative", width: "100%", maxHeight: "460px", background: "#0f172a", overflow: "hidden" }}>
              <img
                src={previewImage.src}
                alt={previewImage.title}
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", maxHeight: "460px" }}
              />
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                style={{
                  position: "absolute",
                  top: "12px",
                  right: "12px",
                  background: "rgba(0, 0, 0, 0.6)",
                  border: "none",
                  borderRadius: "50%",
                  color: "#ffffff",
                  width: "36px",
                  height: "36px",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                ✕
              </button>
            </div>
            <div style={{ padding: "16px 20px", background: "#ffffff" }}>
              <h4 style={{ margin: "0 0 4px", color: "#013220", fontSize: "1.05rem", fontWeight: 700 }}>
                {previewImage.title}
              </h4>
              {previewImage.location && (
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.84rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AppIcon name="pin" size={13} style={{ color: "#047857" }} />
                  {previewImage.location}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
