import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),

  // Database
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),

  // OpenProject
  OPENPROJECT_URL: z.string().url().optional(),
  OPENPROJECT_API_KEY: z.string().optional(),

  // AI Services
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().optional(),

  // Email
  SENDGRID_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),
  FROM_NAME: z.string().optional(),

  // Weaviate
  WEAVIATE_HOST: z.string().default('localhost:8080'),
  WEAVIATE_SCHEME: z.enum(['http', 'https']).default('http'),

  // Security
  JWT_SECRET: z.string().min(32),

  // Monitoring
  SENTRY_DSN: z.string().url().optional()
})

export type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Invalid environment variables:')
      error.errors.forEach((err) => {
        console.error(`  ${err.path.join('.')}: ${err.message}`)
      })
    }
    process.exit(1)
  }
}

export const env = validateEnv()
