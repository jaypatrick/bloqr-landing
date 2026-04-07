<script>
  import { onMount } from 'svelte';
  import { LINKS } from '../config';

  let scrolled  = $state(false);
  let menuOpen  = $state(false);
  let dropdownOpen = $state(false);

  onMount(() => {
    const handleScroll = () => { scrolled = window.scrollY > 10; };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  });

  function closeMenu() { menuOpen = false; }
  function toggleMenu() { menuOpen = !menuOpen; }
  function toggleDropdown() { dropdownOpen = !dropdownOpen; }
  function closeDropdown() { dropdownOpen = false; }
</script>

<nav class:scrolled class:menu-open={menuOpen} aria-label="Main navigation">
  <div class="inner container">

    <!-- Logo -->
    <a href="/" class="logo" aria-label="Bloqr — home" onclick={closeMenu}>
      <div class="logo-icon" aria-hidden="true">
        <span class="bar bar-1"></span>
        <span class="bar bar-2"></span>
        <span class="bar bar-3"></span>
      </div>
      <div class="logo-text">
        <span class="logo-name">BLOQR</span>
        <span class="logo-sub">Internet Hygiene. Automated.</span>
      </div>
    </a>

    <!-- Desktop links -->
    <ul class="nav-links" role="list">
      <li><a href="/#why">Why</a></li>
      <li><a href="/#how">How</a></li>
      <li><a href="/#audiences">Who</a></li>
      <li><a href="/#features">Features</a></li>
      <li><a href="/#pricing">Pricing</a></li>
      <li><a href={LINKS.vpnMyths}>VPN Myths</a></li>
      <li class="dropdown">
        <button
          class="dropdown-btn"
          onclick={toggleDropdown}
          aria-expanded={dropdownOpen}
          aria-haspopup="true"
        >
          More <span class="dropdown-arrow" aria-hidden="true">▾</span>
        </button>
        {#if dropdownOpen}
          <button
            type="button"
            class="dropdown-backdrop"
            aria-label="Close dropdown menu"
            onclick={closeDropdown}
          ></button>
          <div class="dropdown-menu">
            <a href={LINKS.blog} onclick={closeDropdown}>News</a>
            <a href={LINKS.changelog} onclick={closeDropdown}>Changelog</a>
            <a href={LINKS.about} onclick={closeDropdown}>About</a>
          </div>
        {/if}
      </li>
      <li><a href="/#waitlist" class="nav-highlight">Early Access</a></li>
    </ul>

    <!-- Desktop CTA -->
    <div class="nav-cta">
      <a href={LINKS.docs} class="btn btn-ghost btn-sm" rel="noopener noreferrer" target="_blank">Docs</a>
      <a href={LINKS.app} class="btn btn-primary btn-sm" rel="noopener noreferrer" target="_blank">
        Launch App <span aria-hidden="true">→</span>
      </a>
    </div>

    <!-- Hamburger button (mobile only) -->
    <button
      class="hamburger"
      onclick={toggleMenu}
      aria-expanded={menuOpen}
      aria-controls="mobile-menu"
      aria-label={menuOpen ? 'Close menu' : 'Open menu'}
    >
      <span class="ham-bar"></span>
      <span class="ham-bar"></span>
      <span class="ham-bar"></span>
    </button>

  </div>

  <!-- Mobile menu -->
  {#if menuOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="mobile-backdrop" onclick={closeMenu} aria-hidden="true"></div>
    <div id="mobile-menu" class="mobile-menu" role="dialog" aria-label="Navigation menu">
      <ul class="mobile-links" role="list">
        <li><a href="/#why"           onclick={closeMenu}>Why Bloqr</a></li>
        <li><a href="/#how"           onclick={closeMenu}>How it works</a></li>
        <li><a href="/#audiences"     onclick={closeMenu}>Who it's for</a></li>
        <li><a href="/#features"      onclick={closeMenu}>Features</a></li>
        <li><a href="/#pricing"       onclick={closeMenu}>Pricing</a></li>
        <li><a href={LINKS.vpnMyths}  onclick={closeMenu}>VPN Myths</a></li>
        <li><a href={LINKS.blog}      onclick={closeMenu}>News</a></li>
        <li><a href={LINKS.changelog} onclick={closeMenu}>Changelog</a></li>
        <li><a href={LINKS.about}     onclick={closeMenu}>About</a></li>
        <li class="mobile-divider" aria-hidden="true"></li>
        <li><a href="/#waitlist" class="mobile-highlight" onclick={closeMenu}>Join Early Access →</a></li>
      </ul>
      <div class="mobile-footer">
        <a href={LINKS.docs} class="btn btn-outline btn-sm" rel="noopener noreferrer" target="_blank" onclick={closeMenu}>Docs</a>
        <a href={LINKS.app} class="btn btn-primary btn-sm" rel="noopener noreferrer" target="_blank" onclick={closeMenu}>
          Launch App →
        </a>
      </div>
    </div>
  {/if}
</nav>

<style>
  nav {
    position: sticky;
    top: 0;
    z-index: 100;
    border-bottom: 1px solid transparent;
    transition: border-color 200ms, background 200ms, backdrop-filter 200ms;
  }

  nav.scrolled,
  nav.menu-open {
    border-bottom-color: var(--border);
    background: rgba(7, 11, 20, 0.95);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 64px;
  }

  /* ── Logo ── */
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    flex-shrink: 0;
  }

  .logo-icon {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .bar {
    display: block;
    height: 3px;
    border-radius: 2px;
    background: var(--text-1);
    transition: width 200ms var(--ease-out);
  }

  .bar-1 { width: 20px; }
  .bar-2 { width: 15px; opacity: 0.65; }
  .bar-3 { width: 8px; background: var(--orange); }

  .logo:hover .bar-2 { width: 18px; }
  .logo:hover .bar-3 { width: 12px; }

  .logo-text {
    display: flex;
    flex-direction: column;
    line-height: 1;
  }

  .logo-name {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--text-1);
  }

  .logo-sub {
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.08em;
    color: var(--text-3);
    text-transform: uppercase;
    white-space: nowrap;
  }

  /* ── Desktop nav links ── */
  .nav-links {
    display: flex;
    align-items: center;
    gap: 28px;
    list-style: none;
  }

  .nav-links a {
    font-size: 14px;
    color: var(--text-2);
    text-decoration: none;
    transition: color 150ms;
    white-space: nowrap;
  }

  .nav-links a:hover { color: var(--text-1); }
  .nav-highlight { color: var(--orange) !important; }

  /* ── Dropdown ── */
  .dropdown {
    position: relative;
  }

  .dropdown-btn {
    font-size: 14px;
    color: var(--text-2);
    background: none;
    border: none;
    cursor: pointer;
    transition: color 150ms;
    padding: 0;
    display: flex;
    align-items: center;
    gap: 4px;
    font-family: inherit;
  }

  .dropdown-btn:hover { color: var(--text-1); }

  .dropdown-arrow {
    font-size: 10px;
    transition: transform 200ms;
  }

  .dropdown-btn[aria-expanded="true"] .dropdown-arrow {
    transform: rotate(180deg);
  }

  .dropdown-backdrop {
    position: fixed;
    inset: 0;
    z-index: 199;
    background: transparent;
    border: none;
    padding: 0;
    cursor: default;
  }

  .dropdown-menu {
    position: absolute;
    top: calc(100% + 12px);
    right: 0;
    min-width: 160px;
    background: var(--bg-elevated);
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    padding: 8px;
    z-index: 200;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dropdown-menu a {
    display: block;
    padding: 8px 12px;
    font-size: 14px;
    color: var(--text-2);
    text-decoration: none;
    border-radius: 6px;
    transition: background 150ms, color 150ms;
  }

  .dropdown-menu a:hover {
    background: var(--bg-surface);
    color: var(--text-1);
  }

  .nav-cta {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
  }

  /* ── Hamburger button ── */
  .hamburger {
    display: none;
    flex-direction: column;
    justify-content: center;
    gap: 5px;
    width: 40px;
    height: 40px;
    padding: 8px;
    background: none;
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    flex-shrink: 0;
  }

  .ham-bar {
    display: block;
    width: 100%;
    height: 2px;
    border-radius: 2px;
    background: var(--text-2);
    transition: transform 200ms, opacity 200ms;
  }

  /* ── Mobile menu ── */
  .mobile-backdrop {
    position: fixed;
    inset: 64px 0 0 0;
    background: rgba(7, 11, 20, 0.6);
    backdrop-filter: blur(2px);
    z-index: 98;
  }

  .mobile-menu {
    position: absolute;
    top: 64px;
    left: 0;
    right: 0;
    background: rgba(7, 11, 20, 0.98);
    border-bottom: 1px solid var(--border);
    padding: 16px 24px 24px;
    z-index: 99;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
  }

  .mobile-links {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-bottom: 20px;
  }

  .mobile-links a {
    display: block;
    padding: 12px 8px;
    font-size: 16px;
    font-weight: 500;
    color: var(--text-2);
    text-decoration: none;
    border-radius: 8px;
    transition: background 150ms, color 150ms;
  }

  .mobile-links a:hover,
  .mobile-links a:active {
    color: var(--text-1);
    background: rgba(255, 255, 255, 0.05);
  }

  .mobile-highlight {
    color: var(--orange) !important;
    font-weight: 700 !important;
  }

  .mobile-divider {
    height: 1px;
    background: var(--border);
    margin: 8px 0;
  }

  .mobile-footer {
    display: flex;
    gap: 12px;
  }

  .mobile-footer .btn {
    flex: 1;
    justify-content: center;
  }

  /* ── Responsive breakpoint ── */
  @media (max-width: 860px) {
    .nav-links,
    .nav-cta { display: none; }
    .hamburger { display: flex; }
  }

  @media (max-width: 380px) {
    .logo-sub { display: none; }
  }
</style>
