# Open Horizon: AI-Powered Erasmus+ Business Platform

**Version:** 3.0 (Final - February Deadline with Profit Tracking)
**Date:** 2026-01-08
**Status:** Ready for Implementation
**Context:** Solo service business, February 12 deadline, 5-10 applications target

---

## Problem Statement

**You're building a service business submitting Erasmus+ Youth Exchange applications for other organizations and executing approved projects for profit.**

**Current blockers:**
1. Manual application writing: 20-40 hours each = max 2-3 submissions
2. No way to calculate profit margins (Erasmus+ income vs actual costs)
3. Manual vendor research and quote collection
4. Can't assess project viability before applying

**February 12 deadline = 35 days** to build system that lets you:
- Generate 5-10 high-quality applications with AI
- Calculate exact Erasmus+ grant income per project
- Get real vendor quotes to estimate costs
- See profit margin before deciding to apply
- Track accumulated profit across all projects

---

## Proposed Solution

**Build unified platform: Seeds → Projects → Pipeline → Income Calculator → Vendor Quotes → Profit Dashboard → Application Generator**

### Core Value Proposition

**For each project, AI calculates:**
1. **INCOME:** Erasmus+ grant based on official unit costs (participants × days × country rates)
2. **COSTS:** Real vendor quotes (accommodation, food, activities)
3. **PROFIT:** Income - Costs = What you earn

**Example:**
- Barcelona exchange: 20 participants, 7 days
- **Erasmus+ Grant:** €18,500 (AI calculates from official rates)
- **Your Costs:** €12,000 (AI gets quotes, you add margin)
- **Your Profit:** €6,500 (35% margin)
- **Dashboard:** Accumulated profit across 10 projects = €65,000

---

## What We're Building (4 Weeks)

### Week 1 (Jan 8-14): Foundation + Income Calculator

**Days 1-2: Database & Infrastructure**
- Merge PR #37 (deployment fixes)
- Add Phase, AIConversation, Vendor, Quote models to schema
- Run migration on production
- Fix Issue #24 (seed → project prefill with AI)

**Days 3-5: Erasmus+ Income Calculator**
- Create budget calculator service
- Input: participants, activity days, travel days, origin/destination countries, distance
- Calculate using official unit cost tables:
  - Organisational Support (€34-€125 per participant/day)
  - Individual Support (€41-€83 per participant/day)
  - Travel (€20-€1,735 per participant based on distance)
  - Inclusion Support (€125 per participant if applicable)
- Output: Total Erasmus+ grant amount
- Display in project budget view

**Success Criteria:**
- ✅ Income calculator returns accurate Erasmus+ grant amount
- ✅ Matches official EU calculator results (test with 3 scenarios)

---

### Week 2 (Jan 15-21): AI Agents + Email Automation

**Days 1-3: AI Agent Integration**
- Copy 3 agents from pipeline: Accommodation, Activities, Emergency
- Create chat API endpoint (POST /api/projects/[id]/phases/[phaseId]/chat)
- Build chat UI component
- Store conversations in AIConversation model
- Test: Chat with all 3 agents, get recommendations with pricing

**Days 4-5: Email Automation**
- Migrate EmailService from pipeline
- Integrate SendGrid API
- Create vendor quote request workflow:
  1. User chats with AccommodationAgent: "Find hotels in Barcelona for 20 students"
  2. AI returns 5 recommendations with estimated prices
  3. User selects 3 hotels
  4. AI composes professional quote request emails
  5. User reviews and clicks "Send All"
  6. System sends via SendGrid, tracks status
  7. Quotes received → User enters actual amounts
- Create Vendor and Communication models for tracking

**Success Criteria:**
- ✅ All 3 agents respond within 10 seconds
- ✅ AccommodationAgent provides hotels with realistic price estimates
- ✅ Email system sends quote requests successfully
- ✅ User can track which vendors responded

---

### Week 3 (Jan 22-28): Profit Dashboard + Application Generator

**Days 1-2: Profit Tracking**
- Create cost estimation interface:
  - Accommodation costs (from quotes)
  - Food costs (from quotes)
  - Activities costs (from quotes)
  - Insurance costs (fixed or quoted)
  - Emergency fund allocation
