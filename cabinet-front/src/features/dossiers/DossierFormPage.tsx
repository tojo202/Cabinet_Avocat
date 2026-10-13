import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  CircleAlert,
  Eye,
  FolderOpen,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAvocats } from '@/hooks/use-avocats'
import { useCreateDossier, useDossier, useUpdateDossier } from '@/hooks/use-dossiers'
import { formatAriary, PRIORITE_LABELS, STATUT_DOSSIER_LABELS } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { ClientPicker } from '@/components/ClientPicker'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { FieldError } from '@/components/FieldError'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
  PRIORITES,
  STATUTS,
  TYPE_DROIT_SUGGESTIONS,
  dossierSchema,
  emptyValues,
  toPayload,
  toValues,
  todayISO,
  type DossierFormValues,
} from './dossier-form'

function PreviewRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium break-words">{children}</span>
    </div>
  )
}

export function DossierFormPage() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEdit = Boolean(id)
  const dossierId = id ? Number(id) : null
  const hasValidId = dossierId !== null && Number.isFinite(dossierId) && dossierId > 0

  const dossierQuery = useDossier(hasValidId ? dossierId : null)
  const avocatsQuery = useAvocats({ per_page: 100 })
  const createMutation = useCreateDossier()
  const updateMutation = useUpdateDossier()

  const [avocatSearch, setAvocatSearch] = useState('')
  const [clientLabel, setClientLabel] = useState<string | null>(null)
  const [pendingPath, setPendingPath] = useState<string | null>(null)

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors, isDirty },
  } = useForm<DossierFormValues>({
    resolver: zodResolver(dossierSchema),
    defaultValues: emptyValues(),
  })

  const dossier = dossierQuery.data ?? null
  const avocats = avocatsQuery.data?.data ?? []
  const values = watch()
  const saving = createMutation.isPending || updateMutation.isPending
  const shouldWarn = isDirty && !saving

  const filteredAvocats = avocatSearch.trim()
    ? avocats.filter((avocat) => {
        const term = avocatSearch.trim().toLowerCase()
        return (
          avocat.nom_complet.toLowerCase().includes(term) ||
          (avocat.specialite ?? '').toLowerCase().includes(term)
        )
      })
    : avocats

  const selectedAvocats = values.avocat_ids ?? []
  const clientName =
    clientLabel ?? dossier?.client?.nom_complet ?? (values.client_id > 0 ? '—' : 'Non renseigné')

  useEffect(() => {
    if (isEdit) reset(toValues(dossier))
  }, [isEdit, dossier, reset])

  // Avertit le navigateur (rafraîchissement / fermeture d'onglet) en cas de saisie non enregistrée.
  useEffect(() => {
    if (!shouldWarn) return
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [shouldWarn])

  function guardLink(event: React.MouseEvent<HTMLAnchorElement>, path: string) {
    if (!shouldWarn) return
    event.preventDefault()
    setPendingPath(path)
  }

  function guardButton(path: string) {
    if (shouldWarn) {
      setPendingPath(path)
      return
    }
    navigate(path)
  }

  function toggleAvocat(avocatId: number) {
    const current = getValues('avocat_ids') ?? []
    const next = current.includes(avocatId)
      ? current.filter((item) => item !== avocatId)
      : [...current, avocatId]
    setValue('avocat_ids', next, { shouldDirty: true })
  }

  function onSubmit(formValues: DossierFormValues) {
    const payload = toPayload(formValues)

    if (isEdit && hasValidId && dossierId !== null) {
      updateMutation.mutate(
        { id: dossierId, data: payload },
        { onSuccess: () => navigate('/dossiers') },
      )
      return
    }

    createMutation.mutate(payload, { onSuccess: () => navigate('/dossiers') })
  }

  if (isEdit && (!hasValidId || dossierQuery.isError)) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border py-16 text-center">
          <CircleAlert className="size-10 text-destructive" />
          <p className="max-w-sm text-sm text-muted-foreground">
            {hasValidId ? 'Impossible de charger ce dossier.' : 'Ce dossier est introuvable.'}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/dossiers')}>
              Retour aux dossiers
            </Button>
            {hasValidId && (
              <Button size="sm" onClick={() => void dossierQuery.refetch()}>
                Réessayer
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (isEdit && hasValidId && dossierQuery.isLoading) {
    return (
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <nav className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link
            to="/dashboard"
            className="transition-colors hover:text-foreground"
            onClick={(event) => guardLink(event, '/dashboard')}
          >
            Tableau de bord
          </Link>
          <span aria-hidden="true">/</span>
          <Link
            to="/dossiers"
            className="transition-colors hover:text-foreground"
            onClick={(event) => guardLink(event, '/dossiers')}
          >
            Dossiers
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-foreground">{isEdit ? 'Modifier' : 'Nouveau'}</span>
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? 'Modifier le dossier' : 'Nouveau dossier'}
          </h1>
          {isEdit && dossier && <Badge variant="outline">{dossier.reference}</Badge>}
        </div>
        <p className="text-sm text-muted-foreground">
          {isEdit
            ? 'Mettez à jour l’état de l’affaire, son avancement et son équipe.'
            : 'Ouvrez une affaire, rattachez-la à un client et affectez les avocats.'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Client et affaire</CardTitle>
                <CardDescription>
                  Le dossier est toujours rattaché à un client existant.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Client</Label>
                  <Controller
                    control={control}
                    name="client_id"
                    render={({ field }) => (
                      <ClientPicker
                        value={field.value > 0 ? field.value : null}
                        label={dossier?.client?.nom_complet}
                        invalid={Boolean(errors.client_id)}
                        onChange={(client) => {
                          field.onChange(client?.id ?? 0)
                          setClientLabel(client?.nom_complet ?? null)
                        }}
                      />
                    )}
                  />
                  <FieldError message={errors.client_id?.message} />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="dossier-titre">Titre de l’affaire</Label>
                  <Input
                    id="dossier-titre"
                    placeholder="Licence commerciale — litige"
                    {...register('titre')}
                  />
                  <FieldError message={errors.titre?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dossier-type">Type de droit</Label>
                  <Input id="dossier-type" list="type-droit-options" {...register('type_droit')} />
                  <datalist id="type-droit-options">
                    {TYPE_DROIT_SUGGESTIONS.map((option) => (
                      <option key={option} value={option} />
                    ))}
                  </datalist>
                  <FieldError message={errors.type_droit?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dossier-montant">Montant en jeu (Ar)</Label>
                  <Input
                    id="dossier-montant"
                    type="number"
                    min={0}
                    placeholder="0"
                    {...register('montant', {
                      setValueAs: (value) =>
                        value === '' || value === null || value === undefined
                          ? null
                          : Number(value),
                    })}
                  />
                  <FieldError message={errors.montant?.message} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base font-semibold">Classement et suivi</CardTitle>
                <CardDescription>
                  Priorité, statut et avancement alimentent le tableau de bord et la vue Kanban.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Priorité</Label>
                  <Controller
                    control={control}
                    name="priorite"
                    render={({ field }) => (
                      <Select
                        items={PRIORITES.map((item) => ({
                          value: item,
                          label: PRIORITE_LABELS[item],
                        }))}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PRIORITES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {PRIORITE_LABELS[item]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.priorite?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label>Statut</Label>
                  <Controller
                    control={control}
                    name="statut"
                    render={({ field }) => (
                      <Select
                        items={STATUTS.map((item) => ({
                          value: item,
                          label: STATUT_DOSSIER_LABELS[item],
                        }))}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUTS.map((item) => (
                            <SelectItem key={item} value={item}>
                              {STATUT_DOSSIER_LABELS[item]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError message={errors.statut?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dossier-ouverture">Date d’ouverture</Label>
                  <Input
                    id="dossier-ouverture"
                    type="date"
                    max={todayISO()}
                    {...register('date_ouverture')}
                  />
                  <FieldError message={errors.date_ouverture?.message} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="dossier-cloture">Date de clôture</Label>
                  <Input id="dossier-cloture" type="date" {...register('date_cloture')} />
                  <FieldError message={errors.date_cloture?.message} />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dossier-avancement">Avancement</Label>
                    <span className="text-xs font-medium text-muted-foreground">
                      {values.avancement ?? 0}%
                    </span>
                  </div>
                  <Input
                    id="dossier-avancement"
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    {...register('avancement', { valueAsNumber: true })}
                  />
                  <FieldError message={errors.avancement?.message} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Users className="size-4" />
                  Avocats affectés
                  {selectedAvocats.length > 0 && (
                    <Badge variant="secondary">{selectedAvocats.length}</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Un avocat ne voit que les dossiers qui lui sont assignés.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {avocatsQuery.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : avocats.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Aucun avocat disponible dans le cabinet.
                  </p>
                ) : (
                  <>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        className="pl-8"
                        placeholder="Rechercher par nom ou spécialité…"
                        value={avocatSearch}
                        onChange={(event) => setAvocatSearch(event.target.value)}
                      />
                    </div>
                    {filteredAvocats.length === 0 ? (
                      <p className="rounded-lg border border-dashed border-border px-3 py-4 text-center text-xs text-muted-foreground">
                        Aucun avocat ne correspond à « {avocatSearch.trim()} ».
                      </p>
                    ) : (
                      <div className="grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-border p-3 sm:grid-cols-2">
                        {filteredAvocats.map((avocat) => (
                          <label
                            key={avocat.id}
                            className="flex cursor-pointer items-center gap-2 text-sm"
                          >
                            <Checkbox
                              checked={selectedAvocats.includes(avocat.id)}
                              onChange={() => toggleAvocat(avocat.id)}
                            />
                            <span>{avocat.nom_complet}</span>
                            {avocat.specialite && (
                              <span className="text-xs text-muted-foreground">
                                • {avocat.specialite}
                              </span>
                            )}
                          </label>
                        ))}
                      </div>
                    )}
                  </>
                )}
                {errors.avocat_ids?.message && <FieldError message={errors.avocat_ids.message} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <FolderOpen className="size-4" />
                  Description
                </CardTitle>
                <CardDescription>Contexte, pièces reçues, prochaines étapes.</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  id="dossier-description"
                  rows={4}
                  placeholder="Contexte, pièces reçues, prochaines étapes…"
                  {...register('description')}
                />
              </CardContent>
            </Card>
          </div>

          <aside className="lg:sticky lg:top-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <Eye className="size-4" />
                  Aperçu
                </CardTitle>
                <CardDescription>Récapitulatif mis à jour pendant la saisie.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <PreviewRow label="Référence">
                  {isEdit && dossier ? (
                    <span className="tabular-nums">{dossier.reference}</span>
                  ) : (
                    <span className="text-muted-foreground">Générée à la création</span>
                  )}
                </PreviewRow>
                <PreviewRow label="Client">{clientName}</PreviewRow>
                <PreviewRow label="Titre">
                  {values.titre?.trim() ? (
                    values.titre
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </PreviewRow>
                <PreviewRow label="Type de droit">
                  {values.type_droit?.trim() ? (
                    values.type_droit
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </PreviewRow>
                <PreviewRow label="Statut">
                  <Badge variant="outline">{STATUT_DOSSIER_LABELS[values.statut]}</Badge>
                </PreviewRow>
                <PreviewRow label="Priorité">
                  <Badge
                    variant={
                      values.priorite === 'urgente'
                        ? 'destructive'
                        : values.priorite === 'haute'
                          ? 'default'
                          : 'secondary'
                    }
                  >
                    {PRIORITE_LABELS[values.priorite]}
                  </Badge>
                </PreviewRow>
                <PreviewRow label="Montant">
                  {values.montant != null ? (
                    <span className="tabular-nums">{formatAriary(values.montant)}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </PreviewRow>
                <PreviewRow label="Avocats">
                  {selectedAvocats.length > 0
                    ? `${selectedAvocats.length} affecté(s)`
                    : 'Aucun'}
                </PreviewRow>
                <div className="space-y-1.5 border-t border-border pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Avancement</span>
                    <span className="font-medium">{values.avancement ?? 0}%</span>
                  </div>
                  <Progress value={values.avancement ?? 0} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </aside>
        </div>

        <div className="sticky bottom-0 z-20 -mx-4 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => guardButton('/dossiers')}
            >
              <ArrowLeft className="size-4 mr-1.5" />
              Annuler
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={saving}>
              {!isEdit && <Plus className="size-4 mr-1.5" />}
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer le dossier'}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmDialog
        open={pendingPath !== null}
        onOpenChange={(open) => !open && setPendingPath(null)}
        title="Modifications non enregistrées"
        description="Des modifications n’ont pas été enregistrées. Si vous quittez maintenant, elles seront définitivement perdues."
        confirmLabel="Quitter sans enregistrer"
        destructive={false}
        onConfirm={() => {
          if (!pendingPath) return
          navigate(pendingPath)
        }}
      />
    </div>
  )
}
