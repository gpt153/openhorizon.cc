import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { openProjectClient } from './openproject.client.js'
import { openProjectSync } from './openproject.sync.js'

export async function registerOpenProjectRoutes(app: FastifyInstance) {
  // Test OpenProject connection
  app.get('/integrations/openproject/test', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const isConnected = await openProjectClient.testConnection()

    return reply.send({
      configured: openProjectClient.isConfigured(),
      connected: isConnected
    })
  })

  // Sync project to OpenProject
  app.post('/projects/:id/sync/openproject', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params

    if (!openProjectClient.isConfigured()) {
      return reply.code(503).send({
        error: 'OpenProject not configured',
        message: 'Please configure OPENPROJECT_URL and OPENPROJECT_API_KEY'
      })
    }

    const result = await openProjectSync.syncProjectToOpenProject(id)

    if (!result.success) {
      return reply.code(500).send({
        error: 'Sync failed',
        message: result.error
      })
    }

    return reply.send({
      success: true,
      ...result
    })
  })

  // Sync budget
  app.post('/projects/:id/sync/openproject/budget', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params

    const success = await openProjectSync.syncBudgetToOpenProject(id)

    if (!success) {
      return reply.code(500).send({
        error: 'Budget sync failed'
      })
    }

    return reply.send({
      success: true,
      message: 'Budget synced successfully'
    })
  })

  // Sync phase to work package
  app.post('/phases/:id/sync/openproject', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params

    const success = await openProjectSync.syncPhaseToWorkPackage(id)

    if (!success) {
      return reply.code(500).send({
        error: 'Phase sync failed'
      })
    }

    return reply.send({
      success: true,
      message: 'Phase synced successfully'
    })
  })
}
