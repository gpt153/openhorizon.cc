# Travel Research Agent Implementation Plan

## Overview
Implement AI-powered travel research agent following the accommodation agent pattern. The agent will search for flights and travel agencies, provide AI analysis with pros/cons, and generate quote request emails.

## Architecture Analysis

### Existing Patterns
- **BaseAgent**: Abstract class providing LLM integration via LangChain + OpenAI
- **AccommodationAgent**: Reference implementation with research() and handleChat() methods
- **Agent Registry**: Maps phase types to agents
- **TRPC Router**: Pipeline phases router with chat endpoint
- **UI Integration**: PhaseChat component for AI interactions

### Key Dependencies
- `@langchain/openai`: LLM integration
- `playwright`: Web scraping (to be added)
- TRPC: API layer
- Prisma: Database

## Implementation Steps

### Step 1: Create Travel Agent Class
**File**: `app/src/lib/ai/agents/travel-agent.ts`

**Interfaces**:
```typescript
interface Flight {
  id: string
  airline: string
  price: number
  duration: string
  connections: number
  departureTime: string
  arrivalTime: string
  origin: string
  destination: string
  groupSuitability: number
  aiAnalysis: string
}

interface TravelAgency {
  id: string
  name: string
  website: string
  contactEmail?: string
  contactPhone?: string
  specializations: string[]
  groupSuitability: number
  aiAnalysis: string
}
```

**Class Methods**:
- `searchFlights(origin, destination, date, passengers)`: Orchestrate flight search
- `searchAgencies(origin, destination)`: Orchestrate agency search
- `analyzeFlights(flights, context)`: Generate AI pros/cons for flights
- `analyzeAgencies(agencies, context)`: Generate AI pros/cons for agencies
- `generateQuoteEmail(option, context)`: Create professional quote request email

### Step 2: Implement Flight Scraper
**File**: `app/src/lib/scrapers/flight-scraper.ts`

**Strategy**: Start with mock data, add real scraping later (Playwright)

**Challenges**:
- Google Flights and Skyscanner have anti-bot protections
- Rate limiting concerns
- Scraping reliability

**Initial Implementation**:
- Mock flight data based on common routes
- Realistic price estimates
- Include group booking considerations

**Future Enhancement**:
- Playwright-based scraper with stealth mode
- Multiple source aggregation
- Caching strategy

### Step 3: Implement Travel Agency Search
**File**: `app/src/lib/scrapers/agency-scraper.ts`

**Approach**:
- Google Custom Search API (if available) or mock data initially
- Parse structured data from search results
- Extract contact information

**Data Sources**:
- Google search results
- Specialized travel directories
- Erasmus+ partner databases

### Step 4: Register Travel Agent
**File**: `app/src/lib/ai/agents/registry.ts`

**Changes**:
- Import TravelAgent
- Add case for 'TRAVEL' phase type
- Ensure agent instantiation

### Step 5: Extend TRPC API
**File**: `app/src/server/routers/pipeline/phases.ts`

**New Procedures**:
```typescript
searchTravel: orgProcedure
  .input(z.object({
    phaseId: z.string().uuid(),
    origin: z.string(),
    destination: z.string(),
    date: z.string(),
    passengers: z.number()
  }))
  .mutation(async ({ ctx, input }) => {
    // Verify phase access
    // Call TravelAgent.searchFlights() and searchAgencies()
    // Store results in session or database
    // Return { flights, agencies }
  })

generateQuotes: orgProcedure
  .input(z.object({
    phaseId: z.string().uuid(),
    selectedOptions: z.array(z.string())
  }))
  .mutation(async ({ ctx, input }) => {
    // Load selected options
    // Generate quote emails via TravelAgent
    // Create communication records
    // Return { emails }
  })
```

### Step 6: Build UI Components
**Files**:
- `app/src/components/pipeline/TravelSearchPanel.tsx`: Search interface
- `app/src/components/pipeline/TravelOptionCard.tsx`: Display flight/agency with AI analysis
- `app/src/components/pipeline/QuoteRequestModal.tsx`: Review and send quotes

**UI Flow**:
1. User enters travel details (origin, destination, date, passengers)
2. Click "Search Travel Options"
3. Display flights and agencies in gallery view
4. Each card shows:
   - Key details
   - AI pros/cons analysis
   - Suitability score
   - Selection checkbox
5. Select desired options
6. Click "Request Quotes from Selected"
7. Review generated emails
8. Confirm to send

### Step 7: Integrate into Phase Detail Page
**File**: `app/src/app/(dashboard)/pipeline/projects/[id]/phases/[phaseId]/page.tsx`

**Changes**:
- Import TravelSearchPanel
- Add conditional rendering for TRAVEL phases
- Place in quotes section or new tab

### Step 8: Database Schema (if needed)
**Considerations**:
- Store search results temporarily?
- Track sent quote requests?
- Cache flight/agency data?

**Decision**: Use existing Quote and Communication models initially. Extend if needed.

### Step 9: Add Playwright Dependency
**File**: `app/package.json`

