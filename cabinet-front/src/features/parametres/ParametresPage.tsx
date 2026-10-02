import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Briefcase,
  CalendarDays,
  CircleAlert,
  Clock,
  CreditCard,
  Database,
  FileText,
  Globe,
  Info,
  Lock,
  Pencil,
  Plus,
  ScrollText,
  Search,
  Server,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { useSettings, useUpdateSettings } from '@/hooks/use-settings'
import {
  useCreateUtilisateur,
  useDeleteUtilisateur,
  useUpdateUtilisateur,
  useUtilisateurs,
} from '@/hooks/use-users'
import { api } from '@/lib/axios'
import { formatDate, formatDateTime, ROLES_LABELS } from '@/lib/format'
import { useAuth } from '@/store/auth'
import type { DashboardStats, ParametresCabinet, Role, Utilisateur } from '@/types'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const ROLE_KEYS: Role[] = ['admin', 'avocat', 'secretaire', 'comptable']

const ROLE_BADGES: Record<Role, 'default' | 'secondary' | 'outline'> = {
  admin: 'default',
  avocat: 'secondary',
  secretaire: 'outline',
  comptable: 'secondary',
}

const DEVISES = [
  { value: 'MGA', label: 'Ariary malgache (MGA)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'USD', label: 'Dollar américain (USD)' },
]

const FUSEAUX = [
  { value: 'Indian/Antananarivo', label: 'Indian/Antananarivo (UTC+3)' },
  { value: 'Europe/Paris', label: 'Europe/Paris (UTC+1/+2)' },
  { value: 'UTC', label: 'UTC' },
]

const AVATAR_COLORS = [
  'bg-primary/15 text-primary',
  'bg-blue-500/15 text-blue-600',
  'bg-emerald-500/15 text-emerald-600',
  'bg-amber-500/15 text-amber-600',
  'bg-violet-500/15 text-violet-600',
  'bg-rose-500/15 text-rose-600',
]

const utilisateurSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.').max(255, '255 caractères maximum.'),
  email: z.email('Adresse e-mail invalide.').max(255, '255 caractères maximum.'),
  role: z
    .string()
    .min(1, 'Le rôle est requis.')
    .refine((value) => ROLE_KEYS.includes(value as Role), 'Rôle inconnu.'),
  password: z.string().optional(),
})

type UtilisateurFormValues = z.infer<typeof utilisateurSchema>

const EMPTY_VALUES: UtilisateurFormValues = {
  name: '',
  email: '',
  role: 'secretaire',
  password: '',
}

const ROLE_OPTIONS = ROLE_KEYS.map((role) => ({ value: role, label: ROLES_LABELS[role] }))

const SORT_ROLES = [{ value: 'tous', label: 'Tous les rôles' }]

