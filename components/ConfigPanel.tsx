import { useState, useEffect } from 'react'
import { ScrapeConfig, Source, SiteFilter } from '../lib/types'
import { CITIES, REGIONS, Region } from '../lib/cities'
import { NICHE_SUGGESTIONS, NICHE_CATEGORIES } from '../lib/niches'
import { useBreakpoint } from '../lib/useBreakpoint'

interface Props {
  onStart: (config: ScrapeConfig) => void
  onCancel: () => void
  isRunning: boolean
}

const SOURCES: { id: Source; label: string; color: string; desc: string }[] = [
  { id: 'google_maps', label: 'Google Maps', color: '#EA4335', desc: 'Negócios físicos com telefone e endereço' },
  { id: 'instagram',   label: 'Instagram',   color: '#E1306C', desc: 'Perfis por hashtag do nicho' },
  { id: 'linkedin',    label: 'LinkedIn',     color: '#0A66C2', desc: 'Empresas B2B e responsáveis' },
  { id: 'facebook',    label: 'Facebook',     color: '#1877F2', desc: 'Páginas de negócios locais' },
]

const SITE_FILTERS: { id: SiteFilter; label: string; desc: string; color: string }[] = [
  { id: 'all',          label: 'Todos os leads', desc: 'Com e sem site',       color: 'var(--gray-600)' },
  { id: 'without_site', label: 'Sem site',        desc: 'Leads mais quentes',  color: 'var(--green)'    },
  { id: 'with_site',    label: 'Com site',         desc: 'Já têm presença',    color: 'var(--indigo)'   },
]

const MAX_NICHES = 3
const STORAGE_KEY = 'lf_apikey'

