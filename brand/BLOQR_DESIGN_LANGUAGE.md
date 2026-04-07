# Bloqr Design Language & Product Strategy Reference

*This document captures design decisions, product positioning, user personas, and voice guidelines established through the founding product sessions of Bloqr. It is a living reference — update it as decisions evolve. Every major product or copy decision should trace back here.*

---

## Core Brand Mantras

These phrases anchor everything we write and build:

- **"Set it. Bloqr it. Forget it."** — The consumer promise. Zero ongoing maintenance.
- **"Bring your own. Or use ours."** — The vendor philosophy. No lock-in, ever.
- **"The privacy you didn't know you needed."** — The acquisition hook. Education-first marketing.
- **"Good internet habits. Automated."** — The tagline. Simple, direct, applies to all personas.
- **Browsing Hygiene** — Our coined concept for what we deliver. Not security, not anonymity — hygiene. Preventive, routine, invisible.

---

## Product Philosophy

### We Are Infrastructure, Not a Product

Bloqr is the connective tissue between filter lists and DNS vendors. We do not compete with AdGuard, NextDNS, Pi-hole, or list makers. We make them better. This must be reflected in every word we write about vendors and list makers — never adversarial, always additive.

When we eventually build our own DNS engine (likely via Cloudflare One/ZTA), it becomes another vendor option, not a forced migration. Users who stay on their existing vendor are not second-class.

### AI-First, Always

We use AI to:
1. Build and maintain real-time threat lists
2. Enable natural language rule creation ("block everything AWS") — written and eventually spoken
3. Validate and optimize user configurations
4. Suggest list sources based on user behavior and preferences

AI is opt-in for anything that involves personal data. Queries are not stored or used for training unless the user explicitly opts in. This must be stated clearly in the product, not buried in a privacy policy.

### Progressive Disclosure

The UI has two modes and everything in between:
- **"Do it for me"** — AI builds the list, picks the vendor, configures everything. User flips one switch. This is the entry point for everyday consumers.
- **"Let me drive"** — Full JSON/YAML configuration, API access, CLI, custom transformations. This is what developers and power users get.

The GUI config builder sits in the middle: point-and-click configuration that generates the underlying JSON/YAML automatically. Users can download their config, store it in version control, and use it in CI/CD pipelines. They never need to know JSON exists.

**Showing code on the landing page is fine and intentional.** Code looks impressive to non-technical users. The critical message accompanying every code block: *"You'll never write a line of this. The UI builds it for you. But it's here if you want it."*

### No Code Required. Ever. (Unless You Want It.)

This must be stated explicitly in the Audiences section, the HowItWorks section, and anywhere else code is shown. Non-technical users should never feel that Bloqr requires technical knowledge to use. The design principle: the UI is the primary interface. Code is an advanced output of the UI, not a prerequisite.

---

## The Four User Personas

These personas should drive every copy and design decision. When writing landing page content, feature descriptions, or marketing materials, identify which persona you're addressing and use the appropriate voice.

### Persona 1: Everyday Consumer ("The Beneficiary")

**Who they are:** Has no idea DNS exists. Uses one browser, on one or two computers. Possibly has an ad blocker installed and couldn't tell you how it works. The most they've done about internet privacy is clicked "reject all" on cookie banners. Would describe their ideal solution as "something that just works."

**What they need:** A single switch. AI builds and maintains everything. They pick a vendor from a curated, friendly list (or we pick for them). They never see another setting screen unless they want to. Over time, we educate them gently and they may upgrade to more features.

**What scares them:** Acronyms. Setup steps. Anything that looks like code. The word "configuration." The impression that this requires IT expertise.

**Our pitch to them:** "The internet you always thought you had. Now you actually do. No setup. No learning curve. One account, everything handled."

**Voice:** Warm, reassuring, zero jargon. Short sentences. Benefit-first. Never mention DNS by name — call it "the system that looks up websites" if you have to explain it at all. Use analogies. Think: explaining it to a parent.

