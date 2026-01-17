/**
 * Fastify Metrics Middleware
 *
 * Automatically tracks all Fastify HTTP requests with metrics.
 */

import type { FastifyRequest, FastifyReply, FastifyPluginAsync } from 'fastify'
import fp from 'fastify-plugin'
import { FastifyMetricsCollector } from '../lib/monitoring.js'

/**
 * Fastify plugin for metrics collection
 */
const metricsPlugin: FastifyPluginAsync = async (fastify) => {
  // Hook: Track request start time
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    request.requestStartTime = Date.now()
  })

  // Hook: Record metrics on response
  fastify.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const duration = Date.now() - (request.requestStartTime || Date.now())
    const route = request.routeOptions?.url || request.url
    const method = request.method
    const statusCode = reply.statusCode

    FastifyMetricsCollector.recordRequest(method, route, statusCode, duration)
  })

  // Hook: Record errors
  fastify.addHook('onError', async (request: FastifyRequest, reply: FastifyReply, error: Error) => {
    const route = request.routeOptions?.url || request.url
    FastifyMetricsCollector.recordError(route, error)
  })

  fastify.log.info('[Metrics] Fastify metrics plugin registered')
}

// Extend FastifyRequest to include requestStartTime
declare module 'fastify' {
  interface FastifyRequest {
    requestStartTime?: number
  }
}

export default fp(metricsPlugin, {
  name: 'metrics',
  fastify: '5.x',
})
