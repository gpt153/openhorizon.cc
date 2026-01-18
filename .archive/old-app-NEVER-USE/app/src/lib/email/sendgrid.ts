/**
 * SendGrid Email Service
 * Handles email sending with delivery tracking and webhook events
 */

import sgMail from '@sendgrid/mail'
import type { MailDataRequired } from '@sendgrid/mail'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

export interface SendEmailParams {
  to: string | string[]
  from?: string
  fromName?: string
  subject: string
  html: string
  text?: string
  replyTo?: string
  trackingSettings?: {
    clickTracking?: boolean
    openTracking?: boolean
  }
  customArgs?: Record<string, string>
}

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface SendGridEvent {
  event: 'processed' | 'delivered' | 'open' | 'click' | 'bounce' | 'dropped' | 'spamreport' | 'unsubscribe'
  email: string
  timestamp: number
  'sg_message_id': string
  communicationId?: string
  reason?: string
  url?: string
  [key: string]: any
}

/**
 * SendGrid Email Service Class
 */
export class SendGridEmailService {
  private defaultFrom: string
  private defaultFromName: string

  constructor() {
    this.defaultFrom = process.env.SENDGRID_FROM_EMAIL || 'projects@openhorizon.cc'
    this.defaultFromName = process.env.SENDGRID_FROM_NAME || 'Open Horizon Projects'
  }

  /**
   * Send an email via SendGrid with tracking enabled
   */
  async sendEmail(params: SendEmailParams): Promise<EmailResult> {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ SENDGRID_API_KEY not configured')
      return {
        success: false,
        error: 'SendGrid not configured. Please add SENDGRID_API_KEY to environment variables.',
      }
    }

    try {
      const msg: MailDataRequired = {
        to: params.to,
        from: {
          email: params.from || this.defaultFrom,
          name: params.fromName || this.defaultFromName,
        },
        subject: params.subject,
        html: params.html,
        text: params.text || this.htmlToText(params.html),
        replyTo: params.replyTo,
        trackingSettings: {
          clickTracking: {
            enable: params.trackingSettings?.clickTracking !== false,
            enableText: false,
          },
          openTracking: {
            enable: params.trackingSettings?.openTracking !== false,
          },
        },
        customArgs: params.customArgs,
      }

      const response = await sgMail.send(msg)

      // Extract message ID from response
      const messageId = response[0].headers['x-message-id'] as string

      console.log(`✅ Email sent via SendGrid: ${messageId}`)

      return {
        success: true,
        messageId,
      }
    } catch (error: any) {
      console.error('❌ SendGrid error:', error)

      let errorMessage = 'Failed to send email'
      if (error.response?.body?.errors) {
        errorMessage = error.response.body.errors
          .map((e: any) => e.message)
          .join(', ')
      } else if (error.message) {
        errorMessage = error.message
      }

      return {
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * Send a quote request email
   */
  async sendQuoteRequest(params: {
    to: string
    subject: string
    html: string
    text: string
    replyTo: string
    communicationId: string
  }): Promise<EmailResult> {
    return this.sendEmail({
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      replyTo: params.replyTo,
      customArgs: {
        communicationId: params.communicationId,
        type: 'quote_request',
      },
    })
  }

  /**
   * Send multiple quote requests (bulk)
   */
  async sendBulkQuoteRequests(
    emails: Array<{
      to: string
      subject: string
      html: string
      text: string
      replyTo: string
      communicationId: string
    }>
  ): Promise<EmailResult[]> {
    const results: EmailResult[] = []

    // SendGrid allows up to 1000 emails per request in bulk, but we'll send individually
    // to have better error handling and tracking per vendor
    for (const email of emails) {
      const result = await this.sendQuoteRequest(email)
      results.push(result)

      // Small delay to avoid rate limiting (if needed)
      if (emails.length > 10) {
        await this.sleep(100)
      }
    }

    return results
  }

  /**
   * Verify SendGrid webhook signature (security)
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
    timestamp: string
  ): boolean {
    if (!process.env.SENDGRID_WEBHOOK_SECRET) {
      console.warn('⚠️  SENDGRID_WEBHOOK_SECRET not configured - skipping verification')
      return true // Allow in development
    }

    const crypto = require('crypto')
    const publicKey = process.env.SENDGRID_WEBHOOK_SECRET

    try {
      const verifier = crypto.createVerify('RSA-SHA256')
      verifier.update(timestamp + payload)
      return verifier.verify(publicKey, signature, 'base64')
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error)
      return false
    }
  }

  /**
   * Parse SendGrid webhook event
   */
  parseWebhookEvent(event: SendGridEvent): {
    messageId: string
    communicationId?: string
    event: string
    timestamp: Date
    metadata: any
  } {
    return {
      messageId: event.sg_message_id,
      communicationId: event.communicationId,
      event: event.event,
      timestamp: new Date(event.timestamp * 1000),
      metadata: {
        email: event.email,
        reason: event.reason,
        url: event.url,
        userAgent: event.useragent,
        ip: event.ip,
      },
    }
  }

  /**
   * Simple HTML to text conversion
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<style[^>]*>.*?<\/style>/gi, '')
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim()
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Export singleton instance
export const sendGridService = new SendGridEmailService()
