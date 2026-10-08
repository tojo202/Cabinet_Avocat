import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  FolderOpen,
  Gavel,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  PieChart,
  Scale,
  Settings,
  SlidersHorizontal,
  Users,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from 'cn'
import { useLogout } from '@/hooks/use-logout'
import { useAuth } from '@/store/auth'
import { useUi } from '@/store/ui'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  permission?: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tableau de bord', to: '/dashboard', icon: BarChart3, permission: 'dashboard.view' },
  { label: 'Clients', to: '/clients', icon: Users, permission: 'clients.view' },
  { label: 'Dossiers', to: '/dossiers', icon: FolderOpen, permission: 'dossiers.view' },
  { label: 'Calendrier', to: '/calendrier', icon: CalendarDays, permission: 'evenements.view' },
  { label: 'Facturation', to: '/facturation', icon: FileText, permission: 'factures.view' },
  { label: 'Paiements', to: '/paiements', icon: Wallet, permission: 'factures.view' },
  { label: 'Documents', to: '/documents', icon: BookOpen, permission: 'documents.view' },
  { label: 'Avocats', to: '/avocats', icon: Gavel, permission: 'avocats.view' },
  { label: 'Rapports', to: '/rapports', icon: PieChart, permission: 'rapports.view' },
  { label: 'Paramètres', to: '/parametres', icon: SlidersHorizontal, permission: 'parametres.manage' },
  { label: 'Administration', to: '/administration', icon: Settings, adminOnly: true },
]

interface NavLinksProps {
  onNavigate?: () => void
  collapsed?: boolean
}

export function NavLinks({ onNavigate, collapsed = false }: NavLinksProps) {
  const can = useAuth((s) => s.can)
  const hasRole = useAuth((s) => s.hasRole)

  const items = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return hasRole('admin')
    if (item.permission) return can(item.permission)
    return true
  })

  return (
    <ul className="space-y-1 p-2">
      {items.map((item) => {
        const Icon = item.icon
        return (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/administration'}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  collapsed && 'justify-center px-0',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-sm'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className={cn('flex-1 truncate', collapsed && 'sr-only')}>
                {item.label}
              </span>
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}

export function Sidebar() {
  const collapsed = useUi((s) => s.sidebarCollapsed)
  const toggleSidebar = useUi((s) => s.toggleSidebar)
  const handleLogout = useLogout()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 start-0 z-30 hidden flex-col border-e border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200 ease-out lg:flex',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      <div
        className={cn(
          'flex h-14 items-center gap-2 border-b border-sidebar-border px-4',
          collapsed && 'justify-center px-0',
        )}
      >
        {!collapsed && (
          <>
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Scale className="size-4" />
            </div>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-semibold">CabinetPro</span>
              <span className="text-xs text-sidebar-foreground/60">Gestion juridique</span>
            </div>
          </>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Déplier le menu' : 'Replier le menu'}
          title={collapsed ? 'Déplier le menu' : 'Replier le menu'}
          className="shrink-0 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <NavLinks collapsed={collapsed} />
      </nav>

      <div
        className={cn(
          'border-t border-sidebar-border p-4',
          collapsed && 'px-2 py-3',
        )}
      >

        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          aria-label="Se déconnecter"
          title="Se déconnecter"
          className={cn(
            'w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-destructive',
            collapsed && 'justify-center px-0',
          )}
        >
          <LogOut className="size-4 shrink-0" />
          {!collapsed && 'Se déconnecter'}
        </Button>
      </div>
    </aside>
  )
}
