# Root Cause Analysis

**Issue**: Prisma error - findUnique with undefined id at chat.service.ts:83
**Root Cause**: Frontend-backend contract mismatch - frontend sends wrong field names and missing required fields
**Severity**: Critical
**Confidence**: High - proven with test execution and git history analysis

## Evidence Chain

### The Path from Symptom to Cause

**SYMPTOM**: Prisma throws error "findUnique with undefined id" at chat.service.ts:83

↓ **BECAUSE**: The `phaseId` variable is `undefined` when passed to Prisma

**Evidence**: `chat.service.ts:83-86`
```typescript
const phase = await prisma.phase.findUnique({
  where: { id: phaseId },  // phaseId is undefined
  include: { project: true }
})
```

---

**WHY**: `phaseId` is `undefined` in the `handleChatMessage` function parameters

↓ **BECAUSE**: The `data` object received from the socket doesn't have a `phaseId` property, OR it exists but is `undefined`

**Evidence**: `chat.service.ts:58-65`
```typescript
private async handleChatMessage(socket: Socket, data: {
  phaseId: string        // Expected to be string
  projectId: string      // Expected to be string
  userId: string         // Expected to be string
  message: string        // Expected to be string
  conversationId?: string
}) {
  const { phaseId, projectId, userId, message, conversationId } = data
  // If data.phaseId is undefined, phaseId will be undefined
```

---

**WHY**: The socket client sends data with wrong field names and missing fields

↓ **BECAUSE**: Frontend `useChat.ts` sends different field names than backend expects

**Evidence**: `frontend/src/hooks/useChat.ts:70-74`
```typescript
socket.emit('chat:message', {
  content: content.trim(),      // ❌ Backend expects 'message'
  projectId: context?.projectId,
  phaseId: context?.phaseId,    // ⚠️ Can be undefined
})
// ❌ Backend also expects 'userId' but frontend doesn't send it
```

**Test Verification**:
```bash
$ node test-socket-payload.js
Frontend sends: { content: 'Hello', projectId: 'test-project', phaseId: undefined }
Backend expects: {
  message: 'Hello',
  projectId: 'test-project',
  phaseId: 'test-phase',
  userId: 'test-user'
}

Mismatch 1: Frontend sends 'content', backend expects 'message'
Mismatch 2: Frontend doesn't send 'userId' at all
Mismatch 3: phaseId can be undefined from frontend
```

---

**WHY**: Frontend and backend were developed at different times without enforcing contract

↓ **ROOT CAUSE**: API contract mismatch between frontend and backend socket handlers

**Evidence**: Git history shows:
- Backend `chat.service.ts` created in commit `fbb38ffd` (Jan 5, 2026)
- Frontend `useChat.ts` created in commit `c59e1e64` (Jan 8, 2026)
- 3 days apart, different implementations
- No shared TypeScript interface between frontend/backend
- No validation layer to catch the mismatch

**Files affected**:
- `project-pipeline/backend/src/ai/chat.service.ts:58-65` - Expects wrong fields
- `project-pipeline/frontend/src/hooks/useChat.ts:70-74` - Sends wrong fields

### Alternative Hypotheses Considered

