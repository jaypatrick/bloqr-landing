<script>
  import { LINKS } from '../config';

  const HYGIENE_TERM   = 'Internet Hygiene';
  const HYGIENE_SUFFIX = ' (n.) — the ongoing practices that keep your digital life clean, private, and safe.';
  const HYGIENE_DEF    = `${HYGIENE_TERM}${HYGIENE_SUFFIX}`;
  const HYGIENE_FULL   = `${HYGIENE_DEF} Think washing your hands, but for everything you do online.`;
</script>
<!-- Site footer -->

<footer>
  <div class="container inner">
    <span class="copy">
      © 2026 Bloqr <span class="footer-ai">AI</span> ·
      Made by <a href={LINKS.author} rel="noopener">Jayson Knight</a>
    </span>
    <p class="hygiene-def">
      <strong
        class="hygiene-term"
        tabindex="0"
        aria-describedby="hygiene-tooltip"
      >{HYGIENE_TERM}</strong>{HYGIENE_SUFFIX}
      <span id="hygiene-tooltip" class="sr-only">{HYGIENE_FULL}</span>
    </p>
    <nav aria-label="Footer navigation">
      <ul>
        <li><a href={LINKS.app}      rel="noopener noreferrer" target="_blank">Launch App</a></li>
        <li><a href={LINKS.docs}     rel="noopener noreferrer" target="_blank">Docs</a></li>
        <li><a href={LINKS.pricing}>Pricing</a></li>
        <li><a href={LINKS.api}      rel="noopener noreferrer" target="_blank">API</a></li>
        <li><a href={LINKS.vpnMyths}>VPN Myths</a></li>
        <li><a href={LINKS.privacy}>Privacy</a></li>
        <li><a href={LINKS.terms}>Terms</a></li>
        <li><a href={LINKS.github}   rel="noopener noreferrer" target="_blank">GitHub</a></li>
      </ul>
    </nav>
  </div>
</footer>

<style>
  footer {
    border-top: 1px solid var(--border);
    padding: 48px 0;
  }

  .inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 24px;
  }

  .hygiene-def {
    font-size: 12px;
    color: var(--text-3);
    font-style: italic;
    margin: 0;
    flex-basis: 100%;
    text-align: center;
    order: 2;
  }

  .hygiene-term {
    font-weight: 600;
    color: var(--orange);
    cursor: help;
    border-bottom: 1px dotted color-mix(in srgb, var(--orange) 40%, transparent);
    font-style: normal;
  }

  .copy {
    font-size: 13px;
    color: var(--text-3);
  }

  .copy a {
    color: var(--text-2);
    text-decoration: none;
    transition: color 150ms;
  }

  .footer-ai {
    color: var(--cyan);
    margin-left: 4px;
  }

  .copy a:hover { color: var(--text-1); }

  ul {
    display: flex;
    gap: 24px;
    list-style: none;
  }

  a {
    font-size: 13px;
    color: var(--text-3);
    text-decoration: none;
    transition: color 150ms;
  }

  a:hover { color: var(--text-2); }
</style>
