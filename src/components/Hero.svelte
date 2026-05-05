<script lang="ts">
  import { LINKS } from '../config';

  let expanded = $state(false);

  function trackHeroCta(label: string): void {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture('hero_cta_clicked', { label });
    }
  }
</script>

<section class="hero">
  <!-- Radial glow backdrop -->
  <div class="glow" aria-hidden="true"></div>

  <div class="container">
    <div class="badge">
      <span class="badge-dot" aria-hidden="true"></span>
      Set it. Bloqr it. Forget it.
    </div>

    <h1>Internet Hygiene:<br /><em>Automated.</em></h1>

    <p class="sub">
      Bloqr blocks ads, trackers, and malware at the network level — across every
      device, every network, all at once. Tell Bloqr what you want in plain English.
      Bloqr handles the rest.
    </p>

    <!-- ── BYO / Managed vendor tile ───────────────────────────────────── -->
    <div class="byo-tile" aria-label="Vendor flexibility">
      <div class="byo-tile__summary">
        <span class="byo-icon" aria-hidden="true">🔌</span>
        <div class="byo-tile__text">
          <strong>Bring your own vendor.</strong>
          Already on AdGuard, NextDNS, or Pi-hole? Keep it.
          Bloqr layers on top. Or let us handle everything — your choice, always.
        </div>
        <button
          class="byo-tile__toggle"
          aria-expanded={expanded}
          aria-controls="byo-detail"
          onclick={() => (expanded = !expanded)}
        >
          {expanded ? 'Less' : 'How?'}
          <span class="byo-tile__chevron" class:flipped={expanded} aria-hidden="true">›</span>
        </button>
      </div>

      <!-- Expanded detail — still server-rendered HTML, hidden via CSS -->
      <div
        id="byo-detail"
        class="byo-tile__detail"
        class:visible={expanded}
        aria-hidden={!expanded}
      >
        <div class="byo-detail__grid">
          <div class="byo-detail__item">
            <span class="byo-detail__icon" aria-hidden="true">⚡</span>
            <div>
              <strong>Cloudflare Workers — everywhere, instantly.</strong>
              Your rules run inside Cloudflare's global edge network — the same
              infrastructure that handles ~20&nbsp;% of all internet traffic.
              Each request executes in an isolated V8 sandbox: no shared memory,
              no persistent state between runs, no blast radius if something
              goes wrong.
            </div>
          </div>
          <div class="byo-detail__item">
            <span class="byo-detail__icon" aria-hidden="true">🔒</span>
            <div>
              <strong>Zero Trust Architecture, not bolt-on security.</strong>
              Bloqr's managed hosting is built on Cloudflare One — enterprise
              Zero Trust from day one. Every device is verified before it touches
              the network. Policy enforcement happens at the edge, not at your
              router.
            </div>
          </div>
          <div class="byo-detail__item">
            <span class="byo-detail__icon" aria-hidden="true">🌐</span>
            <div>
              <strong>Device meshing &amp; enterprise-grade blocking.</strong>
              Laptops, phones, tablets, servers — all enrolled, all covered by
              the same policy. Cloudflare's threat intelligence blocks known
              malware, phishing, and C2 domains before a connection is even
              attempted. You inherit that threat feed automatically.
            </div>
          </div>
          <div class="byo-detail__item">
            <span class="byo-detail__icon" aria-hidden="true">🛠️</span>
            <div>
              <strong>Dynamic workflows, fully sandboxed.</strong>
              List compilation, rule transformation, and sync jobs run as
              isolated Cloudflare Workflows — durable, retriable, and scoped
              strictly to your account. No code from another tenant ever touches
              your data or your pipeline.
            </div>
          </div>
        </div>
        <p class="byo-detail__footer">
          Choose us as your vendor and you get Cloudflare's security posture
          behind every DNS query — no enterprise contract required.
          Or bring AdGuard, NextDNS, or Pi-hole and Bloqr stays in the
          intelligence layer only. Either way, you're in control.
        </p>
      </div>
    </div>
    <!-- ─────────────────────────────────────────────────────────────────── -->

    <div class="actions">
      <a href={LINKS.app} class="btn btn-primary" rel="noopener noreferrer" target="_blank" onclick={() => trackHeroCta('get_started_free')}>
        Get started free <span aria-hidden="true">→</span>
      </a>
      <a href={LINKS.docs} class="btn btn-outline" rel="noopener noreferrer" target="_blank" onclick={() => trackHeroCta('read_the_docs')}>
        Read the docs
      </a>
      <a href="/#why" class="btn btn-ghost" onclick={() => trackHeroCta('see_how_it_works')}>
        See how it works
      </a>
    </div>

    <!-- Stats bar -->
    <div class="stats" role="list">
      <div class="stat" role="listitem">
        <span class="stat-value">AI<span>-focused</span></span>
        <span class="stat-label">Plain English rules</span>
      </div>
      <div class="stat" role="listitem">
        <span class="stat-value"><span>BYO</span></span>
        <span class="stat-label">Vendor-agnostic · No lock-in</span>
      </div>
      <div class="stat" role="listitem">
        <span class="stat-value">Real<span>time</span></span>
        <span class="stat-label">AI-powered threat intelligence</span>
      </div>
      <div class="stat" role="listitem">
        <span class="stat-value"><span>11</span></span>
        <span class="stat-label">Filter transformations</span>
      </div>
    </div>
  </div>
