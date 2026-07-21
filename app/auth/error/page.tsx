import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm animate-in fade-in-0 zoom-in-95 duration-500">
        <div className="mb-8 flex justify-center">
          <BrandMark />
        </div>
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <h1 className="font-heading text-xl font-bold text-balance">
            Algo deu errado
          </h1>
          <p className="text-sm text-muted-foreground text-pretty">
            {params?.error
              ? `Erro: ${params.error}`
              : 'Ocorreu um erro inesperado de autenticação. Tente novamente.'}
          </p>
          <Button render={<Link href="/auth/login" />} className="w-full">
            Voltar para login
          </Button>
        </div>
      </div>
    </main>
  )
}
