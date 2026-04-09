<script>
  import { LINKS } from '../config';
  let showCode = $state([false, false, false]);
  function toggle(i) {
    showCode = showCode.map((val, idx) => idx === i ? !val : val);
  }
  function showUI(i) {
    showCode = showCode.map((val, idx) => idx === i ? false : val);
  }
  function showAll() {
    showCode = [true, true, true];
  }
  function showAllUI() {
    showCode = [false, false, false];
  }
  let allShowingCode = $derived(showCode.every(v => v));
</script>

<!-- How it works: 3-step walkthrough with UI mockup / code toggle -->
<section class="how" id="how">
  <div class="container">
    <div class="header">
      <div>
        <p class="section-label">How it works</p>
        <h2 class="section-title">Point. Click. Done.</h2>
        <p class="no-code-note">
          No code required — ever. The UI builds everything for you.
          Curious what's under the hood?
          <button class="reveal-all" onclick={allShowingCode ? showAllUI : showAll}>
            {allShowingCode ? '← Show all UI' : 'Show all code →'}
          </button>
        </p>
      </div>
      <a href={LINKS.docs} class="btn btn-outline btn-sm" rel="noopener noreferrer" target="_blank">
        Read the docs →
      </a>
    </div>

    <div class="steps">

      <!-- ── Step 1 ────────────────────────────────── -->
      <div class="step">
        <div class="step-num">01</div>
        <h3>Add your sources</h3>
        <p>
          Point to any public list, your own file, or let AI suggest the right
          combination for your needs. Mix formats freely — we sort it out.
        </p>

        <div class="view-toggle">
          <button
            class="toggle-btn"
            class:active={!showCode[0]}
            onclick={() => showUI(0)}
            aria-pressed={!showCode[0]}
          >⬜ See the UI</button>
          <button
            class="toggle-btn"
            class:active={showCode[0]}
            onclick={() => toggle(0)}
            aria-pressed={showCode[0]}
          >&lt;/&gt; See the code</button>
        </div>

        {#if !showCode[0]}
          <div class="ui-mock" aria-label="UI mockup: Add sources">
            <div class="mock-field-group">
              <label class="mock-label">Source URL or AI suggestion</label>
              <div class="mock-field-row">
                <div class="mock-input-box flex-1">
                  <span class="ai-icon">✦</span>
                  <span class="mock-placeholder">Paste a URL, or ask AI: "best ad-blocking lists"</span>
                </div>
                <div class="mock-select-box">adblock ▾</div>
              </div>
            </div>
            <div class="mock-source-list">
              <div class="mock-source active">
                <span class="src-dot orange"></span>
                <span class="src-name">hagezi-pro.txt</span>
                <span class="src-meta">adblock · 248k rules</span>
                <span class="src-remove">✕</span>
              </div>
              <div class="mock-source">
                <span class="src-dot orange"></span>
                <span class="src-name">oisd-full.txt</span>
                <span class="src-meta">hosts · 196k rules</span>
                <span class="src-remove">✕</span>
              </div>
              <div class="mock-source dimmed">
                <span class="src-dot gray"></span>
                <span class="src-name">my-custom-rules.txt</span>
                <span class="src-meta">custom · 34 rules</span>
                <span class="src-remove">✕</span>
              </div>
            </div>
            <button class="mock-add-btn">+ Add another source</button>
          </div>
        {:else}
          <div class="code-block" aria-label="JSON configuration: sources">
            <span class="k">"sources"</span><span class="p">: [</span><br />
            &nbsp;&nbsp;<span class="p">&#123;</span><br />
            &nbsp;&nbsp;&nbsp;&nbsp;<span class="k">"source"</span><span class="p">:</span> <span class="s">"https://hagezi.com/pro.txt"</span><span class="p">,</span><br />
            &nbsp;&nbsp;&nbsp;&nbsp;<span class="k">"type"</span><span class="p">:</span> <span class="s">"adblock"</span><br />
            &nbsp;&nbsp;<span class="p">&#125;,</span><br />
            &nbsp;&nbsp;<span class="p">&#123;</span><br />
            &nbsp;&nbsp;&nbsp;&nbsp;<span class="k">"source"</span><span class="p">:</span> <span class="s">"./my-custom-rules.txt"</span><br />
            &nbsp;&nbsp;<span class="p">&#125;</span><br />
            <span class="p">]</span>
          </div>
          <p class="code-note">The UI generates this. Download it, version it, use it in CI/CD.</p>
        {/if}
      </div>

      <div class="connector" aria-hidden="true">→</div>

      <!-- ── Step 2 ────────────────────────────────── -->
      <div class="step">
        <div class="step-num">02</div>
        <h3>Configure &amp; clean</h3>
        <p>
          Toggle the cleanup options you want. Bloqr deduplicates, validates,
          compresses, and formats everything automatically — no manual steps.
        </p>

        <div class="view-toggle">
          <button
            class="toggle-btn"
            class:active={!showCode[1]}
            onclick={() => showUI(1)}
            aria-pressed={!showCode[1]}
          >⬜ See the UI</button>
          <button
            class="toggle-btn"
            class:active={showCode[1]}
            onclick={() => toggle(1)}
            aria-pressed={showCode[1]}
          >&lt;/&gt; See the code</button>
        </div>

        {#if !showCode[1]}
          <div class="ui-mock" aria-label="UI mockup: Transformations">
            <div class="mock-label">Apply automatically</div>
            <div class="mock-toggles">
              <div class="mock-toggle on">
                <span class="tog-pill on">ON</span>
                <span class="tog-name">Remove comments</span>
              </div>
              <div class="mock-toggle on">
                <span class="tog-pill on">ON</span>
                <span class="tog-name">Validate rules</span>
              </div>
              <div class="mock-toggle on">
                <span class="tog-pill on">ON</span>
                <span class="tog-name">Deduplicate</span>
              </div>
              <div class="mock-toggle on">
                <span class="tog-pill on">ON</span>
                <span class="tog-name">Compress</span>
              </div>
              <div class="mock-toggle on">
                <span class="tog-pill on">ON</span>
                <span class="tog-name">Convert to ASCII</span>
              </div>
              <div class="mock-toggle off">
                <span class="tog-pill off">OFF</span>
                <span class="tog-name">Invert to allowlist</span>
              </div>
            </div>
            <div class="mock-result-preview">
              <span class="result-label">Result preview</span>
              <span class="result-count">48,291 rules · 2.1 MB</span>
            </div>
          </div>
        {:else}
          <div class="code-block" aria-label="JSON configuration: transformations">
            <span class="k">"transformations"</span><span class="p">: [</span><br />
            &nbsp;&nbsp;<span class="s">"RemoveComments"</span><span class="p">,</span><br />
            &nbsp;&nbsp;<span class="s">"ConvertToAscii"</span><span class="p">,</span><br />
            &nbsp;&nbsp;<span class="s">"Validate"</span><span class="p">,</span><br />
            &nbsp;&nbsp;<span class="s">"Deduplicate"</span><span class="p">,</span><br />
            &nbsp;&nbsp;<span class="s">"Compress"</span><span class="p">,</span><br />
            &nbsp;&nbsp;<span class="s">"InsertFinalNewLine"</span><br />
            <span class="p">]</span>
          </div>
          <p class="code-note">11 built-in transformations. Write your own with the extension API.</p>
        {/if}
      </div>

      <div class="connector" aria-hidden="true">→</div>

      <!-- ── Step 3 ────────────────────────────────── -->
      <div class="step">
        <div class="step-num">03</div>
        <h3>Deploy to your vendor</h3>
        <p>
          Push to your filtering service in one click. Or call the API.
          Or embed the library. Changes propagate to every device instantly.
        </p>

        <div class="view-toggle">
          <button
            class="toggle-btn"
            class:active={!showCode[2]}
            onclick={() => showUI(2)}
            aria-pressed={!showCode[2]}
          >⬜ See the UI</button>
          <button
            class="toggle-btn"
            class:active={showCode[2]}
            onclick={() => toggle(2)}
            aria-pressed={showCode[2]}
          >&lt;/&gt; See the code</button>
        </div>

        {#if !showCode[2]}
          <div class="ui-mock" aria-label="UI mockup: Deploy">
            <div class="mock-field-group">
              <label class="mock-label">Deploy to vendor</label>
              <div class="mock-select-full">
                🛡️ &nbsp;AdGuard DNS — Home network ▾
              </div>
            </div>
            <button class="mock-deploy-btn">
              <span class="deploy-icon">▶</span> Deploy now
            </button>
            <div class="mock-deploy-status">
              <div class="status-row">
                <span class="status-dot green pulse"></span>
                <span class="status-text">Last deployed: just now</span>
              </div>
              <div class="status-row">
                <span class="status-icon">📱</span>
                <span class="status-text">7 devices updated</span>
              </div>
              <div class="status-row">
                <span class="status-icon">⚡</span>
                <span class="status-text">Propagated in 1.2s</span>
              </div>
            </div>
          </div>
        {:else}
          <div class="code-block" aria-label="API usage example">
            <span class="c">// Streaming (SSE)</span><br />
            <span class="m">POST</span> <span class="s">/compile/stream</span><br />
            <br />
            <span class="c">// Batch (up to 10 lists)</span><br />
            <span class="m">POST</span> <span class="s">/compile/batch</span><br />
            <br />
            <span class="c">// Embedded — no network hop</span><br />
            <span class="k">import</span> <span class="p">&#123;</span> <span class="t">FilterCompiler</span> <span class="p">&#125;</span><br />
            &nbsp;&nbsp;<span class="k">from</span> <span class="s">"@bloqr/compiler"</span>
          </div>
          <p class="code-note">Bring your own vendor or deploy to ours. Same API either way.</p>
        {/if}
      </div>

    </div>
  </div>
</section>

<style>
  .how { padding: 80px 0; border-top: 1px solid var(--border); }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 48px;
    gap: 24px;
    flex-wrap: wrap;
  }

  .no-code-note {
    font-size: 0.875rem;
    color: var(--text-3);
    margin-top: 8px;
    line-height: 1.5;
  }

  .reveal-all {
    background: none;
    border: none;
    color: var(--cyan);
    font-size: 0.875rem;
    cursor: pointer;
    padding: 0;
    text-decoration: underline;
    text-underline-offset: 3px;
  }

  .reveal-all:hover { opacity: 0.8; }

  .steps {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr;
    gap: 0;
    align-items: start;
  }

  @media (max-width: 900px) {
    .steps { grid-template-columns: 1fr; }
    .connector { display: none; }
  }

  .connector {
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 44px;
    color: var(--border-2);
    font-size: 1.25rem;
    user-select: none;
  }

  .step {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px;
    transition: border-color 250ms;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .step:hover { border-color: var(--border-2); }

  .step-num {
    width: 36px; height: 36px;
    border-radius: 9999px;
    background: var(--orange-dim);
    border: 1px solid rgba(255,85,0,0.3);
    color: var(--orange);
    font-size: 13px;
    font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px;
    font-family: var(--font-mono);
    flex-shrink: 0;
  }

  h3 {
    font-size: 1rem;
    font-weight: 700;
    margin-bottom: 8px;
  }

  p {
    font-size: 0.875rem;
    color: var(--text-2);
    line-height: 1.65;
    margin-bottom: 16px;
  }

  /* ── Toggle ─────────────────────────────────── */
  .view-toggle {
    display: flex;
    gap: 2px;
    margin-bottom: 14px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 3px;
    flex-shrink: 0;
  }

  .toggle-btn {
    flex: 1;
    padding: 5px 10px;
    border: none;
    border-radius: 6px;
    background: transparent;
    color: var(--text-3);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: background 150ms, color 150ms;
    white-space: nowrap;
  }

  .toggle-btn:hover { color: var(--text-2); }

  .toggle-btn.active {
    background: var(--bg-surface);
    color: var(--text-1);
    box-shadow: 0 1px 3px rgba(0,0,0,0.25);
  }

  /* ── UI Mockups ──────────────────────────────── */
  .ui-mock {
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex: 1;
  }

  .mock-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .mock-field-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .mock-field-row {
    display: flex;
    gap: 6px;
  }

  .flex-1 { flex: 1; }

  .mock-input-box {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    background: var(--bg-surface);
    border: 1px solid var(--border-2);
    border-radius: 6px;
    font-size: 11px;
    color: var(--text-3);
  }

  .ai-icon { color: var(--orange); font-size: 12px; flex-shrink: 0; }
  .mock-placeholder { font-style: italic; }

  .mock-select-box {
    padding: 7px 10px;
    background: var(--bg-surface);
    border: 1px solid var(--border-2);
    border-radius: 6px;
    font-size: 11px;
    color: var(--text-2);
    white-space: nowrap;
    font-family: var(--font-mono);
  }

  .mock-select-full {
    padding: 9px 12px;
    background: var(--bg-surface);
    border: 1px solid var(--border-2);
    border-radius: 6px;
    font-size: 12px;
    color: var(--text-2);
    font-family: var(--font-mono);
  }

  .mock-source-list {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .mock-source {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 10px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 11px;
  }

  .mock-source.active { border-color: rgba(255,85,0,0.2); }
  .mock-source.dimmed { opacity: 0.5; }

  .src-dot {
    width: 6px; height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .src-dot.orange { background: var(--orange); }
  .src-dot.gray { background: var(--text-3); }

  .src-name {
    font-family: var(--font-mono);
    color: var(--text-1);
    flex: 1;
    font-size: 11px;
  }

  .src-meta {
    font-size: 10px;
    color: var(--text-3);
  }

  .src-remove {
    font-size: 10px;
    color: var(--text-3);
    cursor: default;
    margin-left: 4px;
  }

  .mock-add-btn {
    width: 100%;
    padding: 7px;
    background: transparent;
    border: 1px dashed var(--border-2);
    border-radius: 6px;
    color: var(--text-3);
    font-size: 11px;
    cursor: default;
    font-weight: 600;
  }

  /* Toggles mock */
  .mock-toggles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .mock-toggle {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 7px 10px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 11px;
  }

  .mock-toggle.on { border-color: rgba(255,85,0,0.15); }
  .mock-toggle.off { opacity: 0.5; }

  .tog-pill {
    font-size: 9px;
    font-weight: 700;
    padding: 2px 5px;
    border-radius: 3px;
    flex-shrink: 0;
    font-family: var(--font-mono);
    letter-spacing: 0.04em;
  }

  .tog-pill.on {
    background: rgba(255,85,0,0.15);
    color: var(--orange);
  }

  .tog-pill.off {
    background: var(--bg-elevated);
    color: var(--text-3);
    border: 1px solid var(--border);
  }

  .tog-name {
    font-size: 11px;
    color: var(--text-2);
  }

  .mock-result-preview {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(255,85,0,0.05);
    border: 1px solid rgba(255,85,0,0.15);
    border-radius: 6px;
  }

  .result-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-3);
  }

  .result-count {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--orange);
    font-weight: 700;
  }

  /* Deploy mock */
  .mock-deploy-btn {
    width: 100%;
    padding: 10px;
    background: var(--orange);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 700;
    cursor: default;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .deploy-icon { font-size: 10px; }

  .mock-deploy-status {
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 10px 12px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 8px;
  }

  .status-row {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: var(--text-2);
  }

  .status-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .status-dot.green { background: #4ade80; }

  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.3; }
  }

  .status-dot.pulse { animation: blink 2s infinite; }

  .status-icon { font-size: 12px; }
  .status-text { color: var(--text-2); }

  /* ── Code block ─────────────────────────────── */
  .code-block {
    background: var(--bg-base);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 14px 16px;
    font-family: var(--font-mono);
    font-size: 11.5px;
    line-height: 1.7;
    color: var(--text-2);
    overflow-x: auto;
    flex: 1;
  }

  .code-note {
    font-size: 11px;
    color: var(--text-3);
    margin-top: 8px;
    font-style: italic;
    line-height: 1.4;
    margin-bottom: 0 !important;
  }

  /* Syntax */
  .k { color: var(--cyan); }
  .s { color: #C3E88D; }
  .p { color: var(--text-1); }
  .c { color: var(--text-3); }
  .m { color: var(--orange); }
  .t { color: #FFCB6B; }
</style>
