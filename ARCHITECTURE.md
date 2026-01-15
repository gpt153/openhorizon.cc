# Technical Architecture - Conversational Seed Elaboration

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                     User Browser                              │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  SeedDetail.tsx (Page)                                       │
│  ├── State: React Query (server state)                      │
│  └── Layout: Header + Elaboration Interface                 │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ConversationalElaboration.tsx                      │    │
│  │                                                     │    │
│  │ ┌─────────────────────┐  ┌────────────────────┐  │    │
│  │ │ Chat Side (2/3)     │  │ Metadata (1/3)     │  │    │
│  │ │                     │  │                    │  │    │
│  │ │ ProgressIndicator   │  │ MetadataPreview    │  │    │
│  │ │ ━━━━━━━━━━ 65%    │  │ ✓ Title           │  │    │
│  │ │                     │  │ ✓ Duration        │  │    │
│  │ │ SeedElaborationChat │  │ ⚠ Theme          │  │    │
│  │ │ ┌─────────────────┐ │  │ ⚠ Budget         │  │    │
│  │ │ │ AI: "How many   │ │  │                    │  │    │
│  │ │ │ participants?"  │ │  │ [Convert] 80%+     │  │    │
│  │ │ └─────────────────┘ │  │                    │  │    │
│  │ │ Quick Replies:      │  │                    │  │    │
│  │ │ [16-20][21-30]✏️   │  │                    │  │    │
│  │ │                     │  │                    │  │    │
│  │ │ ┌─────────────────┐ │  │                    │  │    │
│  │ │ │ User: "20"      │ │  │                    │  │    │
│  │ │ └─────────────────┘ │  │                    │  │    │
│  │ │ [Input] [Send]      │  │                    │  │    │
│  │ └─────────────────────┘  └────────────────────┘  │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ elaborationStore.ts (Zustand)                      │    │
│  │ - sessionId, messages, metadata, completeness      │    │
│  │ - Actions: addMessage, editMessage, updateMetadata │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                  │
│                          │ API Calls                        │
│                          ▼                                  │
│  ┌────────────────────────────────────────────────────┐    │
│  │ seeds.api.ts (Axios + React Query)                 │    │
│  │ - elaborateSeed(seedId, message)                   │    │
│  │ - calculateCompleteness(seed)                      │    │
│  │ - generateQuickReplies(question)                   │    │
│  └────────────────────────────────────────────────────┘    │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTP POST
                           │ /seeds/:id/elaborate
                           ▼
┌──────────────────────────────────────────────────────────────┐
│                Backend (Fastify API)                          │
├──────────────────────────────────────────────────────────────┤
│  seeds.routes.ts                                             │
│  └─► POST /seeds/:id/elaborate                              │
│       └─► seeds.service.ts                                  │
│            └─► elaborateSeedConversation()                  │
│                 ├─► Load seed + elaboration from DB        │
│                 ├─► Call AI elaboration chain              │
│                 ├─► Update conversation history            │
│                 └─► Return ElaborationResponse             │
│                                                              │
│  ElaborationResponse:                                        │
│  {                                                           │
│    message: string,                                         │
│    suggestions: SeedSuggestion[],                           │
│    updatedSeed: GeneratedSeed,                              │
│    updatedApprovalLikelihood: number                        │
│  }                                                           │
└──────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Starting Elaboration Session

```
User clicks seed → SeedDetail.tsx loads
                    │
                    ├─► Fetch seed (React Query)
                    │   GET /seeds/:id
                    │
                    ├─► Initialize store
                    │   elaborationStore.startSession()
                    │   - Set sessionId
                    │   - Load initial metadata from seed
                    │   - Calculate initial completeness
                    │
                    └─► Render ConversationalElaboration
                        - Show ProgressIndicator
                        - Show SeedElaborationChat
                        - Show MetadataPreview
```

### 2. User Sends Message

```
User types message → Input field
                      │
                      ├─► handleSendMessage()
                      │   - Add user message to store
                      │   - Set loading state
                      │
                      ├─► API Call
                      │   POST /seeds/:id/elaborate
                      │   Body: { userMessage: "20 participants" }
                      │
                      ├─► Backend Processing
                      │   - Load conversation history
                      │   - Call AI elaboration
                      │   - Update seed metadata
                      │   - Generate suggestions
                      │   - Return response
                      │
                      └─► Frontend Processing
                          - Add AI message to store
                          - Update metadata
                          - Calculate completeness
                          - Generate quick replies
                          - Clear loading state
                          - Re-render components
```

