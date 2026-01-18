/**
 * =============================================================================
 * Seed Elaboration API - JavaScript/TypeScript Examples
 * =============================================================================
 * This module demonstrates how to interact with the Seed Elaboration API
 * using JavaScript/TypeScript with the Fetch API.
 *
 * Prerequisites:
 * - Node.js 18+ or browser environment
 * - Valid JWT authentication token
 * - Valid seed UUID
 *
 * Usage (Node.js):
 *   const SeedElaborationClient = require('./seed-elaboration.js');
 *   const client = new SeedElaborationClient('your-jwt-token', 'http://localhost:3000');
 *   await client.runFullElaborationFlow('seed-uuid');
 *
 * Usage (TypeScript):
 *   import { SeedElaborationClient } from './seed-elaboration';
 *   const client = new SeedElaborationClient('your-jwt-token', 'http://localhost:3000');
 *   await client.runFullElaborationFlow('seed-uuid');
 * =============================================================================
 */

// TypeScript interfaces (use these in .ts files)
/**
 * @typedef {Object} SeedMetadata
 * @property {number} [participantCount]
 * @property {string[]} [participantCountries]
 * @property {Object} [ageRange]
 * @property {number} [duration]
 * @property {string} [startDate]
 * @property {string} [endDate]
 * @property {number} [totalBudget]
 * @property {Object} [destination]
 * @property {number} completeness
 */

/**
 * @typedef {Object} StartSessionResponse
 * @property {string} sessionId
 * @property {string} question
 * @property {number} [questionNumber]
 * @property {number} [totalQuestions]
 * @property {number} completeness
 * @property {string[]} [suggestions]
 * @property {SeedMetadata} metadata
 */

/**
 * @typedef {Object} ProcessAnswerResponse
 * @property {string} sessionId
 * @property {string|null} nextQuestion
 * @property {number} [questionNumber]
 * @property {number} [totalQuestions]
 * @property {number} completeness
 * @property {boolean} complete
 * @property {Object} [extractedMetadata]
 * @property {string[]} [suggestions]
 * @property {string[]} [validationErrors]
 * @property {SeedMetadata} metadata
 */

/**
 * @typedef {Object} ElaborationStatusResponse
 * @property {number} completeness
 * @property {SeedMetadata} metadata
 * @property {string[]} missingFields
 */

class SeedElaborationClient {
  /**
   * Create a new Seed Elaboration API client
   * @param {string} jwtToken - JWT authentication token
   * @param {string} [baseUrl='http://localhost:3000'] - API base URL
   */
  constructor(jwtToken, baseUrl = 'http://localhost:3000') {
    this.jwtToken = jwtToken;
    this.baseUrl = baseUrl;
    this.headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${jwtToken}`,
    };
  }

  /**
   * Start a new elaboration session
   * @param {string} seedId - Seed UUID
   * @returns {Promise<StartSessionResponse>}
   */
  async startSession(seedId) {
    const response = await fetch(`${this.baseUrl}/seeds/${seedId}/elaborate/start`, {
      method: 'POST',
      headers: this.headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to start session: ${error.message}`);
    }

    return await response.json();
  }

  /**
   * Submit an answer to the current question
   * @param {string} seedId - Seed UUID
   * @param {string} sessionId - Session UUID
   * @param {string} answer - User's answer
   * @returns {Promise<ProcessAnswerResponse>}
   */
  async submitAnswer(seedId, sessionId, answer) {
    const response = await fetch(`${this.baseUrl}/seeds/${seedId}/elaborate/answer`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ sessionId, answer }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to submit answer: ${error.message}`);
    }

    return await response.json();
  }

  /**
   * Get elaboration status
   * @param {string} seedId - Seed UUID
   * @returns {Promise<ElaborationStatusResponse>}
   */
  async getStatus(seedId) {
    const response = await fetch(`${this.baseUrl}/seeds/${seedId}/elaborate/status`, {
      method: 'GET',
      headers: this.headers,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to get status: ${error.message}`);
    }

    return await response.json();
  }

  /**
   * Run a complete elaboration flow with example answers
   * @param {string} seedId - Seed UUID
   * @returns {Promise<void>}
   */
  async runFullElaborationFlow(seedId) {
    console.log('🚀 Starting seed elaboration flow...\n');

    // Start session
    console.log('📝 Step 1: Starting session...');
    const startResponse = await this.startSession(seedId);
    console.log(`✅ Session started: ${startResponse.sessionId}`);
    console.log(`❓ Question 1: ${startResponse.question}`);
    console.log(`📊 Completeness: ${startResponse.completeness}%\n`);

    const sessionId = startResponse.sessionId;
    const exampleAnswers = [
      '30 young people aged 18-25 from Turkey, Spain, and Germany',
      'Barcelona, Spain, at the Youth Hostel Barcelona',
      '7 days, from July 15 to July 21, 2024',
      '€15,000 total budget, approximately €500 per participant',
      'Cultural workshops, team building activities, and local excursions',
      'Focus on inclusion and environmental sustainability',
      'Travel insurance required, no visas needed for EU participants',
    ];

    // Submit answers
    let questionNumber = 2;
    for (const answer of exampleAnswers) {
      console.log(`📝 Step ${questionNumber}: Submitting answer...`);
      console.log(`💬 Answer: "${answer}"`);

      const answerResponse = await this.submitAnswer(seedId, sessionId, answer);

      console.log(`✅ Answer processed`);
      console.log(`📊 Completeness: ${answerResponse.completeness}%`);

      if (answerResponse.extractedMetadata) {
        console.log(`📦 Extracted metadata:`, JSON.stringify(answerResponse.extractedMetadata, null, 2));
      }

      if (answerResponse.complete) {
        console.log('🎉 Elaboration complete!\n');
        break;
      }

      if (answerResponse.nextQuestion) {
        console.log(`❓ Next question: ${answerResponse.nextQuestion}`);
        if (answerResponse.suggestions && answerResponse.suggestions.length > 0) {
          console.log(`💡 Suggestions: ${answerResponse.suggestions.join(', ')}`);
        }
      }

      console.log('');
      questionNumber++;
    }

    // Get final status
    console.log('📊 Step Final: Getting final status...');
    const status = await this.getStatus(seedId);
    console.log(`✅ Final completeness: ${status.completeness}%`);
    console.log(`📦 Final metadata:`, JSON.stringify(status.metadata, null, 2));

    if (status.missingFields.length > 0) {
      console.log(`⚠️  Missing fields: ${status.missingFields.join(', ')}`);
    } else {
      console.log('✅ All required information collected!');
    }
  }
}

