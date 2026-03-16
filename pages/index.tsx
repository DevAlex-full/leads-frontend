import { useState, useEffect, useRef, useCallback } from 'react'
import Head from 'next/head'
import { useSession } from 'next-auth/react'
import Layout from '../components/Layout'
import StatsCards from '../components/StatsCards'
import ConfigPanel from '../components/ConfigPanel'
import ProgressPanel from '../components/ProgressPanel'
import LeadsTable from '../components/LeadsTable'
import { ScrapeConfig, JobStatus, Lead, LogEntry } from '../lib/types'
import { api, ApiError } from '../lib/api'
import HistoryPanel from '../components/HistoryPanel'

const POLL_INTERVAL = 3000

export default function Home() {
  const { data: session } = useSession()
  const token = session?.token || ''

  const [jobId, setJobId] = useState<string | null>(null)
  const [jobStatus, setJobStatus] = useState<JobStatus>('pending')
  const [progress, setProgress] = useState(0)
  const [progressLabel, setProgressLabel] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [leadsCount, setLeadsCount] = useState(0)
  const [leads, setLeads] = useState<Lead[]>([])
  const [requiredFields, setRequiredFields] = useState<string[]>([])
  const [currentNiche, setCurrentNiche] = useState('')
  const [error, setError] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null)
  const [accumulated, setAccumulated] = useState(0)

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Verifica backend e carrega stats acumuladas
  useEffect(() => {
    api.checkHealth().then(() => setBackendOnline(true)).catch(() => setBackendOnline(false))
  }, [])

  useEffect(() => {
    if (!token) return
    api.getAccumulatedStats(token)
      .then((s) => setAccumulated(s.total))
      .catch(() => {})
  }, [token])

  function stopPolling() {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null }
  }

  async function fetchResults(id: string) {
    try {
      const result = await api.getResults(id, token)
      // Aplica filtro de campos obrigatórios nos leads recebidos
      const rf = requiredFields
      const filtered = rf.length > 0
        ? result.leads.filter((l: Lead) => rf.every((f: string) => {
            if (f === 'email')     return Boolean(l.email)
            if (f === 'instagram') return Boolean(l.instagram)
            if (f === 'whatsapp')  return Boolean((l as Lead & { whatsapp?: string }).whatsapp)
            if (f === 'phone')     return Boolean(l.phone)
            if (f === 'facebook')  return Boolean(l.facebook)
            if (f === 'linkedin')  return Boolean(l.linkedin)
            if (f === 'website')   return Boolean(l.website)
            return true
          }))
        : result.leads
      setLeads(filtered)
      // Atualiza o total acumulado após scraping concluído
      api.getAccumulatedStats(token).then((s) => setAccumulated(s.total)).catch(() => {})
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao buscar resultados.')
    }
  }

  const pollStatus = useCallback(async (id: string) => {
    try {
      const data = await api.getStatus(id, token)
      setProgress(data.progress)
      setProgressLabel(data.progressLabel)
      setLogs(data.logs)
      setLeadsCount(data.leadsCount)
      setJobStatus(data.status)

      if (['done', 'failed', 'cancelled'].includes(data.status)) {
        stopPolling()
        setIsRunning(false)
        if (data.status === 'done') await fetchResults(id)
        if (data.status === 'failed') setError(data.error || 'Scraping falhou.')
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao consultar status.')
      stopPolling()
      setIsRunning(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  async function handleStart(config: ScrapeConfig) {
    setError('')
    setLeads([])
    setLeadsCount(0)
    setLogs([])
    setProgress(0)
    setProgressLabel('Iniciando...')
    setCurrentNiche(config.niches.join(', '))
    setIsRunning(true)
    setJobStatus('pending')

    try {
      const { jobId: id } = await api.startScrape(config, token)
      setJobId(id)
      pollingRef.current = setInterval(() => pollStatus(id), POLL_INTERVAL)
    } catch (err) {
      setIsRunning(false)
      setError(err instanceof ApiError ? err.firstDetail : 'Erro ao iniciar scraping.')
    }
  }

  async function handleCancel() {
    if (!jobId) return
    stopPolling()
    try {
      await api.cancelJob(jobId, token)
      setJobStatus('cancelled')
      setProgressLabel('Cancelado pelo usuário.')
    } catch { /* ignora */ } finally {
      setIsRunning(false)
    }
  }

  useEffect(() => () => stopPolling(), [])

  const showProgress = isRunning || (['done', 'failed', 'cancelled'].includes(jobStatus) && logs.length > 0)

  return (
    <>
      <Head><title>Gerador de Leads Multi-Nicho</title></Head>
      <Layout>
        {backendOnline === false && (
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#92400e', marginBottom: 16 }}>
            ⚠️ <strong>Backend offline.</strong> Certifique-se que o servidor Express está rodando.
          </div>
        )}
        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', fontSize: 13, color: '#dc2626', marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
            <span><strong>Erro:</strong> {error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 16 }}>✕</button>
          </div>
        )}

        <StatsCards leads={leads} leadsCount={leadsCount || leads.length} accumulated={accumulated} />
        <HistoryPanel />
        <ConfigPanel onStart={handleStart} onCancel={handleCancel} isRunning={isRunning} />

        {showProgress && (
          <ProgressPanel
            status={jobStatus} progress={progress}
            progressLabel={progressLabel} logs={logs} leadsCount={leadsCount}
          />
        )}
        {leads.length > 0 && jobId && (
          <LeadsTable leads={leads} jobId={jobId} niche={currentNiche} />
        )}
      </Layout>
    </>
  )
}