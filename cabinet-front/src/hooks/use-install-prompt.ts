import { useEffect, useRef, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
  prompt(): Promise<void>
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

// iOS/iPadOS Safari ne déclenche jamais `beforeinstallprompt` :
// l'installation se fait manuellement via Partager > Sur l'écran d'accueil.
function isIOSDevice() {
  const ua = navigator.userAgent
  return (
    /iP(hone|ad|od)/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

export function useInstallPrompt() {
  const [promptAvailable, setPromptAvailable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(isStandalone)
  const [isIOS] = useState(isIOSDevice)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setPromptAvailable(true)
    }

    const appInstalledHandler = () => {
      setIsInstalled(true)
      setPromptAvailable(false)
      deferredPrompt.current = null
    }

    window.addEventListener('beforeinstallprompt', handler)
    window.addEventListener('appinstalled', appInstalledHandler)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      window.removeEventListener('appinstalled', appInstalledHandler)
    }
  }, [])

  const isInstallable = !isInstalled && (promptAvailable || isIOS)

  const promptInstall = async () => {
    if (!deferredPrompt.current) return false

    await deferredPrompt.current.prompt()
    const { outcome } = await deferredPrompt.current.userChoice

    if (outcome === 'accepted') {
      setIsInstalled(true)
      setPromptAvailable(false)
    }

    deferredPrompt.current = null
    return outcome === 'accepted'
  }

  return { isInstallable, isInstalled, isIOS, promptInstall }
}
