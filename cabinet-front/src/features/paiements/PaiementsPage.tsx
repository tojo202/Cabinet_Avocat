import { Wallet, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function PaiementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Paiements</h1>
          <p className="text-sm text-muted-foreground">
            Suivi des encaissements et règlements des factures
          </p>
        </div>
        <Button size="sm">
          <Plus className="size-4 mr-1.5" />
          Enregistrer un paiement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Encaissements</CardTitle>
          <CardDescription>Historique des paiements reçus.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Wallet className="size-12 stroke-[1.5] mb-3 text-muted-foreground/60" />
          <p className="text-base font-medium text-foreground">Module Paiements</p>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Retrouvez chaque règlement, son mode de paiement et la facture associée.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
