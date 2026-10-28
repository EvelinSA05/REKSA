import { useState, useEffect, useRef, useMemo } from "react";
import {
  SharedState,
  RouterProps,
  CaseRecord,
  PageHead,
  Icon,
  Button,
  MapView,
  addUserReportedId,
} from "../../App";
import { apiService } from "../../services/api";
import { analyzeReportTriage, generateAiConditionDescription } from "../../utils/reksaAiEngine";
import { normalizeProvince, isWithinIndonesia } from "../LeafletMap";

interface CitizenReportProps {
  complete: () => void;
  update: RouterProps["update"];
  state?: SharedState;
}

const SHELTER_OPTIONS = [
  "Rumah Tinggal Pribadi (Terdampak Langsung)",
  "Posko Pengungsian Komunal",
  "Menumpang di Kerabat / Tetangga",
  "Fasilitas Umum / Tempat Ibadah",
];

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  align?: "left" | "right";
  style?: React.CSSProperties;
}

function CustomSelect({
  value,
  onChange,
  options,
  placeholder = "-- Pilih --",
  align = "left",
  style,
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div ref={containerRef} style={{ position: "relative", width: "100%", minWidth: 0, ...style }}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="form-control"
        title={value || placeholder}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          textAlign: "left",
          padding: "10px 14px",
          background: "#ffffff",
          borderColor: isOpen ? "#013220" : undefined,
          boxShadow: isOpen ? "0 0 0 2px rgba(1, 50, 32, 0.12)" : undefined,
          minHeight: "44px",
          height: "auto",
          width: "100%",
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontSize: "0.88rem",
            color: value ? "var(--forest, #013220)" : "#94a3b8",
            fontWeight: value ? 600 : 400,
            whiteSpace: "normal",
            lineHeight: 1.35,
            wordBreak: "normal",
            flex: 1,
            paddingRight: "8px",
            minWidth: 0,
          }}
        >
          {value || placeholder}
        </span>

        <svg
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: "#64748b",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
            flexShrink: 0,
            marginLeft: "auto",
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            ...(align === "right" ? { right: 0 } : { left: 0 }),
            minWidth: "100%",
            width: "max-content",
            maxWidth: "min(460px, calc(100vw - 32px))",
            boxSizing: "border-box",
            zIndex: 90,
            background: "#ffffff",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            boxShadow: "0 10px 25px -4px rgba(0, 0, 0, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.05)",
            padding: "4px",
            maxHeight: "280px",
            overflowY: "auto",
          }}
        >
          <div
            role="option"
            aria-selected={!value}
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            style={{
              padding: "10px 14px",
              fontSize: "0.86rem",
              color: "#94a3b8",
              borderRadius: "6px",
              cursor: "pointer",
              whiteSpace: "normal",
              lineHeight: 1.35,
              transition: "background 0.12s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            {placeholder}
          </div>

          {options.map((opt) => {
            const isSelected = value === opt;
            return (
              <div
                key={opt}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt);
                  setIsOpen(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  padding: "10px 14px",
                  fontSize: "0.88rem",
                  fontWeight: isSelected ? 600 : 400,
                  color: isSelected ? "#013220" : "#1f2937",
                  background: isSelected ? "#ecfdf5" : "transparent",
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "#f1f5f9";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = "transparent";
                  }
                }}
              >
                <span
                  style={{
                    whiteSpace: "normal",
                    lineHeight: 1.4,
                    wordBreak: "normal",
                    flex: 1,
                  }}
                >
                  {opt}
                </span>
                {isSelected && (
                  <span style={{ color: "#059669", fontWeight: 700, fontSize: "0.95rem", flexShrink: 0, marginLeft: "8px" }}>
                    ✓
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const INDONESIA_PROVINCES = [
  "Jawa Timur", "Jawa Barat", "Jawa Tengah", "DKI Jakarta", "Banten", 
  "DI Yogyakarta", "Bali", "Sumatera Utara", "Sumatera Barat", "Sumatera Selatan",
  "Riau", "Kepulauan Riau", "Jambi", "Bengkulu", "Lampung", "Kepulauan Bangka Belitung",
  "Aceh", "Kalimantan Barat", "Kalimantan Tengah", "Kalimantan Selatan", "Kalimantan Timur",
  "Kalimantan Utara", "Sulawesi Utara", "Sulawesi Tengah", "Sulawesi Selatan", "Sulawesi Tenggara",
  "Gorontalo", "Sulawesi Barat", "Nusa Tenggara Barat", "Nusa Tenggara Timur",
  "Maluku", "Maluku Utara", "Papua", "Papua Barat", "Papua Selatan", "Papua Tengah",
  "Papua Pegunungan", "Papua Barat Daya"
];

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
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isSubmittingRef = useRef<boolean>(false);
  
  // BNPB & BPBD Disaster Regulation Taxonomy
  const [faseDarurat, setFaseDarurat] = useState<"Siaga Darurat" | "Tanggap Darurat" | "Transisi Darurat ke Pemulihan">(
    () => initialDraft?.faseDarurat || "Tanggap Darurat"
  );
  const [skalaWilayah, setSkalaWilayah] = useState<"Kabupaten/Kota" | "Provinsi" | "Nasional">(
    () => initialDraft?.skalaWilayah || "Kabupaten/Kota"
  );
  const [kategoriKerusakanRumah, setKategoriKerusakanRumah] = useState<"Rusak Berat" | "Rusak Sedang" | "Rusak Ringan" | "">(
    () => initialDraft?.kategoriKerusakanRumah || ""
  );
  const [estimasiStimulanNominal, setEstimasiStimulanNominal] = useState<number>(
    () => initialDraft?.estimasiStimulanNominal || 0
  );

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

  const provinceOptions = useMemo(() => {
    if (province && !INDONESIA_PROVINCES.includes(province)) {
      return [province, ...INDONESIA_PROVINCES];
    }
    return INDONESIA_PROVINCES;
  }, [province]);
  const [regency, setRegency] = useState<string>(() => initialDraft?.regency || "");
  const [district, setDistrict] = useState<string>(() => initialDraft?.district || "");
  const [village, setVillage] = useState<string>(() => initialDraft?.village || "");
  const [pickedLat, setPickedLat] = useState<number>(() => (typeof initialDraft?.pickedLat === "number" ? initialDraft.pickedLat : -7.2654));
  const [pickedLng, setPickedLng] = useState<number>(() => (typeof initialDraft?.pickedLng === "number" ? initialDraft.pickedLng : 112.7521));
  const [isDetectingGPS, setIsDetectingGPS] = useState<boolean>(false);


  // Step 3: Kondisi Terdampak
  const [affectedPeople, setAffectedPeople] = useState<number | "">(() => initialDraft?.affectedPeople ?? "");
  const [familyCount, setFamilyCount] = useState<number | "">(() => initialDraft?.familyCount ?? "");
  const [vulnerableList, setVulnerableList] = useState<string[]>(() => Array.isArray(initialDraft?.vulnerableList) ? initialDraft.vulnerableList : []);
  const [availabilityCondition, setAvailabilityCondition] = useState<string>(() => initialDraft?.availabilityCondition || "");
  const [citizenUrgency, setCitizenUrgency] = useState<string>(() => initialDraft?.citizenUrgency || "");
  const [conditionDescription, setConditionDescription] = useState<string>(() => initialDraft?.conditionDescription || "");

  // AI Smart Triage & Prioritization calculation
  const [aiAppliedFeedback, setAiAppliedFeedback] = useState<string | null>(null);
  const aiTriage = useMemo(() => {
    const combined = `${conditionDescription} ${notes}`.trim();
    if (!combined || combined.length < 5) return null;
    return analyzeReportTriage(combined, category, vulnerableList, {
      affectedPeople,
      familyCount,
      availabilityCondition,
      kategoriKerusakanRumah,
      village,
      district,
      regency,
      amount,
      customUnit,
    });
  }, [
    conditionDescription,
    notes,
    category,
    vulnerableList,
    affectedPeople,
    familyCount,
    availabilityCondition,
    kategoriKerusakanRumah,
    village,
    district,
    regency,
    amount,
    customUnit,
  ]);

  const handleDraftConditionWithAi = () => {
    const draft = generateAiConditionDescription({
      category,
      customCategory,
      amount,
      customUnit,
      notes,
      village,
      district,
      regency,
      affectedPeople,
      familyCount,
      vulnerableList,
      availabilityCondition,
      kategoriKerusakanRumah,
      currentDescription: conditionDescription,
    });
    setConditionDescription(draft);

    // Auto set citizenUrgency if not already selected
    if (!citizenUrgency) {
      const isHigh =
        vulnerableList.filter((v) => v !== "Tidak ada").length > 0 ||
        kategoriKerusakanRumah === "Rusak Berat" ||
        (availabilityCondition &&
          (availabilityCondition.includes("Habis") ||
            availabilityCondition.includes("Roboh") ||
            availabilityCondition.includes("Kritis") ||
            availabilityCondition.includes("Luka")));
      setCitizenUrgency(isHigh ? "Sangat mendesak" : "Perlu segera");
    }

    setAiAppliedFeedback("Draf narasi kondisi darurat berhasil disusun oleh REKSA AI!");
    setTimeout(() => setAiAppliedFeedback(null), 4000);
  };

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
      availabilityCondition || citizenUrgency || conditionDescription || fileName || fotoBukti ||
      faseDarurat !== "Tanggap Darurat" || skalaWilayah !== "Kabupaten/Kota" || kategoriKerusakanRumah
    );

    if (hasAnyContent) {
      const draft = {
        step,
        faseDarurat,
        skalaWilayah,
        kategoriKerusakanRumah,
        estimasiStimulanNominal,
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
    faseDarurat,
    skalaWilayah,
    kategoriKerusakanRumah,
    estimasiStimulanNominal,
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
    setFaseDarurat("Tanggap Darurat");
    setSkalaWilayah("Kabupaten/Kota");
    setKategoriKerusakanRumah("");
    setEstimasiStimulanNominal(0);
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
    isSubmittingRef.current = false;
    setIsSubmitting(false);
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
    if (category.includes("Hunian") || category.includes("Tenda") || category.includes("Tempat Tinggal")) return "Unit Huntara / Tenda";
    if (category.includes("Pangan") || category.includes("Makanan") || category.includes("Beras")) return "Paket / Kg Beras / Porsi";
    if (category.includes("Air Bersih") || category.includes("Air Minum")) return "Liter (L) / Galon / Tangki";
    if (category.includes("Sandang") || category.includes("Pakaian")) return "Paket (Family/Kidware/Hygiene)";
    if (category.includes("Kesehatan") || category.includes("Medis") || category.includes("Obat")) return "Paket Medis / Obat / Nakes";
    if (category.includes("Stimulan") || category.includes("Rumah")) return "Unit Rumah Rusak";
    if (category.includes("Sarana") || category.includes("Vital") || category.includes("Energi") || category.includes("Listrik")) return "Titik / Unit Fasilitas";
    if (category.includes("Sanitasi") || category.includes("Kebersihan")) return "Paket Sanitasi / MCK Darurat";
    return customUnit || "Unit / Paket";
  };

  // Posko BPBD Otomatis Ditetapkan Menyesuaikan Provinsi & Kabupaten (Terkunci / Non-Editable)
  const getAssignedPosko = (prov: string, reg: string) => {
    if (!prov && !reg) return "";
    const cleanReg = reg.trim().replace(/^(Kota|Kabupaten|Kab\.|Kota\s+Adm\.)\s+/i, "");

    if (prov && POSKO_DATABASE[prov]) {
      const list = POSKO_DATABASE[prov];
      if (cleanReg.length >= 2) {
        const match = list.find((p) => p.toLowerCase().includes(cleanReg.toLowerCase()));
        if (match) return match;
        const prefix = reg.trim().toLowerCase().startsWith("kota") ? "Kota" : "Kabupaten";
        return `Posko BPBD ${prefix} ${cleanReg} (Posko Induk)`;
      }
      return list[0];
    }

    if (cleanReg.length >= 2) {
      const prefix = reg.trim().toLowerCase().startsWith("kota") ? "Kota" : "Kabupaten";
      return `Posko BPBD ${prefix} ${cleanReg} (Posko Induk)`;
    }

    if (prov) {
      return `Posko BPBD Provinsi ${prov} (Komando Wilayah)`;
    }

    return "";
  };

  // Otomatis sinkronkan Posko BPBD rujukan saat Provinsi atau Kabupaten berubah
  useEffect(() => {
    if (province || regency) {
      const assigned = getAssignedPosko(province, regency);
      if (assigned) {
        setPoskoTarget(assigned);
      }
    } else {
      setPoskoTarget("");
    }
  }, [province, regency]);

  // Klasifikasi Resmi Jenis Kebutuhan Dasar & Bantuan Pasca-Bencana (Perka BNPB No. 7/2008 & Kepka BNPB No. 296A/2023)
  const categories = [
    "Hunian Sementara (Huntara / Tenda)",
    "Pangan & Makanan Siap Saji",
    "Air Bersih & Sanitasi",
    "Sandang & Paket Non-Pangan",
    "Pelayanan Kesehatan & Medis",
    "Bantuan Stimulan Rumah (Pasca-Bencana)",
    "Pemulihan Sarana & Fasilitas Vital",
    "Lainnya",
  ];

  const getCategoryIcon = (cat: string) => {
    if (cat.includes("Hunian") || cat.includes("Tenda") || cat.includes("Tempat Tinggal")) return "map";
    if (cat.includes("Pangan") || cat.includes("Makanan")) return "box";
    if (cat.includes("Air Bersih") || cat.includes("Air Minum")) return "pin";
    if (cat.includes("Sandang") || cat.includes("Pakaian")) return "box";
    if (cat.includes("Kesehatan") || cat.includes("Medis")) return "file";
    if (cat.includes("Stimulan") || cat.includes("Rumah")) return "grid";
    if (cat.includes("Sarana") || cat.includes("Vital") || cat.includes("Energi")) return "bolt";
    return "plus";
  };

  const getAvailabilityConfig = (cat: string) => {
    if (cat.includes("Hunian") || cat.includes("Tenda") || cat.includes("Tempat Tinggal")) {
      return {
        label: "Bagaimana kondisi tempat tinggal saat ini?",
        options: [
          "Rumah rusak berat / roboh total (Wajib Tenda/Huntara)",
          "Rumah rusak sedang (Tidak aman ditinggali)",
          "Mengungsi di tenda darurat tak layak",
          "Masih dapat dihuni dengan perbaikan ringan",
        ],
      };
    }
    if (cat.includes("Pangan") || cat.includes("Makanan")) {
      return {
        label: "Bagaimana ketersediaan stok bahan pangan / makanan?",
        options: [
          "Habis total / Belum makan > 12 jam",
          "Stok sangat menipis (< 1 hari)",
          "Dapur umum posko belum menjangkau",
          "Tersedia terbatas (Cukup untuk hari ini)",
        ],
      };
    }
    if (cat.includes("Air Bersih") || cat.includes("Air Minum")) {
      return {
        label: "Bagaimana akses air minum & air bersih saat ini?",
        options: [
          "Sumber air tercemar lumpur / pipa terputus total",
          "Kritis (< 2,5 Liter air minum per orang)",
          "Air bersih MCK sangat terbatas",
          "Tersedia namun keruh / perlu tandon penampung",
        ],
      };
    }
    if (cat.includes("Sandang") || cat.includes("Pakaian")) {
      return {
        label: "Bagaimana ketersediaan pakaian, selimut & paket keluarga?",
        options: [
          "Pakaian basah / tertimbun reruntuhan tanpa ganti",
          "Kekurangan selimut hangat & matras tidur",
          "Butuh hygiene kit & kidware anak mendesak",
          "Masih ada pakaian seadanya",
        ],
      };
    }
    if (cat.includes("Kesehatan") || cat.includes("Medis")) {
      return {
        label: "Bagaimana kondisi fasilitas & layanan medis di lokasi?",
        options: [
          "Ada warga luka berat / demam tanpa obat & nakes",
          "Stok obat kronis & P3K pengungsian habis",
          "Faskes terdekat lumpuh / terisolasi",
          "Layanan darurat beroperasi terbatas",
        ],
      };
    }
    if (cat.includes("Stimulan") || cat.includes("Rumah")) {
      return {
        label: "Bagaimana tingkat kerusakan fisik bangunan rumah?",
        options: [
          "Rusak Berat (Roboh / Runtuh Total - Stimulan Rp60 Juta)",
          "Rusak Sedang (Struktur Retak Parah / Atap Ambruk - Stimulan Rp30 Juta)",
          "Rusak Ringan (Dinding Retak / Plesteran Lepas - Stimulan Rp15 Juta)",
        ],
      };
    }
    if (cat.includes("Sarana") || cat.includes("Vital") || cat.includes("Energi")) {
      return {
        label: "Bagaimana status prasarana vital & jaringan energi?",
        options: [
          "Jalur listrik & jembatan putus total",
          "Padam bergilir / butuh genset darurat",
          "Akses jalan tertutup material longsor/banjir",
          "Beroperasi darurat",
        ],
      };
    }
    return {
      label: "Bagaimana ketersediaan kebutuhan saat ini?",
      options: ["Habis / Tidak tersedia", "Sangat terbatas", "Masih tersedia"],
    };
  };

  // Helper Perhitungan Regulasi BNPB (Perka No. 7/2008 & Kepka No. 296A/2023)
  const getBnpbStandardNote = (cat: string, damage?: string, units?: string | number, people?: string | number) => {
    const count = typeof people === "number" && people > 0 ? people : (parseInt(String(people)) || 0);
    const unitNum = typeof units === "number" && units > 0 ? units : (parseInt(String(units)) || 1);

    if (cat.includes("Pangan") || cat.includes("Makanan")) {
      if (count > 0) {
        const berasKg = ((count * 400) / 1000).toFixed(1).replace(".0", "");
        const kalori = (count * 2100).toLocaleString("id-ID");
        return `Standar Perka BNPB No. 7/2008: ${count} jiwa membutuhkan minimal ${berasKg} kg beras dan setara ${kalori} kkal per hari.`;
      }
      return "Standar Perka BNPB No. 7/2008: Minimal 400 gram beras per orang per hari atau setara 2.100 kkal.";
    }
    if (cat.includes("Air Bersih") || cat.includes("Air Minum")) {
      if (count > 0) {
        const airMinum = (count * 2.5).toFixed(1).replace(".0", "");
        const airBersihMin = count * 7;
        const airBersihMax = count * 15;
        return `Standar Perka BNPB No. 7/2008: ${count} jiwa membutuhkan min. ${airMinum} Liter air minum/hari dan ${airBersihMin} - ${airBersihMax} Liter air bersih sanitasi/hari.`;
      }
      return "Standar Perka BNPB No. 7/2008: Air minum min. 2,5 liter/orang/hari, serta air bersih sanitasi 7 - 15 liter/orang/hari.";
    }
    if (cat.includes("Hunian") || cat.includes("Tenda") || cat.includes("Tempat Tinggal")) {
      if (count > 0) {
        const luas = count * 3;
        return `Standar Perka BNPB No. 7/2008: ${count} jiwa membutuhkan penampungan/tenda layak min. ${luas} m² (standar min. 3 m²/orang).`;
      }
      return "Standar Perka BNPB No. 7/2008: Penyediaan tempat penampungan/tenda yang layak dengan standar minimal luas 3 m² per orang.";
    }
    if (cat.includes("Sandang") || cat.includes("Pakaian")) {
      return "Standar Perka BNPB No. 7/2008: Distribusi pakaian, selimut, matras, serta paket family kits, kidware, & hygiene kits.";
    }
    if (cat.includes("Kesehatan") || cat.includes("Medis")) {
      return "Standar Perka BNPB No. 7/2008: Penyediaan obat-obatan esensial, tenaga medis reaksi cepat, & fasilitas MCK darurat.";
    }
    if (cat.includes("Stimulan") || cat.includes("Rumah")) {
      const nominalPerUnit = damage === "Rusak Berat" ? 60000000 : damage === "Rusak Sedang" ? 30000000 : damage === "Rusak Ringan" ? 15000000 : 0;
      if (nominalPerUnit > 0) {
        const total = (unitNum * nominalPerUnit).toLocaleString("id-ID");
        return `Kepka BNPB No. 296A Tahun 2023: Stimulan ${damage} sebesar Rp${nominalPerUnit.toLocaleString("id-ID")},- per unit. Total estimasi bantuan untuk ${unitNum} unit rumah: Rp${total},-`;
      }
      return "Keputusan Kepala BNPB No. 296A Tahun 2023: Stimulan tunai perbaikan rumah korban (Rusak Berat: Rp60jt, Rusak Sedang: Rp30jt, Rusak Ringan: Rp15jt).";
    }
    if (cat.includes("Sarana") || cat.includes("Vital") || cat.includes("Energi")) {
      return "Fase Transisi Darurat ke Pemulihan BNPB: Bantuan peralatan perbaikan fungsi sarana prasarana vital & pemulihan sosial ekonomi.";
    }
    return "Standar pemenuhan kebutuhan dasar korban bencana mengacu pada Peraturan Kepala BNPB No. 7/2008.";
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
            {/* STEP 1: KEBUTUHAN & REGULASI BNPB/BPBD */}
            {step === 1 && (
              <div className="form-fields-group">
                {/* 1. KATEGORI KEBUTUHAN DASAR (PERKA BNPB NO. 7/2008 & KEPKA NO. 296A/2023) */}
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                    <label className="form-label" style={{ margin: 0 }}>Kategori Jenis Kebutuhan Pascabencana</label>
                    <span style={{ fontSize: "0.76rem", color: "#64748b" }}>Standar Perka BNPB No. 7/2008</span>
                  </div>
                  <div className="category-pills-row" style={{ flexWrap: "wrap", gap: "8px" }}>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        className={`cat-pill-btn ${category === cat ? "active" : ""}`}
                        onClick={() => {
                          setCategory(cat);
                          const cfg = getAvailabilityConfig(cat);
                          setAvailabilityCondition(cfg.options[0]);
                          if (cat.includes("Stimulan") || cat.includes("Rumah")) {
                            setFaseDarurat("Transisi Darurat ke Pemulihan");
                            if (!kategoriKerusakanRumah) {
                              setKategoriKerusakanRumah("Rusak Berat");
                              const qty = parseInt(amount) || 1;
                              setEstimasiStimulanNominal(qty * 60000000);
                            }
                          } else {
                            setFaseDarurat("Tanggap Darurat");
                            setKategoriKerusakanRumah("");
                            setEstimasiStimulanNominal(0);
                          }
                        }}
                      >
                        <Icon name={getCategoryIcon(cat)} />
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* KHUSUS: KATEGORI KERUSAKAN RUMAH & STIMULAN KEPKA BNPB NO. 296A/2023 */}
                {category === "Bantuan Stimulan Rumah (Pasca-Bencana)" && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      border: "1.5px solid #10b981",
                      borderRadius: "14px",
                      padding: "16px",
                      marginBottom: "16px",
                      marginTop: "6px",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, color: "#013220", fontSize: "0.88rem" }}>
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        <span>Bantuan Stimulan Perbaikan Rumah (Kepka BNPB No. 296A/2023)</span>
                      </div>
                      <span style={{ fontSize: "0.74rem", background: "#d1fae5", color: "#065f46", padding: "2px 8px", borderRadius: "6px", fontWeight: 700 }}>
                        Bantuan Tunai Rekonstruksi
                      </span>
                    </div>
                    <p style={{ margin: "0 0 12px", fontSize: "0.80rem", color: "#064e3b", lineHeight: 1.45 }}>
                      Pemerintah melalui BNPB mengalokasikan bantuan stimulan uang tunai bagi korban yang tempat tinggalnya rusak fisik akibat bencana, diverifikasi melalui Posko &amp; BPBD setempat.
                    </p>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "10px", marginBottom: "12px" }}>
                      {[
                        {
                          tier: "Rusak Berat" as const,
                          nominal: 60000000,
                          nominalText: "Rp 60.000.000,-",
                          desc: "Bangunan roboh / struktur patah total, tidak aman untuk ditempati.",
                          tone: "#ef4444",
                          bg: "#fef2f2",
                        },
                        {
                          tier: "Rusak Sedang" as const,
                          nominal: 30000000,
                          nominalText: "Rp 30.000.000,-",
                          desc: "Sebagian dinding/atap ambruk, struktur retak parah namun masih berdiri.",
                          tone: "#f59e0b",
                          bg: "#fffbeb",
                        },
                        {
                          tier: "Rusak Ringan" as const,
                          nominal: 15000000,
                          nominalText: "Rp 15.000.000,-",
                          desc: "Kerusakan non-struktural (genteng, plafon, plester dinding retak rambut).",
                          tone: "#10b981",
                          bg: "#f0fdf4",
                        },
                      ].map((item) => {
                        const isChosen = kategoriKerusakanRumah === item.tier;
                        return (
                          <div
                            key={item.tier}
                            onClick={() => {
                              setKategoriKerusakanRumah(item.tier);
                              const qty = parseInt(amount) || 1;
                              setEstimasiStimulanNominal(qty * item.nominal);
                            }}
                            style={{
                              border: isChosen ? `2px solid ${item.tone}` : "1px solid #d1fae5",
                              background: isChosen ? item.bg : "#ffffff",
                              borderRadius: "10px",
                              padding: "12px",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ fontSize: "0.85rem", color: isChosen ? item.tone : "#013220" }}>
                                {item.tier}
                              </strong>
                              {isChosen && <span style={{ color: item.tone, fontWeight: 800, fontSize: "0.8rem" }}>✓</span>}
                            </div>
                            <div style={{ fontSize: "0.96rem", fontWeight: 800, color: item.tone, margin: "4px 0" }}>
                              {item.nominalText}
                              <small style={{ fontSize: "0.70rem", fontWeight: 600, color: "#6b7280" }}> / unit</small>
                            </div>
                            <p style={{ margin: 0, fontSize: "0.72rem", color: "#4b5563", lineHeight: 1.35 }}>
                              {item.desc}
                            </p>
                          </div>
                        );
                      })}
                    </div>

                    {kategoriKerusakanRumah && (
                      <div
                        style={{
                          background: "#ffffff",
                          border: "1px dashed #059669",
                          borderRadius: "8px",
                          padding: "10px 14px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: "8px",
                        }}
                      >
                        <span style={{ fontSize: "0.82rem", color: "#065f46" }}>
                          Total Estimasi Bantuan Stimulan BNPB:
                        </span>
                        <strong style={{ fontSize: "1.05rem", color: "#047857" }}>
                          Rp {((parseInt(amount) || 1) * (kategoriKerusakanRumah === "Rusak Berat" ? 60000000 : kategoriKerusakanRumah === "Rusak Sedang" ? 30000000 : 15000000)).toLocaleString("id-ID")},-
                          <small style={{ fontSize: "0.75rem", fontWeight: 600, color: "#4b5563" }}>
                            {" "}({parseInt(amount) || 1} Unit Rumah)
                          </small>
                        </strong>
                      </div>
                    )}
                  </div>
                )}

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
                    <label className="form-label">
                      {category === "Bantuan Stimulan Rumah (Pasca-Bencana)"
                        ? "Jumlah Unit Rumah Rusak"
                        : "Perkiraan Jumlah Kebutuhan"}
                    </label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={amount} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setAmount(val);
                        if (category === "Bantuan Stimulan Rumah (Pasca-Bencana)" && kategoriKerusakanRumah) {
                          const rate = kategoriKerusakanRumah === "Rusak Berat" ? 60000000 : kategoriKerusakanRumah === "Rusak Sedang" ? 30000000 : 15000000;
                          setEstimasiStimulanNominal((parseInt(val) || 1) * rate);
                        }
                      }} 
                      placeholder={category === "Bantuan Stimulan Rumah (Pasca-Bencana)" ? "Contoh: 1, 3, 5" : "Contoh: 1000, 250, 50"} 
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

                {/* BANNER STANDAR REGULASI BNPB PERKA NO. 7/2008 & KEPKA NO. 296A/2023 */}
                {category && (
                  <div
                    style={{
                      background: "#f4f8f5",
                      border: "1px solid #c2dfc9",
                      borderRadius: "10px",
                      padding: "10px 14px",
                      marginTop: "-4px",
                      marginBottom: "14px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "9px",
                    }}
                  >
                    <div style={{ color: "#166534", marginTop: "2px" }}>
                      <Icon name="check" />
                    </div>
                    <div>
                      <strong style={{ fontSize: "0.82rem", color: "#013220", display: "block" }}>
                        Pedoman Standar Bantuan BNPB:
                      </strong>
                      <p style={{ margin: "2px 0 0", fontSize: "0.80rem", color: "#2d4a36", lineHeight: 1.45 }}>
                        {getBnpbStandardNote(category, kategoriKerusakanRumah, amount, affectedPeople)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Jelaskan Kebutuhan &amp; Dampak Kerusakan</label>
                  <textarea 
                    className="form-control textarea" 
                    rows={4}
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Jelaskan kebutuhan riil dan kondisi lapangan yang menyebabkan kebutuhan ini sangat diperlukan..."
                  />
                  <small style={{ color: "#758378", marginTop: "6px", display: "block", fontSize: "0.82rem" }}>
                    Contoh: 3 unit rumah roboh akibat gempa, warga sementara tinggal di teras tetangga membutuhkan tenda darurat dan stimulan perbaikan rumah.
                  </small>
                </div>
              </div>
            )}

            {/* STEP 2: LOKASI, NIK, STATUS DOMISILI & POSKO BPBD */}
            {step === 2 && (
              <div className="form-fields-group">
                <div className="form-row-two">
                  <div className="form-group" style={{ minWidth: 0 }}>
                    <label className="form-label">NIK Pemohon / ID Warga</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={applicantNik} 
                      onChange={(e) => setApplicantNik(e.target.value)} 
                      placeholder="Contoh: 3202110482910002 (16 digit)"
                      maxLength={16}
                      style={{ width: "100%", minWidth: 0 }}
                    />
                  </div>
                  <div className="form-group" style={{ position: "relative", minWidth: 0 }}>
                    <label className="form-label">Status Domisili / Lokasi Warga</label>
                    <CustomSelect
                      value={shelterStatus}
                      onChange={setShelterStatus}
                      options={SHELTER_OPTIONS}
                      placeholder="-- Pilih Status Domisili / Lokasi --"
                      align="right"
                    />
                  </div>
                </div>

                <div className="form-row-two">
                  <div className="form-group" style={{ minWidth: 0 }}>
                    <label className="form-label">Provinsi</label>
                    <CustomSelect
                      value={province}
                      onChange={(newProv) => {
                        setProvince(newProv);
                        const assigned = getAssignedPosko(newProv, regency);
                        setPoskoTarget(assigned);
                      }}
                      options={provinceOptions}
                      placeholder="-- Pilih Provinsi --"
                    />
                  </div>
                  <div className="form-group" style={{ minWidth: 0 }}>
                    <label className="form-label">Kabupaten / Kota</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={regency} 
                      onChange={(e) => {
                        const newReg = e.target.value;
                        setRegency(newReg);
                        const assigned = getAssignedPosko(province, newReg);
                        if (assigned) setPoskoTarget(assigned);
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
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <label className="form-label" style={{ margin: 0 }}>Posko BPBD Wilayah Rujukan</label>
                    <span 
                      style={{ 
                        fontSize: "0.75rem", 
                        color: "#475569", 
                        fontWeight: 600,
                        background: "#f1f5f9",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        border: "1px solid #e2e8f0",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px"
                      }}
                    >
                      <span style={{ display: "inline-flex", width: "12px", height: "12px", color: "#64748b" }}>
                        <Icon name="lock" />
                      </span>
                      <span>Sistem Otomatis {province ? `• ${province}` : ""}</span>
                    </span>
                  </div>
                  <div style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="form-control"
                      readOnly
                      tabIndex={-1}
                      value={poskoTarget || (province ? getAssignedPosko(province, regency) : "")}
                      placeholder="Otomatis ditetapkan sistem sesuai Provinsi & Kabupaten..."
                      style={{
                        backgroundColor: "#f8fafc",
                        color: (poskoTarget || province || regency) ? "#0f172a" : "#94a3b8",
                        fontWeight: (poskoTarget || province || regency) ? 600 : 400,
                        cursor: "not-allowed",
                        border: "1px solid #cbd5e1",
                        paddingRight: "40px",
                        userSelect: "none",
                      }}
                      title="Posko BPBD rujukan ditetapkan secara otomatis oleh sistem dan tidak dapat diubah manual."
                    />
                    <span
                      style={{
                        position: "absolute",
                        right: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "16px",
                        height: "16px",
                        color: "#94a3b8",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                        userSelect: "none"
                      }}
                    >
                      <Icon name="lock" />
                    </span>
                  </div>
                  <small style={{ color: "#64748b", marginTop: "5px", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem" }}>
                    <span style={{ display: "inline-flex", width: "14px", height: "14px", flexShrink: 0, color: "#64748b" }}>
                      <Icon name="info" />
                    </span>
                    <span>Posko BPBD rujukan ditetapkan otomatis oleh sistem sesuai wilayah bencana Anda.</span>
                  </small>
                </div>



                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <label className="form-label" style={{ display: "block", margin: "0 0 4px" }}>Titik Lokasi Warga pada Peta</label>
                      <div style={{ color: "#64748b", display: "flex", alignItems: "center", gap: "6px", fontSize: "0.78rem" }}>
                        <span>Titik Terpilih:</span>
                        <code style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "1px 6px", borderRadius: "4px", fontSize: "0.76rem", color: "#0f172a", fontFamily: "monospace" }}>
                          {(Number(pickedLat) || -7.2654).toFixed(5)}, {(Number(pickedLng) || 112.7521).toFixed(5)}
                        </code>
                        <span>(Klik peta atau gunakan tombol GPS)</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isDetectingGPS}
                      onClick={() => {
                        if (navigator.geolocation) {
                          setIsDetectingGPS(true);
                          navigator.geolocation.getCurrentPosition(
                            async (pos) => {
                              setIsDetectingGPS(false);
                              if (pos?.coords) {
                                const lat = Number(pos.coords.latitude);
                                const lng = Number(pos.coords.longitude);
                                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                                  const rLat = Number(lat.toFixed(6));
                                  const rLng = Number(lng.toFixed(6));
                                  setPickedLat(rLat);
                                  setPickedLng(rLng);

                                  const inID = isWithinIndonesia(rLat, rLng);
                                  if (!inID) {
                                    alert(
                                      `⚠️ Peringatan Lokasi (${rLat.toFixed(4)}, ${rLng.toFixed(4)}):\n\n` +
                                      `Browser Anda mendeteksi titik koordinat di luar wilayah Indonesia (misalnya Jepang / Osaka).\n\n` +
                                      `Penyebab: Anda sedang terhubung menggunakan VPN atau Proxy aktif pada browser/laptop, atau IP internet diarahkan ke luar negeri.\n\n` +
                                      `Solusi:\n` +
                                      `1. Matikan VPN / Proxy Anda lalu tekan 'Gunakan Posisi Saya' kembali.\n` +
                                      `2. Atau gunakan tombol 'Pusatkan Titik ke Jawa Timur (Surabaya)' pada banner peringatan di atas peta untuk langsung kembali ke wilayah Indonesia.`
                                    );
                                    return;
                                  }

                                  // Immediate reverse geocoding to fill Provinsi, Kabupaten, Kecamatan, Desa instantly
                                  try {
                                    const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${rLat}&longitude=${rLng}&localityLanguage=id`;
                                    const res = await fetch(bdcUrl);
                                    if (res.ok) {
                                      const data = await res.json();
                                      const admins = data.localityInfo?.administrative || [];
                                      const admin4 = admins.find((a: any) => a.adminLevel === 4)?.name;
                                      const admin5 = admins.find((a: any) => a.adminLevel === 5)?.name;
                                      const admin6 = admins.find((a: any) => a.adminLevel === 6)?.name;
                                      const admin7 = admins.find((a: any) => a.adminLevel >= 7)?.name;

                                      const normProv = normalizeProvince(admin4 || data.principalSubdivision || "", rLat, rLng);
                                      if (normProv) {
                                        setProvince(normProv);
                                      }

                                      let normKab = admin5 || (data.city && data.city !== normProv && data.city !== admin6 ? data.city : "");
                                      if (normKab) {
                                        if (!normKab.toLowerCase().startsWith("kota") && !normKab.toLowerCase().startsWith("kabupaten") && !normKab.toLowerCase().startsWith("kab.")) {
                                          if (normKab.toLowerCase().includes("jakarta")) {
                                            normKab = `Kota ${normKab.replace(/^Kota\s+/i, '')}`;
                                          } else if (/surabaya|bandung|semarang|medan|makassar|denpasar|bogor|bekasi|depok|tangerang|malang|pasuruan|probolinggo|kediri|blitar|madiun|batu/i.test(normKab)) {
                                            normKab = `Kota ${normKab}`;
                                          } else {
                                            normKab = `Kabupaten ${normKab}`;
                                          }
                                        }
                                        setRegency(normKab);
                                      }

                                      const normKec = admin6 || data.locality || "";
                                      if (normKec) setDistrict(normKec);

                                      const normDesa = admin7 || (data.city && data.city !== normKab && data.city !== admin5 ? data.city : null) || data.locality || normKec || "";
                                      if (normDesa) setVillage(normDesa);

                                      if (normProv && normKab) {
                                        const assigned = getAssignedPosko(normProv, normKab);
                                        if (assigned) setPoskoTarget(assigned);
                                      }
                                    }
                                  } catch (err) {
                                    console.warn("Direct GPS geocode fallback to MapView", err);
                                  }
                                }
                              }
                            },
                            () => {
                              setIsDetectingGPS(false);
                              alert("GPS tidak aktif atau izin lokasi browser belum diizinkan.");
                            },
                            { enableHighAccuracy: true, timeout: 8000 }
                          );
                        } else {
                          alert("Browser Anda tidak mendukung deteksi lokasi GPS.");
                        }
                      }}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        background: "#f1f5f9",
                        color: "#013220",
                        border: "1px solid #cbd5e1",
                        padding: "6px 12px",
                        borderRadius: "8px",
                        fontSize: "0.80rem",
                        fontWeight: 600,
                        cursor: isDetectingGPS ? "wait" : "pointer",
                        opacity: isDetectingGPS ? 0.75 : 1,
                        transition: "all 0.15s ease"
                      }}
                    >
                      <Icon name="pin" /> {isDetectingGPS ? "Mendeteksi Posisi..." : "Gunakan Posisi Saya"}
                    </button>
                  </div>

                  {/* Warning banner when coordinates are outside Indonesia (e.g. VPN/Proxy in Japan) */}
                  {!isWithinIndonesia(Number(pickedLat), Number(pickedLng)) && (
                    <div style={{
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "10px",
                      padding: "12px 14px",
                      marginBottom: "12px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "0.82rem",
                      color: "#92400e"
                    }}>
                      <span style={{ fontSize: "1.2rem", lineHeight: 1 }}>⚠️</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                          Titik Posisi Terdeteksi di Luar Indonesia ({Number(pickedLat).toFixed(4)}, {Number(pickedLng).toFixed(4)})
                        </div>
                        <p style={{ margin: "0 0 8px", color: "#78350f", lineHeight: 1.4 }}>
                          Browser Anda mendeteksi lokasi di luar negeri (kemungkinan karena <strong>VPN atau Proxy sedang aktif</strong> di perangkat Anda). Sistem BPBD REKSA hanya melayani wilayah bencana di Indonesia. Silakan nonaktifkan VPN Anda, atau klik tombol di bawah untuk memusatkan titik kembali ke wilayah Indonesia:
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setPickedLat(-7.2654);
                            setPickedLng(112.7521);
                            setProvince("Jawa Timur");
                            setRegency("Kota Surabaya");
                            setDistrict("Gubeng");
                            setVillage("Gubeng");
                            setPoskoTarget("Posko BPBD Provinsi Jawa Timur (Komando Wilayah)");
                          }}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            background: "#013220",
                            color: "#fff",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "6px",
                            fontSize: "0.80rem",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          🇮🇩 Pusatkan Titik ke Jawa Timur (Surabaya)
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="report-map-wrapper">
                    <MapView 
                      hideCard 
                      pickLocation 
                      initialLat={Number.isFinite(Number(pickedLat)) ? Number(pickedLat) : -7.2654}
                      initialLng={Number.isFinite(Number(pickedLng)) ? Number(pickedLng) : 112.7521}
                      onLocationPicked={(info: any) => {
                        const inID = isWithinIndonesia(Number(info?.lat), Number(info?.lng));
                        if (inID) {
                          if (info?.desa) setVillage(info.desa);
                          if (info?.kecamatan) setDistrict(info.kecamatan);
                          if (info?.kabupaten) setRegency(info.kabupaten);
                          if (info?.provinsi) {
                            const norm = normalizeProvince(info.provinsi, info?.lat, info?.lng);
                            if (norm) {
                              setProvince(norm);
                              if (info?.kabupaten) {
                                const assigned = getAssignedPosko(norm, info.kabupaten);
                                if (assigned) setPoskoTarget(assigned);
                              }
                            }
                          }
                          if (info?.poskoName) setPoskoTarget(info.poskoName);
                        }
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
                      { 
                        id: "Balita", 
                        title: "Balita", 
                        icon: (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="8"/>
                            <path d="M9 11h.01M15 11h.01"/>
                            <path d="M9.5 15a3.5 3.5 0 0 0 5 0"/>
                            <path d="M12 4c.5-1 1.5-1.5 2-1"/>
                          </svg>
                        ) 
                      },
                      { 
                        id: "Anak-anak", 
                        title: "Anak-anak", 
                        icon: (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="7" r="4"/>
                            <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                          </svg>
                        ) 
                      },
                      { 
                        id: "Lansia", 
                        title: "Lansia", 
                        icon: (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="10" cy="5" r="2.5"/>
                            <path d="M10 8.5v6l-2.5 4.5"/>
                            <path d="M10 11.5l3.5 1.5 1 6"/>
                            <path d="M17 11a1.5 1.5 0 0 1 1.5 1.5V20"/>
                          </svg>
                        ) 
                      },
                      { 
                        id: "Ibu hamil", 
                        title: "Ibu hamil", 
                        icon: (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="4" r="2"/>
                            <path d="M9 7.5h3a3 3 0 0 1 3 3c0 2-1.5 3.5-3.5 3.5H9v6"/>
                            <path d="M9 10.5a3.5 3.5 0 0 1 3.5 3.5c0 1.5-1 2.5-2.5 2.5"/>
                          </svg>
                        ) 
                      },
                      { 
                        id: "Penyandang disabilitas", 
                        title: "Penyandang disabilitas", 
                        icon: (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="4.5" r="2"/>
                            <path d="M10 8.5h3.5l1.5 6h3"/>
                            <path d="M13 14.5a4.5 4.5 0 1 1-4.5-4.5"/>
                          </svg>
                        ) 
                      },
                      { 
                        id: "Tidak ada", 
                        title: "Tidak ada", 
                        icon: (
                          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="9"/>
                            <line x1="5.5" y1="5.5" x2="18.5" y2="18.5"/>
                          </svg>
                        ) 
                      },
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
                            gap: "9px", 
                            fontSize: "0.88rem", 
                            background: isChecked ? "#e8ede7" : "#f5f4ef", 
                            padding: "10px 14px", 
                            borderRadius: "10px", 
                            cursor: isDisabled ? "not-allowed" : "pointer", 
                            border: isChecked ? "1.5px solid #013220" : "1px solid #e2ded4",
                            opacity: isDisabled ? 0.45 : 1,
                            transition: "all 0.15s ease",
                          }}
                        >
                          <input 
                            type="checkbox" 
                            disabled={isDisabled}
                            checked={isChecked} 
                            onChange={() => handleToggleVulnerable(v.id)} 
                            style={{ accentColor: "#013220", width: "16px", height: "16px" }} 
                          />
                          <span style={{ display: "inline-flex", alignItems: "center", color: isChecked ? "#013220" : "#6a7369", flexShrink: 0 }}>
                            {v.icon}
                          </span>
                          <span style={{ fontWeight: isChecked ? 600 : 400, color: isChecked ? "#013220" : "#2d3748" }}>
                            {v.title}
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
                    <div className="form-group" style={{ minWidth: 0 }}>
                      <label className="form-label">{availCfg.label}</label>
                      <CustomSelect
                        value={availabilityCondition}
                        onChange={setAvailabilityCondition}
                        options={availCfg.options}
                        placeholder="-- Pilih Kondisi Ketersediaan --"
                      />
                    </div>
                  );
                })()}

                {/* 4. URGENSI MENURUT PELAPOR */}
                <div className="form-group" style={{ minWidth: 0 }}>
                  <label className="form-label">Seberapa mendesak kebutuhan ini menurut Anda?</label>
                  <CustomSelect
                    value={citizenUrgency}
                    onChange={setCitizenUrgency}
                    options={["Bisa menunggu", "Perlu segera", "Sangat mendesak"]}
                    placeholder="-- Pilih Tingkat Urgensi --"
                  />
                  <small style={{ color: "#758378", marginTop: "6px", display: "block", fontSize: "0.82rem" }}>
                    *Masukan estimasi langsung dari pelapor. Sistem REKSA akan menganalisis data ini dan divalidasi oleh Koordinator Tanggap Bencana Posko BPBD.
                  </small>
                </div>

                {/* 5. DESKRIPSI KONDISI */}
                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                    <label className="form-label" style={{ margin: 0 }}>Jelaskan kondisi yang Anda alami</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={handleDraftConditionWithAi}
                        style={{
                          background: "#f0fdf4",
                          color: "#166534",
                          border: "1px solid #86efac",
                          borderRadius: "8px",
                          padding: "5px 12px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                          transition: "all 0.15s ease",
                        }}
                        title="Susun draf deskripsi kondisi darurat otomatis berbasis data formulir menggunakan REKSA AI"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <span>Buat Draf Kondisi dengan AI</span>
                      </button>
                      <span style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <span>Smart Triage Aktif</span>
                      </span>
                      {aiAppliedFeedback && (
                        <span style={{ fontSize: "0.74rem", color: "#166534", background: "#dcfce7", border: "1px solid #bbf7d0", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                          ✓ {aiAppliedFeedback}
                        </span>
                      )}
                    </div>
                  </div>
                  <textarea 
                    className="form-control textarea" 
                    rows={4}
                    value={conditionDescription} 
                    onChange={(e) => setConditionDescription(e.target.value)} 
                    placeholder="Contoh: Terjebak banjir 1.5 meter, ada 2 lansia dan 1 bayi membutuhkan evakuasi, air bersih dan susu darurat segera... Atau klik tombol 'Buat Draf Kondisi dengan AI' di atas."
                  />

                  {/* AI SMART TRIAGE CARD */}
                  {aiTriage && (
                    <div
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #cbd5e1",
                        borderRadius: "14px",
                        padding: "16px 18px",
                        marginTop: "12px",
                        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", color: "#0f172a", fontWeight: 700, fontSize: "0.86rem" }}>
                          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#013220" }}>
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                          </svg>
                          <span>REKSA AI Smart Triage</span>
                          <span style={{ background: "#e2e8f0", color: "#334155", fontSize: "0.68rem", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                            {aiTriage.confidence}% Akurasi
                          </span>
                        </div>
                        <span
                          style={{
                            background: aiTriage.urgency === "Kritis" ? "#fee2e2" : aiTriage.urgency === "Tinggi" ? "#ffedd5" : "#f1f5f9",
                            color: aiTriage.urgency === "Kritis" ? "#991b1b" : aiTriage.urgency === "Tinggi" ? "#9a3412" : "#334155",
                            border: `1px solid ${aiTriage.urgency === "Kritis" ? "#fca5a5" : aiTriage.urgency === "Tinggi" ? "#fdba74" : "#cbd5e1"}`,
                            fontSize: "0.78rem",
                            fontWeight: 700,
                            padding: "3px 10px",
                            borderRadius: "999px",
                          }}
                        >
                          Prediksi: Prioritas {aiTriage.urgency} (Skor {aiTriage.score}/100)
                        </span>
                      </div>

                      <p style={{ margin: "0 0 10px", fontSize: "0.82rem", color: "#334155", lineHeight: 1.5 }}>
                        {aiTriage.rationale}
                      </p>

                      {/* Detected vulnerable groups chip */}
                      {aiTriage.detectedVulnerables.length > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.76rem", color: "#475569", fontWeight: 700 }}>Kelompok Rentan Terdeteksi:</span>
                          {aiTriage.detectedVulnerables.map((vuln, vIdx) => (
                            <span
                              key={vIdx}
                              style={{
                                background: "#f1f5f9",
                                color: "#334155",
                                border: "1px solid #cbd5e1",
                                fontSize: "0.74rem",
                                padding: "3px 9px",
                                borderRadius: "6px",
                                fontWeight: 600,
                              }}
                            >
                              {vuln}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* CATATAN PANDUAN PENGISIAN KONDISI */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", padding: "14px 18px", borderRadius: "12px", marginTop: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#0f172a", fontWeight: 700, fontSize: "0.84rem" }}>
                    <Icon name="check" /> Fakta Kondisi untuk Analisis REKSA
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: "0.80rem", color: "#64748b", lineHeight: 1.5 }}>
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
                  <label 
                    className="report-upload-box"
                    style={fotoBukti ? {
                      padding: 0,
                      overflow: "hidden",
                      border: "2px solid #013220",
                      background: "#081a11",
                      borderRadius: "18px",
                      position: "relative",
                      minHeight: "220px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer"
                    } : undefined}
                  >
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
                                    const maxDim = 800;
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
                                      const compressed = canvas.toDataURL("image/jpeg", 0.68);
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

                    {fotoBukti ? (
                      <div style={{ position: "relative", width: "100%", height: "100%", minHeight: "220px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <img 
                          src={fotoBukti} 
                          alt="Pratinjau Bukti Lapangan" 
                          style={{ 
                            width: "100%", 
                            maxHeight: "340px", 
                            objectFit: "contain", 
                            display: "block",
                            background: "#0d2116"
                          }} 
                        />
                        <div style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          background: "linear-gradient(to top, rgba(1, 36, 23, 0.95), rgba(1, 36, 23, 0.4) 65%, transparent)",
                          padding: "24px 16px 12px",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          color: "#ffffff",
                          flexWrap: "wrap",
                          gap: "8px",
                          zIndex: 2
                        }}>
                          <span style={{ 
                            display: "inline-flex", 
                            alignItems: "center", 
                            gap: "6px",
                            background: "rgba(255, 255, 255, 0.2)",
                            backdropFilter: "blur(6px)",
                            padding: "4px 12px", 
                            borderRadius: "20px",
                            fontSize: "0.8rem",
                            fontWeight: 600,
                            color: "#ffffff",
                            maxWidth: "70%",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }}>
                            <Icon name="check" /> {fileName || "Foto Berhasil Terunggah"}
                          </span>
                          <span style={{ 
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.8rem", 
                            background: "#ffffff", 
                            color: "#013220", 
                            fontWeight: 700, 
                            padding: "6px 12px", 
                            borderRadius: "8px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
                          }}>
                            <Icon name="edit" /> Ganti Foto
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setFotoBukti(undefined);
                            setFileName("");
                          }}
                          style={{
                            position: "absolute",
                            top: "12px",
                            right: "12px",
                            background: "rgba(0, 0, 0, 0.65)",
                            color: "#ffffff",
                            border: "1px solid rgba(255, 255, 255, 0.35)",
                            borderRadius: "50%",
                            width: "32px",
                            height: "32px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "14px",
                            fontWeight: 700,
                            zIndex: 10,
                            backdropFilter: "blur(4px)"
                          }}
                          title="Hapus Foto"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </label>
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
                    {/* SECTION 1 — KEBUTUHAN & REGULASI BNPB */}
                    <div className="review-item wide" style={{ borderBottom: "1px solid rgba(1, 50, 32, 0.08)", paddingBottom: "8px", marginTop: "4px" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 800, color: "#013220", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                        1. Kebutuhan &amp; Klasifikasi Regulasi BNPB
                      </span>
                    </div>

                    <div className="review-item">
                      <span className="review-label">Kategori Kebutuhan</span>
                      <strong>{category === "Lainnya" && customCategory ? customCategory : category}</strong>
                    </div>
                    {category === "Bantuan Stimulan Rumah (Pasca-Bencana)" && kategoriKerusakanRumah && (
                      <>
                        <div className="review-item">
                          <span className="review-label">Tingkat Kerusakan Rumah</span>
                          <strong style={{ color: "#047857" }}>{kategoriKerusakanRumah}</strong>
                        </div>
                        <div className="review-item">
                          <span className="review-label">Estimasi Stimulan BNPB</span>
                          <strong style={{ color: "#047857" }}>
                            Rp {((parseInt(amount) || 1) * (kategoriKerusakanRumah === "Rusak Berat" ? 60000000 : kategoriKerusakanRumah === "Rusak Sedang" ? 30000000 : 15000000)).toLocaleString("id-ID")},-
                            <small style={{ fontWeight: 400, color: "#64748b" }}> ({parseInt(amount) || 1} Unit)</small>
                          </strong>
                        </div>
                      </>
                    )}
                    <div className="review-item">
                      <span className="review-label">Perkiraan Jumlah Kebutuhan</span>
                      <strong>{amount ? `${amount} ${getUnit()}` : "-"}</strong>
                    </div>

                    <div className="review-item wide">
                      <span className="review-label">Pedoman Standar Regulasi BNPB</span>
                      <p style={{ margin: 0, fontSize: "0.80rem", color: "#2d4a36" }}>
                        {getBnpbStandardNote(category, kategoriKerusakanRumah, amount, affectedPeople)}
                      </p>
                    </div>
                    <div className="review-item wide">
                      <span className="review-label">Deskripsi Kebutuhan &amp; Dampak</span>
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
                disabled={step === 1 || isSubmitting} 
                onClick={() => setStep(step - 1)}
              >
                Kembali
              </Button>
              {Boolean(category || amount || notes || applicantNik || village || affectedPeople !== "") && (
                <button
                  type="button"
                  disabled={isSubmitting}
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
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    textDecoration: "underline",
                    padding: "6px 10px",
                    opacity: isSubmitting ? 0.6 : 1,
                  }}
                >
                  Kosongkan Draf
                </button>
              )}
            </div>
            <Button 
              disabled={isSubmitting}
              onClick={() => { 
                if (step < 5) {
                  setStep(step + 1); 
                } else { 
                  // Cegah pengiriman ganda: tombol hanya bisa ditekan 1x dan langsung disabled
                  if (isSubmittingRef.current) return;
                  isSubmittingRef.current = true;
                  setIsSubmitting(true);

                  const submitData = async () => {
                    const displayCat = category === "Lainnya" && customCategory ? customCategory : (category || "Kebutuhan Darurat");
                    const unit = getUnit();
                    const fullVolume = amount ? `${amount} ${unit}` : "1 Paket";
                    const peopleCount = typeof affectedPeople === "number" && affectedPeople > 0 ? affectedPeople : 1;
                    const finalKK = typeof familyCount === "number" && familyCount > 0 ? familyCount : 1;
                    const vulText = vulnerableList.length > 0 && !vulnerableList.includes("Tidak ada")
                      ? vulnerableList.join(", ")
                      : "Tidak ada";

                    const payload = {
                      citizen_name: state?.userProfile?.name || "Andi Pratama",
                      citizen_phone: state?.userProfile?.phone || "+62 812 4455 0188",
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
                      const apiCall = apiService.createKebutuhan(payload);
                      const timeoutPromise = new Promise<never>((_, reject) =>
                        setTimeout(() => reject(new Error("Timeout (network sync)")), 20000)
                      );
                      const res = await Promise.race([apiCall, timeoutPromise]);
                      if (res && res.success && res.data) {
                        createdDbItem = res.data;
                        if (res.data.kode_kasus) {
                          finalCode = res.data.kode_kasus;
                        }
                      }
                    } catch (e) {
                      console.warn("API create note (using instant local sync):", e);
                    }

                    const now = new Date();
                    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")} WIB`;
                    const v = (payload.desa || createdDbItem?.desa || "Surabaya").trim();
                    const d = (payload.kecamatan || createdDbItem?.kecamatan || "").trim();
                    let k = (payload.kabupaten || createdDbItem?.kabupaten || "Kota Surabaya").trim();
                    const p = (payload.provinsi || createdDbItem?.provinsi || "Jawa Timur").trim();

                    if (k.toLowerCase() === v.toLowerCase() && d && d.toLowerCase().includes("sidoarjo")) {
                      k = "Kabupaten Sidoarjo";
                    }

                    const locParts = [
                      v ? (v.toLowerCase().startsWith("desa") || v.toLowerCase().startsWith("kel") || v.toLowerCase().startsWith("jalan") || v.toLowerCase().startsWith("jl") ? v : `Desa/Kel. ${v}`) : '',
                      d ? (d.toLowerCase().startsWith("kec") ? d : `Kec. ${d}`) : '',
                      k ? (k.toLowerCase().startsWith("kab") || k.toLowerCase().startsWith("kota") ? k : `Kab. ${k}`) : '',
                      p ? (p.toLowerCase().startsWith("prov") ? p : `Prov. ${p}`) : ''
                    ].filter(Boolean);
                    const locStr = locParts.length > 0 ? locParts.join(", ") : `${v}, Kec. ${d || ''}, ${k}`;

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
                      faseDarurat: faseDarurat,
                      skalaWilayah: skalaWilayah,
                      standarBnpbNote: getBnpbStandardNote(displayCat, kategoriKerusakanRumah, amount, affectedPeople),
                      kategoriKerusakanRumah: (category.includes("Stimulan") || category.includes("Rumah")) ? (kategoriKerusakanRumah as any) : undefined,
                      estimasiStimulanNominal: (category.includes("Stimulan") || category.includes("Rumah")) ? estimasiStimulanNominal : undefined,
                    };

                    addUserReportedId(finalCode);

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
                    setIsSubmitting(false);
                    isSubmittingRef.current = false;
                    setSuccess(true);
                  };

                  submitData().catch((err) => {
                    console.error("Gagal submit:", err);
                    isSubmittingRef.current = false;
                    setIsSubmitting(false);
                  });
                } 
              }}
            >
              {step === 5 ? (
                isSubmitting ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <svg 
                      viewBox="0 0 24 24" 
                      width="16" 
                      height="16" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      style={{ animation: "spin 1s linear infinite" }}
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span>Mengirim Laporan...</span>
                  </span>
                ) : (
                  <>
                    Kirim Laporan <Icon name="next" />
                  </>
                )
              ) : (
                <>
                  Lanjutkan <Icon name="next" />
                </>
              )}
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
              <span>Butuh bantuan kedaruratan segera? Hubungi Call Center 112 atau Posko BPBD Wilayah Setempat.</span>
            </div>

            {/* KARTU REFERENSI REGULASI BNPB & BPBD */}
            <div style={{ background: "rgba(255, 255, 255, 0.07)", border: "1px solid rgba(255, 255, 255, 0.14)", borderRadius: "14px", padding: "16px", marginTop: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 700, fontSize: "0.82rem", color: "#ffffff", marginBottom: "10px" }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "#a7f3d0" }}>
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
                <span>Pedoman Regulasi BNPB &amp; BPBD</span>
              </div>
              <div style={{ fontSize: "0.76rem", color: "rgba(255, 255, 255, 0.88)", lineHeight: 1.45, display: "flex", flexDirection: "column", gap: "10px" }}>
                <div>
                  <strong style={{ color: "#ffffff", display: "block" }}>Perka BNPB No. 7/2008</strong>
                  <p style={{ margin: "2px 0 0", color: "rgba(255, 255, 255, 0.72)" }}>
                    Standar minimal kebutuhan dasar: Pangan 400g beras/2.100 kkal, Air Minum 2.5L, Sanitasi 7-15L, &amp; Huntara min 3 m²/jiwa.
                  </p>
                </div>
                <div>
                  <strong style={{ color: "#ffffff", display: "block" }}>Kepka BNPB No. 296A/2023</strong>
                  <p style={{ margin: "2px 0 0", color: "rgba(255, 255, 255, 0.72)" }}>
                    Stimulan perbaikan rumah korban: Rusak Berat (Rp60 Jt), Rusak Sedang (Rp30 Jt), Rusak Ringan (Rp15 Jt).
                  </p>
                </div>
                <div>
                  <strong style={{ color: "#ffffff", display: "block" }}>3 Skala Wilayah Kewenangan</strong>
                  <p style={{ margin: "2px 0 0", color: "rgba(255, 255, 255, 0.72)" }}>
                    Tingkat Kab/Kota (BPBD Kab/Kota) → Provinsi (BPBD Prov) → Nasional (BNPB Pusat &amp; Dana Siap Pakai / DSP).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
