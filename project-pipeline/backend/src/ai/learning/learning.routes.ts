import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../config/database.js'
import { getLearningService } from './learning.service.js'
import { getVectorStore } from './vector-store.js'

// Validation schemas
const learnFromProjectSchema = z.object({
  projectId: z.string()
})

const getRecommendationsSchema = z.object({
  phaseType: z.string(),
  projectType: z.string(),
  location: z.string(),
  budget: z.number().optional(),
  participants: z.number().optional()
})

const reinforcePatternSchema = z.object({
  phaseType: z.string(),
  projectType: z.string(),
  location: z.string(),
  patternType: z.enum(['vendor_preference', 'budget_allocation', 'timeline_adjustment', 'phase_dependency', 'location_insight', 'custom']),
  metadata: z.record(z.unknown())
})

export async function registerLearningRoutes(app: FastifyInstance) {
  const learningService = getLearningService()
  const vectorStore = getVectorStore()

  // POST /learning/init - Initialize vector database schema
  app.post('/learning/init', {
    onRequest: [app.authenticate, app.requireRole(['ADMIN'])]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await vectorStore.initSchema()
      return reply.send({ success: true, message: 'Vector store initialized' })
    } catch (error: any) {
      return reply.code(500).send({ error: 'Failed to initialize vector store', details: error.message })
    }
  })

  // GET /learning/test - Test vector store connection
  app.get('/learning/test', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const connected = await vectorStore.testConnection()
      return reply.send({ connected })
    } catch (error: any) {
      return reply.code(500).send({ error: 'Connection test failed', details: error.message })
    }
  })

  // POST /learning/learn - Learn patterns from a project
  app.post('/learning/learn', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const data = learnFromProjectSchema.parse(request.body)

      // Verify project ownership
      const project = await prisma.project.findFirst({
        where: { id: data.projectId, created_by: userId }
      })

      if (!project) {
        return reply.code(404).send({ error: 'Project not found' })
      }

      const patterns = await learningService.learnFromProject(data.projectId)

      return reply.send({
        success: true,
        patternsLearned: patterns.length,
        patterns: patterns.map(p => ({
          type: p.type,
          phaseType: p.phaseType,
          description: p.description,
          confidence: p.confidence
        }))
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // POST /learning/recommendations - Get AI recommendations for a phase
  app.post('/learning/recommendations', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = getRecommendationsSchema.parse(request.body)

      const recommendations = await learningService.getRecommendations(data)

      return reply.send(recommendations)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // POST /learning/reinforce - Reinforce a pattern based on new observation
  app.post('/learning/reinforce', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = reinforcePatternSchema.parse(request.body)

      await learningService.reinforcePattern(data)

      return reply.send({ success: true, message: 'Pattern reinforced' })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // GET /learning/stats - Get learning statistics
  app.get('/learning/stats', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const stats = await learningService.getPatternStats()
      return reply.send(stats)
    } catch (error) {
      throw error
    }
  })

  // GET /learning/patterns - List all learned patterns
  app.get('/learning/patterns', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{
    Querystring: { phaseType?: string, type?: string, limit?: number }
  }>, reply: FastifyReply) => {
    try {
      const { phaseType, type, limit } = request.query

      const patterns = await prisma.learningPattern.findMany({
        where: {
          ...(phaseType && { phase_type: phaseType }),
          ...(type && { type })
        },
        orderBy: [
          { confidence: 'desc' },
          { created_at: 'desc' }
        ],
        take: limit || 20
      })

      return reply.send({ patterns })
    } catch (error) {
      throw error
    }
  })

  // GET /learning/patterns/:id - Get pattern details
  app.get('/learning/patterns/:id', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params

      const pattern = await prisma.learningPattern.findUnique({
        where: { id },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              type: true,
              location: true
            }
          }
        }
      })

      if (!pattern) {
        return reply.code(404).send({ error: 'Pattern not found' })
      }

      return reply.send({ pattern })
    } catch (error) {
      throw error
    }
  })

  // DELETE /learning/patterns/:id - Delete a pattern
  app.delete('/learning/patterns/:id', {
    onRequest: [app.authenticate, app.requireRole(['ADMIN'])]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params

      const pattern = await prisma.learningPattern.findUnique({
        where: { id }
      })

      if (!pattern) {
        return reply.code(404).send({ error: 'Pattern not found' })
      }

      // Delete from both PostgreSQL and vector store
      await Promise.all([
        prisma.learningPattern.delete({ where: { id } }),
        vectorStore.deletePattern(id).catch(err => {
          console.warn('Failed to delete from vector store:', err)
        })
      ])

      return reply.code(204).send()
    } catch (error) {
      throw error
    }
  })

  // POST /phases/:phaseId/auto-populate - Auto-populate phase based on learned patterns
  app.post('/phases/:phaseId/auto-populate', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { phaseId: string } }>, reply: FastifyReply) => {
    try {
      const { phaseId } = request.params
      const userId = (request.user as any).userId

      // Get phase and project
      const phase = await prisma.phase.findFirst({
        where: {
          id: phaseId,
          project: {
            created_by: userId
          }
        },
        include: { project: true }
      })

      if (!phase) {
        return reply.code(404).send({ error: 'Phase not found' })
      }

      // Get recommendations
      const recommendations = await learningService.getRecommendations({
        phaseType: phase.type,
        projectType: phase.project.type,
        location: phase.project.location,
        budget: Number(phase.budget_allocated),
        participants: phase.project.participants_count
      })

      // Auto-populate budget if recommendation available
      let updates: any = {}

      if (recommendations.budgetAllocation && Number(phase.budget_allocated) === 0) {
        updates.budget_allocated = recommendations.budgetAllocation.suggested
      }

      // Auto-populate timeline if recommendation available
      if (recommendations.timeline) {
        const projectStart = new Date(phase.project.start_date)
        const suggestedStart = new Date(projectStart)
        suggestedStart.setDate(suggestedStart.getDate() - recommendations.timeline.startDaysBeforeProject)

        const suggestedEnd = new Date(suggestedStart)
        suggestedEnd.setDate(suggestedEnd.getDate() + recommendations.timeline.durationDays)

        updates.start_date = suggestedStart
        updates.end_date = suggestedEnd
      }

      // Update phase if we have suggestions
      let updatedPhase = phase
      if (Object.keys(updates).length > 0) {
        updatedPhase = await prisma.phase.update({
          where: { id: phaseId },
          data: {
            ...updates,
            metadata: {
              ...(phase.metadata as any || {}),
              auto_populated: true,
              auto_population_date: new Date().toISOString(),
              recommendations
            }
          }
        })
      }

      return reply.send({
        success: true,
        applied: Object.keys(updates).length > 0,
        updates,
        recommendations,
        phase: updatedPhase
      })
    } catch (error) {
      throw error
    }
  })
}
