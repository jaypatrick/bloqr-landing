# Bloqr Landing — UI Kit

High-fidelity recreation of the Bloqr marketing site, extracted from the Astro + Svelte codebase at `adblock-compiler.landing/`.

> Local demo artifact only. These HTML previews currently load React/ReactDOM/Babel from CDN for convenience and should not be deployed to production as-is.

## What's here

- `index.html` — full landing page demo: Nav → Hero → Problem/VPN → Features → HowItWorks → Pricing → CTA → Footer, with tab switching, waitlist signup flow, and a toggleable code/UI view in HowItWorks.
- `Nav.jsx` — fixed 64px nav with mark + wordmark + links + waitlist CTA.
- `Hero.jsx` — badge + "Internet Hygiene: *Automated.*" headline (orange gradient on "Automated") + BYO pill + 4-stat bar.
- `Problem.jsx` — VPN-vs-Bloqr side-by-side compare cards.
- `Features.jsx` — 3×2 feature grid with 2px inset border between cells.
- `HowItWorks.jsx` — numbered 01/02/03 steps with UI↔code toggle.
- `Pricing.jsx` — three-tier pricing (Free / Pro / Pro Max).
- `CtaBanner.jsx` — final orange-glow waitlist banner.
- `Footer.jsx` — link columns + three-bar mark.
- `components/` — shared primitives (Button, Pill, Card, CodeWindow, Mark).

## Interactions

- Nav links update the active state on click.
- Hero "Get started free" and CTA banner both open a waitlist modal with email validation.
- HowItWorks step 2 toggles between a UI mockup and the underlying JSON.
- Pricing tiers highlight when hovered.

## Faithfulness

Colors, typography, spacing, the 2px grid-gutter trick, the orange gradient on the "Automated." word, the badge dot pulse, the pill-style BYO callout, and the "01 / 02 / 03" numerals are all lifted from the original Svelte source. Copy is verbatim from `Hero.svelte`, `Features.svelte`, `Problem.svelte`, and `Pricing.svelte` where possible.

Not implemented (out of scope for a design-kit recreation): blog, changelog, admin, privacy/terms pages, analytics scripts, Cloudflare Worker functions.
