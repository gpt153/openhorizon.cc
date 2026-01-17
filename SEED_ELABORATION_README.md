# Conversational Seed Elaboration Agent

**Issue**: #97 - Backend: Conversational Seed Elaboration Agent
**Part of**: #96 - Intelligent Seed Elaboration System (Part 1/4)

## Overview

The Conversational Seed Elaboration Agent is an AI-powered system that progressively gathers project requirements through natural dialogue, extracts structured metadata, validates against Erasmus+ requirements, and calculates completeness scores.

## Features

✅ **Progressive Questioning** - Asks contextual questions based on existing data
✅ **Natural Language Processing** - Extracts structured data from free-form answers using GPT-4o
✅ **Intelligent Suggestions** - Provides defaults when user is uncertain
✅ **Erasmus+ Validation** - Validates inputs against official requirements
✅ **Completeness Tracking** - Calculates 0-100% progress score
✅ **Auto-calculations** - Calculates visa requirements, budgets, etc.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (Part 2)                        │
│  - Displays questions one at a time                         │
│  - Shows progress bar                                       │
│  - Displays structured metadata                             │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP/REST
┌────────────────▼────────────────────────────────────────────┐
│                    API Routes                               │
│  POST /seeds/:id/elaborate/start                            │
│  POST /seeds/:id/elaborate/answer                           │
│  GET  /seeds/:id/elaborate/status                           │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                   Seeds Service                             │
│  - startElaborationSession()                                │
│  - processElaborationAnswer()                               │
│  - getElaborationStatus()                                   │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│            SeedElaborationAgent                             │
│  - Defines question flow (7 progressive questions)          │
│  - Extracts structured data using GPT-4o                    │
│  - Validates against Erasmus+ rules                         │
│  - Calculates completeness scores                           │
│  - Suggests intelligent defaults                            │
└────────────────┬────────────────────────────────────────────┘
                 │
┌────────────────▼────────────────────────────────────────────┐
│                   Database (Prisma)                         │
│  Seed model                                                 │
│  SeedElaboration model (stores metadata as JSON)            │
└─────────────────────────────────────────────────────────────┘
```

## Question Flow

The agent asks 7 progressive questions:

1. **Participant Count** *(Required, Weight: 20%)*
   - Validates: 16-60 participants (Erasmus+ requirement)
   - Suggests: Optimal range based on project type

2. **Budget Estimate** *(Required, Weight: 15%)*
   - Validates: €200-700 per participant typical
   - Suggests: Based on duration and participant count
   - Auto-calculates: Total budget or per-person budget

3. **Duration** *(Required, Weight: 15%)*
   - Validates: 5-21 days typical for youth exchanges
   - Suggests: Based on seed description
   - Parses: Days, weeks, various formats

4. **Destination** *(Required, Weight: 15%)*
   - Validates: Valid country and city
   - Extracts: Country (ISO code), city, venue, accessibility
   - Auto-calculates: Visa requirements (with participant countries)

5. **Participant Countries** *(Required, Weight: 10%)*
   - Validates: At least one country
   - Extracts: Country names → ISO codes
   - Auto-calculates: Visa requirements for each country

6. **Activities/Theme** *(Optional, Weight: 15%)*
   - Extracts: Activity names, durations, learning outcomes
   - Structures: Free-form descriptions into activity list

7. **EU Priorities** *(Optional, Weight: 10%)*
   - Suggests: Based on seed description analysis
   - Maps: Natural language → official EU priority categories
   - Categories: Inclusion, Green, Digital, Participation

**Smart Features:**
- Skips questions where data already exists
- Provides intelligent defaults when user uncertain
- Validates in real-time
- Recalculates completeness after each answer

## API Endpoints

### 1. Start Elaboration Session

**Endpoint:** `POST /api/seeds/:id/elaborate/start`

**Description:** Initialize a conversational elaboration session and get the first question.

**Authentication:** Required (JWT token)

**Request:**
```http
POST /api/seeds/clxx1234/elaborate/start
Authorization: Bearer {token}
```

**Response:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "question": "How many participants are you planning for this exchange?\n\nErasmus+ Youth Exchanges typically range from 16 to 60 participants.",
  "suggestions": [
    "Consider 28 participants as a good starting point."
  ],
  "metadata": {
    "completeness": 0,
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "currentQuestionIndex": 0,
    "estimatedParticipants": 28,
    "duration": 7
  }
}
```

---

### 2. Submit Answer and Get Next Question

**Endpoint:** `POST /api/seeds/:id/elaborate/answer`

**Description:** Submit user's answer to current question and receive the next question.

**Authentication:** Required (JWT token)

**Request:**
```http
POST /api/seeds/clxx1234/elaborate/answer
Authorization: Bearer {token}
Content-Type: application/json

{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000",
  "answer": "We are planning for about 30 young people"
}
```

