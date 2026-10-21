import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import { CaseRecord } from "../../App";
import { MisiItem } from "../../services/api";
import { AppIcon } from "../common/Icons";

export interface WilayahPenanganan {
  id: string;
  nama: string;
  kabupaten: string;
  status: "banyak_ditangani" | "sedang_ditangani"; // Hanya 2 status (Hijau & Kuning)
  persentasePenanganan: number; // 80-100% untuk hijau, 40-79% untuk kuning
  jumlahBantuan: string;
  komoditasUtama: string;
  mitraBpbdAktif: string;
  poskoPenyangga: string;
  jiwaTerbantu: number;
  kkTerlayani: number;
  catatanKewilayahan: string;
  center: [number, number];
  polygon: [number, number][];
}

// 12 Wilayah Koridor Penanganan Bencana Pascabencana (Surabaya & Sidoarjo)
// Hanya menggunakan 2 warna: Hijau (Banyak Ditangani) & Kuning (Sedang Ditangani)
export const WILAYAH_CHOROPLETH_DATA: WilayahPenanganan[] = [
  {
    id: "KEC-BUDURAN",
    nama: "Kecamatan Buduran",
    kabupaten: "Kabupaten Sidoarjo",
    status: "banyak_ditangani", // HIJAU
    persentasePenanganan: 94,
    jumlahBantuan: "1.450 Paket Logistik & 25.000 L Air Bersih",
    komoditasUtama: "Sembako Pangan, Air Bersih, Tenda Keluarga",
    mitraBpbdAktif: "BPBD Jatim, Posko Induk Buduran, Mitra Tagana",
    poskoPenyangga: "Posko BPBD Kabupaten Buduran (Posko Induk)",
    jiwaTerbantu: 4820,
    kkTerlayani: 1205,
    catatanKewilayahan: "Distribusi logistik tahap 1 dan 2 telah tuntas disalurkan ke seluruh titik pengungsian dan rumah warga.",
    center: [-7.4275, 112.7275],
    polygon: [
      [-7.410, 112.695],
      [-7.405, 112.750],
      [-7.445, 112.760],
      [-7.450, 112.700],
    ],
  },
  {
    id: "KEC-GAYUNGAN",
    nama: "Kecamatan Gayungan",
    kabupaten: "Kota Surabaya",
    status: "banyak_ditangani", // HIJAU
    persentasePenanganan: 91,
    jumlahBantuan: "980 Paket Pangan & 320 Paket Sandang",
    komoditasUtama: "Beras Premium, Sandang Hangat, Selimut",
    mitraBpbdAktif: "BPBD Prov. Jatim & BAZNAS Tanggap Bencana",
    poskoPenyangga: "Posko Induk BPBD Sukomanunggal",
    jiwaTerbantu: 3410,
    kkTerlayani: 852,
    catatanKewilayahan: "Penyaluran terverifikasi tuntas melalui armada logistik bergerak menyisir 4 kelurahan terdampak.",
    center: [-7.3325, 112.7325],
    polygon: [
      [-7.320, 112.715],
      [-7.315, 112.745],
      [-7.345, 112.750],
      [-7.350, 112.720],
    ],
  },
  {
    id: "KEC-SUKOMANUNGGAL",
    nama: "Kecamatan Sukomanunggal",
    kabupaten: "Kota Surabaya",
    status: "banyak_ditangani", // HIJAU
    persentasePenanganan: 88,
    jumlahBantuan: "850 Paket Medis & 15.000 L Air Bersih",
    komoditasUtama: "Obat Darurat, Salep Gatal, Air Bersih Tangki",
    mitraBpbdAktif: "Posko Induk BPBD Sukomanunggal & PMI Jatim",
    poskoPenyangga: "Posko Induk BPBD Sukomanunggal",
    jiwaTerbantu: 2980,
    kkTerlayani: 745,
    catatanKewilayahan: "Kebutuhan vital air bersih dan tim medis keliling telah mencakup seluruh pos pengungsian mandiri warga.",
    center: [-7.2675, 112.7025],
    polygon: [
      [-7.255, 112.685],
      [-7.250, 112.715],
      [-7.280, 112.720],
      [-7.285, 112.690],
    ],
  },
  {
    id: "KEC-WONOKROMO",
    nama: "Kecamatan Wonokromo",
    kabupaten: "Kota Surabaya",
    status: "banyak_ditangani", // HIJAU
    persentasePenanganan: 86,
    jumlahBantuan: "1.200 Porsi Pangan & 400 Lembar Selimut",
    komoditasUtama: "Dapur Umum Siap Saji, Selimut Tebal",
    mitraBpbdAktif: "Dapur Umum Lapangan BPBD & Dompet Dhuafa",
    poskoPenyangga: "Posko BPBD Provinsi Jawa Timur",
    jiwaTerbantu: 4120,
    kkTerlayani: 1030,
    catatanKewilayahan: "Layanan makanan siap saji dari dapur umum terpusat beroperasi harian melayani warga bantaran sungai.",
    center: [-7.3050, 112.7425],
    polygon: [
      [-7.295, 112.730],
      [-7.290, 112.755],
      [-7.315, 112.760],
      [-7.320, 112.735],
      [-7.305, 112.725],
    ],
  },
  {
    id: "KEC-SIDOARJO-KOTA",
    nama: "Kecamatan Sidoarjo Kota",
    kabupaten: "Kabupaten Sidoarjo",
    status: "banyak_ditangani", // HIJAU
    persentasePenanganan: 92,
    jumlahBantuan: "1.100 Paket Sembako & 350 Kit Medis",
    komoditasUtama: "Pangan Sembako, Vitamin, Perlengkapan Bayi",
    mitraBpbdAktif: "BPBD Kab. Sidoarjo & MDMC Muhammadiyah",
    poskoPenyangga: "Posko BPBD Kabupaten Buduran",
    jiwaTerbantu: 3890,
    kkTerlayani: 972,
    catatanKewilayahan: "Seluruh laporan kebutuhan mendesak telah diverifikasi dan didistribusikan bersama relawan lokal.",
    center: [-7.4600, 112.7175],
    polygon: [
      [-7.445, 112.695],
      [-7.440, 112.745],
      [-7.475, 112.750],
      [-7.480, 112.690],
    ],
  },
  {
    id: "KEC-GUBENG",
    nama: "Kecamatan Gubeng",
    kabupaten: "Kota Surabaya",
    status: "banyak_ditangani", // HIJAU
    persentasePenanganan: 95,
    jumlahBantuan: "1.300 Porsi Makanan & 500 Paket Medis",
    komoditasUtama: "Makanan Hangat, Obat-obatan, Masker",
    mitraBpbdAktif: "Dinas Sosial Prov. Jatim & BPBD Surabaya",
    poskoPenyangga: "Posko BPBD Provinsi Jawa Timur",
    jiwaTerbantu: 4450,
    kkTerlayani: 1112,
    catatanKewilayahan: "Pusat rujukan logistik medis dan penyangga kebutuhan darurat beroperasi 24 jam dengan stok memadai.",
    center: [-7.2750, 112.7550],
    polygon: [
      [-7.265, 112.740],
      [-7.260, 112.765],
      [-7.285, 112.775],
      [-7.295, 112.750],
      [-7.280, 112.735],
    ],
  },
  {
    id: "KEC-RUNGKUT",
    nama: "Kecamatan Rungkut",
    kabupaten: "Kota Surabaya",
    status: "banyak_ditangani", // HIJAU
    persentasePenanganan: 89,
    jumlahBantuan: "750 Paket Logistik & 10 Tandon Air Bersih",
    komoditasUtama: "Tandon Air Komunal, Paket Pangan, Terpal",
    mitraBpbdAktif: "Satgas BPBD & Senkom Mitra Polri",
    poskoPenyangga: "Posko Induk BPBD Sukomanunggal",
    jiwaTerbantu: 2850,
    kkTerlayani: 712,
    catatanKewilayahan: "Pemasangan tandon air darurat di fasilitas umum dan rumah ibadah telah selesai 100%.",
    center: [-7.3200, 112.7850],
    polygon: [
      [-7.305, 112.760],
      [-7.300, 112.805],
      [-7.335, 112.815],
      [-7.340, 112.770],
      [-7.320, 112.755],
    ],
  },
  {
    id: "KEC-WARU",
    nama: "Kecamatan Waru",
    kabupaten: "Kabupaten Sidoarjo",
    status: "sedang_ditangani", // KUNING
    persentasePenanganan: 68,
    jumlahBantuan: "600 Galon Air Bersih & 350 Paket Sembako",
    komoditasUtama: "Air Galon Minum, Sembako Cepat Masak",
    mitraBpbdAktif: "Satgas Reaksi Cepat BPBD & Sedekah Air",
    poskoPenyangga: "Posko BPBD Kabupaten Buduran",
    jiwaTerbantu: 2450,
    kkTerlayani: 612,
    catatanKewilayahan: "Armada tangki air dan truk sembako sedang beroperasi menyisir gang pemukiman warga terdampak banjir luapan.",
    center: [-7.3600, 112.7425],
    polygon: [
      [-7.345, 112.715],
      [-7.340, 112.765],
      [-7.375, 112.775],
      [-7.380, 112.720],
    ],
  },
  {
    id: "KEC-GEDANGAN",
    nama: "Kecamatan Gedangan",
    kabupaten: "Kabupaten Sidoarjo",
    status: "sedang_ditangani", // KUNING
    persentasePenanganan: 55,
    jumlahBantuan: "280 Paket Sembako & 120 Lembar Terpal",
    komoditasUtama: "Terpal Hunian, Sembako Keluarga",
    mitraBpbdAktif: "Relawan LPBI NU & BPBD Sidoarjo",
    poskoPenyangga: "Posko BPBD Kabupaten Buduran",
    jiwaTerbantu: 1720,
    kkTerlayani: 430,
    catatanKewilayahan: "Dalam proses penambahan kuota logistik bursa mitra untuk 3 titik pengungsian mandiri warga.",
    center: [-7.3925, 112.7325],
    polygon: [
      [-7.375, 112.710],
      [-7.370, 112.755],
      [-7.410, 112.760],
      [-7.415, 112.705],
    ],
  },
  {
    id: "KEC-CANDI",
    nama: "Kecamatan Candi",
    kabupaten: "Kabupaten Sidoarjo",
    status: "sedang_ditangani", // KUNING
    persentasePenanganan: 62,
    jumlahBantuan: "420 Paket Pangan & 150 Selimut",
    komoditasUtama: "Beras, Minyak Goreng, Selimut Bayi",
    mitraBpbdAktif: "BPBD Sidoarjo & Relawan Pramuka Peduli",
    poskoPenyangga: "Posko BPBD Kabupaten Buduran",
    jiwaTerbantu: 1980,
    kkTerlayani: 495,
    catatanKewilayahan: "Distribusi tahap kedua sedang disiapkan posko pendukung untuk menjangkau dusun terisolasi akses jalan becek.",
    center: [-7.4925, 112.7250],
    polygon: [
      [-7.475, 112.690],
      [-7.470, 112.755],
      [-7.510, 112.760],
      [-7.515, 112.695],
    ],
  },
  {
    id: "KEC-PORONG",
    nama: "Kecamatan Porong",
    kabupaten: "Kabupaten Sidoarjo",
    status: "sedang_ditangani", // KUNING
    persentasePenanganan: 58,
    jumlahBantuan: "300 Paket Sembako & 80 Unit Tenda",
    komoditasUtama: "Tenda Darurat, Makanan Kaleng, Genset",
    mitraBpbdAktif: "Posko Taktis Porong & Mitra SAR Gabungan",
    poskoPenyangga: "Posko BPBD Kabupaten Buduran",
    jiwaTerbantu: 1640,
    kkTerlayani: 410,
    catatanKewilayahan: "Tim gabungan sedang menyalurkan bantuan penyangga sambil memonitor ketinggian air di tanggul darurat.",
    center: [-7.5300, 112.7175],
    polygon: [
      [-7.510, 112.685],
      [-7.505, 112.755],
      [-7.550, 112.750],
      [-7.555, 112.680],
    ],
  },
  {
    id: "KEC-SEDATI",
    nama: "Kecamatan Sedati",
    kabupaten: "Kabupaten Sidoarjo",
    status: "sedang_ditangani", // KUNING
    persentasePenanganan: 52,
    jumlahBantuan: "240 Paket Pangan & 5.000 L Air Bersih",
    komoditasUtama: "Air Bersih Higienis, Makanan Ringan Balita",
    mitraBpbdAktif: "Posko Siaga BPBD Sidoarjo & Nelayan Peduli",
    poskoPenyangga: "Posko BPBD Kabupaten Buduran",
    jiwaTerbantu: 1410,
    kkTerlayani: 352,
    catatanKewilayahan: "Penyaluran logistik pesisir pantai terus berlanjut melalui koordinasi armada kapal motor dan pick-up.",
    center: [-7.3825, 112.8075],
    polygon: [
      [-7.360, 112.770],
      [-7.355, 112.835],
      [-7.405, 112.845],
      [-7.410, 112.780],
      [-7.380, 112.770],
    ],
  },
];

