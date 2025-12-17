#!/bin/bash

# Setup script for OpenHorizon development environment

set -e

echo "🚀 OpenHorizon Development Setup"
echo "=================================="
echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "❌ .env.local not found!"
    echo "📝 Creating .env.local from .env.example..."

    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo "✅ Created .env.local - Please update with your actual values:"
        echo "   - DATABASE_URL (Supabase connection string)"
        echo "   - OPENAI_API_KEY (Your OpenAI API key)"
        echo "   - INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY (use 'test' for dev)"
        echo ""
        echo "📖 See QUICKSTART.md for detailed instructions"
        exit 1
    else
        echo "❌ .env.example not found!"
        exit 1
    fi
fi

echo "✅ Found .env.local"
echo ""

# Check for required environment variables
echo "🔍 Checking environment variables..."

source .env.local

if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set in .env.local"
    exit 1
fi
echo "✅ DATABASE_URL configured"

if [ -z "$OPENAI_API_KEY" ]; then
    echo "❌ OPENAI_API_KEY not set in .env.local"
    echo "   Get your API key from: https://platform.openai.com/api-keys"
    exit 1
fi
echo "✅ OPENAI_API_KEY configured"

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🗄️  Checking database connection..."
npx prisma db push --skip-generate 2>/dev/null || {
    echo "⚠️  Could not connect to database or push schema"
    echo "   This might be OK if tables already exist"
}

echo ""
echo "🌱 Seeding dummy organization..."
# Run the seed SQL
psql "$DATABASE_URL" -f ../seed-dummy-org.sql 2>/dev/null || {
    echo "⚠️  Could not seed database automatically"
    echo "   Please run manually: psql \$DATABASE_URL -f seed-dummy-org.sql"
}

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Start Inngest dev server (in a separate terminal):"
echo "      npx inngest-cli@latest dev"
echo ""
echo "   2. Start the development server:"
echo "      npm run dev"
echo ""
echo "   3. Open http://localhost:3000 in your browser"
echo ""
echo "   4. Try creating a project!"
echo ""
echo "💡 Troubleshooting tips:"
echo "   - If Inngest fails, make sure it's running: npx inngest-cli dev"
echo "   - Check server console for error messages"
echo "   - See QUICKSTART.md for detailed troubleshooting"
