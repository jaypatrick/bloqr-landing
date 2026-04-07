<!-- FounderNote: personal credibility section with "built in public" card -->
<script>
  import { LINKS } from '../config';
</script>

<section class="founder-note" id="founder" aria-labelledby="founder-heading">
  <div class="container">
    <div class="inner">

      <!-- Left: quote + body + byline -->
      <div class="copy">
        <p class="section-label">Why Bloqr exists</p>

        <blockquote class="pull-quote" aria-label="Founder quote">
          "Twenty years in enterprise IT teaches you things consumer tech companies
          don't want you to know."
        </blockquote>

        <p class="body-text">
          I built the first version of this for myself — a custom filter list on GitHub,
          synced to AdGuard Home servers, layered on top of encrypted DNS. It worked
          perfectly. It also took a week to set up and required a Linux server in
          my living room.
        </p>

        <p class="body-text">
          Bloqr is the answer to one question: why should this require all of that?
          It shouldn't. So I automated it.
        </p>

        <p class="byline">— Jayson Knight, Founder · 20+ years enterprise IT</p>
      </div>

      <!-- Right: "built in public" card -->
      <div class="card-wrap">
        <div class="public-card" aria-label="Built in public — open source links">
          <p class="card-label">Built in public</p>

          <ul class="links-list" aria-label="Public project links">
            <li>
              <a
                href={LINKS.github}
                class="public-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Open source compiler on GitHub (opens in new tab)"
              >
                <span class="link-icon" aria-hidden="true">⌥</span>
                <span class="link-body">
                  <span class="link-title">Open source compiler</span>
                  <span class="link-sub">GitHub</span>
                </span>
                <span class="link-arrow" aria-hidden="true">↗</span>
              </a>
            </li>
            <li>
              <a
                href={LINKS.jsr}
                class="public-link"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="@jk-com/adblock-compiler on JSR (opens in new tab)"
              >
                <span class="link-icon" aria-hidden="true">📦</span>
                <span class="link-body">
                  <span class="link-title">@jk-com/adblock-compiler</span>
                  <span class="link-sub">JSR</span>
                </span>
                <span class="link-arrow" aria-hidden="true">↗</span>
              </a>
            </li>
          </ul>

          <p class="card-note">
            The core of what Bloqr does is open source and auditable. Not as a
            marketing claim — as a technical fact.
          </p>
        </div>
      </div>

    </div>
  </div>
</section>

<style>
  .founder-note {
    padding: 80px 0;
    border-top: 1px solid var(--border);
  }

  .inner {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: 64px;
    align-items: start;
  }

  @media (max-width: 900px) {
    .inner {
      grid-template-columns: 1fr;
      gap: 40px;
    }
  }

  /* ── Copy ── */
  .pull-quote {
    font-size: clamp(1.2rem, 2.5vw, 1.55rem);
    font-weight: 700;
    line-height: 1.35;
    letter-spacing: -0.02em;
    color: var(--text-1);
    margin: 0 0 28px;
    padding: 0;
    border: none;
  }

  .body-text {
    font-size: 0.975rem;
    color: var(--text-2);
    line-height: 1.7;
    margin-bottom: 16px;
  }

  .byline {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text-3);
    margin-top: 24px;
    letter-spacing: 0.01em;
  }

  /* ── Card ── */
  .card-wrap {
    position: sticky;
    top: 100px;
  }

  .public-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 28px;
  }

  .card-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--orange);
    margin-bottom: 20px;
  }

  /* ── Public links list ── */
  .links-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-bottom: 20px;
  }

  .public-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 10px;
    text-decoration: none;
    transition: border-color 150ms, background 150ms;
  }

  .public-link:hover {
    border-color: var(--border-2);
    background: var(--bg-surface);
  }

  .link-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  .link-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .link-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text-1);
    font-family: var(--font-mono);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .link-sub {
    font-size: 11px;
    color: var(--text-3);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }

  .link-arrow {
    font-size: 13px;
    color: var(--orange);
    flex-shrink: 0;
  }

  /* ── Card note ── */
  .card-note {
    font-size: 0.8rem;
    color: var(--text-3);
    line-height: 1.6;
    margin: 0;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }
</style>
