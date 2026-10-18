import { useState } from "react";
import { SharedState, RouterProps } from "../../App";
import { BursaItem, apiService } from "../../services/api";
import { AppIcon } from "../common/Icons";

interface MitraDashboardProps {
  state: SharedState;
  update?: RouterProps["update"];
  setPage: (page: string) => void;
  notify?: (msg: string) => void;
  onRefresh?: () => Promise<void> | void;
}

export function MitraDashboard({
  state,
  setPage,
  notify,
  onRefresh,
}: MitraDashboardProps) {
  const bursaList = state.bursaList || [];
  const misiList = state.misiList || [];
  const penawaranList = state.penawaranList || [];

  const openNeeds = bursaList.filter(
    (b) => b.status === "Terbuka" || b.status === "Klaim Diajukan" || b.status === "Sebagian Terpenuhi"
  );
  const pendingOffersCount =
    penawaranList.filter((p) => p.status === "Diajukan").length +
    bursaList.filter((b) => b.status === "Klaim Diajukan").length;
  const activeMissions = misiList.filter((m) => m.status_tahapan !== "Selesai");
  const activeMission = activeMissions[0];
  const pendingClaim = bursaList.find((b) => b.status === "Klaim Diajukan");

  // Filter & Search states for Open Needs
  const [filterUrgency, setFilterUrgency] = useState<"Semua" | "Kritis" | "Tinggi" | "Sedang">("Semua");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Claim modal state
  const [claimModalBursa, setClaimModalBursa] = useState<BursaItem | null>(null);
  const [claimedArmada, setClaimedArmada] = useState("Truk Tangki No. 02 · Kapasitas 500 L Air Minum");
  const [claimedVolume, setClaimedVolume] = useState("");
  const [claimedOrg, setClaimedOrg] = useState(state.userProfile?.org || "Satgas Reaksi Cepat BPBD");
  const [claimNotes, setClaimNotes] = useState(
    "Armada logistik siaga dan siap diberangkatkan ke posko begitu alokasi disetujui."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const urgencyTabs = [
    { label: "Semua" as const, count: openNeeds.length },
    { label: "Kritis" as const, count: openNeeds.filter((b) => b.urgensi === "Kritis").length },
    { label: "Tinggi" as const, count: openNeeds.filter((b) => b.urgensi === "Tinggi").length },
    { label: "Sedang" as const, count: openNeeds.filter((b) => b.urgensi === "Sedang" || b.urgensi === "Normal").length },
  ];

  const filteredNeeds = openNeeds.filter((b) => {
    if (filterUrgency !== "Semua") {
      if (filterUrgency === "Sedang") {
        if (b.urgensi !== "Sedang" && b.urgensi !== "Normal") return false;
      } else if (b.urgensi !== filterUrgency) {
        return false;
      }
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      const matchItem = (b.item_bantuan || "").toLowerCase().includes(q);
      const matchPosko = (b.posko?.nama_posko || "").toLowerCase().includes(q);
      const matchDesa = (b.kebutuhan?.desa || b.posko?.desa || "").toLowerCase().includes(q);
      const matchKec = (b.kebutuhan?.kecamatan || b.posko?.kecamatan || "").toLowerCase().includes(q);
      const matchKab = (b.kebutuhan?.kabupaten || b.posko?.kabupaten || "").toLowerCase().includes(q);
      if (!matchItem && !matchPosko && !matchDesa && !matchKec && !matchKab) {
        return false;
      }
    }

    return true;
  });

  const totalItems = filteredNeeds.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(currentPage, totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedNeeds = filteredNeeds.slice(startIndex, endIndex);

  const openClaimModal = (item: BursaItem) => {
    setClaimModalBursa(item);
    setClaimedVolume(item.target_volume);
    setClaimedOrg(state.userProfile?.org || "Satgas Reaksi Cepat BPBD");
    if (item.item_bantuan.toLowerCase().includes("makan") || item.item_bantuan.toLowerCase().includes("pangan")) {
      setClaimedArmada("Mobil Box Logistik No. 01 · Kapasitas 100 Paket Makanan");
    } else if (item.item_bantuan.toLowerCase().includes("air")) {
      setClaimedArmada("Truk Tangki No. 02 · Kapasitas 500 L Air Minum");
    } else {
      setClaimedArmada("Armada Distribusi Cepat BPBD / Relawan");
    }
  };

  const handleClaimSubmit = async () => {
    if (!claimModalBursa) return;
    try {
      setIsSubmitting(true);
      const res = await apiService.claimBursa(claimModalBursa.id, {
        claimed_volume: claimedVolume || claimModalBursa.target_volume,
        armada_info: claimedArmada,
        organisasi: claimedOrg,
        catatan: claimNotes,
      });
      if (res.success) {
        notify?.(`Komitmen bantuan berhasil diajukan! Menunggu persetujuan Koordinator Posko.`);
        setClaimModalBursa(null);
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal mengajukan komitmen bantuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="workspace responder-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
      {/* Title bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <span className="eyebrow" style={{ color: "#80866e", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.78rem" }}>
            PORTAL MITRA BANTUAN KEMANUSIAAN
          </span>
          <h1 style={{ margin: "4px 0 6px", color: "#013220", fontSize: "1.75rem", fontWeight: 800 }}>
            Dashboard Mitra Bantuan
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem", maxWidth: "680px", lineHeight: 1.5 }}>
            Pilih kebutuhan masyarakat terdampak bencana yang dirilis oleh Posko Wilayah untuk dibantu melalui pemenuhan logistik dan penyaluran organisasi Anda.
          </p>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "8px 16px", borderRadius: "999px", background: "rgba(22, 163, 74, 0.1)", border: "1px solid rgba(22, 163, 74, 0.2)", fontSize: "0.82rem", fontWeight: 700, color: "#15803d" }}>
          <AppIcon name="shield" size={15} />
          <span>Status Organisasi: Terverifikasi &amp; Siaga</span>
        </div>
      </div>

      {/* 4-COLUMN BALANCED METRIC CARDS */}
      <div className="posko-metrics-grid-4">
        {/* Card 1: Kebutuhan Terbuka */}
        <div
          onClick={() => setPage("bursa")}
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          className="posko-stat-card-hover"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Kebutuhan Terbuka
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="box" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {openNeeds.length} Item
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Tersedia di Bursa Bantuan
          </small>
        </div>

        {/* Card 2: Penawaran Saya */}
        <div
          onClick={() => setPage("my-offers")}
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          className="posko-stat-card-hover"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Penawaran Saya
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="handshake" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {pendingOffersCount} Komitmen
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Menunggu Verifikasi Posko
          </small>
        </div>

        {/* Card 3: Misi Aktif */}
        <div
          onClick={() => setPage("tasks")}
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          className="posko-stat-card-hover"
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
            {activeMission ? `Status: ${activeMission.status_tahapan}` : "Tidak Ada Misi Berjalan"}
          </small>
        </div>

        {/* Card 4: Misi Selesai */}
        <div
          onClick={() => setPage("history")}
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          className="posko-stat-card-hover"
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Misi Selesai
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="check" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {misiList.filter((m) => m.status_tahapan === "Selesai").length} Misi
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            100% Selesai &amp; BAST Sah
          </small>
        </div>
      </div>

      {/* ACTIVE MISSION HIGHLIGHT BANNER */}
      {activeMission ? (
        <div
          style={{
            background: "linear-gradient(135deg, #013220 0%, #03472e 100%)",
            color: "#ffffff",
            borderRadius: "16px",
            padding: "22px 26px",
            margin: "0 0 28px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "18px",
            boxShadow: "0 4px 20px rgba(1, 50, 32, 0.12)",
          }}
        >
          <div style={{ maxWidth: "680px" }}>
            <span
              style={{
                background: "rgba(255, 255, 255, 0.16)",
                color: "#ffffff",
                padding: "4px 12px",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "8px",
              }}
            >
              <AppIcon name="truck" size={14} /> Misi Resmi: {activeMission.kode_misi} ({activeMission.status_tahapan})
            </span>
            <h3 style={{ margin: "2px 0 6px", fontSize: "1.25rem", color: "#ffffff", fontWeight: 800 }}>
              Distribusi Logistik: {activeMission.muatan}
            </h3>
            <p style={{ margin: 0, fontSize: "0.86rem", opacity: 0.9, lineHeight: 1.45 }}>
              Tujuan: {activeMission.posko?.nama_posko || "Posko BPBD Kabupaten Buduran (Posko Induk)"} · Armada: {activeMission.armada_info}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPage("tasks")}
            style={{
              background: "#ffffff",
              color: "#013220",
              border: "none",
              borderRadius: "10px",
              padding: "10px 20px",
              fontSize: "0.88rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              transition: "transform 0.15s ease",
            }}
          >
            <span>Buka Konsol Misi Lapangan</span>
            <AppIcon name="arrow-right" size={14} />
          </button>
        </div>
      ) : pendingClaim ? (
        <div
          style={{
            background: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "16px",
            padding: "20px 24px",
            margin: "0 0 28px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <span
              style={{
                background: "rgba(217, 119, 6, 0.15)",
                color: "#b45309",
                padding: "4px 12px",
                borderRadius: "999px",
                fontSize: "0.8rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "6px",
              }}
            >
              <AppIcon name="clock" size={14} /> Klaim Menunggu Persetujuan Koordinator Posko
            </span>
            <h3 style={{ margin: "2px 0 4px", color: "#92400e", fontSize: "1.1rem", fontWeight: 700 }}>
              Proposal Bantuan: {pendingClaim.item_bantuan}
            </h3>
            <p style={{ margin: 0, color: "#78350f", fontSize: "0.85rem" }}>
              Komitmen {pendingClaim.claimed_volume || pendingClaim.target_volume} telah dikirim ke Posko. Izin jalan dan misi lapangan akan terbit begitu posko menyetujui.
            </p>
          </div>
        </div>
      ) : null}

      {/* OPEN NEEDS MARKETPLACE / BOARD */}
      <section style={{ marginTop: "4px" }}>
        <div style={{ marginBottom: "18px" }}>
          <span className="eyebrow" style={{ color: "#80866e", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.78rem" }}>
            BURSA BANTUAN TERBUKA
          </span>
          <h2 style={{ margin: "4px 0 4px", color: "#013220", fontSize: "1.35rem", fontWeight: 800 }}>
            Kebutuhan Terbuka yang Dipublish Posko Wilayah
          </h2>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
            Silakan ajukan komitmen bantuan logistik sesuai kapasitas organisasi atau armada Anda.
          </p>
        </div>

        {/* 2-TIER FILTER TOOLBAR FOR OPEN NEEDS */}
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
          {/* Row 1: Urgency Filter Tabs */}
          <div className="posko-toolbar-tabs">
            {urgencyTabs.map((tabItem) => {
              const isActive = filterUrgency === tabItem.label;
              return (
                <button
                  key={tabItem.label}
                  type="button"
                  onClick={() => {
                    setFilterUrgency(tabItem.label);
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
                placeholder="Cari komoditas bantuan, nama posko, kelurahan, atau kecamatan..."
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
                {openNeeds.length} kebutuhan
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

        {/* CARDS LIST */}
        {filteredNeeds.length === 0 ? (
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
              <AppIcon name="box" size={24} />
            </div>
            <h3 style={{ margin: "0 0 6px", color: "#013220", fontSize: "1.1rem", fontWeight: 700 }}>
              Belum Ada Kebutuhan Terbuka
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem" }}>
              Saat ini semua kebutuhan telah teralokasi atau tidak ada data yang sesuai dengan filter pencarian Anda.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {paginatedNeeds.map((need) => {
              const isClaimedByMe = need.status === "Klaim Diajukan";
              const targetNum = parseInt(need.target_volume.replace(/[^0-9]/g, "")) || 1000;
              const unit = need.target_volume.replace(/[0-9.,]/g, "").trim() || "Unit";
              const fulfilledNum = parseInt((need.volume_terpenuhi || "0").replace(/[^0-9]/g, "")) || 0;
              const shortage = Math.max(0, targetNum - fulfilledNum);
              const pct = Math.min(100, Math.round((fulfilledNum / targetNum) * 100));

              const urgencyClass = (need.urgensi || "sedang").toLowerCase().replace(/\s+/g, "-");

              return (
                <div
                  key={need.id}
                  className="posko-case-card"
                  style={{
                    border: isClaimedByMe
                      ? "1px solid #fde68a"
                      : "1px solid rgba(1, 50, 32, 0.12)",
                  }}
                >
                  {/* 1. Header Row */}
                  <div className="posko-case-header-row">
                    <div className="posko-case-badges">
                      <span className="posko-case-id-badge">BURSA-{need.id}</span>
                      <span className={`posko-case-urgency-badge urgency-${urgencyClass}`}>
                        Prioritas {need.urgensi}
                      </span>
                      <span className="posko-case-status-badge status-pending">
                        {need.status}
                      </span>
                    </div>

                    <div className="posko-case-date">
                      <AppIcon name="pin" size={13} style={{ color: "#80866e" }} />
                      <span>{need.posko?.nama_posko || "Posko Wilayah Jawa Timur"}</span>
                    </div>
                  </div>

                  {/* 2. Title */}
                  <div>
                    <h3 className="posko-case-title">
                      Kebutuhan {need.item_bantuan} · Target {need.target_volume}
                    </h3>
                  </div>

                  {/* 3. Metadata Row */}
                  <div className="posko-case-meta-row">
                    <span className="posko-case-meta-item">
                      <AppIcon name="pin" size={13} style={{ color: "#80866e" }} />
                      <span>
                        Lokasi:{" "}
                        <strong>
                          {need.kebutuhan?.desa
                            ? `${need.kebutuhan.desa}, ${need.kebutuhan.kecamatan || ""}`
                            : need.posko?.desa || "Area Bencana"}
                        </strong>
                      </span>
                    </span>
                    <span className="posko-case-meta-item">
                      <AppIcon name="users" size={13} style={{ color: "#80866e" }} />
                      <span>
                        Terdampak: <strong>{need.kebutuhan?.jumlah_kk || 1} KK</strong>
                      </span>
                    </span>
                  </div>

                  {/* 4. Balance Panel */}
                  <div className="posko-bursa-balance-box">
                    <div className="posko-bursa-balance-grid">
                      <div>
                        <span className="posko-bursa-metric-label">Target Kebutuhan</span>
                        <strong className="posko-bursa-metric-val">{need.target_volume}</strong>
                      </div>

                      <div>
                        <span className="posko-bursa-metric-label">Teralokasi Posko</span>
                        <strong
                          className="posko-bursa-metric-val"
                          style={{ color: fulfilledNum > 0 ? "#15803d" : "#64748b" }}
                        >
                          {fulfilledNum} {unit}
                        </strong>
                      </div>

                      <div>
                        <span className="posko-bursa-metric-label">Sisa Terbuka</span>
                        <strong
                          className="posko-bursa-metric-val"
                          style={{ color: shortage > 0 ? "#b45309" : "#15803d" }}
                        >
                          {shortage} {unit}
                        </strong>
                      </div>

                      <div>
                        <span className="posko-bursa-metric-label">Status Pemenuhan</span>
                        <strong
                          className="posko-bursa-metric-val"
                          style={{ color: pct >= 100 ? "#15803d" : "#013220" }}
                        >
                          {pct}% Terpenuhi
                        </strong>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="posko-bursa-progress-track">
                      <div
                        className="posko-bursa-progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 100 ? "#15803d" : "#013220",
                        }}
                      />
                    </div>
                  </div>

                  {/* 5. Dedicated Footer Action Bar */}
                  <div className="posko-case-footer-row">
                    <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
                      Kebutuhan sah terverifikasi: Siap disalurkan langsung oleh mitra bantuan.
                    </div>

                    <div className="posko-case-actions-cluster">
                      {isClaimedByMe ? (
                        <span
                          className="posko-case-status-badge status-clarify"
                          style={{
                            padding: "8px 16px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "0.84rem",
                          }}
                        >
                          <AppIcon name="clock" size={14} />
                          <span>Proposal Diajukan · Menunggu Posko</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openClaimModal(need)}
                          className="btn-case-verify"
                          title="Ajukan komitmen penugasan armada organisasi Anda"
                        >
                          <AppIcon name="handshake" size={14} />
                          <span>Ajukan Komitmen Penyaluran</span>
                          <AppIcon name="arrow-right" size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 6. Pagination Card */}
        {filteredNeeds.length > 0 && (
          <div className="posko-pagination-card">
            <div className="posko-pagination-info">
              <span>
                Menampilkan <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> dari{" "}
                <strong>{totalItems}</strong> kebutuhan terbuka
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
      </section>

      {/* CLAIM COMMITMENT MODAL */}
      {claimModalBursa && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(500px, 95%)", textAlign: "left", borderRadius: "16px", padding: "26px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "1.25rem", color: "#013220", margin: 0, fontWeight: 800 }}>
                Ajukan Komitmen Penyaluran
              </h2>
              <button
                type="button"
                onClick={() => setClaimModalBursa(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
              >
                <AppIcon name="x" size={18} />
              </button>
            </div>

            <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "0.88rem", lineHeight: 1.5 }}>
              Anda akan mengajukan alokasi resmi untuk <strong>{claimModalBursa.item_bantuan}</strong> kepada{" "}
              {claimModalBursa.posko?.nama_posko || "Posko BPBD Wilayah"}.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label className="reksa-form-label">Nama Organisasi / Satgas Penyalur</label>
                <input
                  type="text"
                  value={claimedOrg}
                  onChange={(e) => setClaimedOrg(e.target.value)}
                  className="reksa-input-field"
                />
              </div>

              <div>
                <label className="reksa-form-label">Informasi Armada Siaga &amp; Kapasitas</label>
                <input
                  type="text"
                  value={claimedArmada}
                  onChange={(e) => setClaimedArmada(e.target.value)}
                  placeholder="Contoh: Truk Tangki No. 02 · Kapasitas 500 L"
                  className="reksa-input-field"
                />
              </div>

              <div>
                <label className="reksa-form-label">Volume Bantuan yang Disanggupi</label>
                <input
                  type="text"
                  value={claimedVolume}
                  onChange={(e) => setClaimedVolume(e.target.value)}
                  placeholder={`Target: ${claimModalBursa.target_volume}`}
                  className="reksa-input-field"
                />
              </div>

              <div>
                <label className="reksa-form-label">Catatan / Rencana Operasional Penyaluran</label>
                <textarea
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  rows={3}
                  className="reksa-textarea-field"
                />
              </div>
            </div>

            <div className="modal-actions" style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
              <button
                type="button"
                className="btn-case-view"
                disabled={isSubmitting}
                onClick={() => setClaimModalBursa(null)}
              >
                Batal
              </button>
              <button
                type="button"
                className="btn-case-verify"
                disabled={isSubmitting}
                onClick={handleClaimSubmit}
              >
                {isSubmitting ? "Mengirim Komitmen..." : "Kirim Komitmen Bantuan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
