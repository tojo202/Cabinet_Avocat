import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { X } from 'lucide-react'
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

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />

      <div className="lg:ps-60">
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
