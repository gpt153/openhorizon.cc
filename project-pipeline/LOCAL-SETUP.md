# Project Pipeline - Local Setup Guide

Quick guide to run the Project Pipeline system locally with seeded test data.

---

## Prerequisites

- **Docker & Docker Compose** (for databases)
- **Node.js 18+**
- **npm or yarn**

---

## Quick Start (5 minutes)

### 1. Start All Services

From the `project-pipeline/` directory:

```bash
# Start databases (postgres, redis, weaviate, minio)
docker-compose up -d

# Wait for services to be healthy (~30 seconds)
docker-compose ps
```

### 2. Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pipeline_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=local-dev-secret-key-change-in-production
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here
WEAVIATE_HOST=localhost:8080
WEAVIATE_SCHEME=http
FROM_EMAIL=test@example.com
FROM_NAME=Test Pipeline
EOF

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database with test data
npm run seed

# Start backend server
npm run dev
```

Backend will run at: **http://localhost:3000**

### 3. Setup Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << 'EOF'
VITE_API_URL=http://localhost:3000
EOF

# Start frontend
npm run dev
```

Frontend will run at: **http://localhost:5173**

---

## Test Data

The seed script creates:

### Test User
- **Email:** test@example.com
- **Password:** password123
- **Role:** COORDINATOR

### Sample Project
- **Name:** "Summer Exchange Barcelona 2025"
- **Type:** Student Exchange
- **Dates:** June 1-30, 2025
- **Budget:** €50,000
- **Participants:** 50 students

### Sample Phases
1. **Accommodation** - €15,000 budget
2. **Travel Arrangements** - €12,000 budget
3. **Food & Catering** - €8,000 budget
4. **Activities & Excursions** - €6,000 budget
5. **Insurance** - €2,000 budget

---

## Access the Application

1. **Open browser:** http://localhost:5173
2. **Login:**
   - Email: test@example.com
   - Password: password123
3. **View project:** Should see "Summer Exchange Barcelona 2025"
4. **Click project:** View timeline with 5 phases
5. **Click any phase:** Open phase detail with AI chat

---

## Test AI Agents

**Note:** AI agents require API keys to work.

If you have API keys configured:

1. Click on **"Accommodation"** phase
2. Chat interface opens
3. Type: "Find me hotels near the beach in Barcelona"
4. AccommodationAgent will research and suggest options

Try other phases:
- **Travel:** "Find flights from Stockholm to Barcelona"
- **Food:** "Suggest vegetarian-friendly catering options"
- **Activities:** "Recommend educational tours in Barcelona"

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using the port
lsof -i :3000  # Backend
lsof -i :5173  # Frontend
lsof -i :5432  # PostgreSQL

# Kill the process
kill -9 <PID>
```

### Database Connection Error

```bash
# Check if postgres is running
docker-compose ps postgres

# Restart postgres
docker-compose restart postgres

# View logs
docker-compose logs postgres
```

### Prisma Client Issues

```bash
# Regenerate Prisma client
cd backend
npm run prisma:generate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
npm run seed
```

### Frontend Can't Connect to Backend

1. Check backend is running: `curl http://localhost:3000/health`
2. Check VITE_API_URL in frontend/.env
3. Check CORS settings in backend

---

## Stop Everything

```bash
# Stop frontend/backend (Ctrl+C in terminals)

# Stop databases
cd project-pipeline
docker-compose down

# Stop and remove data (WARNING: deletes all data)
docker-compose down -v
```

---

## Next Steps After Testing

1. Test all features locally
2. Try AI agents with different queries
3. Test timeline drag-and-drop
4. Create new projects and phases
5. Report findings

Once satisfied with functionality, we can proceed with integration into main app.

---

## Need Help?

- Backend logs: Check terminal running `npm run dev`
- Frontend logs: Check browser console (F12)
- Database: `docker-compose logs postgres`
- All services: `docker-compose logs`
