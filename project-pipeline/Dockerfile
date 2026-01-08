# Multi-stage build for project pipeline (backend + frontend)
FROM node:20-alpine AS frontend-build

WORKDIR /app/frontend

# Build frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Backend build
FROM node:20-alpine AS backend-build

WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci

# Copy Prisma and generate client
COPY backend/prisma ./prisma/
RUN npx prisma generate

# Copy backend source
COPY backend/ ./
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

# Install production dependencies for backend
COPY backend/package*.json ./
RUN npm ci --only=production

# Copy Prisma files
COPY backend/prisma ./prisma/
COPY --from=backend-build /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-build /app/backend/node_modules/@prisma ./node_modules/@prisma

# Copy built backend
COPY --from=backend-build /app/backend/dist ./dist

# Copy built frontend to public directory
COPY --from=frontend-build /app/frontend/dist ./public

# Expose port (Cloud Run uses PORT env var)
EXPOSE $PORT

# Start backend (which will serve frontend static files)
CMD ["node", "dist/app.js"]
