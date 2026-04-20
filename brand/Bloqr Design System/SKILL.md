---
name: bloqr-design
description: Use this skill to generate well-branded interfaces and assets for Bloqr (Internet Hygiene. Automated.), either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. If working on production code, you can copy assets and read the rules here to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask some questions, and act as an expert designer who outputs HTML artifacts _or_ production code, depending on the need.

## Quick orientation

- **README.md** — the source of truth. Content fundamentals, visual foundations, iconography.
- **colors_and_type.css** — drop-in CSS variables for colors, type, spacing, motion.
- **brand/** — voice, copy patterns, forbidden phrases, ethos.
- **assets/** — logos (full + mark), favicon, app icons.
- **preview/** — canonical token + component specimens.
- **ui_kits/landing/** — high-fidelity recreation of the marketing site.

## Non-negotiables

- **Dark-first, always.** Never ship a light-background Bloqr surface.
- **Name is `Bloqr`.** Not `BLOQR`, `bloqr`, or `BloQr`.
- **Forbidden vocabulary:** leveraging, seamlessly, best-in-class, enterprise-grade, revolutionary, game-changing, cutting-edge. See `brand/BLOQR_COPY_PATTERNS.md §9`.
- **No bluish-purple gradients. No emoji cards. No SVG illustrations drawn by hand.**
- **Specificity beats adjectives.** `48,291 rules` > `thousands of rules`.
