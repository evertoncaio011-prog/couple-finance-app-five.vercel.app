import { requireAccount } from '@/lib/data'
import { NavDrawer } from '@/components/nav-drawer'
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
    <div className="relative mx-auto min-h-svh w-full max-w-lg bg-background pb-10">
      <NavDrawer />
      <PageTransition>{children}</PageTransition>
      <FloatingAddButton />
    </div>
  )
}
