/**
 * REKSA AI Engine
 * Modul Kecerdasan Buatan untuk Sistem Kolaborasi Pascabencana
 * 
 * Fitur:
 * 1. AI Smart Triage & Prioritization (Deteksi otomatis urgensi, kelompok rentan & komoditas)
 * 2. AI Logistic & Partner Matchmaker (Pencocokan kebutuhan bursa dengan profil mitra)
 * 3. Asisten Cerdas Kebencanaan (Conversational Agent dengan NLP contextual engine)
 */

export interface ExtraReportContext {
  affectedPeople?: number | string;
  familyCount?: number | string;
  availabilityCondition?: string;
  kategoriKerusakanRumah?: string;
  village?: string;
  district?: string;
  regency?: string;
  amount?: number | string;
  customUnit?: string;
}

export interface AiTriageResult {
  score: number; // 0 - 100
  urgency: "Kritis" | "Tinggi" | "Sedang";
  detectedCommodities: string[];
  detectedVulnerables: string[];
  rationale: string;
  actionRecommendation: string;
  confidence: number; // e.g. 96
  recommendedUrgency: "Sangat mendesak" | "Perlu segera";
}

export interface GenerateConditionParams {
  category?: string;
  customCategory?: string;
  amount?: string | number;
  customUnit?: string;
  notes?: string;
  village?: string;
  district?: string;
  regency?: string;
  affectedPeople?: number | string;
  familyCount?: number | string;
  vulnerableList?: string[];
  availabilityCondition?: string;
  kategoriKerusakanRumah?: string;
  currentDescription?: string;
}

/**
 * GENERATE AI CONDITION DESCRIPTION
 * Asisten cerdas untuk menyusun draf narasi kondisi darurat yang lengkap, formal,
 * dan sesuai standar pelaporan kaji cepat bencana BNPB.
 */
