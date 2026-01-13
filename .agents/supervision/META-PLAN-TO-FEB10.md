# Meta Implementation Plan: Path to February 10, 2026
**Target Date**: February 10, 2026 (28 days from today)
**Current Date**: January 13, 2026 (Monday, Stockholm time)
**Current Completion**: ~65% (7/11 PRD steps fully usable)
**Target Completion**: 90% (10/11 steps fully usable)

---

## Strategic Overview

### Guiding Principles
1. **User workflows over backend perfection** - If user can't access it, it doesn't count
2. **Working > Perfect** - Functional with rough edges beats polished but incomplete
3. **Parallel execution** - Use SCAR agents in parallel for independent work
4. **Test continuously** - Don't wait for 100% to validate with real usage
5. **Ruthless prioritization** - Some features can wait for Phase 2

### Critical Path Priority
```
P0 (MUST HAVE): Food Agent UI, Accommodation Agent UI
P1 (HIGH VALUE): Communication Tracking UI, Quote Management
P2 (NICE TO HAVE): Budget Tracking Integration, Advanced Reporting
P3 (PHASE 2): Partner Matching, Learning System
```

---

## Four-Week Sprint Plan

### WEEK 1: Agent UI Integration (Jan 13-19)
**Goal**: Make all 3 vendor research agents (Travel, Food, Accommodation) fully usable from UI
**Days Available**: 7 days
**Estimated Effort**: 20-24 hours (~3 hours/day)

#### Sprint 1.1: Food Agent UI (Jan 13-14) - 6 hours
**Issue**: Complete Food Research Agent UI Integration

**Tasks**:
1. **Create FoodSearchPanel Component** (3h)
   - Clone TravelSearchPanel.tsx structure
   - Adapt for food-specific data (caterers, restaurants)
   - AI analysis cards (pros/cons/verdict)
   - Selection checkboxes
   - Quote generation button

2. **Add tRPC Routes** (1h)
   - `searchFood` route in phases.ts
   - `generateFoodQuotes` route
   - Wire to FoodAgent backend

3. **Integrate into Phase Detail Page** (1h)
   - Check `phase.type === 'FOOD'`
   - Render FoodSearchPanel
   - Pass phase context

4. **Testing** (1h)
   - Create FOOD phase
   - Test search flow
   - Test quote generation
   - Fix bugs

**Acceptance Criteria**:
- ✅ User can click into FOOD phase
- ✅ User sees food search form
- ✅ User can search and see 5-7 caterer/restaurant options
- ✅ Each option shows AI analysis (pros/cons/verdict)
- ✅ User can select 2-3 options
- ✅ User can generate quote emails
- ✅ Emails preview before sending

**SCAR Assignment**: Deploy SCAR for this issue

---

#### Sprint 1.2: Accommodation Agent Enhancement + UI (Jan 15-17) - 10 hours
**Issue**: Complete Accommodation Research Agent

**Tasks**:
1. **Enhance Backend Agent** (3h)
   - Add pros/cons generation (match FoodAgent quality)
   - Add suitability scoring (0-100)
   - Add generateQuoteEmail() method
   - Add more accommodation types (Airbnb, hostels, group residences)

2. **Create AccommodationSearchPanel Component** (3h)
   - Clone TravelSearchPanel structure
   - Adapt for accommodation data
   - Photo gallery support
   - Rating display
   - Price per night per person
   - AI analysis cards

3. **Add tRPC Routes** (1h)
   - `searchAccommodation` route
   - `generateAccommodationQuotes` route

4. **Integrate into Phase Detail Page** (1h)
   - Check `phase.type === 'ACCOMMODATION'`
   - Render AccommodationSearchPanel
   - Default inputs from project data

5. **Testing** (2h)
   - Create ACCOMMODATION phase
   - Test full workflow
   - Compare to Booking.com results
   - Refine AI prompts

**Acceptance Criteria**:
- ✅ User can search for accommodation
- ✅ See 5-7 options with AI pros/cons
- ✅ Select and generate quotes
- ✅ Email templates professional and complete

