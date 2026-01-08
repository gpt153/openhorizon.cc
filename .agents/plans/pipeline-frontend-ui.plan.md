# Plan: Pipeline Management Frontend UI

## Summary

Build the frontend user interface for the pipeline management system that integrates with the already-deployed tRPC backend (45+ procedures across 5 routers). The UI will enable users to manage Erasmus+ projects from creation through vendor coordination to profit tracking, following existing Next.js 15 App Router patterns. Core features: pipeline projects list, project detail with phases, phase detail with AI chat placeholder, and profit dashboard showing accumulated earnings across all projects.

## Intent

Enable users to visually manage their Erasmus+ business pipeline, calculating grant income vs vendor costs to assess project profitability before submission. The February 2026 deadline requires 5-10 applications, so the UI must streamline project management and provide clear profit visibility to prioritize high-margin opportunities.

## Persona

**Solo Entrepreneur** building Erasmus+ service business:
- Submits applications for other organizations
- Executes approved projects for profit
- Needs to assess viability before applying (grant income vs actual costs)
- Wants to track accumulated profit across all projects
- Must generate 5-10 applications by February 12, 2026 (35 days)

## UX

### Before Implementation

```
User navigates to /projects → sees existing "ideation" projects
No way to:
- See pipeline projects (vendor coordination stage)
- View Erasmus+ grant calculations
- Track vendor quotes and costs
- Calculate profit margins
- See accumulated profit across all projects
```

### After Implementation

```
┌─────────────────────────────────────────────────────────────┐
│ [Sidebar]                                                    │
│  - Dashboard                                                 │
│  - Projects          ← Existing (ideation)                   │
│  - Pipeline Projects ← NEW (vendor coordination)             │
│  - Profit Dashboard  ← NEW (accumulated earnings)            │
│  - Brainstorm                                                │
│  - Seeds                                                     │
└─────────────────────────────────────────────────────────────┘

Flow 1: View Pipeline Projects
─────────────────────────────
User clicks "Pipeline Projects" in sidebar
→ /pipeline/projects page loads
→ Grid of PipelineProject cards showing:
  - Project name, location, dates
  - Participant count, duration
  - Erasmus+ grant amount (if calculated)
  - Profit margin badge (color-coded: green >30%, yellow 15-30%, red <15%)
  - Status badge (PLANNING, VENDOR_RESEARCH, etc.)
→ Click "+ New Project" → Create dialog
→ Click project card → Navigate to detail

Flow 2: Project Detail with Phases
───────────────────────────────────
User navigates to /pipeline/projects/[id]
→ Header shows:
  - Project name, location, dates
  - "Calculate Grant" button (if not calculated)
  - Erasmus+ grant amount (if calculated)
  - Total estimated costs (sum of phase budgets)
  - Profit margin (Grant - Costs) with color-coded badge
→ 6 Phase cards in grid:
  - ACCOMMODATION (40% budget): €8,000 / €10,000
  - TRAVEL (25% budget): €5,000 / €6,250
  - FOOD (20% budget): €4,000 / €5,000
  - ACTIVITIES (10% budget): €2,000 / €2,500
  - INSURANCE (3% budget): €600 / €750
  - EMERGENCY (2% budget): €400 / €500
→ Each phase card shows:
  - Phase type icon
  - Budget allocated vs spent
  - Progress bar
  - Quote count (3 quotes received)
  - Status badge
→ Click phase card → Navigate to phase detail

Flow 3: Phase Detail with AI Chat (Placeholder)
────────────────────────────────────────────────
User navigates to /pipeline/projects/[id]/phases/[phaseId]
→ Split view:
  LEFT: Phase management
    - Phase info (budget, status, dates)
    - Vendor quote cards (3 cards)
      - Vendor name, quote amount
      - "Accept" / "Reject" buttons
      - Status: PENDING, ACCEPTED, REJECTED
    - "+ Request Quote" button (triggers email workflow - not implemented)
  RIGHT: AI Chat (Placeholder)
    - Chat interface UI components
    - Placeholder message: "AI agent integration coming soon"
    - Chat history display (empty)
    - Input box (disabled)
→ User accepts quote → Budget updates, toast notification

Flow 4: Profit Dashboard
────────────────────────
User navigates to /dashboard/profit
→ Header cards (3 metrics):
  - Total Grants: €185,000 (sum of all calculated grants)
  - Total Costs: €135,000 (sum of all accepted quotes)
  - Accumulated Profit: €50,000 (27% margin)
→ Project list table:
  | Project Name      | Grant    | Costs    | Profit   | Margin | Status    |
  |-------------------|----------|----------|----------|--------|-----------|
  | Barcelona Youth   | €18,500  | €12,000  | €6,500   | 35%    | PLANNING  |
  | Rome Exchange     | €22,000  | €15,000  | €7,000   | 32%    | SUBMITTED |
  | Paris Workshop    | €15,000  | €12,500  | €2,500   | 17%    | DRAFT     |
→ Filter by status, sort by margin
→ Click project → Navigate to project detail
```

## External Research

### Documentation

