import { useState, useEffect } from "react";
import { CaseRecord, getFieldEvidencePhoto } from "../../App";
import { BursaItem, PenawaranItem, apiService } from "../../services/api";
import { AppIcon } from "../common/Icons";

export const getOfferPhoto = (jenisBantuan?: string, armadaInfo?: string, fotoBukti?: string) => {
  if (fotoBukti && typeof fotoBukti === "string" && fotoBukti.trim() !== "" && fotoBukti !== "null") {
    return fotoBukti;
  }
  const armada = (armadaInfo || "").toLowerCase();
  if (armada.includes("ambulans") || armada.includes("ambulance")) {
    return "https://images.unsplash.com/photo-1587745416684-47953f16f02f?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=1200&q=82";
  }
  if (armada.includes("box") || armada.includes("truk") || armada.includes("truck") || armada.includes("pickup") || armada.includes("armada")) {
    const jenis = (jenisBantuan || "").toLowerCase();
    if (!jenis || jenis.includes("semua")) {
      return "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=1200&q=82";
    }
  }
  return getFieldEvidencePhoto(jenisBantuan);
};

interface PoskoPenawaranAlokasiProps {
  penawaranList: PenawaranItem[];
  bursaList: BursaItem[];
  cases: CaseRecord[];
  onRefresh?: () => Promise<void> | void;
  notify?: (msg: string) => void;
  onNavigateToMissions: () => void;
  selectedCaseId?: string;
  update?: any;
}

