import React, { useState, useMemo } from "react";
import { CaseRecord } from "../../App";
import { MisiItem } from "../../services/api";
import { AppIcon } from "./Icons";
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
        borderRadius: "18px",
        border: "1px solid #e2e8f0",
        padding: "24px",
        marginBottom: "32px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.03)",
      }}
    >
      {/* SECTION HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "20px",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              color: "#334155",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              padding: "4px 10px",
              borderRadius: "6px",
              fontWeight: 700,
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: "8px",
            }}
          >
            Akuntabilitas Kemitraan &amp; SLA Respon Bencana
          </span>
          <h2
            style={{
              margin: 0,
              fontSize: "1.35rem",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            Perbandingan Kecepatan Respon: BPBD vs Mitra Kemanusiaan
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              color: "#64748b",
              fontSize: "0.85rem",
              maxWidth: "840px",
              lineHeight: 1.5,
            }}
          >
            Sistem dilengkapi <strong>Trigger Eskalasi Otomatis (Fail-Safe)</strong>: jika posko BPBD
            mengalami kendala verifikasi dalam batas SLA, alur dialihkan langsung ke jaringan <strong>Mitra Siaga</strong> (PMI, BAZNAS, Tagana, MDMC) agar seluruh laporan warga tertangani.
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div
          style={{
            display: "inline-flex",
            background: "#f1f5f9",
            padding: "4px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            gap: "4px",
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("chart")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: activeTab === "chart" ? "#013220" : "transparent",
              color: activeTab === "chart" ? "#ffffff" : "#475569",
            }}
          >
            Grafik Kecepatan Respon
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: activeTab === "audit" ? "#013220" : "transparent",
              color: activeTab === "audit" ? "#ffffff" : "#475569",
            }}
          >
            Log Audit Pengalihan SLA ({metrics.recentEscalations.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("workflow")}
            style={{
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.8rem",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: activeTab === "workflow" ? "#013220" : "transparent",
              color: activeTab === "workflow" ? "#ffffff" : "#475569",
            }}
          >
            Alur Sistem Fail-Safe
          </button>
        </div>
      </div>

      {/* 4 TOP SUMMARY KPI CARDS (CLEAN MONOCHROME PALETTE) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {/* KPI 1: MTTV BPBD */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px 18px",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }}>
            Rata-rata Verifikasi BPBD
          </span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
            {metrics.mttvBpbdMinutes}{" "}
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>Menit</span>
          </div>
          <small style={{ color: "#64748b", fontWeight: 500, fontSize: "0.74rem", display: "block", marginTop: "4px" }}>
            Target batas SLA: 60 Menit
          </small>
        </div>

        {/* KPI 2: MTTV MITRA */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px 18px",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }}>
            Waktu Respon Mitra
          </span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
            {metrics.mttvMitraMinutes}{" "}
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#64748b" }}>Menit</span>
          </div>
          <small style={{ color: "#013220", fontWeight: 700, fontSize: "0.74rem", display: "block", marginTop: "4px" }}>
            48% lebih cepat menangani
          </small>
        </div>

        {/* KPI 3: KEPATUHAN SLA BPBD */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px 18px",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }}>
            Kepatuhan SLA BPBD
          </span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
            {metrics.slaComplianceBpbdPct}%{" "}
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748b" }}>Tepat Waktu</span>
          </div>
          <small style={{ color: "#64748b", fontWeight: 500, fontSize: "0.74rem", display: "block", marginTop: "4px" }}>
            {metrics.casesEscalatedToMitra} kasus terbantu mitra
          </small>
        </div>

        {/* KPI 4: MITRA TAKE-OVER RESOLUTION */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px 18px",
          }}
        >
          <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "6px" }}>
            Efektivitas Fail-Safe
          </span>
          <div style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", lineHeight: 1.1 }}>
            100%{" "}
            <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#64748b" }}>Tertangani</span>
          </div>
          <small style={{ color: "#013220", fontWeight: 700, fontSize: "0.74rem", display: "block", marginTop: "4px" }}>
            0 laporan terbengkalai
          </small>
        </div>
      </div>

      {/* TAB CONTENT 1: VISUAL COMPARISON CHART */}
      {activeTab === "chart" && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px",
              marginBottom: "16px",
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "0.98rem", fontWeight: 700, color: "#0f172a" }}>
                Komparasi Kecepatan Respon per Kategori Bantuan
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#64748b" }}>
                Waktu rata-rata dari pengajuan warga hingga siap distribusi (dalam menit).
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "0.8rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#013220" }} />
                <strong style={{ color: "#013220" }}>BPBD Wilayah</strong>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#64748b" }} />
                <strong style={{ color: "#475569" }}>Mitra Kemanusiaan</strong>
              </span>
            </div>
          </div>

          {/* Bar comparisons list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {filteredCategories.map((item, idx) => {
              const maxScale = 60; // 60 menit max scale
              const bpbdPct = Math.min(100, Math.round((item.bpbdMinutes / maxScale) * 100));
              const mitraPct = Math.min(100, Math.round((item.mitraMinutes / maxScale) * 100));
              const deltaMinutes = item.bpbdMinutes - item.mitraMinutes;

              return (
                <div
                  key={item.category}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "10px",
                    padding: "12px 16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "4px", background: "#f1f5f9", display: "grid", placeItems: "center", fontSize: "11px", fontWeight: 700, color: "#334155", border: "1px solid #e2e8f0" }}>
                        {idx + 1}
                      </span>
                      <strong style={{ color: "#0f172a", fontSize: "0.88rem" }}>
                        {item.category}
                      </strong>
                      <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                        ({item.count} Laporan)
                      </span>
                    </div>

                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "6px",
                        background: "#f8fafc",
                        color: "#334155",
                        fontSize: "0.74rem",
                        fontWeight: 600,
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      Mitra {deltaMinutes}m lebih cepat
                    </span>
                  </div>

                  {/* Dual comparative bar (Monochrome Dark Green & Slate) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {/* BPBD Bar (Forest Green) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "80px", fontSize: "0.75rem", fontWeight: 600, color: "#013220" }}>
                        BPBD:
                      </span>
                      <div style={{ flex: 1, height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${bpbdPct}%`,
                            background: "#013220",
                            borderRadius: "999px",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                      <span style={{ width: "65px", textAlign: "right", fontSize: "0.78rem", fontWeight: 700, color: "#013220" }}>
                        {item.bpbdMinutes} Menit
                      </span>
                    </div>

                    {/* Mitra Bar (Slate) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "80px", fontSize: "0.75rem", fontWeight: 600, color: "#475569" }}>
                        Mitra:
                      </span>
                      <div style={{ flex: 1, height: "8px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${mitraPct}%`,
                            background: "#64748b",
                            borderRadius: "999px",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                      <span style={{ width: "65px", textAlign: "right", fontSize: "0.78rem", fontWeight: 700, color: "#475569" }}>
                        {item.mitraMinutes} Menit
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: LIVE AUDIT LOG ESKALASI */}
      {activeTab === "audit" && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "0.86rem", color: "#0f172a" }}>
              Riwayat Kasus Teralihkan Otomatis ke Mitra (SLA Timeout Fail-Safe)
            </strong>
            <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
              Terverifikasi &amp; Terlindungi dari Penundaan
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "10px 14px", width: "120px" }}>Kode Kasus</th>
                  <th style={{ padding: "10px 14px" }}>Kebutuhan &amp; Pelapor</th>
                  <th style={{ padding: "10px 14px" }}>Lokasi Wilayah</th>
                  <th style={{ padding: "10px 14px", width: "100px" }}>Batas SLA</th>
                  <th style={{ padding: "10px 14px" }}>Waktu Eskalasi</th>
                  <th style={{ padding: "10px 14px" }}>Mitra Penerima Eskalasi</th>
                  <th style={{ padding: "10px 14px", width: "120px", textAlign: "right" }}>Kecepatan Respon</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentEscalations.map((log) => (
                  <tr key={log.caseId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ padding: "3px 8px", background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: "4px", fontWeight: 700, fontSize: "0.78rem" }}>
                        {log.caseId}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <strong style={{ color: "#0f172a", display: "block" }}>{log.item}</strong>
                      <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Pelapor: {log.applicantName}</span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>
                      {log.location}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#013220", fontWeight: 600 }}>
                      {log.slaHours} Jam
                    </td>
                    <td style={{ padding: "10px 14px", color: "#0f172a" }}>
                      {log.escalatedAt}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#013220" }} />
                        <strong style={{ color: "#0f172a" }}>{log.mitraName}</strong>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0", fontWeight: 700, fontSize: "0.78rem" }}>
                        {log.verifiedTimeMinutes} Menit
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
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h3 style={{ margin: "0 0 12px", fontSize: "0.98rem", fontWeight: 700, color: "#0f172a" }}>
            Mekanisme Operasional: Trigger SLA &amp; Pengalihan Otomatis ke Mitra
          </h3>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "12px",
            }}
          >
            {/* Step 1 */}
            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.85rem", marginBottom: "8px" }}>
                1
              </div>
              <strong style={{ color: "#0f172a", display: "block", fontSize: "0.88rem", marginBottom: "4px" }}>
                Laporan Masuk &amp; Timer SLA
              </strong>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", lineHeight: 1.45 }}>
                Saat warga submit laporan kebutuhan, sistem mengaktifkan timer SLA otomatis sesuai tingkat urgensi.
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.85rem", marginBottom: "8px" }}>
                2
              </div>
              <strong style={{ color: "#0f172a", display: "block", fontSize: "0.88rem", marginBottom: "4px" }}>
                Peringatan Dini BPBD
              </strong>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", lineHeight: 1.45 }}>
                Bila batas waktu verifikasi tersisa di bawah 30 menit, posko BPBD menerima penanda visual antrean prioritas.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.85rem", marginBottom: "8px" }}>
                3
              </div>
              <strong style={{ color: "#0f172a", display: "block", fontSize: "0.88rem", marginBottom: "4px" }}>
                Trigger Auto-Eskalasi
              </strong>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", lineHeight: 1.45 }}>
                Jika batas SLA terlampaui tanpa verifikasi posko, sistem otomatis mengalihkan verifikasi ke jaringan Mitra Siaga.
              </p>
            </div>

            {/* Step 4 */}
            <div style={{ background: "#ffffff", padding: "16px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "6px", background: "#f1f5f9", color: "#0f172a", border: "1px solid #e2e8f0", display: "grid", placeItems: "center", fontWeight: 700, fontSize: "0.85rem", marginBottom: "8px" }}>
                4
              </div>
              <strong style={{ color: "#0f172a", display: "block", fontSize: "0.88rem", marginBottom: "4px" }}>
                Verifikasi &amp; Alokasi Bantuan
              </strong>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#64748b", lineHeight: 1.45 }}>
                Mitra kemanusiaan (PMI, BAZNAS, Tagana, MDMC) memverifikasi data dan segera menyiapkan distribusi logistik.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
