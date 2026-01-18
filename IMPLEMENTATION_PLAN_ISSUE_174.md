# Implementation Plan: Frontend UI Verification & Completion (Issue #174)

**Epic:** 001-seed-elaboration-validation
**Issue:** #3 of 7
**Status:** In Progress
**Estimated:** 8 hours
**Created:** 2026-01-18

---

## Executive Summary

This issue requires verification and completion of frontend UI components for the seed elaboration endpoints. The investigation reveals that:

### Current State
1. **Backend API exists** - The `project-pipeline/backend` has fully implemented conversational elaboration endpoints:
   - `POST /seeds/:id/elaborate/start`
   - `POST /seeds/:id/elaborate/answer`
   - `GET /seeds/:id/elaborate/status`

2. **Frontend UI exists** - The `project-pipeline/frontend` has comprehensive UI components:
   - `ConversationalElaboration.tsx` - Main orchestrator
   - `SeedElaborationChat.tsx` - Chat interface
   - `ProgressIndicator.tsx` - Progress tracking (0-100%)
   - `MetadataPreview.tsx` - Seed metadata display
   - `elaborationStore.ts` - State management

3. **Main app has different implementation** - The `app/` workspace has:
   - Different seed elaboration UI at `/seeds/[id]/page.tsx`
   - tRPC endpoints instead of REST API
   - Different chat interface implementation
   - **Missing**: Conversational question flow UI
   - **Missing**: Progress indicator (0-100%)
   - **Missing**: 7-question structured flow

### The Gap
The `project-pipeline` directory contains a **standalone prototype** with the PRD-specified conversational UI, while the **main app** (`app/`) has a simpler chat-based elaboration without the structured 7-question flow described in the PRD.

---

## Implementation Strategy

### Option A: Integrate project-pipeline UI into main app (RECOMMENDED)
**Effort:** 4-6 hours
**Approach:** Port the conversational UI components from `project-pipeline/frontend` to `app/src/components`

**Pros:**
- Reuses existing, tested components
- Matches PRD specifications exactly
- Includes progress indicator and structured flow

**Cons:**
- Requires adapting from REST API to tRPC
- May need to adjust state management

### Option B: Enhance existing main app UI
**Effort:** 6-8 hours
**Approach:** Add structured question flow and progress tracking to current UI

**Pros:**
- Works with existing tRPC architecture
- No need to port components

**Cons:**
- Requires reimplementing logic that already exists
- More work from scratch

---

## Detailed Implementation Plan (Option A - RECOMMENDED)

### Phase 1: Investigation & Assessment ✅ COMPLETE
- [x] Verified backend API endpoints exist in `project-pipeline/backend`
- [x] Verified frontend UI components exist in `project-pipeline/frontend`
- [x] Analyzed main app architecture (`app/src`)
- [x] Identified gap: main app missing structured elaboration flow

### Phase 2: Component Port Strategy
**Goal:** Integrate conversational elaboration UI into main app

#### 2.1 Port Core Components
**Files to create in `app/src/components/brainstorm/`:**

1. **`ConversationalElaboration.tsx`** (from `project-pipeline/frontend`)
   - Adapt to use tRPC instead of REST API
   - Use existing `trpc.brainstorm.elaborate` endpoint
   - Integrate with current session state

2. **`ElaborationProgressIndicator.tsx`** (from `project-pipeline/frontend/ProgressIndicator.tsx`)
   - Visual progress bar (0-100%)
   - Color-coded progress (red < 50, yellow < 80, green >= 80)
   - Encouraging messages

3. **`MetadataDisplay.tsx`** (from `project-pipeline/frontend/MetadataPreview.tsx`)
   - Show completeness percentage
   - Display extracted metadata
   - "Convert to Project" button (enabled at >= 80%)

#### 2.2 State Management
**Option 1: Create elaboration store** (mirrors project-pipeline approach)
```typescript
// app/src/lib/stores/elaborationStore.ts
interface ElaborationState {
  sessionId: string | null
  messages: ElaborationMessage[]
  currentQuestion: number // 1-7
  completeness: number // 0-100
  metadata: RichSeedMetadata
  quickReplies: QuickReply[]
  isLoading: boolean
}
```

