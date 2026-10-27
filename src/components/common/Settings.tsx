import React, { useState, useEffect } from "react";

export interface UserSettings {
  emailNotif: boolean;
  inAppNotif: boolean;
  deliveryUpdateNotif: boolean;
  systemUpdateNotif: boolean;
  density: "comfortable" | "compact";
}

export const DEFAULT_SETTINGS: UserSettings = {
  emailNotif: true,
  inAppNotif: true,
  deliveryUpdateNotif: true,
  systemUpdateNotif: false,
  density: "comfortable",
};

// Ambil pengaturan yang tersimpan di localStorage
export function getSavedSettings(): UserSettings {
  try {
    const savedPrefs = localStorage.getItem("reksa_settings_prefs");
    const savedDensity = localStorage.getItem("reksa_settings_density");
    const prefs = savedPrefs ? JSON.parse(savedPrefs) : [true, true, true, false];
    const density = savedDensity === "compact" ? "compact" : "comfortable";
    return {
      emailNotif: Boolean(prefs[0] ?? true),
      inAppNotif: Boolean(prefs[1] ?? true),
      deliveryUpdateNotif: Boolean(prefs[2] ?? true),
      systemUpdateNotif: Boolean(prefs[3] ?? false),
      density,
    };
  } catch {}
  return DEFAULT_SETTINGS;
}

// Terapkan efek visual kerapatan ke DOM
export function applyLiveSettings() {
  try {
    const savedDensity = localStorage.getItem("reksa_settings_density") || "comfortable";
    if (savedDensity === "compact") {
      document.body.classList.add("reksa-density-compact");
    } else {
      document.body.classList.remove("reksa-density-compact");
    }
  } catch {}
}

// Nada dering notifikasi Web Audio murni (zero-dependency)
export function playWebAudioChime() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.38);
  } catch {}
}

interface SettingsProps {
  notify: (x: string) => void;
  role?: string;
  name?: string;
  update?: any;
}

export function Settings({ notify }: SettingsProps) {
  // Muat status 4 notifikasi dari penyimpanan
  const [prefs, setPrefs] = useState<boolean[]>(() => {
    try {
      const saved = localStorage.getItem("reksa_settings_prefs");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 4) return parsed;
      }
    } catch {}
    return [true, true, true, false];
  });

  // Muat status kerapatan tampilan (Nyaman / Ringkas)
  const [density, setDensity] = useState<"comfortable" | "compact">(() => {
    try {
      const saved = localStorage.getItem("reksa_settings_density");
      if (saved === "compact" || saved === "comfortable") return saved;
    } catch {}
    return "comfortable";
  });

  const labels = [
    "Notifikasi email",
    "Notifikasi dalam aplikasi",
    "Pembaruan pengiriman",
    "Pembaruan sistem",
  ];

  // Terapkan kerapatan langsung ke body saat komponen dibuka atau opsi dipilih
  useEffect(() => {
    if (density === "compact") {
      document.body.classList.add("reksa-density-compact");
    } else {
      document.body.classList.remove("reksa-density-compact");
    }
  }, [density]);

  // Handler toggle opsi notifikasi satu per satu
  const handleToggle = (index: number) => {
    const updated = prefs.map((v, i) => (i === index ? !v : v));
    setPrefs(updated);
    try {
      localStorage.setItem("reksa_settings_prefs", JSON.stringify(updated));
      window.dispatchEvent(
        new CustomEvent("reksa_settings_updated", {
          detail: { prefs: updated, density },
        })
      );
    } catch {}
  };

  // Handler kerapatan tampilan (Nyaman / Ringkas)
  const handleDensityChange = (newDensity: "comfortable" | "compact") => {
    setDensity(newDensity);
    try {
      localStorage.setItem("reksa_settings_density", newDensity);
      if (newDensity === "compact") {
        document.body.classList.add("reksa-density-compact");
      } else {
        document.body.classList.remove("reksa-density-compact");
      }
      window.dispatchEvent(
        new CustomEvent("reksa_settings_updated", {
          detail: { prefs, density: newDensity },
        })
      );
    } catch {}
    notify(newDensity === "compact" ? "Tampilan ringkas diterapkan." : "Tampilan nyaman diterapkan.");
  };

  // Handler simpan seluruh pengaturan secara eksplisit
  const handleSave = () => {
    try {
      localStorage.setItem("reksa_settings_prefs", JSON.stringify(prefs));
      localStorage.setItem("reksa_settings_density", density);
      if (density === "compact") {
        document.body.classList.add("reksa-density-compact");
      } else {
        document.body.classList.remove("reksa-density-compact");
      }
      window.dispatchEvent(
        new CustomEvent("reksa_settings_updated", {
          detail: { prefs, density },
        })
      );
    } catch {}
    notify("Pengaturan berhasil disimpan.");
  };

  return (
    <main className="workspace narrow-page">
      <div className="workspace-title">
        <div className="workspace-title-text">
          <span className="eyebrow">Preferensi akun</span>
          <h1>Pengaturan</h1>
          <p>Atur notifikasi dan kenyamanan tampilan.</p>
        </div>
      </div>

      <section className="settings-group">
        <h2>Notifikasi</h2>
        {labels.map((x, i) => (
          <label className="switch-row" key={x}>
            <span>
              <b>{x}</b>
              <small>
                {i === 2
                  ? "Perubahan status bantuan dan penyerahan."
                  : "Informasi penting dari REKSA."}
              </small>
            </span>
            <input
              type="checkbox"
              checked={prefs[i]}
              onChange={() => handleToggle(i)}
            />
          </label>
        ))}
      </section>

      <section className="settings-group">
        <h2>Kerapatan tampilan</h2>
        <div className="filters" style={{ margin: "16px 0 28px" }}>
          <button
            type="button"
            className={density === "comfortable" ? "active" : ""}
            onClick={() => handleDensityChange("comfortable")}
          >
            Nyaman
          </button>
          <button
            type="button"
            className={density === "compact" ? "active" : ""}
            onClick={() => handleDensityChange("compact")}
          >
            Ringkas
          </button>
        </div>
      </section>

      <div>
        <button
          type="button"
          className="btn"
          onClick={handleSave}
          style={{ cursor: "pointer" }}
        >
          Simpan Pengaturan
        </button>
      </div>
    </main>
  );
}
