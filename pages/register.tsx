import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AuthCard from '../components/AuthCard'
import { authApi, ApiError } from '../lib/api'
import s from '../styles/auth.module.css'

function getStrength(p: string) {
  let sc = 0
  if (p.length >= 8) sc++
  if (p.length >= 12) sc++
  if (/[A-Z]/.test(p)) sc++
  if (/[0-9]/.test(p)) sc++
  if (/[^A-Za-z0-9]/.test(p)) sc++
  if (sc <= 1) return { pct: 20, color: 'var(--red)', label: 'Fraca' }
  if (sc === 2) return { pct: 40, color: 'var(--yellow)', label: 'Regular' }
  if (sc === 3) return { pct: 65, color: 'var(--yellow)', label: 'Boa' }
  if (sc === 4) return { pct: 85, color: 'var(--green)', label: 'Forte' }
  return { pct: 100, color: 'var(--green)', label: 'Muito forte' }
}

export default function RegisterPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const strength = getStrength(password)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) { setError('As senhas não coincidem.'); return }
    if (password.length < 8) { setError('A senha deve ter ao menos 8 caracteres.'); return }
    if (!/[A-Z]/.test(password)) { setError('A senha deve ter ao menos uma letra maiúscula.'); return }
    if (!/[0-9]/.test(password)) { setError('A senha deve ter ao menos um número.'); return }
    setLoading(true)
    try {
      await authApi.register(name.trim(), email.trim(), password)
      const result = await signIn('credentials', { email: email.trim(), password, redirect: false })
      if (result?.error) { router.push('/login'); return }
      router.push('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao criar conta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Head><title>Criar conta · LeadFlow</title></Head>
      <AuthCard
        title="Criar sua conta"
        subtitle="Comece a gerar leads qualificados hoje mesmo"
        footer={
          <span>
            Já tem conta?{' '}
            <Link href="/login" style={{ color: 'var(--indigo)', fontWeight: 600 }}>Entrar</Link>
          </span>
        }
      >
        {error && <div className={`${s.alert} ${s.alertError}`}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={s.field}>
            <label className={s.label}>Nome completo</label>
            <input className={s.input} type="text" value={name} onChange={e => setName(e.target.value)} placeholder="João Silva" required autoComplete="name" />
          </div>
          <div className={s.field}>
            <label className={s.label}>E-mail</label>
            <input className={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="voce@empresa.com" required autoComplete="email" />
          </div>
          <div className={s.field}>
            <label className={s.label}>Senha</label>
            <div style={{ position: 'relative' }}>
              <input
                className={s.input} type={showPw ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres" required
                style={{ paddingRight: 44 }}
              />
              <button type="button" className={s.eyeBtn} onClick={() => setShowPw(v => !v)}>
                {showPw ? '🙈' : '👁️'}
              </button>
            </div>
            {password && (
              <div>
                <div className={s.strengthBar}>
                  <div className={s.strengthFill} style={{ width: `${strength.pct}%`, background: strength.color }} />
                </div>
                <p className={s.hint} style={{ color: strength.color }}>{strength.label}</p>
              </div>
            )}
          </div>
          <div className={s.field}>
            <label className={s.label}>Confirmar senha</label>
            <input
              className={s.input} type="password"
              value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Repita a senha" required
              style={{ borderColor: confirm && confirm !== password ? 'var(--red)' : '' }}
            />
            {confirm && confirm !== password && (
              <p className={s.hint} style={{ color: 'var(--red)' }}>Senhas não coincidem</p>
            )}
          </div>
          <button type="submit" className={`${s.btn} ${s.btnGreen}`} disabled={loading}>
            {loading ? 'Criando conta...' : 'Criar conta gratuita →'}
          </button>
        </form>
      </AuthCard>
    </>
  )
}