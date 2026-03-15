import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 900)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Fecha menu ao navegar
  useEffect(() => { setMenuOpen(false) }, [router.pathname])

  const isAdmin = session?.user?.role === 'admin'
  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  async function handleSignOut() {
    setSigningOut(true)
    await signOut({ callbackUrl: '/login' })
  }

  return (
    <div style={S.root}>
      <header style={S.nav}>
        <div style={S.navInner}>
          {/* Logo */}
          <Link href="/" style={S.logo}>
            <span style={S.logoIcon}>◈</span>
            <span style={S.logoText}>LeadFlow</span>
          </Link>

          {/* Desktop Nav — oculto no mobile via JS */}
          {!isMobile && (
            <nav style={S.navLinks}>
              <Link href="/" style={{ ...S.navLink, ...(router.pathname === '/' ? S.navLinkActive : {}) }}>
                Dashboard
              </Link>
              {isAdmin && (
                <Link href="/admin" style={{ ...S.navLink, ...(router.pathname.startsWith('/admin') ? S.navLinkActive : {}) }}>
                  Admin
                </Link>
              )}
            </nav>
          )}

          {/* Desktop User */}
          {!isMobile && session && (
            <div style={S.userArea}>
              {isAdmin && <span style={S.adminChip}>Admin</span>}
              <div style={S.avatar}>{initials}</div>
              <div style={S.userMeta}>
                <p style={S.userName}>{session.user.name}</p>
                <p style={S.userEmail}>{session.user.email}</p>
              </div>
              <button onClick={handleSignOut} disabled={signingOut} style={S.signOutBtn}>
                {signingOut ? '...' : 'Sair'}
              </button>
            </div>
          )}

          {/* Mobile hamburger */}
          {isMobile && (
            <button
              style={{ ...S.hamburger, marginLeft: 'auto' }}
              onClick={() => setMenuOpen(v => !v)}
              aria-label="Menu"
            >
              <span style={{ ...S.bar, ...(menuOpen ? S.barTop : {}) }} />
              <span style={{ ...S.bar, ...(menuOpen ? S.barMid : {}) }} />
              <span style={{ ...S.bar, ...(menuOpen ? S.barBot : {}) }} />
            </button>
          )}
        </div>

        {/* Mobile dropdown */}
        {isMobile && menuOpen && (
          <div style={S.mobileMenu}>
            <Link href="/" style={S.mobileLink} onClick={() => setMenuOpen(false)}>
              Dashboard
            </Link>
            {isAdmin && (
              <Link href="/admin" style={S.mobileLink} onClick={() => setMenuOpen(false)}>
                Admin
              </Link>
            )}
            {session && (
              <div style={S.mobileDivider}>
                <p style={S.mobileUserInfo}>
                  {session.user.name} · {session.user.email}
                  {isAdmin && <span style={{ ...S.adminChip, marginLeft: 6 }}>Admin</span>}
                </p>
                <button onClick={handleSignOut} style={S.mobileSignOut}>
                  Sair da conta
                </button>
              </div>
            )}
          </div>
        )}
      </header>

      <main style={S.main}>{children}</main>

      <footer style={S.footer}>
        <p>© 2026 LeadFlow · Desenvolvido por{' '}
          <a href="https://github.com/DevAlex-full" target="_blank" rel="noreferrer" style={{ color: 'var(--indigo)', fontWeight: 600 }}>
            DevAlex-full
          </a>
        </p>
      </footer>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  root: { minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--gray-50)' },
  nav: {
    background: 'var(--white)',
    borderBottom: '1px solid var(--gray-200)',
    position: 'sticky', top: 0, zIndex: 100,
    boxShadow: '0 1px 3px rgba(10,37,64,0.06)',
  },
  navInner: {
    maxWidth: 1280, margin: '0 auto',
    padding: '0 24px', height: 62,
    display: 'flex', alignItems: 'center', gap: 24,
  },
  logo: {
    display: 'flex', alignItems: 'center', gap: 10,
    textDecoration: 'none', flexShrink: 0,
  },
  logoIcon: { fontSize: 22, color: 'var(--indigo)', lineHeight: 1 },
  logoText: { fontSize: 17, fontWeight: 700, color: 'var(--navy)', letterSpacing: '-0.3px' },
  navLinks: { display: 'flex', gap: 4, flex: 1 },
  navLink: {
    fontSize: 14, fontWeight: 500, color: 'var(--gray-500)',
    padding: '6px 12px', borderRadius: 'var(--radius-sm)',
    textDecoration: 'none', transition: 'all var(--transition)',
  },
  navLinkActive: { color: 'var(--navy)', background: 'var(--gray-100)', fontWeight: 600 },
  userArea: { display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' },
  adminChip: {
    fontSize: 11, fontWeight: 700, padding: '3px 8px',
    background: 'linear-gradient(135deg, #5469D4, #7B8FE3)',
    color: 'white', borderRadius: 999, letterSpacing: '0.3px',
  },
  avatar: {
    width: 36, height: 36, borderRadius: '50%',
    background: 'var(--indigo-pale)', color: 'var(--indigo)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 13, fontWeight: 700, flexShrink: 0,
    border: '2px solid var(--indigo-light)',
  },
  userMeta: { display: 'flex', flexDirection: 'column' },
  userName: { fontSize: 13, fontWeight: 600, color: 'var(--navy)', lineHeight: 1.2 },
  userEmail: { fontSize: 11, color: 'var(--gray-400)', lineHeight: 1.2 },
  signOutBtn: {
    fontSize: 13, fontWeight: 500, padding: '6px 14px',
    border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)',
    background: 'var(--white)', color: 'var(--gray-600)',
    transition: 'all var(--transition)', cursor: 'pointer',
  },
  hamburger: {
    display: 'flex', flexDirection: 'column', gap: 5,
    background: 'none', border: 'none', cursor: 'pointer', padding: '8px',
  },
  bar: {
    width: 22, height: 2, background: 'var(--navy)',
    borderRadius: 2, transition: 'all 0.25s', display: 'block',
  },
  barTop: { transform: 'rotate(45deg) translate(5px, 5px)' },
  barMid: { opacity: 0 },
  barBot: { transform: 'rotate(-45deg) translate(5px, -5px)' },
  mobileMenu: {
    background: 'var(--white)',
    borderTop: '1px solid var(--gray-200)',
    paddingBottom: 8,
  },
  mobileLink: {
    display: 'block', padding: '14px 24px',
    fontSize: 15, fontWeight: 500, color: 'var(--navy)',
    textDecoration: 'none', borderBottom: '1px solid var(--gray-100)',
  },
  mobileDivider: { borderTop: '1px solid var(--gray-200)', marginTop: 8 },
  mobileUserInfo: {
    fontSize: 12, color: 'var(--gray-400)', padding: '10px 24px 4px',
    display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6,
  },
  mobileSignOut: {
    display: 'block', width: '100%', textAlign: 'left',
    padding: '12px 24px', fontSize: 14, fontWeight: 600,
    color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer',
    fontFamily: 'var(--font)',
  },
  main: {
    maxWidth: 1280, margin: '0 auto',
    padding: '32px 24px', flex: 1, width: '100%',
  },
  footer: {
    textAlign: 'center', padding: '20px',
    fontSize: 12, color: 'var(--gray-400)',
    borderTop: '1px solid var(--gray-200)', background: 'var(--white)',
  },
}