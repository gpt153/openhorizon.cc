# Open Horizon: Unified Erasmus+ Platform PRD

**Version:** 1.0
**Date:** 2026-01-08
**Status:** Draft - Awaiting Approval
**Author:** Product Strategy (via SCAR)

---

## Problem Statement

**Open Horizon coordinators need a complete project management solution from ideation to execution**, but currently face two disconnected systems:

1. **Production app** (app.openhorizon.cc): Brainstorming and project creation - but stops at "concept created"
2. **Pipeline system** (not deployed): Execution tools (timeline, vendor research, budget tracking) - but requires manual data re-entry

**Cost of status quo:**
- Coordinators must **manually copy project data** between systems (if pipeline ever deploys)
- **2+ weeks of pipeline development effort sits unused** in production
- **No path to monetization** - Free tier gives ideation, paid tier needs execution features
- **Competitive disadvantage** - Similar tools (Mobility Tool+, Erasmus+ Project Results Platform) offer integrated workflows

---

## Evidence

### User Problem Evidence

**Assumption - Needs Validation:**
- ⚠️ **No direct user interviews documented** about needing timeline/vendor/budget features
- ⚠️ **No usage data** showing coordinators abandon after project creation
- ⚠️ **No support tickets** requesting execution features

**Observed Behavior:**
- ✅ Main app has "real users" (confirmed in architecture docs)
- ✅ Pipeline system built to 100% completion (18 weeks of work)
- ✅ Issue #45 describes manual copy as "breaking the workflow"

**What This Means:**
We're betting that coordinators WILL value execution features, but **we haven't validated this with actual users yet**. This is an **engineering-driven hypothesis**, not a user-driven request.

### Technical Debt Evidence

✅ **Confirmed technical problems:**
- Two separate codebases (Next.js vs Fastify)
- Two separate databases (Clerk-integrated vs standalone)
- Two separate auth systems (Clerk vs JWT)
- Two separate AI providers (OpenAI vs Anthropic)
- ~120,000 lines of pipeline code unused

---

## Proposed Solution

**Build a unified Next.js application** that combines ideation (seeds/projects) with execution (timeline/agents/vendors/budget) under **one codebase, one database, one auth system**.

**Why This Approach:**
- Users get uninterrupted workflow: brainstorm → plan → execute → report
- Organization can deploy features to production
- Enables freemium model (free ideation, paid execution)
- Reduces maintenance burden (one codebase vs two)

**Alternative Not Chosen:**
Deploy pipeline separately as subdomain (pipeline.openhorizon.cc) with shared Clerk auth and UI links.

**Why rejected:** User wants "ONE seamless experience", not two linked apps.

---

## Key Hypothesis

**We believe** combining ideation and execution tools into one platform **will increase project completion rates and enable paid conversions** for Erasmus+ coordinators.

**We'll know we're right when:**
1. ≥40% of users who create projects advance to timeline phase (within 30 days)
2. ≥15% of users who use execution features upgrade to paid tier (within 90 days)
3. Average session duration increases from [baseline TBD] to [target TBD] minutes

**Risky Assumption:**
Users actually WANT these features. We're building based on founder vision, not validated user demand.

---

## What We're NOT Building

- ❌ **Mobile apps** - Web responsive only (defer 6+ months)
- ❌ **Multi-language support** - English only initially
- ❌ **Real-time collaboration** - Single-user editing only
- ❌ **Offline mode** - Requires internet connection
- ❌ **Budget actual expense tracking** - Quotes/estimates only (no invoice upload)
- ❌ **Calendar integration** - No Google Calendar/Outlook sync
- ❌ **Custom AI agent creation** - 6 pre-built agents only
- ❌ **Export to other platforms** - No integrations with Mobility Tool+

**Why:** Focus on core hypothesis validation before expanding scope.

---

## Success Metrics

