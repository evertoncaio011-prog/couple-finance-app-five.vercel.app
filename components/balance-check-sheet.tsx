'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, ClipboardCheck, Scale } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { adjustUserBalance, createBalanceAdjustmentTransaction } from '@/app/actions'
import { formatCurrency } from '@/lib/format'

function toNumber(v: string): number {
  const n = Number(v.replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

type Step = 'form' | 'result'

export function BalanceCheckButton({
  userBalance,
  registeredMonthIncome,
}: {
  userBalance: number
  registeredMonthIncome: number
}) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>('form')
  const [resolved, setResolved] = useState(false)
  const [pending, startTransition] = useTransition()

  const [receivedThisMonth, setReceivedThisMonth] = useState('')
  const [bankBalance, setBankBalance] = useState('')
  const [unregisteredIncome, setUnregisteredIncome] = useState('')
  const [unregisteredExpense, setUnregisteredExpense] = useState('')

  const reportedBalance = toNumber(bankBalance)
  const extraIncome = toNumber(unregisteredIncome)
  const extraExpense = toNumber(unregisteredExpense)
  const adjustedAppBalance = userBalance + extraIncome - extraExpense
  const divergence = reportedBalance - adjustedAppBalance
  const isSquare = Math.abs(divergence) < 0.01

  const monthIncomeDiff = toNumber(receivedThisMonth) - registeredMonthIncome
  const showMonthIncomeNote =
    receivedThisMonth.trim() !== '' && Math.abs(monthIncomeDiff) >= 0.01

  function resetAndClose() {
    setOpen(false)
    // Pequeno atraso pra não "piscar" o formulário voltando enquanto o
    // Sheet ainda está fechando visualmente.
    setTimeout(() => {
      setStep('form')
      setResolved(false)
      setReceivedThisMonth('')
      setBankBalance('')
      setUnregisteredIncome('')
      setUnregisteredExpense('')
    }, 300)
  }

  function handleAdjustBase() {
    startTransition(async () => {
      const res = await adjustUserBalance(divergence)
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Saldo base ajustado!')
      setResolved(true)
    })
  }

  function handleCreateTransaction() {
    startTransition(async () => {
      const res = await createBalanceAdjustmentTransaction(
        Math.abs(divergence),
        divergence > 0 ? 'income' : 'expense',
      )
      if (res?.error) {
        toast.error(res.error)
        return
      }
      toast.success('Lançamento de ajuste criado!')
      setResolved(true)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-sm"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Scale className="h-5 w-5" aria-hidden />
        </span>
        <span>
          <p className="font-heading font-semibold">Conferir saldo</p>
          <p className="text-sm text-muted-foreground">
            Compare com sua conta bancária de verdade
          </p>
        </span>
      </button>

      <Sheet open={open} onOpenChange={(v) => (v ? setOpen(true) : resetAndClose())}>
        <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto rounded-t-3xl">
          {step === 'form' ? (
            <>
              <SheetHeader className="space-y-1 text-center">
                <SheetDescription>Conferir saldo</SheetDescription>
                <SheetTitle className="text-2xl font-bold">
                  Vamos bater os números?
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-4 px-5 pb-6">
                <div className="grid gap-2">
                  <Label htmlFor="received-month">
                    1. Quanto você recebeu este mês?
                  </Label>
                  <Input
                    id="received-month"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={receivedThisMonth}
                    onChange={(e) => setReceivedThisMonth(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="bank-balance">
                    2. Qual é o saldo atual da sua conta bancária?
                  </Label>
                  <Input
                    id="bank-balance"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    required
                    value={bankBalance}
                    onChange={(e) => setBankBalance(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="extra-income">
                    3. Entrou algum dinheiro que não foi registrado no app?{' '}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    id="extra-income"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={unregisteredIncome}
                    onChange={(e) => setUnregisteredIncome(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="extra-expense">
                    4. Houve algum gasto que não foi registrado no app?{' '}
                    <span className="font-normal text-muted-foreground">(opcional)</span>
                  </Label>
                  <Input
                    id="extra-expense"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={unregisteredExpense}
                    onChange={(e) => setUnregisteredExpense(e.target.value)}
                  />
                </div>

                <Button
                  type="button"
                  className="w-full"
                  disabled={bankBalance.trim() === ''}
                  onClick={() => setStep('result')}
                >
                  Comparar
                </Button>
              </div>
            </>
          ) : (
            <>
              <SheetHeader className="space-y-1 text-center">
                <SheetDescription>Resultado</SheetDescription>
                <SheetTitle className="text-2xl font-bold">
                  {isSquare ? 'Tudo bate! 🎉' : 'Achei uma diferença'}
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-col gap-4 px-5 pb-6">
                {showMonthIncomeNote && (
                  <p className="rounded-xl bg-muted px-3 py-2 text-xs text-muted-foreground">
                    Só pra você saber: o app tem {formatCurrency(registeredMonthIncome)} em
                    receitas registradas este mês, e você disse que recebeu{' '}
                    {formatCurrency(toNumber(receivedThisMonth))}.
                  </p>
                )}

                <div className="flex flex-col gap-1.5 rounded-2xl bg-muted p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Saldo calculado pelo app</span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(userBalance)}
                    </span>
                  </div>
                  {(extraIncome > 0 || extraExpense > 0) && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        Considerando o que você contou
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatCurrency(adjustedAppBalance)}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sua conta bancária</span>
                    <span className="font-medium tabular-nums">
                      {formatCurrency(reportedBalance)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-1.5">
                    <span className="font-semibold">Diferença</span>
                    <span
                      className={`font-bold tabular-nums ${
                        isSquare
                          ? 'text-primary'
                          : divergence > 0
                            ? 'text-emerald-600'
                            : 'text-rose-600'
                      }`}
                    >
                      {isSquare ? 'R$ 0,00' : `${divergence > 0 ? '+' : '−'} ${formatCurrency(Math.abs(divergence))}`}
                    </span>
                  </div>
                </div>

                {isSquare || resolved ? (
                  <div className="flex flex-col items-center gap-2 rounded-2xl bg-primary/10 px-4 py-5 text-center">
                    <CheckCircle2 className="h-6 w-6 text-primary" aria-hidden />
                    <p className="text-sm text-primary">
                      {resolved
                        ? 'Ajuste feito! Seu saldo já reflete isso.'
                        : 'Seu saldo no app está exatamente igual ao da sua conta.'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">
                      Como você quer corrigir essa diferença?
                    </p>
                    <Button
                      type="button"
                      className="w-full"
                      disabled={pending}
                      onClick={handleAdjustBase}
                    >
                      <Scale className="mr-2 h-4 w-4" />
                      Ajustar saldo base
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={pending}
                      onClick={handleCreateTransaction}
                    >
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Criar lançamento de ajuste
                    </Button>
                    <p className="px-1 text-xs text-muted-foreground">
                      "Ajustar saldo base" corrige o número sem criar uma transação nova.
                      "Criar lançamento" registra uma{' '}
                      {divergence > 0 ? 'receita' : 'despesa'} de ajuste de{' '}
                      {formatCurrency(Math.abs(divergence))} na sua atividade.
                    </p>
                  </div>
                )}

                <Button type="button" variant="ghost" className="w-full" onClick={resetAndClose}>
                  {resolved || isSquare ? 'Fechar' : 'Deixar pra depois'}
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