#### Next.js 15 App Router
- [Next.js App Router Documentation](https://nextjs.org/docs/app) - Official guide
  - Key sections: File-based routing, Server/Client Components, Loading UI
- [Next.js 15 Best Practices 2025](https://medium.com/better-dev-nextjs-react/inside-the-app-router-best-practices-for-next-js-file-and-directory-structure-2025-edition-ed6bc14a8da3)
  - File organization: Feature-based folders, colocated components
  - Server-first approach: Default to Server Components, use 'use client' only when needed

#### tRPC React Query Integration
- [tRPC Next.js Integration](https://trpc.io/docs/client/nextjs) - Official tRPC docs
  - Key patterns: createTRPCReact, useQuery/useMutation hooks, useUtils for cache invalidation
- [tRPC with Next.js 15 App Router](https://www.wisp.blog/blog/how-to-use-trpc-with-nextjs-15-app-router)
  - Server Components: Use createCaller for direct procedure calls
  - Client Components: Use React Query hooks
  - Prefetching: HydrateClient for SSR data

#### Dashboard UI Components
- [Tailwind CSS Dashboard Components](https://tailgrids.com/dashboard-components)
  - Stat cards, tables, progress bars, badges
- [Radix UI Components](https://www.radix-ui.com/)
  - Already installed: Card, Button, Dialog, Badge, Tabs, Separator
  - Accessible by default, unstyled primitives

### Gotchas & Best Practices

**Next.js 15 App Router:**
- Always use `'use client'` directive for components with React hooks (useState, useEffect, tRPC hooks)
- Use `use()` unwrap for async params in dynamic routes (`params: Promise<{ id: string }>`)
- Loading states: Create `loading.tsx` files or inline loading UI with Suspense

**tRPC React Query:**
- Must call hooks inside Client Components (`'use client'`)
- Use `trpc.useUtils()` for cache invalidation after mutations
- Optimistic updates: Use `onMutate` to update cache before server response
- Error handling: Use `onError` callback in mutations for toast notifications

**Dashboard UI:**
- Use grid layouts for responsive cards (`grid gap-6 md:grid-cols-2 lg:grid-cols-3`)
- Color-code profit margins: green (>30%), yellow (15-30%), red (<15%)
- Show skeleton loaders during data fetching
- Empty states for new users with clear CTAs

**Performance:**
- Prefetch data in Server Components when possible
- Use React Query staleTime to reduce refetches
- Debounce search inputs (if adding filters later)

## Patterns to Mirror

### Pattern 1: Page Structure with tRPC Query

**FROM:** `app/src/app/(dashboard)/projects/page.tsx:1-51`

```typescript
'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { ProjectCardSkeleton } from '@/components/projects/ProjectCardSkeleton'
import { EmptyState } from '@/components/projects/EmptyState'
import { trpc } from '@/lib/trpc/client'
import { Plus } from 'lucide-react'

export default function ProjectsPage() {
  const { data: projects, isLoading } = trpc.projects.list.useQuery()

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage your Erasmus+ Youth Exchange projects
          </p>
        </div>

        <Button asChild>
          <Link href="/projects/new">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project: any) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
```

**Key Patterns:**
- `'use client'` at top for React hooks
- `trpc.[router].[procedure].useQuery()` for data fetching
- `isLoading` state with skeleton loaders
- Empty state handling
- Grid layout with responsive columns
- Header with title, description, and CTA button
- Lucide icons (`Plus`)

### Pattern 2: Detail Page with Mutations and Cache Invalidation

**FROM:** `app/src/app/(dashboard)/projects/[id]/page.tsx:26-107`

```typescript
'use client'

import { use, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'
import { Loader2, ArrowLeft, Calendar, Users } from 'lucide-react'
import { toast } from 'sonner'

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: project, isLoading, error } = trpc.projects.getById.useQuery({ id })

  // tRPC utils - must be declared before mutations that use it
  const utils = trpc.useUtils()

  const updateMutation = trpc.projects.updateProject.useMutation({
    onSuccess: () => {
      utils.projects.getById.invalidate({ id })
      toast.success('Project updated successfully')
    },
    onError: (error) => {
      toast.error(`Failed to update project: ${error.message}`)
    },
  })

  const deleteMutation = trpc.projects.deleteProject.useMutation({
    onSuccess: () => {
      toast.success('Project deleted successfully')
      router.push('/projects')
    },
    onError: (error) => {
      toast.error(`Failed to delete project: ${error.message}`)
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-zinc-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-4 text-xl font-semibold">Error loading project</h2>
          <p className="mt-2 text-sm text-zinc-600">{error.message}</p>
          <Button onClick={() => router.back()} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <p className="mt-2 text-sm text-zinc-600">The project you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  // ... rest of component
}
```

**Key Patterns:**
- `use(params)` to unwrap async params in Next.js 15
- `trpc.useUtils()` for cache invalidation
- `.useMutation()` with `onSuccess` and `onError` callbacks
- `toast.success()` / `toast.error()` for user feedback
- Loading state with centered spinner
- Error state with error message and back button
- Not found state

### Pattern 3: Card Component with Link

**FROM:** `app/src/components/projects/ProjectCard.tsx:8-70`

```typescript
'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users } from 'lucide-react'

type Project = {
  id: string
  title: string
  tagline: string | null
  status: string
  participantCount: number
  durationDays: number
  createdAt: Date
}

export function ProjectCard({ project }: { project: Project }) {
  const statusColors = {
    DRAFT: 'bg-zinc-100 text-zinc-700',
    CONCEPT: 'bg-blue-100 text-blue-700',
    PLANNING: 'bg-purple-100 text-purple-700',
    APPROVED: 'bg-green-100 text-green-700',
  }

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold leading-tight">{project.title}</h3>
              {project.tagline && (
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2">
                  {project.tagline}
                </p>
              )}
            </div>
            <Badge
              className={statusColors[project.status as keyof typeof statusColors] || 'bg-zinc-100 text-zinc-700'}
            >
              {project.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{project.participantCount} participants</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{project.durationDays} days</span>
            </div>
          </div>

          <div className="mt-3 text-xs text-zinc-500">
            Created {new Date(project.createdAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

**Key Patterns:**
- Wrap entire Card in Link for clickable area
- TypeScript type definition for props
- Status colors mapping object
- Conditional rendering with `&&`
- Icon + text pattern for metadata
- Hover effect with Tailwind (`hover:shadow-md`)
- Date formatting with `toLocaleDateString()`

### Pattern 4: Sidebar Navigation

**FROM:** `app/src/components/layout/Sidebar.tsx:8-61`

```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { FolderKanban, Settings, Home, Sparkles, Sprout } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Brainstorm', href: '/brainstorm', icon: Sparkles },
  { name: 'Seed Garden', href: '/seeds', icon: Sprout },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-full w-64 flex-col border-r bg-zinc-50 dark:bg-zinc-900">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <span className="text-sm font-bold text-white">OH</span>
          </div>
          <span className="text-lg font-semibold">Open Horizon</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
```

**Key Patterns:**
- `usePathname()` hook for active link detection
- Navigation array with name, href, icon
- `cn()` utility for conditional classes
- Active state: Check if pathname matches href or starts with href
- Icon component rendering: `<item.icon className="h-5 w-5" />`

### Pattern 5: tRPC Provider Setup

**FROM:** `app/src/lib/trpc/Provider.tsx:1-33`

```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import { trpc } from './client'

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
```

**Key Patterns:**
- Already set up, no changes needed
- Uses `superjson` for Date serialization
- `httpBatchLink` for request batching
- Wraps app in `app/layout.tsx`

### Pattern 6: Playwright E2E Tests

**FROM:** `app/tests/critical-issues.spec.ts:1-50`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Basic Page Tests', () => {
  test('page should load without errors', async ({ page }) => {
    await page.goto('http://localhost:3000/projects');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for main heading
    await expect(page.locator('h1')).toContainText('Projects');

    // Check for content (not stuck in loading)
    const hasLoadingSpinner = await page.locator('.animate-spin').count();
    expect(hasLoadingSpinner).toBe(0);

    // Take screenshot for manual verification
    await page.screenshot({ path: 'test-results/projects-page.png', fullPage: true });
  });

  test('should navigate to detail page', async ({ page }) => {
    await page.goto('http://localhost:3000/projects');
    await page.waitForLoadState('networkidle');

    // Click first project card
    const firstCard = page.locator('a[href^="/projects/"]').first();
    await firstCard.click();

    // Should navigate to detail page
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/projects\/[a-f0-9-]+/);

    // Check for detail page elements
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

**Key Patterns:**
- `page.goto()` to navigate
- `page.waitForLoadState('networkidle')` to wait for page load
- `expect(page.locator()).toContainText()` for assertions
- `page.screenshot()` for debugging
- Test navigation flows

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `app/src/components/layout/Sidebar.tsx` | UPDATE | Add navigation links for "Pipeline Projects" and "Profit Dashboard" |
| `app/src/app/(dashboard)/pipeline/projects/page.tsx` | CREATE | Pipeline projects list page with grid of project cards |
| `app/src/app/(dashboard)/pipeline/projects/[id]/page.tsx` | CREATE | Pipeline project detail page with phases grid |
| `app/src/app/(dashboard)/pipeline/projects/[id]/phases/[phaseId]/page.tsx` | CREATE | Phase detail page with vendor quotes and AI chat placeholder |
| `app/src/app/(dashboard)/dashboard/profit/page.tsx` | CREATE | Profit dashboard with summary cards and project table |
| `app/src/components/pipeline/PipelineProjectCard.tsx` | CREATE | Card component for pipeline project display |
| `app/src/components/pipeline/PipelineProjectCardSkeleton.tsx` | CREATE | Skeleton loader for pipeline project cards |
| `app/src/components/pipeline/PipelineProjectEmptyState.tsx` | CREATE | Empty state for pipeline projects list |
| `app/src/components/pipeline/CreateProjectDialog.tsx` | CREATE | Dialog for creating new pipeline projects |
| `app/src/components/pipeline/PhaseCard.tsx` | CREATE | Card component for phase display in project detail |
| `app/src/components/pipeline/QuoteCard.tsx` | CREATE | Card component for vendor quote display |
| `app/src/components/pipeline/ChatPlaceholder.tsx` | CREATE | Placeholder UI for AI chat integration |
| `app/src/components/profit/ProfitSummaryCard.tsx` | CREATE | Summary card component for profit dashboard metrics |
| `app/src/components/profit/ProjectProfitTable.tsx` | CREATE | Table component for project profit list |
| `app/tests/pipeline-ui.spec.ts` | CREATE | Playwright E2E tests for pipeline pages |

**Total:** 15 files (1 update, 14 creates)

## NOT Building

- ❌ **AI Agent Implementations** - Placeholder UI only, no actual AI chat logic
- ❌ **Email Sending** - Resend API integration deferred, UI shows "Send" button but disabled
- ❌ **Application Generator** - PDF/DOCX export not included in this phase
- ❌ **Vendor Directory** - Full CRUD for vendors deferred, only display in quotes
- ❌ **Advanced Filtering** - Search/filter on lists can be added later
- ❌ **Real-time Updates** - No websockets or polling, manual refetch only
- ❌ **Mobile Optimization** - Basic responsive design, no native-like UX
- ❌ **Dark Mode** - Tailwind dark: classes already in place, but not fully tested
- ❌ **Accessibility Audits** - Radix UI is accessible by default, but no WCAG audit
- ❌ **Animations** - No complex transitions, keep it fast and simple

## Tasks

### Task 1: Update Sidebar Navigation

**Why**: Users need navigation links to access new pipeline and profit pages.

**Mirror**: `app/src/components/layout/Sidebar.tsx:8-14`

**Do**:
```typescript
// Add to navigation array after line 13:
const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Pipeline Projects', href: '/pipeline/projects', icon: Workflow }, // NEW
  { name: 'Profit Dashboard', href: '/dashboard/profit', icon: TrendingUp }, // NEW
  { name: 'Brainstorm', href: '/brainstorm', icon: Sparkles },
  { name: 'Seed Garden', href: '/seeds', icon: Sprout },
  { name: 'Settings', href: '/settings', icon: Settings },
]

// Add imports at top:
import { FolderKanban, Settings, Home, Sparkles, Sprout, Workflow, TrendingUp } from 'lucide-react'
```

**Don't**:
- Don't change existing navigation items
- Don't add nested navigation (keep flat list)
- Don't add dropdown menus (keep simple)

**Verify**: `npm run dev`, navigate to http://localhost:3000, check sidebar shows new links

---

### Task 2: Create PipelineProjectCard Component

**Why**: Display pipeline projects in grid layout with key metrics (grant, profit, status).

**Mirror**: `app/src/components/projects/ProjectCard.tsx:8-70`

**Do**:
Create `app/src/components/pipeline/PipelineProjectCard.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Users, TrendingUp, MapPin } from 'lucide-react'

type PipelineProject = {
  id: string
  name: string
  location: string
  startDate: Date
  endDate: Date
  participantCount: number
  erasmusGrantCalculated: number | null
  estimatedTotalCost: number | null
  profitMargin: number | null
  status: string
}

export function PipelineProjectCard({ project }: { project: PipelineProject }) {
  const statusColors = {
    DRAFT: 'bg-zinc-100 text-zinc-700',
    PLANNING: 'bg-blue-100 text-blue-700',
    VENDOR_RESEARCH: 'bg-purple-100 text-purple-700',
    QUOTES_PENDING: 'bg-yellow-100 text-yellow-700',
    READY_TO_SUBMIT: 'bg-green-100 text-green-700',
    SUBMITTED: 'bg-orange-100 text-orange-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
  }

  // Profit margin color coding
  const getProfitBadgeColor = (margin: number | null) => {
    if (!margin) return 'bg-zinc-100 text-zinc-700'
    if (margin >= 30) return 'bg-green-100 text-green-700'
    if (margin >= 15) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const durationDays = Math.ceil((project.endDate.getTime() - project.startDate.getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Link href={`/pipeline/projects/${project.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold leading-tight">{project.name}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400 flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {project.location}
              </p>
            </div>
            <Badge
              className={statusColors[project.status as keyof typeof statusColors] || 'bg-zinc-100 text-zinc-700'}
            >
              {project.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Metrics */}
            <div className="flex items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{project.participantCount}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>{durationDays}d</span>
              </div>
            </div>

            {/* Financial Info */}
            {project.erasmusGrantCalculated && (
              <div className="space-y-1 border-t pt-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-600">Grant:</span>
                  <span className="font-medium">€{project.erasmusGrantCalculated.toLocaleString()}</span>
                </div>
                {project.estimatedTotalCost && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-600">Costs:</span>
                      <span className="font-medium">€{project.estimatedTotalCost.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-zinc-600">Profit:</span>
                      <Badge className={getProfitBadgeColor(project.profitMargin)}>
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {project.profitMargin}%
                      </Badge>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

**Don't**:
- Don't fetch data in the component (data comes from parent via props)
- Don't add click handlers (Link wrapper handles navigation)
- Don't show AI chat here (phase detail only)

**Verify**: Component compiles without errors (`npx tsc --noEmit`)

---

### Task 3: Create Skeleton and Empty State Components

**Why**: Provide loading and empty states for pipeline projects list.

**Mirror**: `app/src/components/projects/ProjectCardSkeleton.tsx` and `app/src/components/projects/EmptyState.tsx`

**Do**:

Create `app/src/components/pipeline/PipelineProjectCardSkeleton.tsx`:
```typescript
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function PipelineProjectCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-zinc-200" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex gap-4">
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-20 animate-pulse rounded bg-zinc-200" />
          </div>
          <div className="h-px bg-zinc-200" />
          <div className="space-y-2">
            <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
            <div className="h-4 w-full animate-pulse rounded bg-zinc-200" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

Create `app/src/components/pipeline/PipelineProjectEmptyState.tsx`:
```typescript
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Workflow } from 'lucide-react'

export function PipelineProjectEmptyState() {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 p-12 text-center">
      <Workflow className="h-12 w-12 text-zinc-400" />
      <h3 className="mt-4 text-lg font-semibold">No pipeline projects yet</h3>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Create your first pipeline project to start managing vendors and calculating profit margins.
      </p>
      <Button asChild className="mt-6">
        <Link href="/pipeline/projects?create=true">Create Pipeline Project</Link>
      </Button>
    </div>
  )
}
```

**Don't**:
- Don't add complex animations (simple pulse is enough)
- Don't make skeleton too detailed (approximate structure only)

**Verify**: Components compile without errors

---

### Task 4: Create Pipeline Projects List Page

**Why**: Main entry point for viewing all pipeline projects.

**Mirror**: `app/src/app/(dashboard)/projects/page.tsx:1-51`

**Do**:

Create `app/src/app/(dashboard)/pipeline/projects/page.tsx`:
```typescript
'use client'

import { Button } from '@/components/ui/button'
import { PipelineProjectCard } from '@/components/pipeline/PipelineProjectCard'
import { PipelineProjectCardSkeleton } from '@/components/pipeline/PipelineProjectCardSkeleton'
import { PipelineProjectEmptyState } from '@/components/pipeline/PipelineProjectEmptyState'
import { trpc } from '@/lib/trpc/client'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { CreateProjectDialog } from '@/components/pipeline/CreateProjectDialog'

export default function PipelineProjectsPage() {
  const { data: projects, isLoading } = trpc.pipeline.projects.list.useQuery()
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Pipeline Projects</h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Manage vendor coordination and track profit margins for your Erasmus+ projects
          </p>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Pipeline Project
        </Button>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <PipelineProjectCardSkeleton key={i} />
          ))}
        </div>
      ) : !projects || projects.length === 0 ? (
        <PipelineProjectEmptyState />
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <PipelineProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <CreateProjectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
    </div>
  )
}
```

**Don't**:
- Don't add filters/search yet (can add later if needed)
- Don't fetch data in useEffect (use tRPC hook)
- Don't add pagination (show all projects for now)

**Verify**: `npm run dev`, navigate to http://localhost:3000/pipeline/projects, page loads

---

### Task 5: Create Project Creation Dialog

**Why**: Allow users to create new pipeline projects with form validation.

**Mirror**: `app/src/app/(dashboard)/projects/[id]/page.tsx:227-268` (Edit Title Dialog pattern)

**Do**:

Create `app/src/components/pipeline/CreateProjectDialog.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

type CreateProjectDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateProjectDialog({ open, onOpenChange }: CreateProjectDialogProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [participantCount, setParticipantCount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const utils = trpc.useUtils()

  const createMutation = trpc.pipeline.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success('Pipeline project created successfully')
      utils.pipeline.projects.list.invalidate()
      onOpenChange(false)
      resetForm()
      router.push(`/pipeline/projects/${data.id}`)
    },
    onError: (error) => {
      toast.error(`Failed to create project: ${error.message}`)
    },
  })

  const resetForm = () => {
    setName('')
    setLocation('')
    setParticipantCount('')
    setStartDate('')
    setEndDate('')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!name.trim() || !location.trim() || !participantCount || !startDate || !endDate) {
      toast.error('Please fill in all required fields')
      return
    }

    const participants = parseInt(participantCount, 10)
    if (isNaN(participants) || participants < 1) {
      toast.error('Participant count must be a positive number')
      return
    }

    createMutation.mutate({
      name: name.trim(),
      location: location.trim(),
      participantCount: participants,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      type: 'YOUTH_EXCHANGE',
      status: 'DRAFT',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Pipeline Project</DialogTitle>
          <DialogDescription>
            Enter basic details to create a new pipeline project for vendor coordination
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Barcelona Youth Exchange 2026"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Barcelona, Spain"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="participants">Participant Count *</Label>
              <Input
                id="participants"
                type="number"
                min="1"
                value={participantCount}
                onChange={(e) => setParticipantCount(e.target.value)}
                placeholder="20"
                className="mt-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="endDate">End Date *</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**Don't**:
- Don't use react-hook-form (keep simple for now)
- Don't add country selector (use text input)
- Don't add project type selection (default to YOUTH_EXCHANGE)

**Verify**:
```bash
npm run dev
# Navigate to http://localhost:3000/pipeline/projects
# Click "New Pipeline Project"
# Fill form and submit
# Should create project and navigate to detail page
```

---

### Task 6: Create PhaseCard Component

**Why**: Display phases in project detail page with budget progress and quote count.

**Mirror**: `app/src/components/projects/ProjectCard.tsx:8-70` (card structure)

**Do**:

Create `app/src/components/pipeline/PhaseCard.tsx`:
```typescript
'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Home, Plane, UtensilsCrossed, PartyPopper, Shield, AlertTriangle } from 'lucide-react'

const phaseIcons = {
  ACCOMMODATION: Home,
  TRAVEL: Plane,
  FOOD: UtensilsCrossed,
  ACTIVITIES: PartyPopper,
  INSURANCE: Shield,
  EMERGENCY: AlertTriangle,
}

type PhaseCardProps = {
  projectId: string
  phase: {
    id: string
    type: string
    budgetAllocated: number
    budgetSpent: number
    status: string
    _count?: {
      quotes: number
    }
  }
}

export function PhaseCard({ projectId, phase }: PhaseCardProps) {
  const Icon = phaseIcons[phase.type as keyof typeof phaseIcons]
  const progressPercent = phase.budgetAllocated > 0
    ? Math.min((phase.budgetSpent / phase.budgetAllocated) * 100, 100)
    : 0

  const statusColors = {
    DRAFT: 'bg-zinc-100 text-zinc-700',
    RESEARCHING: 'bg-blue-100 text-blue-700',
    QUOTES_REQUESTED: 'bg-purple-100 text-purple-700',
    QUOTES_RECEIVED: 'bg-yellow-100 text-yellow-700',
    VENDOR_SELECTED: 'bg-green-100 text-green-700',
  }

  return (
    <Link href={`/pipeline/projects/${projectId}/phases/${phase.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              {Icon && <Icon className="h-5 w-5 text-blue-600" />}
              <h3 className="font-semibold">{phase.type}</h3>
            </div>
            <Badge
              className={statusColors[phase.status as keyof typeof statusColors] || 'bg-zinc-100 text-zinc-700'}
            >
              {phase.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            {/* Budget */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-zinc-600">Budget</span>
                <span className="font-medium">
                  €{phase.budgetSpent.toLocaleString()} / €{phase.budgetAllocated.toLocaleString()}
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>

            {/* Quote Count */}
            {phase._count && (
              <div className="flex justify-between text-sm">
                <span className="text-zinc-600">Quotes</span>
                <span className="font-medium">{phase._count.quotes} received</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
```

**Don't**:
- Don't fetch phase data in component (comes from parent)
- Don't add edit functionality here (detail page handles that)
- Don't show AI chat here (phase detail only)

**Verify**: Component compiles without errors

---

### Task 7: Create Pipeline Project Detail Page

**Why**: Show project details with grant calculation and phases grid.

**Mirror**: `app/src/app/(dashboard)/projects/[id]/page.tsx:26-463`

**Do**:

Create `app/src/app/(dashboard)/pipeline/projects/[id]/page.tsx`:
```typescript
'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc/client'
import { Loader2, ArrowLeft, Calendar, Users, MapPin, TrendingUp, Calculator } from 'lucide-react'
import { toast } from 'sonner'
import { PhaseCard } from '@/components/pipeline/PhaseCard'

export default function PipelineProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: project, isLoading, error } = trpc.pipeline.projects.getById.useQuery({ id })

  const utils = trpc.useUtils()

  const calculateGrantMutation = trpc.pipeline.projects.calculateGrant.useMutation({
    onSuccess: () => {
      toast.success('Erasmus+ grant calculated successfully')
      utils.pipeline.projects.getById.invalidate({ id })
    },
    onError: (error) => {
      toast.error(`Failed to calculate grant: ${error.message}`)
    },
  })

  const createDefaultPhasesMutation = trpc.pipeline.phases.createDefaultPhases.useMutation({
    onSuccess: () => {
      toast.success('Default phases created successfully')
      utils.pipeline.projects.getById.invalidate({ id })
    },
    onError: (error) => {
      toast.error(`Failed to create phases: ${error.message}`)
    },
  })

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-zinc-600">Loading project...</p>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold">Project not found</h2>
          <p className="mt-2 text-sm text-zinc-600">The project you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  const durationDays = Math.ceil(
    (new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24)
  )

  const profitAmount = project.erasmusGrantCalculated && project.estimatedTotalCost
    ? project.erasmusGrantCalculated - project.estimatedTotalCost
    : null

  const getProfitColor = (margin: number | null) => {
    if (!margin) return 'text-zinc-600'
    if (margin >= 30) return 'text-green-600'
    if (margin >= 15) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Pipeline Projects
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <div className="mt-2 flex items-center gap-4 text-zinc-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{project.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <Badge>{project.status}</Badge>
        </div>
      </div>

      {/* Financial Summary */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Financial Overview</CardTitle>
            {!project.erasmusGrantCalculated && (
              <Button
                size="sm"
                onClick={() => calculateGrantMutation.mutate({ id })}
                disabled={calculateGrantMutation.isPending}
              >
                {calculateGrantMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Calculator className="mr-2 h-4 w-4" />
                )}
                Calculate Grant
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <p className="text-sm text-zinc-600">Erasmus+ Grant</p>
              <p className="text-2xl font-bold">
                {project.erasmusGrantCalculated
                  ? `€${project.erasmusGrantCalculated.toLocaleString()}`
                  : 'Not calculated'}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">Estimated Costs</p>
              <p className="text-2xl font-bold">
                {project.estimatedTotalCost
                  ? `€${project.estimatedTotalCost.toLocaleString()}`
                  : '€0'}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-600">Profit Margin</p>
              <p className={`text-2xl font-bold ${getProfitColor(project.profitMargin)}`}>
                {project.profitMargin
                  ? `${project.profitMargin}% (€${profitAmount?.toLocaleString()})`
                  : 'TBD'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Participants</p>
                <p className="text-2xl font-bold">{project.participantCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Duration</p>
                <p className="text-2xl font-bold">{durationDays} days</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-zinc-500" />
              <div>
                <p className="text-sm font-medium">Project Type</p>
                <p className="text-lg font-bold">{project.type}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phases */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Project Phases</h2>
          {(!project.phases || project.phases.length === 0) && (
            <Button
              size="sm"
              onClick={() => createDefaultPhasesMutation.mutate({ projectId: id })}
              disabled={createDefaultPhasesMutation.isPending}
            >
              {createDefaultPhasesMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Create Default Phases'
              )}
            </Button>
          )}
        </div>

        {!project.phases || project.phases.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-zinc-600">No phases yet. Create default phases to get started.</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {project.phases.map((phase) => (
              <PhaseCard key={phase.id} projectId={project.id} phase={phase} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
```

**Don't**:
- Don't add edit/delete functionality yet (can add later)
- Don't fetch grant calculation automatically (user triggers with button)
- Don't show communication history here (phase detail only)

**Verify**:
```bash
npm run dev
# Navigate to http://localhost:3000/pipeline/projects
# Create a project (if none exist)
# Click project card
# Should see detail page with overview and phases
# Click "Calculate Grant" button
# Should show grant amount
```

---

### Task 8: Create QuoteCard Component

**Why**: Display vendor quotes with accept/reject actions.

**Mirror**: `app/src/components/projects/ProjectCard.tsx:8-70` (card structure)

**Do**:

Create `app/src/components/pipeline/QuoteCard.tsx`:
```typescript
'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { Check, X, Loader2 } from 'lucide-react'

type QuoteCardProps = {
  projectId: string
  phaseId: string
  quote: {
    id: string
    amount: number
    notes: string | null
    status: string
    vendor: {
      id: string
      name: string
      email: string
    }
  }
}

export function QuoteCard({ projectId, phaseId, quote }: QuoteCardProps) {
  const utils = trpc.useUtils()

  const acceptMutation = trpc.pipeline.quotes.accept.useMutation({
    onSuccess: () => {
      toast.success('Quote accepted')
      utils.pipeline.projects.getById.invalidate({ id: projectId })
    },
    onError: (error) => {
      toast.error(`Failed to accept quote: ${error.message}`)
    },
  })

  const rejectMutation = trpc.pipeline.quotes.reject.useMutation({
    onSuccess: () => {
      toast.success('Quote rejected')
      utils.pipeline.projects.getById.invalidate({ id: projectId })
    },
    onError: (error) => {
      toast.error(`Failed to reject quote: ${error.message}`)
    },
  })

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  }

  const isPending = quote.status === 'PENDING'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h4 className="font-semibold">{quote.vendor.name}</h4>
            <p className="text-sm text-zinc-600">{quote.vendor.email}</p>
          </div>
          <Badge className={statusColors[quote.status as keyof typeof statusColors]}>
            {quote.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-2xl font-bold">€{quote.amount.toLocaleString()}</p>
            {quote.notes && (
              <p className="mt-2 text-sm text-zinc-600">{quote.notes}</p>
            )}
          </div>

          {isPending && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="default"
                onClick={() => acceptMutation.mutate({ id: quote.id })}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
                className="flex-1"
              >
                {acceptMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Accept
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectMutation.mutate({ id: quote.id })}
                disabled={acceptMutation.isPending || rejectMutation.isPending}
                className="flex-1"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <X className="mr-2 h-4 w-4" />
                )}
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
```

**Don't**:
- Don't add confirmation dialog (keep fast action)
- Don't allow editing accepted/rejected quotes (final state)
- Don't show vendor detail page link (not built yet)

**Verify**: Component compiles without errors

---

### Task 9: Create AI Chat Placeholder Component

**Why**: Reserve UI space for future AI agent integration, show users it's coming.

**Do**:

Create `app/src/components/pipeline/ChatPlaceholder.tsx`:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Sparkles } from 'lucide-react'

export function ChatPlaceholder() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Agent Chat
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex min-h-[400px] flex-col items-center justify-center text-center p-8">
          <Sparkles className="h-12 w-12 text-zinc-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI Agent Coming Soon</h3>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Chat with specialized AI agents to get recommendations for accommodations, activities, and emergency planning.
          </p>
          <div className="mt-6 space-y-2 text-left w-full max-w-md">
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
              <p className="text-sm font-medium">🏨 Accommodation Agent</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Find hotels, hostels, and lodging options</p>
            </div>
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
              <p className="text-sm font-medium">🎉 Activities Agent</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Discover workshops and cultural experiences</p>
            </div>
            <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3">
              <p className="text-sm font-medium">🚨 Emergency Agent</p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Plan for safety and contingencies</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Don't**:
- Don't implement actual chat logic (placeholder only)
- Don't add input field (would be confusing since non-functional)
- Don't make API calls (no backend integration yet)

**Verify**: Component compiles without errors

---

### Task 10: Create Phase Detail Page

**Why**: Show phase details with quotes and AI chat placeholder.

**Mirror**: `app/src/app/(dashboard)/projects/[id]/page.tsx:26-463` (detail page structure)

**Do**:

Create `app/src/app/(dashboard)/pipeline/projects/[id]/phases/[phaseId]/page.tsx`:
```typescript
'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { trpc } from '@/lib/trpc/client'
import { Loader2, ArrowLeft, TrendingUp } from 'lucide-react'
import { QuoteCard } from '@/components/pipeline/QuoteCard'
import { ChatPlaceholder } from '@/components/pipeline/ChatPlaceholder'

export default function PhaseDetailPage({
  params,
}: {
  params: Promise<{ id: string; phaseId: string }>
}) {
  const { id: projectId, phaseId } = use(params)
  const router = useRouter()

  const { data: project, isLoading } = trpc.pipeline.projects.getById.useQuery({ id: projectId })

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-zinc-600">Loading phase...</p>
        </div>
      </div>
    )
  }

  const phase = project?.phases?.find((p) => p.id === phaseId)

  if (!project || !phase) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-2xl font-bold">Phase not found</h2>
          <p className="mt-2 text-sm text-zinc-600">The phase you're looking for doesn't exist.</p>
          <Button onClick={() => router.back()} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </Card>
      </div>
    )
  }

  const progressPercent = phase.budgetAllocated > 0
    ? Math.min((phase.budgetSpent / phase.budgetAllocated) * 100, 100)
    : 0

  return (
    <div className="mx-auto max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push(`/pipeline/projects/${projectId}`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {project.name}
        </Button>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{phase.type} Phase</h1>
            <p className="mt-2 text-zinc-600">{project.name}</p>
          </div>
          <Badge>{phase.status}</Badge>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Phase Management */}
        <div className="space-y-6">
          {/* Budget Card */}
          <Card>
            <CardHeader>
              <CardTitle>Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-600">Spent / Allocated</span>
                    <span className="font-medium">
                      €{phase.budgetSpent.toLocaleString()} / €{phase.budgetAllocated.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                </div>
                <div className="flex justify-between items-center pt-2 border-t">
                  <span className="text-sm text-zinc-600">Remaining</span>
                  <span className="text-lg font-bold">
                    €{(phase.budgetAllocated - phase.budgetSpent).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quotes Section */}
          <div>
            <h2 className="text-xl font-bold mb-4">Vendor Quotes</h2>
            {!phase.quotes || phase.quotes.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-zinc-600">No quotes yet. Request quotes from vendors to get started.</p>
                <Button className="mt-4" disabled>
                  Request Quote (Coming Soon)
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {phase.quotes.map((quote) => (
                  <QuoteCard
                    key={quote.id}
                    projectId={projectId}
                    phaseId={phaseId}
                    quote={quote}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: AI Chat */}
        <div>
          <ChatPlaceholder />
        </div>
      </div>
    </div>
  )
}
```

**Don't**:
- Don't implement quote request functionality (backend not ready)
- Don't add edit phase button (keep simple for v1)
- Don't show communication history (can add later if needed)

**Verify**:
```bash
npm run dev
# Navigate to a pipeline project detail page
# Click "Create Default Phases" if no phases exist
# Click on a phase card
# Should see phase detail with budget, quotes section, and chat placeholder
```

---

### Task 11: Create Profit Summary Card Component

**Why**: Display key profit metrics in dashboard header.

**Mirror**: `app/src/app/(dashboard)/projects/[id]/page.tsx:296-327` (overview card pattern)

**Do**:

Create `app/src/components/profit/ProfitSummaryCard.tsx`:
```typescript
import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

type ProfitSummaryCardProps = {
  title: string
  value: string
  subtitle?: string
  icon: LucideIcon
  color: 'blue' | 'green' | 'purple'
}

const colorClasses = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  purple: 'text-purple-600',
}

export function ProfitSummaryCard({ title, value, subtitle, icon: Icon, color }: ProfitSummaryCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`rounded-lg bg-${color}-50 p-3`}>
            <Icon className={`h-6 w-6 ${colorClasses[color]}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-zinc-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-sm text-zinc-500">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Don't**:
- Don't add click handlers (cards are informational only)
- Don't fetch data in component (parent provides)
- Don't add animations (keep simple)

**Verify**: Component compiles without errors

---

### Task 12: Create Project Profit Table Component

**Why**: Show list of all projects with profit details in sortable table.

**Mirror**: Table structure similar to existing project cards but in table format

**Do**:

Create `app/src/components/profit/ProjectProfitTable.tsx`:
```typescript
'use client'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

type ProjectProfitData = {
  id: string
  name: string
  erasmusGrantCalculated: number | null
  estimatedTotalCost: number | null
  profitMargin: number | null
  status: string
}

type ProjectProfitTableProps = {
  projects: ProjectProfitData[]
}

export function ProjectProfitTable({ projects }: ProjectProfitTableProps) {
  const router = useRouter()

  const getProfitColor = (margin: number | null) => {
    if (!margin) return 'text-zinc-600'
    if (margin >= 30) return 'text-green-600'
    if (margin >= 15) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMarginBadgeColor = (margin: number | null) => {
    if (!margin) return 'bg-zinc-100 text-zinc-700'
    if (margin >= 30) return 'bg-green-100 text-green-700'
    if (margin >= 15) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const statusColors = {
    DRAFT: 'bg-zinc-100 text-zinc-700',
    PLANNING: 'bg-blue-100 text-blue-700',
    VENDOR_RESEARCH: 'bg-purple-100 text-purple-700',
    QUOTES_PENDING: 'bg-yellow-100 text-yellow-700',
    READY_TO_SUBMIT: 'bg-green-100 text-green-700',
    SUBMITTED: 'bg-orange-100 text-orange-700',
    APPROVED: 'bg-emerald-100 text-emerald-700',
  }

  if (projects.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-zinc-600">No projects with calculated grants yet.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-zinc-50 dark:bg-zinc-900">
                <th className="p-4 text-left text-sm font-semibold">Project Name</th>
                <th className="p-4 text-right text-sm font-semibold">Grant</th>
                <th className="p-4 text-right text-sm font-semibold">Costs</th>
                <th className="p-4 text-right text-sm font-semibold">Profit</th>
                <th className="p-4 text-center text-sm font-semibold">Margin</th>
                <th className="p-4 text-center text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => {
                const profitAmount = project.erasmusGrantCalculated && project.estimatedTotalCost
                  ? project.erasmusGrantCalculated - project.estimatedTotalCost
                  : null

                return (
                  <tr
                    key={project.id}
                    onClick={() => router.push(`/pipeline/projects/${project.id}`)}
                    className="border-b cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                  >
                    <td className="p-4 font-medium">{project.name}</td>
                    <td className="p-4 text-right">
                      {project.erasmusGrantCalculated
                        ? `€${project.erasmusGrantCalculated.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className="p-4 text-right">
                      {project.estimatedTotalCost
                        ? `€${project.estimatedTotalCost.toLocaleString()}`
                        : '-'}
                    </td>
                    <td className={`p-4 text-right font-medium ${getProfitColor(project.profitMargin)}`}>
                      {profitAmount !== null ? `€${profitAmount.toLocaleString()}` : '-'}
                    </td>
                    <td className="p-4 text-center">
                      {project.profitMargin !== null ? (
                        <Badge className={getMarginBadgeColor(project.profitMargin)}>
                          {project.profitMargin}%
                        </Badge>
                      ) : (
                        <span className="text-zinc-400">-</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <Badge className={statusColors[project.status as keyof typeof statusColors]}>
                        {project.status}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
```

**Don't**:
- Don't add sorting controls yet (can add later if needed)
- Don't add pagination (show all projects for now)
- Don't add inline editing (navigate to detail page for changes)

**Verify**: Component compiles without errors

---

### Task 13: Create Profit Dashboard Page

**Why**: Show accumulated profit across all projects for business decision-making.

**Mirror**: `app/src/app/(dashboard)/projects/page.tsx:1-51` (page structure)

**Do**:

Create `app/src/app/(dashboard)/dashboard/profit/page.tsx`:
```typescript
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfitSummaryCard } from '@/components/profit/ProfitSummaryCard'
import { ProjectProfitTable } from '@/components/profit/ProjectProfitTable'
import { trpc } from '@/lib/trpc/client'
import { Loader2, TrendingUp, DollarSign, PiggyBank } from 'lucide-react'

export default function ProfitDashboardPage() {
  const { data: summary, isLoading } = trpc.pipeline.projects.getProfitSummary.useQuery()

  if (isLoading) {
    return (
      <div className="flex min-h-[600px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-zinc-600">Loading profit data...</p>
        </div>
      </div>
    )
  }

  const totalGrants = summary?.totalGrantsCalculated || 0
  const totalCosts = summary?.totalEstimatedCosts || 0
  const totalProfit = summary?.estimatedProfit || 0
  const avgMargin = totalGrants > 0 ? ((totalProfit / totalGrants) * 100).toFixed(1) : '0'

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Profit Dashboard</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Track accumulated profit across all pipeline projects
        </p>
      </div>

      {/* Summary Cards */}
      <div className="mb-8 grid gap-6 md:grid-cols-3">
        <ProfitSummaryCard
          title="Total Grants"
          value={`€${totalGrants.toLocaleString()}`}
          subtitle="Erasmus+ income"
          icon={DollarSign}
          color="blue"
        />
        <ProfitSummaryCard
          title="Total Costs"
          value={`€${totalCosts.toLocaleString()}`}
          subtitle="Vendor expenses"
          icon={TrendingUp}
          color="purple"
        />
        <ProfitSummaryCard
          title="Accumulated Profit"
          value={`€${totalProfit.toLocaleString()}`}
          subtitle={`${avgMargin}% average margin`}
          icon={PiggyBank}
          color="green"
        />
      </div>

      {/* Projects Table */}
      <div>
        <h2 className="mb-4 text-xl font-bold">Projects Breakdown</h2>
        <ProjectProfitTable projects={summary?.projects || []} />
      </div>

      {/* Empty State */}
      {(!summary || summary.projects.length === 0) && (
        <Card className="mt-6">
          <CardContent className="p-12 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-zinc-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No profit data yet</h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Create pipeline projects and calculate Erasmus+ grants to see profit analysis.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

**Don't**:
- Don't add date range filters yet (show all-time data)
- Don't add export functionality (can add later)
- Don't add charts/graphs (tables are sufficient for v1)

**Verify**:
```bash
npm run dev
# Navigate to http://localhost:3000/dashboard/profit
# Should see profit dashboard with summary cards and table
# If no projects: Shows empty state
# If projects exist: Shows metrics and table
```

---

### Task 14: Create Playwright E2E Tests

**Why**: Ensure all pages load and navigation works correctly.

**Mirror**: `app/tests/critical-issues.spec.ts:1-50`

**Do**:

Create `app/tests/pipeline-ui.spec.ts`:
```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('Pipeline Projects Page', () => {
  test('should load pipeline projects list page', async ({ page }) => {
    await page.goto(`${BASE_URL}/pipeline/projects`);
    await page.waitForLoadState('networkidle');

    // Check for main heading
    await expect(page.locator('h1')).toContainText('Pipeline Projects');

    // Check that we're not stuck in loading (no spinner after load)
    await page.waitForTimeout(2000);
    const spinnerCount = await page.locator('.animate-spin').count();
    expect(spinnerCount).toBe(0);
  });

  test('should show create project button', async ({ page }) => {
    await page.goto(`${BASE_URL}/pipeline/projects`);
    await page.waitForLoadState('networkidle');

    // Check for "New Pipeline Project" button
    const createButton = page.locator('button:has-text("New Pipeline Project")');
    await expect(createButton).toBeVisible();
  });

  test('should open create project dialog', async ({ page }) => {
    await page.goto(`${BASE_URL}/pipeline/projects`);
    await page.waitForLoadState('networkidle');

    // Click create button
    await page.locator('button:has-text("New Pipeline Project")').click();

    // Dialog should appear
    await expect(page.locator('text="Create Pipeline Project"')).toBeVisible();

    // Check for required form fields
    await expect(page.locator('label:has-text("Project Name")')).toBeVisible();
    await expect(page.locator('label:has-text("Location")')).toBeVisible();
    await expect(page.locator('label:has-text("Participant Count")')).toBeVisible();
  });
});

test.describe('Pipeline Project Detail Page', () => {
  test.skip('should navigate to project detail page', async ({ page }) => {
    // Skip if no projects exist - this would need test data setup
    await page.goto(`${BASE_URL}/pipeline/projects`);
    await page.waitForLoadState('networkidle');

    // Wait for projects to load
    await page.waitForTimeout(2000);

    // If there are project cards, click the first one
    const projectCards = page.locator('a[href^="/pipeline/projects/"]');
    const count = await projectCards.count();

    if (count > 0) {
      await projectCards.first().click();
      await page.waitForLoadState('networkidle');

      // Should be on detail page
      await expect(page).toHaveURL(/\/pipeline\/projects\/[a-f0-9-]+/);

      // Check for expected elements
      await expect(page.locator('h1')).toBeVisible();
      await expect(page.locator('text="Financial Overview"')).toBeVisible();
    }
  });
});

test.describe('Profit Dashboard Page', () => {
  test('should load profit dashboard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard/profit`);
    await page.waitForLoadState('networkidle');

    // Check for main heading
    await expect(page.locator('h1')).toContainText('Profit Dashboard');

    // Check for summary cards
    await expect(page.locator('text="Total Grants"')).toBeVisible();
    await expect(page.locator('text="Total Costs"')).toBeVisible();
    await expect(page.locator('text="Accumulated Profit"')).toBeVisible();

    // No loading spinner after load
    await page.waitForTimeout(2000);
    const spinnerCount = await page.locator('.animate-spin').count();
    expect(spinnerCount).toBe(0);
  });
});

test.describe('Navigation', () => {
  test('should navigate between pipeline pages using sidebar', async ({ page }) => {
    await page.goto(`${BASE_URL}/pipeline/projects`);
    await page.waitForLoadState('networkidle');

    // Check sidebar has pipeline links
    await expect(page.locator('text="Pipeline Projects"')).toBeVisible();
    await expect(page.locator('text="Profit Dashboard"')).toBeVisible();

    // Click profit dashboard link
    await page.locator('a[href="/dashboard/profit"]').click();
    await page.waitForLoadState('networkidle');

    // Should navigate to profit dashboard
    await expect(page).toHaveURL(`${BASE_URL}/dashboard/profit`);
    await expect(page.locator('h1')).toContainText('Profit Dashboard');

    // Navigate back to pipeline projects
    await page.locator('a[href="/pipeline/projects"]').click();
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(`${BASE_URL}/pipeline/projects`);
    await expect(page.locator('h1')).toContainText('Pipeline Projects');
  });
});

test.describe('Phase Detail Page', () => {
  test.skip('should load phase detail page', async ({ page }) => {
    // Skip - requires test data setup with project and phases
    // This would test: /pipeline/projects/[id]/phases/[phaseId]
  });
});
```

**Don't**:
- Don't add tests that require authentication (auth disabled for now)
- Don't add tests that require test data (use .skip until data exists)
- Don't test API calls directly (Playwright tests UI only)

**Verify**:
```bash
# Run all tests
npm test

# Run only pipeline tests
npx playwright test pipeline-ui

# All tests should pass (skipped tests are OK)
```

---

### Task 15: Final Validation - Full Flow Test

**Why**: Verify the entire user journey works end-to-end.

**Do**:

Manual testing checklist:

1. **Start dev server**
```bash
cd app
npm run dev
```

2. **Test Pipeline Projects List**
- Navigate to http://localhost:3000/pipeline/projects
- Page loads without errors
- "New Pipeline Project" button visible
- Click button → Dialog opens

3. **Create Pipeline Project**
- Fill form:
  - Name: "Test Barcelona Exchange"
  - Location: "Barcelona, Spain"
  - Participants: 20
  - Start Date: 2026-07-01
  - End Date: 2026-07-08
- Click "Create Project"
- Should navigate to project detail page

4. **Test Project Detail Page**
- Verify project name, location, dates displayed
- Click "Calculate Grant" button
- Grant amount appears (should be ~€18,000+)
- Click "Create Default Phases"
- 6 phase cards appear (Accommodation, Travel, Food, Activities, Insurance, Emergency)

5. **Test Phase Detail Page**
- Click on "ACCOMMODATION" phase card
- Budget card shows allocated/spent
- "No quotes yet" message appears
- AI Chat placeholder visible on right side

6. **Test Profit Dashboard**
- Click "Profit Dashboard" in sidebar
- Summary cards show totals
- Project table shows "Test Barcelona Exchange"
- Profit margin displayed (green/yellow/red badge)

7. **Test Navigation**
- Click through sidebar links
- Active states highlight correctly
- Back buttons work
- All pages load without console errors

**Verify**:
```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Build
npm run build

# Run Playwright tests
npm test

# All should pass with no errors
```

**Don't**:
- Don't test AI chat functionality (placeholder only)
- Don't test email sending (not implemented)
- Don't test vendor CRUD (not built yet)

---

## Validation Strategy

### Automated Checks

- [ ] `npx tsc --noEmit` - TypeScript types valid (no compilation errors)
- [ ] `npm run lint` - No ESLint errors
- [ ] `npm run build` - Production build succeeds
- [ ] `npm test` - All Playwright E2E tests pass

### New Tests to Write

| Test File | Test Case | What It Validates |
|-----------|-----------|-------------------|
| `app/tests/pipeline-ui.spec.ts` | Pipeline projects list page loads | Page renders, no loading spinner stuck, create button visible |
| `app/tests/pipeline-ui.spec.ts` | Create project dialog opens | Button click opens dialog, form fields present |
| `app/tests/pipeline-ui.spec.ts` | Profit dashboard page loads | Page renders, summary cards visible, table displays |
| `app/tests/pipeline-ui.spec.ts` | Sidebar navigation works | Can navigate between pipeline pages, active states correct |

### Manual/E2E Validation

```bash
# Start dev server
cd app
npm run dev
```

**Test Flow 1: Create Pipeline Project**
1. Navigate to http://localhost:3000/pipeline/projects
2. Click "New Pipeline Project"
3. Fill form: Name="Test Project", Location="Barcelona", Participants=20, Dates=7 days apart
4. Click "Create Project"
5. **Expected:** Navigates to project detail, project data displayed

**Test Flow 2: Calculate Grant and Create Phases**
1. On project detail page, click "Calculate Grant"
2. **Expected:** Grant amount appears (€15,000-€25,000 range)
3. Click "Create Default Phases"
4. **Expected:** 6 phase cards appear in grid

**Test Flow 3: View Phase Detail**
1. Click "ACCOMMODATION" phase card
2. **Expected:** Phase detail page loads
3. **Expected:** Budget card shows allocated/spent
4. **Expected:** AI chat placeholder visible
5. **Expected:** "No quotes yet" message

**Test Flow 4: Profit Dashboard**
1. Click "Profit Dashboard" in sidebar
2. **Expected:** Summary cards show totals
3. **Expected:** Project table lists created projects
4. **Expected:** Profit margins color-coded correctly

**Test Flow 5: Navigation**
1. Navigate through: Pipeline Projects → Project Detail → Phase Detail → Profit Dashboard
2. Use back buttons and sidebar links
3. **Expected:** All pages load correctly, no console errors

### Edge Cases to Test

- [ ] **Empty states:** Pipeline projects list with no projects
- [ ] **Loading states:** Verify skeleton loaders appear during data fetching
- [ ] **Grant not calculated:** Project detail shows "Calculate Grant" button
- [ ] **No phases:** Project detail shows "Create Default Phases" button
- [ ] **No quotes:** Phase detail shows "No quotes yet" message
- [ ] **Profit dashboard with no data:** Shows empty state
- [ ] **Date calculation:** Duration days calculated correctly
- [ ] **Budget progress bar:** Correctly shows spent/allocated ratio
- [ ] **Profit margin colors:** Green (≥30%), Yellow (15-29%), Red (<15%)
- [ ] **Long project names:** Text truncates gracefully in cards
- [ ] **Navigation active states:** Correct sidebar item highlighted on each page

### Regression Check

- [ ] **Existing projects page** (`/projects`) still loads correctly
- [ ] **Project detail page** (`/projects/[id]`) not affected
- [ ] **Brainstorm page** (`/brainstorm`) still works
- [ ] **Seeds page** (`/seeds`) still works
- [ ] **Dashboard home** (`/`) still works
- [ ] **Sidebar navigation** for existing pages unchanged

**How to verify:** Navigate to each existing page and ensure:
- No console errors
- Page loads fully
- Existing tRPC queries work
- No UI regressions

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **tRPC schema changes break frontend** | Medium | Type errors will be caught by TypeScript compiler, validate with `npx tsc --noEmit` before committing |
| **Grant calculation returns unexpected format** | Low | Backend already deployed and tested, data structure is stable |
| **Performance with many projects** | Low | React Query handles caching well, pagination can be added later if needed |
| **Mobile responsiveness issues** | Medium | Use existing responsive grid patterns, test on mobile viewports |
| **Sidebar overflow with new links** | Low | Only 2 new links added, sidebar has space |
| **Empty state confusion** | Low | Clear CTAs guide users to create first project |
| **AI chat placeholder misleading** | Low | Clear messaging "Coming Soon" with explanation |

---

## Implementation Sequence

The tasks are ordered for dependency resolution:

1. **Task 1** (Sidebar) - Enables navigation to new pages
2. **Tasks 2-3** (Components) - Build UI components before pages
3. **Tasks 4-5** (List page + Dialog) - First user entry point
4. **Tasks 6-7** (Phase Card + Detail) - Project detail dependencies
5. **Task 8** (Quote Card) - Phase detail dependency
6. **Task 9** (Chat Placeholder) - Phase detail dependency
7. **Task 10** (Phase Detail Page) - Uses components from 8-9
8. **Tasks 11-12** (Profit Components) - Dashboard dependencies
9. **Task 13** (Profit Dashboard) - Uses components from 11-12
10. **Task 14** (Tests) - Validates all pages
11. **Task 15** (Final Validation) - End-to-end verification

---

## Success Criteria

Before marking implementation complete:

- [ ] All TypeScript compilation errors resolved (`npx tsc --noEmit`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] All Playwright tests pass (`npm test`)
- [ ] Dev server starts without errors (`npm run dev`)
- [ ] All new pages accessible from sidebar
- [ ] Can create pipeline project and navigate to detail
- [ ] Can calculate grant and create phases
- [ ] Can view phase detail with quotes and chat placeholder
- [ ] Profit dashboard shows summary and project table
- [ ] Navigation between pages works correctly
- [ ] No console errors in browser
- [ ] Existing pages (Projects, Seeds, Brainstorm) not affected

---

## Post-Implementation: Not Included (Phase 2)

These are intentionally deferred and should NOT be built in this phase:

**AI Agents (1 week):**
- Accommodation agent with LangChain
- Activities agent with recommendations
- Emergency agent with safety planning
- Real chat interface with streaming responses
- Store conversations in AIConversation model

**Email Integration (2-3 days):**
- Resend API integration
- Email template builder
- Send quote requests to vendors
- Track email status (SENT, DELIVERED, RESPONDED)
- Parse replies for quote amounts

**Application Generator (1 week):**
- Erasmus+ KA1 format research
- Section generation with AI
- PDF/DOCX export
- Form field mapping from project data

**Advanced Features:**
- Vendor directory CRUD
- Advanced filtering and search
- Sorting tables
- Date range filters on profit dashboard
- Charts and graphs
- Real-time updates
- Mobile app optimization

---

## External Research Sources

**Next.js 15:**
- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Next.js 15 Best Practices 2025](https://medium.com/better-dev-nextjs-react/inside-the-app-router-best-practices-for-next-js-file-and-directory-structure-2025-edition-ed6bc14a8da3)

**tRPC React Query:**
- [tRPC Next.js Integration](https://trpc.io/docs/client/nextjs)
- [tRPC with Next.js 15 App Router](https://www.wisp.blog/blog/how-to-use-trpc-with-nextjs-15-app-router)

**Dashboard UI:**
- [Tailwind CSS Dashboard Components](https://tailgrids.com/dashboard-components)
- [Radix UI Components](https://www.radix-ui.com/)
