# Bloqr Design System

**Tagline:** Internet Hygiene. Automated.
**Mantra:** Set it. Bloqr it. Forget it.

Bloqr is a vendor-agnostic layer that sits between your internet traffic and the ads, trackers, and malware trying to exploit it. AI-curated filter lists, multi-instance sync, natural-language rule building — deployed to AdGuard, NextDNS, Pi-hole, uBlock, or Bloqr's own DNS. Dark-first, technical-but-friendly, and allergic to marketing buzzwords.

This folder is the source of truth for every Bloqr web property. Read before designing, copy assets out when building.

---

## Sources

All content here was distilled from these originals (not preloaded — references for the maintainer):

- **Brand docs (pre-copied):** `brand/BLOQR_BRAND_HANDOFF.md`, `BLOQR_COPY_PATTERNS.md`, `BLOQR_DESIGN_LANGUAGE.md`, `BLOQR_ETHOS.md`
- **Design tokens (canonical):** `tokens.css` (mirrored from the original upload, uses `--color-*` names)
- **Landing site codebase:** `adblock-compiler.landing/` (Astro + Svelte) — runtime CSS lives at `src/styles/global.css` using abbreviated aliases (`--bg-base`, `--orange`, `--text-1`)
- **GitHub repo:** `jaypatrick/bloqr-landing` — canonical source of the brand folder above
- **Logo source:** `assets/logo.svg` (original upload) and `assets/bloqr-logo.svg` (canonical wordmark rebuild)

---

## Index

| Path | What |
|---|---|
| `README.md` | This file. Start here. |
| `SKILL.md` | Agent Skills manifest — drop this folder into `~/.claude/skills/bloqr-design/` to invoke it. |
| `colors_and_type.css` | Canonical CSS variables: backgrounds, orange/cyan ramps, foregrounds, type scale, motion, radii. |
| `tokens.css` | The original token file from the landing repo, preserved verbatim. |
| `brand/` | Voice, copy patterns, forbidden phrases, ethos, full handoff. |
| `assets/` | Logos (full + mark), favicon, app icons, OG image. |
| `preview/` | Design System cards (typography, color, spacing, components, brand). |
| `ui_kits/landing/` | High-fidelity recreation of the Bloqr marketing site: Nav, Hero, Problem, Features, HowItWorks, Pricing, Footer. |

---

## Content Fundamentals

Bloqr writes like a senior engineer explaining something to a peer — confident, specific, no hedging. Humor is dry and occasional; it earns its place by landing a point, not by filling space.

**Tone:** Confident without arrogance. Technical without jargon (unless the reader is a developer). Firm analogies. Short declarative sentences.

**Person:** Second person — "you" focused. What **you** get, not what **we** do. Never "our users."

**Casing:** Sentence case headlines (`Point. Click. Done.`). Eyebrows are UPPERCASE with wide tracking. The product name is always `Bloqr` — never `BLOQR`, `bloqr`, or `BloQr`. The concept "Browsing Hygiene" and "Internet Hygiene" are always capitalised.

**Punctuation:** Headlines use periods, not exclamation points. Em dashes for asides. Line breaks in big headlines land the rhythm: `Point. Click. / Done.`

**Analogies > adjectives.** "Washing your hands, but for everything you do online." "Less than one mediocre cocktail." "Running before your next coffee."

**Specificity.** `48,291 rules deduplicated`, not `thousands of rules`. `300+ global PoPs`, not `massive network`.

**Humor, sparingly.** Dry, self-aware, never smarmy. Pricing asides like *"Roughly the price of a decent coffee"*, or feature descriptions ending *"Boring? Yes. Essential? Absolutely."*

**Approved mantras (use verbatim):**
- Set it. Bloqr it. Forget it.
- Bring your own. Or use ours.
- Internet Hygiene. Automated.
- The privacy you didn't know you needed.
- Browsing Hygiene (the concept — always capitalised)

**Forbidden vocabulary (always):** leveraging, seamlessly, best-in-class, enterprise-grade, revolutionary, game-changing, world-class, cutting-edge, state-of-the-art, robust, powerful (standalone), "click here", "stay tuned", "coming soon!". See `brand/BLOQR_COPY_PATTERNS.md §9` for the full list and replacements.

