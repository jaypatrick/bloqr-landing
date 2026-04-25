/**
 * src/services/emailService.test.ts — Unit tests for EmailService
 *
 * All tests mock `globalThis.fetch` and the EMAIL_WORKER Fetcher binding.
 * No real MailChannels requests are made in this suite.
 *
 * Test categories:
 *   1. EmailPayloadSchema — Zod validation edge cases
 *   2. MailChannelsStrategy — direct MailChannels delivery path
 *   3. ServiceBindingStrategy — adblock-email service binding path
 *   4. EmailService.sendEmail — end-to-end with both strategies
 *   5. createEmailService factory — strategy selection
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import {
  EmailService,
  MailChannelsStrategy,
  ServiceBindingStrategy,
  createEmailService,
  type EmailEnv,
} from './emailService';
import { EmailPayloadSchema } from './emailSchemas';

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

const DKIM_ENV: EmailEnv = {
  FROM_EMAIL:      'hello@bloqr.dev',
  DKIM_DOMAIN:     'bloqr.dev',
  DKIM_SELECTOR:   'mailchannels',
  DKIM_PRIVATE_KEY: 'base64-private-key',
};

// ─── 1. EmailPayloadSchema ────────────────────────────────────────────────────

describe('EmailPayloadSchema', () => {
  it('accepts a fully valid payload', () => {
    const result = EmailPayloadSchema.safeParse(VALID_PAYLOAD);
    expect(result.success).toBe(true);
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

// ─── 2. MailChannelsStrategy ──────────────────────────────────────────────────

describe('MailChannelsStrategy', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(
      new Response(null, { status: 202 }),
    );
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('calls fetch with the MailChannels endpoint and correct JSON body', async () => {
    const strategy = new MailChannelsStrategy();
    await strategy.send(VALID_PAYLOAD, MINIMAL_ENV);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.mailchannels.net/tx/v1/send');
    expect(init.method).toBe('POST');

    const body = JSON.parse(init.body as string);
    expect(body.from.email).toBe('hello@bloqr.dev');
    expect(body.personalizations[0].to[0].email).toBe('user@example.com');
    expect(body.subject).toBe('Test Subject');
    expect(body.content).toHaveLength(2);
    expect(body.content[0].type).toBe('text/plain');
    expect(body.content[1].type).toBe('text/html');
  });

  it('includes DKIM fields in personalization when all three DKIM env vars are present', async () => {
    const strategy = new MailChannelsStrategy();
    await strategy.send(VALID_PAYLOAD, DKIM_ENV);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const person = body.personalizations[0];
    expect(person.dkim_domain).toBe('bloqr.dev');
    expect(person.dkim_selector).toBe('mailchannels');
    expect(person.dkim_private_key).toBe('base64-private-key');
  });

  it('omits DKIM fields when only some DKIM env vars are present', async () => {
    const partialDkimEnv: EmailEnv = {
      FROM_EMAIL:    'hello@bloqr.dev',
      DKIM_DOMAIN:   'bloqr.dev',
      // DKIM_SELECTOR and DKIM_PRIVATE_KEY intentionally missing
    };
    const strategy = new MailChannelsStrategy();
    await strategy.send(VALID_PAYLOAD, partialDkimEnv);

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    const person = body.personalizations[0];
    expect(person.dkim_domain).toBeUndefined();
    expect(person.dkim_selector).toBeUndefined();
    expect(person.dkim_private_key).toBeUndefined();
  });

  it('does not throw when MailChannels returns a non-2xx status', async () => {
    fetchMock.mockResolvedValue(new Response('Bad request', { status: 400 }));
    const strategy = new MailChannelsStrategy();
    // Must resolve, not reject
    await expect(strategy.send(VALID_PAYLOAD, MINIMAL_ENV)).resolves.toBeUndefined();
  });

  it('does not throw when fetch itself rejects (network failure)', async () => {
    fetchMock.mockRejectedValue(new TypeError('network failure'));
    const strategy = new MailChannelsStrategy();
    await expect(strategy.send(VALID_PAYLOAD, MINIMAL_ENV)).resolves.toBeUndefined();
  });

  it('logs a warning on non-2xx response', async () => {
    fetchMock.mockResolvedValue(new Response('error', { status: 500 }));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const strategy = new MailChannelsStrategy();
    await strategy.send(VALID_PAYLOAD, MINIMAL_ENV);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('500'), expect.anything());
    warnSpy.mockRestore();
  });
});

// ─── 3. ServiceBindingStrategy ────────────────────────────────────────────────

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

  it('includes DKIM fields in the service binding payload when all DKIM vars are set', async () => {
    const { fetcher, fetcherMock } = makeWorkerFetcher();
    const env: EmailEnv = { ...DKIM_ENV, EMAIL_WORKER: fetcher };
    const strategy = new ServiceBindingStrategy();
    await strategy.send(VALID_PAYLOAD, env);

    const body = await (fetcherMock.mock.calls[0] as [Request])[0].json() as Record<string, unknown>;
    expect(body['dkimDomain']).toBe('bloqr.dev');
    expect(body['dkimSelector']).toBe('mailchannels');
    expect(body['dkimPrivateKey']).toBe('base64-private-key');
  });

  it('omits DKIM fields when partial DKIM vars are set', async () => {
    const { fetcher, fetcherMock } = makeWorkerFetcher();
    const env: EmailEnv = { FROM_EMAIL: 'hello@bloqr.dev', DKIM_DOMAIN: 'bloqr.dev', EMAIL_WORKER: fetcher };
    const strategy = new ServiceBindingStrategy();
    await strategy.send(VALID_PAYLOAD, env);

    const body = await (fetcherMock.mock.calls[0] as [Request])[0].json() as Record<string, unknown>;
    expect(body['dkimDomain']).toBeUndefined();
  });

  it('does not throw when the service binding returns a non-2xx status', async () => {
    const { fetcher } = makeWorkerFetcher(500);
    const env: EmailEnv = { ...MINIMAL_ENV, EMAIL_WORKER: fetcher };
    const strategy = new ServiceBindingStrategy();
    await expect(strategy.send(VALID_PAYLOAD, env)).resolves.toBeUndefined();
  });

  it('does not throw when the service binding fetch rejects', async () => {
    const fetcherMock = vi.fn().mockRejectedValue(new Error('binding unavailable'));
    const fetcher = { fetch: fetcherMock } as unknown as Fetcher;
    const env: EmailEnv = { ...MINIMAL_ENV, EMAIL_WORKER: fetcher };
    const strategy = new ServiceBindingStrategy();
    await expect(strategy.send(VALID_PAYLOAD, env)).resolves.toBeUndefined();
  });

  it('throws when EMAIL_WORKER is absent', async () => {
    const strategy = new ServiceBindingStrategy();
    await expect(strategy.send(VALID_PAYLOAD, MINIMAL_ENV)).rejects.toThrow(
      'ServiceBindingStrategy requires EMAIL_WORKER binding',
    );
  });
});

// ─── 4. EmailService.sendEmail ────────────────────────────────────────────────

describe('EmailService.sendEmail', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends with the MailChannels strategy when no EMAIL_WORKER binding is provided', async () => {
    const svc = new EmailService(MINIMAL_ENV, new MailChannelsStrategy());
    await svc.sendEmail(VALID_PAYLOAD);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('throws with "Invalid email payload" prefix when `to` is missing', async () => {
    const svc = new EmailService(MINIMAL_ENV, new MailChannelsStrategy());
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { to, ...withoutTo } = VALID_PAYLOAD;  // `to` is destructured to remove it
    await expect(svc.sendEmail(withoutTo as typeof VALID_PAYLOAD)).rejects.toThrow(
      /Invalid email payload/,
    );
  });

  it('throws with "Invalid email payload" prefix when `to` is not a valid email', async () => {
    const svc = new EmailService(MINIMAL_ENV, new MailChannelsStrategy());
    await expect(
      svc.sendEmail({ ...VALID_PAYLOAD, to: 'not-valid' }),
    ).rejects.toThrow(/Invalid email payload/);
    // No network call should have been made
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('includes the failing field path in the error message', async () => {
    const svc = new EmailService(MINIMAL_ENV, new MailChannelsStrategy());
    await expect(
      svc.sendEmail({ ...VALID_PAYLOAD, to: 'not-valid' }),
    ).rejects.toThrow(/to:/);
  });

  it('does not throw when the MailChannels response is non-2xx', async () => {
    fetchMock.mockResolvedValue(new Response('Bad request', { status: 400 }));
    const svc = new EmailService(MINIMAL_ENV, new MailChannelsStrategy());
    await expect(svc.sendEmail(VALID_PAYLOAD)).resolves.toBeUndefined();
  });
});

// ─── 5. createEmailService factory ────────────────────────────────────────────

describe('createEmailService', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns an EmailService backed by MailChannelsStrategy when EMAIL_WORKER is absent', async () => {
    const svc = createEmailService(MINIMAL_ENV);
    await svc.sendEmail(VALID_PAYLOAD);

    // MailChannels endpoint must have been called
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.mailchannels.net/tx/v1/send',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('returns an EmailService backed by ServiceBindingStrategy when EMAIL_WORKER is present', async () => {
    const fetcherMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const fetcher = { fetch: fetcherMock } as unknown as Fetcher;
    const env: EmailEnv = { ...MINIMAL_ENV, EMAIL_WORKER: fetcher };

    const svc = createEmailService(env);
    await svc.sendEmail(VALID_PAYLOAD);

    // The global fetch (MailChannels) must NOT have been called
    expect(fetchMock).not.toHaveBeenCalled();
    // The service binding fetcher must have been called
    expect(fetcherMock).toHaveBeenCalledOnce();
  });
});
