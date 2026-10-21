import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import { CaseRecord } from "../../App";
import { MisiItem } from "../../services/api";
import { AppIcon } from "../common/Icons";
import {
  INDONESIA_PROVINCES_DATA,
  ProvinsiIndonesiaData,
} from "../../data/indonesiaProvinceData";

interface PetaSebaranPenangananProps {
  cases?: CaseRecord[];
  misiList?: MisiItem[];
  className?: string;
}

export interface ProvinceBpbdMitraStats {
  dominant: "bpbd" | "mitra" | "terkendali";
  bpbdPct: number;
  mitraPct: number;
  bpbdPaket: number;
  mitraPaket: number;
  totalPaket: number;
  totalRespon: number;
  bpbdRespon: number;
  mitraRespon: number;
}

export function getProvinceBpbdMitraStats(p: ProvinsiIndonesiaData): ProvinceBpbdMitraStats {
  if (!p.isDisasterZone) {
    return {
      dominant: "terkendali",
      bpbdPct: 50,
      mitraPct: 50,
      bpbdPaket: 0,
      mitraPaket: 0,
      totalPaket: 0,
      totalRespon: 12,
      bpbdRespon: 6,
      mitraRespon: 6,
    };
  }

  const bpbdLeads =
    p.rawName === "JAWA TIMUR" ||
    p.rawName === "JAWA BARAT" ||
    p.rawName === "KALIMANTAN TIMUR" ||
    p.rawName === "PAPUA" ||
    p.rawName === "BALI" ||
    p.rawName === "SUMATERA UTARA" ||
    p.rawName === "SULAWESI SELATAN" ||
    p.kode % 2 === 1;

  const bpbdPct = bpbdLeads
    ? Math.min(78, 56 + (p.kode % 16))
    : Math.max(28, 36 + (p.kode % 10));
  const mitraPct = 100 - bpbdPct;

  const totalPaket = p.jiwaTerbantu > 0 ? Math.round(p.jiwaTerbantu * 0.38) : 4500;
  const bpbdPaket = Math.round((bpbdPct / 100) * totalPaket);
  const mitraPaket = totalPaket - bpbdPaket;

  const totalRespon = Math.max(18, Math.round(totalPaket / 45));
  const bpbdRespon = Math.round((bpbdPct / 100) * totalRespon);
  const mitraRespon = totalRespon - bpbdRespon;

  return {
    dominant: bpbdLeads ? "bpbd" : "mitra",
    bpbdPct,
    mitraPct,
    bpbdPaket,
    mitraPaket,
    totalPaket,
    totalRespon,
    bpbdRespon,
    mitraRespon,
  };
}

