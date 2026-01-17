# Fix Working vs Formal Mode Toggle + Extend to Brainstorming & Seed Garden

## Issue Summary

**GitHub Issue #8**: The working/formal mode toggle button exists in the header but does nothing when clicked. Additionally, the feature needs to be extended to affect the new brainstorming playground and seed garden features.

## Current State Analysis

### ✅ What's Already Implemented

1. **Store Implementation** (`app/src/lib/stores/contentModeStore.ts`)
   - Zustand store with persist middleware
   - Properly configured with `toggleMode()` function
   - localStorage persistence enabled
   - Computed properties `isWorking` and `isFormal`

2. **UI Components**
   - `ContentModeToggle.tsx` - Toggle button component in header
   - `ContentModeBadge.tsx` - Badge to show mode and warnings
   - `ContentFieldDisplay.tsx` - Field display helper component
   - Header integration complete

3. **Utility Hooks** (`app/src/lib/hooks/useContentField.ts`)
   - `useContentField()` - Hook to get field value based on mode
   - `getContentFieldValue()` - Helper function
   - `hasFormalVersion()` - Check if formal version exists
   - `getFieldName()` - Get field name based on mode

4. **Database Schema**
   - Formal fields added to `Project` model (5 fields)
   - Formal fields added to `ProgrammeDay` model (3 fields)
   - Formal fields added to `ProgrammeSession` model (3 fields)
   - **MISSING**: Formal fields for `Seed` and `BrainstormSession` models

5. **AI Chains**
   - `content-formalization.ts` - Formalization chain exists
   - Project and Programme generation updated to produce both modes
   - **MISSING**: Seed generation and elaboration don't produce formal versions

### ❌ What's Broken/Missing

1. **No Integration with Existing Pages**
   - Project detail page (`projects/[id]/page.tsx`) - NOT using `useContentField()`
   - Programme page (`projects/[id]/programme/page.tsx`) - NOT using `useContentField()`
   - Toggle exists but fields don't respond to mode changes

2. **Brainstorming Playground Not Integrated**
   - Seed generation prompt doesn't produce formal versions
   - `BrainstormSession` model lacks formal field tracking
   - UI doesn't show/hide based on mode
   - No formal versions in database schema

3. **Seed Garden Not Integrated**
   - `Seed` model lacks formal versions for title/description
   - Seed elaboration chain doesn't maintain formal versions
   - Seed detail/elaboration page doesn't respond to mode
   - No formal version fields in database

4. **Missing AI Prompting**
   - `seed-generation.ts` prompt doesn't request both modes
   - `seed-elaboration.ts` prompt doesn't maintain both modes
   - Formalization chain not integrated for seeds

## Root Cause

The toggle component exists and the store works correctly, but:

1. **Pages aren't using the store** - Project and programme pages display fields directly instead of using `useContentField()` hook
2. **Incomplete database schema** - Seeds don't have formal field columns
3. **AI prompts not updated** - Seed generation doesn't produce formal versions
4. **Missing UI integration** - Brainstorm/seed pages don't check content mode

## Implementation Plan

### Phase 1: Fix Existing Project/Programme Pages (Priority: HIGH)

**Goal**: Make the toggle work for projects and programmes as originally intended

**Tasks**:

1. **Update Project Detail Page** (`app/src/app/(dashboard)/projects/[id]/page.tsx`)
   - Import `useContentField` hook
   - Replace direct field access with `useContentField()` for all 5 fields:
     - `targetGroupDescription` / `targetGroupDescriptionFormal`
     - `inclusionPlanOverview` / `inclusionPlanOverviewFormal`
     - `partnerProfile` / `partnerProfileFormal`
     - `sustainabilityNarrative` / `sustainabilityNarrativeFormal`
     - `impactNarrative` / `impactNarrativeFormal`
   - Add `ContentModeBadge` to each section header

