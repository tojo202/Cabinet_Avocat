import { Users, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function ClientsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Gestion du répertoire clients particuliers et entreprises
          </p>
        </div>
        <Button size="sm">
          <Plus className="size-4 mr-1.5" />
          Nouveau Client
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des clients</CardTitle>
          <CardDescription>Consultez et gérez vos clients.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <Users className="size-12 stroke-[1.5] mb-3 text-muted-foreground/60" />
          <p className="text-base font-medium text-foreground">Module Clients</p>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Ce module permet de suivre l'ensemble des coordonnées, dossiers et factures associés à chaque client.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
