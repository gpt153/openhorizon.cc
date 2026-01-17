# Erasmus+ Project Pipeline - E2E Test Plan

**Session**: session-1768166535
**Project**: openhorizon.cc
**Frontend**: http://localhost:5173
**Backend**: http://localhost:4000
**Started**: 2026-01-11 21:22 UTC

---

## Features to Test

### Feature 1: Seed Generation with AI
**Priority**: P0 (Critical - Start of pipeline)
**Dependencies**: None
**Tests**:
1. Navigate to seeds page
2. Click "Generate Seed" button
3. Fill in seed generation form (project idea, participants, etc.)
4. Submit and wait for AI generation
5. Verify seed appears with AI-generated content
6. Verify seed can be edited
7. Verify seed can be saved to garden

### Feature 2: Seed Garden Management
**Priority**: P0
**Dependencies**: Feature 1
**Tests**:
1. View seed garden/list
2. Search/filter seeds
3. Click on seed to view details
4. Edit seed content
5. Delete seed
6. Verify changes persist

### Feature 3: Seed to Project Conversion
**Priority**: P0 (Critical path)
**Dependencies**: Feature 1, Feature 2
**Tests**:
1. Select a seed from garden
2. Click "Convert to Project" button
3. Verify conversion dialog appears
4. Confirm conversion
5. Verify project is created with seed data
6. Verify project appears in project list
7. Verify seed is marked as converted

### Feature 4: Project Gantt Chart View
**Priority**: P1
**Dependencies**: Feature 3
**Tests**:
1. Navigate to project detail page
2. View Gantt chart tab
3. Verify all phases display on timeline
4. Verify phase dependencies shown
5. Verify dates are accurate
6. Verify chart is interactive (zoom, pan)

### Feature 5: AI Chat for Projects
**Priority**: P1
**Dependencies**: Feature 3
**Tests**:
1. Open project chat interface
2. Send message to AI assistant
3. Verify AI responds appropriately
4. Ask for project advice/suggestions
5. Verify chat history persists
6. Verify WebSocket connection stable

### Feature 6: Phase Detail Pages
**Priority**: P0 (Part of CRUD)
**Dependencies**: Feature 3
**Tests**:
1. Click on a phase in project view
2. View phase detail page
3. Verify phase information displays
4. Verify budget information shown
5. Verify dates and status visible
6. Verify breadcrumb navigation works

### Feature 7: Phase Editing (CRUD)
**Priority**: P0
**Dependencies**: Feature 6
**Tests**:
1. Click "Edit Phase" button
2. Modify phase name
3. Change phase status
4. Update budget allocation
5. Modify start/end dates
6. Save changes
7. Verify changes persist
8. Cancel edit and verify no changes saved

### Feature 8: Phase Deletion
**Priority**: P1
**Dependencies**: Feature 6
**Tests**:
1. Click "Delete Phase" button
2. Verify confirmation dialog appears
3. Confirm deletion
4. Verify phase removed from project
5. Cancel deletion and verify phase remains

### Feature 9: Phase-Specific AI Agents
**Priority**: P1
**Dependencies**: Feature 6
**Tests**:
1. Open phase detail page
2. Access AI agents tab/panel
3. Select different agent types (if multiple)
4. Chat with phase-specific AI
5. Verify AI provides phase-relevant advice
6. Verify agent routing works correctly
7. Test starter prompts if available

### Feature 10: Budget Tracking
**Priority**: P0 (Critical for Erasmus+)
**Dependencies**: Feature 3, Feature 6
**Tests**:
1. Navigate to budget tracking dashboard
2. View budget overview (allocated vs spent)
3. View budget breakdown charts (donut, trend, gauge)
4. Verify budget health indicator shows correct status
5. Add new expense to a phase
6. Verify expense appears in list
7. Verify budgetSpent updates automatically
8. Edit expense amount
9. Delete expense
10. Verify budget calculations accurate

### Feature 11: Budget Alerts Configuration
**Priority**: P2
**Dependencies**: Feature 10
**Tests**:
1. Navigate to budget alerts settings
2. Set budget alert threshold (e.g., 75%)
3. Add email recipients
4. Enable alert
5. Create expense that triggers threshold
6. Verify alert triggered (check logs or UI notification)
7. Verify 24-hour cooldown works
8. Disable alert and verify no triggering

