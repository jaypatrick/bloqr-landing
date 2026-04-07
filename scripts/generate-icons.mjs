/**
 * scripts/generate-icons.mjs
 *
 * Generates PWA icons from brand/logo.svg using sharp.
 * Outputs icons to public/icons/ and updates public/site.webmanifest.
 *
 * Run: node scripts/generate-icons.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

// Dynamically import sharp (devDependency)
const sharp = (await import('sharp')).default;

const SIZES = [192, 512];
const iconsDir = join(root, 'public', 'icons');
const svgPath  = join(root, 'brand', 'logo.svg');

if (!existsSync(svgPath)) {
  console.warn('⚠ brand/logo.svg not found — skipping icon generation.');
  process.exit(0);
}

mkdirSync(iconsDir, { recursive: true });

const svgBuffer = readFileSync(svgPath);
const icons = [];

for (const size of SIZES) {
  const outFile = join(iconsDir, `icon-${size}.png`);
  await sharp(svgBuffer)
    .resize(size, size)
    .png()
    .toFile(outFile);
  icons.push({ src: `/icons/icon-${size}.png`, sizes: `${size}x${size}`, type: 'image/png' });
  console.log(`✓ Generated ${outFile}`);
}

// Update site.webmanifest with generated icons
const manifestPath = join(root, 'public', 'site.webmanifest');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
manifest.icons = icons;
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('✓ Updated public/site.webmanifest');
