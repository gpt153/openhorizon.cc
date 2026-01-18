import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * Health Check Endpoint
 *
 * Verifies that the application and database are operational.
 * Used by smoke tests to validate deployment health.
 *
 * This endpoint:
 * - Performs a lightweight database query (SELECT 1)
 * - Returns 200 OK when healthy
 * - Returns 503 Service Unavailable when database is down
 * - Does not require authentication (public endpoint)
 *
 * Part of Epic 003: Production Readiness
 * Related: Issue #132 - Production Smoke Tests
 */

// Force this route to be dynamic (never cached)
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // Perform lightweight database health check
    // This query doesn't access any tables, just verifies DB connection
    await prisma.$queryRaw`SELECT 1`

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    // Log error for monitoring/debugging
    console.error('[Health Check] Database connection failed:', error)

    return NextResponse.json(
      {
        status: 'error',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 } // Service Unavailable
    )
  }
}
