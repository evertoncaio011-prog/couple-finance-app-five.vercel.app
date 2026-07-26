import Link from 'next/link'
import { CreditCard, Target } from 'lucide-react'

const items = [
  {
    href: '/cards',
    label: 'Cartões',
    subtitle: 'Faturas e limites',
    icon: CreditCard,
    iconBg: 'bg-sky-500/15 text-sky-600',
  },
  {
    href: '/goals',
    label: 'Metas',
    subtitle: 'Economias do casal',
    icon: Target,
    iconBg: 'bg-emerald-500/15 text-emerald-600',
  },
]

export function DashboardShortcuts() {
  return (
    <section className="px-5">
      <h2 className="font-heading text-base font-semibold">Painel financeiro</h2>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {items.map(({ href, label, subtitle, icon: Icon, iconBg }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted"
          >
            <span
              aria-hidden
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span>
              <p className="font-medium leading-tight">{label}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </span>
          </Link>
        ))}
      </div>
    </section>
  )
}
