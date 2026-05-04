#!/usr/bin/env bash
# scripts/setup-d1-email.sh
#
# One-time setup for the `bloqr-landing-email-db` Cloudflare D1 database.
#
# Creates the database, applies the schema, and prints the wrangler.toml
# snippet you need to add.  Run from the repo root ONCE per environment.
#
# Usage:
#   chmod +x scripts/setup-d1-email.sh
#   ./scripts/setup-d1-email.sh
#
# After running:
#   1. Copy the `database_id` from the output below.
#   2. In wrangler.toml, uncomment the [[d1_databases]] block for bloqr-landing-email-db
#      and paste the database_id.
#   3. Push to main — CI will deploy with the binding attached.
#
# For local dev with `npm run preview`:
#   After adding the binding to wrangler.toml, the D1 database is created
#   locally on first access.  Set DATABASE_URL in .dev.vars as usual.

set -euo pipefail

MIGRATION_FILE="scripts/migrations/001_email_db.sql"
DB_NAME="bloqr-landing-email-db"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "❌ Migration file not found: $MIGRATION_FILE"
  echo "   Run this script from the repo root."
  exit 1
fi

echo ""
echo "═══ Step 1: Create D1 database ══════════════════════════════════════════"
echo "  Creating: ${DB_NAME}"
echo ""
wrangler d1 create "${DB_NAME}"

echo ""
echo "  ⚠  ACTION REQUIRED"
echo "  Copy the 'database_id' value printed above into wrangler.toml:"
echo ""
echo "    [[d1_databases]]"
echo "    binding       = \"EMAIL_DB\""
echo "    database_name = \"${DB_NAME}\""
echo "    database_id   = \"<paste-here>\""
echo ""
read -rp "  Press ENTER once wrangler.toml is updated..."

echo ""
echo "═══ Step 2: Apply schema (local) ════════════════════════════════════════"
wrangler d1 execute "${DB_NAME}" --file "${MIGRATION_FILE}"
echo "  ✓ Local schema applied"

echo ""
echo "═══ Step 3: Apply schema (remote / production) ══════════════════════════"
echo "  Running: wrangler d1 execute ${DB_NAME} --file ${MIGRATION_FILE} --remote"
wrangler d1 execute "${DB_NAME}" --file "${MIGRATION_FILE}" --remote
echo "  ✓ Remote schema applied"

echo ""
echo "═══ Done ════════════════════════════════════════════════════════════════"
echo ""
echo "  ✓ bloqr-landing-email-db D1 database is ready."
echo ""
echo "  Tables created:"
echo "    email_sends     — delivery log (written by queue consumer)"
echo "    email_templates — custom template overrides (managed via /admin/email)"
echo ""
echo "  Next steps:"
echo "    1. Uncomment the [[d1_databases]] block for bloqr-landing-email-db in wrangler.toml"
echo "    2. Push to main — CI deploys with the binding attached"
echo "    3. Visit /admin/email to verify the configuration status"
echo ""
