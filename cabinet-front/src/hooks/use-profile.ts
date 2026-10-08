import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiErrorMessage } from '@/lib/axios'
import { useAuth } from '@/store/auth'
import type { AuthUser } from '@/types'

export interface ProfilPayload {
  name: string
  email: string
}

export interface MotDePassePayload {
  current_password: string
  password: string
  password_confirmation: string
}

export function useUpdateProfil() {
  const fetchMe = useAuth((s) => s.fetchMe)

  return useMutation({
    mutationFn: async (payload: ProfilPayload) => {
      const res = await api.put<{ user: AuthUser }>('/auth/me', payload)
      return res.data.user
    },
    onSuccess: async () => {
      await fetchMe()
      toast.success('Profil mis à jour')
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Impossible de mettre à jour le profil.'))
    },
  })
}

export function useChangeMotDePasse() {
  return useMutation({
    mutationFn: async (payload: MotDePassePayload) => {
      await api.put('/auth/password', payload)
    },
    onSuccess: () => {
      toast.success('Mot de passe modifié avec succès')
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Impossible de changer le mot de passe.'))
    },
  })
}
