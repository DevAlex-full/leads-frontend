import { useState } from 'react'
import { ScrapeConfig, Source } from '../lib/types'
import { CITIES, REGIONS, Region } from '../lib/cities'
import { NICHE_SUGGESTIONS, NICHE_CATEGORIES } from '../lib/niches'

interface Props {
  onStart: (config: ScrapeConfig) => void
  onCancel: () => void
  isRunning: boolean
}

const SOURCES: { id: Source; label: string; icon: string; desc: string }[] = [
  { id: 'google_maps', label: 'Google Maps', icon: '🗺️', desc: 'Negócios físicos, telefone, endereço, avaliação' },
  { id: 'instagram', label: 'Instagram', icon: '📸', desc: 'Perfis por hashtag do nicho' },
  { id: 'linkedin', label: 'LinkedIn', icon: '💼', desc: 'Empresas B2B, responsáveis' },
  { id: 'facebook', label: 'Facebook Pages', icon: '📘', desc: 'Páginas de negócios locais' },
]

export default function ConfigPanel({ onStart, onCancel, isRunning }: Props) {
  const [apiKey, setApiKey] = useState('')
  const [niche, setNiche] = useState('')
  const [nicheInput, setNicheInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCities, setSelectedCities] = useState<Set<string>>(
    new Set(CITIES.filter((c) => c.region === 'Sudeste').map((c) => c.name))
  )
  const [perCity, setPerCity] = useState(15)
  const [sources, setSources] = useState<Set<Source>>(new Set(['google_maps', 'instagram']))
  const [error, setError] = useState('')

  const finalNiche = niche || nicheInput.trim()
  const estimatedLeads = selectedCities.size * perCity

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
    if (!apiKey.trim()) { setError('A API Key da Apify é obrigatória.'); return }
    if (!apiKey.startsWith('apify_api_')) { setError('API Key inválida — deve começar com apify_api_'); return }
    if (!finalNiche) { setError('Informe o nicho que deseja prospectar.'); return }
    if (selectedCities.size === 0) { setError('Selecione ao menos uma cidade.'); return }
    if (sources.size === 0) { setError('Selecione ao menos uma fonte de dados.'); return }

    onStart({
      apiKey: apiKey.trim(),
      niche: finalNiche,
      cities: [...selectedCities],
      perCity,
      sources: [...sources],
    })
  }

  return (
    <section style={S.card}>
      <h2 style={S.h2}>⚙️ Configuração</h2>

      {/* API KEY */}
      <div style={S.field}>
        <label style={S.label}>
          Apify API Key <span style={S.required}>*</span>
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="apify_api_XXXXXXXXXXXXXXXXXXXX"
          style={S.input}
          autoComplete="off"
        />
        <p style={S.hint}>
          Obtenha em{' '}
          <a href="https://console.apify.com/account/integrations" target="_blank" rel="noreferrer">
            console.apify.com → Integrations
          </a>
          {' '}· A chave nunca é armazenada no servidor.
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
            value={niche || nicheInput}
            onChange={(e) => {
              setNiche('')
              setNicheInput(e.target.value)
              setShowSuggestions(e.target.value.length > 0)
            }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Ex: barbearia, clínica estética, pet shop..."
            style={S.input}
          />
          {niche && (
            <button
              onClick={() => { setNiche(''); setNicheInput('') }}
              style={S.clearBtn}
            >✕</button>
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
                      <button
                        key={n.value}
                        style={S.dropItem}
                        onMouseDown={() => { setNiche(n.value); setNicheInput(n.label); setShowSuggestions(false) }}
                      >
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
        <p style={S.hint}>Selecione uma sugestão ou digite qualquer nicho personalizado.</p>
      </div>

      {/* FONTES */}
      <div style={S.field}>
        <label style={S.label}>Fontes de dados</label>
        <div style={S.sourcesGrid}>
          {SOURCES.map((src) => (
            <label
              key={src.id}
              style={{
                ...S.sourceCard,
                ...(sources.has(src.id) ? S.sourceCardActive : {}),
              }}
            >
              <input
                type="checkbox"
                checked={sources.has(src.id)}
                onChange={() => toggleSource(src.id)}
                style={{ display: 'none' }}
              />
              <span style={{ fontSize: 22 }}>{src.icon}</span>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13 }}>{src.label}</p>
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>{src.desc}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* LEADS POR CIDADE */}
      <div style={S.field}>
        <label style={S.label}>
          Leads por cidade: <strong>{perCity}</strong>
          <span style={{ ...S.hint, display: 'inline', marginLeft: 8 }}>
            (estimativa: ~{estimatedLeads} leads · custo ~$
            {((estimatedLeads / 1000) * 0.5 * sources.size).toFixed(2)} USD)
          </span>
        </label>
        <input
          type="range"
          min={5}
          max={100}
          step={5}
          value={perCity}
          onChange={(e) => setPerCity(Number(e.target.value))}
          style={{ width: '100%', maxWidth: 340 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: 340, fontSize: 11, color: '#9ca3af' }}>
          <span>5 (rápido)</span>
          <span>50 (padrão)</span>
          <span>100 (completo)</span>
        </div>
      </div>

      {/* CIDADES */}
      <div style={S.field}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <label style={S.label}>
            Cidades ({selectedCities.size}/{CITIES.length})
          </label>
          <button onClick={() => setSelectedCities(new Set(CITIES.map((c) => c.name)))} style={S.chip}>
            Todas
          </button>
          <button onClick={() => setSelectedCities(new Set())} style={S.chip}>
            Nenhuma
          </button>
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
                    <label
                      key={c.name}
                      style={{
                        ...S.cityPill,
                        ...(selectedCities.has(c.name) ? S.cityPillActive : {}),
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedCities.has(c.name)}
                        onChange={() => toggleCity(c.name)}
                        style={{ display: 'none' }}
                      />
                      {c.name} · {c.state}
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ERRO */}
      {error && <div style={S.errorBox}>{error}</div>}

      {/* AÇÕES */}
      <div style={S.actions}>
        {!isRunning ? (
          <button onClick={handleSubmit} style={{ ...S.btn, ...S.btnPrimary }}>
            🚀 Iniciar scraping
          </button>
        ) : (
          <button onClick={onCancel} style={{ ...S.btn, ...S.btnDanger }}>
            ✕ Cancelar scraping
          </button>
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
  input: {
    width: '100%', maxWidth: 480, padding: '9px 12px',
    border: '1px solid #d1d5db', borderRadius: 8,
    fontSize: 13, outline: 'none', background: '#fff', color: '#1a1a2e',
  },
  clearBtn: {
    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
    background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 14, padding: '2px 6px',
  },
  dropdown: {
    position: 'absolute', zIndex: 100, left: 0, right: 0, maxWidth: 480,
    top: '100%', marginTop: 4,
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    maxHeight: 320, overflowY: 'auto',
  },
  dropCat: {
    fontSize: 10, fontWeight: 700, color: '#9ca3af', padding: '8px 12px 4px',
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  dropItem: {
    display: 'flex', alignItems: 'center', gap: 10,
    width: '100%', padding: '8px 12px', background: 'none',
    border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: 13,
    color: '#1a1a2e',
  },
  sourcesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 },
  sourceCard: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '12px 14px', border: '1.5px solid #e5e7eb',
    borderRadius: 10, cursor: 'pointer', background: '#fff', userSelect: 'none',
  },
  sourceCardActive: { borderColor: '#2563eb', background: '#eff6ff' },
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
  errorBox: {
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 12,
  },
}
