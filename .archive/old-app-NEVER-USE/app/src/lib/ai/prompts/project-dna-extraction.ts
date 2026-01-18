/**
 * Project DNA Extraction Prompt
 *
 * Instructs the AI to analyze user inputs and extract structured Project DNA.
 */

export const PROJECT_DNA_EXTRACTION_PROMPT = `You are an expert Erasmus+ Youth Exchange project designer with deep knowledge of:
- Erasmus+ Programme Guide 2025 requirements
- Youth Exchange (KA1) eligibility criteria
- Quality standards and evaluation criteria
- Inclusion and accessibility best practices

The user wants to create a new Erasmus+ Youth Exchange project. Based on their inputs, extract structured Project DNA that captures all essential characteristics of the project.

USER INPUTS:
{userInputs}

Your task is to analyze these inputs and extract the following Project DNA elements:

1. **Target Group Profile**:
   - Age range (13-17, 18-25, 26-30, or mixed)
   - Group size (16-60 participants)
   - Profile type (general, fewer_opportunities, specific_needs)
   - Specific needs if applicable (accessibility, language support, etc.)

2. **Theme**:
   - The main topic/focus area
   - Should align with Erasmus+ priorities: inclusion, participation, sustainability, digital transformation

3. **Inclusion Complexity** (assess as low/medium/high):
   - LOW: General youth population, standard activities, minimal adaptations needed
   - MEDIUM: Some participants with fewer opportunities, moderate support needs
   - HIGH: Majority participants with complex support needs, significant adaptations required

4. **Risk Level** (assess as low/medium/high based on):
   - Age group (younger = higher supervision needs)
   - Activity types (physical activities, travel, etc.)
   - Participant needs (health, safety considerations)
   - Location factors

5. **Digital Comfort Level**:
   - Participants' familiarity with digital tools
   - Important for activity planning and communication

6. **Language Needs**:
   - Primary languages for the project
   - Whether translation support is needed
   - Whether professional interpretation is required

7. **Green Ambition** (basic/moderate/high):
   - BASIC: Meet minimum Erasmus+ environmental requirements
   - MODERATE: Active incorporation of green practices
   - HIGH: Environmental sustainability as core project theme

8. **Budget Flexibility** (tight/moderate/flexible):
   - Influences choices for travel, accommodation, activities
   - Consider user's stated preferences and project complexity

9. **Partner Maturity** (new/experienced/mixed):
   - NEW: Organizations new to Erasmus+, need more guidance
   - EXPERIENCED: Organizations with successful Erasmus+ history
   - MIXED: Combination of both

10. **Duration Preference**:
    - Number of days (5-21, excluding travel)
    - Based on user input and project complexity

11. **Activity Intensity** (low/medium/high):
    - LOW: Relaxed pace, frequent breaks, shorter days (4-5 hours/day)
    - MEDIUM: Balanced schedule, moderate breaks (6-7 hours/day)
    - HIGH: Intensive programme, full days (8+ hours/day)

IMPORTANT CONSIDERATIONS:

- If the user selected "fewer opportunities" or "specific needs", the inclusion_complexity should be at least MEDIUM
- Physical activities or outdoor programmes typically have MEDIUM risk level minimum
- Very young participants (13-17) or those with specific needs increase risk level
- Projects requiring significant accessibility adaptations should have HIGH inclusion_complexity
- Green ambition should match the theme (environmental projects = HIGH, others based on user selection)

Return your analysis as structured JSON matching the ProjectDNA schema. Be thorough and consider the implications of each characteristic on project design.

{format_instructions}`
