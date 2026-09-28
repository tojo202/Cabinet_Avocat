import { FolderOpen, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DossiersPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dossiers</h1>
          <p className="text-sm text-muted-foreground">
            Suivi et gestion des affaires juridiques du cabinet
          </p>
        </div>
        <Button size="sm">
          <Plus className="size-4 mr-1.5" />
          Nouveau Dossier
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Gestion des affaires</CardTitle>
          <CardDescription>Tous les dossiers juridiques en cours et archivés.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <FolderOpen className="size-12 stroke-[1.5] mb-3 text-muted-foreground/60" />
          <p className="text-base font-medium text-foreground">Module Dossiers Juridiques</p>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Gérez les affaires, avocats assignés, audiences, pièces et échéances.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
