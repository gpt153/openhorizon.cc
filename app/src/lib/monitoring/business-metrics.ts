/**
 * Business Metrics Library
 *
 * Tracks business-specific events and metrics:
 * - Projects created
 * - Searches completed (food, accommodation)
 * - Exports generated (PDF, Excel, Word)
 * - User signups
 */

import { MeterProvider, PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics'
import { MetricExporter } from '@google-cloud/opentelemetry-cloud-monitoring-exporter'
import { Resource } from '@opentelemetry/resources'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

/**
 * Business Metrics Collector Singleton
 */
class BusinessMetricsClass {
  private meterProvider: MeterProvider | null = null
  private meter: any = null
  private isEnabled: boolean = false

  // Business metric instruments
  private projectsCreatedCounter: any = null
  private searchesCompletedCounter: any = null
  private exportsGeneratedCounter: any = null
  private userSignupsCounter: any = null

  constructor() {
    this.initialize()
  }

  private initialize() {
    const enableMetrics = process.env.ENABLE_METRICS === 'true' || process.env.NODE_ENV === 'production'
    const projectId = process.env.GOOGLE_CLOUD_PROJECT

    if (!enableMetrics || !projectId) {
      console.log('[BusinessMetrics] Disabled')
      return
    }

    try {
      const resource = new Resource({
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

      this.meter = this.meterProvider.getMeter('openhorizon-business-metrics')

      // Create business metric instruments
      this.projectsCreatedCounter = this.meter.createCounter('custom.googleapis.com/business/projects_created', {
        description: 'Total number of projects created',
        unit: '1',
      })

      this.searchesCompletedCounter = this.meter.createCounter('custom.googleapis.com/business/searches_completed', {
        description: 'Total number of searches completed',
        unit: '1',
      })

      this.exportsGeneratedCounter = this.meter.createCounter('custom.googleapis.com/business/exports_generated', {
        description: 'Total number of exports generated',
        unit: '1',
      })

      this.userSignupsCounter = this.meter.createCounter('custom.googleapis.com/business/user_signups', {
        description: 'Total number of user signups',
        unit: '1',
      })

      this.isEnabled = true
      console.log('[BusinessMetrics] Initialized successfully')
    } catch (error) {
      console.error('[BusinessMetrics] Failed to initialize:', error)
      this.isEnabled = false
    }
  }

  /**
   * Record project creation event
   * @param tenantId Organization/tenant ID
   */
  recordProjectCreated(tenantId: string) {
    if (!this.isEnabled) return

    try {
      this.projectsCreatedCounter.add(1, { tenant_id: tenantId })
      console.log('[BusinessMetrics] Project created:', tenantId)
    } catch (error) {
      console.error('[BusinessMetrics] Error recording project creation:', error)
    }
  }

  /**
   * Record search completion event
   * @param searchType Type of search ('food' | 'accommodation')
   * @param tenantId Optional tenant ID
   */
  recordSearchCompleted(searchType: 'food' | 'accommodation', tenantId?: string) {
    if (!this.isEnabled) return

    try {
      const attributes: any = { search_type: searchType }
      if (tenantId) attributes.tenant_id = tenantId

      this.searchesCompletedCounter.add(1, attributes)
      console.log('[BusinessMetrics] Search completed:', searchType)
    } catch (error) {
      console.error('[BusinessMetrics] Error recording search:', error)
    }
  }

  /**
   * Record document export event
   * @param format Export format ('pdf' | 'docx' | 'excel')
   * @param tenantId Optional tenant ID
   */
  recordExportGenerated(format: 'pdf' | 'docx' | 'excel', tenantId?: string) {
    if (!this.isEnabled) return

    try {
      const attributes: any = { format }
      if (tenantId) attributes.tenant_id = tenantId

      this.exportsGeneratedCounter.add(1, attributes)
      console.log('[BusinessMetrics] Export generated:', format)
    } catch (error) {
      console.error('[BusinessMetrics] Error recording export:', error)
    }
  }

  /**
   * Record user signup event
   * @param userId User ID
   */
  recordUserSignup(userId: string) {
    if (!this.isEnabled) return

    try {
      this.userSignupsCounter.add(1, { user_id: userId })
      console.log('[BusinessMetrics] User signup:', userId)
    } catch (error) {
      console.error('[BusinessMetrics] Error recording signup:', error)
    }
  }

  /**
   * Shutdown metrics provider
   */
  async shutdown() {
    if (this.meterProvider && this.isEnabled) {
      try {
        await this.meterProvider.shutdown()
        console.log('[BusinessMetrics] Shutdown complete')
      } catch (error) {
        console.error('[BusinessMetrics] Error during shutdown:', error)
      }
    }
  }

  get enabled(): boolean {
    return this.isEnabled
  }
}

// Export singleton instance
export const BusinessMetrics = new BusinessMetricsClass()

// Shutdown on process exit
process.on('SIGTERM', async () => {
  await BusinessMetrics.shutdown()
})

process.on('SIGINT', async () => {
  await BusinessMetrics.shutdown()
})
