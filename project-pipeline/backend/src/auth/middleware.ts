import { FastifyRequest, FastifyReply } from 'fastify'

// Extend FastifyRequest to include user
declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      userId: string
      role: string
    }
  }

  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    requireRole: (roles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

// Authentication middleware
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' })
  }
}

// Role-based authorization middleware factory
export function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify()

      const user = request.user as any
      if (!user || !roles.includes(user.role)) {
        return reply.code(403).send({ error: 'Forbidden: Insufficient permissions' })
      }
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  }
}
