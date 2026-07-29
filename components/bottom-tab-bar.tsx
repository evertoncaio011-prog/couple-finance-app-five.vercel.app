'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ReceiptText, CreditCard, Target } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/transactions', label: 'Atividade', icon: ReceiptText },
  { href: '/cards', label: 'Cartões', icon: CreditCard },
  { href: '/goals', label: 'Metas', icon: Target },
]

/**
 * Navegação principal no mobile. Fica fixa embaixo, só com os atalhos mais
 * usados — o menu hambúrguer (NavDrawer) continua disponível pra tudo o
 * resto (Categorias, Perfil, Configurações, Sair). Some em telas grandes,
 * onde a DesktopSidebar já cobre a navegação.
 */
export function BottomTabBar() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-16 w-full max-w-lg items-stretch border-t border-border bg-card/95 backdrop-blur-md lg:hidden"
      aria-label="Navegação principal"
    >
      {tabs.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`)
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
              active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}
