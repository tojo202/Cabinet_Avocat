import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiErrorMessage } from '@/lib/axios'
import type { Paginated, Role, Utilisateur, UtilisateurPayload } from '@/types'

export interface UtilisateurFilters {
  search?: string
  role?: Role | ''
  page?: number
  per_page?: number
}

export function useUtilisateurs(filters: UtilisateurFilters = {}) {
  const { search, role, page = 1, per_page = 15 } = filters

  return useQuery<Paginated<Utilisateur>>({
    queryKey: ['utilisateurs', { search, role, page, per_page }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page }
      const filter: Record<string, string> = {}
      if (search) filter.search = search
      if (role) filter.role = role
      if (Object.keys(filter).length > 0) params.filter = filter

      const res = await api.get('/users', { params })
      return res.data
    },
    placeholderData: keepPreviousData,
  })
}

export function useCreateUtilisateur() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: UtilisateurPayload) => {
      const res = await api.post('/users', payload)
      return res.data.data ?? res.data
    },
    onSuccess: () => {
      toast.success('Utilisateur créé avec succès')
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Impossible de créer l'utilisateur."))
    },
  })
}

export function useUpdateUtilisateur() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UtilisateurPayload }) => {
      const res = await api.put(`/users/${id}`, data)
      return res.data.data ?? res.data
    },
    onSuccess: () => {
      toast.success('Utilisateur mis à jour')
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Impossible de mettre à jour l'utilisateur."))
    },
  })
}

export function useDeleteUtilisateur() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/users/${id}`)
    },
    onSuccess: () => {
      toast.success('Utilisateur supprimé')
      queryClient.invalidateQueries({ queryKey: ['utilisateurs'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Impossible de supprimer l'utilisateur."))
    },
  })
}
