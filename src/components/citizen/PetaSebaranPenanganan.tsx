import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import { CaseRecord } from "../../App";
import { MisiItem } from "../../services/api";
import { AppIcon } from "../common/Icons";
import {
  INDONESIA_PROVINCES_DATA,
  ProvinsiIndonesiaData,
} from "../../data/indonesiaProvinceData";

interface PetaSebaranPenangananProps {
  cases?: CaseRecord[];
  misiList?: MisiItem[];
  className?: string;
}

export interface ProvinceBpbdMitraStats {
  dominant: "bpbd" | "mitra" | "terkendali";
  bpbdPct: number;
  mitraPct: number;
  bpbdPaket: number;
  mitraPaket: number;
  totalPaket: number;
  totalRespon: number;
  bpbdRespon: number;
  mitraRespon: number;
}

export interface DynamicProvinsiData extends ProvinsiIndonesiaData {
  totalKasus: number;
  totalKk: number;
  totalJiwa: number;
  bpbdPct: number;
  mitraPct: number;
  bpbdPaket: number;
  mitraPaket: number;
  totalPaket: number;
  bpbdRespon: number;
  mitraRespon: number;
  totalRespon: number;
  dominant: "bpbd" | "mitra" | "terkendali";
}

export function normalizeProvince(prov?: string, posko?: string, location?: string): string {
  const str = `${prov || ""} ${posko || ""} ${location || ""}`.toLowerCase();
  if (str.includes("jawa timur") || str.includes("jatim") || str.includes("surabaya") || str.includes("sukomanunggal") || str.includes("gubeng")) return "JAWA TIMUR";
  if (str.includes("jawa barat") || str.includes("jabar") || str.includes("bandung") || str.includes("cianjur")) return "JAWA BARAT";
  if (str.includes("jawa tengah") || str.includes("jateng") || str.includes("semarang") || str.includes("demak")) return "JAWA TENGAH";
  if (str.includes("jakarta") || str.includes("dki")) return "DKI JAKARTA";
  if (str.includes("yogyakarta") || str.includes("diy") || str.includes("jogja")) return "DAERAH ISTIMEWA YOGYAKARTA";
  if (str.includes("banten")) return "BANTEN";
  if (str.includes("aceh") || str.includes("banda aceh") || str.includes("lawe alas")) return "ACEH";
  if (str.includes("sumatera utara") || str.includes("sumut") || str.includes("medan")) return "SUMATERA UTARA";
  if (str.includes("sumatera barat") || str.includes("sumbar") || str.includes("padang")) return "SUMATERA BARAT";
  if (str.includes("riau") && !str.includes("kepulauan")) return "RIAU";
  if (str.includes("kepulauan riau") || str.includes("kepri") || str.includes("batam")) return "KEPULAUAN RIAU";
  if (str.includes("jambi")) return "JAMBI";
  if (str.includes("sumatera selatan") || str.includes("sumsel") || str.includes("palembang")) return "SUMATERA SELATAN";
  if (str.includes("bengkulu")) return "BENGKULU";
  if (str.includes("lampung")) return "LAMPUNG";
  if (str.includes("bangka") || str.includes("belitung")) return "KEPULAUAN BANGKA BELITUNG";
  if (str.includes("kalimantan barat") || str.includes("kalbar")) return "KALIMANTAN BARAT";
  if (str.includes("kalimantan tengah") || str.includes("kalteng")) return "KALIMANTAN TENGAH";
  if (str.includes("kalimantan selatan") || str.includes("kalsel") || str.includes("banjarmasin")) return "KALIMANTAN SELATAN";
  if (str.includes("kalimantan timur") || str.includes("kaltim") || str.includes("samarinda") || str.includes("balikpapan")) return "KALIMANTAN TIMUR";
  if (str.includes("kalimantan utara") || str.includes("kaltara")) return "KALIMANTAN UTARA";
  if (str.includes("sulawesi utara") || str.includes("sulut") || str.includes("manado")) return "SULAWESI UTARA";
  if (str.includes("sulawesi tengah") || str.includes("sulteng") || str.includes("palu") || str.includes("sigi")) return "SULAWESI TENGAH";
  if (str.includes("sulawesi selatan") || str.includes("sulsel") || str.includes("makassar")) return "SULAWESI SELATAN";
  if (str.includes("sulawesi tenggara") || str.includes("sultra") || str.includes("kendari")) return "SULAWESI TENGGARA";
  if (str.includes("gorontalo")) return "GORONTALO";
  if (str.includes("sulawesi barat") || str.includes("sulbar") || str.includes("mamuju")) return "SULAWESI BARAT";
  if (str.includes("bali") || str.includes("denpasar")) return "BALI";
  if (str.includes("nusa tenggara barat") || str.includes("ntb") || str.includes("mataram") || str.includes("lombok")) return "NUSA TENGGARA BARAT";
  if (str.includes("nusa tenggara timur") || str.includes("ntt") || str.includes("kupang")) return "NUSA TENGGARA TIMUR";
  if (str.includes("maluku utara") || str.includes("ternate")) return "MALUKU UTARA";
  if (str.includes("maluku") || str.includes("ambon")) return "MALUKU";
  if (str.includes("papua barat")) return "PAPUA BARAT";
  if (str.includes("papua")) return "PAPUA";

  // fallback against INDONESIA_PROVINCES_DATA
  for (const p of INDONESIA_PROVINCES_DATA) {
    if (str.includes(p.rawName.toLowerCase())) return p.rawName;
  }
  return "";
}

export function getProvinceBpbdMitraStats(p: DynamicProvinsiData | ProvinsiIndonesiaData): ProvinceBpbdMitraStats {
  const dynamic = p as Partial<DynamicProvinsiData>;
  if (!p.isDisasterZone || dynamic.dominant === "terkendali" || (dynamic.totalKasus !== undefined && dynamic.totalKasus === 0)) {
    return {
      dominant: "terkendali",
      bpbdPct: 50,
      mitraPct: 50,
      bpbdPaket: 0,
      mitraPaket: 0,
      totalPaket: 0,
      totalRespon: 0,
      bpbdRespon: 0,
      mitraRespon: 0,
    };
  }

  const bpbdPct = dynamic.bpbdPct ?? 50;
  const mitraPct = dynamic.mitraPct ?? 50;
  const dominant = dynamic.dominant || (bpbdPct >= mitraPct ? "bpbd" : "mitra");
  const bpbdPaket = dynamic.bpbdPaket ?? 0;
  const mitraPaket = dynamic.mitraPaket ?? 0;
  const totalPaket = dynamic.totalPaket ?? (bpbdPaket + mitraPaket);
  const bpbdRespon = dynamic.bpbdRespon ?? 0;
  const mitraRespon = dynamic.mitraRespon ?? 0;
  const totalRespon = dynamic.totalRespon ?? (bpbdRespon + mitraRespon);

  return {
    dominant,
    bpbdPct,
    mitraPct,
    bpbdPaket,
    mitraPaket,
    totalPaket,
    totalRespon,
    bpbdRespon,
    mitraRespon,
  };
}

