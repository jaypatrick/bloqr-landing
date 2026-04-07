title: ci: add Cloudflare Workers deploy job on push to main

Adds an automatic deploy to Cloudflare Workers whenever a commit is pushed or merged to main.

## What changed
- Added `push: branches: [main]` trigger alongside the existing `pull_request` trigger
- Added a new `deploy` job that runs after `build` succeeds, only on push to `main`
- Deploy publishes to Cloudflare Workers after the build job succeeds, using `CLOUDFLARE_API_TOKEN` from repo secrets
- The `dist/` artifact built in the `build` job is uploaded and reused by the `deploy` job (no second build)

## Required setup
Before merging, add the following secret to the repo:

**Settings → Secrets → Actions → New repository secret**
- Name: `CLOUDFLARE_API_TOKEN`
- Value: A Cloudflare API token with **Workers: Edit** permission