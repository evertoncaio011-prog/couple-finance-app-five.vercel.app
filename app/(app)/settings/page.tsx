import { Bell, LogOut } from 'lucide-react'
import { requireAccount, getMembers, getMyAccounts } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { PasswordSheetRow } from '@/components/password-sheet'
import { AccountSwitcher } from '@/components/account-switcher'
import { PushButton } from '@/components/push-button'
import { LeaveAccountPermanentlyButton } from '@/components/leave-account-permanently-button'
import { signOut } from '@/app/actions'

export default async function SettingsPage() {
  const { account, user } = await requireAccount()
  const [members, myAccounts] = await Promise.all([
    getMembers(account.id),
    getMyAccounts(),
  ])
  const hasPartner = members.some((m) => m.id !== user.id)

  return (
    <div className="flex flex-col gap-5 pb-10">
      <PageHeader title="Configurações" />

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
  )
}
