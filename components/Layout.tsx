import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'

interface Props {
  children: React.ReactNode
}

export default function Layout({ children }: Props) {
  const { data: session } = useSession()
  const router = useRouter()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    setSigningOut(true)
    await signOut({ callbackUrl: '/login' })
  }

  const isAdmin = session?.user?.role === 'admin'
  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div style={S.page}>
      <header style={S.header}>
        <div style={S.inner}>
          {/* Logo */}
          <Link href="/" style={S.logo}>
            🎯 <span style={{ marginLeft: 6 }}>Gerador de Leads</span>
          </Link>

          {/* Nav links */}
          <nav style={S.nav}>
            <Link href="/" style={{ ...S.navLink, ...(router.pathname === '/' ? S.navLinkActive : {}) }}>
              Dashboard
            </Link>
            {isAdmin && (
              <Link href="/admin" style={{ ...S.navLink, ...(router.pathname.startsWith('/admin') ? S.navLinkActive : {}) }}>
                Admin
              </Link>
            )}
          </nav>

          {/* User menu */}
          {session && (
            <div style={S.userMenu}>
              <div style={S.avatar}>{initials}</div>
              <div style={S.userInfo}>
                <p style={S.userName}>{session.user.name}</p>
                <p style={S.userEmail}>{session.user.email}</p>
              </div>
              {isAdmin && (
                <span style={S.adminBadge}>Admin</span>
              )}
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                style={S.logoutBtn}
              >
                {signingOut ? '...' : 'Sair'}
              </button>
            </div>
          )}
        </div>
      </header>

      <main style={S.main}>{children}</main>

      <footer style={S.footer}>
        Gerador de Leads Multi-Nicho · Powered by{' '}
        <a href="https://apify.com" target="_blank" rel="noreferrer">Apify</a>
      </footer>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f4f5f7' },
  header: {
    background: '#fff', borderBottom: '1px solid #e5e7eb',
    position: 'sticky', top: 0, zIndex: 50,
  },
  inner: {
    maxWidth: 1200, margin: '0 auto', padding: '0 20px',
    height: 58, display: 'flex', alignItems: 'center', gap: 24,
  },
  logo: {
    fontSize: 16, fontWeight: 700, color: '#1a1a2e',
    textDecoration: 'none', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap',
  },
  nav: { display: 'flex', gap: 4, flex: 1 },
  navLink: {
    fontSize: 13, fontWeight: 500, color: '#6b7280',
    padding: '6px 12px', borderRadius: 8, textDecoration: 'none',
  },
  navLinkActive: { color: '#2563eb', background: '#eff6ff' },
  userMenu: { display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' },
  avatar: {
    width: 34, height: 34, borderRadius: '50%',
    background: '#eff6ff', color: '#2563eb',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  userInfo: { display: 'flex', flexDirection: 'column', gap: 0 },
  userName: { fontSize: 13, fontWeight: 600, color: '#1a1a2e', margin: 0, lineHeight: 1.3 },
  userEmail: { fontSize: 11, color: '#9ca3af', margin: 0, lineHeight: 1.3 },
  adminBadge: {
    fontSize: 10, fontWeight: 700, padding: '2px 8px',
    borderRadius: 999, background: '#fef3c7', color: '#92400e',
  },
  logoutBtn: {
    fontSize: 12, fontWeight: 500, padding: '6px 14px',
    border: '1px solid #e5e7eb', borderRadius: 8,
    background: '#fff', color: '#6b7280', cursor: 'pointer',
  },
  main: { maxWidth: 1200, margin: '0 auto', padding: '28px 20px', flex: 1, width: '100%' },
  footer: {
    textAlign: 'center', padding: '14px', fontSize: 12,
    color: '#9ca3af', borderTop: '1px solid #e5e7eb', background: '#fff',
  },
}
