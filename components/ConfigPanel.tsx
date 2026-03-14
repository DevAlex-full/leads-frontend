import { useState, useEffect } from 'react'
import { ScrapeConfig, Source, SiteFilter } from '../lib/types'
import { CITIES, REGIONS, Region } from '../lib/cities'
import { NICHE_SUGGESTIONS, NICHE_CATEGORIES } from '../lib/niches'

interface Props {
  onStart: (config: ScrapeConfig) => void
  onCancel: () => void
  isRunning: boolean
}

const SOURCES: { id: Source; label: string; icon: string; desc: string }[] = [
  { id: 'google_maps', label: 'Google Maps', icon: 'G', desc: 'Negocios fisicos, telefone, endereco, avaliacao' },
  { id: 'instagram', label: 'Instagram', icon: 'I', desc: 'Perfis por hashtag do nicho' },
  { id: 'linkedin', label: 'LinkedIn', icon: 'L', desc: 'Empresas B2B, responsaveis' },
  { id: 'facebook', label: 'Facebook Pages', icon: 'F', desc: 'Paginas de negocios locais' },
]

const SITE_FILTERS: { id: SiteFilter; label: string; desc: string; color: string }[] = [
  { id: 'all', label: 'Todos', desc: 'Com e sem site', color: '#6b7280' },
  { id: 'without_site', label: 'Sem site', desc: 'Leads mais quentes', color: '#16a34a' },
  { id: 'with_site', label: 'Com site', desc: 'Ja tem presenca online', color: '#2563eb' },
]

const STORAGE_KEY = 'leads_apify_key'

