import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { adminApi, AdminUser, AdminStats, ApiError } from '../../lib/api'

type Tab = 'users' | 'stats'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'' | 'user' | 'admin'>('')
  const [filterActive, setFilterActive] = useState<'' | 'true' | 'false'>('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Redireciona se não for admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.replace('/')
    }
  }, [session, status, router])

  const loadData = useCallback(async () => {
    if (!session?.token) return
    setLoading(true)
    setError('')
    try {
      const [usersData, statsData] = await Promise.all([
        adminApi.getUsers(session.token),
        adminApi.getStats(session.token),
      ])
      setUsers(usersData.users)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar dados.')
    } finally {
      setLoading(false)
    }
  }, [session?.token])

  useEffect(() => {
    if (session?.user.role === 'admin') loadData()
  }, [loadData, session])

  async function toggleActive(user: AdminUser) {
    if (!session?.token) return
    setActionLoading(user.id)
    try {
      await adminApi.updateUser(user.id, { is_active: !user.is_active }, session.token)
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      setSuccess(`Usuário ${!user.is_active ? 'ativado' : 'desativado'} com sucesso.`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao atualizar usuário.')
    } finally {
      setActionLoading(null)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  async function toggleRole(user: AdminUser) {
    if (!session?.token) return
    const newRole = user.role === 'admin' ? 'user' : 'admin'
    setActionLoading(user.id + '_role')
    try {
      await adminApi.updateUser(user.id, { role: newRole }, session.token)
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u))
      setSuccess(`Role de ${user.name} atualizado para ${newRole}.`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao atualizar role.')
    } finally {
      setActionLoading(null)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  async function deleteUser(user: AdminUser) {
    if (!session?.token) return
    if (!confirm(`Tem certeza que deseja excluir "${user.name}"? Esta ação é irreversível.`)) return
    setActionLoading(user.id + '_del')
    try {
      await adminApi.deleteUser(user.id, session.token)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      setSuccess(`Usuário ${user.name} removido.`)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao excluir usuário.')
    } finally {
      setActionLoading(null)
      setTimeout(() => setSuccess(''), 3000)
    }
  }

  if (status === 'loading' || (session?.user.role !== 'admin')) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Verificando permissões...</div>
  }

  const filtered = users.filter((u) => {
    if (filterRole && u.role !== filterRole) return false
    if (filterActive === 'true' && !u.is_active) return false
    if (filterActive === 'false' && u.is_active) return false
    if (search) {
      const q = search.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <>
      <Head><title>Admin — Gerador de Leads</title></Head>
      <Layout>
        <div style={{ marginBottom: 20 }}>
          <h1 style={S.h1}>⚙️ Painel Admin</h1>
          <p style={{ fontSize: 13, color: '#6b7280' }}>Gerencie usuários e visualize estatísticas da plataforma.</p>
        </div>

        {error && <div style={S.alertError}>{error} <button onClick={() => setError('')} style={S.closeBtn}>✕</button></div>}
        {success && <div style={S.alertSuccess}>{success}</div>}

        {/* Tabs */}
        <div style={S.tabs}>
          {(['users', 'stats'] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }}>
              {t === 'users' ? '👥 Usuários' : '📊 Estatísticas'}
            </button>
          ))}
        </div>

        {/* Stats Tab */}
        {tab === 'stats' && stats && (
          <div style={S.statsGrid}>
            {[
              { label: 'Total de usuários', value: stats.total, color: '#1a1a2e' },
              { label: 'Ativos', value: stats.active, color: '#16a34a' },
              { label: 'Inativos', value: stats.inactive, color: '#dc2626' },
              { label: 'Administradores', value: stats.admins, color: '#7c3aed' },
              { label: 'Novos hoje', value: stats.newToday, color: '#2563eb' },
              { label: 'Novos este mês', value: stats.newThisMonth, color: '#0891b2' },
            ].map((s) => (
              <div key={s.label} style={S.statCard}>
                <p style={S.statLabel}>{s.label}</p>
                <p style={{ ...S.statValue, color: s.color }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Users Tab */}
        {tab === 'users' && (
          <div style={S.card}>
            {/* Filtros */}
            <div style={S.filtersRow}>
              <input
                type="text"
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{ ...S.input, maxWidth: 280 }}
              />
              <select value={filterRole} onChange={(e) => setFilterRole(e.target.value as '' | 'user' | 'admin')} style={S.select}>
                <option value="">Todos os roles</option>
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
              <select value={filterActive} onChange={(e) => setFilterActive(e.target.value as '' | 'true' | 'false')} style={S.select}>
                <option value="">Todos os status</option>
                <option value="true">Ativos</option>
                <option value="false">Inativos</option>
              </select>
              <button onClick={loadData} style={S.refreshBtn}>↻ Atualizar</button>
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', padding: 24, color: '#6b7280', fontSize: 13 }}>Carregando...</p>
            ) : (
              <>
                <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 10 }}>
                  {filtered.length} de {users.length} usuários
                </p>
                <div style={{ overflowX: 'auto' }}>
                  <table>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
                        {['Nome', 'E-mail', 'Role', 'Status', 'Criado em', 'Ações'].map((h) => (
                          <th key={h} style={S.th}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 && (
                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: 24, color: '#9ca3af', fontSize: 13 }}>Nenhum usuário encontrado.</td></tr>
                      )}
                      {filtered.map((u) => {
                        const isMe = session?.user?.id === u.id
                        return (
                          <tr key={u.id} style={{ borderBottom: '1px solid #f9fafb', opacity: u.is_active ? 1 : 0.5 }}>
                            <td style={S.td}>
                              <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}{isMe && <span style={{ fontSize: 10, color: '#6b7280', marginLeft: 5 }}>(você)</span>}</div>
                            </td>
                            <td style={{ ...S.td, fontSize: 12, color: '#6b7280' }}>{u.email}</td>
                            <td style={S.td}>
                              <span style={{
                                ...S.badge,
                                background: u.role === 'admin' ? '#fef3c7' : '#eff6ff',
                                color: u.role === 'admin' ? '#92400e' : '#1d4ed8',
                              }}>
                                {u.role === 'admin' ? '👑 Admin' : '👤 User'}
                              </span>
                            </td>
                            <td style={S.td}>
                              <span style={{
                                ...S.badge,
                                background: u.is_active ? '#dcfce7' : '#fee2e2',
                                color: u.is_active ? '#15803d' : '#dc2626',
                              }}>
                                {u.is_active ? '● Ativo' : '○ Inativo'}
                              </span>
                            </td>
                            <td style={{ ...S.td, fontSize: 11, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                              {new Date(u.created_at).toLocaleDateString('pt-BR')}
                            </td>
                            <td style={S.td}>
                              <div style={{ display: 'flex', gap: 6 }}>
                                {/* Toggle ativo */}
                                {!isMe && (
                                  <button
                                    onClick={() => toggleActive(u)}
                                    disabled={actionLoading === u.id}
                                    style={{ ...S.actionBtn, background: u.is_active ? '#fef2f2' : '#f0fdf4', color: u.is_active ? '#dc2626' : '#16a34a' }}
                                    title={u.is_active ? 'Desativar' : 'Ativar'}
                                  >
                                    {actionLoading === u.id ? '...' : u.is_active ? '✕' : '✓'}
                                  </button>
                                )}
                                {/* Toggle role */}
                                {!isMe && (
                                  <button
                                    onClick={() => toggleRole(u)}
                                    disabled={actionLoading === u.id + '_role'}
                                    style={{ ...S.actionBtn, background: '#f5f3ff', color: '#7c3aed' }}
                                    title={u.role === 'admin' ? 'Rebaixar para user' : 'Promover a admin'}
                                  >
                                    {actionLoading === u.id + '_role' ? '...' : u.role === 'admin' ? '↓' : '↑'}
                                  </button>
                                )}
                                {/* Excluir */}
                                {!isMe && (
                                  <button
                                    onClick={() => deleteUser(u)}
                                    disabled={actionLoading === u.id + '_del'}
                                    style={{ ...S.actionBtn, background: '#fef2f2', color: '#dc2626' }}
                                    title="Excluir usuário"
                                  >
                                    {actionLoading === u.id + '_del' ? '...' : '🗑'}
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        )}
      </Layout>
    </>
  )
}

const S: Record<string, React.CSSProperties> = {
  h1: { fontSize: 20, fontWeight: 700, color: '#1a1a2e', margin: '0 0 4px' },
  tabs: { display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e5e7eb', paddingBottom: 0 },
  tab: { padding: '8px 18px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: '#6b7280', borderBottom: '2px solid transparent' },
  tabActive: { color: '#2563eb', borderBottom: '2px solid #2563eb' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 },
  statCard: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '14px 16px' },
  statLabel: { fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' },
  statValue: { fontSize: 28, fontWeight: 700 },
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px' },
  filtersRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' },
  input: { padding: '7px 11px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 12, outline: 'none', background: '#fff', color: '#1a1a2e', boxSizing: 'border-box' as const },
  select: { padding: '7px 10px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 12, background: '#fff', color: '#1a1a2e', cursor: 'pointer' },
  refreshBtn: { padding: '7px 14px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', color: '#374151', cursor: 'pointer' },
  th: { textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 700, color: '#9ca3af', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' },
  td: { padding: '10px 10px', fontSize: 13, verticalAlign: 'middle' },
  badge: { display: 'inline-block', fontSize: 11, padding: '2px 8px', borderRadius: 999, fontWeight: 600 },
  actionBtn: { padding: '4px 10px', fontSize: 12, border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600 },
  alertError: { background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  alertSuccess: { background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#15803d', marginBottom: 14 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16 },
}
