/**
 * tRPC Metrics Middleware
 *
 * Automatically tracks all tRPC procedure calls with metrics:
 * - Request count
 * - Request latency
 * - Error rate
 */

import { TRPCError } from '@trpc/server'
import { MetricsCollector } from '@/lib/monitoring/metrics'

/**
 * Metrics middleware for tRPC
 * Wraps procedure execution to track performance
 */
export const metricsMiddleware = async (opts: any) => {
  const start = Date.now()
  const { path, type } = opts

  try {
    // Execute the procedure
    const result = await opts.next()
    const duration = Date.now() - start

    // Record successful request
    MetricsCollector.recordRequest(path, type, 'success', duration)

    return result
  } catch (error) {
    const duration = Date.now() - start

    // Record failed request
    MetricsCollector.recordRequest(path, type, 'error', duration)
    MetricsCollector.recordError(path, error)

    // Re-throw error to maintain normal error handling
    throw error
  }
}
