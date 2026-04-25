/**
 * functions/admin/email.ts — GET/POST/OPTIONS /admin/email/* handlers
 *
 * Admin-only API for email template previewing and test sends.
 * Auth: Better Auth session (primary) or legacy ADMIN_SECRET bearer token (fallback).
 *
 * Routes handled here (wired in src/worker.ts):
 *
 *   GET  /admin/email/preview?template=&email=&segment=
 *        Returns the rendered HTML and plain-text bodies for a template without
 *        sending.  Useful for verifying template output before enabling live sends.
 *        No FROM_EMAIL required.
 *
 *   POST /admin/email/send-test
 *        Renders a template and delivers it to a real email address via
 *        createEmailService(env).  Requires FROM_EMAIL to be configured.
 *
 *   GET  /admin/email/status
 *        Returns the current email configuration status — which env vars are
 *        present, which send strategy will be used.  Safe to call at any time.
 *
 *   OPTIONS /admin/email/*
 *        CORS preflight.
 *
 * All mutating endpoints require admin authentication.
 * The preview and status endpoints are admin-only too (they reveal config state).
 *
 * Exported as plain functions for import by src/worker.ts.
 */

import { ZodError } from 'zod';
import type { AuthEnv } from '../../src/lib/auth';
import { isAuthConfigured, isAuthorized } from './_auth-guard';
import { createEmailService } from '../../src/services/emailService';
import { renderWaitlistWelcome } from '../../src/email/templates/waitlistWelcome';
import {
  SendTestEmailBodySchema,
  PreviewEmailQuerySchema,
  type EmailTemplateName,
  type EmailPayload,
} from '../../src/services/emailSchemas';

// ─── Env ──────────────────────────────────────────────────────────────────────

export interface Env extends AuthEnv {
  DATABASE_URL?: string;
  FROM_EMAIL?:        string;
  DKIM_DOMAIN?:       string;
  DKIM_SELECTOR?:     string;
  DKIM_PRIVATE_KEY?:  string;
  /** Service binding to the `adblock-email` Cloudflare Worker. */
  EMAIL_WORKER?: Fetcher;
  /** Cloudflare Queue producer binding for durable email delivery. */
  EMAIL_QUEUE?: Queue<unknown>;
  /** Cloudflare Workflow binding for durable post-signup orchestration. */
  WAITLIST_WORKFLOW?: Workflow;
  /** Analytics Engine dataset for email event tracking. */
  ANALYTICS?: AnalyticsEngineDataset;
  /** KV namespace for email deduplication. */
  EMAIL_DEDUP_KV?: KVNamespace;
}

// ─── Template registry ────────────────────────────────────────────────────────

/**
 * Maps template names to their render functions.
 *
 * To add a new template:
 *   1. Create `src/email/templates/<name>.ts` exporting a render function.
 *   2. Import it here and add an entry.
 *   3. Add the name to `EmailTemplateNameSchema` in `src/services/emailSchemas.ts`.
 */
const TEMPLATE_REGISTRY: Record<
  EmailTemplateName,
  (params: Record<string, unknown>) => { subject: string; html: string; text: string }
> = {
  waitlistWelcome: (params) => {
    const email = typeof params['email'] === 'string' ? params['email'] : 'preview@example.com';
    const segment = typeof params['segment'] === 'string' ? params['segment'] : null;
    return renderWaitlistWelcome(email, segment);
  },};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type':  'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
  });

// ─── CORS preflight ───────────────────────────────────────────────────────────

