import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiErrorMessage } from '@/lib/axios'
import type { Evenement, Paginated, TypeEvenement } from '@/types'

export interface EvenementFilters {
  from?: string
  to?: string
  type?: TypeEvenement | ''
  page?: number
  per_page?: number
}

export interface EvenementPayload {
  titre: string
  type: TypeEvenement
  debut: string
  fin?: string | null
  dossier_id?: number | null
  client_id?: number | null
  lieu?: string | null
  description?: string | null
}

export function useEvenements(filters: EvenementFilters = {}) {
  const { from, to, type, page = 1, per_page = 100 } = filters

  return useQuery<Paginated<Evenement>>({
    queryKey: ['evenements', { from, to, type, page, per_page }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page }
      if (from) params.from = from
      if (to) params.to = to
      if (type) params.filter = { type }

      const res = await api.get('/evenements', { params })
      return res.data
    },
    placeholderData: keepPreviousData,
  })
}

export function useCreateEvenement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: EvenementPayload) => {
      const res = await api.post('/evenements', payload)
      return res.data.data ?? res.data
    },
    onSuccess: () => {
      toast.success('Événement ajouté au calendrier')
      queryClient.invalidateQueries({ queryKey: ['evenements'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Impossible d'ajouter l'événement."))
    },
  })
}

export function useUpdateEvenement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EvenementPayload }) => {
      const res = await api.put(`/evenements/${id}`, data)
      return res.data.data ?? res.data
    },
    onSuccess: () => {
      toast.success('Événement mis à jour')
      queryClient.invalidateQueries({ queryKey: ['evenements'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Impossible de modifier l'événement."))
    },
  })
}

export function useDeleteEvenement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/evenements/${id}`)
    },
    onSuccess: () => {
      toast.success('Événement supprimé')
      queryClient.invalidateQueries({ queryKey: ['evenements'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Impossible de supprimer l'événement."))
    },
  })
}
