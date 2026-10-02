import { zodResolver } from '@hookform/resolvers/zod'
import {
  CircleAlert,
  CreditCard,
  Download,
  FileText,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Controller, useFieldArray, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useDossiers } from '@/hooks/use-dossiers'
import {
  useAjouterPaiement,
  useCreateFacture,
  useDeleteFacture,
  useFactureStats,
  useFactures,
  useTelechargerFacturePdf,
  useUpdateFacture,
} from '@/hooks/use-factures'
import {
  formatAriary,
  formatDate,
  MODE_PAIEMENT_LABELS,
  STATUT_FACTURE_LABELS,
} from '@/lib/format'
import { useAuth } from '@/store/auth'
import type { Facture, ModePaiement, StatutFacture } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ClientPicker } from '@/components/ClientPicker'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError } from '@/components/FieldError'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ListPagination } from '@/components/ListPagination'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'

const STATUTS: StatutFacture[] = ['brouillon', 'en_attente', 'payee', 'annulee']
const MODES: ModePaiement[] = ['especes', 'virement', 'mobile_money', 'cheque']

const factureSchema = z
  .object({
    client_id: z.number().min(1, 'Sélectionnez un client.'),
    dossier_id: z.number().nullable(),
    date_facture: z.string().min(1, 'La date est requise.'),
    date_echeance: z.string().min(1, "L'échéance est requise."),
    statut: z.enum(['brouillon', 'en_attente', 'payee', 'annulee']),
    notes: z.string(),
    lignes: z
      .array(
        z.object({
          designation: z.string().min(1, 'Désignation requise.'),
          quantite: z.number().int('Entier requis.').min(1, 'Minimum 1.'),
          prix_unitaire: z.number().int('Entier requis.').min(0, 'Montant invalide.'),
        }),
      )
      .min(1, 'Ajoutez au moins une ligne.'),
  })
  .superRefine((values, ctx) => {
    if (values.date_echeance < values.date_facture) {
      ctx.addIssue({
        code: 'custom',
        path: ['date_echeance'],
        message: "L'échéance doit suivre la date de facture.",
      })
    }
  })

type FactureFormValues = z.infer<typeof factureSchema>

const paiementSchema = z.object({
  montant: z.number().int('Montant entier requis.').min(1, 'Le montant est requis.'),
  mode: z.enum(['especes', 'virement', 'mobile_money', 'cheque']),
  date_paiement: z.string().min(1, 'La date est requise.'),
  reference: z.string().max(100, '100 caractères maximum.'),
  notes: z.string(),
})

