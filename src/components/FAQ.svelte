<script lang="ts">
  // Track which FAQ item is open (-1 = none)
  let openIndex = $state(-1);

  const faqs = [
    {
      q: 'Does Bloqr see my internet traffic?',
      a: 'No. Bloqr never proxies your connection, routes your traffic, or sits in the path between you and the internet. It compiles filter lists and pushes them to your DNS filtering service. What gets blocked is decided at the DNS level by your chosen vendor — not by Bloqr.',
    },
    {
      q: 'What\'s the difference between Bloqr and a VPN?',
      a: 'A VPN reroutes all your traffic through someone else\'s server — you\'re trusting them instead of your ISP. Bloqr doesn\'t touch your traffic at all. It builds and maintains the blocklists your DNS filtering service uses to stop ads and trackers before they even load. No tunnel. No rerouting. No new party to trust.',
      link: { href: '/vpn-myths', label: 'See our full VPN myths breakdown →' },
    },
    {
      q: 'Can I use my existing Pi-hole / AdGuard / NextDNS setup?',
      a: 'Yes. Bloqr is vendor-agnostic by design. Connect your existing setup and Bloqr manages the list updates, transformations, and deployments. Your filtering engine stays exactly where it is — Bloqr just makes it smarter. If you don\'t have one yet, we\'ll help you pick and set one up.',
    },
    {
      q: 'What happens to my data if I cancel?',
      a: 'You can export your full configuration (lists, rules, settings) as JSON at any time. If you cancel, your data is deleted within 30 days. No hostage data. The GPL-3.0 open-source version means you can always self-host and never be locked out.',
    },
    {
      q: 'Is the compiler itself open source?',
      a: 'Yes. The adblock filter list compiler at the core of Bloqr is GPL-3.0 licensed and available on GitHub. The managed platform (AI features, vendor integrations, dashboard) is a paid product, but the engine is yours to run, fork, and audit.',
    },
    {
      q: 'What does "AI-powered" actually mean here?',
      a: 'Two things: (1) natural language rule building — tell Bloqr what you want to block in plain English and it translates that into proper filter rules; (2) real-time threat intelligence — AI continuously monitors emerging malware domains and phishing campaigns and surfaces them as filter list updates. No magic. No vague claims.',
    },
  ];

  function toggle(index: number) {
    const opening = openIndex !== index;
    openIndex = opening ? index : -1;
    if (opening && typeof window !== 'undefined' && window.__posthog) {
      window.__posthog.capture('faq_item_opened', { question: faqs[index]?.q, index });
    }
  }
</script>

<section class="faq" id="faq" aria-labelledby="faq-heading">
  <div class="container">
    <p class="section-label">FAQ</p>
    <h2 class="section-title" id="faq-heading">Straight answers.</h2>

    <dl class="accordion" role="list">
      {#each faqs as item, i}
        <div class="item" class:open={openIndex === i} role="listitem">
          <dt>
            <button
              class="trigger"
              id={`faq-trigger-${i}`}
              aria-expanded={openIndex === i}
              aria-controls={`faq-panel-${i}`}
              onclick={() => toggle(i)}
            >
              <span>{item.q}</span>
              <span class="icon" aria-hidden="true">{openIndex === i ? '−' : '+'}</span>
            </button>
          </dt>
          <dd
            id={`faq-panel-${i}`}
            role="region"
            aria-labelledby={`faq-trigger-${i}`}
            hidden={openIndex !== i}
          >
            <div class="answer">
              <p>{item.a}</p>
              {#if item.link}
                <a href={item.link.href} class="answer-link">{item.link.label}</a>
              {/if}
            </div>
          </dd>
        </div>
      {/each}
    </dl>
  </div>
</section>

<style>
  .faq {
    padding: 80px 0;
    border-top: 1px solid var(--border);
  }

  .section-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--orange);
    margin-bottom: 16px;
  }

  .section-title {
    font-size: clamp(1.75rem, 4vw, 2.75rem);
    font-weight: 800;
    letter-spacing: -0.03em;
    line-height: 1.1;
    margin-bottom: 48px;
  }

  .accordion {
    max-width: 760px;
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .item {
    border-top: 1px solid var(--border);
  }

  .item:last-child {
    border-bottom: 1px solid var(--border);
  }

  .trigger {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 0;
    background: none;
    border: none;
    cursor: pointer;
    text-align: left;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    color: var(--text-1);
    line-height: 1.4;
    transition: color 150ms;
  }

  .trigger:hover {
    color: var(--text-1);
  }

  .item.open .trigger {
    color: var(--orange);
  }

  .icon {
    font-size: 1.4rem;
    font-weight: 300;
    color: var(--text-3);
    flex-shrink: 0;
    line-height: 1;
    transition: color 150ms;
  }

  .item.open .icon {
    color: var(--orange);
  }

  dd {
    margin: 0;
  }

  .answer {
    padding: 0 0 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .answer p {
    font-size: 0.95rem;
    color: var(--text-2);
    line-height: 1.75;
    margin: 0;
  }

  .answer-link {
    font-size: 0.9rem;
    color: var(--orange);
    text-decoration: none;
    font-weight: 600;
    transition: color 150ms;
  }

  .answer-link:hover {
    color: var(--orange-hover);
  }
</style>
