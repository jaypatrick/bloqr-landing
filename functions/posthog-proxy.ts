/**
 * functions/posthog-proxy.ts
 *
 * Reverse-proxy handler for PostHog analytics (US instance, project 376331).
 *
 * Supports two proxy modes:
 *
 *   Subdomain proxy (preferred) — f.bloqr.dev:
 *     f.bloqr.dev/static/*  →  https://us-assets.posthog.com/static/*
 *     f.bloqr.dev/array/*   →  https://us-assets.posthog.com/array/*
 *     f.bloqr.dev/*         →  https://us.i.posthog.com/*
 *
 *   Path proxy (legacy fallback) — bloqr.dev/ingest:
 *     /ingest/static/*      →  https://us-assets.posthog.com/static/*
 *     /ingest/array/*       →  https://us-assets.posthog.com/array/*
 *     /ingest/*             →  https://us.i.posthog.com/*
 *
 * Why: proxying PostHog through the site's own origin prevents
 * ad-blocker interference and keeps analytics calls first-party.
 *
 * @see https://posthog.com/docs/advanced/proxy/cloudflare
 */

const POSTHOG_INGEST_HOST  = 'us.i.posthog.com';
const POSTHOG_ASSETS_HOST  = 'us-assets.posthog.com';
const POSTHOG_PROXY_DOMAIN = 'f.bloqr.dev';

/**
 * Proxy a request to the appropriate PostHog upstream.
 *
 * Handles both the subdomain proxy (f.bloqr.dev) and the legacy path proxy
 * (bloqr.dev/ingest). The subdomain form is preferred — PostHog.astro sends
 * all traffic to https://f.bloqr.dev.
 */
export async function handlePostHogProxy(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const isSubdomain = url.hostname === POSTHOG_PROXY_DOMAIN;

  // Determine whether the request is for a static asset (JS snippet / sourcemaps / toolbar bundle).
  // Subdomain: /static/* or /array/*  →  us-assets.posthog.com
  // Path:      /ingest/static/* or /ingest/array/*  →  us-assets.posthog.com
  const isStaticAsset = isSubdomain
    ? url.pathname.startsWith('/static/') || url.pathname.startsWith('/array/')
    : url.pathname.startsWith('/ingest/static/') || url.pathname.startsWith('/ingest/array/');

  const upstreamHost = isStaticAsset ? POSTHOG_ASSETS_HOST : POSTHOG_INGEST_HOST;

  // Rewrite the path to strip the proxy prefix.
  // Subdomain: path is already correct — forward as-is.
  // Path:      strip the /ingest prefix before forwarding.
  const upstreamPath = isSubdomain
    ? (url.pathname || '/')
    : (url.pathname.replace(/^\/ingest/, '') || '/');

  const upstreamUrl = new URL(upstreamPath + url.search, `https://${upstreamHost}`);

  // Forward the request with a rewritten Host header so PostHog accepts it.
  // Strip sensitive headers that must not be leaked to a third-party upstream.
  // Because the proxy is same-origin (or a dedicated subdomain), browsers attach
  // site cookies and any Authorization / CF Access tokens automatically.
  const proxyHeaders = new Headers(request.headers);
  proxyHeaders.delete('cookie');
  proxyHeaders.delete('authorization');
  // Strip Cloudflare Access / JWT identity headers
  proxyHeaders.delete('cf-access-jwt-assertion');
  proxyHeaders.delete('cf-access-client-id');
  proxyHeaders.delete('cf-access-client-secret');
  proxyHeaders.set('host', upstreamHost);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  // Buffer the body rather than streaming — avoids the Node.js `duplex: 'half'`
  // requirement while remaining safe for PostHog's small analytics payloads.
  const proxyBody = hasBody ? await request.arrayBuffer() : null;

  const proxyRequest = new Request(upstreamUrl.toString(), {
    method:   request.method,
    headers:  proxyHeaders,
    body:     proxyBody,
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
