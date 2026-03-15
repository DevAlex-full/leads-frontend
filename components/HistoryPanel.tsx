import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { historyApi, SessionSummary, ApiError } from '../lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

const SOURCE_LABELS: Record<string, string> = {
  google_maps: 'Maps',
  instagram: 'Insta',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
}

const SITE_FILTER_LABELS: Record<string, string> = {
  all: 'Todos',
  without_site: 'Sem site',
  with_site: 'Com site',
}

export default function HistoryPanel() {
  const { data: session } = useSession()
  const token = session?.token || ''

  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [open, setOpen] = useState(false)

  const loadHistory = useCallback(async () => {
    if (!token) return
    setLoading(true)
    setError('')
    try {
      const data = await historyApi.list(token)
      setSessions(data.sessions)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar histórico.')
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (open && token) loadHistory()
  }, [open, token, loadHistory])

  async function handleDownload(sess: SessionSummary, format: 'md' | 'csv') {
    const key = `${sess.id}_${format}`
    setDownloading(key)
    try {
      // Fetch com Bearer token para download seguro
      const res = await fetch(
        `${API_URL}/api/history/${sess.id}/download?format=${format}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Erro ao baixar arquivo.')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const date = new Date(sess.created_at).toISOString().slice(0, 10)
      const safeNiche = sess.niche.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      a.href = url
      a.download = `leads_${safeNiche}_${date}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar.')
    } finally {
      setDownloading(null)
    }
  }

  async function handleDelete(sessionId: string) {
    if (!confirm('Excluir esta sessão? Esta ação é irreversível.')) return
    setDeleting(sessionId)
    try {
      await historyApi.delete(sessionId, token)
      setSessions((prev) => prev.filter((s) => s.id !== sessionId))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao excluir.')
    } finally {
      setDeleting(null)
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div style={S.wrapper}>
      {/* Toggle button */}
      <button onClick={() => setOpen((v) => !v)} style={S.toggleBtn}>
        <span style={{ fontSize: 16 }}>📂</span>
        Histórico de buscas
        {sessions.length > 0 && !open && (
          <span style={S.countBadge}>{sessions.length}</span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 12, opacity: 0.7 }}>
          {open ? '▲ fechar' : '▼ abrir'}
        </span>
      </button>

      {/* Painel */}
      {open && (
        <div style={S.panel}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <p style={S.panelTitle}>
              {sessions.length} sessão{sessions.length !== 1 ? 'ões' : ''} salva{sessions.length !== 1 ? 's' : ''}
            </p>
            <button onClick={loadHistory} style={S.refreshBtn}>↻ Atualizar</button>
          </div>

          {error && (
            <div style={S.errorBox}>{error} <button onClick={() => setError('')} style={S.closeBtn}>✕</button></div>
          )}

          {loading ? (
            <p style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', padding: '20px 0' }}>Carregando...</p>
          ) : sessions.length === 0 ? (
            <div style={S.emptyBox}>
              <p style={{ fontSize: 14, color: '#6b7280' }}>Nenhuma busca salva ainda.</p>
              <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                Após uma busca, os leads ficam salvos aqui para download a qualquer momento.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sessions.map((sess) => (
                <div key={sess.id} style={S.sessionCard}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={S.nicheBadge}>{sess.niche}</span>
                      <span style={S.filterBadge}>
                        {SITE_FILTER_LABELS[sess.site_filter] || sess.site_filter}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#16a34a' }}>
                        {sess.total_leads} leads
                      </span>
                    </div>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>
                      {formatDate(sess.created_at)} ·{' '}
                      {sess.sources.map((s) => SOURCE_LABELS[s] || s).join(', ')} ·{' '}
                      {sess.cities.slice(0, 3).join(', ')}{sess.cities.length > 3 ? ` +${sess.cities.length - 3}` : ''}
                    </p>
                  </div>

                  {/* Ações */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'center' }}>
                    <button
                      onClick={() => handleDownload(sess, 'md')}
                      disabled={downloading === `${sess.id}_md`}
                      style={{ ...S.dlBtn, background: '#f0fdf4', color: '#16a34a', borderColor: '#bbf7d0' }}
                      title="Baixar .md"
                    >
                      {downloading === `${sess.id}_md` ? '...' : '⬇ .md'}
                    </button>
                    <button
                      onClick={() => handleDownload(sess, 'csv')}
                      disabled={downloading === `${sess.id}_csv`}
                      style={{ ...S.dlBtn, background: '#eff6ff', color: '#2563eb', borderColor: '#bfdbfe' }}
                      title="Baixar .csv"
                    >
                      {downloading === `${sess.id}_csv` ? '...' : '⬇ .csv'}
                    </button>
                    <button
                      onClick={() => handleDelete(sess.id)}
                      disabled={deleting === sess.id}
                      style={{ ...S.dlBtn, background: '#fef2f2', color: '#dc2626', borderColor: '#fecaca' }}
                      title="Excluir sessão"
                    >
                      {deleting === sess.id ? '...' : '🗑'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  wrapper: { marginBottom: 20 },
  toggleBtn: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
    padding: '14px 20px', background: '#fff',
    border: '1px solid #e5e7eb', borderRadius: 12,
    fontSize: 14, fontWeight: 600, color: '#374151',
    cursor: 'pointer', textAlign: 'left',
  },
  countBadge: {
    fontSize: 11, fontWeight: 700, padding: '2px 8px',
    background: '#dbeafe', color: '#1d4ed8', borderRadius: 999,
  },
  panel: {
    background: '#fff', border: '1px solid #e5e7eb',
    borderTop: 'none', borderRadius: '0 0 12px 12px',
    padding: '16px 20px',
  },
  panelTitle: { fontSize: 13, fontWeight: 600, color: '#374151', margin: 0 },
  refreshBtn: {
    fontSize: 12, padding: '4px 12px',
    border: '1px solid #e5e7eb', borderRadius: 8,
    background: '#fff', color: '#6b7280', cursor: 'pointer',
  },
  sessionCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 14px', background: '#f9fafb',
    border: '1px solid #f3f4f6', borderRadius: 10,
    flexWrap: 'wrap',
  },
  nicheBadge: {
    fontSize: 12, fontWeight: 700, padding: '2px 10px',
    background: '#f5f3ff', color: '#7c3aed',
    borderRadius: 999, border: '1px solid #ddd6fe',
  },
  filterBadge: {
    fontSize: 11, padding: '2px 8px',
    background: '#f3f4f6', color: '#6b7280',
    borderRadius: 999,
  },
  dlBtn: {
    fontSize: 12, fontWeight: 600, padding: '5px 12px',
    border: '1px solid', borderRadius: 7, cursor: 'pointer',
  },
  emptyBox: {
    textAlign: 'center', padding: '24px 0',
    background: '#f9fafb', borderRadius: 10,
  },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 8, padding: '8px 12px', fontSize: 13,
    color: '#dc2626', marginBottom: 12,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  closeBtn: { background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16 },
}