export function PoskoPenawaranAlokasi({
  penawaranList,
  bursaList,
  cases,
  onRefresh,
  notify,
  onNavigateToMissions,
  selectedCaseId,
  update,
}: PoskoPenawaranAlokasiProps) {
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [caseFilter, setCaseFilter] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; location?: string } | null>(null);

  // Approval / Rejection modal
  const [activeOffer, setActiveOffer] = useState<PenawaranItem | null>(null);
  const [modalType, setModalType] = useState<"approvePartial" | "reject" | null>(null);
  const [partialAmountInput, setPartialAmountInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatOfferDate = (dateStr?: string) => {
    if (!dateStr) return "Hari ini, Baru diajukan";
    if (dateStr.includes("Hari ini") || dateStr.includes("Baru") || dateStr.includes("Kemarin") || dateStr.includes("WIB")) {
      return dateStr;
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " WIB";
  };

  // Combine PenawaranMitra list with localStorage and pending claims from bursaList
  // PRIORITASKAN penawaran lokal yang baru dibuat oleh mitra
  let localDbOffers: PenawaranItem[] = [];
  try {
    const s = localStorage.getItem("reksa_penawaran_db");
    if (s) localDbOffers = JSON.parse(s);
  } catch {}

  const syntheticOffers: PenawaranItem[] = [...localDbOffers];
  (penawaranList || []).forEach((p) => {
    if (!syntheticOffers.some((o) => o.id === p.id || o.kode_penawaran === p.kode_penawaran)) {
      syntheticOffers.push(p);
    }
  });

  bursaList.forEach((b) => {
    if (b.status === "Klaim Diajukan" && b.claimed_org) {
      const alreadyExists = syntheticOffers.some((p) => p.bursa_id === b.id && p.status === "Diajukan");
      if (!alreadyExists) {
        syntheticOffers.push({
          id: b.id,
          kode_penawaran: `PROP-${b.id}`,
          bursa_id: b.id,
          kebutuhan_id: b.kebutuhan_id,
          posko_id: b.posko_id,
          mitra_name: b.claimedBy?.name || "Mitra Kemanusiaan",
          organisasi: b.claimed_org || "Satgas BPBD / Mitra",
          jenis_bantuan: b.item_bantuan,
          jumlah_tawaran: b.claimed_volume || b.target_volume,
          volume_angka: parseInt((b.claimed_volume || b.target_volume).replace(/[^0-9]/g, "")) || 500,
          satuan: (b.claimed_volume || b.target_volume).replace(/[0-9.,]/g, "").trim() || "Unit",
          armada_info: b.claimed_armada || "Armada Mitra Siaga",
          catatan: b.claim_notes || "Mitra siap menyalurkan bantuan sesuai kapasitas armada.",
          status: "Diajukan",
          created_at: b.published_at || new Date().toISOString(),
          bursa: b,
        });
      }
    }
  });

  (cases || []).forEach((c) => {
    if (c.status === "Klaim Diajukan" || c.status === "Teralokasi Sebagian" || (c.escalatedToMitra && c.status !== "Selesai") || c.id?.includes("P09UUS") || c.id?.includes("POBUUS")) {
      const alreadyExists = syntheticOffers.some((p) =>
        (p.kebutuhan_id && (p.kebutuhan_id === c.rawId || String(p.kebutuhan_id) === String(c.rawId))) ||
        (p.bursa?.kebutuhan?.kode_kasus && p.bursa.kebutuhan.kode_kasus === c.id) ||
        (p.kebutuhan?.kode_kasus && p.kebutuhan.kode_kasus === c.id) ||
        (p.kode_penawaran && p.kode_penawaran.includes(c.id))
      );
      if (!alreadyExists) {
        syntheticOffers.push({
          id: c.rawId || Date.now(),
          kode_penawaran: `TWR-2026-${String(c.id || "1576").slice(-4)}`,
          bursa_id: c.rawId || 1,
          kebutuhan_id: c.rawId,
          posko_id: 1,
          mitra_name: c.mitraHandler || "Palang Merah Indonesia (PMI Cabang Jawa Timur)",
          organisasi: c.mitraHandler || "Palang Merah Indonesia (PMI Cabang Jawa Timur)",
          jenis_bantuan: c.item || "Pemulihan Sarana & Fasilitas Vital",
          jumlah_tawaran: c.qty || "2 Titik / Unit Fasilitas",
          volume_angka: parseInt((c.qty || "2").replace(/[^0-9]/g, "")) || 2,
          satuan: (c.qty || "Titik / Unit Fasilitas").replace(/[0-9.,]/g, "").trim() || "Unit",
          armada_info: "Serah Terima ke Gudang Posko BPBD",
          catatan: "Mitra siap menyerahkan pasokan barang kebutuhan ke Posko BPBD.",
          status: "Diajukan",
          created_at: new Date().toISOString(),
          kebutuhan: {
            id: c.rawId || 1,
            kode_kasus: c.id,
            desa: c.desa,
            kecamatan: c.kecamatan,
            kabupaten: c.kabupaten,
            foto_bukti: c.fotoBukti,
          },
        });
      }
    }
  });

  const checkMatchesCase = (o: PenawaranItem, targetCase: string) => {
    const target = targetCase.toLowerCase().trim();
    const caseMatch = cases.find(c => c.id.toLowerCase() === target || String(c.rawId) === target.replace(/\D/g, ""));
    return (
      (o.kebutuhan_id && caseMatch?.rawId && o.kebutuhan_id === caseMatch.rawId) ||
      (o.bursa?.kebutuhan?.kode_kasus && o.bursa.kebutuhan.kode_kasus.toLowerCase() === target) ||
      (o.catatan && o.catatan.toLowerCase().includes(target)) ||
      (o.kode_penawaran && o.kode_penawaran.toLowerCase().includes(target))
    );
  };

  useEffect(() => {
    onRefresh?.();
  }, []);

  useEffect(() => {
    if (selectedCaseId) {
      const matchCount = syntheticOffers.filter(o => checkMatchesCase(o, selectedCaseId)).length;
      if (matchCount > 0) {
        setCaseFilter(selectedCaseId);
      } else {
        setCaseFilter(null);
      }
    }
  }, [selectedCaseId, syntheticOffers.length]);

  const activeOffersPool = caseFilter
    ? syntheticOffers.filter((o) => checkMatchesCase(o, caseFilter))
    : syntheticOffers;

  const filteredOffers = activeOffersPool.filter((o) => {
    if (tab === "pending") return o.status === "Diajukan";
    if (tab === "approved") return o.status === "Disetujui";
    if (tab === "rejected") return o.status === "Ditolak";
    return true;
  });

  const handleApproveFull = async (offer: PenawaranItem) => {
    try {
      setIsSubmitting(true);
      if (offer.kode_penawaran.startsWith("PROP-")) {
        await apiService.approveClaimBursa(offer.bursa_id, {
          approved_volume: offer.jumlah_tawaran,
          catatan: "Disetujui penuh oleh Koordinator Posko. Alokasi resmi diterbitkan.",
        }).catch(() => {});
      } else {
        await apiService.approvePenawaran(offer.id, {
          approved_volume: offer.jumlah_tawaran,
          volume_angka: offer.volume_angka,
          catatan: "Disetujui penuh oleh Koordinator Posko. Alokasi resmi dan Misi Penyaluran diterbitkan.",
        }).catch(() => {});
      }

      // Update local storage penawaran
      let updatedOffers: PenawaranItem[] = [];
      try {
        const s = localStorage.getItem("reksa_penawaran_db");
        let list = s ? JSON.parse(s) : [];
        updatedOffers = list.map((o: any) =>
          o.id === offer.id || o.kode_penawaran === offer.kode_penawaran
            ? { ...o, status: "Disetujui", jumlah_disetujui: offer.jumlah_tawaran, volume_disetujui_angka: offer.volume_angka }
            : o
        );
        localStorage.setItem("reksa_penawaran_db", JSON.stringify(updatedOffers));
      } catch (_) {}

      // Terbitkan Misi Penyaluran otomatis jika belum ada
      let updatedMisiList: any[] = [];
      try {
        const sMisi = localStorage.getItem("reksa_misi_db");
        let misiList = sMisi ? JSON.parse(sMisi) : [];
        const targetCase = cases.find(c => (offer.kebutuhan_id && c.rawId === offer.kebutuhan_id) || c.id === offer.bursa?.kebutuhan?.kode_kasus);
        const newMisi = {
          id: Date.now(),
          kode_misi: `MISI-EXP-${String(Date.now()).slice(-4)}`,
          kebutuhan_id: offer.kebutuhan_id || offer.bursa_id,
          bursa_id: offer.bursa_id,
          penawaran_id: offer.id,
          posko_id: offer.posko_id || 1,
          responder_name: offer.mitra_name || "dr. Hendra Wijaya",
          responder_phone: "+62 812 8899 0011",
          organisasi: offer.organisasi,
          armada_info: offer.armada_info || "Mobil Box Logistik Distribusi Cepat Mitra",
          muatan: offer.jumlah_tawaran,
          status_tahapan: "Dalam Perjalanan",
          estimasi_waktu: "Dalam Perjalanan ke Lokasi",
          catatan_lapangan: offer.catatan || "Proposal disetujui penuh oleh Posko BPBD. Armada segera diberangkatkan.",
          foto_bukti: (offer as any).foto_bukti || offer.kebutuhan?.foto_bukti || targetCase?.fotoBukti,
          kebutuhan: offer.kebutuhan || offer.bursa?.kebutuhan,
          posko: offer.posko || offer.bursa?.posko,
        };
        updatedMisiList = [newMisi, ...misiList.filter((m: any) => m.kebutuhan_id !== offer.kebutuhan_id && m.bursa_id !== offer.bursa_id)];
        localStorage.setItem("reksa_misi_db", JSON.stringify(updatedMisiList));
      } catch (_) {}

      // Update status kasus di reksa_cases_db
      let updatedCasesDb: any[] = [];
      try {
        const sCases = localStorage.getItem("reksa_cases_db");
        if (sCases) {
          let casesDb = JSON.parse(sCases);
          casesDb = casesDb.map((c: any) =>
            (offer.kebutuhan_id && c.rawId === offer.kebutuhan_id) ||
            (c.id && (c.id === offer.kebutuhan?.kode_kasus || c.id === offer.bursa?.kebutuhan?.kode_kasus))
              ? { ...c, status: "Dalam Pengiriman", isOwn: true }
              : c
          );
          localStorage.setItem("reksa_cases_db", JSON.stringify(casesDb));
        }
      } catch (_) {}

      update?.({
        penawaranList: updatedOffers.length > 0 ? updatedOffers : undefined,
        misiList: updatedMisiList.length > 0 ? updatedMisiList : undefined,
        casesList: updatedCasesDb.length > 0 ? updatedCasesDb : undefined,
      });

      notify?.(`Penawaran ${offer.kode_penawaran} (${offer.organisasi}) berhasil disetujui penuh! Misi penyaluran resmi diterbitkan.`);
      await onRefresh?.();
    } catch (err: any) {
      notify?.(err?.message || "Gagal menyetujui penawaran mitra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPartialModal = (offer: PenawaranItem) => {
    setActiveOffer(offer);
    setModalType("approvePartial");
    setPartialAmountInput(String(offer.volume_angka || 350));
    setNotesInput("");
  };

  const openRejectModal = (offer: PenawaranItem) => {
    setActiveOffer(offer);
    setModalType("reject");
    setNotesInput("");
  };

  const handleModalSubmit = async () => {
    if (!activeOffer) return;
    try {
      setIsSubmitting(true);
      if (modalType === "approvePartial") {
        const approvedNum = parseInt(partialAmountInput) || 100;
        const approvedStr = `${approvedNum} ${activeOffer.satuan || "Unit"}`;

        if (activeOffer.kode_penawaran.startsWith("PROP-")) {
          await apiService.approveClaimBursa(activeOffer.bursa_id, {
            approved_volume: approvedStr,
            catatan: notesInput || `Disetujui sebagian (${approvedStr}) oleh Koordinator Posko.`,
          }).catch(() => {});
        } else {
          await apiService.approvePenawaran(activeOffer.id, {
            approved_volume: approvedStr,
            volume_angka: approvedNum,
            catatan: notesInput || `Disetujui sebagian (${approvedStr}) oleh Koordinator Posko.`,
          }).catch(() => {});
        }

        try {
          const s = localStorage.getItem("reksa_penawaran_db");
          let list = s ? JSON.parse(s) : [];
          list = list.map((o: any) =>
            o.id === activeOffer.id || o.kode_penawaran === activeOffer.kode_penawaran
              ? { ...o, status: "Disetujui", jumlah_disetujui: approvedStr, volume_disetujui_angka: approvedNum }
              : o
          );
          localStorage.setItem("reksa_penawaran_db", JSON.stringify(list));
        } catch (_) {}

        notify?.(`Penawaran ${activeOffer.kode_penawaran} disetujui sebagian (${approvedStr}). Sisa kekurangan tetap terbuka di Bursa.`);
      } else if (modalType === "reject") {
        const alasan = notesInput || "Spesifikasi armada atau waktu kesiapan belum sesuai prioritas operasional saat ini.";
        if (activeOffer.kode_penawaran.startsWith("PROP-")) {
          await apiService.rejectClaimBursa(activeOffer.bursa_id, { alasan }).catch(() => {});
        } else {
          await apiService.rejectPenawaran(activeOffer.id, { alasan_penolakan: alasan }).catch(() => {});
        }

        try {
          const s = localStorage.getItem("reksa_penawaran_db");
          let list = s ? JSON.parse(s) : [];
          list = list.map((o: any) =>
            o.id === activeOffer.id || o.kode_penawaran === activeOffer.kode_penawaran
              ? { ...o, status: "Ditolak", catatan_penolakan: alasan }
              : o
          );
          localStorage.setItem("reksa_penawaran_db", JSON.stringify(list));
        } catch (_) {}

        notify?.(`Penawaran ${activeOffer.kode_penawaran} ditolak. Alasan penolakan tersimpan di log.`);
      }

      setModalType(null);
      setActiveOffer(null);
      await onRefresh?.();
    } catch (err: any) {
      notify?.(err?.message || "Gagal memproses penawaran mitra.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingOffersCount = activeOffersPool.filter((o) => o.status === "Diajukan").length;
  const approvedOffersCount = activeOffersPool.filter((o) => o.status === "Disetujui").length;
  const rejectedOffersCount = activeOffersPool.filter((o) => o.status === "Ditolak").length;
  const totalOffersCount = activeOffersPool.length;

  return (
    <main className="workspace posko-penawaran-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
      {/* Title bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <span className="eyebrow" style={{ color: "#80866e", fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.78rem" }}>
            KEPUTUSAN ALOKASI RESMI POSKO
          </span>
          <h1 style={{ margin: "4px 0 6px", color: "#013220", fontSize: "1.75rem", fontWeight: 800 }}>
            Penawaran &amp; Alokasi Bantuan Mitra
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.92rem", maxWidth: "680px", lineHeight: 1.5 }}>
            Tinjau proposal komitmen logistik dan kapasitas armada dari organisasi mitra, tetapkan persetujuan resmi, dan terbitkan Surat Misi Penyaluran.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateToMissions}
          style={{
            background: "#ffffff",
            color: "#013220",
            border: "1px solid rgba(1, 50, 32, 0.2)",
            borderRadius: "10px",
            padding: "10px 18px",
            fontSize: "0.88rem",
            fontWeight: 700,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AppIcon name="truck" size={16} />
          <span>Pantau Misi Armada Aktif</span>
          <AppIcon name="arrow-right" size={14} />
        </button>
      </div>

      {/* FILTER TABS */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "24px",
          background: "#ffffff",
          padding: "10px 16px",
          borderRadius: "14px",
          border: "1px solid rgba(1, 50, 32, 0.08)",
        }}
      >
        {[
          { id: "pending", label: "Menunggu Keputusan", count: pendingOffersCount },
          { id: "approved", label: "Disetujui", count: approvedOffersCount },
          { id: "rejected", label: "Ditolak", count: rejectedOffersCount },
          { id: "all", label: "Semua", count: totalOffersCount },
        ].map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id as any)}
              style={{
                padding: "7px 16px",
                borderRadius: "20px",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer",
                border: isActive ? "1px solid #013220" : "1px solid #e2e8f0",
                background: isActive ? "#013220" : "#ffffff",
                color: isActive ? "#ffffff" : "#475569",
                transition: "all 0.15s ease",
              }}
            >
              {t.label} ({t.count})
            </button>
          );
        })}
      </div>

      {/* ACTIVE CASE FILTER BANNER (Deep-Link) */}
      {caseFilter && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#ecfdf5",
            border: "1px solid #a7f3d0",
            borderRadius: "12px",
            padding: "10px 16px",
            marginBottom: "16px",
            color: "#065f46",
            fontSize: "0.85rem",
            flexWrap: "wrap",
            gap: "8px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>🎯</span>
            <span>Menampilkan penawaran khusus untuk kasus: <strong>{caseFilter}</strong> ({filteredOffers.length} penawaran ditemukan)</span>
          </div>
          <button
            type="button"
            onClick={() => setCaseFilter(null)}
            style={{
              background: "#ffffff",
              border: "1px solid #10b981",
              color: "#047857",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            ✕ Tampilkan Semua Kasus
          </button>
        </div>
      )}

      {/* OFFERS LIST */}
      {filteredOffers.length === 0 ? (
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
            <AppIcon name="handshake" size={24} />
          </div>
          <h3 style={{ margin: "0 0 6px", color: "#013220", fontSize: "1.1rem", fontWeight: 700 }}>
            Tidak Ada Penawaran di Kategori Ini
          </h3>
          <p style={{ margin: "0 0 16px", color: "#64748b", fontSize: "0.88rem" }}>
            {caseFilter && syntheticOffers.length > 0
              ? `Belum ada proposal bantuan yang diajukan mitra untuk kasus ${caseFilter}. Terdapat ${syntheticOffers.length} proposal pada kasus lain.`
              : "Belum ada proposal bantuan yang diajukan oleh mitra pada status ini."}
          </p>
          {caseFilter && (
            <button
              type="button"
              onClick={() => setCaseFilter(null)}
              style={{
                background: "#013220",
                color: "#ffffff",
                border: "none",
                borderRadius: "10px",
                padding: "8px 18px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>Tampilkan Semua Kasus ({syntheticOffers.length} Penawaran Tersedia)</span>
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {filteredOffers.map((o) => {
            const isPending = o.status === "Diajukan";
            const isApproved = o.status === "Disetujui";
            const isRejected = o.status === "Ditolak";

            return (
              <div
                key={o.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: isApproved
                    ? "1px solid #bbf7d0"
                    : isRejected
                    ? "1px solid #fecaca"
                    : "1px solid #fde68a",
                  boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
                  padding: "20px 24px",
                }}
              >
                {/* Header Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 800,
                        fontSize: "0.95rem",
                        color: "#013220",
                        background: "#f1f5f2",
                        padding: "2px 8px",
                        borderRadius: "6px",
                      }}
                    >
                      {o.kode_penawaran}
                    </span>
                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "3px 10px",
                        borderRadius: "12px",
                        background: isApproved ? "#f0fdf4" : isRejected ? "#fef2f2" : "#fffbeb",
                        color: isApproved ? "#15803d" : isRejected ? "#991b1b" : "#b45309",
                        border: `1px solid ${isApproved ? "#bbf7d0" : isRejected ? "#fecaca" : "#fde68a"}`,
                      }}
                    >
                      {o.status}
                    </span>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                    {isPending && (
                      <>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleApproveFull(o)}
                          style={{
                            background: "#013220",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "8px",
                            padding: "8px 16px",
                            fontSize: "0.84rem",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <AppIcon name="check" size={14} />
                          <span>Setujui Penuh</span>
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => openPartialModal(o)}
                          style={{
                            background: "#fffbeb",
                            color: "#92400e",
                            border: "1px solid #fde68a",
                            borderRadius: "8px",
                            padding: "8px 14px",
                            fontSize: "0.84rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Setujui Sebagian
                        </button>
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => openRejectModal(o)}
                          style={{
                            background: "#fef2f2",
                            color: "#991b1b",
                            border: "1px solid #fecaca",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            fontSize: "0.84rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          Tolak
                        </button>
                      </>
                    )}

                    {isApproved && (
                      <span style={{ padding: "6px 14px", borderRadius: "8px", background: "#f0fdf4", color: "#15803d", fontWeight: 700, fontSize: "0.84rem", border: "1px solid #bbf7d0", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <AppIcon name="check" size={14} />
                        <span>Alokasi Sah ({o.jumlah_disetujui || o.jumlah_tawaran})</span>
                      </span>
                    )}

                    {isRejected && (
                      <span style={{ padding: "6px 14px", borderRadius: "8px", background: "#fef2f2", color: "#991b1b", fontWeight: 700, fontSize: "0.84rem", border: "1px solid #fecaca" }}>
                        Ditolak Posko
                      </span>
                    )}
                  </div>
                </div>

                {/* Target Disaster Case & Location Banner */}
                {(() => {
                  const targetCase = cases.find(
                    (c) =>
                      (o.kebutuhan_id && c.rawId === o.kebutuhan_id) ||
                      (c.id && (c.id === o.bursa?.kebutuhan?.kode_kasus || c.id === o.kebutuhan?.kode_kasus)) ||
                      (o.bursa_id && c.rawId === o.bursa_id) ||
                      (o.bursa?.kebutuhan?.kode_kasus && c.id === o.bursa.kebutuhan.kode_kasus)
                  );

                  const targetCaseCode =
                    targetCase?.id ||
                    o.bursa?.kebutuhan?.kode_kasus ||
                    o.kebutuhan?.kode_kasus ||
                    (o.kebutuhan_id ? `RK-2026-${o.kebutuhan_id}` : `RK-2026-EXP`);

                  const targetDesa =
                    targetCase?.desa ||
                    o.bursa?.kebutuhan?.desa ||
                    o.kebutuhan?.desa ||
                    o.posko?.desa ||
                    "Wilayah Terdampak";

                  const targetKec =
                    targetCase?.kecamatan ||
                    o.bursa?.kebutuhan?.kecamatan ||
                    o.kebutuhan?.kecamatan ||
                    o.posko?.kecamatan ||
                    "Sidoarjo";

                  const targetKab =
                    targetCase?.kabupaten ||
                    o.bursa?.kebutuhan?.kabupaten ||
                    o.kebutuhan?.kabupaten ||
                    o.posko?.kabupaten ||
                    "Jawa Timur";

                  const targetLocation = `Desa ${targetDesa}, Kec. ${targetKec}, ${targetKab}`;

                  const targetTotalVolume =
                    o.bursa?.target_volume ||
                    targetCase?.qty ||
                    `${o.volume_angka || 100} ${o.satuan || "Unit"}`;

                  // Foto bukti pendukung: PRIORITASKAN foto asli dari kasus/warga/bursa
                  const resolvedPhoto =
                    (o as any).foto_bukti ||
                    o.kebutuhan?.foto_bukti ||
                    o.bursa?.kebutuhan?.foto_bukti ||
                    (o.bursa as any)?.foto_bukti ||
                    targetCase?.fotoBukti ||
                    getOfferPhoto(o.jenis_bantuan, o.armada_info);

                  return (
                    <>
                      {/* Sasaran Kasus & Titik Bencana */}
                      <div
                        style={{
                          background: "rgba(1, 50, 32, 0.04)",
                          borderRadius: "10px",
                          padding: "8px 14px",
                          margin: "0 0 12px",
                          border: "1px solid rgba(1, 50, 32, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontWeight: 800,
                              color: "#013220",
                              background: "#e2e8f0",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              fontFamily: "monospace",
                              fontSize: "0.82rem",
                            }}
                          >
                            Kasus: {targetCaseCode}
                          </span>
                          <span style={{ color: "#1e293b", fontWeight: 700, fontSize: "0.84rem" }}>
                            📍 {targetLocation}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                          Target Total Kasus: <strong style={{ color: "#013220" }}>{targetTotalVolume}</strong>
                        </div>
                      </div>

                      {/* Main Body with Visual Supporting Photo */}
                      <div className="posko-case-body-main" style={{ marginBottom: "14px" }}>
                        <div
                          className="posko-case-photo-thumb"
                          onClick={() =>
                            setPreviewImage({
                              src: resolvedPhoto,
                              title: `Proposal Komitmen: ${o.organisasi}`,
                              location: `Target Kasus: ${targetCaseCode} (${targetLocation}) · Komoditas: ${o.jenis_bantuan} (${o.jumlah_tawaran})`,
                            })
                          }
                          title="Klik untuk memperbesar foto komoditas & armada mitra"
                        >
                          <img
                            src={resolvedPhoto}
                            alt={o.jenis_bantuan}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "https://images.unsplash.com/photo-1547683905-f686c993aae5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=1200&q=82";
                            }}
                            className="posko-case-photo-img"
                          />
                          <div className="posko-case-photo-badge">
                            <AppIcon name="camera" size={11} />
                            <span>Foto Lapangan</span>
                          </div>
                          <div className="posko-case-photo-zoom" title="Klik untuk memperbesar">
                            <AppIcon name="search" size={13} style={{ color: "#ffffff" }} />
                          </div>
                        </div>

                        <div className="posko-case-info-col">
                          <h3 style={{ margin: "0 0 6px", fontSize: "1.2rem", fontWeight: 800, color: "#013220" }}>
                            {o.organisasi} · Penawaran: {o.jumlah_tawaran}
                          </h3>

                          <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap", fontSize: "0.82rem", color: "#64748b" }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              <AppIcon name="box" size={13} style={{ color: "#80866e" }} />
                              <span>Komoditas: <strong>{o.jenis_bantuan}</strong></span>
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              <AppIcon name="user" size={13} style={{ color: "#80866e" }} />
                              <span>Narahubung: <strong>{o.mitra_name}</strong></span>
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              <AppIcon name="truck" size={13} style={{ color: "#80866e" }} />
                              <span>Armada: <strong>{o.armada_info || "Armada Mitra"}</strong></span>
                            </span>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              <AppIcon name="calendar" size={13} style={{ color: "#80866e" }} />
                              <span>Diajukan: {formatOfferDate(o.created_at)}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })()}

                {/* Details Grid (clean 4-column layout) */}
                <div
                  style={{
                    background: "#fbfbf8",
                    borderRadius: "12px",
                    border: "1px solid rgba(1, 50, 32, 0.08)",
                    padding: "14px 18px",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                      Metode Penyaluran
                    </span>
                    <strong style={{ fontSize: "0.88rem", color: "#013220" }}>
                      {o.metode_penyaluran === "mandiri"
                        ? "Penyaluran Mandiri (Armada Mitra)"
                        : o.metode_penyaluran === "koordinasi"
                        ? "Penyaluran Terkoordinasi Bersama Posko"
                        : "Serah Terima ke Gudang Posko BPBD"}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                      Dukungan Armada
                    </span>
                    <strong style={{ fontSize: "0.88rem", color: "#013220" }}>
                      {o.armada_info || "Armada Mitra Siaga"}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                      Waktu Kesiapan
                    </span>
                    <strong style={{ fontSize: "0.88rem", color: "#013220" }}>
                      {o.waktu_kesiapan || "Siap Berangkat Hari Ini"}
                    </strong>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>
                      Volume Komitmen
                    </span>
                    <strong style={{ fontSize: "0.95rem", color: "#15803d" }}>
                      {o.jumlah_tawaran}
                    </strong>
                  </div>
                </div>

                {/* Operational Notes */}
                {o.catatan && (
                  <div
                    style={{
                      background: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                      padding: "10px 14px",
                      fontSize: "0.83rem",
                      color: "#334155",
                    }}
                  >
                    <strong style={{ color: "#013220" }}>Rencana Kerja Mitra:</strong> "{o.catatan}"
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PARTIAL APPROVE / REJECT MODAL */}
      {modalType && activeOffer && (
        <div className="modal-backdrop">
          <div className="modal" style={{ width: "min(540px, 95%)", textAlign: "left", borderRadius: "16px", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={{ fontSize: "1.25rem", color: "#013220", margin: 0, fontWeight: 800 }}>
                {modalType === "approvePartial" ? "Setujui Sebagian Komitmen Mitra" : "Tolak Penawaran Mitra"}
              </h2>
              <button
                type="button"
                onClick={() => setModalType(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <AppIcon name="x" size={18} />
              </button>
            </div>

            <p style={{ color: "#64748b", fontSize: "0.88rem", marginBottom: "16px" }}>
              Proposal: <strong>{activeOffer.kode_penawaran}</strong> ({activeOffer.organisasi}) · Tawaran: <strong>{activeOffer.jumlah_tawaran}</strong>.
            </p>

            {modalType === "approvePartial" ? (
              <>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#013220", marginBottom: "6px" }}>
                  Volume yang Disetujui ({activeOffer.satuan || "Unit"}):
                </label>
                <input
                  type="number"
                  value={partialAmountInput}
                  onChange={(e) => setPartialAmountInput(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", marginBottom: "14px" }}
                />

                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#013220", marginBottom: "6px" }}>
                  Catatan Alokasi Posko:
                </label>
                <textarea
                  rows={3}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Contoh: Disetujui sebagian sesuai batas tampung gudang posko hari ini. Sisa kuota tetap terbuka di bursa."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "18px" }}
                />
              </>
            ) : (
              <>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#013220", marginBottom: "6px" }}>
                  Alasan Penolakan Resmi (Wajib &amp; Transparan):
                </label>
                <textarea
                  rows={4}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Tuliskan alasan penolakan secara jelas agar mitra memahami keputusan posko..."
                  style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", marginBottom: "18px" }}
                />
              </>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setModalType(null)}
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
                disabled={isSubmitting || (modalType === "reject" && !notesInput.trim())}
                onClick={handleModalSubmit}
                style={{
                  background: modalType === "reject" ? "#991b1b" : "#013220",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "9px 20px",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {isSubmitting ? "Memproses..." : modalType === "approvePartial" ? "Konfirmasi Persetujuan Sebagian" : "Simpan Penolakan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW LIGHTBOX MODAL */}
      {previewImage && (
        <div
          className="modal-backdrop"
          onClick={() => setPreviewImage(null)}
          style={{ zIndex: 99999, background: "rgba(0,0,0,0.75)" }}
        >
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "600px",
              width: "90%",
              padding: 0,
              overflow: "hidden",
              borderRadius: "16px",
              background: "#ffffff",
              boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid #e2e8f0",
                background: "#fdfbf7",
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: "1rem", color: "#013220", fontWeight: 700 }}>
                  {previewImage.title}
                </h3>
                {previewImage.location && (
                  <span style={{ fontSize: "0.8rem", color: "#64748b", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "2px" }}>
                    <AppIcon name="box" size={12} /> {previewImage.location}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#64748b",
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: "#0f172a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "260px",
                maxHeight: "65vh",
                overflow: "hidden",
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
                <AppIcon name="check" size={13} style={{ color: "#16a34a" }} />
                <span>Dokumentasi Resmi Komitmen Mitra</span>
              </span>
              <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                REKSA Logistics Network
              </span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
