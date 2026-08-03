import { Bell, LogOut, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { requireAccount, getMembers, getMyAccounts, getSubscription } from '@/lib/data'
import { isAdminEmail } from '@/lib/admin'
import { PageHeader } from '@/components/page-header'
import { PasswordSheetRow } from '@/components/password-sheet'
import { AccountSwitcher } from '@/components/account-switcher'
import { PushButton } from '@/components/push-button'
import { ThemeToggle } from '@/components/theme-toggle'
import { BillingSection } from '@/components/billing-section'
import { LeaveAccountPermanentlyButton } from '@/components/leave-account-permanently-button'
import { signOut } from '@/app/actions'

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>
}) {
  const { account, user } = await requireAccount()
  const { checkout } = await searchParams
  const [members, myAccounts, subscription] = await Promise.all([
    getMembers(account.id),
    getMyAccounts(),
    getSubscription(account.id),
  ])
  const hasPartner = members.some((m) => m.id !== user.id)
  const isAdmin = isAdminEmail(user.email)

  return (
    <div className="flex flex-col gap-5 pb-10">
      <PageHeader title="Configurações" />

      <div className="mx-auto flex w-full flex-col gap-5 lg:max-w-xl">
        {checkout === 'success' && (
          <section className="px-5">
            <div className="rounded-2xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
              Assinatura confirmada! Obrigado por apoiar o Twogether. 🎉
            </div>
          </section>
        )}
        {checkout === 'cancelled' && (
          <section className="px-5">
            <div className="rounded-2xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              Checkout cancelado — nenhuma cobrança foi feita.
            </div>
          </section>
        )}

        <BillingSection subscription={subscription} />

        <section className="px-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 fill-mode-both">
          <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Aparência</p>
          <div className="rounded-3xl border border-border bg-card p-4">
            <ThemeToggle />
          </div>
        </section>

        <section className="px-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 fill-mode-both">
          <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Conta</p>
          <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
            <PasswordSheetRow />

            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="text-sm font-medium">Orçamento</span>
              <AccountSwitcher accounts={myAccounts} />
            </div>

            <div className="flex items-center justify-between gap-3 px-4 py-3.5">
              <span className="flex items-center gap-3">
                <Bell className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                <span className="text-sm font-medium">Notificações push</span>
              </span>
              <PushButton />
            </div>
          </div>
        </section>

        {isAdmin && (
          <section className="px-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 fill-mode-both">
            <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Administração</p>
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
              <Link
                href="/admin"
                className="flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors hover:bg-muted"
              >
                <ShieldCheck className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                Painel administrativo
              </Link>
            </div>
          </section>
        )}

        <section className="px-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 delay-75 fill-mode-both">
          <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Sessão</p>
          <div className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
            <form action={signOut} className="contents">
              <button
                type="submit"
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm font-medium transition-colors hover:bg-muted"
              >
                <LogOut className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
                Sair da conta
              </button>
            </form>
          </div>
        </section>

        <section className="px-5 animate-in fade-in-0 slide-in-from-bottom-2 duration-400 delay-100 fill-mode-both">
          <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">Zona de risco</p>
          <div className="rounded-3xl border border-border bg-card px-4 py-3.5 text-center">
            <LeaveAccountPermanentlyButton
              accountId={account.id}
              accountName={account.name}
              hasPartner={hasPartner}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
