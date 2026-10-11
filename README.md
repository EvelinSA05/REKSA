# REKSA — Ruang Ekosistem Kolaborasi Pascabencana

[![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Leaflet](https://img.shields.io/badge/Leaflet-OpenStreetMap-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

**REKSA (Ruang Ekosistem Kolaborasi Pascabencana)** adalah platform terpadu koordinasi penanggulangan bencana dan distribusi logistik kemanusiaan pascabencana. Sistem ini menghubungkan tiga pihak utama—**Warga Terdampak**, **Posko Komando BPBD**, dan **Mitra Relawan/Organisasi Penyalur**—dalam satu rantai pasok bantuan yang transparan, akuntabel, dan terukur.

---

## 🌟 Fitur Utama Berdasarkan Peran (3 Role Ecosystem)

### 1. 🏠 Peran Masyarakat / Warga (`citizen`)
- **Lapor Kebutuhan Darurat (5-Step Wizard):**
  - Form interaktif terstruktur: Jenis Kebutuhan, Lokasi & Posko Rujukan, Kondisi Fisik Lapangan, Lampiran Bukti, dan Review.
  - **GPS & Leaflet Picker:** Deteksi koordinat GPS otomatis browser atau pemilihan titik administratif langsung pada peta OpenStreetMap.
  - **Kompresi Foto Otomatis:** Foto bukti lapangan dikompresi di sisi klien via Canvas (maks. 1280px @ 0.82 JPEG) agar hemat bandwidth dan mencegah kegagalan unggah.
- **Monitoring & Status Kasus:**
  - Melacak status laporan dari *Diajukan*, *Dalam Verifikasi*, *Kebutuhan Terbuka*, *Dalam Pengiriman*, hingga *Selesai*.
  - Melakukan perubahan data (edit) dan penghapusan langsung dari kartu laporan.
- **Respon Klarifikasi Cepat:**
  - Banner peringatan darurat otomatis muncul saat posko BPBD meminta penjelasan tambahan (*Perlu Klarifikasi*).
  - Modal terintegrasi (`CitizenClarificationModal`) untuk mengirim jawaban penjelasan, foto bukti susulan, serta koreksi volume atau jumlah KK tanpa harus mengisi ulang laporan dari awal.

### 2. 🛡️ Peran Posko Komando BPBD (`posko`)
- **Dashboard Verifikasi Laporan:**
  - Validasi kebutuhan warga dalam target waktu `< 24 jam`.
  - Penilaian skor urgensi otomatis (*Kritis*, *Tinggi*, *Sedang*).
- **Proses Klarifikasi Dua Arah:**
  - Mengajukan permintaan klarifikasi spesifik ke pelapor jika data atau foto fisik belum memadai.
  - Fitur penolakan laporan dengan alasan terperinci dan rekomendasi tindak lanjut bagi warga.
- **Bursa Bantuan Terbuka (Public Marketplace):**
  - Merilis kebutuhan yang telah lolos verifikasi ke katalog Bursa Bantuan agar dapat diakses seluruh mitra kemanusiaan.
- **Manajemen Alokasi & Verifikasi Fisik (BAST):**
  - Menyetujui atau menolak tawaran bantuan logistik dari mitra.
  - Memverifikasi penerimaan fisik bantuan logistik dan menerbitkan Berita Acara Serah Terima (BAST).

### 3. 🚚 Peran Mitra Penyalur / Responder (`responder`)
- **Eksplorasi Bursa Bantuan:**
  - Memfilter kebutuhan terbuka berdasarkan wilayah, komoditas logistik, dan tingkat urgensi bencana.
- **Pengajuan Komitmen Bantuan:**
  - Menawarkan pemenuhan logistik baik secara penuh maupun sebagian (tanpa risiko over-alokasi).
  - Mendukung pilihan **Armada Mandiri** (mitra mengantar langsung ke lokasi warga) maupun **Serah Terima di Posko Induk BPBD**.
- **Surat Tugas & Misi Penyaluran:**
  - Menerima Surat Misi Penyaluran resmi bertanda tangan digital posko.
  - Memperbarui progres perjalanan logistik di lapangan (*Menuju Lokasi*, *Tiba di Lokasi*, *Selesai Diserahkan*).

---

## 🗺️ Peta Operasional Wilayah (OpenStreetMap / Leaflet)

Platform dilengkapi integrasi modul peta GIS interaktif:
- **Landing Page Showcase:** Menampilkan titik sebaran posko induk, status operasional siaga 24 jam, dan kapasitas pengungsi terdata.
- **Marker Interaktif & Radius Wilayah:** Informasi detail penanggung jawab posko, nomor kontak telepon darurat, dan lingkaran radius jangkauan layanan.
- **Navigasi Cepat Navbar:** Tautan `Peta Posko` dengan *smooth scroll* langsung ke visualisasi peta.

---

## 🛠️ Arsitektur Teknologi

| Komponen | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Backend Framework** | Laravel 12 | RESTful API, Eloquent ORM, Database Migrations & Seeders |
| **Bahasa Backend** | PHP 8.2+ | Strong typing, Enums, Controller Form Requests |
| **Frontend Library** | React 19 | Hooks, Component Modularization, Error Boundaries |
| **Bahasa Frontend** | TypeScript 5.7 | Static typing untuk model data, state, dan API responses |
| **Bundler & Build Tool**| Vite 8 (Rolldown) | Code-splitting cerdas (`vendor-leaflet`, `vendor-react`), build < 2 detik |
| **Peta & GIS** | Leaflet 1.9 + OpenStreetMap | Custom map tiles, markers, geocoding & location picker |
| **Styling** | Vanilla CSS + Tailwind CSS v4 | Curated disaster-relief palette (Deep Forest Green, Warm Amber, Slate) |
| **Database** | SQLite / MySQL / PostgreSQL | Skema relasional ACID compliant dengan audit trail aktivitas |

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### Prasyarat Sistem
- PHP `>= 8.2`
- Composer `>= 2.5`
- Node.js `>= 18.0` & npm `>= 9.0`
- Ekstensi PHP yang aktif: `pdo`, `mbstring`, `openssl`, `tokenizer`, `xml`, `ctype`, `json`, `sqlite3`

---

### Langkah 1: Kloning & Pengaturan Backend Laravel

1. Buka terminal dan masuk ke direktori proyek:
   ```bash
   cd reksa-v1
   ```

2. Pasang dependensi PHP via Composer:
   ```bash
   composer install
   ```

3. Buat file konfigurasi `.env` (jika belum ada):
   ```bash
   cp .env.example .env
   ```

4. Generate Application Key:
   ```bash
   php artisan key:generate
   ```

5. Jalankan migrasi database dan pengisian data demo (seeder):
   ```bash
   php artisan migrate:fresh --seed
   ```

6. Jalankan server Laravel:
   ```bash
   php artisan serve
   ```
   *Aplikasi backend akan berjalan di: `http://127.0.0.1:8000`*

---

### Langkah 2: Pengaturan Frontend React & Vite

1. Buka tab terminal baru pada direktori yang sama, lalu pasang dependensi Node.js:
   ```bash
   npm install
   ```

2. Bangun bundle aset produksi:
   ```bash
   npm run build
   ```

   *Atau jalankan mode development (watch mode):*
   ```bash
   npm run dev
   ```

3. Buka browser dan akses alamat aplikasi:
   **`http://localhost:8000`**

---

## 👥 Akun Demo Terdaftar di Database

Database seeder telah menyiapkan akun siap pakai dengan kata sandi default: **`password`**

| Peran (Role) | Nama Akun | Email Login | Kata Sandi | Deskripsi Instansi |
| :--- | :--- | :--- | :--- | :--- |
| **Masyarakat** | Andi Pratama | `andi.masyarakat@reksa.id` | `password` | Warga Terdampak (RT 03/RW 05 Gubeng, Surabaya) |
| **Posko BPBD** | Siti Rahma | `siti.posko@reksa.id` | `password` | Koordinator Posko BPBD Provinsi Jawa Timur |
| **Responder BPBD** | Arif Nugroho | `arif.bpbd@reksa.id` | `password` | Satgas Reaksi Cepat BPBD Wilayah (Truk Tangki & Box) |
| **Responder PMI** | dr. Hendra Wijaya | `hendra.pmi@reksa.id` | `password` | Palang Merah Indonesia (PMI Jawa Timur) |

---

## 🧪 Pengujian Sistem & Verifikasi Alur (Testing Suite)

### 1. Pengujian 9 Skenario Alur Nyata Database
Proyek ini dilengkapi skrip verifikasi otomatis `tests/run_scenarios.php` yang menguji integritas alur kerja operasional secara menyeluruh:

```bash
php tests/run_scenarios.php
```

**Cakupan 9 Skenario Pengujian (20/20 PASS):**
- **Skenario 1:** Siklus Permintaan Klarifikasi Posko ke Warga (status bergeser ke *Perlu Klarifikasi*, unggah foto susulan, dan status kembali ke *Dalam Verifikasi*).
- **Skenario 2:** Koreksi Data & Volume Kebutuhan oleh Warga.
- **Skenario 3:** Penolakan Laporan dengan Alasan Spesifik & Catatan Arahan Warga.
- **Skenario 4:** Pembuatan Penawaran Bantuan Pokok oleh Mitra Relawan.
- **Skenario 5:** Pencegahan Over-Alokasi Kuota Bantuan Multi-Mitra.
- **Skenario 6:** Penerbitan Surat Misi Penyaluran & Penugasan Armada Logistik.
- **Skenario 7:** Penerimaan Fisik Sebagian & Status Pemenuhan Parsial.
- **Skenario 8:** Pencatatan Jejak Audit Kronologis (*Audit Trail* di `log_aktivitas`).
- **Skenario 9:** Keamanan Hak Akses (HTTP 403 Forbidden saat warga lain mencoba merespon klarifikasi bukan miliknya).

### 2. Pengujian Fitur Backend Laravel
```bash
php artisan test
```

---

## 📂 Struktur Direktori Proyek

```text
reksa-v1/
├── app/
│   ├── Http/Controllers/Api/   # REST Controllers (KebutuhanWarga, Bursa, Penawaran, Misi, Auth)
│   └── Models/                 # Eloquent Models (KebutuhanWarga, PoskoWilayah, Bursa, Misi, dll.)
├── database/
│   ├── migrations/             # Migrasi skema database relasional
│   └── seeders/                # DatabaseSeeder lengkap dengan alur kasus operasional
├── public/
│   ├── dist/                   # Hasil build frontend (HTML, CSS, dan JS Chunks)
│   └── hero-disaster.jpg       # Asset statis gambar hero landing page
├── routes/
│   ├── api.php                 # Rute RESTful API REKSA
│   └── web.php                 # Rute web penyedia Single Page Application
├── src/
│   ├── components/
│   │   ├── citizen/            # Komponen modular Warga (Dashboard, Report, CaseList, ClarificationModal)
│   │   ├── posko/              # Komponen modular Posko BPBD (Verifikasi, Bursa, Alokasi, Distribusi)
│   │   ├── mitra/              # Komponen modular Mitra (Bursa, Penawaran, Misi, Riwayat)
│   │   └── LeafletMap.tsx      # Komponen peta interaktif Leaflet OpenStreetMap
│   ├── services/
│   │   └── api.ts              # Lapisan klien HTTP komunikasi Frontend ke REST API Laravel
│   ├── App.tsx                 # Router utama dan komponen inti aplikasi
│   ├── index.css               # Desain sistem & styling antarmuka
│   └── main.tsx                # Titik masuk React 19
├── tests/
│   ├── Feature/                # Pengujian Feature PHPUnit / Pest
│   └── run_scenarios.php       # Runner pengujian otomatis 9 skenario end-to-end
├── package.json                # Konfigurasi dependensi JavaScript
├── tsconfig.json               # Konfigurasi compiler TypeScript
├── vite.config.ts              # Konfigurasi Vite & code-splitting manual chunks
└── README.md                   # Dokumentasi resmi proyek
```

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah lisensi terbuka [MIT License](LICENSE).
Dikembangkan untuk mendukung kolaborasi kemanusiaan penanggulangan bencana yang terkoordinasi dan transparan.
