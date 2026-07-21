'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import type { Category } from '@/lib/types'
import { monthLabel } from '@/lib/format'

const selectClass =
  'h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30'

export function TransactionFilters({
  months,
  categories,
}: {
  months: string[]
  categories: Category[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <select
        aria-label="Filtrar por mês"
        className={selectClass}
        defaultValue={searchParams.get('month') ?? ''}
        onChange={(e) => update('month', e.target.value)}
      >
        <option value="">Todos os meses</option>
        {months.map((m) => (
          <option key={m} value={m}>
            {monthLabel(m)}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por categoria"
        className={selectClass}
        defaultValue={searchParams.get('category') ?? ''}
        onChange={(e) => update('category', e.target.value)}
      >
        <option value="">Todas as categorias</option>
        {categories.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrar por tipo"
        className={selectClass}
        defaultValue={searchParams.get('type') ?? ''}
        onChange={(e) => update('type', e.target.value)}
      >
        <option value="">Todos os tipos</option>
        <option value="income">Receita</option>
        <option value="expense">Despesa</option>
        <option value="neutral">Outros</option>
      </select>
    </div>
  )
}
