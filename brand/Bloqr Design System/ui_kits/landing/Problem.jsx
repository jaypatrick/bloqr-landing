function Problem() {
  return (
    <section id="why" style={{ padding: '80px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <SectionHeader
          eyebrow="The Problem"
          title='The internet you thought<br/>you had. Finally.'
          aside="Most people pay for a VPN because they want what Bloqr actually delivers — clean, private, fast internet. They just didn't know there was a better tool."
        />

        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2,
          background: 'var(--border)', borderRadius: 16, overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          <div style={{ background: 'var(--bg-surface)', padding: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                display: 'inline-grid', placeItems: 'center', fontSize: 14,
              }}>🔒</span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--fg-3)', textTransform: 'uppercase' }}>Consumer VPN</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--fg-1)' }}>Rerouted. Slowed. Still tracked.</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                '$12/mo, one jurisdiction, one point of failure',
                'Adds a full round-trip to every request',
                'Ads, trackers, and malware still hit your browser',
                '"No-log" as a marketing phrase, not architecture',
              ].map((t, i) => (
                <li key={i} style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6, display: 'flex', gap: 10 }}>
                  <span style={{ color: 'var(--error)', fontWeight: 800 }}>✕</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: 32, position: 'relative' }}>
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 1,
              background: 'linear-gradient(90deg, transparent, var(--orange-500) 50%, transparent)',
              opacity: 0.4,
            }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <span style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'rgba(255,85,0,0.1)', border: '1px solid rgba(255,85,0,0.3)',
                display: 'inline-grid', placeItems: 'center',
              }}><Mark size={18} /></span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--orange-500)', textTransform: 'uppercase' }}>Bloqr</span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0 0 16px', color: 'var(--fg-1)' }}>Cleaner. Faster. Actually private.</h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Blocks at the DNS layer — every app, every device',
                'Gets faster as a byproduct of getting cleaner',
                '300+ global PoPs, zero cold starts',
                'What we don\'t log can\'t be leaked or subpoenaed',
              ].map((t, i) => (
                <li key={i} style={{ fontSize: 14, color: 'var(--fg-2)', lineHeight: 1.6, display: 'flex', gap: 10 }}>
                  <span style={{ color: 'var(--orange-500)', fontWeight: 800 }}>✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Problem });
