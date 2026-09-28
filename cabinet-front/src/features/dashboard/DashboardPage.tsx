import { useQuery } from '@tanstack/react-query'
import {
  AlertCircle,
  FileCheck,
  FolderOpen,
  Plus,
  TrendingUp,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '@/lib/axios'
import { formatDate, PRIORITE_LABELS, STATUT_DOSSIER_LABELS } from '@/lib/format'
import { useAuth } from '@/store/auth'
import type { ActiviteJour, DashboardStats, Dossier } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export function DashboardPage() {
  const user = useAuth((s) => s.user)

  const { data: stats, isLoading: loadingStats } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const res = await api.get('/dashboard/stats')
      return res.data
    },
  })

  const { data: activite, isLoading: loadingActivite } = useQuery<ActiviteJour[]>({
    queryKey: ['dashboard', 'activite'],
    queryFn: async () => {
      const res = await api.get('/dashboard/activite')
      return res.data
    },
  })

  const { data: dossiersRecents, isLoading: loadingDossiers } = useQuery<Dossier[]>({
    queryKey: ['dashboard', 'dossiers-recents'],
    queryFn: async () => {
      const res = await api.get('/dashboard/dossiers-recents')
      return Array.isArray(res.data) ? res.data : res.data.data ?? []
    },
  })

  const currentDateFormatted = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date())

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Bonjour, {user?.name ?? 'Maître'} 👋
          </h1>
          <p className="text-sm text-muted-foreground capitalize">
            {currentDateFormatted} • Vue d'ensemble de votre cabinet
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            render={
              <Link to="/clients">
                <Users className="size-4 mr-1.5" />
                Clients
              </Link>
            }
          />
          <Button
            size="sm"
            render={
              <Link to="/dossiers">
                <Plus className="size-4 mr-1.5" />
                Nouveau Dossier
              </Link>
            }
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clients Actifs
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div>
                <div className="text-2xl font-bold">{stats?.clients_actifs ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <TrendingUp className="size-3 text-emerald-500" />
                  <span className="text-emerald-500 font-medium">
                    +{stats?.clients_nouveaux_pct ?? 0}%
                  </span>{' '}
                  ce mois-ci
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dossiers en cours
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600">
              <FolderOpen className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div>
                <div className="text-2xl font-bold">{stats?.dossiers_en_cours ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Affaires juridiques actives
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Dossiers Urgents
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
              <AlertCircle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div>
                <div className="text-2xl font-bold text-destructive">
                  {stats?.dossiers_urgents ?? 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Nécessitent une attention prioritaire
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Documents numérisés
            </CardTitle>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <FileCheck className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            {loadingStats ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div>
                <div className="text-2xl font-bold">{stats?.total_documents ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Pièces & actes archivés
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">
                Activité des 7 derniers jours
              </CardTitle>
              <CardDescription>
                Évolution des dossiers ouverts, audiences et rendez-vous
              </CardDescription>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-primary" />
                <span>Dossiers</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-blue-500" />
                <span>Rendez-vous</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-full bg-amber-500" />
                <span>Audiences</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingActivite ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={activite ?? []}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorDossiers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorRdv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAudiences" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(val) => {
                      const d = new Date(val)
                      return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })
                    }}
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
                  />
                  <YAxis allowDecimals={false} tickLine={false} className="text-xs fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      borderColor: 'var(--border)',
                      borderRadius: '0.5rem',
                      color: 'var(--foreground)',
                      fontSize: '0.75rem',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="dossiers_ouverts"
                    name="Dossiers ouverts"
                    stroke="var(--primary)"
                    fillOpacity={1}
                    fill="url(#colorDossiers)"
                  />
                  <Area
                    type="monotone"
                    dataKey="rendez_vous"
                    name="Rendez-vous"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorRdv)"
                  />
                  <Area
                    type="monotone"
                    dataKey="audiences"
                    name="Audiences"
                    stroke="#f59e0b"
                    fillOpacity={1}
                    fill="url(#colorAudiences)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Dossiers Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Dossiers Récents</CardTitle>
            <CardDescription>Les dernières affaires créées ou mises à jour</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            render={<Link to="/dossiers">Voir tout</Link>}
          />
        </CardHeader>
        <CardContent>
          {loadingDossiers ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !dossiersRecents || dossiersRecents.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Aucun dossier récent pour le moment.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Réf & Titre</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Avancement</TableHead>
                    <TableHead>Date d'ouverture</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dossiersRecents.map((dossier) => (
                    <TableRow key={dossier.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{dossier.titre}</span>
                          <span className="text-xs text-muted-foreground">
                            {dossier.reference} • {dossier.type_droit}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {dossier.client?.nom_complet ||
                          dossier.client?.raison_sociale ||
                          `${dossier.client?.nom || ''} ${dossier.client?.prenom || ''}`.trim() ||
                          '—'}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        <span className="text-xs font-medium">
                          {STATUT_DOSSIER_LABELS[dossier.statut] || dossier.statut}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 w-28">
                          <Progress value={dossier.avancement} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground">
                            {dossier.avancement}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDate(dossier.date_ouverture)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
