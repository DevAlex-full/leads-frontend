import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AuthCard from '../components/AuthCard'
import { authApi, ApiError } from '../lib/api'
import s from '../styles/auth.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(email.trim())
      setSent(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao enviar e-mail.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Recuperar senha · LeadFlow</title></Head>
      <AuthCard
        title={sent ? 'Verifique seu e-mail' : 'Recuperar senha'}
        subtitle={sent ? `Enviamos um link para ${email}` : 'Informe seu e-mail para receber o link de recuperação'}
        footer={<Link href="/login" style={{ color: 'var(--indigo)', fontWeight: 600 }}>← Voltar ao login</Link>}
      >
        {sent ? (
          <div className={`${s.alert} ${s.alertSuccess}`} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📬</div>
            <p style={{ fontSize: 14, lineHeight: 1.6 }}>
              Link enviado! Verifique sua caixa de entrada e a pasta de spam.
              <br />O link expira em <strong>1 hora</strong>.
            </p>
          </div>
        ) : (
          <>
            {error && <div className={`${s.alert} ${s.alertError}`}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className={s.field}>
                <label className={s.label}>E-mail cadastrado</label>
                <input
                  className={s.input} type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="voce@empresa.com" required autoComplete="email"
                />
              </div>
              <button type="submit" className={s.btn} disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação →'}
              </button>
            </form>
          </>
        )}
      </AuthCard>
    </>
  )
} 