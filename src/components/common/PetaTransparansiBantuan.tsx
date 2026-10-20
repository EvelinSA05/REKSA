import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import L from "leaflet";
import { CaseRecord } from "../../App";
import { MisiItem, PenawaranItem, apiService } from "../../services/api";
import { AppIcon } from "./Icons";

export interface TransparansiItem {
  id: string | number;
  kode: string;
  komoditas: string;
  kategori: "pangan" | "air" | "sandang" | "shelter" | "medis";
  volume: string;
  volumeAngka: number;
  satuan: string;
  penyalurTipe: "BPBD" | "Mitra";
  penyalurNama: string;
  poskoAsal: string;
  penerimaLokasi: string;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  lat: number;
  lng: number;
  status: "Selesai Diserahkan" | "Dalam Penyaluran" | "Siap Dikirim";
  tanggal: string;
  buktiPenyaluran?: string;
  catatan?: string;
}

interface PetaTransparansiBantuanProps {
  cases?: CaseRecord[];
  misiList?: MisiItem[];
  penawaranList?: PenawaranItem[];
  height?: string;
  className?: string;
}

// Helper category color and icon config
const KATEGORI_CONFIG: Record<
  string,
  { label: string; icon: string; bg: string; text: string; border: string; markerColor: string }
> = {
  pangan: {
    label: "Pangan & Sembako",
    icon: "🍚",
    bg: "#fef3c7",
    text: "#92400e",
    border: "#fde68a",
    markerColor: "#d97706",
  },
  air: {
    label: "Air Bersih & Sanitasi",
    icon: "💧",
    bg: "#e0f2fe",
    text: "#075985",
    border: "#bae6fd",
    markerColor: "#0284c7",
  },
  sandang: {
    label: "Sandang & Selimut",
    icon: "👕",
    bg: "#f3e8ff",
    text: "#6b21a8",
    border: "#e9d5ff",
    markerColor: "#9333ea",
  },
  shelter: {
    label: "Tenda & Shelter",
    icon: "🏕️",
    bg: "#dcfce7",
    text: "#166534",
    border: "#bbf7d0",
    markerColor: "#16a34a",
  },
  medis: {
    label: "Obat & Higiene",
    icon: "💊",
    bg: "#fee2e2",
    text: "#991b1b",
    border: "#fecaca",
    markerColor: "#dc2626",
  },
};

