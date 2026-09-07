# ==============================================================================
# StockPulse Express API Server - Multi-Stage Production Dockerfile
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build & Dependencies
# ------------------------------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Install native dependencies required for OpenSSL binary targets
RUN apk add --no-cache openssl libc6-compat

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm install

# Copy Prisma schema and generate typed client
COPY prisma ./prisma
RUN npx prisma generate

# Copy application source code and TypeScript config
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript to JavaScript
RUN npx tsc

# ------------------------------------------------------------------------------
# Stage 2: Production Runtime
# ------------------------------------------------------------------------------
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime utilities (OpenSSL for Prisma engine, netcat for DB health probing)
RUN apk add --no-cache openssl libc6-compat netcat-openbsd

ENV NODE_ENV=production
ENV PORT=3001

# Copy package manifests, modules, and Prisma assets from builder
COPY package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dist ./dist

# Copy container entrypoint script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3001

ENTRYPOINT ["./docker-entrypoint.sh"]
