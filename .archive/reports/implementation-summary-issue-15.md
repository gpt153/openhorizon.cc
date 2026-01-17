# Implementation Summary: Fix Working vs Formal Mode (#15)

**Issue**: #15 - "working vs formal"
**Implemented By**: Claude (remote-agent)
**Date**: 2024-12-22
**Status**: ✅ COMPLETE - Ready for Testing

---

## Problem Statement

User reported that switching between working mode and formal mode "does nothing" and that the text generated for working mode "seems like they belong in formal."

### Root Cause

After thorough RCA (see `.agents/rca-issue-15.md`), the issue was identified:

1. **Toggle infrastructure works correctly** ✅
2. **Database schema includes both modes** ✅
3. **UI properly switches between fields** ✅
4. **BUT: AI prompts were generating nearly identical text for both modes** ❌

**Core Problem**: The seed generation prompt had conflicting tone instructions that caused the LLM to produce:
- Working mode: Too formal (using professional language instead of casual)
- Formal mode: Only slightly more formal (not distinct enough)

Result: Toggling between modes showed minimal visible difference.

---

## Solution Implemented

### 1. Rewrote Seed Generation Prompt
**File**: `app/src/lib/ai/prompts/seed-generation.ts`

**Changes**:
- ✅ Split prompt into clear **PART 1: WORKING MODE** and **PART 2: FORMAL MODE** sections
- ✅ Added strong tone guidance for each mode with explicit DO/DON'T rules
- ✅ Included concrete examples showing dramatic contrast:
  - Working example: Casual, second person, contractions, exciting
  - Formal example: Professional EU language, third person, no contractions, terminology
- ✅ Added visual separators (═══) to help LLM distinguish sections
- ✅ Emphasized "COMPLETELY DIFFERENT" versions requirement
- ✅ Added specific style rules with checkmarks (✓) and crosses (✗)

**Key Additions**:

```
WORKING MODE TONE:
Write like you're texting a friend about an exciting opportunity. Use "you" and "we".
Be specific and visual. Use contractions. Make them FEEL the experience.

STYLE RULES:
✓ Use "you'll", "we'll", "don't", "it's" (contractions)
✓ Use second person: "you'll learn", "you'll spend mornings..."
✓ Paint a picture - make it visual and concrete
✗ NO formal terminology
✗ NO phrases like "participants will develop competencies"
```

```
FORMAL MODE TONE:
Write like you're submitting to the EU National Agency. Use third person.
Include Erasmus+ Programme Guide terminology.

STYLE RULES:
✓ Use third person: "participants will develop", "the project employs"
✓ Include Erasmus+ terminology: "non-formal learning", "intercultural competencies"
✗ NO contractions (use "will not" not "won't")
✗ NO second person ("you")
```

---

### 2. Updated Seed Elaboration Prompt
**File**: `app/src/lib/ai/prompts/seed-elaboration.ts`

**Changes**:
- ✅ Added **CRITICAL: DUAL MODE MAINTENANCE** section
- ✅ Included side-by-side examples showing contrast
- ✅ Emphasized maintaining strong differences during elaboration
- ✅ Added voice guidance for both modes

This ensures that when users elaborate on seeds through conversation, both modes are updated but maintain their distinct character.

---

### 3. Created Quality Validation System
**File**: `app/src/lib/utils/seed-quality-validator.ts` (NEW)

**Purpose**: Automatically detect when generated seeds don't have strong enough contrast between modes.

**Validation Checks**:

1. ✓ Formal description should be longer (more detailed)
2. ✓ Formal description must contain EU terminology (at least 2 terms)
3. ✓ Working description should have casual indicators (contractions, "you")
4. ✓ Working description must use second person
5. ✓ Formal description should NOT have contractions
6. ✓ Formal description should use third person
7. ✓ Title lengths should be appropriate
8. ✓ Approval likelihood scores should differ

**Integration**:
- Added to `app/src/inngest/functions/generate-seeds.ts`
- Runs automatically after AI generation
- Logs warnings/errors to console for debugging

**Output Example**:
```
🔍 Seed Quality Validation Report:
   ✓ Seeds validated: 10
   ⚠ Warnings: 3
   ✗ Errors: 1

❌ ERRORS:
   - "Ocean Guardians" (description): Working version missing second person ("you")

⚠️  WARNINGS:
   - "Digital Storytelling" (descriptionFormal): Formal title is significantly shorter
   - "Cultural Exchange" (approvalLikelihood): Scores too similar (0.7 vs 0.72)
```

---

## Files Modified

### Prompt Files (Core Fixes)
1. ✅ `app/src/lib/ai/prompts/seed-generation.ts` - Complete rewrite
2. ✅ `app/src/lib/ai/prompts/seed-elaboration.ts` - Enhanced dual-mode guidance

