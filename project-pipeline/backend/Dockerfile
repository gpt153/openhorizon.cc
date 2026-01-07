FROM node:20-slim AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Production image
FROM node:20-slim

WORKDIR /app

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and install all dependencies (including dev for tsx)
COPY package*.json ./
RUN npm ci

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY --from=build /app/src ./src

# Expose port
EXPOSE 4000

# Start with tsx (ts-node alternative) to skip type checking
CMD ["npx", "tsx", "src/app.ts"]
