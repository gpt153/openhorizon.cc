/**
 * Vitest Test Setup
 *
 * This file runs before all tests to set up the testing environment.
 */

import { beforeAll, afterAll, vi } from 'vitest'
import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

// Mock external services to avoid real API calls during testing
beforeAll(() => {
  // Mock Anthropic/Claude API
  vi.mock('@langchain/anthropic', () => ({
    ChatAnthropic: vi.fn().mockImplementation(() => ({
      invoke: vi.fn().mockResolvedValue({
        content: 'Mocked AI response'
      })
    }))
  }))

  // Mock OpenAI API
  vi.mock('@langchain/openai', () => ({
    OpenAIEmbeddings: vi.fn().mockImplementation(() => ({
      embedQuery: vi.fn().mockResolvedValue([0.1, 0.2, 0.3, /* ...768 dims */])
    }))
  }))

  // Mock SendGrid
  vi.mock('@sendgrid/mail', () => ({
    setApiKey: vi.fn(),
    send: vi.fn().mockResolvedValue([{
      statusCode: 202,
      body: '',
      headers: {}
    }])
  }))

  // Mock Playwright for web scraping
  vi.mock('playwright', () => ({
    chromium: {
      launch: vi.fn().mockResolvedValue({
        newPage: vi.fn().mockResolvedValue({
          goto: vi.fn(),
          evaluate: vi.fn().mockResolvedValue([]),
          close: vi.fn()
        }),
        close: vi.fn()
      })
    }
  }))

  // Mock Weaviate client
  vi.mock('weaviate-ts-client', () => ({
    default: {
      client: vi.fn().mockReturnValue({
        schema: {
          classCreator: vi.fn().mockReturnValue({
            withClass: vi.fn().mockReturnThis(),
            do: vi.fn().mockResolvedValue({})
          })
        },
        data: {
          creator: vi.fn().mockReturnValue({
            withClassName: vi.fn().mockReturnThis(),
            withProperties: vi.fn().mockReturnThis(),
            withVector: vi.fn().mockReturnThis(),
            do: vi.fn().mockResolvedValue({ id: 'mock-id' })
          }),
          getterById: vi.fn().mockReturnValue({
            withId: vi.fn().mockReturnThis(),
            withClassName: vi.fn().mockReturnThis(),
            do: vi.fn().mockResolvedValue({})
          })
        },
        graphql: {
          get: vi.fn().mockReturnValue({
            withClassName: vi.fn().mockReturnThis(),
            withFields: vi.fn().mockReturnThis(),
            withNearVector: vi.fn().mockReturnThis(),
            withLimit: vi.fn().mockReturnThis(),
            do: vi.fn().mockResolvedValue({
              data: {
                Get: {
                  LearningPattern: []
                }
              }
            })
          })
        }
      })
    }
  }))

  console.log('✅ Test environment initialized')
})

afterAll(() => {
  console.log('✅ Test cleanup complete')
})

// Helper function to create mock Prisma client
export function createMockPrismaClient() {
  return {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    project: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    phase: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    vendor: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    quote: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    communication: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    },
    $disconnect: vi.fn()
  }
}

// Helper function to create mock Fastify instance
export function createMockFastifyInstance() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
    listen: vi.fn(),
    close: vi.fn(),
    log: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    },
    jwt: {
      sign: vi.fn().mockReturnValue('mock-jwt-token'),
      verify: vi.fn().mockReturnValue({ userId: 'mock-user-id' })
    }
  }
}

// Test data factories
export const testData = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    password: '$2a$10$mockhashedpassword',
    name: 'Test User',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  project: {
    id: 'test-project-id',
    name: 'Barcelona Exchange 2025',
    type: 'STUDENT_EXCHANGE',
    description: 'Test project description',
    location: 'Barcelona, Spain',
    startDate: new Date('2025-03-01'),
    endDate: new Date('2025-03-15'),
    participants: 30,
    budget: 50000,
    status: 'PLANNING',
    createdById: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  phase: {
    id: 'test-phase-id',
    projectId: 'test-project-id',
    name: 'Accommodation',
    type: 'ACCOMMODATION',
    description: 'Hotel booking for participants',
    startDate: new Date('2025-03-01'),
    endDate: new Date('2025-03-15'),
    status: 'NOT_STARTED',
    budget: 15000,
    spent: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  vendor: {
    id: 'test-vendor-id',
    name: 'Hotel Barcelona',
    type: 'ACCOMMODATION',
    email: 'info@hotelbarcelona.com',
    phone: '+34 123 456 789',
    website: 'https://hotelbarcelona.com',
    location: 'Barcelona, Spain',
    rating: 9.2,
    metadata: {},
    createdAt: new Date(),
    updatedAt: new Date()
  },
  quote: {
    id: 'test-quote-id',
    vendorId: 'test-vendor-id',
    phaseId: 'test-phase-id',
    amount: 120,
    currency: 'EUR',
    validUntil: new Date('2025-02-01'),
    status: 'PENDING',
    details: { rooms: 15, nights: 14 },
    receivedVia: 'EMAIL',
    createdAt: new Date(),
    updatedAt: new Date()
  }
}
