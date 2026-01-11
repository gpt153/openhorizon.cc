# Plan: Seed-to-Project Conversion Feature

## Summary
Implement a seed-to-project conversion feature that allows users to transform a fully elaborated seed into a project with one click. This involves adding a "Convert to Project" button in the SeedDetail page (frontend), creating a new API endpoint `/seeds/:id/convert` (backend route), and implementing `convertSeedToProject()` service method that maps seed fields to project fields and generates default project phases.

## Intent
Users spend time brainstorming and elaborating project ideas (seeds) but then face friction manually recreating all that work when creating an actual project. This conversion feature eliminates duplicate data entry by automatically transforming an elaborated seed into a ready-to-use project with intelligent defaults, accelerating the path from ideation to execution.

## Persona
- **Sarah, Project Coordinator**: Has brainstormed 3 seed ideas and elaborated one through 12 conversation turns. The seed now has a formal title, detailed description, estimated duration (14 days), and 25 participants. She wants to convert this seed to a project without manually copying all the information.
- **Marcus, Team Lead**: Reviews seeds submitted by team members and wants to quickly convert approved seeds into actionable projects with proper phase structures already set up.

## UX

### Before Implementation
```
┌─────────────────────────────────────────┐
│  Seed Detail Page                       │
│  ┌────────────────────────────────────┐ │
│  │ Title: "Youth Exchange Barcelona"  │ │
│  │ Description: ...                   │ │
│  │ Duration: 14 days                  │ │
│  │ Participants: 25                   │ │
│  │                                    │ │
│  │ Actions: [Save] [Delete]           │ │
│  └────────────────────────────────────┘ │
│                                         │
│  User must:                             │
│  1. Navigate to /projects/create        │
│  2. Manually copy title                 │
│  3. Manually copy description           │
│  4. Manually enter dates                │
│  5. Manually enter participants         │
│  6. Create project                      │
│  7. Manually add phases one by one      │
└─────────────────────────────────────────┘
```

### After Implementation
```
┌──────────────────────────────────────────────┐
│  Seed Detail Page                            │
│  ┌────────────────────────────────────────┐  │
│  │ Title: "Youth Exchange Barcelona"     │  │
│  │ Description: ...                      │  │
│  │ Duration: 14 days                     │  │
│  │ Participants: 25                      │  │
│  │                                       │  │
│  │ Actions:                              │  │
│  │ [Convert to Project] [Save] [Delete] │  │
│  └────────────────────────────────────────┘  │
│                                              │
│  User clicks "Convert to Project" →          │
│  ↓                                           │
│  [Loading state shown]                       │
│  ↓                                           │
│  Success toast: "Project created!"           │
│  ↓                                           │
│  Redirects to: /projects/{new-project-id}    │
│  ┌────────────────────────────────────────┐  │
│  │ Project Detail Page                   │  │
│  │                                       │  │
│  │ Youth Exchange Barcelona              │  │
│  │ Status: PLANNING                      │  │
│  │                                       │  │
│  │ Phases (auto-generated):              │  │
│  │ □ Application Phase                   │  │
│  │ □ Accommodation Phase                 │  │
│  │ □ Travel Phase                        │  │
│  │ □ Activities Phase                    │  │
│  │ □ Reporting Phase                     │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘

Time saved: ~10 minutes per conversion
Steps saved: 7 → 1
```

## External Research

