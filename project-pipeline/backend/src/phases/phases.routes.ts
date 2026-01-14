import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/database.js'
import { TravelAgent, TravelSearchParams } from '../ai/agents/travel-agent.js'
import { FoodAgent } from '../ai/agents/food-agent.js'
import { AccommodationAgent } from '../ai/agents/accommodation-agent.js'
import { AgentContext } from '../ai/agents/base-agent.js'

// Validation schemas
const createPhaseSchema = z.object({
  project_id: z.string(),
  name: z.string().min(2),
  type: z.enum([
    'ACCOMMODATION',
    'TRAVEL',
    'FOOD',
    'ACTIVITIES',
    'EVENTS',
    'INSURANCE',
    'EMERGENCY_PLANNING',
    'PERMITS',
    'APPLICATION',
    'REPORTING',
    'CUSTOM'
  ]),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  deadline: z.string().datetime().optional(),
  budget_allocated: z.number().nonnegative(),
  order: z.number().int().nonnegative(),
  dependencies: z.array(z.string()).default([]),
  checklist: z.record(z.unknown()).optional(),
  editable: z.boolean().default(true),
  skippable: z.boolean().default(true)
})

const updatePhaseSchema = createPhaseSchema.partial().omit({ project_id: true })

export async function registerPhaseRoutes(app: FastifyInstance) {
  // GET /phases - List phases for a project
  app.get('/projects/:projectId/phases', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { projectId: string } }>, reply: FastifyReply) => {
    try {
      const { projectId } = request.params
      const userId = (request.user as any).userId

      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: projectId, created_by: userId }
      })

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' })
      }

      const phases = await prisma.phase.findMany({
        where: { project_id: projectId },
        include: {
          assignments: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          quotes: {
            include: { vendor: true }
          },
          _count: {
            select: {
              communications: true,
              conversations: true
            }
          }
        },
        orderBy: { order: 'asc' }
      })

      return reply.send({ phases })
    } catch (error) {
      throw error
    }
  })

  // POST /phases - Create new phase
  app.post('/phases', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const data = createPhaseSchema.parse(request.body)

      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: data.project_id, created_by: userId }
      })

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' })
      }

      const phase = await prisma.phase.create({
        data: {
          ...data,
          start_date: new Date(data.start_date),
          end_date: new Date(data.end_date),
          ...(data.deadline && { deadline: new Date(data.deadline) }),
          status: 'NOT_STARTED'
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return reply.code(201).send({ phase })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // GET /phases/:id - Get phase details
  app.get('/phases/:id', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params
      const userId = (request.user as any).userId

      const phase = await prisma.phase.findFirst({
        where: {
          id,
          project: {
            created_by: userId
          }
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              location: true,
              participants_count: true,
              start_date: true,
              end_date: true
            }
          },
          assignments: {
            include: {
              user: {
                select: { id: true, name: true, email: true }
              }
            }
          },
          communications: {
            include: {
              vendor: true
            },
            orderBy: { created_at: 'desc' }
          },
          quotes: {
            include: {
              vendor: true
            },
            orderBy: { received_at: 'desc' }
          },
          conversations: {
            orderBy: { updated_at: 'desc' },
            take: 1
          }
        }
      })

      if (!phase) {
        return reply.code(404).send({ error: 'Phase not found' })
      }

      return reply.send({ phase })
    } catch (error) {
      throw error
    }
  })

  // PATCH /phases/:id - Update phase
  app.patch('/phases/:id', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params
      const userId = (request.user as any).userId
      const data = updatePhaseSchema.parse(request.body)

      // Verify ownership
      const existing = await prisma.phase.findFirst({
        where: {
          id,
          project: {
            created_by: userId
          }
        }
      })

      if (!existing) {
        return reply.code(404).send({ error: 'Phase not found' })
      }

      const phase = await prisma.phase.update({
        where: { id },
        data: {
          ...data,
          ...(data.start_date && { start_date: new Date(data.start_date) }),
          ...(data.end_date && { end_date: new Date(data.end_date) }),
          ...(data.deadline && { deadline: new Date(data.deadline) })
        },
        include: {
          project: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      return reply.send({ phase })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // DELETE /phases/:id - Delete phase
  app.delete('/phases/:id', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params
      const userId = (request.user as any).userId

      // Verify ownership
      const existing = await prisma.phase.findFirst({
        where: {
          id,
          project: {
            created_by: userId
          }
        }
      })

      if (!existing) {
        return reply.code(404).send({ error: 'Phase not found' })
      }

      await prisma.phase.delete({
        where: { id }
      })

      return reply.code(204).send()
    } catch (error) {
      throw error
    }
  })

  // POST /phases/:phaseId/search-travel - Search for travel options
  app.post('/phases/:phaseId/search-travel', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{
    Params: { phaseId: string }
    Body: {
      origin: string
      destination: string
      date: string
      passengers: number
    }
  }>, reply: FastifyReply) => {
    try {
      const { phaseId } = request.params
      const userId = (request.user as any).userId
      const { origin, destination, date, passengers } = request.body as any

      // Load phase and project context
      const phase = await prisma.phase.findFirst({
        where: {
          id: phaseId,
          project: {
            created_by: userId
          }
        },
        include: {
          project: true
        }
      })

      if (!phase) {
        return reply.code(404).send({ error: 'Phase not found' })
      }

      // Build agent context
      const context: AgentContext = {
        project: phase.project,
        phase: phase
      }

      // Search for travel options
      const travelAgent = new TravelAgent()
      const searchParams: TravelSearchParams = {
        origin,
        destination,
        date: new Date(date),
        passengers
      }

      const results = await travelAgent.search(searchParams, context)

      return reply.send({
        success: true,
        data: results
      })
    } catch (error) {
      console.error('Travel search error:', error)
      return reply.code(500).send({
        error: 'Failed to search travel options',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // POST /phases/:phaseId/search-food - Search for food options
  app.post('/phases/:phaseId/search-food', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{
    Params: { phaseId: string }
  }>, reply: FastifyReply) => {
    try {
      const { phaseId } = request.params
      const userId = (request.user as any).userId

      // Load phase and project context
      const phase = await prisma.phase.findFirst({
        where: {
          id: phaseId,
          project: {
            created_by: userId
          }
        },
        include: {
          project: true
        }
      })

      if (!phase) {
        return reply.code(404).send({ error: 'Phase not found' })
      }

      // Build agent context
      const context: AgentContext = {
        project: phase.project,
        phase: phase
      }

      // Search for food options
      const foodAgent = new FoodAgent()
      const results = await foodAgent.research(context)

      return reply.send({
        success: true,
        data: results
      })
    } catch (error) {
      console.error('Food search error:', error)
      return reply.code(500).send({
        error: 'Failed to search food options',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // POST /phases/:phaseId/search-accommodation - Search for accommodation options
  app.post('/phases/:phaseId/search-accommodation', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{
    Params: { phaseId: string }
    Body: {
      useRealData?: boolean
    }
  }>, reply: FastifyReply) => {
    try {
      const { phaseId } = request.params
      const userId = (request.user as any).userId
      const { useRealData = true } = request.body as any || {}

      // Load phase and project context
      const phase = await prisma.phase.findFirst({
        where: {
          id: phaseId,
          project: {
            created_by: userId
          }
        },
        include: {
          project: true
        }
      })

      if (!phase) {
        return reply.code(404).send({ error: 'Phase not found' })
      }

      // Build agent context
      const context: AgentContext = {
        project: phase.project,
        phase: phase
      }

      // Search for accommodation options
      const accommodationAgent = new AccommodationAgent()
      const results = await accommodationAgent.research(context, useRealData)

      return reply.send({
        success: true,
        data: results
      })
    } catch (error) {
      console.error('Accommodation search error:', error)
      return reply.code(500).send({
        error: 'Failed to search accommodation options',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })

  // POST /phases/:phaseId/generate-quotes - Generate quote emails for selected options
  app.post('/phases/:phaseId/generate-quotes', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{
    Params: { phaseId: string }
    Body: {
      type: 'travel' | 'food' | 'accommodation'
      option: any
      travelParams?: TravelSearchParams
    }
  }>, reply: FastifyReply) => {
    try {
      const { phaseId } = request.params
      const userId = (request.user as any).userId
      const { type, option, travelParams } = request.body as any

      // Load phase and project context
      const phase = await prisma.phase.findFirst({
        where: {
          id: phaseId,
          project: {
            created_by: userId
          }
        },
        include: {
          project: true
        }
      })

      if (!phase) {
        return reply.code(404).send({ error: 'Phase not found' })
      }

      // Build agent context
      const context: AgentContext = {
        project: phase.project,
        phase: phase
      }

      let quoteEmail: string | { subject: string; body: string }

      // Generate quote based on type
      switch (type) {
        case 'travel': {
          if (!travelParams) {
            return reply.code(400).send({ error: 'travelParams required for travel quotes' })
          }
          const travelAgent = new TravelAgent()
          const params: TravelSearchParams = {
            ...travelParams,
            date: new Date(travelParams.date)
          }
          quoteEmail = await travelAgent.generateQuoteEmail(option, params, context)
          break
        }
        case 'food': {
          const foodAgent = new FoodAgent()
          quoteEmail = await foodAgent.generateQuoteEmail(option, context)
          break
        }
        case 'accommodation': {
          const accommodationAgent = new AccommodationAgent()
          quoteEmail = await accommodationAgent.generateQuoteEmail(option, context)
          break
        }
        default:
          return reply.code(400).send({ error: 'Invalid type. Must be travel, food, or accommodation' })
      }

      return reply.send({
        success: true,
        data: quoteEmail
      })
    } catch (error) {
      console.error('Quote generation error:', error)
      return reply.code(500).send({
        error: 'Failed to generate quote',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  })
}
