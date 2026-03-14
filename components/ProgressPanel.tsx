import { useRef, useEffect } from 'react'
import { LogEntry, JobStatus } from '../lib/types'

interface Props {
  status: JobStatus
  progress: number
  progressLabel: string
  logs: LogEntry[]
  leadsCount: number
}

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: '⏳ Aguardando...',
  running: '🔄 Rodando...',
  done: '✅ Concluído',
  failed: '❌ Falhou',
  cancelled: '🚫 Cancelado',
}

const STATUS_COLORS: Record<JobStatus, string> = {
  pending: '#f59e0b',
  running: '#2563eb',
  done: '#16a34a',
  failed: '#dc2626',
  cancelled: '#6b7280',
}

export default function ProgressPanel({ status, progress, progressLabel, logs, leadsCount }: Props) {
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [logs])

  return (
    <section style={S.card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <h2 style={S.h2}>📊 Progresso</h2>
        <span style={{ ...S.badge, background: STATUS_COLORS[status] + '20', color: STATUS_COLORS[status] }}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Barra de progresso */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>{progressLabel}</span>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{Math.round(progress)}%</span>
        </div>
        <div style={S.track}>
          <div
            style={{
              ...S.bar,
              width: `${progress}%`,
              background: STATUS_COLORS[status],
            }}
          />
        </div>
      </div>

      {/* Contador rápido */}
      {leadsCount > 0 && (
        <p style={{ fontSize: 13, color: '#16a34a', fontWeight: 600, marginBottom: 10 }}>
          {leadsCount} leads coletados até agora...
        </p>
      )}

      {/* Log */}
      <div ref={logRef} style={S.log}>
        {logs.length === 0 && (
          <span style={{ color: '#9ca3af' }}>Aguardando início...</span>
        )}
        {logs.map((l, i) => (
          <div
            key={i}
            style={{
              color: l.type === 'error' ? '#dc2626' : l.type === 'success' ? '#16a34a' : '#6b7280',
              lineHeight: 1.7,
            }}
          >
            <span style={{ color: '#d1d5db' }}>[{l.time}]</span> {l.message}
          </div>
        ))}
      </div>
    </section>
  )
}

const S: Record<string, React.CSSProperties> = {
  card: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', marginBottom: 20 },
  h2: { fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0 },
  badge: { fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999 },
  track: { height: 8, background: '#f3f4f6', borderRadius: 999, overflow: 'hidden' },
  bar: { height: '100%', borderRadius: 999, transition: 'width 0.5s ease' },
  log: {
    background: '#0f172a', borderRadius: 8, padding: '12px 14px',
    fontFamily: 'monospace', fontSize: 11, maxHeight: 180,
    overflowY: 'auto', lineHeight: 1.7, color: '#94a3b8',
  },
}
