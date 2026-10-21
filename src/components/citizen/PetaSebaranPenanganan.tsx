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

// =========================================================================
// JARINGAN SIMPUL BATAS WILAYAH BERSAMA (INTERLOCKING SEAMLESS VERTICES)
// Setiap titik batas digunakan bersama oleh kecamatan yang berdampingan
// sehingga batas poligon menyatu 100% (seamless), persis seperti peta tematik GIS/Excel.
// =========================================================================

const V = {
  // Batas Terluar Utara (Surabaya)
  N_WEST: [-7.236, 112.670] as [number, number],
  N_NW: [-7.228, 112.710] as [number, number],
  N_MID: [-7.234, 112.748] as [number, number],
  N_NE: [-7.240, 112.790] as [number, number],
  N_EAST: [-7.250, 112.835] as [number, number],

  // Batas Terluar Timur (Garis Pantai Selat Madura & Muara)
  COAST_GUBENG: [-7.280, 112.832] as [number, number],
  COAST_RUNGKUT_1: [-7.308, 112.852] as [number, number],
  COAST_RUNGKUT_2: [-7.340, 112.870] as [number, number],
  COAST_SEDATI_1: [-7.375, 112.890] as [number, number],
  COAST_SEDATI_2: [-7.412, 112.898] as [number, number],
  COAST_BUDURAN: [-7.448, 112.875] as [number, number],
  COAST_SDA: [-7.485, 112.855] as [number, number],
  COAST_CANDI: [-7.522, 112.835] as [number, number],
  COAST_PORONG: [-7.562, 112.810] as [number, number],

  // Batas Terluar Selatan (Porong - Batas Pasuruan)
  S_MID: [-7.578, 112.735] as [number, number],
  S_WEST: [-7.564, 112.670] as [number, number],

  // Batas Terluar Barat (Sidoarjo Barat & Surabaya Barat)
  W_CANDI: [-7.514, 112.672] as [number, number],
  W_SDA: [-7.476, 112.678] as [number, number],
  W_BUDURAN: [-7.438, 112.682] as [number, number],
  W_GEDANGAN: [-7.404, 112.685] as [number, number],
  W_WARU: [-7.374, 112.688] as [number, number],
  W_GAYUNGAN: [-7.346, 112.695] as [number, number],
  W_WONOKROMO: [-7.312, 112.685] as [number, number],
  W_SUKO: [-7.274, 112.675] as [number, number],

  // Simpul Pertemuan & Batas Antar-Wilayah (Shared Topology)
  // Suko - Gubeng
  B_SUKO_GUB_1: [-7.256, 112.726] as [number, number],
  B_SUKO_GUB_WONO: [-7.276, 112.730] as [number, number], // Triple junction Suko-Gubeng-Wonokromo

  // Suko - Wono
  B_SUKO_WONO_1: [-7.292, 112.710] as [number, number],

  // Gubeng - Wono - Rungkut
  B_GUB_WONO_RUNG: [-7.290, 112.752] as [number, number], // Triple junction Gubeng-Wonokromo-Rungkut
  B_GUB_RUNG_1: [-7.294, 112.780] as [number, number],
  B_GUB_RUNG_2: [-7.296, 112.812] as [number, number],

  // Wono - Gayungan - Rungkut
  B_WONO_GAY_RUNG: [-7.326, 112.754] as [number, number], // Triple junction Wonokromo-Gayungan-Rungkut
  B_WONO_GAY_1: [-7.322, 112.712] as [number, number],
  B_WONO_GAY_2: [-7.325, 112.734] as [number, number],

  // Gayungan - Waru - Rungkut
  B_GAY_WARU_RUNG: [-7.346, 112.756] as [number, number], // Triple junction Gayungan-Waru-Rungkut
  B_GAY_WARU_1: [-7.353, 112.715] as [number, number],
  B_GAY_WARU_2: [-7.355, 112.738] as [number, number],

  // Waru - Rungkut - Sedati
  B_WARU_RUNG_SED: [-7.350, 112.775] as [number, number], // Triple junction Waru-Rungkut-Sedati
  B_RUNG_SED_1: [-7.348, 112.805] as [number, number],
  B_RUNG_SED_2: [-7.344, 112.840] as [number, number],

  // Waru - Gedangan - Sedati
  B_WARU_GED_SED: [-7.382, 112.775] as [number, number], // Triple junction Waru-Gedangan-Sedati
  B_WARU_SED_1: [-7.366, 112.775] as [number, number],
  B_WARU_GED_1: [-7.383, 112.715] as [number, number],
  B_WARU_GED_2: [-7.384, 112.748] as [number, number],

  // Gedangan - Buduran - Sedati
  B_GED_BUD_SED: [-7.420, 112.775] as [number, number], // Triple junction Gedangan-Buduran-Sedati
  B_GED_SED_1: [-7.400, 112.775] as [number, number],
  B_GED_BUD_1: [-7.416, 112.715] as [number, number],
  B_GED_BUD_2: [-7.418, 112.746] as [number, number],

  // Buduran - Sedati
  B_BUD_SED_1: [-7.428, 112.825] as [number, number],

  // Buduran - Sidoarjo Kota
  B_BUD_SDA_1: [-7.453, 112.710] as [number, number],
  B_BUD_SDA_2: [-7.456, 112.750] as [number, number],
  B_BUD_SDA_3: [-7.458, 112.800] as [number, number],

  // Sidoarjo Kota - Candi
  B_SDA_CANDI_1: [-7.489, 112.712] as [number, number],
  B_SDA_CANDI_2: [-7.491, 112.750] as [number, number],
  B_SDA_CANDI_3: [-7.495, 112.805] as [number, number],

  // Candi - Porong
  B_CANDI_PORONG_1: [-7.531, 112.710] as [number, number],
  B_CANDI_PORONG_2: [-7.533, 112.750] as [number, number],
  B_CANDI_PORONG_3: [-7.536, 112.795] as [number, number],
};

