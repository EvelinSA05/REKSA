/**
 * Geolocation resolution utility for REKSA cases and reports.
 * Resolves accurate coordinates from administrative data (provinsi, kabupaten, kecamatan, desa)
 * if GPS coordinates are missing or set to default fallback.
 */

export function resolveCaseGeoLocation(c: {
  lat?: number | string;
  lng?: number | string;
  province?: string;
  regency?: string;
  district?: string;
  village?: string;
  location?: string;
  id?: string;
}): { lat: number; lng: number } {
  const rawLat = Number(c?.lat);
  const rawLng = Number(c?.lng);
  const text = `${c?.village || ""} ${c?.district || ""} ${c?.regency || ""} ${c?.province || ""} ${c?.location || ""}`.toLowerCase();

  const isDefaultSurabaya = Number.isFinite(rawLat) && Number.isFinite(rawLng) &&
    Math.hypot(rawLat - (-7.2654), rawLng - 112.7521) < 0.01;

  const isActuallySurabaya = text.includes("surabaya") || text.includes("gubeng") || text.includes("gayungan") || text.includes("wonokromo") || text.includes("rungkut");

  if (Number.isFinite(rawLat) && Number.isFinite(rawLng) && rawLat !== 0 && rawLng !== 0) {
    if (!isDefaultSurabaya || isActuallySurabaya) {
      return { lat: rawLat, lng: rawLng };
    }
  }

  let seed = 0;
  if (c?.id) {
    for (let i = 0; i < c.id.length; i++) {
      seed = (seed * 31 + c.id.charCodeAt(i)) % 10000;
    }
  }
  const jitterLat = ((seed % 20) - 10) * 0.0006;
  const jitterLng = (((seed >> 4) % 20) - 10) * 0.0006;

  // Trenggalek & Pule
  if (text.includes("trenggalek") || text.includes("pule")) {
    const base = text.includes("pule") ? { lat: -8.0820, lng: 111.5450 } : { lat: -8.0500, lng: 111.5800 };
    return { lat: Number((base.lat + jitterLat).toFixed(6)), lng: Number((base.lng + jitterLng).toFixed(6)) };
  }
  // Jombang & Diwek / Jogoroto
  if (text.includes("jombang") || text.includes("diwek") || text.includes("jogoroto")) {
    const base = (text.includes("diwek") || text.includes("jogoroto")) ? { lat: -7.5850, lng: 112.2400 } : { lat: -7.5500, lng: 112.2300 };
    return { lat: Number((base.lat + jitterLat).toFixed(6)), lng: Number((base.lng + jitterLng).toFixed(6)) };
  }
  // Sidoarjo & Buduran / Waru / Porong / Candi / Sedati
  if (text.includes("sidoarjo") || text.includes("buduran") || text.includes("waru") || text.includes("porong") || text.includes("candi")) {
    const base = text.includes("buduran") ? { lat: -7.4260, lng: 112.7230 } : text.includes("waru") ? { lat: -7.3540, lng: 112.7480 } : text.includes("porong") ? { lat: -7.5380, lng: 112.6980 } : text.includes("candi") ? { lat: -7.4812, lng: 112.7154 } : { lat: -7.4478, lng: 112.7183 };
    return { lat: Number((base.lat + jitterLat).toFixed(6)), lng: Number((base.lng + jitterLng).toFixed(6)) };
  }
  // Malang & Batu
  if (text.includes("malang") || text.includes("batu")) {
    const base = text.includes("batu") ? { lat: -7.8671, lng: 112.5239 } : { lat: -7.9839, lng: 112.6214 };
    return { lat: Number((base.lat + jitterLat).toFixed(6)), lng: Number((base.lng + jitterLng).toFixed(6)) };
  }
  // Gresik
  if (text.includes("gresik")) {
    return { lat: Number((-7.1566 + jitterLat).toFixed(6)), lng: Number((112.6555 + jitterLng).toFixed(6)) };
  }
  // Mojokerto
  if (text.includes("mojokerto")) {
    return { lat: Number((-7.4726 + jitterLat).toFixed(6)), lng: Number((112.4381 + jitterLng).toFixed(6)) };
  }
  // Pasuruan
  if (text.includes("pasuruan")) {
    return { lat: Number((-7.6453 + jitterLat).toFixed(6)), lng: Number((112.9075 + jitterLng).toFixed(6)) };
  }
  // Probolinggo
  if (text.includes("probolinggo")) {
    return { lat: Number((-7.7569 + jitterLat).toFixed(6)), lng: Number((113.2115 + jitterLng).toFixed(6)) };
  }
  // Kediri
  if (text.includes("kediri")) {
    return { lat: Number((-7.8480 + jitterLat).toFixed(6)), lng: Number((112.0178 + jitterLng).toFixed(6)) };
  }
  // Blitar
  if (text.includes("blitar")) {
    return { lat: Number((-8.0983 + jitterLat).toFixed(6)), lng: Number((112.1681 + jitterLng).toFixed(6)) };
  }
  // Tulungagung
  if (text.includes("tulungagung")) {
    return { lat: Number((-8.0655 + jitterLat).toFixed(6)), lng: Number((111.9015 + jitterLng).toFixed(6)) };
  }
  // Lamongan
  if (text.includes("lamongan")) {
    return { lat: Number((-7.1186 + jitterLat).toFixed(6)), lng: Number((112.4150 + jitterLng).toFixed(6)) };
  }
  // Bojonegoro
  if (text.includes("bojonegoro")) {
    return { lat: Number((-7.1502 + jitterLat).toFixed(6)), lng: Number((111.8818 + jitterLng).toFixed(6)) };
  }
  // Tuban
  if (text.includes("tuban")) {
    return { lat: Number((-6.8976 + jitterLat).toFixed(6)), lng: Number((112.0649 + jitterLng).toFixed(6)) };
  }
  // Madiun
  if (text.includes("madiun")) {
    return { lat: Number((-7.6298 + jitterLat).toFixed(6)), lng: Number((111.5239 + jitterLng).toFixed(6)) };
  }
  // Magetan
  if (text.includes("magetan")) {
    return { lat: Number((-7.6534 + jitterLat).toFixed(6)), lng: Number((111.3283 + jitterLng).toFixed(6)) };
  }
  // Ngawi
  if (text.includes("ngawi")) {
    return { lat: Number((-7.4039 + jitterLat).toFixed(6)), lng: Number((111.4462 + jitterLng).toFixed(6)) };
  }
  // Ponorogo
  if (text.includes("ponorogo")) {
    return { lat: Number((-7.8671 + jitterLat).toFixed(6)), lng: Number((111.4636 + jitterLng).toFixed(6)) };
  }
  // Pacitan
  if (text.includes("pacitan")) {
    return { lat: Number((-8.2065 + jitterLat).toFixed(6)), lng: Number((111.0921 + jitterLng).toFixed(6)) };
  }
  // Lumajang
  if (text.includes("lumajang")) {
    return { lat: Number((-8.1332 + jitterLat).toFixed(6)), lng: Number((113.2248 + jitterLng).toFixed(6)) };
  }
  // Jember
  if (text.includes("jember")) {
    return { lat: Number((-8.1724 + jitterLat).toFixed(6)), lng: Number((113.7007 + jitterLng).toFixed(6)) };
  }
  // Banyuwangi
  if (text.includes("banyuwangi")) {
    return { lat: Number((-8.2192 + jitterLat).toFixed(6)), lng: Number((114.3692 + jitterLng).toFixed(6)) };
  }
  // Situbondo
  if (text.includes("situbondo")) {
    return { lat: Number((-7.7062 + jitterLat).toFixed(6)), lng: Number((114.0044 + jitterLng).toFixed(6)) };
  }
  // Bondowoso
  if (text.includes("bondowoso")) {
    return { lat: Number((-7.9135 + jitterLat).toFixed(6)), lng: Number((113.8214 + jitterLng).toFixed(6)) };
  }
  // Madura
  if (text.includes("bangkalan")) {
    return { lat: Number((-7.0305 + jitterLat).toFixed(6)), lng: Number((112.7483 + jitterLng).toFixed(6)) };
  }
  if (text.includes("sampang")) {
    return { lat: Number((-7.1873 + jitterLat).toFixed(6)), lng: Number((113.2394 + jitterLng).toFixed(6)) };
  }
  if (text.includes("pamekasan")) {
    return { lat: Number((-7.1604 + jitterLat).toFixed(6)), lng: Number((113.4735 + jitterLng).toFixed(6)) };
  }
  if (text.includes("sumenep")) {
    return { lat: Number((-7.0167 + jitterLat).toFixed(6)), lng: Number((113.8667 + jitterLng).toFixed(6)) };
  }
  // Jawa Barat / Sukabumi
  if (text.includes("sukabumi") || text.includes("cibadak")) {
    return { lat: Number((-6.9175 + jitterLat).toFixed(6)), lng: Number((106.9298 + jitterLng).toFixed(6)) };
  }
  if (text.includes("bandung")) {
    return { lat: Number((-6.9175 + jitterLat).toFixed(6)), lng: Number((107.6191 + jitterLng).toFixed(6)) };
  }
  // DKI Jakarta
  if (text.includes("jakarta") || text.includes("dki")) {
    return { lat: Number((-6.2088 + jitterLat).toFixed(6)), lng: Number((106.8456 + jitterLng).toFixed(6)) };
  }
  // Jawa Tengah
  if (text.includes("semarang") || text.includes("jawa tengah")) {
    return { lat: Number((-7.0051 + jitterLat).toFixed(6)), lng: Number((110.4381 + jitterLng).toFixed(6)) };
  }
  // D.I. Yogyakarta
  if (text.includes("yogyakarta") || text.includes("jogja") || text.includes("sleman") || text.includes("bantul")) {
    return { lat: Number((-7.7956 + jitterLat).toFixed(6)), lng: Number((110.3695 + jitterLng).toFixed(6)) };
  }

  // Surabaya sub-districts default
  const surabayaBase = text.includes("gubeng") ? { lat: -7.2755, lng: 112.7533 } :
    text.includes("gayungan") ? { lat: -7.3305, lng: 112.7255 } :
    text.includes("wonokromo") ? { lat: -7.3012, lng: 112.7381 } :
    text.includes("rungkut") ? { lat: -7.3188, lng: 112.7820 } :
    { lat: -7.2654, lng: 112.7521 };

  return { lat: Number((surabayaBase.lat + jitterLat).toFixed(6)), lng: Number((surabayaBase.lng + jitterLng).toFixed(6)) };
}
