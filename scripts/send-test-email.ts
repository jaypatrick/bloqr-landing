#!/usr/bin/env npx tsx
/**
 * scripts/send-test-email.ts — CLI tool for testing the email service
 *
 * Renders an email template and either:
 *   - (default) prints the payload to stdout (dry run)
 *   - (--send)  POSTs to the MailChannels TX API using env vars from .dev.vars
 *
 * Prerequisites:
 *   - copy .dev.vars.example → .dev.vars and fill in FROM_EMAIL (+ DKIM vars if needed)
 *   - npm run preview should be running if you want to test via the admin API
 *
 * Usage:
 *   npx tsx scripts/send-test-email.ts [options]
 *
 * Options:
 *   --to        <email>     Recipient address         (required for --send)
 *   --template  <name>      Template to render        (default: waitlistWelcome)
 *   --segment   <segment>   Segment override          (list-maker | privacy-vendor | individual)
 *   --send                  Actually send via MailChannels (default: dry run)
 *   --api                   Send via the admin API at --url instead of MailChannels directly
 *   --url       <url>       Base URL for --api mode   (default: http://localhost:4321)
 *   --token     <secret>    Admin secret for --api mode
 *   --dry-run               Print payload only; do not send (default)
 *   --help                  Show this help text
 *
 * Examples:
 *   # Dry run — preview the waitlistWelcome template
 *   npx tsx scripts/send-test-email.ts --to test@example.com
 *
 *   # Send directly via MailChannels (requires FROM_EMAIL in env / .dev.vars)
 *   npx tsx scripts/send-test-email.ts --to test@example.com --send
 *
 *   # Send via the admin API (requires npm run preview running)
 *   npx tsx scripts/send-test-email.ts --to test@example.com --api --token <ADMIN_SECRET>
 *
 *   # Use a different template + segment
 *   npx tsx scripts/send-test-email.ts \
 *     --to test@example.com \
 *     --template waitlistWelcome \
 *     --segment list-maker \
 *     --send
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function printHelp(): void {
  const help = `
  send-test-email — Bloqr email testing CLI

  Usage:
    npx tsx scripts/send-test-email.ts [options]

  Options:
    --to        <email>    Recipient address (required for --send / --api)
    --template  <name>    Template to render (default: waitlistWelcome)
    --segment   <seg>     Segment override: list-maker | privacy-vendor | individual
    --send                Send directly via MailChannels (reads env vars)
    --api                 Send via the admin API endpoint
    --url       <url>     Admin API base URL (default: http://localhost:4321)
    --token     <secret>  Admin secret for --api mode
    --dry-run             Print rendered payload only (default)
    --help                Show this help text

  Available templates:
    waitlistWelcome       Waitlist confirmation email

  Environment variables (for --send mode):
    FROM_EMAIL            Sender address, e.g. "Bloqr <hello@bloqr.dev>"
    DKIM_DOMAIN           DKIM domain (optional)
    DKIM_SELECTOR         DKIM selector (optional)
    DKIM_PRIVATE_KEY      DKIM private key (optional, Worker Secret)
`.trimStart();
  process.stdout.write(help + '\n');
}

/** Parse key=value lines from a .dev.vars file into an env-like object. */
function loadDevVars(): Record<string, string> {
  const devVarsPath = join(__dirname, '..', '.dev.vars');
  try {
    const content = readFileSync(devVarsPath, 'utf-8');
    const result: Record<string, string> = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx < 1) continue;
      const key   = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      result[key] = value;
    }
    return result;
  } catch {
    return {};
  }
}

/** Merge .dev.vars values under process.env (process.env takes precedence). */
function resolveEnv(): Record<string, string | undefined> {
  const devVars = loadDevVars();
  return { ...devVars, ...process.env } as Record<string, string | undefined>;
}

/** Parse --flag and --key value pairs from process.argv. */
function parseArgs(argv: string[]): Record<string, string | boolean> {
  const args: Record<string, string | boolean> = {};
  let i = 2;
  while (i < argv.length) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) {
        args[key] = next;
        i += 2;
      } else {
        args[key] = true;
        i += 1;
      }
    } else {
      i += 1;
    }
  }
  return args;
}

// ─── Template loader (dynamic import avoids bundler issues) ──────────────────

type RenderResult = { subject: string; html: string; text: string };

async function renderTemplate(
  template: string,
  email: string,
  segment: string | null,
): Promise<RenderResult> {
  if (template === 'waitlistWelcome') {
    const { renderWaitlistWelcome } = await import(
      '../src/email/templates/waitlistWelcome.js'
    ) as { renderWaitlistWelcome: (email: string, segment: string | null) => RenderResult };
    return renderWaitlistWelcome(email, segment);
  }
  throw new Error(`Unknown template: "${template}". Available: waitlistWelcome`);
}

