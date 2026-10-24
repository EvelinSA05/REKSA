import { useState, useEffect } from "react";
import { CaseRecord, getFieldEvidencePhoto } from "../../App";
import { AppIcon } from "../common/Icons";
import { apiService } from "../../services/api";
import { evaluateCaseSla } from "../../utils/slaEscalationEngine";

interface MitraVerifikasiLaporanProps {
  cases: CaseRecord[];
  onRefresh?: () => Promise<void> | void;
  notify?: (msg: string) => void;
  update?: (changes: any, log?: string) => void;
  onSelectCase?: (c: CaseRecord) => void;
  userOrg?: string;
  userName?: string;
  onNavigateToTasks?: () => void;
}

export function MitraVerifikasiLaporan({
  cases,
  onRefresh,
  notify,
  update,
  onSelectCase,
  userOrg = "Palang Merah Indonesia (PMI Cabang Jawa Timur)",
  userName = "dr. Hendra Wijaya",
  onNavigateToTasks,
}: MitraVerifikasiLaporanProps) {
  const [tab, setTab] = useState<"menunggu" | "diverifikasi" | "ditolak" | "semua">("menunggu");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; location?: string } | null>(null);

  // Modal state
  const [modalAction, setModalAction] = useState<"verify" | "reject" | "clarify" | null>(null);
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [notesInput, setNotesInput] = useState("");
  const [clarificationCategory, setClarificationCategory] = useState("Foto / Bukti Fisik Buram / Kurang Jelas");
  const [requestAttachment, setRequestAttachment] = useState(true);
  const [priorityChoice, setPriorityChoice] = useState("Tinggi");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    onRefresh?.();
  }, [onRefresh]);

  // Kasus yang dialihkan ke mitra — semua status "Menunggu Verifikasi Mitra" / "Dialihkan ke Mitra"
  const escIds: string[] = (() => {
    try {
      return JSON.parse(localStorage.getItem("reksa_escalated_case_ids") || "[]");
    } catch {
      return [];
    }
  })();

  const allEscalated = cases.filter((c) => {
    const s = (c.status || "").toLowerCase();
    const notes = ((c.notes || "") + " " + (c.catatanVerifikasiPosko || "") + " " + (c.catatanPengalihan || "")).toLowerCase();
    return (
      c.escalatedToMitra === true ||
      escIds.includes(c.id) ||
      s.includes("menunggu verifikasi mitra") ||
      s.includes("dialihkan ke mitra") ||
      s.includes("mitra") ||
      notes.includes("dialihkan ke mitra") ||
      notes.includes("dialihkan")
    );
  });

  const filterCases = allEscalated.filter((c) => {
    const s = (c.status || "").toLowerCase();
    const isResolved = ["terbuka", "sebagian", "selesai"].some((k) => s.includes(k));
    const isRejected = s.includes("tolak");

    let matchTab = true;

    if (tab === "menunggu") {
      matchTab = !isResolved && !isRejected;
    } else if (tab === "diverifikasi") {
      matchTab = isResolved;
    } else if (tab === "ditolak") {
      matchTab = isRejected;
    } else if (tab === "semua") {
      matchTab = true;
    }

    if (!matchTab) return false;

    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (c.id || "").toLowerCase().includes(q) ||
        (c.item || "").toLowerCase().includes(q) ||
        (c.location || "").toLowerCase().includes(q) ||
        (c.applicantName || "").toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalItems = filterCases.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validPage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = (validPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedCases = filterCases.slice(startIndex, endIndex);

  const menungguCount = allEscalated.filter((c) => {
    const s = (c.status || "").toLowerCase();
    return !["terbuka", "sebagian", "selesai", "tolak"].some((k) => s.includes(k));
  }).length;
  const diverifikasiCount = allEscalated.filter((c) =>
    ["terbuka", "sebagian", "selesai"].some((k) => (c.status || "").toLowerCase().includes(k))
  ).length;
  const ditolakCount = allEscalated.filter((c) =>
    (c.status || "").toLowerCase().includes("tolak")
  ).length;

  const openModal = (c: CaseRecord, action: "verify" | "reject" | "clarify") => {
    setSelectedCase(c);
    setModalAction(action);
    setNotesInput("");
    setClarificationCategory("Foto / Bukti Fisik Buram / Kurang Jelas");
    setRequestAttachment(true);
    setPriorityChoice(c.urgency === "Kritis" ? "Kritis" : "Tinggi");
  };

  const handleExecuteAction = async () => {
    if (!selectedCase || !modalAction) return;
    setIsSubmitting(true);

    // Optimistic update — UI langsung berubah
    const isDirectAssignment = Boolean(
      selectedCase.escalatedToMitra ||
      selectedCase.mitraHandler ||
      (selectedCase.status || "").toLowerCase().includes("mitra") ||
      (selectedCase.status || "").toLowerCase().includes("dialihkan")
    );

    const newStatus =
      modalAction === "verify" 
        ? (isDirectAssignment ? "Dalam Pengiriman" : "Kebutuhan Terbuka") 
        : modalAction === "clarify"
        ? "Perlu Klarifikasi"
        : "Ditolak Mitra";

    const targetNum = parseInt((selectedCase.qty || selectedCase.kk || "100").replace(/[^0-9]/g, "")) || 100;
    const targetUnit = (selectedCase.qty || selectedCase.kk || "Unit").replace(/[0-9.,]/g, "").trim() || "Unit";
    const numericId = typeof selectedCase.rawId === "number" ? selectedCase.rawId : (parseInt(selectedCase.id.replace(/\D/g, "")) || Date.now());

    const updatedCases = cases.map((c) =>
      c.id === selectedCase.id
        ? {
            ...c,
            status: newStatus,
            urgency: modalAction === "verify" ? priorityChoice : c.urgency,
            escalatedToMitra: true,
            totalAlokasiResmi: modalAction === "verify" ? `${targetNum} ${targetUnit}` : c.totalAlokasiResmi,
            mitraHandler: userOrg || selectedCase.mitraHandler || "Palang Merah Indonesia (PMI Cabang Jawa Timur)",
            catatanVerifikasiPosko: modalAction === "verify" ? (notesInput || "Data diverifikasi valid oleh Mitra. Misi Penyaluran langsung diterbitkan dan armada siaga bergerak.") : c.catatanVerifikasiPosko,
            statusTone: modalAction === "clarify" ? "#d97706" : c.statusTone,
            clarificationCategory: modalAction === "clarify" ? clarificationCategory : c.clarificationCategory,
            clarificationQuestion: modalAction === "clarify" ? (notesInput || `Mohon lengkapi perbaikan ${clarificationCategory.toLowerCase()} untuk laporan kebutuhan ini.`) : c.clarificationQuestion,
            clarificationAttachmentRequested: modalAction === "clarify" ? requestAttachment : c.clarificationAttachmentRequested,
            clarificationHistory: modalAction === "clarify" ? [
              ...(c.clarificationHistory || []),
              {
                date: new Date().toISOString(),
                by: "Mitra Kemanusiaan",
                category: clarificationCategory,
                question: notesInput || `Mohon lengkapi perbaikan ${clarificationCategory.toLowerCase()} untuk laporan kebutuhan ini.`,
                requestAttachment: requestAttachment,
              }
            ] : c.clarificationHistory,
          }
        : c
    );

    let updatedBursaList: any[] = [];
    try {
      const bLocal = localStorage.getItem("reksa_bursa_db");
      if (bLocal) {
        updatedBursaList = JSON.parse(bLocal);
      }
    } catch (_) {}

    let updatedPenawaranList: any[] = [];
    try {
      const pLocal = localStorage.getItem("reksa_penawaran_db");
      if (pLocal) updatedPenawaranList = JSON.parse(pLocal);
    } catch (_) {}

    let updatedMisiList: any[] = [];
    try {
      const mLocal = localStorage.getItem("reksa_misi_db");
      if (mLocal) updatedMisiList = JSON.parse(mLocal);
    } catch (_) {}

    if (modalAction === "verify") {
      const newBursaItem = {
        id: numericId,
        kebutuhan_id: numericId,
        posko_id: 1,
        item_bantuan: selectedCase.item || "Kebutuhan Darurat Warga",
        target_volume: `${targetNum} ${targetUnit}`,
        volume_terpenuhi: `${targetNum} ${targetUnit}`,
        urgensi: priorityChoice || selectedCase.urgency || "Tinggi",
        status: isDirectAssignment ? "Teralokasi Penuh" : "Terbuka",
        published_at: "Hari ini, Baru diverifikasi",
        claimed_org: userOrg || selectedCase.mitraHandler || "Palang Merah Indonesia (PMI Cabang Jawa Timur)",
        claimed_volume: `${targetNum} ${targetUnit}`,
        posko: {
          id: 1,
          kode_posko: "PSK-01",
          nama_posko: selectedCase.posko || "Posko BPBD Provinsi Jawa Timur",
          desa: selectedCase.village || "Gubeng",
          kecamatan: selectedCase.district || "Gubeng",
          kabupaten: selectedCase.regency || "Kota Surabaya",
          provinsi: selectedCase.province || "Jawa Timur",
          latitude: Number(selectedCase.lat) || -7.2654,
          longitude: Number(selectedCase.lng) || 112.7521,
          kapasitas_kk: 100,
          kk_terdata: 25,
          status_operasional: "Aktif Penuh",
        },
        kebutuhan: {
          id: numericId,
          kode_kasus: selectedCase.id,
          citizen_name: selectedCase.applicantName || "Warga Terdampak",
          citizen_phone: selectedCase.applicantPhone,
          posko_id: 1,
          kategori_kebutuhan: selectedCase.item,
          volume_permintaan: `${targetNum} ${targetUnit}`,
          jumlah_kk: parseInt((selectedCase.kk || "1").replace(/\D/g, "")) || 1,
          status_hunian: selectedCase.shelterStatus || "Rumah Tinggal Pribadi",
          tingkat_urgensi: priorityChoice || selectedCase.urgency || "Tinggi",
          status: isDirectAssignment ? "Dalam Pengiriman" : "Kebutuhan Terbuka",
          desa: selectedCase.village || "",
          kecamatan: selectedCase.district || "",
          kabupaten: selectedCase.regency || "",
          provinsi: selectedCase.province || "Jawa Timur",
          latitude: Number(selectedCase.lat) || -7.2654,
          longitude: Number(selectedCase.lng) || 112.7521,
          foto_bukti: selectedCase.fotoBukti,
          deskripsi: notesInput || selectedCase.notes,
          created_at: new Date().toISOString(),
        },
      };

      const existingIndex = updatedBursaList.findIndex(
        (b) => b.id === numericId || b.kebutuhan?.kode_kasus === selectedCase.id
      );
      if (existingIndex >= 0) {
        updatedBursaList[existingIndex] = { ...updatedBursaList[existingIndex], ...newBursaItem };
      } else {
        updatedBursaList = [newBursaItem, ...updatedBursaList];
      }

      // ─── ALUR PENUGASAN LANGSUNG: OTOMATIS PENAWARAN DISETUJUI & TERBIT MISI ───
      const resolvedFleet = (selectedCase.item || "").toLowerCase().includes("obat") || (selectedCase.item || "").toLowerCase().includes("medis")
        ? "Mobil Ambulans & Logistik Medis PMI No. 04"
        : (selectedCase.item || "").toLowerCase().includes("air")
        ? "Truk Tangki Air Bersih Mitra No. 02"
        : "Mobil Box Logistik Distribusi Cepat Mitra";

      const newOffer = {
        id: Date.now(),
        kode_penawaran: `TWR-DIR-${String(Date.now()).slice(-4)}`,
        bursa_id: numericId,
        kebutuhan_id: numericId,
        posko_id: 1,
        mitra_id: 4,
        mitra_name: userName || "dr. Hendra Wijaya",
        organisasi: userOrg || selectedCase.mitraHandler || "Palang Merah Indonesia (PMI Cabang Jawa Timur)",
        jenis_bantuan: selectedCase.item || "Bantuan Kemanusiaan",
        jumlah_tawaran: `${targetNum} ${targetUnit}`,
        volume_angka: targetNum,
        satuan: targetUnit,
        waktu_kesiapan: "Siap Berangkat Langsung",
        armada_info: resolvedFleet,
        status: "Disetujui" as const,
        jumlah_disetujui: `${targetNum} ${targetUnit}`,
        volume_disetujui_angka: targetNum,
        catatan: notesInput || "Penugasan langsung dari Posko BPBD disahkan dan armada mitra siap berangkat.",
        created_at: "Hari ini, Baru diverifikasi",
        bursa: newBursaItem,
        kebutuhan: newBursaItem.kebutuhan,
      };

      updatedPenawaranList = [newOffer, ...updatedPenawaranList.filter((p: any) => p.kebutuhan_id !== numericId)];

      const newMisi = {
        id: Date.now(),
        kode_misi: `MISI-EXP-${String(Date.now()).slice(-4)}`,
        kebutuhan_id: numericId,
        bursa_id: numericId,
        penawaran_id: newOffer.id,
        posko_id: 1,
        responder_name: userName || "dr. Hendra Wijaya",
        responder_phone: "+62 812 8899 0011",
        organisasi: userOrg || selectedCase.mitraHandler || "Palang Merah Indonesia (PMI Cabang Jawa Timur)",
        armada_info: resolvedFleet,
        muatan: `${targetNum} ${targetUnit}`,
        status_tahapan: "Dalam Perjalanan",
        estimasi_waktu: "25 Menit (3,8 km)",
        catatan_lapangan: notesInput || "Armada logistik mitra telah diverifikasi dan langsung diberangkatkan menuju lokasi warga terdampak.",
        posko: newBursaItem.posko,
        kebutuhan: newBursaItem.kebutuhan,
      };

      updatedMisiList = [newMisi, ...updatedMisiList.filter((m: any) => m.kebutuhan_id !== numericId)];

      try {
        localStorage.setItem("reksa_bursa_db", JSON.stringify(updatedBursaList));
        localStorage.setItem("reksa_penawaran_db", JSON.stringify(updatedPenawaranList));
        localStorage.setItem("reksa_misi_db", JSON.stringify(updatedMisiList));
      } catch (_) {}
    }

    update?.({ 
      casesList: updatedCases,
      ...(modalAction === "verify" ? { 
        bursaList: updatedBursaList,
        penawaranList: updatedPenawaranList,
        misiList: updatedMisiList,
        assignment: "Dalam Perjalanan",
      } : {})
    });
    try {
      localStorage.setItem("reksa_cases_db", JSON.stringify(updatedCases));
    } catch (_) {}

    const notifMsg =
      modalAction === "verify"
        ? `Laporan ${selectedCase.id} diverifikasi & disahkan! Penawaran otomatis disetujui Posko BPBD dan Misi Penyaluran armada langsung aktif diterbitkan.`
        : modalAction === "clarify"
        ? `Permintaan klarifikasi telah dikirimkan ke pelapor untuk laporan ${selectedCase.id}.`
        : `Laporan ${selectedCase.id} ditolak oleh Mitra.`;
    notify?.(notifMsg);
    setModalAction(null);
    setSelectedCase(null);
    setIsSubmitting(false);

    // Kirim ke server di background
    try {
      if (modalAction === "verify") {
        await apiService.verifyKebutuhan(selectedCase.id, {
          action: "verify_and_publish",
          priority: priorityChoice,
          catatan: notesInput || "Diverifikasi oleh Mitra dan dirilis ke Bursa Bantuan.",
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
          alasan: notesInput || "Laporan tidak dapat ditangani oleh Mitra saat ini.",
          tindak_lanjut: "Harap hubungi kembali Posko BPBD untuk penanganan lebih lanjut.",
        });
      }
      onRefresh?.().catch(() => {});
    } catch (err: any) {
      notify?.(
        `Catatan: sinkronisasi server tertunda (${err?.message || "timeout"}). Data sudah tersimpan lokal.`
      );
    }
  };

  return (
    <main
      className="workspace posko-verifikasi-workspace"
      style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div>
          <span
            className="eyebrow"
            style={{
              color: "#80866e",
              fontWeight: 700,
              letterSpacing: "0.05em",
              fontSize: "0.78rem",
            }}
          >
            MODUL MITRA BANTUAN
          </span>
          <h1
            style={{
              margin: "4px 0 6px",
              color: "#013220",
              fontSize: "1.75rem",
              fontWeight: 800,
            }}
          >
            Verifikasi Laporan Dialihkan
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {onRefresh && (
            <button
              type="button"
              onClick={() => onRefresh?.()}
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#166534",
                borderRadius: "10px",
                padding: "8px 14px",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
              title="Segarkan antrean dari database server"
            >
              <AppIcon name="clock" size={14} />
              <span>Segarkan Antrean</span>
            </button>
          )}
          <div
            style={{
              background: "#ffffff",
              border: "1px solid rgba(1, 50, 32, 0.12)",
              padding: "8px 14px",
              borderRadius: "10px",
              fontSize: "0.84rem",
              fontWeight: 700,
              color: "#013220",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#15803d",
              }}
            />
            <span>Antrean Mitra ({allEscalated.length} Laporan)</span>
          </div>
        </div>
      </div>

      {/* TAB BAR + SEARCH */}
      <div className="posko-verifikasi-toolbar">
        <div className="posko-toolbar-tabs">
          {[
            {
              id: "menunggu",
              label: "Menunggu Verifikasi",
              count: menungguCount,
              hasIcon: true,
            },
            {
              id: "diverifikasi",
              label: "Diverifikasi / Terbuka",
              count: diverifikasiCount,
            },
            { id: "ditolak", label: "Ditolak", count: ditolakCount },
            { id: "semua", label: "Semua Laporan", count: allEscalated.length },
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
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  {tabItem.hasIcon && <AppIcon name="bolt" size={13} />}
                  <span>{tabItem.label}</span>
                </span>
                <span
                  className={`tab-count-badge ${isActive ? "badge-active" : ""}`}
                >
                  {tabItem.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="posko-toolbar-search-row">
          <div className="posko-search-input-wrap">
            <span className="posko-search-icon">
              <AppIcon name="search" size={15} />
            </span>
            <input
              type="text"
              placeholder="Cari berdasarkan kode kasus, nama warga, komoditas, atau lokasi..."
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
              >
                ×
              </button>
            )}
          </div>
          <div className="posko-search-meta">
            <span className="posko-search-count-text">
              Menampilkan{" "}
              <strong>{totalItems > 0 ? `${startIndex + 1}-${endIndex}` : 0}</strong>{" "}
              dari {allEscalated.length} laporan
              {totalPages > 1 && ` (Halaman ${validPage}/${totalPages})`}
            </span>
          </div>
        </div>
      </div>

      {/* LIST LAPORAN */}
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
            <AppIcon name="file" size={24} />
          </div>
          <h3
            style={{
              margin: "0 0 6px",
              color: "#013220",
              fontSize: "1.1rem",
              fontWeight: 700,
            }}
          >
            Tidak Ada Laporan di Antrean Ini
          </h3>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.88rem" }}>
            {tab === "menunggu"
              ? "Belum ada laporan yang dialihkan BPBD ke Mitra untuk diverifikasi."
              : "Semua laporan telah diproses atau tidak ada data yang sesuai filter."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {paginatedCases.map((c) => {
            const s = (c.status || "").toLowerCase();
            const isVerified =
              s.includes("terbuka") ||
              s.includes("sebagian") ||
              s.includes("selesai");
            const isRejected = s.includes("tolak");
            const isClarify = s.includes("klarifikasi");
            const isPending =
              s.includes("menunggu verifikasi mitra") ||
              s.includes("dialihkan ke mitra") ||
              (!isVerified && !isRejected);

            const cardClass = isVerified
              ? "card-verified"
              : isRejected
              ? "card-rejected"
              : "card-pending";
            const statusClass = isVerified
              ? "status-verified"
              : isRejected
              ? "status-rejected"
              : "status-clarify";
            const urgencyClass = (c.urgency || "sedang")
              .toLowerCase()
              .replace(/\s+/g, "-");
            const sla = evaluateCaseSla(c);

            return (
              <div key={c.id} className={`posko-case-card ${cardClass}`}>
                {/* Header badges */}
                <div className="posko-case-header-row">
                  <div className="posko-case-badges">
                    <span className="posko-case-id-badge">{c.id}</span>
                    <span
                      className={`posko-case-urgency-badge urgency-${urgencyClass}`}
                    >
                      Prioritas {c.urgency}
                    </span>

                    {/* Status badge */}
                    <span
                      className={`posko-case-status-badge ${statusClass}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      {isClarify ? (
                        <>
                          <AppIcon name="alert" size={11} />
                          <span>Menunggu Klarifikasi Pelapor</span>
                        </>
                      ) : isPending ? (
                        <>
                          <AppIcon name="bolt" size={11} />
                          <span>Dialihkan ke Mitra — Menunggu Verifikasi</span>
                        </>
                      ) : (
                        <span>{c.status}</span>
                      )}
                    </span>

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

                    {isPending && (
                      <span
                        style={{
                          background:
                            sla.status === "warning" ? "#013220" : "#ffffff",
                          color:
                            sla.status === "warning" ? "#ffffff" : "#013220",
                          border: "1px solid #013220",
                          padding: "3px 9px",
                          borderRadius: "999px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                        title="SLA verifikasi Mitra"
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

                {/* Judul kasus & Visual Thumbnail */}
                <div className="posko-case-body-main">
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
                      <AppIcon name="search" size={13} style={{ color: "#ffffff" }} />
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="posko-case-info-col">
                    <h3 className="posko-case-title">
                      Kebutuhan {c.item} · {c.qty}
                    </h3>

                    <div className="posko-case-meta-row">
                      <span className="posko-case-meta-item">
                        <AppIcon name="pin" size={14} style={{ color: "#013220" }} />
                        <span>{c.location || "Wilayah Posko"}</span>
                      </span>
                      <span className="posko-case-meta-item">
                        <AppIcon
                          name="users"
                          size={14}
                          style={{ color: "#013220" }}
                        />
                        <span>
                          <strong>{c.kk}</strong>
                        </span>
                      </span>
                      <span className="posko-case-meta-item">
                        <AppIcon name="user" size={14} style={{ color: "#013220" }} />
                        <span>
                          Pelapor: <strong>{c.applicantName || "Warga Terdampak"}</strong>{" "}
                          {c.applicantPhone ? `(${c.applicantPhone})` : ""}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Context section */}
                <div className="posko-case-context-section">
                  {/* Banner "Dialihkan BPBD" */}
                  {isPending && (
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
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontWeight: 700,
                          color: "#013220",
                        }}
                      >
                        <AppIcon name="bolt" size={14} />
                        <span>
                          LAPORAN DIALIHKAN BPBD — MENUNGGU VERIFIKASI MITRA
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          color: "#2d3748",
                          lineHeight: 1.45,
                        }}
                      >
                        BPBD telah mengalihkan verifikasi laporan ini kepada
                        Mitra.{" "}
                        {c.mitraHandler && (
                          <>
                            Ditugaskan ke: <strong>{c.mitraHandler}</strong>.{" "}
                          </>
                        )}
                        Silakan verifikasi dan rilis ke Bursa Bantuan, atau tolak jika tidak dapat ditangani.
                      </p>
                    </div>
                  )}

                  {c.priorityRationale && (
                    <div className="posko-validation-box">
                      <div style={{ marginTop: "2px" }}>
                        <AppIcon name="shield" size={15} />
                      </div>
                      <div>
                        <strong>Rekomendasi Sistem Validasi:</strong>{" "}
                        {c.priorityRationale}
                      </div>
                    </div>
                  )}

                  {c.notes && (
                    <div className="posko-notes-box">
                      <div style={{ marginTop: "2px", color: "#013220" }}>
                        <AppIcon name="file" size={14} />
                      </div>
                      <div>
                        <strong>Catatan Pelapor:</strong> {c.notes}
                      </div>
                    </div>
                  )}

                  {((c.status || "").toLowerCase().includes("klarifikasi") || c.clarificationQuestion) && (
                    <div
                      style={{
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        fontSize: "0.84rem",
                        color: "#92400e",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700 }}>
                        <AppIcon name="alert" size={14} />
                        <span>STATUS: MENUNGGU KLARIFIKASI PELAPOR</span>
                        {c.clarificationCategory && (
                          <span style={{ fontSize: "0.75rem", background: "#fef3c7", padding: "2px 8px", borderRadius: "6px", border: "1px solid #fcd34d" }}>
                            {c.clarificationCategory}
                          </span>
                        )}
                      </div>
                      <div>
                        <strong>Pertanyaan Klarifikasi:</strong> {c.clarificationQuestion || "Menunggu pelapor melengkapi rincian data."}
                      </div>
                      {c.clarificationCitizenResponse && (
                        <div style={{ marginTop: "4px", padding: "8px 10px", background: "#ffffff", borderRadius: "8px", border: "1px solid #fde68a", color: "#1e293b" }}>
                          <strong style={{ color: "#013220" }}>Tanggapan Warga:</strong> {c.clarificationCitizenResponse}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Hasil verifikasi jika sudah diverifikasi */}
                  {isVerified && (
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #86efac",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        fontSize: "0.84rem",
                        color: "#15803d",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <AppIcon name="check" size={14} />
                      <span>
                        <strong>Telah diverifikasi Mitra</strong> — Laporan aktif di Bursa Bantuan.
                      </span>
                    </div>
                  )}

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
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: "4px",
                          color: "#0f172a",
                        }}
                      >
                        Alasan Penolakan: {c.alasanPenolakan}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action footer */}
                <div className="posko-case-footer-row">
                  <button
                    type="button"
                    onClick={() => onSelectCase?.(c)}
                    className="btn-case-view"
                    title="Buka dokumen detail dan pemeriksaan kasus"
                  >
                    <AppIcon name="file" size={14} />
                    <span>Buka Kasus</span>
                  </button>

                  <div className="posko-case-actions-cluster">
                    {isPending && (
                      <>
                        <button
                          type="button"
                          onClick={() => openModal(c, "clarify")}
                          className="btn-case-clarify"
                          title="Minta klarifikasi tambahan dari pelapor"
                        >
                          <AppIcon name="alert" size={13} />
                          <span>Minta Klarifikasi</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal(c, "reject")}
                          className="btn-case-reject"
                          title="Tolak laporan — tidak dapat ditangani Mitra"
                        >
                          <AppIcon name="x" size={13} />
                          <span>Tolak</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openModal(c, "verify")}
                          className="btn-case-verify"
                          title="Verifikasi laporan dan rilis ke Bursa Bantuan"
                        >
                          <AppIcon name="check" size={13} />
                          <span>Verifikasi &amp; Rilis</span>
                        </button>
                      </>
                    )}

                    {isVerified && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.83rem",
                          color: "#15803d",
                          fontWeight: 600,
                        }}
                      >
                        <AppIcon name="check" size={14} />
                        <span>Aktif di Bursa</span>
                      </div>
                    )}

                    {isRejected && (
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.83rem",
                          color: "#991b1b",
                          fontWeight: 600,
                        }}
                      >
                        <AppIcon name="x" size={14} />
                        <span>Ditolak Mitra</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {totalItems > 0 && (
        <div className="posko-pagination-card">
          <div className="posko-pagination-info">
            <span>
              Menampilkan <strong>{startIndex + 1}</strong> -{" "}
              <strong>{endIndex}</strong> dari <strong>{totalItems}</strong>{" "}
              laporan
            </span>
            <span className="posko-pagination-limit-badge">
              Maks. {pageSize} data per halaman
            </span>
          </div>
          <div className="posko-pagination-controls">
            <button
              type="button"
              className="posko-page-nav-btn"
              disabled={validPage <= 1}
              onClick={() => setCurrentPage(validPage - 1)}
            >
              <span>&larr;</span> Sebelumnya
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                className={`posko-page-num-btn ${p === validPage ? "active" : ""}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              className="posko-page-nav-btn"
              disabled={validPage >= totalPages}
              onClick={() => setCurrentPage(validPage + 1)}
            >
              Selanjutnya <span>&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL VERIFIKASI / TOLAK */}
      {modalAction && selectedCase && (
        <div
          className="modal-backdrop"
          onClick={() => setModalAction(null)}
          style={{ overflowY: "auto", padding: "20px 14px", display: "flex", justifyContent: "center", alignItems: "flex-start" }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(560px, 95%)",
              maxHeight: "calc(100vh - 40px)",
              overflowY: "auto",
              textAlign: "left",
              borderRadius: "16px",
              padding: "24px 28px",
              margin: "auto",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  color: "#013220",
                  margin: 0,
                  fontWeight: 800,
                }}
              >
                {modalAction === "verify"
                  ? `Verifikasi Laporan ${selectedCase.id}`
                  : modalAction === "clarify"
                  ? `Minta Klarifikasi untuk ${selectedCase.id}`
                  : `Tolak Laporan ${selectedCase.id}`}
              </h2>
              <button
                type="button"
                onClick={() => setModalAction(null)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#64748b",
                  padding: "4px",
                }}
              >
                <AppIcon name="x" size={18} />
              </button>
            </div>

            <p
              style={{
                color: "#64748b",
                fontSize: "0.88rem",
                marginBottom: "18px",
              }}
            >
              Komoditas:{" "}
              <strong>
                {selectedCase.item} ({selectedCase.qty})
              </strong>{" "}
              untuk {selectedCase.kk} di {selectedCase.location}.
            </p>

            {modalAction === "verify" && (
              <>
                <div style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  marginBottom: "16px",
                  fontSize: "0.84rem",
                  color: "#166534",
                  lineHeight: 1.45,
                }}>
                  <strong>🚀 Jalur Penugasan Khusus:</strong> Karena laporan ini telah didelegasikan resmi sejak awal kepada <strong>{userOrg || selectedCase.mitraHandler || "Mitra Kemanusiaan"}</strong>, verifikasi ini otomatis mencatat proposal di <strong>Penawaran Saya</strong>, disetujui Posko BPBD, dan <strong>Misi Penyaluran armada langsung aktif diterbitkan</strong>.
                </div>
                <label
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "#013220",
                    display: "block",
                    marginBottom: "8px",
                  }}
                >
                  Konfirmasi Prioritas Penanganan:
                </label>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginBottom: "16px",
                  }}
                >
                  {["Kritis", "Tinggi", "Sedang"].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriorityChoice(p)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "10px",
                        border:
                          priorityChoice === p
                            ? "2px solid #013220"
                            : "1px solid #cbd5e1",
                        background:
                          priorityChoice === p ? "#f0fdf4" : "#ffffff",
                        fontWeight: priorityChoice === p ? 700 : 500,
                        color:
                          priorityChoice === p ? "#013220" : "#64748b",
                        cursor: "pointer",
                        fontFamily: "inherit",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <label
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "#013220",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Catatan Verifikasi Mitra (Disimpan di riwayat &amp; Bursa):
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Laporan diverifikasi lapangan oleh Mitra, kebutuhan valid dan segera dirilis ke Bursa."
                  style={{
                    marginBottom: "20px",
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </>
            )}

            {modalAction === "clarify" && (
              <>
                <div
                  style={{
                    background: "#fffbeb",
                    border: "1px solid #fde68a",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    marginBottom: "14px",
                    fontSize: "0.84rem",
                    color: "#92400e",
                  }}
                >
                  <strong>Pertanyaan Langsung ke Warga:</strong> Permintaan klarifikasi akan dikirimkan ke pelapor untuk melengkapi bukti atau rincian kebutuhan yang diperlukan.
                </div>

                <label
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "#013220",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Jenis Informasi yang Perlu Diperbaiki:
                </label>
                <select
                  value={clarificationCategory}
                  onChange={(e) => setClarificationCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    marginBottom: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="Foto / Bukti Fisik Buram / Kurang Jelas">Foto / Bukti Fisik Buram atau Kurang Jelas</option>
                  <option value="Rincian Jumlah Jiwa Rentan & KK Terdampak">Rincian Jumlah Jiwa Rentan (Balita/Lansia) &amp; KK</option>
                  <option value="Titik Koordinat Lokasi & Akses Distribusi">Titik Koordinat Lokasi &amp; Akses Jalan Lapangan</option>
                  <option value="Spesifikasi & Volume Permintaan Logistik">Spesifikasi &amp; Volume Permintaan Kebutuhan Medis/Logistik</option>
                  <option value="Kelengkapan Informasi Lainnya">Kelengkapan Informasi Lainnya</option>
                </select>

                <label
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "#013220",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Pertanyaan Spesifik untuk Pelapor (Wajib):
                </label>
                <textarea
                  rows={4}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Tuliskan pertanyaan spesifik, misalnya: 'Foto kondisi pasien/tenda pengungsian buram, mohon unggah ulang foto yang jelas' atau 'Mohon rincikan jumlah balita dan obat darurat yang dibutuhkan.'"
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    marginBottom: "12px",
                    boxSizing: "border-box",
                    fontFamily: "inherit",
                  }}
                />

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.86rem",
                    color: "#013220",
                    fontWeight: 600,
                    cursor: "pointer",
                    marginBottom: "16px",
                    background: "#fbfbf8",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={requestAttachment}
                    onChange={(e) => setRequestAttachment(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#013220" }}
                  />
                  <span>Meminta pelapor mengunggah foto atau dokumen bukti pendukung tambahan</span>
                </label>
              </>
            )}

            {modalAction === "reject" && (
              <>
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "10px",
                    padding: "10px 14px",
                    marginBottom: "14px",
                    fontSize: "0.84rem",
                    color: "#334155",
                  }}
                >
                  <strong>Catatan:</strong> Jika laporan masih dapat ditangani dengan dukungan BPBD, pertimbangkan untuk menghubungi koordinator posko terlebih dahulu.
                </div>

                <label
                  style={{
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    color: "#013220",
                    display: "block",
                    marginBottom: "6px",
                  }}
                >
                  Alasan Penolakan (Wajib):
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Komoditas tidak tersedia di gudang Mitra / Lokasi di luar jangkauan armada saat ini."
                  style={{
                    width: "100%",
                    minHeight: "90px",
                    flexShrink: 0,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    marginBottom: "18px",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
                marginTop: "8px",
              }}
            >
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
                  fontFamily: "inherit",
                }}
              >
                Batal
              </button>
              <button
                type="button"
                disabled={
                  isSubmitting ||
                  (modalAction === "reject" && !notesInput.trim()) ||
                  (modalAction === "clarify" && !notesInput.trim())
                }
                onClick={handleExecuteAction}
                style={{
                  background:
                    modalAction === "reject"
                      ? "#334155"
                      : modalAction === "clarify"
                      ? "#b45309"
                      : "#013220",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 20px",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  opacity:
                    isSubmitting ||
                    (modalAction === "reject" && !notesInput.trim()) ||
                    (modalAction === "clarify" && !notesInput.trim())
                      ? 0.6
                      : 1,
                }}
              >
                {isSubmitting
                  ? "Menyimpan..."
                  : modalAction === "verify"
                  ? "Verifikasi & Terbitkan Misi Penyaluran"
                  : modalAction === "clarify"
                  ? "Kirim Permintaan Klarifikasi"
                  : "Simpan Penolakan"}
              </button>
            </div>
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
