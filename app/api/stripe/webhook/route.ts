import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// Necessário pra ler o corpo bruto da requisição (a verificação de
// assinatura do Stripe exige os bytes exatos, sem o Next.js reformatar
// como JSON no meio do caminho).
export const runtime = 'nodejs'

async function upsertFromSubscription(sub: Stripe.Subscription) {
  const accountId = sub.metadata?.account_id
  if (!accountId) {
    console.error('Webhook Stripe: subscription sem metadata.account_id', sub.id)
    return
  }

  const supabase = createAdminClient()
  const item = sub.items.data[0]
  await supabase.from('subscriptions').upsert(
    {
      account_id: accountId,
      stripe_customer_id: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
      stripe_subscription_id: sub.id,
      status: sub.status,
      current_period_end: item?.current_period_end
        ? new Date(item.current_period_end * 1000).toISOString()
        : null,
      cancel_at_period_end: sub.cancel_at_period_end,
    },
    { onConflict: 'account_id' },
  )
}

export async function POST(request: NextRequest) {
  const signature = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim()

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: 'Webhook não configurado.' }, { status: 400 })
  }

  const rawBody = await request.text()
  const stripe = getStripe()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    console.error('Assinatura de webhook Stripe inválida:', err)
    return NextResponse.json({ error: 'Assinatura inválida.' }, { status: 400 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode === 'subscription' && session.subscription) {
          const subId =
            typeof session.subscription === 'string'
              ? session.subscription
              : session.subscription.id
          const sub = await stripe.subscriptions.retrieve(subId)
          // Garante que o account_id chega no objeto da subscription,
          // mesmo que por algum motivo o subscription_data.metadata do
          // checkout não tenha propagado.
          if (!sub.metadata?.account_id && session.metadata?.account_id) {
            await stripe.subscriptions.update(subId, {
              metadata: { account_id: session.metadata.account_id },
            })
            sub.metadata.account_id = session.metadata.account_id
          }
          await upsertFromSubscription(sub)
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        await upsertFromSubscription(sub)
        break
      }

      default:
        // Outros eventos (faturas, etc.) não afetam o status que
        // guardamos — ignorados de propósito.
        break
    }
  } catch (err) {
    console.error('Erro processando webhook Stripe:', err)
    return NextResponse.json({ error: 'Erro interno.' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