2. **Update Programme Page** (`app/src/app/(dashboard)/projects/[id]/programme/page.tsx`)
   - Import `useContentField` hook
   - Replace direct field access for day focus fields (3):
     - `morningFocus` / `morningFocusFormal`
     - `afternoonFocus` / `afternoonFocusFormal`
     - `eveningFocus` / `eveningFocusFormal`
   - Replace direct field access for session fields (3):
     - `title` / `titleFormal`
     - `description` / `descriptionFormal`
     - `preparationNotes` / `preparationNotesFormal`
   - Add `ContentModeBadge` components

**Validation**:
- Toggle in header switches all 11 fields
- Mode persists across page refreshes
- Warning badges show when formal version missing
- No console errors

---

### Phase 2: Extend to Brainstorming & Seed Garden (Priority: HIGH)

**Goal**: Add formal/working mode support to brainstorming and seed features

#### 2.1 Database Schema Updates

**Update Prisma Schema** (`app/prisma/schema.prisma`)

Add formal fields to `Seed` model:

```prisma
model Seed {
  id        String @id @default(uuid()) @db.Uuid
  sessionId String @map("session_id") @db.Uuid
  tenantId  String @map("tenant_id") @db.Uuid
  userId    String @map("user_id")

  // Working mode (original)
  title              String @db.VarChar(200)
  description        String @db.Text
  approvalLikelihood Float  @default(0.5) @map("approval_likelihood")

  // NEW: Formal mode equivalents
  titleFormal              String? @db.VarChar(200) @map("title_formal")
  descriptionFormal        String? @db.Text @map("description_formal")
  approvalLikelihoodFormal Float?  @map("approval_likelihood_formal")

  // ... rest of model
}
```

**Create Migration**:
```bash
npx prisma migrate dev --name add_seed_formal_fields
```

#### 2.2 Update AI Prompts

**Update Seed Generation Prompt** (`app/src/lib/ai/prompts/seed-generation.ts`)

Modify prompt to request both working and formal versions:

```typescript
FOR EACH SEED GENERATE:

**Title** (5-10 words):
Generate TWO versions:

WORKING MODE:
- Memorable and evocative
- Clearly hints at the theme
- Professional yet creative
- Example: "Ocean Guardians: Youth Leading Marine Conservation"

FORMAL MODE:
- Same content in official Erasmus+ terminology
- Professional and institutional tone
- Application-ready language
- Example: "Capacity Building for Youth-Led Environmental Stewardship: Marine Ecosystem Conservation"

**Description** (100-150 words):
Generate TWO versions:

WORKING MODE:
- Informal, engaging tone (like talking to a friend)
- Use specific details and examples
- Natural language

FORMAL MODE:
- Professional EU application language
- Use Erasmus+ terminology and frameworks
- Reference Key Actions, learning outcomes, intercultural dialogue
- Suitable for official documentation

**Approval Likelihood** (0.0-1.0):
Generate TWO scores:

WORKING MODE SCORE:
- Based on the working language version
- How compelling and authentic it is

FORMAL MODE SCORE:
- Based on the formal language version
- How well it aligns with Erasmus+ evaluation criteria
- How application-ready the language is
```

**Update Output Schema** (`app/src/lib/schemas/brainstorm.ts`):

```typescript
export const GeneratedSeedSchema = z.object({
  // Working mode
  title: z.string().min(5).max(200),
  description: z.string().min(50).max(2000),
  approvalLikelihood: z.number().min(0.0).max(1.0),

  // NEW: Formal mode
  titleFormal: z.string().min(5).max(200),
  descriptionFormal: z.string().min(50).max(2000),
  approvalLikelihoodFormal: z.number().min(0.0).max(1.0),

  // Shared fields
  suggestedTags: z.array(z.string()).optional(),
  estimatedDuration: z.number().int().min(5).max(21).optional(),
  estimatedParticipants: z.number().int().min(16).max(60).optional(),
})
```

#### 2.3 Update Seed Elaboration Chain

**Update Seed Elaboration Prompt** (`app/src/lib/ai/prompts/seed-elaboration.ts`)

