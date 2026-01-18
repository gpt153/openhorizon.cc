# Seed Elaboration - Complete Walkthrough

**A 2-minute conversational guide to transform your seed ideas into complete Erasmus+ projects**

---

## Table of Contents
1. [What is Seed Elaboration?](#what-is-seed-elaboration)
2. [When to Use Elaboration](#when-to-use-elaboration)
3. [Quick Start](#quick-start)
4. [Step-by-Step Walkthrough](#step-by-step-walkthrough)
5. [Understanding the 7 Questions](#understanding-the-7-questions)
6. [Features Explained](#features-explained)
7. [Tips & Best Practices](#tips--best-practices)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## What is Seed Elaboration?

Seed elaboration is an **AI-powered conversational interview** that transforms rough project ideas into structured, Erasmus+-ready project data in under 2 minutes.

### How It Works

1. **Start with a seed** - A rough idea from your Seed Garden
2. **Answer 7 questions** - AI guides you through essential details
3. **Watch metadata build** - Natural language extracts structured data automatically
4. **Track progress** - Real-time completeness indicator (0-100%)
5. **Convert to project** - One click at 80%+ completeness

### What You Get

After elaboration, you'll have:
- ✅ Validated participant count (16-60 range)
- ✅ Budget breakdown (per-person and total)
- ✅ Timeline with duration
- ✅ Destination details (country, city, venue, accessibility)
- ✅ Visa requirements (auto-calculated)
- ✅ Structured activity list
- ✅ EU priority alignment
- ✅ Ready-to-convert project data

**Time investment:** 1-2 minutes
**Result:** Complete project structure with all Erasmus+ requirements

---

## When to Use Elaboration

### Use Elaboration When:

- ✅ You have a seed idea but need to flesh out details
- ✅ You want structured data for project conversion
- ✅ You need to validate against Erasmus+ requirements (16-60 participants, budget ranges)
- ✅ You're uncertain about project parameters
- ✅ You want AI to auto-calculate budgets, timelines, and visa needs

### Skip Elaboration When:

- ❌ Your seed is already detailed and ready to convert
- ❌ You prefer manual project creation from scratch
- ❌ You want complete freedom without AI guidance

---

## Quick Start

**Complete your first elaboration in 2 minutes:**

1. Navigate to **My Seed Garden** from your dashboard
2. Click on any saved seed
3. Click the **"Elaborate"** button
4. Answer 7 questions (use quick reply buttons for speed!)
5. Watch the progress bar climb to 80%+
6. Click **"Convert to Project"**

### Progress Milestones

- **0-30%** - Just getting started
- **30-60%** - Making good progress
- **60-80%** - Almost there!
- **80%+** - ✅ Ready to convert!

---

## Step-by-Step Walkthrough

### Starting Elaboration

**Step 1: Navigate to Your Seed**
- From dashboard → **"My Seed Garden"**
- Click on any saved seed
- Find the **"Elaborate"** button on the seed detail page

**Step 2: Start the Conversation**
- Click **"Elaborate"**
- You'll see a welcome message from the AI
- Progress indicator starts at 0%
- Chat interface appears on the left
- Metadata preview panel on the right

---

### Question 1: How Many Participants?

**What the AI asks:**
> "How many participants are you planning for this exchange?
> Erasmus+ Youth Exchanges typically range from 16 to 60 participants."

**How to Answer:**

You can be natural and conversational:
- "30 participants"
- "We're planning for about 25 young people"
- "Between 25 and 30"
- "Around twenty-eight participants"

**What Happens:**
- AI extracts the exact number from your natural language
- Validates against the 16-60 range
- Updates the metadata panel immediately
- Progress bar jumps to ~20%

**Example:**
```
You: "We expect about 30 young people"

Extracted:
{
  "participantCount": 30
}

Progress: 20% ✓
```

**Validation Rules:**
- ✅ Minimum: 16 participants
- ✅ Maximum: 60 participants
- ❌ Less than 16 → Error: "Erasmus+ Youth Exchanges require 16-60 participants"
- ❌ More than 60 → Error: "Maximum 60 participants allowed"

---

### Question 2: What's Your Budget?

**What the AI asks:**
> "What's your estimated budget per participant? (Or total budget if you prefer)
> Typical Erasmus+ Youth Exchanges range from €300-500 per participant."

**Smart Suggestion:**
If you answered 30 participants and 7 days in your seed:
> "Based on 30 participants and 7 days, consider **€400 per participant** (Total: €12,000)."

**How to Answer:**

**Option 1: Per-Participant Budget**
- "€400 per person"
- "About 450 euros each"
- "500€ per participant"

**Option 2: Total Budget**
- "Total budget of €12,000"
- "We have 15000 euros total"
- "12k euro budget"

**Auto-Calculation Magic:**
The AI automatically calculates the missing value:

```
You: "€400 per participant"

Extracted:
{
  "budgetPerParticipant": 400,
  "totalBudget": 12000  ← Auto-calculated (400 × 30)
}
```

Or if you give total first:

```
You: "Total budget of 12000 euros"

Extracted:
{
  "totalBudget": 12000,
  "budgetPerParticipant": 400  ← Auto-calculated (12000 ÷ 30)
}
```

**Quick Reply Buttons:**
Look for quick reply buttons to save time:
- "€300/person (€9,000 total)"
- "€400/person (€12,000 total)"
- "€500/person (€15,000 total)"

Click any button and it auto-submits!

**Progress Update:** ~35% complete

---

### Question 3: How Long Will It Last?

**What the AI asks:**
> "How long will the exchange last? (e.g., 7 days, 2 weeks)
> Most Youth Exchanges run for 5-21 days, including travel days."

**How to Answer:**

The AI understands multiple formats:
- **Days:** "7 days", "ten days", "8"
- **Weeks:** "2 weeks" → Converts to 14 days
- **Date ranges:** "June 15-21" → Calculates 7 days

**Examples:**
```
You: "7 days"
Extracted: { "duration": 7 }

You: "two weeks"
Extracted: { "duration": 14 }
```

**Validation:**
- ✅ Recommended: 5-21 days
- ⚠️ Less than 5 days → Warning: "Youth Exchanges typically last 5-21 days for optimal learning outcomes"
- ⚠️ More than 21 days → Warning (but still allowed)

**Progress Update:** ~50% complete

---

### Question 4: Where Will It Take Place?

**What the AI asks:**
> "Where will this exchange take place? (Country and city)
> Please mention the country and city. You can also add venue details if known."

**What AI Extracts:**
- Country (converted to ISO code)
- City name
- Venue (optional)
- Accessibility notes (optional)

**How to Answer:**

**Basic:**
```
You: "Berlin, Germany"

Extracted:
{
  "destination": {
    "country": "DE",
    "city": "Berlin"
  }
}
```

**Rich Detail:**
```
You: "Barcelona, Spain. We have a venue at the youth center in the Gràcia district. It's wheelchair accessible."

Extracted:
{
  "destination": {
    "country": "ES",
    "city": "Barcelona",
    "venue": "Youth center in Gràcia",
    "accessibility": "Wheelchair accessible"
  }
}
```

**Country Code Conversion:**
The AI automatically converts country names to ISO codes:
- Spain → ES
- Germany → DE
- Poland → PL
- France → FR
- etc.

**Progress Update:** ~65% complete

---

### Question 5: Which Countries for Participants?

**What the AI asks:**
> "Which countries will participants come from?
> List the countries whose young people will participate. This helps us calculate visa requirements."

**How to Answer:**

Natural language lists:
- "Germany, France, Spain"
- "Participants from Poland and Lithuania"
- "We'll have young people from Italy, Portugal, and Greece"

**Automatic Visa Calculation:**

After you answer, the AI **automatically determines visa requirements**!

**Example:**
```
You: "Germany, France, Spain"

Extracted:
{
  "participantCountries": ["DE", "FR", "ES"],
  "requirements": {
    "visas": [
      { "country": "DE", "needed": false },  // EU → EU
      { "country": "FR", "needed": false },  // EU → EU
      { "country": "ES", "needed": false }   // Host country
    ]
  }
}

Visa Summary:
✓ Germany (DE) → Spain: No visa needed (EU)
✓ France (FR) → Spain: No visa needed (EU)
✓ Spain (ES) → Spain: No visa needed (host country)
```

**Non-EU Example:**
```
You: "Turkey, Albania, Georgia"

Visa Summary:
⚠ Turkey (TR) → Spain: Visa required (~€80)
⚠ Albania (AL) → Spain: Visa required (~€80)
⚠ Georgia (GE) → Spain: Visa required (~€80)
```

**Progress Update:** ~70% complete

---

### Question 6: What Activities Are Planned? (Optional)

**What the AI asks:**
> "What are the main activities or workshops planned?
> Describe the key learning activities, workshops, or sessions. Be as specific as possible."

**This Question is OPTIONAL**
You can skip it if activities are still being planned. It adds 15% to completeness.

**How to Answer:**

Free-form description:
```
You: "We'll have workshops on digital marketing, coding basics for 2 days, social media strategy workshop for 1 day, plus team building activities and cultural visits to local tech companies."
```

**What AI Extracts:**

The AI parses your description into structured activities:

```
Extracted:
{
  "activities": [
    {
      "name": "Digital Marketing Workshop",
      "duration": "2 days",
      "learningOutcomes": ["Marketing skills", "Digital literacy"]
    },
    {
      "name": "Coding Basics",
      "duration": "2 days",
      "learningOutcomes": ["Programming fundamentals"]
    },
    {
      "name": "Social Media Strategy",
      "duration": "1 day",
      "learningOutcomes": ["Social media competency"]
    },
    {
      "name": "Team Building Activities",
      "duration": "Ongoing"
    },
    {
      "name": "Cultural Visits",
      "duration": "Ongoing",
      "learningOutcomes": ["Cultural awareness", "Intercultural dialogue"]
    }
  ]
}
```

**Tips for Better Extraction:**
- Mention activity names explicitly
- Include durations ("2 days", "half day", "4 hours")
- Describe learning outcomes
- List multiple activities in one response

**Progress Update:** ~85% complete

---

### Question 7: Which EU Priorities? (Optional)

**What the AI asks:**
> "Which Erasmus+ priorities does this address?
> Select the EU priorities your project aligns with. Multiple selections are encouraged!"

**This Question is OPTIONAL**
Adds 10% to completeness, but **boosts approval likelihood** when included.

**Official EU Priority Categories:**
1. Inclusion and diversity
2. Environment and fight against climate change
3. Digital transformation
4. Participation in democratic life
5. Common values, civic engagement

**Smart Suggestions:**

Based on your seed description, the AI suggests relevant priorities:

```
Seed mentions "digital skills" →
AI suggests: "Digital transformation"

Seed mentions "youth from rural areas" →
AI suggests: "Inclusion and diversity"
```

**How to Answer:**

Natural language:
- "Digital transformation and inclusion"
- "We focus on green themes and civic participation"
- "Climate action is the main priority"
- Click suggested priorities (if shown as quick replies)

**Example:**
```
You: "Digital transformation is the main focus, but we also promote inclusion by targeting youth with fewer opportunities"

Extracted:
{
  "erasmusPriorities": [
    "Digital transformation",
    "Inclusion and diversity"
  ]
}
```

**Progress Update:** 90-100% complete!

---

### Converting to Project

**When You Reach 80%+ Completeness:**

The **"Convert to Project"** button becomes enabled (green).

**What Happens When You Click:**

1. **Full project structure is created:**
   - Auto-generated phases (Preparation, Exchange, Follow-up)
   - Budget allocated across phases
   - Timeline calculated from duration
   - Activities mapped to programme schedule
   - All metadata populates project fields

2. **Timeline Generation Example:**

If your exchange is **7 days from June 15-21, 2026**:

```
Preparation Phase: April 15 - June 14 (60 days before)
Youth Exchange Phase: June 15 - June 21 (7 days)
Follow-up Phase: June 22 - July 21 (30 days after)
```

3. **You're redirected to the project detail page** where you can:
   - View complete project structure
   - Edit any fields
   - Add more activities or details
   - Build the programme schedule
   - Submit for approval

**Completeness Requirements:**
- ✅ Minimum 80% for conversion
- ✅ All required questions answered (Questions 1-5)
- ✅ Validation passed (participant count, budget, etc.)

**Button States:**

Before 80%:
```
[Disabled] Complete 25% more to convert
```

At 80%+:
```
[Enabled] ✓ Convert to Project
```

---

## Understanding the 7 Questions

### Question Summary Table

| # | Question | Weight | Required? | Purpose |
|---|----------|--------|-----------|---------|
| 1 | How many participants? | 20% | ✅ Yes | Validates Erasmus+ requirements (16-60) |
| 2 | What's your budget? | 15% | ✅ Yes | Auto-calculates per-person and total budgets |
| 3 | How long will it last? | 15% | ✅ Yes | Determines project duration (5-21 days ideal) |
| 4 | Where will it take place? | 15% | ✅ Yes | Extracts destination, venue, accessibility |
| 5 | Which countries? | 10% | ✅ Yes | Auto-calculates visa requirements |
| 6 | What activities? | 15% | ❌ No | Structures programme content |
| 7 | Which EU priorities? | 10% | ❌ No | Aligns with Erasmus+ strategic goals |

**Total Required:** 75% (Questions 1-5)
**Total Optional:** 25% (Questions 6-7)
**Conversion Threshold:** 80%+

### Why These Questions?

These 7 questions map directly to **Erasmus+ KA1 Youth Exchange application requirements:**

1. **Participants** → Required by application forms
2. **Budget** → Required for grant calculation
3. **Duration** → Required for programme planning
4. **Destination** → Required for logistics and venue booking
5. **Countries** → Required for visa/travel arrangements
6. **Activities** → Programme details section
7. **EU Priorities** → Strategic alignment (boosts approval likelihood)

By answering these questions, you're building a **complete foundation** for your Erasmus+ application.

---

## Features Explained

### Completeness Indicator

**How It Works:**

The progress bar uses a **weighted scoring system**:

```
Completeness = Σ (Question Weight × Answered)

Example:
Participant count (20%) ✓ = 20%
Budget (15%) ✓           = 15%
Duration (15%) ✓         = 15%
Destination (15%) ✓      = 15%
Countries (10%) ✓        = 10%
Activities (15%) ✗       = 0%
EU Priorities (10%) ✗    = 0%
────────────────────────────
Total                    = 75%
```

**Visual Indicators:**
- 🔴 **Red (0-49%):** "Let's get started!"
- 🟡 **Yellow (50-79%):** "You're making progress!"
- 🟢 **Green (80-100%):** "Great work! Ready to convert!"

**Required vs Optional:**
- **Required questions** (1-5) contribute **75% of the score**
- **Optional questions** (6-7) contribute **25%**
- You must reach **80%** to convert, so answering 1-2 optional questions is recommended

---

### AI Metadata Extraction

**Natural Language Processing:**
- Powered by **GPT-4o** with structured output parsing
- Handles variations in phrasing
- Extracts structured data automatically
- Uses **Zod schemas** for validation

**Examples of Variation Handling:**

**Participant Count:**
```
"30 participants"           → 30
"We expect about 28 people" → 28
"Around thirty"             → 30
"Between 25 and 30"         → 27-28 (AI picks midpoint)
```

**Budget:**
```
"€400 per participant"          → budgetPerParticipant: 400
"Total budget of 12000 euros"   → totalBudget: 12000
"About 450€ each"               → budgetPerParticipant: 450
"We have fifteen thousand euro" → totalBudget: 15000
```

**Countries:**
```
"Germany, France, Spain"                → ["DE", "FR", "ES"]
"Participants from Poland and Lithuania" → ["PL", "LT"]
"Italian and Greek youth"                → ["IT", "GR"]
```

The AI automatically:
- Converts country names to ISO 2-letter codes
- Handles misspellings and variations
- Parses lists (commas, "and", "or")
- Extracts numbers from text

---

### Budget Calculation

**Auto-Calculation Logic:**

**If you provide per-participant budget:**
```
Input: "€400 per participant"
Participant count: 30

Calculation:
totalBudget = budgetPerParticipant × participantCount
            = €400 × 30
            = €12,000
```

**If you provide total budget:**
```
Input: "Total budget of €12,000"
Participant count: 30

Calculation:
budgetPerParticipant = totalBudget ÷ participantCount
                     = €12,000 ÷ 30
                     = €400
```

**Smart Defaults:**

If you haven't entered budget yet, the AI suggests:

```
Formula: (duration × €50) + €150

Example:
Duration: 7 days
Participant count: 30

Suggested per-person: (7 × €50) + €150 = €500
Suggested total: €500 × 30 = €15,000
```

**Validation:**
- ⚠️ Warns if <€200/person or >€700/person
- ⚠️ Total must be >€5,000 for Erasmus+ eligibility

---

### Timeline Calculation

**Smart Date Parsing:**

The AI understands:
- Days: "7 days" → duration = 7
- Weeks: "2 weeks" → duration = 14
- Date ranges: "June 15-21" → calculates days between

**When Converted to Project:**

The system generates a **3-phase timeline**:

1. **Preparation Phase:** 60-90 days before exchange
2. **Youth Exchange Phase:** Your specified duration
3. **Follow-up Phase:** 30 days after exchange

**Example:**
```
Your input: "7 days from June 15-21, 2026"

Generated timeline:
┌─────────────────────────────────────────┐
│ Preparation: April 15 - June 14 (60d)  │
│ Exchange: June 15 - June 21 (7d)        │
│ Follow-up: June 22 - July 21 (30d)     │
└─────────────────────────────────────────┘
Total project: 97 days
```

---

### Visa Auto-Calculation

**How It Works:**

1. **Destination country** is determined (e.g., Spain = ES)
2. **Participant countries** are listed (e.g., DE, FR, PL)
3. **EU membership check** is performed for each country
4. **Visa requirements** are auto-generated

**Logic:**

```
EU country → EU country = No visa
Non-EU country → EU country = Visa required (~€80)
Non-EU → Non-EU = Depends (consult embassy)
```

**Example 1: All EU Countries**

```
Destination: Spain (ES)
Participants: Germany (DE), France (FR), Poland (PL)

Result:
✓ Germany → Spain: No visa (EU → EU)
✓ France → Spain: No visa (EU → EU)
✓ Poland → Spain: No visa (EU → EU)

Visa cost: €0
```

**Example 2: Mixed EU/Non-EU**

```
Destination: Germany (DE)
Participants: France (FR), Turkey (TR), Albania (AL)

Result:
✓ France → Germany: No visa (EU → EU)
⚠ Turkey → Germany: Visa required (~€80)
⚠ Albania → Germany: Visa required (~€80)

Visa cost: €160 (2 participants × €80)
```

**Important Note:**
This is a **simplified calculation**. Actual visa requirements depend on:
- Specific nationality
- Purpose of travel
- Bilateral agreements
- Schengen rules

Always verify with relevant embassies.

---

### Quick Reply Buttons

**When They Appear:**

Quick replies show up for questions with **common answers**:
- Budget question (€300, €400, €500 options)
- Duration (5, 7, 10, 14 days)
- EU priorities (checkboxes for each category)

**How to Use:**

1. AI asks a question
2. Quick reply buttons appear below
3. Click any button
4. Answer is **auto-submitted** (no need to click send!)

**Example - Budget Question:**

```
┌─────────────────────────────────────┐
│ Quick Replies:                      │
│ ┌───────────────────────────┐       │
│ │ €300/person (€9,000)      │       │
│ └───────────────────────────┘       │
│ ┌───────────────────────────┐       │
│ │ €400/person (€12,000)     │       │
│ └───────────────────────────┘       │
│ ┌───────────────────────────┐       │
│ │ €500/person (€15,000)     │       │
│ └───────────────────────────┘       │
│ ┌───────────────────────────┐       │
│ │ Custom amount             │       │
│ └───────────────────────────┘       │
└─────────────────────────────────────┘
```

Click "€400/person (€12,000)" and it's done!

**Benefits:**
- ✅ Faster than typing
- ✅ Guaranteed to work (pre-validated)
- ✅ Reduces errors

---

### Edit Message Feature

**Why Edit?**

Made a mistake? Noticed a typo? Want to change an answer?

**How It Works:**

1. **Hover** over any of your messages
2. **Click** the edit icon (pencil ✏️)
3. Message text **populates the input field**
4. **Modify** your answer
5. **Send** the updated message
6. Conversation **truncates from that point forward**
7. AI **re-processes** from the edited message

**Important:**
Editing removes all messages **after** the edited one. The AI starts fresh from your new answer.

**Example:**

```
Before edit:
[You] "10 participants"        ← You realize this is wrong
[AI]  "That seems low..."

After edit:
[You] "30 participants"        ← Corrected
[AI]  "Great! 30 is perfect." ← New response
[Metadata updated with 30]
```

---

### Uncertainty Detection

**Trigger Phrases:**

The AI detects when you're unsure:
- "I'm not sure"
- "I don't know"
- "Maybe"
- "Not certain"
- "Approximately"
- "Roughly"

**What Happens:**

A **yellow help banner** appears:

```
┌────────────────────────────────────────────┐
│ 💡 It's okay not to know!                  │
│ We can estimate or skip this for now.     │
│ ┌──────────────┐                          │
│ │ Skip Question │                          │
│ └──────────────┘                          │
└────────────────────────────────────────────┘
```

**Options:**
1. **Skip the question** (if optional)
2. **Use AI's default estimate**
3. **Continue and provide a rough answer** (you can refine later in project editing)

**Example:**

```
You: "I'm not sure about the budget yet"

AI Response:
"No problem! Based on 30 participants and 7 days,
I'd estimate around €400 per participant (€12,000 total).
We can refine this later when you convert to a full project.

Would you like me to use this estimate for now?"
```

---

## Tips & Best Practices

### Answering Questions Effectively

**Be Conversational:**

✅ **Good:**
```
"We're planning for about 30 young people from Germany,
France, and Spain for a week-long exchange"
```

❌ **Too Terse:**
```
"30 | DE FR ES | 7d"
```

The AI understands natural language better than abbreviations.

**Provide Context When Helpful:**

✅ **Rich Detail:**
```
"Barcelona, Spain. We have a venue at the youth center
in the Gràcia district with wheelchair access and
proximity to public transport."
```

✅ **Also Fine:**
```
"Barcelona, Spain"
```

More detail helps, but isn't required.

**Use Quick Replies When Available:**

If you see quick reply buttons, **use them**!
- Faster than typing
- Pre-validated
- One click to submit

---

### Making the Most of Auto-Features

**Let AI Help You:**

The AI provides:
- **Budget estimates** based on duration and participant count
- **EU priority suggestions** from your seed description
- **Visa requirement calculations** automatically
- **Timeline generation** for project phases

**Review Metadata as You Go:**

After each answer:
1. Check the **metadata preview panel** on the right
2. Ensure AI extracted correctly
3. If something's wrong, **edit your message**

**Example:**

```
You: "Barcelona, Spain"

Check metadata panel:
{
  "destination": {
    "country": "ES",  ← Correct?
    "city": "Barcelona"  ← Correct?
  }
}

✓ Looks good!
```

---

### When to Skip Questions

**Skip Optional Questions If:**

- Activities are still being planned (add during project editing)
- EU priorities are unclear
- You want to finalize details later

**You Can Add These Later:**

After converting to a project, you can:
- Edit project fields directly
- Add/remove activities
- Refine learning objectives
- Update EU priorities

**Minimum Recommended:**

Answer **at least Questions 1-5** (required) + **1 optional** to reach 80%+ for conversion.

---

### Handling Validation Errors

**Common Validation Messages:**

**Error:** "Erasmus+ Youth Exchanges require 16-60 participants"

**How to Fix:**
1. Note the requirement (16-60 range)
2. Edit your previous message
3. Provide a valid number

**Example:**

```
You: "10 participants"
AI:  "Erasmus+ Youth Exchanges require 16-60 participants"

Edit message to: "18 participants"
AI:  "Great! 18 is a good size."
```

**Common Validations:**
- ✅ Participants: 16-60
- ✅ Budget: >€5,000 total minimum
- ✅ Duration: 5-21 days recommended

---

## Troubleshooting

### AI Misunderstood My Answer

**Problem:**
You said "28 participants" but AI extracted "18"

**Solution:**
1. Hover over your message
2. Click the **edit icon** (✏️)
3. Rephrase more explicitly: "We're planning for twenty-eight participants"
4. Send

The conversation reprocesses from that point.

---

### Progress Bar Stuck Below 80%

**Problem:**
Answered all required questions but only at 70%

**Cause:**
Optional questions (6 and 7) are skipped

**Solution:**

**Option 1:** Answer 1-2 optional questions to reach 80%
- Add activities (Question 6) = +15%
- Add EU priorities (Question 7) = +10%

**Option 2:** Convert at lower percentage
- You can't convert below 80% via the button
- But you can manually create a project and add details later

---

### Quick Replies Not Showing

**Problem:**
No quick reply buttons appear

**Cause:**
Not all questions have quick replies. Only:
- Budget (€300, €400, €500 options)
- Sometimes duration
- Sometimes EU priorities (checkboxes)

**Solution:**
Type your answer manually - equally valid!

---

### Can't Click "Convert to Project"

**Problem:**
Button is disabled/grayed out

**Requirements:**
- ✅ Completeness ≥80%
- ✅ All required questions answered
- ✅ Validation passed

**Solution:**
1. Check progress indicator percentage
2. Answer remaining questions
3. Fix any validation errors (red error messages)

---

### Elaboration Not Saving

**Problem:**
Refreshed the page and conversation was lost

**Current Behavior:**
- Elaboration state is stored **in-memory** (frontend state management)
- **Not persisted** to database until you convert
- Refreshing the page clears the state

**Workaround:**
- Complete elaboration in **one session** (takes <5 minutes)
- Don't refresh or navigate away mid-elaboration

**Future Enhancement:**
Session persistence is planned for a future update.

---

### Wrong Metadata Extracted

**Problem:**
Said "Barcelona, Spain" but metadata shows "Barcelona, Ecuador"

**Solution:**

**Check the metadata preview panel:**
```
{
  "destination": {
    "country": "EC",  ← Wrong!
    "city": "Barcelona"
  }
}
```

**Fix it:**
1. Edit your message
2. Be more explicit: "Barcelona in Spain (ES)"
3. Or: "Barcelona, España (country code ES)"

The AI will re-extract correctly.

---

### Visa Calculation Seems Wrong

**Problem:**
AI says visa required but you think it's not needed

**Remember:**
- Visa calculation is **simplified** (EU vs non-EU check)
- Actual requirements depend on:
  - Specific bilateral agreements
  - Travel purpose
  - Nationality
  - Schengen rules

**Solution:**
- Use the auto-calculation as a **starting point**
- Always verify with official embassy sources
- Update visa requirements manually in project editing

---

## FAQ

### General Questions

**Q: How long does elaboration take?**
A: Typically **1-2 minutes**. 7 questions, most have quick reply options for speed.

**Q: Can I pause and resume later?**
A: Currently **no** - complete in one session. Future versions will support saving progress.

**Q: Do I have to answer all questions?**
A: **No.** Only 5 questions are required (Questions 1-5). Activities and EU priorities are optional.

**Q: Can I edit answers after converting to a project?**
A: **Yes!** All project fields are editable. Metadata can be updated in the project view.

**Q: What happens to my seed after elaboration?**
A: The seed remains in your Seed Garden. Elaboration data is stored as metadata. You can elaborate multiple times if needed.

---

### About the Questions

**Q: Why these specific 7 questions?**
A: They map to **Erasmus+ KA1 Youth Exchange application requirements:**
- Participants, budget, duration → Required by application forms
- Destination, countries → For visa and logistics planning
- Activities → Programme details section
- EU priorities → Strategic alignment (boosts approval likelihood)

**Q: Can I skip optional questions?**
A: **Yes.** Activities (Q6) and EU priorities (Q7) are optional. However:
- They increase completeness score
- They boost approval likelihood
- They save time during project editing later

**Q: What if I answer "I don't know"?**
A: The AI detects uncertainty and offers to:
- Provide default estimates
- Skip the question (if optional)
- Explain why it matters

**Q: Can I answer questions in a different order?**
A: **No.** The conversation flow is sequential. Each question builds on previous answers (e.g., budget calculation uses participant count).

---

### About Metadata

**Q: Where does the AI get smart suggestions?**
A: From your original seed:
- Seed says "30 participants" → AI suggests 28-30
- Seed mentions "digital skills" → AI suggests "Digital transformation" priority
- AI calculates budget from duration × participants

**Q: How accurate is visa calculation?**
A: **Simplified but reliable** for planning:
- EU → EU: No visa needed
- Non-EU → EU: Visa required (~€80 estimate)
- Real requirements vary by nationality and purpose - always verify with embassies

**Q: Can I override AI's extraction?**
A: **Yes**, via:
1. Edit message feature (during elaboration)
2. Project editing (after conversion)

**Q: What AI model powers this?**
A: **GPT-4o** with structured output parsing and Zod schema validation.

---

### About Completeness

**Q: Why can't I convert at 70% completeness?**
A: **80% threshold** ensures you have:
- All required questions answered (75%)
- At least 1 optional question (+10-15%)
- Minimum viable project data for conversion

**Q: How is completeness calculated?**
A: **Weighted sum:**
```
Participant count: 20%
Budget: 15%
Duration: 15%
Destination: 15%
Countries: 10%
Activities: 15%
EU Priorities: 10%
─────────────────
Total: 100%
```

**Q: What if I'm stuck at 75%?**
A: You've answered all **required** questions (1-5). To reach 80%:
- Add activities (Question 6) → +15%
- Or add EU priorities (Question 7) → +10%

---

### Conversion & Projects

**Q: What exactly gets created when I convert?**
A:
- **Full project** with 3 phases (Preparation, Exchange, Follow-up)
- **Timeline** calculated from duration and dates
- **Budget** allocated across phases
- **Participant structures** with countries and visa info
- **Activities** mapped to programme schedule
- **All metadata** fields populated

**Q: Can I elaborate multiple times?**
A: **Yes!** Each elaboration updates the seed's metadata. Latest version becomes current state.

**Q: What if I don't like the converted project?**
A: You can:
- **Delete the project** (seed remains in your garden)
- **Edit the project** extensively
- **Re-elaborate** the seed and convert again

**Q: Can I convert a seed without elaboration?**
A: **Yes**, but you'll need to:
- Fill in all project fields manually
- Calculate budgets, timelines yourself
- Set up phases and activities from scratch

Elaboration saves significant time by auto-generating this structure.

---

### Technical Questions

**Q: Is my data saved during elaboration?**
A: Conversation and metadata are stored in the **database** as part of your seed's elaboration history.

**Q: Can I see elaboration history?**
A: Currently visible **during the session**. Historical view is planned for future updates.

**Q: What if AI is unavailable?**
A: If the AI service is down:
- You can still create projects manually
- Elaboration feature will be temporarily unavailable
- Your saved seeds remain accessible

**Q: Does elaboration cost tokens/credits?**
A: This depends on your OpenHorizon plan. Check your account settings for usage details.

---

## Related Documentation

### Next Steps

After elaborating your seed, explore:
- **[Converting Seeds to Projects](projects.md#converting-from-seeds)** - How to work with your new project
- **[Building Programme Schedules](programmes.md)** - Add detailed daily activities
- **[Budget Calculator](budget.md)** - Refine budget allocations

### Other Guides

- **[Seeds Overview](seeds.md)** - Learn about seed generation
- **[Getting Started](../getting-started.md)** - New to OpenHorizon?
- **[Troubleshooting](../troubleshooting.md)** - Common issues

---

## Need Help?

### For Feature Questions

**Email:** info@openhorizon.cc
**Response time:** 24-48 hours (weekdays)

### For Bugs or Issues

**GitHub Issues:** [openhorizon.cc/issues](https://github.com/gpt153/openhorizon.cc/issues)
Please include:
- Steps to reproduce
- Screenshot (if applicable)
- Seed ID (found in URL)

### For Feature Requests

We'd love to hear your ideas! Submit them via:
- GitHub Discussions
- Email: info@openhorizon.cc

---

**Ready to elaborate your first seed?**

→ [Create a seed](seeds.md) or [visit your Seed Garden](../getting-started.md#seed-garden) 🌱

---

*Last Updated: 2026-01-18*
*Feature Version: Issue #97 (Seed Elaboration v1)*
*Technical Docs: [SEED_ELABORATION_README.md](../../../SEED_ELABORATION_README.md)*