```json
{
  "dependencies": {
    "playwright": "^1.40.0"
  }
}
```

Run: `npm install`

### Step 10: Testing
**Manual Test Cases**:
1. Create TRAVEL phase
2. Enter search: Stockholm → Barcelona, 30 passengers
3. Verify mock results appear
4. Check AI analysis quality
5. Select multiple options
6. Generate quote emails
7. Verify email content is professional and complete

**Edge Cases**:
- No results found
- Invalid destinations
- Date in the past
- Zero passengers
- API failures

## Implementation Order

1. ✅ Create plan document (this file)
2. 🔄 Implement TravelAgent class with mock data
3. 🔄 Create flight and agency scrapers (mock initially)
4. 🔄 Register agent in registry
5. 🔄 Add TRPC API endpoints
6. 🔄 Build UI components
7. 🔄 Integrate into phase page
8. 🔄 Add Playwright dependency
9. 🔄 Test end-to-end workflow
10. 🔄 Document usage

## AI Prompt Templates

### Flight Analysis Prompt
```
You are analyzing flight options for a student group travel project.

CONTEXT:
- Group size: {participants}
- Route: {origin} → {destination}
- Travel date: {date}
- Budget per person: €{budgetPerPerson}

FLIGHT DETAILS:
{flightDetails}

Provide a structured analysis with:
1. PROS (3-4 specific advantages)
2. CONS (3-4 specific concerns)
3. GROUP SUITABILITY score (0-10)
4. RECOMMENDATION (1-2 sentences)

Focus on: pricing, timing, convenience, group booking feasibility.
```

### Agency Analysis Prompt
```
You are evaluating travel agencies for youth group coordination.

CONTEXT:
- Group size: {participants}
- Route: {origin} → {destination}
- Project type: Erasmus+ youth exchange

AGENCY DETAILS:
{agencyDetails}

Provide a structured analysis with:
1. STRENGTHS (3-4 key capabilities)
2. CONCERNS (2-3 potential issues)
3. VALUE PROPOSITION (why use them vs. direct booking?)
4. RECOMMENDATION (suitable/not suitable + reasoning)

Focus on: group travel experience, youth sector knowledge, support services.
```

### Quote Email Template
```
Subject: Group Travel Quote Request - {projectName} ({participants} participants)

Dear {agencyName/Airline},

We are organizing a youth exchange project under the Erasmus+ programme and would like to request a quote for group travel.

PROJECT DETAILS:
- Project: {projectName}
- Group size: {participants} young people (ages 18-30)
- Route: {origin} → {destination}
- Travel dates: {dates}
- Budget: Approximately €{budgetRange} per person

REQUIREMENTS:
- Group booking with flexible payment terms
- Baggage allowance (1 checked bag per person)
- [If agency] Support with multi-country coordination
- [If agency] Assistance with any visa/documentation requirements

Could you please provide:
1. Available options for these dates
2. Group pricing breakdown
3. Payment terms and deadlines
4. Cancellation/change policies
5. Any group discounts or youth rates

We aim to finalize bookings by {deadline}. Please send your quote to {email}.

Thank you for your assistance.

Best regards,
{organizationName}
{contactDetails}
```

## Error Handling Strategy

1. **Scraping Failures**: Gracefully degrade to manual input option
2. **AI Errors**: Return generic analysis template
3. **API Timeouts**: Show cached/partial results
4. **Network Issues**: Clear error messages with retry button

## Performance Considerations

- Flight searches can take 10-30 seconds (scraping)
- Use loading states and progress indicators
- Consider background job processing for large searches
- Cache results for same search parameters (1 hour TTL)

## Security Considerations

- Validate all user inputs (dates, destinations, passenger count)
- Sanitize scraped data before display
- Rate limit API endpoints
- Don't expose API keys in client code
- Verify phase ownership before all operations

## Future Enhancements

1. **Real-time Price Tracking**: Monitor price changes for selected options
2. **Price Alerts**: Notify when prices drop
3. **Booking Integration**: Direct booking via APIs (Amadeus, Sabre)
4. **Multi-leg Trips**: Support for complex itineraries
5. **Carbon Footprint**: Display environmental impact
6. **Group Discounts Database**: Track known group-friendly airlines

## Success Criteria

- ✅ Travel agent mirrors accommodation agent pattern
- ✅ Provides flight and agency options
- ✅ AI analysis is helpful and specific
- ✅ Quote emails are professional
- ✅ UI is intuitive and responsive
- ✅ Handles errors gracefully
- ✅ Works with mock data (real scraping = bonus)

## Timeline Estimate

- Step 1-4 (Backend): 2 hours
- Step 5-7 (API + UI): 2-3 hours
- Step 8-10 (Testing + Polish): 1-2 hours
- **Total**: 5-7 hours (conservative estimate)

## Notes

- Start with mock data to validate architecture
- Real web scraping is complex and may require significant additional time
- Focus on AI analysis quality - this is the core value proposition
- Reuse existing UI components (Card, Badge, Button, Dialog) for consistency
