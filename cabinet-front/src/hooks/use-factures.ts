import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiErrorMessage, apiErrorMessageAsync } from '@/lib/axios'
import { downloadFromApi } from '@/lib/download'
import type {
  Facture,
  FacturesStats,
  ModePaiement,
  Paginated,
  StatutFacture,
} from '@/types'

export interface FactureFilters {
  statut?: StatutFacture | ''
  client_id?: number | null
  search?: string
  sort?: string
  page?: number
  per_page?: number
}

export interface FactureLignePayload {
  designation: string
  quantite: number
  prix_unitaire: number
}

export interface FacturePayload {
  client_id: number
  dossier_id?: number | null
  date_facture: string
  date_echeance: string
  statut?: StatutFacture
  notes?: string | null
  lignes: FactureLignePayload[]
}

export interface PaiementPayload {
  montant: number
  mode: ModePaiement
  date_paiement: string
  reference?: string | null
  notes?: string | null
}

export function useFactures(filters: FactureFilters = {}) {
  const { statut, client_id, search, sort, page = 1, per_page = 15 } = filters

  return useQuery<Paginated<Facture>>({
    queryKey: ['factures', { statut, client_id, search, sort, page, per_page }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page }
      const filter: Record<string, string> = {}
      if (statut) filter.statut = statut
      if (client_id) filter.client_id = String(client_id)
      if (search) filter.search = search
      if (Object.keys(filter).length > 0) params.filter = filter
      if (sort) params.sort = sort

      const res = await api.get('/factures', { params })
      return res.data
    },
    placeholderData: keepPreviousData,
  })
}

export function useFactureStats() {
  return useQuery<FacturesStats>({
    queryKey: ['factures', 'stats'],
    queryFn: async () => {
      const res = await api.get('/factures/stats')
      return res.data
    },
  })
}

export function useFacture(id: number | null) {
  return useQuery<Facture>({
    queryKey: ['factures', id],
    queryFn: async () => {
      const res = await api.get(`/factures/${id}`)
      return res.data.data ?? res.data
    },
    enabled: id !== null && id > 0,
  })
}

export function useCreateFacture() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: FacturePayload) => {
      const res = await api.post('/factures', payload)
      return res.data.data ?? res.data
    },
    onSuccess: () => {
      toast.success('Facture créée avec succès')
      queryClient.invalidateQueries({ queryKey: ['factures'] })
      queryClient.invalidateQueries({ queryKey: ['factures', 'stats'] })
    },
    onError: async (error) => {
      toast.error(await apiErrorMessageAsync(error, 'Impossible de créer la facture.'))
    },
  })
}

export function useUpdateFacture() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FacturePayload }) => {
      const res = await api.put(`/factures/${id}`, data)
      return res.data.data ?? res.data
    },
    onSuccess: () => {
      toast.success('Facture mise à jour')
      queryClient.invalidateQueries({ queryKey: ['factures'] })
    },
    onError: async (error) => {
      toast.error(await apiErrorMessageAsync(error, 'Impossible de modifier la facture.'))
    },
  })
}

export function useDeleteFacture() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/factures/${id}`)
    },
    onSuccess: () => {
      toast.success('Facture supprimée')
      queryClient.invalidateQueries({ queryKey: ['factures'] })
      queryClient.invalidateQueries({ queryKey: ['factures', 'stats'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Impossible de supprimer la facture.'))
    },
  })
}

export function useTelechargerFacturePdf() {
  return useMutation({
    mutationFn: async (facture: Facture) => {
      await downloadFromApi(`/factures/${facture.id}/pdf`, `${facture.numero}.pdf`)
    },
    onError: async (error) => {
      toast.error(await apiErrorMessageAsync(error, 'Téléchargement du PDF impossible.'))
    },
  })
}

export function useAjouterPaiement() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: PaiementPayload }) => {
      const res = await api.post(`/factures/${id}/paiements`, data)
      return res.data as { paiement: unknown; facture: Facture }
    },
    onSuccess: () => {
      toast.success('Paiement enregistré')
      queryClient.invalidateQueries({ queryKey: ['factures'] })
      queryClient.invalidateQueries({ queryKey: ['factures', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['paiements'] })
    },
    onError: async (error) => {
      toast.error(await apiErrorMessageAsync(error, 'Impossible d’enregistrer le paiement.'))
    },
  })
}
