import { JobStatusResponse, JobResultsResponse, ScrapeConfig } from './types'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export class ApiError extends Error {
  constructor(message: string, public details?: { field: string; message: string }[], public status?: number) {
    super(message)
    this.name = 'ApiError'
  }
  get firstDetail(): string {
    return this.details?.[0] ? `${this.details[0].field}: ${this.details[0].message}` : this.message
  }
}

async function request<T>(method: string, path: string, body?: object, token?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  const res = await fetch(`${API_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json()
  if (!data.success) throw new ApiError(data.error, data.details, res.status)
  return data.data as T
}

export const authApi = {
  register: (name: string, email: string, password: string) =>
    request<{ user: unknown; token: string }>('POST', '/api/auth/register', { name, email, password }),
  forgotPassword: (email: string) =>
    request<{ message: string }>('POST', '/api/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    request<{ message: string }>('POST', '/api/auth/reset-password', { token, password }),
}

export interface AccumulatedStats {
  total: number
  byNiche: Record<string, number>
  bySource: Record<string, number>
  lastScrapedAt: string | null
}

export interface SessionSummary {
  id: string
  user_id: string
  niche: string
  cities: string[]
  sources: string[]
  site_filter: string
  total_leads: number
  created_at: string
}

export const api = {
  startScrape: (config: ScrapeConfig, token: string): Promise<{ jobId: string }> =>
    request('POST', '/api/scrape/start', config, token),
  getStatus: (jobId: string, token: string): Promise<JobStatusResponse> =>
    request('GET', `/api/scrape/status/${jobId}`, undefined, token),
  getResults: (jobId: string, token: string): Promise<JobResultsResponse> =>
    request('GET', `/api/scrape/results/${jobId}`, undefined, token),
  cancelJob: (jobId: string, token: string): Promise<void> =>
    request('DELETE', `/api/scrape/cancel/${jobId}`, undefined, token),
  getAccumulatedStats: (token: string): Promise<AccumulatedStats> =>
    request('GET', '/api/scrape/stats', undefined, token),
  checkHealth: (): Promise<{ status: string }> =>
    fetch(`${API_URL}/health`).then(r => r.json()).then(d => d.data || d),
  downloadUrl: (jobId: string, format: 'md' | 'csv', niche: string): string =>
    `${API_URL}/api/scrape/download/${jobId}?format=${format}&niche=${encodeURIComponent(niche)}`,
}

export const historyApi = {
  list: (token: string): Promise<{ sessions: SessionSummary[]; total: number }> =>
    request('GET', '/api/history', undefined, token),
  downloadUrl: (sessionId: string, format: 'md' | 'csv', token: string): string =>
    `${API_URL}/api/history/${sessionId}/download?format=${format}&token=${encodeURIComponent(token)}`,
  delete: (sessionId: string, token: string): Promise<void> =>
    request('DELETE', `/api/history/${sessionId}`, undefined, token),
}

export interface AdminUser {
  id: string; name: string; email: string
  role: 'user' | 'admin'; is_active: boolean
  created_at: string; updated_at: string
}
export interface AdminStats {
  total: number; active: number; inactive: number
  admins: number; newToday: number; newThisMonth: number
}

export const adminApi = {
  getUsers: (token: string) =>
    request<{ users: AdminUser[]; total: number; active: number; admins: number }>('GET', '/api/admin/users', undefined, token),
  getStats: (token: string) =>
    request<AdminStats>('GET', '/api/admin/stats', undefined, token),
  updateUser: (id: string, updates: Partial<AdminUser>, token: string) =>
    request<{ user: AdminUser }>('PATCH', `/api/admin/users/${id}`, updates, token),
  deleteUser: (id: string, token: string) =>
    request('DELETE', `/api/admin/users/${id}`, undefined, token),
}