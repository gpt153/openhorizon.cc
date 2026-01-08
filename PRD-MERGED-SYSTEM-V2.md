# Open Horizon: AI-Powered Erasmus+ Application Generator

**Version:** 2.0 (Revised for Single-User, February Deadline)
**Date:** 2026-01-08
**Status:** Ready for Implementation
**Context:** Solo user building service business, February Erasmus+ deadline

---

## Problem Statement

**You need to submit high-quality Erasmus+ applications by February 2026** to win projects and generate revenue for your service business.

**Current blockers:**
1. Brainstorming works, but "turn into project" creates blank projects (Issue #24)
2. Pipeline system exists but disconnected - can't flow from seeds → projects → planning
3. **No AI application generator** - the critical missing piece for February deadline
4. Manual application writing takes 20-40 hours per project

**Cost of status quo:**
- Miss February deadline = lose 6+ months of potential revenue
- Manual applications = max 2-3 submissions (time constraint)
- With AI generator = 10+ high-quality submissions possible

---

## Proposed Solution

**Build a unified workflow: Seeds → Projects → Pipeline Planning → AI Application Generator**

Focus on THREE things only:
1. **Fix seed-to-project flow** (Issue #24) - prefill project data
2. **Integrate pipeline planning** - phases, timeline, budget for application content
3. **Build AI Application Generator** - outputs Erasmus+ KA1 Youth Exchange application document

**Everything else deferred:**
- ✅ Multi-user (you're solo)
- ✅ Execution tracking (post-approval)
- ✅ Live cost tracking (post-approval)
- ✅ Vendor management (post-approval)
- ✅ Email automation (post-approval)
- ✅ Reporting to EU (post-approval, after projects complete)

---

## Key Hypothesis

**If you can generate 10+ high-quality Erasmus+ applications in February using AI**, you'll increase approval odds from 20-30% (typical) to winning 3-5 projects (€150k-300k revenue).

**Success = Ship by January 31, 2026** (3 weeks from today)

---

## What We're Building

### Phase 1: Core Workflow (Week 1-2)

**Goal:** Brainstorm → Project → Pipeline (basic)

1. **Fix Issue #24:** "Turn into project" prefills from seed
   - Map seed content → project fields
   - AI infers missing fields (age group, duration, etc.)
   - User can edit before saving

2. **Integrate Pipeline (Minimal):**
   - Merge database schemas (Phase, AIConversation models)
   - Add "Open Pipeline" button to project page
   - Display timeline with 6 default phases
   - Allow basic phase editing (dates, budget allocation)
   - **NO** AI agents yet - just structure

3. **Basic Budget Planning:**
   - Set total budget (required for application)
   - Allocate per phase (accommodation, travel, food, etc.)
   - Display budget breakdown table

**Deliverable:** You can create project from seed, set dates/budget/phases

---

### Phase 2: AI Application Generator (Week 3)

**Goal:** Generate Erasmus+ KA1 Youth Exchange application document

**Critical Question:** What format does Erasmus+ application need?

**Typical Sections** (KA1 Youth Exchange):
1. **Project Summary** (1 page)
   - Title, dates, participants, location
   - Short description (500 chars)

2. **Context & Needs Analysis** (2 pages)
   - Problem statement
   - Target group description
   - Why this project is needed

3. **Objectives & Methods** (3 pages)
   - Learning objectives (Erasmus+ priorities)
   - Activities description (day-by-day)
   - Non-formal education methods
   - Inclusion measures

4. **Timeline & Work Plan** (2 pages)
   - Project phases with dates
   - Activity schedule
   - Milestones

5. **Budget** (2 pages)
   - Breakdown by category
   - Justification for costs
   - Co-funding sources

6. **Impact & Follow-Up** (2 pages)
   - Expected learning outcomes
   - Dissemination plan
   - Sustainability measures

7. **Partner Profile** (1 page)
   - Organization description
   - Capacity & experience
   - Previous Erasmus+ projects

**AI Generator Implementation:**

```typescript
// New API endpoint: POST /api/projects/[id]/generate-application

Input:
- Project data (from seeds + project form)
- Pipeline phases (dates, budget, activities)
- AI agent research (if any)

Output:
- Structured JSON with all 7 sections
- PDF export (formatted for submission)
- Word/DOCX export (for editing)

AI Chain (LangChain + GPT-4):
1. Extract all project data
2. For each section, generate content using prompts:
   - Context-aware (knows Erasmus+ requirements)
   - Uses project DNA from seeds
   - Incorporates phase planning
   - Follows EU writing style (formal, impact-focused)
3. Validate completeness (all required fields)
4. Format as PDF/DOCX
```

**Deliverable:** "Generate Application" button → downloads formatted PDF

---

### Phase 3: AI Agents for Enrichment (Week 3-4)

**Goal:** AI agents provide research to enrich application

**Implementation Priority:**

1. **AccommodationAgent** (HIGHEST)
   - Provides realistic venue options
   - Feeds into budget justification
   - Adds credibility ("We researched X hotels in Y area")

2. **ActivitiesAgent** (HIGH)
   - Suggests educational activities aligned with objectives
   - Critical for "Methods" section
   - Shows non-formal education approach

3. **EmergencyAgent** (MEDIUM)
   - Generates risk assessment
   - Required for "Safety" section
   - Demonstrates preparation

4. **Other agents** (DEFER to post-February)
   - Travel, Food, Insurance - can be written manually initially

**Integration:**
- Chat interface per phase (copy from pipeline frontend)
- Store AI responses in AIConversation model
- Application generator pulls from conversations
- User can edit AI suggestions before including

**Deliverable:** 3 AI agents functional, responses feed into application

---

## Architecture: Build for Future, Ship for Now

### Database Schema

**Add to `app/prisma/schema.prisma`:**

```prisma
// Core pipeline models (add now, use later)
model Phase {
  id               String   @id @default(cuid())
  project_id       String   @db.Uuid
  name             String
  type             PhaseType
  start_date       DateTime
  end_date         DateTime
  budget_allocated Decimal  @db.Decimal(12, 2)
  order            Int
  created_at       DateTime @default(now())

  project       Project          @relation(fields: [project_id], references: [id], onDelete: Cascade)
  conversations AIConversation[]

  @@index([project_id])
}

model AIConversation {
  id         String   @id @default(cuid())
  project_id String   @db.Uuid
  phase_id   String?
  agent_type String
  messages   Json     // [{role: 'user'|'assistant', content: '...'}]
  created_at DateTime @default(now())

  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  phase   Phase?  @relation(fields: [phase_id], references: [id], onDelete: Cascade)

  @@index([project_id])
}

// Future models (add now, don't implement yet)
model Vendor { /* ... defer implementation ... */ }
model Quote { /* ... defer implementation ... */ }
model Communication { /* ... defer implementation ... */ }
model LearningPattern { /* ... defer implementation ... */ }

enum PhaseType {
  ACCOMMODATION
  TRAVEL
  FOOD
  ACTIVITIES
  INSURANCE
  EMERGENCY
  CUSTOM
}
```

**Update `Project` model:**

```prisma
model Project {
  // ... existing fields ...

  // Add for pipeline (optional, null if not used)
  start_date         DateTime?
  end_date           DateTime?
  budget_total       Decimal? @db.Decimal(12, 2)
  participants_count Int?
  location           String?

  // Relations
  phases        Phase[]
  conversations AIConversation[]
}
```

**Migration Strategy:**
- Add all models now (even if not using)
- Allows adding features later without schema changes
- Minimal: Only Phase and AIConversation essential for February

---

### Backend: Next.js API Routes

**Essential Routes (Week 1-3):**

```
POST   /api/projects/[id]/phases                    Create phase
GET    /api/projects/[id]/phases                    List phases
PUT    /api/projects/[id]/phases/[phaseId]          Update phase
DELETE /api/projects/[id]/phases/[phaseId]          Delete phase

POST   /api/projects/[id]/phases/[phaseId]/chat    AI chat
GET    /api/projects/[id]/conversations             Get all chats

POST   /api/projects/[id]/generate-application     Generate PDF/DOCX
```

**Deferred Routes (Post-February):**

```
/api/vendors/*                  Vendor management
/api/communications/*           Email automation
/api/quotes/*                   Quote tracking
/api/projects/[id]/reports/*    EU reporting
```

---

### Frontend: Minimal UI

**Essential Pages (Week 1-3):**

1. `/projects/[id]` - Add "Open Pipeline" button
2. `/projects/[id]/pipeline` - Timeline view (Frappe Gantt)
3. `/projects/[id]/pipeline/phases/[phaseId]` - Phase detail + AI chat
4. `/projects/[id]/application` - **NEW:** Application generator page

**UI Priorities:**
- Functional > Beautiful (polish later)
- Copy pipeline components as-is (don't redesign)
- Focus on AI chat working reliably

---

### AI Integration

**Use Claude 3.5 Sonnet (Anthropic) for everything:**
- Reason: Pipeline agents already written for Claude
- Cost: ~$50-100 for 10 applications (acceptable)
- Quality: Better at long-form content than GPT-4

**Consolidate Later:** Post-February, evaluate if switching to OpenAI saves cost

---

## Implementation Plan: 3 Weeks

### Week 1 (Jan 8-14): Foundation

**Days 1-2: Database & Project Fix**
- [ ] Merge PR #37 (deployment fixes)
- [ ] Add Phase, AIConversation models to schema
- [ ] Run migration on production
- [ ] Fix Issue #24 (seed → project prefill with AI)
- [ ] Test: Create project from seed, verify data flows

**Days 3-5: Basic Pipeline Integration**
- [ ] Create `/projects/[id]/pipeline` page
- [ ] Copy Frappe Gantt timeline component
- [ ] Display 6 default phases (auto-created on first visit)
- [ ] Allow phase date editing
- [ ] Budget allocation per phase
- [ ] Test: Set dates and budget for all phases

**Success Criteria:**
- ✅ Can create project from seed with AI prefill
- ✅ Can open pipeline and see timeline
- ✅ Can edit phase dates and budget

---

### Week 2 (Jan 15-21): AI Agents

**Days 1-3: Agent Integration**
- [ ] Copy 3 agents from pipeline: Accommodation, Activities, Emergency
- [ ] Create chat API endpoint
- [ ] Build chat UI component (copy from pipeline)
- [ ] Connect chat to agents
- [ ] Store conversations in database
- [ ] Test: Chat with all 3 agents, get useful responses

**Days 4-5: Agent Refinement**
- [ ] Tune prompts for Erasmus+ context
- [ ] Add error handling (graceful fallback)
- [ ] Add loading states
- [ ] Rate limiting (max 10 requests/min)
- [ ] Test: Generate realistic recommendations for Barcelona project

**Success Criteria:**
- ✅ All 3 agents respond within 10 seconds
- ✅ Recommendations are relevant and useful
- ✅ Conversations persist across page loads

---

### Week 3 (Jan 22-28): Application Generator

**Days 1-2: Generator Logic**
- [ ] Research Erasmus+ KA1 application format
- [ ] Create LangChain prompts for each section
- [ ] Build aggregation logic (project + phases + conversations → structured data)
- [ ] Test: Generate JSON for sample project

**Days 3-4: PDF/DOCX Export**
- [ ] HTML templates for each section
- [ ] Puppeteer PDF generation
- [ ] DOCX export (using docx library)
- [ ] Styling to match Erasmus+ format
- [ ] Test: Generate PDF, verify formatting

**Day 5: Integration & Testing**
- [ ] Add "Generate Application" button to project page
- [ ] Build application preview page
- [ ] Allow editing before final export
- [ ] End-to-end test: Seeds → Project → Pipeline → Application
- [ ] Deploy to production

**Success Criteria:**
- ✅ Can generate complete application PDF
- ✅ All 7 sections present and well-formatted
- ✅ Content is coherent and Erasmus+-compliant
- ✅ Takes <2 minutes to generate

---

### Week 4 (Jan 29-31): Polish & Deploy

**Days 1-2: Testing & Fixes**
- [ ] Test with 3 real project scenarios
- [ ] Fix any bugs discovered
- [ ] Improve AI prompts based on output quality
- [ ] Add user instructions (tooltips, help text)

**Day 3: Production Launch**
- [ ] Final deployment to app.openhorizon.cc
- [ ] Verify all features work in production
- [ ] Create 1-2 test applications
- [ ] Ready for February deadline

**Success Criteria:**
- ✅ You can submit 10+ applications in February
- ✅ Zero blocking bugs
- ✅ Application quality meets Erasmus+ standards

---

## What We're NOT Building (Yet)

Defer to post-February (after winning projects):

- ❌ Multi-user / organizations
- ❌ Vendor directory
- ❌ Email automation
- ❌ Quote tracking
- ❌ Real expense tracking (invoices)
- ❌ Live budget monitoring
- ❌ Final reporting to EU
- ❌ Web scraping (use AI-only)
- ❌ Learning system (Weaviate)
- ❌ All other 3 agents (Travel, Food, Insurance)

**Why:** February deadline is 3 weeks away. Focus = application generator.

**Architecture allows adding later:**
- Database schema includes vendor, quote, communication models (just not implemented)
- API routes structured for future expansion
- Frontend components reusable

---

## Success Metrics

### Week 4 (Launch)
- ✅ Generate first complete application in <30 minutes
- ✅ Application PDF formatted correctly
- ✅ All required sections present
- ✅ Content quality: "Ready to submit with minor edits"

### February (Submissions)
- ✅ Submit 10+ applications
- ✅ <2 hours per application (vs 20-40 hours manual)
- ✅ 80% time savings

### March-April (Results)
- ✅ Win 3-5 projects (€150k-300k revenue)
- ✅ Approval rate ≥30% (vs 20% baseline)

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| **3 weeks too aggressive** | Medium | Cut scope: Only 1 agent (Accommodation) if needed |
| **Application format unknown** | High | Research KA1 format Day 1, validate with past examples |
| **AI quality insufficient** | Medium | Human review loop: Generate → Edit → Export |
| **Integration breaks main app** | Low | Test on staging, incremental deployment |
| **February deadline missed** | Medium | Start with manual template + AI sections if needed |

---

## Open Questions (Need Answers This Week)

### Critical (Day 1-2)
- [ ] **What's the exact Erasmus+ application format?** (KA1 Youth Exchange - confirm sections)
- [ ] **Do you have past applications?** (Use as templates for AI prompts)
- [ ] **What's the submission process?** (PDF upload? Online form? Word doc?)

### Important (Week 1)
- [ ] **Which AI agent is most critical?** (Accommodation? Activities? Emergency?)
- [ ] **How many projects are you targeting?** (10? 20? Affects scope)
- [ ] **What's "good enough" quality?** (80% ready? 95% ready?)

---

## Next Steps

### Immediate (Today)

1. **Approve this PRD** or request changes
2. **Share Erasmus+ application format** (past example if available)
3. **Prioritize agents** (which 1-3 are essential?)

### Tomorrow (Jan 9)

1. **Merge PR #37** (deployment fixes)
2. **Create detailed implementation plan** (task-by-task)
3. **Start Week 1 development** (database + project fix)

### This Week

- Daily progress updates
- Block any issues immediately
- Ship basic pipeline by Friday (Jan 12)

---

## Revised Architecture: Single-User First, Multi-User Later

### Now (February Focus)

```typescript
// Simplified auth - no multi-tenant complexity
// Clerk still used, but no organization checks
// One user = one account

// Database: All tenantId fields exist but unused
// When multi-user added, just enable org checks
```

### Later (Post-February)

```typescript
// Enable organization support
// Add tenantId checks to all queries
// Add team member invites
// Add role-based permissions
```

**Advantage:** Architecture ready for scale, but implementation simple now.

---

## Budget & Timeline

**Timeline:** 3 weeks (Jan 8 - Jan 31)
**Cost:**
- Development: ~120 hours (solo dev)
- AI APIs: ~$100 (Anthropic Claude)
- Infrastructure: ~$50/month (Google Cloud)

**ROI:**
- February applications: 10+ submissions
- Expected wins: 3-5 projects
- Revenue: €150k-300k
- **Payback: 500,000x** on $150 investment

---

## Quality Check

- [x] Problem is specific: Need to submit applications by February
- [x] Solution addresses problem: AI generator saves 80% time
- [x] Success metric clear: Submit 10+ applications in February
- [x] Priorities clear: Application generator > everything else
- [x] Out-of-scope explicit: Multi-user, execution, reporting deferred
- [x] Timeline realistic: 3 weeks for focused scope
- [x] Risk acknowledged: Aggressive timeline, may need scope cut

---

**Status:** Ready for Implementation
**Approval Required:** User confirmation on format, priorities, timeline
**Next:** Detailed task breakdown → Start coding tomorrow

---

## Appendix: February Deadline Context

**Erasmus+ Application Windows:**
- KA1 Youth Exchanges: Typically Feb 23, May 4, Oct 4 deadlines
- February = Round 1 (highest competition, but fastest results)
- Missing February = wait until May (3 months lost)

**Competitive Advantage:**
- Most orgs submit 2-3 applications (time constraint)
- With AI: You can submit 10-20 high-quality apps
- Volume + quality = higher approval odds

**Business Model:**
- Win projects → Execute for clients
- Revenue: €30k-60k per project (service fees)
- 3-5 wins = €150k-300k revenue in 2026
- **This justifies aggressive 3-week build timeline**
