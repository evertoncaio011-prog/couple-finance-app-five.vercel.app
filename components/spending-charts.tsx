'use client'

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  XAxis,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { monthLabel } from '@/lib/format'
import type { CategorySlice, MonthPoint } from '@/lib/summary'

const barConfig = {
  income: { label: 'Receitas', color: 'var(--chart-1)' },
  expense: { label: 'Despesas', color: 'var(--chart-4)' },
} satisfies ChartConfig

export function IncomeExpenseChart({ data }: { data: MonthPoint[] }) {
  const chartData = data.map((d) => ({
    ...d,
    month: monthLabel(d.key).split(' ')[0].slice(0, 3),
  }))

  return (
    <ChartContainer config={barConfig} className="h-48 w-full">
      <BarChart data={chartData} barGap={4}>
        <XAxis
          dataKey="month"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="income"
          fill="var(--color-income)"
          radius={4}
          animationDuration={700}
          animationEasing="ease-out"
        />
        <Bar
          dataKey="expense"
          fill="var(--color-expense)"
          radius={4}
          animationDuration={700}
          animationEasing="ease-out"
        />
      </BarChart>
    </ChartContainer>
  )
}

export function CategoryDonut({ data }: { data: CategorySlice[] }) {
  const config: ChartConfig = Object.fromEntries(
    data.map((d) => [d.id, { label: d.name, color: d.color }]),
  )

  return (
    <ChartContainer
      config={config}
      className="mx-auto aspect-square h-48"
    >
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={50}
          strokeWidth={2}
          animationDuration={700}
          animationEasing="ease-out"
        >
          {data.map((entry) => (
            <Cell key={entry.id} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ChartContainer>
  )
}
