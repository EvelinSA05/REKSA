import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const markdownPath = path.join(rootDir, 'PRD.md');
const tempHtmlPath = path.join(rootDir, 'PRD_Document_Print.html');
const outputPdfPath = path.join(rootDir, 'PRD-REKSA.pdf');

if (!fs.existsSync(markdownPath)) {
  console.error('File PRD.md tidak ditemukan!');
  process.exit(1);
}

const markdownContent = fs.readFileSync(markdownPath, 'utf-8');

// Konfigurasi marked
marked.setOptions({
  gfm: true,
  breaks: true,
});

const htmlContent = marked.parse(markdownContent);

const fullHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>PRD - REKSA (Ruang Ekosistem Kolaborasi Pascabencana)</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 15mm 18mm 15mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #1e293b;
      background: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Cover Page Styling */
    .cover-page {
      page-break-after: always;
      padding: 40px 25px 40px 30px;
      border-left: 8px solid #013220;
      background: #ffffff;
      margin-bottom: 20px;
    }

    .cover-badge {
      display: inline-block;
      background: #ecfdf5;
      color: #013220;
      border: 1.5px solid #10b981;
      padding: 5px 16px;
      border-radius: 999px;
      font-size: 9pt;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 24px;
    }

    .cover-title {
      font-size: 28pt;
      font-weight: 800;
      color: #013220;
      line-height: 1.15;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .cover-subtitle-app {
      font-size: 16pt;
      font-weight: 700;
      color: #059669;
      margin-bottom: 14px;
    }

    .cover-subtitle-desc {
      font-size: 11.5pt;
      color: #475569;
      font-weight: 500;
      line-height: 1.5;
      margin-bottom: 35px;
    }

    .cover-meta-box {
      background: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      padding: 18px 22px;
      margin: 30px 0;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: 150px 1fr;
      row-gap: 10px;
      font-size: 9.5pt;
    }

    .cover-meta-label {
      color: #64748b;
      font-weight: 600;
    }

    .cover-meta-value {
      color: #0f172a;
      font-weight: 700;
    }

    .cover-footer {
      font-size: 9pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
    }

    /* Content Typography */
    .content-body {
      padding-top: 10px;
    }

    h1 {
      font-size: 16pt;
      font-weight: 800;
      color: #013220;
      margin-top: 24pt;
      margin-bottom: 12pt;
      padding-bottom: 6pt;
      border-bottom: 2.5px solid #10b981;
      page-break-after: avoid;
      break-after: avoid;
      letter-spacing: -0.01em;
    }

    h2 {
      font-size: 13pt;
      font-weight: 800;
      color: #013220;
      margin-top: 18pt;
      margin-bottom: 8pt;
      page-break-after: avoid;
      break-after: avoid;
      border-left: 4px solid #10b981;
      padding-left: 8px;
    }

    h3 {
      font-size: 11pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 14pt;
      margin-bottom: 6pt;
      page-break-after: avoid;
      break-after: avoid;
    }

    h4 {
      font-size: 10pt;
      font-weight: 700;
      color: #334155;
      margin-top: 10pt;
      margin-bottom: 4pt;
      page-break-after: avoid;
      break-after: avoid;
    }

    p {
      margin-bottom: 10pt;
      color: #334155;
      text-align: justify;
    }

    ul, ol {
      margin-left: 20px;
      margin-bottom: 10pt;
      color: #334155;
    }

    li {
      margin-bottom: 4pt;
    }

    strong {
      color: #0f172a;
      font-weight: 700;
    }

    hr {
      border: none;
      border-top: 1px solid #e2e8f0;
      margin: 18pt 0;
    }

    /* Tables */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0 16pt;
      font-size: 8.5pt;
      page-break-inside: avoid;
      break-inside: avoid;
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
    }

    th {
      background: #013220 !important;
      color: #ffffff !important;
      font-weight: 700;
      text-align: left;
      padding: 7pt 9pt;
      border: 1px solid #013220;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    td {
      padding: 6pt 9pt;
      border: 1px solid #e2e8f0;
      vertical-align: top;
      color: #334155;
    }

    tr:nth-child(even) {
      background: #f8fafc !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Code & ASCII Diagrams */
    pre {
      background: #f8fafc !important;
      color: #0f172a !important;
      padding: 10pt 12pt;
      border-radius: 6px;
      border: 1.5px solid #cbd5e1;
      font-family: Consolas, 'Courier New', Monaco, monospace;
      font-size: 7.5pt;
      line-height: 1.45;
      margin: 10pt 0 14pt;
      page-break-inside: avoid;
      break-inside: avoid;
      white-space: pre;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    code {
      font-family: Consolas, 'Courier New', Monaco, monospace;
      font-size: 8.5pt;
      background: #f1f5f9;
      color: #013220;
      padding: 1pt 4pt;
      border-radius: 3px;
      border: 1px solid #e2e8f0;
    }

    pre code {
      background: transparent;
      padding: 0;
      border: none;
      color: inherit;
    }

    /* Blockquote / Notes */
    blockquote {
      border-left: 3px solid #10b981;
      background: #f0fdf4 !important;
      padding: 8pt 12pt;
      margin: 10pt 0;
      border-radius: 0 6px 6px 0;
      font-size: 9pt;
      color: #166534;
      page-break-inside: avoid;
      break-inside: avoid;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-badge">Dokumen Resmi Produk Kebencanaan</div>
    <div class="cover-title">REKSA</div>
    <div class="cover-subtitle-app">
      Ruang Ekosistem Kolaborasi Pascabencana
    </div>
    <div class="cover-subtitle-desc">
      Product Requirements Document (PRD) — Cetak Biru Fungsional, Arsitektur Sistem, Mesin Alokasi Logistik, dan Integritas Rantai Pasok Penanggulangan Bencana
    </div>

    <div class="cover-meta-box">
      <div class="cover-meta-grid">
        <div class="cover-meta-label">Kode Dokumen:</div>
        <div class="cover-meta-value">PRD-REKSA-2026-V1.0</div>

        <div class="cover-meta-label">Versi Dokumen:</div>
        <div class="cover-meta-value">1.0.0 (Comprehensive Release)</div>

        <div class="cover-meta-label">Status:</div>
        <div class="cover-meta-value">Disetujui (Approved & Baseline)</div>

        <div class="cover-meta-label">Tanggal Efektif:</div>
        <div class="cover-meta-value">21 Oktober 2026</div>

        <div class="cover-meta-label">Klasifikasi:</div>
        <div class="cover-meta-value">Terbuka / Tim Teknis & Pemangku Kepentingan</div>

        <div class="cover-meta-label">Repositori Proyek:</div>
        <div class="cover-meta-value">https://github.com/Septian-wq11/REKSA</div>
      </div>
    </div>

    <div class="cover-footer">
      <div>Sistem Informasi Penanggulangan Bencana Terpadu</div>
      <div>Hal. 1 (Cover)</div>
    </div>
  </div>

  <!-- Document Body Content -->
  <div class="content-body">
    ${htmlContent}
  </div>

</body>
</html>
`;

fs.writeFileSync(tempHtmlPath, fullHtml, 'utf-8');
console.log('HTML berhasil dibuat di:', tempHtmlPath);

// Path executable Edge
const edgePaths = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
];

const edgeBin = edgePaths.find(p => fs.existsSync(p));

if (!edgeBin) {
  console.error('Browser Microsoft Edge tidak ditemukan di path sistem default!');
  process.exit(1);
}

console.log('Mengonversi HTML ke PDF menggunakan Microsoft Edge Headless...');
const fileUrl = 'file:///' + tempHtmlPath.replace(/\\/g, '/');

const command = `"${edgeBin}" --headless --disable-gpu --no-pdf-header-footer --virtual-time-budget=5000 --print-to-pdf="${outputPdfPath}" "${fileUrl}"`;

try {
  execSync(command, { stdio: 'inherit' });
  if (fs.existsSync(outputPdfPath)) {
    const stats = fs.statSync(outputPdfPath);
    console.log(`\nBERHASIL: File PDF berhasil digenerate!`);
    console.log(`Lokasi: ${outputPdfPath}`);
    console.log(`Ukuran: ${(stats.size / 1024).toFixed(2)} KB`);
  } else {
    console.error('Gagal: File PDF tidak ditemukan setelah eksekusi Edge.');
    process.exit(1);
  }
} catch (err) {
  console.error('Terjadi kesalahan saat generate PDF:', err);
  process.exit(1);
} finally {
  console.log('Proses selesai.');
}
