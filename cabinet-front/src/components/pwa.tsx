import { Download, Share, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { useInstallPrompt } from '@/hooks/use-install-prompt'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

/**
 * Bannière d'invitation à installer l'app sur mobile (Android / iOS).
 * Visible sur les appareils tactile uniquement, une seule fois par session.
 */
export function InstallBanner() {
  const { isInstallable, isInstalled, isIOS, promptInstall } = useInstallPrompt()
  const [isMobile] = useState(() => window.matchMedia('(pointer: coarse)').matches)
  const [iosOpen, setIosOpen] = useState(false)
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('pwa-banner-dismissed') === 'true',
  )

  if (isInstalled || !isInstallable || dismissed || !isMobile) return null

  const handleDismiss = () => {
    sessionStorage.setItem('pwa-banner-dismissed', 'true')
    setDismissed(true)
  }

  const handleInstall = async () => {
    if (isIOS) {
      setIosOpen(true)
      return
    }
    await promptInstall()
    handleDismiss()
  }

  return (
    <>
      <div className="flex items-center gap-3 px-4 py-2.5 bg-[#6E1A35] text-white text-sm">
        <Smartphone className="size-5 shrink-0" />
        <p className="flex-1 leading-tight">
          <span className="font-semibold">CabinetPro</span> est disponible comme application
          mobile.
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            className="px-3 py-1 bg-white text-[#6E1A35] rounded-full text-xs font-semibold hover:bg-white/90 transition-colors"
          >
            Installer
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/70 hover:text-white text-lg leading-none"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>
      </div>
      <IosInstallDialog open={iosOpen} onOpenChange={setIosOpen} />
    </>
  )
}

/**
 * Dialog de mise à jour du Service Worker.
 * S'affiche quand une nouvelle version de l'app est disponible.
 */
export function UpdatePrompt({
  open,
  onUpdate,
  onDismiss,
}: {
  open: boolean
  onUpdate: () => void
  onDismiss: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onDismiss()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Download className="size-5 text-[#6E1A35]" />
            <DialogTitle>Mise à jour disponible</DialogTitle>
          </div>
          <DialogDescription>
            Une nouvelle version de CabinetPro est disponible. Rechargez l'application pour
            bénéficier des dernières améliorations.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onDismiss}>
            Plus tard
          </Button>
          <Button size="sm" onClick={onUpdate}>
            Recharger maintenant
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Instructions d'installation manuelle pour iOS / iPadOS (Safari).
 */
export function IosInstallDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Share className="size-5 text-[#6E1A35]" />
            <DialogTitle>Installer CabinetPro</DialogTitle>
          </div>
          <DialogDescription>
            Sur iPhone / iPad, l'installation se fait depuis Safari :
          </DialogDescription>
        </DialogHeader>
        <ol className="space-y-2 text-sm text-muted-foreground list-decimal ps-5">
          <li>
            Touchez l'icône <Share className="size-4 inline -mt-0.5" /> Partager dans la barre
            de Safari.
          </li>
          <li>Sélectionnez « Sur l'écran d'accueil ».</li>
          <li>
            Touchez « Ajouter » en haut à droite. <span className="font-medium text-foreground">CabinetPro</span> apparaît
            ensuite sur votre écran d'accueil.
          </li>
        </ol>
        <div className="flex justify-end pt-2">
          <Button size="sm" onClick={() => onOpenChange(false)}>
            compris
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
