import 'server-only'
import Stripe from 'stripe'

let _stripe: Stripe | null = null

/**
 * Cliente Stripe, server-only. Lança um erro claro se a chave não estiver
 * configurada em vez de falhar silenciosamente numa chamada de API.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!secretKey) {
    throw new Error(
      'STRIPE_SECRET_KEY não configurada. Pegue em dashboard.stripe.com > Developers > API keys e adicione ao seu .env.local.',
    )
  }

  _stripe = new Stripe(secretKey)
  return _stripe
}