// 12 Wilayah Koridor Penanganan (Surabaya & Sidoarjo)
// Hanya 2 Warna: Hijau (Banyak Ditangani) & Kuning (Sedang Ditangani)
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
    center: [-7.436, 112.750],
    polygon: [
      V.W_BUDURAN,
      V.W_GEDANGAN,
      V.B_GED_BUD_1,
      V.B_GED_BUD_2,
      V.B_GED_BUD_SED,
      V.B_BUD_SED_1,
      V.COAST_SEDATI_2,
      V.COAST_BUDURAN,
      V.B_BUD_SDA_3,
      V.B_BUD_SDA_2,
      V.B_BUD_SDA_1,
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
    center: [-7.338, 112.726],
    polygon: [
      V.W_GAYUNGAN,
      V.W_WONOKROMO,
      V.B_WONO_GAY_1,
      V.B_WONO_GAY_2,
      V.B_WONO_GAY_RUNG,
      V.B_GAY_WARU_RUNG,
      V.B_GAY_WARU_2,
      V.B_GAY_WARU_1,
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
    center: [-7.260, 112.705],
    polygon: [
      V.W_SUKO,
      V.N_WEST,
      V.N_NW,
      V.B_SUKO_GUB_1,
      V.B_SUKO_GUB_WONO,
      V.B_SUKO_WONO_1,
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
    center: [-7.306, 112.722],
    polygon: [
      V.W_WONOKROMO,
      V.W_SUKO,
      V.B_SUKO_WONO_1,
      V.B_SUKO_GUB_WONO,
      V.B_GUB_WONO_RUNG,
      V.B_WONO_GAY_RUNG,
      V.B_WONO_GAY_2,
      V.B_WONO_GAY_1,
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
    center: [-7.265, 112.768],
    polygon: [
      V.N_NW,
      V.N_MID,
      V.N_NE,
      V.N_EAST,
      V.COAST_GUBENG,
      V.B_GUB_RUNG_2,
      V.B_GUB_RUNG_1,
      V.B_GUB_WONO_RUNG,
      V.B_SUKO_GUB_WONO,
      V.B_SUKO_GUB_1,
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
    center: [-7.322, 112.805],
    polygon: [
      V.B_GUB_WONO_RUNG,
      V.B_GUB_RUNG_1,
      V.B_GUB_RUNG_2,
      V.COAST_GUBENG,
      V.COAST_RUNGKUT_1,
      V.COAST_RUNGKUT_2,
      V.B_RUNG_SED_2,
      V.B_RUNG_SED_1,
      V.B_WARU_RUNG_SED,
      V.B_GAY_WARU_RUNG,
      V.B_WONO_GAY_RUNG,
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
    center: [-7.366, 112.735],
    polygon: [
      V.W_WARU,
      V.W_GAYUNGAN,
      V.B_GAY_WARU_1,
      V.B_GAY_WARU_2,
      V.B_GAY_WARU_RUNG,
      V.B_WARU_RUNG_SED,
      V.B_WARU_SED_1,
      V.B_WARU_GED_SED,
      V.B_WARU_GED_2,
      V.B_WARU_GED_1,
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
    center: [-7.385, 112.825],
    polygon: [
      V.B_WARU_RUNG_SED,
      V.B_RUNG_SED_1,
      V.B_RUNG_SED_2,
      V.COAST_RUNGKUT_2,
      V.COAST_SEDATI_1,
      V.COAST_SEDATI_2,
      V.B_BUD_SED_1,
      V.B_GED_BUD_SED,
      V.B_GED_SED_1,
      V.B_WARU_GED_SED,
      V.B_WARU_SED_1,
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
    center: [-7.400, 112.730],
    polygon: [
      V.W_GEDANGAN,
      V.W_WARU,
      V.B_WARU_GED_1,
      V.B_WARU_GED_2,
      V.B_WARU_GED_SED,
      V.B_GED_SED_1,
      V.B_GED_BUD_SED,
      V.B_GED_BUD_2,
      V.B_GED_BUD_1,
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
    center: [-7.468, 112.740],
    polygon: [
      V.W_SDA,
      V.W_BUDURAN,
      V.B_BUD_SDA_1,
      V.B_BUD_SDA_2,
      V.B_BUD_SDA_3,
      V.COAST_BUDURAN,
      V.COAST_SDA,
      V.B_SDA_CANDI_3,
      V.B_SDA_CANDI_2,
      V.B_SDA_CANDI_1,
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
    center: [-7.505, 112.735],
    polygon: [
      V.W_CANDI,
      V.W_SDA,
      V.B_SDA_CANDI_1,
      V.B_SDA_CANDI_2,
      V.B_SDA_CANDI_3,
      V.COAST_SDA,
      V.COAST_CANDI,
      V.B_CANDI_PORONG_3,
      V.B_CANDI_PORONG_2,
      V.B_CANDI_PORONG_1,
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
    center: [-7.545, 112.730],
    polygon: [
      V.S_WEST,
      V.W_CANDI,
      V.B_CANDI_PORONG_1,
      V.B_CANDI_PORONG_2,
      V.B_CANDI_PORONG_3,
      V.COAST_CANDI,
      V.COAST_PORONG,
      V.S_MID,
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
  const [viewMode, setViewMode] = useState<"vector" | "map" | "table">("vector");

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
    if (viewMode !== "map") return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [-7.405, 112.760],
        zoom: 11,
        minZoom: 10,
        maxZoom: 15,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      polygonLayerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = polygonLayerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Render interlocking polygons with clean solid white boundary lines
    filteredWilayah.forEach((w) => {
      const isGreen = w.status === "banyak_ditangani";
      const fillColor = isGreen ? "#16a34a" : "#eab308";
      const isSelected = selectedWilayah?.id === w.id;

      const polygon = L.polygon(w.polygon, {
        color: isSelected ? "#013220" : "#ffffff", // Garis putih bersih pemisah antar-wilayah
        weight: isSelected ? 4 : 2.5,
        fillColor: fillColor,
        fillOpacity: isSelected ? 0.95 : 0.82,
        opacity: 1,
      });

      // Clean, elegant label at district center (NO ugly black pins)
      const labelIcon = L.divIcon({
        className: "choropleth-label-clean",
        html: `
          <div style="
            background: ${isSelected ? "#013220" : "rgba(15, 23, 42, 0.85)"};
            color: #ffffff;
            padding: 2px 7px;
            border-radius: 6px;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 2px 5px rgba(0,0,0,0.25);
            border: 1px solid rgba(255,255,255,0.7);
            display: inline-flex;
            align-items: center;
            gap: 4px;
            transform: translate(-50%, -50%);
            cursor: pointer;
          ">
            <span>${isGreen ? "🟢" : "🟡"}</span>
            <span>${w.nama.replace("Kecamatan ", "")}</span>
          </div>
        `,
        iconSize: [0, 0],
      });

      const marker = L.marker(w.center, { icon: labelIcon });

      // Interactive tooltip
      polygon.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 12px; padding: 4px 6px;">
          <strong style="color: ${isGreen ? "#15803d" : "#b45309"}; font-size: 13px;">${w.nama}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">${w.kabupaten}</span>
          <div style="margin-top: 4px; font-weight: 700; color: #0f172a;">
            ${isGreen ? "🟢 Banyak Ditangani" : "🟡 Sedang Ditangani"} (${w.persentasePenanganan}%)
          </div>
          <div style="font-size: 11px; color: #475569; margin-top: 2px;">
            Terbantu: <b>${w.jiwaTerbantu.toLocaleString("id-ID")} Jiwa</b>
          </div>
        </div>
        `,
        { sticky: true, direction: "top" }
      );

      const handleClick = () => {
        setSelectedWilayah(w);
        map.panTo(w.center);
      };

      polygon.on("click", handleClick);
      marker.on("click", handleClick);

      polygon.on("mouseover", () => {
        polygon.setStyle({
          fillOpacity: 0.96,
          weight: 3.5,
          color: "#013220",
        });
      });

      polygon.on("mouseout", () => {
        if (selectedWilayah?.id !== w.id) {
          polygon.setStyle({
            fillOpacity: 0.82,
            weight: 2.5,
            color: "#ffffff",
          });
        }
      });

      layerGroup.addLayer(polygon);
      layerGroup.addLayer(marker);
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [viewMode, filteredWilayah, selectedWilayah]);

  // Convert (lat, lng) to SVG (x, y) coordinates for Vector Canvas View
  const svgBounds = useMemo(() => {
    const lats = Object.values(V).map((pt) => pt[0]);
    const lngs = Object.values(V).map((pt) => pt[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    return { minLat, maxLat, minLng, maxLng };
  }, []);

  const getSvgPoint = (lat: number, lng: number, width = 580, height = 520, pad = 36) => {
    const x = ((lng - svgBounds.minLng) / (svgBounds.maxLng - svgBounds.minLng)) * (width - 2 * pad) + pad;
    const y = ((svgBounds.maxLat - lat) / (svgBounds.maxLat - svgBounds.minLat)) * (height - 2 * pad) + pad;
    return [Number(x.toFixed(1)), Number(y.toFixed(1))];
  };

  const svgPaths = useMemo(() => {
    return WILAYAH_CHOROPLETH_DATA.map((w) => {
      const pts = w.polygon.map((p) => getSvgPoint(p[0], p[1]));
      const pathD = pts.reduce((acc, curr, i) => `${acc} ${i === 0 ? "M" : "L"} ${curr[0]} ${curr[1]}`, "") + " Z";
      const centerPt = getSvgPoint(w.center[0], w.center[1]);
      return {
        ...w,
        pathD,
        svgCenter: centerPt,
      };
    });
  }, [svgBounds]);

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
            Peta tematik kewilayahan presisi yang <strong>menyatu rapat antar-garis batas daerah</strong> dengan dua warna tegas: Daerah yang telah banyak ditangani tuntas (<strong>Hijau</strong>) dan daerah yang sedang dalam penanganan berjalan (<strong>Kuning</strong>).
          </p>
        </div>

        {/* View Mode Switcher: Mode Vektor Tematik vs Peta Leaflet vs Tabel */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setViewMode("vector")}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "7px 14px",
              borderRadius: "8px",
              border: viewMode === "vector" ? "1.5px solid #013220" : "1px solid #cbd5e1",
              background: viewMode === "vector" ? "#013220" : "#ffffff",
              color: viewMode === "vector" ? "#ffffff" : "#475569",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <span>🎨 Mode Vektor Tematik</span>
          </button>
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
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            <AppIcon name="map" size={14} /> Peta Geografis (Leaflet)
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
              fontWeight: 700,
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

      {/* MAIN VIEW CONTENT */}
      {viewMode === "table" ? (
        /* TABLE VIEW (CHOROCHROMATIC REKAP EXCEL FORMAT) */
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.03)" }}>
          <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "0.86rem", color: "#013220" }}>
              Tabel Klasifikasi Dua Warna Penanganan Kewilayahan (Format Excel / GIS)
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
                        setViewMode("vector");
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
      ) : (
        /* MAP CONTAINER (DUAL VIEW: SVG VECTOR CANVAS OR LEAFLET) */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: selectedWilayah ? "1.6fr 1fr" : "1fr",
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
                 MODE VEKTOR TEMATIK INTERLOCKING (SESUAI PERSIS DENGAN REFERENSI GAMBAR)
                 Setiap poligon kecamatan saling menempel sempurna dengan garis pemisah putih
                 dan background grid tipis layaknya visualisasi peta tematik GIS / Excel.
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
                  viewBox="0 0 580 520"
                  style={{
                    width: "100%",
                    height: "100%",
                    filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.08))",
                  }}
                >
                  <defs>
                    <filter id="vector-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#013220" floodOpacity="0.3" />
                    </filter>
                  </defs>

                  {/* Render Interlocking Polygon Paths */}
                  {svgPaths.map((w) => {
                    const isGreen = w.status === "banyak_ditangani";
                    const isSelected = selectedWilayah?.id === w.id;
                    const fillColor = isGreen ? "#16a34a" : "#eab308";

                    return (
                      <g key={w.id} onClick={() => setSelectedWilayah(w)} style={{ cursor: "pointer" }}>
                        <path
                          d={w.pathD}
                          fill={fillColor}
                          fillOpacity={isSelected ? 0.96 : 0.84}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? 3.5 : 2}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          filter={isSelected ? "url(#vector-glow)" : undefined}
                          style={{
                            transition: "all 0.2s ease",
                          }}
                        >
                          <title>
                            {w.nama} ({w.status === "banyak_ditangani" ? "🟢 Banyak Ditangani" : "🟡 Sedang Ditangani"}) - {w.persentasePenanganan}%
                          </title>
                        </path>

                        {/* District Name Label */}
                        <text
                          x={w.svgCenter[0]}
                          y={w.svgCenter[1]}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="#ffffff"
                          fontSize={isSelected ? "11px" : "10px"}
                          fontWeight="800"
                          style={{
                            pointerEvents: "none",
                            textShadow: "0 1px 3px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {w.nama.replace("Kecamatan ", "")}
                        </text>

                        <text
                          x={w.svgCenter[0]}
                          y={w.svgCenter[1] + 13}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill={isGreen ? "#bbf7d0" : "#fef08a"}
                          fontSize="8.5px"
                          fontWeight="700"
                          style={{
                            pointerEvents: "none",
                            textShadow: "0 1px 2px rgba(0,0,0,0.9)",
                          }}
                        >
                          {w.persentasePenanganan}%
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              /* LEAFLET GEOGRAPHIC MAP */
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

            {/* LEGENDA DUA WARNA (BOTTOM LEFT OVERLAY) */}
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
                maxWidth: "260px",
              }}
            >
              <span style={{ fontWeight: 800, color: "#013220", display: "block", marginBottom: "5px", fontSize: "0.76rem", letterSpacing: "0.03em" }}>
                LEGENDA DUA WARNA
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    background: "#16a34a",
                    border: "1.5px solid #ffffff",
                    borderRadius: "3px",
                    display: "inline-block",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
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
                    border: "1.5px solid #ffffff",
                    borderRadius: "3px",
                    display: "inline-block",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }}
                />
                <span style={{ color: "#854d0e", fontWeight: 700 }}>Kuning: Sedang Ditangani (40-79%)</span>
              </div>
              <small style={{ display: "block", color: "#64748b", marginTop: "5px", fontSize: "9.5px", borderTop: "1px dashed #e2e8f0", paddingTop: "3px" }}>
                *Garis putih memisahkan batas antar-kecamatan yang saling menempel
              </small>
            </div>
          </div>

          {/* DETAIL PANEL OF SELECTED WILAYAH */}
          {selectedWilayah && (
            <div
              style={{
                background: selectedWilayah.status === "banyak_ditangani" ? "#fbfdfb" : "#fffef9",
                border: selectedWilayah.status === "banyak_ditangani" ? "1.5px solid #86efac" : "1.5px solid #fde047",
                borderRadius: "14px",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
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
                    <h3 style={{ margin: "2px 0 6px", fontSize: "1.25rem", fontWeight: 800, color: "#013220" }}>
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
                <div style={{ margin: "12px 0 16px" }}>
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

              <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid #e2e8f0", fontSize: "0.72rem", color: "#94a3b8", textAlign: "right" }}>
                ✓ Diperbarui berkala dari Sistem Pusdalops BPBD
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