**SCAR Assignment**: Deploy SCAR for this issue

---

#### Sprint 1.3: Budget Tracking Integration (Jan 18-19) - 4 hours
**Issue**: Integrate Budget Tracking Dashboard into Project Pages

**Tasks**:
1. **Add Budget Tab to Project Detail Page** (2h)
   - Create new tab in project page
   - Import BudgetOverviewDashboard
   - Wire up expense creation dialog
   - Show budget health badge

2. **Add Expense Tracking to Phase Pages** (1h)
   - Show phase-specific expenses in phase detail
   - "Add Expense" button
   - Link expenses to phase budget

3. **Testing** (1h)
   - Add expenses to project
   - Verify budget calculations
   - Test alert thresholds

**Acceptance Criteria**:
- ✅ User sees "Budget" tab on project page
- ✅ Dashboard shows expense breakdown
- ✅ User can add expenses
- ✅ Budget alerts trigger correctly

**SCAR Assignment**: Deploy SCAR for this issue

---

### WEEK 2: Quote Workflow (Jan 20-26)
**Goal**: Complete Steps 7-9 (Request → Track → Accept Quotes)
**Days Available**: 7 days
**Estimated Effort**: 20-24 hours

#### Sprint 2.1: Communication Tracking UI (Jan 20-22) - 8 hours
**Issue**: Build Communication Tracking Dashboard

**Tasks**:
1. **Create CommunicationList Component** (3h)
   - Table view of all communications
   - Filter by phase, vendor, status
   - Show: sent date, vendor, status (sent/delivered/opened/responded)
   - Click to view email content

2. **Add Communications Tab to Phase Detail** (2h)
   - Show phase-specific communications
   - "Sent Quotes" section
   - Delivery status indicators
   - Resend button

3. **Follow-Up Email Suggestions** (2h)
   - Detect "no response after 3 days"
   - Auto-generate follow-up email
   - One-click send follow-up

4. **Testing** (1h)
   - Send test quotes
   - Verify SendGrid webhook updates
   - Test follow-up flow

**Acceptance Criteria**:
- ✅ User sees all sent communications
- ✅ Delivery status visible (sent/delivered/opened)
- ✅ Follow-up suggestions appear automatically
- ✅ User can send follow-ups with one click

**SCAR Assignment**: Deploy SCAR

---

#### Sprint 2.2: Quote Response Management (Jan 23-24) - 6 hours
**Issue**: Manual Quote Response Logging

**Tasks**:
1. **Create QuoteResponseDialog Component** (2h)
   - Form to log vendor response
   - Upload PDF quote
   - Enter pricing details
   - Add notes

2. **Quote Comparison View** (2h)
   - Side-by-side comparison of 2-3 quotes
   - Highlight best price, features
   - AI recommendation (which to choose)

3. **Integrate into Communications List** (1h)
   - "Log Response" button per communication
   - Open QuoteResponseDialog
   - Save to Quote model

4. **Testing** (1h)

**Acceptance Criteria**:
- ✅ User can manually log vendor response
- ✅ Upload quote PDF
- ✅ Compare multiple quotes side-by-side
- ✅ See AI recommendation

**SCAR Assignment**: Deploy SCAR

---

#### Sprint 2.3: Quote Acceptance Flow (Jan 25-26) - 6 hours
**Issue**: Accept/Reject Quotes and Confirm Vendors

**Tasks**:
1. **Add Accept/Reject Actions to Quotes** (2h)
   - Accept button → marks quote as ACCEPTED
   - Reject button → marks as REJECTED
   - Only one quote per phase can be accepted

2. **Confirmed Vendors Summary** (2h)
   - Show accepted vendors on project page
   - "Confirmed Accommodation: Hotel Barcelona"
   - "Confirmed Travel: Nordic Youth Travel"
   - "Confirmed Food: Barcelona Catering Co."

3. **Phase Status Auto-Update** (1h)
   - When quote accepted → phase status = COMPLETED
   - Visual indicator on Gantt chart

4. **Testing** (1h)

