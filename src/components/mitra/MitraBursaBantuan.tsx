import { useState, useMemo } from "react";
import { BursaItem, apiService } from "../../services/api";
import { AppIcon } from "../common/Icons";
import { getAiMatchScore } from "../../utils/reksaAiEngine";
import { CaseRecord, getFieldEvidencePhoto } from "../../App";

interface MitraBursaBantuanProps {
  bursaList: BursaItem[];
  userOrg?: string;
  userName?: string;
  onRefresh?: () => Promise<void> | void;
  notify?: (msg: string) => void;
  onNavigateToMyOffers: () => void;
  cases?: CaseRecord[];
  update?: (callback: (prev: any) => any) => void;
  penawaranList?: PenawaranItem[];
}

export function MitraBursaBantuan({
  bursaList,
  userOrg = "Satgas BPBD / Mitra Kemanusiaan",
  userName = "Arif Nugroho",
  onRefresh,
  notify,
  onNavigateToMyOffers,
  cases,
  update,
  penawaranList = [],
}: MitraBursaBantuanProps) {
  // Search & Filter state
  const [filterUrgency, setFilterUrgency] = useState<"Semua" | "Kritis" | "Tinggi" | "Sedang">("Semua");
  const [filterOrigin, setFilterOrigin] = useState<"all" | "bpbd" | "mitra">("all");
  const [search, setSearch] = useState("");
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; location?: string } | null>(null);
  const [onlyAiMatch, setOnlyAiMatch] = useState(false);
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

  // Kebutuhan aktif di bursa posko (terbuka, belum dikomitmenkan oleh mitra)
  const openItems = useMemo(() => {
    // 1. Kumpulkan semua identifier penawaran yang sudah diajukan oleh mitra (dari state & localStorage)
    const offeredBursaIds = new Set<string>();
    const offeredKebutuhanIds = new Set<string>();
    const offeredCaseCodes = new Set<string>();

    const allOffers: PenawaranItem[] = [...(penawaranList || [])];
    try {
      const savedOffers = localStorage.getItem("reksa_penawaran_db");
      if (savedOffers) {
        const parsed = JSON.parse(savedOffers);
        if (Array.isArray(parsed)) allOffers.push(...parsed);
      }
    } catch {}

    allOffers.forEach((o) => {
      if (o.bursa_id) offeredBursaIds.add(String(o.bursa_id));
      if (o.kebutuhan_id) offeredKebutuhanIds.add(String(o.kebutuhan_id));
      if (o.kebutuhan?.kode_kasus) offeredCaseCodes.add(o.kebutuhan.kode_kasus.toLowerCase().trim());
      if ((o as any).kode_kasus) offeredCaseCodes.add(String((o as any).kode_kasus).toLowerCase().trim());
    });

    // 2. Filter directBursa: jangan tampilkan yang sudah selesai, ditolak, teralokasi penuh, klaim diajukan, atau sudah ada di Penawaran Saya
    const directBursa = (bursaList || []).filter((b) => {
      const s = (b.status || "").toLowerCase();
      if (
        s.includes("selesai") ||
        s.includes("tolak") ||
        s.includes("penuh") ||
        s.includes("klaim") ||
        s.includes("disetujui")
      ) {
        return false;
      }

      // Sembunyikan jika mitra ini sudah mengajukan komitmen / ada di Penawaran Saya
      const bursaIdStr = String(b.id);
      const kebutuhanIdStr = b.kebutuhan_id ? String(b.kebutuhan_id) : "";
      const caseCode = b.kebutuhan?.kode_kasus ? b.kebutuhan.kode_kasus.toLowerCase().trim() : "";

      if (offeredBursaIds.has(bursaIdStr)) return false;
      if (kebutuhanIdStr && offeredKebutuhanIds.has(kebutuhanIdStr)) return false;
      if (caseCode && offeredCaseCodes.has(caseCode)) return false;
      if (b.claimed_org && (s.includes("penuh") || s.includes("selesai") || s.includes("terpenuhi"))) return false;

      return true;
    });

    const existingIdentifiers = new Set<string>();
    directBursa.forEach((b) => {
      if (b.id) existingIdentifiers.add(String(b.id));
      if (b.kebutuhan_id) existingIdentifiers.add(String(b.kebutuhan_id));
      if (b.kebutuhan?.kode_kasus) existingIdentifiers.add(b.kebutuhan.kode_kasus.toLowerCase().trim());
      if ((b as any).kode_kasus) existingIdentifiers.add(String((b as any).kode_kasus).toLowerCase().trim());
    });

    const additionalFromCases: BursaItem[] = [];

    (cases || []).forEach((c) => {
      const s = (c.status || "").toLowerCase();
      // Jangan tampilkan jika sudah selesai, ditolak, dibatalkan, atau teralokasi penuh
      if (
        s.includes("selesai") ||
        s.includes("tolak") ||
        s.includes("batal") ||
        s.includes("penuh")
      ) {
        return;
      }

      const caseIdLower = (c.id || "").toLowerCase().trim();
      const rawIdStr = c.rawId ? String(c.rawId) : "";

      // Jangan tampilkan jika kasus ini sudah diajukan penawarannya oleh mitra
      if (caseIdLower && offeredCaseCodes.has(caseIdLower)) return;
      if (rawIdStr && (offeredBursaIds.has(rawIdStr) || offeredKebutuhanIds.has(rawIdStr))) return;

      if (
        (caseIdLower && existingIdentifiers.has(caseIdLower)) ||
        (rawIdStr && existingIdentifiers.has(rawIdStr))
      ) {
        return;
      }

      if (caseIdLower) existingIdentifiers.add(caseIdLower);
      if (rawIdStr) existingIdentifiers.add(rawIdStr);

      const targetNum = parseInt((c.qty || c.kk || "100").replace(/[^0-9]/g, "")) || 100;
      const targetUnit = (c.qty || c.kk || "Unit").replace(/[0-9.,]/g, "").trim() || "Unit";
      const numericId = typeof c.rawId === "number" ? c.rawId : (parseInt(c.id.replace(/\D/g, "")) || (2000 + additionalFromCases.length));

      additionalFromCases.push({
        id: numericId,
        kebutuhan_id: numericId,
        posko_id: 1,
        item_bantuan: c.item || "Kebutuhan Darurat Warga",
        target_volume: `${targetNum} ${targetUnit}`,
        volume_terpenuhi: c.totalAlokasiResmi || "0 Unit",
        urgensi: c.urgency || "Sedang",
        status: s.includes("sebagian") ? "Sebagian Terpenuhi" : "Terbuka",
        published_at: c.date || "Hari ini, Baru diverifikasi",
        isDelegatedToMitra: Boolean(c.escalatedToMitra || c.mitraHandler),
        posko: {
          id: 1,
          kode_posko: "PSK-SBY-01",
          nama_posko: c.posko || "Posko BPBD Provinsi Jawa Timur",
          desa: c.village || "Gubeng",
          kecamatan: c.district || "Gubeng",
          kabupaten: c.regency || "Kota Surabaya",
          provinsi: c.province || "Jawa Timur",
          latitude: Number(c.lat) || -7.2654,
          longitude: Number(c.lng) || 112.7521,
          kapasitas_kk: 100,
          kk_terdata: 25,
          status_operasional: "Aktif Penuh",
        },
        kebutuhan: {
          id: numericId,
          kode_kasus: c.id,
          citizen_name: c.applicantName || "Andi Pratama",
          citizen_phone: c.applicantPhone || "+62 812 4455 0188",
          posko_id: 1,
          kategori_kebutuhan: c.item,
          volume_permintaan: `${targetNum} ${targetUnit}`,
          jumlah_kk: parseInt((c.kk || "1").replace(/\D/g, "")) || 1,
          status_hunian: c.shelterStatus || "Rumah Tinggal Pribadi",
          tingkat_urgensi: c.urgency || "Sedang",
          status: c.status || "Kebutuhan Terbuka",
          desa: c.village || "",
          kecamatan: c.district || "",
          kabupaten: c.regency || "",
          provinsi: c.province || "Jawa Timur",
          latitude: Number(c.lat) || -7.2654,
          longitude: Number(c.lng) || 112.7521,
          foto_bukti: c.fotoBukti,
          deskripsi: c.notes || c.conditionDescription,
          created_at: c.createdAtRaw || new Date().toISOString(),
        },
      });
    });

    // Tempatkan kebutuhan yang baru diverifikasi di baris paling atas agar langsung terlihat
    return [...additionalFromCases, ...directBursa];
  }, [bursaList, cases, penawaranList]);

  // Counts for metric cards and tab pills
  const totalOpen = openItems.length;
  const countKritis = openItems.filter((b) => b.urgensi === "Kritis").length;
  const countTinggi = openItems.filter((b) => b.urgensi === "Tinggi").length;
  const countSedang = openItems.filter((b) => b.urgensi === "Sedang" || b.urgensi === "Normal").length;

  const countDelegated = useMemo(() => {
    return openItems.filter((item) => {
      const matchedCase = cases?.find(
        (c) =>
          (c.rawId && (c.rawId === item.id || c.rawId === item.kebutuhan_id)) ||
          (c.id && (item.kebutuhan?.kode_kasus === c.id || item.id === parseInt(c.id.replace(/\D/g, ""))))
      );
      return Boolean(
        (item as any).isDelegatedToMitra ||
        matchedCase?.escalatedToMitra ||
        matchedCase?.mitraHandler ||
        (matchedCase?.status || "").toLowerCase().includes("mitra") ||
        (matchedCase?.status || "").toLowerCase().includes("dialihkan")
      );
    }).length;
  }, [openItems, cases]);

  const countBpbd = totalOpen - countDelegated;

  const urgencyTabs = [
    { label: "Semua" as const, count: totalOpen },
    { label: "Kritis" as const, count: countKritis },
    { label: "Tinggi" as const, count: countTinggi },
    { label: "Sedang" as const, count: countSedang },
  ];

  // Filtered items based on tab & live search & AI Match & Origin
  const filteredItems = useMemo(() => {
    return openItems.filter((b) => {
      if (filterUrgency !== "Semua") {
        if (filterUrgency === "Sedang") {
          if (b.urgensi !== "Sedang" && b.urgensi !== "Normal") return false;
        } else if (b.urgensi !== filterUrgency) {
          return false;
        }
      }
      if (filterOrigin !== "all") {
        const matchedCase = cases?.find(
          (c) =>
            (c.rawId && (c.rawId === b.id || c.rawId === b.kebutuhan_id)) ||
            (c.id && (b.kebutuhan?.kode_kasus === c.id || b.id === parseInt(c.id.replace(/\D/g, ""))))
        );
        const isDelegated = Boolean(
          (b as any).isDelegatedToMitra ||
          matchedCase?.escalatedToMitra ||
          matchedCase?.mitraHandler ||
          (matchedCase?.status || "").toLowerCase().includes("mitra") ||
          (matchedCase?.status || "").toLowerCase().includes("dialihkan")
        );
        if (filterOrigin === "mitra" && !isDelegated) return false;
        if (filterOrigin === "bpbd" && isDelegated) return false;
      }
      if (onlyAiMatch) {
        const ai = getAiMatchScore(b.item_bantuan, userOrg, b.urgensi);
        if (ai.matchScore < 85) return false;
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
  }, [openItems, filterUrgency, filterOrigin, search, onlyAiMatch, userOrg, cases]);

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

    const isDelegated = Boolean(
      (item as any).isDelegatedToMitra ||
      cases?.find((c) => (c.rawId && (c.rawId === item.id || c.rawId === item.kebutuhan_id)) || (c.id && item.kebutuhan?.kode_kasus === c.id))?.escalatedToMitra ||
      cases?.find((c) => (c.rawId && (c.rawId === item.id || c.rawId === item.kebutuhan_id)) || (c.id && item.kebutuhan?.kode_kasus === c.id))?.mitraHandler
    );

    if (isDelegated) {
      setDeliveryMethod('mandiri');
      const itemTitle = (item.item_bantuan || "").toLowerCase();
      const defaultFleet = itemTitle.includes("obat") || itemTitle.includes("medis")
        ? "Mobil Ambulans & Logistik Medis PMI No. 04"
        : itemTitle.includes("air")
        ? "Truk Tangki Air Bersih Mitra No. 02"
        : "Mobil Box Logistik Distribusi Cepat Mitra";
      setFleetInfo(defaultFleet);
      setReadinessTime("Hari ini, Siap Berangkat Langsung");
      setNotesInput("Penugasan komitmen langsung mitra: armada dan relawan siaga penuh diberangkatkan.");
    } else {
      setDeliveryMethod('serah_posko');
      setFleetInfo("");
      setReadinessTime("Hari ini, Siap Diserahkan ke Posko");
      setNotesInput("Mitra siap menyerahkan pasokan barang kebutuhan ke Posko BPBD.");
    }
  };

  const handleSubmitOffer = async () => {
    if (!modalBursa) return;
    try {
      setIsSubmitting(true);
      const num = parseInt(offeredAmount) || 100;
      const amountStr = `${num} ${offeredUnit}`;

      const relatedCase = cases?.find(
        (c) =>
          (c.rawId && (c.rawId === modalBursa.id || c.rawId === modalBursa.kebutuhan_id)) ||
          (c.id && modalBursa.kebutuhan?.kode_kasus === c.id) ||
          (c.id && String(modalBursa.id).includes(c.id))
      );

      const isDelegatedToMitra = Boolean(
        (modalBursa as any).isDelegatedToMitra ||
        relatedCase?.escalatedToMitra ||
        relatedCase?.mitraHandler
      );

      // Simpan proposal penawaran ke penyimpanan lokal
      let localOffers: any[] = [];
      try {
        const saved = localStorage.getItem("reksa_penawaran_db");
        if (saved) localOffers = JSON.parse(saved);
      } catch (_) {}

      const resolvedFleet = deliveryMethod === 'mandiri' 
        ? (fleetInfo || 'Mobil Box Logistik Distribusi Cepat Mitra') 
        : 'Serah Terima ke Gudang Posko BPBD';

      const newOffer = {
        id: Date.now(),
        kode_penawaran: isDelegatedToMitra 
          ? `TWR-DIR-${String(Date.now()).slice(-4)}` 
          : `TWR-2026-${String(Date.now()).slice(-4)}`,
        bursa_id: modalBursa.id,
        kebutuhan_id: modalBursa.kebutuhan_id || modalBursa.id,
        posko_id: modalBursa.posko_id || 1,
        mitra_id: 4,
        mitra_name: userName || "dr. Hendra Wijaya",
        organisasi: userOrg || relatedCase?.mitraHandler || "Palang Merah Indonesia (PMI Cabang Jawa Timur)",
        jenis_bantuan: modalBursa.item_bantuan,
        jumlah_tawaran: amountStr,
        volume_angka: num,
        satuan: offeredUnit,
        waktu_kesiapan: readinessTime,
        armada_info: resolvedFleet,
        metode_penyaluran: deliveryMethod,
        status: (isDelegatedToMitra ? "Disetujui" : "Diajukan") as "Disetujui" | "Diajukan",
        jumlah_disetujui: isDelegatedToMitra ? amountStr : undefined,
        volume_disetujui_angka: isDelegatedToMitra ? num : undefined,
        catatan: notesInput,
        created_at: new Date().toISOString(),
        foto_bukti: modalBursa.kebutuhan?.foto_bukti || (modalBursa as any).foto_bukti || relatedCase?.fotoBukti,
        bursa: modalBursa,
        kebutuhan: modalBursa.kebutuhan || {
          id: modalBursa.kebutuhan_id || modalBursa.id,
          kode_kasus: relatedCase?.id || modalBursa.kebutuhan?.kode_kasus || `RK-2026-${modalBursa.id}`,
          desa: relatedCase?.desa || modalBursa.kebutuhan?.desa || "Gubeng",
          kecamatan: relatedCase?.kecamatan || modalBursa.kebutuhan?.kecamatan || "Gubeng",
          kabupaten: relatedCase?.kabupaten || modalBursa.kebutuhan?.kabupaten || "Kota Surabaya",
          foto_bukti: relatedCase?.fotoBukti || modalBursa.kebutuhan?.foto_bukti,
        },
      };

      const updatedOffers = [newOffer, ...localOffers.filter((o: any) => o.bursa_id !== modalBursa.id)];
      try {
        localStorage.setItem("reksa_penawaran_db", JSON.stringify(updatedOffers));
      } catch (_) {}

      // Jika alur penugasan mitra: otomatis terbit Misi Penyaluran dan update status kasus & bursa
      let updatedMisiList: any[] = [];
      let updatedCasesList: CaseRecord[] | undefined = undefined;
      let updatedBursaList: BursaItem[] | undefined = undefined;

      if (isDelegatedToMitra) {
        let localMisi: any[] = [];
        try {
          const mSaved = localStorage.getItem("reksa_misi_db");
          if (mSaved) localMisi = JSON.parse(mSaved);
        } catch (_) {}

        const newMisi = {
          id: Date.now(),
          kode_misi: `MISI-EXP-${String(Date.now()).slice(-4)}`,
          kebutuhan_id: modalBursa.kebutuhan_id || modalBursa.id,
          bursa_id: modalBursa.id,
          penawaran_id: newOffer.id,
          posko_id: modalBursa.posko_id || 1,
          responder_name: userName || "dr. Hendra Wijaya",
          responder_phone: "+62 812 8899 0011",
          organisasi: userOrg || relatedCase?.mitraHandler || "Palang Merah Indonesia (PMI Cabang Jawa Timur)",
          armada_info: resolvedFleet,
          muatan: amountStr,
          status_tahapan: "Menunggu Persiapan",
          estimasi_waktu: "Menunggu Persiapan Armada",
          catatan_lapangan: notesInput || "Komitmen telah disahkan. Armada sedang dipersiapkan untuk pengecekan logistik sebelum keberangkatan.",
          foto_bukti: modalBursa.kebutuhan?.foto_bukti || (modalBursa as any).foto_bukti || relatedCase?.fotoBukti,
          posko: modalBursa.posko,
          kebutuhan: modalBursa.kebutuhan || {
            id: modalBursa.kebutuhan_id || modalBursa.id,
            kode_kasus: relatedCase?.id || modalBursa.kebutuhan?.kode_kasus || `RK-2026-${modalBursa.id}`,
            desa: relatedCase?.desa || modalBursa.kebutuhan?.desa || "Gubeng",
            kecamatan: relatedCase?.kecamatan || modalBursa.kebutuhan?.kecamatan || "Gubeng",
            kabupaten: relatedCase?.kabupaten || modalBursa.kebutuhan?.kabupaten || "Kota Surabaya",
            foto_bukti: relatedCase?.fotoBukti || modalBursa.kebutuhan?.foto_bukti,
          },
        };

        updatedMisiList = [newMisi, ...localMisi.filter((m: any) => m.kebutuhan_id !== modalBursa.kebutuhan_id && m.bursa_id !== modalBursa.id)];
        try {
          localStorage.setItem("reksa_misi_db", JSON.stringify(updatedMisiList));
        } catch (_) {}

        if (cases) {
          updatedCasesList = cases.map((c) =>
            (relatedCase && c.id === relatedCase.id) ||
            (c.rawId && (c.rawId === modalBursa.id || c.rawId === modalBursa.kebutuhan_id)) ||
            (c.id && modalBursa.kebutuhan?.kode_kasus === c.id)
              ? {
                  ...c,
                  status: "Dalam Pengiriman",
                  totalAlokasiResmi: amountStr,
                }
              : c
          );
        }
      } else {
        if (cases) {
          updatedCasesList = cases.map((c) =>
            (relatedCase && c.id === relatedCase.id) ||
            (c.rawId && (c.rawId === modalBursa.id || c.rawId === modalBursa.kebutuhan_id)) ||
            (c.id && modalBursa.kebutuhan?.kode_kasus === c.id)
              ? {
                  ...c,
                  status: "Klaim Diajukan",
                }
              : c
          );
        }
      }

      if (updatedCasesList) {
        try {
          localStorage.setItem("reksa_cases_db", JSON.stringify(updatedCasesList));
        } catch (_) {}
      }

      // Update bursa status
      let localBursa: any[] = [];
      try {
        const bSaved = localStorage.getItem("reksa_bursa_db");
        if (bSaved) localBursa = JSON.parse(bSaved);
      } catch (_) {}
      const currentBursa = localBursa.length > 0 ? localBursa : (bursaList || []);
      updatedBursaList = currentBursa.map((b) =>
        b.id === modalBursa.id || b.kebutuhan_id === modalBursa.kebutuhan_id
          ? {
              ...b,
              status: isDelegatedToMitra ? "Teralokasi Penuh" : "Klaim Diajukan",
              volume_terpenuhi: isDelegatedToMitra ? amountStr : b.volume_terpenuhi,
              claimed_org: userOrg || relatedCase?.mitraHandler,
              claimed_volume: amountStr,
              claimed_armada: resolvedFleet,
              claim_notes: notesInput,
            }
          : b
      );
      try {
        localStorage.setItem("reksa_bursa_db", JSON.stringify(updatedBursaList));
      } catch (_) {}

      // Update React shared state
      update?.({
        penawaranList: updatedOffers,
        bursaList: updatedBursaList,
        ...(updatedCasesList ? { casesList: updatedCasesList } : {}),
        ...(isDelegatedToMitra ? {
          misiList: updatedMisiList,
          assignment: "Dalam Perjalanan",
        } : {})
      });

      // Tutup modal dan langsung pindah ke halaman Penawaran Saya
      setModalBursa(null);
      setIsSubmitting(false);

      if (isDelegatedToMitra) {
        notify?.(`Komitmen diajukan! Penawaran otomatis disetujui (ACC) & Misi Penyaluran armada langsung aktif.`);
      } else {
        notify?.(`Penawaran bantuan ${modalBursa.item_bantuan} (${amountStr}) berhasil diajukan ke Posko BPBD (menunggu verifikasi & persetujuan Posko).`);
      }

      onNavigateToMyOffers();

      // Kirim ke backend di background tanpa memblokir UI
      apiService.createPenawaran({
        bursa_id: modalBursa.id,
        jumlah_tawaran: amountStr,
        volume_angka: num,
        satuan: offeredUnit,
        metode_penyaluran: deliveryMethod,
        kategori_komoditas: modalBursa.item_bantuan,
        waktu_kesiapan: readinessTime,
        armada_info: resolvedFleet,
        organisasi: userOrg,
        catatan: notesInput,
      }).then((res) => {
        if (res.success && res.data) {
          try {
            let cur = JSON.parse(localStorage.getItem("reksa_penawaran_db") || "[]");
            cur = [res.data, ...cur.filter((o: any) => o.id !== newOffer.id && o.kode_penawaran !== newOffer.kode_penawaran)];
            localStorage.setItem("reksa_penawaran_db", JSON.stringify(cur));
          } catch (_) {}
        }
      }).catch((e) => {
        console.warn("createPenawaran note:", e);
      });
    } catch (err: any) {
      notify?.(err?.message || "Gagal mengajukan penawaran bantuan.");
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
        {/* Row 1: Urgency Filter Tabs & Origin Filter & AI Match Toggle */}
        <div className="posko-toolbar-tabs" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
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

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Origin Jalur Filter */}
            <div style={{ display: "inline-flex", background: "#f8fafc", padding: "3px", borderRadius: "999px", gap: "3px", border: "1px solid #e2e8f0" }}>
              <button
                type="button"
                onClick={() => { setFilterOrigin("all"); setCurrentPage(1); }}
                style={{
                  background: filterOrigin === "all" ? "#013220" : "transparent",
                  color: filterOrigin === "all" ? "#ffffff" : "#475569",
                  border: "none",
                  borderRadius: "999px",
                  padding: "5px 11px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                Semua Jalur
              </button>
              <button
                type="button"
                onClick={() => { setFilterOrigin("bpbd"); setCurrentPage(1); }}
                style={{
                  background: filterOrigin === "bpbd" ? "#047857" : "transparent",
                  color: filterOrigin === "bpbd" ? "#ffffff" : "#065f46",
                  border: "none",
                  borderRadius: "999px",
                  padding: "5px 11px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.15s ease",
                }}
                title="Hanya tampilkan laporan yang diverifikasi langsung oleh Posko BPBD"
              >
                <span>🛡️ Verifikasi BPBD</span>
                <span style={{ fontSize: "0.68rem", opacity: 0.9 }}>({countBpbd})</span>
              </button>
              <button
                type="button"
                onClick={() => { setFilterOrigin("mitra"); setCurrentPage(1); }}
                style={{
                  background: filterOrigin === "mitra" ? "#1d4ed8" : "transparent",
                  color: filterOrigin === "mitra" ? "#ffffff" : "#1e40af",
                  border: "none",
                  borderRadius: "999px",
                  padding: "5px 11px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.15s ease",
                }}
                title="Hanya tampilkan laporan yang dialihkan langsung ke mitra kemanusiaan"
              >
                <span>⚡ Dialihkan ke Mitra</span>
                <span style={{ fontSize: "0.68rem", opacity: 0.9 }}>({countDelegated})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setOnlyAiMatch(!onlyAiMatch);
                setCurrentPage(1);
              }}
              style={{
                background: onlyAiMatch ? "#064e3b" : "#f0fdf4",
                color: onlyAiMatch ? "#ffffff" : "#065f46",
                border: `1.5px solid ${onlyAiMatch ? "#047857" : "#a7f3d0"}`,
                padding: "6px 13px",
                borderRadius: "999px",
                fontSize: "0.78rem",
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              title="Saring kebutuhan dengan rekomendasi kecocokan AI tertinggi (>85% Match)"
            >
              <span>✨ {onlyAiMatch ? "Semua Match" : "Match AI (>85%)"}</span>
            </button>
          </div>
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

            const aiMatch = getAiMatchScore(item.item_bantuan, userOrg, item.urgensi);

            const matchedCase = cases?.find((c) => 
              (c.rawId && (c.rawId === item.id || c.rawId === item.kebutuhan_id)) || 
              (c.id && (item.kebutuhan?.kode_kasus === c.id || item.id === parseInt(c.id.replace(/\D/g, ""))))
            );

            const isDelegatedToMitra = Boolean(
              (item as any).isDelegatedToMitra ||
              matchedCase?.escalatedToMitra ||
              matchedCase?.mitraHandler ||
              (matchedCase?.status || "").toLowerCase().includes("mitra") ||
              (matchedCase?.status || "").toLowerCase().includes("dialihkan")
            );

            const assignedMitraName = (item as any).assignedMitra || matchedCase?.mitraHandler || "Mitra Kemanusiaan";

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
                    <span
                      className={`posko-case-status-badge ${
                        item.status === "Teralokasi Penuh"
                          ? "status-verified"
                          : item.status === "Klaim Diajukan"
                          ? "status-clarify"
                          : "status-pending"
                      }`}
                    >
                      {item.status || "Terbuka"}
                    </span>
                    {isDelegatedToMitra ? (
                      <span
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1.5px solid #bfdbfe",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                        title={`Laporan dialihkan ke ${assignedMitraName}. Komitmen bantuan langsung aktif tanpa verifikasi ulang Posko.`}
                      >
                        <span style={{ fontSize: "0.80rem" }}>⚡</span>
                        <span>Dialihkan ke Mitra</span>
                      </span>
                    ) : (
                      <span
                        style={{
                          background: "#ecfdf5",
                          color: "#065f46",
                          border: "1.5px solid #a7f3d0",
                          padding: "3px 10px",
                          borderRadius: "999px",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                        }}
                        title="Laporan divalidasi sah langsung oleh Petugas Koordinator Posko BPBD."
                      >
                        <span style={{ fontSize: "0.80rem" }}>🛡️</span>
                        <span>Verifikasi Posko BPBD</span>
                      </span>
                    )}
                    <span
                      style={{
                        background: aiMatch.matchScore >= 95 ? "#ecfdf5" : "#f0fdf4",
                        color: "#065f46",
                        border: "1px solid #a7f3d0",
                        padding: "3px 9px",
                        borderRadius: "999px",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                      title={aiMatch.rationale}
                    >
                      <span>✨ {aiMatch.matchScore}% Match AI</span>
                    </span>
                  </div>

                  <div className="posko-case-date">
                    <AppIcon name="pin" size={13} style={{ color: "#80866e" }} />
                    <span>{item.posko?.nama_posko || "Posko BPBD Wilayah"}</span>
                  </div>
                </div>

                {/* 2. Title & Visual Thumbnail */}
                <div className="posko-case-body-main" style={{ marginBottom: "12px" }}>
                  {/* Visual Photo Thumbnail */}
                  <div
                    className="posko-case-photo-thumb"
                    onClick={() => {
                      const relatedCase = cases?.find((c) => c.id === item.kode_kasus);
                      const photoUrl = getFieldEvidencePhoto(item.item_bantuan, item.kebutuhan?.foto_bukti || relatedCase?.fotoBukti);
                      setPreviewImage({
                        src: photoUrl,
                        title: `Kebutuhan ${item.item_bantuan} · Target ${item.target_volume}`,
                        location: locName,
                      });
                    }}
                    title="Klik untuk memperbesar foto dokumentasi"
                  >
                    <img
                      src={getFieldEvidencePhoto(item.item_bantuan, item.kebutuhan?.foto_bukti || cases?.find((c) => c.id === item.kode_kasus)?.fotoBukti)}
                      alt={item.item_bantuan}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1547683905-f686c993aae5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=1200&q=82";
                      }}
                      className="posko-case-photo-img"
                    />
                    <div className="posko-case-photo-badge">
                      <AppIcon name="camera" size={11} />
                      <span>{item.kebutuhan?.foto_bukti || cases?.find((c) => c.id === item.kode_kasus)?.fotoBukti ? "Foto Pelapor" : "Dokumentasi"}</span>
                    </div>
                    <div className="posko-case-photo-zoom" title="Klik untuk memperbesar">
                      <AppIcon name="search" size={13} style={{ color: "#ffffff" }} />
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="posko-case-info-col">
                    <h3 className="posko-case-title">
                      Kebutuhan {item.item_bantuan} · Target {item.target_volume}
                    </h3>

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
                  </div>
                </div>

                {/* AI Logistic Matchmaker Insight Banner */}
                <div
                  style={{
                    background: "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)",
                    border: "1px solid #a7f3d0",
                    borderRadius: "10px",
                    padding: "8px 14px",
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "0.80rem",
                    color: "#065f46",
                  }}
                >
                  <span style={{ fontSize: "1.05rem" }}>✨</span>
                  <span><strong>Rekomendasi REKSA AI untuk {userOrg}:</strong> {aiMatch.rationale}</span>
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
                  <div style={{ fontSize: "0.82rem", color: "#475569", display: "flex", alignItems: "center", gap: "6px" }}>
                    {isDelegatedToMitra ? (
                      <>
                        <span style={{ color: "#2563eb", fontWeight: 700 }}>⚡ Jalur Mitra:</span>
                        <span>Dialihkan ke {assignedMitraName} (komitmen langsung aktif &amp; misi otomatis terbit).</span>
                      </>
                    ) : (
                      <>
                        <span style={{ color: "#047857", fontWeight: 700 }}>🛡️ Jalur BPBD:</span>
                        <span>Diverifikasi sah oleh Posko BPBD. Komitmen armada menunggu persetujuan posko.</span>
                      </>
                    )}
                  </div>

                  <div className="posko-case-actions-cluster">
                    {item.status === "Teralokasi Penuh" ? (
                      <span
                        className="posko-case-status-badge"
                        style={{
                          padding: "8px 16px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "0.84rem",
                          background: "#f0fdf4",
                          color: "#166534",
                          border: "1px solid #bbf7d0",
                          borderRadius: "8px",
                          fontWeight: 700,
                        }}
                      >
                        <AppIcon name="check" size={14} />
                        <span>Teralokasi Penuh · Siap Disalurkan</span>
                      </span>
                    ) : isClaimedByMe ? (
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
                        title={
                          isDelegatedToMitra
                            ? "Ajukan komitmen armada mitra (otomatis disetujui & langsung aktif misi penyaluran)"
                            : "Ajukan komitmen penugasan armada organisasi Anda ke Posko BPBD"
                        }
                      >
                        <AppIcon name="handshake" size={14} />
                        <span>
                          {isDelegatedToMitra
                            ? "Ajukan Komitmen (Langsung Kirim)"
                            : "Ajukan Komitmen Bantuan"}
                        </span>
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
      {modalBursa && (() => {
        const parsedTarget = parseVolume(modalBursa.target_volume);
        const parsedFulfilled = parseVolume(modalBursa.volume_terpenuhi || "0");
        const remainingNum = Math.max(0, parsedTarget.num - parsedFulfilled.num) || parsedTarget.num || 100;
        const halfNum = Math.ceil(remainingNum / 2);
        const unit = (modalBursa as any).satuan || parsedTarget.unit || "Unit";
        const isKritis = modalBursa.urgensi?.toLowerCase().includes("kritis");
        const isTinggi = modalBursa.urgensi?.toLowerCase().includes("tinggi") || !modalBursa.urgensi;
        const isDelegatedModal = Boolean(
          (modalBursa as any)?.isDelegatedToMitra ||
          cases?.find((c) => (c.rawId && (c.rawId === modalBursa.id || c.rawId === modalBursa.kebutuhan_id)) || (c.id && modalBursa.kebutuhan?.kode_kasus === c.id))?.escalatedToMitra ||
          cases?.find((c) => (c.rawId && (c.rawId === modalBursa.id || c.rawId === modalBursa.kebutuhan_id)) || (c.id && modalBursa.kebutuhan?.kode_kasus === c.id))?.mitraHandler
        );

        return (
          <div className="modal-backdrop" onClick={() => setModalBursa(null)}>
            <div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "min(580px, 95%)",
                textAlign: "left",
                borderRadius: "20px",
                padding: "28px 32px",
                background: "#ffffff",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
                maxHeight: "92vh",
                overflowY: "auto",
                border: "1px solid rgba(1, 50, 32, 0.12)",
                position: "relative",
              }}
            >
              {/* TOMBOL TUTUP POJOK KANAN ATAS */}
              <button
                type="button"
                onClick={() => setModalBursa(null)}
                style={{
                  position: "absolute",
                  top: "20px",
                  right: "20px",
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  cursor: "pointer",
                  color: "#64748b",
                  width: "36px",
                  height: "36px",
                  display: "grid",
                  placeItems: "center",
                  transition: "all 0.15s ease",
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#e2e8f0";
                  e.currentTarget.style.color = "#0f172a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f1f5f9";
                  e.currentTarget.style.color = "#64748b";
                }}
                title="Tutup dialog"
              >
                <AppIcon name="x" size={18} />
              </button>

              {/* MODAL HEADER */}
              <div
                style={{
                  marginBottom: "16px",
                  borderBottom: "1px solid #f1f5f9",
                  paddingBottom: "14px",
                  paddingRight: "46px",
                }}
              >
                <span
                  style={{
                    fontSize: "0.74rem",
                    fontWeight: 700,
                    color: "#80866e",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  FORMULIR KOMITMEN MITRA BANTUAN
                </span>
                <h2 style={{ fontSize: "1.35rem", color: "#013220", margin: 0, fontWeight: 800 }}>
                  Ajukan Komitmen Penyaluran
                </h2>
              </div>

              {/* ALUR NOTIFICATION BANNER */}
              {isDelegatedModal ? (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1.5px solid #86efac",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                    fontSize: "0.84rem",
                    color: "#166534",
                    lineHeight: 1.45,
                  }}
                >
                  <strong style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                    <span>🚀 Alur Penugasan Khusus Mitra:</span>
                  </strong>
                  <span>
                    Kebutuhan ini adalah hasil penugasan langsung kepada mitra Anda. Ketika Anda menekan <strong>"Kirim Komitmen &amp; Aktifkan Misi"</strong>, penawaran akan <strong>otomatis disetujui (ACC langsung)</strong> dan <strong>Misi Penyaluran armada langsung aktif berjalan</strong> tanpa perlu verifikasi ulang dari Posko BPBD.
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    padding: "12px 16px",
                    marginBottom: "16px",
                    fontSize: "0.84rem",
                    color: "#334155",
                    lineHeight: 1.45,
                  }}
                >
                  <strong>ℹ️ Alur Standar Posko BPBD:</strong> Penawaran komitmen bantuan ini akan dikirimkan ke Posko BPBD dan tetap memerlukan verifikasi serta persetujuan resmi dari meja Posko BPBD sebelum misi penyaluran diterbitkan.
                </div>
              )}

              {/* CONTEXT TARGET CARD */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "14px",
                  padding: "16px 20px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "10px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong
                      style={{
                        fontSize: "1.06rem",
                        color: "#013220",
                        fontWeight: 800,
                        lineHeight: 1.35,
                        display: "block",
                      }}
                    >
                      {modalBursa.item_bantuan}
                    </strong>
                  </div>

                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "4px 12px",
                      borderRadius: "9999px",
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      background: isKritis ? "#fef2f2" : isTinggi ? "#fff7ed" : "#f0fdf4",
                      color: isKritis ? "#dc2626" : isTinggi ? "#c2410c" : "#15803d",
                      border: `1px solid ${isKritis ? "#fecaca" : isTinggi ? "#fed7aa" : "#bbf7d0"}`,
                      boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    <span
                      style={{
                        width: "7px",
                        height: "7px",
                        borderRadius: "50%",
                        background: isKritis ? "#dc2626" : isTinggi ? "#ea580c" : "#16a34a",
                        display: "inline-block",
                      }}
                    />
                    Prioritas {modalBursa.urgensi || "Tinggi"}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                    fontSize: "0.82rem",
                    color: "#166534",
                    marginTop: "8px",
                    paddingTop: "10px",
                    borderTop: "1px dashed #bbf7d0",
                  }}
                >
                  <div>
                    <span style={{ color: "#15803d", display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                      Target Kebutuhan Posko:
                    </span>
                    <strong style={{ fontSize: "0.95rem", color: "#013220" }}>
                      {modalBursa.target_volume}
                    </strong>
                    <span style={{ display: "block", fontSize: "0.74rem", color: "#166534", marginTop: "2px" }}>
                      (Tersisa: {remainingNum} {unit})
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "#15803d", display: "block", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                      Posko Penanggung Jawab:
                    </span>
                    <strong style={{ fontSize: "0.86rem", color: "#013220", lineHeight: 1.3, display: "block" }}>
                      {modalBursa.posko?.nama_posko || "Posko BPBD Wilayah"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* FORM FIELDS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Volume & Satuan + Pilihan Cepat */}
                <div>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                        <AppIcon name="box" size={14} style={{ color: "#15803d" }} />
                        <span>Volume yang Ditawarkan</span>
                      </label>
                      <input
                        type="number"
                        value={offeredAmount}
                        onChange={(e) => setOfferedAmount(e.target.value)}
                        placeholder="Contoh: 100"
                        className="reksa-input-field"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "0.92rem", fontWeight: 600 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                        Satuan
                      </label>
                      <input
                        type="text"
                        value={offeredUnit}
                        onChange={(e) => setOfferedUnit(e.target.value)}
                        className="reksa-input-field"
                        style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "0.88rem" }}
                      />
                    </div>
                  </div>

                  {/* Pilihan Cepat Presets */}
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600 }}>Pilihan Cepat:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setOfferedAmount(String(remainingNum));
                        setOfferedUnit(unit);
                      }}
                      style={{
                        padding: "3px 10px",
                        fontSize: "0.75rem",
                        borderRadius: "6px",
                        border: offeredAmount === String(remainingNum) ? "1.5px solid #15803d" : "1px solid #d1d5db",
                        background: offeredAmount === String(remainingNum) ? "#f0fdf4" : "#ffffff",
                        color: offeredAmount === String(remainingNum) ? "#15803d" : "#374151",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Penuh 100% ({remainingNum} {unit})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOfferedAmount(String(halfNum));
                        setOfferedUnit(unit);
                      }}
                      style={{
                        padding: "3px 10px",
                        fontSize: "0.75rem",
                        borderRadius: "6px",
                        border: offeredAmount === String(halfNum) ? "1.5px solid #15803d" : "1px solid #d1d5db",
                        background: offeredAmount === String(halfNum) ? "#f0fdf4" : "#ffffff",
                        color: offeredAmount === String(halfNum) ? "#15803d" : "#374151",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Sebagian 50% ({halfNum} {unit})
                    </button>
                  </div>
                </div>

                {/* Metode Penyaluran */}
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    <AppIcon name="handshake" size={14} style={{ color: "#15803d" }} />
                    <span>Metode Penyaluran Bantuan</span>
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('serah_posko')}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: deliveryMethod === 'serah_posko' ? "2px solid #013220" : "1px solid #d1d5db",
                        background: deliveryMethod === 'serah_posko' ? "#f0fdf4" : "#ffffff",
                        color: deliveryMethod === 'serah_posko' ? "#013220" : "#374151",
                        fontSize: "0.82rem",
                        fontWeight: deliveryMethod === 'serah_posko' ? 700 : 500,
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>📦</span>
                      <div>
                        <strong style={{ display: "block", lineHeight: 1.2 }}>Serah ke Gudang Posko</strong>
                        <small style={{ color: "#64748b", fontSize: "0.72rem" }}>Disortir &amp; disalurkan posko</small>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryMethod('mandiri')}
                      style={{
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: deliveryMethod === 'mandiri' ? "2px solid #013220" : "1px solid #d1d5db",
                        background: deliveryMethod === 'mandiri' ? "#f0fdf4" : "#ffffff",
                        color: deliveryMethod === 'mandiri' ? "#013220" : "#374151",
                        fontSize: "0.82rem",
                        fontWeight: deliveryMethod === 'mandiri' ? 700 : 500,
                        cursor: "pointer",
                        textAlign: "left",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <span style={{ fontSize: "1.2rem" }}>🚚</span>
                      <div>
                        <strong style={{ display: "block", lineHeight: 1.2 }}>Penyaluran Mandiri</strong>
                        <small style={{ color: "#64748b", fontSize: "0.72rem" }}>Mitra langsung ke warga</small>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Informasi Armada (Mandiri atau Umum) */}
                {deliveryMethod === 'mandiri' && (
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                      <AppIcon name="truck" size={14} style={{ color: "#15803d" }} />
                      <span>Informasi Armada &amp; Pengemudi Mitra</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: Truk Box B 1234 CD · Kapasitas 2 Ton"
                      value={fleetInfo}
                      onChange={(e) => setFleetInfo(e.target.value)}
                      className="reksa-input-field"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "0.88rem" }}
                    />
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Rekomendasi:</span>
                      {[
                        "Mobil Box Logistik No. 01",
                        "Truk Pickup No. 03 (500 kg)",
                        "Armada Motor Roda 3",
                      ].map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => setFleetInfo(name)}
                          style={{
                            padding: "3px 8px",
                            fontSize: "0.72rem",
                            borderRadius: "6px",
                            border: "1px solid #d1d5db",
                            background: "#f8fafc",
                            color: "#334155",
                            cursor: "pointer",
                          }}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Waktu Kesiapan Logistik */}
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    <AppIcon name="clock" size={14} style={{ color: "#15803d" }} />
                    <span>Waktu Kesiapan Logistik</span>
                  </label>
                  <input
                    type="text"
                    value={readinessTime}
                    onChange={(e) => setReadinessTime(e.target.value)}
                    placeholder="Contoh: Hari ini, Siap Diserahkan ke Posko"
                    className="reksa-input-field"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "0.88rem" }}
                  />
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                    {[
                      "Hari ini, Siap Diserahkan ke Posko",
                      "Besok Pagi (Pkl 08:00 WIB)",
                      "Jadwal Penyaluran Segera",
                    ].map((timeOpt) => (
                      <button
                        key={timeOpt}
                        type="button"
                        onClick={() => setReadinessTime(timeOpt)}
                        style={{
                          padding: "3px 8px",
                          fontSize: "0.72rem",
                          borderRadius: "6px",
                          border: readinessTime === timeOpt ? "1px solid #15803d" : "1px solid #d1d5db",
                          background: readinessTime === timeOpt ? "#f0fdf4" : "#f8fafc",
                          color: readinessTime === timeOpt ? "#15803d" : "#334155",
                          cursor: "pointer",
                        }}
                      >
                        {timeOpt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Catatan Operasional */}
                <div>
                  <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                    <AppIcon name="file" size={14} style={{ color: "#15803d" }} />
                    <span>Catatan Operasional Mitra</span>
                  </label>
                  <textarea
                    rows={3}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    placeholder="Tuliskan catatan khusus atau estimasi rencana penyaluran..."
                    className="reksa-textarea-field"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "0.88rem", resize: "vertical" }}
                  />
                </div>
              </div>

              {/* MODAL FOOTER */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  alignItems: "center",
                  gap: "10px",
                  marginTop: "24px",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "18px",
                }}
              >
                <button
                  type="button"
                  className="reksa-btn reksa-btn-secondary"
                  disabled={isSubmitting}
                  onClick={() => setModalBursa(null)}
                  style={{ padding: "8px 18px", borderRadius: "8px", fontWeight: 600 }}
                >
                  Batal
                </button>

                <button
                  type="button"
                  className="reksa-btn reksa-btn-primary"
                  disabled={isSubmitting || !offeredAmount}
                  onClick={handleSubmitOffer}
                  style={{
                    background: "#013220",
                    color: "#ffffff",
                    padding: "8px 22px",
                    borderRadius: "8px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: isSubmitting || !offeredAmount ? "not-allowed" : "pointer",
                    opacity: isSubmitting || !offeredAmount ? 0.6 : 1,
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <AppIcon name="clock" size={14} />
                      <span>{isDelegatedModal ? "Memproses Komitmen & Misi..." : "Mengirim Penawaran..."}</span>
                    </>
                  ) : isDelegatedModal ? (
                    <>
                      <AppIcon name="check" size={14} />
                      <span>Kirim Komitmen &amp; Aktifkan Misi</span>
                    </>
                  ) : (
                    <>
                      <AppIcon name="check" size={14} />
                      <span>Kirim Penawaran ke Posko</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
