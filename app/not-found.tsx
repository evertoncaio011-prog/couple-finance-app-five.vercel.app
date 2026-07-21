import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { BrandMark } from '@/components/brand-mark'

export default function NotFound() {
  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center gap-6 bg-background p-6 text-center">
      <BrandMark />
      <div className="space-y-1.5">
        <h1 className="font-heading text-xl font-bold text-balance">
          Página não encontrada
        </h1>
        <p className="max-w-xs text-sm text-muted-foreground text-pretty">
          A página que você está procurando não existe ou foi movida.
        </p>
      </div>
      <Button render={<Link href="/" />}>Voltar ao início</Button>
    </main>
  )
}