export function generateAiConditionDescription(params: GenerateConditionParams): string {
  const {
    category = "",
    customCategory = "",
    amount,
    customUnit,
    notes = "",
    village = "",
    district = "",
    regency = "",
    affectedPeople,
    familyCount,
    vulnerableList = [],
    availabilityCondition = "",
    kategoriKerusakanRumah = "",
    currentDescription = "",
  } = params;

  const cat = (customCategory || category || "Kebutuhan Darurat Pascabencana").trim();
  const locParts = [village ? `Desa/Kel. ${village}` : "", district ? `Kec. ${district}` : "", regency ? regency : ""].filter(Boolean);
  const location = locParts.length > 0 ? locParts.join(", ") : "wilayah terdampak bencana";

  const numPeople = affectedPeople && Number(affectedPeople) > 0 ? `${affectedPeople} jiwa` : "";
  const numFamilies = familyCount && Number(familyCount) > 0 ? `${familyCount} KK` : "";
  const victimsCount = [numPeople, numFamilies].filter(Boolean).join(" / ") || "sejumlah warga terdampak";

  const activeVulns = (vulnerableList || []).filter((v) => v !== "Tidak ada");
  const vulnText = activeVulns.length > 0 ? ` (termasuk kelompok rentan: ${activeVulns.join(", ")})` : "";
  const requestedAmount = amount ? ` sebanyak ${amount} ${customUnit || "paket/unit"}` : "";

  // Jika warga sudah menulis deskripsi sendiri dengan panjang wajar, sempurnakan dengan ringkasan terstruktur
  if (currentDescription && currentDescription.trim().length > 35) {
    const trimmed = currentDescription.trim();
    if (trimmed.includes("[Ringkasan Situasi REKSA AI]")) {
      return trimmed;
    }
    return `${trimmed}\n\n[Ringkasan Situasi REKSA AI]: Lokasi di ${location}. Kebutuhan prioritas ${cat}${requestedAmount}, menyangkut ${victimsCount}${vulnText}. Status ketersediaan logistik saat ini: ${availabilityCondition || "Sangat mendesak"}.`;
  }

  // Bangun narasi darurat spesifik berdasarkan jenis kategori bencana
  if (
    cat.includes("Hunian") ||
    cat.includes("Tenda") ||
    cat.includes("Tempat Tinggal") ||
    cat.includes("Stimulan") ||
    cat.includes("Rumah")
  ) {
    const damageDesc = kategoriKerusakanRumah || availabilityCondition || "rusak berat akibat bencana";
    return `Kondisi pemukiman di ${location} mengalami kerusakan fisik dengan tingkat ${damageDesc}. Sebanyak ${victimsCount}${vulnText} saat ini kehilangan tempat tinggal yang aman dan terpaksa mengungsi di tempat penampungan darurat dengan perlindungan cuaca yang sangat minim. Kami sangat membutuhkan bantuan ${cat}${requestedAmount} (tenda keluarga layak huni, terpal, matras tidur, dan bantuan stimulan perbaikan rumah) sesegera mungkin demi keselamatan warga.`;
  }

  if (cat.includes("Pangan") || cat.includes("Makanan")) {
    const foodStatus = availabilityCondition || "persediaan bahan pangan habis total dan dapur umum posko belum menjangkau";
    return `Kondisi ketahanan pangan di ${location} berada dalam status darurat pascabencana. Sebanyak ${victimsCount}${vulnText} saat ini mengalami kekurangan bahan makanan pokok dan makanan siap santap karena ${foodStatus}. Sangat mendesak membutuhkan pasokan ${cat}${requestedAmount} berupa beras, makanan siap saji bernutrisi, biskuit balita, dan air minum higienis untuk mencegah kelaparan dan penurunan daya tahan tubuh warga pengungsian.`;
  }

  if (cat.includes("Air Bersih") || cat.includes("Sanitasi") || cat.includes("Air Minum")) {
    const waterStatus = availabilityCondition || "sumber air warga tercemar lumpur dan jaringan pipa air terputus total";
    return `Krisis air bersih darurat pascabencana melanda warga di ${location}. Sebanyak ${victimsCount}${vulnText} tidak memiliki akses air bersih layak minum dan sanitasi karena ${waterStatus}. Sangat mendesak membutuhkan bantuan ${cat}${requestedAmount} (air minum galon kemasan, armada truk tangki air bersih, tandon penampung darurat, dan fasilitas MCK) untuk memenuhi kebutuhan harian dan mencegah penyebaran wabah penyakit menular.`;
  }

  if (cat.includes("Kesehatan") || cat.includes("Medis") || cat.includes("Obat")) {
    const medStatus = availabilityCondition || "terdapat warga luka-luka, demam tinggi, dan stok obat pengungsian habis total";
    return `Situasi kedaruratan medis di ${location} memerlukan penanganan cepat. Terdapat ${victimsCount}${vulnText} yang kesehatannya terancam karena ${medStatus}. Fasilitas kesehatan terdekat mengalami kendala operasional sehingga sangat mendesak membutuhkan bantuan ${cat}${requestedAmount} (tim tenaga medis reaksi cepat, ambulans darurat, obat esensial, paket P3K, dan vitamin balita/lansia).`;
  }

  if (cat.includes("Sandang") || cat.includes("Pakaian") || cat.includes("Paket Non-Pangan")) {
    const clothesStatus = availabilityCondition || "pakaian warga basah/tertimbun reruntuhan dan kekurangan selimut hangat";
    return `Kondisi warga pengungsi di ${location} sangat membutuhkan bantuan perlengkapan sandang dan kebutuhan keluarga. Sebanyak ${victimsCount}${vulnText} saat ini berada di tempat pengungsian dalam kondisi kedinginan karena ${clothesStatus}. Sangat mendesak membutuhkan bantuan ${cat}${requestedAmount} berupa pakaian bersih layak pakai, selimut hangat, matras tidur, serta hygiene kit dan paket kebutuhan khusus anak (kidware).`;
  }

  if (cat.includes("Sarana") || cat.includes("Vital") || cat.includes("Energi")) {
    const vitalStatus = availabilityCondition || "jalur jalan terputus, jembatan rusak, dan aliran listrik padam total";
    return `Kondisi prasarana dan fasilitas vital di ${location} lumpuh pascabencana. Akses mobilitas warga dan logistik terhambat karena ${vitalStatus}. Sebanyak ${victimsCount} saat ini terisolasi dan memerlukan penanganan cepat berupa ${cat}${requestedAmount} (genset darurat, penerangan malam, dan peralatan perbaikan akses vital) agar jalur evakuasi dan suplai bantuan terbuka.`;
  }

  const noteSuffix = notes ? ` Catatan tambahan pelapor: "${notes}".` : "";
  return `Kondisi darurat pascabencana dialami oleh ${victimsCount}${vulnText} di ${location}. Status kebutuhan saat ini: ${availabilityCondition || "Sangat mendesak dan persediaan lokal tidak mencukupi"}. Warga membutuhkan intervensi bantuan ${cat}${requestedAmount} sesegera mungkin dari posko BPBD dan mitra responder.${noteSuffix}`;
}

/**
 * 1. AI SMART TRIAGE & PRIORITIZATION
 * Menganalisa teks deskripsi laporan warga secara real-time dengan NLP Kebencanaan Terpadu
 */
