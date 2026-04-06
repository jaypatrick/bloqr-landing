<section class="dw-section" id="dynamic-workers" aria-labelledby="dw-heading">
  <div class="container">

    <div class="dw-header">
      <div class="section-label" aria-hidden="true">Infrastructure · Security</div>
      <h2 id="dw-heading">
        Every request gets its own <em>private universe</em> — and then it disappears.
      </h2>
      <p class="section-sub">
        Bloqr recently migrated to <strong>Cloudflare Dynamic Workers</strong> — a
        relatively new capability we're actively stress-testing, and frankly pretty
        excited about. Here's what it means for you.
      </p>
    </div>

    <div class="dw-grid">

      <div class="dw-main-card">
        <div class="card-icon" aria-hidden="true">🏗️</div>
        <h3>Spins up. Runs. Vanishes.</h3>
        <p>
          A traditional server sits on the internet 24 hours a day, waiting — which means
          it's also exposed 24 hours a day. Dynamic Workers are different. When your filter
          list compiles, a fresh Worker spawns, executes exactly that task, and ceases to
          exist. No lingering process. No accumulated state. Nothing sitting idle accumulating
          risk between your requests.
        </p>
        <div class="analogy-box" role="note">
          <span class="analogy-icon" aria-hidden="true">🏧</span>
          <span>
            <strong>Like an ATM.</strong> It doesn't remember the person before you.
            It doesn't keep a running log of which accounts were accessed.
            Each transaction is complete, isolated, and gone. Bloqr's Dynamic Workers
            work the same way — each compilation request is its own self-contained
            event, with no knowledge of any other.
          </span>
        </div>
      </div>

      <div class="dw-cards-right">

        <article class="dw-card">
          <div class="card-icon-sm" aria-hidden="true">🧊</div>
          <h4>V8 isolate sandboxing</h4>
          <p>
            Each Worker runs inside a V8 isolate — the same technology Chrome uses to
            prevent one browser tab from reading another tab's data. A second layer of
            Linux namespaces and system-call filtering blocks filesystem and network access
            completely. One request cannot reach another. Not even in theory.
          </p>
        </article>

        <article class="dw-card">
          <div class="card-icon-sm" aria-hidden="true">🚧</div>
          <h4>Egress control</h4>
          <p>
            Every outbound network call a Worker makes can be restricted, intercepted, or
            audited. A Worker running on your behalf cannot silently contact a third-party
            server, exfiltrate data, or make calls beyond what the operation explicitly
            needs. This is enforced at the infrastructure level — not a convention, not a
            code review, not a pinky promise.
          </p>
        </article>

        <article class="dw-card">
          <div class="card-icon-sm" aria-hidden="true">⚡</div>
          <h4>Patched before breakfast</h4>
          <p>
            Cloudflare maintains a patch gap of under 24 hours for V8 security
            vulnerabilities — applied across the entire global network simultaneously.
            No release cycle. No "we'll get to it." The fix ships globally before most
            users have finished their coffee.
          </p>
        </article>

        <article class="dw-card dw-card--highlight">
          <div class="card-icon-sm" aria-hidden="true">🔬</div>
          <h4>We're stress-testing this right now</h4>
          <p>
            Dynamic Workers is a relatively new Cloudflare capability. Bloqr is among the
            first services building real production workloads on top of it. We'll be
            publishing what we learn — architecture notes, performance data, and
            honest findings — as we go.
          </p>
        </article>

      </div>
    </div>

    <div class="dw-footer">
      <a
        href="https://developers.cloudflare.com/dynamic-workers/"
        class="source-link"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Cloudflare Dynamic Workers documentation (opens in new tab)"
      >
        Cloudflare Dynamic Workers docs →
      </a>
      <a
        href="https://developers.cloudflare.com/workers/learning/security-model/"
        class="source-link"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Workers security model (opens in new tab)"
      >
        Workers security model →
      </a>
    </div>

  </div>
</section>

<style>
  .dw-section {
    padding: 96px 0 80px;
    border-top: 1px solid var(--border);
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px;
  }

  /* Header */
  .dw-header {
    max-width: 720px;
    margin-bottom: 56px;
  }

  .section-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--orange);
    margin-bottom: 16px;
  }

  h2 {
    font-size: clamp(1.6rem, 3.5vw, 2.4rem);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.025em;
    margin-bottom: 20px;
  }

  h2 em {
    font-style: normal;
    color: var(--orange);
  }

  .section-sub {
    font-size: 0.97rem;
    color: var(--text-2);
    line-height: 1.65;
    max-width: 600px;
  }

  .section-sub strong { color: var(--text-1); }

  /* Main layout grid */
  .dw-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    align-items: start;
    margin-bottom: 40px;
  }

  @media (max-width: 820px) {
    .dw-grid { grid-template-columns: 1fr; }
  }

  /* Big left card */
  .dw-main-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 32px;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 16px;
    transition: border-color 0.2s;
  }

  .dw-main-card:hover { border-color: rgba(255, 85, 0, 0.3); }

  .card-icon { font-size: 2rem; line-height: 1; }

  .dw-main-card h3 {
    font-size: 1.2rem;
    font-weight: 800;
    color: var(--text-1);
    margin: 0;
  }

  .dw-main-card p {
    font-size: 0.92rem;
    color: var(--text-2);
    line-height: 1.7;
    margin: 0;
  }

  .analogy-box {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    padding: 14px 16px;
    border-radius: 8px;
    background: rgba(255, 85, 0, 0.05);
    border: 1px solid rgba(255, 85, 0, 0.15);
    font-size: 0.86rem;
    color: var(--text-2);
    line-height: 1.55;
    margin-top: 4px;
  }

  .analogy-box strong { color: var(--text-1); }
  .analogy-icon { font-size: 1.1rem; flex-shrink: 0; padding-top: 1px; }

  /* Right column of 4 smaller cards */
  .dw-cards-right {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  @media (max-width: 500px) {
    .dw-cards-right { grid-template-columns: 1fr; }
  }

  .dw-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    transition: border-color 0.2s;
  }

  .dw-card:hover { border-color: rgba(255, 85, 0, 0.25); }

  .dw-card--highlight {
    border-color: rgba(255, 85, 0, 0.2);
    background: rgba(255, 85, 0, 0.03);
  }

  .card-icon-sm { font-size: 1.3rem; line-height: 1; }

  .dw-card h4 {
    font-size: 0.9rem;
    font-weight: 700;
    color: var(--text-1);
    margin: 0;
    line-height: 1.3;
  }

  .dw-card p {
    font-size: 0.82rem;
    color: var(--text-2);
    line-height: 1.6;
    margin: 0;
  }

  /* Footer links */
  .dw-footer {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
    padding-top: 24px;
    border-top: 1px solid var(--border);
  }

  .source-link {
    font-size: 0.82rem;
    font-weight: 600;
    color: var(--orange);
    text-decoration: none;
    letter-spacing: 0.02em;
    transition: opacity 0.15s;
  }

  .source-link:hover { opacity: 0.7; text-decoration: underline; }
</style>
