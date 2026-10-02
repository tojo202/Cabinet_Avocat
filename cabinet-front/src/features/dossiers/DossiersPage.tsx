import { zodResolver } from '@hookform/resolvers/zod'
import {
  CircleAlert,
  FolderOpen,
  List,
  LayoutGrid,
  Plus,
  Search,
  Trash2,
  Pencil,
  Users,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useAvocats } from '@/hooks/use-avocats'
import {
  useChangerStatutDossier,
  useCreateDossier,
  useDeleteDossier,
  useDossierStats,
  useDossiers,
  useSynchroniserAvocats,
  useUpdateDossier,
} from '@/hooks/use-dossiers'
import { PRIORITE_LABELS, STATUT_DOSSIER_LABELS, formatDate } from '@/lib/format'
import { useAuth } from '@/store/auth'
import type { Dossier, PrioriteDossier, StatutDossier } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Progress } from '@/components/ui/progress'
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
import { ClientPicker } from '@/components/ClientPicker'

const STATUTS: StatutDossier[] = ['en_cours', 'en_revision', 'en_attente', 'cloture']
const PRIORITES: PrioriteDossier[] = ['normale', 'haute', 'urgente']

const TYPE_DROIT_SUGGESTIONS = [
  'Droit du travail',
  'Droit des affaires',
  'Droit pénal',
  'Droit de la famille',
  'Droit immobilier',
  'Droit fiscal',
  'Droit des contrats',
  'Droit administratif',
]

const dossierSchema = z
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

