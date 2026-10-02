import { useCallback, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/axios'

export interface Notification {
  id: string
  type: 'facture_retard' | 'dossier_urgent' | 'evenement_jour'
  criticite: 'haute' | 'moyenne' | 'info'
  titre: string
  message: string
  lien: string
  date: string | null
}

export interface ReponseNotifications {
  data: Notification[]
  total: number
}

const CLE_STOCKAGE = 'cabinet.notifications.lues'
const TAILLE_MAX = 100

function lireLues(): string[] {
  try {
    const brut = localStorage.getItem(CLE_STOCKAGE)
    const valeur: unknown = brut ? JSON.parse(brut) : []
    return Array.isArray(valeur)
      ? valeur.filter((element): element is string => typeof element === 'string')
      : []
  } catch {
    return []
  }
}

function ecrireLues(ids: string[]) {
  localStorage.setItem(CLE_STOCKAGE, JSON.stringify(ids.slice(-TAILLE_MAX)))
}

export function useNotifications() {
  return useQuery<ReponseNotifications>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications')
      return res.data as ReponseNotifications
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useNotificationsLues() {
  const [lues, setLues] = useState<string[]>(lireLues)

  const marquerLue = useCallback((id: string) => {
    setLues((precedent) => {
      if (precedent.includes(id)) return precedent
      const suivant = [...precedent, id]
      ecrireLues(suivant)
      return suivant
    })
  }, [])

  const marquerToutLu = useCallback((ids: string[]) => {
    ecrireLues(ids)
    setLues(ids)
  }, [])

  return { lues, marquerLue, marquerToutLu }
}
