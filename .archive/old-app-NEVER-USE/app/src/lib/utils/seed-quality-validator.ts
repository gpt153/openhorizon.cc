/**
 * Quality Validation for Working vs Formal Mode Seeds
 *
 * Ensures that generated seeds have strong contrast between modes
 */

import type { GeneratedSeed } from '@/lib/schemas/brainstorm'

export interface ValidationIssue {
  severity: 'warning' | 'error'
  field: string
  message: string
  seedTitle: string
}

export interface ValidationResult {
  isValid: boolean
  issues: ValidationIssue[]
}

/**
 * Validate a single seed for quality issues
 */
export function validateSeedQuality(seed: GeneratedSeed): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // Check 1: Formal version should typically be longer (more detailed)
  if (seed.descriptionFormal.length < seed.description.length * 1.05) {
    issues.push({
      severity: 'warning',
      field: 'descriptionFormal',
      message: 'Formal description is not significantly longer than working description',
      seedTitle: seed.title,
    })
  }

  // Check 2: Formal version should contain EU/Erasmus+ terminology
  const euTerms = [
    'non-formal learning',
    'intercultural',
    'competenc', // matches competence/competency/competencies
    'key action',
    'programme',
    'learning outcome',
    'methodology',
    'participant',
  ]

  const formalLower = seed.descriptionFormal.toLowerCase()
  const euTermsFound = euTerms.filter(term => formalLower.includes(term.toLowerCase()))

  if (euTermsFound.length < 2) {
    issues.push({
      severity: 'error',
      field: 'descriptionFormal',
      message: `Formal version lacks EU terminology (found only: ${euTermsFound.join(', ') || 'none'})`,
      seedTitle: seed.title,
    })
  }

  // Check 3: Working version should avoid recruitment/sales language
  const salesLanguage = /\b(join us|your chance|don't miss|exciting opportunity|transform your|discover how)\b/i
  if (salesLanguage.test(seed.description)) {
    issues.push({
      severity: 'warning',
      field: 'description',
      message: 'Working version contains sales/recruitment language - should be factual planner language',
      seedTitle: seed.title,
    })
  }

  // Check 4: Working version should focus on concrete activities
  const hasConcreteActivities = /\b(mornings?:|afternoons?:|evenings?:|day \d+|build|play|film|cook|hike|create|make)\b/i.test(seed.description)
  if (!hasConcreteActivities) {
    issues.push({
      severity: 'warning',
      field: 'description',
      message: 'Working version lacks concrete activity descriptions (mornings/afternoons structure recommended)',
      seedTitle: seed.title,
    })
  }

  // Check 5: Formal version should NOT have contractions
  const hasContractions = /\b(you'll|we'll|don't|can't|won't|it's|that's)\b/i.test(seed.descriptionFormal)
  if (hasContractions) {
    issues.push({
      severity: 'error',
      field: 'descriptionFormal',
      message: 'Formal version contains contractions - should use full forms',
      seedTitle: seed.title,
    })
  }

  // Check 6: Formal version should use third person (participants, project)
  const hasThirdPerson = /\b(participants|participant|the project|learners)\b/i.test(seed.descriptionFormal)
  if (!hasThirdPerson) {
    issues.push({
      severity: 'warning',
      field: 'descriptionFormal',
      message: 'Formal version lacks third person references',
      seedTitle: seed.title,
    })
  }

  // Check 7: Title formal should be longer or similar length
  if (seed.titleFormal.length < seed.title.length * 0.9) {
    issues.push({
      severity: 'warning',
      field: 'titleFormal',
      message: 'Formal title is significantly shorter than working title',
      seedTitle: seed.title,
    })
  }

  // Check 8: Approval likelihood scores should be different
  const scoreDifference = Math.abs(seed.approvalLikelihood - seed.approvalLikelihoodFormal)
  if (scoreDifference < 0.05) {
    issues.push({
      severity: 'warning',
      field: 'approvalLikelihood',
      message: `Working and formal approval scores are too similar (${seed.approvalLikelihood} vs ${seed.approvalLikelihoodFormal})`,
      seedTitle: seed.title,
    })
  }

  return issues
}

/**
 * Validate a batch of seeds
 */
export function validateSeedBatch(seeds: GeneratedSeed[]): ValidationResult {
  const allIssues: ValidationIssue[] = []

  seeds.forEach(seed => {
    const issues = validateSeedQuality(seed)
    allIssues.push(...issues)
  })

  // Count errors vs warnings
  const errors = allIssues.filter(i => i.severity === 'error')
  const warnings = allIssues.filter(i => i.severity === 'warning')

  console.log('\n🔍 Seed Quality Validation Report:')
  console.log(`   ✓ Seeds validated: ${seeds.length}`)
  console.log(`   ⚠ Warnings: ${warnings.length}`)
  console.log(`   ✗ Errors: ${errors.length}`)

  if (errors.length > 0) {
    console.log('\n❌ ERRORS:')
    errors.forEach(issue => {
      console.log(`   - "${issue.seedTitle}" (${issue.field}): ${issue.message}`)
    })
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:')
    warnings.forEach(issue => {
      console.log(`   - "${issue.seedTitle}" (${issue.field}): ${issue.message}`)
    })
  }

  if (allIssues.length === 0) {
    console.log('   ✅ All seeds passed quality checks!')
  }

  return {
    isValid: errors.length === 0,
    issues: allIssues,
  }
}

/**
 * Get a quality score for a seed (0-100)
 */
export function getSeedQualityScore(seed: GeneratedSeed): number {
  const issues = validateSeedQuality(seed)

  // Start with 100 points
  let score = 100

  // Deduct points for issues
  issues.forEach(issue => {
    if (issue.severity === 'error') {
      score -= 20
    } else {
      score -= 10
    }
  })

  return Math.max(0, score)
}