### Documentation
- [React Best Practices - Form Submission](https://dev.to/ajones_codes/a-better-guide-to-forms-in-react-47f0) - Use FormData API for uncontrolled forms, handle loading states
- [React Forms Best Practices 2025](https://medium.com/@farzanekazemi8517/best-practices-for-handling-forms-in-react-2025-edition-62572b14452f) - Validate on both client and server, handle errors gracefully
- [Supabase RPC TypeScript](https://supabase.com/docs/reference/javascript/rpc) - Call RPC functions with typed parameters
- [NestJS DTOs and Transformation](https://dev.to/cendekia/mastering-dtos-in-nestjs-24e4) - Use DTOs for data transformation, decouple serialization from business logic

### Key Findings & Best Practices
1. **React API Calls**: Show loading states during submission, handle errors with user-friendly messages, submit without page reloads using AJAX
2. **Validation Strategy**: Validate on both client (immediate feedback) and server (security) - backend validation provides assurance against tampered requests
3. **NestJS Service Patterns**: Use service layer for transformation logic, keep it centralized, transform database models into DTOs using plainToInstance
4. **Error Handling**: Wrap operations in try-catch, provide specific error messages, use proper HTTP status codes

### Gotchas Found
- React mutation hooks should handle both success and error cases
- Always invalidate React Query cache after mutations to refresh data
- Backend should use `prisma.$transaction()` for operations that create multiple records (project + phases)
- Date fields need proper serialization between frontend (ISO strings) and backend (Date objects)

## Patterns to Mirror

### Pattern 1: API Service Function (Frontend)
```typescript
// FROM: frontend/src/services/seeds.api.ts:68-73
// This is how API service functions are structured:
export async function saveSeed(seedId: string): Promise<{ success: boolean }> {
  const response = await api.patch<{ success: boolean }>(
    `/seeds/${seedId}/save`
  )
  return response.data
}
```

**Key characteristics:**
- Use `api` axios instance (includes auth interceptors)
- Generic type parameter for response
- Return `response.data` directly
- Simple, single-purpose functions

### Pattern 2: React Mutation with Navigation (Frontend)
```typescript
// FROM: frontend/src/pages/SeedDetail.tsx:44-54
// This is how mutations with side effects are structured:
const saveMutation = useMutation({
  mutationFn: () => saveSeed(id!),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['seed', id] })
    toast.success('Seed saved!')
  },
  onError: () => {
    toast.error('Failed to save seed')
  },
})
```

**Key characteristics:**
- Use `useMutation` from @tanstack/react-query
- `onSuccess`: Invalidate queries + show success toast + optional navigation
- `onError`: Show error toast
- Access `queryClient` via `useQueryClient()` hook

### Pattern 3: Fastify Route Handler (Backend)
```typescript
// FROM: backend/src/seeds/seeds.routes.ts:109-126
// This is how Fastify POST/PATCH routes are structured:
app.patch('/seeds/:id/save', {
  onRequest: [app.authenticate]
}, async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const { id } = request.params as { id: string }

    const result = await saveSeed(id, userId)

    return reply.send(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'Seed not found or unauthorized') {
      return reply.code(404).send({ error: error.message })
    }
    throw error
  }
})
```

**Key characteristics:**
- Authenticate all requests with `onRequest: [app.authenticate]`
- Extract `userId` from `request.user`
- Extract path params with type assertion
- Parse request body with Zod schema for POST requests
- Call service function with `userId` for authorization
- Handle specific errors with appropriate status codes
- Let unhandled errors bubble up

### Pattern 4: Service Function with Prisma (Backend)
```typescript
// FROM: backend/src/seeds/seeds.service.ts:182-198
// This is how service functions with Prisma updates are structured:
export async function saveSeed(seedId: string, userId: string) {
  const updated = await prisma.seed.updateMany({
    where: {
      id: seedId,
      user_id: userId,
    },
    data: {
      is_saved: true,
    },
  })

  if (updated.count === 0) {
    throw new Error('Seed not found or unauthorized')
  }

  return { success: true }
}
```

**Key characteristics:**
- Use `updateMany` or `deleteMany` for authorization checks (implicit - returns count)
- Include `user_id` in `where` clause for authorization
- Check `count === 0` and throw descriptive error
- Return simple success objects

### Pattern 5: Complex Service with Data Transformation (Backend)
```typescript
// FROM: backend/src/seeds/seeds.service.ts:14-42
// This is how complex create operations with transformation are structured:
export async function generateAndSaveSeeds(
  userId: string,
  input: BrainstormInput
): Promise<GeneratedSeed[]> {
  // Generate seeds using AI
  const generatedSeeds = await generateSeeds(input)

  // Save seeds to database
  const savedSeeds = await Promise.all(
    generatedSeeds.map(async (seed) => {
      return await prisma.seed.create({
        data: {
          user_id: userId,
          title: seed.title,
          description: seed.description,
          approval_likelihood: seed.approvalLikelihood,
          title_formal: seed.titleFormal,
          description_formal: seed.descriptionFormal,
          approval_likelihood_formal: seed.approvalLikelihoodFormal,
          tags: seed.suggestedTags || [],
          estimated_duration: seed.estimated_duration,
          estimated_participants: seed.estimated_participants,
          current_version: seed as any,
        },
      })
    })
  )

  return generatedSeeds
}
```

**Key characteristics:**
- Accept typed input parameters
- Transform data formats (camelCase → snake_case)
- Use `Promise.all` for batch operations
- Map between service types and Prisma types
- Handle optional fields with `||` or `??` operators

### Pattern 6: Button with Loading State (Frontend)
```typescript
// FROM: frontend/src/pages/SeedDetail.tsx:214-220
// This is how action buttons are structured:
{!seed.is_saved && (
  <button
    onClick={() => saveMutation.mutate()}
    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
  >
    Save Seed
  </button>
)}
```

**Key characteristics:**
- Conditional rendering based on state
- Call `mutation.mutate()` on click
- Tailwind CSS classes for styling
- No manual loading state management (React Query handles it)

## Files to Change

| File | Action | Justification |
|------|--------|---------------|
| `backend/src/seeds/seeds.routes.ts` | UPDATE | Add new POST route `/seeds/:id/convert` that calls `convertSeedToProject()` service |
| `backend/src/seeds/seeds.service.ts` | UPDATE | Add `convertSeedToProject()` function that creates project from seed data |
| `backend/src/seeds/seeds.schemas.ts` | UPDATE | Add Zod schema for conversion request validation (if needed for options) |
| `frontend/src/services/seeds.api.ts` | UPDATE | Add `convertSeedToProject()` API service function |
| `frontend/src/types/seeds.ts` | UPDATE | Add `ConvertSeedToProjectResponse` type definition |
| `frontend/src/pages/SeedDetail.tsx` | UPDATE | Add "Convert to Project" button with mutation hook |

## NOT Building

- ❌ **Custom phase configuration during conversion** - v1 uses intelligent defaults, user can edit phases after conversion
- ❌ **Seed status tracking (CONVERTED)** - Not tracking conversion history in v1, seeds remain unchanged after conversion
- ❌ **Undo conversion** - If user doesn't like the project, they delete it manually
- ❌ **Batch conversion** - Converting multiple seeds at once (one seed at a time for v1)
- ❌ **Project template selection** - v1 uses single default template, future versions could offer templates
- ❌ **AI-powered phase generation** - v1 uses rule-based defaults, AI enhancement is future work
- ❌ **Budget allocation algorithm** - Phases created with `budget_allocated: 0`, user fills in manually

## Tasks

### Task 1: Add ConvertSeedToProjectResponse type (Frontend)

**Why**: Frontend needs type definitions for the API response to enable TypeScript type checking and autocomplete.

**Mirror**: `frontend/src/types/seeds.ts:79-89` (existing API response types)

**Do**:
Add the following type definition to `frontend/src/types/seeds.ts`:

```typescript
export interface ConvertSeedToProjectResponse {
  project: {
    id: string
    name: string
    type: string
    status: string
    description: string | null
    start_date: string
    end_date: string
    budget_total: number
    participants_count: number
    location: string
    created_at: string
  }
}
```

**Don't**:
- Don't include full project relations (phases, etc.) - API returns project ID and basic fields only
- Don't add optional fields that backend won't return

**Verify**: `npm run build` in frontend directory (TypeScript compilation succeeds)

---

### Task 2: Add convertSeedToProject API service function (Frontend)

**Why**: Frontend needs a service function to call the backend conversion endpoint.

**Mirror**: `frontend/src/services/seeds.api.ts:68-73` (saveSeed pattern)

**Do**:
Add the following function to `frontend/src/services/seeds.api.ts`:

```typescript
/**
 * Convert a seed to a project
 */
export async function convertSeedToProject(
  seedId: string
): Promise<ConvertSeedToProjectResponse> {
  const response = await api.post<ConvertSeedToProjectResponse>(
    `/seeds/${seedId}/convert`
  )
  return response.data
}
```

**Don't**:
- Don't add request body parameters - conversion uses seed data directly
- Don't call multiple endpoints - this is a single atomic operation

**Verify**: `npm run build` in frontend directory (function imports and types correctly)

---

### Task 3: Add Convert to Project button and mutation (Frontend)

**Why**: User needs a UI trigger to initiate conversion and see loading/success/error states.

**Mirror**: `frontend/src/pages/SeedDetail.tsx:44-54` (saveMutation pattern) and `frontend/src/pages/SeedDetail.tsx:214-220` (button pattern)

**Do**:
1. Import the service function at the top of `frontend/src/pages/SeedDetail.tsx`:
```typescript
import { getSeed, elaborateSeed, saveSeed, deleteSeed, convertSeedToProject } from '../services/seeds.api'
```

2. Add the mutation hook after the existing `deleteMutation` (around line 66):
```typescript
// Convert to project mutation
const convertMutation = useMutation({
  mutationFn: () => convertSeedToProject(id!),
  onSuccess: (response) => {
    toast.success('Project created successfully!')
    navigate(`/projects/${response.project.id}`)
  },
  onError: () => {
    toast.error('Failed to convert seed to project')
  },
})
```

3. Add the "Convert to Project" button in the Actions section (around line 213, before the Save button):
```typescript
{/* Actions */}
<div className="flex gap-2 mt-4">
  <button
    onClick={() => convertMutation.mutate()}
    disabled={convertMutation.isPending}
    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
  >
    {convertMutation.isPending ? 'Converting...' : 'Convert to Project'}
  </button>
  {!seed.is_saved && (
    <button
```

**Don't**:
- Don't add confirmation dialog - conversion is non-destructive (seed remains unchanged)
- Don't invalidate seed query on success - we're navigating away
- Don't show convert button if project already exists (v1 doesn't track this)

**Verify**:
```bash
npm run dev
# Navigate to a seed detail page
# Click "Convert to Project" button
# Should show loading state then navigate (will fail until backend implemented)
```

---

### Task 4: Add Zod validation schema for conversion (Backend - Optional)

**Why**: Though conversion has no request body parameters, adding an empty schema provides consistency and future extensibility.

**Mirror**: `backend/src/seeds/seeds.schemas.ts:9-12` (SeedElaborationInputSchema pattern)

**Do**:
This task is **OPTIONAL** for v1. If you want to add it for consistency, add to `backend/src/seeds/seeds.schemas.ts`:

```typescript
export const ConvertSeedToProjectSchema = z.object({
  seedId: z.string().cuid(),
  // Future: projectType override, customPhases options, etc.
})
```

However, since we have no body parameters in v1, you can skip this and use path param only.

**Don't**:
- Don't validate request body if there are no parameters

**Verify**: If added, `npm run build` in backend directory

---

### Task 5: Add convertSeedToProject service function (Backend)

**Why**: Core business logic for creating a project from seed data with intelligent defaults.

**Mirror**: `backend/src/seeds/seeds.service.ts:14-42` (generateAndSaveSeeds pattern - data transformation) and `backend/src/seeds/seeds.service.ts:77-93` (getSeedById pattern - authorization)

**Do**:
Add the following function to `backend/src/seeds/seeds.service.ts`:

```typescript
/**
 * Convert seed to project with default phases
 */
export async function convertSeedToProject(seedId: string, userId: string) {
  // Load seed with authorization check
  const seed = await getSeedById(seedId, userId)

  // Calculate project dates from estimated duration
  const startDate = new Date()
  startDate.setDate(startDate.getDate() + 30) // Default: 30 days in future

  const estimatedDays = seed.estimated_duration || 14 // Default: 14 days
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + estimatedDays)

  // Determine project type from seed tags
  const tags = seed.tags || []
  let projectType: 'STUDENT_EXCHANGE' | 'TRAINING' | 'CONFERENCE' | 'CUSTOM' = 'CUSTOM'
  if (tags.some(t => t.toLowerCase().includes('exchange') || t.toLowerCase().includes('mobility'))) {
    projectType = 'STUDENT_EXCHANGE'
  } else if (tags.some(t => t.toLowerCase().includes('training') || t.toLowerCase().includes('course'))) {
    projectType = 'TRAINING'
  } else if (tags.some(t => t.toLowerCase().includes('conference') || t.toLowerCase().includes('seminar'))) {
    projectType = 'CONFERENCE'
  }

  // Use transaction to create project and phases atomically
  const project = await prisma.$transaction(async (tx) => {
    // Create project from seed data
    const newProject = await tx.project.create({
      data: {
        name: seed.title_formal || seed.title,
        type: projectType,
        status: 'PLANNING',
        description: seed.description_formal || seed.description,
        start_date: startDate,
        end_date: endDate,
        budget_total: 50000, // Default budget (EUR)
        participants_count: seed.estimated_participants || 20,
        location: 'TBD', // User will update
        created_by: userId,
        metadata: {
          converted_from_seed_id: seed.id,
          original_approval_likelihood: seed.approval_likelihood_formal || seed.approval_likelihood,
        },
      },
    })

    // Generate default phases
    const defaultPhases = [
      { name: 'Application Phase', type: 'APPLICATION', order: 1, duration: 7 },
      { name: 'Accommodation Booking', type: 'ACCOMMODATION', order: 2, duration: 3 },
      { name: 'Travel Arrangements', type: 'TRAVEL', order: 3, duration: 2 },
      { name: 'Activities Planning', type: 'ACTIVITIES', order: 4, duration: 1 },
      { name: 'Final Reporting', type: 'REPORTING', order: 5, duration: 1 },
    ]

    // Calculate phase dates
    let phaseStartDate = new Date(startDate)
    for (const phaseTemplate of defaultPhases) {
      const phaseEndDate = new Date(phaseStartDate)
      phaseEndDate.setDate(phaseEndDate.getDate() + phaseTemplate.duration)

      await tx.phase.create({
        data: {
          project_id: newProject.id,
          name: phaseTemplate.name,
          type: phaseTemplate.type,
          status: 'NOT_STARTED',
          start_date: phaseStartDate,
          end_date: phaseEndDate,
          deadline: phaseEndDate,
          budget_allocated: 0, // User will allocate budget
          budget_spent: 0,
          order: phaseTemplate.order,
          dependencies: [],
          editable: true,
          skippable: true,
        },
      })

      // Next phase starts after previous ends
      phaseStartDate = new Date(phaseEndDate)
    }

    return newProject
  })

  return { project }
}
```

**Don't**:
- Don't modify the seed (seed remains unchanged - no status field)
- Don't try to parse budget from seed description (use fixed default)
- Don't create assignments/communications/quotes (empty project)
- Don't validate if seed has been converted before (v1 allows multiple conversions)

**Verify**:
```bash
npm run build
# TypeScript compilation succeeds
```

---

### Task 6: Add POST /seeds/:id/convert route (Backend)

**Why**: Expose conversion functionality through REST API endpoint.

**Mirror**: `backend/src/seeds/seeds.routes.ts:109-126` (PATCH /seeds/:id/save pattern)

**Do**:
Add the following route handler to `backend/src/seeds/seeds.routes.ts` after the DELETE route (around line 164):

```typescript
// POST /seeds/:id/convert - Convert seed to project
app.post('/seeds/:id/convert', {
  onRequest: [app.authenticate]
}, async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = (request.user as any).userId
    const { id } = request.params as { id: string }

    const result = await convertSeedToProject(id, userId)

    return reply.code(201).send(result)
  } catch (error) {
    if (error instanceof Error && error.message === 'Seed not found') {
      return reply.code(404).send({ error: error.message })
    }
    throw error
  }
})
```

Also, import the service function at the top of the file (around line 13):
```typescript
import {
  generateAndSaveSeeds,
  listUserSeeds,
  getSeedById,
  elaborateSeedConversation,
  saveSeed,
  dismissSeed,
  deleteSeed,
  convertSeedToProject,
} from './seeds.service.js'
```

**Don't**:
- Don't accept request body parameters (conversion uses seed data)
- Don't return full project with relations (basic project object only)
- Don't use code 200 - use 201 for resource creation

**Verify**:
```bash
npm run dev
# Backend starts without errors
```

---

## Validation Plan

### Automated Checks
- [ ] `npm run build` (backend) - TypeScript types valid, no compilation errors
- [ ] `npm run build` (frontend) - TypeScript types valid, no compilation errors
- [ ] `npm run dev` (backend) - Server starts successfully, no runtime errors
- [ ] `npm run dev` (frontend) - Frontend builds and runs, no console errors

### New Tests to Write

#### Manual Unit Test for Service Function
**Test file**: `backend/src/seeds/seeds.service.test.ts` (create if doesn't exist)

Since the project uses Vitest (from package.json), write unit tests following this pattern:

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { convertSeedToProject, getSeedById } from './seeds.service'
import { prisma } from '../config/database'

describe('convertSeedToProject', () => {
  let testUserId: string
  let testSeedId: string

  beforeAll(async () => {
    // Create test user and seed
    const user = await prisma.user.create({
      data: {
        email: 'test-convert@example.com',
        password_hash: 'hash',
        name: 'Test User',
      },
    })
    testUserId = user.id

    const seed = await prisma.seed.create({
      data: {
        user_id: testUserId,
        title: 'Test Seed',
        description: 'Test description for conversion',
        title_formal: 'Formal Test Seed',
        description_formal: 'Formal description',
        approval_likelihood: 0.8,
        approval_likelihood_formal: 0.85,
        tags: ['exchange', 'youth'],
        estimated_duration: 10,
        estimated_participants: 30,
      },
    })
    testSeedId = seed.id
  })

  afterAll(async () => {
    // Cleanup
    await prisma.project.deleteMany({ where: { created_by: testUserId } })
    await prisma.seed.deleteMany({ where: { user_id: testUserId } })
    await prisma.user.delete({ where: { id: testUserId } })
  })

  it('should create project with correct seed data', async () => {
    const result = await convertSeedToProject(testSeedId, testUserId)

    expect(result.project).toBeDefined()
    expect(result.project.name).toBe('Formal Test Seed')
    expect(result.project.type).toBe('STUDENT_EXCHANGE') // Tag-based detection
    expect(result.project.participants_count).toBe(30)
    expect(result.project.status).toBe('PLANNING')
  })

  it('should create 5 default phases', async () => {
    const result = await convertSeedToProject(testSeedId, testUserId)

    const phases = await prisma.phase.findMany({
      where: { project_id: result.project.id },
      orderBy: { order: 'asc' },
    })

    expect(phases).toHaveLength(5)
    expect(phases[0].type).toBe('APPLICATION')
    expect(phases[1].type).toBe('ACCOMMODATION')
    expect(phases[2].type).toBe('TRAVEL')
    expect(phases[3].type).toBe('ACTIVITIES')
    expect(phases[4].type).toBe('REPORTING')
  })

  it('should throw error for non-existent seed', async () => {
    await expect(
      convertSeedToProject('invalid-id', testUserId)
    ).rejects.toThrow('Seed not found')
  })

  it('should throw error for unauthorized access', async () => {
    await expect(
      convertSeedToProject(testSeedId, 'other-user-id')
    ).rejects.toThrow('Seed not found')
  })
})
```

**To run**: `npm test seeds.service.test.ts` in backend directory

---

### Manual Validation Steps

#### Step 1: Create and Elaborate a Seed
```bash
# Start backend
cd project-pipeline/backend
npm run dev

# Start frontend (in new terminal)
cd project-pipeline/frontend
npm run dev

# Open browser: http://localhost:5173
```

1. Log in with test user
2. Navigate to "Seed Generation" page
3. Generate seeds with prompt: "Youth exchange program in Barcelona focused on sustainability"
4. Click on a seed to view details
5. Elaborate the seed with 2-3 messages (optional - improves formal versions)

#### Step 2: Test Conversion Flow
1. On Seed Detail page, verify "Convert to Project" button is visible
2. Click "Convert to Project"
3. **Expected behavior**:
   - Button text changes to "Converting..."
   - Button becomes disabled
   - After ~1-2 seconds, success toast appears: "Project created successfully!"
   - Page navigates to `/projects/{new-id}`
4. **On Project Detail page, verify**:
   - Project name matches seed's formal title (or regular title if no formal)
   - Description matches seed's formal description
   - Status is "PLANNING"
   - Participants count matches seed
   - Type is intelligently set based on tags
   - 5 phases exist: Application, Accommodation, Travel, Activities, Reporting
   - All phases have status "NOT_STARTED"

#### Step 3: Test Error Handling
```bash
# In browser console, simulate API error:
# 1. Open Network tab
# 2. Right-click on convert request
# 3. Block request URL pattern
# 4. Try conversion again

# Expected: Error toast appears: "Failed to convert seed to project"
# Expected: User remains on seed detail page
# Expected: Button returns to enabled state
```

#### Step 4: Test Backend Endpoint Directly
```bash
# Get auth token from localStorage in browser console:
# localStorage.getItem('auth_token')

# Test conversion endpoint
curl -X POST http://localhost:4000/seeds/{seed-id}/convert \
  -H "Authorization: Bearer {your-token}" \
  -H "Content-Type: application/json"

# Expected response (201 Created):
{
  "project": {
    "id": "...",
    "name": "Formal Seed Title",
    "type": "STUDENT_EXCHANGE",
    "status": "PLANNING",
    "description": "...",
    "start_date": "2026-02-10T...",
    "end_date": "2026-02-24T...",
    "budget_total": 50000,
    "participants_count": 30,
    "location": "TBD",
    "created_at": "..."
  }
}

# Test with invalid seed ID (404):
curl -X POST http://localhost:4000/seeds/invalid-id/convert \
  -H "Authorization: Bearer {your-token}"

# Expected: 404 with error message

# Test without auth token (401):
curl -X POST http://localhost:4000/seeds/{seed-id}/convert

# Expected: 401 Unauthorized
```

---

### Edge Cases to Test

#### Edge Case 1: Seed with Missing Optional Fields
1. Create seed with no `estimated_duration` or `estimated_participants`
2. Convert to project
3. **Expected**: Uses defaults (14 days, 20 participants)

#### Edge Case 2: Seed with No Formal Versions
1. Create seed, don't elaborate (no formal title/description)
2. Convert to project
3. **Expected**: Uses informal title and description

#### Edge Case 3: Seed with No Tags
1. Create seed with empty tags array
2. Convert to project
3. **Expected**: Project type is "CUSTOM"

#### Edge Case 4: Seed with Very Long Estimated Duration
1. Create seed with `estimated_duration: 60` (should be capped at 21 by schema, but test if manually set)
2. Convert to project
3. **Expected**: Project end_date is start_date + 60 days (handles long durations)

#### Edge Case 5: Multiple Conversions from Same Seed
1. Convert seed to project (succeeds)
2. Convert same seed again
3. **Expected**: Creates second project (v1 doesn't prevent duplicates)
4. Both projects exist independently

#### Edge Case 6: Project Type Detection from Tags
Test tag-based type detection:
- Tags: `["youth", "exchange"]` → Expected type: `STUDENT_EXCHANGE`
- Tags: `["training", "workshop"]` → Expected type: `TRAINING`
- Tags: `["conference", "meeting"]` → Expected type: `CONFERENCE`
- Tags: `["other", "custom"]` → Expected type: `CUSTOM`

#### Edge Case 7: Phase Date Calculation
1. Convert seed with `estimated_duration: 14`
2. Check phase dates
3. **Expected**:
   - Application phase: 7 days
   - Accommodation: 3 days
   - Travel: 2 days
   - Activities: 1 day
   - Reporting: 1 day
   - Total: 14 days
   - Each phase starts when previous ends

#### Edge Case 8: Transaction Rollback on Phase Creation Failure
This is hard to test manually, but conceptually:
- If phase creation fails mid-transaction, project creation should also roll back
- Database should remain consistent (no orphaned project without phases)

---

### Regression Check

**Verify existing features still work:**

1. **Seed Generation** (`/seeds/generate`)
   - Navigate to Seed Generation page
   - Generate seeds with a prompt
   - Expected: Seeds appear in list

2. **Seed Elaboration** (`/seeds/:id/elaborate`)
   - View seed detail
   - Send elaboration message
   - Expected: Chat updates, seed values update

3. **Save Seed** (`/seeds/:id/save`)
   - Click "Save Seed" button
   - Expected: Success toast, button disappears

4. **Delete Seed** (`/seeds/:id`)
   - Click "Delete" button, confirm
   - Expected: Navigates to garden, seed removed

5. **Project Creation** (`/projects/create`)
   - Navigate to Create Project page
   - Fill form manually
   - Expected: Project created successfully

6. **Project Detail** (`/projects/:id`)
   - View existing project
   - Expected: Phases listed, project info correct

**Manual regression test script:**
```bash
# 1. Generate seeds
# 2. Elaborate one seed
# 3. Save one seed
# 4. Delete one seed
# 5. Create project manually
# 6. View project detail
# 7. Convert remaining seed to project
# 8. Verify all operations succeeded
```

---

## Risks

### Risk 1: Transaction Performance
**What**: Creating project + 5 phases in a transaction might be slow for concurrent requests.
**Mitigation**: Use `prisma.$transaction()` which is optimized. Monitor in production.
**Likelihood**: Low - 6 DB inserts is fast enough.

### Risk 2: Date Calculation Edge Cases
**What**: Date math with timezones could produce unexpected start/end dates.
**Mitigation**: Use UTC dates consistently. Test with seeds created in different timezones.
**Likelihood**: Medium - dates are tricky, but defaults are reasonable.

### Risk 3: Tag-Based Type Detection Brittleness
**What**: Type detection relies on keywords in tags, which could be inconsistent.
**Mitigation**: Default to "CUSTOM" type for unknown patterns. User can change type after creation.
**Likelihood**: Medium - but impact is low (user can edit).

### Risk 4: Duplicate Project Creation
**What**: User might accidentally convert same seed multiple times.
**Mitigation**: v1 allows this intentionally (seed is a template). Future: add "already converted" indicator.
**Likelihood**: High - but intended behavior for v1.

### Risk 5: Missing Authorization Check
**What**: If `getSeedById` doesn't enforce user ownership, could convert other users' seeds.
**Mitigation**: `getSeedById` already includes authorization check (uses `user_id` in WHERE clause).
**Likelihood**: Very Low - existing function is secure.

---

## External Research References

### Sources
- [A Better Guide to Forms in React](https://dev.to/ajones_codes/a-better-guide-to-forms-in-react-47f0) - FormData API best practices
- [Best Practices for Handling Forms in React (2025 Edition)](https://medium.com/@farzanekazemi8517/best-practices-for-handling-forms-in-react-2025-edition-62572b14452f) - Validation strategy, error handling
- [JavaScript: Call a Postgres function - Supabase](https://supabase.com/docs/reference/javascript/rpc) - RPC function patterns (similar to our REST API)
- [Mastering DTOs in NestJS](https://dev.to/cendekia/mastering-dtos-in-nestjs-24e4) - Data transformation in service layer
- [Combining Validators and Transformers in NestJS](https://www.thisdot.co/blog/combining-validators-and-transformers-in-nestjs) - Zod patterns
