import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/database.js'

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
}
