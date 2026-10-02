import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Briefcase,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Download,
  Eye,
  FolderOpen,
  Gavel,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Search,
  Sparkles,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { api, apiErrorMessage } from '@/lib/axios'
import { STATUT_DOSSIER_LABELS } from '@/lib/format'
import { useAuth } from '@/store/auth'
import type { AvocatRef, Dossier, Paginated } from '@/types'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface AvocatDetail extends AvocatRef {
  dossiers?: Dossier[]
}

interface AvocatForm {
  prenom: string
  nom: string
  specialite: string
  telephone: string
  barreau: string
  email: string
  password: string
  actif: boolean
}

type SortKey = 'nom' | 'specialite'

const EMPTY_FORM: AvocatForm = {
  prenom: '',
  nom: '',
  specialite: '',
  telephone: '',
  barreau: '',
  email: '',
  password: '',
  actif: true,
}

const AVATAR_COLORS = [
  'bg-primary/15 text-primary',
  'bg-blue-500/15 text-blue-600',
  'bg-emerald-500/15 text-emerald-600',
  'bg-amber-500/15 text-amber-600',
  'bg-violet-500/15 text-violet-600',
  'bg-rose-500/15 text-rose-600',
]

function avatarColor(id: number): string {
  return AVATAR_COLORS[id % AVATAR_COLORS.length]
}

function toForm(avocat: AvocatRef | null): AvocatForm {
  if (!avocat) return EMPTY_FORM
  return {
    prenom: avocat.prenom,
    nom: avocat.nom,
    specialite: avocat.specialite ?? '',
    telephone: avocat.telephone ?? '',
    barreau: avocat.barreau ?? '',
    email: avocat.user?.email ?? '',
    password: '',
    actif: avocat.actif,
  }
}

