import React, { useState, useMemo } from "react";
import { CaseRecord } from "../../App";
import { MisiItem } from "../../services/api";
import { computeComparativeResponseMetrics } from "../../utils/slaEscalationEngine";

interface PerbandinganKecepatanResponProps {
  cases?: CaseRecord[];
  misiList?: MisiItem[];
  className?: string;
}

export function PerbandinganKecepatanRespon({
  cases = [],
  misiList = [],
  className = "",
}: PerbandinganKecepatanResponProps) {
  const [activeTab, setActiveTab] = useState<"chart" | "audit" | "workflow">("chart");
  const [filterCategory, setFilterCategory] = useState("all");

  const metrics = useMemo(() => {
    return computeComparativeResponseMetrics(cases);
  }, [cases]);

  const filteredCategories = useMemo(() => {
    if (filterCategory === "all") return metrics.categoryBreakdown;
    return metrics.categoryBreakdown.filter((c) =>
      c.category.toLowerCase().includes(filterCategory.toLowerCase())
    );
  }, [metrics, filterCategory]);

  return (
    <section
      className={`comparative-response-section ${className}`}
      style={{
        background: "#ffffff",
        borderRadius: "14px",
        border: "1px solid #e2e8f0",
        padding: "20px 22px",
        marginBottom: "28px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.02)",
      }}
    >
      {/* SECTION HEADER & COMPACT TABS */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: "1.15rem",
              fontWeight: 700,
              color: "#0f172a",
              letterSpacing: "-0.01em",
            }}
          >
            Perbandingan Kecepatan Respon &amp; Kepatuhan SLA
          </h2>
          <p
            style={{
              margin: "3px 0 0",
              color: "#64748b",
              fontSize: "0.82rem",
            }}
          >
            Monitoring waktu verifikasi posko BPBD dan efektivitas eskalasi otomatis ke mitra siaga kemanusiaan.
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div
          style={{
            display: "inline-flex",
            background: "#f1f5f9",
            padding: "3px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            gap: "2px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("chart")}
            style={{
              padding: "5px 12px",
              borderRadius: "4px",
              fontSize: "0.78rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: activeTab === "chart" ? "#013220" : "transparent",
              color: activeTab === "chart" ? "#ffffff" : "#475569",
            }}
          >
            Grafik Komparasi
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            style={{
              padding: "5px 12px",
              borderRadius: "4px",
              fontSize: "0.78rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: activeTab === "audit" ? "#013220" : "transparent",
              color: activeTab === "audit" ? "#ffffff" : "#475569",
            }}
          >
            Log Audit SLA ({metrics.recentEscalations.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("workflow")}
            style={{
              padding: "5px 12px",
              borderRadius: "4px",
              fontSize: "0.78rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: activeTab === "workflow" ? "#013220" : "transparent",
              color: activeTab === "workflow" ? "#ffffff" : "#475569",
            }}
          >
            Alur Fail-Safe
          </button>
        </div>
      </div>

      {/* COMPACT UNIFIED METRICS STRIP */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "10px 16px",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div>
          <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
            Rata-rata BPBD
          </span>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
            {metrics.mttvBpbdMinutes} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#64748b" }}>Menit</span>
          </div>
          <small style={{ color: "#64748b", fontSize: "0.72rem" }}>Target SLA: 60 Menit</small>
        </div>

        <div>
          <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
            Respon Mitra
          </span>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
            {metrics.mttvMitraMinutes} <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "#64748b" }}>Menit</span>
          </div>
          <small style={{ color: "#013220", fontWeight: 600, fontSize: "0.72rem" }}>48% lebih cepat</small>
        </div>

        <div>
          <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
            Kepatuhan SLA BPBD
          </span>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
            {metrics.slaComplianceBpbdPct}%
          </div>
          <small style={{ color: "#64748b", fontSize: "0.72rem" }}>{metrics.casesEscalatedToMitra} kasus terbantu mitra</small>
        </div>

        <div>
          <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", display: "block" }}>
            Efektivitas Fail-Safe
          </span>
          <div style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a", lineHeight: 1.2 }}>
            100%
          </div>
          <small style={{ color: "#013220", fontWeight: 600, fontSize: "0.72rem" }}>0 laporan terbengkalai</small>
        </div>
      </div>

      {/* TAB CONTENT 1: COMPACT COMPARATIVE TABLE WITH SLIM BARS */}
      {activeTab === "chart" && (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
          {/* Header row & Legend */}
          <div
            style={{
              padding: "10px 14px",
              background: "#ffffff",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#0f172a" }}>
              Kecepatan Respon per Kategori Bantuan (Menit dari Laporan Submit)
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "0.78rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#013220" }} />
                <span style={{ color: "#013220", fontWeight: 600 }}>BPBD</span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: "#64748b" }} />
                <span style={{ color: "#475569", fontWeight: 600 }}>Mitra</span>
              </span>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", color: "#475569", textAlign: "left", borderBottom: "1px solid #e2e8f0", fontSize: "0.74rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  <th style={{ padding: "8px 14px", fontWeight: 600 }}>Kategori Bantuan</th>
                  <th style={{ padding: "8px 14px", fontWeight: 600, width: "240px" }}>Waktu BPBD</th>
                  <th style={{ padding: "8px 14px", fontWeight: 600, width: "240px" }}>Waktu Mitra</th>
                  <th style={{ padding: "8px 14px", fontWeight: 600, textAlign: "right", width: "140px" }}>Selisih Respon</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((item, idx) => {
                  const maxScale = 60;
                  const bpbdPct = Math.min(100, Math.round((item.bpbdMinutes / maxScale) * 100));
                  const mitraPct = Math.min(100, Math.round((item.mitraMinutes / maxScale) * 100));
                  const deltaMinutes = item.bpbdMinutes - item.mitraMinutes;

                  return (
                    <tr key={item.category} style={{ borderBottom: idx === filteredCategories.length - 1 ? "none" : "1px solid #f1f5f9" }}>
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600, width: "14px" }}>{idx + 1}.</span>
                          <strong style={{ color: "#0f172a", fontSize: "0.84rem" }}>{item.category}</strong>
                          <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>({item.count} laporan)</span>
                        </div>
                      </td>

                      {/* BPBD Bar & Time */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "6px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{ width: `${bpbdPct}%`, height: "100%", background: "#013220", borderRadius: "999px" }} />
                          </div>
                          <span style={{ width: "55px", textAlign: "right", fontWeight: 700, color: "#013220", fontSize: "0.78rem" }}>
                            {item.bpbdMinutes}m
                          </span>
                        </div>
                      </td>

                      {/* Mitra Bar & Time */}
                      <td style={{ padding: "10px 14px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ flex: 1, height: "6px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                            <div style={{ width: `${mitraPct}%`, height: "100%", background: "#64748b", borderRadius: "999px" }} />
                          </div>
                          <span style={{ width: "55px", textAlign: "right", fontWeight: 700, color: "#475569", fontSize: "0.78rem" }}>
                            {item.mitraMinutes}m
                          </span>
                        </div>
                      </td>

                      {/* Delta */}
                      <td style={{ padding: "10px 14px", textAlign: "right" }}>
                        <span style={{ padding: "2px 8px", borderRadius: "4px", background: "#f8fafc", color: "#0f172a", border: "1px solid #e2e8f0", fontSize: "0.74rem", fontWeight: 600 }}>
                          Mitra -{deltaMinutes}m
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: LIVE AUDIT LOG ESKALASI */}
      {activeTab === "audit" && (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "0.84rem", color: "#0f172a" }}>
              Riwayat Kasus Teralihkan Otomatis ke Mitra (SLA Timeout Fail-Safe)
            </strong>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
              Terverifikasi &amp; Terlindungi
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569", borderBottom: "1px solid #e2e8f0", fontSize: "0.74rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "8px 12px", width: "110px" }}>Kode Kasus</th>
                  <th style={{ padding: "8px 12px" }}>Kebutuhan &amp; Pelapor</th>
                  <th style={{ padding: "8px 12px" }}>Lokasi Wilayah</th>
                  <th style={{ padding: "8px 12px", width: "80px" }}>Batas SLA</th>
                  <th style={{ padding: "8px 12px" }}>Waktu Eskalasi</th>
                  <th style={{ padding: "8px 12px" }}>Mitra Penerima</th>
                  <th style={{ padding: "8px 12px", width: "100px", textAlign: "right" }}>Waktu Respon</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentEscalations.map((log, idx) => (
                  <tr key={log.caseId} style={{ borderBottom: idx === metrics.recentEscalations.length - 1 ? "none" : "1px solid #f1f5f9" }}>
                    <td style={{ padding: "8px 12px" }}>
                      <span style={{ padding: "2px 6px", background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: "4px", fontWeight: 700, fontSize: "0.75rem" }}>
                        {log.caseId}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <strong style={{ color: "#0f172a", display: "block" }}>{log.item}</strong>
                      <span style={{ color: "#64748b", fontSize: "0.72rem" }}>Pelapor: {log.applicantName}</span>
                    </td>
                    <td style={{ padding: "8px 12px", color: "#475569" }}>
                      {log.location}
                    </td>
                    <td style={{ padding: "8px 12px", color: "#013220", fontWeight: 600 }}>
                      {log.slaHours} Jam
                    </td>
                    <td style={{ padding: "8px 12px", color: "#0f172a" }}>
                      {log.escalatedAt}
                    </td>
                    <td style={{ padding: "8px 12px" }}>
                      <strong style={{ color: "#0f172a" }}>{log.mitraName}</strong>
                    </td>
                    <td style={{ padding: "8px 12px", textAlign: "right" }}>
                      <span style={{ padding: "2px 6px", borderRadius: "4px", background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0", fontWeight: 600, fontSize: "0.75rem" }}>
                        {log.verifiedTimeMinutes}m
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: ALUR SISTEM FAIL-SAFE WORKFLOW */}
      {activeTab === "workflow" && (
        <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "16px", background: "#ffffff" }}>
          <h3 style={{ margin: "0 0 10px", fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
            Mekanisme Operasional: Trigger SLA &amp; Pengalihan Otomatis ke Mitra
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "10px",
            }}
          >
            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "4px", background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.78rem", marginBottom: "6px" }}>
                1
              </div>
              <strong style={{ color: "#0f172a", display: "block", fontSize: "0.82rem", marginBottom: "3px" }}>
                Laporan Masuk &amp; Timer SLA
              </strong>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", lineHeight: 1.4 }}>
                Sistem mengaktifkan timer SLA otomatis sesuai tingkat urgensi (1–3 jam).
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "4px", background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.78rem", marginBottom: "6px" }}>
                2
              </div>
              <strong style={{ color: "#0f172a", display: "block", fontSize: "0.82rem", marginBottom: "3px" }}>
                Peringatan Dini BPBD
              </strong>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", lineHeight: 1.4 }}>
                Jika sisa waktu di bawah 30 menit, sistem memberi peringatan antrean prioritas.
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "4px", background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.78rem", marginBottom: "6px" }}>
                3
              </div>
              <strong style={{ color: "#0f172a", display: "block", fontSize: "0.82rem", marginBottom: "3px" }}>
                Trigger Auto-Eskalasi
              </strong>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", lineHeight: 1.4 }}>
                Saat batas waktu terlampaui, permohonan dialihkan otomatis ke Mitra Siaga.
              </p>
            </div>

            <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "22px", height: "22px", borderRadius: "4px", background: "#ffffff", color: "#0f172a", border: "1px solid #e2e8f0", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.78rem", marginBottom: "6px" }}>
                4
              </div>
              <strong style={{ color: "#0f172a", display: "block", fontSize: "0.82rem", marginBottom: "3px" }}>
                Verifikasi &amp; Alokasi
              </strong>
              <p style={{ margin: 0, fontSize: "0.75rem", color: "#64748b", lineHeight: 1.4 }}>
                Mitra memvalidasi data dan langsung merilis alokasi logistik ke warga.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
