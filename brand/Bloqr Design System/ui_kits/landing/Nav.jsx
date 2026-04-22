function Nav({ active, setActive, onWaitlist }) {
  const links = [
    { id: 'why', label: 'Why' },
    { id: 'how', label: 'How' },
    { id: 'features', label: 'Features' },
    { id: 'pricing', label: 'Pricing' },
  ];

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(7, 11, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 24px',
        height: 64, display: 'flex', alignItems: 'center', gap: 32,
      }}>
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <Mark size={24} />
          <div style={{ lineHeight: 1 }}>
            <div style={{
              fontFamily: 'var(--font-display)', fontWeight: 700,
              fontSize: 17, letterSpacing: '-0.01em', color: 'var(--fg-1)',
            }}>Bloqr</div>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: 'var(--fg-3)', letterSpacing: '0.1em',
              textTransform: 'uppercase', marginTop: 3,
            }}>Internet Hygiene · Automated</div>
          </div>
        </a>

        <ul style={{
          display: 'flex', gap: 24, listStyle: 'none', margin: 0, padding: 0,
          marginLeft: 16,
        }}>
          {links.map((l) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                onClick={(e) => { e.preventDefault(); setActive(l.id); document.getElementById(l.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                style={{
                  fontSize: 14, fontWeight: 500,
                  color: active === l.id ? 'var(--fg-1)' : 'var(--fg-2)',
                  textDecoration: 'none', cursor: 'pointer',
                  transition: 'color 150ms var(--ease-out)',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--fg-1)'}
                onMouseLeave={(e) => e.currentTarget.style.color = active === l.id ? 'var(--fg-1)' : 'var(--fg-2)'}
              >{l.label}</a>
            </li>
          ))}
        </ul>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="#vpn" style={{
            fontSize: 13, color: 'var(--cyan-500)', textDecoration: 'none',
            padding: '6px 10px', borderRadius: 6, fontWeight: 500,
          }}>VPN Myths</a>
          <Button variant="ghost" size="sm">Docs</Button>
          <Button variant="primary" size="sm" onClick={onWaitlist}>
            Launch App <span aria-hidden>→</span>
          </Button>
        </div>
      </div>
    </nav>
  );
}

Object.assign(window, { Nav });
