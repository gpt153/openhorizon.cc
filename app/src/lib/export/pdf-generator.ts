import { chromium } from 'playwright'
// Removed invalid Prisma type imports from '@prisma/client'
import { formatCurrency } from '@/types/budget'

export interface ProjectWithDetails extends PipelineProject {
  phases: PipelinePhase[]
  expenses: Expense[]
}

export async function generateProjectPDF(project: ProjectWithDetails): Promise<Buffer> {
  // Generate HTML content
  const html = generateProjectHTML(project)

  // Launch browser
  const browser = await chromium.launch({
    headless: true,
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html)

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm',
      },
    })

    return Buffer.from(pdfBuffer)
  } finally {
    await browser.close()
  }
}

function generateProjectHTML(project: ProjectWithDetails): string {
  const phasesMap = project.phases.reduce<Record<string, string>>((acc, phase) => {
    acc[phase.id] = phase.name
    return acc
  }, {})

  const totalExpenses = project.expenses.reduce(
    (sum, expense) => sum + Number(expense.amount),
    0
  )

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1a1a1a;
      line-height: 1.6;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 10px;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 32px;
      margin-bottom: 10px;
    }
    .header .subtitle {
      font-size: 16px;
      opacity: 0.9;
    }
    .section {
      margin-bottom: 30px;
    }
    .section h2 {
      font-size: 20px;
      color: #667eea;
      border-bottom: 2px solid #667eea;
      padding-bottom: 10px;
      margin-bottom: 15px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .info-item {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
    }
    .info-item .label {
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .info-item .value {
      font-size: 16px;
      color: #1a1a1a;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    thead {
      background: #667eea;
      color: white;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e9ecef;
    }
    th {
      font-weight: 600;
      font-size: 14px;
    }
    td {
      font-size: 13px;
    }
    tbody tr:hover {
      background: #f8f9fa;
    }
    .phases-list {
      display: grid;
      gap: 10px;
    }
    .phase-item {
      background: #f8f9fa;
      padding: 12px 15px;
      border-radius: 8px;
      border-left: 4px solid #667eea;
    }
    .phase-item .phase-name {
      font-weight: 600;
      font-size: 14px;
      margin-bottom: 4px;
    }
    .phase-item .phase-meta {
      font-size: 12px;
      color: #6c757d;
    }
    .total-row {
      background: #667eea !important;
      color: white !important;
      font-weight: 700;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(project.name)}</h1>
    <div class="subtitle">Erasmus+ Project Export Report</div>
  </div>

  <div class="section">
    <h2>Project Information</h2>
    <div class="info-grid">
      <div class="info-item">
        <div class="label">Status</div>
        <div class="value">${escapeHtml(project.status)}</div>
      </div>
      <div class="info-item">
        <div class="label">Location</div>
        <div class="value">${escapeHtml(project.location)}</div>
      </div>
      <div class="info-item">
        <div class="label">Host Country</div>
        <div class="value">${escapeHtml(project.hostCountry || 'N/A')}</div>
      </div>
      <div class="info-item">
        <div class="label">Start Date</div>
        <div class="value">${project.startDate.toLocaleDateString()}</div>
      </div>
      <div class="info-item">
        <div class="label">End Date</div>
        <div class="value">${project.endDate.toLocaleDateString()}</div>
      </div>
      <div class="info-item">
        <div class="label">Total Phases</div>
        <div class="value">${project.phases.length}</div>
      </div>
      <div class="info-item">
        <div class="label">Total Budget</div>
        <div class="value">${formatCurrency(totalExpenses)}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Project Phases (${project.phases.length})</h2>
    <div class="phases-list">
      ${project.phases
        .sort((a, b) => a.order - b.order)
        .map(
          (phase) => `
        <div class="phase-item">
          <div class="phase-name">${escapeHtml(phase.name)}</div>
          <div class="phase-meta">Type: ${escapeHtml(phase.type)} • Status: ${escapeHtml(phase.status)} • Order: ${phase.order}</div>
        </div>
      `
        )
        .join('')}
    </div>
  </div>

  <div class="section">
    <h2>Budget Breakdown (${project.expenses.length} expenses)</h2>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Phase</th>
          <th>Category</th>
          <th>Description</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${project.expenses
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .map(
            (expense) => `
          <tr>
            <td>${new Date(expense.date).toLocaleDateString('sv-SE')}</td>
            <td>${escapeHtml(phasesMap[expense.phaseId] || 'Unknown')}</td>
            <td>${escapeHtml(expense.category.replace('_', ' '))}</td>
            <td>${escapeHtml(expense.description)}</td>
            <td style="text-align: right;">${formatCurrency(Number(expense.amount))}</td>
          </tr>
        `
          )
          .join('')}
        <tr class="total-row">
          <td colspan="4" style="text-align: right; padding-right: 20px;">TOTAL</td>
          <td style="text-align: right;">${formatCurrency(totalExpenses)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="footer">
    Generated by OpenHorizon on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}<br>
    Erasmus+ Project Management Platform
  </div>
</body>
</html>
  `
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m] || m)
}
