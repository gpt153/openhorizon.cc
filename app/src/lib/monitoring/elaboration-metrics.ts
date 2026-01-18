/**
 * Elaboration Metrics Tracking
 *
 * Business and performance metrics for seed elaboration feature.
 * Integrated with Sentry for monitoring and alerting.
 *
 * Part of Issue #180: Deployment Validation - Monitoring Setup
 */

import * as Sentry from '@sentry/nextjs'

/**
 * Metric event types
 */
export enum ElaborationEvent {
  // Session lifecycle
  SESSION_STARTED = 'elaboration.session.started',
  SESSION_COMPLETED = 'elaboration.session.completed',
  SESSION_ABANDONED = 'elaboration.session.abandoned',

  // Interactions
  QUESTION_ANSWERED = 'elaboration.question.answered',
  MESSAGE_EDITED = 'elaboration.message.edited',
  QUICK_REPLY_USED = 'elaboration.quick_reply.used',

  // Metadata
  METADATA_EXTRACTED = 'elaboration.metadata.extracted',
  COMPLETENESS_UPDATED = 'elaboration.completeness.updated',

  // Errors
  API_ERROR = 'elaboration.api.error',
  VALIDATION_ERROR = 'elaboration.validation.error',
  TIMEOUT_ERROR = 'elaboration.timeout.error',

  // Performance
  RESPONSE_TIME = 'elaboration.response_time',
  TOTAL_DURATION = 'elaboration.total_duration'
}

/**
 * Metadata extraction result
 */
export interface MetadataExtraction {
  field: string
  extracted: boolean
  confidence?: number
}

/**
 * Track elaboration session start
 */