**Emoji:** Rarely. One per section max, used as a meta-label (🔌 on the BYO pill, 📖 on the myths banner, 🔒/⚡ on comparison cards). Never in headlines or body copy. Prefer the three-bar mark, numeric step tokens (`01`, `02`), or a text dot (`·`) to decorate.

**Vibe:** Privacy-community peer who happens to have shipped infrastructure. Knows what Hagezi and OISD are. Does not oversell. Will tell you when Tor is the right tool.

---

## Visual Foundations

**Motif.** Three descending horizontal bars in the logo — a filter, a stack, a signal strength meter. The shortest bar is always orange; it's the accent that anchors every layout. Secondary bar is cyan. White/slate is the neutral. This descending-bar rhythm reappears in lists, in the "01 / 02 / 03" step numerals, and in the tapered divider glow.

**Palette.** Dark-first, no exceptions. `#070B14` canvas, `#0E1829` surfaces, `#162035` elevated. Orange `#FF5500` is the only hot accent. Cyan `#00D4FF` is its cooler counterpart — used for links, active nav states, secondary CTAs, and the middle bar of the logo. Never use white or light backgrounds on a Bloqr property. Semantic colors (success/warn/error) only appear in product UI, never marketing.

**Type.** Space Grotesk for display and UI (400/500/600/700). Inter for long-form body. JetBrains Mono for code and numeric labels. Headlines are `clamp(2.5rem, 6vw, 4.5rem)`, weight 800, tracking -0.03em, line-height 1.05. Eyebrows are 11px, weight 700, tracking 0.2em, uppercase, orange. Body is 1.05rem, line-height 1.65, slate-400.

**Spacing.** 4px base unit. Section padding is `96px` top/bottom desktop, `64px` mobile. Container max-width `1200px`, 24px gutters.

**Backgrounds.** No stock photography. No hand-drawn illustration. No repeating patterns. The hero has one and only one treatment: a radial orange glow ellipse (`80% 50% at 50% -10%`, 0.12 alpha) with a secondary cyan glow (`60% 40% at 80% 60%`, 0.06 alpha) over the navy base. Cards are solid `#0E1829` with a 1px `#1E2D40` border — no gradient fills, no glass, no noise texture. Feature grids use a 2px `#1E2D40` gap that reads as an inset border between cells.

**Animation.** Minimal and fast. `--duration-fast` 150ms for hover, `--duration-base` 250ms for larger state changes. Ease `cubic-bezier(0.16, 1, 0.3, 1)` — a decelerating "ease-out" that settles quickly. Scroll-driven entrance: 28px fade-up via CSS `animation-timeline: view()`. The badge dot pulses at 2s infinite. Deploy status dots blink at 2s. Never bounce, never spring, never rotate logos.

**Hover.** Buttons: `translateY(-1px)` + glow shadow intensifies from `0.30` to `0.45` alpha. Links: `color: var(--fg-2) → var(--fg-1)`. Cards: `border-color: #1E2D40 → #2A4060`, background `#0E1829 → #162035`. Logo mark: cyan and orange bars grow 3-4px wider. Nav links have no underline — just a color lift.

**Press.** Primary buttons darken to `--orange-600` `#CC4400`. No scale-down. No ripple. Honest, immediate.

**Borders.** 1px solid `#1E2D40` default. `#2A4060` on hover or elevated. `rgba(255,85,0,0.2)` when indicating an active/selected state (BYO pill, active feature cell). Borders never use gradients.

**Shadows.** Three tiers of black drop-shadow (`shadow-sm/md/lg`, all black with 0.4–0.6 alpha) for depth. Two glow shadows for accent: orange (`0 0 24px 48px` double layer) on primary CTAs, cyan for info emphasis. No colored shadows on cards.

**Corner radii.** `8px` for buttons, inputs, small surfaces. `12px` for cards and code blocks. `16px` for large panels, hero windows, grid containers. `9999px` for pills, badges, dots. Radii are consistent — no mixing 6px with 10px.

**Transparency & blur.** Reserved. Nav uses `rgba(7,11,20,0.95)` + `backdrop-filter: blur(16px)` on scroll. Modal overlays use `rgba(7,11,20,0.6)` + 2px blur. Chips/pills may use `rgba(255,85,0,0.08)` backgrounds. Never glassy cards.

