# Bloqr — Brand & Design Handoff

> **Audience:** AI agents implementing or styling any web property in the Bloqr suite.
> This document is the single source of truth for visual design, branding, color, typography,
> spacing, component patterns, and layout. Apply these values exactly. Do not invent
> alternatives unless explicitly noted as flexible.
>
> Companion documents in `brand/`:
> - `BLOQR_COPY_PATTERNS.md` — copy templates and forbidden phrases
> - `BLOQR_DESIGN_LANGUAGE.md` — product strategy, personas, and voice
> - `BLOQR_ETHOS.md` — mission, philosophy, and user promise
> - `tokens.css` — canonical design-reference CSS custom properties
>
> **Implementation note for this repo:** the landing site runtime tokens come from
> `src/styles/global.css`, which uses abbreviated aliases rather than the full
> `--color-*` names in `brand/tokens.css`. When styling this repo, use the
> `global.css` variables that exist at runtime. Quick mapping:
> - `--color-bg` / `--color-surface-0` → `--bg-base`
> - `--color-accent` / primary orange accent → `--orange`
> - `--color-text` / primary foreground text → `--text-1`
> - If a property needs a token that only exists in `brand/tokens.css`, import or
>   mirror it explicitly instead of assuming the `--color-*` name already exists.

---

## 1. Brand Identity

### Product Name

- **Correct:** `Bloqr`
- **Never:** `BLOQR`, `bloqr`, `BloQr`
- Displayed in `Space Grotesk` font weight 700 in all logotype contexts.

### Tagline (canonical)

> Internet Hygiene. Automated.

### Domain

- Primary: `https://bloqr.ai`
- App: `https://app.bloqr.jaysonknight.com` (transitioning to `app.bloqr.ai`)
- Docs: `https://docs.bloqr.jaysonknight.com` (transitioning to `docs.bloqr.ai`)
- API: `https://api.bloqr.jaysonknight.com` (transitioning to `api.bloqr.ai`)
- Landing: `https://bloqr.jaysonknight.com` (transitioning to `bloqr.ai`)
- JSR package: `https://jsr.io/@jk-com/adblock-compiler` (transitioning to `@bloqr/compiler`)

### Logo

- Source file: `brand/logo.svg` in `jaypatrick/bloqr-landing`
- Raw URL: `https://raw.githubusercontent.com/jaypatrick/bloqr-landing/main/brand/logo.svg`
- Usage: Always use the SVG. Do not rasterize for web use. Minimum display size: 24px height.
- On dark backgrounds (standard): use full-color version.
- Clear space: minimum 1× the logo height on all sides.
- Do not recolor, rotate, stretch, or add drop shadows to the logo mark.

#### Logo Mark — Bar Colors (canonical)

The logo mark consists of three horizontal bars in descending relative width. Their order and colors are fixed:

| Bar | Relative width | Color | Value | Opacity |
|-----|----------------|-------|-------|---------|
| Bar 1 | Longest | White | `#F1F5F9` | 1.0 (full) |
| Bar 2 | Medium | Cyan  | `#00D4FF` | Context-specific; often full in OG/image renders |
| Bar 3 | Shortest | Orange | `#FF5500` | 1.0 (full) |

> **Canonical rule:** preserve the three-bar order, descending proportions, and fixed colors. Exact pixel widths may vary by renderer or context (for example, OG image generation vs. nav/UI lockups), and the cyan second bar may be rendered fully opaque in image-generation contexts.
>
> **The cyan second bar is a consistent brand element — it must appear at this position in the logo mark in all contexts: nav, OG images, favicons, and any other brand lockup.**

---

## 2. Color System

### Philosophy

Dark-first. Deep space navy backgrounds. Orange primary accent. Cyan secondary accent.
Never use white or light backgrounds on any Bloqr property — the brand is exclusively dark-mode.

