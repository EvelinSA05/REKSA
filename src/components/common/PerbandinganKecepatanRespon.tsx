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
              color: "#013220",
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              padding: "3px 10px",
              borderRadius: "999px",
              fontWeight: 800,
              fontSize: "0.72rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "8px",
            }}
          >
            <span>⚡</span> Akuntabilitas Kemitraan &amp; SLA Respon Bencana
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
            Perbandingan Kecepatan Respon: BPBD vs Mitra Kemanusiaan
          </h2>
          <p
            style={{
              margin: "6px 0 0",
              color: "#475569",
              fontSize: "0.88rem",
              maxWidth: "840px",
              lineHeight: 1.5,
            }}
          >
            Sistem dilengkapi <strong>Trigger Eskalasi Otomatis (Fail-Safe)</strong>: jika posko BPBD
            mengalami kendala atau telat memverifikasi laporan warga dalam batas SLA (1–3 jam),
            verifikasi dialihkan langsung ke jaringan <strong>Mitra Siaga</strong> (PMI, BAZNAS, Tagana, MDMC)
            agar tidak ada warga terdampak yang terbengkalai.
          </p>
        </div>

        {/* TAB SWITCHER */}
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
            onClick={() => setActiveTab("chart")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: activeTab === "chart" ? "#013220" : "transparent",
              color: activeTab === "chart" ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>📊</span>
            <span>Grafik Kecepatan Respon</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("audit")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: activeTab === "audit" ? "#013220" : "transparent",
              color: activeTab === "audit" ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>📋</span>
            <span>Log Audit Pengalihan SLA ({metrics.recentEscalations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("workflow")}
            style={{
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "0.8rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
              background: activeTab === "workflow" ? "#013220" : "transparent",
              color: activeTab === "workflow" ? "#ffffff" : "#475569",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>⚙️</span>
            <span>Alur Sistem Fail-Safe</span>
          </button>
        </div>
      </div>

      {/* 4 TOP SUMMARY KPI CARDS (UNIFIED GREEN & WHITE THEME) */}
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
            borderRadius: "14px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#ecfdf5",
              color: "#013220",
              border: "1px solid #d1fae5",
              display: "grid",
              placeItems: "center",
              fontSize: "20px",
            }}
          >
            🏢
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
              Rata-rata Waktu Verifikasi BPBD
            </span>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#013220", lineHeight: 1.2 }}>
              {metrics.mttvBpbdMinutes}{" "}
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Menit</span>
            </div>
            <small style={{ color: "#047857", fontWeight: 700, fontSize: "0.74rem" }}>
              ✓ Target SLA: 60 Menit
            </small>
          </div>
        </div>

        {/* KPI 2: MTTV MITRA (HIGHLIGHT CARD) */}
        <div
          style={{
            background: "#f0fdf4",
            border: "1.5px solid #10b981",
            borderRadius: "14px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
            boxShadow: "0 4px 14px rgba(1, 50, 32, 0.06)",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#013220",
              color: "#ffffff",
              display: "grid",
              placeItems: "center",
              fontSize: "20px",
              boxShadow: "0 2px 6px rgba(1, 50, 32, 0.25)",
            }}
          >
            🤝
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "#013220", fontWeight: 700, textTransform: "uppercase" }}>
              Waktu Respon Mitra (Tanggap Darurat)
            </span>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#013220", lineHeight: 1.2 }}>
              {metrics.mttvMitraMinutes}{" "}
              <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Menit</span>
            </div>
            <small style={{ color: "#047857", fontWeight: 800, fontSize: "0.74rem" }}>
              ⚡ 48% Lebih Cepat Menangani
            </small>
          </div>
        </div>

        {/* KPI 3: KEPATUHAN SLA BPBD */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#ecfdf5",
              color: "#047857",
              border: "1px solid #d1fae5",
              display: "grid",
              placeItems: "center",
              fontSize: "20px",
            }}
          >
            ⏱️
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
              Kepatuhan SLA Posko BPBD
            </span>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#013220", lineHeight: 1.2 }}>
              {metrics.slaComplianceBpbdPct}%{" "}
              <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>Tepat Waktu</span>
            </div>
            <small style={{ color: "#047857", fontWeight: 700, fontSize: "0.74rem" }}>
              {metrics.casesEscalatedToMitra} Laporan (21%) Terbantu Mitra
            </small>
          </div>
        </div>

        {/* KPI 4: MITRA TAKE-OVER RESOLUTION */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "14px",
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "10px",
              background: "#ecfdf5",
              color: "#013220",
              border: "1px solid #d1fae5",
              display: "grid",
              placeItems: "center",
              fontSize: "20px",
            }}
          >
            🛡️
          </div>
          <div>
            <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
              Efektivitas Fail-Safe Mitra
            </span>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#013220", lineHeight: 1.2 }}>
              100%{" "}
              <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>Tertangani</span>
            </div>
            <small style={{ color: "#047857", fontWeight: 700, fontSize: "0.74rem" }}>
              ✓ 0 Laporan Terbengkalai
            </small>
          </div>
        </div>
      </div>

      {/* TAB CONTENT 1: VISUAL COMPARISON CHART */}
      {activeTab === "chart" && (
        <div
          style={{
            background: "#fcfdfc",
            border: "1.5px solid #d1fae5",
            borderRadius: "14px",
            padding: "20px",
            boxShadow: "0 4px 18px rgba(1, 50, 32, 0.03)",
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
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 800, color: "#013220" }}>
                Komparasi Kecepatan Respon per Kategori Bantuan
              </h3>
              <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#475569" }}>
                Satuan dalam menit dari waktu warga submit hingga terverifikasi sah dan siap distribusi.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px", fontSize: "0.8rem" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#013220" }} />
                <strong style={{ color: "#013220" }}>BPBD Wilayah</strong>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "3px", background: "#10b981" }} />
                <strong style={{ color: "#047857" }}>Mitra Kemanusiaan</strong>
              </span>
            </div>
          </div>

          {/* Bar comparisons list */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                    borderRadius: "12px",
                    padding: "14px 16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "22px", height: "22px", borderRadius: "6px", background: "#ecfdf5", display: "grid", placeItems: "center", fontSize: "11px", fontWeight: 700, color: "#013220", border: "1px solid #d1fae5" }}>
                        {idx + 1}
                      </span>
                      <strong style={{ color: "#013220", fontSize: "0.88rem" }}>
                        {item.category}
                      </strong>
                      <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                        ({item.count} Laporan Terpantau)
                      </span>
                    </div>

                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "999px",
                        background: "#ecfdf5",
                        color: "#013220",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        border: "1px solid #a7f3d0",
                      }}
                    >
                      ⚡ Mitra {deltaMinutes}m lebih cepat
                    </span>
                  </div>

                  {/* Dual comparative bar (Green & White Theme) */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {/* BPBD Bar (Forest Green) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "95px", fontSize: "0.75rem", fontWeight: 700, color: "#013220" }}>
                        🏢 BPBD:
                      </span>
                      <div style={{ flex: 1, height: "10px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
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
                      <span style={{ width: "65px", textAlign: "right", fontSize: "0.78rem", fontWeight: 800, color: "#013220" }}>
                        {item.bpbdMinutes} Menit
                      </span>
                    </div>

                    {/* Mitra Bar (Emerald Green) */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <span style={{ width: "95px", fontSize: "0.75rem", fontWeight: 700, color: "#047857" }}>
                        🤝 Mitra:
                      </span>
                      <div style={{ flex: 1, height: "10px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden" }}>
                        <div
                          style={{
                            height: "100%",
                            width: `${mitraPct}%`,
                            background: "#10b981",
                            borderRadius: "999px",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                      <span style={{ width: "65px", textAlign: "right", fontSize: "0.78rem", fontWeight: 800, color: "#047857" }}>
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
            border: "1.5px solid #d1fae5",
            borderRadius: "14px",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 16px", background: "#f0fdf4", borderBottom: "1px solid #d1fae5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "0.86rem", color: "#013220" }}>
              Riwayat Kasus Teralihkan Otomatis ke Mitra (SLA Timeout Fail-Safe)
            </strong>
            <span style={{ fontSize: "0.75rem", color: "#047857", fontWeight: 600 }}>
              Terverifikasi &amp; Terlindungi dari Penundaan
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left", color: "#013220", borderBottom: "1.5px solid #e2e8f0" }}>
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
                      <span style={{ padding: "3px 8px", background: "#f1f5f9", color: "#013220", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: 800, fontSize: "0.78rem" }}>
                        {log.caseId}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <strong style={{ color: "#013220", display: "block" }}>{log.item}</strong>
                      <span style={{ color: "#64748b", fontSize: "0.75rem" }}>Pelapor: {log.applicantName}</span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "#475569" }}>
                      {log.location}
                    </td>
                    <td style={{ padding: "10px 14px", color: "#047857", fontWeight: 700 }}>
                      {log.slaHours} Jam
                    </td>
                    <td style={{ padding: "10px 14px", color: "#013220", fontWeight: 600 }}>
                      {log.escalatedAt}
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }} />
                        <strong style={{ color: "#013220" }}>{log.mitraName}</strong>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "6px", background: "#ecfdf5", color: "#013220", border: "1px solid #a7f3d0", fontWeight: 800, fontSize: "0.78rem" }}>
                        ⚡ {log.verifiedTimeMinutes} Menit
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
            border: "1.5px solid #d1fae5",
            borderRadius: "14px",
            padding: "20px",
          }}
        >
          <h3 style={{ margin: "0 0 12px", fontSize: "1.05rem", fontWeight: 800, color: "#013220" }}>
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
            <div style={{ background: "#fcfdfc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#ecfdf5", color: "#013220", border: "1px solid #bbf7d0", display: "grid", placeItems: "center", fontWeight: 800, marginBottom: "8px" }}>
                1
              </div>
              <strong style={{ color: "#013220", display: "block", fontSize: "0.88rem", marginBottom: "4px" }}>
                Laporan Masuk &amp; Timer SLA
              </strong>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: 1.45 }}>
                Saat warga submit laporan kebutuhan, sistem mengaktifkan timer SLA otomatis (Kritis: 1 jam, Tinggi: 2 jam, Normal: 3 jam).
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ background: "#fcfdfc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#ecfdf5", color: "#013220", border: "1px solid #bbf7d0", display: "grid", placeItems: "center", fontWeight: 800, marginBottom: "8px" }}>
                2
              </div>
              <strong style={{ color: "#013220", display: "block", fontSize: "0.88rem", marginBottom: "4px" }}>
                Peringatan Dini BPBD
              </strong>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: 1.45 }}>
                Bila sisa waktu verifikasi di bawah 30 menit, posko BPBD mendapat alert visual dan pengingat antrean prioritas.
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ background: "#fcfdfc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#ecfdf5", color: "#013220", border: "1px solid #bbf7d0", display: "grid", placeItems: "center", fontWeight: 800, marginBottom: "8px" }}>
                3
              </div>
              <strong style={{ color: "#013220", display: "block", fontSize: "0.88rem", marginBottom: "4px" }}>
                Trigger Auto-Eskalasi
              </strong>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: 1.45 }}>
                Jika batas waktu terlampaui tanpa aksi posko, sistem secara otomatis mengalihkan verifikasi ke jaringan Mitra Kemanusiaan siaga terdekat.
              </p>
            </div>

            {/* Step 4 */}
            <div style={{ background: "#fcfdfc", padding: "16px", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "#ecfdf5", color: "#013220", border: "1px solid #bbf7d0", display: "grid", placeItems: "center", fontWeight: 800, marginBottom: "8px" }}>
                4
              </div>
              <strong style={{ color: "#013220", display: "block", fontSize: "0.88rem", marginBottom: "4px" }}>
                Verifikasi &amp; Rilis Bantuan
              </strong>
              <p style={{ margin: 0, fontSize: "0.78rem", color: "#475569", lineHeight: 1.45 }}>
                Mitra (PMI, BAZNAS, Tagana, MDMC) memverifikasi dan langsung menerbitkan alokasi logistik ke warga tanpa jeda birokrasi.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
