import { Users, Building2, CreditCard } from 'lucide-react'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminAccount = {
  id: string
  name: string
  created_at: string
}

type AdminProfile = {
  id: string
  email: string | null
  display_name: string | null
}

type AdminMember = {
  account_id: string
  user_id: string
}

type AdminSubscription = {
  account_id: string
  status: string | null
  plan: string
  current_period_end: string | null
  cancel_at_period_end: boolean
}

const statusLabel: Record<string, string> = {
  trialing: 'Em teste',
  active: 'Ativa',
  past_due: 'Pagamento atrasado',
  canceled: 'Cancelada',
  incomplete: 'Pendente',
  incomplete_expired: 'Expirada',
  unpaid: 'Pendente',
}

const statusColor: Record<string, string> = {
  trialing: 'bg-sky-500/10 text-sky-600',
  active: 'bg-primary/10 text-primary',
  past_due: 'bg-amber-500/10 text-amber-600',
  canceled: 'bg-muted text-muted-foreground',
  incomplete: 'bg-amber-500/10 text-amber-600',
  incomplete_expired: 'bg-muted text-muted-foreground',
  unpaid: 'bg-rose-500/10 text-rose-600',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default async function AdminPage() {
  // Service_role: ignora RLS de propósito, porque este painel precisa
  // enxergar TODOS os orçamentos, não só o do usuário logado. O acesso a
  // esta página já foi checado em app/admin/layout.tsx (requireAdmin()).
  const supabase = createAdminClient()

  const [accountsRes, profilesRes, membersRes, subsRes] = await Promise.all([
    supabase
      .from('shared_accounts')
      .select('id, name, created_at')
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('id, email, display_name'),
    supabase.from('account_members').select('account_id, user_id'),
    supabase
      .from('subscriptions')
      .select('account_id, status, plan, current_period_end, cancel_at_period_end'),
  ])

  const accounts = (accountsRes.data as AdminAccount[]) ?? []
  const profiles = (profilesRes.data as AdminProfile[]) ?? []
  const members = (membersRes.data as AdminMember[]) ?? []
  const subscriptions = (subsRes.data as AdminSubscription[]) ?? []

  const profileById = new Map(profiles.map((p) => [p.id, p]))
  const subByAccount = new Map(subscriptions.map((s) => [s.account_id, s]))
  const membersByAccount = new Map<string, AdminProfile[]>()
  for (const m of members) {
    const list = membersByAccount.get(m.account_id) ?? []
    const profile = profileById.get(m.user_id)
    if (profile) list.push(profile)
    membersByAccount.set(m.account_id, list)
  }

  const totalUsers = profiles.length
  const activeSubs = subscriptions.filter(
    (s) => s.status === 'active' || s.status === 'trialing',
  ).length

  const stats = [
    { label: 'Orçamentos (casais)', value: accounts.length, icon: Building2 },
    { label: 'Usuários cadastrados', value: totalUsers, icon: Users },
    { label: 'Assinaturas ativas', value: activeSubs, icon: CreditCard },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Visão geral</h1>
        <p className="text-sm text-muted-foreground">
          Todos os orçamentos cadastrados no Twogether.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon className="h-4 w-4" aria-hidden />
              <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="font-heading text-sm font-semibold">Orçamentos</h2>
        </div>

        {accounts.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhum orçamento cadastrado ainda.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {accounts.map((account) => {
              const sub = subByAccount.get(account.id)
              const accountMembers = membersByAccount.get(account.id) ?? []
              const status = sub?.status
              return (
                <li key={account.id} className="flex flex-col gap-2 px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{account.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Criado em {formatDate(account.created_at)}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        status ? statusColor[status] ?? 'bg-muted text-muted-foreground' : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {status ? (statusLabel[status] ?? status) : 'Gratuito'}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    {accountMembers.length === 0
                      ? 'Sem membros'
                      : accountMembers
                          .map((m) => m.display_name || m.email || 'Sem nome')
                          .join(' · ')}
                  </p>

                  {sub?.current_period_end && (
                    <p className="text-xs text-muted-foreground">
                      {sub.cancel_at_period_end ? 'Termina' : 'Renova'} em{' '}
                      {formatDate(sub.current_period_end)}
                    </p>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