export function handleOptions(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// ─── GET /admin/email/status ──────────────────────────────────────────────────

/**
 * Returns the current email configuration state.
 * Does NOT reveal secret values — only reports presence/absence.
 */
export async function handleStatus(request: Request, env: Env): Promise<Response> {
  if (!isAuthConfigured(env)) {
    return json({ error: 'Admin access is not configured.' }, 503);
  }
  if (!(await isAuthorized(request, env))) {
    return json({ error: 'Forbidden.' }, 403);
  }

  const strategy = env.EMAIL_WORKER
    ? 'service-binding (adblock-email)'
    : 'mailchannels-direct';

  // Determine the active email pipeline strategy
  const pipeline = env.WAITLIST_WORKFLOW
    ? 'workflow → queue → send'
    : env.EMAIL_QUEUE
      ? 'queue → send'
      : 'direct-send';

  return json({
    configured: {
      FROM_EMAIL:           !!env.FROM_EMAIL,
      DKIM_DOMAIN:          !!env.DKIM_DOMAIN,
      DKIM_SELECTOR:        !!env.DKIM_SELECTOR,
      DKIM_PRIVATE_KEY:     !!env.DKIM_PRIVATE_KEY,
      EMAIL_WORKER:         !!env.EMAIL_WORKER,
      EMAIL_QUEUE:          !!env.EMAIL_QUEUE,
      WAITLIST_WORKFLOW:    !!env.WAITLIST_WORKFLOW,
      ANALYTICS:            !!env.ANALYTICS,
      EMAIL_DEDUP_KV:       !!env.EMAIL_DEDUP_KV,
    },
    /**
     * The delivery strategy used for outbound email.
     * One of: 'service-binding (adblock-email)' | 'mailchannels-direct'
     */
    sendStrategy: strategy,
    /**
     * The overall email pipeline: how the confirmation email flows from the
     * waitlist signup to the recipient's inbox.
     * One of: 'workflow → queue → send' | 'queue → send' | 'direct-send'
     */
    pipelineStrategy: pipeline,
    /**
     * Whether the service is ready to send emails.
     * True when at least FROM_EMAIL is set.
     */
    ready: !!env.FROM_EMAIL,
    availableTemplates: Object.keys(TEMPLATE_REGISTRY),
  });
}

// ─── GET /admin/email/preview ─────────────────────────────────────────────────

/**
 * Renders a template and returns the HTML and text bodies without sending.
 * Query params: `template`, `email` (optional), `segment` (optional).
 */
export async function handlePreview(request: Request, env: Env): Promise<Response> {
  if (!isAuthConfigured(env)) {
    return json({ error: 'Admin access is not configured.' }, 503);
  }
  if (!(await isAuthorized(request, env))) {
    return json({ error: 'Forbidden.' }, 403);
  }

  const url = new URL(request.url);
  const rawParams = {
    template: url.searchParams.get('template') ?? undefined,
    email:    url.searchParams.get('email')    ?? undefined,
    segment:  url.searchParams.get('segment')  ?? null,
  };

  let params: ReturnType<typeof PreviewEmailQuerySchema.parse>;
  try {
    params = PreviewEmailQuerySchema.parse(rawParams);
  } catch (err) {
    if (err instanceof ZodError) {
      return json({ error: 'Invalid query params.', details: err.issues }, 400);
    }
    throw err;
  }

  const renderFn = TEMPLATE_REGISTRY[params.template];
  const { subject, html, text } = renderFn({
    email:   params.email,
    segment: params.segment,
  });

  return json({ template: params.template, subject, html, text });
}

// ─── POST /admin/email/send-test ──────────────────────────────────────────────

/**
 * Renders a template and sends it to the provided `to` address.
 * Requires FROM_EMAIL to be configured in the Worker environment.
 *
 * Request body (JSON):
 *   { to: string; template: EmailTemplateName; params?: Record<string, unknown> }
 */
export async function handleSendTest(request: Request, env: Env): Promise<Response> {
  if (!isAuthConfigured(env)) {
    return json({ error: 'Admin access is not configured.' }, 503);
  }
  if (!(await isAuthorized(request, env))) {
    return json({ error: 'Forbidden.' }, 403);
  }

  if (!env.FROM_EMAIL) {
    return json(
      { error: 'FROM_EMAIL is not configured. Set it in wrangler.toml [vars] and redeploy.' },
      503,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  let parsed: ReturnType<typeof SendTestEmailBodySchema.parse>;
  try {
    parsed = SendTestEmailBodySchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return json({ error: 'Validation failed.', details: err.issues }, 400);
    }
    throw err;
  }

  const renderFn = TEMPLATE_REGISTRY[parsed.template];
  const { subject, html, text } = renderFn(parsed.params ?? {});

  const payload: EmailPayload = { to: parsed.to, subject, html, text };

  try {
    await createEmailService({
      FROM_EMAIL:      env.FROM_EMAIL,
      DKIM_DOMAIN:     env.DKIM_DOMAIN,
      DKIM_SELECTOR:   env.DKIM_SELECTOR,
      DKIM_PRIVATE_KEY: env.DKIM_PRIVATE_KEY,
      EMAIL_WORKER:    env.EMAIL_WORKER,
    }).sendEmail(payload);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('POST /admin/email/send-test error:', message);
    return json({ error: `Failed to send test email: ${message}` }, 500);
  }

  const strategy = env.EMAIL_WORKER ? 'service-binding (adblock-email)' : 'mailchannels-direct';
  return json({
    success:  true,
    to:       parsed.to,
    template: parsed.template,
    subject,
    strategy,
  });
}
