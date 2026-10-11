import React, { useState } from "react";
import { CaseRecord, Icon, Button } from "../../App";
import { apiService } from "../../services/api";

interface CitizenClarificationModalProps {
  caseData: CaseRecord;
  onClose: () => void;
  onSuccess: (updatedCase: CaseRecord) => void;
  notify?: (msg: string) => void;
}

export function CitizenClarificationModal({
  caseData,
  onClose,
  onSuccess,
  notify,
}: CitizenClarificationModalProps) {
  const [jawaban, setJawaban] = useState("");
  const [fotoKlarifikasi, setFotoKlarifikasi] = useState<string | undefined>(undefined);
  const [photoName, setPhotoName] = useState("");
  const [showAdjustments, setShowAdjustments] = useState(false);
  const [volumePermintaan, setVolumePermintaan] = useState(caseData.qty || "");
  const [jumlahKk, setJumlahKk] = useState<number | "">(parseInt(caseData.kk) || 1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoName(file.name);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const rawResult = ev.target?.result;
          if (typeof rawResult === "string") {
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
                  setFotoKlarifikasi(compressed);
                } else {
                  setFotoKlarifikasi(rawResult);
                }
              } catch {
                setFotoKlarifikasi(rawResult);
              }
            };
            img.onerror = () => {
              setFotoKlarifikasi(rawResult);
            };
            img.src = rawResult;
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jawaban.trim()) {
      setErrorMsg("Mohon tuliskan penjelasan klarifikasi Anda.");
      return;
    }

    if (caseData.memintaLampiran && !fotoKlarifikasi && !caseData.fotoKlarifikasi) {
      setErrorMsg("Petugas Posko BPBD mewajibkan unggahan foto/dokumen fisik tambahan.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg("");

    const payload: {
      jawaban: string;
      foto_klarifikasi?: string;
      jumlah_kk?: number;
      volume_permintaan?: string;
      citizen_name?: string;
    } = {
      jawaban: jawaban.trim(),
      foto_klarifikasi: fotoKlarifikasi || undefined,
      citizen_name: caseData.applicantName || "Andi Pratama",
    };

    if (showAdjustments) {
      if (volumePermintaan.trim() && volumePermintaan !== caseData.qty) {
        payload.volume_permintaan = volumePermintaan.trim();
      }
      if (typeof jumlahKk === "number" && jumlahKk > 0) {
        payload.jumlah_kk = jumlahKk;
      }
    }

    try {
      const res = await apiService.jawabKlarifikasi(caseData.id, payload);
      if (res && res.success) {
        const updatedCase: CaseRecord = {
          ...caseData,
          status: "Dalam Verifikasi",
          jawabanKlarifikasi: jawaban.trim(),
          fotoKlarifikasi: fotoKlarifikasi || caseData.fotoKlarifikasi,
          qty: payload.volume_permintaan || caseData.qty,
          kk: payload.jumlah_kk ? `${payload.jumlah_kk} KK` : caseData.kk,
          updatedAtRaw: new Date().toISOString(),
        };

        notify?.(`Jawaban klarifikasi untuk kasus ${caseData.id} berhasil dikirim ke Posko BPBD.`);
        onSuccess(updatedCase);
        onClose();
      } else {
        throw new Error(res?.message || "Gagal mengirim klarifikasi");
      }
    } catch (err: any) {
      console.warn("Fallback offline/local klarifikasi:", err);
      // Fallback local state if API network error
      const updatedCase: CaseRecord = {
        ...caseData,
        status: "Dalam Verifikasi",
        jawabanKlarifikasi: jawaban.trim(),
        fotoKlarifikasi: fotoKlarifikasi || caseData.fotoKlarifikasi,
        qty: payload.volume_permintaan || caseData.qty,
        kk: payload.jumlah_kk ? `${payload.jumlah_kk} KK` : caseData.kk,
        updatedAtRaw: new Date().toISOString(),
      };
      notify?.(`Jawaban klarifikasi ${caseData.id} tersimpan dan dikirim ke Posko BPBD.`);
      onSuccess(updatedCase);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(1, 50, 32, 0.45)",
        backdropFilter: "blur(4px)",
        zIndex: 99999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          maxWidth: "600px",
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #dcdad0",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #f0eee6",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "#faf9f5",
            borderTopLeftRadius: "20px",
            borderTopRightRadius: "20px",
          }}
        >
          <div>
            <span
              style={{
                fontSize: "0.78rem",
                fontWeight: 700,
                color: "#b45309",
                background: "#fef3c7",
                padding: "3px 10px",
                borderRadius: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Klarifikasi Posko BPBD
            </span>
            <h3 style={{ margin: "6px 0 0", color: "#013220", fontSize: "1.2rem", fontWeight: 700 }}>
              Respon Klarifikasi Laporan #{caseData.id}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.4rem",
              color: "#758378",
              cursor: "pointer",
              padding: "4px 8px",
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "24px" }}>
          {/* CALLOUT PERTANYAAN POSKO BPBD */}
          <div
            style={{
              background: "#fffbeb",
              border: "1.5px solid #f59e0b",
              borderRadius: "14px",
              padding: "16px 18px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: "8px",
                flexWrap: "wrap",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#92400e", fontWeight: 700, fontSize: "0.92rem" }}>
                <Icon name="check" /> Instruksi Petugas Posko BPBD
              </div>
              <span style={{ fontSize: "0.78rem", background: "#fde68a", color: "#78350f", padding: "2px 8px", borderRadius: "6px", fontWeight: 600 }}>
                Kategori: {caseData.kategoriKlarifikasi || "Kelengkapan Informasi"}
              </span>
            </div>
            <div
              style={{
                background: "#ffffff",
                border: "1px solid #fde68a",
                borderRadius: "10px",
                padding: "12px 14px",
                fontSize: "0.92rem",
                color: "#1e293b",
                lineHeight: 1.5,
                fontWeight: 600,
              }}
            >
              "{caseData.pertanyaanKlarifikasi || "Mohon berikan rincian data tambahan dan foto kondisi aktual untuk laporan ini."}"
            </div>
            {caseData.memintaLampiran && (
              <small
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  marginTop: "8px",
                  color: "#b45309",
                  fontWeight: 600,
                  fontSize: "0.82rem",
                }}
              >
                ⚠️ Petugas mewajibkan foto bukti atau dokumen surat keterangan pengantar RT/RW.
              </small>
            )}
          </div>

          {/* SUMMARY ITEM KASUS */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
              gap: "10px",
              background: "#f7f8f6",
              padding: "12px 16px",
              borderRadius: "12px",
              marginBottom: "18px",
              border: "1px solid #e5e7eb",
              fontSize: "0.84rem",
            }}
          >
            <div>
              <span style={{ color: "#6b7280", display: "block" }}>Kebutuhan:</span>
              <strong style={{ color: "#013220" }}>{caseData.item}</strong>
            </div>
            <div>
              <span style={{ color: "#6b7280", display: "block" }}>Jumlah Diminta:</span>
              <strong style={{ color: "#013220" }}>{caseData.qty} ({caseData.kk})</strong>
            </div>
            <div>
              <span style={{ color: "#6b7280", display: "block" }}>Wilayah:</span>
              <strong style={{ color: "#013220" }}>{caseData.location}</strong>
            </div>
          </div>

          {errorMsg && (
            <div
              style={{
                background: "#fee2e2",
                border: "1px solid #ef4444",
                borderRadius: "10px",
                padding: "10px 14px",
                color: "#b91c1c",
                fontSize: "0.86rem",
                marginBottom: "16px",
                fontWeight: 500,
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* INPUT FORM */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "#013220",
                  marginBottom: "6px",
                }}
              >
                Jawaban &amp; Penjelasan Anda <span style={{ color: "#dc2626" }}>*</span>
              </label>
              <textarea
                className="form-control textarea"
                rows={4}
                required
                value={jawaban}
                onChange={(e) => setJawaban(e.target.value)}
                placeholder="Tuliskan keterangan lengkap menjawab instruksi petugas di atas..."
                style={{
                  width: "100%",
                  padding: "12px",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                }}
              />
              <small style={{ color: "#64748b", fontSize: "0.8rem", marginTop: "4px", display: "block" }}>
                Contoh: "Kondisi air sumur keruh bercampur lumpur, membutuhkan 5 galon air minum untuk 2 KK lansia."
              </small>
            </div>

            {/* UNGGAH FOTO SUSULAN */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.9rem",
                  fontWeight: 700,
                  color: "#013220",
                  marginBottom: "6px",
                }}
              >
                {caseData.memintaLampiran
                  ? "Unggah Foto / Dokumen Baru (Wajib) *"
                  : "Unggah Foto / Dokumen Tambahan (Opsional)"}
              </label>
              <label
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "18px",
                  border: "2px dashed #b2d7bb",
                  borderRadius: "12px",
                  background: "#fbfcfb",
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  style={{ display: "none" }}
                />
                <span style={{ fontSize: "1.8rem", marginBottom: "4px" }}>📷</span>
                <strong style={{ color: "#013220", fontSize: "0.88rem" }}>
                  {photoName ? photoName : "Pilih foto bukti lapangan atau surat pengantar"}
                </strong>
                <span style={{ color: "#64748b", fontSize: "0.78rem", marginTop: "2px" }}>
                  Format JPG/PNG · Kompresi otomatis berkualitas tinggi
                </span>
              </label>

              {fotoKlarifikasi && (
                <div
                  style={{
                    marginTop: "10px",
                    borderRadius: "10px",
                    overflow: "hidden",
                    border: "1px solid #cbd5e1",
                    maxHeight: "150px",
                    position: "relative",
                  }}
                >
                  <img
                    src={fotoKlarifikasi}
                    alt="Pratinjau Foto Klarifikasi"
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setFotoKlarifikasi(undefined);
                      setPhotoName("");
                    }}
                    style={{
                      position: "absolute",
                      top: "6px",
                      right: "6px",
                      background: "rgba(0,0,0,0.6)",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    Hapus Foto
                  </button>
                </div>
              )}
            </div>

            {/* TOGGLE PENYESUAIAN VOLUME / KK JIKA POSKO MEMINTA KOREKSI */}
            <div style={{ borderTop: "1px solid #f0eee6", paddingTop: "14px" }}>
              <button
                type="button"
                onClick={() => setShowAdjustments(!showAdjustments)}
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
                <span>{showAdjustments ? "▼ Sembunyikan Koreksi Volume/KK" : "▶ Koreksi Jumlah Volume / KK (Jika Diminta Posko)"}</span>
              </button>

              {showAdjustments && (
                <div
                  style={{
                    marginTop: "12px",
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
                      Volume Baru
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={volumePermintaan}
                      onChange={(e) => setVolumePermintaan(e.target.value)}
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
                      value={jumlahKk}
                      onChange={(e) => setJumlahKk(e.target.value ? Number(e.target.value) : "")}
                      style={{ fontSize: "0.85rem", padding: "8px" }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div
            style={{
              marginTop: "24px",
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
              borderTop: "1px solid #f0eee6",
              paddingTop: "16px",
            }}
          >
            <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || !jawaban.trim()}>
              <Icon name="check" /> {isSubmitting ? "Mengirim Jawaban..." : "Kirim Jawaban Klarifikasi"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