export function trackSessionStarted(seedId: string, userId?: string): void {
  Sentry.metrics.increment(ElaborationEvent.SESSION_STARTED, 1, {
    tags: {
      seed_id: seedId,
      user_id: userId || 'anonymous'
    }
  })

  Sentry.addBreadcrumb({
    category: 'elaboration',
    message: 'Elaboration session started',
    level: 'info',
    data: {
      seedId,
      userId,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track elaboration session completion
 */
export function trackSessionCompleted(
  seedId: string,
  durationMs: number,
  completeness: number,
  questionsAnswered: number,
  userId?: string
): void {
  Sentry.metrics.increment(ElaborationEvent.SESSION_COMPLETED, 1, {
    tags: {
      seed_id: seedId,
      user_id: userId || 'anonymous',
      completeness_bucket: getCompletenessBucket(completeness)
    }
  })

  Sentry.metrics.distribution(ElaborationEvent.TOTAL_DURATION, durationMs, {
    tags: {
      seed_id: seedId
    },
    unit: 'millisecond'
  })

  Sentry.metrics.gauge('elaboration.completeness_percentage', completeness, {
    tags: {
      seed_id: seedId
    },
    unit: 'percent'
  })

  Sentry.metrics.gauge('elaboration.questions_answered_count', questionsAnswered, {
    tags: {
      seed_id: seedId
    }
  })

  Sentry.addBreadcrumb({
    category: 'elaboration',
    message: 'Elaboration session completed',
    level: 'info',
    data: {
      seedId,
      durationMs,
      completeness,
      questionsAnswered,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track elaboration session abandonment
 */
export function trackSessionAbandoned(
  seedId: string,
  durationMs: number,
  completeness: number,
  questionsAnswered: number,
  abandonmentReason?: string,
  userId?: string
): void {
  Sentry.metrics.increment(ElaborationEvent.SESSION_ABANDONED, 1, {
    tags: {
      seed_id: seedId,
      user_id: userId || 'anonymous',
      completeness_bucket: getCompletenessBucket(completeness),
      reason: abandonmentReason || 'unknown'
    }
  })

  Sentry.addBreadcrumb({
    category: 'elaboration',
    message: 'Elaboration session abandoned',
    level: 'warning',
    data: {
      seedId,
      durationMs,
      completeness,
      questionsAnswered,
      reason: abandonmentReason,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track question answered
 */
export function trackQuestionAnswered(
  seedId: string,
  questionIndex: number,
  responseTimeMs: number,
  userId?: string
): void {
  Sentry.metrics.increment(ElaborationEvent.QUESTION_ANSWERED, 1, {
    tags: {
      seed_id: seedId,
      user_id: userId || 'anonymous',
      question_index: questionIndex.toString()
    }
  })

  Sentry.metrics.distribution(ElaborationEvent.RESPONSE_TIME, responseTimeMs, {
    tags: {
      seed_id: seedId,
      question_index: questionIndex.toString()
    },
    unit: 'millisecond'
  })

  // Alert if response time is too slow (>10s)
  if (responseTimeMs > 10000) {
    Sentry.captureMessage('Slow elaboration response time', {
      level: 'warning',
      tags: {
        seed_id: seedId,
        question_index: questionIndex.toString()
      },
      extra: {
        responseTimeMs,
        threshold: 10000
      }
    })
  }
}

/**
 * Track metadata extraction
 */
export function trackMetadataExtracted(
  seedId: string,
  extractions: MetadataExtraction[],
  userId?: string
): void {
  const extractedCount = extractions.filter((e) => e.extracted).length
  const totalFields = extractions.length

  Sentry.metrics.increment(ElaborationEvent.METADATA_EXTRACTED, extractedCount, {
    tags: {
      seed_id: seedId,
      user_id: userId || 'anonymous'
    }
  })

  Sentry.metrics.gauge('elaboration.metadata_fields_extracted_count', extractedCount, {
    tags: {
      seed_id: seedId
    }
  })

  Sentry.addBreadcrumb({
    category: 'elaboration',
    message: 'Metadata extracted',
    level: 'info',
    data: {
      seedId,
      extractedCount,
      totalFields,
      extractions,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track completeness update
 */
export function trackCompletenessUpdated(
  seedId: string,
  previousCompleteness: number,
  newCompleteness: number,
  userId?: string
): void {
  const delta = newCompleteness - previousCompleteness

  Sentry.metrics.increment(ElaborationEvent.COMPLETENESS_UPDATED, 1, {
    tags: {
      seed_id: seedId,
      user_id: userId || 'anonymous'
    }
  })

  Sentry.addBreadcrumb({
    category: 'elaboration',
    message: 'Completeness updated',
    level: 'info',
    data: {
      seedId,
      previousCompleteness,
      newCompleteness,
      delta,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track API error
 */
export function trackAPIError(
  seedId: string,
  errorType: string,
  errorMessage: string,
  statusCode?: number,
  userId?: string
): void {
  Sentry.metrics.increment(ElaborationEvent.API_ERROR, 1, {
    tags: {
      seed_id: seedId,
      user_id: userId || 'anonymous',
      error_type: errorType,
      status_code: statusCode?.toString() || 'unknown'
    }
  })

  Sentry.captureException(new Error(errorMessage), {
    level: 'error',
    tags: {
      feature: 'elaboration',
      seed_id: seedId,
      error_type: errorType,
      status_code: statusCode?.toString()
    },
    extra: {
      errorMessage,
      timestamp: new Date().toISOString()
    }
  })

  // Special handling for rate limits
  if (statusCode === 429) {
    Sentry.captureMessage('OpenAI API rate limit hit', {
      level: 'warning',
      tags: {
        feature: 'elaboration',
        seed_id: seedId
      }
    })
  }
}

/**
 * Track validation error
 */
export function trackValidationError(
  seedId: string,
  field: string,
  errorMessage: string,
  userId?: string
): void {
  Sentry.metrics.increment(ElaborationEvent.VALIDATION_ERROR, 1, {
    tags: {
      seed_id: seedId,
      user_id: userId || 'anonymous',
      field
    }
  })

  Sentry.addBreadcrumb({
    category: 'elaboration',
    message: 'Validation error',
    level: 'warning',
    data: {
      seedId,
      field,
      errorMessage,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track timeout error
 */
export function trackTimeoutError(
  seedId: string,
  timeoutMs: number,
  operation: string,
  userId?: string
): void {
  Sentry.metrics.increment(ElaborationEvent.TIMEOUT_ERROR, 1, {
    tags: {
      seed_id: seedId,
      user_id: userId || 'anonymous',
      operation
    }
  })

  Sentry.captureMessage('Elaboration timeout', {
    level: 'error',
    tags: {
      feature: 'elaboration',
      seed_id: seedId,
      operation
    },
    extra: {
      timeoutMs,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track quick reply usage
 */
export function trackQuickReplyUsed(
  seedId: string,
  quickReplyText: string,
  userId?: string
): void {
  Sentry.metrics.increment(ElaborationEvent.QUICK_REPLY_USED, 1, {
    tags: {
      seed_id: seedId,
      user_id: userId || 'anonymous'
    }
  })

  Sentry.addBreadcrumb({
    category: 'elaboration',
    message: 'Quick reply used',
    level: 'info',
    data: {
      seedId,
      quickReplyText,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Track message edit
 */
export function trackMessageEdited(
  seedId: string,
  messageIndex: number,
  userId?: string
): void {
  Sentry.metrics.increment(ElaborationEvent.MESSAGE_EDITED, 1, {
    tags: {
      seed_id: seedId,
      user_id: userId || 'anonymous',
      message_index: messageIndex.toString()
    }
  })

  Sentry.addBreadcrumb({
    category: 'elaboration',
    message: 'Message edited',
    level: 'info',
    data: {
      seedId,
      messageIndex,
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Helper: Get completeness bucket for grouping
 */
function getCompletenessBucket(completeness: number): string {
  if (completeness === 0) return '0%'
  if (completeness < 25) return '1-24%'
  if (completeness < 50) return '25-49%'
  if (completeness < 75) return '50-74%'
  if (completeness < 100) return '75-99%'
  return '100%'
}

/**
 * Create elaboration span for performance tracking
 */
export function createElaborationSpan(
  operation: string,
  seedId: string
): Sentry.Span | undefined {
  const transaction = Sentry.getCurrentHub().getScope()?.getTransaction()

  if (transaction) {
    return transaction.startChild({
      op: 'elaboration',
      description: operation,
      tags: {
        seed_id: seedId
      }
    })
  }

  return undefined
}

/**
 * Calculate error rate
 */
export function calculateErrorRate(
  totalRequests: number,
  errorCount: number
): number {
  if (totalRequests === 0) return 0
  return (errorCount / totalRequests) * 100
}

/**
 * Export all tracking functions as a namespace
 */
export const ElaborationMetrics = {
  trackSessionStarted,
  trackSessionCompleted,
  trackSessionAbandoned,
  trackQuestionAnswered,
  trackMetadataExtracted,
  trackCompletenessUpdated,
  trackAPIError,
  trackValidationError,
  trackTimeoutError,
  trackQuickReplyUsed,
  trackMessageEdited,
  createElaborationSpan,
  calculateErrorRate
}

export default ElaborationMetrics
