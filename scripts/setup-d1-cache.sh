#!/usr/bin/env bash
# scripts/setup-d1-cache.sh
#
# One-time Cloudflare D1 setup for the bloqr-config-cache database.
# Run from the repo root after initial Worker deployment.
#
# Usage:
#   chmod +x scripts/setup-d1-cache.sh
#   ./scripts/setup-d1-cache.sh
#
set -euo pipefail

echo "═══ Step 1: Create D1 database ══════════════════════════════════════════"
wrangler d1 create bloqr-config-cache

echo ""
echo "  ⚠  ACTION REQUIRED"
echo "  Copy the 'database_id' value printed above into wrangler.toml:"
echo ""
echo "    [[d1_databases]]"
echo "    database_id = \"<paste-here>\""
echo ""
read -rp "  Press ENTER once wrangler.toml is updated..."

echo ""
echo "═══ Step 2: Apply schema ════════════════════════════════════════════════"
wrangler d1 execute bloqr-config-cache --command \
  "CREATE TABLE IF NOT EXISTS config_cache (key TEXT PRIMARY KEY, value TEXT NOT NULL, cached_at INTEGER NOT NULL)"

echo ""
echo "  ✓ Done."
echo "  D1 cache is ready. TTL: 5 min. Per-key invalidation on POST /admin/config."
