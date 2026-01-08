# Implementation Plan: Project Pipeline Management System

**Version:** 1.0
**Date:** 2025-12-31
**Based on:** PRD-ProjectPipeline.md
**Total Estimated Duration:** 18 weeks (4.5 months)
**Team Size:** 2-3 developers + 1 QA (part-time)

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Architecture & Technology Decisions](#2-architecture--technology-decisions)
3. [Development Phases](#3-development-phases)
4. [Detailed Implementation Steps](#4-detailed-implementation-steps)
5. [Testing Strategy](#5-testing-strategy)
6. [Deployment Plan](#6-deployment-plan)
7. [Risk Management](#7-risk-management)
8. [Success Metrics](#8-success-metrics)

---

## 1. Project Overview

### 1.1 Goals
Build an AI-powered project pipeline management system that:
- Provides visual, interactive timeline management
- Embeds specialized AI agents for research and automation
- Learns from historical projects to reduce manual effort
- Integrates with OpenProject for budget/time tracking
- Automates vendor communication

### 1.2 Approach
**Hybrid Architecture:**
- Extend OpenProject for proven budget/time tracking
- Build custom React frontend with SVAR Gantt
- Create custom AI agents (competitive advantage)
- Integrate open-source tools where beneficial

### 1.3 Success Criteria
- MVP launch in 18 weeks
- 80% user adoption within 3 months post-launch
- 60% time savings by 5th project
- 85% budget accuracy
- 4.5/5 user satisfaction rating

---

## 2. Architecture & Technology Decisions

### 2.1 Final Technology Stack

#### Frontend
```yaml
Framework: React 18.2+ with TypeScript 5+
Timeline:
  - Primary: SVAR Gantt (MIT license)
  - Secondary: Vis-Timeline (for dashboard overview)
State Management:
  - Server State: TanStack Query (React Query) v5
  - Client State: Zustand v4
Styling: TailwindCSS v3 + HeadlessUI
Real-time: Socket.io-client v4
Forms: React Hook Form + Zod validation
Testing:
  - Unit: Vitest + React Testing Library
  - E2E: Playwright
Build: Vite v5
```

#### Backend
```yaml
Runtime: Node.js 20 LTS
Framework: Fastify v4 (chosen for performance + TypeScript support)
Language: TypeScript 5+
API Style: REST + WebSockets
Authentication: Passport.js + JWT
Validation: Zod (shared with frontend)
ORM: Prisma v5 (type-safe, great DX)
Testing:
  - Unit/Integration: Vitest
  - API: Supertest
Documentation: OpenAPI 3.1 (auto-generated from routes)
```

#### AI Layer
```yaml
Orchestration: LangGraph (LangChain's new stateful framework)
LLM Provider: Anthropic Claude 3.5 Sonnet (primary)
  - Reasoning: Better instruction following, cheaper than GPT-4
  - Fallback: OpenAI GPT-4o (for specific tasks)
Vector Database: Weaviate v1.23 (self-hosted, open source)
Embeddings: text-embedding-3-small (OpenAI)
Web Scraping: Playwright (reuse from testing)
```

#### Data Layer
```yaml
Primary Database: PostgreSQL 16
Cache: Redis 7.2
File Storage: MinIO (S3-compatible, self-hosted)
Backup: pg_dump + automated S3 backups (daily)
```

#### Integration Layer
```yaml
Email: SendGrid (transactional email service)
  - Reason: Reliable deliverability, good API, reasonable cost
OpenProject: REST API v3 integration
External APIs:
  - Booking.com (if available)
  - Flight search APIs (SkyScanner, Amadeus)
  - Web scraping fallback for unavailable APIs
```

#### Infrastructure
```yaml
Containerization: Docker + Docker Compose
Orchestration: Kubernetes (production) / Docker Compose (dev/staging)
CI/CD: GitHub Actions
Monitoring: Prometheus + Grafana
Logging: Loki + Promtail
Error Tracking: Sentry
Reverse Proxy: Traefik (Docker-native, auto-SSL)
```

### 2.2 Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    Internet / Users                            │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│                  Traefik (Reverse Proxy + SSL)                 │
└────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                ▼                           ▼
┌──────────────────────────┐   ┌──────────────────────────┐
│   Frontend (React SPA)   │   │   Backend API (Fastify)  │
│   - SVAR Gantt           │   │   - REST Endpoints       │
│   - Vis-Timeline         │◄──┤   - WebSocket Server     │
│   - TailwindCSS          │   │   - Auth Middleware      │
│   - Socket.io Client     │   │   - Business Logic       │
└──────────────────────────┘   └──────────────────────────┘
                                             │
                    ┌────────────────────────┼────────────────────┐
                    ▼                        ▼                    ▼
┌─────────────────────────┐  ┌────────────────────┐  ┌──────────────────┐
│   AI Agent Services     │  │  Integration Layer │  │   Data Services  │
│   ┌─────────────────┐   │  │  ┌──────────────┐  │  │  ┌────────────┐  │
│   │ Research Agents │   │  │  │ OpenProject  │  │  │  │ PostgreSQL │  │
│   │ - Accommodation │   │  │  │ REST Client  │  │  │  │   (Prisma) │  │
│   │ - Travel        │   │  │  ├──────────────┤  │  │  ├────────────┤  │
│   │ - Food          │   │  │  │ Email Service│  │  │  │   Redis    │  │
│   │ - Activities    │   │  │  │ (SendGrid)   │  │  │  │  (Cache)   │  │
│   └─────────────────┘   │  │  ├──────────────┤  │  │  ├────────────┤  │
│   ┌─────────────────┐   │  │  │ External APIs│  │  │  │  Weaviate  │  │
│   │ Email Agent     │   │  │  │ - Booking.com│  │  │  │  (Vector)  │  │
│   │ - Compose       │   │  │  │ - Flights    │  │  │  ├────────────┤  │
│   │ - Parse         │   │  │  │ - Scraping   │  │  │  │   MinIO    │  │
│   └─────────────────┘   │  │  └──────────────┘  │  │  │  (Files)   │  │
│   ┌─────────────────┐   │  └────────────────────┘  │  └────────────┘  │
│   │ Learning Agent  │   │                          │                  │
│   │ - Pattern Extr. │   │                          │                  │
│   │ - Recommendations│  │                          │                  │
│   └─────────────────┘   │                          │                  │
└─────────────────────────┘                          └──────────────────┘
                │                                              │
                └──────────────────┬───────────────────────────┘
                                   ▼
                        ┌──────────────────────┐
                        │  LLM APIs (External) │
                        │  - Claude API        │
                        │  - OpenAI API        │
                        └──────────────────────┘
```

### 2.3 Database Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password_hash String
  name          String
  role          Role      @default(USER)
  created_at    DateTime  @default(now())
  updated_at    DateTime  @updatedAt

  projects_created Project[] @relation("ProjectCreator")
  assigned_phases  PhaseAssignment[]
  conversations    AIConversation[]
  learning_patterns LearningPattern[]

  @@index([email])
}

enum Role {
  ADMIN
  COORDINATOR
  TEAM_MEMBER
  VIEWER
}

model Project {
  id                String       @id @default(cuid())
  name              String
  type              ProjectType
  status            ProjectStatus @default(PLANNING)
  description       String?      @db.Text
  start_date        DateTime
  end_date          DateTime
  budget_total      Decimal      @db.Decimal(12, 2)
  budget_spent      Decimal      @default(0) @db.Decimal(12, 2)
  participants_count Int
  location          String
  metadata          Json?        // Flexible storage

  created_by        String
  creator           User         @relation("ProjectCreator", fields: [created_by], references: [id])
  created_at        DateTime     @default(now())
  updated_at        DateTime     @updatedAt

  phases            Phase[]
  conversations     AIConversation[]
  communications    Communication[]

  @@index([created_by])
  @@index([status])
  @@index([start_date])
}

enum ProjectType {
  STUDENT_EXCHANGE
  TRAINING
  CONFERENCE
  CUSTOM
}

enum ProjectStatus {
  PLANNING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

model Phase {
  id                String      @id @default(cuid())
  project_id        String
  project           Project     @relation(fields: [project_id], references: [id], onDelete: Cascade)

  name              String
  type              PhaseType
  status            PhaseStatus @default(NOT_STARTED)
  start_date        DateTime
  end_date          DateTime
  deadline          DateTime?
  budget_allocated  Decimal     @db.Decimal(12, 2)
  budget_spent      Decimal     @default(0) @db.Decimal(12, 2)
  order             Int         // Sequence in timeline
  dependencies      String[]    // Array of phase IDs
  checklist         Json?       // [{item: string, completed: boolean}]
  editable          Boolean     @default(true)
  skippable         Boolean     @default(true)

  created_at        DateTime    @default(now())
  updated_at        DateTime    @updatedAt

  assignments       PhaseAssignment[]
  conversations     AIConversation[]
  communications    Communication[]
  quotes            Quote[]

  @@index([project_id])
  @@index([status])
  @@index([type])
}

enum PhaseType {
  ACCOMMODATION
  TRAVEL
  FOOD
  ACTIVITIES
  EVENTS
  INSURANCE
  EMERGENCY_PLANNING
  PERMITS
  APPLICATION
  REPORTING
  CUSTOM
}

enum PhaseStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
  SKIPPED
  BLOCKED
}

model PhaseAssignment {
  id         String   @id @default(cuid())
  phase_id   String
  phase      Phase    @relation(fields: [phase_id], references: [id], onDelete: Cascade)
  user_id    String
  user       User     @relation(fields: [user_id], references: [id], onDelete: Cascade)
  assigned_at DateTime @default(now())

  @@unique([phase_id, user_id])
  @@index([user_id])
}

model Vendor {
  id                       String   @id @default(cuid())
  name                     String
  type                     VendorType
  email                    String?
  phone                    String?
  website                  String?
  location                 String?
  rating                   Decimal? @db.Decimal(3, 2) // 0-5 score
  response_rate            Decimal? @db.Decimal(4, 2) // 0-100%
  avg_response_time_hours  Int?
  successful_bookings      Int      @default(0)
  total_contacts           Int      @default(0)
  notes                    String?  @db.Text
  metadata                 Json?

  created_at               DateTime @default(now())
  updated_at               DateTime @updatedAt

  communications           Communication[]
  quotes                   Quote[]

  @@index([type])
  @@index([rating])
}

enum VendorType {
  HOTEL
  HOSTEL
  RESTAURANT
  TRANSPORT
  ACTIVITY_PROVIDER
  VENUE
  INSURANCE
  OTHER
}

model Communication {
  id                    String            @id @default(cuid())
  project_id            String
  project               Project           @relation(fields: [project_id], references: [id], onDelete: Cascade)
  phase_id              String?
  phase                 Phase?            @relation(fields: [phase_id], references: [id], onDelete: Cascade)
  vendor_id             String?
  vendor                Vendor?           @relation(fields: [vendor_id], references: [id])

  type                  CommunicationType
  direction             Direction
  subject               String?
  body                  String            @db.Text
  status                CommStatus

  sent_at               DateTime?
  response_received_at  DateTime?
  follow_up_scheduled   DateTime?
  parsed_data           Json?             // Extracted info from responses

  created_at            DateTime          @default(now())
  updated_at            DateTime          @updatedAt

  @@index([project_id])
  @@index([phase_id])
  @@index([vendor_id])
  @@index([status])
}

enum CommunicationType {
  EMAIL
  PHONE
  OTHER
}

enum Direction {
  OUTBOUND
  INBOUND
}

enum CommStatus {
  DRAFT
  SENT
  DELIVERED
  OPENED
  RESPONDED
  FAILED
}

model Quote {
  id                String   @id @default(cuid())
  phase_id          String
  phase             Phase    @relation(fields: [phase_id], references: [id], onDelete: Cascade)
  vendor_id         String
  vendor            Vendor   @relation(fields: [vendor_id], references: [id])

  amount            Decimal  @db.Decimal(12, 2)
  currency          String   @default("EUR")
  valid_until       DateTime?
  status            QuoteStatus @default(PENDING)
  details           Json?    // Flexible storage for quote specifics
  notes             String?  @db.Text

  received_at       DateTime @default(now())
  updated_at        DateTime @updatedAt

  @@index([phase_id])
  @@index([vendor_id])
  @@index([status])
}

enum QuoteStatus {
  PENDING
  ACCEPTED
  REJECTED
  EXPIRED
}

model AIConversation {
  id          String   @id @default(cuid())
  project_id  String
  project     Project  @relation(fields: [project_id], references: [id], onDelete: Cascade)
  phase_id    String?
  phase       Phase?   @relation(fields: [phase_id], references: [id], onDelete: Cascade)
  user_id     String
  user        User     @relation(fields: [user_id], references: [id])

  messages    Json     // [{role: 'user'|'assistant', content: string, timestamp: ISO}]
  context     Json?    // Phase context, project details

  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt

  @@index([project_id])
  @@index([phase_id])
  @@index([user_id])
}

model LearningPattern {
  id            String        @id @default(cuid())
  user_id       String?
  user          User?         @relation(fields: [user_id], references: [id])
  pattern_type  PatternType
  phase_type    PhaseType?
  pattern_data  Json          // Flexible storage for learned patterns
  confidence    Decimal       @db.Decimal(4, 3) // 0-1 score
  sample_size   Int           // Number of data points

  created_at    DateTime      @default(now())
  updated_at    DateTime      @updatedAt

  @@index([user_id])
  @@index([pattern_type])
  @@index([phase_type])
}

enum PatternType {
  VENDOR_PREFERENCE
  BUDGET_ALLOCATION
  TIMELINE_ESTIMATE
  PHASE_SKIP_FREQUENCY
  CHECKLIST_ITEM
}
```

---

## 3. Development Phases

### Overview Timeline

```
Week 1-3:   Phase 1 - Foundation
Week 4-5:   Phase 2 - Timeline Visualization
Week 6-8:   Phase 3 - AI Infrastructure
Week 9-10:  Phase 4 - Communication System
Week 11-12: Phase 5 - Learning System
Week 13-14: Phase 6 - Additional Agents
Week 15-16: Phase 7 - Budget & Reporting
Week 17-18: Phase 8 - Polish & Testing
```

### Resource Allocation

| Phase | Backend Dev | Frontend Dev | AI Dev | QA | Tech Writer |
|-------|-------------|--------------|--------|-------|-------------|
| 1     | 2           | 0            | 0      | 0     | 0           |
| 2     | 0           | 1            | 0      | 0     | 0           |
| 3     | 1           | 1            | 1      | 0     | 0           |
| 4     | 1           | 0            | 0      | 0     | 0           |
| 5     | 0           | 0            | 1      | 0.5   | 0           |
| 6     | 0           | 0            | 1      | 0.5   | 0           |
| 7     | 1           | 1            | 0      | 0.5   | 0           |
| 8     | 2           | 1            | 0      | 1     | 1           |

---

## 4. Detailed Implementation Steps

### Phase 1: Foundation (Weeks 1-3)

#### Week 1: Environment Setup & Database

**Backend Setup:**
```bash
# Initialize backend
mkdir -p backend
cd backend
npm init -y
npm install fastify @fastify/cors @fastify/jwt @fastify/multipart
npm install prisma @prisma/client
npm install zod
npm install -D typescript @types/node tsx vitest

# Initialize Prisma
npx prisma init

# Copy schema.prisma from above
# Run migration
npx prisma migrate dev --name init
npx prisma generate
```

**Tasks:**
- [ ] Set up project repository structure
- [ ] Configure Docker Compose (PostgreSQL, Redis, Weaviate, MinIO)
- [ ] Implement Prisma schema (as defined above)
- [ ] Run initial migration
- [ ] Seed database with sample data

**Deliverables:**
- ✅ Docker Compose configuration
- ✅ Database schema migrated
- ✅ Seed script with 2 sample projects

**Files to Create:**
```
/backend
  /src
    /config
      database.ts       # Prisma client singleton
      env.ts            # Environment validation (Zod)
    /utils
      seed.ts           # Database seeding
  docker-compose.yml
  .env.example
  prisma/schema.prisma
  package.json
  tsconfig.json
```

---

#### Week 2: Authentication & Core APIs

**Authentication Implementation:**
```typescript
// /backend/src/auth/auth.service.ts
import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { prisma } from '../config/database'

export async function registerAuthRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post('/auth/register', async (request, reply) => {
    const { email, password, name } = request.body
    const password_hash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, password_hash, name }
    })

    const token = app.jwt.sign({ userId: user.id, role: user.role })
    return { token, user: { id: user.id, email, name, role: user.role } }
  })

  // POST /auth/login
  app.post('/auth/login', async (request, reply) => {
    const { email, password } = request.body
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const token = app.jwt.sign({ userId: user.id, role: user.role })
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } }
  })
}
```

**Project CRUD APIs:**
```typescript
// /backend/src/projects/projects.routes.ts
import { FastifyInstance } from 'fastify'
import { requireAuth } from '../auth/middleware'

export async function registerProjectRoutes(app: FastifyInstance) {
  // GET /projects (list all projects for user)
  app.get('/projects', { onRequest: [requireAuth] }, async (request) => {
    const userId = request.user.userId
    const projects = await prisma.project.findMany({
      where: { created_by: userId },
      include: { phases: { select: { id: true, status: true } } }
    })
    return { projects }
  })

  // POST /projects (create new project)
  app.post('/projects', { onRequest: [requireAuth] }, async (request) => {
    const userId = request.user.userId
    const data = request.body

    const project = await prisma.project.create({
      data: { ...data, created_by: userId }
    })

    return { project }
  })

  // GET /projects/:id
  app.get('/projects/:id', { onRequest: [requireAuth] }, async (request) => {
    const { id } = request.params
    const project = await prisma.project.findUnique({
      where: { id },
      include: { phases: true }
    })
    return { project }
  })

  // PATCH /projects/:id
  // DELETE /projects/:id
  // ... similar implementations
}
```

**Tasks:**
- [ ] Implement JWT-based authentication
- [ ] Create auth middleware (requireAuth, requireRole)
- [ ] Implement Project CRUD endpoints
- [ ] Implement Phase CRUD endpoints
- [ ] Write unit tests for auth & CRUD (80%+ coverage)

**Deliverables:**
- ✅ Authentication system working
- ✅ Project & Phase APIs functional
- ✅ Postman/Insomnia collection for testing
- ✅ Unit tests passing

---

#### Week 3: OpenProject Integration

**OpenProject Client:**
```typescript
// /backend/src/integrations/openproject.client.ts
import axios from 'axios'

export class OpenProjectClient {
  private baseURL: string
  private apiKey: string

  constructor() {
    this.baseURL = process.env.OPENPROJECT_URL || 'https://openproject.example.com'
    this.apiKey = process.env.OPENPROJECT_API_KEY || ''
  }

  async getProjects() {
    const response = await axios.get(`${this.baseURL}/api/v3/projects`, {
      headers: { Authorization: `Bearer ${this.apiKey}` }
    })
    return response.data
  }

  async createWorkPackage(projectId: string, data: any) {
    const response = await axios.post(
      `${this.baseURL}/api/v3/projects/${projectId}/work_packages`,
      data,
      { headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' } }
    )
    return response.data
  }

  async syncBudget(projectId: string, budgetData: any) {
    // Implementation for budget sync
    // Uses OpenProject Budget API
  }
}
```

**Sync Service:**
```typescript
// /backend/src/integrations/openproject.sync.ts
export async function syncProjectToOpenProject(projectId: string) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { phases: true }
  })

  if (!project) throw new Error('Project not found')

  const opClient = new OpenProjectClient()

  // Create or update OpenProject project
  const opProject = await opClient.createProject({
    name: project.name,
    description: project.description
  })

  // Create work packages for each phase
  for (const phase of project.phases) {
    await opClient.createWorkPackage(opProject.id, {
      subject: phase.name,
      startDate: phase.start_date,
      dueDate: phase.end_date,
      estimatedTime: calculateEstimatedTime(phase),
      customFields: {
        budget: phase.budget_allocated,
        phaseType: phase.type
      }
    })
  }

  return opProject
}
```

**Tasks:**
- [ ] Create OpenProject API client
- [ ] Implement project sync (our DB → OpenProject)
- [ ] Implement budget sync
- [ ] Implement bi-directional sync (OpenProject changes → our DB)
- [ ] Add sync status tracking
- [ ] Write integration tests

**Deliverables:**
- ✅ OpenProject integration working
- ✅ Projects sync correctly
- ✅ Budget data flows both ways
- ✅ Error handling for API failures

---

### Phase 2: Timeline Visualization (Weeks 4-5)

#### Week 4: Frontend Setup & SVAR Gantt Integration

**Frontend Setup:**
```bash
# Initialize frontend
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install

# Install dependencies
npm install @tanstack/react-query zustand
npm install @svar/gantt vis-timeline
npm install react-hook-form zod @hookform/resolvers
npm install axios socket.io-client
npm install tailwindcss postcss autoprefixer
npm install -D @types/vis-timeline
```

**Gantt Component:**
```tsx
// /frontend/src/components/Timeline/GanttTimeline.tsx
import { useEffect, useRef } from 'react'
import { Gantt } from '@svar/gantt'
import { useQuery } from '@tanstack/react-query'
import { fetchProject } from '@/api/projects'

interface GanttTimelineProps {
  projectId: string
}

export function GanttTimeline({ projectId }: GanttTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const ganttRef = useRef<any>(null)

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId)
  })

  useEffect(() => {
    if (!containerRef.current || !project) return

    // Transform phases to SVAR Gantt format
    const tasks = project.phases.map(phase => ({
      id: phase.id,
      text: phase.name,
      start_date: new Date(phase.start_date),
      end_date: new Date(phase.end_date),
      type: phase.dependencies.length ? 'task' : 'milestone',
      parent: null,
      progress: calculateProgress(phase.status),
      dependencies: phase.dependencies.join(',')
    }))

    // Initialize Gantt
    ganttRef.current = new Gantt(containerRef.current, {
      tasks,
      scales: [
        { unit: 'month', step: 1, format: 'MMMM yyyy' },
        { unit: 'week', step: 1, format: 'Week #W' }
      ],
      columns: [
        { name: 'text', label: 'Phase', width: 200 },
        { name: 'start_date', label: 'Start', width: 100 },
        { name: 'duration', label: 'Duration', width: 80 }
      ],
      onTaskClick: (taskId: string) => {
        // Navigate to phase detail
        window.location.href = `/projects/${projectId}/phases/${taskId}`
      },
      onTaskDrag: async (taskId: string, newDates: any) => {
        // Update phase dates
        await updatePhase(taskId, {
          start_date: newDates.start,
          end_date: newDates.end
        })
      }
    })

    return () => {
      ganttRef.current?.destructor()
    }
  }, [project, projectId])

  return (
    <div className="w-full h-screen">
      <div ref={containerRef} className="gantt-container" />
    </div>
  )
}

function calculateProgress(status: string): number {
  switch (status) {
    case 'COMPLETED': return 1
    case 'IN_PROGRESS': return 0.5
    default: return 0
  }
}
```

**Tasks:**
- [ ] Set up React + Vite + TypeScript
- [ ] Configure TailwindCSS
- [ ] Set up React Query for server state
- [ ] Integrate SVAR Gantt library
- [ ] Implement timeline rendering from API data
- [ ] Add drag-and-drop functionality
- [ ] Handle phase click → navigation

**Deliverables:**
- ✅ Frontend app running
- ✅ Timeline displays project phases
- ✅ Drag-and-drop works
- ✅ Phase updates persist to backend

---

#### Week 5: Dashboard & Navigation

**Dashboard with Vis-Timeline:**
```tsx
// /frontend/src/components/Dashboard/ProjectDashboard.tsx
import { useEffect, useRef } from 'react'
import { Timeline } from 'vis-timeline/standalone'
import 'vis-timeline/styles/vis-timeline-graph2d.css'

export function ProjectDashboard({ projects }: { projects: Project[] }) {
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!timelineRef.current) return

    const items = projects.flatMap(project =>
      project.phases.map(phase => ({
        id: phase.id,
        content: `${project.name}: ${phase.name}`,
        start: new Date(phase.start_date),
        end: new Date(phase.end_date),
        group: project.id,
        className: `status-${phase.status.toLowerCase()}`
      }))
    )

    const groups = projects.map(project => ({
      id: project.id,
      content: project.name
    }))

    const timeline = new Timeline(timelineRef.current, items, groups, {
      orientation: 'top',
      zoomMin: 1000 * 60 * 60 * 24, // 1 day
      zoomMax: 1000 * 60 * 60 * 24 * 365, // 1 year
      onSelect: (properties) => {
        if (properties.items.length > 0) {
          const phaseId = properties.items[0]
          // Navigate to phase detail
        }
      }
    })

    return () => timeline.destroy()
  }, [projects])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">All Projects</h1>
      <div ref={timelineRef} className="timeline-container" />
    </div>
  )
}
```

**Routing:**
```tsx
// /frontend/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects/:projectId" element={<ProjectTimeline />} />
          <Route path="/projects/:projectId/phases/:phaseId" element={<PhaseDetail />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
```

**Tasks:**
- [ ] Create dashboard with Vis-Timeline
- [ ] Implement project list view
- [ ] Add routing (react-router)
- [ ] Create breadcrumb navigation
- [ ] Add loading states & error handling
- [ ] Responsive design (mobile-friendly view)

**Deliverables:**
- ✅ Dashboard shows all projects
- ✅ Navigation between views works
- ✅ Breadcrumbs functional
- ✅ Mobile-responsive layout

---

### Phase 3: AI Infrastructure (Weeks 6-8)

#### Week 6: AI Foundation & Chat Interface

**LangGraph Setup:**
```typescript
// /backend/src/ai/agents/base-agent.ts
import { ChatAnthropic } from '@langchain/anthropic'
import { StateGraph } from '@langchain/langgraph'

export class BaseAgent {
  protected llm: ChatAnthropic

  constructor() {
    this.llm = new ChatAnthropic({
      modelName: 'claude-3-5-sonnet-20241022',
      apiKey: process.env.ANTHROPIC_API_KEY,
      temperature: 0.7
    })
  }

  async chat(messages: { role: string; content: string }[]) {
    const response = await this.llm.invoke(
      messages.map(m => ({ role: m.role, content: m.content }))
    )
    return response.content
  }
}
```

**Accommodation Agent:**
```typescript
// /backend/src/ai/agents/accommodation-agent.ts
import { BaseAgent } from './base-agent'
import { prisma } from '@/config/database'

export class AccommodationAgent extends BaseAgent {
  async research(phaseContext: any) {
    const { project, phase } = phaseContext

    // Build context for LLM
    const systemPrompt = `You are an accommodation research assistant for Erasmus projects.

Project Details:
- Location: ${project.location}
- Dates: ${phase.start_date} to ${phase.end_date}
- Participants: ${project.participants_count}
- Budget: €${phase.budget_allocated}

Your task: Research and suggest 3-5 suitable accommodation options (hotels, hostels, or student residences).

For each option, provide:
1. Name and type
2. Estimated price per night
3. Key features (breakfast, WiFi, location)
4. Why it's suitable for this project

Format as JSON array.`

    const response = await this.llm.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Please research accommodation options.' }
    ])

    // Parse LLM response
    const suggestions = JSON.parse(response.content)

    // Store in database (for learning)
    await this.storeSuggestions(phase.id, suggestions)

    return suggestions
  }

  async refineSearch(phaseId: string, userQuery: string, previousSuggestions: any[]) {
    const systemPrompt = `You are refining accommodation suggestions based on user feedback.

Previous suggestions: ${JSON.stringify(previousSuggestions)}

User's new requirement: "${userQuery}"

Provide updated suggestions (3-5 options) as JSON array.`

    const response = await this.llm.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userQuery }
    ])

    return JSON.parse(response.content)
  }

  private async storeSuggestions(phaseId: string, suggestions: any[]) {
    // Store in database for learning purposes
    await prisma.phase.update({
      where: { id: phaseId },
      data: {
        metadata: {
          ai_suggestions: suggestions,
          suggested_at: new Date().toISOString()
        }
      }
    })
  }
}
```

**Chat WebSocket Handler:**
```typescript
// /backend/src/ai/chat.socket.ts
import { Server as SocketServer } from 'socket.io'
import { AccommodationAgent } from './agents/accommodation-agent'

export function registerChatHandlers(io: SocketServer) {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id)

    socket.on('chat:message', async (data) => {
      const { phaseId, projectId, message, conversationId } = data

      try {
        // Load conversation history
        const conversation = await prisma.aIConversation.findUnique({
          where: { id: conversationId }
        })

        const messages = conversation?.messages || []
        messages.push({ role: 'user', content: message, timestamp: new Date() })

        // Determine agent type based on phase
        const phase = await prisma.phase.findUnique({ where: { id: phaseId } })
        const agent = getAgentForPhaseType(phase.type)

        // Get AI response
        const aiResponse = await agent.chat(messages)

        messages.push({ role: 'assistant', content: aiResponse, timestamp: new Date() })

        // Update conversation
        await prisma.aIConversation.update({
          where: { id: conversationId },
          data: { messages, updated_at: new Date() }
        })

        // Send response to client
        socket.emit('chat:response', {
          conversationId,
          message: aiResponse,
          timestamp: new Date()
        })
      } catch (error) {
        socket.emit('chat:error', { error: error.message })
      }
    })

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id)
    })
  })
}

function getAgentForPhaseType(type: string) {
  switch (type) {
    case 'ACCOMMODATION':
      return new AccommodationAgent()
    // Add other agents as they're implemented
    default:
      return new BaseAgent()
  }
}
```

**Frontend Chat Component:**
```tsx
// /frontend/src/components/Chat/PhaseChat.tsx
import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

export function PhaseChat({ phaseId, conversationId }: Props) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')

  useEffect(() => {
    const newSocket = io(import.meta.env.VITE_API_URL)
    setSocket(newSocket)

    newSocket.on('chat:response', (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.message,
        timestamp: data.timestamp
      }])
    })

    return () => {
      newSocket.close()
    }
  }, [])

  const sendMessage = () => {
    if (!input.trim() || !socket) return

    const message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, message])
    socket.emit('chat:message', {
      phaseId,
      conversationId,
      message: input
    })

    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-md p-3 rounded-lg ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1 border rounded px-3 py-2"
            placeholder="Ask the AI assistant..."
          />
          <button
            onClick={sendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  )
}
```

**Tasks:**
- [ ] Set up LangChain/LangGraph
- [ ] Implement BaseAgent class
- [ ] Create AccommodationAgent with research capability
- [ ] Implement WebSocket chat server
- [ ] Build chat UI component
- [ ] Add conversation persistence
- [ ] Test with real Claude API

**Deliverables:**
- ✅ Chat interface working
- ✅ AccommodationAgent researches options
- ✅ Real-time WebSocket communication
- ✅ Conversations saved to DB

---

#### Weeks 7-8: Agent Research & Web Scraping

**Web Scraping for Hotels:**
```typescript
// /backend/src/ai/scrapers/hotel-scraper.ts
import { chromium } from 'playwright'

export async function scrapeBookingCom(location: string, dates: { start: Date; end: Date }) {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  try {
    const searchUrl = `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(location)}&checkin=${formatDate(dates.start)}&checkout=${formatDate(dates.end)}`

    await page.goto(searchUrl, { waitUntil: 'networkidle' })

    const hotels = await page.$$eval('[data-testid="property-card"]', (cards) =>
      cards.slice(0, 10).map((card) => ({
        name: card.querySelector('[data-testid="title"]')?.textContent || '',
        price: card.querySelector('[data-testid="price-and-discounted-price"]')?.textContent || '',
        rating: card.querySelector('[data-testid="review-score"]')?.textContent || '',
        location: card.querySelector('[data-testid="address"]')?.textContent || '',
        url: (card.querySelector('a') as HTMLAnchorElement)?.href || ''
      }))
    )

    return hotels
  } finally {
    await browser.close()
  }
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]
}
```

**Enhanced Accommodation Agent:**
```typescript
// /backend/src/ai/agents/accommodation-agent.ts (enhanced)
export class AccommodationAgent extends BaseAgent {
  async research(phaseContext: any) {
    const { project, phase } = phaseContext

    // 1. Try web scraping for real data
    let realOptions = []
    try {
      realOptions = await scrapeBookingCom(project.location, {
        start: new Date(phase.start_date),
        end: new Date(phase.end_date)
      })
    } catch (error) {
      console.error('Scraping failed:', error)
    }

    // 2. Use LLM to analyze and rank options
    const systemPrompt = `You are an accommodation expert. Analyze these options and select the top 3-5 for an Erasmus project.

Project Details:
- Location: ${project.location}
- Dates: ${phase.start_date} to ${phase.end_date}
- Participants: ${project.participants_count}
- Budget per person: €${phase.budget_allocated / project.participants_count}

Available options: ${JSON.stringify(realOptions)}

Select the best 3-5 options and explain why each is suitable. Format as JSON array with: name, price, rating, pros, cons, suitability_score (0-100).`

    const response = await this.llm.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Analyze and recommend the best options.' }
    ])

    const recommendations = JSON.parse(response.content)

    // 3. Check against historical preferences (learning)
    const enrichedRecommendations = await this.enrichWithLearning(
      phase.id,
      recommendations
    )

    return enrichedRecommendations
  }

  private async enrichWithLearning(phaseId: string, recommendations: any[]) {
    // Query learning patterns
    const patterns = await prisma.learningPattern.findMany({
      where: {
        pattern_type: 'VENDOR_PREFERENCE',
        phase_type: 'ACCOMMODATION'
      },
      orderBy: { confidence: 'desc' }
    })

    // Boost recommendations that match learned preferences
    return recommendations.map(rec => ({
      ...rec,
      learned_preference_match: patterns.some(p =>
        p.pattern_data.preferred_features?.some((f: string) =>
          rec.name.toLowerCase().includes(f.toLowerCase())
        )
      )
    }))
  }
}
```

**Tasks:**
- [ ] Implement web scraping (Playwright)
- [ ] Add scraping for multiple sources (Booking.com, Hotels.com)
- [ ] Enhance agent to use scraped data
- [ ] Add rate limiting and caching
- [ ] Implement error handling for scraping failures
- [ ] Add logging and monitoring

**Deliverables:**
- ✅ Real hotel data scraped successfully
- ✅ Agent uses real + LLM analysis
- ✅ Scraping is reliable and cached
- ✅ Fallback to LLM-only if scraping fails

---

### Phase 4: Communication System (Weeks 9-10)

#### Week 9: Email Composition Agent

**Email Agent:**
```typescript
// /backend/src/ai/agents/email-agent.ts
import { BaseAgent } from './base-agent'

export class EmailAgent extends BaseAgent {
  async composeVendorInquiry(data: {
    vendorName: string
    vendorType: string
    projectDetails: any
    phaseDetails: any
    specificRequirements?: string
  }) {
    const systemPrompt = `You are a professional email composer for Erasmus project coordinators.

Task: Compose a professional inquiry email to a vendor.

Vendor: ${data.vendorName} (${data.vendorType})
Project: ${data.projectDetails.name}
Location: ${data.projectDetails.location}
Dates: ${data.phaseDetails.start_date} to ${data.phaseDetails.end_date}
Participants: ${data.projectDetails.participants_count}
Budget: €${data.phaseDetails.budget_allocated}

${data.specificRequirements ? `Specific Requirements: ${data.specificRequirements}` : ''}

Compose a professional email that:
1. Introduces the Erasmus project
2. States requirements clearly (dates, participants, budget)
3. Requests a detailed quote
4. Asks about availability and payment terms
5. Sets a response deadline (1 week from today)
6. Is polite, professional, and concise

Return JSON: { subject: string, body: string }`

    const response = await this.llm.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: 'Compose the email.' }
    ])

    return JSON.parse(response.content)
  }

  async parseVendorResponse(emailBody: string) {
    const systemPrompt = `You are an email parser. Extract key information from vendor responses.

Extract:
- Has pricing? (yes/no)
- Price amount (if mentioned)
- Currency
- Availability confirmed? (yes/no/unclear)
- Special offers or discounts mentioned
- Questions asked by vendor
- Urgency (low/medium/high)
- Sentiment (positive/neutral/negative)

Return as JSON.`

    const response = await this.llm.invoke([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Email to parse:\n\n${emailBody}` }
    ])

    return JSON.parse(response.content)
  }
}
```

**Email Service (SendGrid):**
```typescript
// /backend/src/integrations/email.service.ts
import sgMail from '@sendgrid/mail'

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

export async function sendEmail(data: {
  to: string
  subject: string
  body: string
  fromName?: string
  trackOpens?: boolean
}) {
  const msg = {
    to: data.to,
    from: {
      email: process.env.FROM_EMAIL || 'noreply@example.com',
      name: data.fromName || 'Erasmus Project Team'
    },
    subject: data.subject,
    text: data.body,
    html: data.body.replace(/\n/g, '<br>'),
    trackingSettings: {
      clickTracking: { enable: true },
      openTracking: { enable: data.trackOpens ?? true }
    }
  }

  const result = await sgMail.send(msg)
  return result
}
```

**Multi-Vendor Contact API:**
```typescript
// /backend/src/communications/communications.routes.ts
export async function registerCommunicationRoutes(app: FastifyInstance) {
  app.post('/communications/bulk-send', { onRequest: [requireAuth] }, async (request) => {
    const { phaseId, vendorIds, customMessage } = request.body

    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: { project: true }
    })

    const vendors = await prisma.vendor.findMany({
      where: { id: { in: vendorIds } }
    })

    const emailAgent = new EmailAgent()
    const results = []

    for (const vendor of vendors) {
      // Compose email
      const email = await emailAgent.composeVendorInquiry({
        vendorName: vendor.name,
        vendorType: vendor.type,
        projectDetails: phase.project,
        phaseDetails: phase,
        specificRequirements: customMessage
      })

      // Send email
      await sendEmail({
        to: vendor.email,
        subject: email.subject,
        body: email.body,
        trackOpens: true
      })

      // Log communication
      const comm = await prisma.communication.create({
        data: {
          project_id: phase.project_id,
          phase_id: phaseId,
          vendor_id: vendor.id,
          type: 'EMAIL',
          direction: 'OUTBOUND',
          subject: email.subject,
          body: email.body,
          status: 'SENT',
          sent_at: new Date()
        }
      })

      // Schedule follow-up
      await scheduleFollowUp(comm.id, 3) // 3 days

      results.push({ vendor: vendor.name, status: 'sent', communicationId: comm.id })
    }

    return { results }
  })
}