**Dividers.** A single horizontal hairline `linear-gradient(90deg, transparent, #FF5500 50%, transparent)` at 0.3 opacity — the "orange divider glow." Used to separate hero from content. Otherwise: plain `1px #1E2D40`.

**Imagery vibe.** Cool. Low-key. Code screenshots, UI screenshots, diagrams. When photography is used (rare), it's dark, tech, slightly desaturated — never warm or lifestyle.

**Layout.** Fixed nav (64px tall, sticky). Centered hero content (max-width 880px for headlines, 600px for subcopy). Asymmetric section headers: title on the left, aside paragraph on the right, aligned to the bottom baseline. Grid sections use `1fr 1fr` or `1fr 1fr 1fr` with a 2px inset border as gutter.

**Card anatomy.** `#0E1829` background, `1px #1E2D40` border, `12–16px` radius, `24–32px` padding. Optional 40×40px icon tile in the top-left with `#162035` bg, `#2A4060` border, and a single emoji or symbol. Title 0.95–1.15rem weight 700. Body 0.825–0.9rem, `--fg-2`. No shadows on resting cards.

**Code blocks.** `#0E1829` bg, `#1E2D40` border, 8px radius. JetBrains Mono 13px, line-height 1.6–1.75. Mac-style traffic-light dots for "windowed" code demos (`#FF5F57`, `#FEBC2E`, `#28C840`). Syntax palette: cyan keywords, `#C3E88D` strings, `#FFCB6B` types, `#546E7A` comments, orange for enum members / HTTP methods.

---

## Iconography

Bloqr's icon approach is **pragmatic, not precious**.

**No icon font.** The landing site uses a small set of emoji as meta-icons (🔌 on the BYO pill, 📖 on the myths banner, 📡 ⚡ 🤖 🔄 📋 🔐 on feature cards, 🔒 on "consumer VPN" compare card). This is intentional — emoji render everywhere, cost zero bytes, and communicate "this is a utility layer, not a design-trophy site."

**SVG where it matters.** The three-bar mark is hand-drawn SVG (`assets/bloqr-logo.svg`, `assets/bloqr-mark.svg`) — never rasterized for web. Mac traffic-light dots in code windows are CSS circles. Navigation bars are CSS boxes animated on hover.

**Inline SVG for UI glyphs only.** The copy-button checkmark is a small inline SVG (16×16 viewBox 24, stroke-width 2). Arrows `→` are Unicode characters. Play glyphs `▶`, check marks `✓`, and bullets `·` are Unicode.

**CDN recommendation for new screens.** When emoji doesn't fit (dashboard nav, form fields, data-dense surfaces), use **Lucide** via `lucide.dev` — matches Bloqr's stroke weight (2px, rounded joins) and sits well on dark backgrounds. This is a *substitution* — the landing page does not currently ship Lucide. Flag to the maintainer before adopting it site-wide.

**Unicode characters used as icons:**
- `→` right arrow (CTA suffix, breadcrumb)
- `←` left arrow (reverse navigation)
- `✓` check (feature lists, completed states)
- `✕` remove (list items)
- `·` separator (footer, tier separators)
- `▶` play / deploy
- `▾` dropdown caret

**Do not draw new iconography in SVG by hand.** If the need is more than a single glyph, import Lucide from CDN. Don't invent custom SVG icon sets for Bloqr.

**Logos & visual assets (in `assets/`):**
- `bloqr-logo.svg` — horizontal wordmark + mark (canonical)
- `bloqr-mark.svg` — square mark only (favicon, avatars)
- `logo.svg` — original "AdBlock Compiler" lockup (legacy — kept for reference during the transition)
- `favicon.svg`, `icon-192.png`, `icon-512.png` — favicon set from the landing repo
- `og-image.png` — canonical social card

---

## Font delivery

`Space Grotesk` ships **self-hosted** as a variable font (`fonts/SpaceGrotesk-VariableFont_wght.ttf`, weight axis 300–700) — matching the brand principle of "no external DNS round-trip, privacy-first infrastructure posture."

`Inter` and `JetBrains Mono` currently load from Google Fonts as a placeholder; drop the `@fontsource/*` packages (or the `.woff2` files) into `fonts/` and swap the `@import` in `colors_and_type.css` before shipping production.

---

*Last updated: April 2026. Matches brand handoff v1.*
