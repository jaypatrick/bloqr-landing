function Features() {
  const features = [
    { icon: '⚡', title: 'Edge-first architecture', desc: 'Runs natively at the edge — 300+ global PoPs, zero cold starts, zero server overhead. Your VPN has data centers. We have everywhere.' },
    { icon: '🤖', title: 'AI-powered threat intelligence', desc: 'AI monitors emerging malware domains, phishing, and trackers — blocking threats in real time, before the bad guys finish their morning coffee.' },
    { icon: '🔄', title: '11 composable transformations', desc: 'Deduplicate, validate, compress, strip comments, convert to ASCII, invert allow rules — stack them however you like, per source.' },
    { icon: '📡', title: 'Three compilation modes', desc: 'Real-time streaming via SSE, batch processing up to 10 lists, or async queue-based compilation for the truly ambitious.' },
    { icon: '📋', title: 'OpenAPI + TypeScript', desc: 'Fully typed interfaces, a proper OpenAPI spec, and a JSR package. Slot it in, don\'t fight it.' },
    { icon: '🔐', title: 'Production hardened', desc: 'Rate limiting, circuit breakers, structured JSON logging, OpenTelemetry, RBAC. Boring? Yes. Essential? Absolutely.' },
  ];

  return (
    <section id="features" style={{ padding: '80px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <SectionHeader
          eyebrow="Capabilities"
          title="Production-ready.<br/>No compromises."
          aside="Everything you'd spend six months building — done right, battle-tested at the edge, and running before your next coffee. You're welcome."
        />

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2,
          background: 'var(--border)', borderRadius: 16, overflow: 'hidden',
          border: '1px solid var(--border)',
        }}>
          {features.map((f, i) => (
            <div key={i}
              style={{
                background: 'var(--bg-surface)', padding: 32, cursor: 'default',
                transition: 'background 200ms var(--ease-out)',
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-elevated)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-surface)'}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, marginBottom: 16,
                background: 'var(--bg-elevated)', border: '1px solid var(--border-accent)',
              }}>{f.icon}</div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, margin: '0 0 8px', color: 'var(--fg-1)' }}>{f.title}</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--fg-2)', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Features });
