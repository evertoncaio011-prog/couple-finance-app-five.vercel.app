import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY?.trim()
const VAPID_SUBJECT = process.env.VAPID_SUBJECT?.trim() ?? 'mailto:contato@example.com'

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)
}

type PushPayload = {
  title: string
  body: string
}

/**
 * Envia um push de verdade (via protocolo Web Push) pros outros membros
 * do orçamento — quem disparou a ação (excludeUserId) não recebe a
 * própria notificação. Inscrições mortas (404/410, ex: usuário
 * desinstalou o app ou trocou de navegador) são limpas automaticamente.
 */
export async function sendPushToAccount({
  accountId,
  excludeUserId,
  payload,
}: {
  accountId: string
  excludeUserId?: string | null
  payload: PushPayload
}) {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys não configuradas — push desativado.')
    return
  }

  const supabase = await createClient()

  const { data: members, error: membersError } = await supabase
    .from('account_members')
    .select('user_id')
    .eq('account_id', accountId)

  if (membersError || !members) {
    console.error('Falha ao buscar membros do orçamento:', membersError?.message)
    return
  }

  const targetUserIds = members
    .map((m) => m.user_id as string)
    .filter((id) => id !== excludeUserId)

  if (targetUserIds.length === 0) return

  const { data: subs, error: subsError } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', targetUserIds)

  if (subsError || !subs || subs.length === 0) return

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        )
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode
        if (statusCode === 404 || statusCode === 410) {
          // Inscrição não existe mais no navegador do usuário — remove
          // pra não continuar tentando enviar pra ela pra sempre.
          await supabase.from('push_subscriptions').delete().eq('id', sub.id)
        } else {
          console.error('Falha ao enviar push:', (err as Error)?.message ?? err)
        }
      }
    }),
  )
}