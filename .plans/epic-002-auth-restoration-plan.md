# Epic 002: Authentication System Stability - Implementation Plan

## Executive Summary

**Epic:** Epic 002 - Re-enable and Fix Authentication System
**Status:** Ready for Implementation
**Estimated Effort:** 9 hours (1-2 days)
**Priority:** HIGH - Blocks Epic 003 (Production Readiness)

## Current State Analysis

### What's Broken
1. **Authentication Completely Disabled**: Middleware is a no-op, all routes are public
2. **Dummy Clerk Keys**: `.env.production` has placeholder values (`pk_test_dummy`, `sk_test_dummy`)
3. **No Local Environment**: No `.env.local` file for development
4. **Hardcoded Context**: `server/context.ts` uses dummy user/org IDs
5. **API Routes Using Clerk**: Two routes (`/api/projects/[id]/export` and `/api/budget/export`) import `auth()` from Clerk but it's non-functional
6. **No Webhook Handler**: No `/api/webhooks/clerk/route.ts` to sync user creation
7. **Missing ClerkProvider**: Root layout doesn't wrap app in `ClerkProvider`
8. **Dashboard Assumes No Auth**: Dashboard layout shows "Auth Disabled - Development Mode"
9. **No Organization Auto-Creation**: First user sign-up won't create an organization automatically

### Key Files to Modify
```
app/src/middleware.ts                          # Re-enable Clerk middleware
app/src/server/context.ts                      # Use real Clerk auth
app/src/app/layout.tsx                         # Add ClerkProvider
app/src/app/(dashboard)/layout.tsx             # Remove auth disabled message
app/src/components/layout/Header.tsx           # Add user menu/sign out
app/src/app/api/webhooks/clerk/route.ts        # NEW: Handle user.created events
app/.env.local                                 # NEW: Local development keys
.env.production                                # UPDATE: Real Clerk keys
app/tests/e2e/auth-flow.spec.ts               # NEW: E2E tests
```

### Current Dependencies
- ✅ `@clerk/nextjs`: v6.36.3 installed
- ✅ Prisma schema has `Organization` and `UserOrganizationMembership` models
- ✅ Sign-in/sign-up pages exist with Clerk components
- ✅ Playwright configured for E2E testing

---

## Implementation Issues (7 Total)

### Issue 1: Configure Clerk API Keys ⚙️

**Goal:** Set up valid Clerk API keys for local development and production