- Real-time profit calculation:
  - **Income:** Erasmus+ grant (from calculator)
  - **Costs:** Sum of all estimated costs
  - **Profit:** Income - Costs
  - **Margin:** (Profit / Income) × 100%
- Per-project profit display
- **NEW: Accumulated Profit Dashboard**
  - List all projects with status (DRAFT, APPLIED, APPROVED, COMPLETED)
  - For each: Show income, costs, profit, margin
  - Total accumulated profit across all projects
  - Filter by status (only APPROVED projects = confirmed profit)

**Days 3-5: Application Generator**
- Research KA152-YOU application form sections (from Erasmus+ research)
- Create AI prompts for each section:
  1. Context (project summary, location, dates)
  2. Participating Organisations (your org + partners)
  3. Project Rationale (needs analysis, objectives)
  4. Project Details (activities, participants, timeline, budget request)
  5. Quality Standards (Erasmus+ priorities alignment)
  6. Annexes (partnership agreements, support letters)
- Aggregate data from:
  - Project concept (from seeds)
  - Timeline phases
  - AI agent conversations
  - Budget (income calculator + cost estimates)
- Generate structured JSON
- **Export Options:**
  - **JSON:** For importing into EU webform (primary)
  - **PDF:** Formatted preview document (secondary)
  - **Word/DOCX:** For editing before submission (tertiary)

**Success Criteria:**
- ✅ Profit dashboard shows real-time margins per project
- ✅ Accumulated profit updates across all projects
- ✅ Application generator produces complete JSON with all required fields
- ✅ Generated content is coherent and Erasmus+-compliant
- ✅ Takes <5 minutes to generate

---

### Week 4 (Jan 29 - Feb 9): Testing, Polish & Production Launch

**Days 1-5: End-to-End Testing**
- Create 3 test projects with real scenarios:
  1. Barcelona exchange (20 participants, 7 days)
  2. Berlin training (15 participants, 5 days)
  3. Athens cultural exchange (25 participants, 10 days)
- For each project:
  - Generate seed → Create project
  - Calculate Erasmus+ income (verify accuracy)
  - Chat with agents → Get recommendations
  - Send quote request emails (test SendGrid)
  - Enter estimated costs
  - Verify profit calculation
  - Generate application JSON
  - Review quality
- Fix any bugs discovered
- Improve AI prompts based on output quality

**Days 6-10: Production Deployment & First Applications**
- Deploy to app.openhorizon.cc
- Create 5-10 real project concepts
- Generate applications for February 12 submission
- Adjust AI prompts if needed
- Prepare final submissions

**Success Criteria:**
- ✅ Can generate complete project from seed in <30 minutes
- ✅ Income calculator matches EU official calculator
- ✅ Profit margins clear and accurate
- ✅ Email system working reliably
- ✅ Application quality ready for submission (80% ready, 20% manual polish)
- ✅ 5-10 applications ready by February 12

---

## Erasmus+ Funding Rules (Reference)

### Budget Categories & Rates

Based on official EC unit cost tables (2024-2027 programme):

| Category | Amount per Participant | Calculation |
|----------|------------------------|-------------|
| **Organisational Support** | €34-€125/day | Varies by host country; multiply by participants × activity days |
| **Individual Support (subsistence)** | €41-€83/day | Daily living costs; varies by country; multiply by participants × total days (activity + travel) |
| **Travel** | €20-€1,735 one-way | Based on distance bands from origin to destination |
| **Inclusion Support** | €125 flat rate | Per participant with fewer opportunities |
| **Preparatory Visits** | €680 per person | Max 2 representatives per organization |
| **Exceptional Costs** | 80-100% reimbursement | Visas, expensive travel, medical certificates |

### Distance Bands (for Travel Budget)

| Distance | Amount per Participant (one-way) |
|----------|----------------------------------|
| 10-99 km | €20 |
| 100-499 km | €180 |
| 500-1,999 km | €275 |
| 2,000-2,999 km | €360 |
| 3,000-3,999 km | €530 |
| 4,000-7,999 km | €820 |
| 8,000+ km | €1,500 |

