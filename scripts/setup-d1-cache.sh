#!/usr/bin/env bash
# scripts/setup-d1-cache.sh
#
# One-time setup for the Cloudflare D1 config cache.
# Run from the repo root after deploying the Worker for the first time.
#
# Usage:
#   chmod +x scripts/setup-d1-cache.sh
#   ./scripts/setup-d1-cache.sh
#
set -euo pipefail

echo "─── Step 1: Create D1 database ───────────────────────────────────────────"
wrangler d1 create bloqr-config-cache

echo ""
echo "⚠️  ACTION REQUIRED:"
echo "   Copy the database_id printed above into wrangler.toml:"
echo "   [[d1_databases]]"
echo "   database_id = \"<paste here>\""
echo ""
read -p "Press ENTER once you've updated wrangler.toml with the database_id..."

echo "─── Step 2: Create cache schema ──────────────────────────────────────────"
wrangler d1 execute bloqr-config-cache --command \
  "CREATE TABLE IF NOT EXISTS config_cache (key TEXT PRIMARY KEY, value TEXT NOT NULL, cached_at INTEGER NOT NULL)"

echo ""
echo "✓ D1 cache database created and schema applied."
echo "  The Worker will now use D1 as a read-through cache for GET /config."
echo "  Cache TTL: 5 minutes. Invalidated automatically on POST /admin/config."
