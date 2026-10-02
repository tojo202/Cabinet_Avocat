import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiErrorMessage } from '@/lib/axios'
import type { AvocatRef, Dossier, Paginated } from '@/types'

export interface AvocatFilters {
  search?: string
  sort?: string
  page?: number
  per_page?: number
}

export interface AvocatPayload {
  nom: string
  prenom: string
  specialite?: string | null
  telephone?: string | null
  barreau?: string | null
  actif?: boolean
  email?: string
  password?: string
}

export interface AvocatDetail extends AvocatRef {
  dossiers?: Dossier[]
}

export function useAvocats(filters: AvocatFilters = {}) {
  const { search, sort, page = 1, per_page = 15 } = filters

  return useQuery<Paginated<AvocatRef>>({
    queryKey: ['avocats', { search, sort, page, per_page }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page }
      if (search) params.filter = { search }
      if (sort) params.sort = sort

      const res = await api.get('/avocats', { params })
      return res.data
    },
    placeholderData: keepPreviousData,
  })
}

export function useAvocat(id: number | null) {
  return useQuery<AvocatDetail>({
    queryKey: ['avocats', id],
    queryFn: async () => {
      const res = await api.get(`/avocats/${id}`)
      return res.data.data ?? res.data
    },
    enabled: id !== null && id > 0,
  })
}

export function useCreateAvocat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: AvocatPayload) => {
      const res = await api.post('/avocats', payload)
      return res.data.data ?? res.data
    },
    onSuccess: () => {
      toast.success('Avocat créé. Son compte utilisateur est actif.')
      queryClient.invalidateQueries({ queryKey: ['avocats'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Impossible de créer l'avocat."))
    },
  })
}

export function useUpdateAvocat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AvocatPayload> }) => {
      const res = await api.put(`/avocats/${id}`, data)
      return res.data.data ?? res.data
    },
    onSuccess: () => {
      toast.success('Profil mis à jour.')
      queryClient.invalidateQueries({ queryKey: ['avocats'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Impossible de modifier l'avocat."))
    },
  })
}

export function useDeleteAvocat() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete<{ message?: string }>(`/avocats/${id}`)
      return res.data
    },
    onSuccess: (data) => {
      toast.success(data?.message ?? 'Avocat désactivé.')
      queryClient.invalidateQueries({ queryKey: ['avocats'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Impossible de désactiver l'avocat."))
    },
  })
}
