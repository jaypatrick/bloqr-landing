<section class="why-cf" id="why-cloudflare" aria-labelledby="why-cf-heading">
  <div class="container">

    <div class="section-label" aria-hidden="true">Infrastructure &amp; Trust</div>

    <h2 id="why-cf-heading">
      Why Bloqr runs on Cloudflare — <em>and why that matters to you</em>
    </h2>

    <p class="section-sub">
      For a privacy tool, the platform it runs on isn't an implementation detail — it's a core promise.
      Every claim below links to primary sources. Read the fine print. We encourage it.
    </p>

    <div class="claims-grid">

      <!-- 1. Serverless = no persistent attack surface -->
      <article class="claim-card" aria-label="Serverless security model">
        <div class="claim-icon" aria-hidden="true">🧱</div>
        <h3>No servers to compromise</h3>
        <p>
          Bloqr runs on <strong>Cloudflare Workers</strong> — serverless functions that spin up
          in microseconds and disappear. There's no persistent server sitting on the internet
          waiting to be hacked. Think of it as a vending machine that appears only when you
          press the button, then vanishes.
        </p>
        <p class="claim-technical">
          Workers use <strong>V8 isolates</strong> — the same sandboxing technology inside Chrome —
          to run each request in strict isolation. Cloudflare patches V8 security vulnerabilities
          in under 24 hours on average, across its entire global network simultaneously.
        </p>
        <a
          href="https://developers.cloudflare.com/workers/learning/security-model/"
          class="claim-source"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Cloudflare Workers security model documentation (opens in new tab)"
        >
          Cloudflare Workers Security Model →
        </a>
      </article>

      <!-- 2. The Six Never-Dones -->
      <article class="claim-card" aria-label="Cloudflare's six never-done commitments">
        <div class="claim-icon" aria-hidden="true">🔒</div>
        <h3>Six things Cloudflare has <em>never</em> done</h3>
        <p>
          Cloudflare publishes a semi-annual transparency report. In it, they make six explicit
          commitments about what they have never done — and would exhaust all legal remedies to
          avoid ever doing:
        </p>
        <ul class="never-list" aria-label="Cloudflare's six never-done commitments">
          <li>Surrendered encryption or authentication keys</li>
          <li>Installed law enforcement software on their network</li>
          <li>Provided a content feed to any government agency</li>
          <li>Modified customer content at law enforcement's request</li>
          <li>Altered DNS responses to redirect traffic</li>
          <li>Weakened their encryption at any authority's behest</li>
        </ul>
        <a
          href="https://www.cloudflare.com/transparency/"
          class="claim-source"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Cloudflare Transparency Report (opens in new tab)"
        >
          Cloudflare Transparency Report →
        </a>
      </article>

      <!-- 3. Single jurisdiction / governance -->
      <article class="claim-card" aria-label="Single jurisdiction governance">
        <div class="claim-icon" aria-hidden="true">🌐</div>
        <h3>One company. One set of rules.</h3>
        <p>
          Most VPN providers operate servers in 60+ countries, each subject to different
          national surveillance laws. Cloudflare is a single US-based company — one legal
          entity, one privacy policy, one set of rules that applies everywhere.
        </p>
        <p class="claim-technical">
          Cloudflare holds <strong>ISO 27001</strong> (information security),
          <strong>ISO 27701</strong> (privacy information management), and
          <strong>SOC 2 Type II</strong> certifications — independently audited, not self-declared.
          A GDPR Data Processing Agreement is available for all customers.
        </p>
        <a
          href="https://www.cloudflare.com/trust-hub/"
          class="claim-source"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Cloudflare Trust Hub (opens in new tab)"
        >
          Cloudflare Trust Hub →
        </a>
      </article>

      <!-- 4. DNS no-logging -->
      <article class="claim-card" aria-label="DNS resolver no-logging">
        <div class="claim-icon" aria-hidden="true">🚫</div>
        <h3>What's never logged can't be produced</h3>
        <p>
          Cloudflare's 1.1.1.1 DNS resolver — the same infrastructure Bloqr's DNS hygiene
          features sit on top of — logs no personal information. The bulk of any query data
          is purged within <strong>25 hours</strong>. No data is sold or shared with advertisers.
          Never.
        </p>
        <p class="claim-technical">
          "Cloudflare does not share 1.1.1.1 resolver logs with any third parties" — directly
          quoted from Cloudflare's own privacy policy. Query data shared with research partner
          APNIC is anonymised before transfer.
        </p>
        <a
          href="https://www.cloudflare.com/privacypolicy/"
          class="claim-source"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Cloudflare Privacy Policy (opens in new tab)"
        >
          Cloudflare Privacy Policy →
        </a>
      </article>

      <!-- 5. API security (Page Shield / API Shield teaser) -->
      <article class="claim-card claim-card--teaser" aria-label="API security coming soon">
        <div class="claim-icon" aria-hidden="true">🛡️</div>
        <div class="teaser-badge">Coming with bloqr.ai</div>
        <h3>API-level security — baked in, not bolted on</h3>
        <p>
          When Bloqr migrates to its own domain, every API call will be protected by
          Cloudflare's enterprise-grade API security layer. That means malicious bots,
          credential stuffing attacks, and API abuse are stopped at the network edge —
          before they ever reach our servers.
        </p>
        <p class="claim-technical">
          For our users: your data never rides unprotected across the open internet.
          For developers: every API key you use with Bloqr sits behind the same
          infrastructure protecting Fortune 500 companies.
        </p>
        <a
          href="https://www.cloudflare.com/application-security/"
          class="claim-source"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Cloudflare Application Security (opens in new tab)"
        >
          Cloudflare Application Security →
        </a>
      </article>

      <!-- 6. Zero Trust -->
      <article class="claim-card" aria-label="Zero Trust architecture">
        <div class="claim-icon" aria-hidden="true">🔑</div>
        <h3>Zero Trust isn't a buzzword here</h3>
        <p>
          Cloudflare built its platform on <strong>Zero Trust</strong> principles: every
          request is verified, every connection is encrypted, and nothing inside the network
          is assumed safe by default. The analogy: a hotel where every door requires a key
          card — there's no "once you're in the lobby, you're in."
        </p>
        <p class="claim-technical">
          Bloqr inherits this posture by running on Cloudflare. We add our own layer:
          no user account data is ever co-mingled with filter list compilation data.
          Your browsing preferences are structurally separated from your identity.
        </p>
        <a
          href="https://www.cloudflare.com/learning/security/glossary/what-is-zero-trust/"
          class="claim-source"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="What is Zero Trust? Cloudflare Learning Center (opens in new tab)"
        >
          What is Zero Trust? →
        </a>
      </article>

    </div><!-- /claims-grid -->

    <div class="cf-footer">
      <p>
        Cloudflare serves over <strong>20% of all internet traffic</strong> and publishes
        its security practices, transparency reports, and compliance documentation publicly.
        We chose Cloudflare precisely because their commitments are verifiable — not just marketing copy.
      </p>
      <div class="cf-links">
        <a href="https://www.cloudflare.com/trust-hub/" target="_blank" rel="noopener noreferrer">Trust Hub</a>
        <span aria-hidden="true">·</span>
        <a href="https://www.cloudflare.com/transparency/" target="_blank" rel="noopener noreferrer">Transparency Report</a>
        <span aria-hidden="true">·</span>
        <a href="https://www.cloudflare.com/trust-hub/compliance-resources/" target="_blank" rel="noopener noreferrer">Compliance &amp; Certifications</a>
        <span aria-hidden="true">·</span>
        <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
      </div>
    </div>

  </div>
