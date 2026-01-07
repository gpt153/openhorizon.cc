FROM node:20-alpine AS build

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
FROM node:20-alpine

WORKDIR /app

# Copy package files and install all dependencies (including dev for tsx)
COPY package*.json ./
RUN npm ci

# Copy Prisma files and generated client
COPY prisma ./prisma/
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Copy source code
COPY --from=build /app/src ./src

# Expose port
EXPOSE 4000

# Start with tsx (ts-node alternative) to skip type checking
CMD ["npx", "tsx", "src/app.ts"]
