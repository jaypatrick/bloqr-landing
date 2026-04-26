# MTA-STS DNS Setup for bloqr.dev

These records must be added in the Cloudflare DNS dashboard for the `bloqr.dev` zone.

## Required DNS Records

| Type  | Name         | Content                                                       | TTL  | Proxy    |
|-------|--------------|---------------------------------------------------------------|------|----------|
| TXT   | `_mta-sts`   | `v=STSv1; id=20190425085700`                                  | Auto | DNS only |
| TXT   | `_smtp._tls` | `v=TLSRPTv1; rua=mailto:smtp-tls-reports@bloqr.dev;`          | Auto | DNS only |
| CNAME | `mta-sts`    | `adblock-landing.jk-com.workers.dev`                          | Auto | Proxied  |

## Notes

- Update `id=` in the `_mta-sts` TXT record any time the policy file changes (use a
  new timestamp in `YYYYMMDDHHmmss` format, e.g. `id=20260426154700`).
- The `mta-sts` CNAME must be **proxied** (orange cloud) so Cloudflare terminates TLS
  and the Worker serves the policy over HTTPS — a requirement of RFC 8461.
- The MTA-STS policy is served by `src/worker.ts` when the request hostname is
  `mta-sts.bloqr.dev` and the path is `/.well-known/mta-sts.txt`.
  The handler is in `functions/mta-sts.ts`.
- Once the policy is verified as working (use the
  [Google MTA-STS Diagnostic Tool](https://toolbox.googleapps.com/apps/checkmx/)),
  change `mode: testing` to `mode: enforce` in `functions/mta-sts.ts` and bump the
  `id` timestamp in the `_mta-sts` TXT record.
- No authentication is required on `/.well-known/mta-sts.txt` — it is a public,
  read-only endpoint per RFC 8461.
