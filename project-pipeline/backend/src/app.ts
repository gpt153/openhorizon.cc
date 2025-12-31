import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import { env } from './config/env.js'
import { authenticate, requireRole } from './auth/middleware.js'
import { registerAuthRoutes } from './auth/auth.routes.js'
import { registerProjectRoutes } from './projects/projects.routes.js'
import { registerPhaseRoutes } from './phases/phases.routes.js'
import { registerOpenProjectRoutes } from './integrations/openproject.routes.js'
import { registerCommunicationsRoutes } from './communications/communications.routes.js'
import { registerVendorRoutes } from './communications/vendors.routes.js'

const app = Fastify({
  logger: {
    level: env.NODE_ENV === 'production' ? 'info' : 'debug'
  }
})

// Register plugins
await app.register(cors, {
  origin: env.NODE_ENV === 'production' ? false : '*'
})

await app.register(jwt, {
  secret: env.JWT_SECRET
})

// Decorate app with auth middleware
app.decorate('authenticate', authenticate)
app.decorate('requireRole', requireRole)

// Health check endpoint
app.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV
  }
})

// Root endpoint
app.get('/', async () => {
  return {
    name: 'Project Pipeline API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: ['/auth/register', '/auth/login', '/auth/me'],
      projects: ['/projects', '/projects/:id'],
      phases: ['/projects/:projectId/phases', '/phases/:id'],
      integrations: ['/integrations/openproject/test', '/projects/:id/sync/openproject'],
      communications: ['/communications/quote-request', '/communications/compose', '/communications/improve-draft'],
      vendors: ['/vendors', '/vendors/:id']
    }
  }
})

// Register routes
await registerAuthRoutes(app)
await registerProjectRoutes(app)
await registerPhaseRoutes(app)
await registerOpenProjectRoutes(app)
await registerCommunicationsRoutes(app)
await registerVendorRoutes(app)

// Error handler
app.setErrorHandler((error, request, reply) => {
  app.log.error(error)

  if (error.validation) {
    return reply.code(400).send({
      error: 'Validation error',
      details: error.validation
    })
  }

  return reply.code(500).send({
    error: 'Internal server error',
    message: env.NODE_ENV === 'development' ? error.message : undefined
  })
})

// Start server
const start = async () => {
  try {
    await app.listen({
      port: env.PORT,
      host: '0.0.0.0'
    })

    // Setup WebSocket on the HTTP server
    const { setupWebSocket } = await import('./websocket.js')
    setupWebSocket(app.server)

    console.log(`🚀 Server running on http://localhost:${env.PORT}`)
    console.log(`📚 Health check: http://localhost:${env.PORT}/health`)
    console.log(`🔌 WebSocket ready on ws://localhost:${env.PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()

export { app }