### Background Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-bg-base` | `#070B14` | Page background — the default canvas |
| `--color-bg-surface` | `#0E1829` | Cards, panels, sidebars |
| `--color-bg-elevated` | `#162035` | Hover states, tooltips, code blocks |
| `--color-bg-overlay` | `#1C2A45` | Modals, popovers, dropdowns |

### Primary Accent — Orange

| Token | Hex | Usage |
|---|---|---|
| `--color-orange-500` | `#FF5500` | Primary CTAs, active highlights, section labels |
| `--color-orange-400` | `#FF7033` | Hover state for orange elements |
| `--color-orange-600` | `#CC4400` | Active/pressed state |
| `--color-orange-900` | `#1A0A00` | Orange-tinted surface backgrounds |
| `--color-orange-glow` | `rgba(255, 85, 0, 0.15)` | Glow effects, box-shadow tints |

**Orange glow shadow recipe (CTA buttons):**
```css
box-shadow: 0 0 20px rgba(255, 85, 0, 0.30);
/* hover: */
box-shadow: 0 0 32px rgba(255, 85, 0, 0.45);
```

### Secondary Accent — Cyan

| Token | Hex | Usage |
|---|---|---|
| `--color-cyan-500` | `#00D4FF` | Secondary highlights, links, info states |
| `--color-cyan-400` | `#33DDFF` | Hover state for cyan elements |
| `--color-cyan-900` | `#001829` | Cyan-tinted surface backgrounds |
| `--color-cyan-glow` | `rgba(0, 212, 255, 0.12)` | Glow effects |

### Text Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-text-primary` | `#F1F5F9` | Headings, primary body copy |
| `--color-text-secondary` | `#94A3B8` | Subtext, descriptions, captions |
| `--color-text-muted` | `#475569` | Placeholders, disabled states, timestamps |
| `--color-text-inverse` | `#070B14` | Text rendered on orange or light backgrounds |

### Border Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-border` | `#1E2D40` | Default borders |
| `--color-border-subtle` | `#162035` | Very subtle separators, dividers |
| `--color-border-accent` | `#2A4060` | Elevated or hover borders |

### Semantic Colors

| Token | Hex | Usage |
|---|---|---|
| `--color-success` | `#22C55E` | Success states, confirmations |
| `--color-warning` | `#F59E0B` | Warning states |
| `--color-error` | `#EF4444` | Error states, destructive actions |
| `--color-info` | `#00D4FF` | Info states (same as cyan-500) |

### Global Gradient Recipes

**Radial hero glow (used behind hero content):**
```css
background:
  radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255, 85, 0, 0.12), transparent),
  radial-gradient(ellipse 60% 40% at 80% 60%, rgba(0, 212, 255, 0.06), transparent),
  #070B14;
```

**Orange divider glow line:**
```css
height: 1px;
background: linear-gradient(90deg, transparent, #FF5500 50%, transparent);
opacity: 0.3;
```

**Card gradient border (feature cards):**
```css
background: linear-gradient(135deg, #0E1829, #162035);
border: 1px solid #1E2D40;
```

---

## 3. Typography

### Font Families

| Role | Font Name | Fallback stack | npm package |
|---|---|---|---|
| Display / UI | **Space Grotesk** | `'DM Sans', system-ui, sans-serif` | `@fontsource/space-grotesk` |
| Body (long-form) | **Inter** | `'Space Grotesk', system-ui, sans-serif` | `@fontsource/inter` |
| Monospace / Code | **JetBrains Mono** | `'Fira Code', 'Cascadia Code', monospace` | `@fontsource/jetbrains-mono` |

**Self-host all fonts.** Do not load from Google Fonts CDN — it adds an external DNS round-trip
and contradicts Bloqr's privacy-first infrastructure posture.

### Weights Loaded

**Space Grotesk:** 400, 500, 600, 700
**JetBrains Mono:** 400, 500, 700
**Inter (if used for long-form body):** 400, 500

### CSS Font Import Block