**Acceptance Criteria**:
- ✅ User can accept one quote per phase
- ✅ Confirmed vendors displayed prominently
- ✅ Phase auto-completes when vendor confirmed
- ✅ Cannot accept multiple quotes for same phase

**SCAR Assignment**: Deploy SCAR

---

### WEEK 3: End-to-End Testing & Polish (Jan 27 - Feb 2)
**Goal**: Validate full workflow with real project, fix bugs, polish UX
**Days Available**: 7 days
**Estimated Effort**: 20-24 hours

#### Sprint 3.1: Real Project Test (Jan 27-29) - 10 hours
**Test Scenario**: Barcelona Youth Exchange (30 participants, 7 days, 3 countries)

**Process**:
1. **Day 1 - Ideation to Project** (3h)
   - Generate seeds
   - Elaborate one seed
   - Convert to project
   - Verify phases auto-created

2. **Day 2 - Budget & Vendor Research** (4h)
   - Calculate Erasmus+ budget
   - Search accommodation (Barcelona)
   - Search travel (Stockholm, Berlin, Warsaw → Barcelona)
   - Search food (Barcelona caterers)
   - Generate quotes for all 3

3. **Day 3 - Quote Management** (3h)
   - Log 2-3 vendor responses
   - Compare quotes
   - Accept best options
   - Generate application form
   - Export project (PDF/Excel)

**Output**: Detailed bug list, UX friction points, AI prompt improvements

---

#### Sprint 3.2: Bug Fixes & UX Polish (Jan 30 - Feb 1) - 10 hours
**Based on Sprint 3.1 findings**

**Common Issues to Address**:
1. **AI Prompt Quality**
   - Improve agent response relevance
   - Better pros/cons specificity
   - More accurate pricing estimates

2. **UI/UX Friction**
   - Loading states (search takes 30-60s)
   - Error handling (API failures)
   - Mobile responsiveness
   - Form validation

3. **Performance**
   - Optimize slow queries
   - Cache repeated calculations
   - Reduce bundle size if needed

4. **Data Quality**
   - Ensure budget calculations accurate
   - Verify distance calculations match EU tool
   - Test edge cases (very long trips, many countries)

---

### WEEK 4: Final Buffer & Deployment (Feb 3-9)
**Goal**: Production-ready by Feb 10
**Days Available**: 7 days
**Estimated Effort**: 10-15 hours

#### Sprint 4.1: Final Cleanup (Feb 3-5) - 6 hours
1. **Documentation** (2h)
   - User guide for Feb deadline projects
   - Video walkthrough (record Loom)
   - Known issues list
   - Workarounds for bugs

2. **Deployment Verification** (2h)
   - Verify all features work in production
   - Test SendGrid email delivery
   - Check API rate limits
   - Ensure secrets configured

3. **Backup Plans** (2h)
   - Document manual fallbacks
   - "If accommodation agent fails, use manual research"
   - "If SendGrid down, copy email text manually"

---

#### Sprint 4.2: User Training (Feb 6-7) - 4 hours
1. **Live Walkthrough** (2h)
   - Screen share with user
   - Walk through full workflow
   - Answer questions
   - Note feedback

2. **Quick Reference Guide** (2h)
   - One-page cheat sheet
   - Common workflows
   - Troubleshooting tips

---

#### Sprint 4.3: Final Buffer (Feb 8-9) - 4 hours
**Reserved for last-minute emergencies**

---

## Parallel Execution Strategy

### Week 1 Parallel Work
**Run 3 SCAR agents simultaneously**:
1. SCAR #1: Food Agent UI (Issue #XX)
2. SCAR #2: Accommodation Agent Enhancement (Issue #YY)
3. SCAR #3: Budget Tracking Integration (Issue #ZZ)

**Rationale**: All 3 tasks are independent, no conflicts expected

**Supervisor Monitoring**:
- Poll every 5 minutes
- Check for PRs created
- Review and merge sequentially
- Deploy staging after each merge

---

### Week 2 Parallel Work
**Run 2 SCAR agents simultaneously**:
1. SCAR #1: Communication Tracking UI (Issue #AA)
2. SCAR #2: Quote Response Management (Issue #BB)

