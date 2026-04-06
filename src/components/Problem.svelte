<!-- Problem section: consumer VPN reality vs Bloqr approach -->
<script>
  import { LINKS } from '../config';
</script>

<section class="problem" id="why">
  <div class="container">
    <div class="header">
      <p class="section-label">The problem</p>
      <h2 class="section-title">You don't need a tunnel.<br />You need better filters.</h2>
      <p class="section-desc">
        Consumer VPNs route all your traffic through servers you can't see inside, then charge
        monthly for the privilege. The uncomfortable truth: you're not removing a trust
        problem — you're moving it. Bloqr stops threats before they reach your network,
        without rerouting a single packet.
        <a href={LINKS.vpnMyths} class="myth-link">See the myths, sourced →</a>
      </p>
    </div>

    <div class="grid">
      <div class="card bad">
        <span class="card-label">Consumer VPNs</span>
        <div class="icon bad-icon">🔒</div>
        <h3>The VPN promise vs. reality</h3>
        <ul>
          <li>$10–20/month for servers you can't audit or verify</li>
          <li>All traffic rerouted through a third party — your ISP problem becomes their problem</li>
          <li>"No-log" policies that multiple providers have been proven to violate in court</li>
          <li>10–30% speed overhead by design — physics doesn't negotiate</li>
          <li>Re-authentication on every site when your IP changes</li>
          <li>Doesn't block ads, trackers, or malware domains — that's not what it does</li>
        </ul>
      </div>

      <div class="card good">
        <span class="card-label">Bloqr</span>
        <div class="icon good-icon">⚡</div>
        <h3>What actually works</h3>
        <ul>
          <li>Tiered subscription — priced by scale, not per-seat VPN math</li>
          <li>Runs at the edge — 300+ global PoPs, zero cold starts, zero extra hops</li>
          <li>Genuinely no-log — we examine traffic to apply your rules, then discard it</li>
          <li>Zero traffic rerouting. Threats blocked at the DNS level.</li>
          <li>AI-powered threat lists that update in real time</li>
          <li>Drop-in integration for Pi-hole, NextDNS, AdGuard, uBlock</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<style>
  .problem { padding: 80px 0; }

  .header {
    text-align: center;
    margin-bottom: 48px;
  }

  .header .section-desc { max-width: 560px; margin: 0 auto; }

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
    border-radius: 16px;
    overflow: hidden;
    border: 1px solid var(--border);
    background: var(--border);
  }

  @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }

  .card {
    background: var(--bg-surface);
    padding: 40px;
    position: relative;
  }

  .card-label {
    position: absolute;
    top: 20px; right: 20px;
    font-size: 10px;
    letter-spacing: 0.15em;
    font-weight: 600;
    text-transform: uppercase;
  }

  .bad .card-label  { color: var(--text-3); }
  .good .card-label { color: var(--orange); }

  .icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px;
    margin-bottom: 24px;
  }

  .bad-icon  { background: rgba(239,68,68,0.12); }
  .good-icon { background: var(--orange-dim); }

  h3 {
    font-size: 1.15rem;
    font-weight: 700;
    margin-bottom: 16px;
  }

  ul {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    font-size: 0.9rem;
    color: var(--text-2);
    line-height: 1.5;
  }

  li::before {
    flex-shrink: 0;
    font-size: 0.85rem;
  }

  .bad  li::before { content: '—'; color: var(--text-3); }
  .good li::before { content: '✓'; color: var(--orange); }

  .myth-link {
    display: inline-block;
    margin-top: 10px;
    font-size: 0.85rem;
    color: var(--orange);
    text-decoration: none;
    font-weight: 600;
    transition: opacity 150ms;
  }
  .myth-link:hover { opacity: 0.75; }
</style>
