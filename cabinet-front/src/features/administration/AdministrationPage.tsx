import { useQuery } from '@tanstack/react-query'
import {
  Activity,
  Briefcase,
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock,
  CreditCard,
  Database,
  FileText,
  Globe,
  Info,
  Lock,
  ScrollText,
  Server,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { api } from '@/lib/axios'
import { formatDateTime, ROLES_LABELS } from '@/lib/format'
import { useAuth } from '@/store/auth'
import type { DashboardStats, Role } from '@/types'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const ROLE_KEYS: Role[] = ['admin', 'avocat', 'secretaire', 'comptable']

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    'clients.view', 'clients.create', 'clients.update', 'clients.delete', 'clients.export',
    'dossiers.view', 'dossiers.manage',
    'factures.view', 'factures.manage', 'paiements.manage',
    'documents.view', 'documents.manage',
    'evenements.view', 'evenements.manage',
    'avocats.view', 'avocats.manage',
    'dashboard.view', 'parametres.manage',
  ],
  avocat: [
    'clients.view', 'clients.create', 'clients.update',
    'dossiers.view', 'dossiers.manage',
    'factures.view',
    'documents.view', 'documents.manage',
    'evenements.view', 'evenements.manage',
    'avocats.view',
    'dashboard.view',
  ],
  secretaire: [
    'clients.view', 'clients.create', 'clients.update', 'clients.export',
    'dossiers.view', 'dossiers.manage',
    'documents.view', 'documents.manage',
    'evenements.view', 'evenements.manage',
    'avocats.view',
    'dashboard.view',
  ],
  comptable: [
    'clients.view',
    'dossiers.view',
    'factures.view', 'factures.manage', 'paiements.manage',
    'documents.view',
    'evenements.view',
    'avocats.view',
    'dashboard.view',
  ],
}

const PERMISSION_GROUPS: { label: string; permissions: string[] }[] = [
  { label: 'Tableau de bord', permissions: ['dashboard.view'] },
  {
    label: 'Clients',
    permissions: ['clients.view', 'clients.create', 'clients.update', 'clients.delete', 'clients.export'],
  },
  { label: 'Dossiers', permissions: ['dossiers.view', 'dossiers.manage'] },
  { label: 'Calendrier', permissions: ['evenements.view', 'evenements.manage'] },
  { label: 'Facturation', permissions: ['factures.view', 'factures.manage'] },
  { label: 'Paiements', permissions: ['paiements.manage'] },
  { label: 'Documents', permissions: ['documents.view', 'documents.manage'] },
  { label: 'Avocats', permissions: ['avocats.view', 'avocats.manage'] },
  { label: 'Administration', permissions: ['parametres.manage'] },
]

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

function groupHasAccess(role: Role, permissions: string[]): boolean {
  return permissions.some((permission) => ROLE_PERMISSIONS[role].includes(permission))
}