**Sequential**:
- SCAR #3: Quote Acceptance Flow (depends on Quote Response schema)

---

## Risk Management

### High-Risk Items
1. **Accommodation Agent Quality** - Backend needs significant enhancement
   - **Mitigation**: Start this first (Jan 15), allocate 10 hours
   - **Fallback**: Simplify to basic AI suggestions if web scraping fails

2. **SendGrid Rate Limits** - If user sends 100+ emails/day
   - **Mitigation**: Monitor usage, upgrade plan if needed
   - **Fallback**: Manual email copy/paste

3. **Time Pressure** - 28 days is tight
   - **Mitigation**: Ruthless prioritization, drop P2 features if needed
   - **Fallback**: Ship with 85% complete, iterate in March

### Medium-Risk Items
1. **AI Response Quality** - Agents might generate low-quality suggestions
   - **Mitigation**: Test early (Week 3), refine prompts
   - **Fallback**: User can edit/override AI suggestions

2. **SCAR Execution Speed** - If SCAR takes 3x longer than estimated
   - **Mitigation**: Monitor closely, intervene at 2x time budget
   - **Fallback**: Manual implementation for critical features

---

## Success Metrics

### By February 10, 2026
**Must-Have (P0)**:
- ✅ User can complete full workflow (Steps 1-11)
- ✅ All 3 vendor research agents working (Travel, Food, Accommodation)
- ✅ Quote generation and email delivery functional
- ✅ Application form generation working
- ✅ Export system operational

**Should-Have (P1)**:
- ✅ Communication tracking visible to user
- ✅ Quote comparison and acceptance flow
- ✅ Budget tracking integrated

**Nice-to-Have (P2)**:
- ⚠️ Advanced budget alerts
- ⚠️ Multi-project dashboard
- ⚠️ Learning from past projects

### Quality Metrics
- **Time Savings**: 40-60h manual work → 4-6h with system
- **Accuracy**: Budget calculations 98%+ accurate vs EU calculator
- **AI Quality**: Pros/cons rated "helpful" by user in 80%+ cases
- **Email Quality**: 90%+ emails require < 5 min editing
- **System Stability**: < 5 bugs per day during Feb deadline crunch

---

## Daily Execution Rhythm

### Supervisor Daily Tasks
1. **Morning Check-In** (9:00 CET)
   - Review overnight SCAR progress
   - Check for completed PRs
   - Prioritize day's work

2. **Midday Review** (13:00 CET)
   - Monitor active SCAR agents
   - Review any blocked work
   - Make merge decisions

3. **Evening Status** (18:00 CET)
   - Merge completed work
   - Deploy to staging
   - Plan next day

---

## Phase 2 (Post-Feb 10) - Deferred Features

### Intelligence Layer (March-April)
1. **SALTO-Youth Partner Matching** (2 weeks)
   - RAG-powered partner recommendations
   - Vector database integration

2. **Application Examples RAG** (2 weeks)
   - Learn from successful applications
   - Improve narrative quality

3. **Learning System** (2 weeks)
   - Pattern extraction
   - Auto-population improvements

**Total**: 6 weeks of Phase 2 work after Feb deadline

---

## Conclusion

**Realistic Assessment**: This plan is achievable but requires discipline

**Key Success Factors**:
1. **Start immediately** - Don't wait for perfect plan
2. **Parallel execution** - Use SCAR agents concurrently
3. **Test continuously** - Week 3 real project test is critical
4. **Ruthless cuts** - Drop P2 features if behind schedule
5. **User-first mindset** - If user can't click it, it doesn't count

**Estimated Total Effort**: 70-80 hours over 28 days = 2.5-3 hours/day average

**Confidence Level**: **HIGH** - Plan is detailed, realistic, with buffers built in

**Next Action**: Create GitHub issues for Week 1 sprints, deploy first SCAR agents

---

**Plan Created**: 2026-01-13 11:00 CET
**Plan Author**: Autonomous Supervision System
**Status**: Ready for Execution ✅
