import React, { Component, useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import { ChatKoordinasi } from "./components/common/ChatKoordinasi";

export type Role = "citizen" | "posko" | "responder";
type Screen = "home" | "login" | "portal";

const PHOTO =
  "https://images.unsplash.com/photo-1643216665710-9e254ce24f82?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=85&w=1400";

export type CaseRecord = {
  id: string;
  rawId?: number;
  item: string;
  location: string;
  kk: string;
  qty: string;
  urgency: string;
  status: string;
  isOwn?: boolean;
  notes?: string;
  date?: string;
  posko?: string;
  applicantNik?: string;
  applicantName?: string;
  applicantPhone?: string;
  shelterStatus?: string;
  province?: string;
  regency?: string;
  district?: string;
  village?: string;
  lat?: number;
  lng?: number;
  fotoBukti?: string;
  fileName?: string;
  vulnerableDetails?: string;
  crisisDuration?: string;
  roadAccess?: string;
  urgencyScore?: number;
  priorityRationale?: string;
  createdAtTime?: string;
  createdAtRaw?: string;
  verifiedAtRaw?: string;
  completedAtRaw?: string;
  updatedAtRaw?: string;
  affectedPeople?: number;
  vulnerableGroupsList?: string[];
  availabilityCondition?: string;
  citizenUrgency?: string;
  conditionDescription?: string;
  pertanyaanKlarifikasi?: string;
  kategoriKlarifikasi?: string;
  memintaLampiran?: boolean;
  fotoKlarifikasi?: string;
  riwayatKlarifikasi?: any[];
  jawabanKlarifikasi?: string;
  alasanPenolakan?: string;
  tindakLanjutPenolakan?: string;
  catatanVerifikasiPosko?: string;
  totalAlokasiResmi?: string;
  totalDiterimaResmi?: string;
};

const initialCases: CaseRecord[] = [];

export function getUserReportedIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem("reksa_user_reported_ids") || "[]");
  } catch {
    return [];
  }
}

export function addUserReportedId(id: string): void {
  const ids = getUserReportedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem("reksa_user_reported_ids", JSON.stringify(ids));
  }
}

export function removeUserReportedId(id: string): void {
  const ids = getUserReportedIds().filter((x) => x !== id);
  localStorage.setItem("reksa_user_reported_ids", JSON.stringify(ids));
}


const accounts = [
  { role: "Masyarakat Terdampak", name: "Andi Pratama", email: "andi.masyarakat@reksa.id", type: "citizen" as Role },
  { role: "Koordinator Posko Wilayah", name: "Siti Rahma", email: "siti.posko@reksa.id", type: "posko" as Role },
  { role: "Mitra Bantuan · Satgas BPBD", name: "Arif Nugroho", email: "arif.bpbd@reksa.id", type: "responder" as Role },
];

const icons: Record<string, React.ReactNode> = {
  arrow: <svg viewBox="0 0 24 24"><path d="M5 12h14M14 7l5 5-5 5" /></svg>,
  next: <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  chevron: <svg viewBox="0 0 24 24"><path d="m9 18 6-6-6-6" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  down: <svg viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  bell: <svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></svg>,
  pin: <svg viewBox="0 0 24 24"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>,
  check: <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>,
  plus: <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14" /></svg>,
  grid: <svg viewBox="0 0 24 24"><rect x="4" y="4" width="6" height="6" /><rect x="14" y="4" width="6" height="6" /><rect x="4" y="14" width="6" height="6" /><rect x="14" y="14" width="6" height="6" /></svg>,
  file: <svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6Z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></svg>,
  map: <svg viewBox="0 0 24 24"><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" /><path d="M9 3v15M15 6v15" /></svg>,
  box: <svg viewBox="0 0 24 24"><path d="m4 7 8-4 8 4-8 4Z" /><path d="M4 7v10l8 4 8-4V7M12 11v10" /></svg>,
  task: <svg viewBox="0 0 24 24"><path d="M9 5h11M9 12h11M9 19h11M4 5h.01M4 12h.01M4 19h.01" /></svg>,
  bolt: <svg viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>,
  handshake: <svg viewBox="0 0 24 24"><path d="m11 17 2 2a1 1 0 0 0 1.4 0l4.3-4.3a1 1 0 0 0 0-1.4l-2-2" /><path d="m13 7.1 2.3-2.3a1 1 0 0 1 1.4 0l4.3 4.3a1 1 0 0 1 0 1.4l-2.3 2.3" /><path d="m18 12 2.2 2.2a1 1 0 0 1 0 1.4l-4.4 4.4a1 1 0 0 1-1.4 0L12 17.6" /><path d="M2 13.5V20a2 2 0 0 0 2 2h6.5" /><path d="m2 13.5 4.5-4.5a1 1 0 0 1 1.4 0l3.6 3.6" /><path d="m6 9-2.5-2.5a1 1 0 0 1 0-1.4l4.3-4.3a1 1 0 0 1 1.4 0L11.7 3" /></svg>,
  clock: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  user: <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 4-7 8-7s7 2 8 7" /></svg>,
  mail: <svg viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>,
  lock: <svg viewBox="0 0 24 24"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  eye: <svg viewBox="0 0 24 24"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>,
  eyeOff: <svg viewBox="0 0 24 24"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" /><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" /><line x1="2" x2="22" y1="2" y2="22" /></svg>,
  edit: <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  trash: <svg viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" /></svg>,
  settings: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19 14.5 21 16l-2 3-2.3-1a8 8 0 0 1-2.2 1.3L14 22h-4l-.5-2.7A8 8 0 0 1 7.3 18L5 19l-2-3 2-1.5a8 8 0 0 1 0-5L3 8l2-3 2.3 1a8 8 0 0 1 2.2-1.3L10 2h4l.5 2.7A8 8 0 0 1 16.7 6L19 5l2 3-2 1.5a8 8 0 0 1 0 5Z" /></svg>,
  help: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.6 2.6 0 1 1 4 2.2c-1 .7-1.5 1.2-1.5 2.3M12 17h.01" /></svg>,
  info: <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path d="M12 16v-4M12 8h.01" strokeWidth="2.2" /></svg>,
  search: <svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7" strokeWidth="2" /><path d="m21 21-4.35-4.35" strokeWidth="2.2" /></svg>,
  logout: <svg viewBox="0 0 24 24"><path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10" /></svg>,
  menu: <svg viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16" /></svg>,
  alert: <svg viewBox="0 0 24 24"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  chat: <svg viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>,
};

export function Icon({ name }: { name: string }) {
  return <span className="icon">{icons[name]}</span>;
}

export const getFieldEvidencePhoto = (item?: string, fotoBukti?: string) => {
  if (fotoBukti && typeof fotoBukti === "string" && fotoBukti.trim() !== "" && fotoBukti !== "null") {
    if (fotoBukti.startsWith("data:") || fotoBukti.startsWith("http") || fotoBukti.startsWith("/") || fotoBukti.startsWith("blob:")) {
      return fotoBukti;
    }
  }
  const category = (item || "").toLowerCase();
  if (category.includes("makan") || category.includes("sembako") || category.includes("dapur") || category.includes("pangan") || category.includes("beras")) {
    return "https://images.unsplash.com/photo-1593113598332-cd288d649433?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=1200&q=82";
  }
  if (category.includes("air") || category.includes("sanitasi") || category.includes("tandon") || category.includes("toren") || category.includes("mck")) {
    return "https://images.unsplash.com/photo-1541888946425-d0fbb18f15f6?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=1200&q=82";
  }
  if (category.includes("tenda") || category.includes("terpal") || category.includes("hunian") || category.includes("selimut") || category.includes("matras")) {
    return "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=1200&q=82";
  }
  if (category.includes("obat") || category.includes("medis") || category.includes("kesehatan") || category.includes("perban")) {
    return "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=1200&q=82";
  }
  if (category.includes("bayi") || category.includes("balita") || category.includes("lansia") || category.includes("popok") || category.includes("susu")) {
    return "https://images.unsplash.com/photo-1516627145497-ae6968895b74?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=1200&q=82";
  }
  return "https://images.unsplash.com/photo-1547683905-f686c993aae5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=1200&q=82";
};

export const getCategoryEmoji = (category?: string) => {
  const cat = (category || "").toLowerCase();
  if (cat.includes("air") || cat.includes("sanitasi") || cat.includes("tandon")) return "💧";
  if (cat.includes("makan") || cat.includes("sembako") || cat.includes("dapur") || cat.includes("pangan") || cat.includes("beras")) return "🍚";
  if (cat.includes("obat") || cat.includes("medis") || cat.includes("kesehatan") || cat.includes("perban")) return "💊";
  if (cat.includes("tenda") || cat.includes("terpal") || cat.includes("hunian") || cat.includes("selimut") || cat.includes("matras")) return "⛺";
  if (cat.includes("bayi") || cat.includes("balita") || cat.includes("popok") || cat.includes("susu")) return "🍼";
  if (cat.includes("listrik") || cat.includes("genset") || cat.includes("solar")) return "⚡";
  return "📦";
};

export const getCaseProgress = (status?: string): number => {
  switch (status) {
    case "Diajukan":
    case "Dalam Verifikasi":
      return 20; // Tahap 1: Laporan Diajukan (20%)
    case "Kebutuhan Terbuka":
      return 40; // Tahap 2: Verifikasi Posko BPBD Selesai (40%)
    case "Ditugaskan":
      return 60; // Tahap 3: Alokasi & Kesiapan Bantuan (60%)
    case "Dalam Pengiriman":
    case "Menunggu Konfirmasi Penerimaan":
      return 80; // Tahap 4: Penyaluran & Distribusi Lapangan (80%)
    case "Selesai":
      return 100; // Tahap 5: Bantuan Diterima Warga Tuntas (100%)
    default:
      return 20;
  }
};

function Logo({ light = false }: { light?: boolean }) {
  return (
    <button className={`logo ${light ? "logo-light" : ""}`} onClick={() => location.reload()} aria-label="REKSA, kembali ke beranda">
      <svg viewBox="0 0 42 42" aria-hidden="true">
        <path d="M7 7h16c7 0 12 4 12 10s-5 10-12 10H7V7Z" />
        <path d="M18 27 35 38M7 20h17" />
        <circle cx="8" cy="7" r="3" />
        <circle cx="35" cy="38" r="3" />
      </svg>
      <span>REKSA<small>Kolaborasi Pascabencana</small></span>
    </button>
  );
}

export function Button({
  children, variant = "primary", onClick, disabled = false, type = "button", className = "", style,
}: {
  children: React.ReactNode; variant?: "primary" | "secondary" | "text" | "light"; onClick?: () => void; disabled?: boolean; type?: "button" | "submit"; className?: string; style?: React.CSSProperties;
}) {
  return <button type={type} disabled={disabled} style={style} className={`btn btn-${variant} ${className}`.trim()} onClick={onClick}>{children}</button>;
}

export function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function Progress({ value = 70 }: { value?: number }) {
  return <div className="progress" aria-label={`${value}%`}><span style={{ width: `${value}%` }} /></div>;
}

import { LeafletMap } from "./components/LeafletMap";
import { CitizenDashboard } from "./components/citizen/CitizenDashboard";
import { CitizenReport } from "./components/citizen/CitizenReport";
import { CitizenCaseList } from "./components/citizen/CitizenCaseList";
import { apiService, BursaItem, MisiItem, PenawaranItem } from "./services/api";
import { PoskoVerifikasiLaporan } from "./components/posko/PoskoVerifikasiLaporan";
import { PoskoKebutuhanBursa } from "./components/posko/PoskoKebutuhanBursa";
import { PoskoPenawaranAlokasi } from "./components/posko/PoskoPenawaranAlokasi";
import { PoskoDistribusiPenerimaan } from "./components/posko/PoskoDistribusiPenerimaan";
import { MitraBursaBantuan } from "./components/mitra/MitraBursaBantuan";
import { MitraPenawaranSaya } from "./components/mitra/MitraPenawaranSaya";
import { MitraMisiPenyaluran } from "./components/mitra/MitraMisiPenyaluran";
import { MitraRiwayatPenyaluran } from "./components/mitra/MitraRiwayatPenyaluran";
import { MitraDashboard } from "./components/mitra/MitraDashboard";

class ErrorBoundary extends React.Component<{ children: React.ReactNode; fallback?: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div style={{ padding: "16px 20px", background: "#f6ffed", border: "1px solid #b7eb8f", borderRadius: "12px", margin: "10px 0", color: "#135200" }}>
          <strong style={{ display: "block", marginBottom: "4px" }}>📍 Lokasi Wilayah Tersimpan</strong>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#386134" }}>
            Peta interaktif sedang disesuaikan. Data titik koordinat dan wilayah administratif tetap tersimpan aman melalui formulir isian di atas.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

export function MapView({ 
  operational = false, 
  hideCard = false, 
  showRoute = false,
  pickLocation = false,
  initialLat,
  initialLng,
  locationAddress,
  caseTitle,
  caseId,
  caseKk,
  caseUrgency,
  cases,
  focusedCaseId,
  focusTrigger,
  onSelectCase,
  onLocationPicked,
  height,
}: { 
  operational?: boolean; 
  hideCard?: boolean; 
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
  focusedCaseId?: string;
  focusTrigger?: number;
  onSelectCase?: (c: any) => void;
  onLocationPicked?: (info: any) => void;
  height?: string;
}) {
  const safeLat = Number.isFinite(Number(initialLat)) ? Number(initialLat) : -7.336272;
  const safeLng = Number.isFinite(Number(initialLng)) ? Number(initialLng) : 112.728881;
  return (
    <ErrorBoundary>
      <LeafletMap 
        operational={operational} 
        hideCard={hideCard} 
        showRoute={showRoute} 
        pickLocation={pickLocation} 
        initialLat={safeLat} 
        initialLng={safeLng} 
        locationAddress={locationAddress}
        caseTitle={caseTitle}
        caseId={caseId}
        caseKk={caseKk}
        caseUrgency={caseUrgency}
        cases={cases}
        focusedCaseId={focusedCaseId}
        focusTrigger={focusTrigger}
        onSelectCase={onSelectCase}
        onLocationPicked={onLocationPicked}
        height={height}
      />
    </ErrorBoundary>
  );
}

function Navbar({ navigate }: { navigate: (s: Screen) => void }) {
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const navOffset = 84;
      const elementPosition = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, elementPosition - navOffset),
        behavior: "smooth",
      });
      // Update hash without abrupt jump
      window.history.replaceState(null, "", `#${id}`);
    }
  };

  return (
    <header className="public-navbar">
      <div className="shell public-navbar-inner">
        <Logo light />
        <nav>
          <a href="#tentang" onClick={scrollTo("tentang")}>Tentang REKSA</a>
          <a href="#peta" onClick={scrollTo("peta")}>Peta Posko</a>
          <a href="#cara" onClick={scrollTo("cara")}>Cara Kerja</a>
        </nav>
        <div className="nav-actions">
          <button className="btn-nav-cta" onClick={() => navigate("login")}>
            Masuk Akun <span className="icon-circle"><Icon name="arrow" /></span>
          </button>
        </div>
      </div>
    </header>
  );
}

function Home({ navigate }: { navigate: (s: Screen) => void }) {
  return (
    <div className="public-site">
      <Navbar navigate={navigate} />
      <main>
        {/* HERO BANNER — Thematic post-disaster hero image & aligned forest green palette */}
        <section className="hero-banner">
          <img 
            className="hero-bg" 
            src="/hero-disaster.jpg" 
            alt="Masyarakat dan relawan bergotong royong di lokasi pascabencana" 
            aria-hidden="true" 
          />
          <div className="hero-overlay" />
          <div className="hero shell">
            <div className="hero-copy">
              <span className="hero-badge">
                <Icon name="check" /> Ruang Ekosistem Kolaborasi Pascabencana
              </span>
              <h1>Bantuan tidak berhenti di laporan.</h1>
              <p>
                REKSA menghubungkan kebutuhan masyarakat terdampak pascabencana dengan posko koordinasi dan responder relawan di lapangan, dari pelaporan hingga bantuan diterima tuntas.
              </p>
              <div className="hero-actions">
                <button className="hero-btn-secondary" onClick={() => {
                  const el = document.getElementById("cara");
                  if (el) {
                    window.scrollTo({
                      top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84),
                      behavior: "smooth"
                    });
                  }
                }}>
                  Pelajari REKSA <span className="icon-circle"><Icon name="arrow" /></span>
                </button>
              </div>
              <div className="hero-stats">
                <div className="stat-pill"><strong>100+</strong><span>Laporan Ditangani</span></div>
                <div className="stat-pill"><strong>4.9 ★</strong><span>Rating Respon</span></div>
                <div className="stat-pill"><strong>&lt; 24 Jam</strong><span>Waktu Respon</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="feature-cards-bar shell" id="tentang">
          <div className="section-header" style={{ textAlign: "center", maxWidth: 620, margin: "0 auto 28px" }}>
            <span className="eyebrow">Mengapa REKSA</span>
            <h2>Satu ruang kolaborasi.<br />Tiga peran yang jelas.</h2>
          </div>
          <div className="feature-card-grid">
            <article className="feat-card">
              <div className="feat-card-img"><img src="/role-masyarakat.jpg" alt="Masyarakat" /><div className="feat-card-tint" /><span className="feat-card-label">Masyarakat</span></div>
              <h3>Untuk Masyarakat</h3>
              <p>Laporkan kebutuhan dan ketahui perkembangan bantuan secara jelas.</p>
              <Button variant="text" onClick={() => navigate("login")}>Masuk ke Akun <Icon name="arrow" /></Button>
            </article>
            <article className="feat-card">
              <div className="feat-card-img"><img src="/role-posko.jpg" alt="Posko" /><div className="feat-card-tint" /><span className="feat-card-label">Posko</span></div>
              <h3>Untuk Posko</h3>
              <p>Verifikasi kebutuhan dan kelola bantuan dalam satu alur layanan.</p>
              <Button variant="text" onClick={() => navigate("login")}>Masuk sebagai Posko <Icon name="arrow" /></Button>
            </article>
            <article className="feat-card">
              <div className="feat-card-img"><img src="/role-responder.jpg" alt="Responder" /><div className="feat-card-tint" /><span className="feat-card-label">Responder</span></div>
              <h3>Untuk Responder</h3>
              <p>Terima tugas yang jelas dan perbarui progres langsung dari lapangan.</p>
              <Button variant="text" onClick={() => navigate("login")}>Masuk sebagai Responder <Icon name="arrow" /></Button>
            </article>
          </div>
        </section>

        {/* INTERACTIVE OPERATIONAL MAP SHOWCASE */}
        <section className="map-showcase-section shell" id="peta" style={{ margin: "50px auto 70px" }}>
          <div className="section-header" style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 28px" }}>
            <span className="eyebrow"><Icon name="pin" /> Pemantauan Sebaran Wilayah</span>
            <h2>Sebaran Posko BPBD &amp; Titik Logistik Terpadu</h2>
            <p className="section-lead" style={{ color: "#4b5563" }}>
              Pantau kesiapan posko koordinasi BPBD, kapasitas tampung, serta titik komando tanggap darurat secara real-time di seluruh wilayah operasional.
            </p>
          </div>

          <div
            className="map-showcase-container"
            style={{
              background: "#ffffff",
              borderRadius: "24px",
              boxShadow: "0 20px 40px -15px rgba(1, 50, 32, 0.12)",
              border: "1px solid #e2ded4",
              overflow: "hidden",
            }}
          >
            {/* MAP HEADER STATS BAR */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "14px",
                padding: "18px 24px",
                background: "#fbfcfb",
                borderBottom: "1px solid #ebe8de",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#10b981", boxShadow: "0 0 0 4px rgba(16, 185, 129, 0.2)" }} />
                <strong style={{ color: "#013220", fontSize: "0.95rem" }}>Status Operasional: Siaga Penuh 24 Jam</strong>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap", fontSize: "0.85rem" }}>
                <span style={{ color: "#4b5563" }}>
                  📍 <strong>3</strong> Posko Induk Wilayah
                </span>
                <span style={{ color: "#4b5563" }}>
                  🏠 <strong>750+ KK</strong> Kapasitas Terdata
                </span>
                <span style={{ background: "#e8f3ea", color: "#013220", padding: "4px 12px", borderRadius: "20px", fontWeight: 700 }}>
                  OpenStreetMap Interaktif
                </span>
              </div>
            </div>

            {/* EMBEDDED LEAFLET MAP VIEW */}
            <div style={{ position: "relative", height: "460px", width: "100%", background: "#f5f4ef" }}>
              <MapView operational />
            </div>

            {/* MAP FOOTER HINT */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "10px",
                padding: "14px 24px",
                background: "#faf9f5",
                borderTop: "1px solid #ebe8de",
                fontSize: "0.82rem",
                color: "#6b7280",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <Icon name="check" />
                <span>Klik ikon marker pada peta untuk melihat detail posko, kontak darurat, dan daya tampung pengungsi.</span>
              </div>
              <Button
                variant="text"
                onClick={() => navigate("login")}
                style={{ fontSize: "0.84rem", fontWeight: 700, color: "#013220", padding: 0 }}
              >
                Buka Peta Lengkap Petugas <Icon name="arrow" />
              </Button>
            </div>
          </div>
        </section>

        <section className="journey-banner" id="cara">
          <img 
            className="journey-bg" 
            src="https://images.unsplash.com/photo-1766224242779-063be965105c?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&ixlib=rb-4.1.0&q=82&w=1800" 
            alt="Kolaborasi masyarakat dan relawan dalam pemulihan pascabencana" 
            aria-hidden="true" 
          />
          <div className="journey-overlay" />
          <div className="shell journey-shell">
            <div className="journey-empty-spacer" aria-hidden="true" />
            <div className="journey-content-right">
              <div className="section-header">
                <span className="eyebrow light"><Icon name="check" /> Cara REKSA bekerja</span>
                <h2>Dari kebutuhan menuju penyelesaian.</h2>
                <p className="section-lead light">
                  Satu alur layanan yang jelas dan terpadu agar masyarakat selalu mengetahui langkah penanganan berikutnya.
                </p>
              </div>
              <div className="steps-illustrated">
                {[
                  { n: "01", title: "Laporkan", desc: "Masyarakat menyampaikan kebutuhan pascabencana.", icon: "file" },
                  { n: "02", title: "Verifikasi", desc: "Petugas Posko memeriksa dan memvalidasi kebutuhan.", icon: "check" },
                  { n: "03", title: "Tangani", desc: "Sumber daya dialokasikan dan responder ditugaskan.", icon: "box" },
                  { n: "04", title: "Selesai", desc: "Bantuan diterima dan laporan diselesaikan.", icon: "check" },
                ].map(({ n, title, desc, icon }) => (
                  <div className="step-ill" key={n}>
                    <div className="step-ill-icon"><Icon name={icon} /></div>
                    <div>
                      <span className="step-ill-num">{n}</span>
                      <h3>{title}</h3>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="cta-final-wrapper" id="akses">
          <div className="shell">
            <div className="cta-final-card">
              <div className="cta-final-content">
                <span className="eyebrow light"><Icon name="check" /> Akses publik &amp; Institusi</span>
                <h2>Sudah siap memulai bersama REKSA?</h2>
                <p>
                  Masuk atau buat akun untuk mulai melaporkan kebutuhan, mengelola posko koordinasi, atau menjalankan penugasan responder di lapangan.
                </p>
                <div className="cta-final-actions">
                  <Button variant="light" className="btn-cta-main" onClick={() => navigate("login")}>
                    Masuk / Daftar Akun <Icon name="arrow" />
                  </Button>
                </div>
                <div className="cta-perks">
                  <span><Icon name="check" /> Terbuka untuk Umum</span>
                  <span><Icon name="check" /> Respon Tanggap</span>
                  <span><Icon name="check" /> Terintegrasi Posko</span>
                </div>
              </div>
              <div className="cta-final-hero">
                <img src="/cta-person.png" alt="Relawan REKSA" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="footer-main">
          <div className="footer-brand"><Logo light /><p>Ruang Ekosistem Kolaborasi Pascabencana</p></div>
          <nav>
            <strong>Navigasi</strong>
            <a href="#tentang" onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("tentang");
              if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84), behavior: "smooth" });
            }}>Tentang REKSA</a>
            <a href="#peta" onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("peta");
              if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84), behavior: "smooth" });
            }}>Peta Posko</a>
            <a href="#cara" onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("cara");
              if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84), behavior: "smooth" });
            }}>Cara Kerja</a>
            <a href="#akses" onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("akses");
              if (el) window.scrollTo({ top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - 84), behavior: "smooth" });
            }}>Akses Akun</a>
          </nav>
          <nav>
            <strong>Dukungan</strong>
            <a href="#tentang">Bantuan</a>
            <a href="#tentang">Kontak</a>
          </nav>
          <div className="footer-notice"><Icon name="check" /><p>REKSA membantu koordinasi layanan pascabencana dan tidak menggantikan kanal kedaruratan resmi.</p></div>
        </div>
        <div className="footer-bottom">© 2026 REKSA · Layanan publik kolaboratif Indonesia</div>
      </footer>
    </div>
  );
}