**Steps:**
1. **Clerk Dashboard Setup**
   - Log into Clerk Dashboard (https://dashboard.clerk.com/)
   - Create application: "OpenHorizon Production" (if not exists)
   - Navigate to API Keys section
   - Copy `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY`

2. **Local Environment Setup**
   - Create `app/.env.local` (gitignored)
   - Add Clerk keys from dashboard
   - Copy other required vars from `.env.production`
   - Test that keys work with simple auth call

3. **Production Environment Setup**
   - Update `.env.production` with real keys (remove `dummy` values)
   - Update Cloud Run environment variables:
     ```bash
     gcloud run services update openhorizon-app \
       --update-env-vars NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_xxx \
       --update-env-vars CLERK_SECRET_KEY=sk_live_xxx \
       --region=europe-west1
     ```
   - Verify keys are valid before proceeding

4. **Verification**
   - Run `npm run dev` locally
   - Navigate to `/sign-in` - should show Clerk sign-in UI
   - Check browser console for any Clerk errors
   - Attempt to sign in with test account

**Files Modified:**
- `app/.env.local` (NEW)
- `.env.production` (UPDATE lines 14-15)

**Acceptance Criteria:**
- ✅ Valid Clerk keys configured locally and in production
- ✅ Clerk sign-in page loads without errors
- ✅ No "invalid API key" errors in console

---

### Issue 2: Re-enable Clerk Middleware 🔒

**Goal:** Restore Clerk middleware to protect routes requiring authentication

**Implementation:**

**File: `app/src/middleware.ts`**
```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Define public routes (accessible without authentication)
const isPublicRoute = createRouteMatcher([
  '/',                    // Landing page
  '/sign-in(.*)',        // Sign-in pages
  '/sign-up(.*)',        // Sign-up pages
  '/api/webhooks(.*)',   // Webhooks (Clerk, SendGrid, etc.)
])

// Define API routes that need authentication
const isApiRoute = createRouteMatcher([
  '/api/trpc(.*)',
  '/api/projects(.*)',
  '/api/budget(.*)',
  '/api/inngest(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  // Public routes - allow access
  if (isPublicRoute(request)) {
    return
  }

  // Protected routes - require authentication
  const { userId } = await auth()
  if (!userId) {
    // API routes return 401, pages redirect to sign-in
    if (isApiRoute(request)) {
      return new Response('Unauthorized', { status: 401 })
    }
    // Redirect to sign-in for protected pages
    return Response.redirect(new URL('/sign-in', request.url))
  }

  // Authenticated - allow access
  return
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}
```

**Reasoning:**
- Uses modern `clerkMiddleware` (v5+ API)
- Clear separation of public vs protected routes
- API routes get 401, pages get redirected
- Webhooks are public (they use signing secrets for security)
- All dashboard routes are protected by default

**Files Modified:**
- `app/src/middleware.ts` (REPLACE entire file)

**Acceptance Criteria:**
- ✅ Unauthenticated users redirected to `/sign-in` when accessing `/dashboard`
- ✅ Sign-in and sign-up pages remain accessible
- ✅ API routes return 401 when called without authentication
- ✅ Landing page (`/`) is public

---

### Issue 3: Create Clerk Webhook Handler 🪝

**Goal:** Handle `user.created`, `user.updated`, `user.deleted` events to sync with database

**Implementation:**

**File: `app/src/app/api/webhooks/clerk/route.ts` (NEW)**
```typescript
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
  const orgSlug = email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9-]/g, '-') ||
                  `org-${userId.slice(0, 8)}`
  const orgName = firstName && lastName
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
```

**Configuration Steps:**
1. Install Svix library:
   ```bash
   cd app && npm install svix
   ```

2. Add webhook secret to environment:
   - In Clerk Dashboard → Webhooks → Add Endpoint
   - URL: `https://app.openhorizon.cc/api/webhooks/clerk`
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`
   - Copy the "Signing Secret"
   - Add to `.env.local` and `.env.production`:
     ```
     CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
     ```

3. Update Cloud Run:
   ```bash
   gcloud run services update openhorizon-app \
     --update-env-vars CLERK_WEBHOOK_SECRET=whsec_xxx \
     --region=europe-west1
   ```

**Files Modified:**
- `app/src/app/api/webhooks/clerk/route.ts` (NEW)
- `app/.env.local` (ADD `CLERK_WEBHOOK_SECRET`)
- `.env.production` (ADD `CLERK_WEBHOOK_SECRET`)
- `app/package.json` (ADD `svix` dependency)

**Acceptance Criteria:**
- ✅ New user sign-up triggers `user.created` webhook
- ✅ Organization is created automatically
- ✅ User is added as OWNER of new organization
- ✅ Webhook logs show successful processing
- ✅ Database contains organization and membership records

---

### Issue 4: Update Server Context to Use Real Auth 🔐

**Goal:** Replace dummy user/org IDs with real Clerk authentication

**Implementation:**

**File: `app/src/server/context.ts`**
```typescript
import { auth } from '@clerk/nextjs/server'
import prisma from '@/lib/prisma'

export async function createContext() {
  // Get authenticated user from Clerk
  const { userId } = await auth()

  // If no user, return unauthenticated context
  if (!userId) {
    return {
      prisma,
      userId: null,
      orgId: null,
      user: null,
    }
  }

  // Get user's organization membership
  const membership = await prisma.userOrganizationMembership.findFirst({
    where: { userId },
    include: {
      organization: true,
    },
  })

  if (!membership) {
    console.warn(`⚠️  User ${userId} has no organization membership`)
    return {
      prisma,
      userId,
      orgId: null,
      user: null,
    }
  }

  return {
    prisma,
    userId,
    orgId: membership.organizationId,
    user: {
      id: userId,
      role: membership.role,
      organization: membership.organization,
    },
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
```

**Reasoning:**
- Uses real Clerk `auth()` instead of dummy values
- Looks up user's organization from database
- Returns `null` values if unauthenticated (for public routes)
- Provides user role and organization details to tRPC procedures

**Files Modified:**
- `app/src/server/context.ts` (REPLACE entire file)

**Acceptance Criteria:**
- ✅ Authenticated users get their real `userId` and `orgId`
- ✅ Unauthenticated API calls get `null` values
- ✅ tRPC procedures can access `ctx.userId` and `ctx.orgId`
- ✅ No hardcoded dummy IDs in context

---

### Issue 5: Add ClerkProvider to Root Layout 🎨

**Goal:** Wrap the app in `ClerkProvider` for Clerk hooks to work

**Implementation:**

**File: `app/src/app/layout.tsx`**
```typescript
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import { TRPCProvider } from '@/lib/trpc/Provider'
import { Toaster } from 'sonner'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Open Horizon Project Companion',
    template: '%s | Open Horizon',
  },
  description: 'AI-powered platform for creating and managing Erasmus+ Youth Exchange projects. Generate comprehensive project concepts, activity plans, and application materials.',
  keywords: ['Erasmus+', 'Youth Exchange', 'Project Management', 'AI Assistant', 'Education', 'Youth Work'],
  authors: [{ name: 'Open Horizon' }],
  openGraph: {
    title: 'Open Horizon Project Companion',
    description: 'AI-powered platform for Erasmus+ Youth Exchange projects',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Open Horizon Project Companion',
    description: 'AI-powered platform for Erasmus+ Youth Exchange projects',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          <TRPCProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
```

**Files Modified:**
- `app/src/app/layout.tsx` (ADD `ClerkProvider` wrapper)

**Acceptance Criteria:**
- ✅ `ClerkProvider` wraps entire app
- ✅ Clerk hooks (`useUser`, `useAuth`) work in components
- ✅ No console errors about Clerk provider missing

---

### Issue 6: Update Dashboard UI for Auth 👤

**Goal:** Remove "Auth Disabled" message, add user menu with sign-out

**Implementation:**

**File: `app/src/components/layout/Header.tsx`**
```typescript
'use client'

import { UserButton } from '@clerk/nextjs'
import { ContentModeToggle } from './ContentModeToggle'

export function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6 dark:bg-zinc-950">
      <div className="flex items-center gap-4">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Open Horizon Project Companion
        </span>
      </div>

      <div className="flex items-center gap-4">
        <ContentModeToggle />
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: 'w-8 h-8',
            },
          }}
        />
      </div>
    </header>
  )
}
```

**File: `app/src/app/(dashboard)/layout.tsx`**
```typescript
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6 dark:bg-zinc-900">
          {children}
        </main>
      </div>
    </div>
  )
}
```

**Files Modified:**
- `app/src/components/layout/Header.tsx` (ADD UserButton, REMOVE auth disabled message)
- `app/src/app/(dashboard)/layout.tsx` (REMOVE auth disabled comment)

**Acceptance Criteria:**
- ✅ User avatar/menu appears in header
- ✅ "Auth Disabled - Development Mode" message removed
- ✅ Clicking user menu shows sign-out option
- ✅ Sign-out redirects to `/sign-in`

---

### Issue 7: Add Error Handling and User Feedback ⚠️

**Goal:** Handle auth errors gracefully with user-friendly messages

**Implementation:**

**File: `app/src/app/error.tsx` (NEW)**
```typescript
'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  // Check if it's an auth error
  const isAuthError =
    error.message.includes('Unauthorized') ||
    error.message.includes('401') ||
    error.message.includes('Authentication')

  if (isAuthError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50">
        <div className="max-w-md rounded-lg border bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-2xl font-bold text-red-600">
            Authentication Required
          </h2>
          <p className="mb-6 text-zinc-700">
            Your session has expired or you're not authenticated. Please sign in again.
          </p>
          <button
            onClick={() => router.push('/sign-in')}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Go to Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="max-w-md rounded-lg border bg-white p-8 shadow-sm">
        <h2 className="mb-4 text-2xl font-bold text-red-600">
          Something Went Wrong
        </h2>
        <p className="mb-6 text-zinc-700">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Try Again
          </button>
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 rounded-md border border-zinc-300 px-4 py-2 text-zinc-700 hover:bg-zinc-50"
          >
            Go Home
          </button>
        </div>
      </div>
    </div>
  )
}
```

**File: `app/src/app/loading.tsx` (NEW)**
```typescript
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
        <p className="text-zinc-600">Loading...</p>
      </div>
    </div>
  )
}
```

**Update tRPC Error Handling:**

**File: `app/src/server/trpc.ts`**
Add auth error handling to tRPC procedures:
```typescript
// Add after imports
import { TRPCError } from '@trpc/server'

