import { zodResolver } from '@hookform/resolvers/zod'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import FullCalendar from '@fullcalendar/react'
import interactionPlugin from '@fullcalendar/react/interaction'
import themeMonarch from '@fullcalendar/react/themes/monarch'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/monarch/theme.css'
import type {
  DateClickInfo,
  DateSelectInfo,
  DatesSetInfo,
  EventClickInfo,
  EventInput,
} from '@fullcalendar/react'
import {
  CalendarDays,
  CircleAlert,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { useDossiers } from '@/hooks/use-dossiers'
import {
  useCreateEvenement,
  useDeleteEvenement,
  useEvenements,
  useUpdateEvenement,
} from '@/hooks/use-evenements'
import { formatDateTime, TYPE_EVENEMENT_LABELS } from '@/lib/format'
import { useAuth } from '@/store/auth'
import type { Evenement, TypeEvenement } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { ClientPicker } from '@/components/ClientPicker'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldError } from '@/components/FieldError'
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
import { Textarea } from '@/components/ui/textarea'

const TYPES: TypeEvenement[] = ['rendez_vous', 'audience', 'echeance']

const EVENT_COLORS: Record<TypeEvenement, string> = {
  rendez_vous: '#3b82f6',
  audience: '#f59e0b',
  echeance: '#ef4444',
}

const evenementSchema = z
  .object({
    titre: z.string().min(1, 'Le titre est requis.').max(255),
    type: z.enum(['rendez_vous', 'audience', 'echeance']),
    debut: z.string().min(1, 'La date de début est requise.'),
    fin: z.string(),
    lieu: z.string().max(255),
    description: z.string(),
    dossier_id: z.number().nullable(),
    client_id: z.number().nullable(),
  })
  .superRefine((values, ctx) => {
    if (values.fin && values.fin < values.debut) {
      ctx.addIssue({
        code: 'custom',
        path: ['fin'],
        message: 'La fin doit être postérieure au début.',
      })
    }
  })

type EvenementFormValues = z.infer<typeof evenementSchema>

function pad(value: number): string {
  return String(value).padStart(2, '0')
}

function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function dateStrToLocalInput(date: string): string {
  return `${date}T09:00`
}