async function scheduleFollowUp(communicationId: string, daysUntil: number) {
  const followUpDate = new Date()
  followUpDate.setDate(followUpDate.getDate() + daysUntil)

  await prisma.communication.update({
    where: { id: communicationId },
    data: { follow_up_scheduled: followUpDate }
  })

  // TODO: Set up cron job or queue to send reminders
}
```

**Tasks:**
- [ ] Implement EmailAgent (compose & parse)
- [ ] Integrate SendGrid
- [ ] Create bulk send API
- [ ] Add email tracking (sent, opened, responded)
- [ ] Implement follow-up scheduling
- [ ] Build email preview UI

**Deliverables:**
- ✅ Emails composed by AI
- ✅ Bulk sending works
- ✅ Email tracking functional
- ✅ Follow-ups scheduled

---

#### Week 10: Response Handling & UI

**Webhook for Email Responses (SendGrid):**
```typescript
// /backend/src/communications/webhooks.routes.ts
export async function registerWebhookRoutes(app: FastifyInstance) {
  // SendGrid webhook for email events
  app.post('/webhooks/sendgrid', async (request, reply) => {
    const events = request.body as any[]

    for (const event of events) {
      const { email, event: eventType, sg_message_id } = event

      // Find communication by email
      const comm = await prisma.communication.findFirst({
        where: {
          vendor: { email },
          status: 'SENT'
        },
        orderBy: { sent_at: 'desc' }
      })

      if (!comm) continue

      // Update status based on event
      if (eventType === 'delivered') {
        await prisma.communication.update({
          where: { id: comm.id },
          data: { status: 'DELIVERED' }
        })
      } else if (eventType === 'open') {
        await prisma.communication.update({
          where: { id: comm.id },
          data: { status: 'OPENED' }
        })
      }
    }

    return reply.code(200).send()
  })

  // Manual response entry (for now, later can be email parsing)
  app.post('/communications/:id/response', { onRequest: [requireAuth] }, async (request) => {
    const { id } = request.params
    const { responseBody } = request.body

    // Parse response with AI
    const emailAgent = new EmailAgent()
    const parsedData = await emailAgent.parseVendorResponse(responseBody)

    // Update communication
    await prisma.communication.update({
      where: { id },
      data: {
        status: 'RESPONDED',
        response_received_at: new Date(),
        parsed_data: parsedData
      }
    })

    // If pricing detected, create quote
    if (parsedData.has_pricing && parsedData.price_amount) {
      await prisma.quote.create({
        data: {
          phase_id: comm.phase_id,
          vendor_id: comm.vendor_id,
          amount: parsedData.price_amount,
          currency: parsedData.currency || 'EUR',
          status: 'PENDING',
          details: parsedData
        }
      })
    }

    return { parsed: parsedData }
  })
}
```

**Email Log UI:**
```tsx
// /frontend/src/components/Communications/EmailLog.tsx
export function EmailLog({ phaseId }: { phaseId: string }) {
  const { data: communications } = useQuery({
    queryKey: ['communications', phaseId],
    queryFn: () => fetchCommunications(phaseId)
  })

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Communication Log</h3>

      {communications?.map(comm => (
        <div key={comm.id} className="border rounded p-4">
          <div className="flex justify-between items-start">
            <div>
              <div className="font-medium">{comm.vendor.name}</div>
              <div className="text-sm text-gray-600">{comm.subject}</div>
            </div>
            <span className={`px-2 py-1 rounded text-sm ${getStatusColor(comm.status)}`}>
              {comm.status}
            </span>
          </div>

          <div className="mt-2 text-sm text-gray-700">
            Sent: {new Date(comm.sent_at).toLocaleString()}
          </div>

          {comm.status === 'RESPONDED' && (
            <div className="mt-2">
              <div className="text-sm font-medium">Response received:</div>
              {comm.parsed_data?.has_pricing && (
                <div className="text-green-600">
                  Quote: {comm.parsed_data.price_amount} {comm.parsed_data.currency}
                </div>
              )}
            </div>
          )}

          {comm.follow_up_scheduled && comm.status !== 'RESPONDED' && (
            <div className="mt-2 text-sm text-orange-600">
              Follow-up scheduled: {new Date(comm.follow_up_scheduled).toLocaleDateString()}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
```

**Tasks:**
- [ ] Set up SendGrid webhooks
- [ ] Implement response parsing
- [ ] Create quote generation from responses
- [ ] Build email log UI
- [ ] Add manual response entry
- [ ] Test end-to-end email flow

**Deliverables:**
- ✅ Email status tracking works
- ✅ Responses parsed automatically
- ✅ Quotes generated from responses
- ✅ Email log displays correctly

---

### Phase 5: Learning System (Weeks 11-12)

#### Week 11: Vector Database & Pattern Extraction

**Weaviate Setup:**
```typescript
// /backend/src/ai/vector-db/weaviate.client.ts
import weaviate, { WeaviateClient } from 'weaviate-ts-client'

export class VectorDB {
  private client: WeaviateClient

  constructor() {
    this.client = weaviate.client({
      scheme: 'http',
      host: process.env.WEAVIATE_HOST || 'localhost:8080'
    })
  }

  async initialize() {
    // Create schema for project patterns
    await this.client.schema.classCreator().withClass({
      class: 'ProjectPattern',
      vectorizer: 'text2vec-openai',
      moduleConfig: {
        'text2vec-openai': {
          model: 'text-embedding-3-small'
        }
      },
      properties: [
        { name: 'project_type', dataType: ['string'] },
        { name: 'phase_type', dataType: ['string'] },
        { name: 'pattern_type', dataType: ['string'] },
        { name: 'pattern_data', dataType: ['text'] },
        { name: 'user_id', dataType: ['string'] },
        { name: 'success_score', dataType: ['number'] },
        { name: 'sample_size', dataType: ['int'] }
      ]
    }).do()
  }

  async storePattern(pattern: {
    project_type: string
    phase_type: string
    pattern_type: string
    pattern_data: any
    user_id?: string
    success_score: number
  }) {
    await this.client.data.creator().withClassName('ProjectPattern').withProperties({
      ...pattern,
      pattern_data: JSON.stringify(pattern.pattern_data)
    }).do()
  }

  async findSimilarPatterns(query: string, filters: any = {}) {
    const result = await this.client.graphql
      .get()
      .withClassName('ProjectPattern')
      .withFields('project_type phase_type pattern_type pattern_data success_score')
      .withNearText({ concepts: [query] })
      .withLimit(5)
      .do()

    return result.data.Get.ProjectPattern
  }
}
```

**Pattern Extraction Service:**
```typescript
// /backend/src/ai/learning/pattern-extractor.ts
export class PatternExtractor {
  async extractVendorPreferences(userId: string) {
    // Get all accepted vendors for user
    const acceptedQuotes = await prisma.quote.findMany({
      where: {
        status: 'ACCEPTED',
        phase: {
          project: { created_by: userId }
        }
      },
      include: {
        vendor: true,
        phase: true
      }
    })

    // Analyze patterns
    const vendorTypePreferences = {}
    const priceRangePreferences = {}

    for (const quote of acceptedQuotes) {
      const vendorType = quote.vendor.type
      vendorTypePreferences[vendorType] = (vendorTypePreferences[vendorType] || 0) + 1

      const pricePerPerson = quote.amount / quote.phase.project.participants_count
      const priceRange = getPriceRange(pricePerPerson)
      priceRangePreferences[priceRange] = (priceRangePreferences[priceRange] || 0) + 1
    }

    // Store patterns
    await prisma.learningPattern.create({
      data: {
        user_id: userId,
        pattern_type: 'VENDOR_PREFERENCE',
        pattern_data: {
          vendor_type_preferences: vendorTypePreferences,
          price_range_preferences: priceRangePreferences,
          preferred_vendors: acceptedQuotes.map(q => q.vendor.id)
        },
        confidence: calculateConfidence(acceptedQuotes.length),
        sample_size: acceptedQuotes.length
      }
    })

    // Also store in vector DB for semantic search
    const vectorDB = new VectorDB()
    await vectorDB.storePattern({
      project_type: 'ERASMUS',
      phase_type: 'ACCOMMODATION',
      pattern_type: 'VENDOR_PREFERENCE',
      pattern_data: { /* summarized preferences */ },
      user_id: userId,
      success_score: 1.0
    })
  }

  async extractBudgetPatterns(userId: string) {
    const projects = await prisma.project.findMany({
      where: { created_by: userId, status: 'COMPLETED' },
      include: { phases: true }
    })

    const budgetByPhaseType = {}

    for (const project of projects) {
      for (const phase of project.phases) {
        if (!budgetByPhaseType[phase.type]) {
          budgetByPhaseType[phase.type] = []
        }
        budgetByPhaseType[phase.type].push({
          allocated: phase.budget_allocated,
          spent: phase.budget_spent,
          accuracy: phase.budget_spent / phase.budget_allocated
        })
      }
    }

    // Calculate averages
    const patterns = {}
    for (const [phaseType, budgets] of Object.entries(budgetByPhaseType)) {
      patterns[phaseType] = {
        avg_allocated: average(budgets.map(b => b.allocated)),
        avg_spent: average(budgets.map(b => b.spent)),
        avg_accuracy: average(budgets.map(b => b.accuracy)),
        sample_size: budgets.length
      }
    }

    await prisma.learningPattern.create({
      data: {
        user_id: userId,
        pattern_type: 'BUDGET_ALLOCATION',
        pattern_data: patterns,
        confidence: calculateConfidence(projects.length),
        sample_size: projects.length
      }
    })
  }

  async extractTimelinePatterns(userId: string) {
    const phases = await prisma.phase.findMany({
      where: {
        project: { created_by: userId, status: 'COMPLETED' },
        status: 'COMPLETED'
      },
      include: { project: true }
    })

    const durationByPhaseType = {}

    for (const phase of phases) {
      if (!durationByPhaseType[phase.type]) {
        durationByPhaseType[phase.type] = []
      }

      const planned = daysBetween(phase.start_date, phase.end_date)
      const actual = calculateActualDuration(phase) // Would need completion tracking

      durationByPhaseType[phase.type].push({
        planned,
        actual,
        accuracy: actual / planned
      })
    }

    const patterns = {}
    for (const [phaseType, durations] of Object.entries(durationByPhaseType)) {
      patterns[phaseType] = {
        avg_planned_days: average(durations.map(d => d.planned)),
        avg_actual_days: average(durations.map(d => d.actual)),
        avg_accuracy: average(durations.map(d => d.accuracy)),
        sample_size: durations.length
      }
    }

    await prisma.learningPattern.create({
      data: {
        user_id: userId,
        pattern_type: 'TIMELINE_ESTIMATE',
        pattern_data: patterns,
        confidence: calculateConfidence(phases.length),
        sample_size: phases.length
      }
    })
  }
}
```

**Tasks:**
- [ ] Set up Weaviate (Docker)
- [ ] Create vector DB client
- [ ] Implement pattern extraction service
- [ ] Extract vendor preferences
- [ ] Extract budget patterns
- [ ] Extract timeline patterns
- [ ] Schedule pattern extraction (cron job after project completion)

**Deliverables:**
- ✅ Vector DB running
- ✅ Patterns extracted from completed projects
- ✅ Patterns stored in DB and vector store

---

#### Week 12: Recommendation Engine

**Recommendation Service:**
```typescript
// /backend/src/ai/learning/recommendations.service.ts
export class RecommendationsService {
  async getPhaseRecommendations(phaseId: string, userId: string) {
    const phase = await prisma.phase.findUnique({
      where: { id: phaseId },
      include: { project: true }
    })

    // Get learned patterns
    const patterns = await prisma.learningPattern.findMany({
      where: {
        user_id: userId,
        phase_type: phase.type
      },
      orderBy: { confidence: 'desc' }
    })

    const recommendations = {
      budget: await this.recommendBudget(phase, patterns),
      timeline: await this.recommendTimeline(phase, patterns),
      vendors: await this.recommendVendors(phase, patterns),
      checklist: await this.recommendChecklist(phase, patterns)
    }

    return recommendations
  }

  private async recommendBudget(phase: Phase, patterns: LearningPattern[]) {
    const budgetPattern = patterns.find(p => p.pattern_type === 'BUDGET_ALLOCATION')
    if (!budgetPattern) return null

    const data = budgetPattern.pattern_data[phase.type]
    if (!data) return null

    return {
      recommended_amount: data.avg_spent,
      confidence: budgetPattern.confidence,
      reasoning: `Based on ${data.sample_size} similar projects, average spending is €${data.avg_spent}`,
      adjustment_factor: data.avg_accuracy // To adjust initial estimates
    }
  }

  private async recommendVendors(phase: Phase, patterns: LearningPattern[]) {
    const vendorPattern = patterns.find(p => p.pattern_type === 'VENDOR_PREFERENCE')
    if (!vendorPattern) return null

    // Get preferred vendor IDs
    const preferredIds = vendorPattern.pattern_data.preferred_vendors || []

    // Fetch vendor details
    const vendors = await prisma.vendor.findMany({
      where: { id: { in: preferredIds } },
      orderBy: { rating: 'desc' }
    })

    return {
      vendors: vendors.slice(0, 5),
      confidence: vendorPattern.confidence,
      reasoning: `Based on your past ${vendorPattern.sample_size} bookings`
    }
  }

  private async recommendTimeline(phase: Phase, patterns: LearningPattern[]) {
    const timelinePattern = patterns.find(p => p.pattern_type === 'TIMELINE_ESTIMATE')
    if (!timelinePattern) return null

    const data = timelinePattern.pattern_data[phase.type]
    if (!data) return null

    return {
      recommended_duration_days: data.avg_actual_days,
      confidence: timelinePattern.confidence,
      reasoning: `Historically, this phase takes ${data.avg_actual_days} days on average`,
      buffer_suggestion: data.avg_actual_days - data.avg_planned_days // Typically underestimated
    }
  }

  private async recommendChecklist(phase: Phase, patterns: LearningPattern[]) {
    // Use vector DB to find similar projects
    const vectorDB = new VectorDB()
    const similar = await vectorDB.findSimilarPatterns(
      `${phase.type} phase checklist items`,
      { phase_type: phase.type }
    )

    // Extract common checklist items
    const checklistItems = new Set()
    for (const pattern of similar) {
      const items = pattern.pattern_data.checklist || []
      items.forEach(item => checklistItems.add(item))
    }

    return {
      items: Array.from(checklistItems),
      confidence: similar.length > 3 ? 0.8 : 0.5,
      reasoning: `Common items from ${similar.length} similar projects`
    }
  }
}
```

**Pre-population API:**
```typescript
// /backend/src/projects/projects.routes.ts (add)
app.post('/projects/:id/phases/:phaseId/auto-populate',
  { onRequest: [requireAuth] },
  async (request) => {
    const { id: projectId, phaseId } = request.params
    const userId = request.user.userId

    const recommendationService = new RecommendationsService()
    const recommendations = await recommendationService.getPhaseRecommendations(
      phaseId,
      userId
    )

    // Apply recommendations to phase
    const updates: any = {}

    if (recommendations.budget) {
      updates.budget_allocated = recommendations.budget.recommended_amount
    }

    if (recommendations.timeline) {
      const duration = recommendations.timeline.recommended_duration_days
      const startDate = new Date(phase.start_date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + duration)
      updates.end_date = endDate
    }

    if (recommendations.checklist) {
      updates.checklist = recommendations.checklist.items.map(item => ({
        item,
        completed: false,
        auto_suggested: true
      }))
    }

    await prisma.phase.update({
      where: { id: phaseId },
      data: updates
    })

    return { recommendations, applied: updates }
  }
)
```

**Tasks:**
- [ ] Implement recommendation service
- [ ] Add budget recommendations
- [ ] Add vendor recommendations
- [ ] Add timeline recommendations
- [ ] Add checklist recommendations
- [ ] Create auto-populate API
- [ ] Build UI for showing/applying recommendations

**Deliverables:**
- ✅ Recommendations generated from patterns
- ✅ Auto-populate works
- ✅ UI shows recommendations with confidence scores
- ✅ User can accept/reject recommendations

---

### Phase 6: Additional Agents (Weeks 13-14)

#### Implementation of Remaining Agents

**Travel Agent:**
```typescript
// /backend/src/ai/agents/travel-agent.ts
export class TravelAgent extends BaseAgent {
  async research(phaseContext: any) {
    const { project, phase } = phaseContext

    // Similar to AccommodationAgent
    // Research flights, trains, buses
    // Use Skyscanner API or web scraping
    // LLM analyzes and ranks options

    const systemPrompt = `Research travel options from ${project.origin} to ${project.location} for ${project.participants_count} people.`
    // ... implementation
  }
}
```

**Food Agent:**
```typescript
// /backend/src/ai/agents/food-agent.ts
export class FoodAgent extends BaseAgent {
  async research(phaseContext: any) {
    // Research catering options, restaurants
    // Consider dietary restrictions
    // Group meal options
    // Budget per meal
  }
}
```

**Activities Agent:**
```typescript
// /backend/src/ai/agents/activities-agent.ts
export class ActivitiesAgent extends BaseAgent {
  async research(phaseContext: any) {
    // Research local activities, tours, team building
    // Consider group size
    // Educational vs recreational balance
    // Budget considerations
  }
}
```

**Insurance Agent:**
```typescript
// /backend/src/ai/agents/insurance-agent.ts
export class InsuranceAgent extends BaseAgent {
  async research(phaseContext: any) {
    // Research travel insurance providers
    // Group insurance options
    // Coverage comparison
    // Erasmus+ specific requirements
  }
}
```

**Emergency Planning Agent:**
```typescript
// /backend/src/ai/agents/emergency-agent.ts
export class EmergencyAgent extends BaseAgent {
  async generatePlan(phaseContext: any) {
    // Generate emergency contact list
    // Local hospitals, embassies
    // Emergency procedures
    // Communication plan
  }
}
```

**Agent Registry:**
```typescript
// /backend/src/ai/agents/registry.ts
import { AccommodationAgent } from './accommodation-agent'
import { TravelAgent } from './travel-agent'
// ... other agents

export function getAgentForPhaseType(phaseType: string) {
  switch (phaseType) {
    case 'ACCOMMODATION':
      return new AccommodationAgent()
    case 'TRAVEL':
      return new TravelAgent()
    case 'FOOD':
      return new FoodAgent()
    case 'ACTIVITIES':
      return new ActivitiesAgent()
    case 'INSURANCE':
      return new InsuranceAgent()
    case 'EMERGENCY_PLANNING':
      return new EmergencyAgent()
    default:
      return new BaseAgent()
  }
}
```

**Tasks:**
- [ ] Implement TravelAgent
- [ ] Implement FoodAgent
- [ ] Implement ActivitiesAgent
- [ ] Implement InsuranceAgent
- [ ] Implement EmergencyAgent
- [ ] Create agent registry
- [ ] Test each agent independently
- [ ] Integration test all agents

**Deliverables:**
- ✅ All agents implemented
- ✅ Each agent can research and suggest
- ✅ Agents integrated into chat system
- ✅ All agents tested

---

### Phase 7: Budget & Reporting (Weeks 15-16)

#### Week 15: Budget Tracking UI

**Budget Dashboard Component:**
```tsx
// /frontend/src/components/Budget/BudgetDashboard.tsx
export function BudgetDashboard({ projectId }: { projectId: string }) {
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetchProject(projectId)
  })

  const { data: phases } = useQuery({
    queryKey: ['phases', projectId],
    queryFn: () => fetchPhases(projectId)
  })

  const totalAllocated = phases?.reduce((sum, p) => sum + p.budget_allocated, 0) || 0
  const totalSpent = phases?.reduce((sum, p) => sum + p.budget_spent, 0) || 0
  const remaining = totalAllocated - totalSpent

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Budget Overview</h2>

      {/* Total Budget */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-100 p-4 rounded">
          <div className="text-sm text-gray-600">Total Budget</div>
          <div className="text-2xl font-bold">€{totalAllocated.toLocaleString()}</div>
        </div>
        <div className="bg-red-100 p-4 rounded">
          <div className="text-sm text-gray-600">Spent</div>
          <div className="text-2xl font-bold">€{totalSpent.toLocaleString()}</div>
        </div>
        <div className="bg-green-100 p-4 rounded">
          <div className="text-sm text-gray-600">Remaining</div>
          <div className="text-2xl font-bold">€{remaining.toLocaleString()}</div>
        </div>
      </div>

      {/* Budget Health */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span>Budget Usage</span>
          <span>{((totalSpent / totalAllocated) * 100).toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className={`h-4 rounded-full ${getBudgetColor(totalSpent, totalAllocated)}`}
            style={{ width: `${(totalSpent / totalAllocated) * 100}%` }}
          />
        </div>
      </div>

      {/* Per-Phase Breakdown */}
      <h3 className="text-xl font-semibold mb-4">Budget by Phase</h3>
      <div className="space-y-4">
        {phases?.map(phase => (
          <div key={phase.id} className="border rounded p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{phase.name}</span>
              <span className={getPhaseStatusColor(phase.budget_spent, phase.budget_allocated)}>
                €{phase.budget_spent} / €{phase.budget_allocated}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getBudgetColor(phase.budget_spent, phase.budget_allocated)}`}
                style={{ width: `${(phase.budget_spent / phase.budget_allocated) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getBudgetColor(spent: number, allocated: number): string {
  const percentage = (spent / allocated) * 100
  if (percentage > 95) return 'bg-red-500'
  if (percentage > 80) return 'bg-yellow-500'
  return 'bg-green-500'
}
```

**Quote Comparison UI:**
```tsx
// /frontend/src/components/Quotes/QuoteComparison.tsx
export function QuoteComparison({ phaseId }: { phaseId: string }) {
  const { data: quotes } = useQuery({
    queryKey: ['quotes', phaseId],
    queryFn: () => fetchQuotes(phaseId)
  })

  const acceptQuote = useMutation({
    mutationFn: (quoteId: string) => acceptQuoteAPI(quoteId),
    onSuccess: () => queryClient.invalidateQueries(['quotes', phaseId])
  })

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Compare Quotes</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quotes?.map(quote => (
          <div key={quote.id} className="border rounded p-4">
            <div className="font-medium text-lg">{quote.vendor.name}</div>
            <div className="text-2xl font-bold text-blue-600 my-2">
              €{quote.amount.toLocaleString()}
            </div>

            {quote.details && (
              <div className="text-sm text-gray-600 mb-4">
                {Object.entries(quote.details).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {value}
                  </div>
                ))}
              </div>
            )}

            {quote.status === 'PENDING' && (
              <button
                onClick={() => acceptQuote.mutate(quote.id)}
                className="w-full bg-green-500 text-white py-2 rounded"
              >
                Accept Quote
              </button>
            )}

            {quote.status === 'ACCEPTED' && (
              <div className="text-green-600 font-medium">✓ Accepted</div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
```

**Tasks:**
- [ ] Build budget dashboard UI
- [ ] Add per-phase budget tracking
- [ ] Create expense entry form
- [ ] Build quote comparison UI
- [ ] Add budget alerts (approaching limit)
- [ ] Integrate with OpenProject budget sync

**Deliverables:**
- ✅ Budget dashboard functional
- ✅ Quote comparison works
- ✅ Budget alerts trigger
- ✅ OpenProject sync working

---

#### Week 16: Reporting & Export

**Report Generator:**
```typescript
// /backend/src/reports/report-generator.ts
import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'

export class ReportGenerator {
  async generateProjectReport(projectId: string, format: 'pdf' | 'excel') {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        phases: {
          include: {
            communications: true,
            quotes: true
          }
        }
      }
    })

    if (format === 'pdf') {
      return this.generatePDF(project)
    } else {
      return this.generateExcel(project)
    }
  }

  private async generatePDF(project: any) {
    const doc = new PDFDocument()
    const chunks: Buffer[] = []

    doc.on('data', chunk => chunks.push(chunk))
    doc.on('end', () => {})

    // Title
    doc.fontSize(20).text(`Project Report: ${project.name}`, { align: 'center' })
    doc.moveDown()

    // Project Summary
    doc.fontSize(14).text('Project Summary')
    doc.fontSize(10)
    doc.text(`Status: ${project.status}`)
    doc.text(`Dates: ${formatDate(project.start_date)} - ${formatDate(project.end_date)}`)
    doc.text(`Location: ${project.location}`)
    doc.text(`Participants: ${project.participants_count}`)
    doc.moveDown()

    // Budget Summary
    doc.fontSize(14).text('Budget Summary')
    doc.fontSize(10)
    doc.text(`Total Budget: €${project.budget_total}`)
    doc.text(`Total Spent: €${project.budget_spent}`)
    doc.text(`Remaining: €${project.budget_total - project.budget_spent}`)
    doc.moveDown()

    // Phase Breakdown
    doc.fontSize(14).text('Phase Breakdown')
    for (const phase of project.phases) {
      doc.fontSize(12).text(phase.name, { underline: true })
      doc.fontSize(10)
      doc.text(`Status: ${phase.status}`)
      doc.text(`Budget: €${phase.budget_spent} / €${phase.budget_allocated}`)
      doc.text(`Communications: ${phase.communications.length} sent`)
      doc.text(`Quotes Received: ${phase.quotes.length}`)
      doc.moveDown()
    }

    doc.end()

    return new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
    })
  }

  private async generateExcel(project: any) {
    const workbook = new ExcelJS.Workbook()

    // Summary Sheet
    const summarySheet = workbook.addWorksheet('Summary')
    summarySheet.columns = [
      { header: 'Field', key: 'field', width: 20 },
      { header: 'Value', key: 'value', width: 30 }
    ]
    summarySheet.addRows([
      { field: 'Project Name', value: project.name },
      { field: 'Status', value: project.status },
      { field: 'Start Date', value: formatDate(project.start_date) },
      { field: 'End Date', value: formatDate(project.end_date) },
      { field: 'Total Budget', value: `€${project.budget_total}` },
      { field: 'Total Spent', value: `€${project.budget_spent}` }
    ])

    // Phases Sheet
    const phasesSheet = workbook.addWorksheet('Phases')
    phasesSheet.columns = [
      { header: 'Phase Name', key: 'name', width: 25 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Budget Allocated', key: 'allocated', width: 15 },
      { header: 'Budget Spent', key: 'spent', width: 15 },
      { header: 'Start Date', key: 'start', width: 15 },
      { header: 'End Date', key: 'end', width: 15 }
    ]
    phasesSheet.addRows(
      project.phases.map(p => ({
        name: p.name,
        status: p.status,
        allocated: p.budget_allocated,
        spent: p.budget_spent,
        start: formatDate(p.start_date),
        end: formatDate(p.end_date)
      }))
    )

    // Communications Sheet
    const commsSheet = workbook.addWorksheet('Communications')
    commsSheet.columns = [
      { header: 'Phase', key: 'phase', width: 20 },
      { header: 'Vendor', key: 'vendor', width: 20 },
      { header: 'Type', key: 'type', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Sent At', key: 'sent_at', width: 20 }
    ]
    for (const phase of project.phases) {
      for (const comm of phase.communications) {
        commsSheet.addRow({
          phase: phase.name,
          vendor: comm.vendor?.name || 'N/A',
          type: comm.type,
          status: comm.status,
          sent_at: formatDate(comm.sent_at)
        })
      }
    }

    const buffer = await workbook.xlsx.writeBuffer()
    return buffer
  }
}
```

**Export API:**
```typescript
// /backend/src/reports/reports.routes.ts
export async function registerReportRoutes(app: FastifyInstance) {
  app.get('/projects/:id/export', { onRequest: [requireAuth] }, async (request, reply) => {
    const { id } = request.params
    const { format } = request.query as { format: 'pdf' | 'excel' }

    const generator = new ReportGenerator()
    const buffer = await generator.generateProjectReport(id, format)

    const filename = `project-${id}-report.${format === 'pdf' ? 'pdf' : 'xlsx'}`
    const contentType = format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

    reply
      .header('Content-Disposition', `attachment; filename="${filename}"`)
      .header('Content-Type', contentType)
      .send(buffer)
  })
}
```

**Tasks:**
- [ ] Implement PDF report generation
- [ ] Implement Excel export
- [ ] Create Erasmus+ report templates
- [ ] Add timeline export (image)
- [ ] Build export UI
- [ ] Test all export formats

**Deliverables:**
- ✅ PDF reports generated
- ✅ Excel export works
- ✅ Erasmus+ templates available
- ✅ Timeline can be exported as image

---

### Phase 8: Polish & Testing (Weeks 17-18)

#### Week 17: Testing & Bug Fixes

**Test Coverage Goals:**
- Backend unit tests: 85%+
- Frontend component tests: 75%+
- E2E tests: Critical user journeys

**E2E Tests (Playwright):**
```typescript
// /frontend/e2e/project-lifecycle.spec.ts
import { test, expect } from '@playwright/test'

test('complete project lifecycle', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password')
  await page.click('button[type="submit"]')

  // Create project
  await page.click('text=New Project')
  await page.fill('input[name="name"]', 'Test Erasmus Project')
  await page.selectOption('select[name="type"]', 'STUDENT_EXCHANGE')
  await page.fill('input[name="location"]', 'Barcelona')
  await page.click('button:has-text("Create")')

  // Verify timeline appears
  await expect(page.locator('.gantt-container')).toBeVisible()

  // Click on accommodation phase
  await page.click('text=Accommodation')

  // Verify chat appears
  await expect(page.locator('.chat-interface')).toBeVisible()

  // Send message to AI
  await page.fill('input[placeholder*="Ask"]', 'Find beachfront hotels')
  await page.click('button:has-text("Send")')

  // Wait for AI response
  await expect(page.locator('text=Hotel').first()).toBeVisible({ timeout: 10000 })

  // Select a hotel
  await page.click('text=Select').first()

  // Make contact
  await page.click('text=Make Contact')

  // Verify email composed
  await expect(page.locator('text=Email Preview')).toBeVisible()
  await page.click('button:has-text("Send")')

  // Verify communication logged
  await expect(page.locator('text=Email sent')).toBeVisible()
})
```

**Performance Testing:**
```typescript
// Load test with autocannon
import autocannon from 'autocannon'

async function loadTest() {
  const result = await autocannon({
    url: 'http://localhost:3000',
    connections: 100,
    duration: 30,
    requests: [
      {
        method: 'GET',
        path: '/projects',
        headers: {
          authorization: 'Bearer test-token'
        }
      }
    ]
  })

  console.log(result)
}
```

**Tasks:**
- [ ] Write comprehensive unit tests
- [ ] Write integration tests
- [ ] Write E2E tests for critical paths
- [ ] Performance testing
- [ ] Security audit
- [ ] Fix all critical bugs
- [ ] Optimize slow queries

**Deliverables:**
- ✅ 85%+ test coverage
- ✅ All E2E tests passing
- ✅ No critical bugs
- ✅ Performance targets met

---

#### Week 18: Documentation & Launch Prep

**Documentation to Create:**

1. **User Guide** (`docs/user-guide.md`)
   - Getting started
   - Creating a project
   - Using AI agents
   - Budget tracking
   - Reports

2. **Admin Guide** (`docs/admin-guide.md`)
   - Installation
   - Configuration
   - OpenProject setup
   - Email service setup
   - Backup procedures

3. **API Documentation** (auto-generated with OpenAPI)
   - All endpoints documented
   - Examples for each
   - Authentication flow

4. **Developer Guide** (`docs/developer-guide.md`)
   - Architecture overview
   - Setting up dev environment
   - Adding new agents
   - Database migrations
   - Testing guidelines

**Deployment Preparation:**

1. **Production Docker Compose:**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    environment:
      - VITE_API_URL=https://api.example.com
    restart: unless-stopped

  backend:
    build: ./backend
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
      - weaviate

  postgres:
    image: postgres:16
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    restart: unless-stopped

  redis:
    image: redis:7.2
    restart: unless-stopped

  weaviate:
    image: semitechnologies/weaviate:1.23
    environment:
      OPENAI_APIKEY: ${OPENAI_API_KEY}
    restart: unless-stopped

  traefik:
    image: traefik:v2.10
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./traefik.yml:/traefik.yml
      - ./acme.json:/acme.json
    restart: unless-stopped

volumes:
  postgres-data:
```

2. **CI/CD Pipeline** (`.github/workflows/deploy.yml`)
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to production
        run: |
          # SSH into server and pull latest
          # Run docker-compose up -d
```

**Tasks:**
- [ ] Write user documentation
- [ ] Write admin documentation
- [ ] Generate API docs
- [ ] Write developer guide
- [ ] Create deployment scripts
- [ ] Set up CI/CD
- [ ] Perform final security review
- [ ] Create backup/restore procedures
- [ ] Train initial users

**Deliverables:**
- ✅ Complete documentation
- ✅ Deployment ready
- ✅ CI/CD pipeline working
- ✅ Training materials created
- ✅ System ready for launch

---

## 5. Testing Strategy

### 5.1 Unit Testing

**Backend (Vitest):**
```typescript
// Example: test/services/recommendations.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { RecommendationsService } from '@/ai/learning/recommendations.service'

describe('RecommendationsService', () => {
  let service: RecommendationsService

  beforeAll(() => {
    service = new RecommendationsService()
  })

  it('should recommend budget based on historical data', async () => {
    const recommendation = await service.recommendBudget(mockPhase, mockPatterns)
    expect(recommendation).toBeDefined()
    expect(recommendation.recommended_amount).toBeGreaterThan(0)
    expect(recommendation.confidence).toBeGreaterThanOrEqual(0)
    expect(recommendation.confidence).toBeLessThanOrEqual(1)
  })
})
```

**Frontend (Vitest + React Testing Library):**
```tsx
// Example: test/components/GanttTimeline.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { GanttTimeline } from '@/components/Timeline/GanttTimeline'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

describe('GanttTimeline', () => {
  it('renders timeline with phases', async () => {
    const queryClient = new QueryClient()
    render(
      <QueryClientProvider client={queryClient}>
        <GanttTimeline projectId="test-id" />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Accommodation')).toBeInTheDocument()
    })
  })
})
```

### 5.2 Integration Testing

**API Integration Tests:**
```typescript
// test/integration/projects.test.ts
import { describe, it, expect } from 'vitest'
import { app } from '@/app'

describe('Projects API', () => {
  it('should create and retrieve project', async () => {
    // Create
    const createResponse = await app.inject({
      method: 'POST',
      url: '/projects',
      headers: { authorization: `Bearer ${testToken}` },
      payload: {
        name: 'Test Project',
        type: 'STUDENT_EXCHANGE',
        // ...
      }
    })

    expect(createResponse.statusCode).toBe(201)
    const { project } = createResponse.json()

    // Retrieve
    const getResponse = await app.inject({
      method: 'GET',
      url: `/projects/${project.id}`,
      headers: { authorization: `Bearer ${testToken}` }
    })

    expect(getResponse.statusCode).toBe(200)
    expect(getResponse.json().project.name).toBe('Test Project')
  })
})
```

### 5.3 E2E Testing

**Critical User Journeys:**
1. User registration and login
2. Creating a new project from template
3. AI agent research and vendor selection
4. Email composition and sending
5. Budget tracking and quote acceptance
6. Report generation

**E2E Test Coverage:**
- 100% of critical paths
- Major error scenarios
- Cross-browser testing (Chrome, Firefox, Safari)

### 5.4 Performance Testing

**Metrics to Track:**
- API response times (p95 < 500ms)
- Timeline render time (< 2s for 50 phases)
- AI response time (< 5s)
- Database query times (< 100ms)

**Tools:**
- Autocannon (load testing)
- Lighthouse (frontend performance)
- k6 (advanced load testing)

---

## 6. Deployment Plan

### 6.1 Infrastructure Requirements

**Minimum Server Specs:**
- **CPU:** 4 cores
- **RAM:** 16GB
- **Storage:** 100GB SSD
- **Network:** 100 Mbps

**Services:**
- PostgreSQL (primary database)
- Redis (cache)
- Weaviate (vector database)
- MinIO (file storage)
- Traefik (reverse proxy + SSL)

### 6.2 Deployment Steps

1. **Provision Server**
   - Set up VPS (DigitalOcean, AWS, Hetzner)
   - Install Docker + Docker Compose
   - Configure firewall

2. **Configure DNS**
   - Point domain to server IP
   - Set up subdomains (api.example.com, app.example.com)

3. **Deploy Services**
   ```bash
   # Clone repo
   git clone <repo-url>
   cd project-pipeline-system

   # Set environment variables
   cp .env.example .env
   nano .env

   # Start services
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Run Migrations**
   ```bash
   docker-compose exec backend npx prisma migrate deploy
   ```

5. **Seed Initial Data**
   ```bash
   docker-compose exec backend npm run seed
   ```

6. **Configure OpenProject**
   - Set up API key
   - Test connection

7. **Configure Email Service**
   - Set up SendGrid account
   - Verify domain
   - Configure webhooks

8. **SSL Setup**
   - Traefik auto-generates Let's Encrypt certs
   - Verify HTTPS working

9. **Monitoring Setup**
   - Configure Prometheus + Grafana
   - Set up alerts (email, Slack)

10. **Backup Setup**
    - Schedule daily database backups
    - Test restore procedure

### 6.3 Post-Deployment Checklist

- [ ] All services running
- [ ] HTTPS working
- [ ] Database migrated
- [ ] OpenProject connected
- [ ] Email sending works
- [ ] AI agents responding
- [ ] Monitoring active
- [ ] Backups scheduled
- [ ] Documentation updated with production URLs
- [ ] First admin user created

---

## 7. Risk Management

### 7.1 Technical Risks

| Risk | Mitigation |
|------|------------|
| **LLM API costs exceed budget** | Implement aggressive caching; use cheaper models for simple tasks; set monthly spending limits with alerts |
| **OpenProject API changes** | Pin to specific API version; monitor changelog; have fallback to standalone mode |
| **Web scraping breaks** | Implement multiple scraping strategies; have LLM-only fallback; log failures for manual review |
| **Poor AI response quality** | Extensive prompt engineering; user feedback loop; human review for critical decisions |
| **Database performance issues** | Implement proper indexing; use Redis caching; optimize queries; consider read replicas |

### 7.2 Schedule Risks

| Risk | Mitigation |
|------|------------|
| **Underestimated complexity** | 20% buffer built into timeline; weekly reviews to catch delays early; prioritize ruthlessly |
| **Dependency delays** | Parallelize where possible; have backup plans for third-party services |
| **Scope creep** | Strict change control process; defer nice-to-haves to v2 |

### 7.3 User Adoption Risks

| Risk | Mitigation |
|------|------------|
| **Users don't trust AI** | Show reasoning; allow overrides; gradual rollout; demonstrate success stories |
| **Steep learning curve** | Comprehensive onboarding; video tutorials; tooltips; in-app help |
| **Resistance to change** | Executive buy-in; pilot program; show ROI early; gather feedback |

---

## 8. Success Metrics

### 8.1 Launch Metrics (First 3 Months)

- **User Adoption:** 80% of coordinators using system
- **Projects Created:** 10+ projects
- **AI Usage:** 70% of phases use AI agents
- **Email Automation:** 60% of vendor emails automated
- **User Satisfaction:** 4.0/5 average rating

### 8.2 Long-term Metrics (After 6 Months)

- **Time Savings:** 50%+ reduction in planning time
- **Budget Accuracy:** 80%+ accuracy
- **Learning Effectiveness:** 30%+ reduction in user input
- **System Reliability:** 99% uptime
- **User Satisfaction:** 4.5/5 average rating

### 8.3 Technical Metrics

- **Performance:** p95 response times < 500ms
- **Availability:** 99.5% uptime
- **Error Rate:** < 0.1% of requests
- **Test Coverage:** 85%+ backend, 75%+ frontend

---

## 9. Next Steps

### Immediate Actions

1. **Review & Approve Plan**
   - Stakeholder review
   - Budget confirmation
   - Timeline approval

2. **Team Assembly**
   - Hire/assign developers
   - Define roles and responsibilities

3. **Environment Setup**
   - Create repos (GitHub)
   - Set up project management (Jira/Linear)
   - Configure development environments

4. **Kickoff Meeting**
   - Review plan with team
   - Assign Phase 1 tasks
   - Set up communication channels

### Week 1 Tasks

- [ ] Set up GitHub repository
- [ ] Initialize backend project
- [ ] Configure Docker Compose
- [ ] Implement Prisma schema
- [ ] Run initial database migration

---

## Appendix A: Folder Structure

```
project-pipeline-system/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Timeline/
│   │   │   │   ├── GanttTimeline.tsx
│   │   │   │   └── VisTimeline.tsx
│   │   │   ├── Chat/
│   │   │   │   └── PhaseChat.tsx
│   │   │   ├── Budget/
│   │   │   │   ├── BudgetDashboard.tsx
│   │   │   │   └── QuoteComparison.tsx
│   │   │   └── Communications/
│   │   │       └── EmailLog.tsx
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ProjectTimeline.tsx
│   │   │   └── PhaseDetail.tsx
│   │   ├── api/
│   │   │   └── client.ts
│   │   ├── hooks/
│   │   ├── utils/
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── env.ts
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   └── middleware.ts
│   │   ├── projects/
│   │   │   ├── projects.routes.ts
│   │   │   └── projects.service.ts
│   │   ├── phases/
│   │   ├── communications/
│   │   ├── ai/
│   │   │   ├── agents/
│   │   │   │   ├── base-agent.ts
│   │   │   │   ├── accommodation-agent.ts
│   │   │   │   ├── travel-agent.ts
│   │   │   │   ├── food-agent.ts
│   │   │   │   └── registry.ts
│   │   │   ├── learning/
│   │   │   │   ├── pattern-extractor.ts
│   │   │   │   └── recommendations.service.ts
│   │   │   ├── vector-db/
│   │   │   │   └── weaviate.client.ts
│   │   │   └── chat.socket.ts
│   │   ├── integrations/
│   │   │   ├── openproject.client.ts
│   │   │   ├── email.service.ts
│   │   │   └── scrapers/
│   │   ├── reports/
│   │   └── app.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
│
├── docs/
│   ├── user-guide.md
│   ├── admin-guide.md
│   ├── developer-guide.md
│   └── api-docs/ (auto-generated)
│
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

## Appendix B: Environment Variables

```bash
# Backend (.env)
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/pipeline_db
REDIS_URL=redis://localhost:6379

# OpenProject
OPENPROJECT_URL=https://openproject.example.com
OPENPROJECT_API_KEY=your-api-key

# AI Services
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Email
SENDGRID_API_KEY=SG...
FROM_EMAIL=noreply@example.com

# Weaviate
WEAVIATE_HOST=localhost:8080

# Security
JWT_SECRET=your-secret-key

# Monitoring
SENTRY_DSN=https://...
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-12-31 | SCAR AI | Initial implementation plan |

---

**This implementation plan is ready for execution. Next step: Begin Phase 1 development.**