// Update procedure to check auth
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId, // Non-null assertion
    },
  })
})
```

**Files Modified:**
- `app/src/app/error.tsx` (NEW)
- `app/src/app/loading.tsx` (NEW)
- `app/src/server/trpc.ts` (ADD protectedProcedure)

**Acceptance Criteria:**
- ✅ Auth errors show user-friendly message
- ✅ Loading states during auth operations
- ✅ Network errors handled gracefully
- ✅ tRPC procedures throw proper auth errors

---

### Issue 8: Create E2E Tests for Authentication 🧪

**Goal:** Comprehensive Playwright tests for all auth flows

**Implementation:**

**File: `app/tests/e2e/auth-flow.spec.ts` (NEW)**
```typescript
import { test, expect } from '@playwright/test'

// Test configuration
const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
}

test.describe('Authentication Flow', () => {
  test.describe('Sign Up Flow', () => {
    test('should create new user and organization', async ({ page }) => {
      // Navigate to sign-up page
      await page.goto('/sign-up')

      // Fill sign-up form (Clerk's default form)
      const uniqueEmail = `test-${Date.now()}@example.com`
      await page.fill('input[name="emailAddress"]', uniqueEmail)
      await page.fill('input[name="password"]', TEST_USER.password)
      await page.click('button[type="submit"]')

      // Wait for email verification screen (or skip if test mode)
      // Note: In test mode, Clerk may auto-verify

      // Should redirect to onboarding or dashboard
      await expect(page).toHaveURL(/\/(onboarding|dashboard)/)

      // Verify user is authenticated (check for user menu)
      await expect(page.locator('[data-clerk-element="userButton"]')).toBeVisible()
    })

    test('should show error for duplicate email', async ({ page }) => {
      await page.goto('/sign-up')

      // Try to sign up with existing email
      await page.fill('input[name="emailAddress"]', TEST_USER.email)
      await page.fill('input[name="password"]', TEST_USER.password)
      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('text=/already exists|taken/')).toBeVisible()
    })

    test('should enforce password requirements', async ({ page }) => {
      await page.goto('/sign-up')

      await page.fill('input[name="emailAddress"]', 'newuser@example.com')
      await page.fill('input[name="password"]', '123') // Weak password
      await page.click('button[type="submit"]')

      // Should show password strength error
      await expect(page.locator('text=/password.*strong|weak/')).toBeVisible()
    })
  })

  test.describe('Sign In Flow', () => {
    test('should sign in existing user', async ({ page }) => {
      await page.goto('/sign-in')

      // Fill sign-in form
      await page.fill('input[name="identifier"]', TEST_USER.email)
      await page.fill('input[name="password"]', TEST_USER.password)
      await page.click('button[type="submit"]')

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/dashboard/)

      // Verify user is authenticated
      await expect(page.locator('[data-clerk-element="userButton"]')).toBeVisible()
    })

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/sign-in')

      await page.fill('input[name="identifier"]', 'invalid@example.com')
      await page.fill('input[name="password"]', 'wrongpassword')
      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('text=/incorrect|invalid|not found/i')).toBeVisible()
    })

    test('should remember session after page refresh', async ({ page }) => {
      // Sign in
      await page.goto('/sign-in')
      await page.fill('input[name="identifier"]', TEST_USER.email)
      await page.fill('input[name="password"]', TEST_USER.password)
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/\/dashboard/)

      // Refresh page
      await page.reload()

      // Should still be authenticated
      await expect(page).toHaveURL(/\/dashboard/)
      await expect(page.locator('[data-clerk-element="userButton"]')).toBeVisible()
    })
  })

  test.describe('Protected Routes', () => {
    test('should redirect unauthenticated users to sign-in', async ({ page }) => {
      // Try to access protected route without auth
      await page.goto('/dashboard')

      // Should redirect to sign-in
      await expect(page).toHaveURL(/\/sign-in/)
    })

    test('should allow authenticated users to access dashboard', async ({ page, context }) => {
      // Sign in first
      await page.goto('/sign-in')
      await page.fill('input[name="identifier"]', TEST_USER.email)
      await page.fill('input[name="password"]', TEST_USER.password)
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/\/dashboard/)

      // Try to access other protected routes
      await page.goto('/projects')
      await expect(page).toHaveURL('/projects')

      await page.goto('/pipeline/projects')
      await expect(page).toHaveURL('/pipeline/projects')
    })

    test('should return 401 for unauthenticated API calls', async ({ request }) => {
      // Try to call protected API without auth
      const response = await request.get('/api/trpc/projects.list')

      expect(response.status()).toBe(401)
    })
  })

  test.describe('Sign Out Flow', () => {
    test('should sign out user and redirect to sign-in', async ({ page }) => {
      // Sign in first
      await page.goto('/sign-in')
      await page.fill('input[name="identifier"]', TEST_USER.email)
      await page.fill('input[name="password"]', TEST_USER.password)
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/\/dashboard/)

      // Click user button
      await page.click('[data-clerk-element="userButton"]')

      // Click sign out
      await page.click('text=/sign out/i')

      // Should redirect to sign-in
      await expect(page).toHaveURL(/\/sign-in/)

      // Try to access protected route - should redirect
      await page.goto('/dashboard')
      await expect(page).toHaveURL(/\/sign-in/)
    })
  })

  test.describe('Organization Context', () => {
    test('should load organization for authenticated user', async ({ page }) => {
      // Sign in
      await page.goto('/sign-in')
      await page.fill('input[name="identifier"]', TEST_USER.email)
      await page.fill('input[name="password"]', TEST_USER.password)
      await page.click('button[type="submit"]')
      await expect(page).toHaveURL(/\/dashboard/)

      // Check that tRPC calls include organization context
      // This will be visible in data loaded on the page
      await page.goto('/projects')

      // Wait for projects to load (they should be filtered by org)
      await page.waitForSelector('[data-testid="projects-list"], text=/no projects/i')

      // No errors should be shown (org context is working)
      await expect(page.locator('text=/error|failed/i')).not.toBeVisible()
    })
  })
})
```

**Test Environment Setup:**

**File: `app/.env.test.local` (NEW)**
```bash
# Test user credentials for E2E tests
TEST_USER_EMAIL="test@openhorizon.cc"
TEST_USER_PASSWORD="TestPassword123!"