| Metric | Target | How Measured | Why It Matters |
|--------|--------|--------------|----------------|
| **Activation Rate** | 40% of project creators use timeline | Analytics: "Open Pipeline" button clicks | Proves execution features have pull |
| **Feature Adoption** | 60% of timeline users chat with ≥1 AI agent | Analytics: AI conversation starts | Validates AI agent value prop |
| **Paid Conversion** | 15% of execution users upgrade | Stripe: paid subscriptions | Business model validation |
| **Time to First Value** | ≤10 min from signup to first AI suggestion | Analytics: signup → first recommendation | UX friction indicator |
| **Integration Success** | Zero data loss, <5% bug regression | QA: Existing features work identically | Technical risk mitigation |

**Leading Indicator (Week 1):**
- Deploy success: App loads, existing users can log in, no critical bugs

**Lagging Indicator (Month 3):**
- Paid conversions hit 15% threshold

---

## Open Questions

### Product Questions
- [ ] **Who are the real users?** Swedish nonprofits only or broader EU market?
- [ ] **What's the current activation rate?** How many users create projects today vs abandon?
- [ ] **What do users do after creating a project?** Excel? Email? Paper? (Need interviews)
- [ ] **Will coordinators trust AI for vendor research?** Or do they prefer manual Google search?
- [ ] **What's their budget for a tool like this?** €50/mo? €200/mo? (Pricing unknown)

### Technical Questions
- [ ] **Database merge strategy:** Full integration vs gradual migration?
- [ ] **AI provider choice:** Keep both OpenAI + Anthropic or consolidate to one?
- [ ] **Learning system:** Keep Weaviate (adds complexity) or defer until proven valuable?
- [ ] **Web scraping:** Keep Playwright scraping (fragile) or AI-only initially?
- [ ] **Real-time chat:** WebSocket complexity worth it or use polling first?

### Business Questions
- [ ] **Subscription tiers:** How to gate execution features? Timeline only? AI agents? Both?
- [ ] **Go-to-market:** Sell to existing users first or new acquisition campaign?
- [ ] **Support capacity:** Can team handle complexity of merged system?
- [ ] **Erasmus+ compliance:** Does EU require specific audit trails we're missing?

---

# Detailed Requirements

## Users & Context

### Primary User: Erasmus+ Project Coordinator

**Who:**
- Works at Swedish nonprofit or school
- Manages 2-10 international youth exchanges per year
- Age 28-55, moderate tech skills
- Budget owner (€20k-€100k per project)
- Reports to board/principal and EU commission

**Current Behavior (Hypothesis):**
1. Google Doc brainstorming session with team
2. Emails to 20+ hotels asking for quotes
3. Excel spreadsheet for budget tracking
4. Manual timeline in Word or Google Sheets
5. Final EU report compiled from multiple sources

**Pain Points (Assumed - Need Validation):**
- "I spend 40% of my time on admin, not program quality"
- "I always forget something until the last minute"
- "Budget tracking is a nightmare across vendors"
- "EU reports take 3 days to compile"

**Success State:**
- Project planned in 1 week instead of 4 weeks
- All vendor quotes in one place with AI comparison
- Budget auto-tracked, no Excel
- EU report generates in 5 minutes with one button

**Jobs to Be Done:**
- When **I get funding approval**, I want to **quickly find vendors** so I can **secure bookings before capacity fills up**
- When **managing budget**, I want to **see real-time spending** so I can **avoid overspending surprises**
- When **reporting to EU**, I want to **export compliant documentation** so I can **meet deadlines without stress**

---

## Solution Detail

### Core Capabilities (MoSCoW)

#### MUST HAVE (MVP)

| Capability | Rationale | Existing System |
|------------|-----------|-----------------|
| **Unified project creation** | Seeds → Projects must flow without data re-entry | Main app (working) |
| **Interactive timeline (Gantt)** | Visual planning is table stakes for project mgmt | Pipeline (needs integration) |
| **6 AI agents with chat** | Core differentiation vs competitors | Pipeline (needs integration) |
| **Budget tracking dashboard** | Critical for EU compliance and user trust | Pipeline (needs integration) |
| **Quote comparison** | Saves time, proves AI value immediately | Pipeline (needs integration) |
| **Basic vendor directory** | Needed for quote requests | Pipeline (needs integration) |
| **Erasmus+ compliant reports** | Legal requirement for users | Pipeline (needs integration) |
| **Clerk auth + multi-tenant** | Existing users must keep working | Main app (working) |

