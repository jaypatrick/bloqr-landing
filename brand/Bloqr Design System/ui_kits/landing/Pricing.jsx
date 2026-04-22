function Pricing() {
  const tiers = [
    { name: 'Free', price: '$0', period: 'forever', desc: 'The basics, on the house.', cta: 'Get started', primary: false, features: ['1 vendor instance', 'AI flagship list', 'Community support', 'Export anytime'] },
    { name: 'Pro', price: '$4', period: 'per month', desc: 'Roughly the price of a decent coffee.', cta: 'Start 14-day trial', primary: true, features: ['Multi-instance sync', 'Natural language rules', 'AI threat lists', 'Priority support'] },
    { name: 'Pro Max', price: '$12', period: 'per month', desc: 'Less than one mediocre cocktail.', cta: 'Go Max', primary: false, features: ['Everything in Pro', 'API + TypeScript library', 'Custom transformations', 'SLA + audit logs'] },
  ];

  return (
    <section id="pricing" style={{ padding: '80px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <SectionHeader
          eyebrow="Pricing"
          title='Honest pricing.<br/>No surprises.'
          aside="Free tier is real, not a 14-day trial pretending. You can bring your own vendor on any tier."
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {tiers.map((t, i) => (
            <div key={i}
              style={{
                background: 'var(--bg-surface)',
                border: t.primary ? '1px solid rgba(255,85,0,0.35)' : '1px solid var(--border)',
                borderRadius: 16, padding: 28, position: 'relative',
                boxShadow: t.primary ? '0 0 40px rgba(255,85,0,0.08)' : 'none',
                transition: 'all 200ms var(--ease-out)',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = t.primary ? 'rgba(255,85,0,0.35)' : 'var(--border)'; }}
            >
              {t.primary && (
                <span style={{
                  position: 'absolute', top: -12, left: 24,
                  padding: '4px 10px', borderRadius: 9999,
                  background: 'var(--orange-500)', color: '#fff',
                  fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                }}>Most popular</span>
              )}
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--orange-500)', textTransform: 'uppercase', marginBottom: 8 }}>{t.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 44, fontWeight: 800, color: 'var(--fg-1)', letterSpacing: '-0.03em', lineHeight: 1 }}>{t.price}</span>
                <span style={{ fontSize: 13, color: 'var(--fg-2)' }}>{t.period}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--fg-2)', margin: '0 0 20px' }}>{t.desc}</p>
              <Button variant={t.primary ? 'primary' : 'outline'} size="md" style={{ width: '100%', justifyContent: 'center' }}>{t.cta}</Button>
              <ul style={{ listStyle: 'none', padding: 0, margin: '24px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {t.features.map((f, j) => (
                  <li key={j} style={{ display: 'flex', gap: 10, fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>
                    <span style={{ color: 'var(--orange-500)', fontWeight: 800 }}>✓</span>{f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CtaBanner({ onWaitlist }) {
  return (
    <section style={{ padding: '80px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          position: 'relative', overflow: 'hidden',
          background: 'linear-gradient(180deg, var(--bg-surface), var(--bg-elevated))',
          border: '1px solid rgba(255,85,0,0.3)', borderRadius: 20,
          padding: '56px 40px', textAlign: 'center',
          boxShadow: '0 0 48px rgba(255,85,0,0.12)',
        }}>
          <div aria-hidden style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 80% at 50% 0%, rgba(255,85,0,0.1), transparent)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 16px', color: 'var(--fg-1)' }}>
              Set it. Bloqr it.<br/>
              <span style={{ color: 'var(--orange-500)' }}>Forget it.</span>
            </h2>
            <p style={{ fontSize: '1.05rem', color: 'var(--fg-2)', maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.6 }}>
              Join the waitlist. We'll email you when early access opens — no marketing drip, no follow-ups.
            </p>
            <Button variant="primary" size="lg" onClick={onWaitlist}>Join the waitlist <span aria-hidden>→</span></Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer style={{ padding: '56px 0 32px', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <Mark size={28} />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, color: 'var(--fg-1)', letterSpacing: '-0.01em' }}>Bloqr</span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.6, margin: 0, maxWidth: 320 }}>
              Internet Hygiene. Automated. Built on Cloudflare's edge. Vendor-agnostic. What we don't log can't be leaked.
            </p>
          </div>
          {[
            { title: 'Product', items: ['Features', 'Pricing', 'Changelog', 'Docs'] },
            { title: 'Resources', items: ['VPN Myths', 'Why Not Private', 'Blog', 'RSS'] },
            { title: 'Company', items: ['About', 'Privacy', 'Terms', 'GitHub'] },
          ].map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--fg-3)', textTransform: 'uppercase', marginBottom: 14 }}>{col.title}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {col.items.map((item, j) => (
                  <li key={j}><a href="#" style={{ fontSize: 13, color: 'var(--fg-2)', textDecoration: 'none' }}>{item}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div style={{ paddingTop: 24, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>© 2026 Bloqr · Internet Hygiene. Automated.</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>bloqr.ai · v0.80</span>
        </div>
      </div>
    </footer>
  );
}

Object.assign(window, { Pricing, CtaBanner, Footer });
