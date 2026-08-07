import Link from 'next/link'
import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Redireciona pra /dashboard se a pessoa não estiver logada ou não
  // estiver na lista de ADMIN_EMAILS — ver lib/admin.ts.
  await requireAdmin()

  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/80 px-5 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
          <span className="font-heading font-bold">Twogether Admin</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Voltar ao app
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6">{children}</main>
    </div>
  )
}
