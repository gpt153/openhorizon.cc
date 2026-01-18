/**
 * Email Template Engine
 * Generates professional, Erasmus+-appropriate email templates for quote requests
 */

interface QuoteRequestTemplateParams {
  vendorName: string
  projectName: string
  phaseType: string
  location: string
  checkIn: Date
  checkOut: Date
  nights: number
  participants: number
  requirements?: string
  budgetRange?: {
    min: number
    max: number
  }
  deadline?: Date
  contactPerson: string
  contactEmail: string
  organizationName?: string
}

interface FollowUpTemplateParams {
  vendorName: string
  projectName: string
  originalDate: Date
  contactPerson: string
}

interface AcceptanceTemplateParams {
  vendorName: string
  projectName: string
  quoteAmount: number
  nextSteps?: string[]
  contactPerson: string
}

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

/**
 * Email Template Engine for pipeline communications
 */
export class EmailTemplateEngine {
  /**
   * Render a quote request email
   */
  renderQuoteRequest(params: QuoteRequestTemplateParams): EmailTemplate {
    const subject = `Quote Request - Group Booking for ${params.projectName}`

    const text = this.renderQuoteRequestText(params)
    const html = this.renderQuoteRequestHtml(params)

    return { subject, html, text }
  }

  /**
   * Render a follow-up email
   */
  renderFollowUp(params: FollowUpTemplateParams): EmailTemplate {
    const daysSince = Math.floor(
      (Date.now() - params.originalDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const subject = `Follow-up: Quote Request for ${params.projectName}`

    const text = `Dear ${params.vendorName} Team,

I am following up on our quote request for ${params.projectName} sent ${daysSince} days ago.

We are still very interested in working with you for this project and would appreciate receiving your quote when possible.

If you need any additional information, please don't hesitate to reach out.

Best regards,
${params.contactPerson}
Open Horizon`

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #2563eb;">Follow-up: Quote Request</h2>

  <p>Dear ${params.vendorName} Team,</p>

  <p>I am following up on our quote request for <strong>${params.projectName}</strong> sent ${daysSince} days ago.</p>

  <p>We are still very interested in working with you for this project and would appreciate receiving your quote when possible.</p>

  <p>If you need any additional information, please don't hesitate to reach out.</p>

  <p>Best regards,<br>
  ${params.contactPerson}<br>
  Open Horizon</p>

  <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
  <p style="font-size: 12px; color: #6b7280;">
    This email was sent via Open Horizon - Erasmus+ Project Management Platform
  </p>
</div>
`

    return { subject, html, text }
  }

  /**
   * Render a quote acceptance email
   */
  renderAcceptance(params: AcceptanceTemplateParams): EmailTemplate {
    const subject = `Quote Accepted - ${params.projectName}`

    const nextStepsHtml = params.nextSteps
      ? `
  <h3 style="color: #2563eb;">Next Steps:</h3>
  <ol style="line-height: 1.8;">
    ${params.nextSteps.map((step) => `<li>${step}</li>`).join('\n    ')}
  </ol>`
      : ''

    const nextStepsText = params.nextSteps
      ? `\n\nNext Steps:\n${params.nextSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`
      : ''

    const text = `Dear ${params.vendorName} Team,

Great news! We are pleased to accept your quote of €${params.quoteAmount.toFixed(2)} for ${params.projectName}.

We look forward to working with you on this Erasmus+ project.${nextStepsText}

Please confirm receipt of this acceptance and let us know the next steps from your side.

Best regards,
${params.contactPerson}
Open Horizon`

    const html = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #16a34a;">Quote Accepted ✓</h2>

  <p>Dear ${params.vendorName} Team,</p>

  <p><strong>Great news!</strong> We are pleased to accept your quote of <strong>€${params.quoteAmount.toFixed(2)}</strong> for ${params.projectName}.</p>

  <p>We look forward to working with you on this Erasmus+ project.</p>

  ${nextStepsHtml}

  <p>Please confirm receipt of this acceptance and let us know the next steps from your side.</p>

  <p>Best regards,<br>
  ${params.contactPerson}<br>
  Open Horizon</p>

  <hr style="margin-top: 30px; border: none; border-top: 1px solid #e5e7eb;">
  <p style="font-size: 12px; color: #6b7280;">
    This email was sent via Open Horizon - Erasmus+ Project Management Platform
  </p>
</div>
`

    return { subject, html, text }
  }

  /**
   * Private: Render quote request as plain text
   */
  private renderQuoteRequestText(params: QuoteRequestTemplateParams): string {
    const nights = params.nights
    const budgetText = params.budgetRange
      ? `\n- Target: €${params.budgetRange.min}-${params.budgetRange.max} per person per ${this.getBudgetUnit(params.phaseType)}\n- Total budget: €${(params.budgetRange.max * params.participants).toFixed(0)} for entire ${this.getServiceType(params.phaseType)}`
      : ''

    const deadlineText = params.deadline
      ? `\n\nPlease send your quote by ${params.deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}.`
      : ''

    const requirementsText = params.requirements
      ? `\n\nREQUIREMENTS:\n${params.requirements}`
      : ''

    return `Subject: Quote Request - Group Booking for ${params.projectName}

Dear ${params.vendorName} Team,

I am writing on behalf of ${params.organizationName || 'Open Horizon'}, a Swedish non-profit organization coordinating Erasmus+ youth mobility projects.

We are organizing a youth exchange titled "${params.projectName}" and would like to request a group booking quote.

PROJECT DETAILS:
- Dates: ${params.checkIn.toLocaleDateString('en-GB')} to ${params.checkOut.toLocaleDateString('en-GB')} (${nights} nights)
- Participants: ${params.participants} young people (ages 16-25)
- Location: ${params.location}${requirementsText}${budgetText}${deadlineText}

Best regards,
${params.contactPerson}
${params.organizationName || 'Open Horizon'}
Email: ${params.contactEmail}`
  }

  /**
   * Private: Render quote request as HTML
   */
  private renderQuoteRequestHtml(params: QuoteRequestTemplateParams): string {
    const nights = params.nights
    const budgetSection = params.budgetRange
      ? `
  <h3 style="color: #2563eb; margin-top: 24px;">Budget:</h3>
  <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
    <tr style="background-color: #f9fafb;">
      <td style="padding: 12px; border: 1px solid #e5e7eb;">Target per person:</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>€${params.budgetRange.min}-${params.budgetRange.max}</strong> per ${this.getBudgetUnit(params.phaseType)}</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #e5e7eb;">Total budget:</td>
      <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>€${(params.budgetRange.max * params.participants).toFixed(0)}</strong> for entire ${this.getServiceType(params.phaseType)}</td>
    </tr>
  </table>`
      : ''

    const deadlineSection = params.deadline
      ? `<p style="background-color: #fef3c7; padding: 12px; border-left: 4px solid #f59e0b; margin: 20px 0;">
    <strong>⏰ Deadline:</strong> Please send your quote by <strong>${params.deadline.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>
  </p>`
      : ''

    const requirementsSection = params.requirements
      ? `
  <h3 style="color: #2563eb; margin-top: 24px;">Requirements:</h3>
  <div style="background-color: #f9fafb; padding: 16px; border-radius: 6px; white-space: pre-wrap;">${params.requirements}</div>`
      : ''

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Quote Request - ${params.projectName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 32px;">

    <div style="background-color: #2563eb; color: white; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
      <h1 style="margin: 0; font-size: 24px;">Quote Request - Group Booking</h1>
      <p style="margin: 8px 0 0 0; opacity: 0.9;">Erasmus+ Youth Exchange</p>
    </div>

    <p style="font-size: 16px; line-height: 1.6;">Dear ${params.vendorName} Team,</p>

    <p style="font-size: 16px; line-height: 1.6;">
      I am writing on behalf of <strong>${params.organizationName || 'Open Horizon'}</strong>, a Swedish non-profit organization coordinating Erasmus+ youth mobility projects.
    </p>

    <p style="font-size: 16px; line-height: 1.6;">
      We are organizing a youth exchange titled <strong>"${params.projectName}"</strong> and would like to request a group booking quote.
    </p>

    <h3 style="color: #2563eb; margin-top: 24px;">Project Details:</h3>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
      <tr style="background-color: #f9fafb;">
        <td style="padding: 12px; border: 1px solid #e5e7eb; width: 40%;"><strong>Project Name:</strong></td>
        <td style="padding: 12px; border: 1px solid #e5e7eb;">${params.projectName}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Check-in:</strong></td>
        <td style="padding: 12px; border: 1px solid #e5e7eb;">${params.checkIn.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td>
      </tr>
      <tr style="background-color: #f9fafb;">
        <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Check-out:</strong></td>
        <td style="padding: 12px; border: 1px solid #e5e7eb;">${params.checkOut.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Duration:</strong></td>
        <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>${nights} nights</strong></td>
      </tr>
      <tr style="background-color: #f9fafb;">
        <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Participants:</strong></td>
        <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>${params.participants}</strong> young people (ages 16-25)</td>
      </tr>
      <tr>
        <td style="padding: 12px; border: 1px solid #e5e7eb;"><strong>Location:</strong></td>
        <td style="padding: 12px; border: 1px solid #e5e7eb;">${params.location}</td>
      </tr>
    </table>

    ${requirementsSection}
    ${budgetSection}
    ${deadlineSection}

    <p style="font-size: 16px; line-height: 1.6; margin-top: 24px;">
      We would appreciate receiving your quote with:
    </p>
    <ul style="font-size: 16px; line-height: 1.8;">
      <li>Detailed price breakdown</li>
      <li>Availability confirmation for the specified dates</li>
      <li>Payment terms and cancellation policy</li>
    </ul>

    <p style="font-size: 16px; line-height: 1.6; margin-top: 24px;">
      Best regards,<br>
      <strong>${params.contactPerson}</strong><br>
      ${params.organizationName || 'Open Horizon'}<br>
      <a href="mailto:${params.contactEmail}" style="color: #2563eb;">${params.contactEmail}</a>
    </p>

    <hr style="margin-top: 40px; border: none; border-top: 1px solid #e5e7eb;">
    <p style="font-size: 12px; color: #6b7280; text-align: center; margin: 16px 0 0 0;">
      This email was sent via Open Horizon - Erasmus+ Project Management Platform<br>
      <a href="https://openhorizon.cc" style="color: #2563eb;">openhorizon.cc</a>
    </p>
  </div>
</body>
</html>
`
  }

  /**
   * Get budget unit based on phase type
   */
  private getBudgetUnit(phaseType: string): string {
    switch (phaseType.toUpperCase()) {
      case 'ACCOMMODATION':
        return 'night'
      case 'FOOD':
      case 'CATERING':
        return 'meal'
      case 'TRAVEL':
        return 'person'
      case 'ACTIVITIES':
        return 'activity'
      default:
        return 'unit'
    }
  }

  /**
   * Get service type based on phase type
   */
  private getServiceType(phaseType: string): string {
    switch (phaseType.toUpperCase()) {
      case 'ACCOMMODATION':
        return 'accommodation'
      case 'FOOD':
      case 'CATERING':
        return 'catering'
      case 'TRAVEL':
        return 'transport'
      case 'ACTIVITIES':
        return 'activities'
      default:
        return 'service'
    }
  }
}

// Export singleton instance
export const emailTemplateEngine = new EmailTemplateEngine()
