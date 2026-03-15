import { Lead } from '../lib/types'
import { useBreakpoint } from '../lib/useBreakpoint'

interface Props {
  leads: Lead[]
  leadsCount: number
  accumulated?: number
}

export default function StatsCards({ leads, leadsCount, accumulated }: Props) {
  const bp = useBreakpoint()
  const hot = leads.filter(l => l.priority === 'high').length
  const withInsta = leads.filter(l => l.instagram).length
  const withLinkedin = leads.filter(l => l.linkedin).length
  const withEmail = leads.filter(l => l.email).length

  const stats = [
    { label: 'Total acumulado', value: accumulated ?? 0, color: 'var(--indigo)', bg: 'var(--indigo-pale)', icon: '◈', highlight: true },
    { label: 'Nesta busca', value: leadsCount, color: 'var(--navy)', bg: 'var(--gray-100)', icon: '⊕' },
    { label: 'Sem site', value: hot, color: 'var(--green)', bg: 'var(--green-light)', icon: '🔥' },
    { label: 'Com Instagram', value: withInsta, color: '#E1306C', bg: '#FFF0F5', icon: '◉' },
    { label: 'Com LinkedIn', value: withLinkedin, color: '#0A66C2', bg: '#EEF5FF', icon: '◈' },
    { label: 'Com e-mail', value: withEmail, color: 'var(--indigo)', bg: 'var(--indigo-pale)', icon: '✉' },
  ]

  const cols = bp === 'mobile' ? 2 : bp === 'tablet' ? 3 : 6

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, marginBottom: 20 }}>
      {stats.map((s, i) => (
        <div key={s.label} style={{
          background: s.highlight ? 'linear-gradient(135deg, #EEF0FB 0%, #F5F6FF 100%)' : 'var(--white)',
          border: s.highlight ? '1px solid var(--indigo-light)' : '1px solid var(--gray-200)',
          borderRadius: 'var(--radius-lg)',
          padding: bp === 'mobile' ? '14px 14px' : '18px 20px',
          boxShadow: 'var(--shadow-sm)',
          animationDelay: `${i * 60}ms`,
        }} className="animate-in">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--gray-400)', textTransform: 'uppercase', letterSpacing: '0.6px', margin: 0, lineHeight: 1.3 }}>
              {s.label}
            </p>
            <div style={{ width: 26, height: 26, borderRadius: 'var(--radius-sm)', background: s.bg, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
              {s.icon}
            </div>
          </div>
          <p style={{ fontSize: bp === 'mobile' ? 22 : 26, fontWeight: 700, margin: 0, letterSpacing: '-0.5px', lineHeight: 1, color: s.color }}>
            {s.value.toLocaleString('pt-BR')}
          </p>
        </div>
      ))}
    </div>
  )
}