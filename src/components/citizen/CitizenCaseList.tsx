import { useState } from "react";
import {
  CaseRecord,
  SharedState,
  RouterProps,
  PageHead,
  Icon,
  Button,
  Pill,
  getFieldEvidencePhoto,
} from "../../App";
import { apiService } from "../../services/api";
import { CitizenClarificationModal } from "./CitizenClarificationModal";

interface CitizenCaseListProps {
  title: string;
  copy: string;
  onCase: (c?: CaseRecord) => void;
  own?: boolean;
  completed?: boolean;
  state?: SharedState;
  update?: RouterProps["update"];
}

export function CitizenCaseList({
  title,
  copy,
  onCase,
  own = false,
  completed = false,
  state,
  update,
}: CitizenCaseListProps) {
  const [filter, setFilter] = useState("Semua");
  const [searchQuery, setSearchQuery] = useState("");

  const allCases = state?.casesList ?? [];
  const [editingCase, setEditingCase] = useState<CaseRecord | null>(null);
  const [deletingCase, setDeletingCase] = useState<CaseRecord | null>(null);
  const [clarificationCase, setClarificationCase] = useState<CaseRecord | null>(null);

  // Edit fields
  const [editItem, setEditItem] = useState("");
  const [editQty, setEditQty] = useState("");
  const [editKK, setEditKK] = useState("");
  const [editPriority, setEditPriority] = useState("Sangat mendesak");

  const normalizeCitizenUrgency = (val: string) => {
    if (val === "Kritis") return "Sangat mendesak";
    if (val === "Tinggi") return "Perlu segera";
    if (val === "Sedang") return "Bisa menunggu";
    return val || "Sangat mendesak";
  };

  const clarificationCount = allCases.filter(
    (c) => (!own || c.isOwn) && c.status === "Perlu Klarifikasi"
  ).length;

  const data = allCases.filter((c) => {
    const matchesOwn = !own || c.isOwn;
    const matchesCompleted = !completed || c.status === "Selesai";
    const matchesFilter =
      filter === "Semua" ||
      (filter === "Perlu Klarifikasi" && c.status === "Perlu Klarifikasi") ||
      c.urgency === filter ||
      (filter === "Sangat mendesak" && (c.urgency === "Kritis" || c.urgency === "Sangat mendesak")) ||
      (filter === "Perlu segera" && (c.urgency === "Tinggi" || c.urgency === "Perlu segera")) ||
      (filter === "Bisa menunggu" && (c.urgency === "Sedang" || c.urgency === "Bisa menunggu"));
    const matchesSearch =
      !searchQuery ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesOwn && matchesCompleted && matchesFilter && matchesSearch;
  });

  const openEdit = (c: CaseRecord) => {
    setEditingCase(c);
    setEditItem(c.item);
    setEditQty(c.qty);
    setEditKK(c.kk);
    setEditPriority(normalizeCitizenUrgency(c.urgency));
  };

  const saveEdit = async () => {
    if (!editingCase || !update) return;
    const parsedKK = typeof editKK === "number" ? editKK : parseInt(String(editKK).replace(/[^0-9]/g, "")) || 1;
    const formattedKK = `${parsedKK} KK`;
    const updated = allCases.map((c) =>
      c.id === editingCase.id
        ? { ...c, item: editItem, qty: editQty, kk: formattedKK, urgency: editPriority }
        : c
    );

    // 1. Update local state & localStorage immediately
    localStorage.setItem("reksa_cases_db", JSON.stringify(updated));
    update({ casesList: updated }, `Data kasus ${editingCase.id} berhasil diperbarui.`);
    setEditingCase(null);

    // 2. Sync to Laravel Database API
    try {
      await apiService.updateKebutuhan(editingCase.id, {
        kategori_kebutuhan: editItem,
        volume_permintaan: editQty,
        jumlah_kk: parsedKK,
        tingkat_urgensi: editPriority,
      });
    } catch (e) {
      console.log("API update note:", e);
    }
  };

  const confirmDelete = () => {
    if (!deletingCase || !update) return;
    const updated = allCases.filter((c) => c.id !== deletingCase.id);

    // 1. Send DELETE to Laravel backend
    apiService.deleteKebutuhan(deletingCase.id).catch((e) => console.log("API delete note:", e));

    // 2. Track deleted ID in localStorage to prevent re-fetching deleted items
    try {
      const deletedIds: string[] = JSON.parse(localStorage.getItem("reksa_deleted_ids") || "[]");
      if (!deletedIds.includes(deletingCase.id)) {
        deletedIds.push(deletingCase.id);
        localStorage.setItem("reksa_deleted_ids", JSON.stringify(deletedIds));
      }
    } catch {}

    localStorage.setItem("reksa_cases_db", JSON.stringify(updated));
    update({ casesList: updated }, `Kasus ${deletingCase.id} berhasil dihapus.`);
    setDeletingCase(null);
  };

  const handlePantau = (c: CaseRecord) => {
    if (update) {
      update({ activeCaseId: c.id });
    }
    onCase(c);
  };

  return (
    <main className="workspace cases-workspace">
      <PageHead
        eyebrow="Portal Kebutuhan"
        title={title}
        copy={copy}
        action={<div className="trust-badge"><Icon name="check" /> {data.length} Kasus Terdata</div>}
      />

      {/* FILTER & SEARCH BAR */}
      <div className="cases-filter-bar">
        <div className="cases-search-box">
          <Icon name="file" />
          <input
            type="text"
            placeholder="Cari kode kasus, jenis kebutuhan, atau desa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="cases-pill-filters" style={{ flexWrap: "wrap", gap: "6px" }}>
          {[
            "Semua",
            ...(clarificationCount > 0 ? ["Perlu Klarifikasi"] : []),
            "Sangat mendesak",
            "Perlu segera",
            "Bisa menunggu",
          ].map((x) => {
            const isClarifPill = x === "Perlu Klarifikasi";
            const isActive = filter === x;
            return (
              <button
                key={x}
                type="button"
                className={`case-filter-btn ${isActive ? "active" : ""}`}
                style={
                  isClarifPill
                    ? {
                        background: isActive ? "#b45309" : "#fffbeb",
                        color: isActive ? "#ffffff" : "#92400e",
                        borderColor: "#f59e0b",
                        fontWeight: 700,
                      }
                    : undefined
                }
                onClick={() => setFilter(x)}
              >
                {isClarifPill ? `⚠️ ${x} (${clarificationCount})` : x}
              </button>
            );
          })}
        </div>
      </div>

      {/* CASE CARDS GRID */}
      <div className="case-cards-grid">
        {data.length === 0 ? (
          <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px", background: "#f5f4ef", borderRadius: "16px", color: "#80866e" }}>
            <Icon name="file" />
            <p style={{ marginTop: "10px", fontWeight: 600 }}>Tidak ada data laporan kasus yang sesuai filter atau data telah dihapus.</p>
          </div>
        ) : (
          data.map((c) => {
            const isCritical = c.urgency === "Kritis" || c.urgency === "Sangat mendesak";
            const isHigh = c.urgency === "Tinggi" || c.urgency === "Perlu segera";
            const isDone = c.status === "Selesai";
            const isClarification = c.status === "Perlu Klarifikasi";

            return (
              <div 
                className={`case-aesthetic-card ${isCritical ? "priority-critical" : ""}`} 
                key={c.id}
                style={isClarification ? { borderColor: "#f59e0b", background: "#fffdfa" } : undefined}
              >
                <div className="case-card-header">
                  <div className="case-code-badge">{c.id}</div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {isClarification && (
                      <span style={{ fontSize: "0.76rem", background: "#fef3c7", color: "#b45309", border: "1px solid #fde68a", padding: "2px 8px", borderRadius: "10px", fontWeight: 700 }}>
                        ⚠️ Klarifikasi
                      </span>
                    )}
                    <Pill tone={isCritical ? "critical" : isHigh ? "high" : "medium"}>{c.urgency}</Pill>
                  </div>
                </div>

                <div className="case-card-body">
                  <div className="case-card-main-row">
                    <div className="case-photo-badge">
                      <img
                        src={getFieldEvidencePhoto(c.item, c.fotoBukti)}
                        alt={c.item}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1593113598332-cd288d649433?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&w=400&q=80";
                        }}
                      />
                    </div>
                    <div className="case-card-header-info">
                      <h3>{c.item}</h3>
                      <div className="case-card-location">
                        <Icon name="pin" />
                        <span>{c.location} · {c.kk}</span>
                      </div>
                    </div>
                  </div>

                  {/* CALLOUT INSTRUKSI POSKO BPBD JIKA PERLU KLARIFIKASI */}
                  {isClarification && (
                    <div
                      style={{
                        background: "#fffbeb",
                        border: "1px solid #fde68a",
                        borderRadius: "10px",
                        padding: "10px 12px",
                        marginTop: "10px",
                        fontSize: "0.82rem",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#b45309", fontWeight: 700 }}>
                        <Icon name="check" /> Instruksi Posko BPBD:
                      </div>
                      <div style={{ color: "#78350f", marginTop: "3px", lineHeight: 1.4, fontWeight: 500 }}>
                        "{c.pertanyaanKlarifikasi || "Mohon berikan rincian data tambahan untuk laporan kebutuhan ini."}"
                      </div>
                      {c.memintaLampiran && (
                        <small style={{ color: "#d97706", display: "block", marginTop: "4px", fontWeight: 700 }}>
                          *Wajib menyertakan lampiran foto/dokumen fisik baru
                        </small>
                      )}
                    </div>
                  )}

                  <div className="case-card-quantity">
                    <small>Target Volume Bantuan:</small>
                    <strong>{c.qty}</strong>
                  </div>
                </div>

                {/* DIRECT ACTIONS ON CARD */}
                <div className="case-card-footer" style={{ flexDirection: "column", gap: "10px", alignItems: "stretch" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div className="case-status-indicator">
                      <i className={`status-dot ${isDone ? "done" : isClarification ? "warning" : "active"}`} style={isClarification ? { background: "#f59e0b" } : undefined} />
                      <span style={isClarification ? { color: "#b45309", fontWeight: 700 } : undefined}>{c.status}</span>
                    </div>
                  </div>

                  {isClarification && (
                    <button
                      type="button"
                      onClick={() => setClarificationCase(c)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "10px 14px",
                        background: "#b45309",
                        color: "#ffffff",
                        border: "none",
                        borderRadius: "8px",
                        fontSize: "0.86rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        boxShadow: "0 2px 8px rgba(180, 83, 9, 0.25)",
                      }}
                    >
                      <Icon name="check" /> Jawab Klarifikasi BPBD Sekarang
                    </button>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "6px" }}>
                    <button
                      type="button"
                      onClick={() => openEdit(c)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "6px 10px",
                        background: "#ffffff",
                        border: "1px solid #c1c3ac",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "#013220",
                        cursor: "pointer",
                      }}
                    >
                      <Icon name="edit" /> Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeletingCase(c)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        padding: "6px 10px",
                        background: "#fff1f0",
                        border: "1px solid #ffa39e",
                        borderRadius: "8px",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        color: "#cf1322",
                        cursor: "pointer",
                      }}
                    >
                      <Icon name="trash" /> Hapus
                    </button>
                    <button
                      type="button"
                      className="btn-case-action"
                      onClick={() => handlePantau(c)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        padding: "6px 8px",
                        fontSize: "0.8rem",
                      }}
                    >
                      Pantau <Icon name="next" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CLARIFICATION MODAL */}
      {clarificationCase && (
        <CitizenClarificationModal
          caseData={clarificationCase}
          onClose={() => setClarificationCase(null)}
          onSuccess={(updated) => {
            const updatedList = allCases.map((item) => (item.id === updated.id ? updated : item));
            localStorage.setItem("reksa_cases_db", JSON.stringify(updatedList));
            if (update) {
              update(
                { casesList: updatedList, status: "Dalam Verifikasi" },
                `Jawaban klarifikasi untuk kasus ${updated.id} berhasil dikirim ke Posko BPBD.`
              );
            }
          }}
        />
      )}

      {/* MODAL EDIT DATA LANGSUNG DI DEPAN (UPDATE) */}
      {editingCase && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", maxWidth: "500px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, color: "#013220", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <Icon name="edit" /> Ubah Data Kasus {editingCase.id}
              </h3>
              <button type="button" onClick={() => setEditingCase(null)} style={{ background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer", color: "#80866e" }}>×</button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label className="form-label">Jenis Kebutuhan Bantuan</label>
                <input
                  type="text"
                  className="form-control"
                  value={editItem}
                  onChange={(e) => setEditItem(e.target.value)}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label className="form-label">Volume Kebutuhan</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editQty}
                    onChange={(e) => setEditQty(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Jumlah KK</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editKK}
                    onChange={(e) => setEditKK(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <label className="form-label">Seberapa mendesak kebutuhan ini?</label>
                <select
                  className="form-control select"
                  value={normalizeCitizenUrgency(editPriority)}
                  onChange={(e) => setEditPriority(e.target.value)}
                >
                  <option value="Sangat mendesak">Sangat mendesak (Kondisi genting / persediaan habis)</option>
                  <option value="Perlu segera">Perlu segera (Menipis dalam 1-2 hari)</option>
                  <option value="Bisa menunggu">Bisa menunggu (Masih ada sedikit persediaan)</option>
                </select>
                <small style={{ color: "#758378", marginTop: "4px", display: "block", fontSize: "0.82rem" }}>
                  Penilaian tingkat kedaruratan dari sudut pandang warga di lokasi.
                </small>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setEditingCase(null)}>Batal</Button>
              <Button onClick={saveEdit}><Icon name="check" /> Simpan Perubahan</Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI HAPUS LANGSUNG DI DEPAN (DELETE) */}
      {deletingCase && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#ffffff", borderRadius: "16px", padding: "28px", maxWidth: "440px", width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>⚠️</div>
              <h3 style={{ margin: "0 0 8px", color: "#cf1322" }}>Hapus Kasus {deletingCase.id}?</h3>
              <p style={{ margin: 0, color: "#48554a", fontSize: "0.9rem", lineHeight: 1.5 }}>
                Apakah Anda yakin ingin menghapus data kebutuhan <strong>{deletingCase.item} ({deletingCase.qty})</strong>? Data akan dihapus langsung dari daftar.
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "20px" }}>
              <Button variant="secondary" onClick={() => setDeletingCase(null)}>Batal</Button>
              <button
                type="button"
                onClick={confirmDelete}
                style={{
                  background: "#cf1322",
                  color: "#ffffff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontSize: "0.9rem",
                }}
              >
                Ya, Hapus Sekarang
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