type DossierFormValues = z.infer<typeof dossierSchema>

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyValues(): DossierFormValues {
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

function toValues(dossier: Dossier | null): DossierFormValues {
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

const STATUT_TONES: Record<StatutDossier, string> = {
  en_cours: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  en_revision: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  en_attente: 'bg-violet-500/10 text-violet-600 border-violet-500/20',
  cloture: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
}

const SEARCH_OPTIONS = [
  { value: '-created_at', label: 'Plus récents' },
  { value: 'date_ouverture', label: 'Date d’ouverture' },
  { value: 'avancement', label: 'Avancement' },
  { value: 'montant', label: 'Montant' },
]

export function DossiersPage() {
  const can = useAuth((s) => s.can)
  const canManage = can('dossiers.manage')

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [priorite, setPriorite] = useState<PrioriteDossier | ''>('')
  const [statut, setStatut] = useState<StatutDossier | ''>('')
  const [sort, setSort] = useState('-created_at')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'liste' | 'kanban'>('liste')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Dossier | null>(null)
  const [deleting, setDeleting] = useState<Dossier | null>(null)
  const [assigning, setAssigning] = useState<Dossier | null>(null)
  const [avocatIds, setAvocatIds] = useState<number[]>([])

  const isKanban = view === 'kanban'

  const listQuery = useDossiers({
    search,
    priorite,
    statut: isKanban ? '' : statut,
    sort,
    page: isKanban ? 1 : page,
    per_page: isKanban ? 100 : 15,
  })
  const statsQuery = useDossierStats()
  const avocatsQuery = useAvocats({ per_page: 100 })

  const createMutation = useCreateDossier()
  const updateMutation = useUpdateDossier()
  const deleteMutation = useDeleteDossier()
  const statutMutation = useChangerStatutDossier()
  const syncMutation = useSynchroniserAvocats()

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<DossierFormValues>({
    resolver: zodResolver(dossierSchema),
    defaultValues: emptyValues(),
  })

  const watchedAvocats = watch('avocat_ids')
  const dossiers = listQuery.data?.data ?? []
  const meta = listQuery.data?.meta
  const stats = statsQuery.data
  const avocats = avocatsQuery.data?.data ?? []

  const saving = createMutation.isPending || updateMutation.isPending

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  function openCreate() {
    setEditing(null)
    reset(emptyValues())
    setFormOpen(true)
  }

  function openEdit(dossier: Dossier) {
    setEditing(dossier)
    reset(toValues(dossier))
    setFormOpen(true)
  }

  function openAssign(dossier: Dossier) {
    setAssigning(dossier)
    setAvocatIds(dossier.avocats?.map((avocat) => avocat.id) ?? [])
  }

  function toggleAvocat(id: number) {
    setAvocatIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    )
  }

  function onSubmit(values: DossierFormValues) {
    const payload = {
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

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setFormOpen(false) },
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => setFormOpen(false) })
    }
  }

  const statCards = [
    { label: 'Total dossiers', value: stats?.total, tone: 'bg-primary/10 text-primary' },
    { label: 'En cours', value: stats?.en_cours, tone: 'bg-blue-500/10 text-blue-600' },
    { label: 'Urgents', value: stats?.urgents, tone: 'bg-destructive/10 text-destructive' },
    { label: 'Clôturés', value: stats?.clotures, tone: 'bg-emerald-500/10 text-emerald-600' },
  ]

  function renderAvancement(dossier: Dossier) {
    return (
      <div className="flex w-28 items-center gap-2">
        <Progress value={dossier.avancement} className="h-2 flex-1" />
        <span className="text-xs text-muted-foreground">{dossier.avancement}%</span>
      </div>
    )
  }

  function renderPrioriteBadge(dossier: Dossier) {
    return (
      <Badge
        variant={
          dossier.priorite === 'urgente'
            ? 'destructive'
            : dossier.priorite === 'haute'
              ? 'default'
              : 'secondary'
        }
      >
        {PRIORITE_LABELS[dossier.priorite]}
      </Badge>
    )
  }

  function renderActions(dossier: Dossier) {
    if (!canManage) return null
    return (
      <div className="flex items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          title="Gérer les avocats assignés"
          onClick={() => openAssign(dossier)}
        >
          <Users />
        </Button>
        <Button variant="ghost" size="icon-sm" title="Modifier" onClick={() => openEdit(dossier)}>
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          title="Supprimer"
          onClick={() => setDeleting(dossier)}
        >
          <Trash2 />
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              Tableau de bord
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">Dossiers</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight">Dossiers juridiques</h1>
          <p className="text-sm text-muted-foreground">
            Ouverture, affectation et suivi des affaires du cabinet
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-1.5" />
            Nouveau dossier
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
                <FolderOpen className="size-4" />
              </div>
            </CardHeader>
            <CardContent>
              {statsQuery.isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div>
                  <div className="text-2xl font-bold">{card.value ?? 0}</div>
                  <p className="mt-1 text-xs text-muted-foreground">Tous statuts confondus</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Suivi des affaires</CardTitle>
            <CardDescription>
              {isKanban
                ? 'Vue Kanban : déplacez vos dossiers d’un statut à l’autre.'
                : 'Liste détaillée avec filtres, avancement et affectations.'}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="w-52 pl-8"
                  placeholder="Référence ou titre…"
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
                { value: 'tous', label: 'Toutes priorités' },
                ...PRIORITES.map((item) => ({ value: item, label: PRIORITE_LABELS[item] })),
              ]}
              value={priorite || 'tous'}
              onValueChange={(value) => {
                setPriorite(value && value !== 'tous' ? (value as PrioriteDossier) : '')
                setPage(1)
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Toutes priorités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Toutes priorités</SelectItem>
                {PRIORITES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {PRIORITE_LABELS[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isKanban && (
              <Select
                items={[
                  { value: 'tous', label: 'Tous les statuts' },
                  ...STATUTS.map((item) => ({ value: item, label: STATUT_DOSSIER_LABELS[item] })),
                ]}
                value={statut || 'tous'}
                onValueChange={(value) => {
                  setStatut(value && value !== 'tous' ? (value as StatutDossier) : '')
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
                      {STATUT_DOSSIER_LABELS[item]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {!isKanban && (
              <Select
                items={SEARCH_OPTIONS}
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
                  {SEARCH_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
              <Button
                variant={view === 'liste' ? 'secondary' : 'ghost'}
                size="icon-sm"
                title="Vue liste"
                onClick={() => setView('liste')}
              >
                <List />
              </Button>
              <Button
                variant={view === 'kanban' ? 'secondary' : 'ghost'}
                size="icon-sm"
                title="Vue Kanban"
                onClick={() => setView('kanban')}
              >
                <LayoutGrid />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {listQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : listQuery.isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CircleAlert className="size-10 text-destructive" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Impossible de charger les dossiers.
              </p>
              <Button variant="outline" size="sm" onClick={() => void listQuery.refetch()}>
                Réessayer
              </Button>
            </div>
          ) : dossiers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <FolderOpen className="size-12 stroke-[1.5] text-muted-foreground/60" />
              <p className="text-base font-medium text-foreground">Aucun dossier trouvé</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {search || priorite || statut
                  ? 'Aucun résultat pour ces filtres.'
                  : 'Ouvrez votre première affaire pour commencer le suivi.'}
              </p>
              {canManage && !search && !priorite && !statut && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="size-4 mr-1.5" />
                  Nouveau dossier
                </Button>
              )}
            </div>
          ) : isKanban ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {STATUTS.map((colStatut) => {
                const colItems = dossiers.filter((dossier) => dossier.statut === colStatut)
                return (
                  <div key={colStatut} className="flex flex-col gap-3">
                    <div
                      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm font-semibold ${STATUT_TONES[colStatut]}`}
                    >
                      <span>{STATUT_DOSSIER_LABELS[colStatut]}</span>
                      <span className="text-xs">{colItems.length}</span>
                    </div>
                    {colItems.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                        Aucun dossier
                      </div>
                    ) : (
                      colItems.map((dossier) => (
                        <div
                          key={dossier.id}
                          className="space-y-3 rounded-lg border border-border bg-card p-3 shadow-xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-foreground">
                                {dossier.titre}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">
                                {dossier.reference} • {dossier.type_droit}
                              </p>
                            </div>
                            {renderPrioriteBadge(dossier)}
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {dossier.client?.nom_complet ?? '—'}
                          </p>
                          {renderAvancement(dossier)}
                          <div className="flex items-center justify-between gap-2">
                            <Select
                              items={STATUTS.map((item) => ({
                                value: item,
                                label: STATUT_DOSSIER_LABELS[item],
                              }))}
                              value={dossier.statut}
                              disabled={!canManage || statutMutation.isPending}
                              onValueChange={(value) => {
                                if (!value || value === dossier.statut) return
                                statutMutation.mutate({
                                  id: dossier.id,
                                  statut: value as StatutDossier,
                                })
                              }}
                            >
                              <SelectTrigger size="sm" className="w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {STATUTS.map((item) => (
                                  <SelectItem key={item} value={item}>
                                    {STATUT_DOSSIER_LABELS[item]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {renderActions(dossier)}
                        </div>
                      ))
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dossier</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Avancement</TableHead>
                    <TableHead>Ouverture</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dossiers.map((dossier) => (
                    <TableRow key={dossier.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{dossier.titre}</span>
                          <span className="text-xs text-muted-foreground">
                            {dossier.reference} • {dossier.type_droit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {dossier.client?.nom_complet ?? '—'}
                      </TableCell>
                      <TableCell>{renderPrioriteBadge(dossier)}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {STATUT_DOSSIER_LABELS[dossier.statut]}
                        </Badge>
                      </TableCell>
                      <TableCell>{renderAvancement(dossier)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(dossier.date_ouverture)}
                      </TableCell>
                      <TableCell>{renderActions(dossier)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!isKanban && (
            <ListPagination meta={meta} page={page} onPageChange={setPage} itemLabel="dossier" />
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le dossier' : 'Nouveau dossier'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Mettez à jour l’état de l’affaire, son avancement et son équipe.'
                : 'Ouvrez une affaire, rattachez-la à un client et affectez les avocats.'}
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

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="dossier-titre">Titre de l’affaire</Label>
                <Input
                  id="dossier-titre"
                  placeholder="Licence commerciale — litige"
                  {...register('titre')}
                />
                <FieldError message={errors.titre?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dossier-type">Type de droit</Label>
                <Input
                  id="dossier-type"
                  list="type-droit-options"
                  {...register('type_droit')}
                />
                <datalist id="type-droit-options">
                  {TYPE_DROIT_SUGGESTIONS.map((option) => (
                    <option key={option} value={option} />
                  ))}
                </datalist>
                <FieldError message={errors.type_droit?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dossier-montant">Montant en jeu (Ar)</Label>
                <Input
                  id="dossier-montant"
                  type="number"
                  min={0}
                  placeholder="0"
                  {...register('montant', {
                    setValueAs: (value) =>
                      value === '' || value === null || value === undefined
                        ? null
                        : Number(value),
                  })}
                />
                <FieldError message={errors.montant?.message} />
              </div>

              <div className="space-y-1.5">
                <Label>Priorité</Label>
                <Controller
                  control={control}
                  name="priorite"
                  render={({ field }) => (
                    <Select
                      items={PRIORITES.map((item) => ({
                        value: item,
                        label: PRIORITE_LABELS[item],
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PRIORITES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {PRIORITE_LABELS[item]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.priorite?.message} />
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
                        label: STATUT_DOSSIER_LABELS[item],
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
                            {STATUT_DOSSIER_LABELS[item]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.statut?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dossier-ouverture">Date d’ouverture</Label>
                <Input
                  id="dossier-ouverture"
                  type="date"
                  max={todayISO()}
                  {...register('date_ouverture')}
                />
                <FieldError message={errors.date_ouverture?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dossier-cloture">Date de clôture</Label>
                <Input id="dossier-cloture" type="date" {...register('date_cloture')} />
                <FieldError message={errors.date_cloture?.message} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="dossier-avancement">Avancement</Label>
                  <span className="text-xs font-medium text-muted-foreground">
                    {watch('avancement') ?? 0}%
                  </span>
                </div>
                <Input
                  id="dossier-avancement"
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  {...register('avancement', { valueAsNumber: true })}
                />
                <FieldError message={errors.avancement?.message} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="dossier-description">Description</Label>
                <Textarea
                  id="dossier-description"
                  rows={3}
                  placeholder="Contexte, pièces reçues, prochaines étapes…"
                  {...register('description')}
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Avocats affectés</Label>
                {avocatsQuery.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : avocats.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aucun avocat disponible dans le cabinet.
                  </p>
                ) : (
                  <div className="grid gap-2 rounded-lg border border-border p-3 sm:grid-cols-2">
                    {avocats.map((avocat) => (
                      <label
                        key={avocat.id}
                        className="flex cursor-pointer items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={(watchedAvocats ?? []).includes(avocat.id)}
                          onChange={() => toggleAvocat(avocat.id)}
                        />
                        <span>{avocat.nom_complet}</span>
                        {avocat.specialite && (
                          <span className="text-xs text-muted-foreground">
                            • {avocat.specialite}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
                {errors.avocat_ids?.message && <FieldError message={errors.avocat_ids.message} />}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFormOpen(false)}
              >
                Annuler
              </Button>
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer le dossier'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={assigning !== null}
        onOpenChange={(open) => !open && setAssigning(null)}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Avocats assignés</DialogTitle>
            <DialogDescription>
              {assigning ? `${assigning.reference} — ${assigning.titre}` : ''}
            </DialogDescription>
          </DialogHeader>
          {avocatsQuery.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : avocats.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun avocat disponible.</p>
          ) : (
            <div className="max-h-72 space-y-2 overflow-y-auto rounded-lg border border-border p-3">
              {avocats.map((avocat) => (
                <label
                  key={avocat.id}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <Checkbox
                    checked={avocatIds.includes(avocat.id)}
                    onChange={() => toggleAvocat(avocat.id)}
                  />
                  <span className="flex-1">{avocat.nom_complet}</span>
                  {avocat.specialite && (
                    <span className="text-xs text-muted-foreground">{avocat.specialite}</span>
                  )}
                  {avocat.dossiers_count != null && (
                    <Badge variant="secondary">{avocat.dossiers_count} dossiers</Badge>
                  )}
                </label>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAssigning(null)}
            >
              Annuler
            </Button>
            <Button
              size="sm"
              disabled={syncMutation.isPending}
              onClick={() => {
                if (!assigning) return
                syncMutation.mutate(
                  { id: assigning.id, avocatIds },
                  { onSuccess: () => setAssigning(null) },
                )
              }}
            >
              {syncMutation.isPending ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Supprimer le dossier"
        description={`Le dossier ${deleting?.reference ?? ''} sera définitivement supprimé, avec ses pièces et événements rattachés.`}
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