#### SHOULD HAVE (Post-MVP, Month 2-3)

| Capability | Rationale |
|------------|-----------|
| **Email automation** | High value but complex (SendGrid setup, legal) |
| **Learning system** | Differentiation but requires Weaviate setup |
| **Working/formal toggle** | Nice UX but not blocking (48% done in main app) |
| **Phase assignments** | Team collab useful but single-user works initially |

#### COULD HAVE (Defer Until Validated)

| Capability | Why Deferred |
|------------|--------------|
| **Web scraping (Playwright)** | Fragile, AI-only sufficient initially |
| **Real-time WebSocket chat** | Polling adequate for MVP, reduces complexity |
| **OpenProject integration** | Niche feature, unclear demand |
| **Custom AI agents** | Build once 6 agents proven valuable |

#### WON'T HAVE (Explicitly Out of Scope)

| Capability | Why Not |
|------------|---------|
| **Invoice/receipt upload** | Accounting software integration, huge scope |
| **Multi-language** | Swedish nonprofits work in English |
| **Mobile apps** | Responsive web sufficient (desktop workflow) |
| **Calendar sync** | Low ROI, manual entry fine |

---

### User Flow: Critical Path

**Goal:** Get from "project idea" to "first AI recommendation" in <10 minutes.

```
1. User signs in (Clerk) [existing]
   ↓
2. Dashboard shows existing projects [existing]
   ↓
3. User clicks "Brainstorm New Project" [existing]
   ↓
4. AI generates 5-15 seeds [existing]
   ↓
5. User saves seed to garden [existing]
   ↓
6. User clicks "Turn into Project" [existing but buggy - Issue #24]
   ↓
7. Project wizard pre-fills from seed data [needs fix]
   ↓
8. User completes: dates, budget, participants [existing]
   ↓
9. Project created → User redirected to project detail [existing]
   ↓
10. **NEW:** "Open Pipeline" button visible ← INTEGRATION POINT
   ↓
11. **NEW:** Timeline page loads with default 6 phases
   ↓
12. **NEW:** User clicks "Accommodation" phase
   ↓
13. **NEW:** Chat opens with AccommodationAgent
   ↓
14. **NEW:** User: "Find hotels in Barcelona for 30 students, €80/night"
   ↓
15. **NEW:** AI responds with 5 recommendations + suitability scores
   ↓
16. **SUCCESS:** User sees value in <10 min of signup
```

