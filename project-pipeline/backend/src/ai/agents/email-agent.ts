import { BaseAgent, AgentContext } from './base-agent.js'
import { prisma } from '../../config/database.js'

export interface EmailTemplate {
  subject: string
  body: string
  tone: 'formal' | 'friendly' | 'professional'
  language: string
}

export interface QuoteRequestParams {
  vendorName: string
  vendorEmail: string
  phaseType: string
  projectName: string
  location: string
  dates: {
    checkIn: Date
    checkOut: Date
  }
  participants: number
  requirements?: string[]
  budget?: {
    min: number
    max: number
  }
  contactPerson: string
  contactEmail: string
  deadline?: Date
}

export class EmailAgent extends BaseAgent {
  constructor() {
    super('claude-3-5-sonnet-20241022')
  }

  /**
   * Compose an email to request a quote from a vendor
   */
  async composeQuoteRequest(params: QuoteRequestParams): Promise<EmailTemplate> {
    const systemPrompt = `You are a professional email composition assistant for Erasmus+ project coordinators.

Your task: Compose a professional email to request a quote from a vendor.

Requirements:
- Use a professional, friendly tone
- Be clear and specific about dates, participants, and requirements
- Include all necessary project details
- Ask for detailed quote breakdown
- Provide deadline for response
- Include contact information

Context:
Project: ${params.projectName}
Vendor: ${params.vendorName}
Phase: ${params.phaseType}
Location: ${params.location}
Dates: ${params.dates.checkIn.toLocaleDateString()} to ${params.dates.checkOut.toLocaleDateString()}
Participants: ${params.participants} people
Contact: ${params.contactPerson} (${params.contactEmail})
${params.requirements ? `\nSpecial Requirements:\n${params.requirements.map(r => `- ${r}`).join('\n')}` : ''}
${params.budget ? `\nBudget Range: €${params.budget.min} - €${params.budget.max}` : ''}
${params.deadline ? `\nResponse Deadline: ${params.deadline.toLocaleDateString()}` : ''}

Return ONLY a JSON object with fields: subject, body, tone, language
The email should be ready to send without modifications.`

    const userMessage = 'Please compose the quote request email.'

    try {
      const response = await this.generateResponse(systemPrompt, userMessage)

      // Try to parse JSON
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const email = JSON.parse(jsonMatch[0])
        return {
          subject: email.subject || this.getDefaultSubject(params),
          body: email.body || this.getDefaultBody(params),
          tone: email.tone || 'professional',
          language: email.language || 'en'
        }
      }

      return this.getDefaultEmail(params)
    } catch (error) {
      console.error('Email composition error:', error)
      return this.getDefaultEmail(params)
    }
  }

  /**
   * Compose follow-up email for pending quotes
   */
  async composeFollowUp(params: {
    vendorName: string
    projectName: string
    originalDate: Date
    contactPerson: string
  }): Promise<EmailTemplate> {
    const systemPrompt = `You are composing a polite follow-up email for a quote request.

Original request was sent on: ${params.originalDate.toLocaleDateString()}
Project: ${params.projectName}
Vendor: ${params.vendorName}
Contact: ${params.contactPerson}

Compose a brief, polite follow-up email asking about the status of the quote.
Remain professional and friendly.
Offer to provide additional information if needed.

Return ONLY a JSON object with fields: subject, body, tone, language`

    try {
      const response = await this.generateResponse(systemPrompt, 'Compose the follow-up email.')

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const email = JSON.parse(jsonMatch[0])
        return {
          subject: email.subject || `Follow-up: Quote Request for ${params.projectName}`,
          body: email.body || this.getDefaultFollowUpBody(params),
          tone: email.tone || 'friendly',
          language: email.language || 'en'
        }
      }

      return {
        subject: `Follow-up: Quote Request for ${params.projectName}`,
        body: this.getDefaultFollowUpBody(params),
        tone: 'friendly',
        language: 'en'
      }
    } catch (error) {
      console.error('Follow-up composition error:', error)
      return {
        subject: `Follow-up: Quote Request for ${params.projectName}`,
        body: this.getDefaultFollowUpBody(params),
        tone: 'friendly',
        language: 'en'
      }
    }
  }

  /**
   * Parse vendor response to extract quote information
   */
  async parseQuoteResponse(emailBody: string, context: {
    vendorName: string
    projectName: string
    phaseType: string
  }): Promise<{
    priceQuoted: number | null
    priceBreakdown?: Record<string, number>
    availability: boolean
    notes: string
    validUntil?: Date
  }> {
    const systemPrompt = `You are analyzing a vendor's email response to extract quote information.

Vendor: ${context.vendorName}
Project: ${context.projectName}
Phase: ${context.phaseType}

Email to analyze:
${emailBody}

Extract:
1. Total price quoted (if mentioned)
2. Price breakdown if provided (e.g., per person, per night, extras)
3. Whether they confirmed availability (true/false)
4. Important notes or conditions
5. Quote validity date if mentioned

Return ONLY a JSON object with fields: priceQuoted (number or null), priceBreakdown (object), availability (boolean), notes (string), validUntil (ISO date string or null)`

    try {
      const response = await this.generateResponse(systemPrompt, 'Extract quote information from this email.')

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          priceQuoted: parsed.priceQuoted,
          priceBreakdown: parsed.priceBreakdown,
          availability: parsed.availability ?? false,
          notes: parsed.notes || '',
          validUntil: parsed.validUntil ? new Date(parsed.validUntil) : undefined
        }
      }

      return {
        priceQuoted: null,
        availability: false,
        notes: 'Failed to parse email automatically. Manual review required.'
      }
    } catch (error) {
      console.error('Email parsing error:', error)
      return {
        priceQuoted: null,
        availability: false,
        notes: 'Parsing error. Manual review required.'
      }
    }
  }

  /**
   * Compose acceptance email
   */
  async composeAcceptance(params: {
    vendorName: string
    projectName: string
    quoteAmount: number
    contactPerson: string
    nextSteps?: string[]
  }): Promise<EmailTemplate> {
    const systemPrompt = `You are composing an email to accept a vendor's quote.

Vendor: ${params.vendorName}
Project: ${params.projectName}
Quote Amount: €${params.quoteAmount}
Contact: ${params.contactPerson}
${params.nextSteps ? `\nNext Steps:\n${params.nextSteps.map(s => `- ${s}`).join('\n')}` : ''}

Compose a professional email that:
- Thanks them for the quote
- Confirms acceptance
- States the agreed amount
- Asks about next steps (contract, payment, booking confirmation)
- Provides contact information for follow-up

Return ONLY a JSON object with fields: subject, body, tone, language`

    try {
      const response = await this.generateResponse(systemPrompt, 'Compose the acceptance email.')

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const email = JSON.parse(jsonMatch[0])
        return {
          subject: email.subject || `Acceptance: ${params.projectName} - €${params.quoteAmount}`,
          body: email.body || this.getDefaultAcceptanceBody(params),
          tone: email.tone || 'professional',
          language: email.language || 'en'
        }
      }

      return {
        subject: `Acceptance: ${params.projectName} - €${params.quoteAmount}`,
        body: this.getDefaultAcceptanceBody(params),
        tone: 'professional',
        language: 'en'
      }
    } catch (error) {
      console.error('Acceptance email composition error:', error)
      return {
        subject: `Acceptance: ${params.projectName} - €${params.quoteAmount}`,
        body: this.getDefaultAcceptanceBody(params),
        tone: 'professional',
        language: 'en'
      }
    }
  }

  // Default email templates

  private getDefaultSubject(params: QuoteRequestParams): string {
    return `Quote Request: ${params.projectName} - ${params.phaseType} (${params.participants} participants)`
  }

  private getDefaultBody(params: QuoteRequestParams): string {
    return `Dear ${params.vendorName},

I am writing to request a quote for ${params.phaseType.toLowerCase()} services for our Erasmus+ project "${params.projectName}".

Project Details:
- Location: ${params.location}
- Check-in: ${params.dates.checkIn.toLocaleDateString()}
- Check-out: ${params.dates.checkOut.toLocaleDateString()}
- Number of participants: ${params.participants}
${params.requirements ? `\nSpecial Requirements:\n${params.requirements.map(r => `- ${r}`).join('\n')}` : ''}

Could you please provide:
1. Detailed quote breakdown
2. Availability confirmation
3. Payment terms
4. Cancellation policy
${params.deadline ? `\nWe would appreciate receiving your quote by ${params.deadline.toLocaleDateString()}.` : ''}

Please feel free to contact me if you need any additional information.

Best regards,
${params.contactPerson}
${params.contactEmail}`
  }

  private getDefaultEmail(params: QuoteRequestParams): EmailTemplate {
    return {
      subject: this.getDefaultSubject(params),
      body: this.getDefaultBody(params),
      tone: 'professional',
      language: 'en'
    }
  }

  private getDefaultFollowUpBody(params: {
    vendorName: string
    projectName: string
    originalDate: Date
    contactPerson: string
  }): string {
    return `Dear ${params.vendorName},

I hope this email finds you well. I am following up on our quote request for "${params.projectName}" that we sent on ${params.originalDate.toLocaleDateString()}.

We are still very interested in working with you and would appreciate an update on the status of our quote request.

If you need any additional information or clarification, please don't hesitate to reach out.

Thank you for your time and consideration.

Best regards,
${params.contactPerson}`
  }

  private getDefaultAcceptanceBody(params: {
    vendorName: string
    projectName: string
    quoteAmount: number
    contactPerson: string
    nextSteps?: string[]
  }): string {
    return `Dear ${params.vendorName},

Thank you for your quote for "${params.projectName}". We are pleased to inform you that we would like to accept your offer of €${params.quoteAmount}.

We confirm our agreement to proceed at this price. Could you please provide information about:
- Booking confirmation process
- Payment schedule and methods
- Contract or agreement documentation
${params.nextSteps ? params.nextSteps.map(s => `- ${s}`).join('\n') : ''}

We look forward to working with you.

Best regards,
${params.contactPerson}`
  }

  /**
   * Suggest improvements to a user-written email
   */
  async improveDraft(draft: string, context: {
    purpose: 'quote_request' | 'follow_up' | 'acceptance' | 'general'
    tone?: 'formal' | 'friendly' | 'professional'
  }): Promise<{
    improved: string
    suggestions: string[]
    changes: string[]
  }> {
    const systemPrompt = `You are an email improvement assistant.

Original draft:
${draft}

Purpose: ${context.purpose}
Desired tone: ${context.tone || 'professional'}

Improve this email by:
1. Fixing grammar and spelling
2. Enhancing clarity
3. Adjusting tone to be ${context.tone || 'professional'}
4. Ensuring all key information is included

Return ONLY a JSON object with fields:
- improved (string): the improved email text
- suggestions (array): list of improvement suggestions
- changes (array): list of what was changed`

    try {
      const response = await this.generateResponse(systemPrompt, 'Improve this email draft.')

      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        return {
          improved: result.improved || draft,
          suggestions: result.suggestions || [],
          changes: result.changes || []
        }
      }

      return {
        improved: draft,
        suggestions: ['Unable to generate improvements'],
        changes: []
      }
    } catch (error) {
      console.error('Draft improvement error:', error)
      return {
        improved: draft,
        suggestions: ['Error improving draft'],
        changes: []
      }
    }
  }
}
