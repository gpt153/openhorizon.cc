/**
 * Core Metrics Collection Library
 *
 * Provides OpenTelemetry-based metrics collection for Cloud Monitoring.
 * Tracks system performance metrics (request count, latency, errors).
 */

import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { MetricExporter } from '@google-cloud/opentelemetry-cloud-monitoring-exporter'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions'

/**
 * Metrics Collector Singleton
 * Initializes OpenTelemetry and provides methods for recording custom metrics
 */
class MetricsCollectorClass {
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
    // Only enable metrics in production or when explicitly enabled
    const enableMetrics = process.env.ENABLE_METRICS === 'true' || process.env.NODE_ENV === 'production'
    const projectId = process.env.GOOGLE_CLOUD_PROJECT

    if (!enableMetrics) {
      console.log('[Metrics] Disabled (ENABLE_METRICS=false or not production)')
      return
    }

    if (!projectId) {
      console.warn('[Metrics] GOOGLE_CLOUD_PROJECT not set, metrics disabled')
      return
    }

    try {
      // Create resource with service metadata
      const resource = new Resource({
        [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'openhorizon-app',
        [ATTR_SERVICE_VERSION]: process.env.npm_package_version || '1.0.0',
      })

      // Create Cloud Monitoring exporter
      const exporter = new MetricExporter({
        projectId,
      })

      // Create metric reader with 60-second export interval
      const metricReader = new PeriodicExportingMetricReader({
        exporter,
        exportIntervalMillis: 60_000, // Export every 60 seconds
      })

      // Create meter provider
      this.meterProvider = new MeterProvider({
        resource,
        readers: [metricReader],
      })

      // Get meter instance
      this.meter = this.meterProvider.getMeter('openhorizon-metrics')

      // Create metric instruments
      this.requestCounter = this.meter.createCounter('custom.googleapis.com/http/request_count', {
        description: 'Total number of HTTP requests',
        unit: '1',
      })

      this.errorCounter = this.meter.createCounter('custom.googleapis.com/http/error_count', {
        description: 'Total number of HTTP errors',
        unit: '1',
      })

      this.latencyHistogram = this.meter.createHistogram('custom.googleapis.com/http/response_time', {
        description: 'HTTP request latency in milliseconds',
        unit: 'ms',
      })

      this.isEnabled = true
      console.log('[Metrics] Initialized successfully for project:', projectId)
    } catch (error) {
      console.error('[Metrics] Failed to initialize:', error)
      this.isEnabled = false
    }
  }

  /**
   * Record an HTTP request with metrics
   * @param path Request path (e.g., 'projects.create')
   * @param method Request method (e.g., 'mutation', 'query')
   * @param status Response status ('success' or 'error')
   * @param durationMs Request duration in milliseconds
   */
  recordRequest(path: string, method: string, status: 'success' | 'error', durationMs: number) {
    if (!this.isEnabled) return

    try {
      const attributes = {
        path,
        method,
        status,
      }

      // Increment request counter
      this.requestCounter.add(1, attributes)

      // Record latency
      this.latencyHistogram.record(durationMs, attributes)

      // Increment error counter if failed
      if (status === 'error') {
        this.errorCounter.add(1, attributes)
      }
    } catch (error) {
      console.error('[Metrics] Error recording request:', error)
    }
  }

  /**
   * Record an error event
   * @param path Request path where error occurred
   * @param error Error object
   */
  recordError(path: string, error: any) {
    if (!this.isEnabled) return

    try {
      const attributes = {
        path,
        error_type: error?.constructor?.name || 'UnknownError',
        error_code: error?.code || 'UNKNOWN',
      }

      this.errorCounter.add(1, attributes)

      // Log error for debugging
      console.error(`[Metrics] Error on ${path}:`, error?.message || error)
    } catch (err) {
      console.error('[Metrics] Error recording error:', err)
    }
  }

  /**
   * Shutdown metrics provider (called on app shutdown)
   */
  async shutdown() {
    if (this.meterProvider && this.isEnabled) {
      try {
        await this.meterProvider.shutdown()
        console.log('[Metrics] Shutdown complete')
      } catch (error) {
        console.error('[Metrics] Error during shutdown:', error)
      }
    }
  }

  /**
   * Check if metrics collection is enabled
   */
  get enabled(): boolean {
    return this.isEnabled
  }
}

// Export singleton instance
export const MetricsCollector = new MetricsCollectorClass()

// Shutdown on process exit
process.on('SIGTERM', async () => {
  await MetricsCollector.shutdown()
})

process.on('SIGINT', async () => {
  await MetricsCollector.shutdown()
})
