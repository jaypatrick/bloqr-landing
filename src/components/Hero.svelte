<script>
  import { LINKS } from '../config';

  function trackHeroCta(label) {
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

    <div class="byo-pill" aria-label="Vendor flexibility">
      <span class="byo-icon" aria-hidden="true">🔌</span>
      <span><strong>Bring your own vendor.</strong> Already on AdGuard, NextDNS, or Pi-hole? Keep it. Bloqr layers on top. Or let us handle everything — your choice, always.</span>
    </div>

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

  .byo-pill {
    display: inline-flex;
    align-items: flex-start;
    gap: 10px;
    max-width: 560px;
    margin: 0 auto 40px;
    padding: 14px 20px;
    border-radius: 12px;
    border: 1px solid rgba(255, 85, 0, 0.2);
    background: rgba(255, 85, 0, 0.05);
    font-size: 0.92rem;
    color: var(--text-2);
    line-height: 1.5;
    text-align: left;
  }

  .byo-pill strong {
    color: var(--text-1);
  }

  .byo-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 72px;
  }

  .pkg-link {
    font-family: var(--font-mono);
    font-size: 13px;
    color: var(--cyan);
  }

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
