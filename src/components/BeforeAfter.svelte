<!-- BeforeAfter: animated waterfall chart showing page load with/without Bloqr -->
<script>
  import { onMount } from 'svelte';

  let visible = $state(false);

  onMount(() => {
    // Small delay so animation plays after the section scrolls into view
    const t = setTimeout(() => { visible = true; }, 120);
    return () => clearTimeout(t);
  });

  // Without Bloqr bars: type = 'content' | 'tracker' | 'ad' | 'malware'
  const barsWithout = [
    { type: 'content',  label: 'index.html',          w: 18, delay: 0   },
    { type: 'content',  label: 'main.css',             w: 22, delay: 60  },
    { type: 'content',  label: 'app.js',               w: 38, delay: 80  },
    { type: 'tracker',  label: 'analytics.js',         w: 28, delay: 120 },
    { type: 'tracker',  label: 'pixel.png',            w: 14, delay: 140 },
    { type: 'ad',       label: 'ad-script.js',         w: 45, delay: 160 },
    { type: 'content',  label: 'hero-image.webp',      w: 55, delay: 180 },
    { type: 'tracker',  label: 'fb-pixel.js',          w: 20, delay: 200 },
    { type: 'ad',       label: 'doubleclick.js',       w: 52, delay: 210 },
    { type: 'malware',  label: 'malware-cdn.js',       w: 30, delay: 230 },
    { type: 'tracker',  label: 'hotjar.js',            w: 35, delay: 250 },
    { type: 'content',  label: 'fonts.woff2',          w: 26, delay: 270 },
    { type: 'ad',       label: 'prebid.js',            w: 60, delay: 280 },
    { type: 'malware',  label: 'tracking-beacon.gif',  w: 18, delay: 300 },
    { type: 'tracker',  label: 'segment.io',           w: 40, delay: 310 },
    { type: 'content',  label: 'content.json',         w: 24, delay: 330 },
    { type: 'malware',  label: 'cryptominer.js',       w: 50, delay: 340 },
    { type: 'ad',       label: 'ad-network.js',        w: 42, delay: 360 },
  ];

  // With Bloqr: only content bars survive; blocked ones shown as ghost bars
  const barsWith = barsWithout.map((b) => ({
    ...b,
    blocked: b.type !== 'content',
    delay: b.delay + 20, // slight offset so animation feels independent
  }));
</script>

