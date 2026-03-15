import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import AuthCard from '../components/AuthCard'
import { authApi, ApiError } from '../lib/api'
import s from '../styles/auth.module.css'

export default function ResetPasswordPage() {
  const router = useRouter()
  const token = router.query.token as string | undefined
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showPw, setShowPw] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!token) { setError('Token inválido.'); return }
    if (password !== confirm) { setError('Senhas não coincidem.'); return }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Senha fraca — mínimo 8 caracteres, 1 maiúscula e 1 número.')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao redefinir senha.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <>
      <Head><title>Link inválido · AxLead</title></Head>
      <AuthCard title="Link inválido" subtitle="Este link expirou ou é inválido."
        footer={<Link href="/forgot-password" style={{ color: 'var(--indigo)', fontWeight: 600 }}>Solicitar novo link</Link>}>
        <div className={`${s.alert} ${s.alertError}`} style={{ textAlign: 'center' }}>
          Solicite um novo link de recuperação.
        </div>
      </AuthCard>
    </>
  )

  return (
    <>
      <Head><title>Nova senha · AxLead</title></Head>
      <AuthCard title={success ? 'Senha redefinida!' : 'Criar nova senha'}
        subtitle={success ? 'Redirecionando para o login...' : 'Defina uma senha segura para sua conta'}
        footer={<Link href="/login" style={{ color: 'var(--indigo)', fontWeight: 600 }}>← Voltar ao login</Link>}>
        {success ? (
          <div className={`${s.alert} ${s.alertSuccess}`} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>✅</div>
            Senha redefinida com sucesso! Redirecionando...
          </div>
        ) : (
          <>
            {error && <div className={`${s.alert} ${s.alertError}`}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className={s.field}>
                <label className={s.label}>Nova senha</label>
                <div style={{ position: 'relative' }}>
                  <input className={s.input} type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres"
                    required style={{ paddingRight: 44 }} />
                  <button type="button" className={s.eyeBtn} onClick={() => setShowPw(v => !v)}>
                    {showPw ? '🙈' : '👁️'}
                  </button>
                </div>
                <p className={s.hint}>Mínimo 8 caracteres, 1 maiúscula e 1 número</p>
              </div>
              <div className={s.field}>
                <label className={s.label}>Confirmar senha</label>
                <input className={s.input} type="password" value={confirm}
                  onChange={e => setConfirm(e.target.value)} placeholder="Repita a senha" required
                  style={{ borderColor: confirm && confirm !== password ? 'var(--red)' : '' }} />
              </div>
              <button type="submit" className={s.btn} disabled={loading}>
                {loading ? 'Salvando...' : 'Salvar nova senha →'}
              </button>
            </form>
          </>
        )}
      </AuthCard>
    </>
  )
}