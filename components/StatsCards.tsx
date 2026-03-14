import { Lead } from '../lib/types'

interface Props {
  leads: Lead[]
  leadsCount: number
  accumulated?: number
}

export default function StatsCards({ leads, leadsCount, accumulated }: Props) {
  const hot = leads.filter((l) => l.priority === 'high').length
  const withInsta = leads.filter((l) => l.instagram).length
  const withEmail = leads.filter((l) => l.email).length
  const withLinkedin = leads.filter((l) => l.linkedin).length

  const stats = [
    { label: 'Total acumulado', value: accumulated ?? 0, color: '#7c3aed', title: 'Total de leads únicos coletados em todas as buscas' },
    { label: 'Nesta busca', value: leadsCount, color: '#1a1a2e', title: 'Leads novos desta sessão' },
    { label: 'Sem site (quentes)', value: hot, color: '#16a34a', title: 'Leads sem site — mais fáceis de converter' },
    { label: 'Com Instagram', value: withInsta, color: '#e1306c', title: 'Leads com perfil no Instagram' },
    { label: 'Com LinkedIn', value: withLinkedin, color: '#0a66c2', title: 'Leads com perfil no LinkedIn' },
    { label: 'Com e-mail', value: withEmail, color: '#7c3aed', title: 'Leads com e-mail identificado' },
  ]

  return (
    <div style={S.grid}>
      {stats.map((s) => (
        <div key={s.label} style={{ ...S.card, ...(s.label === 'Total acumulado' ? S.cardHighlight : {}) }} title={s.title}>
          <p style={S.label}>{s.label}</p>
          <p style={{ ...S.value, color: s.color }}>{s.value.toLocaleString('pt-BR')}</p>
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
  cardHighlight: {
    background: '#faf5ff',
    border: '1px solid #ddd6fe',
  },
  label: { fontSize: 11, color: '#6b7280', marginBottom: 4, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' },
  value: { fontSize: 28, fontWeight: 700 },
}