Add instruction to maintain both versions:

```typescript
YOUR TASK:
Based on the user's message, provide suggestions and updates to the seed.

IMPORTANT: Always maintain BOTH working mode and formal mode versions.

When updating content:
- Update working version: Keep informal, authentic, conversational
- Update formal version: Keep professional, use Erasmus+ terminology, application-ready

When the user asks for changes:
- Apply changes to BOTH versions appropriately
- Working version: Natural language changes
- Formal version: Translate changes to professional EU terminology
```

**Update Response Schema**:

```typescript
export const ElaborationResponseSchema = z.object({
  message: z.string(),
  suggestions: z.array(SeedSuggestionSchema),
  updatedSeed: GeneratedSeedSchema, // This now includes formal fields
  updatedApprovalLikelihood: z.number().min(0.0).max(1.0),
  updatedApprovalLikelihoodFormal: z.number().min(0.0).max(1.0), // NEW
})
```

#### 2.4 Update Brainstorm Router

**Update Seed Saving** (`app/src/server/routers/brainstorm.ts`)

In `generate` mutation, save formal fields when creating seeds:

```typescript
// In generateBrainstormSession function
await ctx.prisma.seed.createMany({
  data: generatedSeeds.map(seed => ({
    sessionId: session.id,
    tenantId,
    userId,
    // Working mode
    title: seed.title,
    description: seed.description,
    approvalLikelihood: seed.approvalLikelihood,
    // NEW: Formal mode
    titleFormal: seed.titleFormal,
    descriptionFormal: seed.descriptionFormal,
    approvalLikelihoodFormal: seed.approvalLikelihoodFormal,
    // ... other fields
  }))
})
```

#### 2.5 Update Brainstorm UI

**Update Brainstorm Page** (`app/src/app/(dashboard)/brainstorm/page.tsx`)

- Import `useContentModeStore`
- No changes needed to seed generation (works in background)
- SeedCard will handle mode display

**Update SeedCard Component** (`app/src/components/brainstorm/SeedCard.tsx`)

```typescript
'use client'

import { useContentField } from '@/lib/hooks/useContentField'
import { ContentModeBadge } from '@/components/ui/ContentModeBadge'

export default function SeedCard({ seed, ... }) {
  const displayTitle = useContentField(seed.title, seed.titleFormal)
  const displayDescription = useContentField(seed.description, seed.descriptionFormal)
  const { mode } = useContentModeStore()
  const displayLikelihood = mode === 'formal'
    ? seed.approvalLikelihoodFormal || seed.approvalLikelihood
    : seed.approvalLikelihood

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle>{displayTitle}</CardTitle>
          <ContentModeBadge formalValue={seed.titleFormal} />
        </div>
      </CardHeader>
      <CardContent>
        <p>{displayDescription}</p>
        <ApprovalLikelihoodMeter value={displayLikelihood} />
      </CardContent>
    </Card>
  )
}
```

**Update Seed Elaboration Page** (`app/src/app/(dashboard)/seeds/[id]/page.tsx`)

```typescript
'use client'

import { useContentField } from '@/lib/hooks/useContentField'
import { ContentModeBadge } from '@/components/ui/ContentModeBadge'

export default function SeedElaborationPage() {
  const displayTitle = useContentField(
    currentVersion?.title || seed.title,
    currentVersion?.titleFormal || seed.titleFormal
  )
  const displayDescription = useContentField(
    currentVersion?.description || seed.description,
    currentVersion?.descriptionFormal || seed.descriptionFormal
  )

  return (
    <div>
      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle>Live Preview</CardTitle>
            <ContentModeBadge formalValue={seed.titleFormal} />
          </div>
        </CardHeader>
        <CardContent>
          <div>
            <label>Title</label>
            <p>{displayTitle}</p>
          </div>
          <div>
            <label>Description</label>
            <p>{displayDescription}</p>
          </div>
        </CardContent>
      </Card>
      {/* ... rest */}
    </div>
  )
}
```

