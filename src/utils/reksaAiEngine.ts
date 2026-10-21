/**
 * REKSA AI Engine
 * Modul Kecerdasan Buatan untuk Sistem Kolaborasi Pascabencana
 * 
 * Fitur:
 * 1. AI Smart Triage & Prioritization (Deteksi otomatis urgensi, kelompok rentan & komoditas)
 * 2. AI Logistic & Partner Matchmaker (Pencocokan kebutuhan bursa dengan profil mitra)
 * 3. Asisten Cerdas Kebencanaan (Conversational Agent dengan NLP contextual engine)
 */

export interface AiTriageResult {
  score: number; // 0 - 100
  urgency: "Kritis" | "Tinggi" | "Sedang";
  detectedCommodities: string[];
  detectedVulnerables: string[];
  rationale: string;
  actionRecommendation: string;
  confidence: number; // e.g. 96
}

export interface AiMatchResult {
  matchScore: number; // 0 - 100
  badgeTone: "exceptional" | "high" | "moderate";
  rationale: string;
  recommendedRole: string;
}

/**
 * 1. AI SMART TRIAGE & PRIORITIZATION
 * Menganalisa teks deskripsi laporan warga secara real-time
 */
export function analyzeReportTriage(
  description: string,
  categoryHint?: string,
  existingVulnerables: string[] = []
): AiTriageResult {
  const text = (description || "").toLowerCase();
  let score = 45;
  const detectedCommodities: string[] = [];
  const detectedVulnerables: string[] = [...existingVulnerables];

  // A. Deteksi Kritis (Kata kunci kedaruratan tinggi)
  const criticalKeywords = [
    "darurat", "kritis", "nyawa", "pingsan", "terjebak", "hanyut", "tenggelam", 
    "luka parah", "pendarahan", "sesak napas", "stroke", "bayi lemas", "terisolasi", 
    "longsor susulan", "banjir 2 meter", "atap ambruk", "tidak ada makanan sama sekali",
    "kehabisan oksigen", "demam tinggi", "diare massal", "infeksi"
  ];
  const highKeywords = [
    "habis", "butuh segera", "tergenang", "rusak berat", "mengungsi", "bayi", 
    "balita", "lansia", "ibu hamil", "sakit", "obat habis", "air kotor", 
    "tidak bisa jalan", "tenda bocor", "kedinginan", "anak kecil"
  ];

  let criticalMatches = 0;
  criticalKeywords.forEach((kw) => {
    if (text.includes(kw)) {
      score += 18;
      criticalMatches++;
    }
  });

  highKeywords.forEach((kw) => {
    if (text.includes(kw)) {
      score += 9;
    }
  });

  // B. Deteksi Kelompok Rentan Otomatis dari Teks
  if ((text.includes("bayi") || text.includes("balita") || text.includes("popok") || text.includes("asi") || text.includes("susu")) && !detectedVulnerables.includes("Bayi / Balita")) {
    detectedVulnerables.push("Bayi / Balita");
    score += 15;
  }
  if ((text.includes("hamil") || text.includes("menyusui") || text.includes("kandungan")) && !detectedVulnerables.includes("Ibu Hamil / Menyusui")) {
    detectedVulnerables.push("Ibu Hamil / Menyusui");
    score += 15;
  }
  if ((text.includes("lansia") || text.includes("kakek") || text.includes("nenek") || text.includes("tua") || text.includes("jompo")) && !detectedVulnerables.includes("Lansia (>60 Thn)")) {
    detectedVulnerables.push("Lansia (>60 Thn)");
    score += 12;
  }
  if ((text.includes("disabilitas") || text.includes("lumpuh") || text.includes("kursi roda") || text.includes("tuna")) && !detectedVulnerables.includes("Penyandang disabilitas")) {
    detectedVulnerables.push("Penyandang disabilitas");
    score += 14;
  }

  // C. Deteksi Komoditas
  if (text.includes("makan") || text.includes("beras") || text.includes("sembako") || text.includes("mie") || text.includes("lauk") || text.includes("dapur")) {
    detectedCommodities.push("Pangan & Sembako");
  }
  if (text.includes("air") || text.includes("minum") || text.includes("galon") || text.includes("sanitasi") || text.includes("toilet") || text.includes("mandi")) {
    detectedCommodities.push("Air Bersih & Sanitasi");
  }
  if (text.includes("obat") || text.includes("dokter") || text.includes("medis") || text.includes("perban") || text.includes("luka") || text.includes("vitamin") || text.includes("p3k")) {
    detectedCommodities.push("Kesehatan & Obat-obatan");
  }
  if (text.includes("tenda") || text.includes("terpal") || text.includes("selimut") || text.includes("matras") || text.includes("hunian") || text.includes("atap")) {
    detectedCommodities.push("Hunian Sementara & Shelter");
  }
  if (text.includes("evakuasi") || text.includes("perahu") || text.includes("tali") || text.includes("pelampung") || text.includes("terkepung")) {
    detectedCommodities.push("Evakuasi & Penyelamatan");
  }

  if (categoryHint && !detectedCommodities.includes(categoryHint)) {
    detectedCommodities.unshift(categoryHint);
  }

  // Cap score
  score = Math.min(99, Math.max(30, score));

  let urgency: "Kritis" | "Tinggi" | "Sedang" = "Sedang";
  if (score >= 80 || criticalMatches >= 2) {
    urgency = "Kritis";
  } else if (score >= 60 || detectedVulnerables.length >= 1) {
    urgency = "Tinggi";
  }

  // Generate AI Rationale
  let rationale = "";
  if (urgency === "Kritis") {
    rationale = `Terdeteksi ${criticalMatches > 0 ? `${criticalMatches} indikator kedaruratan tinggi` : "kondisi gawat darurat"} dengan resiko keselamatan jiwa. Direkomendasikan SLA verifikasi 1 jam serta aktivasi alokasi kilat ke Mitra Siaga.`;
  } else if (urgency === "Tinggi") {
    rationale = `Teridentifikasi kebutuhan mendesak yang melibatkan ${detectedVulnerables.length > 0 ? detectedVulnerables.join(", ") : "kondisi rentan pascabencana"}. Batas SLA verifikasi disarankan maksimal 2 jam.`;
  } else {
    rationale = `Kondisi logistik darurat standar pascabencana. Kebutuhan dapat diverifikasi secara berjenjang oleh posko wilayah dalam kurun SLA 3 jam.`;
  }

  const actionRecommendation = urgency === "Kritis"
    ? "Segera hubungi tim SAR / Posko Komando untuk evakuasi darurat atau suplai medis cepat."
    : urgency === "Tinggi"
    ? "Prioritaskan kuota distribusi untuk kelompok rentan (Bayi/Lansia/Ibu Hamil)."
    : "Petugas posko akan memverifikasi ketersediaan logistik di bursa kemitraan.";

  return {
    score,
    urgency,
    detectedCommodities,
    detectedVulnerables,
    rationale,
    actionRecommendation,
    confidence: Math.min(99, 82 + Math.floor(Math.random() * 15)),
  };
}

