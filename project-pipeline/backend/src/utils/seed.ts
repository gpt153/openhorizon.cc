import { prisma } from '../config/database.js'
import bcrypt from 'bcryptjs'

async function main() {
  console.log('🌱 Seeding database...')

  // Create a test user
  const hashedPassword = await bcrypt.hash('password123', 10)

  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
      password_hash: hashedPassword,
      name: 'Test User',
      role: 'COORDINATOR'
    }
  })

  console.log('✅ Created user:', user.email)

  // Create a sample project
  const project = await prisma.project.create({
    data: {
      name: 'Summer Exchange Barcelona 2025',
      type: 'STUDENT_EXCHANGE',
      status: 'PLANNING',
      description: 'Student exchange program in Barcelona for summer 2025',
      start_date: new Date('2025-06-01'),
      end_date: new Date('2025-06-30'),
      budget_total: 50000,
      participants_count: 50,
      location: 'Barcelona, Spain',
      created_by: user.id
    }
  })

  console.log('✅ Created project:', project.name)

  // Create sample phases
  const phases = [
    {
      name: 'Accommodation',
      type: 'ACCOMMODATION' as const,
      order: 1,
      budget_allocated: 15000,
      start_date: new Date('2025-06-01'),
      end_date: new Date('2025-06-30')
    },
    {
      name: 'Travel Arrangements',
      type: 'TRAVEL' as const,
      order: 2,
      budget_allocated: 12000,
      start_date: new Date('2025-05-01'),
      end_date: new Date('2025-06-01')
    },
    {
      name: 'Food & Catering',
      type: 'FOOD' as const,
      order: 3,
      budget_allocated: 8000,
      start_date: new Date('2025-06-01'),
      end_date: new Date('2025-06-30')
    },
    {
      name: 'Activities & Excursions',
      type: 'ACTIVITIES' as const,
      order: 4,
      budget_allocated: 6000,
      start_date: new Date('2025-06-01'),
      end_date: new Date('2025-06-30')
    },
    {
      name: 'Insurance',
      type: 'INSURANCE' as const,
      order: 5,
      budget_allocated: 2000,
      start_date: new Date('2025-05-01'),
      end_date: new Date('2025-05-15')
    }
  ]

  for (const phaseData of phases) {
    const phase = await prisma.phase.create({
      data: {
        ...phaseData,
        project_id: project.id,
        status: 'NOT_STARTED',
        dependencies: [],
        checklist: {
          items: [
            { text: 'Research options', completed: false },
            { text: 'Get quotes', completed: false },
            { text: 'Make booking', completed: false }
          ]
        }
      }
    })
    console.log('✅ Created phase:', phase.name)
  }

  // Create sample vendors
  const vendors = [
    {
      name: 'Hotel Mediterranean',
      type: 'HOTEL' as const,
      email: 'info@hotelmed.com',
      location: 'Barcelona',
      rating: 4.5
    },
    {
      name: 'Barcelona Hostel Central',
      type: 'HOSTEL' as const,
      email: 'booking@barcelonahostel.com',
      location: 'Barcelona',
      rating: 4.2
    },
    {
      name: 'Catalan Catering Services',
      type: 'RESTAURANT' as const,
      email: 'contact@catalancatering.com',
      location: 'Barcelona',
      rating: 4.7
    }
  ]

  for (const vendorData of vendors) {
    const vendor = await prisma.vendor.create({ data: vendorData })
    console.log('✅ Created vendor:', vendor.name)
  }

  console.log('🎉 Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
