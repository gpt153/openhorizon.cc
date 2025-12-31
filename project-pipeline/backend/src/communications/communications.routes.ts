import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/database.js'
import { getEmailService } from './email.service.js'
import { EmailAgent } from '../ai/agents/email-agent.js'

// Validation schemas
const sendQuoteRequestSchema = z.object({
  projectId: z.string(),
  phaseId: z.string(),
  vendorId: z.string(),
  customMessage: z.string().optional()
})

const bulkSendSchema = z.object({
  projectId: z.string(),
  phaseId: z.string(),
  vendorIds: z.array(z.string()).min(1),
  customMessage: z.string().optional()
})

const sendFollowUpSchema = z.object({
  originalCommunicationId: z.string()
})

const sendAcceptanceSchema = z.object({
  quoteId: z.string(),
  nextSteps: z.array(z.string()).optional()
})

const improveDraftSchema = z.object({
  draft: z.string().min(10),
  purpose: z.enum(['quote_request', 'follow_up', 'acceptance', 'general']),
  tone: z.enum(['formal', 'friendly', 'professional']).optional()
})

const composeCustomSchema = z.object({
  vendorId: z.string(),
  projectId: z.string(),
  phaseId: z.string(),
  purpose: z.string(),
  requirements: z.array(z.string()).optional()
})

export async function registerCommunicationsRoutes(app: FastifyInstance) {
  const emailService = getEmailService()
  const emailAgent = new EmailAgent()

  // GET /communications - List all communications for a project
  app.get('/projects/:projectId/communications', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{
    Params: { projectId: string }
    Querystring: { phaseId?: string, vendorId?: string }
  }>, reply: FastifyReply) => {
    try {
      const { projectId } = request.params
      const { phaseId, vendorId } = request.query
      const userId = (request.user as any).userId

      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: projectId, created_by: userId }
      })

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' })
      }

      const communications = await prisma.communication.findMany({
        where: {
          project_id: projectId,
          ...(phaseId && { phase_id: phaseId }),
          ...(vendorId && { vendor_id: vendorId })
        },
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              email: true,
              type: true
            }
          },
          phase: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      })

      return reply.send({ communications })
    } catch (error) {
      throw error
    }
  })

  // POST /communications/quote-request - Send quote request to vendor
  app.post('/communications/quote-request', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const data = sendQuoteRequestSchema.parse(request.body)

      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: data.projectId, created_by: userId }
      })

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' })
      }

      const result = await emailService.sendQuoteRequest({
        ...data,
        userId
      })

      if (!result.success) {
        return reply.code(500).send({
          error: 'Failed to send email',
          details: result.error
        })
      }

      return reply.code(201).send({
        success: true,
        communicationId: result.communicationId,
        messageId: result.messageId
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // POST /communications/bulk-quote-request - Send to multiple vendors
  app.post('/communications/bulk-quote-request', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const data = bulkSendSchema.parse(request.body)

      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: data.projectId, created_by: userId }
      })

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' })
      }

      const results = await emailService.bulkSendQuoteRequests({
        ...data,
        userId
      })

      const successCount = results.filter(r => r.success).length
      const failureCount = results.filter(r => !r.success).length

      return reply.code(201).send({
        success: true,
        total: results.length,
        sent: successCount,
        failed: failureCount,
        results
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // POST /communications/follow-up - Send follow-up email
  app.post('/communications/follow-up', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const data = sendFollowUpSchema.parse(request.body)

      const result = await emailService.sendFollowUp({
        ...data,
        userId
      })

      if (!result.success) {
        return reply.code(500).send({
          error: 'Failed to send follow-up',
          details: result.error
        })
      }

      return reply.code(201).send({
        success: true,
        communicationId: result.communicationId,
        messageId: result.messageId
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // POST /communications/accept-quote - Send quote acceptance
  app.post('/communications/accept-quote', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const data = sendAcceptanceSchema.parse(request.body)

      const result = await emailService.sendAcceptance({
        ...data,
        userId
      })

      if (!result.success) {
        return reply.code(500).send({
          error: 'Failed to send acceptance',
          details: result.error
        })
      }

      return reply.code(201).send({
        success: true,
        communicationId: result.communicationId,
        messageId: result.messageId
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // POST /communications/improve-draft - Get AI improvements for email draft
  app.post('/communications/improve-draft', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = improveDraftSchema.parse(request.body)

      const result = await emailAgent.improveDraft(data.draft, {
        purpose: data.purpose,
        tone: data.tone
      })

      return reply.send({
        improved: result.improved,
        suggestions: result.suggestions,
        changes: result.changes
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // POST /communications/compose - AI compose custom email
  app.post('/communications/compose', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const data = composeCustomSchema.parse(request.body)

      // Get context
      const [vendor, project, phase, user] = await Promise.all([
        prisma.vendor.findUnique({ where: { id: data.vendorId } }),
        prisma.project.findUnique({ where: { id: data.projectId } }),
        prisma.phase.findUnique({ where: { id: data.phaseId } }),
        prisma.user.findUnique({ where: { id: userId } })
      ])

      if (!vendor || !project || !phase || !user) {
        return reply.code(404).send({ error: 'Vendor, project, phase, or user not found' })
      }

      // Compose using AI
      const email = await emailAgent.composeQuoteRequest({
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
        requirements: data.requirements,
        contactPerson: user.name,
        contactEmail: user.email
      })

      return reply.send({
        subject: email.subject,
        body: email.body,
        tone: email.tone,
        language: email.language
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // POST /communications/webhook/inbound - Webhook for incoming emails (SendGrid Inbound Parse)
  app.post('/communications/webhook/inbound', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const body = request.body as any

      await emailService.processIncomingEmail({
        from: body.from,
        to: body.to,
        subject: body.subject,
        body: body.text || body.html,
        headers: body.headers
      })

      return reply.code(200).send({ success: true })
    } catch (error) {
      console.error('Inbound email webhook error:', error)
      return reply.code(500).send({ error: 'Failed to process incoming email' })
    }
  })

  // GET /communications/:id - Get communication details
  app.get('/communications/:id', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params
      const userId = (request.user as any).userId

      const communication = await prisma.communication.findFirst({
        where: {
          id,
          project: {
            created_by: userId
          }
        },
        include: {
          vendor: true,
          phase: {
            select: {
              id: true,
              name: true,
              type: true
            }
          },
          project: {
            select: {
              id: true,
              name: true
            }
          },
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      if (!communication) {
        return reply.code(404).send({ error: 'Communication not found' })
      }

      return reply.send({ communication })
    } catch (error) {
      throw error
    }
  })
}