**Conversion path:** Free tier → AI-managed flagship list → one-click vendor setup → upgrades to multi-device or AI features over time.

---

### Persona 2: Power User ("The Advocate")

**Who they are:** Privacy-conscious individual who already uses AdGuard, NextDNS, or Pi-hole. Likely manages configurations for themselves and possibly family members or a small circle. Knows what a blocklist is. Has opinions about Hagezi vs. OISD. Has probably hit the scaling problem — maintaining rules across multiple devices is tedious and error-prone.

**What they need:** A single pane of glass for all their instances. Their existing vendor, working seamlessly. Natural language rule building. AI list curation. Multi-instance management. Full control when they want it, full automation when they don't. Data governance they can inspect and trust.

**What they care about most:** Not losing what they've built. Trust. Transparency about what we log (nothing) and how we handle data. The ability to export everything and leave anytime.

**Our pitch to them:** "Keep your vendor. Keep your lists. Finally stop doing it in 12 places. One change, everywhere, instantly."

**Voice:** Peer-to-peer. Technical respect without condescension. Acknowledge their expertise. "You probably already know this, but..." framing. Be specific about features. Data governance language is appropriate here — they'll want to know exactly what we store.

**Conversion path:** Free tier (limited instances) → Pro (multi-instance, AI rules, natural language) → Power features as they ship.

---

### Persona 3: Developer / List Maker ("The Builder")

**Who they are (Developer):** Builds privacy tooling, embeds filter capabilities in their own product, or uses Bloqr as part of a CI/CD pipeline. Uses the TypeScript library or REST API. Reads the docs before the landing page.

**Who they are (List Maker):** Curates filter lists used by thousands or millions of users. Currently maintains a brittle Python script, a PERL one-liner, or a series of manual steps that break under load. Deeply reputation-conscious. Does not monetize their work and wouldn't want to be seen as doing so. Extremely protective of their sourcing methodology.

**What they need (Developer):** A stable, documented API. Library embedding option. JSON/YAML config. CI/CD native workflow. No surprises in the output format.

**What they need (List Maker):** Automation of the build pipeline without surrendering creative control. The ability to publish lists under their own name through our infrastructure. Free, verified tier. No competition with their reputation — we amplify it, we don't replace it. Their sourcing stays private.

**Critical nuance (List Makers):** These are our most important and most fragile relationships. They are unpaid volunteers whose reputations are their only currency. We must not position our AI threat engine as a replacement for their curation — it's a complement. If we win list makers, power users follow. If we alienate them, they'll tell the entire privacy community and we lose power users.

**Our pitch to them (Developer):** "Your pipeline. Our API. REST, streaming, batch, or embedded library. JSON/YAML config. Running before your next coffee."

**Our pitch to them (List Maker):** "Your lists. Your reputation. Our infrastructure. We automate the build. You keep the craft. Free, verified tier, no strings."

**Voice (Developer):** Technical, direct, minimal marketing language. Show the API. Show the code. Reference the JSR package. Let the implementation speak.

**Voice (List Maker):** Respectful, collegial. Acknowledge the value of what they do. Never imply that AI replaces their judgment. Position automation as removing the boring parts so they can focus on the interesting ones.

**Conversion path (Developer):** Free library → API tier → Enterprise for pipelines and custom SLAs.

**Conversion path (List Maker):** Verified free tier → potentially sponsored/partnership as Bloqr grows.

---

### Persona 4: Vendor / Partner ("The Ally")

**Who they are:** AdGuard, NextDNS, Pi-hole, uBlock Origin, or a smaller player in the DNS filtering / privacy tooling ecosystem. May also include MSPs (managed service providers) who configure privacy tooling for clients.

**What they need:** An infrastructure partner, not a competitor. The ability to point their users to Bloqr-compiled lists with confidence. Ideally, a referral or partner program that gets their platform more users. A "Secured by Bloqr" or similar co-branding arrangement that elevates their product.

**The goal:** Get "AdGuard — Powered by Bloqr" (or equivalent) on their website. This is the hockey-stick moment. When the vendors endorse us, power users follow immediately.

