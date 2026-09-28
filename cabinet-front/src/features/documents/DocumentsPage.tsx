import { BookOpen, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground">
            Gestion électronique des documents et pièces juridiques (GED)
          </p>
        </div>
        <Button size="sm">
          <Upload className="size-4 mr-1.5" />
          Téléverser un document
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Base documentaire</CardTitle>
          <CardDescription>Tous les fichiers, contrats et pièces numérisées.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <BookOpen className="size-12 stroke-[1.5] mb-3 text-muted-foreground/60" />
          <p className="text-base font-medium text-foreground">Module Documents (GED)</p>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Classez, recherchez et partagez vos documents classés par catégories et dossiers.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
