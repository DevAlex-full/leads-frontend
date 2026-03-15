import Link from 'next/link'

interface Props {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function AuthCard({ title, subtitle, children, footer }: Props) {
  return (
    <div style={S.page}>
      {/* Background subtle gradient */}
      <div style={S.bg} />

      <div style={S.card}>
        {/* Logo */}
        <Link href="/" style={S.logo}>
          <img src="/logo.png" alt="AxLead" style={{ height: 40, width: 'auto', display: 'block' }} />
        </Link>

        <div style={S.divider} />

        {/* Header */}
        <h1 style={S.title}>{title}</h1>
        {subtitle && <p style={S.subtitle}>{subtitle}</p>}

        {/* Content */}
        <div style={S.body}>{children}</div>

        {/* Footer */}
        {footer && <div style={S.footer}>{footer}</div>}
      </div>

      <p style={S.legal}>
        © 2026 AxLead · Desenvolvido por DevAlex-full
      </p>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '24px 16px',
    position: 'relative',
    background: 'var(--gray-50)',
  },
  bg: {
    position: 'fixed', inset: 0, zIndex: 0,
    background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(84,105,212,0.12), transparent)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative', zIndex: 1,
    width: '100%', maxWidth: 440,
    background: 'var(--white)',
    border: '1px solid var(--gray-200)',
    borderRadius: 'var(--radius-xl)',
    padding: '40px',
    boxShadow: 'var(--shadow-lg)',
    animation: 'fadeInUp 0.4s ease',
  },
  logo: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, textDecoration: 'none', marginBottom: 28,
  },

  divider: {
    height: 1, background: 'var(--gray-100)',
    margin: '0 -40px 28px',
  },
  title: {
    fontSize: 22, fontWeight: 700, color: 'var(--navy)',
    letterSpacing: '-0.4px', marginBottom: 6, textAlign: 'center',
  },
  subtitle: {
    fontSize: 14, color: 'var(--gray-500)',
    textAlign: 'center', marginBottom: 28, lineHeight: 1.5,
  },
  body: {},
  footer: {
    marginTop: 24,
    paddingTop: 20,
    borderTop: '1px solid var(--gray-100)',
    textAlign: 'center',
    fontSize: 13, color: 'var(--gray-500)',
  },
  legal: {
    position: 'relative', zIndex: 1,
    marginTop: 24, fontSize: 12, color: 'var(--gray-400)',
    textAlign: 'center',
  },
}