# Use test Clerk keys (create separate Clerk app for testing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxx"
CLERK_SECRET_KEY="sk_test_xxx"
CLERK_WEBHOOK_SECRET="whsec_test_xxx"

# Test database (optional - use same DB with test org isolation)
DATABASE_URL="postgresql://..."
```

**Update Playwright Config:**

**File: `app/playwright.config.ts`**
```typescript
import { defineConfig, devices } from '@playwright/test'
import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test.local' })

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

**Files Modified:**
- `app/tests/e2e/auth-flow.spec.ts` (NEW)
- `app/.env.test.local` (NEW)
- `app/playwright.config.ts` (UPDATE to load test env)
- `app/package.json` (ADD dotenv dev dependency)

**Run Tests:**
```bash
cd app
npm run test          # Run all tests
npm run test:ui       # Run with UI
npm run test:prod     # Test production deployment
```

**Acceptance Criteria:**
- ✅ All sign-up tests pass
- ✅ All sign-in tests pass
- ✅ Protected routes tests pass
- ✅ Sign-out tests pass
- ✅ Organization context tests pass
- ✅ Tests run in CI/CD pipeline

---

## Implementation Order

**Sequential Steps:**
1. ✅ Issue 1: Configure Clerk API Keys
2. ✅ Issue 3: Create Clerk Webhook Handler (before middleware, so org exists)
3. ✅ Issue 2: Re-enable Clerk Middleware
4. ✅ Issue 4: Update Server Context
5. ✅ Issue 5: Add ClerkProvider to Layout
6. ✅ Issue 6: Update Dashboard UI
7. ✅ Issue 7: Add Error Handling
8. ✅ Issue 8: Create E2E Tests

