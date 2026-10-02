import { Fragment } from 'react'
import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from 'cn'

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Tableau de bord',
  clients: 'Clients',
  dossiers: 'Dossiers',
  calendrier: 'Calendrier',
  facturation: 'Facturation',
  paiements: 'Paiements',
  documents: 'Documents',
  avocats: 'Avocats',
  rapports: 'Rapports',
  parametres: 'Paramètres',
  administration: 'Administration',
}

interface FilAriane {
  to: string
  label: string
}

export function Breadcrumbs({ className }: { className?: string }) {
  const { pathname } = useLocation()
  const segments = pathname.split('/').filter(Boolean)

  if (segments.length === 0 || segments[0] === 'dashboard') {
    return null
  }

  const fil: FilAriane[] = [
    { to: '/dashboard', label: 'Accueil' },
    ...segments.map((segment, index) => ({
      to: `/${segments.slice(0, index + 1).join('/')}`,
      label: SEGMENT_LABELS[segment] ?? decodeURIComponent(segment),
    })),
  ]

  return (
    <nav
      aria-label="Fil d'Ariane"
      className={cn('flex min-w-0 items-center gap-1.5 text-sm', className)}
    >
      {fil.map((item, index) => {
        const estActif = index === fil.length - 1
        return (
          <Fragment key={item.to}>
            {index > 0 && (
              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground/70" />
            )}
            {estActif ? (
              <span
                aria-current="page"
                className="min-w-0 truncate font-medium text-foreground"
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="min-w-0 truncate text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}
