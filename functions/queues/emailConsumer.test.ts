/**
 * functions/queues/emailConsumer.test.ts — Unit tests for the email queue consumer
 *
 * Tests mock `globalThis.fetch`, the `EMAIL_WORKER` Fetcher binding, the
 * `SEND_EMAIL` binding, and the Cloudflare KV / Analytics Engine bindings.
 * No real email calls are made in this suite.
 *
 * Test categories:
 *   1. Schema validation — invalid message bodies are ACKed without retry
 *   2. Stale message detection — old messages are ACKed without sending
 *   3. Deduplication — already-sent messages are skipped
 *   4. Template rendering — unknown / broken templates are ACKed without retry
 *   5. Email delivery — successful send + retry on transient failure
 *   6. Dedup key write — KV key written after successful send
 *   7. Analytics — data point written after successful send
 *   8. FROM_EMAIL absence — message ACKed without send
 */

import { describe, it, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';
import { handleEmailQueue, CONSUMER_TEMPLATE_REGISTRY } from '../../functions/queues/emailConsumer';
import { EmailService, EmailValidationError } from '../../src/services/emailService';
import type { EmailQueueMessage } from '../../src/types/emailQueue';

// ─── Mock cloudflare:email ────────────────────────────────────────────────────

vi.mock('cloudflare:email', () => ({
  // Use vi.fn() (no implementation) — constructible mock that records call args.
  // Arrow functions are not constructors; vi.fn() is.
  EmailMessage: vi.fn(),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal valid EmailQueueMessage. */
function makeMessage(overrides: Partial<EmailQueueMessage> = {}): EmailQueueMessage {
  return {
    id:         '123e4567-e89b-12d3-a456-426614174000',
    template:   'waitlistWelcome',
    to:         'test@example.com',
    params:     { email: 'test@example.com', segment: null },
    enqueuedAt: new Date().toISOString(),
    ...overrides,
  };
}

/** Build a mock Message<EmailQueueMessage> with ACK/retry spies. */
function makeQueueMessage(body: unknown = makeMessage()) {
  const ack   = vi.fn();
  const retry = vi.fn();
  return {
    message: { body, ack, retry, id: 'msg-1', timestamp: new Date(), attempts: 1 } as unknown as Message<EmailQueueMessage>,
    ack,
    retry,
  };
}

/** Build a mock MessageBatch with a single message. */
function makeBatch(body: unknown = makeMessage()): {
  batch: MessageBatch<EmailQueueMessage>;
  ack:   Mock;
  retry: Mock;
} {
  const { message, ack, retry } = makeQueueMessage(body);
  const batch = {
    messages: [message],
    queue:    'email-queue',
    ackAll:   vi.fn(),
    retryAll: vi.fn(),
    metadata: { metrics: { backlogCount: 0, backlogBytes: 0 } },
  } as unknown as MessageBatch<EmailQueueMessage>;
  return { batch, ack, retry };
}

/** Minimal Env fixture — enough to allow email delivery. */
function makeEnv(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    FROM_EMAIL: 'hello@bloqr.dev',
    ...overrides,
  };
}

// ─── 1. Schema validation ─────────────────────────────────────────────────────

describe('schema validation', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('ACKs a message with a missing `id` field without retrying', async () => {
    const { batch, ack, retry } = makeBatch({ ...makeMessage(), id: undefined });
    await handleEmailQueue(batch, makeEnv() as never);
    expect(ack).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('ACKs a message with a non-UUID id without retrying', async () => {
    const { batch, ack, retry } = makeBatch({ ...makeMessage(), id: 'not-a-uuid' });
    await handleEmailQueue(batch, makeEnv() as never);
    expect(ack).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
  });

  it('ACKs a message with an invalid recipient email without retrying', async () => {
    const { batch, ack, retry } = makeBatch({ ...makeMessage(), to: 'not-valid' });
    await handleEmailQueue(batch, makeEnv() as never);
    expect(ack).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
  });

  it('ACKs a message with an unknown template name without retrying', async () => {
    const { batch, ack, retry } = makeBatch({ ...makeMessage(), template: 'unknownTemplate' });
    await handleEmailQueue(batch, makeEnv() as never);
    expect(ack).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
  });

  it('ACKs a message with a missing enqueuedAt field without retrying', async () => {
    const { batch, ack, retry } = makeBatch({ ...makeMessage(), enqueuedAt: undefined });
    await handleEmailQueue(batch, makeEnv() as never);
    expect(ack).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
  });
});

// ─── 2. Stale message detection ───────────────────────────────────────────────

describe('stale message detection', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('ACKs a message enqueued > 24 hours ago without sending', async () => {
    const staleDate = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const { batch, ack, retry } = makeBatch({ ...makeMessage(), enqueuedAt: staleDate });
    await handleEmailQueue(batch, makeEnv() as never);
    expect(ack).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('delivers a fresh message (< 24 hours old) normally', async () => {
    const freshDate = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 min ago
    const { batch, ack } = makeBatch({ ...makeMessage(), enqueuedAt: freshDate });
    await handleEmailQueue(batch, makeEnv() as never);
    expect(ack).toHaveBeenCalledOnce();
  });
});

// ─── 3. Deduplication ────────────────────────────────────────────────────────

describe('deduplication', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('skips send and ACKs when KV contains the message id', async () => {
    const msgId  = '123e4567-e89b-12d3-a456-426614174000';
    const kvGet  = vi.fn().mockResolvedValue('1');
    const kvPut  = vi.fn().mockResolvedValue(undefined);
    const env    = makeEnv({ EMAIL_DEDUP_KV: { get: kvGet, put: kvPut } });
    const { batch, ack, retry } = makeBatch({ ...makeMessage(), id: msgId });

    await handleEmailQueue(batch, env as never);

    expect(kvGet).toHaveBeenCalledWith(`email-sent:${msgId}`);
    expect(ack).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends when KV returns null (message not yet delivered)', async () => {
    const kvGet = vi.fn().mockResolvedValue(null);
    const kvPut = vi.fn().mockResolvedValue(undefined);
    const env   = makeEnv({ EMAIL_DEDUP_KV: { get: kvGet, put: kvPut } });
    const { batch, ack } = makeBatch(makeMessage());

    await handleEmailQueue(batch, env as never);

    expect(ack).toHaveBeenCalledOnce();
  });
});

// ─── 4. Template rendering ────────────────────────────────────────────────────

describe('template rendering', () => {
  it('ACKs cleanly after a successful template render with a registered template', async () => {
    // Verifies the happy path: a valid message with a known registered template
    // renders successfully and is ACKed.
    const { batch, ack } = makeBatch(makeMessage());
    await handleEmailQueue(batch, makeEnv() as never);
    expect(ack).toHaveBeenCalledOnce();
  });

  it('ACKs without retry when the template is not in the registry', async () => {
    // Remove 'waitlistWelcome' from the registry to simulate an in-flight
    // message for a template that was subsequently removed from the codebase.
    const saved = CONSUMER_TEMPLATE_REGISTRY['waitlistWelcome'];
    try {
      delete (CONSUMER_TEMPLATE_REGISTRY as Record<string, unknown>)['waitlistWelcome'];
      const { batch, ack, retry } = makeBatch(makeMessage());
      await handleEmailQueue(batch, makeEnv() as never);
      expect(ack).toHaveBeenCalledOnce();
      expect(retry).not.toHaveBeenCalled();
    } finally {
      CONSUMER_TEMPLATE_REGISTRY['waitlistWelcome'] = saved;
    }
  });
});

// ─── 5. Email delivery ───────────────────────────────────────────────────────

describe('email delivery', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('ACKs after a successful send', async () => {
    const { batch, ack, retry } = makeBatch(makeMessage());
    await handleEmailQueue(batch, makeEnv() as never);
    expect(ack).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
  });

  it('ACKs when FROM_EMAIL is absent (skips send gracefully)', async () => {
    const { batch, ack, retry } = makeBatch(makeMessage());
    await handleEmailQueue(batch, {} as never);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(ack).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
  });

  it('calls retry() (not ack()) on a transient delivery failure', async () => {
    const sendMock = vi.fn().mockRejectedValueOnce(new TypeError('network failure'));
    const env = makeEnv({ SEND_EMAIL: { send: sendMock } });
    const { batch, ack, retry } = makeBatch(makeMessage());
    await handleEmailQueue(batch, env as never);
    expect(retry).toHaveBeenCalledOnce();
    expect(ack).not.toHaveBeenCalled();
  });

  it('ACKs (not retries) when the payload is permanently invalid', async () => {
    // Simulate EmailService throwing an EmailValidationError (permanent failure).
    const sendEmail = vi.spyOn(EmailService.prototype, 'sendEmail').mockRejectedValueOnce(
      new EmailValidationError([{ path: 'to', message: 'Invalid email' }]),
    );
    const { batch, ack, retry } = makeBatch(makeMessage());
    await handleEmailQueue(batch, makeEnv() as never);
    expect(ack).toHaveBeenCalledOnce();
    expect(retry).not.toHaveBeenCalled();
    sendEmail.mockRestore();
  });

  it('routes email through EMAIL_WORKER binding when present', async () => {
    const workerFetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    const workerFetcher   = { fetch: workerFetchMock } as unknown as Fetcher;
    const env = makeEnv({ EMAIL_WORKER: workerFetcher });

    const { batch, ack } = makeBatch(makeMessage());
    await handleEmailQueue(batch, env as never);

    // The global fetch (non-binding) must NOT have been called
    expect(fetchMock).not.toHaveBeenCalled();
    // The service binding fetcher MUST have been called
    expect(workerFetchMock).toHaveBeenCalledOnce();
    expect(ack).toHaveBeenCalledOnce();
  });
});

// ─── 6. Dedup key write ───────────────────────────────────────────────────────

describe('dedup key write after send', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('writes dedup key to EMAIL_DEDUP_KV after a successful send', async () => {
    const kvGet = vi.fn().mockResolvedValue(null);
    const kvPut = vi.fn().mockResolvedValue(undefined);
    const env   = makeEnv({ EMAIL_DEDUP_KV: { get: kvGet, put: kvPut } });
    const msgId = '123e4567-e89b-12d3-a456-426614174000';
    const { batch } = makeBatch({ ...makeMessage(), id: msgId });

    await handleEmailQueue(batch, env as never);

    expect(kvPut).toHaveBeenCalledWith(
      `email-sent:${msgId}`,
      '1',
      expect.objectContaining({ expirationTtl: expect.any(Number) }),
    );
  });

  it('does not write dedup key when EMAIL_DEDUP_KV is absent', async () => {
    // No kvPut to assert — just verifying no crash occurs
    const { batch, ack } = makeBatch(makeMessage());
    await handleEmailQueue(batch, makeEnv() as never);
    expect(ack).toHaveBeenCalledOnce();
  });

  it('does not write dedup key when delivery fails', async () => {
    const sendMock = vi.fn().mockRejectedValueOnce(new TypeError('network error'));
    const kvGet = vi.fn().mockResolvedValue(null);
    const kvPut = vi.fn().mockResolvedValue(undefined);
    const env   = makeEnv({ SEND_EMAIL: { send: sendMock }, EMAIL_DEDUP_KV: { get: kvGet, put: kvPut } });

    const { batch, retry } = makeBatch(makeMessage());
    await handleEmailQueue(batch, env as never);

    expect(retry).toHaveBeenCalledOnce();
    expect(kvPut).not.toHaveBeenCalled();
  });
});

// ─── 7. Analytics event ───────────────────────────────────────────────────────

describe('analytics event', () => {
  let fetchMock: Mock;

  beforeEach(() => {
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 202 }));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => vi.unstubAllGlobals());

  it('writes an email_sent data point after a successful send', async () => {
    const writeDataPoint = vi.fn();
    const env = makeEnv({ ANALYTICS: { writeDataPoint } });

    const { batch } = makeBatch(makeMessage());
    await handleEmailQueue(batch, env as never);

    expect(writeDataPoint).toHaveBeenCalledOnce();
    const [event] = writeDataPoint.mock.calls[0] as [Record<string, unknown>];
    expect((event['blobs'] as string[])[0]).toBe('email_sent');
  });

  it('does not call writeDataPoint when ANALYTICS is absent', async () => {
    const { batch, ack } = makeBatch(makeMessage());
    await handleEmailQueue(batch, makeEnv() as never);
    // Just verify no crash and ACK is called
    expect(ack).toHaveBeenCalledOnce();
  });

  it('does not write analytics on delivery failure', async () => {
    const sendMock = vi.fn().mockRejectedValueOnce(new TypeError('network error'));
    const writeDataPoint = vi.fn();
    const env = makeEnv({ SEND_EMAIL: { send: sendMock }, ANALYTICS: { writeDataPoint } });

    const { batch, retry } = makeBatch(makeMessage());
    await handleEmailQueue(batch, env as never);

    expect(retry).toHaveBeenCalledOnce();
    expect(writeDataPoint).not.toHaveBeenCalled();
  });
});

