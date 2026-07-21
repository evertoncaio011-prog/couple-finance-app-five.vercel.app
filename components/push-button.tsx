'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { savePushSubscription } from '@/app/actions'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Se já existir uma inscrição com uma chave VAPID diferente da atual, o
// navegador recusa criar uma nova (InvalidStateError) até a antiga ser
// cancelada. Isso garante que sempre trocamos limpo.
async function ensureFreshSubscription(registration: ServiceWorkerRegistration) {
  if (!VAPID_PUBLIC_KEY) {
    throw new Error('A chave pública VAPID não está configurada.')
  }

  const existing = await registration.pushManager.getSubscription()
  if (existing) {
    return existing
  }

  return registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
  })
}

export function PushButton() {
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const initPush = async () => {
      if (!VAPID_PUBLIC_KEY) {
        console.info('VAPID public key is not configured; push notifications are disabled.')
        return
      }

      if ('serviceWorker' in navigator) {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
          const subscription = await registration.pushManager.getSubscription()
          if (subscription) {
            setIsSubscribed(true)
          }
        } catch (err) {
          console.error('Erro ao inicializar service worker:', err)
        }
      }
    }

    initPush()
  }, [])

  const subscribe = async () => {
    if (!VAPID_PUBLIC_KEY) {
      alert('Notificações não podem ser ativadas: chave VAPID ausente.')
      return
    }

    if (!('serviceWorker' in navigator)) {
      alert('Seu navegador não suporta service workers. Notificações não estão disponíveis.')
      return
    }

    try {
      setIsLoading(true)

      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        alert('Permissão de notificações negada. Ative-a nas configurações do navegador.')
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      const subscription = await ensureFreshSubscription(registration)
      await savePushSubscription(subscription.toJSON())
      setIsSubscribed(true)
    } catch (error) {
      console.error('Erro ao ativar push:', error)
      alert('Não foi possível ativar. Verifique se você deu permissão no navegador e se o app está rodando em HTTPS ou localhost.')
    } finally {
      setIsLoading(false)
    }
  }

  // Quando já está inscrito, mostra um status em vez de simplesmente
  // sumir — fica mais claro dentro de uma linha de lista de configurações.
  if (isSubscribed) {
    return <span className="text-sm font-medium text-muted-foreground">Ativado</span>
  }

  return (
    <Button onClick={subscribe} disabled={isLoading} variant="default" size="sm">
      {isLoading ? 'Ativando...' : 'Ativar'}
    </Button>
  )
}