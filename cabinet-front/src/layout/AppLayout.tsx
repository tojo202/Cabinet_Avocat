import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { X } from 'lucide-react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { cn } from 'cn'
import { Sidebar, NavLinks } from './Sidebar'
import { Topbar } from './Topbar'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { InstallBanner, UpdatePrompt } from '@/components/pwa'
import { useUi } from '@/store/ui'

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const sidebarCollapsed = useUi((s) => s.sidebarCollapsed)

  // Gestion de la mise à jour du Service Worker
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r?: ServiceWorkerRegistration) {
      console.log('[PWA] Service Worker enregistré :', r)
    },
    onRegisterError(error: unknown) {
      console.warn('[PWA] Erreur d\'enregistrement SW :', error)
    },
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Bannière d'installation PWA (mobile) */}
      <InstallBanner />

      {/* Dialog de mise à jour SW */}
      <UpdatePrompt
        open={needRefresh}
        onUpdate={() => updateServiceWorker(true)}
        onDismiss={() => setNeedRefresh(false)}
      />

      <Sidebar />

      <div
        className={cn(
          'transition-[padding] duration-200 ease-out',
          sidebarCollapsed ? 'lg:ps-16' : 'lg:ps-60',
        )}
      >
        <Topbar onToggleMobileMenu={() => setMobileOpen(true)} />

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="w-60 gap-0 border-e border-sidebar-border bg-sidebar p-0 text-sidebar-foreground"
          >
            <SheetHeader className="border-b border-sidebar-border">
              <SheetTitle className="text-sidebar-foreground">Navigation</SheetTitle>
              <SheetClose
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="absolute end-3 top-3 text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  />
                }
              >
                <X />
                <span className="sr-only">Fermer le menu</span>
              </SheetClose>
            </SheetHeader>
            <nav>
              <NavLinks onNavigate={() => setMobileOpen(false)} />
            </nav>
          </SheetContent>
        </Sheet>

        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
