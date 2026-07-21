import Link from 'next/link'
import { Plus } from 'lucide-react'

// Substitui o botão "Adicionar" que antes ficava no meio da barra
// inferior: agora é um botão flutuante fixo no canto inferior direito,
// visível em qualquer tela do app.
export function FloatingAddButton() {
  return (
    <Link
      href="/transactions/new"
      aria-label="Adicionar transação"
      className="fixed bottom-6 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 hover:shadow-primary/40 active:scale-90"
    >
      <Plus className="h-6 w-6" aria-hidden />
    </Link>
  )
}
