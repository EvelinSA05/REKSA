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
    <main className="workspace mitra-bursa-workspace">
      {/* 1. HEADER SECTION */}
      <div className="section-header" style={{ marginBottom: "24px" }}>
        <div>
          <span
            className="badge"
            style={{
              backgroundColor: "rgba(1, 50, 32, 0.08)",
              color: "#013220",
              border: "1px solid rgba(1, 50, 32, 0.2)",
              marginBottom: "8px",
              display: "inline-block",
            }}
          >
            KATALOG TERBUKA POSKO BPBD
          </span>
          <h1 style={{ fontSize: "2rem", fontWeight: "700", color: "#013220", margin: "4px 0" }}>
            Bursa Bantuan Kemanusiaan
          </h1>
          <p style={{ color: "#4B5563", fontSize: "0.95rem", maxWidth: "680px", margin: 0 }}>
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
          }}
        >
          <AppIcon name="clock" size={16} />
          <span>Penawaran Saya</span>
          <AppIcon name="arrow-right" size={14} />
        </button>
      </div>

      {/* 2. 4-COLUMN MONOCHROME METRIC CARDS */}
      <div className="posko-metrics-grid-4" style={{ marginBottom: "24px" }}>
        <div className="posko-metric-card-mono">
          <div className="posko-metric-card-mono-header">
            <span>KEBUTUHAN TERBUKA</span>
            <div className="posko-metric-icon-box">
              <AppIcon name="box" size={18} />
            </div>
          </div>
          <div className="posko-metric-value-mono">{totalOpen} Item</div>
          <div className="posko-metric-sub-mono">Tersedia di Bursa</div>
        </div>

        <div className="posko-metric-card-mono">
          <div className="posko-metric-card-mono-header">
            <span>PRIORITAS KRITIS</span>
            <div className="posko-metric-icon-box">
              <AppIcon name="alert-triangle" size={18} />
            </div>
          </div>
          <div className="posko-metric-value-mono">{countKritis} Kritis</div>
          <div className="posko-metric-sub-mono">Perlu Segera Ditangani</div>
        </div>

        <div className="posko-metric-card-mono">
          <div className="posko-metric-card-mono-header">
            <span>PRIORITAS TINGGI</span>
            <div className="posko-metric-icon-box">
              <AppIcon name="clock" size={18} />
            </div>
          </div>
          <div className="posko-metric-value-mono">{countTinggi} Tinggi</div>
          <div className="posko-metric-sub-mono">Kebutuhan Mendesak</div>
        </div>

        <div className="posko-metric-card-mono">
          <div className="posko-metric-card-mono-header">
            <span>PRIORITAS SEDANG</span>
            <div className="posko-metric-icon-box">
              <AppIcon name="check" size={18} />
            </div>
          </div>
          <div className="posko-metric-value-mono">{countSedang} Sedang</div>
          <div className="posko-metric-sub-mono">Alokasi Bertahap</div>
        </div>
      </div>

      {/* 3. 2-TIER TOOLBAR */}
      <div className="posko-filter-toolbar" style={{ marginBottom: "20px" }}>
        {/* Tier 1: Urgency Filter Tabs */}
        <div className="posko-filter-tier-1">
          {urgencyTabs.map((tab) => (
            <button
              key={tab.label}
              type="button"
              className={`posko-tab-pill ${filterUrgency === tab.label ? "active" : ""}`}
              onClick={() => handleTabChange(tab.label)}
            >
              <span>{tab.label === "Semua" ? "Semua Kebutuhan" : `Prioritas ${tab.label}`}</span>
              <span className="posko-tab-pill-badge">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Tier 2: Live Search Input & Counter */}
        <div className="posko-filter-tier-2">
          <div style={{ position: "relative", flex: 1, minWidth: "260px" }}>
            <span
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6B7280",
                display: "flex",
                alignItems: "center",
              }}
            >
              <AppIcon name="search" size={16} />
            </span>
            <input
              type="text"
              placeholder="Cari komoditas bantuan, nama posko, kelurahan, atau kecamatan..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="posko-search-input"
              style={{ paddingLeft: "40px" }}
            />
          </div>
          <span className="posko-search-counter">
            Menampilkan <strong>{filteredItems.length === 0 ? 0 : startIndex + 1}–{Math.min(startIndex + pageSize, filteredItems.length)}</strong> dari <strong>{filteredItems.length}</strong> kebutuhan terbuka
          </span>
        </div>
      </div>

      {/* 4. OPEN NEEDS CASES LIST */}
      {paginatedItems.length === 0 ? (
        <div
          className="card"
          style={{
            background: "#ffffff",
            border: "1px solid #E5E7EB",
            borderRadius: "16px",
            padding: "48px 24px",
            textAlign: "center",
            margin: "24px 0",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "16px",
              background: "rgba(1, 50, 32, 0.08)",
              color: "#013220",
              display: "grid",
              placeItems: "center",
              margin: "0 auto 16px",
            }}
          >
            <AppIcon name="box" size={28} />
          </div>
          <h3 style={{ margin: "0 0 8px", color: "#013220", fontSize: "1.2rem", fontWeight: 700 }}>
            Tidak Ada Kebutuhan Terbuka Ditemukan
          </h3>
          <p style={{ color: "#6B7280", fontSize: "0.92rem", margin: 0, maxWidth: "520px", marginLeft: "auto", marginRight: "auto" }}>
            {search.trim()
              ? `Tidak ada kebutuhan terbuka yang cocok dengan kata kunci "${search}". Silakan coba kata kunci lain.`
              : "Seluruh kebutuhan logistik di bursa posko saat ini telah terpenuhi atau masih dalam proses verifikasi tim lapangan."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "20px" }}>
          {paginatedItems.map((item) => {
            const locName = item.posko
              ? `${item.posko.desa ? item.posko.desa + ", " : ""}${item.posko.kecamatan ? item.posko.kecamatan + ", " : ""}${item.posko.kabupaten || "Wilayah Posko"}`
              : item.kebutuhan?.desa
              ? `${item.kebutuhan.desa}, ${item.kebutuhan.kecamatan || ""}, ${item.kebutuhan.kabupaten || ""}`
              : "Posko Wilayah Penampungan";

            const { num: targetNum, unit } = parseVolume(item.target_volume);
            const { num: filledNum } = parseVolume(item.volume_terpenuhi || "0");
            const pct = targetNum > 0 ? Math.min(100, Math.round((filledNum / targetNum) * 100)) : 0;
            const sisaNum = Math.max(0, targetNum - filledNum);
            const isClaimedByMe = item.status === "Klaim Diajukan";

            return (
              <div key={item.id} className="posko-case-card">
                {/* Top Bar: Badges + Posko Source */}
                <div className="posko-case-top">
                  <div className="posko-case-badges">
                    <span className="posko-badge-id">BURSA-{item.id}</span>
                    <span
                      className="badge"
                      style={{
                        backgroundColor:
                          item.urgensi === "Kritis" ? "#FEE2E2" : item.urgensi === "Tinggi" ? "#FEF3C7" : "#E0E7FF",
                        color:
                          item.urgensi === "Kritis" ? "#991B1B" : item.urgensi === "Tinggi" ? "#92400E" : "#3730A3",
                        fontWeight: 700,
                        fontSize: "0.78rem",
                        padding: "3px 10px",
                        borderRadius: "6px",
                      }}
                    >
                      Prioritas {item.urgensi}
                    </span>
                    <span
                      className="posko-badge-status"
                      style={{
                        backgroundColor: isClaimedByMe ? "#FEF3C7" : "#EFF6FF",
                        color: isClaimedByMe ? "#92400E" : "#1D4ED8",
                        fontWeight: 600,
                        fontSize: "0.78rem",
                        padding: "3px 10px",
                        borderRadius: "6px",
                      }}
                    >
                      {item.status || "Terbuka"}
                    </span>
                  </div>

                  <span className="posko-case-origin">
                    <AppIcon name="map-pin" size={14} />
                    <span>{item.posko?.nama_posko || "Posko BPBD Wilayah"}</span>
                  </span>
                </div>

                {/* Main Content: Title & Location */}
                <h3 className="posko-case-title">
                  {item.item_bantuan} · Target {item.target_volume}
                </h3>
                <div className="posko-case-meta">
                  <span>
                    <AppIcon name="map" size={14} />
                    Lokasi: <strong>{locName}</strong>
                  </span>
                  <span>
                    <AppIcon name="users" size={14} />
                    Terdampak: <strong>{item.kebutuhan?.jumlah_kk || 1} KK</strong>
                  </span>
                  {item.kebutuhan?.deskripsi && (
                    <span style={{ color: "#6B7280" }}>
                      · {item.kebutuhan.deskripsi.slice(0, 60)}...
                    </span>
                  )}
                </div>

                {/* 4-Column Telemetry Box */}
                <div className="posko-case-metrics">
                  <div className="posko-case-metric-col">
                    <span className="posko-case-metric-label">TARGET KEBUTUHAN</span>
                    <strong className="posko-case-metric-val">{item.target_volume}</strong>
                  </div>
                  <div className="posko-case-metric-col">
                    <span className="posko-case-metric-label">TERALOKASI POSKO</span>
                    <strong className="posko-case-metric-val">{item.volume_terpenuhi || "0"}</strong>
                  </div>
                  <div className="posko-case-metric-col">
                    <span className="posko-case-metric-label">SISA TERBUKA</span>
                    <strong className="posko-case-metric-val" style={{ color: "#92400e" }}>
                      {sisaNum} {unit}
                    </strong>
                  </div>
                  <div className="posko-case-metric-col">
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span className="posko-case-metric-label">STATUS PEMENUHAN</span>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#013220" }}>{pct}%</span>
                    </div>
                    <div
                      style={{
                        height: "6px",
                        backgroundColor: "#E5E7EB",
                        borderRadius: "999px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          backgroundColor: pct >= 100 ? "#059669" : "#013220",
                          borderRadius: "999px",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="posko-case-footer">
                  <span style={{ fontSize: "0.82rem", color: "#6B7280" }}>
                    {isClaimedByMe
                      ? "Proposal Anda telah terdaftar dan menunggu persetujuan posko."
                      : "Kebutuhan sah terverifikasi: Siap disalurkan langsung oleh mitra bantuan."}
                  </span>

                  {isClaimedByMe ? (
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#FEF3C7",
                        color: "#92400E",
                        padding: "8px 14px",
                        borderRadius: "8px",
                        fontWeight: 700,
                        fontSize: "0.85rem",
                      }}
                    >
                      <AppIcon name="clock" size={15} />
                      <span>Proposal Diajukan</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="reksa-btn reksa-btn-primary"
                      onClick={() => openOfferModal(item)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        background: "#013220",
                        color: "#ffffff",
                        fontWeight: 600,
                        fontSize: "0.88rem",
                        padding: "9px 18px",
                        borderRadius: "8px",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      <AppIcon name="handshake" size={16} />
                      <span>Ajukan Komitmen Bantuan</span>
                      <AppIcon name="arrow-right" size={14} />
                    </button>
                  )}
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
            Menampilkan <strong>{startIndex + 1}</strong> – <strong>{Math.min(startIndex + pageSize, filteredItems.length)}</strong> dari <strong>{filteredItems.length}</strong> kebutuhan terbuka
            <span
              style={{
                marginLeft: "10px",
                fontSize: "0.75rem",
                background: "#E5E7EB",
                color: "#374151",
                padding: "2px 8px",
                borderRadius: "6px",
                fontWeight: 600,
              }}
            >
              Maks. 5 data per halaman
            </span>
          </div>

          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button
              type="button"
              className="posko-pagination-btn"
              disabled={validCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              ← Sebelumnya
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={`posko-pagination-page ${validCurrentPage === page ? "active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="posko-pagination-btn"
              disabled={validCurrentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Selanjutnya →
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
