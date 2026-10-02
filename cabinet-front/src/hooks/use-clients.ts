import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiErrorMessage, apiErrorMessageAsync } from '@/lib/axios'
import { downloadFromApi } from '@/lib/download'
import type { Client, ClientsStats, Paginated, TypeClient } from '@/types'

export interface ClientFilters {
  search?: string
  type?: TypeClient | ''
  sort?: string
  page?: number
  per_page?: number
}

export interface ClientPayload {
  type_client: TypeClient
  nom: string
  prenom?: string | null
  raison_sociale?: string | null
  email?: string | null
  telephone?: string | null
  adresse?: string | null
  nif?: string | null
  stat?: string | null
  actif?: boolean
}

export function useClients(filters: ClientFilters = {}) {
  const { search, type, sort, page = 1, per_page = 15 } = filters

  return useQuery<Paginated<Client>>({
    queryKey: ['clients', { search, type, sort, page, per_page }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page }
      const filter: Record<string, string> = {}
      if (search) filter.search = search
      if (type) filter.type = type
      if (Object.keys(filter).length > 0) params.filter = filter
      if (sort) params.sort = sort

      const res = await api.get('/clients', { params })
      return res.data
    },
    placeholderData: keepPreviousData,
  })
}

export function useClientStats() {
  return useQuery<ClientsStats>({
    queryKey: ['clients', 'stats'],
    queryFn: async () => {
      const res = await api.get('/clients/stats')
      return res.data
    },
  })
}

export function useCreateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: ClientPayload) => {
      const res = await api.post('/clients', payload)
      return res.data.data ?? res.data
    },
    onSuccess: () => {
      toast.success('Client créé avec succès')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Impossible de créer le client.'))
    },
  })
}

export function useUpdateClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ClientPayload }) => {
      const res = await api.put(`/clients/${id}`, data)
      return res.data.data ?? res.data
    },
    onSuccess: () => {
      toast.success('Client mis à jour')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Impossible de mettre à jour le client.'))
    },
  })
}

export function useDeleteClient() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/clients/${id}`)
    },
    onSuccess: () => {
      toast.success('Client supprimé')
      queryClient.invalidateQueries({ queryKey: ['clients'] })
      queryClient.invalidateQueries({ queryKey: ['clients', 'stats'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Impossible de supprimer le client.'))
    },
  })
}

export function useExportClients() {
  return useMutation({
    mutationFn: async () => {
      await downloadFromApi('/clients/export', 'clients.csv')
    },
    onSuccess: () => {
      toast.success('Export des clients téléchargé')
    },
    onError: async (error) => {
      toast.error(await apiErrorMessageAsync(error, "Impossible d'exporter les clients."))
    },
  })
}
