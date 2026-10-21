# DOKUMEN KEBUTUHAN PRODUK (PRODUCT REQUIREMENTS DOCUMENT - PRD)
# SISTEM INFORMASI REKSA (RUANG EKOSISTEM KOLABORASI PASCABENCANA)

---

## DAFTAR INFORMASI DOKUMEN

| Parameter | Keterangan |
| :--- | :--- |
| **Nama Produk** | REKSA — Ruang Ekosistem Kolaborasi Pascabencana |
| **Kode Dokumen** | PRD-REKSA-2026-V1.0 |
| **Versi Dokumen** | 1.0.0 (Comprehensive Release) |
| **Status Dokumen** | Disetujui (Approved & Baseline) |
| **Klasifikasi Akses** | Terbuka / Publik untuk Pengembang & Pemangku Kepentingan |
| **Pemilik Produk (Product Owner)** | Tim Pengembang Ekosistem REKSA |
| **Target Pengguna** | Masyarakat Terdampak Bencana, Satgas Posko BPBD, Mitra Kemanusiaan/Relawan |
| **Repositori Kode** | `https://github.com/Septian-wq11/REKSA` |
| **Tanggal Pembaruan Terakhir** | 21 Oktober 2026 |

---

## DAFTAR ISI

1. [Bab 1: Ringkasan Eksekutif & Latar Belakang](#bab-1-ringkasan-eksekutif--latar-belakang)
2. [Bab 2: Visi, Misi, & Nilai Strategis](#bab-2-visi-misi--nilai-strategis)
3. [Bab 3: Profil Pengguna & Persona Ekosistem 3 Peran](#bab-3-profil-pengguna--persona-ekosistem-3-peran)
4. [Bab 4: Arsitektur Sistem & Desain Teknologi](#bab-4-arsitektur-sistem--desain-teknologi)
5. [Bab 5: Alur Kerja Terintegrasi & State Machine Kasus](#bab-5-alur-kerja-terintegrasi--state-machine-kasus)
6. [Bab 6: Spesifikasi Kebutuhan Fungsional Modul Warga (`citizen`)](#bab-6-spesifikasi-kebutuhan-fungsional-modul-warga-citizen)
7. [Bab 7: Spesifikasi Kebutuhan Fungsional Modul Posko Komando BPBD (`posko`)](#bab-7-spesifikasi-kebutuhan-fungsional-modul-posko-komando-bpbd-posko)
8. [Bab 8: Spesifikasi Kebutuhan Fungsional Modul Mitra Penyalur (`responder`)](#bab-8-spesifikasi-kebutuhan-fungsional-modul-mitra-penyalur-responder)
9. [Bab 9: Modul Kolaborasi Publik & Transparansi Nasional](#bab-9-modul-kolaborasi-publik--transparansi-nasional)
10. [Bab 10: Aturan Bisnis & Mesin Validasi Khusus](#bab-10-aturan-bisnis--mesin-validasi-khusus)
11. [Bab 11: Struktur Skema Database Relasional](#bab-11-struktur-skema-database-relasional)
12. [Bab 12: Spesifikasi Antarmuka API (RESTful Endpoints)](#bab-12-spesifikasi-antarmuka-api-restful-endpoints)
13. [Bab 13: Kebutuhan Non-Fungsional (NFR) & Desain Estetika](#bab-13-kebutuhan-non-fungsional-nfr--desain-estetika)
14. [Bab 14: Verifikasi Kualitas & 9 Skenario Pengujian Database](#bab-14-verifikasi-kualitas--9-skenario-pengujian-database)
15. [Bab 15: Roadmap Rilis & Indikator Kinerja Kunci (KPI)](#bab-15-roadmap-rilis--indikator-kinerja-kunci-kpi)

---

## BAB 1: RINGKASAN EKSEKUTIF & LATAR BELAKANG

### 1.1 Masalah di Lapangan Penanggulangan Bencana
Dalam fase tanggap darurat dan pascabencana di Indonesia, penyaluran bantuan kemanusiaan kerap menghadapi masalah krusial:
1. **Asimetri Informasi & Penumpukan Bantuan (Over-Supply):** Bantuan berupa pakaian bekas atau mi instan sering menumpuk di lokasi tertentu yang mudah diakses, sementara kebutuhan kritis (seperti popok bayi, tenda keluarga, atau air bersih) di posko terpencil tidak terpenuhi.
2. **Ketiadaan Validasi Tunggal Terpusat:** Laporan warga tersebar di media sosial atau aplikasi perpesanan tanpa verifikasi koordinat GPS dan bukti fisik yang terstruktur, memicu laporan ganda (*duplicate reports*) dan hoax.
3. **Bottleneck Koordinasi Multi-Mitra:** Mitra relawan, LSM, dan sektor swasta berjalan secara parsial tanpa keterpaduan dengan Posko Komando BPBD (*Badan Penanggulangan Bencana Daerah*), mengakibatkan tumpang tindih alokasi.
4. **Hilangnya Akuntabilitas Serah Terima Fisik:** Bantuan yang disalurkan seringkali tidak terdokumentasi secara legal formal dengan Berita Acara Serah Terima (BAST) dan rekonsiliasi sisa kekurangan yang akurat.

### 1.2 Solusi REKSA
**REKSA (Ruang Ekosistem Kolaborasi Pascabencana)** hadir sebagai platform perangkat lunak *single source of truth* berbasis web modern yang menghubungkan tiga entitas utama:
- **Warga / Masyarakat Terdampak** sebagai pelapor kebutuhan riil tingkat keluarga (KK).
- **Posko Komando BPBD Wilayah** sebagai otoritas verifikator, kurator bursa bantuan, dan pengendali alokasi resmi.
- **Mitra Penyalur / Responder Kemanusiaan** (PMI, MDMC, Tagana, Dompet Dhuafa, Baznas, komunitas relawan) sebagai penyedia dan pengantar bantuan logistik.

---

## BAB 2: VISI, MISI, & NILAI STRATEGIS

### 2.1 Visi Produk
Mewujudkan rantai pasok kemanusiaan pascabencana yang berkeadilan, transparan, cepat, dan terkoordinasi secara presisi hingga ke tingkat unit keluarga terdampak di seluruh Indonesia.

### 2.2 Misi Produk
1. Memotong rantai birokrasi pelaporan darurat masyarakat melalui formulir terpandu 5 langkah dengan geolocation GPS instan.
2. Menghadirkan SLA verifikasi laporan Posko BPBD kurang dari 24 jam dengan sistem klarifikasi interaktif 2 arah.
3. Membuka katalog kebutuhan terverifikasi ke dalam *Bursa Bantuan Terbuka* untuk diakses seluruh mitra tanpa risiko over-alokasi (*quota-capping engine*).
4. Menyajikan transparansi nasional persebaran penanganan dan komparasi respon BPBD vs Mitra secara real-time.

---

## BAB 3: PROFIL PENGGUNA & PERSONA EKOSISTEM 3 PERAN

Aplikasi REKSA beroperasi di bawah matriks otorisasi berbasis peran (*Role-Based Access Control* / RBAC):

```
+-----------------------------------------------------------------------------+
|                           EKOSISTEM 3 PERAN REKSA                           |
+-----------------------------------------------------------------------------+
|                                                                             |
|  [ 🏠 WARGA TERDAMPAK ]        [ 🛡️ POSKO BPBD ]       [ 🚚 MITRA PENYALUR ] |
|  - Lapor Kebutuhan Darurat      - Verifikasi Kasus     - Telusuri Bursa      |
|  - GPS / Peta Geolocation       - Klarifikasi 2-Arah   - Komitmen Bantuan    |
|  - Kompresi Foto Lapangan       - Rilis ke Bursa       - Armada Mandiri/Posko|
|  - Pantau Siklus Bantuan        - Kontrol Over-Alokasi - Misi & Tracking     |
|  - Respon Klarifikasi           - Terbitkan BAST       - Lapor Kendala Rute  |
|  - Konfirmasi Penerimaan        - Audit Logistik       - Rekap Misi Selesai  |
|                                                                             |
+-----------------------------------------------------------------------------+
```

### 3.1 Persona 1: Warga / Masyarakat Terdampak (`citizen`)
- **Tujuan:** Melaporkan kebutuhan logistik, tenda, makanan, atau obat-obatan bagi keluarganya atau lingkungan RT/RW tempat pengungsian secara cepat menggunakan gawai seluler dengan kuota internet terbatas.
- **Tantangan:** Jaringan internet lambat di lokasi bencana, tidak paham koordinat angka, rentan dimintai klarifikasi berulang kali.
- **Fitur Kunci:** Form 5-step wizard, kompresi otomatis foto via HTML5 Canvas (< 300 KB), picker peta interaktif OpenStreetMap, dashboard pelacakan status transparan, modal tanggapan klarifikasi satu klik.

### 3.2 Persona 2: Posko Komando BPBD (`posko`)
- **Tujuan:** Memvalidasi ribuan laporan masuk, menentukan skala prioritas darurat, memverifikasi foto bukti, mengoordinasikan distribusi multi-mitra, dan menerbitkan BAST resmi pemerintah.
- **Tantangan:** Beban kerja tinggi, duplikasi permintaan, data tidak realistis, kekurangan armada angkut posko.
- **Fitur Kunci:** 6 Kartu ringkasan metrik beban kerja, antarmuka verifikasi cepat (< 24 jam), sistem penolakan berarahan, kontrol pembatasan alokasi multi-mitra (*anti-over-allocation*), pencatatan tanda terima logistik parsial/penuh, cetak Berita Acara Serah Terima (BAST).

### 3.3 Persona 3: Mitra Penyalur / Organisasi Kemanusiaan (`responder`)
- **Tujuan:** Mengetahui posko atau titik mana yang membutuhkan komoditas spesifik sesuai kapasitas logistik organisasi mereka (misal: beras, selimut, armada tangki air, perahu karet).
- **Tantangan:** Sulit mengetahui status sisa kebutuhan yang belum tersuplai, risiko membawa bantuan yang ternyata sudah disediakan pihak lain.
- **Fitur Kunci:** Filter Bursa Bantuan interaktif per provinsi/komoditas, penawaran komitmen fleksibel (mandiri atau titip posko), penerbitan Surat Perintah Tugas Misi digital, live waypoint tracking, dan pelaporan rintangan akses jalan.

---

## BAB 4: ARSITEKTUR SISTEM & DESAIN TEKNOLOGI

### 4.1 Diagram Tumpukan Teknologi (Tech Stack)

| Lapisan | Komponen | Versi | Peran & Justifikasi Arsitektur |
| :--- | :--- | :--- | :--- |
| **Backend Core** | Laravel Framework | 12.x | RESTful API terstandarisasi, Database Migrations, Eloquent ORM, Validasi Request, Sanctum RBAC |
| **Bahasa Backend** | PHP | 8.2+ | Tipe data kuat (*strict types*), performa tinggi, kompatibel dengan ekosistem Linux/Windows server |
| **Frontend UI** | React | 19.0 | Reaktif, component-driven, Hooks arsitektur untuk state management tanpa dependensi eksternal berat |
| **Type Safety** | TypeScript | 5.7+ | Pengetikan statis untuk kontrak API, data model, dan state UI guna mencegah runtime error |
| **Bundler & Build** | Vite & Rolldown | 8.0+ | Pembangunan bundle cepat (< 2.8s), code-splitting cerdas (`vendor-leaflet`, `vendor-react`) |
| **Peta & Geospasial** | Leaflet + OpenStreetMap | 1.9.4 | Pemetaan interaktif bebas lisensi komersial, custom pin marker, reverse geocoding, visualisasi GIS |
| **Sistem Desain** | Vanilla CSS + Tailwind v4 | Modern | Palet identitas khusus bencana: *Deep Forest Green* (`#013220`), *Emerald Green* (`#10b981`), dan *Muted Slate* |
| **Penyimpanan Data** | SQLite / MySQL / PostgreSQL | Relasional | Transaksi ACID, foreign key integrity, pencatatan jejak audit (*audit trail*) |

---

## BAB 5: ALUR KERJA TERINTEGRASI & STATE MACHINE KASUS

### 5.1 Siklus Hidup Status Kasus Kebutuhan (`status`)
Setiap kebutuhan warga berpindah status sesuai *state machine* berikut:

```
[ Diajukan / Baru ]
        │
        ▼
[ Dalam Verifikasi ] ◄──────────────────┐
        │                               │
        ├─────────► [ Perlu Klarifikasi ] (Warga kirim perbaikan data/foto)
        │
        ├─────────► [ Ditolak ] (Alasan spesifik & rekomendasi)
        │
        ▼
[ Kebutuhan Terbuka ] (Muncul di Bursa Bantuan)
        │
        ├─────────► [ Klaim Diajukan ] (Mitra mengajukan komitmen)
        │
        ▼
[ Sebagian Terpenuhi ] (Alokasi volume parsial disetujui BPBD)
        │
        ▼
[ Teralokasi Penuh ] (Total alokasi resmi = 100% target volume)
        │
        ▼
[ Dalam Pengiriman ] (Mitra menjalankan misi ke lokasi/posko)
        │
        ▼
[ Selesai / Terpenuhi ] (Penerimaan fisik diverifikasi & BAST terbit)
```

---

## BAB 6: SPESIFIKASI KEBUTUHAN FUNGSIONAL MODUL WARGA (`citizen`)

### 6.1 Formulir Lapor Kebutuhan Darurat (5-Step Interactive Wizard)
- **FR-CIT-01 (Step 1: Kategori & Komoditas):**
  - Pengguna memilih kategori kebutuhan: Makanan & Minuman Siap Saji, Tenda & Hunian Sementara, Obat-obatan & Medis, Pakaian & Selimut, Sanitasi & Air Bersih, Perlengkapan Bayi/Lansia, Logistik Khusus.
  - Menginput volume permintaan spesifik (contoh: "150 Paket", "4 Unit", "1000 Liter").
  - Menginput estimasi jumlah Kepala Keluarga (KK) dan jiwa terdampak.
- **FR-CIT-02 (Step 2: Geolocation & Peta Posko):**
  - Tombol **"Gunakan Koordinat GPS Saya"** membaca posisi riil perangkat browser (`navigator.geolocation`).
  - Peta interaktif Leaflet memungkinkan pengguna menggeser pin marker untuk menandai titik balai RW, pengungsian mandiri, atau posko darurat terdekat.
  - Dropdown administratif berjenjang: Provinsi, Kabupaten/Kota, Kecamatan, Kelurahan/Desa, dan Alamat Detail.
- **FR-CIT-03 (Step 3: Kondisi Fisik Lapangan & Aksesibilitas):**
  - Input kondisi rute jalan (Dapat dilalui truk besar, hanya roda dua, atau terisolir banjir/longsor).
  - Status ketersediaan listrik dan air bersih setempat.
- **FR-CIT-04 (Step 4: Lampiran Foto Bukti & Kompresi Klien Otomatis):**
  - Unggah foto bukti fisik kerusakan atau kondisi pengungsi.
  - **Aturan Teknis Klien:** Foto otomatis dikompresi di browser menggunakan elemen Canvas ke resolusi maksimum lebar 1280px dengan kualitas JPEG 0.82 sebelum dikonversi ke Base64 / Multipart. Ini mencegah kegagalan unggah akibat koneksi lemot dan menjaga ukuran file < 350 KB.
- **FR-CIT-05 (Step 5: Tinjauan & Pengiriman Data):**
  - Menampilkan ringkasan komprehensif seluruh isian sebelum pengguna menekan tombol final "Kirim Laporan Resmi".
  - Sistem menghasilkan nomor tiket unik: `RK-YYYYMMDD-XXXX`.

### 6.2 Monitoring Kasus & Riwayat Laporan Saya
- **FR-CIT-06:** Daftar kasus yang diajukan oleh akun warga yang login.
- **FR-CIT-07:** Kartu laporan dilengkapi pill status berwarna dinamis, waktu pengajuan, posko penanggung jawab, dan nama koordinator.
- **FR-CIT-08:** Warga dapat melakukan penyuntingan (edit) data kasus atau pembatalan (delete) selama laporan masih berstatus `Diajukan` atau `Perlu Klarifikasi`.

### 6.3 Respon Cepat Klarifikasi 2-Arah (`CitizenClarificationModal`)
- **FR-CIT-09:** Jika posko BPBD mengubah status menjadi `Perlu Klarifikasi`, sistem menampilkan banner peringatan darurat mencolok pada dashboard warga.
- **FR-CIT-10:** Modal klarifikasi menampilkan pertanyaan petugas, kategori klarifikasi yang diminta, serta opsi unggah foto susulan yang lebih jelas tanpa menghapus foto bukti awal.
- **FR-CIT-11:** Warga dapat mengoreksi jumlah kebutuhan (contoh: dari "Banyak" menjadi "16 Pack Popok Ukuran M & L") dan mengirim respon langsung. Status laporan otomatis kembali ke `Dalam Verifikasi`.

### 6.4 Konfirmasi Penerimaan Bantuan
- **FR-CIT-12:** Warga dapat menandatangani konfirmasi digital saat armada bantuan tiba di lokasi pengungsian, mencatat volume aktual yang diterima, serta memberikan rating dan catatan kelayakan bantuan.

---

## BAB 7: SPESIFIKASI KEBUTUHAN FUNGSIONAL MODUL POSKO KOMANDO BPBD (`posko`)

### 7.1 Ringkasan Beban Kerja Operasional (6 Workload Metrics Cards)
- **FR-POS-01:** Menampilkan 6 metrik utama operasional real-time:
  1. **Menunggu Verifikasi:** Jumlah laporan baru yang butuh audit posko.
  2. **Kebutuhan Prioritas:** Laporan berurgensi Kritis dan Tinggi.
  3. **Katalog Bursa Terbuka:** Kebutuhan terverifikasi yang sedang dibuka untuk mitra.
  4. **Penawaran Menunggu:** Komitmen bantuan mitra yang perlu persetujuan kuota posko.
  5. **Misi Penyaluran Aktif:** Armada mitra yang sedang meluncur di lapangan.
  6. **Perlu Konfirmasi Fisik:** Bantuan yang telah tiba dan menunggu BAST.

### 7.2 Verifikasi Laporan Masuk & Penilaian Urgensi (< 24 Jam SLA)
- **FR-POS-02:** Petugas posko memeriksa detail lokasi GPS, foto bukti, dan data kontak pelapor.
- **FR-POS-03 (Aksi Verifikasi & Publikasi Bursa):** Menyetujui laporan, menetapkan tingkat urgensi resmi (Kritis / Tinggi / Sedang / Rendah), dan otomatis membuat entri di tabel `bursa_bantuans`.
- **FR-POS-04 (Aksi Permintaan Klarifikasi):** Meminta kejelasan pelapor dengan memilih kategori (Foto Buram, Jumlah Tidak Realistis, Lokasi Kurang Spesifik, Data Duplikat) beserta instruksi pertanyaan rinci.
- **FR-POS-05 (Aksi Penolakan Kasus):** Menolak laporan yang tidak valid, mencantumkan alasan hukum/logistik yang jelas, serta memberikan arahan tindak lanjut resmi bagi warga (contoh: menghubungi Call Center 112 atau Dinas PU).

### 7.3 Manajemen Penawaran Mitra & Mesin Anti Over-Allocation
- **FR-POS-06:** Menerima pengajuan penawaran bantuan dari mitra organisasi kemanusiaan.
- **FR-POS-07 (Anti-Over-Allocation Capping):** Jika kebutuhan warga sebesar 100 lembar selimut, Mitra A menawarkan 60 lembar dan disetujui, lalu Mitra B menawarkan 60 lembar, sistem secara cerdas membatasi alokasi Mitra B maksimal hanya sebesar sisa kekurangan (40 lembar).
- **FR-POS-08:** Total alokasi bantuan resmi yang disetujui tidak boleh pernah melampaui 100% kebutuhan riil warga.
- **FR-POS-09:** Mengubah status kebutuhan secara otomatis menjadi `Sebagian Terpenuhi` atau `Teralokasi Penuh`.

### 7.4 Verifikasi Fisik & Penerbitan Dokumen Resmi BAST
- **FR-POS-10:** Saat logistik tiba di gudang posko atau lokasi warga, petugas memverifikasi kuantitas dan kelayakan fisik.
- **FR-POS-11:** Sistem mendukung penerimaan fisik sebagian (misal: disetujui 50 karung beras, yang datang layak 35 karung, 15 karung rusak basah). Sisa kekurangan tetap tercatat terbuka.
- **FR-POS-12 (Cetak BAST Digital):** Menghasilkan dokumen resmi cetak Berita Acara Serah Terima (BAST) berstandar format administrasi penanggulangan bencana BPBD lengkap dengan Nomor Register, Pihak Pertama, Pihak Kedua, Rincian Komoditas, dan Tempat Tanda Tangan.

---

## BAB 8: SPESIFIKASI KEBUTUHAN FUNGSIONAL MODUL MITRA PENYALUR (`responder`)

### 8.1 Penelusuran Bursa Bantuan Terbuka (Public Marketplace)
- **FR-MIT-01:** Menampilkan katalog kebutuhan yang telah diverifikasi BPBD dengan filter:
  - Berdasarkan Provinsi dan Posko Wilayah Rujukan.
  - Berdasarkan Kategori Komoditas (Pangan, Sanitasi, Tenda, Obat, dll).
  - Berdasarkan Tingkat Urgensi Bencana (Prioritas Kritis didahulukan).
- **FR-MIT-02:** Menampilkan bilah kemajuan alokasi (misal: *60% Terpenuhi, Kurang 40 Paket*).

### 8.2 Pengajuan Komitmen Penawaran Bantuan
- **FR-MIT-03:** Mitra mengajukan kesiapan bantuan dengan mengisi:
  - Jumlah volume yang disanggupi (penuh atau sebagian).
  - Tanggal dan jam estimasi kesiapan logistik.
  - Catatan spesifikasi teknis barang bantuan.
- **FR-MIT-04 (Fleksibilitas Metode Penyaluran):**
  - **Opsi Mandiri:** Mitra memiliki armada kendaraan sendiri (truk tangki air, ambulans, mobil boks) dan akan mengantar langsung ke titik warga.
  - **Opsi Serah Terima Posko:** Mitra tidak memiliki kendaraan angkut operasional, bantuan diantar/diserahkan di gudang induk BPBD untuk didistribusikan armada satgas pemerintah.

### 8.3 Manajemen Surat Perintah Misi & Pelacakan Lapangan
- **FR-MIT-05:** Setelah penawaran disetujui BPBD, sistem menerbitkan Surat Perintah Tugas Misi resmi dengan kode `MSI-YYYYMMDD-XXXX`.
- **FR-MIT-06 (Tahapan Misi Real-time):**
  1. *Persiapan Logistik & Muat Armada*
  2. *Dalam Perjalanan Menuju Lokasi (Waypoint tracking)*
  3. *Tiba di Lokasi & Proses Serah Terima*
  4. *Selesai / Terverifikasi BAST*
- **FR-MIT-07 (Lapor Kendala Rute / Roadblocks):** Mitra di lapangan dapat melaporkan rintangan darurat (jalan amblas, pohon tumbang, jembatan terputus, cuaca ekstrem) yang langsung memunculkan peringatan pada posko induk.

---

## BAB 9: MODUL KOLABORASI PUBLIK & TRANSPARANSI NASIONAL

### 9.1 Peta Persebaran Respon Bantuan Nasional (BPBD vs Mitra Kemanusiaan)
Komponen: [PetaSebaranPenanganan.tsx](file:///d:/reksa-v1/src/components/citizen/PetaSebaranPenanganan.tsx)
- **FR-PUB-01 (Dual View Engine):**
  - **Mode Vektor Tematik SVG:** Peta choropleth kepulauan Indonesia berdesain ultra-ringan, interaktif, dengan hover tooltip dan zoom koordinat.
  - **Mode GIS OpenStreetMap (Leaflet):** Peta satelit/topografi dengan layer pin koordinat posko riil di seluruh nusantara.
- **FR-PUB-02 (Klasifikasi Proporsi Respon Bantuan):**
  - **Hijau Tua Forest (`#013220`):** Wilayah provinsi yang didominasi respon penyaluran Posko BPBD (>50%).
  - **Hijau Emerald (`#10b981`):** Wilayah provinsi yang didominasi respon Mitra Kemanusiaan (>50%).
  - **Abu-abu Muted Slate (`#e2e8f0`):** Wilayah terkendali dengan pemantauan rutin posko.
- **FR-PUB-03 (Sidebar Komparasi Dual Progress Bar):**
  - Menampilkan persentase perbandingan riil: contoh *BPBD (59%) vs Mitra (41%)*.
  - Rincian volume paket komparatif: contoh *🏢 BPBD: 11.748 Paket vs 🤝 Mitra: 8.164 Paket*.
- **FR-PUB-04 (Mode Rekapitulasi Tabel Data):** Menyajikan data tabular 32+ provinsi lengkap dengan filter pulau, status dominasi respon, dan volume warga terbantu.

### 9.2 Grafik Transparansi & Realisasi Logistik Nasional
Komponen: [GrafikTransparansiBantuan.tsx](file:///d:/reksa-v1/src/components/common/GrafikTransparansiBantuan.tsx)
- **FR-PUB-05:** Visualisasi pemenuhan target logistik nasional per komoditas utama (Pangan, Air Bersih, Tenda, Obat, Sandang).
- **FR-PUB-06:** Menggunakan visualisasi persentase berbasis brand identity (hijau dan putih) untuk memudahkan audit publik.

### 9.3 Indikator Perbandingan Kecepatan Respon (SLA Comparative)
Komponen: [PerbandinganKecepatanRespon.tsx](file:///d:/reksa-v1/src/components/common/PerbandinganKecepatanRespon.tsx)
- **FR-PUB-07:** Menampilkan metrik rata-rata waktu respon:
  - *SLA Verifikasi Posko BPBD:* < 4.2 Jam.
  - *SLA Penerbitan Misi Logistik:* < 6.8 Jam.
  - *Kecepatan Penyaluran Lapangan Tercepat:* 2.1 Jam.

### 9.4 Ruang Komunikasi Terpadu 3 Peran (`ChatKoordinasi.tsx`)
Komponen: [ChatKoordinasi.tsx](file:///d:/reksa-v1/src/components/common/ChatKoordinasi.tsx)
- **FR-PUB-08:** Saluran komunikasi perpesanan instan lintas peran terorganisir:
  - Saluran Koordinasi Umum Siaga Bencana.
  - Saluran Logistik & Transportasi.
  - Saluran Medis & Penyelamatan Jiwa.
  - Saluran Khusus per Kasus/Posko Wilayah.

### 9.5 Asisten Cerdas "Tanya REKSA AI" (`ReksaAiChatbot.tsx`)
Komponen: [ReksaAiChatbot.tsx](file:///d:/reksa-v1/src/components/common/ReksaAiChatbot.tsx)
- **FR-PUB-09:** Chatbot interaktif ramah pengguna berbasis panduan SOP BNPB/BPBD yang mampu menjawab:
  - Cara mengajukan permohonan logistik darurat bagi warga awam.
  - Syarat bergabung sebagai mitra penyalur resmi terverifikasi.
  - Standar keselamatan evakuasi bencana banjir, gempa, dan tanah longsor.

---

## BAB 10: ATURAN BISNIS & MESIN VALIDASI KHUSUS

### 10.1 Aturan Bisnis #1: Kepemilikan & Hak Akses Kasus (Security Isolation)
- **BR-01:** Laporan yang dibuat oleh User A (`citizen_id = A`) **hanya dapat diubah, dihapus, atau dijawab klarifikasinya** oleh User A atau Petugas Posko BPBD berwenang.
- **BR-02:** Percobaan akses atau mutasi oleh User B (`citizen_id = B`) wajib ditolak sistem dengan respon `HTTP 403 Forbidden` (Terverifikasi di Skenario Pengujian 9).

### 10.2 Aturan Bisnis #2: Integritas Riwayat Klarifikasi
- **BR-03:** Saat warga mengunggah foto perbaikan pada proses klarifikasi, foto bukti awal di kolom `foto_bukti` tidak boleh ditimpa atau dihapus, melainkan disimpan pada `foto_klarifikasi` dan riwayat log terstruktur di `riwayat_klarifikasi`.
- **BR-04:** Jawaban klarifikasi warga mengubah status laporan kembali menjadi `Dalam Verifikasi` agar ditinjau ulang petugas posko, dan **tidak langsung otomatis disetujui**.

### 10.3 Aturan Bisnis #3: Pencegahan Over-Allocation Multi-Mitra
- **BR-05:** Didefinisikan:
  $$\text{TargetVolume} = V_{\text{target}}$$
  $$\text{TotalApproved} = \sum V_{\text{mitra\_disetujui}}$$
  $$\text{SisaKekurangan} = \max(0, V_{\text{target}} - \text{TotalApproved})$$
- **BR-06:** Jika tawaran mitra baru $V_{\text{tawaran}} > \text{SisaKekurangan}$, maka kuota yang disetujui wajib di-*cap* sebesar:
  $$V_{\text{approved}} = \min(V_{\text{tawaran}}, \text{SisaKekurangan})$$
- **BR-07:** Kasus berstatus `Teralokasi Penuh` jika $\text{SisaKekurangan} = 0$, atau `Sebagian Terpenuhi` jika $0 < \text{TotalApproved} < V_{\text{target}}$.

### 10.4 Aturan Bisnis #4: Fleksibilitas Armada Mitra
- **BR-08:** Mitra kemanusiaan berhak mengajukan bantuan logistik tanpa kewajiban memiliki armada kendaraan sendiri (`metode_penyaluran = 'serah_posko'`). Posko BPBD wajib memfasilitasi armada distribusi lanjutan.

### 10.5 Aturan Bisnis #5: Audit Trail Mutlak
- **BR-09:** Setiap aksi mutasi state (pembuatan laporan, perubahan status, permintaan klarifikasi, jawaban klarifikasi, persetujuan bursa, penerbitan misi, dan serah terima BAST) wajib mencatat entri otomatis pada tabel `log_aktivitas`.

---

## BAB 11: STRUKTUR SKEMA DATABASE RELASIONAL

```
+--------------------------------------------------------------------------------------------------+
|                                    SKEMA RELASIONAL REKSA                                        |
+--------------------------------------------------------------------------------------------------+
|                                                                                                  |
|   +-------------------+          +--------------------+          +---------------------+         |
|   |       users       | 1      * |  posko_wilayahs    | 1      * |   kebutuhan_wargas  |         |
|   |-------------------|----------|--------------------|----------|---------------------|         |
|   | id (PK)           |          | id (PK)            |          | id (PK)             |         |
|   | name              |          | kode_posko         |          | kode_kasus (UQ)     |         |
|   | email (UQ)        |          | nama_posko         |          | posko_id (FK)       |         |
|   | role              |          | penanggung_jawab   |          | citizen_id (FK)     |         |
|   | organization      |          | telepon, latitude  |          | status              |         |
|   +-------------------+          | longitude, status  |          | kategori_kebutuhan  |         |
|             │                    +--------------------+          | volume_permintaan   |         |
|             │ 1                                                  | foto_bukti (text)   |         |
|             │                                                    | riwayat_klarifikasi |         |
|             ▼ *                                                  +---------------------+         |
|   +--------------------+                                                    │ 1                  |
|   |  penawaran_mitras  | *                                                  │                    |
|   |--------------------|----------------------------------------------------+                    |
|   | id (PK)            |                                                    │                    |
|   | bursa_id (FK)      |                                                    ▼ 1                  |
|   | kebutuhan_id (FK)  |                                         +---------------------+         |
|   | mitra_id (FK)      |                                         |   bursa_bantuans    |         |
|   | volume_angka       |                                         |---------------------|         |
|   | metode_penyaluran  |                                         | id (PK)             |         |
|   | status             |                                         | kebutuhan_id (FK)   |         |
|   +--------------------+                                         | posko_id (FK)       |         |
|             │ 1                                                  | target_volume       |         |
|             │                                                    | status_bursa        |         |
|             ▼ 1                                                  +---------------------+         |
|   +--------------------+                                                                         |
|   |  misi_penyalurans  |                                                                         |
|   |--------------------|         +--------------------+          +---------------------+         |
|   | id (PK)            |         |   log_aktivitas    |          |    chat_messages    |         |
|   | kode_misi (UQ)     |         |--------------------|          |---------------------|         |
|   | penawaran_id (FK)  |         | id (PK)            |          | id (PK)             |         |
|   | status_tahapan     |         | kebutuhan_id (FK)  |          | channel             |         |
|   | armada_info        |         | user_id (FK)       |          | sender_id (FK)      |         |
|   | live_lat, live_lng |         | aksi, catatan      |          | message             |         |
|   +--------------------+         +--------------------+          +---------------------+         |
|                                                                                                  |
+--------------------------------------------------------------------------------------------------+
```

### 11.1 Deskripsi Entitas Utama
1. **`users`**: Menyimpan kredensial pengguna, profil instansi/organisasi, nomor kontak darurat, dan hak peran (`citizen`, `posko`, `responder`, `admin`).
2. **`posko_wilayahs`**: Entitas pos komando resmi terdata (koordinat lat/lng untuk Leaflet map, nomor telepon siaga 24 jam, kapasitas pengungsi, penanggung jawab).
3. **`kebutuhan_wargas`**: Entitas master laporan kasus (kategori, kuantitas volume, data wilayah terperinci, koordinat GPS, foto bukti kompresi, alasan penolakan, total alokasi dan penerimaan resmi).
4. **`bursa_bantuans`**: Entitas etalase katalog terbuka kebutuhan yang siap didanai/disuplai mitra.
5. **`penawaran_mitras`**: Entitas komitmen bantuan mitra per kasus, mencakup volume angka, metode pengantaran (*mandiri* / *posko*), informasi armada boks/tangki, dan status persetujuan.
6. **`misi_penyalurans`**: Entitas tugas pengiriman logistik lapangan ber-SLA, live status tahapan penyaluran, titik koordinat terkini armada, dan log kendala jalan.
7. **`log_aktivitas`**: Entitas immutable audit trail untuk setiap aksi mutasi status dan korespondensi.
8. **`chat_messages`**: Entitas pesan koordinasi real-time lintas peran per channel bencana.

---

## BAB 12: SPESIFIKASI ANTARMUKA API (RESTFUL ENDPOINTS)

Seluruh endpoint mengembalikan format standar JSON:
```json
{
  "success": true,
  "message": "Deskripsi pesan status operasi",
  "data": { ... }
}
```

### 12.1 Autentikasi & Pengguna
- `POST /api/auth/register`: Mendaftarkan akun baru (warga atau mitra).
- `POST /api/auth/login`: Masuk sistem, mengembalikan Laravel Sanctum token dan data role.
- `GET /api/auth/me`: Mengambil data profil sesi aktif.
- `POST /api/auth/logout`: Menghapus token otentikasi aktif.

### 12.2 Posko Wilayah & GIS Geospasial
- `GET /api/posko`: Mendapatkan seluruh posko aktif beserta koordinat peta Leaflet.
- `GET /api/posko/stats`: Metrik agregat kapasitas pengungsi dan status siaga posko.
- `GET /api/posko/{id}`: Detail informasi satu posko dan penanggung jawabnya.

### 12.3 Kebutuhan Warga (Laporan & Siklus Kasus)
- `GET /api/kebutuhan`: Mengambil daftar laporan (mendukung filter `posko_id`, `status`, `citizen_id`).
- `POST /api/kebutuhan`: Mengajukan laporan kebutuhan darurat baru (5-step wizard).
- `GET /api/kebutuhan/{id}`: Detail lengkap satu laporan beserta relasi bursa dan misinya.
- `PUT /api/kebutuhan/{id}`: Mengubah isi laporan kebutuhan (khusus pemilik akun).
- `DELETE /api/kebutuhan/{id}`: Menghapus laporan kebutuhan (khusus pemilik akun).
- `POST /api/kebutuhan/{id}/verify`: Aksi verifikasi posko BPBD (`action: verify | clarify | reject`).
- `POST /api/kebutuhan/{id}/jawab-klarifikasi`: Tanggapan warga atas permintaan klarifikasi posko.
- `POST /api/kebutuhan/{id}/confirm-receipt`: Konfirmasi penerimaan fisik logistik di lapangan.

### 12.4 Bursa Bantuan Terbuka
- `GET /api/bursa`: Mengambil katalog kebutuhan terbuka untuk mitra.
- `POST /api/bursa/{id}/claim`: Mengajukan klaim bantuan oleh mitra kemanusiaan.
- `POST /api/bursa/{id}/approve-claim`: Menyetujui klaim bantuan oleh BPBD.
- `POST /api/bursa/{id}/reject-claim`: Menolak klaim bantuan oleh BPBD.

### 12.5 Penawaran Mitra & Kontrol Alokasi
- `GET /api/penawaran`: Mengambil daftar tawaran bantuan mitra.
- `POST /api/penawaran`: Mengirim komitmen bantuan (volume, metode penyaluran, armada).
- `POST /api/penawaran/{id}/approve`: Menyetujui tawaran dengan kuota anti-over-allocation.
- `POST /api/penawaran/{id}/reject`: Menolak tawaran bantuan logistik.

### 12.6 Misi Penyaluran & Live Tracking
- `GET /api/misi`: Daftar seluruh misi logistik aktif dan riwayat.
- `GET /api/misi/{id}`: Detail surat jalan misi dan rute pengantaran.
- `POST /api/misi/{id}/step`: Memperbarui tahapan status perjalanan armada di lapangan.
- `POST /api/misi/{id}/report-obstacle`: Melaporkan rintangan darurat akses jalan raya.

### 12.7 Komunikasi & Audit Trail
- `GET /api/activity-logs`: Riwayat kronologis aktivitas kasus.
- `GET /api/chat`: Daftar pesan koordinasi per channel.
- `POST /api/chat`: Mengirim pesan koordinasi baru.
- `GET /api/chat/channels`: Daftar channel aktif koordinasi bencana.

---

## BAB 13: KEBUTUHAN NON-FUNGSIONAL (NFR) & DESAIN ESTETIKA

### 13.1 Standar Desain Visual & Identitas Merek
1. **Palet Warna Utama (Harmonious Disaster-Relief Palette):**
   - **Deep Forest Green (`#013220`):** Merepresentasikan otoritas resmi Posko Komando BPBD, stabilitas, dan ketegasan penanganan negara.
   - **Emerald Green (`#10b981`):** Merepresentasikan aksi cepat Mitra Relawan Kemanusiaan, pertumbuhan, dan pemulihan.
   - **Soft Mint / Ice Pale Green (`#ecfdf5`, `#f0fdf4`):** Warna latar belakang kartu interaktif dan aksen ramah visual.
   - **Clean White (`#ffffff`):** Warna dasar kartu, kontras tinggi, keterbacaan optimal.
   - **Muted Slate (`#64748b`, `#e2e8f0`):** Batas garis netral dan teks sekunder.
   - **Ketentuan Khusus:** Menghindari warna pelangi atau kuning cerah yang mencolok pada elemen visual dashboard utama.
2. **Standardisasi Tipografi:**
   - Menggunakan font sistem modern (*Inter*, *system-ui*, *sans-serif*) dengan hierarki tajam (*h1 1.5rem+, body 0.875rem, badge 0.72rem*).
3. **Pengelolaan Emoji Monokrom:**
   - Seluruh emoji simbolik diwajibkan menggunakan filter monokrom (*`filter: grayscale(100%)`*) untuk menjaga impresi antarmuka tetap tenang, serius, profesional, dan berorientasi institusional penanggulangan bencana.

### 13.2 Kinerja & Efisiensi Sistem
- **Client-Side Image Compression:** Gambar bukti lapangan dikompresi di sisi browser melalui Canvas sebelum diunggah, menghemat kuota internet pengguna hingga 85%.
- **Kecepatan Build & Code-Splitting:** Bundler Vite mengisolasi dependensi berat seperti Leaflet (`vendor-leaflet-DDPxUAUD.js`) dan React core (`vendor-react-Dy-GIXkn.js`) sehingga ukuran HTML utama tetap < 1 KB dan aplikasi siap berinteraksi dalam waktu < 1.5 detik pada jaringan 3G.
- **Zero Heavy External UI Frameworks:** Memprioritaskan Vanilla CSS dan Tailwind v4 teroptimasi tanpa pustaka UI yang membebani memori peramban gawai murah.

### 13.3 Keamanan Sistem & Ketahanan
- Proteksi CSRF dan tokenisasi API berbasis Laravel Sanctum.
- Sanitasi input string guna mencegah serangan SQL Injection dan XSS (*Cross-Site Scripting*).
- Perlindungan otorisasi level pengendali (*Controller Authorization Guard*) pada endpoint sensitif (contoh: verifikasi kasus hanya untuk peran `posko`).

---

## BAB 14: VERIFIKASI KUALITAS & 9 SKENARIO PENGUJIAN DATABASE

Kualitas logika bisnis REKSA diverifikasi melalui skrip pengujian otomatis menyeluruh (`tests/run_scenarios.php`) yang terhubung langsung ke basis data riil (Hasil: **20/20 PASS - 100% Berhasil**):

| No | Skenario Pengujian Operasional | Kondisi Uji | Ekspektasi Sistem | Status |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Permintaan Klarifikasi Foto Buram & Jawaban Warga | BPBD meminta foto ulang, warga mengirim foto baru | Status berpindah ke `Perlu Klarifikasi`, foto awal tetap utuh, status kembali `Dalam Verifikasi` | **PASS** |
| **2** | Perbaikan Rincian Jumlah Kebutuhan | BPBD meminta kejelasan jumlah, warga mengoreksi data | Status berubah dan volume permintaan terbarui secara akurat pada database | **PASS** |
| **3** | Penolakan Laporan Tidak Layak | BPBD menolak permohonan alat berat | Status tercatat `Ditolak`, alasan spesifik dan rekomendasi tindak lanjut tersimpan | **PASS** |
| **4** | Penawaran Bantuan Tanpa Armada | Mitra menawarkan makanan dengan metode serah posko | Penawaran tersimpan dengan `metode_penyaluran = serah_posko` tanpa kewajiban info armada | **PASS** |
| **5** | Kontrol Multi-Mitra Anti Over-Allocation | Kebutuhan 100 unit, Mitra A tawar 60, Mitra B tawar 60 | Mitra A dapat 60, Mitra B dibatasi ke sisa 40 unit, status `Teralokasi Penuh` tanpa kelebihan kuota | **PASS** |
| **6** | Dukungan Armada Mandiri Mitra | Mitra memiliki armada truk tangki air kapasitas 2000L | Surat Perintah Misi otomatis terbit dengan mencantumkan rincian armada truk mandiri mitra | **PASS** |
| **7** | Penerimaan Fisik Parsial & Pencatatan Sisa | Disetujui 50 karung, fisik layak 35 karung, rusak 15 | Total diterima tercatat 35 karung, status tetap `Sebagian Terpenuhi` untuk mencatat sisa kekurangan | **PASS** |
| **8** | Pencatatan Audit Trail Kronologis | Seluruh mutasi kasus 1 dijalankan | Minimal 2 riwayat aktivitas tercatat terstruktur pada tabel `log_aktivitas` | **PASS** |
| **9** | Isolasi Keamanan Akses Antar-Warga | Warga lain mencoba menjawab klarifikasi milik Warga A | Sistem menolak dengan kode respon `HTTP 403 Forbidden` | **PASS** |

---

## BAB 15: ROADMAP RILIS & INDIKATOR KINERJA KUNCI (KPI)

### 15.1 Roadmap Pengembangan
- **Fase 1 (MVP Rilis Saat Ini - Q4 2026):**
  - Implementasi penuh arsitektur 3 peran (Warga, Posko BPBD, Mitra).
  - Peta Persebaran Respon Bantuan Nasional (BPBD vs Mitra) berbasis vektor SVG dan Leaflet.
  - Alur verifikasi, klarifikasi 2-arah, anti-over-allocation, dan pencetakan BAST.
  - Chat koordinasi real-time dan asisten cerdas Tanya REKSA AI.
- **Fase 2 (Peningkatan PWA & Offline-First - Q1 2027):**
  - Penyimpanan draf formulir pelaporan secara lokal via IndexedDB saat sinyal benar-benar padam (*Zero Connectivity*).
  - Sinkronisasi otomatis (*Background Sync*) begitu perangkat mendeteksi jaringan internet.
- **Fase 3 (Integrasi Nasional Kebencanaan - Q2 2027):**
  - Interkoneksi API dengan sistem InaRISK BNPB dan BMKG Early Warning System.
  - Tanda tangan digital bersertifikasi BSrE (Badan Siber dan Sandi Negara) untuk dokumen BAST elektronik.

### 15.2 Indikator Kinerja Kunci (KPI)
1. **Target SLA Verifikasi Laporan:** Rata-rata waktu verifikasi berkas oleh posko BPBD $\le 12$ jam (maksimal 24 jam).
2. **Zero Over-Allocation Rate:** Persentase insiden kelebihan alokasi logistik $= 0\%$.
3. **Penyelesaian Misi Tepat Sasaran:** Rasio logistik tersalurkan sesuai BAST fisik $\ge 95\%$.
4. **Efisiensi Bandwidth Pelaporan:** Pengurangan konsumsi data unggah foto warga $\ge 80\%$.

---

*Dokumen ini diterbitkan secara resmi sebagai pedoman rancang bangun, integrasi modul, dan pengujian kualitas perangkat lunak sistem REKSA.*
