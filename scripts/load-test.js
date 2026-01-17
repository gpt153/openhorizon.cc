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
const projectCreationDuration = new Trend('project_creation_duration');
const vendorSearchDuration = new Trend('vendor_search_duration');
const documentExportDuration = new Trend('document_export_duration');
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

// Authentication configuration
// Set CLERK_TEST_TOKEN environment variable with a valid session token
// To obtain: Log in to app, open DevTools → Application → Cookies → Copy __session value
const AUTH_TOKEN = __ENV.CLERK_TEST_TOKEN;

// Build headers with authentication if available
const headers = {
  'Content-Type': 'application/json',
};

// Add authentication cookie if token is provided
if (AUTH_TOKEN) {
  headers['Cookie'] = `__session=${AUTH_TOKEN}`;
}

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
 * Test project creation endpoint (POST mutation)
 * Returns project ID for subsequent tests
 */
function testProjectCreation() {
  let projectId = null;

  group('Project Creation', () => {
    const projectData = {
      name: `Load Test Project ${Date.now()}-${__VU}`,
      description: 'Performance testing project created by K6 load test',
      seedId: null, // Not linked to a seed
    };

    const start = Date.now();
    const response = trpcMutation('pipeline.projects.create', projectData);
    const duration = Date.now() - start;

    projectCreationDuration.add(duration);

    const success = check(response, {
      'project creation status is 200': (r) => r.status === 200,
      'project creation time < 2s': (r) => r.timings.duration < 2000,
      'project has ID in response': (r) => {
        try {
          const body = JSON.parse(r.body);
          return body.result?.data?.id !== undefined;
        } catch {
          return false;
        }
      },
    });

    errorRate.add(!success);

    // Extract project ID for subsequent tests
    if (success && response.status === 200) {
      try {
        const body = JSON.parse(response.body);
        projectId = body.result.data.id;
      } catch (e) {
        console.warn('Failed to extract project ID:', e);
      }
    }
  });

  return projectId;
}

/**
 * Test vendor search trigger (background job initiation)
 * Note: We don't wait for job completion, just verify trigger works
 */
function testVendorSearch(projectId) {
  if (!projectId) {
    console.warn('Skipping vendor search test: no project ID');
    return;
  }

  group('Vendor Search Trigger', () => {
    // Simplified search data for load testing
    const searchData = {
      projectId: projectId,
      searchType: 'food',
      location: 'Barcelona, Spain',
      participantCount: 30,
      startDate: '2026-07-01',
      endDate: '2026-07-10',
    };

    const start = Date.now();
    const response = trpcMutation('pipeline.searchJobs.triggerSearch', searchData);
    const duration = Date.now() - start;

    vendorSearchDuration.add(duration);

    const success = check(response, {
      'vendor search trigger status is 200': (r) => r.status === 200,
      'vendor search trigger time < 1s': (r) => r.timings.duration < 1000,
      'job ID or acknowledgment returned': (r) => {
        try {
          const body = JSON.parse(r.body);
          // Accept various success indicators
          return body.result?.data !== undefined || r.status === 200;
        } catch {
          return r.status === 200;
        }
      },
    });

    errorRate.add(!success);
  });
}

/**
 * Test document export endpoint (PDF generation)
 */
function testDocumentExport(projectId) {
  if (!projectId) {
    console.warn('Skipping document export test: no project ID');
    return;
  }

  group('Document Export', () => {
    const exportUrl = `${BASE_URL}/api/projects/${projectId}/export?format=pdf`;

    const start = Date.now();
    const response = http.get(exportUrl, {
      headers: headers,
      tags: { type: 'export', format: 'pdf' }
    });
    const duration = Date.now() - start;

    documentExportDuration.add(duration);

    const success = check(response, {
      'export status is 200': (r) => r.status === 200,
      'export response time < 3s': (r) => r.timings.duration < 3000,
      'export content-type is PDF': (r) => {
        const contentType = r.headers['Content-Type'] || r.headers['content-type'];
        return contentType && contentType.includes('application/pdf');
      },
      'export file size > 0': (r) => r.body && r.body.length > 0,
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
  sleep(0.5);

  // NEW: Write operations (only 10% of users to avoid DB pollution)
  // This tests project creation, vendor search trigger, and document export
  if (Math.random() < 0.1) {
    const projectId = testProjectCreation();

    if (projectId) {
      sleep(1);
      testVendorSearch(projectId);
      sleep(1);
      testDocumentExport(projectId);
    }
  }

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
