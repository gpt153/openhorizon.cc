/**
 * K6 Smoke Test for OpenHorizon Application
 *
 * Quick validation test with 1 user to verify endpoints are working
 * before running full load tests.
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';

export const options = {
  vus: 1,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://app.openhorizon.cc';
const TRPC_ENDPOINT = `${BASE_URL}/api/trpc`;

// Authentication configuration
const AUTH_TOKEN = __ENV.CLERK_TEST_TOKEN;

const headers = {
  'Content-Type': 'application/json',
};

// Add authentication cookie if token is provided
if (AUTH_TOKEN) {
  headers['Cookie'] = `__session=${AUTH_TOKEN}`;
}

function trpcQuery(procedure, input = null) {
  const inputParam = input ? `?input=${encodeURIComponent(JSON.stringify(input))}` : '';
  const url = `${TRPC_ENDPOINT}/${procedure}${inputParam}`;
  return http.get(url, { headers });
}

export default function () {
  group('Smoke Test - Basic Endpoints', () => {
    // Test home page
    const home = http.get(BASE_URL);
    check(home, {
      'home page loads': (r) => r.status === 200,
    });

    sleep(1);

    // Test a few tRPC endpoints
    const projects = trpcQuery('projects.list');
    check(projects, {
      'projects endpoint accessible': (r) => r.status === 200 || r.status === 401,
    });

    sleep(1);

    const seeds = trpcQuery('brainstorm.listSavedSeeds');
    check(seeds, {
      'seeds endpoint accessible': (r) => r.status === 200 || r.status === 401,
    });
  });

  sleep(1);
}

export function setup() {
  console.log('Running smoke test against:', BASE_URL);
}

export function teardown() {
  console.log('Smoke test complete');
}
