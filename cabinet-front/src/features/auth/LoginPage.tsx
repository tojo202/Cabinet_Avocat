import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Scale } from 'lucide-react'
import { apiErrorMessage } from '@/lib/axios'
import { useAuth } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function LoginPage() {
  const login = useAuth((s) => s.login)
  const token = useAuth((s) => s.token)
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const mutation = useMutation({
    mutationFn: () => login(email, password),
    onSuccess: (user) => {
      const from = (location.state as { from?: string } | null)?.from
      navigate(from && from !== '/login' ? from : '/dashboard', { replace: true })
      toast.success(`Bienvenue, ${user.name}.`)
    },
    onError: (error) => toast.error(apiErrorMessage(error, 'Connexion impossible.')),
  })

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-background p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Scale className="size-5" />
          </div>
          <h1 className="text-xl font-semibold">CabinetPro</h1>
          <p className="text-sm text-muted-foreground">
            Connectez-vous à votre espace cabinet
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Adresse e-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@cabinet.mg"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Mot de passe</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? 'Connexion en cours…' : 'Se connecter'}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground">
          Accès de démonstration : admin@cabinet.mg / password
        </p>
      </div>
    </div>
  )
}