**Response:**
```json
{
  "nextQuestion": "What's your estimated budget per participant? (Or total budget if you prefer)\n\nTypical Erasmus+ Youth Exchanges range from €300-500 per participant, depending on duration and destination.",
  "metadata": {
    "participantCount": 30,
    "completeness": 20,
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "currentQuestionIndex": 1,
    "missingFields": ["budgetPerParticipant", "duration", "destination", "participantCountries"]
  },
  "complete": false,
  "suggestions": [
    "Based on 7 days and 30 participants, consider €400 per participant (Total: €12000)."
  ]
}
```

**When Complete:**
```json
{
  "metadata": {
    "participantCount": 30,
    "budgetPerParticipant": 400,
    "totalBudget": 12000,
    "duration": 7,
    "destination": {
      "country": "ES",
      "city": "Barcelona",
      "venue": "Youth center in Gràcia"
    },
    "participantCountries": ["DE", "FR", "IT"],
    "requirements": {
      "visas": [
        { "country": "DE", "needed": false },
        { "country": "FR", "needed": false },
        { "country": "IT", "needed": false }
      ],
      "insurance": true,
      "permits": []
    },
    "activities": [
      {
        "name": "Digital Skills Workshop",
        "duration": "2 days",
        "learningOutcomes": ["Digital literacy", "Technology skills"]
      }
    ],
    "erasmusPriorities": ["Digital transformation", "Inclusion and diversity"],
    "completeness": 100,
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "currentQuestionIndex": 7,
    "missingFields": []
  },
  "complete": true
}
```

---

### 3. Get Elaboration Status

**Endpoint:** `GET /api/seeds/:id/elaborate/status`

**Description:** Get current elaboration progress and metadata.

**Authentication:** Required (JWT token)

**Request:**
```http
GET /api/seeds/clxx1234/elaborate/status
Authorization: Bearer {token}
```

**Response:**
```json
{
  "completeness": 65,
  "metadata": {
    "participantCount": 30,
    "budgetPerParticipant": 400,
    "totalBudget": 12000,
    "duration": 7,
    "destination": {
      "country": "ES",
      "city": "Barcelona"
    },
    "participantCountries": ["DE", "FR", "IT"],
    "completeness": 65,
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "currentQuestionIndex": 5
  },
  "missingFields": ["activities", "erasmusPriorities"]
}
```

---

## Error Responses

### Seed Not Found (404)
```json
{
  "error": "Seed not found"
}
```

### Invalid Session (400)
```json
{
  "error": "Invalid session ID"
}
```

### Missing Parameters (400)
```json
{
  "error": "sessionId and answer are required"
}
```

### Validation Errors
```json
{
  "nextQuestion": "...",
  "metadata": { ... },
  "complete": false,
  "validationErrors": [
    "Erasmus+ Youth Exchanges require 16-60 participants"
  ]
}
```

---

## Usage Example

### Full Conversation Flow

```bash
# 1. Start session
curl -X POST http://localhost:3000/api/seeds/clxx1234/elaborate/start \
  -H "Authorization: Bearer ${TOKEN}" \
  | jq

# Output:
# {
#   "sessionId": "550e8400-e29b-41d4-a716-446655440000",
#   "question": "How many participants...",
#   "metadata": { "completeness": 0 }
# }

# 2. Answer first question (participant count)
curl -X POST http://localhost:3000/api/seeds/clxx1234/elaborate/answer \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "answer": "We are planning for about 30 young people"
  }' | jq

# 3. Answer second question (budget)
curl -X POST http://localhost:3000/api/seeds/clxx1234/elaborate/answer \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "answer": "Around €400 per participant"
  }' | jq

# 4. Continue answering questions...

# 5. Check status
curl http://localhost:3000/api/seeds/clxx1234/elaborate/status \
  -H "Authorization: Bearer ${TOKEN}" \
  | jq
```

---

## Data Structures

### SeedMetadata Interface

```typescript
interface SeedMetadata {
  // Participant Information
  participantCount?: number              // 16-60
  participantCountries?: string[]        // ISO codes
  ageRange?: { min: number; max: number }

  // Timeline
  duration?: number                      // Days
  startDate?: Date
  endDate?: Date

  // Budget
  totalBudget?: number                   // EUR
  budgetPerParticipant?: number          // EUR

  // Destination
  destination?: {
    country: string                      // ISO code
    city: string
    venue?: string
    accessibility?: string
  }

  // Requirements
  requirements?: {
    visas: Array<{
      country: string
      needed: boolean
      estimatedCost?: number
    }>
    insurance: boolean
    permits: string[]
    covidRequirements?: string
  }

  // Activities
  activities?: Array<{
    name: string
    duration: string
    budget?: number
    learningOutcomes?: string[]
  }>

  // EU Alignment
  erasmusPriorities?: string[]
  learningObjectives?: string[]

  // Tracking
  completeness: number                   // 0-100
  missingFields?: string[]
  sessionId?: string
  currentQuestionIndex?: number
}
```

