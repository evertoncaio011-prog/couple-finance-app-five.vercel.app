export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDateShort(value: string): string {
  // value is a YYYY-MM-DD date string; parse as local to avoid TZ shift
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, d ?? 1)
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function monthKey(value: string): string {
  return value.slice(0, 7) // YYYY-MM
}

export function monthLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  const date = new Date(y, (m ?? 1) - 1, 1)
  const label = date.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function initials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function todayISO(): string {
  const d = new Date()
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60 * 1000)
  return local.toISOString().slice(0, 10)
}

/**
 * Current month key (YYYY-MM) computed from local time.
 * Using `new Date().toISOString()` directly is a common bug source: it
 * reports UTC, which can land on the wrong month for users west of UTC
 * near midnight. Always derive "today" from `todayISO()` instead.
 */
export function currentMonthKey(): string {
  return monthKey(todayISO())
}

/**
 * Competência ('YYYY-MM') da fatura a que uma compra de cartão pertence,
 * a partir da data da compra e do dia de fechamento do cartão. Compra até
 * o dia de fechamento entra na fatura que fecha neste mês; depois do
 * fechamento, "vira o mês" e entra na fatura seguinte. Espelha a função
 * SQL invoice_competencia() do schema — mantenha as duas em sincronia.
 */
export function invoiceCompetencia(dateStr: string, closingDay: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  if (d <= closingDay) return `${y}-${String(m).padStart(2, '0')}`
  // `m` aqui é 1-based (jan=1); usado como índice 0-based do Date, ele já
  // aponta para o mês seguinte (jan=1 -> índice 1 = fevereiro).
  const next = new Date(y, m, 1)
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`
}
