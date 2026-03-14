import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AuthCard from '../components/AuthCard'
import { authApi, ApiError } from '../lib/api'

export default function ResetPasswordPage() {
  const router = useRouter()
  const token = router.query.token as string | undefined

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Token inválido. Solicite um novo link de recuperação.')
      return
    }
    if (password !== confirm) {
      setError('As senhas não coincidem.')
      return
    }
    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.')
      return
    }
    if (!/[A-Z]/.test(password)) {
      setError('A senha deve conter ao menos uma letra maiúscula.')
      return
    }
    if (!/[0-9]/.test(password)) {
      setError('A senha deve conter ao menos um número.')
      return
    }

    setLoading(true)

    try {
      await authApi.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao redefinir senha.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <>
        <Head><title>Link inválido — Gerador de Leads</title></Head>
        <AuthCard title="Link inválido ⚠️" footer={<Link href="/forgot-password" style={{ color: '#2563eb', fontWeight: 600 }}>Solicitar novo link</Link>}>
          <p style={{ fontSize: 14, color: '#6b7280', textAlign: 'center', lineHeight: 1.6 }}>
            Este link de recuperação é inválido ou expirou. Solicite um novo link.
          </p>
        </AuthCard>
      </>
    )
  }

  if (success) {
    return (
      <>
        <Head><title>Senha redefinida — Gerador de Leads</title></Head>
        <AuthCard title="Senha redefinida! ✅" footer={<Link href="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Ir para o login</Link>}>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '16px 18px' }}>
            <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>
              Sua senha foi redefinida com sucesso! Você será redirecionado para o login em 3 segundos.
            </p>
          </div>
        </AuthCard>
      </>
    )
  }

  return (
    <>
      <Head><title>Nova senha — Gerador de Leads</title></Head>
      <AuthCard
        title="Criar nova senha"
        subtitle="Defina uma senha segura para sua conta"
        footer={<Link href="/login" style={{ color: '#2563eb', fontWeight: 600 }}>← Voltar ao login</Link>}
      >
        {error && <div style={S.alertError}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>Nova senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                style={{ ...S.input, paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPassword(v => !v)} style={S.eyeBtn}>
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              Mínimo 8 caracteres, 1 maiúscula e 1 número
            </p>
          </div>

          <div style={S.field}>
            <label style={S.label}>Confirmar nova senha</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a nova senha"
              required
              style={{
                ...S.input,
                borderColor: confirm && confirm !== password ? '#fca5a5' : '#d1d5db',
              }}
            />
            {confirm && confirm !== password && (
              <p style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>Senhas não coincidem</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ ...S.btn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Salvando...' : 'Salvar nova senha'}
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
    width: '100%', padding: '11px', marginTop: 4,
    background: '#2563eb', color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  alertError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 14,
  },
}
