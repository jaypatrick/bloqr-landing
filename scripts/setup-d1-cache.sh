#!/usr/bin/env bash
# One-time setup for the D1 config cache.
# Run this once after deploying the Worker for the first time.
#
# Usage: bash scripts/setup-d1-cache.sh
# Make executable: chmod +x scripts/setup-d1-cache.sh
set -euo pipefail

echo "Creating D1 database..."
wrangler d1 create bloqr-config-cache

echo ""
echo "⚠️  Copy the database_id above into wrangler.toml [[d1_databases]] binding."
echo "   Then run the schema migration below:"
echo ""

# Uncomment and run after updating wrangler.toml with the real database_id:
# wrangler d1 execute bloqr-config-cache --command \
#   "CREATE TABLE IF NOT EXISTS config_cache (key TEXT PRIMARY KEY, value TEXT NOT NULL, cached_at INTEGER NOT NULL)"

echo "Done. See wrangler.toml for the [[d1_databases]] binding."
