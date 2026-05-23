/**
 * Print & Export Utilities for E-Tamu BKAD
 * Provides PDF, Excel/CSV, and Print functionality
 */

/**
 * Generate a print-friendly HTML document and open print dialog
 */
export function printReport(options: {
  title: string
  subtitle?: string
  contentHtml: string
  headerHtml?: string
}) {
  const printWindow = window.open('', '_blank')
  if (!printWindow) {
    alert('Pop-up diblokir. Harap izinkan pop-up untuk mencetak laporan.')
    return
  }

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${options.title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #1a1a2e;
          background: #fff;
          padding: 20px;
          font-size: 12px;
          line-height: 1.5;
        }

        @media print {
          body { padding: 0; }
          .no-print { display: none !important; }
          .page-break { page-break-before: always; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; page-break-after: auto; }
          thead { display: table-header-group; }
        }

        .print-header {
          display: flex;
          align-items: center;
          gap: 16px;
          border-bottom: 3px double #0c2d57;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }

        .print-header .logo-area {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .print-header .logo-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: #0c2d57;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #c9a84c;
          font-size: 24px;
          font-weight: 700;
          flex-shrink: 0;
        }

        .print-header .header-text h1 {
          font-size: 16px;
          font-weight: 700;
          color: #0c2d57;
          letter-spacing: 0.5px;
        }

        .print-header .header-text h2 {
          font-size: 12px;
          font-weight: 500;
          color: #c9a84c;
          margin-top: 2px;
        }

        .print-header .header-text p {
          font-size: 10px;
          color: #666;
          margin-top: 2px;
        }

        .print-title-area {
          text-align: center;
          margin-bottom: 20px;
        }

        .print-title-area h3 {
          font-size: 18px;
          font-weight: 700;
          color: #0c2d57;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .print-title-area .subtitle {
          font-size: 12px;
          color: #666;
          margin-top: 4px;
        }

        .print-title-area .period {
          font-size: 11px;
          color: #c9a84c;
          font-weight: 600;
          margin-top: 4px;
        }

        .gold-line {
          height: 2px;
          background: linear-gradient(to right, transparent, #c9a84c, transparent);
          margin: 12px 0;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 12px 0;
          font-size: 11px;
        }

        table thead th {
          background: #0c2d57;
          color: #fff;
          padding: 8px 10px;
          text-align: left;
          font-weight: 600;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        table tbody td {
          padding: 6px 10px;
          border-bottom: 1px solid #e5e7eb;
        }

        table tbody tr:nth-child(even) {
          background: #f8fafc;
        }

        table tbody tr:hover {
          background: #eff6ff;
        }

        .badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 600;
        }

        .badge-menunggu { background: #fef9c3; color: #854d0e; }
        .badge-check_in { background: #dbeafe; color: #1e40af; }
        .badge-dilayani { background: #f3e8ff; color: #6b21a8; }
        .badge-selesai { background: #dcfce7; color: #166534; }
        .badge-ditolak { background: #fee2e2; color: #991b1b; }
        .badge-diproses { background: #dbeafe; color: #1e40af; }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin: 16px 0;
        }

        .summary-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          border-top: 3px solid #0c2d57;
        }

        .summary-card .value {
          font-size: 24px;
          font-weight: 700;
          color: #0c2d57;
        }

        .summary-card .label {
          font-size: 10px;
          color: #666;
          margin-top: 4px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .chart-placeholder {
          border: 1px dashed #d1d5db;
          border-radius: 8px;
          padding: 40px;
          text-align: center;
          color: #9ca3af;
          margin: 16px 0;
        }

        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
          gap: 8px;
          margin: 12px 0;
        }

        .status-item {
          border: 1px solid #e5e7eb;
          border-radius: 6px;
          padding: 10px;
          text-align: center;
        }

        .status-item .value {
          font-size: 20px;
          font-weight: 700;
        }

        .status-item .label {
          font-size: 10px;
          color: #666;
          margin-top: 2px;
        }

        .print-footer {
          margin-top: 30px;
          padding-top: 16px;
          border-top: 2px solid #0c2d57;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #999;
        }

        .signature-area {
          margin-top: 40px;
          display: flex;
          justify-content: flex-end;
        }

        .signature-box {
          text-align: center;
          width: 200px;
        }

        .signature-box .line {
          border-bottom: 1px solid #333;
          margin-top: 60px;
          margin-bottom: 4px;
        }

        .signature-box .name {
          font-size: 11px;
          font-weight: 600;
        }

        .signature-box .title-text {
          font-size: 10px;
          color: #666;
        }

        .print-actions {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #0c2d57;
          padding: 10px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          z-index: 9999;
        }

        .print-actions button {
          padding: 8px 20px;
          border-radius: 6px;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-print {
          background: #c9a84c;
          color: #0c2d57;
        }

        .btn-close {
          background: transparent;
          color: #fff;
          border: 1px solid rgba(255,255,255,0.3) !important;
        }

        @media print {
          .print-actions { display: none !important; }
          body { padding: 0; }
        }
      </style>
    </head>
    <body>
      <div class="print-actions no-print">
        <span style="color: #c9a84c; font-weight: 600;">E-Tamu BKAD — Cetak Laporan</span>
        <div style="display: flex; gap: 8px;">
          <button class="btn-print" onclick="window.print()">🖨️ Cetak</button>
          <button class="btn-close" onclick="window.close()">✕ Tutup</button>
        </div>
      </div>

      <div style="margin-top: 50px;">
        ${options.headerHtml || `
          <div class="print-header">
            <div class="logo-area">
              <div class="logo-icon">ET</div>
              <div class="header-text">
                <h1>E-TAMU BKAD</h1>
                <h2>Badan Keuangan dan Aset Daerah</h2>
                <p>Kabupaten Seruyan, Kalimantan Tengah</p>
              </div>
            </div>
          </div>
        `}

        <div class="print-title-area">
          <h3>${options.title}</h3>
          ${options.subtitle ? `<p class="subtitle">${options.subtitle}</p>` : ''}
          <p class="period">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>

        <div class="gold-line"></div>

        ${options.contentHtml}

        <div class="print-footer">
          <span>E-Tamu BKAD — Sistem Pelayanan Tamu Digital</span>
          <span>&copy; ${new Date().getFullYear()} BKAD Kabupaten Seruyan</span>
        </div>

        <div class="signature-area">
          <div class="signature-box">
            <p class="title-text">Seruyan, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p class="title-text">Kepala Badan Keuangan dan Aset Daerah</p>
            <div class="line"></div>
            <p class="name">.......................................</p>
            <p class="title-text">NIP. .......................................</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  printWindow.document.write(html)
  printWindow.document.close()
}

/**
 * Export data as CSV file download
 */
export function exportToCSV(options: {
  filename: string
  headers: string[]
  rows: (string | number)[][]
}) {
  const BOM = '\uFEFF' // UTF-8 BOM for Excel compatibility
  const csvContent = [
    BOM + options.headers.join(';'),
    ...options.rows.map(row =>
      row.map(cell => {
        const str = String(cell ?? '')
        // Escape semicolons and quotes
        if (str.includes(';') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`
        }
        return str
      }).join(';')
    ),
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${options.filename}.csv`)
}

/**
 * Export data as Excel-compatible XML (simple .xlsx alternative)
 */
export function exportToExcel(options: {
  filename: string
  sheetName: string
  headers: string[]
  rows: (string | number)[][]
}) {
  // Generate simple HTML table-based XLS
  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>${options.sheetName}</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>
    <body>
    <table border="1">
      <thead>
        <tr style="background-color: #0c2d57; color: #ffffff; font-weight: bold;">
          ${options.headers.map(h => `<td style="padding: 6px 10px;">${h}</td>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${options.rows.map(row =>
          `<tr>${row.map(cell => `<td style="padding: 4px 10px;">${cell ?? ''}</td>`).join('')}</tr>`
        ).join('')}
      </tbody>
    </table>
    </body>
    </html>
  `

  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel' })
  downloadBlob(blob, `${options.filename}.xls`)
}

/**
 * Helper to download a Blob as a file
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate a guest table HTML for printing
 */
export function generateGuestTableHtml(guests: {
  name: string
  institution?: string | null
  visitPurpose: string
  status: string
  department?: { name: string } | null
  employee?: { name: string } | null
  visitDate: string
  checkInTime?: string | null
  checkOutTime?: string | null
  phone?: string | null
  email?: string | null
  address?: string | null
}[]): string {
  const statusLabelMap: Record<string, string> = {
    menunggu: 'Menunggu',
    check_in: 'Check In',
    dilayani: 'Dilayani',
    selesai: 'Selesai',
    ditolak: 'Ditolak',
    diproses: 'Diproses',
  }

  const rows = guests.map((g, i) => `
    <tr>
      <td style="text-align:center;">${i + 1}</td>
      <td><strong>${g.name}</strong>${g.institution ? `<br><small style="color:#888;">${g.institution}</small>` : ''}</td>
      <td>${g.department?.name || '-'}</td>
      <td>${g.employee?.name || '-'}</td>
      <td>${g.visitPurpose}</td>
      <td><span class="badge badge-${g.status}">${statusLabelMap[g.status] || g.status}</span></td>
      <td>${new Date(g.visitDate).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}<br><small>${new Date(g.visitDate).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</small></td>
    </tr>
  `).join('')

  return `
    <table>
      <thead>
        <tr>
          <th style="width:40px;text-align:center;">No</th>
          <th>Nama</th>
          <th>Bidang</th>
          <th>Pegawai</th>
          <th>Tujuan</th>
          <th>Status</th>
          <th>Waktu</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

/**
 * Generate summary stats HTML for printing
 */
export function generateSummaryHtml(stats: {
  totalGuests: number
  completed: number
  notServed: number
  avgPerDay: number
}): string {
  return `
    <div class="summary-grid">
      <div class="summary-card">
        <div class="value">${stats.totalGuests.toLocaleString('id-ID')}</div>
        <div class="label">Total Kunjungan</div>
      </div>
      <div class="summary-card" style="border-top-color: #22c55e;">
        <div class="value" style="color: #22c55e;">${stats.completed.toLocaleString('id-ID')}</div>
        <div class="label">Dilayani</div>
      </div>
      <div class="summary-card" style="border-top-color: #eab308;">
        <div class="value" style="color: #eab308;">${stats.notServed.toLocaleString('id-ID')}</div>
        <div class="label">Belum Dilayani</div>
      </div>
      <div class="summary-card" style="border-top-color: #c9a84c;">
        <div class="value" style="color: #c9a84c;">${stats.avgPerDay.toLocaleString('id-ID')}</div>
        <div class="label">Rata-rata/Hari</div>
      </div>
    </div>
  `
}

/**
 * Generate status breakdown HTML for printing
 */
export function generateStatusBreakdownHtml(breakdown: { status: string; count: number }[]): string {
  const statusLabelMap: Record<string, string> = {
    menunggu: 'Menunggu',
    check_in: 'Check In',
    dilayani: 'Dilayani',
    selesai: 'Selesai',
    ditolak: 'Ditolak',
    diproses: 'Diproses',
  }

  const statusColorMap: Record<string, string> = {
    menunggu: '#eab308',
    check_in: '#3b82f6',
    dilayani: '#c9a84c',
    selesai: '#22c55e',
    ditolak: '#ef4444',
    diproses: '#3b82f6',
  }

  return `
    <div class="status-grid">
      ${breakdown.map(s => `
        <div class="status-item" style="border-left: 3px solid ${statusColorMap[s.status] || '#64748b'};">
          <div class="value" style="color: ${statusColorMap[s.status] || '#333'};">${s.count}</div>
          <div class="label">${statusLabelMap[s.status] || s.status}</div>
        </div>
      `).join('')}
    </div>
  `
}
