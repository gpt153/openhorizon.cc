# Manual Testing Steps for Agent Panels

**Test Environment**: http://localhost:5174 or http://oh.153.se

## Prerequisites
1. Backend running on port 4000
2. Frontend running on port 5174
3. Database with test data
4. **User logged in** (this is the key requirement)

---

## Step 1: Login to Application

**URL**: http://localhost:5174 or http://oh.153.se

1. Navigate to the application
2. Login with your credentials
3. You should see the dashboard

**Expected**: Dashboard loads with "My Projects" heading

---

## Step 2: Verify Test Project Exists

**Check**: Dashboard should show "Test Youth Exchange Barcelona"

If you don't see the project:
- The test data is associated with user ID: `test-user-1`
- You need to either:
  - Login as that user, OR
  - Update the test project's `created_by` field to match your user ID

**To fix**: Run this in database:
```sql
-- Find your user ID first
SELECT id, email FROM "User";

-- Update test project to your user ID
UPDATE "Project"
SET created_by = 'YOUR_USER_ID_HERE'
WHERE id = 'test-proj-1';
```

---

## Step 3: Test TravelSearchPanel

**URL**: http://localhost:5174/phases/phase-travel-1

**Verify**:
- [ ] Page loads with "Travel Planning" heading
- [ ] Phase type shows "TRAVEL"
- [ ] Budget shows €0 / €5000
- [ ] Search form has 4 fields:
  - [ ] Origin (pre-filled: "Barcelona, Spain")
  - [ ] Destination (empty)
  - [ ] Travel Date (empty)
  - [ ] Number of Passengers (pre-filled: 30)
- [ ] "Search Travel Options" button is clickable
- [ ] AI Assistant section shows "Travel Agent"
- [ ] Quick Start buttons are visible
- [ ] Chat interface is present

**Test Search**:
1. Fill Destination: "Stockholm, Sweden"
2. Fill Travel Date: "2026-06-01"
3. Click "Search Travel Options"
4. Should see alert: "Found travel options!"
5. Results should display below (if API key is configured)

---

## Step 4: Test FoodSearchPanel

**URL**: http://localhost:5174/phases/phase-food-1

**Verify**:
- [ ] Page loads with "Catering" heading
- [ ] Phase type shows "FOOD"
- [ ] Budget shows €0 / €3000
- [ ] Search form has 2 fields:
  - [ ] Location (pre-filled: "Barcelona, Spain")
  - [ ] Number of Participants (pre-filled: 30)
- [ ] "Search Food Options" button is clickable
- [ ] AI Assistant section shows "Food & Meal Agent"
- [ ] Quick Start buttons are visible
- [ ] Chat interface is present

**Test Search**:
1. Click "Search Food Options"
2. Should see alert: "Found food options!"
3. Results should display below (if API key is configured)

---

## Step 5: Test AccommodationSearchPanel

**URL**: http://localhost:5174/phases/phase-accom-1

**Verify**:
- [ ] Page loads with "Accommodation" heading
- [ ] Phase type shows "ACCOMMODATION"
- [ ] Budget shows €0 / €7000
- [ ] Search form has 2 fields:
  - [ ] Location (pre-filled: "Barcelona, Spain")
  - [ ] Number of Participants (pre-filled: 30)
- [ ] "Search Accommodation Options" button is clickable
- [ ] AI Assistant section shows "Accommodation Agent"
- [ ] Quick Start buttons are visible
- [ ] Chat interface is present

**Test Search**:
1. Click "Search Accommodation Options"
2. Should see alert: "Found accommodation options!"
3. Results should display below (if API key is configured)

---

## Step 6: Verify AI Assistant Integration

**For each phase**:
- [ ] AI Assistant section is collapsible
- [ ] Shows agent name (Travel Agent / Food & Meal Agent / Accommodation Agent)
- [ ] Shows connection status (Connected/Disconnected)
- [ ] Quick Start buttons are disabled when disconnected
- [ ] Chat input shows "Connecting..." when WebSocket is initializing

---

## Known Issues (Expected)

### WebSocket "Disconnected"
- **Expected**: If WebSocket server isn't configured
- **Impact**: None - UI still renders correctly
- **Fix**: Configure WebSocket for production

### API Returns Fallback Responses
- **Expected**: If Anthropic API key is invalid/placeholder
- **Impact**: Search results work but AI analysis is limited
- **Fix**: Set real ANTHROPIC_API_KEY in .env

### 404 on /phases/:phaseId/quotes
- **Expected**: Endpoint not implemented yet
- **Impact**: None - quotes feature is Phase 6 work
- **Fix**: Will implement when needed

---

## Success Criteria

✅ All 3 agent panels load correctly
✅ Search forms have proper default values
✅ Search buttons are functional
✅ AI Assistant sections display
✅ No blocking errors in console (404s are expected)
✅ Navigation between phases works
✅ Breadcrumb navigation is correct

---

## Troubleshooting

### Can't see test project on dashboard
**Problem**: Project doesn't appear after login
**Solution**: Update project's `created_by` to match your user ID (see Step 2)

### 401 Unauthorized on API calls
**Problem**: Not logged in or session expired
**Solution**: Refresh page and login again

### Page shows "Loading..." forever
**Problem**: API not responding
**Solution**: Check backend is running on port 4000

### Changes not appearing
**Problem**: Browser cache
**Solution**: Hard refresh (Ctrl+Shift+R) or open in incognito

---

## Quick Database Queries

```sql
-- Check current user
SELECT id, email, name, role FROM "User";

-- Check test project
SELECT id, name, created_by FROM "Project" WHERE id = 'test-proj-1';

-- Update test project to your user
UPDATE "Project" SET created_by = 'YOUR_USER_ID' WHERE id = 'test-proj-1';

-- Verify test phases exist
SELECT id, name, type, project_id FROM "Phase" WHERE project_id = 'test-proj-1';
```

---

**Test Duration**: ~5 minutes
**Status**: Manual verification required