### 3. Quick Reply Flow

```
AI asks: "How many participants?"
   │
   ├─► Frontend detects question pattern
   │   generateQuickReplies(question)
   │
   ├─► Show buttons: [16-20] [21-30] [31-40] [Custom]
   │
   └─► User clicks [21-30]
        │
        └─► Auto-submit "21-30 participants"
            (same flow as typing message)
```

### 4. Edit Message Flow

```
User clicks edit (✏️) on past message
   │
   ├─► handleEditMessage(messageId)
   │   - Load original message content
   │   - Populate input field
   │   - Set editingMessageId state
   │
   └─► User modifies and submits
        │
        ├─► store.editMessage(messageId, newContent)
        │   - Mark original as edited
        │   - Truncate conversation after this point
        │
        └─► Re-submit from edit point
            POST /seeds/:id/elaborate
            (with truncated history)
```

### 5. Completeness Calculation

```typescript
// Client-side calculation
function calculateCompleteness(seed: GeneratedSeed): number {
  // Required fields (60% weight)
  const required = ['title', 'description', 'theme',
                    'estimatedDuration', 'estimatedParticipants']

  // Optional fields (40% weight)
  const optional = ['targetAgeGroup', 'geographicScope',
                    'projectType', 'budgetRange']

  const requiredComplete = required.filter(f => seed[f]).length
  const optionalComplete = optional.filter(f => seed[f]).length

  const requiredScore = (requiredComplete / required.length) * 60
  const optionalScore = (optionalComplete / optional.length) * 40

  return Math.round(requiredScore + optionalScore)
}

// Triggers:
// - On initial load
// - After each AI response
// - After metadata update
```

### 6. Convert to Project

```
Completeness >= 80%
   │
   ├─► Enable "Convert to Project" button
   │
   └─► User clicks button
        │
        ├─► POST /seeds/:id/convert
        │   - Backend creates project
        │   - Populates from metadata
        │   - Returns project ID
        │
        └─► Navigate to /projects/:id
            (new project page)
```

## State Management Strategy

### Zustand Store (elaborationStore.ts)

**Purpose**: Manage elaboration UI state

```typescript
interface ElaborationState {
  // Session
  sessionId: string | null
  seedId: string | null

  // Conversation
  messages: ElaborationMessageExtended[]

  // Metadata tracking
  metadata: SeedMetadata | null
  completeness: number

  // UI state
  isLoading: boolean
  currentQuestion: string | null
  quickReplies: QuickReply[]

  // Actions
  startSession: (seedId, initialSeed) => void
  addMessage: (message) => void
  editMessage: (messageId, newContent) => void
  updateMetadata: (metadata) => void
  setQuickReplies: (replies) => void
  setLoading: (loading) => void
  reset: () => void
}
```

**Why Zustand?**
- Already in dependencies
- Simple, TypeScript-friendly API
- No boilerplate
- Easy testing
- Follows existing pattern (authStore.ts)

### React Query (Server State)

**Purpose**: Manage API calls and caching

```typescript
// Fetch seed
useQuery(['seed', id], () => getSeed(id))

// Elaborate mutation
useMutation({
  mutationFn: (message) => elaborateSeed(id, { userMessage: message }),
  onSuccess: (response) => {
    // Update store
    store.addMessage(response.message)
    store.updateMetadata(response.updatedSeed)
    store.setQuickReplies(generateQuickReplies(response.message))

    // Invalidate cache
    queryClient.invalidateQueries(['seed', id])
  }
})
```

**Why React Query?**
- Already in use throughout app
- Handles caching, refetching, loading states
- Optimistic updates
- Error handling

### Component State (useState)

**Purpose**: Local UI state only

```typescript
// In SeedElaborationChat
const [inputMessage, setInputMessage] = useState('')
const [editingMessageId, setEditingMessageId] = useState<string | null>(null)

// In ConversationalElaboration
const [view, setView] = useState<'working' | 'formal'>('working')
```

**When to use?**
- Temporary input values
- UI toggles (dropdowns, modals)
- Transient state (not needed across components)

## Component Architecture

### ConversationalElaboration (Orchestrator)

**Responsibility**: Coordinate all elaboration components

