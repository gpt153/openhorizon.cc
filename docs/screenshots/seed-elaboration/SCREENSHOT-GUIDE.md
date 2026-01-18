# Screenshot Capture Guide for Seed Elaboration

This guide provides specifications for capturing the 12-15 screenshots needed for the [Seed Elaboration User Documentation](../../user-guide/features/seed-elaboration.md).

---

## Prerequisites

### Environment Setup

1. **Running Services:**
   ```bash
   # Backend
   cd project-pipeline/backend
   npm run dev

   # Frontend
   cd project-pipeline/frontend
   npm run dev
   ```

2. **Test Data:**
   - Use the sample seed described below
   - Clean UI state (no dev tools visible)
   - Browser: Chrome/Firefox at 1920x1080 resolution

### Sample Seed Data

**Seed Title:** "Digital Nomads Unite!"

**Seed Description:**
```
A 7-day youth exchange where young people from across Europe learn digital skills through hands-on workshops, team challenges, and real-world projects. You'll spend mornings building websites and apps, afternoons exploring Barcelona's tech scene, and evenings sharing cultural traditions.
```

**Metadata:**
- Estimated participants: 30
- Estimated duration: 7 days
- Approval likelihood: 82%

---

## Screenshot List (15 screenshots)

### 1. seed-elaboration-01-start.png
**Location:** Seed detail page
**What to capture:**
- Full seed detail view
- "Elaborate" button highlighted (can use red circle/arrow)
- Seed title, description visible
- Approval score showing

**Purpose:** Show entry point for elaboration

---

### 2. seed-elaboration-02-initial.png
**Location:** Elaboration interface just loaded
**What to capture:**
- Chat interface on left side
- Metadata preview panel on right side
- Progress bar at 0%
- First AI question visible
- Welcome message from AI

**Purpose:** Show initial state of elaboration UI

---

### 3. seed-elaboration-03-question1-participants.png
**Location:** First question displayed
**What to capture:**
- AI question: "How many participants..."
- Follow-up text about 16-60 range
- Empty input field
- Empty metadata panel
- Progress bar at 0%

**Purpose:** Example of first question

---

### 4. seed-elaboration-04-answer1-entered.png
**Location:** After answering first question
**What to capture:**
- User message: "30 participants from Germany and France"
- Metadata panel updated showing:
  ```json
  {
    "participantCount": 30
  }
  ```
- Progress bar at ~20%
- AI acknowledgment message

**Purpose:** Show metadata extraction in action

---

### 5. seed-elaboration-05-question2-budget.png
**Location:** Budget question displayed
**What to capture:**
- Budget question text
- Smart suggestion: "Based on 30 participants and 7 days..."
- Quick reply buttons (€300, €400, €500 options)
- Input field ready for answer

**Purpose:** Show smart defaults and quick replies

---

### 6. seed-elaboration-06-budget-calculated.png
**Location:** After budget answer
**What to capture:**
- User answer: "€400 per participant"
- Metadata showing BOTH values:
  ```json
  {
    "budgetPerParticipant": 400,
    "totalBudget": 12000
  }
  ```
- Progress at ~35%

**Purpose:** Show auto-calculation feature

---

### 7. seed-elaboration-07-question4-destination.png
**Location:** Destination question answered
**What to capture:**
- User answer: "Barcelona, Spain. Youth center in Gràcia, wheelchair accessible"
- Metadata showing structured destination:
  ```json
  {
    "destination": {
      "country": "ES",
      "city": "Barcelona",
      "venue": "Youth center in Gràcia",
      "accessibility": "Wheelchair accessible"
    }
  }
  ```
- Progress at ~65%

**Purpose:** Show complex extraction with optional fields

---

### 8. seed-elaboration-08-visa-autocal.png
**Location:** After participant countries question
**What to capture:**
- User answer: "Germany, France, and Spain"
- Metadata showing visa requirements table:
  ```json
  {
    "participantCountries": ["DE", "FR", "ES"],
    "requirements": {
      "visas": [
        {"country": "DE", "needed": false},
        {"country": "FR", "needed": false},
        {"country": "ES", "needed": false}
      ]
    }
  }
  ```
- Progress at ~70%
- Clear display of "No visa needed" for each

**Purpose:** Show visa auto-calculation

---

### 9. seed-elaboration-09-activities.png
**Location:** Activities question answered
**What to capture:**
- User answer describing multiple activities
- Metadata showing structured activities array:
  ```json
  {
    "activities": [
      {
        "name": "Digital Marketing Workshop",
        "duration": "2 days",
        "learningOutcomes": ["Marketing skills"]
      },
      ...
    ]
  }
  ```
- Progress at ~85%

**Purpose:** Show activity extraction

---

### 10. seed-elaboration-10-progress-80.png
**Location:** When progress reaches 80%
**What to capture:**
- Progress bar at 80-85%
- "Convert to Project" button NOW ENABLED (green/active state)
- Success message: "Your seed is ready to become a project!"
- Chat history showing 5-6 Q&A pairs

**Purpose:** Show conversion threshold

---

### 11. seed-elaboration-11-complete.png
**Location:** All questions answered
**What to capture:**
- Full chat history (scroll to show multiple messages)
- Progress bar at 100%
- Complete metadata panel (all fields filled)
- "Convert to Project" button enabled

**Purpose:** Show completion state

---

### 12. seed-elaboration-12-edit-message.png
**Location:** Hover over user message
**What to capture:**
- Mouse hovering over a user message
- Edit icon (pencil ✏️) visible
- Highlight the edit button with red circle or arrow

**Purpose:** Show edit functionality

---