**Option 2: Use React state** (simpler, integrate with existing page)

**RECOMMENDATION: Use Option 2** (React state) to minimize changes

#### 2.3 Backend Integration
**Current backend:** Uses tRPC router at `app/src/server/routers/brainstorm.ts`

**Required changes:**
1. Add `startElaboration` mutation (maps to conversational start)
2. Add `answerQuestion` mutation (maps to conversational answer)
3. Add `getElaborationStatus` query (maps to status check)

**Alternative:** Enhance existing `elaborate` mutation to support structured flow

### Phase 3: Backend Service Updates

#### 3.1 Enhance Seed Elaboration Service
**File:** `app/src/lib/ai/chains/seed-elaboration.ts`

**Add structured question flow:**
```typescript
const ELABORATION_QUESTIONS = [
  { id: 1, question: "How many participants?", field: "participantCount" },
  { id: 2, question: "What's the duration?", field: "duration" },
  { id: 3, question: "What's the destination?", field: "destination" },
  { id: 4, question: "Which countries?", field: "participantCountries" },
  { id: 5, question: "What's the budget?", field: "totalBudget" },
  { id: 6, question: "What activities?", field: "activities" },
  { id: 7, question: "What's the theme?", field: "theme" }
]
```

**Update `elaborateSeed` function:**
- Track question number (1-7)
- Calculate completeness: `(answeredQuestions / 7) * 100`
- Extract metadata from answers
- Store metadata in seed.metadata field

#### 3.2 Database Schema Enhancement
**Check if `metadata` field exists on `Seed` model:**
```prisma
model Seed {
  // ... existing fields
  metadata Json? // Rich seed metadata
  completeness Int @default(0) // 0-100
}
```

**If missing, create migration:**
```bash
npx prisma migrate dev --name add_seed_metadata
```

### Phase 4: Frontend UI Implementation

#### 4.1 Update Seed Elaboration Page
**File:** `app/src/app/(dashboard)/seeds/[id]/page.tsx`

**Changes:**
1. Add progress indicator at top
2. Restructure layout: chat (left) + metadata preview (right)
3. Replace free-form chat with structured Q&A flow
4. Show current question number (e.g., "Question 3 of 7")
5. Add quick reply buttons for common answers
6. Enable "Convert to Project" only when >= 80% complete

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│ Seed Elaboration - [Seed Title]              [X] Close  │
├─────────────────────────────────────────────────────────┤
│ Progress: ████████░░░░░░░░ 57%  (4/7 questions)        │
├──────────────────────────────┬──────────────────────────┤
│                              │                          │
│  Chat Interface              │  Metadata Preview        │
│  (Conversational Q&A)        │                          │
│                              │  • Participants: 30      │
│  AI: How many participants?  │  • Duration: 7 days      │
│                              │  • Budget: €15,000       │
│  [16-20] [21-30] [31-40]     │  • Destination: TBD      │
│                              │                          │
│  [Your answer...]            │  Completeness: 57%       │
│                              │                          │
│                              │  [ Convert to Project ]  │
│                              │  (enabled at 80%)        │
└──────────────────────────────┴──────────────────────────┘
```

#### 4.2 Create New Components

**`app/src/components/brainstorm/ElaborationChat.tsx`:**
- Q&A message display
- Question numbering (e.g., "Question 3 of 7")
- Quick reply buttons
- Free-form text input
- Loading states

**`app/src/components/brainstorm/QuickReplyButtons.tsx`:**
- Clickable suggestion chips
- Auto-generate based on question type
- Examples: "16-20", "21-30", "1 week", "2 weeks"

**`app/src/components/brainstorm/MetadataPreview.tsx`:**
- Display collected metadata
- Completeness indicator
- "Convert to Project" button
- Enable/disable based on completeness

### Phase 5: Validation & Error Handling

#### 5.1 Validation Rules
**From PRD Section 1.1:**
- Participants: 16-60 (Erasmus+ requirement)
- Duration: 5-21 days typical
- Budget: €300-500 per participant typical
- Countries: Validate visa requirements
- Activities: Must align with theme

**Implementation:**
```typescript
function validateAnswer(question: number, answer: string): ValidationResult {
  switch (question) {
    case 1: // Participants
      const count = extractNumber(answer)
      if (count < 16 || count > 60) {
        return { valid: false, error: "Participants must be between 16-60" }
      }
      break
    // ... other validations
  }
  return { valid: true }
}
```

#### 5.2 Error Display
- Show validation errors inline
- Allow user to retry answer
- Provide helpful suggestions
- Don't block progress completely (soft validation)

### Phase 6: UI/UX Polish

#### 6.1 Keyboard Navigation
**Accessibility requirements from issue:**
- Tab through quick reply buttons
- Enter to send message
- Escape to clear input
- Arrow keys to navigate suggestions

**Implementation:**
```tsx
onKeyDown={(e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
  if (e.key === 'Escape') {
    setMessage('')
  }
}}
```

#### 6.2 Mobile Responsiveness
**Requirements:**
- Stack layout vertically on mobile (<768px)
- Chat takes full width
- Metadata preview below chat
- Quick replies wrap properly
- Touch-friendly button sizes (min 44px)

**Tailwind classes:**
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div className="md:col-span-2">{/* Chat */}</div>
  <div className="md:col-span-1">{/* Metadata */}</div>
</div>
```

