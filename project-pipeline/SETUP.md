# Project Pipeline Setup Guide

## Prerequisites

- Node.js 20+ LTS
- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Git

## Quick Start

### 1. Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, Weaviate, MinIO
docker-compose up -d

# Verify all services are running
docker-compose ps
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env and add your API keys:
# - ANTHROPIC_API_KEY
# - JWT_SECRET (generate with: openssl rand -base64 32)

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with sample data
npm run seed

# Start development server
npm run dev
```

The backend API will be available at `http://localhost:3000`

### 3. Verify Installation

```bash
# Test API health
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"...","environment":"development"}
```

### 4. Access Database Tools

**Prisma Studio** (Database GUI):
```bash
cd backend
npm run prisma:studio
```
Opens at `http://localhost:5555`

**MinIO Console** (File Storage):
- URL: `http://localhost:9001`
- Username: `minioadmin`
- Password: `minioadmin`

## Environment Variables

Copy `backend/.env.example` to `backend/.env` and configure:

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `ANTHROPIC_API_KEY` - Claude API key for AI agents
- `JWT_SECRET` - Secret for JWT tokens (generate with `openssl rand -base64 32`)

### Optional
- `OPENPROJECT_URL` - OpenProject instance URL
- `OPENPROJECT_API_KEY` - OpenProject API key
- `SENDGRID_API_KEY` - For email sending
- `OPENAI_API_KEY` - For embeddings/alternative LLM

## Database Migrations

```bash
# Create a new migration
npm run prisma:migrate -- --name your_migration_name

# Reset database (⚠️ DELETES ALL DATA)
npx prisma migrate reset

# View current migration status
npx prisma migrate status
```

## Development Workflow

1. **Start services**: `docker-compose up -d`
2. **Start backend**: `cd backend && npm run dev`
3. **Make changes**: Edit files in `src/`
4. **Auto-reload**: tsx watch automatically restarts on changes
5. **Run tests**: `npm test`

## Project Structure

```
backend/
├── prisma/
│   └── schema.prisma           # Database schema
├── src/
│   ├── config/                 # Configuration
│   │   ├── database.ts         # Prisma client
│   │   └── env.ts              # Environment validation
│   ├── auth/                   # Authentication
│   ├── projects/               # Project routes
│   ├── phases/                 # Phase routes
│   ├── communications/         # Email handling
│   ├── ai/                     # AI agents
│   │   ├── agents/             # Agent implementations
│   │   ├── learning/           # Learning system
│   │   └── vector-db/          # Weaviate client
│   ├── integrations/           # External services
│   ├── reports/                # Report generation
│   ├── utils/                  # Utilities
│   │   └── seed.ts             # Database seeding
│   └── app.ts                  # Main application
└── package.json
```

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

### Port Already in Use

If port 3000, 5432, 6379, or 8080 is already in use:

1. Stop conflicting service
2. Or edit `docker-compose.yml` to use different ports

### Prisma Client Out of Sync

```bash
# Regenerate Prisma client
npm run prisma:generate

# If that doesn't work, delete and regenerate
rm -rf node_modules/.prisma
npm run prisma:generate
```

## Next Steps

1. **Explore the API**: Open `http://localhost:3000` in your browser
2. **Read the PRD**: See `PRD-ProjectPipeline.md` for product requirements
3. **Check Implementation Plan**: See `IMPLEMENTATION-PLAN-ProjectPipeline.md` for development roadmap
4. **Start Building**: Follow Phase 1 tasks in the implementation plan

## Useful Commands

```bash
# View all npm scripts
npm run

# Format code (if prettier is configured)
npm run format

# Lint code (if eslint is configured)
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## Getting Help

- Read the [Implementation Plan](./IMPLEMENTATION-PLAN-ProjectPipeline.md)
- Read the [PRD](./PRD-ProjectPipeline.md)
- Check Docker logs: `docker-compose logs -f`
- Check application logs in terminal

## Production Deployment

See `IMPLEMENTATION-PLAN-ProjectPipeline.md` Section 6 for production deployment instructions.