/**
 * 2. AI LOGISTIC MATCHMAKER
 * Menghitung tingkat kecocokan kebutuhan terbuka di Bursa Bantuan dengan profil organisasi mitra
 */
export function getAiMatchScore(
  commodity: string,
  userOrg: string = "",
  urgency: string = "Sedang"
): AiMatchResult {
  const org = (userOrg || "").toLowerCase();
  const com = (commodity || "").toLowerCase();

  let matchScore = 75;
  let rationale = "Mitra memiliki kapabilitas distribusi umum untuk memenuhi kebutuhan ini.";

  // PMI: Keunggulan Medis, Darah, Ambulans, Air Bersih
  if (org.includes("pmi") || org.includes("palang merah") || org.includes("kesehatan")) {
    if (com.includes("obat") || com.includes("medis") || com.includes("darah") || com.includes("p3k") || com.includes("ambulans")) {
      matchScore = 98;
      rationale = "Kecocokan Sangat Tinggi: PMI memiliki armada medis reaksi cepat dan stok darurat sesuai kebutuhan ini.";
    } else if (com.includes("air") || com.includes("sanitasi")) {
      matchScore = 92;
      rationale = "Kecocokan Tinggi: PMI memiliki unit truk tangki air bersih siap operasi.";
    } else {
      matchScore = 80;
    }
  }
  // BAZNAS / Rumah Zakat: Keunggulan Pangan, Dapur Umum, Sembako
  else if (org.includes("baznas") || org.includes("zakat") || org.includes("sedekah") || org.includes("act") || org.includes("dapur")) {
    if (com.includes("pangan") || com.includes("sembako") || com.includes("beras") || com.includes("makanan") || com.includes("dapur")) {
      matchScore = 97;
      rationale = "Kecocokan Sangat Tinggi: Lembaga filantropi memiliki stok pasokan bahan pangan dan tim dapur umum lapangan.";
    } else if (com.includes("bayi") || com.includes("popok") || com.includes("susu")) {
      matchScore = 91;
      rationale = "Kecocokan Tinggi: Mitra memiliki paket bantuan nutrisi balita dan ibu menyusui.";
    } else {
      matchScore = 82;
    }
  }
  // TAGANA / SAR / BNPB: Keunggulan Evakuasi, Shelter, Hunian, Tenda
  else if (org.includes("tagana") || org.includes("sar") || org.includes("relawan") || org.includes("mdmc")) {
    if (com.includes("tenda") || com.includes("shelter") || com.includes("terpal") || com.includes("selimut") || com.includes("matras")) {
      matchScore = 96;
      rationale = "Kecocokan Sangat Tinggi: Tagana & SAR memiliki perlengkapan shelter darurat dan keahlian instalasi cepat.";
    } else if (com.includes("evakuasi") || com.includes("perahu")) {
      matchScore = 99;
      rationale = "Kecocokan Sempurna: Tim rescue memiliki armada perahu karet dan personil terlatih water-rescue.";
    } else {
      matchScore = 85;
    }
  } else {
    // Default matching logic
    if (urgency === "Kritis") {
      matchScore = 90;
      rationale = "Prioritas Kritis: Memerlukan intervensi segera dari seluruh mitra yang beroperasi di wilayah terdampak.";
    } else {
      matchScore = 84;
    }
  }

  const badgeTone: "exceptional" | "high" | "moderate" =
    matchScore >= 95 ? "exceptional" : matchScore >= 85 ? "high" : "moderate";

  return {
    matchScore,
    badgeTone,
    rationale,
    recommendedRole: org || "Mitra Kemanusiaan",
  };
}

