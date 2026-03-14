import type { AppProps } from 'next/app'
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import '../styles/globals.css'

const PUBLIC_PAGES = ['/login', '/register', '/forgot-password', '/reset-password']

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const isPublic = PUBLIC_PAGES.includes(router.pathname)

  useEffect(() => {
    if (status === 'loading') return
    if (!session && !isPublic) { router.replace('/login'); return }
    if (session && isPublic) { router.replace('/') }
  }, [session, status, isPublic, router])

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f5f7' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🎯</div>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Carregando...</p>
        </div>
      </div>
    )
  }

  if (!session && !isPublic) return null
  return <>{children}</>
}

export default function App({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <SessionProvider session={session}>
      <AuthGuard>
        <Component {...pageProps} />
      </AuthGuard>
    </SessionProvider>
  )
}
