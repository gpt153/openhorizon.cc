/**
 * Fastify Metrics Collection Library
 *
 * Provides OpenTelemetry-based metrics collection for Cloud Monitoring (Backend API).
 */

import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { MetricExporter } from '@google-cloud/opentelemetry-cloud-monitoring-exporter'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

/**
 * Fastify Metrics Collector Singleton
 */
class FastifyMetricsCollectorClass {
  private meterProvider: MeterProvider | null = null
  private meter: any = null
  private isEnabled: boolean = false

  // Metric instruments
  private requestCounter: any = null
  private errorCounter: any = null
  private latencyHistogram: any = null

  constructor() {
    this.initialize()
  }

  private initialize() {
    const enableMetrics = process.env.ENABLE_METRICS === 'true' || process.env.NODE_ENV === 'production'
    const projectId = process.env.GOOGLE_CLOUD_PROJECT

    if (!enableMetrics) {
      console.log('[FastifyMetrics] Disabled (ENABLE_METRICS=false or not production)')
      return
    }

    if (!projectId) {
      console.warn('[FastifyMetrics] GOOGLE_CLOUD_PROJECT not set, metrics disabled')
      return
    }

    try {
      const resource = new Resource({
        [ATTR_SERVICE_NAME]: 'project-pipeline-backend',
        [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
      })

      const exporter = new MetricExporter({ projectId })
      const metricReader = new PeriodicExportingMetricReader({
        exporter,
        exportIntervalMillis: 60_000,
      })

      this.meterProvider = new MeterProvider({
        resource,
        readers: [metricReader],
      })

      this.meter = this.meterProvider.getMeter('fastify-backend-metrics')

      // Create metric instruments
      this.requestCounter = this.meter.createCounter('custom.googleapis.com/backend/request_count', {
        description: 'Total number of backend HTTP requests',
        unit: '1',
      })

      this.errorCounter = this.meter.createCounter('custom.googleapis.com/backend/error_count', {
        description: 'Total number of backend HTTP errors',
        unit: '1',
      })

      this.latencyHistogram = this.meter.createHistogram('custom.googleapis.com/backend/response_time', {
        description: 'Backend request latency in milliseconds',
        unit: 'ms',
      })

      this.isEnabled = true
      console.log('[FastifyMetrics] Initialized successfully for project:', projectId)
    } catch (error) {
      console.error('[FastifyMetrics] Failed to initialize:', error)
      this.isEnabled = false
    }
  }

  /**
   * Record an HTTP request with metrics
   */
  recordRequest(method: string, route: string, statusCode: number, durationMs: number) {
    if (!this.isEnabled) return

    try {
      const status = statusCode >= 500 ? 'error' : 'success'
      const attributes = {
        method,
        route,
        status_code: statusCode.toString(),
        status,
      }

      this.requestCounter.add(1, attributes)
      this.latencyHistogram.record(durationMs, attributes)

      if (statusCode >= 500) {
        this.errorCounter.add(1, attributes)
      }
    } catch (error) {
      console.error('[FastifyMetrics] Error recording request:', error)
    }
  }

  /**
   * Record an error event
   */
  recordError(route: string, error: any) {
    if (!this.isEnabled) return

    try {
      const attributes = {
        route,
        error_type: error?.constructor?.name || 'UnknownError',
        error_code: error?.code || 'UNKNOWN',
      }

      this.errorCounter.add(1, attributes)
      console.error(`[FastifyMetrics] Error on ${route}:`, error?.message || error)
    } catch (err) {
      console.error('[FastifyMetrics] Error recording error:', err)
    }
  }

  /**
   * Shutdown metrics provider
   */
  async shutdown() {
    if (this.meterProvider && this.isEnabled) {
      try {
        await this.meterProvider.shutdown()
        console.log('[FastifyMetrics] Shutdown complete')
      } catch (error) {
        console.error('[FastifyMetrics] Error during shutdown:', error)
      }
    }
  }

  get enabled(): boolean {
    return this.isEnabled
  }
}

// Export singleton instance
export const FastifyMetricsCollector = new FastifyMetricsCollectorClass()

// Shutdown on process exit
process.on('SIGTERM', async () => {
  await FastifyMetricsCollector.shutdown()
})

process.on('SIGINT', async () => {
  await FastifyMetricsCollector.shutdown()
})
