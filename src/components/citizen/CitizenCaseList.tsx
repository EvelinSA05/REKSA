import { useState, useEffect } from "react";
import {
  CaseRecord,
  SharedState,
  RouterProps,
  PageHead,
  Icon,
  Button,
  Pill,
  getFieldEvidencePhoto,
  removeUserReportedId,
} from "../../App";
import { apiService } from "../../services/api";
import { CitizenClarificationModal } from "./CitizenClarificationModal";
import { BastPrintModal } from "../common/BastPrintModal";

interface CitizenCaseListProps {
  title: string;
  copy: string;
  onCase: (c?: CaseRecord) => void;
  own?: boolean;
  completed?: boolean;
  state?: SharedState;
  update?: RouterProps["update"];
  onNavigateToReport?: () => void;
  onNavigateToCases?: () => void;
  onRefresh?: () => Promise<void> | void;
}

export function CitizenCaseList({
  title,
  copy,
  onCase,
  own = false,
  completed = false,
  state,
  update,
  onNavigateToReport,
  onNavigateToCases,
  onRefresh,
}: CitizenCaseListProps) {
  const [filter, setFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [historyScope, setHistoryScope] = useState<"selesai" | "semua">("selesai");

  const allCases = state?.casesList ?? [];
  const [editingCase, setEditingCase] = useState<CaseRecord | null>(null);
  const [deletingCase, setDeletingCase] = useState<CaseRecord | null>(null);
  const [clarificationCase, setClarificationCase] = useState<CaseRecord | null>(null);
  const [selectedBastCase, setSelectedBastCase] = useState<CaseRecord | null>(null);

  // Fast Confirmation states (BAST Digital)
  const [confirmingReceiptCase, setConfirmingReceiptCase] = useState<CaseRecord | null>(null);
  const [receivedVolume, setReceivedVolume] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [receiptPhoto, setReceiptPhoto] = useState<string>("");
  const [isSubmittingReceipt, setIsSubmittingReceipt] = useState(false);
  const [isDeclarationChecked, setIsDeclarationChecked] = useState(true);

  // Edit fields
  const [editItem, setEditItem] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editKK, setEditKK] = useState("");
  const [editPriority, setEditPriority] = useState("Sangat mendesak");

  const normalizeCitizenUrgency = (val: string) => {
    if (val === "Kritis") return "Sangat mendesak";
    if (val === "Tinggi") return "Perlu segera";
    if (val === "Sedang") return "Bisa menunggu";
    return val || "Sangat mendesak";
  };

  const isCaseOwnedByUser = (c: CaseRecord) => {
    return Boolean(
      (c.isOwn || c.applicantName === "Andi Pratama" || c.applicantName?.toLowerCase().includes("andi") || c.id === "RK-2026-J348QJ") &&
      !c.id.startsWith("RK-UJI-") &&
      !c.id.includes("TEST") &&
      !c.id.startsWith("RK-MULTI-")
    );
  };

  const userOwnCases = allCases.filter(isCaseOwnedByUser);
  const completedCases = userOwnCases.filter((c) => c.status === "Selesai");
  const activeCases = userOwnCases.filter((c) => c.status !== "Selesai");

  const clarificationCount = allCases.filter(
    (c) => (!own || isCaseOwnedByUser(c)) && c.status === "Perlu Klarifikasi"
  ).length;

  const receiptPendingCount = allCases.filter(
    (c) =>
      (!own || isCaseOwnedByUser(c)) &&
      (c.status === "Menunggu Konfirmasi Penerimaan" || c.status === "Tiba di Lokasi & Diserahkan" || c.status === "Tiba di lokasi")
  ).length;

  const data = allCases.filter((c) => {
    const isDummy = c.id.startsWith("RK-UJI-") || c.id.includes("TEST") || c.id.startsWith("RK-MULTI-");
    const matchesOwn = !own || isCaseOwnedByUser(c);
    const matchesCompleted = !completed || (historyScope === "semua" ? true : c.status === "Selesai");
    const matchesFilter =
      filter === "Semua" ||
      (filter === "Perlu Klarifikasi" && c.status === "Perlu Klarifikasi") ||
      ((filter.includes("Konfirmasi") || filter.includes("Dikonfirmasi")) &&
        (c.status === "Menunggu Konfirmasi Penerimaan" || c.status === "Tiba di Lokasi & Diserahkan" || c.status === "Tiba di lokasi")) ||
      c.urgency === filter ||
      (filter === "Sangat mendesak" && (c.urgency === "Kritis" || c.urgency === "Sangat mendesak")) ||
      (filter === "Perlu segera" && (c.urgency === "Tinggi" || c.urgency === "Perlu segera")) ||
      (filter === "Bisa menunggu" && (c.urgency === "Sedang" || c.urgency === "Bisa menunggu"));
    const matchesSearch =
      !searchQuery ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesOwn && matchesCompleted && matchesFilter && matchesSearch;
  });

  // Pagination: Maksimal 4 card di 1 halaman
  const [currentPage, setCurrentPage] = useState(1);
  const CASES_PER_PAGE = 4;

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, historyScope]);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / CASES_PER_PAGE));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * CASES_PER_PAGE;
  const endIndex = Math.min(startIndex + CASES_PER_PAGE, totalItems);
  const paginatedData = data.slice(startIndex, endIndex);

  const openReceiptModal = (c: CaseRecord) => {
    setConfirmingReceiptCase(c);
    setReceivedVolume(c.qty || "");
    setReceiptNotes("Bantuan fisik telah diterima di lokasi dalam kondisi baik dan lengkap sesuai kebutuhan warga.");
    setReceiptPhoto("");
    setIsDeclarationChecked(true);
  };

  const handleConfirmReceipt = async () => {
    if (!confirmingReceiptCase || !update) return;
    setIsSubmittingReceipt(true);
    const cleanVol = receivedVolume.trim() || confirmingReceiptCase.qty;
    const cleanNotes = receiptNotes.trim() || "Bantuan fisik telah diterima di lokasi dalam kondisi baik dan lengkap sesuai kebutuhan warga.";

    try {
      await apiService.confirmReceiptKebutuhan(confirmingReceiptCase.id, {
        diterima_volume: cleanVol,
        catatan: cleanNotes,
      });
    } catch (e) {
      console.warn("API confirm receipt note:", e);
    }

    const updatedList = allCases.map((item) =>
      item.id === confirmingReceiptCase.id
        ? {
            ...item,
            status: "Selesai",
            delivered: 1000,
            totalDiterimaResmi: cleanVol,
            catatanPenerimaan: cleanNotes,
            fotoPenerimaan: receiptPhoto || item.fotoBukti,
          }
        : item
    );

    localStorage.setItem("reksa_cases_db", JSON.stringify(updatedList));
    update(
      { casesList: updatedList, status: "Selesai", assignment: "Selesai", delivered: 1000 },
      `Bantuan ${confirmingReceiptCase.item} (${cleanVol}) untuk kasus ${confirmingReceiptCase.id} resmi dikonfirmasi diterima tuntas (BAST terbit).`
    );

    if (onRefresh) {
      try {
        await onRefresh();
      } catch (err) {
        console.warn("onRefresh error:", err);
      }
    }

    setIsSubmittingReceipt(false);
    setConfirmingReceiptCase(null);
  };

  const handleReceiptPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setReceiptPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const openEdit = (c: CaseRecord) => {
    setEditingCase(c);
    setEditItem(c.item);
    setEditQty(c.qty);
    setEditKK(c.kk);
    setEditPriority(normalizeCitizenUrgency(c.urgency));
  };

  const saveEdit = async () => {
    if (!editingCase || !update) return;
    const parsedKK = typeof editKK === "number" ? editKK : parseInt(String(editKK).replace(/[^0-9]/g, "")) || 1;
    const formattedKK = `${parsedKK} KK`;
    const updated = allCases.map((c) =>
      c.id === editingCase.id
        ? { ...c, item: editItem, qty: editQty, kk: formattedKK, urgency: editPriority }
        : c
    );

    // 1. Update local state & localStorage immediately
    localStorage.setItem("reksa_cases_db", JSON.stringify(updated));
    update({ casesList: updated }, `Data kasus ${editingCase.id} berhasil diperbarui.`);
    setEditingCase(null);

    // 2. Sync to Laravel Database API
    try {
      await apiService.updateKebutuhan(editingCase.id, {
        kategori_kebutuhan: editItem,
        volume_permintaan: editQty,
        jumlah_kk: parsedKK,
        tingkat_urgensi: editPriority,
      });
    } catch (e) {
      console.log("API update note:", e);
    }
  };

  const confirmDelete = () => {
    if (!deletingCase || !update) return;
    const updated = allCases.filter((c) => c.id !== deletingCase.id);

    removeUserReportedId(deletingCase.id);

    // 1. Send DELETE to Laravel backend
    apiService.deleteKebutuhan(deletingCase.id).catch((e) => console.log("API delete note:", e));

    // 2. Track deleted ID in localStorage to prevent re-fetching deleted items
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem("reksa_deleted_ids") || "[]");
      if (!deletedIds.includes(deletingCase.id)) {
        deletedIds.push(deletingCase.id);
        localStorage.setItem("reksa_deleted_ids", JSON.stringify(deletedIds));
      }
    } catch {}

    localStorage.setItem("reksa_cases_db", JSON.stringify(updated));
    update({ casesList: updated }, `Kasus ${deletingCase.id} berhasil dihapus.`);
    setDeletingCase(null);
  };

  const handlePantau = (c: CaseRecord) => {
    if (update) {
      update({ activeCaseId: c.id });
    }
    onCase(c);
  };

  return (
    <main className="workspace cases-workspace">
      <PageHead
        eyebrow="Portal Kebutuhan"
        title={title}
        copy={copy}
        action={<div className="trust-badge"><Icon name="check" /> {data.length} Kasus Terdata</div>}
      />

      {/* FILTER & SEARCH BAR */}
      <div className="cases-filter-bar">
        <div className="cases-search-box">
          <Icon name="file" />
          <input
            type="text"
            placeholder="Cari kode kasus, jenis kebutuhan, atau desa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="cases-pill-filters" style={{ flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
          {completed && (
            <div style={{ display: "inline-flex", gap: "4px", padding: "3px", background: "#e8ede7", borderRadius: "10px", marginRight: "6px" }}>
              <button
                type="button"
                className={`case-filter-btn ${historyScope === "selesai" ? "active" : ""}`}
                style={{
                  fontSize: "0.82rem",
                  padding: "5px 12px",
                  borderRadius: "7px",
                  background: historyScope === "selesai" ? "#013220" : "transparent",
                  color: historyScope === "selesai" ? "#ffffff" : "#4b5563",
                  border: "none",
                  fontWeight: historyScope === "selesai" ? 700 : 500,
                  cursor: "pointer",
                }}
                onClick={() => setHistoryScope("selesai")}
              >
                Selesai ({completedCases.length})
              </button>
              <button
                type="button"
                className={`case-filter-btn ${historyScope === "semua" ? "active" : ""}`}
                style={{
                  fontSize: "0.82rem",
                  padding: "5px 12px",
                  borderRadius: "7px",
                  background: historyScope === "semua" ? "#013220" : "transparent",
                  color: historyScope === "semua" ? "#ffffff" : "#4b5563",
                  border: "none",
                  fontWeight: historyScope === "semua" ? 700 : 500,
                  cursor: "pointer",
                }}
                onClick={() => setHistoryScope("semua")}
              >
                Semua Riwayat ({userOwnCases.length})
              </button>
            </div>
          )}
          {[
            "Semua",
            ...(receiptPendingCount > 0 ? ["Menunggu Konfirmasi"] : []),
            ...(clarificationCount > 0 ? ["Perlu Klarifikasi"] : []),
            "Sangat mendesak",
            "Perlu segera",
            "Bisa menunggu",
          ].map((x) => {
            const isClarifPill = x === "Perlu Klarifikasi";
            const isReceiptPill = x === "Menunggu Konfirmasi";
            const isActive = filter === x;
            return (
              <button
                key={x}
                type="button"
                className={`case-filter-btn ${isActive ? "active" : ""}`}
                style={
                  isClarifPill
                    ? {
                        background: isActive ? "#b45309" : "#fffbeb",
                        color: isActive ? "#ffffff" : "#92400e",
                        borderColor: "#f59e0b",
                        fontWeight: 700,
                      }
                    : isReceiptPill
                    ? {
                        background: isActive ? "#059669" : "#ecfdf5",
                        color: isActive ? "#ffffff" : "#065f46",
                        borderColor: "#10b981",
                        fontWeight: 700,
                      }
                    : undefined
                }
                onClick={() => setFilter(x)}
              >
                {isClarifPill ? `⚠️ ${x} (${clarificationCount})` : isReceiptPill ? `✓ Perlu Dikonfirmasi (${receiptPendingCount})` : x}
              </button>
            );
          })}
        </div>
      </div>

      {/* CASE CARDS GRID */}
      <div className="case-cards-grid">
        {data.length === 0 ? (
          completed && historyScope === "selesai" && activeCases.length > 0 && !searchQuery && filter === "Semua" ? (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "48px 24px",
                background: "#f5f4ef",
                borderRadius: "18px",
                border: "1px dashed #d1d5db",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "#e8ebe2",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                  color: "#013220",
                }}
              >
                <Icon name="clock" />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#013220", margin: "0 0 6px" }}>
                Belum Ada Laporan yang Selesai
              </h3>
              <p
                style={{
                  color: "#616852",
                  fontSize: "0.9rem",
                  maxWidth: "520px",
                  margin: "0 auto 20px",
                  lineHeight: 1.6,
                }}
              >
                Anda memiliki <strong>{activeCases.length} laporan aktif</strong> yang sedang berjalan (status:{" "}
                <span style={{ background: "#eef6f0", color: "#1c5a39", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                  {activeCases[0]?.status || "Diajukan"}
                </span>
                ). Laporan akan otomatis tercatat di arsip Riwayat Selesai setelah bantuan fisik telah diterima dan dikonfirmasi tuntas (BAST).
              </p>
              <div style={{ display: "flex", gap: "10px", justifyContent: "center", flexWrap: "wrap" }}>
                {onNavigateToCases && (
                  <Button
                    variant="primary"
                    onClick={onNavigateToCases}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "10px 22px",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  >
                    <Icon name="file" /> Lihat di Laporan Saya
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => setHistoryScope("semua")}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                    background: "#ffffff",
                  }}
                >
                  <Icon name="clock" /> Tampilkan Semua Riwayat ({userOwnCases.length})
                </Button>
              </div>
            </div>
          ) : (
            <div
              style={{
                gridColumn: "1 / -1",
                textAlign: "center",
                padding: "48px 24px",
                background: "#f5f4ef",
                borderRadius: "18px",
                border: "1px dashed #d1d5db",
              }}
            >
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "14px",
                  background: "#e8ebe2",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "14px",
                  color: "#013220",
                }}
              >
                <Icon name="file" />
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#013220", margin: "0 0 6px" }}>
                {completed ? "Belum Ada Riwayat Laporan" : "Belum Ada Laporan Diajukan"}
              </h3>
              <p
                style={{
                  color: "#616852",
                  fontSize: "0.9rem",
                  maxWidth: "460px",
                  margin: "0 auto 20px",
                  lineHeight: 1.5,
                }}
              >
                {searchQuery || filter !== "Semua"
                  ? "Tidak ada data laporan kasus yang sesuai dengan filter atau kata kunci pencarian Anda."
                  : completed
                  ? "Anda belum memiliki riwayat pengajuan bantuan kebutuhan darurat."
                  : "Anda belum mengajukan laporan kebutuhan darurat. Bila keluarga atau lingkungan Anda memerlukan bantuan pascabencana, silakan buat laporan baru."}
              </p>
              {onNavigateToReport && !searchQuery && filter === "Semua" && (
                <Button
                  variant="primary"
                  onClick={onNavigateToReport}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 22px",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  <Icon name="plus" /> Laporkan Kebutuhan Sekarang
                </Button>
              )}
            </div>
          )
        ) : (
          paginatedData.map((c) => {
            const isCritical = c.urgency === "Kritis" || c.urgency === "Sangat mendesak";
            const isHigh = c.urgency === "Tinggi" || c.urgency === "Perlu segera";
            const isDone = c.status === "Selesai";
            const isClarification = c.status === "Perlu Klarifikasi";
            const isWaitingReceipt = c.status === "Menunggu Konfirmasi Penerimaan" || c.status === "Tiba di Lokasi & Diserahkan";

            return (
              <div 
                className={`case-aesthetic-card ${isCritical ? "priority-critical" : ""}`} 
                key={c.id}
                style={
                  isWaitingReceipt 
                    ? { borderColor: "#10b981", background: "#fcfefc" } 
                    : isClarification 
                    ? { borderColor: "#f59e0b", background: "#fffdfa" } 
                    : undefined
                }
              >
                <div className="case-card-header">
                  <div className="case-code-badge">{c.id}</div>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
                    {c.faseDarurat && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "8px",
                          background: c.faseDarurat === "Tanggap Darurat" ? "#fef2f2" : c.faseDarurat === "Siaga Darurat" ? "#fffbeb" : "#f0fdf4",
                          color: c.faseDarurat === "Tanggap Darurat" ? "#991b1b" : c.faseDarurat === "Siaga Darurat" ? "#92400e" : "#065f46",
                          border: `1px solid ${c.faseDarurat === "Tanggap Darurat" ? "#fca5a5" : c.faseDarurat === "Siaga Darurat" ? "#fde68a" : "#bbf7d0"}`,
                        }}
                      >
                        {c.faseDarurat}
                      </span>
                    )}
                    {c.kategoriKerusakanRumah && (
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "2px 7px",
                          borderRadius: "8px",
                          background: "#ecfdf5",
                          color: "#065f46",
                          border: "1px solid #a7f3d0",
                        }}
                        title={`Stimulan BNPB: ${c.kategoriKerusakanRumah}`}
                      >
                        🏠 {c.kategoriKerusakanRumah}
                      </span>
                    )}
                    {isWaitingReceipt && (
                      <span style={{ fontSize: "0.76rem", background: "#d1fae5", color: "#065f46", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                        ✓ Tiba di Lokasi
                      </span>
                    )}
                    {isClarification && (
                      <span style={{ fontSize: "0.76rem", background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
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
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1593113598332-cd288d649433?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&q=80";
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

                  {/* CALLOUT AKSI CEPAT KONFIRMASI PENERIMAAN (BAST) */}
                  {isWaitingReceipt && (
                    <div
                      style={{
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        marginTop: "10px",
                        fontSize: "0.82rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#065f46", fontWeight: 700 }}>
                        <Icon name="check" /> Logistik Telah Tiba di Titik Serah!
                      </div>
                      <div style={{ color: "#047857", marginTop: "3px", marginBottom: "8px", lineHeight: 1.4, fontSize: "0.8rem" }}>
                        Armada penyalur telah tiba di lokasi. Silakan periksa kondisi barang dan konfirmasi Berita Acara Penerimaan (BAST).
                      </div>
                      <button
                        type="button"
                        onClick={() => openReceiptModal(c)}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "9px 12px",
                          background: "#059669",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          fontSize: "0.84rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          boxShadow: "0 2px 6px rgba(5, 150, 105, 0.25)",
                        }}
                      >
                        <Icon name="check" /> Konfirmasi Bantuan Diterima (BAST)
                      </button>
                    </div>
                  )}

                  {/* CALLOUT INSTRUKSI POSKO BPBD JIKA PERLU KLARIFIKASI */}
                  {isClarification && (
                    <div
                      style={{
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        marginTop: "10px",
                        fontSize: "0.82rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b45309", fontWeight: 700 }}>
                        <Icon name="check" /> Instruksi Posko BPBD:
                      </div>
                      <div style={{ color: "#78350f", marginTop: "3px", lineHeight: 1.4, fontWeight: 500 }}>
                        "{c.pertanyaanKlarifikasi || "Mohon berikan rincian data tambahan untuk laporan kebutuhan ini."}"
                      </div>
                      {c.memintaLampiran && (
                        <small style={{ color: "#d97706", display: "block", marginTop: "4px", fontWeight: 700 }}>
                          *Wajib menyertakan lampiran foto/dokumen fisik baru
                        </small>
                      )}
                    </div>
                  )}

                  <div className="case-card-quantity">
                    <small>Target Volume Bantuan:</small>
                    <strong>{c.qty}</strong>
                  </div>
                </div>

                {/* DIRECT ACTIONS ON CARD */}
                <div className="case-card-footer" style={{ flexDirection: "column", gap: "10px", alignItems: "stretch" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="case-status-indicator">
                      <i className={`status-dot ${isDone ? "done" : isClarification ? "warning" : isWaitingReceipt ? "waiting" : "active"}`} style={isClarification ? { background: "#f59e0b" } : isWaitingReceipt ? { background: "#10b981" } : undefined} />
                      <span style={isClarification ? { color: "#b45309", fontWeight: 700 } : isWaitingReceipt ? { color: "#065f46", fontWeight: 700 } : undefined}>{c.status}</span>
                    </div>
                  </div>

                  {isClarification && (
                    <button
                      type="button"
                      onClick={() => setClarificationCase(c)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "10px 14px",
                        background: "#b45309",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "0.86rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(180, 83, 9, 0.25)",
                      }}
                    >
                      <Icon name="check" /> Jawab Klarifikasi BPBD Sekarang
                    </button>
                  )}

                  {isDone ? (
                    <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "8px" }}>
                      <button
                        type="button"
                        className="btn-bast-download"
                        onClick={() => setSelectedBastCase(c)}
                        title="Unduh dan cetak Berita Acara Serah Terima Resmi (BAST)"
                        style={{ padding: "8px 12px", fontSize: "0.82rem" }}
                      >
                        <Icon name="file" /> Dokumen BAST
                      </button>
                      <button
                        type="button"
                        className="btn-case-action"
                        onClick={() => handlePantau(c)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          padding: "8px 10px",
                          fontSize: "0.82rem",
                        }}
                      >
                        Detail Kasus <Icon name="next" />
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "6px" }}>
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "6px 10px",
                          background: "#ffffff",
                          border: "1px solid #c1c3ac",
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "#013220",
                          cursor: "pointer",
                        }}
                      >
                        <Icon name="edit" /> Ubah
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingCase(c)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "6px 10px",
                          background: "#fff1f0",
                          border: "1px solid #ffa39e",
                          borderRadius: "8px",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: "#cf1322",
                          cursor: "pointer",
                        }}
                      >
                        <Icon name="trash" /> Hapus
                      </button>
                      <button
                        type="button"
                        className="btn-case-action"
                        onClick={() => handlePantau(c)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          padding: "6px 8px",
                          fontSize: "0.8rem",
                        }}
                      >
                        Pantau <Icon name="next" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* PAGINATION CONTROLS */}
      {totalItems > 0 && (
        <div className="posko-pagination-card" style={{ marginTop: "24px" }}>
          <div className="posko-pagination-info">
            <span>
              Menampilkan <strong>{startIndex + 1}</strong> - <strong>{endIndex}</strong> dari <strong>{totalItems}</strong> laporan
            </span>
            <span className="posko-pagination-limit-badge">Maks. 4 card per halaman</span>
          </div>

          {totalPages > 1 && (
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
          )}
        </div>
      )}

      {/* CLARIFICATION MODAL */}
      {clarificationCase && (
        <CitizenClarificationModal
          caseData={clarificationCase}
          onClose={() => setClarificationCase(null)}
          onSuccess={(updated) => {
            const updatedList = allCases.map((item) => (item.id === updated.id ? updated : item));
            localStorage.setItem("reksa_cases_db", JSON.stringify(updatedList));
            if (update) {
              update(
                { casesList: updatedList, status: "Dalam Verifikasi" },
                `Jawaban klarifikasi untuk kasus ${updated.id} berhasil dikirim ke Posko BPBD.`
              );
            }
          }}
        />
      )}

      {/* MODAL EDIT DATA LANGSUNG DI DEPAN (UPDATE) */}
      {editingCase && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", maxWidth: "500px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#013220", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon name="edit" /> Ubah Data Kasus {editingCase.id}
              </h3>
              <button type="button" onClick={() => setEditingCase(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#80866e" }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label className="form-label">Jenis Kebutuhan Bantuan</label>
                <input
                  type="text"
                  className="form-control"
                  value={editItem}
                  onChange={(e) => setEditItem(e.target.value)}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label className="form-label">Volume Kebutuhan</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Jumlah KK</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editKK}
                    onChange={(e) => setEditKK(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Seberapa mendesak kebutuhan ini?</label>
                <select
                  className="form-control select"
                  value={normalizeCitizenUrgency(editPriority)}
                  onChange={(e) => setEditPriority(e.target.value)}
                >
                  <option value="Sangat mendesak">Sangat mendesak (Kondisi genting / persediaan habis)</option>
                  <option value="Perlu segera">Perlu segera (Menipis dalam 1-2 hari)</option>
                  <option value="Bisa menunggu">Bisa menunggu (Masih ada sedikit persediaan)</option>
                </select>
                <small style={{ color: "#758378", marginTop: "4px", display: "block", fontSize: "0.82rem" }}>
                  Penilaian tingkat kedaruratan dari sudut pandang warga di lokasi.
                </small>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setEditingCase(null)}>Batal</Button>
              <Button onClick={saveEdit}><Icon name="check" /> Simpan Perubahan</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS LANGSUNG DI DEPAN (DELETE) */}
      {deletingCase && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", maxWidth: "440px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>⚠️</div>
              <h3 style={{ margin: "0 0 8px", color: "#cf1322" }}>Hapus Kasus {deletingCase.id}?</h3>
              <p style={{ margin: 0, color: "#48554a", fontSize: "0.9rem", lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus data kebutuhan <strong>{deletingCase.item} ({deletingCase.qty})</strong>? Data akan dihapus langsung dari daftar.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setDeletingCase(null)}>Batal</Button>
              <button
                type="button"
                onClick={confirmDelete}
                style={{
                  background: "#cf1322",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI PENERIMAAN BANTUAN CEPAT (BAST DIGITAL) */}
      {confirmingReceiptCase && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div style={{ background: "#ffffff", borderRadius: "18px", padding: "24px 22px", maxWidth: "520px", width: "100%", maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #e2e8f0" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#059669", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  BERITA ACARA SERAH TERIMA (BAST DIGITAL)
                </span>
                <h3 style={{ margin: "2px 0 0", color: "#013220", fontSize: "1.15rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Icon name="check" /> Konfirmasi Penerimaan Bantuan
                </h3>
              </div>
              <button type="button" onClick={() => setConfirmingReceiptCase(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#64748b", padding: "0 4px" }}>×</button>
            </div>

            {/* Case Preview Card */}
            <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px 14px", marginBottom: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#0f172a" }}>{confirmingReceiptCase.id}</span>
                <span style={{ fontSize: "0.75rem", background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", padding: "2px 8px", borderRadius: "6px", fontWeight: 700 }}>
                  {confirmingReceiptCase.kk}
                </span>
              </div>
              <div style={{ fontSize: "0.95rem", fontWeight: 700, color: "#013220", marginBottom: "4px" }}>
                {confirmingReceiptCase.item}
              </div>
              <div style={{ fontSize: "0.8rem", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                <Icon name="pin" /> {confirmingReceiptCase.location}
              </div>
            </div>

            {/* Input Form */}
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label className="form-label" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px", display: "block" }}>
                  Volume / Kuantitas yang Diterima Secara Fisik *
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={receivedVolume}
                  onChange={(e) => setReceivedVolume(e.target.value)}
                  placeholder="Contoh: 50 Paket Sembako"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
                <small style={{ color: "#64748b", fontSize: "0.76rem", marginTop: "3px", display: "block" }}>
                  Target permohonan awal: <strong>{confirmingReceiptCase.qty}</strong>
                </small>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px", display: "block" }}>
                  Catatan Kondisi Fisik Bantuan &amp; Keterangan Serah Terima
                </label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="Contoh: Barang telah diserahterimakan langsung dalam keadaan baik dan utuh disaksikan warga."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", resize: "vertical" }}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "4px", display: "block" }}>
                  Foto Bukti Serah Terima Lapangan (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleReceiptPhotoUpload}
                  style={{ fontSize: "0.82rem" }}
                />
                {receiptPhoto && (
                  <div style={{ marginTop: "8px", position: "relative", width: "100%", maxHeight: "140px", overflow: "hidden", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <img src={receiptPhoto} alt="Bukti serah terima" style={{ width: "100%", height: "140px", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => setReceiptPhoto("")}
                      style={{ position: "absolute", top: "6px", right: "6px", background: "rgba(0,0,0,0.6)", color: "#fff", border: "none", borderRadius: "4px", padding: "2px 6px", fontSize: "0.75rem", cursor: "pointer" }}
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>

              <label style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontSize: "0.8rem", color: "#334155", background: "#f8fafc", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isDeclarationChecked}
                  onChange={(e) => setIsDeclarationChecked(e.target.checked)}
                  style={{ marginTop: "2px" }}
                />
                <span>
                  Saya menyatakan bahwa bantuan fisik telah benar-benar diterima di lokasi sasaran warga, dan data ini siap disahkan dalam audit transparansi posko.
                </span>
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setConfirmingReceiptCase(null)} disabled={isSubmittingReceipt}>
                Batal
              </Button>
              <button
                type="button"
                onClick={handleConfirmReceipt}
                disabled={isSubmittingReceipt || !isDeclarationChecked}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "9px 18px",
                  background: isSubmittingReceipt || !isDeclarationChecked ? "#94a3b8" : "#059669",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  cursor: isSubmittingReceipt || !isDeclarationChecked ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 8px rgba(5, 150, 105, 0.3)",
                }}
              >
                {isSubmittingReceipt ? "Memproses BAST..." : <><Icon name="check" /> Konfirmasi &amp; Terbitkan BAST</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DIGITAL BAST PRINT / DOWNLOAD MODAL */}
      {selectedBastCase && (
        <BastPrintModal
          caseRecord={selectedBastCase}
          onClose={() => setSelectedBastCase(null)}
        />
      )}
    </main>
  );
}
