import { CalendarDays, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function CalendrierPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Calendrier & Audiences</h1>
          <p className="text-sm text-muted-foreground">
            Planning des audiences, rendez-vous et échéances du cabinet
          </p>
        </div>
        <Button size="sm">
          <Plus className="size-4 mr-1.5" />
          Nouvel Événement
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agenda du cabinet</CardTitle>
          <CardDescription>Vue d'ensemble des audiences et rendez-vous.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <CalendarDays className="size-12 stroke-[1.5] mb-3 text-muted-foreground/60" />
          <p className="text-base font-medium text-foreground">Module Calendrier</p>
          <p className="text-sm text-muted-foreground max-w-sm mt-1">
            Visualisez le calendrier des audiences, rendez-vous clients et dates limites.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
