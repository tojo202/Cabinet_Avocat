import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  CircleAlert,
  Download,
  FileText,
  Gavel,
  PieChart as PieChartIcon,
  ShieldCheck,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useExportRapport, useRapportEvolution, useRapportSynthese } from '@/hooks/use-rapports'
import { formatAriary, formatDate, MODE_PAIEMENT_LABELS, STATUT_DOSSIER_LABELS } from '@/lib/format'
import { useAuth } from '@/store/auth'
import type { RapportEvolutionPoint } from '@/types'
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

const PRESETS = [
  { value: 'mois', label: 'Mois en cours' },
  { value: '30j', label: '30 derniers jours' },
  { value: '90j', label: '90 derniers jours' },
  { value: 'annee', label: 'Année en cours' },
]

const PIE_COLORS = [
  'var(--primary)',
  '#3b82f6',
  '#f59e0b',
  '#10b981',
]

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--card)',
  borderColor: 'var(--border)',
  borderRadius: '0.5rem',
  color: 'var(--foreground)',
  fontSize: '0.75rem',
}

function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function debutMois(): string {
  return isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
}

function aujourdhui(): string {
  return isoDate(new Date())
}

function decalerJours(jours: number): string {
  const date = new Date()
  date.setDate(date.getDate() - jours)
  return isoDate(date)
}

function labelPeriode(periode: string, granularite: 'mois' | 'an'): string {
  if (granularite === 'an') return periode
  return new Intl.DateTimeFormat('fr-FR', { month: 'short', year: '2-digit' }).format(
    new Date(`${periode}-01T00:00:00`),
  )
}

function serieFinanciere(points: RapportEvolutionPoint[], granularite: 'mois' | 'an') {
  return points.map((point) => ({
    ...point,
    label: labelPeriode(point.periode, granularite),
  }))
}