#### 6.3 Loading States
- Skeleton screens while loading seed
- Typing indicator when AI is responding
- Disable input during submission
- Show "Generating response..." message

### Phase 7: Testing

#### 7.1 Manual Testing Checklist
- [ ] Start elaboration flow from seed detail page
- [ ] Answer all 7 questions in sequence
- [ ] Progress bar updates correctly (0% → 100%)
- [ ] Metadata preview updates after each answer
- [ ] Quick reply buttons work correctly
- [ ] Free-form answers work correctly
- [ ] Validation errors display properly
- [ ] "Convert to Project" button enables at 80%
- [ ] Convert to project actually works
- [ ] Keyboard navigation works
- [ ] Mobile layout is responsive
- [ ] No console errors

#### 7.2 E2E Test Updates
**File:** `tests/e2e/seed-elaboration.spec.ts`

**Add tests:**
```typescript
test('should complete 7-question elaboration flow', async ({ page }) => {
  // Navigate to seed elaboration page
  // Answer each question
  // Verify progress updates
  // Verify completeness reaches 100%
  // Verify "Convert" button is enabled
})

test('should show validation errors for invalid answers', async ({ page }) => {
  // Submit invalid participant count
  // Verify error message shown
  // Verify can retry
})

test('should work on mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  // Test mobile layout
})
```

---

## File Changes Summary

### Files to Create
```
app/src/components/brainstorm/
├── ConversationalElaboration.tsx      # Main orchestrator
├── ElaborationChat.tsx                # Q&A chat interface
├── ElaborationProgressIndicator.tsx   # Progress bar
├── QuickReplyButtons.tsx              # Quick reply chips
└── MetadataPreview.tsx                # Metadata display

app/src/lib/stores/
└── elaborationStore.ts (optional)     # State management

app/src/lib/ai/chains/
└── seed-elaboration-structured.ts     # 7-question flow logic
```

### Files to Modify
```
app/src/app/(dashboard)/seeds/[id]/page.tsx
  - Replace existing UI with ConversationalElaboration
  - Add progress indicator
  - Add metadata preview panel

app/src/server/routers/brainstorm.ts
  - Enhance elaborate mutation with structured flow
  - Add question tracking
  - Add completeness calculation

app/src/lib/ai/chains/seed-elaboration.ts
  - Add 7-question flow
  - Add metadata extraction
  - Add completeness calculation

prisma/schema.prisma (if needed)
  - Add metadata Json field
  - Add completeness Int field

tests/e2e/seed-elaboration.spec.ts
  - Update tests for new UI
  - Add completeness tests
  - Add mobile tests
```

