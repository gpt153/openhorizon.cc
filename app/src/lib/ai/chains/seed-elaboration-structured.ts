/**
 * Structured 7-Question Seed Elaboration Flow
 *
 * This module implements the conversational elaboration flow described in PRD Section 1.1.
 * AI asks 7 progressive questions to gather essential project information.
 *
 * Based on: project-pipeline/PRD.md Section 1.1 - Intelligent Question Flow
 */

export interface ElaborationQuestion {
  id: number
  question: string
  field: keyof RichSeedMetadata
  validationRules?: ValidationRule[]
  quickReplies?: string[]
  helpText?: string
}

export interface RichSeedMetadata {
  participantCount?: number
  duration?: number
  destination?: {
    country: string
    city: string
  }
  participantCountries?: string[]
  totalBudget?: number
  activities?: string[]
  theme?: string
  completeness: number
}

export interface ValidationRule {
  validate: (value: any) => boolean
  errorMessage: string
}

/**
 * The 7 core questions for seed elaboration
 * Based on PRD Section 1.1 - Intelligent Question Flow
 */
export const ELABORATION_QUESTIONS: ElaborationQuestion[] = [
  {
    id: 1,
    question: "How many participants will be involved in your project? (Erasmus+ typically supports 16-60 participants)",
    field: "participantCount",
    quickReplies: ["16-20", "21-30", "31-40", "41-60"],
    validationRules: [
      {
        validate: (count: number) => count >= 16 && count <= 60,
        errorMessage: "For Erasmus+ projects, participant count should be between 16-60"
      }
    ],
    helpText: "For first-time exchanges, 20-30 participants is manageable"
  },
  {
    id: 2,
    question: "How long will the exchange last? (Typical exchanges run 5-21 days)",
    field: "duration",
    quickReplies: ["5-7 days", "8-14 days", "15-21 days"],
    validationRules: [
      {
        validate: (days: number) => days >= 5 && days <= 21,
        errorMessage: "Typical exchanges run between 5-21 days"
      }
    ],
    helpText: "5-7 days is common for first exchanges"
  },
  {
    id: 3,
    question: "Where will the exchange take place? Please specify the city and country.",
    field: "destination",
    helpText: "This helps us calculate travel costs and visa requirements"
  },
  {
    id: 4,
    question: "Which countries will participants come from? List the participating countries.",
    field: "participantCountries",
    helpText: "This helps identify visa requirements and language support needs"
  },
  {
    id: 5,
    question: "What's your estimated total budget? (Typical range: €300-500 per participant)",
    field: "totalBudget",
    quickReplies: ["€10,000-€20,000", "€20,000-€40,000", "€40,000+"],
    helpText: "We'll help you allocate this across travel, accommodation, food, and activities"
  },
  {
    id: 6,
    question: "What activities and workshops will you include in the exchange?",
    field: "activities",
    helpText: "Describe the main learning activities, workshops, or experiences participants will have"
  },
  {
    id: 7,
    question: "What's the main learning theme or focus of your exchange? (e.g., digital skills, sustainability, cultural exchange)",
    field: "theme",
    helpText: "This should align with EU priorities: digital, green, inclusion, health, or participation"
  }
]

/**
 * Calculate completeness percentage based on answered questions
 */
export function calculateCompleteness(metadata: RichSeedMetadata): number {
  const totalQuestions = ELABORATION_QUESTIONS.length
  let answeredQuestions = 0

  for (const question of ELABORATION_QUESTIONS) {
    const value = metadata[question.field]
    if (value !== undefined && value !== null) {
      // Check if the value is meaningful (not empty string/array)
      if (typeof value === 'string' && value.trim().length > 0) answeredQuestions++
      else if (typeof value === 'number' && value > 0) answeredQuestions++
      else if (Array.isArray(value) && value.length > 0) answeredQuestions++
      else if (typeof value === 'object' && Object.keys(value).length > 0) answeredQuestions++
    }
  }

  return Math.round((answeredQuestions / totalQuestions) * 100)
}

/**
 * Get the next unanswered question
 */
export function getNextQuestion(metadata: RichSeedMetadata): ElaborationQuestion | null {
  for (const question of ELABORATION_QUESTIONS) {
    const value = metadata[question.field]
    if (value === undefined || value === null ||
        (typeof value === 'string' && value.trim().length === 0) ||
        (Array.isArray(value) && value.length === 0)) {
      return question
    }
  }
  return null // All questions answered
}

/**
 * Get question by ID
 */
export function getQuestionById(id: number): ElaborationQuestion | null {
  return ELABORATION_QUESTIONS.find(q => q.id === id) || null
}

/**
 * Validate an answer against question rules
 */
export function validateAnswer(question: ElaborationQuestion, answer: any): { valid: boolean; error?: string } {
  if (!question.validationRules) {
    return { valid: true }
  }

  for (const rule of question.validationRules) {
    if (!rule.validate(answer)) {
      return { valid: false, error: rule.errorMessage }
    }
  }

  return { valid: true }
}

/**
 * Extract structured data from natural language answer using AI
 * This is a placeholder - actual implementation will use GPT-4 to parse answers
 */
export function parseAnswer(question: ElaborationQuestion, answer: string): any {
  // Simple extraction logic - in real implementation, use GPT-4
  switch (question.field) {
    case 'participantCount':
      // Extract number from text
      const countMatch = answer.match(/\d+/)
      return countMatch ? parseInt(countMatch[0]) : null

    case 'duration':
      // Extract days from text
      const daysMatch = answer.match(/(\d+)\s*(day|week)/i)
      if (daysMatch) {
        const value = parseInt(daysMatch[1])
        return daysMatch[2].toLowerCase() === 'week' ? value * 7 : value
      }
      return null

    case 'destination':
      // Extract city and country - in real impl, use NER or GPT-4
      // For now, simple heuristic
      const parts = answer.split(',').map(p => p.trim())
      if (parts.length >= 2) {
        return { city: parts[0], country: parts[1] }
      }
      return { city: answer, country: '' }

    case 'participantCountries':
      // Split by common separators
      return answer.split(/[,،;]/).map(c => c.trim()).filter(c => c.length > 0)

    case 'totalBudget':
      // Extract currency amount
      const budgetMatch = answer.match(/€?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/)
      return budgetMatch ? parseFloat(budgetMatch[1].replace(',', '')) : null

    case 'activities':
      // Split by common separators or newlines
      return answer.split(/[,،;.\n]/).map(a => a.trim()).filter(a => a.length > 0)

    case 'theme':
      return answer.trim()

    default:
      return answer
  }
}

/**
 * Generate quick reply suggestions based on question
 */
export function generateQuickReplies(question: ElaborationQuestion): string[] {
  return question.quickReplies || []
}

/**
 * Check if elaboration is complete enough to convert to project
 */
export function canConvertToProject(completeness: number): boolean {
  return completeness >= 80 // Need at least 6 of 7 questions (85.7%)
}

/**
 * Get user-friendly progress message
 */
export function getProgressMessage(completeness: number): string {
  if (completeness < 30) return "Let's get started!"
  if (completeness < 60) return "You're making progress!"
  if (completeness < 80) return "Almost there!"
  return "Great work! Ready to convert!"
}

/**
 * Get color for progress indicator
 */
export function getProgressColor(completeness: number): 'red' | 'yellow' | 'green' {
  if (completeness < 50) return 'red'
  if (completeness < 80) return 'yellow'
  return 'green'
}