```css
@import '@fontsource/space-grotesk/400.css';
@import '@fontsource/space-grotesk/500.css';
@import '@fontsource/space-grotesk/600.css';
@import '@fontsource/space-grotesk/700.css';
@import '@fontsource/jetbrains-mono/400.css';
@import '@fontsource/jetbrains-mono/500.css';
@import '@fontsource/jetbrains-mono/700.css';
```

### CSS Font Tokens

```css
--font-display: 'Space Grotesk', 'DM Sans', system-ui, sans-serif;
--font-body:    'Inter', 'Space Grotesk', system-ui, sans-serif;
--font-mono:    'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
```

### Type Scale

| Token | rem | px |
|---|---|---|
| `--text-xs` | `0.75rem` | 12px |
| `--text-sm` | `0.875rem` | 14px |
| `--text-base` | `1rem` | 16px |
| `--text-lg` | `1.125rem` | 18px |
| `--text-xl` | `1.25rem` | 20px |
| `--text-2xl` | `1.5rem` | 24px |
| `--text-3xl` | `1.875rem` | 30px |
| `--text-4xl` | `2.25rem` | 36px |
| `--text-5xl` | `3rem` | 48px |
| `--text-6xl` | `3.75rem` | 60px |
| `--text-7xl` | `4.5rem` | 72px |

### Font Weights

| Token | Value |
|---|---|
| `--font-regular` | 400 |
| `--font-medium` | 500 |
| `--font-semibold` | 600 |
| `--font-bold` | 700 |
| `--font-extrabold` | 800 |

### Line Heights

| Token | Value |
|---|---|
| `--leading-tight` | 1.1 |
| `--leading-snug` | 1.25 |
| `--leading-normal` | 1.5 |
| `--leading-loose` | 1.75 |

### Letter Spacing

| Token | Value |
|---|---|
| `--tracking-tight` | `-0.02em` |
| `--tracking-normal` | `0` |
| `--tracking-wide` | `0.05em` |
| `--tracking-wider` | `0.1em` |
| `--tracking-widest` | `0.2em` |

### Typography Patterns (Exact CSS)

**Hero headline:**
```css
font-family: var(--font-display);
font-size: clamp(2.5rem, 6vw, 4.5rem);
font-weight: 800;
letter-spacing: -0.03em;
line-height: 1.05;
color: #F1F5F9;
```

**Section label (eyebrow text above titles):**
```css
font-size: 11px;
font-weight: 700;
letter-spacing: 0.2em;
text-transform: uppercase;
color: #FF5500;
```

**Section title:**
```css
font-size: clamp(1.75rem, 4vw, 2.75rem);
font-weight: 800;
letter-spacing: -0.03em;
line-height: 1.1;
color: #F1F5F9;
```

**Body / section description:**
```css
font-size: 1.05rem;
line-height: 1.65;
color: #94A3B8;
```

**Code / mono:**
```css
font-family: var(--font-mono);
font-size: 0.875rem;
line-height: 1.6;
color: #F1F5F9;
```

**Nav links:**
```css
font-size: 14px;
font-weight: 500;
color: #94A3B8;
/* hover: */
color: #F1F5F9;
```

---

## 4. Spacing

| Token | rem | px |
|---|---|---|
| `--space-1` | `0.25rem` | 4px |
| `--space-2` | `0.5rem` | 8px |
| `--space-3` | `0.75rem` | 12px |
| `--space-4` | `1rem` | 16px |
| `--space-5` | `1.25rem` | 20px |
| `--space-6` | `1.5rem` | 24px |
| `--space-8` | `2rem` | 32px |
| `--space-10` | `2.5rem` | 40px |
| `--space-12` | `3rem` | 48px |
| `--space-16` | `4rem` | 64px |
| `--space-20` | `5rem` | 80px |
| `--space-24` | `6rem` | 96px |
| `--space-32` | `8rem` | 128px |

