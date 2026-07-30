import { redirect } from 'next/navigation'
import { getSessionContext } from '@/lib/data'
import { BrandMark } from '@/components/brand-mark'
import { OnboardingForms } from '@/components/onboarding-forms'

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>
}) {
  const { user, account } = await getSessionContext()
  if (!user) redirect('/auth/login')

  // "?new=1" é usado pelo seletor de orçamentos (dentro do app) para
  // adicionar MAIS um orçamento sem perder o(s) que já existem. Sem esse
  // parâmetro, quem já tem um orçamento ativo é mandado pro dashboard —
  // esse é o fluxo normal de quem acabou de logar.
  const { new: isAdditional } = await searchParams
  if (account && isAdditional !== '1') redirect('/dashboard')

  return (
    <main className="flex min-h-svh w-full flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <div className="mb-8 flex flex-col items-center gap-4 text-center">
          <BrandMark />
          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold text-balance">
              {isAdditional === '1'
                ? 'Adicionar outro orçamento'
                : 'Configure seu orçamento compartilhado'}
            </h1>
            <p className="text-sm text-muted-foreground text-pretty">
              {isAdditional === '1'
                ? 'Crie um novo orçamento ou entre com um código de convite. Seus orçamentos atuais continuam intactos — você pode trocar entre eles quando quiser.'
                : 'Crie um novo orçamento para vocês dois, ou entre com o código de convite do seu parceiro(a).'}
            </p>
          </div>
        </div>
        <OnboardingForms />
        {isAdditional === '1' && (
          <a
            href="/dashboard"
            className="mt-4 block text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
          >
            Cancelar e voltar
          </a>
        )}
      </div>
    </main>
  )
}
