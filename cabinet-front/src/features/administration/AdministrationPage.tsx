import {
  CircleCheck,
  CircleX,
  History,
  ScrollText,
  Search,
} from 'lucide-react'
import { useState } from 'react'
import { useDossierActivites, useDossiers } from '@/hooks/use-dossiers'
import { formatDateTime, ROLES_LABELS, STATUT_DOSSIER_LABELS } from '@/lib/format'
import { useAuth } from '@/store/auth'
import type { ActivityEntry, Role } from '@/types'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
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

const ROLE_KEYS: Role[] = ['admin', 'avocat', 'secretaire', 'comptable']

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    'clients.view', 'clients.create', 'clients.update', 'clients.delete', 'clients.export',
    'dossiers.view', 'dossiers.manage',
    'factures.view', 'factures.manage', 'paiements.manage',
    'documents.view', 'documents.manage',
    'evenements.view', 'evenements.manage',
    'avocats.view', 'avocats.manage',
    'dashboard.view', 'parametres.manage', 'utilisateurs.manage', 'rapports.view',
  ],
  avocat: [
    'clients.view', 'clients.create', 'clients.update',
    'dossiers.view', 'dossiers.manage',
    'factures.view',
    'documents.view', 'documents.manage',
    'evenements.view', 'evenements.manage',
    'avocats.view',
    'dashboard.view',
    'rapports.view',
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
    'rapports.view',
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
  { label: 'Rapports', permissions: ['rapports.view'] },
  { label: 'Paramètres système', permissions: ['parametres.manage'] },
  { label: 'Utilisateurs', permissions: ['utilisateurs.manage'] },
]

function groupHasAccess(role: Role, permissions: string[]): boolean {
  return permissions.some((permission) => ROLE_PERMISSIONS[role].includes(permission))
}

const EVENT_LABELS: Record<string, string> = {
  created: 'Création',
  updated: 'Modification',
  deleted: 'Suppression',
}

const DESCRIPTION_LABELS: Record<string, string> = {
  created: 'Création de l’enregistrement',
  updated: 'Mise à jour de l’enregistrement',
  deleted: 'Suppression de l’enregistrement',
}

function eventBadge(event: string | null): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (event === 'created') return 'default'
  if (event === 'updated') return 'secondary'
  if (event === 'deleted') return 'destructive'
  if (event === null) return 'secondary'
  return 'outline'
}

function activityLabel(activity: ActivityEntry): string {
  if (activity.event) return EVENT_LABELS[activity.event] ?? activity.event
  return activity.log_name === 'dossier' ? 'Statut' : 'Action'
}

function activityDescription(activity: ActivityEntry): string {
  return DESCRIPTION_LABELS[activity.description] ?? activity.description
}

function activityProperty(activity: ActivityEntry, key: string): unknown {
  const properties = activity.properties as unknown
  if (properties && typeof properties === 'object' && !Array.isArray(properties)) {
    return (properties as Record<string, unknown>)[key]
  }
  return undefined
}

function statutLabel(value: string): string {
  const labels = STATUT_DOSSIER_LABELS as Record<string, string>
  return labels[value] ?? value
}