**Section vertical padding:** `96px` top and bottom (`--space-24`) on desktop; `64px` on mobile.

---

## 5. Layout

### Container

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}
```

### Breakpoints

| Token | Width |
|---|---|
| `--max-width-sm` | `640px` |
| `--max-width-md` | `768px` |
| `--max-width-lg` | `1024px` |
| `--max-width-xl` | `1280px` |
| `--max-width-2xl` | `1440px` |

### Page Section Order (v1)

```
Nav → Hero → Problem/VPN → Features → HowItWorks → Audiences → CTA Banner → Footer
```

### Recommended Section Order (v2)

```
Nav → Hero → Problem/VPN → Features → HowItWorks → BYO vs. Ours → Audiences → Pricing → CTA Banner → Footer
```

---

## 6. Border Radius

| Token | Value |
|---|---|
| `--radius-sm` | `0.25rem` (4px) |
| `--radius-md` | `0.5rem` (8px) |
| `--radius-lg` | `0.75rem` (12px) |
| `--radius-xl` | `1rem` (16px) |
| `--radius-2xl` | `1.5rem` (24px) |
| `--radius-full` | `9999px` |

---

## 7. Shadows

| Token | Value |
|---|---|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.4)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.5)` |
| `--shadow-lg` | `0 8px 32px rgba(0,0,0,0.6)` |
| `--shadow-orange` | `0 0 24px rgba(255,85,0,0.15), 0 0 48px rgba(255,85,0,0.15)` |
| `--shadow-cyan` | `0 0 24px rgba(0,212,255,0.12)` |

---

## 8. Animation & Motion

### Easing Curves