**Critical nuance:** We must never publicly characterize any vendor negatively. Even as we eventually build our own engine and create competitive overlap, the message is: "Users have choices. We make every choice better." Vendors who feel threatened will resist; vendors who feel elevated will partner.

**Our pitch:** "Your users trust you. We make that trust more powerful. Let us handle the list intelligence layer. You handle the filtering. Everyone wins."

**Voice:** B2B partnership language. ROI-aware. Integration-focused. Emphasize that we increase their platform's value, not that we replace any part of it.

**Conversion path:** API integration → partner program → co-marketing → referral revenue share.

---

## Landing Page Architecture

### The SEO/AEO Problem with Persona Tabs

Dynamic tab switching that hides content from the DOM is bad for SEO. The preferred approaches, in order of SEO safety:

1. **Separate pages per persona** (`/for-consumers`, `/for-power-users`, `/for-developers`, `/for-vendors`) — Best SEO, highest maintenance.
2. **All sections on one page, anchor-linked** — All content always in DOM, tabs are just scroll anchors. Fully crawlable.
3. **Tab switching with all content in SSR HTML** — Acceptable if the SSR output includes all tab content before JavaScript hydration hides inactive tabs.
4. **Pure client-side tab switching** — Worst for SEO; inactive tab content never in initial HTML.

**Current implementation (v1):** Hybrid approach — all four sections in the DOM, tabs control `display` but content is always rendered in Astro's SSR HTML pass. This is acceptable for v1. Separate persona pages should be built when content budget allows.

### The Code/UI Toggle Pattern

