<script lang="ts">
  // Fetch the waitlist count from the edge function
  let count = $state<number | null>(null);
  let loaded = $state(false);

  $effect(() => {
    fetch('/waitlist/count')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: { count: number }) => {
        count = data.count;
        loaded = true;
      })
      .catch(() => {
        loaded = true; // show fallback
      });
  });
</script>

<!-- Social proof / trust bar — sits between Hero and ComingSoon -->
<aside class="social-proof" aria-label="Built on trusted infrastructure">

  <!-- A) Technology trust badges -->
  <div class="container inner">
    <ul class="logos" role="list" aria-label="Built on">
      <li class="badge"><span class="badge-icon" aria-hidden="true">☁️</span> Cloudflare Workers</li>
      <li class="sep" aria-hidden="true">·</li>
      <li class="badge"><span class="badge-icon" aria-hidden="true">📄</span> Cloudflare Pages</li>
      <li class="sep" aria-hidden="true">·</li>
      <li class="badge"><span class="badge-icon" aria-hidden="true">🐘</span> Neon</li>
      <li class="sep" aria-hidden="true">·</li>
      <li class="badge"><span class="badge-icon" aria-hidden="true">🦕</span> Deno</li>
      <li class="sep" aria-hidden="true">·</li>
      <li class="badge"><span class="badge-icon" aria-hidden="true">📦</span> JSR</li>
      <li class="sep" aria-hidden="true">·</li>
      <li class="badge"><span class="badge-icon" aria-hidden="true">🔓</span> Open Source</li>
    </ul>
  </div>

  <!-- B) Waitlist counter -->
  <div class="counter-row container" aria-live="polite" aria-atomic="true">
    {#if loaded && count !== null && count > 0}
      <span class="counter-text">Join <strong>{count}+</strong> people already on the list</span>
    {:else if loaded}
      <span class="counter-text">Be among the first</span>
    {:else}
      <span class="counter-text counter-loading" aria-hidden="true">Be among the first</span>
    {/if}
  </div>

</aside>

<style>
  .social-proof {
    padding: 20px 0;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    text-align: center;
  }

  .inner {
    display: flex;
    justify-content: center;
  }

  .logos {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px 4px;
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    border-radius: 9999px;
    border: 1px solid var(--border);
    background: var(--bg-surface);
    font-size: 12px;
    font-weight: 500;
    color: var(--text-3);
    white-space: nowrap;
    transition: border-color 150ms, color 150ms;
  }

  .badge:hover {
    border-color: var(--border-2);
    color: var(--text-2);
  }

  .badge-icon {
    font-size: 11px;
    line-height: 1;
  }

  .sep {
    color: var(--border-2);
    font-size: 14px;
    user-select: none;
  }

  .counter-row {
    margin-top: 14px;
  }

  .counter-text {
    font-size: 13px;
    color: var(--text-3);
    letter-spacing: 0.01em;
  }

  .counter-text strong {
    color: var(--orange);
    font-weight: 700;
  }

  .counter-loading {
    opacity: 0.4;
  }
</style>
