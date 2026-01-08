# Product Requirements Document (PRD)
## Project Pipeline Management System

**Version:** 1.0
**Date:** 2025-12-31
**Author:** SCAR AI Assistant
**Status:** Draft

---

## 1. Executive Summary

### 1.1 Product Vision
Create an intelligent, AI-powered project pipeline management system that automates and streamlines the entire lifecycle of Erasmus+ projects—from initial ideation to final reporting. The system will provide a visual, interactive timeline interface with embedded AI agents that learn from each project to progressively reduce manual effort and improve planning accuracy.

### 1.2 Problem Statement
Current project planning for Erasmus+ initiatives involves:
- **Manual, repetitive research** for vendors (hotels, catering, activities)
- **Fragmented tools** across planning, budgeting, and communication
- **No learning mechanism** - each project starts from scratch
- **Time-consuming coordination** with multiple vendors
- **Inconsistent planning** - easy to miss critical steps
- **Limited visibility** into project status and budget

### 1.3 Target Users
- **Primary:** Erasmus+ project coordinators and managers
- **Secondary:** Team members responsible for specific project phases
- **Tertiary:** Administrative staff handling budgets and reporting

### 1.4 Success Metrics
- **Time Savings:** 60% reduction in planning time by 5th project
- **Accuracy:** 85%+ budget and timeline accuracy
- **Automation:** 70% of vendor emails automated
- **Learning Effectiveness:** 40% reduction in user input by 5th project
- **User Satisfaction:** 4.5/5 rating on ease of use

---

## 2. Product Overview

### 2.1 Core Concept
An intelligent project management dashboard featuring:
1. **Visual Interactive Timeline** - Drag-and-drop Gantt-style pipeline
2. **Phase-Based Organization** - Pre-configured project phases (accommodation, travel, food, etc.)
3. **Embedded AI Agents** - Context-aware assistants for each phase
4. **Automated Communication** - AI-generated vendor emails and follow-ups
5. **Learning System** - Progressively improves suggestions based on historical data
6. **Budget Integration** - Real-time cost tracking and forecasting

### 2.2 Key Differentiators
- **AI-First Design:** Agents proactively research and suggest options
- **Learning Capability:** System improves with each project
- **Unified Interface:** Single dashboard for timeline, chat, and actions
- **Erasmus+ Specialized:** Built-in templates for Erasmus project requirements
- **Open Source Foundation:** Leveraging proven tools (OpenProject, SVAR Gantt)

---

## 3. User Stories & Use Cases

### 3.1 Primary User Stories

#### Story 1: Quick Project Initiation
**As a** project coordinator
**I want to** create a new project from a template
**So that** all necessary phases are pre-populated and I don't forget critical steps

**Acceptance Criteria:**
- Can select project type (e.g., "Student Exchange", "Training Program")
- System creates timeline with all relevant phases
- Each phase has pre-configured checklist items
- Budget is pre-allocated based on historical averages
- Timeline shows realistic durations based on past projects

#### Story 2: AI-Assisted Vendor Research
**As a** project coordinator
**I want to** click on the "Accommodation" phase and receive AI-researched hotel options
**So that** I don't have to manually search for suitable vendors

**Acceptance Criteria:**
- Clicking a phase opens detail view with chat interface
- AI agent displays 3-5 pre-researched options matching project criteria
- Each option shows key details: price range, location, amenities
- Can refine search with natural language ("near the beach", "under €100/night")
- Agent re-searches and updates suggestions in real-time

#### Story 3: Automated Vendor Contact
**As a** project coordinator
**I want to** select multiple hotels and click "Make Contact"
**So that** professional inquiry emails are sent automatically

**Acceptance Criteria:**
- Can select 1+ vendor options via checkbox
- "Make Contact" button becomes active when ≥1 selected
- AI composes professional email including:
  - Project details (dates, group size, purpose)
  - Specific requirements
  - Request for detailed quote
  - Response deadline
- User can review/edit email before sending
- System tracks sent emails and sets follow-up reminders
- Responses are automatically parsed for key information (pricing, availability)

#### Story 4: Interactive Timeline Management
**As a** project coordinator
**I want to** drag phases on the timeline to adjust schedules
**So that** I can easily adapt to changing circumstances

**Acceptance Criteria:**
- Can drag phase boxes to change start/end dates
- Dependent phases automatically adjust when predecessors change
- Timeline shows warnings if phases overlap inappropriately
- Can zoom in/out to see different time scales (days, weeks, months)
- Can mark phases as "complete", "in progress", "blocked"
- Can skip non-applicable phases

