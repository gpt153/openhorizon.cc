# Load Testing Scripts

This directory contains K6 load testing scripts for validating OpenHorizon's performance under realistic load conditions.

## Files

- **load-test.js** - Full load test scenario (50 concurrent users, 7 minutes)
- **smoke-test.js** - Quick validation test (1 user, 30 seconds)
- **load-test.sh** - Test runner script with configuration options

## Quick Start

### Prerequisites

K6 is already installed at `~/bin/k6` (v0.54.0).

### Run Smoke Test

Quick validation (30 seconds, 1 user):

```bash
# From project root
npm run test:smoke --workspace=app

# Or directly
BASE_URL=https://app.openhorizon.cc ~/bin/k6 run scripts/smoke-test.js
```

### Run Load Test

Full load test (7 minutes, 50 users):

```bash
# From project root
npm run test:load --workspace=app

# Or directly
./scripts/load-test.sh

# Custom configuration
./scripts/load-test.sh --url https://staging.example.com --users 25 --duration 3m
```

## Test Scenarios

### Smoke Test

- **Purpose**: Quick validation before running full tests
- **Duration**: 30 seconds
- **Users**: 1 concurrent user
- **Thresholds**:
  - p95 latency < 2s
  - Error rate < 5%

### Load Test

- **Purpose**: Production readiness validation
- **Duration**: 7 minutes total
  - Ramp-up: 1 minute (0 → 50 users)
  - Steady state: 5 minutes (50 users)
  - Ramp-down: 1 minute (50 → 0 users)
- **Thresholds**:
  - p95 latency < 1s
  - p99 latency < 2s
  - Error rate < 1%
  - Throughput > 100 req/s

### Tested Endpoints

The load tests exercise these critical workflows:

1. **Dashboard Loading**:
   - `GET /api/trpc/projects.list` - Project listing
   - `GET /api/trpc/pipeline.projects.list` - Pipeline projects
   - `GET /api/trpc/brainstorm.listSavedSeeds` - Saved seeds

2. **Resource Browsing**:
   - `GET /api/trpc/pipeline.vendors.list` - Vendor directory
   - `GET /api/trpc/programmes.list` - Funding programmes

3. **Realistic Behavior**:
   - Think time: 1-3 seconds between actions
   - Mixed read operations
   - Typical user session flow

## Configuration Options

### Environment Variables

- `BASE_URL` - Target URL (default: `https://app.openhorizon.cc`)
- `AUTH_TOKEN` - Authentication bearer token (required for protected endpoints)
- `K6_BIN` - Path to K6 binary (default: `~/bin/k6`)

### Script Options

```bash
./scripts/load-test.sh [options]

Options:
  --url URL           Base URL to test
  --users N           Number of concurrent users (default: 50)
  --duration DURATION Duration for steady state (default: 5m)
  --report            Generate HTML report
  --smoke             Run smoke test instead
  --help              Show help message
```

## Authentication

⚠️ **Important**: The tRPC endpoints require authentication.

### Current Status

Without authentication, endpoints return `401 Unauthorized`. This is expected behavior.

### Setup Authentication

**Option 1: Bearer Token** (Recommended)

```bash
# Generate token from Clerk dashboard or test user
AUTH_TOKEN="your_clerk_jwt_token" ./scripts/load-test.sh
```

**Option 2: Test Environment**

Create a dedicated test environment with mock authentication:

```bash
./scripts/load-test.sh --url https://staging.openhorizon.cc
```

**Option 3: Modify Headers in Script**

Edit `scripts/load-test.js`:

```javascript
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${__ENV.AUTH_TOKEN}`
};
```

## Results

Test results are saved in `test-results/load-tests/`:

- `results_YYYYMMDD_HHMMSS.json` - Full K6 metrics
- `summary_YYYYMMDD_HHMMSS.json` - Summary statistics

### Viewing Results

With `jq` installed:

```bash
# View summary
jq '.metrics.http_req_duration.values' test-results/load-tests/summary_*.json

# Check error rate
jq '.metrics.http_req_failed.values.rate' test-results/load-tests/summary_*.json

# View throughput
jq '.metrics.http_reqs.values.rate' test-results/load-tests/summary_*.json
```

## Performance Targets

| Metric | Target | Current Status |
|--------|--------|----------------|
| p50 Latency | < 500ms | ⏳ Pending auth setup |
| p95 Latency | < 1s | ⏳ Pending auth setup |
| p99 Latency | < 2s | ⏳ Pending auth setup |
| Error Rate | < 1% | ⏳ Pending auth setup |
| Throughput | > 100 req/s | ⏳ Pending auth setup |
| Max Users | 50 concurrent | ⏳ To be validated |

## Troubleshooting

### K6 Not Found

```bash
# Check installation
which k6
# or
~/bin/k6 version

# If not found, reinstall:
cd /tmp
curl -L https://github.com/grafana/k6/releases/download/v0.54.0/k6-v0.54.0-linux-amd64.tar.gz -o k6.tar.gz
tar -xzf k6.tar.gz
mkdir -p ~/bin
mv k6-v0.54.0-linux-amd64/k6 ~/bin/
chmod +x ~/bin/k6
```

### High Error Rate (401s)

This is expected without authentication. See **Authentication** section above.

### Connection Refused

Check that the target URL is accessible:

```bash
curl -I https://app.openhorizon.cc
```

### Low Throughput

If throughput is below target:

1. Check database connection pool size
2. Review Prisma queries for N+1 problems
3. Add database indexes for slow queries
4. Monitor server CPU/memory during test

## Next Steps

1. ✅ **Install K6** - Complete
2. ✅ **Create test scripts** - Complete
3. ✅ **Run smoke test** - Complete (with expected auth errors)
4. ⏳ **Configure authentication** - Next step
5. ⏳ **Run full load test** - After auth setup
6. ⏳ **Analyze results** - After successful test
7. ⏳ **Optimize bottlenecks** - Based on results
8. ⏳ **Re-test and validate** - Confirm optimizations

## References

- [Full Performance Documentation](../docs/PERFORMANCE.md)
- [K6 Documentation](https://k6.io/docs/)
- [K6 Thresholds Guide](https://k6.io/docs/using-k6/thresholds/)
- [K6 Metrics Reference](https://k6.io/docs/using-k6/metrics/)

---

**Last Updated**: 2026-01-17
**Status**: Ready for authenticated testing
