# Project Pipeline - Deployment Guide

**Version:** 1.0.0
**Last Updated:** 2026-01-05

This guide covers deploying the Project Pipeline Management System to production.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Local Development Setup](#local-development-setup)
4. [Production Deployment](#production-deployment)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [Security Checklist](#security-checklist)
8. [Monitoring & Logging](#monitoring--logging)
9. [Backup & Recovery](#backup--recovery)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Services

- **Node.js** 18+ LTS
- **Docker** & **Docker Compose** (for local development)
- **PostgreSQL** 14+ (production database)
- **Redis** 7+ (caching and sessions)
- **Weaviate** (vector database for learning system)
- **MinIO** or S3-compatible storage

### External API Keys

- **Anthropic API Key** - For Claude AI (required)
- **OpenAI API Key** - For embeddings (required)
- **SendGrid API Key** - For email automation (optional but recommended)

### Cloud Providers (Recommended)

**Option A: Google Cloud**
- Cloud Run (backend)
- Cloud SQL (PostgreSQL)
- Memorystore (Redis)
- Cloud Storage (MinIO alternative)
- Cloud CDN

**Option B: AWS**
- ECS/Fargate (backend)
- RDS PostgreSQL
- ElastiCache (Redis)
- S3 (storage)
- CloudFront (CDN)

**Option C: Self-Hosted**
- VPS with Docker
- PostgreSQL instance
- Redis instance
- Weaviate instance
- Nginx reverse proxy

---

## Architecture Overview

```
┌─────────────┐
│   Frontend  │ (React + Vite)
│  Static App │ → Vercel/Netlify
└──────┬──────┘
       │ HTTPS
       ↓
┌──────────────────────────────────────┐
│       Backend API (Node.js)          │
│  Fastify + TypeScript + Socket.io    │ → Google Cloud Run / AWS ECS
└───┬──────┬──────┬──────┬──────┬──────┘
    │      │      │      │      │
    ↓      ↓      ↓      ↓      ↓
┌────────┐ │ ┌────────┐ │ ┌────────┐
│Postgres│ │ │ Redis  │ │ │ MinIO  │
│   DB   │ │ │ Cache  │ │ │Storage │
└────────┘ │ └────────┘ │ └────────┘
           ↓            ↓
      ┌─────────┐  ┌──────────┐
      │Weaviate │  │ External │
      │ Vector  │  │   APIs   │
      │   DB    │  │(Claude,  │
      └─────────┘  │OpenAI)   │
                   └──────────┘
```

---

## Local Development Setup

### 1. Clone Repository

```bash
git clone https://github.com/your-org/project-pipeline.git
cd project-pipeline
```

### 2. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Weaviate (port 8080)
- MinIO (port 9000, console: 9001)

### 3. Backend Setup

```bash
cd backend
npm install

# Copy environment template
cp .env.example .env
```

**Edit `.env`:**
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/project_pipeline"

# Redis
REDIS_URL="redis://localhost:6379"

# Weaviate
WEAVIATE_URL="http://localhost:8080"
WEAVIATE_API_KEY=""

# JWT
JWT_SECRET="your-secret-key" # Generate: openssl rand -base64 32

# AI Services
ANTHROPIC_API_KEY="sk-ant-xxx"
OPENAI_API_KEY="sk-xxx"

# Email (optional)
SENDGRID_API_KEY="SG.xxx"
SENDGRID_FROM_EMAIL="noreply@yourproject.com"

# Storage
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_USE_SSL="false"

# App
NODE_ENV="development"
PORT="3000"
FRONTEND_URL="http://localhost:5173"
```

**Initialize Database:**
```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed
```

**Initialize Vector DB:**
```bash
# Start backend
npm run dev

# In another terminal
curl -X POST http://localhost:3000/learning/init \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### 4. Frontend Setup

```bash
cd frontend
npm install

# Copy environment template
cp .env.example .env
```

**Edit `.env`:**
```bash
VITE_API_URL="http://localhost:3000"
VITE_WS_URL="ws://localhost:3000"
```

**Start Frontend:**
```bash
npm run dev
```

### 5. Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- MinIO Console: http://localhost:9001
- Prisma Studio: `npm run prisma:studio`

**Demo Login:**
- Email: `test@example.com`
- Password: `password123`

---

## Production Deployment

### Option 1: Google Cloud (Recommended)

#### Prerequisites
- Google Cloud account
- `gcloud` CLI installed
- Project created

#### Step 1: Set Up Cloud SQL (PostgreSQL)

```bash
# Create instance
gcloud sql instances create project-pipeline-db \
  --database-version=POSTGRES_14 \
  --tier=db-f1-micro \
  --region=europe-west1

# Create database
gcloud sql databases create project_pipeline \
  --instance=project-pipeline-db

# Create user
gcloud sql users create appuser \
  --instance=project-pipeline-db \
  --password=SECURE_PASSWORD
```

#### Step 2: Set Up Memorystore (Redis)

```bash
gcloud redis instances create project-pipeline-cache \
  --size=1 \
  --region=europe-west1 \
  --redis-version=redis_7_0
```

#### Step 3: Set Up Cloud Storage

```bash
gcloud storage buckets create gs://project-pipeline-storage \
  --location=europe-west1
```

#### Step 4: Deploy Backend to Cloud Run

**Build Docker Image:**
```bash
cd backend

# Create Dockerfile (if not exists)
cat > Dockerfile <<EOF
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run prisma:generate
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
EOF

# Build and push
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/project-pipeline-backend
```

**Deploy to Cloud Run:**
```bash
gcloud run deploy project-pipeline-api \
  --image gcr.io/YOUR_PROJECT_ID/project-pipeline-backend \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "NODE_ENV=production" \
  --set-secrets "DATABASE_URL=DATABASE_URL:latest" \
  --set-secrets "ANTHROPIC_API_KEY=ANTHROPIC_API_KEY:latest" \
  --set-secrets "OPENAI_API_KEY=OPENAI_API_KEY:latest" \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 1 \
  --max-instances 10
```

#### Step 5: Deploy Frontend to Vercel/Netlify

**Vercel:**
```bash
cd frontend

# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Environment Variables (Vercel Dashboard):**
```
VITE_API_URL=https://project-pipeline-api-xxx.run.app
VITE_WS_URL=wss://project-pipeline-api-xxx.run.app
```

#### Step 6: Run Migrations

```bash
# Connect to Cloud SQL proxy
cloud_sql_proxy -instances=YOUR_PROJECT:europe-west1:project-pipeline-db=tcp:5432

# Run migrations
cd backend
DATABASE_URL="postgresql://appuser:PASSWORD@localhost:5432/project_pipeline" \
  npm run prisma:migrate deploy
```

---

### Option 2: AWS Deployment

#### Step 1: RDS PostgreSQL

```bash
aws rds create-db-instance \
  --db-instance-identifier project-pipeline-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 14.7 \
  --master-username admin \
  --master-user-password SECURE_PASSWORD \
  --allocated-storage 20
```

#### Step 2: ElastiCache Redis

```bash
aws elasticache create-cache-cluster \
  --cache-cluster-id project-pipeline-cache \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

#### Step 3: S3 Bucket

```bash
aws s3 mb s3://project-pipeline-storage
```

#### Step 4: Deploy Backend to ECS/Fargate

**Create Task Definition:**
```json
{
  "family": "project-pipeline-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "YOUR_ECR_IMAGE",
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "NODE_ENV", "value": "production"}
      ],
      "secrets": [
        {"name": "DATABASE_URL", "valueFrom": "arn:aws:secretsmanager:..."},
        {"name": "ANTHROPIC_API_KEY", "valueFrom": "arn:aws:secretsmanager:..."}
      ]
    }
  ]
}
```

**Deploy Service:**
```bash
aws ecs create-service \
  --cluster project-pipeline \
  --service-name backend-service \
  --task-definition project-pipeline-backend \
  --desired-count 2 \
  --launch-type FARGATE
```

#### Step 5: Deploy Frontend to S3 + CloudFront

```bash
cd frontend

# Build
npm run build

# Upload to S3
aws s3 sync dist/ s3://project-pipeline-frontend/

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name project-pipeline-frontend.s3.amazonaws.com
```

---

### Option 3: Self-Hosted (VPS)

#### Prerequisites
- Ubuntu 22.04 LTS VPS
- Domain name
- Root/sudo access

#### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Install Nginx
sudo apt install -y nginx certbot python3-certbot-nginx
```

#### Step 2: Set Up Services with Docker

```bash
cd /opt
sudo mkdir project-pipeline
sudo chown $USER:$USER project-pipeline
cd project-pipeline

# Create docker-compose.yml
cat > docker-compose.yml <<EOF
version: '3.8'
services:
  postgres:
    image: postgres:14
    restart: always
    environment:
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: SECURE_PASSWORD
      POSTGRES_DB: project_pipeline
    volumes:
      - postgres-data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  redis:
    image: redis:7-alpine
    restart: always
    ports:
      - "127.0.0.1:6379:6379"

  weaviate:
    image: semitechnologies/weaviate:latest
    restart: always
    ports:
      - "127.0.0.1:8080:8080"
    environment:
      QUERY_DEFAULTS_LIMIT: 25
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'

volumes:
  postgres-data:
EOF

# Start services
docker-compose up -d
```

#### Step 3: Deploy Backend

```bash
cd /var/www
sudo mkdir backend
sudo chown $USER:$USER backend
cd backend

# Clone or copy backend code
git clone https://github.com/your-org/project-pipeline.git .

# Install dependencies
npm ci --only=production

# Set up environment
cp .env.example .env.production
# Edit .env.production with production values

# Build
npm run build

# Run migrations
npm run prisma:migrate deploy

# Install PM2
sudo npm install -g pm2

# Start backend
pm2 start dist/app.js --name project-pipeline-api
pm2 startup
pm2 save
```

#### Step 4: Deploy Frontend

```bash
cd /var/www
sudo mkdir frontend
sudo chown $USER:$USER frontend
cd frontend

# Clone or copy frontend code
git clone https://github.com/your-org/project-pipeline-frontend.git .

# Install dependencies and build
npm ci
npm run build

# Move build to nginx
sudo cp -r dist/* /var/www/html/
```

#### Step 5: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/project-pipeline

# Add:
server {
    listen 80;
    server_name yourproject.com;

    # Frontend
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}

# Enable site
sudo ln -s /etc/nginx/sites-available/project-pipeline /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### Step 6: SSL with Let's Encrypt

```bash
sudo certbot --nginx -d yourproject.com
```

---

## Environment Configuration

### Backend Environment Variables

**Required:**
```bash
# Database
DATABASE_URL="postgresql://user:password@host:5432/db"

# JWT
JWT_SECRET="secure-random-string"

# AI
ANTHROPIC_API_KEY="sk-ant-xxx"
OPENAI_API_KEY="sk-xxx"

# App
NODE_ENV="production"
PORT="3000"
FRONTEND_URL="https://app.yourproject.com"
```

**Optional:**
```bash
# Redis
REDIS_URL="redis://host:6379"

# Weaviate
WEAVIATE_URL="http://weaviate:8080"
WEAVIATE_API_KEY=""

# Email
SENDGRID_API_KEY="SG.xxx"
SENDGRID_FROM_EMAIL="noreply@yourproject.com"

# Storage
MINIO_ENDPOINT="storage.googleapis.com"
MINIO_BUCKET="project-pipeline-storage"
MINIO_ACCESS_KEY="xxx"
MINIO_SECRET_KEY="xxx"
MINIO_USE_SSL="true"

# OpenProject (optional)
OPENPROJECT_URL="https://openproject.yourschool.com"
OPENPROJECT_API_KEY="xxx"

# Logging
LOG_LEVEL="info"
```

### Frontend Environment Variables

```bash
VITE_API_URL="https://api.yourproject.com"
VITE_WS_URL="wss://api.yourproject.com"
```

---

## Database Setup

### Production Migration

```bash
# Set DATABASE_URL
export DATABASE_URL="postgresql://..."

# Generate Prisma Client
npm run prisma:generate

# Run migrations
npm run prisma:migrate deploy

# Seed initial data (optional)
npm run seed
```

### Backup Strategy

**Automated Daily Backups:**

**PostgreSQL (Google Cloud SQL):**
```bash
gcloud sql backups create \
  --instance=project-pipeline-db \
  --description="Daily automated backup"
```

**PostgreSQL (Self-Hosted):**
```bash
# Cron job (daily at 2 AM)
0 2 * * * pg_dump project_pipeline | gzip > /backups/db_$(date +\%Y\%m\%d).sql.gz
```

---

## Security Checklist

### Pre-Deployment

- [ ] Generate strong JWT_SECRET (`openssl rand -base64 64`)
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS/SSL (Let's Encrypt or Cloud provider)
- [ ] Configure CORS to only allow frontend domain
- [ ] Set secure cookie flags
- [ ] Enable rate limiting on API endpoints
- [ ] Scan for vulnerabilities (`npm audit`)
- [ ] Update all dependencies to latest stable versions

### Post-Deployment

- [ ] Test all API endpoints with authentication
- [ ] Verify WebSocket connections work over WSS
- [ ] Test file uploads to storage
- [ ] Verify email sending works
- [ ] Check AI agents respond correctly
- [ ] Test budget calculations
- [ ] Generate sample reports

### Ongoing

- [ ] Monitor for failed login attempts
- [ ] Review access logs weekly
- [ ] Update dependencies monthly
- [ ] Rotate API keys quarterly
- [ ] Backup database daily
- [ ] Test disaster recovery quarterly

---

## Monitoring & Logging

### Recommended Tools

- **APM:** Datadog, New Relic, or Google Cloud Monitoring
- **Error Tracking:** Sentry
- **Uptime Monitoring:** UptimeRobot
- **Log Aggregation:** Logtail, Papertrail

### Key Metrics to Monitor

- API response times
- Database query performance
- Error rates
- WebSocket connections
- AI API usage and costs
- Memory and CPU usage
- Disk space

### Setting Up Sentry (Error Tracking)

```bash
npm install @sentry/node @sentry/profiling-node

# In app.ts
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

---

## Backup & Recovery

### What to Backup

1. **PostgreSQL Database** - Daily automated backups
2. **Vector Database (Weaviate)** - Weekly backups
3. **File Storage (MinIO/S3)** - Versioning enabled
4. **Environment Variables** - Secure vault

### Recovery Procedures

**Restore Database:**
```bash
# From Google Cloud SQL backup
gcloud sql backups restore BACKUP_ID \
  --backup-instance=project-pipeline-db \
  --backup-id=BACKUP_ID

# From PostgreSQL dump
gunzip < backup.sql.gz | psql project_pipeline
```

**Restore Weaviate:**
```bash
# Restore from backup
docker run -v $(pwd)/backup:/backup \
  semitechnologies/weaviate:latest \
  restore --from /backup
```

---

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check DATABASE_URL is correct
- Verify all required environment variables are set
- Check logs: `pm2 logs project-pipeline-api`

**Database connection failed:**
- Verify database is running
- Check firewall rules allow connection
- Test connection: `psql $DATABASE_URL`

**AI agents not responding:**
- Check ANTHROPIC_API_KEY is valid
- Verify API quota not exceeded
- Check network connectivity

**WebSocket connections failing:**
- Ensure Nginx/load balancer supports WebSocket upgrades
- Check CORS settings
- Verify WSS (not WS) in production

**Email not sending:**
- Verify SENDGRID_API_KEY
- Check sender email is verified in SendGrid
- Review SendGrid activity feed

---

## Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database migrated and seeded
- [ ] SSL/HTTPS enabled
- [ ] CORS configured correctly
- [ ] Backups scheduled
- [ ] Monitoring set up
- [ ] Error tracking configured
- [ ] Load tested (if expecting high traffic)
- [ ] Documentation reviewed
- [ ] Support contact information updated
- [ ] Disaster recovery plan documented

---

**For support during deployment, contact: devops@yourproject.com**

Good luck with your deployment! 🚀