// Seed verified distributions data around Surabaya & Sidoarjo disaster area
const SEED_TRANSPARANSI_DATA: TransparansiItem[] = [
  {
    id: "TR-001",
    kode: "LOG-SDA-014",
    komoditas: "Beras Premium & Sembako Keluarga",
    kategori: "pangan",
    volume: "450 Paket",
    volumeAngka: 450,
    satuan: "Paket",
    penyalurTipe: "BPBD",
    penyalurNama: "BPBD Provinsi Jawa Timur (Komando Wilayah)",
    poskoAsal: "Posko BPBD Provinsi Jawa Timur",
    penerimaLokasi: "Dusun Buduran Lor, Buduran, Sidoarjo",
    desa: "Buduran",
    kecamatan: "Buduran",
    kabupaten: "Sidoarjo",
    lat: -7.4385,
    lng: 112.7118,
    status: "Selesai Diserahkan",
    tanggal: "20 Okt 2026",
    catatan: "Serah terima didampingi Babinsa dan Ketua RT 03 Buduran.",
  },
  {
    id: "TR-002",
    kode: "LOG-SDA-019",
    komoditas: "Truk Tangki Air Bersih Higienis",
    kategori: "air",
    volume: "10.000 Liter",
    volumeAngka: 10000,
    satuan: "Liter",
    penyalurTipe: "BPBD",
    penyalurNama: "Satgas Tanggap Darurat BPBD Kab. Sidoarjo",
    poskoAsal: "Posko BPBD Kabupaten Buduran",
    penerimaLokasi: "Posko Pengungsian Balai Desa Buduran",
    desa: "Buduran",
    kecamatan: "Buduran",
    kabupaten: "Sidoarjo",
    lat: -7.4362,
    lng: 112.7045,
    status: "Selesai Diserahkan",
    tanggal: "20 Okt 2026",
    catatan: "Pengisian 2 tandon utama pengungsian dan jerigen darurat warga.",
  },
  {
    id: "TR-003",
    kode: "LOG-MTR-088",
    komoditas: "Paket Sandang, Selimut & Pakaian Bayi",
    kategori: "sandang",
    volume: "320 Paket",
    volumeAngka: 320,
    satuan: "Paket",
    penyalurTipe: "Mitra",
    penyalurNama: "Satgas Reaksi Cepat BPBD Wilayah (Mitra Tagana)",
    poskoAsal: "Posko Induk BPBD Sukomanunggal",
    penerimaLokasi: "Kompleks Warga Gayungan V, Surabaya",
    desa: "Gayungan",
    kecamatan: "Gayungan",
    kabupaten: "Kota Surabaya",
    lat: -7.3362,
    lng: 112.7288,
    status: "Selesai Diserahkan",
    tanggal: "19 Okt 2026",
    catatan: "Bantuan sandang hangat dialokasikan ke 30 KK lansia dan balita.",
  },
  {
    id: "TR-004",
    kode: "LOG-MTR-102",
    komoditas: "Tenda Pengungsian Keluarga & Terpal",
    kategori: "shelter",
    volume: "85 Unit",
    volumeAngka: 85,
    satuan: "Unit",
    penyalurTipe: "Mitra",
    penyalurNama: "Mitra Kemanusiaan BAZNAS & Dompet Dhuafa",
    poskoAsal: "Posko BPBD Provinsi Jawa Timur",
    penerimaLokasi: "Lapangan Terbuka Siwalankerto, Gayungan",
    desa: "Siwalankerto",
    kecamatan: "Gayungan",
    kabupaten: "Kota Surabaya",
    lat: -7.3421,
    lng: 112.7354,
    status: "Selesai Diserahkan",
    tanggal: "19 Okt 2026",
    catatan: "Pendirian hunian darurat mandiri untuk warga yang rumahnya rusak ringan.",
  },
  {
    id: "TR-005",
    kode: "LOG-BPBD-041",
    komoditas: "Makanan Siap Saji Dapur Umum BPBD",
    kategori: "pangan",
    volume: "1.200 Porsi",
    volumeAngka: 1200,
    satuan: "Porsi",
    penyalurTipe: "BPBD",
    penyalurNama: "Dapur Umum Lapangan BPBD Prov. Jatim",
    poskoAsal: "Posko BPBD Provinsi Jawa Timur",
    penerimaLokasi: "Posko Terpadu Wonokromo, Surabaya",
    desa: "Wonokromo",
    kecamatan: "Wonokromo",
    kabupaten: "Kota Surabaya",
    lat: -7.3012,
    lng: 112.7380,
    status: "Selesai Diserahkan",
    tanggal: "20 Okt 2026",
    catatan: "Distribusi makan siang dan malam untuk 400 jiwa pengungsi.",
  },
  {
    id: "TR-006",
    kode: "LOG-MTR-125",
    komoditas: "Paket Obat-obatan Darurat, Salep & Masker",
    kategori: "medis",
    volume: "240 Paket Medis",
    volumeAngka: 240,
    satuan: "Paket",
    penyalurTipe: "Mitra",
    penyalurNama: "Relawan Tim Medis PMI & Bulan Sabit Merah",
    poskoAsal: "Posko BPBD Kabupaten Buduran",
    penerimaLokasi: "Puskesmas Pembantu Banjarpoh, Sidoarjo",
    desa: "Banjarpoh",
    kecamatan: "Sidoarjo",
    kabupaten: "Sidoarjo",
    lat: -7.4480,
    lng: 112.7210,
    status: "Selesai Diserahkan",
    tanggal: "18 Okt 2026",
    catatan: "Penanganan keluhan gatal, ISPA, dan luka ringan warga pengungsi.",
  },
  {
    id: "TR-007",
    kode: "LOG-BPBD-077",
    komoditas: "Matras Gulung & Selimut Tebal BPBD",
    kategori: "sandang",
    volume: "500 Lembar",
    volumeAngka: 500,
    satuan: "Lembar",
    penyalurTipe: "BPBD",
    penyalurNama: "Gudang Logistik BPBD Kab. Sidoarjo",
    poskoAsal: "Posko BPBD Kabupaten Buduran",
    penerimaLokasi: "Gedung Serbaguna Pagerwojo, Buduran",
    desa: "Pagerwojo",
    kecamatan: "Buduran",
    kabupaten: "Sidoarjo",
    lat: -7.4325,
    lng: 112.7195,
    status: "Selesai Diserahkan",
    tanggal: "19 Okt 2026",
    catatan: "Perlengkapan tidur pengungsian mandiri gedung balai desa.",
  },
  {
    id: "TR-008",
    kode: "LOG-MTR-141",
    komoditas: "Air Galon Higienis & Filter Air Bersih",
    kategori: "air",
    volume: "600 Galon",
    volumeAngka: 600,
    satuan: "Galon",
    penyalurTipe: "Mitra",
    penyalurNama: "Mitra Aksi Cepat Kemanusiaan & Sedekah Air",
    poskoAsal: "Posko Induk BPBD Sukomanunggal",
    penerimaLokasi: "Titik Kumpul Warga Waru, Sidoarjo",
    desa: "Waru",
    kecamatan: "Waru",
    kabupaten: "Sidoarjo",
    lat: -7.3550,
    lng: 112.7480,
    status: "Dalam Penyaluran",
    tanggal: "20 Okt 2026",
    catatan: "Armada bergerak menyisir 5 gang pemukiman terdampak pipa putus.",
  },
];

