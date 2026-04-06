<script>
  let activeTab = $state(0);

  const tabs = [
    { id: 'consumers',  label: 'Just starting out', short: 'Consumers',  icon: '🛡️' },
    { id: 'powerusers', label: 'Power users',        short: 'Power users', icon: '⚡' },
    { id: 'developers', label: 'Developers & list makers', short: 'Developers', icon: '🛠️' },
    { id: 'vendors',    label: 'Vendors & partners', short: 'Vendors',    icon: '🤝' },
  ];
</script>

<!-- Audiences: persona-based tab switcher. All four sections are in the DOM for SEO. -->
<section class="audiences" id="audiences">
  <div class="container">

    <div class="header">
      <p class="section-label">Who it's for</p>
      <h2 class="section-title">Find your fit.<br />We'll meet you there.</h2>
      <p class="section-desc">
        Whether you've never heard of a blocklist or you've been writing them since Perl was cool —
        Bloqr works the way you work.
      </p>
    </div>

    <!-- Tab nav -->
    <div class="tab-nav" role="tablist" aria-label="User personas">
      {#each tabs as tab, i}
        <button
          class="tab-btn"
          class:active={activeTab === i}
          role="tab"
          aria-selected={activeTab === i}
          aria-controls={`panel-${tab.id}`}
          id={`tab-${tab.id}`}
          onclick={() => activeTab = i}
        >
          <span class="tab-icon" aria-hidden="true">{tab.icon}</span>
          <span class="tab-label-full">{tab.label}</span>
          <span class="tab-label-short">{tab.short}</span>
        </button>
      {/each}
    </div>

    <!-- ── Panel 0: Consumers ──────────────────────────────── -->
    <div
      class="panel"
      class:hidden={activeTab !== 0}
      id="panel-consumers"
      role="tabpanel"
      aria-labelledby="tab-consumers"
    >
      <div class="panel-inner">
        <div class="panel-copy">
          <div class="persona-badge">No setup required</div>
          <h3>The internet you thought you already had.</h3>
          <p class="panel-lead">
            Create an account. Tell us what annoys you. We handle everything else —
            forever. You will never write a rule, configure a server, or read a log.
          </p>
          <ul class="benefit-list">
            <li>
              <span class="bl-icon">🤖</span>
              <div>
                <strong>AI builds your list for you.</strong>
                Real-time threat intelligence, curated and updated automatically.
                No maintenance. No decisions.
              </div>
            </li>
            <li>
              <span class="bl-icon">🔗</span>
              <div>
                <strong>We connect to your filtering service.</strong>
                Pick from our curated list of trusted vendors — or let us choose.
                We hook into their API so you never have to open their settings page.
              </div>
            </li>
            <li>
              <span class="bl-icon">📱</span>
              <div>
                <strong>Works on every device, everywhere.</strong>
                Same protection at home, at work, at the coffee shop.
                One change propagates everywhere, instantly.
              </div>
            </li>
            <li>
              <span class="bl-icon">📈</span>
              <div>
                <strong>We'll teach you, on your schedule.</strong>
                Start simple. Unlock more as you get curious.
                We'll never throw you in the deep end.
              </div>
            </li>
          </ul>
          <div class="panel-note">
            💡 Not sure which vendor to use? We'll walk you through it. No technical
            knowledge required — we promise.
          </div>
        </div>
        <div class="panel-visual">
          <div class="mock-card">
            <div class="mock-header">
              <div class="mock-dots">
                <span></span><span></span><span></span>
              </div>
              <span class="mock-title">Bloqr — Getting started</span>
            </div>
            <div class="mock-body">
              <div class="mock-step completed">
                <span class="step-check">✓</span>
                <span>Account created</span>
              </div>
              <div class="mock-step active">
                <span class="step-num">2</span>
                <span>What would you like to block?</span>
              </div>
              <div class="mock-choices">
                <label class="mock-choice checked">
                  <span class="choice-check">✓</span> Ads &amp; trackers
                </label>
                <label class="mock-choice checked">
                  <span class="choice-check">✓</span> Malware domains
                </label>
                <label class="mock-choice">
                  <span class="choice-check"></span> Adult content
                </label>
                <label class="mock-choice">
                  <span class="choice-check"></span> Social media
                </label>
              </div>
              <div class="mock-step">
                <span class="step-num">3</span>
                <span class="dimmed">Choose a vendor <span class="mock-tag">We'll suggest one</span></span>
              </div>
              <button class="mock-btn">Build my list →</button>
            </div>
          </div>
          <p class="visual-caption">This is the whole setup. Really.</p>
        </div>
      </div>
    </div>

    <!-- ── Panel 1: Power Users ────────────────────────────── -->
    <div
      class="panel"
      class:hidden={activeTab !== 1}
      id="panel-powerusers"
      role="tabpanel"
      aria-labelledby="tab-powerusers"
    >
      <div class="panel-inner">
        <div class="panel-copy">
          <div class="persona-badge byo">Bring your own vendor</div>
          <h3>Keep what you've built. Finally make it scale.</h3>
          <p class="panel-lead">
            Already using AdGuard, NextDNS, or Pi-hole? Good. Keep it.
            Bloqr becomes the intelligence layer on top — so you stop doing
            the same thing in twelve places.
          </p>
          <ul class="benefit-list">
            <li>
              <span class="bl-icon">🖥️</span>
              <div>
                <strong>Single pane of glass.</strong>
                One dashboard. Every device, every instance, every rule.
                Change something once. It's everywhere in seconds.
              </div>
            </li>
            <li>
              <span class="bl-icon">💬</span>
              <div>
                <strong>Natural language rule building.</strong>
                "Block everything related to AWS." Bloqr finds the endpoints,
                builds the rules, validates the output. You approve, we deploy.
              </div>
            </li>
            <li>
              <span class="bl-icon">👨‍👩‍👧</span>
              <div>
                <strong>Manage multiple instances.</strong>
                Your setup, your family's setup, a friend's setup.
                Different rules per group. Same single interface.
              </div>
            </li>
            <li>
              <span class="bl-icon">🔎</span>
              <div>
                <strong>Full transparency. Full control.</strong>
                Every blocked domain is visible and auditable.
                Whitelist a false positive in one click — applied everywhere.
              </div>
            </li>
          </ul>
          <div class="byo-banner">
            <strong>Bring your own. Or use ours.</strong>
            You're not locked in to anything. If you switch vendors tomorrow,
            your rules, your lists, and your configuration come with you.
          </div>
        </div>
        <div class="panel-visual">
          <div class="mock-card">
            <div class="mock-header">
              <div class="mock-dots">
                <span></span><span></span><span></span>
              </div>
              <span class="mock-title">Bloqr — Dashboard</span>
            </div>
            <div class="mock-body">
              <div class="mock-instances">
                <div class="mock-instance active-instance">
                  <span class="inst-dot green"></span>
                  <span>Home network</span>
                  <span class="inst-meta">AdGuard DNS · 4 devices</span>
                </div>
                <div class="mock-instance">
                  <span class="inst-dot green"></span>
                  <span>Sarah's setup</span>
                  <span class="inst-meta">AdGuard DNS · 2 devices</span>
                </div>
                <div class="mock-instance">
                  <span class="inst-dot amber"></span>
                  <span>Dad's laptop</span>
                  <span class="inst-meta">NextDNS · 1 device</span>
                </div>
              </div>
              <div class="mock-ai-input">
                <span class="ai-sparkle">✦</span>
                <input type="text" readonly value="Block everything related to AWS" class="mock-input" />
              </div>
              <div class="mock-stat-row">
                <div class="mock-stat">
                  <span class="mstat-n">48,291</span>
                  <span class="mstat-l">Rules active</span>
                </div>
                <div class="mock-stat">
                  <span class="mstat-n">3</span>
                  <span class="mstat-l">Instances</span>
                </div>
                <div class="mock-stat">
                  <span class="mstat-n green-text">↑ 12%</span>
                  <span class="mstat-l">Page speed</span>
                </div>
              </div>
            </div>
          </div>
          <p class="visual-caption">One dashboard. Every device you care about.</p>
        </div>
      </div>
    </div>

    <!-- ── Panel 2: Developers & List Makers ──────────────── -->
    <div
      class="panel"
      class:hidden={activeTab !== 2}
      id="panel-developers"
      role="tabpanel"
      aria-labelledby="tab-developers"
    >
      <div class="panel-inner panel-inner--dev">
        <div class="panel-copy">
          <div class="persona-badge dev">API-first · Fully extensible</div>
          <h3>Your pipeline. Our engine. One less brittle script.</h3>
          <p class="panel-lead">
            REST API, CLI, and embeddable TypeScript library — pick your interface.
            For list makers: automate the build pipeline without surrendering the curation edge
            that makes your lists worth using.
          </p>
          <ul class="benefit-list">
            <li>
              <span class="bl-icon">📦</span>
              <div>
                <strong>Library, CLI, or API — you choose.</strong>
                Embed directly with zero network dependency, or hit the REST API from
                any language. Stream, batch, or async — all supported.
              </div>
            </li>
            <li>
              <span class="bl-icon">🔧</span>
              <div>
                <strong>Fully extensible transformation pipeline.</strong>
                11 built-in transformations. Write your own.
                Apply per-source or globally. JSON or YAML config.
              </div>
            </li>
            <li>
              <span class="bl-icon">📋</span>
              <div>
                <strong>List makers: free verified tier.</strong>
                Automate your build. Keep your curation process.
                Publish under your own name. Your reputation stays yours.
              </div>
            </li>
            <li>
              <span class="bl-icon">🔄</span>
              <div>
                <strong>CI/CD native.</strong>
                Runs in GitHub Actions, any pipeline, any container.
                Config lives in version control where it belongs.
              </div>
            </li>
          </ul>
          <div class="dev-note">
            List makers: we know you've been asked this before. We're not here to
            replace your sourcing. We're here to kill the Python script so you can
            focus on the part only you can do.
          </div>
        </div>
        <div class="panel-visual dev-visual">
          <div class="code-demo">
            <div class="code-header">
              <span class="code-lang">JSON config</span>
              <span class="code-badge">Generated by UI — or write it yourself</span>
            </div>
            <pre class="code-pre"><code><span class="ck">"sources"</span><span class="cp">: [</span>
  <span class="cp">&#123;</span>
    <span class="ck">"source"</span><span class="cp">:</span> <span class="cs">"https://hagezi.com/pro.txt"</span><span class="cp">,</span>
    <span class="ck">"type"</span><span class="cp">:</span> <span class="cs">"adblock"</span>
  <span class="cp">&#125;,</span>
  <span class="cp">&#123;</span>
    <span class="ck">"source"</span><span class="cp">:</span> <span class="cs">"./my-custom-rules.txt"</span>
  <span class="cp">&#125;</span>
<span class="cp">],</span>
<span class="ck">"transformations"</span><span class="cp">: [</span>
  <span class="cs">"Validate"</span><span class="cp">,</span>
  <span class="cs">"Deduplicate"</span><span class="cp">,</span>
  <span class="cs">"Compress"</span>
<span class="cp">]</span></code></pre>
          </div>
          <div class="api-pills">
            <span class="api-pill"><span class="method">POST</span> /compile/stream</span>
            <span class="api-pill"><span class="method">POST</span> /compile/batch</span>
            <span class="api-pill lib">import &#123; FilterCompiler &#125; from "@bloqr/compiler"</span>
          </div>
          <p class="visual-caption">The UI generates this. You can also write it from scratch.</p>
        </div>
      </div>
    </div>

    <!-- ── Panel 3: Vendors & Partners ────────────────────── -->
    <div
      class="panel"
      class:hidden={activeTab !== 3}
      id="panel-vendors"
      role="tabpanel"
      aria-labelledby="tab-vendors"
    >
      <div class="panel-inner">
        <div class="panel-copy">
          <div class="persona-badge partner">Partner program</div>
          <h3>We're your intelligence layer, not your competition.</h3>
          <p class="panel-lead">
            AdGuard, NextDNS, Pi-hole, uBlock — your filtering engine is excellent.
            Bloqr is the AI list intelligence and management layer that makes it
            even more valuable to your users. We send you users. You protect them.
          </p>
          <ul class="benefit-list">
            <li>
              <span class="bl-icon">🔌</span>
              <div>
                <strong>API-first integration.</strong>
                Your UI stays your UI. We hook into your API on behalf of shared users.
                They manage everything from Bloqr's interface — powered by your engine.
              </div>
            </li>
            <li>
              <span class="bl-icon">📢</span>
              <div>
                <strong>We drive users to your platform.</strong>
                Everyday consumers who would never have found you get a Bloqr account
                and a vendor recommendation. That's your funnel, growing.
              </div>
            </li>
            <li>
              <span class="bl-icon">🏷️</span>
              <div>
                <strong>Co-marketing and referral program.</strong>
                "Powered by Bloqr" or "Secured by Bloqr" — we're working toward
                partner badges that signal trust to your users and ours.
              </div>
            </li>
            <li>
              <span class="bl-icon">🛡️</span>
              <div>
                <strong>We never undercut your core value.</strong>
                Your filtering engine is your product. We don't compete with that.
                We compete with the parts of the workflow that are tedious for your
                users and costly for you to support.
              </div>
            </li>
          </ul>
          <div class="partner-cta">
            <p>
              If we can get <strong>"AdGuard — Powered by Bloqr"</strong> on a vendor
              website, we'll have made it. That's the goal.
            </p>
          </div>
        </div>
        <div class="panel-visual">
          <div class="mock-card partner-card">
            <div class="mock-header">
              <div class="mock-dots">
                <span></span><span></span><span></span>
              </div>
              <span class="mock-title">Bloqr — Vendor integrations</span>
            </div>
            <div class="mock-body">
              <div class="vendor-list">
                <div class="vendor-row connected">
                  <span class="vr-logo">🛡️</span>
                  <div class="vr-info">
                    <span class="vr-name">AdGuard DNS</span>
                    <span class="vr-status connected-status">● Connected · 3 instances</span>
                  </div>
                  <span class="vr-badge">Primary</span>
                </div>
                <div class="vendor-row">
                  <span class="vr-logo">⚡</span>
                  <div class="vr-info">
                    <span class="vr-name">NextDNS</span>
                    <span class="vr-status">Not connected</span>
                  </div>
                  <span class="vr-connect">Connect →</span>
                </div>
                <div class="vendor-row">
                  <span class="vr-logo">🕳️</span>
                  <div class="vr-info">
                    <span class="vr-name">Pi-hole</span>
                    <span class="vr-status">Self-hosted · Docker</span>
                  </div>
                  <span class="vr-connect">Setup →</span>
                </div>
              </div>
              <div class="switch-note">
                Switching vendors? Your rules come with you.
              </div>
            </div>
          </div>
          <p class="visual-caption">
            One integration. All vendors. Users never leave your platform.
          </p>
        </div>
      </div>
    </div>

  </div>
</section>

<style>
  .audiences {
    padding: 80px 0;
    border-top: 1px solid var(--border);
  }

  .header {
    text-align: center;
    margin-bottom: 48px;
  }

  .header .section-desc {
    max-width: 560px;
    margin: 0 auto;
  }

  /* ── Tab nav ─────────────────────────────────────────── */
  .tab-nav {
    display: flex;
    gap: 4px;
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 5px;
    background: var(--bg-surface);
    margin-bottom: 40px;
    flex-wrap: wrap;
  }

  .tab-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    padding: 10px 16px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: var(--text-3);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 200ms, color 200ms;
    white-space: nowrap;
    justify-content: center;
  }

  .tab-btn:hover {
    background: var(--bg-elevated);
    color: var(--text-2);
  }

  .tab-btn.active {
    background: var(--bg-elevated);
    color: var(--text-1);
    box-shadow: 0 1px 4px rgba(0,0,0,0.3);
  }

  .tab-btn.active .tab-icon { opacity: 1; }

  .tab-icon { font-size: 16px; opacity: 0.7; flex-shrink: 0; }
  .tab-label-short { display: none; }

  @media (max-width: 700px) {
    .tab-label-full { display: none; }
    .tab-label-short { display: inline; }
    .tab-btn { padding: 10px 12px; }
  }

  @media (max-width: 480px) {
    .tab-nav { border-radius: 10px; }
    .tab-btn { flex: 0 0 calc(50% - 4px); }
  }

  /* ── Panel ───────────────────────────────────────────── */
  .panel { display: block; }
  .panel.hidden { display: none; }

  .panel-inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 56px;
    align-items: center;
  }

  .panel-inner--dev {
    align-items: start;
  }

  @media (max-width: 900px) {
    .panel-inner {
      grid-template-columns: 1fr;
      gap: 36px;
    }
  }

  /* ── Panel copy ──────────────────────────────────────── */
  .persona-badge {
    display: inline-flex;
    align-items: center;
    padding: 4px 12px;
    border-radius: 9999px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    background: rgba(255,85,0,0.08);
    border: 1px solid rgba(255,85,0,0.25);
    color: var(--orange);
    margin-bottom: 16px;
  }

  .persona-badge.byo {
    background: rgba(0,212,255,0.06);
    border-color: rgba(0,212,255,0.2);
    color: var(--cyan);
  }

  .persona-badge.dev {
    background: rgba(195,232,141,0.08);
    border-color: rgba(195,232,141,0.25);
    color: #C3E88D;
  }

  .persona-badge.partner {
    background: rgba(255,203,107,0.08);
    border-color: rgba(255,203,107,0.25);
    color: #FFCB6B;
  }

  .panel-copy h3 {
    font-size: clamp(1.3rem, 2.5vw, 1.8rem);
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.15;
    margin-bottom: 16px;
    color: var(--text-1);
  }

  .panel-lead {
    font-size: 0.95rem;
    color: var(--text-2);
    line-height: 1.7;
    margin-bottom: 28px;
    max-width: 480px;
  }

  .benefit-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 18px;
    margin-bottom: 24px;
  }

  .benefit-list li {
    display: flex;
    gap: 14px;
    align-items: flex-start;
  }

  .bl-icon {
    font-size: 18px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .benefit-list li strong {
    display: block;
    font-size: 0.875rem;
    font-weight: 700;
    color: var(--text-1);
    margin-bottom: 2px;
  }

  .benefit-list li div {
    font-size: 0.85rem;
    color: var(--text-2);
    line-height: 1.6;
  }

  .panel-note, .dev-note {
    font-size: 0.82rem;
    color: var(--text-3);
    padding: 12px 16px;
    background: rgba(255,85,0,0.04);
    border: 1px solid rgba(255,85,0,0.15);
    border-radius: 8px;
    line-height: 1.55;
  }

  .byo-banner {
    padding: 16px 20px;
    background: rgba(0,212,255,0.05);
    border: 1px solid rgba(0,212,255,0.15);
    border-radius: 10px;
    font-size: 0.875rem;
    color: var(--text-2);
    line-height: 1.6;
  }

  .byo-banner strong { color: var(--cyan); display: block; margin-bottom: 4px; }

  .dev-note {
    background: rgba(195,232,141,0.04);
    border-color: rgba(195,232,141,0.15);
  }

  .partner-cta {
    padding: 16px 20px;
    background: rgba(255,203,107,0.05);
    border: 1px solid rgba(255,203,107,0.2);
    border-radius: 10px;
    font-size: 0.875rem;
    color: var(--text-2);
    line-height: 1.6;
  }

  .partner-cta strong { color: #FFCB6B; }

  /* ── Mock card (UI mockup) ───────────────────────────── */
  .panel-visual { position: relative; }
  .visual-caption {
    font-size: 11px;
    color: var(--text-3);
    text-align: center;
    margin-top: 12px;
    letter-spacing: 0.04em;
  }

  .mock-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4);
  }

  .mock-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border);
  }

  .mock-dots {
    display: flex;
    gap: 5px;
  }

  .mock-dots span {
    display: block;
    width: 10px; height: 10px;
    border-radius: 50%;
    background: var(--border-2);
  }

  .mock-title {
    font-size: 12px;
    color: var(--text-3);
    font-family: var(--font-mono);
  }

  .mock-body {
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .mock-step {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 13px;
    color: var(--text-3);
  }

  .mock-step.completed { color: var(--text-2); }
  .mock-step.active { color: var(--text-1); font-weight: 600; }

  .step-check {
    width: 22px; height: 22px;
    border-radius: 50%;
    background: rgba(255,85,0,0.15);
    border: 1px solid rgba(255,85,0,0.4);
    color: var(--orange);
    font-size: 11px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .step-num {
    width: 22px; height: 22px;
    border-radius: 50%;
    background: var(--bg-elevated);
    border: 1px solid var(--border-2);
    color: var(--text-3);
    font-size: 11px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    font-family: var(--font-mono);
  }

  .dimmed { color: var(--text-3); }

  .mock-tag {
    font-size: 10px;
    padding: 2px 7px;
    border-radius: 4px;
    background: rgba(255,85,0,0.08);
    border: 1px solid rgba(255,85,0,0.2);
    color: var(--orange);
    font-weight: 600;
    margin-left: 4px;
    letter-spacing: 0.03em;
  }

  .mock-choices {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 12px 16px;
    background: var(--bg-elevated);
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .mock-choice {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--text-3);
    cursor: default;
  }

  .mock-choice.checked { color: var(--text-1); }

  .choice-check {
    width: 16px; height: 16px;
    border-radius: 4px;
    border: 1px solid var(--border-2);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
    flex-shrink: 0;
  }

  .mock-choice.checked .choice-check {
    background: rgba(255,85,0,0.2);
    border-color: rgba(255,85,0,0.4);
    color: var(--orange);
  }

  .mock-btn {
    width: 100%;
    padding: 10px;
    background: var(--orange);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: default;
    margin-top: 4px;
  }

  /* Power user mock */
  .mock-instances {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .mock-instance {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border-radius: 8px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    font-size: 12px;
    color: var(--text-2);
  }

  .mock-instance.active-instance {
    border-color: rgba(255,85,0,0.2);
    background: rgba(255,85,0,0.04);
  }

  .inst-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .inst-dot.green { background: #4ade80; }
  .inst-dot.amber { background: #fbbf24; }

  .inst-meta {
    font-size: 11px;
    color: var(--text-3);
    margin-left: auto;
    font-family: var(--font-mono);
  }

  .mock-ai-input {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--bg-elevated);
    border: 1px solid rgba(255,85,0,0.25);
    border-radius: 8px;
  }

  .ai-sparkle { color: var(--orange); font-size: 14px; flex-shrink: 0; }

  .mock-input {
    background: transparent;
    border: none;
    font-size: 12px;
    color: var(--text-1);
    width: 100%;
    font-family: inherit;
    pointer-events: none;
  }

  .mock-stat-row {
    display: flex;
    gap: 8px;
  }

  .mock-stat {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 10px 8px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    gap: 3px;
  }

  .mstat-n {
    font-size: 14px;
    font-weight: 800;
    color: var(--text-1);
    font-family: var(--font-mono);
  }

  .mstat-l {
    font-size: 10px;
    color: var(--text-3);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .green-text { color: #4ade80; }

  /* Dev panel visual */
  .dev-visual {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .code-demo {
    background: var(--bg-base);
    border: 1px solid var(--border);
    border-radius: 12px;
    overflow: hidden;
  }

  .code-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: var(--bg-elevated);
    border-bottom: 1px solid var(--border);
    flex-wrap: wrap;
    gap: 8px;
  }

  .code-lang {
    font-size: 11px;
    font-weight: 700;
    font-family: var(--font-mono);
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }

  .code-badge {
    font-size: 10px;
    color: var(--text-3);
    font-style: italic;
  }

  .code-pre {
    margin: 0;
    padding: 16px;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.7;
    color: var(--text-2);
    overflow-x: auto;
  }

  .ck { color: var(--cyan); }
  .cs { color: #C3E88D; }
  .cp { color: var(--text-1); }

  .api-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .api-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 12px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 12px;
    font-family: var(--font-mono);
    color: var(--text-2);
  }

  .api-pill.lib {
    font-size: 11px;
    color: var(--cyan);
  }

  .method {
    color: var(--orange);
    font-weight: 700;
  }

  /* Vendor panel mock */
  .vendor-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .vendor-row {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .vendor-row.connected {
    border-color: rgba(74,222,128,0.25);
    background: rgba(74,222,128,0.04);
  }

  .vr-logo { font-size: 18px; flex-shrink: 0; }

  .vr-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
  }

  .vr-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-1);
  }

  .vr-status {
    font-size: 11px;
    color: var(--text-3);
    font-family: var(--font-mono);
  }

  .connected-status { color: #4ade80; }

  .vr-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 8px;
    background: rgba(74,222,128,0.1);
    border: 1px solid rgba(74,222,128,0.25);
    border-radius: 9999px;
    color: #4ade80;
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .vr-connect {
    font-size: 12px;
    color: var(--cyan);
    font-weight: 600;
    cursor: default;
  }

  .switch-note {
    font-size: 11px;
    color: var(--text-3);
    text-align: center;
    padding: 10px;
    border-top: 1px solid var(--border);
    font-style: italic;
  }
</style>
