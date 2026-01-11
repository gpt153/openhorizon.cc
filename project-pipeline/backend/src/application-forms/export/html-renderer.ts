import type { ApplicationFormData } from '../application-forms.types.js'

/**
 * Render application form as HTML for PDF generation or preview
 */
export function renderFormAsHTML(formData: ApplicationFormData): string {
  const { form_type, form_data, generated_narratives, status, created_at } = formData

  const styles = `
    <style>
      @page {
        margin: 2cm;
        size: A4;
      }
      body {
        font-family: 'Arial', 'Helvetica', sans-serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #333;
        max-width: 210mm;
        margin: 0 auto;
        padding: 20px;
      }
      h1 {
        color: #003399;
        font-size: 20pt;
        margin-bottom: 10px;
        border-bottom: 3px solid #FFCC00;
        padding-bottom: 10px;
      }
      h2 {
        color: #003399;
        font-size: 14pt;
        margin-top: 20px;
        margin-bottom: 10px;
        border-bottom: 1px solid #ccc;
        padding-bottom: 5px;
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      .logo {
        width: 150px;
        margin-bottom: 10px;
      }
      .form-info {
        background-color: #f0f0f0;
        padding: 15px;
        margin-bottom: 20px;
        border-radius: 5px;
      }
      .form-info p {
        margin: 5px 0;
      }
      .field {
        margin-bottom: 15px;
        page-break-inside: avoid;
      }
      .field-label {
        font-weight: bold;
        color: #003399;
        margin-bottom: 5px;
      }
      .field-value {
        padding: 8px;
        background-color: #f9f9f9;
        border-left: 3px solid #FFCC00;
        white-space: pre-wrap;
      }
      .narrative {
        background-color: #f0f7ff;
        padding: 15px;
        margin: 20px 0;
        border-left: 4px solid #003399;
        page-break-inside: avoid;
      }
      .narrative h3 {
        color: #003399;
        margin-top: 0;
      }
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 2px solid #ccc;
        text-align: center;
        font-size: 9pt;
        color: #666;
      }
      .status-badge {
        display: inline-block;
        padding: 5px 10px;
        border-radius: 3px;
        font-weight: bold;
        font-size: 10pt;
      }
      .status-draft {
        background-color: #fff3cd;
        color: #856404;
      }
      .status-finalized {
        background-color: #d4edda;
        color: #155724;
      }
    </style>
  `

  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Erasmus+ Application Form - ${form_type}</title>
  ${styles}
</head>
<body>
  <div class="header">
    <h1>Erasmus+ Application Form</h1>
    <h2>${form_type === 'KA1' ? 'Key Action 1 - Learning Mobility' : form_type === 'KA2' ? 'Key Action 2 - Cooperation Partnerships' : 'Custom Application'}</h2>
  </div>

  <div class="form-info">
    <p><strong>Form ID:</strong> ${formData.id}</p>
    <p><strong>Status:</strong> <span class="status-badge status-${status.toLowerCase()}">${status}</span></p>
    <p><strong>Created:</strong> ${new Date(created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
    <p><strong>Project ID:</strong> ${formData.project_id}</p>
  </div>
`

  // Render AI-generated narratives if available
  if (generated_narratives) {
    html += `
  <div class="narrative">
    <h3>AI-Generated Project Narratives</h3>
`
    if (generated_narratives.project_description) {
      html += `
    <div class="field">
      <div class="field-label">Project Description</div>
      <div class="field-value">${escapeHtml(generated_narratives.project_description)}</div>
    </div>
`
    }
    if (generated_narratives.objectives) {
      html += `
    <div class="field">
      <div class="field-label">Objectives</div>
      <div class="field-value">${escapeHtml(generated_narratives.objectives)}</div>
    </div>
`
    }
    if (generated_narratives.methodology) {
      html += `
    <div class="field">
      <div class="field-label">Methodology</div>
      <div class="field-value">${escapeHtml(generated_narratives.methodology)}</div>
    </div>
`
    }
    if (generated_narratives.expected_impact) {
      html += `
    <div class="field">
      <div class="field-label">Expected Impact</div>
      <div class="field-value">${escapeHtml(generated_narratives.expected_impact)}</div>
    </div>
`
    }
    html += `  </div>\n`
  }

  // Render form fields
  html += `  <h2>Application Details</h2>\n`

  // Group fields by section based on naming convention
  const fieldsBySection: Record<string, Array<{ key: string; value: any }>> = {}

  for (const [key, value] of Object.entries(form_data)) {
    // Extract section from field name (e.g., "project_title" -> "project")
    const section = key.split('_')[0] || 'general'
    if (!fieldsBySection[section]) {
      fieldsBySection[section] = []
    }
    fieldsBySection[section].push({ key, value })
  }

  // Render each section
  for (const [section, fields] of Object.entries(fieldsBySection)) {
    html += `  <h2>${capitalizeFirstLetter(section)}</h2>\n`

    for (const { key, value } of fields) {
      const label = formatFieldLabel(key)
      const formattedValue = formatFieldValue(value)

      html += `
  <div class="field">
    <div class="field-label">${label}</div>
    <div class="field-value">${formattedValue}</div>
  </div>
`
    }
  }

  // Footer
  html += `
  <div class="footer">
    <p>Generated by Erasmus+ Project Pipeline Management System</p>
    <p>${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
  </div>
</body>
</html>
`

  return html
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>')
}

/**
 * Format field label from snake_case to Title Case
 */
function formatFieldLabel(key: string): string {
  return key
    .split('_')
    .map(word => capitalizeFirstLetter(word))
    .join(' ')
}

/**
 * Format field value for display
 */
function formatFieldValue(value: any): string {
  if (value === null || value === undefined) {
    return '<em>Not provided</em>'
  }

  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  if (typeof value === 'number') {
    // Format numbers with thousands separator
    return value.toLocaleString('en-US')
  }

  if (Array.isArray(value)) {
    return value.map(v => escapeHtml(String(v))).join(', ')
  }

  if (typeof value === 'object') {
    return escapeHtml(JSON.stringify(value, null, 2))
  }

  // Check if value looks like a date
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    try {
      const date = new Date(value)
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return escapeHtml(String(value))
    }
  }

  return escapeHtml(String(value))
}

/**
 * Capitalize first letter of a string
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
