/**
 * Generates public/og-image.png — 1200×630 Open Graph image
 * Uses the brand palette: #070B14 bg, #FF5500 orange, #00D4FF cyan
 * Run with: node scripts/gen-og.mjs
 */

import sharp from 'sharp';
import { mkdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT   = join(__dir, '../public/og-image.png');

await mkdir(join(__dir, '../public'), { recursive: true });

const W = 1200;
const H = 630;

// Filter bars — the brand "compiler" icon, large and right-anchored
// Each bar: x, y, width, height, opacity
const bars = [
  { w: 340, y: 180, opacity: 0.12 },
  { w: 260, y: 236, opacity: 0.18 },
  { w: 190, y: 292, opacity: 0.25 },
  { w: 130, y: 348, opacity: 0.32 },
  { w:  80, y: 404, opacity: 1.00, accent: true }, // compiled output — orange
];

const barHeight = 42;
const barX      = W - 420; // right-anchored

// Dot grid (subtle background texture)
const dotRows  = 18;
const dotCols  = 28;
const dotSize  = 1.5;
const dotSpacX = W / dotCols;
const dotSpacY = H / dotRows;
let dots = '';
for (let r = 0; r < dotRows; r++) {
  for (let c = 0; c < dotCols; c++) {
    const x = c * dotSpacX + dotSpacX / 2;
    const y = r * dotSpacY + dotSpacY / 2;
    dots += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${dotSize}" fill="rgba(255,255,255,0.04)"/>`;
  }
}

// Bar SVG elements
let barSvg = '';
for (const b of bars) {
  const fill   = b.accent ? '#FF5500' : 'white';
  const rx     = 6;
  barSvg += `<rect x="${barX}" y="${b.y}" width="${b.w}" height="${barHeight}"
    rx="${rx}" fill="${fill}" opacity="${b.opacity}"/>`;
}

// Glow behind bars
const glowSvg = `
  <defs>
    <radialGradient id="glow" cx="75%" cy="50%" r="40%">
      <stop offset="0%"   stop-color="#FF5500" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#FF5500" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="glowTop" cx="20%" cy="10%" r="50%">
      <stop offset="0%"   stop-color="#00D4FF" stop-opacity="0.06"/>
      <stop offset="100%" stop-color="#00D4FF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <rect width="${W}" height="${H}" fill="url(#glowTop)"/>
`;

// Horizontal divider line (subtle)
const divider = `<line x1="80" y1="390" x2="620" y2="390"
  stroke="rgba(255,85,0,0.35)" stroke-width="1"/>`;

// Badge pill
const badge = `
  <rect x="80" y="152" width="236" height="30" rx="15"
    fill="rgba(255,85,0,0.12)" stroke="rgba(255,85,0,0.35)" stroke-width="1"/>
  <text x="198" y="172" font-family="system-ui, -apple-system, sans-serif"
    font-size="11" font-weight="700" fill="#FF5500"
    text-anchor="middle" letter-spacing="1.5">PRIVACY INFRASTRUCTURE</text>
`;

// Mini logo bars (top-left, small)
const logoBarW = [22, 16, 9];
const logoBarColors = ['white', 'rgba(255,255,255,0.55)', '#FF5500'];
let logoBars = '';
for (let i = 0; i < 3; i++) {
  logoBars += `<rect x="80" y="${96 + i * 14}" width="${logoBarW[i]}" height="8"
    rx="2" fill="${logoBarColors[i]}"/>`;
}

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="#070B14"/>

  <!-- Dot grid texture -->
  ${dots}

  <!-- Ambient glow -->
  ${glowSvg}

  <!-- Left border accent -->
  <rect x="0" y="0" width="3" height="${H}" fill="#FF5500" opacity="0.8"/>

  <!-- Logo mark (top left) -->
  ${logoBars}

  <!-- Logo wordmark -->
  <text x="116" y="106"
    font-family="system-ui, -apple-system, 'Helvetica Neue', sans-serif"
    font-size="13" font-weight="700" fill="white" letter-spacing="2">ADBLOCK</text>
  <text x="116" y="120"
    font-family="system-ui, -apple-system, 'Helvetica Neue', sans-serif"
    font-size="10" font-weight="400" fill="rgba(255,255,255,0.45)" letter-spacing="3">COMPILER</text>

  <!-- Badge -->
  ${badge}

  <!-- Main headline -->
  <text x="80" y="266"
    font-family="system-ui, -apple-system, 'Helvetica Neue', sans-serif"
    font-size="62" font-weight="800" fill="white" letter-spacing="-1.5">Privacy that</text>
  <text x="80" y="340"
    font-family="system-ui, -apple-system, 'Helvetica Neue', sans-serif"
    font-size="62" font-weight="800" fill="#FF5500" letter-spacing="-1.5">replaces VPNs.</text>

  <!-- Divider -->
  ${divider}

  <!-- Subline -->
  <text x="80" y="424"
    font-family="system-ui, -apple-system, 'Helvetica Neue', sans-serif"
    font-size="19" font-weight="400" fill="rgba(255,255,255,0.5)" letter-spacing="0">
    Compiler-as-a-Service · Edge-first · AI threat intelligence
  </text>

  <!-- Tier pills -->
  <rect x="80"  y="458" width="108" height="26" rx="13" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" stroke-width="1"/>
  <text x="134" y="475" font-family="system-ui,sans-serif" font-size="11" font-weight="600"
    fill="rgba(255,255,255,0.55)" text-anchor="middle" letter-spacing="0.5">Hobbyist</text>

  <rect x="198" y="458" width="72"  height="26" rx="13" fill="rgba(255,85,0,0.12)"    stroke="rgba(255,85,0,0.35)"   stroke-width="1"/>
  <text x="234" y="475" font-family="system-ui,sans-serif" font-size="11" font-weight="600"
    fill="#FF5500" text-anchor="middle" letter-spacing="0.5">Pro</text>

  <rect x="280" y="458" width="108" height="26" rx="13" fill="rgba(0,212,255,0.07)"   stroke="rgba(0,212,255,0.2)"   stroke-width="1"/>
  <text x="334" y="475" font-family="system-ui,sans-serif" font-size="11" font-weight="600"
    fill="#00D4FF" text-anchor="middle" letter-spacing="0.5">Enterprise</text>

  <!-- Right-side filter bars (brand icon) -->
  ${barSvg}

  <!-- Connector label next to bottom bar -->
  <text x="${barX + 90}" y="${bars[4].y + barHeight / 2 + 5}"
    font-family="system-ui,sans-serif" font-size="12" font-weight="700"
    fill="#FF5500" letter-spacing="1">compiled output</text>

  <!-- Domain hint (bottom right) -->
  <text x="${W - 40}" y="${H - 28}"
    font-family="system-ui, -apple-system, 'Helvetica Neue', sans-serif"
    font-size="13" font-weight="500" fill="rgba(255,255,255,0.25)"
    text-anchor="end" letter-spacing="0.3">adblock-compiler.com</text>

</svg>`;

await sharp(Buffer.from(svg))
  .resize(W, H)
  .png({ compressionLevel: 9 })
  .toFile(OUT);

console.log(`✓ OG image written to ${OUT}`);
