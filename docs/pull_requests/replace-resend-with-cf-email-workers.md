title: feat: replace resend + MailChannels with native CF Email Workers binding

Removes `resend` and `MailChannelsStrategy` in favour of the native Cloudflare
Email Workers binding (`cloudflare:email`). No third-party API keys are needed;
Cloudflare Email Routing handles DKIM/SPF automatically.

## What changed

- **`CfEmailSendingStrategy`** — new default delivery path via the `SEND_EMAIL`
  Workers binding (`cloudflare:email`). Builds a raw multipart/alternative MIME
  message, RFC 2047-encodes non-ASCII subjects, and calls `env.SEND_EMAIL.send()`.
- **`NullEmailStrategy`** — no-op fallback that logs a warning when email is
  dropped because no binding is configured (replaces the implicit MailChannels
  fallback used in local dev / CI).
- **`ServiceBindingStrategy`** — unchanged; still preferred when the `EMAIL_WORKER`
  (adblock-email) service binding is present.
- `resend` npm package removed.
- `RESEND_API_KEY`, `DKIM_DOMAIN`, `DKIM_SELECTOR`, `DKIM_PRIVATE_KEY` removed
  from all env interfaces, `wrangler.toml`, and `.dev.vars.example`.
- `FROM_EMAIL` promoted to `wrangler.toml [vars]` (was previously only in `.dev.vars`).
- `[[send_email]]` binding activated in `wrangler.toml`.
- `strategy` column union in `email_sends` updated:
  `resend`/`mailchannels` → `cf-email-sending`/`null`.

## Post-merge configuration

### 1. Enable Cloudflare Email Routing on `bloqr.dev`

If not already done:

1. **Cloudflare dashboard → Email → Email Routing → Enable**
2. Verify the sending domain (`bloqr.dev` or `bloqr.app`) — CF will add the
   required MX and SPF records automatically.
3. Add the address used in `FROM_EMAIL` (`hello@bloqr.dev`) as a **destination
   address** and verify it.

No DKIM keys or external DNS records need to be added manually.

### 2. Confirm `FROM_EMAIL` is correct in `wrangler.toml [vars]`

```toml
FROM_EMAIL = "Bloqr <hello@bloqr.dev>"
```

This is a plain var (not a secret). Change it by editing `wrangler.toml` and
deploying — do **not** use the Cloudflare dashboard to set it (that would create
an asset-less Worker version).

### 3. Secrets to revoke (no longer needed)

The following Worker Secrets are now unused and can be removed from the
Cloudflare dashboard → Workers → adblock-landing → Settings:

| Secret | Status |
|---|---|
| `RESEND_API_KEY` | **Remove** — ResendStrategy deleted |
| `DKIM_DOMAIN` | **Remove** — DKIM handled by CF Email Routing |
| `DKIM_SELECTOR` | **Remove** — DKIM handled by CF Email Routing |
| `DKIM_PRIVATE_KEY` | **Remove** — DKIM handled by CF Email Routing |

### 4. Optional — wire the adblock-email service binding

If you want `ServiceBindingStrategy` to handle delivery instead of
`CfEmailSendingStrategy`, uncomment the `[[services]]` block in `wrangler.toml`:

```toml
[[services]]
binding = "EMAIL_WORKER"
service = "adblock-email"
```

This takes priority automatically; no code changes are needed.

### 5. D1 schema note

The `strategy` column in `email_sends` now stores `'cf-email-sending'` or
`'null'` instead of `'resend'` / `'mailchannels'`. Existing rows are unaffected.
No migration is required — the union type change is code-only.