```typescript
export default function ConversationalElaboration({
  seedId,
  initialSeed,
  onComplete,
}: Props) {
  const store = useElaborationStore()

  useEffect(() => {
    // Initialize session on mount
    store.startSession(seedId, initialSeed)

    return () => {
      // Cleanup on unmount (optional - keep state for back navigation)
      // store.reset()
    }
  }, [seedId])

  const handleSendMessage = async (message: string) => {
    try {
      store.setLoading(true)

      // Add user message
      store.addMessage({
        id: generateId(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString(),
      })

      // Call API
      const response = await elaborateSeed(seedId, { userMessage: message })

      // Add AI message
      store.addMessage({
        id: generateId(),
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
        appliedChanges: response.updatedSeed,
      })

      // Update metadata and completeness
      store.updateMetadata(response.updatedSeed)

      // Generate quick replies
      const quickReplies = generateQuickReplies(response.message)
      store.setQuickReplies(quickReplies)

    } catch (error) {
      toast.error('Failed to elaborate seed')
    } finally {
      store.setLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Chat side */}
      <div className="md:col-span-2">
        <ProgressIndicator completeness={store.completeness} />
        <SeedElaborationChat
          messages={store.messages}
          quickReplies={store.quickReplies}
          onSendMessage={handleSendMessage}
          isLoading={store.isLoading}
        />
      </div>

      {/* Metadata side */}
      <div className="md:col-span-1">
        <MetadataPreview
          metadata={store.metadata}
          completeness={store.completeness}
          onConvert={onComplete}
          isConvertEnabled={store.completeness >= 80}
        />
      </div>
    </div>
  )
}
```

### ProgressIndicator (Pure Component)

**Responsibility**: Display progress bar

```typescript
interface Props {
  completeness: number // 0-100
}

export default function ProgressIndicator({ completeness }: Props) {
  const getColor = () => {
    if (completeness < 50) return 'bg-red-600'
    if (completeness < 80) return 'bg-yellow-500'
    return 'bg-green-600'
  }

  const getMessage = () => {
    if (completeness < 30) return "Let's get started!"
    if (completeness < 60) return "You're making progress!"
    if (completeness < 80) return "Almost there!"
    return "Great work! Ready to convert!"
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow mb-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          Elaboration Progress
        </span>
        <span className="text-lg font-bold text-gray-900">
          {completeness}%
        </span>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-300`}
          style={{ width: `${completeness}%` }}
        />
      </div>

      <p className="text-xs text-gray-600 mt-2 text-center">
        {getMessage()}
      </p>
    </div>
  )
}
```

### MetadataPreview (Pure Component)

**Responsibility**: Display metadata fields and completeness

```typescript
interface Props {
  metadata: SeedMetadata | null
  completeness: number
  onConvert?: () => void
  isConvertEnabled: boolean
}

