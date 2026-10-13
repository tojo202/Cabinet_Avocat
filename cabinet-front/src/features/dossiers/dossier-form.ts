import { z } from 'zod'
import type { DossierPayload } from '@/hooks/use-dossiers'
import type { Dossier, PrioriteDossier, StatutDossier } from '@/types'

export const STATUTS: StatutDossier[] = ['en_cours', 'en_revision', 'en_attente', 'cloture']
export const PRIORITES: PrioriteDossier[] = ['normale', 'haute', 'urgente']

export const TYPE_DROIT_SUGGESTIONS = [
  'Droit du travail',
  'Droit des affaires',
  'Droit pénal',
  'Droit de la famille',
  'Droit immobilier',
  'Droit fiscal',
  'Droit des contrats',
  'Droit administratif',
]

export const dossierSchema = z
  .object({
    client_id: z.number().min(1, 'Sélectionnez un client.'),
    titre: z.string().min(1, 'Le titre est requis.').max(255),
    description: z.string(),
    type_droit: z.string().min(1, 'Le type de droit est requis.').max(100),
    statut: z.enum(['en_cours', 'en_revision', 'en_attente', 'cloture']),
    priorite: z.enum(['normale', 'haute', 'urgente']),
    avancement: z.number().min(0).max(100, 'Entre 0 et 100.'),
    montant: z.number().min(0).nullable(),
    date_ouverture: z
      .string()
      .min(1, 'La date d’ouverture est requise.')
      .refine((value) => value <= new Date().toISOString().slice(0, 10), {
        message: 'La date ne peut pas être postérieure à aujourd’hui.',
      }),
    date_cloture: z.string(),
    avocat_ids: z.array(z.number()),
  })
  .superRefine((values, ctx) => {
    if (values.date_cloture && values.date_cloture < values.date_ouverture) {
      ctx.addIssue({
        code: 'custom',
        path: ['date_cloture'],
        message: 'La date de clôture doit suivre la date d’ouverture.',
      })
    }
  })

export type DossierFormValues = z.infer<typeof dossierSchema>

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function emptyValues(): DossierFormValues {
  return {
    client_id: 0,
    titre: '',
    description: '',
    type_droit: '',
    statut: 'en_cours',
    priorite: 'normale',
    avancement: 0,
    montant: null,
    date_ouverture: todayISO(),
    date_cloture: '',
    avocat_ids: [],
  }
}

export function toValues(dossier: Dossier | null): DossierFormValues {
  if (!dossier) return emptyValues()
  return {
    client_id: dossier.client_id,
    titre: dossier.titre,
    description: dossier.description ?? '',
    type_droit: dossier.type_droit,
    statut: dossier.statut,
    priorite: dossier.priorite,
    avancement: dossier.avancement,
    montant: dossier.montant,
    date_ouverture: dossier.date_ouverture,
    date_cloture: dossier.date_cloture ?? '',
    avocat_ids: dossier.avocats?.map((avocat) => avocat.id) ?? [],
  }
}

export function toPayload(values: DossierFormValues): DossierPayload {
  return {
    client_id: values.client_id,
    titre: values.titre.trim(),
    description: values.description.trim() || null,
    type_droit: values.type_droit.trim(),
    statut: values.statut,
    priorite: values.priorite,
    avancement: values.avancement,
    montant: values.montant,
    date_ouverture: values.date_ouverture,
    date_cloture: values.date_cloture || null,
    avocat_ids: values.avocat_ids,
  }
}
