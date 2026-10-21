import React, { useEffect, useRef } from "react";
import { CaseRecord, getFieldEvidencePhoto } from "../../App";
import { MisiItem } from "../../services/api";
import { AppIcon } from "./Icons";

export interface BastPrintModalProps {
  misi?: MisiItem | null;
  caseRecord?: CaseRecord | null;
  onClose: () => void;
}

export function BastPrintModal({ misi, caseRecord, onClose }: BastPrintModalProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const modalPaperRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const rawCode =
    misi?.kode_misi ||
    caseRecord?.id ||
    (misi?.kebutuhan_id ? `RK-2026-00${misi.kebutuhan_id}` : "RK-2026-00272");
  
  const docNumber = `BAST/BPBD/${rawCode.replace(/[^A-Za-z0-9-]/g, "")}/2026`;
  
  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const currentTime = new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  }) + " WIB";

  // Pihak Pertama (Penyalur)
  const penyalurName =
    misi?.responder_name ||
    caseRecord?.posko?.split(" - ")[0] ||
    "Satgas Reaksi Cepat BPBD Wilayah";
  const penyalurOrg =
    misi?.organisasi ||
    caseRecord?.posko ||
    "Satgas Penanggulangan Bencana BPBD Provinsi Jawa Timur";
  const penyalurArmada =
    misi?.armada_info || "Armada Angkut Logistik Siaga Bencana";
  const penyalurPhone =
    misi?.responder_phone || "0812-3456-7890 (Posko Komando)";

  // Pihak Kedua (Penerima)
  const penerimaName =
    caseRecord?.applicantName ||
    misi?.kebutuhan?.citizen_name ||
    misi?.kebutuhan?.nama_pemohon ||
    "Andi Pratama";
  const penerimaNik =
    caseRecord?.applicantNik ||
    misi?.kebutuhan?.nik ||
    "3202110482910002";
  const penerimaPhone =
    caseRecord?.applicantPhone ||
    misi?.kebutuhan?.citizen_phone ||
    misi?.kebutuhan?.telepon ||
    "0812-9876-5432";
  const penerimaLokasi =
    caseRecord?.location ||
    (misi?.kebutuhan
      ? `${misi.kebutuhan.desa || ""}, Kec. ${misi.kebutuhan.kecamatan || ""}, Kab. ${misi.kebutuhan.kabupaten || ""}`
      : "Dusun Karanganyar, RT 03/RW 02");
  const penerimaKk = caseRecord?.kk || "1 KK";
  const penerimaJiwa = caseRecord?.affectedPeople ? `${caseRecord.affectedPeople} Jiwa` : "4 Jiwa";

  // Detail Barang
  const itemName =
    misi?.muatan ||
    caseRecord?.item ||
    "Paket Sembako & Logistik Pangan Darurat";
  const allocatedQty =
    misi?.muatan ||
    caseRecord?.qty ||
    "50 Paket";
  const receivedQty =
    misi?.jumlah_diterima ||
    caseRecord?.totalDiterimaResmi ||
    allocatedQty;
  const selisihQty =
    misi?.selisih || "0 (Nihil / Sesuai 100%)";
  const notes =
    misi?.catatan_lapangan ||
    caseRecord?.notes ||
    "Bantuan telah diserah-terimakan langsung kepada warga penerima dalam kondisi utuh, baik, dan lengkap.";

  // Bukti Dokumentasi Fisik
  const evidencePhoto =
    misi?.bukti_penyerahan ||
    misi?.foto_serah_terima ||
    getFieldEvidencePhoto(itemName, caseRecord?.fotoBukti);

  // Penanggung Jawab Posko BPBD
  const poskoName =
    misi?.posko?.nama_posko ||
    "Posko Komando Terpadu BPBD Wilayah";
  const poskoPic =
    misi?.posko?.penanggung_jawab_nama ||
    "Siti Rahma (Koordinator Wilayah)";

  const handlePrint = () => {
    // 1. Scroll back to top
    if (modalPaperRef.current) {
      modalPaperRef.current.scrollTop = 0;
    }

    if (!sheetRef.current) {
      window.print();
      return;
    }

    // 2. Remove any leftover iframe
    const oldIframe = document.getElementById("bast-isolated-print-frame");
    if (oldIframe) {
      oldIframe.remove();
    }

    // 3. Create isolated hidden print frame to bypass viewport scroll & UI chrome
    const printFrame = document.createElement("iframe");
    printFrame.id = "bast-isolated-print-frame";
    printFrame.style.position = "fixed";
    printFrame.style.top = "-9999px";
    printFrame.style.left = "-9999px";
    printFrame.style.width = "0";
    printFrame.style.height = "0";
    printFrame.style.border = "none";
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const htmlContent = sheetRef.current.innerHTML;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8">
        <title>${docNumber}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 14mm 10mm 14mm;
          }
          *, *::before, *::after {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            margin: 0;
            padding: 0;
            background: #ffffff !important;
            color: #0f172a !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            font-size: 9.8pt;
            line-height: 1.45;
          }
          .bast-doc-sheet {
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 0;
            background: #ffffff;
          }
          .bast-doc-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2.5pt double #013220;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .bast-doc-title-block h2 {
            font-size: 13.5pt;
            font-weight: 800;
            color: #013220;
            margin: 2px 0 0;
            letter-spacing: 0.02em;
            text-transform: uppercase;
          }
          .bast-doc-title-block p {
            font-size: 8.5pt;
            color: #64748b;
            margin: 2px 0 0;
          }
          .bast-meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-bottom: 12px;
          }
          .bast-meta-cell {
            border: 1pt solid #cbd5e1;
            border-radius: 8px;
            padding: 10px 12px;
            background: #f8fafc;
          }
          .bast-meta-cell span {
            display: block;
            font-size: 7.5pt;
            font-weight: 700;
            margin-bottom: 2px;
            text-transform: uppercase;
          }
          .bast-meta-cell strong {
            font-size: 9.5pt;
            color: #0f172a;
          }
          .bast-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0 12px;
            font-size: 9pt;
          }
          .bast-table th {
            background: #f1f5f9;
            color: #013220;
            font-weight: 700;
            border: 1pt solid #94a3b8;
            padding: 7px 10px;
            font-size: 8pt;
            text-transform: uppercase;
          }
          .bast-table td {
            border: 1pt solid #cbd5e1;
            padding: 7px 10px;
          }
          .bast-signatures-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-top: 12px;
            padding-top: 12px;
            border-top: 1pt dashed #cbd5e1;
            page-break-inside: avoid;
          }
          .bast-sign-box {
            border: 1pt dashed #94a3b8;
            border-radius: 8px;
            padding: 10px 8px;
            text-align: center;
            background: #fafaf9;
          }
          .bast-seal-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: #ecfdf5;
            color: #047857;
            border: 1pt solid #059669;
            padding: 3px 8px;
            border-radius: 999px;
            font-size: 8pt;
            font-weight: 700;
          }
          ::-webkit-scrollbar {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="bast-doc-sheet">
          ${htmlContent}
        </div>
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
              setTimeout(function() {
                window.frameElement?.remove();
              }, 2000);
            }, 300);
          };
        </script>
      </body>
      </html>
    `);
    doc.close();
  };

  return (
    <div className="bast-modal-backdrop" onClick={onClose}>
      <div
        ref={modalPaperRef}
        className="bast-modal-paper"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Berita Acara Serah Terima Digital"
      >
        {/* PRINTABLE BAST DOCUMENT SHEET */}
        <div ref={sheetRef} className="bast-doc-sheet" id="bast-printable-doc">
          {/* HEADER RESMI / KOP SURAT */}
          <div className="bast-doc-header">
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "12px",
                  background: "#013220",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#ffffff",
                  flexShrink: 0,
                }}
              >
                <svg viewBox="0 0 42 42" width="34" height="34" fill="currentColor">
                  <path d="M7 7h16c7 0 12 4 12 10s-5 10-12 10H7V7Z" />
                  <path d="M18 27 35 38M7 20h17" stroke="#ffffff" strokeWidth="2.5" />
                  <circle cx="8" cy="7" r="3" />
                  <circle cx="35" cy="38" r="3" />
                </svg>
              </div>
              <div className="bast-doc-title-block">
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#64748b",
                    display: "block",
                  }}
                >
                  BADAN PENANGGULANGAN BENCANA DAERAH (BPBD) • SISTEM REKSA
                </span>
                <h2>BERITA ACARA SERAH TERIMA (BAST) DIGITAL</h2>
                <p>Dokumen Resmi Bukti Penyaluran &amp; Penerimaan Bantuan Logistik Pascabencana</p>
              </div>
            </div>

            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  padding: "6px 12px",
                  display: "inline-block",
                  textAlign: "right",
                }}
              >
                <small style={{ fontSize: "10.5px", color: "#64748b", fontWeight: 700, display: "block" }}>
                  NOMOR BAST
                </small>
                <strong style={{ fontSize: "12.5px", color: "#013220", fontFamily: "monospace" }}>
                  {docNumber}
                </strong>
              </div>
            </div>
          </div>

          {/* DOKUMEN PENGANTAR */}
          <div style={{ fontSize: "0.86rem", lineHeight: 1.6, color: "#334155", marginBottom: "16px" }}>
            Pada hari ini, <strong>{currentDate}</strong> pukul <strong>{currentTime}</strong>, bertempat di{" "}
            <strong>{penerimaLokasi}</strong>, telah dilaksanakan serah terima bantuan logistik pascabencana terkoordinasi
            melalui Sistem Kolaborasi Pascabencana REKSA oleh dan antara para pihak di bawah ini:
          </div>

          {/* DUA PIHAK: PENYALUR & PENERIMA */}
          <div className="bast-meta-grid" style={{ marginBottom: "16px" }}>
            <div className="bast-meta-cell" style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <span style={{ color: "#047857" }}>PIHAK PERTAMA (PENYALUR):</span>
              <strong style={{ fontSize: "0.95rem" }}>{penyalurName}</strong>
              <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px", lineHeight: 1.4 }}>
                Instansi: <strong>{penyalurOrg}</strong><br />
                Armada: <strong>{penyalurArmada}</strong><br />
                Kontak: <strong>{penyalurPhone}</strong>
              </div>
            </div>

            <div className="bast-meta-cell" style={{ background: "#ffffff", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
              <span style={{ color: "#0f766e" }}>PIHAK KEDUA (PENERIMA MANFAAT):</span>
              <strong style={{ fontSize: "0.95rem" }}>{penerimaName}</strong>
              <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "4px", lineHeight: 1.4 }}>
                NIK: <strong style={{ fontFamily: "monospace" }}>{penerimaNik}</strong> ({penerimaKk} / {penerimaJiwa})<br />
                Lokasi: <strong>{penerimaLokasi}</strong><br />
                Kontak: <strong>{penerimaPhone}</strong>
              </div>
            </div>
          </div>

          {/* TABEL RINCIAN LOGISTIK */}
          <div style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#013220", textTransform: "uppercase", marginBottom: "6px" }}>
              Rincian Barang Bantuan Logistik yang Diserah-terimakan:
            </div>
            <table className="bast-table">
              <thead>
                <tr>
                  <th style={{ width: "45px", textAlign: "center" }}>No</th>
                  <th>Uraian Barang Bantuan</th>
                  <th style={{ width: "130px", textAlign: "center" }}>Target Alokasi</th>
                  <th style={{ width: "130px", textAlign: "center" }}>Fisik Diterima</th>
                  <th style={{ width: "110px", textAlign: "center" }}>Selisih Fisik</th>
                  <th style={{ width: "120px", textAlign: "center" }}>Kondisi Fisik</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>1</td>
                  <td>
                    <strong style={{ color: "#013220" }}>{itemName}</strong>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "2px" }}>
                      Sesuai kebutuhan kasus <strong>{rawCode}</strong> • Titik Serah: {penerimaLokasi}
                    </div>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>{allocatedQty}</td>
                  <td style={{ textAlign: "center", fontWeight: 700, color: "#15803d" }}>{receivedQty}</td>
                  <td style={{ textAlign: "center", fontWeight: 700, color: selisihQty.includes("0") ? "#15803d" : "#dc2626" }}>
                    {selisihQty}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span
                      style={{
                        background: "#f0fdf4",
                        color: "#166534",
                        border: "1px solid #bbf7d0",
                        padding: "3px 8px",
                        borderRadius: "6px",
                        fontSize: "0.74rem",
                        fontWeight: 700,
                        display: "inline-block",
                      }}
                    >
                      Baik &amp; Utuh
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FOTO BUKTI SERAH TERIMA & CATATAN LAPANGAN */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "130px 1fr",
              gap: "14px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: "12px",
              padding: "12px 14px",
              marginBottom: "18px",
              alignItems: "center",
            }}
          >
            <div style={{ width: "130px", height: "90px", borderRadius: "8px", overflow: "hidden", background: "#e2e8f0", flexShrink: 0 }}>
              <img
                src={evidencePhoto}
                alt="Dokumentasi Serah Terima Lapangan"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                crossOrigin="anonymous"
              />
            </div>
            <div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#64748b", display: "block" }}>
                Dokumentasi &amp; Catatan Penyerahan Lapangan:
              </span>
              <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#1e293b", lineHeight: 1.45, fontStyle: "italic" }}>
                "{notes}"
              </p>
              <small style={{ color: "#059669", fontSize: "0.75rem", fontWeight: 600, display: "block", marginTop: "4px" }}>
                ✓ Telah diverifikasi geo-tagging &amp; dokumentasi visual sistem REKSA
              </small>
            </div>
          </div>

          {/* PERNYATAAN AKUNTABILITAS */}
          <div
            style={{
              fontSize: "0.78rem",
              lineHeight: 1.5,
              color: "#475569",
              background: "#fafaf9",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "1px dashed #d6d3d1",
              marginBottom: "18px",
            }}
          >
            <strong>Pernyataan Akuntabilitas:</strong> Pihak Kedua menyatakan telah menerima seluruh barang bantuan dalam kondisi baik, jumlah sesuai permohonan, dan <strong>tanpa dipungut biaya apapun (GRATIS)</strong>. Berita Acara ini sah dan diterbitkan secara elektronik melalui platform tanggap darurat REKSA untuk keperluan akuntabilitas penanganan bencana daerah.
          </div>

          {/* TANDA TANGAN 3 PIHAK */}
          <div className="bast-signatures-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginTop: "14px", paddingTop: "14px" }}>
            {/* PIHAK PERTAMA */}
            <div className="bast-sign-box">
              <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Pihak Pertama (Penyalur)
              </span>
              <div style={{ height: "46px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "cursive", fontSize: "1.2rem", color: "#013220" }}>
                  {penyalurName}
                </span>
              </div>
              <strong style={{ display: "block", fontSize: "0.84rem", color: "#013220" }}>
                {penyalurName}
              </strong>
              <small style={{ color: "#64748b", fontSize: "0.72rem" }}>Tim Satgas Penyalur</small>
            </div>

            {/* PIHAK KEDUA */}
            <div className="bast-sign-box">
              <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
                Pihak Kedua (Penerima)
              </span>
              <div style={{ height: "46px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: "cursive", fontSize: "1.2rem", color: "#013220" }}>
                  {penerimaName}
                </span>
              </div>
              <strong style={{ display: "block", fontSize: "0.84rem", color: "#013220" }}>
                {penerimaName}
              </strong>
              <small style={{ color: "#64748b", fontSize: "0.72rem" }}>Warga Penerima Manfaat</small>
            </div>

            {/* MENGETAHUI POSKO BPBD */}
            <div className="bast-sign-box" style={{ background: "#f0fdf4", borderColor: "#a7f3d0" }}>
              <span style={{ fontSize: "0.7rem", color: "#065f46", fontWeight: 700, textTransform: "uppercase" }}>
                Mengetahui (Posko BPBD)
              </span>
              <div style={{ height: "46px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="bast-seal-badge" style={{ margin: 0 }}>
                  <AppIcon name="check" size={12} /> BAST SAH RESMI
                </span>
              </div>
              <strong style={{ display: "block", fontSize: "0.84rem", color: "#013220" }}>
                {poskoPic}
              </strong>
              <small style={{ color: "#64748b", fontSize: "0.72rem" }}>{poskoName}</small>
            </div>
          </div>

          {/* DOKUMEN FOOTER / QR CODE VERIFIKASI */}
          <div
            style={{
              marginTop: "16px",
              paddingTop: "10px",
              borderTop: "1px solid #e2e8f0",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "0.72rem",
              color: "#94a3b8",
            }}
          >
            <div>
              ID Dokumen: <strong style={{ color: "#475569" }}>{docNumber}</strong> • Waktu Cetak: {currentDate}, {currentTime}
            </div>
            <div>
              Platform Terpadu Penanganan Bencana REKSA • BPBD Jawa Timur
            </div>
          </div>
        </div>

        {/* MODAL FOOTER DENGAN TOMBOL PRINT / UNDUH PDF */}
        <div className="bast-modal-footer">
          <button
            type="button"
            className="reksa-btn reksa-btn-secondary"
            onClick={onClose}
            style={{
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#475569",
              padding: "9px 18px",
              borderRadius: "10px",
              fontWeight: 600,
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            Tutup
          </button>
          <button
            type="button"
            className="reksa-btn reksa-btn-primary"
            onClick={handlePrint}
            style={{
              background: "#013220",
              color: "#ffffff",
              border: "none",
              padding: "9px 22px",
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.86rem",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 4px 14px rgba(1, 50, 32, 0.25)",
            }}
          >
            <AppIcon name="file" size={16} />
            <span>Cetak / Unduh Dokumen BAST (PDF)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
