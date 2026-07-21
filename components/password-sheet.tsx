'use client'

import { useState } from 'react'
import { KeyRound, ChevronRight } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { PasswordForm } from '@/components/profile-form'

export function PasswordSheetRow() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted"
      >
        <KeyRound className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="flex-1 text-sm font-medium">Alterar senha</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/60" aria-hidden />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle>Alterar senha</SheetTitle>
            <SheetDescription>
              Confirme sua senha atual antes de definir uma nova.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <PasswordForm onSuccess={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
