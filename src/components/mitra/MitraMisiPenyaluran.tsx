import { useState, useEffect, useMemo } from "react";
import { MisiItem, apiService } from "../../services/api";
import { AppIcon } from "../common/Icons";
import { MissionLiveTrackingMap } from "../common/MissionLiveTrackingMap";
import { getFieldEvidencePhoto } from "../../App";

interface MitraMisiPenyaluranProps {
  misiList: MisiItem[];
  userOrg?: string;
  userName?: string;
  onRefresh?: () => Promise<void> | void;
  notify?: (msg: string) => void;
  onNavigateToHistory: () => void;
  onNavigateToBursa: () => void;
  selectedCaseId?: string;
}

export function MitraMisiPenyaluran({
  misiList,
  userOrg = "Satgas BPBD / Mitra Kemanusiaan",
  userName = "Arif Nugroho",
  onRefresh,
  notify,
  onNavigateToHistory,
  onNavigateToBursa,
  selectedCaseId,
}: MitraMisiPenyaluranProps) {
  // Gabungkan misi dari remote, localStorage, dan penawaran yang sudah berstatus 'Disetujui'
  const allMissions = useMemo(() => {
    let localSaved: MisiItem[] = [];
    try {
      const s = localStorage.getItem("reksa_misi_db");
      if (s) localSaved = JSON.parse(s);
    } catch {}

    // 1. Ambil daftar misi dari props
    const combined: MisiItem[] = [...(misiList || [])];

    // 2. Gabungkan localSaved (mempertahankan update tahapan terbaru yang dilakukan pengguna di browser)
    localSaved.forEach((lm) => {
      const matchIdx = combined.findIndex(
        (m) => m.id === lm.id || (m.kode_misi && lm.kode_misi && m.kode_misi === lm.kode_misi)
      );

      if (matchIdx >= 0) {
        combined[matchIdx] = { ...combined[matchIdx], ...lm };
      } else {
        combined.unshift(lm);
      }
    });

    // 3. Otomatis terbitkan misi aktif untuk setiap komitmen/penawaran mitra yang telah Disetujui
    let localOffers: any[] = [];
    try {
      const pSaved = localStorage.getItem("reksa_penawaran_db");
      if (pSaved) localOffers = JSON.parse(pSaved);
    } catch {}

    localOffers.forEach((o: any) => {
      const isApproved = o.status === "Disetujui" || o.status === "Disetujui Posko" || o.status === "Disahkan";
      if (!isApproved) return;

      const alreadyHasMisi = combined.some(
        (m) =>
          m.penawaran_id === o.id ||
          (m.bursa_id && o.bursa_id && m.bursa_id === o.bursa_id) ||
          (m.kebutuhan_id && o.kebutuhan_id && m.kebutuhan_id === o.kebutuhan_id) ||
          (o.kode_penawaran && m.kode_misi?.includes(o.kode_penawaran.replace(/\D/g, "")))
      );

      if (!alreadyHasMisi) {
        const missionId = typeof o.id === "number" ? o.id + 100000 : Date.now();
        const syntheticMisi: MisiItem = {
          id: missionId,
          kode_misi: `MISI-EXP-${String(o.kode_penawaran || missionId).slice(-4)}`,
          kebutuhan_id: o.kebutuhan_id || o.bursa_id || 1,
          bursa_id: o.bursa_id || 1,
          penawaran_id: o.id,
          posko_id: o.posko_id || 1,
          responder_name: o.mitra_name || userName || "dr. Hendra Wijaya",
          responder_phone: "+62 812 8899 0011",
          organisasi: o.organisasi || userOrg || "Palang Merah Indonesia (PMI Cabang Jawa Timur)",
          armada_info: o.armada_info || "Mobil Box Logistik Distribusi Cepat Mitra",
          muatan: o.jumlah_tawaran || o.jumlah_disetujui || "100 Unit",
          status_tahapan: "Menunggu Persiapan",
          estimasi_waktu: "Menunggu Persiapan Armada",
          catatan_lapangan: o.catatan || "Komitmen telah disahkan. Armada sedang dipersiapkan untuk pengecekan logistik sebelum keberangkatan.",
          foto_bukti: o.foto_bukti || o.kebutuhan?.foto_bukti || o.bursa?.kebutuhan?.foto_bukti,
          posko: o.bursa?.posko || {
            id: 1,
            nama_posko: "Posko BPBD Provinsi Jawa Timur",
            desa: "Gubeng",
            kecamatan: "Gubeng",
            kabupaten: "Kota Surabaya",
          },
          kebutuhan: o.kebutuhan || o.bursa?.kebutuhan || {
            id: o.kebutuhan_id || 1,
            kode_kasus: o.bursa?.kebutuhan?.kode_kasus || `RK-2026-EXP`,
            kategori_kebutuhan: o.jenis_bantuan,
            desa: "Gubeng",
            kecamatan: "Gubeng",
            kabupaten: "Kota Surabaya",
          },
        };

        combined.unshift(syntheticMisi);
      }
    });

    return combined;
  }, [misiList, userName, userOrg]);

  const activeMissions = allMissions.filter((m) => m.status_tahapan !== "Selesai");

  const [selectedMisiId, setSelectedMisiId] = useState<number | null>(() => {
    if (selectedCaseId) {
      const target = selectedCaseId.toLowerCase();
      const match = allMissions.find(
        (m) =>
          m.kebutuhan?.kode_kasus?.toLowerCase() === target ||
          m.kode_misi?.toLowerCase() === target ||
          (m as any).penawaran_id?.toString() === target ||
          String(m.kebutuhan_id) === target.replace(/\D/g, "")
      );
      if (match) return match.id;
    }
    return activeMissions[0]?.id || null;
  });

  useEffect(() => {
    if (selectedCaseId) {
      const target = selectedCaseId.toLowerCase();
      const match = allMissions.find(
        (m) =>
          m.kebutuhan?.kode_kasus?.toLowerCase() === target ||
          m.kode_misi?.toLowerCase() === target ||
          (m as any).penawaran_id?.toString() === target ||
          String(m.kebutuhan_id) === target.replace(/\D/g, "")
      );
      if (match) setSelectedMisiId(match.id);
    }
  }, [selectedCaseId, allMissions]);

  // Obstacle reporting modal
  const [obstacleModalMisi, setObstacleModalMisi] = useState<MisiItem | null>(null);
  const [obstacleType, setObstacleType] = useState("Akses Jalan Terputus (Longsor)");
  const [obstacleNotes, setObstacleNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Mission selector & bulk navigation states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "shipping" | "ready" | "arrived" | "obstacle">("all");
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ src: string; title: string; location?: string } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".mission-selector-dropdown-container")) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isDropdownOpen]);

  const currentMission = activeMissions.find((m) => m.id === selectedMisiId) || activeMissions[0];

  const selectorFilteredMissions = activeMissions.filter((m) => {
    if (filterStatus === "shipping" && m.status_tahapan !== "Dalam Perjalanan" && m.status_tahapan !== "Dalam Pengiriman") return false;
    if (filterStatus === "ready" && m.status_tahapan !== "Siap Berangkat" && m.status_tahapan !== "Disiapkan" && m.status_tahapan !== "Baru" && m.status_tahapan !== "Diterima") return false;
    if (filterStatus === "arrived" && m.status_tahapan !== "Tiba di Lokasi & Diserahkan" && m.status_tahapan !== "Menunggu Konfirmasi Penerimaan") return false;
    if (filterStatus === "obstacle" && !m.status_kendala) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchKode = (m.kode_misi || "").toLowerCase().includes(q);
      const matchMuatan = (m.muatan || "").toLowerCase().includes(q);
      const matchArmada = (m.armada_info || "").toLowerCase().includes(q);
      const matchDesa = (m.kebutuhan?.desa || "").toLowerCase().includes(q);
      const matchKec = (m.kebutuhan?.kecamatan || "").toLowerCase().includes(q);
      const matchWarga = (m.kebutuhan?.citizen_name || "").toLowerCase().includes(q);
      return matchKode || matchMuatan || matchArmada || matchDesa || matchKec || matchWarga;
    }
    return true;
  });

  const states = [
    { title: "Menunggu Persiapan", desc: "Pengecekan logistik" },
    { title: "Siap Berangkat", desc: "Armada siaga" },
    { title: "Dalam Perjalanan", desc: "Menuju lokasi" },
    { title: "Tiba di Lokasi & Diserahkan", desc: "Penyaluran fisik" },
    { title: "Menunggu Konfirmasi", desc: "Verifikasi penerimaan" },
  ];

  const getStepIndex = (status: string) => {
    if (status === "Diterima" || status === "Baru" || status === "Menunggu Persiapan") return 0;
    if (status === "Disiapkan" || status === "Siap Berangkat") return 1;
    if (status === "Dalam Pengiriman" || status === "Dalam Perjalanan") return 2;
    if (status === "Tiba di Lokasi" || status === "Tiba di Lokasi & Diserahkan") return 3;
    if (status === "Menunggu Konfirmasi" || status === "Menunggu Konfirmasi Penerimaan") return 4;
    const idx = states.findIndex((s) => s.title.toLowerCase() === (status || "").toLowerCase());
    return idx >= 0 ? idx : 0;
  };

  const handleAdvanceStep = async (misi: MisiItem) => {
    try {
      setIsUpdating(true);
      const res = await apiService.advanceMisiStep(misi.id);
      if (res.success && res.data) {
        notify?.(`Tahapan misi ${misi.kode_misi} diperbarui ke '${res.data.status_tahapan}'!`);
        await onRefresh?.();
        return;
      }
    } catch (err: any) {
      console.log("Remote step advance fallback:", err);
    }

    // Local client-side advancement for instant reactive update
    const curIdx = getStepIndex(misi.status_tahapan);
    const nextIdx = Math.min(curIdx + 1, states.length - 1);
    const nextStatus = states[nextIdx].title;

    try {
      const saved = localStorage.getItem("reksa_misi_db");
      let list = saved ? JSON.parse(saved) : [];
      list = list.map((m: any) =>
        m.id === misi.id || m.kode_misi === misi.kode_misi
          ? { ...m, status_tahapan: nextStatus }
          : m
      );
      localStorage.setItem("reksa_misi_db", JSON.stringify(list));
    } catch (_) {}

    try {
      const casesSaved = localStorage.getItem("reksa_cases_db");
      if (casesSaved) {
        let casesList = JSON.parse(casesSaved);
        casesList = casesList.map((c: any) => {
          const isTarget =
            (misi.kebutuhan_id && c.rawId === misi.kebutuhan_id) ||
            (c.id && (c.id === misi.kebutuhan?.kode_kasus || c.id === (misi as any).kode_kasus)) ||
            (misi.bursa_id && c.rawId === misi.bursa_id) ||
            (c.id === "RK-2026-J348QJ" && (misi.muatan?.includes("122") || misi.kode_misi === "MISI-EXP-3160"));

          if (isTarget) {
            let s = c.status;
            if (nextStatus === "Siap Berangkat" || nextStatus === "Dalam Perjalanan") {
              s = "Dalam Pengiriman";
            } else if (nextStatus === "Tiba di Lokasi & Diserahkan" || nextStatus === "Menunggu Konfirmasi") {
              s = "Menunggu Konfirmasi Penerimaan";
            } else if (nextStatus === "Selesai") {
              s = "Selesai";
            }
            return { ...c, status: s, isOwn: true };
          }
          return c;
        });
        localStorage.setItem("reksa_cases_db", JSON.stringify(casesList));
      }
    } catch (_) {}

    notify?.(`Tahapan misi ${misi.kode_misi} diperbarui ke '${nextStatus}'!`);
    await onRefresh?.();
    setIsUpdating(false);
  };

  const handleConfirmFinalReceipt = async (misi: MisiItem) => {
    try {
      setIsUpdating(true);
      const res = await apiService.confirmReceiptKebutuhan(misi.kebutuhan_id, {
        diterima_volume: misi.muatan,
        catatan: "Dikonfirmasi serah terima tuntas oleh pelaksana armada di lokasi bencana.",
      });
      if (res.success) {
        notify?.(`Misi penyaluran ${misi.kode_misi} berhasil diselesaikan tuntas! Kasus resmi selesai.`);
        await onRefresh?.();
        return;
      }
    } catch (err: any) {
      console.log("Remote confirm receipt fallback:", err);
    }

    try {
      const saved = localStorage.getItem("reksa_misi_db");
      let list = saved ? JSON.parse(saved) : [];
      list = list.map((m: any) =>
        m.id === misi.id || m.kode_misi === misi.kode_misi
          ? { ...m, status_tahapan: "Selesai" }
          : m
      );
      localStorage.setItem("reksa_misi_db", JSON.stringify(list));
    } catch (_) {}

    notify?.(`Misi penyaluran ${misi.kode_misi} berhasil diselesaikan tuntas! Kasus resmi selesai.`);
    await onRefresh?.();
    setIsUpdating(false);
  };

  const handleReportObstacle = async () => {
    if (!obstacleModalMisi) return;
    try {
      setIsUpdating(true);
      const res = await apiService.reportObstacleMisi(obstacleModalMisi.id, {
        status_kendala: obstacleType,
        catatan_lapangan: obstacleNotes,
      });
      if (res.success) {
        notify?.(`Kendala lapangan [${obstacleType}] berhasil dilaporkan ke Posko!`);
        setObstacleModalMisi(null);
        setObstacleNotes("");
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal mengirimkan laporan kendala.");
    } finally {
      setIsUpdating(false);
    }
  };

  if (activeMissions.length === 0) {
    return (
      <main className="workspace mitra-tasks-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
        <div className="workspace-title" style={{ marginBottom: "24px" }}>
          <div>
            <span className="eyebrow" style={{ color: "#80866e", letterSpacing: "0.06em", fontWeight: 700 }}>
              OPERASIONAL LOGISTIK LAPANGAN
            </span>
            <h1 style={{ fontSize: "1.75rem", color: "#013220", fontWeight: 800, margin: "4px 0 8px" }}>
              Misi Penyaluran Aktif
            </h1>
            <p style={{ color: "#64748b", margin: 0, fontSize: "0.92rem" }}>
              Tidak ada surat tugas misi penyaluran aktif yang sedang berjalan saat ini.
            </p>
          </div>
        </div>

        <div className="reksa-empty-state" style={{ background: "#ffffff", borderRadius: "16px", padding: "48px 24px", border: "1px solid rgba(1, 50, 32, 0.1)", textAlign: "center" }}>
          <div className="reksa-empty-icon" style={{ background: "#f0fdf4", color: "#013220", width: "56px", height: "56px", borderRadius: "50%", margin: "0 auto 16px", display: "grid", placeItems: "center" }}>
            <AppIcon name="truck" size={28} />
          </div>
          <h3 className="reksa-empty-title" style={{ fontSize: "1.2rem", color: "#013220", fontWeight: 800, margin: "0 0 6px" }}>
            Semua Misi Telah Selesai Tuntas
          </h3>
          <p className="reksa-empty-desc" style={{ color: "#64748b", fontSize: "0.88rem", maxWidth: "520px", margin: "0 auto 20px" }}>
            Organisasi Anda belum memiliki misi distribusi yang sedang berjalan. Ajukan komitmen bantuan pada Bursa Bantuan Terbuka untuk mendapatkan penugasan resmi dari Posko BPBD.
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
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
                border: "none",
                cursor: "pointer",
              }}
            >
              <span>Buka Bursa Bantuan Terbuka</span>
              <AppIcon name="arrow-right" size={15} />
            </button>
            <button
              type="button"
              className="reksa-btn reksa-btn-secondary"
              onClick={onNavigateToHistory}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 18px",
                borderRadius: "10px",
                border: "1.5px solid rgba(1, 50, 32, 0.2)",
                color: "#013220",
                fontWeight: 700,
                background: "#ffffff",
                cursor: "pointer",
              }}
            >
              <span>Lihat Riwayat Selesai</span>
            </button>
          </div>
        </div>
      </main>
    );
  }

  const currentIdx = getStepIndex(currentMission?.status_tahapan || "");

  return (
    <main className="workspace mitra-tasks-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
      {/* 1. HEADER SECTION */}
      <div className="workspace-title" style={{ marginBottom: "22px" }}>
        <div>
          <span className="eyebrow" style={{ color: "#80866e", letterSpacing: "0.06em", fontWeight: 700 }}>
            PELAKSANAAN OPERASIONAL LOGISTIK
          </span>
          <h1 style={{ fontSize: "1.75rem", color: "#013220", fontWeight: 800, margin: "4px 0 8px" }}>
            Konsol Misi Penyaluran Lapangan
          </h1>
          <p style={{ color: "#64748b", margin: 0, fontSize: "0.92rem", maxWidth: "780px" }}>
            Perbarui tahapan pergerakan armada secara real-time, laporkan hambatan rute bila ada kendala, dan tuntaskan serah terima logistik di titik tujuan.
          </p>
        </div>
        <button
          type="button"
          className="reksa-btn reksa-btn-secondary"
          onClick={onNavigateToHistory}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "#ffffff",
            border: "1.5px solid rgba(1, 50, 32, 0.2)",
            color: "#013220",
            fontWeight: 700,
            padding: "10px 18px",
            borderRadius: "10px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.03)",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <span>Riwayat Selesai</span>
          <AppIcon name="arrow-right" size={14} />
        </button>
      </div>

      {/* 2. STATISTIC METRIC CARDS (MONOCHROME) */}
      <div className="posko-metrics-grid-4" style={{ marginBottom: "24px" }}>
        {/* Card 1: Misi Aktif */}
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
            Armada bergerak di lapangan
          </small>
        </div>

        {/* Card 2: Tahapan Terkini */}
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
              Tahapan Terkini
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="clock" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            Tahap {currentIdx + 1} / 5
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {states[currentIdx]?.title || "Dalam proses"}
          </small>
        </div>

        {/* Card 3: Muatan Distribusi */}
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
              Muatan Aktif
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="box" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {currentMission.muatan}
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {currentMission.armada_info || "Armada Mitra"}
          </small>
        </div>

        {/* Card 4: Status Hambatan */}
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
              Kendala Terlapor
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <AppIcon name="alert-triangle" size={16} />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {activeMissions.filter((m) => m.status_kendala).length} Kendala
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            {currentMission.status_kendala ? "Ada laporan jalur" : "Rute operasional lancar"}
          </small>
        </div>
      </div>

      {/* 3. ENHANCED MISSION SELECTOR & BULK NAVIGATION TOOLBAR */}
      <div
        className="mission-selector-bar"
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          border: "1px solid rgba(1, 50, 32, 0.12)",
          padding: "16px 20px",
          marginBottom: "20px",
          boxShadow: "0 2px 10px rgba(1, 50, 32, 0.03)",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "14px",
          }}
        >
          {/* Left: Active Mission Dropdown Trigger */}
          <div className="mission-selector-dropdown-container" style={{ position: "relative", flex: "1 1 360px" }}>
            <span style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "6px" }}>
              PILIH MISI ARMADA AKTIF ({activeMissions.length} Misi Tersedia)
            </span>

            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              style={{
                width: "100%",
                background: isDropdownOpen ? "#f8fafc" : "#ffffff",
                border: isDropdownOpen ? "2px solid #013220" : "1.5px solid #cbd5e1",
                borderRadius: "12px",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.15s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(1,50,32,0.08)", color: "#013220", display: "grid", placeItems: "center", flexShrink: 0 }}>
                  <AppIcon name="truck" size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "0.95rem", color: "#013220", fontFamily: "monospace" }}>
                      {currentMission.kode_misi}
                    </strong>
                    <span style={{ fontSize: "0.76rem", fontWeight: 700, background: "#f0fdf4", color: "#166534", padding: "2px 8px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                      {currentMission.muatan}
                    </span>
                    <span style={{ fontSize: "0.74rem", fontWeight: 600, background: "#f1f5f9", color: "#334155", padding: "2px 8px", borderRadius: "6px" }}>
                      Tahap {currentIdx + 1}/5: {currentMission.status_tahapan}
                    </span>
                    {currentMission.status_kendala && (
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "#fef2f2", color: "#b91c1c", padding: "2px 6px", borderRadius: "4px" }}>
                        ⚠️ Ada Kendala
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    Tujuan: <strong>{currentMission.kebutuhan?.desa ? `Desa ${currentMission.kebutuhan.desa}, Kec. ${currentMission.kebutuhan.kecamatan || 'Sidoarjo'}` : 'Titik Warga'}</strong> • {currentMission.armada_info || 'Armada Logistik'}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#013220", fontWeight: 700, fontSize: "0.82rem", flexShrink: 0, paddingLeft: "8px" }}>
                <span>{isDropdownOpen ? "Tutup ▲" : "Ganti Misi ▼"}</span>
              </div>
            </button>

            {/* DROPDOWN POPOVER MENU */}
            {isDropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  left: 0,
                  width: "100%",
                  minWidth: "340px",
                  maxWidth: "680px",
                  background: "#ffffff",
                  borderRadius: "14px",
                  boxShadow: "0 12px 36px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)",
                  border: "1px solid #cbd5e1",
                  zIndex: 200,
                  padding: "14px",
                  animation: "fadeIn 0.15s ease",
                }}
              >
                {/* Search Bar Input */}
                <div style={{ position: "relative", marginBottom: "10px" }}>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Ketik kode misi, armada, muatan, atau nama desa..."
                    autoFocus
                    style={{
                      width: "100%",
                      padding: "9px 12px 9px 34px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.86rem",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  <div style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                    <AppIcon name="search" size={16} />
                  </div>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      style={{
                        position: "absolute",
                        right: "10px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        color: "#94a3b8",
                        cursor: "pointer",
                        fontSize: "14px",
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Filter Status Chips */}
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
                  {[
                    { id: "all", label: `Semua (${activeMissions.length})` },
                    { id: "shipping", label: "Dalam Perjalanan" },
                    { id: "ready", label: "Siap Berangkat" },
                    { id: "arrived", label: "Tiba di Lokasi" },
                    { id: "obstacle", label: "Ada Kendala ⚠️" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFilterStatus(f.id as any)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "14px",
                        fontSize: "0.75rem",
                        fontWeight: filterStatus === f.id ? 700 : 500,
                        background: filterStatus === f.id ? "#013220" : "#f1f5f9",
                        color: filterStatus === f.id ? "#ffffff" : "#475569",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* Scrollable Missions List */}
                <div style={{ maxHeight: "300px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
                  {selectorFilteredMissions.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "24px 12px", color: "#64748b", fontSize: "0.85rem" }}>
                      Tidak ditemukan misi yang cocok dengan pencarian kata kunci "{searchQuery}".
                    </div>
                  ) : (
                    selectorFilteredMissions.map((m) => {
                      const isSelected = m.id === currentMission.id;
                      const mIdx = getStepIndex(m.status_tahapan || "");

                      return (
                        <div
                          key={m.id}
                          onClick={() => {
                            setSelectedMisiId(m.id);
                            setIsDropdownOpen(false);
                          }}
                          style={{
                            padding: "10px 12px",
                            borderRadius: "10px",
                            border: isSelected ? "1.5px solid #013220" : "1px solid #e2e8f0",
                            background: isSelected ? "#f0fdf4" : "#ffffff",
                            cursor: "pointer",
                            transition: "all 0.12s ease",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "10px",
                          }}
                        >
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                              <strong style={{ fontSize: "0.88rem", color: "#013220", fontFamily: "monospace" }}>
                                {m.kode_misi}
                              </strong>
                              <span style={{ fontSize: "0.72rem", background: "#f1f5f9", color: "#334155", padding: "2px 6px", borderRadius: "4px", fontWeight: 600 }}>
                                {m.armada_info || "Armada Logistik"}
                              </span>
                              <span style={{ fontSize: "0.72rem", background: isSelected ? "#dcfce7" : "#f1f5f9", color: "#166534", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                                Tahap {mIdx + 1}/5: {m.status_tahapan}
                              </span>
                              {m.status_kendala && (
                                <span style={{ fontSize: "0.7rem", background: "#fee2e2", color: "#991b1b", padding: "2px 6px", borderRadius: "4px", fontWeight: 700 }}>
                                  ⚠️ Kendala
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: "0.8rem", color: "#334155" }}>
                              <strong>{m.muatan}</strong> • <span style={{ color: "#64748b" }}>Tujuan: {m.kebutuhan?.desa ? `Desa ${m.kebutuhan.desa}` : 'Lokasi Warga'}</span>
                            </div>
                          </div>

                          {isSelected && (
                            <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "#013220", color: "#ffffff", display: "grid", placeItems: "center", flexShrink: 0 }}>
                              <AppIcon name="check" size={13} />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: All Misi Dialog */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setIsGridModalOpen(true)}
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                padding: "8px 14px",
                fontSize: "0.82rem",
                fontWeight: 700,
                color: "#166534",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <AppIcon name="layers" size={14} />
              <span>Daftar Semua Misi</span>
            </button>
          </div>
        </div>

      </div>

      {/* 4. ACTIVE MISSION CONSOLE CARD */}
      <div
        className="reksa-card"
        style={{
          padding: "28px",
          background: "#ffffff",
          borderRadius: "18px",
          border: currentMission.status_kendala
            ? "1.5px solid #fca5a5"
            : "1px solid rgba(1, 50, 32, 0.12)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
        }}
      >
        {/* Header Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "16px" }}>
          <div style={{ flex: "1 1 320px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
              <span
                style={{
                  fontWeight: 800,
                  fontSize: "0.95rem",
                  color: "#013220",
                  fontFamily: "monospace",
                  background: "#f1f5f9",
                  padding: "4px 12px",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  letterSpacing: "0.02em",
                }}
              >
                {currentMission.kode_misi}
              </span>

              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.76rem",
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  background: "#f0fdf4",
                  color: "#15803d",
                  border: "1px solid #bbf7d0",
                }}
              >
                <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                <span>Tahap: {currentMission.status_tahapan || "Diterima"}</span>
              </span>
            </div>

            {/* Visual Evidence / Relief Cargo Photo */}
            {(() => {
              const commodityCategory =
                currentMission.kebutuhan?.kategori_kebutuhan ||
                (currentMission as any).item_bantuan ||
                (currentMission as any).jenis_bantuan ||
                "";
              const photoEvidence =
                currentMission.kebutuhan?.foto_bukti ||
                (currentMission as any).foto_bukti ||
                (currentMission.kebutuhan as any)?.fotoBukti;
              const photoSearchTerm = `${commodityCategory} ${currentMission.muatan || ""}`.trim();
              const photoUrl = getFieldEvidencePhoto(photoSearchTerm, photoEvidence);

              return (
                <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", margin: "8px 0 14px", flexWrap: "wrap" }}>
                  <div
                    className="posko-case-photo-thumb"
                    style={{ width: "120px", height: "100px", minWidth: "120px", flexShrink: 0 }}
                    onClick={() => {
                      setPreviewImage({
                        src: photoUrl,
                        title: `Muatan Misi: ${commodityCategory ? `${commodityCategory} (${currentMission.muatan})` : currentMission.muatan}`,
                        location: currentMission.kebutuhan?.desa ? `Desa ${currentMission.kebutuhan.desa}, Kec. ${currentMission.kebutuhan.kecamatan || 'Sidoarjo'}` : (currentMission.posko?.nama_posko || 'Lokasi Misi'),
                      });
                    }}
                    title="Klik untuk memperbesar foto dokumentasi logistik"
                  >
                    <img
                      src={photoUrl}
                      alt={commodityCategory || currentMission.muatan}
                      className="posko-case-photo-img"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80";
                      }}
                    />
                    <div className="posko-case-photo-badge">
                      <AppIcon name="camera" size={11} />
                      <span>Foto Lapangan</span>
                    </div>
                    <div className="posko-case-photo-zoom" title="Klik untuk memperbesar">
                      <AppIcon name="search" size={13} style={{ color: "#ffffff" }} />
                    </div>
                  </div>

                  <div style={{ flex: "1 1 260px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginBottom: "6px" }}>
                      <h2 style={{ margin: 0, fontSize: "1.3rem", color: "#013220", fontWeight: 800 }}>
                        Muatan: {currentMission.muatan}
                      </h2>
                      {commodityCategory && (
                        <span
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            color: "#047857",
                            background: "#ecfdf5",
                            padding: "3px 10px",
                            borderRadius: "6px",
                            border: "1px solid #a7f3d0",
                          }}
                        >
                          {commodityCategory}
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "0.85rem",
                          fontWeight: 700,
                          color: "#15803d",
                          background: "#f0fdf4",
                          padding: "3px 10px",
                          borderRadius: "6px",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        {currentMission.armada_info || "Armada Mitra Terdaftar"}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: "#64748b", fontSize: "0.86rem", lineHeight: 1.45 }}>
                      {currentMission.catatan_lapangan || "Armada siap menjalankan distribusi logistik tepat sasaran ke titik posko/warga terdampak."}
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>

          <button
            type="button"
            className="reksa-btn"
            onClick={() => {
              setObstacleModalMisi(currentMission);
              setObstacleType("Akses Jalan Terputus (Longsor)");
              setObstacleNotes("");
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "9px 16px",
              borderRadius: "10px",
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#b91c1c",
              fontWeight: 700,
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <AppIcon name="alert" size={15} />
            <span>Laporkan Kendala Lapangan</span>
          </button>
        </div>

        {/* Structured Mission Metadata Box */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "14px 24px",
            padding: "14px 18px",
            background: "#f8fafc",
            borderRadius: "12px",
            border: "1px solid #f1f5f9",
            marginBottom: "22px",
            fontSize: "0.84rem",
          }}
        >
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <AppIcon name="truck" size={15} style={{ color: "#15803d" }} />
            <span style={{ color: "#64748b" }}>Armada:</span>
            <strong style={{ color: "#0f172a" }}>{currentMission.armada_info || "Armada Logistik"}</strong>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <AppIcon name="user" size={15} style={{ color: "#15803d" }} />
            <span style={{ color: "#64748b" }}>Petugas PIC:</span>
            <strong style={{ color: "#0f172a" }}>{currentMission.responder_name || userName}</strong>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <AppIcon name="users" size={15} style={{ color: "#15803d" }} />
            <span style={{ color: "#64748b" }}>Satgas / Mitra:</span>
            <strong style={{ color: "#0f172a" }}>{currentMission.organisasi || userOrg}</strong>
          </div>

          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
            <AppIcon name="pin" size={15} style={{ color: "#15803d" }} />
            <span style={{ color: "#64748b" }}>Tujuan Distribusi:</span>
            <strong style={{ color: "#0f172a" }}>
              {currentMission.kebutuhan ? `${currentMission.kebutuhan.citizen_name || 'Keluarga Penerima'} (${currentMission.kebutuhan.desa || 'Desa Terdampak'}, Kec. ${currentMission.kebutuhan.kecamatan || 'Sidoarjo'})` : 'Titik Lokasi Warga Bencana'}
            </strong>
          </div>
        </div>

        {/* Obstacle Alert Banner if active */}
        {currentMission.status_kendala && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: "12px",
              padding: "14px 18px",
              marginBottom: "22px",
              display: "flex",
              alignItems: "flex-start",
              gap: "12px",
              color: "#991b1b",
              fontSize: "0.88rem",
            }}
          >
            <div style={{ marginTop: "2px", flexShrink: 0 }}>
              <AppIcon name="alert" size={18} />
            </div>
            <div>
              <strong style={{ display: "block", color: "#991b1b" }}>
                KENDALA TERLAPOR: [{currentMission.status_kendala}]
              </strong>
              <p style={{ margin: "4px 0 0", color: "#7f1d1d", fontSize: "0.84rem" }}>
                {currentMission.catatan_lapangan}
              </p>
            </div>
          </div>
        )}

        {/* REAL-TIME GIS FLEET TRACKING MAP & TELEMETRY */}
        <div style={{ marginBottom: "26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <AppIcon name="map" size={16} style={{ color: "#013220" }} />
              <label style={{ fontSize: "0.82rem", fontWeight: 800, color: "#013220", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Peta Pelacakan Real-Time Armada Logistik
              </label>
            </div>
            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
              Memantau pergerakan armada secara langsung dari Posko BPBD ke lokasi warga
            </span>
          </div>

          <MissionLiveTrackingMap
            mission={currentMission}
            height="420px"
            onReportObstacle={() => {
              setObstacleModalMisi(currentMission);
              setObstacleType("Akses Jalan Terputus (Longsor)");
              setObstacleNotes("");
            }}
          />
        </div>

        {/* 5-STAGE PROGRESSION TRACKER */}
        <div style={{ marginBottom: "26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#80866e", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Tahapan Status Operasional Armada (5 Tahap):
            </label>
            <span style={{ fontSize: "0.76rem", color: "#64748b", fontWeight: 600 }}>
              Tahap {currentIdx + 1} dari 5 Selesai
            </span>
          </div>

          <div className="stage-tracker-grid">
            {states.map((s, i) => {
              const isDone = i <= currentIdx;
              const isCurrent = i === currentIdx;

              return (
                <div
                  key={s.title}
                  className={`stage-tracker-card ${isCurrent ? "current" : isDone ? "done" : ""}`}
                  style={{
                    background: isCurrent ? "#f0fdf4" : isDone ? "#f8fafc" : "#ffffff",
                    border: isCurrent
                      ? "2px solid #013220"
                      : isDone
                      ? "1px solid #86efac"
                      : "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "14px 12px",
                    textAlign: "center",
                    transition: "all 0.15s ease",
                    boxShadow: isCurrent ? "0 2px 8px rgba(1, 50, 32, 0.08)" : "none",
                  }}
                >
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: isDone ? "#013220" : "#e2e8f0",
                      color: isDone ? "#ffffff" : "#64748b",
                      fontSize: "12px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 8px",
                      fontWeight: 700,
                    }}
                  >
                    {isDone ? <AppIcon name="check" size={14} /> : i + 1}
                  </div>
                  <strong style={{ display: "block", fontSize: "0.82rem", color: isCurrent ? "#013220" : "#334155", lineHeight: 1.3, marginBottom: "3px" }}>
                    {s.title}
                  </strong>
                  <span style={{ display: "block", fontSize: "0.72rem", color: "#64748b", lineHeight: 1.2 }}>
                    {s.desc}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTION CONTROLS FOOTER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            paddingTop: "20px",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          <div style={{ fontSize: "0.86rem", color: "#64748b", maxWidth: "560px" }}>
            {currentIdx < 3 ? (
              <span>Klik tombol aksi begitu armada siap bergerak atau telah menyelesaikan tahapan saat ini.</span>
            ) : currentIdx === 3 ? (
              <span style={{ color: "#b45309", fontWeight: 600 }}>
                Logistik telah diserahkan di lokasi. Siap beralih ke konfirmasi penerimaan fisik terukur.
              </span>
            ) : (
              <span style={{ color: "#15803d", fontWeight: 600 }}>
                Logistik telah tiba dan siap dituntaskan dengan penandatanganan serah terima.
              </span>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {currentIdx < 4 && (
              <button
                type="button"
                className="reksa-btn reksa-btn-primary"
                disabled={isUpdating}
                onClick={() => handleAdvanceStep(currentMission)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#013220",
                  color: "#ffffff",
                  fontWeight: 700,
                  padding: "10px 22px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  opacity: isUpdating ? 0.7 : 1,
                  boxShadow: "0 2px 8px rgba(1, 50, 32, 0.15)",
                }}
              >
                <span>
                  {isUpdating
                    ? "Menyimpan..."
                    : currentIdx === 0
                    ? "Armada Siap Berangkat"
                    : currentIdx === 1
                    ? "Mulai Perjalanan Menuju Lokasi"
                    : currentIdx === 2
                    ? "Tiba di Lokasi & Serahkan Bantuan"
                    : "Ajukan Menunggu Konfirmasi"}
                </span>
                <AppIcon name="arrow-right" size={14} />
              </button>
            )}

            {(currentIdx === 3 || currentIdx === 4) && (
              <button
                type="button"
                className="reksa-btn reksa-btn-success"
                disabled={isUpdating}
                onClick={() => handleConfirmFinalReceipt(currentMission)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#15803d",
                  color: "#ffffff",
                  fontWeight: 700,
                  padding: "10px 22px",
                  borderRadius: "10px",
                  border: "none",
                  cursor: isUpdating ? "not-allowed" : "pointer",
                  opacity: isUpdating ? 0.7 : 1,
                  boxShadow: "0 2px 8px rgba(21, 128, 61, 0.2)",
                }}
              >
                <AppIcon name="check" size={15} />
                <span>{isUpdating ? "Memproses..." : "Konfirmasi Serah Terima Selesai Tuntas"}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* OBSTACLE MODAL */}
      {obstacleModalMisi && (
        <div className="modal-backdrop" onClick={() => setObstacleModalMisi(null)}>
          <div
            className="modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(560px, 95%)",
              textAlign: "left",
              borderRadius: "20px",
              padding: "28px 32px",
              background: "#ffffff",
              boxShadow: "0 24px 60px rgba(0, 0, 0, 0.28)",
              position: "relative",
              border: "1px solid rgba(185, 28, 28, 0.15)",
            }}
          >
            {/* CLOSE BUTTON IN TOP RIGHT CORNER */}
            <button
              type="button"
              onClick={() => setObstacleModalMisi(null)}
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

            {/* HEADER */}
            <div style={{ marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px", paddingRight: "46px" }}>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#b91c1c", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                LAPORAN SITUASI DARURAT LAPANGAN
              </span>
              <h2 style={{ fontSize: "1.3rem", color: "#b91c1c", margin: 0, fontWeight: 800 }}>
                Kendala Lapangan: {obstacleModalMisi.kode_misi}
              </h2>
            </div>

            <p style={{ color: "#64748b", fontSize: "0.86rem", marginBottom: "18px", lineHeight: 1.4 }}>
              Posko Koordinator BPBD akan segera menerima laporan ini untuk melakukan koordinasi penyesuaian rute atau pengiriman bantuan darurat.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Kategori Kendala:
                </label>
                <select
                  value={obstacleType}
                  onChange={(e) => setObstacleType(e.target.value)}
                  className="reksa-input-field"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "0.88rem" }}
                >
                  <option value="Akses Jalan Terputus (Longsor)">Akses Jalan Terputus (Longsor / Jembatan Rusak)</option>
                  <option value="Kerusakan Armada / Kendaraan Mogok">Kerusakan Armada / Kendaraan Mogok / Pecah Ban</option>
                  <option value="Keterlambatan Akibat Cuaca Ekstrem">Keterlambatan Akibat Cuaca Ekstrem / Hujan Badai</option>
                  <option value="Perubahan Volume di Titik Kumpul">Perubahan Volume / Kondisi Logistik di Titik Kumpul</option>
                  <option value="Kendala Keamanan atau Jalur Evakuasi">Kendala Keamanan atau Jalur Evakuasi</option>
                  <option value="Lainnya">Kendala Operasional Lainnya</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 700, color: "#1e293b", marginBottom: "6px" }}>
                  Rincian &amp; Tindakan Mitigasi Lapangan:
                </label>
                <textarea
                  rows={4}
                  value={obstacleNotes}
                  onChange={(e) => setObstacleNotes(e.target.value)}
                  placeholder="Contoh: Jalur utama tertutup longsor, armada memutar via rute alternatif. Estimasi waktu kedatangan tertunda 40 menit."
                  className="reksa-textarea-field"
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "10px", fontSize: "0.88rem", resize: "vertical" }}
                />
              </div>
            </div>

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
                disabled={isUpdating}
                onClick={() => setObstacleModalMisi(null)}
                style={{ padding: "8px 18px", borderRadius: "8px", fontWeight: 600 }}
              >
                Batal
              </button>
              <button
                type="button"
                className="reksa-btn reksa-btn-danger"
                disabled={isUpdating || !obstacleNotes.trim()}
                onClick={handleReportObstacle}
                style={{
                  background: "#b91c1c",
                  color: "#ffffff",
                  padding: "8px 20px",
                  borderRadius: "8px",
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  cursor: isUpdating || !obstacleNotes.trim() ? "not-allowed" : "pointer",
                  opacity: isUpdating || !obstacleNotes.trim() ? 0.6 : 1,
                  border: "none",
                }}
              >
                <AppIcon name="alert" size={15} />
                <span>{isUpdating ? "Mengirimkan..." : "Kirim Laporan Kendala"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. ALL ACTIVE MISSIONS GRID OVERVIEW MODAL */}
      {isGridModalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => setIsGridModalOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(1, 50, 32, 0.45)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 9999,
            padding: "20px",
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#ffffff",
              borderRadius: "18px",
              maxWidth: "840px",
              width: "100%",
              maxHeight: "90vh",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 20px 48px rgba(0, 0, 0, 0.2)",
              overflow: "hidden",
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  OVERVIEW OPERASIONAL
                </span>
                <h3 style={{ margin: "2px 0 0", color: "#013220", fontSize: "1.25rem", fontWeight: 800 }}>
                  Daftar Semua Misi Armada Aktif ({activeMissions.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsGridModalOpen(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  display: "grid",
                  placeItems: "center",
                  color: "#64748b",
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Search Bar */}
            <div style={{ padding: "14px 24px", background: "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ketik kode misi, armada, muatan barang, penerima, atau desa tujuan..."
                  style={{
                    width: "100%",
                    padding: "10px 14px 10px 36px",
                    borderRadius: "10px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    boxSizing: "border-box",
                    outline: "none",
                    background: "#ffffff",
                  }}
                />
                <div style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>
                  <AppIcon name="search" size={16} />
                </div>
              </div>
            </div>

            {/* Modal Body: Cards Grid */}
            <div
              style={{
                padding: "20px 24px",
                overflowY: "auto",
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                gap: "14px",
              }}
            >
              {selectorFilteredMissions.length === 0 ? (
                <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 12px", color: "#64748b" }}>
                  Tidak ada misi yang cocok dengan pencarian "{searchQuery}".
                </div>
              ) : (
                selectorFilteredMissions.map((m) => {
                  const isSelected = m.id === currentMission.id;
                  const mIdx = getStepIndex(m.status_tahapan || "");

                  return (
                    <div
                      key={m.id}
                      onClick={() => {
                        setSelectedMisiId(m.id);
                        setIsGridModalOpen(false);
                      }}
                      style={{
                        padding: "16px 18px",
                        borderRadius: "14px",
                        border: isSelected ? "2px solid #013220" : "1px solid #e2e8f0",
                        background: isSelected ? "#f0fdf4" : "#ffffff",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        display: "flex",
                        flexDirection: "column",
                        gap: "10px",
                        position: "relative",
                        boxShadow: isSelected ? "0 4px 14px rgba(1, 50, 32, 0.08)" : "0 2px 6px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                        <div>
                          <strong style={{ fontSize: "1rem", color: "#013220", fontFamily: "monospace" }}>
                            {m.kode_misi}
                          </strong>
                          <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: "2px" }}>
                            {m.armada_info || "Armada Logistik"}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: "0.72rem",
                            fontWeight: 700,
                            padding: "3px 8px",
                            borderRadius: "6px",
                            background: isSelected ? "#dcfce7" : "#f1f5f9",
                            color: "#166534",
                          }}
                        >
                          Tahap {mIdx + 1}/5
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#15803d", background: "#f0fdf4", padding: "3px 8px", borderRadius: "6px", border: "1px solid #bbf7d0" }}>
                          📦 {m.muatan}
                        </span>
                        {m.status_kendala && (
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "#fee2e2", color: "#991b1b", padding: "3px 8px", borderRadius: "6px" }}>
                            ⚠️ Ada Kendala
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: "0.8rem", color: "#475569", borderTop: "1px solid #f1f5f9", paddingTop: "8px" }}>
                        📍 Tujuan: <strong>{m.kebutuhan?.desa ? `Desa ${m.kebutuhan.desa}, Kec. ${m.kebutuhan.kecamatan || 'Sidoarjo'}` : 'Titik Penyaluran Warga'}</strong>
                        {m.kebutuhan?.citizen_name && (
                          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                            Penerima: {m.kebutuhan.citizen_name}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                        <span
                          style={{
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            color: isSelected ? "#013220" : "#166534",
                          }}
                        >
                          {isSelected ? "✓ Sedang Ditampilkan di Konsol" : "Pilih Misi Ini →"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "14px 24px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => setIsGridModalOpen(false)}
                style={{
                  background: "#013220",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 18px",
                  fontSize: "0.84rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Tutup
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
