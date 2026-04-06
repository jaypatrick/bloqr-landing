<!-- Features grid: 6 key capabilities -->

<script>
  const features = [
    {
      icon: '⚡',
      title: 'Edge-first architecture',
      desc: 'Runs natively at the edge — 300+ global PoPs, zero cold starts, zero server overhead. Your VPN has data centers. We have everywhere.',
    },
    {
      icon: '🤖',
      title: 'AI-powered threat intelligence',
      desc: 'AI continuously monitors emerging malware domains, phishing campaigns, and trackers — surfacing and blocking all threats in real time, before the bad guys finish their morning coffee.',
    },
    {
      icon: '🔄',
      title: '11 composable transformations',
      desc: 'Deduplicate, validate, compress, strip comments, convert to ASCII, invert allow rules — stack them however you like, per source.',
    },
    {
      icon: '📡',
      title: 'Three compilation modes',
      desc: 'Real-time streaming via SSE, batch processing up to 10 lists, or async queue-based compilation for the truly ambitious.',
    },
    {
      icon: '📋',
      title: 'OpenAPI + TypeScript',
      desc: 'Fully typed interfaces, a proper OpenAPI spec, and a JSR package. Slot it in, don\'t fight it.',
    },
    {
      icon: '🔐',
      title: 'Production hardened',
      desc: 'Rate limiting, circuit breakers, structured JSON logging, OpenTelemetry, and RBAC. Boring? Yes. Essential? Absolutely.',
    },
  ];
</script>

<section class="features" id="features">
  <div class="container">
    <div class="header">
      <div>
        <p class="section-label">Capabilities</p>
        <h2 class="section-title">Production-ready.<br />No compromises.</h2>
      </div>
      <p class="section-desc aside">
        Everything you'd spend six months building — done right, battle-tested at the edge, and running before your next coffee. You're welcome.
      </p>
    </div>

    <div class="grid">
      {#each features as f}
        <div class="cell">
          <div class="cell-icon">{f.icon}</div>
          <h4>{f.title}</h4>
          <p>{f.desc}</p>
        </div>
      {/each}
    </div>
  </div>
</section>

<style>
  .features {
    padding: 80px 0;
    border-top: 1px solid var(--border);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 56px;
    gap: 32px;
  }

  .aside { max-width: 340px; }

  @media (max-width: 768px) {
    .header { flex-direction: column; align-items: flex-start; }
    .aside  { max-width: 100%; }
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    background: var(--border);
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--border);
  }

  @media (max-width: 900px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 560px) { .grid { grid-template-columns: 1fr; } }

  .cell {
    background: var(--bg-surface);
    padding: 32px;
    transition: background 200ms;
  }

  .cell:hover { background: var(--bg-elevated); }

  .cell-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
    margin-bottom: 16px;
    background: var(--bg-elevated);
    border: 1px solid var(--border-2);
  }

  h4 {
    font-size: 0.95rem;
    font-weight: 700;
    margin-bottom: 6px;
  }

  p {
    font-size: 0.825rem;
    color: var(--text-2);
    line-height: 1.6;
  }
</style>
