import { zodResolver } from '@hookform/resolvers/zod'
import {
  Building2,
  CheckCircle2,
  KeyRound,
  LogOut,
  Save,
  Shield,
  User as UserIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { useChangeMotDePasse, useUpdateProfil } from '@/hooks/use-profile'
import { useLogout } from '@/hooks/use-logout'
import { ROLES_LABELS } from '@/lib/format'
import { useAuth } from '@/store/auth'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { FieldError } from '@/components/FieldError'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const infosSchema = z.object({
  name: z.string().min(1, 'Le nom est requis.').max(255, '255 caractères maximum.'),
  email: z.email('Adresse e-mail invalide.').max(255, '255 caractères maximum.'),
})

type InfosFormValues = z.infer<typeof infosSchema>

const motDePasseSchema = z
  .object({
    current_password: z.string().min(1, 'Le mot de passe actuel est requis.'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.'),
    password_confirmation: z.string().min(1, 'Veuillez confirmer le mot de passe.'),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['password_confirmation'],
  })

type MotDePasseFormValues = z.infer<typeof motDePasseSchema>

const EMPTY_MOT_DE_PASSE: MotDePasseFormValues = {
  current_password: '',
  password: '',
  password_confirmation: '',
}

function initiales(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function ProfilPage() {
  const user = useAuth((s) => s.user)
  const handleLogout = useLogout()
  const updateProfil = useUpdateProfil()
  const changeMotDePasse = useChangeMotDePasse()

  const [tab, setTab] = useState('informations')

  const {
    control: infosControl,
    handleSubmit: handleInfosSubmit,
    formState: { errors: infosErrors },
  } = useForm<InfosFormValues>({
    resolver: zodResolver(infosSchema),
    values: { name: user?.name ?? '', email: user?.email ?? '' },
  })

  const {
    control: motDePasseControl,
    handleSubmit: handleMotDePasseSubmit,
    reset: resetMotDePasse,
    formState: { errors: motDePasseErrors },
  } = useForm<MotDePasseFormValues>({
    resolver: zodResolver(motDePasseSchema),
    defaultValues: EMPTY_MOT_DE_PASSE,
  })

  const roleLabel = user ? ROLES_LABELS[user.role] : '—'
  const avatar = initiales(user?.name ?? '?')

  function onInfosSubmit(values: InfosFormValues) {
    updateProfil.mutate(values)
  }

  function onMotDePasseSubmit(values: MotDePasseFormValues) {
    changeMotDePasse.mutate(values, {
      onSuccess: () => resetMotDePasse(EMPTY_MOT_DE_PASSE),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mon profil</h1>
          <p className="text-sm text-muted-foreground">
            Vos informations personnelles et la sécurité de votre compte
          </p>
        </div>
        <Button variant="destructive" size="sm" className="gap-2" onClick={handleLogout}>
          <LogOut className="size-4" />
          Se déconnecter
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        {/* Carte d'identité */}
        <Card className="h-fit">
          <CardContent className="flex flex-col items-center gap-3 pt-6 text-center">
            <Avatar className="size-20 border-2 border-primary/20">
              <AvatarFallback className="bg-primary text-2xl font-bold text-primary-foreground">
                {avatar}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-lg font-semibold">{user?.name}</p>
              <p className="break-all text-sm text-muted-foreground">{user?.email}</p>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {roleLabel}
            </Badge>

            <div className="mt-3 w-full space-y-3 border-t border-border pt-4 text-left text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="size-4 shrink-0 text-primary" />
                CabinetPro Avocats
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="size-4 shrink-0 text-primary" />
                Rôle : {roleLabel}
              </div>
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle2 className="size-4 shrink-0" />
                Compte actif
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informations & sécurité */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="informations">Informations</TabsTrigger>
            <TabsTrigger value="securite">Sécurité</TabsTrigger>
          </TabsList>

          <TabsContent value="informations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <UserIcon className="size-4 text-primary" />
                  Informations personnelles
                </CardTitle>
                <CardDescription>
                  Modifiez votre nom et votre adresse e-mail de connexion.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleInfosSubmit(onInfosSubmit)}
                  className="max-w-md space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="profil-name">Nom complet</Label>
                    <Input
                      id="profil-name"
                      placeholder="Prénom Nom"
                      {...infosControl.register('name')}
                    />
                    <FieldError message={infosErrors.name?.message} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="profil-email">Adresse e-mail</Label>
                    <Input
                      id="profil-email"
                      type="email"
                      placeholder="prenom@cabinet.mg"
                      {...infosControl.register('email')}
                    />
                    <FieldError message={infosErrors.email?.message} />
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    className="gap-2"
                    disabled={updateProfil.isPending}
                  >
                    <Save className="size-4" />
                    {updateProfil.isPending ? 'Enregistrement…' : 'Enregistrer'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="securite" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <KeyRound className="size-4 text-primary" />
                  Changer mon mot de passe
                </CardTitle>
                <CardDescription>
                  Utilisez un mot de passe d'au moins 8 caractères.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleMotDePasseSubmit(onMotDePasseSubmit)}
                  className="max-w-md space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="profil-current-password">Mot de passe actuel</Label>
                    <Input
                      id="profil-current-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      {...motDePasseControl.register('current_password')}
                    />
                    <FieldError message={motDePasseErrors.current_password?.message} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="profil-new-password">Nouveau mot de passe</Label>
                    <Input
                      id="profil-new-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...motDePasseControl.register('password')}
                    />
                    <FieldError message={motDePasseErrors.password?.message} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="profil-confirm-password">
                      Confirmer le mot de passe
                    </Label>
                    <Input
                      id="profil-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...motDePasseControl.register('password_confirmation')}
                    />
                    <FieldError message={motDePasseErrors.password_confirmation?.message} />
                  </div>

                  <Button
                    type="submit"
                    size="sm"
                    className="gap-2"
                    disabled={changeMotDePasse.isPending}
                  >
                    <KeyRound className="size-4" />
                    {changeMotDePasse.isPending ? 'Modification…' : 'Modifier le mot de passe'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
              <Shield className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                Après un changement de mot de passe, restez connecté sur vos appareils
                de confiance. Votre session actuelle reste active.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