---

## Implementation Sequence

### Day 1 (3-4 hours)
1. ✅ Investigation complete
2. ⏳ Create structured question flow in backend
3. ⏳ Enhance elaborate mutation with completeness tracking
4. ⏳ Add database migration for metadata field

### Day 2 (4-5 hours)
5. ⏳ Port ConversationalElaboration component
6. ⏳ Create ElaborationProgressIndicator
7. ⏳ Create QuickReplyButtons
8. ⏳ Update seeds/[id]/page.tsx with new layout
9. ⏳ Test full flow manually

### Day 3 (1-2 hours) - Polish
10. ⏳ Add keyboard navigation
11. ⏳ Ensure mobile responsiveness
12. ⏳ Fix console errors
13. ⏳ Update E2E tests
14. ⏳ Final testing and validation

---

## Acceptance Criteria Verification

### From Issue #174
- [x] **Investigate:** UI components exist (in project-pipeline, needs port to app)
- [ ] **Create components:** Port conversational UI to main app
- [ ] **Add progress indicator:** 0-100% completeness
- [ ] **Add validation errors:** Display inline validation
- [ ] **Test question flow:** Complete 7-question flow in browser
- [ ] **Keyboard navigation:** Tab, Enter, Escape work correctly
- [ ] **Mobile responsive:** Works on mobile viewports
- [ ] **No console errors:** Clean browser console

### From PRD Section 1.1 (Conversational Elaboration)
- [ ] AI asks questions progressively (1-7)
- [ ] User can answer in free-form text
- [ ] AI provides default suggestions
- [ ] Validation against Erasmus+ requirements
- [ ] Conversation feels natural
- [ ] Completeness indicator shows 0-100%

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| **tRPC vs REST mismatch** | Medium | Adapt components to use tRPC hooks instead of REST |
| **State management complexity** | Low | Use React state instead of Zustand store |
| **Backend elaboration logic missing** | High | Port from project-pipeline or reimplement 7-question flow |
| **Database schema changes** | Medium | Create migration, test in dev first |
| **UI doesn't match main app style** | Low | Use existing shadcn/ui components, match current design |

---

## Open Questions

1. **Should we use project-pipeline's REST API or main app's tRPC?**
   - **ANSWER:** Use tRPC (main app architecture)

2. **Should we create a separate elaborationStore or use React state?**
   - **ANSWER:** Use React state (simpler, less dependencies)

3. **Should we port ALL components or rebuild minimal version?**
   - **ANSWER:** Port core components, adapt to tRPC

4. **How to handle metadata field in database?**
   - **ANSWER:** Add Json field if missing, use migration

5. **Should we support both free-form chat AND structured questions?**
   - **ANSWER:** Start with structured questions (matches PRD), keep simple

---

## Next Steps

1. **IMMEDIATE:** Start Phase 2.3 - Backend Integration
   - Enhance `elaborate` mutation with question tracking
   - Add completeness calculation logic
   - Test backend changes

2. **THEN:** Phase 4 - Frontend UI Implementation
   - Port ConversationalElaboration component
   - Create progress indicator
   - Update seeds/[id]/page.tsx

3. **FINALLY:** Phase 7 - Testing
   - Manual testing of full flow
   - Update E2E tests
   - Verify all acceptance criteria

---

## Status Update for User

**Current Phase:** Analysis Complete ✅
**Next Phase:** Backend Integration
**Blockers:** None
**ETA:** 6-8 hours remaining

**Summary:**
- Backend API endpoints exist in `project-pipeline/backend` ✅
- Frontend UI components exist in `project-pipeline/frontend` ✅
- Main app (`app/`) is missing the structured elaboration flow ⚠️
- Plan: Port conversational UI from project-pipeline to main app
- Approach: Adapt to tRPC, use React state, follow existing patterns

**Proceeding with implementation...**
