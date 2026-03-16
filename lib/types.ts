export type Source = 'google_maps' | 'instagram' | 'linkedin' | 'facebook'
export type Priority = 'high' | 'normal'
export type JobStatus = 'pending' | 'running' | 'done' | 'failed' | 'cancelled'
export type SiteFilter = 'all' | 'without_site' | 'with_site'

export interface Lead {
  name: string
  niche: string
  city: string
  state: string
  phone: string
  email: string
  address: string
  website: string
  instagram: string
  linkedin: string
  facebook: string
  whatsapp: string
  rating: string
  reviews: string
  category: string
  source: Source
  priority: Priority
  scrapedAt: string
  cnpj?: string
  razaoSocial?: string
  enriched?: boolean
}

export interface LogEntry {
  time: string
  message: string
  type: 'info' | 'success' | 'error'
}

export interface JobStatusResponse {
  id: string
  status: JobStatus
  progress: number
  progressLabel: string
  logs: LogEntry[]
  leadsCount: number
  error?: string
  createdAt: string
  finishedAt?: string
}

export interface JobResultsResponse {
  leads: Lead[]
  total: number
  bySource: Record<string, number>
  byPriority: { high: number; normal: number }
}

export interface ScrapeConfig {
  apiKey: string
  niches: string[]
  cities: string[]
  perCity: number
  sources: Source[]
  siteFilter: SiteFilter
  requiredFields?: string[]  // ex: ['email','instagram','whatsapp']
}

export interface ValidationError {
  field: string
  message: string
}