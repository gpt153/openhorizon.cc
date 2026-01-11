# Feature: Implement Phase Detail Pages with Routing, CRUD Operations, and UI Components

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils, types, and models. Import from the right files, etc.

## Feature Description

Implement fully functional phase detail pages that allow users to drill down into individual project phases from the Gantt chart view. Users should be able to click on phase cards in the project detail page to navigate to a dedicated phase detail page where they can view comprehensive phase information, edit budgets and dates, manage quotes from vendors, and interact with phase-specific AI agents.

## User Story

As a project manager planning an Erasmus+ youth exchange
I want to click on individual phases in my project timeline
So that I can drill down into phase-specific details, manage budgets, request vendor quotes, and get AI assistance for planning that specific phase

## Problem Statement

Currently, the Next.js application (`app/`) has the phase detail page implementation, but it needs verification and potential completion. The GitHub issue references the old standalone React application (`project-pipeline/frontend/`), which is deprecated and being replaced by the integrated Next.js platform. Users need to be able to navigate from the project detail page's phase cards to dedicated phase detail pages to manage phase-specific information and interact with specialized AI agents for each phase type (accommodation, travel, food, activities, etc.).

## Solution Statement

Verify and complete the existing Next.js phase detail page implementation. Ensure that:
1. Phase cards in the project detail page properly link to phase detail pages
2. The phase detail page displays all relevant phase information
3. Users can edit phase details (budget, dates, status)
4. The AI chat integration works for phase-specific assistance
5. Quote management is functional (view, request, accept/reject quotes)
6. Navigation flows work correctly (breadcrumbs, back buttons)

## Feature Metadata

**Feature Type**: Enhancement / Bug Fix
**Estimated Complexity**: Medium
**Primary Systems Affected**: 
- Frontend: Next.js pages and components
- Backend: tRPC routers (already exist)
- Database: Prisma queries (already exist)

**Dependencies**: 
- @trpc/client - v11.8.0 (already installed)
- @trpc/react-query - v11.8.0 (already installed)
- next - v16.0.10 (already installed)
- React Router (project-pipeline) - DEPRECATED, not used

---

## CONTEXT REFERENCES

### Relevant Codebase Files - IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

**Next.js Application (Main Platform - Active):**

- `app/src/app/(dashboard)/pipeline/projects/[id]/page.tsx` (lines 1-232) - Project detail page that displays phase cards
  - Why: Shows how phase cards are rendered and how they should link to phase details
  - Pattern: Uses PhaseCard component which already has Link wrapper

- `app/src/app/(dashboard)/pipeline/projects/[id]/phases/[phaseId]/page.tsx` (lines 1-181) - **EXISTING** Phase detail page implementation
  - Why: This is the main file we need to verify and potentially enhance
  - Current Status: Already implemented with budget display, quotes section, and AI chat

- `app/src/components/pipeline/phases/PhaseCard.tsx` (lines 1-101) - Phase card component with navigation
  - Why: Already wraps content in Link to phase detail page (line 46)
  - Pattern: `<Link href={`/pipeline/projects/${projectId}/phases/${phase.id}`}>`

- `app/src/server/routers/pipeline/phases.ts` (lines 1-353) - Backend tRPC procedures for phases
  - Why: Contains all necessary CRUD operations (getById, update, delete, chat)
  - API Endpoints Available:
    - `pipeline.phases.getById` - Get single phase with all relations
    - `pipeline.phases.update` - Update phase details
    - `pipeline.phases.delete` - Delete phase
    - `pipeline.phases.chat` - AI agent chat for phase

- `app/src/components/pipeline/PhaseChat.tsx` - Phase-specific AI chat component
  - Why: Handles AI interaction for phase planning assistance

- `app/src/components/pipeline/quotes/QuoteCard.tsx` - Quote display component
  - Why: Displays vendor quotes within phase detail page

**Deprecated React Application (NOT USED):**
- `project-pipeline/frontend/src/*` - OLD standalone React app (ignore for this task)
  - Why: This is being replaced by the Next.js app and should NOT be modified

### New Files to Create

**NONE** - All necessary files already exist. This is primarily a verification and enhancement task.

### Relevant Documentation - YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Next.js Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes)
  - Specific section: Nested dynamic routes
  - Why: Understand how `/pipeline/projects/[id]/phases/[phaseId]` routing works