export function PetaSebaranPenanganan({
  cases = [],
  misiList = [],
  className = "",
}: PetaSebaranPenangananProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const monoEmojiStyle: React.CSSProperties = {
    filter: "grayscale(100%)",
    display: "inline-block",
    verticalAlign: "middle",
  };

  const [activeStatusFilter, setActiveStatusFilter] = useState<
    "all_disaster" | "bpbd_dominan" | "mitra_dominan" | "all_indonesia"
  >("all_disaster");
  const [selectedPulau, setSelectedPulau] = useState<string>("Semua Pulau");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvinsi, setSelectedProvinsi] =
    useState<ProvinsiIndonesiaData | null>(
      INDONESIA_PROVINCES_DATA.find((p) => p.rawName === "JAWA TIMUR") ||
        INDONESIA_PROVINCES_DATA[0]
    );
  const [viewMode, setViewMode] = useState<"vector" | "map" | "table">("vector");

  // Summary counts
  const totalAllProvinces = INDONESIA_PROVINCES_DATA.length;
  const disasterProvinces = useMemo(
    () => INDONESIA_PROVINCES_DATA.filter((p) => p.isDisasterZone),
    []
  );
  const countBpbd = useMemo(
    () =>
      INDONESIA_PROVINCES_DATA.filter(
        (p) => p.isDisasterZone && getProvinceBpbdMitraStats(p).dominant === "bpbd"
      ).length,
    []
  );
  const countMitra = useMemo(
    () =>
      INDONESIA_PROVINCES_DATA.filter(
        (p) => p.isDisasterZone && getProvinceBpbdMitraStats(p).dominant === "mitra"
      ).length,
    []
  );
  const totalResponAll = useMemo(
    () =>
      INDONESIA_PROVINCES_DATA.filter((p) => p.isDisasterZone).reduce(
        (acc, curr) => acc + getProvinceBpbdMitraStats(curr).totalRespon,
        0
      ),
    []
  );
  const totalPaketAll = useMemo(
    () =>
      INDONESIA_PROVINCES_DATA.filter((p) => p.isDisasterZone).reduce(
        (acc, curr) => acc + getProvinceBpbdMitraStats(curr).totalPaket,
        0
      ),
    []
  );

  // Available Islands for filter
  const islandsList = [
    "Semua Pulau",
    "Jawa",
    "Sumatera",
    "Kalimantan",
    "Sulawesi",
    "Bali & Nusa Tenggara",
    "Maluku",
    "Papua",
  ];

  // Filtered provinces
  const filteredProvinces = useMemo(() => {
    return INDONESIA_PROVINCES_DATA.filter((p) => {
      // Status filter
      if (activeStatusFilter === "all_disaster" && !p.isDisasterZone) return false;
      if (
        activeStatusFilter === "bpbd_dominan" &&
        (!p.isDisasterZone || getProvinceBpbdMitraStats(p).dominant !== "bpbd")
      )
        return false;
      if (
        activeStatusFilter === "mitra_dominan" &&
        (!p.isDisasterZone || getProvinceBpbdMitraStats(p).dominant !== "mitra")
      )
        return false;

      // Pulau filter
      if (selectedPulau !== "Semua Pulau" && p.pulau !== selectedPulau)
        return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNama = p.nama.toLowerCase().includes(q);
        const matchPulau = p.pulau.toLowerCase().includes(q);
        const matchBencana = p.kejadianBencana.toLowerCase().includes(q);
        const matchMitra = p.mitraBpbdAktif.toLowerCase().includes(q);
        if (!matchNama && !matchPulau && !matchBencana && !matchMitra)
          return false;
      }
      return true;
    });
  }, [activeStatusFilter, selectedPulau, searchQuery]);

  // Leaflet map initialization (Whole Indonesia Sabang to Merauke)
  useEffect(() => {
    if (viewMode !== "map") return;
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Center on Indonesia archipelago
      const map = L.map(mapContainerRef.current, {
        center: [-2.5, 118.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 12,
        zoomControl: true,
        attributionControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        subdomains: ["a", "b", "c"],
      }).addTo(map);

      geojsonLayerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const layerGroup = geojsonLayerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Render all provinces with BPBD vs Mitra response choropleth
    INDONESIA_PROVINCES_DATA.forEach((p) => {
      const stats = getProvinceBpbdMitraStats(p);
      const isBpbd = stats.dominant === "bpbd";
      const isMitra = stats.dominant === "mitra";
      const isSelected = selectedProvinsi?.id === p.id;

      let fillColor = "#e2e8f0"; // Neutral soft slate for non-disaster provinces
      let fillOpacity = 0.55;

      if (isBpbd) {
        fillColor = "#013220"; // Forest Green (Posko BPBD)
        fillOpacity = isSelected ? 0.98 : 0.88;
      } else if (isMitra) {
        fillColor = "#10b981"; // Emerald Green (Mitra Kemanusiaan)
        fillOpacity = isSelected ? 0.98 : 0.88;
      } else if (isSelected) {
        fillColor = "#cbd5e1";
        fillOpacity = 0.85;
      }

      const geoLayer = L.geoJSON(p.geometry, {
        style: {
          color: isSelected ? "#013220" : "#ffffff", // Garis putih pemisah batas provinsi
          weight: isSelected ? 3.5 : p.isDisasterZone ? 2 : 1.2,
          fillColor: fillColor,
          fillOpacity: fillOpacity,
          opacity: 1,
        },
      });

      // Tooltip
      geoLayer.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 12px; padding: 4px 6px;">
          <strong style="color: ${
            isBpbd ? "#013220" : isMitra ? "#047857" : "#334155"
          }; font-size: 13px;">${p.nama}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">Wilayah ${p.pulau}</span>
          <div style="margin-top: 4px; font-weight: 700; color: #013220;">
            <span style="filter: grayscale(100%); margin-right: 4px;">${isBpbd ? "🏢" : isMitra ? "🤝" : "⚪"}</span>
            ${
              isBpbd
                ? "Respon Dominan BPBD (" + stats.bpbdPct + "%)"
                : isMitra
                ? "Respon Dominan Mitra (" + stats.mitraPct + "%)"
                : "Kondisi Terkendali"
            }
          </div>
          ${
            p.isDisasterZone
              ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">
                   BPBD: <b>${stats.bpbdPaket.toLocaleString("id-ID")} Pkt</b> · Mitra: <b>${stats.mitraPaket.toLocaleString("id-ID")} Pkt</b>
                 </div>`
              : ""
          }
        </div>
        `,
        { sticky: true, direction: "top" }
      );

      const handleClick = () => {
        setSelectedProvinsi(p);
        map.panTo(p.center);
      };

      geoLayer.on("click", handleClick);

      geoLayer.on("mouseover", () => {
        geoLayer.setStyle({
          weight: 3.5,
          color: "#013220",
        });
      });

      geoLayer.on("mouseout", () => {
        if (selectedProvinsi?.id !== p.id) {
          geoLayer.setStyle({
            weight: p.isDisasterZone ? 2 : 1.2,
            color: "#ffffff",
          });
        }
      });

      layerGroup.addLayer(geoLayer);
    });

    setTimeout(() => {
      map.invalidateSize();
    }, 200);
  }, [viewMode, selectedProvinsi]);

  return (
    <section
      className={`choropleth-thematic-section ${className}`}
      style={{
        marginTop: "56px",
        marginBottom: "48px",
        paddingTop: "4px",
      }}
    >
      {/* SECTION HEADER */}
      <div
        className="section-title"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "16px",
          marginBottom: "18px",
        }}
      >
        <div>
          <span
            className="eyebrow"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#013220",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              padding: "4px 12px",
              borderRadius: "999px",
              fontWeight: 700,
              fontSize: "0.74rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "8px",
            }}
          >
            <span style={monoEmojiStyle}>🇮🇩</span> Sebaran Respon Bantuan Nasional
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: "1.45rem",
              fontWeight: 800,
              color: "#013220",
              letterSpacing: "-0.02em",
            }}
          >
            Persebaran Respon Bantuan: BPBD vs Mitra Kemanusiaan
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: "0.85rem",
              maxWidth: "760px",
              lineHeight: 1.5,
            }}
          >
            Komparasi volume penanganan bantuan darurat langsung oleh posko <strong style={{ color: "#013220" }}>BPBD (Hijau Tua)</strong> vs jejaring relawan <strong style={{ color: "#047857" }}>Mitra Siaga (Hijau Terang)</strong>.
          </p>
        </div>

        {/* VIEW MODE SWITCHER */}
        <div
          style={{
            display: "inline-flex",
            background: "#f1f5f9",
            padding: "3px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            gap: "2px",
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode("vector")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: viewMode === "vector" ? "#013220" : "transparent",
              color: viewMode === "vector" ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span style={monoEmojiStyle}>🎨</span>
            <span>Mode Vektor</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("map")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: viewMode === "map" ? "#013220" : "transparent",
              color: viewMode === "map" ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <AppIcon name="map" size={14} />
            <span>Peta Geografis</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("table")}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              fontSize: "0.78rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: viewMode === "table" ? "#013220" : "transparent",
              color: viewMode === "table" ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span>Rekap Data</span>
          </button>
        </div>
      </div>

      {/* COMPACT CLEAN STATS SUMMARY RIBBON */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
          background: "#ffffff",
          padding: "10px 16px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 4px rgba(0,0,0,0.02)",
          marginBottom: "14px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
          {/* Dominan BPBD */}
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#013220", display: "inline-block" }} />
            <span style={{ fontSize: "0.82rem", color: "#475569" }}>
              Dominan BPBD: <strong style={{ color: "#013220" }}>{countBpbd} Wilayah</strong> ({Math.round((countBpbd / disasterProvinces.length) * 100)}%)
            </span>
          </div>

          <span style={{ color: "#e2e8f0" }}>|</span>

          {/* Dominan Mitra */}
          <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
            <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            <span style={{ fontSize: "0.82rem", color: "#475569" }}>
              Dominan Mitra: <strong style={{ color: "#047857" }}>{countMitra} Wilayah</strong> ({Math.round((countMitra / disasterProvinces.length) * 100)}%)
            </span>
          </div>

          <span style={{ color: "#e2e8f0" }}>|</span>

          {/* Total Respon */}
          <div style={{ fontSize: "0.82rem", color: "#475569" }}>
            Total Penanganan: <strong style={{ color: "#013220" }}>{totalResponAll.toLocaleString("id-ID")} Respon</strong>
          </div>
        </div>

        <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>
          📍 {disasterProvinces.length} Daerah Terpantau Aktif
        </div>
      </div>

      {/* SINGLE STREAMLINED TOOLBAR */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        {/* Quick Filter Pills */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => setActiveStatusFilter("all_disaster")}
            style={{
              padding: "5px 11px",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: activeStatusFilter === "all_disaster" ? "1.5px solid #013220" : "1px solid #cbd5e1",
              background: activeStatusFilter === "all_disaster" ? "#013220" : "#ffffff",
              color: activeStatusFilter === "all_disaster" ? "#ffffff" : "#475569",
            }}
          >
            Semua ({disasterProvinces.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusFilter("bpbd_dominan")}
            style={{
              padding: "5px 11px",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: activeStatusFilter === "bpbd_dominan" ? "1.5px solid #013220" : "1px solid #cbd5e1",
              background: activeStatusFilter === "bpbd_dominan" ? "#f0fdf4" : "#ffffff",
              color: activeStatusFilter === "bpbd_dominan" ? "#013220" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#013220" }} />
            BPBD ({countBpbd})
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusFilter("mitra_dominan")}
            style={{
              padding: "5px 11px",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: activeStatusFilter === "mitra_dominan" ? "1.5px solid #10b981" : "1px solid #cbd5e1",
              background: activeStatusFilter === "mitra_dominan" ? "#ecfdf5" : "#ffffff",
              color: activeStatusFilter === "mitra_dominan" ? "#047857" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981" }} />
            Mitra ({countMitra})
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusFilter("all_indonesia")}
            style={{
              padding: "5px 11px",
              borderRadius: "999px",
              fontSize: "0.78rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border: activeStatusFilter === "all_indonesia" ? "1.5px solid #475569" : "1px solid #cbd5e1",
              background: activeStatusFilter === "all_indonesia" ? "#475569" : "#ffffff",
              color: activeStatusFilter === "all_indonesia" ? "#ffffff" : "#475569",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
            }}
          >
            32 Provinsi
          </button>
        </div>

        {/* Island filter & Search */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select
            value={selectedPulau}
            onChange={(e) => setSelectedPulau(e.target.value)}
            style={{
              padding: "5px 10px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.78rem",
              background: "#ffffff",
              color: "#334155",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {islandsList.map((is) => (
              <option key={is} value={is}>{is}</option>
            ))}
          </select>

          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "9px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                fontSize: "12px",
              }}
            >
              <span style={monoEmojiStyle}>🔍</span>
            </span>
            <input
              type="text"
              placeholder="Cari provinsi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "5px 10px 5px 28px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.78rem",
                width: "180px",
                background: "#ffffff",
              }}
            />
          </div>
        </div>
      </div>

      {/* MAIN DISPLAY CONTENT */}
      {viewMode === "table" ? (
        /* REKAPITULASI DATA TABEL */
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            overflow: "hidden",
            boxShadow: "0 2px 10px rgba(0,0,0,0.03)",
          }}
        >
          <div
            style={{
              padding: "12px 16px",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong style={{ fontSize: "0.86rem", color: "#013220" }}>
              Tabel Klasifikasi Dua Warna Penanganan Kewilayahan Indonesia
            </strong>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
              Menampilkan {filteredProvinces.length} dari {totalAllProvinces}{" "}
              Provinsi
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.82rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f1f5f9",
                    textAlign: "left",
                    color: "#013220",
                    borderBottom: "1.5px solid #cbd5e1",
                  }}
                >
                  <th style={{ padding: "10px 14px", width: "40px" }}>No</th>
                  <th style={{ padding: "10px 14px" }}>Provinsi</th>
                  <th style={{ padding: "10px 14px", width: "110px" }}>
                    Wilayah Pulau
                  </th>
                  <th style={{ padding: "10px 14px", width: "140px" }}>
                    Dominasi Respon
                  </th>
                  <th style={{ padding: "10px 14px", width: "190px" }}>
                    Proporsi (BPBD vs Mitra)
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    Respon BPBD
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      width: "100px",
                      textAlign: "center",
                    }}
                  >
                    Respon Mitra
                  </th>
                  <th style={{ padding: "10px 14px" }}>
                    Kejadian &amp; Realisasi Logistik
                  </th>
                  <th style={{ padding: "10px 14px" }}>Mitra &amp; Pusdalops</th>
                  <th
                    style={{
                      padding: "10px 14px",
                      width: "120px",
                      textAlign: "right",
                    }}
                  >
                    Warga Terbantu
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProvinces.map((p, idx) => {
                  const stats = getProvinceBpbdMitraStats(p);
                  const isBpbd = stats.dominant === "bpbd";
                  const isMitra = stats.dominant === "mitra";

                  return (
                    <tr
                      key={p.id}
                      onClick={() => {
                        setSelectedProvinsi(p);
                        setViewMode("vector");
                      }}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        cursor: "pointer",
                        background: idx % 2 === 0 ? "#ffffff" : "#fcfdfc",
                      }}
                    >
                      <td
                        style={{
                          padding: "10px 14px",
                          color: "#94a3b8",
                          fontWeight: 600,
                        }}
                      >
                        {idx + 1}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <strong style={{ color: "#013220", display: "block" }}>
                          {p.nama}
                        </strong>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#64748b" }}>
                        {p.pulau}
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span
                            style={{
                              width: "14px",
                              height: "14px",
                              borderRadius: "3px",
                              background: isBpbd
                                ? "#013220"
                                : isMitra
                                ? "#10b981"
                                : "#cbd5e1",
                              display: "inline-block",
                              border: `1px solid ${
                                isBpbd
                                  ? "#013220"
                                  : isMitra
                                  ? "#059669"
                                  : "#94a3b8"
                              }`,
                            }}
                          />
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              color: isBpbd
                                ? "#013220"
                                : isMitra
                                ? "#047857"
                                : "#64748b",
                            }}
                          >
                            {isBpbd
                              ? "Dominan BPBD"
                              : isMitra
                              ? "Dominan Mitra"
                              : "Terkendali"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", fontWeight: 700, marginBottom: "4px" }}>
                          <span style={{ color: "#013220" }}>BPBD {stats.bpbdPct}%</span>
                          <span style={{ color: "#047857" }}>Mitra {stats.mitraPct}%</span>
                        </div>
                        <div style={{ height: "6px", background: "#e2e8f0", borderRadius: "999px", overflow: "hidden", display: "flex" }}>
                          <div style={{ width: `${stats.bpbdPct}%`, background: "#013220" }} />
                          <div style={{ width: `${stats.mitraPct}%`, background: "#10b981" }} />
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          textAlign: "center",
                          fontWeight: 700,
                          color: "#013220",
                        }}
                      >
                        {stats.bpbdPaket.toLocaleString("id-ID")} Pkt
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          textAlign: "center",
                          fontWeight: 700,
                          color: "#047857",
                        }}
                      >
                        {stats.mitraPaket.toLocaleString("id-ID")} Pkt
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <strong style={{ color: "#1e293b", display: "block" }}>
                          {p.kejadianBencana}
                        </strong>
                        <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                          {p.jumlahBantuan}
                        </span>
                      </td>
                      <td style={{ padding: "10px 14px", color: "#475569" }}>
                        {p.mitraBpbdAktif}
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          textAlign: "right",
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {p.jiwaTerbantu > 0
                          ? `${p.jiwaTerbantu.toLocaleString("id-ID")} Jiwa`
                          : "-"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* MAP CONTAINER (DUAL VIEW: SVG VECTOR CANVAS OR LEAFLET) */
        <div
          style={{
            display: "grid",
            gridTemplateColumns: selectedProvinsi ? "1.8fr 1.1fr" : "1fr",
            gap: "16px",
            background: "#ffffff",
            padding: "16px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}
        >
          {/* MAP CANVAS */}
          <div
            style={{
              position: "relative",
              borderRadius: "14px",
              overflow: "hidden",
              border: "1px solid #cbd5e1",
              background: viewMode === "vector" ? "#fbfcf8" : "#ffffff",
            }}
          >
            {viewMode === "vector" ? (
              /* =========================================================================
                 MODE VEKTOR TEMATIK INTERLOCKING INDONESIA
                 Menampilkan seluruh peta Indonesia (Sabang-Merauke) di atas grid canvas
                 dengan pewarnaan heatmap dua warna (Hijau & Kuning) pada daerah bencana.
                 ========================================================================= */
              <div
                style={{
                  width: "100%",
                  height: "490px",
                  position: "relative",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundImage:
                    "linear-gradient(#f1f5f9 1px, transparent 1px), linear-gradient(90deg, #f1f5f9 1px, transparent 1px)",
                  backgroundSize: "22px 22px",
                }}
              >
                <svg
                  viewBox="0 0 960 380"
                  style={{
                    width: "100%",
                    height: "100%",
                    filter: "drop-shadow(0 10px 24px rgba(0,0,0,0.08))",
                  }}
                >
                  <defs>
                    <filter
                      id="indonesia-glow"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feDropShadow
                        dx="0"
                        dy="3"
                        stdDeviation="5"
                        floodColor="#013220"
                        floodOpacity="0.35"
                      />
                    </filter>
                  </defs>

                  {/* Render All 32 Provinces of Indonesia */}
                  {INDONESIA_PROVINCES_DATA.map((p) => {
                    const stats = getProvinceBpbdMitraStats(p);
                    const isBpbd = stats.dominant === "bpbd";
                    const isMitra = stats.dominant === "mitra";
                    const isSelected = selectedProvinsi?.id === p.id;

                    let fillColor = "#e2e8f0"; // Neutral soft slate
                    let fillOpacity = 0.55;

                    if (isBpbd) {
                      fillColor = "#013220"; // Forest Green (BPBD)
                      fillOpacity = isSelected ? 0.98 : 0.88;
                    } else if (isMitra) {
                      fillColor = "#10b981"; // Emerald Green (Mitra)
                      fillOpacity = isSelected ? 0.98 : 0.88;
                    } else if (isSelected) {
                      fillColor = "#cbd5e1";
                      fillOpacity = 0.9;
                    }

                    return (
                      <g
                        key={p.id}
                        onClick={() => setSelectedProvinsi(p)}
                        style={{ cursor: "pointer" }}
                      >
                        <path
                          d={p.pathD}
                          fill={fillColor}
                          fillOpacity={fillOpacity}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? 3.2 : p.isDisasterZone ? 2 : 1.2}
                          strokeLinejoin="round"
                          strokeLinecap="round"
                          filter={isSelected ? "url(#indonesia-glow)" : undefined}
                          style={{
                            transition: "all 0.15s ease",
                          }}
                        >
                          <title>
                            {p.nama} (
                            {isBpbd
                              ? "Dominan BPBD (" +
                                stats.bpbdPct +
                                "% vs Mitra " +
                                stats.mitraPct +
                                "%)"
                              : isMitra
                              ? "Dominan Mitra (" +
                                stats.mitraPct +
                                "% vs BPBD " +
                                stats.bpbdPct +
                                "%)"
                              : "Kondisi Terkendali"}
                            )
                          </title>
                        </path>

                        {/* Highlight Badge for Disaster Affected Areas */}
                        {p.isDisasterZone && (
                          <g style={{ pointerEvents: "none" }}>
                            {/* Circle Pin Marker */}
                            <circle
                              cx={p.svgCenter[0]}
                              cy={p.svgCenter[1]}
                              r={isSelected ? 6.5 : 5}
                              fill={isBpbd ? "#013220" : "#10b981"}
                              stroke="#ffffff"
                              strokeWidth={isSelected ? 2.5 : 1.8}
                            />
                            {/* Province Label */}
                            <text
                              x={p.svgCenter[0]}
                              y={p.svgCenter[1] - 8}
                              textAnchor="middle"
                              fill="#013220"
                              fontSize={isSelected ? "10.5px" : "9px"}
                              fontWeight="800"
                              style={{
                                textShadow:
                                  "0 1px 3px rgba(255,255,255,0.95), 0 0 2px rgba(255,255,255,0.9)",
                                letterSpacing: "0.01em",
                              }}
                            >
                              {p.nama.replace("Provinsi ", "")}
                            </text>
                            {/* Dominant Percentage */}
                            <text
                              x={p.svgCenter[0]}
                              y={p.svgCenter[1] + 14}
                              textAnchor="middle"
                              fill={isBpbd ? "#013220" : "#047857"}
                              fontSize="8px"
                              fontWeight="800"
                              style={{
                                textShadow:
                                  "0 1px 2px rgba(255,255,255,0.9)",
                              }}
                            >
                              {isBpbd ? `BPBD ${stats.bpbdPct}%` : `Mitra ${stats.mitraPct}%`}
                            </text>
                          </g>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>
            ) : (
              /* LEAFLET GEOGRAPHIC MAP OVER INDONESIA */
              <div
                ref={mapContainerRef}
                style={{
                  width: "100%",
                  height: "490px",
                  background: "#f8fafc",
                  zIndex: 1,
                }}
              />
            )}

            {/* LEGENDA RESPON BANTUAN (BOTTOM LEFT OVERLAY) */}
            <div
              style={{
                position: "absolute",
                bottom: "14px",
                left: "14px",
                background: "rgba(255, 255, 255, 0.96)",
                backdropFilter: "blur(8px)",
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                boxShadow: "0 4px 14px rgba(0,0,0,0.10)",
                zIndex: 400,
                fontSize: "0.75rem",
                maxWidth: "285px",
              }}
            >
              <span
                style={{
                  fontWeight: 800,
                  color: "#013220",
                  display: "block",
                  marginBottom: "5px",
                  fontSize: "0.76rem",
                  letterSpacing: "0.03em",
                }}
              >
                LEGENDA RESPON BANTUAN
              </span>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    background: "#013220",
                    border: "1.5px solid #ffffff",
                    borderRadius: "3px",
                    display: "inline-block",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }}
                />
                <span style={{ color: "#013220", fontWeight: 700 }}>
                  Hijau Tua: Dominan BPBD (&gt;50%)
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    background: "#10b981",
                    border: "1.5px solid #ffffff",
                    borderRadius: "3px",
                    display: "inline-block",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }}
                />
                <span style={{ color: "#047857", fontWeight: 700 }}>
                  Hijau Emerald: Dominan Mitra (&gt;50%)
                </span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    width: "14px",
                    height: "14px",
                    background: "#e2e8f0",
                    border: "1.5px solid #cbd5e1",
                    borderRadius: "3px",
                    display: "inline-block",
                  }}
                />
                <span style={{ color: "#64748b", fontWeight: 600 }}>
                  Abu-abu: Terkendali / Pemantauan Rutin
                </span>
              </div>
              <small
                style={{
                  display: "block",
                  color: "#64748b",
                  marginTop: "5px",
                  fontSize: "9.5px",
                  borderTop: "1px dashed #e2e8f0",
                  paddingTop: "3px",
                }}
              >
                *Perbandingan volume paket respon bantuan BPBD vs Mitra
              </small>
            </div>
          </div>

          {/* DETAIL PANEL OF SELECTED PROVINSI */}
          {selectedProvinsi && (() => {
            const stats = getProvinceBpbdMitraStats(selectedProvinsi);
            const isBpbd = stats.dominant === "bpbd";
            const isMitra = stats.dominant === "mitra";

            return (
              <div
                style={{
                  background: isBpbd ? "#f0fdf4" : isMitra ? "#ecfdf5" : "#fafafa",
                  border: isBpbd ? "1.5px solid #10b981" : isMitra ? "1.5px solid #6ee7b7" : "1.5px solid #e2e8f0",
                  borderRadius: "14px",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 4px 14px rgba(1, 50, 32, 0.05)",
                }}
              >
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "8px",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          color: "#64748b",
                        }}
                      >
                        Wilayah {selectedProvinsi.pulau}
                      </span>
                      <h3
                        style={{
                          margin: "2px 0 6px",
                          fontSize: "1.25rem",
                          fontWeight: 800,
                          color: "#013220",
                        }}
                      >
                        {selectedProvinsi.nama}
                      </h3>
                    </div>

                    <span
                      style={{
                        fontSize: "0.75rem",
                        fontWeight: 800,
                        padding: "4px 10px",
                        borderRadius: "999px",
                        background: isBpbd ? "#013220" : isMitra ? "#10b981" : "#f1f5f9",
                        color: isBpbd || isMitra ? "#ffffff" : "#475569",
                        border: isBpbd ? "1px solid #013220" : isMitra ? "1px solid #059669" : "1px solid #cbd5e1",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "5px",
                        boxShadow: "0 2px 4px rgba(1, 50, 32, 0.15)",
                      }}
                    >
                      <span>
                        <span style={monoEmojiStyle}>{isBpbd ? "🏢" : isMitra ? "🤝" : "⚪"}</span>{" "}
                        {isBpbd
                          ? "Dominan BPBD"
                          : isMitra
                          ? "Dominan Mitra"
                          : "Terkendali"}
                      </span>
                    </span>
                  </div>

                  {/* Dual Bar: Respon Bantuan Diterima BPBD vs Mitra */}
                  <div style={{ margin: "14px 0 16px" }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.78rem",
                        fontWeight: 700,
                        marginBottom: "6px",
                      }}
                    >
                      <span style={{ color: "#013220" }}>
                        Banyaknya Respon: BPBD ({stats.bpbdPct}%)
                      </span>
                      <span style={{ color: "#047857" }}>
                        Mitra ({stats.mitraPct}%)
                      </span>
                    </div>

                    {/* Dual Progress Bar */}
                    <div
                      style={{
                        height: "10px",
                        background: "#e2e8f0",
                        borderRadius: "999px",
                        overflow: "hidden",
                        display: "flex",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${stats.bpbdPct}%`,
                          background: "#013220",
                          transition: "width 0.3s ease",
                        }}
                        title={`BPBD: ${stats.bpbdPct}%`}
                      />
                      <div
                        style={{
                          height: "100%",
                          width: `${stats.mitraPct}%`,
                          background: "#10b981",
                          transition: "width 0.3s ease",
                        }}
                        title={`Mitra: ${stats.mitraPct}%`}
                      />
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.72rem",
                        color: "#64748b",
                        marginTop: "5px",
                      }}
                    >
                      <span>
                        <span style={monoEmojiStyle}>🏢</span> BPBD: <b>{stats.bpbdPaket.toLocaleString("id-ID")} Paket</b>
                      </span>
                      <span>
                        <span style={monoEmojiStyle}>🤝</span> Mitra: <b>{stats.mitraPaket.toLocaleString("id-ID")} Paket</b>
                      </span>
                    </div>
                  </div>

                  {/* Logistics & Beneficiary Info - Clean 2-Card Layout */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                      fontSize: "0.82rem",
                    }}
                  >
                    <div
                      style={{
                        background: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" }}>
                          Bencana Terpantau
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          {selectedProvinsi.jiwaTerbantu > 0 ? `${selectedProvinsi.jiwaTerbantu.toLocaleString("id-ID")} Jiwa Terbantu` : "Kondisi Kondusif"}
                        </span>
                      </div>
                      <strong style={{ color: "#013220", fontSize: "0.90rem", display: "block", marginTop: "2px" }}>
                        {selectedProvinsi.kejadianBencana}
                      </strong>
                    </div>

                    <div
                      style={{
                        background: "#ffffff",
                        padding: "10px 14px",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <span style={{ color: "#64748b", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", display: "block" }}>
                        Penyaluran &amp; Mitra Terlibat
                      </span>
                      <div style={{ color: "#013220", fontWeight: 700, fontSize: "0.84rem", marginTop: "2px" }}>
                        {selectedProvinsi.jumlahBantuan}
                      </div>
                      <div style={{ color: "#475569", fontSize: "0.74rem", marginTop: "3px" }}>
                        Mitra: {selectedProvinsi.mitraBpbdAktif}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        background: "rgba(0,0,0,0.02)",
                        borderLeft: `3px solid ${
                          isBpbd ? "#013220" : isMitra ? "#10b981" : "#94a3b8"
                        }`,
                      }}
                    >
                      <p
                        style={{
                          margin: 0,
                          fontSize: "0.78rem",
                          color: "#334155",
                          fontStyle: "italic",
                          lineHeight: 1.45,
                        }}
                      >
                        "{selectedProvinsi.catatanKewilayahan}"
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    marginTop: "14px",
                    paddingTop: "10px",
                    borderTop: "1px solid #e2e8f0",
                    fontSize: "0.72rem",
                    color: "#94a3b8",
                    textAlign: "right",
                  }}
                >
                  ✓ Diperbarui berkala dari Sistem Pusdalops Nasional BPBD &amp; Jaringan Mitra
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}
