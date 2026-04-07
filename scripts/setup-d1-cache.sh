#!/usr/bin/env bash
# scripts/setup-d1-cache.sh
#
# One-time setup for the Cloudflare D1 config cache.
# Run from the repo root after deploying the Worker for the first time.
#
set -euo pipefail

echo "─── Step 1: Create D1 database ───────────────────────────────────────────"
wrangler d1 create bloqr-config-cache

echo ""
echo "⚠️  ACTION REQUIRED:"
echo "   Copy the database_id printed above into wrangler.toml [[d1_databases]]"
echo "   then re-run this script or run the execute command manually."
echo ""
printf "Press ENTER once wrangler.toml is updated..."
read -r _

echo "─── Step 2: Create cache schema ──────────────────────────────────────────"
wrangler d1 execute bloqr-config-cache --command \
  "CREATE TABLE IF NOT EXISTS config_cache (key TEXT PRIMARY KEY, value TEXT NOT NULL, cached_at INTEGER NOT NULL)"

echo ""
echo "✓ Done. D1 cache is ready."
echo "  Cache TTL: 5 min. Invalidated per-key on every POST /admin/config."
