'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ReceiptText,
  CreditCard,
  Tags,
  User,
  Settings2,
  LogOut,
} from 'lucide-react'
import { signOut } from '@/app/actions'
import { cn } from '@/lib/utils'
import { BrandMark } from '@/components/brand-mark'

const items = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/transactions', label: 'Atividade', icon: ReceiptText },
  { href: '/cards', label: 'Cartões', icon: CreditCard },
  { href: '/categories', label: 'Categorias', icon: Tags },
  { href: '/profile', label: 'Perfil', icon: User },
  { href: '/settings', label: 'Configurações', icon: Settings2 },
]

// Navegação lateral fixa para telas grandes (desktop). No celular, a
// navegação continua sendo o menu hambúrguer (NavDrawer) e o botão de
// voltar do PageHeader — este componente fica escondido abaixo do
// breakpoint `lg` e não muda nada do comportamento mobile.
export function DesktopSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-card lg:flex">
      <div className="px-5 pb-2 pt-7">
        <BrandMark />
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 pt-4">
        {items.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-3">
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" aria-hidden />
            Sair
          </button>
        </form>
      </div>
    </aside>
  )
}
