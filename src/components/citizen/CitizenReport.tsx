import { useState, useEffect } from "react";
import {
  SharedState,
  RouterProps,
  CaseRecord,
  PageHead,
  Icon,
  Button,
  MapView,
} from "../../App";
import { apiService } from "../../services/api";

interface CitizenReportProps {
  complete: () => void;
  update: RouterProps["update"];
  state?: SharedState;
}

const POSKO_DATABASE: Record<string, string[]> = {
  "Jawa Timur": [
    "Posko BPBD Provinsi Jawa Timur (Komando Wilayah)",
    "Posko BPBD Kabupaten Sidoarjo (Posko Induk)",
    "Posko BPBD Kota Surabaya (Posko Induk)",
    "Posko Darurat BPBD Kabupaten Gresik",
    "Posko Siaga Bencana BPBD Kabupaten Malang",
    "Posko Tanggap Darurat BPBD Kabupaten Pasuruan",
    "Posko Penanggulangan Bencana BPBD Kab. Mojokerto",
  ],
  "Jawa Barat": [
    "Posko BPBD Provinsi Jawa Barat (Pusdalops PB)",
    "Posko BPBD Kabupaten Sukabumi (Posko Induk)",
    "Posko Induk 01 - Balai Desa Sukamaju (BPBD Wilayah)",
    "Posko Darurat Kecamatan Cibadak (BPBD Sukabumi)",
    "Posko Siaga Bencana BPBD Kota Bandung",
    "Posko Tanggap Darurat BPBD Kabupaten Bogor",
    "Posko Penanggulangan Bencana BPBD Kab. Cianjur",
  ],
  "DKI Jakarta": [
    "Posko Induk BPBD DKI Jakarta",
    "Posko Penanggulangan Bencana BPBD Jakarta Pusat",
    "Posko Siaga Banjir BPBD Jakarta Timur",
    "Posko Siaga Bencana BPBD Jakarta Selatan",
    "Posko Darurat BPBD Jakarta Barat",
    "Posko Pesisir & Bencana Laut BPBD Jakarta Utara",
  ],
  "Jawa Tengah": [
    "Posko BPBD Provinsi Jawa Tengah (Pusdalops)",
    "Posko BPBD Kota Semarang (Posko Induk)",
    "Posko Darurat Bencana BPBD Kabupaten Magelang",
    "Posko Siaga Erupsi BPBD Kabupaten Boyolali",
    "Posko Tanggap Darurat BPBD Kabupaten Banyumas",
  ],
  "DI Yogyakarta": [
    "Posko Induk TRC BPBD DI Yogyakarta",
    "Posko Siaga Merapi BPBD Kabupaten Sleman",
    "Posko Darurat BPBD Kabupaten Bantul",
    "Posko Penanggulangan Bencana BPBD Kota Yogyakarta",
    "Posko Siaga Bencana BPBD Kab. Gunungkidul",
  ],
  "Banten": [
    "Posko BPBD Provinsi Banten (Pusdalops)",
    "Posko Darurat BPBD Kabupaten Lebak",
    "Posko Tanggap Bencana BPBD Kabupaten Pandeglang",
    "Posko Siaga BPBD Kota Tangerang",
    "Posko Penanggulangan Bencana BPBD Kab. Serang",
  ],
  "Bali": [
    "Posko BPBD Provinsi Bali (Pusdalops Denpasar)",
    "Posko Siaga Bencana BPBD Kabupaten Karangasem",
    "Posko Darurat BPBD Kabupaten Badung",
    "Posko Penanggulangan Bencana BPBD Kab. Buleleng",
  ],
  "Sumatera Utara": [
    "Posko BPBD Provinsi Sumatera Utara",
    "Posko Induk BPBD Kota Medan",
    "Posko Darurat Bencana BPBD Kabupaten Karo",
    "Posko Siaga Bencana BPBD Kabupaten Deli Serdang",
  ],
  "Sulawesi Selatan": [
    "Posko BPBD Provinsi Sulawesi Selatan",
    "Posko Induk BPBD Kota Makassar",
    "Posko Tanggap Darurat BPBD Kabupaten Luwu",
    "Posko Siaga Bencana BPBD Kabupaten Gowa",
  ],
  "Kalimantan Timur": [
    "Posko BPBD Provinsi Kalimantan Timur",
    "Posko Induk BPBD Kota Samarinda",
    "Posko Siaga Bencana BPBD Kota Balikpapan",
    "Posko Darurat BPBD Kabupaten Kutai Kartanegara",
  ],
};

const getInitialDraft = () => {
  try {
    const raw = localStorage.getItem("reksa_report_draft");
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}
  return null;
};