**Hypothesis 1**: Database issue (phase doesn't exist)
- ❌ RULED OUT: Error occurs before database query executes
- Evidence: Prisma throws validation error for undefined ID before hitting DB

**Hypothesis 2**: Context not set properly in frontend
- ⚠️ PARTIAL: While context CAN be undefined, the bigger issue is field name mismatch
- Evidence: Even when context is set, 'content' vs 'message' mismatch would cause issues

**Hypothesis 3**: Socket.io middleware transforming data
- ❌ RULED OUT: No middleware found
- Evidence: `grep -r "chat:message" project-pipeline/backend` shows only one handler

### Git History Context

**Backend chat.service.ts:**
- **Introduced**: `fbb38ffd` - "Project Pipeline Complete - Ready for Production (#35)" - 2026-01-05
- **Author**: gpt153
- **Recent changes**: No changes to this file since introduction
- **Implication**: Original implementation, not a regression

**Frontend useChat.ts:**
- **Introduced**: `c59e1e64` - "Pipeline Management Frontend UI (#48)" - 2026-01-08
- **Author**: gpt153
- **Recent changes**: No changes since introduction
- **Implication**: Frontend was created 3 days after backend with incompatible contract

**Timeline Analysis**:
```
Jan 5, 2026:  Backend created - expects { message, projectId, phaseId, userId }
Jan 8, 2026:  Frontend created - sends { content, projectId, phaseId }
              ↑ Contract mismatch introduced here
```

This is an **original bug** introduced when the frontend was developed without referencing the backend's expected interface.

## Fix Specification

### What Needs to Change

**Option A: Fix Frontend (Recommended)**
Modify `project-pipeline/frontend/src/hooks/useChat.ts` to send the correct field names that the backend expects.

**Why Option A?**
- Backend interface is more complete (includes userId)
- Changing frontend is less risky (client-side only)
- Backend interface follows common patterns (message vs content)

**Option B: Fix Backend**
Modify `project-pipeline/backend/src/ai/chat.service.ts` to accept frontend's field names.

**Why not Option B?**
- Backend would need to make userId optional (breaking existing functionality)
- Less semantic (content is ambiguous, message is clear)

### Implementation Guidance

**Frontend Fix (Option A - Recommended)**:

```typescript
// Current problematic pattern:
socket.emit('chat:message', {
  content: content.trim(),          // ❌ Wrong field name
  projectId: context?.projectId,
  phaseId: context?.phaseId,        // ⚠️ Can be undefined
})

// Required pattern:
socket.emit('chat:message', {
  message: content.trim(),           // ✅ Correct field name
  projectId: context?.projectId || '', // ✅ Provide default or validate
  phaseId: context?.phaseId || '',     // ✅ Provide default or validate
  userId: getUserId() || '',           // ✅ Add missing userId
})
```

**Key considerations for implementation:**

1. **Field name mapping**:
   - Rename `content` → `message`
   - Add `userId` field (need to determine source - could be from auth context, localStorage, or user store)

2. **Validation**: Add validation before sending:
   ```typescript
   if (!context?.projectId || !context?.phaseId) {
     toast.error('Project and phase context required to send message')
     return
   }
   ```

3. **Type safety**: Create shared interface:
   ```typescript
   // Create shared types package or use:
   interface ChatMessagePayload {
     message: string
     projectId: string
     phaseId: string
     userId: string
     conversationId?: string
   }
   ```

4. **Testing approach**:
   - Test with valid context (projectId, phaseId, userId all present)
   - Test with missing context (should show error, not crash)
   - Verify message reaches backend and doesn't throw Prisma error
   - Check that conversation is created/updated correctly

5. **Additional considerations**:
   - Determine where `userId` comes from (auth context? session storage?)
   - Consider adding TypeScript type checking between frontend/backend
   - Add validation middleware on backend to provide better error messages
   - Consider using Socket.io typed events for compile-time safety

### Files to Examine

Primary files:
- `project-pipeline/frontend/src/hooks/useChat.ts:70-74` - **MUST FIX**: Change socket.emit payload
- `project-pipeline/frontend/src/hooks/useChat.ts:38-80` - Verify userId source, add validation

Related files to check:
- `project-pipeline/backend/src/ai/chat.service.ts:58-65` - Backend interface (reference only)
- `project-pipeline/frontend/src/stores/authStore.ts` (if exists) - Potential userId source
- `project-pipeline/frontend/src/contexts/AuthContext.tsx` (if exists) - Potential userId source

### Backend Validation Enhancement (Optional but Recommended)

While fixing the frontend, also add backend validation to catch future mismatches:

```typescript
// In chat.service.ts, add validation before processing:
socket.on('chat:message', async (data) => {
  try {
    // Validate required fields
    if (!data.message || !data.phaseId || !data.projectId || !data.userId) {
      socket.emit('chat:error', {
        error: `Missing required fields. Expected: { message, phaseId, projectId, userId }. Received: ${JSON.stringify(Object.keys(data))}`
      })
      return
    }

    await this.handleChatMessage(socket, data)
  } catch (error: any) {
    socket.emit('chat:error', {
      error: error.message || 'Failed to process message'
    })
  }
})
```

This provides clear error messages and prevents cryptic Prisma errors.

## Verification

### How to confirm the fix works:

**Test Case 1: Valid Message**
1. Ensure user is authenticated and userId is available
2. Navigate to a project phase with valid projectId and phaseId
3. Type a message in the chat interface
4. Click send
5. **Expected**: Message appears in chat, AI responds, no console errors
6. **Backend log should show**: "User {userId} joined phase {phaseId}"
7. **Database should show**: New AIConversation record created or updated

**Test Case 2: Missing Context**
1. Open chat interface without selecting a project/phase
2. Try to send a message
3. **Expected**: User-friendly error message (e.g., "Please select a phase first")
4. **Should NOT see**: Prisma error about undefined ID

**Test Case 3: Backend Receives Correct Data**
1. Add console.log in backend's handleChatMessage to log received data
2. Send a message from frontend
3. **Expected backend log**:
   ```
   Received data: {
     message: "Hello",
     projectId: "proj_123",
     phaseId: "phase_456",
     userId: "user_789"
   }
   ```

**Test Case 4: Conversation Persistence**
1. Send multiple messages in same conversation
2. Refresh page
3. **Expected**: Conversation history loads correctly

### Reproduction of Original Issue (Before Fix)

To verify the bug exists before fixing:

1. Start backend server
2. Start frontend dev server
3. Open browser console
4. Navigate to any phase chat interface
5. Send a message
6. **Current behavior**: Console shows Prisma error "findUnique with undefined id"
7. **Backend logs**: Error stack trace pointing to chat.service.ts:83

After implementing the fix, repeat these steps and verify the error no longer occurs.

## Prevention Strategies

To prevent similar issues in the future:

1. **Shared Types**: Create a shared types package for Socket.io events
   ```typescript
   // @types/socket-events.ts
   export interface ServerToClientEvents {
     'chat:response': (data: ChatResponse) => void
     'chat:error': (data: ErrorResponse) => void
   }

   export interface ClientToServerEvents {
     'chat:message': (data: ChatMessagePayload) => void
   }
   ```

2. **Runtime Validation**: Use Zod or similar library to validate socket payloads

3. **API Contract Testing**: Add integration tests that verify frontend/backend contracts match

4. **Documentation**: Maintain API documentation (OpenAPI/AsyncAPI) for Socket.io events

5. **Code Review Checklist**: Add "Verify socket event contracts match" to PR review checklist
