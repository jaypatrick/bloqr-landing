/**
 * functions/admin/email.ts — GET/POST/PUT/DELETE/OPTIONS /admin/email/* handlers
 *
 * Admin-only API for email configuration, template management, send logs,
 * template previewing, and test sends.
 * Auth: Better Auth session (primary) or legacy ADMIN_SECRET bearer token (fallback).
 *
 * Routes handled here (wired in src/worker.ts):
 *
 *   GET  /admin/email/status
 *        Returns the current email configuration status — which env vars are
 *        present, which send strategy will be used, and pipeline strategy.
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
 *   GET  /admin/email/logs
 *        Lists recent email delivery attempts from the D1 `email_sends` table.
 *        Supports query params: limit, after_id, status, template, to.
 *        Requires EMAIL_DB binding.
 *
 *   GET  /admin/email/templates
 *        Lists all available templates with their current custom/default state
 *        from the D1 `email_templates` table.  Requires EMAIL_DB binding.
 *
 *   PUT  /admin/email/templates
 *        Creates or updates a custom template override in D1.
 *        Body: { name: string; subject: string; html: string; text: string }
 *
 *   DELETE /admin/email/templates/:name
 *        Removes a custom template override, restoring the compiled default.
 *
 *   OPTIONS /admin/email/*
 *        CORS preflight.
 *
 * All mutating endpoints require admin authentication.
 * The preview, status, logs, and templates endpoints are admin-only too.
 *
 * Exported as plain functions for import by src/worker.ts.
 */

import { z, ZodError } from 'zod';
import type { AuthEnv } from '../../src/lib/auth';
import { isAuthConfigured, isAuthorized } from './_auth-guard';
import { createEmailService } from '../../src/services/emailService';
import { renderWaitlistWelcome } from '../../src/email/templates/waitlistWelcome';
import {
  SendTestEmailBodySchema,
  PreviewEmailQuerySchema,
  EmailTemplateNameSchema,
  WaitlistWelcomeParamsSchema,
  type EmailTemplateName,
  type EmailPayload,
} from '../../src/services/emailSchemas';
import {
  listEmailSends,
  listEmailTemplates,
  upsertEmailTemplate,
  deleteEmailTemplate,
  type ListEmailSendsOptions,
} from '../../src/db/emailDb';

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
  /** D1 database for email delivery log and custom template store. */
  EMAIL_DB?: D1Database;
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

/**
 * Maps template names to per-template Zod schemas for validating the `params`
 * field on send-test and preview requests.
 *
 * Validation happens before rendering so bad params return a 400 rather than
 * producing a silently malformed email.  Defaults are supplied by the caller
 * before parsing (e.g. `email` defaults to the `to` recipient).
 *
 * To add a new template: export a params schema from `src/services/emailSchemas.ts`
 * and add an entry here.
 */
const PARAMS_SCHEMA_REGISTRY: Record<EmailTemplateName, z.ZodTypeAny> = {
  waitlistWelcome: WaitlistWelcomeParamsSchema,
};

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
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
      EMAIL_DB:             !!env.EMAIL_DB,
    },
    /** The delivery strategy used for outbound email. */
    sendStrategy: strategy,
    /** The overall email pipeline strategy. */
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

  const renderFn      = TEMPLATE_REGISTRY[parsed.template];
  const paramsSchema  = PARAMS_SCHEMA_REGISTRY[parsed.template];

  // Validate template-specific params, defaulting `email` to the recipient and
  // `segment` to null so callers need only provide non-default overrides.
  let templateParams: Record<string, unknown>;
  try {
    templateParams = paramsSchema.parse({
      email:   parsed.to, // use recipient as the default footer email
      segment: null,
      ...parsed.params,
    });
  } catch (err) {
    if (err instanceof ZodError) {
      return json({ error: 'Invalid template params.', details: err.issues }, 400);
    }
    throw err;
  }

  const { subject, html, text } = renderFn(templateParams);

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

// ─── GET /admin/email/logs ────────────────────────────────────────────────────

/**
 * Lists recent email delivery attempts from the D1 `email_sends` table.
 *
 * Query params (all optional):
 *   - `limit`    — max rows to return (1–200, default 50)
 *   - `after_id` — row id for cursor-based pagination (exclusive)
 *   - `status`   — filter by delivery status (sent|failed|stale|deduplicated|invalid)
 *   - `template` — filter by template name (e.g. waitlistWelcome)
 *   - `to`       — filter by recipient email address
 *
 * Requires `EMAIL_DB` to be configured.
 */
export async function handleEmailLogs(request: Request, env: Env): Promise<Response> {
  if (!isAuthConfigured(env)) {
    return json({ error: 'Admin access is not configured.' }, 503);
  }
  if (!(await isAuthorized(request, env))) {
    return json({ error: 'Forbidden.' }, 403);
  }

  if (!env.EMAIL_DB) {
    return json(
      {
        error:    'EMAIL_DB is not configured.',
        hint:     'Run scripts/setup-d1-email.sh and uncomment the [[d1_databases]] block for bloqr-email in wrangler.toml.',
        rows:     [],
        total:    0,
      },
      503,
    );
  }

  const url      = new URL(request.url);
  const limitStr = url.searchParams.get('limit');
  const afterStr = url.searchParams.get('after_id');

  const EmailLogsQuerySchema = z.object({
    status: z.enum(['sent', 'failed', 'stale', 'deduplicated', 'invalid']).optional(),
  });

  let validatedQuery: z.infer<typeof EmailLogsQuerySchema>;
  try {
    validatedQuery = EmailLogsQuerySchema.parse({
      status: url.searchParams.get('status') ?? undefined,
    });
  } catch (err: unknown) {
    if (err instanceof ZodError) {
      return json({ error: 'Invalid query parameters.', details: err.issues }, 400);
    }
    throw err;
  }

  // Clamp limit to the safe range enforced by listEmailSends (1..200).
  const clampedLimit = limitStr ? Math.max(1, Math.min(parseInt(limitStr, 10) || 50, 200)) : 50;

  const options: ListEmailSendsOptions = {
    limit:    clampedLimit,
    afterId:  afterStr ? parseInt(afterStr, 10) || undefined : undefined,
    status:   validatedQuery.status,
    template: url.searchParams.get('template') ?? undefined,
    to:       url.searchParams.get('to') ?? undefined,
  };

  const rows = await listEmailSends(env.EMAIL_DB, options);
  // Only set a cursor when the full page was returned — meaning there may be more rows.
  const nextCursor = rows.length === clampedLimit && rows.length > 0
    ? rows[rows.length - 1]!.id
    : null;

  return json({
    rows,
    total:      rows.length,
    nextCursor,
  });
}