#### Story 5: Learning & Improvement
**As a** project coordinator
**I want to** the system to remember my preferences across projects
**So that** subsequent projects require less manual input

**Acceptance Criteria:**
- System tracks vendor choices and success rates
- Preferred vendors appear at top of suggestions
- Budget allocations improve based on actual spending
- Timeline estimates adjust based on actual completion times
- Frequently skipped phases are marked as "optional" in future projects
- System suggests new vendors with better response/success rates

#### Story 6: Budget Tracking & Forecasting
**As a** project coordinator
**I want to** see real-time budget status on the timeline
**So that** I know if I'm on track financially

**Acceptance Criteria:**
- Each phase shows: allocated budget, spent amount, remaining
- Timeline displays budget health indicators (green/yellow/red)
- Can add expenses to specific phases
- System alerts when approaching budget limits
- Can compare planned vs actual costs
- Generates budget reports for Erasmus+ reporting

#### Story 7: Comprehensive Reporting
**As a** project coordinator
**I want to** export project data for Erasmus+ reports
**So that** I can easily complete required documentation

**Acceptance Criteria:**
- Can export timeline as PDF/Excel
- Can generate budget summary report
- Can export activity logs (what happened when)
- Templates for interim and final Erasmus+ reports
- Auto-population of standard report fields from project data

---

## 4. Functional Requirements

### 4.1 Timeline & Visualization

#### FR-1.1: Interactive Gantt Timeline
- **MUST** display project phases as draggable boxes on a Gantt chart
- **MUST** support zooming (day/week/month/year views)
- **MUST** show dependencies between phases
- **MUST** allow drag-and-drop scheduling
- **MUST** provide today indicator/current progress marker
- **SHOULD** support milestone markers
- **SHOULD** color-code phases by status and category

#### FR-1.2: Phase Organization
- **MUST** support pre-defined phase templates:
  - Logistics: Travel, Accommodation, Food, Activities, Events
  - Administration: Insurance, Emergency Planning, Permits, Budgeting
  - Erasmus: Application, Approvals, Reporting, Final Documentation
- **MUST** allow custom phase creation
- **MUST** support phase editing (rename, reschedule, delete)
- **MUST** allow phases to be marked as "skipped" or "not applicable"
- **SHOULD** support phase duplication across projects

#### FR-1.3: Navigation
- **MUST** clicking a phase opens detail view
- **MUST** provide breadcrumb navigation (Dashboard > Project > Phase)
- **MUST** support quick switch between phases without returning to timeline
- **SHOULD** support keyboard shortcuts for navigation

### 4.2 AI Agent System

#### FR-2.1: Phase-Specific Agents
- **MUST** each phase type has a specialized AI agent:
  - Accommodation Agent (hotels, hostels, rentals)
  - Travel Agent (flights, trains, buses, transfers)
  - Food Agent (catering, restaurants, dietary requirements)
  - Activities Agent (tours, adventures, team building)
  - Event Agent (venues, entertainment, parties)
  - Insurance Agent (providers, coverage comparison)
  - Emergency Agent (plans, contacts, protocols)
- **MUST** agents have access to project context (dates, budget, participants, location)

#### FR-2.2: Research Capabilities
- **MUST** agents proactively research options when phase is activated
- **MUST** present 3-5 curated suggestions with rationale
- **MUST** support natural language refinement queries
- **MUST** re-search based on user feedback
- **SHOULD** explain why options were selected
- **SHOULD** learn from user selections (implicit feedback)

#### FR-2.3: Chat Interface
- **MUST** provide conversational interface in each phase detail view
- **MUST** maintain conversation history per phase
- **MUST** support multi-turn conversations
- **MUST** allow file uploads (e.g., requirements documents)
- **SHOULD** support voice input
- **SHOULD** provide suggested prompts/questions

### 4.3 Communication & Automation

#### FR-3.1: Email Composition
- **MUST** AI composes vendor inquiry emails
- **MUST** include all relevant project details
- **MUST** allow user review/editing before sending
- **MUST** support email templates per vendor type
- **SHOULD** support multiple languages
- **SHOULD** adapt tone based on vendor type and location

#### FR-3.2: Email Management
- **MUST** track sent emails (timestamp, recipient, status)
- **MUST** parse incoming responses for key information (pricing, availability)
- **MUST** set follow-up reminders (default: 3 days)
- **MUST** notify user of new responses
- **SHOULD** auto-categorize responses (positive, negative, needs-info)
- **SHOULD** suggest next actions based on responses

