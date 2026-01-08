import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient({
    // Disable prepared statements for Supabase connection pooler compatibility
    // See: https://www.prisma.io/docs/guides/performance-and-optimization/connection-management#pgbouncer
    datasourceUrl: process.env.DATABASE_URL + '?pgbouncer=true',
  })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
