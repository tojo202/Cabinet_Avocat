import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2,
  CircleAlert,
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  Users,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useClientStats, useClients, useCreateClient, useDeleteClient, useExportClients, useUpdateClient } from '@/hooks/use-clients'
import { TYPE_CLIENT_LABELS } from '@/lib/format'
import { useAuth } from '@/store/auth'
import type { Client, TypeClient } from '@/types'
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
import { ConfirmDialog } from '@/components/ConfirmDialog'

const clientSchema = z
  .object({
    type_client: z.enum(['particulier', 'societe']),
    nom: z.string().min(1, 'Le nom est requis.'),
    prenom: z.string(),
    raison_sociale: z.string(),
    email: z.union([z.email('Adresse e-mail invalide.'), z.literal('')]),
    telephone: z.string().max(30, '30 caractères maximum.'),
    adresse: z.string().max(255, '255 caractères maximum.'),
    nif: z.string().max(20, '20 caractères maximum.'),
    stat: z.string().max(20, '20 caractères maximum.'),
    actif: z.boolean(),
  })
  .superRefine((values, ctx) => {
    if (values.type_client === 'particulier' && !values.prenom.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['prenom'],
        message: 'Le prénom est requis pour un particulier.',
      })
    }
    if (values.type_client === 'societe' && !values.raison_sociale.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['raison_sociale'],
        message: 'La raison sociale est requise pour une société.',
      })
    }
  })

type ClientFormValues = z.infer<typeof clientSchema>

const EMPTY_VALUES: ClientFormValues = {
  type_client: 'particulier',
  nom: '',
  prenom: '',
  raison_sociale: '',
  email: '',
  telephone: '',
  adresse: '',
  nif: '',
  stat: '',
  actif: true,
}

const TYPE_OPTIONS: { value: TypeClient; label: string }[] = [
  { value: 'particulier', label: TYPE_CLIENT_LABELS.particulier },
  { value: 'societe', label: TYPE_CLIENT_LABELS.societe },
]

const SORT_OPTIONS = [
  { value: '-created_at', label: 'Plus récents' },
  { value: 'nom', label: 'Nom A–Z' },
  { value: 'type_client', label: 'Type de client' },
]

const AVATAR_COLORS = [
  'bg-primary/15 text-primary',
  'bg-blue-500/15 text-blue-600',
  'bg-emerald-500/15 text-emerald-600',
  'bg-amber-500/15 text-amber-600',
  'bg-violet-500/15 text-violet-600',
  'bg-rose-500/15 text-rose-600',
]

function toValues(client: Client | null): ClientFormValues {
  if (!client) return EMPTY_VALUES
  return {
    type_client: client.type_client,
    nom: client.nom,
    prenom: client.prenom ?? '',
    raison_sociale: client.raison_sociale ?? '',
    email: client.email ?? '',
    telephone: client.telephone ?? '',
    adresse: client.adresse ?? '',
    nif: client.nif ?? '',
    stat: client.stat ?? '',
    actif: client.actif,
  }
}