#### FR-3.3: Multi-Vendor Management
- **MUST** support sending to multiple vendors simultaneously
- **MUST** track responses from all vendors
- **MUST** provide comparison view for quotes
- **MUST** allow marking preferred vendors
- **SHOULD** support negotiation tracking

### 4.4 Budget & Cost Tracking

#### FR-4.1: Budget Management
- **MUST** support budget allocation per phase
- **MUST** track actual spending vs allocated budget
- **MUST** display budget health indicators (green/yellow/red)
- **MUST** support expense entry (amount, date, vendor, category)
- **MUST** calculate remaining budget in real-time
- **SHOULD** forecast final costs based on current trajectory
- **SHOULD** alert when approaching budget limits (e.g., 80%, 95%)

#### FR-4.2: Quote Management
- **MUST** store vendor quotes linked to phases
- **MUST** support quote comparison (side-by-side view)
- **MUST** track quote validity dates
- **MUST** allow marking quotes as accepted/rejected
- **SHOULD** automatically update budget when quote is accepted

#### FR-4.3: Financial Reporting
- **MUST** generate budget summary reports
- **MUST** export financial data (Excel, CSV, PDF)
- **MUST** show spending breakdown by phase/category
- **SHOULD** integrate with OpenProject budget modules
- **SHOULD** generate Erasmus+-compliant financial reports

### 4.5 Learning & Intelligence

#### FR-5.1: Preference Learning
- **MUST** track user selections (vendors, options, features)
- **MUST** identify patterns in choices (e.g., always chooses 4-star hotels near city center)
- **MUST** boost similar options in future suggestions
- **SHOULD** ask for explicit feedback on suggestions
- **SHOULD** learn from rejected options (what to avoid)

#### FR-5.2: Budget Learning
- **MUST** track actual spending vs initial estimates
- **MUST** improve budget allocations based on historical data
- **MUST** identify cost trends (seasonal pricing, vendor reliability)
- **SHOULD** warn about potentially unrealistic budgets
- **SHOULD** suggest budget adjustments based on similar past projects

#### FR-5.3: Timeline Learning
- **MUST** track actual phase duration vs estimates
- **MUST** improve timeline predictions based on historical completion times
- **MUST** identify common bottlenecks
- **SHOULD** suggest earlier start dates for historically delayed phases
- **SHOULD** recommend phase reordering for efficiency

#### FR-5.4: Vendor Learning
- **MUST** track vendor response rates and times
- **MUST** track vendor reliability (delivered as promised)
- **MUST** boost reliable vendors in suggestions
- **MUST** flag problematic vendors
- **SHOULD** build vendor reputation scores

### 4.6 Project Templates & Reusability

#### FR-6.1: Template Creation
- **MUST** allow saving projects as templates
- **MUST** templates include: phases, timeline structure, budget allocations
- **MUST** support template categories (Student Exchange, Training, Conference)
- **SHOULD** suggest templates based on project description
- **SHOULD** allow template customization during project creation

#### FR-6.2: Phase Templates
- **MUST** provide default checklists per phase type
- **MUST** allow custom checklist items
- **MUST** carry over frequently used checklists across projects
- **SHOULD** suggest checklist items based on project context

### 4.7 Collaboration & Access Control

#### FR-7.1: User Roles
- **MUST** support role-based access:
  - Admin: Full access, all projects
  - Coordinator: Full access to assigned projects
  - Team Member: Access to specific phases
  - Viewer: Read-only access
- **MUST** support role assignment per project
- **SHOULD** support custom role definitions

#### FR-7.2: Collaboration Features
- **MUST** support comments on phases
- **MUST** support task assignment to team members
- **MUST** notify assigned users of changes
- **SHOULD** support real-time updates (multiple users)
- **SHOULD** show who's currently viewing a phase

### 4.8 Integration & APIs

#### FR-8.1: OpenProject Integration
- **MUST** sync timeline with OpenProject work packages
- **MUST** sync budget data with OpenProject budgets
- **MUST** sync time tracking
- **SHOULD** support bi-directional sync (changes in either system reflected)

#### FR-8.2: External APIs
- **MUST** integrate with email service (SendGrid, SMTP)
- **SHOULD** integrate with booking platforms (Booking.com API, if available)
- **SHOULD** integrate with flight search APIs
- **COULD** integrate with calendar systems (Google Calendar, Outlook)

#### FR-8.3: Export & Import
- **MUST** export project data (JSON, CSV)
- **MUST** export timeline as image/PDF
- **SHOULD** import projects from CSV/Excel
- **SHOULD** API for third-party integrations