### Validation (New)
3. ✅ `app/src/lib/utils/seed-quality-validator.ts` - NEW FILE

### Integration
4. ✅ `app/src/inngest/functions/generate-seeds.ts` - Added validation call

### Documentation
5. ✅ `.agents/rca-issue-15.md` - Root cause analysis
6. ✅ `.agents/implementation-summary-issue-15.md` - This file

---

## Testing Plan

### Manual Testing Required

1. **Generate New Seeds**:
   ```
   - Go to /brainstorm
   - Enter a prompt (e.g., "climate change projects for youth")
   - Generate seeds
   - Wait for completion
   ```

2. **Verify Working Mode**:
   - Toggle to "Working Mode"
   - Check seed descriptions:
     - Should use "you'll", "we'll", "don't"
     - Should use second person
     - Should sound exciting and casual
     - Example: "You'll spend a week in the mountains filming documentaries..."

3. **Verify Formal Mode**:
   - Toggle to "Formal Mode"
   - Check seed descriptions:
     - Should use "participants will develop"
     - Should include EU terminology
     - Should be more detailed/longer
     - Should sound professional
     - Example: "This youth exchange employs participatory video methodologies..."

4. **Verify Contrast**:
   - Toggle back and forth
   - Descriptions should read COMPLETELY DIFFERENTLY
   - User should immediately recognize which mode they're in

5. **Check Console**:
   - Open browser console
   - Check Inngest logs for validation report
   - Should show quality check results

### Expected Behavior

✅ **Success Criteria**:
- Working mode feels casual and exciting (like talking to a friend)
- Formal mode uses proper Erasmus+ terminology
- Clear visual difference when toggling
- No TypeScript errors
- Validation passes with minimal warnings

❌ **Failure Indicators**:
- Modes still sound similar
- Working mode still too formal
- Formal mode lacks EU terminology
- Many validation errors in console

---

## Rollback Plan

If this causes issues:

1. **Revert Prompts**:
   ```bash
   git checkout HEAD~1 app/src/lib/ai/prompts/seed-generation.ts
   git checkout HEAD~1 app/src/lib/ai/prompts/seed-elaboration.ts
   ```

2. **Remove Validation** (optional - validation is non-blocking):
   ```bash
   git checkout HEAD~1 app/src/inngest/functions/generate-seeds.ts
   rm app/src/lib/utils/seed-quality-validator.ts
   ```

---

## Performance Impact

**Minimal**:
- Prompt changes don't affect API latency (same number of tokens roughly)
- Validation runs in-memory after generation (adds ~10-50ms)
- Validation is non-blocking (doesn't prevent seed save if issues found)

**Token Usage**:
- Prompt is slightly longer (~300 more tokens)
- But produces better quality output
- Net impact: <5% increase in generation cost

---

## Future Improvements

1. **UI Enhancements**:
   - Add a "quality score" badge to seeds
   - Show validation warnings in UI for admin users
   - Add "regenerate" button for low-quality seeds

2. **Prompt Tuning**:
   - Monitor validation results over time
   - Adjust examples if certain patterns emerge
   - A/B test different prompt structures

3. **Automatic Fixes**:
   - If formal mode lacks terminology, auto-enhance with formalization chain
   - If working mode too formal, auto-casualize

4. **Analytics**:
   - Track validation pass rate
   - Monitor user toggle behavior
   - Identify which mode is used more

---

## Commit Message

```
fix(brainstorm): Rewrite seed generation prompts for strong working/formal mode contrast

Fixes #15 - working vs formal mode toggle showing minimal difference

Root Cause:
- AI prompts had conflicting tone instructions
- Working mode generated too formally
- Formal mode not distinct enough

Changes:
1. Completely rewrote seed-generation.ts prompt:
   - Split into clear WORKING MODE and FORMAL MODE sections
   - Added explicit style rules with DO/DON'T examples
   - Included concrete examples showing dramatic contrast
   - Emphasized second person (you) for working, third person for formal

2. Enhanced seed-elaboration.ts prompt:
   - Added DUAL MODE MAINTENANCE section
   - Included voice guidance for both modes
   - Ensures elaboration maintains contrast

3. Created seed-quality-validator.ts:
   - Validates working mode uses casual language
   - Validates formal mode uses EU terminology
   - Checks for contractions, person, tone
   - Integrated into generation pipeline

Testing:
- Generate new seeds and toggle between modes
- Verify strong visual/tone difference
- Check console for validation report

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Next Steps

1. **User Testing**: Ask @gpt153 to test
2. **Monitor Logs**: Check validation reports for first few generations
3. **Iterate if Needed**: Adjust prompts based on actual output
4. **Document Learnings**: Update prompt engineering guidelines

---

**Status**: ✅ Implementation Complete
**Next**: Testing & Validation