function initiales(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function AdministrationPage() {
  const user = useAuth((s) => s.user)
  const can = useAuth((s) => s.can)
  const canDashboard = can('dashboard.view')

  const [tab, setTab] = useState('parametres')
  const [now, setNow] = useState(() => new Date())
  const [settings, setSettings] = useState({
    nom_cabinet: 'CabinetPro',
    raison_sociale: '',
    adresse: '',
    telephone: '',
    email: '',
    devise: 'MGA',
    fuseau: 'Indian/Antananarivo',
    en_tete_facture: '',
  })

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const apiStatusQuery = useQuery({
    queryKey: ['administration', 'api-status'],
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
    enabled: canDashboard,
  })

  function handleSaveSettings(event: FormEvent) {
    event.preventDefault()
    toast.success('Paramètres enregistrés.', {
      description: 'La sauvegarde serveur arrive prochainement.',
    })
  }

  const roleLabel = user ? ROLES_LABELS[user.role] : '—'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
        <p className="text-sm text-muted-foreground">
          Paramètres du cabinet, rôles & permissions, comptes utilisateurs et santé du système
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="parametres">Paramètres généraux</TabsTrigger>
          <TabsTrigger value="roles">Rôles & permissions</TabsTrigger>
          <TabsTrigger value="utilisateurs">Utilisateurs</TabsTrigger>
          <TabsTrigger value="systeme">Système</TabsTrigger>
        </TabsList>

        <TabsContent value="parametres">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Paramètres généraux</CardTitle>
              <CardDescription>
                Identité du cabinet, coordonnées et préférences de facturation. Ces valeurs sont
                encore locales : la persistance serveur arrive prochainement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="param-nom">Nom du cabinet</Label>
                    <Input
                      id="param-nom"
                      value={settings.nom_cabinet}
                      onChange={(event) =>
                        setSettings({ ...settings, nom_cabinet: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="param-raison">Raison sociale</Label>
                    <Input
                      id="param-raison"
                      placeholder="SARL ou raison sociale complète"
                      value={settings.raison_sociale}
                      onChange={(event) =>
                        setSettings({ ...settings, raison_sociale: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="param-adresse">Adresse</Label>
                    <Textarea
                      id="param-adresse"
                      placeholder="Rue, quartier, ville"
                      value={settings.adresse}
                      onChange={(event) =>
                        setSettings({ ...settings, adresse: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="param-telephone">Téléphone</Label>
                    <Input
                      id="param-telephone"
                      placeholder="+261 34 00 00 000"
                      value={settings.telephone}
                      onChange={(event) =>
                        setSettings({ ...settings, telephone: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="param-email">E-mail</Label>
                    <Input
                      id="param-email"
                      type="email"
                      placeholder="contact@cabinet.mg"
                      value={settings.email}
                      onChange={(event) =>
                        setSettings({ ...settings, email: event.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="param-devise">Devise</Label>
                    <Select
                      value={settings.devise}
                      onValueChange={(value) =>
                        setSettings({ ...settings, devise: String(value) })
                      }
                    >
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
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="param-fuseau">Fuseau horaire</Label>
                    <Select
                      value={settings.fuseau}
                      onValueChange={(value) =>
                        setSettings({ ...settings, fuseau: String(value) })
                      }
                    >
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
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="param-entete">En-tête de facture</Label>
                    <Textarea
                      id="param-entete"
                      placeholder="Texte imprimé en tête de chaque facture"
                      value={settings.en_tete_facture}
                      onChange={(event) =>
                        setSettings({ ...settings, en_tete_facture: event.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3">
                  <p className="flex items-start gap-2 text-xs text-muted-foreground">
                    <Info className="mt-0.5 size-3.5 shrink-0" />
                    Les paramètres ne sont pas encore synchronisés avec le serveur : ils seront
                    persistants dès la mise en place de l'API dédiée.
                  </p>
                  <Button type="submit" size="sm" className="shrink-0">
                    Enregistrer les paramètres
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Rôles & permissions</CardTitle>
              <CardDescription>
                Matrice des accès par module pour les quatre rôles du cabinet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Module</TableHead>
                      {ROLE_KEYS.map((role) => (
                        <TableHead key={role} className="text-center">
                          {ROLES_LABELS[role]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {PERMISSION_GROUPS.map((group) => (
                      <TableRow key={group.label}>
                        <TableCell className="font-medium">{group.label}</TableCell>
                        {ROLE_KEYS.map((role) => {
                          const allowed = groupHasAccess(role, group.permissions)
                          return (
                            <TableCell key={role} className="text-center">
                              {allowed ? (
                                <CircleCheck className="mx-auto size-4 text-emerald-600" />
                              ) : (
                                <CircleX className="mx-auto size-4 text-muted-foreground/50" />
                              )}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 flex flex-col gap-1.5 border-t pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:gap-4">
                <span className="flex items-center gap-1.5">
                  <CircleCheck className="size-3.5 text-emerald-600" />
                  Le rôle dispose d'au moins un droit sur le module
                </span>
                <span className="flex items-center gap-1.5">
                  <CircleX className="size-3.5 text-muted-foreground/50" />
                  Aucun droit sur ce module
                </span>
                <span>
                  La création, la modification et la suppression restent soumises à la permission
                  correspondante pour chaque rôle.
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="utilisateurs">
          <div className="grid gap-6 lg:grid-cols-2">
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
                <dl className="mt-5 grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs text-muted-foreground">Identifiant</dt>
                    <dd className="font-medium">{user?.id ?? '—'}</dd>
                  </div>
                  <div className="flex flex-col gap-1">
                    <dt className="text-xs text-muted-foreground">Rôle</dt>
                    <dd className="font-medium">{roleLabel}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Users className="size-4 text-primary" />
                  Gestion des utilisateurs
                </CardTitle>
                <CardDescription>Comptes, invitations et réinitialisations.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-5">
                <p className="text-sm text-muted-foreground">
                  L'administration des comptes utilisateurs (création, réattribution de rôle,
                  suppression) arrive prochainement : l'API dédiée n'est pas encore disponible.
                </p>
                <Button variant="outline" size="sm" disabled>
                  Gérer les comptes
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="systeme">
          <div className="space-y-6">
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
                    Fuseau {settings.fuseau}
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
                  <p className="mt-1 text-xs text-muted-foreground">
                    Laravel • Vite • React
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Activity className="size-4 text-primary" />
                  Indicateurs clés
                </CardTitle>
                <CardDescription>
                  Données temps réel du tableau de bord.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!canDashboard ? (
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
                        <div className="text-xl font-bold">
                          {statsQuery.data?.clients_actifs ?? 0}
                        </div>
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
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(now.toISOString())}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-border p-4">
                <CreditCard className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Devise</p>
                  <p className="text-xs text-muted-foreground">
                    {DEVISES.find((devise) => devise.value === settings.devise)?.label ?? '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex items-start gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
        <Wallet className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Toute modification des paramètres du cabinet sera auditable dans le journal d'activité.
        </span>
      </div>
    </div>
  )
}
