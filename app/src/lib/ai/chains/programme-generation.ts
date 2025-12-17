/**
 * AI Chain: Programme Generation
 * Generates detailed day-by-day programmes from project concepts
 */

import { ChatOpenAI } from '@langchain/openai'
import {
  buildDailyStructurePrompt,
  buildSessionGeneratorPrompt,
  type DailyStructureOutput,
  type SessionOutput,
} from '@/lib/ai/programme-prompts'
import type { Project } from '@prisma/client'

const llm = new ChatOpenAI({
  modelName: 'gpt-4-turbo-preview',
  temperature: 0.7,
})

/**
 * Extract programme requirements from project
 */
export function extractProgrammeRequirements(project: Project) {
  const dna = project.projectDna as any

  return {
    projectTitle: project.title,
    durationDays: project.durationDays,
    participantCount: project.participantCount,
    ageRange: dna.target_group?.age_range || '18-25',
    theme: dna.theme || project.title,
    objectives: JSON.stringify(project.objectives || []),
    targetGroupProfile: project.targetGroupDescription || 'General youth',
    inclusionNeeds: project.inclusionPlanOverview || 'Standard accessibility',
    languageLevels: dna.primary_languages || 'English',
    countriesList: dna.preferred_countries || 'Various European countries',
  }
}

/**
 * Generate daily structure with themes and focus areas
 */
export async function generateDailyStructure(
  requirements: ReturnType<typeof extractProgrammeRequirements>
): Promise<DailyStructureOutput[]> {
  const prompt = buildDailyStructurePrompt(requirements)

  console.log('🔄 Generating daily structure...')

  const response = await llm.invoke([
    {
      role: 'user',
      content: prompt,
    },
  ])

  const content = response.content.toString()

  // Extract JSON from response (may be wrapped in markdown code blocks)
  let jsonText = content
  if (content.includes('```json')) {
    const match = content.match(/```json\n([\s\S]*?)\n```/)
    if (match) {
      jsonText = match[1]
    }
  } else if (content.includes('```')) {
    const match = content.match(/```\n([\s\S]*?)\n```/)
    if (match) {
      jsonText = match[1]
    }
  }

  try {
    const parsed = JSON.parse(jsonText)
    console.log(`✅ Generated structure for ${parsed.length} days`)
    return parsed
  } catch (error) {
    console.error('Failed to parse daily structure JSON:', jsonText)
    throw new Error('Failed to parse AI response for daily structure')
  }
}

/**
 * Generate detailed sessions for a specific day
 */
export async function generateDaySessions(
  day: DailyStructureOutput,
  requirements: ReturnType<typeof extractProgrammeRequirements>
): Promise<SessionOutput[]> {
  const prompt = buildSessionGeneratorPrompt({
    dayNumber: day.day_number,
    dayTheme: day.theme,
    morningFocus: day.morning_focus,
    afternoonFocus: day.afternoon_focus,
    eveningFocus: day.evening_focus,
    participantCount: requirements.participantCount,
    ageRange: requirements.ageRange,
    targetProfile: requirements.targetGroupProfile,
    languageLevels: requirements.languageLevels,
    inclusionNeeds: requirements.inclusionNeeds,
    countriesList: requirements.countriesList,
  })

  console.log(`🔄 Generating sessions for Day ${day.day_number}...`)

  const response = await llm.invoke([
    {
      role: 'user',
      content: prompt,
    },
  ])

  const content = response.content.toString()

  // Extract JSON from response
  let jsonText = content
  if (content.includes('```json')) {
    const match = content.match(/```json\n([\s\S]*?)\n```/)
    if (match) {
      jsonText = match[1]
    }
  } else if (content.includes('```')) {
    const match = content.match(/```\n([\s\S]*?)\n```/)
    if (match) {
      jsonText = match[1]
    }
  }

  try {
    const parsed = JSON.parse(jsonText)
    console.log(`✅ Generated ${parsed.length} sessions for Day ${day.day_number}`)
    return parsed
  } catch (error) {
    console.error('Failed to parse sessions JSON:', jsonText)
    throw new Error(`Failed to parse AI response for Day ${day.day_number} sessions`)
  }
}
