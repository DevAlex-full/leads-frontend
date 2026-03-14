import { useState } from 'react'
import { Lead, Source, Priority } from '../lib/types'
import { api } from '../lib/api'

interface Props {
  leads: Lead[]
  jobId: string
  niche: string
}

const SOURCE_LABELS: Record<Source, string> = {
  google_maps: 'Google Maps',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
}

const SOURCE_COLORS: Record<Source, string> = {
  google_maps: '#ea4335',
  instagram: '#e1306c',
  linkedin: '#0a66c2',
  facebook: '#1877f2',
}

export default function LeadsTable({ leads, jobId, niche }: Props) {
  const [filterCity, setFilterCity] = useState('')
  const [filterSource, setFilterSource] = useState<Source | ''>('')
  const [filterPriority, setFilterPriority] = useState<Priority | ''>('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const PER_PAGE = 25

  const cities = Array.from(new Set(leads.map((l) => l.city).filter(Boolean))).sort()
  const sources = Array.from(new Set(leads.map((l) => l.source)))

  const filtered = leads.filter((l) => {
    if (filterCity && l.city !== filterCity) return false
    if (filterSource && l.source !== filterSource) return false
    if (filterPriority && l.priority !== filterPriority) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        l.name.toLowerCase().includes(q) ||
        l.city.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.email.toLowerCase().includes(q)
      )
    }
    return true
  })

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function handleDownload(format: 'md' | 'csv') {
    const url = api.downloadUrl(jobId, format, niche)
    window.open(url, '_blank')
  }

  function resetFilters() {
    setFilterCity('')
    setFilterSource('')
    setFilterPriority('')
    setSearch('')
    setPage(1)
  }

  return (
    <section style={S.card}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div>
          <h2 style={S.h2}>
            📋 Leads encontrados{' '}
            <span style={{ color: '#6b7280', fontSize: 14 }}>
              ({filtered.length} de {leads.length})
            </span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => handleDownload('md')} style={{ ...S.btn, ...S.btnSuccess }}>
            ⬇ Baixar .md
          </button>
          <button onClick={() => handleDownload('csv')} style={{ ...S.btn, ...S.btnOutline }}>
            ⬇ Baixar .csv
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={S.filtersRow}>
        <input
          type="text"
          placeholder="Buscar por nome, cidade, telefone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          style={{ ...S.input, maxWidth: 280 }}
        />
        <select value={filterCity} onChange={(e) => { setFilterCity(e.target.value); setPage(1) }} style={S.select}>
          <option value="">Todas as cidades</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterSource} onChange={(e) => { setFilterSource(e.target.value as Source | ''); setPage(1) }} style={S.select}>
          <option value="">Todas as fontes</option>
          {sources.map((s) => <option key={s} value={s}>{SOURCE_LABELS[s]}</option>)}
        </select>
        <select value={filterPriority} onChange={(e) => { setFilterPriority(e.target.value as Priority | ''); setPage(1) }} style={S.select}>
          <option value="">Todas as prioridades</option>
          <option value="high">🔥 Prioridade alta (sem site)</option>
          <option value="normal">Normal (com site)</option>
        </select>
        {(filterCity || filterSource || filterPriority || search) && (
          <button onClick={resetFilters} style={S.clearBtn}>✕ Limpar filtros</button>
        )}
      </div>

      {/* Tabela */}
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr style={{ borderBottom: '2px solid #f3f4f6' }}>
              {['', 'Nome', 'Cidade/UF', 'Telefone', 'E-mail', 'WhatsApp', 'Instagram', 'LinkedIn', 'Facebook', 'Site', 'Categoria', 'Nota', 'Fonte'].map((h) => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr>
                <td colSpan={13} style={{ textAlign: 'center', padding: '24px', color: '#9ca3af', fontSize: 13 }}>
                  Nenhum lead encontrado com os filtros aplicados.
                </td>
              </tr>
            )}
            {paginated.map((l, i) => (
              <tr
                key={i}
                style={{
                  borderBottom: '1px solid #f9fafb',
                  background: l.priority === 'high' ? '#f0fdf4' : 'transparent',
                }}
              >
                <td style={S.td}>
                  {l.priority === 'high' ? (
                    <span style={{ ...S.badge, background: '#dcfce7', color: '#15803d' }}>🔥</span>
                  ) : (
                    <span style={{ ...S.badge, background: '#f3f4f6', color: '#9ca3af' }}>—</span>
                  )}
                </td>
                <td style={{ ...S.td, fontWeight: 600, maxWidth: 180, wordBreak: 'break-word' }}>{l.name}</td>
                <td style={{ ...S.td, whiteSpace: 'nowrap', fontSize: 12 }}>
                  {[l.city, l.state].filter(Boolean).join('/') || '—'}
                </td>
                <td style={{ ...S.td, fontSize: 12 }}>{l.phone || '—'}</td>
                <td style={{ ...S.td, fontSize: 11 }}>
                  {l.email
                    ? <a href={`mailto:${l.email}`}>{l.email}</a>
                    : '—'}
                </td>
                <td style={S.td}>
                  {(l as any).whatsapp
                    ? <a href={(l as any).whatsapp} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#25d366', fontWeight: 600 }}>zap</a>
                    : '—'}
                </td>
                <td style={S.td}>
                  {l.instagram
                    ? <a href={l.instagram} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#e1306c' }}>insta</a>
                    : '—'}
                </td>
                <td style={S.td}>
                  {l.linkedin
                    ? <a href={l.linkedin} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#0a66c2' }}>li</a>
                    : '—'}
                </td>
                <td style={S.td}>
                  {l.facebook
                    ? <a href={l.facebook} target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#1877f2' }}>fb</a>
                    : '—'}
                </td>
                <td style={S.td}>
                  {l.website
                    ? <a href={l.website} target="_blank" rel="noreferrer" style={{ fontSize: 11 }}>site</a>
                    : <span style={{ fontSize: 11, color: '#9ca3af' }}>sem site</span>}
                </td>
                <td style={{ ...S.td, fontSize: 11, color: '#6b7280', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {(l as any).category || '—'}
                </td>
                <td style={{ ...S.td, fontSize: 11, whiteSpace: 'nowrap' }}>
                  {l.rating ? `${l.rating}/5 (${l.reviews})` : '—'}
                </td>
                <td style={S.td}>
                  <span style={{ ...S.badge, background: SOURCE_COLORS[l.source] + '15', color: SOURCE_COLORS[l.source], fontSize: 10 }}>
                    {SOURCE_LABELS[l.source]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div style={S.pagination}>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            style={S.pageBtn}
          >
            ← Anterior
          </button>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            Página {page} de {totalPages} · {filtered.length} leads
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            style={S.pageBtn}
          >
            Próxima →
          </button>
        </div>
      )}
    </section>
  )
}

const S: Record<string, React.CSSProperties> = {
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 20 },
  h2: { fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0 },
  filtersRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, alignItems: 'center' },
  input: {
    padding: '7px 11px', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 12, outline: 'none', width: '100%',
    background: '#fff', color: '#1a1a2e',
  },
  select: {
    padding: '7px 10px', border: '1px solid #d1d5db',
    borderRadius: 8, fontSize: 12, background: '#fff', color: '#1a1a2e', cursor: 'pointer',
  },
  clearBtn: {
    padding: '6px 12px', fontSize: 11, border: '1px solid #fecaca',
    borderRadius: 8, background: '#fef2f2', color: '#dc2626', cursor: 'pointer',
  },
  th: { textAlign: 'left', padding: '8px 10px', fontSize: 11, fontWeight: 700, color: '#9ca3af', whiteSpace: 'nowrap', textTransform: 'uppercase', letterSpacing: '0.04em' },
  td: { padding: '9px 10px', fontSize: 13, verticalAlign: 'middle' },
  badge: { display: 'inline-block', fontSize: 11, padding: '2px 7px', borderRadius: 999, fontWeight: 600 },
  btn: { padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' },
  btnSuccess: { background: '#16a34a', color: '#fff' },
  btnOutline: { background: '#fff', color: '#374151', border: '1px solid #d1d5db' },
  pagination: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 16, paddingTop: 12, borderTop: '1px solid #f3f4f6' },
  pageBtn: { padding: '6px 14px', fontSize: 12, border: '1px solid #d1d5db', borderRadius: 8, background: '#fff', cursor: 'pointer' },
}