<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('chat_messages', function (Blueprint $table) {
            $table->id();
            $table->string('channel')->default('umum'); // 'umum', 'posko_mitra', 'bantuan_warga'
            $table->string('sender_name');
            $table->string('sender_role'); // 'citizen', 'posko', 'responder'
            $table->string('sender_org')->nullable();
            $table->text('message');
            $table->string('tag')->nullable(); // 'INFO', 'URGENT', 'LOGISTIK', 'AKSES', 'KONFIRMASI'
            $table->unsignedBigInteger('kebutuhan_id')->nullable();
            $table->unsignedBigInteger('posko_id')->nullable();
            $table->timestamps();

            $table->index('channel');
            $table->index('sender_role');
            $table->index('created_at');
        });

        // Seed initial realistic collaborative chat messages between Citizen, BPBD Posko, and Mitra
        $now = now();
        DB::table('chat_messages')->insert([
            // Kanal Umum (Koordinasi Siaga Bencana)
            [
                'channel' => 'umum',
                'sender_name' => 'Siti Rahma',
                'sender_role' => 'posko',
                'sender_org' => 'Posko BPBD Buduran (Posko Induk)',
                'message' => 'Halo semua rekan Posko, Mitra Relawan, dan Warga. Saluran koordinasi terpadu resmi dibuka untuk mempercepat respon distribusi logistik pascabencana di wilayah Buduran & sekitarnya.',
                'tag' => 'INFO',
                'created_at' => $now->copy()->subHours(5),
                'updated_at' => $now->copy()->subHours(5),
            ],
            [
                'channel' => 'umum',
                'sender_name' => 'Andi Pratama',
                'sender_role' => 'citizen',
                'sender_org' => 'Warga RT 03 / RW 02 Desa Buduran',
                'message' => 'Selamat siang Bu Siti dan tim BPBD. Kami warga di sekitar jalan utama dekat Balai Desa saat ini air sudah mulai surut, namun persediaan air minum dan paket sembako keluarga kami menipis.',
                'tag' => 'URGENT',
                'created_at' => $now->copy()->subHours(4)->addMinutes(12),
                'updated_at' => $now->copy()->subHours(4)->addMinutes(12),
            ],
            [
                'channel' => 'umum',
                'sender_name' => 'Siti Rahma',
                'sender_role' => 'posko',
                'sender_org' => 'Posko BPBD Buduran',
                'message' => 'Baik Pak Andi Pratama, laporan kebutuhan Anda (Kasus RK-2026-00317) sudah kami validasi prioritas TINGGI dan telah dialokasikan ke armada distribusi cepat.',
                'tag' => 'KONFIRMASI',
                'created_at' => $now->copy()->subHours(3)->addMinutes(45),
                'updated_at' => $now->copy()->subHours(3)->addMinutes(45),
            ],
            [
                'channel' => 'umum',
                'sender_name' => 'Arif Nugroho',
                'sender_role' => 'responder',
                'sender_org' => 'Satgas Reaksi Cepat BPBD / Mitra',
                'message' => 'Siap Bu Siti & Pak Andi. Armada Distribusi Cepat kami sedang memuat 23 Paket Sandang & Pangan di Posko Induk. GPS ponsel pengemudi aktif dan jalur rute menuju Buduran terpantau lancar.',
                'tag' => 'LOGISTIK',
                'created_at' => $now->copy()->subHours(2)->addMinutes(10),
                'updated_at' => $now->copy()->subHours(2)->addMinutes(10),
            ],
            [
                'channel' => 'umum',
                'sender_name' => 'Andi Pratama',
                'sender_role' => 'citizen',
                'sender_org' => 'Warga RT 03 / RW 02 Desa Buduran',
                'message' => 'Terima kasih banyak atas respon cepatnya Pak Arif & Bu Siti! Kami menunggu di pos titik kumpul warga RT 03.',
                'tag' => 'INFO',
                'created_at' => $now->copy()->subMinutes(45),
                'updated_at' => $now->copy()->subMinutes(45),
            ],

            // Kanal Posko BPBD ⇄ Mitra
            [
                'channel' => 'posko_mitra',
                'sender_name' => 'Siti Rahma',
                'sender_role' => 'posko',
                'sender_org' => 'Koordinator BPBD Buduran',
                'message' => 'Panggilan untuk seluruh Mitra Kemanusiaan: Stok selimut dan hygiene kit di Posko Induk tersisa 40 paket. Bagi mitra yang memiliki kesiapan pasokan tambahan, silakan ajukan komitmen melalui Bursa Bantuan.',
                'tag' => 'LOGISTIK',
                'created_at' => $now->copy()->subHours(6),
                'updated_at' => $now->copy()->subHours(6),
            ],
            [
                'channel' => 'posko_mitra',
                'sender_name' => 'Arif Nugroho',
                'sender_role' => 'responder',
                'sender_org' => 'Satgas Reaksi Cepat BPBD',
                'message' => 'Lapor Posko, penawaran 12 Paket Sandang dari Satgas SRC sudah diverifikasi dan siap digabungkan dengan muatan distribusi sore ini.',
                'tag' => 'KONFIRMASI',
                'created_at' => $now->copy()->subHours(3),
                'updated_at' => $now->copy()->subHours(3),
            ],
            [
                'channel' => 'posko_mitra',
                'sender_name' => 'Siti Rahma',
                'sender_role' => 'posko',
                'sender_org' => 'Koordinator BPBD Buduran',
                'message' => 'Diterima Pak Arif. Pastikan pengemudi mengaktifkan fitur GPS ponsel di aplikasi agar posisi live armada dapat dipantau oleh Posko dan warga penerima.',
                'tag' => 'INFO',
                'created_at' => $now->copy()->subHours(2),
                'updated_at' => $now->copy()->subHours(2),
            ],

            // Kanal Layanan Bantuan Warga
            [
                'channel' => 'bantuan_warga',
                'sender_name' => 'Andi Pratama',
                'sender_role' => 'citizen',
                'sender_org' => 'Warga Terdampak',
                'message' => 'Izin bertanya kepada petugas, apakah bagi warga lansia yang tidak bisa berjalan jauh sembako bisa diantar langsung ke rumah tinggal?',
                'tag' => 'INFO',
                'created_at' => $now->copy()->subHours(3)->addMinutes(15),
                'updated_at' => $now->copy()->subHours(3)->addMinutes(15),
            ],
            [
                'channel' => 'bantuan_warga',
                'sender_name' => 'Siti Rahma',
                'sender_role' => 'posko',
                'sender_org' => 'Petugas Layanan Posko',
                'message' => 'Bisa sekali Pak Andi. Sistem REKSA memprioritaskan kelompok rentan (lansia, balita, disabilitas). Tim armada relawan diinstruksikan menyerahkan langsung *door-to-door* ke titik rumah warga yang bersangkutan.',
                'tag' => 'KONFIRMASI',
                'created_at' => $now->copy()->subHours(2)->addMinutes(40),
                'updated_at' => $now->copy()->subHours(2)->addMinutes(40),
            ],
            [
                'channel' => 'bantuan_warga',
                'sender_name' => 'Arif Nugroho',
                'sender_role' => 'responder',
                'sender_org' => 'Relawan Lapangan BPBD',
                'message' => 'Betul Pak Andi, kami membawa sepeda motor operasional cadangan jika gang pemukiman sempit tidak bisa dilewati mobil box. Kami pastikan bantuan sampai ke tangan penerima.',
                'tag' => 'AKSES',
                'created_at' => $now->copy()->subHours(1)->addMinutes(20),
                'updated_at' => $now->copy()->subHours(1)->addMinutes(20),
            ],
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chat_messages');
    }
};
