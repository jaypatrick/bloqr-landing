/* Shared primitives for the Bloqr landing UI kit. */

function Mark({ size = 28 }) {
  const h = size;
  const barH = Math.max(3, Math.round(size * 0.12));
  const gap = Math.max(2, Math.round(size * 0.1));
  const max = size * 0.85;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap, justifyContent: 'center', height: h }}>
      <span style={{ height: barH, width: max, background: '#F1F5F9', borderRadius: 2 }} />
      <span style={{ height: barH, width: max * 0.72, background: 'var(--cyan-500)', borderRadius: 2 }} />
      <span style={{ height: barH, width: max * 0.45, background: 'var(--orange-500)', borderRadius: 2 }} />
    </div>
  );
}

function Button({ variant = 'primary', size = 'md', children, onClick, href, ...rest }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    fontFamily: 'var(--font-display)', fontWeight: 600,
    border: 'none', cursor: 'pointer', textDecoration: 'none',
    transition: 'all 150ms var(--ease-out)', whiteSpace: 'nowrap',
    borderRadius: 8, outline: 'none',
  };
  const sizes = {
    sm: { padding: '7px 14px', fontSize: 13 },
    md: { padding: '10px 20px', fontSize: 14 },
    lg: { padding: '12px 24px', fontSize: 15 },
  };
  const variants = {
    primary: {
      background: 'var(--orange-500)', color: '#fff',
      boxShadow: '0 0 20px rgba(255, 85, 0, 0.30)',
    },
    outline: {
      background: 'transparent', color: 'var(--fg-1)',
      border: '1px solid #2A3F5A',
    },
    ghost: { background: 'transparent', color: 'var(--fg-2)' },
  };
  const Tag = href ? 'a' : 'button';
  return (
    <Tag
      href={href}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (variant === 'primary') {
          e.currentTarget.style.background = 'var(--orange-400)';
          e.currentTarget.style.boxShadow = '0 0 32px rgba(255, 85, 0, 0.45)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        } else if (variant === 'outline') {
          e.currentTarget.style.borderColor = 'var(--fg-2)';
          e.currentTarget.style.background = 'var(--bg-surface)';
        } else if (variant === 'ghost') {
          e.currentTarget.style.color = 'var(--fg-1)';
        }
      }}
      onMouseLeave={(e) => {
        Object.assign(e.currentTarget.style, { ...base, ...sizes[size], ...variants[variant], transform: 'translateY(0)' });
      }}
      style={{ ...base, ...sizes[size], ...variants[variant] }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

function Pill({ tone = 'orange', children, dot = false, icon }) {
  const tones = {
    orange: { bg: 'rgba(255,85,0,0.08)', color: 'var(--orange-500)', border: 'rgba(255,85,0,0.3)' },
    cyan:   { bg: 'rgba(0,212,255,0.08)', color: 'var(--cyan-500)', border: 'rgba(0,212,255,0.3)' },
    slate:  { bg: 'var(--bg-surface)',    color: 'var(--fg-2)',     border: 'var(--border)' },
  };
  const t = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '6px 14px', borderRadius: 9999,
      background: t.bg, color: t.color, border: `1px solid ${t.border}`,
      fontSize: 12, fontWeight: 600, letterSpacing: '0.08em',
      textTransform: 'uppercase', fontFamily: 'var(--font-display)',
    }}>
      {dot && <span style={{
        display: 'block', width: 6, height: 6, borderRadius: '50%',
        background: 'currentColor', animation: 'pulse 2s infinite',
      }} />}
      {icon && <span style={{ textTransform: 'none', fontSize: 14 }}>{icon}</span>}
      {children}
    </span>
  );
}

function CodeWindow({ filename, children }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: 12, overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FF5F57' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#FEBC2E' }} />
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#28C840' }} />
        {filename && <span style={{ marginLeft: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>{filename}</span>}
      </div>
      <pre style={{
        margin: 0, padding: '20px 24px', overflowX: 'auto',
        fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.7, color: 'var(--fg-1)',
      }}>{children}</pre>
    </div>
  );
}

function SectionHeader({ eyebrow, title, aside }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      alignItems: 'flex-end', marginBottom: 56, gap: 32, flexWrap: 'wrap',
    }}>
      <div>
        <p style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
          textTransform: 'uppercase', color: 'var(--orange-500)',
          margin: '0 0 16px',
        }}>{eyebrow}</p>
        <h2 style={{
          fontSize: 'clamp(1.75rem, 4vw, 2.75rem)', fontWeight: 800,
          letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0, color: 'var(--fg-1)',
        }} dangerouslySetInnerHTML={{ __html: title }} />
      </div>
      {aside && <p style={{
        maxWidth: 340, fontSize: '1rem', color: 'var(--fg-2)',
        lineHeight: 1.65, margin: 0,
      }}>{aside}</p>}
    </div>
  );
}

Object.assign(window, { Mark, Button, Pill, CodeWindow, SectionHeader });