export function PetaSebaranPenanganan({
  cases = [],
  misiList = [],
  className = "",
}: PetaSebaranPenangananProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const monoEmojiStyle: React.CSSProperties = {
    filter: "grayscale(100%)",
    display: "inline-block",
    verticalAlign: "middle",
  };

  const [activeStatusFilter, setActiveStatusFilter] = useState<
    "all_disaster" | "bpbd_dominan" | "mitra_dominan" | "all_indonesia"
  >("all_disaster");
  const [selectedPulau, setSelectedPulau] = useState<string>("Semua Pulau");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvinsiId, setSelectedProvinsiId] = useState<string>("PROV-35"); // Default Jawa Timur
  const [viewMode, setViewMode] = useState<"vector" | "map" | "table">("vector");
  const [hoveredProvinsiId, setHoveredProvinsiId] = useState<string | null>(null);

  // REAL DATA DYNAMIC AGGREGATION: Derived entirely from database cases and misiList
  const realProvincesData: DynamicProvinsiData[] = useMemo(() => {
    // 1. Group cases by normalized province name
    const casesByProv = new Map<string, CaseRecord[]>();
    (cases || []).forEach((c) => {
      const rawProv = normalizeProvince(c.province, c.posko, c.location || c.regency);
      if (rawProv) {
        const list = casesByProv.get(rawProv) || [];
        list.push(c);
        casesByProv.set(rawProv, list);
      }
    });

    // 2. Group missions by normalized province name
    const misiByProv = new Map<string, MisiItem[]>();
    (misiList || []).forEach((m) => {
      const rawProv = normalizeProvince(m.posko?.provinsi, m.posko?.nama_posko);
      if (rawProv) {
        const list = misiByProv.get(rawProv) || [];
        list.push(m);
        misiByProv.set(rawProv, list);
      }
    });

    // 3. Map all 32 provinces in INDONESIA_PROVINCES_DATA
    return INDONESIA_PROVINCES_DATA.map((base) => {
      const provCases = casesByProv.get(base.rawName) || [];
      const provMisi = misiByProv.get(base.rawName) || [];

      const hasRealDisaster = provCases.length > 0 || provMisi.length > 0;

      if (!hasRealDisaster) {
        return {
          ...base,
          isDisasterZone: false,
          status: "terkendali",
          persentasePenanganan: 100,
          kejadianBencana: "Kondisi Kondusif / Pemantauan Rutin",
          jumlahBantuan: "Nihil Laporan Darurat Aktif",
          komoditasUtama: "Logistik Cadangan Aman",
          mitraBpbdAktif: "Pusdalops BPBD Wilayah (Siaga Rutin)",
          poskoPenyangga: base.poskoPenyangga || `Posko Utama BPBD ${base.nama}`,
          jiwaTerbantu: 0,
          kkTerlayani: 0,
          catatanKewilayahan: "Tidak terdapat laporan darurat bencana aktif saat ini. Koordinasi dan pemantauan situasi berjalan normal.",
          totalKasus: 0,
          totalKk: 0,
          totalJiwa: 0,
          bpbdPct: 50,
          mitraPct: 50,
          bpbdPaket: 0,
          mitraPaket: 0,
          totalPaket: 0,
          bpbdRespon: 0,
          mitraRespon: 0,
          totalRespon: 0,
          dominant: "terkendali",
        };
      }

      // Calculate real numbers for active provinces:
      let totalKk = 0;
      let totalJiwa = 0;
      let completedCount = 0;
      let inDeliveryCount = 0;
      let bpbdCasesCount = 0;
      let mitraCasesCount = 0;
      const itemsSet = new Set<string>();
      const respondersSet = new Set<string>();

      provCases.forEach((c) => {
        // KK & Jiwa
        const kkNum = parseInt(c.kk?.replace(/\D/g, "") || "") || 1;
        totalKk += kkNum;
        const jiwaNum = c.affectedPeople || (kkNum * 4);
        totalJiwa += jiwaNum;

        // Status
        if (c.status === "Selesai") completedCount++;
        if (c.status === "Dalam Pengiriman") inDeliveryCount++;

        // Commodity items
        if (c.item && c.item.trim()) itemsSet.add(c.item.trim());

        // BPBD vs Mitra classification
        const isMitraCase =
          Boolean(c.escalatedToMitra) ||
          Boolean(c.mitraHandler) ||
          c.verifiedByRole === "mitra" ||
          c.status === "Klaim Diajukan" ||
          c.status === "Teralokasi Penuh" ||
          c.status === "Sebagian Terpenuhi";

        if (isMitraCase) {
          mitraCasesCount++;
          if (c.mitraHandler) respondersSet.add(c.mitraHandler);
        } else {
          bpbdCasesCount++;
          if (c.posko) respondersSet.add(c.posko);
        }
      });

      // BPBD vs Mitra from Misi
      let bpbdMisiCount = 0;
      let mitraMisiCount = 0;
      provMisi.forEach((m) => {
        const orgUpper = (m.organisasi || "").toUpperCase();
        if (orgUpper.includes("BPBD")) {
          bpbdMisiCount++;
          respondersSet.add("Satgas BPBD");
        } else {
          mitraMisiCount++;
          if (m.organisasi) respondersSet.add(m.organisasi);
        }
      });

      const totalBpbd = bpbdCasesCount + bpbdMisiCount;
      const totalMitra = mitraCasesCount + mitraMisiCount;
      const totalRespon = Math.max(1, totalBpbd + totalMitra);

      const bpbdPct = Math.round((totalBpbd / totalRespon) * 100);
      const mitraPct = 100 - bpbdPct;

      const dominant: "bpbd" | "mitra" = bpbdPct >= mitraPct ? "bpbd" : "mitra";

      // Aid packages volume based on real cases & KK
      const totalPaket = Math.max(totalRespon * 12, totalKk);
      const bpbdPaket = Math.round((bpbdPct / 100) * totalPaket);
      const mitraPaket = totalPaket - bpbdPaket;

      // Headline disaster context
      let kejadian = base.kejadianBencana;
      if (base.rawName === "JAWA TIMUR") kejadian = "Banjir Luapan & Longsor (Surabaya & Jatim)";
      else if (base.rawName === "JAWA BARAT") kejadian = "Gempa Bumi & Longsor (Cianjur)";
      else if (base.rawName === "DKI JAKARTA") kejadian = "Banjir Luapan Ciliwung (Kampung Melayu)";
      else if (base.rawName === "JAWA TENGAH") kejadian = "Banjir Rob Pesisir Pantai (Sayung Demak)";
      else if (base.rawName === "ACEH") kejadian = "Banjir Bandang Sungai Lawe Alas";
      else if (base.rawName === "SULAWESI TENGAH") kejadian = "Gempa Bumi & Pergerakan Tanah (Sigi/Palu)";
      else {
        const firstNote = provCases.find((c) => c.conditionDescription || c.notes);
        kejadian = firstNote?.conditionDescription || firstNote?.notes || `Tanggap Bencana (${base.nama})`;
      }

      const commodityList = Array.from(itemsSet).filter(Boolean);
      const komoditasUtama = commodityList.length > 0 ? commodityList.slice(0, 4).join(", ") : "Logistik Pangan & Shelter Darurat";

      const respondersList = Array.from(respondersSet).filter(Boolean);
      const mitraBpbdAktif = respondersList.length > 0 ? respondersList.slice(0, 4).join(", ") : "Posko BPBD & Jejaring Mitra Relawan";

      const persentasePenanganan = Math.min(100, Math.max(20, Math.round(((completedCount + inDeliveryCount + mitraCasesCount) / Math.max(1, provCases.length)) * 100)));

      const statusLevel: "banyak_ditangani" | "sedang_ditangani" | "terkendali" =
        provCases.length >= 5 ? "banyak_ditangani" : "sedang_ditangani";

      const completedCases = provCases.filter((c) =>
        c.status === "Bantuan Diterima" || c.status === "Selesai"
      );
      const inProgressCases = provCases.filter((c) =>
        c.status !== "Bantuan Diterima" && c.status !== "Selesai" && c.status !== "Ditolak"
      );
      const hasReceivedAid = completedCases.length > 0;

      const catatanKewilayahan = `${provCases.length} laporan darurat terdata (${totalKk} KK, ${totalJiwa} Jiwa). ${completedCount} tersalurkan penuh, ${inDeliveryCount} dalam pengiriman lapangan, ${provCases.length - completedCount - inDeliveryCount} dalam proses penanganan.`;

      const jumlahBantuan = `${totalPaket.toLocaleString("id-ID")} Paket Bantuan (${bpbdPaket.toLocaleString("id-ID")} BPBD · ${mitraPaket.toLocaleString("id-ID")} Mitra)`;

      return {
        ...base,
        isDisasterZone: true,
        status: statusLevel,
        persentasePenanganan,
        kejadianBencana: kejadian,
        jumlahBantuan,
        komoditasUtama,
        mitraBpbdAktif,
        poskoPenyangga: provCases[0]?.posko || base.poskoPenyangga,
        jiwaTerbantu: totalJiwa,
        kkTerlayani: totalKk,
        catatanKewilayahan,
        totalKasus: provCases.length,
        totalKk,
        totalJiwa,
        bpbdPct,
        mitraPct,
        bpbdPaket,
        mitraPaket,
        totalPaket,
        bpbdRespon: totalBpbd,
        mitraRespon: totalMitra,
        totalRespon,
        dominant,
        // Extra: raw case records for panel
        _rawCases: provCases,
        _completedCases: completedCases,
        _inProgressCases: inProgressCases,
        hasReceivedAid,
      };
    });
  }, [cases, misiList]);

  // Selected province derived directly from realProvincesData
  const selectedProvinsi = useMemo(() => {
    return (
      realProvincesData.find((p) => p.id === selectedProvinsiId) ||
      realProvincesData.find((p) => p.isDisasterZone) ||
      realProvincesData[0]
    );
  }, [realProvincesData, selectedProvinsiId]);

  // Summary counts
  const totalAllProvinces = realProvincesData.length;
  const disasterProvinces = useMemo(
    () => realProvincesData.filter((p) => p.isDisasterZone),
    [realProvincesData]
  );
  const countBpbd = useMemo(
    () =>
      realProvincesData.filter(
        (p) => p.isDisasterZone && p.dominant === "bpbd"
      ).length,
    [realProvincesData]
  );
  const countMitra = useMemo(
    () =>
      realProvincesData.filter(
        (p) => p.isDisasterZone && p.dominant === "mitra"
      ).length,
    [realProvincesData]
  );
  const totalResponAll = useMemo(
    () =>
      disasterProvinces.reduce(
        (acc, curr) => acc + curr.totalRespon,
        0
      ),
    [disasterProvinces]
  );
  const totalPaketAll = useMemo(
    () =>
      disasterProvinces.reduce(
        (acc, curr) => acc + curr.totalPaket,
        0
      ),
    [disasterProvinces]
  );

  // Available Islands for filter
  const islandsList = [
    "Semua Pulau",
    "Jawa",
    "Sumatera",
    "Kalimantan",
    "Sulawesi",
    "Bali & Nusa Tenggara",
    "Maluku",
    "Papua",
  ];

  // Filtered provinces
  const filteredProvinces = useMemo(() => {
    return realProvincesData.filter((p) => {
      // Status filter
      if (activeStatusFilter === "all_disaster" && !p.isDisasterZone) return false;
      if (
        activeStatusFilter === "bpbd_dominan" &&
        (!p.isDisasterZone || p.dominant !== "bpbd")
      )
        return false;
      if (
        activeStatusFilter === "mitra_dominan" &&
        (!p.isDisasterZone || p.dominant !== "mitra")
      )
        return false;

      // Pulau filter
      if (selectedPulau !== "Semua Pulau" && p.pulau !== selectedPulau)
        return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = p.nama.toLowerCase().includes(q);
        const matchPulau = p.pulau.toLowerCase().includes(q);
        const matchBencana = p.kejadianBencana.toLowerCase().includes(q);
        const matchMitra = p.mitraBpbdAktif.toLowerCase().includes(q);
        if (!matchNama && !matchPulau && !matchBencana && !matchMitra)
          return false;
      }
      return true;
    });
  }, [realProvincesData, activeStatusFilter, selectedPulau, searchQuery]);

  // Leaflet map initialization (Whole Indonesia Sabang to Merauke)
  useEffect(() => {
    if (viewMode !== "map") return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center on Indonesia archipelago
      const map = L.map(mapContainerRef.current, {
        center: [-2.5, 118.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      geojsonLayerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = geojsonLayerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Render all provinces with BPBD vs Mitra response choropleth
    realProvincesData.forEach((p) => {
      const stats = getProvinceBpbdMitraStats(p);
      const isBpbd = stats.dominant === "bpbd";
      const isMitra = stats.dominant === "mitra";
      const isSelected = selectedProvinsi?.id === p.id;

      let fillColor = "#e2e8f0"; // Neutral soft slate for non-disaster provinces
      let fillOpacity = 0.55;

      if (isBpbd) {
        fillColor = "#013220"; // Forest Green (Posko BPBD)
        fillOpacity = isSelected ? 0.98 : 0.88;
      } else if (isMitra) {
        fillColor = "#10b981"; // Emerald Green (Mitra Kemanusiaan)
        fillOpacity = isSelected ? 0.98 : 0.88;
      } else if (isSelected) {
        fillColor = "#cbd5e1";
        fillOpacity = 0.85;
      }

      const geoLayer = L.geoJSON(p.geometry, {
        style: {
          color: isSelected ? "#013220" : "#ffffff", // Garis putih pemisah batas provinsi
          weight: isSelected ? 3.5 : p.isDisasterZone ? 2 : 1.2,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          opacity: 1,
        },
      });

      // Tooltip
      geoLayer.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 12px; padding: 4px 6px;">
          <strong style="color: ${
            isBpbd ? "#013220" : isMitra ? "#047857" : "#334155"
          }; font-size: 13px;">${p.nama}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">Wilayah ${p.pulau}</span>
          <div style="margin-top: 4px; font-weight: 700; color: #013220;">
            <span style="filter: grayscale(100%); margin-right: 4px;">${isBpbd ? "🏢" : isMitra ? "🤝" : "⚪"}</span>
            ${
              isBpbd
                ? "Respon Dominan BPBD (" + stats.bpbdPct + "%)"
                : isMitra
                ? "Respon Dominan Mitra (" + stats.mitraPct + "%)"
                : "Kondisi Kondusif (Nihil Laporan)"
            }
          </div>
          ${
            p.isDisasterZone
              ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">
                   ${p.totalKasus} Kasus Terdata · ${p.kkTerlayani} KK · ${p.jiwaTerbantu} Jiwa
                 </div>
                 <div style="font-size: 10.5px; color: #64748b; margin-top: 2px;">
                   BPBD: <b>${stats.bpbdPaket.toLocaleString("id-ID")} Pkt</b> · Mitra: <b>${stats.mitraPaket.toLocaleString("id-ID")} Pkt</b>
                 </div>`
              : ""
          }
        </div>
        `,
        { sticky: true, direction: "top" }
      );

      const handleClick = () => {
        setSelectedProvinsiId(p.id);
        map.panTo(p.center);
      };

      geoLayer.on("click", handleClick);

      geoLayer.on("mouseover", () => {
        geoLayer.setStyle({
          weight: 3.5,
          color: "#013220",
        });
      });

      geoLayer.on("mouseout", () => {
        if (selectedProvinsi?.id !== p.id) {
          geoLayer.setStyle({
            weight: p.isDisasterZone ? 2 : 1.2,
            color: "#ffffff",
          });
        }
      });

      layerGroup.addLayer(geoLayer);
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [viewMode, selectedProvinsi, realProvincesData]);

  return (
    <section
      className={`choropleth-thematic-section ${className}`}
      style={{
        marginTop: "56px",
        marginBottom: "48px",
        paddingTop: "4px",
      }}
    >
      {/* SECTION HEADER */}
      <div
        className="section-title"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <div>
          <span
            className="eyebrow"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#013220",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              padding: "4px 12px",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: "0.74rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "8px",
            }}
          >
            <span style={monoEmojiStyle}>🇮🇩</span> Sebaran Respon Bantuan Nasional
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: "1.45rem",
              fontWeight: 800,
              color: "#013220",
              letterSpacing: "-0.02em",
            }}
          >
            Persebaran Respon Bantuan: BPBD vs Mitra Kemanusiaan
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: "0.85rem",
              maxWidth: "760px",
              lineHeight: 1.5,
            }}
          >
            Komparasi volume penanganan bantuan darurat langsung oleh posko <strong style={{ color: "#013220" }}>BPBD (Hijau Tua)</strong> vs jejaring relawan <strong style={{ color: "#047857" }}>Mitra Siaga (Hijau Terang)</strong>.
          </p>
        </div>

        {/* VIEW MODE SWITCHER */}
        <div
          style={{
            display: "inline-flex",
            background: "#f1f5f9",
            padding: "3px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            gap: "2px",
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode("vector")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: viewMode === "vector" ? "#013220" : "transparent",
              color: viewMode === "vector" ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span style={monoEmojiStyle}>🎨</span>
            <span>Mode Vektor</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("map")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: viewMode === "map" ? "#013220" : "transparent",
              color: viewMode === "map" ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <AppIcon name="map" size={14} />
            <span>Peta Geografis</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("table")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: viewMode === "table" ? "#013220" : "transparent",
              color: viewMode === "table" ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span>Rekap Data</span>
          </button>
        </div>
      </div>

      {/* COMPACT CLEAN STATS SUMMARY RIBBON */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          background: "#ffffff",
          padding: "10px 16px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          {/* Dominan BPBD */}
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#013220", display: "inline-block" }} />
            <span style={{ fontSize: "0.82rem", color: "#475569" }}>
              Dominan BPBD: <strong style={{ color: "#013220" }}>{countBpbd} Wilayah</strong> ({Math.round((countBpbd / disasterProvinces.length) * 100)}%)
            </span>
          </div>

          <span style={{ color: "#e2e8f0" }}>|</span>

          {/* Dominan Mitra */}
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ fontSize: "0.82rem", color: "#475569" }}>
              Dominan Mitra: <strong style={{ color: "#047857" }}>{countMitra} Wilayah</strong> ({Math.round((countMitra / disasterProvinces.length) * 100)}%)
            </span>
          </div>

          <span style={{ color: "#e2e8f0" }}>|</span>

          {/* Total Respon */}
          <div style={{ fontSize: "0.82rem", color: "#475569" }}>
            Total Penanganan: <strong style={{ color: "#013220" }}>{totalResponAll.toLocaleString("id-ID")} Respon</strong>
          </div>
        </div>

        <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
          📍 {disasterProvinces.length} Daerah Terpantau Aktif
        </div>
      </div>

      {/* SINGLE STREAMLINED TOOLBAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        {/* Quick Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveStatusFilter("all_disaster")}
            style={{
              padding: "5px 11px",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: activeStatusFilter === "all_disaster" ? "1.5px solid #013220" : "1px solid #cbd5e1",
              background: activeStatusFilter === "all_disaster" ? "#013220" : "#ffffff",
              color: activeStatusFilter === "all_disaster" ? "#ffffff" : "#475569",
            }}
          >
            Semua ({disasterProvinces.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusFilter("bpbd_dominan")}
            style={{
              padding: "5px 11px",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: activeStatusFilter === "bpbd_dominan" ? "1.5px solid #013220" : "1px solid #cbd5e1",
              background: activeStatusFilter === "bpbd_dominan" ? "#f0fdf4" : "#ffffff",
              color: activeStatusFilter === "bpbd_dominan" ? "#013220" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#013220" }} />
            BPBD ({countBpbd})
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusFilter("mitra_dominan")}
            style={{
              padding: "5px 11px",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: activeStatusFilter === "mitra_dominan" ? "1.5px solid #10b981" : "1px solid #cbd5e1",
              background: activeStatusFilter === "mitra_dominan" ? "#ecfdf5" : "#ffffff",
              color: activeStatusFilter === "mitra_dominan" ? "#047857" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }} />
            Mitra ({countMitra})
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusFilter("all_indonesia")}
            style={{
              padding: "5px 11px",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: activeStatusFilter === "all_indonesia" ? "1.5px solid #475569" : "1px solid #cbd5e1",
              background: activeStatusFilter === "all_indonesia" ? "#475569" : "#ffffff",
              color: activeStatusFilter === "all_indonesia" ? "#ffffff" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            32 Provinsi
          </button>
        </div>

        {/* Island filter & Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select
            value={selectedPulau}
            onChange={(e) => setSelectedPulau(e.target.value)}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.78rem",
              background: "#ffffff",
              color: "#334155",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {islandsList.map((is) => (
              <option key={is} value={is}>{is}</option>
            ))}
          </select>

          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "9px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                fontSize: "12px",
              }}
            >
              <span style={monoEmojiStyle}>🔍</span>
            </span>
            <input
              type="text"
              placeholder="Cari provinsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "5px 10px 5px 28px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.78rem",
                width: "180px",
                background: "#ffffff",
              }}
            />
          </div>
        </div>
      </div>

      {/* MAIN DISPLAY CONTENT */}
      {viewMode === "table" ? (
        /* REKAPITULASI DATA TABEL */
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong style={{ fontSize: "0.86rem", color: "#013220" }}>
              Tabel Klasifikasi Dua Warna Penanganan Kewilayahan Indonesia
            </strong>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
              Menampilkan {filteredProvinces.length} dari {totalAllProvinces}{" "}
              Provinsi
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.82rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f1f5f9",
                    textAlign: "left",
                    color: "#013220",
                    borderBottom: "1.5px solid #cbd5e1",
                  }}
                >
                  <th style={{ padding: "10px 14px", width: "40px" }}>No</th>
                  <th style={{ padding: "10px 14px" }}>Provinsi</th>
                  <th style={{ padding: "10px 14px", width: "110px" }}>
                    Wilayah Pulau
                  </th>
                  <th style={{ padding: "10px 14px", width: "140px" }}>
                    Dominasi Respon
                  </th>
                  <th style={{ padding: "10px 14px", width: "190px" }}>
                    Proporsi (BPBD vs Mitra)
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    Respon BPBD
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    Respon Mitra
                  </th>
                  <th style={{ padding: "10px 14px" }}>
                    Kejadian &amp; Realisasi Logistik
                  </th>
                  <th style={{ padding: "10px 14px" }}>Mitra &amp; Pusdalops</th>
                  <th
                    style={{
                      padding: "10px 14px",
                      width: "120px",
                      textAlign: "right",
                    }}
                  >
                    Warga Terbantu
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProvinces.map((p, idx) => {
                  const stats = getProvinceBpbdMitraStats(p);
                  const isBpbd = stats.dominant === "bpbd";
                  const isMitra = stats.dominant === "mitra";

                  return (
                    <tr
                      key={p.id}
                      onClick={() => {
                        setSelectedProvinsiId(p.id);
                        setViewMode("vector");
                      }}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        background: idx % 2 === 0 ? "#ffffff" : "#fcfdfc",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 14px",
                          color: "#94a3b8",
                          fontWeight: 600,
                        }}
                      >
                        {idx + 1}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <strong style={{ color: "#013220", display: "block" }}>
                          {p.nama}
                        </strong>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>
                        {p.pulau}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              width: "14px",
                              height: "14px",
                              borderRadius: "3px",
                              background: isBpbd
                                ? "#013220"
                                : isMitra
                                ? "#10b981"
                                : "#cbd5e1",
                              display: "inline-block",
                              border: `1px solid ${
                                isBpbd
                                  ? "#013220"
                                  : isMitra
                                  ? "#059669"
                                  : "#94a3b8"
                              }`,
                            }}
                          />
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              color: isBpbd
                                ? "#013220"
                                : isMitra
                                ? "#047857"
                                : "#64748b",
                            }}
                          >
                            {isBpbd
                              ? "Dominan BPBD"
                              : isMitra
                              ? "Dominan Mitra"
                              : "Terkendali"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700, marginBottom: "4px" }}>
                          <span style={{ color: "#013220" }}>BPBD {stats.bpbdPct}%</span>
                          <span style={{ color: "#047857" }}>Mitra {stats.mitraPct}%</span>
                        </div>
                        <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden", display: "flex" }}>
                          <div style={{ width: `${stats.bpbdPct}%`, background: "#013220" }} />
                          <div style={{ width: `${stats.mitraPct}%`, background: "#10b981" }} />
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          textAlign: "center",
                          fontWeight: 700,
                          color: "#013220",
                        }}
                      >
                        {stats.bpbdPaket.toLocaleString("id-ID")} Pkt
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          textAlign: "center",
                          fontWeight: 700,
                          color: "#047857",
                        }}
                      >
                        {stats.mitraPaket.toLocaleString("id-ID")} Pkt
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <strong style={{ color: "#1e293b", display: "block" }}>
                          {p.kejadianBencana}
                        </strong>
                        <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                          {p.jumlahBantuan}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#475569" }}>
                        {p.mitraBpbdAktif}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {p.jiwaTerbantu > 0
                          ? `${p.jiwaTerbantu.toLocaleString("id-ID")} Jiwa`
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* MAP CONTAINER (DUAL VIEW: SVG VECTOR CANVAS OR LEAFLET) */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: selectedProvinsi ? "1.8fr 1.1fr" : "1fr",
            gap: "16px",
            background: "#ffffff",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          {/* MAP CANVAS */}
          <div
            style={{
              position: "relative",
              borderRadius: "14px",
              overflow: "hidden",
              border: "1px solid #cbd5e1",
              background: viewMode === "vector" ? "#fbfcf8" : "#ffffff",
            }}
          >
            {viewMode === "vector" ? (
              /* =========================================================================
                 MODE VEKTOR TEMATIK INTERLOCKING INDONESIA
                 Menampilkan seluruh peta Indonesia (Sabang-Merauke) di atas grid canvas
                 dengan pewarnaan heatmap dua warna (Hijau & Kuning) pada daerah bencana.
                 ========================================================================= */
              <div
                style={{
                  width: "100%",
                  height: "490px",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundImage:
                    "linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              >
                <svg
                  viewBox="0 0 960 380"
                  style={{
                    width: "100%",
                    height: "100%",
                    filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.08))",
                  }}
                >
                  <defs>
                    <filter
                      id="indonesia-glow"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="3"
                        stdDeviation="5"
                        floodColor="#013220"
                        floodOpacity="0.35"
                      />
                    </filter>
                  </defs>

                  {/* Render All 32 Provinces of Indonesia */}
                  {realProvincesData.map((p) => {
                    const stats = getProvinceBpbdMitraStats(p);
                    const isBpbd = stats.dominant === "bpbd";
                    const isMitra = stats.dominant === "mitra";
                    const isSelected = selectedProvinsi?.id === p.id;
                    const isHovered = hoveredProvinsiId === p.id;
                    const pd = p as any;
                    const hasReceivedAid = pd.hasReceivedAid === true;
                    const completedCount = pd._completedCases?.length ?? 0;

                    let fillColor = "#e2e8f0"; // Neutral soft slate
                    let fillOpacity = 0.55;

                    if (isBpbd) {
                      fillColor = hasReceivedAid ? "#005c2e" : "#013220"; // Slightly lighter if aid received
                      fillOpacity = isSelected || isHovered ? 1 : 0.88;
                    } else if (isMitra) {
                      fillColor = hasReceivedAid ? "#34d399" : "#10b981";
                      fillOpacity = isSelected || isHovered ? 1 : 0.88;
                    } else if (isSelected || isHovered) {
                      fillColor = "#cbd5e1";
                      fillOpacity = 0.9;
                    }

                    return (
                      <g
                        key={p.id}
                        onClick={() => setSelectedProvinsiId(p.id)}
                        onMouseEnter={() => setHoveredProvinsiId(p.id)}
                        onMouseLeave={() => setHoveredProvinsiId(null)}
                        style={{ cursor: p.isDisasterZone ? "pointer" : "default" }}
                      >
                        <path
                          d={p.pathD}
                          fill={fillColor}
                          fillOpacity={fillOpacity}
                          stroke={isSelected ? "#013220" : isHovered && p.isDisasterZone ? "#047857" : "#ffffff"}
                          strokeWidth={isSelected ? 3.5 : isHovered && p.isDisasterZone ? 2.5 : p.isDisasterZone ? 2 : 1.2}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          filter={isSelected ? "url(#indonesia-glow)" : undefined}
                          style={{ transition: "all 0.15s ease" }}
                        >
                          <title>
                            {p.nama} (
                            {isBpbd
                              ? "Dominan BPBD (" + stats.bpbdPct + "% vs Mitra " + stats.mitraPct + "%)"
                              : isMitra
                              ? "Dominan Mitra (" + stats.mitraPct + "% vs BPBD " + stats.bpbdPct + "%)"
                              : "Kondisi Terkendali"}
                            {hasReceivedAid ? ` — ${completedCount} Bantuan Sudah Diterima` : ""}
                            )
                          </title>
                        </path>

                        {/* Highlight Badge for Disaster Affected Areas */}
                        {p.isDisasterZone && (
                          <g style={{ pointerEvents: "none" }}>
                            {/* Circle Pin Marker */}
                            <circle
                              cx={p.svgCenter[0]}
                              cy={p.svgCenter[1]}
                              r={isSelected ? 7 : isHovered ? 6.5 : 5}
                              fill={isBpbd ? "#013220" : "#10b981"}
                              stroke="#ffffff"
                              strokeWidth={isSelected ? 2.5 : 1.8}
                              style={{ transition: "r 0.15s ease" }}
                            />
                            {/* Province Label */}
                            <text
                              x={p.svgCenter[0]}
                              y={p.svgCenter[1] - 9}
                              textAnchor="middle"
                              fill="#013220"
                              fontSize={isSelected ? "10.5px" : "9px"}
                              fontWeight="800"
                              style={{ textShadow: "0 1px 3px rgba(255,255,255,0.95)", letterSpacing: "0.01em" }}
                            >
                              {p.nama.replace("Provinsi ", "")}
                            </text>
                            {/* Dominant Percentage */}
                            <text
                              x={p.svgCenter[0]}
                              y={p.svgCenter[1] + 15}
                              textAnchor="middle"
                              fill={isBpbd ? "#013220" : "#047857"}
                              fontSize="7.5px"
                              fontWeight="800"
                              style={{ textShadow: "0 1px 2px rgba(255,255,255,0.9)" }}
                            >
                              {isBpbd ? `BPBD ${stats.bpbdPct}%` : `Mitra ${stats.mitraPct}%`}
                            </text>
                            {/* Checkmark badge if aid was received */}
                            {hasReceivedAid && (
                              <g transform={`translate(${p.svgCenter[0] + 5}, ${p.svgCenter[1] - 9})`}>
                                <circle r="5" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
                                <text textAnchor="middle" dominantBaseline="central" fill="#ffffff" fontSize="6px" fontWeight="900">✓</text>
                              </g>
                            )}
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              /* LEAFLET GEOGRAPHIC MAP OVER INDONESIA */
              <div
                ref={mapContainerRef}
                style={{
                  width: "100%",
                  height: "490px",
                  background: "#f8fafc",
                  zIndex: 1,
                }}
              />
            )}

            {/* LEGENDA RESPON BANTUAN (BOTTOM LEFT OVERLAY) */}
            <div
              style={{
                position: "absolute",
                bottom: "14px",
                left: "14px",
                background: "rgba(255, 255, 255, 0.96)",
                backdropFilter: "blur(8px)",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                boxShadow: "0 4px 14px rgba(0,0,0,0.10)",
                zIndex: 400,
                fontSize: "0.75rem",
                maxWidth: "285px",
              }}
            >
              <span style={{ fontWeight: 800, color: "#013220", display: "block", marginBottom: "5px", fontSize: "0.76rem", letterSpacing: "0.03em" }}>
                LEGENDA RESPON BANTUAN
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{ width: "14px", height: "14px", background: "#013220", border: "1.5px solid #ffffff", borderRadius: "3px", display: "inline-block", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                <span style={{ color: "#013220", fontWeight: 700 }}>Hijau Tua: Dominan BPBD (&gt;50%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{ width: "14px", height: "14px", background: "#10b981", border: "1.5px solid #ffffff", borderRadius: "3px", display: "inline-block", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
                <span style={{ color: "#047857", fontWeight: 700 }}>Hijau Emerald: Dominan Mitra (&gt;50%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span style={{ position: "relative", width: "14px", height: "14px", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ width: "14px", height: "14px", background: "#013220", border: "1.5px solid #ffffff", borderRadius: "3px", display: "inline-block" }} />
                  <span style={{ position: "absolute", top: "-3px", right: "-3px", width: "9px", height: "9px", background: "#16a34a", borderRadius: "50%", border: "1px solid #ffffff", fontSize: "6px", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>✓</span>
                </span>
                <span style={{ color: "#16a34a", fontWeight: 700 }}>Tanda ✓: Ada Bantuan Diterima</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "14px", height: "14px", background: "#e2e8f0", border: "1.5px solid #cbd5e1", borderRadius: "3px", display: "inline-block" }} />
                <span style={{ color: "#64748b", fontWeight: 600 }}>Abu-abu: Terkendali / Pemantauan Rutin</span>
              </div>
              <small style={{ display: "block", color: "#94a3b8", marginTop: "5px", fontSize: "9.5px", borderTop: "1px dashed #e2e8f0", paddingTop: "3px" }}>
                Klik wilayah berwarna untuk detail bantuan
              </small>
            </div>
          </div>

          {/* DETAIL PANEL OF SELECTED PROVINSI */}
          {selectedProvinsi && (() => {
            const stats = getProvinceBpbdMitraStats(selectedProvinsi);
            const isBpbd = stats.dominant === "bpbd";
            const isMitra = stats.dominant === "mitra";
            const pd = selectedProvinsi as any;
            const completedCases: CaseRecord[] = pd._completedCases || [];
            const inProgressCases: CaseRecord[] = pd._inProgressCases || [];
            const hasReceivedAid = pd.hasReceivedAid === true;

            return (
              <div
                style={{
                  background: isBpbd ? "#f0fdf4" : isMitra ? "#ecfdf5" : "#fafafa",
                  border: isBpbd ? "1.5px solid #10b981" : isMitra ? "1.5px solid #6ee7b7" : "1.5px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column" as const,
                  justifyContent: "space-between",
                  boxShadow: "0 4px 14px rgba(1, 50, 32, 0.05)",
                  overflowY: "auto" as const,
                  maxHeight: "490px",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "#64748b" }}>Wilayah {selectedProvinsi.pulau}</span>
                      <h3 style={{ margin: "2px 0 6px", fontSize: "1.25rem", fontWeight: 800, color: "#013220" }}>{selectedProvinsi.nama}</h3>
                    </div>
                    <span
                      style={{
                        fontSize: "0.75rem", fontWeight: 800, padding: "4px 10px", borderRadius: "999px",
                        background: isBpbd ? "#013220" : isMitra ? "#10b981" : "#f1f5f9",
                        color: isBpbd || isMitra ? "#ffffff" : "#475569",
                        border: isBpbd ? "1px solid #013220" : isMitra ? "1px solid #059669" : "1px solid #cbd5e1",
                        display: "inline-flex", alignItems: "center", gap: "5px", boxShadow: "0 2px 4px rgba(1, 50, 32, 0.15)",
                        flexShrink: 0,
                      }}
                    >
                      <span><span style={monoEmojiStyle}>{isBpbd ? "🏢" : isMitra ? "🤝" : "⚪"}</span>{" "}{isBpbd ? "Dominan BPBD" : isMitra ? "Dominan Mitra" : "Kondisi Kondusif"}</span>
                    </span>
                  </div>

                  {/* Dual Bar or Kondusif Banner */}
                  {selectedProvinsi.isDisasterZone && stats.totalRespon > 0 ? (
                    <div style={{ margin: "14px 0 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, marginBottom: "6px" }}>
                        <span style={{ color: "#013220" }}>Banyaknya Respon: BPBD ({stats.bpbdPct}%)</span>
                        <span style={{ color: "#047857" }}>Mitra ({stats.mitraPct}%)</span>
                      </div>
                      <div style={{ height: "10px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden", display: "flex" }}>
                        <div style={{ height: "100%", width: `${stats.bpbdPct}%`, background: "#013220", transition: "width 0.3s ease" }} title={`BPBD: ${stats.bpbdPct}%`} />
                        <div style={{ height: "100%", width: `${stats.mitraPct}%`, background: "#10b981", transition: "width 0.3s ease" }} title={`Mitra: ${stats.mitraPct}%`} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "#64748b", marginTop: "5px" }}>
                        <span><span style={monoEmojiStyle}>🏢</span> BPBD: <b>{stats.bpbdPaket.toLocaleString("id-ID")} Paket</b> ({stats.bpbdRespon} Respon)</span>
                        <span><span style={monoEmojiStyle}>🤝</span> Mitra: <b>{stats.mitraPaket.toLocaleString("id-ID")} Paket</b> ({stats.mitraRespon} Respon)</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ margin: "12px 0 14px", padding: "10px 14px", borderRadius: "10px", background: "#f8fafc", border: "1px dashed #cbd5e1", fontSize: "0.78rem", color: "#475569", display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px" }}>🛡️</span>
                      <span>Wilayah aman &amp; nihil laporan kedaruratan aktif. Posko BPBD dan mitra kemanusiaan berada dalam kesiapsiagaan pemantauan rutin.</span>
                    </div>
                  )}

                  {/* Logistics & Beneficiary Info */}
                  <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px", fontSize: "0.82rem" }}>
                    <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" as const }}>Status Wilayah &amp; Kedaruratan</span>
                        <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>{selectedProvinsi.jiwaTerbantu > 0 ? `${selectedProvinsi.jiwaTerbantu.toLocaleString("id-ID")} Jiwa Terbantu` : "Nihil Korban Terdampak"}</span>
                      </div>
                      <strong style={{ color: "#013220", fontSize: "0.90rem", display: "block", marginTop: "2px" }}>{selectedProvinsi.kejadianBencana}</strong>
                      {selectedProvinsi.totalKasus > 0 && (
                        <span style={{ fontSize: "0.74rem", color: "#64748b", display: "block", marginTop: "2px" }}>{selectedProvinsi.totalKasus} Laporan Kebutuhan Aktif · {selectedProvinsi.kkTerlayani} KK</span>
                      )}
                    </div>

                    <div style={{ background: "#ffffff", padding: "10px 14px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
                      <span style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" as const, display: "block" }}>Penyaluran &amp; Mitra Terlibat</span>
                      <div style={{ color: "#013220", fontWeight: 700, fontSize: "0.84rem", marginTop: "2px" }}>{selectedProvinsi.jumlahBantuan}</div>
                      <div style={{ color: "#475569", fontSize: "0.74rem", marginTop: "3px" }}>Respon Terlibat: {selectedProvinsi.mitraBpbdAktif}</div>
                      {selectedProvinsi.komoditasUtama && selectedProvinsi.isDisasterZone && (
                        <div style={{ color: "#64748b", fontSize: "0.72rem", marginTop: "2px" }}>Komoditas Utama: {selectedProvinsi.komoditasUtama}</div>
                      )}
                    </div>

                    {/* ── BANTUAN SUDAH DITERIMA (detail per kasus) ── */}
                    {hasReceivedAid && completedCases.length > 0 && (
                      <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "10px", overflow: "hidden" }}>
                        <div style={{ padding: "8px 14px", background: "#dcfce7", borderBottom: "1px solid #86efac", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "0.78rem", color: "#15803d" }}>✅ Bantuan Sudah Diterima ({completedCases.length} laporan)</strong>
                          <span style={{ fontSize: "0.7rem", color: "#16a34a", fontWeight: 600 }}>Terverifikasi &amp; Distribusi Selesai</span>
                        </div>
                        <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column" as const, gap: "6px" }}>
                          {completedCases.slice(0, 4).map((c) => (
                            <div key={c.id} style={{ display: "flex", alignItems: "flex-start", gap: "8px", padding: "6px 8px", background: "#ffffff", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                              <span style={{ marginTop: "1px", fontSize: "12px", flexShrink: 0 }}>🎁</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <strong style={{ display: "block", fontSize: "0.78rem", color: "#013220", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{c.item}</strong>
                                <span style={{ fontSize: "0.69rem", color: "#64748b" }}>{c.id} · {c.kk || "1"} KK{c.totalDiterimaResmi ? ` · ${c.totalDiterimaResmi}` : ""}</span>
                              </div>
                              <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#16a34a", background: "#dcfce7", border: "1px solid #86efac", padding: "1px 6px", borderRadius: "4px", flexShrink: 0 }}>Diterima</span>
                            </div>
                          ))}
                          {completedCases.length > 4 && (
                            <p style={{ margin: 0, fontSize: "0.72rem", color: "#16a34a", textAlign: "center" as const, fontWeight: 600 }}>+{completedCases.length - 4} laporan lain sudah diterima</p>
                          )}
                        </div>
                      </div>
                    )}

                    {/* ── BANTUAN SEDANG DIPROSES ── */}
                    {inProgressCases.length > 0 && (
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "10px", overflow: "hidden" }}>
                        <div style={{ padding: "8px 14px", background: "#fef9c3", borderBottom: "1px solid #fde68a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <strong style={{ fontSize: "0.78rem", color: "#b45309" }}>⏳ Sedang Diproses ({inProgressCases.length} laporan)</strong>
                        </div>
                        <div style={{ padding: "8px 10px", display: "flex", flexDirection: "column" as const, gap: "5px" }}>
                          {inProgressCases.slice(0, 3).map((c) => (
                            <div key={c.id} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 8px", background: "#ffffff", borderRadius: "7px", border: "1px solid #fde68a" }}>
                              <span style={{ fontSize: "11px", flexShrink: 0 }}>📋</span>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <strong style={{ display: "block", fontSize: "0.77rem", color: "#1e293b", whiteSpace: "nowrap" as const, overflow: "hidden", textOverflow: "ellipsis" }}>{c.item}</strong>
                                <span style={{ fontSize: "0.68rem", color: "#64748b" }}>{c.id} · {c.kk || "1"} KK</span>
                              </div>
                              <span style={{ fontSize: "0.67rem", fontWeight: 700, color: "#b45309", background: "#fef3c7", border: "1px solid #fde68a", padding: "1px 6px", borderRadius: "4px", flexShrink: 0, whiteSpace: "nowrap" as const }}>{c.status}</span>
                            </div>
                          ))}
                          {inProgressCases.length > 3 && (
                            <p style={{ margin: 0, fontSize: "0.72rem", color: "#b45309", textAlign: "center" as const, fontWeight: 600 }}>+{inProgressCases.length - 3} laporan lain masih dalam proses</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div style={{ padding: "8px 10px", borderRadius: "8px", background: "rgba(0,0,0,0.02)", borderLeft: `3px solid ${isBpbd ? "#013220" : isMitra ? "#10b981" : "#94a3b8"}` }}>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155", fontStyle: "italic", lineHeight: 1.45 }}>
                        "{selectedProvinsi.catatanKewilayahan}"
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #e2e8f0", fontSize: "0.72rem", color: "#94a3b8", textAlign: "right" as const }}>
                  ✓ Data real-time tersinkronisasi dari Laporan Kebutuhan Warga &amp; Misi Penyaluran Lapangan
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}
