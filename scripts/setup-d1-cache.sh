#!/usr/bin/env bash
# scripts/setup-d1-cache.sh
# One-time setup for the Cloudflare D1 config cache (bloqr-config-cache).
# Run from repo root after initial Worker deployment.
set -euo pipefail

echo "Step 1 — Creating D1 database..."
wrangler d1 create bloqr-config-cache

echo ""
echo "ACTION REQUIRED: Copy the database_id above into wrangler.toml:"
echo "  [[d1_databases]]"
echo "  database_id = \"<paste-here>\""
echo ""
read -rp "Press ENTER once wrangler.toml is updated with the database_id..."

echo "Step 2 — Applying schema..."
wrangler d1 execute bloqr-config-cache --command \
  "CREATE TABLE IF NOT EXISTS config_cache (key TEXT PRIMARY KEY, value TEXT NOT NULL, cached_at INTEGER NOT NULL)"

echo ""
echo "Done. D1 cache is ready. TTL: 5 min. Invalidated per-key on POST /admin/config."