**Why This Order:**
- Keys first (nothing works without them)
- Webhook before middleware (so first user gets an org)
- Middleware after webhook (to protect routes)
- Context uses middleware's auth
- Provider enables UI components
- UI polish after core auth works
- Error handling throughout
- Tests last (validate everything works)

---

## Testing Strategy

### Local Testing Checklist
- [ ] Set up Clerk dev app with test keys
- [ ] Create test user account
- [ ] Test sign-up flow (new user → org creation)
- [ ] Test sign-in flow (existing user → correct org)
- [ ] Test protected route access
- [ ] Test API route authentication
- [ ] Test sign-out flow
- [ ] Verify webhook events in Clerk Dashboard
- [ ] Check database for organization records
- [ ] Run E2E test suite locally

### Production Testing Checklist
- [ ] Update Cloud Run env vars with prod keys
- [ ] Configure Clerk webhook for production URL
- [ ] Deploy with auth enabled
- [ ] Test sign-up with real email
- [ ] Verify webhook fires and creates org
- [ ] Test existing user sign-in
- [ ] Check Cloud Run logs for auth errors
- [ ] Run E2E tests against production
- [ ] Monitor error logs for 24 hours

---

## Rollback Plan

If authentication causes critical issues in production:

1. **Quick Disable (Emergency):**
   ```typescript
   // app/src/middleware.ts
   export function middleware(request: NextRequest) {
     return NextResponse.next() // Bypass all auth
   }
   ```

