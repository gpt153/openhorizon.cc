# Feature: Fix WebSocket message sending - Backend/Frontend event mismatch

The following plan should be complete, but it's important that you validate documentation and codebase patterns and task sanity before you start implementing.

Pay special attention to naming of existing utils types and models. Import from the right files etc.

## Feature Description

Fix critical P0 bug where AI Chat messages are not being sent from frontend to backend. The root cause is a data structure mismatch between the frontend Socket.IO event emission and backend event listener expectations. Frontend emits `{ content, projectId, phaseId }` but backend expects `{ message, userId, projectId, phaseId, conversationId }`.

## User Story

As a user of the AI Chat feature
I want to send messages and receive AI responses
So that I can get help with project planning, budgets, and other project-related questions

## Problem Statement

**Critical Bug (P0)**: Chat messages typed in the textarea don't get sent to the backend despite WebSocket connection showing "Connected" status. Clicking the Send button has no effect - messages remain in the textarea and no WebSocket events are emitted to the backend.

**Root Cause Analysis**:
1. **Event Data Mismatch**: Frontend `useChat` hook (line 70-74 in `useChat.ts`) emits:
   ```typescript
   socket.emit('chat:message', {
     content: content.trim(),    // ❌ Backend expects "message"
     projectId: context?.projectId,
     phaseId: context?.phaseId,
     // ❌ Missing: userId, conversationId
   })
   ```

2. **Backend Expects Different Structure** (line 31, 58-64 in `chat.service.ts`):
   ```typescript
   socket.on('chat:message', async (data: {
     phaseId: string       // ❌ Required but may be undefined
     projectId: string     // ❌ Required but may be undefined
     userId: string        // ❌ Missing from frontend
     message: string       // ❌ Frontend sends "content"
     conversationId?: string
   })
   ```

3. **Backend Service Requires Phase Context**: The `handleChatMessage` assumes phase-based conversations and will fail if `phaseId` is undefined (lines 83-90 check for phase, but frontend allows general chat without phase).

4. **Port Configuration Mismatch**:
   - Vite proxy forwards `/socket.io` to `http://localhost:3000` (vite.config.ts line 21-25)
   - Backend runs on port 3000 (env.PORT default, app.ts line 93)
   - Frontend socket.ts tries to connect to `http://localhost:4000` (line 4)
   - **This causes WebSocket connection to fail despite "Connected" status**

## Solution Statement

**Multi-layered fix**:
1. **Fix Event Data Structure**: Update frontend to send `message` instead of `content`, include `userId` from auth store
2. **Fix Backend to Support General Chat**: Make `phaseId` optional, add general chat flow when no phase context
3. **Fix Port Configuration**: Update frontend socket connection to use correct backend port (3000 not 4000)
4. **Fix Backend Event Response**: Update backend to emit `content` in response (frontend expects `data.content`, backend sends `message`)
5. **Add Comprehensive Logging**: Add console.log statements to debug WebSocket events on both sides

## Feature Metadata

**Feature Type**: Bug Fix
**Estimated Complexity**: Medium
**Primary Systems Affected**:
- Frontend: `useChat` hook, socket initialization
- Backend: `chat.service` event handlers, WebSocket setup

**Dependencies**:
- socket.io-client: ^4.8.3
- socket.io: ^4.8.3
- React Context (auth store for userId)

**GitHub Workflow:**
- **Branch Name**: `issue-65` (already created)
- **PR Title**: `fix: WebSocket message sending - resolve backend/frontend event mismatch`
- **Linked Issue**: #65

---

## CONTEXT REFERENCES

### Relevant Codebase Files - IMPORTANT: YOU MUST READ THESE FILES BEFORE IMPLEMENTING!