export default function ConfigPanel({ onStart, onCancel, isRunning }: Props) {
  const bp = useBreakpoint()
  const isMobile  = bp === 'mobile'
  const isDesktop = bp === 'desktop'

  const [apiKey,      setApiKey]      = useState('')
  const [apiKeySaved, setApiKeySaved] = useState(false)
  const [niches,      setNiches]      = useState<string[]>([])
  const [nicheInput,  setNicheInput]  = useState('')
  const [showSugg,    setShowSugg]    = useState(false)
  const [siteFilter,  setSiteFilter]  = useState<SiteFilter>('all')
  const [selectedCities, setSelectedCities] = useState<Set<string>>(
    new Set(CITIES.filter(c => c.region === 'Sudeste').map(c => c.name))
  )
  const [perCity,  setPerCity]  = useState(15)
  const [sources,  setSources]  = useState<Set<Source>>(new Set<Source>(['google_maps', 'instagram']))
  const [requiredFields, setRequiredFields] = useState<Set<string>>(new Set())
  const [error,          setError]          = useState('')

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) { setApiKey(atob(saved)); setApiKeySaved(true) }
    } catch {}
  }, [])

  function saveApiKey(k: string) {
    try { localStorage.setItem(STORAGE_KEY, btoa(k)); setApiKeySaved(true) } catch {}
  }
  function clearApiKey() {
    try { localStorage.removeItem(STORAGE_KEY); setApiKey(''); setApiKeySaved(false) } catch {}
  }

  // ── Nicho ────────────────────────────────────────────────────────
  function addNiche(value: string) {
    const v = value.trim()
    if (!v || niches.includes(v) || niches.length >= MAX_NICHES) return
    setNiches(prev => [...prev, v])
    setNicheInput('')
    setShowSugg(false)
  }
  function removeNiche(n: string) { setNiches(prev => prev.filter(x => x !== n)) }
  function handleNicheKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && nicheInput.trim()) {
      e.preventDefault()
      addNiche(nicheInput)
    }
    if (e.key === 'Backspace' && !nicheInput && niches.length) {
      setNiches(prev => prev.slice(0, -1))
    }
  }

  // ── Cidades ───────────────────────────────────────────────────────
  function toggleCity(name: string) {
    setSelectedCities(prev => { const n = new Set(prev); n.has(name) ? n.delete(name) : n.add(name); return n })
  }
  function selectRegion(r: Region) {
    const rc = CITIES.filter(c => c.region === r).map(c => c.name)
    setSelectedCities(prev => { const n = new Set(prev); rc.forEach(c => n.add(c)); return n })
  }
  function clearRegion(r: Region) {
    const rc = CITIES.filter(c => c.region === r).map(c => c.name)
    setSelectedCities(prev => { const n = new Set(prev); rc.forEach(c => n.delete(c)); return n })
  }
  function toggleSource(s: Source) {
    setSources(prev => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n })
  }

  const estimated = selectedCities.size * perCity * niches.length

  function handleSubmit() {
    setError('')
    if (!apiKey.trim()) { setError('A Apify API Key é obrigatória.'); return }
    if (!apiKey.startsWith('apify_api_')) { setError('API Key inválida — deve começar com apify_api_'); return }
    if (!niches.length) { setError('Adicione ao menos 1 nicho.'); return }
    if (selectedCities.size === 0) { setError('Selecione ao menos uma cidade.'); return }
    if (sources.size === 0) { setError('Selecione ao menos uma fonte de dados.'); return }
    saveApiKey(apiKey.trim())
    // Filtro de campos obrigatórios aplicado após o scraping (no onStart)
    onStart({
      apiKey: apiKey.trim(),
      niches,
      cities: Array.from(selectedCities),
      perCity,
      sources: Array.from(sources),
      siteFilter,
      requiredFields: requiredFields.size > 0 ? Array.from(requiredFields) : undefined,
    })
  }


  const filteredSugg = NICHE_SUGGESTIONS.filter(n =>
    (!nicheInput || n.label.toLowerCase().includes(nicheInput.toLowerCase())) &&
    !niches.includes(n.value)
  )

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', marginBottom: 20, boxShadow: 'var(--shadow-sm)', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: isMobile ? '16px 16px 0' : '22px 28px 0', marginBottom: 20 }}>
        <h2 style={{ fontSize: isMobile ? 16 : 17, fontWeight: 700, color: 'var(--navy)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>Configurar busca</h2>
        <p style={{ fontSize: 13, color: 'var(--gray-400)', margin: 0 }}>Configure os parâmetros e inicie o scraping de leads</p>
      </div>

      {/* Body 2 colunas no desktop */}
      <div style={{ display: 'grid', gridTemplateColumns: isDesktop ? '1fr 1fr' : '1fr', gap: isDesktop ? 28 : 0, padding: isMobile ? '0 16px' : '0 28px' }}>
        {/* LEFT */}
        <div>
          {/* API KEY */}
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Apify API Key <span style={{ color: 'var(--red)' }}>*</span></label>
            {apiKeySaved && (
              <div style={S.savedBanner}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--green)' }}>Chave salva e protegida</span>
                </div>
                <button onClick={clearApiKey} style={S.microBtn}>Trocar</button>
              </div>
            )}
            <input type="password" value={apiKey} onChange={e => { setApiKey(e.target.value); setApiKeySaved(false) }}
              placeholder="apify_api_XXXXXXXXXXXXXXXXXXXX" style={S.input} autoComplete="off" />
            <p style={S.hint}>Obtenha em <a href="https://console.apify.com/account/integrations" target="_blank" rel="noreferrer" style={{ color: 'var(--indigo)' }}>console.apify.com</a> · Salva automaticamente</p>
          </div>

          {/* NICHOS — até 3 */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ ...S.label, margin: 0 }}>
                Nicho / Segmento <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <span style={{ fontSize: 11, color: niches.length >= MAX_NICHES ? 'var(--indigo)' : 'var(--gray-400)', fontWeight: 600 }}>
                {niches.length}/{MAX_NICHES}
              </span>
            </div>

            {/* Tags dos nichos selecionados */}
            <div style={{
              display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
              minHeight: 44, padding: '8px 12px',
              border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-md)',
              background: 'var(--white)', cursor: 'text',
            }}
              onClick={() => document.getElementById('niche-input')?.focus()}
            >
              {niches.map(n => (
                <span key={n} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '3px 10px', background: 'var(--indigo-pale)',
                  color: 'var(--indigo)', borderRadius: 999,
                  fontSize: 12, fontWeight: 600,
                }}>
                  {n}
                  <button onClick={() => removeNiche(n)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--indigo)', fontSize: 14, padding: 0, lineHeight: 1 }}>×</button>
                </span>
              ))}
              {niches.length < MAX_NICHES && (
                <div style={{ position: 'relative', flex: 1, minWidth: 140 }}>
                  <input
                    id="niche-input"
                    type="text" value={nicheInput}
                    onChange={e => { setNicheInput(e.target.value); setShowSugg(true) }}
                    onFocus={() => setShowSugg(true)}
                    onBlur={() => setTimeout(() => setShowSugg(false), 150)}
                    onKeyDown={handleNicheKey}
                    placeholder={niches.length === 0 ? 'Clique ou digite para buscar...' : 'Adicionar nicho...'}
                    style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: 'var(--font)', background: 'transparent', width: '100%', color: 'var(--navy)' }}
                  />
                  {showSugg && (
                    <div style={{ position: 'absolute', zIndex: 200, left: -12, right: -12, top: '100%', background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', maxHeight: 240, overflowY: 'auto' }}>
                      {NICHE_CATEGORIES.map(cat => {
                        const items = filteredSugg.filter(n => n.category === cat)
                        if (!items.length) return null
                        return (
                          <div key={cat}>
                            <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray-400)', padding: '8px 14px 4px', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0 }}>{cat}</p>
                            {items.map(n => (
                              <button key={n.value} onMouseDown={() => addNiche(n.value)}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '7px 14px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--navy)', fontFamily: 'var(--font)', textAlign: 'left' }}>
                                <span style={{ fontSize: 14 }}>{n.icon}</span>{n.label}
                              </button>
                            ))}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
            <p style={S.hint}>
              {niches.length === 0
                ? 'Digite e pressione Enter ou vírgula para adicionar. Até 3 nichos.'
                : niches.length < MAX_NICHES
                ? `${MAX_NICHES - niches.length} nicho${MAX_NICHES - niches.length > 1 ? 's' : ''} restante${MAX_NICHES - niches.length > 1 ? 's' : ''}`
                : 'Limite de 3 nichos atingido.'}
            </p>
          </div>

          {/* CAMPOS OBRIGATÓRIOS */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={S.label}>
                Selecionar leads com
                <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--gray-400)', marginLeft: 6 }}>opcional</span>
              </label>
              {requiredFields.size > 0 && (
                <button onClick={() => setRequiredFields(new Set())} style={{ ...S.microBtn, color: 'var(--red)', borderColor: '#FECACA' }}>
                  limpar
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                { id: 'email',     label: '✉ E-mail',     color: '#0A66C2', bg: '#EEF5FF' },
                { id: 'instagram', label: '📷 Instagram',  color: '#E1306C', bg: '#FFF0F5' },
                { id: 'whatsapp',  label: '💬 WhatsApp',   color: '#25D366', bg: '#F0FFF4' },
                { id: 'phone',     label: '📞 Telefone',   color: '#0A2540', bg: 'var(--gray-100)' },
                { id: 'facebook',  label: '👥 Facebook',   color: '#1877F2', bg: '#EEF5FF' },
                { id: 'linkedin',  label: '💼 LinkedIn',   color: '#0A66C2', bg: '#EEF5FF' },
                { id: 'website',   label: '🌐 Site',       color: 'var(--indigo)', bg: 'var(--indigo-pale)' },
              ].map(f => {
                const active = requiredFields.has(f.id)
                return (
                  <button key={f.id} onClick={() => {
                    setRequiredFields(prev => {
                      const n = new Set(prev)
                      n.has(f.id) ? n.delete(f.id) : n.add(f.id)
                      return n
                    })
                  }} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px',
                    border: `1.5px solid ${active ? f.color : 'var(--gray-200)'}`,
                    borderRadius: 'var(--radius-md)',
                    background: active ? f.bg : 'var(--white)',
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    color: active ? f.color : 'var(--gray-500)',
                    cursor: 'pointer', transition: 'all var(--transition)',
                    fontFamily: 'var(--font)',
                  }}>
                    {active && <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.color, flexShrink: 0, display: 'inline-block' }} />}
                    {f.label}
                  </button>
                )
              })}
            </div>
            <p style={{ ...S.hint, color: requiredFields.size > 0 ? 'var(--yellow)' : 'var(--gray-400)' }}>
              {requiredFields.size === 0
                ? 'Sem filtro — captura todos os leads encontrados.'
                : requiredFields.size >= 3
                ? `⚠ ${requiredFields.size} filtros ativos — volume de leads será bem menor. Apenas leads com: ${Array.from(requiredFields).join(' + ')}.`
                : `Apenas leads que tenham: ${Array.from(requiredFields).join(' + ')}.`}
            </p>
            {/* Aviso sobre Instagram não filtra por cidade */}
            {Array.from(sources).includes('instagram') && (
              <p style={{ ...S.hint, marginTop: 4 }}>
                ℹ Instagram: cidade não filtrada (perfis usam localização livre).
              </p>
            )}
          </div>

          {/* FONTES */}
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Fontes de dados</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {SOURCES.map(src => (
                <label key={src.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '11px 13px',
                  border: `1.5px solid ${sources.has(src.id) ? 'var(--indigo)' : 'var(--gray-200)'}`,
                  borderRadius: 'var(--radius-md)', cursor: 'pointer',
                  background: sources.has(src.id) ? 'var(--indigo-pale)' : 'var(--white)',
                  userSelect: 'none', transition: 'all var(--transition)',
                }}>
                  <input type="checkbox" checked={sources.has(src.id)} onChange={() => toggleSource(src.id)} style={{ display: 'none' }} />
                  <div style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4, background: sources.has(src.id) ? src.color : 'var(--gray-300)' }} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--navy)' }}>{src.label}</p>
                    <p style={{ fontSize: 11, color: 'var(--gray-400)', margin: 0, lineHeight: 1.3 }}>{src.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* FILTRO SITE */}
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Filtrar por site</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {SITE_FILTERS.map(f => (
                <button key={f.id} onClick={() => setSiteFilter(f.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: isMobile ? '7px 10px' : '7px 14px',
                  border: `1.5px solid ${siteFilter === f.id ? f.color : 'var(--gray-200)'}`,
                  borderRadius: 'var(--radius-md)',
                  background: siteFilter === f.id ? 'var(--white)' : 'var(--gray-50)',
                  fontSize: isMobile ? 11 : 12, fontWeight: siteFilter === f.id ? 700 : 500,
                  color: siteFilter === f.id ? f.color : 'var(--gray-600)',
                  cursor: 'pointer', transition: 'all var(--transition)', fontFamily: 'var(--font)',
                }}>
                  {siteFilter === f.id && <span style={{ width: 6, height: 6, borderRadius: '50%', background: f.color, flexShrink: 0, display: 'inline-block' }} />}
                  {f.label}
                  {!isMobile && <span style={{ fontSize: 11, opacity: 0.65, marginLeft: 2 }}>{f.desc}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* LEADS POR CIDADE */}
          <div style={{ marginBottom: isDesktop ? 0 : 20 }}>
            <label style={S.label}>
              Leads por cidade: <strong style={{ color: 'var(--indigo)' }}>{perCity}</strong>
              {niches.length > 1 && <span style={{ fontSize: 11, color: 'var(--indigo-light)', marginLeft: 6 }}>× {niches.length} nichos</span>}
              <span style={{ fontSize: 11, color: 'var(--gray-400)', marginLeft: 8 }}>
                ~{estimated} leads · ~${((estimated / 1000) * 0.5 * sources.size).toFixed(2)} USD
              </span>
            </label>
            <input type="range" min={5} max={100} step={5} value={perCity}
              onChange={e => setPerCity(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--indigo)', cursor: 'pointer' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--gray-400)', marginTop: 3 }}>
              <span>5 rápido</span><span>50 padrão</span><span>100 completo</span>
            </div>
          </div>
        </div>

        {/* RIGHT — CIDADES */}
        <div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ ...S.label, margin: 0 }}>
                Cidades <span style={{ color: 'var(--indigo)', fontWeight: 700 }}>({selectedCities.size}/{CITIES.length})</span>
              </label>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => setSelectedCities(new Set(CITIES.map(c => c.name)))} style={S.microBtn}>Todas</button>
                <button onClick={() => setSelectedCities(new Set())} style={S.microBtn}>Nenhuma</button>
              </div>
            </div>
            <div style={{ maxHeight: isMobile ? 240 : bp === 'tablet' ? 300 : 400, overflowY: 'auto', paddingRight: 4 }}>
              {REGIONS.map(region => {
                const rc = CITIES.filter(c => c.region === region)
                const sel = rc.filter(c => selectedCities.has(c.name)).length
                return (
                  <div key={region} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-700)' }}>{region}</span>
                      <span style={{ fontSize: 11, color: 'var(--indigo)', fontWeight: 600 }}>{sel}/{rc.length}</span>
                      <button onClick={() => selectRegion(region)} style={S.microBtn}>+ todos</button>
                      <button onClick={() => clearRegion(region)} style={S.microBtn}>limpar</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {rc.map(c => (
                        <label key={c.name} style={{
                          display: 'inline-block', padding: isMobile ? '3px 7px' : '3px 9px',
                          border: `1px solid ${selectedCities.has(c.name) ? 'var(--indigo-light)' : 'var(--gray-200)'}`,
                          borderRadius: 999, fontSize: isMobile ? 10 : 11,
                          color: selectedCities.has(c.name) ? 'var(--indigo)' : 'var(--gray-500)',
                          cursor: 'pointer', userSelect: 'none',
                          background: selectedCities.has(c.name) ? 'var(--indigo-pale)' : 'var(--white)',
                          fontWeight: selectedCities.has(c.name) ? 600 : 400,
                          transition: 'all var(--transition)',
                        }}>
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
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: isMobile ? '14px 16px' : '18px 28px', borderTop: '1px solid var(--gray-100)', background: 'var(--gray-50)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginTop: 8 }}>
        {error && <p style={{ fontSize: 12, color: 'var(--red)', fontWeight: 500, width: '100%' }}>⚠ {error}</p>}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          {!isRunning ? (
            <button onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '10px 20px' : '10px 24px', background: 'linear-gradient(135deg, #5469D4 0%, #4857C5 100%)', color: 'white', border: 'none', borderRadius: 'var(--radius-md)', fontSize: isMobile ? 13 : 14, fontWeight: 700, cursor: 'pointer', boxShadow: 'var(--shadow-indigo)', fontFamily: 'var(--font)' }}>
              <span style={{ fontSize: 11 }}>▶</span>
              Iniciar scraping
              {niches.length > 1 && <span style={{ fontSize: 11, opacity: 0.8 }}>({niches.length} nichos)</span>}
            </button>
          ) : (
            <button onClick={onCancel} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: isMobile ? '10px 20px' : '10px 24px', background: 'var(--red-light)', color: 'var(--red)', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)', fontSize: isMobile ? 13 : 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--font)' }}>
              <span>◼</span> Cancelar
            </button>
          )}
          {!isRunning && !isMobile && (
            <p style={{ fontSize: 12, color: 'var(--gray-400)' }}>
              Estimativa: ~${((estimated / 1000) * 0.5 * sources.size).toFixed(2)} USD na Apify
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  label: { display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--gray-700)', marginBottom: 8, letterSpacing: '-0.1px' },
  input: { width: '100%', padding: '10px 14px', border: '1.5px solid var(--gray-200)', borderRadius: 'var(--radius-md)', fontSize: 13, color: 'var(--navy)', background: 'var(--white)', outline: 'none', boxSizing: 'border-box' as const, fontFamily: 'var(--font)' },
  hint: { fontSize: 11, color: 'var(--gray-400)', marginTop: 5 },
  savedBanner: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--green-light)', border: '1px solid #A7F3D0', borderRadius: 'var(--radius-sm)', marginBottom: 8 },
  microBtn: { fontSize: 10, fontWeight: 600, padding: '2px 8px', border: '1px solid var(--gray-200)', borderRadius: 999, background: 'var(--white)', color: 'var(--gray-500)', cursor: 'pointer', fontFamily: 'var(--font)' },
}