export function ClientsPage() {
  const can = useAuth((s) => s.can)
  const canCreate = can('clients.create')
  const canUpdate = can('clients.update')
  const canDelete = can('clients.delete')
  const canExport = can('clients.export')

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [type, setType] = useState<TypeClient | ''>('')
  const [sort, setSort] = useState('-created_at')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [deleting, setDeleting] = useState<Client | null>(null)

  const listQuery = useClients({ search, type, sort, page })
  const statsQuery = useClientStats()
  const createMutation = useCreateClient()
  const updateMutation = useUpdateClient()
  const deleteMutation = useDeleteClient()
  const exportMutation = useExportClients()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(clientSchema),
    defaultValues: EMPTY_VALUES,
  })

  const clients = listQuery.data?.data ?? []
  const meta = listQuery.data?.meta
  const stats = statsQuery.data

  const saving = createMutation.isPending || updateMutation.isPending

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  function openCreate() {
    setEditing(null)
    reset(EMPTY_VALUES)
    setFormOpen(true)
  }

  function openEdit(client: Client) {
    setEditing(client)
    reset(toValues(client))
    setFormOpen(true)
  }

  function onSubmit(values: ClientFormValues) {
    const payload = {
      type_client: values.type_client,
      nom: values.nom.trim(),
      prenom: values.prenom.trim() || null,
      raison_sociale: values.raison_sociale.trim() || null,
      email: values.email.trim() || null,
      telephone: values.telephone.trim() || null,
      adresse: values.adresse.trim() || null,
      nif: values.nif.trim() || null,
      stat: values.stat.trim() || null,
      actif: values.actif,
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
    {
      label: 'Total clients',
      value: stats?.total,
      icon: Users,
      tone: 'bg-primary/10 text-primary',
    },
    {
      label: 'Particuliers',
      value: stats?.particuliers,
      icon: User,
      tone: 'bg-blue-500/10 text-blue-600',
    },
    {
      label: 'Sociétés',
      value: stats?.societes,
      icon: Building2,
      tone: 'bg-violet-500/10 text-violet-600',
    },
    {
      label: 'Nouveaux ce mois',
      value: stats?.nouveaux_ce_mois,
      icon: Plus,
      tone: 'bg-emerald-500/10 text-emerald-600',
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
            <span className="text-foreground">Clients</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Gestion du répertoire clients particuliers et entreprises
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canExport && (
            <Button
              variant="outline"
              size="sm"
              disabled={exportMutation.isPending}
              onClick={() => exportMutation.mutate()}
            >
              <Download className="size-4 mr-1.5" />
              Exporter
            </Button>
          )}
          {canCreate && (
            <Button size="sm" onClick={openCreate}>
              <Plus className="size-4 mr-1.5" />
              Nouveau client
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.label}
                </CardTitle>
                <div className={`flex size-8 items-center justify-center rounded-lg ${card.tone}`}>
                  <Icon className="size-4" />
                </div>
              </CardHeader>
              <CardContent>
                {statsQuery.isLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <div>
                    <div className="text-2xl font-bold">{card.value ?? 0}</div>
                    <p className="mt-1 text-xs text-muted-foreground">Répertoire du cabinet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Liste des clients</CardTitle>
            <CardDescription>
              Coordonnées, rattachement aux dossiers et suivi commercial.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="w-56 pl-8"
                  placeholder="Nom, téléphone, e-mail…"
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
                { value: 'tous', label: 'Tous les types' },
                ...TYPE_OPTIONS.map((option) => ({ value: option.value, label: option.label })),
              ]}
              value={type || 'tous'}
              onValueChange={(value) => {
                setType(value && value !== 'tous' ? (value as TypeClient) : '')
                setPage(1)
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Tous les types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                {TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
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
              <Skeleton className="h-10 w-full" />
            </div>
          ) : listQuery.isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CircleAlert className="size-10 text-destructive" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Impossible de charger les clients.
              </p>
              <Button variant="outline" size="sm" onClick={() => void listQuery.refetch()}>
                Réessayer
              </Button>
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Users className="size-12 stroke-[1.5] text-muted-foreground/60" />
              <p className="text-base font-medium text-foreground">Aucun client trouvé</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {search || type
                  ? 'Aucun résultat pour ces filtres.'
                  : 'Enregistrez votre premier client pour ouvrir un dossier à son nom.'}
              </p>
              {canCreate && !search && !type && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="size-4 mr-1.5" />
                  Nouveau client
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead className="text-center">Dossiers</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9">
                            <AvatarFallback
                              className={AVATAR_COLORS[client.id % AVATAR_COLORS.length]}
                            >
                              {client.initiales}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex min-w-0 flex-col">
                            <span className="truncate font-medium text-foreground">
                              {client.nom_complet}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {client.email ?? '—'}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.type_client === 'societe' ? 'secondary' : 'outline'}>
                          {TYPE_CLIENT_LABELS[client.type_client]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {client.telephone ?? '—'}
                      </TableCell>
                      <TableCell className="text-center text-sm">
                        {client.dossiers_count ?? 0}
                      </TableCell>
                      <TableCell>
                        <Badge variant={client.actif ? 'default' : 'destructive'}>
                          {client.actif ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {canUpdate && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Modifier"
                              onClick={() => openEdit(client)}
                            >
                              <Pencil />
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              title="Supprimer"
                              onClick={() => setDeleting(client)}
                            >
                              <Trash2 />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <ListPagination meta={meta} page={page} onPageChange={setPage} itemLabel="client" />
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier le client' : 'Nouveau client'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Mettez à jour les coordonnées et le statut du client.'
                : 'Renseignez les informations du client pour l’attacher à vos dossiers.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Type de client</Label>
                <Controller
                  control={control}
                  name="type_client"
                  render={({ field }) => (
                    <Select
                      items={TYPE_OPTIONS}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Type de client" />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.type_client?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client-nom">Nom</Label>
                <Input id="client-nom" {...control.register('nom')} />
                <FieldError message={errors.nom?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client-prenom">Prénom</Label>
                <Input id="client-prenom" {...control.register('prenom')} />
                <FieldError message={errors.prenom?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client-raison">Raison sociale</Label>
                <Input
                  id="client-raison"
                  placeholder="SARL, SA…"
                  {...control.register('raison_sociale')}
                />
                <FieldError message={errors.raison_sociale?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client-email">Adresse e-mail</Label>
                <Input id="client-email" type="email" {...control.register('email')} />
                <FieldError message={errors.email?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client-telephone">Téléphone</Label>
                <Input id="client-telephone" placeholder="+261 34 00 00 000" {...control.register('telephone')} />
                <FieldError message={errors.telephone?.message} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="client-adresse">Adresse</Label>
                <Input id="client-adresse" {...control.register('adresse')} />
                <FieldError message={errors.adresse?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client-nif">NIF</Label>
                <Input id="client-nif" {...control.register('nif')} />
                <FieldError message={errors.nif?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client-stat">STAT</Label>
                <Input id="client-stat" {...control.register('stat')} />
                <FieldError message={errors.stat?.message} />
              </div>
            </div>

            <Controller
              control={control}
              name="actif"
              render={({ field }) => (
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="client-actif"
                    checked={field.value}
                    onChange={(event) => field.onChange(event.target.checked)}
                  />
                  <Label htmlFor="client-actif" className="font-normal">
                    Client actif
                  </Label>
                </div>
              )}
            />

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
                {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Supprimer le client"
        description={`Le client « ${deleting?.nom_complet ?? ''} » sera définitivement supprimé. Cette action est irréversible.`}
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