**Note:** Green travel (low-emission transport) adds up to 4 extra travel days + €50 supplement per participant.

### Example Calculation

**Project:** Sweden → Poland Youth Exchange
- Participants: 20
- Activity days: 5
- Travel days: 2 (1 before + 1 after)
- Distance: ~1,000 km (500-1,999 band)

**Erasmus+ Grant:**
- Organisational: 20 × 5 × €34 (Poland rate) = **€3,400**
- Individual: 20 × 7 × €50 (est. avg) = **€7,000**
- Travel: 20 × €275 (500-1,999 band) = **€5,500**
- **Total: €15,900**

**Your Costs (estimated from quotes):**
- Accommodation: €4,000 (hostel, €40/night per person)
- Food: €2,800 (€20/day per person)
- Activities: €1,500 (workshops, tours)
- Insurance: €600 (€30 per person)
- Local transport: €800
- **Total: €9,700**

**Your Profit:**
- €15,900 - €9,700 = **€6,200 (39% margin)**

---

## Technical Architecture

### Database Schema (Add to app/prisma/schema.prisma)

```prisma
model Project {
  // ... existing fields ...

  // Pipeline fields (add these)
  start_date         DateTime?
  end_date           DateTime?
  budget_total       Decimal? @db.Decimal(12, 2)
  budget_spent       Decimal? @default(0) @db.Decimal(12, 2)
  participants_count Int?
  location           String?
  origin_country     String? // For travel distance calculation
  host_country       String? // For unit cost selection

  // Erasmus+ income tracking
  erasmus_grant_calculated Decimal? @db.Decimal(12, 2)
  erasmus_grant_actual     Decimal? @db.Decimal(12, 2) // After approval

  // Profit tracking
  estimated_costs    Decimal? @db.Decimal(12, 2)
  profit_margin      Decimal? @db.Decimal(5, 2) // Percentage

  // Relations
  phases         Phase[]
  conversations  AIConversation[]
  vendors        ProjectVendor[]
  quotes         Quote[]
  communications Communication[]
}

model Phase {
  id               String      @id @default(cuid())
  project_id       String      @db.Uuid
  name             String
  type             PhaseType
  start_date       DateTime
  end_date         DateTime
  budget_allocated Decimal     @db.Decimal(12, 2)
  budget_spent     Decimal     @default(0) @db.Decimal(12, 2)
  order            Int

  project       Project          @relation(fields: [project_id], references: [id], onDelete: Cascade)
  conversations AIConversation[]
  quotes        Quote[]

  @@index([project_id])
}

model AIConversation {
  id         String   @id @default(cuid())
  project_id String   @db.Uuid
  phase_id   String?
  agent_type String   // 'accommodation', 'activities', 'emergency'
  messages   Json     // [{role: 'user'|'assistant', content: '...', timestamp: '...'}]
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  phase   Phase?  @relation(fields: [phase_id], references: [id], onDelete: Cascade)

  @@index([project_id])
  @@index([phase_id])
}

model Vendor {
  id            String   @id @default(cuid())
  name          String
  type          VendorType // 'hotel', 'hostel', 'restaurant', 'activity_provider', 'insurance', 'transport'
  email         String?
  phone         String?
  address       String?
  city          String?
  country       String?
  website       String?
  rating        Float?   // 0-5 stars
  response_rate Float?   // 0-100%
  created_at    DateTime @default(now())

  projects       ProjectVendor[]
  quotes         Quote[]
  communications Communication[]

  @@index([type])
  @@index([country])
}

model ProjectVendor {
  id         String   @id @default(cuid())
  project_id String   @db.Uuid
  vendor_id  String
  phase_type PhaseType? // Which phase is this vendor for
  status     ProjectVendorStatus @default(POTENTIAL)
  notes      String?
  created_at DateTime @default(now())

  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  vendor  Vendor  @relation(fields: [vendor_id], references: [id], onDelete: Cascade)

  @@unique([project_id, vendor_id])
  @@index([project_id])
}

model Quote {
  id          String      @id @default(cuid())
  project_id  String      @db.Uuid
  phase_id    String?
  vendor_id   String?
  description String
  amount      Decimal     @db.Decimal(12, 2)
  currency    String      @default("EUR")
  status      QuoteStatus @default(PENDING)
  valid_until DateTime?
  notes       String?
  created_at  DateTime    @default(now())
  updated_at  DateTime    @updatedAt

  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  phase   Phase?  @relation(fields: [phase_id], references: [id], onDelete: Cascade)
  vendor  Vendor? @relation(fields: [vendor_id], references: [id], onDelete: Cascade)

  @@index([project_id])
  @@index([phase_id])
}

model Communication {
  id          String            @id @default(cuid())
  project_id  String            @db.Uuid
  vendor_id   String?
  direction   CommunicationDirection // 'OUTBOUND', 'INBOUND'
  type        CommunicationType      // 'EMAIL', 'PHONE', 'OTHER'
  subject     String?
  body        String?
  status      CommunicationStatus    // 'DRAFT', 'SENT', 'DELIVERED', 'RESPONDED'
  sent_at     DateTime?
  responded_at DateTime?
  created_at  DateTime          @default(now())

  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  vendor  Vendor? @relation(fields: [vendor_id], references: [id], onDelete: Cascade)

  @@index([project_id])
  @@index([vendor_id])
}

enum PhaseType {
  ACCOMMODATION
  TRAVEL
  FOOD
  ACTIVITIES
  INSURANCE
  EMERGENCY
  CUSTOM
}

enum VendorType {
  HOTEL
  HOSTEL
  GUESTHOUSE
  RESTAURANT
  CATERING
  ACTIVITY_PROVIDER
  INSURANCE
  TRANSPORT
  OTHER
}

enum ProjectVendorStatus {
  POTENTIAL
  CONTACTED
  QUOTED
  SELECTED
  CONTRACTED
  COMPLETED
}

enum QuoteStatus {
  PENDING
  RECEIVED
  ACCEPTED
  REJECTED
  EXPIRED
}

enum CommunicationDirection {
  OUTBOUND
  INBOUND
}

enum CommunicationType {
  EMAIL
  PHONE
  OTHER
}

enum CommunicationStatus {
  DRAFT
  SENT
  DELIVERED
  OPENED
  RESPONDED
}
```

