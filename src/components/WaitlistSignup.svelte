<!-- Waitlist signup: segment pills + email, posts to /waitlist Pages Function -->
<script>
  let email   = $state('');
  let segment = $state('');
  let status  = $state('idle'); // idle | submitting | success | duplicate | error
  let errorMsg = $state('');

  const segments = [
    { id: 'list-maker',      label: 'List Maker',      desc: 'I maintain filter lists' },
    { id: 'privacy-vendor',  label: 'Privacy Vendor',  desc: 'I build privacy products' },
    { id: 'individual',      label: 'Individual',      desc: 'I want better blocking'  },
  ];

  function selectSegment(segId) {
    const next = segment === segId ? '' : segId;
    segment = next;
    if (next && typeof window !== 'undefined' && window.__posthog) {
      window.__posthog.capture('waitlist_segment_selected', { segment: next });
    }
  }

  async function submit(e) {
    e.preventDefault();
    if (status === 'submitting') return;
    status = 'submitting';
    errorMsg = '';

    try {
      const sessionId = typeof window !== 'undefined' ? (window.__posthog?.get_session_id?.() ?? '') : '';
      const res = await fetch('/waitlist', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-PostHog-Session-Id': sessionId,
        },
        body:    JSON.stringify({ email: email.trim(), segment: segment || null }),
      });
      const data = await res.json();

      if (res.ok) {
        status = 'success';
        if (typeof window !== 'undefined' && window.__posthog) {
          window.__posthog.capture('waitlist_signup', { source: 'landing_page', segment: segment || null });
          window.__posthog.identify(email.trim());
        }
      } else if (res.status === 409) {
        status = 'duplicate';
      } else {
        status = 'error';
        errorMsg = data.error ?? 'Something went wrong.';
        if (typeof window !== 'undefined' && window.__posthog) {
          window.__posthog.capture('waitlist_signup_failed', { error: data.error ?? 'unknown', segment: segment || null });
        }
      }
    } catch {
      status = 'error';
      errorMsg = 'Network error — please try again.';
      if (typeof window !== 'undefined' && window.__posthog) {
        window.__posthog.capture('waitlist_signup_failed', { error: 'network_error', segment: segment || null });
      }
    }
  }
</script>

