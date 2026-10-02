import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api, apiErrorMessage, apiErrorMessageAsync } from '@/lib/axios'
import { downloadFromApi } from '@/lib/download'
import type { Document, DocumentsStats, Paginated } from '@/types'

export interface DocumentFilters {
  search?: string
  categorie_document_id?: number | null
  dossier_id?: number | null
  sort?: string
  page?: number
  per_page?: number
}

export function useDocuments(filters: DocumentFilters = {}) {
  const { search, categorie_document_id, dossier_id, sort, page = 1, per_page = 15 } = filters

  return useQuery<Paginated<Document>>({
    queryKey: ['documents', { search, categorie_document_id, dossier_id, sort, page, per_page }],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, per_page }
      const filter: Record<string, string> = {}
      if (search) filter.search = search
      if (categorie_document_id) filter.categorie_document_id = String(categorie_document_id)
      if (dossier_id) filter.dossier_id = String(dossier_id)
      if (Object.keys(filter).length > 0) params.filter = filter
      if (sort) params.sort = sort

      const res = await api.get('/documents', { params })
      return res.data
    },
    placeholderData: keepPreviousData,
  })
}

export function useDocumentsStats() {
  return useQuery<DocumentsStats>({
    queryKey: ['documents', 'stats'],
    queryFn: async () => {
      const res = await api.get('/documents/stats')
      return res.data
    },
  })
}

export function useUploadDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      file,
      dossier_id,
      categorie_document_id,
    }: {
      file: File
      dossier_id?: number | null
      categorie_document_id?: number | null
    }) => {
      const form = new FormData()
      form.append('file', file)
      if (dossier_id) form.append('dossier_id', String(dossier_id))
      if (categorie_document_id) form.append('categorie_document_id', String(categorie_document_id))

      const res = await api.post('/documents', form)
      return res.data.data ?? res.data
    },
    onSuccess: () => {
      toast.success('Document téléversé avec succès')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: async (error) => {
      toast.error(await apiErrorMessageAsync(error, 'Impossible de téléverser le document.'))
    },
  })
}

export function useDeleteDocument() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/documents/${id}`)
    },
    onSuccess: () => {
      toast.success('Document supprimé')
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      queryClient.invalidateQueries({ queryKey: ['documents', 'stats'] })
    },
    onError: (error) => {
      toast.error(apiErrorMessage(error, 'Impossible de supprimer le document.'))
    },
  })
}

export function useDownloadDocument() {
  return useMutation({
    mutationFn: async (doc: Document) => {
      await downloadFromApi(`/documents/${doc.id}/download`, doc.nom)
    },
    onError: async (error) => {
      toast.error(await apiErrorMessageAsync(error, 'Téléchargement impossible.'))
    },
  })
}
