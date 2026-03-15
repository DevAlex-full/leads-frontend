import { useRef, useEffect } from 'react'
import { LogEntry, JobStatus } from '../lib/types'
import { useBreakpoint } from '../lib/useBreakpoint'

interface Props {
  status: JobStatus; progress: number; progressLabel: string; logs: LogEntry[]; leadsCount: number
}

const STATUS_CONFIG: Record<JobStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: 'Aguardando',  color: 'var(--yellow)',   bg: 'var(--yellow-light)' },
  running:   { label: 'Executando',  color: 'var(--indigo)',   bg: 'var(--indigo-pale)'  },
  done:      { label: 'Concluído',   color: 'var(--green)',    bg: 'var(--green-light)'  },
  failed:    { label: 'Falhou',      color: 'var(--red)',      bg: 'var(--red-light)'    },
  cancelled: { label: 'Cancelado',   color: 'var(--gray-500)', bg: 'var(--gray-100)'     },
}

export default function ProgressPanel({ status, progress, progressLabel, logs, leadsCount }: Props) {
  const logRef = useRef<HTMLDivElement>(null)
  const cfg = STATUS_CONFIG[status]
  const bp = useBreakpoint()
  const isMobile = bp === 'mobile'

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight }, [logs])

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius-lg)', padding: isMobile ? '16px' : '24px', marginBottom: 20, boxShadow: 'var(--shadow-sm)' }} className="animate-in">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {status === 'running' && (
            <span style={{ width: 14, height: 14, borderRadius: '50%', border: '2px solid var(--indigo-pale)', borderTopColor: 'var(--indigo)', animation: 'spin 0.8s linear infinite', display: 'inline-block', flexShrink: 0 }} />
          )}
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--navy)', margin: 0 }}>Progresso</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {leadsCount > 0 && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--green)', background: 'var(--green-light)', padding: '3px 10px', borderRadius: 999 }}>
              {leadsCount.toLocaleString('pt-BR')} leads
            </span>
          )}
          <span style={{ fontSize: 12, fontWeight: 600, padding: '4px 10px', borderRadius: 999, background: cfg.bg, color: cfg.color }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {/* Bar */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>{progressLabel}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--navy)' }}>{Math.round(progress)}%</span>
        </div>
        <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 999,
            width: `${progress}%`,
            transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
            background: status === 'done'
              ? 'linear-gradient(90deg, var(--green), #34D399)'
              : status === 'failed' ? 'var(--red)'
              : 'linear-gradient(90deg, var(--indigo), var(--indigo-light))',
          }} />
        </div>
      </div>

      {/* Terminal */}
      <div ref={logRef} style={{
        background: '#0D1B2A', borderRadius: 'var(--radius-md)',
        padding: '12px 14px', fontFamily: "'SF Mono','Fira Code','Cascadia Code',monospace",
        fontSize: 11, maxHeight: isMobile ? 140 : 200, overflowY: 'auto',
        lineHeight: 1.7, color: '#A0AEC0',
      }}>
        {logs.length === 0 && <span style={{ color: '#6B8090' }}>Aguardando início...</span>}
        {logs.map((l, i) => (
          <div key={i} style={{ color: l.type === 'error' ? '#FC8181' : l.type === 'success' ? '#68D391' : '#A0AEC0' }}>
            <span style={{ color: '#4A6B7C', marginRight: 8 }}>[{l.time}]</span>{l.message}
          </div>
        ))}
      </div>
    </div>
  )
}