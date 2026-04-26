/**
 * src/services/emailSchemas.ts — Centralized Zod schemas for email types
 *
 * All email-related Zod schemas live here so they can be shared across:
 *   - src/services/emailService.ts  (runtime validation)
 *   - functions/admin/email.ts      (API request validation)
 *   - scripts/send-test-email.ts    (CLI validation)
 *   - tests                         (schema-based test fixtures)
 *
 * Every schema produces a TypeScript type via `z.infer<>`. Import the type
 * alongside the schema from this module — never duplicate type definitions.
 */

import { z } from 'zod';

// ─── Core email payload ───────────────────────────────────────────────────────

/**
 * The minimum payload required to send a transactional email.
 * Validated at the trust boundary before any send attempt.
 *
 * @bloqr.dev reply-to address mapping:
 *   hello@bloqr.dev        — waitlist confirmations, general contact
 *   support@bloqr.dev      — compilation complete notifications, app support
 *   sales@bloqr.dev        — upgrade/sales flows
 *   news@bloqr.dev         — newsletter sends
 *   noreply@bloqr.dev      — system notifications (omit replyTo entirely)
 *   admin@bloqr.dev        — internal admin alerts
 *   abuse@bloqr.dev        — abuse reports
 */
export const EmailPayloadSchema = z.object({
  /** Recipient email address. Must be a valid RFC 5322 address. */
  to:      z.string().email('Recipient must be a valid email address'),
  /** Email subject line. Must be non-empty. */
  subject: z.string().min(1, 'Subject is required'),
  /** Full HTML body of the email. Must be non-empty. */
  html:    z.string().min(1, 'HTML body is required'),
  /** Plain-text fallback body. Must be non-empty. */
  text:    z.string().min(1, 'Text body is required'),
  /**
   * Optional Reply-To address. When set, email clients direct replies here
   * instead of the From address.  Use to route replies to the correct
   * @bloqr.dev alias (e.g. hello@, support@, sales@).
   *
   * Must be a valid RFC 5322 address or display-name qualified address,
   * e.g. `"Bloqr Support <support@bloqr.dev>"`.
   *
   * Header injection characters (CR, LF) are stripped at the service layer
   * before the value is inserted into the raw MIME message.
   */
  replyTo: z.string().min(1).optional(),
});

export type EmailPayload = z.infer<typeof EmailPayloadSchema>;

// ─── Available template names ─────────────────────────────────────────────────

/**
 * Registry of all available email templates.
 * Add a new entry here whenever a new template is created under
 * src/email/templates/. The admin preview endpoint and CLI use this
 * enum to validate the `template` parameter.
 */
export const EmailTemplateNameSchema = z.enum(['waitlistWelcome']);

export type EmailTemplateName = z.infer<typeof EmailTemplateNameSchema>;

// ─── Template render inputs ───────────────────────────────────────────────────

/**
 * Input parameters for the `waitlistWelcome` template.
 * Passed to `renderWaitlistWelcome(email, segment)`.
 */
export const WaitlistWelcomeParamsSchema = z.object({
  /** Recipient email address — embedded in the footer of the email. */
  email:   z.string().email(),
  /**
   * Signup segment — controls the personalised body line.
   * @see `SEGMENT_LABELS` in waitlistWelcome.ts
   */
  segment: z.enum(['list-maker', 'privacy-vendor', 'individual']).nullable(),
});

export type WaitlistWelcomeParams = z.infer<typeof WaitlistWelcomeParamsSchema>;

// ─── Admin API schemas ────────────────────────────────────────────────────────

/**
 * Request body for `POST /admin/email/send-test`.
 * Sends a rendered template to a real email address.
 * Requires admin authentication.
 */
export const SendTestEmailBodySchema = z.object({
  /** Email address to deliver the test email to. */
  to:       z.string().email('Must be a valid recipient email address'),
  /** Template to render and send. */
  template: EmailTemplateNameSchema,
  /**
   * Template-specific parameters as a free-form object.
   * Each template handler validates this further using its own schema.
   */
  params:   z.record(z.string(), z.unknown()).optional(),
});

export type SendTestEmailBody = z.infer<typeof SendTestEmailBodySchema>;

/**
 * Query params for `GET /admin/email/preview?template=&email=&segment=`.
 * Returns rendered HTML and plain-text bodies without sending.
 */
export const PreviewEmailQuerySchema = z.object({
  /** Template to render. */
  template: EmailTemplateNameSchema,
  /** Email address embedded in the template body/footer. */
  email:    z.string().email().optional().default('preview@example.com'),
  /**
   * Segment override for segment-personalised templates
   * (e.g. waitlistWelcome). Pass `null` / omit for the generic variant.
   */
  segment:  z.enum(['list-maker', 'privacy-vendor', 'individual']).nullable().optional().default(null),
});

export type PreviewEmailQuery = z.infer<typeof PreviewEmailQuerySchema>;
