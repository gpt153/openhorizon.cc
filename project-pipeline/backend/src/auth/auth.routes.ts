import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../config/database.js'

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2)
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

export async function registerAuthRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post('/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = registerSchema.parse(request.body)

      // Check if user already exists
      const existing = await prisma.user.findUnique({
        where: { email: data.email }
      })

      if (existing) {
        return reply.code(409).send({ error: 'User already exists' })
      }

      // Hash password
      const password_hash = await bcrypt.hash(data.password, 10)

      // Create user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password_hash,
          name: data.name,
          role: 'USER'
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          created_at: true
        }
      })

      // Generate JWT token
      const token = app.jwt.sign({
        userId: user.id,
        role: user.role
      })

      return reply.code(201).send({
        user,
        token
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // POST /auth/login
  app.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = loginSchema.parse(request.body)

      // Find user
      const user = await prisma.user.findUnique({
        where: { email: data.email }
      })

      if (!user) {
        return reply.code(401).send({ error: 'Invalid credentials' })
      }

      // Verify password
      const valid = await bcrypt.compare(data.password, user.password_hash)
      if (!valid) {
        return reply.code(401).send({ error: 'Invalid credentials' })
      }

      // Generate JWT token
      const token = app.jwt.sign({
        userId: user.id,
        role: user.role
      })

      return reply.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        },
        token
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // GET /auth/me - Get current user
  app.get('/auth/me', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = (request.user as any).userId

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          created_at: true
        }
      })

      if (!user) {
        return reply.code(404).send({ error: 'User not found' })
      }

      return reply.send({ user })
    } catch (error) {
      throw error
    }
  })
}
