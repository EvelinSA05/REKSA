import React, { useMemo } from "react";
import { CaseRecord } from "../../App";
import { MisiItem } from "../../services/api";

interface PersBaranResponBantuanProps {
  cases?: CaseRecord[];
  misiList?: MisiItem[];
}

// ── helpers ──────────────────────────────────────────────────────────────────

function pctBar(pct: number, color: string, track = "#e2e8f0") {
  return (
    <div
      style={{
        height: "8px",
        background: track,
        borderRadius: "999px",
        overflow: "hidden",
        flex: 1,
      }}
    >
      <div
        style={{
          width: `${Math.min(100, pct)}%`,
          height: "100%",
          background: color,
          borderRadius: "999px",
          transition: "width 0.45s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; icon: string }> = {
  "Menunggu Verifikasi": { label: "Menunggu Verifikasi", color: "#b45309", bg: "#fffbeb", border: "#fde68a", icon: "⏳" },
  "Perlu Klarifikasi":  { label: "Perlu Klarifikasi",  color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", icon: "💬" },
  "Terverifikasi":      { label: "Terverifikasi",      color: "#047857", bg: "#ecfdf5", border: "#a7f3d0", icon: "✅" },
  "Dalam Distribusi":   { label: "Dalam Distribusi",   color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd", icon: "🚚" },
  "Bantuan Diterima":   { label: "Bantuan Diterima",   color: "#013220", bg: "#f0fdf4", border: "#bbf7d0", icon: "🎁" },
  "Ditolak":            { label: "Ditolak",            color: "#b91c1c", bg: "#fef2f2", border: "#fecaca", icon: "❌" },
};

const KATEGORI_ICON: Record<string, string> = {
  pangan:  "🍚",
  air:     "💧",
  sandang: "👕",
  shelter: "⛺",
  medis:   "💊",
  lainnya: "📦",
};

function kategoriBucket(item: string): string {
  const s = item.toLowerCase();
  if (s.includes("beras") || s.includes("pangan") || s.includes("sembako") || s.includes("makanan")) return "pangan";
  if (s.includes("air") || s.includes("sanitasi") || s.includes("bersih")) return "air";
  if (s.includes("sandang") || s.includes("baju") || s.includes("pakaian") || s.includes("selimut")) return "sandang";
  if (s.includes("tenda") || s.includes("shelter") || s.includes("matras") || s.includes("hunian")) return "shelter";
  if (s.includes("obat") || s.includes("medis") || s.includes("p3k") || s.includes("masker") || s.includes("kesehatan")) return "medis";
  return "lainnya";
}

function labelKategori(k: string): string {
  const m: Record<string, string> = {
    pangan: "Pangan & Sembako", air: "Air Bersih", sandang: "Sandang",
    shelter: "Shelter/Tenda", medis: "Medis & P3K", lainnya: "Lainnya",
  };
  return m[k] || k;
}

// ── komponen utama ────────────────────────────────────────────────────────────

export function PersBaranResponBantuan({ cases = [], misiList = [] }: PersBaranResponBantuanProps) {
  const total = cases.length;

  const statusStats = useMemo(() => {
    if (total === 0) return [];
    const counter: Record<string, number> = {};
    for (const c of cases) {
      const s = c.status || "Menunggu Verifikasi";
      counter[s] = (counter[s] || 0) + 1;
    }
    return Object.entries(counter)
      .map(([status, count]) => ({ status, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [cases, total]);

  const kategoriStats = useMemo(() => {
    const counter: Record<string, number> = {};
    for (const c of cases) {
      const bucket = kategoriBucket(c.item || "lainnya");
      counter[bucket] = (counter[bucket] || 0) + 1;
    }
    const t = cases.length || 1;
    return Object.entries(counter)
      .map(([k, count]) => ({ key: k, label: labelKategori(k), count, pct: Math.round((count / t) * 100) }))
      .sort((a, b) => b.count - a.count);
  }, [cases]);

  const misiSummary = useMemo(() => {
    const aktif   = misiList.filter((m) => m.status_tahapan !== "Selesai").length;
    const selesai = misiList.filter((m) => m.status_tahapan === "Selesai").length;
    const kk      = misiList.reduce((sum, m) => sum + (m.kebutuhan?.jumlah_kk ?? 0), 0);
    return { aktif, selesai, total: misiList.length, kk };
  }, [misiList]);

  const recentCases = useMemo(() => {
    return [...cases]
      .filter((c) => c.createdAtRaw)
      .sort((a, b) => new Date(b.createdAtRaw!).getTime() - new Date(a.createdAtRaw!).getTime())
      .slice(0, 5);
  }, [cases]);

  const kpis = useMemo(() => {
    const selesai = cases.filter((c) => c.status === "Bantuan Diterima").length;
    const aktif   = cases.filter((c) => c.status !== "Bantuan Diterima" && c.status !== "Ditolak").length;
    const kk      = cases.reduce((s, c) => s + Number(c.kk || 0), 0);
    return { selesai, aktif, kk };
  }, [cases]);

  const avgResponMenit = useMemo(() => {
    const verified = cases.filter((c) => c.verifiedAtRaw && c.createdAtRaw);
    if (verified.length === 0) return null;
    const totalMins = verified.reduce((sum, c) => {
      const diff = new Date(c.verifiedAtRaw!).getTime() - new Date(c.createdAtRaw!).getTime();
      return sum + diff / 60000;
    }, 0);
    return Math.round(totalMins / verified.length);
  }, [cases]);

  const kpiCards = [
    { label: "Bantuan Diterima", value: kpis.selesai, sub: "laporan selesai", color: "#013220", bg: "#ecfdf5", border: "#a7f3d0", icon: "✅" },
    { label: "Sedang Ditangani", value: kpis.aktif,   sub: "laporan aktif",   color: "#047857", bg: "#f0fdf4", border: "#bbf7d0", icon: "🔄" },
    { label: "KK Terdampak",     value: kpis.kk,      sub: "kepala keluarga", color: "#0369a1", bg: "#f0f9ff", border: "#bae6fd", icon: "👨‍👩‍👧" },
    ...(misiSummary.total > 0 ? [{ label: "Misi Distribusi", value: misiSummary.aktif, sub: `${misiSummary.selesai} selesai`, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe", icon: "🚚" }] : []),
    ...(avgResponMenit !== null ? [{ label: "Avg. Respon Verifikasi", value: avgResponMenit, sub: "menit / kasus", color: "#b45309", bg: "#fffbeb", border: "#fde68a", icon: "⏱️" }] : []),
  ];

  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: "18px",
        border: "1.5px solid #d1fae5",
        padding: "28px 28px 24px",
        marginTop: "32px",
        marginBottom: "32px",
        boxShadow: "0 8px 30px rgba(1, 50, 32, 0.05)",
      }}
    >
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "14px", marginBottom: "22px", borderBottom: "1px solid #ecfdf5", paddingBottom: "18px" }}>
        <div>
          <span style={{ display: "inline-block", fontSize: "0.71rem", fontWeight: 800, color: "#013220", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "3px 10px", borderRadius: "999px", letterSpacing: "0.06em", textTransform: "uppercase" as const, marginBottom: "8px" }}>
            📊 Persebaran &amp; Respon Bantuan
          </span>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.35rem", fontWeight: 800, color: "#013220", letterSpacing: "-0.01em", lineHeight: 1.25 }}>
            Ringkasan Alur &amp; Sebaran Penanganan Kebutuhan
          </h2>
          <p style={{ margin: 0, fontSize: "0.86rem", color: "#475569", lineHeight: 1.5 }}>
            Data riil dari basis data REKSA — distribusi status laporan, kategori kebutuhan, dan kinerja respons bantuan.
          </p>
        </div>
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "10px 16px", textAlign: "right" as const, minWidth: "120px" }}>
          <small style={{ display: "block", fontSize: "0.68rem", color: "#047857", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Total Laporan</small>
          <strong style={{ fontSize: "1.55rem", color: "#013220", fontWeight: 800, lineHeight: 1.1 }}>{total}</strong>
          <small style={{ display: "block", fontSize: "0.72rem", color: "#64748b" }}>Tercatat di Sistem</small>
        </div>
      </div>

      {/* KPI CARDS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(155px, 1fr))", gap: "10px", marginBottom: "24px" }}>
        {kpiCards.map((k) => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.border}`, borderRadius: "12px", padding: "14px 16px" }}>
            <span style={{ fontSize: "1.1rem" }}>{k.icon}</span>
            <strong style={{ display: "block", fontSize: "1.5rem", fontWeight: 800, color: k.color, lineHeight: 1.1, marginTop: "2px" }}>{k.value}</strong>
            <span style={{ display: "block", fontSize: "0.74rem", fontWeight: 700, color: k.color }}>{k.label}</span>
            <small style={{ display: "block", fontSize: "0.68rem", color: "#64748b" }}>{k.sub}</small>
          </div>
        ))}
      </div>

      {/* GRID: STATUS + KATEGORI */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginBottom: "24px" }}>
        {/* Sebaran Status */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px" }}>
          <strong style={{ display: "block", fontSize: "0.81rem", color: "#013220", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "14px" }}>
            Sebaran Status Laporan
          </strong>
          {total === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", textAlign: "center" as const, padding: "24px 0" }}>Belum ada laporan di database.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
              {statusStats.map(({ status, count, pct }) => {
                const cfg = STATUS_CONFIG[status] || { label: status, color: "#475569", bg: "#f8fafc", border: "#e2e8f0", icon: "📌" };
                return (
                  <div key={status}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "6px", background: cfg.bg, border: `1px solid ${cfg.border}`, fontSize: "0.8rem" }}>{cfg.icon}</span>
                        <span style={{ fontSize: "0.81rem", fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#334155" }}>{count} laporan</span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 800, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, padding: "1px 7px", borderRadius: "6px" }}>{pct}%</span>
                      </div>
                    </div>
                    {pctBar(pct, cfg.color)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kategori Kebutuhan */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "18px" }}>
          <strong style={{ display: "block", fontSize: "0.81rem", color: "#013220", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.05em", marginBottom: "14px" }}>
            Kategori Kebutuhan Terbanyak
          </strong>
          {total === 0 ? (
            <p style={{ color: "#94a3b8", fontSize: "0.85rem", textAlign: "center" as const, padding: "24px 0" }}>Belum ada data kebutuhan.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column" as const, gap: "10px" }}>
              {kategoriStats.map(({ key, label, count, pct }, idx) => {
                const palette = ["#013220", "#047857", "#059669", "#10b981", "#34d399", "#6ee7b7"];
                const color = palette[idx % palette.length];
                return (
                  <div key={key}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "24px", height: "24px", borderRadius: "6px", background: idx === 0 ? "#013220" : "#ecfdf5", border: `1px solid ${idx === 0 ? "#013220" : "#a7f3d0"}`, fontSize: "0.85rem" }}>{KATEGORI_ICON[key] || "📦"}</span>
                        <span style={{ fontSize: "0.81rem", fontWeight: 600, color: "#1e293b" }}>{label}</span>
                        {idx === 0 && (<span style={{ fontSize: "0.64rem", fontWeight: 700, color: "#ffffff", background: "#013220", padding: "1px 6px", borderRadius: "4px" }}>★ Terbanyak</span>)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#334155" }}>{count} laporan</span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#013220", background: "#ecfdf5", border: "1px solid #a7f3d0", padding: "1px 7px", borderRadius: "6px" }}>{pct}%</span>
                      </div>
                    </div>
                    {pctBar(pct, color, "#e2e8f0")}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* TABEL LAPORAN TERBARU */}
      {recentCases.length > 0 && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "14px", overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", background: "#f0fdf4", borderBottom: "1px solid #d1fae5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "0.85rem", color: "#013220" }}>🕐 Laporan Terbaru yang Masuk</strong>
            <span style={{ fontSize: "0.74rem", color: "#047857", fontWeight: 600 }}>5 Terkini Berdasarkan Waktu Submit</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ background: "#f8fafc", textAlign: "left", color: "#013220", borderBottom: "1.5px solid #e2e8f0" }}>
                  <th style={{ padding: "9px 14px", minWidth: "110px" }}>Kode Kasus</th>
                  <th style={{ padding: "9px 14px" }}>Kebutuhan</th>
                  <th style={{ padding: "9px 14px" }}>Lokasi</th>
                  <th style={{ padding: "9px 14px", minWidth: "70px" }}>KK</th>
                  <th style={{ padding: "9px 14px", textAlign: "right" as const, minWidth: "140px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((c, idx) => {
                  const cfg = STATUS_CONFIG[c.status || ""] || { label: c.status || "-", color: "#475569", bg: "#f8fafc", border: "#e2e8f0", icon: "📌" };
                  return (
                    <tr key={c.id} style={{ borderBottom: idx < recentCases.length - 1 ? "1px solid #f1f5f9" : "none", background: idx % 2 === 0 ? "#ffffff" : "#f9fafb" }}>
                      <td style={{ padding: "9px 14px" }}>
                        <span style={{ padding: "2px 8px", background: "#f1f5f9", color: "#013220", border: "1px solid #cbd5e1", borderRadius: "6px", fontWeight: 800, fontSize: "0.75rem" }}>{c.id}</span>
                      </td>
                      <td style={{ padding: "9px 14px" }}>
                        <strong style={{ color: "#1e293b", display: "block" }}>{c.item}</strong>
                        {c.urgency && <small style={{ color: "#64748b" }}>Urgensi: {c.urgency}</small>}
                      </td>
                      <td style={{ padding: "9px 14px", color: "#475569", fontSize: "0.79rem" }}>
                        {[c.regency, c.province].filter(Boolean).join(", ") || c.location || "-"}
                      </td>
                      <td style={{ padding: "9px 14px", color: "#013220", fontWeight: 700 }}>{c.kk || "-"} KK</td>
                      <td style={{ padding: "9px 14px", textAlign: "right" as const }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "3px 9px", borderRadius: "999px", background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontWeight: 700, fontSize: "0.74rem", whiteSpace: "nowrap" as const }}>
                          {cfg.icon} {cfg.label}
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

      {/* FOOTER: ringkasan misi */}
      {misiSummary.total > 0 && (
        <div style={{ marginTop: "16px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", padding: "12px 16px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px" }}>
          <span style={{ fontSize: "1.1rem" }}>🚚</span>
          <span style={{ fontSize: "0.84rem", color: "#013220", fontWeight: 700 }}>{misiSummary.aktif} Misi Distribusi Aktif</span>
          <span style={{ fontSize: "0.82rem", color: "#475569" }}>— {misiSummary.selesai} sudah selesai, menjangkau ±{misiSummary.kk} KK penerima.</span>
          <span style={{ marginLeft: "auto", fontSize: "0.74rem", fontWeight: 700, color: "#047857", background: "#dcfce7", border: "1px solid #a7f3d0", padding: "2px 10px", borderRadius: "999px" }}>
            ✓ Data Sinkron Database
          </span>
        </div>
      )}
    </section>
  );
}