export function analyzeReportTriage(
  description: string,
  categoryHint?: string,
  existingVulnerables: string[] = [],
  context?: ExtraReportContext
): AiTriageResult {
  const text = (description || "").toLowerCase();
  const detectedCommodities: string[] = [];
  const detectedVulnerables: string[] = [...existingVulnerables];

  // A. Kata Kunci Kedaruratan Akut & Ancaman Keselamatan Jiwa (Score weight: +15 to +25)
  const criticalKeywords = [
    // Bencana Akut & Fisik
    "darurat", "kritis", "nyawa", "pingsan", "terjebak", "hanyut", "tenggelam", 
    "terisolasi", "terisolir", "terkepung", "tertimbun", "longsor", "tanah longsor",
    "banjir bandang", "banjir", "tsunami", "gempa", "gempa bumi", "ambruk", "runtuh", "roboh", 
    "hancur", "kebakaran", "puting beliung", "angin kencang", "badai", "arus deras",
    "sepinggang", "sedada", "seatap", "tanggul jebol", "jembatan putus",
    "jalan putus", "akses terputus", "listrik padam total", "gelap gulita",
    // Medis & Fisik Kritis
    "luka parah", "luka berat", "pendarahan", "patah tulang", "sesak napas", "sesak nafas", 
    "stroke", "bayi lemas", "bayi kejang", "kejang", "demam tinggi", "diare massal", 
    "infeksi", "sekarat", "meninggal", "korban jiwa", "kehabisan oksigen", "kontraksi",
    "melahirkan", "butuh ambulans", "hipotermia",
    // Ketiadaan Mutlak Kebutuhan Dasar
    "kelaparan", "tidak ada makanan", "belum makan", "habis total", "kehabisan makanan", 
    "tidak ada air", "kehabisan air", "krisis air", "air tercemar", "kedinginan parah",
    "tenda bocor", "tanpa atap", "rumah hancur", "rumah roboh"
  ];

  // B. Kata Kunci Kebutuhan Mendesak & Situasi Lapangan (Score weight: +8 to +12)
  const highKeywords = [
    "tergenang", "terendam", "kebanjiran", "lumpur", "rusak berat", "rusak parah",
    "rusak sedang", "mengungsi", "pengungsian", "tenda darurat", "posko", "terpal",
    "butuh segera", "mendesak", "tolong", "mohon bantuan", "habis", "menipis", "kekurangan",
    "belum ada bantuan", "belum tersentuh", "air kotor", "air keruh", "air bersih",
    "susu", "popok", "pampers", "selimut", "matras", "pakaian", "sembako", "beras",
    "dapur umum", "sakit", "obat habis", "obat-obatan", "p3k", "kedinginan",
    "tidak bisa jalan", "difabel", "genset", "lampu darurat"
  ];

  let criticalMatches = 0;
  let highMatches = 0;

  criticalKeywords.forEach((kw) => {
    if (text.includes(kw)) {
      criticalMatches++;
    }
  });

  highKeywords.forEach((kw) => {
    if (text.includes(kw)) {
      highMatches++;
    }
  });

  // Hitung Skor Awal Berdasarkan Deteksi Bencana
  // Jika terdeteksi kondisi darurat bencana, skor awal minimal 72-80 (bukan 45!)
  let score = 50;
  if (criticalMatches > 0) {
    score = 72 + Math.min(20, criticalMatches * 6);
  } else if (highMatches > 0) {
    score = 62 + Math.min(16, highMatches * 4);
  }

  // B. Deteksi Kelompok Rentan Otomatis dari Teks (Sesuai ID Checkbox Formulir)
  if ((text.includes("bayi") || text.includes("balita") || text.includes("batita") || text.includes("popok") || text.includes("pampers") || text.includes("asi") || text.includes("susu")) && !detectedVulnerables.includes("Balita")) {
    detectedVulnerables.push("Balita");
    score += 12;
  }
  if ((text.includes("anak") || text.includes("bocah") || text.includes("sekolah")) && !detectedVulnerables.includes("Anak-anak")) {
    detectedVulnerables.push("Anak-anak");
    score += 8;
  }
  if ((text.includes("hamil") || text.includes("menyusui") || text.includes("bumil") || text.includes("melahirkan") || text.includes("kandungan")) && !detectedVulnerables.includes("Ibu hamil")) {
    detectedVulnerables.push("Ibu hamil");
    score += 12;
  }
  if ((text.includes("lansia") || text.includes("kakek") || text.includes("nenek") || text.includes("tua") || text.includes("jompo") || text.includes("manula")) && !detectedVulnerables.includes("Lansia")) {
    detectedVulnerables.push("Lansia");
    score += 10;
  }
  if ((text.includes("disabilitas") || text.includes("difabel") || text.includes("lumpuh") || text.includes("kursi roda") || text.includes("tuna")) && !detectedVulnerables.includes("Penyandang disabilitas")) {
    detectedVulnerables.push("Penyandang disabilitas");
    score += 12;
  }

  // Jika warga sudah mencentang kelompok rentan pada form, tambahkan bobot kedaruratan
  if (existingVulnerables.filter((v) => v !== "Tidak ada").length > 0) {
    score += 8 * Math.min(3, existingVulnerables.length);
  }

  // C. Evaluasi Konteks Tambahan Form (Jiwa terdampak, ketersediaan, kerusakan rumah)
  if (context) {
    const peopleNum = Number(context.affectedPeople) || 0;
    if (peopleNum >= 50) score += 15;
    else if (peopleNum >= 20) score += 10;
    else if (peopleNum >= 5) score += 5;

    const avail = (context.availabilityCondition || "").toLowerCase();
    if (avail.includes("habis total") || avail.includes("terputus total") || avail.includes("lumpuh") || avail.includes("roboh") || avail.includes("kritis") || avail.includes("luka berat")) {
      score += 15;
    } else if (avail.includes("sangat menipis") || avail.includes("terbatas") || avail.includes("rusak sedang") || avail.includes("tidak aman")) {
      score += 8;
    }

    const damage = context.kategoriKerusakanRumah || "";
    if (damage.includes("Rusak Berat")) score += 15;
    else if (damage.includes("Rusak Sedang")) score += 8;
  }

  // D. Deteksi Komoditas & Bantuan Pasca-Bencana Berdasarkan Regulasi BNPB
  if (text.includes("makan") || text.includes("beras") || text.includes("sembako") || text.includes("mie") || text.includes("lauk") || text.includes("dapur") || text.includes("pangan") || text.includes("lapar")) {
    detectedCommodities.push("Pangan & Makanan Siap Saji");
  }
  if (text.includes("air") || text.includes("minum") || text.includes("galon") || text.includes("sanitasi") || text.includes("toilet") || text.includes("mandi") || text.includes("mck") || text.includes("tangki")) {
    detectedCommodities.push("Air Bersih & Sanitasi");
  }
  if (text.includes("obat") || text.includes("dokter") || text.includes("medis") || text.includes("perban") || text.includes("luka") || text.includes("vitamin") || text.includes("p3k") || text.includes("kesehatan") || text.includes("ambulans")) {
    detectedCommodities.push("Pelayanan Kesehatan & Medis");
  }
  if (text.includes("tenda") || text.includes("terpal") || text.includes("huntara") || text.includes("hunian") || text.includes("barak") || text.includes("posko pengungsian") || text.includes("mengungsi")) {
    detectedCommodities.push("Hunian Sementara (Huntara / Tenda)");
  }
  if (text.includes("pakaian") || text.includes("baju") || text.includes("selimut") || text.includes("matras") || text.includes("kidware") || text.includes("family kit") || text.includes("sandang")) {
    detectedCommodities.push("Sandang & Paket Non-Pangan");
  }
  if (text.includes("rumah roboh") || text.includes("rusak berat") || text.includes("hancur total") || text.includes("tembok retak") || text.includes("atap ambruk") || text.includes("stimulan") || text.includes("rekonstruksi") || text.includes("perbaikan rumah") || text.includes("roboh")) {
    detectedCommodities.push("Bantuan Stimulan Rumah (Pasca-Bencana)");
    score += 10;
  }
  if (text.includes("listrik") || text.includes("genset") || text.includes("jembatan putus") || text.includes("jalan tertutup") || text.includes("pipa air") || text.includes("sarana vital") || text.includes("infrastruktur")) {
    detectedCommodities.push("Pemulihan Sarana & Fasilitas Vital");
  }
  if (text.includes("evakuasi") || text.includes("perahu") || text.includes("tali") || text.includes("pelampung") || text.includes("terkepung") || text.includes("terjebak")) {
    detectedCommodities.push("Evakuasi & Penyelamatan");
  }

  if (categoryHint && !detectedCommodities.includes(categoryHint)) {
    detectedCommodities.unshift(categoryHint);
  }

  // Cap score antara 40 - 99
  score = Math.min(99, Math.max(40, score));

  // Klasifikasi Tingkat Urgensi
  let urgency: "Kritis" | "Tinggi" | "Sedang" = "Sedang";
  let recommendedUrgency: "Sangat mendesak" | "Perlu segera" = "Perlu segera";

  if (score >= 78 || criticalMatches >= 2 || (criticalMatches >= 1 && detectedVulnerables.length >= 1)) {
    urgency = "Kritis";
    recommendedUrgency = "Sangat mendesak";
  } else if (score >= 60 || criticalMatches >= 1 || detectedVulnerables.length >= 1) {
    urgency = "Tinggi";
    recommendedUrgency = "Sangat mendesak";
  } else {
    urgency = "Sedang";
    recommendedUrgency = "Perlu segera";
  }

  // Generate AI Rationale
  let rationale = "";
  if (urgency === "Kritis") {
    rationale = `Terdeteksi ${criticalMatches > 0 ? `${criticalMatches} indikator bencana/darurat akut` : "kondisi gawat darurat"} dengan ancaman keselamatan jiwa dan pemenuhan kebutuhan dasar korban. Direkomendasikan SLA verifikasi 1 jam serta aktivasi alokasi kilat ke Mitra Siaga.`;
  } else if (urgency === "Tinggi") {
    rationale = `Teridentifikasi kebutuhan mendesak pascabencana yang melibatkan ${detectedVulnerables.length > 0 ? detectedVulnerables.join(", ") : "warga terdampak"}. Batas SLA verifikasi disarankan maksimal 2 jam.`;
  } else {
    rationale = `Kondisi logistik pascabencana terverifikasi. Kebutuhan logistik diverifikasi dan dialokasikan berjenjang oleh posko wilayah dalam kurun SLA 3 jam.`;
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
    confidence: Math.min(99, 88 + Math.floor(Math.random() * 9)),
    recommendedUrgency,
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

  // G. Kategori Kebutuhan & Regulasi Resmi BNPB / BPBD
  if (
    q.includes("kategori") ||
    q.includes("standar bnpb") ||
    q.includes("perka bnpb") ||
    q.includes("stimulan") ||
    q.includes("rusak berat") ||
    q.includes("rusak sedang") ||
    q.includes("rusak ringan") ||
    q.includes("fase darurat") ||
    q.includes("skala kewenangan") ||
    q.includes("dana siap pakai") ||
    q.includes("dsp") ||
    q.includes("perbaikan rumah")
  ) {
    return {
      text: `**Klasifikasi Resmi Kondisi & Bantuan BNPB / BPBD**:
1. **Fase Status Keadaan Darurat Bencana**:
   - ⚠️ **Siaga Darurat**: Kesiapsiagaan logistik, kaji cepat & evakuasi pencegahan.
   - 🚨 **Tanggap Darurat**: Bencana terjadi; fokus penyelamatan jiwa, evakuasi medis & pemenuhan kebutuhan dasar pengungsi.
   - 🛠️ **Transisi Darurat ke Pemulihan**: Perbaikan fungsi sarana prasarana vital & stimulan perbaikan rumah warga.

2. **Standar Minimal Kebutuhan Dasar (Perka BNPB No. 7/2008)**:
   - **Pangan**: Min. 400 gram beras / jiwa / hari (setara 2.100 kkal).
   - **Air Bersih & Minum**: Air minum min. 2,5 Liter/jiwa/hari, sanitasi 7-15 Liter/jiwa/hari.
   - **Hunian Sementara (Huntara/Tenda)**: Standar layak min. 3 m² per orang.
   - **Sandang**: Family kits, kidware, hygiene kits, selimut & matras.
   - **Kesehatan & Sanitasi**: Obat esensial, nakes reaksi cepat & MCK darurat.

3. **Bantuan Stimulan Kerusakan Rumah (Kepka BNPB No. 296A/2023)**:
   - 🔴 **Rusak Berat**: Stimulan tunai **Rp 60.000.000,-** per unit rumah.
   - 🟡 **Rusak Sedang**: Stimulan tunai **Rp 30.000.000,-** per unit rumah.
   - 🟢 **Rusak Ringan**: Stimulan tunai **Rp 15.000.000,-** per unit rumah.

4. **Skala Wilayah & Kewenangan**:
   - **Kab/Kota**: BPBD Kab/Kota pilar utama penanganan dampak bencana lokal.
   - **Provinsi**: Intervensi logistik regional jika kapasitas kab/kota terlampaui.
   - **Nasional**: BNPB Pusat mengaktifkan **Dana Siap Pakai (DSP)** & koordinasi logistik nasional.`,
      actionSuggestion: { label: "Buat Laporan Sesuai Standar BNPB", page: "report" },
      quickFollowUps: [
        "Bagaimana cara klaim stimulan rumah rusak?",
        "Berapa standar air bersih pengungsi?",
        "Kapan status tanggap darurat berakhir?",
      ],
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
