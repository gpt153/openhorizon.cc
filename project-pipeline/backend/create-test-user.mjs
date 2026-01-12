import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const password_hash = await bcrypt.hash('password123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      id: 'test-user-production',
      email: 'test@example.com',
      password_hash,
      name: 'Test User',
      role: 'COORDINATOR'
    }
  })
  
  console.log('✅ Test user created:', user.email, '- Role:', user.role)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