---

## Erasmus+ Validation Rules

### Critical Requirements
- **Participant Count**: 16-60 (Youth Exchange KA1)
- **Duration**: 5-21 days recommended
- **Eligible Countries**: EU member states + partner countries
- **Budget**: €200-700 per participant typical
- **Age Range**: 13-30 for youth exchanges

### EU Priorities (Boost Approval)
- ✅ **Inclusion and diversity**: Activities for disadvantaged youth
- ✅ **Environment and fight against climate change**: Sustainability focus
- ✅ **Digital transformation**: Digital skills development
- ✅ **Participation in democratic life**: Civic engagement

### Red Flags (Lower Approval)
- ❌ Overly expensive (>€700/participant without justification)
- ❌ Too short (<5 days) or too long (>21 days)
- ❌ Unclear learning outcomes
- ❌ No EU priority alignment
- ❌ Accessibility barriers

---

## Testing

### Run Tests

```bash
cd project-pipeline/backend
npm test src/tests/seed-elaboration-agent.test.ts
```

### Test Coverage

- ✅ Question flow logic
- ✅ Data extraction from natural language
- ✅ Validation against Erasmus+ rules
- ✅ Completeness calculation
- ✅ Intelligent default suggestions
- ✅ Auto-calculations (visas, budgets)
- ✅ Edge cases (uncertain users, multi-part answers)

---

## Integration with Other Parts

### Part 2: Frontend
- Frontend calls `/elaborate/start` when user clicks "Elaborate"
- Displays questions one at a time
- Shows progress bar based on completeness
- Displays metadata in structured view

### Part 3: Project Generator
- Metadata feeds into project initialization
- Budget breakdown guides phase budgets
- Activities map to project phases
- Duration determines timeline

### Part 4: Database Migration
- Current: JSON storage in `SeedElaboration.metadata`
- Future: Typed columns for critical fields
- Migration path: JSON → typed columns

---

## Sample Conversations

### Scenario 1: Confident User
```
Q: How many participants?
A: 30 participants
→ Extract: { participantCount: 30 }

Q: What's your estimated budget?
A: Around 400 euros each
→ Extract: { budgetPerParticipant: 400, totalBudget: 12000 }

Q: How long will it last?
A: 7 days
→ Extract: { duration: 7 }
```

### Scenario 2: Uncertain User
```
Q: How many participants?
A: I'm not sure yet, what's typical?
→ Suggest: "For youth exchanges, 25-30 is optimal. Shall we plan for 28?"

Q: What's your budget?
A: Not sure, what would you recommend?
→ Calculate: Based on 28 participants × 7 days → Suggest €350-450/person
```

### Scenario 3: Complex Answer
```
Q: Where will this take place?
A: We're thinking Barcelona, Spain. Probably at the youth center in Gràcia district. It has wheelchair access.
→ Extract: {
  destination: {
    country: "ES",
    city: "Barcelona",
    venue: "Youth center in Gràcia",
    accessibility: "Wheelchair accessible"
  }
}
```

---

## Troubleshooting

### Build Issues
```bash
cd project-pipeline/backend
npm run build
```

### Port Conflicts
Ports 3000, 3001, 4000, 5174, 5175, 5432+ are already in use.
Check ports before starting:
```bash
netstat -tlnp | grep LISTEN
```

### OpenAI API Key
Ensure `OPENAI_API_KEY` is set in `.env`:
```bash
OPENAI_API_KEY=sk-...
```

### Database Issues
```bash
npx prisma generate
npx prisma db push
```

---

## Future Enhancements

1. **Multi-language Support**: Questions in user's language
2. **Voice Input**: Speech-to-text for answers
3. **Smart Pre-fill**: Analyze similar past projects
4. **Collaborative Elaboration**: Multiple users refine together
5. **Export to Application**: Direct integration with Erasmus+ forms
6. **Learning from Rejections**: Learn from failed applications

---

## Related Issues

- **Parent Issue**: #96 - Intelligent Seed Elaboration System
- **Part 2**: #98 - Frontend UI for conversational elaboration
- **Part 3**: #99 - Project Generator using elaborated metadata
- **Part 4**: #100 - Database schema migration for typed metadata

---

## Contributors

- Implementation: SCAR (Sam's Coding Agent Remote)
- Issue Author: @gpt153
- Project: OpenHorizon.cc / Project Pipeline Management System

---

## License

Part of the OpenHorizon.cc project. See main repository for license details.
