import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import { apiService, PoskoItem } from '../services/api';

export interface LocationInfo {
  lat: number;
  lng: number;
  desa: string;
  kecamatan: string;
  kabupaten: string;
  provinsi: string;
  poskoName: string;
}

interface LeafletMapProps {
  operational?: boolean;
  hideCard?: boolean;
  selectedPoskoId?: number;
  onSelectPosko?: (posko: PoskoItem) => void;
  showRoute?: boolean;
  pickLocation?: boolean;
  initialLat?: number;
  initialLng?: number;
  locationAddress?: string;
  caseTitle?: string;
  caseId?: string;
  caseKk?: string;
  caseUrgency?: string;
  cases?: any[];
  onSelectCase?: (c: any) => void;
  onLocationPicked?: (info: LocationInfo) => void;
}

function resolveFallbackLocation(lat: number, lng: number): LocationInfo {
  // East Java
  if (lat < -6.8 && lat > -8.9 && lng > 111.0 && lng < 115.0) {
    const isBuduran = Math.hypot(lat - (-7.437581), lng - 112.703873) < 0.08 || (lat < -7.38 && lat > -7.50 && lng > 112.65 && lng < 112.78);
    const isSidoarjo = isBuduran || (lat < -7.35 && lat > -7.58 && lng > 112.55 && lng < 112.85);
    const isGayungan = Math.hypot(lat - (-7.3300), lng - 112.7250) < 0.04;
    const isWonokromo = Math.hypot(lat - (-7.3000), lng - 112.7400) < 0.05;
    const isRungkut = Math.hypot(lat - (-7.3200), lng - 112.7800) < 0.06;
    const isGubeng = Math.hypot(lat - (-7.2700), lng - 112.7550) < 0.05;

    const desa = isBuduran ? "Desa Buduran" : isGayungan ? "Gayungan / Siwalankerto" : isWonokromo ? "Wonokromo" : isRungkut ? "Rungkut Menanggal" : isGubeng ? "Gubeng" : "Surabaya";
    const kecamatan = isBuduran ? "Buduran" : isGayungan ? "Gayungan" : isWonokromo ? "Wonokromo" : isRungkut ? "Rungkut" : isGubeng ? "Gubeng" : (isSidoarjo ? "Sidoarjo" : "Kec. Kota");
    const kabupaten = isSidoarjo ? "Kabupaten Sidoarjo" : "Kota Surabaya";
    const provinsi = "Jawa Timur";
    const poskoName = isSidoarjo ? "Posko BPBD Kabupaten Sidoarjo (Posko Induk)" : "Posko BPBD Provinsi Jawa Timur (Komando Wilayah)";

    return {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      desa,
      kecamatan,
      kabupaten,
      provinsi,
      poskoName,
    };
  }

  // West Java & Sukabumi
  if (lat < -6.4 && lat > -7.8 && lng > 106.4 && lng < 108.8) {
    const isCibadak = Math.hypot(lat - (-6.9174639), lng - 106.9298281) < 0.15;
    const isBandung = Math.hypot(lat - (-6.9175), lng - 107.6191) < 0.2;

    const desa = isCibadak ? "Desa Sukamaju" : isBandung ? "Kel. Braga" : "Wilayah Jawa Barat";
    const kecamatan = isCibadak ? "Cibadak" : isBandung ? "Sumur Bandung" : "Kecamatan Setempat";
    const kabupaten = isCibadak ? "Kabupaten Sukabumi" : isBandung ? "Kota Bandung" : "Jawa Barat";
    const provinsi = "Jawa Barat";
    const poskoName = isCibadak ? "Posko Induk 01 - Balai Desa Sukamaju (BPBD Wilayah)" : `Posko BPBD ${kabupaten} (Jawa Barat)`;

    return {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      desa,
      kecamatan,
      kabupaten,
      provinsi,
      poskoName,
    };
  }

  // DKI Jakarta
  if (lat < -6.0 && lat > -6.4 && lng > 106.6 && lng < 107.1) {
    return {
      lat: Number(lat.toFixed(6)),
      lng: Number(lng.toFixed(6)),
      desa: "Kel. Menteng",
      kecamatan: "Menteng",
      kabupaten: "Kota Jakarta Pusat",
      provinsi: "DKI Jakarta",
      poskoName: "Posko Induk BPBD DKI Jakarta",
    };
  }

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    desa: "Wilayah Warga Terdampak",
    kecamatan: "Kecamatan Setempat",
    kabupaten: "Kabupaten/Kota Terkait",
    provinsi: "Indonesia",
    poskoName: "Posko Induk BPBD Wilayah",
  };
}

export interface CategoryMarkerConfig {
  color: string;
  gradient: string;
  icon: string;
  shortLabel: string;
  isUrgent: boolean;
}

export function getCategoryMarkerConfig(itemText: string = '', urgencyText: string = ''): CategoryMarkerConfig {
  const item = (itemText || '').toLowerCase();
  const urg = (urgencyText || '').toLowerCase();
  const isUrgent = urg.includes('kritis') || urg.includes('mendesak') || urg.includes('segera') || urg.includes('tinggi');

  if (item.includes('air') || item.includes('sanitasi') || item.includes('tandon') || item.includes('mck')) {
    return {
      color: '#0284c7', // Sky Blue
      gradient: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
      icon: '💧',
      shortLabel: 'Air Bersih',
      isUrgent,
    };
  }
  if (item.includes('sandang') || item.includes('pakaian') || item.includes('baju') || item.includes('selimut') || item.includes('dasar')) {
    return {
      color: '#ea580c', // Amber / Orange
      gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
      icon: '👕',
      shortLabel: 'Sandang',
      isUrgent,
    };
  }
  if (item.includes('makan') || item.includes('pangan') || item.includes('sembako') || item.includes('beras') || item.includes('dapur')) {
    return {
      color: '#16a34a', // Emerald Green
      gradient: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
      icon: '🍚',
      shortLabel: 'Pangan',
      isUrgent,
    };
  }
  if (item.includes('medis') || item.includes('obat') || item.includes('kesehatan') || item.includes('perban') || item.includes('dokter')) {
    return {
      color: '#dc2626', // Crimson Red
      gradient: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
      icon: '💊',
      shortLabel: 'Medis',
      isUrgent,
    };
  }
  if (item.includes('tenda') || item.includes('terpal') || item.includes('hunian') || item.includes('shelter') || item.includes('matras')) {
    return {
      color: '#7c3aed', // Royal Purple
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
      icon: '⛺',
      shortLabel: 'Hunian',
      isUrgent,
    };
  }
  if (item.includes('bayi') || item.includes('balita') || item.includes('popok') || item.includes('susu') || item.includes('lansia')) {
    return {
      color: '#db2777', // Rose Pink
      gradient: 'linear-gradient(135deg, #db2777 0%, #9d174d 100%)',
      icon: '🍼',
      shortLabel: 'Bayi/Lansia',
      isUrgent,
    };
  }
  if (item.includes('listrik') || item.includes('genset') || item.includes('energi') || item.includes('solar') || item.includes('bbm')) {
    return {
      color: '#d97706', // Yellow Gold
      gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
      icon: '⚡',
      shortLabel: 'Energi',
      isUrgent,
    };
  }

  return {
    color: '#0d9488', // Teal fallback
    gradient: 'linear-gradient(135deg, #0d9488 0%, #115e59 100%)',
    icon: '📦',
    shortLabel: itemText ? (itemText.length > 12 ? `${itemText.substring(0, 10)}..` : itemText) : 'Logistik',
    isUrgent,
  };
}

