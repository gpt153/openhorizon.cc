import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import type { WebhookEvent } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  // Get webhook secret from environment
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    console.error('❌ CLERK_WEBHOOK_SECRET is not set')
    return new NextResponse('Server configuration error', { status: 500 })
  }

  // Get Svix headers for verification
  const headerPayload = await headers()
  const svixId = headerPayload.get('svix-id')
  const svixTimestamp = headerPayload.get('svix-timestamp')
  const svixSignature = headerPayload.get('svix-signature')

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new NextResponse('Missing Svix headers', { status: 400 })
  }

  // Get request body
  const payload = await request.json()
  const body = JSON.stringify(payload)

  // Verify webhook signature
  const wh = new Webhook(WEBHOOK_SECRET)
  let event: WebhookEvent

  try {
    event = wh.verify(body, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    }) as WebhookEvent
  } catch (err) {
    console.error('❌ Webhook verification failed:', err)
    return new NextResponse('Invalid signature', { status: 400 })
  }

  // Handle different event types
  const eventType = event.type

  console.log(`📬 Clerk webhook received: ${eventType}`)

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(event.data)
        break

      case 'user.updated':
        await handleUserUpdated(event.data)
        break

      case 'user.deleted':
        await handleUserDeleted(event.data)
        break

      default:
        console.log(`ℹ️  Unhandled event type: ${eventType}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`❌ Error processing ${eventType}:`, error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}

/**
 * Handle user.created event
 * Creates organization for first user, adds user to organization
 */
async function handleUserCreated(data: any) {
  const userId = data.id
  const email = data.email_addresses?.[0]?.email_address
  const firstName = data.first_name
  const lastName = data.last_name

  console.log(`👤 Creating user: ${email} (${userId})`)

  // Check if user already has an organization membership
  const existingMembership = await prisma.userOrganizationMembership.findFirst({
    where: { userId },
  })

  if (existingMembership) {
    console.log(`ℹ️  User ${userId} already has an organization`)
    return
  }

  // Create organization for this user (first user = owner)
  // Generate org slug from email or name
  const orgSlug =
    email
      ?.split('@')[0]
      ?.toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') || `org-${userId.slice(0, 8)}`
  const orgName =
    firstName && lastName
      ? `${firstName} ${lastName}'s Organization`
      : `Organization ${orgSlug}`

  const organization = await prisma.organization.create({
    data: {
      name: orgName,
      slug: orgSlug,
      subscriptionTier: 'FREE',
    },
  })

  console.log(`🏢 Created organization: ${orgName} (${organization.id})`)

  // Add user as OWNER of the organization
  await prisma.userOrganizationMembership.create({
    data: {
      userId,
      organizationId: organization.id,
      role: 'OWNER',
    },
  })

  console.log(`✅ User ${userId} added as OWNER of ${organization.id}`)
}

/**
 * Handle user.updated event
 * Currently a no-op (we don't store user profiles in our DB)
 */
async function handleUserUpdated(data: any) {
  const userId = data.id
  console.log(`🔄 User updated: ${userId}`)
  // Future: Update user profile if we store it
}

/**
 * Handle user.deleted event
 * Removes user's organization memberships (org deletion is manual)
 */
async function handleUserDeleted(data: any) {
  const userId = data.id
  console.log(`🗑️  Deleting user memberships: ${userId}`)

  // Delete user's organization memberships
  await prisma.userOrganizationMembership.deleteMany({
    where: { userId },
  })

  console.log(`✅ Deleted memberships for user ${userId}`)
}
