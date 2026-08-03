import { Crown } from 'lucide-react'
import { SubscribeButton, ManageBillingButton } from '@/components/billing-actions'
import type { Subscription } from '@/lib/types'

const statusLabel: Record<string, string> = {
  trialing: 'Em teste',
  active: 'Ativa',
  past_due: 'Pagamento atrasado',
  canceled: 'Cancelada',
  incomplete: 'Pagamento pendente',
  incomplete_expired: 'Expirada',
  unpaid: 'Pagamento pendente',
}

function formatPeriodEnd(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

export function BillingSection({ subscription }: { subscription: Subscription | null }) {
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'
  const hasStripeCustomer = Boolean(subscription?.stripe_customer_id)
  const periodEnd = formatPeriodEnd(subscription?.current_period_end ?? null)

  return (
    <section className="px-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 fill-mode-both">
      <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Assinatura</p>
      <div className="rounded-3xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <span
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              isActive ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
            }`}
          >
            <Crown className="h-5 w-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-medium">
              {isActive ? 'Twogether Premium' : 'Plano gratuito'}
            </p>
            <p className="text-xs text-muted-foreground">
              {subscription?.status
                ? (statusLabel[subscription.status] ?? subscription.status)
                : 'Vocês ainda não assinaram'}
              {isActive && periodEnd && !subscription?.cancel_at_period_end &&
                ` · renova em ${periodEnd}`}
              {subscription?.cancel_at_period_end && periodEnd &&
                ` · termina em ${periodEnd}`}
            </p>
          </div>
        </div>

        <div className="mt-4">
          {isActive || hasStripeCustomer ? <ManageBillingButton /> : <SubscribeButton />}
        </div>
      </div>
    </section>
  )
}
