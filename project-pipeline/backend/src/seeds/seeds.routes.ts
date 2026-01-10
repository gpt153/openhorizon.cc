import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import {
  BrainstormInputSchema,
  SeedElaborationInputSchema,
} from './seeds.schemas.js'
import {
  generateAndSaveSeeds,
  listUserSeeds,
  getSeedById,
  elaborateSeedConversation,
  saveSeed,
  dismissSeed,
  deleteSeed,
} from './seeds.service.js'

export async function registerSeedsRoutes(app: FastifyInstance) {
  // POST /seeds/generate - Generate new seeds
  app.post('/seeds/generate', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const input = BrainstormInputSchema.parse(request.body)

      const seeds = await generateAndSaveSeeds(userId, input)

      return reply.code(201).send({ seeds })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
      }
      throw error
    }
  })

  // GET /seeds - List all seeds for user
  app.get('/seeds', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const query = request.query as any

      const options = {
        savedOnly: query.saved === 'true',
        excludeDismissed: query.excludeDismissed !== 'false', // Default true
      }

      const seeds = await listUserSeeds(userId, options)

      return reply.send({ seeds })
    } catch (error) {
      throw error
    }
  })

  // GET /seeds/:id - Get single seed by ID
  app.get('/seeds/:id', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const { id } = request.params as { id: string }

      const seed = await getSeedById(id, userId)

      return reply.send({ seed })
    } catch (error) {
      if (error instanceof Error && error.message === 'Seed not found') {
        return reply.code(404).send({ error: error.message })
      }
      throw error
    }
  })

  // POST /seeds/:id/elaborate - Elaborate seed with conversation
  app.post('/seeds/:id/elaborate', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const { id } = request.params as { id: string }
      const { userMessage } = SeedElaborationInputSchema.parse({
        seedId: id,
        ...(request.body as any)
      })

      const response = await elaborateSeedConversation(id, userId, userMessage)

      return reply.send(response)
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({
          error: 'Validation error',
          details: error.errors
        })
      }
      if (error instanceof Error && error.message === 'Seed not found') {
        return reply.code(404).send({ error: error.message })
      }
      throw error
    }
  })

  // PATCH /seeds/:id/save - Save a seed
  app.patch('/seeds/:id/save', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const { id } = request.params as { id: string }

      const result = await saveSeed(id, userId)

      return reply.send(result)
    } catch (error) {
      if (error instanceof Error && error.message === 'Seed not found or unauthorized') {
        return reply.code(404).send({ error: error.message })
      }
      throw error
    }
  })

  // PATCH /seeds/:id/dismiss - Dismiss a seed
  app.patch('/seeds/:id/dismiss', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const { id } = request.params as { id: string }

      const result = await dismissSeed(id, userId)

      return reply.send(result)
    } catch (error) {
      if (error instanceof Error && error.message === 'Seed not found or unauthorized') {
        return reply.code(404).send({ error: error.message })
      }
      throw error
    }
  })

  // DELETE /seeds/:id - Delete a seed
  app.delete('/seeds/:id', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId
      const { id } = request.params as { id: string }

      const result = await deleteSeed(id, userId)

      return reply.code(204).send()
    } catch (error) {
      if (error instanceof Error && error.message === 'Seed not found or unauthorized') {
        return reply.code(404).send({ error: error.message })
      }
      throw error
    }
  })
}
