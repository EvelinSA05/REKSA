<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\PoskoWilayah;
use App\Models\KebutuhanWarga;
use App\Models\BursaBantuan;
use App\Models\PenawaranMitra;
use App\Models\MisiPenyaluran;
use App\Models\LogAktivitas;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with a comprehensive, end-to-end operational pipeline.
     */
    public function run(): void
    {
        // Truncate tables cleanly for both SQLite and PostgreSQL
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
            DB::table('misi_penyalurans')->delete();
            DB::table('penawaran_mitras')->delete();
            DB::table('bursa_bantuans')->delete();
            DB::table('log_aktivitas')->delete();
            DB::table('kebutuhan_wargas')->delete();
            DB::table('posko_wilayahs')->delete();
            DB::table('users')->delete();
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            DB::statement('TRUNCATE TABLE misi_penyalurans, penawaran_mitras, bursa_bantuans, log_aktivitas, kebutuhan_wargas, posko_wilayahs, users RESTART IDENTITY CASCADE;');
        }

        // 1. SEED CORE DEMO USERS (NATIONAL BPBD + REGIONAL BPBDS + CITIZEN + RESPONDERS)
        $nasionalBpbd = User::create([
            'name' => 'Pusdalops BNPB / BPBD Nasional',
            'email' => 'nasional.bpbd@reksa.id',
            'phone' => '+62 811 1234 5678',
            'password' => Hash::make('password'),
            'role' => 'posko',
            'scope' => 'nasional',
            'provinsi' => null,
            'posko_id' => null,
            'organization' => 'Badan Penanggulangan Bencana (Komando Nasional)',
            'address' => 'Gedung Graha BNPB, Jl. Pramuka Kav. 38, Jakarta Timur',
            'nik' => 'BPBD-NAS-001',
            'is_verified' => true,
            'is_active' => true,
        ]);

        $citizen = User::create([
            'name' => 'Andi Pratama',
            'email' => 'andi.masyarakat@reksa.id',
            'phone' => '+62 812 4455 0188',
            'password' => Hash::make('password'),
            'role' => 'citizen',
            'scope' => 'daerah',
            'provinsi' => 'Jawa Timur',
            'organization' => 'Warga Wilayah Surabaya (RT 03 / RW 05)',
            'address' => 'Jl. Raya Gubeng No. 18, Kec. Gubeng, Kota Surabaya',
            'nik' => '3202110482910002',
            'is_verified' => true,
            'is_active' => true,
        ]);

        // BPBD Daerah - Jawa Timur
        $poskoOfficer = User::create([
            'name' => 'Siti Rahma',
            'email' => 'siti.posko@reksa.id',
            'phone' => '+62 812 8899 1102',
            'password' => Hash::make('password'),
            'role' => 'posko',
            'scope' => 'daerah',
            'provinsi' => 'Jawa Timur',
            'organization' => 'Posko BPBD Provinsi Jawa Timur (Komando Wilayah)',
            'address' => 'Gedung Serbaguna Posko Utama, Jl. Pemuda No. 1, Kota Surabaya',
            'nik' => 'PSK-SKB-2026-01',
            'is_verified' => true,
            'is_active' => true,
        ]);

        // BPBD Daerah - Jawa Barat
        $officerJabar = User::create([
            'name' => 'Dedi Mulyadi, S.T.',
            'email' => 'jabar.bpbd@reksa.id',
            'phone' => '+62 812 2233 4455',
            'password' => Hash::make('password'),
            'role' => 'posko',
            'scope' => 'daerah',
            'provinsi' => 'Jawa Barat',
            'organization' => 'BPBD Provinsi Jawa Barat (Pusdalops-PB)',
            'address' => 'Jl. Soekarno Hatta No. 629, Kota Bandung',
            'nik' => 'PSK-JBR-2026-01',
            'is_verified' => true,
            'is_active' => true,
        ]);

        // BPBD Daerah - DKI Jakarta
        $officerJakarta = User::create([
            'name' => 'Bambang Suryono',
            'email' => 'jakarta.bpbd@reksa.id',
            'phone' => '+62 811 9988 7766',
            'password' => Hash::make('password'),
            'role' => 'posko',
            'scope' => 'daerah',
            'provinsi' => 'DKI Jakarta',
            'organization' => 'BPBD Provinsi DKI Jakarta',
            'address' => 'Gedung Dinas Teknis Abdul Muis No. 66, Gambir, Jakarta Pusat',
            'nik' => 'PSK-DKI-2026-01',
            'is_verified' => true,
            'is_active' => true,
        ]);

        // BPBD Daerah - Jawa Tengah
        $officerJateng = User::create([
            'name' => 'Agus Triyono',
            'email' => 'jateng.bpbd@reksa.id',
            'phone' => '+62 812 5544 3322',
            'password' => Hash::make('password'),
            'role' => 'posko',
            'scope' => 'daerah',
            'provinsi' => 'Jawa Tengah',
            'organization' => 'BPBD Provinsi Jawa Tengah',
            'address' => 'Jl. Imam Bonjol No. 195, Kota Semarang',
            'nik' => 'PSK-JTG-2026-01',
            'is_verified' => true,
            'is_active' => true,
        ]);

        // BPBD Daerah - D.I. Aceh
        $officerAceh = User::create([
            'name' => 'Teuku Iskandar',
            'email' => 'aceh.bpbd@reksa.id',
            'phone' => '+62 812 6677 8899',
            'password' => Hash::make('password'),
            'role' => 'posko',
            'scope' => 'daerah',
            'provinsi' => 'Aceh',
            'organization' => 'Badan Penanggulangan Bencana Aceh (BPBA)',
            'address' => 'Jl. Daud Beureueh No. 18, Kota Banda Aceh',
            'nik' => 'PSK-ACH-2026-01',
            'is_verified' => true,
            'is_active' => true,
        ]);

        // BPBD Daerah - Sulawesi Tengah
        $officerSulteng = User::create([
            'name' => 'Faisal Palu',
            'email' => 'sulteng.bpbd@reksa.id',
            'phone' => '+62 813 4455 6677',
            'password' => Hash::make('password'),
            'role' => 'posko',
            'scope' => 'daerah',
            'provinsi' => 'Sulawesi Tengah',
            'organization' => 'BPBD Provinsi Sulawesi Tengah',
            'address' => 'Jl. MT Haryono No. 12, Kota Palu',
            'nik' => 'PSK-STG-2026-01',
            'is_verified' => true,
            'is_active' => true,
        ]);

        $responderBpbd = User::create([
            'name' => 'Arif Nugroho',
            'email' => 'arif.bpbd@reksa.id',
            'phone' => '+62 813 7722 9901',
            'password' => Hash::make('password'),
            'role' => 'responder',
            'scope' => 'daerah',
            'provinsi' => 'Jawa Timur',
            'organization' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'address' => 'Markas Komando BPBD, Jl. Perintis Kemerdekaan No. 15',
            'nik' => 'RSP-BPBD-9941',
            'is_verified' => true,
            'is_active' => true,
        ]);

        $responderPmi = User::create([
            'name' => 'dr. Hendra Wijaya',
            'email' => 'hendra.pmi@reksa.id',
            'phone' => '+62 812 3344 5566',
            'password' => Hash::make('password'),
            'role' => 'responder',
            'scope' => 'daerah',
            'provinsi' => 'Jawa Timur',
            'organization' => 'Palang Merah Indonesia (PMI Cabang Jawa Timur)',
            'address' => 'Markas PMI Jawa Timur, Jl. Karang Menjangan No. 22, Surabaya',
            'nik' => 'RSP-PMI-8812',
            'is_verified' => true,
            'is_active' => true,
        ]);

        // 2. SEED POSKO WILAYAH SETIAP DAERAH
        $posko1 = PoskoWilayah::create([
            'kode_posko' => 'PSK-01',
            'nama_posko' => 'Posko BPBD Provinsi Jawa Timur (Komando Wilayah)',
            'penanggung_jawab_id' => $poskoOfficer->id,
            'penanggung_jawab_nama' => 'Siti Rahma',
            'telepon' => '+62 812 8899 1102',
            'desa' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kabupaten' => 'Kota Surabaya',
            'provinsi' => 'Jawa Timur',
            'alamat_lengkap' => 'Jl. Pemuda No. 1, Kota Surabaya, Jawa Timur',
            'latitude' => -7.2654,
            'longitude' => 112.7521,
            'kapasitas_kk' => 250,
            'kk_terdata' => 124,
            'status_operasional' => 'Aktif',
        ]);
        $poskoOfficer->update(['posko_id' => $posko1->id]);

        $poskoJabar = PoskoWilayah::create([
            'kode_posko' => 'PSK-JBR-01',
            'nama_posko' => 'Posko Siaga Bencana BPBD Jawa Barat',
            'penanggung_jawab_id' => $officerJabar->id,
            'penanggung_jawab_nama' => 'Dedi Mulyadi, S.T.',
            'telepon' => '+62 812 2233 4455',
            'desa' => 'Batununggal',
            'kecamatan' => 'Bandung Kidul',
            'kabupaten' => 'Kota Bandung',
            'provinsi' => 'Jawa Barat',
            'alamat_lengkap' => 'Jl. Soekarno Hatta No. 629, Bandung, Jawa Barat',
            'latitude' => -6.9389,
            'longitude' => 107.6358,
            'kapasitas_kk' => 300,
            'kk_terdata' => 95,
            'status_operasional' => 'Aktif',
        ]);
        $officerJabar->update(['posko_id' => $poskoJabar->id]);

        $poskoJakarta = PoskoWilayah::create([
            'kode_posko' => 'PSK-DKI-01',
            'nama_posko' => 'Posko Reaksi Cepat BPBD DKI Jakarta',
            'penanggung_jawab_id' => $officerJakarta->id,
            'penanggung_jawab_nama' => 'Bambang Suryono',
            'telepon' => '+62 811 9988 7766',
            'desa' => 'Petojo Selatan',
            'kecamatan' => 'Gambir',
            'kabupaten' => 'Kota Jakarta Pusat',
            'provinsi' => 'DKI Jakarta',
            'alamat_lengkap' => 'Jl. Abdul Muis No. 66, Gambir, Jakarta Pusat',
            'latitude' => -6.1754,
            'longitude' => 106.8272,
            'kapasitas_kk' => 200,
            'kk_terdata' => 60,
            'status_operasional' => 'Aktif',
        ]);
        $officerJakarta->update(['posko_id' => $poskoJakarta->id]);

        $poskoJateng = PoskoWilayah::create([
            'kode_posko' => 'PSK-JTG-01',
            'nama_posko' => 'Posko Tanggap Darurat BPBD Jawa Tengah',
            'penanggung_jawab_id' => $officerJateng->id,
            'penanggung_jawab_nama' => 'Agus Triyono',
            'telepon' => '+62 812 5544 3322',
            'desa' => 'Pendrikan Kidul',
            'kecamatan' => 'Semarang Tengah',
            'kabupaten' => 'Kota Semarang',
            'provinsi' => 'Jawa Tengah',
            'alamat_lengkap' => 'Jl. Imam Bonjol No. 195, Semarang, Jawa Tengah',
            'latitude' => -6.9826,
            'longitude' => 110.4091,
            'kapasitas_kk' => 250,
            'kk_terdata' => 45,
            'status_operasional' => 'Aktif',
        ]);
        $officerJateng->update(['posko_id' => $poskoJateng->id]);

        $poskoAceh = PoskoWilayah::create([
            'kode_posko' => 'PSK-ACH-01',
            'nama_posko' => 'Posko Induk Komando Penanggulangan Bencana Aceh',
            'penanggung_jawab_id' => $officerAceh->id,
            'penanggung_jawab_nama' => 'Teuku Iskandar',
            'telepon' => '+62 812 6677 8899',
            'desa' => 'Kuta Alam',
            'kecamatan' => 'Kuta Alam',
            'kabupaten' => 'Kota Banda Aceh',
            'provinsi' => 'Aceh',
            'alamat_lengkap' => 'Jl. Daud Beureueh No. 18, Banda Aceh',
            'latitude' => 5.5601,
            'longitude' => 95.3287,
            'kapasitas_kk' => 350,
            'kk_terdata' => 80,
            'status_operasional' => 'Aktif',
        ]);
        $officerAceh->update(['posko_id' => $poskoAceh->id]);

        $poskoSulteng = PoskoWilayah::create([
            'kode_posko' => 'PSK-STG-01',
            'nama_posko' => 'Posko Reaksi Cepat Bencana BPBD Sulteng',
            'penanggung_jawab_id' => $officerSulteng->id,
            'penanggung_jawab_nama' => 'Faisal Palu',
            'telepon' => '+62 813 4455 6677',
            'desa' => 'Besusu Barat',
            'kecamatan' => 'Palu Timur',
            'kabupaten' => 'Kota Palu',
            'provinsi' => 'Sulawesi Tengah',
            'alamat_lengkap' => 'Jl. MT Haryono No. 12, Besusu Barat, Palu',
            'latitude' => -0.8917,
            'longitude' => 119.8707,
            'kapasitas_kk' => 200,
            'kk_terdata' => 55,
            'status_operasional' => 'Aktif',
        ]);
        $officerSulteng->update(['posko_id' => $poskoSulteng->id]);

        // =========================================================================
        // CASE 1: AIR BERSIH (DALAM PENGIRIMAN - PARTIAL ALLOCATION WITH BURSA SHORTAGE)
        // =========================================================================
        $case1 = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00124',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Andi Pratama',
            'citizen_phone' => '+62 812 4455 0188',
            'posko_id' => $posko1->id,
            'kategori_kebutuhan' => 'Air Bersih',
            'volume_permintaan' => '1.000 Liter (L)',
            'jumlah_kk' => 87,
            'status_hunian' => 'Rumah Warga Terdampak',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Kritis',
            'priority_rationale' => 'Rekomendasi Sistem: KRITIS — 87 KK mengalami defisit air bersih > 6 jam pascabencana, terdapat 14 balita & lansia. Alokasi tahap 1 disetujui: 500 L (50%). Sisa 500 L terbuka di bursa.',
            'status' => 'Dalam Pengiriman',
            'deskripsi' => 'Pipa utama PDAM terputus akibat longsor, 87 KK mengalami kekeringan air bersih sejak kemarin sore.',
            'catatan_verifikasi_posko' => 'Verifikasi posko selesai. Validasi lapangan sesuai, alokasi tahap 1 disetujui untuk Truk Tangki BPBD.',
            'verified_by' => $poskoOfficer->id,
            'verified_at' => now()->subHours(3),
            'desa' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kabupaten' => 'Kota Surabaya',
            'provinsi' => 'Jawa Timur',
            'latitude' => -7.2654,
            'longitude' => 112.7521,
        ]);

        $bursa1 = BursaBantuan::create([
            'kebutuhan_id' => $case1->id,
            'posko_id' => $posko1->id,
            'item_bantuan' => 'Air Bersih (1.000 Liter (L))',
            'target_volume' => '1.000 Liter (L)',
            'volume_terpenuhi' => '500 Liter (L)',
            'urgensi' => 'Kritis',
            'status' => 'Sebagian Terpenuhi',
            'claimed_by' => $responderBpbd->id,
            'claimed_org' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'claimed_volume' => '500 Liter (L)',
            'claimed_armada' => 'Truk Tangki No. 02 · Kapasitas 500 L Air Minum',
            'published_at' => now()->subHours(3),
        ]);

        $misi1 = MisiPenyaluran::create([
            'kode_misi' => 'MISI-ASG-001',
            'kebutuhan_id' => $case1->id,
            'bursa_id' => $bursa1->id,
            'posko_id' => $posko1->id,
            'responder_id' => $responderBpbd->id,
            'responder_name' => 'Arif Nugroho',
            'organisasi' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'armada_info' => 'Truk Tangki No. 02 · Kapasitas 500 L Air Minum',
            'muatan' => '500 Liter (L)',
            'status_tahapan' => 'Dalam Perjalanan',
            'estimasi_waktu' => '18 Menit (2,4 km)',
            'catatan_lapangan' => 'Armada telah berangkat dari Markas Komando BPBD menuju titik distribusi Posko Induk Balai Warga Gubeng.',
        ]);

        // =========================================================================
        // CASE 2: PAKET PANGAN & SEMBAKO (KEBUTUHAN TERBUKA DI BURSA BANTUAN)
        // =========================================================================
        $case2 = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00125',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Andi Pratama',
            'citizen_phone' => '+62 812 4455 0188',
            'posko_id' => $posko1->id,
            'kategori_kebutuhan' => 'Pangan / Sembako',
            'volume_permintaan' => '50 Paket / Unit',
            'jumlah_kk' => 50,
            'status_hunian' => 'Tenda Pengungsian Darurat',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Tinggi',
            'priority_rationale' => 'Rekomendasi Sistem: TINGGI — 50 KK membutuhkan suplai bahan makanan pokok untuk persediaan 3 hari ke depan.',
            'status' => 'Kebutuhan Terbuka',
            'deskripsi' => 'Stok beras dan makanan siap saji warga di pengungsian menipis. Membutuhkan paket sembako beras, mie instan, minyak, dan biskuit.',
            'catatan_verifikasi_posko' => 'Data tervalidasi oleh Koordinator Posko. Kebutuhan dirilis ke Bursa Bantuan Terbuka bagi mitra kemanusiaan.',
            'verified_by' => $poskoOfficer->id,
            'verified_at' => now()->subHours(2),
            'desa' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kabupaten' => 'Kota Surabaya',
            'provinsi' => 'Jawa Timur',
            'latitude' => -7.2680,
            'longitude' => 112.7540,
        ]);

        $bursa2 = BursaBantuan::create([
            'kebutuhan_id' => $case2->id,
            'posko_id' => $posko1->id,
            'item_bantuan' => 'Pangan / Sembako (50 Paket / Unit)',
            'target_volume' => '50 Paket / Unit',
            'volume_terpenuhi' => '0 Paket / Unit',
            'urgensi' => 'Tinggi',
            'status' => 'Terbuka',
            'published_at' => now()->subHours(2),
        ]);

        // =========================================================================
        // CASE 3: TERPAL & TENDA DARURAT (DALAM VERIFIKASI - ANTREAN VALIDASI POSKO)
        // =========================================================================
        $case3 = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00126',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Andi Pratama',
            'citizen_phone' => '+62 812 4455 0188',
            'posko_id' => $posko1->id,
            'kategori_kebutuhan' => 'Tenda & Terpal Darurat',
            'volume_permintaan' => '15 Unit',
            'jumlah_kk' => 15,
            'status_hunian' => 'Rumah Rusak Sedang (Atap Runtuh)',
            'vulnerable_group' => false,
            'tingkat_urgensi' => 'Kritis',
            'priority_rationale' => 'Rekomendasi Sistem: KRITIS — 15 rumah mengalami kerusakan atap pasca angin kencang, membutuhkan terpal penutup darurat.',
            'status' => 'Dalam Verifikasi',
            'deskripsi' => 'Atap genteng 15 rumah warga terbawa angin kencang saat hujan deras tadi malam, perlu terpal penutup secepatnya.',
            'desa' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kabupaten' => 'Kota Surabaya',
            'provinsi' => 'Jawa Timur',
            'latitude' => -7.2630,
            'longitude' => 112.7505,
        ]);

        // =========================================================================
        // CASE 4: HYGIENE KIT & OBAT (KLAIM MITRA DIAJUKAN - MENUNGGU PERSETUJUAN POSKO)
        // =========================================================================
        $case4 = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00127',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Andi Pratama',
            'citizen_phone' => '+62 812 4455 0188',
            'posko_id' => $posko1->id,
            'kategori_kebutuhan' => 'Obat & Hygiene Kit',
            'volume_permintaan' => '30 Paket / Unit',
            'jumlah_kk' => 30,
            'status_hunian' => 'Rumah Warga Terdampak',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Tinggi',
            'priority_rationale' => 'Rekomendasi Sistem: TINGGI — Kebutuhan sabun antiseptik, pembalut, popok balita, dan obat kulit darurat.',
            'status' => 'Klaim Diajukan',
            'deskripsi' => 'Banyak anak balita dan lansia mengalami gatal-gatal dan butuh perlengkapan sanitasi dasar.',
            'catatan_verifikasi_posko' => 'Verifikasi selesai. Laporan telah diajukan komitmennya oleh Palang Merah Indonesia.',
            'verified_by' => $poskoOfficer->id,
            'verified_at' => now()->subHours(4),
            'desa' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kabupaten' => 'Kota Surabaya',
            'provinsi' => 'Jawa Timur',
            'latitude' => -7.2665,
            'longitude' => 112.7535,
        ]);

        $bursa4 = BursaBantuan::create([
            'kebutuhan_id' => $case4->id,
            'posko_id' => $posko1->id,
            'item_bantuan' => 'Obat & Hygiene Kit (30 Paket / Unit)',
            'target_volume' => '30 Paket / Unit',
            'volume_terpenuhi' => '0 Paket / Unit',
            'urgensi' => 'Tinggi',
            'status' => 'Klaim Diajukan',
            'claimed_by' => $responderPmi->id,
            'claimed_org' => 'Palang Merah Indonesia (PMI Cabang Jawa Timur)',
            'claimed_volume' => '30 Paket / Unit',
            'claimed_armada' => 'Mobil Ambulans & Logistik PMI No. 04',
            'claim_notes' => 'Armada logistik PMI siaga di Markas Menjangan. Siap mendistribusikan 30 paket hygiene kit lengkap begitu alokasi disetujui.',
            'published_at' => now()->subHours(4),
        ]);

        $penawaran4 = PenawaranMitra::create([
            'kode_penawaran' => 'TWR-2026-001',
            'bursa_id' => $bursa4->id,
            'kebutuhan_id' => $case4->id,
            'posko_id' => $posko1->id,
            'mitra_id' => $responderPmi->id,
            'mitra_name' => 'dr. Hendra Wijaya',
            'organisasi' => 'Palang Merah Indonesia (PMI Cabang Jawa Timur)',
            'jenis_bantuan' => 'Obat & Hygiene Kit',
            'jumlah_tawaran' => '30 Paket / Unit',
            'volume_angka' => 30,
            'satuan' => 'Paket',
            'waktu_kesiapan' => 'Siap berangkat dalam 1 jam',
            'armada_info' => 'Mobil Ambulans & Logistik PMI No. 04',
            'status' => 'Diajukan',
            'catatan' => 'Siap mendistribusikan 30 paket hygiene kit dan pertolongan pertama pascabencana.',
            'created_at' => now()->subHours(1),
        ]);

        // =========================================================================
        // CASE 5: SANDANG & SELIMUT (MENUNGGU KONFIRMASI PENERIMAAN / BAST)
        // =========================================================================
        $case5 = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00128',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Andi Pratama',
            'citizen_phone' => '+62 812 4455 0188',
            'posko_id' => $posko1->id,
            'kategori_kebutuhan' => 'Sandang & Selimut Hangat',
            'volume_permintaan' => '20 Paket / Unit',
            'jumlah_kk' => 20,
            'status_hunian' => 'Tenda Pengungsian',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Sedang',
            'priority_rationale' => 'Rekomendasi Sistem: SEDANG — Suplai selimut tebal dan pakaian kering untuk warga pengungsi malam hari.',
            'status' => 'Menunggu Konfirmasi Penerimaan',
            'deskripsi' => 'Pengungsi kedinginan di malam hari, membutuhkan selimut dan pakaian ganti layak pakai.',
            'catatan_verifikasi_posko' => 'Verifikasi selesai. Armada logistik telah tiba di titik serah terima posko.',
            'verified_by' => $poskoOfficer->id,
            'verified_at' => now()->subHours(5),
            'desa' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kabupaten' => 'Kota Surabaya',
            'provinsi' => 'Jawa Timur',
            'latitude' => -7.2645,
            'longitude' => 112.7515,
        ]);

        $bursa5 = BursaBantuan::create([
            'kebutuhan_id' => $case5->id,
            'posko_id' => $posko1->id,
            'item_bantuan' => 'Sandang & Selimut Hangat (20 Paket / Unit)',
            'target_volume' => '20 Paket / Unit',
            'volume_terpenuhi' => '20 Paket / Unit',
            'urgensi' => 'Sedang',
            'status' => 'Teralokasi Penuh',
            'claimed_by' => $responderBpbd->id,
            'claimed_org' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'claimed_volume' => '20 Paket / Unit',
            'claimed_armada' => 'Mobil Box Logistik No. 01 · Kapasitas 20 Paket',
            'published_at' => now()->subHours(5),
        ]);

        $misi5 = MisiPenyaluran::create([
            'kode_misi' => 'MISI-ASG-002',
            'kebutuhan_id' => $case5->id,
            'bursa_id' => $bursa5->id,
            'posko_id' => $posko1->id,
            'responder_id' => $responderBpbd->id,
            'responder_name' => 'Arif Nugroho',
            'organisasi' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'armada_info' => 'Mobil Box Logistik No. 01 · Kapasitas 20 Paket',
            'muatan' => '20 Paket / Unit',
            'status_tahapan' => 'Tiba di Lokasi & Diserahkan',
            'estimasi_waktu' => 'Tiba di Posko',
            'catatan_lapangan' => 'Barang bantuan 20 paket selimut telah tiba di Posko Induk Gubeng dan diserahkan ke koordinator posko. Menunggu verifikasi fisik BAST.',
        ]);

        // =========================================================================
        // CASE 6: DAPUR UMUM & MAKANAN SIAP SAJI (SELESAI - 100% TUNTAS BERITA ACARA)
        // =========================================================================
        $case6 = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00129',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Andi Pratama',
            'citizen_phone' => '+62 812 4455 0188',
            'posko_id' => $posko1->id,
            'kategori_kebutuhan' => 'Dapur Umum & Makanan Siap Saji',
            'volume_permintaan' => '100 Porsi',
            'jumlah_kk' => 25,
            'status_hunian' => 'Balai Pertemuan Pengungsi',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Kritis',
            'priority_rationale' => 'Rekomendasi Sistem: KRITIS — Suplai makanan siap saji makan siang darurat bagi 25 KK (100 jiwa). Telah diterima 100% tuntas.',
            'status' => 'Selesai',
            'total_alokasi_resmi' => '100 Porsi',
            'total_diterima_resmi' => '100 Porsi',
            'deskripsi' => 'Penyediaan 100 bungkus makanan siap santap higienis untuk warga terdampak pascabencana.',
            'catatan_verifikasi_posko' => 'Distribusi selesai tuntas. Berita Acara Serah Terima (BAST) telah diverifikasi sah.',
            'verified_by' => $poskoOfficer->id,
            'verified_at' => now()->subHours(8),
            'completed_at' => now()->subHours(1),
            'desa' => 'Gubeng',
            'kecamatan' => 'Gubeng',
            'kabupaten' => 'Kota Surabaya',
            'provinsi' => 'Jawa Timur',
            'latitude' => -7.2650,
            'longitude' => 112.7525,
        ]);

        $bursa6 = BursaBantuan::create([
            'kebutuhan_id' => $case6->id,
            'posko_id' => $posko1->id,
            'item_bantuan' => 'Dapur Umum & Makanan Siap Saji (100 Porsi)',
            'target_volume' => '100 Porsi',
            'volume_terpenuhi' => '100 Porsi',
            'urgensi' => 'Kritis',
            'status' => 'Selesai',
            'claimed_by' => $responderBpbd->id,
            'claimed_org' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'claimed_volume' => '100 Porsi',
            'claimed_armada' => 'Mobil Pick Up Dapur Lapangan BPBD',
            'published_at' => now()->subHours(8),
        ]);

        $misi6 = MisiPenyaluran::create([
            'kode_misi' => 'MISI-ASG-003',
            'kebutuhan_id' => $case6->id,
            'bursa_id' => $bursa6->id,
            'posko_id' => $posko1->id,
            'responder_id' => $responderBpbd->id,
            'responder_name' => 'Arif Nugroho',
            'organisasi' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'armada_info' => 'Mobil Pick Up Dapur Lapangan BPBD',
            'muatan' => '100 Porsi',
            'status_tahapan' => 'Selesai',
            'jumlah_diterima' => '100 Porsi',
            'selisih' => '0 Porsi',
            'estimasi_waktu' => 'Selesai',
            'catatan_lapangan' => '100 porsi makanan siap santap telah dibagikan langsung ke warga pengungsi. BAST ditandatangani.',
            'completed_at' => now()->subHours(1),
        ]);

        // =========================================================================
        // CASE 7 (JAWA BARAT): LONGSOR CIANJUR (DALAM VERIFIKASI BPBD JAWA BARAT)
        // =========================================================================
        $caseJabar = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00130',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Ahmad Hidayat',
            'citizen_phone' => '+62 813 9988 1234',
            'posko_id' => $poskoJabar->id,
            'kategori_kebutuhan' => 'Tenda & Terpal Darurat',
            'volume_permintaan' => '40 Unit',
            'jumlah_kk' => 40,
            'status_hunian' => 'Pengungsian Lapangan Terbuka',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Kritis',
            'priority_rationale' => 'Rekomendasi Sistem: KRITIS — Longsor lereng tebing di Cianjur menimpa 40 unit rumah warga, pengungsi tidur di bawah terpal seadanya.',
            'status' => 'Dalam Verifikasi',
            'deskripsi' => 'Longsor lereng tebing menimpa 40 rumah warga. Warga dievakuasi ke lapangan terbuka desa, sangat membutuhkan tenda keluarga darurat.',
            'desa' => 'Cijedil',
            'kecamatan' => 'Cugenang',
            'kabupaten' => 'Kabupaten Cianjur',
            'provinsi' => 'Jawa Barat',
            'latitude' => -6.8045,
            'longitude' => 107.1264,
        ]);

        // =========================================================================
        // CASE 8 (DKI JAKARTA): BANJIR LUAPAN CILIWUNG (KEBUTUHAN TERBUKA BPBD DKI)
        // =========================================================================
        $caseJakarta = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00131',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Nurul Aini',
            'citizen_phone' => '+62 811 3344 7788',
            'posko_id' => $poskoJakarta->id,
            'kategori_kebutuhan' => 'Perahu Karet & Evakuasi',
            'volume_permintaan' => '6 Unit Perahu',
            'jumlah_kk' => 65,
            'status_hunian' => 'Lantai 2 Rumah Tergenang',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Tinggi',
            'priority_rationale' => 'Rekomendasi Sistem: TINGGI — Ketinggian air kali mencapai 120 cm di permukiman padat bantaran kali Ciliwung.',
            'status' => 'Kebutuhan Terbuka',
            'deskripsi' => 'Banjir luapan Ciliwung merendam RW 07 Kampung Melayu, arus deras membutuhkan armada perahu evakuasi lansia dan anak.',
            'catatan_verifikasi_posko' => 'Verifikasi posko BPBD DKI Jakarta tuntas. Dipublikasikan ke bursa terbuka.',
            'verified_by' => $officerJakarta->id,
            'verified_at' => now()->subHours(2),
            'desa' => 'Kampung Melayu',
            'kecamatan' => 'Jatinegara',
            'kabupaten' => 'Kota Jakarta Timur',
            'provinsi' => 'DKI Jakarta',
            'latitude' => -6.2297,
            'longitude' => 106.8653,
        ]);

        $bursaJakarta = BursaBantuan::create([
            'kebutuhan_id' => $caseJakarta->id,
            'posko_id' => $poskoJakarta->id,
            'item_bantuan' => 'Perahu Karet & Evakuasi (6 Unit Perahu)',
            'target_volume' => '6 Unit Perahu',
            'volume_terpenuhi' => '0 Unit Perahu',
            'urgensi' => 'Tinggi',
            'status' => 'Terbuka',
            'published_at' => now()->subHours(2),
        ]);

        // =========================================================================
        // CASE 9 (JAWA TENGAH): ROB PESISIR DEMAK (DALAM PENGIRIMAN BPBD JATENG)
        // =========================================================================
        $caseJateng = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00132',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Bambang Kusuma',
            'citizen_phone' => '+62 813 5566 7788',
            'posko_id' => $poskoJateng->id,
            'kategori_kebutuhan' => 'Air Bersih',
            'volume_permintaan' => '1.500 Liter (L)',
            'jumlah_kk' => 55,
            'status_hunian' => 'Rumah Panggung Darurat',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Kritis',
            'priority_rationale' => 'Rekomendasi Sistem: KRITIS — Sumur resapan warga tercemar intrusi air laut pasang (rob), krisis air minum 55 KK.',
            'status' => 'Dalam Pengiriman',
            'deskripsi' => 'Banjir rob mencemari seluruh sumber air tawar di pesisir Sayung Demak. Warga kekurangan air minum sejak 2 hari.',
            'catatan_verifikasi_posko' => 'Alokasi suplai tangki tanggap darurat disetujui BPBD Jawa Tengah.',
            'verified_by' => $officerJateng->id,
            'verified_at' => now()->subHours(3),
            'desa' => 'Sriwulan',
            'kecamatan' => 'Sayung',
            'kabupaten' => 'Kabupaten Demak',
            'provinsi' => 'Jawa Tengah',
            'latitude' => -6.9485,
            'longitude' => 110.4901,
        ]);

        $bursaJateng = BursaBantuan::create([
            'kebutuhan_id' => $caseJateng->id,
            'posko_id' => $poskoJateng->id,
            'item_bantuan' => 'Air Bersih (1.500 Liter (L))',
            'target_volume' => '1.500 Liter (L)',
            'volume_terpenuhi' => '1.500 Liter (L)',
            'urgensi' => 'Kritis',
            'status' => 'Teralokasi Penuh',
            'claimed_by' => $responderBpbd->id,
            'claimed_org' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'claimed_volume' => '1.500 Liter (L)',
            'claimed_armada' => 'Truk Tangki Air BPBD No. 05',
            'published_at' => now()->subHours(3),
        ]);

        $misiJateng = MisiPenyaluran::create([
            'kode_misi' => 'MISI-ASG-004',
            'kebutuhan_id' => $caseJateng->id,
            'bursa_id' => $bursaJateng->id,
            'posko_id' => $poskoJateng->id,
            'responder_id' => $responderBpbd->id,
            'responder_name' => 'Arif Nugroho',
            'organisasi' => 'Satgas Reaksi Cepat BPBD Wilayah',
            'armada_info' => 'Truk Tangki Air BPBD No. 05',
            'muatan' => '1.500 Liter (L)',
            'status_tahapan' => 'Dalam Perjalanan',
            'estimasi_waktu' => '30 Menit (12 km)',
            'catatan_lapangan' => 'Armada sedang melewati jalur Pantura Sayung menuju titik tandon warga balai RW.',
        ]);

        // =========================================================================
        // CASE 10 (ACEH): BANJIR BANDANG ACEH TENGGARA (KEBUTUHAN TERBUKA BPBA)
        // =========================================================================
        $caseAceh = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00133',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Mukhlis Jalil',
            'citizen_phone' => '+62 812 7788 9900',
            'posko_id' => $poskoAceh->id,
            'kategori_kebutuhan' => 'Pangan / Sembako',
            'volume_permintaan' => '120 Paket / Unit',
            'jumlah_kk' => 120,
            'status_hunian' => 'Terisolir Tanggul Putus',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Kritis',
            'priority_rationale' => 'Rekomendasi Sistem: KRITIS — Jembatan penghubung desa terputus material kayu dan batu, 120 KK terisolasi.',
            'status' => 'Kebutuhan Terbuka',
            'deskripsi' => 'Banjir bandang Sungai Lawe Kinga memutus akses darat utama, 120 KK kehabisan stok beras dan makanan pokok.',
            'catatan_verifikasi_posko' => 'Verifikasi selesai oleh BPBA, membutuhkan dukungan mitra kemanusiaan udara/trail.',
            'verified_by' => $officerAceh->id,
            'verified_at' => now()->subHours(4),
            'desa' => 'Lawe Kinga',
            'kecamatan' => 'Semadam',
            'kabupaten' => 'Kabupaten Aceh Tenggara',
            'provinsi' => 'Aceh',
            'latitude' => 3.4215,
            'longitude' => 97.8924,
        ]);

        $bursaAceh = BursaBantuan::create([
            'kebutuhan_id' => $caseAceh->id,
            'posko_id' => $poskoAceh->id,
            'item_bantuan' => 'Pangan / Sembako (120 Paket / Unit)',
            'target_volume' => '120 Paket / Unit',
            'volume_terpenuhi' => '0 Paket / Unit',
            'urgensi' => 'Kritis',
            'status' => 'Terbuka',
            'published_at' => now()->subHours(4),
        ]);

        // =========================================================================
        // CASE 11 (SULAWESI TENGAH): GEMPA SIGI (DALAM VERIFIKASI BPBD SULTENG)
        // =========================================================================
        $caseSulteng = KebutuhanWarga::create([
            'kode_kasus' => 'RK-2026-00134',
            'citizen_id' => $citizen->id,
            'citizen_name' => 'Wayan Sudarta',
            'citizen_phone' => '+62 813 1122 3344',
            'posko_id' => $poskoSulteng->id,
            'kategori_kebutuhan' => 'Obat & Hygiene Kit',
            'volume_permintaan' => '80 Paket / Unit',
            'jumlah_kk' => 45,
            'status_hunian' => 'Tenda Halaman Rumah Rusak',
            'vulnerable_group' => true,
            'tingkat_urgensi' => 'Tinggi',
            'priority_rationale' => 'Rekomendasi Sistem: TINGGI — Gempa dangkal meretakkan bangunan permukiman, puskesmas darurat kekurangan obat dasar dan kasa steril.',
            'status' => 'Dalam Verifikasi',
            'deskripsi' => 'Guncangan gempa dangkal M 5.2 menyebabkan luka ringan puluhan warga, obat luka dan perban di pos medis darurat menipis.',
            'desa' => 'Gumbasa',
            'kecamatan' => 'Gumbasa',
            'kabupaten' => 'Kabupaten Sigi',
            'provinsi' => 'Sulawesi Tengah',
            'latitude' => -1.2467,
            'longitude' => 119.9834,
        ]);

        // LOG AKTIVITAS KRONOLOGIS UNTUK AUDIT TRAIL
        LogAktivitas::create([
            'kebutuhan_id' => $case1->id,
            'posko_id' => $posko1->id,
            'user_id' => $citizen->id,
            'user_name' => 'Andi Pratama',
            'aksi' => 'Laporan Dibuat',
            'deskripsi' => 'Laporan kebutuhan 1.000 L Air Bersih diajukan ke Posko BPBD.',
            'created_at' => now()->subHours(4),
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case1->id,
            'posko_id' => $posko1->id,
            'user_id' => $poskoOfficer->id,
            'user_name' => 'Siti Rahma',
            'aksi' => 'Verifikasi Posko',
            'deskripsi' => 'Koordinator Posko memvalidasi 87 KK dan menyetujui alokasi tahap 1 sebesar 500 L.',
            'created_at' => now()->subHours(3),
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case1->id,
            'posko_id' => $posko1->id,
            'user_id' => $responderBpbd->id,
            'user_name' => 'Arif Nugroho',
            'aksi' => 'Mulai Pengiriman',
            'deskripsi' => 'Truk Tangki No. 02 bergerak menuju Posko Induk Gubeng (500 L Air Bersih).',
            'created_at' => now()->subMinutes(25),
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case4->id,
            'posko_id' => $posko1->id,
            'user_id' => $responderPmi->id,
            'user_name' => 'dr. Hendra Wijaya',
            'aksi' => 'Pengajuan Klaim Mitra',
            'deskripsi' => 'PMI Jawa Timur mengajukan klaim penyaluran 30 Paket Hygiene Kit & Obat.',
            'created_at' => now()->subHours(1),
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case5->id,
            'posko_id' => $posko1->id,
            'user_id' => $responderBpbd->id,
            'user_name' => 'Arif Nugroho',
            'aksi' => 'Tiba di Lokasi',
            'deskripsi' => 'Armada Mobil Box Logistik tiba di Posko Induk Gubeng membawa 20 Paket Selimut.',
            'created_at' => now()->subMinutes(15),
        ]);

        LogAktivitas::create([
            'kebutuhan_id' => $case6->id,
            'posko_id' => $posko1->id,
            'user_id' => $poskoOfficer->id,
            'user_name' => 'Siti Rahma',
            'aksi' => 'Konfirmasi Penerimaan Tuntas (BAST)',
            'deskripsi' => '100 porsi makanan siap santap telah dikonfirmasi diterima tuntas warga. Kasus RK-2026-00129 resmi diselesaikan (RESOLVED).',
            'created_at' => now()->subHours(1),
        ]);
    }
}