<section class="waitlist" id="waitlist">
  <div class="container">
    <div class="inner">

      <!-- Left: copy -->
      <div class="copy">
        <p class="section-label">Early access</p>
        <h2 class="section-title">Be first in line.</h2>
        <p class="section-desc">
          We're onboarding list makers and privacy vendors first — the people who
          set the standard for everyone else. Get early access, shape the roadmap,
          and lock in founding-member pricing.
        </p>
        <ul class="perks" aria-label="Early access perks">
          <li><span class="perk-dot" aria-hidden="true"></span>Founding-member subscription pricing</li>
          <li><span class="perk-dot" aria-hidden="true"></span>Direct access to the roadmap</li>
          <li><span class="perk-dot" aria-hidden="true"></span>Priority onboarding &amp; support</li>
        </ul>
      </div>

      <!-- Right: form -->
      <div class="form-wrap">
        {#if status === 'success'}
          <div class="success" role="status">
            <div class="success-icon" aria-hidden="true">✓</div>
            <h3>You're on the list.</h3>
            <p>We'll reach out to <strong>{email}</strong> when your access is ready.</p>
          </div>
        {:else if status === 'duplicate'}
          <div class="success" role="status">
            <div class="success-icon already" aria-hidden="true">→</div>
            <h3>Already registered.</h3>
            <p>You're already on the list — we'll be in touch soon.</p>
          </div>
        {:else}
          <form onsubmit={submit} novalidate>
            <p class="form-label">Who are you? <span class="optional">(optional)</span></p>
            <div class="pills" role="group" aria-label="Select your role">
              {#each segments as seg}
                <button
                  type="button"
                  class="pill"
                  class:active={segment === seg.id}
                  aria-pressed={segment === seg.id}
                  onclick={() => selectSegment(seg.id)}
                >
                  {seg.label}
                </button>
              {/each}
            </div>

            <label for="waitlist-email" class="form-label">Email address</label>
            <div class="input-row">
              <input
                id="waitlist-email"
                type="email"
                bind:value={email}
                placeholder="you@example.com"
                required
                autocomplete="email"
                disabled={status === 'submitting'}
              />
              <button
                type="submit"
                class="btn btn-primary"
                disabled={status === 'submitting' || !email.trim()}
              >
                {status === 'submitting' ? 'Joining…' : 'Join waitlist →'}
              </button>
            </div>

            {#if status === 'error'}
              <p class="error-msg" role="alert">{errorMsg}</p>
            {/if}

            <p class="fine-print">No spam. One email when you're in.</p>
            <p class="price-hint">Free tier at launch. Pro tier under <span class="price-figure">$5/month</span>. No two-year contracts.</p>
          </form>
        {/if}
      </div>

    </div>
  </div>
</section>

<style>
  .waitlist {
    padding: 80px 0;
    border-top: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }

  .waitlist::before {
    content: '';
    position: absolute;
    bottom: 0; left: 50%;
    transform: translateX(-50%);
    width: 600px; height: 300px;
    background: radial-gradient(ellipse at center bottom, rgba(255,85,0,0.07) 0%, transparent 70%);
    pointer-events: none;
  }

  .inner {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 64px;
    align-items: center;
  }

  @media (max-width: 800px) {
    .inner { grid-template-columns: 1fr; gap: 40px; }
  }

  /* Copy */
  .section-desc {
    max-width: 420px;
    margin-bottom: 28px;
  }

  .perks {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .perks li {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 0.9rem;
    color: var(--text-2);
  }

  .perk-dot {
    flex-shrink: 0;
    width: 6px; height: 6px;
    border-radius: 50%;
    background: var(--orange);
    display: block;
  }

  /* Form */
  .form-wrap {
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 40px;
  }

  .form-label {
    display: block;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-3);
    margin-bottom: 10px;
  }

  .optional {
    font-weight: 400;
    letter-spacing: 0;
    text-transform: none;
    color: var(--text-3);
    opacity: 0.6;
  }

  /* Segment pills */
  .pills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 24px;
  }

  .pill {
    padding: 7px 16px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: 1px solid var(--border-2);
    background: var(--bg-elevated);
    color: var(--text-2);
    transition: border-color 150ms, background 150ms, color 150ms;
  }

  .pill:hover {
    border-color: rgba(255, 85, 0, 0.4);
    color: var(--text-1);
  }

  .pill.active {
    border-color: var(--orange);
    background: var(--orange-dim);
    color: var(--orange);
  }

  /* Email input row */
  .input-row {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
  }

  @media (max-width: 560px) {
    .input-row { flex-direction: column; }
  }

  input[type="email"] {
    flex: 1;
    min-width: 0;
    height: 44px;
    padding: 0 14px;
    background: var(--bg-base);
    border: 1px solid var(--border-2);
    border-radius: 8px;
    color: var(--text-1);
    font-size: 14px;
    font-family: var(--font-sans);
    outline: none;
    transition: border-color 150ms;
  }

  input[type="email"]::placeholder { color: var(--text-3); }

  input[type="email"]:focus {
    border-color: rgba(255, 85, 0, 0.5);
    box-shadow: 0 0 0 3px rgba(255, 85, 0, 0.1);
  }

  input:disabled { opacity: 0.6; cursor: not-allowed; }

  .btn[disabled] { opacity: 0.5; cursor: not-allowed; }

  .error-msg {
    font-size: 13px;
    color: #f87171;
    margin-top: 4px;
    margin-bottom: 0;
  }

  .fine-print {
    font-size: 11px;
    color: var(--text-3);
    margin: 0;
  }

  .price-hint {
    font-size: 11px;
    color: var(--text-2);
    margin: 6px 0 0;
  }

  .price-figure {
    color: var(--orange);
    font-weight: 600;
  }

  /* Success state */
  .success {
    text-align: center;
    padding: 16px 0;
  }

  .success-icon {
    width: 56px; height: 56px;
    border-radius: 50%;
    background: var(--orange-dim);
    border: 1px solid rgba(255, 85, 0, 0.3);
    color: var(--orange);
    font-size: 22px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
  }

  .success-icon.already {
    background: rgba(0, 212, 255, 0.08);
    border-color: rgba(0, 212, 255, 0.25);
    color: var(--cyan);
  }

  .success h3 {
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .success p {
    font-size: 0.9rem;
    color: var(--text-2);
  }

  .success strong { color: var(--text-1); }
</style>