</section>

<style>
  .hero {
    padding: 72px 0 80px;
    text-align: center;
    position: relative;
    overflow: hidden;
  }

  .glow {
    position: absolute;
    top: 0; left: 50%;
    transform: translateX(-50%);
    width: 800px; height: 500px;
    background: radial-gradient(ellipse at center, rgba(255,85,0,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 9999px;
    border: 1px solid rgba(255, 85, 0, 0.3);
    background: rgba(255, 85, 0, 0.08);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    color: var(--orange);
    text-transform: uppercase;
    margin-bottom: 32px;
  }

  .badge-dot {
    display: block;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--orange);
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.5; transform: scale(0.8); }
  }

  h1 {
    font-size: clamp(2.5rem, 6vw, 5rem);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.03em;
    margin-bottom: 24px;
    max-width: 880px;
    margin-left: auto;
    margin-right: auto;
  }

  h1 em {
    font-style: normal;
    background: linear-gradient(135deg, var(--orange) 0%, #FF8833 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .sub {
    font-size: clamp(1rem, 2vw, 1.2rem);
    color: var(--text-2);
    max-width: 600px;
    margin: 0 auto 28px;
    line-height: 1.6;
  }

  /* ── BYO tile ─────────────────────────────────────────────────────────── */

  .byo-tile {
    display: block;
    max-width: 600px;
    margin: 0 auto 40px;
    border-radius: 14px;
    border: 1px solid rgba(255, 85, 0, 0.2);
    background: rgba(255, 85, 0, 0.05);
    text-align: left;
    overflow: hidden;
  }

  .byo-tile__summary {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 18px;
  }

  .byo-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .byo-tile__text {
    flex: 1;
    font-size: 0.92rem;
    color: var(--text-2);
    line-height: 1.5;
  }

  .byo-tile__text strong {
    color: var(--text-1);
  }

  .byo-tile__toggle {
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 6px;
    border: 1px solid rgba(255, 85, 0, 0.25);
    background: rgba(255, 85, 0, 0.08);
    color: var(--orange);
    font-size: 0.78rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    white-space: nowrap;
    margin-top: 2px;
    transition: background 0.15s ease, border-color 0.15s ease;
  }

  .byo-tile__toggle:hover {
    background: rgba(255, 85, 0, 0.14);
    border-color: rgba(255, 85, 0, 0.4);
  }

  .byo-tile__chevron {
    display: inline-block;
    transition: transform 0.2s ease;
    transform: rotate(0deg);
    font-size: 1rem;
    line-height: 1;
  }

  .byo-tile__chevron.flipped {
    transform: rotate(90deg);
  }

  /* Detail panel — hidden until .visible is toggled */
  .byo-tile__detail {
    display: none;
    padding: 0 18px 18px;
    border-top: 1px solid rgba(255, 85, 0, 0.12);
  }

  .byo-tile__detail.visible {
    display: block;
  }

  .byo-detail__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-top: 16px;
  }

  @media (max-width: 520px) {
    .byo-detail__grid {
      grid-template-columns: 1fr;
    }
  }

  .byo-detail__item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 0.83rem;
    color: var(--text-2);
    line-height: 1.55;
  }

  .byo-detail__item strong {
    color: var(--text-1);
    display: block;
    margin-bottom: 3px;
    font-size: 0.85rem;
  }

  .byo-detail__icon {
    font-size: 1rem;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .byo-detail__footer {
    margin-top: 16px;
    padding-top: 14px;
    border-top: 1px solid rgba(255, 85, 0, 0.1);
    font-size: 0.82rem;
    color: var(--text-3);
    line-height: 1.55;
  }

  /* ── Actions ──────────────────────────────────────────────────────────── */

  .actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 72px;
  }

  /* ── Stats bar ────────────────────────────────────────────────────────── */

  .stats {
    display: flex;
    justify-content: center;
    gap: 48px;
    flex-wrap: wrap;
    padding: 32px 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
  }

  .stat { text-align: center; }

  .stat-value {
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -0.03em;
    color: var(--text-1);
    display: block;
  }

  .stat-value span { color: var(--orange); }

  .stat-label {
    font-size: 12px;
    color: var(--text-3);
    letter-spacing: 0.08em;
    text-transform: uppercase;
    display: block;
    margin-top: 4px;
  }
</style>
