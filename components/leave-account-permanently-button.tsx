'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { leaveAccountPermanently } from '@/app/actions'

/**
 * Ação destrutiva: remove o usuário deste orçamento de vez (ele perde o
 * acesso, mas os dados continuam existindo para quem ficar). Por ser
 * irreversível, fica visualmente discreta — texto pequeno, não um botão
 * grande — para não ser confundida com "trocar de orçamento" (reversível)
 * nem com "sair da conta" (logout).
 */
export function LeaveAccountPermanentlyButton({
  accountId,
  accountName,
  hasPartner,
}: {
  accountId: string
  accountName: string
  hasPartner: boolean
}) {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    const warning = hasPartner
      ? `Sair definitivamente de "${accountName}"? Você vai perder o acesso a este orçamento para sempre — as transações continuam existindo para a outra pessoa, mas você não vai mais vê-las. Essa ação não pode ser desfeita.`
      : `Sair definitivamente de "${accountName}"? Você vai perder o acesso a este orçamento e ao histórico dele para sempre. Essa ação não pode ser desfeita.`

    if (!window.confirm(warning)) return

    // Segunda confirmação de propósito — essa ação é irreversível e não
    // deve acontecer por engano (ex: toque errado no celular).
    if (!window.confirm('Tem certeza mesmo? Não é possível desfazer isso depois.')) return

    startTransition(async () => {
      const res = await leaveAccountPermanently(accountId)
      if (res?.error) toast.error(res.error)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-destructive hover:underline disabled:opacity-50"
    >
      {pending ? 'Saindo…' : `Sair definitivamente de "${accountName}"`}
    </button>
  )
}
