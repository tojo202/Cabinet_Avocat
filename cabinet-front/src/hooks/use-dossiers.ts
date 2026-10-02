import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiErrorMessage } from '@/lib/axios'
import type {
  ActivityEntry,
  Dossier,
  DossiersStats,
  Paginated,
  PrioriteDossier,
  StatutDossier,
} from '@/types'

export interface DossierFilters {
  statut?: StatutDossier | ''
  priorite?: PrioriteDossier | ''
  search?: string
  sort?: string
  page?: number
  per_page?: number
}

export interface DossierPayload {
  client_id: number
  titre: string
  description?: string | null
  type_droit: string
  statut?: StatutDossier
  priorite?: PrioriteDossier
  avancement?: number
  montant?: number | null
  date_ouverture: string
  date_cloture?: string | null
  avocat_ids?: number[]
}

export function useDossiers(filters: DossierFilters = {}) {
  const { statut, priorite, search, sort, page = 1, per_page = 15 } = filters

  return useQuery<Paginated<Dossier>>({
    queryKey: ['dossiers', { statut, priorite, search, sort, page, per_page }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page }
      const filter: Record<string, string> = {}
      if (statut) filter.statut = statut
      if (priorite) filter.priorite = priorite
      if (search) filter.search = search
      if (Object.keys(filter).length > 0) params.filter = filter
      if (sort) params.sort = sort

      const res = await api.get('/dossiers', { params })
      return res.data
    },
    placeholderData: keepPreviousData,
  })
}

export function useDossierStats() {
  return useQuery<DossiersStats>({
    queryKey: ['dossiers', 'stats'],
    queryFn: async () => {
      const res = await api.get('/dossiers/stats')
      return res.data
    },
  })
}

export function useDossier(id: number | null) {
  return useQuery<Dossier>({
    queryKey: ['dossiers', id],
    queryFn: async () => {
      const res = await api.get(`/dossiers/${id}`)
      return res.data.data ?? res.data
    },
    enabled: id !== null && id > 0,
  })
}

export function useDossierActivites(id: number | null) {
  return useQuery<ActivityEntry[]>({
    queryKey: ['dossiers', id, 'activites'],
    queryFn: async () => {
      const res = await api.get(`/dossiers/${id}/activites`)
      return Array.isArray(res.data) ? res.data : (res.data.data ?? [])
    },
    enabled: id !== null && id > 0,
  })
}

export function useCreateDossier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: DossierPayload) => {
      const res = await api.post('/dossiers', payload)
      return res.data.data ?? res.data
    },
    onSuccess: () => {
      toast.success('Dossier créé avec succès')
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Impossible de créer le dossier.'))
    },
  })
}

export function useUpdateDossier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<DossierPayload> }) => {
      const res = await api.put(`/dossiers/${id}`, data)
      return res.data.data ?? res.data
    },
    onSuccess: (updated) => {
      toast.success('Dossier mis à jour')
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
      queryClient.invalidateQueries({ queryKey: ['dossiers', updated.id] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Impossible de mettre à jour le dossier.'))
    },
  })
}

export function useChangerStatutDossier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      id,
      statut,
      avancement,
    }: {
      id: number
      statut: StatutDossier
      avancement?: number
    }) => {
      const res = await api.patch(`/dossiers/${id}/statut`, { statut, avancement })
      return res.data.data ?? res.data
    },
    onSuccess: () => {
      toast.success('Statut du dossier mis à jour')
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Impossible de changer le statut.'))
    },
  })
}

export function useSynchroniserAvocats() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, avocatIds }: { id: number; avocatIds: number[] }) => {
      const res = await api.post(`/dossiers/${id}/avocats`, { avocat_ids: avocatIds })
      return res.data.data ?? res.data
    },
    onSuccess: () => {
      toast.success('Avocats assignés au dossier')
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Impossible d'affecter les avocats."))
    },
  })
}

export function useDeleteDossier() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/dossiers/${id}`)
    },
    onSuccess: () => {
      toast.success('Dossier supprimé')
      queryClient.invalidateQueries({ queryKey: ['dossiers'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Impossible de supprimer le dossier.'))
    },
  })
}
