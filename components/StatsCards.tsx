import { Lead } from '../lib/types'

interface Props {
  leads: Lead[]
  leadsCount: number
}

export default function StatsCards({ leads, leadsCount }: Props) {
  const hot = leads.filter((l) => l.priority === 'high').length
  const withInsta = leads.filter((l) => l.instagram).length
  const withEmail = leads.filter((l) => l.email).length
  const withLinkedin = leads.filter((l) => l.linkedin).length

  const stats = [
    { label: 'Total de leads', value: leadsCount, color: '#1a1a2e' },
    { label: 'Sem site (quentes)', value: hot, color: '#16a34a' },
    { label: 'Com Instagram', value: withInsta, color: '#e1306c' },
    { label: 'Com LinkedIn', value: withLinkedin, color: '#0a66c2' },
    { label: 'Com e-mail', value: withEmail, color: '#7c3aed' },
  ]

  return (
    <div style={S.grid}>
      {stats.map((s) => (
        <div key={s.label} style={S.card}>
          <p style={S.label}>{s.label}</p>
          <p style={{ ...S.value, color: s.color }}>{s.value}</p>
        </div>
      ))}
    </div>
  )
}

const S: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
    marginBottom: 20,
  },
  card: {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: 10,
    padding: '14px 16px',
  },
  label: { fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' },
  value: { fontSize: 28, fontWeight: 700 },
}
