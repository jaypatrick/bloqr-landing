# SECURITY INCIDENT - EXPOSED CLOUDFLARE API TOKEN

## Severity: CRITICAL

## Date Detected: 2026-04-08

## Issue
The `.dev.vars` file containing a Cloudflare API token was committed to the repository and tracked in Git history, despite being listed in `.gitignore`.

### Exposed Credential
- **File**: `.dev.vars`
- **Exposed Token**: `CLOUDFLARE_API_TOKEN=cfat_KHKF...2745e`
- **Full Token Record**: Available in Cloudflare audit logs and the internal incident tracker only
- **Token Type**: Cloudflare API Token
- **Scope**: Workers Scripts:Edit + Account:Read permissions

## Immediate Actions Required

### 1. Rotate the Exposed Token (URGENT)
1. Log into Cloudflare Dashboard: https://dash.cloudflare.com/profile/api-tokens
2. Find the token with the exposed prefix and **revoke it immediately**
3. Create a new API token with the same permissions:
   - Permission: **Workers Scripts:Edit**
   - Permission: **Account:Read**
   - Account: Select your Cloudflare account
4. Update the new token in:
   - GitHub Secrets: `CLOUDFLARE_API_TOKEN`
   - Local `.dev.vars` (if you have one locally - do NOT commit)

### 2. Purge from Git History
The token is in Git history. To completely remove it:

```bash
# Option 1: Using git-filter-repo (recommended)
pip install git-filter-repo
git filter-repo --invert-paths --path .dev.vars

# Option 2: Using BFG Repo-Cleaner
# Download from: https://rtyley.github.io/bfg-repo-cleaner/
java -jar bfg.jar --delete-files .dev.vars
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

After purging:
```bash
# Force push to update remote (COORDINATE WITH TEAM FIRST)
git push origin --force --all
git push origin --force --tags
```

### 3. Update .dev.vars Locally
```bash
# Copy the example file
cp .dev.vars.example .dev.vars

# Fill in your NEW token and other secrets
# NEVER commit this file
```

### 4. Verify .gitignore
Confirmed: `.dev.vars` is correctly listed in `.gitignore` line 15.
The file was likely committed before `.gitignore` was updated, or was force-added.

## Actions Taken
- [x] Removed `.dev.vars` from git index (`git rm --cached .dev.vars`)
- [x] Created this security incident report
- [ ] **PENDING**: Token rotation by repository owner
- [ ] **PENDING**: Git history purge by repository owner
- [ ] **PENDING**: Verification that no other secrets are exposed

## Prevention
- **Never use `git add -f .dev.vars`** or force-add files that are gitignored
- Always verify files before committing: `git status` should not show `.dev.vars`
- Consider using pre-commit hooks to prevent secret commits
- Use secret scanning tools like:
  - GitHub Advanced Security (if available)
  - git-secrets: https://github.com/awslabs/git-secrets
  - detect-secrets: https://github.com/Yelp/detect-secrets

## Reference
- AGENTS.md instructions state:
  > "Never commit `.dev.vars` or any secret... If a `.dev.vars` file is ever found tracked in the repository, immediately remove it from the index, purge it from Git history, rotate every secret that was exposed, and recreate `.dev.vars` locally from `.dev.vars.example`."