export function LeafletMap({
  operational = false,
  hideCard = false,
  selectedPoskoId,
  onSelectPosko,
  showRoute = false,
  pickLocation = false,
  initialLat = -7.3300, // Default to Surabaya coordinates
  initialLng = 112.7250,
  locationAddress,
  caseTitle,
  caseId,
  caseKk,
  caseUrgency,
  cases,
  onSelectCase,
  onLocationPicked,
}: LeafletMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const citizenMarkerRef = useRef<L.Marker | null>(null);

  const [citizenPos, setCitizenPos] = useState<[number, number]>([initialLat, initialLng]);
  const [activeAddress, setActiveAddress] = useState<string>(() => {
    if (pickLocation && Number.isFinite(Number(initialLat)) && Number.isFinite(Number(initialLng))) {
      const fallback = resolveFallbackLocation(Number(initialLat), Number(initialLng));
      return `${fallback.desa}, Kec. ${fallback.kecamatan}, ${fallback.kabupaten}`;
    }
    return "Pilih titik lokasi pada peta";
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);

  const [poskos, setPoskos] = useState<PoskoItem[]>([
    {
      id: 1,
      kode_posko: 'PSK-01',
      nama_posko: 'Posko BPBD Provinsi Jawa Timur (Komando Wilayah)',
      penanggung_jawab_nama: 'Siti Rahma',
      telepon: '+62 812 8899 1102',
      desa: 'Gayungan / Siwalankerto',
      kecamatan: 'Gayungan',
      kabupaten: 'Kota Surabaya',
      provinsi: 'Jawa Timur',
      latitude: -7.3305,
      longitude: 112.7255,
      kapasitas_kk: 250,
      kk_terdata: 120,
      status_operasional: 'Aktif',
    },
    {
      id: 2,
      kode_posko: 'PSK-02',
      nama_posko: 'Posko Induk 01 - Balai Desa Sukamaju (BPBD Wilayah)',
      penanggung_jawab_nama: 'Bambang Sudirja',
      telepon: '+62 813 5566 7788',
      desa: 'Desa Sukamaju',
      kecamatan: 'Cibadak',
      kabupaten: 'Kabupaten Sukabumi',
      provinsi: 'Jawa Barat',
      latitude: -6.9174639,
      longitude: 106.9298281,
      kapasitas_kk: 200,
      kk_terdata: 87,
      status_operasional: 'Aktif',
    },
    {
      id: 3,
      kode_posko: 'PSK-03',
      nama_posko: 'Posko Induk BPBD DKI Jakarta',
      penanggung_jawab_nama: 'Rahmat Hidayat',
      telepon: '+62 817 9900 1122',
      desa: 'Menteng',
      kecamatan: 'Menteng',
      kabupaten: 'Kota Jakarta Pusat',
      provinsi: 'DKI Jakarta',
      latitude: -6.1865,
      longitude: 106.8340,
      kapasitas_kk: 300,
      kk_terdata: 150,
      status_operasional: 'Aktif',
    },
  ]);

  const [activePosko, setActivePosko] = useState<PoskoItem>(poskos[0]);

  const onLocationPickedRef = useRef(onLocationPicked);
  onLocationPickedRef.current = onLocationPicked;

  // Multi-Engine Accurate Reverse Geocoding
  const updateCitizenLocation = useCallback(async (lat: number, lng: number) => {
    setCitizenPos([lat, lng]);

    const fallback = resolveFallbackLocation(lat, lng);
    const initialText = `${fallback.desa}, Kec. ${fallback.kecamatan}, ${fallback.kabupaten}`;
    setActiveAddress(initialText);

    let resolved = false;

    // 1. BigDataCloud Reverse Geocoder (High speed, specific to ID)
    try {
      const bdcUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=id`;
      const res = await fetch(bdcUrl);
      if (res.ok) {
        const data = await res.json();
        const prov = data.principalSubdivision || fallback.provinsi;
        const kab = data.city || data.localityInfo?.administrative?.[2]?.name || data.localityInfo?.administrative?.[1]?.name || fallback.kabupaten;
        const kec = data.localityInfo?.administrative?.[3]?.name || data.locality || fallback.kecamatan;
        const desa = data.localityInfo?.administrative?.[4]?.name || data.locality || kec;

        const resolvePosko = (p = "", k = "", c = "") => {
          const lp = p.toLowerCase();
          const lk = k.toLowerCase();
          const lc = c.toLowerCase();
          if (lk.includes("sidoarjo")) return "Posko BPBD Kabupaten Sidoarjo (Posko Induk)";
          if (lk.includes("surabaya")) return "Posko Penanggulangan Bencana BPBD Kota Surabaya";
          if (lk.includes("gresik")) return "Posko Siaga Darurat BPBD Kab. Gresik";
          if (lk.includes("malang")) return "Posko Penanganan Bencana BPBD Kab. Malang";
          if (lk.includes("sukabumi") || lc.includes("cibadak")) return "Posko BPBD Kabupaten Sukabumi (Posko Induk)";
          if (lk.includes("bandung")) return "Posko Siaga Bencana BPBD Kota Bandung";
          if (lk.includes("bogor")) return "Posko Tanggap Darurat BPBD Kabupaten Bogor";
          if (lp.includes("dki") || lk.includes("jakarta")) return "Posko Induk BPBD DKI Jakarta";
          if (lp.includes("jawa timur")) return "Posko BPBD Provinsi Jawa Timur (Komando Wilayah)";
          if (lp.includes("jawa barat")) return "Posko BPBD Provinsi Jawa Barat (Pusdalops PB)";
          if (lp.includes("jawa tengah")) return "Posko BPBD Provinsi Jawa Tengah (Pusdalops)";
          if (lp.includes("yogyakarta") || lp.includes("jogja")) return "Posko Induk TRC BPBD DI Yogyakarta";
          if (lp.includes("banten")) return "Posko BPBD Provinsi Banten (Pusdalops)";
          if (lp.includes("bali")) return "Posko BPBD Provinsi Bali (Pusdalops Denpasar)";
          return k ? `Posko BPBD ${k}` : "Posko BPBD Wilayah Rujukan";
        };

        const info: LocationInfo = {
          lat: Number(lat.toFixed(6)),
          lng: Number(lng.toFixed(6)),
          desa: (desa || fallback.desa).replace(/Kelurahan\s+/i, "Kel. ").replace(/Desa\s+/i, "Desa "),
          kecamatan: (kec || fallback.kecamatan).replace(/Kecamatan\s+/i, ""),
          kabupaten: (kab || fallback.kabupaten),
          provinsi: (prov || fallback.provinsi),
          poskoName: resolvePosko(prov, kab, kec),
        };

        setActiveAddress(`${info.desa}, Kec. ${info.kecamatan}, ${info.kabupaten}`);
        onLocationPickedRef.current?.(info);
        resolved = true;
      }
    } catch (e) {
      console.log('BigDataCloud error, trying Nominatim...', e);
    }

    // 2. OpenStreetMap Nominatim Fallback
    if (!resolved) {
      try {
        const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
        const res = await fetch(nomUrl, { headers: { 'Accept-Language': 'id, en' } });
        if (res.ok) {
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const road = addr.road ? `${addr.road}, ` : "";
            const desa = addr.suburb || addr.village || addr.quarter || addr.neighbourhood || addr.residential || fallback.desa;
            const kec = addr.city_district || addr.subdistrict || addr.district || addr.municipality || fallback.kecamatan;
            const kab = addr.city || addr.town || addr.regency || addr.county || fallback.kabupaten;
            const prov = addr.state || addr.province || fallback.provinsi;

            const resolvePosko = (p = "", k = "", c = "") => {
              const lp = p.toLowerCase();
              const lk = k.toLowerCase();
              const lc = c.toLowerCase();
              if (lk.includes("sidoarjo")) return "Posko BPBD Kabupaten Sidoarjo (Posko Induk)";
              if (lk.includes("surabaya")) return "Posko Penanggulangan Bencana BPBD Kota Surabaya";
              if (lk.includes("gresik")) return "Posko Siaga Darurat BPBD Kab. Gresik";
              if (lk.includes("malang")) return "Posko Penanganan Bencana BPBD Kab. Malang";
              if (lk.includes("sukabumi") || lc.includes("cibadak")) return "Posko BPBD Kabupaten Sukabumi (Posko Induk)";
              if (lk.includes("bandung")) return "Posko Siaga Bencana BPBD Kota Bandung";
              if (lk.includes("bogor")) return "Posko Tanggap Darurat BPBD Kabupaten Bogor";
              if (lp.includes("dki") || lk.includes("jakarta")) return "Posko Induk BPBD DKI Jakarta";
              if (lp.includes("jawa timur")) return "Posko BPBD Provinsi Jawa Timur (Komando Wilayah)";
              if (lp.includes("jawa barat")) return "Posko BPBD Provinsi Jawa Barat (Pusdalops PB)";
              if (lp.includes("jawa tengah")) return "Posko BPBD Provinsi Jawa Tengah (Pusdalops)";
              if (lp.includes("yogyakarta") || lp.includes("jogja")) return "Posko Induk TRC BPBD DI Yogyakarta";
              if (lp.includes("banten")) return "Posko BPBD Provinsi Banten (Pusdalops)";
              if (lp.includes("bali")) return "Posko BPBD Provinsi Bali (Pusdalops Denpasar)";
              return k ? `Posko BPBD ${k}` : "Posko BPBD Wilayah Rujukan";
            };

            const info: LocationInfo = {
              lat: Number(lat.toFixed(6)),
              lng: Number(lng.toFixed(6)),
              desa: `${road}${desa}`.replace(/Kelurahan\s+/i, "Kel. ").replace(/Desa\s+/i, "Desa "),
              kecamatan: (kec || fallback.kecamatan).replace(/Kecamatan\s+/i, ""),
              kabupaten: (kab || fallback.kabupaten),
              provinsi: (prov || fallback.provinsi),
              poskoName: resolvePosko(prov, kab, kec),
            };

            setActiveAddress(`${info.desa}, Kec. ${info.kecamatan}, ${info.kabupaten}`);
            onLocationPickedRef.current?.(info);
            resolved = true;
          }
        }
      } catch (e) {
        console.log('Nominatim lookup error', e);
      }
    }

    if (!resolved) {
      onLocationPickedRef.current?.(fallback);
    }
  }, [resolveFallbackLocation]);

  // Handle GPS button click with multi-tier detection (Browser GPS -> Free IP Geolocation)
  const handleGPSButtonClick = useCallback(() => {
    setIsLocating(true);

    const tryIPLocation = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            const lat = data.latitude;
            const lng = data.longitude;
            setIsLocating(false);
            updateCitizenLocation(lat, lng);
            if (mapInstanceRef.current) {
              mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
            }
            return;
          }
        }
      } catch (e) {}

      // Fallback coordinate to current initial coordinates
      setIsLocating(false);
      updateCitizenLocation(initialLat, initialLng);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([initialLat, initialLng], 15, { animate: true, duration: 1.0 });
      }
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setIsLocating(false);
          updateCitizenLocation(lat, lng);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
          }
        },
        () => {
          tryIPLocation();
        },
        { enableHighAccuracy: true, timeout: 7000 }
      );
    } else {
      tryIPLocation();
    }
  }, [updateCitizenLocation]);

  // Search places in Indonesia via Photon / OSM Geocoder
  const handleSearchSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setShowSearchDropdown(true);

    try {
      const q = encodeURIComponent(`${searchQuery}, Indonesia`);
      const url = `https://photon.komoot.io/api/?q=${q}&limit=5&lang=default`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.features && data.features.length > 0) {
          setSearchResults(data.features);
        } else {
          // Try Nominatim
          const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${q}&countrycodes=id&limit=5`;
          const nomRes = await fetch(nomUrl);
          const nomData = await nomRes.json();
          if (nomData && nomData.length > 0) {
            setSearchResults(nomData.map((item: any) => ({
              geometry: { coordinates: [parseFloat(item.lon), parseFloat(item.lat)] },
              properties: { name: item.display_name, city: item.name }
            })));
          } else {
            setSearchResults([]);
          }
        }
      }
    } catch (err) {
      console.log('Search error', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (feature: any) => {
    const coords = feature.geometry.coordinates; // [lng, lat]
    const lng = coords[0];
    const lat = coords[1];

    setShowSearchDropdown(false);
    setSearchQuery(feature.properties?.name || searchQuery);

    updateCitizenLocation(lat, lng);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], 16, { animate: true, duration: 1.2 });
    }
  };

  // Fetch poskos from API
  useEffect(() => {
    let isMounted = true;
    apiService.getPoskos()
      .then((res) => {
        if (isMounted && res.success && res.data && res.data.length > 0) {
          setPoskos(res.data);
          if (selectedPoskoId) {
            const found = res.data.find(p => p.id === selectedPoskoId);
            if (found) setActivePosko(found);
          } else {
            setActivePosko(res.data[0]);
          }
        }
      })
      .catch((err) => console.log('Using offline mock poskos', err));

    return () => {
      isMounted = false;
    };
  }, [selectedPoskoId]);

  // Initial setup on render (runs strictly once to prevent flickering)
  const hasInitializedGeoRef = useRef(false);
  useEffect(() => {
    if (pickLocation && !hasInitializedGeoRef.current) {
      hasInitializedGeoRef.current = true;
      setCitizenPos([initialLat, initialLng]);
    }
  }, [pickLocation, initialLat, initialLng]);

  // Dynamic sync if initial coordinates change externally (e.g. from GPS auto-detect or case selection)
  const lastSyncCoordsRef = useRef<string>('');
  useEffect(() => {
    if (initialLat !== undefined && initialLng !== undefined) {
      const key = `${Number(initialLat).toFixed(5)},${Number(initialLng).toFixed(5)}`;
      if (lastSyncCoordsRef.current && lastSyncCoordsRef.current !== key) {
        setCitizenPos([initialLat, initialLng]);
        if (citizenMarkerRef.current) {
          citizenMarkerRef.current.setLatLng([initialLat, initialLng]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([initialLat, initialLng], 16, { animate: true, duration: 1.0 });
        }
        if (pickLocation) {
          updateCitizenLocation(initialLat, initialLng);
        }
      }
      lastSyncCoordsRef.current = key;
    }
  }, [initialLat, initialLng, pickLocation, updateCitizenLocation]);

  // Initialize Leaflet Map (Mount & Cleanup lifecycle)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Remove legacy leaflet id if container is reused
    if ((mapContainerRef.current as any)._leaflet_id && !mapInstanceRef.current) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    if (!mapInstanceRef.current) {
      const startLat = Number.isFinite(Number(initialLat)) ? Number(initialLat) : -7.3300;
      const startLng = Number.isFinite(Number(initialLng)) ? Number(initialLng) : 112.7250;

      const map = L.map(mapContainerRef.current, {
        center: [startLat, startLng],
        zoom: 15,
        zoomControl: false,
        scrollWheelZoom: true,
      });

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const markerLayer = L.layerGroup().addTo(map);
      markersRef.current = markerLayer;
      mapInstanceRef.current = map;

      if (pickLocation) {
        map.on('click', (e: L.LeafletMouseEvent) => {
          if (e?.latlng && Number.isFinite(e.latlng.lat) && Number.isFinite(e.latlng.lng)) {
            updateCitizenLocation(e.latlng.lat, e.latlng.lng);
          }
        });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = null;
      }
      if (mapContainerRef.current && (mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }
    };
  }, []);

  // Update markers & layers whenever data / position changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markerLayer = markersRef.current;
    if (!map || !markerLayer) return;

    markerLayer.clearLayers();

    // Posko Marker Icon (Clean elevated badge with pointer stem)
    const createPoskoIcon = (label: string, isSelected: boolean, isNearCase: boolean) => {
      return L.divIcon({
        className: 'custom-posko-marker',
        html: `
          <div style="
            position: relative;
            background: ${isSelected ? '#013220' : '#1b4332'};
            color: #ffffff;
            border: 1.5px solid #ffffff;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            border-radius: 8px;
            padding: 4px 10px;
            font-size: 11px;
            font-weight: 700;
            display: inline-flex;
            align-items: center;
            gap: 5px;
            cursor: pointer;
            white-space: nowrap;
            transform: translate(-50%, ${isNearCase ? '-140%' : '-100%'});
            margin-top: ${isNearCase ? '-20px' : '-8px'};
            z-index: ${isSelected ? 600 : 300};
          ">
            <span style="font-size: 12px;">🏛️</span>
            <span>${label}</span>
            <div style="
              position: absolute;
              bottom: -6px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 6px solid transparent;
              border-right: 6px solid transparent;
              border-top: 6px solid ${isSelected ? '#013220' : '#1b4332'};
            "></div>
          </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });
    };

    // Render Posko Markers if available (unless in pickLocation mode)
    if (!pickLocation && Array.isArray(poskos)) {
      // Find average center of cases to only display regional poskos if active cases exist
      const regionalCases = (!pickLocation && operational && Array.isArray(cases))
        ? cases.filter((c) => Number.isFinite(Number(c?.lat)) && Number.isFinite(Number(c?.lng)))
        : [];
      const hasRegionalCases = regionalCases.length > 0;
      const cAvgLat = hasRegionalCases
        ? regionalCases.reduce((s, c) => s + Number(c.lat), 0) / regionalCases.length
        : 0;
      const cAvgLng = hasRegionalCases
        ? regionalCases.reduce((s, c) => s + Number(c.lng), 0) / regionalCases.length
        : 0;

      poskos.forEach((posko) => {
        const lat = Number(posko?.latitude);
        const lng = Number(posko?.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        // Skip distant posko hundreds of km away if active cases are in this local region
        if (hasRegionalCases) {
          const distToCases = Math.hypot(lat - cAvgLat, lng - cAvgLng);
          if (distToCases > 1.2) return;
        }

        const isSelected = activePosko?.id === posko.id;
        const marker = L.marker([lat, lng], {
          icon: createPoskoIcon(posko.kode_posko || 'POSKO', isSelected, false),
          zIndexOffset: isSelected ? 500 : 200,
        });

        marker.bindPopup(`
          <div style="font-size: 12px; line-height: 1.4;">
            <strong style="color: #013220; display: block; margin-bottom: 2px;">${posko.nama_posko || 'Posko BPBD'}</strong>
            <div><b>Wilayah:</b> ${posko.desa || '-'}, Kec. ${posko.kecamatan || '-'}</div>
          </div>
        `);

        marker.on('click', () => {
          setActivePosko(posko);
          onSelectPosko?.(posko);
        });

        marker.addTo(markerLayer);
      });
    }

    // Google Maps Style Blue Dot / Pin with Pulse (Form Pelaporan)
    if (pickLocation) {
      const cLat = Number(citizenPos?.[0]);
      const cLng = Number(citizenPos?.[1]);
      if (Number.isFinite(cLat) && Number.isFinite(cLng)) {
        const googlePinIcon = L.divIcon({
          className: 'google-maps-location-pin',
          html: `
            <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: grab;">
              <div style="
                position: absolute;
                width: 34px;
                height: 34px;
                border-radius: 50%;
                background: rgba(1, 50, 32, 0.22);
                animation: gmap-pulse 2s infinite ease-out;
              "></div>
              <div style="
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #013220;
                border: 3.5px solid #ffffff;
                box-shadow: 0 3px 8px rgba(0,0,0,0.4);
                z-index: 2;
              "></div>
            </div>
          `,
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });

        const citizenMarker = L.marker([cLat, cLng], {
          icon: googlePinIcon,
          draggable: true,
          zIndexOffset: 1000,
        });

        citizenMarker.on('dragend', () => {
          const pos = citizenMarker.getLatLng();
          if (pos && Number.isFinite(pos.lat) && Number.isFinite(pos.lng)) {
            updateCitizenLocation(pos.lat, pos.lng);
          }
        });

        citizenMarker.bindPopup(`
          <div style="font-size: 12px; max-width: 200px;">
            <strong style="color: #013220; font-size: 13px; display: inline-flex; align-items: center; gap: 4px;">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>
              Titik Lokasi Anda
            </strong><br>
            <div style="margin: 4px 0; font-weight: 600; color: #222;">${activeAddress}</div>
            <small style="color: #2e774f;">✓ Koordinat disinkronkan ke formulir</small>
          </div>
        `);

        citizenMarker.addTo(markerLayer);
        citizenMarkerRef.current = citizenMarker;
      }
    } else if (operational) {
      if (Array.isArray(cases) && cases.length > 0) {
        const bounds: [number, number][] = [];
        const validCases = cases.filter(
          (c) => Number.isFinite(Number(c?.lat)) && Number.isFinite(Number(c?.lng))
        );

        // Group into spatial clusters (points within ~0.002 deg / ~220m)
        const clusters: { centerLat: number; centerLng: number; items: any[] }[] = [];
        validCases.forEach((c) => {
          const lat = Number(c.lat);
          const lng = Number(c.lng);
          let match = clusters.find(
            (cl) => Math.hypot(cl.centerLat - lat, cl.centerLng - lng) < 0.002
          );
          if (!match) {
            match = { centerLat: lat, centerLng: lng, items: [] };
            clusters.push(match);
          }
          match.items.push(c);
        });

        // Compute average center of all cases
        let caseAvgLat = 0;
        let caseAvgLng = 0;
        if (validCases.length > 0) {
          caseAvgLat = validCases.reduce((s, c) => s + Number(c.lat), 0) / validCases.length;
          caseAvgLng = validCases.reduce((s, c) => s + Number(c.lng), 0) / validCases.length;
        }

        // Only include poskos that are within 1.0 degree (~110km) of the active cases
        if (Array.isArray(poskos) && validCases.length > 0) {
          poskos.forEach((p) => {
            const plat = Number(p.latitude);
            const plng = Number(p.longitude);
            if (Number.isFinite(plat) && Number.isFinite(plng)) {
              if (Math.hypot(plat - caseAvgLat, plng - caseAvgLng) < 1.0) {
                bounds.push([plat, plng]);
              }
            }
          });
        }

        clusters.forEach((cluster) => {
          const count = cluster.items.length;
          const isCluster = count > 1;

          // If there are multiple cases at the same spot, draw a faint connector circle & hub
          if (isCluster) {
            const hubIcon = L.divIcon({
              className: 'cluster-center-hub',
              html: `
                <div style="
                  position: relative;
                  width: 16px;
                  height: 16px;
                  border-radius: 50%;
                  background: rgba(1, 50, 32, 0.14);
                  border: 1.5px dashed #013220;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  transform: translate(-50%, -50%);
                  pointer-events: none;
                ">
                  <div style="width: 5px; height: 5px; border-radius: 50%; background: #013220;"></div>
                </div>
              `,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            });
            L.marker([cluster.centerLat, cluster.centerLng], { icon: hubIcon, zIndexOffset: 50 }).addTo(markerLayer);
          }

          cluster.items.forEach((c, idx) => {
            const rawLat = Number(c.lat);
            const rawLng = Number(c.lng);

            // Calculate radial offset if multiple items share location
            let lat = cluster.centerLat;
            let lng = cluster.centerLng;

            if (isCluster) {
              const angle = (idx / count) * 2 * Math.PI - (Math.PI / 2);
              const radiusLat = 0.0035; // ~390 meters
              const radiusLng = 0.0042; // adjusted for latitude
              lat = cluster.centerLat + Math.sin(angle) * radiusLat;
              lng = cluster.centerLng + Math.cos(angle) * radiusLng;

              // Draw subtle dotted connector line from center to dispersed pin
              L.polyline([[cluster.centerLat, cluster.centerLng], [lat, lng]], {
                color: '#64748b',
                weight: 1.5,
                dashArray: '3, 4',
                opacity: 0.65,
              }).addTo(markerLayer);
            }

            bounds.push([lat, lng]);

            const cfg = getCategoryMarkerConfig(c.item, c.urgency);
            const pillLabel = isCluster ? `${cfg.shortLabel} #${idx + 1}` : cfg.shortLabel;

            const casePinIcon = L.divIcon({
              className: 'case-location-pin',
              html: `
                <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
                  <div style="
                    background: ${cfg.gradient};
                    color: #ffffff;
                    padding: 3px 8px 3px 6px;
                    border-radius: 20px;
                    font-size: 11px;
                    font-weight: 700;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.28), 0 1px 3px rgba(0,0,0,0.18);
                    border: 1.5px solid #ffffff;
                    white-space: nowrap;
                    display: inline-flex;
                    align-items: center;
                    gap: 4px;
                    letter-spacing: -0.2px;
                    line-height: 1.2;
                  ">
                    <span style="font-size: 12px; line-height: 1;">${cfg.icon}</span>
                    <span>${pillLabel}</span>
                    ${cfg.isUrgent ? `<span style="width: 6px; height: 6px; border-radius: 50%; background: #fef08a; border: 1px solid #ffffff; display: inline-block;"></span>` : ''}
                  </div>
                  <div style="
                    width: 0;
                    height: 0;
                    border-left: 5px solid transparent;
                    border-right: 5px solid transparent;
                    border-top: 6px solid ${cfg.color};
                    margin-top: -1px;
                  "></div>
                  <div style="
                    width: 7px;
                    height: 7px;
                    border-radius: 50%;
                    background: ${cfg.color};
                    border: 1.5px solid #ffffff;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.35);
                    margin-top: -2px;
                  "></div>
                </div>
              `,
              iconSize: [0, 0],
              iconAnchor: [0, 0],
            });

            const caseMarker = L.marker([lat, lng], {
              icon: casePinIcon,
              zIndexOffset: cfg.isUrgent ? 1200 : 1000,
            });

            // Complete Address Hierarchy
            const fallback = resolveFallbackLocation(rawLat, rawLng);
            let addr = (c.location && c.location.trim()) ? c.location.trim() : '';
            if (!addr || !addr.toLowerCase().includes('kab') || !addr.toLowerCase().includes('prov')) {
              const parts: string[] = [];
              const v = (c.village || fallback.desa || '').trim();
              const d = (c.district || fallback.kecamatan || '').trim();
              let k = (c.regency || fallback.kabupaten || '').trim();
              const p = (c.province || fallback.provinsi || '').trim();

              if (k.toLowerCase() === v.toLowerCase() && d && d.toLowerCase().includes('sidoarjo')) {
                k = 'Kabupaten Sidoarjo';
              }

              if (v) parts.push(v.toLowerCase().startsWith('desa') || v.toLowerCase().startsWith('kel') || v.toLowerCase().startsWith('jalan') || v.toLowerCase().startsWith('jl') ? v : `Desa/Kel. ${v}`);
              if (d) parts.push(d.toLowerCase().startsWith('kec') ? d : `Kec. ${d}`);
              if (k) parts.push(k.toLowerCase().startsWith('kab') || k.toLowerCase().startsWith('kota') ? k : `Kab. ${k}`);
              if (p) parts.push(p.toLowerCase().startsWith('prov') ? p : `Prov. ${p}`);
              addr = parts.join(', ');
            }

            const popupHtml = `
              <div style="font-size: 12px; line-height: 1.45; min-width: 230px; max-width: 290px; padding: 2px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; border-bottom: 1px solid #eef2f0; padding-bottom: 5px;">
                  <strong style="color: ${cfg.color}; font-size: 13px; display: inline-flex; align-items: center; gap: 5px;">
                    <span style="font-size: 14px;">${cfg.icon}</span>
                    <span>${c.item || 'Titik Lokasi Laporan'}</span>
                  </strong>
                  <span style="font-size: 10px; font-weight: 700; color: ${cfg.color}; background: #f4f8f5; padding: 2px 6px; border-radius: 4px; font-family: monospace; border: 1px solid ${cfg.color}33;">${c.id}</span>
                </div>

                <div style="margin-bottom: 6px;">
                  <div style="font-size: 11px; color: #555;">Penerima Manfaat: <b>${c.kk || '1 KK'}</b> ${c.qty ? `(${c.qty})` : ''} · <span style="color: ${cfg.color}; font-weight: 600;">${c.urgency || 'Sedang'}</span></div>
                </div>

                <div style="background: #f4f8f5; border: 1px solid #dbeade; border-left: 3.5px solid ${cfg.color}; padding: 6px 9px; border-radius: 6px; margin: 6px 0;">
                  <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #2e6949; margin-bottom: 2px;">
                    Alamat Lengkap:
                  </div>
                  <div style="font-size: 12px; font-weight: 600; color: #11281c; word-break: break-word; line-height: 1.35;">
                    ${addr}
                  </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: #666; margin-top: 6px; padding-top: 4px; border-top: 1px dashed #e2e8f0;">
                  <span>Koordinat Titik:</span>
                  <span style="font-family: monospace; font-weight: 600; color: #2d3748;">${rawLat.toFixed(6)}, ${rawLng.toFixed(6)}</span>
                </div>
              </div>
            `;

            caseMarker.bindPopup(popupHtml, {
              offset: L.point(0, -32),
              maxWidth: 290,
              autoPan: true,
            });

            caseMarker.on('click', () => {
              caseMarker.openPopup();
              onSelectCase?.(c);
            });

            caseMarker.addTo(markerLayer);
          });
        });

        if (bounds.length > 0) {
          try {
            map.fitBounds(L.latLngBounds(bounds), {
              padding: [45, 45],
              maxZoom: 14,
              minZoom: 11,
            });
          } catch (e) {
            map.setView(bounds[0], 12);
          }
        }
      } else {
        const oLat = Number(initialLat);
        const oLng = Number(initialLng);
        if (Number.isFinite(oLat) && Number.isFinite(oLng)) {
          const fallback = resolveFallbackLocation(oLat, oLng);
          let rawAddr = (locationAddress && locationAddress.trim()) ? locationAddress.trim() : "";

          let resolvedAddress = "";
          if (!rawAddr) {
            resolvedAddress = `${fallback.desa}, Kec. ${fallback.kecamatan}, ${fallback.kabupaten}, Prov. ${fallback.provinsi}`;
          } else {
            const parts = rawAddr.split(',').map(s => s.trim()).filter(Boolean);
            const hasKec = parts.some(p => p.toLowerCase().includes('kec'));
            const hasKab = parts.some(p => p.toLowerCase().includes('kab') || p.toLowerCase().includes('kota'));
            const hasProv = parts.some(p => p.toLowerCase().includes('prov') || p.toLowerCase().includes('jawa') || p.toLowerCase().includes('dki') || p.toLowerCase().includes('banten') || p.toLowerCase().includes('bali'));

            const enriched: string[] = [];
            const firstPart = parts[0] || fallback.desa;
            if (firstPart) {
              const fLower = firstPart.toLowerCase();
              const fFormatted = (fLower.startsWith('desa') || fLower.startsWith('kel') || fLower.startsWith('jalan') || fLower.startsWith('jl'))
                ? firstPart
                : `Desa/Kel. ${firstPart}`;
              enriched.push(fFormatted);
            }

            if (hasKec) {
              const kecPart = parts.find(p => p.toLowerCase().includes('kec'))!;
              enriched.push(kecPart);
            } else {
              enriched.push(`Kec. ${fallback.kecamatan}`);
            }

            if (hasKab) {
              const kabPart = parts.find(p => p.toLowerCase().includes('kab') || p.toLowerCase().includes('kota'))!;
              enriched.push(kabPart);
            } else {
              const kabName = fallback.kabupaten.startsWith('Kab') || fallback.kabupaten.startsWith('Kota')
                ? fallback.kabupaten
                : `Kab. ${fallback.kabupaten}`;
              enriched.push(kabName);
            }

            if (hasProv) {
              const provPart = parts.find(p => p.toLowerCase().includes('prov') || p.toLowerCase().includes('jawa') || p.toLowerCase().includes('dki') || p.toLowerCase().includes('banten') || p.toLowerCase().includes('bali'))!;
              enriched.push(provPart.toLowerCase().startsWith('prov') ? provPart : `Prov. ${provPart}`);
            } else {
              enriched.push(`Prov. ${fallback.provinsi}`);
            }

            resolvedAddress = enriched.join(', ');
          }

          const cfg = getCategoryMarkerConfig(caseTitle || '', caseUrgency || '');

          const casePinIcon = L.divIcon({
            className: 'case-location-pin',
            html: `
              <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -100%);">
                <div style="
                  background: ${cfg.gradient};
                  color: #ffffff;
                  padding: 3px 8px 3px 6px;
                  border-radius: 20px;
                  font-size: 11px;
                  font-weight: 700;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.28), 0 1px 3px rgba(0,0,0,0.18);
                  border: 1.5px solid #ffffff;
                  white-space: nowrap;
                  display: inline-flex;
                  align-items: center;
                  gap: 4px;
                  letter-spacing: -0.2px;
                  line-height: 1.2;
                ">
                  <span style="font-size: 12px; line-height: 1;">${cfg.icon}</span>
                  <span>${cfg.shortLabel}</span>
                  ${cfg.isUrgent ? `<span style="width: 6px; height: 6px; border-radius: 50%; background: #fef08a; border: 1px solid #ffffff; display: inline-block;"></span>` : ''}
                </div>
                <div style="
                  width: 0;
                  height: 0;
                  border-left: 5px solid transparent;
                  border-right: 5px solid transparent;
                  border-top: 6px solid ${cfg.color};
                  margin-top: -1px;
                "></div>
                <div style="
                  width: 7px;
                  height: 7px;
                  border-radius: 50%;
                  background: ${cfg.color};
                  border: 1.5px solid #ffffff;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.35);
                  margin-top: -2px;
                "></div>
              </div>
            `,
            iconSize: [0, 0],
            iconAnchor: [0, 0],
          });

          const caseMarker = L.marker([oLat, oLng], {
            icon: casePinIcon,
            zIndexOffset: 1000,
          });

          const popupHtml = `
            <div style="font-size: 12px; line-height: 1.45; min-width: 230px; max-width: 290px; padding: 2px;">
              <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; border-bottom: 1px solid #eef2f0; padding-bottom: 5px;">
                <strong style="color: ${cfg.color}; font-size: 13px; display: inline-flex; align-items: center; gap: 5px;">
                  <span style="font-size: 14px;">${cfg.icon}</span>
                  <span>${caseTitle || 'Titik Lokasi Laporan'}</span>
                </strong>
                ${caseId ? `<span style="font-size: 10px; font-weight: 700; color: ${cfg.color}; background: #f4f8f5; padding: 2px 6px; border-radius: 4px; font-family: monospace; border: 1px solid ${cfg.color}33;">${caseId}</span>` : ''}
              </div>

              ${caseTitle ? `
                <div style="margin-bottom: 6px;">
                  <div style="font-size: 11px; color: #555;">Penerima Manfaat: <b>${caseKk || '1 KK'}</b></div>
                </div>
              ` : ''}

              <div style="background: #f4f8f5; border: 1px solid #dbeade; border-left: 3.5px solid ${cfg.color}; padding: 6px 9px; border-radius: 6px; margin: 6px 0;">
                <div style="font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #2e6949; margin-bottom: 2px;">
                  Alamat Lengkap:
                </div>
                <div style="font-size: 12px; font-weight: 600; color: #11281c; word-break: break-word; line-height: 1.35;">
                  ${resolvedAddress}
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: #666; margin-top: 6px; padding-top: 4px; border-top: 1px dashed #e2e8f0;">
                <span>Koordinat Titik:</span>
                <span style="font-family: monospace; font-weight: 600; color: #2d3748;">${oLat.toFixed(6)}, ${oLng.toFixed(6)}</span>
              </div>
            </div>
          `;

          caseMarker.bindPopup(popupHtml, {
            offset: L.point(0, -36),
            maxWidth: 290,
            autoPan: true,
          });

          caseMarker.on('click', () => {
            caseMarker.openPopup();
          });

          caseMarker.addTo(markerLayer);
          map.setView([oLat, oLng], 15);
        }
      }
    }

    // Route if active delivery mission
    if (showRoute) {
      const routePoints: [number, number][] = [
        [-6.9385, 106.9100],
        [-6.9290, 106.9200],
        [-6.9174639, 106.9298281],
      ];

      L.polyline(routePoints, {
        color: '#013220',
        weight: 4,
        dashArray: '6, 6',
        opacity: 0.85,
      }).addTo(markerLayer);

      const truckIcon = L.divIcon({
        className: 'truck-marker',
        html: `<div style="font-size: 20px;">🚚</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      L.marker([-6.9290, 106.9200], { icon: truckIcon })
        .bindPopup('<b>Armada Tangki BPBD</b>')
        .addTo(markerLayer);
    }

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

  }, [poskos, activePosko, operational, showRoute, pickLocation, citizenPos, activeAddress, initialLat, initialLng, locationAddress, caseTitle, caseId, caseKk, caseUrgency, cases, onSelectCase, updateCitizenLocation]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {/* SEARCH BAR (Google Maps Style) */}
      {pickLocation && (
        <div style={{ position: 'relative', width: '100%' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '6px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <span style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#52755e',
                display: 'inline-flex',
                alignItems: 'center',
                pointerEvents: 'none'
              }}>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
                </svg>
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ketik nama jalan, desa, kelurahan, kecamatan, atau kota..."
                style={{
                  width: '100%',
                  padding: '10px 14px 10px 38px',
                  borderRadius: '10px',
                  border: '1.5px solid #c2d4c5',
                  fontSize: '0.88rem',
                  outline: 'none',
                  background: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                  color: '#1a3320',
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              style={{
                padding: '10px 18px',
                background: '#013220',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                whiteSpace: 'nowrap',
              }}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" />
              </svg>
              <span>{isSearching ? 'Mencari...' : 'Cari Titik'}</span>
            </button>
          </form>

          {/* SEARCH AUTOCOMPLETE DROPDOWN */}
          {showSearchDropdown && searchResults.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '4px',
              background: '#ffffff',
              borderRadius: '10px',
              boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
              border: '1px solid #d4dfd6',
              zIndex: 2000,
              overflow: 'hidden',
              maxHeight: '220px',
              overflowY: 'auto',
            }}>
              {searchResults.map((item, idx) => {
                const name = item.properties?.name || item.properties?.city || 'Lokasi Terpilih';
                const state = item.properties?.state || item.properties?.country || 'Indonesia';
                return (
                  <div
                    key={idx}
                    onClick={() => selectSearchResult(item)}
                    style={{
                      padding: '10px 14px',
                      borderBottom: '1px solid #f0f0f0',
                      cursor: 'pointer',
                      fontSize: '0.84rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: '#013220',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#f2f7f3')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                  >
                    <span style={{ display: 'inline-flex', color: '#52755e', flexShrink: 0 }}>
                      <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                        <circle cx="12" cy="10" r="2.5" />
                      </svg>
                    </span>
                    <div>
                      <strong style={{ display: 'block' }}>{name}</strong>
                      <small style={{ color: '#6a7369' }}>{state}</small>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* MAP CONTAINER */}
      <div style={{ 
        position: 'relative', 
        width: '100%', 
        borderRadius: '16px', 
        overflow: 'hidden', 
        border: '1.5px solid #d4dfd6', 
        boxShadow: '0 4px 14px rgba(0,0,0,0.06)' 
      }}>
        {/* MAP CANVAS */}
        <div 
          ref={mapContainerRef} 
          style={{ width: '100%', height: operational ? '380px' : '340px', background: '#e5e3df' }} 
        />

        {/* GOOGLE MAPS FLOATING "MY LOCATION" GPS BUTTON (Top Right) */}
        {pickLocation && (
          <button
            type="button"
            title="Deteksi Lokasi GPS Saya Saat Ini"
            onClick={handleGPSButtonClick}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 1000,
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#ffffff',
              color: '#1a73e8',
              border: 'none',
              boxShadow: '0 3px 12px rgba(0,0,0,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            {isLocating ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#013220" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin 1s linear infinite' }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#013220" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="7" />
                <line x1="12" y1="1" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="23" />
                <line x1="1" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="23" y2="12" />
                <circle cx="12" cy="12" r="2.5" fill="#013220" />
              </svg>
            )}
          </button>
        )}

        {/* FLOATING MINI LOCATION BADGE (Top Left) */}
        {pickLocation && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(6px)',
            padding: '6px 14px',
            borderRadius: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.82rem',
            fontWeight: 700,
            color: '#013220',
            border: '1px solid #d4dfd6',
            maxWidth: 'calc(100% - 75px)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            <span style={{ display: 'inline-flex', width: '15px', height: '15px', color: '#013220', flexShrink: 0 }}>
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
            </span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{activeAddress}</span>
          </div>
        )}

        {/* DEDICATED ZOOM IN (+) AND ZOOM OUT (-) CONTROLS */}
        <div style={{
          position: 'absolute',
          top: pickLocation ? '64px' : '14px',
          right: '14px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
          border: '1.5px solid rgba(1,50,32,0.18)',
          overflow: 'hidden',
        }}>
          <button
            type="button"
            title="Perbesar Peta (Zoom In +)"
            aria-label="Zoom In"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              mapInstanceRef.current?.zoomIn();
            }}
            style={{
              width: '38px',
              height: '38px',
              border: 'none',
              background: '#ffffff',
              color: '#013220',
              fontSize: '22px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderBottom: '1px solid #e2ded4',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            +
          </button>
          <button
            type="button"
            title="Perkecil Peta (Zoom Out -)"
            aria-label="Zoom Out"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              mapInstanceRef.current?.zoomOut();
            }}
            style={{
              width: '38px',
              height: '38px',
              border: 'none',
              background: '#ffffff',
              color: '#013220',
              fontSize: '24px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1,
              userSelect: 'none',
            }}
          >
            −
          </button>
        </div>

        {/* OPERATIONAL MAP LEGEND */}
        {operational && Array.isArray(cases) && cases.length > 0 && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            left: '12px',
            zIndex: 1000,
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(6px)',
            borderRadius: '10px',
            padding: '5px 9px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.18)',
            border: '1px solid rgba(1,50,32,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '10.5px',
            fontWeight: 700,
            flexWrap: 'wrap',
            maxWidth: 'calc(100% - 24px)',
          }}>
            <span style={{ color: '#013220', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '11px' }}>🏛️</span> Posko
            </span>
            <span style={{ width: '1px', height: '11px', background: '#d1d5db' }} />
            <span style={{ color: '#0284c7', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '11px' }}>💧</span> Air Bersih
            </span>
            <span style={{ color: '#ea580c', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '11px' }}>👕</span> Sandang
            </span>
            <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '11px' }}>🍚</span> Pangan
            </span>
            <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '11px' }}>💊</span> Medis
            </span>
            <span style={{ color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span style={{ fontSize: '11px' }}>⛺</span> Hunian
            </span>
          </div>
        )}

        {/* OVERLAY CARD FOR POSKO */}
        {!hideCard && activePosko && (
          <div className="leaflet-overlay-card">
            <div className="overlay-card-header">
              <span className="overlay-posko-badge">
                <i className="status-live-dot" /> {activePosko.kode_posko}
              </span>
              <span className="overlay-status-tag">{activePosko.status_operasional}</span>
            </div>
            <h3>{activePosko.nama_posko}</h3>
            <div className="overlay-meta">
              <span><b>{activePosko.kk_terdata}</b> KK Terdata</span>
              <span>Kapasitas: <b>{activePosko.kapasitas_kk}</b> KK</span>
            </div>
            <small className="overlay-location">{activePosko.desa}, Kec. ${activePosko.kecamatan}</small>
          </div>
        )}
      </div>

      {pickLocation && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#2e774f', fontWeight: 600, padding: '0 4px' }}>
          <span>✓</span>
          <span>Titik lokasi telah otomatis tersinkronisasi ke bidang formulir di atas (Provinsi, Kab/Kota, Kecamatan, Desa, dan Posko BPBD).</span>
        </div>
      )}
    </div>
  );
}
