<script>
  import { LINKS } from '../config';
</script>
<!-- Site footer -->

<footer>
  <div class="container inner">
    <span class="copy">
      © 2026 Bloqr ·
      Made by <a href={LINKS.author} rel="noopener">Jayson Knight</a>
    </span>
    <nav aria-label="Footer navigation">
      <ul>
        <li><a href={LINKS.app}      rel="noopener noreferrer" target="_blank">Launch App</a></li>
        <li><a href={LINKS.docs}     rel="noopener noreferrer" target="_blank">Docs</a></li>
        <li><a href={LINKS.api}      rel="noopener noreferrer" target="_blank">API</a></li>
        <li><a href={LINKS.vpnMyths}>VPN Myths</a></li>
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

  .copy {
    font-size: 13px;
    color: var(--text-3);
  }

  .copy a {
    color: var(--text-2);
    text-decoration: none;
    transition: color 150ms;
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
