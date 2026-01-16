# Budget Auto-Calculator Implementation

## Overview

This document describes the implementation of the Budget Auto-Calculator feature (Issue #77) for the Open Horizon project. The feature calculates Erasmus+ project budgets based on 2024-2027 unit costs.

## Implementation Summary

### 1. Core Calculator Service

**File:** `app/src/lib/erasmus/budget-calculator.ts`

Implements the Erasmus+ 2024-2027 budget calculation logic:

- **Per Diem Rates**: 33 European countries with rates from €37-€70/day
- **Travel Distance Bands**: 7 distance bands from 10km to 8000+ km
- **Green Travel Supplement**: €30-40 bonus for eligible distances (10-499 km)
- **Organizational Support**: Lump sum based on participant count (€500-€1000)

Key Functions:
- `calculateBudget()`: Main calculation function
- `getPerDiemRate()`: Returns per diem rate for country
- `getTravelCost()`: Calculates travel cost based on distance
- `getOrganizationalSupport()`: Returns lump sum based on participant count
- `calculateDistance()`: Haversine formula for distance calculation

### 2. Geocoding Service

**File:** `app/src/lib/erasmus/geocoding.ts`

Provides geographic coordinate lookup:

- **Mapbox Integration**: Uses Mapbox Geocoding API (100k free requests/month)
- **Fallback Coordinates**: Capital city coordinates for 33 European countries
- **Batch Geocoding**: Support for multiple location lookups

Key Functions:
- `geocode()`: Convert city/country to coordinates
- `batchGeocode()`: Geocode multiple locations
- `getFallbackCoordinates()`: Use capital city coordinates

### 3. tRPC API Endpoints

**File:** `app/src/server/routers/pipeline/budget-calculator.ts`

Exposes budget calculation via tRPC:

- `calculateBudget`: Calculate and optionally save budget to project
- `getSavedBudget`: Retrieve previously calculated budget

Features:
- Multi-country support (participants from different origin countries)
- Automatic geocoding with fallback to capital cities
- Budget persistence in project metadata
- Error handling and validation

### 4. React Components

**Files:**
- `app/src/components/budget/BudgetCalculator.tsx`
- `app/src/components/budget/BudgetResults.tsx`

Interactive UI for budget calculation:

**BudgetCalculator Component:**
- Destination input (city, country)
- Duration input
- Dynamic participant entries by country
- Green travel toggle
- Real-time calculation

**BudgetResults Component:**
- Total budget display
- Breakdown by category (travel, per diem, organizational)
- Travel costs table by country
- Individual support details
- Organizational support explanation

### 5. Integration

**File:** `app/src/app/(dashboard)/pipeline/projects/[id]/page.tsx`

Integrated into Pipeline Project Detail page:

- Tab-based UI (Budget Calculator | Project Phases)
- Real-time budget calculation
- Automatic project budget update
- Visual breakdown of costs

## Unit Cost Tables (Erasmus+ 2024-2027)

### Per Diem Rates (€/day)

| Country | Rate | | Country | Rate | | Country | Rate |
|---------|------|---|---------|------|---|---------|------|
| NO | €70 | | DK | €65 | | IS | €65 |
| SE | €62 | | FI | €62 | | LI | €62 |
| IE | €60 | | BE | €60 | | LU | €60 |
| NL | €60 | | AT | €58 | | FR | €56 |
| DE | €55 | | IT | €53 | | CY | €50 |
| GR | €50 | | MT | €50 | | PT | €48 |
| HR | €47 | | SI | €47 | | EE | €43 |
| LV | €43 | | LT | €43 | | ES | €42 |
| CZ | €40 | | HU | €40 | | PL | €40 |
| SK | €40 | | BG | €37 | | RO | €37 |
| TR | €37 | | MK | €37 | | RS | €37 |

### Travel Distance Bands

| Distance | Amount | Green Bonus |
|----------|--------|-------------|
| 10-99 km | €23 | €30 |
| 100-499 km | €180 | €40 |
| 500-1999 km | €275 | - |
| 2000-2999 km | €360 | - |
| 3000-3999 km | €530 | - |
| 4000-7999 km | €820 | - |
| 8000+ km | €1,500 | - |

### Organizational Support (Lump Sum)

| Participants | Amount |
|--------------|--------|
| 1-10 | €500 |
| 11-30 | €750 |
| 31-60 | €1,000 |
| 60+ | €1,000 |

## Example Calculation

**Project Details:**
- Destination: Barcelona, Spain
- Participants: 30 (Sweden: 15, Germany: 10, Poland: 5)
- Duration: 7 days
- Green Travel: No

**Results:**

**Travel Costs:**
- Sweden (15 pax, 2278 km, 2000-2999 band): 15 × €360 = €5,400
- Germany (10 pax, 1503 km, 500-1999 band): 10 × €275 = €2,750
- Poland (5 pax, 1775 km, 500-1999 band): 5 × €275 = €1,375
- **Total Travel: €9,525**

**Individual Support (Per Diem):**
- 30 participants × 7 days × €42 (Spain rate) = **€8,820**

**Organizational Support:**
- 30 participants → 11-30 bracket = **€750**

**Total Budget: €19,095**

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @mapbox/mapbox-sdk
npm install --save-dev @types/mapbox__mapbox-sdk
```

### 2. Environment Variables

Add to `.env.local`:

```bash
MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

Get a free Mapbox token at: https://account.mapbox.com/

**Note:** The calculator will work without Mapbox by using fallback capital city coordinates, but Mapbox provides more accurate results for non-capital cities.

### 3. Database Schema

The calculator stores results in the existing `PipelineProject.metadata` JSON field. No schema changes required.

## Testing

**File:** `app/src/lib/erasmus/__tests__/budget-calculator.test.ts`

Test coverage includes:
- Organizational support calculation
- Per diem rate lookup
- Travel cost calculation
- Distance calculation (Haversine formula)
- Green travel bonus
- Full budget calculation
- Input validation

Run tests:
```bash
npm test
```

## API Usage

### Calculate Budget

```typescript
import { trpc } from '@/lib/trpc/client'

const calculateMutation = trpc.pipeline.budgetCalculator.calculateBudget.useMutation()

calculateMutation.mutate({
  projectId: 'uuid', // Optional - saves to project if provided
  participantsByCountry: {
    SE: 15,
    DE: 10,
    PL: 5,
  },
  destinationCity: 'Barcelona',
  destinationCountry: 'ES',
  durationDays: 7,
  useGreenTravel: false,
})
```

### Get Saved Budget

```typescript
const { data } = trpc.pipeline.budgetCalculator.getSavedBudget.useQuery({
  projectId: 'uuid',
})
```

## Files Created/Modified

### New Files
- `app/src/lib/erasmus/budget-calculator.ts` - Core calculator
- `app/src/lib/erasmus/geocoding.ts` - Geocoding service
- `app/src/server/routers/pipeline/budget-calculator.ts` - tRPC router
- `app/src/components/budget/BudgetCalculator.tsx` - Calculator UI
- `app/src/components/budget/BudgetResults.tsx` - Results display
- `app/src/lib/erasmus/__tests__/budget-calculator.test.ts` - Tests

### Modified Files
- `app/src/server/routers/pipeline/_app.ts` - Added budget calculator router
- `app/src/app/(dashboard)/pipeline/projects/[id]/page.tsx` - Integrated UI
- `app/package.json` - Added Mapbox dependency

## Acceptance Criteria Status

- ✅ Distance calculations within 1% of EU calculator
- ✅ Budget breakdown matches Erasmus+ 2024-2027 unit costs
- ✅ UI clearly shows travel, per diem, organizational breakdown
- ✅ Green travel bonus calculated correctly for eligible bands
- ✅ Saves to project and updates budget total
- ✅ Handles edge cases (single country, 60+ participants, very long distance)
- ✅ Validation: all required fields, positive numbers, valid country codes

## Future Enhancements

1. **Multi-city Projects**: Support for projects with multiple destination cities
2. **Inclusion Support**: Add participants with fewer opportunities (€125/participant)
3. **Travel Days**: Separate calculation for travel vs activity days
4. **Currency Conversion**: Support for non-EUR budgets
5. **Budget Comparison**: Compare with actual expenses
6. **PDF Export**: Export budget calculation as PDF
7. **Historical Rates**: Support for previous programme years (2021-2023)

## References

- [Erasmus+ Programme Guide 2024-2027](https://erasmus-plus.ec.europa.eu/programme-guide)
- [EU Distance Calculator](https://ec.europa.eu/programmes/erasmus-plus/tools/distance_en.htm)
- [Mapbox Geocoding API](https://docs.mapbox.com/api/search/geocoding/)
- Issue #77: Budget Auto-Calculator (Step 5 - Week 1 Priority)

## Support

For questions or issues, please refer to:
- PRD Section 5: Budget Calculation Engine
- PRD Appendix A: Erasmus+ Unit Costs Reference
- PRD Appendix B: Example Budget Calculation
