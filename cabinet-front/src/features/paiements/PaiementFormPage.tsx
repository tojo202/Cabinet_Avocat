import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, CircleAlert, CreditCard, Receipt, Wallet } from 'lucide-react'
import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAjouterPaiement, useFacture, useFactures } from '@/hooks/use-factures'
import { formatAriary, formatDate, MODE_PAIEMENT_LABELS } from '@/lib/format'
import type { Facture } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FieldError } from '@/components/FieldError'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  MODES_PAIEMENT,
  emptyPaiementValues,
  paiementSchema,
  type PaiementFormValues,
} from './paiement-form'

export function PaiementFormPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const presetId = Number(searchParams.get('facture'))
  const hasPreset = Number.isFinite(presetId) && presetId > 0

  const facturesQuery = useFactures({ per_page: 100, page: 1 })
  const presetQuery = useFacture(hasPreset ? presetId : null)
  const paiementMutation = useAjouterPaiement()

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<PaiementFormValues>({
    resolver: zodResolver(paiementSchema),
    defaultValues: emptyPaiementValues(),
  })

  const factureId = watch('facture_id')
  const montant = watch('montant')

  const factures = facturesQuery.data?.data ?? []
  const openFactures = factures.filter(
    (facture) => facture.solde > 0 && facture.statut !== 'annulee',
  )

  // Liste du sélecteur : factures à encaisser + la facture pré-sélectionnée par l'URL.
  const selectFactures: Facture[] = [...openFactures]
  if (presetQuery.data && !selectFactures.some((facture) => facture.id === presetQuery.data?.id)) {
    selectFactures.unshift(presetQuery.data)
  }

  const selected =
    selectFactures.find((facture) => facture.id === factureId) ?? null
  const resteApres = selected
    ? Math.max(0, selected.solde - (Number.isFinite(montant) ? montant : 0))
    : 0

  useEffect(() => {
    const preset = presetQuery.data
    if (!hasPreset || !preset) return
    setValue('facture_id', preset.id)
    setValue('montant', preset.solde)
  }, [hasPreset, presetQuery.data, setValue])

  function handleFactureChange(id: number | null) {
    const facture = selectFactures.find((item) => item.id === id) ?? null
    setValue('facture_id', facture?.id ?? 0, { shouldValidate: true })
    setValue('montant', facture?.solde ?? 0, { shouldValidate: true })
  }

  function onSubmit(values: PaiementFormValues) {
    if (!selected) {
      setError('facture_id', { message: 'Sélectionnez une facture à régler.' })
      return
    }

    if (values.montant > selected.solde) {
      setError('montant', { message: 'Le montant dépasse le solde restant.' })
      return
    }

    paiementMutation.mutate(
      {
        id: selected.id,
        data: {
          montant: values.montant,
          mode: values.mode,
          date_paiement: values.date_paiement,
          reference: values.reference.trim() || null,
          notes: values.notes.trim() || null,
        },
      },
      { onSuccess: () => navigate('/paiements') },
    )
  }

  if (facturesQuery.isError || (hasPreset && presetQuery.isError)) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-16 text-center">
          <CircleAlert className="size-10 text-destructive" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Impossible de charger les factures à encaisser.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/paiements')}>
              Retour aux paiements
            </Button>
            <Button
              size="sm"
              onClick={() => {
                void facturesQuery.refetch()
                if (hasPreset) void presetQuery.refetch()
              }}
            >
              Réessayer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const stillLoading =
    facturesQuery.isLoading || (hasPreset && presetQuery.isLoading && !presetQuery.data)

  if (stillLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  const nothingToPay = selectFactures.length === 0

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div>
        <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/dashboard" className="transition-colors hover:text-foreground">
            Tableau de bord
          </Link>
          <span aria-hidden="true">/</span>
          <Link to="/paiements" className="transition-colors hover:text-foreground">
            Paiements
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">Nouveau</span>
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Nouveau paiement</h1>
          {selected && <Badge variant="outline">{selected.numero}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          Enregistrez un encaissement : choisissez la facture à régler, puis le montant et le mode
          de règlement.
        </p>
      </div>

      {nothingToPay ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Wallet className="size-12 stroke-[1.5] text-muted-foreground/60" />
            <p className="text-base font-medium text-foreground">Aucune facture à encaisser</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Toutes les factures sont réglées ou annulées. Émettez une nouvelle facture pour
              enregistrer un paiement.
            </p>
            <div className="flex items-center gap-2">
              <Link to="/facturation">
                <Button size="sm" variant="outline">
                  <Receipt className="size-4 mr-1.5" />
                  Aller à la facturation
                </Button>
              </Link>
              <Button size="sm" variant="ghost" onClick={() => navigate('/paiements')}>
                Voir les paiements
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <Receipt className="size-4" />
                Facture à régler
              </CardTitle>
              <CardDescription>
                Seules les factures avec un solde restant sont proposées.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Facture</Label>
                <Controller
                  control={control}
                  name="facture_id"
                  render={({ field }) => (
                    <Select
                      items={selectFactures.map((facture) => ({
                        value: facture.id,
                        label: `${facture.numero} — ${facture.client?.nom_complet ?? '—'} — ${formatAriary(facture.solde)}`,
                      }))}
                      value={field.value > 0 ? field.value : null}
                      onValueChange={(value) => handleFactureChange(value)}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-invalid={errors.facture_id ? true : undefined}
                      >
                        <SelectValue placeholder="Sélectionner une facture" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectFactures.map((facture) => (
                          <SelectItem key={facture.id} value={facture.id}>
                            {facture.numero} — {facture.client?.nom_complet ?? '—'} —{' '}
                            {formatAriary(facture.solde)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.facture_id?.message} />
              </div>

              {selected && (
                <div className="grid gap-3 rounded-lg border border-border p-3 text-sm sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Client</p>
                    <p className="font-medium">{selected.client?.nom_complet ?? '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Dossier</p>
                    <p className="font-medium">
                      {selected.dossier
                        ? `${selected.dossier.reference} — ${selected.dossier.titre}`
                        : 'Aucun dossier rattaché'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Montant total</p>
                    <p className="font-medium tabular-nums">
                      {formatAriary(selected.montant_total)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Déjà payé</p>
                    <p className="font-medium tabular-nums">{formatAriary(selected.montant_paye)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Échéance</p>
                    <p className="font-medium">
                      {formatDate(selected.date_echeance)}
                      {selected.is_en_retard && (
                        <span className="ml-1 font-medium text-destructive">en retard</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Solde restant</p>
                    <p className="font-semibold tabular-nums text-amber-600">
                      {formatAriary(selected.solde)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <CreditCard className="size-4" />
                Détails du paiement
              </CardTitle>
              <CardDescription>
                Mode, date et référence de l’encaissement pour le suivi comptable.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="paiement-montant">Montant (Ar)</Label>
                <Input
                  id="paiement-montant"
                  type="number"
                  min={1}
                  max={selected?.solde}
                  step={1}
                  {...register('montant', { valueAsNumber: true })}
                />
                <FieldError message={errors.montant?.message} />
                {selected && (
                  <p className="text-xs text-muted-foreground">
                    Reste dû après ce paiement :{' '}
                    <span className="font-medium text-foreground">{formatAriary(resteApres)}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Mode de paiement</Label>
                <Controller
                  control={control}
                  name="mode"
                  render={({ field }) => (
                    <Select
                      items={MODES_PAIEMENT.map((item) => ({
                        value: item,
                        label: MODE_PAIEMENT_LABELS[item],
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MODES_PAIEMENT.map((item) => (
                          <SelectItem key={item} value={item}>
                            {MODE_PAIEMENT_LABELS[item]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.mode?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="paiement-date">Date</Label>
                <Input id="paiement-date" type="date" {...register('date_paiement')} />
                <FieldError message={errors.date_paiement?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="paiement-reference">Référence</Label>
                <Input
                  id="paiement-reference"
                  placeholder="N° de virement, chèque, transaction…"
                  {...register('reference')}
                />
                <FieldError message={errors.reference?.message} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="paiement-notes">Notes</Label>
                <Textarea
                  id="paiement-notes"
                  rows={3}
                  placeholder="Remarques internes, conditions…"
                  {...register('notes')}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => navigate('/paiements')}
            >
              <ArrowLeft className="size-4 mr-1.5" />
              Annuler
            </Button>
            <Button
              type="submit"
              className="w-full sm:w-auto"
              disabled={paiementMutation.isPending}
            >
              <CreditCard className="size-4 mr-1.5" />
              {paiementMutation.isPending ? 'Enregistrement…' : 'Encaisser'}
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