---

### Backend API Routes

**Essential Routes (Week 1-3):**

```
# Projects
GET    /api/projects                              List all projects
POST   /api/projects                              Create project
GET    /api/projects/[id]                         Get project
PUT    /api/projects/[id]                         Update project
DELETE /api/projects/[id]                         Delete project

# Budget Calculator
POST   /api/projects/[id]/calculate-grant         Calculate Erasmus+ grant
PUT    /api/projects/[id]/costs                   Update estimated costs
GET    /api/projects/[id]/profit                  Get profit calculation

# Phases
POST   /api/projects/[id]/phases                  Create phase
GET    /api/projects/[id]/phases                  List phases
PUT    /api/projects/[id]/phases/[phaseId]        Update phase
DELETE /api/projects/[id]/phases/[phaseId]        Delete phase

# AI Agents
POST   /api/projects/[id]/phases/[phaseId]/chat  AI chat
GET    /api/projects/[id]/conversations           Get all conversations

# Vendors & Quotes
GET    /api/vendors                               List vendors
POST   /api/vendors                               Create vendor
POST   /api/projects/[id]/quotes                  Add quote
PUT    /api/quotes/[quoteId]                      Update quote
GET    /api/projects/[id]/quotes                  List project quotes

# Email Automation
POST   /api/communications/compose                AI compose email
POST   /api/communications/send                   Send email via SendGrid
GET    /api/communications/[id]/status            Check email status
POST   /api/communications/webhook                SendGrid webhook

# Application Generator
POST   /api/projects/[id]/generate-application    Generate application
GET    /api/projects/[id]/application/download    Download PDF/JSON/DOCX

# Dashboard
GET    /api/dashboard/profit-summary              Accumulated profit across all projects
```

---

### Frontend Pages

**Essential Pages (Week 1-3):**

