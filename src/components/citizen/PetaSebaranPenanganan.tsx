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

export function PetaSebaranPenanganan({
  cases = [],
  misiList = [],
  className = "",
}: PetaSebaranPenangananProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeStatusFilter, setActiveStatusFilter] = useState<
    "all_disaster" | "banyak_ditangani" | "sedang_ditangani" | "all_indonesia"
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
  const countBanyak = useMemo(
    () =>
      INDONESIA_PROVINCES_DATA.filter((p) => p.status === "banyak_ditangani")
        .length,
    []
  );
  const countSedang = useMemo(
    () =>
      INDONESIA_PROVINCES_DATA.filter((p) => p.status === "sedang_ditangani")
        .length,
    []
  );
  const totalJiwaTerbantu = useMemo(
    () =>
      INDONESIA_PROVINCES_DATA.reduce((acc, curr) => acc + curr.jiwaTerbantu, 0),
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
        activeStatusFilter === "banyak_ditangani" &&
        p.status !== "banyak_ditangani"
      )
        return false;
      if (
        activeStatusFilter === "sedang_ditangani" &&
        p.status !== "sedang_ditangani"
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

    // Render all provinces with choropleth colors
    INDONESIA_PROVINCES_DATA.forEach((p) => {
      const isGreen = p.status === "banyak_ditangani";
      const isYellow = p.status === "sedang_ditangani";
      const isSelected = selectedProvinsi?.id === p.id;

      let fillColor = "#e2e8f0"; // Neutral soft slate for non-disaster provinces
      let fillOpacity = 0.55;

      if (isGreen) {
        fillColor = "#16a34a"; // Hijau
        fillOpacity = isSelected ? 0.95 : 0.85;
      } else if (isYellow) {
        fillColor = "#eab308"; // Kuning
        fillOpacity = isSelected ? 0.95 : 0.85;
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
            isGreen ? "#15803d" : isYellow ? "#b45309" : "#334155"
          }; font-size: 13px;">${p.nama}</strong><br/>
          <span style="font-size: 11px; color: #64748b;">Wilayah ${p.pulau}</span>
          <div style="margin-top: 4px; font-weight: 700; color: #0f172a;">
            ${
              isGreen
                ? "🟢 Banyak Ditangani (" + p.persentasePenanganan + "%)"
                : isYellow
                ? "🟡 Sedang Ditangani (" + p.persentasePenanganan + "%)"
                : "⚪ Kondisi Terkendali"
            }
          </div>
          ${
            p.isDisasterZone
              ? `<div style="font-size: 11px; color: #475569; margin-top: 2px;">
                   Terbantu: <b>${p.jiwaTerbantu.toLocaleString(
                     "id-ID"
                   )} Jiwa</b>
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
      style={{ marginBottom: "32px" }}
    >
      {/* SECTION HEADER */}
      <div
        className="section-title"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "16px",
        }}
      >
        <div>
          <span
            className="eyebrow"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#16a34a",
              fontWeight: 700,
              fontSize: "0.78rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "4px",
            }}
          >
            <span>🇮🇩</span> Peta Sebaran Penanganan Bencana Nasional
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#013220",
              letterSpacing: "-0.02em",
            }}
          >
            Peta Seluruh Indonesia: Pantauan Penanganan Bencana BPBD &amp; Mitra
          </h2>
          <p
            style={{
              margin: "4px 0 0",
              color: "#64748b",
              fontSize: "0.86rem",
              maxWidth: "840px",
              lineHeight: 1.5,
            }}
          >
            Menampilkan kepulauan Indonesia secara utuh dari Sabang sampai
            Merauke. Daerah yang mengalami dampak bencana diberikan{" "}
            <strong>dua warna tegas</strong>: <strong>Hijau</strong> (banyak
            ditangani tuntas &gt;80%) dan <strong>Kuning</strong> (sedang dalam
            penanganan 40–79%), sementara wilayah lainnya berstatus terkendali.
          </p>
        </div>

        {/* VIEW MODE SWITCHER */}
        <div
          style={{
            display: "inline-flex",
            background: "#f1f5f9",
            padding: "4px",
            borderRadius: "10px",
            border: "1px solid #e2e8f0",
            gap: "4px",
          }}
        >
          <button
            type="button"
            onClick={() => setViewMode("vector")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: viewMode === "vector" ? "#013220" : "transparent",
              color: viewMode === "vector" ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🎨</span>
            <span>Mode Vektor Tematik</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("map")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: viewMode === "map" ? "#013220" : "transparent",
              color: viewMode === "map" ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <AppIcon name="map" size={15} />
            <span>Peta Geografis (Leaflet)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("table")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              background: viewMode === "table" ? "#013220" : "transparent",
              color: viewMode === "table" ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Rekapitulasi Data</span>
          </button>
        </div>
      </div>

      {/* METRIC HIGHLIGHTS CARDS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        {/* TOTAL PROVINSI */}
        <div
          style={{
            background: "#ffffff",
            padding: "14px 16px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            🗺️
          </div>
          <div>
            <span
              style={{
                fontSize: "0.72rem",
                color: "#64748b",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Cakupan Wilayah Indonesia
            </span>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.2,
              }}
            >
              {totalAllProvinces}{" "}
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                Provinsi
              </span>
            </div>
          </div>
        </div>

        {/* BANYAK DITANGANI (HIJAU) */}
        <div
          style={{
            background: "#f0fdf4",
            padding: "14px 16px",
            borderRadius: "14px",
            border: "1px solid #bbf7d0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(22, 163, 74, 0.05)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#16a34a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 2px 6px rgba(22, 163, 74, 0.3)",
            }}
          >
            <span
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#ffffff",
                display: "inline-block",
              }}
            />
          </div>
          <div>
            <span
              style={{
                fontSize: "0.72rem",
                color: "#166534",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Banyak Ditangani (Tuntas)
            </span>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#14532d",
                lineHeight: 1.2,
              }}
            >
              {countBanyak}{" "}
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                Provinsi ({Math.round((countBanyak / disasterProvinces.length) * 100)}%)
              </span>
            </div>
          </div>
        </div>

        {/* SEDANG DITANGANI (KUNING) */}
        <div
          style={{
            background: "#fefce8",
            padding: "14px 16px",
            borderRadius: "14px",
            border: "1px solid #fef08a",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(234, 179, 8, 0.05)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#eab308",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 2px 6px rgba(234, 179, 8, 0.3)",
            }}
          >
            <span
              style={{
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "#ffffff",
                display: "inline-block",
              }}
            />
          </div>
          <div>
            <span
              style={{
                fontSize: "0.72rem",
                color: "#854d0e",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Sedang Dalam Penanganan
            </span>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#713f12",
                lineHeight: 1.2,
              }}
            >
              {countSedang}{" "}
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                Provinsi ({Math.round((countSedang / disasterProvinces.length) * 100)}%)
              </span>
            </div>
          </div>
        </div>

        {/* WARGA TERBANTU */}
        <div
          style={{
            background: "#ffffff",
            padding: "14px 16px",
            borderRadius: "14px",
            border: "1px solid #e2e8f0",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#f1f5f9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
            }}
          >
            👥
          </div>
          <div>
            <span
              style={{
                fontSize: "0.72rem",
                color: "#64748b",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Warga Terdampak Terlayani
            </span>
            <div
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "#0f172a",
                lineHeight: 1.2,
              }}
            >
              {totalJiwaTerbantu.toLocaleString("id-ID")}{" "}
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                Jiwa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & SEARCH */}
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
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
          <button
            type="button"
            onClick={() => setActiveStatusFilter("all_disaster")}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border:
                activeStatusFilter === "all_disaster"
                  ? "1.5px solid #013220"
                  : "1px solid #cbd5e1",
              background:
                activeStatusFilter === "all_disaster" ? "#013220" : "#ffffff",
              color:
                activeStatusFilter === "all_disaster" ? "#ffffff" : "#334155",
            }}
          >
            Daerah Bencana Terpantau ({disasterProvinces.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusFilter("banyak_ditangani")}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border:
                activeStatusFilter === "banyak_ditangani"
                  ? "1.5px solid #16a34a"
                  : "1px solid #cbd5e1",
              background:
                activeStatusFilter === "banyak_ditangani" ? "#dcfce7" : "#ffffff",
              color:
                activeStatusFilter === "banyak_ditangani" ? "#15803d" : "#334155",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#16a34a",
              }}
            />
            Banyak Ditangani ({countBanyak})
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusFilter("sedang_ditangani")}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border:
                activeStatusFilter === "sedang_ditangani"
                  ? "1.5px solid #ca8a04"
                  : "1px solid #cbd5e1",
              background:
                activeStatusFilter === "sedang_ditangani" ? "#fef9c3" : "#ffffff",
              color:
                activeStatusFilter === "sedang_ditangani" ? "#854d0e" : "#334155",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#eab308",
              }}
            />
            Sedang Ditangani ({countSedang})
          </button>

          <button
            type="button"
            onClick={() => setActiveStatusFilter("all_indonesia")}
            style={{
              padding: "6px 14px",
              borderRadius: "999px",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s ease",
              border:
                activeStatusFilter === "all_indonesia"
                  ? "1.5px solid #475569"
                  : "1px solid #cbd5e1",
              background:
                activeStatusFilter === "all_indonesia" ? "#475569" : "#ffffff",
              color:
                activeStatusFilter === "all_indonesia" ? "#ffffff" : "#334155",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>🇮🇩</span>
            Seluruh Indonesia ({totalAllProvinces})
          </button>
        </div>

        {/* ISLAND DROPDOWN & SEARCH */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <select
            value={selectedPulau}
            onChange={(e) => setSelectedPulau(e.target.value)}
            style={{
              padding: "6px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.8rem",
              background: "#ffffff",
              color: "#334155",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {islandsList.map((is) => (
              <option key={is} value={is}>
                {is}
              </option>
            ))}
          </select>

          <div style={{ position: "relative" }}>
            <span
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#94a3b8",
                fontSize: "13px",
              }}
            >
              🔍
            </span>
            <input
              type="text"
              placeholder="Cari provinsi atau mitra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: "6px 12px 6px 30px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "0.8rem",
                width: "210px",
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
                    color: "#475569",
                    borderBottom: "1.5px solid #cbd5e1",
                  }}
                >
                  <th style={{ padding: "10px 14px", width: "40px" }}>No</th>
                  <th style={{ padding: "10px 14px" }}>Provinsi</th>
                  <th style={{ padding: "10px 14px", width: "110px" }}>
                    Wilayah Pulau
                  </th>
                  <th style={{ padding: "10px 14px", width: "120px" }}>
                    Warna Peta
                  </th>
                  <th style={{ padding: "10px 14px", width: "170px" }}>
                    Status Penanganan
                  </th>
                  <th
                    style={{
                      padding: "10px 14px",
                      width: "90px",
                      textAlign: "center",
                    }}
                  >
                    Cakupan
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
                  const isGreen = p.status === "banyak_ditangani";
                  const isYellow = p.status === "sedang_ditangani";

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
                              width: "18px",
                              height: "18px",
                              borderRadius: "4px",
                              background: isGreen
                                ? "#16a34a"
                                : isYellow
                                ? "#eab308"
                                : "#cbd5e1",
                              display: "inline-block",
                              border: `1.5px solid ${
                                isGreen
                                  ? "#15803d"
                                  : isYellow
                                  ? "#ca8a04"
                                  : "#94a3b8"
                              }`,
                            }}
                          />
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: "0.78rem",
                              color: isGreen
                                ? "#166534"
                                : isYellow
                                ? "#854d0e"
                                : "#64748b",
                            }}
                          >
                            {isGreen
                              ? "Hijau"
                              : isYellow
                              ? "Kuning"
                              : "Netral"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "10px 14px" }}>
                        <span
                          style={{
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            background: isGreen
                              ? "#f0fdf4"
                              : isYellow
                              ? "#fefce8"
                              : "#f8fafc",
                            color: isGreen
                              ? "#15803d"
                              : isYellow
                              ? "#a16207"
                              : "#64748b",
                            border: `1px solid ${
                              isGreen
                                ? "#bbf7d0"
                                : isYellow
                                ? "#fde047"
                                : "#e2e8f0"
                            }`,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span>{isGreen ? "🟢" : isYellow ? "🟡" : "⚪"}</span>
                          <span>
                            {isGreen
                              ? "Banyak Ditangani"
                              : isYellow
                              ? "Sedang Ditangani"
                              : "Terkendali"}
                          </span>
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "10px 14px",
                          textAlign: "center",
                          fontWeight: 700,
                          color: isGreen
                            ? "#15803d"
                            : isYellow
                            ? "#b45309"
                            : "#64748b",
                        }}
                      >
                        {p.persentasePenanganan}%
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
                    const isGreen = p.status === "banyak_ditangani";
                    const isYellow = p.status === "sedang_ditangani";
                    const isSelected = selectedProvinsi?.id === p.id;

                    let fillColor = "#e2e8f0"; // Neutral soft slate
                    let fillOpacity = 0.55;

                    if (isGreen) {
                      fillColor = "#16a34a"; // Hijau
                      fillOpacity = isSelected ? 0.98 : 0.88;
                    } else if (isYellow) {
                      fillColor = "#eab308"; // Kuning
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
                            {isGreen
                              ? "🟢 Banyak Ditangani (" +
                                p.persentasePenanganan +
                                "%)"
                              : isYellow
                              ? "🟡 Sedang Ditangani (" +
                                p.persentasePenanganan +
                                "%)"
                              : "⚪ Kondisi Terkendali"}
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
                              fill={isGreen ? "#15803d" : "#ca8a04"}
                              stroke="#ffffff"
                              strokeWidth={isSelected ? 2.5 : 1.8}
                            />
                            {/* Province Label */}
                            <text
                              x={p.svgCenter[0]}
                              y={p.svgCenter[1] - 8}
                              textAnchor="middle"
                              fill="#0f172a"
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
                            {/* Coverage Percentage */}
                            <text
                              x={p.svgCenter[0]}
                              y={p.svgCenter[1] + 14}
                              textAnchor="middle"
                              fill={isGreen ? "#14532d" : "#713f12"}
                              fontSize="8px"
                              fontWeight="800"
                              style={{
                                textShadow:
                                  "0 1px 2px rgba(255,255,255,0.9)",
                              }}
                            >
                              {p.persentasePenanganan}%
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

            {/* LEGENDA DUA WARNA (BOTTOM LEFT OVERLAY) */}
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
                maxWidth: "270px",
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
                LEGENDA DUA WARNA
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
                    background: "#16a34a",
                    border: "1.5px solid #ffffff",
                    borderRadius: "3px",
                    display: "inline-block",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }}
                />
                <span style={{ color: "#166534", fontWeight: 700 }}>
                  Hijau: Banyak Ditangani (&gt;80%)
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
                    background: "#eab308",
                    border: "1.5px solid #ffffff",
                    borderRadius: "3px",
                    display: "inline-block",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                  }}
                />
                <span style={{ color: "#854d0e", fontWeight: 700 }}>
                  Kuning: Sedang Ditangani (40-79%)
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
                *Garis putih memisahkan batas provinsi yang saling terhubung
              </small>
            </div>
          </div>

          {/* DETAIL PANEL OF SELECTED PROVINSI */}
          {selectedProvinsi && (
            <div
              style={{
                background:
                  selectedProvinsi.status === "banyak_ditangani"
                    ? "#fbfdfb"
                    : selectedProvinsi.status === "sedang_ditangani"
                    ? "#fffef9"
                    : "#fafafa",
                border:
                  selectedProvinsi.status === "banyak_ditangani"
                    ? "1.5px solid #86efac"
                    : selectedProvinsi.status === "sedang_ditangani"
                    ? "1.5px solid #fde047"
                    : "1.5px solid #e2e8f0",
                borderRadius: "14px",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
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
                      background:
                        selectedProvinsi.status === "banyak_ditangani"
                          ? "#dcfce7"
                          : selectedProvinsi.status === "sedang_ditangani"
                          ? "#fef9c3"
                          : "#f1f5f9",
                      color:
                        selectedProvinsi.status === "banyak_ditangani"
                          ? "#15803d"
                          : selectedProvinsi.status === "sedang_ditangani"
                          ? "#854d0e"
                          : "#475569",
                      border: `1px solid ${
                        selectedProvinsi.status === "banyak_ditangani"
                          ? "#86efac"
                          : selectedProvinsi.status === "sedang_ditangani"
                          ? "#fde047"
                          : "#cbd5e1"
                      }`,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <span>
                      {selectedProvinsi.status === "banyak_ditangani"
                        ? "🟢"
                        : selectedProvinsi.status === "sedang_ditangani"
                        ? "🟡"
                        : "⚪"}
                    </span>
                    <span>
                      {selectedProvinsi.status === "banyak_ditangani"
                        ? "Banyak Ditangani"
                        : selectedProvinsi.status === "sedang_ditangani"
                        ? "Sedang Ditangani"
                        : "Kondisi Terkendali"}
                    </span>
                  </span>
                </div>

                {/* Progress bar penanganan */}
                <div style={{ margin: "12px 0 16px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      marginBottom: "4px",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>
                      Cakupan Bantuan Tersalurkan
                    </span>
                    <span
                      style={{
                        color:
                          selectedProvinsi.status === "banyak_ditangani"
                            ? "#15803d"
                            : selectedProvinsi.status === "sedang_ditangani"
                            ? "#b45309"
                            : "#64748b",
                      }}
                    >
                      {selectedProvinsi.persentasePenanganan}%
                    </span>
                  </div>
                  <div
                    style={{
                      height: "8px",
                      background: "#e2e8f0",
                      borderRadius: "999px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: `${selectedProvinsi.persentasePenanganan}%`,
                        background:
                          selectedProvinsi.status === "banyak_ditangani"
                            ? "#16a34a"
                            : selectedProvinsi.status === "sedang_ditangani"
                            ? "#eab308"
                            : "#94a3b8",
                        borderRadius: "999px",
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Logistics & Beneficiary Info */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    fontSize: "0.82rem",
                  }}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        display: "block",
                      }}
                    >
                      Bencana Terpantau:
                    </span>
                    <strong style={{ color: "#013220", fontSize: "0.88rem" }}>
                      {selectedProvinsi.kejadianBencana}
                    </strong>
                    <div
                      style={{
                        color: "#475569",
                        fontSize: "0.75rem",
                        marginTop: "2px",
                      }}
                    >
                      Realisasi: {selectedProvinsi.jumlahBantuan}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        display: "block",
                      }}
                    >
                      Warga Terlayani:
                    </span>
                    <strong style={{ color: "#013220", fontSize: "0.88rem" }}>
                      {selectedProvinsi.jiwaTerbantu > 0
                        ? `${selectedProvinsi.jiwaTerbantu.toLocaleString(
                            "id-ID"
                          )} Jiwa (${selectedProvinsi.kkTerlayani.toLocaleString(
                            "id-ID"
                          )} KK)`
                        : "Kondisi Kondusif (Nihil Pengungsi)"}
                    </strong>
                    <div
                      style={{
                        color: "#475569",
                        fontSize: "0.75rem",
                        marginTop: "2px",
                      }}
                    >
                      Komoditas: {selectedProvinsi.komoditasUtama}
                    </div>
                  </div>

                  <div
                    style={{
                      background: "#ffffff",
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span
                      style={{
                        color: "#64748b",
                        fontSize: "0.72rem",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        display: "block",
                      }}
                    >
                      Mitra &amp; Satgas BPBD di Lapangan:
                    </span>
                    <span style={{ color: "#013220", fontWeight: 600 }}>
                      {selectedProvinsi.mitraBpbdAktif}
                    </span>
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "0.72rem",
                        marginTop: "4px",
                      }}
                    >
                      Pusat Komando: {selectedProvinsi.poskoPenyangga}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: "8px 10px",
                      borderRadius: "8px",
                      background: "rgba(0,0,0,0.02)",
                      borderLeft: `3px solid ${
                        selectedProvinsi.status === "banyak_ditangani"
                          ? "#16a34a"
                          : selectedProvinsi.status === "sedang_ditangani"
                          ? "#eab308"
                          : "#94a3b8"
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
                ✓ Diperbarui berkala dari Sistem Pusdalops Nasional BPBD
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
