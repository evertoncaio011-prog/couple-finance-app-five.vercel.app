'use client'

import { LogOut } from 'lucide-react'
import { signOut } from '@/app/actions'
import { Button } from '@/components/ui/button'

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="outline" className="w-full">
        <LogOut className="h-4 w-4" aria-hidden />
        Sair
      </Button>
    </form>
  )
}
