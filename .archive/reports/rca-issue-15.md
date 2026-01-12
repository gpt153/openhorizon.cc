# Root Cause Analysis: Working vs Formal Mode Issue (#15)

**Issue**: Mode switching toggle exists but "nothing happens" when switching to formal mode. Working mode text seems like it belongs in formal mode.

**Reported By**: gpt153
**Date**: 2024-12-22
**Priority**: HIGH

---

## Executive Summary

The working/formal mode toggle is **partially implemented** in the codebase:
- ✅ Toggle infrastructure works (store, UI component, persistence)
- ✅ Database schema includes formal fields for Seeds
- ✅ AI prompts request both working and formal versions
- ❌ **AI is NOT generating distinct content for the two modes**
- ❌ **Working mode text reads too formally (like Erasmus+ application language)**

**Root Cause**: The AI prompt instructions are requesting both modes, but the examples and tone guidance are causing the LLM to produce nearly identical or similarly formal text for both versions.

---

## Detailed Investigation

### 1. Database Layer ✅ CORRECT

**Seed Model Schema** (`prisma/schema.prisma` lines 313-347):
```prisma
model Seed {
  // Working mode (informal, authentic language)
  title              String
  description        String
  approvalLikelihood Float

  // Formal mode (application-ready Erasmus+ language)
  titleFormal              String?
  descriptionFormal        String?
  approvalLikelihoodFormal Float?
}
```

**Status**: Schema is correct. Both modes are properly defined.

---

### 2. Store & UI Layer ✅ CORRECT

**Store** (`lib/stores/contentModeStore.ts`):
- Zustand store with localStorage persistence
- `toggleMode()` correctly switches between 'working' and 'formal'
- Computed properties `isWorking` and `isFormal` work correctly

**UI Components**:
- `ContentModeToggle.tsx` - Toggle button in header works
- `useContentField()` hook - Correctly selects field based on mode
- `SeedCard.tsx` - Uses `useContentField()` to display correct version

**Status**: UI infrastructure is correct and functional.

---

### 3. AI Prompt Layer ⚠️ PROBLEMATIC

**Seed Generation Prompt** (`lib/ai/prompts/seed-generation.ts` lines 34-80):

The prompt DOES request both modes:

```
WORKING MODE (5-10 words):
- Memorable and evocative
- Clearly hints at the theme
- Professional yet creative
- Example: "Ocean Guardians: Youth Leading Marine Conservation"

FORMAL MODE (5-15 words):
- Same content in official Erasmus+ terminology
- Professional and institutional tone
- Application-ready language
- Example: "Capacity Building for Youth-Led Environmental Stewardship: Marine Ecosystem Conservation and Advocacy"
```

**PROBLEM #1: Unclear Tone Guidance for Working Mode**

Lines 48-54 for description:
```
WORKING MODE (100-150 words):
- What the project is about (2-3 sentences)
- Key activities or approaches (2-3 examples)
- Who it's for and why it matters (1 sentence)
- What participants will gain (1 sentence)
- Use informal, engaging tone (like talking to a friend)
- Be specific with details (not "team activities" but "building miniature wind turbines")
```

BUT then line 115 contradicts:
```
TONE:
Informal, enthusiastic, inspiring. Write like you're pitching exciting opportunities to friends, not writing a formal grant application.
```

**This "TONE" instruction applies to the ENTIRE prompt**, causing the LLM to write working mode descriptions that are TOO INFORMAL in some parts, but the structural requirements (professional, clear learning outcomes) cause it to default to formal language anyway.

**PROBLEM #2: Examples Don't Show Enough Contrast**

The example titles show contrast:
- Working: "Ocean Guardians: Youth Leading Marine Conservation"
- Formal: "Capacity Building for Youth-Led Environmental Stewardship: Marine Ecosystem Conservation and Advocacy"

But there are **NO example descriptions** showing the difference between working and formal mode prose.

**PROBLEM #3: Conflicting Instructions**

Line 103: "Make the reader think 'I want to do this!'" (suggests excitement)
Line 55: "Use informal, engaging tone (like talking to a friend)" (suggests casual)

But then the Erasmus+ context (lines 15-20) and quality standards (lines 100-105) push the LLM toward professional language.

**Result**: The LLM compromises by writing working mode in "professional but enthusiastic" language, which reads too much like formal mode.

---

### 4. Actual Behavior Analysis

**What's Actually Happening**:

1. User clicks toggle → Store updates correctly ✅
2. UI re-renders and calls `useContentField(working, formal)` ✅
3. **But `formal` field contains text that's nearly identical to `working`** ❌
4. **And `working` field contains text that's too formal** ❌

**Example** (hypothetical based on issue description):