function Login({ navigate, onLogin }: { navigate: (s: Screen) => void; onLogin: (r: Role, name: string) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [registerRole, setRegisterRole] = useState<Role>("citizen");
  
  // Role-specific registration fields
  const [nik, setNik] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [poskoName, setPoskoName] = useState("");
  const [poskoRegion, setPoskoRegion] = useState("");
  const [orgName, setOrgName] = useState("");
  const [armadaType, setArmadaType] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(false);
  const [resetInfo, setResetInfo] = useState(false);

  const submit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (mode === "register") {
      if (!fullName || !email || password.length < 6) return setError(true);
      return onLogin(registerRole, fullName);
    }
    
    // Check credentials against database accounts
    const a = accounts.find((x) => x.email.toLowerCase() === email.toLowerCase());
    if (!a || (password !== "password" && password !== "reksa123")) {
      return setError(true);
    }
    onLogin(a.type, a.name);
  };

  return (
    <div className="login-layout">
      {/* Left Showcase Panel */}
      <aside className="auth-showcase">
        <div className="auth-showcase-bg" />
        <div className="auth-showcase-overlay" />
        
        <div className="auth-showcase-inner">
          <div className="auth-brand-row">
            <Logo light />
            <button className="auth-back-btn" onClick={() => navigate("home")}>
              ← Kembali ke beranda
            </button>
          </div>

          <div className="auth-showcase-content">
            <span className="hero-badge">
              <Icon name="check" /> Akses Portal Terpadu REKSA
            </span>
            <h1>Bantuan terhubung, tuntas di lapangan.</h1>
            <p>
              Satu ruang kolaborasi untuk memastikan setiap laporan kebutuhan masyarakat divalidasi posko BPBD dan ditangani responder secara transparan.
            </p>

            <div className="auth-feature-pills">
              <div className="auth-feat-pill">
                <span className="feat-pill-icon"><Icon name="file" /></span>
                <div>
                  <strong>Pelaporan Cepat</strong>
                  <small>Terintegrasi BPBD Wilayah</small>
                </div>
              </div>
              <div className="auth-feat-pill">
                <span className="feat-pill-icon"><Icon name="box" /></span>
                <div>
                  <strong>Bursa Bantuan</strong>
                  <small>Mitra Bantuan &amp; Dukungan Pemenuhan</small>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-showcase-footer">
            <span>© 2026 REKSA · Ruang Ekosistem Kolaborasi Pascabencana</span>
          </div>
        </div>
      </aside>

      {/* Right Form Panel */}
      <main className="auth-form-panel">
        <div className="auth-card">
          <div className="auth-segmented-tabs">
            <button 
              type="button"
              className={mode === "login" ? "active" : ""} 
              onClick={() => { setMode("login"); setError(false); }}
            >
              Masuk Akun
            </button>
            <button 
              type="button"
              className={mode === "register" ? "active" : ""} 
              onClick={() => { setMode("register"); setError(false); }}
            >
              Buat Akun Baru
            </button>
          </div>

          <div className="auth-card-header">
            <span className="eyebrow">{mode === "login" ? "Autentikasi Pengguna" : "Pendaftaran Pengguna Baru"}</span>
            <h2>{mode === "login" ? "Selamat Datang Kembali" : "Registrasi Akun REKSA"}</h2>
            <p>{mode === "login" ? "Sistem akan otomatis mengenali hak akses peran Anda setelah masuk." : "Pilih peran Anda untuk menyesuaikan formulir data pendaftaran."}</p>
          </div>

          {error && (
            <div className="form-error">
              <Icon name="help" />
              <span>{mode === "login" ? "Email atau kata sandi belum sesuai. (Gunakan kata sandi: password)" : "Lengkapi seluruh isian data dan kata sandi minimal 6 karakter."}</span>
            </div>
          )}

          {resetInfo && (
            <div className="verified">
              <Icon name="check" />
              <span>Instruksi pemulihan kata sandi telah dikirim ke alamat email Anda.</span>
            </div>
          )}

          <form onSubmit={submit} className="auth-form-fields">
            {mode === "register" && (
              <>
                {/* ROLE SELECTION TABS FOR REGISTRATION */}
                <div className="input-group">
                  <label>Pilih Peran Akun yang Didaftarkan</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginTop: "4px" }}>
                    {[
                      { role: "citizen" as Role, label: "Masyarakat", icon: "user" },
                      { role: "posko" as Role, label: "Posko BPBD", icon: "pin" },
                      { role: "responder" as Role, label: "Mitra Bantuan", icon: "box" },
                    ].map((r) => (
                      <button
                        key={r.role}
                        type="button"
                        onClick={() => setRegisterRole(r.role)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px 8px",
                          borderRadius: "10px",
                          border: registerRole === r.role ? "2px solid #013220" : "1px solid #dcdad0",
                          background: registerRole === r.role ? "#e8ede7" : "#ffffff",
                          fontWeight: registerRole === r.role ? 700 : 500,
                          color: registerRole === r.role ? "#013220" : "#48554a",
                          fontSize: "0.85rem",
                          cursor: "pointer",
                        }}
                      >
                        <Icon name={r.icon} />
                        <span>{r.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* COMMON: FULL NAME */}
                <div className="input-group">
                  <label>{registerRole === "posko" ? "Nama Lengkap Petugas" : registerRole === "responder" ? "Nama Narahubung / PIC" : "Nama Lengkap Warga"}</label>
                  <div className="input-wrapper">
                    <span className="input-icon"><Icon name="user" /></span>
                    <input 
                      type="text"
                      value={fullName} 
                      onChange={(e) => setFullName(e.target.value)} 
                      placeholder="Nama lengkap sesuai KTP" 
                      required
                    />
                  </div>
                </div>

                {/* CITIZEN SPECIFIC: NIK & WHATSAPP */}
                {registerRole === "citizen" && (
                  <>
                    <div className="input-group">
                      <label>Nomor Induk Kependudukan (NIK 16 Digit)</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><Icon name="file" /></span>
                        <input 
                          type="text"
                          value={nik} 
                          onChange={(e) => setNik(e.target.value)} 
                          placeholder="3202110482910002" 
                          maxLength={16}
                          required
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Nomor WhatsApp / Kontak Aktif</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><Icon name="user" /></span>
                        <input 
                          type="tel"
                          value={phone} 
                          onChange={(e) => setPhone(e.target.value)} 
                          placeholder="+62 812 4455 0188" 
                          required
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Alamat Domisili Warga</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><Icon name="pin" /></span>
                        <input 
                          type="text"
                          value={address} 
                          onChange={(e) => setAddress(e.target.value)} 
                          placeholder="RT 04 / RW 02, Desa Sukamaju, Kec. Cibadak" 
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* POSKO / BPBD SPECIFIC: POSKO NAME & REGION */}
                {registerRole === "posko" && (
                  <>
                    <div className="input-group">
                      <label>Nama Posko / Satgas BPBD Wilayah</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><Icon name="pin" /></span>
                        <input 
                          type="text"
                          value={poskoName} 
                          onChange={(e) => setPoskoName(e.target.value)} 
                          placeholder="Contoh: BPBD Wilayah Jawa Timur / Posko Sukamaju" 
                          required
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>NIP / Identitas Petugas Posko</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><Icon name="file" /></span>
                        <input 
                          type="text"
                          value={nik} 
                          onChange={(e) => setNik(e.target.value)} 
                          placeholder="PSK-SKB-2026-01" 
                          required
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Wilayah Cakungan Tanggap Darurat</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><Icon name="map" /></span>
                        <input 
                          type="text"
                          value={poskoRegion} 
                          onChange={(e) => setPoskoRegion(e.target.value)} 
                          placeholder="Kecamatan Cibadak, Kab. Sukabumi, Jawa Barat" 
                          required
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* RESPONDER SPECIFIC: ORGANIZATION & ARMADA */}
                {registerRole === "responder" && (
                  <>
                    <div className="input-group">
                      <label>Nama Organisasi / Instansi Penyalur</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><Icon name="box" /></span>
                        <input 
                          type="text"
                          value={orgName} 
                          onChange={(e) => setOrgName(e.target.value)} 
                          placeholder="BPBD Kab. Sukabumi / PMI / NGO Kemanusiaan" 
                          required
                        />
                      </div>
                    </div>
                    <div className="input-group">
                      <label>Jenis Armada Logistik yang Dimiliki</label>
                      <div className="input-wrapper">
                        <span className="input-icon"><Icon name="task" /></span>
                        <input 
                          type="text"
                          value={armadaType} 
                          onChange={(e) => setArmadaType(e.target.value)} 
                          placeholder="Truk Tangki 5000L / Mobil Pick-up / Ambulans" 
                          required
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="input-group">
              <label>Alamat Email</label>
              <div className="input-wrapper">
                <span className="input-icon"><Icon name="mail" /></span>
                <input 
                  type="email"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  placeholder="Masukkan alamat email Anda" 
                  required
                />
              </div>
            </div>

            <div className="input-group">
              <label>Kata Sandi</label>
              <div className="input-wrapper">
                <span className="input-icon"><Icon name="lock" /></span>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Masukkan kata sandi akun" 
                  required
                />
                <button 
                  type="button" 
                  className="input-eye-btn" 
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  <Icon name={showPassword ? "eyeOff" : "eye"} />
                </button>
              </div>
            </div>

            {mode === "login" && (
              <div className="login-options">
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                  /> 
                  <span>Ingat saya di perangkat ini</span>
                </label>
                <button type="button" className="btn-forgot" onClick={() => setResetInfo(true)}>
                  Lupa kata sandi?
                </button>
              </div>
            )}

            <Button type="submit" className="btn-auth-submit">
              {mode === "login" ? "Masuk ke Sistem" : "Daftar Akun Sekarang"} <Icon name="arrow" />
            </Button>
          </form>

          {/* CLEAN CREDENTIALS INFO CARD (TANPA TOMBOL QUICK LOGIN KLIK) */}
          {mode === "login" && (
            <div style={{ marginTop: "24px", background: "#f5f4ef", border: "1px solid #dcdad0", borderRadius: "12px", padding: "16px" }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "8px", fontWeight: 700, color: "#013220", fontSize: "0.9rem", marginBottom: "8px" }}>
                <span style={{ display: "inline-flex", marginTop: "2px", flexShrink: 0 }}><Icon name="check" /></span>
                <div>
                  <div>Akun Demo Terdaftar di Database</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#48554a", marginTop: "2px" }}>(Kata Sandi: <code>password</code>)</div>
                </div>
                
              </div>
              <ul style={{ margin: 0, paddingLeft: "18px", color: "#48554a", fontSize: "0.84rem", lineHeight: 1.6 }}>
                <li><strong>Masyarakat:</strong> <code>andi.masyarakat@reksa.id</code></li>
                <li><strong>Koordinator Posko BPBD:</strong> <code>siti.posko@reksa.id</code></li>
                <li><strong>Mitra Bantuan (BPBD/PMI):</strong> <code>arif.bpbd@reksa.id</code></li>
              </ul>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export type UserProfile = {
  name: string;
  email: string;
  phone: string;
  nik: string;
  org: string;
  address: string;
  role: string;
};

export type SharedState = { 
  status: string; 
  priority: string; 
  allocated: number; 
  delivered: number; 
  assignment: string; 
  logs: string[];
  poskoName?: string;
  poskoPic?: string;
  poskoPhone?: string;
  poskoAddress?: string;
  userProfile?: UserProfile;
  casesList: CaseRecord[];
  activeCaseId?: string;
  bursaList?: BursaItem[];
  misiList?: MisiItem[];
  penawaranList?: PenawaranItem[];
  activeBursaId?: number;
  activeMisiId?: number;
};

export type PortalPage = "dashboard" | "cases" | "case" | "report" | "notifications" | "history" | "profile" | "help" | "settings" | "map" | "resources" | "assignments" | "activity" | "tasks" | "active" | "offers" | "bursa" | "my-offers" | "chat";

export type RouterProps = {
  page: PortalPage;
  setPage: (p: PortalPage | "logout") => void;
  state: SharedState;
  update: (changes: Partial<SharedState>, log?: string) => void;
  notify: (msg: string) => void;
  name?: string;
  setName?: (n: string) => void;
  onRefresh?: () => Promise<void> | void;
  setRole?: (r: Role) => void;
};
type NavItem = { label: string; page: PortalPage | "logout"; icon: string };

const roleNavigation: Record<Role, { main: NavItem[]; bottom: NavItem[] }> = {
  citizen: {
    main: [
      { label: "Beranda", page: "dashboard", icon: "grid" },
      { label: "Ruang Komunikasi", page: "chat", icon: "chat" },
      { label: "Laporan Saya", page: "cases", icon: "file" },
      { label: "Laporkan Kebutuhan", page: "report", icon: "plus" },
      { label: "Riwayat", page: "history", icon: "clock" },
    ],
    bottom: [
      { label: "Notifikasi", page: "notifications", icon: "bell" },
      { label: "Profil", page: "profile", icon: "user" },
      { label: "Bantuan", page: "help", icon: "help" },
      { label: "Pengaturan", page: "settings", icon: "settings" },
      { label: "Logout", page: "logout", icon: "logout" },
    ],
  },
  posko: {
    main: [
      { label: "Dashboard Posko", page: "dashboard", icon: "grid" },
      { label: "Ruang Komunikasi", page: "chat", icon: "chat" },
      { label: "Verifikasi Laporan", page: "cases", icon: "file" },
      { label: "Kebutuhan & Bursa", page: "resources", icon: "box" },
      { label: "Penawaran & Alokasi", page: "offers", icon: "task" },
      { label: "Distribusi & Penerimaan", page: "assignments", icon: "pin" },
    ],
    bottom: [
      { label: "Peta Wilayah", page: "map", icon: "map" },
      { label: "Notifikasi", page: "notifications", icon: "bell" },
      { label: "Profil", page: "profile", icon: "user" },
      { label: "Pengaturan", page: "settings", icon: "settings" },
      { label: "Logout", page: "logout", icon: "logout" },
    ],
  },
  responder: {
    main: [
      { label: "Dashboard Mitra", page: "dashboard", icon: "grid" },
      { label: "Ruang Komunikasi", page: "chat", icon: "chat" },
      { label: "Bursa Bantuan", page: "bursa", icon: "box" },
      { label: "Penawaran Saya", page: "my-offers", icon: "file" },
      { label: "Misi Penyaluran", page: "tasks", icon: "task" },
      { label: "Riwayat Penyaluran", page: "history", icon: "clock" },
    ],
    bottom: [
      { label: "Peta Wilayah", page: "map", icon: "map" },
      { label: "Notifikasi", page: "notifications", icon: "bell" },
      { label: "Profil", page: "profile", icon: "user" },
      { label: "Pengaturan", page: "settings", icon: "settings" },
      { label: "Logout", page: "logout", icon: "logout" },
    ],
  },
};

function Modal({ title, children, close, icon }: { title: string; children: React.ReactNode; close: () => void; icon?: string }) {
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()}>
        {icon && <div className="modal-icon"><Icon name={icon} /></div>}
        <h2>{title}</h2>
        {children}
      </div>
    </div>
  );
}

function Sidebar({ role, page, collapsed, mobile, select, toggle, close, setRole, setName, notify, notifCount = 0 }: { 
  role: Role; 
  page: PortalPage; 
  collapsed: boolean; 
  mobile: boolean; 
  select: (p: PortalPage | "logout") => void; 
  toggle: () => void; 
  close: () => void;
  setRole?: (r: Role) => void;
  setName?: (n: string) => void;
  notify?: (msg: string) => void;
  notifCount?: number;
}) {
  const group = roleNavigation[role];
  const roleLabel = role === "citizen" ? "Masyarakat" : role === "posko" ? "Petugas Posko" : "Responder";
  const roleCopy = role === "citizen" ? "Akun pribadi" : role === "posko" ? "Akun institusi" : "Mitra terverifikasi";
  const badgeText = notifCount > 99 ? "99+" : notifCount > 0 ? String(notifCount) : null;
  const items = (rows: NavItem[]) => rows.map((item) => {
    const isNotif = item.label === "Notifikasi" || item.page === "notifications";
    return (
      <button 
        title={collapsed ? item.label : undefined} 
        className={page === item.page ? "active" : ""} 
        key={item.label} 
        onClick={() => { select(item.page); close(); }}
        style={{ position: "relative" }}
      >
        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={item.icon} />
          {isNotif && collapsed && badgeText && (
            <span className="nav-notif-badge-collapsed">{badgeText}</span>
          )}
        </span>
        <span>{item.label}</span>
        {isNotif && !collapsed && badgeText && (
          <span className="nav-notif-badge">{badgeText}</span>
        )}
      </button>
    );
  });
  return (
    <>
      <div className={`sidebar-scrim ${mobile ? "show" : ""}`} onClick={close} />
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobile ? "mobile-open" : ""}`}>
        <div className="side-logo">
          <Logo light />
          <button className="side-toggle" onClick={toggle} aria-label={collapsed ? "Perluas sidebar" : "Ciutkan sidebar"}>
            <Icon name="menu" />
          </button>
        </div>
        <div className="side-context">
          <span>Mode akses</span>
          <div>
            <i><Icon name="user" /></i>
            <p><b>{roleLabel}</b><small>{roleCopy}</small></p>
          </div>
          {setRole && !collapsed && (
            <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed rgba(255,255,255,0.15)" }}>
              <small style={{ fontSize: "10.5px", color: "rgba(255,255,255,0.7)", fontWeight: 600, display: "block", marginBottom: "6px" }}>
                Ganti Role / Akun Demo:
              </small>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "5px" }}>
                <button
                  type="button"
                  onClick={() => { setRole("citizen"); setName?.("Andi Pratama"); select("dashboard"); notify?.("Beralih ke role Warga (Andi Pratama)"); close(); }}
                  style={{
                    fontSize: "11px",
                    padding: "6px 2px",
                    borderRadius: "6px",
                    border: role === "citizen" ? "1px solid #b2d7bb" : "1px solid rgba(255,255,255,0.18)",
                    background: role === "citizen" ? "#15803d" : "rgba(255,255,255,0.08)",
                    color: "#ffffff",
                    fontWeight: role === "citizen" ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "center",
                    fontFamily: "inherit",
                  }}
                  title="Warga Pemohon (Andi Pratama)"
                >
                  Warga
                </button>
                <button
                  type="button"
                  onClick={() => { setRole("posko"); setName?.("Siti Rahma"); select("dashboard"); notify?.("Beralih ke role BPBD (Siti Rahma)"); close(); }}
                  style={{
                    fontSize: "11px",
                    padding: "6px 2px",
                    borderRadius: "6px",
                    border: role === "posko" ? "1px solid #c1c3ac" : "1px solid rgba(255,255,255,0.18)",
                    background: role === "posko" ? "#0f766e" : "rgba(255,255,255,0.08)",
                    color: "#ffffff",
                    fontWeight: role === "posko" ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "center",
                    fontFamily: "inherit",
                  }}
                  title="Koordinator Posko BPBD (Siti Rahma)"
                >
                  BPBD
                </button>
                <button
                  type="button"
                  onClick={() => { setRole("responder"); setName?.("Arif Nugroho"); select("dashboard"); notify?.("Beralih ke role Mitra Bantuan (Arif Nugroho)"); close(); }}
                  style={{
                    fontSize: "11px",
                    padding: "6px 2px",
                    borderRadius: "6px",
                    border: role === "responder" ? "1px solid #fde68a" : "1px solid rgba(255,255,255,0.18)",
                    background: role === "responder" ? "#b45309" : "rgba(255,255,255,0.08)",
                    color: "#ffffff",
                    fontWeight: role === "responder" ? 700 : 500,
                    cursor: "pointer",
                    textAlign: "center",
                    fontFamily: "inherit",
                  }}
                  title="Mitra / Satgas BPBD (Arif Nugroho)"
                >
                  Mitra
                </button>
              </div>
            </div>
          )}
        </div>
        <nav>{items(group.main)}</nav>
        <nav className="side-bottom">{items(group.bottom)}</nav>
      </aside>
    </>
  );
}

function Portal({ role, setRole, name, setName, state, update, logout, onRefresh }: { 
  role: Role; 
  setRole?: (r: Role) => void;
  name: string; 
  setName?: (n: string) => void; 
  state: SharedState; 
  update: (x: Partial<SharedState>, log?: string) => void; 
  logout: () => void; 
  onRefresh?: () => Promise<void> | void;
}) {
  const [page, setPage] = useState<PortalPage>(() => {
    const saved = localStorage.getItem("reksa_portal_page") as PortalPage;
    const validPages: PortalPage[] = [
      "dashboard", "cases", "case", "report", "notifications", "history", 
      "profile", "help", "settings", "map", "resources", "assignments", 
      "activity", "tasks", "active", "offers", "bursa", "my-offers"
    ];
    if (saved && validPages.includes(saved)) {
      return saved;
    }
    return "report";
  });
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth <= 1024);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [toast, setToast] = useState("");

  const isFirstMount = useRef(true);

  // Auto reset page to dashboard ONLY when role actually switches (not on initial mount/refresh)
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setPage("dashboard");
    localStorage.setItem("reksa_portal_page", "dashboard");
  }, [role]);

  useEffect(() => {
    const check = () => {
      const isNowMobile = window.innerWidth <= 1024;
      setIsMobileView(isNowMobile);
      if (!isNowMobile) setMobile(false);
    };
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("reksa_read_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch db activity logs for live unread counting
  useEffect(() => {
    let isMounted = true;
    const fetchLogs = () => {
      apiService.getActivityLogs()
        .then((res) => {
          if (isMounted && res.success && Array.isArray(res.data)) {
            setDbLogs(res.data);
          }
        })
        .catch(() => {});
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [state?.logs]);

  // Sync read notification IDs across components
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem("reksa_read_notifications");
        setReadNotifIds(saved ? JSON.parse(saved) : []);
      } catch {}
    };
    window.addEventListener("reksa_notifications_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("reksa_notifications_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Compute live unread notifications count
  const unreadCount = useMemo(() => {
    const readSet = new Set(readNotifIds);
    const list: { id: string; code: string; title: string; desc: string }[] = [];
    dbLogs.forEach((dbLog, idx) => {
      const code = dbLog.kebutuhan?.kode_kasus || `RK-2026-00${dbLog.kebutuhan_id || 124}`;
      list.push({
        id: `db-log-${dbLog.id || idx}`,
        code,
        title: dbLog.aksi || "Pembaruan Kasus",
        desc: dbLog.deskripsi || "",
      });
    });

    if (state?.logs && state.logs.length > 0) {
      state.logs.forEach((logText, idx) => {
        let code = state.activeCaseId || "RK-2026-00272";
        const matchCode = logText.match(/RK-\d{4}-\d{5}/);
        if (matchCode) code = matchCode[0];
        list.push({
          id: `live-log-${idx}-${logText.slice(0, 20)}`,
          code,
          title: "Pembaruan Kasus",
          desc: logText,
        });
      });
    }

    const seen = new Set<string>();
    const uniqueItems = list.filter((item) => {
      const key = `${item.code}-${item.title}-${item.desc.slice(0, 30)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    return uniqueItems.filter((n) => !readSet.has(n.id)).length;
  }, [dbLogs, readNotifIds, state?.logs, state?.activeCaseId]);

  const go = (p: PortalPage | "logout") => {
    if (p === "logout") return setLogoutOpen(true);
    setPage(p); 
    localStorage.setItem("reksa_portal_page", p);
    window.scrollTo(0, 0);
  };
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2800); };
  return <div className={`portal-shell ${collapsed && !isMobileView ? "side-collapsed" : ""}`}>
    <Sidebar role={role} setRole={setRole} setName={setName} notify={notify} page={page} collapsed={collapsed} mobile={mobile} select={go} toggle={() => setCollapsed(!collapsed)} close={() => setMobile(false)} notifCount={unreadCount} />
    <header className="mobile-header">
      <button onClick={() => setMobile(true)} aria-label="Buka menu"><Icon name="menu" /></button>
      <Logo />
      <button onClick={() => go("notifications")} aria-label="Notifikasi" style={{ position: "relative" }}>
        <Icon name="bell" />
        {unreadCount > 0 && (
          <span className="mobile-header-notif-badge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
    </header>
    <div className="portal-content">
      {role === "citizen" && <CitizenRouter page={page} setPage={go} state={state} update={update} notify={notify} name={name} setName={setName} onRefresh={onRefresh} setRole={setRole} />}
      {role === "posko" && <PoskoRouter page={page} setPage={go} state={state} update={update} notify={notify} name={name} setName={setName} onRefresh={onRefresh} setRole={setRole} />}
      {role === "responder" && <ResponderRouter page={page} setPage={go} state={state} update={update} notify={notify} name={name} setName={setName} onRefresh={onRefresh} setRole={setRole} />}
      {page !== "chat" && (
        <button
          className="floating-chat-trigger-btn"
          onClick={() => go("chat")}
          title="Buka Ruang Komunikasi Terpadu 3 Role (Live)"
          type="button"
        >
          <span className="floating-chat-icon">💬</span>
          <span className="floating-chat-text">Ruang Komunikasi</span>
          <span className="floating-chat-badge">Live</span>
        </button>
      )}
      <MobileNav role={role} page={page} go={go} notifCount={unreadCount} />
    </div>
    {logoutOpen && <Modal icon="logout" title="Keluar dari akun?" close={() => setLogoutOpen(false)}><p>Sesi Anda akan diakhiri. Anda dapat masuk kembali kapan saja.</p><div className="modal-actions"><Button variant="secondary" onClick={() => setLogoutOpen(false)}>Batal</Button><Button onClick={logout}>Keluar</Button></div></Modal>}
    {toast && <div className="toast"><Icon name="check" /> {toast}</div>}
  </div>;
}

function MobileNav({ role, page, go, notifCount = 0 }: { role: Role; page: PortalPage; go: (p: PortalPage) => void; notifCount?: number }) {
  const items = roleNavigation[role].main.slice(0, 4);
  const badgeText = notifCount > 99 ? "99+" : notifCount > 0 ? String(notifCount) : null;
  return (
    <nav className="mobile-bottom">
      {items.map((x) => {
        const isNotif = x.label === "Notifikasi" || x.page === "notifications";
        return (
          <button className={page === x.page ? "active" : ""} onClick={() => go(x.page as PortalPage)} key={x.label} style={{ position: "relative" }}>
            <span style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name={x.icon} />
              {isNotif && badgeText && <span className="mobile-bottom-notif-badge">{badgeText}</span>}
            </span>
            <span>{x.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function PageHead({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy: string; action?: React.ReactNode }) {
  return (
    <div className="workspace-title">
      <div className="workspace-title-text">
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{copy}</p>
      </div>
      {action && <div className="workspace-title-action">{action}</div>}
    </div>
  );
}

function CitizenRouter({ page, setPage, state, update, notify, name = "Andi Pratama", setName, onRefresh, setRole }: RouterProps) {
  if (page === "dashboard") return <CitizenDashboard state={state} update={update} setPage={setPage} name={name} />;
  if (page === "chat") return <ChatKoordinasi role="citizen" name={name} state={state} notify={notify} onRefresh={onRefresh} setPage={setPage} />;
  if (page === "report") return <CitizenReport complete={() => setPage("cases")} update={update} state={state} />;
  if (page === "case") return <CaseDetail state={state} update={update} back={() => setPage("cases")} onRefresh={onRefresh} notify={notify} setRole={setRole} setName={setName} />;
  if (page === "cases") return <CitizenCaseList title="Laporan Saya" copy="Semua kebutuhan yang pernah Anda laporkan." onCase={(c) => { if (c?.id) update({ activeCaseId: c.id }); setPage("case"); }} own state={state} update={update} onNavigateToReport={() => setPage("report")} />;
  if (page === "history") return <CitizenCaseList title="Riwayat" copy="Kebutuhan yang telah selesai dan dikonfirmasi." onCase={(c) => { if (c?.id) update({ activeCaseId: c.id }); setPage("case"); }} completed own state={state} update={update} onNavigateToReport={() => setPage("report")} onNavigateToCases={() => setPage("cases")} />;
  if (page === "notifications") return <Notifications role="citizen" open={() => setPage("case")} state={state} update={update} setPage={setPage} />;
  if (page === "profile") return <Profile name={name} role="Masyarakat" notify={notify} state={state} update={update} setName={setName} />;
  if (page === "settings") return <Settings notify={notify} />;
  return <Help />;
}


function CaseDetail({ 
  state, 
  update, 
  back, 
  posko = false, 
  onRefresh, 
  notify, 
  setRole, 
  setName 
}: { 
  state: SharedState; 
  update: RouterProps["update"]; 
  back: () => void; 
  posko?: boolean; 
  onRefresh?: () => Promise<void> | void; 
  notify?: RouterProps["notify"]; 
  setRole?: (r: Role) => void; 
  setName?: (n: string) => void; 
}) {
  const currentCases = state.casesList || [];
  const activeCase = currentCases.find((c) => c.id === state.activeCaseId) || currentCases[0];

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isApprovingClaim, setIsApprovingClaim] = useState(false);

  // Clarification answering states for Citizen
  const [clarificationAnswer, setClarificationAnswer] = useState("");
  const [newClarificationPhoto, setNewClarificationPhoto] = useState<string>("");
  const [photoUploadName, setPhotoUploadName] = useState<string>("");
  const [isSubmittingClarification, setIsSubmittingClarification] = useState(false);
  const [showClarificationAdjustments, setShowClarificationAdjustments] = useState(false);
  const [clarifVolume, setClarifVolume] = useState(activeCase?.qty || "");
  const [clarifKk, setClarifKk] = useState<number | "">(activeCase ? parseInt(activeCase.kk) || 1 : 1);

  // Form states for editing (UPDATE)
  const [editTitle, setEditTitle] = useState(activeCase ? `Kebutuhan ${activeCase.item} (${activeCase.kk})` : "");
  const [editVolume, setEditVolume] = useState(activeCase?.qty || "");
  const [editKk, setEditKk] = useState(activeCase ? (parseInt(activeCase.kk) || 1) : 1);
  const [editPriority, setEditPriority] = useState(activeCase?.urgency || "Sedang");
  const [editDesc, setEditDesc] = useState(activeCase?.notes || "");

  useEffect(() => {
    if (activeCase) {
      setEditTitle(`Kebutuhan ${activeCase.item} (${activeCase.kk})`);
      setEditVolume(activeCase.qty);
      setEditKk(parseInt(activeCase.kk) || 1);
      setEditPriority(activeCase.urgency || "Sedang");
      setEditDesc(activeCase.notes || `Kebutuhan logistik mendesak ${activeCase.item} untuk warga di ${activeCase.location}.`);
      setClarificationAnswer("");
      setNewClarificationPhoto("");
      setPhotoUploadName("");
      setClarifVolume(activeCase.qty || "");
      setClarifKk(parseInt(activeCase.kk) || 1);
      setShowClarificationAdjustments(false);
    }
  }, [activeCase?.id, activeCase?.item, activeCase?.qty, activeCase?.kk, activeCase?.urgency, activeCase?.notes, activeCase?.location]);

  const handleClarificationPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoUploadName(file.name);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (uploadEvent) => {
          const rawResult = uploadEvent.target?.result as string;
          if (rawResult) {
            const img = new Image();
            img.onload = () => {
              try {
                const canvas = document.createElement("canvas");
                const maxDim = 1280;
                let width = img.width;
                let height = img.height;
                if (width > maxDim || height > maxDim) {
                  if (width > height) {
                    height = Math.round((height * maxDim) / width);
                    width = maxDim;
                  } else {
                    width = Math.round((width * maxDim) / height);
                    height = maxDim;
                  }
                }
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                if (ctx) {
                  ctx.drawImage(img, 0, 0, width, height);
                  const compressed = canvas.toDataURL("image/jpeg", 0.82);
                  setNewClarificationPhoto(compressed);
                } else {
                  setNewClarificationPhoto(rawResult);
                }
              } catch {
                setNewClarificationPhoto(rawResult);
              }
            };
            img.onerror = () => {
              setNewClarificationPhoto(rawResult);
            };
            img.src = rawResult;
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmitClarification = async () => {
    if (!clarificationAnswer.trim()) {
      notify?.("Mohon tuliskan jawaban klarifikasi Anda.");
      return;
    }
    if (activeCase?.memintaLampiran && !newClarificationPhoto && !activeCase?.fotoKlarifikasi) {
      notify?.("Petugas Posko BPBD mewajibkan unggahan foto/dokumen fisik tambahan.");
      return;
    }
    try {
      setIsSubmittingClarification(true);
      const payload: {
        jawaban: string;
        foto_klarifikasi?: string;
        jumlah_kk?: number;
        volume_permintaan?: string;
        citizen_name?: string;
      } = {
        jawaban: clarificationAnswer.trim(),
        foto_klarifikasi: newClarificationPhoto || undefined,
        citizen_name: activeCase.applicantName || "Andi Pratama",
      };
      if (showClarificationAdjustments) {
        if (clarifVolume.trim() && clarifVolume !== activeCase.qty) {
          payload.volume_permintaan = clarifVolume.trim();
        }
        if (typeof clarifKk === "number" && clarifKk > 0) {
          payload.jumlah_kk = clarifKk;
        }
      }
      const res = await apiService.jawabKlarifikasi(activeCase.id, payload);
      if (res.success) {
        notify?.("Jawaban klarifikasi berhasil dikirim! Laporan Anda kini masuk antrean peninjauan ulang oleh Petugas Posko BPBD.");
        const updatedCases = currentCases.map((c) =>
          c.id === activeCase.id
            ? {
                ...c,
                status: "Dalam Verifikasi",
                jawabanKlarifikasi: clarificationAnswer.trim(),
                fotoKlarifikasi: newClarificationPhoto || c.fotoKlarifikasi,
                qty: payload.volume_permintaan || c.qty,
                kk: payload.jumlah_kk ? `${payload.jumlah_kk} KK` : c.kk,
              }
            : c
        );
        update(
          { casesList: updatedCases, status: "Dalam Verifikasi" },
          `[KLARIFIKASI DIJAWAB] Pelapor mengirimkan jawaban klarifikasi untuk kasus ${activeCase.id}. Menunggu peninjauan ulang Posko BPBD.`
        );
        setClarificationAnswer("");
        setNewClarificationPhoto("");
        setPhotoUploadName("");
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal mengirim jawaban klarifikasi.");
    } finally {
      setIsSubmittingClarification(false);
    }
  };

  if (!activeCase) {
    return (
      <main className="workspace case-detail-workspace">
        <button className="btn-back-nav" onClick={back} style={{ margin: "0 0 20px 0" }}>
          <Icon name="arrow" /> Kembali ke Daftar Kasus
        </button>
        <div style={{ padding: "40px 24px", textAlign: "center", background: "#fbfbf8", border: "1.5px dashed #b2d7bb", borderRadius: "20px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", background: "#e8f3ea", display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#013220", fontSize: "24px", marginBottom: "16px" }}>
            <Icon name="file" />
          </div>
          <h2 style={{ color: "#013220", fontSize: "1.25rem", margin: "0 0 8px", fontWeight: 700 }}>Data Laporan Tidak Ditemukan</h2>
          <p style={{ color: "#546558", fontSize: "0.92rem", margin: "0 0 16px" }}>
            Belum ada data laporan kasus aktif di database atau laporan telah dihapus.
          </p>
          <Button onClick={back}>Kembali ke Daftar Laporan</Button>
        </div>
      </main>
    );
  }

  const handleSaveEdit = async () => {
    const cleanItem = editTitle.replace(/^Kebutuhan\s+/i, "").replace(/\s*\(.*?\)$/, "") || activeCase.item;
    const parsedKk = typeof editKk === "number" ? editKk : parseInt(String(editKk).replace(/[^0-9]/g, '')) || 1;
    const updatedCases = currentCases.map((c) => 
      c.id === activeCase.id 
        ? {
            ...c,
            item: cleanItem,
            qty: editVolume,
            kk: `${parsedKk} KK`,
            urgency: editPriority,
            notes: editDesc,
          }
        : c
    );

    // 1. Update localStorage & React State
    localStorage.setItem("reksa_cases_db", JSON.stringify(updatedCases));
    update(
      { 
        casesList: updatedCases,
        priority: editPriority,
      },
      `[UPDATE DATA] Data kebutuhan ${activeCase.id} diperbarui: ${editVolume} untuk ${parsedKk} KK (Prioritas: ${editPriority}).`
    );
    setIsEditOpen(false);

    // 2. Send PUT request to Laravel Database
    try {
      await apiService.updateKebutuhan(activeCase.id, {
        kategori_kebutuhan: cleanItem,
        volume_permintaan: editVolume,
        jumlah_kk: parsedKk,
        tingkat_urgensi: editPriority,
        deskripsi: editDesc,
      });
    } catch (e) {
      console.log("API update error:", e);
    }
  };

  const handleDelete = () => {
    const updatedCases = currentCases.filter((c) => c.id !== activeCase.id);

    // 1. Send DELETE to Laravel backend
    apiService.deleteKebutuhan(activeCase.id).catch((e) => console.log("API delete error:", e));

    // 2. Track deleted ID in localStorage
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem("reksa_deleted_ids") || "[]");
      if (!deletedIds.includes(activeCase.id)) {
        deletedIds.push(activeCase.id);
        localStorage.setItem("reksa_deleted_ids", JSON.stringify(deletedIds));
      }
    } catch (e) {}

    // 3. Update React State
    update(
      { 
        casesList: updatedCases,
        activeCaseId: updatedCases[0]?.id,
      },
      `[DELETE] Laporan kasus ${activeCase.id} (${activeCase.item}) telah dihapus dari sistem.`
    );
    setIsDeleteOpen(false);
    back();
  };

  const handleVerify = async () => {
    try {
      setIsVerifying(true);
      if (activeCase?.id) {
        const mapPriority = (u?: string) => {
          if (!u) return "Kritis";
          const low = u.toLowerCase();
          if (low.includes("kritis") || low.includes("sangat")) return "Kritis";
          if (low.includes("tinggi") || low.includes("segera")) return "Tinggi";
          return "Sedang";
        };
        const res = await apiService.verifyKebutuhan(activeCase.id, { 
          action: "verify_and_publish",
          priority: mapPriority(activeCase.urgency),
          catatan: "Divalidasi oleh Koordinator Posko dan dirilis ke Bursa Bantuan Terbuka."
        });
        if (res.success) {
          notify?.(`Laporan ${activeCase.id} berhasil diverifikasi oleh Posko BPBD! Status kini Kebutuhan Terbuka & dipublikasikan ke Bursa.`);
        }
      }
    } catch (err: any) {
      console.warn("Sync failed, falling back to local state:", err);
      notify?.(err?.message || "Gagal memverifikasi laporan.");
    } finally {
      setIsVerifying(false);
    }
    const updatedCases = currentCases.map((c) => 
      c.id === activeCase.id ? { ...c, status: "Kebutuhan Terbuka" } : c
    );
    update(
      { casesList: updatedCases, status: "Kebutuhan Terbuka" },
      `Laporan kasus ${activeCase.id} diverifikasi & disetujui untuk dipublikasikan ke Bursa Kebutuhan Terbuka oleh Petugas Posko.`
    );
    await onRefresh?.();
  };

  const handleApproveBursaClaim = async () => {
    try {
      setIsApprovingClaim(true);
      const matchingOffer = state.penawaranList?.find(
        (p) =>
          ((activeCase?.rawId && p.kebutuhan_id === activeCase.rawId) ||
           p.kebutuhan?.kode_kasus === activeCase?.id ||
           p.kebutuhan_id?.toString() === activeCase?.id) &&
          p.status === "Diajukan"
      );
      const matchingBursa = state.bursaList?.find(
        (b) =>
          (activeCase?.rawId && b.kebutuhan_id === activeCase.rawId) ||
          b.kebutuhan?.kode_kasus === activeCase?.id ||
          b.kebutuhan_id?.toString() === activeCase?.id ||
          (b.item_bantuan && activeCase?.item && b.item_bantuan.toLowerCase().includes(activeCase.item.toLowerCase()))
      );

      if (matchingOffer) {
        const res = await apiService.approvePenawaran(matchingOffer.id, {
          approved_volume: matchingOffer.jumlah_tawaran,
          catatan: "Proposal disetujui Koordinator Posko dari Detail Kasus.",
        });
        if (res.success) {
          notify?.(`Proposal mitra berhasil disetujui! Misi ${res.data.misi?.kode_misi || "MISI"} resmi diterbitkan.`);
        }
      } else if (matchingBursa) {
        const res = await apiService.approveClaimBursa(matchingBursa.id, {
          approved_volume: matchingBursa.claimed_volume || matchingBursa.target_volume,
          catatan: "Alokasi disetujui Koordinator Posko dari Detail Kasus.",
        });
        if (res.success) {
          notify?.(`Proposal mitra berhasil disetujui! Misi ${res.data.misi?.kode_misi || "MISI"} resmi diterbitkan.`);
        }
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal menyetujui klaim bantuan mitra.");
    } finally {
      setIsApprovingClaim(false);
    }
    const updatedCases = currentCases.map((c) => 
      c.id === activeCase.id ? { ...c, status: "Teralokasi Penuh" } : c
    );
    update(
      { casesList: updatedCases, status: "Teralokasi Penuh" },
      `Klaim mitra untuk kasus ${activeCase.id} telah disetujui oleh Koordinator Posko.`
    );
    await onRefresh?.();
  };

  const handleConfirmReceived = async () => {
    try {
      if (activeCase?.id) {
        await apiService.confirmReceiptKebutuhan(activeCase.id);
      }
    } catch (err) {
      console.warn("Sync failed, falling back to local state:", err);
    }
    const updatedCases = currentCases.map((c) => 
      c.id === activeCase.id ? { ...c, status: "Selesai", delivered: 1000 } : c
    );
    update(
      { casesList: updatedCases, status: "Selesai", assignment: "Selesai", delivered: 1000 },
      `Bantuan ${activeCase.item} (${activeCase.qty}) untuk kasus ${activeCase.id} telah dikonfirmasi diterima tuntas oleh warga di ${activeCase.location}. Kasus resmi diselesaikan (RESOLVED).`
    );
    await onRefresh?.();
  };

  // Accurate progressive fulfillment calculation (5 stages = 20% each)
  const percent = getCaseProgress(activeCase.status);

  // Extract and match records from live database state
  const matchedBursa = state.bursaList?.find(
    (b) =>
      (activeCase?.rawId && b.kebutuhan_id === activeCase.rawId) ||
      b.kebutuhan?.kode_kasus === activeCase?.id ||
      b.kebutuhan_id?.toString() === activeCase?.id ||
      (b.item_bantuan && activeCase?.item && b.item_bantuan.toLowerCase().includes(activeCase.item.toLowerCase()))
  );

  const matchedMisiList = (state.misiList || []).filter(
    (m) =>
      (activeCase?.rawId && m.kebutuhan_id === activeCase.rawId) ||
      m.kebutuhan?.kode_kasus === activeCase?.id ||
      m.kebutuhan_id?.toString() === activeCase?.id ||
      (matchedBursa && m.bursa_id === matchedBursa.id)
  );

  const matchedOffers = (state.penawaranList || []).filter(
    (p) =>
      (activeCase?.rawId && p.kebutuhan_id === activeCase.rawId) ||
      p.kebutuhan?.kode_kasus === activeCase?.id ||
      p.kebutuhan_id?.toString() === activeCase?.id ||
      (matchedBursa && p.bursa_id === matchedBursa.id)
  );

  // Dynamic Real-time Calculations for Quota Telemetry
  const parseVolNum = (val?: string) => {
    if (!val) return 0;
    const match = val.match(/[\d.,]+/);
    if (!match) return 0;
    return parseFloat(match[0].replace(/\./g, "").replace(",", ".")) || 0;
  };
  const parseVolUnit = (val?: string) => {
    if (!val) return "Unit";
    const cleaned = val.replace(/[\d.,\s]+/g, " ").trim();
    return cleaned || "Unit";
  };

  const targetVolNum = parseVolNum(activeCase?.qty);
  const targetVolUnit = parseVolUnit(activeCase?.qty);

  // Sum all mission payload
  const missionsTotalVol = matchedMisiList.reduce((acc, m) => acc + parseVolNum(m.muatan), 0);

  // Pending claim/offer volume
  const proposedClaimVol = (matchedOffers.length > 0
    ? matchedOffers.reduce((acc, p) => acc + parseVolNum(p.jumlah_tawaran), 0)
    : (matchedBursa?.claimed_volume ? parseVolNum(matchedBursa.claimed_volume) : 0));

  let realizedVolNum = 0;
  if (activeCase?.status === "Selesai") {
    realizedVolNum = missionsTotalVol > 0 ? missionsTotalVol : targetVolNum;
  } else if (missionsTotalVol > 0) {
    realizedVolNum = missionsTotalVol;
  } else if (proposedClaimVol > 0) {
    realizedVolNum = proposedClaimVol;
  }

  const deficitVolNum = activeCase?.status === "Selesai" ? 0 : Math.max(0, targetVolNum - realizedVolNum);
  const percentFulfilled = targetVolNum > 0 ? Math.min(100, Math.round((realizedVolNum / targetVolNum) * 100)) : 0;

  const caseLat = typeof activeCase.lat === "number" && !isNaN(activeCase.lat) ? activeCase.lat : -7.2654;
  const caseLng = typeof activeCase.lng === "number" && !isNaN(activeCase.lng) ? activeCase.lng : 112.7521;

  return (
    <main className="workspace case-detail-workspace">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <button className="btn-back-nav" onClick={back} style={{ margin: 0 }}>
          <Icon name="arrow" /> Kembali ke Daftar Kasus
        </button>

        {/* EXPLICIT CRUD ACTION BUTTONS */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            type="button" 
            className="btn-case-action secondary"
            onClick={() => setIsEditOpen(true)}
          >
            <Icon name="edit" /> Ubah Data
          </button>
          <button 
            type="button" 
            className="btn-case-action danger"
            onClick={() => setIsDeleteOpen(true)}
          >
            <Icon name="trash" /> Hapus Laporan
          </button>
        </div>
      </div>

      {/* CALLOUT PENOLAKAN LAPORAN (JIKA STATUS DITOLAK) */}
      {activeCase.status === "Ditolak" && (
        <div style={{ background: "#fef2f2", border: "1.5px solid #ef4444", borderRadius: "14px", padding: "18px 22px", marginBottom: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b91c1c", fontWeight: 700, fontSize: "1.05rem", marginBottom: "8px" }}>
            ❌ Laporan Kebutuhan Ditolak oleh Posko BPBD
          </div>
          <div style={{ background: "#ffffff", border: "1px solid #fecaca", borderRadius: "10px", padding: "12px 16px", marginBottom: "10px" }}>
            <small style={{ color: "#991b1b", fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", display: "block", marginBottom: "3px" }}>
              Alasan Penolakan dari Petugas:
            </small>
            <div style={{ color: "#1e293b", fontWeight: 600, fontSize: "0.95rem" }}>
              "{activeCase.alasanPenolakan || 'Laporan tidak sesuai kriteria prioritas darurat posko.'}"
            </div>
          </div>
          <div style={{ background: "#fff5f5", border: "1px dashed #fca5a5", borderRadius: "10px", padding: "12px 16px" }}>
            <small style={{ color: "#991b1b", fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", display: "block", marginBottom: "3px" }}>
              Saran &amp; Rekomendasi Tindak Lanjut:
            </small>
            <div style={{ color: "#475569", fontSize: "0.9rem", lineHeight: 1.5 }}>
              {activeCase.tindakLanjutPenolakan || "Silakan berkoordinasi dengan pengurus RT/RW setempat atau kunjungi posko bantuan terdekat di kantor kelurahan/kecamatan."}
            </div>
          </div>
        </div>
      )}

      {/* CALLOUT KLARIFIKASI DARI BPBD (JIKA STATUS PERLU KLARIFIKASI) */}
      {activeCase.status === "Perlu Klarifikasi" && (
        <div style={{ background: "#fffbeb", border: "1.5px solid #f59e0b", borderRadius: "14px", padding: "20px 22px", marginBottom: "18px", boxShadow: "0 4px 12px rgba(245, 158, 11, 0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#b45309", fontWeight: 700, fontSize: "1.05rem" }}>
              ⚠️ Permintaan Klarifikasi dari Petugas Posko BPBD
            </div>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.8rem", background: "#fef3c7", color: "#92400e", border: "1px solid #fde68a", padding: "3px 10px", borderRadius: "8px", fontWeight: 600 }}>
                Kategori: {activeCase.kategoriKlarifikasi || "Kelengkapan Informasi"}
              </span>
              {activeCase.memintaLampiran && (
                <span style={{ fontSize: "0.8rem", background: "#d97706", color: "#ffffff", padding: "3px 10px", borderRadius: "8px", fontWeight: 700 }}>
                  Memerlukan Unggahan Foto/Dokumen Baru
                </span>
              )}
            </div>
          </div>

          <div style={{ background: "#ffffff", border: "1px solid #fde68a", borderRadius: "10px", padding: "14px 16px", marginBottom: "16px" }}>
            <small style={{ color: "#78350f", fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", display: "block", marginBottom: "4px" }}>
              Instruksi &amp; Pertanyaan Posko BPBD:
            </small>
            <div style={{ fontSize: "0.95rem", color: "#1e293b", lineHeight: 1.5, fontWeight: 600 }}>
              "{activeCase.pertanyaanKlarifikasi || 'Mohon berikan rincian data tambahan untuk laporan kebutuhan ini.'}"
            </div>
          </div>

          {/* FORMULIR JAWABAN MASYARAKAT */}
          <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "18px" }}>
            <h4 style={{ margin: "0 0 10px", color: "#013220", fontSize: "0.98rem", fontWeight: 700 }}>
              Formulir Tanggapan &amp; Jawaban Klarifikasi:
            </h4>
            <p style={{ margin: "0 0 12px", color: "#64748b", fontSize: "0.85rem" }}>
              Anda dapat melengkapi penjelasan dan melampirkan berkas tanpa perlu mengisi ulang seluruh laporan.
            </p>
            <textarea
              className="form-control textarea"
              rows={3}
              placeholder="Tuliskan jawaban penjelasan klarifikasi Anda untuk petugas BPBD..."
              value={clarificationAnswer}
              onChange={(e) => setClarificationAnswer(e.target.value)}
              style={{ marginBottom: "12px", width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.9rem" }}
            />

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px", marginBottom: "14px" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#334155", marginBottom: "4px" }}>
                  {activeCase.memintaLampiran ? "Unggah Foto / Dokumen Baru (Wajib Diminta BPBD):" : "Unggah Foto / Dokumen Pendukung Baru (Opsional):"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleClarificationPhotoUpload}
                  style={{ fontSize: "0.85rem", padding: "6px 0" }}
                />
                {photoUploadName && (
                  <small style={{ display: "block", color: "#047857", fontWeight: 600, marginTop: "2px" }}>
                    ✓ Berkas dipilih: {photoUploadName}
                  </small>
                )}
                <small style={{ display: "block", color: "#64748b", fontSize: "0.78rem", marginTop: "4px" }}>
                  *Berkas foto lama Anda tetap tersimpan utuh dalam riwayat laporan.
                </small>
              </div>

              {newClarificationPhoto && (
                <div>
                  <span style={{ fontSize: "0.8rem", color: "#334155", fontWeight: 600, display: "block", marginBottom: "4px" }}>Pratinjau Foto Baru:</span>
                  <img src={newClarificationPhoto} alt="Pratinjau Klarifikasi" style={{ width: "100%", height: "100px", objectFit: "cover", borderRadius: "8px", border: "1px solid #cbd5e1" }} />
                </div>
              )}
            </div>

            {/* TOGGLE PENYESUAIAN VOLUME / KK JIKA POSKO MEMINTA KOREKSI */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "12px", marginBottom: "14px" }}>
              <button
                type="button"
                onClick={() => setShowClarificationAdjustments(!showClarificationAdjustments)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#013220",
                  fontWeight: 600,
                  fontSize: "0.86rem",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <span>{showClarificationAdjustments ? "▼ Sembunyikan Koreksi Volume/KK" : "▶ Koreksi Jumlah Volume / KK (Jika Diminta Posko)"}</span>
              </button>

              {showClarificationAdjustments && (
                <div
                  style={{
                    marginTop: "10px",
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    background: "#f9fafb",
                    padding: "12px",
                    borderRadius: "10px",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                      Volume Permintaan Baru
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={clarifVolume}
                      onChange={(e) => setClarifVolume(e.target.value)}
                      placeholder="Contoh: 10 Kotak"
                      style={{ fontSize: "0.85rem", padding: "8px" }}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#374151", marginBottom: "4px" }}>
                      Jumlah KK Baru
                    </label>
                    <input
                      type="number"
                      min={1}
                      className="form-control"
                      value={clarifKk}
                      onChange={(e) => setClarifKk(e.target.value ? Number(e.target.value) : "")}
                      style={{ fontSize: "0.85rem", padding: "8px" }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", borderTop: "1px solid #f1f5f9", paddingTop: "12px" }}>
              <small style={{ color: "#64748b", fontSize: "0.82rem" }}>
                Status laporan akan berubah menjadi <b>Dalam Verifikasi (Menunggu Peninjauan Ulang)</b>.
              </small>
              <button
                type="button"
                onClick={handleSubmitClarification}
                disabled={isSubmittingClarification || !clarificationAnswer.trim()}
                style={{ background: "#013220", color: "#ffffff", border: "none", padding: "10px 22px", borderRadius: "10px", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Icon name="check" /> {isSubmittingClarification ? "Mengirimkan Jawaban..." : "Kirim Jawaban Klarifikasi"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CALLOUT JAWABAN KLARIFIKASI SEDANG DITINJAU ULANG POSKO */}
      {activeCase.jawabanKlarifikasi && (activeCase.status === "Dalam Verifikasi" || activeCase.status === "Diajukan") && (
        <div style={{ background: "#f0fdf4", border: "1.5px solid #86efac", borderRadius: "14px", padding: "16px 20px", marginBottom: "18px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#166534", fontWeight: 700, fontSize: "0.95rem" }}>
              ✓ Jawaban Klarifikasi Masyarakat Telah Terkirim (Menunggu Peninjauan Ulang Petugas BPBD)
            </div>
            <span style={{ fontSize: "0.78rem", background: "#dcfce7", color: "#15803d", padding: "3px 10px", borderRadius: "12px", fontWeight: 600 }}>
              Antrean Tinjauan Ulang
            </span>
          </div>
          <div style={{ fontSize: "0.88rem", color: "#1e293b", background: "#ffffff", padding: "10px 14px", borderRadius: "8px", border: "1px solid #bbf7d0", marginBottom: "6px" }}>
            <b>Jawaban Pelapor:</b> "{activeCase.jawabanKlarifikasi}"
          </div>
          {activeCase.fotoKlarifikasi && (
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "#166534" }}>
              <span>📷 Lampiran Tambahan Terbaru:</span>
              <a href={activeCase.fotoKlarifikasi} target="_blank" rel="noreferrer" style={{ color: "#0284c7", fontWeight: 600, textDecoration: "underline" }}>
                Lihat Foto/Dokumen Klarifikasi
              </a>
            </div>
          )}
          {posko && (
            <div style={{ marginTop: "12px", display: "flex", gap: "10px" }}>
              <button
                type="button"
                className="btn btn-primary"
                style={{ background: "#047857", padding: "8px 18px", fontSize: "0.85rem", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
                onClick={handleVerify}
                disabled={isVerifying}
              >
                ✓ Verifikasi &amp; Rilis ke Bursa Bantuan
              </button>
            </div>
          )}
        </div>
      )}

      {/* TOP CASE HERO HEADER */}
      <div className="case-hero-banner">
        <div className="case-hero-main">
          <div className="case-hero-badge-row">
            <span className="case-hero-code">KODE KASUS: {activeCase.id}</span>
            <span className="case-hero-posko-badge">
              <Icon name="pin" /> {activeCase.posko?.split(" - ")[0] || state.poskoName || "Posko BPBD Wilayah"}
            </span>
            <span className={`case-hero-urgency-badge ${activeCase.urgency === "Kritis" ? "critical" : activeCase.urgency === "Tinggi" || activeCase.urgency === "Perlu segera" ? "high" : "medium"}`}>
              Prioritas {activeCase.urgency}
            </span>
          </div>
          <h1>{editTitle}</h1>
          <div className="case-hero-meta-row">
            <span><Icon name="pin" /> Lokasi: <strong>{activeCase.location}</strong></span>
            <span><Icon name="user" /> Agregasi: <strong>{activeCase.kk}</strong> Terdampak</span>
            <span><Icon name="box" /> Target Permintaan: <strong>{activeCase.qty}</strong></span>
            <span><Icon name="clock" /> Dilaporkan: <strong>{activeCase.date || "Hari ini"}</strong></span>
          </div>
        </div>
        <div className="case-hero-quick-action">
          {posko && (activeCase.status === "Dalam Verifikasi" || activeCase.status === "Diajukan") && (
            <button type="button" className="btn-hero-action secondary" onClick={handleVerify} disabled={isVerifying}>
              <Icon name="check" /> {isVerifying ? "Memproses Verifikasi..." : "Verifikasi Kasus (Approve)"}
            </button>
          )}
          {posko && activeCase.status === "Klaim Diajukan" && (
            <button type="button" className="btn-hero-action primary" onClick={handleApproveBursaClaim} disabled={isApprovingClaim} style={{ background: "#ea580c", borderColor: "#ea580c" }}>
              <Icon name="check" /> {isApprovingClaim ? "Menerbitkan Misi..." : "Setujui Alokasi Mitra"}
            </button>
          )}
          {(activeCase.status === "Menunggu Konfirmasi Penerimaan" || activeCase.status === "Dalam Pengiriman" || activeCase.status === "Ditugaskan") && (
            <button type="button" className="btn-hero-action primary" onClick={handleConfirmReceived}>
              <Icon name="check" /> Konfirmasi Penerimaan
            </button>
          )}
          {activeCase.status === "Selesai" && (
            <div className="verified-pill">
              <Icon name="check" /> Kasus Telah Selesai &amp; Bantuan Diterima Warga
            </div>
          )}
        </div>
      </div>

      {/* MODAL EDIT DATA */}
      {isEditOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", maxWidth: "540px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#013220", fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon name="edit" /> Ubah Rincian Kasus {activeCase.id}
              </h3>
              <button type="button" onClick={() => setIsEditOpen(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#80866e" }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label className="form-label" style={{ marginBottom: "4px" }}>Judul Kebutuhan</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editTitle} 
                  onChange={(e) => setEditTitle(e.target.value)} 
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label className="form-label" style={{ marginBottom: "4px" }}>Volume Permintaan</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    value={editVolume} 
                    onChange={(e) => setEditVolume(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="form-label" style={{ marginBottom: "4px" }}>Jumlah KK Terdampak</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    value={editKk} 
                    onChange={(e) => setEditKk(Number(e.target.value))} 
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: "4px" }}>
                  {posko ? "Skala Prioritas Penanganan Posko" : "Seberapa mendesak kebutuhan ini?"}
                </label>
                <select 
                  className="form-control select" 
                  value={editPriority} 
                  onChange={(e) => setEditPriority(e.target.value)}
                >
                  {posko ? (
                    <>
                      <option value="Kritis">Kritis (Mendesak &lt; 6 Jam)</option>
                      <option value="Tinggi">Tinggi (Mendesak &lt; 24 Jam)</option>
                      <option value="Sedang">Sedang (Siaga Logistik)</option>
                    </>
                  ) : (
                    <>
                      <option value="Sangat mendesak">Sangat mendesak (Kondisi genting / habis)</option>
                      <option value="Perlu segera">Perlu segera (Menipis dalam 1-2 hari)</option>
                      <option value="Bisa menunggu">Bisa menunggu (Masih ada persediaan)</option>
                    </>
                  )}
                </select>
                <small style={{ color: "#758378", marginTop: "4px", display: "block", fontSize: "0.82rem" }}>
                  {posko ? "Klasifikasi triase operasional posko." : "Tingkat urgensi dari sudut pandang warga di lokasi."}
                </small>
              </div>

              <div>
                <label className="form-label" style={{ marginBottom: "4px" }}>Uraian &amp; Kondisi Lapangan</label>
                <textarea 
                  className="form-control textarea" 
                  rows={3} 
                  value={editDesc} 
                  onChange={(e) => setEditDesc(e.target.value)} 
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "24px" }}>
              <Button variant="secondary" onClick={() => setIsEditOpen(false)}>
                Batal
              </Button>
              <Button onClick={handleSaveEdit}>
                <Icon name="check" /> Simpan Perubahan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS */}
      {isDeleteOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", maxWidth: "460px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>⚠️</div>
              <h3 style={{ margin: "0 0 8px", color: "#cf1322" }}>Konfirmasi Hapus Laporan</h3>
              <p style={{ margin: 0, color: "#48554a", fontSize: "0.92rem", lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus data kasus <strong>{activeCase.id}</strong> ({activeCase.item})? Data laporan terkait akan dihapus permanen.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setIsDeleteOpen(false)}>
                Batal
              </Button>
              <button 
                type="button" 
                onClick={handleDelete}
                style={{ background: "#cf1322", color: "#ffffff", border: "none", padding: "10px 20px", borderRadius: "10px", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAMBAR 1 REVISION: STATUS PROGRES PEMENUHAN LOGISTIK (RAPI, JELAS, DAN TERSTRUKTUR) */}
      <div className="case-progress-card">
        <div style={{ marginBottom: "16px", borderBottom: "1px solid rgba(1,50,32,0.08)", paddingBottom: "12px" }}>
          <span className="eyebrow" style={{ color: "#013220", fontWeight: 700, letterSpacing: "0.04em" }}>STATUS PROGRES PEMENUHAN LOGISTIK</span>
          <small style={{ display: "block", color: "#6a7369", marginTop: "2px" }}>Pelacakan alur penanganan bantuan dari pelaporan warga hingga tuntas diterima</small>
        </div>

        {/* 3 HIGHLIGHT BOXES */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "20px" }}>
          <div style={{ background: "#fbfbf8", padding: "16px 18px", borderRadius: "14px", border: "1px solid rgba(1,50,32,0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#758378", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px", letterSpacing: "0.04em" }}>Target Kebutuhan Warga</span>
              <strong style={{ fontSize: "1.45rem", color: "#013220", fontWeight: 800, display: "block", lineHeight: 1.2 }}>{activeCase.qty}</strong>
            </div>
            <small style={{ display: "block", color: "#6a7369", fontSize: "12px", marginTop: "6px" }}>Kategori: <b style={{ color: "#013220" }}>{activeCase.item}</b></small>
          </div>

          <div style={{ background: "#fbfbf8", padding: "16px 18px", borderRadius: "14px", border: "1px solid rgba(1,50,32,0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#758378", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px", letterSpacing: "0.04em" }}>Tahapan Alur Kasus</span>
              <strong style={{ fontSize: "1.25rem", color: "#013220", display: "block", margin: "4px 0", fontWeight: 800, lineHeight: 1.2 }}>
                {activeCase.status === "Dalam Verifikasi" ? "Dalam Verifikasi" : activeCase.status}
              </strong>
            </div>
            <small style={{ display: "block", color: "#6a7369", fontSize: "12px", marginTop: "6px" }}>
              {activeCase.status === "Diajukan" || activeCase.status === "Dalam Verifikasi" 
                ? "Menunggu peninjauan Posko BPBD" 
                : activeCase.status === "Kebutuhan Terbuka" 
                  ? "Terbuka bagi mitra & satgas penyalur" 
                  : activeCase.status === "Ditugaskan"
                    ? "Tim responder resmi ditugaskan"
                    : activeCase.status === "Dalam Pengiriman"
                      ? "Armada logistik dalam pengiriman"
                      : activeCase.status === "Selesai" 
                        ? "Bantuan tuntas diterima warga" 
                        : "Dalam penanganan posko"}
            </small>
          </div>

          <div style={{ background: "#fbfbf8", padding: "16px 18px", borderRadius: "14px", border: "1px solid rgba(1,50,32,0.08)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#758378", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px", letterSpacing: "0.04em" }}>Posko BPBD Penanggung Jawab</span>
              <strong style={{ fontSize: "0.95rem", color: "#013220", display: "block", lineHeight: 1.35, fontWeight: 700, marginTop: "4px" }}>
                {activeCase.posko?.split(" - ")[0] || "Posko BPBD Provinsi Jawa Timur (Komando Wilayah)"}
              </strong>
            </div>
            <small style={{ display: "block", color: "#6a7369", fontSize: "12px", marginTop: "6px" }}>Wilayah: {activeCase.location}</small>
          </div>
        </div>

        {/* 5-STEP TIMELINE TRACKER (ALUR GENERAL: LAPORAN MASUK -> VERIFIKASI BPBD -> MENUNGGU BANTUAN -> PENYALURAN BANTUAN -> BANTUAN DITERIMA) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px", margin: "14px 0 10px" }}>
          {[
            { 
              step: 1, 
              label: "Laporan Diajukan", 
              sub: "Data Terdata", 
              passed: true, 
              active: activeCase.status === "Diajukan" 
            },
            { 
              step: 2, 
              label: "Verifikasi BPBD", 
              sub: "Peninjauan Posko", 
              passed: activeCase.status !== "Dalam Verifikasi" && activeCase.status !== "Diajukan", 
              active: activeCase.status === "Dalam Verifikasi" || activeCase.status === "Diajukan"
            },
            { 
              step: 3, 
              label: "Menunggu Bantuan", 
              sub: "Kesiapan Alokasi", 
              passed: ["Ditugaskan", "Dalam Pengiriman", "Menunggu Konfirmasi Penerimaan", "Selesai"].includes(activeCase.status), 
              active: activeCase.status === "Kebutuhan Terbuka" 
            },
            { 
              step: 4, 
              label: "Penyaluran Bantuan", 
              sub: "Distribusi Lapangan", 
              passed: ["Menunggu Konfirmasi Penerimaan", "Selesai"].includes(activeCase.status), 
              active: activeCase.status === "Ditugaskan" || activeCase.status === "Dalam Pengiriman" 
            },
            { 
              step: 5, 
              label: "Bantuan Diterima", 
              sub: "Selesai Tuntas", 
              passed: activeCase.status === "Selesai", 
              active: activeCase.status === "Menunggu Konfirmasi Penerimaan" 
            }
          ].map((s) => (
            <div key={s.step} style={{ textAlign: "center", padding: "10px 4px", background: s.passed ? "#eef6f0" : s.active ? "#fffbe6" : "#f5f4ef", borderRadius: "10px", border: `1px solid ${s.passed ? "#b2d7bb" : s.active ? "#ffe58f" : "#e2ded4"}` }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", background: s.passed ? "#15803d" : s.active ? "#d46b08" : "#80866e", color: "#ffffff", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, marginBottom: "4px" }}>
                {s.passed ? "✓" : s.step}
              </div>
              <strong style={{ display: "block", fontSize: "11px", color: "#013220", lineHeight: 1.25 }}>{s.label}</strong>
              <small style={{ fontSize: "10px", color: "#758378" }}>{s.passed ? "Selesai" : s.active ? "Proses Ini" : s.sub}</small>
            </div>
          ))}
        </div>

        {/* PROGRESS TRACK & DYNAMIC SLIDING PERCENTAGE PIN */}
        <div className="case-progress-track-wrapper" style={{ marginTop: "14px" }}>
          <div className="case-progress-bar-wrap">
            <div className="case-progress-bar-fill" style={{ width: `${percent}%` }} />
          </div>

          <div className="case-progress-pin-track">
            <div 
              className="case-progress-sliding-pin"
              style={{
                left: `${percent}%`,
                transform: percent >= 95 ? "translateX(-95%)" : "translateX(-50%)",
              }}
            >
              <div className="marker-pin-bubble">
                <span className="marker-pin-caret" style={{ left: percent >= 95 ? "85%" : "50%" }} />
                {percent}%
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2-COLUMN MAIN CONTENT GRID */}
      <div className="case-detail-content-grid">
        {/* LEFT COLUMN: SITUATION, EVIDENCE & DECISION SUPPORT */}
        <div className="case-detail-left-col">
          {/* PENILAIAN URGENSI & FAKTOR KONDISI LAPANGAN */}
          <div className="case-section-card">
            <div className="case-section-header">
              <div className="section-icon-box"><Icon name="check" /></div>
              <div className="case-section-header-text">
                <span className="eyebrow">Analisis Kebutuhan Posko</span>
                <h3>Tingkat Urgensi: Prioritas {activeCase.urgency}</h3>
                <small>Faktor lapangan yang menjadi pertimbangan penanganan bantuan</small>
              </div>
            </div>

            <div className="situation-body">
              {/* 4 FAKTOR PENENTU KONDISI */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "10px", marginBottom: "14px" }}>
                <div style={{ background: "#fbfbf8", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(1,50,32,0.08)" }}>
                  <small style={{ color: "#758378", fontSize: "11px", fontWeight: 600, display: "block" }}>Sasaran &amp; Jiwa Terdampak</small>
                  <strong style={{ color: "#013220", fontSize: "13px" }}>{activeCase.affectedPeople ? `${activeCase.affectedPeople} Jiwa` : activeCase.kk || "1 KK"} ({activeCase.kk || "1 KK"})</strong>
                </div>
                <div style={{ background: "#fbfbf8", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(1,50,32,0.08)" }}>
                  <small style={{ color: "#758378", fontSize: "11px", fontWeight: 600, display: "block" }}>Kelompok Rentan</small>
                  <strong style={{ color: "#013220", fontSize: "13px" }}>{activeCase.vulnerableDetails || "Tidak ada"}</strong>
                </div>
                <div style={{ background: "#fbfbf8", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(1,50,32,0.08)" }}>
                  <small style={{ color: "#758378", fontSize: "11px", fontWeight: 600, display: "block" }}>Kondisi Ketersediaan</small>
                  <strong style={{ color: "#013220", fontSize: "13px" }}>{activeCase.availabilityCondition || activeCase.crisisDuration || "Tidak tersedia"}</strong>
                </div>
                <div style={{ background: "#fbfbf8", padding: "10px 14px", borderRadius: "10px", border: "1px solid rgba(1,50,32,0.08)" }}>
                  <small style={{ color: "#758378", fontSize: "11px", fontWeight: 600, display: "block" }}>Urgensi Menurut Pelapor</small>
                  <strong style={{ color: "#013220", fontSize: "13px" }}>{activeCase.citizenUrgency || activeCase.urgency || "Sangat mendesak"}</strong>
                </div>
              </div>

              {/* REKOMENDASI PENANGANAN POSKO */}
              <div style={{ 
                background: activeCase.urgency === "Kritis" ? "#fff1f0" : activeCase.urgency === "Tinggi" ? "#fffbe6" : "#f6ffed", 
                border: `1px solid ${activeCase.urgency === "Kritis" ? "#ffa39e" : activeCase.urgency === "Tinggi" ? "#ffe58f" : "#b7eb8f"}`, 
                padding: "14px 16px", 
                borderRadius: "12px" 
              }}>
                <div style={{ fontSize: "0.88rem", color: "#2d3748", lineHeight: 1.5 }}>
                  <strong>Rekomendasi Penanganan Posko:</strong> Permohonan kebutuhan <strong>{activeCase.item}</strong> untuk <strong>{activeCase.kk || "1 KK"}</strong> di {activeCase.location} diprioritaskan untuk pemenuhan terkoordinasi antara Satgas Logistik BPBD dan Mitra Organisasi.
                </div>
              </div>
            </div>
          </div>

          {/* GAMBAR 2 REVISION: URAIAN KEBUTUHAN & PROFIL PEMOHON (RAPI & JELAS) */}
          <div className="case-section-card">
            <div className="case-section-header">
              <div className="section-icon-box"><Icon name="file" /></div>
              <div className="case-section-header-text">
                <span className="eyebrow">Data Permohonan Kasus</span>
                <h3>Uraian Kebutuhan &amp; Profil Pemohon</h3>
                <small>Rincian permohonan warga di {activeCase.location}</small>
              </div>
            </div>

            <div className="situation-body">
              <div style={{ background: "#fbfbf8", padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(1,50,32,0.08)", marginBottom: "16px" }}>
                <small style={{ color: "#758378", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  Uraian Kebutuhan Lapangan oleh Warga:
                </small>
                <h4 style={{ margin: 0, color: "#013220", fontSize: "1rem", lineHeight: 1.5, fontWeight: 700 }}>
                  "{activeCase.notes || `Membutuhkan ${activeCase.qty} ${activeCase.item} untuk persediaan warga pascabencana.`}"
                </h4>
              </div>

              <div className="reporter-profile-box">
                <div className="reporter-profile-main">
                  <div className="reporter-avatar">
                    {activeCase.applicantName ? activeCase.applicantName.split(" ").map(n => n[0]).join("").slice(0, 2) : "AP"}
                  </div>
                  <div className="reporter-identity">
                    <div className="reporter-name-row">
                      <strong className="reporter-name">{activeCase.applicantName || "Andi Pratama"}</strong>
                    </div>
                    <div className="reporter-credentials">
                      <span className="reporter-cred-item">
                        <span className="cred-lbl">NIK:</span>
                        <span className="cred-val mono">{activeCase.applicantNik || "3202110482910002"}</span>
                      </span>
                      <span className="reporter-cred-sep">•</span>
                      <span className="reporter-cred-item">
                        <span className="cred-lbl">Telp:</span>
                        <span className="cred-val nowrap">{activeCase.applicantPhone || "+62 812 4455 0188"}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="reporter-badge-wrap">
                  <span className="reporter-tag">
                    Warga Pemohon
                  </span>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "12px", background: "#fbfbf8", padding: "12px 14px", borderRadius: "12px", border: "1px solid rgba(1,50,32,0.08)" }}>
                <div>
                  <small style={{ color: "#758378", fontSize: "11px", display: "block" }}>Status Tempat Tinggal</small>
                  <strong style={{ color: "#013220", fontSize: "12.5px" }}>{activeCase.shelterStatus || "Rumah Tinggal Pribadi (Terdampak Langsung)"}</strong>
                </div>
                <div>
                  <small style={{ color: "#758378", fontSize: "11px", display: "block" }}>Wilayah Administrasi</small>
                  <strong style={{ color: "#013220", fontSize: "12.5px" }}>{activeCase.location}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* GAMBAR 3 REVISION: FOTO BUKTI KONDISI LAPANGAN */}
          <div className="case-section-card">
            <div className="case-section-header">
              <div className="section-icon-box"><Icon name="pin" /></div>
              <div className="case-section-header-text">
                <span className="eyebrow">Validasi Visual Lokasi</span>
                <h3>Foto Bukti Kondisi Lapangan</h3>
                <small>Dokumentasi visual terverifikasi di titik lokasi penanganan pemohon</small>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* Foto Bukti Awal */}
              <figure className="case-evidence-frame" style={{ margin: 0 }}>
                <div style={{ padding: "8px 12px", background: "#f8fafc", borderBottom: "1px solid rgba(1,50,32,0.08)", fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>
                  📷 1. Foto / Dokumentasi Awal Saat Pelaporan (Permanen)
                </div>
                <img 
                  src={getFieldEvidencePhoto(activeCase.item, activeCase.fotoBukti)} 
                  alt={`Bukti foto kondisi lapangan ${activeCase.location}`} 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1547683905-f686c993aae5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=1200&q=82";
                  }}
                  style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }}
                />
                <figcaption className="case-evidence-caption">
                  <div className="evidence-caption-main">
                    <span><Icon name="pin" /> Titik Lokasi: {activeCase.location}</span>
                    <small>{activeCase.fotoBukti ? "Dokumentasi Lapangan Diunggah Langsung Oleh Pemohon" : `Validasi Geotag Terhubung ke ${activeCase.posko?.split(" - ")[0] || "Posko BPBD"}`}</small>
                  </div>
                  <span className="evidence-badge"><Icon name="check" /> Foto Awal Pelapor</span>
                </figcaption>
              </figure>

              {/* Foto / Dokumen Klarifikasi Terbaru (Jika ada perbaikan) */}
              {activeCase.fotoKlarifikasi && (
                <figure className="case-evidence-frame" style={{ margin: 0, border: "2px solid #10b981" }}>
                  <div style={{ padding: "8px 12px", background: "#ecfdf5", borderBottom: "1px solid #a7f3d0", fontSize: "0.8rem", fontWeight: 700, color: "#065f46" }}>
                    ✨ 2. Berkas / Foto Lampiran Klarifikasi Terbaru
                  </div>
                  <img 
                    src={activeCase.fotoKlarifikasi} 
                    alt="Lampiran klarifikasi perbaikan" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1547683905-f686c993aae5?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=1200&q=82";
                    }}
                    style={{ width: "100%", height: "220px", objectFit: "cover", display: "block" }}
                  />
                  <figcaption className="case-evidence-caption" style={{ background: "#f0fdf4" }}>
                    <div className="evidence-caption-main">
                      <span style={{ color: "#065f46", fontWeight: 700 }}>Dokumen/Foto Tambahan Klarifikasi</span>
                      <small style={{ color: "#047857" }}>Diunggah pelapor untuk melengkapi permintaan klarifikasi Posko BPBD</small>
                    </div>
                    <span className="evidence-badge" style={{ background: "#10b981", color: "#fff" }}><Icon name="check" /> Revisi Terkini</span>
                  </figcaption>
                </figure>
              )}
            </div>

            {/* Riwayat Putaran Klarifikasi (Audit Trail) */}
            {Array.isArray(activeCase.riwayatKlarifikasi) && activeCase.riwayatKlarifikasi.length > 0 && (
              <div style={{ marginTop: "16px", background: "#fbfbf8", padding: "14px 16px", borderRadius: "12px", border: "1px solid rgba(1,50,32,0.1)" }}>
                <span style={{ fontSize: "11px", color: "#758378", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", display: "block", marginBottom: "8px" }}>
                  📜 Riwayat Klarifikasi BPBD &amp; Masyarakat
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {activeCase.riwayatKlarifikasi.map((rk, idx) => (
                    <div key={idx} style={{ background: "#ffffff", padding: "10px 12px", borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "0.83rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", color: "#64748b", fontSize: "0.76rem", marginBottom: "4px" }}>
                        <b>Putaran #{rk.putaran || idx + 1} · {rk.kategori || "Klarifikasi"}</b>
                        <span>{rk.waktu_tanya ? new Date(rk.waktu_tanya).toLocaleDateString("id-ID", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "Tercatat"}</span>
                      </div>
                      <div style={{ color: "#9a3412", fontWeight: 600, marginBottom: "4px" }}>
                        ❓ <b>Posko:</b> "{rk.pertanyaan}"
                      </div>
                      {rk.jawaban ? (
                        <div style={{ color: "#166534", fontWeight: 600, background: "#f0fdf4", padding: "6px 8px", borderRadius: "6px" }}>
                          💬 <b>Jawaban Warga:</b> "{rk.jawaban}"
                        </div>
                      ) : (
                        <div style={{ color: "#b45309", fontStyle: "italic", fontSize: "0.78rem" }}>
                          ⏳ Belum dijawab oleh masyarakat
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* GAMBAR 3 REVISION: PETA TITIK LOKASI & WILAYAH KASUS (TITIK KOORDINAT PRESISI) */}
          <div className="case-section-card">
            <div className="case-section-header">
              <div className="section-icon-box"><Icon name="map" /></div>
              <div className="case-section-header-text">
                <span className="eyebrow">Pemetaan Geografis</span>
                <h3>Peta Titik Lokasi &amp; Wilayah Kasus</h3>
                <small>Koordinat presisi ({caseLat.toFixed(5)}, {caseLng.toFixed(5)}) · {activeCase.location}</small>
              </div>
            </div>
            <div className="case-map-container">
              <MapView 
                operational 
                hideCard 
                initialLat={caseLat} 
                initialLng={caseLng} 
                locationAddress={activeCase.location}
                caseTitle={activeCase.item}
                caseId={activeCase.id}
                caseKk={activeCase.kk}
                caseUrgency={activeCase.urgency}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RESOURCE ALLOCATION & LOGS */}
        <div className="case-detail-right-col">
          {/* GAMBAR 2 REVISION: TINJAUAN ALOKASI & PENYALUR BANTUAN (LOGIS & MUDAH DIPAHAMI) */}
          {/* TINJAUAN ALOKASI & PENYALURAN (REAL-TIME, BUSINESS-DRIVEN & DESIGN-SYSTEM COMPLIANT) */}
          <div className="case-section-card">
            <div className="case-section-header">
              <div className="section-icon-box"><Icon name="task" /></div>
              <div className="case-section-header-text" style={{ flex: 1 }}>
                <span className="eyebrow">EKSEKUSI &amp; PENYALURAN LAPANGAN</span>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "8px" }}>
                  <h3 style={{ margin: 0 }}>Surat Tugas &amp; Armada Distribusi</h3>
                  <span className={`alloc-telemetry-badge ${
                    activeCase.status === "Selesai" ? "success" :
                    activeCase.status === "Menunggu Konfirmasi Penerimaan" ? "waiting" :
                    activeCase.status === "Dalam Pengiriman" || activeCase.status === "Ditugaskan" ? "progress" :
                    activeCase.status === "Kebutuhan Terbuka" || activeCase.status === "Klaim Diajukan" ? "waiting" : "pending"
                  }`}>
                    {activeCase.status === "Selesai" ? "Penyaluran Tuntas Diserahkan" :
                     activeCase.status === "Menunggu Konfirmasi Penerimaan" ? "Tiba di Lokasi · Menunggu BAST" :
                     activeCase.status === "Dalam Pengiriman" ? "Armada Menuju Lokasi" :
                     activeCase.status === "Ditugaskan" ? "Surat Tugas Aktif" :
                     activeCase.status === "Klaim Diajukan" ? "Menunggu Persetujuan Proposal" :
                     activeCase.status === "Kebutuhan Terbuka" ? "Terbuka di Bursa Mitra" :
                     activeCase.status === "Perlu Klarifikasi" ? "Menunggu Klarifikasi Warga" :
                     "Triase & Validasi Posko"}
                  </span>
                </div>
                <small>Pelaksana distribusi dan pemantauan pergerakan logistik {activeCase.item} di {activeCase.location}</small>
              </div>
            </div>

            {/* STAGE 1A: PERLU KLARIFIKASI */}
            {activeCase.status === "Perlu Klarifikasi" && (
              <div className="alloc-callout-card pending" style={{ borderColor: "#d97706", background: "#fffbeb" }}>
                <div className="alloc-callout-header">
                  <div className="alloc-callout-icon-box" style={{ background: "#fef3c7", color: "#b45309" }}>
                    <Icon name="clock" />
                  </div>
                  <div className="alloc-callout-title-group">
                    <div className="alloc-callout-title" style={{ color: "#92400e" }}>
                      Menunggu Klarifikasi Data dari Pelapor Warga
                    </div>
                    <div className="alloc-callout-sub">
                      Kategori: <strong style={{ color: "#78350f" }}>{activeCase.kategoriKlarifikasi || "Kelengkapan Berkas / Foto"}</strong>
                    </div>
                  </div>
                </div>

                <p className="alloc-callout-desc" style={{ color: "#78350f" }}>
                  {activeCase.pertanyaanKlarifikasi || "Petugas Posko BPBD memerlukan penjelasan tambahan atau foto bukti kondisi fisik sebelum kuota dapat diverifikasi dan dirilis ke Bursa Bantuan."}
                </p>

                <div className="alloc-meta-grid">
                  <div className="alloc-meta-tile">
                    <div className="alloc-tile-header">
                      <span className="alloc-tile-label">KETENTUAN BERKAS</span>
                      <span className="alloc-tile-badge warning">{activeCase.memintaLampiran ? "Wajib Foto Pendukung" : "Cukup Penjelasan Teks"}</span>
                    </div>
                    <div className="alloc-tile-detail">
                      <span className="alloc-tile-note">
                        Warga dapat mengisi tanggapan pada formulir klarifikasi di bawah.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 1B: DALAM VERIFIKASI / DIAJUKAN */}
            {(activeCase.status === "Dalam Verifikasi" || activeCase.status === "Diajukan") && (
              <div className="alloc-callout-card pending">
                <div className="alloc-callout-header">
                  <div className="alloc-callout-icon-box">
                    <Icon name="clock" />
                  </div>
                  <div className="alloc-callout-title-group">
                    <div className="alloc-callout-title">
                      Menunggu Verifikasi &amp; Penetapan Alokasi Posko BPBD
                    </div>
                    <div className="alloc-callout-sub">
                      Status Laporan: <span className="alloc-sub-status">Tahap Triase &amp; Validasi Awal</span>
                    </div>
                  </div>
                </div>

                <p className="alloc-callout-desc">
                  Laporan kebutuhan warga ini sedang dalam proses verifikasi administratif dan faktual oleh petugas posko. Setelah divalidasi, kuota akan dialokasikan langsung dari <strong>Dapur Umum/Logistik BPBD</strong> atau dipublikasikan ke <strong>Bursa Bantuan Terbuka</strong> untuk dipenuhi mitra.
                </p>

                <div className="alloc-meta-grid">
                  <div className="alloc-meta-tile">
                    <div className="alloc-tile-header">
                      <span className="alloc-tile-label">SKEMA DISTRIBUSI POSKO</span>
                      <span className="alloc-tile-badge warning">Menunggu Penetapan</span>
                    </div>
                    <div className="alloc-tile-detail">
                      <span className="alloc-tile-note">
                        <Icon name="clock" /> Posko BPBD {activeCase.posko?.split(" - ")[0] || "Wilayah"} akan menetapkan skema penyaluran
                      </span>
                    </div>
                  </div>

                  <div className="alloc-meta-tile dashed">
                    <div className="alloc-tile-header">
                      <span className="alloc-tile-label">TARGET KEBUTUHAN TERDATA</span>
                      <span className="alloc-category-badge">{activeCase.item}</span>
                    </div>
                    <div className="alloc-tile-detail-row">
                      <strong className="alloc-vol-value">{activeCase.qty}</strong>
                      <span className="alloc-vol-scope">untuk {activeCase.kk || "1 KK"} terdampak di {activeCase.location}</span>
                    </div>
                  </div>
                </div>

                {posko && (
                  <div className="alloc-callout-footer">
                    <Button onClick={handleVerify} disabled={isVerifying} className="btn-verify-action">
                      <Icon name="check" /> {isVerifying ? "Memproses Verifikasi BPBD..." : "Verifikasi & Rilis ke Bursa Bantuan"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* STAGE KLAIM MITRA MASUK (MENUNGGU PERSETUJUAN POSKO) */}
            {(activeCase.status === "Klaim Diajukan" || (matchedOffers.length > 0 && matchedOffers[0].status === "Diajukan")) && (
              <div className="alloc-mission-card active" style={{ borderColor: "#ea580c" }}>
                <div className="alloc-mission-top">
                  <div>
                    <h4 className="alloc-mission-entity-title" style={{ color: "#9a3412" }}>
                      {matchedBursa?.claimed_org || matchedOffers[0]?.organisasi || "Mitra Kemanusiaan Terdaftar"}
                    </h4>
                    <div className="alloc-mission-entity-sub">
                      <span>Mitra Terverifikasi REKSA</span>
                      <span>•</span>
                      <span>PIC: <strong>{matchedOffers[0]?.mitra_name || matchedBursa?.claimedBy?.name || "Koordinator Relawan"}</strong></span>
                    </div>
                  </div>
                  <span className="alloc-mission-status-pill warning">Menunggu Persetujuan Posko</span>
                </div>

                <div className="alloc-mission-details-grid">
                  <div className="alloc-mission-detail-item">
                    <span className="alloc-detail-key">Komitmen Kuota</span>
                    <strong className="alloc-detail-val" style={{ color: "#c2410c" }}>
                      {matchedBursa?.claimed_volume || matchedOffers[0]?.jumlah_tawaran || activeCase.qty}
                    </strong>
                  </div>
                  <div className="alloc-mission-detail-item">
                    <span className="alloc-detail-key">Rencana Armada</span>
                    <strong className="alloc-detail-val">
                      {matchedBursa?.claimed_armada || matchedOffers[0]?.armada_info || "Armada Logistik Standar"}
                    </strong>
                  </div>
                </div>

                <p style={{ margin: "8px 0 12px", fontSize: "0.85rem", color: "#7c2d12", lineHeight: 1.45 }}>
                  Mitra telah mengajukan kesiapan untuk memenuhi kebutuhan ini. Setujui proposal untuk menerbitkan Surat Perintah Tugas Misi resmi.
                </p>

                {posko && (
                  <div style={{ marginTop: "10px" }}>
                    <Button 
                      onClick={handleApproveBursaClaim} 
                      disabled={isApprovingClaim}
                      style={{ width: "100%", justifyContent: "center", background: "#ea580c", borderColor: "#ea580c", color: "#ffffff" }}
                    >
                      <Icon name="check" /> {isApprovingClaim ? "Menerbitkan Misi..." : "Setujui Komitmen & Rilis Surat Misi"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* STAGE 2: KEBUTUHAN TERBUKA (MENUNGGU PENYALUR DARI BPBD / MITRA) */}
            {activeCase.status === "Kebutuhan Terbuka" && (
              <div className="allocation-list-cards">
                <div className="alloc-callout-card open">
                  <div className="alloc-callout-header">
                    <div className="alloc-callout-icon-box open">
                      <Icon name="box" />
                    </div>
                    <div className="alloc-callout-title-group">
                      <div className="alloc-callout-title">
                        Terbuka di Bursa Bantuan Kemitraan
                      </div>
                      <div className="alloc-callout-sub">
                        Status Publikasi: <span className="alloc-sub-status open">Kebutuhan Terverifikasi Resmi</span>
                      </div>
                    </div>
                  </div>

                  <p className="alloc-callout-desc">
                    Laporan telah divalidasi oleh Posko BPBD dan kuota <strong>{activeCase.qty} {activeCase.item}</strong> saat ini terbuka untuk diklaim oleh <strong>Dapur Umum BPBD</strong> maupun <strong>Mitra Kemanusiaan Terdaftar (PMI, Baznas, Relawan)</strong>.
                  </p>

                  <div className="alloc-meta-grid">
                    <div className="alloc-meta-tile">
                      <div className="alloc-tile-header">
                        <span className="alloc-tile-label">STATUS BURSA REKSA</span>
                        <span className="alloc-tile-badge info">Menunggu Klaim Mitra</span>
                      </div>
                      <div className="alloc-tile-detail">
                        <span className="alloc-tile-note">
                          <Icon name="box" /> Terbuka bagi seluruh mitra penanggulangan bencana
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 3, 4, 5: DITUGASKAN / DALAM PENGIRIMAN / MENUNGGU BAST / SELESAI */}
            {activeCase.status !== "Dalam Verifikasi" && activeCase.status !== "Diajukan" && activeCase.status !== "Perlu Klarifikasi" && activeCase.status !== "Kebutuhan Terbuka" && activeCase.status !== "Klaim Diajukan" && (
              <div className="allocation-list-cards">
                {/* RENDER REAL-TIME MISSIONS FROM DATABASE */}
                {matchedMisiList.length > 0 ? (
                  matchedMisiList.map((m) => (
                    <div key={m.id} className={`alloc-mission-card ${activeCase.status === "Selesai" || m.status_tahapan === "Selesai" ? "completed" : "active"}`}>
                      <div className="alloc-mission-top">
                        <div>
                          <h4 className="alloc-mission-entity-title">{m.organisasi || "Satgas Reaksi Cepat BPBD Wilayah"}</h4>
                          <div className="alloc-mission-entity-sub">
                            <span>Surat Misi:</span>
                            <span className="alloc-mission-code-badge">{m.kode_misi}</span>
                            <span>•</span>
                            <span>Posko Wilayah</span>
                          </div>
                        </div>
                        <span className={`alloc-mission-status-pill ${
                          m.status_tahapan === "Selesai" || activeCase.status === "Selesai" ? "success" :
                          m.status_tahapan === "Tiba di Lokasi & Diserahkan" || activeCase.status === "Menunggu Konfirmasi Penerimaan" ? "info" :
                          m.status_tahapan === "Dalam Perjalanan" || activeCase.status === "Dalam Pengiriman" ? "warning" : "info"
                        }`}>
                          {m.status_tahapan === "Selesai" || activeCase.status === "Selesai" ? "Tuntas Disalurkan" :
                           m.status_tahapan === "Tiba di Lokasi & Diserahkan" || activeCase.status === "Menunggu Konfirmasi Penerimaan" ? "Tiba di Lokasi (BAST)" :
                           m.status_tahapan === "Dalam Perjalanan" || activeCase.status === "Dalam Pengiriman" ? "Dalam Pengiriman (OTW)" :
                           "Penugasan Aktif"}
                        </span>
                      </div>

                      <div className="alloc-mission-details-grid">
                        <div className="alloc-mission-detail-item">
                          <span className="alloc-detail-key">Muatan Penyaluran</span>
                          <strong className="alloc-detail-val" style={{ color: "#013220" }}>{m.muatan || activeCase.qty}</strong>
                        </div>
                        <div className="alloc-mission-detail-item">
                          <span className="alloc-detail-key">Armada Kendaraan</span>
                          <strong className="alloc-detail-val">{m.armada_info || "Mobil Operasional Distribusi"}</strong>
                        </div>
                        <div className="alloc-mission-detail-item">
                          <span className="alloc-detail-key">Petugas Pelaksana</span>
                          <strong className="alloc-detail-val">{m.responder_name || "Satgas Lapangan BPBD"}</strong>
                        </div>
                        <div className="alloc-mission-detail-item">
                          <span className="alloc-detail-key">Estimasi Jadwal</span>
                          <strong className="alloc-detail-val">{m.estimasi_waktu || "Sesuai Jadwal Operasional"}</strong>
                        </div>
                      </div>

                      {/* FIELD OBSTACLE CALLOUT IF PRESENT */}
                      {m.status_kendala && (
                        <div style={{ background: "#fff1f2", border: "1px solid #fecdd3", borderRadius: "8px", padding: "8px 12px", margin: "8px 0", fontSize: "0.82rem", color: "#9f1239" }}>
                          <strong>Laporan Kendala Lapangan:</strong> [{m.status_kendala}] {m.catatan_lapangan}
                        </div>
                      )}

                      {/* 4-STEP DELIVERY TRACKER STEPPER */}
                      <div className="alloc-mission-stepper">
                        <div className="alloc-step-node passed">
                          <div className="alloc-step-circle">✓</div>
                          <span className="alloc-step-lbl">1. Surat Terbit</span>
                        </div>
                        <div className={`alloc-step-node ${
                          m.status_tahapan === "Muat Logistik" || m.status_tahapan === "Menunggu Persiapan" ? "active" : "passed"
                        }`}>
                          <div className="alloc-step-circle">
                            {m.status_tahapan !== "Menunggu Persiapan" && m.status_tahapan !== "Muat Logistik" ? "✓" : "2"}
                          </div>
                          <span className="alloc-step-lbl">2. Muat Barang</span>
                        </div>
                        <div className={`alloc-step-node ${
                          m.status_tahapan === "Dalam Perjalanan" || activeCase.status === "Dalam Pengiriman" ? "active" :
                          m.status_tahapan === "Tiba di Lokasi & Diserahkan" || m.status_tahapan === "Selesai" || activeCase.status === "Selesai" ? "passed" : ""
                        }`}>
                          <div className="alloc-step-circle">
                            {m.status_tahapan === "Tiba di Lokasi & Diserahkan" || m.status_tahapan === "Selesai" || activeCase.status === "Selesai" ? "✓" : "3"}
                          </div>
                          <span className="alloc-step-lbl">3. Pengiriman</span>
                        </div>
                        <div className={`alloc-step-node ${
                          m.status_tahapan === "Selesai" || activeCase.status === "Selesai" ? "passed" :
                          m.status_tahapan === "Tiba di Lokasi & Diserahkan" || activeCase.status === "Menunggu Konfirmasi Penerimaan" ? "active" : ""
                        }`}>
                          <div className="alloc-step-circle">
                            {m.status_tahapan === "Selesai" || activeCase.status === "Selesai" ? "✓" : "4"}
                          </div>
                          <span className="alloc-step-lbl">4. Selesai</span>
                        </div>
                      </div>

                      {/* RECEIPT CONFIRMATION BUTTON IF ARRIVED AT DESTINATION */}
                      {(m.status_tahapan === "Tiba di Lokasi & Diserahkan" || activeCase.status === "Menunggu Konfirmasi Penerimaan") && (
                        <div style={{ marginTop: "14px" }}>
                          <Button 
                            onClick={handleConfirmReceived} 
                            style={{ width: "100%", justifyContent: "center", background: "#15803d", borderColor: "#15803d", color: "#ffffff", fontWeight: 700 }}
                          >
                            <Icon name="check" /> Konfirmasi Penerimaan Fisik Bantuan (BAST Tuntas)
                          </Button>
                        </div>
                      )}

                      {/* COMPLETED BANNER IF RESOLVED */}
                      {(activeCase.status === "Selesai" || m.status_tahapan === "Selesai") && (
                        <div style={{ marginTop: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.82rem" }}>
                          <span style={{ color: "#15803d", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <Icon name="check" /> Fisik Bantuan Diterima Lengkap Warga
                          </span>
                          <span style={{ color: "#166534", fontWeight: 600 }}>Volume: {m.jumlah_diterima || m.muatan || activeCase.qty}</span>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  /* FALLBACK FOR DIRECT CASE ALLOCATION */
                  <div className={`alloc-mission-card ${activeCase.status === "Selesai" ? "completed" : "active"}`}>
                    <div className="alloc-mission-top">
                      <div>
                        <h4 className="alloc-mission-entity-title">{activeCase.posko?.split(" - ")[0] || "Satgas Reaksi Cepat BPBD Wilayah"}</h4>
                        <div className="alloc-mission-entity-sub">
                          <span>Surat Tugas:</span>
                          <span className="alloc-mission-code-badge">MISI-POSKO-01</span>
                          <span>•</span>
                          <span>Penyalur Utama Terverifikasi</span>
                        </div>
                      </div>
                      <span className={`alloc-mission-status-pill ${
                        activeCase.status === "Selesai" ? "success" :
                        activeCase.status === "Menunggu Konfirmasi Penerimaan" ? "info" :
                        activeCase.status === "Dalam Pengiriman" ? "warning" : "info"
                      }`}>
                        {activeCase.status === "Selesai" ? "Tuntas Disalurkan" :
                         activeCase.status === "Menunggu Konfirmasi Penerimaan" ? "Tiba di Lokasi (BAST)" :
                         activeCase.status === "Dalam Pengiriman" ? "Dalam Perjalanan (OTW)" :
                         "Alokasi Disetujui"}
                      </span>
                    </div>

                    <div className="alloc-mission-details-grid">
                      <div className="alloc-mission-detail-item">
                        <span className="alloc-detail-key">Muatan Penyaluran</span>
                        <strong className="alloc-detail-val" style={{ color: "#013220" }}>{activeCase.qty}</strong>
                      </div>
                      <div className="alloc-mission-detail-item">
                        <span className="alloc-detail-key">Armada Distribusi</span>
                        <strong className="alloc-detail-val">Armada Logistik Siaga Posko</strong>
                      </div>
                      <div className="alloc-mission-detail-item">
                        <span className="alloc-detail-key">Tim Pelaksana</span>
                        <strong className="alloc-detail-val">Satgas Posko BPBD &amp; Relawan</strong>
                      </div>
                      <div className="alloc-mission-detail-item">
                        <span className="alloc-detail-key">Wilayah Distribusi</span>
                        <strong className="alloc-detail-val">{activeCase.location}</strong>
                      </div>
                    </div>

                    {activeCase.status === "Menunggu Konfirmasi Penerimaan" && (
                      <div style={{ marginTop: "14px" }}>
                        <Button 
                          onClick={handleConfirmReceived} 
                          style={{ width: "100%", justifyContent: "center", background: "#15803d", borderColor: "#15803d", color: "#ffffff", fontWeight: 700 }}
                        >
                          <Icon name="check" /> Konfirmasi Penerimaan Fisik Bantuan (BAST Tuntas)
                        </Button>
                      </div>
                    )}

                    {activeCase.status === "Selesai" && (
                      <div style={{ marginTop: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "8px 12px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.82rem" }}>
                        <span style={{ color: "#15803d", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                          <Icon name="check" /> Fisik Bantuan Diterima Lengkap Warga
                        </span>
                        <span style={{ color: "#166534", fontWeight: 600 }}>Volume: {activeCase.qty}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* SISA KUOTA DEFISIT JIKA ALOKASI PARSIAL */}
                {deficitVolNum > 0 && matchedMisiList.length > 0 && activeCase.status !== "Selesai" && (
                  <div className="alloc-callout-card open" style={{ marginTop: "10px", borderColor: "#0f766e" }}>
                    <div className="alloc-callout-header">
                      <div className="alloc-callout-icon-box open">
                        <Icon name="box" />
                      </div>
                      <div className="alloc-callout-title-group">
                        <div className="alloc-callout-title" style={{ color: "#0f766e" }}>
                          Sisa Defisit Terbuka di Bursa: {deficitVolNum} {targetVolUnit}
                        </div>
                        <div className="alloc-callout-sub">
                          Alokasi Parsial: <span className="alloc-sub-status open">{missionsTotalVol} {targetVolUnit} Teralokasi</span>
                        </div>
                      </div>
                    </div>
                    <p className="alloc-callout-desc" style={{ color: "#134e4a" }}>
                      Sebagian kuota ({missionsTotalVol} {targetVolUnit}) sedang dalam proses penyaluran oleh armada di atas. Sisa kebutuhan <strong>{deficitVolNum} {targetVolUnit}</strong> tetap dipublikasikan di Bursa Bantuan Terbuka agar dipenuhi oleh organisasi/mitra penyangga lainnya.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* GAMBAR 3 REVISION: ACTIVITY LOG WITH DYNAMIC REAL-TIME TIMESTAMPS & CASE CODE */}
          <div className="case-section-card">
            <Activity state={state} activeCase={activeCase} update={update} />
          </div>
        </div>
      </div>
    </main>
  );
}

function PoskoRouter({ page, setPage, state, update, notify, name = "Siti Rahma", setName, onRefresh, setRole }: RouterProps) {
  if (page === "dashboard") return <PoskoDashboard state={state} update={update} setPage={setPage} onRefresh={onRefresh} />;
  if (page === "chat") return <ChatKoordinasi role="posko" name={name} state={state} notify={notify} onRefresh={onRefresh} setPage={setPage} />;
  if (page === "case") return <CaseDetail state={state} update={update} back={() => setPage("cases")} posko onRefresh={onRefresh} notify={notify} setRole={setRole} setName={setName} />;
  if (page === "cases") return <PoskoVerifikasiLaporan cases={state.casesList || []} onSelectCase={(c) => { if (c?.id) update({ activeCaseId: c.id }); setPage("case"); }} onRefresh={onRefresh} notify={notify} />;
  if (page === "resources") return <PoskoKebutuhanBursa cases={state.casesList || []} bursaList={state.bursaList || []} penawaranList={state.penawaranList || []} onNavigateToOffers={() => setPage("offers")} onSelectCase={(c) => { if (c?.id) update({ activeCaseId: c.id }); setPage("case"); }} />;
  if (page === "offers") return <PoskoPenawaranAlokasi penawaranList={state.penawaranList || []} bursaList={state.bursaList || []} cases={state.casesList || []} onRefresh={onRefresh} notify={notify} onNavigateToMissions={() => setPage("assignments")} />;
  if (page === "assignments") return <PoskoDistribusiPenerimaan misiList={state.misiList || []} cases={state.casesList || []} onRefresh={onRefresh} notify={notify} onSelectCase={(c) => { if (c?.id) update({ activeCaseId: c.id }); setPage("case"); }} />;
  if (page === "map") return <MapPage open={() => setPage("case")} cases={state.casesList || []} onSelectCase={(c) => { if (c?.id) update({ activeCaseId: c.id }); setPage("case"); }} role="posko" />;
  if (page === "notifications") return <Notifications role="posko" open={() => setPage("case")} state={state} update={update} setPage={setPage} />;
  if (page === "profile") return <Profile name={name} role="Petugas Posko" notify={notify} state={state} update={update} setName={setName} />;
  if (page === "settings") return <Settings notify={notify} />;
  return <Help />;
}

function PoskoDashboard({ state, update, setPage }: { state: SharedState; update: RouterProps["update"]; setPage: RouterProps["setPage"]; onRefresh?: () => Promise<void> | void }) {
  const currentPoskoTitle = state.poskoName || state.userProfile?.org || "Posko BPBD Provinsi Jawa Timur (Komando Wilayah)";
  const currentCoordName = state.poskoPic || state.userProfile?.name || "Siti Rahma";
  const allCases = state.casesList || [];
  const bursaList = state.bursaList || [];
  const misiList = state.misiList || [];
  const penawaranList = state.penawaranList || [];

  const primaryCase = allCases.find(c => c.id === state.activeCaseId) || allCases[0];
  const primaryLat = primaryCase?.lat ? Number(primaryCase.lat) : -7.336272;
  const primaryLng = primaryCase?.lng ? Number(primaryCase.lng) : 112.728881;
  
  const buildFullAddress = (c?: CaseRecord | null) => {
    if (!c) return "Jalan Gayungan V, Gayungan, Kec. Gayungan, Kota Surabaya, Prov. Jawa Timur";
    const v = (c.village || "").trim();
    const d = (c.district || "").trim();
    let k = (c.regency || "").trim();
    const p = (c.province || "").trim();

    if (k.toLowerCase() === v.toLowerCase() && d && d.toLowerCase().includes("sidoarjo")) {
      k = "Kabupaten Sidoarjo";
    }

    const parts: string[] = [];
    if (v) parts.push(v.toLowerCase().startsWith("desa") || v.toLowerCase().startsWith("kel") || v.toLowerCase().startsWith("jalan") || v.toLowerCase().startsWith("jl") ? v : `Desa/Kel. ${v}`);
    if (d) parts.push(d.toLowerCase().startsWith("kec") ? d : `Kec. ${d}`);
    if (k) parts.push(k.toLowerCase().startsWith("kab") || k.toLowerCase().startsWith("kota") ? k : `Kab. ${k}`);
    if (p) parts.push(p.toLowerCase().startsWith("prov") ? p : `Prov. ${p}`);
    
    if (parts.length >= 2) return parts.join(", ");
    return c.location || parts.join(", ") || "Lokasi belum ditentukan";
  };

  const primaryAddress = buildFullAddress(primaryCase);

  // PRD Bab 5.1 Enam Metrik Utama Posko
  const masukKK = allCases.filter(c => (c.status || '').toLowerCase().includes('verifikasi') || c.status === 'Diajukan').length;
  const prioritasKritis = allCases.filter(c => c.urgency === 'Kritis' || c.urgency === 'Tinggi').length;
  const terbuka = bursaList.filter(b => b.status === "Terbuka" || b.status === "Klaim Diajukan" || b.status === "Sebagian Terpenuhi").length || allCases.filter(c => c.status === "Kebutuhan Terbuka" || c.status === "Sebagian Terpenuhi").length;
  const penawaranMenunggu = penawaranList.filter(p => p.status === 'Diajukan').length + bursaList.filter(b => b.status === 'Klaim Diajukan').length;
  const disalurkan = misiList.filter(m => m.status_tahapan !== "Selesai").length || allCases.filter(c => c.status === "Dalam Pengiriman").length;
  const perluKonfirmasi = misiList.filter(m => m.status_tahapan === 'Tiba di Lokasi & Diserahkan' || m.status_tahapan === 'Menunggu Konfirmasi Penerimaan').length;

  // Filter khusus kebutuhan yang telah diverifikasi menjadi Kebutuhan Terbuka
  const openNeedsCases = allCases.filter(c => {
    const s = (c.status || '').toLowerCase();
    return s.includes('terbuka') || s.includes('sebagian') || s.includes('klaim');
  });

  return (
    <main className="workspace posko-dashboard-workspace">
      <PageHead 
        eyebrow={`${currentPoskoTitle} (Koordinator: ${currentCoordName})`} 
        title="Ringkasan Operasional Posko" 
        copy="Pusat penampungan data warga, verifikasi kebutuhan KK, penetapan alokasi mitra, dan pengawasan serah terima logistik." 
        action={
          <div className="posko-status-live-badge">
            <span className="live-indicator-dot" /> Posko Wilayah Aktif ({allCases.length} Laporan Kasus)
          </div>
        }
      />

      {/* 6 WORKLOAD SUMMARY METRICS CARDS PER PRD Bab 5.1 & Bab 12 */}
      <div className="posko-workload-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
        <div className="posko-workload-card" style={{ cursor: "pointer" }} onClick={() => setPage("cases")}>
          <div className="workload-card-top">
            <span className="workload-tag">Menunggu Verifikasi</span>
            <div className="workload-icon"><Icon name="file" /></div>
          </div>
          <strong className="workload-number">{masukKK}</strong>
          <small className="workload-sub">Laporan Masuk Baru</small>
        </div>

        <div className="posko-workload-card" style={{ cursor: "pointer" }} onClick={() => setPage("cases")}>
          <div className="workload-card-top">
            <span className="workload-tag">Kebutuhan Prioritas</span>
            <div className="workload-icon"><Icon name="bolt" /></div>
          </div>
          <strong className="workload-number">{prioritasKritis}</strong>
          <small className="workload-sub">Kritis &amp; Mendesak</small>
        </div>

        <div className="posko-workload-card" style={{ cursor: "pointer" }} onClick={() => setPage("resources")}>
          <div className="workload-card-top">
            <span className="workload-tag">Kekurangan Terbuka</span>
            <div className="workload-icon"><Icon name="pin" /></div>
          </div>
          <strong className="workload-number">{terbuka}</strong>
          <small className="workload-sub">Siap Didanai Mitra</small>
        </div>

        <div className="posko-workload-card" style={{ cursor: "pointer" }} onClick={() => setPage("offers")}>
          <div className="workload-card-top">
            <span className="workload-tag">Penawaran Mitra</span>
            <div className="workload-icon"><Icon name="handshake" /></div>
          </div>
          <strong className="workload-number">{penawaranMenunggu}</strong>
          <small className="workload-sub">Menunggu Keputusan</small>
        </div>

        <div className="posko-workload-card" style={{ cursor: "pointer" }} onClick={() => setPage("assignments")}>
          <div className="workload-card-top">
            <span className="workload-tag">Misi Aktif</span>
            <div className="workload-icon"><Icon name="task" /></div>
          </div>
          <strong className="workload-number">{disalurkan}</strong>
          <small className="workload-sub">Armada Berjalan</small>
        </div>

        <div className="posko-workload-card" style={{ cursor: "pointer" }} onClick={() => setPage("assignments")}>
          <div className="workload-card-top">
            <span className="workload-tag">Perlu Konfirmasi</span>
            <div className="workload-icon"><Icon name="check" /></div>
          </div>
          <strong className="workload-number">{perluKonfirmasi}</strong>
          <small className="workload-sub">Tiba di Titik Serah</small>
        </div>
      </div>

      {/* SPLIT COMMAND GRID: ATTENTION LIST & LIVE MAP */}
      <section className="posko-ops-grid">
        {/* Left: Cases needing attention */}
        <div className="ops-card-panel">
          <div className="ops-panel-header">
            <div>
              <h3>Daftar Kebutuhan Terbuka Posko Ini</h3>
              <p>Kebutuhan KK yang telah diverifikasi dan siap disalurkan mitra</p>
            </div>
            <button type="button" className="btn-ops-all" onClick={() => setPage(openNeedsCases.length > 0 ? "resources" : "cases")}>
              {openNeedsCases.length > 0 ? "Lihat Bursa" : "Verifikasi Kasus"} <Icon name="next" />
            </button>
          </div>

          <div className="ops-attention-list">
            {openNeedsCases.length === 0 ? (
              <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--muted)", background: "#fbfbf8", borderRadius: "12px", border: "1px dashed var(--border)" }}>
                <p style={{ margin: "0 0 6px", fontWeight: 600, color: "var(--forest)", fontSize: "0.95rem" }}>
                  Belum Ada Kebutuhan Terbuka
                </p>
                <p style={{ margin: "0 0 14px", fontSize: "0.85rem", color: "var(--muted)" }}>
                  {masukKK > 0 
                    ? `Terdapat ${masukKK} laporan warga baru yang menunggu verifikasi petugas.`
                    : "Laporan warga yang telah diverifikasi akan otomatis tampil di sini dan siap didanai mitra."}
                </p>
                {masukKK > 0 && (
                  <button 
                    type="button" 
                    className="btn-ops-all" 
                    style={{ margin: "0 auto", padding: "6px 14px", fontSize: "0.85rem", cursor: "pointer" }}
                    onClick={() => setPage("cases")}
                  >
                    Verifikasi Laporan Sekarang <Icon name="next" />
                  </button>
                )}
              </div>
            ) : (
              openNeedsCases.map((c) => (
                <button 
                  type="button" 
                  className="ops-attention-item" 
                  onClick={() => { update({ activeCaseId: c.id }); setPage("case"); }} 
                  key={c.id}
                >
                  <div className="ops-item-badge">
                    <Pill tone={c.urgency === "Kritis" ? "critical" : c.urgency === "Tinggi" ? "high" : "neutral"}>
                      {c.urgency}
                    </Pill>
                  </div>
                  <div className="ops-item-info">
                    <strong>{c.item} ({c.qty})</strong>
                    <small>{c.id} · {c.location} · {c.kk}</small>
                  </div>
                  <span className="ops-item-action">
                    Buka Kasus <Icon name="next" />
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right: Operational Map Preview */}
        <div className="ops-card-panel">
          <div className="ops-panel-header">
            <div>
              <h3>Peta Sebaran Kebutuhan Wilayah</h3>
              <p>Visualisasi sebaran posko dan titik darurat</p>
            </div>
            <button type="button" className="btn-ops-all" onClick={() => setPage("map")}>
              Perbesar Peta <Icon name="next" />
            </button>
          </div>

          <div className="ops-map-wrapper">
            <MapView 
              operational 
              hideCard 
              cases={allCases}
              onSelectCase={(c) => {
                if (c?.id) {
                  update({ activeCaseId: c.id });
                  setPage("case");
                }
              }}
              initialLat={primaryLat}
              initialLng={primaryLng}
              locationAddress={primaryAddress}
              caseTitle={primaryCase?.item}
              caseId={primaryCase?.id}
              caseKk={primaryCase?.kk}
              caseUrgency={primaryCase?.urgency}
            />
          </div>
        </div>
      </section>

      {/* ACTIVITY LOG SECTION */}
      <div className="posko-activity-panel">
        <Activity state={state} update={update} setPage={setPage} />
      </div>
    </main>
  );
}

function MapPage({ 
  open, 
  cases = [], 
  onSelectCase, 
  role = "responder",
  onNavigateToBursa,
  onNavigateToTasks
}: { 
  open: () => void; 
  cases?: CaseRecord[]; 
  onSelectCase?: (c: any) => void;
  role?: "posko" | "responder" | "citizen";
  onNavigateToBursa?: () => void;
  onNavigateToTasks?: () => void;
}) {
  const [priority, setPriority] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [focusTrigger, setFocusTrigger] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const handleSelectAndFocusCase = (c: CaseRecord, scrollToMap: boolean = false) => {
    setSelectedCase(c);
    onSelectCase?.(c);
    setFocusTrigger(Date.now());
    if (scrollToMap) {
      const mapSection = document.getElementById("reksa-gis-map-container");
      if (mapSection) {
        mapSection.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  };

  // Auto-select first urgent or first case
  useEffect(() => {
    if (!selectedCase && cases.length > 0) {
      const firstUrgent = cases.find(c => c.urgency === "Kritis") || cases[0];
      setSelectedCase(firstUrgent);
    }
  }, [cases, selectedCase]);

  // Metric counts
  const totalCases = cases.length;
  const countKritis = cases.filter(c => c.urgency === "Kritis").length;
  const countTinggi = cases.filter(c => c.urgency === "Tinggi").length;
  const countSedang = cases.filter(c => c.urgency === "Sedang" || (!c.urgency && c.status !== "Selesai")).length;
  const countSelesai = cases.filter(c => c.status === "Selesai" || c.status === "Terpenuhi").length;

  // Filtering
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (priority === "Kritis" && c.urgency !== "Kritis") return false;
      if (priority === "Tinggi" && c.urgency !== "Tinggi") return false;
      if (priority === "Sedang" && c.urgency !== "Sedang" && c.urgency) return false;
      if (priority === "Selesai" && c.status !== "Selesai" && c.status !== "Terpenuhi") return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const idMatch = (c.id || "").toLowerCase().includes(q);
        const itemMatch = (c.item || "").toLowerCase().includes(q);
        const locMatch = (c.location || "").toLowerCase().includes(q);
        const desaMatch = (c.village || "").toLowerCase().includes(q);
        const kecMatch = (c.district || "").toLowerCase().includes(q);
        return idMatch || itemMatch || locMatch || desaMatch || kecMatch;
      }
      return true;
    });
  }, [cases, priority, searchQuery]);

  // Reset pagination on filter change
  const handlePriorityChange = (val: string) => {
    setPriority(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  // Pagination for cases list below map
  const totalPages = Math.max(1, Math.ceil(filteredCases.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedCases = filteredCases.slice(startIndex, startIndex + pageSize);

  const getUrgencyBadgeClass = (urgency?: string) => {
    switch (urgency) {
      case "Kritis": return "posko-case-urgency-badge urgency-kritis";
      case "Tinggi": return "posko-case-urgency-badge urgency-tinggi";
      default: return "posko-case-urgency-badge urgency-sedang";
    }
  };

  return (
    <main className="workspace map-page-workspace" style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 24px" }}>
      <PageHead 
        eyebrow="Pusat Pemetaan GIS Operasional" 
        title="Peta Kebutuhan Bencana" 
        copy="Pantau sebaran titik kebutuhan warga, status urgensi penanganan logistik, dan posko penanggulangan bencana di seluruh wilayah." 
      />

      {/* 1. STATISTIC METRIC CARDS (MONOCHROME) */}
      <div className="posko-metrics-grid-4" style={{ marginBottom: "22px" }}>
        {/* Card 1: Total Titik */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Total Titik Kebutuhan
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <Icon name="map" />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {totalCases} Titik
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Sebaran terdata di wilayah
          </small>
        </div>

        {/* Card 2: Prioritas Kritis */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Prioritas Kritis
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <Icon name="alert" />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {countKritis} Titik
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Mendesak ditangani &lt; 24 jam
          </small>
        </div>

        {/* Card 3: Prioritas Tinggi */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Prioritas Tinggi
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <Icon name="clock" />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {countTinggi} Titik
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Dukungan logistik mendesak
          </small>
        </div>

        {/* Card 4: Selesai / Terpenuhi */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "18px 20px",
            border: "1px solid rgba(1, 50, 32, 0.1)",
            boxShadow: "0 2px 8px rgba(1, 50, 32, 0.03)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#80866e", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Kasus Selesai
            </span>
            <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(1, 50, 32, 0.08)", color: "#013220", display: "grid", placeItems: "center" }}>
              <Icon name="check" />
            </div>
          </div>
          <div style={{ fontSize: "1.75rem", fontWeight: 800, color: "#013220", lineHeight: 1.1 }}>
            {countSelesai} Titik
          </div>
          <small style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "4px", display: "block" }}>
            Bantuan tuntas diserahkan
          </small>
        </div>
      </div>

      {/* 2. FILTER & SEARCH BAR */}
      <div className="map-page-top-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap", marginBottom: "18px" }}>
        <div className="cases-pill-filters" style={{ display: "flex", gap: "8px", overflowX: "auto" }}>
          {[
            { label: "Semua", count: totalCases },
            { label: "Kritis", count: countKritis },
            { label: "Tinggi", count: countTinggi },
            { label: "Sedang", count: countSedang },
            { label: "Selesai", count: countSelesai },
          ].map((x) => (
            <button 
              type="button" 
              className={`case-filter-btn ${priority === x.label ? "active" : ""}`} 
              onClick={() => handlePriorityChange(x.label)} 
              key={x.label}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>{x.label}</span>
              <span style={{ 
                fontSize: "0.75rem", 
                padding: "1px 7px", 
                borderRadius: "999px", 
                background: priority === x.label ? "rgba(255, 255, 255, 0.25)" : "rgba(1, 50, 32, 0.08)",
                color: priority === x.label ? "#ffffff" : "#013220",
                fontWeight: 700
              }}>
                {x.count}
              </span>
            </button>
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "#ffffff", border: "1px solid rgba(1, 50, 32, 0.15)", borderRadius: "999px", padding: "6px 14px", minWidth: "260px" }}>
          <Icon name="search" />
          <input 
            type="text" 
            placeholder="Cari titik (komoditas, lokasi, ID)..." 
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{ border: "none", outline: "none", fontSize: "0.85rem", width: "100%", background: "transparent" }}
          />
          {searchQuery && (
            <button type="button" onClick={() => handleSearchChange("")} style={{ border: "none", background: "transparent", cursor: "pointer", color: "#94a3b8", fontSize: "14px" }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* 3. INTERACTIVE GIS MAP */}
      <div id="reksa-gis-map-container" style={{ marginBottom: "24px" }}>
        <div style={{ position: "relative", borderRadius: "18px", overflow: "hidden", border: "1.5px solid rgba(1, 50, 32, 0.14)", boxShadow: "0 8px 30px rgba(1, 50, 32, 0.06)" }}>
          <MapView 
            operational 
            cases={filteredCases} 
            focusedCaseId={selectedCase?.id}
            focusTrigger={focusTrigger}
            height="440px"
            onSelectCase={(c) => {
              setSelectedCase(c);
              onSelectCase?.(c);
            }} 
          />
        </div>

        {/* SELECTED CASE INSPECTOR CARD (CLEANLY BELOW MAP - NEVER OVERLAPS LEGEND) */}
        {selectedCase && (
          <div style={{
            marginTop: "14px",
            background: "#ffffff",
            border: "1.5px solid rgba(1, 50, 32, 0.12)",
            borderRadius: "16px",
            padding: "16px 22px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            boxShadow: "0 4px 18px rgba(0, 0, 0, 0.04)",
            gap: "16px",
            flexWrap: "wrap",
          }}>
            <div 
              style={{ display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}
              onClick={() => handleSelectAndFocusCase(selectedCase, true)}
              title="Klik untuk memfokuskan peta ke titik kebutuhan ini"
            >
              <div className="floating-pin-icon" style={{ flexShrink: 0 }}><Icon name="pin" /></div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <small style={{ color: "#80866e", fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                    TITIK KEBUTUHAN TERPILIH · URGENSI {selectedCase.urgency || "Sedang"}
                  </small>
                  <span style={{ fontSize: "10px", color: "#013220", background: "rgba(1, 50, 32, 0.08)", padding: "1px 6px", borderRadius: "4px", fontWeight: 700 }}>
                    📍 Terfokus di Peta
                  </span>
                </div>
                <strong style={{ display: "block", fontSize: "15px", color: "#013220", margin: "2px 0" }}>
                  {selectedCase.item} · {selectedCase.id} ({selectedCase.qty || selectedCase.kk || "1 KK"})
                </strong>
                <span style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  {selectedCase.location || [selectedCase.village, selectedCase.district, selectedCase.regency].filter(Boolean).join(", ") || "Lokasi Warga Terdampak"}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => handleSelectAndFocusCase(selectedCase, true)}
                style={{
                  background: "rgba(1, 50, 32, 0.06)",
                  color: "#013220",
                  border: "1px solid rgba(1, 50, 32, 0.18)",
                  borderRadius: "10px",
                  padding: "8px 14px",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px"
                }}
                title="Fokuskan peta ke titik koordinat kebutuhan ini"
              >
                <Icon name="pin" /> Pusatkan Peta
              </button>
              <Button 
                onClick={() => {
                  if (selectedCase?.id) {
                    onSelectCase?.(selectedCase);
                  }
                  open();
                }} 
                className="btn-map-inspect"
                style={{ whiteSpace: "nowrap" }}
              >
                {role === "responder" ? "Buka di Bursa / Misi" : "Buka Kasus Ini"} <Icon name="next" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 4. DAFTAR TITIK KEBUTUHAN TERPETAKAN (BELOW MAP) */}
      <div style={{ background: "#ffffff", borderRadius: "18px", border: "1px solid rgba(1, 50, 32, 0.1)", padding: "24px", boxShadow: "0 4px 16px rgba(1, 50, 32, 0.04)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#013220" }}>
              Daftar Titik Kebutuhan Terpetakan
            </h3>
            <p style={{ margin: "4px 0 0", fontSize: "0.84rem", color: "#64748b" }}>
              Menampilkan {filteredCases.length} titik sebaran kebutuhan warga di lapangan berdasarkan filter aktif.
            </p>
          </div>
          <span style={{ fontSize: "0.82rem", color: "#80866e", fontWeight: 600 }}>
            Halaman {validCurrentPage} dari {totalPages}
          </span>
        </div>

        {paginatedCases.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#64748b" }}>
            <p style={{ fontSize: "0.92rem", margin: 0 }}>Tidak ada titik kebutuhan yang cocok dengan pencarian atau filter yang dipilih.</p>
            <Button variant="secondary" onClick={() => { setPriority("Semua"); setSearchQuery(""); }} style={{ marginTop: "12px" }}>
              Reset Filter
            </Button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1.5px solid rgba(1, 50, 32, 0.1)", color: "#80866e", fontSize: "0.76rem", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Kode &amp; Urgensi</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Kebutuhan &amp; Target</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Wilayah Administrasi</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700 }}>Status Lapangan</th>
                  <th style={{ padding: "10px 14px", fontWeight: 700, textAlign: "right" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedCases.map((c) => {
                  const isSelected = selectedCase?.id === c.id;
                  return (
                    <tr 
                      key={c.id} 
                      onClick={() => {
                        handleSelectAndFocusCase(c, true);
                      }}
                      style={{ 
                        borderBottom: "1px solid rgba(1, 50, 32, 0.06)", 
                        background: isSelected ? "rgba(1, 50, 32, 0.05)" : "transparent",
                        cursor: "pointer",
                        transition: "background 0.15s ease"
                      }}
                    >
                      <td style={{ padding: "14px", verticalAlign: "middle" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#013220", fontSize: "0.82rem" }}>
                            {c.id}
                          </span>
                          <span className={getUrgencyBadgeClass(c.urgency)} style={{ fontSize: "0.72rem", padding: "2px 8px" }}>
                            {c.urgency || "Sedang"}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: "14px", verticalAlign: "middle" }}>
                        <strong style={{ color: "#013220", display: "block", fontSize: "0.9rem" }}>
                          {c.item}
                        </strong>
                        <small style={{ color: "#64748b" }}>
                          Target: {c.qty || c.kk || "1 KK"} ({c.kk || "1 KK"})
                        </small>
                      </td>
                      <td style={{ padding: "14px", verticalAlign: "middle", color: "#334155" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                          <Icon name="pin" />
                          <span>{c.village || c.location || "Lokasi Warga"}</span>
                        </div>
                        <small style={{ color: "#80866e", display: "block" }}>
                          {[c.district, c.regency].filter(Boolean).join(", ") || c.location}
                        </small>
                      </td>
                      <td style={{ padding: "14px", verticalAlign: "middle" }}>
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: "12px",
                          background: c.status === "Selesai" ? "#f0fdf4" : c.status === "Dalam Pengiriman" ? "#fffbeb" : "#eff6ff",
                          color: c.status === "Selesai" ? "#15803d" : c.status === "Dalam Pengiriman" ? "#b45309" : "#1d4ed8",
                          border: `1px solid ${c.status === "Selesai" ? "#bbf7d0" : c.status === "Dalam Pengiriman" ? "#fde68a" : "#bfdbfe"}`
                        }}>
                          {c.status || "Kebutuhan Terbuka"}
                        </span>
                      </td>
                      <td style={{ padding: "14px", verticalAlign: "middle", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelectAndFocusCase(c, true);
                            }}
                            style={{
                              background: isSelected ? "#013220" : "#ffffff",
                              color: isSelected ? "#ffffff" : "#013220",
                              border: "1px solid rgba(1, 50, 32, 0.2)",
                              borderRadius: "8px",
                              padding: "6px 12px",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            title="Fokuskan peta ke lokasi titik ini"
                          >
                            <Icon name="pin" /> {isSelected ? "Terpilih" : "Fokus"}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (c?.id) {
                                onSelectCase?.(c);
                              }
                              open();
                            }}
                            style={{
                              background: "#013220",
                              color: "#ffffff",
                              border: "none",
                              borderRadius: "8px",
                              padding: "6px 12px",
                              fontSize: "0.78rem",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            Buka <Icon name="next" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(1, 50, 32, 0.08)" }}>
                <span style={{ fontSize: "0.82rem", color: "#64748b" }}>
                  Menampilkan {startIndex + 1} - {Math.min(startIndex + pageSize, filteredCases.length)} dari {filteredCases.length} titik
                </span>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    disabled={validCurrentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    style={{
                      background: "#ffffff",
                      border: "1px solid rgba(1, 50, 32, 0.2)",
                      borderRadius: "8px",
                      padding: "6px 14px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: validCurrentPage <= 1 ? "#94a3b8" : "#013220",
                      cursor: validCurrentPage <= 1 ? "not-allowed" : "pointer"
                    }}
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={validCurrentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    style={{
                      background: "#ffffff",
                      border: "1px solid rgba(1, 50, 32, 0.2)",
                      borderRadius: "8px",
                      padding: "6px 14px",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: validCurrentPage >= totalPages ? "#94a3b8" : "#013220",
                      cursor: validCurrentPage >= totalPages ? "not-allowed" : "pointer"
                    }}
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Resources({ state, update, setPage, notify, responder, onRefresh }: { 
  state: SharedState; 
  update: RouterProps["update"]; 
  setPage?: RouterProps["setPage"];
  notify?: RouterProps["notify"];
  responder: boolean; 
  onRefresh?: () => Promise<void> | void;
}) {
  const [kind, setKind] = useState("Semua");
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const bursaItems = state.bursaList || [];

  const handleApprove = async (bursa: BursaItem) => {
    try {
      setApprovingId(bursa.id);
      const res = await apiService.approveClaimBursa(bursa.id, {
        approved_volume: bursa.claimed_volume || bursa.target_volume,
        catatan: "Disetujui oleh Koordinator Posko. Surat Misi Penyaluran diterbitkan.",
      });
      if (res.success) {
        notify?.(`Alokasi logistik disetujui! Misi ${res.data.misi?.kode_misi || "MISI"} resmi diterbitkan untuk ${bursa.claimed_org || "Mitra"}.`);
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal menyetujui klaim bantuan mitra.");
    } finally {
      setApprovingId(null);
    }
  };

  const categories = ["Semua", ...Array.from(new Set(bursaItems.map((b) => b.kebutuhan?.kategori_kebutuhan || b.item_bantuan.split(" (")[0])))];

  const filtered = bursaItems.filter((b) => {
    if (kind === "Semua") return true;
    const cat = b.kebutuhan?.kategori_kebutuhan || b.item_bantuan;
    return cat.toLowerCase().includes(kind.toLowerCase());
  });

  return (
    <main className="workspace resources-workspace">
      <PageHead 
        eyebrow="Bursa Logistik & Komitmen Mitra" 
        title="Bursa Bantuan & Alokasi Mitra" 
        copy="Kelola kebutuhan terbuka posko yang dirilis ke bursa, tinjau proposal komitmen armada dari Mitra &amp; Instansi, serta terbitkan Surat Misi Penyaluran Resmi." 
        action={
          <div className="trust-badge">
            <Icon name="box" /> {bursaItems.length} Kebutuhan di Bursa
          </div>
        }
      />

      <div className="resource-filter-bar">
        <div className="cases-pill-filters">
          {categories.map((t) => (
            <button
              key={t}
              type="button"
              className={`case-filter-btn ${kind === t ? "active" : ""}`}
              onClick={() => setKind(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1px solid rgba(1, 50, 32, 0.1)", borderRadius: "18px", padding: "48px 24px", textAlign: "center", maxWidth: "600px", margin: "20px auto" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(1, 50, 32, 0.08)", color: "var(--forest)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <Icon name="box" />
          </div>
          <h3 style={{ margin: "0 0 8px", color: "var(--forest)" }}>Belum Ada Kebutuhan di Bursa</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.5, margin: "0 0 20px" }}>
            Laporan warga yang diverifikasi oleh Koordinator Posko akan otomatis diterbitkan ke Bursa Bantuan Terbuka agar dapat dipenuhi oleh Mitra Bantuan.
          </p>
          <Button onClick={() => setPage?.("cases")}>
            <Icon name="file" /> Buka Daftar Kebutuhan Posko
          </Button>
        </div>
      ) : (
        <div className="resources-grid">
          {filtered.map((item) => {
            const isClaimed = item.status === "Klaim Diajukan";
            const isAllocated = item.status === "Teralokasi Penuh" || item.status === "Sebagian Terpenuhi";
            const isDone = item.status === "Selesai";
            const orgName = item.claimed_org || item.claimedBy?.organization || "Posko BPBD";
            const orgMark = orgName.slice(0, 2).toUpperCase();

            return (
              <div className="resource-card" key={item.id} style={isClaimed ? { border: "2px solid #ea580c" } : {}}>
                <div className="resource-card-header">
                  <span className="resource-org-mark" style={isClaimed ? { background: "rgba(234, 88, 12, 0.12)", color: "#c2410c" } : {}}>
                    {orgMark}
                  </span>
                  <span className={`resource-status-badge ${isAllocated || isDone ? "allocated" : "ready"}`} style={isClaimed ? { background: "rgba(234, 88, 12, 0.12)", color: "#c2410c", fontWeight: 700 } : {}}>
                    {isClaimed ? "Klaim Mitra Masuk · Perlu Persetujuan" : isAllocated ? "Teralokasi · Misi Terbit" : isDone ? "Selesai Tuntas" : "Terbuka di Bursa"}
                  </span>
                </div>

                <div className="resource-card-body">
                  <span className="resource-category-chip">
                    {item.urgensi} · {item.kebutuhan?.jumlah_kk || 1} KK
                  </span>
                  <h3>{item.item_bantuan}</h3>
                  <div className="resource-meta-row">
                    <span><Icon name="pin" /> {item.posko?.nama_posko || "Posko Wilayah"}</span>
                    <span><Icon name="file" /> {item.kebutuhan?.kode_kasus || `Kasus #${item.kebutuhan_id}`}</span>
                  </div>

                  <div className="resource-qty-banner">
                    <small>Target Logistik:</small>
                    <strong>{item.target_volume}</strong>
                  </div>

                  {isClaimed && (
                    <div style={{ background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: "12px", padding: "12px 14px", margin: "10px 0 16px", fontSize: "0.85rem", color: "#9a3412" }}>
                      <div style={{ fontWeight: 700, marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Icon name="user" /> Pengajuan Komitmen Mitra:
                      </div>
                      <div><strong>Organisasi:</strong> {item.claimed_org || "Mitra Kemanusiaan"}</div>
                      <div><strong>Armada:</strong> {item.claimed_armada || "Truk / Armada Angkut"}</div>
                      <div><strong>Volume:</strong> {item.claimed_volume || item.target_volume}</div>
                      {item.claim_notes && <div style={{ marginTop: "4px", fontStyle: "italic" }}>"{item.claim_notes}"</div>}
                    </div>
                  )}

                  {isAllocated && (
                    <div style={{ background: "#f0fdf4", border: "1px solid #dcfce7", borderRadius: "10px", padding: "10px 12px", margin: "8px 0 14px", fontSize: "0.84rem", color: "#166534" }}>
                      <Icon name="check" /> Alokasi resmi disetujui. Misi penyaluran aktif ditugaskan ke mitra.
                    </div>
                  )}
                </div>

                <div className="resource-card-footer">
                  {responder ? (
                    <Button variant="secondary" onClick={() => navigator.clipboard?.writeText(item.item_bantuan)}>
                      Salin Info Kebutuhan
                    </Button>
                  ) : isClaimed ? (
                    <Button 
                      onClick={() => handleApprove(item)} 
                      disabled={approvingId === item.id}
                      style={{ background: "#ea580c", borderColor: "#ea580c", color: "#ffffff" }}
                    >
                      <Icon name="check" /> {approvingId === item.id ? "Menerbitkan Misi..." : "Setujui Alokasi & Rilis Misi"}
                    </Button>
                  ) : isAllocated ? (
                    <Button variant="secondary" onClick={() => setPage?.("assignments")}>
                      <Icon name="task" /> Pantau di Penugasan Armada
                    </Button>
                  ) : (
                    <div style={{ textAlign: "center", padding: "8px", fontSize: "0.84rem", color: "var(--muted)", fontStyle: "italic" }}>
                      Menunggu komitmen armada mitra di Bursa Terbuka
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Assignments({ state, open, responder = false, onRefresh, notify, update, setPage }: { 
  state: SharedState; 
  open: () => void; 
  responder?: boolean;
  onRefresh?: () => Promise<void> | void;
  notify?: RouterProps["notify"];
  update?: RouterProps["update"];
  setPage?: RouterProps["setPage"];
}) {
  const missions = state.misiList || [];
  const inDelivery = missions.filter((m) => m.status_tahapan === "Dalam Pengiriman").length;
  const inArrived = missions.filter((m) => m.status_tahapan === "Tiba di Lokasi & Diserahkan").length;
  const completed = missions.filter((m) => m.status_tahapan === "Selesai").length;

  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const handleConfirm = async (misi: MisiItem) => {
    try {
      setConfirmingId(misi.id);
      const res = await apiService.confirmReceiptKebutuhan(misi.kebutuhan_id);
      if (res.success) {
        notify?.(`Bantuan misi ${misi.kode_misi} berhasil dikonfirmasi diterima tuntas! Status kasus selesai.`);
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal mengonfirmasi penerimaan bantuan.");
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <main className="workspace assignments-workspace">
      <PageHead 
        eyebrow={responder ? "Riwayat & Logistik Penyaluran" : "Koordinasi Lapangan & Armada"} 
        title={responder ? "Riwayat Misi Penyaluran" : "Penugasan & Distribusi Armada"} 
        copy="Pantau tugas armada aktif, status pengiriman langsung di lapangan, dan konfirmasi serah terima bantuan warga." 
      />

      {/* SUMMARY STATS */}
      <div className="assignments-summary-row">
        <div className="asg-sum-box">
          <strong>{missions.length}</strong>
          <span>Total Misi Lapangan</span>
        </div>
        <div className="asg-sum-box info">
          <strong>{inDelivery}</strong>
          <span>Dalam Perjalanan</span>
        </div>
        <div className="asg-sum-box success">
          <strong>{completed}</strong>
          <span>Selesai Diterima</span>
        </div>
      </div>

      {missions.length === 0 ? (
        <div style={{ background: "#ffffff", border: "1px solid rgba(1, 50, 32, 0.1)", borderRadius: "18px", padding: "48px 24px", textAlign: "center", maxWidth: "600px", margin: "20px auto" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(1, 50, 32, 0.08)", color: "var(--forest)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <Icon name="task" />
          </div>
          <h3 style={{ margin: "0 0 8px", color: "var(--forest)" }}>Belum Ada Misi Penyaluran</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.5, margin: "0 0 20px" }}>
            {responder 
              ? "Anda belum memiliki misi penyaluran. Silakan ajukan komitmen pada Bursa Bantuan Terbuka di menu Beranda."
              : "Misi resmi akan otomatis dibuat saat Anda menyetujui klaim bantuan mitra pada menu Sumber Daya & Bursa Bantuan."}
          </p>
          <Button onClick={() => setPage?.(responder ? "dashboard" : "resources")}>
            <Icon name="box" /> {responder ? "Buka Bursa Bantuan Terbuka" : "Buka Bursa & Sumber Daya"}
          </Button>
        </div>
      ) : (
        <div className="assignments-list-grid">
          {missions.map((x) => {
            const isArrived = x.status_tahapan === "Tiba di Lokasi & Diserahkan";
            const isDone = x.status_tahapan === "Selesai";
            const isInDelivery = x.status_tahapan === "Dalam Pengiriman";

            return (
              <div className="assignment-card" key={x.id}>
                <div className="asg-card-header">
                  <span className="asg-id-badge">{x.kode_misi}</span>
                  <Pill tone={isDone ? "done" : isInDelivery ? "high" : isArrived ? "warning" : "neutral"}>
                    {x.status_tahapan}
                  </Pill>
                </div>

                <div className="asg-card-body">
                  <span className="resource-category-chip">{x.organisasi}</span>
                  <h3>PIC: {x.responder_name}</h3>
                  <div className="asg-meta-row">
                    <span><Icon name="file" /> {x.kebutuhan?.kode_kasus || `Kasus #${x.kebutuhan_id}`}</span>
                    <span><Icon name="pin" /> {x.posko?.nama_posko || "Posko Wilayah"}</span>
                  </div>
                  <div className="asg-payload-badge">
                    <small>Muatan Bantuan &amp; Armada:</small>
                    <strong>{x.muatan} · {x.armada_info}</strong>
                  </div>
                  {x.estimasi_waktu && (
                    <div style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Icon name="clock" /> Estimasi: {x.estimasi_waktu}
                    </div>
                  )}
                </div>

                <div className="asg-card-footer" style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  {isArrived && !responder && (
                    <Button 
                      onClick={() => handleConfirm(x)} 
                      disabled={confirmingId === x.id}
                      style={{ width: "100%", background: "#16a34a", borderColor: "#16a34a" }}
                    >
                      <Icon name="check" /> {confirmingId === x.id ? "Mengonfirmasi..." : "Konfirmasi Penerimaan Tuntas"}
                    </Button>
                  )}
                  <button 
                    type="button" 
                    className="btn-asg-view" 
                    onClick={() => {
                      if (x.kebutuhan?.kode_kasus && update) {
                        update({ activeCaseId: x.kebutuhan.kode_kasus });
                      }
                      open();
                    }}
                  >
                    Detail Penugasan &amp; Kasus <Icon name="next" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Activity({ 
  state, 
  activeCase, 
  update, 
  setPage 
}: { 
  state: SharedState; 
  activeCase?: CaseRecord;
  update?: RouterProps["update"];
  setPage?: RouterProps["setPage"];
}) {
  const allCases = state.casesList || [];
  
  // Sort and prioritize cases (Kritis/Tinggi first, limit to top 10 for clean performance)
  const prioritizedCases = [...allCases].sort((a, b) => {
    const scoreA = a.urgencyScore || (a.urgency === "Kritis" ? 90 : a.urgency === "Tinggi" ? 70 : 40);
    const scoreB = b.urgencyScore || (b.urgency === "Kritis" ? 90 : b.urgency === "Tinggi" ? 70 : 40);
    return scoreB - scoreA;
  }).slice(0, 10);

  const currentCase = activeCase || (allCases.find(c => c.id === state.activeCaseId) || allCases[0]);

  // Ensure currentCase is included in selectableCases so the select value matches
  const selectableCases = currentCase && !prioritizedCases.some(c => c.id === currentCase.id)
    ? [currentCase, ...prioritizedCases]
    : (prioritizedCases.length > 0 ? prioritizedCases : (currentCase ? [currentCase] : []));

  const caseId = currentCase?.id || "RK-2026-00124";
  const applicant = currentCase?.applicantName || "Andi Pratama";
  const status = currentCase?.status || "Dalam Verifikasi";
  const poskoShort = currentCase?.posko?.split(" ")[0] || "POSKO";

  const [dbCaseLogs, setDbCaseLogs] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredSearchResults = searchQuery.trim()
    ? allCases.filter((c) => {
        const q = searchQuery.toLowerCase().trim();
        return (
          (c.id || "").toLowerCase().includes(q) ||
          (c.item || "").toLowerCase().includes(q) ||
          (c.location || "").toLowerCase().includes(q) ||
          (c.applicantName || "").toLowerCase().includes(q) ||
          (c.urgency || "").toLowerCase().includes(q) ||
          (c.village || "").toLowerCase().includes(q) ||
          (c.district || "").toLowerCase().includes(q)
        );
      }).slice(0, 8)
    : [];

  useEffect(() => {
    let isMounted = true;
    apiService.getActivityLogs()
      .then((res) => {
        if (isMounted && res.success && Array.isArray(res.data)) {
          const matched = res.data.filter(
            (l) => l.kebutuhan?.kode_kasus === caseId || l.deskripsi?.includes(caseId) || l.kebutuhan_id?.toString() === caseId
          );
          setDbCaseLogs(matched);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, [caseId, status, state?.logs]);

  if (currentCase) {
    const score = currentCase.urgencyScore || (currentCase.urgency === "Kritis" ? 88 : currentCase.urgency === "Tinggi" ? 72 : 55);
    const formatTimeWib = (t?: string) => {
      if (!t) return "08:15 WIB";
      let clean = t.replace(".", ":");
      if (!clean.toUpperCase().includes("WIB")) {
        clean = `${clean} WIB`;
      }
      return clean;
    };

    // Parse base Date from database timestamps
    const getBaseDate = () => {
      if (currentCase.createdAtRaw) {
        const d = new Date(currentCase.createdAtRaw);
        if (!isNaN(d.getTime())) return d;
      }
      const masukLog = dbCaseLogs.find(l => l.aksi?.toLowerCase().includes("masuk") || l.aksi?.toLowerCase().includes("lapor"));
      if (masukLog?.created_at) {
        const d = new Date(masukLog.created_at);
        if (!isNaN(d.getTime())) return d;
      }
      if (currentCase.createdAtTime) {
        const clean = currentCase.createdAtTime.replace(" WIB", "").trim();
        const parts = clean.split(/[:.]/);
        if (parts.length >= 2) {
          const d = new Date();
          d.setHours(parseInt(parts[0], 10), parseInt(parts[1], 10), 0, 0);
          return d;
        }
      }
      return new Date();
    };

    const baseDate = getBaseDate();

    const formatOffsetTime = (minutesOffset: number) => {
      const d = new Date(baseDate.getTime() + minutesOffset * 60 * 1000);
      return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":") + " WIB";
    };

    const processMilestones: { time: string; text: string; stage: string; statusTone: string }[] = [];

    // Stage 1: Laporan Masuk
    const masukLog = dbCaseLogs.find(l => l.aksi?.toLowerCase().includes("masuk") || l.aksi?.toLowerCase().includes("lapor"));
    const stage1Time = masukLog?.created_at
      ? formatTimeWib(new Date(masukLog.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }))
      : (currentCase.createdAtTime ? formatTimeWib(currentCase.createdAtTime) : formatOffsetTime(0));

    processMilestones.push({
      time: stage1Time,
      stage: "1. Laporan Masuk",
      text: `Laporan kebutuhan ${currentCase.item} (${currentCase.qty}) diajukan oleh pemohon ${applicant} untuk ${currentCase.kk || "1 KK"} di ${currentCase.location}.`,
      statusTone: "#15803d",
    });

    // Stage 2: Verifikasi Posko BPBD
    const verifyLog = dbCaseLogs.find(l => l.aksi?.toLowerCase().includes("verifikasi"));
    let stage2Time = "";
    if (currentCase.verifiedAtRaw) {
      stage2Time = formatTimeWib(new Date(currentCase.verifiedAtRaw).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
    } else if (verifyLog?.created_at) {
      stage2Time = formatTimeWib(new Date(verifyLog.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
    } else if (status === "Dalam Verifikasi" || status === "Diajukan") {
      // Masuk ke antrean verifikasi sesaat setelah laporan masuk
      stage2Time = formatOffsetTime(5);
    } else {
      stage2Time = formatOffsetTime(15);
    }

    processMilestones.push({
      time: stage2Time,
      stage: "2. Verifikasi BPBD",
      text: (status === "Dalam Verifikasi" || status === "Diajukan") 
        ? `Laporan berhasil diajukan dan sedang dalam antrean validasi data oleh Posko BPBD.`
        : `Petugas Posko BPBD telah menyelesaikan validasi. Permohonan disetujui dengan tingkat Prioritas ${currentCase.urgency}.`,
      statusTone: (status === "Dalam Verifikasi" || status === "Diajukan") ? "#d46b08" : "#15803d",
    });

    // Stage 3: Menunggu Kesiapan Bantuan
    if (status !== "Dalam Verifikasi" && status !== "Diajukan") {
      const openLog = dbCaseLogs.find(l => l.aksi?.toLowerCase().includes("bursa") || l.aksi?.toLowerCase().includes("terbuka"));
      const stage3Time = openLog?.created_at
        ? formatTimeWib(new Date(openLog.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }))
        : formatOffsetTime(25);

      processMilestones.push({
        time: stage3Time,
        stage: "3. Menunggu Bantuan",
        text: `Target kebutuhan ${currentCase.qty} siap dialokasikan melalui Dapur Umum/Logistik BPBD dan terbuka bagi mitra pendukung.`,
        statusTone: status === "Kebutuhan Terbuka" ? "#d46b08" : "#15803d",
      });
    }

    // Stage 4: Penyaluran Bantuan
    if (["Ditugaskan", "Dalam Pengiriman", "Menunggu Konfirmasi Penerimaan", "Selesai"].includes(status)) {
      const dispatchLog = dbCaseLogs.find(l => l.aksi?.toLowerCase().includes("kirim") || l.aksi?.toLowerCase().includes("salur") || l.aksi?.toLowerCase().includes("tugas"));
      const stage4Time = dispatchLog?.created_at
        ? formatTimeWib(new Date(dispatchLog.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }))
        : formatOffsetTime(65);

      processMilestones.push({
        time: stage4Time,
        stage: "4. Penyaluran Bantuan",
        text: `Armada logistik diberangkatkan membawa bantuan ${currentCase.item} (${currentCase.qty}) menuju lokasi penerima di ${currentCase.location}.`,
        statusTone: ["Ditugaskan", "Dalam Pengiriman"].includes(status) ? "#096dd9" : "#15803d",
      });
    }

    // Stage 5: Bantuan Diterima
    if (status === "Selesai") {
      const completeLog = dbCaseLogs.find(l => l.aksi?.toLowerCase().includes("konfirmasi") || l.aksi?.toLowerCase().includes("selesai") || l.aksi?.toLowerCase().includes("terima"));
      let stage5Time = "";
      if (currentCase.completedAtRaw) {
        stage5Time = formatTimeWib(new Date(currentCase.completedAtRaw).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      } else if (completeLog?.created_at) {
        stage5Time = formatTimeWib(new Date(completeLog.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
      } else {
        stage5Time = formatOffsetTime(120);
      }

      processMilestones.push({
        time: stage5Time,
        stage: "5. Bantuan Diterima",
        text: `Bantuan ${currentCase.item} (${currentCase.qty}) telah diserahterimakan dan dikonfirmasi tuntas diterima warga pemohon.`,
        statusTone: "#15803d",
      });
    }

    // Display latest milestone first
    const displayList = [...processMilestones].reverse();

    return (
      <div className="activity-aesthetic-panel">
        <div className="activity-panel-header">
          <div className="activity-header-title">
            <span className="eyebrow">Tahapan Penanganan &amp; Alur Kasus</span>
            <div className="activity-heading-row">
              <h3>Catatan Proses Kasus</h3>
              {!activeCase && selectableCases.length > 1 ? (
                <div className="activity-case-select-wrapper">
                  <select
                    id="activity-case-picker"
                    className="activity-case-select"
                    value={caseId}
                    onChange={(e) => {
                      const newId = e.target.value;
                      if (update) {
                        update({ activeCaseId: newId });
                      }
                    }}
                    title="Pilih kasus untuk memantau alur tahapan penanganan"
                  >
                    {selectableCases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.id} — {c.item} ({c.urgency || "Mendesak"})
                      </option>
                    ))}
                  </select>
                  <span className="activity-select-icon"><Icon name="down" /></span>
                </div>
              ) : (
                <span className="case-id-code-badge">{caseId}</span>
              )}
            </div>
          </div>

          <div className="activity-header-actions">
            {!activeCase && (
              <div className="activity-search-container" ref={searchContainerRef}>
                <div className="activity-search-box">
                  <span className="activity-search-icon"><Icon name="search" /></span>
                  <input
                    type="text"
                    className="activity-search-input"
                    placeholder="Cari kode, item, lokasi..."
                    value={searchQuery}
                    onFocus={() => setIsSearchOpen(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsSearchOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && filteredSearchResults.length > 0) {
                        e.preventDefault();
                        const first = filteredSearchResults[0];
                        if (update && first) {
                          update({ activeCaseId: first.id });
                          setIsSearchOpen(false);
                          setSearchQuery("");
                        }
                      } else if (e.key === "Escape") {
                        setIsSearchOpen(false);
                      }
                    }}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="activity-search-clear"
                      onClick={() => {
                        setSearchQuery("");
                        setIsSearchOpen(false);
                      }}
                      title="Hapus pencarian"
                    >
                      ×
                    </button>
                  )}
                </div>

                {isSearchOpen && searchQuery.trim() && (
                  <div className="activity-search-popover">
                    <div className="activity-search-popover-header">
                      <span>Hasil Pencarian Kasus ({filteredSearchResults.length})</span>
                      <small>Ketik Enter untuk pilih</small>
                    </div>
                    {filteredSearchResults.length > 0 ? (
                      <div className="activity-search-results-list">
                        {filteredSearchResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            className={`activity-search-item ${c.id === caseId ? "active" : ""}`}
                            onClick={() => {
                              if (update) update({ activeCaseId: c.id });
                              setIsSearchOpen(false);
                              setSearchQuery("");
                            }}
                          >
                            <div className="search-item-top">
                              <span className="search-item-code">{c.id}</span>
                              <span className={`search-item-urgency urgency-${(c.urgency || "sedang").toLowerCase().replace(/\s+/g, "-")}`}>
                                {c.urgency || "Mendesak"}
                              </span>
                            </div>
                            <strong className="search-item-title">{c.item} ({c.qty})</strong>
                            <small className="search-item-sub">
                              {c.applicantName || "Warga"} · {c.village ? `Desa ${c.village}, ${c.district}` : c.location}
                            </small>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="activity-search-empty">
                        <p>Tidak ada kasus ditemukan untuk "{searchQuery}".</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <span className={`activity-status-pill status-${(status || "").toLowerCase().replace(/\s+/g, "-")}`}>
              {status}
            </span>
            {setPage && !activeCase && (
              <button 
                type="button" 
                className="btn-activity-open-case"
                onClick={() => {
                  if (update && currentCase?.id) update({ activeCaseId: currentCase.id });
                  setPage("case");
                }}
                title="Buka detail lembar verifikasi kasus ini"
              >
                <span>Buka Detail Kasus</span>
                <Icon name="next" />
              </button>
            )}
          </div>
        </div>

        <div className="activity-timeline-list">
          {displayList.map((m, i) => (
            <div className="activity-timeline-item" key={`${m.stage}-${i}`}>
              <div className="timeline-node">
                <span className="timeline-dot" style={{ background: m.statusTone, boxShadow: i === 0 ? `0 0 0 4px ${m.statusTone}26` : undefined }} />
                {i < displayList.length - 1 && <span className="timeline-line" />}
              </div>
              <div className="timeline-content-card">
                <div className="timeline-card-top">
                  <span className="timeline-stage-pill" style={{ color: m.statusTone, background: `${m.statusTone}14`, borderColor: `${m.statusTone}30` }}>
                    {m.stage}
                  </span>
                  <time className="timeline-time"><Icon name="clock" /> {m.time}</time>
                </div>
                <p className="timeline-text">{m.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Fallback for general dashboard
  return (
    <div className="activity-aesthetic-panel">
      <div className="activity-panel-header">
        <div className="activity-header-title">
          <span className="eyebrow">Jejak Operasional Posko</span>
          <h3>Aktivitas &amp; Log Pembaruan</h3>
        </div>
        <span className="activity-live-tag"><i className="dot-green" /> Waktu Nyata</span>
      </div>

      <div className="activity-timeline-list">
        {state.logs.map((x, i) => (
          <div className="activity-timeline-item" key={`${x}-${i}`}>
            <div className="timeline-node">
              <span className="timeline-dot" />
              {i < state.logs.length - 1 && <span className="timeline-line" />}
            </div>
            <div className="timeline-content-card">
              <div className="timeline-card-top">
                <time className="timeline-time">08:15 WIB</time>
                <span className="timeline-case-code">{poskoShort} · {caseId}</span>
              </div>
              <p className="timeline-text">{x}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResponderRouter({ page, setPage, state, update, notify, name = "Arif Nugroho", setName, onRefresh, setRole }: RouterProps) {
  if (page === "dashboard") return <MitraDashboard state={state} update={update} setPage={setPage} notify={notify} onRefresh={onRefresh} />;
  if (page === "chat") return <ChatKoordinasi role="responder" name={name} state={state} notify={notify} onRefresh={onRefresh} setPage={setPage} />;
  if (page === "bursa") return <MitraBursaBantuan bursaList={state.bursaList || []} userOrg={state.userProfile?.org} userName={name} onRefresh={onRefresh} notify={notify} onNavigateToMyOffers={() => setPage("my-offers")} />;
  if (page === "my-offers") return <MitraPenawaranSaya penawaranList={state.penawaranList || []} bursaList={state.bursaList || []} userOrg={state.userProfile?.org} onNavigateToTasks={() => setPage("tasks")} onNavigateToBursa={() => setPage("bursa")} />;
  if (page === "tasks") return <MitraMisiPenyaluran misiList={state.misiList || []} userOrg={state.userProfile?.org} userName={name} onRefresh={onRefresh} notify={notify} onNavigateToHistory={() => setPage("history")} onNavigateToBursa={() => setPage("bursa")} />;
  if (page === "history") return <MitraRiwayatPenyaluran misiList={state.misiList || []} cases={state.casesList || []} onNavigateToTasks={() => setPage("tasks")} onSelectCase={(c) => { if (c?.id) update({ activeCaseId: c.id }); setPage("tasks"); }} notify={notify} onRefresh={onRefresh} />;
  if (page === "map") return (
    <MapPage 
      open={() => setPage("bursa")} 
      cases={state.casesList || []} 
      onSelectCase={(c) => { 
        if (c?.id) update({ activeCaseId: c.id }); 
      }} 
      role="responder"
      onNavigateToBursa={() => setPage("bursa")}
      onNavigateToTasks={() => setPage("tasks")}
    />
  );
  if (page === "notifications") return <Notifications role="responder" open={() => setPage("tasks")} state={state} update={update} setPage={setPage} />;
  if (page === "profile") return <Profile name={name} role="Mitra Bantuan" notify={notify} state={state} update={update} setName={setName} />;
  if (page === "settings") return <Settings notify={notify} />;
  return <Help />;
}

// Note: ResponderDashboard has been modularized and moved to ./components/mitra/MitraDashboard.tsx

function ResponderTask({ state, setPage, notify, onRefresh }: { 
  state: SharedState; 
  update: RouterProps["update"]; 
  setPage?: RouterProps["setPage"];
  notify?: RouterProps["notify"];
  onRefresh?: () => Promise<void> | void;
}) {
  const missions = state.misiList || [];
  const activeMission = missions.find((m) => m.status_tahapan !== "Selesai") || missions[0];

  const states = ["Disiapkan", "Dalam Pengiriman", "Tiba di Lokasi & Diserahkan"];
  const currentStep = activeMission?.status_tahapan === "Baru" || activeMission?.status_tahapan === "Diterima"
    ? "Disiapkan"
    : activeMission?.status_tahapan === "Selesai"
    ? "Tiba di Lokasi & Diserahkan"
    : (activeMission?.status_tahapan || "Disiapkan");

  const idx = Math.max(0, states.indexOf(currentStep));
  const actions = [
    "Mulai Pengiriman Bantuan (Armada Berangkat)",
    "Laporkan Tiba di Lokasi & Serahkan Logistik",
    "Bantuan Telah Diserahkan di Lokasi"
  ];

  const [isAdvancing, setIsAdvancing] = useState(false);

  const handleAdvance = async () => {
    if (!activeMission) return;
    try {
      setIsAdvancing(true);
      const res = await apiService.advanceMisiStep(activeMission.id);
      if (res.success) {
        notify?.(`Tahapan misi berhasil diperbarui menjadi: ${res.data.status_tahapan}`);
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal memperbarui tahapan misi.");
    } finally {
      setIsAdvancing(false);
    }
  };

  const handleConfirmFinalReceipt = async () => {
    if (!activeMission) return;
    try {
      setIsAdvancing(true);
      const res = await apiService.confirmReceiptKebutuhan(activeMission.kebutuhan_id);
      if (res.success) {
        notify?.(`Penerimaan bantuan misi ${activeMission.kode_misi} berhasil dikonfirmasi tuntas! Status kasus selesai.`);
        await onRefresh?.();
      }
    } catch (err: any) {
      notify?.(err?.message || "Gagal mengonfirmasi penerimaan bantuan.");
    } finally {
      setIsAdvancing(false);
    }
  };

  if (!activeMission) {
    return (
      <main className="workspace responder-workspace">
        <PageHead 
          eyebrow="Konsol Lapangan Responder" 
          title="Misi Penyaluran Bencana" 
          copy="Navigasi rute pengiriman bantuan, koordinasi langsung dengan posko penampung, dan perbarui tahapan serah terima secara real-time." 
        />
        <div style={{ background: "#ffffff", border: "1px solid rgba(1, 50, 32, 0.1)", borderRadius: "18px", padding: "48px 24px", textAlign: "center", maxWidth: "600px", margin: "40px auto" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "16px", background: "rgba(1, 50, 32, 0.08)", color: "var(--forest)", display: "grid", placeItems: "center", margin: "0 auto 16px" }}>
            <Icon name="task" />
          </div>
          <h3 style={{ margin: "0 0 8px", color: "var(--forest)" }}>Belum Ada Misi Lapangan Aktif</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.5, margin: "0 0 20px" }}>
            Anda belum memiliki surat tugas misi aktif. Silakan ajukan komitmen bantuan pada Bursa Bantuan Terbuka. Begitu disetujui Koordinator Posko, konsol misi dan panduan rute akan tampil di sini.
          </p>
          <Button onClick={() => setPage?.("dashboard")}>
            <Icon name="box" /> Buka Bursa Bantuan Terbuka
          </Button>
        </div>
      </main>
    );
  }

  const isCompleted = activeMission.status_tahapan === "Selesai";
  const isArrived = activeMission.status_tahapan === "Tiba di Lokasi & Diserahkan";

  return (
    <main className="workspace responder-workspace">
      <PageHead 
        eyebrow="Konsol Lapangan Responder" 
        title="Misi Penyaluran Bencana" 
        copy="Navigasi rute pengiriman bantuan, koordinasi langsung dengan posko penampung, dan perbarui tahapan serah terima secara real-time." 
        action={<div className="trust-badge"><Icon name="task" /> Misi: {activeMission.kode_misi} ({activeMission.status_tahapan})</div>}
      />

      {/* ACTIVE MISSION CONSOLE */}
      <section className="responder-mission-grid">
        {/* LEFT COLUMN: MISSION DETAILS & MAP */}
        <div className="responder-mission-main">
          {/* Mission Header Card */}
          <div className="mission-hero-card">
            <div className="mission-hero-top">
              <div>
                <span className="mission-id-tag">{activeMission.kode_misi} · {activeMission.posko?.nama_posko?.toUpperCase() || "POSKO WILAYAH"}</span>
                <h2>Distribusi {activeMission.muatan}</h2>
                <div className="mission-meta-items">
                  <span><Icon name="pin" /> Lokasi: {activeMission.kebutuhan?.desa ? `${activeMission.kebutuhan.desa}, ${activeMission.kebutuhan.kecamatan || ""}` : activeMission.posko?.desa || "Area Penyerahan"}</span>
                  <span><Icon name="clock" /> Estimasi: {activeMission.estimasi_waktu || "2,4 km dari Posko (±18 Menit)"}</span>
                </div>
              </div>
              <Pill tone={isCompleted ? "done" : isArrived ? "high" : "medium"}>
                {activeMission.status_tahapan}
              </Pill>
            </div>

            <div className="mission-payload-box">
              <div className="payload-info">
                <small>Muatan &amp; Armada Mitra:</small>
                <strong>{activeMission.armada_info} · {activeMission.organisasi}</strong>
              </div>
              <span className="payload-badge">Misi Resmi Posko</span>
            </div>
          </div>

          {/* Route Map Card */}
          <div className="mission-map-card">
            <div className="mission-card-header">
              <Icon name="map" />
              <div>
                <h3>Rute Distribusi Navigasi Posko</h3>
                <small>Panduan jalur aman terverifikasi {activeMission.posko?.nama_posko || "Posko Wilayah"}</small>
              </div>
            </div>

            <div className="mission-map-wrapper">
              <MapView operational hideCard />
            </div>

            <div className="mission-route-steps">
              <div className="route-checkpoint">
                <span className="checkpoint-dot start" />
                <div>
                  <strong>Markas Logistik {activeMission.organisasi}</strong>
                  <small>Titik Keberangkatan Armada</small>
                </div>
              </div>
              <div className="route-arrow">➔</div>
              <div className="route-checkpoint">
                <span className="checkpoint-dot finish" />
                <div>
                  <strong>{activeMission.posko?.nama_posko || "Posko Penerima"}</strong>
                  <small>Titik Penyerahan Logistik ({activeMission.estimasi_waktu || "2,4 km"})</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: WORKFLOW STEPPER & ACTIONS */}
        <aside className="responder-mission-side">
          {/* Coordinator Card */}
          <div className="mission-coordinator-card">
            <span className="eyebrow">Koordinator Posko Wilayah</span>
            <div className="coordinator-profile">
              <div className="coord-avatar">
                {(activeMission.posko?.penanggung_jawab_nama || "SR").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <strong>{activeMission.posko?.penanggung_jawab_nama || "Siti Rahma"}</strong>
                <small>{activeMission.posko?.nama_posko || "Koordinator Posko Wilayah"}</small>
              </div>
            </div>
            <a href={`tel:${activeMission.posko?.telepon || "+6281288991102"}`} className="btn-call-coord">
              <Icon name="user" /> Hubungi Posko ({activeMission.posko?.telepon || "+62 812••••1102"})
            </a>
          </div>

          {/* 3-Step Workflow Pipeline Card */}
          <div className="mission-workflow-card">
            <h3>Tahapan Operasional Lapangan</h3>
            <p className="workflow-sub">Perbarui tahapan secara berkala saat armada bergerak menuju posko penampung</p>

            <div className="mission-pipeline">
              {states.map((x, i) => {
                const isStepDone = i < idx || (idx === 2 && (isArrived || isCompleted));
                const isStepActive = i === idx && !isArrived && !isCompleted;
                return (
                  <div className={`pipeline-step ${isStepDone ? "done" : ""} ${isStepActive ? "active" : ""}`} key={x}>
                    <div className="step-indicator-circle">
                      {isStepDone ? <Icon name="check" /> : i + 1}
                    </div>
                    <div className="step-label-group">
                      <strong>{x}</strong>
                      <small>{isStepDone ? "Selesai" : isStepActive ? "Sedang Berlangsung" : "Menunggu"}</small>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="workflow-action-area">
              {isCompleted ? (
                <div className="mission-completed-banner" style={{ background: "#eef6f0", border: "1px solid #b2d7bb", padding: "16px", borderRadius: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#013220", fontWeight: 700, marginBottom: "4px" }}>
                    <Icon name="check" /> Misi Penyaluran Selesai Tuntas
                  </div>
                  <small style={{ color: "#48554a", lineHeight: 1.4, display: "block" }}>
                    Bantuan telah diterima tuntas oleh warga/posko dan kasus resmi terselesaikan di sistem.
                  </small>
                </div>
              ) : isArrived ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div className="mission-completed-banner" style={{ background: "#eef6f0", border: "1px solid #b2d7bb", padding: "16px", borderRadius: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#013220", fontWeight: 700, marginBottom: "4px" }}>
                      <Icon name="check" /> Bantuan Telah Diserahkan di Lokasi
                    </div>
                    <small style={{ color: "#48554a", lineHeight: 1.4, display: "block" }}>
                      Menunggu verifikasi tanda terima oleh Warga / Koordinator Posko untuk penyelesaian kasus resmi (RESOLVED).
                    </small>
                  </div>
                  <Button onClick={handleConfirmFinalReceipt} disabled={isAdvancing} style={{ width: "100%", background: "#16a34a", borderColor: "#16a34a" }}>
                    <Icon name="check" /> {isAdvancing ? "Memproses..." : "Konfirmasi Penerimaan Tuntas"}
                  </Button>
                </div>
              ) : (
                <Button onClick={handleAdvance} disabled={isAdvancing} className="btn-advance-mission">
                  {isAdvancing ? "Memperbarui Tahapan..." : actions[idx]} <Icon name="next" />
                </Button>
              )}
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}

function Notifications({ 
  role, 
  open, 
  state, 
  update, 
  setPage 
}: { 
  role: Role; 
  open: () => void; 
  state?: SharedState; 
  update?: RouterProps["update"]; 
  setPage?: RouterProps["setPage"]; 
}) {
  const [filter, setFilter] = useState("Semua");
  const [dbLogs, setDbLogs] = useState<any[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("reksa_read_notifications");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Sync read notification IDs across components
  useEffect(() => {
    const handleSync = () => {
      try {
        const saved = localStorage.getItem("reksa_read_notifications");
        setReadNotifIds(saved ? JSON.parse(saved) : []);
      } catch {}
    };
    window.addEventListener("reksa_notifications_updated", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("reksa_notifications_updated", handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Fetch real-time logs from backend database
  useEffect(() => {
    let isMounted = true;
    const fetchLogs = () => {
      apiService.getActivityLogs()
        .then((res) => {
          if (isMounted && res.success && Array.isArray(res.data)) {
            setDbLogs(res.data);
          }
        })
        .catch(() => {});
    };

    fetchLogs();
    const interval = setInterval(fetchLogs, 5000);
    return () => { 
      isMounted = false; 
      clearInterval(interval);
    };
  }, [state?.logs]);

  // Compute live notifications directly from database logs and user actions
  const computeLiveNotifications = () => {
    const list: {
      id: string;
      title: string;
      desc: string;
      time: string;
      code: string;
      cat: "Pengiriman" | "Verifikasi" | "Penugasan" | "Laporan";
      unread: boolean;
      caseId: string;
    }[] = [];

    // 1. Backend database activity logs (Real persistent log events)
    dbLogs.forEach((dbLog, idx) => {
      const code = dbLog.kebutuhan?.kode_kasus || `RK-2026-00${dbLog.kebutuhan_id || 124}`;
      const aksi = dbLog.aksi || "Pembaruan Kasus";
      let cat: "Pengiriman" | "Verifikasi" | "Penugasan" | "Laporan" = "Verifikasi";
      let title = aksi;

      if (aksi.includes("Klarifikasi")) {
        cat = "Verifikasi";
        title = aksi.includes("Jawaban") ? "Jawaban Klarifikasi Dikirim" : "Permintaan Klarifikasi Posko BPBD";
      } else if (aksi.includes("Tolak") || aksi.includes("Ditolak")) {
        cat = "Verifikasi";
        title = "Laporan Kebutuhan Ditolak";
      } else if (aksi.includes("Kirim") || aksi.includes("Penyaluran") || aksi.includes("Selesai") || aksi.includes("Konfirmasi")) {
        cat = "Pengiriman";
        title = aksi.includes("Selesai") || aksi.includes("Konfirmasi") ? "Bantuan Berhasil Diterima" : "Armada Penyaluran Berangkat";
      } else if (aksi.includes("Verifikasi") || aksi.includes("Persetujuan")) {
        cat = "Verifikasi";
        title = "Verifikasi & Validasi Posko";
      } else if (aksi.includes("Masuk") || aksi.includes("Laporan")) {
        cat = "Laporan";
        title = "Laporan Kebutuhan Masuk";
      } else {
        cat = "Penugasan";
        title = "Alokasi Logistik Disiapkan";
      }

      const notifId = `db-log-${dbLog.id || idx}`;
      list.push({
        id: notifId,
        title,
        desc: dbLog.deskripsi,
        time: new Date(dbLog.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
        code,
        cat,
        unread: !readNotifIds.includes(notifId),
        caseId: code,
      });
    });

    // 2. Real-time session actions (only if new actions performed in current session)
    if (state?.logs && state.logs.length > 0) {
      state.logs.forEach((logText, idx) => {
        const timeAgo = idx === 0 ? "Baru saja" : `${idx * 5} menit lalu`;
        let cat: "Pengiriman" | "Verifikasi" | "Penugasan" | "Laporan" = "Verifikasi";
        let title = "Pembaruan Kasus";
        let code = state.activeCaseId || "RK-2026-00272";

        const matchCode = logText.match(/RK-\d{4}-\d{5}/);
        if (matchCode) code = matchCode[0];

        if (
          logText.toLowerCase().includes("kirim") || 
          logText.toLowerCase().includes("distribusi") || 
          logText.toLowerCase().includes("diterima") || 
          logText.toLowerCase().includes("selesai") ||
          logText.toLowerCase().includes("resolved")
        ) {
          cat = "Pengiriman";
          title = logText.toLowerCase().includes("selesai") || logText.toLowerCase().includes("diterima") || logText.toLowerCase().includes("resolved")
            ? "Bantuan Selesai Diserahkan" 
            : "Armada Distribusi Bergerak";
        } else if (
          logText.toLowerCase().includes("verifikasi") || 
          logText.toLowerCase().includes("disetujui") || 
          logText.toLowerCase().includes("bursa")
        ) {
          cat = "Verifikasi";
          title = "Verifikasi & Persetujuan Posko";
        } else if (
          logText.toLowerCase().includes("tugas") || 
          logText.toLowerCase().includes("mitra") || 
          logText.toLowerCase().includes("alokasi")
        ) {
          cat = "Penugasan";
          title = "Penetapan Alokasi Bantuan";
        } else if (
          logText.toLowerCase().includes("laporan") || 
          logText.toLowerCase().includes("dibuat") ||
          logText.toLowerCase().includes("diajukan")
        ) {
          cat = "Laporan";
          title = "Laporan Kebutuhan Masuk";
        }

        const notifId = `live-log-${idx}-${logText.slice(0, 20)}`;
        list.push({
          id: notifId,
          title,
          desc: logText,
          time: timeAgo,
          code,
          cat,
          unread: !readNotifIds.includes(notifId),
          caseId: code,
        });
      });
    }

    // Deduplicate items
    const seen = new Set<string>();
    return list.filter((item) => {
      const key = `${item.code}-${item.title}-${item.desc.slice(0, 30)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const allNotifications = computeLiveNotifications();
  const unreadCount = allNotifications.filter((x) => x.unread).length;
  const items = allNotifications.filter((x) => filter === "Semua" || x.cat === filter);

  const markAsRead = (id: string) => {
    if (!readNotifIds.includes(id)) {
      const next = [...readNotifIds, id];
      setReadNotifIds(next);
      localStorage.setItem("reksa_read_notifications", JSON.stringify(next));
      window.dispatchEvent(new Event("reksa_notifications_updated"));
    }
  };

  const handleMarkAllAsRead = () => {
    const allIds: string[] = [];
    dbLogs.forEach((dbLog, idx) => {
      allIds.push(`db-log-${dbLog.id || idx}`);
    });
    if (state?.logs) {
      state.logs.forEach((logText, idx) => {
        allIds.push(`live-log-${idx}-${logText.slice(0, 20)}`);
      });
    }
    allNotifications.forEach((n) => allIds.push(n.id));
    const combined = Array.from(new Set([...readNotifIds, ...allIds]));
    setReadNotifIds(combined);
    localStorage.setItem("reksa_read_notifications", JSON.stringify(combined));
    window.dispatchEvent(new Event("reksa_notifications_updated"));
  };

  const handleOpenCase = (notifId: string, caseId?: string) => {
    markAsRead(notifId);
    if (caseId && update) {
      update({ activeCaseId: caseId });
    }
    if (setPage) {
      setPage("case");
    } else {
      open();
    }
  };

  return (
    <main className="workspace notifications-workspace">
      <PageHead 
        eyebrow="Pusat Pemberitahuan" 
        title="Notifikasi &amp; Pembaruan" 
        copy="Daftar aktivitas penanganan bantuan dan verifikasi posko terkini." 
        action={
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {unreadCount > 0 && (
              <button 
                type="button" 
                className="btn-mark-all-read" 
                onClick={handleMarkAllAsRead}
                title="Tandai semua notifikasi telah dibaca"
              >
                <Icon name="check" /> Tandai Semua Dibaca
              </button>
            )}
            <div className="trust-badge" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <span className="live-indicator-dot" /> {unreadCount > 0 ? `${unreadCount > 99 ? "99+" : unreadCount} Belum Dibaca` : "Semua Terbaca"}
            </div>
          </div>
        }
      />

      <div className="notif-top-bar">
        <div className="cases-pill-filters">
          {["Semua", "Pengiriman", "Verifikasi", "Penugasan", "Laporan"].map((cat) => (
            <button
              key={cat}
              type="button"
              className={`case-filter-btn ${filter === cat ? "active" : ""}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="notif-inbox-list">
        {items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", background: "#f5f4ef", borderRadius: "16px", color: "#80866e" }}>
            <Icon name="bell" />
            <p style={{ marginTop: "10px", fontWeight: 600 }}>Belum ada notifikasi pada kategori ini.</p>
          </div>
        ) : (
          items.map((x) => (
            <div 
              className={`notif-inbox-card ${x.unread ? "unread" : ""}`} 
              key={x.id}
              onClick={() => markAsRead(x.id)}
            >
              <div className={`notif-inbox-avatar ${x.unread ? "new" : ""}`}>
                <Icon name="bell" />
                {x.unread && <span className="notif-dot-pulse" />}
              </div>
              <div className="notif-inbox-content">
                <div className="notif-meta-row">
                  <span className="notif-tag">{x.cat}</span>
                  <small>{x.time} · {x.code}</small>
                </div>
                <h3>{x.title}</h3>
                <p>{x.desc}</p>
              </div>
              <button 
                type="button" 
                className="btn-notif-action" 
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCase(x.id, x.caseId);
                }}
              >
                Lihat Kasus <Icon name="next" />
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}

function Profile({ 
  name, 
  role, 
  notify, 
  state, 
  update, 
  setName 
}: { 
  name: string; 
  role: string; 
  notify: (x: string) => void; 
  state?: SharedState; 
  update?: RouterProps["update"]; 
  setName?: (n: string) => void; 
}) {
  const isPosko = role.toLowerCase().includes("posko");
  const isResponder = role.toLowerCase().includes("bpbd") || role.toLowerCase().includes("responder");
  
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(state?.userProfile?.name || name);
  const [email, setEmail] = useState(
    state?.userProfile?.email || (
      isPosko 
        ? "siti.rahma@posko.reksa.id" 
        : isResponder 
          ? "arif.nugroho@bpbd.reksa.id" 
          : `${name.toLowerCase().replace(/\s+/g, ".")}@reksa.id`
    )
  );
  const [phone, setPhone] = useState(
    state?.userProfile?.phone || (isPosko ? "+62 812 8899 1102" : isResponder ? "+62 813 7722 9901" : "+62 812 4455 0188")
  );
  const [nik, setNik] = useState(
    state?.userProfile?.nik || (isPosko ? "PSK-SKB-2026-01" : isResponder ? "RSP-BPBD-9941" : "3202110482910002")
  );
  const [org, setOrg] = useState(
    state?.userProfile?.org || (
      isPosko 
        ? (state?.poskoName || "Posko Induk Penanggulangan Bencana Kab. Sukabumi") 
        : isResponder 
          ? "Satgas Reaksi Cepat BPBD Kab. Sukabumi" 
          : "Warga Wilayah Sukamaju"
    )
  );
  const [address, setAddress] = useState(
    state?.userProfile?.address || (
      isPosko 
        ? (state?.poskoAddress || "Gedung Serbaguna Posko Utama, Jl. Raya Sukabumi No. 42") 
        : isResponder 
          ? "Markas Komando BPBD, Jl. Perintis Kemerdekaan No. 15" 
          : "RT 04 / RW 02, Desa Sukamaju, Kec. Cibadak, Kab. Sukabumi"
    )
  );

  const allCases = state?.casesList ?? [];
  const myCases = allCases.filter((c) => Boolean(c.isOwn && !c.id.startsWith("RK-UJI-") && !c.id.includes("TEST")));

  const totalReports = myCases.length;
  const inVerify = myCases.filter((c) => c.status === "Dalam Verifikasi").length;
  const received = myCases.filter((c) => c.status === "Selesai").length;
  const inDelivery = myCases.filter((c) => c.status === "Dalam Pengiriman" || c.status === "Ditugaskan").length;

  const stats = isPosko
    ? [
        { 
          label: "Laporan Terdata", 
          val: `${allCases.length}`, 
          sub: inVerify > 0 ? `${inVerify} Menunggu verifikasi` : `${allCases.length} Kasus diverifikasi` 
        },
        { 
          label: "Kebutuhan Terbuka", 
          val: `${allCases.filter(c => c.status === "Kebutuhan Terbuka").length}`, 
          sub: "Siap disalurkan mitra" 
        },
        { 
          label: "Tuntas Disalurkan", 
          val: `${allCases.filter(c => c.status === "Selesai").length}`, 
          sub: "Selesai ditangani posko" 
        },
      ]
    : isResponder
      ? [
          { 
            label: "Bursa Terbuka", 
            val: `${allCases.filter(c => c.status === "Kebutuhan Terbuka").length}`, 
            sub: "Kebutuhan siap klaim" 
          },
          { 
            label: "Tugas Penyaluran", 
            val: `${allCases.filter(c => c.status === "Dalam Pengiriman" || c.status === "Ditugaskan").length}`, 
            sub: "Dalam perjalanan armada" 
          },
          { 
            label: "Misi Diselesaikan", 
            val: `${allCases.filter(c => c.status === "Selesai").length}`, 
            sub: "Tuntas diserahkan warga" 
          },
        ]
      : [
          { 
            label: "Laporan Diajukan", 
            val: `${totalReports}`, 
            sub: inVerify > 0 ? `${inVerify} Dalam verifikasi` : totalReports > 0 ? "Semua terverifikasi" : "Belum ada pengajuan" 
          },
          { 
            label: "Bantuan Diterima", 
            val: `${received}`, 
            sub: received > 0 ? "Tuntas diserahterimakan" : inDelivery > 0 ? `${inDelivery} Sedang disalurkan` : "Belum ada penyelesaian" 
          },
          { 
            label: "Status Penanganan", 
            val: totalReports > 0 ? `${Math.round(((received + inDelivery * 0.7 + (totalReports - inVerify) * 0.3) / totalReports) * 100)}%` : "0%", 
            sub: totalReports > 0 ? `${totalReports} Kasus Terdata` : "Siap membuat laporan" 
          },
        ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setEditing(false);
    if (setName) setName(fullName);
    const profileData = {
      name: fullName,
      email,
      phone,
      nik,
      org,
      address,
      role,
    };
    try {
      localStorage.setItem("reksa_user_profile", JSON.stringify(profileData));
    } catch (err) {}

    if (update) {
      update({
        poskoName: isPosko ? org : state?.poskoName,
        poskoPic: isPosko ? fullName : state?.poskoPic,
        poskoPhone: phone,
        poskoAddress: address,
        userProfile: profileData,
      }, `Profil ${role} (${fullName}) berhasil diperbarui dan disinkronkan ke seluruh sistem.`);
    }
    notify("Perubahan profil berhasil disimpan dan disinkronkan ke sistem database!");
  };

  const handleCancel = () => {
    setFullName(state?.userProfile?.name || name);
    setEditing(false);
  };

  const initials = fullName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="workspace profile-workspace">
      <PageHead 
        eyebrow="Identitas &amp; Pengaturan Akun" 
        title="Profil Pengguna" 
        copy="Kelola informasi identitas pribadi, kontak darurat, dan preferensi akun Anda di REKSA." 
        action={
          <button 
            type="button" 
            className={`btn-profile-toggle ${editing ? "cancel" : "edit"}`} 
            onClick={() => (editing ? handleCancel() : setEditing(true))}
          >
            {editing ? (
              <>Batal Edit</>
            ) : (
              <><Icon name="user" /> Edit Profil</>
            )}
          </button>
        }
      />

      {/* HERO PROFILE CARD */}
      <div className="profile-hero-card">
        <div className="profile-hero-avatar-wrap">
          <div className="profile-hero-avatar">{initials}</div>
          <span className="profile-avatar-badge" title="Akun Terverifikasi">
            <Icon name="check" />
          </span>
        </div>

        <div className="profile-hero-meta">
          <div className="profile-hero-name-row">
            <h2>{fullName}</h2>
            <Pill tone={isPosko ? "high" : isResponder ? "done" : "neutral"}>
              {role}
            </Pill>
            <span className="profile-verified-badge">
              <Icon name="check" /> Terverifikasi Resmi
            </span>
          </div>
          <p className="profile-hero-org">{org}</p>
          <div className="profile-hero-tags">
            <span className="profile-hero-tag">
              <Icon name="pin" /> {address.split(",")[0]}
            </span>
            <span className="profile-hero-tag">
              <Icon name="file" /> ID: {nik}
            </span>
            <span className="profile-hero-tag">
              <Icon name="clock" /> Bergabung Jan 2026
            </span>
          </div>
        </div>
      </div>

      {/* ROLE PERFORMANCE / SUMMARY STATS */}
      <div className="profile-stats-grid">
        {stats.map((s) => (
          <div className="profile-stat-box" key={s.label}>
            <span className="profile-stat-label">{s.label}</span>
            <strong className="profile-stat-val">{s.val}</strong>
            <small className="profile-stat-sub">{s.sub}</small>
          </div>
        ))}
      </div>

      {/* PROFILE DETAILS / EDIT FORM */}
      <form onSubmit={handleSave} className="profile-form-layout">
        <div className="profile-sections-grid">
          {/* SECTION 1: INFORMASI PRIBADI & KONTAK */}
          <div className="profile-panel-card">
            <div className="profile-panel-header">
              <div className="panel-header-icon">
                <Icon name="user" />
              </div>
              <div>
                <h3>Informasi Pribadi &amp; Kontak</h3>
                <p>Data identitas resmi untuk keperluan verifikasi dan koordinasi</p>
              </div>
            </div>

            <div className="profile-inputs-grid">
              <div className="form-group">
                <label className="form-label">Nama Lengkap</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={fullName} 
                  disabled={!editing} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {isPosko ? "Nomor Registrasi Posko (NIP/ID)" : isResponder ? "ID Relawan / Satgas" : "Nomor Induk Kependudukan (NIK)"}
                </label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={nik} 
                  disabled={!editing} 
                  onChange={(e) => setNik(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alamat Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={email} 
                  disabled={!editing} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nomor WhatsApp / Telepon Aktif</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={phone} 
                  disabled={!editing} 
                  onChange={(e) => setPhone(e.target.value)} 
                  required
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: WILAYAH & LEMBAGA */}
          <div className="profile-panel-card">
            <div className="profile-panel-header">
              <div className="panel-header-icon">
                <Icon name="pin" />
              </div>
              <div>
                <h3>Wilayah &amp; Instansi</h3>
                <p>Lokasi posko, wilayah penugasan, atau domisili kependudukan</p>
              </div>
            </div>

            <div className="profile-inputs-grid">
              <div className="form-group full-width">
                <label className="form-label">Nama Instansi / Kelompok / Komunitas</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={org} 
                  disabled={!editing} 
                  onChange={(e) => setOrg(e.target.value)} 
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Alamat Lengkap Domisili / Posko Operasional</label>
                <textarea 
                  className="form-control textarea" 
                  rows={2} 
                  value={address} 
                  disabled={!editing} 
                  onChange={(e) => setAddress(e.target.value)} 
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: KEAMANAN & INTEGRASI */}
          <div className="profile-panel-card full-width">
            <div className="profile-panel-header">
              <div className="panel-header-icon">
                <Icon name="check" />
              </div>
              <div>
                <h3>Status Keamanan &amp; Verifikasi Sistem</h3>
                <p>Jaminan privasi data dan perlindungan enkripsi REKSA</p>
              </div>
            </div>

            <div className="security-badges-row">
              <div className="security-badge-item">
                <div className="sec-dot active" />
                <div>
                  <strong>Identitas &amp; Data Kependudukan Terverifikasi</strong>
                  <small>Tervalidasi di sistem REKSA · ID: {nik}</small>
                </div>
              </div>
              <div className="security-badge-item">
                <div className="sec-dot active" />
                <div>
                  <strong>Kontak Darurat &amp; Notifikasi Aktif</strong>
                  <small>Nomor terhubung: {phone}</small>
                </div>
              </div>
              <div className="security-badge-item">
                <div className="sec-dot active" />
                <div>
                  <strong>Sesi Akun Aktif</strong>
                  <small>Role {role} · Sinkron database posko</small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SAVE CHANGES ACTIONS FOOTER */}
        {editing && (
          <div className="profile-save-bar">
            <div className="profile-save-info">
              <Icon name="check" />
              <span>Pastikan data nomor telepon dan email aktif untuk notifikasi bantuan.</span>
            </div>
            <div className="profile-save-buttons">
              <Button type="button" variant="secondary" onClick={handleCancel}>
                Batal
              </Button>
              <Button type="submit" className="btn-profile-submit">
                Simpan Perubahan <Icon name="check" />
              </Button>
            </div>
          </div>
        )}
      </form>
    </main>
  );
}

function Settings({ notify }: { notify: (x: string) => void }) {
  const [prefs, setPrefs] = useState([true, true, true, false]);
  const labels = ["Notifikasi email", "Notifikasi dalam aplikasi", "Pembaruan pengiriman", "Pembaruan sistem"];
  return <main className="workspace narrow-page"><PageHead eyebrow="Preferensi akun" title="Pengaturan" copy="Atur notifikasi dan kenyamanan tampilan." /><section className="settings-group"><h2>Notifikasi</h2>{labels.map((x, i) => <label className="switch-row" key={x}><span><b>{x}</b><small>{i === 2 ? "Perubahan status bantuan dan penyerahan." : "Informasi penting dari REKSA."}</small></span><input type="checkbox" checked={prefs[i]} onChange={() => setPrefs(prefs.map((v, n) => n === i ? !v : v))} /></label>)}</section><section className="settings-group"><h2>Kerapatan tampilan</h2><div className="filters"><button className="active" onClick={() => notify("Tampilan nyaman diterapkan.")}>Nyaman</button><button onClick={() => notify("Tampilan ringkas diterapkan.")}>Ringkas</button></div></section><Button onClick={() => notify("Pengaturan berhasil disimpan.")}>Simpan Pengaturan</Button></main>;
}

function Help() {
  const [open, setOpen] = useState(0);
  const faqs = [["Bagaimana cara melaporkan kebutuhan?", "Pilih Laporkan Kebutuhan, isi lokasi umum, skala kebutuhan, dan bukti pendukung."], ["Bagaimana cara melihat status laporan?", "Buka Laporan Saya lalu pilih kasus untuk melihat progres dan aktivitas."], ["Siapa yang memverifikasi laporan?", "Petugas Posko setempat memeriksa informasi sebelum kebutuhan diprioritaskan."], ["Bagaimana bantuan dialokasikan?", "Posko menggabungkan sumber daya dari organisasi terverifikasi sesuai kebutuhan."], ["Apa yang terjadi setelah bantuan diserahkan?", "Masyarakat diminta mengonfirmasi penerimaan sebelum kasus ditutup."]];
  return <main className="workspace narrow-page"><PageHead eyebrow="Pusat bantuan" title="Bagaimana kami dapat membantu?" copy="Jawaban singkat tentang alur layanan REKSA." /><div className="faq">{faqs.map(([q, a], i) => <button onClick={() => setOpen(open === i ? -1 : i)} key={q}><span><b>{q}</b><i>{open === i ? "−" : "+"}</i></span>{open === i && <p>{a}</p>}</button>)}</div></main>;
}

function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const pTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(pTimer);
          return 100;
        }
        return prev + 3;
      });
    }, 60);

    const fadeTimer = setTimeout(() => {
      setFading(true);
    }, 2400);

    const finishTimer = setTimeout(() => {
      onFinish();
    }, 2900);

    return () => {
      clearInterval(pTimer);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <aside className={`splash-screen ${fading ? "splash-fading" : ""}`} aria-label="Layar Pembuka REKSA">
      <div className="splash-ambient-glow" />
      <div className="splash-grid-pattern" />
      
      <div className="splash-center">
        {/* Unified R-Logo + EKSA Lockup */}
        <div className="splash-brand-lockup">
          <div className="splash-logo-wrap">
            <div className="splash-pulse-ring" />
            <svg className="splash-logo-svg" viewBox="0 0 42 42" aria-hidden="true">
              <path className="splash-path path-1" d="M7 7h16c7 0 12 4 12 10s-5 10-12 10H7V7Z" />
              <path className="splash-path path-2" d="M18 27 35 38M7 20h17" />
              <circle className="splash-circle circle-1" cx="8" cy="7" r="3.2" />
              <circle className="splash-circle circle-2" cx="35" cy="38" r="3.2" />
            </svg>
          </div>

          <div className="splash-word-item" aria-label="EKSA">
            <span className="splash-letter" style={{ animationDelay: "0.95s" }}>E</span>
            <span className="splash-letter" style={{ animationDelay: "1.05s" }}>K</span>
            <span className="splash-letter" style={{ animationDelay: "1.15s" }}>S</span>
            <span className="splash-letter" style={{ animationDelay: "1.25s" }}>A</span>
          </div>
        </div>

        <p className="splash-subtitle">Ruang Ekosistem Kolaborasi Pascabencana</p>

        <div className="splash-progress-container">
          <div className="splash-progress-bar" style={{ width: `${progress}%` }} />
        </div>
        <span className="splash-status-note">
          {progress < 40 ? "Menghubungkan Ekosistem..." : progress < 85 ? "Menyiapkan Ruang Kolaborasi..." : "Selamat Datang di REKSA"}
        </span>
      </div>

      <button className="splash-skip-btn" onClick={onFinish} aria-label="Lewati splash screen">
        Lewati <Icon name="arrow" />
      </button>
    </aside>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>(() => {
    const saved = localStorage.getItem("reksa_auth_screen") as Screen;
    if (saved && (saved === "home" || saved === "login" || saved === "portal")) {
      return saved;
    }
    return "portal";
  });

  const [showSplash, setShowSplash] = useState(() => {
    const hasVisited = sessionStorage.getItem("reksa_session_active");
    if (hasVisited) return false;
    sessionStorage.setItem("reksa_session_active", "true");
    const savedScreen = localStorage.getItem("reksa_auth_screen");
    if (savedScreen === "portal" || !savedScreen) return false;
    return true;
  });

  const [role, setRole] = useState<Role>(() => {
    const saved = localStorage.getItem("reksa_auth_role") as Role;
    if (saved && (saved === "citizen" || saved === "posko" || saved === "responder")) {
      return saved;
    }
    return "citizen";
  });

  const [name, setName] = useState(() => {
    const saved = localStorage.getItem("reksa_auth_name");
    if (saved) return saved;
    return "Andi Pratama";
  });
  const [state, setState] = useState<SharedState>(() => {
    let savedList: CaseRecord[] = [];
    const local = localStorage.getItem("reksa_cases_db");

    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          const reportedIds = getUserReportedIds();
          savedList = parsed
            .filter((c: any) => 
              c.id !== "RK-2026-00272" && 
              c.item !== "Sanitasi" &&
              !c.id.startsWith("RK-UJI-") &&
              !c.id.includes("TEST") &&
              !c.id.startsWith("RK-MULTI-") &&
              !c.id.startsWith("RK-AIR-") &&
              !c.id.startsWith("RK-BERAS-") &&
              !c.id.startsWith("RK-LOG-") &&
              !c.id.startsWith("RK-AUTH-")
            )
            .map((c: any) => ({
              ...c,
              isOwn: Boolean(reportedIds.includes(c.id) || (c.isOwn && !c.id.startsWith("RK-UJI-") && !c.id.includes("TEST"))),
            }));
          localStorage.setItem("reksa_cases_db", JSON.stringify(savedList));
        }
      } catch (e) {}
    }

    let savedProfile = {
      name: "Andi Pratama",
      email: "andi.masyarakat@reksa.id",
      phone: "+62 812 4455 0188",
      nik: "3202110482910002",
      org: "Warga Wilayah Surabaya",
      address: "Jl. Pemuda No. 1, Kec. Gubeng, Kota Surabaya, Jawa Timur",
      role: "Masyarakat",
    };
    const localProfile = localStorage.getItem("reksa_user_profile");
    if (localProfile) {
      try {
        const parsedP = JSON.parse(localProfile);
        if (parsedP && typeof parsedP === "object") {
          savedProfile = { ...savedProfile, ...parsedP };
        }
      } catch (e) {}
    }

    return {
      status: "Dalam Verifikasi", 
      priority: "Kritis", 
      allocated: 0, 
      delivered: 700, 
      assignment: "Baru", 
      logs: [],
      poskoName: "Posko BPBD Provinsi Jawa Timur (Komando Wilayah)",
      poskoPic: "Siti Rahma",
      poskoPhone: "+62 812 8899 1102",
      poskoAddress: "Jl. Pemuda No. 1, Kota Surabaya",
      userProfile: savedProfile,
      casesList: savedList,
      activeCaseId: savedList[0]?.id,
    };
  });

  // Fetch real database records from Laravel API on load & synchronize strictly 1-to-1
  const fetchDatabaseCases = useCallback(async () => {
    try {
      const res = await apiService.getKebutuhan();

      if (res.success && Array.isArray(res.data)) {
        setState((prev) => {
          const prevCasesMap = new Map((prev.casesList || []).map((c) => [c.id, c]));
          const reportedIds = getUserReportedIds();

          const dbCases: CaseRecord[] = res.data
            .filter((item: any) => {
              const code = item.kode_kasus || `RK-2026-00${item.id}`;
              return !code.startsWith("RK-UJI-") && !code.includes("TEST");
            })
            .map((item) => {
              const poskoInfo = item.posko;
              const v = (item.desa || poskoInfo?.desa || "Surabaya").trim();
              const d = (item.kecamatan || poskoInfo?.kecamatan || "").trim();
              let k = (item.kabupaten || poskoInfo?.kabupaten || "Kota Surabaya").trim();
              const p = (item.provinsi || poskoInfo?.provinsi || "Jawa Timur").trim();

              if (k.toLowerCase() === v.toLowerCase() && d && d.toLowerCase().includes("sidoarjo")) {
                k = "Kabupaten Sidoarjo";
              }

              const addrParts: string[] = [];
              if (v) addrParts.push(v.toLowerCase().startsWith("desa") || v.toLowerCase().startsWith("kel") || v.toLowerCase().startsWith("jalan") || v.toLowerCase().startsWith("jl") ? v : `Desa/Kel. ${v}`);
              if (d) addrParts.push(d.toLowerCase().startsWith("kec") ? d : `Kec. ${d}`);
              if (k) addrParts.push(k.toLowerCase().startsWith("kab") || k.toLowerCase().startsWith("kota") ? k : `Kab. ${k}`);
              if (p) addrParts.push(p.toLowerCase().startsWith("prov") ? p : `Prov. ${p}`);
              const locStr = addrParts.length > 0 ? addrParts.join(", ") : (d ? `${v}, Kec. ${d}` : `${v}, ${k}`);
              const caseCode = item.kode_kasus || `RK-2026-00${item.id}`;
              const localCase = prevCasesMap.get(caseCode);
              const resolvedFoto = (item.foto_bukti && item.foto_bukti !== "null") ? item.foto_bukti : (localCase?.fotoBukti || undefined);

              const isDummy = 
                caseCode.startsWith("RK-UJI-") || 
                caseCode.includes("TEST") || 
                caseCode.startsWith("RK-MULTI-") ||
                caseCode.startsWith("RK-AIR-") ||
                caseCode.startsWith("RK-BERAS-") ||
                
                caseCode.startsWith("RK-LOG-") ||
                caseCode.startsWith("RK-AUTH-");

              const currentUserName = prev.userProfile?.name ? prev.userProfile.name.toLowerCase().trim() : "";
              const isUserOwnReport = !isDummy && (
                reportedIds.includes(caseCode) || 
                (localCase?.isOwn === true && !localCase?.id?.startsWith("RK-UJI-")) ||
                Boolean(currentUserName && item.citizen_name && item.citizen_name.toLowerCase().trim() === currentUserName)
              );

              if (isUserOwnReport) {
                addUserReportedId(caseCode);
              }

              return {
                id: caseCode,
                rawId: item.id,
                item: item.kategori_kebutuhan || "Kebutuhan Darurat",
                location: locStr,
                kk: `${item.jumlah_kk || 1} KK`,
                qty: item.volume_permintaan || "1 Paket",
                urgency: item.tingkat_urgensi || "Sedang",
                status: item.status || "Dalam Verifikasi",
                isOwn: isUserOwnReport,
                notes: item.deskripsi || item.catatan_verifikasi_posko || `Kebutuhan ${item.kategori_kebutuhan} untuk warga terdampak.`,
                date: new Date(item.created_at || Date.now()).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }),
                posko: poskoInfo?.nama_posko || "Posko BPBD Provinsi Jawa Timur (Komando Wilayah)",
                applicantNik: "3202110482910002",
                applicantName: item.citizen_name || "Andi Pratama",
                applicantPhone: item.citizen_phone || "+62 812 4455 0188",
                shelterStatus: item.status_hunian || "Rumah Tinggal Pribadi (Terdampak Langsung)",
                province: p,
                regency: k,
                district: d || "",
                village: v,
                lat: item.latitude ? Number(item.latitude) : (poskoInfo?.latitude ? Number(poskoInfo.latitude) : -7.2654),
                lng: item.longitude ? Number(item.longitude) : (poskoInfo?.longitude ? Number(poskoInfo.longitude) : 112.7521),
                fotoBukti: resolvedFoto,
                fileName: undefined,
                vulnerableDetails: item.vulnerable_group ? "Kelompok Rentan" : "Tidak ada",
                crisisDuration: "6 - 24 Jam Pasca Bencana",
                roadAccess: "Dapat dilalui kendaraan distribusi logistik",
                urgencyScore: item.tingkat_urgensi === "Kritis" ? 90 : item.tingkat_urgensi === "Tinggi" ? 75 : 50,
                priorityRationale: item.priority_rationale || `Kebutuhan ${item.kategori_kebutuhan} untuk ${item.jumlah_kk || 1} KK.`,
                createdAtTime: new Date(item.created_at || Date.now()).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }).replace(".", ":") + " WIB",
                createdAtRaw: item.created_at,
                verifiedAtRaw: item.verified_at,
                completedAtRaw: item.completed_at,
                updatedAtRaw: item.updated_at,
                affectedPeople: localCase?.affectedPeople,
                vulnerableGroupsList: localCase?.vulnerableGroupsList,
                availabilityCondition: localCase?.availabilityCondition,
                citizenUrgency: localCase?.citizenUrgency || item.tingkat_urgensi,
                conditionDescription: localCase?.conditionDescription,
                pertanyaanKlarifikasi: item.pertanyaan_klarifikasi,
                kategoriKlarifikasi: item.kategori_klarifikasi,
                memintaLampiran: item.meminta_lampiran,
                fotoKlarifikasi: item.foto_klarifikasi,
                riwayatKlarifikasi: item.riwayat_klarifikasi,
                jawabanKlarifikasi: item.jawaban_klarifikasi,
                alasanPenolakan: item.alasan_penolakan,
                tindakLanjutPenolakan: item.tindak_lanjut_penolakan,
                catatanVerifikasiPosko: item.catatan_verifikasi_posko,
                totalAlokasiResmi: item.total_alokasi_resmi,
                totalDiterimaResmi: item.total_diterima_resmi,
              };
            });

          const dbCaseIds = new Set(dbCases.map((c) => c.id));
          const localUserReports = (prev.casesList || []).filter(
            (c) => Boolean(c.isOwn && !c.id.startsWith("RK-UJI-") && !c.id.includes("TEST") && !c.id.startsWith("RK-2026-") && !dbCaseIds.has(c.id))
          );
          const mergedCases = [...localUserReports, ...dbCases];

          // Sinkronkan ID laporan yang valid (hapus ID kasus yang telah terhapus dari server)
          const validReportedIds = getUserReportedIds().filter((id) => dbCaseIds.has(id));
          localStorage.setItem("reksa_user_reported_ids", JSON.stringify(validReportedIds));

          localStorage.setItem("reksa_cases_db", JSON.stringify(mergedCases));
          return {
            ...prev,
            casesList: mergedCases,
            activeCaseId: mergedCases.some((c) => c.id === prev.activeCaseId) ? prev.activeCaseId : mergedCases[0]?.id,
          };
        });
      }
    } catch (e) {
      console.log("Database connection note:", e);
    }
  }, []);

  const fetchDatabaseBursaAndMisi = useCallback(async () => {
    try {
      const [bRes, mRes, pRes] = await Promise.all([
        apiService.getBursa().catch(() => ({ success: false, data: [] as BursaItem[] })),
        apiService.getMisi().catch(() => ({ success: false, data: [] as MisiItem[] })),
        apiService.getPenawaran().catch(() => ({ success: false, data: [] as PenawaranItem[] })),
      ]);
      setState((prev) => {
        const nextBursa = bRes.success && Array.isArray(bRes.data) ? bRes.data : prev.bursaList || [];
        const nextMisi = mRes.success && Array.isArray(mRes.data) ? mRes.data : prev.misiList || [];
        const nextPenawaran = pRes.success && Array.isArray(pRes.data) ? pRes.data : prev.penawaranList || [];

        const activeMission = nextMisi.find((m: MisiItem) => m.status_tahapan !== "Selesai");
        const asgStatus = activeMission ? activeMission.status_tahapan : prev.assignment;

        return {
          ...prev,
          bursaList: nextBursa,
          misiList: nextMisi,
          penawaranList: nextPenawaran,
          assignment: asgStatus,
        };
      });
    } catch (e) {
      console.log("Bursa/Misi sync note:", e);
    }
  }, []);

  const fetchDatabaseAll = useCallback(async () => {
    await Promise.all([
      fetchDatabaseCases(),
      fetchDatabaseBursaAndMisi(),
    ]);
  }, [fetchDatabaseCases, fetchDatabaseBursaAndMisi]);

  useEffect(() => {
    fetchDatabaseAll();
    const interval = setInterval(() => {
      fetchDatabaseAll();
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchDatabaseAll]);

  const update = (changes: Partial<SharedState>, log?: string) => {
    setState((s) => {
      const next = { ...s, ...changes, logs: log ? [log, ...s.logs] : s.logs };
      if (changes.casesList) {
        localStorage.setItem("reksa_cases_db", JSON.stringify(changes.casesList));
      }
      if (changes.activeCaseId) {
        localStorage.setItem("reksa_active_case_id", changes.activeCaseId);
      }
      return next;
    });
  };

  const navigate = (s: Screen) => { 
    setScreen(s); 
    localStorage.setItem("reksa_auth_screen", s);
    window.scrollTo(0, 0); 
  };

  return (
    <>
      {showSplash && <SplashScreen onFinish={() => setShowSplash(false)} />}
      {screen === "login" && <Login navigate={navigate} onLogin={(r, n) => { 
        setRole(r); 
        setName(n); 
        localStorage.setItem("reksa_auth_role", r);
        localStorage.setItem("reksa_auth_name", n);
        if (r === "posko") {
          setState((s) => ({
            ...s,
            userProfile: {
              name: n,
              email: "siti.posko@reksa.id",
              phone: "+62 812 8899 1102",
              nik: "PSK-SKB-2026-01",
              org: "Posko BPBD Provinsi Jawa Timur (Komando Wilayah)",
              address: "Gedung Serbaguna Posko Utama, Jl. Pemuda No. 1, Kota Surabaya",
              role: "Petugas Posko",
            }
          }));
        } else if (r === "responder") {
          setState((s) => ({
            ...s,
            userProfile: {
              name: n,
              email: "arif.bpbd@reksa.id",
              phone: "+62 813 7722 9901",
              nik: "RSP-BPBD-9941",
              org: "Satgas Reaksi Cepat BPBD Wilayah",
              address: "Markas Komando BPBD, Jl. Perintis Kemerdekaan No. 15",
              role: "Mitra Responder",
            }
          }));
        }
        navigate("portal"); 
      }} />}
      {screen === "portal" && (
        <Portal 
          role={role} 
          setRole={(newRole) => {
            setRole(newRole);
            localStorage.setItem("reksa_auth_role", newRole);
            if (newRole === "posko") {
              setName("Siti Rahma");
              localStorage.setItem("reksa_auth_name", "Siti Rahma");
              setState((s) => ({
                ...s,
                userProfile: {
                  name: "Siti Rahma",
                  email: "siti.posko@reksa.id",
                  phone: "+62 812 8899 1102",
                  nik: "PSK-SKB-2026-01",
                  org: "Posko BPBD Provinsi Jawa Timur (Komando Wilayah)",
                  address: "Gedung Serbaguna Posko Utama, Jl. Pemuda No. 1, Kota Surabaya",
                  role: "Petugas Posko",
                }
              }));
            } else if (newRole === "responder") {
              setName("Arif Nugroho");
              localStorage.setItem("reksa_auth_name", "Arif Nugroho");
              setState((s) => ({
                ...s,
                userProfile: {
                  name: "Arif Nugroho",
                  email: "arif.bpbd@reksa.id",
                  phone: "+62 813 7722 9901",
                  nik: "RSP-BPBD-9941",
                  org: "Satgas Reaksi Cepat BPBD Wilayah",
                  address: "Markas Komando BPBD, Jl. Perintis Kemerdekaan No. 15",
                  role: "Mitra Responder",
                }
              }));
            } else {
              setName("Andi Pratama");
              localStorage.setItem("reksa_auth_name", "Andi Pratama");
              setState((s) => ({
                ...s,
                userProfile: {
                  name: "Andi Pratama",
                  email: "andi.masyarakat@reksa.id",
                  phone: "+62 812 4455 0188",
                  nik: "3202110482910002",
                  org: "Warga Wilayah Surabaya",
                  address: "Jl. Pemuda No. 1, Kec. Gubeng, Kota Surabaya, Jawa Timur",
                  role: "Masyarakat",
                }
              }));
            }
          }}
          name={name} 
          setName={(newName) => {
            setName(newName);
            localStorage.setItem("reksa_auth_name", newName);
          }} 
          state={state} 
          update={update} 
          logout={() => {
            localStorage.setItem("reksa_auth_screen", "login");
            localStorage.removeItem("reksa_portal_page");
            navigate("login");
          }} 
          onRefresh={fetchDatabaseAll} 
        />
      )}
      {screen === "home" && <Home navigate={navigate} />}
    </>
  );
}
