import { useState, useMemo } from "react";
import { BursaItem, apiService } from "../../services/api";
import { AppIcon } from "../common/Icons";

interface MitraBursaBantuanProps {
  bursaList: BursaItem[];
  userOrg?: string;
  userName?: string;
  onRefresh?: () => Promise<void> | void;
  notify?: (msg: string) => void;
  onNavigateToMyOffers: () => void;
}

export function MitraBursaBantuan({
  bursaList,
  userOrg = "Satgas BPBD / Mitra Kemanusiaan",
  userName = "Arif Nugroho",
  onRefresh,
  notify,
  onNavigateToMyOffers,
}: MitraBursaBantuanProps) {
  // Search & Filter state
  const [filterUrgency, setFilterUrgency] = useState<"Semua" | "Kritis" | "Tinggi" | "Sedang">("Semua");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Offer modal state
  const [modalBursa, setModalBursa] = useState<BursaItem | null>(null);
  const [offeredAmount, setOfferedAmount] = useState("");
  const [offeredUnit, setOfferedUnit] = useState("Unit");
  const [deliveryMethod, setDeliveryMethod] = useState<'serah_posko' | 'mandiri' | 'koordinasi'>('serah_posko');
  const [readinessTime, setReadinessTime] = useState("Hari ini, Siap Diserahkan ke Posko");
  const [fleetInfo, setFleetInfo] = useState("");
  const [notesInput, setNotesInput] = useState("Mitra siap menyerahkan pasokan barang kebutuhan ke Posko BPBD.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter open needs in bursa
  const openItems = useMemo(() => {
    return (bursaList || []).filter(
      (b) => b.status === "Terbuka" || b.status === "Klaim Diajukan" || b.status === "Sebagian Terpenuhi"
    );
  }, [bursaList]);

  // Counts for metric cards and tab pills
  const totalOpen = openItems.length;
  const countKritis = openItems.filter((b) => b.urgensi === "Kritis").length;
  const countTinggi = openItems.filter((b) => b.urgensi === "Tinggi").length;
  const countSedang = openItems.filter((b) => b.urgensi === "Sedang" || b.urgensi === "Normal").length;

  const urgencyTabs = [
    { label: "Semua" as const, count: totalOpen },
    { label: "Kritis" as const, count: countKritis },
    { label: "Tinggi" as const, count: countTinggi },
    { label: "Sedang" as const, count: countSedang },
  ];

  // Filtered items based on tab & live search
  const filteredItems = useMemo(() => {
    return openItems.filter((b) => {
      if (filterUrgency !== "Semua") {
        if (filterUrgency === "Sedang") {
          if (b.urgensi !== "Sedang" && b.urgensi !== "Normal") return false;
        } else if (b.urgensi !== filterUrgency) {
          return false;
        }
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const item = (b.item_bantuan || "").toLowerCase();
        const loc = (
          (b.posko?.nama_posko || "") +
          " " +
          (b.posko?.kabupaten || "") +
          " " +
          (b.posko?.kecamatan || "") +
          " " +
          (b.kebutuhan?.desa || "") +
          " " +
          (b.kebutuhan?.kecamatan || "") +
          " " +
          (b.kebutuhan?.kabupaten || "")
        ).toLowerCase();
        return item.includes(q) || loc.includes(q) || String(b.id).includes(q);
      }
      return true;
    });
  }, [openItems, filterUrgency, search]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + pageSize);

  const handleTabChange = (label: "Semua" | "Kritis" | "Tinggi" | "Sedang") => {
    setFilterUrgency(label);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const parseVolume = (volStr: string | number) => {
    if (typeof volStr === "number") return { num: volStr, unit: "" };
    if (!volStr) return { num: 0, unit: "" };
    const num = parseInt(volStr.replace(/[^0-9]/g, "")) || 0;
    const unit = volStr.replace(/[0-9.,]/g, "").trim() || "Unit";
    return { num, unit };
  };

  const openOfferModal = (item: BursaItem) => {
    setModalBursa(item);
    const { num, unit } = parseVolume(item.target_volume);
    setOfferedAmount(String(num || 100));
    setOfferedUnit(unit || "Unit");
    setDeliveryMethod('serah_posko');
    setFleetInfo("");
    setReadinessTime("Hari ini, Siap Diserahkan ke Posko");
    setNotesInput("Mitra siap menyerahkan pasokan barang kebutuhan ke Posko BPBD.");
  };

  const handleSubmitOffer = async () => {
    if (!modalBursa) return;
    try {
      setIsSubmitting(true);
      const num = parseInt(offeredAmount) || 100;
      const amountStr = `${num} ${offeredUnit}`;

      const res = await apiService.createPenawaran({
        bursa_id: modalBursa.id,
        jumlah_tawaran: amountStr,
        volume_angka: num,
        satuan: offeredUnit,
        metode_penyaluran: deliveryMethod,
        kategori_komoditas: modalBursa.item_bantuan,
        waktu_kesiapan: readinessTime,
        armada_info: deliveryMethod === 'mandiri' ? (fleetInfo || 'Armada Mandiri Mitra') : undefined,
        organisasi: userOrg,
        catatan: notesInput,
      });

      if (res.success) {
        notify?.(`Penawaran bantuan ${modalBursa.item_bantuan} (${amountStr}) berhasil diajukan ke Posko!`);
        setModalBursa(null);
        await onRefresh?.();
        onNavigateToMyOffers();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal mengajukan penawaran bantuan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="workspace responder-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
      {/* 1. HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <span className="eyebrow" style={{ color: "#80866e", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.78rem" }}>
            KATALOG TERBUKA POSKO BPBD
          </span>
          <h1 style={{ margin: "4px 0 6px", color: "#013220", fontSize: "1.75rem", fontWeight: 800 }}>
            Bursa Bantuan Kemanusiaan
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem", maxWidth: "680px", lineHeight: 1.5 }}>
            Daftar kebutuhan logistik warga terdampak yang telah divalidasi resmi oleh Posko. Silakan ajukan komitmen pemenuhan logistik atau kesiapan armada penyalur organisasi Anda.
          </p>
        </div>

        <button
          type="button"
          className="reksa-btn reksa-btn-secondary"
          onClick={onNavigateToMyOffers}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#ffffff",
            border: "1.5px solid rgba(1, 50, 32, 0.25)",
            color: "#013220",
            fontWeight: 700,
            padding: "10px 18px",
            borderRadius: "10px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.03)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <AppIcon name="clock" size={16} />
          <span>Penawaran Saya</span>
          <AppIcon name="arrow-right" size={14} />
        </button>
      </div>

      {/* 2. 4-COLUMN MONOCHROME METRIC CARDS */}
      <div className="posko-metrics-grid-4" style={{ marginBottom: "24px" }}>
        {/* Card 1: Kebutuhan Terbuka */}
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
              Kebutuhan Terbuka
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="box" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {totalOpen} Item
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Tersedia di Bursa Bantuan
          </small>
        </div>

        {/* Card 2: Prioritas Kritis */}
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
              Prioritas Kritis
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="alert-triangle" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {countKritis} Kritis
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Perlu Segera Ditangani
          </small>
        </div>

        {/* Card 3: Prioritas Tinggi */}
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
              Prioritas Tinggi
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="clock" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {countTinggi} Tinggi
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Kebutuhan Mendesak
          </small>
        </div>

        {/* Card 4: Prioritas Sedang */}
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
              Prioritas Sedang
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="check" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {countSedang} Sedang
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Alokasi Bertahap
          </small>
        </div>
      </div>

      {/* 3. 2-TIER FILTER TOOLBAR FOR OPEN NEEDS */}
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
                onClick={() => handleTabChange(tabItem.label)}
                className={`posko-tab-pill ${isActive ? "active" : ""}`}
              >
                <span>{tabItem.label === "Semua" ? "Semua Kebutuhan" : `Prioritas ${tabItem.label}`}</span>
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
              onChange={(e) => handleSearchChange(e.target.value)}
              className="posko-search-input"
            />
            {search && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="posko-search-clear-btn"
                title="Hapus kata kunci pencarian"
              >
                ×
              </button>
            )}
          </div>

          <div className="posko-search-meta">
            <span className="posko-search-count-text">
              Menampilkan <strong>{filteredItems.length > 0 ? `${startIndex + 1}-${Math.min(startIndex + pageSize, filteredItems.length)}` : 0}</strong> dari{" "}
              {totalOpen} kebutuhan
              {totalPages > 1 && ` (Halaman ${validCurrentPage}/${totalPages})`}
            </span>
            {search && (
              <span className="posko-search-query-tag">
                Filter: "{search}"
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. OPEN NEEDS CASES LIST */}
      {paginatedItems.length === 0 ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px dashed #cbd5e1",
            padding: "48px 24px",
            textAlign: "center",
            margin: "24px 0",
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
            Tidak Ada Kebutuhan Terbuka Ditemukan
          </h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem", maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
            {search.trim()
              ? `Tidak ada kebutuhan terbuka yang cocok dengan kata kunci "${search}". Silakan coba kata kunci lain.`
              : "Seluruh kebutuhan logistik di bursa posko saat ini telah terpenuhi atau masih dalam proses verifikasi tim lapangan."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
          {paginatedItems.map((item) => {
            const isClaimedByMe = item.status === "Klaim Diajukan";
            const targetNum = parseInt(item.target_volume.replace(/[^0-9]/g, "")) || 1000;
            const unit = item.target_volume.replace(/[0-9.,]/g, "").trim() || "Unit";
            const fulfilledNum = parseInt((item.volume_terpenuhi || "0").replace(/[^0-9]/g, "")) || 0;
            const shortage = Math.max(0, targetNum - fulfilledNum);
            const pct = Math.min(100, Math.round((fulfilledNum / targetNum) * 100));

            const urgencyClass = (item.urgensi || "sedang").toLowerCase().replace(/\s+/g, "-");
            const locName = item.kebutuhan?.desa
              ? `${item.kebutuhan.desa}, ${item.kebutuhan.kecamatan || ""}`
              : item.posko?.desa
              ? `${item.posko.desa}, ${item.posko.kecamatan || ""}`
              : item.posko?.nama_posko || "Area Bencana";

            return (
              <div
                key={item.id}
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
                    <span className="posko-case-id-badge">BURSA-{item.id}</span>
                    <span className={`posko-case-urgency-badge urgency-${urgencyClass}`}>
                      Prioritas {item.urgensi}
                    </span>
                    <span className="posko-case-status-badge status-pending">
                      {item.status || "Terbuka"}
                    </span>
                  </div>

                  <div className="posko-case-date">
                    <AppIcon name="pin" size={13} style={{ color: "#80866e" }} />
                    <span>{item.posko?.nama_posko || "Posko BPBD Wilayah"}</span>
                  </div>
                </div>

                {/* 2. Title */}
                <div>
                  <h3 className="posko-case-title">
                    Kebutuhan {item.item_bantuan} · Target {item.target_volume}
                  </h3>
                </div>

                {/* 3. Metadata Row */}
                <div className="posko-case-meta-row">
                  <span className="posko-case-meta-item">
                    <AppIcon name="pin" size={13} style={{ color: "#80866e" }} />
                    <span>
                      Lokasi: <strong>{locName}</strong>
                    </span>
                  </span>
                  <span className="posko-case-meta-item">
                    <AppIcon name="users" size={13} style={{ color: "#80866e" }} />
                    <span>
                      Terdampak: <strong>{item.kebutuhan?.jumlah_kk || 1} KK</strong>
                    </span>
                  </span>
                </div>

                {/* 4. Balance Panel */}
                <div className="posko-bursa-balance-box">
                  <div className="posko-bursa-balance-grid">
                    <div>
                      <span className="posko-bursa-metric-label">Target Kebutuhan</span>
                      <strong className="posko-bursa-metric-val">{item.target_volume}</strong>
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
                        onClick={() => openOfferModal(item)}
                        className="btn-case-verify"
                        title="Ajukan komitmen penugasan armada organisasi Anda"
                      >
                        <AppIcon name="handshake" size={14} />
                        <span>Ajukan Komitmen Bantuan</span>
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

      {/* 5. PAGINATION (5 ITEMS PER PAGE) */}
      {filteredItems.length > 0 && (
        <div className="posko-pagination-card">
          <div className="posko-pagination-info">
            <span>
              Menampilkan <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + pageSize, filteredItems.length)}</strong> dari{" "}
              <strong>{filteredItems.length}</strong> kebutuhan terbuka
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

      {/* 6. OFFER SUBMISSION MODAL */}
      {modalBursa && (
        <div className="modal-backdrop">
          <div
            className="modal"
            style={{
              width: "min(560px, 95%)",
              textAlign: "left",
              borderRadius: "18px",
              padding: "26px",
              background: "#ffffff",
              boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "16px",
                borderBottom: "1px solid #F3F4F6",
                paddingBottom: "14px",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#013220",
                    letterSpacing: "0.5px",
                    display: "inline-block",
                    marginBottom: "4px",
                  }}
                >
                  FORMULIR KOMITMEN MITRA BANTUAN
                </span>
                <h2 style={{ fontSize: "1.25rem", color: "#013220", margin: 0, fontWeight: 800 }}>
                  {modalBursa.item_bantuan}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalBursa(null)}
                style={{
                  background: "#F3F4F6",
                  border: "none",
                  borderRadius: "50%",
                  cursor: "pointer",
                  color: "#4B5563",
                  width: "32px",
                  height: "32px",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <AppIcon name="x" size={16} />
              </button>
            </div>

            <div
              style={{
                background: "#F0FDF4",
                padding: "12px 14px",
                borderRadius: "10px",
                border: "1px solid #BBF7D0",
                marginBottom: "18px",
                fontSize: "0.86rem",
                color: "#166534",
              }}
            >
              <strong>Posko Tujuan:</strong> {modalBursa.posko?.nama_posko || "Posko BPBD Wilayah"}<br />
              <strong>Target Kebutuhan:</strong> {modalBursa.target_volume} (Tersisa: {parseVolume(modalBursa.target_volume).num - parseVolume(modalBursa.volume_terpenuhi || "0").num} {parseVolume(modalBursa.target_volume).unit}).
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#1F2937", marginBottom: "4px" }}>
                    Volume yang Ditawarkan:
                  </label>
                  <input
                    type="number"
                    value={offeredAmount}
                    onChange={(e) => setOfferedAmount(e.target.value)}
                    placeholder="Contoh: 300"
                    className="posko-search-input"
                    style={{ width: "100%", borderRadius: "8px" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#1F2937", marginBottom: "4px" }}>
                    Satuan:
                  </label>
                  <input
                    type="text"
                    value={offeredUnit}
                    onChange={(e) => setOfferedUnit(e.target.value)}
                    className="posko-search-input"
                    style={{ width: "100%", borderRadius: "8px" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#1F2937", marginBottom: "6px" }}>
                  Metode Penyaluran Bantuan:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('serah_posko')}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: deliveryMethod === 'serah_posko' ? "2px solid #013220" : "1px solid #D1D5DB",
                      background: deliveryMethod === 'serah_posko' ? "#F0FDF4" : "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: deliveryMethod === 'serah_posko' ? 700 : 500,
                      color: deliveryMethod === 'serah_posko' ? "#013220" : "#374151",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                    }}
                  >
                    <AppIcon name="box" size={16} />
                    <span>Serah ke Gudang Posko</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryMethod('mandiri')}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "10px",
                      border: deliveryMethod === 'mandiri' ? "2px solid #013220" : "1px solid #D1D5DB",
                      background: deliveryMethod === 'mandiri' ? "#F0FDF4" : "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: deliveryMethod === 'mandiri' ? 700 : 500,
                      color: deliveryMethod === 'mandiri' ? "#013220" : "#374151",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "7px",
                    }}
                  >
                    <AppIcon name="truck" size={16} />
                    <span>Penyaluran Mandiri</span>
                  </button>
                </div>
              </div>

              {deliveryMethod === 'mandiri' && (
                <div>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#1F2937", marginBottom: "4px" }}>
                    Informasi Armada &amp; Pengemudi Mitra:
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Truk Box B 1234 CD · Kapasitas 2 Ton"
                    value={fleetInfo}
                    onChange={(e) => setFleetInfo(e.target.value)}
                    className="posko-search-input"
                    style={{ width: "100%", borderRadius: "8px" }}
                  />
                </div>
              )}

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#1F2937", marginBottom: "4px" }}>
                  Waktu Kesiapan Logistik:
                </label>
                <input
                  type="text"
                  value={readinessTime}
                  onChange={(e) => setReadinessTime(e.target.value)}
                  className="posko-search-input"
                  style={{ width: "100%", borderRadius: "8px" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 600, color: "#1F2937", marginBottom: "4px" }}>
                  Catatan Operasional Mitra:
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  className="posko-search-input"
                  style={{ width: "100%", borderRadius: "8px", height: "auto" }}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "20px",
                borderTop: "1px solid #F3F4F6",
                paddingTop: "16px",
              }}
            >
              <button
                type="button"
                className="reksa-btn reksa-btn-secondary"
                disabled={isSubmitting}
                onClick={() => setModalBursa(null)}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  background: "#F3F4F6",
                  color: "#374151",
                  border: "none",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>

              <button
                type="button"
                className="reksa-btn reksa-btn-primary"
                disabled={isSubmitting || !offeredAmount}
                onClick={handleSubmitOffer}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "9px 18px",
                  borderRadius: "8px",
                  background: "#013220",
                  color: "#ffffff",
                  border: "none",
                  fontWeight: 600,
                  cursor: isSubmitting || !offeredAmount ? "not-allowed" : "pointer",
                  opacity: isSubmitting || !offeredAmount ? 0.6 : 1,
                }}
              >
                <AppIcon name="check" size={15} />
                <span>{isSubmitting ? "Mengirim..." : "Kirim Penawaran ke Posko"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
