# Email Quote System Documentation

## Overview

The Email Quote System provides automated email sending with delivery tracking, follow-up scheduling, and vendor communication management for the Open Horizon project pipeline.

## Features

✅ **Professional Email Templates** - Erasmus+ formatted templates for quote requests, follow-ups, and acceptances
✅ **SendGrid Integration** - Enterprise-grade email delivery with tracking
✅ **Delivery Tracking** - Real-time tracking of sent, delivered, opened, and clicked emails
✅ **Bulk Sending** - Send quote requests to multiple vendors simultaneously
✅ **Draft Management** - Review and edit emails before sending
✅ **Follow-up Automation** - Automatic follow-up suggestions for pending quotes
✅ **Bounce Handling** - Track bounced emails with detailed error messages

## Architecture

### Components

1. **Email Template Engine** (`/app/src/lib/email/templates.ts`)
   - Professional, HTML-formatted email templates
   - Quote requests, follow-ups, and acceptance emails
   - Responsive design for mobile and desktop

2. **SendGrid Service** (`/app/src/lib/email/sendgrid.ts`)
   - SendGrid API integration
   - Bulk email sending
   - Webhook event parsing

3. **tRPC Router** (`/app/src/server/routers/pipeline/communications.ts`)
   - API endpoints for email operations
   - Authentication and authorization
   - Database operations

4. **Webhook Handler** (`/app/src/app/api/webhooks/sendgrid/route.ts`)
   - Processes SendGrid events (delivered, opened, clicked, bounced)
   - Updates communication tracking in real-time

## Database Schema

### Communication Model

```prisma
model Communication {
  // ... existing fields ...

  // SendGrid tracking
  sendgridMessageId String?   // SendGrid message ID
  deliveredAt       DateTime? // When email was delivered
  openedAt          DateTime? // First time email was opened
  openCount         Int       // Number of times opened
  clickCount        Int       // Number of clicks
  bouncedAt         DateTime? // When email bounced
  bounceReason      String?   // Bounce error message
  trackingMetadata  Json?     // Additional tracking data
}
```

### Status Lifecycle

```
DRAFT → SENT → DELIVERED → OPENED → RESPONDED
                     ↓
                  BOUNCED
                     ↓
                  FAILED
```

## API Endpoints

### 1. Generate Draft Quote Requests

**Endpoint:** `pipelineCommunications.generateQuoteRequestDrafts`

**Purpose:** Create draft emails for multiple vendors

**Input:**
```typescript
{
  phaseId: string          // UUID of the phase
  vendorIds: string[]      // Array of vendor UUIDs
  requirements?: string    // Special requirements
  budgetRange?: {          // Budget constraints
    min: number
    max: number
  }
  deadline?: string        // ISO datetime string
  contactPerson: string    // Sender name
  contactEmail: string     // Reply-to email
}
```

**Output:**
```typescript
{
  success: boolean
  drafts: Communication[]  // Array of draft communications
}
```

**Example:**
```typescript
const result = await trpc.pipelineCommunications.generateQuoteRequestDrafts.mutate({
  phaseId: "550e8400-e29b-41d4-a716-446655440000",
  vendorIds: ["vendor-1-uuid", "vendor-2-uuid"],
  requirements: "Vegetarian options required, wheelchair accessible",
  budgetRange: { min: 25, max: 35 },
  deadline: "2025-02-15T23:59:59Z",
  contactPerson: "John Doe",
  contactEmail: "john@openhorizon.cc"
})
```

### 2. Send Quote Requests (Bulk)

**Endpoint:** `pipelineCommunications.sendQuoteRequests`

**Purpose:** Send draft emails via SendGrid

**Input:**
```typescript
{
  communicationIds: string[]  // Array of communication UUIDs
}
```

**Output:**
```typescript
{
  success: boolean
  total: number              // Total emails processed
  sent: number               // Successfully sent
  failed: number             // Failed to send
  results: Array<{
    communicationId: string
    success: boolean
    error?: string
  }>
}
```

