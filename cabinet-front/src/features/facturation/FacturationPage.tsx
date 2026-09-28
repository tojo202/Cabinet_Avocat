import { FileText, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function FacturationPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Facturation</h1>
          <p className="text-sm text-muted-foreground">
            Factures, encaissements, devis et suivi des honoraires
          </p>
        </div>
        <Button size="sm">
          <Plus className="size-4 mr-1.5" />
          Nouvelle Facture
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Factures & Paiements</CardTitle>
          <CardDescription>Suivi de la facturation et des règlements.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <FileText className="size-12 stroke-[1.5] mb-3 text-muted-foreground/60" />
          <p className="text-base font-medium text-foreground">Module Facturation</p>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Générez des factures professionnelles en PDF, suivez les encaissements et relances.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
