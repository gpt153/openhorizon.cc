import { PrismaClient } from '@prisma/client'

// Singleton Prisma client
let prisma: PrismaClient

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined
}

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn']
    })
  }
  prisma = global.__prisma
}

export { prisma }

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})
