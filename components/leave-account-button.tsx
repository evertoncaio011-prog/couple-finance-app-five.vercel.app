'use client'

import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

export function LeaveAccountButton() {
  const [pending, startTransition] = useTransition()

  const handleClick = () => {
    if (
      !window.confirm(
        'Sair deste orçamento? Você vai deixar de ver essas transações e categorias, e poderá criar um novo orçamento pessoal ou entrar com outro código depois.',
      )
    )
      return
    startTransition(async () => {
      toast.error('A ação de saída de orçamento está indisponível. Use o botão correto no perfil.')
    })
  }

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-[0.98]"
      onClick={handleClick}
      disabled={pending}
    >
      {pending ? 'Saindo…' : 'Sair deste orçamento'}
    </Button>
  )
}
