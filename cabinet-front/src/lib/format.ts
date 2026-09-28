import type {
  ModePaiement,
  PrioriteDossier,
  StatutDossier,
  StatutFacture,
  TypeEvenement,
} from '@/types'

export function formatAriary(montant: number | null | undefined): string {
  if (montant == null) return '—'
  return `${new Intl.NumberFormat('fr-FR').format(montant)} Ar`
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export function formatDateTime(date: string | null | undefined): string {
  if (!date) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export function formatDateRelative(date: string | null | undefined): string {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const jours = Math.round(diff / 86_400_000)
  if (Math.abs(jours) < 1) return "Aujourd'hui"
  if (jours === -1) return 'Demain'
  if (jours === 1) return 'Hier'
  return formatDate(date)
}

export function formatTaille(octets: number | null | undefined): string {
  if (octets == null) return '—'
  if (octets < 1024) return `${octets} o`
  if (octets < 1_048_576) return `${(octets / 1024).toFixed(1)} Ko`
  return `${(octets / 1_048_576).toFixed(1)} Mo`
}

export const STATUT_DOSSIER_LABELS: Record<StatutDossier, string> = {
  en_cours: 'En cours',
  en_revision: 'En révision',
  en_attente: 'En attente',
  cloture: 'Clôturé',
}

export const STATUT_FACTURE_LABELS: Record<StatutFacture, string> = {
  brouillon: 'Brouillon',
  en_attente: 'En attente',
  payee: 'Payée',
  annulee: 'Annulée',
}

export const PRIORITE_LABELS: Record<PrioriteDossier, string> = {
  normale: 'Normale',
  haute: 'Haute',
  urgente: 'Urgente',
}

export const MODE_PAIEMENT_LABELS: Record<ModePaiement, string> = {
  especes: 'Espèces',
  virement: 'Virement',
  mobile_money: 'Mobile Money',
  cheque: 'Chèque',
}

export const TYPE_EVENEMENT_LABELS: Record<TypeEvenement, string> = {
  rendez_vous: 'Rendez-vous',
  audience: 'Audience',
  echeance: 'Échéance',
}

export const TYPE_CLIENT_LABELS = {
  particulier: 'Particulier',
  societe: 'Société',
} as const

export const ROLES_LABELS = {
  admin: 'Administrateur',
  avocat: 'Avocat',
  secretaire: 'Secrétaire',
  comptable: 'Comptable',
} as const
