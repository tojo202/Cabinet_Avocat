import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiErrorMessageAsync } from '@/lib/axios'
import { downloadFromApi } from '@/lib/download'
import type { RapportEvolution, RapportSynthese } from '@/types'

export interface RapportPeriodeFiltre {
  debut?: string
  fin?: string
}

function perimetreParams({ debut, fin }: RapportPeriodeFiltre): Record<string, string> {
  const params: Record<string, string> = {}
  if (debut) params.debut = debut
  if (fin) params.fin = fin
  return params
}

export function useRapportSynthese(periode: RapportPeriodeFiltre) {
  return useQuery<RapportSynthese>({
    queryKey: ['rapports', 'synthese', periode],
    queryFn: async () => {
      const res = await api.get('/rapports/synthese', { params: perimetreParams(periode) })
      return res.data
    },
  })
}

export function useRapportEvolution(periode: RapportPeriodeFiltre) {
  return useQuery<RapportEvolution>({
    queryKey: ['rapports', 'evolution', periode],
    queryFn: async () => {
      const res = await api.get('/rapports/evolution', { params: perimetreParams(periode) })
      return res.data
    },
  })
}

export function useExportRapport() {
  return useMutation({
    mutationFn: async (periode: RapportPeriodeFiltre) => {
      const query = new URLSearchParams(perimetreParams(periode)).toString()
      await downloadFromApi(`/rapports/export${query ? `?${query}` : ''}`, 'rapport.csv')
    },
    onSuccess: () => {
      toast.success('Export du rapport téléchargé')
    },
    onError: async (error) => {
      toast.error(await apiErrorMessageAsync(error, 'Impossible d’exporter le rapport.'))
    },
  })
}
