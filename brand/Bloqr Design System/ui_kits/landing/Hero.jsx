function Hero({ onWaitlist }) {
  const stats = [
    { value: 'AI', unit: '-focused', label: 'Plain English rules' },
    { value: '', unit: 'BYO', label: 'Vendor-agnostic · No lock-in' },
    { value: 'Real', unit: 'time', label: 'AI-powered threat intel' },
    { value: '', unit: '11', label: 'Filter transformations' },
  ];

  return (
    <section style={{ position: 'relative', padding: '72px 0 80px', textAlign: 'center', overflow: 'hidden' }}>
      <div aria-hidden style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 900, height: 560, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(255,85,0,0.10) 0%, transparent 70%)',
      }} />
      <div aria-hidden style={{
        position: 'absolute', top: 120, right: '10%', width: 500, height: 300, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, rgba(0,212,255,0.06) 0%, transparent 70%)',
      }} />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
        <Pill tone="orange" dot>Set it. Bloqr it. Forget it.</Pill>

        <h1 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 800,
          lineHeight: 1.05, letterSpacing: '-0.03em',
          maxWidth: 880, margin: '32px auto 24px', color: 'var(--fg-1)',
        }}>
          Internet Hygiene:<br/>
          <em style={{
            fontStyle: 'normal',
            background: 'linear-gradient(135deg, var(--orange-500) 0%, #FF8833 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>Automated.</em>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--fg-2)',
          maxWidth: 600, margin: '0 auto 28px', lineHeight: 1.6,
          fontFamily: 'var(--font-body)',
        }}>
          Bloqr blocks ads, trackers, and malware at the network level — across every
          device, every network, all at once. Tell Bloqr what you want in plain English.
          Bloqr handles the rest.
        </p>

        <div style={{
          display: 'inline-flex', alignItems: 'flex-start', gap: 10,
          maxWidth: 560, margin: '0 auto 40px', padding: '14px 20px',
          borderRadius: 12, border: '1px solid rgba(255, 85, 0, 0.2)',
          background: 'rgba(255, 85, 0, 0.05)',
          fontSize: '0.92rem', color: 'var(--fg-2)', lineHeight: 1.5, textAlign: 'left',
        }}>
          <span aria-hidden style={{ fontSize: 16 }}>🔌</span>
          <span><strong style={{ color: 'var(--fg-1)' }}>Bring your own vendor.</strong> Already on AdGuard, NextDNS, or Pi-hole? Keep it. Bloqr layers on top. Or let us handle everything — your choice, always.</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 64 }}>
          <Button variant="primary" onClick={onWaitlist}>Get started free <span aria-hidden>→</span></Button>
          <Button variant="outline">Read the docs</Button>
          <Button variant="ghost">See how it works</Button>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 2, background: 'var(--border)', borderRadius: 16, overflow: 'hidden',
          border: '1px solid var(--border)', maxWidth: 920, margin: '0 auto',
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{ background: 'var(--bg-surface)', padding: '24px 16px' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800,
                letterSpacing: '-0.02em', color: 'var(--fg-1)', lineHeight: 1,
              }}>
                {s.value && <span>{s.value}</span>}
                <span style={{ color: 'var(--orange-500)' }}>{s.unit}</span>
              </div>
              <div style={{
                fontSize: 12, color: 'var(--fg-2)', marginTop: 8,
                letterSpacing: '0.02em',
              }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Hero });
