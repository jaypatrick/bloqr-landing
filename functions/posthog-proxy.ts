/**
 * functions/posthog-proxy.ts
 *
 * Reverse-proxy handler for PostHog analytics (US instance, project 376331).
 *
 * Routes (registered in src/worker.ts):
 *   /ingest/static/*  →  https://us-assets.posthog.com
 *   /ingest/*         →  https://us.i.posthog.com
 *
 * Why: proxying PostHog through the site's own origin prevents
 * ad-blocker interference and keeps analytics calls first-party.
 *
 * @see https://posthog.com/docs/advanced/proxy/cloudflare
 */

const POSTHOG_INGEST_HOST = 'us.i.posthog.com';
const POSTHOG_ASSETS_HOST = 'us-assets.posthog.com';

/**
 * Proxy a request to the appropriate PostHog upstream.
 *
 * - /ingest/static/* → us-assets.posthog.com  (JS snippet + sourcemaps)
 * - /ingest/*        → us.i.posthog.com        (event ingestion)
 */
export async function handlePostHogProxy(request: Request): Promise<Response> {
  const url = new URL(request.url);

  // Determine upstream host and rewrite the path.
  // Strip the /ingest prefix so the upstream receives the correct path.
  const isStaticAsset = url.pathname.startsWith('/ingest/static/');
  const upstreamHost  = isStaticAsset ? POSTHOG_ASSETS_HOST : POSTHOG_INGEST_HOST;

  const upstreamPath = url.pathname.replace(/^\/ingest/, '') || '/';
  const upstreamUrl  = new URL(upstreamPath + url.search, `https://${upstreamHost}`);

  // Forward the request with a rewritten Host header so PostHog accepts it.
  const proxyHeaders = new Headers(request.headers);
  proxyHeaders.set('host', upstreamHost);

  const proxyRequest = new Request(upstreamUrl.toString(), {
    method:  request.method,
    headers: proxyHeaders,
    body:    request.method !== 'GET' && request.method !== 'HEAD'
               ? request.body
               : null,
    redirect: 'follow',
  });

  const upstream = await fetch(proxyRequest);

  // Pass the response body and status through unchanged.
  // Strip hop-by-hop / connection headers that must not be forwarded.
  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('connection');
  responseHeaders.delete('transfer-encoding');

  return new Response(upstream.body, {
    status:     upstream.status,
    statusText: upstream.statusText,
    headers:    responseHeaders,
  });
}
