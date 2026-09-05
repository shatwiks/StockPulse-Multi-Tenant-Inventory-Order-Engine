#!/bin/sh
set -e

echo "⚡ [StockPulse Server] Checking database connectivity..."
# Wait for PostgreSQL port to be open
DB_HOST=$(echo "${DATABASE_URL:-postgres}" | sed -E 's/.*@([^:]+):([0-9]+).*/\1/')
DB_PORT=$(echo "${DATABASE_URL:-5432}" | sed -E 's/.*@([^:]+):([0-9]+).*/\2/')
[ -z "$DB_HOST" ] && DB_HOST="postgres"
[ -z "$DB_PORT" ] && DB_PORT="5432"

echo "⚡ Connecting to database at $DB_HOST:$DB_PORT..."
until nc -z "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  echo "⏳ PostgreSQL is initializing... sleeping 1s"
  sleep 1
done
echo "✅ Database connection verified."

echo "⚡ Running Prisma schema migrations..."
npx prisma migrate deploy

echo "⚡ Seeding default multi-tenant organizations and initial inventory..."
npx tsx prisma/seed.ts || echo "ℹ️ Database already contains seed records."

echo "==============================================================="
echo "⚡ Starting StockPulse Express API Server on port ${PORT:-3001}..."
echo "==============================================================="
exec node dist/server.js