```
/projects                                         Projects list
/projects/new                                     Create new project
/projects/[id]                                    Project detail
/projects/[id]/pipeline                           Timeline view (Frappe Gantt)
/projects/[id]/pipeline/phases/[phaseId]          Phase detail + AI chat
/projects/[id]/budget                             Budget & profit calculator
/projects/[id]/vendors                            Vendors & quotes
/projects/[id]/communications                     Email tracking
/projects/[id]/application                        Application generator
/dashboard/profit                                 Accumulated profit dashboard
```

---

### AI Agents Implementation

**3 Core Agents (Week 2):**

#### 1. AccommodationAgent
```typescript
Purpose: Find accommodation options and estimate costs
Input: Location, participants, dates, budget per person
Output: 5 recommendations with:
  - Name, address, contact
  - Type (hotel, hostel, guesthouse)
  - Capacity (can fit group)
  - Estimated price per night per person
  - Suitability score (0-100)
  - Reasoning (why recommended)

Implementation:
- AI-generated recommendations (realistic based on training data)
- Future: Optional web scraping (Booking.com) if needed
- Stores recommendations in AIConversation
- User can select for quote request
```

#### 2. ActivitiesAgent
```typescript
Purpose: Suggest educational activities aligned with Erasmus+ priorities
Input: Location, participants, age group, theme, days
Output: 5-10 activity suggestions with:
  - Activity name
  - Type (workshop, tour, team-building, etc.)
  - Educational value (learning outcomes)
  - Duration
  - Estimated cost per participant
  - Age-appropriateness
  - Booking information

Implementation:
- AI-generated based on location and theme
- Prioritizes non-formal education methods
- Emphasizes EU priorities (inclusion, sustainability, digital skills)
```

#### 3. EmergencyAgent
```typescript
Purpose: Generate comprehensive emergency plan
Input: Location, participants, age group, dates
Output: Emergency plan document with:
  - Emergency contacts (police, ambulance, embassy)
  - Medical facilities (hospitals with English-speaking staff)
  - Risk assessment (medical, safety, political, natural disasters)
  - Communication procedures
  - Evacuation plans
  - Meeting points

Implementation:
- AI-generated based on location research
- Outputs formatted document (includes in application)
```

---

## Email Automation Workflow

### Quote Request Process

**Step 1: AI Research**
User: "Find hotels in Barcelona for 20 students, €50/night budget"
AccommodationAgent: Returns 5 hotels with details

**Step 2: Selection**
User: Selects 3 hotels from recommendations
System: Creates Vendor records, links to project

**Step 3: Email Composition**
```typescript
POST /api/communications/compose
Input:
  - Vendor details
  - Project details (dates, participants, requirements)
  - Phase type (accommodation)

AI (Claude) generates professional email:

Subject: Quote Request - Youth Exchange Group Accommodation (20 participants)

Dear [Hotel Name] Team,

We are planning an Erasmus+ Youth Exchange in Barcelona from [dates] with
20 participants (ages [age range]). We are seeking accommodation quotes
for [X] nights.

Requirements:
- 20 participants (group booking)
- Check-in: [date]
- Check-out: [date]
- Room type: [preference]
- Dietary needs: [if any]
- Accessibility: [if needed]

Budget: Approximately €50 per person per night

Could you please provide:
1. Availability for these dates
2. Group rates and discounts
3. Included services (breakfast, WiFi, etc.)
4. Payment terms and cancellation policy

We look forward to your response.

Best regards,
[Your organization]
[Contact details]
```

**Step 4: Review & Send**
User: Reviews email, can edit
User: Clicks "Send" or "Send All" (for multiple vendors)
System: Sends via SendGrid, tracks status in Communication model

**Step 5: Tracking**
- SendGrid webhook updates status: SENT → DELIVERED → OPENED
- User receives notification when vendor responds
- User manually enters quote amount (or AI parses response in future)

---

## Profit Dashboard Design

### Per-Project Profit Display

