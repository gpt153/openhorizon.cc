/**
 * AI Prompts for Programme Generation
 * Phase 2: Programme & Agenda Builder
 */

export interface DailyStructureInput {
  projectTitle: string
  durationDays: number
  participantCount: number
  ageRange: string
  theme: string
  objectives: string
  targetGroupProfile: string
  inclusionNeeds: string
}

export interface SessionGeneratorInput {
  dayNumber: number
  dayTheme: string
  morningFocus: string
  afternoonFocus: string
  eveningFocus: string
  participantCount: number
  ageRange: string
  targetProfile: string
  languageLevels: string
  inclusionNeeds: string
  countriesList: string
}

export function buildDailyStructurePrompt(input: DailyStructureInput): string {
  return `You are an expert Erasmus+ Youth Exchange programme designer with 15+ years of experience in non-formal education.

CONTEXT:
Project: ${input.projectTitle}
Duration: ${input.durationDays} days
Participants: ${input.participantCount} youth aged ${input.ageRange}
Theme: ${input.theme}
Objectives: ${input.objectives}
Target Group Profile: ${input.targetGroupProfile}
Inclusion Needs: ${input.inclusionNeeds}

TASK:
Generate a day-by-day thematic structure for this youth exchange.

REQUIREMENTS:
1. Day 1 (Arrival):
   - Afternoon: Registration, welcome, introduction to venue
   - Evening: Icebreakers, programme overview, getting to know each other

2. Days 2-${input.durationDays - 1} (Main Programme):
   - Each day should have a clear THEME that builds on the previous day
   - Morning: Usually more intensive learning (9:00-13:00)
   - Afternoon: Practical workshops or activities (14:00-18:00)
   - Evening: Reflection, cultural activities, or free time (19:00-22:00)
   - Include variety: workshops, outdoor activities, cultural visits, creative sessions
   - Ensure progression of learning (from basics to deeper engagement)

3. Day ${input.durationDays} (Departure):
   - Morning: Final reflection, evaluation, certificates
   - Afternoon: Departure

EDUCATIONAL PRINCIPLES:
- Start with trust-building and team formation
- Progress from individual to group activities
- Mix energetic and reflective activities
- Include intercultural learning moments
- Build towards final outcomes/presentations
- Allow time for informal learning
- Consider energy levels (intensive vs. relaxed days)

OUTPUT FORMAT:
For each day, provide:
- day_number: 1, 2, 3...
- theme: One sentence theme for the day
- morning_focus: What participants will do/learn in the morning
- afternoon_focus: What participants will do/learn in the afternoon
- evening_focus: Evening activities and their purpose
- key_learning_outcomes: What participants should achieve by end of day

Generate the structure as a JSON array.`
}

export function buildSessionGeneratorPrompt(input: SessionGeneratorInput): string {
  return `You are creating detailed session plans for Day ${input.dayNumber} of an Erasmus+ Youth Exchange.

DAY CONTEXT:
Theme: ${input.dayTheme}
Morning Focus: ${input.morningFocus}
Afternoon Focus: ${input.afternoonFocus}
Evening Focus: ${input.eveningFocus}

PROJECT CONTEXT:
Participants: ${input.participantCount} youth aged ${input.ageRange}
Profile: ${input.targetProfile}
Language Levels: ${input.languageLevels}
Inclusion Needs: ${input.inclusionNeeds}
Cultural Mix: ${input.countriesList}

TASK:
Generate detailed session plans for this day following this structure:

TIME BLOCKS:
- 09:00-09:30: Morning energizer
- 09:30-11:00: Morning session 1
- 11:00-11:30: Coffee break
- 11:30-13:00: Morning session 2
- 13:00-14:30: Lunch break
- 14:30-16:00: Afternoon session 1
- 16:00-16:30: Coffee/energizer break
- 16:30-18:00: Afternoon session 2
- 18:00-19:00: Free time
- 19:00-20:00: Dinner
- 20:00-22:00: Evening activity
- 22:00+: Free time

REQUIREMENTS FOR EACH SESSION:
1. Title: Engaging, clear title
2. Description: 2-3 sentences explaining the activity
3. Activity Type: (icebreaker, workshop, reflection, energizer, etc.)
4. Learning Objectives: 1-3 specific objectives
5. Methodology: Which non-formal education method (group work, simulation, role play, debate, creative expression, outdoor learning, etc.)
6. Materials Needed: Specific list (markers, flip charts, music, props, etc.)
7. Preparation Notes: What facilitators need to prepare beforehand
8. Space Requirements: Indoor/outdoor/flexible
9. Group Size: Whole group / Small groups (size) / Pairs / Individual
10. Accessibility Notes: How to adapt for different needs
11. Language Level: Basic/Intermediate/Advanced language proficiency needed

BEST PRACTICES:
- Start mornings with energizers (15-30 min)
- Main sessions should be 60-90 minutes
- Include breaks every 90 minutes
- Mix individual, pair, small group, and whole group activities
- Vary methodologies (don't repeat same format)
- Build intensity gradually (don't start with heavy content)
- End days with reflection or relaxed social activities
- Consider cultural sensitivity
- Include movement and physical activities
- Ensure accessibility for all participants

INCLUSION CONSIDERATIONS:
- Provide visual, auditory, and kinesthetic learning options
- Allow flexibility in participation levels
- Provide language support when needed
- Consider physical accessibility
- Respect cultural and religious needs
- Create safe, non-competitive environment

OUTPUT FORMAT:
Return ONLY a valid JSON array of session objects. Each session MUST include ALL of these fields:

[
  {
    "title": "Session title here",
    "description": "2-3 sentence description of the activity",
    "activity_type": "workshop",
    "start_time": "09:00",
    "end_time": "10:30",
    "learning_objectives": ["Objective 1", "Objective 2"],
    "methodology": "Group work and discussion",
    "materials_needed": ["Flip charts", "Markers", "Post-its"],
    "preparation_notes": "Prepare room setup and materials",
    "space_requirements": "Indoor classroom",
    "group_size": "Small groups of 4-5",
    "accessibility_notes": "Provide visual and written instructions",
    "language_level": "Intermediate"
  }
]

CRITICAL: Return ONLY the JSON array, no additional text or explanation.`
}

/**
 * Expected output format for daily structure
 */
export interface DailyStructureOutput {
  day_number: number
  theme: string
  morning_focus: string
  afternoon_focus: string
  evening_focus: string
  // Formal mode equivalents
  morning_focus_formal: string
  afternoon_focus_formal: string
  evening_focus_formal: string
  key_learning_outcomes: string[]
}

/**
 * Expected output format for session generation
 */
export interface SessionOutput {
  title: string
  description: string
  activity_type: string
  // Formal mode equivalents
  title_formal: string
  description_formal: string
  preparation_notes_formal: string
  start_time: string // "09:00"
  end_time: string // "10:30"
  learning_objectives: string[]
  methodology: string
  materials_needed: string[]
  preparation_notes: string
  space_requirements: string
  group_size: string
  accessibility_notes: string
  language_level: string
}
