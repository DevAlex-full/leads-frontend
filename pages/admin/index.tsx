import { useState, useEffect, useCallback } from 'react'
import { useBreakpoint } from '../../lib/useBreakpoint'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Layout from '../../components/Layout'
import { adminApi, AdminUser, AdminStats, ApiError } from '../../lib/api'

type Tab = 'users' | 'stats'

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const isTablet = bp === 'tablet'
  const [tab, setTab] = useState<Tab>('users')
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState<'' | 'user' | 'admin'>('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') router.replace('/')
  }, [session, status, router])

  const loadData = useCallback(async () => {
    if (!session?.token) return
    setLoading(true)
    setError('')
    try {
      const [ud, sd] = await Promise.all([adminApi.getUsers(session.token), adminApi.getStats(session.token)])
      setUsers(ud.users); setStats(sd)
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar dados.')
    } finally { setLoading(false) }
  }, [session?.token])

  useEffect(() => { if (session?.user.role === 'admin') loadData() }, [loadData, session])

  async function toggleActive(u: AdminUser) {
    if (!session?.token) return
    setActionLoading(u.id)
    try {
      await adminApi.updateUser(u.id, { is_active: !u.is_active }, session.token)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !u.is_active } : x))
      setSuccess(`Usuário ${!u.is_active ? 'ativado' : 'desativado'}.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) { setError(err instanceof ApiError ? err.message : 'Erro.') }
    finally { setActionLoading(null) }
  }

  async function toggleRole(u: AdminUser) {
    if (!session?.token) return
    const newRole = u.role === 'admin' ? 'user' : 'admin'
    setActionLoading(u.id + '_r')
    try {
      await adminApi.updateUser(u.id, { role: newRole }, session.token)
      setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: newRole } : x))
      setSuccess(`Role atualizado para ${newRole}.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) { setError(err instanceof ApiError ? err.message : 'Erro.') }
    finally { setActionLoading(null) }
  }

  async function deleteUser(u: AdminUser) {
    if (!session?.token || !confirm(`Excluir "${u.name}"?`)) return
    setActionLoading(u.id + '_d')
    try {
      await adminApi.deleteUser(u.id, session.token)
      setUsers(prev => prev.filter(x => x.id !== u.id))
      setSuccess(`Usuário ${u.name} removido.`)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: unknown) { setError(err instanceof ApiError ? err.message : 'Erro.') }
    finally { setActionLoading(null) }
  }

  if (status === 'loading' || session?.user.role !== 'admin') return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center', color: 'var(--gray-400)', fontSize: 14 }}>Verificando permissões...</div>
    </div>
  )

  const filtered = users.filter(u => {
    if (filterRole && u.role !== filterRole) return false
    if (search) { const q = search.toLowerCase(); return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) }
    return true
  })

  const statItems = stats ? [
    { label: 'Total de usuários', value: stats.total, color: 'var(--navy)' },
    { label: 'Usuários ativos', value: stats.active, color: 'var(--green)' },
    { label: 'Inativos', value: stats.inactive, color: 'var(--red)' },
    { label: 'Administradores', value: stats.admins, color: 'var(--indigo)' },
    { label: 'Novos hoje', value: stats.newToday, color: 'var(--cyan)' },
    { label: 'Este mês', value: stats.newThisMonth, color: 'var(--indigo)' },
  ] : []

  return (
    <>
      <Head><title>Admin · AxLead</title></Head>
      <Layout>
        {/* Page header */}
        <div style={S.pageHeader}>
          <div>
            <h1 style={{ ...S.pageTitle, fontSize: isMobile ? 18 : 22 }}>Painel Admin</h1>
            <p style={S.pageSubtitle}>Gerencie usuários e monitore a plataforma</p>
          </div>
          <button onClick={loadData} style={S.refreshBtn}>↻ Atualizar</button>
        </div>

        {error && (
          <div style={S.alertError}>{error}
            <button onClick={() => setError('')} style={S.closeBtn}>✕</button>
          </div>
        )}
        {success && <div style={S.alertSuccess}>{success}</div>}

        {/* Stats strip */}
        {stats && (
          <div style={{ ...S.statsStrip, gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : isTablet ? 'repeat(3,1fr)' : 'repeat(6,1fr)' }}>
            {statItems.map(s => (
              <div key={s.label} style={S.statItem}>
                <p style={S.statLabel}>{s.label}</p>
                <p style={{ ...S.statValue, color: s.color, fontSize: isMobile ? 20 : 24 }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Main card */}
        <div style={S.card}>
          {/* Tabs */}
          <div style={S.tabs}>
            {([['users', '👥 Usuários'], ['stats', '📊 Estatísticas']] as [Tab, string][]).map(([t, l]) => (
              <button key={t} onClick={() => setTab(t)} style={{ ...S.tab, ...(tab === t ? S.tabActive : {}) }}>
                {l}
              </button>
            ))}
          </div>

          {/* Users tab */}
          {tab === 'users' && (
            <div style={S.tabContent}>
              <div style={{ ...S.tableFilters, padding: isMobile ? '12px 16px' : '16px 24px' }}>
                <input type="text" placeholder="Buscar por nome ou e-mail..." value={search}
                  onChange={e => setSearch(e.target.value)} style={S.searchInput} />
                <select value={filterRole} onChange={e => setFilterRole(e.target.value as '' | 'user' | 'admin')} style={S.select}>
                  <option value="">Todos os roles</option>
                  <option value="user">Usuário</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {loading ? (
                <p style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)', fontSize: 13 }}>Carregando...</p>
              ) : (
                <>
                  <p style={{ fontSize: 12, color: 'var(--gray-400)', padding: '0 24px 10px', margin: 0 }}>
                    {filtered.length} de {users.length} usuários
                  </p>
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' as unknown as undefined }}>
                    <table>
                      <thead>
                        <tr style={S.thead}>
                          {['Nome', 'E-mail', 'Role', 'Status', 'Criado em', 'Ações'].map(h => (
                            <th key={h} style={S.th}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.length === 0 && (
                          <tr><td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--gray-400)', fontSize: 13 }}>Nenhum usuário encontrado.</td></tr>
                        )}
                        {filtered.map(u => {
                          const isMe = session?.user?.id === u.id
                          return (
                            <tr key={u.id} style={{ ...S.tr, opacity: u.is_active ? 1 : 0.5 }}>
                              <td style={{ ...S.td, fontWeight: 600, color: 'var(--navy)' }}>
                                {u.name}
                                {isMe && <span style={S.youBadge}>você</span>}
                              </td>
                              <td style={{ ...S.td, fontSize: 12, color: 'var(--gray-500)' }}>{u.email}</td>
                              <td style={S.td}>
                                <span style={{ ...S.roleBadge, ...(u.role === 'admin' ? S.roleAdmin : S.roleUser) }}>
                                  {u.role === 'admin' ? '👑 Admin' : '👤 User'}
                                </span>
                              </td>
                              <td style={S.td}>
                                <span style={{ ...S.statusBadge, ...(u.is_active ? S.statusActive : S.statusInactive) }}>
                                  {u.is_active ? '● Ativo' : '○ Inativo'}
                                </span>
                              </td>
                              <td style={{ ...S.td, fontSize: 11, color: 'var(--gray-400)', whiteSpace: 'nowrap' as const }}>
                                {new Date(u.created_at).toLocaleDateString('pt-BR')}
                              </td>
                              <td style={S.td}>
                                {!isMe && (
                                  <div style={{ display: 'flex', gap: 6 }}>
                                    <button onClick={() => toggleActive(u)} disabled={actionLoading === u.id} style={S.actionBtn} title={u.is_active ? 'Desativar' : 'Ativar'}>
                                      {actionLoading === u.id ? '...' : u.is_active ? '✕' : '✓'}
                                    </button>
                                    <button onClick={() => toggleRole(u)} disabled={actionLoading === u.id + '_r'} style={{ ...S.actionBtn, ...S.actionPurple }} title="Alterar role">
                                      {actionLoading === u.id + '_r' ? '...' : '⇅'}
                                    </button>
                                    <button onClick={() => deleteUser(u)} disabled={actionLoading === u.id + '_d'} style={{ ...S.actionBtn, ...S.actionRed }} title="Excluir">
                                      {actionLoading === u.id + '_d' ? '...' : '🗑'}
                                    </button>
                                  </div>
                                )}
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

          {/* Stats tab */}
          {tab === 'stats' && stats && (
            <div style={{ padding: isMobile ? '16px' : '24px' }}>
              <div style={S.statsGrid}>
                {statItems.map(s => (
                  <div key={s.label} style={S.statCard}>
                    <p style={S.statCardLabel}>{s.label}</p>
                    <p style={{ ...S.statCardValue, color: s.color }}>{s.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Layout>
    </>
  )
}

const S: Record<string, React.CSSProperties> = {
  pageHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 },
  pageTitle: { fontSize: 22, fontWeight: 700, color: 'var(--navy)', margin: '0 0 4px', letterSpacing: '-0.4px' },
  pageSubtitle: { fontSize: 13, color: 'var(--gray-400)', margin: 0 },
  refreshBtn: { fontSize: 13, padding: '8px 16px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', background: 'var(--white)', color: 'var(--gray-600)', cursor: 'pointer', fontFamily: 'var(--font)' },
  statsStrip: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 },
  statItem: { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '16px 18px', boxShadow: 'var(--shadow-sm)' },
  statLabel: { fontSize: 11, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 6px' },
  statValue: { fontSize: 24, fontWeight: 700, margin: 0, letterSpacing: '-0.4px' },
  card: { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', overflow: 'hidden' },
  tabs: { display: 'flex', borderBottom: '1px solid var(--gray-200)', padding: '0 24px' },
  tab: { padding: '14px 16px', fontSize: 13, fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--gray-400)', borderBottom: '2px solid transparent', marginBottom: -1, fontFamily: 'var(--font)', transition: 'color var(--transition)' },
  tabActive: { color: 'var(--navy)', borderBottom: '2px solid var(--indigo)' },
  tabContent: {},
  tableFilters: { display: 'flex', gap: 8, padding: '16px 24px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)', flexWrap: 'wrap' as const },
  searchInput: { flex: 1, minWidth: 200, padding: '8px 12px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'var(--font)', color: 'var(--navy)', background: 'var(--white)', outline: 'none' },
  select: { padding: '8px 10px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'var(--font)', background: 'var(--white)', color: 'var(--navy)', cursor: 'pointer' },
  thead: { borderBottom: '2px solid var(--gray-100)', background: 'var(--gray-50)' },
  th: { textAlign: 'left', padding: '10px 16px', fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' as const },
  tr: { borderBottom: '1px solid var(--gray-50)', transition: 'background var(--transition)' },
  td: { padding: '10px 12px', fontSize: 13, verticalAlign: 'middle' },
  youBadge: { fontSize: 10, fontWeight: 600, padding: '2px 7px', background: 'var(--indigo-pale)', color: 'var(--indigo)', borderRadius: 999, marginLeft: 6 },
  roleBadge: { fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999 },
  roleAdmin: { background: '#FFF7ED', color: '#C2410C' },
  roleUser: { background: 'var(--indigo-pale)', color: 'var(--indigo)' },
  statusBadge: { fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 999 },
  statusActive: { background: 'var(--green-light)', color: 'var(--green)' },
  statusInactive: { background: 'var(--gray-100)', color: 'var(--gray-400)' },
  actionBtn: { fontSize: 13, padding: '5px 10px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', background: 'var(--white)', cursor: 'pointer', fontFamily: 'var(--font)' },
  actionPurple: { background: 'var(--indigo-pale)', borderColor: 'var(--indigo-light)', color: 'var(--indigo)' },
  actionRed: { background: 'var(--red-light)', borderColor: '#FECACA', color: 'var(--red)' },
  alertError: { background: 'var(--red-light)', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', padding: '11px 14px', fontSize: 13, color: 'var(--red)', marginBottom: 16, display: 'flex', justifyContent: 'space-between' },
  alertSuccess: { background: 'var(--green-light)', border: '1px solid #A7F3D0', borderRadius: 'var(--radius-md)', padding: '11px 14px', fontSize: 13, color: 'var(--green)', marginBottom: 16 },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 14 },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 },
  statCard: { background: 'var(--gray-50)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', padding: '20px' },
  statCardLabel: { fontSize: 12, color: 'var(--gray-400)', margin: '0 0 8px', fontWeight: 500 },
  statCardValue: { fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' },
}