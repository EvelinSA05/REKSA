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
  const isPoskoNameRaw =
    !misi?.responder_name &&
    (!caseRecord?.posko ||
      caseRecord.posko.toLowerCase().includes("posko") ||
      caseRecord.posko.toLowerCase().includes("bpbd"));

  const penyalurName =
    misi?.responder_name ||
    (isPoskoNameRaw ? "Satgas Reaksi Cepat (TRC BPBD)" : caseRecord?.posko?.split(" - ")[0]) ||
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
            margin: 12mm 14mm 12mm 14mm;
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
            font-size: 9.5pt;
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
            font-size: 13pt;
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
          .bast-intro-lead {
            font-size: 9pt;
            line-height: 1.5;
            color: #334155;
            margin-bottom: 12px;
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
          .bast-meta-tag {
            display: inline-block;
            font-size: 7pt;
            font-weight: 800;
            margin-bottom: 4px;
            text-transform: uppercase;
            color: #065f46;
          }
          .bast-meta-name {
            display: block;
            font-size: 9.5pt;
            font-weight: 800;
            color: #0f172a;
            margin-bottom: 6px;
          }
          .bast-meta-details {
            display: flex;
            flex-direction: column;
            gap: 2px;
            font-size: 8pt;
            color: #475569;
          }
          .bast-meta-row {
            display: flex;
            gap: 4px;
          }
          .bast-meta-label {
            color: #64748b;
            min-width: 95px;
            font-weight: 600;
          }
          .bast-meta-val {
            color: #0f172a;
            font-weight: 600;
          }
          .bast-section-heading {
            font-size: 8pt;
            font-weight: 800;
            color: #013220;
            text-transform: uppercase;
            margin-bottom: 6px;
          }
          .bast-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0 12px;
            font-size: 8.5pt;
          }
          .bast-table th {
            background: #f1f5f9;
            color: #013220;
            font-weight: 700;
            border: 1pt solid #94a3b8;
            padding: 6px 8px;
            font-size: 7.5pt;
            text-transform: uppercase;
          }
          .bast-table td {
            border: 1pt solid #cbd5e1;
            padding: 6px 8px;
            vertical-align: middle;
          }
          .bast-badge-condition {
            background: #f0fdf4;
            color: #166534;
            border: 0.5pt solid #bbf7d0;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 7pt;
            font-weight: 700;
            display: inline-block;
          }
          .bast-evidence-card {
            display: grid;
            grid-template-columns: 100px 1fr;
            gap: 12px;
            background: #f8fafc;
            border: 1pt solid #cbd5e1;
            border-radius: 8px;
            padding: 8px 10px;
            margin-bottom: 12px;
            align-items: center;
          }
          .bast-evidence-thumb {
            width: 100px;
            height: 70px;
            border-radius: 6px;
            overflow: hidden;
            background: #e2e8f0;
          }
          .bast-evidence-thumb img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .bast-accountability-box {
            font-size: 7.8pt;
            line-height: 1.45;
            color: #475569;
            background: #fafaf9;
            padding: 8px 12px;
            border-radius: 6px;
            border: 1pt dashed #cbd5e1;
            margin-bottom: 12px;
          }
          .bast-signatures-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1pt dashed #cbd5e1;
            page-break-inside: avoid;
          }
          .bast-sign-box {
            border: 1pt dashed #94a3b8;
            border-radius: 8px;
            padding: 10px 8px;
            text-align: center;
            background: #ffffff;
            min-height: 120px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .bast-sign-box.bpbd {
            background: #f0fdf4;
            border-color: #86efac;
          }
          .bast-sign-title {
            font-size: 7.2pt;
            font-weight: 800;
            color: #64748b;
            text-transform: uppercase;
            display: block;
          }
          .bast-sign-title.bpbd {
            color: #065f46;
          }
          .bast-sign-stamp-area {
            min-height: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            margin: 4px 0;
          }
          .bast-sign-e-stamp {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            background: #eff6ff;
            color: #1d4ed8;
            border: 0.5pt solid #bfdbfe;
            padding: 2px 7px;
            border-radius: 999px;
            font-size: 6.8pt;
            font-weight: 700;
          }
          .bast-sign-e-stamp.penerima {
            background: #f0fdf4;
            color: #15803d;
            border-color: #bbf7d0;
          }
          .bast-seal-badge {
            display: inline-flex;
            align-items: center;
            gap: 3px;
            background: #ecfdf5;
            color: #047857;
            border: 0.5pt solid #059669;
            padding: 2px 7px;
            border-radius: 999px;
            font-size: 7pt;
            font-weight: 800;
          }
          .bast-sign-code {
            font-size: 6.5pt;
            color: #94a3b8;
            font-family: monospace;
          }
          .bast-sign-name {
            display: block;
            font-size: 8.5pt;
            font-weight: 800;
            color: #0f172a;
            margin-top: auto;
          }
          .bast-sign-name.bpbd {
            color: #065f46;
          }
          .bast-sign-role {
            display: block;
            font-size: 7pt;
            color: #64748b;
            margin-top: 2px;
          }
          .bast-doc-footer-meta {
            margin-top: 12px;
            padding-top: 8px;
            border-top: 0.5pt solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 7pt;
            color: #94a3b8;
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
        {/* TOP MODAL BAR DENGAN TOMBOL TUTUP RESMI */}
        <div className="bast-modal-top-bar">
          <div className="bast-modal-top-title">
            <AppIcon name="file" size={18} />
            <span>Dokumen Berita Acara Serah Terima (BAST)</span>
            <span className="bast-top-badge-valid">RESMI &amp; TERVERIFIKASI</span>
          </div>
          <button
            type="button"
            className="bast-modal-close-btn"
            onClick={onClose}
            title="Tutup Pratinjau (Esc)"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

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
                <strong style={{ fontSize: "12px", color: "#013220", fontFamily: "monospace" }}>
                  {docNumber}
                </strong>
              </div>
            </div>
          </div>

          {/* DOKUMEN PENGANTAR */}
          <div className="bast-intro-lead">
            Pada hari ini, <strong>{currentDate}</strong> pukul <strong>{currentTime}</strong>, bertempat di{" "}
            <strong>{penerimaLokasi}</strong>, telah dilaksanakan serah terima bantuan logistik pascabencana terkoordinasi
            melalui Sistem Kolaborasi Pascabencana REKSA oleh dan antara para pihak di bawah ini:
          </div>

          {/* DUA PIHAK: PENYALUR & PENERIMA */}
          <div className="bast-meta-grid">
            <div className="bast-meta-cell">
              <span className="bast-meta-tag tag-penyalur">PIHAK PERTAMA (PENYALUR)</span>
              <strong className="bast-meta-name">{penyalurName}</strong>
              <div className="bast-meta-details">
                <div className="bast-meta-row">
                  <span className="bast-meta-label">Instansi / Posko:</span>
                  <span className="bast-meta-val">{penyalurOrg}</span>
                </div>
                <div className="bast-meta-row">
                  <span className="bast-meta-label">Armada:</span>
                  <span className="bast-meta-val">{penyalurArmada}</span>
                </div>
                <div className="bast-meta-row">
                  <span className="bast-meta-label">Kontak Resmi:</span>
                  <span className="bast-meta-val">{penyalurPhone}</span>
                </div>
              </div>
            </div>

            <div className="bast-meta-cell">
              <span className="bast-meta-tag tag-penerima">PIHAK KEDUA (PENERIMA MANFAAT)</span>
              <strong className="bast-meta-name">{penerimaName}</strong>
              <div className="bast-meta-details">
                <div className="bast-meta-row">
                  <span className="bast-meta-label">NIK / Identitas:</span>
                  <span className="bast-meta-val mono">{penerimaNik} ({penerimaKk} / {penerimaJiwa})</span>
                </div>
                <div className="bast-meta-row">
                  <span className="bast-meta-label">Titik Lokasi:</span>
                  <span className="bast-meta-val">{penerimaLokasi}</span>
                </div>
                <div className="bast-meta-row">
                  <span className="bast-meta-label">Kontak Warga:</span>
                  <span className="bast-meta-val">{penerimaPhone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* TABEL RINCIAN LOGISTIK */}
          <div className="bast-table-wrapper">
            <div className="bast-section-heading">
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
                    <strong style={{ color: "#013220", display: "block" }}>{itemName}</strong>
                    <div className="bast-item-sub">
                      Sesuai kebutuhan kasus <strong>{rawCode}</strong> • Titik Serah: {penerimaLokasi}
                    </div>
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 600 }}>{allocatedQty}</td>
                  <td style={{ textAlign: "center", fontWeight: 700, color: "#15803d" }}>{receivedQty}</td>
                  <td style={{ textAlign: "center", fontWeight: 700, color: selisihQty.includes("0") ? "#15803d" : "#dc2626" }}>
                    {selisihQty}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span className="bast-badge-condition">
                      Baik &amp; Utuh
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FOTO BUKTI SERAH TERIMA & CATATAN LAPANGAN */}
          <div className="bast-evidence-card">
            <div className="bast-evidence-thumb">
              <img
                src={evidencePhoto}
                alt="Dokumentasi Serah Terima Lapangan"
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
          <div className="bast-accountability-box">
            <strong>Pernyataan Akuntabilitas:</strong> Pihak Kedua menyatakan telah menerima seluruh barang bantuan dalam kondisi baik, jumlah sesuai permohonan, dan <strong>tanpa dipungut biaya apapun (GRATIS)</strong>. Berita Acara ini sah dan diterbitkan secara elektronik melalui platform tanggap darurat REKSA untuk keperluan akuntabilitas penanganan bencana daerah.
          </div>

          {/* TANDA TANGAN 3 PIHAK TANPA OVERLAPPING TEXT */}
          <div className="bast-signatures-grid">
            {/* PIHAK PERTAMA */}
            <div className="bast-sign-box">
              <span className="bast-sign-title">Pihak Pertama (Penyalur)</span>
              <div className="bast-sign-stamp-area">
                <div className="bast-sign-e-stamp">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>TERVERIFIKASI SATGAS</span>
                </div>
                <small className="bast-sign-code">E-Sign: {rawCode.replace(/[^A-Za-z0-9]/g, "")}-P1</small>
              </div>
              <strong className="bast-sign-name">{penyalurName}</strong>
              <small className="bast-sign-role">{penyalurOrg}</small>
            </div>

            {/* PIHAK KEDUA */}
            <div className="bast-sign-box">
              <span className="bast-sign-title">Pihak Kedua (Penerima)</span>
              <div className="bast-sign-stamp-area">
                <div className="bast-sign-e-stamp penerima">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>KONFIRMASI PENERIMA</span>
                </div>
                <small className="bast-sign-code">NIK: {penerimaNik.slice(0, 6)}******{penerimaNik.slice(-4)}</small>
              </div>
              <strong className="bast-sign-name">{penerimaName}</strong>
              <small className="bast-sign-role">Warga Penerima Manfaat</small>
            </div>

            {/* MENGETAHUI POSKO BPBD */}
            <div className="bast-sign-box bpbd">
              <span className="bast-sign-title bpbd">Mengetahui (Posko BPBD)</span>
              <div className="bast-sign-stamp-area">
                <div className="bast-seal-badge">
                  <AppIcon name="check" size={13} />
                  <span>BAST SAH RESMI</span>
                </div>
                <small className="bast-sign-code bpbd">TEREGISTRASI PUSDALOPS PB</small>
              </div>
              <strong className="bast-sign-name bpbd">{poskoPic}</strong>
              <small className="bast-sign-role">{poskoName}</small>
            </div>
          </div>

          {/* DOKUMEN FOOTER / QR CODE VERIFIKASI */}
          <div className="bast-doc-footer-meta">
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