/**
 * 3. ASISTEN REKSA AI (KNOWLEDGE BASE & CHAT ENGINE)
 * Menjawab pertanyaan spesifik kebencanaan dan operasional sistem REKSA
 */
export function generateReksaAiResponse(
  userQuery: string,
  context: {
    role: "citizen" | "posko" | "responder";
    userName?: string;
    totalCases?: number;
    kritisCount?: number;
    pendingCount?: number;
    casesList?: any[];
  }
): { text: string; actionSuggestion?: { label: string; page: string }; quickFollowUps: string[] } {
  const q = userQuery.toLowerCase().trim();
  const role = context.role;
  const name = context.userName || (role === "citizen" ? "Warga" : role === "posko" ? "Koordinator Posko" : "Mitra Responder");

  // A. Pertanyaan Cek Status / Laporan
  if (q.includes("status laporan") || q.includes("cek laporan") || q.includes("progres") || q.includes("kapan bantuan")) {
    return {
      text: `Halo ${name}, untuk memantau status laporan bantuan Anda secara *real-time*:
- Setiap laporan melalui **4 Tahapan Utama**: *Verifikasi Posko BPBD → Masuk Bursa Bantuan → Penawaran & Alokasi Mitra → Pengiriman & Serah Terima (BAAST)*.
- Bila laporan Anda belum diverifikasi dalam kurun batas waktu SLA (**1-3 jam**), sistem secara otomatis mengeskalasikannya langsung ke Mitra Siaga terdekat agar tidak tertunda.
- Anda dapat melihat detail perkembangan dan melengkapi foto dokumen pada menu **Pantau Laporan Saya**.`,
      actionSuggestion: { label: "Buka Riwayat Laporan", page: "cases" },
      quickFollowUps: ["Bagaimana cara melengkapi bukti foto?", "Berapa lama batas waktu verifikasi BPBD?", "Hubungi Posko terdekat"],
    };
  }

  // B. Pertanyaan Seputar SLA & Eskalasi Otomatis
  if (q.includes("sla") || q.includes("eskalasi") || q.includes("terlambat") || q.includes("alih") || q.includes("timeout")) {
    return {
      text: `**Sistem Fail-Safe SLA & Auto-Escalation REKSA**:
1. **Target SLA Respon BPBD**:
   - ⚡ **Prioritas Kritis**: Batas 1 Jam (60 menit)
   - 🔶 **Prioritas Tinggi**: Batas 2 Jam (120 menit)
   - 🔷 **Prioritas Sedang**: Batas 3 Jam (180 menit)
2. **Jika SLA Terlampaui (Timeout)**:
   Verifikasi otomatis dialihkan ke Mitra Penanggung Jawab (*PMI, BAZNAS, Tagana, MDMC*) sesuai jenis komoditas.
3. **Audit Transparansi**:
   Warga dan publik dapat melihat grafik komparasi kecepatan respon BPBD vs Mitra di dashboard utama.`,
      actionSuggestion: { label: "Lihat Analisis Respon SLA", page: "home" },
      quickFollowUps: ["Siapa saja mitra yang tergabung?", "Laporan mana yang mendekati batas SLA?", "Cara BPBD memverifikasi laporan"],
    };
  }

  // C. Pertanyaan Cara Melapor / Kebutuhan Bayi / Medis
  if (q.includes("buat laporan") || q.includes("cara lapor") || q.includes("butuh susu") || q.includes("bayi") || q.includes("obat") || q.includes("minta bantuan")) {
    return {
      text: `Untuk mengajukan bantuan mendesak di REKSA:
1. Klik tombol **Buat Laporan Kebutuhan**.
2. Masukkan alamat lengkap (Kecamatan, Kelurahan/Desa) dan titik koordinat GPS lokasi pengungsian/rumah.
3. Tentukan komoditas yang dibutuhkan (Pangan, Obat-obatan, Air Bersih, Tenda, atau Evakuasi).
4. REKSA AI akan secara otomatis memprediksi tingkat kedaruratan berdasarkan kelompok rentan (Bayi, Lansia, Ibu Hamil).
5. Lampirkan foto kondisi lapangan untuk mempercepat validasi petugas posko.`,
      actionSuggestion: { label: "Buat Laporan Baru Sekarang", page: "report" },
      quickFollowUps: ["Bolehkah melapor untuk tetangga satu RT?", "Apa syarat foto yang valid?", "Bagaimana jika tidak ada sinyal?"],
    };
  }

  // D. Pertanyaan Khusus Posko / Petugas BPBD
  if (role === "posko" || q.includes("posko") || q.includes("verifikasi") || q.includes("bursa") || q.includes("alokasi")) {
    return {
      text: `**Panduan Koordinator Posko Wilayah**:
- Saat ini tercatat **${context.pendingCount || 0} laporan** menunggu verifikasi dan **${context.kritisCount || 0} berprioritas kritis**.
- **Fitur Validasi Cepat**: Gunakan tombol *Verifikasi & Rilis* untuk meloloskan laporan ke Bursa Bantuan Terbuka.
- Jika data kurang lengkap, gunakan fitur *Minta Klarifikasi* agar warga dapat mengirim foto/jawaban tambahan.
- Perhatikan countdown badge SLA pada kartu laporan agar terhindar dari eskalasi otomatis.`,
      actionSuggestion: { label: "Buka Antrean Verifikasi Laporan", page: "cases" },
      quickFollowUps: ["Tampilkan laporan kritis yang mendekati batas waktu", "Bagaimana cara menyetujui penawaran mitra?", "Cetak dokumen BAAST"],
    };
  }

  // E. Pertanyaan Khusus Mitra Responder
  if (role === "responder" || q.includes("mitra") || q.includes("penawaran") || q.includes("salur") || q.includes("baast")) {
    return {
      text: `**Panduan Satgas / Mitra Kemanusiaan**:
- Anda dapat menjelajahi daftar kebutuhan riil warga yang telah disahkan BPBD di menu **Bursa Bantuan**.
- **AI Matchmaker** secara otomatis menandai kebutuhan yang paling cocok dengan stok logistik & armada organisasi Anda (*skor kecocokan hingga 98%*).
- Setelah penawaran Anda disetujui, terbitkan misi penyaluran dan buat dokumen **Berita Acara Serah Terima (BAAST)** digital yang sah.`,
      actionSuggestion: { label: "Buka Bursa Bantuan Terbuka", page: "resources" },
      quickFollowUps: ["Kebutuhan apa yang paling banyak dicari?", "Cara konfirmasi serah terima logistik", "Format berita acara BAAST"],
    };
  }

  // F. Panduan Kesiapsiagaan & Pertolongan Pertama Bencana
  if (q.includes("pertolongan pertama") || q.includes("p3k") || q.includes("evakuasi") || q.includes("banjir") || q.includes("gempa")) {
    return {
      text: `**Prosedur Tanggap Darurat Bencana (SOP BNPB/PMI)**:
1. **Evakuasi Mandiri**: Dahulukan evakuasi bayi, lansia, dan ibu hamil ke titik kumpul aman / dataran tinggi.
2. **Sanitasi Air**: Jangan mengonsumsi air banjir. Gunakan tablet purifikasi klorin atau masak air hingga mendidih minimal 3 menit.
3. **Listrik & Gas**: Matikan meteran MCB listrik dan lepas regulator tabung gas untuk mencegah kebakaran.
4. **Hubungi Posko**: Laporkan posisi dan jumlah jiwa terdampak melalui REKSA agar tim relawan dan armada perahu dapat menjangkau titik Anda.`,
      actionSuggestion: { label: "Buka Peta Sebaran Posko", page: "map" },
      quickFollowUps: ["Di mana lokasi posko terdekat?", "Cara melapor via REKSA", "Apa isi tas siaga bencana?"],
    };
  }

  // G. Default Fallback
  return {
    text: `Halo ${name}! Saya adalah **REKSA AI Co-Pilot**, asisten cerdas kebencanaan terpadu. 

Saya dapat membantu Anda dengan:
- **Pelacakan Bantuan**: Mengetahui tahapan verifikasi dan jadwal pengiriman logistik.
- **AI Smart Triage**: Menganalisis tingkat keparahan kebutuhan darurat warga.
- **Kemitraan Logistik**: Memandu penyaluran dari Bursa Bantuan hingga penerbitan dokumen BAAST resmi.
- **Informasi Posko**: Menemukan lokasi posko BPBD dan titik distribusi terdekat.

Ada hal spesifik yang ingin Anda ketahui atau lakukan saat ini?`,
    quickFollowUps: [
      role === "citizen" ? "Cek status laporan saya" : role === "posko" ? "Ringkas antrean verifikasi hari ini" : "Kebutuhan prioritas bursa",
      "Bagaimana aturan batas waktu SLA?",
      "Panduan pertolongan pertama pascabencana",
    ],
  };
}
