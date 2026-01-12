# Open Horizon Project Pipeline - Complete PRD
## Seed-to-Application System for Erasmus+ Projects

**Version:** 2.0
**Last Updated:** 2026-01-12
**Status:** Phase 1 Implementation Ready
**Target Launch:** February 10, 2026

---

## Executive Summary

The Open Horizon Project Pipeline is a comprehensive AI-powered system that guides users from initial project ideation through to completed Erasmus+ grant applications. The system automates budget calculations according to Erasmus+ rules, provides intelligent vendor research with AI-powered analysis, and generates application-ready documentation.

**Primary User:** Single coordinator managing 3-5 projects for February 2026 deadline, scaling to 20+ projects annually.

**Core Value Proposition:** Transform 40-60 hours of manual planning per project into 4-6 hours of guided, AI-assisted workflow.

---

## Table of Contents

1. [Complete Pipeline Flow](#complete-pipeline-flow)
2. [Database Architecture](#database-architecture)
3. [Feature Specifications](#feature-specifications)
4. [AI Agent System](#ai-agent-system)
5. [Budget Calculation Engine](#budget-calculation-engine)
6. [Vendor Research & Communication](#vendor-research--communication)
7. [Application Form Generation](#application-form-generation)
8. [Phase 1: February Deadline](#phase-1-february-deadline)
9. [Phase 2: Intelligence Layer](#phase-2-intelligence-layer)
10. [Technical Implementation](#technical-implementation)
11. [Success Metrics](#success-metrics)

---

## Complete Pipeline Flow

### Overview: 11-Step Journey

```
IDEATION → REFINEMENT → CREATION → PLANNING → EXECUTION → APPLICATION

Step 1:  Generate Seeds (AI brainstorm)
Step 2:  Save to Garden (curate ideas)
Step 3:  Elaborate Seed (conversational refinement)
Step 4:  Convert to Project (auto-generate phases)
Step 5:  Calculate Budget (Erasmus+ rules)
Step 6:  Research Vendors (AI-powered with pros/cons)
Step 7:  Request Quotes (select & email)
Step 8:  Track Responses (communication log)
Step 9:  Finalize Plans (accept quotes, confirm details)
Step 10: Generate Application (KA1/KA2 forms)
Step 11: Export & Submit (PDF/DOCX/Excel)
```

---

## 1. IDEATION: Seed Generation

### User Experience

**Entry Point:** Dashboard → "Generate New Project Ideas" button

**Process:**
1. User enters brainstorming prompt:
   ```
   Example: "Youth exchange focused on digital literacy
   for rural communities in Sweden, Germany, and Poland"
   ```

2. System generates 5-15 diverse seed ideas via GPT-4

3. Each seed displays:
   - **Informal Title** - Catchy, relatable name
   - **Informal Description** - Friendly overview (100-150 words)
   - **Formal Title** - Erasmus+ application-ready name
   - **Formal Description** - EU grant language (150-200 words)
   - **Target Group** - Age range, background
   - **Activities Snapshot** - 3-5 example activities
   - **Estimated Participants** - Suggested group size
   - **Duration** - Recommended timeline
   - **Approval Likelihood** - AI-predicted score (1-100)
   - **Why It's a Good Idea** - AI justification

4. User actions per seed:
   - **Save** - Add to Garden for later
   - **Dismiss** - Remove from view
   - **Elaborate** - Open conversational refinement
   - **Convert to Project** - Skip elaboration, create immediately

### Technical Specification

**API Endpoint:** `POST /seeds/generate`

**Request:**
```json
{
  "prompt": "Youth exchange for digital literacy in rural areas",
  "tenantId": "uuid",
  "userId": "uuid"
}
```

**Response:**
```json
{
  "seeds": [
    {
      "id": "uuid",
      "informalTitle": "Digital Nomads: Bridging the Rural Gap",
      "informalDescription": "...",
      "formalTitle": "Digital Literacy Empowerment for Rural Youth",
      "formalDescription": "...",
      "targetGroup": "Youth aged 16-25 from rural communities",
      "activities": ["Digital storytelling workshops", "..."],
      "estimatedParticipants": 30,
      "durationDays": 7,
      "approvalLikelihood": 78,
      "reasoning": "Strong EU priority alignment..."
    }
  ]
}
```

**AI Implementation:**
- **Model:** GPT-4-turbo-preview
- **Temperature:** 0.8 (creative diversity)
- **System Prompt:** Generates seeds optimized for Erasmus+ Youth priorities
- **Output:** Structured JSON with validation via Zod schema

---

## 2. REFINEMENT: Seed Garden & Elaboration

### Seed Garden

**Purpose:** Central repository for all generated seeds

**Features:**
- **Filter View:** All seeds / Saved seeds
- **Search:** By title, description, target group
- **Sort:** By approval likelihood, date created, participants
- **Actions:** Elaborate, Convert to Project, Delete

### Seed Elaboration (Conversational Refinement)

**Entry Point:** Seed Card → "Elaborate" button

**Process:**
1. Opens chat interface with seed context pre-loaded
2. User refines through conversation:
   ```
   User: "Can we focus more on environmental sustainability?"
   AI: "Excellent addition! Here's an updated concept that
   integrates digital literacy with eco-activism..."

   User: "Add participants from Spain and France"
   AI: "Updated to include 5 partners across 5 countries..."
   ```

3. Each elaboration creates new version (history preserved)
4. User can convert any elaboration version to project

**Technical Specification:**

**API Endpoint:** `POST /seeds/:id/elaborate`

**Request:**
```json
{
  "message": "Can we add environmental sustainability focus?",
  "conversationHistory": [...]
}
```

**Response:**
```json
{
  "updatedSeed": {
    "informalTitle": "Digital Eco-Warriors: Rural Innovation",
    "informalDescription": "...",
    "changes": ["Added environmental focus", "Integrated eco-activism activities"]
  },
  "aiMessage": "I've updated the concept to integrate..."
}
```

**AI Implementation:**
- **Model:** GPT-4-turbo-preview
- **Context:** Original seed + full conversation history
- **Memory:** Maintains coherence across elaborations
- **Validation:** Ensures Erasmus+ alignment after each iteration

---

## 3. CREATION: Seed-to-Project Conversion

### Conversion Process

**Trigger:** User clicks "Convert to Project" on any seed or elaboration

**Automatic Actions:**
1. Create Project entity with seed data
2. Parse participant countries from description
3. Generate default phases based on project type
4. Calculate initial timeline
5. Set default budget placeholders
6. Redirect to Project Detail page

### Default Phase Generation

**Standard Youth Exchange Phases:**
```
1. APPLICATION (7 days before start)
   - Type: APPLICATION
   - Budget: €0 (planning phase)
   - Checklist: [Gather documents, Review guidelines, Draft application]

2. ACCOMMODATION (60 days before start)
   - Type: ACCOMMODATION
   - Budget: TBD (calculated in Step 5)
   - Checklist: [Research options, Request quotes, Book venue]

3. TRAVEL (45 days before start)
   - Type: TRAVEL
   - Budget: TBD (calculated in Step 5)
   - Checklist: [Research flights, Book tickets, Arrange local transport]

4. FOOD (30 days before start)
   - Type: FOOD
   - Budget: TBD (calculated in Step 5)
   - Checklist: [Find caterers, Request menus, Book services]

5. ACTIVITIES (21 days before start)
   - Type: ACTIVITIES
   - Budget: TBD (calculated in Step 5)
   - Checklist: [Plan workshops, Book facilitators, Prepare materials]

6. PERMITS (14 days before start)
   - Type: PERMITS
   - Budget: €0
   - Checklist: [Apply for visas, Register event, Insurance]

7. REPORTING (7 days after end)
   - Type: REPORTING
   - Budget: €0
   - Checklist: [Collect feedback, Document outcomes, Submit reports]
```

**Customization:**
- User can add/remove/reorder phases
- Each phase independently managed
- Dependencies tracked (e.g., accommodation before travel)

---

## 4. PLANNING: Gantt Chart & Timeline

### Gantt Chart Visualization

**Purpose:** Visual timeline of all project phases

**Features:**
- **Interactive drag** - Adjust phase dates visually
- **Dependency lines** - Show phase relationships
- **Color coding** - By phase status (not started, in progress, completed)
- **Milestone markers** - Key deadlines (application due, project start/end)
- **Budget overlay** - Show spending timeline
- **Team assignments** - Who's responsible for each phase

**Technical Specification:**

**Library:** Frappe Gantt (already integrated)

**Data Structure:**
```javascript
{
  tasks: [
    {
      id: 'phase-uuid',
      name: 'Accommodation Booking',
      start: '2026-02-15',
      end: '2026-02-18',
      progress: 60,
      dependencies: '',
      custom_class: 'phase-accommodation'
    }
  ]
}
```

---

## 5. BUDGET CALCULATION: Erasmus+ Rules Engine

### Overview

**Purpose:** Auto-calculate project budget based on Erasmus+ 2024-2027 unit costs

**Inputs:**
- Number of participants per country
- Destination country
- Project duration (days)
- Travel distances (calculated automatically)

**Outputs:**
- Travel costs per participant (by distance band)
- Individual support (per diem) per participant
- Organizational support (lump sum)
- Total project budget

### Budget Calculation Components

#### A. Distance Calculator

**Purpose:** Calculate travel distance and determine cost band

**Implementation Options:**

**Option 1: Haversine Formula (Recommended)**
```typescript
interface Coordinates {
  lat: number
  lon: number
}

class DistanceCalculator {
  // Geocode city to coordinates
  async geocode(city: string, country: string): Promise<Coordinates> {
    // Use Mapbox Geocoding API (free tier: 100k/month)
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${city}.json?` +
      `country=${country}&access_token=${MAPBOX_TOKEN}`
    )
    const data = await response.json()
    return {
      lon: data.features[0].center[0],
      lat: data.features[0].center[1]
    }
  }

  // Calculate distance between two coordinates
  calculateDistance(origin: Coordinates, destination: Coordinates): number {
    const R = 6371 // Earth radius in km
    const dLat = this.deg2rad(destination.lat - origin.lat)
    const dLon = this.deg2rad(destination.lon - origin.lon)

    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(origin.lat)) *
      Math.cos(this.deg2rad(destination.lat)) *
      Math.sin(dLon/2) * Math.sin(dLon/2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c // Distance in km
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI/180)
  }

  // Get Erasmus+ distance band and travel amount
  getDistanceBand(km: number): { band: string; amount: number } {
    if (km <= 99) return { band: '10-99 km', amount: 23 }
    if (km <= 499) return { band: '100-499 km', amount: 180 }
    if (km <= 1999) return { band: '500-1999 km', amount: 275 }
    if (km <= 2999) return { band: '2000-2999 km', amount: 360 }
    if (km <= 3999) return { band: '3000-3999 km', amount: 530 }
    if (km <= 7999) return { band: '4000-7999 km', amount: 820 }
    return { band: '8000+ km', amount: 1500 }
  }
}
```

**Option 2: EU Distance Calculator API (Alternative)**
```typescript
// Scrape official EU tool as fallback
async calculateDistanceEU(origin: string, destination: string) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  await page.goto('https://ec.europa.eu/programmes/erasmus-plus/tools/distance_en.htm')
  await page.fill('#origin', origin)
  await page.fill('#destination', destination)
  await page.click('#calculate')

  const result = await page.textContent('#result')
  const distance = parseInt(result.match(/(\d+) km/)[1])

  await browser.close()
  return distance
}
```

#### B. Unit Cost Tables

**Travel Costs (by distance band):**
```typescript
const TRAVEL_COSTS = {
  '10-99': 23,
  '100-499': 180,
  '500-1999': 275,
  '2000-2999': 360,
  '3000-3999': 530,
  '4000-7999': 820,
  '8000+': 1500
}
```

**Individual Support (per diem by destination country):**
```typescript
const PER_DIEM_RATES = {
  // Per day per participant
  'AT': 58, 'BE': 60, 'BG': 37, 'HR': 47, 'CY': 50,
  'CZ': 40, 'DK': 65, 'EE': 43, 'FI': 62, 'FR': 56,
  'DE': 55, 'GR': 50, 'HU': 40, 'IS': 65, 'IE': 60,
  'IT': 53, 'LV': 43, 'LI': 62, 'LT': 43, 'LU': 60,
  'MT': 50, 'NL': 60, 'NO': 70, 'PL': 40, 'PT': 48,
  'RO': 37, 'SK': 40, 'SI': 47, 'ES': 42, 'SE': 62,
  'TR': 37, 'MK': 37, 'RS': 37
}
```

**Green Travel Supplement (for distances under 500km):**
```typescript
const GREEN_TRAVEL_BONUS = {
  '10-99': 30,     // Additional €30 for green travel
  '100-499': 40    // Additional €40 for green travel
}
```

**Organizational Support (flat rates by project scale):**
```typescript
const ORGANIZATIONAL_SUPPORT = {
  small: 500,      // 1-10 participants
  medium: 750,     // 11-30 participants
  large: 1000      // 31-60 participants
}
```

#### C. Budget Calculation Engine

```typescript
interface BudgetInput {
  participantsByCountry: { [country: string]: number } // { "SE": 15, "DE": 10, "PL": 5 }
  destinationCity: string
  destinationCountry: string
  durationDays: number
  useGreenTravel?: boolean
}

interface BudgetOutput {
  travelCosts: {
    [country: string]: {
      participants: number
      distance: number
      distanceBand: string
      costPerParticipant: number
      totalCost: number
      greenBonus?: number
    }
  }
  individualSupport: {
    perDiem: number
    days: number
    participants: number
    totalCost: number
  }
  organizationalSupport: number
  totalBudget: number
  breakdown: {
    travel: number
    perDiem: number
    organizational: number
  }
}

class BudgetCalculator {
  async calculateBudget(input: BudgetInput): Promise<BudgetOutput> {
    const distanceCalc = new DistanceCalculator()

    // 1. Calculate travel costs for each origin country
    const travelCosts: BudgetOutput['travelCosts'] = {}
    let totalTravel = 0

    for (const [country, count] of Object.entries(input.participantsByCountry)) {
      // Get capital city coordinates
      const origin = await distanceCalc.geocode(this.getCapital(country), country)
      const destination = await distanceCalc.geocode(input.destinationCity, input.destinationCountry)

      // Calculate distance
      const distance = distanceCalc.calculateDistance(origin, destination)
      const { band, amount } = distanceCalc.getDistanceBand(distance)

      // Add green travel bonus if applicable
      let greenBonus = 0
      if (input.useGreenTravel && distance <= 500) {
        greenBonus = GREEN_TRAVEL_BONUS[band] || 0
      }

      const costPerParticipant = amount + greenBonus
      const totalCost = costPerParticipant * count

      travelCosts[country] = {
        participants: count,
        distance: Math.round(distance),
        distanceBand: band,
        costPerParticipant,
        totalCost,
        greenBonus: greenBonus > 0 ? greenBonus : undefined
      }

      totalTravel += totalCost
    }

    // 2. Calculate individual support (per diem)
    const totalParticipants = Object.values(input.participantsByCountry)
      .reduce((sum, count) => sum + count, 0)

    const perDiem = PER_DIEM_RATES[input.destinationCountry] || 50
    const perDiemTotal = perDiem * input.durationDays * totalParticipants

    // 3. Calculate organizational support
    let orgSupport = ORGANIZATIONAL_SUPPORT.small
    if (totalParticipants > 30) orgSupport = ORGANIZATIONAL_SUPPORT.large
    else if (totalParticipants > 10) orgSupport = ORGANIZATIONAL_SUPPORT.medium

    // 4. Total budget
    const totalBudget = totalTravel + perDiemTotal + orgSupport

    return {
      travelCosts,
      individualSupport: {
        perDiem,
        days: input.durationDays,
        participants: totalParticipants,
        totalCost: perDiemTotal
      },
      organizationalSupport: orgSupport,
      totalBudget,
      breakdown: {
        travel: totalTravel,
        perDiem: perDiemTotal,
        organizational: orgSupport
      }
    }
  }

  private getCapital(countryCode: string): string {
    const capitals = {
      'SE': 'Stockholm', 'DE': 'Berlin', 'PL': 'Warsaw',
      'ES': 'Madrid', 'FR': 'Paris', 'IT': 'Rome',
      // ... full list
    }
    return capitals[countryCode] || 'Unknown'
  }
}
```

### User Interface

**Budget Calculator Panel:**

```
┌─────────────────────────────────────────────────┐
│  PROJECT BUDGET CALCULATOR                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  Destination: Barcelona, Spain                  │
│  Duration: 7 days                               │
│                                                 │
│  Participants by Country:                       │
│  ┌─────────────────────────────────────────┐   │
│  │ Sweden (SE)      [15] participants      │   │
│  │ Germany (DE)     [10] participants      │   │
│  │ Poland (PL)      [5] participants       │   │
│  │                                         │   │
│  │ [+ Add Country]                         │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [ ] Use green travel (distances < 500km)      │
│                                                 │
│  [Calculate Budget]                             │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Budget Results Display:**

```
┌─────────────────────────────────────────────────┐
│  CALCULATED BUDGET                              │
├─────────────────────────────────────────────────┤
│                                                 │
│  TRAVEL COSTS                                   │
│  ┌─────────────────────────────────────────┐   │
│  │ Sweden (15 participants)                │   │
│  │ Distance: 2,276 km (2000-2999 km band)  │   │
│  │ €360 × 15 = €5,400                      │   │
│  ├─────────────────────────────────────────┤   │
│  │ Germany (10 participants)               │   │
│  │ Distance: 1,503 km (500-1999 km band)   │   │
│  │ €275 × 10 = €2,750                      │   │
│  ├─────────────────────────────────────────┤   │
│  │ Poland (5 participants)                 │   │
│  │ Distance: 1,868 km (500-1999 km band)   │   │
│  │ €275 × 5 = €1,375                       │   │
│  └─────────────────────────────────────────┘   │
│  Total Travel: €9,525                           │
│                                                 │
│  INDIVIDUAL SUPPORT (Per Diem)                  │
│  Spain rate: €42/day                            │
│  30 participants × 7 days × €42 = €8,820        │
│                                                 │
│  ORGANIZATIONAL SUPPORT                         │
│  Medium project (11-30 participants): €750      │
│                                                 │
│  ═══════════════════════════════════════════    │
│  TOTAL PROJECT BUDGET: €19,095                  │
│  ═══════════════════════════════════════════    │
│                                                 │
│  [Save to Project]  [Recalculate]               │
│                                                 │
└─────────────────────────────────────────────────┘
```

**API Endpoint:** `POST /projects/:id/calculate-budget`

**Request:**
```json
{
  "participantsByCountry": { "SE": 15, "DE": 10, "PL": 5 },
  "destinationCity": "Barcelona",
  "destinationCountry": "ES",
  "durationDays": 7,
  "useGreenTravel": false
}
```

**Response:**
```json
{
  "travelCosts": {
    "SE": {
      "participants": 15,
      "distance": 2276,
      "distanceBand": "2000-2999 km",
      "costPerParticipant": 360,
      "totalCost": 5400
    },
    "DE": { "participants": 10, "distance": 1503, "distanceBand": "500-1999 km", "costPerParticipant": 275, "totalCost": 2750 },
    "PL": { "participants": 5, "distance": 1868, "distanceBand": "500-1999 km", "costPerParticipant": 275, "totalCost": 1375 }
  },
  "individualSupport": {
    "perDiem": 42,
    "days": 7,
    "participants": 30,
    "totalCost": 8820
  },
  "organizationalSupport": 750,
  "totalBudget": 19095,
  "breakdown": {
    "travel": 9525,
    "perDiem": 8820,
    "organizational": 750
  }
}
```

---

## 6. VENDOR RESEARCH: AI-Powered Agent Workflow

### Three-Step Agent Pattern

**Step 1: Agent Searches**
**Step 2: AI Analyzes (Pros/Cons)**
**Step 3: User Selects → Quotes Generated**

This pattern applies to: **Accommodation**, **Travel**, **Food**

---

### A. Accommodation Agent

#### Step 1: Search

**User Action:** Phase Detail page → Click "Find Accommodation"

**Agent Actions:**
1. Extract context from project/phase:
   - Location: Barcelona
   - Check-in: 2026-03-15
   - Check-out: 2026-03-22
   - Guests: 30
   - Budget per night: €50-100/person

2. Scrape hotel booking sites:
   - Booking.com
   - Hotels.com
   - (Future: Airbnb, Hostelworld)

3. Filter and rank:
   - Capacity >= 30 guests
   - Price within budget
   - Rating >= 7.0
   - Group-friendly amenities

#### Step 2: AI Analysis

For each hotel, AI generates:

```
PROS:
- Excellent location (500m from conference center)
- Great value at €75/night per person
- High rating (8.9/10) with 1,200+ reviews
- Group amenities: conference room, shared kitchen, WiFi

CONS:
- No breakfast included (add €12/person/day)
- 15-minute walk to public transport
- Some rooms may need to be shared (twin beds)

VERDICT: Highly suitable for budget-conscious youth groups.
Location and facilities excellent, but factor in breakfast costs.
```

**AI Implementation:**
```typescript
async generateProsConsAnalysis(hotel: HotelData, context: PhaseContext) {
  const prompt = `
    Analyze this accommodation for Erasmus+ youth exchange:

    HOTEL:
    - Name: ${hotel.name}
    - Price: €${hotel.pricePerNight}/night
    - Rating: ${hotel.rating}/10 (${hotel.reviewCount} reviews)
    - Location: ${hotel.address}
    - Amenities: ${hotel.amenities.join(', ')}
    - Capacity: ${hotel.capacity || 'Unknown'}

    PROJECT:
    - Participants: ${context.participants}
    - Budget per night: €${context.budgetPerNight}
    - Duration: ${context.nights} nights
    - Requirements: Group-friendly, accessible location

    Provide:
    1. PROS: 3-4 specific advantages relevant to youth groups
    2. CONS: 2-3 limitations or concerns
    3. VERDICT: One-sentence recommendation with key consideration

    Be honest, practical, and budget-conscious.
  `

  const response = await this.llm.invoke(prompt)
  return this.parseProsConsVerdict(response)
}
```

#### Step 3: User Selection & Quote Request

**UI: Accommodation Gallery**

```
┌─────────────────────────────────────────────────┐
│  ACCOMMODATION OPTIONS (Barcelona)              │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ [ ]  Hotel Barcelona Gracia             │   │
│  │      ⭐ 8.9/10 (1,234 reviews)           │   │
│  │                                         │   │
│  │  [Photo Gallery: 3 images]             │   │
│  │                                         │   │
│  │  €75/night per person                  │   │
│  │  Total: €2,250/night for 30 guests     │   │
│  │                                         │   │
│  │  AI ANALYSIS ▼                          │   │
│  │  ┌─────────────────────────────────┐   │   │
│  │  │ PROS:                           │   │
│  │  │ • Excellent central location    │   │
│  │  │ • Great value for budget        │   │
│  │  │ • High ratings + many reviews   │   │
│  │  │ • Group amenities available     │   │
│  │  │                                 │   │
│  │  │ CONS:                           │   │
│  │  │ • No breakfast included         │   │
│  │  │ • 15-min walk to metro          │   │
│  │  │ • Some room sharing required    │   │
│  │  │                                 │   │
│  │  │ VERDICT:                        │   │
│  │  │ Highly suitable for budget      │   │
│  │  │ youth groups. Factor in         │   │
│  │  │ breakfast costs (+€12/day).     │   │
│  │  └─────────────────────────────────┘   │   │
│  │                                         │   │
│  │  [View on Booking.com]                  │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ [ ]  Hostel BCN Ramblas                 │   │
│  │      ⭐ 8.2/10 (892 reviews)             │   │
│  │      €45/night per person               │   │
│  │      ... (similar layout)               │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [Show 5 more options]                          │
│                                                 │
│  [✓] 2 selected                                 │
│  [Request Quotes from Selected]                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

**User Flow:**
1. Review options with AI pros/cons
2. Check 1-3 favorites
3. Click "Request Quotes from Selected"
4. System generates draft emails
5. User reviews emails
6. User sends emails (via system or manually)

**Quote Email Generation:**

```typescript
async generateQuoteEmails(
  selectedHotels: Hotel[],
  context: PhaseContext
): Promise<EmailDraft[]> {
  return Promise.all(
    selectedHotels.map(hotel =>
      this.emailAgent.composeQuoteRequest({
        vendorName: hotel.name,
        vendorEmail: hotel.contactEmail,
        vendorPhone: hotel.phone,
        projectName: context.project.name,
        projectType: 'Erasmus+ Youth Exchange',
        dates: {
          checkIn: context.phase.startDate,
          checkOut: context.phase.endDate
        },
        participants: context.participants,
        requirements: [
          'Group booking discount',
          'Breakfast included (if possible)',
          'Conference/meeting room access',
          'Free WiFi',
          'Flexible check-in/out for groups'
        ],
        budget: {
          min: context.budgetMin,
          max: context.budgetMax
        },
        contactPerson: context.user.name,
        contactEmail: context.user.email,
        deadline: this.calculateDeadline(7) // 7 days from now
      })
    )
  )
}
```

**Email Template:**
```
Subject: Quote Request - Group Booking for Erasmus+ Youth Exchange

Dear [Hotel Name] Team,

I am writing on behalf of Open Horizon, a Swedish non-profit
organization coordinating Erasmus+ youth mobility projects.

We are organizing a youth exchange titled "[Project Name]" and
would like to request a group booking quote for accommodation.

PROJECT DETAILS:
- Dates: [Check-in] to [Check-out] ([X] nights)
- Participants: [30] young people (ages 16-25)
- Origin countries: Sweden, Germany, Poland

ACCOMMODATION REQUIREMENTS:
- [30] beds total (twin/triple rooms acceptable)
- Breakfast included (if possible)
- Meeting/conference room for workshops
- Free WiFi for all participants
- Group-friendly common areas

BUDGET:
- Target: €[50-100] per person per night
- Total budget: €[X,XXX] for entire stay

We would appreciate:
1. Your best group rate
2. Detailed breakdown (accommodation, meals, facilities)
3. Cancellation policy and payment terms
4. Any additional services you can offer

Please send your quote by [Deadline Date].

Thank you for your consideration. I look forward to hearing from you.

Best regards,
[User Name]
[Title], Open Horizon
Email: [email]
Phone: [phone]
```

---

### B. Travel Agent

#### Step 1: Search

**User Action:** Phase Detail page → Click "Find Travel Options"

**Agent Actions:**
1. Determine routes:
   - Stockholm → Barcelona
   - Berlin → Barcelona
   - Warsaw → Barcelona

2. Scrape flight data:
   - Google Flights (via Playwright)
   - Skyscanner (via Playwright)
   - Extract: airlines, prices, duration, connections

3. Search group travel agencies:
   - Google: "group travel Sweden Barcelona"
   - Extract agencies specializing in youth/student groups

#### Step 2: AI Analysis

**For Flights:**
```
PROS:
- Direct flight (no connections)
- Good timing (arrive morning, depart evening)
- Reasonable price €180/person
- Major airline (SAS) with baggage included

CONS:
- Limited flexibility for 30 passengers (book early)
- No group discount advertised
- Peak season pricing

GROUP SUITABILITY: 8/10
Best option for Swedish participants. Book at least 60 days
in advance for group availability.
```

**For Travel Agencies:**
```
AGENCY: Nordic Youth Travel
- Specializes in Erasmus+ group bookings
- Handles visa coordination
- Negotiates group discounts with airlines
- Full payment flexibility

PROS:
- Expert in youth group travel
- One point of contact
- Handles complications
- Often better rates than individual booking

CONS:
- Service fee (typically 10-15%)
- Less control over exact flights
- Requires advance booking (90+ days)

VERDICT: Worth requesting quote for comparison, especially
if this is your first time coordinating multi-country travel.
```

#### Step 3: User Selection & Quote Request

**UI: Travel Options**

```
┌─────────────────────────────────────────────────┐
│  TRAVEL OPTIONS                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│  ROUTE: Stockholm → Barcelona                   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ [ ]  SAS Direct Flight                  │   │
│  │      €180/person                        │   │
│  │      Depart: 08:30  Arrive: 11:45       │   │
│  │      Duration: 3h 15m  Direct           │   │
│  │                                         │   │
│  │  AI ANALYSIS ▼                          │   │
│  │  PROS: Direct, good timing, includes    │   │
│  │        baggage, reliable airline        │   │
│  │  CONS: Limited group seats, peak        │   │
│  │        pricing, no group discount       │   │
│  │  SUITABILITY: 8/10 - Book 60+ days     │   │
│  │               early for availability    │   │
│  │                                         │   │
│  │  [View on Google Flights]               │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ [ ]  Ryanair via Copenhagen             │   │
│  │      €95/person                         │   │
│  │      Duration: 5h 30m  1 stop           │   │
│  │      ... (similar layout)               │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  GROUP TRAVEL AGENCIES                          │
│                                                 │
│  ┌─────────────────────────────────────────┐   │
│  │ [ ]  Nordic Youth Travel AB             │   │
│  │      Specialist in Erasmus+ groups      │   │
│  │                                         │   │
│  │  AI ANALYSIS ▼                          │   │
│  │  Handles all 3 countries, group         │   │
│  │  discounts, visa coordination.          │   │
│  │  Fee: 10-15% but often saves more.      │   │
│  │  VERDICT: Recommended for first-time    │   │
│  │           coordinators.                 │   │
│  │                                         │   │
│  │  [Visit Website]                        │   │
│  └─────────────────────────────────────────┘   │
│                                                 │
│  [✓] 3 selected (1 flight, 2 agencies)          │
│  [Request Quotes from Selected]                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

### C. Food Agent

#### Step 1: Search

**User Action:** Phase Detail page → Click "Find Catering Options"

**Agent Actions:**
1. Search local caterers:
   - Google Maps API: "catering Barcelona"
   - Filter: handles groups 30+, within delivery radius

2. Search restaurants with group services:
   - Google Maps: "group dining Barcelona"
   - TripAdvisor: group-friendly restaurants

3. Extract data:
   - Name, address, contact
   - Cuisine type
   - Reviews/ratings
   - Menu links (if available)

#### Step 2: AI Analysis

```
CATERER: Barcelona Catering Co.
Cuisine: Mediterranean, Vegetarian-friendly

PROS:
- Extensive experience with youth groups
- Flexible menus (€15-25/person)
- Handles dietary restrictions (vegan, halal, allergies)
- Delivers to venues city-wide
- Buffet style (self-service, casual)

CONS:
- Requires 48h advance notice for orders
- Minimum order: 20 people (not an issue)
- No on-site staff (drop-off only)

VERDICT: Solid choice for informal group meals. Budget-friendly
and flexible. Confirm delivery timing for your venue.
```

#### Step 3: User Selection & Quote Request

Similar UI pattern as accommodation/travel.

---

## 7. COMMUNICATION TRACKING

### Communication Lifecycle

```
DRAFT → SENT → DELIVERED → OPENED → RESPONDED → QUOTE RECEIVED
```

**Database Schema:**
```prisma
model Communication {
  id          String   @id @default(uuid())
  type        CommunicationType // QUOTE_REQUEST, FOLLOW_UP, ACCEPTANCE, REJECTION
  direction   Direction // OUTBOUND, INBOUND
  status      CommunicationStatus

  subject     String
  body        String

  sentAt      DateTime?
  deliveredAt DateTime?
  openedAt    DateTime?
  respondedAt DateTime?

  vendor      Vendor   @relation(fields: [vendorId], references: [id])
  phase       Phase    @relation(fields: [phaseId], references: [id])
  quote       Quote?   @relation(fields: [quoteId], references: [id])

  metadata    Json?    // Email headers, tracking pixels, etc.
}
```

### Email Sending Options

**Option 1: System Sends (Recommended)**
- User reviews drafts in UI
- Clicks "Send All" or "Send Selected"
- Backend sends via SendGrid
- Automatically logs to communications table
- Tracks delivery/open events via webhook

**Option 2: Manual Send (Fallback)**
- User copies email text
- Sends from their own email client
- Manually marks as "Sent" in system
- No automatic tracking

**SendGrid Integration:**
```typescript
class EmailService {
  async sendQuoteRequest(communication: Communication): Promise<void> {
    const msg = {
      to: communication.vendor.email,
      from: {
        email: 'projects@openhorizon.cc',
        name: this.user.name
      },
      replyTo: this.user.email,
      subject: communication.subject,
      text: communication.body,
      html: this.renderEmailTemplate(communication),
      trackingSettings: {
        clickTracking: { enable: true },
        openTracking: { enable: true }
      },
      customArgs: {
        communicationId: communication.id,
        phaseId: communication.phaseId,
        vendorId: communication.vendorId
      }
    }

    await sgMail.send(msg)

    await prisma.communication.update({
      where: { id: communication.id },
      data: {
        status: 'SENT',
        sentAt: new Date()
      }
    })
  }

  // Webhook handler for delivery/open events
  async handleSendGridWebhook(event: SendGridEvent): Promise<void> {
    const { communicationId } = event.customArgs

    switch (event.event) {
      case 'delivered':
        await this.updateStatus(communicationId, 'DELIVERED', { deliveredAt: event.timestamp })
        break
      case 'open':
        await this.updateStatus(communicationId, 'OPENED', { openedAt: event.timestamp })
        break
    }
  }
}
```

### Follow-Up System

**Automatic Reminders:**
- Day 3: No response → Suggest follow-up
- Day 7: Still no response → Draft follow-up email
- Day 10: Final reminder option

**Follow-Up Email Template:**
```
Subject: Following up - Quote request for [Project Name]

Dear [Vendor Name],

I hope this message finds you well. I am following up on
my quote request sent on [Date] for our Erasmus+ youth
exchange project.

We are finalizing accommodation arrangements and would
appreciate your response by [New Deadline].

If you need any additional information, please don't
hesitate to reach out.

Thank you for your time.

Best regards,
[Name]
```

---

## 8. APPLICATION FORM GENERATION

### Form Types

**KA1 (Youth Mobility):**
- Youth exchanges
- Youth participation activities
- Youth worker mobility

**KA2 (Cooperation Partnerships):**
- Strategic partnerships
- Capacity building

### Data Aggregation

Application forms pull from:
- **Project**: Name, objectives, target group, timeline
- **Phases**: Detailed activity descriptions
- **Budget**: Complete breakdown (from calculator)
- **Participants**: Count by country, demographics
- **Vendors**: Confirmed accommodation, travel, food arrangements
- **Learning Patterns**: Similar past projects (if available)

### AI Narrative Generation

**FormNarrativeAgent** generates:
1. **Project Description** (200-300 words)
2. **Objectives** (3-5 bullet points with explanations)
3. **Methodology** (300-400 words)
4. **Expected Impact** (200-250 words)
5. **Dissemination Plan** (150-200 words)

**Implementation:**
```typescript
class FormNarrativeAgent extends BaseAgent {
  async generateNarrative(
    section: 'description' | 'objectives' | 'methodology' | 'impact' | 'dissemination',
    project: Project,
    context: ApplicationContext
  ): Promise<string> {
    const prompt = this.buildNarrativePrompt(section, project, context)
    const response = await this.llm.invoke(prompt)
    return this.formatForErasmus(response)
  }

  private buildNarrativePrompt(section: string, project: Project, context: ApplicationContext): string {
    const baseContext = `
      Project: ${project.name}
      Type: ${project.type}
      Target Group: ${project.targetGroup}
      Duration: ${project.durationDays} days
      Participants: ${project.participantsCount} from ${Object.keys(project.participantsByCountry).length} countries
      Main Activities: ${context.activities.join(', ')}
    `

    const sectionPrompts = {
      description: `
        Write a compelling project description for an Erasmus+ KA1 application.
        Explain WHAT the project is, WHO it involves, and WHY it matters.

        Requirements:
        - 200-300 words
        - Formal EU grant language
        - Highlight European added value
        - Mention non-formal education approach
        - Clear and concise

        ${baseContext}
      `,
      objectives: `
        List 3-5 specific, measurable objectives for this project.
        Each objective should:
        - Start with an action verb (Develop, Enhance, Foster, etc.)
        - Be achievable within the project timeframe
        - Relate to youth development and European citizenship
        - Include expected outcomes

        Format as bullet points with 2-3 sentences per objective.

        ${baseContext}
      `,
      // ... (similar for methodology, impact, dissemination)
    }

    return sectionPrompts[section]
  }
}
```

### Form Templates

**KA1 Structure:**
```typescript
interface KA1FormData {
  // Section 1: Project Overview
  projectTitle: string
  projectAcronym?: string
  summary: string

  // Section 2: Participating Organizations
  coordinator: Organization
  partners: Organization[]

  // Section 3: Project Description
  context: string // Background and needs analysis
  objectives: string[]
  methodology: string
  targetGroup: TargetGroup

  // Section 4: Activities
  activities: Activity[]
  timeline: GanttTimeline

  // Section 5: Budget
  travelCosts: TravelBreakdown
  individualSupport: IndividualSupportBreakdown
  organizationalSupport: number
  totalBudget: number

  // Section 6: Impact
  expectedImpact: string
  disseminationPlan: string
  sustainability: string

  // Section 7: Annexes
  supportLetters?: File[]
  participantList?: File[]
}
```

### Export Formats

**PDF Export (via Playwright):**
```typescript
async exportToPDF(form: ApplicationForm): Promise<Buffer> {
  const html = this.renderFormHTML(form)

  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.setContent(html)

  const pdf = await page.pdf({
    format: 'A4',
    margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
    printBackground: true
  })

  await browser.close()
  return pdf
}
```

**DOCX Export (via docx library):**
```typescript
async exportToWord(form: ApplicationForm): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: 720, right: 720, bottom: 720, left: 720 }
        }
      },
      children: [
        new Paragraph({
          text: form.projectTitle,
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({
          text: 'Project Summary',
          heading: HeadingLevel.HEADING_2
        }),
        new Paragraph({ text: form.summary }),
        // ... (build full document structure)
      ]
    }]
  })

  return await Packer.toBuffer(doc)
}
```

---

## 9. PROJECT EXPORT & REPORTING

### Export Options

1. **Project Summary Report (PDF)**
   - Executive summary
   - Timeline (Gantt chart image)
   - Budget breakdown
   - Confirmed vendors
   - Participant list

2. **Budget Spreadsheet (Excel)**
   - Detailed cost breakdown
   - Travel costs by country
   - Per diem calculations
   - Vendor quotes comparison
   - Payment schedule

3. **Complete Project Package (ZIP)**
   - All above formats
   - Application forms (PDF + DOCX)
   - Vendor communications log
   - Signed quotes
   - Support letters

### Implementation

```typescript
class ProjectExportService {
  async exportProject(
    projectId: string,
    format: 'pdf' | 'excel' | 'word' | 'zip'
  ): Promise<Buffer> {
    const project = await this.loadFullProject(projectId)

    switch (format) {
      case 'pdf':
        return this.generatePDFReport(project)
      case 'excel':
        return this.generateExcelBudget(project)
      case 'word':
        return this.generateWordReport(project)
      case 'zip':
        return this.generateCompletePackage(project)
    }
  }

  private async generatePDFReport(project: Project): Promise<Buffer> {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            /* Professional PDF styling */
            body { font-family: Arial, sans-serif; }
            h1 { color: #1e40af; }
            .budget-table { width: 100%; border-collapse: collapse; }
            .budget-table td, .budget-table th { border: 1px solid #ddd; padding: 8px; }
          </style>
        </head>
        <body>
          <h1>${project.name}</h1>
          <h2>Project Summary</h2>
          <p>${project.description}</p>

          <h2>Timeline</h2>
          <img src="${await this.renderGanttChart(project)}" />

          <h2>Budget Breakdown</h2>
          <table class="budget-table">
            <tr><th>Category</th><th>Amount</th></tr>
            <tr><td>Travel</td><td>€${project.budget.travel}</td></tr>
            <tr><td>Per Diem</td><td>€${project.budget.perDiem}</td></tr>
            <tr><td>Organizational</td><td>€${project.budget.organizational}</td></tr>
            <tr><th>Total</th><th>€${project.budget.total}</th></tr>
          </table>

          <h2>Confirmed Vendors</h2>
          ${this.renderVendorList(project.acceptedQuotes)}
        </body>
      </html>
    `

    return this.htmlToPDF(html)
  }

  private async generateExcelBudget(project: Project): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Budget Breakdown')

    // Headers
    sheet.columns = [
      { header: 'Category', key: 'category', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Unit Cost', key: 'unitCost', width: 15 },
      { header: 'Total', key: 'total', width: 15 }
    ]

    // Travel costs
    sheet.addRow({ category: 'TRAVEL COSTS', description: '', quantity: '', unitCost: '', total: '' })
    for (const [country, data] of Object.entries(project.budget.travelCosts)) {
      sheet.addRow({
        category: `  ${country}`,
        description: `${data.distance} km (${data.distanceBand})`,
        quantity: data.participants,
        unitCost: `€${data.costPerParticipant}`,
        total: `€${data.totalCost}`
      })
    }

    // Per diem
    sheet.addRow({ category: 'INDIVIDUAL SUPPORT', description: '', quantity: '', unitCost: '', total: '' })
    sheet.addRow({
      category: '  Per Diem',
      description: `${project.budget.individualSupport.days} days × ${project.budget.individualSupport.participants} participants`,
      quantity: project.budget.individualSupport.participants,
      unitCost: `€${project.budget.individualSupport.perDiem}/day`,
      total: `€${project.budget.individualSupport.totalCost}`
    })

    // Total
    sheet.addRow({ category: '', description: '', quantity: '', unitCost: '', total: '' })
    sheet.addRow({
      category: 'TOTAL PROJECT BUDGET',
      description: '',
      quantity: '',
      unitCost: '',
      total: `€${project.budget.totalBudget}`
    })

    return workbook.xlsx.writeBuffer()
  }
}
```

---

## Phase 1: February Deadline (4 Weeks)

### Week 1: Budget Calculator (Jan 13-19)

**Goal:** Auto-calculate budget from project parameters

**Tasks:**
1. Implement Distance Calculator
   - Haversine formula for distance calculation
   - Mapbox geocoding integration
   - Distance band mapping
2. Implement Budget Calculator
   - Travel costs by country
   - Per diem calculation
   - Organizational support
3. Build Budget UI
   - Input form (participants by country, dates, destination)
   - Results display with breakdown
   - Save to project
4. API endpoints
   - POST `/projects/:id/calculate-budget`
   - GET `/projects/:id/budget`
5. Test with sample project
   - 30 participants from 3 countries
   - 7-day exchange in Barcelona
   - Verify calculations match Erasmus+ rules

**Deliverable:** Working budget calculator that matches official EU results

**Acceptance Criteria:**
- ✅ Distance calculations within 1% of EU calculator
- ✅ Budget breakdown matches Erasmus+ 2024-2027 unit costs
- ✅ UI clearly shows travel, per diem, organizational breakdown
- ✅ Saves to project and pre-fills phase budgets

---

### Week 2: Accommodation Agent (Jan 20-26)

**Goal:** Complete accommodation workflow with AI analysis

**Tasks:**
1. Enhance AccommodationAgent
   - Verify Booking.com/Hotels.com scraping works
   - Add AI pros/cons generation
   - Implement ranking algorithm
2. Build Accommodation UI
   - Gallery view with photos
   - Expandable AI analysis cards
   - Selection checkboxes
   - Quote request button
3. Integrate EmailAgent
   - Generate quote emails for selected hotels
   - User review interface
   - Send via SendGrid or manual copy
4. Communication tracking
   - Log sent emails
   - Track status (sent → delivered → opened)
5. Test with real location
   - Search Barcelona hotels
   - Review AI analysis quality
   - Generate and send 2 real quote requests

**Deliverable:** Fully functional accommodation research and quote system

**Acceptance Criteria:**
- ✅ Scrapes 10+ hotels with accurate data
- ✅ AI generates relevant pros/cons for each
- ✅ User can select and request quotes
- ✅ Emails are professional and complete
- ✅ Communication tracked in database

---

### Week 3: Travel & Food Agents (Jan 27 - Feb 2)

**Goal:** Same workflow for travel and food

**Tasks:**

**TravelAgent (3 days):**
1. Implement flight scraping (Google Flights, Skyscanner)
2. Search group travel agencies (Google)
3. AI analysis for flights and agencies
4. UI similar to accommodation
5. Quote email generation

**FoodAgent (2 days):**
1. Search caterers (Google Maps API)
2. Search group-friendly restaurants
3. AI analysis for food options
4. UI similar to accommodation/travel
5. Quote email generation

**Integration (2 days):**
1. Test all three agents work together
2. Verify UI consistency
3. Test communication logging
4. Review email quality

**Deliverable:** Travel and food agents with same UX as accommodation

**Acceptance Criteria:**
- ✅ TravelAgent finds flights + agencies with pros/cons
- ✅ FoodAgent finds caterers with pros/cons
- ✅ Quote emails generated correctly
- ✅ All communications tracked
- ✅ Consistent UX across all agent types

---

### Week 4: Integration & Real Project Test (Feb 3-9)

**Goal:** Validate complete workflow with real project

**Tasks:**
1. Create test project from seed
   - Generate seed for Barcelona youth exchange
   - Convert to project
   - Auto-generate phases
2. Test budget calculation
   - Input participants from Sweden, Germany, Poland
   - Calculate budget
   - Verify accuracy
3. Test all agents
   - Accommodation: Find + analyze + quote
   - Travel: Find + analyze + quote
   - Food: Find + analyze + quote
4. Track communications
   - Review all generated emails
   - Send to 2-3 real vendors (if willing)
   - Verify tracking works
5. Documentation
   - User guide for February applications
   - Known issues list
   - Workarounds for any bugs
6. Bug fixes
   - Address any issues found
   - Optimize slow operations
   - Improve AI prompts if needed

**Deliverable:** Production-ready system for February applications

**Acceptance Criteria:**
- ✅ Complete seed → budget → vendors → quotes workflow works
- ✅ All 3 agent types functional
- ✅ Budget calculation accurate
- ✅ Communications tracked properly
- ✅ User can complete 1 project in 4-6 hours (vs 40-60 manual)
- ✅ System stable enough for real use

---

## Phase 2: Intelligence Layer (March-April)

**After February deadline, add:**

### A. SALTO-Youth Partner Matching (2 weeks)

**Goal:** RAG-powered partner recommendations

**Tasks:**
1. Scrape SALTO-Youth database
   - 13,900+ organizations
   - 10,545+ projects
   - Store in vector database (ChromaDB)
2. Build PartnerAgent
   - Semantic search over organizations
   - Filter by country, experience, project type
   - AI analysis of compatibility
3. UI integration
   - New phase type: PARTNER_FINDING
   - Partner search interface
   - Save potential partners
4. Communication integration
   - Generate partnership inquiry emails
   - Track responses

**Deliverable:** AI-powered partner matching

---

### B. Application Examples RAG (2 weeks)

**Goal:** Learn from successful applications

**Tasks:**
1. Download Erasmus+ project database
   - Successful KA1/KA2 applications
   - Extract narrative sections
   - Store in vector database
2. Enhance FormNarrativeAgent
   - RAG lookup for similar projects
   - Use examples as inspiration
   - Improve narrative quality
3. Test with real applications
   - Compare AI-generated vs manual
   - Improve prompts based on feedback

**Deliverable:** Better application narratives based on successful examples

---

### C. Learning System Enhancement (2 weeks)

**Goal:** System learns from each completed project

**Tasks:**
1. Pattern extraction improvements
   - Better vendor preference learning
   - Timeline prediction accuracy
   - Budget allocation patterns
2. Auto-population refinement
   - Use learned patterns to pre-fill phases
   - Suggest vendors based on past success
   - Predict realistic timelines
3. Recommendation quality
   - A/B test recommendations
   - Measure accuracy over time
   - Improve relevance scoring

**Deliverable:** Smarter system that improves with each project

---

## Technical Implementation

### Technology Stack

**Backend:**
- **Framework:** Fastify (already implemented)
- **Database:** PostgreSQL + Prisma ORM
- **AI Models:**
  - GPT-4-turbo-preview (seed generation, elaboration)
  - Claude 3.5 Sonnet (AI agents, analysis)
- **Scraping:** Playwright (browser automation)
- **Email:** SendGrid (transactional emails)
- **Vector DB:** ChromaDB (Phase 2 - partner/example RAG)
- **Geocoding:** Mapbox (distance calculation)

**Frontend:**
- **Framework:** React + TypeScript + Vite
- **Routing:** React Router
- **State:** TanStack Query + Zustand
- **Styling:** Tailwind CSS
- **Charts:** Frappe Gantt (timeline)
- **Forms:** React Hook Form + Zod

**DevOps:**
- **Containerization:** Docker
- **Hosting:** Google Cloud Run
- **Proxy:** Nginx (frontend)
- **CI/CD:** Cloud Build triggers

---

### Database Schema Extensions

**Add to existing schema:**

```prisma
model Project {
  // ... existing fields

  // NEW: Budget calculation fields
  participantsByCountry Json?    // { "SE": 15, "DE": 10, "PL": 5 }
  destinationCity       String?
  destinationCountry    String?
  durationDays          Int?

  calculatedBudget      Json?    // Complete BudgetOutput structure
  budgetCalculatedAt    DateTime?

  // NEW: Export tracking
  lastExportedAt        DateTime?
  exportFormats         String[]  // ['pdf', 'excel', 'word']
}

model Phase {
  // ... existing fields

  // NEW: Agent results storage
  agentSearchResults    Json?     // Raw scraped data
  agentAnalysis         Json?     // AI pros/cons for each option
  selectedOptions       Json?     // User-selected hotels/flights/caterers

  quoteEmailsDrafts     Json?     // Generated email drafts
  quoteEmailsSent       Boolean @default(false)
}

model Communication {
  // ... existing fields

  // NEW: Enhanced tracking
  deliveryStatus        String?   // delivered, bounced, failed
  openedCount           Int @default(0)
  clickedCount          Int @default(0)

  sendGridEventId       String?
  sendGridMetadata      Json?
}
```

---

### API Endpoints Summary

**New Endpoints for Phase 1:**

```typescript
// Budget Calculator
POST   /projects/:id/calculate-budget
GET    /projects/:id/budget

// Accommodation Agent
POST   /phases/:id/accommodation/search
GET    /phases/:id/accommodation/results
POST   /phases/:id/accommodation/select
POST   /phases/:id/accommodation/generate-quotes

// Travel Agent
POST   /phases/:id/travel/search
GET    /phases/:id/travel/results
POST   /phases/:id/travel/select
POST   /phases/:id/travel/generate-quotes

// Food Agent
POST   /phases/:id/food/search
GET    /phases/:id/food/results
POST   /phases/:id/food/select
POST   /phases/:id/food/generate-quotes

// Communication
POST   /communications/send-quotes
GET    /communications/:id/status
POST   /communications/sendgrid-webhook

// Export
POST   /projects/:id/export
GET    /projects/:id/export/:format
```

---

## Success Metrics

### Phase 1 (February Deadline)

**Primary Metrics:**
- ✅ Complete 3-5 projects by Feb 2026 deadline
- ✅ Reduce planning time from 40-60h to 4-6h per project
- ✅ Generate 90%+ accurate budgets (within €500 of manual calculation)
- ✅ AI agent pros/cons rated "helpful" by user in 80%+ of cases
- ✅ Quote emails require minimal editing (< 5 minutes per email)

**System Performance:**
- Budget calculation: < 10 seconds
- Accommodation search: < 60 seconds (10 hotels with analysis)
- Travel search: < 90 seconds (multiple routes + agencies)
- Food search: < 45 seconds (5-10 caterers)
- Quote generation: < 30 seconds (all selected vendors)

**Quality Metrics:**
- Scraped data accuracy: 95%+ (prices, ratings, amenities)
- AI analysis relevance: 80%+ (pros/cons match user priorities)
- Budget accuracy: 98%+ (matches Erasmus+ calculator)
- Email professionalism: 90%+ ready-to-send without edits

---

### Phase 2 (March-April)

**Additional Metrics:**
- Partner recommendations: 70%+ compatibility rate
- Application narrative quality: Equivalent to manual writing
- Learning system accuracy: Improves 10%+ per completed project
- Time to find partners: < 30 minutes (vs 2-4 hours manual)

---

## Risk Mitigation

### Technical Risks

**Risk 1: Scraping Breaks**
- **Mitigation:** Fallback to manual input, AI generates based on description
- **Backup:** Multiple scraping sources (Booking.com, Hotels.com)
- **Monitor:** Weekly scraping health checks

**Risk 2: AI Generates Low-Quality Analysis**
- **Mitigation:** User feedback loop, improve prompts iteratively
- **Backup:** User can edit or override AI analysis
- **Monitor:** Track edit frequency, improve prompts

**Risk 3: Budget Calculation Errors**
- **Mitigation:** Extensive testing against EU calculator
- **Backup:** User can manually override any field
- **Monitor:** Log all calculations, flag discrepancies

**Risk 4: February Deadline Too Tight**
- **Mitigation:** Focus ruthlessly on Phase 1 scope, skip Phase 2
- **Backup:** Manual workflows still available as fallback
- **Contingency:** Accept imperfect but functional for Feb, improve in March

---

### Operational Risks

**Risk 1: Single User, High Stakes**
- **Impact:** Bugs affect real applications
- **Mitigation:** Extensive testing in Week 4, backup plans for all features
- **Recovery:** User can always fall back to manual workflow

**Risk 2: Vendors Don't Respond to Quotes**
- **Impact:** Delays project planning
- **Mitigation:** Generate follow-up emails automatically, suggest calling
- **Best Practice:** Send quotes 60+ days before project start

---

## Appendix A: Erasmus+ Unit Costs Reference

### Travel Costs (2024-2027)

| Distance Band | Amount per Participant | Green Travel Bonus |
|---------------|------------------------|-------------------|
| 10-99 km | €23 | +€30 |
| 100-499 km | €180 | +€40 |
| 500-1999 km | €275 | - |
| 2000-2999 km | €360 | - |
| 3000-3999 km | €530 | - |
| 4000-7999 km | €820 | - |
| 8000+ km | €1,500 | - |

### Individual Support (Per Diem)

| Country | €/day | Country | €/day | Country | €/day |
|---------|-------|---------|-------|---------|-------|
| Austria (AT) | 58 | Belgium (BE) | 60 | Bulgaria (BG) | 37 |
| Croatia (HR) | 47 | Cyprus (CY) | 50 | Czech Republic (CZ) | 40 |
| Denmark (DK) | 65 | Estonia (EE) | 43 | Finland (FI) | 62 |
| France (FR) | 56 | Germany (DE) | 55 | Greece (GR) | 50 |
| Hungary (HU) | 40 | Iceland (IS) | 65 | Ireland (IE) | 60 |
| Italy (IT) | 53 | Latvia (LV) | 43 | Liechtenstein (LI) | 62 |
| Lithuania (LT) | 43 | Luxembourg (LU) | 60 | Malta (MT) | 50 |
| Netherlands (NL) | 60 | Norway (NO) | 70 | Poland (PL) | 40 |
| Portugal (PT) | 48 | Romania (RO) | 37 | Slovakia (SK) | 40 |
| Slovenia (SI) | 47 | Spain (ES) | 42 | Sweden (SE) | 62 |
| Turkey (TR) | 37 | North Macedonia (MK) | 37 | Serbia (RS) | 37 |

### Organizational Support

| Participants | Amount |
|--------------|--------|
| 1-10 | €500 |
| 11-30 | €750 |
| 31-60 | €1,000 |

---

## Appendix B: Example Budget Calculation

**Project:** Youth Exchange "Digital Nomads: Rural Innovation"

**Parameters:**
- **Participants:** 30 total
  - Sweden: 15
  - Germany: 10
  - Poland: 5
- **Destination:** Barcelona, Spain
- **Duration:** 7 days
- **Green Travel:** No

**Calculation:**

**1. Travel Costs:**
```
Sweden (Stockholm) → Barcelona
Distance: 2,276 km → Band: 2000-2999 km → €360/participant
15 participants × €360 = €5,400

Germany (Berlin) → Barcelona
Distance: 1,503 km → Band: 500-1999 km → €275/participant
10 participants × €275 = €2,750

Poland (Warsaw) → Barcelona
Distance: 1,868 km → Band: 500-1999 km → €275/participant
5 participants × €275 = €1,375

Total Travel: €9,525
```

**2. Individual Support:**
```
Spain per diem: €42/day
30 participants × 7 days × €42 = €8,820
```

**3. Organizational Support:**
```
11-30 participants → €750
```

**4. Total Budget:**
```
Travel:          €9,525
Per Diem:        €8,820
Organizational:  €750
─────────────────────────
TOTAL:          €19,095
```

---

## Conclusion

This PRD defines a complete system for managing Erasmus+ projects from initial ideation through to submitted applications.

**Phase 1 delivers** (4 weeks):
- Automated budget calculation per Erasmus+ rules
- AI-powered vendor research with pros/cons analysis
- Streamlined quote request workflow
- Complete communication tracking

**Phase 2 enhances** (8 weeks post-deadline):
- SALTO-Youth partner matching with RAG
- Application form quality improvement via past examples
- Continuous learning from completed projects

**Target:** Reduce 40-60 hours of manual work to 4-6 hours of AI-assisted planning per project, enabling one coordinator to manage 20+ projects annually with confidence.

---

**Document Version:** 2.0
**Last Updated:** 2026-01-12
**Status:** ✅ Ready for Implementation
**Next Step:** Begin Week 1 development (Budget Calculator)