| Token | Value |
|---|---|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-in-out` | `cubic-bezier(0.45, 0, 0.55, 1)` |

### Duration Tokens

| Token | Value |
|---|---|
| `--duration-fast` | `150ms` |
| `--duration-base` | `250ms` |
| `--duration-slow` | `400ms` |

### Standard Interaction Patterns

**Button hover:**
```css
transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
transform: translateY(-1px);
```

**Card hover:**
```css
transition: border-color 150ms, background 150ms;
border-color: #2A4060;
background: #162035;
```

**Focus ring (keyboard accessibility):**
```css
:focus-visible {
  outline: 2px solid #FF5500;
  outline-offset: 3px;
  border-radius: 3px;
}
:focus:not(:focus-visible) {
  outline: none;
}
```

---

## 9. Component Patterns

### Buttons

**Primary (orange CTA):**
```css
display: inline-flex;
align-items: center;
gap: 8px;
padding: 10px 20px;
border-radius: 8px;
font-family: 'Space Grotesk', system-ui, sans-serif;
font-size: 14px;
font-weight: 600;
color: #ffffff;
background: #FF5500;
border: none;
box-shadow: 0 0 20px rgba(255, 85, 0, 0.30);
transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1);
cursor: pointer;
text-decoration: none;
white-space: nowrap;
/* hover: */
background: #FF7033;
box-shadow: 0 0 32px rgba(255, 85, 0, 0.45);
transform: translateY(-1px);
```

**Outline (secondary):**
```css
background: transparent;
color: #F1F5F9;
border: 1px solid #2A3F5A;
/* hover: */
border-color: #94A3B8;
background: #0E1829;
```

**Ghost (tertiary):**
```css
background: transparent;
color: #94A3B8;
border: none;
/* hover: */
color: #F1F5F9;
```

**Small button modifier:**
```css
padding: 7px 14px;
font-size: 13px;
```

### Cards / Feature Tiles

```css
background: #0E1829;
border: 1px solid #1E2D40;
border-radius: 12px;
padding: 24px;
transition: border-color 150ms, background 150ms;
/* hover: */
border-color: #2A4060;
background: #162035;
```

### Section Structure (reusable)

```css
.section {
  padding: 96px 0;
}
.section-label {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #FF5500;
  margin-bottom: 16px;
}
.section-title {
  font-size: clamp(1.75rem, 4vw, 2.75rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 16px;
  color: #F1F5F9;
}
.section-desc {
  font-size: 1.05rem;
  color: #94A3B8;
  line-height: 1.65;
}
```

### Navigation Bar

```css
position: fixed;
top: 0;
left: 0;
right: 0;
z-index: 50;
height: 64px;
background: rgba(7, 11, 20, 0.85);
backdrop-filter: blur(12px);
border-bottom: 1px solid #1E2D40;
```

### Code Blocks

```css
background: #0E1829;
border: 1px solid #1E2D40;
border-radius: 8px;
padding: 20px 24px;
font-family: 'JetBrains Mono', monospace;
font-size: 13px;
line-height: 1.6;
color: #F1F5F9;
overflow-x: auto;
```

### Input / Form Fields

```css
background: #0E1829;
border: 1px solid #1E2D40;
border-radius: 8px;
padding: 10px 14px;
font-family: 'Space Grotesk', system-ui, sans-serif;
font-size: 14px;
color: #F1F5F9;
outline: none;
transition: border-color 150ms;
/* focus: */
border-color: #FF5500;
/* placeholder: */
color: #475569;
```

### Badge / Pill

```css
display: inline-flex;
align-items: center;
gap: 6px;
padding: 4px 10px;
border-radius: 9999px;
font-size: 12px;
font-weight: 600;
/* orange variant: */
background: rgba(255, 85, 0, 0.12);
color: #FF5500;
border: 1px solid rgba(255, 85, 0, 0.25);
/* cyan variant: */
background: rgba(0, 212, 255, 0.10);
color: #00D4FF;
border: 1px solid rgba(0, 212, 255, 0.20);
```

---

## 10. Hero Section Spec

```
Height: 100vh minimum (min-height: 100dvh)
Background: radial gradient recipe (see §2 Global Gradient Recipes)
Content alignment: centered horizontally, vertically centered with slight upward offset (padding-top: 96px)
Max content width: 800px centered
```

**Structure:**
1. Badge/pill — e.g. "Now in beta" or "AI-powered"
2. H1 headline — Space Grotesk 800, clamp(2.5rem, 6vw, 4.5rem), tracking -0.03em
3. Subheadline — Space Grotesk 400/500, ~1.25rem, color `#94A3B8`
4. CTA button group — primary orange + ghost/outline secondary
5. Optional: social proof line — "X users on waitlist" or similar

---

## 11. Voice Rules (Summary — full detail in BLOQR_DESIGN_LANGUAGE.md)

- Confident without arrogance.
- Technical without jargon (unless the audience is developers).
- Short declarative sentences for impact.
- Specificity over vagueness: "48,291 rules" not "thousands of rules".
- "You"-focused copy: what you get, not what we do.
- Never use passive voice when direct is possible.

**Never say:** leveraging, seamlessly, best-in-class, enterprise-grade, revolutionary, game-changing.

---

## 12. Internal Routes (as of April 2026)

| Route | Purpose |
|---|---|
| `/` | Main landing page |
| `/vpn-myths` | SEO asset — VPN alternatives |
| `/why-not-private` | Education — why privacy defaults are broken |
| `/about` | About / founder note |
| `/blog` | Blog index |
| `/changelog` | Product changelog |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/rss.xml` | RSS feed |

---

## 13. Canonical CSS `:root` Block

Copy this entire block into any Bloqr-suite project's root stylesheet as a reference implementation. For the canonical source of truth, use `brand/tokens.css`; this block is equivalent in purpose but may differ in how some values are expressed.

```css
:root {
  /* BACKGROUNDS */
  --color-bg-base:     #070B14;
  --color-bg-surface:  #0E1829;
  --color-bg-elevated: #162035;
  --color-bg-overlay:  #1C2A45;

  /* ORANGE */
  --color-orange-500:  #FF5500;
  --color-orange-400:  #FF7033;
  --color-orange-600:  #CC4400;
  --color-orange-900:  #1A0A00;
  --color-orange-glow: rgba(255, 85, 0, 0.15);

  /* CYAN */
  --color-cyan-500:    #00D4FF;
  --color-cyan-400:    #33DDFF;
  --color-cyan-900:    #001829;
  --color-cyan-glow:   rgba(0, 212, 255, 0.12);

  /* TEXT */
  --color-text-primary:   #F1F5F9;
  --color-text-secondary: #94A3B8;
  --color-text-muted:     #475569;
  --color-text-inverse:   #070B14;

  /* BORDERS */
  --color-border:        #1E2D40;
  --color-border-subtle: #162035;
  --color-border-accent: #2A4060;

  /* SEMANTIC */
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  --color-error:   #EF4444;
  --color-info:    #00D4FF;

  /* FONTS */
  --font-display: 'Space Grotesk', 'DM Sans', system-ui, sans-serif;
  --font-body:    'Inter', 'Space Grotesk', system-ui, sans-serif;
  --font-mono:    'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;

  /* TYPE SCALE */
  --text-xs:   0.75rem;
  --text-sm:   0.875rem;
  --text-base: 1rem;
  --text-lg:   1.125rem;
  --text-xl:   1.25rem;
  --text-2xl:  1.5rem;
  --text-3xl:  1.875rem;
  --text-4xl:  2.25rem;
  --text-5xl:  3rem;
  --text-6xl:  3.75rem;
  --text-7xl:  4.5rem;

  /* WEIGHTS */
  --font-regular:   400;
  --font-medium:    500;
  --font-semibold:  600;
  --font-bold:      700;
  --font-extrabold: 800;

  /* LEADING */
  --leading-tight:  1.1;
  --leading-snug:   1.25;
  --leading-normal: 1.5;
  --leading-loose:  1.75;

  /* TRACKING */
  --tracking-tight:   -0.02em;
  --tracking-normal:   0;
  --tracking-wide:     0.05em;
  --tracking-wider:    0.1em;
  --tracking-widest:   0.2em;

  /* SPACING */
  --space-1:  0.25rem;
  --space-2:  0.5rem;
  --space-3:  0.75rem;
  --space-4:  1rem;
  --space-5:  1.25rem;
  --space-6:  1.5rem;
  --space-8:  2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;
  --space-20: 5rem;
  --space-24: 6rem;
  --space-32: 8rem;

  /* RADIUS */
  --radius-sm:   0.25rem;
  --radius-md:   0.5rem;
  --radius-lg:   0.75rem;
  --radius-xl:   1rem;
  --radius-2xl:  1.5rem;
  --radius-full: 9999px;

  /* SHADOWS */
  --shadow-sm:     0 1px 3px rgba(0,0,0,0.4);
  --shadow-md:     0 4px 12px rgba(0,0,0,0.5);
  --shadow-lg:     0 8px 32px rgba(0,0,0,0.6);
  --shadow-orange: 0 0 24px rgba(255,85,0,0.15), 0 0 48px rgba(255,85,0,0.15);
  --shadow-cyan:   0 0 24px rgba(0,212,255,0.12);

  /* ANIMATION */
  --ease-out:        cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out:     cubic-bezier(0.45, 0, 0.55, 1);
  --duration-fast:   150ms;
  --duration-base:   250ms;
  --duration-slow:   400ms;

  /* LAYOUT */
  --max-width-sm:  640px;
  --max-width-md:  768px;
  --max-width-lg:  1024px;
  --max-width-xl:  1280px;
  --max-width-2xl: 1440px;
}
```

---

*Last updated: April 2026*
*Source of truth: `jaypatrick/bloqr-landing` → `brand/BLOQR_BRAND_HANDOFF.md`*
*Maintained by Jayson Knight + Bloqr AI assistant*
