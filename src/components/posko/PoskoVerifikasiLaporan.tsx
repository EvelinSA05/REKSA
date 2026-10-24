import { useState, useEffect } from "react";
import { CaseRecord } from "../../App";
import { apiService } from "../../services/api";
import { AppIcon } from "../common/Icons";
import { evaluateCaseSla, getMitraByCommodity } from "../../utils/slaEscalationEngine";

interface PoskoVerifikasiLaporanProps {
  cases: CaseRecord[];
  onSelectCase: (c: CaseRecord) => void;
  onRefresh?: () => Promise<void> | void;
  notify?: (msg: string) => void;
  selectedCaseId?: string;
  update?: (changes: any, log?: string) => void;
}

const MITRA_PARTNERS = [
  {
    name: "Palang Merah Indonesia (PMI Cabang Jawa Timur)",
    badge: "Medis & Ambulans",
    color: "#dc2626",
    bg: "#fef2f2",
    desc: "Obat darurat, higiene kit, ambulans, pertolongan pertama, dan posko medis lapangan.",
  },
  {
    name: "BAZNAS Tanggap Bencana & Tagana Jatim",
    badge: "Pangan & Dapur Umum",
    color: "#059669",
    bg: "#ecfdf5",
    desc: "Dapur umum mandiri, paket sembako keluarga, makanan siap saji, dan selimut darurat.",
  },
  {
    name: "Muhammadiyah Disaster Management Center (MDMC)",
    badge: "Shelter & Tenda",
    color: "#0284c7",
    bg: "#f0f9ff",
    desc: "Tenda pleton/keluarga, terpal pengungsi, matras tidur, dan hunian darurat.",
  },
  {
    name: "Dompet Dhuafa & Sahabat Relawan Anak",
    badge: "Balita, Nutrisi & Lansia",
    color: "#d97706",
    bg: "#fffbeb",
    desc: "Susu formula, popok balita/lansia, bubur bayi, biskuit nutrisi, dan trauma healing.",
  },
  {
    name: "Sedekah Air & Senkom Siaga Bencana",
    badge: "Air Bersih & WASH",
    color: "#2563eb",
    bg: "#eff6ff",
    desc: "Tandon air bersih, mobil tangki air, filter air minum, dan sanitasi MCK darurat.",
  },
];

