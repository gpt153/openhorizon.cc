import sgMail from '@sendgrid/mail'
import { env } from '../config/env.js'
import { prisma } from '../config/database.js'
import { EmailAgent, EmailTemplate } from '../ai/agents/email-agent.js'

// Initialize SendGrid if API key is available
if (env.SENDGRID_API_KEY) {
  sgMail.setApiKey(env.SENDGRID_API_KEY)
}

export interface SendEmailParams {
  to: string
  toName?: string
  from?: string
  fromName?: string
  subject: string
  body: string
  cc?: string[]
  bcc?: string[]
  attachments?: Array<{
    content: string // Base64 encoded
    filename: string
    type: string
    disposition?: 'attachment' | 'inline'
  }>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
  communicationId?: string
}

export class EmailService {
  private emailAgent: EmailAgent
  private defaultFrom: string
  private defaultFromName: string

  constructor() {
    this.emailAgent = new EmailAgent()
    this.defaultFrom = env.EMAIL_FROM || 'noreply@projectpipeline.com'
    this.defaultFromName = env.EMAIL_FROM_NAME || 'Project Pipeline'
  }

  /**
   * Send email via SendGrid
   */
  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    if (!env.SENDGRID_API_KEY) {
      console.warn('⚠️  SendGrid API key not configured - email not sent')
      return {
        success: false,
        error: 'SendGrid not configured'
      }
    }

