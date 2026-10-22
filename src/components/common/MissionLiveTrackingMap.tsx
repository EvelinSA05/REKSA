import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { MisiItem } from '../../services/api';
import { AppIcon } from './Icons';

interface MissionLiveTrackingMapProps {
  mission: MisiItem;
  height?: string;
  onReportObstacle?: () => void;
  showFullscreenButton?: boolean;
  className?: string;
}

interface LatLngPoint {
  lat: number;
  lng: number;
}

// Helper to calculate distance in km between two lat/lng points using Haversine formula
function calculateHaversineDistance(p1: LatLngPoint, p2: LatLngPoint): number {
  const R = 6371; // Earth radius in km
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.lat * Math.PI) / 180) *
      Math.cos((p2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Calculate compass bearing in degrees
function calculateBearing(p1: LatLngPoint, p2: LatLngPoint): number {
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

export function MissionLiveTrackingMap({
  mission,
  height = '440px',
  onReportObstacle,
  className = '',
}: MissionLiveTrackingMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    poskoMarker?: L.Marker;
    destMarker?: L.Marker;
    fleetMarker?: L.Marker;
    obstacleMarker?: L.Marker;
    traveledPolyline?: L.Polyline;
    remainingPolyline?: L.Polyline;
  }>({});

  // Tracking Modes:
  // 'stage' = Real-time Workflow Tracking (posisi mobil mengikuti tahapan operasional lapangan resmi)
  // 'device_gps' = Live Smartphone / Laptop GPS Geolocation
  // 'sim' = Interactive Simulated Driving Demo
  const [trackingSource, setTrackingSource] = useState<'stage' | 'device_gps' | 'sim'>('stage');
  const [devicePos, setDevicePos] = useState<LatLngPoint | null>(null);
  const [deviceBreadcrumbs, setDeviceBreadcrumbs] = useState<LatLngPoint[]>([]);
  const [deviceBearing, setDeviceBearing] = useState<number>(0);
  const [isLocatingDevice, setIsLocatingDevice] = useState<boolean>(false);
  const [deviceGpsError, setDeviceGpsError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [transitProgress, setTransitProgress] = useState<number>(0.50);
  const [isSimRunning, setIsSimRunning] = useState<boolean>(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(3); // ±3 meters
  const [satelliteCount, setSatelliteCount] = useState<number>(14);
  const [lastPingTime, setLastPingTime] = useState<string>('Baru saja');
  const [tileMode, setTileMode] = useState<'streets' | 'satellite'>('streets');
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // OSRM Real Road Geometry States (Jalur navigasi jalanan nyata seperti Gojek/Google Maps)
  const [osrmRoutePoints, setOsrmRoutePoints] = useState<LatLngPoint[]>([]);
  const [osrmDistanceKm, setOsrmDistanceKm] = useState<number | null>(null);
  const [osrmDurationMins, setOsrmDurationMins] = useState<number | null>(null);
  const hasAutoFitBoundsRef = useRef<boolean>(false);

  // 1. Resolve Origin (Posko) and Destination (Citizen / Case) Coordinates
  const { origin, destination, poskoLabel, destLabel } = useMemo(() => {
    // Default Posko Sidoarjo / Surabaya if not set
    const defaultPoskoLat = -7.437581;
    const defaultPoskoLng = 112.703873;

    let oLat = Number(mission.posko?.latitude);
    let oLng = Number(mission.posko?.longitude);

    if (!Number.isFinite(oLat) || !Number.isFinite(oLng) || (oLat === 0 && oLng === 0)) {
      oLat = defaultPoskoLat;
      oLng = defaultPoskoLng;
    }

    let dLat = Number(mission.kebutuhan?.latitude);
    let dLng = Number(mission.kebutuhan?.longitude);

    // If destination is missing or identical to origin, create a realistic nearby delivery point (~3.2 km)
    if (
      !Number.isFinite(dLat) ||
      !Number.isFinite(dLng) ||
      (dLat === 0 && dLng === 0) ||
      (Math.abs(dLat - oLat) < 0.0001 && Math.abs(dLng - oLng) < 0.0001)
    ) {
      dLat = oLat + 0.0165;
      dLng = oLng + 0.0210;
    }

    const poskoName =
      mission.posko?.nama_posko ||
      'Posko Induk Penanggulangan Bencana BPBD';

    const citizenDest = mission.kebutuhan
      ? `${mission.kebutuhan.citizen_name || 'Keluarga Penerima'} (${mission.kebutuhan.desa || 'Desa Terdampak'}, Kec. ${mission.kebutuhan.kecamatan || 'Sidoarjo'})`
      : 'Titik Pos Pengungsi / Lokasi Warga Bencana';

    return {
      origin: { lat: oLat, lng: oLng },
      destination: { lat: dLat, lng: dLng },
      poskoLabel: poskoName,
      destLabel: citizenDest,
    };
  }, [mission]);

  // Fetch real road turn-by-turn routing from OSRM (mengikuti kontur dan kelokan jalan OpenStreetMap asli)
  useEffect(() => {
    let isCancelled = false;
    const fetchOsrmRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        if (!isCancelled && data.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates?.length > 1) {
          let coords: LatLngPoint[] = data.routes[0].geometry.coordinates.map((c: [number, number]) => ({
            lat: c[1],
            lng: c[0],
          }));

          // 1. Pastikan titik awal menyambung tepat di titik POSKO ASAL
          const firstPoint = coords[0];
          if (!firstPoint || calculateHaversineDistance(origin, firstPoint) > 0.001) {
            coords = [{ lat: origin.lat, lng: origin.lng }, ...coords];
          } else {
            coords[0] = { lat: origin.lat, lng: origin.lng };
          }

          // 2. Pastikan titik akhir menyambung tepat ke PIN TITIK PENERIMA (menghubungkan jalan ke rumah warga)
          const lastPoint = coords[coords.length - 1];
          if (!lastPoint || calculateHaversineDistance(lastPoint, destination) > 0.001) {
            coords = [...coords, { lat: destination.lat, lng: destination.lng }];
          } else {
            coords[coords.length - 1] = { lat: destination.lat, lng: destination.lng };
          }

          setOsrmRoutePoints(coords);
          if (data.routes[0].distance) {
            setOsrmDistanceKm(Number((data.routes[0].distance / 1000).toFixed(1)));
          }
          if (data.routes[0].duration) {
            setOsrmDurationMins(Math.max(1, Math.round(data.routes[0].duration / 60)));
          }
        }
      } catch (err) {
        console.warn('Gagal memuat rute jalanan OSRM:', err);
      }
    };

    fetchOsrmRoute();
    return () => {
      isCancelled = true;
    };
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  // 2. Generate Realistic Road Waypoints between Origin and Destination
  // Menggunakan rute navigasi jalanan nyata yang meliuk-liuk mengikuti jalan raya, gang, dan simpang
  const routeWaypoints: LatLngPoint[] = useMemo(() => {
    if (osrmRoutePoints && osrmRoutePoints.length >= 2) {
      return osrmRoutePoints;
    }

    const oLat = origin.lat;
    const oLng = origin.lng;
    const dLat = destination.lat;
    const dLng = destination.lng;

    const latDiff = dLat - oLat;
    const lngDiff = dLng - oLng;

    // Fallback interpolasi sementara saat jaringan OSRM sedang dimuat
    return [
      { lat: oLat, lng: oLng },
      { lat: oLat + latDiff * 0.08, lng: oLng + lngDiff * 0.03 },
      { lat: oLat + latDiff * 0.22, lng: oLng + lngDiff * 0.12 },
      { lat: oLat + latDiff * 0.38, lng: oLng + lngDiff * 0.28 },
      { lat: oLat + latDiff * 0.54, lng: oLng + lngDiff * 0.52 },
      { lat: oLat + latDiff * 0.68, lng: oLng + lngDiff * 0.70 },
      { lat: oLat + latDiff * 0.82, lng: oLng + lngDiff * 0.86 },
      { lat: oLat + latDiff * 0.94, lng: oLng + lngDiff * 0.96 },
      { lat: dLat, lng: dLng },
    ];
  }, [origin, destination, osrmRoutePoints]);

  // Calculate cumulative distances along route
  const { totalDistanceKm, cumulativeDistances } = useMemo(() => {
    let total = 0;
    const cum: number[] = [0];
    for (let i = 0; i < routeWaypoints.length - 1; i++) {
      const d = calculateHaversineDistance(routeWaypoints[i], routeWaypoints[i + 1]);
      total += d;
      cum.push(total);
    }
    const finalDist = osrmDistanceKm || Math.max(total, 0.5);
    return { totalDistanceKm: finalDist, cumulativeDistances: cum };
  }, [routeWaypoints, osrmDistanceKm]);

  // Interpolate lat/lng & bearing along route given a 0.0 - 1.0 progress ratio
  const getInterpolatedPosition = useCallback(
    (progress: number): { point: LatLngPoint; bearing: number; segmentIndex: number } => {
      const clamped = Math.max(0, Math.min(1, progress));
      const targetDist = clamped * totalDistanceKm;

      // Find segment
      let segIdx = 0;
      for (let i = 0; i < cumulativeDistances.length - 1; i++) {
        if (targetDist >= cumulativeDistances[i] && targetDist <= cumulativeDistances[i + 1]) {
          segIdx = i;
          break;
        }
        if (i === cumulativeDistances.length - 2) {
          segIdx = i;
        }
      }

      const p1 = routeWaypoints[segIdx];
      const p2 = routeWaypoints[segIdx + 1] || routeWaypoints[segIdx];
      const segStartDist = cumulativeDistances[segIdx];
      const segEndDist = cumulativeDistances[segIdx + 1] || segStartDist + 0.001;
      const segSpan = Math.max(segEndDist - segStartDist, 0.0001);
      const segRatio = Math.max(0, Math.min(1, (targetDist - segStartDist) / segSpan));

      const lat = p1.lat + (p2.lat - p1.lat) * segRatio;
      const lng = p1.lng + (p2.lng - p1.lng) * segRatio;
      const bearing = calculateBearing(p1, p2);

      return { point: { lat, lng }, bearing, segmentIndex: segIdx };
    },
    [totalDistanceKm, cumulativeDistances, routeWaypoints]
  );

  // 3. Status mapping
  const statusStage = mission.status_tahapan || 'Diterima';
  const isStandby = statusStage === 'Menunggu Persiapan' || statusStage === 'Diterima' || statusStage === 'Baru';
  const isReady = statusStage === 'Siap Berangkat' || statusStage === 'Disiapkan';
  const isInTransit = statusStage === 'Dalam Perjalanan' || statusStage === 'Dalam Pengiriman';
  const isArrived = statusStage === 'Tiba di Lokasi & Diserahkan' || statusStage === 'Tiba di Lokasi';
  const isConfirming = statusStage === 'Menunggu Konfirmasi' || statusStage === 'Menunggu Konfirmasi Penerimaan';
  const isFinished = statusStage === 'Selesai';

  // Base progress based on stage vs simulation
  const effectiveProgress = useMemo(() => {
    // If user is running active simulated drive demo
    if (trackingSource === 'sim') {
      return transitProgress;
    }
    // Workflow stage mapping:
    // If not departed yet (Tahap 1 & 2): STRICTLY 0.0 (Stay at origin Posko)
    if (isStandby) return 0.0;
    if (isReady) return 0.05; // At Posko departure gate
    if (isInTransit) return 0.50; // Active transit midpoint
    if (isArrived || isConfirming || isFinished) return 1.0;
    return 0.0;
  }, [trackingSource, transitProgress, isStandby, isReady, isInTransit, isArrived, isConfirming, isFinished]);

  // Update speed according to stage & mode
  useEffect(() => {
    if (trackingSource === 'device_gps') {
      // Speed handled by device geolocation
      return;
    }
    if (trackingSource === 'sim' && isSimRunning) {
      setCurrentSpeed(42);
      return;
    }

    if (isStandby || isReady) {
      setCurrentSpeed(0); // Parked at Posko
    } else if (isInTransit) {
      setCurrentSpeed(38);
    } else if (isArrived || isConfirming || isFinished) {
      setCurrentSpeed(0); // Parked at destination
    }
  }, [trackingSource, isSimRunning, isStandby, isReady, isInTransit, isArrived, isConfirming, isFinished]);

  // Dynamic simulation tick (ONLY when user explicitly runs 'sim' mode)
  useEffect(() => {
    if (trackingSource !== 'sim' || !isSimRunning) return;

    const interval = window.setInterval(() => {
      setTransitProgress((prev) => {
        const next = prev + 0.015;
        if (next >= 0.95) {
          setIsSimRunning(false);
          return 0.95;
        }
        return next;
      });

      setCurrentSpeed(Math.floor(36 + Math.random() * 8));
      const now = new Date();
      setLastPingTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} WIB`);
    }, 2000);

    return () => clearInterval(interval);
  }, [trackingSource, isSimRunning]);

  // Toggle Live Smartphone / Device GPS Tracking
  const handleToggleDeviceGps = useCallback(() => {
    if (trackingSource === 'device_gps') {
      // Disconnect device GPS
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setTrackingSource('stage');
      setDeviceGpsError(null);
      return;
    }

    if (!navigator.geolocation) {
      setDeviceGpsError('Browser/perangkat Anda tidak mendukung fitur HTML5 Geolocation.');
      return;
    }

    setIsLocatingDevice(true);
    setDeviceGpsError(null);

    // Initial instant position query
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingDevice(false);
        const p: LatLngPoint = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        setDevicePos(p);
        setDeviceBreadcrumbs([p]);
        setGpsAccuracy(Math.round(pos.coords.accuracy || 3));
        setTrackingSource('device_gps');
        if (pos.coords.speed !== null && pos.coords.speed > 0) {
          setCurrentSpeed(Math.round(pos.coords.speed * 3.6));
        } else {
          setCurrentSpeed(0);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([p.lat, p.lng], 16, { animate: true });
        }
      },
      (err) => {
        setIsLocatingDevice(false);
        setDeviceGpsError(`Izin GPS tidak diberikan atau gagal mendeteksi sinyal satelit: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    // Watch position continuously as vehicle moves
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const p: LatLngPoint = {
          lat: Number(pos.coords.latitude.toFixed(6)),
          lng: Number(pos.coords.longitude.toFixed(6)),
        };
        setDevicePos((prevPos) => {
          if (prevPos) {
            const brng = calculateBearing(prevPos, p);
            if (brng > 0) setDeviceBearing(brng);
          }
          return p;
        });
        setDeviceBreadcrumbs((prev) => {
          if (prev.length === 0) return [p];
          const last = prev[prev.length - 1];
          const dist = calculateHaversineDistance(last, p);
          // Only append if moved > 5 meters
          if (dist > 0.005) {
            return [...prev, p];
          }
          return prev;
        });
        setGpsAccuracy(Math.round(pos.coords.accuracy || 3));
        if (pos.coords.speed !== null && pos.coords.speed > 0) {
          setCurrentSpeed(Math.round(pos.coords.speed * 3.6));
        }
        const now = new Date();
        setLastPingTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} WIB`);
      },
      (err) => {
        console.warn('GPS continuous watch notice', err);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 2000 }
    );

    watchIdRef.current = watchId;
  }, [trackingSource]);

  // Clean up device GPS watcher on component unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Current interpolated fleet position & bearing
  const { point: fleetPos, bearing: fleetBearing } = useMemo(() => {
    if (trackingSource === 'device_gps' && devicePos) {
      return { point: devicePos, bearing: deviceBearing, segmentIndex: 0 };
    }
    return getInterpolatedPosition(effectiveProgress);
  }, [trackingSource, devicePos, deviceBearing, getInterpolatedPosition, effectiveProgress]);

  // Distance metrics
  const remainingDistanceKm = useMemo(() => {
    if (isArrived || isConfirming || isFinished) return 0;
    if (trackingSource === 'device_gps' && devicePos) {
      return Number(calculateHaversineDistance(devicePos, destination).toFixed(1));
    }
    if (isStandby) return Number(totalDistanceKm.toFixed(1));
    return Math.max(0, Number((totalDistanceKm * (1 - effectiveProgress)).toFixed(1)));
  }, [totalDistanceKm, effectiveProgress, isArrived, isConfirming, isFinished, isStandby, trackingSource, devicePos, destination]);

  // ETA calculation
  const etaMinutes = useMemo(() => {
    if (isArrived || isConfirming || isFinished) return 'Tiba di Lokasi';
    if (isStandby) {
      if (osrmDurationMins) return `~${osrmDurationMins} Menit (Siaga di Posko)`;
      return 'Belum Berangkat (Siaga di Posko)';
    }
    if (isReady) return '~15 Menit (Siaga Gerbang)';
    const spd = currentSpeed > 0 ? currentSpeed : 40;
    const mins = Math.max(1, Math.round((remainingDistanceKm / spd) * 60));
    return `${mins} Menit`;
  }, [isArrived, isConfirming, isFinished, isStandby, isReady, currentSpeed, remainingDistanceKm, osrmDurationMins]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id && !mapInstanceRef.current) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [fleetPos.lat, fleetPos.lng],
        zoom: 14,
        zoomControl: false,
        scrollWheelZoom: true,
      });

      const tileUrl =
        tileMode === 'streets'
          ? 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
          : 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

      const tileLayer = L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap contributors / Esri Satellite',
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;
      L.control.zoom({ position: 'topright' }).addTo(map);
      mapInstanceRef.current = map;
    }

    // Reaktif ganti layer tiles seketika saat tombol ditekan
    if (tileLayerRef.current) {
      const activeUrl =
        tileMode === 'satellite'
          ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          : 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
      tileLayerRef.current.setUrl(activeUrl);
    }

    const map = mapInstanceRef.current;
    if (!map) return;

    // 1. Origin Posko Marker
    const poskoIconHtml = `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #013220;
        border: 2px solid #ffffff;
        color: #ffffff;
        box-shadow: 0 3px 10px rgba(1, 50, 32, 0.4);
      ">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
        <div style="
          position: absolute;
          top: -20px;
          background: #013220;
          color: #ffffff;
          font-size: 9px;
          font-weight: 700;
          padding: 1.5px 6px;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          letter-spacing: 0.02em;
          pointer-events: none;
        ">
          Posko
        </div>
      </div>
    `;

    const poskoIcon = L.divIcon({
      className: 'tracking-posko-icon',
      html: poskoIconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (!layersRef.current.poskoMarker) {
      const pm = L.marker([origin.lat, origin.lng], { icon: poskoIcon })
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; min-width: 200px; padding: 4px;">
            <div style="font-weight: 800; color: #013220; font-size: 13px; margin-bottom: 4px;">${poskoLabel}</div>
            <div style="color: #64748b; font-size: 11px;">Titik Awal Keberangkatan Logistik Bencana</div>
            <div style="margin-top: 6px; font-weight: 700; color: #15803d; font-size: 11px;">Muatan: ${mission.muatan}</div>
          </div>
        `)
        .addTo(map);
      layersRef.current.poskoMarker = pm;
    } else {
      layersRef.current.poskoMarker.setLatLng([origin.lat, origin.lng]);
    }

    // 2. Destination Marker
    const destIconHtml = `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #dc2626;
        border: 2px solid #ffffff;
        color: #ffffff;
        box-shadow: 0 3px 10px rgba(220, 38, 38, 0.45);
      ">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
        <div style="
          position: absolute;
          top: -20px;
          background: #dc2626;
          color: #ffffff;
          font-size: 9px;
          font-weight: 700;
          padding: 1.5px 6px;
          border-radius: 4px;
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          letter-spacing: 0.02em;
          pointer-events: none;
        ">
          Tujuan
        </div>
      </div>
    `;

    const destIcon = L.divIcon({
      className: 'tracking-dest-icon',
      html: destIconHtml,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (!layersRef.current.destMarker) {
      const dm = L.marker([destination.lat, destination.lng], { icon: destIcon })
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; min-width: 220px; padding: 4px;">
            <div style="font-weight: 800; color: #991b1b; font-size: 13px; margin-bottom: 4px;">${destLabel}</div>
            <div style="color: #64748b; font-size: 11px;">Alamat Penerima Bantuan Sembako & Logistik</div>
            <div style="margin-top: 6px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 4px 8px; font-weight: 700; color: #991b1b; font-size: 11px;">
              Target: ${mission.muatan}
            </div>
          </div>
        `)
        .addTo(map);
      layersRef.current.destMarker = dm;
    } else {
      layersRef.current.destMarker.setLatLng([destination.lat, destination.lng]);
    }

    // 3. Polylines: Traveled (solid green) vs Remaining (dashed)
    const traveledPoints: [number, number][] = [];
    const remainingPoints: [number, number][] = [];

    if (trackingSource === 'device_gps') {
      // Hanya gambar jejak hijau solid jika perangkat benar-benar sudah bergerak (ada riwayat > 1 titik)
      if (deviceBreadcrumbs.length >= 2) {
        for (const pt of deviceBreadcrumbs) {
          traveledPoints.push([pt.lat, pt.lng]);
        }
      }
      // Jalur rencana resmi misi tetap mengikuti lintasan jalan dari Posko ke Titik Penerima
      for (const wp of routeWaypoints) {
        remainingPoints.push([wp.lat, wp.lng]);
      }
    } else {
      if (isStandby) {
        // Belum berangkat: Belum ada jalur yang telah dilalui (traveled = [])
        // Seluruh rute adalah rencana perjalanan dari Posko ke Tujuan mengikuti jalan raya
        for (const wp of routeWaypoints) {
          remainingPoints.push([wp.lat, wp.lng]);
        }
      } else if (isArrived || isConfirming || isFinished) {
        // Tiba / Selesai: Seluruh rute telah dilalui tuntas
        for (const wp of routeWaypoints) {
          traveledPoints.push([wp.lat, wp.lng]);
        }
      } else {
        // Sedang dalam perjalanan (In transit):
        const { segmentIndex } = getInterpolatedPosition(effectiveProgress);

        for (let i = 0; i <= segmentIndex; i++) {
          traveledPoints.push([routeWaypoints[i].lat, routeWaypoints[i].lng]);
        }
        traveledPoints.push([fleetPos.lat, fleetPos.lng]);

        remainingPoints.push([fleetPos.lat, fleetPos.lng]);
        for (let i = segmentIndex + 1; i < routeWaypoints.length; i++) {
          remainingPoints.push([routeWaypoints[i].lat, routeWaypoints[i].lng]);
        }
      }
    }

    // Traveled line: hanya digambar jika minimal 2 titik telah dilalui (garis hijau tua solid)
    if (traveledPoints.length >= 2) {
      if (!layersRef.current.traveledPolyline) {
        layersRef.current.traveledPolyline = L.polyline(traveledPoints, {
          color: '#013220',
          weight: 6,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
      } else {
        layersRef.current.traveledPolyline.setLatLngs(traveledPoints);
        layersRef.current.traveledPolyline.setStyle({
          color: '#013220',
          weight: 6,
          opacity: 0.95,
          dashArray: '',
        });
      }
    } else if (layersRef.current.traveledPolyline) {
      layersRef.current.traveledPolyline.setLatLngs([]);
    }

    // Remaining / planned line: garis hijau solid tegas (tanpa putus-putus, meliuk-liuk sesuai jalanan asli)
    if (remainingPoints.length >= 2) {
      if (!layersRef.current.remainingPolyline) {
        layersRef.current.remainingPolyline = L.polyline(remainingPoints, {
          color: '#16a34a',
          weight: 6,
          opacity: 0.92,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(map);
      } else {
        layersRef.current.remainingPolyline.setLatLngs(remainingPoints);
        layersRef.current.remainingPolyline.setStyle({
          color: '#16a34a',
          weight: 6,
          opacity: 0.92,
          dashArray: '',
        });
      }
    } else if (layersRef.current.remainingPolyline) {
      layersRef.current.remainingPolyline.setLatLngs([]);
    }

    // 4. Moving Fleet Marker with Radar Pulsing Ring & Heading Orientation
    const isMoving = currentSpeed > 0 || isSimRunning;
    const shortPlate = (mission.kode_misi || 'Armada').replace(/^MISI-ASG-?/i, 'Misi ');
    const truckIconHtml = `
      <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing Radar Halo Ring (Aktif saat armada bergerak) -->
        ${
          isMoving
            ? `<div style="
                position: absolute;
                width: 44px;
                height: 44px;
                border-radius: 50%;
                background: rgba(22, 163, 74, 0.22);
                border: 1.5px solid #16a34a;
                animation: fleet-pulse 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
              "></div>`
            : ''
        }

        <!-- Fleet Vehicle Core Badge -->
        <div style="
          position: relative;
          z-index: 2;
          width: 32px;
          height: 32px;
          border-radius: 10px;
          background: #013220;
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 3px 12px rgba(1, 50, 32, 0.45);
          transform: rotate(${isMoving ? Math.round(fleetBearing - 90) : 0}deg);
          transition: transform 0.4s ease;
        ">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>
            <path d="M15 18H9"/>
            <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14v10"/>
            <circle cx="17" cy="18.5" r="2.5"/>
            <circle cx="6.5" cy="18.5" r="2.5"/>
          </svg>
        </div>

        <!-- Floating Live Plate Tag -->
        <div style="
          position: absolute;
          bottom: -18px;
          background: #0f172a;
          color: #ffffff;
          font-size: 8.5px;
          font-weight: 700;
          padding: 1.5px 5px;
          border-radius: 4px;
          white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 3.5px;
          z-index: 3;
          pointer-events: none;
        ">
          <span style="width: 5px; height: 5px; border-radius: 50%; background: ${isMoving ? '#22c55e' : '#94a3b8'}; display: inline-block;"></span>
          <span>${shortPlate}</span>
        </div>
      </div>
    `;

    const truckIcon = L.divIcon({
      className: 'tracking-fleet-icon',
      html: truckIconHtml,
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const popupHtml = `
      <div style="font-family: inherit; font-size: 12px; min-width: 240px; padding: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 800; font-family: monospace; font-size: 11px; background: #013220; color: #fff; padding: 2px 8px; border-radius: 4px;">
            ${mission.kode_misi}
          </span>
          <span style="font-size: 10.5px; font-weight: 700; color: ${isMoving ? '#15803d' : '#475569'}; background: ${isMoving ? '#f0fdf4' : '#f1f5f9'}; border: 1px solid ${isMoving ? '#bbf7d0' : '#cbd5e1'}; padding: 2px 6px; border-radius: 4px;">
            ● ${trackingSource === 'device_gps' ? 'GPS HP AKTIF' : isMoving ? 'BERGERAK' : 'STANDBY'}
          </span>
        </div>
        <div style="font-size: 13px; font-weight: 800; color: #0f172a; margin-bottom: 2px;">
          ${mission.armada_info || 'Armada Logistik Darurat'}
        </div>
        <div style="font-size: 11.5px; color: #475569; margin-bottom: 8px;">
          Pengemudi / PIC: <strong>${mission.responder_name}</strong> (${mission.organisasi})
        </div>
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px;">
          <div>
            <span style="color: #64748b; display: block; font-size: 10px;">Status Posisi</span>
            <strong style="color: #013220; font-size: 12px;">${isStandby ? 'Parkir Posko' : isReady ? 'Siaga Gerbang' : isMoving ? `${currentSpeed} km/jam` : 'Tiba'}</strong>
          </div>
          <div>
            <span style="color: #64748b; display: block; font-size: 10px;">Estimasi Tiba (ETA)</span>
            <strong style="color: #15803d; font-size: 12px;">${etaMinutes}</strong>
          </div>
          <div>
            <span style="color: #64748b; display: block; font-size: 10px;">Sisa Jarak</span>
            <strong style="color: #0f172a; font-size: 12px;">${remainingDistanceKm} km</strong>
          </div>
          <div>
            <span style="color: #64748b; display: block; font-size: 10px;">Sumber Posisi</span>
            <strong style="color: #0f172a; font-size: 11px;">${trackingSource === 'device_gps' ? 'GPS Ponsel' : 'Workflow Tahapan'}</strong>
          </div>
        </div>
        <div style="font-size: 10px; color: #94a3b8; text-align: right;">
          Update terakhir: ${lastPingTime}
        </div>
      </div>
    `;

    if (!layersRef.current.fleetMarker) {
      const fm = L.marker([fleetPos.lat, fleetPos.lng], { icon: truckIcon })
        .bindPopup(popupHtml)
        .addTo(map);
      layersRef.current.fleetMarker = fm;
    } else {
      layersRef.current.fleetMarker.setLatLng([fleetPos.lat, fleetPos.lng]);
      layersRef.current.fleetMarker.setIcon(truckIcon);
      layersRef.current.fleetMarker.setPopupContent(popupHtml);
    }

    // 5. Obstacle marker if reported
    if (mission.status_kendala) {
      const obstaclePos = routeWaypoints[Math.min(4, routeWaypoints.length - 2)];
      const obsIconHtml = `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #ef4444;
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 15px;
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.5);
          animation: bounce 1.2s infinite alternate;
        ">
          ⚠️
        </div>
      `;
      const obsIcon = L.divIcon({
        className: 'tracking-obstacle-icon',
        html: obsIconHtml,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      if (!layersRef.current.obstacleMarker) {
        const om = L.marker([obstaclePos.lat, obstaclePos.lng], { icon: obsIcon })
          .bindPopup(`
            <div style="font-family: inherit; font-size: 12px; min-width: 200px; padding: 4px;">
              <div style="color: #b91c1c; font-weight: 800; font-size: 12px; margin-bottom: 2px;">
                ⚠️ LAPORAN KENDALA: [${mission.status_kendala}]
              </div>
              <p style="margin: 4px 0 0; color: #4b5563; font-size: 11px;">
                ${mission.catatan_lapangan || 'Hambatan jalur logistik di lokasi bencana.'}
              </p>
            </div>
          `)
          .addTo(map);
        layersRef.current.obstacleMarker = om;
      }
    } else if (layersRef.current.obstacleMarker) {
      map.removeLayer(layersRef.current.obstacleMarker);
      layersRef.current.obstacleMarker = undefined;
    }
  }, [
    origin,
    destination,
    poskoLabel,
    destLabel,
    routeWaypoints,
    fleetPos,
    fleetBearing,
    effectiveProgress,
    currentSpeed,
    etaMinutes,
    remainingDistanceKm,
    satelliteCount,
    lastPingTime,
    tileMode,
    mission,
    isStandby,
    isReady,
    trackingSource,
    isSimRunning,
    getInterpolatedPosition,
  ]);

  // Auto-fit camera ke seluruh jalur rute saat rute jalanan OSRM berhasil didapat
  useEffect(() => {
    if (mapInstanceRef.current && osrmRoutePoints.length >= 2 && !hasAutoFitBoundsRef.current) {
      hasAutoFitBoundsRef.current = true;
      mapInstanceRef.current.invalidateSize();
      const bounds = L.latLngBounds(osrmRoutePoints.map((p) => [p.lat, p.lng]));
      mapInstanceRef.current.fitBounds(bounds, {
        paddingTopLeft: [75, 75],
        paddingBottomRight: [75, 75],
        maxZoom: 17,
        animate: true,
        duration: 0.6,
      });
    }
  }, [osrmRoutePoints]);

  // Center on Fleet button
  const handleCenterFleet = useCallback(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([fleetPos.lat, fleetPos.lng], 16, {
        animate: true,
        duration: 0.8,
      });
      if (layersRef.current.fleetMarker) {
        layersRef.current.fleetMarker.openPopup();
      }
    }
  }, [fleetPos]);

  // Fit bounds to entire mission route from Origin Posko to Destination
  const handleFitRoute = useCallback(() => {
    if (!mapInstanceRef.current) return;

    // Pastikan ukuran viewport akurat
    mapInstanceRef.current.invalidateSize();

    // Kumpulkan seluruh titik rute: Posko Asal, Titik Penerima, dan semua kelokan jalan
    const allRoutePoints: [number, number][] = [
      [origin.lat, origin.lng],
      [destination.lat, destination.lng],
    ];

    if (routeWaypoints && routeWaypoints.length >= 2) {
      for (const pt of routeWaypoints) {
        allRoutePoints.push([pt.lat, pt.lng]);
      }
    }

    const bounds = L.latLngBounds(allRoutePoints);

    // Zoom dan pusatkan kamera sehingga seluruh rute Posko ke Penerima terlihat penuh
    mapInstanceRef.current.fitBounds(bounds, {
      paddingTopLeft: [75, 75],
      paddingBottomRight: [75, 75],
      maxZoom: 17,
      animate: true,
      duration: 0.8,
    });
  }, [origin, destination, routeWaypoints]);

  return (
    <div
      className={`mission-tracking-container ${className}`}
      style={{
        position: 'relative',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1.5px solid rgba(1, 50, 32, 0.16)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
        background: '#ffffff',
        marginBottom: '24px',
      }}
    >
      <style>{`
        @keyframes fleet-pulse {
          0% { transform: scale(0.6); opacity: 0.9; }
          50% { transform: scale(1.4); opacity: 0.4; }
          100% { transform: scale(2.0); opacity: 0; }
        }
        @keyframes blink-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.35; transform: scale(0.85); }
        }
      `}</style>

      {/* 1. TOP TELEMETRY HUD BAR (LIVE STATUS & QUICK CONTROLS) */}
      <div
        className="mission-hud-bar"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          padding: '12px 18px',
          background: '#013220',
          color: '#ffffff',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Live Status Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: trackingSource === 'device_gps' ? 'rgba(59, 130, 246, 0.25)' : isStandby ? 'rgba(148, 163, 184, 0.25)' : 'rgba(34, 197, 94, 0.22)',
              border: `1px solid ${trackingSource === 'device_gps' ? '#60a5fa' : isStandby ? '#94a3b8' : '#4ade80'}`,
              padding: '2.5px 9px',
              borderRadius: '9999px',
              fontSize: '0.72rem',
              fontWeight: 700,
              letterSpacing: '0.02em',
              color: trackingSource === 'device_gps' ? '#93c5fd' : isStandby ? '#e2e8f0' : '#4ade80',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: trackingSource === 'device_gps' ? '#3b82f6' : isStandby ? '#94a3b8' : '#22c55e',
                boxShadow: isStandby ? 'none' : `0 0 6px ${trackingSource === 'device_gps' ? '#3b82f6' : '#22c55e'}`,
                animation: isStandby ? 'none' : 'blink-dot 1.4s ease-in-out infinite',
              }}
            />
            <span>
              {trackingSource === 'device_gps'
                ? 'GPS HP Aktif'
                : isStandby
                ? 'Standby di Posko'
                : isReady
                ? 'Siap Berangkat'
                : 'Dalam Perjalanan'}
            </span>
          </div>

          <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
            Armada: <strong style={{ color: '#ffffff' }}>{(mission.armada_info || 'Armada Logistik').replace(/ - Kapasitas.*/i, '')}</strong>
          </span>
        </div>

        {/* Map Quick Action Buttons */}
        <div className="mission-hud-actions" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Button: Use My Phone GPS */}
          <button
            type="button"
            onClick={handleToggleDeviceGps}
            title="Lacak posisi menggunakan sensor GPS perangkat/ponsel saya"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: trackingSource === 'device_gps' ? '#2563eb' : 'rgba(255, 255, 255, 0.12)',
              border: `1px solid ${trackingSource === 'device_gps' ? '#93c5fd' : 'rgba(255, 255, 255, 0.25)'}`,
              color: '#ffffff',
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '4.5px 10px',
              borderRadius: '7px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <AppIcon name="pin" size={12} />
            <span>
              {isLocatingDevice
                ? 'Mendeteksi...'
                : trackingSource === 'device_gps'
                ? 'GPS HP Aktif'
                : 'Gunakan GPS HP'}
            </span>
          </button>

          <button
            type="button"
            onClick={handleCenterFleet}
            title="Pusatkan kamera peta ke armada logistik"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '4.5px 10px',
              borderRadius: '7px',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="truck" size={12} />
            <span>Fokus Armada</span>
          </button>

          <button
            type="button"
            onClick={handleFitRoute}
            title="Lihat seluruh rute dari Posko ke Tujuan"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '4.5px 10px',
              borderRadius: '7px',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="map" size={12} />
            <span>Rute Penuh</span>
          </button>

          <button
            type="button"
            onClick={() => setTileMode((m) => (m === 'streets' ? 'satellite' : 'streets'))}
            title="Ganti tampilan antara Peta Jalan dan Citra Satelit Foto Udara"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              background: tileMode === 'satellite' ? '#15803d' : 'rgba(255, 255, 255, 0.12)',
              border: `1px solid ${tileMode === 'satellite' ? '#86efac' : 'rgba(255, 255, 255, 0.25)'}`,
              color: '#ffffff',
              fontSize: '0.74rem',
              fontWeight: 700,
              padding: '4.5px 10px',
              borderRadius: '7px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <AppIcon name="layers" size={12} />
            <span>{tileMode === 'streets' ? 'Citra Satelit' : 'Peta Jalan'}</span>
          </button>
        </div>
      </div>

      {/* GPS Error Alert if any */}
      {deviceGpsError && (
        <div style={{ background: '#fef2f2', borderBottom: '1px solid #fecaca', padding: '7px 16px', color: '#b91c1c', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AppIcon name="alert-triangle" size={13} style={{ color: '#b91c1c' }} />
            <span>{deviceGpsError}</span>
          </div>
          <button type="button" onClick={() => setDeviceGpsError(null)} style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 700 }}>×</button>
        </div>
      )}

      {/* 2. LEAFLET MAP CANVAS */}
      <div
        ref={mapContainerRef}
        className="mission-map-canvas"
        style={{
          width: '100%',
          height,
          background: '#e2e8f0',
        }}
      />

      {/* 3. BOTTOM TELEMETRY STATUS CARDS */}
      <div
        className="mission-telemetry-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          gap: '12px',
          padding: '12px 18px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        {/* Metric 1: Kecepatan Armada */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'rgba(1, 50, 32, 0.08)',
              color: '#013220',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <AppIcon name="truck" size={16} />
          </div>
          <div>
            <span style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.02em' }}>
              Kecepatan
            </span>
            <strong style={{ fontSize: '0.98rem', color: '#013220', fontWeight: 800 }}>
              {currentSpeed} km/jam
            </strong>
          </div>
        </div>

        {/* Metric 2: Estimasi Waktu Tiba (ETA) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'rgba(21, 128, 61, 0.1)',
              color: '#15803d',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <AppIcon name="clock" size={16} />
          </div>
          <div>
            <span style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.02em' }}>
              Estimasi Tiba
            </span>
            <strong style={{ fontSize: '0.98rem', color: isArrived ? '#15803d' : '#013220', fontWeight: 800 }}>
              {etaMinutes}
            </strong>
          </div>
        </div>

        {/* Metric 3: Sisa Jarak Tempuh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: 'rgba(1, 50, 32, 0.08)',
              color: '#013220',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <AppIcon name="pin" size={16} />
          </div>
          <div>
            <span style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.02em' }}>
              Sisa Jarak
            </span>
            <strong style={{ fontSize: '0.98rem', color: '#013220', fontWeight: 800 }}>
              {remainingDistanceKm} km <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 500 }}>/ {totalDistanceKm.toFixed(1)} km</span>
            </strong>
          </div>
        </div>

        {/* Metric 4: Status Jalur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '9px',
              background: mission.status_kendala ? 'rgba(239, 68, 68, 0.12)' : 'rgba(22, 163, 74, 0.1)',
              color: mission.status_kendala ? '#dc2626' : '#16a34a',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <AppIcon name={mission.status_kendala ? 'alert-triangle' : 'shield'} size={16} />
          </div>
          <div>
            <span style={{ fontSize: '0.70rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block', letterSpacing: '0.02em' }}>
              Status Jalur
            </span>
            <strong
              style={{
                fontSize: '0.88rem',
                color: mission.status_kendala ? '#b91c1c' : '#15803d',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {mission.status_kendala
                ? `Kendala: ${mission.status_kendala}`
                : trackingSource === 'device_gps'
                ? 'GPS Aktif'
                : isStandby
                ? 'Standby di Posko'
                : isArrived
                ? 'Tiba di Lokasi'
                : 'Jalur Lancar'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