function emptyValues(): EvenementFormValues {
  const now = new Date()
  const debut = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:00`
  const fin = new Date(now.getTime() + 3_600_000)
  return {
    titre: '',
    type: 'rendez_vous',
    debut,
    fin: `${fin.getFullYear()}-${pad(fin.getMonth() + 1)}-${pad(fin.getDate())}T${pad(fin.getHours())}:${pad(fin.getMinutes())}`,
    lieu: '',
    description: '',
    dossier_id: null,
    client_id: null,
  }
}

function toValues(evenement: Evenement | null): EvenementFormValues {
  if (!evenement) return emptyValues()
  return {
    titre: evenement.titre,
    type: evenement.type,
    debut: toLocalInput(evenement.debut),
    fin: toLocalInput(evenement.fin),
    lieu: evenement.lieu ?? '',
    description: evenement.description ?? '',
    dossier_id: evenement.dossier_id,
    client_id: evenement.client_id,
  }
}

export function CalendrierPage() {
  const can = useAuth((s) => s.can)
  const canManage = can('evenements.manage')

  const [range, setRange] = useState<{ from: string; to: string }>(() => {
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), 1)
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return {
      from: `${from.getFullYear()}-${pad(from.getMonth() + 1)}-${pad(from.getDate())}`,
      to: `${to.getFullYear()}-${pad(to.getMonth() + 1)}-${pad(to.getDate())}`,
    }
  })
  const [typeFilter, setTypeFilter] = useState<TypeEvenement | ''>('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Evenement | null>(null)
  const [deleting, setDeleting] = useState<Evenement | null>(null)

  const eventsQuery = useEvenements({ from: range.from, to: range.to, type: typeFilter })
  const dossiersQuery = useDossiers({ per_page: 100 })

  const createMutation = useCreateEvenement()
  const updateMutation = useUpdateEvenement()
  const deleteMutation = useDeleteEvenement()

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EvenementFormValues>({
    resolver: zodResolver(evenementSchema),
    defaultValues: emptyValues(),
  })

  const evenements = eventsQuery.data?.data ?? []
  const dossiers = dossiersQuery.data?.data ?? []
  const saving = createMutation.isPending || updateMutation.isPending

  const calendarEvents: EventInput[] = evenements.map((evenement) => ({
    id: String(evenement.id),
    title: evenement.titre,
    start: evenement.debut,
    end: evenement.fin ?? undefined,
    backgroundColor: EVENT_COLORS[evenement.type],
    borderColor: EVENT_COLORS[evenement.type],
    textColor: '#ffffff',
    extendedProps: { type: evenement.type },
  }))

  function openCreate(prefill?: Partial<EvenementFormValues>) {
    setEditing(null)
    reset({ ...emptyValues(), ...prefill })
    setFormOpen(true)
  }

  function openEdit(evenement: Evenement) {
    setEditing(evenement)
    reset(toValues(evenement))
    setFormOpen(true)
  }

  function onSubmit(values: EvenementFormValues) {
    const payload = {
      titre: values.titre.trim(),
      type: values.type,
      debut: values.debut,
      fin: values.fin || null,
      lieu: values.lieu.trim() || null,
      description: values.description.trim() || null,
      dossier_id: values.dossier_id,
      client_id: values.client_id,
    }

    if (editing) {
      updateMutation.mutate(
        { id: editing.id, data: payload },
        { onSuccess: () => setFormOpen(false) },
      )
    } else {
      createMutation.mutate(payload, { onSuccess: () => setFormOpen(false) })
    }
  }

  function handleDatesSet(info: DatesSetInfo) {
    const from = info.startStr.slice(0, 10)
    const to = info.endStr.slice(0, 10)
    setRange((current) => (current.from === from && current.to === to ? current : { from, to }))
  }

  function handleDateClick(info: DateClickInfo) {
    if (!canManage) return
    openCreate({ debut: dateStrToLocalInput(info.dateStr.slice(0, 10)) })
  }

  function handleSelect(info: DateSelectInfo) {
    if (!canManage) return
    openCreate({
      debut: toLocalInput(info.startStr) || info.startStr,
      fin: info.allDay ? '' : toLocalInput(info.endStr),
    })
  }

  function handleEventClick(info: EventClickInfo) {
    const id = Number(info.event.id)
    const evenement = evenements.find((item) => item.id === id)
    if (evenement) openEdit(evenement)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Link to="/dashboard" className="transition-colors hover:text-foreground">
              Tableau de bord
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-foreground">Calendrier</span>
          </nav>
          <h1 className="text-2xl font-bold tracking-tight">Calendrier & échéances</h1>
          <p className="text-sm text-muted-foreground">
            Audiences, rendez-vous et échéances rattachés à vos dossiers
          </p>
        </div>
        {canManage && (
          <Button size="sm" onClick={() => openCreate()}>
            <Plus className="size-4 mr-1.5" />
            Nouvel événement
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setTypeFilter('')}
          className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
            typeFilter === ''
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background text-muted-foreground hover:text-foreground'
          }`}
        >
          Tous
        </button>
        {TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setTypeFilter(type === typeFilter ? '' : type)}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              typeFilter === type
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground hover:text-foreground'
            }`}
          >
            <span
              className="size-2 rounded-full"
              style={{ backgroundColor: EVENT_COLORS[type] }}
            />
            {TYPE_EVENEMENT_LABELS[type]}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
          <Search className="size-3.5" />
          {evenements.length} événement{evenements.length > 1 ? 's' : ''} sur la période
        </span>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <CalendarDays className="size-4 text-primary" />
            Agenda du cabinet
          </CardTitle>
          <CardDescription>
            Cliquez sur une date pour créer un événement, sur un événement pour le modifier.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {eventsQuery.isLoading ? (
            <Skeleton className="h-[640px] w-full rounded-lg" />
          ) : eventsQuery.isError ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <CircleAlert className="size-10 text-destructive" />
              <p className="max-w-sm text-sm text-muted-foreground">
                Impossible de charger le calendrier.
              </p>
              <Button variant="outline" size="sm" onClick={() => void eventsQuery.refetch()}>
                Réessayer
              </Button>
            </div>
          ) : (
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, themeMonarch]}
              initialView="dayGridMonth"
              locale="fr"
              firstDay={1}
              height="auto"
              selectable={canManage}
              editable={false}
              dayMaxEvents={3}
              nowIndicator
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay',
              }}
              events={calendarEvents}
              datesSet={handleDatesSet}
              dateClick={handleDateClick}
              select={handleSelect}
              eventClick={handleEventClick}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier l’événement' : 'Nouvel événement'}</DialogTitle>
            <DialogDescription>
              {editing
                ? 'Mettez à jour le créneau, le lieu et les rattachements.'
                : 'Planifiez une audience, un rendez-vous ou une échéance.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="event-titre">Titre</Label>
                <Input
                  id="event-titre"
                  placeholder="Audience — Tribunal de première instance"
                  {...register('titre')}
                />
                <FieldError message={errors.titre?.message} />
              </div>

              <div className="space-y-1.5">
                <Label>Type</Label>
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      items={TYPES.map((item) => ({
                        value: item,
                        label: TYPE_EVENEMENT_LABELS[item],
                      }))}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TYPES.map((item) => (
                          <SelectItem key={item} value={item}>
                            {TYPE_EVENEMENT_LABELS[item]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.type?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event-lieu">Lieu</Label>
                <Input id="event-lieu" placeholder="Salle d'audience 3…" {...register('lieu')} />
                <FieldError message={errors.lieu?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event-debut">Début</Label>
                <Input id="event-debut" type="datetime-local" {...register('debut')} />
                <FieldError message={errors.debut?.message} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="event-fin">Fin</Label>
                <Input id="event-fin" type="datetime-local" {...register('fin')} />
                <FieldError message={errors.fin?.message} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Dossier rattaché (facultatif)</Label>
                <Controller
                  control={control}
                  name="dossier_id"
                  render={({ field }) => (
                    <Select
                      items={dossiers.map((dossier) => ({
                        value: dossier.id,
                        label: `${dossier.reference} — ${dossier.titre}`,
                      }))}
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? null)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Aucun dossier" />
                      </SelectTrigger>
                      <SelectContent>
                        {dossiers.map((dossier) => (
                          <SelectItem key={dossier.id} value={dossier.id}>
                            {dossier.reference} — {dossier.titre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError message={errors.dossier_id?.message} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Client (facultatif)</Label>
                <Controller
                  control={control}
                  name="client_id"
                  render={({ field }) => (
                    <ClientPicker
                      value={field.value}
                      placeholder="Aucun client"
                      onChange={(client) => field.onChange(client?.id ?? null)}
                    />
                  )}
                />
                <FieldError message={errors.client_id?.message} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="event-description">Description</Label>
                <Textarea
                  id="event-description"
                  rows={3}
                  placeholder="Ordre du jour, pièces à préparer…"
                  {...register('description')}
                />
              </div>
            </div>

            <DialogFooter className="sm:justify-between">
              <div>
                {editing && canManage && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setFormOpen(false)
                      setDeleting(editing)
                    }}
                  >
                    <Trash2 className="size-4 mr-1.5" />
                    Supprimer
                  </Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFormOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer'}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Supprimer l’événement"
        description={`« ${deleting?.titre ?? ''} » sera retiré du calendrier.`}
        confirmLabel="Supprimer"
        loading={deleteMutation.isPending}
        onConfirm={() => {
          if (!deleting) return
          deleteMutation.mutate(deleting.id, { onSuccess: () => setDeleting(null) })
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Prochains événements</CardTitle>
          <CardDescription>Charge programmée sur la période affichée</CardDescription>
        </CardHeader>
        <CardContent>
          {eventsQuery.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : evenements.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Aucun événement planifié sur cette période.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {evenements.slice(0, 8).map((evenement) => (
                <li key={evenement.id} className="flex items-center gap-3 py-2.5">
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: EVENT_COLORS[evenement.type] }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {evenement.titre}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDateTime(evenement.debut)}
                      {evenement.lieu ? ` • ${evenement.lieu}` : ''}
                    </p>
                  </div>
                  <Badge variant="outline">{TYPE_EVENEMENT_LABELS[evenement.type]}</Badge>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={() => openEdit(evenement)}
                  >
                    Modifier
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
