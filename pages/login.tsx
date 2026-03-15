import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AuthCard from '../components/AuthCard'
import s from '../styles/auth.module.css'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const expired = router.query.error === 'SessionRequired'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', { email: email.trim(), password, redirect: false })
    setLoading(false)
    if (result?.error) {
      setError(result.error === 'CredentialsSignin' ? 'E-mail ou senha incorretos.' : result.error)
      return
    }
    router.push('/')
  }

  return (
    <>
      <Head><title>Entrar · AxLead</title></Head>
      <AuthCard
        title="Bem-vindo de volta"
        subtitle="Entre na sua conta para continuar gerando leads"
        footer={
          <span>
            Não tem conta?{' '}
            <Link href="/register" style={{ color: 'var(--indigo)', fontWeight: 600 }}>
              Criar conta gratuita
            </Link>
          </span>
        }
      >
        {expired && (
          <div className={`${s.alert} ${s.alertWarn}`}>
            Sua sessão expirou. Por favor, entre novamente.
          </div>
        )}
        {error && <div className={`${s.alert} ${s.alertError}`}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={s.field}>
            <label className={s.label}>E-mail</label>
            <input
              className={s.input}
              type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="voce@empresa.com"
              required autoComplete="email"
            />
          </div>

          <div className={s.field}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
              <label className={s.label} style={{ margin: 0 }}>Senha</label>
              <Link href="/forgot-password" style={{ fontSize: 12, color: 'var(--indigo)', fontWeight: 500 }}>
                Esqueci minha senha
              </Link>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                className={s.input}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button type="button" className={s.eyeBtn} onClick={() => setShowPassword(v => !v)}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className={s.btn} disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar na conta →'}
          </button>
        </form>
      </AuthCard>
    </>
  )
}