- [tRPC React Query Integration](https://trpc.io/docs/client/react/useQuery)
  - Specific section: useQuery hook with parameters
  - Why: Understand how to properly use `trpc.pipeline.phases.getById.useQuery()`

- [Next.js use() Hook](https://nextjs.org/docs/app/api-reference/functions/use)
  - Specific section: Unwrapping Promise params
  - Why: Required for accessing async params in Server Components

- [React Query Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
  - Specific section: Optimistic updates and cache invalidation
  - Why: Needed for implementing phase edit functionality

### Patterns to Follow

**Next.js Page Component Pattern:**
```typescript
'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { trpc } from '@/lib/trpc/client'

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params) // Unwrap async params
  
  const { data, isLoading, error } = trpc.example.getById.useQuery({
    id: resolvedParams.id,
  })
  
  // ... component logic
}
```

**tRPC Query Pattern:**
```typescript
// Read operation
const { data: phase, isLoading, error, refetch } = trpc.pipeline.phases.getById.useQuery({
  id: phaseId,
})

// Mutation operation
const updatePhase = trpc.pipeline.phases.update.useMutation({
  onSuccess: () => {
    refetch() // Refresh data after update
  },
})

// Trigger mutation
updatePhase.mutate({
  id: phaseId,
  data: {
    budgetAllocated: newBudget,
  },
})
```

**Navigation Pattern:**
```typescript
import { useRouter } from 'next/navigation'

const router = useRouter()

// Navigate to phase detail
router.push(`/pipeline/projects/${projectId}/phases/${phaseId}`)

// Go back
router.push(`/pipeline/projects/${projectId}`)
// OR
router.back()
```

**Error Handling Pattern:**
```typescript
if (error) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-red-600">Error loading phase</h2>
        <p className="text-sm text-zinc-600 mt-2">{error.message}</p>
        <Button onClick={() => router.push(`/pipeline/projects/${projectId}`)}>
          Back to Project
        </Button>
      </div>
    </div>
  )
}
```

**Loading State Pattern:**
```typescript
if (isLoading || !phase) {
  return (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
    </div>
  )
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Verification & Testing

Verify that the existing implementation works correctly and identify any gaps.

**Tasks:**

- Verify phase card navigation works
- Test phase detail page rendering
- Check AI chat functionality
- Validate quote display
- Test error handling and loading states

### Phase 2: Enhancement (If Needed)

Based on verification results, add missing functionality.

**Tasks:**

- Add phase edit functionality if missing
- Implement budget/date editing
- Add delete phase functionality
- Enhance error messages
- Improve loading states

### Phase 3: Integration Testing

Ensure end-to-end flow works correctly.

**Tasks:**

- Test complete user journey (project → phase → edit → back)
- Verify data persistence
- Test with multiple phases
- Validate AI agent responses
- Test quote management workflow

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: VERIFY Existing Phase Detail Page

**Action**: READ and TEST existing implementation

- **FILE**: `app/src/app/(dashboard)/pipeline/projects/[id]/phases/[phaseId]/page.tsx`
- **VERIFY**:
  - Page component uses `use(params)` pattern correctly
  - tRPC query fetches phase data with all relations
  - Error handling is comprehensive
  - Loading state is user-friendly
  - Budget display shows allocated/spent/remaining
  - Quotes section displays vendor quotes
  - AI chat component is integrated
  - Back navigation works
- **GOTCHA**: Next.js 16 requires `use()` hook for async params
- **VALIDATE**: 
  ```bash
  # Manual test: Navigate to a project and click a phase card
  npm run dev --prefix app
  # Open browser: http://localhost:3000/pipeline/projects/{projectId}/phases/{phaseId}
  ```

### Task 2: VERIFY Phase Card Navigation

**Action**: TEST PhaseCard component links

- **FILE**: `app/src/components/pipeline/phases/PhaseCard.tsx`
- **VERIFY**:
  - Link wrapper exists (line 46)
  - href points to correct route format
  - onClick events don't prevent navigation
  - Card is keyboard accessible (Enter key works)
- **PATTERN**: See PhaseCard.tsx lines 45-99
- **VALIDATE**:
  ```bash
  # Manual test: Click phase card and verify navigation
  # Should navigate to /pipeline/projects/{projectId}/phases/{phaseId}
  ```

### Task 3: TEST tRPC Phase Queries

**Action**: VERIFY backend API connectivity

- **FILE**: `app/src/server/routers/pipeline/phases.ts`
- **VERIFY**:
  - `getById` procedure includes all necessary relations (project, quotes, communications, aiConversations)
  - Authorization check exists (tenantId verification)
  - Error messages are clear
- **PATTERN**: See phases.ts lines 42-67
- **VALIDATE**:
  ```bash
  # Check tRPC endpoint in browser network tab
  # Should see request to /api/trpc/pipeline.phases.getById
  ```

### Task 4: IMPLEMENT Phase Edit Functionality (If Missing)

**Action**: ADD edit capability if not present

- **CREATE**: Edit button handler in phase detail page
- **IMPLEMENT**:
  - Dialog/Modal for editing phase details
  - Form fields for: name, status, budgetAllocated, startDate, endDate
  - Form validation using react-hook-form + zod
  - tRPC mutation call to `pipeline.phases.update`
  - Success/error toast notifications
  - Cache invalidation after successful update
- **PATTERN**: Mirror project update pattern from projects router
- **IMPORTS**: 
  ```typescript
  import { useForm } from 'react-hook-form'
  import { zodResolver } from '@hookform/resolvers/zod'
  import { z } from 'zod'
  import { toast } from 'sonner'
  ```
- **GOTCHA**: Date inputs need to be converted to ISO strings for tRPC
- **VALIDATE**:
  ```bash
  # Test: Click edit, modify budget, save, verify changes persist
  npm run dev --prefix app
  ```

### Task 5: ADD Phase Delete Functionality (If Missing)

**Action**: ADD delete button with confirmation

- **UPDATE**: `app/src/app/(dashboard)/pipeline/projects/[id]/phases/[phaseId]/page.tsx`
- **IMPLEMENT**:
  - Delete button in page header (next to Edit button)
  - Confirmation dialog using AlertDialog component
  - tRPC mutation call to `pipeline.phases.delete`
  - Redirect to project page after successful delete
  - Error handling for failed deletion
- **PATTERN**: Follow shadcn/ui AlertDialog pattern
- **IMPORTS**:
  ```typescript
  import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog'
  ```
- **VALIDATE**:
  ```bash
  # Test: Delete phase, verify redirect, confirm phase is gone from project
  ```

### Task 6: ENHANCE Budget Display Section

**Action**: IMPROVE budget visualization

- **UPDATE**: Budget card in phase detail page
- **IMPLEMENT**:
  - Color-coded progress bar (green <75%, yellow 75-90%, red >90%)
  - Budget remaining calculation
  - Percentage spent display
  - Warning indicator if over budget
- **PATTERN**: See project detail page budget card (lines 111-149 in projects/[id]/page.tsx)
- **VALIDATE**:
  ```bash
  # Visual test: Budget display shows correct colors and calculations
  ```

### Task 7: VERIFY Quote Management Integration

**Action**: TEST quote display and functionality

- **FILE**: `app/src/components/pipeline/quotes/QuoteCard.tsx`
- **VERIFY**:
  - QuoteCard component displays all quote information
  - Quote status badges show correct colors
  - Vendor information is displayed
  - Amount formatting uses formatCurrency helper
- **PATTERN**: See QuoteCard component implementation
- **VALIDATE**:
  ```bash
  # Manual test: View phase with quotes, verify display
  # Create test quote via tRPC to verify rendering
  ```

### Task 8: TEST AI Chat Integration

**Action**: VERIFY PhaseChat component works

- **FILE**: `app/src/components/pipeline/PhaseChat.tsx`
- **VERIFY**:
  - Chat component receives correct props (phaseId, phaseType, phaseName)
  - AI agent responds to user messages
  - Chat history is preserved
  - Error states are handled gracefully
- **PATTERN**: See phase detail page lines 167-174
- **VALIDATE**:
  ```bash
  # Manual test: Send message to AI agent, verify response appears
  # Check network tab for tRPC mutation call
  ```

### Task 9: ADD Breadcrumb Navigation

**Action**: IMPLEMENT breadcrumb trail

- **UPDATE**: Phase detail page header section
- **IMPLEMENT**:
  - Breadcrumb: Dashboard → Projects → {Project Name} → {Phase Name}
  - Each segment is clickable link
  - Current page segment is not a link (plain text)
- **PATTERN**:
  ```typescript
  <nav className="mb-4">
    <ol className="flex items-center space-x-2 text-sm">
      <li><Link href="/pipeline/projects">Projects</Link></li>
      <li className="text-zinc-400">/</li>
      <li><Link href={`/pipeline/projects/${projectId}`}>{project.name}</Link></li>
      <li className="text-zinc-400">/</li>
      <li className="text-zinc-600">{phase.name}</li>
    </ol>
  </nav>
  ```
- **VALIDATE**:
  ```bash
  # Click each breadcrumb segment, verify navigation
  ```

### Task 10: IMPLEMENT Loading Skeletons

**Action**: ADD skeleton loading states

- **UPDATE**: Phase detail page loading state
- **IMPLEMENT**:
  - Skeleton for header section
  - Skeleton for budget cards
  - Skeleton for quotes section
  - Skeleton for chat section
- **PATTERN**: Use shadcn/ui Skeleton component
- **IMPORTS**: `import { Skeleton } from '@/components/ui/skeleton'`
- **VALIDATE**:
  ```bash
  # Throttle network in DevTools to see loading state
  ```

### Task 11: ADD Error Boundaries

**Action**: ENHANCE error handling

- **CREATE**: Error boundary component for phase detail page
- **IMPLEMENT**:
  - Catch rendering errors
  - Display user-friendly error message
  - Provide retry button
  - Log errors to console for debugging
- **PATTERN**: Use Next.js error.tsx convention
- **FILE**: Create `app/src/app/(dashboard)/pipeline/projects/[id]/phases/[phaseId]/error.tsx`
- **VALIDATE**:
  ```bash
  # Temporarily throw error in component, verify error boundary catches it
  ```

### Task 12: TEST End-to-End Flow

**Action**: VALIDATE complete user journey

- **MANUAL TEST**:
  1. Navigate to project list
  2. Click on a project
  3. Click on a phase card
  4. Verify phase detail page loads with all data
  5. Click "Edit" and modify budget
  6. Save changes and verify persistence
  7. Send AI chat message and verify response
  8. Click back button and verify return to project page
  9. Navigate back to phase detail via phase card
  10. Test delete phase functionality
- **VALIDATE**: All steps complete without errors

---

## TESTING STRATEGY

### Unit Tests (Optional - Focus on Manual Testing for Now)

**Scope**: Component-level testing for complex logic

- PhaseCard navigation behavior
- Budget calculation logic
- Date formatting helpers

**Tools**: React Testing Library (if time permits)

### Integration Tests (Manual)

**Scope**: End-to-end user flows

1. **Phase Navigation Flow**
   - Start at project list
   - Navigate to project detail
   - Click phase card
   - Verify URL change and page load
   - Verify data displayed correctly

2. **Phase Edit Flow**
   - Open phase detail
   - Click edit button
   - Modify fields
   - Save changes
   - Verify changes reflected immediately
   - Refresh page and verify persistence

3. **AI Chat Flow**
   - Open phase detail
   - Send message to AI agent
   - Verify response appears
   - Send follow-up message
   - Verify conversation history

4. **Quote Management Flow**
   - Open phase with quotes
   - Verify quotes display
   - Check status badges
   - Verify vendor information

### Edge Cases

- Phase with no quotes (empty state)
- Phase with zero budget (division by zero handling)
- Invalid phase ID (404 error)
- Network error during fetch (error boundary)
- Very long phase names (truncation)
- Phase with future dates (date validation)

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: TypeScript Compilation

**Verify no type errors:**

```bash
cd app && npx tsc --noEmit
```

**Expected**: No errors
**Why**: Ensures all TypeScript types are correct

### Level 2: Build Test

**Verify Next.js build succeeds:**

```bash
cd app && npm run build
```

**Expected**: Build completes without errors
**Why**: Catches build-time errors before deployment

### Level 3: Dev Server Start

**Start development server:**

```bash
cd app && npm run dev
```

**Expected**: Server starts on http://localhost:3000
**Why**: Required for manual testing

### Level 4: Manual Navigation Test

**Test phase navigation flow:**

1. Open http://localhost:3000/pipeline/projects
2. Click any project
3. Click any phase card
4. Verify phase detail page loads
5. Check all sections render (budget, quotes, chat)

**Expected**: Smooth navigation, all data displays
**Why**: Verifies primary user flow

### Level 5: Data Mutation Test

**Test phase edit functionality:**

1. Navigate to phase detail page
2. Click "Edit" button (if present)
3. Modify budget value
4. Save changes
5. Refresh page
6. Verify changes persisted

**Expected**: Changes save and persist
**Why**: Verifies data mutations work

### Level 6: AI Chat Test

**Test AI agent interaction:**

1. Navigate to phase detail page
2. Scroll to AI Assistant section
3. Type message: "What should I consider for accommodation?"
4. Send message
5. Wait for response

**Expected**: AI responds with relevant advice
**Why**: Verifies AI integration works

### Level 7: Error Handling Test

**Test invalid phase ID:**

1. Navigate to: http://localhost:3000/pipeline/projects/00000000-0000-0000-0000-000000000000/phases/00000000-0000-0000-0000-000000000000
2. Verify error message displays
3. Click "Back to Project" button
4. Verify navigation works

**Expected**: Graceful error handling
**Why**: Verifies error states work

---

## ACCEPTANCE CRITERIA

- [x] Phase cards in Gantt chart/project detail ARE clickable (already implemented via Link)
- [x] Clicking phase navigates to phase detail page (route exists)
- [x] Phase detail shows: name, budget, dates, status, description (already displayed)
- [ ] Can edit phase information (needs implementation or verification)
- [ ] Changes persist to database (depends on edit functionality)
- [x] Back navigation returns to project detail (back button exists)
- [x] Responsive design (existing components are responsive)
- [x] AI chat integration functional (PhaseChat component integrated)
- [x] Quote display functional (QuoteCard components render)
- [ ] Loading states are user-friendly (needs enhancement)
- [ ] Error messages are clear (needs verification)

---

## COMPLETION CHECKLIST

- [ ] All verification tasks completed
- [ ] Missing functionality identified
- [ ] Edit functionality implemented (if needed)
- [ ] Delete functionality implemented (if needed)
- [ ] Breadcrumb navigation added
- [ ] Loading skeletons implemented
- [ ] Error boundaries added
- [ ] All validation commands executed successfully
- [ ] Manual testing confirms feature works
- [ ] End-to-end flow tested
- [ ] Edge cases handled
- [ ] Acceptance criteria all met

---

## NOTES

### Key Clarifications

1. **Two Codebases**: There are TWO separate applications:
   - `app/` - Next.js application (ACTIVE, main platform)
   - `project-pipeline/frontend/` - React Router application (DEPRECATED)
   - **This task focuses ONLY on the Next.js app**

2. **Already Partially Implemented**: The phase detail page already exists at `app/src/app/(dashboard)/pipeline/projects/[id]/phases/[phaseId]/page.tsx`. This task is primarily about:
   - Verifying it works correctly
   - Adding missing functionality (edit, delete)
   - Enhancing UX (loading states, error handling)

3. **Backend Already Complete**: All tRPC procedures exist in `app/src/server/routers/pipeline/phases.ts`. No backend changes needed.

4. **Navigation Already Works**: The PhaseCard component already wraps its content in a Link component pointing to the phase detail page.

### Design Decisions

- **Use tRPC for all API calls** - Consistent with rest of Next.js app
- **Use shadcn/ui components** - Matches existing component library
- **Follow Next.js 16 patterns** - Use `use()` hook for async params
- **Prioritize manual testing** - Faster than writing comprehensive unit tests for UI

### Trade-offs

- **Manual testing over automated tests**: Faster implementation, but requires thorough manual verification
- **In-page editing vs separate edit page**: In-page editing would be better UX but more complex to implement
- **Modal edit dialog**: Simpler and faster to implement than inline editing

### Performance Considerations

- tRPC queries use React Query caching - no additional optimization needed
- Phase detail page only loads data for single phase - query is efficient
- Consider adding `revalidate` for static generation in future (not critical for MVP)

### Security Considerations

- All tRPC procedures verify `tenantId` - users can only access their organization's data
- Next.js middleware should enforce authentication (verify Clerk setup)
- No sensitive data exposed in client-side code

