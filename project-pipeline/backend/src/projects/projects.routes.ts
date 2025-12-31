import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/database.js'

// Validation schemas
const createProjectSchema = z.object({
  name: z.string().min(3),
  type: z.enum(['STUDENT_EXCHANGE', 'TRAINING', 'CONFERENCE', 'CUSTOM']),
  description: z.string().optional(),
  start_date: z.string().datetime(),
  end_date: z.string().datetime(),
  budget_total: z.number().positive(),
  participants_count: z.number().int().positive(),
  location: z.string(),
  metadata: z.record(z.unknown()).optional()
})

const updateProjectSchema = createProjectSchema.partial()

export async function registerProjectRoutes(app: FastifyInstance) {
  // GET /projects - List all projects for user
  app.get('/projects', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId

      const projects = await prisma.project.findMany({
        where: { created_by: userId },
        include: {
          phases: {
            select: {
              id: true,
              name: true,
              type: true,
              status: true,
              budget_allocated: true,
              budget_spent: true
            },
            orderBy: { order: 'asc' }
          },
          _count: {
            select: {
              phases: true,
              communications: true
            }
          }
        },
        orderBy: { created_at: 'desc' }
      })

      return reply.send({ projects })
    } catch (error) {
      throw error
    }
  })

  // POST /projects - Create new project
  app.post('/projects', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const data = createProjectSchema.parse(request.body)

      const project = await prisma.project.create({
        data: {
          ...data,
          start_date: new Date(data.start_date),
          end_date: new Date(data.end_date),
          created_by: userId
        },
        include: {
          phases: true
        }
      })

      return reply.code(201).send({ project })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // GET /projects/:id - Get project details
  app.get('/projects/:id', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params
      const userId = (request.user as any).userId

      const project = await prisma.project.findFirst({
        where: {
          id,
          created_by: userId
        },
        include: {
          phases: {
            orderBy: { order: 'asc' },
            include: {
              assignments: {
                include: {
                  user: {
                    select: {
                      id: true,
                      name: true,
                      email: true
                    }
                  }
                }
              },
              quotes: {
                include: {
                  vendor: true
                }
              },
              _count: {
                select: {
                  communications: true
                }
              }
            }
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' })
      }

      return reply.send({ project })
    } catch (error) {
      throw error
    }
  })

  // PATCH /projects/:id - Update project
  app.patch('/projects/:id', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params
      const userId = (request.user as any).userId
      const data = updateProjectSchema.parse(request.body)

      // Verify ownership
      const existing = await prisma.project.findFirst({
        where: { id, created_by: userId }
      })

      if (!existing) {
        return reply.code(404).send({ error: 'Project not found' })
      }

      const project = await prisma.project.update({
        where: { id },
        data: {
          ...data,
          ...(data.start_date && { start_date: new Date(data.start_date) }),
          ...(data.end_date && { end_date: new Date(data.end_date) })
        },
        include: {
          phases: {
            orderBy: { order: 'asc' }
          }
        }
      })

      return reply.send({ project })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // DELETE /projects/:id - Delete project
  app.delete('/projects/:id', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params
      const userId = (request.user as any).userId

      // Verify ownership
      const existing = await prisma.project.findFirst({
        where: { id, created_by: userId }
      })

      if (!existing) {
        return reply.code(404).send({ error: 'Project not found' })
      }

      await prisma.project.delete({
        where: { id }
      })

      return reply.code(204).send()
    } catch (error) {
      throw error
    }
  })
}
