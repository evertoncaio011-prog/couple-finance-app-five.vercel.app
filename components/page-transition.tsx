'use client'

import { usePathname } from 'next/navigation'

/**
 * Wraps route content so switching between tabs (dashboard, transactions,
 * categories, profile) gets a soft fade + slide instead of an abrupt swap.
 * Keyed by pathname so React remounts (and re-triggers the animation) on
 * every navigation inside the (app) route group.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  return (
    <div
      key={pathname}
      className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300 ease-out"
    >
      {children}
    </div>
  )
}
