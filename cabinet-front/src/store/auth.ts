import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api, clearToken, setToken } from '@/lib/axios'
import type { AuthUser, LoginResponse, Role } from '@/types'

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    'clients.view', 'clients.create', 'clients.update', 'clients.delete', 'clients.export',
    'dossiers.view', 'dossiers.manage',
    'factures.view', 'factures.manage', 'paiements.manage',
    'documents.view', 'documents.manage',
    'evenements.view', 'evenements.manage',
    'avocats.view', 'avocats.manage',
    'dashboard.view', 'parametres.manage',
  ],
  avocat: [
    'clients.view', 'clients.create', 'clients.update',
    'dossiers.view', 'dossiers.manage',
    'factures.view',
    'documents.view', 'documents.manage',
    'evenements.view', 'evenements.manage',
    'avocats.view',
    'dashboard.view',
  ],
  secretaire: [
    'clients.view', 'clients.create', 'clients.update', 'clients.export',
    'dossiers.view', 'dossiers.manage',
    'documents.view', 'documents.manage',
    'evenements.view', 'evenements.manage',
    'avocats.view',
    'dashboard.view',
  ],
  comptable: [
    'clients.view',
    'dossiers.view',
    'factures.view', 'factures.manage', 'paiements.manage',
    'documents.view',
    'evenements.view',
    'avocats.view',
    'dashboard.view',
  ],
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  login: (email: string, password: string) => Promise<AuthUser>
  logout: () => Promise<void>
  fetchMe: () => Promise<void>
  can: (permission: string) => boolean
  hasRole: (...roles: Role[]) => boolean
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,

      login: async (email, password) => {
        const { data } = await api.post<LoginResponse>('/auth/login', { email, password })
        setToken(data.token)
        set({ token: data.token, user: data.user })
        return data.user
      },

      logout: async () => {
        try {
          await api.post('/auth/logout')
        } catch {
          // token déjà invalide : on nettoie quand même
        }
        clearToken()
        set({ token: null, user: null })
      },

      fetchMe: async () => {
        const { data } = await api.get<{ user: AuthUser }>('/auth/me')
        set({ user: data.user })
      },

      can: (permission) => {
        const { user } = get()
        if (!user) return false
        return (ROLE_PERMISSIONS[user.role] ?? []).includes(permission)
      },

      hasRole: (...roles) => {
        const { user } = get()
        if (!user) return false
        return roles.includes(user.role)
      },
    }),
    {
      name: 'cabinet.auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)
