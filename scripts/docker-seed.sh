#!/usr/bin/env bash
set -e

# ==============================================================================
# StockPulse: Single-Command Docker Seed Script
# ==============================================================================

echo "==============================================================="
echo "⚡ Seeding StockPulse Multi-Tenant PostgreSQL Database (Docker)"
echo "==============================================================="

# Execute seed script inside running backend container
docker compose exec -T backend npx tsx prisma/seed.ts

echo "==============================================================="
echo "✅ Database successfully seeded with Acme Retail & Summit Supplies!"
echo "==============================================================="
