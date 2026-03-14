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
      <div style={S.card}>
        {/* Logo */}
        <Link href="/" style={S.logo}>🎯 Gerador de Leads</Link>

        {/* Título */}
        <h1 style={S.title}>{title}</h1>
        {subtitle && <p style={S.subtitle}>{subtitle}</p>}

        {/* Conteúdo (form) */}
        <div>{children}</div>

        {/* Rodapé (links) */}
        {footer && <div style={S.footer}>{footer}</div>}
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: '#f4f5f7', padding: '20px',
  },
  card: {
    width: '100%', maxWidth: 420,
    background: '#fff', border: '1px solid #e5e7eb',
    borderRadius: 16, padding: '36px 40px',
  },
  logo: {
    display: 'block', textAlign: 'center',
    fontSize: 15, fontWeight: 700, color: '#1a1a2e',
    textDecoration: 'none', marginBottom: 24,
  },
  title: { fontSize: 20, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#6b7280', margin: '0 0 24px', textAlign: 'center' },
  footer: { marginTop: 20, textAlign: 'center', fontSize: 13, color: '#6b7280' },
}
