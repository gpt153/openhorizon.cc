/**
 * SendGrid Webhook Handler
 * Processes delivery, open, click, bounce, and other email events from SendGrid
 */

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { sendGridService, type SendGridEvent } from '@/lib/email/sendgrid'

export async function POST(request: NextRequest) {
  try {
    // Get webhook payload
    const events: SendGridEvent[] = await request.json()

    if (!Array.isArray(events)) {
      return NextResponse.json({ error: 'Invalid payload format' }, { status: 400 })
    }

    console.log(`📧 Received ${events.length} SendGrid webhook events`)

    // Process each event
    const results = await Promise.allSettled(
      events.map((event) => processEvent(event))
    )

    const processed = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length

    console.log(`✅ Processed ${processed} events, ${failed} failed`)

    return NextResponse.json({
      success: true,
      processed,
      failed,
    })
  } catch (error) {
    console.error('❌ SendGrid webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Process individual SendGrid event
 */
async function processEvent(event: SendGridEvent): Promise<void> {
  console.log(`📬 Processing event: ${event.event} for ${event.email}`)

  // Parse the event
  const parsed = sendGridService.parseWebhookEvent(event)

  // Find communication by SendGrid message ID or custom args
  const communication = await prisma.communication.findFirst({
    where: {
      OR: [
        { sendgridMessageId: parsed.messageId },
        ...(parsed.communicationId
          ? [{ id: parsed.communicationId }]
          : []),
      ],
    },
  })

  if (!communication) {
    console.warn(`⚠️  No communication found for message ID: ${parsed.messageId}`)
    return
  }

  // Update communication based on event type
  switch (event.event) {
    case 'delivered':
      await handleDelivered(communication.id, parsed.timestamp, parsed.metadata)
      break

    case 'open':
      await handleOpened(communication.id, parsed.timestamp, parsed.metadata)
      break

    case 'click':
      await handleClicked(communication.id, parsed.timestamp, parsed.metadata)
      break

    case 'bounce':
    case 'dropped':
      await handleBounced(
        communication.id,
        parsed.timestamp,
        parsed.metadata.reason || 'Unknown',
        parsed.metadata
      )
      break

    case 'spamreport':
      console.warn(`⚠️  Spam report for communication ${communication.id}`)
      await updateTrackingMetadata(communication.id, {
        spamReport: {
          timestamp: parsed.timestamp,
          ...parsed.metadata,
        },
      })
      break

    case 'unsubscribe':
      console.warn(`⚠️  Unsubscribe for communication ${communication.id}`)
      await updateTrackingMetadata(communication.id, {
        unsubscribe: {
          timestamp: parsed.timestamp,
          ...parsed.metadata,
        },
      })
      break

    default:
      console.log(`ℹ️  Unhandled event type: ${event.event}`)
  }
}

/**
 * Handle delivered event
 */
async function handleDelivered(
  communicationId: string,
  timestamp: Date,
  metadata: any
): Promise<void> {
  await prisma.communication.update({
    where: { id: communicationId },
    data: {
      status: 'DELIVERED',
      deliveredAt: timestamp,
      trackingMetadata: {
        delivered: {
          timestamp,
          ...metadata,
        },
      },
    },
  })
  console.log(`✅ Communication ${communicationId} marked as DELIVERED`)
}

/**
 * Handle opened event
 */
async function handleOpened(
  communicationId: string,
  timestamp: Date,
  metadata: any
): Promise<void> {
  const existing = await prisma.communication.findUnique({
    where: { id: communicationId },
  })

  if (!existing) return

  const isFirstOpen = !existing.openedAt
  const newOpenCount = (existing.openCount || 0) + 1

  await prisma.communication.update({
    where: { id: communicationId },
    data: {
      status: 'OPENED',
      openedAt: isFirstOpen ? timestamp : existing.openedAt,
      openCount: newOpenCount,
      trackingMetadata: {
        ...(existing.trackingMetadata as any),
        lastOpen: {
          timestamp,
          ...metadata,
        },
        opens: [
          ...((existing.trackingMetadata as any)?.opens || []),
          { timestamp, ...metadata },
        ],
      },
    },
  })

  console.log(
    `👀 Communication ${communicationId} opened (${newOpenCount} times)`
  )
}

/**
 * Handle clicked event
 */
async function handleClicked(
  communicationId: string,
  timestamp: Date,
  metadata: any
): Promise<void> {
  const existing = await prisma.communication.findUnique({
    where: { id: communicationId },
  })

  if (!existing) return

  const newClickCount = (existing.clickCount || 0) + 1

  await prisma.communication.update({
    where: { id: communicationId },
    data: {
      clickCount: newClickCount,
      trackingMetadata: {
        ...(existing.trackingMetadata as any),
        lastClick: {
          timestamp,
          url: metadata.url,
          ...metadata,
        },
        clicks: [
          ...((existing.trackingMetadata as any)?.clicks || []),
          { timestamp, url: metadata.url, ...metadata },
        ],
      },
    },
  })

  console.log(
    `🖱️  Communication ${communicationId} link clicked (${newClickCount} times): ${metadata.url}`
  )
}

/**
 * Handle bounced/dropped event
 */
async function handleBounced(
  communicationId: string,
  timestamp: Date,
  reason: string,
  metadata: any
): Promise<void> {
  await prisma.communication.update({
    where: { id: communicationId },
    data: {
      status: 'BOUNCED',
      bouncedAt: timestamp,
      bounceReason: reason,
      trackingMetadata: {
        bounce: {
          timestamp,
          reason,
          ...metadata,
        },
      },
    },
  })

  console.error(
    `❌ Communication ${communicationId} BOUNCED: ${reason}`
  )
}

/**
 * Update tracking metadata without changing status
 */
async function updateTrackingMetadata(
  communicationId: string,
  newMetadata: any
): Promise<void> {
  const existing = await prisma.communication.findUnique({
    where: { id: communicationId },
  })

  if (!existing) return

  await prisma.communication.update({
    where: { id: communicationId },
    data: {
      trackingMetadata: {
        ...(existing.trackingMetadata as any),
        ...newMetadata,
      },
    },
  })
}
