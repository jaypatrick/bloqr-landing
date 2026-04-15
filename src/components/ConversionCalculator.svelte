<!-- Interactive PAYG vs Pro conversion calculator -->

<script lang="ts">
  const PRO_PRICE      = 9;      // dollars/month
  const PAYG_RATE      = 0.01;   // dollars per compile
  const THRESHOLD      = 900;    // compiles/month where PAYG === Pro

  let compiles = $state(300);

  let paygCost  = $derived(+(compiles * PAYG_RATE).toFixed(2));
  let savings   = $derived(+(Math.abs(paygCost - PRO_PRICE)).toFixed(2));
  let shouldSwitch = $derived(compiles >= THRESHOLD);
</script>

<section class="calculator-section">
  <div class="container">
    <div class="section-header">
      <p class="section-label">Savings Calculator</p>
      <h2 class="section-title">How many compiles do you run?</h2>
      <p class="section-sub">
        Move the slider to see when Pay As You Go beats a Pro subscription —
        and exactly how much you'd save.
      </p>
    </div>

    <div class="calc-card">
      <div class="slider-row">
        <label for="compile-slider" class="slider-label">
          Compiles per month: <strong>{compiles.toLocaleString()}</strong>
        </label>
        <input
          id="compile-slider"
          type="range"
          min="10"
          max="2000"
          step="10"
          bind:value={compiles}
          class="slider"
          aria-valuetext="{compiles} compiles per month"
        />
        <div class="slider-ticks" aria-hidden="true">
          <span>10</span>
          <span>500</span>
          <span>1,000</span>
          <span>1,500</span>
          <span>2,000</span>
        </div>
      </div>

      <div class="result-row">
        <div class="result-item">
          <span class="result-label">Pay As You Go</span>
          <span class="result-value">${paygCost.toFixed(2)}<span class="result-unit">/mo</span></span>
        </div>
        <div class="result-divider" aria-hidden="true">vs</div>
        <div class="result-item">
          <span class="result-label">Pro subscription</span>
          <span class="result-value result-pro">${PRO_PRICE}<span class="result-unit">/mo</span></span>
        </div>
      </div>

      <div class="verdict" class:switch={shouldSwitch} class:stay={!shouldSwitch} role="status" aria-live="polite">
        {#if shouldSwitch}
          <span class="verdict-icon" aria-hidden="true">→</span>
          Switch to Pro and save <strong>${savings.toFixed(2)}/month</strong>
        {:else}
          <span class="verdict-icon" aria-hidden="true">✓</span>
          Pay As You Go is cheaper — no subscription needed
        {/if}
      </div>

      <p class="calc-note">
        Pro threshold: {THRESHOLD.toLocaleString()} compiles/month.
        At that point both options cost the same — above it, Pro is better value.
      </p>
    </div>
  </div>
</section>

<style>
  .calculator-section {
    padding: 80px 0;
    border-top: 1px solid var(--border);
  }

  .container {
    max-width: 760px;
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
    margin-bottom: 12px;
  }

  .section-sub {
    font-size: 0.97rem;
    color: var(--text-2);
    line-height: 1.6;
  }

  /* ── Card ── */
  .calc-card {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 40px 36px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  /* ── Slider ── */
  .slider-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .slider-label {
    font-size: 0.9375rem;
    color: var(--text-2);
  }

  .slider-label strong {
    color: var(--text-1);
  }

  .slider {
    -webkit-appearance: none;
    appearance: none;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--border-2);
    outline: none;
    cursor: pointer;
    accent-color: var(--orange);
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--orange);
    cursor: pointer;
    box-shadow: 0 0 8px rgba(255, 85, 0, 0.4);
  }

  .slider::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--orange);
    cursor: pointer;
    border: none;
    box-shadow: 0 0 8px rgba(255, 85, 0, 0.4);
  }

  .slider-ticks {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: var(--text-3);
    padding: 0 2px;
  }

  /* ── Results ── */
  .result-row {
    display: flex;
    align-items: center;
    gap: 24px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .result-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .result-label {
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-3);
  }

  .result-value {
    font-size: 2.25rem;
    font-weight: 800;
    color: var(--text-1);
    line-height: 1;
  }

  .result-value.result-pro {
    color: var(--orange);
  }

  .result-unit {
    font-size: 0.875rem;
    font-weight: 400;
    color: var(--text-3);
  }

  .result-divider {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text-3);
    letter-spacing: 0.08em;
  }

  /* ── Verdict ── */
  .verdict {
    text-align: center;
    font-size: 1rem;
    font-weight: 500;
    padding: 16px 24px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    line-height: 1.4;
  }

  .verdict.stay {
    background: var(--cyan-dim);
    color: var(--cyan);
    border: 1px solid rgba(0, 212, 255, 0.25);
  }

  .verdict.switch {
    background: var(--orange-dim);
    color: var(--orange);
    border: 1px solid rgba(255, 85, 0, 0.25);
  }

  .verdict strong {
    color: inherit;
  }

  .verdict-icon {
    font-size: 1.1rem;
    flex-shrink: 0;
  }

  /* ── Note ── */
  .calc-note {
    text-align: center;
    font-size: 12px;
    color: var(--text-3);
    line-height: 1.6;
    margin: 0;
  }

  @media (max-width: 520px) {
    .calc-card { padding: 28px 20px; }
    .result-value { font-size: 1.75rem; }
  }
</style>
