/**
 * scripts/generate-icons.mjs
 *
 * Generates public/icon-192.png and public/icon-512.png from an inline SVG.
 * Uses sharp (already in devDependencies).
 *
 * Run: node scripts/generate-icons.mjs
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Bloqr "B" mark: dark navy background, orange lettermark
// Note: the canonical 3-bar logo mark (bar 1=white, bar 2=cyan, bar 3=orange)
// is used in favicon/OG assets. This icon uses the simplified "B" lettermark
// for PWA/app icon contexts where the bars would be too small to read.
const svgTemplate = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.1875)}" fill="#070B14"/>
  <text
    x="50%"
    y="54%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="Arial, system-ui, sans-serif"
    font-weight="800"
    font-size="${Math.round(size * 0.55)}"
    fill="#FF5500"
  >B</text>
</svg>
`;

async function generateIcon(size, filename) {
  const svgBuffer = Buffer.from(svgTemplate(size));
  const outputPath = join(publicDir, filename);
  await sharp(svgBuffer)
    .png()
    .toFile(outputPath);
  console.log(`✓ Generated ${filename} (${size}×${size})`);
}

await generateIcon(192, 'icon-192.png');
await generateIcon(512, 'icon-512.png');

console.log('Icons generated successfully.');
