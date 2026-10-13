import { z } from 'zod'
import type { ModePaiement } from '@/types'

export const MODES_PAIEMENT: ModePaiement[] = ['especes', 'virement', 'mobile_money', 'cheque']

export const paiementSchema = z.object({
  facture_id: z.number().min(1, 'Sélectionnez une facture à régler.'),
  montant: z.number().int('Montant entier requis.').min(1, 'Le montant est requis.'),
  mode: z.enum(['especes', 'virement', 'mobile_money', 'cheque']),
  date_paiement: z
    .string()
    .min(1, 'La date est requise.')
    .refine((value) => value <= new Date().toISOString().slice(0, 10), {
      message: 'La date ne peut pas être postérieure à aujourd’hui.',
    }),
  reference: z.string().max(100, '100 caractères maximum.'),
  notes: z.string(),
})

export type PaiementFormValues = z.infer<typeof paiementSchema>

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function emptyPaiementValues(): PaiementFormValues {
  return {
    facture_id: 0,
    montant: 0,
    mode: 'especes',
    date_paiement: todayISO(),
    reference: '',
    notes: '',
  }
}
