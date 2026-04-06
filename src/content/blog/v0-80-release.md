---
title: "Bloqr 0.80: tRPC, Better Auth, and the road to general availability"
description: "API versioning, a new auth stack, Neon PostgreSQL via Hyperdrive, and what's coming next. The release notes for engineers who actually read release notes."
pubDate: 2026-04-06
author: "Bloqr Team"
category: "release"
tags: ["release", "trpc", "auth", "cloudflare", "neon"]
draft: false
---

Version 0.80 landed today. Here's what changed, why, and what it means for anyone building on the Bloqr API.

## tRPC + API versioning

We added tRPC v1 with an `X-API-Version` header for the full type-safe RPC surface. If you're integrating from a TypeScript client, the `@jk-com/adblock-compiler` JSR package ships the router types — import them, get full end-to-end type safety without a codegen step.

The existing REST surface (`POST /compile`, `POST /compile/stream`, etc.) is unchanged. tRPC is additive.

```typescript
// Zero codegen. Just types.
import { createTRPCClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '@jk-com/adblock-compiler';

const client = createTRPCClient<AppRouter>({
  links: [httpBatchLink({ url: 'https://api.bloqr.ai/trpc' })],
});

const result = await client.compile.mutate({
  sources: [{ source: 'https://raw.githubusercontent.com/hagezi/dns-blocklists/main/adblock/pro.txt' }],
  transformations: ['Deduplicate', 'RemoveComments', 'InsertFinalNewLine'],
});
```

## Better Auth replaces Clerk (mostly)

We've integrated [Better Auth](https://better-auth.com) as the primary authentication provider. Clerk is still present as a fallback in the auth chain while existing sessions migrate, but it's on the deprecation path. Expect Clerk to be fully removed in 0.82.

Why the switch? Better Auth runs natively on Cloudflare Workers — no external auth server, no round-trips outside the edge. Sessions are validated in the same Worker request that handles your API call. The Prisma adapter means user data lives in our own database (Neon, more on that below), not in a third-party SaaS.

## Neon PostgreSQL via Cloudflare Hyperdrive

The primary database has migrated from Cloudflare D1 to Neon PostgreSQL, accessed through Cloudflare Hyperdrive. D1 is retained as an edge cache layer.

Why Neon? At our current growth trajectory, D1's row and storage limits become a real constraint before GA. Neon's serverless driver works natively in Workers without connection pooling headaches, and Hyperdrive handles the connection management automatically. Cold query latency is negligible.

D1 as a cache layer means the most common reads (frequently requested filter list compilations, user configuration lookups) stay at the edge. The Neon round-trip only happens when the cache misses.

## Zod everywhere

All 15 POST/PUT/PATCH routes now validate with `zValidator('json', Schema)` middleware. Malformed requests get structured 422 responses with field-level error details instead of generic 500s. If you've been handling errors from the Bloqr API, this is a meaningful improvement — error responses are now reliable JSON you can inspect programmatically.

The schemas are exported from the JSR package if you want to validate on the client side before sending.

## What's next

**0.81** — Pricing and account tiers. We're finalizing Cloudflare billing integration before we commit to exact numbers, but we're targeting a base tier that costs less than a coffee. Early access subscribers will get a significant discount that locks in for the life of their account.

**0.82** — Clerk removal, AI threat list GA, natural language rule builder (beta).

**0.83** — Self-hosted deployment guide for Pi-hole and AdGuard Home integration, DNS-over-HTTPS endpoint.

---

The full changelog is at [bloqr.ai/changelog](/changelog). If you're running into anything, open an issue on [GitHub](https://github.com/jaypatrick/adblock-compiler).