---

## 5. Non-Functional Requirements

### 5.1 Performance

#### NFR-1.1: Response Time
- **MUST** timeline loads in <2 seconds for projects with 50 phases
- **MUST** AI agent responds to chat messages in <5 seconds
- **SHOULD** AI research completes in <30 seconds
- **SHOULD** support 100+ concurrent users

#### NFR-1.2: Scalability
- **MUST** support 1000+ projects in database
- **MUST** support projects with 100+ phases
- **SHOULD** handle 10,000+ vendor contacts in database

### 5.2 Usability

#### NFR-2.1: User Experience
- **MUST** responsive design (desktop, tablet)
- **MUST** intuitive navigation (max 3 clicks to any feature)
- **SHOULD** mobile-friendly (view-only mode)
- **SHOULD** support keyboard navigation
- **SHOULD** accessibility compliance (WCAG 2.1 Level AA)

#### NFR-2.2: Learning Curve
- **MUST** new users can create project in <10 minutes
- **SHOULD** contextual help/tooltips throughout interface
- **SHOULD** onboarding tutorial for first-time users

### 5.3 Reliability

#### NFR-3.1: Availability
- **MUST** 99% uptime during business hours
- **MUST** automatic data backups (daily)
- **SHOULD** disaster recovery plan
- **SHOULD** zero data loss guarantee

#### NFR-3.2: Data Integrity
- **MUST** all data changes logged (audit trail)
- **MUST** support undo for critical actions
- **MUST** data validation on all inputs
- **SHOULD** version history for projects

### 5.4 Security

#### NFR-4.1: Authentication & Authorization
- **MUST** secure login (OAuth 2.0 or equivalent)
- **MUST** role-based access control
- **MUST** session timeout after inactivity
- **SHOULD** support SSO (Single Sign-On)
- **SHOULD** two-factor authentication

#### NFR-4.2: Data Security
- **MUST** encrypt data at rest (AES-256)
- **MUST** encrypt data in transit (TLS 1.3)
- **MUST** comply with GDPR
- **SHOULD** regular security audits
- **SHOULD** penetration testing

### 5.5 Maintainability

#### NFR-5.1: Code Quality
- **MUST** comprehensive test coverage (>80%)
- **MUST** automated testing (unit, integration, e2e)
- **MUST** code documentation
- **SHOULD** follow industry best practices
- **SHOULD** continuous integration/deployment

#### NFR-5.2: Observability
- **MUST** application logging (errors, warnings)
- **MUST** performance monitoring
- **SHOULD** user analytics (feature usage)
- **SHOULD** error tracking (Sentry or equivalent)

### 5.6 Compatibility

#### NFR-6.1: Browser Support
- **MUST** support latest versions of Chrome, Firefox, Safari, Edge
- **SHOULD** support browsers from last 2 years

#### NFR-6.2: Data Portability
- **MUST** export data in standard formats (JSON, CSV, PDF)
- **SHOULD** import from common project management tools

---

## 6. Technical Architecture

### 6.1 Technology Stack Recommendations

#### 6.1.1 Frontend
- **Framework:** React 18+ with TypeScript
- **Timeline Library:** SVAR Gantt (primary), Vis-Timeline (overview)
- **State Management:** React Query + Zustand
- **Styling:** TailwindCSS
- **Real-time:** Socket.io client
- **Testing:** Jest + React Testing Library + Playwright

#### 6.1.2 Backend
- **Runtime:** Node.js 20+ LTS
- **Framework:** Express.js or Fastify
- **API Style:** REST + WebSockets (for real-time chat)
- **Language:** TypeScript
- **Testing:** Jest + Supertest

#### 6.1.3 AI Layer
- **Orchestration:** LangChain or LangGraph
- **LLM Provider:** Anthropic Claude or OpenAI GPT-4
- **Vector Database:** Weaviate (self-hosted) or Pinecone (cloud)
- **Embeddings:** OpenAI text-embedding-3 or local models

#### 6.1.4 Data Layer
- **Primary Database:** PostgreSQL 15+
- **Cache:** Redis 7+
- **Search:** PostgreSQL full-text or Elasticsearch (if needed)
- **File Storage:** Local filesystem or S3-compatible storage

#### 6.1.5 Integration Layer
- **Email:** SendGrid or AWS SES
- **OpenProject:** REST API integration
- **Web Scraping:** Puppeteer or Playwright

#### 6.1.6 Infrastructure
- **Containerization:** Docker
- **Orchestration:** Docker Compose (dev), Kubernetes (prod)
- **CI/CD:** GitHub Actions
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK stack or Loki

