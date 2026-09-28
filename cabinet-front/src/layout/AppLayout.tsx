import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar, NavLinks } from './Sidebar'
import { Topbar } from './Topbar'
import {
  Sheet,
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
          <SheetContent side="left" className="w-60 p-0">
            <SheetHeader className="border-b border-border">
              <SheetTitle>Navigation</SheetTitle>
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