- `frontend/src/hooks/useChat.ts` (lines 45-80) - **PRIMARY**: Contains sendMessage function with incorrect event structure
- `frontend/src/lib/socket.ts` (lines 1-71) - **PRIMARY**: Socket initialization with wrong port (4000 instead of 3000)
- `frontend/src/store/authStore.ts` - **REQUIRED**: Need to import user data to get userId
- `backend/src/ai/chat.service.ts` (lines 20-149) - **PRIMARY**: Event handler expecting different structure
- `backend/src/websocket.ts` (lines 1-19) - WebSocket server setup
- `frontend/vite.config.ts` (lines 15-26) - Proxy configuration showing correct port is 3000
- `backend/src/config/env.ts` (lines 1-57) - Environment configuration with PORT default
- `backend/src/app.ts` (lines 90-103) - Server startup showing WebSocket setup

### New Files to Create

None - this is a bug fix modifying existing files only

### Relevant Documentation - YOU SHOULD READ THESE BEFORE IMPLEMENTING!

- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
  - Specific section: Emitting events
  - Why: Need to understand event emission patterns
- [Socket.IO Server API](https://socket.io/docs/v4/server-api/)
  - Specific section: Handling events
  - Why: Need to understand event handler patterns
- [React Hooks Best Practices](https://react.dev/reference/react)
  - Specific section: useCallback dependencies
  - Why: Ensure socket events have correct dependencies

### Patterns to Follow

**Event Naming Convention** (from codebase):
```typescript
// Pattern: namespace:action
'chat:message'         // User sends message
'chat:response'        // AI response (complete)
'chat:response:chunk'  // AI streaming response
'chat:typing'          // Typing indicator
'chat:error'           // Error handling
```

**Error Handling Pattern** (from chat.service.ts lines 34-38):
```typescript
try {
  await this.handleChatMessage(socket, data)
} catch (error: any) {
  socket.emit('chat:error', {
    error: error.message || 'Failed to process message'
  })
}
```

**Auth Store Access Pattern** (need to find in authStore.ts):
```typescript
// Typically Zustand pattern
const { user, token } = useAuthStore()
// Access user.id for userId
```

**Logging Pattern** (from backend app.ts and websocket.ts):
```typescript
console.log('✅ Success message')
console.log('🔌 WebSocket specific message')
console.log('Client connected:', socket.id)
```

**Optional Context Pattern** (solution approach):
```typescript
// Support both phase-based and general chat
if (phaseId) {
  // Phase-specific chat with AI agent
} else {
  // General chat fallback
}
```

---

## IMPLEMENTATION PLAN

### Phase 1: Foundation - Understand Current State

Review all relevant files to understand:
- Current event structure on both ends
- Auth store structure for accessing userId
- Port configuration across environment
- Existing error handling patterns

### Phase 2: Fix Port Configuration

Fix the port mismatch between frontend socket connection and backend server. This is critical as it may be causing connection issues.

**Tasks:**
- Update frontend socket.ts to use correct backend port (3000)
- Verify Vite proxy configuration is correct
- Add logging to confirm connection

### Phase 3: Fix Event Data Structure

Align frontend event emission with backend expectations, and vice versa for responses.

**Tasks:**
- Update frontend `useChat` hook to send correct event structure
- Import userId from auth store
- Update backend to emit responses with correct structure
- Make backend support optional phaseId for general chat

### Phase 4: Add Comprehensive Debugging

Add detailed logging to both frontend and backend to diagnose any remaining issues.

**Tasks:**
- Add console.log in frontend when emitting events
- Add console.log in backend when receiving events
- Add console.log for WebSocket connection lifecycle

### Phase 5: Testing & Validation

Test the complete flow end-to-end with different scenarios.

**Tasks:**
- Test general chat (no project/phase context)
- Test project-specific chat
- Test phase-specific chat
- Verify error handling
- Run existing Playwright tests

---

## STEP-BY-STEP TASKS

IMPORTANT: Execute every task in order, top to bottom. Each task is atomic and independently testable.

### Task 1: READ authStore.ts to understand user data structure

- **ACTION**: READ
- **FILE**: `frontend/src/store/authStore.ts`
- **PURPOSE**: Understand how to access userId and user object
- **PATTERN**: Zustand store pattern
- **VALIDATE**: Confirm user object has `id` field

### Task 2: UPDATE frontend socket connection port

- **ACTION**: UPDATE
- **FILE**: `frontend/src/lib/socket.ts`
- **IMPLEMENT**: Change line 4 from `'http://localhost:4000'` to `'http://localhost:3000'`
- **WHY**: Backend runs on port 3000 (see env.ts default, app.ts line 93), Vite proxy forwards to 3000
- **GOTCHA**: This mismatch may be why WebSocket shows "Connected" but doesn't work - connecting to wrong port
- **VALIDATE**:
  ```bash
  grep -n "localhost:3000" frontend/src/lib/socket.ts
  ```

### Task 3: ADD debug logging to socket initialization

- **ACTION**: ADD
- **FILE**: `frontend/src/lib/socket.ts`
- **IMPLEMENT**: Add console.log after socket creation (after line 33):
  ```typescript
  console.log('🔌 Socket initialized:', {
    url: SOCKET_URL,
    auth: !!token,
    transports: ['websocket', 'polling']
  })
  ```
- **WHY**: Debug connection issues
- **VALIDATE**: Start frontend and check console logs

### Task 4: UPDATE useChat hook to send correct event structure

- **ACTION**: UPDATE
- **FILE**: `frontend/src/hooks/useChat.ts`
- **IMPLEMENT**:
  1. Import auth store at top:
     ```typescript
     import { useAuthStore } from '../store/authStore'
     ```
  2. Get user from auth store inside useChat function (after line 42):
     ```typescript
     const { user } = useAuthStore()
     ```
  3. Update sendMessage socket.emit (lines 70-74) to:
     ```typescript
     socket.emit('chat:message', {
       message: content.trim(),           // Changed from 'content'
       projectId: context?.projectId,
       phaseId: context?.phaseId,
       userId: user?.id || '',            // Added userId
       conversationId: undefined,         // Explicitly optional
     })
     ```
  4. Add debug logging after emit:
     ```typescript
     console.log('📤 Sent chat message:', {
       messageLength: content.trim().length,
       projectId: context?.projectId,
       phaseId: context?.phaseId,
       userId: user?.id
     })
     ```
- **PATTERN**: Match backend expectation from chat.service.ts lines 58-64
- **GOTCHA**: Don't forget to add `user` to sendMessage's useCallback dependencies (line 79)
- **VALIDATE**:
  ```bash
  grep -A 5 "socket.emit('chat:message'" frontend/src/hooks/useChat.ts
  ```

### Task 5: UPDATE backend chat:response event to use 'content' not 'message'

- **ACTION**: UPDATE
- **FILE**: `backend/src/ai/chat.service.ts`
- **IMPLEMENT**: Update line 138 from:
  ```typescript
  socket.emit('chat:response', {
    conversationId: conversation.id,
    message: responseContent,  // ❌ Frontend expects 'content'
    timestamp: new Date()
  })
  ```
  to:
  ```typescript
  socket.emit('chat:response', {
    conversationId: conversation.id,
    content: responseContent,  // ✅ Now matches frontend expectation
    messageId: conversation.id,
    timestamp: new Date()
  })
  ```
- **WHY**: Frontend useChat.ts line 97 expects `data.content`, not `data.message`
- **VALIDATE**:
  ```bash
  grep -A 5 "chat:response" backend/src/ai/chat.service.ts
  ```

### Task 6: UPDATE backend handleChatMessage to support optional phaseId

- **ACTION**: UPDATE
- **FILE**: `backend/src/ai/chat.service.ts`
- **IMPLEMENT**:
  1. Update type definition (line 58) to make phaseId and projectId optional:
     ```typescript
     private async handleChatMessage(socket: Socket, data: {
       phaseId?: string      // Made optional
       projectId?: string    // Made optional
       userId: string
       message: string
       conversationId?: string
     })
     ```
  2. Update variable extraction (line 65):
     ```typescript
     const { phaseId, projectId, userId, message, conversationId } = data
     ```
  3. Replace phase-only logic (lines 83-93) with conditional handling:
     ```typescript
     // Get phase and project context if provided
     let phase = null
     let project = null

     if (phaseId) {
       phase = await prisma.phase.findUnique({
         where: { id: phaseId },
         include: { project: true }
       })

       if (!phase) {
         throw new Error('Phase not found')
       }

       project = phase.project
     } else if (projectId) {
       project = await prisma.project.findUnique({
         where: { id: projectId }
       })

       if (!project) {
         throw new Error('Project not found')
       }
     }

     // Get appropriate agent (or default for general chat)
     const agent = phase ? getAgentForPhaseType(phase.type) : getAgentForPhaseType('GENERAL') // Need default agent
     ```
- **GOTCHA**: May need to create a default/general agent if one doesn't exist
- **WHY**: Frontend allows general chat without project/phase context
- **VALIDATE**: Check if GENERAL phase type exists or need fallback

### Task 7: CHECK for default/general AI agent

- **ACTION**: READ
- **FILE**: `backend/src/ai/agents/registry.ts`
- **PURPOSE**: Check if there's a default agent for general chat
- **CONDITIONAL**:
  - If no default exists, update getAgentForPhaseType to return a basic chat agent for undefined type
  - Or import and use a basic agent (like AccommodationAgent) as fallback
- **VALIDATE**: Ensure agent selection won't crash for general chat

### Task 8: ADD comprehensive logging to backend chat handler

- **ACTION**: ADD
- **FILE**: `backend/src/ai/chat.service.ts`
- **IMPLEMENT**: Add logging throughout handleChatMessage:
  1. At start of function (after line 65):
     ```typescript
     console.log('📥 Received chat message:', {
       userId,
       messageLength: message.length,
       hasPhase: !!phaseId,
       hasProject: !!projectId,
       hasConversation: !!conversationId
     })
     ```
  2. Before emitting response (before line 138):
     ```typescript
     console.log('📤 Sending chat response:', {
       conversationId: conversation.id,
       responseLength: responseContent.length
     })
     ```
  3. In error handler (line 36):
     ```typescript
     console.error('❌ Chat error:', error.message)
     ```
- **WHY**: Debug backend event handling
- **VALIDATE**: Run backend and check console logs

### Task 9: ADD logging to WebSocket connection handler

- **ACTION**: ADD
- **FILE**: `backend/src/ai/chat.service.ts`
- **IMPLEMENT**: Update connection handler (line 22):
  ```typescript
  console.log('✅ Client connected:', {
    socketId: socket.id,
    transport: socket.conn.transport.name
  })
  ```
- **WHY**: Confirm WebSocket connection details
- **VALIDATE**: Check backend logs when frontend connects

### Task 10: VERIFY environment configuration

- **ACTION**: READ
- **FILE**: `backend/.env`
- **PURPOSE**: Confirm PORT=3000 or uses default
- **VALIDATE**:
  ```bash
  grep PORT backend/.env || echo "Using default PORT=3000"
  ```

### Task 11: TEST manual WebSocket connection

- **ACTION**: VALIDATE
- **COMMAND**:
  ```bash
  # Start backend
  cd backend && npm run dev &

  # Wait for startup
  sleep 3

  # Check if WebSocket is listening on port 3000
  curl -I http://localhost:3000/socket.io/
  ```
- **EXPECTED**: Should return 400 or 403 (connection requires upgrade), not connection refused
- **WHY**: Verify WebSocket server is accessible

### Task 12: TEST frontend build

- **ACTION**: VALIDATE
- **COMMAND**:
  ```bash
  cd frontend && npm run build
  ```
- **EXPECTED**: Build succeeds with no TypeScript errors
- **WHY**: Ensure changes don't break TypeScript compilation

### Task 13: RUN Playwright chat tests

- **ACTION**: VALIDATE
- **COMMAND**:
  ```bash
  cd frontend && npm run test -- tests/chat.spec.ts
  ```
- **EXPECTED**: Tests pass (especially "should send a message" and "should receive AI response")
- **WHY**: End-to-end validation of chat functionality
- **GOTCHA**: May need to start backend first: `cd backend && npm run dev &`

### Task 14: MANUAL TEST - General chat (no context)

- **ACTION**: MANUAL VALIDATION
- **STEPS**:
  1. Start backend: `cd backend && npm run dev`
  2. Start frontend: `cd frontend && npm run dev`
  3. Navigate to http://localhost:5173/chat
  4. Verify connection status shows "Connected"
  5. Leave project selector on "General Chat (no project)"
  6. Type message: "Hello, test message"
  7. Click Send button
  8. Verify:
     - Message appears in chat window
     - Input clears
     - Typing indicator appears
     - AI response is received
  9. Check browser console for debug logs
  10. Check backend console for received event logs
- **EXPECTED**: Message sent successfully, appears in chat, AI responds

### Task 15: MANUAL TEST - Project context chat

- **ACTION**: MANUAL VALIDATION
- **STEPS**:
  1. Select a project from dropdown
  2. Verify context badge shows "Chatting about Project (...)"
  3. Send message: "What is the budget for this project?"
  4. Verify message sent and response received
- **EXPECTED**: Message includes projectId in event, backend processes correctly

### Task 16: MANUAL TEST - Phase context chat

- **ACTION**: MANUAL VALIDATION
- **STEPS**:
  1. Navigate to a specific phase page (if exists)
  2. Open chat with phase context
  3. Send message
  4. Verify phase-specific agent is used
- **EXPECTED**: Message includes phaseId, appropriate agent responds
- **NOTE**: This may require navigation to a phase detail page, not just /chat

---

## TESTING STRATEGY

Testing must cover three scenarios:

### Unit Tests

No new unit tests required - this is integration-level bug fix. However:
- Verify existing tests still pass
- Playwright tests in `frontend/tests/chat.spec.ts` should validate the fix

### Edge Cases

1. **No Auth**: What happens if user is not authenticated?
   - Should be prevented by route guards, but verify socket.emit doesn't crash

2. **Empty Message**: Sending empty/whitespace-only message
   - Already handled by useChat line 52-54

3. **WebSocket Disconnection**: Send message while disconnected
   - Already handled by useChat lines 47-50

4. **Missing Phase/Project**: Backend receives phaseId that doesn't exist
   - Already handled by backend error handling (lines 88-90, updated to throw error)

5. **Slow AI Response**: Long-running AI generation
   - Typing indicator should show (line 77 sets isTyping true)

6. **Backend Restart**: WebSocket disconnection/reconnection
   - Handled by socket.io reconnection logic (socket.ts lines 38-39)

### Browser Console Validation

After implementation, browser console should show:
```
🔌 Socket initialized: { url: 'http://localhost:3000', auth: true, transports: [...] }
📤 Sent chat message: { messageLength: 15, projectId: 'abc123', phaseId: undefined, userId: 'user123' }
```

Backend console should show:
```
✅ Client connected: { socketId: 'xyz789', transport: 'websocket' }
📥 Received chat message: { userId: 'user123', messageLength: 15, hasPhase: false, hasProject: true, hasConversation: false }
📤 Sending chat response: { conversationId: 'conv123', responseLength: 245 }
```

---

## VALIDATION COMMANDS

Execute every command to ensure zero regressions and 100% feature correctness.

### Level 1: Syntax & Style

```bash
# Frontend TypeScript type checking
cd frontend && npm run build

# Backend TypeScript type checking
cd backend && npm run build
```

**Expected**: All commands pass with exit code 0, no type errors

### Level 2: Integration Tests

```bash
# Start backend
cd backend && npm run dev &
BACKEND_PID=$!
sleep 5

# Run Playwright chat tests
cd frontend && npm run test -- tests/chat.spec.ts

# Cleanup
kill $BACKEND_PID
```

**Expected**: All chat tests pass, especially:
- "should send a message"
- "should receive AI response"
- "should show connection status indicator"

### Level 3: Manual Validation

Follow manual test procedures in Tasks 14-16.

**Checklist**:
- [ ] General chat works (no project/phase)
- [ ] Project context chat works
- [ ] Messages appear in chat window
- [ ] Input clears after sending
- [ ] Typing indicator shows
- [ ] AI responses are received
- [ ] Debug logs appear in browser console
- [ ] Debug logs appear in backend console
- [ ] WebSocket connection status shows "Connected"

### Level 4: Network Validation

```bash
# With both frontend and backend running, check WebSocket frames in DevTools:
# 1. Open browser DevTools -> Network tab
# 2. Filter by "WS" (WebSocket)
# 3. Click on socket.io connection
# 4. Go to "Messages" tab
# 5. Send a chat message
# 6. Verify frames:
#    - Outgoing: ["chat:message", {"message":"...","projectId":"...","userId":"..."}]
#    - Incoming: ["chat:response", {"content":"...","messageId":"..."}]
```

**Expected**: WebSocket frames show correct event structure on both send and receive

---

## PULL REQUEST TEMPLATE

The execution agent should use this template when creating the PR:

```markdown
## Summary

Fixes #65 - AI Chat messages not sending due to WebSocket event data mismatch

**Root Causes Fixed**:
1. ❌ Port mismatch: Frontend connected to `localhost:4000`, backend ran on `localhost:3000`
2. ❌ Event structure: Frontend sent `content`, backend expected `message`
3. ❌ Missing userId: Frontend didn't include user authentication data
4. ❌ Backend response: Backend sent `message`, frontend expected `content`
5. ❌ Required phase: Backend required phaseId, but general chat has none

## Changes

### Frontend (`frontend/src/`)
- **lib/socket.ts**: Fixed port from 4000 to 3000, added debug logging
- **hooks/useChat.ts**:
  - Fixed event data structure (`content` → `message`)
  - Added userId from auth store
  - Added debug logging
  - Updated useCallback dependencies

### Backend (`backend/src/ai/`)
- **chat.service.ts**:
  - Made phaseId and projectId optional in handleChatMessage
  - Added support for general chat without phase/project context
  - Fixed response event structure (`message` → `content`, added `messageId`)
  - Added comprehensive debug logging
  - Added error logging

## Testing

### Automated Tests
- ✅ Frontend build (`npm run build`)
- ✅ Backend build (`npm run build`)
- ✅ Playwright chat tests (`tests/chat.spec.ts`)

### Manual Testing
- ✅ General chat (no project/phase context)
- ✅ Project-specific chat
- ✅ Message sending and receiving
- ✅ Typing indicators
- ✅ Error handling
- ✅ WebSocket connection status
- ✅ Browser console debug logs
- ✅ Backend console debug logs

### Network Validation
- ✅ WebSocket frames show correct event structure
- ✅ Events emit with proper data format
- ✅ Responses received with correct structure

## Validation

All validation commands passed:
- ✅ Frontend TypeScript compilation
- ✅ Backend TypeScript compilation
- ✅ Playwright integration tests
- ✅ Manual end-to-end testing
- ✅ WebSocket network inspection

## Related

- Implementation Plan: `.agents/plans/fix-websocket-message-sending.md`
- Issue: #65 - AI Chat messages not sending

## Deployment Notes

No environment variable changes required. Uses existing:
- `PORT` (default: 3000)
- `VITE_SOCKET_URL` (not currently set, defaults to localhost:3000 now)

---

🤖 Generated with Remote Coding Agent
```

---

## ACCEPTANCE CRITERIA

- [x] Root cause identified and documented
- [ ] Port configuration fixed (frontend connects to correct backend port)
- [ ] Event data structure aligned between frontend and backend
- [ ] UserId included in chat messages from auth store
- [ ] Backend supports optional phaseId for general chat
- [ ] Backend emits responses with correct structure (content not message)
- [ ] Comprehensive debug logging added to both frontend and backend
- [ ] Frontend build passes with no TypeScript errors
- [ ] Backend build passes with no TypeScript errors
- [ ] Playwright chat tests pass (especially send/receive tests)
- [ ] Manual testing confirms:
  - [ ] General chat works (no context)
  - [ ] Project-specific chat works
  - [ ] Messages send and appear in chat
  - [ ] AI responses are received
  - [ ] Typing indicators work
  - [ ] Error handling works
  - [ ] Connection status accurate
- [ ] WebSocket frames inspected and validated
- [ ] Debug logs visible in both browser and backend console
- [ ] No regressions in existing chat functionality
- [ ] **Feature branch committed with all changes**
- [ ] **Pull request created with comprehensive description**

---

## COMPLETION CHECKLIST

- [ ] All 16 tasks completed in order
- [ ] Each task validation passed immediately
- [ ] All validation commands executed successfully:
  - [ ] Level 1: Frontend build, backend build
  - [ ] Level 2: Playwright chat tests
  - [ ] Level 3: Manual validation (general, project, phase chat)
  - [ ] Level 4: Network WebSocket frame inspection
- [ ] All acceptance criteria met
- [ ] Code reviewed for quality and maintainability
- [ ] Debug logging sufficient for future troubleshooting
- [ ] Error handling covers edge cases
- [ ] **Pull request created and linked to issue #65**

---

## NOTES

### Critical Discoveries During Analysis

1. **Port Mismatch Root Cause**: The most likely primary issue - frontend socket.ts connects to port 4000, but:
   - Backend runs on port 3000 (env.PORT default)
   - Vite proxy forwards to localhost:3000
   - This causes connection to fail or connect to wrong service

2. **Event Structure Mismatch**: Secondary issue - even if connected, data wouldn't flow correctly:
   - Frontend sends `content`, backend expects `message`
   - Backend sends `message`, frontend expects `content`
   - Frontend missing required `userId` field

3. **Backend Assumes Phase Context**: Tertiary issue - backend assumes all chats are phase-specific:
   - General chat (no project/phase) would crash backend
   - Frontend allows selecting "General Chat (no project)"
   - Need to make phaseId optional and add fallback agent

4. **Socket.IO Library Versions**: Both using v4.8.3, so no compatibility issues

5. **Authentication**: Auth happens at socket connection level via JWT token, so userId still needs to be included in message event for backend processing

### Design Decisions

- **Keep Debug Logging**: Leave comprehensive logging in place (not just for debugging) to help with future troubleshooting
- **Make Context Optional**: Backend should support general, project-only, and phase-specific chats
- **Preserve Existing APIs**: Don't change event names, only data structure to minimize breaking changes
- **Use Existing Auth Store**: Don't create new auth passing mechanism, use existing Zustand store

### Trade-offs

- **General Chat Agent**: May need to implement or designate a default agent for general chats without phase context
  - Alternative: Return friendly error "Please select a project for AI assistance"
  - Decision: Support general chat for better UX

### Future Improvements (Not in Scope)

- Add conversation persistence (load previous messages on page load)
- Add message edit/delete functionality
- Add file upload support for chat
- Add streaming response support (backend has chat:response:chunk event but not used)
- Add typing indicator from user to other connected users
- Add read receipts
- Migrate to dedicated WebSocket port instead of sharing with HTTP server
