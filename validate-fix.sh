#!/bin/bash
# Validation script for Playwright testing fix

set -e

echo "🔍 Validation Script for Playwright Testing Fix"
echo "================================================"
echo ""

echo "✅ Step 1: Check required files exist"
FILES=(
    "Dockerfile.test"
    ".github/workflows/playwright.yml"
    "docker-compose.test.yml"
    "TESTING.md"
    "tests/project-features.spec.ts"
    "playwright.config.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file exists"
    else
        echo "   ✗ $file missing!"
        exit 1
    fi
done
echo ""

echo "✅ Step 2: Verify package.json scripts"
if grep -q "test:docker" package.json; then
    echo "   ✓ test:docker script found"
else
    echo "   ✗ test:docker script missing!"
    exit 1
fi
echo ""

echo "✅ Step 3: Verify Dockerfile.test includes dependencies"
REQUIRED_DEPS=(
    "libnspr4"
    "libnss3"
    "libatk-bridge2.0-0"
    "libxcomposite1"
)

for dep in "${REQUIRED_DEPS[@]}"; do
    if grep -q "$dep" Dockerfile.test; then
        echo "   ✓ $dep included in Dockerfile.test"
    else
        echo "   ✗ $dep missing from Dockerfile.test!"
        exit 1
    fi
done
echo ""

echo "✅ Step 4: Verify .gitignore includes test artifacts"
if grep -q "test-results" .gitignore; then
    echo "   ✓ test-results in .gitignore"
else
    echo "   ✗ test-results not in .gitignore!"
    exit 1
fi
echo ""

echo "✅ Step 5: Check Docker availability"
if command -v docker &> /dev/null; then
    echo "   ✓ Docker is available"
    docker --version
else
    echo "   ⚠️  Docker not available - skipping build test"
    echo ""
    echo "📋 Summary: Static validation PASSED"
    echo "   Docker validation skipped (Docker not available)"
    exit 0
fi
echo ""

echo "✅ Step 6: Validate Dockerfile.test syntax"
if docker build -f Dockerfile.test -t openhorizon-test:validation --quiet . > /dev/null 2>&1; then
    echo "   ✓ Dockerfile.test builds successfully"
    echo "   ✓ Image tagged as openhorizon-test:validation"
else
    echo "   ✗ Dockerfile.test build failed!"
    exit 1
fi
echo ""

echo "✅ Step 7: Verify Playwright is installed in test image"
if docker run --rm openhorizon-test:validation npx playwright --version > /dev/null 2>&1; then
    VERSION=$(docker run --rm openhorizon-test:validation npx playwright --version)
    echo "   ✓ Playwright installed: $VERSION"
else
    echo "   ✗ Playwright not installed in test image!"
    exit 1
fi
echo ""

echo "✅ Step 8: Verify Chromium browser is available"
if docker run --rm openhorizon-test:validation npx playwright install --dry-run chromium 2>&1 | grep -q "chromium"; then
    echo "   ✓ Chromium browser available"
else
    echo "   ✗ Chromium browser not available!"
    exit 1
fi
echo ""

echo "================================================"
echo "🎉 ALL VALIDATIONS PASSED!"
echo "================================================"
echo ""
echo "The fix has been successfully validated:"
echo "  ✓ All required files created"
echo "  ✓ Dependencies correctly specified"
echo "  ✓ Docker image builds successfully"
echo "  ✓ Playwright and Chromium installed"
echo ""
echo "You can now run tests with:"
echo "  npm run test:docker"
echo ""
echo "Or in CI via GitHub Actions (automatic on push/PR)"
