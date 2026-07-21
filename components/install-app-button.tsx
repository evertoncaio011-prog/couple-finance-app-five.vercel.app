'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

/**
 * Fixed "Baixar app" button for installing the PWA to the home screen.
 *
 * By calling `preventDefault()` on `beforeinstallprompt`, this suppresses
 * Chrome/Edge's automatic install mini-infobar/notification and replaces it
 * with our own persistent button instead — triggered on demand via
 * `deferredPrompt.prompt()`.
 *
 * iOS Safari has no programmatic install API at all, so there we just show
 * the same button with instructions for the manual "Share > Add to Home
 * Screen" flow instead of a native prompt.
 */
export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(true)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    setInstalled(isStandalone())
    setIos(isIos())

    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    function handleInstalled() {
      setInstalled(true)
      setDeferredPrompt(null)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [])

  if (installed) return null
  if (!deferredPrompt && !ios) return null

  async function handleClick() {
    if (ios) {
      toast.info(
        'Toque no ícone de compartilhar do navegador e depois em "Adicionar à Tela de Início".',
      )
      return
    }
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setInstalled(true)
    setDeferredPrompt(null)
  }

  return (
    <Button
      type="button"
      onClick={handleClick}
      className="fixed bottom-24 right-4 z-50 rounded-full shadow-lg shadow-primary/30 animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
    >
      <Download className="h-4 w-4" aria-hidden />
      Baixar app
    </Button>
  )
}
