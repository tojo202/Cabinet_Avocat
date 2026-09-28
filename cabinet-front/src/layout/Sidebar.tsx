import {
  BarChart3,
  BookOpen,
  CalendarDays,
  FileText,
  FolderOpen,
  Gavel,
  Scale,
  Settings,
  Users,
  Wallet,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { cn } from 'cn'
import { useAuth } from '@/store/auth'

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
  { label: 'Administration', to: '/administration', icon: Settings, adminOnly: true },
]

export function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
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
              className={({ isActive }) =>
                cn(
                  'flex h-9 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="flex-1">{item.label}</span>
            </NavLink>
          </li>
        )
      })}
    </ul>
  )
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 start-0 z-30 hidden w-60 flex-col border-e border-border bg-sidebar lg:flex">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Scale className="size-4" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">CabinetPro</span>
          <span className="text-xs text-muted-foreground">Gestion juridique</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto">
        <NavLinks />
      </nav>

      <div className="border-t border-border p-4 text-xs text-muted-foreground">
        CabinetPro © {new Date().getFullYear()}
      </div>
    </aside>
  )
}
