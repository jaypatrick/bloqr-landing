<script>
  import { LINKS } from '../config';

  function trackCtaBanner(label) {
    if (typeof window !== 'undefined' && window.__posthog) {
      window.__posthog.capture('cta_banner_clicked', { label });
    }
  }
</script>
<!-- Final CTA section -->

<section class="cta">
  <div class="container">
    <p class="section-label">Ready for better internet hygiene?</p>
    <h2 class="section-title">Set it. Bloqr it. Done.<br />No tunnel required.</h2>
    <p class="section-desc">
      Tiered plans for list makers, privacy vendors, and everyone who's done
      paying monthly for a service that doesn't do what it claims.
    </p>
    <div class="tiers">
      <div class="tier">
        <span class="tier-name">Personal</span>
        <span class="tier-desc">For households who just want it handled</span>
      </div>
      <div class="tier-sep" aria-hidden="true">·</div>
      <div class="tier">
        <span class="tier-name">Power User</span>
        <span class="tier-desc">AI threat feeds + custom pipelines</span>
      </div>
      <div class="tier-sep" aria-hidden="true">·</div>
      <div class="tier">
        <span class="tier-name">Developer / Self-Hosted</span>
        <span class="tier-desc">Self-hosted · GPL-3.0 · Free forever</span>
      </div>
    </div>
    <div class="actions">
      <a href={LINKS.app} class="btn btn-primary" rel="noopener noreferrer" target="_blank" onclick={() => trackCtaBanner('launch_the_app')}>
        Launch the app <span aria-hidden="true">→</span>
      </a>
      <a href={LINKS.docs} class="btn btn-outline" rel="noopener noreferrer" target="_blank" onclick={() => trackCtaBanner('view_docs')}>
        View docs
      </a>
    </div>
  </div>
</section>

<style>
  .cta {
    padding: 80px 0;
    text-align: center;
    border-top: 1px solid var(--border);
  }

  .section-title { max-width: 600px; margin: 0 auto 16px; }
  .section-desc   { max-width: 480px; margin: 0 auto 32px; }

  .tiers {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 40px;
    padding: 20px 32px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    max-width: 680px;
    margin-left: auto;
    margin-right: auto;
  }

  .tier { text-align: center; }

  .tier-name {
    display: block;
    font-size: 0.8rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--orange);
    margin-bottom: 4px;
  }

  .tier-desc {
    display: block;
    font-size: 0.75rem;
    color: var(--text-3);
  }

  .tier-sep {
    color: var(--border-2);
    font-size: 1.5rem;
    line-height: 1;
  }

  .actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
  }
</style>
