# Implementation Plan Summary - Issue #98

## 🎯 Objective
Build a conversational UI for intelligent seed elaboration with progress tracking, quick-reply buttons, and metadata preview.

## 📊 Current State
- ✅ Backend API complete (Part 1)
- ✅ Basic chat component exists (`SeedElaborationChat.tsx`)
- ✅ API integration in place
- ❌ Missing: Completeness tracking, quick replies, metadata preview, edit functionality

## 🏗️ Architecture

### Technology Stack
- **State Management**: Zustand (already in use)
- **API**: Axios + React Query (existing pattern)
- **Styling**: Tailwind CSS
- **Testing**: Vitest + React Testing Library

### Component Hierarchy
```
SeedDetail.tsx (Page)
└── ConversationalElaboration.tsx (NEW - Orchestrator)
    ├── ProgressIndicator.tsx (NEW)
    ├── SeedElaborationChat.tsx (ENHANCED)
    │   ├── Quick reply buttons
    │   ├── Edit message functionality
    │   └── Smart suggestions
    └── MetadataPreview.tsx (NEW)
        ├── Completeness indicator
        ├── Field status display
        └── Convert to Project button
```

### New Files to Create
1. `frontend/src/store/elaborationStore.ts` - State management
2. `frontend/src/components/seeds/ConversationalElaboration.tsx` - Main component
3. `frontend/src/components/seeds/MetadataPreview.tsx` - Metadata display
4. `frontend/src/components/seeds/ProgressIndicator.tsx` - Progress bar

### Files to Enhance
1. `frontend/src/types/seeds.ts` - Add new types
2. `frontend/src/components/SeedElaborationChat.tsx` - Add features
3. `frontend/src/services/seeds.api.ts` - Add helpers
4. `frontend/src/pages/SeedDetail.tsx` - Integrate new components

## 🎨 Key Features

### 1. Completeness Tracking
- Calculate metadata completeness (0-100%)
- Visual progress bar with color coding
- Required fields: 60% weight
- Optional fields: 40% weight

### 2. Quick Reply Buttons
Pattern-matched contextual buttons:
- "How many participants?" → [16-20] [21-30] [31-40] [Custom]
- "What age group?" → [Youth] [Adults] [Mixed]
- "Duration?" → [1 week] [2 weeks] [1 month] [Custom]

### 3. Edit Previous Answers
- Pencil icon on user messages
- Click to edit and resubmit
- Truncate conversation after edit point
- Show "(edited)" indicator

### 4. Metadata Preview
- Structured display of collected data
- ✓ Completed fields (green)
- ⚠ Missing fields (yellow)
- Circular progress indicator
- "Convert to Project" button (≥80%)

### 5. Smart Suggestions
Detect uncertainty phrases:
- "I don't know"
- "Not sure"
- "Maybe"

Response: Offer to skip or provide examples

## 📋 Implementation Phases

### Phase 1: Foundation (30 min)
- [ ] Enhance type definitions
- [ ] Create elaboration store
- [ ] Add completeness calculation

### Phase 2: Components (60 min)
- [ ] Build ProgressIndicator
- [ ] Build MetadataPreview
- [ ] Build ConversationalElaboration orchestrator

### Phase 3: Features (60 min)
- [ ] Add quick reply buttons
- [ ] Add edit message functionality
- [ ] Add smart suggestions

### Phase 4: Integration (30 min)
- [ ] Update SeedDetail page
- [ ] Polish UI/UX
- [ ] Test flow end-to-end

### Phase 5: Testing (30 min)
- [ ] Write component tests
- [ ] Write integration tests
- [ ] Fix bugs

**Total Time**: 3-4 hours

## ✅ Success Criteria

- [ ] User can elaborate seed through conversation
- [ ] Progress bar shows 0-100% completion
- [ ] Quick reply buttons appear contextually
- [ ] User can edit previous answers
- [ ] Metadata preview updates in real-time
- [ ] Convert button enables at 80%+ completion
- [ ] Mobile responsive design
- [ ] All tests pass

## 🔗 Integration Points

### With Part 1 (Backend) - Already Complete
- Uses existing `POST /seeds/:id/elaborate` endpoint
- Consumes `ElaborationResponse` format
- No backend changes needed

### With Part 3 (Project Generator) - Parallel Development
- Provides "Convert to Project" button hook
- Passes metadata to Part 3's generator
- Independent development (loose coupling)

## 🎯 Design Principles

1. **Conversational UX**: Friendly, collaborative tone
2. **Progressive Disclosure**: One question at a time
3. **Forgiving Interface**: Easy to edit, skip, or change answers
4. **Visual Feedback**: Clear progress indicators and status
5. **Mobile-First**: Responsive design for all devices

## 📦 Deliverables

1. Working conversational UI
2. Component tests
3. Integration tests
4. Updated documentation
5. Pull request

---

**Status**: ✅ Planning Complete - Ready for Implementation
**Estimated Effort**: 3-4 hours
**Dependencies**: None (Part 1 complete)
