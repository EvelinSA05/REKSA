# 🚀 Panduan Hosting REKSA (Vercel + Supabase)

Dokumentasi resmi untuk menjalankan aplikasi **REKSA (Kolaborasi Pascabencana)** secara **100% Gratis Selamanya** menggunakan arsitektur:
* **Hosting Web & API:** [Vercel](https://vercel.com) (Serverless PHP + React SPA)
* **Cloud Database:** [Supabase](https://supabase.com) (PostgreSQL Permanen)

---

## 📋 Langkah 1: Buat Database Gratis di Supabase

1. Buka [supabase.com](https://supabase.com) lalu klik **Start your project** (login dengan akun GitHub).
2. Klik tombol **New project**.
3. Isi informasi project:
   - **Name:** `reksa-database`
   - **Database Password:** *(Buat password yang kuat dan catat)*
   - **Region:** Pilih **Southeast Asia (Singapore)** agar koneksi dari Indonesia sangat cepat.
4. Klik **Create new project** dan tunggu 1-2 menit hingga database selesai dibuat.
5. Ambil data koneksi database:
   - Di dashboard Supabase, buka menu **Project Settings** (ikon gerigi di kiri bawah) -> pilih tab **Database**.
   - Gulir ke bagian **Connection string** -> pilih tab **URI** atau **Parameters**.
   - Pilih mode **Transaction pooler** (Port: `6543`).
   - Catat rincian berikut:
     * `Host`: `aws-0-ap-southeast-1.pooler.supabase.com`
     * `Database`: `postgres`
     * `Port`: `6543`
     * `User`: `postgres.[PROJECT-REF]`
     * `Password`: `[PASSWORD_KAMU]`

---

## 📋 Langkah 2: Jalankan Migrasi Awal ke Supabase (Sekali Saja)

Sebelum menghubungkan ke Vercel, jalankan migrasi tabel REKSA ke database Supabase dari terminal lokal kamu:

1. Di komputer lokal, buka file `.env` (atau buat file sementara) dan masukkan kredensial Supabase kamu:
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=aws-0-ap-southeast-1.pooler.supabase.com
   DB_PORT=6543
   DB_DATABASE=postgres
   DB_USERNAME=postgres.xxxxxxxxxxxxxxxx
   DB_PASSWORD=PasswordKamu123
   DB_SSLMODE=require
   ```
2. Jalankan perintah migrasi & seed di terminal:
   ```bash
   php artisan migrate --force
   php artisan db:seed --force
   ```
3. Buka **Table Editor** di Supabase, kamu akan melihat seluruh tabel (`kebutuhan_wargas`, `posko_wilayahs`, `misi_penyalurans`, dll.) sudah terisi lengkap!

---

## 📋 Langkah 3: Deploy ke Vercel

1. Buka [vercel.com](https://vercel.com) dan login menggunakan akun **GitHub**.
2. Klik tombol **Add New...** -> pilih **Project**.
3. Pilih repository GitHub kamu: `Septian-wq11/REKSA`.
4. Pada halaman konfigurasi project:
   - **Framework Preset:** Biarkan `Other` (sudah otomatis diatur oleh file `vercel.json`).
   - **Root Directory:** `./`
5. Buka bagian **Environment Variables** dan masukkan variabel berikut:

| Key | Value Contoh |
| :--- | :--- |
| `APP_NAME` | `REKSA` |
| `APP_ENV` | `production` |
| `APP_KEY` | *(Salin dari file `.env` lokal kamu)* |
| `APP_DEBUG` | `false` |
| `APP_URL` | `https://[nama-project-kamu].vercel.app` |
| `DB_CONNECTION` | `pgsql` |
| `DB_HOST` | `aws-0-ap-southeast-1.pooler.supabase.com` |
| `DB_PORT` | `6543` |
| `DB_DATABASE` | `postgres` |
| `DB_USERNAME` | `postgres.[PROJECT_REF_KAMU]` |
| `DB_PASSWORD` | `[PASSWORD_SUPABASE_KAMU]` |
| `DB_SSLMODE` | `require` |
| `SESSION_DRIVER` | `cookie` |
| `CACHE_STORE` | `array` |
| `LOG_CHANNEL` | `stderr` |

6. Klik tombol **Deploy**!
7. Tunggu sekitar 1-2 menit hingga muncul kembang api tanda deploy berhasil 🎉
8. Website REKSA kamu sekarang sudah resmi online dan bisa diakses oleh siapa saja dengan alamat `https://[nama-project].vercel.app`!

---

## 💡 Keunggulan Setup Ini:
- **100% Gratis & Selamanya Aktif**: Tidak akan dihapus setelah 90 hari.
- **Tanpa Sleep Time**: Tidak ada lag saat dibuka pertama kali karena CDN Vercel selalu siaga di server Singapura/Jakarta.
- **Auto-Sync GitHub**: Setiap ada perubahan kode yang di-*push* ke branch `main`, Vercel akan otomatis meng-*update* website secara instan.