<section class="before-after" id="before-after" aria-labelledby="ba-title">
  <div class="container">
    <div class="section-header">
      <p class="section-label">Performance</p>
      <h2 class="section-title" id="ba-title">Privacy and speed aren't a tradeoff.</h2>
      <p class="section-desc">
        When Bloqr blocks a domain, your browser never waits for it.
        Every tracker that doesn't load is time back in your life.
      </p>
    </div>

    <div class="panels" role="img" aria-label="Side-by-side page load comparison: without Bloqr shows 4.2 seconds with 18 requests including trackers and ads; with Bloqr shows 1.1 seconds with only 6 legitimate content requests">
      <!-- Without Bloqr -->
      <div class="panel panel--bad">
        <div class="panel-header">
          <span class="panel-label">Without Bloqr</span>
          <span class="load-time bad-time" aria-label="Page load time: 4.2 seconds">4.2s</span>
        </div>
        <div class="waterfall" aria-hidden="true">
          {#each barsWithout as bar, i}
            <div class="bar-row">
              <span class="bar-name">{bar.label}</span>
              <div class="bar-track">
                <div
                  class="bar bar--{bar.type}"
                  class:bar--visible={visible}
                  style="--w: {bar.w}%; --delay: {bar.delay}ms"
                  aria-hidden="true"
                ></div>
              </div>
            </div>
          {/each}
        </div>
        <div class="panel-footer bad-footer">
          <span>47 requests</span>
          <span class="sep" aria-hidden="true">·</span>
          <span>23 trackers</span>
          <span class="sep" aria-hidden="true">·</span>
          <span>8 ad scripts</span>
          <span class="sep" aria-hidden="true">·</span>
          <span class="muted">real content buried in noise</span>
        </div>
      </div>

      <!-- With Bloqr -->
      <div class="panel panel--good">
        <div class="panel-header">
          <span class="panel-label">
            With Bloqr
            <span class="check-badge" aria-label="Protected">✓</span>
          </span>
          <span class="load-time good-time" aria-label="Page load time: 1.1 seconds">1.1s</span>
        </div>
        <div class="waterfall" aria-hidden="true">
          {#each barsWith as bar, i}
            <div class="bar-row">
              <span class="bar-name" class:bar-name--blocked={bar.blocked}>{bar.label}</span>
              <div class="bar-track">
                {#if bar.blocked}
                  <div
                    class="bar bar--ghost"
                    class:bar--visible={visible}
                    style="--w: {bar.w}%; --delay: {bar.delay}ms"
                    aria-hidden="true"
                  >
                    <span class="block-icon">🚫</span>
                  </div>
                {:else}
                  <div
                    class="bar bar--clean"
                    class:bar--visible={visible}
                    style="--w: {bar.w}%; --delay: {bar.delay}ms"
                    aria-hidden="true"
                  ></div>
                {/if}
              </div>
            </div>
          {/each}
        </div>
        <div class="panel-footer good-footer">
          <span>24 requests</span>
          <span class="sep" aria-hidden="true">·</span>
          <span class="good-stat">0 trackers</span>
          <span class="sep" aria-hidden="true">·</span>
          <span class="good-stat">0 ads</span>
          <span class="sep" aria-hidden="true">·</span>
          <span class="muted">23 domains blocked before your browser asked</span>
        </div>
      </div>
    </div>

    <p class="callout">
      "Blocking isn't just a privacy improvement. When Bloqr stops a domain, your browser
      never waits for it. Less noise, faster pages — as a direct side effect of better hygiene."
    </p>
  </div>
</section>

<style>
  .before-after {
    padding: 80px 0;
    border-top: 1px solid var(--border);
  }

  .section-header {
    text-align: center;
    margin-bottom: 48px;
  }

  .section-header .section-desc {
    max-width: 520px;
    margin: 0 auto;
  }

  /* ── Two-panel layout ── */
  .panels {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  @media (max-width: 800px) {
    .panels { grid-template-columns: 1fr; }
  }

  .panel {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    overflow: hidden;
  }

  .panel--good {
    border-color: rgba(0, 212, 255, 0.2);
  }

  /* ── Panel header ── */
  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }

  .panel-label {
    font-size: 13px;
    font-weight: 700;
    color: var(--text-2);
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .check-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: rgba(0, 212, 255, 0.15);
    border: 1px solid rgba(0, 212, 255, 0.3);
    color: var(--cyan);
    font-size: 10px;
    font-weight: 800;
  }

  .load-time {
    font-size: 1.4rem;
    font-weight: 800;
    font-family: var(--font-mono);
    letter-spacing: -0.03em;
  }

  .bad-time  { color: #f87171; }
  .good-time { color: var(--cyan); }

  /* ── Waterfall bars ── */
  .waterfall {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 20px;
  }

  .bar-row {
    display: flex;
    align-items: center;
    gap: 8px;
    height: 16px;
  }

  .bar-name {
    flex-shrink: 0;
    width: 130px;
    font-size: 10px;
    font-family: var(--font-mono);
    color: var(--text-3);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .bar-name--blocked {
    text-decoration: line-through;
    opacity: 0.45;
  }

  .bar-track {
    flex: 1;
    height: 10px;
    border-radius: 3px;
    background: var(--bg-elevated);
    overflow: hidden;
    position: relative;
  }

  .bar {
    height: 100%;
    border-radius: 3px;
    width: 0;
    transition: width 0.55s var(--ease-out, cubic-bezier(0.16,1,0.3,1));
    transition-delay: var(--delay, 0ms);
    position: relative;
  }

  .bar--visible { width: var(--w); }

  .bar--content { background: rgba(148, 163, 184, 0.5); }
  .bar--tracker { background: rgba(239, 68,  68,  0.5); }
  .bar--ad      { background: rgba(251, 146, 60,  0.6); }
  .bar--malware { background: rgba(220, 38,  38,  0.65); }

  .bar--clean {
    background: linear-gradient(90deg, rgba(0,212,255,0.5), rgba(0,212,255,0.3));
  }

  .bar--ghost {
    background: var(--bg-elevated);
    border: 1px solid rgba(148, 163, 184, 0.12);
    display: flex;
    align-items: center;
    padding-left: 4px;
    max-width: var(--w);
    opacity: 0.4;
  }

  .block-icon {
    font-size: 8px;
    line-height: 1;
  }

  /* ── Panel footer ── */
  .panel-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 8px;
    font-size: 11px;
    color: var(--text-3);
    padding-top: 16px;
    border-top: 1px solid var(--border);
    align-items: center;
  }

  .sep { opacity: 0.4; }

  .muted { opacity: 0.7; }

  .good-stat { color: var(--cyan); font-weight: 600; }

  /* ── Callout quote ── */
  .callout {
    margin-top: 40px;
    max-width: 680px;
    margin-left: auto;
    margin-right: auto;
    text-align: center;
    font-size: 1rem;
    color: var(--text-2);
    line-height: 1.65;
    font-style: italic;
    border-top: 1px solid var(--border);
    padding-top: 32px;
  }
</style>
