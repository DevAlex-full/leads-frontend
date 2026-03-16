import { useState, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { Lead, Source, Priority } from '../lib/types'
import { useBreakpoint } from '../lib/useBreakpoint'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

interface Props { leads: Lead[]; jobId: string; niche: string }

const SRC_LABEL: Record<Source, string> = { google_maps: 'Maps', instagram: 'Insta', linkedin: 'LinkedIn', facebook: 'Facebook' }
const SRC_COLOR: Record<Source, string> = { google_maps: '#EA4335', instagram: '#E1306C', linkedin: '#0A66C2', facebook: '#1877F2' }
const PER_PAGE = 25

export default function LeadsTable({ leads, jobId, niche }: Props) {
  const { data: session } = useSession()
  const token = session?.token || ''
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'

  // Filtros
  const [search,         setSearch]         = useState('')
  const [filterCity,     setFilterCity]      = useState('')
  const [filterSource,   setFilterSource]    = useState<Source | ''>('')
  const [filterPriority, setFilterPriority]  = useState<Priority | ''>('')
  const [filterNiche,    setFilterNiche]     = useState('')
  const [filterHasEmail, setFilterHasEmail]  = useState(false)
  const [filterHasInsta, setFilterHasInsta]  = useState(false)
  const [filterHasWA,    setFilterHasWA]     = useState(false)

  // Seleção
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [page, setPage] = useState(1)
  const [downloading, setDownloading] = useState<string | null>(null)

  const cities  = useMemo(() => [...new Set(leads.map(l => l.city).filter(Boolean))].sort(), [leads])
  const sources = useMemo(() => [...new Set(leads.map(l => l.source))], [leads])
  const niches  = useMemo(() => [...new Set(leads.map(l => l.niche).filter(Boolean))].sort(), [leads])

  // ── Filtragem ────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return leads.filter((l, idx) => {
      if (filterCity     && l.city !== filterCity) return false
      if (filterSource   && l.source !== filterSource) return false
      if (filterPriority && l.priority !== filterPriority) return false
      if (filterNiche    && l.niche !== filterNiche) return false
      if (filterHasEmail && !l.email) return false
      if (filterHasInsta && !l.instagram) return false
      if (filterHasWA    && !(l as Lead & { whatsapp?: string }).whatsapp) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          l.name.toLowerCase().includes(q) ||
          (l.city || '').toLowerCase().includes(q) ||
          (l.phone || '').includes(q) ||
          (l.email || '').toLowerCase().includes(q) ||
          (l.instagram || '').toLowerCase().includes(q) ||
          (l.niche || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [leads, filterCity, filterSource, filterPriority, filterNiche, filterHasEmail, filterHasInsta, filterHasWA, search])

  const totalPages = Math.ceil(filtered.length / PER_PAGE)
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  function resetFilters() {
    setSearch(''); setFilterCity(''); setFilterSource(''); setFilterPriority('')
    setFilterNiche(''); setFilterHasEmail(false); setFilterHasInsta(false); setFilterHasWA(false)
    setPage(1); setSelected(new Set())
  }

  // ── Seleção ───────────────────────────────────────────────────────
  function toggleRow(idx: number) {
    setSelected(prev => { const n = new Set(prev); n.has(idx) ? n.delete(idx) : n.add(idx); return n })
  }
  function toggleAll() {
    const allIdxs = filtered.map((_, i) => i)
    const allSelected = allIdxs.every(i => selected.has(i))
    if (allSelected) setSelected(new Set())
    else setSelected(new Set(allIdxs))
  }
  const selectedLeads = selected.size > 0
    ? filtered.filter((_, i) => selected.has(i))
    : filtered

  // ── Download ──────────────────────────────────────────────────────
  async function handleDownload(format: 'md' | 'csv', onlySelected = false) {
    const key = onlySelected ? `sel_${format}` : format
    setDownloading(key)
    try {
      const leadsToExport = onlySelected ? selectedLeads : filtered
      // Envia os leads diretamente para o backend gerar o arquivo
      const res = await fetch(
        `${API_URL}/api/scrape/download/${jobId}?format=${format}&niche=${encodeURIComponent(niche)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!res.ok) throw new Error('Erro ao baixar.')
      const blob = await res.blob()

      // Se for seleção parcial, filtra o conteúdo no client
      if (onlySelected && format === 'csv') {
        const text = await blob.text()
        const lines = text.split('\n')
        const header = lines[0]
        const names = new Set(leadsToExport.map(l => l.name))
        const filteredLines = lines.filter((line, i) => i === 0 || names.has(line.split(',')[0]?.replace(/"/g, '')))
        const filteredBlob = new Blob([filteredLines.join('\n')], { type: 'text/csv' })
        triggerDownload(filteredBlob, `leads_selecionados.${format}`)
      } else {
        triggerDownload(blob, `leads_${niche.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.${format}`)
      }
    } catch { alert('Erro ao baixar. Tente novamente.') }
    finally { setDownloading(null) }
  }

  function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  const hasFilters = filterCity || filterSource || filterPriority || filterNiche || search || filterHasEmail || filterHasInsta || filterHasWA

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-sm)', marginBottom: 20, overflow: 'hidden' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--gray-100)', flexWrap: 'wrap', gap: 10 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--navy)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            Leads encontrados
            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--gray-400)', background: 'var(--gray-100)', padding: '2px 10px', borderRadius: 999 }}>
              {selected.size > 0 ? `${selected.size} selecionados de ` : ''}{filtered.length} de {leads.length}
            </span>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {selected.size > 0 && (
            <>
              <button onClick={() => handleDownload('md', true)} disabled={downloading === 'sel_md'} style={{ ...S.dlBtn, background: '#F0FDF4', color: '#16a34a', borderColor: '#A7F3D0' }}>
                {downloading === 'sel_md' ? '...' : `↓ Selecionados .md (${selected.size})`}
              </button>
              <button onClick={() => handleDownload('csv', true)} disabled={downloading === 'sel_csv'} style={{ ...S.dlBtn, background: '#EEF0FB', color: 'var(--indigo)', borderColor: 'var(--indigo-light)' }}>
                {downloading === 'sel_csv' ? '...' : `↓ Selecionados .csv (${selected.size})`}
              </button>
            </>
          )}
          <button onClick={() => handleDownload('md')} disabled={!!downloading} style={{ ...S.dlBtn, background: 'var(--green-light)', color: 'var(--green)', borderColor: '#A7F3D0' }}>
            {downloading === 'md' ? '...' : '↓ Todos .md'}
          </button>
          <button onClick={() => handleDownload('csv')} disabled={!!downloading} style={{ ...S.dlBtn, background: 'var(--indigo-pale)', color: 'var(--indigo)', borderColor: 'var(--indigo-light)' }}>
            {downloading === 'csv' ? '...' : '↓ Todos .csv'}
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div style={{ padding: '12px 20px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-100)' }}>
        {/* Linha 1 — busca + dropdowns */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <input
            type="text" placeholder="Buscar por nome, cidade, @instagram, email..."
            value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
            style={{ flex: 1, minWidth: 200, ...S.filterInput }}
          />
          <select value={filterCity} onChange={e => { setFilterCity(e.target.value); setPage(1) }} style={S.select}>
            <option value="">Todas as cidades</option>
            {cities.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filterSource} onChange={e => { setFilterSource(e.target.value as Source | ''); setPage(1) }} style={S.select}>
            <option value="">Todas as fontes</option>
            {sources.map(s => <option key={s} value={s}>{SRC_LABEL[s]}</option>)}
          </select>
          {niches.length > 1 && (
            <select value={filterNiche} onChange={e => { setFilterNiche(e.target.value); setPage(1) }} style={S.select}>
              <option value="">Todos os nichos</option>
              {niches.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          )}
          <select value={filterPriority} onChange={e => { setFilterPriority(e.target.value as Priority | ''); setPage(1) }} style={S.select}>
            <option value="">Prioridade</option>
            <option value="high">🔥 Sem site</option>
            <option value="normal">Com site</option>
          </select>
        </div>

        {/* Linha 2 — filtros rápidos por campo */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600 }}>Apenas com:</span>
          {[
            { label: '✉ E-mail',    state: filterHasEmail, set: setFilterHasEmail },
            { label: '📷 Instagram', state: filterHasInsta, set: setFilterHasInsta },
            { label: '💬 WhatsApp',  state: filterHasWA,    set: setFilterHasWA    },
          ].map(f => (
            <button key={f.label} onClick={() => { f.set(!f.state); setPage(1) }} style={{
              fontSize: 11, fontWeight: 600, padding: '4px 10px',
              borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font)',
              background: f.state ? 'var(--indigo-pale)' : 'var(--white)',
              color: f.state ? 'var(--indigo)' : 'var(--gray-500)',
              border: `1px solid ${f.state ? 'var(--indigo-light)' : 'var(--gray-200)'}`,
            }}>{f.label}</button>
          ))}
          {hasFilters && (
            <button onClick={resetFilters} style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, cursor: 'pointer', background: 'var(--red-light)', color: 'var(--red)', border: '1px solid #FECACA', fontFamily: 'var(--font)' }}>
              × Limpar filtros
            </button>
          )}
          {selected.size > 0 && (
            <button onClick={() => setSelected(new Set())} style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 999, cursor: 'pointer', background: 'var(--gray-100)', color: 'var(--gray-500)', border: '1px solid var(--gray-200)', fontFamily: 'var(--font)' }}>
              Desmarcar todos
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--gray-100)', background: 'var(--gray-50)' }}>
              {/* Checkbox selecionar todos */}
              <th style={{ ...S.th, width: 40 }}>
                <input type="checkbox"
                  checked={filtered.length > 0 && filtered.every((_, i) => selected.has(i))}
                  onChange={toggleAll}
                  style={{ cursor: 'pointer', width: 14, height: 14 }}
                />
              </th>
              {['', 'Nome', 'Cidade/UF', 'Telefone', 'E-mail', 'WhatsApp', 'Instagram', 'LinkedIn', 'Facebook', 'Site', 'Nicho', 'Nota', 'Fonte'].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 && (
              <tr><td colSpan={14} style={{ textAlign: 'center', padding: '32px', color: 'var(--gray-400)', fontSize: 13 }}>
                Nenhum lead encontrado com esses filtros.
              </td></tr>
            )}
            {paginated.map((l, pageIdx) => {
              const globalIdx = (page - 1) * PER_PAGE + pageIdx
              const isChecked = selected.has(globalIdx)
              const wa = (l as Lead & { whatsapp?: string }).whatsapp
              return (
                <tr key={pageIdx} style={{
                  borderBottom: '1px solid var(--gray-50)',
                  background: isChecked ? 'var(--indigo-pale)' : l.priority === 'high' ? 'rgba(14,159,110,0.03)' : 'var(--white)',
                  transition: 'background 0.1s',
                }}>
                  {/* Checkbox */}
                  <td style={{ ...S.td, textAlign: 'center' }}>
                    <input type="checkbox" checked={isChecked} onChange={() => toggleRow(globalIdx)}
                      style={{ cursor: 'pointer', width: 14, height: 14 }} />
                  </td>
                  <td style={S.td}>
                    {l.priority === 'high' ? <span title="Sem site — lead quente">🔥</span> : <span style={{ color: 'var(--gray-300)' }}>—</span>}
                  </td>
                  <td style={{ ...S.td, fontWeight: 600, maxWidth: 160, wordBreak: 'break-word', color: 'var(--navy)' }}>{l.name}</td>
                  <td style={{ ...S.td, fontSize: 12, whiteSpace: 'nowrap' }}>{[l.city, l.state].filter(Boolean).join('/') || '—'}</td>
                  <td style={{ ...S.td, fontSize: 12 }}>{l.phone || '—'}</td>
                  <td style={{ ...S.td, fontSize: 11 }}>
                    {l.email ? <a href={`mailto:${l.email}`} style={S.link}>{l.email}</a> : '—'}
                  </td>
                  <td style={S.td}>
                    {wa
                      ? <a href={wa} target="_blank" rel="noreferrer" style={{ ...S.link, color: '#25D366', fontWeight: 700, fontSize: 12 }}>WhatsApp</a>
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
                      : <span style={{ fontSize: 11, color: 'var(--gray-300)', fontStyle: 'italic' }}>sem site</span>}
                  </td>
                  <td style={{ ...S.td, fontSize: 11, color: 'var(--indigo)', fontWeight: 600 }}>{l.niche || '—'}</td>
                  <td style={{ ...S.td, fontSize: 11, whiteSpace: 'nowrap' }}>
                    {l.rating ? <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', background: 'var(--yellow-light)', color: 'var(--yellow)', borderRadius: 999 }}>{l.rating}/5</span> : '—'}
                  </td>
                  <td style={S.td}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: SRC_COLOR[l.source] + '18', color: SRC_COLOR[l.source] }}>
                      {SRC_LABEL[l.source]}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '14px', borderTop: '1px solid var(--gray-100)', flexWrap: 'wrap' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={S.pageBtn}>← Anterior</button>
          <span style={{ fontSize: 12, color: 'var(--gray-400)' }}>Página {page} de {totalPages} · {filtered.length} leads</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={S.pageBtn}>Próxima →</button>
        </div>
      )}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  th: { textAlign: 'left', padding: '10px 10px', fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.6px', whiteSpace: 'nowrap' },
  td: { padding: '10px 10px', fontSize: 13, verticalAlign: 'middle' },
  link: { color: 'var(--indigo)', textDecoration: 'none', fontWeight: 500 },
  dlBtn: { fontSize: 12, fontWeight: 600, padding: '7px 14px', border: '1px solid', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'var(--font)', whiteSpace: 'nowrap' },
  filterInput: { padding: '8px 12px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'var(--font)', color: 'var(--navy)', background: 'var(--white)', outline: 'none' },
  select: { padding: '8px 10px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', fontSize: 12, fontFamily: 'var(--font)', background: 'var(--white)', color: 'var(--navy)', cursor: 'pointer' },
  pageBtn: { fontSize: 12, fontWeight: 500, padding: '6px 14px', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-sm)', background: 'var(--white)', cursor: 'pointer', color: 'var(--navy)', fontFamily: 'var(--font)' },
}