export function RapportsPage() {
  const can = useAuth((s) => s.can)

  const [preset, setPreset] = useState('mois')
  const [debut, setDebut] = useState(debutMois)
  const [fin, setFin] = useState(aujourdhui)

  const periode = { debut, fin }
  const syntheseQuery = useRapportSynthese(periode)
  const evolutionQuery = useRapportEvolution(periode)
  const exportMutation = useExportRapport()

  const synthese = syntheseQuery.data
  const evolution = evolutionQuery.data
  const granularite = evolution?.granularite ?? 'mois'

  function appliquerPreset(value: string | null) {
    if (!value) return
    setPreset(value)
    if (value === 'mois') setDebut(debutMois())
    else if (value === '30j') setDebut(decalerJours(29))
    else if (value === '90j') setDebut(decalerJours(89))
    else if (value === 'annee') setDebut(`${new Date().getFullYear()}-01-01`)
    setFin(aujourdhui())
  }

  function rafraichir() {
    void syntheseQuery.refetch()
    void evolutionQuery.refetch()
  }

  if (!can('rapports.view')) {
    return (
      <div className="flex flex-col items-center gap-3 py-24 text-center">
        <ShieldCheck className="size-12 stroke-[1.5] text-muted-foreground/60" />
        <p className="text-base font-medium text-foreground">Accès restreint</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          La consultation des rapports d'activité est réservée aux rôles autorisés du cabinet.
        </p>
      </div>
    )
  }

  const statuts = (synthese?.dossiers_par_statut ?? [])
    .filter((ligne) => ligne.total > 0)
    .map((ligne) => ({
      name: STATUT_DOSSIER_LABELS[ligne.statut],
      value: ligne.total,
    }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rapports</h1>
          <p className="text-sm text-muted-foreground">
            Synthèse d'activité du cabinet sur la période sélectionnée
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          disabled={exportMutation.isPending}
          onClick={() => exportMutation.mutate(periode)}
        >
          <Download className="size-4 mr-1.5" />
          {exportMutation.isPending ? 'Export…' : 'Exporter en CSV'}
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label>Période</Label>
              <Select items={PRESETS} value={preset} onValueChange={appliquerPreset}>
                <SelectTrigger className="w-full sm:w-56">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rapport-debut">Du</Label>
              <Input
                id="rapport-debut"
                type="date"
                className="w-full sm:w-44"
                value={debut}
                max={fin}
                onChange={(event) => {
                  setPreset('personnalise')
                  setDebut(event.target.value)
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rapport-fin">Au</Label>
              <Input
                id="rapport-fin"
                type="date"
                className="w-full sm:w-44"
                value={fin}
                min={debut}
                onChange={(event) => {
                  setPreset('personnalise')
                  setFin(event.target.value)
                }}
              />
            </div>
            <Button type="button" size="sm" className="hidden sm:inline-flex" variant="secondary" onClick={rafraichir}>
              <FileText className="size-4 mr-1.5" />
              Actualiser
            </Button>
            <p className="text-xs text-muted-foreground sm:ml-auto">
              {synthese
                ? `Période : ${formatDate(synthese.periode.debut)} → ${formatDate(synthese.periode.fin)}`
                : 'Chargement de la période…'}
            </p>
          </div>
        </CardContent>
      </Card>

      {syntheseQuery.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      ) : syntheseQuery.isError ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <CircleAlert className="size-10 text-destructive" />
          <p className="max-w-sm text-sm text-muted-foreground">
            Impossible de charger la synthèse de la période.
          </p>
          <Button variant="outline" size="sm" onClick={() => void syntheseQuery.refetch()}>
            Réessayer
          </Button>
        </div>
      ) : synthese ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Nouveaux clients"
            value={String(synthese.nouveaux_clients)}
            icon={<Users className="size-4" />}
            tone="bg-primary/10 text-primary"
          />
          <KpiCard
            label="Dossiers ouverts"
            value={String(synthese.dossiers_ouverts)}
            icon={<FileText className="size-4" />}
            tone="bg-blue-500/10 text-blue-600"
          />
          <KpiCard
            label="Dossiers clôturés"
            value={String(synthese.dossiers_clotures)}
            icon={<TrendingUp className="size-4" />}
            tone="bg-emerald-500/10 text-emerald-600"
          />
          <KpiCard
            label="Facturé"
            value={formatAriary(synthese.facturation.facture)}
            icon={<Wallet className="size-4" />}
            tone="bg-violet-500/10 text-violet-600"
            secondary={`${synthese.facturation.nb_factures} facture(s)`}
          />
          <KpiCard
            label="Encaissé"
            value={formatAriary(synthese.facturation.encaisse)}
            icon={<TrendingUp className="size-4" />}
            tone="bg-emerald-500/10 text-emerald-600"
            secondary={`${synthese.paiements.nombre} paiement(s)`}
          />
          <KpiCard
            label="Impayés"
            value={formatAriary(synthese.facturation.impaye)}
            icon={<CircleAlert className="size-4" />}
            tone="bg-amber-500/10 text-amber-600"
          />
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="size-4 text-primary" />
              Évolution de la facturation
            </CardTitle>
            <CardDescription>
              Montants facturés et encaissés par {granularite === 'an' ? 'année' : 'mois'}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {evolutionQuery.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : evolutionQuery.isError ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Impossible de charger l'évolution de la période.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={serieFinanciere(evolution?.data ?? [], granularite)}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    className="text-xs fill-muted-foreground"
                    tickFormatter={(value: number) =>
                      value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)} M` : String(value)
                    }
                  />
                  <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(value) => formatAriary(Number(value))} />
                  <Legend />
                  <Bar dataKey="factures" name="Facturé" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="encaisse" name="Encaissé" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <PieChartIcon className="size-4 text-primary" />
              Dossiers par statut
            </CardTitle>
            <CardDescription>Répartition des dossiers ouverts sur la période.</CardDescription>
          </CardHeader>
          <CardContent>
            {syntheseQuery.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : statuts.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <PieChartIcon className="size-10 stroke-[1.5] text-muted-foreground/60" />
                <p className="text-sm text-muted-foreground">
                  Aucun dossier ouvert sur cette période.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={statuts}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {statuts.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="size-4 text-primary" />
              Top clients
            </CardTitle>
            <CardDescription>Clientes ayant généré le plus de facturation.</CardDescription>
          </CardHeader>
          <CardContent>
            {syntheseQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (synthese?.top_clients ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune facture sur cette période.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-center">Factures</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(synthese?.top_clients ?? []).map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-medium">{client.nom}</TableCell>
                      <TableCell className="text-center text-sm">
                        {client.nombre_factures}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatAriary(client.montant)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Gavel className="size-4 text-primary" />
              Dossiers par avocat
            </CardTitle>
            <CardDescription>Répartition des dossiers ouverts entre les avocats.</CardDescription>
          </CardHeader>
          <CardContent>
            {syntheseQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (synthese?.par_avocat ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun dossier ouvert sur cette période.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Avocat</TableHead>
                    <TableHead className="text-right">Dossiers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(synthese?.par_avocat ?? []).map((avocat) => (
                    <TableRow key={avocat.id}>
                      <TableCell className="font-medium">{avocat.nom_complet}</TableCell>
                      <TableCell className="text-right text-sm">{avocat.dossiers}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Wallet className="size-4 text-primary" />
              Paiements par mode
            </CardTitle>
            <CardDescription>
              {synthese ? `${synthese.paiements.nombre} paiement(s) • ${formatAriary(synthese.paiements.total)}` : 'Encaissements de la période.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {syntheseQuery.isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : (synthese?.paiements.par_mode ?? []).every((mode) => mode.nombre === 0) ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucun paiement enregistré sur cette période.
              </p>
            ) : (
              <div className="space-y-3">
                {(synthese?.paiements.par_mode ?? [])
                  .filter((mode) => mode.nombre > 0)
                  .map((mode) => (
                    <div
                      key={mode.mode}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {MODE_PAIEMENT_LABELS[mode.mode]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {mode.nombre} opération(s)
                        </span>
                      </div>
                      <Badge variant="outline">{formatAriary(mode.total)}</Badge>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  icon,
  tone,
  secondary,
}: {
  label: string
  value: string
  icon: ReactNode
  tone: string
  secondary?: string
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <div className={`flex size-9 items-center justify-center rounded-lg ${tone}`}>{icon}</div>
          <div className="min-w-0">
            <p className="truncate text-xs text-muted-foreground">{label}</p>
            <p className="truncate text-lg font-bold">{value}</p>
            {secondary && <p className="truncate text-xs text-muted-foreground">{secondary}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
