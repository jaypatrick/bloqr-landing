<!-- Feature comparison table for /pricing page -->

<script lang="ts">
  const features = [
    { label: 'Monthly price',           free: '$0',        payg: '$0.01/compile', pro: '~$9/mo',   vendor: 'Custom' },
    { label: 'Compiles/day',            free: '1,000',     payg: '500',           pro: 'Unlimited', vendor: 'Unlimited' },
    { label: 'Rules per compile',       free: '10,000',    payg: '50,000',        pro: 'Unlimited', vendor: 'Unlimited' },
    { label: 'Filter sources/compile',  free: '3',         payg: '5',             pro: 'Unlimited', vendor: 'Unlimited' },
    { label: 'AST storage',             free: false,       payg: false,           pro: true,        vendor: true },
    { label: 'Batch API',               free: false,       payg: false,           pro: true,        vendor: true },
    { label: 'Multi-format translation',free: false,       payg: false,           pro: true,        vendor: true },
    { label: 'Output retention',        free: '90 days',   payg: '7 days',        pro: '90 days',   vendor: '365 days' },
    { label: 'Custom pipelines',        free: false,       payg: false,           pro: true,        vendor: true },
    { label: 'Priority queue',          free: false,       payg: false,           pro: false,       vendor: true },
    { label: 'SLA',                     free: false,       payg: false,           pro: false,       vendor: true },
    { label: 'API marketplace listing', free: 'Coming soon', payg: 'Coming soon', pro: 'Coming soon', vendor: 'Coming soon' },
    { label: 'Support',                 free: 'Community', payg: 'Community',     pro: 'Email',     vendor: 'Dedicated' },
  ];
</script>

<section class="pricing-table-section">
  <div class="container">
    <div class="section-header">
      <p class="section-label">Compare Plans</p>
      <h2 class="section-title">Everything, side by side.</h2>
    </div>

    <div class="table-wrap">
      <table class="comparison-table" aria-label="Feature comparison across Bloqr pricing tiers">
        <thead>
          <tr>
            <th scope="col" class="feature-col">Feature</th>
            <th scope="col">Free</th>
            <th scope="col" class="col-payg">Pay As You Go</th>
            <th scope="col" class="col-pro">Pro</th>
            <th scope="col">Vendor / Enterprise</th>
          </tr>
        </thead>
        <tbody>
          {#each features as row}
            <tr>
              <th scope="row" class="feature-label">{row.label}</th>
              <td>{@render cell(row.free)}</td>
              <td class="col-payg">{@render cell(row.payg)}</td>
              <td class="col-pro">{@render cell(row.pro)}</td>
              <td>{@render cell(row.vendor)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </div>
</section>

{#snippet cell(value)}
  {#if value === true}
    <span class="check" aria-label="Included">✓</span>
  {:else if value === false}
    <span class="cross" aria-label="Not included">✕</span>
  {:else}
    {value}
  {/if}
{/snippet}

<style>
  .pricing-table-section {
    padding: 80px 0;
    border-top: 1px solid var(--border);
  }

  .container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 0 24px;
  }

  .section-header {
    text-align: center;
    margin-bottom: 48px;
  }

  .section-label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--orange);
    margin-bottom: 12px;
  }

  .section-title {
    font-size: clamp(1.5rem, 3.5vw, 2.25rem);
    font-weight: 700;
    color: var(--text-1);
    line-height: 1.2;
  }

  .table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  .comparison-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  thead th {
    background: var(--bg-elevated);
    padding: 16px 20px;
    text-align: center;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--text-2);
    border-bottom: 1px solid var(--border);
    white-space: nowrap;
  }

  thead th.feature-col {
    text-align: left;
    color: var(--text-3);
  }

  thead th.col-payg {
    color: var(--cyan);
  }

  thead th.col-pro {
    color: var(--orange);
    border-left: 2px solid var(--orange);
  }

  tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background 100ms;
  }

  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: rgba(255, 255, 255, 0.02); }

  tbody td,
  tbody th {
    padding: 14px 20px;
    text-align: center;
    color: var(--text-2);
    vertical-align: middle;
  }

  tbody th.feature-label {
    text-align: left;
    color: var(--text-1);
    font-weight: 500;
    white-space: nowrap;
  }

  tbody td.col-pro {
    border-left: 2px solid rgba(255, 85, 0, 0.35);
  }

  .check {
    color: var(--orange);
    font-weight: 700;
    font-size: 0.9rem;
  }

  .cross {
    color: var(--text-3);
    font-size: 0.8rem;
  }

  @media (max-width: 700px) {
    .comparison-table { font-size: 0.8rem; }
    tbody td, tbody th, thead th { padding: 12px 14px; }
  }
</style>
