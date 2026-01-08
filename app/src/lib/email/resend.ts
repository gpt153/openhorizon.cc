import { Resend } from 'resend'

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY!)

export interface SendEmailParams {
  to: string | string[]
  from?: string
  subject: string
  html: string
  replyTo?: string
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * Send an email using Resend
 *
 * @param params Email parameters
 * @returns Result with success status and message ID or error
 */
export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  try {
    const { to, from = 'Open Horizon <noreply@openhorizon.cc>', subject, html, replyTo } = params

    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured')
      return {
        success: false,
        error: 'Email service not configured. Please add RESEND_API_KEY to environment variables.',
      }
    }

    const response = await resend.emails.send({
      from,
      to,
      subject,
      html,
      replyTo,
    })

    if (response.error) {
      console.error('❌ Resend API error:', response.error)
      return {
        success: false,
        error: response.error.message || 'Failed to send email',
      }
    }

    console.log('✅ Email sent successfully:', response.data?.id)
    return {
      success: true,
      messageId: response.data?.id,
    }
  } catch (error) {
    console.error('❌ Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Send a quote request email to a vendor
 */
export async function sendQuoteRequestEmail(params: {
  vendorName: string
  vendorEmail: string
  projectName: string
  phaseType: string
  location: string
  checkIn: Date
  checkOut: Date
  participants: number
  requirements?: string
  contactPerson: string
  contactEmail: string
}): Promise<EmailResult> {
  const subject = `Quote Request: ${params.projectName} - ${params.phaseType}`

  const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2>Quote Request for Erasmus+ Project</h2>

  <p>Dear ${params.vendorName},</p>

  <p>We are organizing an Erasmus+ project and would like to request a quote for ${params.phaseType.toLowerCase()} services.</p>

  <h3>Project Details:</h3>
  <table style="width: 100%; border-collapse: collapse;">
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Project:</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${params.projectName}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Location:</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${params.location}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Check-in:</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${params.checkIn.toLocaleDateString()}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Check-out:</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${params.checkOut.toLocaleDateString()}</td>
    </tr>
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Participants:</strong></td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${params.participants} people</td>
    </tr>
  </table>

  ${
    params.requirements
      ? `
  <h3>Special Requirements:</h3>
  <p>${params.requirements}</p>
  `
      : ''
  }

  <p>Could you please provide:</p>
  <ul>
    <li>Detailed quote breakdown</li>
    <li>Availability confirmation for the specified dates</li>
    <li>Payment terms and cancellation policy</li>
  </ul>

  <p>We would appreciate receiving your quote within 7 days.</p>

  <p>Best regards,<br>
  ${params.contactPerson}<br>
  Open Horizon<br>
  ${params.contactEmail}</p>

  <hr style="margin-top: 30px; border: none; border-top: 1px solid #eee;">
  <p style="font-size: 12px; color: #666;">
    This email was sent via Open Horizon - Erasmus+ Project Management Platform
  </p>
</div>
`

  return sendEmail({
    to: params.vendorEmail,
    subject,
    html,
    replyTo: params.contactEmail,
  })
}