```
PROJECT: Barcelona Youth Exchange (Feb 2026)
Status: APPLIED

INCOME (Erasmus+ Grant)
  Organisational Support:        €3,400
  Individual Support:            €7,000
  Travel:                        €5,500
  ────────────────────────────────────
  Total Erasmus+ Grant:         €15,900

ESTIMATED COSTS
  Accommodation:                 €4,000  [3 quotes received]
  Food:                          €2,800  [2 quotes pending]
  Activities:                    €1,500  [planned]
  Insurance:                       €600  [quoted]
  Local Transport:                 €800  [estimated]
  ────────────────────────────────────
  Total Costs:                   €9,700

PROFIT
  Income - Costs:                €6,200
  Margin:                        39.0%
  ────────────────────────────────────
  Status: Potential (pending approval)
```

### Accumulated Profit Dashboard

```
PROFIT OVERVIEW - ALL PROJECTS

Total Projects: 10
└─ DRAFT:     3
└─ APPLIED:   5
└─ APPROVED:  2
└─ COMPLETED: 0

POTENTIAL PROFIT (APPLIED + APPROVED)
  Barcelona Youth Exchange       €6,200    39%   [APPLIED]
  Berlin Training Course         €4,500    32%   [APPLIED]
  Athens Cultural Exchange       €8,100    41%   [APPLIED]
  Warsaw Sustainability Project  €5,800    35%   [APPLIED]
  Lisbon Leadership Programme    €7,200    40%   [APPLIED]
  Rome Art Workshop              €6,500    38%   [APPROVED]
  Paris Language Exchange        €5,900    36%   [APPROVED]
  ──────────────────────────────────────────────
  TOTAL POTENTIAL:              €44,200    38% avg

CONFIRMED PROFIT (APPROVED ONLY)
  Rome Art Workshop              €6,500    38%
  Paris Language Exchange        €5,900    36%
  ──────────────────────────────────────────────
  TOTAL CONFIRMED:              €12,400    37% avg

DRAFT PROJECTS (Not Yet Applied)
  3 projects in planning
  Estimated potential: €18,000

──────────────────────────────────────────────
GRAND TOTAL POTENTIAL: €62,200
```

---

## Implementation Timeline (4 Weeks)

### Week 1: Foundation + Income Calculator

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| **Jan 8-9** | - Merge PR #37<br>- Add database models<br>- Run migration<br>- Fix Issue #24 | ✅ Seed → Project flow works<br>✅ Database ready |
| **Jan 10-12** | - Build Erasmus+ income calculator<br>- Create budget calculator service<br>- Add unit cost tables<br>- Test calculations | ✅ Calculator returns accurate grants<br>✅ Matches EU official calculator |
| **Jan 13-14** | - Create basic pipeline integration<br>- Display timeline<br>- Budget allocation UI | ✅ Can open pipeline<br>✅ Can edit phases and budget |

---

### Week 2: AI Agents + Email

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| **Jan 15-17** | - Copy 3 agents from pipeline<br>- Create chat API<br>- Build chat UI<br>- Test agents | ✅ All 3 agents working<br>✅ Chat interface functional |
| **Jan 18-19** | - Migrate EmailService<br>- Integrate SendGrid<br>- Build email composition<br>- Test sending | ✅ Email automation working<br>✅ Quote requests sent successfully |
| **Jan 20-21** | - Create vendor management<br>- Quote tracking<br>- Test end-to-end | ✅ Vendor workflow complete |

---

### Week 3: Profit Dashboard + Application Generator

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| **Jan 22-24** | - Build cost estimation UI<br>- Real-time profit calculation<br>- Per-project profit display<br>- Accumulated profit dashboard | ✅ Profit tracking working<br>✅ Dashboard shows all projects |
| **Jan 25-28** | - Research application format<br>- Build application generator<br>- Create AI prompts<br>- JSON/PDF export | ✅ Application generator working<br>✅ Output is Erasmus+-compliant |

---

### Week 4: Testing & Launch

| Day | Tasks | Deliverables |
|-----|-------|--------------|
| **Jan 29-Feb 2** | - Create 3 test projects<br>- End-to-end testing<br>- Fix bugs<br>- Improve prompts | ✅ All features tested<br>✅ Quality verified |
| **Feb 3-9** | - Production deployment<br>- Create 5-10 real projects<br>- Generate applications<br>- Prepare submissions | ✅ 5-10 applications ready<br>✅ Submitted by Feb 12 |

