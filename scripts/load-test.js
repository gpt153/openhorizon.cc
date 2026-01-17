/**
 * K6 Load Test for OpenHorizon Application
 *
 * This script simulates 50 concurrent users performing typical operations
 * against the production application to validate performance under load.
 *
 * Target: https://app.openhorizon.cc
 * Scenario: Ramp-up to 50 users, maintain for 5 minutes, ramp-down
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const projectListDuration = new Trend('project_list_duration');
const pipelineListDuration = new Trend('pipeline_list_duration');
const seedListDuration = new Trend('seed_list_duration');
const requestCounter = new Counter('total_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Ramp-up to 50 users over 1 minute
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '1m', target: 0 },    // Ramp-down to 0 users
  ],
  thresholds: {
    // 95% of requests should complete within 1 second
    http_req_duration: ['p(95)<1000'],
    // 99% of requests should complete within 2 seconds
    'http_req_duration{type:query}': ['p(99)<2000'],
    // Error rate should be less than 1%
    errors: ['rate<0.01'],
    // At least 100 requests per second
    http_reqs: ['rate>100'],
  },
};

// Base URL and configuration
const BASE_URL = __ENV.BASE_URL || 'https://app.openhorizon.cc';
const TRPC_ENDPOINT = `${BASE_URL}/api/trpc`;

// Mock authentication headers (in production, you'd use real auth tokens)
// For now, we'll test public/unauthenticated endpoints or use a test account
const headers = {
  'Content-Type': 'application/json',
};

/**
 * Make a tRPC query request
 * tRPC queries use GET requests with query params
 */
function trpcQuery(procedure, input = null) {
  const inputParam = input ? `?input=${encodeURIComponent(JSON.stringify(input))}` : '';
  const url = `${TRPC_ENDPOINT}/${procedure}${inputParam}`;

  requestCounter.add(1);
  const response = http.get(url, { headers, tags: { type: 'query' } });

  return response;
}

/**
 * Make a tRPC mutation request
 * tRPC mutations use POST requests
 */
function trpcMutation(procedure, input) {
  const url = `${TRPC_ENDPOINT}/${procedure}`;
  const payload = JSON.stringify(input);

  requestCounter.add(1);
  const response = http.post(url, payload, { headers, tags: { type: 'mutation' } });

  return response;
}

/**
 * Make a tRPC batch request
 * This is how the client typically batches multiple queries
 */
function trpcBatch(queries) {
  const batchInput = queries.map((q, i) => ({
    [i]: q
  })).reduce((acc, obj) => ({ ...acc, ...obj }), {});

  const url = `${TRPC_ENDPOINT}`;
  const payload = JSON.stringify(batchInput);

  requestCounter.add(1);
  const response = http.post(url, payload, {
    headers: {
      ...headers,
      'trpc-batch-mode': 'batch',
    },
    tags: { type: 'batch' }
  });

  return response;
}

/**
 * Test the health endpoint
 */
function testHealthCheck() {
  group('Health Check', () => {
    const response = http.get(BASE_URL, { tags: { name: 'health' } });

    check(response, {
      'health check status is 200': (r) => r.status === 200,
      'health check responds quickly': (r) => r.timings.duration < 500,
    });

    errorRate.add(response.status !== 200);
  });
}

/**
 * Test project listing endpoint
 */
function testProjectList() {
  group('Project List', () => {
    const start = Date.now();
    const response = trpcQuery('projects.list');
    const duration = Date.now() - start;

    projectListDuration.add(duration);

    const success = check(response, {
      'project list status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'project list response time < 1s': (r) => r.timings.duration < 1000,
      'project list has valid response': (r) => {
        if (r.status === 200) {
          try {
            const body = JSON.parse(r.body);
            return body.result !== undefined;
          } catch {
            return false;
          }
        }
        return true; // 401 is acceptable (not authenticated)
      },
    });

    errorRate.add(!success);
  });
}

/**
 * Test pipeline project listing
 */
function testPipelineList() {
  group('Pipeline Project List', () => {
    const start = Date.now();
    const response = trpcQuery('pipeline.projects.list');
    const duration = Date.now() - start;

    pipelineListDuration.add(duration);

    const success = check(response, {
      'pipeline list status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'pipeline list response time < 1s': (r) => r.timings.duration < 1000,
    });

    errorRate.add(!success);
  });
}

/**
 * Test saved seeds listing
 */
function testSeedList() {
  group('Saved Seeds List', () => {
    const start = Date.now();
    const response = trpcQuery('brainstorm.listSavedSeeds');
    const duration = Date.now() - start;

    seedListDuration.add(duration);

    const success = check(response, {
      'seed list status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'seed list response time < 1s': (r) => r.timings.duration < 1000,
    });

    errorRate.add(!success);
  });
}

/**
 * Test vendor search (if accessible)
 */
function testVendorList() {
  group('Vendor List', () => {
    const response = trpcQuery('pipeline.vendors.list');

    const success = check(response, {
      'vendor list status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'vendor list response time < 1s': (r) => r.timings.duration < 1000,
    });

    errorRate.add(!success);
  });
}

/**
 * Test programmes listing
 */
function testProgrammesList() {
  group('Programmes List', () => {
    const response = trpcQuery('programmes.list');

    const success = check(response, {
      'programmes list status is 200 or 401': (r) => r.status === 200 || r.status === 401,
      'programmes list response time < 1s': (r) => r.timings.duration < 1000,
    });

    errorRate.add(!success);
  });
}

/**
 * Main test scenario - simulates a typical user session
 */
export default function () {
  // Initial health check
  testHealthCheck();

  sleep(1);

  // User loads dashboard - fetches multiple lists
  testProjectList();
  sleep(0.5);

  // User navigates to pipeline
  testPipelineList();
  sleep(0.5);

  // User checks saved seeds
  testSeedList();
  sleep(0.5);

  // User browses vendors
  testVendorList();
  sleep(0.5);

  // User browses programmes
  testProgrammesList();

  // Random think time between actions (1-3 seconds)
  sleep(Math.random() * 2 + 1);
}

/**
 * Setup function - runs once per VU at the start
 */
export function setup() {
  console.log(`Starting load test against ${BASE_URL}`);
  console.log('Configuration:');
  console.log('- Ramp-up: 0 → 50 users over 1 minute');
  console.log('- Steady state: 50 users for 5 minutes');
  console.log('- Ramp-down: 50 → 0 users over 1 minute');
  console.log('- Total duration: 7 minutes');

  // Test that the endpoint is reachable
  const response = http.get(BASE_URL);
  if (response.status !== 200) {
    console.warn(`Warning: Base URL returned status ${response.status}`);
  }

  return {
    startTime: new Date().toISOString(),
  };
}

/**
 * Teardown function - runs once at the end
 */
export function teardown(data) {
  console.log(`Load test completed. Started at: ${data.startTime}`);
}
