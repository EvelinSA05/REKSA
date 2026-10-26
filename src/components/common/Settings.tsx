import React, { useState, useEffect } from "react";
import { AppIcon } from "./Icons";

export interface UserSettings {
  // Notifikasi
  emailNotif: boolean;
  inAppNotif: boolean;
  deliveryUpdateNotif: boolean;
  systemUpdateNotif: boolean;
  bmkgAlertNotif: boolean;
  soundNotif: boolean;

  // Tampilan & Kenyamanan
  density: "comfortable" | "compact";
  fontSize: "normal" | "medium" | "large";
  contrastMode: "normal" | "high_contrast" | "dim";
  animations: "full" | "reduced";

  // Bahasa & Regional
  language: "id" | "en" | "jv";
  timezone: "WIB" | "WITA" | "WIT";
  dateFormat: "DD/MM/YYYY" | "YYYY-MM-DD";

  // Mode Lapangan & Offline
  lowDataMode: boolean;
  autoSync: boolean;

  // Keamanan
  twoFactorAuth: boolean;
}

export const DEFAULT_SETTINGS: UserSettings = {
  emailNotif: true,
  inAppNotif: true,
  deliveryUpdateNotif: true,
  systemUpdateNotif: true,
  bmkgAlertNotif: true,
  soundNotif: true,

  density: "comfortable",
  fontSize: "normal",
  contrastMode: "normal",
  animations: "full",

  language: "id",
  timezone: "WIB",
  dateFormat: "DD/MM/YYYY",

  lowDataMode: false,
  autoSync: true,

  twoFactorAuth: false,
};

// Fungsi menerapkan pengaturan visual secara langsung ke DOM dokumen
export function applyLiveSettings(settings: UserSettings) {
  // 1. Kerapatan Tampilan (Density)
  if (settings.density === "compact") {
    document.body.classList.add("reksa-density-compact");
  } else {
    document.body.classList.remove("reksa-density-compact");
  }

  // 2. Skala Ukuran Huruf (Font Size)
  if (settings.fontSize === "large") {
    document.documentElement.style.fontSize = "18.5px";
  } else if (settings.fontSize === "medium") {
    document.documentElement.style.fontSize = "17.2px";
  } else {
    document.documentElement.style.fontSize = "16px";
  }

  // 3. Mode Kontras & Redup
  document.body.classList.remove("reksa-high-contrast", "reksa-dim-mode");
  if (settings.contrastMode === "high_contrast") {
    document.body.classList.add("reksa-high-contrast");
  } else if (settings.contrastMode === "dim") {
    document.body.classList.add("reksa-dim-mode");
  }

  // 4. Pengurangan Animasi
  if (settings.animations === "reduced") {
    document.body.classList.add("reksa-reduced-motion");
  } else {
    document.body.classList.remove("reksa-reduced-motion");
  }
}

// Fungsi untuk mengambil pengaturan tersimpan dengan aman
export function getSavedSettings(): UserSettings {
  try {
    const saved = localStorage.getItem("reksa_app_settings");
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch {}
  return DEFAULT_SETTINGS;
}

// Nada dering notifikasi Web Audio murni (zero-dependency, native browser)
export function playWebAudioChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.38);
  } catch (err) {
    console.warn("Audio chime play error:", err);
  }
}

interface SettingsProps {
  notify: (msg: string) => void;
  role?: string;
  name?: string;
  update?: any;
}