// ─── MailChannels direct send ─────────────────────────────────────────────────

interface MailChannelsPersonalization {
  to: [{ email: string }];
  dkim_domain?: string;
  dkim_selector?: string;
  dkim_private_key?: string;
}

interface MailChannelsBody {
  personalizations: MailChannelsPersonalization[];
  from: { email: string };
  subject: string;
  content: { type: string; value: string }[];
}

async function sendViaMailChannels(
  to: string,
  rendered: RenderResult,
  env: Record<string, string | undefined>,
): Promise<void> {
  const fromEmail = env['FROM_EMAIL'];
  if (!fromEmail) {
    throw new Error(
      'FROM_EMAIL is not set. Add it to .dev.vars or export it in your shell.',
    );
  }

  const hasDkim =
    env['DKIM_DOMAIN'] != null &&
    env['DKIM_SELECTOR'] != null &&
    env['DKIM_PRIVATE_KEY'] != null;

  const personalization: MailChannelsPersonalization = {
    to: [{ email: to }],
    ...(hasDkim && {
      dkim_domain:      env['DKIM_DOMAIN'],
      dkim_selector:    env['DKIM_SELECTOR'],
      dkim_private_key: env['DKIM_PRIVATE_KEY'],
    }),
  };

  const body: MailChannelsBody = {
    personalizations: [personalization],
    from:             { email: fromEmail },
    subject:          rendered.subject,
    content: [
      { type: 'text/plain', value: rendered.text },
      { type: 'text/html',  value: rendered.html  },
    ],
  };

  console.log('Posting to MailChannels TX API…');
  const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (res.ok) {
    console.log(`✓ Sent! MailChannels responded ${res.status}.`);
  } else {
    const text = await res.text().catch(() => '(no body)');
    throw new Error(`MailChannels send failed (${res.status}): ${text}`);
  }
}

// ─── Admin API send ───────────────────────────────────────────────────────────

async function sendViaAdminApi(
  to: string,
  template: string,
  segment: string | null,
  baseUrl: string,
  token: string,
): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, '')}/admin/email/send-test`;
  console.log(`Posting to admin API: ${url}`);

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      to,
      template,
      params: { email: to, segment },
    }),
  });

  const data: unknown = await res.json().catch(() => ({}));

  if (res.ok && (data as { success?: boolean }).success) {
    const d = data as { strategy?: string };
    console.log(`✓ Sent via ${d.strategy ?? 'unknown strategy'}!`);
  } else {
    const err = (data as { error?: string }).error ?? `HTTP ${res.status}`;
    throw new Error(`Admin API send failed: ${err}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const args = parseArgs(process.argv);

  if (args['help']) { printHelp(); process.exit(0); }

  const to       = typeof args['to']       === 'string' ? args['to']       : '';
  const template = typeof args['template'] === 'string' ? args['template'] : 'waitlistWelcome';
  const segment  = typeof args['segment']  === 'string' ? args['segment']  : null;
  const doSend   = args['send']  === true;
  const doApi    = args['api']   === true;
  const baseUrl  = typeof args['url']   === 'string' ? args['url']   : 'http://localhost:4321';
  const token    = typeof args['token'] === 'string' ? args['token'] : '';

  if ((doSend || doApi) && !to) {
    console.error('Error: --to <email> is required when using --send or --api.');
    process.exit(1);
  }

  const recipientEmail = to || 'preview@example.com';

  console.log(`\n  Template : ${template}`);
  console.log(`  Segment  : ${segment ?? '(none)'}`);
  console.log(`  To       : ${recipientEmail}`);
  console.log('');

  // Render the template
  const rendered = await renderTemplate(template, recipientEmail, segment);

  console.log(`  Subject  : ${rendered.subject}`);
  console.log('');

  if (!doSend && !doApi) {
    // Dry run — print payload
    console.log('── HTML body (truncated to 400 chars) ──');
    console.log(rendered.html.slice(0, 400) + (rendered.html.length > 400 ? '\n…' : ''));
    console.log('\n── Plain-text body ──');
    console.log(rendered.text);
    console.log('\n(Dry run — pass --send to call MailChannels, or --api to use the admin endpoint)');
    return;
  }

  if (doApi) {
    if (!token) {
      console.error('Error: --token <ADMIN_SECRET> is required for --api mode.');
      process.exit(1);
    }
    await sendViaAdminApi(to, template, segment, baseUrl, token);
    return;
  }

  // --send: direct MailChannels
  const env = resolveEnv();
  await sendViaMailChannels(to, rendered, env);
}

main().catch((err: unknown) => {
  console.error('Error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
