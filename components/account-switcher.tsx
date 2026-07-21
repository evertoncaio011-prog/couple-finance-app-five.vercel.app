'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, ChevronsUpDown, Plus, Wallet } from 'lucide-react'
import { switchActiveAccount } from '@/app/actions'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { MyAccount } from '@/lib/types'

/**
 * Deixa claro, num único lugar, a diferença entre:
 * - Trocar de orçamento (aqui): só muda qual orçamento você está vendo.
 *   Reversível a qualquer momento, não tira você de nenhum orçamento.
 * - Sair definitivamente: fica dentro do orçamento em Perfil, é discreto
 *   e de propósito, porque é uma ação destrutiva (perde acesso a ele).
 * - Sair da conta (logout): fica separado, também em Perfil.
 */
export function AccountSwitcher({ accounts }: { accounts: MyAccount[] }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const active = accounts.find((a) => a.is_active) ?? accounts[0]

  if (!active) return null

  const handleSwitch = (accountId: string) => {
    if (accountId === active.id) {
      setOpen(false)
      return
    }
    startTransition(async () => {
      const res = await switchActiveAccount(accountId)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      setOpen(false)
    })
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="max-w-[60vw] justify-between gap-1.5"
        onClick={() => setOpen(true)}
      >
        <Wallet className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="truncate">{active.name}</span>
        {accounts.length > 1 && (
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle>Seus orçamentos</SheetTitle>
            <SheetDescription>
              Trocar de orçamento não tira você de nenhum deles — é só qual
              você está vendo agora. Você pode voltar quando quiser.
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-2 px-4 pb-4">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                disabled={pending}
                onClick={() => handleSwitch(acc.id)}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted disabled:opacity-50"
              >
                <span className="flex flex-col">
                  <span className="font-medium">{acc.name}</span>
                  {acc.is_active && (
                    <span className="text-xs text-muted-foreground">Orçamento atual</span>
                  )}
                </span>
                {acc.is_active && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
              </button>
            ))}

            <a
              href="/onboarding?new=1"
              className="mt-1 flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Adicionar outro orçamento
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
