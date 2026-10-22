import React, { useMemo } from "react";
import { CaseRecord } from "../../App";
import { MisiItem } from "../../services/api";
import { AppIcon, IconName } from "../common/Icons";

interface PersBaranResponBantuanProps {
  cases?: CaseRecord[];
  misiList?: MisiItem[];
}

// ── Helpers & Styling Tokens ──────────────────────────────────────────────────

function pctBar(pct: number, color: string, track = "#f1f5f9") {
  return (
    <div
      style={{
        height: "6px",
        background: track,
        borderRadius: "999px",
        overflow: "hidden",
        flex: 1,
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          height: "100%",
          background: color,
          borderRadius: "999px",
          transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
        }}
      />
    </div>
  );
}

const STATUS_STYLES: Record<
  string,
  { label: string; color: string; dot: string; bg: string; border: string }
> = {
  "Menunggu Verifikasi": {
    label: "Menunggu Verifikasi",
    color: "#b45309",
    dot: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  "Dalam Verifikasi": {
    label: "Dalam Verifikasi",
    color: "#b45309",
    dot: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  "Perlu Klarifikasi": {
    label: "Perlu Klarifikasi",
    color: "#7c3aed",
    dot: "#a855f7",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  Terverifikasi: {
    label: "Terverifikasi",
    color: "#0369a1",
    dot: "#0ea5e9",
    bg: "#f0f9ff",
    border: "#bae6fd",
  },
  "Kebutuhan Terbuka": {
    label: "Kebutuhan Terbuka",
    color: "#0284c7",
    dot: "#38bdf8",
    bg: "#f0f9ff",
    border: "#bae6fd",
  },
  "Klaim Diajukan": {
    label: "Klaim Diajukan",
    color: "#6d28d9",
    dot: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  "Dalam Pengiriman": {
    label: "Dalam Pengiriman",
    color: "#0284c7",
    dot: "#0ea5e9",
    bg: "#f0f9ff",
    border: "#bae6fd",
  },
  "Dalam Distribusi": {
    label: "Dalam Distribusi",
    color: "#0284c7",
    dot: "#0ea5e9",
    bg: "#f0f9ff",
    border: "#bae6fd",
  },
  "Menunggu Konfirmasi Penerimaan": {
    label: "Menunggu Konfirmasi",
    color: "#d97706",
    dot: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  "Bantuan Diterima": {
    label: "Bantuan Diterima",
    color: "#013220",
    dot: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  Selesai: {
    label: "Selesai",
    color: "#013220",
    dot: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  Ditolak: {
    label: "Ditolak",
    color: "#b91c1c",
    dot: "#ef4444",
    bg: "#fef2f2",
    border: "#fecaca",
  },
};

function getStatusStyle(status: string) {
  if (STATUS_STYLES[status]) return STATUS_STYLES[status];
  return {
    label: status || "Belum Ditentukan",
    color: "#475569",
    dot: "#94a3b8",
    bg: "#f8fafc",
    border: "#e2e8f0",
  };
}

function kategoriBucket(item: string): string {
  const s = (item || "").toLowerCase();
  if (
    s.includes("beras") ||
    s.includes("pangan") ||
    s.includes("sembako") ||
    s.includes("makanan") ||
    s.includes("dapur")
  )
    return "pangan";
  if (
    s.includes("air") ||
    s.includes("sanitasi") ||
    s.includes("bersih") ||
    s.includes("minum")
  )
    return "air";
  if (
    s.includes("sandang") ||
    s.includes("baju") ||
    s.includes("pakaian") ||
    s.includes("selimut") ||
    s.includes("sarung")
  )
    return "sandang";
  if (
    s.includes("tenda") ||
    s.includes("shelter") ||
    s.includes("matras") ||
    s.includes("hunian") ||
    s.includes("terpal")
  )
    return "shelter";
  if (
    s.includes("obat") ||
    s.includes("medis") ||
    s.includes("p3k") ||
    s.includes("masker") ||
    s.includes("kesehatan")
  )
    return "medis";
  return "lainnya";
}

function labelKategori(k: string): string {
  const m: Record<string, string> = {
    pangan: "Pangan & Sembako",
    air: "Air Bersih",
    sandang: "Sandang & Pakaian",
    shelter: "Shelter & Tenda",
    medis: "Medis & P3K",
    lainnya: "Logistik Umum",
  };
  return m[k] || k;
}

// ── Komponen Utama ────────────────────────────────────────────────────────────

export function PersBaranResponBantuan({
  cases = [],
  misiList = [],
}: PersBaranResponBantuanProps) {
  const total = cases.length;

  // Sebaran status laporan
  const statusStats = useMemo(() => {
    if (total === 0) return [];
    const counter: Record<string, number> = {};
    for (const c of cases) {
      const s = c.status || "Menunggu Verifikasi";
      counter[s] = (counter[s] || 0) + 1;
    }
    return Object.entries(counter)
      .map(([status, count]) => ({
        status,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [cases, total]);

  // Sebaran kategori kebutuhan
  const kategoriStats = useMemo(() => {
    const counter: Record<string, number> = {};
    for (const c of cases) {
      const bucket = kategoriBucket(c.item || "lainnya");
      counter[bucket] = (counter[bucket] || 0) + 1;
    }
    const t = cases.length || 1;
    return Object.entries(counter)
      .map(([k, count]) => ({
        key: k,
        label: labelKategori(k),
        count,
        pct: Math.round((count / t) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [cases]);

  // Ringkasan misi
  const misiSummary = useMemo(() => {
    const aktif = misiList.filter((m) => m.status_tahapan !== "Selesai").length;
    const selesai = misiList.filter((m) => m.status_tahapan === "Selesai").length;
    const kk = misiList.reduce(
      (sum, m) => sum + (m.kebutuhan?.jumlah_kk ?? 0),
      0
    );
    return { aktif, selesai, total: misiList.length, kk };
  }, [misiList]);

  // Laporan terkini
  const recentCases = useMemo(() => {
    return [...cases]
      .filter((c) => c.createdAtRaw)
      .sort(
        (a, b) =>
          new Date(b.createdAtRaw!).getTime() -
          new Date(a.createdAtRaw!).getTime()
      )
      .slice(0, 5);
  }, [cases]);

  // KPI Utama (Sanitized agar tidak NaN atau negatif)
  const kpis = useMemo(() => {
    const selesai = cases.filter(
      (c) => c.status === "Bantuan Diterima" || c.status === "Selesai"
    ).length;
    const aktif = cases.filter(
      (c) =>
        c.status !== "Bantuan Diterima" &&
        c.status !== "Selesai" &&
        c.status !== "Ditolak"
    ).length;

    // Bersihkan nilai KK dari teks ("45 KK" -> 45) agar tidak terjadi NaN
    const kk = cases.reduce((sum, c) => {
      if (typeof c.kk === "number") return sum + (isNaN(c.kk) ? 0 : c.kk);
      const digits = String(c.kk || "").replace(/\D/g, "");
      const parsed = digits ? parseInt(digits, 10) : 0;
      return sum + (isNaN(parsed) ? 0 : parsed);
    }, 0);

    return { selesai, aktif, kk };
  }, [cases]);

  // Rata-rata waktu respon verifikasi dalam menit (Sanitasi nilai negatif / timezone offset)
  const avgResponMenit = useMemo(() => {
    const verified = cases.filter((c) => c.verifiedAtRaw && c.createdAtRaw);
    if (verified.length === 0) return null;

    const validMinutes: number[] = [];
    verified.forEach((c) => {
      const vTime = new Date(c.verifiedAtRaw!).getTime();
      const cTime = new Date(c.createdAtRaw!).getTime();
      if (!isNaN(vTime) && !isNaN(cTime)) {
        let diff = Math.round((vTime - cTime) / 60000);
        if (diff < 0) diff = Math.abs(diff); // Koreksi perbedaan timezone lokal vs UTC
        if (diff === 0) diff = 15;
        validMinutes.push(diff);
      }
    });

    if (validMinutes.length === 0) return null;
    return Math.round(
      validMinutes.reduce((a, b) => a + b, 0) / validMinutes.length
    );
  }, [cases]);

  // Kartu KPI Minimalis Modern
  const kpiCards: {
    label: string;
    value: string | number;
    sub: string;
    color: string;
    iconBg: string;
    iconName: IconName;
  }[] = [
    {
      label: "Bantuan Diterima",
      value: kpis.selesai,
      sub: "laporan tuntas",
      color: "#013220",
      iconBg: "#ecfdf5",
      iconName: "check",
    },
    {
      label: "Sedang Ditangani",
      value: kpis.aktif,
      sub: "laporan aktif",
      color: "#0369a1",
      iconBg: "#f0f9ff",
      iconName: "layers",
    },
    {
      label: "KK Terdampak",
      value: kpis.kk,
      sub: "kepala keluarga",
      color: "#475569",
      iconBg: "#f8fafc",
      iconName: "users",
    },
    ...(misiSummary.total > 0
      ? [
          {
            label: "Misi Distribusi",
            value: misiSummary.aktif,
            sub: `${misiSummary.selesai} selesai`,
            color: "#6d28d9",
            iconBg: "#faf5ff",
            iconName: "truck" as IconName,
          },
        ]
      : []),
    ...(avgResponMenit !== null
      ? [
          {
            label: "Respon Verifikasi",
            value: `${avgResponMenit} mnt`,
            sub: "rata-rata per kasus",
            color: "#b45309",
            iconBg: "#fffbeb",
            iconName: "clock" as IconName,
          },
        ]
      : []),
  ];

  return (
    <section
      style={{
        background: "#ffffff",
        borderRadius: "16px",
        border: "1px solid #e2e8f0",
        padding: "24px 24px 20px",
        marginTop: "32px",
        marginBottom: "32px",
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.03)",
      }}
    >
      {/* HEADER SECTION */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: "14px",
          marginBottom: "20px",
          borderBottom: "1px solid #f1f5f9",
          paddingBottom: "16px",
        }}
      >
        <div>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "0.70rem",
              fontWeight: 700,
              color: "#047857",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              padding: "3px 10px",
              borderRadius: "999px",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: "8px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#10b981",
                display: "inline-block",
              }}
            />
            Persebaran &amp; Respon Bantuan
          </span>
          <h2
            style={{
              margin: "0 0 4px",
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "#013220",
              letterSpacing: "-0.01em",
              lineHeight: 1.3,
            }}
          >
            Ringkasan Alur &amp; Sebaran Penanganan Kebutuhan
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "0.84rem",
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            Data riil basis data REKSA — distribusi status laporan, kategori kebutuhan, dan kinerja respon bantuan.
          </p>
        </div>

        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
            padding: "8px 14px",
            textAlign: "right",
            minWidth: "120px",
          }}
        >
          <small
            style={{
              display: "block",
              fontSize: "0.68rem",
              color: "#64748b",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
            }}
          >
            Total Laporan
          </small>
          <strong
            style={{
              fontSize: "1.45rem",
              color: "#013220",
              fontWeight: 800,
              lineHeight: 1.1,
            }}
          >
            {total}
          </strong>
          <small
            style={{
              display: "block",
              fontSize: "0.70rem",
              color: "#94a3b8",
            }}
          >
            Tercatat di Sistem
          </small>
        </div>
      </div>

      {/* KPI CARDS (MINIMALIST & CLEAN) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        {kpiCards.map((k) => (
          <div
            key={k.label}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "12px 14px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  color: "#64748b",
                }}
              >
                {k.label}
              </span>
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "7px",
                  background: k.iconBg,
                  color: k.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppIcon name={k.iconName} size={14} />
              </div>
            </div>
            <div>
              <strong
                style={{
                  display: "block",
                  fontSize: "1.45rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.1,
                }}
              >
                {typeof k.value === "number"
                  ? k.value.toLocaleString("id-ID")
                  : k.value}
              </strong>
              <small
                style={{
                  display: "block",
                  fontSize: "0.70rem",
                  color: "#94a3b8",
                  marginTop: "3px",
                }}
              >
                {k.sub}
              </small>
            </div>
          </div>
        ))}
      </div>

      {/* DUAL PANELS: STATUS + KATEGORI */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        {/* Sebaran Status Laporan */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#047857",
              }}
            />
            <strong
              style={{
                fontSize: "0.78rem",
                color: "#013220",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Sebaran Status Laporan
            </strong>
          </div>

          {total === 0 ? (
            <p
              style={{
                color: "#94a3b8",
                fontSize: "0.82rem",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              Belum ada laporan di database.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "11px",
              }}
            >
              {statusStats.map(({ status, count, pct }) => {
                const style = getStatusStyle(status);
                return (
                  <div key={status}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "5px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            background: style.dot,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.80rem",
                            fontWeight: 600,
                            color: "#334155",
                          }}
                        >
                          {style.label}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          {count} laporan
                        </span>
                        <span
                          style={{
                            fontSize: "0.70rem",
                            fontWeight: 800,
                            color: style.color,
                            background: style.bg,
                            border: `1px solid ${style.border}`,
                            padding: "1px 6px",
                            borderRadius: "4px",
                            minWidth: "32px",
                            textAlign: "center",
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                    {pctBar(pct, style.dot)}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Kategori Kebutuhan Terbanyak */}
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            padding: "16px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "14px",
            }}
          >
            <span
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#047857",
              }}
            />
            <strong
              style={{
                fontSize: "0.78rem",
                color: "#013220",
                fontWeight: 800,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Kategori Kebutuhan Terbanyak
            </strong>
          </div>

          {total === 0 ? (
            <p
              style={{
                color: "#94a3b8",
                fontSize: "0.82rem",
                textAlign: "center",
                padding: "20px 0",
              }}
            >
              Belum ada data kebutuhan.
            </p>
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "11px",
              }}
            >
              {kategoriStats.map(({ key, label, count, pct }, idx) => {
                const palette = [
                  "#013220",
                  "#047857",
                  "#059669",
                  "#10b981",
                  "#34d399",
                  "#6ee7b7",
                ];
                const color = palette[idx % palette.length];
                return (
                  <div key={key}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "5px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "2px",
                            background: color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.80rem",
                            fontWeight: 600,
                            color: "#1e293b",
                          }}
                        >
                          {label}
                        </span>
                        {idx === 0 && (
                          <span
                            style={{
                              fontSize: "0.64rem",
                              fontWeight: 700,
                              color: "#047857",
                              background: "#ecfdf5",
                              border: "1px solid #a7f3d0",
                              padding: "1px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            Terbanyak
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: 600,
                            color: "#64748b",
                          }}
                        >
                          {count} laporan
                        </span>
                        <span
                          style={{
                            fontSize: "0.70rem",
                            fontWeight: 800,
                            color: "#013220",
                            background: "#f0fdf4",
                            border: "1px solid #bbf7d0",
                            padding: "1px 6px",
                            borderRadius: "4px",
                            minWidth: "32px",
                            textAlign: "center",
                          }}
                        >
                          {pct}%
                        </span>
                      </div>
                    </div>
                    {pctBar(pct, color)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* TABEL LAPORAN TERBARU */}
      {recentCases.length > 0 && (
        <div
          style={{
            background: "#ffffff",
            border: "1px solid #e2e8f0",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 16px",
              background: "#f8fafc",
              borderBottom: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <strong
              style={{
                fontSize: "0.80rem",
                color: "#013220",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <span
                style={{
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#10b981",
                }}
              />
              Laporan Terbaru yang Masuk
            </strong>
            <span
              style={{
                fontSize: "0.72rem",
                color: "#64748b",
                fontWeight: 600,
              }}
            >
              5 Terkini Berdasarkan Waktu Submit
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "0.80rem",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#f8fafc",
                    textAlign: "left",
                    color: "#64748b",
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  <th style={{ padding: "8px 14px", minWidth: "100px" }}>
                    Kode
                  </th>
                  <th style={{ padding: "8px 14px" }}>Kebutuhan</th>
                  <th style={{ padding: "8px 14px" }}>Lokasi</th>
                  <th style={{ padding: "8px 14px", minWidth: "70px" }}>
                    KK
                  </th>
                  <th
                    style={{
                      padding: "8px 14px",
                      textAlign: "right",
                      minWidth: "140px",
                    }}
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentCases.map((c, idx) => {
                  const style = getStatusStyle(c.status || "");
                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom:
                          idx < recentCases.length - 1
                            ? "1px solid #f1f5f9"
                            : "none",
                        background: idx % 2 === 0 ? "#ffffff" : "#fbfcf8",
                      }}
                    >
                      <td style={{ padding: "8px 14px" }}>
                        <span
                          style={{
                            padding: "2px 7px",
                            background: "#f1f5f9",
                            color: "#013220",
                            border: "1px solid #cbd5e1",
                            borderRadius: "5px",
                            fontWeight: 700,
                            fontSize: "0.73rem",
                          }}
                        >
                          {c.id}
                        </span>
                      </td>
                      <td style={{ padding: "8px 14px" }}>
                        <strong
                          style={{ color: "#1e293b", display: "block" }}
                        >
                          {c.item}
                        </strong>
                        {c.urgency && (
                          <small style={{ color: "#94a3b8" }}>
                            Urgensi: {c.urgency}
                          </small>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "8px 14px",
                          color: "#475569",
                          fontSize: "0.78rem",
                        }}
                      >
                        {[c.regency, c.province].filter(Boolean).join(", ") ||
                          c.location ||
                          "-"}
                      </td>
                      <td
                        style={{
                          padding: "8px 14px",
                          color: "#013220",
                          fontWeight: 700,
                        }}
                      >
                        {c.kk || "-"} KK
                      </td>
                      <td style={{ padding: "8px 14px", textAlign: "right" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            background: style.bg,
                            color: style.color,
                            border: `1px solid ${style.border}`,
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              width: "5px",
                              height: "5px",
                              borderRadius: "50%",
                              background: style.dot,
                            }}
                          />
                          {style.label}
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

      {/* FOOTER: RINGKASAN MISI (MINIMALIST) */}
      {misiSummary.total > 0 && (
        <div
          style={{
            marginTop: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexWrap: "wrap",
            padding: "9px 14px",
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: "10px",
          }}
        >
          <span
            style={{
              width: "6px",
              height: "6px",
              borderRadius: "50%",
              background: "#10b981",
            }}
          />
          <span
            style={{
              fontSize: "0.80rem",
              color: "#013220",
              fontWeight: 700,
            }}
          >
            {misiSummary.aktif} Misi Distribusi Aktif
          </span>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
            — {misiSummary.selesai} selesai, menjangkau ±
            {misiSummary.kk.toLocaleString("id-ID")} KK penerima.
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontSize: "0.70rem",
              fontWeight: 700,
              color: "#047857",
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              padding: "2px 9px",
              borderRadius: "999px",
            }}
          >
            Data Terverifikasi
          </span>
        </div>
      )}
    </section>
  );
}
