# Bloqr — Copy Patterns & Content Templates

> **Audience:** AI agents writing content for any Bloqr web property.
> Use these patterns verbatim or as close-match templates. Do not invent new patterns
> that contradict the voice rules in `BLOQR_BRAND_HANDOFF.md`.
>
> For full voice/tone rules, see `brand/BLOQR_BRAND_HANDOFF.md §11` and `brand/BLOQR_DESIGN_LANGUAGE.md`.

---

## 1. Approved Mantras (Use Verbatim)

| Mantra | Context |
|---|---|
| Set it. Bloqr it. Forget it. | Primary consumer CTA headline |
| Bring your own. Or use ours. | Vendor/integration sections |
| Good internet habits. Automated. | Tagline — footers, meta titles, universal |
| The privacy you didn't know you needed. | Acquisition hook, top-of-funnel ads |
| Browsing Hygiene | The concept we coined — always use this term, always capitalised |

---

## 2. Hero Headline Patterns

### Consumer-facing

> The internet you always thought you had.

> Block ads. Block trackers. Block malware.
> One account. Zero setup.

> Good internet habits.
> Automated.

### Power-user / developer-facing

> Your lists. Your vendor. One place.

> One change. Every device. Instantly.

> Keep your vendor. Finally stop managing it in 12 places.

---

## 3. CTA Copy

### Primary CTA buttons

- `Join the waitlist` (pre-launch)
- `Get early access`
- `Start for free`
- `Try Bloqr free`

### Secondary / ghost CTAs

- `Read the docs`
- `View on GitHub`
- `See how it works`
- `Learn more`

### Never use on CTAs

- "Click here"
- "Submit"
- "Learn More" (capitalised mid-sentence — use lowercase 'more')
- "Sign up now" (too aggressive)

---

## 4. Feature Description Patterns

Pattern: **[Specific outcome].** [One sentence of how.] No jargon for consumer sections; full
technical detail for developer sections.

### Consumer example

> **No setup. No maintenance.**
> Bloqr builds your filter list automatically and keeps it current. You flip one switch. Done.

### Power-user example

> **One pane of glass.**
> Manage every AdGuard, NextDNS, or Pi-hole instance from a single dashboard. Push a change once. It applies everywhere in seconds.

### Developer example

> **REST, streaming, or embedded.**
> Use the `@bloqr/compiler` TypeScript library inline, hit the REST API, or stream compiled output to your pipeline. JSON/YAML config. Fully typed.

---

## 5. Privacy / Trust Copy Patterns

These must always be precise. Do not overstate.

### What we log

> We don't log your DNS queries. We don't build a profile of your browsing.
> What we store — your account email, subscription status, configuration — is documented in our privacy policy.

### On "no-log"

> "No-log" is a marketing phrase. We explain exactly what it means technically.
> Queries: not stored. Browsing patterns: not stored. Filter configurations: stored (they're yours to export anytime).

### Privacy vs. anonymity

> Bloqr improves your privacy — it reduces what trackers and your ISP can see.
> It does not make you anonymous. If anonymity is what you need, Tor is the right tool.

---

## 6. Vendor Positioning Copy

Never negative about named vendors. Always partner-framing.

### AdGuard

> AdGuard is powerful. Its dashboard can be complex.
> Bloqr makes AdGuard simple — without taking anything away.

### NextDNS

> Already on NextDNS? Bloqr adds AI-maintained lists, natural language rules, and multi-instance sync. Keep your setup. Add intelligence.

### Pi-hole

> Pi-hole users know what they're doing. Bloqr handles the list curation and multi-instance sync so you can focus on the filtering.

### uBlock Origin

> uBlock Origin is excellent for browser-level blocking. Bloqr adds network-level coverage — every device, every app, not just the browser.

---

## 7. SEO / AEO Meta Patterns

### Page title format

```
Bloqr — [Page purpose, ≤50 chars].
```

Examples:
- `Bloqr — Internet Hygiene: Automated.`
- `Bloqr — Block Ads at the Network Level.`
- `Bloqr — Do VPNs Actually Protect Your Privacy?`

### Meta description pattern

Lead with the strongest user benefit. Include at least one specific, verifiable claim. ≤160 characters.

```
[Primary benefit]. [Specific differentiator]. [No jargon]. [CTA-adjacent close].
```

Example:
> AI-powered adblock list management and real-time threat intelligence. Block ads, trackers, and malware at the network level — without routing your traffic anywhere.

---

## 8. Error & Empty State Copy

### Form validation

- Required field: `This field is required.`
- Invalid email: `Enter a valid email address.`
- Server error: `Something went wrong. Try again in a moment.`
- Success: `You're on the list. We'll be in touch.`

### Coming soon / unshipped features

> We're building this. [Feature name] is planned for [vague timeframe: "later this year" / "v2"].
> [Short honest description of what it will do.]

Never: "Coming soon!" (exclamation mark feels like marketing empty calories).
Never: "Stay tuned!" (same reason).

---

## 9. Forbidden Phrases (Full List)

| Phrase | Replacement |
|---|---|
| Leveraging | Using |
| Seamlessly | (delete — just describe the outcome) |
| Best-in-class | (delete — use specific claim instead) |
| Enterprise-grade | (delete unless in actual B2B/enterprise context) |
| Revolutionary | (delete) |
| Game-changing | (delete) |
| World-class | (delete) |
| Cutting-edge | (delete) |
| State-of-the-art | (delete) |
| Robust | (delete — describe what makes it robust) |
| Powerful | (only use if followed by a specific capability) |
| Seamless integration | Describe the actual integration |
| Privacy and anonymity | Must always be written separately if both are intended |
| "Trust us" | Show the architecture instead |
| "Industry-leading" | (delete) |
| "Click here" | Use descriptive link text |

---

*Last updated: April 2026*
*Part of the Bloqr brand documentation suite in `jaypatrick/bloqr-landing/brand/`.*