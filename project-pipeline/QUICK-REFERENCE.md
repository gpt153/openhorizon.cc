# Project Pipeline - Quick Reference Guide

**For:** Developers and System Administrators
**Last Updated:** 2026-01-05

---

## 🚀 Quick Start Commands

### Local Development

```bash
# Start infrastructure
docker-compose up -d

# Backend
cd backend
npm install
cp .env.example .env
# Add ANTHROPIC_API_KEY and OPENAI_API_KEY to .env
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

**Access:** http://localhost:5173 (demo: test@example.com / password123)

---

## 🧪 Testing

```bash
cd backend

# Run all tests
npm test

# With coverage
npm run test:coverage

# Specific test file
npm test src/tests/agents/accommodation-agent.test.ts

# Watch mode
npm test -- --watch
```

---

## 🗄️ Database Operations

```bash
cd backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Reset database (⚠️ deletes all data)
npm run prisma:migrate reset

# Seed data
npm run seed

# Open Prisma Studio
npm run prisma:studio
```

---

## 📝 API Endpoints

### Authentication
```
POST /auth/register
POST /auth/login
GET  /auth/me
```

### Projects
```
GET    /projects
POST   /projects
GET    /projects/:id
PATCH  /projects/:id
DELETE /projects/:id
```

### Budget
```
GET  /budget/projects/:projectId
POST /budget/phases/:phaseId/record-expense
GET  /budget/phases/:phaseId/quotes/compare
POST /budget/phases/:phaseId/quotes/:quoteId/accept
GET  /budget/alerts
```

### Reports
```
GET /reports/projects/:id/pdf?type=summary|budget|erasmus
GET /reports/projects/:id/excel?type=summary|budget
```

**Full API Docs:** See `backend/openapi.yaml`

---

## 🔐 Environment Variables

### Backend (.env)

**Required:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/db"
JWT_SECRET="generate-with-openssl-rand-base64-32"
ANTHROPIC_API_KEY="sk-ant-xxx"
OPENAI_API_KEY="sk-xxx"
NODE_ENV="development"
PORT="3000"
FRONTEND_URL="http://localhost:5173"
```

**Optional:**
```bash
REDIS_URL="redis://localhost:6379"
WEAVIATE_URL="http://localhost:8080"
SENDGRID_API_KEY="SG.xxx"
SENDGRID_FROM_EMAIL="noreply@yourproject.com"
```

### Frontend (.env)
```bash
VITE_API_URL="http://localhost:3000"
VITE_WS_URL="ws://localhost:3000"
```

---

## 🐛 Common Issues

### "Database connection failed"
```bash
# Check Docker is running
docker ps

# Restart PostgreSQL
docker-compose restart postgres

# Check connection string in .env
echo $DATABASE_URL
```

### "AI agents not responding"
```bash
# Verify API key
echo $ANTHROPIC_API_KEY

# Check API quota (visit Anthropic dashboard)

# Test with mock data (set useRealData: false)
```

### "Tests failing"
```bash
# Clear node_modules
rm -rf node_modules package-lock.json
npm install

# Regenerate Prisma
npm run prisma:generate

# Re-run tests
npm test
```

### "Frontend build errors"
```bash
cd frontend
rm -rf node_modules .vite dist
npm install
npm run build
```

---

## 🔧 Useful Scripts

### Backend

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Start production
npm start

# Lint code
npm run lint

# Format code
npm run format
```

### Frontend

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview build
npm run preview

# Type check
npm run type-check
```

---

## 📊 Docker Commands

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (⚠️ deletes data)
docker-compose down -v

# Restart specific service
docker-compose restart postgres

# View running containers
docker ps
```

---

## 🎨 Code Structure

### Backend

```
backend/src/
├── ai/
│   ├── agents/          # 6 AI agents
│   │   ├── base-agent.ts
│   │   ├── accommodation-agent.ts
│   │   ├── travel-agent.ts
│   │   ├── food-agent.ts
│   │   ├── activities-agent.ts
│   │   ├── insurance-agent.ts
│   │   ├── emergency-agent.ts
│   │   └── registry.ts
│   ├── learning/        # Learning system
│   └── chat.service.ts
├── reports/             # Budget & reports
├── communications/      # Email automation
├── integrations/        # OpenProject, scraping
├── auth/               # Authentication
├── projects/           # Project CRUD
├── phases/             # Phase CRUD
└── tests/              # Test suites
```

### Frontend

```
frontend/src/
├── components/
│   └── GanttChart.tsx
├── pages/
│   ├── Login.tsx
│   ├── Dashboard.tsx
│   └── ProjectDetail.tsx
├── services/
│   └── api.ts
├── types/
│   └── index.ts
├── App.tsx
└── main.tsx
```

---

## 🔍 Debugging

### Backend Logs

```bash
# Fastify logs (development)
npm run dev
# Watch console for request/response logs

# Production logs
NODE_ENV=production npm start | tee app.log
```

### Database Queries

```bash
# Enable Prisma query logging in .env
DATABASE_LOG_LEVEL="query"

# View queries in console
npm run dev
```

### Frontend Network

```
Open DevTools → Network tab
Filter: XHR/Fetch
Check API calls and responses
```

---

## 📦 Deployment

### Quick Deploy (Google Cloud)

```bash
# Build backend
cd backend
gcloud builds submit --tag gcr.io/PROJECT_ID/backend

# Deploy to Cloud Run
gcloud run deploy backend \
  --image gcr.io/PROJECT_ID/backend \
  --platform managed \
  --region europe-west1

# Build frontend
cd frontend
npm run build

# Deploy to Vercel
vercel --prod
```

**Full Guide:** See `DEPLOYMENT-GUIDE.md`

---

## 🔑 Important Credentials

### Default Development
- **Database:** `project_pipeline` / `password` (local only)
- **Redis:** No password (local only)
- **MinIO:** `minioadmin` / `minioadmin` (local only)

### Demo User
- **Email:** test@example.com
- **Password:** password123

**⚠️ Change all credentials in production!**

---

## 📞 Support Contacts

- **Technical Issues:** devops@yourproject.com
- **User Support:** support@yourproject.com
- **Documentation:** See guides in project root

---

## 🔗 Quick Links

- [User Guide](./USER-GUIDE.md) - For end users
- [Deployment Guide](./DEPLOYMENT-GUIDE.md) - For DevOps
- [Project Status](./PROJECT-STATUS.md) - Technical overview
- [API Docs](./backend/openapi.yaml) - OpenAPI specification
- [PRD](./docs/PRD-ProjectPipeline.md) - Product requirements
- [Setup Guide](./SETUP.md) - Detailed setup

---

## ⚡ Performance Tips

### Backend
- Enable Redis caching for frequent queries
- Index database queries (already done in Prisma schema)
- Use connection pooling (Prisma default)
- Limit AI agent calls (use cached responses)

### Frontend
- Build for production: `npm run build`
- Enable Vite's code splitting
- Use React.memo for expensive components
- Lazy load routes

---

## 🎯 Testing Checklist

Before deploying:

- [ ] All tests pass: `npm test`
- [ ] No TypeScript errors: `npm run type-check`
- [ ] Build succeeds: `npm run build`
- [ ] Environment variables configured
- [ ] Database migrated: `npm run prisma:migrate`
- [ ] Seed data loaded (optional): `npm run seed`
- [ ] API endpoints tested manually
- [ ] Frontend loads correctly
- [ ] WebSocket connections work
- [ ] Budget calculations accurate
- [ ] Reports generate successfully

---

**Last Updated:** 2026-01-05
**Version:** 1.0.0