export function PoskoVerifikasiLaporan({
  cases,
  onSelectCase,
  onRefresh,
  notify,
  selectedCaseId,
  update,
}: PoskoVerifikasiLaporanProps) {
  const [tab, setTab] = useState<"all" | "pending" | "escalated" | "clarify" | "verified" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);

  // Local state for tracking reports escalated to Mitra due to SLA timeout
  const [localEscalatedIds, setLocalEscalatedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("reksa_escalated_case_ids") || "[]");
    } catch {
      return [];
    }
  });

  const handleSimulateEscalate = (c: CaseRecord) => {
    const partner = c.mitraHandler || getMitraByCommodity(c.item, c.location);
    const next = Array.from(new Set([...localEscalatedIds, c.id]));
    setLocalEscalatedIds(next);
    localStorage.setItem("reksa_escalated_case_ids", JSON.stringify(next));

    const updated = cases.map((item) => {
      if (item.id === c.id) {
        return {
          ...item,
          escalatedToMitra: true,
          status: "Menunggu Verifikasi Mitra",
          mitraHandler: partner,
        };
      }
      return item;
    });
    update?.({ casesList: updated });
    localStorage.setItem("reksa_cases_db", JSON.stringify(updated));

    notify?.(`Laporan ${c.id} dialihkan ke ${partner} untuk diverifikasi langsung oleh Mitra sebelum masuk Bursa.`);
  };

  useEffect(() => {
    if (selectedCaseId) {
      const found = cases.find((c) => c.id.toLowerCase() === selectedCaseId.toLowerCase());
      if (found) {
        const isEscalated = found.escalatedToMitra || localEscalatedIds.includes(found.id);
        const s = (found.status || "").toLowerCase();
        if (isEscalated) setTab("escalated");
        else if (s.includes("klarifikasi")) setTab("clarify");
        else if (s.includes("verifikasi") || s === "diajukan" || s === "baru") setTab("pending");
        else if (s.includes("tolak")) setTab("rejected");
        else setTab("verified");
      }
    }
  }, [selectedCaseId, cases, localEscalatedIds]);

  // Modals
  const [modalAction, setModalAction] = useState<"verify" | "clarify" | "reject" | "further" | "escalate" | null>(null);
  const [selectedMitra, setSelectedMitra] = useState<string>("");
  const [priorityChoice, setPriorityChoice] = useState("Kritis");
  const [notesInput, setNotesInput] = useState("");
  const [clarificationCategory, setClarificationCategory] = useState("Foto / Bukti Fisik Buram / Kurang Jelas");
  const [requestAttachment, setRequestAttachment] = useState(true);
  const [rejectionFollowUp, setRejectionFollowUp] = useState("Silakan berkoordinasi dengan pengurus RT/RW setempat atau laporkan langsung ke Posko BPBD terdekat di kantor kelurahan/kecamatan.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filterCases = cases.filter((c) => {
    const s = (c.status || "").toLowerCase();
    const isEscalated = c.escalatedToMitra || localEscalatedIds.includes(c.id);
    let matchesTab = true;

    if (tab === "pending") {
      matchesTab = !isEscalated && (s.includes("verifikasi") || s === "diajukan" || s === "baru");
    } else if (tab === "escalated") {
      matchesTab = isEscalated;
    } else if (tab === "clarify") {
      matchesTab = s.includes("klarifikasi");
    } else if (tab === "verified") {
      matchesTab = s.includes("terbuka") || s.includes("sebagian") || s.includes("teralokasi") || s.includes("pengiriman") || s.includes("selesai");
    } else if (tab === "rejected") {
      matchesTab = s.includes("tolak");
    }

    if (!matchesTab) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      const code = (c.id || "").toLowerCase();
      const item = (c.item || "").toLowerCase();
      const loc = (c.location || "").toLowerCase();
      const name = (c.applicantName || "").toLowerCase();
      return code.includes(q) || item.includes(q) || loc.includes(q) || name.includes(q);
    }
    return true;
  });

  // Pagination calculation (maksimal 5 data per halaman)
  const totalItems = filterCases.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedCases = filterCases.slice(startIndex, endIndex);

  const openActionModal = (c: CaseRecord, action: "verify" | "clarify" | "reject" | "further" | "escalate") => {
    setSelectedCase(c);
    setModalAction(action);
    setPriorityChoice(c.urgency === "Kritis" || c.urgency === "Tinggi" ? c.urgency : "Tinggi");
    setNotesInput("");
    if (action === "clarify") {
      setClarificationCategory("Foto / Bukti Fisik Buram / Kurang Jelas");
      setRequestAttachment(true);
    } else if (action === "reject") {
      setRejectionFollowUp("Silakan berkoordinasi dengan pengurus RT/RW setempat atau laporkan langsung ke Posko BPBD terdekat di kantor kelurahan/kecamatan.");
    } else if (action === "escalate") {
      const rec = c.mitraHandler || getMitraByCommodity(c.item, c.location);
      setSelectedMitra(rec || MITRA_PARTNERS[0].name);
    }
  };

  const handleExecuteAction = async () => {
    if (!selectedCase) return;
    setIsSubmitting(true);

    // ─── OPTIMISTIC UPDATE ─────────────────────────────────────────────────
    if (modalAction === "escalate") {
      const chosenMitra = selectedMitra || selectedCase.mitraHandler || getMitraByCommodity(selectedCase.item, selectedCase.location) || MITRA_PARTNERS[0].name;
      const next = Array.from(new Set([...localEscalatedIds, selectedCase.id]));
      setLocalEscalatedIds(next);
      try {
        localStorage.setItem("reksa_escalated_case_ids", JSON.stringify(next));
      } catch (_) {}

      const updatedCases = cases.map((item) => {
        if (item.id === selectedCase.id) {
          return {
            ...item,
            escalatedToMitra: true,
            status: "Dialihkan ke Mitra",
            mitraHandler: chosenMitra,
            catatanPengalihan: notesInput || `Dialihkan resmi oleh Posko BPBD ke ${chosenMitra} untuk verifikasi & penyaluran cepat.`,
            escalatedAtRaw: new Date().toISOString(),
          };
        }
        return item;
      });

      update?.({ casesList: updatedCases });
      try {
        localStorage.setItem("reksa_cases_db", JSON.stringify(updatedCases));
      } catch (_) {}

      notify?.(`Laporan ${selectedCase.id} dialihkan ke ${chosenMitra}! Laporan kini dapat dipantau di tab 'Dialihkan ke Mitra'.`);
      setModalAction(null);
      setSelectedCase(null);
      setIsSubmitting(false);

      try {
        await apiService.verifyKebutuhan(selectedCase.id, {
          action: "escalate",
          mitra: chosenMitra,
          catatan: notesInput,
        });
        onRefresh?.().catch(() => {});
      } catch (_) {}
      return;
    }
    // Update state lokal LANGSUNG agar UI tidak perlu menunggu server
    const optimisticStatus =
      modalAction === "verify"
        ? "Kebutuhan Terbuka"
        : modalAction === "clarify"
        ? "Menunggu Klarifikasi Warga"
        : modalAction === "reject"
        ? "Ditolak Posko"
        : "Menunggu Verifikasi Lapangan";

    const notifMsg =
      modalAction === "verify"
        ? `Laporan ${selectedCase.id} diverifikasi & diterbitkan ke Bursa Bantuan Terbuka!`
        : modalAction === "clarify"
        ? `Permintaan klarifikasi untuk laporan ${selectedCase.id} berhasil dikirim!`
        : modalAction === "reject"
        ? `Laporan ${selectedCase.id} ditolak dengan alasan tersimpan.`
        : `Laporan ${selectedCase.id} ditandai untuk pemeriksaan lanjutan.`;

    // Update state React secara optimistik
    const updatedCases = cases.map((c) =>
      c.id === selectedCase.id
        ? {
            ...c,
            status: optimisticStatus,
            urgency: modalAction === "verify" ? priorityChoice : c.urgency,
            catatanVerifikasiPosko:
              notesInput || c.catatanVerifikasiPosko,
          }
        : c
    );
    update?.({ casesList: updatedCases });
    // Simpan ke localStorage agar persistent saat refresh
    try {
      localStorage.setItem("reksa_cases_db", JSON.stringify(updatedCases));
    } catch (_) {}

    // Tampilkan notifikasi & tutup modal SEGERA (sebelum server response)
    notify?.(notifMsg);
    setModalAction(null);
    setSelectedCase(null);
    setIsSubmitting(false);

    // ─── REQUEST SERVER DI BACKGROUND ─────────────────────────────────────
    // Kirim ke server tanpa memblokir UI
    try {
      if (modalAction === "verify") {
        await apiService.verifyKebutuhan(selectedCase.id, {
          action: "verify_and_publish",
          priority: priorityChoice,
          catatan: notesInput || "Data terverifikasi sah oleh Koordinator Posko dan dirilis ke Bursa Bantuan.",
        });
      } else if (modalAction === "clarify") {
        await apiService.verifyKebutuhan(selectedCase.id, {
          action: "clarify",
          kategori_klarifikasi: clarificationCategory,
          pertanyaan: notesInput || `Mohon lengkapi perbaikan ${clarificationCategory.toLowerCase()} untuk laporan kebutuhan ini.`,
          meminta_lampiran: requestAttachment,
          catatan: notesInput,
        });
      } else if (modalAction === "reject") {
        await apiService.verifyKebutuhan(selectedCase.id, {
          action: "reject",
          alasan: notesInput || "Laporan tidak sesuai fakta lapangan posko.",
          tindak_lanjut: rejectionFollowUp,
        });
      } else if (modalAction === "further") {
        await apiService.verifyKebutuhan(selectedCase.id, {
          action: "review_further",
          catatan: notesInput || "Menunggu verifikasi lapangan tim assessment.",
        });
      }
      // Refresh data di background (silent) tanpa notifikasi tambahan
      onRefresh?.().catch(() => {});
    } catch (err: any) {
      // Jika server gagal, beri tahu pengguna tapi state lokal tetap tersimpan
      notify?.(`Catatan: sinkronisasi server tertunda (${err?.message || "timeout"}). Data sudah tersimpan lokal.`);
    }
  };

  const escalatedCount = cases.filter((c) => c.escalatedToMitra || localEscalatedIds.includes(c.id)).length;
  const pendingCount = cases.filter((c) => {
    const isEsc = c.escalatedToMitra || localEscalatedIds.includes(c.id);
    const s = (c.status || "").toLowerCase();
    return !isEsc && (s.includes("verifikasi") || s === "diajukan" || s === "baru");
  }).length;
  const clarifyCount = cases.filter((c) => (c.status || "").toLowerCase().includes("klarifikasi")).length;
  const verifiedCount = cases.filter((c) => (c.status || "").toLowerCase().includes("terbuka") || (c.status || "").toLowerCase().includes("sebagian") || (c.status || "").toLowerCase().includes("teralokasi") || (c.status || "").toLowerCase().includes("selesai")).length;
  const rejectedCount = cases.filter((c) => (c.status || "").toLowerCase().includes("tolak")).length;

  return (
    <main className="workspace posko-verifikasi-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
      {/* Title bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <span className="eyebrow" style={{ color: "#80866e", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.78rem" }}>
            MODUL KOORDINATOR POSKO WILAYAH
          </span>
          <h1 style={{ margin: "4px 0 6px", color: "#013220", fontSize: "1.75rem", fontWeight: 800 }}>
            Verifikasi &amp; Validasi Laporan Warga
          </h1>
          {/* <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem", maxWidth: "680px", lineHeight: 1.5 }}>
            Periksa keabsahan permohonan warga, tetapkan prioritas kedaruratan, minta klarifikasi foto atau data fisik, dan rilis kuota sah ke Bursa Kemitraan.
          </p> */}
        </div>
        <div style={{ background: "#ffffff", border: "1px solid rgba(1, 50, 32, 0.12)", padding: "8px 14px", borderRadius: "10px", fontSize: "0.84rem", fontWeight: 700, color: "#013220", display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#15803d" }} />
          <span>Antrean Posko ({cases.length} Total Laporan)</span>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR TOOLBAR */}
      <div className="posko-verifikasi-toolbar">
        {/* Status Tabs Bar */}
        <div className="posko-toolbar-tabs">
          {[
            { id: "pending", label: "Menunggu Verifikasi", count: pendingCount },
            { id: "escalated", label: "Dialihkan ke Mitra", count: escalatedCount, hasIcon: true },
            { id: "clarify", label: "Perlu Klarifikasi", count: clarifyCount },
            { id: "verified", label: "Terverifikasi / Terbuka", count: verifiedCount },
            { id: "rejected", label: "Ditolak", count: rejectedCount },
            { id: "all", label: "Semua Laporan", count: cases.length },
          ].map((tabItem) => {
            const isActive = tab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                onClick={() => {
                  setTab(tabItem.id as any);
                  setCurrentPage(1);
                }}
                className={`posko-tab-pill ${isActive ? "active" : ""}`}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {tabItem.hasIcon && <AppIcon name="bolt" size={13} />}
                  <span>{tabItem.label}</span>
                </span>
                <span className={`tab-count-badge ${isActive ? "badge-active" : ""}`}>
                  {tabItem.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Bar & Counter Row */}
        <div className="posko-toolbar-search-row">
          <div className="posko-search-input-wrap">
            <span className="posko-search-icon">
              <AppIcon name="search" size={15} />
            </span>
            <input
              type="text"
              placeholder="Cari berdasarkan kode kasus, nama warga, komoditas, kelurahan, atau kecamatan..."
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
              Menampilkan <strong>{totalItems > 0 ? `${startIndex + 1}-${endIndex}` : 0}</strong> dari {cases.length} laporan
              {totalPages > 1 && ` (Halaman ${validPage}/${totalPages})`}
            </span>
            {search && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span className="posko-search-query-tag">
                  Filter: "{search}"
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setCurrentPage(1);
                  }}
                  style={{
                    background: "#013220",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "3px 10px",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                  title="Hapus filter dan tampilkan seluruh data"
                >
                  Tampilkan Semua
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CASES QUEUE LIST */}
      {filterCases.length === 0 ? (
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
            <AppIcon name="file" size={24} />
          </div>
          <h3 style={{ margin: "0 0 6px", color: "#013220", fontSize: "1.1rem", fontWeight: 700 }}>
            Tidak Ada Laporan di Antrean Ini
          </h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem" }}>
            Semua laporan telah diproses atau belum ada data yang sesuai dengan filter pencarian Anda.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {paginatedCases.map((c) => {
            const isEscalated = c.escalatedToMitra || localEscalatedIds.includes(c.id);
            const isPending = !isEscalated && ((c.status || "").toLowerCase().includes("verifikasi") || c.status === "Diajukan" || c.status === "Baru");
            const isClarify = (c.status || "").toLowerCase().includes("klarifikasi");
            const isRejected = (c.status || "").toLowerCase().includes("tolak");
            const isVerified = (c.status || "").toLowerCase().includes("terbuka") || (c.status || "").toLowerCase().includes("sebagian") || (c.status || "").toLowerCase().includes("teralokasi") || (c.status || "").toLowerCase().includes("selesai");

            const cardStateClass = isEscalated ? "card-clarify" : isRejected ? "card-rejected" : isClarify ? "card-clarify" : isVerified ? "card-verified" : "card-pending";
            const statusClass = isEscalated ? "status-clarify" : isVerified ? "status-verified" : isRejected ? "status-rejected" : isClarify ? "status-clarify" : "status-pending";
            const urgencyClass = (c.urgency || "sedang").toLowerCase().replace(/\s+/g, "-");
            const sla = evaluateCaseSla(c);
            const assignedMitra = c.mitraHandler || getMitraByCommodity(c.item, c.location);

            return (
              <div key={c.id} className={`posko-case-card ${cardStateClass}`}>
                {/* 1. Header: Code, Badges & Date */}
                <div className="posko-case-header-row">
                  <div className="posko-case-badges">
                    <span className="posko-case-id-badge">{c.id}</span>
                    {c.id === selectedCaseId && (
                      <span
                        style={{
                          background: "#e8ede7",
                          color: "#013220",
                          border: "1px solid #c2ddc6",
                          fontSize: "0.72rem",
                          padding: "2px 8px",
                          borderRadius: "999px",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <AppIcon name="check" size={11} />
                        <span>Laporan Terpilih</span>
                      </span>
                    )}

                    <span className={`posko-case-urgency-badge urgency-${urgencyClass}`}>
                      Prioritas {c.urgency}
                    </span>

                    {isEscalated ? (
                      <span
                        style={{
                          background: "#f4f6f4",
                          color: "#013220",
                          border: "1px solid #c2ddc6",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                      >
                        <AppIcon name="bolt" size={12} />
                        <span>Dialihkan ke Mitra</span>
                      </span>
                    ) : (
                      <span className={`posko-case-status-badge ${statusClass}`}>
                        {c.status}
                      </span>
                    )}

                    {c.faseDarurat && (
                      <span
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: "999px",
                          background: "#f4f6f4",
                          color: "#013220",
                          border: "1px solid #d1dbd3",
                        }}
                      >
                        {c.faseDarurat}
                      </span>
                    )}
                    
                    {c.province && (
                      <span
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: "999px",
                          background: "#ffffff",
                          color: "#013220",
                          border: "1px solid #d1dbd3",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <AppIcon name="pin" size={11} />
                        <span>{c.province}</span>
                      </span>
                    )}
                    {c.kategoriKerusakanRumah && (
                      <span
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 600,
                          padding: "3px 9px",
                          borderRadius: "999px",
                          background: "#ffffff",
                          color: "#013220",
                          border: "1px solid #d1dbd3",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title="Stimulan Perbaikan Rumah Kepka BNPB No. 296A/2023"
                      >
                        <AppIcon name="grid" size={11} />
                        <span>{c.kategoriKerusakanRumah}</span>
                      </span>
                    )}

                    {/* Live SLA Countdown / Status Badge */}
                    {isPending && !isEscalated && (
                      <span
                        style={{
                          background: sla.status === "warning" ? "#013220" : "#ffffff",
                          color: sla.status === "warning" ? "#ffffff" : "#013220",
                          border: "1px solid #013220",
                          padding: "3px 9px",
                          borderRadius: "999px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title="SLA batas verifikasi BPBD"
                      >
                        <AppIcon name="clock" size={11} />
                        <span>SLA: {sla.minutesRemaining}m tersisa</span>
                      </span>
                    )}
                  </div>

                  <span className="posko-case-date">
                    <AppIcon name="calendar" size={13} />
                    <span>{c.date || "Baru saja"}</span>
                  </span>
                </div>

                {/* 2. Main Title */}
                <h3 className="posko-case-title">
                  Kebutuhan {c.item} · {c.qty}
                </h3>

                {/* 3. Metadata Row (Location, KK, Reporter) */}
                <div className="posko-case-meta-row">
                  <span className="posko-case-meta-item">
                    <AppIcon name="pin" size={14} style={{ color: "#013220" }} />
                    <span>{c.location || "Wilayah Posko"}</span>
                  </span>
                  <span className="posko-case-meta-item">
                    <AppIcon name="users" size={14} style={{ color: "#013220" }} />
                    <span><strong>{c.kk}</strong></span>
                  </span>
                  <span className="posko-case-meta-item">
                    <AppIcon name="user" size={14} style={{ color: "#013220" }} />
                    <span>Pelapor: <strong>{c.applicantName || "Warga Terdampak"}</strong> {c.applicantPhone ? `(${c.applicantPhone})` : ""}</span>
                  </span>
                </div>

                {/* 4. Context & Validation Notes */}
                <div className="posko-case-context-section">
                  {/* SLA Escalation Notice Banner */}
                  {isEscalated && (
                    <div
                      style={{
                        background: "#fbfcfb",
                        border: "1px solid #c2ddc6",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        fontSize: "0.84rem",
                        color: "#013220",
                        display: "flex",
                        flexDirection: "column",
                        gap: "4px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, color: "#013220" }}>
                        <AppIcon name="bolt" size={14} />
                        <span>VERIFIKASI DIALIHKAN OTOMATIS KE MITRA (SLA TIMEOUT)</span>
                      </div>
                      <p style={{ margin: 0, color: "#2d3748", lineHeight: 1.45 }}>
                        Laporan telah melewati batas waktu respon BPBD ({sla.slaHours} Jam) dan dialihkan ke <strong>{assignedMitra}</strong> untuk verifikasi lapangan &amp; pemenuhan bantuan.
                      </p>
                    </div>
                  )}

                  {c.priorityRationale && (
                    <div className="posko-validation-box">
                      <div style={{ marginTop: "2px" }}><AppIcon name="shield" size={15} /></div>
                      <div>
                        <strong>Rekomendasi Sistem Validasi:</strong> {c.priorityRationale}
                      </div>
                    </div>
                  )}

                  {(c.standarBnpbNote || c.kategoriKerusakanRumah) && (
                    <div
                      style={{
                        background: "#fbfcfb",
                        border: "1px solid rgba(1, 50, 32, 0.15)",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        fontSize: "0.82rem",
                        color: "#013220",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                      }}
                    >
                      <div style={{ marginTop: "2px", color: "#013220", flexShrink: 0 }}>
                        <AppIcon name="file" size={14} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px", flexWrap: "wrap", gap: "6px" }}>
                          <strong style={{ color: "#013220" }}>Pedoman Regulasi &amp; Standar Bantuan BNPB:</strong>
                          {c.skalaWilayah && (
                            <span style={{ fontSize: "0.72rem", background: "#e8ede7", color: "#013220", border: "1px solid #c2ddc6", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                              Kewenangan: Skala {c.skalaWilayah}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, color: "#2d3748", lineHeight: 1.45 }}>
                          {c.standarBnpbNote || (c.kategoriKerusakanRumah ? `Kepka BNPB No. 296A/2023: Stimulan Rumah ${c.kategoriKerusakanRumah} ${c.estimasiStimulanNominal ? `(Rp ${c.estimasiStimulanNominal.toLocaleString('id-ID')},-)` : ''}` : 'Standar Perka BNPB No. 7/2008')}
                        </p>
                      </div>
                    </div>
                  )}

                  {c.notes && (
                    <div className="posko-notes-box">
                      <div style={{ marginTop: "2px", color: "#013220" }}><AppIcon name="file" size={14} /></div>
                      <div>
                        <strong>Catatan Pelapor:</strong> {c.notes}
                      </div>
                    </div>
                  )}

                  {/* Clarification info & Citizen Answer Display */}
                  {c.pertanyaanKlarifikasi && (
                    <div
                      style={{
                        background: "#fbfcfb",
                        border: "1px solid #c2ddc6",
                        borderRadius: "10px",
                        padding: "12px 16px",
                        fontSize: "0.84rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.04em", color: "#013220" }}>
                          Klarifikasi Posko: {c.kategoriKlarifikasi || "Kelengkapan Informasi"}
                        </span>
                        {c.memintaLampiran && (
                          <span style={{ fontSize: "0.72rem", background: "#e8ede7", color: "#013220", border: "1px solid #c2ddc6", padding: "2px 8px", borderRadius: "8px", fontWeight: 600 }}>
                            Wajib Lampiran Tambahan
                          </span>
                        )}
                      </div>
                      <div style={{ color: "#2d3748", marginBottom: c.jawabanKlarifikasi ? "8px" : 0 }}>
                        <strong>Pertanyaan Posko:</strong> "{c.pertanyaanKlarifikasi}"
                      </div>

                      {c.jawabanKlarifikasi ? (
                        <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px dashed #c2ddc6", background: "#ffffff", padding: "10px 12px", borderRadius: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#013220", fontWeight: 700, fontSize: "0.82rem", marginBottom: "4px" }}>
                            <AppIcon name="check" size={13} />
                            <span>Jawaban Warga Diterima (Siap Divalidasi Ulang):</span>
                          </div>
                          <div style={{ color: "#013220", fontWeight: 500 }}>
                            "{c.jawabanKlarifikasi}"
                          </div>
                          {c.fotoKlarifikasi && (
                            <div style={{ marginTop: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
                              <span style={{ fontSize: "0.8rem", color: "#013220", fontWeight: 600 }}>Lampiran Dokumen Baru:</span>
                              <a href={c.fotoKlarifikasi} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", color: "#013220", textDecoration: "underline", fontWeight: 600 }}>
                                Lihat Foto/Dokumen Klarifikasi
                              </a>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div style={{ marginTop: "6px", fontSize: "0.82rem", color: "#64748b", fontStyle: "italic", display: "flex", alignItems: "center", gap: "6px" }}>
                          <AppIcon name="clock" size={13} />
                          <span>Menunggu tanggapan &amp; kelengkapan data dari pelapor.</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rejection notice if rejected */}
                  {isRejected && c.alasanPenolakan && (
                    <div
                      style={{
                        background: "#fafafa",
                        border: "1px solid #cbd5e1",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        fontSize: "0.84rem",
                        color: "#334155",
                      }}
                    >
                      <div style={{ fontWeight: 700, marginBottom: "4px", color: "#0f172a" }}>Alasan Penolakan: {c.alasanPenolakan}</div>
                      {c.tindakLanjutPenolakan && (
                        <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: "4px" }}>
                          <strong>Saran Tindak Lanjut:</strong> {c.tindakLanjutPenolakan}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 5. Dedicated Footer Action Bar */}
                <div className="posko-case-footer-row">
                  <button
                    type="button"
                    onClick={() => onSelectCase(c)}
                    className="btn-case-view"
                    title="Buka dokumen detail dan pemeriksaan kasus"
                  >
                    <AppIcon name="file" size={14} />
                    <span>Buka Kasus</span>
                  </button>

                  <div className="posko-case-actions-cluster">
                    {isPending && !isEscalated && (
                      <>
                        <button
                          type="button"
                          onClick={() => openActionModal(c, "clarify")}
                          className="btn-case-clarify"
                          title="Minta klarifikasi tambahan dari pelapor"
                        >
                          <AppIcon name="alert" size={13} />
                          <span>Minta Klarifikasi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openActionModal(c, "escalate")}
                          className="btn-case-escalate"
                          title="Alihkan verifikasi dan penanganan langsung ke Mitra Kemanusiaan"
                        >
                          <AppIcon name="shield" size={13} />
                          <span>Alihkan ke Mitra</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openActionModal(c, "reject")}
                          className="btn-case-reject"
                          title="Tolak laporan jika tidak memenuhi syarat"
                        >
                          <AppIcon name="x" size={13} />
                          <span>Tolak</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openActionModal(c, "verify")}
                          className="btn-case-verify"
                          title="Verifikasi laporan dan rilis kuota ke Bursa Bantuan"
                        >
                          <AppIcon name="check" size={13} />
                          <span>Verifikasi &amp; Rilis</span>
                        </button>
                      </>
                    )}

                    {isEscalated && (
                      <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.82rem", color: "#64748b", fontStyle: "italic" }}>
                          Dialihkan ke: <strong>{assignedMitra}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => openActionModal(c, "verify")}
                          className="btn-case-verify"
                          style={{
                            background: "#013220",
                            color: "#ffffff",
                            border: "1px solid #013220",
                            padding: "7px 18px",
                            borderRadius: "8px",
                            fontSize: "0.80rem",
                            fontWeight: 700,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            cursor: "pointer",
                          }}
                          title="Validasi bersama Posko BPBD"
                        >
                          <AppIcon name="check" size={13} />
                          <span>Validasi Bersama Posko</span>
                        </button>
                      </div>
                    )}

                    {isClarify && (
                      <button
                        type="button"
                        onClick={() => openActionModal(c, "verify")}
                        className="btn-case-verify"
                        style={{
                          background: "#013220",
                          color: "#ffffff",
                          border: "1px solid #013220",
                          padding: "7px 18px",
                          borderRadius: "8px",
                          fontSize: "0.80rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          cursor: "pointer",
                        }}
                      >
                        <AppIcon name="check" size={13} />
                        <span>Selesai Klarifikasi &amp; Rilis</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION CONTROLS */}
      {totalItems > 0 && (
        <div className="posko-pagination-card">
          <div className="posko-pagination-info">
            <span>
              Menampilkan <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> dari <strong>{totalItems}</strong> laporan
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

      {/* ACTION MODAL */}
      {modalAction && selectedCase && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(560px, 95%)", textAlign: "left", borderRadius: "16px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "1.25rem", color: "#013220", margin: 0, fontWeight: 800 }}>
                {modalAction === "verify" && `Verifikasi Laporan ${selectedCase.id}`}
                {modalAction === "clarify" && `Minta Klarifikasi untuk ${selectedCase.id}`}
                {modalAction === "escalate" && `Alihkan Kasus ${selectedCase.id} ke Mitra`}
                {modalAction === "reject" && `Tolak Laporan ${selectedCase.id}`}
                {modalAction === "further" && `Pemeriksaan Lanjutan ${selectedCase.id}`}
              </h2>
              <button
                type="button"
                onClick={() => setModalAction(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
              >
                <AppIcon name="x" size={18} />
              </button>
            </div>

            <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "18px" }}>
              Komoditas: <strong>{selectedCase.item} ({selectedCase.qty})</strong> untuk {selectedCase.kk} di {selectedCase.location}.
            </p>

            {modalAction === "verify" && (
              <>
                <label className="reksa-form-label" style={{ fontWeight: 700, fontSize: "0.85rem", color: "#013220", display: "block", marginBottom: "8px" }}>
                  Konfirmasi Prioritas Penanganan:
                </label>
                <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
                  {["Kritis", "Tinggi", "Sedang"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriorityChoice(p)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "10px",
                        border: priorityChoice === p ? "2px solid #013220" : "1px solid #cbd5e1",
                        background: priorityChoice === p ? "#f0fdf4" : "#ffffff",
                        fontWeight: priorityChoice === p ? 700 : 500,
                        color: priorityChoice === p ? "#013220" : "#64748b",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <label className="reksa-form-label" style={{ fontWeight: 700, fontSize: "0.85rem", color: "#013220", display: "block", marginBottom: "6px" }}>
                  Catatan Verifikasi Posko (Disimpan di riwayat &amp; Bursa):
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Kebutuhan divalidasi sah oleh Koordinator Posko dan dirilis ke Bursa Bantuan Terbuka."
                  className="reksa-textarea-field"
                  style={{ marginBottom: "20px", width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </>
            )}

            {modalAction === "clarify" && (
              <>
                <label className="reksa-form-label" style={{ fontWeight: 700, fontSize: "0.85rem", color: "#013220", display: "block", marginBottom: "6px" }}>
                  Jenis Informasi yang Perlu Diperbaiki:
                </label>
                <select
                  value={clarificationCategory}
                  onChange={(e) => setClarificationCategory(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "14px" }}
                >
                  <option value="Foto / Bukti Fisik Buram / Kurang Jelas">Foto / Bukti Fisik Buram atau Kurang Jelas</option>
                  <option value="Rincian Jumlah Jiwa Rentan & KK Terdampak">Rincian Jumlah Jiwa Rentan (Balita/Lansia) &amp; KK</option>
                  <option value="Titik Koordinat Lokasi & Akses Distribusi">Titik Koordinat Lokasi &amp; Akses Jalan Tenda</option>
                  <option value="Spesifikasi & Volume Permintaan Logistik">Spesifikasi &amp; Volume Permintaan Kebutuhan</option>
                  <option value="Kelengkapan Informasi Lainnya">Kelengkapan Informasi Lainnya</option>
                </select>

                <label className="reksa-form-label" style={{ fontWeight: 700, fontSize: "0.85rem", color: "#013220", display: "block", marginBottom: "6px" }}>
                  Pertanyaan Jelas untuk Warga:
                </label>
                <textarea
                  rows={4}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Tuliskan pertanyaan spesifik, misalnya: 'Foto kondisi tandon air buram, mohon unggah ulang foto yang jelas' atau 'Mohon rincikan jumlah balita dan lansia di pos pengungsian ini.'"
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "12px" }}
                />

                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.86rem", color: "#013220", fontWeight: 600, cursor: "pointer", marginBottom: "16px", background: "#fbfbf8", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                  <input
                    type="checkbox"
                    checked={requestAttachment}
                    onChange={(e) => setRequestAttachment(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#013220" }}
                  />
                  <span>Meminta warga mengunggah foto atau dokumen bukti tambahan</span>
                </label>
              </>
            )}

            {modalAction === "reject" && (
              <>
                <div style={{ background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "10px", padding: "10px 14px", marginBottom: "14px", fontSize: "0.84rem", color: "#334155" }}>
                  <strong>Kebijakan Posko:</strong> Jika masalah data masih dapat diperbaiki oleh warga, gunakan opsi <strong>Minta Klarifikasi</strong> alih-alih menolak.
                </div>

                <label className="reksa-form-label" style={{ fontWeight: 700, fontSize: "0.85rem", color: "#013220", display: "block", marginBottom: "6px" }}>
                  Alasan Spesifik Penolakan (Wajib &amp; Transparan):
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Lokasi berada di luar wilayah zona bencana / Data permohonan duplikat dengan laporan warga di tenda yang sama."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "14px" }}
                />

                <label className="reksa-form-label" style={{ fontWeight: 700, fontSize: "0.85rem", color: "#013220", display: "block", marginBottom: "6px" }}>
                  Informasi &amp; Rekomendasi Tindak Lanjut untuk Warga:
                </label>
                <textarea
                  rows={2}
                  value={rejectionFollowUp}
                  onChange={(e) => setRejectionFollowUp(e.target.value)}
                  placeholder="Saran rujukan posko alternatif atau kontak RT/RW setempat..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "18px" }}
                />
              </>
            )}

            {modalAction === "escalate" && (
              <>
                <div
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    borderRadius: "10px",
                    padding: "12px 14px",
                    marginBottom: "16px",
                    fontSize: "0.84rem",
                    color: "#065f46",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "10px",
                  }}
                >
                  <AppIcon name="shield" size={18} style={{ marginTop: "2px" }} />
                  <div>
                    <strong>Delegasi Resmi ke Lembaga Mitra Kemanusiaan:</strong>
                    <p style={{ margin: "4px 0 0", lineHeight: 1.45 }}>
                      Laporan ini akan dialihkan langsung ke antrean kerja Mitra untuk verifikasi lapangan cepat, komitmen pemenuhan logistik, dan penyaluran tanpa menunggu proses validasi reguler Posko.
                    </p>
                  </div>
                </div>

                <label
                  className="reksa-form-label"
                  style={{ fontWeight: 700, fontSize: "0.85rem", color: "#013220", display: "block", marginBottom: "8px" }}
                >
                  Pilih Lembaga Mitra Penanganan:
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px", maxHeight: "240px", overflowY: "auto", paddingRight: "4px" }}>
                  {MITRA_PARTNERS.map((mitra) => {
                    const isSelected = selectedMitra === mitra.name;
                    return (
                      <div
                        key={mitra.name}
                        onClick={() => setSelectedMitra(mitra.name)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: "10px",
                          border: isSelected ? "2px solid #047857" : "1px solid #e2e8f0",
                          background: isSelected ? "#f0fdf4" : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "2px" }}>
                            <span style={{ fontWeight: 700, fontSize: "0.86rem", color: isSelected ? "#065f46" : "#0f172a" }}>
                              {mitra.name}
                            </span>
                            <span
                              style={{
                                fontSize: "0.70rem",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "20px",
                                background: mitra.bg,
                                color: mitra.color,
                              }}
                            >
                              {mitra.badge}
                            </span>
                          </div>
                          <div style={{ fontSize: "0.78rem", color: "#64748b", lineHeight: 1.35 }}>
                            {mitra.desc}
                          </div>
                        </div>
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "50%",
                            border: isSelected ? "5px solid #047857" : "2px solid #cbd5e1",
                            background: "#ffffff",
                            flexShrink: 0,
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                <label
                  className="reksa-form-label"
                  style={{ fontWeight: 700, fontSize: "0.85rem", color: "#013220", display: "block", marginBottom: "6px" }}
                >
                  Catatan atau Arahan untuk Mitra (Opsional):
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Kebutuhan sangat mendesak untuk warga lansia dan balita di tenda posko barat. Akses jalan dapat dilalui armada roda 4."
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    marginBottom: "16px",
                  }}
                />
              </>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setModalAction(null)}
                style={{
                  background: "#ffffff",
                  color: "#475569",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "9px 18px",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isSubmitting || (modalAction === "reject" && !notesInput.trim()) || (modalAction === "clarify" && !notesInput.trim()) || (modalAction === "escalate" && !selectedMitra)}
                onClick={handleExecuteAction}
                style={{
                  background: modalAction === "reject" ? "#334155" : modalAction === "escalate" ? "#047857" : "#013220",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 20px",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isSubmitting
                  ? "Menyimpan..."
                  : modalAction === "verify"
                  ? "Konfirmasi & Rilis ke Bursa"
                  : modalAction === "clarify"
                  ? "Kirim Permintaan Klarifikasi"
                  : modalAction === "escalate"
                  ? "Konfirmasi Alihkan ke Mitra"
                  : "Simpan Penolakan Resmi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
