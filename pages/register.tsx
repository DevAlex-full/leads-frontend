import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AuthCard from '../components/AuthCard'
import { authApi, ApiError } from '../lib/api'

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  // Validação de força da senha
  const passwordStrength = getPasswordStrength(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

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
      await authApi.register(name.trim(), email.trim(), password)

      // Faz login automático após cadastro
      const result = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      })

      if (result?.error) {
        router.push('/login')
        return
      }

      router.push('/')
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Erro ao criar conta. Tente novamente.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Cadastro — Gerador de Leads</title></Head>
      <AuthCard
        title="Criar conta gratuita"
        subtitle="Comece a gerar leads agora mesmo"
        footer={
          <>
            Já tem conta?{' '}
            <Link href="/login" style={{ color: '#2563eb', fontWeight: 600 }}>
              Entrar
            </Link>
          </>
        }
      >
        {error && (
          <div style={S.alertError}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={S.field}>
            <label style={S.label}>Nome completo</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
              required
              autoComplete="name"
              style={S.input}
            />
          </div>

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
            <label style={S.label}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                required
                autoComplete="new-password"
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
            {/* Barra de força da senha */}
            {password && (
              <div style={{ marginTop: 6 }}>
                <div style={S.strengthTrack}>
                  <div style={{
                    ...S.strengthBar,
                    width: `${passwordStrength.pct}%`,
                    background: passwordStrength.color,
                  }} />
                </div>
                <p style={{ fontSize: 11, color: passwordStrength.color, marginTop: 3 }}>
                  {passwordStrength.label}
                </p>
              </div>
            )}
          </div>

          <div style={S.field}>
            <label style={S.label}>Confirmar senha</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repita a senha"
              required
              autoComplete="new-password"
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
            {loading ? 'Criando conta...' : 'Criar conta grátis'}
          </button>
        </form>
      </AuthCard>
    </>
  )
}

function getPasswordStrength(password: string) {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { pct: 20, color: '#dc2626', label: 'Senha fraca' }
  if (score === 2) return { pct: 40, color: '#f59e0b', label: 'Senha regular' }
  if (score === 3) return { pct: 60, color: '#f59e0b', label: 'Senha boa' }
  if (score === 4) return { pct: 80, color: '#16a34a', label: 'Senha forte' }
  return { pct: 100, color: '#16a34a', label: 'Senha muito forte' }
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
    background: '#16a34a', color: '#fff',
    border: 'none', borderRadius: 8,
    fontSize: 15, fontWeight: 700, cursor: 'pointer',
  },
  alertError: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 8, padding: '10px 14px',
    fontSize: 13, color: '#dc2626', marginBottom: 14,
  },
  strengthTrack: { height: 4, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' },
  strengthBar: { height: '100%', borderRadius: 999, transition: 'width 0.3s, background 0.3s' },
}