### 6.2 System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Frontend (React + TS)                    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐ │
│  │ Timeline View  │  │ Phase Detail   │  │   Dashboard    │ │
│  │ (SVAR Gantt)   │  │ (Chat + Data)  │  │ (Vis-Timeline) │ │
│  └────────────────┘  └────────────────┘  └────────────────┘ │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ REST API + WebSocket
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   API Gateway (Express/Fastify)              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Auth        │  │  Projects    │  │  Phases      │       │
│  │  Middleware  │  │  Routes      │  │  Routes      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼─────────────────┐
          ▼                 ▼                 ▼
┌──────────────────┐ ┌──────────────┐ ┌──────────────────┐
│ Business Logic   │ │  AI Agent    │ │   Integration    │
│    Services      │ │ Orchestrator │ │    Services      │
│                  │ │              │ │                  │
│ • Project Mgmt   │ │ • Research   │ │ • OpenProject   │
│ • Phase Mgmt     │ │ • Email Gen  │ │ • Email Service │
│ • Budget Calc    │ │ • Learning   │ │ • External APIs │
│ • Timeline Calc  │ │ • Chat       │ │                  │
└──────────────────┘ └──────────────┘ └──────────────────┘
          │                 │                 │
          └─────────────────┼─────────────────┘
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ PostgreSQL   │  │ Redis Cache  │  │ Vector DB    │       │
│  │ (Projects,   │  │ (Sessions,   │  │ (Embeddings, │       │
│  │  Phases,     │  │  Real-time)  │  │  Learning)   │       │
│  │  Users)      │  │              │  │              │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└──────────────────────────────────────────────────────────────┘
```

### 6.3 Data Model (Key Entities)

#### Project
```typescript
{
  id: string
  name: string
  type: 'student_exchange' | 'training' | 'conference' | 'custom'
  status: 'planning' | 'in_progress' | 'completed' | 'cancelled'
  description: text
  start_date: date
  end_date: date
  budget_total: decimal
  budget_spent: decimal
  participants_count: integer
  location: string
  created_by: user_id
  created_at: timestamp
  updated_at: timestamp
  metadata: jsonb  // flexible storage for custom fields
}
```

#### Phase
```typescript
{
  id: string
  project_id: string (FK)
  name: string
  type: 'accommodation' | 'travel' | 'food' | 'activities' | ...
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped'
  start_date: date
  end_date: date
  deadline: date
  budget_allocated: decimal
  budget_spent: decimal
  order: integer  // for sequencing
  dependencies: string[]  // phase IDs that must complete first
  checklist: jsonb
  editable: boolean
  skippable: boolean
  assigned_to: user_id[]
  created_at: timestamp
  updated_at: timestamp
}
```

#### Vendor
```typescript
{
  id: string
  name: string
  type: 'hotel' | 'restaurant' | 'transport' | 'activity' | ...
  email: string
  phone: string
  website: string
  location: string
  rating: decimal  // system-calculated reliability score
  response_rate: decimal
  avg_response_time_hours: integer
  successful_bookings: integer
  total_contacts: integer
  notes: text
  metadata: jsonb
  created_at: timestamp
}
```

#### Communication
```typescript
{
  id: string
  project_id: string (FK)
  phase_id: string (FK)
  vendor_id: string (FK)
  type: 'email' | 'phone' | 'other'
  direction: 'outbound' | 'inbound'
  subject: string
  body: text
  status: 'draft' | 'sent' | 'delivered' | 'opened' | 'responded'
  sent_at: timestamp
  response_received_at: timestamp
  follow_up_scheduled: timestamp
  parsed_data: jsonb  // extracted info from responses
  created_at: timestamp
}
```

#### AIConversation
```typescript
{
  id: string
  project_id: string (FK)
  phase_id: string (FK)
  user_id: string (FK)
  messages: jsonb[]  // [{role, content, timestamp}]
  context: jsonb  // phase context, project details
  created_at: timestamp
  updated_at: timestamp
}
```

#### LearningPattern
```typescript
{
  id: string
  user_id: string (FK)  // null for org-wide patterns
  pattern_type: 'vendor_preference' | 'budget_allocation' | 'timeline_estimate'
  phase_type: string
  pattern_data: jsonb  // flexible storage for learned patterns
  confidence: decimal  // 0-1 score
  sample_size: integer  // how many data points
  created_at: timestamp
  updated_at: timestamp
}
```

---

## 7. User Interface Wireframes

### 7.1 Dashboard View (Timeline Overview)

```
┌─────────────────────────────────────────────────────────────────┐
│  Project Pipeline System        [New Project] [Settings] [User]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Project: Summer Exchange Barcelona 2025                       │
│  Status: In Progress  │  Budget: €45,000 / €50,000  [90%] 🟢  │
│  Timeline: Mar 1 - Jun 30, 2025                                │
│                                                                 │
│  ┌───────────────────── Timeline ─────────────────────────┐   │
│  │                                                         │   │
│  │  [< Zoom: Month >]  [Today: Apr 15]                   │   │
│  │                                                         │   │
│  │  Mar     Apr     May     Jun                          │   │
│  │  │───────│───────│───────│                            │   │
│  │  ████ Accommodation (Complete) ✓                      │   │
│  │      █████ Travel (In Progress)                       │   │
│  │          ████ Food Planning (Not Started)             │   │
│  │              ████ Activities (Not Started)            │   │
│  │                  ████ Insurance (Not Started)         │   │
│  │  │───────│───────│───────│                            │   │
│  │                                                         │   │
│  │  [Click any phase to open detail view]                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Quick Stats:                                                  │
│  ✓ 2/8 Phases Complete  │  ⚡ 1 Phase In Progress             │
│  📧 12 Emails Sent      │  ✉️ 8 Responses Received             │
│  💰 Budget on Track     │  📅 2 Days Ahead of Schedule        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Phase Detail View (Accommodation Example)