**Example:**
```typescript
const result = await trpc.pipelineCommunications.sendQuoteRequests.mutate({
  communicationIds: ["comm-1-uuid", "comm-2-uuid", "comm-3-uuid"]
})

console.log(`Sent ${result.sent} of ${result.total} emails`)
```

### 3. Get Communication Status

**Endpoint:** `pipelineCommunications.getStatus`

**Purpose:** Get detailed tracking information for an email

**Input:**
```typescript
{
  id: string  // Communication UUID
}
```

**Output:**
```typescript
{
  ...communication,           // Full communication object
  tracking: {
    sent: DateTime | null
    delivered: DateTime | null
    opened: DateTime | null
    openCount: number
    clickCount: number
    bounced: DateTime | null
    bounceReason: string | null
    responded: DateTime | null
  }
}
```

**Example:**
```typescript
const status = await trpc.pipelineCommunications.getStatus.query({
  id: "communication-uuid"
})

console.log(`Email opened ${status.tracking.openCount} times`)
```

### 4. Schedule Follow-up

**Endpoint:** `pipelineCommunications.scheduleFollowUp`

**Purpose:** Create a follow-up email draft for a sent communication

**Input:**
```typescript
{
  communicationId: string  // Original communication UUID
  delayDays?: number       // Days since original (default: 3)
}
```

**Output:**
```typescript
{
  success: boolean
  followUpId: string  // UUID of the follow-up communication (draft)
}
```

**Example:**
```typescript
const result = await trpc.pipelineCommunications.scheduleFollowUp.mutate({
  communicationId: "original-email-uuid",
  delayDays: 7
})
```

## SendGrid Webhook Configuration

### 1. Create Webhook in SendGrid

