# CI Setup Verification for Cloudflare Deployment

**Date**: 2026-04-08
**Status**: ⚠️ **CONFIGURED BUT BLOCKED** (pending critical security remediation: token rotation/history purge)

## Summary

The CI/CD pipeline is correctly configured for Cloudflare Workers deployment. The workflow at `.github/workflows/ci.yml` successfully:
- Builds the Astro static site
- Deploys to Cloudflare Workers using Wrangler
- Uses proper job dependencies and artifact passing

## ✅ Verified Components

### 1. GitHub Actions Workflow (`.github/workflows/ci.yml`)

**Build Job**:
- ✅ Runs on PRs and pushes to `main`
- ✅ Node.js 22 (matches project requirements)
- ✅ Generates PWA icons before build
- ✅ Runs `npm run build` with placeholder env vars
- ✅ Uploads `dist/` artifact for deployment

**Deploy Job**:
- ✅ Only runs on push to `main` (not on PRs)
- ✅ Depends on build job (`needs: build`)
- ✅ Uses concurrency control to prevent parallel deploys
- ✅ Downloads build artifact
- ✅ Runs `npx wrangler deploy` with `CLOUDFLARE_API_TOKEN`

### 2. Wrangler Configuration (`wrangler.toml`)

- ✅ Worker name: `adblock-landing`
- ✅ Compatibility date: 2026-01-01
- ✅ Static assets directory: `./dist`
- ✅ Worker entry point: `src/worker.ts`
- ✅ Smart placement enabled
- ✅ Observability configured (with TODOs for production)
- ✅ Account ID section added (commented with instructions)

### 3. Required GitHub Secrets

The following secret **must be configured** in GitHub:

| Secret | Status | Notes |
|--------|--------|-------|
| `CLOUDFLARE_API_TOKEN` | ⚠️ **MUST BE ROTATED** | See SECURITY_INCIDENT.md - exposed token must be replaced |

**Optional GitHub Secrets**:
- `CLOUDFLARE_ACCOUNT_ID` - Not required if `account_id` is set in `wrangler.toml` or if the API token has access to only one account

**Build-time placeholders** (already configured in CI):
- `DATABASE_URL` - Placeholder value used for build validation
- `BETTER_AUTH_SECRET` - Placeholder value used for build validation

### 4. Cloudflare Dashboard Configuration

The following **runtime secrets** must be configured in the Cloudflare dashboard at:
**Workers → adblock-landing → Settings → Variables** (as encrypted secrets)

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | ✅ Yes | Neon PostgreSQL connection string (production) |
| `APOLLO_API_KEY` | ✅ Yes | Apollo.io contact enrichment |
| `ADMIN_SECRET` | ✅ Yes | Legacy admin auth (until Better Auth migration complete) |
| `BETTER_AUTH_SECRET` | ✅ Yes | Better Auth JWT signing key |
| `BETTER_AUTH_URL` | ✅ Yes | Canonical app URL for OAuth callbacks |
| `GITHUB_CLIENT_ID` | ✅ Yes | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | ✅ Yes | GitHub OAuth app client secret |

**Note**: These are runtime secrets accessed by the Worker at execution time. They are **not** passed during the `wrangler deploy` command.

## 🔴 Critical Security Issue

### Exposed `.dev.vars` File

**Status**: ⚠️ **REMEDIATION IN PROGRESS**

A `.dev.vars` file containing a Cloudflare API token was found tracked in Git. This file has been:
- ✅ Removed from Git index (`git rm --cached .dev.vars`)
- ✅ Documented in `SECURITY_INCIDENT.md`

**Required Actions** (see `SECURITY_INCIDENT.md` for details):
1. 🔴 **URGENT**: Rotate the exposed Cloudflare API token
2. 🔴 **REQUIRED**: Purge `.dev.vars` from Git history using git-filter-repo or BFG
3. ✅ **DONE**: Verify `.gitignore` includes `.dev.vars` (line 15)
4. 🔴 **REQUIRED**: Update GitHub secret with new token after rotation

## ✅ How Deployment Works

### On Push to `main`:

1. **Build Job**:
   ```
   npm ci
   → node scripts/generate-icons.mjs
   → npm run build (with placeholder env vars)
   → Upload dist/ as artifact
   ```

2. **Deploy Job** (depends on build):
   ```
   npm ci
   → Download dist/ artifact
   → npx wrangler deploy
     - Reads wrangler.toml configuration
     - Uses CLOUDFLARE_API_TOKEN for auth
     - Bundles src/worker.ts as Worker
     - Uploads dist/ as static assets
   ```

### Authentication Flow:

```
wrangler deploy
└─> Reads CLOUDFLARE_API_TOKEN env var
    └─> Authenticates with Cloudflare API
        └─> Determines account from:
            1. account_id in wrangler.toml (if set), OR
            2. Default account associated with API token
```

## 📋 Deployment Checklist

Before the next deployment, ensure:

- [ ] **CRITICAL**: Rotate exposed Cloudflare API token
- [ ] **CRITICAL**: Update `CLOUDFLARE_API_TOKEN` GitHub secret with new token
- [ ] **CRITICAL**: Purge `.dev.vars` from Git history
- [ ] Configure `account_id` in `wrangler.toml` (optional but recommended):
  - Uncomment line 7: `# account_id = "your-account-id-here"`
  - Replace with actual Cloudflare account ID
- [ ] Verify all Cloudflare Workers runtime secrets are set (see table above)
- [ ] Create GitHub OAuth app for Better Auth (see DEPLOYMENT.md)
- [ ] Test deployment by pushing to `main` branch

## 🔗 Related Documentation

- **Main Deployment Guide**: `DEPLOYMENT.md`
- **Security Incident Report**: `SECURITY_INCIDENT.md`
- **Agent Instructions**: `AGENTS.md`
- **CI Workflow**: `.github/workflows/ci.yml`
- **Wrangler Config**: `wrangler.toml`

## 🔧 Local Development Testing

To test the deployment setup locally:

```bash
# 1. Set up local secrets (NEVER commit this file)
cp .dev.vars.example .dev.vars
# Edit .dev.vars with your actual secrets

# 2. Test Worker + static assets locally
npm run preview  # Uses wrangler dev

# 3. Test deployment (dry run)
npx wrangler deploy --dry-run
```

## 📊 CI Workflow Status

Current workflow configuration:
- **Triggers**: PRs and pushes to `main`
- **Build**: Runs on all triggers
- **Deploy**: Only on push to `main` (not PRs)
- **Concurrency**: Deploy jobs do not run in parallel; a new push cancels any in-progress deploy
- **Node version**: 22 (matches engine requirement >=20.18.1)

## ✅ Conclusion

The CI setup is **correctly configured** for Cloudflare deployment, with the following status:

**Ready to deploy after**:
1. ⚠️ Cloudflare API token rotation (CRITICAL)
2. ⚠️ Git history cleanup (CRITICAL)
3. ℹ️ Optional: Set `account_id` in wrangler.toml for explicitness

**No changes needed for**:
- ✅ GitHub Actions workflow structure
- ✅ Build process and artifact handling
- ✅ Wrangler configuration
- ✅ Environment variable passing

The deployment will work once the security issue is resolved and the required Cloudflare Workers secrets are configured in the dashboard.
