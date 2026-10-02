import {
  BarChart3,
  Bell,
  CalendarDays,
  CheckCheck,
  ChevronDown,
  FileText,
  FolderOpen,
  LogOut,
  Menu,
  PieChart,
  SlidersHorizontal,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useNotifications, useNotificationsLues, type Notification } from '@/hooks/use-notifications'
import { ROLES_LABELS } from '@/lib/format'
import { useAuth } from '@/store/auth'

interface TopbarProps {
  onToggleMobileMenu: () => void
}

const ICONES_NOTIFICATIONS: Record<Notification['type'], LucideIcon> = {
  facture_retard: FileText,
  dossier_urgent: FolderOpen,
  evenement_jour: CalendarDays,
}

const COULEURS_CRITICITE: Record<Notification['criticite'], string> = {
  haute: 'text-destructive',
  moyenne: 'text-amber-500',
  info: 'text-primary',
}

export function Topbar({ onToggleMobileMenu }: TopbarProps) {
  const user = useAuth((s) => s.user)
  const logout = useAuth((s) => s.logout)
  const can = useAuth((s) => s.can)
  const hasRole = useAuth((s) => s.hasRole)
  const navigate = useNavigate()

  const { data: notificationsReponse } = useNotifications()
  const { lues, marquerLue, marquerToutLu } = useNotificationsLues()

  const notifications = notificationsReponse?.data ?? []
  const nonLues = notifications.filter((notification) => !lues.includes(notification.id))

  const initiales = (user?.name ?? '?')
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  async function handleLogout() {
    await logout()
    navigate('/login', { replace: true })
  }

  function ouvrirNotification(notification: Notification) {
    marquerLue(notification.id)
    navigate(notification.lien)
  }

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onToggleMobileMenu}
        aria-label="Ouvrir le menu"
      >
        <Menu />
      </Button>

      <Breadcrumbs className="hidden min-w-0 text-sm sm:flex" />

      <div className="flex-1" />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative"
              aria-label={`Notifications${nonLues.length > 0 ? ` (${nonLues.length} non lues)` : ''}`}
            >
              <Bell />
              {nonLues.length > 0 && (
                <span className="absolute end-0.5 top-0.5 flex min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white">
                  {nonLues.length > 9 ? '9+' : nonLues.length}
                </span>
              )}
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)]">
          <DropdownMenuLabel>
            <div className="flex items-center justify-between gap-2">
              <span>Notifications</span>
              {nonLues.length > 0 && (
                <Badge variant="secondary" className="bg-primary/10 text-primary">
                  {nonLues.length} non lues
                </Badge>
              )}
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Aucune notification
            </div>
          ) : (
            notifications.map((notification) => {
              const Icone = ICONES_NOTIFICATIONS[notification.type]
              const estLue = lues.includes(notification.id)
              return (
                <DropdownMenuItem
                  key={notification.id}
                  className="gap-3 py-2"
                  onClick={() => ouvrirNotification(notification)}
                >
                  <Icone
                    className={`size-4 shrink-0 ${COULEURS_CRITICITE[notification.criticite]}`}
                  />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="flex items-center gap-1.5">
                      {!estLue && (
                        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                      )}
                      <span className="truncate text-sm font-medium">
                        {notification.titre}
                      </span>
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {notification.message}
                    </span>
                  </span>
                </DropdownMenuItem>
              )
            })
          )}

          {nonLues.length > 0 && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-muted-foreground"
                onClick={() => marquerToutLu(notifications.map((item) => item.id))}
              >
                <CheckCheck />
                Tout marquer comme lu
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" className="h-9 gap-2 px-2">
              <Avatar className="size-8">
                <AvatarFallback className="bg-primary font-semibold text-primary-foreground">
                  {initiales}
                </AvatarFallback>
              </Avatar>
              <span className="hidden flex-col items-start gap-1 leading-none sm:flex">
                <span className="text-sm font-medium">{user?.name}</span>
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  {user ? ROLES_LABELS[user.role] : ''}
                </Badge>
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground" />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>
            <div className="flex items-center gap-3">
              <Avatar className="size-10 border border-border">
                <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                  {initiales}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-sm font-semibold">{user?.name}</span>
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
                <Badge
                  variant="secondary"
                  className="mt-0.5 w-fit bg-primary/10 text-primary"
                >
                  {user ? ROLES_LABELS[user.role] : ''}
                </Badge>
              </div>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/dashboard')}>
            <BarChart3 />
            Tableau de bord
          </DropdownMenuItem>
          {can('rapports.view') && (
            <DropdownMenuItem onClick={() => navigate('/rapports')}>
              <PieChart />
              Rapports
            </DropdownMenuItem>
          )}
          {(can('parametres.manage') || hasRole('admin')) && (
            <DropdownMenuItem onClick={() => navigate('/parametres')}>
              <SlidersHorizontal />
              Paramètres
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut />
            Se déconnecter
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
