'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  ReceiptText,
  CreditCard,
  Tags,
  User,
  Settings2,
  LogOut,
  Menu,
} from 'lucide-react'
import { signOut } from '@/app/actions'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

const items = [
  { href: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/transactions', label: 'Atividade', icon: ReceiptText },
  { href: '/cards', label: 'Cartões', icon: CreditCard },
  { href: '/categories', label: 'Categorias', icon: Tags },
  { href: '/profile', label: 'Perfil', icon: User },
  { href: '/settings', label: 'Configurações', icon: Settings2 },
]

// Botão fixo de menu (canto superior esquerdo) que abre um drawer lateral
// com todos os atalhos de navegação. Aparece em todas as telas no
// celular; em telas grandes fica escondido porque a sidebar de desktop
// (components/desktop-sidebar.tsx) já cobre a navegação.
export function NavDrawer() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir navegação"
        className="fixed left-5 top-6 z-40 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm transition-transform active:scale-90 lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="left"
          className="flex w-4/5 max-w-xs flex-col gap-0 rounded-r-3xl p-0"
        >
          <SheetHeader className="px-5 pb-2 pt-6 text-left">
            <SheetTitle className="font-heading text-xl font-bold">
              Navegação
            </SheetTitle>
            <SheetDescription>Acesse tudo rapidamente</SheetDescription>
          </SheetHeader>

          <nav className="flex flex-1 flex-col gap-1 px-3 pt-2">
            {items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href
              return (
                <Link
                  key={label}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-colors',
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

          <div className="mt-auto border-t border-border p-3">
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <LogOut className="h-5 w-5" aria-hidden />
                Sair
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
