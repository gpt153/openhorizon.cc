# Feature: Expose AI Agents in UI (Accommodation, Travel, Food)

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Integrate phase-specific AI agents (Accommodation, Travel, Food, Activities) directly into the PhaseDetail page UI. Users will be able to chat with specialized AI assistants that provide contextual help for each phase type. This feature leverages the existing backend agents and WebSocket chat infrastructure while adding a dedicated UI component for agent interaction.

## User Story

As a **project coordinator planning an Erasmus+ project**
I want to **chat with a phase-specific AI agent from the phase detail page**
So that **I can get specialized assistance for accommodation, travel, food, and activities planning without leaving the phase context**

## Problem Statement

Backend AI agents exist (AccommodationAgent, base agents for Travel/Food/Activities) but are not accessible from the UI. Users cannot leverage AI assistance for phase-specific planning tasks. The chat infrastructure exists via WebSocket but lacks a dedicated UI integration point within phase detail pages.

## Solution Statement

Add an "AI Assistant" section to the PhaseDetail page that displays a chat interface connected to the appropriate agent based on phase type. Use the existing ChatWindow component, useChat hook, and WebSocket infrastructure. The agent automatically selects based on `phase.type`, providing contextual assistance without requiring users to specify which agent to use.

## Feature Metadata

**Feature Type**: Enhancement
**Estimated Complexity**: Medium
**Primary Systems Affected**: Frontend (PhaseDetail page), existing chat infrastructure
**Dependencies**: socket.io-client (already installed), existing ChatService, existing agents

---

## CONTEXT REFERENCES

### Relevant Codebase Files IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

**Frontend:**
- `project-pipeline/frontend/src/pages/PhaseDetail.tsx` - Phase detail page where agent chat will be added
- `project-pipeline/frontend/src/components/ChatWindow.tsx` - Reusable chat UI component (lines 1-177)
- `project-pipeline/frontend/src/hooks/useChat.ts` - Chat message management hook (lines 1-204)
- `project-pipeline/frontend/src/hooks/useSocket.ts` - Socket connection management
- `project-pipeline/frontend/src/lib/socket.ts` - Socket initialization utilities (lines 1-71)
- `project-pipeline/frontend/src/types/index.ts` - Type definitions (PhaseType enum lines 10-22)
- `project-pipeline/frontend/src/components/SeedElaborationChat.tsx` - Reference chat implementation pattern

**Backend:**
- `project-pipeline/backend/src/ai/chat.service.ts` - WebSocket chat handlers (lines 1-244)
- `project-pipeline/backend/src/ai/agents/registry.ts` - Agent routing logic (lines 1-19)
- `project-pipeline/backend/src/ai/agents/base-agent.ts` - Base agent class (lines 1-73)
- `project-pipeline/backend/src/ai/agents/accommodation-agent.ts` - Example specialized agent (lines 1-329)
- `project-pipeline/backend/src/websocket.ts` - WebSocket setup (lines 1-53)

### New Files to Create

**Frontend:**
- `project-pipeline/frontend/src/components/PhaseAgentChat.tsx` - Phase-specific agent chat component

**Backend:**
- No new backend files needed (existing chat infrastructure handles phase-based agent routing)

### Relevant Documentation YOU SHOULD READ THESE BEFORE IMPLEMENTING!

