import { chromium } from 'playwright'
import type { ReportProject, ExportResult } from './types.js'

function generateReportHTML(project: ReportProject): string {
  const totalDays = Math.ceil(
    (project.end_date.getTime() - project.start_date.getTime()) / (1000 * 60 * 60 * 24)
  )

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    h1 {
      color: #0066CC;
      font-size: 24pt;
      text-align: center;
      margin-bottom: 10px;
      page-break-after: avoid;
    }

    h2 {
      color: #0066CC;
      font-size: 16pt;
      margin-top: 30px;
      margin-bottom: 15px;
      border-bottom: 2px solid #0066CC;
      padding-bottom: 5px;
      page-break-after: avoid;
    }

    .subtitle {
      text-align: center;
      color: #666;
      font-style: italic;
      margin-bottom: 40px;
    }

    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    .info-item {
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 5px;
    }

    .info-label {
      font-weight: bold;
      color: #0066CC;
      margin-bottom: 5px;
    }

    .description {
      background-color: #f9f9f9;
      padding: 15px;
      border-left: 4px solid #0066CC;
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
      page-break-inside: avoid;
    }

    thead {
      background-color: #0066CC;
      color: white;
    }

    th, td {
      padding: 12px;
      text-align: left;
      border: 1px solid #ddd;
    }

    th {
      font-weight: bold;
    }

    tbody tr:nth-child(even) {
      background-color: #f9f9f9;
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 9pt;
      font-weight: bold;
    }

    .status-planning {
      background-color: #E3F2FD;
      color: #1976D2;
    }

    .status-in-progress {
      background-color: #F3E5F5;
      color: #7B1FA2;
    }

    .status-completed {
      background-color: #E8F5E9;
      color: #388E3C;
    }

    .status-not-started {
      background-color: #FFF3E0;
      color: #F57C00;
    }

    @media print {
      body {
        margin: 0;
        padding: 15px;
      }

      @page {
        size: A4;
        margin: 2cm;
      }
    }
  </style>
</head>
<body>
  <h1>${project.name}</h1>
  <p class="subtitle">Project Report - Generated ${new Date().toLocaleDateString()}</p>

  <h2>Project Overview</h2>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Type</div>
      <div>${project.type}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Status</div>
      <div><span class="status-badge status-${project.status.toLowerCase().replace('_', '-')}">${project.status}</span></div>
    </div>
    <div class="info-item">
      <div class="info-label">Location</div>
      <div>${project.location}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Participants</div>
      <div>${project.participants_count}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Duration</div>
      <div>${totalDays} days</div>
    </div>
    <div class="info-item">
      <div class="info-label">Budget</div>
      <div>$${Number(project.budget_total).toLocaleString()}</div>
    </div>
  </div>

  ${project.description ? `
    <h2>Description</h2>
    <div class="description">
      ${project.description}
    </div>
  ` : ''}

  <h2>Project Phases</h2>
  <table>
    <thead>
      <tr>
        <th>Phase Name</th>
        <th>Type</th>
        <th>Status</th>
        <th>Start Date</th>
        <th>End Date</th>
        <th>Budget Allocated</th>
        <th>Budget Spent</th>
      </tr>
    </thead>
    <tbody>
      ${project.phases.map(phase => `
        <tr>
          <td>${phase.name}</td>
          <td>${phase.type}</td>
          <td><span class="status-badge status-${phase.status.toLowerCase().replace('_', '-')}">${phase.status}</span></td>
          <td>${phase.start_date.toLocaleDateString()}</td>
          <td>${phase.end_date.toLocaleDateString()}</td>
          <td>$${Number(phase.budget_allocated).toLocaleString()}</td>
          <td>$${Number(phase.budget_spent).toLocaleString()}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Budget Summary</h2>
  <div class="info-grid">
    <div class="info-item">
      <div class="info-label">Total Budget</div>
      <div>$${Number(project.budget_total).toLocaleString()}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Total Spent</div>
      <div>$${Number(project.budget_spent).toLocaleString()}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Remaining</div>
      <div>$${(Number(project.budget_total) - Number(project.budget_spent)).toLocaleString()}</div>
    </div>
    <div class="info-item">
      <div class="info-label">Utilization</div>
      <div>${((Number(project.budget_spent) / Number(project.budget_total)) * 100).toFixed(1)}%</div>
    </div>
  </div>
</body>
</html>
  `
}

export async function generatePDFReport(
  project: ReportProject
): Promise<ExportResult> {
  const browser = await chromium.launch({ headless: true })

  try {
    const page = await browser.newPage()
    const html = generateReportHTML(project)

    await page.setContent(html, { waitUntil: 'networkidle' })

    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        bottom: '20px',
        left: '20px',
        right: '20px'
      }
    })

    return {
      buffer: Buffer.from(buffer),
      filename: `${project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-report.pdf`,
      mimeType: 'application/pdf'
    }
  } finally {
    await browser.close()
  }
}