export default function MetadataPreview({
  metadata,
  completeness,
  onConvert,
  isConvertEnabled,
}: Props) {
  const fields = [
    { key: 'title', label: 'Title', required: true },
    { key: 'description', label: 'Description', required: true },
    { key: 'theme', label: 'Theme', required: true },
    { key: 'estimatedDuration', label: 'Duration', required: true },
    { key: 'estimatedParticipants', label: 'Participants', required: true },
    { key: 'targetAgeGroup', label: 'Age Group', required: false },
    { key: 'geographicScope', label: 'Geographic Scope', required: false },
    { key: 'budgetRange', label: 'Budget Range', required: false },
  ]

  return (
    <div className="bg-white rounded-lg shadow p-4 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Metadata Overview
      </h3>

      {/* Circular progress */}
      <div className="flex justify-center mb-4">
        <CircularProgress value={completeness} />
      </div>

      {/* Field list */}
      <div className="space-y-2">
        {fields.map(field => {
          const value = metadata?.[field.key]
          const isComplete = !!value

          return (
            <div key={field.key} className="flex items-start gap-2">
              <span className={`mt-0.5 ${isComplete ? 'text-green-600' : 'text-yellow-600'}`}>
                {isComplete ? '✓' : '⚠'}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {field.label}
                    {field.required && <span className="text-red-500">*</span>}
                  </span>
                </div>
                {isComplete ? (
                  <p className="text-sm text-gray-600 truncate">{value}</p>
                ) : (
                  <p className="text-xs text-gray-400 italic">Missing</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Convert button */}
      <button
        onClick={onConvert}
        disabled={!isConvertEnabled}
        className={`w-full mt-6 px-4 py-3 rounded-lg font-medium transition-colors ${
          isConvertEnabled
            ? 'bg-green-600 hover:bg-green-700 text-white'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isConvertEnabled
          ? '✓ Convert to Project'
          : `Complete ${80 - completeness}% more to convert`}
      </button>
    </div>
  )
}
```

## Testing Strategy

### Unit Tests

**elaborationStore.test.ts**:
```typescript
describe('ElaborationStore', () => {
  it('should initialize with null state', () => {
    const store = useElaborationStore.getState()
    expect(store.sessionId).toBeNull()
    expect(store.messages).toEqual([])
  })

  it('should start session with initial seed', () => {
    const store = useElaborationStore.getState()
    store.startSession('seed-123', mockSeed)

    expect(store.sessionId).toBeTruthy()
    expect(store.seedId).toBe('seed-123')
    expect(store.metadata).toBeDefined()
  })

  it('should add messages correctly', () => {
    const store = useElaborationStore.getState()
    store.addMessage(mockMessage)

    expect(store.messages).toHaveLength(1)
    expect(store.messages[0]).toEqual(mockMessage)
  })

  it('should edit message and truncate history', () => {
    const store = useElaborationStore.getState()
    // Add 3 messages
    store.addMessage({ id: '1', role: 'user', content: 'A' })
    store.addMessage({ id: '2', role: 'assistant', content: 'B' })
    store.addMessage({ id: '3', role: 'user', content: 'C' })

    // Edit second message
    store.editMessage('1', 'A edited')

    // Should truncate everything after edited message
    expect(store.messages).toHaveLength(1)
    expect(store.messages[0].content).toBe('A edited')
    expect(store.messages[0].isEdited).toBe(true)
  })
})
```

**calculateCompleteness.test.ts**:
```typescript
describe('calculateCompleteness', () => {
  it('should return 0 for empty seed', () => {
    const seed = {} as GeneratedSeed
    expect(calculateCompleteness(seed)).toBe(0)
  })

  it('should return 60 for all required fields only', () => {
    const seed = {
      title: 'Test',
      description: 'Test desc',
      theme: 'Education',
      estimatedDuration: 14,
      estimatedParticipants: 20,
    } as GeneratedSeed

    expect(calculateCompleteness(seed)).toBe(60)
  })

  it('should return 100 for all fields complete', () => {
    const seed = {
      // Required
      title: 'Test',
      description: 'Test desc',
      theme: 'Education',
      estimatedDuration: 14,
      estimatedParticipants: 20,
      // Optional
      targetAgeGroup: '18-25',
      geographicScope: 'Europe',
      projectType: 'Exchange',
      budgetRange: '10k-50k',
    } as GeneratedSeed

    expect(calculateCompleteness(seed)).toBe(100)
  })
})
```

### Integration Tests

**conversational-elaboration.test.tsx**:
```typescript
describe('ConversationalElaboration Integration', () => {
  it('should complete full elaboration flow', async () => {
    const { user } = render(
      <ConversationalElaboration
        seedId="seed-123"
        initialSeed={mockSeed}
        onComplete={mockOnComplete}
      />
    )

    // Should show progress at 0%
    expect(screen.getByText('0%')).toBeInTheDocument()

    // Type and send message
    const input = screen.getByPlaceholderText('Ask a question...')
    await user.type(input, '20 participants')
    await user.click(screen.getByText('Send'))

    // Should show loading
    expect(screen.getByText('Thinking...')).toBeInTheDocument()

    // Wait for response
    await waitFor(() => {
      expect(screen.getByText(mockResponse.message)).toBeInTheDocument()
    })

    // Should update progress
    expect(screen.getByText('20%')).toBeInTheDocument()

    // Should show quick replies
    expect(screen.getByText('16-20')).toBeInTheDocument()

    // Click quick reply
    await user.click(screen.getByText('16-20'))

    // Should auto-submit
    expect(elaborateSeed).toHaveBeenCalledWith('seed-123', {
      userMessage: '16-20 participants'
    })
  })
})
```

### E2E Tests

**seed-elaboration.cy.ts**:
```typescript
describe('Seed Elaboration E2E', () => {
  beforeEach(() => {
    cy.login()
    cy.visit('/seeds/test-seed-id')
  })

  it('should complete elaboration and convert to project', () => {
    // Start with progress at 0%
    cy.contains('0%').should('be.visible')

    // Answer first question
    cy.get('input[placeholder*="Ask"]').type('Cultural exchange{enter}')
    cy.contains('Thinking...').should('be.visible')
    cy.contains('Thinking...').should('not.exist')

    // Progress should increase
    cy.contains(/\d{1,2}%/).should('not.contain', '0%')

    // Click quick reply
    cy.contains('21-30').click()

    // Continue conversation...
    // (repeat for 5-6 questions)

    // Progress should reach 80%+
    cy.contains(/[8-9]\d%|100%/).should('be.visible')

    // Convert button should be enabled
    cy.contains('Convert to Project').should('not.be.disabled')

    // Click convert
    cy.contains('Convert to Project').click()

    // Should navigate to project page
    cy.url().should('include', '/projects/')
    cy.contains('Project created successfully')
  })

  it('should allow editing previous answer', () => {
    // Send initial message
    cy.get('input').type('20 participants{enter}')
    cy.wait(1000)

    // Send another message
    cy.get('input').type('2 weeks{enter}')
    cy.wait(1000)

    // Edit first message
    cy.get('[data-message-id]').first().find('button[aria-label="Edit"]').click()

    // Input should be populated
    cy.get('input').should('have.value', '20 participants')

    // Change and submit
    cy.get('input').clear().type('30 participants{enter}')

    // Should show edited indicator
    cy.contains('(edited)').should('be.visible')

    // Conversation after edit should be truncated
    cy.contains('2 weeks').should('not.exist')
  })
})
```

## Performance Considerations

### Optimization Strategies

1. **Memoization**:
```typescript
// Memoize completeness calculation
const completeness = useMemo(
  () => calculateCompleteness(metadata),
  [metadata]
)

// Memoize quick reply generation
const quickReplies = useMemo(
  () => generateQuickReplies(currentQuestion),
  [currentQuestion]
)
```

2. **Virtual Scrolling** (if >100 messages):
```typescript
// Use react-window for large chat histories
import { FixedSizeList } from 'react-window'

<FixedSizeList
  height={600}
  itemCount={messages.length}
  itemSize={80}
>
  {({ index, style }) => (
    <div style={style}>
      <ChatMessage message={messages[index]} />
    </div>
  )}
</FixedSizeList>
```

3. **Debounce Input**:
```typescript
// Debounce typing indicators
const debouncedTyping = useDebouncedCallback(() => {
  // Send "user is typing" indicator
}, 300)
```

4. **Lazy Loading**:
```typescript
// Lazy load heavy components
const MetadataPreview = lazy(() => import('./MetadataPreview'))

<Suspense fallback={<LoadingSpinner />}>
  <MetadataPreview {...props} />
</Suspense>
```

### Bundle Size

Current approach adds minimal bundle size:
- Zustand: ~1.3kb gzipped (already included)
- No new dependencies needed
- Component code: ~15kb total (estimated)

**Total Impact**: ~15kb additional code

## Security Considerations

1. **Input Sanitization**:
```typescript
// Sanitize user input before display
import DOMPurify from 'dompurify'

const sanitizedMessage = DOMPurify.sanitize(userMessage)
```

2. **Rate Limiting**:
```typescript
// Prevent message spam
const [lastMessageTime, setLastMessageTime] = useState(0)

const handleSendMessage = (message: string) => {
  const now = Date.now()
  if (now - lastMessageTime < 1000) {
    toast.error('Please wait before sending another message')
    return
  }

  setLastMessageTime(now)
  // Continue...
}
```

3. **XSS Prevention**:
```typescript
// Never use dangerouslySetInnerHTML
// Always render text as {message.content}
<p className="text-sm whitespace-pre-wrap">{message.content}</p>
```

## Mobile Responsiveness

### Breakpoints

```css
/* Mobile: Stack vertically */
@media (max-width: 768px) {
  .grid-cols-3 { grid-template-columns: 1fr; }
}

/* Tablet: 60/40 split */
@media (min-width: 768px) and (max-width: 1024px) {
  .md:col-span-2 { grid-column: span 2; }
  .md:col-span-1 { grid-column: span 1; }
}

/* Desktop: 66/33 split */
@media (min-width: 1024px) {
  .lg:col-span-2 { grid-column: span 2; }
  .lg:col-span-1 { grid-column: span 1; }
}
```

### Touch Optimizations

```typescript
// Larger tap targets on mobile
<button className="px-6 py-4 md:px-4 md:py-2">
  {/* 48x48px minimum on mobile */}
</button>

// Swipe to edit on mobile
const handleSwipeLeft = (messageId: string) => {
  if (isMobile) {
    handleEditMessage(messageId)
  }
}
```

---

**Next Steps**: Begin Phase 1 implementation (Types & Store)