// ─── GET /admin/email/templates ───────────────────────────────────────────────

/**
 * Lists all email templates with their current custom/default state.
 * Requires `EMAIL_DB` to be configured.
 */
export async function handleListTemplates(request: Request, env: Env): Promise<Response> {
  if (!isAuthConfigured(env)) {
    return json({ error: 'Admin access is not configured.' }, 503);
  }
  if (!(await isAuthorized(request, env))) {
    return json({ error: 'Forbidden.' }, 403);
  }

  if (!env.EMAIL_DB) {
    return json(
      {
        error:     'EMAIL_DB is not configured.',
        hint:      'Run scripts/setup-d1-email.sh and uncomment the [[d1_databases]] block for bloqr-email in wrangler.toml.',
        templates: [],
      },
      503,
    );
  }

  const templates = await listEmailTemplates(env.EMAIL_DB);
  return json({ templates, total: templates.length });
}

// ─── Upsert template body schema ──────────────────────────────────────────────

const UpsertTemplateBodySchema = z.object({
  /**
   * Template name — must match a registered entry in `EmailTemplateNameSchema`.
   * Using the enum here prevents saving overrides for templates that don't exist,
   * which would silently be ignored by the consumer/preview paths.
   */
  name:    EmailTemplateNameSchema,
  /** Email subject line (non-empty). */
  subject: z.string().min(1),
  /** Full HTML body (non-empty). Supports {{email}} and {{site_url}} placeholders. */
  html:    z.string().min(1),
  /** Plain-text fallback body (non-empty). */
  text:    z.string().min(1),
});

// ─── PUT /admin/email/templates ───────────────────────────────────────────────

/**
 * Creates or updates a custom template override in D1.
 * The queue consumer will use this override for the given template name.
 *
 * Request body (JSON):
 *   { name: string; subject: string; html: string; text: string }
 *
 * Requires `EMAIL_DB` to be configured.
 */
export async function handleUpsertTemplate(request: Request, env: Env): Promise<Response> {
  if (!isAuthConfigured(env)) {
    return json({ error: 'Admin access is not configured.' }, 503);
  }
  if (!(await isAuthorized(request, env))) {
    return json({ error: 'Forbidden.' }, 403);
  }

  if (!env.EMAIL_DB) {
    return json(
      {
        error: 'EMAIL_DB is not configured.',
        hint:  'Run scripts/setup-d1-email.sh and uncomment the [[d1_databases]] block for bloqr-email in wrangler.toml.',
      },
      503,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON.' }, 400);
  }

  let parsed: ReturnType<typeof UpsertTemplateBodySchema.parse>;
  try {
    parsed = UpsertTemplateBodySchema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return json({ error: 'Validation failed.', details: err.issues }, 400);
    }
    throw err;
  }

  const ok = await upsertEmailTemplate(env.EMAIL_DB, {
    name:    parsed.name,
    subject: parsed.subject,
    html:    parsed.html,
    text:    parsed.text,
  });

  if (!ok) {
    return json({ error: 'Failed to save template override. Check Worker logs for details.' }, 500);
  }

  return json({
    success:  true,
    name:     parsed.name,
    message:  `Template "${parsed.name}" saved. The queue consumer will use this version on next delivery.`,
  });
}

// ─── DELETE /admin/email/templates/:name ──────────────────────────────────────

/**
 * Removes a custom template override from D1, restoring the compiled default.
 * The `name` is read from the URL path: `/admin/email/templates/<name>`.
 *
 * Requires `EMAIL_DB` to be configured.
 */
export async function handleDeleteTemplate(request: Request, env: Env): Promise<Response> {
  if (!isAuthConfigured(env)) {
    return json({ error: 'Admin access is not configured.' }, 503);
  }
  if (!(await isAuthorized(request, env))) {
    return json({ error: 'Forbidden.' }, 403);
  }

  if (!env.EMAIL_DB) {
    return json(
      {
        error: 'EMAIL_DB is not configured.',
        hint:  'Run scripts/setup-d1-email.sh and uncomment the [[d1_databases]] block for bloqr-email in wrangler.toml.',
      },
      503,
    );
  }

  const url  = new URL(request.url);
  // Path: /admin/email/templates/<name>
  const name = url.pathname.split('/').pop();
  if (!name || name.trim() === '') {
    return json({ error: 'Template name is required in the URL path.' }, 400);
  }

  const ok = await deleteEmailTemplate(env.EMAIL_DB, name);
  if (!ok) {
    return json({ error: 'Failed to delete template override. Check Worker logs for details.' }, 500);
  }

  return json({
    success: true,
    name,
    message: `Custom override for "${name}" removed. Compiled default will be used on next delivery.`,
  });
}
