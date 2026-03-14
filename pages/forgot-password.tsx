import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import AuthCard from '../components/AuthCard'
import { authApi, ApiError } from '../lib/api'

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
      const msg = err instanceof ApiError ? err.message : 'Erro ao enviar e-mail.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <>
        <Head><title>E-mail enviado — Gerador de Leads</title></Head>
        <AuthCard title="E-mail enviado! 📬" footer={<Link href="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Voltar ao login</Link>}>
          <div style={S.successBox}>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              Se o endereço <strong>{email}</strong> estiver cadastrado, você receberá um link de recuperação em breve.
            </p>
            <p style={{ fontSize: 13, color: '#6b7280', marginTop: 10 }}>
              Verifique também a pasta de spam.
            </p>
          </div>
        </AuthCard>
      </>
    )
  }

  return (
    <>
      <Head><title>Recuperar senha — Gerador de Leads</title></Head>
      <AuthCard
        title="Recuperar senha"
        subtitle="Informe seu e-mail e enviaremos um link para redefinir sua senha"
        footer={
          <Link href="/login" style={{ color: '#2563eb', fontWeight: 600 }}>
            ← Voltar ao login
          </Link>
        }
      >
        {error && <div style={S.alertError}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>E-mail cadastrado</label>
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

          <button
            type="submit"
            disabled={loading}
            style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
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
  btn: {
    width: '100%', padding: '11px', marginTop: 4,
    background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  alertError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 14,
  },
  successBox: {
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 10, padding: '16px 18px',
  },
}
