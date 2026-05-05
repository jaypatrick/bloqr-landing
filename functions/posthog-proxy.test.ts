/**
 * functions/posthog-proxy.test.ts — Unit tests for the PostHog reverse proxy handler.
 *
 * Tests verify:
 *   1. URL rewrite — /ingest prefix is stripped; static assets route to us-assets.posthog.com
 *   2. Sensitive header stripping — cookie, authorization, CF Access headers are not forwarded
 *   3. Hop-by-hop response header removal — connection and transfer-encoding are stripped
 *   4. Request body forwarding — POST body is passed through; GET has no body
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { handlePostHogProxy } from './posthog-proxy';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(
  path: string,
  options: { method?: string; headers?: Record<string, string>; body?: string; host?: string } = {},
): Request {
  const host = options.host ?? 'bloqr.dev';
  return new Request(`https://${host}${path}`, {
    method:  options.method ?? 'GET',
    headers: options.headers ?? {},
    body:    options.body ?? null,
  });
}

function makeUpstreamResponse(
  options: { status?: number; headers?: Record<string, string>; body?: string } = {},
): Response {
  return new Response(options.body ?? null, {
    status:  options.status ?? 200,
    headers: options.headers ?? {},
  });
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('handlePostHogProxy', () => {
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchSpy = vi.fn().mockResolvedValue(makeUpstreamResponse());
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── URL rewrite ─────────────────────────────────────────────────────────────

  describe('URL rewrite', () => {
    it('routes /ingest/* to us.i.posthog.com and strips /ingest prefix', async () => {
      await handlePostHogProxy(makeRequest('/ingest/e/?v=1'));

      const forwarded = fetchSpy.mock.calls[0][0] as Request;
      const url = new URL(forwarded.url);
      expect(url.hostname).toBe('us.i.posthog.com');
      expect(url.pathname).toBe('/e/');
      expect(url.search).toBe('?v=1');
    });

    it('routes /ingest/static/* to us-assets.posthog.com and strips /ingest prefix', async () => {
      await handlePostHogProxy(makeRequest('/ingest/static/array.js'));

      const forwarded = fetchSpy.mock.calls[0][0] as Request;
      const url = new URL(forwarded.url);
      expect(url.hostname).toBe('us-assets.posthog.com');
      expect(url.pathname).toBe('/static/array.js');
    });

    it('routes /ingest/array/* to us-assets.posthog.com and strips /ingest prefix', async () => {
      await handlePostHogProxy(makeRequest('/ingest/array/toolbar.js'));

      const forwarded = fetchSpy.mock.calls[0][0] as Request;
      const url = new URL(forwarded.url);
      expect(url.hostname).toBe('us-assets.posthog.com');
      expect(url.pathname).toBe('/array/toolbar.js');
    });

    it('routes subdomain /array/toolbar.js to us-assets.posthog.com with path preserved', async () => {
      await handlePostHogProxy(makeRequest('/array/toolbar.js', { host: 'f.bloqr.dev' }));

      const forwarded = fetchSpy.mock.calls[0][0] as Request;
      const url = new URL(forwarded.url);
      expect(url.hostname).toBe('us-assets.posthog.com');
      expect(url.pathname).toBe('/array/toolbar.js');
    });

    it('rewrites path to / when only /ingest is matched with no trailing path', async () => {
      await handlePostHogProxy(makeRequest('/ingest'));

      const forwarded = fetchSpy.mock.calls[0][0] as Request;
      const url = new URL(forwarded.url);
      expect(url.pathname).toBe('/');
    });

    it('sets the host header to the upstream hostname', async () => {
      await handlePostHogProxy(makeRequest('/ingest/e/'));

      const forwarded = fetchSpy.mock.calls[0][0] as Request;
      expect(forwarded.headers.get('host')).toBe('us.i.posthog.com');
    });

    it('sets the host header to us-assets.posthog.com for static assets', async () => {
      await handlePostHogProxy(makeRequest('/ingest/static/array.js'));

      const forwarded = fetchSpy.mock.calls[0][0] as Request;
      expect(forwarded.headers.get('host')).toBe('us-assets.posthog.com');
    });
  });

  // ── Sensitive header stripping ───────────────────────────────────────────────

  describe('sensitive header stripping', () => {
    const sensitiveHeaders: Record<string, string> = {
      cookie:                    'session=abc123; auth=token',
      authorization:             'Bearer secret-jwt',
      'cf-access-jwt-assertion': 'cf-access-token-value',
      'cf-access-client-id':     'client-id-value',
      'cf-access-client-secret': 'client-secret-value',
    };

    for (const [header, value] of Object.entries(sensitiveHeaders)) {
      it(`strips the ${header} header before forwarding`, async () => {
        await handlePostHogProxy(
          makeRequest('/ingest/e/', { headers: { [header]: value } }),
        );

        const forwarded = fetchSpy.mock.calls[0][0] as Request;
        expect(forwarded.headers.get(header)).toBeNull();
      });
    }

    it('forwards non-sensitive headers like content-type', async () => {
      await handlePostHogProxy(
        makeRequest('/ingest/e/', {
          method:  'POST',
          headers: { 'content-type': 'application/json' },
          body:    '{}',
        }),
      );

      const forwarded = fetchSpy.mock.calls[0][0] as Request;
      expect(forwarded.headers.get('content-type')).toBe('application/json');
    });
  });

  // ── Response hop-by-hop header removal ──────────────────────────────────────

  describe('response hop-by-hop header stripping', () => {
    it('removes connection header from the upstream response', async () => {
      fetchSpy.mockResolvedValue(
        makeUpstreamResponse({ headers: { connection: 'keep-alive' } }),
      );

      const response = await handlePostHogProxy(makeRequest('/ingest/e/'));
      expect(response.headers.get('connection')).toBeNull();
    });

    it('removes transfer-encoding header from the upstream response', async () => {
      fetchSpy.mockResolvedValue(
        makeUpstreamResponse({ headers: { 'transfer-encoding': 'chunked' } }),
      );

      const response = await handlePostHogProxy(makeRequest('/ingest/e/'));
      expect(response.headers.get('transfer-encoding')).toBeNull();
    });

    it('passes through other response headers unchanged', async () => {
      fetchSpy.mockResolvedValue(
        makeUpstreamResponse({ headers: { 'content-type': 'application/json' } }),
      );

      const response = await handlePostHogProxy(makeRequest('/ingest/e/'));
      expect(response.headers.get('content-type')).toBe('application/json');
    });
  });

  // ── Request body forwarding ──────────────────────────────────────────────────

  describe('request body forwarding', () => {
    it('passes POST body to the upstream', async () => {
      const body = JSON.stringify({ event: 'pageview' });
      await handlePostHogProxy(
        makeRequest('/ingest/e/', {
          method:  'POST',
          headers: { 'content-type': 'application/json' },
          body,
        }),
      );

      const forwarded = fetchSpy.mock.calls[0][0] as Request;
      expect(forwarded.method).toBe('POST');
      const forwardedBody = await forwarded.text();
      expect(forwardedBody).toBe(body);
    });

    it('sends no body for GET requests', async () => {
      await handlePostHogProxy(makeRequest('/ingest/e/'));

      const forwarded = fetchSpy.mock.calls[0][0] as Request;
      expect(forwarded.method).toBe('GET');
      expect(forwarded.body).toBeNull();
    });

    it('sends no body for HEAD requests', async () => {
      await handlePostHogProxy(makeRequest('/ingest/static/array.js', { method: 'HEAD' }));

      const forwarded = fetchSpy.mock.calls[0][0] as Request;
      expect(forwarded.body).toBeNull();
    });
  });

  // ── Response passthrough ─────────────────────────────────────────────────────

  describe('response passthrough', () => {
    it('passes the upstream status code through unchanged', async () => {
      fetchSpy.mockResolvedValue(makeUpstreamResponse({ status: 204 }));

      const response = await handlePostHogProxy(makeRequest('/ingest/e/'));
      expect(response.status).toBe(204);
    });

    it('passes a non-2xx upstream status through unchanged', async () => {
      fetchSpy.mockResolvedValue(makeUpstreamResponse({ status: 503 }));

      const response = await handlePostHogProxy(makeRequest('/ingest/e/'));
      expect(response.status).toBe(503);
    });
  });
});