</section>

<style>
  .why-cf {
    padding: 96px 0 80px;
    border-top: 1px solid var(--border);
    background: linear-gradient(180deg, transparent 0%, rgba(255,85,0,0.02) 100%);
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px;
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
    max-width: 700px;
    margin-bottom: 20px;
  }

  h2 em {
    font-style: normal;
    color: var(--orange);
  }

  .section-sub {
    font-size: 1rem;
    color: var(--text-2);
    max-width: 580px;
    line-height: 1.6;
    margin-bottom: 56px;
  }

  .claims-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-bottom: 56px;
  }

  @media (max-width: 900px) {
    .claims-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 600px) {
    .claims-grid { grid-template-columns: 1fr; }
  }

  .claim-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    transition: border-color 0.2s;
  }

  .claim-card:hover {
    border-color: rgba(255, 85, 0, 0.3);
  }

  .claim-card--teaser {
    border-color: rgba(255, 85, 0, 0.2);
    background: rgba(255, 85, 0, 0.03);
    position: relative;
  }

  .teaser-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(255, 85, 0, 0.12);
    border: 1px solid rgba(255, 85, 0, 0.25);
    font-size: 11px;
    font-weight: 600;
    color: var(--orange);
    letter-spacing: 0.04em;
    text-transform: uppercase;
    width: fit-content;
  }

  .claim-icon {
    font-size: 1.5rem;
    line-height: 1;
  }

  .claim-card h3 {
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.3;
    margin: 0;
    color: var(--text-1);
  }

  .claim-card h3 em {
    font-style: italic;
    color: var(--orange);
  }

  .claim-card p {
    font-size: 0.88rem;
    color: var(--text-2);
    line-height: 1.6;
    margin: 0;
  }

  .claim-technical {
    font-size: 0.82rem !important;
    color: var(--text-3) !important;
    border-left: 2px solid var(--border);
    padding-left: 10px;
    font-family: var(--font-mono, monospace);
    line-height: 1.55 !important;
  }

  .never-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .never-list li {
    font-size: 0.82rem;
    color: var(--text-2);
    padding-left: 16px;
    position: relative;
    line-height: 1.4;
  }

  .never-list li::before {
    content: '✕';
    position: absolute;
    left: 0;
    color: var(--orange);
    font-size: 0.7rem;
    font-weight: 700;
    top: 2px;
  }

  .claim-source {
    font-size: 0.78rem;
    color: var(--orange);
    text-decoration: none;
    font-weight: 600;
    letter-spacing: 0.02em;
    margin-top: auto;
    padding-top: 4px;
    display: inline-block;
    transition: opacity 0.15s;
  }

  .claim-source:hover {
    opacity: 0.75;
    text-decoration: underline;
  }

  /* Footer row */
  .cf-footer {
    border-top: 1px solid var(--border);
    padding-top: 32px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    text-align: center;
  }

  .cf-footer p {
    font-size: 0.9rem;
    color: var(--text-2);
    max-width: 600px;
    line-height: 1.6;
    margin: 0;
  }

  .cf-links {
    display: flex;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    justify-content: center;
  }

  .cf-links a {
    font-size: 0.82rem;
    color: var(--text-3);
    text-decoration: none;
    transition: color 0.15s;
  }

  .cf-links a:hover { color: var(--orange); }

  .cf-links span { color: var(--border); }
</style>
