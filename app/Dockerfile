# Multi-stage build for optimal image size
FROM node:20-alpine AS deps
WORKDIR /workspace

# Install dependencies required for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy root package files (workspace monorepo)
COPY package*.json ./
COPY app/package*.json ./app/
RUN npm ci --legacy-peer-deps --workspace=app

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /workspace

# Install dependencies required for Prisma
RUN apk add --no-cache openssl libc6-compat

COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/app/node_modules ./app/node_modules
COPY app ./app
COPY package*.json ./

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Set dummy environment variables for build time
ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_dummy"
ENV CLERK_SECRET_KEY="sk_test_dummy"

# Generate Prisma Client (in app directory)
WORKDIR /workspace/app
RUN npx prisma generate

# Debug: Check where Prisma generated files
RUN find /workspace -name ".prisma" -type d && \
    ls -la /workspace/app/node_modules/.prisma || true && \
    ls -la /workspace/node_modules/.prisma || true

# Build the application
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
COPY --from=builder --chown=nextjs:nodejs /workspace/app/.next/static ./.next/static

# Copy Prisma generated client from app node_modules
COPY --from=builder /workspace/app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
