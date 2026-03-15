import type { AppProps } from 'next/app'
import { SessionProvider, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import Head from 'next/head'
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
          <img src="/logo1.png" alt="AxLead" style={{ width: 64, height: 64, marginBottom: 16 }} />
          <p style={{ fontSize: 14, color: '#6b7280', fontFamily: 'var(--font)' }}>Carregando...</p>
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
      <Head>
        <title>AxLead — Lead Generation</title>
        <meta name="description" content="Gerador de leads qualificados para qualquer nicho — Google Maps, Instagram, LinkedIn e Facebook." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0A2540" />

        {/* Favicons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
        <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Android Chrome */}
        <link rel="icon" href="/android-chrome-192x192.png" sizes="192x192" />
        <link rel="icon" href="/android-chrome-512x512.png" sizes="512x512" />

        {/* Open Graph */}
        <meta property="og:title" content="AxLead — Lead Generation" />
        <meta property="og:description" content="Gerador de leads qualificados para qualquer nicho." />
        <meta property="og:image" content="/android-chrome-512x512.png" />
        <meta property="og:type" content="website" />
      </Head>
      <AuthGuard>
        <Component {...pageProps} />
      </AuthGuard>
    </SessionProvider>
  )
}