import { requireAccount } from '@/lib/data'
import { NavDrawer } from '@/components/nav-drawer'
import { DesktopSidebar } from '@/components/desktop-sidebar'
import { BottomTabBar } from '@/components/bottom-tab-bar'
import { FloatingAddButton } from '@/components/floating-add-button'
import { PageTransition } from '@/components/page-transition'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Guards: redirects to /auth/login or /onboarding as needed.
  await requireAccount()

  return (
    <div className="lg:flex lg:min-h-svh">
      {/* Só aparece em telas grandes (lg+); no celular a navegação
          principal agora é a barra inferior fixa (BottomTabBar), com o
          menu hambúrguer cobrindo o resto (Categorias, Perfil, etc). */}
      <DesktopSidebar />

      <div className="min-h-svh w-full lg:flex-1 lg:pl-64">
        <div className="relative mx-auto min-h-svh w-full max-w-lg bg-background pb-24 lg:max-w-2xl lg:pb-10">
          <NavDrawer />
          <PageTransition>{children}</PageTransition>
          <FloatingAddButton />
          <BottomTabBar />
        </div>
      </div>
    </div>
  )
}