### 13. seed-elaboration-13-quick-replies.png
**Location:** Budget question with quick replies
**What to capture:**
- Close-up of quick reply buttons
- Three options visible:
  - "€300/person (€9,000 total)"
  - "€400/person (€12,000 total)"
  - "€500/person (€15,000 total)"
- Cursor hovering over one button

**Purpose:** Detail view of quick reply feature

---

### 14. seed-elaboration-14-uncertainty.png
**Location:** After user says "I'm not sure"
**What to capture:**
- User message: "I'm not sure about the budget"
- Yellow help banner: "It's okay not to know!"
- "Skip this question" button visible
- AI offering default estimate

**Purpose:** Show uncertainty detection and handling

---

### 15. seed-elaboration-15-converted-project.png
**Location:** Project detail page after conversion
**What to capture:**
- Newly created project
- Phases visible (Preparation, Exchange, Follow-up)
- Timeline/Gantt chart
- Budget populated
- Metadata from elaboration visible in project fields

**Purpose:** Show end result of elaboration

---

## Screenshot Naming Convention

All screenshots should follow this pattern:
```
seed-elaboration-[number]-[description].png
```

Examples:
- `seed-elaboration-01-start.png`
- `seed-elaboration-02-initial.png`
- `seed-elaboration-15-converted-project.png`

---

## Capture Tools

### Browser Screenshot (Recommended)

**Chrome DevTools:**
1. Open DevTools (F12)
2. Cmd+Shift+P (Mac) or Ctrl+Shift+P (Windows)
3. Type "Capture screenshot"
4. Choose "Capture full size screenshot" or "Capture screenshot"

**Firefox:**
1. Right-click on page
2. "Take Screenshot"
3. Choose "Save full page" or "Save visible"

### Playwright Utility

If using Playwright for automated screenshots:
```typescript
await page.screenshot({
  path: 'docs/screenshots/seed-elaboration/seed-elaboration-01-start.png',
  fullPage: false
})
```

### Manual Tools

- **macOS:** Cmd+Shift+4 (select area)
- **Windows:** Snipping Tool
- **Linux:** Gnome Screenshot, Flameshot

---

## Annotation Guide

Some screenshots benefit from annotations to highlight key UI elements.

### What to Annotate

**Screenshots that need annotation:**
- #1 (Start): Red arrow pointing to "Elaborate" button
- #12 (Edit): Red circle around edit icon
- #13 (Quick replies): Cursor or highlight on buttons

### Annotation Tools

- **macOS:** Preview (Tools → Annotate)
- **GIMP** (cross-platform, free)
- **Photoshop** (if available)
- **Online:** Figma, Canva

### Annotation Style

- **Arrows:** Red, 3px width
- **Circles:** Red, dashed border, 2px
- **Text labels:** Arial 14px, red text

Keep annotations minimal and clear.

---

## Image Optimization

After capturing, optimize images for web:

### Target Size

- Maximum width: 1920px
- Maximum file size: 200KB per image
- Format: PNG (for UI screenshots with text)

### Optimization Tools

**Command line:**
```bash
# Install ImageMagick
brew install imagemagick  # macOS
apt-get install imagemagick  # Linux

# Resize if needed
convert input.png -resize 1920x output.png

# Optimize
pngquant --quality=80-95 output.png
```

**Online:**
- TinyPNG: https://tinypng.com
- Squoosh: https://squoosh.app

---

## Embedding in Documentation

Screenshots are already referenced in the main documentation file:

```markdown
[Screenshot: Elaborate button on seed detail page]
```

To embed actual images, update these references to:

```markdown
![Elaborate button on seed detail page](../../../screenshots/seed-elaboration/seed-elaboration-01-start.png)
```

---

## Sample Elaboration Flow for Screenshots

To capture all screenshots systematically, follow this conversation flow:

### Session Start
1. Navigate to seed detail page → Capture #1
2. Click "Elaborate" → Capture #2

### Question 1: Participants
3. View first question → Capture #3
4. Answer: "30 participants" → Capture #4

### Question 2: Budget
5. View budget question with quick replies → Capture #5, #13
6. Answer: "€400 per participant" → Capture #6

### Question 3: Duration
7. Answer: "7 days"

### Question 4: Destination
8. Answer: "Barcelona, Spain. Youth center in Gràcia, wheelchair accessible" → Capture #7

### Question 5: Participant Countries
9. Answer: "Germany, France, and Spain" → Capture #8

### Question 6: Activities
10. Answer with multiple activities → Capture #9

### Question 7: EU Priorities
11. Answer: "Digital transformation and inclusion"
12. Progress reaches 100% → Capture #10, #11

### Edit Feature
13. Hover over any previous message → Capture #12

### Uncertainty
14. (Optional) Start new session and answer with "I'm not sure" → Capture #14

### Conversion
15. Click "Convert to Project" → Capture #15

---

## Checklist

Before submitting screenshots:

- [ ] All 15 screenshots captured
- [ ] Naming convention followed
- [ ] Images optimized (<200KB each)
- [ ] Annotations added where needed
- [ ] Sample data is realistic and consistent
- [ ] UI is clean (no dev tools, errors, clutter)
- [ ] Resolution is 1920x1080 or similar
- [ ] Screenshots match documentation references

---

## Next Steps

After capturing screenshots:

1. Place all PNG files in `docs/screenshots/seed-elaboration/`
2. Update documentation references from `[Screenshot: ...]` to `![Alt text](path)`
3. Verify all images display correctly in rendered Markdown
4. Commit screenshots with documentation changes

---

**Questions?** Contact the documentation team or open an issue on GitHub.

**Last Updated:** 2026-01-18
