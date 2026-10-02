import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiErrorMessage } from '@/lib/axios'
import type { ParametresCabinet } from '@/types'

export function useSettings() {
  return useQuery<ParametresCabinet>({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings')
      return res.data.data as ParametresCabinet
    },
  })
}

export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (parametres: Partial<ParametresCabinet>) => {
      const res = await api.put('/settings', { parametres })
      return res.data.data as ParametresCabinet
    },
    onSuccess: (data) => {
      toast.success('Paramètres enregistrés.')
      queryClient.setQueryData(['settings'], data)
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, "Impossible d'enregistrer les paramètres."))
    },
  })
}
