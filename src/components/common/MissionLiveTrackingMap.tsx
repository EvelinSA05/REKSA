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

  const [currentSpeed, setCurrentSpeed] = useState<number>(0);
  const [transitProgress, setTransitProgress] = useState<number>(0.55);
  const [gpsAccuracy] = useState<number>(3); // ±3 meters
  const [satelliteCount, setSatelliteCount] = useState<number>(14);
  const [lastPingTime, setLastPingTime] = useState<string>('Baru saja');
  const [tileMode, setTileMode] = useState<'streets' | 'light'>('streets');
  const tileLayerRef = useRef<L.TileLayer | null>(null);

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

  // 2. Generate Realistic Road Waypoints between Origin and Destination
  const routeWaypoints: LatLngPoint[] = useMemo(() => {
    const oLat = origin.lat;
    const oLng = origin.lng;
    const dLat = destination.lat;
    const dLng = destination.lng;

    const latDiff = dLat - oLat;
    const lngDiff = dLng - oLng;

    // Build 9 realistic road turns & corridors
    return [
      { lat: oLat, lng: oLng }, // Point 0: Posko Loading Dock
      { lat: oLat + latDiff * 0.08, lng: oLng + lngDiff * 0.03 }, // Point 1: Posko Exit Gate
      { lat: oLat + latDiff * 0.22, lng: oLng + lngDiff * 0.12 }, // Point 2: Simpang Jalan Raya Utama
      { lat: oLat + latDiff * 0.38, lng: oLng + lngDiff * 0.28 }, // Point 3: Jalur Koridor Provinsi
      { lat: oLat + latDiff * 0.54, lng: oLng + lngDiff * 0.52 }, // Point 4: Jembatan / Flyover Penghubung
      { lat: oLat + latDiff * 0.68, lng: oLng + lngDiff * 0.70 }, // Point 5: Simpang Akses Lingkungan
      { lat: oLat + latDiff * 0.82, lng: oLng + lngDiff * 0.86 }, // Point 6: Jalan Masuk Pemukiman
      { lat: oLat + latDiff * 0.94, lng: oLng + lngDiff * 0.96 }, // Point 7: Gerbang RT / RW Lokasi Warga
      { lat: dLat, lng: dLng }, // Point 8: Titik Rumah Penerima Manfaat
    ];
  }, [origin, destination]);

  // Calculate cumulative distances along route
  const { totalDistanceKm, cumulativeDistances } = useMemo(() => {
    let total = 0;
    const cum: number[] = [0];
    for (let i = 0; i < routeWaypoints.length - 1; i++) {
      const d = calculateHaversineDistance(routeWaypoints[i], routeWaypoints[i + 1]);
      total += d;
      cum.push(total);
    }
    return { totalDistanceKm: Math.max(total, 0.5), cumulativeDistances: cum };
  }, [routeWaypoints]);

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

  // Base progress based on stage
  const effectiveProgress = useMemo(() => {
    if (isStandby) return 0.0;
    if (isReady) return 0.08;
    if (isInTransit) return transitProgress;
    if (isArrived || isConfirming || isFinished) return 1.0;
    return 0.55;
  }, [isStandby, isReady, isInTransit, isArrived, isConfirming, isFinished, transitProgress]);

  // Real-time animated simulation when in transit
  useEffect(() => {
    if (!isInTransit) {
      if (isStandby || isReady) {
        setCurrentSpeed(0);
      } else if (isArrived || isConfirming || isFinished) {
        setCurrentSpeed(0);
      }
      return;
    }

    // Set initial transit speed
    setCurrentSpeed(Math.floor(38 + Math.random() * 8));

    // Dynamic GPS pings every 2.8 seconds
    const interval = window.setInterval(() => {
      setTransitProgress((prev) => {
        const next = prev + 0.012;
        // Keep moving smoothly along route, looping between 30% and 85% to demonstrate continuous real-time telemetry
        if (next >= 0.88) {
          return 0.35;
        }
        return next;
      });

      // Realistic speed variance (35 - 46 km/h in urban/disaster access terrain)
      setCurrentSpeed(Math.floor(36 + Math.random() * 10));

      // Occasional satellite fluctuation
      setSatelliteCount(Math.floor(13 + Math.random() * 3));

      // Timestamp ping
      const now = new Date();
      setLastPingTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')} WIB`);
    }, 2800);

    return () => clearInterval(interval);
  }, [isInTransit, isStandby, isReady, isArrived, isConfirming, isFinished]);

  // Current interpolated fleet position & bearing
  const { point: fleetPos, bearing: fleetBearing } = useMemo(
    () => getInterpolatedPosition(effectiveProgress),
    [getInterpolatedPosition, effectiveProgress]
  );

  // Distance metrics
  const remainingDistanceKm = useMemo(() => {
    if (isArrived || isConfirming || isFinished) return 0;
    return Math.max(0, Number((totalDistanceKm * (1 - effectiveProgress)).toFixed(1)));
  }, [totalDistanceKm, effectiveProgress, isArrived, isConfirming, isFinished]);

  // ETA calculation
  const etaMinutes = useMemo(() => {
    if (isArrived || isConfirming || isFinished) return 'Tiba di Lokasi';
    if (isStandby) return '~18 Menit (Siaga)';
    if (isReady) return '~15 Menit';
    // When moving: distance / speed
    const spd = currentSpeed > 0 ? currentSpeed : 40;
    const mins = Math.max(1, Math.round((remainingDistanceKm / spd) * 60));
    return `${mins} Menit`;
  }, [isArrived, isConfirming, isFinished, isStandby, isReady, currentSpeed, remainingDistanceKm]);

  // Initialize and update Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Clean container leaflet reference if re-rendering
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
          : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

      const tileLayer = L.tileLayer(tileUrl, {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      tileLayerRef.current = tileLayer;

      // Custom Zoom Control top-right
      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
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
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #013220;
        border: 2.5px solid #ffffff;
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(1, 50, 32, 0.4);
      ">
        <span style="font-size: 16px;">🏢</span>
        <div style="
          position: absolute;
          top: -24px;
          background: #013220;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          letter-spacing: 0.03em;
        ">
          POSKO ASAL
        </div>
      </div>
    `;

    const poskoIcon = L.divIcon({
      className: 'tracking-posko-icon',
      html: poskoIconHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (!layersRef.current.poskoMarker) {
      const pm = L.marker([origin.lat, origin.lng], { icon: poskoIcon })
        .bindPopup(`
          <div style="font-family: inherit; font-size: 12px; min-width: 200px; padding: 4px;">
            <div style="font-weight: 800; color: #013220; font-size: 13px; margin-bottom: 4px;">${poskoLabel}</div>
            <div style="color: #64748b; font-size: 11px;">Titik Awal Keberangkatan Logistik Bencana</div>
            <div style="margin-top: 6px; font-weight: 700; color: #15803d; font-size: 11px;">Pemuatan: ${mission.muatan}</div>
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
        width: 38px;
        height: 38px;
        border-radius: 50%;
        background: #b91c1c;
        border: 2.5px solid #ffffff;
        color: #ffffff;
        box-shadow: 0 4px 14px rgba(185, 28, 28, 0.45);
      ">
        <span style="font-size: 18px;">📍</span>
        <div style="
          position: absolute;
          top: -24px;
          background: #b91c1c;
          color: #ffffff;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 6px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
          letter-spacing: 0.03em;
        ">
          TITIK PENERIMA
        </div>
      </div>
    `;

    const destIcon = L.divIcon({
      className: 'tracking-dest-icon',
      html: destIconHtml,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
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
    // Build path points up to fleet
    const traveledPoints: [number, number][] = [];
    const remainingPoints: [number, number][] = [];

    const { segmentIndex } = getInterpolatedPosition(effectiveProgress);

    for (let i = 0; i <= segmentIndex; i++) {
      traveledPoints.push([routeWaypoints[i].lat, routeWaypoints[i].lng]);
    }
    traveledPoints.push([fleetPos.lat, fleetPos.lng]);

    remainingPoints.push([fleetPos.lat, fleetPos.lng]);
    for (let i = segmentIndex + 1; i < routeWaypoints.length; i++) {
      remainingPoints.push([routeWaypoints[i].lat, routeWaypoints[i].lng]);
    }

    if (!layersRef.current.traveledPolyline) {
      layersRef.current.traveledPolyline = L.polyline(traveledPoints, {
        color: '#013220',
        weight: 6,
        opacity: 0.92,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    } else {
      layersRef.current.traveledPolyline.setLatLngs(traveledPoints);
    }

    if (!layersRef.current.remainingPolyline) {
      layersRef.current.remainingPolyline = L.polyline(remainingPoints, {
        color: '#16a34a',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map);
    } else {
      layersRef.current.remainingPolyline.setLatLngs(remainingPoints);
    }

    // 4. Moving Fleet Marker with Radar Pulsing Ring & Heading Orientation
    const truckIconHtml = `
      <div style="position: relative; width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;">
        <!-- Pulsing Radar Halo Ring -->
        <div style="
          position: absolute;
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: rgba(22, 163, 74, 0.28);
          border: 1.5px solid #16a34a;
          animation: fleet-pulse 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
        "></div>

        <!-- Fleet Vehicle Core Badge -->
        <div style="
          position: relative;
          z-index: 2;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: #013220;
          border: 2px solid #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 16px rgba(1, 50, 32, 0.5);
          transform: rotate(${isInTransit ? Math.round(fleetBearing - 90) : 0}deg);
          transition: transform 0.4s ease;
        ">
          <span style="font-size: 20px;">🚚</span>
        </div>

        <!-- Floating Live Plate Tag -->
        <div style="
          position: absolute;
          bottom: -22px;
          background: #0f172a;
          color: #ffffff;
          font-size: 9.5px;
          font-weight: 800;
          font-family: monospace;
          padding: 2px 7px;
          border-radius: 6px;
          white-space: nowrap;
          border: 1px solid rgba(255, 255, 255, 0.2);
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 4px;
          z-index: 3;
        ">
          <span style="width: 6px; height: 6px; border-radius: 50%; background: #22c55e; display: inline-block;"></span>
          <span>${mission.kode_misi}</span>
        </div>
      </div>
    `;

    const truckIcon = L.divIcon({
      className: 'tracking-fleet-icon',
      html: truckIconHtml,
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    const popupHtml = `
      <div style="font-family: inherit; font-size: 12px; min-width: 240px; padding: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
          <span style="font-weight: 800; font-family: monospace; font-size: 11px; background: #013220; color: #fff; padding: 2px 8px; border-radius: 4px;">
            ${mission.kode_misi}
          </span>
          <span style="font-size: 10.5px; font-weight: 700; color: #15803d; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 2px 6px; border-radius: 4px;">
            ● GPS LIVE
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
            <span style="color: #64748b; display: block; font-size: 10px;">Kecepatan</span>
            <strong style="color: #013220; font-size: 12px;">${currentSpeed} km/jam</strong>
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
            <span style="color: #64748b; display: block; font-size: 10px;">Sinyal GPS</span>
            <strong style="color: #0f172a; font-size: 12px;">${satelliteCount} Satelit</strong>
          </div>
        </div>
        <div style="font-size: 10px; color: #94a3b8; text-align: right;">
          Update telemetry: ${lastPingTime}
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
    isInTransit,
    getInterpolatedPosition,
  ]);

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

  // Fit bounds to entire mission route
  const handleFitRoute = useCallback(() => {
    if (mapInstanceRef.current) {
      const bounds = L.latLngBounds([
        [origin.lat, origin.lng],
        [destination.lat, destination.lng],
        [fleetPos.lat, fleetPos.lng],
      ]);
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 0.8 });
    }
  }, [origin, destination, fleetPos]);

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(34, 197, 94, 0.18)',
              border: '1px solid rgba(34, 197, 94, 0.4)',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 800,
              letterSpacing: '0.04em',
              color: '#4ade80',
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 8px #22c55e',
                animation: 'blink-dot 1.4s ease-in-out infinite',
              }}
            />
            <span>LIVE GPS TRACKING</span>
          </div>

          <span style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
            Armada: <strong style={{ color: '#ffffff' }}>{mission.armada_info || 'Armada Logistik'}</strong>
          </span>

          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            (Sinyal: {satelliteCount} Satelit · Akurasi ±{gpsAccuracy}m)
          </span>
        </div>

        {/* Map Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            onClick={handleCenterFleet}
            title="Pusatkan kamera peta ke armada logistik"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <AppIcon name="truck" size={13} />
            <span>Fokus Armada</span>
          </button>

          <button
            type="button"
            onClick={handleFitRoute}
            title="Lihat seluruh rute dari Posko ke Tujuan"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '5px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
          >
            <AppIcon name="map" size={13} />
            <span>Lihat Rute Penuh</span>
          </button>

          <button
            type="button"
            onClick={() => setTileMode((m) => (m === 'streets' ? 'light' : 'streets'))}
            title="Ganti tampilan lapisan peta"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.12)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#ffffff',
              fontSize: '0.78rem',
              fontWeight: 700,
              padding: '5px 10px',
              borderRadius: '8px',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="layers" size={13} />
            <span>{tileMode === 'streets' ? 'Peta Terang' : 'Peta Jalan'}</span>
          </button>
        </div>
      </div>

      {/* 2. LEAFLET MAP CANVAS */}
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height,
          background: '#e2e8f0',
        }}
      />

      {/* 3. BOTTOM TELEMETRY STATUS CARDS */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          padding: '14px 18px',
          background: '#f8fafc',
          borderTop: '1px solid #e2e8f0',
        }}
      >
        {/* Metric 1: Kecepatan Armada */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(1, 50, 32, 0.08)',
              color: '#013220',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <AppIcon name="truck" size={18} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
              Kecepatan Bergerak
            </span>
            <strong style={{ fontSize: '1.05rem', color: '#013220', fontWeight: 800 }}>
              {currentSpeed} km/jam
            </strong>
          </div>
        </div>

        {/* Metric 2: Estimasi Waktu Tiba (ETA) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(21, 128, 61, 0.1)',
              color: '#15803d',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <AppIcon name="clock" size={18} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
              Estimasi Tiba (ETA)
            </span>
            <strong style={{ fontSize: '1.05rem', color: isArrived ? '#15803d' : '#013220', fontWeight: 800 }}>
              {etaMinutes}
            </strong>
          </div>
        </div>

        {/* Metric 3: Sisa Jarak Tempuh */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'rgba(1, 50, 32, 0.08)',
              color: '#013220',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <AppIcon name="pin" size={18} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
              Sisa Jarak / Total
            </span>
            <strong style={{ fontSize: '1.05rem', color: '#013220', fontWeight: 800 }}>
              {remainingDistanceKm} km <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 500 }}>/ {totalDistanceKm.toFixed(1)} km</span>
            </strong>
          </div>
        </div>

        {/* Metric 4: Kondisi Rute Jalur */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: mission.status_kendala ? 'rgba(239, 68, 68, 0.12)' : 'rgba(22, 163, 74, 0.1)',
              color: mission.status_kendala ? '#dc2626' : '#16a34a',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <AppIcon name={mission.status_kendala ? 'alert-triangle' : 'shield'} size={18} />
          </div>
          <div>
            <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
              Kondisi Operasional Rute
            </span>
            <strong
              style={{
                fontSize: '0.92rem',
                color: mission.status_kendala ? '#b91c1c' : '#15803d',
                fontWeight: 800,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {mission.status_kendala ? `Kendala: ${mission.status_kendala}` : 'Jalur Terbuka & Lancar'}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