interface PetaSebaranPenangananProps {
  cases?: CaseRecord[];
  misiList?: MisiItem[];
  className?: string;
}

export function PetaSebaranPenanganan({
  cases = [],
  misiList = [],
  className = "",
}: PetaSebaranPenangananProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polygonLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeTabFilter, setActiveTabFilter] = useState<"all" | "banyak_ditangani" | "sedang_ditangani">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWilayah, setSelectedWilayah] = useState<WilayahPenanganan | null>(WILAYAH_CHOROPLETH_DATA[0]);
  const [viewMode, setViewMode] = useState<"map" | "table">("map");

  // Summary counts
  const totalWilayah = WILAYAH_CHOROPLETH_DATA.length;
  const countBanyak = WILAYAH_CHOROPLETH_DATA.filter((w) => w.status === "banyak_ditangani").length;
  const countSedang = WILAYAH_CHOROPLETH_DATA.filter((w) => w.status === "sedang_ditangani").length;
  const totalJiwa = WILAYAH_CHOROPLETH_DATA.reduce((acc, curr) => acc + curr.jiwaTerbantu, 0);

  // Filtered list
  const filteredWilayah = useMemo(() => {
    return WILAYAH_CHOROPLETH_DATA.filter((w) => {
      if (activeTabFilter !== "all" && w.status !== activeTabFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = w.nama.toLowerCase().includes(q);
        const matchKab = w.kabupaten.toLowerCase().includes(q);
        const matchMitra = w.mitraBpbdAktif.toLowerCase().includes(q);
        if (!matchNama && !matchKab && !matchMitra) return false;
      }
      return true;
    });
  }, [activeTabFilter, searchQuery]);

  // Leaflet map initialization
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-7.395, 112.745],
        zoom: 11,
        minZoom: 10,
        maxZoom: 15,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      polygonLayerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = polygonLayerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Render each district polygon with ONLY TWO COLORS (Hijau vs Kuning)
    filteredWilayah.forEach((w) => {
      const isGreen = w.status === "banyak_ditangani";
      const fillColor = isGreen ? "#16a34a" : "#eab308";
      const strokeColor = isGreen ? "#15803d" : "#ca8a04";
      const isSelected = selectedWilayah?.id === w.id;

      const polygon = L.polygon(w.polygon, {
        color: isSelected ? "#013220" : strokeColor,
        weight: isSelected ? 4 : 2,
        fillColor: fillColor,
        fillOpacity: isSelected ? 0.75 : 0.52,
        dashArray: isSelected ? "" : "3",
      });

      // Label Icon at district center
      const labelIcon = L.divIcon({
        className: "choropleth-label-badge",
        html: `
          <div style="
            background: ${isGreen ? "#052e16" : "#451a03"};
            color: #ffffff;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 2px 6px rgba(0,0,0,0.35);
            border: 1.5px solid ${isGreen ? "#86efac" : "#fef08a"};
            display: flex;
            align-items: center;
            gap: 4px;
            transform: translate(-50%, -50%);
          ">
            <span>${isGreen ? "🟢" : "🟡"}</span>
            <span>${w.nama.replace("Kecamatan ", "")} (${w.persentasePenanganan}%)</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker(w.center, { icon: labelIcon });

      // Interactive popup / tooltip
      polygon.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 12px; padding: 4px 6px;">
          <strong style="color: ${isGreen ? "#15803d" : "#b45309"}; font-size: 13px;">${w.nama}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">${w.kabupaten}</span>
          <div style="margin-top: 4px; font-weight: 600; color: #1e293b;">
            ${isGreen ? "🟢 Sudah Banyak Ditangani" : "🟡 Sedang Dalam Penanganan"} (${w.persentasePenanganan}%)
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">
            Jiwa Terbantu: <b>${w.jiwaTerbantu.toLocaleString("id-ID")} Jiwa</b>
          </div>
        </div>
        `,
        { sticky: true, direction: "top" }
      );

      // Click event
      const handleClick = () => {
        setSelectedWilayah(w);
        map.panTo(w.center);
      };

      polygon.on("click", handleClick);
      marker.on("click", handleClick);

      // Hover glow
      polygon.on("mouseover", () => {
        polygon.setStyle({
          fillOpacity: 0.82,
          weight: 3.5,
        });
      });

      polygon.on("mouseout", () => {
        if (selectedWilayah?.id !== w.id) {
          polygon.setStyle({
            fillOpacity: 0.52,
            weight: 2,
          });
        }
      });

      layerGroup.addLayer(polygon);
      layerGroup.addLayer(marker);
    });

    // Invalidate map size on view switch
    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [filteredWilayah, selectedWilayah]);

  return (
    <section className={`choropleth-thematic-section ${className}`} style={{ marginBottom: "32px" }}>
      {/* SECTION HEADER */}
      <div
        className="section-title"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "16px",
        }}
      >
        <div>
          <span
            className="eyebrow"
            style={{
              color: "#013220",
              fontWeight: 700,
              letterSpacing: "0.06em",
              fontSize: "0.78rem",
            }}
          >
            PETA TEMATIK KEWILAYAHAN (CHOROPLETH)
          </span>
          <h2
            style={{
              fontSize: "1.45rem",
              fontWeight: 800,
              color: "#013220",
              margin: "4px 0 0",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
            }}
          >
            <span>Peta Cakupan Penanganan Bantuan BPBD &amp; Mitra</span>
          </h2>
          <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: "0.88rem", maxWidth: "780px", lineHeight: 1.5 }}>
            Gambaran visual transparansi dua warna: Daerah yang telah banyak ditangani tuntas oleh armada Mitra &amp; BPBD (<strong>Hijau</strong>) dan daerah yang sedang dalam proses penanganan berjalan (<strong>Kuning</strong>).
          </p>
        </div>

        {/* View Mode Toggle: Peta Interaktif vs Rekap Tabel Excel */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setViewMode("map")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              border: viewMode === "map" ? "1.5px solid #013220" : "1px solid #cbd5e1",
              background: viewMode === "map" ? "#013220" : "#ffffff",
              color: viewMode === "map" ? "#ffffff" : "#475569",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <AppIcon name="map" size={14} /> Peta Tematik
          </button>
          <button
            type="button"
            onClick={() => setViewMode("table")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              border: viewMode === "table" ? "1.5px solid #013220" : "1px solid #cbd5e1",
              background: viewMode === "table" ? "#013220" : "#ffffff",
              color: viewMode === "table" ? "#ffffff" : "#475569",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <AppIcon name="grid" size={14} /> Rekapitulasi Data
          </button>
        </div>
      </div>

      {/* QUICK KPI COUNTER SUMMARY CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#f1f5f9",
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              flexShrink: 0,
            }}
          >
            🗺️
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
              Total Wilayah Pantauan
            </span>
            <strong style={{ fontSize: "1.25rem", color: "#0f172a", display: "block", lineHeight: 1.2 }}>
              {totalWilayah} Kecamatan
            </strong>
          </div>
        </div>

        {/* 🟢 HIJAU: SUDAH BANYAK DITANGANI */}
        <div
          style={{
            background: "#f0fdf4",
            border: "1.5px solid #86efac",
            borderRadius: "12px",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(22, 163, 74, 0.08)",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#16a34a",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              flexShrink: 0,
            }}
          >
            🟢
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700, textTransform: "uppercase" }}>
              Banyak Ditangani (Tuntas)
            </span>
            <strong style={{ fontSize: "1.25rem", color: "#15803d", display: "block", lineHeight: 1.2 }}>
              {countBanyak} Wilayah ({Math.round((countBanyak / totalWilayah) * 100)}%)
            </strong>
          </div>
        </div>

        {/* 🟡 KUNING: SEDANG DALAM PENANGANAN */}
        <div
          style={{
            background: "#fefce8",
            border: "1.5px solid #fde047",
            borderRadius: "12px",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(234, 179, 8, 0.08)",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#eab308",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              flexShrink: 0,
            }}
          >
            🟡
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "#854d0e", fontWeight: 700, textTransform: "uppercase" }}>
              Sedang Dalam Penanganan
            </span>
            <strong style={{ fontSize: "1.25rem", color: "#a16207", display: "block", lineHeight: 1.2 }}>
              {countSedang} Wilayah ({Math.round((countSedang / totalWilayah) * 100)}%)
            </strong>
          </div>
        </div>

        {/* TOTAL WARGA TERBANTU */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "14px 16px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "10px",
              background: "#e0f2fe",
              color: "#0369a1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              flexShrink: 0,
            }}
          >
            👥
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
              Jiwa Terdampak Terlayani
            </span>
            <strong style={{ fontSize: "1.25rem", color: "#0369a1", display: "block", lineHeight: 1.2 }}>
              {totalJiwa.toLocaleString("id-ID")} Jiwa
            </strong>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & SEARCH BAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          background: "#ffffff",
          padding: "12px 16px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "14px",
        }}
      >
        {/* Dual-Color Status Filter Tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveTabFilter("all")}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              border: activeTabFilter === "all" ? "1.5px solid #013220" : "1px solid #cbd5e1",
              background: activeTabFilter === "all" ? "#013220" : "#ffffff",
              color: activeTabFilter === "all" ? "#ffffff" : "#475569",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Semua Wilayah ({totalWilayah})
          </button>

          <button
            type="button"
            onClick={() => setActiveTabFilter("banyak_ditangani")}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              border: activeTabFilter === "banyak_ditangani" ? "1.5px solid #16a34a" : "1px solid #bbf7d0",
              background: activeTabFilter === "banyak_ditangani" ? "#16a34a" : "#f0fdf4",
              color: activeTabFilter === "banyak_ditangani" ? "#ffffff" : "#166534",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🟢 Banyak Ditangani ({countBanyak})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTabFilter("sedang_ditangani")}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              border: activeTabFilter === "sedang_ditangani" ? "1.5px solid #d97706" : "1px solid #fef08a",
              background: activeTabFilter === "sedang_ditangani" ? "#eab308" : "#fefce8",
              color: activeTabFilter === "sedang_ditangani" ? "#ffffff" : "#854d0e",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🟡 Sedang Ditangani ({countSedang})</span>
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "240px" }}>
          <input
            type="text"
            placeholder="Cari kecamatan / mitra..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "7px 12px 7px 32px",
              fontSize: "0.82rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              outline: "none",
            }}
          />
          <span style={{ position: "absolute", left: "10px", top: "8px", color: "#94a3b8", fontSize: "14px" }}>
            🔍
          </span>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "8px",
                top: "6px",
                border: "none",
                background: "none",
                color: "#94a3b8",
                cursor: "pointer",
                fontSize: "14px",
              }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* MAIN VIEW: MAP OR TABLE */}
      {viewMode === "map" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: selectedWilayah ? "1.6fr 1fr" : "1fr",
            gap: "16px",
            background: "#ffffff",
            padding: "14px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          {/* LEAFLET CHOROPLETH MAP CONTAINER */}
          <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", border: "1px solid #cbd5e1" }}>
            <div
              ref={mapContainerRef}
              style={{
                width: "100%",
                height: "460px",
                background: "#f8fafc",
                zIndex: 1,
              }}
            />

            {/* Map Legend Overlay (Top Right of Map) */}
            <div
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(6px)",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid rgba(0,0,0,0.1)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                zIndex: 400,
                fontSize: "0.76rem",
              }}
            >
              <span style={{ fontWeight: 800, color: "#013220", display: "block", marginBottom: "4px" }}>
                LEGENDA DUA WARNA
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" }}>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    background: "#16a34a",
                    border: "1px solid #15803d",
                    borderRadius: "3px",
                    display: "inline-block",
                  }}
                />
                <span style={{ color: "#166534", fontWeight: 700 }}>Hijau: Banyak Ditangani (&gt;80%)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    background: "#eab308",
                    border: "1px solid #ca8a04",
                    borderRadius: "3px",
                    display: "inline-block",
                  }}
                />
                <span style={{ color: "#854d0e", fontWeight: 700 }}>Kuning: Sedang Ditangani (40-79%)</span>
              </div>
            </div>
          </div>

          {/* DETAIL PANEL OF SELECTED WILAYAH */}
          {selectedWilayah && (
            <div
              style={{
                background: selectedWilayah.status === "banyak_ditangani" ? "#fbfdfb" : "#fffef9",
                border: selectedWilayah.status === "banyak_ditangani" ? "1.5px solid #86efac" : "1.5px solid #fde047",
                borderRadius: "12px",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
                  <div>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        color: "#64748b",
                      }}
                    >
                      {selectedWilayah.kabupaten}
                    </span>
                    <h3 style={{ margin: "2px 0 6px", fontSize: "1.2rem", fontWeight: 800, color: "#013220" }}>
                      {selectedWilayah.nama}
                    </h3>
                  </div>

                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 800,
                      padding: "4px 10px",
                      borderRadius: "999px",
                      background: selectedWilayah.status === "banyak_ditangani" ? "#dcfce7" : "#fef9c3",
                      color: selectedWilayah.status === "banyak_ditangani" ? "#15803d" : "#854d0e",
                      border: `1px solid ${selectedWilayah.status === "banyak_ditangani" ? "#86efac" : "#fde047"}`,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span>{selectedWilayah.status === "banyak_ditangani" ? "🟢" : "🟡"}</span>
                    <span>{selectedWilayah.status === "banyak_ditangani" ? "Banyak Ditangani" : "Sedang Ditangani"}</span>
                  </span>
                </div>

                {/* Progress bar penanganan */}
                <div style={{ margin: "10px 0 14px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem", fontWeight: 700, marginBottom: "4px" }}>
                    <span style={{ color: "#64748b" }}>Cakupan Bantuan Tersalurkan</span>
                    <span style={{ color: selectedWilayah.status === "banyak_ditangani" ? "#15803d" : "#b45309" }}>
                      {selectedWilayah.persentasePenanganan}%
                    </span>
                  </div>
                  <div style={{ height: "8px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        width: `${selectedWilayah.persentasePenanganan}%`,
                        background: selectedWilayah.status === "banyak_ditangani" ? "#16a34a" : "#eab308",
                        borderRadius: "999px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Logistics & Beneficiary Info */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.82rem" }}>
                  <div style={{ background: "#ffffff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <span style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                      Realisasi Bantuan Logistik:
                    </span>
                    <strong style={{ color: "#013220", fontSize: "0.88rem" }}>{selectedWilayah.jumlahBantuan}</strong>
                    <div style={{ color: "#475569", fontSize: "0.75rem", marginTop: "2px" }}>
                      Komoditas: {selectedWilayah.komoditasUtama}
                    </div>
                  </div>

                  <div style={{ background: "#ffffff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <span style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                      Warga Terlayani:
                    </span>
                    <strong style={{ color: "#013220", fontSize: "0.88rem" }}>
                      {selectedWilayah.jiwaTerbantu.toLocaleString("id-ID")} Jiwa ({selectedWilayah.kkTerlayani} KK)
                    </strong>
                    <div style={{ color: "#475569", fontSize: "0.75rem", marginTop: "2px" }}>
                      Posko Penyangga: <strong>{selectedWilayah.poskoPenyangga}</strong>
                    </div>
                  </div>

                  <div style={{ background: "#ffffff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    <span style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                      Mitra &amp; Satgas BPBD di Lapangan:
                    </span>
                    <span style={{ color: "#013220", fontWeight: 600 }}>{selectedWilayah.mitraBpbdAktif}</span>
                  </div>

                  <div style={{ padding: "8px 10px", borderRadius: "8px", background: "rgba(0,0,0,0.02)", borderLeft: `3px solid ${selectedWilayah.status === "banyak_ditangani" ? "#16a34a" : "#eab308"}` }}>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#334155", fontStyle: "italic", lineHeight: 1.45 }}>
                      "{selectedWilayah.catatanKewilayahan}"
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #e2e8f0", fontSize: "0.72rem", color: "#94a3b8", textAlign: "right" }}>
                ✓ Diperbarui berkala dari Sistem Pusdalops BPBD
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TABLE VIEW (CHOROCHROMATIC REKAP EXCEL FORMAT) */
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "0.86rem", color: "#013220" }}>
              Tabel Klasifikasi Dua Warna Penanganan Kewilayahan (Excel/GIS)
            </strong>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
              Menampilkan {filteredWilayah.length} dari {totalWilayah} Wilayah
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#f1f5f9", textAlign: "left", color: "#475569", borderBottom: "1.5px solid #cbd5e1" }}>
                  <th style={{ padding: "10px 14px", width: "40px" }}>No</th>
                  <th style={{ padding: "10px 14px" }}>Nama Wilayah</th>
                  <th style={{ padding: "10px 14px", width: "120px" }}>Warna Peta</th>
                  <th style={{ padding: "10px 14px", width: "180px" }}>Status Penanganan</th>
                  <th style={{ padding: "10px 14px", width: "110px", textAlign: "center" }}>Cakupan</th>
                  <th style={{ padding: "10px 14px" }}>Realisasi Logistik</th>
                  <th style={{ padding: "10px 14px" }}>Mitra &amp; Satgas BPBD</th>
                  <th style={{ padding: "10px 14px", width: "110px", textAlign: "right" }}>Warga Terbantu</th>
                </tr>
              </thead>
              <tbody>
                {filteredWilayah.map((w, idx) => {
                  const isGreen = w.status === "banyak_ditangani";
                  return (
                    <tr
                      key={w.id}
                      onClick={() => {
                        setSelectedWilayah(w);
                        setViewMode("map");
                      }}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        background: idx % 2 === 0 ? "#ffffff" : "#fcfdfc",
                      }}
                    >
                      <td style={{ padding: "10px 14px", color: "#94a3b8", fontWeight: 600 }}>{idx + 1}</td>
                      <td style={{ padding: "10px 14px" }}>
                        <strong style={{ color: "#013220", display: "block" }}>{w.nama}</strong>
                        <span style={{ color: "#64748b", fontSize: "0.75rem" }}>{w.kabupaten}</span>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "4px",
                              background: isGreen ? "#16a34a" : "#eab308",
                              display: "inline-block",
                              border: `1.5px solid ${isGreen ? "#15803d" : "#ca8a04"}`,
                            }}
                          />
                          <span style={{ fontWeight: 700, fontSize: "0.78rem", color: isGreen ? "#166534" : "#854d0e" }}>
                            {isGreen ? "Hijau" : "Kuning"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            background: isGreen ? "#f0fdf4" : "#fefce8",
                            color: isGreen ? "#15803d" : "#a16207",
                            border: `1px solid ${isGreen ? "#bbf7d0" : "#fde047"}`,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>{isGreen ? "🟢" : "🟡"}</span>
                          <span>{isGreen ? "Banyak Ditangani" : "Sedang Ditangani"}</span>
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: isGreen ? "#15803d" : "#b45309" }}>
                        {w.persentasePenanganan}%
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span style={{ color: "#1e293b", fontWeight: 600 }}>{w.jumlahBantuan}</span>
                        <div style={{ fontSize: "0.74rem", color: "#64748b" }}>{w.komoditasUtama}</div>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#475569" }}>
                        {w.mitraBpbdAktif}
                      </td>
                      <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                        {w.jiwaTerbantu.toLocaleString("id-ID")} Jiwa
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
