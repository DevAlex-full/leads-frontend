import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AuthCard from '../components/AuthCard'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Mensagem vinda do redirect (ex: "Sessão expirada")
  const callbackError = router.query.error as string | undefined

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError(result.error === 'CredentialsSignin'
        ? 'E-mail ou senha incorretos.'
        : result.error)
      return
    }

    router.push('/')
  }

  return (
    <>
      <Head><title>Login — Gerador de Leads</title></Head>
      <AuthCard
        title="Entrar na conta"
        subtitle="Acesse sua conta para gerar leads"
        footer={
          <>
            Não tem conta?{' '}
            <Link href="/register" style={{ color: '#2563eb', fontWeight: 600 }}>
              Cadastre-se gratuitamente
            </Link>
          </>
        }
      >
        {/* Alerta de sessão expirada */}
        {callbackError === 'SessionRequired' && (
          <div style={{ ...S.alert, ...S.alertWarn }}>
            ⚠️ Sua sessão expirou. Faça login novamente.
          </div>
        )}

        {error && (
          <div style={{ ...S.alert, ...S.alertError }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              autoComplete="email"
              style={S.input}
            />
          </div>

          <div style={S.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ ...S.label, margin: 0 }}>Senha</label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: '#2563eb' }}>
                Esqueci minha senha
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
                autoComplete="current-password"
                style={{ ...S.input, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                style={S.eyeBtn}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </AuthCard>
    </>
  )
}

const S: Record<string, React.CSSProperties> = {
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 },
  input: {
    width: '100%', padding: '10px 12px',
    border: '1px solid #d1d5db', borderRadius: 8,
    fontSize: 14, outline: 'none', background: '#fff',
    color: '#1a1a2e', boxSizing: 'border-box',
  },
  eyeBtn: {
    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: '0 4px',
  },
  btn: {
    width: '100%', padding: '11px', marginTop: 8,
    background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  alert: { padding: '10px 14px', borderRadius: 8, fontSize: 13, marginBottom: 14 },
  alertError: { background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626' },
  alertWarn: { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' },
}
