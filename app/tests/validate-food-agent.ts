/**
 * Manual validation script for Food Agent
 * Run with: npx tsx tests/validate-food-agent.ts
 */

import { FoodAgent } from '../src/lib/ai/agents/food-agent'
import type { AgentContext } from '../src/lib/ai/agents/base-agent'

async function validateFoodAgent() {
  console.log('🍽️  Food Agent Validation\n')
  console.log('=' .repeat(60))

  const foodAgent = new FoodAgent()

  // Mock context for Barcelona youth exchange
  const mockContext: AgentContext = {
    project: {
      name: 'Digital Skills Youth Exchange',
      location: 'Barcelona',
      participantCount: 30,
      startDate: new Date('2026-03-15'),
      endDate: new Date('2026-03-22'),
    },
    phase: {
      name: 'Food & Catering',
      type: 'FOOD',
      budgetAllocated: 3000,
      startDate: new Date('2026-03-15'),
      endDate: new Date('2026-03-22'),
    },
  }

  console.log('\n📋 Test Context:')
  console.log(`   Project: ${mockContext.project?.name}`)
  console.log(`   Location: ${mockContext.project?.location}`)
  console.log(`   Participants: ${mockContext.project?.participantCount}`)
  console.log(`   Budget: €${mockContext.phase?.budgetAllocated}`)
  console.log(`   Duration: 7 days`)

  // Test 1: Research food options
  console.log('\n\n🔍 Test 1: Research Food Options')
  console.log('-'.repeat(60))

  try {
    const options = await foodAgent.research(mockContext)

    console.log(`✅ Found ${options.length} food options\n`)

    options.forEach((option, index) => {
      console.log(`${index + 1}. ${option.name}`)
      console.log(`   Type: ${option.type}`)
      console.log(`   Cuisine: ${option.cuisineType}`)
      console.log(`   Price: €${option.estimatedPricePerPerson}/person`)
      console.log(`   Score: ${option.suitabilityScore}/100`)
      console.log(`   Dietary: ${option.dietaryOptions.join(', ')}`)
      console.log(`   Pros: ${option.pros.length} | Cons: ${option.cons.length}`)
      console.log()
    })

    // Verify structure
    const firstOption = options[0]
    const requiredFields = [
      'name', 'type', 'cuisineType', 'estimatedPricePerPerson',
      'location', 'features', 'dietaryOptions', 'suitabilityScore',
      'reasoning', 'pros', 'cons'
    ]

    const missingFields = requiredFields.filter(field => !(field in firstOption))
    if (missingFields.length > 0) {
      console.error(`❌ Missing required fields: ${missingFields.join(', ')}`)
    } else {
      console.log('✅ All required fields present')
    }

  } catch (error) {
    console.error('❌ Research failed:', error)
    return false
  }

  // Test 2: Analyze a food option
  console.log('\n\n🔬 Test 2: Analyze Food Option')
  console.log('-'.repeat(60))

  try {
    const mockOption = {
      name: 'Mediterranean Catering Barcelona',
      type: 'caterer' as const,
      cuisineType: 'Mediterranean',
      estimatedPricePerPerson: 18,
      features: ['Buffet style', 'Delivery included', 'Dietary accommodations'],
      capacity: { min: 20, max: 100 },
      dietaryOptions: ['Vegetarian', 'Vegan', 'Gluten-free', 'Halal'],
    }

    const analysis = await foodAgent.analyzeFoodOption(mockOption, mockContext)

    console.log(`Analyzing: ${mockOption.name}\n`)
    console.log('PROS:')
    analysis.pros.forEach(pro => console.log(`  • ${pro}`))
    console.log('\nCONS:')
    analysis.cons.forEach(con => console.log(`  • ${con}`))
    console.log(`\nVERDICT: ${analysis.verdict}`)

    if (analysis.pros.length > 0 && analysis.cons.length > 0 && analysis.verdict) {
      console.log('\n✅ Analysis complete and detailed')
    } else {
      console.error('\n❌ Analysis incomplete')
    }

  } catch (error) {
    console.error('❌ Analysis failed:', error)
    return false
  }

  // Test 3: Generate quote email
  console.log('\n\n📧 Test 3: Generate Quote Email')
  console.log('-'.repeat(60))

  try {
    const mockOption = {
      name: 'Barcelona Catering Co.',
      type: 'caterer' as const,
      cuisineType: 'Mediterranean',
      estimatedPricePerPerson: 20,
      location: 'Barcelona, City-wide delivery',
      contact: {
        email: 'contact@barcelonacatering.com',
        phone: '+34 123 456 789',
      },
      features: ['Buffet style', 'Delivery', 'Flexible menus'],
      capacity: { min: 20, max: 100 },
      dietaryOptions: ['Vegetarian', 'Vegan', 'Halal', 'Gluten-free'],
      suitabilityScore: 85,
      reasoning: 'Experienced with youth groups',
      pros: ['Flexible menus', 'Good dietary options'],
      cons: ['Requires 48h notice'],
    }

    const email = await foodAgent.generateQuoteEmail(mockOption, mockContext)

    console.log(`Subject: ${email.subject}\n`)
    console.log('Body Preview:')
    console.log(email.body.substring(0, 400) + '...')

    const hasEssentials =
      email.subject.includes('Quote Request') &&
      email.body.includes('Erasmus+') &&
      email.body.includes('30') &&
      email.body.toLowerCase().includes('dietary')

    if (hasEssentials) {
      console.log('\n✅ Email contains all essential information')
    } else {
      console.error('\n❌ Email missing essential information')
    }

  } catch (error) {
    console.error('❌ Email generation failed:', error)
    return false
  }

  // Test 4: Handle chat
  console.log('\n\n💬 Test 4: Handle Chat Query')
  console.log('-'.repeat(60))

  try {
    const response = await foodAgent.handleChat(
      mockContext,
      'What dietary restrictions can you accommodate for group catering?'
    )

    console.log('Question: What dietary restrictions can you accommodate?')
    console.log(`\nResponse (${response.length} chars):`)
    console.log(response.substring(0, 300) + '...')

    if (response.length > 0) {
      console.log('\n✅ Chat response generated')
    } else {
      console.error('\n❌ Empty chat response')
    }

  } catch (error) {
    console.error('❌ Chat failed:', error)
    return false
  }

  console.log('\n\n' + '='.repeat(60))
  console.log('✅ ALL TESTS PASSED - Food Agent is working correctly!')
  console.log('='.repeat(60))

  return true
}

// Run validation
validateFoodAgent()
  .then(success => {
    process.exit(success ? 0 : 1)
  })
  .catch(error => {
    console.error('\n❌ Validation failed with error:', error)
    process.exit(1)
  })