export function CitizenReport({ complete, update, state }: CitizenReportProps) {
  const initialDraft = getInitialDraft();

  const [step, setStep] = useState<number>(() => initialDraft?.step || 1);
  const [success, setSuccess] = useState(false);
  const [submittedCaseId, setSubmittedCaseId] = useState("");
  
  // Step 1: Kebutuhan
  const [category, setCategory] = useState<string>(() => initialDraft?.category || "");
  const [customCategory, setCustomCategory] = useState<string>(() => initialDraft?.customCategory || "");
  const [amount, setAmount] = useState<string>(() => initialDraft?.amount || "");
  const [customUnit, setCustomUnit] = useState<string>(() => initialDraft?.customUnit || "");
  const [notes, setNotes] = useState<string>(() => initialDraft?.notes || "");

  // Step 2: Lokasi & Posko BPBD (Sinkron dengan Profil Akun & Titik Peta Interaktif)
  const [applicantNik, setApplicantNik] = useState<string>(() => initialDraft?.applicantNik || "");
  const [poskoTarget, setPoskoTarget] = useState<string>(() => initialDraft?.poskoTarget || "");
  const [shelterStatus, setShelterStatus] = useState<string>(() => initialDraft?.shelterStatus || "");
  const [province, setProvince] = useState<string>(() => initialDraft?.province || "");
  const [regency, setRegency] = useState<string>(() => initialDraft?.regency || "");
  const [district, setDistrict] = useState<string>(() => initialDraft?.district || "");
  const [village, setVillage] = useState<string>(() => initialDraft?.village || "");
  const [pickedLat, setPickedLat] = useState<number>(() => (typeof initialDraft?.pickedLat === "number" ? initialDraft.pickedLat : -7.2654));
  const [pickedLng, setPickedLng] = useState<number>(() => (typeof initialDraft?.pickedLng === "number" ? initialDraft.pickedLng : 112.7521));


  // Step 3: Kondisi Terdampak
  const [affectedPeople, setAffectedPeople] = useState<number | "">(() => initialDraft?.affectedPeople ?? "");
  const [familyCount, setFamilyCount] = useState<number | "">(() => initialDraft?.familyCount ?? "");
  const [vulnerableList, setVulnerableList] = useState<string[]>(() => Array.isArray(initialDraft?.vulnerableList) ? initialDraft.vulnerableList : []);
  const [availabilityCondition, setAvailabilityCondition] = useState<string>(() => initialDraft?.availabilityCondition || "");
  const [citizenUrgency, setCitizenUrgency] = useState<string>(() => initialDraft?.citizenUrgency || "");
  const [conditionDescription, setConditionDescription] = useState<string>(() => initialDraft?.conditionDescription || "");

  // Step 4: Bukti Unggahan
  const [fileName, setFileName] = useState<string>(() => initialDraft?.fileName || "");
  const [fotoBukti, setFotoBukti] = useState<string | undefined>(() => initialDraft?.fotoBukti || undefined);

  // Auto-save form draft whenever any field changes
  useEffect(() => {
    if (success) return;

    const hasAnyContent = Boolean(
      category || customCategory || amount || customUnit || notes ||
      applicantNik || poskoTarget || shelterStatus || province || regency || district || village ||
      affectedPeople !== "" || familyCount !== "" || vulnerableList.length > 0 ||
      availabilityCondition || citizenUrgency || conditionDescription || fileName || fotoBukti
    );

    if (hasAnyContent) {
      const draft = {
        step,
        category,
        customCategory,
        amount,
        customUnit,
        notes,
        applicantNik,
        poskoTarget,
        shelterStatus,
        province,
        regency,
        district,
        village,
        pickedLat,
        pickedLng,
        affectedPeople,
        familyCount,
        vulnerableList,
        availabilityCondition,
        citizenUrgency,
        conditionDescription,
        fileName,
        fotoBukti,
      };
      localStorage.setItem("reksa_report_draft", JSON.stringify(draft));
    } else {
      localStorage.removeItem("reksa_report_draft");
    }
  }, [
    step,
    category,
    customCategory,
    amount,
    customUnit,
    notes,
    applicantNik,
    poskoTarget,
    shelterStatus,
    province,
    regency,
    district,
    village,
    pickedLat,
    pickedLng,
    affectedPeople,
    familyCount,
    vulnerableList,
    availabilityCondition,
    citizenUrgency,
    conditionDescription,
    fileName,
    fotoBukti,
    success,
  ]);

  const resetForm = () => {
    localStorage.removeItem("reksa_report_draft");
    setCategory("");
    setCustomCategory("");
    setAmount("");
    setCustomUnit("");
    setNotes("");
    setApplicantNik("");
    setPoskoTarget("");
    setShelterStatus("");
    setProvince("");
    setRegency("");
    setDistrict("");
    setVillage("");
    setAffectedPeople("");
    setFamilyCount("");
    setVulnerableList([]);
    setAvailabilityCondition("");
    setCitizenUrgency("");
    setConditionDescription("");
    setFileName("");
    setFotoBukti(undefined);
    setStep(1);
    setSuccess(false);
    setSubmittedCaseId("");
  };

  const handleToggleVulnerable = (item: string) => {
    if (item === "Tidak ada") {
      if (vulnerableList.includes("Tidak ada")) {
        setVulnerableList([]);
      } else {
        setVulnerableList(["Tidak ada"]);
      }
    } else {
      let next = vulnerableList.filter((x) => x !== "Tidak ada");
      if (next.includes(item)) {
        next = next.filter((x) => x !== item);
      } else {
        next.push(item);
      }
      setVulnerableList(next);
    }
  };


  // Satuan Menyesuaikan Kategori Kebutuhan
  const getUnit = () => {
    if (!category) return "Pilih kategori";
    if (category === "Air Bersih") return "Liter (L)";
    if (category === "Pangan") return "Porsi / Paket";
    if (category === "Kesehatan") return "Paket / Unit";
    if (category === "Hunian & Tempat Tinggal") return "Unit / Paket";
    if (category === "Sanitasi & Kebersihan") return "Paket / Unit";
    if (category === "Penerangan & Energi") return "Unit / Paket";
    if (category === "Sandang & Kebutuhan Dasar") return "Paket / Unit";
    return customUnit || "Unit / Paket";
  };

  // Posko BPBD Dinamis Menyesuaikan Provinsi & Kabupaten yang Dipilih
  const getAvailablePoskos = () => {
    let list: string[] = [];

    if (province && POSKO_DATABASE[province]) {
      list = [...POSKO_DATABASE[province]];
    } else if (!province) {
      list = Object.values(POSKO_DATABASE).map((arr) => arr[0]);
    } else {
      list = [
        `Posko BPBD Provinsi ${province} (Komando Wilayah)`,
        `Posko Penanggulangan Bencana BPBD ${province}`,
      ];
    }

    if (regency.trim()) {
      const cleanName = regency.trim().replace(/^(Kota|Kabupaten|Kab\.|Kota\s+Adm\.)\s+/i, "");
      const matchIdx = list.findIndex((p) => p.toLowerCase().includes(cleanName.toLowerCase()));
      if (matchIdx > 0) {
        const matched = list.splice(matchIdx, 1)[0];
        list.unshift(matched);
      } else if (matchIdx === -1 && cleanName.length >= 2) {
        const prefix = regency.trim().toLowerCase().startsWith("kota") ? "Kota" : "Kabupaten";
        const customPosko = `Posko BPBD ${prefix} ${cleanName} (Posko Induk)`;
        list.unshift(customPosko);
      }
    }

    if (poskoTarget && !list.includes(poskoTarget)) {
      list.unshift(poskoTarget);
    }

    return list;
  };

  const categories = [
    "Air Bersih",
    "Pangan",
    "Kesehatan",
    "Hunian & Tempat Tinggal",
    "Sanitasi & Kebersihan",
    "Penerangan & Energi",
    "Sandang & Kebutuhan Dasar",
    "Lainnya",
  ];

  const getCategoryIcon = (cat: string) => {
    if (cat === "Air Bersih") return "pin";
    if (cat === "Pangan") return "box";
    if (cat === "Kesehatan") return "file";
    if (cat === "Hunian & Tempat Tinggal") return "map";
    if (cat === "Sanitasi & Kebersihan") return "check";
    if (cat === "Penerangan & Energi") return "settings";
    if (cat === "Sandang & Kebutuhan Dasar") return "box";
    return "plus";
  };

  const getAvailabilityConfig = (cat: string) => {
    if (cat === "Air Bersih") {
      return {
        label: "Bagaimana akses air saat ini?",
        options: ["Masih tersedia", "Terbatas", "Tidak tersedia"],
      };
    }
    if (cat === "Pangan") {
      return {
        label: "Bagaimana ketersediaan makanan?",
        options: ["Cukup", "Terbatas", "Tidak tersedia"],
      };
    }
    if (cat === "Hunian & Tempat Tinggal") {
      return {
        label: "Bagaimana kondisi tempat tinggal?",
        options: ["Dapat ditempati", "Rusak sebagian", "Tidak dapat ditempati"],
      };
    }
    if (cat === "Kesehatan") {
      return {
        label: "Bagaimana ketersediaan layanan & fasilitas kesehatan?",
        options: ["Masih memadai", "Terbatas", "Tidak tersedia"],
      };
    }
    if (cat === "Sanitasi & Kebersihan") {
      return {
        label: "Bagaimana kondisi fasilitas sanitasi & kebersihan?",
        options: ["Masih berfungsi", "Terbatas", "Tidak dapat digunakan"],
      };
    }
    if (cat === "Penerangan & Energi") {
      return {
        label: "Bagaimana pasokan listrik & penerangan?",
        options: ["Normal", "Terputus berkala", "Padam total"],
      };
    }
    if (cat === "Sandang & Kebutuhan Dasar") {
      return {
        label: "Bagaimana ketersediaan sandang & kebutuhan dasar?",
        options: ["Masih mencukupi", "Terbatas", "Habis / Sangat mendesak"],
      };
    }
    return {
      label: "Bagaimana ketersediaan kebutuhan saat ini?",
      options: ["Masih tersedia", "Terbatas", "Tidak tersedia"],
    };
  };

  const titles = ["Kebutuhan", "Lokasi & Posko", "Kondisi", "Bukti", "Review"];
  const stepHeadlines = [
    "Apa kebutuhan utama yang sedang Anda alami?",
    "Tentukan Posko Wilayah & Titik Lokasi",
    "Bagaimana kondisi yang Anda alami?",
    "Unggah dokumen atau foto pendukung",
    "Periksa Laporan Anda",
  ];
  const stepDescriptions = [
    "Pilih kebutuhan yang paling mendesak setelah bencana dan tentukan perkiraan jumlah yang dibutuhkan.",
    "Tentukan titik administratif tempat tinggal Anda. Laporan akan otomatis diteruskan ke Posko BPBD yang menaungi wilayah Anda.",
    "Informasi ini membantu REKSA memahami tingkat kebutuhan dan menentukan penanganan yang sesuai.",
    "Lampirkan bukti foto lapangan atau surat pengantar RT/RW sebagai data pendukung kebutuhan Anda.",
    "Pastikan informasi kebutuhan, lokasi, kondisi, dan bukti sudah sesuai sebelum laporan dikirim.",
  ];

  const stepShades = [
    { bg: "#d8eada", text: "#013220", numBg: "#c2ddc6", sub: "Jenis & Jumlah" },
    { bg: "#b2d7bb", text: "#013220", numBg: "#96c6a1", sub: "Posko & Wilayah" },
    { bg: "#6fa880", text: "#ffffff", numBg: "#548e66", sub: "Kondisi Terdampak" },
    { bg: "#2e774f", text: "#ffffff", numBg: "#1c5a39", sub: "Foto / Dokumen" },
    { bg: "#013220", text: "#ffffff", numBg: "#0a4530", sub: "Periksa Laporan" },
  ];

  if (success) {
    return (
      <main className="workspace report-workspace">
        <div className="report-success-card">
          <div className="report-success-icon-wrap">
            <div className="report-success-icon"><Icon name="check" /></div>
          </div>
          <span className="eyebrow">Laporan Berhasil Diterbitkan</span>
          <h1>Laporan Diterima {(poskoTarget || "").split(" - ")[0] || "Posko BPBD Wilayah"}</h1>
          <p>
            Data kebutuhan Anda telah tercatat resmi di <strong>{poskoTarget}</strong>. Petugas Posko BPBD akan memvalidasi data dan mempublikasikan kebutuhan terbuka ke seluruh Mitra &amp; Instansi penyalur.
          </p>
          <div className="report-success-code-box">
            <span className="code-box-label">KODE PELACAKAN KASUS</span>
            <div className="code-box-val">{submittedCaseId}</div>
            <small className="code-box-sub">Tercatat di {poskoTarget}</small>
          </div>
          <div className="report-success-actions">
            <Button onClick={complete} className="btn-success-primary">
              Buka Laporan Saya <Icon name="next" />
            </Button>
            <Button 
              variant="secondary" 
              onClick={resetForm} 
              className="btn-success-close"
            >
              Tutup &amp; Buat Laporan Baru
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="workspace report-workspace">
      <PageHead 
        eyebrow={`Langkah ${step} dari 5`} 
        title="Laporkan Kebutuhan Darurat" 
        copy="Sampaikan kondisi dan kebutuhan lapangan secara akurat untuk integrasi posko wilayah BPBD dan mitra responder." 
        action={
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            {Boolean(category || amount || notes || applicantNik || village || affectedPeople !== "") && (
              <div className="trust-badge" style={{ background: "#eef6f0", color: "#1c5a39", border: "1px solid #c2ddc6" }}>
                <Icon name="check" /> Draf Tersimpan
              </div>
            )}
            {poskoTarget && (
              <div className="trust-badge">
                <Icon name="check" /> Terhubung ke {(poskoTarget || "").split(" - ")[0] || "Posko BPBD Wilayah"}
              </div>
            )}
          </div>
        }
      />

      {/* TOP TRAPEZOID / CHEVRON STEPPER BAR */}
      <div className="report-stepper-container">
        <div className="report-stepper-bar">
          {titles.map((x, i) => {
            const isDone = step > i + 1;
            const isActive = step === i + 1;
            const shade = stepShades[i];
            return (
              <button
                key={x}
                type="button"
                className={`step-trapezoid ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
                style={{
                  background: isDone || isActive ? shade.bg : "#e8ede7",
                  color: isDone || isActive ? shade.text : "#758378",
                }}
                onClick={() => i + 1 <= step && setStep(i + 1)}
              >
                <span 
                  className="step-trapezoid-num"
                  style={{ 
                    background: isDone || isActive ? shade.numBg : "#d4ded3", 
                    color: isDone || isActive ? shade.text : "#758378" 
                  }}
                >
                  {isDone ? <Icon name="check" /> : i + 1}
                </span>
                <div className="step-trapezoid-text">
                  <b>{x}</b>
                  <small>{shade.sub}</small>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-COLUMN FORM + GUIDANCE LAYOUT */}
      <div className="report-content-grid">
        {/* LEFT MAIN FORM PANEL */}
        <div className="report-form-card">
          <div className="report-form-header">
            <span className="eyebrow">0{step} — {titles[step - 1]}</span>
            <h2>{stepHeadlines[step - 1]}</h2>
            <p>{stepDescriptions[step - 1]}</p>
          </div>

          <div className="report-form-body">
            {/* STEP 1: KEBUTUHAN */}
            {step === 1 && (
              <div className="form-fields-group">
                <div className="form-group">
                  <label className="form-label">Kategori Kebutuhan</label>
                  <div className="category-pills-row" style={{ flexWrap: "wrap", gap: "8px" }}>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`cat-pill-btn ${category === cat ? "active" : ""}`}
                        onClick={() => {
                          setCategory(cat);
                          const cfg = getAvailabilityConfig(cat);
                          setAvailabilityCondition(cfg.options[cfg.options.length - 1]);
                        }}
                      >
                        <Icon name={getCategoryIcon(cat)} />
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {category === "Lainnya" && (
                  <div className="form-row-two" style={{ marginTop: "10px" }}>
                    <div className="form-group">
                      <label className="form-label">Tulis Nama Kategori Kebutuhan</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={customCategory} 
                        onChange={(e) => setCustomCategory(e.target.value)} 
                        placeholder="Contoh: Susu Bayi, Selimut Balita, dll."
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Tulis Satuan Kebutuhan</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        value={customUnit} 
                        onChange={(e) => setCustomUnit(e.target.value)} 
                        placeholder="Contoh: Kotak, Dus, Pcs"
                      />
                    </div>
                  </div>
                )}

                <div className="form-row-two">
                  <div className="form-group">
                    <label className="form-label">Perkiraan Jumlah Kebutuhan</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={amount} 
                      onChange={(e) => setAmount(e.target.value)} 
                      placeholder="Contoh: 1000, 250, 50" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Satuan Kebutuhan (Otomatis)</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={getUnit()} 
                      disabled
                      style={{ background: "#f5f4ef", fontWeight: 600, color: "#013220" }}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Jelaskan Kebutuhan</label>
                  <textarea 
                    className="form-control textarea" 
                    rows={4}
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Jelaskan kebutuhan dan kondisi yang membuat kebutuhan ini diperlukan."
                  />
                  <small style={{ color: "#758378", marginTop: "6px", display: "block", fontSize: "0.82rem" }}>
                    Contoh: Sumber air warga tercemar dan tidak dapat digunakan sejak kejadian bencana.
                  </small>
                </div>
              </div>
            )}

            {/* STEP 2: LOKASI, NIK, STATUS DOMISILI & POSKO BPBD */}
            {step === 2 && (
              <div className="form-fields-group">
                <div className="form-row-two">
                  <div className="form-group">
                    <label className="form-label">NIK Pemohon / ID Warga</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={applicantNik} 
                      onChange={(e) => setApplicantNik(e.target.value)} 
                      placeholder="Contoh: 3202110482910002 (16 digit)"
                      maxLength={16}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status Domisili / Lokasi Warga</label>
                    <select 
                      className="form-control select" 
                      value={shelterStatus} 
                      onChange={(e) => setShelterStatus(e.target.value)}
                    >
                      <option value="">-- Pilih Status Domisili / Lokasi --</option>
                      <option value="Rumah Tinggal Pribadi (Terdampak Langsung)">Rumah Tinggal Pribadi (Terdampak Langsung)</option>
                      <option value="Posko Pengungsian Komunal">Posko Pengungsian Komunal</option>
                      <option value="Menumpang di Kerabat / Tetangga">Menumpang di Kerabat / Tetangga</option>
                      <option value="Fasilitas Umum / Tempat Ibadah">Fasilitas Umum / Tempat Ibadah</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label className="form-label">Provinsi</label>
                    <select 
                      className="form-control select" 
                      value={province} 
                      onChange={(e) => {
                        const newProv = e.target.value;
                        setProvince(newProv);
                        if (newProv && POSKO_DATABASE[newProv]) {
                          setPoskoTarget(POSKO_DATABASE[newProv][0]);
                        } else if (!newProv) {
                          setPoskoTarget("");
                        }
                      }}
                    >
                      <option value="">-- Pilih Provinsi --</option>
                      {[
                        "Jawa Timur", "Jawa Barat", "Jawa Tengah", "DKI Jakarta", "Banten", 
                        "DI Yogyakarta", "Bali", "Sumatera Utara", "Sulawesi Selatan", "Kalimantan Timur"
                      ].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Kabupaten / Kota</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={regency} 
                      onChange={(e) => {
                        const newReg = e.target.value;
                        setRegency(newReg);
                        if (province && POSKO_DATABASE[province] && newReg.trim().length >= 3) {
                          const clean = newReg.trim().toLowerCase().replace(/^(kota|kabupaten|kab\.)\s+/i, "");
                          const matched = POSKO_DATABASE[province].find((p) => p.toLowerCase().includes(clean));
                          if (matched) {
                            setPoskoTarget(matched);
                          }
                        }
                      }} 
                      placeholder="Contoh: Kabupaten Sidoarjo / Kota Surabaya / Kab. Sukabumi"
                    />
                  </div>
                </div>

                <div className="form-row-two">
                  <div className="form-group">
                    <label className="form-label">Kecamatan</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={district} 
                      onChange={(e) => setDistrict(e.target.value)} 
                      placeholder="Contoh: Gubeng / Cibadak"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Desa / Kelurahan</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={village} 
                      onChange={(e) => setVillage(e.target.value)} 
                      placeholder="Contoh: Gubeng / Desa Sukamaju"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "4px" }}>
                    <label className="form-label" style={{ margin: 0 }}>Posko BPBD Wilayah Rujukan</label>
                    {province && (
                      <span style={{ fontSize: "0.78rem", color: "#1c5a39", fontWeight: 600 }}>
                        📍 Menyesuaikan {province}
                      </span>
                    )}
                  </div>
                  <select 
                    className="form-control select" 
                    value={poskoTarget} 
                    onChange={(e) => setPoskoTarget(e.target.value)}
                  >
                    <option value="">{province ? `-- Pilih Posko BPBD di ${province} --` : "-- Pilih Posko BPBD Rujukan --"}</option>
                    {getAvailablePoskos().map((pos) => (
                      <option key={pos} value={pos}>{pos}</option>
                    ))}
                  </select>
                  <small style={{ color: "#6a7369", marginTop: "6px", display: "block", fontSize: "0.82rem" }}>
                    ℹ️ Laporan otomatis diteruskan dan dikoordinasikan oleh Posko BPBD yang menaungi wilayah administrasi Anda.
                  </small>
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <label className="form-label" style={{ margin: 0 }}>Titik Lokasi Warga pada Peta</label>
                      <small style={{ color: "#758378", display: "block", fontSize: "0.8rem" }}>
                        Titik Terpilih: <b>{(Number(pickedLat) || -7.2654).toFixed(5)}, {(Number(pickedLng) || 112.7521).toFixed(5)}</b> (Klik peta atau gunakan tombol GPS)
                      </small>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              if (pos?.coords) {
                                const lat = Number(pos.coords.latitude);
                                const lng = Number(pos.coords.longitude);
                                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                                  setPickedLat(Number(lat.toFixed(6)));
                                  setPickedLng(Number(lng.toFixed(6)));
                                }
                              }
                            },
                            () => alert("GPS tidak aktif atau izin lokasi browser belum diizinkan."),
                            { enableHighAccuracy: true, timeout: 8000 }
                          );
                        }
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#e8f3ea",
                        color: "#013220",
                        border: "1px solid #b2d7bb",
                        padding: "5px 12px",
                        borderRadius: "8px",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      <Icon name="pin" /> Gunakan Posisi Saya
                    </button>
                  </div>
                  <div className="report-map-wrapper">
                    <MapView 
                      hideCard 
                      pickLocation 
                      initialLat={Number.isFinite(Number(pickedLat)) ? Number(pickedLat) : -7.2654}
                      initialLng={Number.isFinite(Number(pickedLng)) ? Number(pickedLng) : 112.7521}
                      onLocationPicked={(info: any) => {
                        if (info?.desa) setVillage(info.desa);
                        if (info?.kecamatan) setDistrict(info.kecamatan);
                        if (info?.kabupaten) setRegency(info.kabupaten);
                        if (info?.provinsi) setProvince(info.provinsi);
                        if (info?.poskoName) setPoskoTarget(info.poskoName);
                        if (info?.lat != null && info?.lng != null && !isNaN(Number(info.lat)) && !isNaN(Number(info.lng))) {
                          setPickedLat(Number(info.lat));
                          setPickedLng(Number(info.lng));
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: KONDISI TERDAMPAK */}
            {step === 3 && (
              <div className="form-fields-group">
                {/* 1. JUMLAH ORANG TERDAMPAK & JUMLAH KK TERDAMPAK (INPUT MANUAL USER) */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px" }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Berapa orang yang terdampak? (Jiwa)</label>
                    <input 
                      type="number" 
                      min={1}
                      className="form-control" 
                      value={affectedPeople} 
                      onChange={(e) => setAffectedPeople(e.target.value ? Number(e.target.value) : "")} 
                      placeholder="Contoh: 21 jiwa"
                    />
                    <small style={{ color: "#758378", marginTop: "4px", display: "block", fontSize: "0.82rem" }}>
                      Total jiwa warga terdampak langsung di lokasi.
                    </small>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Berapa KK yang terdampak?</label>
                    <input 
                      type="number" 
                      min={1}
                      className="form-control" 
                      value={familyCount} 
                      onChange={(e) => setFamilyCount(e.target.value ? Number(e.target.value) : "")} 
                      placeholder="Contoh: 5 KK"
                    />
                    <small style={{ color: "#758378", marginTop: "4px", display: "block", fontSize: "0.82rem" }}>
                      Jumlah Kepala Keluarga (KK).
                    </small>
                  </div>
                </div>

                {/* 2. KELOMPOK RENTAN */}
                <div className="form-group">
                  <label className="form-label">Apakah ada kelompok rentan?</label>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", marginTop: "6px" }}>
                    {[
                      { id: "Balita", label: "👶 Balita" },
                      { id: "Anak-anak", label: "🧒 Anak-anak" },
                      { id: "Lansia", label: "👵 Lansia" },
                      { id: "Ibu hamil", label: "🤰 Ibu hamil" },
                      { id: "Penyandang disabilitas", label: "♿ Penyandang disabilitas" },
                      { id: "Tidak ada", label: "⚪ Tidak ada" },
                    ].map((v) => {
                      const isNoneSelected = vulnerableList.includes("Tidak ada");
                      const isChecked = vulnerableList.includes(v.id);
                      const isDisabled = isNoneSelected && v.id !== "Tidak ada";
                      return (
                        <label 
                          key={v.id} 
                          style={{ 
                            display: "flex", 
                            alignItems: "center", 
                            gap: "8px", 
                            fontSize: "0.88rem", 
                            background: isChecked ? "#e8ede7" : "#f5f4ef", 
                            padding: "10px 14px", 
                            borderRadius: "10px", 
                            cursor: isDisabled ? "not-allowed" : "pointer", 
                            border: isChecked ? "1.5px solid #013220" : "1px solid #e2ded4",
                            opacity: isDisabled ? 0.45 : 1,
                          }}
                        >
                          <input 
                            type="checkbox" 
                            disabled={isDisabled}
                            checked={isChecked} 
                            onChange={() => handleToggleVulnerable(v.id)} 
                            style={{ accentColor: "#013220", width: "16px", height: "16px" }} 
                          />
                          <span style={{ fontWeight: isChecked ? 600 : 400, color: isChecked ? "#013220" : "#2d3748" }}>
                            {v.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                  <small style={{ color: "#758378", marginTop: "6px", display: "block", fontSize: "0.82rem" }}>
                    Pilihan "Tidak ada" akan menonaktifkan kelompok rentan lainnya.
                  </small>
                </div>

                {/* 3. KONDISI KETERSEDIAAN (MENYESUAIKAN KATEGORI) */}
                {(() => {
                  const availCfg = getAvailabilityConfig(category);
                  return (
                    <div className="form-group">
                      <label className="form-label">{availCfg.label}</label>
                      <select 
                        className="form-control select" 
                        value={availabilityCondition} 
                        onChange={(e) => setAvailabilityCondition(e.target.value)}
                      >
                        <option value="">-- Pilih Kondisi Ketersediaan --</option>
                        {availCfg.options.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                  );
                })()}

                {/* 4. URGENSI MENURUT PELAPOR */}
                <div className="form-group">
                  <label className="form-label">Seberapa mendesak kebutuhan ini menurut Anda?</label>
                  <select 
                    className="form-control select" 
                    value={citizenUrgency} 
                    onChange={(e) => setCitizenUrgency(e.target.value)}
                  >
                    <option value="">-- Pilih Tingkat Urgensi --</option>
                    <option value="Bisa menunggu">Bisa menunggu</option>
                    <option value="Perlu segera">Perlu segera</option>
                    <option value="Sangat mendesak">Sangat mendesak</option>
                  </select>
                  <small style={{ color: "#758378", marginTop: "6px", display: "block", fontSize: "0.82rem" }}>
                    *Masukan estimasi langsung dari pelapor. Sistem REKSA akan menganalisis data ini dan divalidasi oleh Koordinator Tanggap Bencana Posko BPBD.
                  </small>
                </div>

                {/* 5. DESKRIPSI KONDISI */}
                <div className="form-group">
                  <label className="form-label">Jelaskan kondisi yang Anda alami</label>
                  <textarea 
                    className="form-control textarea" 
                    rows={3}
                    value={conditionDescription} 
                    onChange={(e) => setConditionDescription(e.target.value)} 
                    placeholder="Contoh: Sumber air warga tercemar dan tidak dapat digunakan sejak kejadian bencana."
                  />
                </div>

                {/* CATATAN PANDUAN PENGISIAN KONDISI */}
                <div style={{ background: "#f6ffed", border: "1px solid #b7eb8f", padding: "14px 18px", borderRadius: "12px", marginTop: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#135200", fontWeight: 700, fontSize: "0.86rem" }}>
                    <Icon name="check" /> Fakta Kondisi untuk Analisis REKSA
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#386134", lineHeight: 1.5 }}>
                    Data kondisi dan tingkat urgensi yang Anda laporkan akan diproses dalam sistem koordinasi pascabencana untuk verifikasi dan validasi kebutuhan riil warga terdampak.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 4: BUKTI UNGGAHAN (FOTO RIIL & DOKUMEN) */}
            {step === 4 && (
              <div className="form-fields-group">
                <div className="form-group">
                  <label className="form-label">Lampirkan Foto Kondisi Lapangan atau Surat RT/RW</label>
                  <label className="report-upload-box">
                    <input 
                      type="file" 
                      accept="image/*,.pdf" 
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          setFileName(file.name);
                          if (file.type.startsWith("image/")) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              const rawResult = ev.target?.result;
                              if (typeof rawResult === "string") {
                                const img = new Image();
                                img.onload = () => {
                                  try {
                                    const canvas = document.createElement("canvas");
                                    const maxDim = 1280;
                                    let width = img.width;
                                    let height = img.height;
                                    if (width > maxDim || height > maxDim) {
                                      if (width > height) {
                                        height = Math.round((height * maxDim) / width);
                                        width = maxDim;
                                      } else {
                                        width = Math.round((width * maxDim) / height);
                                        height = maxDim;
                                      }
                                    }
                                    canvas.width = width;
                                    canvas.height = height;
                                    const ctx = canvas.getContext("2d");
                                    if (ctx) {
                                      ctx.drawImage(img, 0, 0, width, height);
                                      const compressed = canvas.toDataURL("image/jpeg", 0.82);
                                      setFotoBukti(compressed);
                                    } else {
                                      setFotoBukti(rawResult);
                                    }
                                  } catch (err) {
                                    setFotoBukti(rawResult);
                                  }
                                };
                                img.onerror = () => {
                                  setFotoBukti(rawResult);
                                };
                                img.src = rawResult;
                              }
                            };
                            reader.readAsDataURL(file);
                          } else {
                            setFotoBukti(undefined);
                          }
                        }
                      }} 
                    />
                    <div className="upload-box-icon"><Icon name="plus" /></div>
                    <strong>Pilih foto atau dokumen bukti</strong>
                    <p>Mendukung format JPG, PNG, atau PDF · Maksimal 10 MB</p>
                    {fileName ? (
                      <div className="uploaded-file-chip">
                        <Icon name="check" /> {fileName}
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.82rem", color: "#80866e", marginTop: "4px" }}>
                        (Foto kondisi riil membantu posko memprioritaskan bantuan)
                      </span>
                    )}
                  </label>

                  {fotoBukti && (
                    <div style={{ marginTop: "14px", borderRadius: "12px", overflow: "hidden", border: "1px solid #c1c3ac", maxHeight: "200px" }}>
                      <img src={fotoBukti} alt="Pratinjau Bukti Lapangan" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 5: REVIEW LAPORAN */}
            {step === 5 && (
              <div className="form-fields-group">
                <div className="report-review-box">
                  <div className="review-top-banner">
                    <div>
                      <span className="review-code-badge">DRAF LAPORAN KEBUTUHAN</span>
                      <h3>{category === "Lainnya" && customCategory ? customCategory : category}</h3>
                    </div>
                    <div style={{ 
                      background: "rgba(255, 255, 255, 0.16)", 
                      border: "1px solid rgba(255, 255, 255, 0.3)", 
                      padding: "6px 14px", 
                      borderRadius: "20px", 
                      fontSize: "0.82rem", 
                      fontWeight: 700,
                      color: "#ffffff",
                      letterSpacing: "0.04em"
                    }}>
                      Status Awal: Diajukan
                    </div>
                  </div>

                  <div className="review-details-grid">
                    {/* SECTION 1 — KEBUTUHAN */}
                    <div className="review-item wide" style={{ borderBottom: "1px solid rgba(1, 50, 32, 0.08)", paddingBottom: "8px", marginTop: "4px" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#013220", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        1. Kebutuhan
                      </span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Kategori Kebutuhan</span>
                      <strong>{category === "Lainnya" && customCategory ? customCategory : category}</strong>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Perkiraan Jumlah Kebutuhan</span>
                      <strong>{amount ? `${amount} ${getUnit()}` : "-"}</strong>
                    </div>
                    <div className="review-item wide">
                      <span className="review-label">Deskripsi Kebutuhan</span>
                      <p>{notes || "-"}</p>
                    </div>

                    {/* SECTION 2 — LOKASI */}
                    <div className="review-item wide" style={{ borderBottom: "1px solid rgba(1, 50, 32, 0.08)", paddingBottom: "8px", marginTop: "8px" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#013220", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        2. Lokasi &amp; Posko
                      </span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">NIK Pemohon</span>
                      <strong>{applicantNik || "-"}</strong>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Titik Lokasi Warga</span>
                      <strong>{Number.isFinite(Number(pickedLat)) ? pickedLat.toFixed(5) : "-"}, {Number.isFinite(Number(pickedLng)) ? pickedLng.toFixed(5) : "-"}</strong>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Wilayah Administratif</span>
                      <strong>{[village, district ? `Kec. ${district}` : "", regency, province].filter(Boolean).join(", ") || "-"}</strong>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Posko BPBD Rujukan</span>
                      <strong>{poskoTarget || "-"}</strong>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Status Domisili</span>
                      <strong>{shelterStatus || "-"}</strong>
                    </div>

                    {/* SECTION 3 — KONDISI TERDAMPAK */}
                    <div className="review-item wide" style={{ borderBottom: "1px solid rgba(1, 50, 32, 0.08)", paddingBottom: "8px", marginTop: "8px" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#013220", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        3. Kondisi Terdampak
                      </span>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Jumlah Orang Terdampak</span>
                      <strong>{affectedPeople ? `${affectedPeople} Jiwa / Orang` : "-"}</strong>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Jumlah KK (Kepala Keluarga)</span>
                      <strong>{familyCount ? `${familyCount} KK` : "-"}</strong>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Kelompok Rentan</span>
                      <strong>
                        {vulnerableList.length > 0 && !vulnerableList.includes("Tidak ada")
                          ? vulnerableList.join(", ")
                          : "Tidak ada"}
                      </strong>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Kondisi Ketersediaan</span>
                      <strong>{availabilityCondition || "-"}</strong>
                    </div>
                    <div className="review-item">
                      <span className="review-label">Urgensi Menurut Pelapor</span>
                      <strong>{citizenUrgency || "-"}</strong>
                    </div>
                    {conditionDescription && (
                      <div className="review-item wide">
                        <span className="review-label">Deskripsi Kondisi</span>
                        <p>{conditionDescription}</p>
                      </div>
                    )}

                    {/* SECTION 4 — BUKTI PENDUKUNG */}
                    <div className="review-item wide" style={{ borderBottom: "1px solid rgba(1, 50, 32, 0.08)", paddingBottom: "8px", marginTop: "8px" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#013220", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        4. Bukti Pendukung
                      </span>
                    </div>
                    <div className="review-item wide">
                      {fotoBukti || fileName ? (
                        <div>
                          <span className="review-file-tag">
                            <Icon name="file" /> {fileName || "Dokumentasi Foto Lapangan Terlampir"}
                          </span>
                          {fotoBukti && (
                            <div style={{ marginTop: "10px", borderRadius: "10px", overflow: "hidden", border: "1px solid #c1c3ac", maxWidth: "260px", maxHeight: "150px" }}>
                              <img src={fotoBukti} alt="Pratinjau Foto Lampiran" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                            </div>
                          )}
                        </div>
                      ) : (
                        <span style={{ color: "#758378", fontStyle: "italic", fontSize: "0.88rem" }}>
                          Tidak ada bukti dilampirkan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="report-form-actions">
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <Button 
                variant="secondary" 
                disabled={step === 1} 
                onClick={() => setStep(step - 1)}
              >
                Kembali
              </Button>
              {Boolean(category || amount || notes || applicantNik || village || affectedPeople !== "") && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Kosongkan semua data formulir yang telah Anda ketik?")) {
                      resetForm();
                    }
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#8a968d",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    textDecoration: "underline",
                    padding: "6px 10px"
                  }}
                >
                  Kosongkan Draf
                </button>
              )}
            </div>
            <Button 
              onClick={() => { 
                if (step < 5) setStep(step + 1); 
                else { 
                  const submitData = async () => {
                    const displayCat = category === "Lainnya" && customCategory ? customCategory : (category || "Kebutuhan Darurat");
                    const unit = getUnit();
                    const fullVolume = amount ? `${amount} ${unit}` : "-";
                    const peopleCount = typeof affectedPeople === "number" && affectedPeople > 0 ? affectedPeople : 0;
                    const finalKK = typeof familyCount === "number" && familyCount > 0 ? familyCount : 0;
                    const vulText = vulnerableList.length > 0 && !vulnerableList.includes("Tidak ada")
                      ? vulnerableList.join(", ")
                      : "Tidak ada";

                    const payload = {
                      citizen_name: state?.userProfile?.name || "Masyarakat",
                      citizen_phone: state?.userProfile?.phone || "-",
                      posko_name: poskoTarget || "Posko BPBD Wilayah",
                      kategori_kebutuhan: displayCat,
                      volume_permintaan: fullVolume,
                      jumlah_kk: finalKK,
                      status_hunian: shelterStatus || "Rumah Tinggal Pribadi",
                      tingkat_urgensi: citizenUrgency || "Perlu segera",
                      status: "Diajukan",
                      deskripsi: notes || conditionDescription || `Kebutuhan ${displayCat} sebanyak ${fullVolume}.`,
                      desa: village,
                      kecamatan: district,
                      kabupaten: regency,
                      provinsi: province,
                      latitude: pickedLat,
                      longitude: pickedLng,
                      foto_bukti: fotoBukti,
                    };

                    let finalCode = `RK-2026-00${Math.floor(100 + Math.random() * 899)}`;
                    let createdDbItem: any = null;
                    try {
                      const res = await apiService.createKebutuhan(payload);
                      if (res.success && res.data) {
                        createdDbItem = res.data;
                        if (res.data.kode_kasus) {
                          finalCode = res.data.kode_kasus;
                        }
                      }
                    } catch (e) {
                      console.log("API create fallback note:", e);
                    }

                    const now = new Date();
                    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;
                    const v = payload.desa || createdDbItem?.desa || "Surabaya";
                    const d = payload.kecamatan || createdDbItem?.kecamatan;
                    const k = payload.kabupaten || createdDbItem?.kabupaten || "Kota Surabaya";
                    const locStr = d ? `${v}, Kec. ${d}` : `${v}, ${k}`;

                    const newReport: CaseRecord = {
                      id: finalCode,
                      item: displayCat,
                      location: locStr,
                      kk: `${finalKK} KK`,
                      qty: fullVolume,
                      urgency: citizenUrgency || "Sangat mendesak",
                      status: "Diajukan",
                      isOwn: true,
                      notes: payload.deskripsi,
                      date: "Hari ini",
                      posko: createdDbItem?.posko?.nama_posko || poskoTarget,
                      applicantNik: applicantNik,
                      applicantName: state?.userProfile?.name || "Andi Pratama",
                      applicantPhone: state?.userProfile?.phone || "+62 812 4455 0188",
                      shelterStatus: shelterStatus,
                      province: province,
                      regency: regency,
                      district: district,
                      village: village,
                      lat: pickedLat,
                      lng: pickedLng,
                      fotoBukti: createdDbItem?.foto_bukti || fotoBukti,
                      fileName: fileName,
                      vulnerableDetails: vulText,
                      affectedPeople: peopleCount,
                      vulnerableGroupsList: vulnerableList,
                      availabilityCondition: availabilityCondition,
                      citizenUrgency: citizenUrgency,
                      conditionDescription: conditionDescription,
                      createdAtTime: timeStr,
                      createdAtRaw: createdDbItem?.created_at || new Date().toISOString(),
                    };

                    const currentCases = state?.casesList || [];
                    const updatedList = [newReport, ...currentCases.filter(c => c.id !== finalCode)];
                    localStorage.setItem("reksa_cases_db", JSON.stringify(updatedList));

                    if (update) {
                      update({ 
                        status: "Diajukan", 
                        priority: newReport.urgency,
                        activeCaseId: finalCode,
                        casesList: updatedList,
                      }, `Laporan kebutuhan ${newReport.item} (${newReport.qty}) diajukan oleh ${state?.userProfile?.name || "Andi Pratama"} ke ${(poskoTarget || "").split(" - ")[0] || "Posko BPBD Wilayah"}.`);
                    }
                    
                    localStorage.removeItem("reksa_report_draft");
                    setSubmittedCaseId(finalCode);
                    setSuccess(true);
                  };

                  submitData();
                } 
              }}
            >
              {step === 5 ? "Kirim Laporan" : "Lanjutkan"} <Icon name="next" />
            </Button>
          </div>
        </div>

        {/* RIGHT GUIDANCE SIDEBAR */}
        <aside className="report-side-guidance">
          <div className="guidance-card">
            <div className="guidance-icon-circle">
              <Icon name="check" />
            </div>
            <h3>Panduan Pengisian Laporan</h3>
            <p>
              Data yang Anda laporkan akan diteruskan ke sistem koordinasi terpadu untuk validasi posko BPBD dan penugasan responder lapangan.
            </p>

            <ul className="guidance-checklist">
              <li>
                <span className="check-bullet"><Icon name="check" /></span>
                <div>
                  <strong>Validasi Cepat</strong>
                  <small>Petugas Posko BPBD memvalidasi kebutuhan dalam waktu &lt; 24 jam.</small>
                </div>
              </li>
              <li>
                <span className="check-bullet"><Icon name="check" /></span>
                <div>
                  <strong>Kerahasiaan Terlindungi</strong>
                  <small>Titik lokasi digeneralisasi untuk menjaga privasi masyarakat terdampak.</small>
                </div>
              </li>
              <li>
                <span className="check-bullet"><Icon name="check" /></span>
                <div>
                  <strong>Alokasi Terarah</strong>
                  <small>Logistik disalurkan langsung oleh mitra terverifikasi BPBD &amp; PMI.</small>
                </div>
              </li>
            </ul>

            <div className="guidance-footer-note">
              <Icon name="help" />
              <span>Butuh bantuan kedaruratan segera? Hubungi Call Center 112 atau Posko BPBD Sukabumi.</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
