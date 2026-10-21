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
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

    @page {
      size: A4;
      margin: 20mm 15mm 20mm 15mm;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.55;
      color: #1e293b;
      background: #ffffff;
    }

    /* Cover Page Styling */
    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 250mm;
      padding: 30mm 10mm 20mm 10mm;
      border-left: 8px solid #013220;
      padding-left: 25px;
    }

    .cover-badge {
      display: inline-block;
      background: #ecfdf5;
      color: #013220;
      border: 1px solid #10b981;
      padding: 4px 14px;
      border-radius: 999px;
      font-size: 8.5pt;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin-bottom: 25px;
    }

    .cover-title {
      font-size: 26pt;
      font-weight: 800;
      color: #013220;
      line-height: 1.2;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
    }

    .cover-subtitle {
      font-size: 13pt;
      color: #475569;
      font-weight: 500;
      line-height: 1.4;
      margin-bottom: 35px;
    }

    .cover-meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px 20px;
      margin-top: 20px;
    }

    .cover-meta-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      row-gap: 8px;
      font-size: 9pt;
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
      font-size: 8.5pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 15px;
      display: flex;
      justify-content: space-between;
    }

    /* Content Typography */
    h1 {
      font-size: 16pt;
      font-weight: 800;
      color: #013220;
      margin-top: 26pt;
      margin-bottom: 12pt;
      padding-bottom: 6pt;
      border-bottom: 2px solid #10b981;
      page-break-after: avoid;
      letter-spacing: -0.01em;
    }

    h2 {
      font-size: 13pt;
      font-weight: 800;
      color: #013220;
      margin-top: 20pt;
      margin-bottom: 8pt;
      page-break-after: avoid;
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
    }

    h4 {
      font-size: 10pt;
      font-weight: 700;
      color: #334155;
      margin-top: 10pt;
      margin-bottom: 4pt;
      page-break-after: avoid;
    }

    p {
      margin-bottom: 9pt;
      color: #334155;
      text-align: justify;
    }

    ul, ol {
      margin-left: 18px;
      margin-bottom: 9pt;
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
      border-radius: 6px;
      overflow: hidden;
      box-shadow: 0 0 0 1px #cbd5e1;
    }

    th {
      background: #013220;
      color: #ffffff;
      font-weight: 700;
      text-align: left;
      padding: 7pt 9pt;
      border: 1px solid #013220;
    }

    td {
      padding: 6pt 9pt;
      border: 1px solid #e2e8f0;
      vertical-align: top;
      color: #334155;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    /* Code & ASCII Diagrams */
    pre {
      background: #f1f5f9;
      color: #0f172a;
      padding: 10pt 12pt;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 7.5pt;
      line-height: 1.45;
      overflow-x: auto;
      margin: 10pt 0 14pt;
      page-break-inside: avoid;
      white-space: pre;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
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
      background: #f0fdf4;
      padding: 8pt 12pt;
      margin: 10pt 0;
      border-radius: 0 6px 6px 0;
      font-size: 9pt;
      color: #166534;
      page-break-inside: avoid;
    }

    /* Header & Footer in Print */
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .page-break {
        page-break-before: always;
      }
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div>
      <div class="cover-badge">Dokumen Resmi Produk Kebencanaan</div>
      <div class="cover-title">REKSA</div>
      <div style="font-size: 15pt; font-weight: 700; color: #10b981; margin-bottom: 6px;">
        Ruang Ekosistem Kolaborasi Pascabencana
      </div>
      <div class="cover-subtitle">
        Product Requirements Document (PRD) — Cetak Biru Fungsional, Arsitektur Sistem, Mesin Alokasi Logistik, dan Integritas Rantai Pasok Penanggulangan Bencana
      </div>
    </div>

    <div>
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
console.log('HTML sementara berhasil dibuat di:', tempHtmlPath);

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

const command = `"${edgeBin}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${outputPdfPath}" "${fileUrl}"`;

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
  // Bersihkan file HTML temporary jika diinginkan atau pertahankan untuk preview
  console.log('Proses selesai.');
}