2. **Revert to Dummy Context:**
   ```typescript
   // app/src/server/context.ts
   return { userId: 'dev-user-001', orgId: '00000000-...' }
   ```

3. **Redeploy:**
   ```bash
   git revert HEAD && git push
   gcloud run deploy openhorizon-app --source=./app
   ```

4. **Investigate Logs:**
   ```bash
   gcloud logging read "resource.type=cloud_run_revision" --limit=100
   ```

---

## Success Metrics

### Acceptance Criteria (All Must Pass)
- ✅ Clerk middleware restored and working
- ✅ Sign-up creates user + organization automatically
- ✅ Sign-in works for existing users
- ✅ Protected routes require authentication
- ✅ Webhooks sync user data to database
- ✅ No 500 errors in production logs
- ✅ E2E tests pass for all auth flows
- ✅ User can sign out successfully
- ✅ Session persists across page refreshes
- ✅ API routes return 401 when unauthenticated

### Observability
- Monitor Cloud Run logs for auth errors
- Track Clerk webhook delivery success rate
- Monitor user sign-up funnel (Clerk Analytics)
- Alert on authentication failures spike

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Existing users locked out | Low | Critical | Test with existing accounts first |
| Webhook fails silently | Medium | High | Log all webhook events, monitor logs |
| Clerk API key invalid | Low | Critical | Validate keys before deploy |
| Organization not created | Medium | High | Add retry logic, alert on webhook failures |
| Performance degradation | Low | Medium | Clerk adds ~50ms latency (acceptable) |
| Session issues after deploy | Medium | Medium | Test session persistence thoroughly |

