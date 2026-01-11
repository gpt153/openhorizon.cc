import { sendEmail, EmailResult } from '../resend'

export async function sendBudgetAlertEmail(params: {
  projectName: string
  projectId: string
  budgetTotal: number
  budgetSpent: number
  budgetRemaining: number
  percentage: number
  threshold: number
  recipientEmails: string[]
}): Promise<EmailResult> {
  const subject = `⚠️ Budget Alert: ${params.projectName} (${Math.round(params.percentage)}% spent)`

  const statusColor = params.percentage >= 100 ? '#dc2626' : '#f59e0b'
  const statusBg = params.percentage >= 100 ? '#fef2f2' : '#fef3c7'
  const statusText = params.percentage >= 100 ? 'Budget Exceeded' : 'Budget Threshold Reached'

  const projectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pipeline/projects/${params.projectId}`

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1f2937; margin-bottom: 24px;">Budget Alert: ${params.projectName}</h2>

  <div style="background: ${statusBg}; border-left: 4px solid ${statusColor}; padding: 16px; margin: 20px 0; border-radius: 4px;">
    <strong style="color: ${statusColor};">⚠️ ${statusText}</strong>
    <p style="margin: 8px 0 0 0; color: #4b5563;">
      Your project has reached ${Math.round(params.percentage)}% of the allocated budget (${params.threshold}% threshold).
    </p>
  </div>

  <h3 style="color: #1f2937; font-size: 16px; margin-top: 24px;">Budget Summary</h3>

  <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;"><strong>Total Budget:</strong></td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">€${params.budgetTotal.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;"><strong>Spent:</strong></td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right; color: ${statusColor};">€${params.budgetSpent.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
    <tr>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb;"><strong>Remaining:</strong></td>
      <td style="padding: 12px 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">${params.budgetRemaining >= 0 ? '€' : '-€'}${Math.abs(params.budgetRemaining).toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
    </tr>
    <tr>
      <td style="padding: 12px 8px;"><strong>Utilization:</strong></td>
      <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: ${statusColor};">${Math.round(params.percentage)}%</td>
    </tr>
  </table>

  <p style="margin: 24px 0; color: #4b5563;">
    Please review the project budget and take necessary action to prevent overspending.
  </p>

  <div style="margin-top: 32px; text-align: center;">
    <a href="${projectUrl}" style="background: #2563eb; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
      View Project Budget
    </a>
  </div>

  <hr style="margin-top: 40px; border: none; border-top: 1px solid #e5e7eb;">
  <p style="font-size: 12px; color: #9ca3af; margin-top: 16px;">
    This email was sent via Open Horizon - Erasmus+ Project Management Platform<br>
    You are receiving this because you are configured as a budget alert recipient for this project.
  </p>
</div>
`

  // Send to all recipients
  const results = await Promise.all(
    params.recipientEmails.map(email =>
      sendEmail({
        to: email,
        subject,
        html,
      })
    )
  )

  // Check if any succeeded
  const anySucceeded = results.some(r => r.success)
  const allSucceeded = results.every(r => r.success)

  if (!anySucceeded) {
    return {
      success: false,
      error: 'Failed to send to any recipients',
    }
  }

  return {
    success: allSucceeded,
    messageId: results.find(r => r.messageId)?.messageId,
    error: allSucceeded ? undefined : 'Some recipients failed',
  }
}
