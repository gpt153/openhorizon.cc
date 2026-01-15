import { ChatOpenAI } from '@langchain/openai'
import { StructuredOutputParser } from '@langchain/core/output_parsers'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import type {
  SeedMetadata,
  GeneratedSeed,
  StartSessionResponse,
  ProcessAnswerResponse,
  ValidationResult
} from '../../seeds/seeds.types.js'

/**
 * Question definition for progressive elaboration
 */
export interface QuestionDefinition {
  id: string
  field: keyof SeedMetadata | string
  question: string
  followUp?: string
  weight: number // Weight for completeness calculation (0-1)
  required: boolean
  extractionSchema: z.ZodType<any>
  extractionPrompt: string
  suggestDefaults?: (seed: GeneratedSeed, metadata: SeedMetadata) => any
  validate?: (value: any) => ValidationResult
}

/**
 * Extracted answer data
 */
interface ExtractedData {
  [key: string]: any
}

/**
 * Conversational Seed Elaboration Agent
 *
 * Progressively gathers project requirements through natural dialogue,
 * extracts structured metadata, validates against Erasmus+ requirements,
 * and calculates completeness scores.
 */
export class SeedElaborationAgent {
  private llm: ChatOpenAI
  private questions: QuestionDefinition[]

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-4o',
      temperature: 0.3, // Lower temperature for structured extraction
      openAIApiKey: process.env.OPENAI_API_KEY
    })

    this.questions = this.defineQuestionFlow()
  }

  /**
   * Start elaboration session
   */
  public async startSession(
    seed: GeneratedSeed,
    existingMetadata?: Partial<SeedMetadata>
  ): Promise<StartSessionResponse> {
    const metadata: SeedMetadata = {
      completeness: 0,
      sessionId: randomUUID(),
      currentQuestionIndex: 0,
      ...existingMetadata,
      // Pre-fill from seed if available
      estimatedParticipants: seed.estimatedParticipants,
      duration: seed.estimatedDuration
    }

    const firstQuestion = this.determineNextQuestion(metadata, seed)

    if (!firstQuestion) {
      // All questions answered
      return {
        sessionId: metadata.sessionId!,
        question: 'All information collected! Ready to proceed.',
        metadata: {
          ...metadata,
          completeness: 100
        }
      }
    }

    const suggestions = firstQuestion.suggestDefaults
      ? [this.formatSuggestion(firstQuestion.suggestDefaults(seed, metadata))]
      : []

    return {
      sessionId: metadata.sessionId!,
      question: firstQuestion.question + (firstQuestion.followUp ? `\n\n${firstQuestion.followUp}` : ''),
      suggestions,
      metadata
    }
  }

  /**
   * Process user answer and get next question
   */
  public async processAnswer(
    sessionId: string,
    answer: string,
    currentMetadata: SeedMetadata,
    seed: GeneratedSeed
  ): Promise<ProcessAnswerResponse> {
    // Get current question
    const currentQuestion = this.questions[currentMetadata.currentQuestionIndex || 0]

    if (!currentQuestion) {
      return {
        metadata: currentMetadata,
        complete: true
      }
    }

    // Extract structured data from natural language answer
    const extractedData = await this.extractStructuredData(currentQuestion, answer)

    // Validate extracted data
    const validation = currentQuestion.validate
      ? currentQuestion.validate(extractedData)
      : { valid: true }

    const validationErrors: string[] = []
    if (!validation.valid) {
      validationErrors.push(validation.message || 'Invalid input')
    }

    // Update metadata with extracted data
    const updatedMetadata = this.mergeExtractedData(currentMetadata, extractedData, currentQuestion)

    // Calculate new completeness
    updatedMetadata.completeness = this.calculateCompleteness(updatedMetadata)
    updatedMetadata.missingFields = this.identifyMissingFields(updatedMetadata)

    // Move to next question
    updatedMetadata.currentQuestionIndex = (updatedMetadata.currentQuestionIndex || 0) + 1

    // Determine next question
    const nextQuestion = this.determineNextQuestion(updatedMetadata, seed)

    if (!nextQuestion) {
      // All questions answered
      return {
        metadata: updatedMetadata,
        complete: true,
        validationErrors: validationErrors.length > 0 ? validationErrors : undefined
      }
    }

    const suggestions = nextQuestion.suggestDefaults
      ? [this.formatSuggestion(nextQuestion.suggestDefaults(seed, updatedMetadata))]
      : []

    return {
      nextQuestion: nextQuestion.question + (nextQuestion.followUp ? `\n\n${nextQuestion.followUp}` : ''),
      metadata: updatedMetadata,
      complete: false,
      suggestions,
      validationErrors: validationErrors.length > 0 ? validationErrors : undefined
    }
  }

  /**
   * Calculate completeness score (0-100)
   */
  public calculateCompleteness(metadata: SeedMetadata): number {
    let totalWeight = 0
    let achievedWeight = 0

    for (const question of this.questions) {
      totalWeight += question.weight

      const fieldValue = this.getNestedValue(metadata, question.field)
      if (fieldValue !== undefined && fieldValue !== null) {
        // Check if array/object is not empty
        if (Array.isArray(fieldValue) && fieldValue.length === 0) continue
        if (typeof fieldValue === 'object' && Object.keys(fieldValue).length === 0) continue

        achievedWeight += question.weight
      }
    }

    return totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0
  }

  /**
   * Identify missing fields
   */
  public identifyMissingFields(metadata: SeedMetadata): string[] {
    const missing: string[] = []

    for (const question of this.questions) {
      if (!question.required) continue

      const fieldValue = this.getNestedValue(metadata, question.field)
      if (fieldValue === undefined || fieldValue === null) {
        missing.push(question.field)
      }
    }

    return missing
  }

  /**
   * Define the progressive question flow
   */
  private defineQuestionFlow(): QuestionDefinition[] {
    return [
      // Question 1: Participant Count
      {
        id: 'participant-count',
        field: 'participantCount',
        question: 'How many participants are you planning for this exchange?',
        followUp: 'Erasmus+ Youth Exchanges typically range from 16 to 60 participants.',
        weight: 0.2,
        required: true,
        extractionSchema: z.object({
          participantCount: z.number().int().min(16).max(60)
        }),
        extractionPrompt: 'Extract the participant count as a number. Look for phrases like "30 participants", "about 25 people", "around thirty young people". Return as {participantCount: number}',
        suggestDefaults: (seed) => {
          const estimate = seed.estimatedParticipants || 28
          return `Consider ${estimate} participants as a good starting point.`
        },
        validate: (value) => {
          const count = value.participantCount
          if (count < 16 || count > 60) {
            return {
              valid: false,
              message: 'Erasmus+ Youth Exchanges require 16-60 participants',
              suggestedValue: count < 16 ? 16 : 60
            }
          }
          return { valid: true }
        }
      },

      // Question 2: Budget
      {
        id: 'budget',
        field: 'budgetPerParticipant',
        question: "What's your estimated budget per participant? (Or total budget if you prefer)",
        followUp: 'Typical Erasmus+ Youth Exchanges range from €300-500 per participant, depending on duration and destination.',
        weight: 0.15,
        required: true,
        extractionSchema: z.object({
          budgetPerParticipant: z.number().positive().optional(),
          totalBudget: z.number().positive().optional()
        }),
        extractionPrompt: 'Extract budget information. Look for currency amounts like "€400 each", "500 euros per person", "total budget of 15000". Return as {budgetPerParticipant?: number, totalBudget?: number}',
        suggestDefaults: (seed, metadata) => {
          const duration = metadata.duration || seed.estimatedDuration || 7
          const participants = metadata.participantCount || seed.estimatedParticipants || 28
          const perPerson = Math.round(duration * 50 + 150) // Rough estimate: €50/day + €150 base
          return `Based on ${duration} days and ${participants} participants, consider €${perPerson} per participant (Total: €${perPerson * participants}).`
        },
        validate: (value) => {
          const perPerson = value.budgetPerParticipant
          if (perPerson && (perPerson < 200 || perPerson > 700)) {
            return {
              valid: false,
              message: 'Budget seems unusual. Typical range is €200-700 per participant.',
              suggestedValue: perPerson < 200 ? 300 : 500
            }
          }
          return { valid: true }
        }
      },

      // Question 3: Duration
      {
        id: 'duration',
        field: 'duration',
        question: 'How long will the exchange last? (e.g., 7 days, 2 weeks)',
        followUp: 'Most Youth Exchanges run for 5-21 days, including travel days.',
        weight: 0.15,
        required: true,
        extractionSchema: z.object({
          duration: z.number().int().min(1).max(30)
        }),
        extractionPrompt: 'Extract duration in days. Convert weeks to days (1 week = 7 days). Look for "7 days", "2 weeks", "ten days". Return as {duration: number}',
        suggestDefaults: (seed) => {
          const estimate = seed.estimatedDuration || 7
          return `Consider ${estimate} days for a well-paced program.`
        },
        validate: (value) => {
          const days = value.duration
          if (days < 5 || days > 21) {
            return {
              valid: false,
              message: 'Youth Exchanges typically last 5-21 days for optimal learning outcomes.',
              suggestedValue: days < 5 ? 7 : 14
            }
          }
          return { valid: true }
        }
      },

      // Question 4: Destination
      {
        id: 'destination',
        field: 'destination',
        question: 'Where will this exchange take place? (Country and city)',
        followUp: 'Please mention the country and city. You can also add venue details if known.',
        weight: 0.15,
        required: true,
        extractionSchema: z.object({
          destination: z.object({
            country: z.string(),
            city: z.string(),
            venue: z.string().optional(),
            accessibility: z.string().optional()
          })
        }),
        extractionPrompt: 'Extract location details. Convert country names to ISO 2-letter codes (e.g., Spain -> ES, Germany -> DE). Look for city names, venue mentions, accessibility info. Return as {destination: {country: string, city: string, venue?: string, accessibility?: string}}',
        validate: (value) => {
          const dest = value.destination
          if (!dest || !dest.country || !dest.city) {
            return {
              valid: false,
              message: 'Please provide both country and city.'
            }
          }
          return { valid: true }
        }
      },

      // Question 5: Participant Countries
      {
        id: 'participant-countries',
        field: 'participantCountries',
        question: 'Which countries will participants come from?',
        followUp: 'List the countries whose young people will participate. This helps us calculate visa requirements.',
        weight: 0.1,
        required: true,
        extractionSchema: z.object({
          participantCountries: z.array(z.string())
        }),
        extractionPrompt: 'Extract country names and convert to ISO 2-letter codes. Look for country lists like "Germany, France, Spain", "participants from Poland and Lithuania". Return as {participantCountries: string[]}',
        validate: (value) => {
          const countries = value.participantCountries
          if (!countries || countries.length === 0) {
            return {
              valid: false,
              message: 'Please specify at least one participant country.'
            }
          }
          return { valid: true }
        }
      },

      // Question 6: Activities/Theme
      {
        id: 'activities',
        field: 'activities',
        question: 'What are the main activities or workshops planned?',
        followUp: 'Describe the key learning activities, workshops, or sessions. Be as specific as possible.',
        weight: 0.15,
        required: false,
        extractionSchema: z.object({
          activities: z.array(z.object({
            name: z.string(),
            duration: z.string(),
            learningOutcomes: z.array(z.string()).optional()
          }))
        }),
        extractionPrompt: 'Extract activity information. Parse descriptions into structured activities with names and estimated durations. Look for workshop titles, session descriptions, time estimates. Return as {activities: [{name: string, duration: string, learningOutcomes?: string[]}]}',
      },

      // Question 7: EU Priorities
      {
        id: 'eu-priorities',
        field: 'erasmusPriorities',
        question: 'Which Erasmus+ priorities does this address? (e.g., Inclusion, Green, Digital transformation, Participation)',
        followUp: 'Select the EU priorities your project aligns with. Multiple selections are encouraged!',
        weight: 0.1,
        required: false,
        extractionSchema: z.object({
          erasmusPriorities: z.array(z.string())
        }),
        extractionPrompt: 'Extract EU priorities. Map to official categories: "Inclusion and diversity", "Environment and fight against climate change", "Digital transformation", "Participation in democratic life", "Common values, civic engagement and participation". Return as {erasmusPriorities: string[]}',
        suggestDefaults: (seed) => {
          const desc = seed.description.toLowerCase()
          const priorities: string[] = []

          if (desc.includes('inclusion') || desc.includes('disadvantaged') || desc.includes('diverse')) {
            priorities.push('Inclusion and diversity')
          }
          if (desc.includes('environment') || desc.includes('green') || desc.includes('climate') || desc.includes('sustainability')) {
            priorities.push('Environment and fight against climate change')
          }
          if (desc.includes('digital') || desc.includes('technology') || desc.includes('online')) {
            priorities.push('Digital transformation')
          }
          if (desc.includes('democracy') || desc.includes('civic') || desc.includes('participation')) {
            priorities.push('Participation in democratic life')
          }

          return priorities.length > 0
            ? `Based on your project description, consider: ${priorities.join(', ')}`
            : 'Consider which EU priorities your project addresses.'
        }
      }
    ]
  }

  /**
   * Determine the next question to ask
   */
  private determineNextQuestion(
    metadata: SeedMetadata,
    seed: GeneratedSeed
  ): QuestionDefinition | null {
    const currentIndex = metadata.currentQuestionIndex || 0

    // Return next unanswered question
    for (let i = currentIndex; i < this.questions.length; i++) {
      const question = this.questions[i]
      const fieldValue = this.getNestedValue(metadata, question.field)

      // Skip if already answered
      if (fieldValue !== undefined && fieldValue !== null) {
        if (Array.isArray(fieldValue) && fieldValue.length > 0) continue
        if (typeof fieldValue === 'object' && Object.keys(fieldValue).length > 0) continue
        if (typeof fieldValue !== 'object') continue
      }

      return question
    }

    return null // All questions answered
  }

  /**
   * Extract structured data from natural language answer using GPT-4o
   */
  private async extractStructuredData(
    question: QuestionDefinition,
    answer: string
  ): Promise<ExtractedData> {
    try {
      const parser = StructuredOutputParser.fromZodSchema(question.extractionSchema)

      const prompt = `${question.extractionPrompt}

User's answer: "${answer}"

${parser.getFormatInstructions()}

Extract the structured data from the user's natural language answer.`

      const result = await this.llm.invoke(prompt)
      const parsed = await parser.parse(result.content as string)

      return parsed as ExtractedData
    } catch (error) {
      console.error('❌ Error extracting structured data:', error)
      // Return empty object if extraction fails
      return {}
    }
  }

  /**
   * Merge extracted data into metadata
   */
  private mergeExtractedData(
    metadata: SeedMetadata,
    extractedData: ExtractedData,
    question: QuestionDefinition
  ): SeedMetadata {
    const updated = { ...metadata }

    // Handle budget special case (calculate total or per-person)
    if (question.id === 'budget') {
      if (extractedData.budgetPerParticipant) {
        updated.budgetPerParticipant = extractedData.budgetPerParticipant
        updated.totalBudget = extractedData.budgetPerParticipant * (metadata.participantCount || 28)
      } else if (extractedData.totalBudget) {
        updated.totalBudget = extractedData.totalBudget
        updated.budgetPerParticipant = Math.round(extractedData.totalBudget / (metadata.participantCount || 28))
      }
      return updated
    }

    // Merge other fields
    Object.assign(updated, extractedData)

    // Auto-calculate visa requirements if we have destination and participant countries
    if (updated.destination && updated.participantCountries) {
      updated.requirements = updated.requirements || { visas: [], insurance: true, permits: [] }
      updated.requirements.visas = this.calculateVisaRequirements(
        updated.destination.country,
        updated.participantCountries
      )
    }

    return updated
  }

  /**
   * Calculate visa requirements based on destination and participant countries
   * (Simplified logic - real implementation would use a visa requirements API)
   */
  private calculateVisaRequirements(
    destinationCountry: string,
    participantCountries: string[]
  ): Array<{ country: string; needed: boolean; estimatedCost?: number }> {
    // EU countries (simplified list)
    const euCountries = ['AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE']

    return participantCountries.map(country => {
      const destInEU = euCountries.includes(destinationCountry)
      const countryInEU = euCountries.includes(country)

      // Simplified logic: No visa needed within EU
      const needed = !(destInEU && countryInEU)

      return {
        country,
        needed,
        estimatedCost: needed ? 80 : undefined // Rough estimate
      }
    })
  }

  /**
   * Get nested value from object by dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.')
    let value = obj

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return undefined
      }
    }

    return value
  }

  /**
   * Format suggestion for display
   */
  private formatSuggestion(suggestion: any): string {
    if (typeof suggestion === 'string') return suggestion
    return JSON.stringify(suggestion)
  }
}