---

## Dependencies & Blockers

### External Dependencies
- ✅ Clerk account configured
- ✅ Valid API keys obtained
- ✅ Webhook endpoint accessible from Clerk
- ⚠️ Test user account for E2E tests (create in Issue 1)

### Internal Dependencies
- ✅ Prisma schema has Organization model
- ✅ Database accessible from Cloud Run
- ✅ @clerk/nextjs package installed

### Potential Blockers
- ❌ Clerk API rate limits (unlikely, free tier has 5k MAU)
- ❌ Webhook signing issues (test thoroughly in Issue 3)
- ❌ Cloud Run cold starts causing auth timeouts (monitor latency)

---

## Post-Implementation Tasks

After Epic 002 is complete:

1. **Documentation**
   - Update README with auth setup instructions
   - Document environment variables required
   - Add onboarding guide for new users

2. **Monitoring Setup**
   - Create Grafana dashboard for auth metrics
   - Set up alerts for auth failures
   - Monitor Clerk webhook delivery

3. **User Experience**
   - Add onboarding flow for new users
   - Implement organization switching (if multi-org support)
   - Add profile settings page

4. **Security Hardening**
   - Enable Clerk MFA (optional)
   - Configure session timeout policies
   - Review CORS settings for production

---

## Estimated Timeline

| Issue | Task | Estimated Time | Critical Path |
|-------|------|---------------|---------------|
| 1 | Configure Clerk Keys | 30 min | Yes |
| 2 | Re-enable Middleware | 1 hour | Yes |
| 3 | Webhook Handler | 2 hours | Yes |
| 4 | Update Context | 30 min | Yes |
| 5 | Add ClerkProvider | 15 min | Yes |
| 6 | Update Dashboard UI | 1 hour | No |
| 7 | Error Handling | 1 hour | No |
| 8 | E2E Tests | 3 hours | No |

**Total Estimated Time:** 9 hours
**Critical Path Time:** 4 hours
**Buffer Time:** 3 hours (for debugging, testing, unexpected issues)

**Realistic Completion:** 12 hours (1.5 working days)

---

## Next Steps

1. **Get approval** for this plan
2. **Create Clerk account** and obtain API keys
3. **Start with Issue 1** (keys must be first)
4. **Implement sequentially** as outlined above
5. **Test thoroughly** after each issue
6. **Deploy to production** after all tests pass
7. **Monitor for 24 hours** after deploy

---

## Questions / Clarifications Needed

1. **Clerk Account:** Do we already have a Clerk account, or do we need to create one?
2. **Test User:** Should we create a dedicated test user for E2E tests, or use a real account?
3. **Multi-Org Support:** Is one user = one org sufficient for MVP, or do we need users to belong to multiple orgs?
4. **Onboarding:** After sign-up, should users go to onboarding page or directly to dashboard?
5. **Email Verification:** Should we require email verification, or skip for MVP?

---

**Plan Status:** ✅ Ready for Implementation
**Estimated Completion:** 12 hours from start
**Blockers:** None
**Risks:** Low - Medium (manageable with testing)

**Let's ship this! 🚀**