**Socket.io Client Documentation:**
- [Socket.io Client API](https://socket.io/docs/v4/client-api/)
  - Specific section: Event emitters and listeners
  - Why: Understanding how to emit 'chat:message' and listen for 'chat:response'

**React Query Documentation:**
- [TanStack Query - useQuery](https://tanstack.com/query/latest/docs/framework/react/reference/useQuery)
  - Specific section: enabled option for conditional queries
  - Why: Pattern already used in PhaseDetail.tsx for loading phase data

**TypeScript Documentation:**
- [TypeScript Handbook - Enums](https://www.typescriptlang.org/docs/handbook/enums.html)
  - Specific section: String enums
  - Why: PhaseType enum used for agent selection

### Patterns to Follow

**Socket.io Connection Pattern:**
```typescript
// Pattern from useChat.ts (lines 46-94)
const sendMessage = useCallback((content: string) => {
  socket.emit('chat:message', {
    message: content.trim(),
    projectId: context.projectId,
    phaseId: context.phaseId || null,
    userId: user.id,
  })
}, [socket, context, user])

// Listen for response
socket.on('chat:response', handleResponse)
```

**React Query Pattern:**
```typescript
// Pattern from PhaseDetail.tsx (lines 13-20)
const { data: phase, isLoading, error } = useQuery({
  queryKey: ['phase', phaseId],
  queryFn: async () => {
    const { data } = await api.get<{ phase: Phase }>(`/phases/${phaseId}`)
    return data.phase
  },
  enabled: !!phaseId,
})
```

**Component Layout Pattern:**
```typescript
// Pattern from PhaseDetail.tsx (lines 104-270)
// Use bg-white shadow rounded-lg p-6 for sections
<div className="bg-white shadow rounded-lg p-6">
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-lg font-semibold text-gray-900">Section Title</h2>
  </div>
  {/* Content */}
</div>
```

**Error Handling Pattern:**
```typescript
// Pattern from PhaseDetail.tsx (lines 35-52)
if (error || !phase) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-medium">Error message</p>
        <button onClick={/* action */}>Action</button>
      </div>
    </div>
  )
}
```

**Agent Type Mapping:**
```typescript
// Backend pattern from registry.ts (lines 4-18)
// Maps PhaseType to appropriate agent instance
// ACCOMMODATION → AccommodationAgent
// TRAVEL, FOOD, ACTIVITIES → BaseAgent (for now)
```

---

## IMPLEMENTATION PLAN

### Phase 1: Create Phase Agent Chat Component

Create a specialized chat component that wraps ChatWindow and manages phase-specific agent context. This component will be embedded in PhaseDetail and automatically configure itself based on the phase type.

**Tasks:**
- Create `PhaseAgentChat.tsx` component that wraps ChatWindow
- Integrate useChat hook with phase-specific context
- Add agent type indicator UI based on phase type
- Handle socket connection state and errors
- Add loading states for initial connection

### Phase 2: Integrate Agent Chat into PhaseDetail

Add the agent chat component to the PhaseDetail page, positioned below the quotes section. Ensure the chat has access to phase and project context for the agent.

**Tasks:**
- Import and render PhaseAgentChat in PhaseDetail
- Pass phase and project data as props
- Add collapsible section UI for better space management
- Ensure socket connection on component mount
- Add visual indicator of which agent is active

### Phase 3: Agent Type Display and UX

Add UI elements that clearly indicate which agent is active and provide helpful context about agent capabilities.

**Tasks:**
- Display agent name based on phase type
- Add agent capability descriptions
- Show connection status indicator
- Add helpful starter prompts for each agent type
- Handle empty state with agent introduction

### Phase 4: Testing & Validation

Validate that all phase types correctly route to their agents and that chat functionality works end-to-end.

**Tasks:**
- Test chat with ACCOMMODATION phase (should use AccommodationAgent)
- Test chat with TRAVEL phase (should use BaseAgent for now)
- Test chat with FOOD phase (should use BaseAgent)
- Test error handling (disconnection, timeout)
- Verify message persistence in conversation history

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### CREATE project-pipeline/frontend/src/components/PhaseAgentChat.tsx

- **IMPLEMENT**: Phase-specific agent chat component that wraps ChatWindow
- **PATTERN**: Wraps existing ChatWindow component (ChatWindow.tsx:1-177)
- **IMPORTS**:
  ```typescript
  import { useEffect, useState } from 'react'
  import { Phase, Project } from '../types'
  import ChatWindow from './ChatWindow'
  import { useChat } from '../hooks/useChat'
  import { useSocket } from '../hooks/useSocket'
  import { useAuthStore } from '../store/authStore'
  ```
- **PROPS INTERFACE**:
  ```typescript
  interface PhaseAgentChatProps {
    phase: Phase
    project: Project
  }
  ```
- **FUNCTIONALITY**:
  - Initialize socket connection using useSocket hook
  - Set up chat context with phaseId and projectId
  - Use useChat hook with phase context
  - Render ChatWindow with messages and sendMessage callback
  - Display agent type indicator (e.g., "Accommodation Agent" for ACCOMMODATION phase)
  - Show connection status badge
  - Handle socket errors with user-friendly messages
- **AGENT NAME MAPPING**:
  ```typescript
  const agentNames: Record<string, string> = {
    ACCOMMODATION: 'Accommodation Agent',
    TRAVEL: 'Travel Agent',
    FOOD: 'Food & Meal Agent',
    ACTIVITIES: 'Activities Agent',
    EVENTS: 'Events Agent',
    // ... other phase types default to "Planning Assistant"
  }
  ```
- **VALIDATION**: Component renders without errors and displays agent name correctly
- **GOTCHA**: useChat requires socket to be connected before sending messages
- **GOTCHA**: Backend expects userId in chat:message event (check useChat.ts:86)

### UPDATE project-pipeline/frontend/src/pages/PhaseDetail.tsx

- **IMPLEMENT**: Add AI Agent section below Quotes section
- **PATTERN**: Follow existing section structure (PhaseDetail.tsx:272-362)
- **IMPORTS**:
  ```typescript
  import PhaseAgentChat from '../components/PhaseAgentChat'
  ```
- **LOCATION**: After Quotes section (after line 362), before closing div
- **SECTION STRUCTURE**:
  ```tsx
  {/* AI Agent Section */}
  <div className="bg-white shadow rounded-lg p-6 mt-6">
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
      <span className="text-sm text-gray-600">
        Ask about {phase.type.toLowerCase().replace(/_/g, ' ')} planning
      </span>
    </div>
    <div className="h-[500px]">
      <PhaseAgentChat phase={phase} project={phase.project!} />
    </div>
  </div>
  ```
- **VALIDATION**: Section renders on phase detail page below quotes
- **GOTCHA**: Ensure `phase.project` exists (it's included in the useQuery on line 141-150)
- **GOTCHA**: Non-null assertion `phase.project!` is safe because query includes project

### ADD Agent Capability Descriptions

- **IMPLEMENT**: Helper text in PhaseAgentChat showing what each agent can do
- **PATTERN**: Similar to SeedElaborationChat.tsx suggestions section (lines 126-158)
- **LOCATION**: Above ChatWindow in PhaseAgentChat component
- **CONTENT**:
  ```typescript
  const agentDescriptions: Record<string, string> = {
    ACCOMMODATION: 'Get hotel recommendations, budget optimization tips, and booking strategies',
    TRAVEL: 'Ask about transportation options, route planning, and group travel logistics',
    FOOD: 'Get meal planning suggestions, restaurant recommendations, and catering options',
    ACTIVITIES: 'Find activity ideas, venue suggestions, and scheduling tips',
    // Default for other types
  }
  ```
- **UI ELEMENT**:
  ```tsx
  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <p className="text-sm text-blue-800">
      <strong>{agentName}:</strong> {agentDescriptions[phase.type] || 'Ask questions about this phase'}
    </p>
  </div>
  ```
- **VALIDATION**: Description displays correctly for each phase type

### ADD Connection Status Indicator

- **IMPLEMENT**: Visual indicator of WebSocket connection status
- **PATTERN**: Use socket.connected from useSocket hook
- **LOCATION**: Top-right of agent section header in PhaseAgentChat
- **UI ELEMENT**:
  ```tsx
  <div className="flex items-center gap-2">
    {socket?.connected ? (
      <span className="flex items-center gap-1 text-sm text-green-600">
        <div className="w-2 h-2 bg-green-600 rounded-full"></div>
        Connected
      </span>
    ) : (
      <span className="flex items-center gap-1 text-sm text-red-600">
        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
        Disconnected
      </span>
    )}
  </div>
  ```
- **VALIDATION**: Status updates when connection state changes

### ADD Starter Prompts for Each Agent

- **IMPLEMENT**: Clickable starter prompt buttons to guide users
- **PATTERN**: Similar to suggestions in SeedElaborationChat (lines 132-157)
- **LOCATION**: Below agent description in PhaseAgentChat
- **CONTENT**:
  ```typescript
  const starterPrompts: Record<string, string[]> = {
    ACCOMMODATION: [
      'Find hotels for our group',
      'What are budget-friendly options?',
      'Show me hotels with conference facilities',
    ],
    TRAVEL: [
      'What are the transport options?',
      'Plan route from airport to hotel',
      'Compare travel costs',
    ],
    FOOD: [
      'Suggest restaurants for group dining',
      'What are local food options?',
      'Plan meal budget',
    ],
    // ... more phase types
  }
  ```
- **UI ELEMENT**:
  ```tsx
  {messages.length === 0 && (
    <div className="mb-4 space-y-2">
      <p className="text-xs font-medium text-gray-700">Quick Start:</p>
      {(starterPrompts[phase.type] || []).map((prompt, idx) => (
        <button
          key={idx}
          onClick={() => sendMessage(prompt)}
          className="block w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
        >
          {prompt}
        </button>
      ))}
    </div>
  )}
  ```
- **VALIDATION**: Clicking prompt sends message to agent

### HANDLE Empty State with Agent Introduction

- **IMPLEMENT**: Friendly welcome message when no messages exist
- **LOCATION**: Replace ChatWindow's default empty state
- **UI ELEMENT**:
  ```tsx
  {messages.length === 0 && (
    <div className="text-center py-8">
      <div className="mx-auto h-16 w-16 text-blue-600 mb-4">
        {/* Robot/AI icon */}
        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900">
        {agentName} Ready
      </h3>
      <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">
        {agentDescriptions[phase.type]}
      </p>
    </div>
  )}
  ```
- **VALIDATION**: Empty state shows agent introduction

### HANDLE Socket Connection Errors

- **IMPLEMENT**: Error boundary for socket connection failures
- **PATTERN**: Similar to phase loading error (PhaseDetail.tsx:35-52)
- **LOCATION**: In PhaseAgentChat component
- **ERROR HANDLING**:
  ```tsx
  const [connectionError, setConnectionError] = useState<string | null>(null)

  useEffect(() => {
    if (!socket) return

    const handleConnectError = (error: Error) => {
      setConnectionError('Failed to connect to AI assistant. Please refresh the page.')
    }

    const handleDisconnect = () => {
      setConnectionError('Connection lost. Attempting to reconnect...')
    }

    const handleConnect = () => {
      setConnectionError(null)
    }

    socket.on('connect_error', handleConnectError)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect', handleConnect)

    return () => {
      socket.off('connect_error', handleConnectError)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect', handleConnect)
    }
  }, [socket])

  if (connectionError) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <p className="text-yellow-800">{connectionError}</p>
      </div>
    )
  }
  ```
- **VALIDATION**: Error displays when socket fails to connect

### ADD Collapsible Section (Optional Enhancement)

- **IMPLEMENT**: Make AI Assistant section collapsible to save space
- **PATTERN**: Use React state for toggle
- **LOCATION**: Wrap AI Assistant section in PhaseDetail
- **FUNCTIONALITY**:
  ```tsx
  const [agentSectionOpen, setAgentSectionOpen] = useState(true)

  <div className="bg-white shadow rounded-lg p-6 mt-6">
    <div className="flex items-center justify-between mb-4 cursor-pointer" onClick={() => setAgentSectionOpen(!agentSectionOpen)}>
      <h2 className="text-lg font-semibold text-gray-900">AI Assistant</h2>
      <svg className={`w-5 h-5 transition-transform ${agentSectionOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </div>
    {agentSectionOpen && (
      <div className="h-[500px]">
        <PhaseAgentChat phase={phase} project={phase.project!} />
      </div>
    )}
  </div>
  ```
- **VALIDATION**: Section collapses and expands on header click

---

## TESTING STRATEGY

### Unit Tests (Optional for this feature)

Given the tight integration with existing components (ChatWindow, useChat), unit tests would be redundant. Focus on integration and manual testing.

### Integration Tests

**Test Chat with Different Phase Types:**
1. Create phases of type ACCOMMODATION, TRAVEL, FOOD, ACTIVITIES
2. Navigate to each phase detail page
3. Verify correct agent name displays
4. Send a test message
5. Verify agent responds appropriately

**Test Socket Connection:**
1. Load phase detail page
2. Verify connection status shows "Connected"
3. Disable network (dev tools)
4. Verify status changes to "Disconnected" and error displays
5. Re-enable network
6. Verify reconnection

### Manual Testing

**Accommodation Agent:**
- Navigate to ACCOMMODATION phase
- Click "Find hotels for our group" starter prompt
- Verify AccommodationAgent responds with hotel suggestions
- Try asking about budget options

**Travel Agent (BaseAgent fallback):**
- Navigate to TRAVEL phase
- Send message: "What transport options are available?"
- Verify BaseAgent responds (generic responses until TravelAgent implemented)

**UI/UX Testing:**
- Verify chat scrolls to bottom on new messages
- Verify typing indicator appears while waiting for response
- Verify messages persist in conversation
- Verify collapsible section works (if implemented)

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Type Checking

**Verify TypeScript types are correct:**

```bash
cd project-pipeline/frontend && npm run type-check
```

**Expected:** No TypeScript errors in new or modified files

**Why:** Ensures type safety for Phase, Project interfaces and socket event types

### Level 2: Linting

**Check code quality and style:**

```bash
cd project-pipeline/frontend && npm run lint
```

**Expected:** No linting errors in PhaseAgentChat.tsx or PhaseDetail.tsx

### Level 3: Build

**Verify frontend builds successfully:**

```bash
cd project-pipeline/frontend && npm run build
```

**Expected:** Build completes without errors

**Why:** Ensures all imports resolve and no runtime errors in production build

### Level 4: Backend Running

**Ensure backend and WebSocket server are running:**

```bash
cd project-pipeline/backend && npm run dev
```

**Expected:** Server starts on port 4000, WebSocket initialized

**Check logs for:**
- `🚀 Server running on http://localhost:4000`
- `🔌 WebSocket ready on ws://localhost:4000`
- `✅ WebSocket server initialized with authentication`

### Level 5: Frontend Running

**Start frontend dev server:**

```bash
cd project-pipeline/frontend && npm run dev
```

**Expected:** Dev server starts on port 5173 (or configured port)

### Level 6: Manual E2E Validation

**Step 1: Login**
1. Navigate to http://localhost:5173/login
2. Login with test credentials
3. Verify authentication successful

**Step 2: Navigate to Phase Detail**
1. Go to Dashboard
2. Select a project
3. Click on a phase (preferably ACCOMMODATION type)
4. Verify phase detail page loads

**Step 3: Verify AI Assistant Section**
1. Scroll to "AI Assistant" section
2. Verify section renders below Quotes
3. Check agent name displays (e.g., "Accommodation Agent")
4. Check connection status shows "Connected" (green dot)

**Step 4: Send Message**
1. Click a starter prompt OR type a message
2. Verify message appears immediately in chat
3. Verify typing indicator appears
4. Verify AI response appears after few seconds
5. Verify response is contextual to the phase type

**Step 5: Test Different Phase Types**
1. Navigate to TRAVEL phase
2. Verify "Travel Agent" displays
3. Send test message, verify response
4. Repeat for FOOD and ACTIVITIES phases

**Step 6: Test Error Handling**
1. Open DevTools Network tab
2. Disable network (Offline mode)
3. Verify connection status changes to "Disconnected" (red dot)
4. Verify error message displays
5. Re-enable network
6. Verify reconnection and status updates

**Step 7: Test Collapsible Section (if implemented)**
1. Click on AI Assistant header
2. Verify section collapses
3. Click again, verify it expands
4. Verify chat state persists

---

## ACCEPTANCE CRITERIA

- [x] Phase detail page displays "AI Assistant" section
- [x] Agent type correctly matches phase type (ACCOMMODATION → Accommodation Agent, etc.)
- [x] Can send messages to agent via chat interface
- [x] Agent responds with contextual assistance
- [x] Connection status indicator shows current socket state
- [x] Starter prompts provide quick-start guidance
- [x] Typing indicator appears while waiting for response
- [x] Error handling displays user-friendly messages
- [x] Chat interface is responsive and scrolls properly
- [x] Agent name and description are visible and accurate
- [x] No TypeScript or linting errors
- [x] Frontend builds successfully
- [x] Backend WebSocket connections work correctly

---

## COMPLETION CHECKLIST

- [ ] Created PhaseAgentChat.tsx component
- [ ] Integrated agent chat into PhaseDetail.tsx
- [ ] Added agent type indicator and descriptions
- [ ] Added connection status indicator
- [ ] Added starter prompts for each agent type
- [ ] Added empty state with agent introduction
- [ ] Implemented socket error handling
- [ ] (Optional) Implemented collapsible section
- [ ] All TypeScript checks pass
- [ ] All linting checks pass
- [ ] Frontend builds without errors
- [ ] Backend WebSocket server runs correctly
- [ ] Manual testing confirms all phase types work
- [ ] Manual testing confirms chat functionality works
- [ ] Manual testing confirms error handling works
- [ ] Acceptance criteria all met

---

## NOTES

**Design Decisions:**

1. **No New Backend Code**: The existing ChatService and agent registry already handle phase-based routing. The `chat:message` event with `phaseId` automatically selects the correct agent via `getAgentForPhaseType()`.

2. **Reuse Existing Components**: ChatWindow and useChat are already well-tested and production-ready. PhaseAgentChat acts as a thin wrapper that provides phase-specific context and UI enhancements.

3. **Agent Fallback**: For phase types without specialized agents (TRAVEL, FOOD, ACTIVITIES), the BaseAgent is used. This provides basic conversational AI until specialized agents are implemented in future iterations.

4. **WebSocket Over HTTP**: Chat uses WebSocket (socket.io) for real-time bidirectional communication, consistent with the existing architecture. HTTP REST API would be less suitable for chat use cases.

5. **Connection Resilience**: socket.io handles reconnection automatically (configured in socket.ts:38-40). The UI displays connection state but relies on library for reconnection logic.

**Trade-offs:**

- **Collapsible Section**: Optional because it adds complexity. Consider user feedback - if the 500px chat height is intrusive, implement collapsibility.

- **Message Persistence**: Messages are stored in AIConversation table (backend) but the component doesn't load history on mount. Future enhancement could load conversation history from database.

- **Agent Capabilities**: Currently only AccommodationAgent has specialized capabilities (hotel research, web scraping). Other agents return generic responses until specialized implementations are added.

**Future Enhancements:**

1. Implement specialized TravelAgent, FoodAgent, ActivitiesAgent classes
2. Add conversation history loading on component mount
3. Add "Research" button for agents with research capability (like AccommodationAgent)
4. Add file/image upload for agents to analyze documents
5. Add voice input using Web Speech API
6. Add agent suggestions/actions (e.g., "Book this hotel" button in chat)

**Known Limitations:**

- AccommodationAgent's web scraping may be slow (10-30 seconds) - consider adding progress indicators
- BaseAgent responses are generic and may not provide phase-specific value
- No conversation history loaded from database (fresh chat each time page loads)
- No multi-turn conversation memory optimization (all messages sent to LLM each time)
