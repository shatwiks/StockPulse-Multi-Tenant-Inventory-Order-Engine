import { toast } from './toast-context'

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.VITE_API_BASE_URL ||
  'http://localhost:3001/api/v1'

const TOKEN_KEY = 'stockpulse_auth_token'
const USER_KEY = 'stockpulse_auth_user'

export interface ApiUser {
  id: string
  organizationId: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'CASHIER'
  firstName?: string
  lastName?: string
  organization?: {
    id: string
    name: string
    slug: string
    currency: string
  }
}

export interface ShortageDetail {
  productId: string
  sku: string
  name: string
  availableStock: number
  requestedQuantity: number
}

export class ApiError extends Error {
  status: number
  code?: string
  details?: ShortageDetail[] | any

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setAuthToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token)
  }
}

export function clearAuthToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }
}

export function getStoredUser(): ApiUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function setStoredUser(user: ApiUser) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean
}

/**
 * Hardened HTTP client adhering to enterprise zero-trust security standards:
 * - Credentials included for HTTP-only cookies
 * - Automatic Bearer token attachment
 * - 401 Unauthorized automatic session purge & redirect
 * - 403 Forbidden interceptor with friendly toast feedback
 * - 409 Conflict parsing for atomic inventory shortages
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  // Attach token if present and not explicitly skipped
  if (!options.skipAuth) {
    const token = getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Enforce secure cookie transmission
  }

  let response: Response
  try {
    response = await fetch(url, config)
  } catch (err: any) {
    throw new ApiError(
      err.message || 'Network connection failed. Please check your network and API server.',
      0,
      'NETWORK_ERROR'
    )
  }

  // 1. Intercept 401 Unauthorized -> Purge expired sessions
  if (response.status === 401) {
    clearAuthToken()
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stockpulse:unauthorized'))
    }
    const errorBody = await response.json().catch(() => ({}))
    throw new ApiError(
      errorBody.message || 'Session expired or unauthorized. Please re-authenticate.',
      401,
      errorBody.error || 'UNAUTHORIZED'
    )
  }

  // 2. Intercept 403 Forbidden -> Display user-friendly Toast notification
  if (response.status === 403) {
    const errorBody = await response.json().catch(() => ({}))
    const message =
      errorBody.message ||
      'Access Denied: You do not have permission to execute this operation.'

    toast.error(message, 'Insufficient Permissions')

    throw new ApiError(message, 403, errorBody.error || 'FORBIDDEN')
  }

  // 3. Intercept 409 Conflict -> Concurrency race condition shortage
  if (response.status === 409) {
    const errorBody = await response.json().catch(() => ({}))
    const details: ShortageDetail[] = errorBody.error?.details || errorBody.details || []
    throw new ApiError(
      errorBody.error?.message || errorBody.message || 'Inventory shortage encountered.',
      409,
      errorBody.error?.code || 'INSUFFICIENT_STOCK',
      details
    )
  }

  // Handle other error status codes
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    const message =
      errorBody.message ||
      errorBody.error?.message ||
      `Request failed with status ${response.status}`
    throw new ApiError(
      message,
      response.status,
      errorBody.error?.code || errorBody.error,
      errorBody.error?.details || errorBody.errors
    )
  }

  // Parse successful response
  return response.json()
}

export const apiClient = {
  get: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  patch: <T = any>(endpoint: string, body?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),

  delete: <T = any>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
}

export default apiClient