### Feature 12: Budget Export (CSV)
**Priority**: P2
**Dependencies**: Feature 10
**Tests**:
1. Click "Export Budget" button
2. Select CSV format
3. Trigger download
4. Verify CSV file downloads
5. Open CSV and verify data accuracy
6. Verify all expenses included
7. Verify budget summary at top

### Feature 13: Application Form Generation
**Priority**: P0 (Critical for Erasmus+)
**Dependencies**: Feature 3, Feature 6, Feature 10
**Tests**:
1. Navigate to form generation page
2. Select form type (KA1 or KA2)
3. Trigger form generation from phase data
4. Verify form populates with project data
5. Verify AI narratives generated
6. Edit form sections
7. Finalize form
8. Verify form status changes to FINALIZED
9. Verify finalized form is immutable

### Feature 14: Application Form Export (PDF)
**Priority**: P0
**Dependencies**: Feature 13
**Tests**:
1. Open generated application form
2. Click "Export as PDF"
3. Verify PDF download starts
4. Open PDF and verify formatting
5. Verify all form sections included
6. Verify Erasmus+ branding present
7. Verify charts rendered as images

### Feature 15: Application Form Export (Word)
**Priority**: P1
**Dependencies**: Feature 13
**Tests**:
1. Open generated application form
2. Click "Export as Word"
3. Verify DOCX download starts
4. Open in Word and verify formatting
5. Verify document is editable
6. Verify tables formatted correctly

### Feature 16: Project Report Export
**Priority**: P1
**Dependencies**: Feature 3, Feature 10, Feature 13
**Tests**:
1. Navigate to project detail page
2. Click "Export Report" button
3. Select report format (PDF/Excel/Word)
4. Trigger export
5. Verify download starts
6. Open report and verify sections:
   - Project overview
   - Gantt chart (PDF/Word)
   - Phase breakdown
   - Budget summary
   - Expense details
   - Application forms links
7. Verify data accuracy
8. Verify professional formatting

### Feature 17: AI Accommodation Finding (If Implemented)
**Priority**: P2
**Dependencies**: Feature 3, Feature 6
**Tests**:
1. Access accommodation AI agent
2. Provide project location and dates
3. Ask AI for accommodation suggestions
4. Verify AI provides relevant results
5. Verify recommendations match budget
6. Save accommodation recommendations to phase

---

## Test Execution Strategy

### Batch 1: Core Pipeline (P0 - Sequential)
Execute in order (dependencies):
1. Feature 1: Seed Generation
2. Feature 2: Seed Garden
3. Feature 3: Seed to Project Conversion

**Estimated Time**: 15-20 minutes
**Rationale**: Must complete before other features can be tested

### Batch 2: Project Management (P0/P1 - Parallel)
Execute in parallel after Batch 1 completes:
4. Feature 4: Gantt Chart
5. Feature 5: AI Chat
6. Feature 6: Phase Details
7. Feature 7: Phase Editing

**Estimated Time**: 20-25 minutes
**Rationale**: Independent features, can test concurrently

### Batch 3: Budget System (P0/P1 - Sequential)
Execute in order:
10. Feature 10: Budget Tracking
11. Feature 11: Budget Alerts
12. Feature 12: Budget Export

**Estimated Time**: 15-20 minutes
**Rationale**: Budget must work before alerts/export

### Batch 4: Forms & Reports (P0/P1 - Sequential)
Execute in order:
13. Feature 13: Form Generation
14. Feature 14: PDF Export
15. Feature 15: Word Export
16. Feature 16: Project Report Export

**Estimated Time**: 20-25 minutes
**Rationale**: Forms must exist before export

### Batch 5: Advanced Features (P2 - Parallel)
Execute in parallel:
8. Feature 8: Phase Deletion
9. Feature 9: Phase AI Agents
17. Feature 17: AI Accommodation

**Estimated Time**: 15-20 minutes
**Rationale**: Optional/enhancement features

---

## Success Criteria

- ✅ All P0 features pass (critical path)
- ✅ At least 80% of P1 features pass
- ✅ No regressions in any passing features
- ✅ All bugs found are fixed and retested
- ✅ E2E demo project successfully created from seed to complete application

---

## Evidence Collection

All test runs will capture:
- Screenshots of key steps
- Console errors/warnings
- Network request failures
- Test execution logs
- Video recordings for failures

**Evidence Location**: `.agents/ui-testing/session-1768166535/`

---

**Total Features**: 17
**P0 (Critical)**: 9
**P1 (High)**: 6
**P2 (Medium)**: 2

**Estimated Total Time**: 85-110 minutes for full E2E test suite
