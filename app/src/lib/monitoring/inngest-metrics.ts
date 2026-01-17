/**
 * Inngest Job Metrics Library
 *
 * Tracks background job metrics:
 * - Job starts, successes, failures
 * - Job duration
 * - Job retries
 */

import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { MetricExporter } from '@google-cloud/opentelemetry-cloud-monitoring-exporter'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

/**
 * Inngest Metrics Collector Singleton
 */
class InngestMetricsClass {
  private meterProvider: MeterProvider | null = null
  private meter: any = null
  private isEnabled: boolean = false

  // Inngest metric instruments
  private jobCounter: any = null
  private jobDurationHistogram: any = null
  private jobFailureCounter: any = null
  private jobRetryCounter: any = null

  constructor() {
    this.initialize()
  }

  private initialize() {
    const enableMetrics = process.env.ENABLE_METRICS === 'true' || process.env.NODE_ENV === 'production'
    const projectId = process.env.GOOGLE_CLOUD_PROJECT

    if (!enableMetrics || !projectId) {
      console.log('[InngestMetrics] Disabled')
      return
    }

    try {
      const resource = resourceFromAttributes({
        [ATTR_SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'openhorizon-app',
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

      this.meter = this.meterProvider.getMeter('openhorizon-inngest-metrics')

      // Create Inngest metric instruments
      this.jobCounter = this.meter.createCounter('custom.googleapis.com/inngest/job_count', {
        description: 'Total number of Inngest jobs by status',
        unit: '1',
      })

      this.jobDurationHistogram = this.meter.createHistogram('custom.googleapis.com/inngest/job_duration', {
        description: 'Inngest job duration in milliseconds',
        unit: 'ms',
      })

      this.jobFailureCounter = this.meter.createCounter('custom.googleapis.com/inngest/job_failures', {
        description: 'Total number of failed Inngest jobs',
        unit: '1',
      })

      this.jobRetryCounter = this.meter.createCounter('custom.googleapis.com/inngest/job_retries', {
        description: 'Total number of Inngest job retries',
        unit: '1',
      })

      this.isEnabled = true
      console.log('[InngestMetrics] Initialized successfully')
    } catch (error) {
      console.error('[InngestMetrics] Failed to initialize:', error)
      this.isEnabled = false
    }
  }

  /**
   * Record job start event
   * @param functionId Inngest function ID (e.g., 'project.generate-from-idea')
   */
  recordJobStart(functionId: string) {
    if (!this.isEnabled) return

    try {
      this.jobCounter.add(1, {
        function_id: functionId,
        status: 'started',
      })
      console.log('[InngestMetrics] Job started:', functionId)
    } catch (error) {
      console.error('[InngestMetrics] Error recording job start:', error)
    }
  }

  /**
   * Record job success event
   * @param functionId Inngest function ID
   * @param durationMs Job duration in milliseconds
   */
  recordJobSuccess(functionId: string, durationMs: number) {
    if (!this.isEnabled) return

    try {
      const attributes = { function_id: functionId }

      // Increment success counter
      this.jobCounter.add(1, {
        ...attributes,
        status: 'success',
      })

      // Record duration
      this.jobDurationHistogram.record(durationMs, attributes)

      console.log('[InngestMetrics] Job succeeded:', functionId, `(${durationMs}ms)`)
    } catch (error) {
      console.error('[InngestMetrics] Error recording job success:', error)
    }
  }

  /**
   * Record job failure event
   * @param functionId Inngest function ID
   * @param error Error object
   * @param durationMs Job duration in milliseconds
   */
  recordJobFailure(functionId: string, error: any, durationMs: number) {
    if (!this.isEnabled) return

    try {
      const attributes = {
        function_id: functionId,
        error_type: error?.constructor?.name || 'UnknownError',
      }

      // Increment failure counters
      this.jobCounter.add(1, {
        ...attributes,
        status: 'failed',
      })

      this.jobFailureCounter.add(1, attributes)

      // Record duration (even for failures)
      this.jobDurationHistogram.record(durationMs, { function_id: functionId })

      console.error('[InngestMetrics] Job failed:', functionId, error?.message || error)
    } catch (err) {
      console.error('[InngestMetrics] Error recording job failure:', err)
    }
  }

  /**
   * Record job retry event
   * @param functionId Inngest function ID
   * @param attemptNumber Retry attempt number
   */
  recordJobRetry(functionId: string, attemptNumber: number) {
    if (!this.isEnabled) return

    try {
      this.jobRetryCounter.add(1, {
        function_id: functionId,
        attempt: attemptNumber.toString(),
      })

      console.log('[InngestMetrics] Job retry:', functionId, `attempt ${attemptNumber}`)
    } catch (error) {
      console.error('[InngestMetrics] Error recording job retry:', error)
    }
  }

  /**
   * Shutdown metrics provider
   */
  async shutdown() {
    if (this.meterProvider && this.isEnabled) {
      try {
        await this.meterProvider.shutdown()
        console.log('[InngestMetrics] Shutdown complete')
      } catch (error) {
        console.error('[InngestMetrics] Error during shutdown:', error)
      }
    }
  }

  get enabled(): boolean {
    return this.isEnabled
  }
}

// Export singleton instance
export const InngestMetrics = new InngestMetricsClass()

// Shutdown on process exit
process.on('SIGTERM', async () => {
  await InngestMetrics.shutdown()
})

process.on('SIGINT', async () => {
  await InngestMetrics.shutdown()
})