Code blocks on the landing page should default to showing a **UI mockup** — a visual representation of what the feature looks like in the Bloqr interface (even if the interface doesn't fully exist yet). A "Show code" button reveals the underlying JSON/YAML/API call.

This communicates:
- "You will never have to write this" (default UI view)
- "But if you want to, it's clean and approachable" (revealed code)
- "The UI generates this for you" (copy adjacent to the toggle)

The mockup UI should look like a real interface — form fields, dropdowns, toggles, vendor selectors — even if it's static HTML/CSS. It sets visual expectations for the real product.

### Section Structure (Current)

```
Hero → Problem/VPN → Features → HowItWorks → Audiences → CTA Banner → Footer
```

**Recommended addition (v2):**
```
Hero → Problem/VPN → Features → HowItWorks → [BYO vs. Ours section] → Audiences → Pricing → CTA → Footer
```

The "BYO vs. Ours" section is a dedicated moment to explain the two usage modes before diving into persona-specific content.

---

## Voice & Tone Guidelines

### Overall Brand Voice

Confident without arrogance. Technical without jargon. Honest without caveating everything. We say what we mean. We don't use "no-log" as a slogan without the architecture to back it up.

**Avoid:**
- "Leveraging" anything
- "Seamlessly" (everyone says this)
- "Best-in-class"
- "Enterprise-grade" (unless talking to enterprises)
- "Revolutionary" / "game-changing"
- Passive voice when we can be direct

**Embrace:**
- Short declarative sentences for punch
- Specificity ("48,291 rules deduplicated" not "thousands of rules")
- Honest caveats when appropriate ("we're building this" vs. pretending it exists)
- Self-aware humor, sparingly
- "You" focused copy (what you get, not what we do)

### Per-Persona Tone Summary

| Persona | Tone | Jargon level | Code shown? |
|---|---|---|---|
| Everyday Consumer | Warm, reassuring, zero acronyms | None | Hidden (show UI) |
| Power User | Peer, direct, transparent | Medium | Toggle (UI first) |
| Developer/List Maker | Technical, documentation-style | High | Yes, prominently |
| Vendor/Partner | B2B, ROI-aware, collegial | Medium | Minimal |

---

## AI Feature Principles

1. **AI is opt-in for personal data.** If a feature involves storing queries, voice input, or behavioral patterns, users must explicitly opt in.
2. **Nothing is used for training without explicit consent.** This must be stated in the UI at the point of opt-in, not buried.
3. **Data that isn't stored can't be leaked or subpoenaed.** This is both a technical architecture principle and a marketing message.
4. **Natural language list building is a v1 goal.** Text input first, voice input in v2. The UX: a text field that accepts plain English and produces a validated filter list.
5. **AI threat lists are the flagship.** They represent Bloqr's proprietary intelligence layer and are the primary reason to pay for the service over using free public lists alone.

---

## Vendor Relationship Principles

- **Never competitive language about vendors in public copy.** Not even gently.
- **AdGuard is the recommended starter vendor** for users who don't bring their own.
  - They have an active project, frequent updates, and an API we can integrate.
  - Their admin UI is complex — which is our opening ("we make AdGuard simple").
  - Their AdGuard DNS custom domain PKI feature is the killer feature for serious users.
  - They also sell a VPN (stale, not well-regarded) — we don't need to mention this.
- **NextDNS users are easy converts.** Product has stagnated. Pitch: everything they have, actively maintained, with more.
- **Pi-hole users are self-hosters.** They will want a Docker container, not a SaaS. Path: offer self-hosted option, monetize via API features they can't run locally.
- **uBlock Origin users** are the hardest. They want free, browser-only, and they're fine with that. Path: offer a free browser extension with limited features. Upgrade hook: "uBlock works great for one browser. Bloqr works for all of them."

---

## Competitive Positioning: VPNs

The VPN myths page (`/vpn-myths`) is our primary SEO asset for capturing users searching for VPN alternatives. The positioning:

- We are not a VPN replacement for anonymity use cases (Tor handles that)
- We are a better solution for the actual use case most VPN buyers have: blocking ads, trackers, and malware
- VPNs are expensive because of infrastructure and legal costs in 60 jurisdictions — we have neither
- Cloudflare's single-jurisdiction governance model is a differentiator we should lean into
- Consumer VPNs raise the privacy issues they promise to solve (trust problem relocated, not solved)

**What we never say:** "VPNs are useless." Some people legitimately need them for legitimate purposes. We say: "For the use case most consumer VPN buyers actually have, there's a better tool."

---

## Technical Architecture Notes (for copy reference)

- **Built on Cloudflare Workers + Pages.** ~20% of all internet traffic passes through Cloudflare. Their governance is our governance.
- **TypeScript library** (`@jk-com/adblock-compiler`, transitioning to `@bloqr/compiler`) on JSR — the open source core.
- **Deno primary runtime.** Node.js compatible. Cloudflare Workers compatible.
- **11 transformations** currently. Fully extensible.
- **Cloudflare One/ZTA** is the target engine for v2+ DNS hosting. This replaces the need for third-party DNS vendors for users who want to "host with Bloqr."
- **AdGuard DNS API** is integrated (or planned) to allow managing user vendor configs from within Bloqr's UI — users never need to log into AdGuard's portal.
- **Encrypted DNS** for users without a vendor: wrapper around 1.1.1.1 or similar, with filtering applied before the encrypted relay. Architecture: device → Bloqr (hygiene pass) → encrypted DNS upstream.

---

## Open Questions (track until resolved)

- [ ] Can we resell / white-label Cloudflare One/ZTA? → Schedule call with Cloudflare Sales
- [ ] Can we resell Cloudflare WARP as a VPN option for users who want it? → Same call
- [ ] Legal review of "what's never logged can't be produced" claim → Jayson's attorney
- [ ] AdGuard DNS API terms — what are the limits on building a UI on top of their API?
- [ ] Pi-hole self-host path: Docker image or just API-compatible self-hosted mode?
- [ ] Verified list maker program: how do we verify without creating gatekeeping?
- [ ] Voice input for natural language rules: which STT provider, privacy implications?
- [ ] Domain: acquire bloqr.com as insurance before consumer marketing push

---

*Last updated: April 2026*
*Maintained by Jayson Knight + Bloqr AI assistant*