// =============================================================================
// Usage Examples
// =============================================================================

/**
 * Example 1: Basic usage - Start session and submit one answer
 */
async function example1_basicUsage() {
  const client = new SeedElaborationClient('your-jwt-token-here');
  const seedId = '550e8400-e29b-41d4-a716-446655440000';

  try {
    // Start session
    const startResponse = await client.startSession(seedId);
    console.log('First question:', startResponse.question);

    // Submit answer
    const answerResponse = await client.submitAnswer(
      seedId,
      startResponse.sessionId,
      '30 young people aged 18-25 from Turkey, Spain, and Germany'
    );

    console.log('Next question:', answerResponse.nextQuestion);
    console.log('Completeness:', answerResponse.completeness + '%');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 2: Check status before continuing
 */
async function example2_checkStatus() {
  const client = new SeedElaborationClient('your-jwt-token-here');
  const seedId = '550e8400-e29b-41d4-a716-446655440000';

  try {
    // Check current status
    const status = await client.getStatus(seedId);
    console.log('Current completeness:', status.completeness + '%');
    console.log('Missing fields:', status.missingFields);

    // Resume if not complete
    if (status.completeness < 100) {
      const startResponse = await client.startSession(seedId);
      console.log('Resuming session:', startResponse.sessionId);
      console.log('Current question:', startResponse.question);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

/**
 * Example 3: Full elaboration flow with interactive prompts (Node.js)
 */
async function example3_interactiveFlow() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const client = new SeedElaborationClient('your-jwt-token-here');
  const seedId = '550e8400-e29b-41d4-a716-446655440000';

  try {
    const startResponse = await client.startSession(seedId);
    let sessionId = startResponse.sessionId;
    let currentQuestion = startResponse.question;
    let complete = false;

    console.log(`\n📝 Elaboration started (Session: ${sessionId})\n`);

    while (!complete) {
      console.log(`❓ ${currentQuestion}\n`);

      const answer = await new Promise((resolve) => {
        rl.question('Your answer: ', resolve);
      });

      const response = await client.submitAnswer(seedId, sessionId, answer);

      console.log(`\n📊 Completeness: ${response.completeness}%`);

      if (response.extractedMetadata) {
        console.log('📦 Extracted:', JSON.stringify(response.extractedMetadata, null, 2));
      }

      if (response.complete) {
        console.log('\n🎉 Elaboration complete!\n');
        complete = true;
      } else {
        currentQuestion = response.nextQuestion;
        if (response.suggestions && response.suggestions.length > 0) {
          console.log('💡 Suggestions:', response.suggestions.join(', '));
        }
        console.log('');
      }
    }

    rl.close();
  } catch (error) {
    console.error('Error:', error.message);
    rl.close();
  }
}

/**
 * Example 4: Error handling
 */
async function example4_errorHandling() {
  const client = new SeedElaborationClient('your-jwt-token-here');
  const seedId = '550e8400-e29b-41d4-a716-446655440000';

  try {
    const startResponse = await client.startSession(seedId);

    // Try to submit with invalid session ID
    try {
      await client.submitAnswer(seedId, 'invalid-session-id', 'Some answer');
    } catch (error) {
      console.error('Expected error for invalid session:', error.message);
    }

    // Submit with correct session ID
    const answerResponse = await client.submitAnswer(
      seedId,
      startResponse.sessionId,
      '30 young people'
    );

    console.log('Answer submitted successfully');
  } catch (error) {
    console.error('Unexpected error:', error.message);
  }
}

// Export for use as module
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SeedElaborationClient;
}

// Run example if executed directly
if (require.main === module) {
  const JWT_TOKEN = process.env.JWT_TOKEN;
  const SEED_ID = process.env.SEED_ID || '550e8400-e29b-41d4-a716-446655440000';

  if (!JWT_TOKEN) {
    console.error('❌ Error: JWT_TOKEN environment variable is required');
    console.error('Usage: JWT_TOKEN=your-token SEED_ID=seed-uuid node seed-elaboration.js');
    process.exit(1);
  }

  const client = new SeedElaborationClient(JWT_TOKEN);
  client.runFullElaborationFlow(SEED_ID).catch(console.error);
}
