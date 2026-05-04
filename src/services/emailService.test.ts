/**
 * src/services/emailService.test.ts — Unit tests for EmailService
 *
 * All tests mock `env.SEND_EMAIL` or the `EMAIL_WORKER` Fetcher binding.
 * No real network requests are made in this suite.
 *
 * Test categories:
 *   1. EmailPayloadSchema — Zod validation edge cases
 *   2. ServiceBindingStrategy — bloqr-email service binding path
 *   3. CfEmailSendingStrategy — CF Email Workers binding path
 *   4. NullEmailStrategy — no-op fallback path
 *   5. EmailService.sendEmail — end-to-end validation + strategy delegation
 *   6. EmailService.sendWaitlistConfirmation — template rendering + send
 *   7. createEmailService factory — strategy selection
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import {
  EmailService,
  EmailValidationError,
  CfEmailSendingStrategy,
  NullEmailStrategy,
  ServiceBindingStrategy,
  createEmailService,
  DEFAULT_FROM_EMAIL,
  type EmailEnv,
} from './emailService';
import { EmailPayloadSchema } from './emailSchemas';

// ─── Mock cloudflare:email ────────────────────────────────────────────────────

vi.mock('cloudflare:email', () => ({
  // Use vi.fn() (no implementation) — constructible mock that records call args.
  // Arrow functions are not constructors; vi.fn() is.
  EmailMessage: vi.fn(),
}));

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const VALID_PAYLOAD = {
  to:      'user@example.com',
  subject: 'Test Subject',
  html:    '<p>Hello</p>',
  text:    'Hello',
};

const MINIMAL_ENV: EmailEnv = {
  FROM_EMAIL: 'hello@bloqr.dev',
};

// ─── 0. Module-level exports ──────────────────────────────────────────────────

describe('DEFAULT_FROM_EMAIL', () => {
  it('is exported and is a non-empty string', () => {
    expect(DEFAULT_FROM_EMAIL).toBeTypeOf('string');
    expect(DEFAULT_FROM_EMAIL.length).toBeGreaterThan(0);
  });
});

// ─── 1. EmailPayloadSchema ────────────────────────────────────────────────────

describe('EmailPayloadSchema', () => {
  it('accepts a fully valid payload', () => {
    const result = EmailPayloadSchema.safeParse(VALID_PAYLOAD);
    expect(result.success).toBe(true);
  });

  it('accepts a valid payload that includes replyTo', () => {
    const result = EmailPayloadSchema.safeParse({ ...VALID_PAYLOAD, replyTo: 'reply@bloqr.dev' });
    expect(result.success).toBe(true);
  });

  it('accepts a valid payload without replyTo (replyTo is optional)', () => {
    const result = EmailPayloadSchema.safeParse(VALID_PAYLOAD);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.replyTo).toBeUndefined();
    }
  });

  it('rejects a payload with an invalid email address', () => {
    const result = EmailPayloadSchema.safeParse({ ...VALID_PAYLOAD, to: 'not-an-email' });
    expect(result.success).toBe(false);
  });

  it('rejects a payload with an empty subject', () => {
    const result = EmailPayloadSchema.safeParse({ ...VALID_PAYLOAD, subject: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a payload with an empty html body', () => {
    const result = EmailPayloadSchema.safeParse({ ...VALID_PAYLOAD, html: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a payload with an empty text body', () => {
    const result = EmailPayloadSchema.safeParse({ ...VALID_PAYLOAD, text: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a payload missing the `to` field', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { to, ...withoutTo } = VALID_PAYLOAD;  // `to` is destructured to remove it
    const result = EmailPayloadSchema.safeParse(withoutTo);
    expect(result.success).toBe(false);
  });
});

// ─── 2. ServiceBindingStrategy ────────────────────────────────────────────────

describe('ServiceBindingStrategy', () => {
  function makeWorkerFetcher(status = 200): { fetcher: Fetcher; fetcherMock: Mock } {
    const fetcherMock = vi.fn().mockResolvedValue(new Response(null, { status }));
    const fetcher = { fetch: fetcherMock } as unknown as Fetcher;
    return { fetcher, fetcherMock };
  }

  it('calls EMAIL_WORKER.fetch with a POST request and JSON body', async () => {
    const { fetcher, fetcherMock } = makeWorkerFetcher();
    const env: EmailEnv = { ...MINIMAL_ENV, EMAIL_WORKER: fetcher };
    const strategy = new ServiceBindingStrategy();
    await strategy.send(VALID_PAYLOAD, env);

    expect(fetcherMock).toHaveBeenCalledOnce();
    const [request] = fetcherMock.mock.calls[0] as [Request];
    expect(request.method).toBe('POST');

    const body = await request.json() as Record<string, unknown>;
    expect(body['to']).toBe('user@example.com');
    expect(body['from']).toBe('hello@bloqr.dev');
    expect(body['subject']).toBe('Test Subject');
  });

  it('includes replyTo in the JSON body when payload.replyTo is set', async () => {
    const { fetcher, fetcherMock } = makeWorkerFetcher();
    const env: EmailEnv = { ...MINIMAL_ENV, EMAIL_WORKER: fetcher };
    const strategy = new ServiceBindingStrategy();
    const payloadWithReplyTo = { ...VALID_PAYLOAD, replyTo: 'reply@bloqr.dev' };
    await strategy.send(payloadWithReplyTo, env);

    const [request] = fetcherMock.mock.calls[0] as [Request];
    const body = await request.json() as Record<string, unknown>;
    expect(body['replyTo']).toBe('reply@bloqr.dev');
  });

  it('omits replyTo from the JSON body when payload.replyTo is absent', async () => {
    const { fetcher, fetcherMock } = makeWorkerFetcher();
    const env: EmailEnv = { ...MINIMAL_ENV, EMAIL_WORKER: fetcher };
    const strategy = new ServiceBindingStrategy();
    await strategy.send(VALID_PAYLOAD, env);

    const [request] = fetcherMock.mock.calls[0] as [Request];
    const body = await request.json() as Record<string, unknown>;
    expect(body).not.toHaveProperty('replyTo');
  });

  it('throws when the service binding returns a non-2xx status', async () => {
    const { fetcher } = makeWorkerFetcher(500);
    const env: EmailEnv = { ...MINIMAL_ENV, EMAIL_WORKER: fetcher };
    const strategy = new ServiceBindingStrategy();
    await expect(strategy.send(VALID_PAYLOAD, env)).rejects.toThrow(/bloqr-email service binding returned 500/);
  });

  it('throws when the service binding fetch rejects', async () => {
    const fetcherMock = vi.fn().mockRejectedValue(new Error('binding unavailable'));
    const fetcher = { fetch: fetcherMock } as unknown as Fetcher;
    const env: EmailEnv = { ...MINIMAL_ENV, EMAIL_WORKER: fetcher };
    const strategy = new ServiceBindingStrategy();
    await expect(strategy.send(VALID_PAYLOAD, env)).rejects.toThrow('binding unavailable');
  });

  it('throws when EMAIL_WORKER is absent', async () => {
    const strategy = new ServiceBindingStrategy();
    await expect(strategy.send(VALID_PAYLOAD, MINIMAL_ENV)).rejects.toThrow(
      'ServiceBindingStrategy requires EMAIL_WORKER binding',
    );
  });
});

// ─── 3. CfEmailSendingStrategy ────────────────────────────────────────────────

describe('CfEmailSendingStrategy', () => {
  let sendMock: Mock;
  let env: EmailEnv;

  beforeEach(() => {
    sendMock = vi.fn().mockResolvedValue(undefined);
    env = { ...MINIMAL_ENV, SEND_EMAIL: { send: sendMock } };
  });

  it('throws when SEND_EMAIL binding is absent', async () => {
    const strategy = new CfEmailSendingStrategy();
    await expect(strategy.send(VALID_PAYLOAD, MINIMAL_ENV)).rejects.toThrow(
      'CfEmailSendingStrategy requires SEND_EMAIL binding',
    );
  });

  it('calls env.SEND_EMAIL.send() with an EmailMessage', async () => {
    const strategy = new CfEmailSendingStrategy();
    await strategy.send(VALID_PAYLOAD, env);
    expect(sendMock).toHaveBeenCalledOnce();
  });

  it('derives the envelope `from` address from env.FROM_EMAIL (strips display name)', async () => {
    const { EmailMessage } = await import('cloudflare:email');
    const strategy = new CfEmailSendingStrategy();
    const displayEnv: EmailEnv = {
      FROM_EMAIL: 'Bloqr <hello@bloqr.dev>',
      SEND_EMAIL: { send: sendMock },
    };
    await strategy.send(VALID_PAYLOAD, displayEnv);
    const [from] = vi.mocked(EmailMessage).mock.lastCall as [string, string, string];
    expect(from).toBe('hello@bloqr.dev');
  });

  it('resolves without throwing on a successful send', async () => {
    const strategy = new CfEmailSendingStrategy();
    await expect(strategy.send(VALID_PAYLOAD, env)).resolves.toBeUndefined();
  });

  it('throws and logs a warning when SEND_EMAIL.send() rejects', async () => {
    sendMock.mockRejectedValueOnce(new Error('routing error'));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const strategy = new CfEmailSendingStrategy();
    await expect(strategy.send(VALID_PAYLOAD, env)).rejects.toThrow(/CF Email Sending failed/);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('includes a Reply-To header in the MIME message when replyTo is set', async () => {
    const { EmailMessage } = await import('cloudflare:email');
    const strategy = new CfEmailSendingStrategy();
    const payloadWithReplyTo = { ...VALID_PAYLOAD, replyTo: 'reply@bloqr.dev' };
    await strategy.send(payloadWithReplyTo, env);
    const [, , rawMime] = vi.mocked(EmailMessage).mock.lastCall as [string, string, string];
    expect(rawMime).toContain('Reply-To: reply@bloqr.dev');
  });

  it('does not include a Reply-To header in the MIME message when replyTo is absent', async () => {
    const { EmailMessage } = await import('cloudflare:email');
    const strategy = new CfEmailSendingStrategy();
    await strategy.send(VALID_PAYLOAD, env);
    const [, , rawMime] = vi.mocked(EmailMessage).mock.lastCall as [string, string, string];
    expect(rawMime).not.toContain('Reply-To:');
  });
});

// ─── 4. NullEmailStrategy ─────────────────────────────────────────────────────

describe('NullEmailStrategy', () => {
  it('resolves without throwing', async () => {
    const strategy = new NullEmailStrategy();
    await expect(strategy.send(VALID_PAYLOAD, MINIMAL_ENV)).resolves.toBeUndefined();
  });

  it('logs a warning when dropping an email', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const strategy = new NullEmailStrategy();
    await strategy.send(VALID_PAYLOAD, MINIMAL_ENV);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('NullEmailStrategy'));
    warnSpy.mockRestore();
  });
});

// ─── 5. EmailService.sendEmail ────────────────────────────────────────────────

describe('EmailService.sendEmail', () => {
  let sendMock: Mock;
  let env: EmailEnv;

  beforeEach(() => {
    sendMock = vi.fn().mockResolvedValue(undefined);
    env = { ...MINIMAL_ENV, SEND_EMAIL: { send: sendMock } };
  });

  it('sends via CfEmailSendingStrategy when SEND_EMAIL is provided', async () => {
    const svc = new EmailService(env, new CfEmailSendingStrategy());
    await svc.sendEmail(VALID_PAYLOAD);
    expect(sendMock).toHaveBeenCalledOnce();
  });

  it('throws with "Invalid email payload" prefix when `to` is missing', async () => {
    const svc = new EmailService(env, new CfEmailSendingStrategy());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { to, ...withoutTo } = VALID_PAYLOAD;  // `to` is destructured to remove it
    const err = await svc.sendEmail(withoutTo as typeof VALID_PAYLOAD).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(EmailValidationError);
    expect((err as Error).message).toMatch(/Invalid email payload/);
  });

  it('throws with "Invalid email payload" prefix when `to` is not a valid email', async () => {
    const svc = new EmailService(env, new CfEmailSendingStrategy());
    const err = await svc.sendEmail({ ...VALID_PAYLOAD, to: 'not-valid' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(EmailValidationError);
    // No delivery call should have been made
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('includes the failing field path in the error message', async () => {
    const svc = new EmailService(env, new CfEmailSendingStrategy());
    const err = await svc.sendEmail({ ...VALID_PAYLOAD, to: 'not-valid' }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(EmailValidationError);
    expect((err as Error).message).toMatch(/to:/);
  });

  it('throws when the SEND_EMAIL binding rejects', async () => {
    sendMock.mockRejectedValueOnce(new Error('CF error'));
    const svc = new EmailService(env, new CfEmailSendingStrategy());
    await expect(svc.sendEmail(VALID_PAYLOAD)).rejects.toThrow(/CF Email Sending failed/);
  });
});

// ─── 6. EmailService.sendWaitlistConfirmation ─────────────────────────────────

describe('EmailService.sendWaitlistConfirmation', () => {
  let sendMock: Mock;
  let env: EmailEnv;

  beforeEach(() => {
    sendMock = vi.fn().mockResolvedValue(undefined);
    env = { ...MINIMAL_ENV, SEND_EMAIL: { send: sendMock } };
  });

  it('sends a rendered waitlist email via the underlying sendEmail method', async () => {
    const svc = new EmailService(env, new CfEmailSendingStrategy());
    await svc.sendWaitlistConfirmation('user@example.com', null);
    expect(sendMock).toHaveBeenCalledOnce();
  });

  it('sends without a segment when segment is null', async () => {
    const svc = new EmailService(env, new CfEmailSendingStrategy());
    await expect(svc.sendWaitlistConfirmation('user@example.com', null)).resolves.toBeUndefined();
  });
});

// ─── 7. createEmailService factory ────────────────────────────────────────────

describe('createEmailService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns an EmailService backed by ServiceBindingStrategy when EMAIL_WORKER is present', async () => {
    const fetcherMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const fetcher = { fetch: fetcherMock } as unknown as Fetcher;
    const env: EmailEnv = { ...MINIMAL_ENV, EMAIL_WORKER: fetcher };

    const svc = createEmailService(env);
    await svc.sendEmail(VALID_PAYLOAD);

    expect(fetcherMock).toHaveBeenCalledOnce();
  });

  it('returns an EmailService backed by CfEmailSendingStrategy when SEND_EMAIL is present and EMAIL_WORKER is absent', async () => {
    const sendMock = vi.fn().mockResolvedValue(undefined);
    const env: EmailEnv = { ...MINIMAL_ENV, SEND_EMAIL: { send: sendMock } };

    const svc = createEmailService(env);
    await svc.sendEmail(VALID_PAYLOAD);

    expect(sendMock).toHaveBeenCalledOnce();
  });

  it('falls back to NullEmailStrategy when neither EMAIL_WORKER nor SEND_EMAIL are present', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const svc = createEmailService(MINIMAL_ENV);
    await expect(svc.sendEmail(VALID_PAYLOAD)).resolves.toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('NullEmailStrategy'));
    warnSpy.mockRestore();
  });

  it('prefers EMAIL_WORKER over SEND_EMAIL when both are present', async () => {
    const fetcherMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const fetcher = { fetch: fetcherMock } as unknown as Fetcher;
    const sendMock = vi.fn().mockResolvedValue(undefined);
    const env: EmailEnv = {
      ...MINIMAL_ENV,
      EMAIL_WORKER: fetcher,
      SEND_EMAIL:   { send: sendMock },
    };

    const svc = createEmailService(env);
    await svc.sendEmail(VALID_PAYLOAD);

    expect(fetcherMock).toHaveBeenCalledOnce();
    expect(sendMock).not.toHaveBeenCalled();
  });
});