function journalEmpty(message: string) {
  return (
    <div className="flex flex-col items-center gap-3 py-12 text-center">
      <ScrollText className="size-12 stroke-[1.5] text-muted-foreground/60" />
      <p className="text-base font-medium text-foreground">Journal vide</p>
      <p className="max-w-sm text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

export function AdministrationPage() {
  const can = useAuth((s) => s.can)
  const canViewDossiers = can('dossiers.view')

  const [tab, setTab] = useState('roles')
  const [journalDossierId, setJournalDossierId] = useState<number | null>(null)
  const [journalFilter, setJournalFilter] = useState('')

  const dossiersQuery = useDossiers({ per_page: 100 })
  const journalQuery = useDossierActivites(journalDossierId)

  const dossiers = dossiersQuery.data?.data ?? []

  const dossiersFiltres = journalFilter.trim()
    ? dossiers.filter((dossier) => {
        const term = journalFilter.trim().toLowerCase()
        return (
          dossier.reference.toLowerCase().includes(term) ||
          dossier.titre.toLowerCase().includes(term) ||
          (dossier.client?.nom_complet ?? '').toLowerCase().includes(term)
        )
      })
    : dossiers

  const journalOptions: { value: string; label: string }[] = [
    { value: 'choisir', label: 'Sélectionnez un dossier' },
    ...dossiersFiltres.map((dossier) => ({
      value: String(dossier.id),
      label: `${dossier.reference} — ${dossier.titre}`,
    })),
  ]

  if (journalDossierId !== null) {
    const selected = dossiers.find((dossier) => dossier.id === journalDossierId)
    if (selected && !journalOptions.some((option) => option.value === String(journalDossierId))) {
      journalOptions.push({
        value: String(selected.id),
        label: `${selected.reference} — ${selected.titre}`,
      })
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
        <p className="text-sm text-muted-foreground">
          Rôles & permissions et journal d'activité du cabinet
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="roles">Rôles & permissions</TabsTrigger>
          <TabsTrigger value="journal">Journal d'activité</TabsTrigger>
        </TabsList>

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

        <TabsContent value="journal">
          <Card>
            <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <History className="size-4 text-primary" />
                  Journal d'activité
                </CardTitle>
                <CardDescription>
                  Les 50 dernières actions enregistrées sur le dossier sélectionné.
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="w-56 pl-8"
                    placeholder="Référence, titre, client…"
                    value={journalFilter}
                    onChange={(event) => setJournalFilter(event.target.value)}
                  />
                </div>
                <Select
                  items={journalOptions}
                  value={journalDossierId === null ? 'choisir' : String(journalDossierId)}
                  onValueChange={(value) =>
                    setJournalDossierId(!value || value === 'choisir' ? null : Number(value))
                  }
                >
                  <SelectTrigger className="w-full sm:w-72">
                    <SelectValue placeholder="Sélectionnez un dossier" />
                  </SelectTrigger>
                  <SelectContent>
                    {journalOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {!canViewDossiers ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  La consultation des dossiers n'est pas autorisée pour votre rôle.
                </p>
              ) : dossiersQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : dossiersQuery.isError ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Impossible de charger la liste des dossiers.
                </p>
              ) : journalDossierId === null ? (
                journalEmpty('Choisissez un dossier pour afficher son historique d’actions.')
              ) : journalQuery.isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : journalQuery.isError ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Impossible de charger le journal de ce dossier.
                </p>
              ) : (journalQuery.data ?? []).length === 0 ? (
                journalEmpty('Aucune action enregistrée sur ce dossier.')
              ) : (
                <ol className="divide-y divide-border rounded-lg border border-border">
                  {(journalQuery.data ?? []).map((activity: ActivityEntry) => {
                    const ancien = activityProperty(activity, 'ancien_statut')
                    const nouveau = activityProperty(activity, 'nouveau_statut')
                    const hasStatut =
                      typeof ancien === 'string' && typeof nouveau === 'string'

                    return (
                      <li
                        key={activity.id}
                        className="flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4"
                      >
                        <div className="flex shrink-0 items-center gap-2">
                          <Badge variant={eventBadge(activity.event)}>
                            {activityLabel(activity)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(activity.created_at)}
                          </span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground">
                            {activityDescription(activity)}
                          </p>
                          {hasStatut && (
                            <p className="text-xs text-muted-foreground">
                              {statutLabel(ancien)} → {statutLabel(nouveau)}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {activity.causer?.name ?? 'Système'}
                        </span>
                      </li>
                    )
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex items-start gap-2 rounded-lg border border-dashed border-border px-4 py-3 text-xs text-muted-foreground">
        <History className="mt-0.5 size-3.5 shrink-0" />
        <span>
          Le journal d'activité retrace les actions sur les dossiers. Les paramètres du cabinet et
          la gestion des comptes utilisateurs sont disponibles dans la rubrique Paramètres.
        </span>
      </div>
    </div>
  )
}
