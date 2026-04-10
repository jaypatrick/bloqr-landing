/**
 * og-image.ts — build-time OG image generator.
 *
 * Generates a 1200×630 PNG buffer from a title and optional description,
 * using the Bloqr brand palette and the same visual language as gen-og.mjs.
 *
 * Runs ONLY in Node.js (prerenderEnvironment: 'node') at `npm run build`.
 * Never imported by Worker runtime code.
 *
 * Depends on `sharp` (devDependency).
 */

import { CANONICAL_DOMAIN } from '../config';

const W = 1200;
const H = 630;

// Brand palette
const BG     = '#070B14';
const ORANGE = '#FF5500';
const CYAN   = '#00D4FF';
const WHITE  = 'white';
const MUTED  = 'rgba(255,255,255,0.45)';
const MUTED2 = 'rgba(255,255,255,0.25)';

/** Escape special XML/SVG characters. */
function escXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Naive word-wrap: split `text` into lines no longer than `maxChars`
 * characters, breaking on word boundaries.
 */
function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + w).length > maxChars) {
      if (line) lines.push(line.trimEnd());
      line = w + ' ';
    } else {
      line += w + ' ';
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

/**
 * Generates a 1200×630 Bloqr-branded OG PNG buffer.
 *
 * @param title       Page or post title (displayed prominently)
 * @param description Optional subtitle / description line
 */
export async function generateOgImage(
  title: string,
  description?: string,
): Promise<Buffer> {
  const { default: sharp } = await import('sharp');

  // --- title layout ---
  const titleLines = wrapText(title, 34);
  // Shrink font when the title wraps to three or more lines
  const fontSize   = titleLines.length >= 3 ? 46 : titleLines.length === 2 ? 52 : 58;
  const lineHeight = fontSize * 1.22;
  const titleY     = 220;

  const titleSvg = titleLines.map((line, i) =>
    `<text x="80" y="${titleY + i * lineHeight}"
      font-family="system-ui, -apple-system, 'Helvetica Neue', sans-serif"
      font-size="${fontSize}" font-weight="800"
      fill="${WHITE}" letter-spacing="-1">${escXml(line)}</text>`,
  ).join('\n');

  // --- description layout (max 2 lines) ---
  let descSvg = '';
  if (description) {
    const descY   = titleY + titleLines.length * lineHeight + 22;
    const descLines = wrapText(description, 70).slice(0, 2);
    descSvg = descLines.map((line, i) =>
      `<text x="80" y="${descY + i * 28}"
        font-family="system-ui, -apple-system, 'Helvetica Neue', sans-serif"
        font-size="18" font-weight="400"
        fill="${MUTED}" letter-spacing="0">${escXml(line)}</text>`,
    ).join('\n');
  }

  // --- right-side brand filter bars (same as gen-og.mjs) ---
  const bars = [
    { w: 340, y: 180, opacity: 0.12, accent: false },
    { w: 260, y: 236, opacity: 0.18, accent: false },
    { w: 190, y: 292, opacity: 0.25, accent: false },
    { w: 130, y: 348, opacity: 0.32, accent: false },
    { w:  80, y: 404, opacity: 1.00, accent: true  },
  ];
  const barX = W - 420;
  const barH = 42;
  const barSvg = bars.map(b =>
    `<rect x="${barX}" y="${b.y}" width="${b.w}" height="${barH}"
      rx="6" fill="${b.accent ? ORANGE : WHITE}" opacity="${b.opacity}"/>`,
  ).join('\n');

  // --- mini logo mark (top-left, mirrored from gen-og.mjs) ---
  const logoBarWidths = [22, 16, 9];
  const logoBarColors = [WHITE, MUTED, ORANGE];
  const logoBars = logoBarWidths.map((w, i) =>
    `<rect x="80" y="${96 + i * 14}" width="${w}" height="8"
      rx="2" fill="${logoBarColors[i]}"/>`,
  ).join('\n');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <!-- Background -->
  <rect width="${W}" height="${H}" fill="${BG}"/>

  <!-- Ambient glow -->
  <defs>
    <radialGradient id="glow" cx="75%" cy="50%" r="40%">
      <stop offset="0%"   stop-color="${ORANGE}" stop-opacity="0.10"/>
      <stop offset="100%" stop-color="${ORANGE}" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowTop" cx="20%" cy="10%" r="50%">
      <stop offset="0%"   stop-color="${CYAN}"   stop-opacity="0.05"/>
      <stop offset="100%" stop-color="${CYAN}"   stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#glowTop)"/>

  <!-- Left accent bar -->
  <rect x="0" y="0" width="3" height="${H}" fill="${ORANGE}" opacity="0.8"/>

  <!-- Logo mark (top left) -->
  ${logoBars}

  <!-- Wordmark -->
  <text x="116" y="106"
    font-family="system-ui, -apple-system, 'Helvetica Neue', sans-serif"
    font-size="13" font-weight="700" fill="${WHITE}" letter-spacing="2">BLOQR</text>
  <text x="116" y="120"
    font-family="system-ui, -apple-system, 'Helvetica Neue', sans-serif"
    font-size="10" font-weight="400" fill="${MUTED}" letter-spacing="3">GOOD INTERNET HABITS. AUTOMATED.</text>

  <!-- Title -->
  ${titleSvg}

  <!-- Description -->
  ${descSvg}

  <!-- Filter bars -->
  ${barSvg}

  <!-- Domain hint -->
  <text x="${W - 40}" y="${H - 28}"
    font-family="system-ui, -apple-system, 'Helvetica Neue', sans-serif"
    font-size="13" font-weight="500" fill="${MUTED2}"
    text-anchor="end" letter-spacing="0.3">${CANONICAL_DOMAIN}</text>
</svg>`;

  return sharp(Buffer.from(svg))
    .resize(W, H)
    .png({ compressionLevel: 9 })
    .toBuffer();
}