type PaiementFormValues = z.infer<typeof paiementSchema>

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function plusDaysISO(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function emptyFactureValues(): FactureFormValues {
  return {
    client_id: 0,
    dossier_id: null,
    date_facture: todayISO(),
    date_echeance: plusDaysISO(30),
    statut: 'en_attente',
    notes: '',
    lignes: [{ designation: '', quantite: 1, prix_unitaire: 0 }],
  }
}

function toFactureValues(facture: Facture): FactureFormValues {
  return {
    client_id: facture.client_id,
    dossier_id: facture.dossier_id,
    date_facture: facture.date_facture,
    date_echeance: facture.date_echeance,
    statut: facture.statut,
    notes: facture.notes ?? '',
    lignes:
      facture.lignes && facture.lignes.length > 0
        ? facture.lignes.map((ligne) => ({
            designation: ligne.designation,
            quantite: ligne.quantite,
            prix_unitaire: ligne.prix_unitaire,
          }))
        : [{ designation: '', quantite: 1, prix_unitaire: 0 }],
  }
}

function emptyPaiementValues(): PaiementFormValues {
  return {
    montant: 0,
    mode: 'especes',
    date_paiement: todayISO(),
    reference: '',
    notes: '',
  }
}

function statutBadge(statut: StatutFacture) {
  const variant =
    statut === 'payee'
      ? 'default'
      : statut === 'annulee'
        ? 'destructive'
        : statut === 'en_attente'
          ? 'secondary'
          : 'outline'
  return <Badge variant={variant}>{STATUT_FACTURE_LABELS[statut]}</Badge>
}

const SORT_OPTIONS = [
  { value: '-date_facture', label: 'Plus récentes' },
  { value: 'date_echeance', label: 'Échéance' },
  { value: 'montant_total', label: 'Montant' },
]

export function FacturationPage() {
  const can = useAuth((s) => s.can)
  const canManage = can('factures.manage')

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState<StatutFacture | ''>('')
  const [sort, setSort] = useState('-date_facture')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Facture | null>(null)
  const [deleting, setDeleting] = useState<Facture | null>(null)
  const [paiementFor, setPaiementFor] = useState<Facture | null>(null)

  const listQuery = useFactures({ search, statut, sort, page })
  const statsQuery = useFactureStats()
  const dossiersQuery = useDossiers({ per_page: 100 })

  const createMutation = useCreateFacture()
  const updateMutation = useUpdateFacture()
  const deleteMutation = useDeleteFacture()
  const pdfMutation = useTelechargerFacturePdf()
  const paiementMutation = useAjouterPaiement()

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FactureFormValues>({
    resolver: zodResolver(factureSchema),
    defaultValues: emptyFactureValues(),
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'lignes' })

  const {
    control: paiementControl,
    register: paiementRegister,
    handleSubmit: handlePaiementSubmit,
    reset: resetPaiement,
    formState: { errors: paiementErrors },
  } = useForm<PaiementFormValues>({
    resolver: zodResolver(paiementSchema),
    defaultValues: emptyPaiementValues(),
  })

  const factures = listQuery.data?.data ?? []
  const meta = listQuery.data?.meta
  const stats = statsQuery.data
  const dossiers = dossiersQuery.data?.data ?? []
  const selectedClientId = watch('client_id')
  const lignes = watch('lignes') ?? []

  const saving = createMutation.isPending || updateMutation.isPending
  const lignesTotal = lignes.reduce(
    (sum, ligne) => sum + (ligne?.quantite ?? 0) * (ligne?.prix_unitaire ?? 0),
    0,
  )

  const dossiersDuClient = dossiers.filter((dossier) => dossier.client_id === selectedClientId)

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  function openCreate() {
    setEditing(null)
    reset(emptyFactureValues())
    setFormOpen(true)
  }

  function openEdit(facture: Facture) {
    setEditing(facture)
    reset(toFactureValues(facture))
    setFormOpen(true)
  }

  function openPaiement(facture: Facture) {
    setPaiementFor(facture)
    resetPaiement({
      ...emptyPaiementValues(),
      montant: facture.solde > 0 ? facture.solde : facture.montant_total,
    })
  }

  function onSubmit(values: FactureFormValues) {
    const payload = {
      client_id: values.client_id,
      dossier_id: values.dossier_id,
      date_facture: values.date_facture,
      date_echeance: values.date_echeance,
      statut: values.statut,
      notes: values.notes.trim() || null,
      lignes: values.lignes.map((ligne) => ({
        designation: ligne.designation.trim(),
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire,
      })),
    }

    if (editing) {
      updateMutation.mutate({ id: editing.id, data: payload }, { onSuccess: () => setFormOpen(false) })
    } else {
      createMutation.mutate(payload, { onSuccess: () => setFormOpen(false) })
    }
  }

  function onPaiementSubmit(values: PaiementFormValues) {
    if (!paiementFor) return
    paiementMutation.mutate(
      {
        id: paiementFor.id,
        data: {
          montant: values.montant,
          mode: values.mode,
          date_paiement: values.date_paiement,
          reference: values.reference.trim() || null,
          notes: values.notes.trim() || null,
        },
      },
      { onSuccess: () => setPaiementFor(null) },
    )
  }

  const statCards = [
    {
      label: 'Total facturé',
      value: formatAriary(stats?.total_toutes),
      hint: `${stats?.total_factures ?? 0} facture(s)`,
      tone: 'bg-primary/10 text-primary',
    },
    {
      label: 'Encaissé',
      value: formatAriary(stats?.paye),
      hint: 'Factures payées',
      tone: 'bg-emerald-500/10 text-emerald-600',
    },
    {
      label: 'En attente',
      value: formatAriary(stats?.en_attente),
      hint: 'Impayées à ce jour',
      tone: 'bg-amber-500/10 text-amber-600',
    },
    {
      label: 'En retard',
      value: formatAriary(stats?.en_retard),
      hint: 'Échéance dépassée',
      tone: 'bg-destructive/10 text-destructive',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              Tableau de bord
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">Facturation</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight">Facturation</h1>
          <p className="text-sm text-muted-foreground">
            Émission des factures d’honoraires, PDF et encaissements
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-1.5" />
            Nouvelle facture
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.label}
              </CardTitle>
              <div className={`flex size-8 items-center justify-center rounded-lg ${card.tone}`}>
                <FileText className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Factures</CardTitle>
            <CardDescription>Suivi des honoraires émis et de leur règlement</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="w-48 pl-8"
                  placeholder="N° de facture…"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                />
              </div>
              <Button type="submit" size="sm">
                <Search className="size-4 mr-1.5" />
                Rechercher
              </Button>
            </form>
            <Select
              items={[
                { value: 'tous', label: 'Tous les statuts' },
                ...STATUTS.map((item) => ({ value: item, label: STATUT_FACTURE_LABELS[item] })),
              ]}
              value={statut || 'tous'}
              onValueChange={(value) => {
                setStatut(value && value !== 'tous' ? (value as StatutFacture) : '')
                setPage(1)
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les statuts</SelectItem>
                {STATUTS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {STATUT_FACTURE_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              items={SORT_OPTIONS}
              value={sort}
              onValueChange={(value) => {
                if (!value) return
                setSort(value)
                setPage(1)
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : listQuery.isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CircleAlert className="size-10 text-destructive" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Impossible de charger les factures.
              </p>
              <Button variant="outline" size="sm" onClick={() => void listQuery.refetch()}>
                Réessayer
              </Button>
            </div>
          ) : factures.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <FileText className="size-12 stroke-[1.5] text-muted-foreground/60" />
              <p className="text-base font-medium text-foreground">Aucune facture</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {search || statut
                  ? 'Aucun résultat pour ces filtres.'
                  : 'Émettez votre première facture d’honoraires.'}
              </p>
              {canManage && !search && !statut && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="size-4 mr-1.5" />
                  Nouvelle facture
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Payé / Solde</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {factures.map((facture) => (
                    <TableRow key={facture.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{facture.numero}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(facture.date_facture)}
                            {facture.dossier ? ` • ${facture.dossier.reference}` : ''}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {facture.client?.nom_complet ?? '—'}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(facture.date_echeance)}
                        {facture.is_en_retard && (
                          <span className="ml-1 font-medium text-destructive">retard</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatAriary(facture.montant_total)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatAriary(facture.montant_paye)} /{' '}
                        <span className="text-foreground">{formatAriary(facture.solde)}</span>
                      </TableCell>
                      <TableCell>{statutBadge(facture.statut)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Télécharger le PDF"
                            disabled={pdfMutation.isPending}
                            onClick={() => pdfMutation.mutate(facture)}
                          >
                            <Download />
                          </Button>
                          {canManage && facture.solde > 0 && facture.statut !== 'annulee' && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Enregistrer un paiement"
                              onClick={() => openPaiement(facture)}
                            >
                              <CreditCard />
                            </Button>
                          )}
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Modifier"
                                onClick={() => openEdit(facture)}
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Supprimer"
                                onClick={() => setDeleting(facture)}
                              >
                                <Trash2 />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <ListPagination meta={meta} page={page} onPageChange={setPage} itemLabel="facture" />
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier la facture' : 'Nouvelle facture'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Les lignes sont remplacées à chaque enregistrement.'
                : 'Définissez le client, les dates et les lignes d’honoraires.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Client</Label>
                <Controller
                  control={control}
                  name="client_id"
                  render={({ field }) => (
                    <ClientPicker
                      value={field.value > 0 ? field.value : null}
                      invalid={Boolean(errors.client_id)}
                      onChange={(client) => field.onChange(client?.id ?? 0)}
                    />
                  )}
                />
                <FieldError message={errors.client_id?.message} />
              </div>

              <div className="space-y-1.5">
                <Label>Dossier rattaché</Label>
                <Controller
                  control={control}
                  name="dossier_id"
                  render={({ field }) => (
                    <Select
                      items={dossiersDuClient.map((dossier) => ({
                        value: dossier.id,
                        label: `${dossier.reference} — ${dossier.titre}`,
                      }))}
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Aucun dossier" />
                      </SelectTrigger>
                      <SelectContent>
                        {dossiersDuClient.map((dossier) => (
                          <SelectItem key={dossier.id} value={dossier.id}>
                            {dossier.reference} — {dossier.titre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Statut</Label>
                <Controller
                  control={control}
                  name="statut"
                  render={({ field }) => (
                    <Select
                      items={STATUTS.map((item) => ({
                        value: item,
                        label: STATUT_FACTURE_LABELS[item],
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUTS.map((item) => (
                          <SelectItem key={item} value={item}>
                            {STATUT_FACTURE_LABELS[item]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="facture-date">Date de facture</Label>
                <Input id="facture-date" type="date" {...register('date_facture')} />
                <FieldError message={errors.date_facture?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="facture-echeance">Échéance</Label>
                <Input id="facture-echeance" type="date" {...register('date_echeance')} />
                <FieldError message={errors.date_echeance?.message} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="facture-notes">Notes</Label>
                <Textarea
                  id="facture-notes"
                  rows={2}
                  placeholder="Conditions de règlement, mentions…"
                  {...register('notes')}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Lignes d’honoraires</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ designation: '', quantite: 1, prix_unitaire: 0 })}
                >
                  <Plus className="size-4 mr-1.5" />
                  Ajouter une ligne
                </Button>
              </div>

              <div className="space-y-3 rounded-lg border border-border p-3">
                {fields.map((field, index) => (
                  <div key={field.id} className="grid gap-2 sm:grid-cols-[1fr_90px_130px_auto]">
                    <div className="space-y-1">
                      <Input
                        placeholder="Désignation"
                        aria-label="Désignation"
                        {...register(`lignes.${index}.designation`)}
                      />
                      <FieldError message={errors.lignes?.[index]?.designation?.message} />
                    </div>
                    <div className="space-y-1">
                      <Input
                        type="number"
                        min={1}
                        aria-label="Quantité"
                        {...register(`lignes.${index}.quantite`, { valueAsNumber: true })}
                      />
                      <FieldError message={errors.lignes?.[index]?.quantite?.message} />
                    </div>
                    <div className="space-y-1">
                      <Input
                        type="number"
                        min={0}
                        aria-label="Prix unitaire"
                        {...register(`lignes.${index}.prix_unitaire`, { valueAsNumber: true })}
                      />
                      <FieldError message={errors.lignes?.[index]?.prix_unitaire?.message} />
                    </div>
                    <div className="flex items-start gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        title="Supprimer la ligne"
                        disabled={fields.length === 1}
                        onClick={() => remove(index)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
                  <span className="text-muted-foreground">Total HT</span>
                  <span className="font-semibold">{formatAriary(lignesTotal)}</span>
                </div>
                <FieldError message={errors.lignes?.message} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" size="sm" onClick={() => setFormOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer la facture'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={paiementFor !== null}
        onOpenChange={(open) => !open && setPaiementFor(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Enregistrer un paiement</DialogTitle>
            <DialogDescription>
              {paiementFor
                ? `${paiementFor.numero} — solde restant ${formatAriary(paiementFor.solde)}`
                : ''}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handlePaiementSubmit(onPaiementSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="paiement-montant">Montant (Ar)</Label>
                <Input
                  id="paiement-montant"
                  type="number"
                  min={1}
                  {...paiementRegister('montant', { valueAsNumber: true })}
                />
                <FieldError message={paiementErrors.montant?.message} />
              </div>

              <div className="space-y-1.5">
                <Label>Mode de paiement</Label>
                <Controller
                  control={paiementControl}
                  name="mode"
                  render={({ field }) => (
                    <Select
                      items={MODES.map((item) => ({
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
                        {MODES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {MODE_PAIEMENT_LABELS[item]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="paiement-date">Date</Label>
                <Input
                  id="paiement-date"
                  type="date"
                  {...paiementRegister('date_paiement')}
                />
                <FieldError message={paiementErrors.date_paiement?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="paiement-reference">Référence</Label>
                <Input
                  id="paiement-reference"
                  placeholder="Virement, chèque…"
                  {...paiementRegister('reference')}
                />
                <FieldError message={paiementErrors.reference?.message} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="paiement-notes">Notes</Label>
                <Textarea
                  id="paiement-notes"
                  rows={2}
                  {...paiementRegister('notes')}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPaiementFor(null)}
              >
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={paiementMutation.isPending}>
                {paiementMutation.isPending ? 'Enregistrement…' : 'Encaisser'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Supprimer la facture"
        description={`La facture ${deleting?.numero ?? ''} et ses lignes seront définitivement supprimées.`}
        confirmLabel="Supprimer"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleting) return
          deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }}
      />
    </div>
  )
}