export function Settings({ notify, role = "Pengguna", name = "Pengguna REKSA" }: SettingsProps) {
  // Muat preferensi dari localStorage atau fallback ke default
  const [settings, setSettings] = useState<UserSettings>(() => getSavedSettings());

  const [activeTab, setActiveTab] = useState<"notifications" | "display" | "regional" | "offline" | "security">("notifications");
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorKey, setTwoFactorKey] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Terapkan efek visual begitu komponen dibuka atau pengaturan berubah
  useEffect(() => {
    applyLiveSettings(settings);
  }, [settings]);

  // Handler toggle nilai boolean
  const handleToggle = (key: keyof UserSettings) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem("reksa_app_settings", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("reksa_settings_updated", { detail: updated }));
      } catch {}
      return updated;
    });

    if (key === "soundNotif" && !settings.soundNotif) {
      playWebAudioChime();
    }

    if (key === "twoFactorAuth" && !settings.twoFactorAuth) {
      const key2fa = `RK-2FA-${Math.floor(100000 + Math.random() * 900000)}`;
      setTwoFactorKey(key2fa);
      setShowTwoFactorModal(true);
    }
  };

  // Handler update nilai string/enum
  const handleSelect = <K extends keyof UserSettings>(key: K, val: UserSettings[K]) => {
    setSettings((prev) => {
      const updated = { ...prev, [key]: val };
      try {
        localStorage.setItem("reksa_app_settings", JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("reksa_settings_updated", { detail: updated }));
      } catch {}
      return updated;
    });
  };

  // Simpan seluruh konfigurasi secara eksplisit
  const handleSaveAll = () => {
    try {
      localStorage.setItem("reksa_app_settings", JSON.stringify(settings));
      applyLiveSettings(settings);
      window.dispatchEvent(new CustomEvent("reksa_settings_updated", { detail: settings }));
      setIsSavedFeedback(true);
      setTimeout(() => setIsSavedFeedback(false), 2500);
      notify("Pengaturan preferensi berhasil disimpan dan aktif diterapkan.");
    } catch {
      notify("Gagal menyimpan ke penyimpanan lokal.");
    }
  };

  // Reset ke pengaturan pabrik
  const handleResetDefault = () => {
    if (window.confirm("Kembalikan seluruh pengaturan tampilan dan notifikasi ke setelan awal default?")) {
      setSettings(DEFAULT_SETTINGS);
      try {
        localStorage.setItem("reksa_app_settings", JSON.stringify(DEFAULT_SETTINGS));
        window.dispatchEvent(new CustomEvent("reksa_settings_updated", { detail: DEFAULT_SETTINGS }));
      } catch {}
      applyLiveSettings(DEFAULT_SETTINGS);
      notify("Pengaturan telah dikembalikan ke standar awal.");
    }
  };

  // Bersihkan cache sementara
  const handleClearCache = () => {
    try {
      sessionStorage.clear();
      // Bersihkan cache query sementara tanpa menghapus sesi login dan profil
      localStorage.removeItem("reksa_cached_activity_logs");
      notify("Cache tampilan dan riwayat sementara berhasil dibersihkan.");
    } catch {
      notify("Cache lokal telah disegarkan.");
    }
  };

  // Ekspor cadangan JSON
  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `reksa_pengaturan_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      notify("Cadangan konfigurasi berhasil diunduh.");
    } catch {
      notify("Gagal mengekspor file cadangan.");
    }
  };

  // Impor pulihkan cadangan JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (typeof parsed === "object" && parsed !== null) {
          const merged = { ...DEFAULT_SETTINGS, ...parsed };
          setSettings(merged);
          localStorage.setItem("reksa_app_settings", JSON.stringify(merged));
          applyLiveSettings(merged);
          window.dispatchEvent(new CustomEvent("reksa_settings_updated", { detail: merged }));
          notify("Pengaturan berhasil dipulihkan dari file cadangan!");
        } else {
          notify("Format file JSON tidak sesuai.");
        }
      } catch {
        notify("Gagal membaca file cadangan JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // Submit ganti password
  const handleSubmitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");

    const currentSavedPass = localStorage.getItem("reksa_user_password");
    if (currentSavedPass && oldPassword !== currentSavedPass) {
      setPasswordError("Kata sandi lama yang Anda masukkan tidak sesuai.");
      return;
    }
    if (!oldPassword) {
      setPasswordError("Kata sandi lama wajib diisi.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Konfirmasi kata sandi tidak cocok dengan sandi baru.");
      return;
    }

    try {
      localStorage.setItem("reksa_user_password", newPassword);
      localStorage.setItem("reksa_password_updated_at", new Date().toISOString());
    } catch {}

    // Sukses
    setPasswordSuccess(true);
    setTimeout(() => {
      setPasswordSuccess(false);
      setShowPasswordModal(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify("Kata sandi akun Anda berhasil diperbarui dan tersimpan aman.");
    }, 1200);
  };

  return (
    <main className="workspace settings-workspace" style={{ maxWidth: "1080px", margin: "0 auto", padding: "28px 24px" }}>
      {/* HEADER SECTION */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <span className="eyebrow" style={{ color: "#80866e", fontWeight: 700, letterSpacing: "0.06em", fontSize: "0.8rem", textTransform: "uppercase" }}>
            PREFERENSI AKUN &amp; SISTEM
          </span>
          <h1 style={{ margin: "4px 0 6px", color: "#013220", fontSize: "1.85rem", fontWeight: 800 }}>
            Pengaturan Aplikasi
          </h1>
          <p style={{ margin: 0, color: "#64748b", fontSize: "0.94rem", maxWidth: "680px", lineHeight: 1.5 }}>
            Atur preferensi notifikasi darurat, kenyamanan tata letak visual di lapangan, bahasa regional, dan keamanan akun Anda.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={handleResetDefault}
            className="btn-settings-ghost"
            title="Kembalikan ke standar awal"
          >
            <AppIcon name="clock" size={14} />
            <span>Reset Awal</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            className="btn-settings-primary"
            style={{
              background: isSavedFeedback ? "#10b981" : "#013220",
              color: "#ffffff",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.92rem",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
              boxShadow: "0 2px 8px rgba(1, 50, 32, 0.15)",
            }}
          >
            <AppIcon name={isSavedFeedback ? "check" : "check"} size={16} />
            <span>{isSavedFeedback ? "Tersimpan ✓" : "Simpan Pengaturan"}</span>
          </button>
        </div>
      </div>

      {/* HORIZONTAL TAB NAVIGATION */}
      <div className="settings-tabs-nav" style={{ display: "flex", gap: "8px", borderBottom: "1.5px solid #e2e8f0", marginBottom: "24px", overflowX: "auto", paddingBottom: "2px" }}>
        {[
          { id: "notifications" as const, label: "Notifikasi & Peringatan", icon: "alert" },
          { id: "display" as const, label: "Tampilan & Aksesibilitas", icon: "check" },
          { id: "regional" as const, label: "Bahasa & Wilayah", icon: "location" },
          { id: "offline" as const, label: "Mode Lapangan & Offline", icon: "clock" },
          { id: "security" as const, label: "Keamanan Akun", icon: "user" },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom: activeTab === t.id ? "3px solid #013220" : "3px solid transparent",
              color: activeTab === t.id ? "#013220" : "#64748b",
              fontWeight: activeTab === t.id ? 700 : 500,
              fontSize: "0.9rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.15s ease",
            }}
          >
            <AppIcon name={t.icon} size={15} />
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: NOTIFIKASI & PERINGATAN */}
      {activeTab === "notifications" && (
        <div className="settings-card-panel" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#013220", margin: "0 0 6px" }}>
              Saluran Notifikasi Darurat
            </h2>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
              Tentukan bagaimana sistem REKSA mengirimkan pembaruan cepat terkait kebutuhan posko, penyerahan logistik, dan peringatan bencana.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Notifikasi Email */}
            <div className="settings-switch-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #edf2f7" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#0f172a" }}>Notifikasi Email Resmi</strong>
                <small style={{ color: "#64748b", fontSize: "0.82rem" }}>
                  Menerima rekap dokumen resmi BAST, persetujuan alokasi bantuan, dan tiket laporan via email akun.
                </small>
              </div>
              <label className="reksa-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.emailNotif}
                  onChange={() => handleToggle("emailNotif")}
                />
                <span className="slider round" />
              </label>
            </div>

            {/* Notifikasi Dalam Aplikasi */}
            <div className="settings-switch-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #edf2f7" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#0f172a" }}>Notifikasi Dalam Aplikasi (Push Alert)</strong>
                <small style={{ color: "#64748b", fontSize: "0.82rem" }}>
                  Lencana angka merah interaktif dan pop-up banner saat ada respons baru di ruang koordinasi atau posko.
                </small>
              </div>
              <label className="reksa-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.inAppNotif}
                  onChange={() => handleToggle("inAppNotif")}
                />
                <span className="slider round" />
              </label>
            </div>

            {/* Pembaruan Penyaluran & BAST */}
            <div className="settings-switch-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #edf2f7" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#0f172a" }}>Pembaruan Misi Penyaluran &amp; Serah Terima</strong>
                <small style={{ color: "#64748b", fontSize: "0.82rem" }}>
                  Pemberitahuan seketika saat armada tiba di lokasi penyerahan dan saat warga menyelesaikan konfirmasi BAST.
                </small>
              </div>
              <label className="reksa-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.deliveryUpdateNotif}
                  onChange={() => handleToggle("deliveryUpdateNotif")}
                />
                <span className="slider round" />
              </label>
            </div>

            {/* Peringatan Dini Cuaca & Gempa BMKG */}
            <div className="settings-switch-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #edf2f7" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>Peringatan Dini Bencana &amp; Cuaca Ekstrem (BMKG)</strong>
                  <span style={{ background: "#fee2e2", color: "#991b1b", fontSize: "0.7rem", fontWeight: 700, padding: "2px 6px", borderRadius: "4px" }}>Prioritas Darurat</span>
                </div>
                <small style={{ color: "#64748b", fontSize: "0.82rem" }}>
                  Siaga gempa bumi susulan, banjir luapan sungai, dan cuaca ekstrem di wilayah titik evakuasi Anda.
                </small>
              </div>
              <label className="reksa-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.bmkgAlertNotif}
                  onChange={() => handleToggle("bmkgAlertNotif")}
                />
                <span className="slider round" />
              </label>
            </div>

            {/* Suara / Audio Notifikasi Lapangan */}
            <div className="settings-switch-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #edf2f7" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>Suara / Audio Notifikasi Lapangan</strong>
                  <button
                    type="button"
                    onClick={playWebAudioChime}
                    style={{
                      background: "#e2e8f0",
                      border: "none",
                      borderRadius: "6px",
                      padding: "3px 8px",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      color: "#1e293b",
                    }}
                    title="Uji dengarkan nada dering"
                  >
                    🔊 Uji Nada
                  </button>
                </div>
                <small style={{ color: "#64748b", fontSize: "0.82rem" }}>
                  Memutar nada lonceng khas REKSA saat pesan darurat atau status penyaluran baru masuk.
                </small>
              </div>
              <label className="reksa-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.soundNotif}
                  onChange={() => handleToggle("soundNotif")}
                />
                <span className="slider round" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TAMPILAN & KENYAMANAN */}
      {activeTab === "display" && (
        <div className="settings-card-panel" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
          <div style={{ marginBottom: "22px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#013220", margin: "0 0 6px" }}>
              Kenyamanan &amp; Aksesibilitas Tampilan
            </h2>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
              Sesuaikan kerapatan informasi, ukuran tulisan, dan kontras warna untuk penggunaan optimal di dalam posko maupun di lapangan terbuka.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {/* Kerapatan Tampilan (Density) */}
            <div>
              <label style={{ display: "block", fontSize: "0.92rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                Kerapatan Tata Letak (Density)
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", maxWidth: "500px" }}>
                <button
                  type="button"
                  onClick={() => {
                    handleSelect("density", "comfortable");
                    notify("Mode tampilan Nyaman diterapkan.");
                  }}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    border: settings.density === "comfortable" ? "2px solid #013220" : "1.5px solid #cbd5e1",
                    background: settings.density === "comfortable" ? "#f0fdf4" : "#ffffff",
                    color: settings.density === "comfortable" ? "#013220" : "#475569",
                    fontWeight: 700,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: "1rem", marginBottom: "2px" }}>🍃 Nyaman (Standar)</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 400 }}>
                    Jarak antar elemen lebih lega, mudah dibaca dan disentuh di perangkat mobile.
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleSelect("density", "compact");
                    notify("Mode tampilan Ringkas diterapkan.");
                  }}
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    border: settings.density === "compact" ? "2px solid #013220" : "1.5px solid #cbd5e1",
                    background: settings.density === "compact" ? "#f0fdf4" : "#ffffff",
                    color: settings.density === "compact" ? "#013220" : "#475569",
                    fontWeight: 700,
                    textAlign: "left",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div style={{ fontSize: "1rem", marginBottom: "2px" }}>⚡ Ringkas (Padat)</div>
                  <div style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 400 }}>
                    Jarak lebih rapat, memaksimalkan visibilitas data tabel dan logistik di layar monitor.
                  </div>
                </button>
              </div>
            </div>

            {/* Ukuran Teks / Font Size */}
            <div>
              <label style={{ display: "block", fontSize: "0.92rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                Skala Ukuran Teks (Font Size)
              </label>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {[
                  { id: "normal" as const, label: "Standar (100%)", desc: "Default" },
                  { id: "medium" as const, label: "Sedang (110%)", desc: "+10% Lebih besar" },
                  { id: "large" as const, label: "Besar (120%)", desc: "+20% Sangat jelas" },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      handleSelect("fontSize", s.id);
                      notify(`Ukuran teks diubah ke ${s.label}.`);
                    }}
                    style={{
                      padding: "10px 18px",
                      borderRadius: "8px",
                      border: settings.fontSize === s.id ? "2px solid #013220" : "1px solid #cbd5e1",
                      background: settings.fontSize === s.id ? "#013220" : "#ffffff",
                      color: settings.fontSize === s.id ? "#ffffff" : "#334155",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Kontras / Pencahayaan Lapangan */}
            <div>
              <label style={{ display: "block", fontSize: "0.92rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                Tema Pencahayaan &amp; Kontras Warna
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                {[
                  {
                    id: "normal" as const,
                    title: "Hijau REKSA Standar",
                    sub: "Warna natural hangat khas posko kemanusiaan",
                  },
                  {
                    id: "high_contrast" as const,
                    title: "Kontras Tinggi Lapangan",
                    sub: "Border hitam tegas dan teks tebal untuk terik matahari",
                  },
                  {
                    id: "dim" as const,
                    title: "Mode Redup / Malam",
                    sub: "Pencahayaan lembut hangat untuk tenda pengungsian malam",
                  },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      handleSelect("contrastMode", c.id);
                      notify(`Tema diubah ke ${c.title}.`);
                    }}
                    style={{
                      padding: "14px",
                      borderRadius: "10px",
                      border: settings.contrastMode === c.id ? "2px solid #013220" : "1px solid #cbd5e1",
                      background: settings.contrastMode === c.id ? "#f8fafc" : "#ffffff",
                      color: "#0f172a",
                      textAlign: "left",
                      cursor: "pointer",
                      boxShadow: settings.contrastMode === c.id ? "0 0 0 2px rgba(1,50,32,0.15)" : "none",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "#013220", marginBottom: "4px" }}>
                      {c.title}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#64748b" }}>{c.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Pengurangan Animasi */}
            <div className="settings-switch-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #edf2f7" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#0f172a" }}>Hemat Daya &amp; Minimalkan Animasi</strong>
                <small style={{ color: "#64748b", fontSize: "0.82rem" }}>
                  Menonaktifkan transisi gerak untuk menghemat baterai ponsel saat kondisi listrik posko terbatas.
                </small>
              </div>
              <label className="reksa-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.animations === "reduced"}
                  onChange={() => handleSelect("animations", settings.animations === "reduced" ? "full" : "reduced")}
                />
                <span className="slider round" />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BAHASA & WILAYAH */}
      {activeTab === "regional" && (
        <div className="settings-card-panel" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
          <div style={{ marginBottom: "22px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#013220", margin: "0 0 6px" }}>
              Bahasa &amp; Standar Operasional Wilayah
            </h2>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
              Konfigurasi zona waktu logistik serta pilihan bahasa antarmuka aplikasi.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "560px" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.92rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                Bahasa Antarmuka Aplikasi
              </label>
              <select
                value={settings.language}
                onChange={(e) => {
                  const val = e.target.value as any;
                  handleSelect("language", val);
                  notify(`Bahasa antarmuka diubah ke ${e.target.options[e.target.selectedIndex].text}.`);
                }}
                className="reksa-select-field"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}
              >
                <option value="id">🇮🇩 Bahasa Indonesia (Utama)</option>
                <option value="en">🇬🇧 English (International Humanitarian)</option>
                <option value="jv">🇮🇩 Basa Jawa (Lokal Jawa Timur)</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.92rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                Zona Waktu Posko Komando
              </label>
              <select
                value={settings.timezone}
                onChange={(e) => {
                  handleSelect("timezone", e.target.value as any);
                  notify(`Zona waktu operasional diset ke ${e.target.value}.`);
                }}
                className="reksa-select-field"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}
              >
                <option value="WIB">WIB (Waktu Indonesia Barat - UTC+7) · Jawa &amp; Sumatera</option>
                <option value="WITA">WITA (Waktu Indonesia Tengah - UTC+8) · Bali, NTB, NTT &amp; Sulawesi</option>
                <option value="WIT">WIT (Waktu Indonesia Timur - UTC+9) · Maluku &amp; Papua</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.92rem", fontWeight: 700, color: "#1e293b", marginBottom: "8px" }}>
                Format Tanggal &amp; Waktu Resmi
              </label>
              <select
                value={settings.dateFormat}
                onChange={(e) => {
                  handleSelect("dateFormat", e.target.value as any);
                  notify(`Format tanggal diubah ke ${e.target.value}.`);
                }}
                className="reksa-select-field"
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY (Contoh: 26/10/2026 - Standar Indonesia)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (Contoh: 2026-10-26 - Standar ISO Arsip)</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MODE LAPANGAN & OFFLINE */}
      {activeTab === "offline" && (
        <div className="settings-card-panel" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#013220", margin: "0 0 6px" }}>
              Manajemen Penyimpanan &amp; Mode Lapangan
            </h2>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
              Optimalkan transmisi data saat berada di area bencana dengan sinyal seluler terbatas atau terputus.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="settings-switch-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #edf2f7" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#0f172a" }}>Mode Hemat Kuota &amp; Sinyal Lemah</strong>
                <small style={{ color: "#64748b", fontSize: "0.82rem" }}>
                  Otomatis mengompresi foto bukti kerusakan dan bukti BAST sebelum diunggah agar cepat terkirim di jaringan 2G/3G.
                </small>
              </div>
              <label className="reksa-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.lowDataMode}
                  onChange={() => handleToggle("lowDataMode")}
                />
                <span className="slider round" />
              </label>
            </div>

            <div className="settings-switch-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #edf2f7" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#0f172a" }}>Sinkronisasi Otomatis Latar Belakang</strong>
                <small style={{ color: "#64748b", fontSize: "0.82rem" }}>
                  Mengirimkan antrean laporan darurat yang tersimpan di memori perangkat secara instan saat koneksi internet kembali stabil.
                </small>
              </div>
              <label className="reksa-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.autoSync}
                  onChange={() => handleToggle("autoSync")}
                />
                <span className="slider round" />
              </label>
            </div>

            {/* Action Buttons for Cache & Backup */}
            <div style={{ marginTop: "14px", paddingTop: "18px", borderTop: "1px solid #e2e8f0", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={handleClearCache}
                className="btn-settings-ghost"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span>🧹 Bersihkan Cache Sementara</span>
              </button>

              <button
                type="button"
                onClick={handleExportBackup}
                className="btn-settings-ghost"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                <span>📥 Cadangkan Pengaturan (JSON)</span>
              </button>

              <label
                className="btn-settings-ghost"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  background: "#ffffff",
                  fontSize: "0.88rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  margin: 0,
                }}
              >
                <span>📤 Pulihkan Cadangan (JSON)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleImportBackup}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: KEAMANAN & AKUN */}
      {activeTab === "security" && (
        <div className="settings-card-panel" style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 4px rgba(0,0,0,0.03)" }}>
          <div style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#013220", margin: "0 0 6px" }}>
              Keamanan Akun &amp; Sesi Aktif
            </h2>
            <p style={{ margin: 0, fontSize: "0.88rem", color: "#64748b" }}>
              Kelola otentikasi login, kata sandi, dan perlindungan data akun {name} ({role}).
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {/* Ganti Password Row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #edf2f7", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#0f172a" }}>Kata Sandi Akun</strong>
                <small style={{ color: "#64748b", fontSize: "0.82rem" }}>
                  Terakhir diperbarui secara berkala untuk menjaga otentikasi komando posko.
                </small>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(true)}
                style={{
                  background: "#013220",
                  color: "#ffffff",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                }}
              >
                Ganti Kata Sandi
              </button>
            </div>

            {/* Verifikasi 2-Langkah (2FA) */}
            <div className="settings-switch-item" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px", background: "#f8fafc", borderRadius: "10px", border: "1px solid #edf2f7" }}>
              <div>
                <strong style={{ display: "block", fontSize: "0.95rem", color: "#0f172a" }}>Autentikasi Dua Langkah (2FA WhatsApp/SMS)</strong>
                <small style={{ color: "#64748b", fontSize: "0.82rem" }}>
                  Meminta kode verifikasi 6 digit setiap kali Anda masuk dari perangkat lapangan baru.
                </small>
              </div>
              <label className="reksa-toggle-switch">
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth}
                  onChange={() => {
                    handleToggle("twoFactorAuth");
                    notify(
                      !settings.twoFactorAuth
                        ? "Autentikasi 2-Langkah aktif. Kode konfirmasi akan dikirim saat login baru."
                        : "Autentikasi 2-Langkah dinonaktifkan."
                    );
                  }}
                />
                <span className="slider round" />
              </label>
            </div>

            {/* Sesi Perangkat Aktif */}
            <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#16a34a" }} />
                <strong style={{ fontSize: "0.9rem", color: "#166534" }}>Sesi Perangkat Ini Sedang Aktif</strong>
              </div>
              <div style={{ fontSize: "0.82rem", color: "#14532d" }}>
                Browser web terenkripsi · Akses peran <strong>{role}</strong> · Terhubung ke server REKSA Jawa Timur.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GANTI KATA SANDI */}
      {showPasswordModal && (
        <div className="modal-backdrop" onClick={() => setShowPasswordModal(false)}>
          <div
            className="modal"
            style={{ width: "min(460px, 95%)", textAlign: "left", borderRadius: "16px", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#013220", fontWeight: 800 }}>
                Perbarui Kata Sandi Akun
              </h3>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <AppIcon name="x" size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitPassword}>
              {passwordError && (
                <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "10px 12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "14px" }}>
                  {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div style={{ background: "#dcfce7", border: "1px solid #86efac", color: "#166534", padding: "10px 12px", borderRadius: "8px", fontSize: "0.85rem", marginBottom: "14px" }}>
                  Kata sandi berhasil diubah!
                </div>
              )}

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Kata Sandi Lama:
                </label>
                <input
                  type={showPasswordText ? "text" : "password"}
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan kata sandi lama Anda"
                  className="reksa-input-field"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Kata Sandi Baru:
                </label>
                <input
                  type={showPasswordText ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 6 karakter kombinasi"
                  className="reksa-input-field"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "6px" }}>
                  Konfirmasi Kata Sandi Baru:
                </label>
                <input
                  type={showPasswordText ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="reksa-input-field"
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1.5px solid #cbd5e1" }}
                  required
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "20px" }}>
                <input
                  type="checkbox"
                  id="showPasswordToggle"
                  checked={showPasswordText}
                  onChange={(e) => setShowPasswordText(e.target.checked)}
                />
                <label htmlFor="showPasswordToggle" style={{ fontSize: "0.82rem", color: "#64748b", cursor: "pointer" }}>
                  Tampilkan teks kata sandi
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn-case-view"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn-settings-primary"
                  style={{
                    background: "#013220",
                    color: "#ffffff",
                    padding: "10px 18px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Simpan Kata Sandi
                </button>
              </div>
            </form>
          </div>
      {/* MODAL AKTIVASI 2FA */}
      {showTwoFactorModal && (
        <div className="modal-backdrop" onClick={() => setShowTwoFactorModal(false)}>
          <div
            className="modal"
            style={{ width: "min(440px, 95%)", textAlign: "left", borderRadius: "16px", padding: "24px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontSize: "1.2rem", color: "#013220", fontWeight: 800 }}>
                Autentikasi 2-Langkah Aktif
              </h3>
              <button
                type="button"
                onClick={() => setShowTwoFactorModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <AppIcon name="x" size={18} />
              </button>
            </div>

            <p style={{ fontSize: "0.88rem", color: "#475569", lineHeight: 1.5, margin: "0 0 16px" }}>
              Akun Anda kini dilindungi verifikasi ganda saat login dari perangkat baru. Simpan kunci pemulihan darurat di bawah ini:
            </p>

            <div style={{ background: "#f1f5f9", padding: "14px", borderRadius: "10px", border: "1.5px dashed #94a3b8", textAlign: "center", marginBottom: "18px" }}>
              <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>
                Kode Kunci Pemulihan Darurat Lapangan
              </div>
              <code style={{ fontSize: "1.2rem", fontWeight: 800, color: "#013220", letterSpacing: "2px" }}>
                {twoFactorKey}
              </code>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(twoFactorKey);
                  notify("Kunci 2FA berhasil disalin!");
                }}
                className="btn-case-view"
              >
                Salin Kunci
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowTwoFactorModal(false);
                  notify("Autentikasi 2-Langkah siap digunakan.");
                }}
                className="btn-settings-primary"
                style={{
                  background: "#013220",
                  color: "#ffffff",
                  padding: "10px 18px",
                  borderRadius: "8px",
                  border: "none",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Saya Sudah Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
