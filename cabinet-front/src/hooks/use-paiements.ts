import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'
import type { ModePaiement, PaiementAvecFacture, PaiementsStats, Paginated } from '@/types'

export interface PaiementFilters {
  mode?: ModePaiement | ''
  facture_id?: number | null
  page?: number
  per_page?: number
}

export function usePaiements(filters: PaiementFilters = {}) {
  const { mode, facture_id, page = 1, per_page = 15 } = filters

  return useQuery<Paginated<PaiementAvecFacture>>({
    queryKey: ['paiements', { mode, facture_id, page, per_page }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page }
      const filter: Record<string, string> = {}
      if (mode) filter.mode = mode
      if (facture_id) filter.facture_id = String(facture_id)
      if (Object.keys(filter).length > 0) params.filter = filter

      const res = await api.get('/paiements', { params })
      return res.data
    },
    placeholderData: keepPreviousData,
  })
}

export function usePaiementsStats() {
  return useQuery<PaiementsStats>({
    queryKey: ['paiements', 'stats'],
    queryFn: async () => {
      const res = await api.get('/paiements/stats')
      return res.data
    },
  })
}
