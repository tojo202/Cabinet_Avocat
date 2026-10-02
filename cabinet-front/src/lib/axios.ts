import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'

const TOKEN_KEY = 'cabinet.token'

export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY)
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token)
export const clearToken = (): void => localStorage.removeItem(TOKEN_KEY)

export const api = axios.create({
  baseURL: '/api/v1',
  headers: { Accept: 'application/json' },
})

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && getToken()) {
      clearToken()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  },
)

type ApiErrorBody = { message?: string; errors?: Record<string, string[]> }

function messageFromBody(body: ApiErrorBody | undefined): string | null {
  if (!body) return null
  if (body.errors) {
    const first = Object.values(body.errors).flat()[0]
    if (first) return first
  }
  return body.message ?? null
}

export function apiErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.data instanceof Blob) return fallback
    const message = messageFromBody(error.response?.data as ApiErrorBody | undefined)
    if (message) return message
    if (error.code === 'ERR_NETWORK') return 'Serveur injoignable.'
  }
  return fallback
}

export async function apiErrorMessageAsync(
  error: unknown,
  fallback = 'Une erreur est survenue.',
): Promise<string> {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const body = JSON.parse(await error.response.data.text()) as ApiErrorBody
      const message = messageFromBody(body)
      if (message) return message
    } catch {
      return fallback
    }
  }
  return apiErrorMessage(error, fallback)
}
