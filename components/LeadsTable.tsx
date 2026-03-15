import { useState } from 'react'
import { useBreakpoint } from '../lib/useBreakpoint'
import { useSession } from 'next-auth/react'
import { Lead, Source, Priority } from '../lib/types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Props { leads: Lead[]; jobId: string; niche: string }

const SRC_LABEL: Record<Source, string> = { google_maps: 'Maps', instagram: 'Insta', linkedin: 'LinkedIn', facebook: 'Facebook' }
const SRC_COLOR: Record<Source, string> = { google_maps: '#EA4335', instagram: '#E1306C', linkedin: '#0A66C2', facebook: '#1877F2' }

export default function LeadsTable({ leads, jobId, niche }: Props) {
  const { data: session } = useSession()
  const token = session?.token || ''
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'
  const [filterCity, setFilterCity] = useState('')
  const [filterSource, setFilterSource] = useState<Source | ''>('')
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [downloading, setDownloading] = useState<'md' | 'csv' | null>(null)
  const PER_PAGE = 25

  const cities = Array.from(new Set(leads.map(l => l.city).filter(Boolean))).sort()
  const sources = Array.from(new Set(leads.map(l => l.source)))

  const filtered = leads.filter(l => {
    if (filterCity && l.city !== filterCity) return false
    if (filterSource && l.source !== filterSource) return false
    if (filterPriority && l.priority !== filterPriority) return false
    if (search) {
      const q = search.toLowerCase()
      return l.name.toLowerCase().includes(q) || l.city.toLowerCase().includes(q) || l.phone.includes(q) || l.email.toLowerCase().includes(q)
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  async function handleDownload(format: 'md' | 'csv') {
    setDownloading(format)
    try {
      const res = await fetch(`${API_URL}/api/scrape/download/${jobId}?format=${format}&niche=${encodeURIComponent(niche)}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Erro ao baixar arquivo.')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const today = new Date().toISOString().slice(0, 10)
      const safeNiche = niche.replace(/[^a-z0-9]/gi, '_').toLowerCase()
      a.href = url; a.download = `leads_${safeNiche}_${today}.${format}`; a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Erro ao baixar. Tente novamente.') }
    finally { setDownloading(null) }
  }

  return (
    <div style={S.card} className="animate-in">
      {/* Header */}
      <div style={S.header}>
        <div>
          <h2 style={S.title}>
            Leads encontrados
            <span style={S.countBadge}>{filtered.length} de {leads.length}</span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => handleDownload('md')} disabled={downloading === 'md'} style={S.dlMd}>
            {downloading === 'md' ? '...' : '↓ Baixar .md'}
          </button>
          <button onClick={() => handleDownload('csv')} disabled={downloading === 'csv'} style={S.dlCsv}>
            {downloading === 'csv' ? '...' : '↓ Baixar .csv'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={S.filters}>
        <input
          type="text" placeholder="Buscar por nome, cidade, telefone..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          style={S.searchInput}
        />
        <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setPage(1) }} style={S.select}>
          <option value="">Todas as cidades</option>
          {cities.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSource} onChange={e => { setFilterSource(e.target.value as Source | ''); setPage(1) }} style={S.select}>
          <option value="">Todas as fontes</option>
          {sources.map(s => <option key={s} value={s}>{SRC_LABEL[s]}</option>)}
        </select>
        <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value as Priority | ''); setPage(1) }} style={S.select}>
          <option value="">Todos</option>
          <option value="high">🔥 Sem site</option>
          <option value="normal">Com site</option>
        </select>
        {(filterCity || filterSource || filterPriority || search) && (
          <button onClick={() => { setFilterCity(''); setFilterSource(''); setFilterPriority(''); setSearch(''); setPage(1) }} style={S.clearBtn}>
            × Limpar
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr style={S.thead}>
              {['', 'Nome', 'Cidade/UF', 'Telefone', 'E-mail', 'WhatsApp', 'Instagram', 'LinkedIn', 'Facebook', 'Site', 'Categoria', 'Nota', 'Fonte'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={13} style={S.empty}>Nenhum lead encontrado.</td></tr>
            )}
            {paginated.map((l, i) => (
              <tr key={i} style={{ ...S.tr, ...(l.priority === 'high' ? S.trHot : {}) }}>
                <td style={S.td}>
                  {l.priority === 'high'
                    ? <span style={S.hotChip}>🔥</span>
                    : <span style={S.normalChip}>—</span>}
                </td>
                <td style={{ ...S.td, ...S.tdName }}>{l.name}</td>
                <td style={{ ...S.td, fontSize: 12, whiteSpace: 'nowrap' as const }}>
                  {[l.city, l.state].filter(Boolean).join('/') || '—'}
                </td>
                <td style={{ ...S.td, fontSize: 12 }}>{l.phone || '—'}</td>
                <td style={{ ...S.td, fontSize: 11 }}>
                  {l.email ? <a href={`mailto:${l.email}`} style={S.link}>{l.email}</a> : '—'}
                </td>
                <td style={S.td}>
                  {(l as any).whatsapp
                    ? <a href={(l as any).whatsapp} target="_blank" rel="noreferrer" style={{ ...S.link, color: '#25D366', fontWeight: 700, fontSize: 12 }}>WhatsApp</a>
                    : '—'}
                </td>
                <td style={S.td}>
                  {l.instagram
                    ? <a href={l.instagram} target="_blank" rel="noreferrer" style={{ ...S.link, color: '#E1306C', fontSize: 12 }}>Perfil</a>
                    : '—'}
                </td>
                <td style={S.td}>
                  {l.linkedin
                    ? <a href={l.linkedin} target="_blank" rel="noreferrer" style={{ ...S.link, color: '#0A66C2', fontSize: 12 }}>Perfil</a>
                    : '—'}
                </td>
                <td style={S.td}>
                  {l.facebook
                    ? <a href={l.facebook} target="_blank" rel="noreferrer" style={{ ...S.link, color: '#1877F2', fontSize: 12 }}>Página</a>
                    : '—'}
                </td>
                <td style={S.td}>
                  {l.website
                    ? <a href={l.website} target="_blank" rel="noreferrer" style={{ ...S.link, fontSize: 11 }}>Acessar</a>
                    : <span style={S.noSite}>sem site</span>}
                </td>
                <td style={{ ...S.td, fontSize: 11, color: 'var(--gray-400)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                  {(l as any).category || '—'}
                </td>
                <td style={{ ...S.td, fontSize: 11, whiteSpace: 'nowrap' as const }}>
                  {l.rating ? (
                    <span style={S.ratingBadge}>{l.rating}/5</span>
                  ) : '—'}
                </td>
                <td style={S.td}>
                  <span style={{ ...S.srcChip, background: SRC_COLOR[l.source] + '15', color: SRC_COLOR[l.source] }}>
                    {SRC_LABEL[l.source]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={S.pagination}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={S.pageBtn}>← Anterior</button>
          <span style={S.pageInfo}>Página {page} de {totalPages} · {filtered.length} leads</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={S.pageBtn}>Próxima →</button>
        </div>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  card: { background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', marginBottom: 20, overflow: 'hidden' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', flexWrap: 'wrap', gap: 10 },
  title: { fontSize: 16, fontWeight: 700, color: 'var(--navy)', margin: 0, display: 'flex', alignItems: 'center', gap: 10 },
  countBadge: { fontSize: 13, fontWeight: 500, color: 'var(--gray-400)', background: 'var(--gray-100)', padding: '2px 10px', borderRadius: 999 },
  dlMd: { fontSize: 13, fontWeight: 600, padding: '8px 16px', background: 'var(--green-light)', color: 'var(--green)', border: '1px solid #A7F3D0', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font)' },
  dlCsv: { fontSize: 13, fontWeight: 600, padding: '8px 16px', background: 'var(--indigo-pale)', color: 'var(--indigo)', border: '1px solid var(--indigo-light)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font)' },
  filters: { display: 'flex', gap: 8, padding: '14px 24px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)', flexWrap: 'wrap' as const },
  searchInput: { flex: 1, minWidth: 220, padding: '8px 12px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'var(--font)', color: 'var(--navy)', background: 'var(--white)', outline: 'none' },
  select: { padding: '8px 10px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'var(--font)', background: 'var(--white)', color: 'var(--navy)', cursor: 'pointer' },
  clearBtn: { fontSize: 11, fontWeight: 600, padding: '7px 12px', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', background: 'var(--red-light)', color: 'var(--red)', cursor: 'pointer', fontFamily: 'var(--font)' },
  thead: { borderBottom: '2px solid var(--gray-100)' },
  th: { textAlign: 'left', padding: '10px 12px', fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' as const },
  tr: { borderBottom: '1px solid var(--gray-50)', transition: 'background var(--transition)' },
  trHot: { background: 'rgba(14,159,110,0.04)' },
  td: { padding: '10px 12px', fontSize: 13, verticalAlign: 'middle' },
  tdName: { fontWeight: 600, maxWidth: 180, wordBreak: 'break-word', color: 'var(--navy)' },
  hotChip: { fontSize: 14 },
  normalChip: { fontSize: 12, color: 'var(--gray-300)' },
  noSite: { fontSize: 11, color: 'var(--gray-300)', fontStyle: 'italic' },
  link: { color: 'var(--indigo)', textDecoration: 'none', fontWeight: 500 },
  ratingBadge: { fontSize: 11, fontWeight: 600, padding: '2px 7px', background: 'var(--yellow-light)', color: 'var(--yellow)', borderRadius: 999 },
  srcChip: { fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999 },
  empty: { textAlign: 'center', padding: '32px', color: 'var(--gray-400)', fontSize: 13 },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, padding: '16px', borderTop: '1px solid var(--gray-100)' },
  pageBtn: { fontSize: 12, fontWeight: 500, padding: '6px 14px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', background: 'var(--white)', cursor: 'pointer', color: 'var(--navy)', fontFamily: 'var(--font)' },
  pageInfo: { fontSize: 12, color: 'var(--gray-400)' },
}