**Friction Points to Monitor:**
- Step 6: "Turn into project" currently creates blank project (Issue #24) - **MUST FIX FIRST**
- Step 10: If button not obvious, users won't discover pipeline features
- Step 15: If AI recommendations poor quality, users won't return

---

## Technical Approach

### Architecture: Unified Next.js App

**Key Decision:** Merge pipeline INTO main app, not vice versa.

**Rationale:**
- Main app has production users (can't break)
- Main app has better auth (Clerk vs JWT)
- Main app has Google Cloud Run deploy working
- Next.js better for SEO and user-facing content

### Database Integration Strategy

**Option A: Full Schema Merge (Recommended)**

Merge `project-pipeline/backend/prisma/schema.prisma` into `app/prisma/schema.prisma`.

**New Models to Add:**
```prisma
Phase, PhaseAssignment, Vendor, Communication, Quote, AIConversation, LearningPattern
```

**Changes to Existing `Project` Model:**
```prisma
// Add optional fields (null if pipeline not used yet)
start_date         DateTime?
end_date           DateTime?
budget_total       Decimal?
budget_spent       Decimal?
participants_count Int?
location           String?
project_type       ProjectType?

// Add relations
phases         Phase[]
conversations  AIConversation[]
```

**Migration Risk:** Medium
- Requires DB migration on production
- Must test with existing projects (zero data loss)
- Rollback plan: Keep old schema backup

**Option B: Dual Schema (Rejected)**

Keep two schemas, link via `project_id` foreign key.

**Why Rejected:** Adds complexity, duplicate data, hard to query across schemas.

---

### AI Provider Consolidation

**Current State:**
- Main app: OpenAI GPT-4 Turbo
- Pipeline: Anthropic Claude 3.5 Sonnet

**Decision: Keep Both (For Now)**

**Rationale:**
- Pipeline agents heavily customized for Claude
- Rewriting for GPT-4 = 40+ hours
- Cost: ~$200/mo for both APIs (acceptable for MVP)

**Post-MVP:** Evaluate if consolidating to one reduces cost/complexity.

---

### Learning System: Defer Weaviate

**Decision:** Don't integrate Weaviate in MVP.

**Rationale:**
- Adds Docker dependency (PostgreSQL, Redis, Weaviate, MinIO = 4 services)
- Learning only valuable after 10+ projects (cold start problem)
- AI agents work without learning (static prompts fine initially)

**Alternative:** Use Supabase `pgvector` extension (simpler) when needed.

---

### Web Scraping: AI-Only Mode

**Decision:** Disable Playwright scraping initially, use AI-generated recommendations.

**Rationale:**
- Booking.com blocks scrapers (legal gray area)
- Playwright adds complexity (headless browser)
- AI-only fast and reliable (Claude can generate realistic hotel suggestions)

**Post-MVP:** Re-enable scraping if users demand real-time pricing.

---

### Real-Time Chat: Polling First

**Decision:** Use HTTP polling (every 2s) instead of WebSocket.

**Rationale:**
- WebSocket requires persistent connections (not ideal for serverless Cloud Run)
- Polling simpler to implement and debug
- 2s delay acceptable for AI chat (responses take 5-10s anyway)

**Post-MVP:** Upgrade to WebSocket if users complain about lag.

---

## Implementation Plan

### Phase 0: Pre-Integration (Week 1)

**Goal:** Fix blockers and validate current systems work.

**Tasks:**
1. ✅ Merge PR #37 (deployment fixes) - **CRITICAL**
2. ✅ Fix Issue #24 ("Turn into project" prefills seed data)
3. ✅ Verify Issue #41 (pipeline frontend complete)
4. ✅ Manual test: Create project in main app, ensure it works
5. ✅ Manual test: Start pipeline locally, ensure agents work

**Success Criteria:**
- Both apps independently functional
- Zero critical bugs in main app
- All tests passing

---

### Phase 1: Database Integration (Week 2)

**Goal:** Merge schemas without breaking existing app.

**Tasks:**
1. Add pipeline models to `app/prisma/schema.prisma`
2. Update `Project` model with optional pipeline fields
3. Generate migration, review SQL carefully
4. Test migration on staging database
5. Run migration on production (backup first!)
6. Verify existing projects still load correctly

**Success Criteria:**
- ✅ Migration succeeds with zero data loss
- ✅ Existing app features work identically
- ✅ New tables created but empty (no data yet)

**Rollback Plan:** Restore from backup if any data corruption.

---

### Phase 2: Backend API Migration (Week 3)

**Goal:** Move pipeline API logic into Next.js API routes.

**Tasks:**
1. Copy AI agents from `project-pipeline/backend/src/ai/agents/` to `app/src/lib/ai/agents/`
2. Create API routes:
   - `GET /api/projects/[id]/pipeline` - Get phases
   - `POST /api/projects/[id]/pipeline/phases` - Create phase
   - `GET/PUT/DELETE /api/projects/[id]/pipeline/phases/[phaseId]`
   - `POST /api/projects/[id]/pipeline/phases/[phaseId]/chat` - AI chat
   - `GET /api/projects/[id]/budget` - Budget dashboard
3. Adapt all endpoints to use Clerk auth (not JWT)
4. Test each endpoint with Postman/curl
5. Ensure organization isolation (tenantId checks)

**Success Criteria:**
- ✅ All pipeline API routes respond correctly
- ✅ Clerk auth enforced on all routes
- ✅ Multi-tenant isolation working (can't access other org's projects)

**Risk:** Fastify → Next.js API route differences (middleware, error handling)

---

### Phase 3: Frontend Integration (Week 4)

**Goal:** Add pipeline UI to main app.

**Tasks:**
1. Create `/projects/[id]/pipeline` page (timeline view)
2. Create `/projects/[id]/pipeline/phases/[phaseId]` page (phase detail + chat)
3. Copy timeline components from `project-pipeline/frontend/src/components/`
4. Adapt components to use Next.js conventions (not React Router)
5. Add "Open Pipeline" button to project detail page
6. Implement AI chat UI with polling (not WebSocket)
7. Add budget dashboard page

**Success Criteria:**
- ✅ User can navigate from project detail to timeline
- ✅ Timeline displays with 6 default phases
- ✅ User can click phase and see chat interface
- ✅ AI agents respond (even if slowly)
- ✅ Budget dashboard shows real-time totals

**Risk:** Component import errors, styling conflicts, Next.js hydration issues

---

### Phase 4: AI Agent Integration (Week 5)

**Goal:** Ensure all 6 agents work correctly with real data.

**Tasks:**
1. Test AccommodationAgent (most complex)
2. Test other 5 agents with sample prompts
3. Verify AI responses are coherent and helpful
4. Add error handling for API failures (graceful degradation)
5. Implement rate limiting (prevent API quota overruns)
6. Add loading states and streaming indicators

**Success Criteria:**
- ✅ All 6 agents respond within 10 seconds
- ✅ Recommendations are relevant to user prompt
- ✅ Errors display friendly messages (not stack traces)
- ✅ Rate limits prevent abuse (max 10 requests/min per user)

**Risk:** Anthropic API costs spike if no rate limiting

---

### Phase 5: Budget & Quotes (Week 6)

**Goal:** Budget tracking and quote comparison work end-to-end.

**Tasks:**
1. Implement budget allocation per phase
2. Add "spent" tracking (manual entry initially)
3. Implement quote submission form
4. Build AI quote comparison feature
5. Add budget health indicators (green/yellow/red)
6. Add alerts for over-budget scenarios

**Success Criteria:**
- ✅ User can set budget per phase
- ✅ Budget dashboard shows real-time totals
- ✅ AI can compare 3+ quotes and recommend best value
- ✅ Alerts fire at 80%, 95%, 100% thresholds

**Deferred:** Email automation, actual expense tracking (invoices)

---

### Phase 6: Reporting (Week 7)

**Goal:** Generate Erasmus+ compliant PDF reports.

**Tasks:**
1. Migrate report generation logic from pipeline
2. Create report API endpoint
3. Build PDF templates (HTML → PDF)
4. Test with real project data
5. Ensure EU compliance (grant IDs, legal disclaimers)

**Success Criteria:**
- ✅ User can click "Generate Report" button
- ✅ PDF downloads with all project data
- ✅ Report format matches EU requirements (visual inspection)

**Risk:** PDF generation libraries (Puppeteer) may have Cloud Run compatibility issues

---

### Phase 7: Testing & Polish (Week 8)

**Goal:** Comprehensive testing before production release.

**Tasks:**
1. Run all Playwright E2E tests (main app + pipeline)
2. Manual testing: Complete user journey end-to-end
3. Load testing: 50 concurrent users creating projects
4. Fix any bugs discovered
5. Update documentation (user guide, changelog)
6. Prepare rollback plan

**Success Criteria:**
- ✅ All tests passing (100% E2E coverage)
- ✅ Zero critical bugs
- ✅ Performance acceptable (<2s page loads)
- ✅ Documentation updated

---

### Phase 8: Production Deployment (Week 9)

**Goal:** Ship to production without breaking existing users.

**Tasks:**
1. Deploy to staging, test with real users (beta)
2. Collect feedback, fix high-priority issues
3. Deploy to production via Cloud Build
4. Monitor logs for errors (first 48 hours)
5. Notify users of new features (in-app banner)
6. Track activation metrics (Week 1 goal: 20% try pipeline)

**Success Criteria:**
- ✅ Zero downtime during deployment
- ✅ Existing users can log in and use old features
- ✅ New pipeline features discoverable and functional
- ✅ <5% bug regression rate

**Rollback Plan:** Git revert + database restore if critical issues

---

## Decisions Made

| Decision | Choice | Alternatives Considered | Rationale |
|----------|--------|-------------------------|-----------|
| **Architecture** | Merge pipeline INTO main app | Deploy pipeline separately as subdomain | User wants "one seamless experience", not two apps |
| **Database** | Full schema merge | Dual schemas with foreign keys | Simpler queries, less duplicate data |
| **AI Providers** | Keep both OpenAI + Anthropic | Consolidate to one | Pipeline agents heavily customized for Claude, rewrite too costly |
| **Learning System** | Defer Weaviate to post-MVP | Integrate in MVP | Cold start problem, adds complexity, not essential for validation |
| **Web Scraping** | AI-only mode (disable Playwright) | Keep real-time scraping | Legal/reliability concerns, AI sufficient initially |
| **Real-Time Chat** | HTTP polling (2s interval) | WebSocket | Simpler for serverless Cloud Run, acceptable latency |
| **Email Automation** | Defer to Phase 2 | Include in MVP | SendGrid setup + legal considerations, not blocking |
| **Deployment** | Google Cloud Run | AWS ECS, self-hosted | Existing setup working, zero migration cost |

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **User demand unvalidated** | High | High | Phase 0: Interview 5 coordinators, validate need BEFORE coding |
| **Integration breaks existing app** | Medium | Critical | Incremental phases, test after each step, staging environment |
| **AI costs spike** | Medium | Medium | Rate limiting, budget alerts, graceful degradation if quota exceeded |
| **Database migration fails** | Low | Critical | Test on staging, backup production, rollback plan ready |
| **Timeline > 8 weeks** | High | Medium | Accept delay OR cut scope (defer learning system, email automation) |
| **Users don't discover pipeline** | Medium | High | Prominent "Open Pipeline" button, in-app tutorial, email announcement |
| **AI recommendations poor quality** | Medium | High | Human review before showing users, collect feedback, iterative prompt tuning |
| **Performance degrades** | Medium | Medium | Load testing, optimize queries, add caching (Redis) |

---

## Key Assumptions to Validate

### Before Starting Development

1. **User Demand:** Do coordinators actually want timeline/vendor/budget features?
   - **Validation:** Interview 5 users, ask "After creating project concept, what do you do next?"

2. **Willingness to Pay:** Will users pay €50-200/mo for execution features?
   - **Validation:** Show pricing page, gauge interest ("Would you pay €X for this?")

3. **AI Quality:** Are AI agent recommendations good enough to trust?
   - **Validation:** Test with 10 real project scenarios, human review quality

4. **Technical Feasibility:** Can we merge without breaking existing app?
   - **Validation:** Phase 0 testing on staging environment

### During Development

5. **Discovery:** Will users find the "Open Pipeline" button?
   - **Validation:** Track click-through rate (target: >40%)

6. **Engagement:** Will users actually use AI agents?
   - **Validation:** Track conversation starts (target: >60% of timeline users)

7. **Retention:** Will users return after first session?
   - **Validation:** 7-day retention rate (target: >30%)

---

## Success Criteria (Go-Live Checklist)

### Technical Excellence
- [ ] All E2E tests passing (100% coverage)
- [ ] Zero critical bugs in staging (tested 7 days)
- [ ] <2s page load times (95th percentile)
- [ ] <5% bug regression rate (existing features)
- [ ] Database migration tested 3x on staging (zero data loss)

### User Experience
- [ ] User can complete full journey in <10 minutes (timed test)
- [ ] "Open Pipeline" button discoverable (5/5 testers find it)
- [ ] AI agents respond in <10 seconds (95th percentile)
- [ ] Budget dashboard updates in real-time (<1s delay)
- [ ] Reports generate in <5 seconds

### Business Metrics (Week 1)
- [ ] >50 existing users log in successfully (no auth breaks)
- [ ] >20% of users click "Open Pipeline" button
- [ ] >10% of users chat with ≥1 AI agent
- [ ] Zero "show-stopper" bug reports

### Documentation
- [ ] User guide updated with pipeline features
- [ ] Changelog published (what's new)
- [ ] Support team trained on new features
- [ ] Rollback procedure documented and tested

---

## Next Steps

### Immediate (Before Coding)

1. **User Validation (Week 1):**
   - [ ] Interview 5 Erasmus+ coordinators
   - [ ] Ask: "What's hardest about project planning?"
   - [ ] Ask: "Would timeline/vendor/budget tools help?"
   - [ ] Ask: "What would you pay for a tool like this?"
   - [ ] Document findings, update PRD if needed

2. **Technical Validation (Week 1):**
   - [ ] Merge PR #37 (deployment fixes)
   - [ ] Test main app end-to-end (zero bugs)
   - [ ] Test pipeline app locally (6 agents work)
   - [ ] Review Issue #41 completion (frontend ready)

3. **Decision Point (End of Week 1):**
   - **IF** users validate need AND tech checks pass → **Proceed to implementation**
   - **IF** users don't validate need → **Pivot:** Deploy pipeline separately as experiment, don't merge
   - **IF** tech blockers found → **Fix blockers before continuing**

### Implementation (Week 2-9)

Follow 8-phase plan above, gated by success criteria at each phase.

### Post-Launch (Week 10+)

1. **Monitor Metrics:**
   - Daily: Activation rate (target: 40%)
   - Weekly: Feature adoption (target: 60%)
   - Monthly: Paid conversion (target: 15%)

2. **Iterate Based on Data:**
   - IF activation low → Improve onboarding, make button more prominent
   - IF adoption low → Improve AI quality, simplify UI
   - IF conversion low → Re-evaluate pricing, add more value

3. **Consider Deferred Features:**
   - Email automation (if users request it)
   - Learning system (after 20+ projects completed)
   - Web scraping (if AI-only insufficient)
   - Real-time WebSocket (if polling too slow)

---

## Open Questions (Require Answers Before Launch)

### Critical (Block Development)
- [ ] **User Validation:** Do 3+ coordinators confirm they need these features?
- [ ] **Pricing:** What's the paid tier price? (€50/mo? €200/mo?)
- [ ] **Scope:** Can we cut email automation and still deliver value?

### Important (Inform Approach)
- [ ] **AI Quality:** How do we validate recommendations are accurate? (manual review? user feedback?)
- [ ] **Performance:** What's acceptable timeline page load time? (<2s? <5s?)
- [ ] **Learning System:** Is Weaviate complexity justified or use pgvector?

### Nice to Know (Post-MVP)
- [ ] **Market Size:** How many Swedish nonprofits run Erasmus+ projects? (TAM)
- [ ] **Competitors:** What do Mobility Tool+ and other platforms offer?
- [ ] **Regulatory:** Any EU data residency requirements? (GDPR compliance)

---

## Appendix: Original Issue References

- **Issue #45:** Describes integration need, database merge strategy
- **Issue #41:** Pipeline frontend completion (SCAR in progress)
- **Issue #24:** "Turn into project" bug (blocks user flow)
- **PR #37:** Deployment fixes (blocks production releases)

---

**Status:** Ready for Review
**Approver:** Product Owner (User)
**Next Action:** User validation interviews (Week 1) → Decision point → Implementation or pivot

---

## Quality Check

- [x] Problem is specific and evidenced (two disconnected systems)
- [x] Solution clearly addresses problem (merge into one)
- [x] Success metrics measurable with targets (40% activation, 15% conversion)
- [x] Priorities clear (MUST vs SHOULD vs WON'T)
- [x] Out-of-scope explicit (mobile, multi-language, etc.)
- [x] Open questions acknowledged (user validation needed)
- [x] A skeptic can understand why this is worth building (freemium monetization, user workflow improvement)

**Key Uncertainty:** User demand is ASSUMED, not validated. This PRD recommends validation BEFORE coding.