export function AvocatsPage() {
  const can = useAuth((s) => s.can)
  const canManage = can('avocats.manage')
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortKey>('nom')
  const [page, setPage] = useState(1)
  const [detailId, setDetailId] = useState<number | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AvocatRef | null>(null)
  const [form, setForm] = useState<AvocatForm>(EMPTY_FORM)

  const listQuery = useQuery<Paginated<AvocatRef>>({
    queryKey: ['avocats', { search, sort, page }],
    queryFn: async () => {
      const res = await api.get('/avocats', {
        params: {
          filter: search ? { search } : undefined,
          sort,
          page,
          per_page: 15,
        },
      })
      return res.data
    },
  })

  const detailQuery = useQuery<AvocatDetail>({
    queryKey: ['avocats', detailId],
    queryFn: async () => {
      const res = await api.get(`/avocats/${detailId}`)
      return res.data.data ?? res.data
    },
    enabled: detailId !== null,
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['avocats'] })

  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await api.post('/avocats', payload)
      return res.data
    },
    onSuccess: () => {
      void invalidate()
      setFormOpen(false)
      toast.success('Avocat créé. Son compte utilisateur est actif.')
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Impossible de créer l'avocat.")),
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Record<string, unknown> }) => {
      const res = await api.put(`/avocats/${id}`, payload)
      return res.data
    },
    onSuccess: () => {
      void invalidate()
      setFormOpen(false)
      toast.success('Profil mis à jour.')
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Impossible de modifier l'avocat.")),
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete<{ message?: string }>(`/avocats/${id}`)
      return res.data
    },
    onSuccess: (data) => {
      void invalidate()
      toast.success(data?.message ?? 'Avocat désactivé.')
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Impossible de désactiver l'avocat.")),
  })

  const reactivateMutation = useMutation({
    mutationFn: async (avocat: AvocatRef) => {
      const res = await api.put(`/avocats/${avocat.id}`, {
        prenom: avocat.prenom,
        nom: avocat.nom,
        specialite: avocat.specialite,
        telephone: avocat.telephone,
        barreau: avocat.barreau,
        actif: true,
      })
      return res.data
    },
    onSuccess: () => {
      void invalidate()
      toast.success('Avocat réactivé.')
    },
    onError: (error) => toast.error(apiErrorMessage(error, "Impossible de réactiver l'avocat.")),
  })

  const avocats = listQuery.data?.data ?? []
  const meta = listQuery.data?.meta
  const lastPage = meta?.last_page ?? 1

  const totalDossiers = avocats.reduce((sum, avocat) => sum + (avocat.dossiers_count ?? 0), 0)
  const specialites = new Set(avocats.map((avocat) => avocat.specialite).filter(Boolean)).size

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_FORM)
    setFormOpen(true)
  }

  function openEdit(avocat: AvocatRef) {
    setEditing(avocat)
    setForm(toForm(avocat))
    setFormOpen(true)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const base = {
      prenom: form.prenom.trim(),
      nom: form.nom.trim(),
      specialite: form.specialite.trim() || null,
      telephone: form.telephone.trim() || null,
      barreau: form.barreau.trim() || null,
      actif: form.actif,
    }
    if (editing) {
      updateMutation.mutate({
        id: editing.id,
        payload: {
          ...base,
          ...(form.password ? { password: form.password } : {}),
        },
      })
    } else {
      createMutation.mutate({
        ...base,
        email: form.email.trim(),
        password: form.password,
      })
    }
  }

  function handleToggle(avocat: AvocatRef) {
    if (avocat.actif) deleteMutation.mutate(avocat.id)
    else reactivateMutation.mutate(avocat)
  }

  const detail = detailQuery.data

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              Tableau de bord
            </Link>
            <ChevronRight className="size-3" />
            <span className="text-foreground">Avocats</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight">Avocats & Collaborateurs</h1>
          <p className="text-sm text-muted-foreground">
            Profils, barreaux, spécialités et affaires assignées à chaque membre du cabinet
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={openCreate}>
            <Plus className="size-4 mr-1.5" />
            Ajouter un avocat
          </Button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Membres
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {listQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-bold">{meta?.total ?? avocats.length}</div>
                <p className="mt-1 text-xs text-muted-foreground">Avocats & collaborateurs</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Actifs
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <UserCheck className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {listQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-bold">
                  {avocats.filter((avocat) => avocat.actif).length}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Sur la liste affichée</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dossiers assignés
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <FolderOpen className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {listQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-bold">{totalDossiers}</div>
                <p className="mt-1 text-xs text-muted-foreground">Cumul des affaires traitées</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Spécialités
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Sparkles className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {listQuery.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div>
                <div className="text-2xl font-bold">{specialites}</div>
                <p className="mt-1 text-xs text-muted-foreground">Domaines distincts</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Membres du cabinet</CardTitle>
            <CardDescription>Liste des avocats associés, collaborateurs et juristes.</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="w-56 pl-8"
                  placeholder="Nom, prénom, spécialité…"
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
              value={sort}
              onValueChange={(value) => {
                setSort(value as SortKey)
                setPage(1)
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nom">Nom A–Z</SelectItem>
                <SelectItem value="specialite">Spécialité</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" disabled title="Export disponible prochainement">
              <Download className="size-4 mr-1.5" />
              Export
            </Button>
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
                {apiErrorMessage(listQuery.error, 'Impossible de charger les avocats.')}
              </p>
              <Button variant="outline" size="sm" onClick={() => void listQuery.refetch()}>
                Réessayer
              </Button>
            </div>
          ) : avocats.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Gavel className="size-12 stroke-[1.5] text-muted-foreground/60" />
              <p className="text-base font-medium text-foreground">Aucun avocat trouvé</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {search
                  ? 'Aucun résultat pour cette recherche. Modifiez les filtres ou ajoutez un collaborateur.'
                  : 'Ajoutez votre premier avocat pour constituer l’équipe du cabinet.'}
              </p>
              {canManage && !search && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="size-4 mr-1.5" />
                  Ajouter un avocat
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Avocat</TableHead>
                    <TableHead>Spécialité</TableHead>
                    <TableHead>Barreau</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead className="text-center">Dossiers</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {avocats.map((avocat) => (
                    <TableRow key={avocat.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback className={avatarColor(avocat.id)}>
                              {avocat.initiales}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium text-foreground">
                              {avocat.nom_complet}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {avocat.user?.email ?? '—'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {avocat.specialite ? (
                          <Badge variant="secondary">{avocat.specialite}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {avocat.barreau || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {avocat.telephone || '—'}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {avocat.dossiers_count ?? 0}{' '}
                        <span className="text-xs text-muted-foreground">
                          dossier{(avocat.dossiers_count ?? 0) > 1 ? 's' : ''}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={avocat.actif ? 'default' : 'destructive'}>
                          {avocat.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            title="Voir le détail"
                            onClick={() => setDetailId(avocat.id)}
                          >
                            <Eye />
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                title="Modifier"
                                onClick={() => openEdit(avocat)}
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant={avocat.actif ? 'destructive' : 'outline'}
                                size="icon-sm"
                                title={avocat.actif ? 'Désactiver' : 'Réactiver'}
                                disabled={
                                  deleteMutation.isPending || reactivateMutation.isPending
                                }
                                onClick={() => handleToggle(avocat)}
                              >
                                {avocat.actif ? <UserX /> : <UserCheck />}
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

          {!listQuery.isLoading && !listQuery.isError && (lastPage > 1 || (meta?.total ?? 0) > 0) && (
            <div className="mt-4 flex flex-col gap-3 border-t pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                {meta?.total ?? avocats.length} avocat{(meta?.total ?? avocats.length) > 1 ? 's' : ''}{' '}
                au total • Page {meta?.current_page ?? page} sur {lastPage}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="size-4 mr-1" />
                  Précédent
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= lastPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Suivant
                  <ChevronRight className="size-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={detailId !== null} onOpenChange={(open) => !open && setDetailId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détail de l'avocat</DialogTitle>
            <DialogDescription>Coordonnées et dossiers assignés.</DialogDescription>
          </DialogHeader>
          {detailQuery.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : detailQuery.isError ? (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <CircleAlert className="size-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                {apiErrorMessage(detailQuery.error, 'Impossible de charger le détail.')}
              </p>
            </div>
          ) : detail ? (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Avatar className="size-12">
                  <AvatarFallback className={`${avatarColor(detail.id)} text-sm`}>
                    {detail.initiales}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{detail.nom_complet}</span>
                  <span className="text-xs text-muted-foreground">
                    {detail.specialite || 'Spécialité non renseignée'}
                  </span>
                </div>
                <Badge
                  variant={detail.actif ? 'default' : 'destructive'}
                  className="ml-auto"
                >
                  {detail.actif ? 'Actif' : 'Inactif'}
                </Badge>
              </div>

              <div className="grid gap-3 rounded-lg border border-border bg-muted/30 p-4 text-sm sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Mail className="size-4 text-muted-foreground" />
                  <span className="truncate">{detail.user?.email ?? '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="size-4 text-muted-foreground" />
                  <span>{detail.telephone || '—'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-muted-foreground" />
                  <span>{detail.barreau || 'Barreau non renseigné'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="size-4 text-muted-foreground" />
                  <span>{detail.specialite || '—'}</span>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-semibold">
                  Dossiers assignés ({detail.dossiers?.length ?? 0})
                </h4>
                {!detail.dossiers || detail.dossiers.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                    Aucun dossier assigné à ce collaborateur.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Référence</TableHead>
                          <TableHead>Titre</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detail.dossiers.map((dossier) => (
                          <TableRow key={dossier.id}>
                            <TableCell className="font-medium">{dossier.reference}</TableCell>
                            <TableCell className="max-w-48 truncate">{dossier.titre}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {dossier.client?.nom_complet || '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {STATUT_DOSSIER_LABELS[dossier.statut] ?? dossier.statut}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDetailId(null)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'avocat" : 'Ajouter un avocat'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Mettez à jour le profil et les informations de contact.'
                : 'La création génère un compte utilisateur lié avec le rôle Avocat.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="avocat-prenom">Prénom</Label>
                <Input
                  id="avocat-prenom"
                  required
                  value={form.prenom}
                  onChange={(event) => setForm({ ...form, prenom: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="avocat-nom">Nom</Label>
                <Input
                  id="avocat-nom"
                  required
                  value={form.nom}
                  onChange={(event) => setForm({ ...form, nom: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="avocat-specialite">Spécialité</Label>
                <Input
                  id="avocat-specialite"
                  placeholder="Droit pénal, des affaires…"
                  value={form.specialite}
                  onChange={(event) => setForm({ ...form, specialite: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="avocat-barreau">Barreau</Label>
                <Input
                  id="avocat-barreau"
                  placeholder="Antananarivo"
                  value={form.barreau}
                  onChange={(event) => setForm({ ...form, barreau: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="avocat-telephone">Téléphone</Label>
                <Input
                  id="avocat-telephone"
                  placeholder="+261 34 00 00 000"
                  value={form.telephone}
                  onChange={(event) => setForm({ ...form, telephone: event.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="avocat-email">Adresse e-mail</Label>
                <Input
                  id="avocat-email"
                  type="email"
                  required={!editing}
                  disabled={Boolean(editing)}
                  placeholder="avocat@cabinet.mg"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="avocat-password">Mot de passe</Label>
                <Input
                  id="avocat-password"
                  type="password"
                  required={!editing}
                  minLength={editing ? undefined : 8}
                  autoComplete="new-password"
                  placeholder={editing ? 'Laisser vide pour conserver le mot de passe' : '8 caractères minimum'}
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                />
                {editing && (
                  <p className="text-xs text-muted-foreground">
                    Laissez ce champ vide pour ne pas changer le mot de passe du compte.
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="avocat-actif"
                checked={form.actif}
                onChange={(event) => setForm({ ...form, actif: event.target.checked })}
              />
              <Label htmlFor="avocat-actif" className="font-normal">
                Membre actif du cabinet
              </Label>
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
              <Button
                type="submit"
                size="sm"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending
                  ? 'Enregistrement…'
                  : editing
                    ? 'Enregistrer'
                    : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
