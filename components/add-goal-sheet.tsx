'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { GoalForm } from '@/components/goal-form'

export function AddGoalSheet() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Plus className="h-5 w-5" aria-hidden />
        </span>
        <span>
          <p className="font-heading font-semibold">Adicionar meta</p>
          <p className="text-sm text-muted-foreground">Comecem a guardar para algo juntos</p>
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="space-y-1 text-center">
            <SheetDescription>Nova meta</SheetDescription>
            <SheetTitle className="text-2xl font-bold">Guardem para o que importa</SheetTitle>
          </SheetHeader>

          <div className="px-5 pb-6">
            <GoalForm onSuccess={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