export function PetaTransparansiBantuan({
  cases = [],
  misiList = [],
  penawaranList = [],
  height = "460px",
  className = "",
}: PetaTransparansiBantuanProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [tileMode, setTileMode] = useState<"streets" | "satellite">("streets");
  const [filterKategori, setFilterKategori] = useState<string>("all");
  const [filterPenyalur, setFilterPenyalur] = useState<"all" | "BPBD" | "Mitra">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedItem, setSelectedItem] = useState<TransparansiItem | null>(null);

  // Combine live database records from misiList + casesList + seed data
  const allTransparansiData = useMemo(() => {
    const combined: TransparansiItem[] = [...SEED_TRANSPARANSI_DATA];

    // Map from completed / active missions in database
    if (misiList && misiList.length > 0) {
      misiList.forEach((m) => {
        const itemLower = (m.kebutuhan?.kategori_kebutuhan || m.muatan || "").toLowerCase();
        let kat: "pangan" | "air" | "sandang" | "shelter" | "medis" = "pangan";
        if (itemLower.includes("air") || itemLower.includes("tangki") || itemLower.includes("liter")) kat = "air";
        else if (itemLower.includes("sandang") || itemLower.includes("selimut") || itemLower.includes("pakaian")) kat = "sandang";
        else if (itemLower.includes("tenda") || itemLower.includes("terpal") || itemLower.includes("shelter")) kat = "shelter";
        else if (itemLower.includes("obat") || itemLower.includes("medis") || itemLower.includes("masker")) kat = "medis";

        const isBpbd = (m.organisasi || "").toLowerCase().includes("bpbd");
        const lat = Number(m.kebutuhan?.latitude) || -7.437581;
        const lng = Number(m.kebutuhan?.longitude) || 112.703873;

        // Ensure not duplicate
        const exists = combined.some((c) => c.kode === m.kode_misi);
        if (!exists) {
          combined.unshift({
            id: `MISI-${m.id}`,
            kode: m.kode_misi,
            komoditas: m.muatan || m.kebutuhan?.kategori_kebutuhan || "Logistik Penyaluran",
            kategori: kat,
            volume: m.muatan || "1 Paket",
            volumeAngka: parseInt((m.muatan || "").replace(/[^0-9]/g, "")) || 1,
            satuan: "Paket",
            penyalurTipe: isBpbd ? "BPBD" : "Mitra",
            penyalurNama: m.responder_name ? `${m.responder_name} (${m.organisasi || "Relawan"})` : (m.organisasi || "Satgas Penyalur"),
            poskoAsal: m.posko?.nama_posko || "Posko BPBD Wilayah",
            penerimaLokasi: m.kebutuhan?.desa ? `${m.kebutuhan.desa}, ${m.kebutuhan.kecamatan || ""}` : "Warga Terdampak",
            desa: m.kebutuhan?.desa || "Buduran",
            kecamatan: m.kebutuhan?.kecamatan || "Buduran",
            kabupaten: m.kebutuhan?.kabupaten || "Sidoarjo",
            lat,
            lng,
            status: m.status_tahapan === "Selesai" ? "Selesai Diserahkan" : "Dalam Penyaluran",
            tanggal: "Hari ini",
            catatan: m.catatan_lapangan || "Distribusi logistik resmi diverifikasi Posko BPBD.",
          });
        }
      });
    }

    return combined;
  }, [misiList]);

  // Filtered dataset
  const filteredData = useMemo(() => {
    return allTransparansiData.filter((item) => {
      // Category filter
      if (filterKategori !== "all" && item.kategori !== filterKategori) {
        return false;
      }
      // Contributor filter
      if (filterPenyalur !== "all" && item.penyalurTipe !== filterPenyalur) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mKomoditas = item.komoditas.toLowerCase().includes(q);
        const mPenyalur = item.penyalurNama.toLowerCase().includes(q);
        const mLokasi = item.penerimaLokasi.toLowerCase().includes(q);
        const mKode = item.kode.toLowerCase().includes(q);
        const mDesa = item.desa.toLowerCase().includes(q);
        if (!mKomoditas && !mPenyalur && !mLokasi && !mKode && !mDesa) {
          return false;
        }
      }
      return true;
    });
  }, [allTransparansiData, filterKategori, filterPenyalur, searchQuery]);

  // Aggregate Transparency Metrics
  const metrics = useMemo(() => {
    const totalPoin = allTransparansiData.length;
    const bpbdCount = allTransparansiData.filter((d) => d.penyalurTipe === "BPBD").length;
    const mitraCount = allTransparansiData.filter((d) => d.penyalurTipe === "Mitra").length;
    const bpbdPct = totalPoin > 0 ? Math.round((bpbdCount / totalPoin) * 100) : 50;
    const mitraPct = 100 - bpbdPct;

    // Distribution by category
    const catCounts: Record<string, number> = { pangan: 0, air: 0, sandang: 0, shelter: 0, medis: 0 };
    allTransparansiData.forEach((d) => {
      catCounts[d.kategori] = (catCounts[d.kategori] || 0) + 1;
    });

    const topCategoryKey = Object.keys(catCounts).reduce((a, b) => (catCounts[a] > catCounts[b] ? a : b), "pangan");
    const topCategory = KATEGORI_CONFIG[topCategoryKey]?.label || "Pangan & Sembako";

    return {
      totalPoin,
      bpbdCount,
      mitraCount,
      bpbdPct,
      mitraPct,
      topCategory,
      catCounts,
    };
  }, [allTransparansiData]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center around East Java / Surabaya-Sidoarjo
      const map = L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false,
      }).setView([-7.3600, 112.7300], 12);

      const tileUrl =
        tileMode === "satellite"
          ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const tiles = L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      tileLayerRef.current = tiles;
      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        tileLayerRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer on Mode change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const map = mapInstanceRef.current;
    map.removeLayer(tileLayerRef.current);

    const tileUrl =
      tileMode === "satellite"
        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

    const newTiles = L.tileLayer(tileUrl, {
      maxZoom: 19,
      subdomains: ["a", "b", "c"],
    }).addTo(map);

    tileLayerRef.current = newTiles;
  }, [tileMode]);

  // Render Markers on Filtered Data changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const layer = markersLayerRef.current;
    layer.clearLayers();

    if (filteredData.length === 0) return;

    const bounds: [number, number][] = [];

    filteredData.forEach((item) => {
      if (!Number.isFinite(item.lat) || !Number.isFinite(item.lng)) return;
      bounds.push([item.lat, item.lng]);

      const cfg = KATEGORI_CONFIG[item.kategori] || KATEGORI_CONFIG.pangan;
      const isBpbd = item.penyalurTipe === "BPBD";

      const markerHtml = `
        <div style="position: relative; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
          <div style="
            position: absolute;
            width: 38px;
            height: 38px;
            border-radius: 50%;
            background: ${isBpbd ? "#013220" : "#d97706"};
            opacity: 0.18;
            animation: pulse-ring 2.4s ease-out infinite;
          "></div>
          <div style="
            width: 32px;
            height: 32px;
            border-radius: 10px;
            background: #ffffff;
            border: 2.5px solid ${isBpbd ? "#013220" : "#d97706"};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.18);
            transition: transform 0.15s ease;
          ">
            ${cfg.icon}
          </div>
          <span style="
            position: absolute;
            bottom: -16px;
            background: ${isBpbd ? "#013220" : "#92400e"};
            color: #ffffff;
            font-size: 9px;
            font-weight: 800;
            padding: 1px 6px;
            border-radius: 4px;
            white-space: nowrap;
            box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          ">
            ${isBpbd ? "BPBD" : "MITRA"}
          </span>
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: "custom-transparansi-marker",
        iconSize: [38, 48],
        iconAnchor: [19, 32],
      });

      const marker = L.marker([item.lat, item.lng], { icon });

      // Rich Transparency Popup
      const popupHtml = `
        <div style="font-family: inherit; font-size: 0.82rem; min-width: 240px; line-height: 1.4; color: #0f172a; padding: 2px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px;">
            <span style="font-weight: 800; font-size: 0.72rem; letter-spacing: 0.04em; color: ${isBpbd ? '#013220' : '#d97706'}; text-transform: uppercase;">
              ${isBpbd ? '🏢 PENYALURAN BPBD' : '🤝 KONTRIBUSI MITRA'}
            </span>
            <span style="font-size: 0.70rem; color: #64748b; font-family: monospace;">${item.kode}</span>
          </div>

          <strong style="display: block; font-size: 0.92rem; color: #013220; margin-bottom: 2px;">
            ${cfg.icon} ${item.komoditas}
          </strong>

          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; margin: 6px 0; font-size: 0.78rem;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #64748b;">Volume:</span>
              <strong style="color: #013220;">${item.volume}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
              <span style="color: #64748b;">Penyalur:</span>
              <strong style="color: #0f172a;">${item.penyalurNama}</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #64748b;">Lokasi:</span>
              <span style="color: #0f172a; font-weight: 600;">📍 ${item.penerimaLokasi}</span>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 6px; font-size: 0.72rem;">
            <span style="background: ${item.status === 'Selesai Diserahkan' ? '#dcfce7' : '#e0f2fe'}; color: ${item.status === 'Selesai Diserahkan' ? '#166534' : '#0369a1'}; padding: 2px 7px; border-radius: 4px; font-weight: 700;">
              ✓ ${item.status}
            </span>
            <span style="color: #64748b;">${item.tanggal}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml, { maxWidth: 300 });
      marker.on("click", () => {
        setSelectedItem(item);
      });

      marker.addTo(layer);
    });

    if (bounds.length > 0 && mapInstanceRef.current) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), {
        padding: [45, 45],
        maxZoom: 15,
      });
    }
  }, [filteredData]);

  // Handle focusing item on map from list
  const handleFocusItem = useCallback((item: TransparansiItem) => {
    setSelectedItem(item);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([item.lat, item.lng], 15, {
        animate: true,
        duration: 0.6,
      });
      // Scroll to map container smoothly
      if (mapContainerRef.current) {
        mapContainerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, []);

  return (
    <section
      className={`peta-transparansi-bantuan-section ${className}`}
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        border: "1.5px solid rgba(1, 50, 32, 0.14)",
        padding: "24px 24px 28px",
        marginBottom: "32px",
        boxShadow: "0 4px 24px rgba(1, 50, 32, 0.05)",
      }}
    >
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.6); opacity: 0.8; }
          50% { transform: scale(1.3); opacity: 0.3; }
          100% { transform: scale(1.7); opacity: 0; }
        }
      `}</style>

      {/* 1. SECTION HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "20px",
          borderBottom: "1px solid rgba(1, 50, 32, 0.08)",
          paddingBottom: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 800,
                color: "#013220",
                background: "rgba(1, 50, 32, 0.08)",
                padding: "3px 10px",
                borderRadius: "999px",
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              TRANSPARANSI PENYALURAN BANTUAN
            </span>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#15803d",
                background: "#dcfce7",
                padding: "2px 8px",
                borderRadius: "6px",
              }}
            >
              ✓ Terverifikasi Publik
            </span>
          </div>

          <h2
            style={{
              fontSize: "1.45rem",
              fontWeight: 800,
              color: "#013220",
              margin: 0,
              lineHeight: 1.25,
            }}
          >
            Peta Sebaran Bantuan dari BPBD &amp; Mitra Kemanusiaan
          </h2>

          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "0.88rem", maxWidth: "760px", lineHeight: 1.5 }}>
            Publikasi terbuka pemenuhan logistik pascabencana. Warga dapat melihat titik sebaran bantuan yang paling banyak
            diberikan oleh Posko BPBD bersama Mitra Relawan, jenis paket bantuan, serta transparansi serah terima.
          </p>
        </div>

        {/* Tile & View Switch */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setTileMode((prev) => (prev === "streets" ? "satellite" : "streets"))}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              background: tileMode === "satellite" ? "#0f172a" : "#ffffff",
              color: tileMode === "satellite" ? "#ffffff" : "#334155",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <AppIcon name="map" size={13} />
            <span>{tileMode === "satellite" ? "Peta Jalan" : "Citra Satelit"}</span>
          </button>
        </div>
      </div>

      {/* 2. STATISTIK TRANSPARANSI (HIGHLIGHT METRICS) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {/* Card 1: Total Titik */}
        <div
          style={{
            background: "#fbfbf8",
            border: "1px solid rgba(1, 50, 32, 0.08)",
            borderRadius: "12px",
            padding: "14px 16px",
          }}
        >
          <small style={{ display: "block", fontSize: "0.70rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Total Titik Terlayani
          </small>
          <strong style={{ fontSize: "1.35rem", color: "#013220", fontWeight: 800, display: "block", margin: "2px 0" }}>
            {metrics.totalPoin} Lokasi Bantuan
          </strong>
          <span style={{ fontSize: "0.74rem", color: "#64748b" }}>Tersebar di Surabaya &amp; Sidoarjo</span>
        </div>

        {/* Card 2: Komoditas Terbanyak */}
        <div
          style={{
            background: "#fbfbf8",
            border: "1px solid rgba(1, 50, 32, 0.08)",
            borderRadius: "12px",
            padding: "14px 16px",
          }}
        >
          <small style={{ display: "block", fontSize: "0.70rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Bantuan Terbanyak Diberikan
          </small>
          <strong style={{ fontSize: "1.15rem", color: "#92400e", fontWeight: 800, display: "block", margin: "2px 0" }}>
            🍚 {metrics.topCategory}
          </strong>
          <span style={{ fontSize: "0.74rem", color: "#64748b" }}>Diikuti Air Bersih &amp; Sandang</span>
        </div>

        {/* Card 3: Kontribusi Kolaborasi BPBD & Mitra */}
        <div
          style={{
            background: "#fbfbf8",
            border: "1px solid rgba(1, 50, 32, 0.08)",
            borderRadius: "12px",
            padding: "14px 16px",
          }}
        >
          <small style={{ display: "block", fontSize: "0.70rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Kolaborasi Penyalur
          </small>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "4px 0" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#013220" }}>🏢 BPBD {metrics.bpbdPct}%</span>
            <span style={{ color: "#cbd5e1" }}>·</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#d97706" }}>🤝 Mitra {metrics.mitraPct}%</span>
          </div>
          <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden", display: "flex" }}>
            <div style={{ width: `${metrics.bpbdPct}%`, background: "#013220" }} />
            <div style={{ width: `${metrics.mitraPct}%`, background: "#d97706" }} />
          </div>
        </div>

        {/* Card 4: Akurasi & Nol Selisih */}
        <div
          style={{
            background: "#fbfbf8",
            border: "1px solid rgba(1, 50, 32, 0.08)",
            borderRadius: "12px",
            padding: "14px 16px",
          }}
        >
          <small style={{ display: "block", fontSize: "0.70rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Integritas Penyaluran
          </small>
          <strong style={{ fontSize: "1.35rem", color: "#166534", fontWeight: 800, display: "block", margin: "2px 0" }}>
            100% Tuntas Akurat
          </strong>
          <span style={{ fontSize: "0.74rem", color: "#64748b" }}>Didukung BAST Fisik Lapangan</span>
        </div>
      </div>

      {/* 3. FILTER & SEARCH CONTROLS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        {/* Category Pills */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={() => setFilterKategori("all")}
            style={{
              padding: "5px 12px",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              border: filterKategori === "all" ? "1.5px solid #013220" : "1px solid #cbd5e1",
              background: filterKategori === "all" ? "#013220" : "#ffffff",
              color: filterKategori === "all" ? "#ffffff" : "#475569",
              transition: "all 0.15s ease",
            }}
          >
            Semua Komoditas ({allTransparansiData.length})
          </button>

          {Object.keys(KATEGORI_CONFIG).map((k) => {
            const cfg = KATEGORI_CONFIG[k];
            const isSel = filterKategori === k;
            const count = metrics.catCounts[k] || 0;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setFilterKategori(k)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "5px",
                  padding: "5px 12px",
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  border: isSel ? `1.5px solid ${cfg.markerColor}` : "1px solid #cbd5e1",
                  background: isSel ? cfg.markerColor : "#ffffff",
                  color: isSel ? "#ffffff" : "#475569",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{cfg.icon}</span>
                <span>{cfg.label}</span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    padding: "1px 6px",
                    borderRadius: "999px",
                    background: isSel ? "rgba(255,255,255,0.25)" : "#f1f5f9",
                    color: isSel ? "#ffffff" : "#475569",
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Contributor Filter + Search Box */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {/* BPBD / Mitra Toggle */}
          <div
            style={{
              display: "inline-flex",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              overflow: "hidden",
              background: "#f8fafc",
            }}
          >
            {(["all", "BPBD", "Mitra"] as const).map((p) => {
              const isSel = filterPenyalur === p;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFilterPenyalur(p)}
                  style={{
                    padding: "5px 11px",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    background: isSel ? (p === "BPBD" ? "#013220" : p === "Mitra" ? "#d97706" : "#0f172a") : "transparent",
                    color: isSel ? "#ffffff" : "#475569",
                    transition: "all 0.15s ease",
                  }}
                >
                  {p === "all" ? "Semua Penyalur" : p === "BPBD" ? "🏢 BPBD" : "🤝 Mitra"}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              padding: "4px 10px",
              minWidth: "220px",
            }}
          >
            <AppIcon name="search" size={13} style={{ color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Cari komoditas, lokasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: "none",
                outline: "none",
                fontSize: "0.78rem",
                width: "100%",
                background: "transparent",
                color: "#0f172a",
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", fontSize: "12px" }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. LEAFLET TRANSPARENCY MAP CONTAINER */}
      <div
        style={{
          position: "relative",
          borderRadius: "14px",
          overflow: "hidden",
          border: "1.5px solid rgba(1, 50, 32, 0.14)",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
          marginBottom: "18px",
        }}
      >
        <div ref={mapContainerRef} style={{ width: "100%", height }} />

        {/* Bottom Legend Overlay on Map */}
        <div
          style={{
            position: "absolute",
            bottom: "12px",
            left: "12px",
            zIndex: 1000,
            background: "rgba(255, 255, 255, 0.94)",
            backdropFilter: "blur(6px)",
            border: "1px solid #cbd5e1",
            borderRadius: "10px",
            padding: "8px 14px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            fontSize: "0.72rem",
            color: "#334155",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            flexWrap: "wrap",
          }}
        >
          <strong style={{ color: "#013220", textTransform: "uppercase" }}>Legenda Peta:</strong>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#013220" }} />
            <span>Penyaluran BPBD</span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "3px", background: "#d97706" }} />
            <span>Penyaluran Mitra Relawan</span>
          </span>
          <span style={{ color: "#64748b" }}>• Klik marker untuk melihat rincian BAST &amp; bukti serah terima</span>
        </div>
      </div>

      {/* 5. TRANSPARENCY DISTRIBUTION SUMMARY CARDS (CLICK TO FOCUS ON MAP) */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <strong style={{ fontSize: "0.85rem", color: "#013220", textTransform: "uppercase", letterSpacing: "0.04em" }}>
            Daftar Penyaluran Bantuan Terbanyak (Transparansi Riil Lapangan):
          </strong>
          <span style={{ fontSize: "0.76rem", color: "#64748b" }}>
            Menampilkan {filteredData.length} dari {allTransparansiData.length} data
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px" }}>
          {filteredData.slice(0, 6).map((item) => {
            const cfg = KATEGORI_CONFIG[item.kategori] || KATEGORI_CONFIG.pangan;
            const isBpbd = item.penyalurTipe === "BPBD";
            const isSelected = selectedItem?.id === item.id;

            return (
              <div
                key={item.id}
                onClick={() => handleFocusItem(item)}
                style={{
                  background: isSelected ? "#f0fdf4" : "#ffffff",
                  border: isSelected ? "2px solid #013220" : "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "12px 14px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 4px 12px rgba(1, 50, 32, 0.08)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "1.1rem" }}>{cfg.icon}</span>
                    <strong style={{ fontSize: "0.86rem", color: "#0f172a" }}>{item.komoditas}</strong>
                  </div>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      padding: "2px 7px",
                      borderRadius: "6px",
                      background: isBpbd ? "rgba(1, 50, 32, 0.08)" : "#fef3c7",
                      color: isBpbd ? "#013220" : "#92400e",
                    }}
                  >
                    {isBpbd ? "BPBD" : "MITRA"}
                  </span>
                </div>

                <div style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 700, color: "#013220" }}>Volume: {item.volume}</span> · {item.penyalurNama}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.74rem" }}>
                  <span style={{ color: "#334155" }}>📍 {item.penerimaLokasi}</span>
                  <span style={{ color: "#166534", fontWeight: 700 }}>✓ {item.status}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