#### 2.6 Update Seed Generation Service

**Update Seed Generator** (`app/src/server/services/brainstorm-generator.ts`)

Ensure formal fields are saved when creating seeds from AI output.

---

### Phase 3: Testing & Validation

**Test Checklist**:

1. **Toggle Functionality**
   - [ ] Toggle in header switches between Working/Formal
   - [ ] Badge updates to show current mode
   - [ ] Mode persists across page refreshes

2. **Project Pages**
   - [ ] All 5 project fields switch with toggle
   - [ ] Warning badges show when formal version missing
   - [ ] No layout shifts or errors

3. **Programme Pages**
   - [ ] All 6 programme fields switch with toggle (3 day + 3 session)
   - [ ] Fields gracefully fallback to working when formal missing

4. **Brainstorm Playground**
   - [ ] Generated seeds include both working and formal versions
   - [ ] Seed cards display correct version based on toggle
   - [ ] Approval likelihood updates based on mode
   - [ ] No errors during generation

5. **Seed Garden & Elaboration**
   - [ ] Saved seeds show/hide fields based on mode
   - [ ] Elaboration maintains both versions
   - [ ] Live preview updates when toggle clicked
   - [ ] Conversation AI maintains both modes

6. **Edge Cases**
   - [ ] Old seeds without formal fields show warning
   - [ ] Toggle works across all pages in same session
   - [ ] No race conditions with localStorage

---

## Files to Modify

### Phase 1 (Fix Existing)
1. `app/src/app/(dashboard)/projects/[id]/page.tsx`
2. `app/src/app/(dashboard)/projects/[id]/programme/page.tsx`

### Phase 2 (Extend to Seeds)

**Database**:
3. `app/prisma/schema.prisma`
4. Create new migration file

**AI Prompts**:
5. `app/src/lib/ai/prompts/seed-generation.ts`
6. `app/src/lib/ai/prompts/seed-elaboration.ts`

**Schemas**:
7. `app/src/lib/schemas/brainstorm.ts`

**Backend**:
8. `app/src/server/routers/brainstorm.ts`
9. `app/src/server/services/brainstorm-generator.ts`
10. `app/src/inngest/functions/generate-seeds.ts`

**Frontend**:
11. `app/src/components/brainstorm/SeedCard.tsx`
12. `app/src/app/(dashboard)/brainstorm/page.tsx`
13. `app/src/app/(dashboard)/seeds/[id]/page.tsx`

---

## Implementation Order

1. **Fix toggle for projects/programmes** (Phase 1) - Quick win, immediate visible fix
2. **Add database fields for seeds** (Phase 2.1) - Foundation for seed integration
3. **Update AI prompts** (Phase 2.2) - Enable dual-mode generation
4. **Update backend** (Phase 2.3-2.4) - Save both modes
5. **Update UI** (Phase 2.5) - Make toggle work for seeds
6. **Test everything** (Phase 3) - Comprehensive validation

---

## Success Criteria

- [ ] Toggle in header switches ALL content (projects, programmes, seeds)
- [ ] Mode persists across browser sessions
- [ ] New seed generation produces both working and formal versions
- [ ] Seed elaboration maintains both versions
- [ ] Warning badges show when formal version is missing
- [ ] No regressions in existing functionality
- [ ] All TypeScript compilation succeeds
- [ ] No console errors

---

## Estimated Effort

- **Phase 1** (Fix existing): 1-2 hours
- **Phase 2** (Extend to seeds): 4-6 hours
  - Database: 30 min
  - AI prompts: 1 hour
  - Backend: 1-2 hours
  - Frontend: 1.5-2 hours
  - Integration: 1 hour
- **Phase 3** (Testing): 1-2 hours

**Total**: 6-10 hours

---

## Notes

- The toggle infrastructure is already complete and working
- Main issue is lack of integration in page components
- Seeds need same treatment as projects/programmes
- AI prompts need careful tuning to produce quality formal versions
- Consider adding "Formalize" button for old seeds without formal versions
