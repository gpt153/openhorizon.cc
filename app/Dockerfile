# Multi-stage build for optimal image size
FROM node:20-alpine AS deps
WORKDIR /workspace

# Install dependencies required for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy root package files (workspace monorepo)
COPY package*.json ./
COPY app/package*.json ./app/
RUN npm ci --legacy-peer-deps --workspace=app

# Prisma generation stage (separate to help with caching)
FROM node:20-alpine AS prisma
WORKDIR /workspace

# Install dependencies required for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy dependencies and schema
COPY --from=deps /workspace/node_modules ./node_modules
COPY app/prisma ./app/prisma
COPY package*.json ./
COPY app/package*.json ./app/

# Generate Prisma Client
WORKDIR /workspace/app
ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"
RUN npx prisma generate

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /workspace

# Install dependencies required for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy everything from deps
COPY --from=deps /workspace/node_modules ./node_modules

# Copy generated Prisma client (generated at root level due to workspace)
COPY --from=prisma /workspace/node_modules/.prisma ./node_modules/.prisma
COPY --from=prisma /workspace/node_modules/@prisma ./node_modules/@prisma

# Copy application code
COPY app ./app
COPY package*.json ./

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Set dummy environment variables for build time
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_dummy"
ENV CLERK_SECRET_KEY="sk_test_dummy"

# Build the application
WORKDIR /workspace/app
ENV SKIP_ENV_VALIDATION=1
RUN npm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime dependencies for Prisma
RUN apk add --no-cache openssl libc6-compat

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from the app directory in builder
COPY --from=builder /workspace/app/public ./public
COPY --from=builder --chown=nextjs:nodejs /workspace/app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/app/.next/static ./app/.next/static

# Note: Prisma client is already included in standalone build's node_modules

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Server.js is in the app subdirectory due to workspace monorepo structure
CMD ["node", "app/server.js"]
