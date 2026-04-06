<!-- Pricing section — deliberately vague until CF billing details are confirmed -->

<script>
  const tiers = [
    {
      name:     'Personal',
      price:    '~$5',
      period:   '/month',
      aside:    'Roughly the price of a decent coffee.',
      tagline:  'For households who just want it handled.',
      cta:      'Join the waitlist',
      href:     '/#waitlist',
      featured: false,
      items: [
        'AI-curated filter list, maintained for you',
        'Works with NextDNS, AdGuard, Pi-hole & more',
        'Multi-device coverage (whole network)',
        'Weekly threat list updates',
        'Email notifications for major incidents',
      ],
    },
    {
      name:     'Power User',
      price:    '~$9',
      period:   '/month',
      aside:    'Less than one mediocre cocktail.',
      tagline:  'For people who have opinions about Hagezi vs. OISD.',
      cta:      'Join the waitlist',
      href:     '/#waitlist',
      featured: true,
      items: [
        'Everything in Personal',
        'Custom transformation pipelines',
        'Natural language rule builder',
        'Multi-instance management',
        'API access + JSR package',
        'Priority threat intelligence feed',
        'Full config export (JSON/YAML, version-controllable)',
      ],
    },
    {
      name:     'Developer / Self-Hosted',
      price:    'Free',
      period:   'open-source',
      aside:    'GPL-3.0. It\'s yours.',
      tagline:  'Run it yourself. We won\'t be weird about it.',
      cta:      'View on GitHub',
      href:     'https://github.com/jaypatrick/adblock-compiler',
      featured: false,
      external: true,
      items: [
        'Full compiler source on GitHub',
        'Deno + Node.js + Cloudflare Workers compatible',
        'Self-host anywhere',
        'JSR package: @jk-com/adblock-compiler',
        'OpenAPI spec included',
        'Community support',
      ],
    },
  ];
</script>

<section class="pricing" id="pricing">
  <div class="container">

    <div class="section-header">
      <p class="section-label">Pricing</p>
      <h2 class="section-title">
        Less than your worst<br />
        impulse purchase.
      </h2>
      <p class="section-sub">
        Exact pricing is being finalized while we work through Cloudflare billing details.
        Numbers below are targets. Early access subscribers lock in a discount
        that stays for the life of the account.
      </p>
      <div class="disclaimer">
        <span class="pill">⚠ Estimates only</span>
        Pricing confirmed at general availability.
      </div>
    </div>

    <div class="tiers">
      {#each tiers as tier}
        <div class="tier" class:featured={tier.featured}>
          {#if tier.featured}
            <div class="featured-badge">Most popular</div>
          {/if}

          <div class="tier-header">
            <div class="tier-name">{tier.name}</div>
            <div class="tier-price">
              <span class="price">{tier.price}</span>
              <span class="period">{tier.period}</span>
            </div>
            <div class="tier-aside">{tier.aside}</div>
            <p class="tier-tagline">{tier.tagline}</p>
          </div>

          <ul class="feature-list">
            {#each tier.items as item}
              <li>
                <span class="check" aria-hidden="true">✓</span>
                {item}
              </li>
            {/each}
          </ul>

          <a
            href={tier.href}
            class="tier-cta"
            class:primary={tier.featured}
            class:outline={!tier.featured}
            rel={tier.external ? 'noopener noreferrer' : undefined}
            target={tier.external ? '_blank' : undefined}
          >
            {tier.cta}
          </a>
        </div>
      {/each}
    </div>

    <p class="fine-print">
      All paid tiers include a 30-day money-back guarantee, no questions asked.
      Cancel anytime. The GPL-3.0 open-source version will remain free forever.
    </p>

  </div>
</section>

<style>
  .pricing {
    padding: 96px 0;
    border-top: 1px solid var(--border);
  }

  /* ── Header ── */
  .section-header {
    text-align: center;
    max-width: 600px;
    margin: 0 auto 64px;
  }

  .section-label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--orange);
    margin-bottom: 16px;
  }

  .section-title {
    font-size: clamp(1.75rem, 4vw, 2.5rem);
    font-weight: 700;
    color: var(--text-1);
    line-height: 1.2;
    margin-bottom: 16px;
  }

  .section-sub {
    font-size: 1rem;
    color: var(--text-2);
    line-height: 1.7;
    margin-bottom: 20px;
  }

  .disclaimer {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--text-3);
  }

  .pill {
    background: var(--bg-elevated);
    border: 1px solid var(--border-2);
    border-radius: 20px;
    padding: 3px 10px;
    font-size: 11px;
    color: var(--text-2);
    white-space: nowrap;
  }

  /* ── Tiers grid ── */
  .tiers {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    align-items: start;
  }

  .tier {
    position: relative;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 32px 28px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    transition: border-color 150ms;
  }

  .tier:hover { border-color: var(--border-2); }

  .tier.featured {
    border-color: var(--orange);
    background: linear-gradient(
      160deg,
      rgba(255, 85, 0, 0.06) 0%,
      var(--bg-surface) 60%
    );
    box-shadow: 0 0 40px rgba(255, 85, 0, 0.08);
  }

  .featured-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--orange);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 4px 14px;
    border-radius: 20px;
    white-space: nowrap;
  }

  /* ── Tier header ── */
  .tier-name {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .tier-price {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin-top: 8px;
  }

  .price {
    font-size: 2.25rem;
    font-weight: 700;
    color: var(--text-1);
    line-height: 1;
  }

  .period {
    font-size: 0.875rem;
    color: var(--text-3);
  }

  .tier-aside {
    font-size: 12px;
    color: var(--text-3);
    font-style: italic;
    margin-top: 4px;
  }

  .tier-tagline {
    font-size: 0.9375rem;
    color: var(--text-2);
    line-height: 1.5;
    margin-top: 4px;
  }

  /* ── Feature list ── */
  .feature-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
  }

  .feature-list li {
    display: flex;
    gap: 10px;
    font-size: 0.9rem;
    color: var(--text-2);
    line-height: 1.5;
  }

  .check {
    color: var(--orange);
    font-weight: 700;
    flex-shrink: 0;
    font-size: 0.875rem;
    margin-top: 1px;
  }

  .featured .check { color: var(--orange); }

  /* ── CTA buttons ── */
  .tier-cta {
    display: block;
    text-align: center;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    transition: all 150ms;
    cursor: pointer;
  }

  .tier-cta.primary {
    background: var(--orange);
    color: #fff;
    box-shadow: 0 0 20px rgba(255, 85, 0, 0.3);
  }
  .tier-cta.primary:hover {
    background: var(--orange-hover);
    box-shadow: 0 0 32px rgba(255, 85, 0, 0.45);
    transform: translateY(-1px);
  }

  .tier-cta.outline {
    background: transparent;
    color: var(--text-1);
    border: 1px solid var(--border-2);
  }
  .tier-cta.outline:hover {
    border-color: var(--text-3);
    background: rgba(255, 255, 255, 0.04);
  }

  /* ── Fine print ── */
  .fine-print {
    text-align: center;
    margin-top: 40px;
    font-size: 13px;
    color: var(--text-3);
    max-width: 480px;
    margin-left: auto;
    margin-right: auto;
    line-height: 1.65;
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .tiers {
      grid-template-columns: 1fr;
      max-width: 480px;
      margin: 0 auto;
    }
  }

  @media (max-width: 600px) {
    .pricing { padding: 64px 0; }
  }
</style>