```
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard > Summer Exchange > Accommodation                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─ Phase Info ──────────────────────────────────────────────┐ │
│  │ Accommodation  │  Status: Complete ✓                      │ │
│  │ Dates: Mar 1-15  │  Budget: €12,000 / €15,000  [80%] 🟢  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─ AI Assistant ──────────────┬─ Selected Vendor ───────────┐ │
│  │                              │                             │ │
│  │  💬 Chat                     │  ✅ Hotel Mediterranean      │ │
│  │                              │  📍 Barcelona, Beachfront   │ │
│  │  AI: I've researched hotels  │  💰 €95/night (50 rooms)    │ │
│  │  matching your criteria.     │  ⭐ 4.5 stars               │ │
│  │  Here are my top picks:      │  📧 Quote Received          │ │
│  │                              │  📅 Booked: Mar 1-15        │ │
│  │  1. Hotel Mediterranean ⭐   │                             │ │
│  │     €95/night, beachfront    │  [View Details]             │ │
│  │     [Select] [More Info]     │  [Contact Vendor]           │ │
│  │                              │                             │ │
│  │  2. Hostel Barcelona Central │                             │ │
│  │     €45/night, city center   │                             │ │
│  │     [Select] [More Info]     │                             │ │
│  │                              │                             │ │
│  │  3. Student Residence UAB    │                             │ │
│  │     €60/night, near campus   │                             │ │
│  │     [Select] [More Info]     │                             │ │
│  │                              │                             │ │
│  │  ┌─────────────────────────┐ │                             │ │
│  │  │ Refine search...        │ │                             │ │
│  │  └─────────────────────────┘ │                             │ │
│  │                         [Send]│                             │ │
│  └──────────────────────────────┴─────────────────────────────┘ │
│                                                                 │
│  ┌─ Communication Log ─────────────────────────────────────────┐│
│  │ Mar 5: Email sent to Hotel Mediterranean, Hostel Barcelona  ││
│  │ Mar 6: Response from Hotel Med (quote: €95/night) ✉️         ││
│  │ Mar 7: Follow-up to Hostel Barcelona                        ││
│  │ Mar 8: Response from Hostel (quote: €45/night) ✉️            ││
│  │ Mar 10: Booked Hotel Mediterranean ✅                        ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                 │
│  [← Back to Timeline]  [Next Phase: Travel →]                  │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 Multi-Vendor Contact Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  Select Vendors to Contact                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ☑ Hotel Mediterranean        €95/night  ⭐ 4.5  Beachfront   │
│  ☑ Hostel Barcelona Central   €45/night  ⭐ 4.2  City Center  │
│  ☐ Student Residence UAB      €60/night  ⭐ 4.0  Near Campus  │
│  ☑ Hotel Arts Barcelona       €150/night ⭐ 5.0  Luxury       │
│                                                                 │
│  3 vendors selected                    [Make Contact]          │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Email Preview (Hotel Mediterranean)                            │
│                                                                 │
│  Subject: Accommodation Request - Erasmus Exchange Program     │
│                                                                 │
│  Dear Hotel Mediterranean Team,                                │
│                                                                 │
│  We are organizing an Erasmus student exchange program and are │
│  seeking accommodation for our participants.                   │
│                                                                 │
│  Project Details:                                              │
│  • Dates: March 1-15, 2025                                     │
│  • Participants: 50 students + 3 staff                         │
│  • Room Configuration: 25 doubles, 3 singles                   │
│  • Budget: Up to €100/night per room                           │
│                                                                 │
│  Requirements:                                                 │
│  • Breakfast included                                          │
│  • WiFi in all rooms                                           │
│  • Meeting room for 50 people (at least 3 sessions)           │
│  • Beachfront or beach proximity preferred                     │
│                                                                 │
│  Could you please provide:                                     │
│  1. Detailed quote for the above requirements                  │
│  2. Availability confirmation                                  │
│  3. Payment terms and cancellation policy                      │
│  4. Any group discounts available                              │
│                                                                 │
│  We would appreciate a response by March 10, 2025.            │
│                                                                 │
│  Best regards,                                                 │
│  [Your Name]                                                   │
│  Erasmus Project Coordinator                                   │
│                                                                 │
│  [Edit Email] [Preview Others] [Send to All Selected]         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 8. Development Phases & Timeline

### Phase 1: Foundation (Weeks 1-3)
**Deliverables:**
- Development environment setup
- Database schema implementation
- Basic authentication & authorization
- OpenProject integration (API connection)
- Project CRUD operations

**Resources:** 2 developers
**Risks:** OpenProject API compatibility issues

### Phase 2: Timeline Visualization (Weeks 4-5)
**Deliverables:**
- SVAR Gantt integration
- Timeline rendering (phases, dates, dependencies)
- Drag-and-drop functionality
- Phase detail navigation
- Dashboard overview (Vis-Timeline)

**Resources:** 1 frontend developer
**Risks:** Performance with large timelines

### Phase 3: AI Infrastructure (Weeks 6-8)
**Deliverables:**
- LangChain/LangGraph setup
- Chat interface (frontend + backend)
- First research agent (Accommodation)
- LLM API integration
- Context management system

**Resources:** 1 AI/backend developer, 1 frontend developer
**Risks:** LLM API costs, response quality

### Phase 4: Communication System (Weeks 9-10)
**Deliverables:**
- Email composition agent
- Email sending integration (SendGrid)
- Vendor database
- Email tracking & logging
- Response parsing (basic)

**Resources:** 1 backend developer
**Risks:** Email deliverability, spam filters

### Phase 5: Learning System (Weeks 11-12)
**Deliverables:**
- Vector database setup
- Learning agent implementation
- Pattern extraction from historical data
- Pre-population of suggestions
- Simple recommendation engine

**Resources:** 1 AI/backend developer
**Risks:** Data quality, cold start problem

### Phase 6: Additional Agents (Weeks 13-14)
**Deliverables:**
- Travel research agent
- Food/catering agent
- Activities agent
- Insurance agent
- Agent testing & refinement

**Resources:** 1 AI developer
**Risks:** Agent specialization quality

### Phase 7: Budget & Reporting (Weeks 15-16)
**Deliverables:**
- Budget tracking UI
- OpenProject budget sync
- Quote comparison interface
- Erasmus report templates
- Export functionality (PDF, Excel)

**Resources:** 1 full-stack developer
**Risks:** Report format requirements

### Phase 8: Polish & Testing (Weeks 17-18)
**Deliverables:**
- User acceptance testing
- Bug fixes
- Performance optimization
- Documentation (user guides, API docs)
- Training materials

**Resources:** 2 developers, 1 QA, 1 technical writer
**Risks:** Unexpected critical bugs

---

## 9. Success Criteria & KPIs

### 9.1 Launch Criteria (MVP)
- [ ] Users can create projects from templates
- [ ] Timeline displays all phases correctly
- [ ] At least 1 AI agent works (Accommodation)
- [ ] Email sending works reliably
- [ ] Budget tracking is functional
- [ ] OpenProject sync works
- [ ] System is secure (authentication, authorization)
- [ ] Documentation is complete

### 9.2 Key Performance Indicators (KPIs)

#### User Adoption
- **Target:** 80% of project coordinators using system within 3 months
- **Measurement:** Active users / total coordinators

#### Time Savings
- **Target:** 60% reduction in planning time by 5th project
- **Measurement:** Survey + time tracking comparison

#### Accuracy
- **Target:** 85% budget accuracy, 80% timeline accuracy
- **Measurement:** (actual / planned) per project

#### Automation Rate
- **Target:** 70% of vendor emails automated
- **Measurement:** automated emails / total emails sent

#### Learning Effectiveness
- **Target:** 40% reduction in user input by 5th project
- **Measurement:** User actions per project (trending down)

#### User Satisfaction
- **Target:** 4.5/5 average rating
- **Measurement:** Post-project surveys (NPS)

#### System Reliability
- **Target:** 99% uptime, <5 sec response time
- **Measurement:** Uptime monitoring, performance logs

---

## 10. Risks & Mitigation

### 10.1 Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| LLM API costs exceed budget | High | Medium | Implement caching, use smaller models for simple tasks, set rate limits |
| Poor AI response quality | Medium | High | Extensive prompt engineering, user feedback loop, fallback to manual |
| OpenProject integration breaks | Medium | Medium | Version pinning, comprehensive tests, fallback to standalone mode |
| Performance issues with large timelines | Medium | Medium | Pagination, lazy loading, optimize rendering |
| Email deliverability problems | Low | High | Use reputable service (SendGrid), SPF/DKIM setup, monitor bounce rates |

### 10.2 User Adoption Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Users don't trust AI suggestions | Medium | High | Transparency (show reasoning), allow overrides, gradual introduction |
| Learning curve too steep | Medium | Medium | Comprehensive onboarding, tooltips, video tutorials |
| Resistance to change from manual process | High | High | Demonstrate time savings early, executive buy-in, pilot program |
| Feature overload (too complex) | Medium | Medium | Phased rollout, progressive disclosure, focus on core workflows |

### 10.3 Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Scope creep | High | Medium | Strict change control, MVP focus, defer nice-to-haves |
| Timeline delays | Medium | Medium | Buffer in schedule, weekly reviews, prioritize ruthlessly |
| Budget overruns | Medium | High | Regular budget reviews, contingency fund (20%), track expenses |
| Vendor dependencies (APIs change) | Low | Medium | Abstract integrations, monitor vendor announcements, have alternatives |

---

## 11. Open Questions & Decisions Needed

### 11.1 Business Decisions
- [ ] **Pricing model:** Free for internal use, or eventually offer to other organizations?
- [ ] **Data privacy:** Where will customer data be stored? GDPR compliance needs?
- [ ] **Support model:** Who will handle user support and training?

### 11.2 Technical Decisions
- [ ] **LLM provider:** OpenAI GPT-4 vs Anthropic Claude vs open-source models?
- [ ] **Email service:** SendGrid vs AWS SES vs self-hosted?
- [ ] **Vector database:** Weaviate (self-hosted) vs Pinecone (cloud)?
- [ ] **Hosting:** Self-hosted vs cloud (AWS/Azure/GCP)?

### 11.3 Feature Decisions
- [ ] **Mobile app:** Native app vs responsive web only?
- [ ] **Offline mode:** Required or always-online acceptable?
- [ ] **Languages:** English only initially, or multi-language from start?
- [ ] **Vendor database:** Build custom vs integrate existing vendor directories?

### 11.4 Process Decisions
- [ ] **Beta testing:** Who will be beta users? How many projects before GA?
- [ ] **Feedback mechanism:** How will user feedback be collected and prioritized?
- [ ] **Update frequency:** Release schedule (weekly, monthly)?

---

## 12. Appendices

### 12.1 Glossary
- **Phase:** A distinct stage or component of a project (e.g., Accommodation, Travel)
- **AI Agent:** Specialized autonomous system for a specific task (e.g., research, email)
- **Learning System:** Pattern recognition from historical data to improve suggestions
- **Timeline:** Visual Gantt-style representation of project schedule
- **Worktree:** Isolated development environment (OpenProject concept)

### 12.2 References
- OpenProject Documentation: https://www.openproject.org/docs/
- SVAR Gantt: https://svar.dev/react/gantt/
- Vis-Timeline: https://visjs.github.io/vis-timeline/
- LangChain Documentation: https://docs.langchain.com/
- Erasmus+ Programme Guide: [official EU documentation]

### 12.3 Related Documents
- Technical Architecture Document (to be created)
- API Specification (to be created)
- User Guide (to be created post-MVP)
- Security & Privacy Policy (to be created)

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-31 | SCAR AI | Initial PRD based on research and requirements |

---

**Next Steps:**
1. Review and approve PRD with stakeholders
2. Create detailed technical architecture document
3. Generate implementation plan (plan-feature)
4. Set up development environment
5. Begin Phase 1 development

---

_This PRD is a living document and will be updated as requirements evolve and new insights emerge._