1. Go to [SendGrid Settings > Event Webhooks](https://app.sendgrid.com/settings/mail_settings)
2. Click "Create new webhook"
3. Configure:
   - **POST URL:** `https://app.openhorizon.cc/api/webhooks/sendgrid`
   - **Events to track:**
     - ✅ Delivered
     - ✅ Opened
     - ✅ Clicked
     - ✅ Bounced
     - ✅ Dropped
     - ✅ Spam Reports
     - ✅ Unsubscribes
   - **Signature Verification:** Enabled (recommended)

### 2. Webhook Events

The webhook handler processes these events:

| Event | Action | Status Update |
|-------|--------|---------------|
| `delivered` | Update `deliveredAt` | `DELIVERED` |
| `open` | Update `openedAt`, increment `openCount` | `OPENED` |
| `click` | Increment `clickCount`, log URL | No change |
| `bounce` | Update `bouncedAt`, `bounceReason` | `BOUNCED` |
| `dropped` | Same as bounce | `BOUNCED` |
| `spamreport` | Log in metadata | No change |
| `unsubscribe` | Log in metadata | No change |

### 3. Webhook Security

```env
SENDGRID_WEBHOOK_SECRET="your_webhook_verification_key"
```

The webhook handler verifies SendGrid signatures to prevent spoofing.

## Email Templates

### Quote Request Template

**Features:**
- Professional Erasmus+ format
- Project details table
- Budget information (if provided)
- Deadline highlighting
- Special requirements section
- Contact information

**Example output:**
```
Subject: Quote Request - Group Booking for Youth Exchange Sweden 2025

Dear Riverside Hostel Team,

I am writing on behalf of Open Horizon, a Swedish non-profit organization
coordinating Erasmus+ youth mobility projects.

We are organizing a youth exchange titled "Youth Exchange Sweden 2025" and
would like to request a group booking quote.

PROJECT DETAILS:
┌────────────────┬──────────────────────────────┐
│ Project Name   │ Youth Exchange Sweden 2025   │
│ Check-in       │ Monday, 15 July 2025         │
│ Check-out      │ Sunday, 21 July 2025         │
│ Duration       │ 6 nights                     │
│ Participants   │ 30 young people (ages 16-25) │
│ Location       │ Stockholm, Sweden            │
└────────────────┴──────────────────────────────┘

REQUIREMENTS:
- Vegetarian and vegan meal options
- Wheelchair accessible facilities
- Meeting room for 30 people

...
```

### Follow-up Template

**Features:**
- Polite reminder
- Reference to original request
- Days since original email
- Maintains professional tone

### Acceptance Template

**Features:**
- Clear acceptance statement
- Quote amount confirmation
- Next steps (optional)
- Professional tone

## Environment Variables

```env
# Required
SENDGRID_API_KEY="SG.xxx..."                    # From SendGrid dashboard
SENDGRID_FROM_EMAIL="projects@openhorizon.cc"   # Verified sender
SENDGRID_FROM_NAME="Open Horizon Projects"      # Sender display name

# Optional
SENDGRID_WEBHOOK_SECRET="xxx..."                # Webhook verification key
```

## Usage Examples

### Complete Workflow: Quote Request to Multiple Vendors

```typescript
// 1. Generate drafts for 3 vendors
const drafts = await trpc.pipelineCommunications.generateQuoteRequestDrafts.mutate({
  phaseId: phase.id,
  vendorIds: [vendor1.id, vendor2.id, vendor3.id],
  requirements: "Wheelchair accessible, vegetarian options",
  budgetRange: { min: 30, max: 40 },
  deadline: "2025-02-28T23:59:59Z",
  contactPerson: "Jane Smith",
  contactEmail: "jane@openhorizon.cc"
})

console.log(`Created ${drafts.drafts.length} draft emails`)

// 2. User reviews drafts in UI, then sends them
const result = await trpc.pipelineCommunications.sendQuoteRequests.mutate({
  communicationIds: drafts.drafts.map(d => d.id)
})

console.log(`✅ Sent ${result.sent} emails`)
console.log(`❌ Failed ${result.failed} emails`)

// 3. Check status after a few hours
for (const comm of drafts.drafts) {
  const status = await trpc.pipelineCommunications.getStatus.query({
    id: comm.id
  })

  console.log(`${status.vendor.name}: ${status.status}`)
  if (status.tracking.opened) {
    console.log(`  ✓ Opened ${status.tracking.openCount} times`)
  }
}

// 4. Send follow-up after 3 days for vendors who haven't responded
for (const comm of drafts.drafts) {
  const status = await trpc.pipelineCommunications.getStatus.query({ id: comm.id })

  if (status.status === 'OPENED' && !status.tracking.responded) {
    // They opened but didn't respond - send follow-up
    await trpc.pipelineCommunications.scheduleFollowUp.mutate({
      communicationId: comm.id,
      delayDays: 3
    })
  }
}
```

## Testing

### 1. Test Email Sending

```typescript
// Send to a test email address
const test = await trpc.pipelineCommunications.generateQuoteRequestDrafts.mutate({
  phaseId: testPhase.id,
  vendorIds: [testVendor.id], // Vendor with your email
  contactPerson: "Test User",
  contactEmail: "your-email@example.com"
})

await trpc.pipelineCommunications.sendQuoteRequests.mutate({
  communicationIds: [test.drafts[0].id]
})

// Check your inbox
```

### 2. Test Webhook

Use SendGrid's webhook testing tool:

1. Go to SendGrid Event Webhook settings
2. Click "Test Your Integration"
3. Select event types
4. SendGrid will POST test events to your webhook URL
5. Check database to see if communication was updated

### 3. Manual Webhook Test

```bash
curl -X POST https://app.openhorizon.cc/api/webhooks/sendgrid \
  -H "Content-Type: application/json" \
  -d '[{
    "event": "delivered",
    "email": "vendor@example.com",
    "timestamp": 1642345678,
    "sg_message_id": "test-message-id",
    "communicationId": "your-communication-uuid"
  }]'
```

## Troubleshooting

### Email Not Sending

**Check:**
1. `SENDGRID_API_KEY` is set correctly
2. SendGrid sender email is verified
3. Communication status is `DRAFT` before sending
4. Vendor has a valid email address

**Debug:**
```typescript
// Check SendGrid service directly
import { sendGridService } from '@/lib/email/sendgrid'

const result = await sendGridService.sendEmail({
  to: "test@example.com",
  subject: "Test",
  html: "<p>Test email</p>"
})

console.log(result) // { success: true/false, error?: string }
```

### Webhook Not Working

**Check:**
1. Webhook URL is publicly accessible
2. Webhook signature verification is disabled (for testing) or secret is correct
3. Events are enabled in SendGrid webhook settings
4. Communication has `sendgridMessageId` set

**Debug:**
```bash
# Check webhook logs
tail -f /var/log/app.log | grep "SendGrid webhook"

# Test webhook manually
curl -X POST https://app.openhorizon.cc/api/webhooks/sendgrid \
  -H "Content-Type: application/json" \
  -d '[{"event":"open","sg_message_id":"test","email":"test@test.com","timestamp":1234567890}]'
```

### Tracking Not Updating

**Check:**
1. `sendgridMessageId` is saved when email is sent
2. Webhook events are reaching the server (check logs)
3. Communication ID is passed in custom args or message ID matches

**Debug:**
```typescript
// Check communication tracking fields
const comm = await prisma.communication.findUnique({
  where: { id: "comm-uuid" }
})

console.log({
  sendgridMessageId: comm.sendgridMessageId,
  status: comm.status,
  deliveredAt: comm.deliveredAt,
  openedAt: comm.openedAt,
  trackingMetadata: comm.trackingMetadata
})
```

## Best Practices

### 1. Always Generate Drafts First

✅ **Do:**
```typescript
// Generate drafts, let user review, then send
const drafts = await generateQuoteRequestDrafts(...)
// User reviews in UI
await sendQuoteRequests({ communicationIds: selectedDrafts })
```

❌ **Don't:**
```typescript
// Skip draft review - no way to edit before sending
await sendEmailDirectly(...) // Not recommended
```

### 2. Track Send Results

```typescript
const result = await sendQuoteRequests({ communicationIds })

// Always check results
if (result.failed > 0) {
  console.error(`Failed to send ${result.failed} emails`)
  result.results
    .filter(r => !r.success)
    .forEach(r => console.error(`Failed: ${r.communicationId} - ${r.error}`))
}
```

### 3. Handle Bounces

```typescript
// Check for bounces periodically
const bounced = await prisma.communication.findMany({
  where: {
    status: 'BOUNCED',
    projectId: project.id
  },
  include: { vendor: true }
})

// Update vendor records or notify user
for (const comm of bounced) {
  console.warn(`Bounce: ${comm.vendor.name} - ${comm.bounceReason}`)
  // Maybe update vendor.email or vendor.isActive = false
}
```

### 4. Rate Limiting

SendGrid has rate limits. For bulk sending:

```typescript
// The service already includes delays for bulk sends
// For very large batches (100+), consider chunking:

const chunks = chunk(communicationIds, 50) // 50 at a time

for (const chunk of chunks) {
  await sendQuoteRequests({ communicationIds: chunk })
  await sleep(5000) // 5 second delay between chunks
}
```

## Migration Guide

### From Resend to SendGrid

If you're migrating from the existing Resend implementation:

1. **Install SendGrid:**
   ```bash
   npm install @sendgrid/mail
   ```

2. **Update Environment:**
   ```env
   # Replace RESEND_API_KEY with:
   SENDGRID_API_KEY="SG.xxx..."
   SENDGRID_FROM_EMAIL="projects@openhorizon.cc"
   SENDGRID_FROM_NAME="Open Horizon Projects"
   ```

3. **Run Migration:**
   ```bash
   psql $DATABASE_URL < app/migrations/add_sendgrid_tracking.sql
   ```

4. **Update Code:**
   - Replace `sendEmail` imports from `@/lib/email/resend` with `@/lib/email/sendgrid`
   - Use new `generateQuoteRequestDrafts` + `sendQuoteRequests` workflow
   - Add webhook endpoint to your Next.js app

5. **Configure SendGrid:**
   - Verify sender email
   - Set up event webhook
   - Test with a few emails

## Support

For issues or questions:
- Check the [SendGrid Documentation](https://docs.sendgrid.com/)
- Review webhook logs: `/api/webhooks/sendgrid`
- Check database: `SELECT * FROM communications WHERE status = 'FAILED'`
- Contact: dev@openhorizon.cc
