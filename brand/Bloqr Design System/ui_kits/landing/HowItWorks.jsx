function HowItWorks() {
  const [showCode, setShowCode] = React.useState(false);

  const steps = [
    { n: '01', title: 'Tell Bloqr what you want.', desc: 'Plain English. "Block everything AWS." "Allow Reddit but not Reddit ads." We build the rules.' },
    { n: '02', title: 'We compile and ship.', desc: 'Your sources get deduplicated, validated, and published to every vendor you use. One pane of glass.' },
    { n: '03', title: 'Everything stays in sync.', desc: 'Change a rule once. Every device — home, mobile, coffee shop — picks it up in seconds.' },
  ];

  return (
    <section id="how" style={{ padding: '80px 0', borderTop: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <SectionHeader
          eyebrow="How it works"
          title='Three steps.<br/>Then stop thinking about it.'
          aside="Set it. Bloqr it. Forget it. You'll never write a line of config — but it's here if you want it."
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {steps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 20 }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700,
                  color: 'var(--orange-500)', letterSpacing: '0.1em', minWidth: 32,
                  paddingTop: 4,
                }}>{s.n}</div>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 6px', color: 'var(--fg-1)' }}>{s.title}</h4>
                  <p style={{ fontSize: '0.92rem', color: 'var(--fg-2)', lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, padding: 4, background: 'var(--bg-surface)', borderRadius: 8, border: '1px solid var(--border)', width: 'fit-content' }}>
              <button onClick={() => setShowCode(false)} style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: !showCode ? 'var(--bg-elevated)' : 'transparent',
                color: !showCode ? 'var(--fg-1)' : 'var(--fg-2)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)',
              }}>UI</button>
              <button onClick={() => setShowCode(true)} style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: showCode ? 'var(--bg-elevated)' : 'transparent',
                color: showCode ? 'var(--fg-1)' : 'var(--fg-2)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-display)',
              }}>Show code</button>
            </div>

            {!showCode ? (
              <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: 'var(--fg-3)', textTransform: 'uppercase', marginBottom: 12 }}>Build a list</div>
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 14px', marginBottom: 14, fontSize: 13, color: 'var(--fg-1)', fontFamily: 'var(--font-mono)' }}>
                  <span style={{ color: 'var(--fg-3)' }}>You:</span> Block everything AWS, allow my CI domains.
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                  {['hagezi/pro', 'oisd/big', '+ allow *.github.io'].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6, fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>
                      <span style={{ color: 'var(--success)', fontWeight: 800 }}>✓</span>
                      {s}
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 12, color: 'var(--fg-2)' }}>Vendor: <strong style={{ color: 'var(--fg-1)' }}>AdGuard Home</strong></span>
                  <Button variant="primary" size="sm">Deploy <span aria-hidden>→</span></Button>
                </div>
              </div>
            ) : (
              <CodeWindow filename="bloqr.config.ts">
{`import { compile } from "@bloqr/compiler";

const config = compile({
  sources: ["hagezi/pro", "oisd/big"],
  allow:   ["*.github.io"],
  vendor:  "adguard-home",
  // AI fills in the rest.
});

await config.deploy();`}
              </CodeWindow>
            )}
            <p style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 12, textAlign: 'center' }}>
              You'll never write a line of this. The UI builds it for you. But it's here if you want it.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { HowItWorks });
