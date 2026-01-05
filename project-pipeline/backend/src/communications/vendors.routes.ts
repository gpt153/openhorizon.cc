import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { prisma } from '../config/database.js'

// Validation schemas
const createVendorSchema = z.object({
  name: z.string().min(2),
  type: z.enum(['ACCOMMODATION', 'TRAVEL', 'FOOD', 'ACTIVITIES', 'EVENTS', 'INSURANCE', 'OTHER']),
  email: z.string().email(),
  phone: z.string().optional(),
  website: z.string().url().optional(),
  address: z.string().optional(),
  contact_person: z.string().optional(),
  notes: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
})

const updateVendorSchema = createVendorSchema.partial()

export async function registerVendorRoutes(app: FastifyInstance) {
  // GET /vendors - List all vendors
  app.get('/vendors', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{
    Querystring: { type?: string, search?: string }
  }>, reply: FastifyReply) => {
    try {
      const { type, search } = request.query

      const vendors = await prisma.vendor.findMany({
        where: {
          ...(type && { type: type as any }),
          ...(search && {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { contact_person: { contains: search, mode: 'insensitive' } }
            ]
          })
        },
        include: {
          _count: {
            select: {
              quotes: true,
              communications: true
            }
          }
        },
        orderBy: { name: 'asc' }
      })

      return reply.send({ vendors })
    } catch (error) {
      throw error
    }
  })

  // POST /vendors - Create new vendor
  app.post('/vendors', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const data = createVendorSchema.parse(request.body)

      // Check for duplicate email
      const existing = await prisma.vendor.findFirst({
        where: { email: data.email }
      })

      if (existing) {
        return reply.code(400).send({ error: 'Vendor with this email already exists' })
      }

      const vendor = await prisma.vendor.create({
        data
      })

      return reply.code(201).send({ vendor })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // GET /vendors/:id - Get vendor details
  app.get('/vendors/:id', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params

      const vendor = await prisma.vendor.findUnique({
        where: { id },
        include: {
          quotes: {
            include: {
              phase: {
                select: {
                  id: true,
                  name: true,
                  type: true,
                  project: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: { received_at: 'desc' }
          },
          communications: {
            include: {
              phase: {
                select: {
                  id: true,
                  name: true,
                  project: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                }
              }
            },
            orderBy: { created_at: 'desc' }
          }
        }
      })

      if (!vendor) {
        return reply.code(404).send({ error: 'Vendor not found' })
      }

      return reply.send({ vendor })
    } catch (error) {
      throw error
    }
  })

  // PATCH /vendors/:id - Update vendor
  app.patch('/vendors/:id', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params
      const data = updateVendorSchema.parse(request.body)

      // Check if vendor exists
      const existing = await prisma.vendor.findUnique({
        where: { id }
      })

      if (!existing) {
        return reply.code(404).send({ error: 'Vendor not found' })
      }

      // Check for email conflict if email is being updated
      if (data.email && data.email !== existing.email) {
        const emailConflict = await prisma.vendor.findFirst({
          where: {
            email: data.email,
            id: { not: id }
          }
        })

        if (emailConflict) {
          return reply.code(400).send({ error: 'Email already in use by another vendor' })
        }
      }

      const vendor = await prisma.vendor.update({
        where: { id },
        data
      })

      return reply.send({ vendor })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.code(400).send({ error: 'Validation failed', details: error.errors })
      }
      throw error
    }
  })

  // DELETE /vendors/:id - Delete vendor
  app.delete('/vendors/:id', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params

      // Check if vendor exists
      const existing = await prisma.vendor.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              quotes: true,
              communications: true
            }
          }
        }
      })

      if (!existing) {
        return reply.code(404).send({ error: 'Vendor not found' })
      }

      // Warn if vendor has associated data
      if (existing._count.quotes > 0 || existing._count.communications > 0) {
        return reply.code(400).send({
          error: 'Cannot delete vendor with existing quotes or communications',
          details: {
            quotes: existing._count.quotes,
            communications: existing._count.communications
          }
        })
      }

      await prisma.vendor.delete({
        where: { id }
      })

      return reply.code(204).send()
    } catch (error) {
      throw error
    }
  })

  // GET /vendors/:id/quotes - Get all quotes from vendor
  app.get('/vendors/:id/quotes', {
    onRequest: [app.authenticate]
  }, async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    try {
      const { id } = request.params

      const vendor = await prisma.vendor.findUnique({
        where: { id }
      })

      if (!vendor) {
        return reply.code(404).send({ error: 'Vendor not found' })
      }

      const quotes = await prisma.quote.findMany({
        where: { vendor_id: id },
        include: {
          phase: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  location: true
                }
              }
            }
          }
        },
        orderBy: { received_at: 'desc' }
      })

      return reply.send({ quotes })
    } catch (error) {
      throw error
    }
  })
}