    try {
      const msg = {
        to: params.toName ? {
          email: params.to,
          name: params.toName
        } : params.to,
        from: {
          email: params.from || this.defaultFrom,
          name: params.fromName || this.defaultFromName
        },
        subject: params.subject,
        text: params.body,
        html: this.convertToHtml(params.body),
        ...(params.cc && { cc: params.cc }),
        ...(params.bcc && { bcc: params.bcc }),
        ...(params.attachments && { attachments: params.attachments })
      }

      const response = await sgMail.send(msg)

      console.log(`✅ Email sent to ${params.to}`)

      return {
        success: true,
        messageId: response[0].headers['x-message-id']
      }
    } catch (error: any) {
      console.error('❌ Email sending failed:', error)
      return {
        success: false,
        error: error.message || 'Failed to send email'
      }
    }
  }

  /**
   * Send quote request to vendor and track in database
   */
  async sendQuoteRequest(params: {
    projectId: string
    phaseId: string
    vendorId: string
    userId: string
    customMessage?: string
  }): Promise<EmailResult> {
    // Get project, phase, vendor, user data
    const [project, phase, vendor, user] = await Promise.all([
      prisma.project.findUnique({ where: { id: params.projectId } }),
      prisma.phase.findUnique({ where: { id: params.phaseId } }),
      prisma.vendor.findUnique({ where: { id: params.vendorId } }),
      prisma.user.findUnique({ where: { id: params.userId } })
    ])

    if (!project || !phase || !vendor || !user) {
      return {
        success: false,
        error: 'Project, phase, vendor, or user not found'
      }
    }

    // Compose email using AI
    const email = await this.emailAgent.composeQuoteRequest({
      vendorName: vendor.name,
      vendorEmail: vendor.email,
      phaseType: phase.type,
      projectName: project.name,
      location: project.location,
      dates: {
        checkIn: phase.start_date,
        checkOut: phase.end_date
      },
      participants: project.participants_count,
      requirements: params.customMessage ? [params.customMessage] : undefined,
      contactPerson: user.name,
      contactEmail: user.email,
      deadline: phase.deadline || undefined
    })

    // Send email
    const result = await this.sendEmail({
      to: vendor.email,
      toName: vendor.name,
      subject: email.subject,
      body: email.body,
      from: user.email,
      fromName: user.name
    })

    // Track in database
    const communication = await prisma.communication.create({
      data: {
        project_id: params.projectId,
        phase_id: params.phaseId,
        vendor_id: params.vendorId,
        user_id: params.userId,
        type: 'QUOTE_REQUEST',
        direction: 'OUTGOING',
        subject: email.subject,
        body: email.body,
        status: result.success ? 'SENT' : 'FAILED',
        sent_at: result.success ? new Date() : null,
        metadata: {
          messageId: result.messageId,
          error: result.error,
          template: email
        }
      }
    })

    return {
      ...result,
      communicationId: communication.id
    }
  }

  /**
   * Send follow-up email for pending quote
   */
  async sendFollowUp(params: {
    originalCommunicationId: string
    userId: string
  }): Promise<EmailResult> {
    // Get original communication
    const originalComm = await prisma.communication.findUnique({
      where: { id: params.originalCommunicationId },
      include: {
        project: true,
        vendor: true,
        user: true
      }
    })

    if (!originalComm) {
      return {
        success: false,
        error: 'Original communication not found'
      }
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: params.userId }
    })

    if (!currentUser) {
      return {
        success: false,
        error: 'User not found'
      }
    }

    // Compose follow-up
    const email = await this.emailAgent.composeFollowUp({
      vendorName: originalComm.vendor!.name,
      projectName: originalComm.project.name,
      originalDate: originalComm.sent_at || originalComm.created_at,
      contactPerson: currentUser.name
    })

    // Send email
    const result = await this.sendEmail({
      to: originalComm.vendor!.email,
      toName: originalComm.vendor!.name,
      subject: email.subject,
      body: email.body,
      from: currentUser.email,
      fromName: currentUser.name
    })

    // Track follow-up
    const communication = await prisma.communication.create({
      data: {
        project_id: originalComm.project_id,
        phase_id: originalComm.phase_id,
        vendor_id: originalComm.vendor_id,
        user_id: params.userId,
        type: 'FOLLOW_UP',
        direction: 'OUTGOING',
        subject: email.subject,
        body: email.body,
        status: result.success ? 'SENT' : 'FAILED',
        sent_at: result.success ? new Date() : null,
        metadata: {
          messageId: result.messageId,
          error: result.error,
          originalCommunicationId: params.originalCommunicationId
        }
      }
    })

    return {
      ...result,
      communicationId: communication.id
    }
  }

  /**
   * Send acceptance email for quote
   */
  async sendAcceptance(params: {
    quoteId: string
    userId: string
    nextSteps?: string[]
  }): Promise<EmailResult> {
    // Get quote and related data
    const quote = await prisma.quote.findUnique({
      where: { id: params.quoteId },
      include: {
        vendor: true,
        phase: {
          include: {
            project: true
          }
        }
      }
    })

    if (!quote) {
      return {
        success: false,
        error: 'Quote not found'
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: params.userId }
    })

    if (!user) {
      return {
        success: false,
        error: 'User not found'
      }
    }

    // Compose acceptance email
    const email = await this.emailAgent.composeAcceptance({
      vendorName: quote.vendor.name,
      projectName: quote.phase.project.name,
      quoteAmount: Number(quote.total_price),
      contactPerson: user.name,
      nextSteps: params.nextSteps
    })

    // Send email
    const result = await this.sendEmail({
      to: quote.vendor.email,
      toName: quote.vendor.name,
      subject: email.subject,
      body: email.body,
      from: user.email,
      fromName: user.name
    })

    // Update quote status and track communication
    await Promise.all([
      prisma.quote.update({
        where: { id: params.quoteId },
        data: { status: 'ACCEPTED' }
      }),
      prisma.communication.create({
        data: {
          project_id: quote.phase.project_id,
          phase_id: quote.phase_id,
          vendor_id: quote.vendor_id,
          user_id: params.userId,
          type: 'QUOTE_ACCEPTANCE',
          direction: 'OUTGOING',
          subject: email.subject,
          body: email.body,
          status: result.success ? 'SENT' : 'FAILED',
          sent_at: result.success ? new Date() : null,
          metadata: {
            messageId: result.messageId,
            error: result.error,
            quoteId: params.quoteId
          }
        }
      })
    ])

    return {
      ...result,
      communicationId: quote.id
    }
  }

  /**
   * Process incoming email (webhook handler for SendGrid Inbound Parse)
   */
  async processIncomingEmail(params: {
    from: string
    to: string
    subject: string
    body: string
    headers?: Record<string, string>
  }): Promise<void> {
    // Find vendor by email
    const vendor = await prisma.vendor.findFirst({
      where: { email: params.from }
    })

    if (!vendor) {
      console.log(`⚠️  Incoming email from unknown sender: ${params.from}`)
      return
    }

    // Find related project/phase based on subject or recent communications
    const recentComm = await prisma.communication.findFirst({
      where: {
        vendor_id: vendor.id,
        direction: 'OUTGOING',
        status: 'SENT'
      },
      orderBy: { sent_at: 'desc' }
    })

    if (!recentComm) {
      console.log(`⚠️  No recent communication found for vendor: ${vendor.name}`)
      return
    }

    // Store incoming email
    const communication = await prisma.communication.create({
      data: {
        project_id: recentComm.project_id,
        phase_id: recentComm.phase_id,
        vendor_id: vendor.id,
        type: 'QUOTE_RESPONSE',
        direction: 'INCOMING',
        subject: params.subject,
        body: params.body,
        status: 'RECEIVED',
        received_at: new Date(),
        metadata: {
          headers: params.headers
        }
      }
    })

    // Try to parse quote information
    const phase = await prisma.phase.findUnique({
      where: { id: recentComm.phase_id! },
      include: { project: true }
    })

    if (phase) {
      const parsed = await this.emailAgent.parseQuoteResponse(params.body, {
        vendorName: vendor.name,
        projectName: phase.project.name,
        phaseType: phase.type
      })

      // Create or update quote
      if (parsed.priceQuoted) {
        await prisma.quote.create({
          data: {
            vendor_id: vendor.id,
            phase_id: phase.id,
            total_price: parsed.priceQuoted,
            price_breakdown: parsed.priceBreakdown as any,
            status: 'PENDING',
            received_at: new Date(),
            valid_until: parsed.validUntil,
            notes: parsed.notes,
            metadata: {
              communicationId: communication.id,
              aiParsed: true
            }
          }
        })

        console.log(`✅ Quote created from email: €${parsed.priceQuoted} from ${vendor.name}`)
      }
    }
  }

  /**
   * Bulk send quote requests to multiple vendors
   */
  async bulkSendQuoteRequests(params: {
    projectId: string
    phaseId: string
    vendorIds: string[]
    userId: string
    customMessage?: string
  }): Promise<EmailResult[]> {
    const results: EmailResult[] = []

    for (const vendorId of params.vendorIds) {
      const result = await this.sendQuoteRequest({
        projectId: params.projectId,
        phaseId: params.phaseId,
        vendorId,
        userId: params.userId,
        customMessage: params.customMessage
      })

      results.push(result)

      // Small delay to avoid rate limiting
      await this.sleep(500)
    }

    return results
  }

  /**
   * Convert plain text to simple HTML
   */
  private convertToHtml(text: string): string {
    return text
      .split('\n\n')
      .map(para => `<p>${para.replace(/\n/g, '<br>')}</p>`)
      .join('\n')
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService()
  }
  return emailServiceInstance
}
