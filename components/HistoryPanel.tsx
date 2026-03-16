import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { historyApi, SessionSummary, ApiError } from '../lib/api'
import { useBreakpoint } from '../lib/useBreakpoint'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const SRC: Record<string, string> = { google_maps: 'Maps', instagram: 'Insta', linkedin: 'LinkedIn', facebook: 'Facebook' }
const SITE: Record<string, string> = { all: 'Todos', without_site: 'Sem site', with_site: 'Com site' }
const SITE_COLOR: Record<string, string> = { all: 'var(--gray-500)', without_site: 'var(--green)', with_site: 'var(--indigo)' }

export default function HistoryPanel() {
  const { data: session } = useSession()
  const token = session?.token || ''
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const [sessions, setSessions] = useState<SessionSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [enriching, setEnriching] = useState<string | null>(null)
  const [open, setOpen] = useState(false)


  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const d = await historyApi.list(token)
      setSessions(d.sessions)
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Erro ao carregar histórico.')
    } finally { setLoading(false) }
  }, [token])

  useEffect(() => { if (open && token) load() }, [open, token, load])

  async function handleDownload(sess: SessionSummary, fmt: 'md' | 'csv') {
    const key = `${sess.id}_${fmt}`
    setDownloading(key)
    try {
      const res = await fetch(`${API_URL}/api/history/${sess.id}/download?format=${fmt}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao baixar.')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `leads_${sess.niche.replace(/\s+/g, '_')}_${sess.created_at.slice(0, 10)}.${fmt}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao baixar.')
    } finally { setDownloading(null) }
  }

  async function handleEnrich(sess: SessionSummary) {
    setEnriching(sess.id)
    setError('')
    try {
      const res = await fetch(`${API_URL}/api/enrich/session/${sess.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Erro ao enriquecer.')
      const { jobId } = data.data

      // Poll a cada 4s até terminar
      let attempts = 0
      const poll = setInterval(async () => {
        attempts++
        try {
          const sr = await fetch(`${API_URL}/api/enrich/job/${encodeURIComponent(jobId)}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          const sdata = await sr.json()
          const job = sdata.data || {}
          if (job.status === 'done' || job.status === 'failed' || attempts > 60) {
            clearInterval(poll)
            setEnriching(null)
            if (job.status === 'done') {
              alert(`Enriquecimento concluído! ${job.enriched ?? 0} leads atualizados.`)
            } else if (job.status === 'failed') {
              setError('Enriquecimento falhou. Tente novamente.')
            }
          }
        } catch { clearInterval(poll); setEnriching(null) }
      }, 4000)
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Erro ao enriquecer.')
      setEnriching(null)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta sessão permanentemente?')) return
    setDeleting(id)
    try {
      await historyApi.delete(id, token)
      setSessions(p => p.filter(s => s.id !== id))
    } catch (err: unknown) {
      setError(err instanceof ApiError ? err.message : 'Erro ao excluir.')
    } finally { setDeleting(null) }
  }

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Toggle */}
      <button onClick={() => setOpen(v => !v)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: isMobile ? '14px 16px' : '16px 22px',
        background: 'var(--white)', border: '1px solid var(--gray-200)',
        borderRadius: open ? 'var(--radius-lg) var(--radius-lg) 0 0' : 'var(--radius-lg)',
        fontSize: 14, fontWeight: 600, color: 'var(--navy)',
        cursor: 'pointer', boxShadow: 'var(--shadow-sm)',
        fontFamily: 'var(--font)',
      }}>
        <span style={{ fontSize: 16 }}>📂</span>
        <span>Histórico de buscas</span>
        {sessions.length > 0 && !open && (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', background: 'var(--indigo-pale)', color: 'var(--indigo)', borderRadius: 999 }}>
            {sessions.length}
          </span>
        )}
        <span style={{ marginLeft: 'auto', fontSize: 10, color: 'var(--gray-400)' }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          background: 'var(--white)', border: '1px solid var(--gray-200)',
          borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
          padding: isMobile ? '14px 16px 16px' : '16px 22px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-600)', margin: 0 }}>
              {sessions.length} sessão{sessions.length !== 1 ? 'ões' : ''} salva{sessions.length !== 1 ? 's' : ''}
            </p>
            <button onClick={load} style={{ fontSize: 12, padding: '5px 12px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', background: 'var(--white)', color: 'var(--gray-500)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
              ↻ Atualizar
            </button>
          </div>

          {error && (
            <div style={{ background: 'var(--red-light)', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', padding: '8px 12px', fontSize: 12, color: 'var(--red)', marginBottom: 10, display: 'flex', justifyContent: 'space-between' }}>
              {error}
              <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', fontSize: 14 }}>✕</button>
            </div>
          )}

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--gray-400)', fontSize: 13 }}>Carregando...</div>
          ) : sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}>
              <p style={{ fontSize: 14, color: 'var(--gray-500)', fontWeight: 500, margin: '0 0 4px' }}>Nenhuma busca salva ainda</p>
              <p style={{ fontSize: 12, color: 'var(--gray-400)', margin: 0 }}>Após o scraping, os leads ficam salvos aqui para download.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {sessions.map(sess => (
                <div key={sess.id} style={{
                  display: 'flex', alignItems: isMobile ? 'flex-start' : 'center',
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? 10 : 14,
                  padding: isMobile ? '12px' : '12px 16px',
                  background: 'var(--gray-50)', border: '1px solid var(--gray-100)',
                  borderRadius: 'var(--radius-md)',
                }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 10px', background: 'var(--indigo-pale)', color: 'var(--indigo)', borderRadius: 999 }}>
                        {sess.niche}
                      </span>
                      <span style={{ fontSize: 11, padding: '2px 8px', background: 'var(--gray-100)', color: SITE_COLOR[sess.site_filter] || 'var(--gray-500)', borderRadius: 999, fontWeight: 500 }}>
                        {SITE[sess.site_filter] || sess.site_filter}
                      </span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)' }}>{sess.total_leads} leads</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--gray-400)', margin: 0, lineHeight: 1.4 }}>
                      {new Date(sess.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {' · '}{sess.sources.map(s => SRC[s] || s).join(', ')}
                      {' · '}{sess.cities.slice(0, isMobile ? 1 : 2).join(', ')}{sess.cities.length > (isMobile ? 1 : 2) ? ` +${sess.cities.length - (isMobile ? 1 : 2)}` : ''}
                    </p>
                  </div>

                  {/* Ações */}
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => handleDownload(sess, 'md')} disabled={downloading === `${sess.id}_md`}
                      style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', background: 'var(--green-light)', color: 'var(--green)', border: '1px solid #A7F3D0', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                      {downloading === `${sess.id}_md` ? '...' : '.md'}
                    </button>
                    <button onClick={() => handleDownload(sess, 'csv')} disabled={downloading === `${sess.id}_csv`}
                      style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', background: 'var(--indigo-pale)', color: 'var(--indigo)', border: '1px solid var(--indigo-light)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                      {downloading === `${sess.id}_csv` ? '...' : '.csv'}
                    </button>
                    <button onClick={() => handleEnrich(sess)} disabled={enriching === sess.id}
                      style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', background: '#EEF0FB', color: '#5469D4', border: '1px solid #C7CCF0', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                      {enriching === sess.id ? '...' : '✦ Enriquecer'}
                    </button>
                    <button onClick={() => handleDelete(sess.id)} disabled={deleting === sess.id}
                      style={{ fontSize: 14, fontWeight: 700, padding: '6px 10px', background: 'var(--red-light)', color: 'var(--red)', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font)' }}>
                      {deleting === sess.id ? '...' : '×'}
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