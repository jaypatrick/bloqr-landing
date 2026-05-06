<!--
  ComingSoon.svelte
  Ultra-minimal early-access email capture.
  Email-only for maximum conversion — no segment friction here.
  Posts to the same /waitlist Pages Function as WaitlistSignup.
-->
<script>
  let email   = $state('');
  let status  = $state('idle'); // idle | submitting | success | duplicate | error
  let errorMsg = $state('');

  async function submit(e) {
    e.preventDefault();
    if (status === 'submitting') return;
    status = 'submitting';
    errorMsg = '';

    try {
      const res = await fetch('/waitlist', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        // segment: null → DB stores NULL, Apollo label falls back to "Waitlist"
        body: JSON.stringify({ email: email.trim(), segment: null }),
      });
      const data = await res.json();

      if (res.ok) {
        status = 'success';
      } else if (res.status === 409) {
        status = 'duplicate';
      } else {
        status = 'error';
        errorMsg = data.error ?? 'Something went wrong.';
      }
    } catch {
      status = 'error';
      errorMsg = 'Network error — please try again.';
    }
  }
</script>

<section class="coming-soon" id="early-access" aria-label="Early access signup">
  <div class="container">
    <div class="inner">

      {#if status === 'success'}
        <!-- ─── Confirmed ─── -->
        <div class="confirmed" role="status">
          <span class="icon check" aria-hidden="true">✓</span>
          <div>
            <p class="confirmed-title">You're on the list.</p>
            <p class="confirmed-sub">
              We'll reach out to <strong>{email}</strong> when your access is ready.
            </p>
          </div>
        </div>

      {:else if status === 'duplicate'}
        <!-- ─── Already registered ─── -->
        <div class="confirmed" role="status">
          <span class="icon arrow" aria-hidden="true">→</span>
          <div>
            <p class="confirmed-title">Already registered.</p>
            <p class="confirmed-sub">You're already on the list — we'll be in touch soon.</p>
          </div>
        </div>

      {:else}
        <!-- ─── Default: capture form ─── -->
        <div class="badge-row">
          <span class="badge" aria-label="Limited early access available">
            <span class="pulse" aria-hidden="true"></span>
            Early access — limited spots
          </span>
        </div>

        <p class="headline">Be first in line when we launch.</p>

        <form class="form" onsubmit={submit} novalidate>
          <label for="cs-email" class="visually-hidden">Email address</label>
          <input
            id="cs-email"
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
            {status === 'submitting' ? 'Joining…' : 'Notify me →'}
          </button>
        </form>

        {#if status === 'error'}
          <p class="error-msg" role="alert">{errorMsg}</p>
        {/if}

        <p class="fine-print">One email when you're in. No spam, ever.</p>
      {/if}

    </div>
  </div>
</section>

<style>
  /* ─── Layout ─────────────────────────────────────────── */
  .coming-soon {
    padding: 48px 0 56px;
    border-top: 1px solid var(--border);
    position: relative;
    overflow: hidden;
  }

  /* Subtle radial glow centred on the section */
  .coming-soon::before {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 700px; height: 260px;
    background: radial-gradient(
      ellipse at center,
      rgba(255, 85, 0, 0.06) 0%,
      transparent 70%
    );
    pointer-events: none;
  }

  .inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 20px;
    position: relative;
  }

  /* ─── Live badge ─────────────────────────────────────── */
  .badge-row { display: flex; justify-content: center; }

  .badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 14px;
    border-radius: 9999px;
    border: 1px solid rgba(255, 85, 0, 0.35);
    background: rgba(255, 85, 0, 0.07);
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: var(--orange);
  }

  /* Animated pulse dot */
  .pulse {
    display: inline-block;
    width: 7px; height: 7px;
    border-radius: 50%;
    background: var(--orange);
    animation: pulse 2s ease-in-out infinite;
    flex-shrink: 0;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.45; transform: scale(0.75); }
  }

  /* ─── Headline ───────────────────────────────────────── */
  .headline {
    font-size: clamp(1.1rem, 2.5vw, 1.4rem);
    font-weight: 700;
    color: var(--text-1);
    letter-spacing: -0.02em;
    line-height: 1.2;
    margin: 0;
  }

  /* ─── Form ───────────────────────────────────────────── */
  .form {
    display: flex;
    gap: 10px;
    width: 100%;
    max-width: 440px;
    align-items: stretch;
  }

  @media (max-width: 520px) {
    .form { flex-direction: column; }
  }

  /* Input and button share identical vertical padding so they're the same height */
  input[type="email"] {
    flex: 1;
    min-width: 0;
    box-sizing: border-box;
    padding: 12px 16px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--bg-surface);
    border: 1.5px solid rgba(255, 85, 0, 0.7);
    border-radius: 10px;
    color: var(--text-1);
    font-size: 15px;
    line-height: 1.4;
    font-family: var(--font-display);
    outline: none;
    transition: border-color 150ms, box-shadow 150ms;
  }

  input[type="email"]::placeholder { color: var(--text-3); }

  input[type="email"]:focus {
    border-color: rgba(255, 85, 0, 1);
    box-shadow: 0 0 0 3px rgba(255, 85, 0, 0.18);
  }

  input:disabled { opacity: 0.55; cursor: not-allowed; }

  /* Override global .btn padding so button height matches the input exactly */
  .btn.btn-primary {
    box-sizing: border-box;
    padding: 12px 20px;
  }

  .btn[disabled] { opacity: 0.5; cursor: not-allowed; }

  /* ─── Fine print / error ─────────────────────────────── */
  .fine-print {
    font-size: 11px;
    color: var(--text-3);
    margin: 0;
  }

  .error-msg {
    font-size: 13px;
    color: #f87171;
    margin: -8px 0 0;
  }

  /* ─── Confirmed state ────────────────────────────────── */
  .confirmed {
    display: flex;
    align-items: center;
    gap: 16px;
    background: var(--bg-surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 20px 28px;
    max-width: 440px;
    text-align: left;
  }

  .icon {
    flex-shrink: 0;
    width: 40px; height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
  }

  .check {
    background: var(--orange-dim);
    border: 1px solid rgba(255, 85, 0, 0.3);
    color: var(--orange);
  }

  .arrow {
    background: rgba(0, 212, 255, 0.08);
    border: 1px solid rgba(0, 212, 255, 0.25);
    color: var(--cyan);
  }

  .confirmed-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-1);
    margin-bottom: 4px;
  }

  .confirmed-sub {
    font-size: 0.82rem;
    color: var(--text-2);
    line-height: 1.4;
  }

  .confirmed-sub strong { color: var(--text-1); }

  /* ─── Accessibility ──────────────────────────────────── */
  .visually-hidden {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
