#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Bloqr Landing — GitHub initial setup
# Run from anywhere:  bash scripts/setup-github.sh
#                  or bash setup-github.sh
# ─────────────────────────────────────────────────────────────
set -e

# Always execute from the repo root, regardless of where the script is called from
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "$REPO_ROOT"

REPO_NAME="bloqr-landing"
GITHUB_USER="jaypatrick"

echo ""
echo "▶ Working in: $REPO_ROOT"

echo "▶ Removing any stale git lock..."
rm -f .git/index.lock

echo "▶ Staging all source files (respects .gitignore)..."
git add .

echo "▶ Files staged:"
git status --short

echo ""
echo "▶ Creating initial commit..."
git commit -m "feat: initial Bloqr landing page

AI-focused internet hygiene landing page built with Astro + Svelte 5 + Cloudflare Pages.

Includes:
- Hero with Internet Hygiene definition + hover tooltip
- How It Works interactive code/UI toggle (Svelte 5 fixed)
- Audience persona tab switcher (Svelte 5 fixed)
- Features grid (Edge-first, AI-powered threat intelligence)
- VPN Myths deep-dive page with full OG metadata
- Blog with RSS feed + complete OG/Twitter meta on all pages
- Pricing + Waitlist sections
- Shortened nav labels, full mobile menu, external links open in new tab"

echo ""
echo "══════════════════════════════════════════════════════════"
echo " Next: create the GitHub repo and push"
echo "══════════════════════════════════════════════════════════"
echo ""
echo "Option A — gh CLI (recommended):"
echo "  gh repo create ${GITHUB_USER}/${REPO_NAME} --private --source=. --remote=origin --push"
echo ""
echo "Option B — manual:"
echo "  1. Create repo at https://github.com/new  (name: ${REPO_NAME}, private)"
echo "  2. git remote add origin git@github.com:${GITHUB_USER}/${REPO_NAME}.git"
echo "  3. git push -u origin main"
echo ""
echo "Done! ✓"
