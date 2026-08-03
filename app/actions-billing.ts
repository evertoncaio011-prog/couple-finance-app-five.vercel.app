'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getStripe } from '@/lib/stripe'
import { getSessionContext } from '@/lib/data'
import { createClient } from '@/lib/supabase/server'

type ActionResult = { error?: string; success?: boolean }

/** URL base do app, pros redirects de sucesso/cancelamento do Stripe. Usa
 * NEXT_PUBLIC_APP_URL se configurada (recomendado em produção); senão
 * deduz do próprio request (funciona bem em dev/preview). */
async function getAppUrl(): Promise<string> {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

// Cria (ou reaproveita) o Checkout do Stripe pro orçamento atual e manda o
// usuário pra lá. Cada orçamento (casal) vira 1 customer no Stripe.
export async function createCheckoutSession(): Promise<ActionResult> {
  const { account, user } = await getSessionContext()
  if (!account || !user) return { error: 'Nenhum orçamento compartilhado encontrado.' }

  const stripe = getStripe()
  const priceId = process.env.STRIPE_PRICE_ID?.trim()
  if (!priceId) {
    return { error: 'STRIPE_PRICE_ID não configurado no servidor.' }
  }

  const supabase = await createClient()
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('account_id', account.id)
    .maybeSingle<{ stripe_customer_id: string | null }>()

  let customerId = existing?.stripe_customer_id ?? undefined

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { account_id: account.id },
    })
    customerId = customer.id
  }

  const appUrl = await getAppUrl()

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?checkout=success`,
    cancel_url: `${appUrl}/settings?checkout=cancelled`,
    subscription_data: { metadata: { account_id: account.id } },
    metadata: { account_id: account.id },
  })

  if (!session.url) return { error: 'Não foi possível iniciar o checkout.' }
  redirect(session.url)
}

// Abre o portal de cobrança hospedado pelo Stripe, onde a pessoa consegue
// trocar cartão, ver faturas antigas e cancelar a assinatura sozinha.
export async function createBillingPortalSession(): Promise<ActionResult> {
  const { account } = await getSessionContext()
  if (!account) return { error: 'Nenhum orçamento compartilhado encontrado.' }

  const supabase = await createClient()
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('stripe_customer_id')
    .eq('account_id', account.id)
    .maybeSingle<{ stripe_customer_id: string | null }>()

  if (!sub?.stripe_customer_id) {
    return { error: 'Vocês ainda não têm uma assinatura para gerenciar.' }
  }

  const stripe = getStripe()
  const appUrl = await getAppUrl()

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripe_customer_id,
    return_url: `${appUrl}/settings`,
  })

  redirect(session.url)
}
