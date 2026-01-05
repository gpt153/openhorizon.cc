# Multi-stage build for optimal image size
FROM node:20-alpine AS deps
WORKDIR /app

# Install dependencies required for Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy package files
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies required for Prisma
RUN apk add --no-cache openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment to production
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Set dummy environment variables for build time
ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_dummy"
ENV CLERK_SECRET_KEY="sk_test_dummy"

# Generate Prisma Client
RUN npx prisma generate

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

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