function initiales(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function toValues(utilisateur: Utilisateur | null): UtilisateurFormValues {
  if (!utilisateur) return EMPTY_VALUES
  return {
    name: utilisateur.name,
    email: utilisateur.email,
    role: utilisateur.role ?? '',
    password: '',
  }
}

export function ParametresPage() {
  const user = useAuth((s) => s.user)
  const can = useAuth((s) => s.can)
  const canManageUsers = can('utilisateurs.manage')

  const [tab, setTab] = useState('systeme')
  const [now, setNow] = useState(() => new Date())

  const settingsQuery = useSettings()
  const updateSettings = useUpdateSettings()

  const {
    control: settingsControl,
    handleSubmit: handleSettingsSubmit,
  } = useForm<ParametresCabinet>({ values: settingsQuery.data })

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<Role | ''>('')
  const [page, setPage] = useState(1)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Utilisateur | null>(null)
  const [deleting, setDeleting] = useState<Utilisateur | null>(null)

  const usersQuery = useUtilisateurs({ search, role, page })
  const createMutation = useCreateUtilisateur()
  const updateMutation = useUpdateUtilisateur()
  const deleteMutation = useDeleteUtilisateur()

  const apiStatusQuery = useQuery({
    queryKey: ['parametres', 'api-status'],
    queryFn: async () => {
      const res = await api.get('/auth/me')
      return res.status
    },
    retry: false,
  })

  const statsQuery = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats')
      return res.data
    },
    enabled: can('dashboard.view'),
  })

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UtilisateurFormValues>({
    resolver: zodResolver(utilisateurSchema),
    defaultValues: EMPTY_VALUES,
  })

  const saving = createMutation.isPending || updateMutation.isPending

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const utilisateurs = usersQuery.data?.data ?? []
  const meta = usersQuery.data?.meta
  const roleLabel = user ? ROLES_LABELS[user.role] : '—'

  function onSettingsSubmit(values: ParametresCabinet) {
    updateSettings.mutate(values)
  }

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

  function openEdit(utilisateur: Utilisateur) {
    setEditing(utilisateur)
    reset(toValues(utilisateur))
    setFormOpen(true)
  }

  function onSubmit(values: UtilisateurFormValues) {
    if (!editing && !values.password) {
      setError('password', { message: 'Le mot de passe est requis.' })
      return
    }

    const payload = {
      name: values.name,
      email: values.email,
      role: values.role as Role,
      ...(values.password ? { password: values.password } : {}),
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

  if (!can('parametres.manage')) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <ShieldCheck className="size-12 stroke-[1.5] text-muted-foreground/60" />
        <p className="text-base font-medium text-foreground">Accès restreint</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          La gestion des paramètres système et des comptes utilisateurs est réservée aux
          administrateurs du cabinet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-sm text-muted-foreground">
          Paramètres système du cabinet et gestion des comptes utilisateurs
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="systeme">Paramètres système</TabsTrigger>
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
        </TabsList>

        <TabsContent value="systeme">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Paramètres généraux</CardTitle>
                <CardDescription>
                  Identité du cabinet, coordonnées et préférences de facturation. Ces valeurs sont
                  utilisées par toute l'application.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {settingsQuery.isLoading || !settingsQuery.data ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full sm:col-span-2" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ) : settingsQuery.isError ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <CircleAlert className="size-10 text-destructive" />
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Impossible de charger les paramètres système.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => void settingsQuery.refetch()}>
                      Réessayer
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSettingsSubmit(onSettingsSubmit)} className="space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="param-nom">Nom du cabinet</Label>
                        <Input id="param-nom" {...settingsControl.register('nom_cabinet')} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="param-raison">Raison sociale</Label>
                        <Input
                          id="param-raison"
                          placeholder="SARL ou raison sociale complète"
                          {...settingsControl.register('raison_sociale')}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="param-adresse">Adresse</Label>
                        <Textarea
                          id="param-adresse"
                          placeholder="Rue, quartier, ville"
                          {...settingsControl.register('adresse')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="param-telephone">Téléphone</Label>
                        <Input
                          id="param-telephone"
                          placeholder="+261 34 00 00 000"
                          {...settingsControl.register('telephone')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="param-email">E-mail</Label>
                        <Input
                          id="param-email"
                          type="email"
                          placeholder="contact@cabinet.mg"
                          {...settingsControl.register('email')}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="param-devise">Devise</Label>
                        <Controller
                          control={settingsControl}
                          name="devise"
                          render={({ field }) => (
                            <Select items={DEVISES} value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger id="param-devise" className="w-full">
                                <SelectValue placeholder="Devise" />
                              </SelectTrigger>
                              <SelectContent>
                                {DEVISES.map((devise) => (
                                  <SelectItem key={devise.value} value={devise.value}>
                                    {devise.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="param-fuseau">Fuseau horaire</Label>
                        <Controller
                          control={settingsControl}
                          name="fuseau"
                          render={({ field }) => (
                            <Select items={FUSEAUX} value={field.value} onValueChange={field.onChange}>
                              <SelectTrigger id="param-fuseau" className="w-full">
                                <SelectValue placeholder="Fuseau horaire" />
                              </SelectTrigger>
                              <SelectContent>
                                {FUSEAUX.map((fuseau) => (
                                  <SelectItem key={fuseau.value} value={fuseau.value}>
                                    {fuseau.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                      </div>
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label htmlFor="param-entete">En-tête de facture</Label>
                        <Textarea
                          id="param-entete"
                          placeholder="Texte imprimé en tête de chaque facture"
                          {...settingsControl.register('en_tete_facture')}
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3">
                      <p className="flex items-start gap-2 text-xs text-muted-foreground">
                        <Info className="mt-0.5 size-3.5 shrink-0" />
                        Les modifications sont enregistrées en base et appliquées à tout le cabinet.
                      </p>
                      <Button type="submit" size="sm" className="shrink-0" disabled={updateSettings.isPending}>
                        {updateSettings.isPending ? 'Enregistrement…' : 'Enregistrer les paramètres'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Statut de l'API
                  </CardTitle>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Server className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  {apiStatusQuery.isLoading ? (
                    <Skeleton className="h-6 w-28" />
                  ) : apiStatusQuery.isError ? (
                    <Badge variant="destructive">Erreur</Badge>
                  ) : (
                    <Badge variant="default">Connecté</Badge>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground">
                    Dernière vérification : {formatDateTime(now.toISOString())}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Version de l'application
                  </CardTitle>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                    <ScrollText className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">0.0.0</div>
                  <p className="mt-1 text-xs text-muted-foreground">CabinetPro • build front</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Base URL de l'API
                  </CardTitle>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                    <Globe className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="font-mono text-lg font-bold">{api.defaults.baseURL}</div>
                  <p className="mt-1 text-xs text-muted-foreground">Sanctum • Bearer token</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Rôle actif
                  </CardTitle>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                    <ShieldCheck className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{roleLabel}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {user?.email ?? 'Session non connectée'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Date & heure
                  </CardTitle>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                    <Clock className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">{formatDateTime(now.toISOString())}</div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Fuseau {settingsQuery.data?.fuseau ?? '—'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Environnement
                  </CardTitle>
                  <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                    <Database className="size-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">Production</div>
                  <p className="mt-1 text-xs text-muted-foreground">Laravel • Vite • React</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Activity className="size-4 text-primary" />
                  Indicateurs clés
                </CardTitle>
                <CardDescription>Données temps réel du tableau de bord.</CardDescription>
              </CardHeader>
              <CardContent>
                {!can('dashboard.view') ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Les indicateurs sont réservés aux rôles disposant du droit « Tableau de bord ».
                  </p>
                ) : statsQuery.isLoading ? (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : statsQuery.isError ? (
                  <p className="py-6 text-center text-sm text-muted-foreground">
                    Impossible de charger les statistiques du tableau de bord.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Users className="size-4" />
                      </div>
                      <div>
                        <div className="text-xl font-bold">{statsQuery.data?.clients_actifs ?? 0}</div>
                        <p className="text-xs text-muted-foreground">Clients actifs</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
                        <Briefcase className="size-4" />
                      </div>
                      <div>
                        <div className="text-xl font-bold">
                          {statsQuery.data?.dossiers_en_cours ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Dossiers en cours</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-border p-4">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                        <FileText className="size-4" />
                      </div>
                      <div>
                        <div className="text-xl font-bold">
                          {statsQuery.data?.total_documents ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Documents</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <Lock className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Sécurité</p>
                  <p className="text-xs text-muted-foreground">
                    Jetons Sanctum, rôles Spatie Permissions.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Dernière connexion</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(now.toISOString())}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <CreditCard className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Devise</p>
                  <p className="text-xs text-muted-foreground">
                    {DEVISES.find((devise) => devise.value === settingsQuery.data?.devise)?.label ?? '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="utilisateurs">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Compte courant</CardTitle>
                <CardDescription>Informations de la session en cours.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="size-12">
                    <AvatarFallback className="bg-primary/15 text-sm text-primary">
                      {user ? initiales(user.name) : '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-semibold text-foreground">
                      {user?.name ?? '—'}
                    </span>
                    <span className="truncate text-sm text-muted-foreground">
                      {user?.email ?? '—'}
                    </span>
                  </div>
                  <Badge className="ml-auto">{roleLabel}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base font-semibold">
                    <Users className="size-4 text-primary" />
                    Comptes utilisateurs
                  </CardTitle>
                  <CardDescription>
                    Création, modification des rôles et suppression des comptes du cabinet.
                  </CardDescription>
                </div>
                {canManageUsers && (
                  <Button size="sm" onClick={openCreate}>
                    <Plus className="size-4 mr-1.5" />
                    Nouvel utilisateur
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
                  <form onSubmit={handleSearch} className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="w-56 pl-8"
                        placeholder="Nom ou e-mail…"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                      />
                    </div>
                    <Button type="submit" size="sm">
                      Rechercher
                    </Button>
                  </form>
                  <Select
                    items={[...SORT_ROLES, ...ROLE_OPTIONS]}
                    value={role || 'tous'}
                    onValueChange={(value) => {
                      setRole(value && value !== 'tous' ? (value as Role) : '')
                      setPage(1)
                    }}
                  >
                    <SelectTrigger size="sm">
                      <SelectValue placeholder="Tous les rôles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tous">Tous les rôles</SelectItem>
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {usersQuery.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : usersQuery.isError ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <CircleAlert className="size-10 text-destructive" />
                    <p className="max-w-sm text-sm text-muted-foreground">
                      Impossible de charger les utilisateurs.
                    </p>
                    <Button variant="outline" size="sm" onClick={() => void usersQuery.refetch()}>
                      Réessayer
                    </Button>
                  </div>
                ) : utilisateurs.length === 0 ? (
                  <div className="flex flex-col items-center gap-3 py-12 text-center">
                    <Users className="size-12 stroke-[1.5] text-muted-foreground/60" />
                    <p className="text-base font-medium text-foreground">Aucun utilisateur trouvé</p>
                    <p className="max-w-sm text-sm text-muted-foreground">
                      {search || role
                        ? 'Aucun résultat pour ces filtres.'
                        : 'Invitez un premier collaborateur à rejoindre le cabinet.'}
                    </p>
                    {canManageUsers && !search && !role && (
                      <Button size="sm" onClick={openCreate}>
                        <UserPlus className="size-4 mr-1.5" />
                        Nouvel utilisateur
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Utilisateur</TableHead>
                          <TableHead>Rôle</TableHead>
                          <TableHead>Inscrit le</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {utilisateurs.map((utilisateur) => (
                          <TableRow key={utilisateur.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="size-9">
                                  <AvatarFallback
                                    className={AVATAR_COLORS[utilisateur.id % AVATAR_COLORS.length]}
                                  >
                                    {initiales(utilisateur.name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex min-w-0 flex-col">
                                  <span className="truncate font-medium text-foreground">
                                    {utilisateur.name}
                                    {utilisateur.id === user?.id && (
                                      <span className="ml-1.5 text-xs text-muted-foreground">
                                        (vous)
                                      </span>
                                    )}
                                  </span>
                                  <span className="truncate text-xs text-muted-foreground">
                                    {utilisateur.email}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={utilisateur.role ? ROLE_BADGES[utilisateur.role] : 'outline'}>
                                {utilisateur.role ? ROLES_LABELS[utilisateur.role] : 'Sans rôle'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDate(utilisateur.created_at)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  title="Modifier"
                                  disabled={!canManageUsers}
                                  onClick={() => openEdit(utilisateur)}
                                >
                                  <Pencil />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  title={
                                    utilisateur.id === user?.id
                                      ? 'Impossible de supprimer votre propre compte'
                                      : 'Supprimer'
                                  }
                                  disabled={!canManageUsers || utilisateur.id === user?.id}
                                  onClick={() => setDeleting(utilisateur)}
                                >
                                  <Trash2 />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <ListPagination meta={meta} page={page} onPageChange={setPage} itemLabel="utilisateur" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editing ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? 'Mettez à jour le nom, l’adresse e-mail ou le rôle du compte.'
                : 'Créez un compte et attribuez-lui un rôle pour lui donner accès au cabinet.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="user-name">Nom complet</Label>
              <Input id="user-name" placeholder="Prénom Nom" {...control.register('name')} />
              <FieldError message={errors.name?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-email">Adresse e-mail</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="prenom@cabinet.mg"
                {...control.register('email')}
              />
              <FieldError message={errors.email?.message} />
            </div>

            <div className="space-y-1.5">
              <Label>Rôle</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select
                    items={ROLE_OPTIONS}
                    value={field.value === '' ? null : field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError message={errors.role?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="user-password">
                Mot de passe{editing ? ' (laisser vide pour ne pas changer)' : ''}
              </Label>
              <Input
                id="user-password"
                type="password"
                placeholder={editing ? '••••••••' : '8 caractères minimum'}
                {...control.register('password')}
              />
              <FieldError message={errors.password?.message} />
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
                {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Supprimer l'utilisateur"
        description={`Le compte de « ${deleting?.name ?? ''} » sera définitivement supprimé. Cette action est irréversible.`}
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