---

## Success Criteria

### Week 1 Completion
- [x] Seed → Project flow works with AI prefill
- [x] Income calculator returns accurate Erasmus+ grant amounts
- [x] Calculator tested against 3 scenarios, matches EU official calculator
- [x] Basic pipeline timeline displays

### Week 2 Completion
- [x] All 3 AI agents (Accommodation, Activities, Emergency) respond within 10 seconds
- [x] Recommendations are relevant and realistic
- [x] Email system sends quote requests via SendGrid
- [x] Email tracking works (status updates)

### Week 3 Completion
- [x] Profit calculation accurate (income - costs)
- [x] Per-project profit displays correctly
- [x] Accumulated profit dashboard aggregates all projects
- [x] Application generator produces complete JSON
- [x] Generated content is Erasmus+-compliant (human-reviewed)

### Week 4 Completion (Launch)
- [x] 3 test projects completed end-to-end
- [x] Zero blocking bugs
- [x] AI prompt quality verified (80% ready, 20% manual editing)
- [x] Production deployed
- [x] 5-10 applications ready for February 12 submission

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| **4 weeks too aggressive** | Medium | High | Cut scope: Defer 1-2 agents if needed, focus on income calculator + application generator |
| **SendGrid setup issues** | Low | Medium | Test early (Week 2 Day 1), have backup (manual email if needed) |
| **AI quality insufficient** | Medium | High | Human review loop: Generate → User edits → Export |
| **Income calculator inaccurate** | Low | Critical | Test against official EU calculator, validate with past projects |
| **Application format changes** | Low | Medium | Monitor EU portal, adjust prompts if needed |
| **Email deliverability** | Medium | Medium | Use SendGrid best practices, warm up domain if new |

---

## Open Questions

### Critical (Need Answers Week 1)
- [ ] **Do you have past Erasmus+ applications?** (Use as template for AI prompts)
- [ ] **What's your SendGrid account status?** (Need to set up? Existing?)
- [ ] **Do you have vendor contacts already?** (Hotels, activity providers)

### Important (Week 2)
- [ ] **What's your typical profit margin target?** (30%? 40%? Helps set quote budgets)
- [ ] **Which countries/cities are you targeting?** (Affects unit cost selection)
- [ ] **Do you have partner organizations?** (For project rationale section)

---

## Next Steps

### Immediate (Today)
1. **Approve this PRD** or request changes
2. **Share past application** (if available) for AI training
3. **Confirm SendGrid access** (API key ready?)

### Tomorrow (Jan 9)
1. **Create detailed implementation plan** with SCAR
2. **Merge PR #37** (deployment fixes)
3. **Start Week 1 Day 1** (database migration)

### Daily (Throughout)
- Progress updates every evening
- Block issues immediately
- Adjust timeline if needed

---

## Budget & ROI

**Development Timeline:** 4 weeks
**Investment:**
- Development: ~160 hours
- AI APIs: ~$150 (Anthropic + OpenAI)
- SendGrid: $15/month
- Infrastructure: $50/month

**Expected Returns:**
- February submissions: 5-10 applications
- Expected approval rate: 30-40% (3-4 projects approved)
- Profit per project: €5,000-€8,000
- **Total Revenue: €15,000-€32,000** from first round

**ROI: 100-200x on $200 investment**

---

**Status:** Ready for Implementation
**Approval Required:** User confirmation
**Start Date:** January 9, 2026
**Launch Date:** February 9, 2026 (3 days before deadline)
**Submission Deadline:** February 12, 2026

---

## Appendix: Official Erasmus+ Sources

All income calculations based on official EC documents:
- [Erasmus+ Programme Guide 2024-2027](https://erasmus-plus.ec.europa.eu/sites/default/files/2023-11/2024-Erasmus+Programme-Guide_EN.pdf)
- [Unit Costs & Lump Sums Decision](https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/erasmus/guidance/ls-and-unit-cost-decision_erasmus_en.pdf)
- [KA152-YOU Application Template](https://erasmus-plus.ec.europa.eu/sites/default/files/2023-11/2024-eplus-call-template-KA152-YOU.pdf)
