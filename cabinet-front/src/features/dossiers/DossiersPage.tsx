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
import { Link, useNavigate } from 'react-router-dom'
import { useAvocats } from '@/hooks/use-avocats'
import {
  useChangerStatutDossier,
  useDeleteDossier,
  useDossierStats,
  useDossiers,
  useSynchroniserAvocats,
} from '@/hooks/use-dossiers'
import { PRIORITES, STATUTS } from './dossier-form'
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
import { Input } from '@/components/ui/input'
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

const STATUT_TONES: Record<StatutDossier, string> = {
  en_cours: 'bg-brown/10 text-brown border-brown/20',
  en_revision: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  en_attente: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  cloture: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
}

const SEARCH_OPTIONS = [
  { value: '-created_at', label: 'Plus récents' },
  { value: 'date_ouverture', label: 'Date d’ouverture' },
  { value: 'avancement', label: 'Avancement' },
  { value: 'montant', label: 'Montant' },
]

export function DossiersPage() {
  const navigate = useNavigate()
  const can = useAuth((s) => s.can)
  const canManage = can('dossiers.manage')

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [priorite, setPriorite] = useState<PrioriteDossier | ''>('')
  const [statut, setStatut] = useState<StatutDossier | ''>('')
  const [sort, setSort] = useState('-created_at')
  const [page, setPage] = useState(1)
  const [view, setView] = useState<'liste' | 'kanban'>('liste')

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

  const deleteMutation = useDeleteDossier()
  const statutMutation = useChangerStatutDossier()
  const syncMutation = useSynchroniserAvocats()

  const dossiers = listQuery.data?.data ?? []
  const meta = listQuery.data?.meta
  const stats = statsQuery.data
  const avocats = avocatsQuery.data?.data ?? []

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  function goToCreate() {
    navigate('/dossiers/nouveau')
  }

  function goToEdit(dossier: Dossier) {
    navigate(`/dossiers/${dossier.id}/modifier`)
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

  const statCards = [
    { label: 'Total dossiers', value: stats?.total, tone: 'bg-primary/10 text-primary' },
    { label: 'En cours', value: stats?.en_cours, tone: 'bg-brown/10 text-brown' },
    { label: 'Urgents', value: stats?.urgents, tone: 'bg-destructive/10 text-destructive' },
    { label: 'Clôturés', value: stats?.clotures, tone: 'bg-emerald-500/10 text-emerald-600' },
  ]

  function renderAvancement(dossier: Dossier) {
    return (
      <div className="flex w-full max-w-28 items-center gap-2">
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
      <div className="flex flex-wrap items-center justify-end gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          title="Gérer les avocats assignés"
          onClick={() => openAssign(dossier)}
        >
          <Users />
        </Button>
        <Button variant="ghost" size="icon-sm" title="Modifier" onClick={() => goToEdit(dossier)}>
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
          <Button size="sm" onClick={goToCreate}>
            <Plus className="size-4 mr-1.5" />
            Nouveau dossier
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
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
                  <div className="text-xl font-bold break-words sm:text-2xl">{card.value ?? 0}</div>
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
                  className="w-40 pl-8 sm:w-52"
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
                <Button size="sm" onClick={goToCreate}>
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
            <Table className="table-fixed [&_td]:whitespace-normal [&_th]:whitespace-normal">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[26%]">Dossier</TableHead>
                  <TableHead className="w-[15%]">Client</TableHead>
                  <TableHead className="w-[11%]">Priorité</TableHead>
                  <TableHead className="w-[12%]">Statut</TableHead>
                  <TableHead className="w-[15%]">Avancement</TableHead>
                  <TableHead className="w-[11%]">Ouverture</TableHead>
                  <TableHead className="w-[10%] text-right">Actions</TableHead>
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
          )}

          {!isKanban && (
            <ListPagination meta={meta} page={page} onPageChange={setPage} itemLabel="dossier" />
          )}
        </CardContent>
      </Card>

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