**Working Mode** (what's generated):
> "This youth exchange focuses on marine conservation through hands-on environmental stewardship. Participants will engage in beach cleanup activities, conduct marine biodiversity surveys, and develop advocacy campaigns. The project targets youth aged 16-25 interested in environmental sustainability and aims to build competencies in ecological awareness and community engagement."

**Formal Mode** (what's generated):
> "This youth exchange project centers on marine ecosystem conservation through experiential non-formal learning methodologies. Participants will undertake coastal environmental restoration activities, conduct marine biodiversity assessment protocols, and design evidence-based advocacy initiatives. The project targets young people aged 16-25 with interests in environmental sustainability and aims to develop competencies in ecological literacy and civic participation aligned with EU Green Deal priorities."

**Problem**: Both sound like Erasmus+ application language! Working mode should sound more like:

> "Picture this: a week by the ocean where you're not just learning about marine life—you're actually making a difference. You'll spend mornings cleaning beaches and counting fish species (way more fun than it sounds!), then use what you find to create social media campaigns that'll make people care. Perfect for anyone aged 16-25 who loves the ocean and wants to turn that passion into real action."

---

## Root Causes

### Primary Root Cause: **Prompt Design Confusion**

The seed generation prompt (`lib/ai/prompts/seed-generation.ts`) has **conflicting tone instructions** that cause the LLM to:
1. Write working mode too formally (because Erasmus+ context dominates)
2. Write formal mode only slightly more formally (no strong differentiation)

### Contributing Factors:

1. **Lack of Strong Contrast Examples**
   - No side-by-side description examples showing the dramatic difference
   - LLM doesn't have a clear template to follow

2. **"Professional yet creative" Paradox**
   - Working mode says "professional yet creative" (line 37)
   - This is too vague and allows formal language to creep in

3. **Erasmus+ Context Dominates**
   - Lines 15-20 establish strong Erasmus+ framing
   - This "formal" context biases all subsequent generation

4. **Tone Instruction Placement**
   - The "TONE:" section (line 115) is at the END
   - LLM has already internalized the formal Erasmus+ context by then

---

## Evidence

1. **Database Schema**: ✅ Correct (formal fields exist)
2. **Store Logic**: ✅ Correct (mode switches properly)
3. **UI Rendering**: ✅ Correct (displays field based on mode)
4. **Prompt Structure**: ❌ Problematic (see above)
5. **Generated Output**: ❌ Too similar between modes (user report)

---

## Impact Assessment

**User Experience**:
- Toggle appears broken (no visible change when switching)
- Working mode isn't helpful for brainstorming (too formal)
- Formal mode isn't distinctive enough for applications

**Technical Debt**:
- Database stores redundant similar content
- Wasted tokens/cost generating near-duplicate text
- Users lose trust in the feature

**Business Impact**:
- Core feature (dual-mode content) doesn't provide value
- Users can't use working mode for casual ideation
- Users can't rely on formal mode for application-ready text

---

## Verification Steps

To confirm this RCA, I recommend:

1. **Test Current Behavior**:
   ```bash
   # Generate seeds with current prompt
   # Compare working vs formal field content
   # Measure semantic similarity (should be <0.6, likely >0.8 currently)
   ```

2. **Check Database**:
   ```sql
   SELECT title, titleFormal,
          description, descriptionFormal
   FROM seeds
   LIMIT 5;
   ```
   Compare the pairs manually.

3. **Prompt Testing**:
   - Send current prompt to GPT-4 with sample input
   - Observe if working/formal outputs are too similar
   - Observe if working mode sounds too formal

---

## Recommended Fix Strategy

### Fix #1: Rewrite Prompt Tone Guidance (CRITICAL)

**Target File**: `app/src/lib/ai/prompts/seed-generation.ts`

**Changes**:

1. **Separate the two modes into distinct sections**:
   - Generate working mode FIRST with casual tone
   - Then generate formal mode with EU terminology
   - Use clear headers: "PART 1: WORKING MODE" and "PART 2: FORMAL MODE"

2. **Add concrete description examples**:
   ```
   WORKING MODE DESCRIPTION EXAMPLE:
   "Imagine spending a week in the mountains learning to film documentaries about climate change. You'll team up with youth from 5 countries, shoot real footage of melting glaciers, interview local farmers about changing weather, and edit it all into a short film you'll actually publish online. No experience needed—just bring curiosity and a willingness to get outdoors. By the end, you'll know how to tell stories that make people care about the planet."

   FORMAL MODE DESCRIPTION EXAMPLE:
   "This youth exchange employs participatory video methodologies to develop participants' competencies in environmental communication and media literacy. Through a structured 7-day non-formal learning programme, participants from 5 partner countries will engage in field-based documentary production focusing on climate adaptation narratives. Activities include glacial environment observation, stakeholder interview techniques, and collaborative post-production. The project targets youth aged 18-25 with no prior media experience, developing intercultural competencies and environmental awareness aligned with Erasmus+ Key Action 1 priorities and EU Green Deal objectives."
   ```

3. **Clarify tone for each mode**:
   - Working mode: "Write like you're texting a friend about an exciting opportunity. Use 'you' and 'we'. Be specific and visual. Make them feel the experience."
   - Formal mode: "Write like you're submitting to the EU National Agency. Use third person. Include Erasmus+ terminology. Reference programme frameworks."

4. **Reorder the prompt**:
   - Put tone instructions BEFORE content instructions
   - Establish the voice before asking for specifics

### Fix #2: Add Prompt Quality Checks

**Target File**: `app/src/server/services/brainstorm-generator.ts`

Add validation after AI generation:

```typescript
// After LLM generates seeds
for (const seed of generatedSeeds) {
  // Check 1: Formal version should be longer (typically)
  if (seed.descriptionFormal.length < seed.description.length * 1.1) {
    console.warn(`Seed "${seed.title}" has unexpectedly short formal version`)
  }

  // Check 2: Formal should contain EU terminology
  const euTerms = ['non-formal learning', 'intercultural', 'competenc', 'Key Action', 'programme']
  const formalHasTerms = euTerms.some(term =>
    seed.descriptionFormal.toLowerCase().includes(term)
  )
  if (!formalHasTerms) {
    console.warn(`Seed "${seed.title}" formal version lacks EU terminology`)
  }

  // Check 3: Working should feel casual (presence of "you", "we", contractions)
  const casualIndicators = /\b(you|we|I|let's|don't|can't|it's)\b/i
  if (!casualIndicators.test(seed.description)) {
    console.warn(`Seed "${seed.title}" working version may be too formal`)
  }
}
```

### Fix #3: Update Seed Elaboration Prompt

**Target File**: `app/src/lib/ai/prompts/seed-elaboration.ts`

Lines 18-26 already mention maintaining both modes, but need stronger examples:

```typescript
IMPORTANT: The seed has BOTH working mode and formal mode versions. Always maintain both:

WORKING MODE:
- Casual, conversational language
- Second person ("you'll learn", "you'll do")
- Contractions and informal phrasing
- Exciting, visual descriptions
- Example: "You'll spend mornings building solar ovens (yes, they actually work!) and afternoons teaching local kids how to use them."

FORMAL MODE:
- Professional EU application language
- Third person ("participants will develop", "the project employs")
- Erasmus+ Programme Guide terminology
- Structured learning outcomes
- Example: "Morning sessions focus on renewable energy technology construction through hands-on experiential learning, while afternoon activities emphasize pedagogical competency development through youth-to-youth knowledge transfer methodologies."

When making changes, update BOTH versions appropriately.
```

---

## Testing Plan

After implementing fixes:

1. **Unit Test**: Generate 10 seeds with new prompt
   - Manually review each working/formal pair
   - Verify clear tone difference
   - Verify working mode feels casual
   - Verify formal mode has EU terminology

2. **Integration Test**: Full flow in UI
   - Generate seeds in playground
   - Toggle between modes
   - Confirm visual difference is obvious
   - Confirm no errors in console

3. **Regression Test**: Existing seeds
   - Check that old seeds still display correctly
   - Verify fallback behavior when formal is null

4. **User Acceptance**:
   - Ask user (gpt153) to test
   - Generate new seeds
   - Toggle and verify expected behavior

---

## Implementation Checklist

- [ ] Update `seed-generation.ts` prompt with new structure
- [ ] Add working/formal description examples to prompt
- [ ] Reorder prompt to put tone guidance first
- [ ] Update `seed-elaboration.ts` with stronger mode examples
- [ ] Add quality checks in `brainstorm-generator.ts`
- [ ] Test generation of 10 seeds
- [ ] Manual review of generated content
- [ ] UI test: toggle between modes
- [ ] Deploy and ask user to verify

---

## Related Files

**Prompt Files**:
- `app/src/lib/ai/prompts/seed-generation.ts` (PRIMARY FIX)
- `app/src/lib/ai/prompts/seed-elaboration.ts` (SECONDARY FIX)

**Schema Files**:
- `app/src/lib/schemas/brainstorm.ts` (already correct)

**Database**:
- `app/prisma/schema.prisma` (already correct)

**UI Components** (no changes needed):
- `app/src/lib/stores/contentModeStore.ts`
- `app/src/components/brainstorm/SeedCard.tsx`
- `app/src/components/layout/ContentModeToggle.tsx`

**Backend** (add validation):
- `app/src/server/services/brainstorm-generator.ts`

---

## Conclusion

The working/formal mode toggle **infrastructure is correct**, but the **AI prompt design** is causing both modes to generate similar, overly formal text.

The fix requires:
1. **Rewriting the prompt** to strongly differentiate tone and voice
2. **Adding concrete examples** that show the dramatic contrast
3. **Reordering instructions** so tone is established first
4. **Adding quality checks** to catch similar outputs

**Estimated Effort**: 2-3 hours
- Prompt rewrite: 1 hour
- Quality checks: 30 min
- Testing: 1 hour
- Iteration: 30 min

**Risk**: LOW (changes are isolated to prompts and validation)

---

**RCA Completed By**: Claude (remote-agent)
**Next Step**: Implement prompt fixes and test generation
