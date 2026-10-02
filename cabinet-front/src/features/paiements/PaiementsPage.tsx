import {
  Banknote,
  CircleAlert,
  Coins,
  Landmark,
  Receipt,
  Search,
  Smartphone,
  Wallet,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { usePaiements, usePaiementsStats } from '@/hooks/use-paiements'
import { formatAriary, formatDate, MODE_PAIEMENT_LABELS } from '@/lib/format'
import type { ModePaiement } from '@/types'
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

const MODES: ModePaiement[] = ['especes', 'virement', 'mobile_money', 'cheque']

const MODE_ICONS: Record<ModePaiement, typeof Banknote> = {
  especes: Banknote,
  virement: Landmark,
  mobile_money: Smartphone,
  cheque: Receipt,
}

const MODE_TONES: Record<ModePaiement, string> = {
  especes: 'bg-emerald-500/10 text-emerald-600',
  virement: 'bg-blue-500/10 text-blue-600',
  mobile_money: 'bg-violet-500/10 text-violet-600',
  cheque: 'bg-amber-500/10 text-amber-600',
}

export function PaiementsPage() {
  const [searchDossier, setSearchDossier] = useState('')
  const [mode, setMode] = useState<ModePaiement | ''>('')
  const [page, setPage] = useState(1)

  const listQuery = usePaiements({ mode, page })
  const statsQuery = usePaiementsStats()

  const paiements = listQuery.data?.data ?? []
  const meta = listQuery.data?.meta
  const stats = statsQuery.data

  const filtered = searchDossier.trim()
    ? paiements.filter((paiement) => {
        const term = searchDossier.trim().toLowerCase()
        const facture = paiement.facture
        return (
          (paiement.reference ?? '').toLowerCase().includes(term) ||
          (facture?.numero ?? '').toLowerCase().includes(term) ||
          (facture?.client?.nom_complet ?? '').toLowerCase().includes(term)
        )
      })
    : paiements

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    setPage(1)
  }

  const summaryCards = [
    {
      label: 'Total encaissé',
      value: formatAriary(stats?.total_encaisse),
      hint: `${stats?.nombre ?? 0} transaction(s)`,
      tone: 'bg-primary/10 text-primary',
      icon: Wallet,
    },
    {
      label: 'Encaissé ce mois',
      value: formatAriary(stats?.total_mois),
      hint: 'Période en cours',
      tone: 'bg-blue-500/10 text-blue-600',
      icon: Coins,
    },
    {
      label: 'Restant à encaisser',
      value: formatAriary(stats?.restant_a_encaisser),
      hint: 'Soldes ouverts',
      tone: 'bg-amber-500/10 text-amber-600',
      icon: Receipt,
    },
    {
      label: 'Transactions',
      value: String(stats?.nombre ?? 0),
      hint: 'Paiements enregistrés',
      tone: 'bg-emerald-500/10 text-emerald-600',
      icon: Banknote,
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
            <span className="text-foreground">Paiements</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
          <p className="text-sm text-muted-foreground">
            Historique des encaissements par mode et par facture
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => {
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
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <div>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODES.map((modeKey) => {
          const Icon = MODE_ICONS[modeKey]
          const stat = stats?.par_mode?.[modeKey]
          return (
            <Card key={modeKey}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex size-10 items-center justify-center rounded-lg ${MODE_TONES[modeKey]}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {MODE_PAIEMENT_LABELS[modeKey]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {stat?.nombre ?? 0} opération{(stat?.nombre ?? 0) > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="ms-auto text-right">
                    <p className="text-sm font-semibold">{formatAriary(stat?.total ?? 0)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Transactions reçues</CardTitle>
            <CardDescription>
              Chaque encaissement est rattaché à sa facture et à son client
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <form onSubmit={handleSearch} className="flex items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="w-56 pl-8"
                  placeholder="Référence, facture, client…"
                  value={searchDossier}
                  onChange={(event) => setSearchDossier(event.target.value)}
                />
              </div>
              <Button type="submit" size="sm">
                <Search className="size-4 mr-1.5" />
                Filtrer
              </Button>
            </form>
            <Select
              items={[
                { value: 'tous', label: 'Tous les modes' },
                ...MODES.map((item) => ({ value: item, label: MODE_PAIEMENT_LABELS[item] })),
              ]}
              value={mode || 'tous'}
              onValueChange={(value) => {
                setMode(value && value !== 'tous' ? (value as ModePaiement) : '')
                setPage(1)
              }}
            >
              <SelectTrigger size="sm">
                <SelectValue placeholder="Tous les modes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les modes</SelectItem>
                {MODES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {MODE_PAIEMENT_LABELS[item]}
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
                Impossible de charger les paiements.
              </p>
              <Button variant="outline" size="sm" onClick={() => void listQuery.refetch()}>
                Réessayer
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Wallet className="size-12 stroke-[1.5] text-muted-foreground/60" />
              <p className="text-base font-medium text-foreground">Aucun paiement</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {mode || searchDossier
                  ? 'Aucun résultat pour ces filtres.'
                  : 'Les encaissements enregistrés depuis la facturation apparaîtront ici.'}
              </p>
              <Link to="/facturation">
                <Button variant="outline" size="sm">
                  Aller à la facturation
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Mode</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Facture</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((paiement) => {
                    const Icon = MODE_ICONS[paiement.mode] ?? Banknote
                    return (
                      <TableRow key={paiement.id}>
                        <TableCell className="text-sm">
                          {formatDate(paiement.date_paiement)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`flex size-7 items-center justify-center rounded-lg ${MODE_TONES[paiement.mode] ?? 'bg-muted text-muted-foreground'}`}
                            >
                              <Icon className="size-3.5" />
                            </div>
                            <span className="text-sm">
                              {MODE_PAIEMENT_LABELS[paiement.mode] ?? paiement.mode}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {paiement.reference ?? '—'}
                        </TableCell>
                        <TableCell>
                          {paiement.facture ? (
                            <Badge variant="outline">{paiement.facture.numero}</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {paiement.facture?.client?.nom_complet ?? '—'}
                          {paiement.facture?.dossier && (
                            <span className="block text-xs text-muted-foreground">
                              {paiement.facture.dossier.reference}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatAriary(paiement.montant)}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <ListPagination meta={meta} page={page} onPageChange={setPage} itemLabel="paiement" />
        </CardContent>
      </Card>
    </div>
  )
}