export default function ConfigPanel({ onStart, onCancel, isRunning }: Props) {
  const [apiKey, setApiKey] = useState('')
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [niche, setNiche] = useState('')
  const [nicheInput, setNicheInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCities, setSelectedCities] = useState<Set<string>>(
    new Set(CITIES.filter((c) => c.region === 'Sudeste').map((c) => c.name))
  )
  const [perCity, setPerCity] = useState(15)
  // CORRIGIDO: era new Set(['google_maps', 'instagram']) — TypeScript error
  const [sources, setSources] = useState<Set<Source>>(new Set<Source>(['google_maps', 'instagram']))
  const [siteFilter, setSiteFilter] = useState<SiteFilter>('all')
  const [error, setError] = useState('')

  const finalNiche = niche || nicheInput.trim()
  const estimatedLeads = selectedCities.size * perCity

  // Carrega API Key salva ao montar o componente
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setApiKey(atob(saved))
        setApiKeySaved(true)
      }
    } catch {
      // ignora erro de localStorage
    }
  }, [])

  function saveApiKey(key: string) {
    try {
      localStorage.setItem(STORAGE_KEY, btoa(key))
      setApiKeySaved(true)
    } catch {
      // ignora
    }
  }

  function clearApiKey() {
    try {
      localStorage.removeItem(STORAGE_KEY)
      setApiKey('')
      setApiKeySaved(false)
    } catch {
      // ignora
    }
  }

  function toggleCity(name: string) {
    setSelectedCities((prev) => {
      const next = new Set(prev)
      next.has(name) ? next.delete(name) : next.add(name)
      return next
    })
  }

  function selectRegion(region: Region) {
    const regionCities = CITIES.filter((c) => c.region === region).map((c) => c.name)
    setSelectedCities((prev) => {
      const next = new Set(prev)
      regionCities.forEach((c) => next.add(c))
      return next
    })
  }

  function clearRegion(region: Region) {
    const regionCities = CITIES.filter((c) => c.region === region).map((c) => c.name)
    setSelectedCities((prev) => {
      const next = new Set(prev)
      regionCities.forEach((c) => next.delete(c))
      return next
    })
  }

  function toggleSource(s: Source) {
    setSources((prev) => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  function handleSubmit() {
    setError('')
    if (!apiKey.trim()) { setError('A API Key da Apify e obrigatoria.'); return }
    if (!apiKey.startsWith('apify_api_')) { setError('API Key invalida — deve comecar com apify_api_'); return }
    if (!finalNiche) { setError('Informe o nicho que deseja prospectar.'); return }
    if (selectedCities.size === 0) { setError('Selecione ao menos uma cidade.'); return }
    if (sources.size === 0) { setError('Selecione ao menos uma fonte de dados.'); return }

    // Salva a API Key no localStorage para proximas sessoes
    saveApiKey(apiKey.trim())

    onStart({
      apiKey: apiKey.trim(),
      niche: finalNiche,
      cities: Array.from(selectedCities),
      perCity,
      sources: Array.from(sources),
      siteFilter,
    })
  }

  return (
    <section style={S.card}>
      <h2 style={S.h2}>Configuracao</h2>

      {/* API KEY */}
      <div style={S.field}>
        <label style={S.label}>
          Apify API Key <span style={S.required}>*</span>
        </label>
        {apiKeySaved && (
          <div style={S.savedBadge}>
            Chave salva — ela sera mantida apos recarregar a pagina
            <button onClick={clearApiKey} style={S.clearKeyBtn}>Trocar chave</button>
          </div>
        )}
        <input
          type="password"
          value={apiKey}
          onChange={(e) => { setApiKey(e.target.value); setApiKeySaved(false) }}
          placeholder="apify_api_XXXXXXXXXXXXXXXXXXXX"
          style={S.input}
          autoComplete="off"
        />
        <p style={S.hint}>
          Obtenha em{' '}
          <a href="https://console.apify.com/account/integrations" target="_blank" rel="noreferrer">
            console.apify.com
          </a>
          {' '}· Salva automaticamente apos o primeiro uso.
        </p>
      </div>

      {/* NICHO */}
      <div style={S.field}>
        <label style={S.label}>
          Nicho / Segmento <span style={S.required}>*</span>
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={niche ? nicheInput : nicheInput}
            onChange={(e) => { setNiche(''); setNicheInput(e.target.value); setShowSuggestions(e.target.value.length > 0) }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Ex: barbearia, clinica estetica, pet shop..."
            style={S.input}
          />
          {niche && (
            <button onClick={() => { setNiche(''); setNicheInput('') }} style={S.clearBtn}>x</button>
          )}
          {showSuggestions && (
            <div style={S.dropdown}>
              {NICHE_CATEGORIES.map((cat) => {
                const items = NICHE_SUGGESTIONS.filter((n) => n.category === cat &&
                  (!nicheInput || n.label.toLowerCase().includes(nicheInput.toLowerCase()))
                )
                if (!items.length) return null
                return (
                  <div key={cat}>
                    <p style={S.dropCat}>{cat}</p>
                    {items.map((n) => (
                      <button key={n.value} style={S.dropItem}
                        onMouseDown={() => { setNiche(n.value); setNicheInput(n.label); setShowSuggestions(false) }}>
                        <span style={{ fontSize: 16 }}>{n.icon}</span>
                        <span style={{ fontWeight: 500 }}>{n.label}</span>
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
        </div>
        <p style={S.hint}>Selecione uma sugestao ou digite qualquer nicho personalizado.</p>
      </div>

      {/* FONTES */}
      <div style={S.field}>
        <label style={S.label}>Fontes de dados</label>
        <div style={S.sourcesGrid}>
          {SOURCES.map((src) => (
            <label key={src.id} style={{ ...S.sourceCard, ...(sources.has(src.id) ? S.sourceCardActive : {}) }}>
              <input type="checkbox" checked={sources.has(src.id)} onChange={() => toggleSource(src.id)} style={{ display: 'none' }} />
              <span style={S.sourceIcon}>{src.icon}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{src.label}</p>
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{src.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* FILTRO DE SITE */}
      <div style={S.field}>
        <label style={S.label}>Filtrar por site</label>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {SITE_FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setSiteFilter(f.id)}
              style={{
                ...S.siteFilterBtn,
                ...(siteFilter === f.id
                  ? { borderColor: f.color, background: f.color + '15', color: f.color, fontWeight: 700 }
                  : {}),
              }}
            >
              {f.label}
              <span style={{ fontSize: 11, opacity: 0.7, marginLeft: 6 }}>{f.desc}</span>
            </button>
          ))}
        </div>
        <p style={S.hint}>
          {siteFilter === 'without_site' && '🔥 Ideal para vender seu SaaS — negocios sem presenca digital'}
          {siteFilter === 'with_site' && '🌐 Ja tem site — pode nao ter sistema de agendamento integrado'}
          {siteFilter === 'all' && 'Todos os leads independente de ter site ou nao'}
        </p>
      </div>

      {/* LEADS POR CIDADE */}
      <div style={S.field}>
        <label style={S.label}>
          Leads por cidade: <strong>{perCity}</strong>
          <span style={{ ...S.hint, display: 'inline', marginLeft: 8 }}>
            (estimativa: ~{estimatedLeads} leads · custo ~${((estimatedLeads / 1000) * 0.5 * sources.size).toFixed(2)} USD)
          </span>
        </label>
        <input
          type="range" min={5} max={100} step={5} value={perCity}
          onChange={(e) => setPerCity(Number(e.target.value))}
          style={{ width: '100%', maxWidth: 340 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 340, fontSize: 11, color: '#9ca3af' }}>
          <span>5 (rapido)</span><span>50 (padrao)</span><span>100 (completo)</span>
        </div>
      </div>

      {/* CIDADES */}
      <div style={S.field}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <label style={S.label}>Cidades ({selectedCities.size}/{CITIES.length})</label>
          <button onClick={() => setSelectedCities(new Set(CITIES.map((c) => c.name)))} style={S.chip}>Todas</button>
          <button onClick={() => setSelectedCities(new Set())} style={S.chip}>Nenhuma</button>
          {REGIONS.map((r) => (
            <button key={r} onClick={() => selectRegion(r)} style={S.chip}>{r}</button>
          ))}
        </div>
        <div>
          {REGIONS.map((region) => {
            const regionCities = CITIES.filter((c) => c.region === region)
            const selectedCount = regionCities.filter((c) => selectedCities.has(c.name)).length
            return (
              <div key={region} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#374151' }}>{region}</span>
                  <span style={{ fontSize: 10, color: '#9ca3af' }}>({selectedCount}/{regionCities.length})</span>
                  <button onClick={() => clearRegion(region)} style={{ ...S.chip, fontSize: 10 }}>limpar</button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {regionCities.map((c) => (
                    <label key={c.name} style={{ ...S.cityPill, ...(selectedCities.has(c.name) ? S.cityPillActive : {}) }}>
                      <input type="checkbox" checked={selectedCities.has(c.name)} onChange={() => toggleCity(c.name)} style={{ display: 'none' }} />
                      {c.name} · {c.state}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {error && <div style={S.errorBox}>{error}</div>}

      <div style={S.actions}>
        {!isRunning ? (
          <button onClick={handleSubmit} style={{ ...S.btn, ...S.btnPrimary }}>Iniciar scraping</button>
        ) : (
          <button onClick={onCancel} style={{ ...S.btn, ...S.btnDanger }}>Cancelar scraping</button>
        )}
      </div>
    </section>
  )
}

const S: Record<string, React.CSSProperties> = {
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 20 },
  h2: { fontSize: 16, fontWeight: 700, marginBottom: 18, color: '#1a1a2e' },
  field: { marginBottom: 20 },
  label: { display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#374151' },
  required: { color: '#dc2626' },
  hint: { fontSize: 11, color: '#9ca3af', marginTop: 4 },
  savedBadge: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 8, padding: '6px 12px',
    fontSize: 12, color: '#15803d', marginBottom: 8,
  },
  clearKeyBtn: {
    fontSize: 11, padding: '2px 10px',
    border: '1px solid #16a34a', borderRadius: 6,
    background: '#fff', color: '#16a34a', cursor: 'pointer', marginLeft: 'auto',
  },
  input: {
    width: '100%', maxWidth: 480, padding: '9px 12px',
    border: '1px solid #d1d5db', borderRadius: 8,
    fontSize: 13, outline: 'none', background: '#fff',
    color: '#1a1a2e', boxSizing: 'border-box' as const,
  },
  clearBtn: {
    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 14,
  },
  dropdown: {
    position: 'absolute', zIndex: 100, left: 0, right: 0, maxWidth: 480,
    top: '100%', marginTop: 4, background: '#fff',
    border: '1px solid #e5e7eb', borderRadius: 10,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)', maxHeight: 320, overflowY: 'auto',
  },
  dropCat: {
    fontSize: 10, fontWeight: 700, color: '#9ca3af', padding: '8px 12px 4px',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  dropItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '8px 12px', background: 'none',
    border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13, color: '#1a1a2e',
  },
  sourcesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 },
  sourceCard: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '12px 14px', border: '1.5px solid #e5e7eb',
    borderRadius: 10, cursor: 'pointer', background: '#fff', userSelect: 'none',
  },
  sourceCardActive: { borderColor: '#2563eb', background: '#eff6ff' },
  sourceIcon: {
    width: 32, height: 32, borderRadius: 8,
    background: '#f3f4f6', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 700, fontSize: 14,
    color: '#374151', flexShrink: 0,
  },
  chip: {
    padding: '2px 10px', fontSize: 11, border: '1px solid #d1d5db',
    borderRadius: 999, background: '#fff', color: '#6b7280', cursor: 'pointer',
  },
  cityPill: {
    padding: '3px 9px', border: '1px solid #e5e7eb', borderRadius: 999,
    fontSize: 11, color: '#6b7280', cursor: 'pointer', userSelect: 'none',
  },
  cityPillActive: { background: '#eff6ff', borderColor: '#3b82f6', color: '#1d4ed8' },
  actions: { display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 24 },
  btn: { padding: '10px 24px', borderRadius: 8, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer' },
  btnPrimary: { background: '#2563eb', color: '#fff' },
  btnDanger: { background: '#dc2626', color: '#fff' },
  siteFilterBtn: {
    display: 'flex', alignItems: 'center',
    padding: '8px 16px', border: '1.5px solid #e5e7eb',
    borderRadius: 8, background: '#fff', cursor: 'pointer',
    fontSize: 13, color: '#374151', fontWeight: 500,
    transition: 'all 0.15s',
  },
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 12,
  },
}