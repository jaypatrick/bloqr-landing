/**
 * functions/mta-sts.ts — GET /.well-known/mta-sts.txt handler
 *
 * Serves the MTA-STS policy document for the mta-sts.bloqr.dev subdomain
 * as required by RFC 8461.
 *
 * Exported as a plain function for import by src/worker.ts.
 */

export function handleMtaStsPolicy(): Response {
  const policy = [
    'version: STSv1',
    'mode: testing',
    'mx: aspmx.l.google.com',
    'mx: alt3.aspmx.l.google.com',
    'mx: alt4.aspmx.l.google.com',
    'mx: alt1.aspmx.l.google.com',
    'mx: alt2.aspmx.l.google.com',
    'max_age: 604800',
  ].join('\n');

  return new Response(policy, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
