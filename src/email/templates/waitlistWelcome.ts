/**
 * src/email/templates/waitlistWelcome.ts — Waitlist confirmation email
 *
 * Renders the HTML + plain-text welcome email sent to every new waitlist signup.
 * Brand voice: short declarative sentences, "you"-focused copy.
 * No external images or tracking pixels.
 */

import { SITE_URL } from '../../config';

const SEGMENT_LABELS: Record<string, string> = {
  'list-maker':     'list maker',
  'privacy-vendor': 'privacy vendor',
  'individual':     'individual user',
};

export function renderWaitlistWelcome(
  email: string,
  segment: string | null,
): { html: string; text: string; subject: string; replyTo: string } {
  const segmentLabel = segment ? SEGMENT_LABELS[segment] ?? null : null;
  const personalizedLine = segmentLabel
    ? `We're onboarding ${segmentLabel}s first — you're in the right place.`
    : "We're onboarding list makers and privacy vendors first, then everyone else.";

  const subject = "You're on the Bloqr waitlist";

  const text = [
    "You're on the Bloqr waitlist.",
    '',
    personalizedLine,
    '',
    "We'll reach out when your spot opens. No spam. One email when it's ready.",
    '',
    'Internet Hygiene. Automated.',
    '',
    `— The Bloqr team`,
    `${SITE_URL}`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subject}</title>
<style>
  body { margin: 0; padding: 0; background: #0a0a0a; font-family: system-ui, sans-serif; color: #e5e5e5; }
  .wrap { max-width: 560px; margin: 40px auto; padding: 32px 24px; }
  .logo { font-size: 22px; font-weight: 700; letter-spacing: -0.5px; color: #FF5500; margin-bottom: 32px; }
  h1 { font-size: 20px; font-weight: 700; margin: 0 0 16px; color: #ffffff; }
  p { font-size: 15px; line-height: 1.6; margin: 0 0 14px; color: #a3a3a3; }
  .tagline { font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase; color: #FF5500; margin-top: 32px; }
  .footer { margin-top: 40px; font-size: 12px; color: #525252; border-top: 1px solid #1f1f1f; padding-top: 16px; }
  a { color: #FF5500; text-decoration: none; }
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">Bloqr</div>
  <h1>You're on the waitlist.</h1>
  <p>${personalizedLine}</p>
  <p>We'll reach out when your spot opens. No spam. One email when it's ready.</p>
  <p class="tagline">Internet Hygiene. Automated.</p>
  <div class="footer">
    <p>The Bloqr team &mdash; <a href="${SITE_URL}">${SITE_URL}</a></p>
    <p>You're receiving this because ${email} signed up at ${SITE_URL}.</p>
  </div>
</div>
</body>
</html>`;

  return { subject, html, text, replyTo: 'Bloqr <hello@bloqr.dev>' };
}
