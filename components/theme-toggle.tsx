'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Moon, Sun, MonitorSmartphone } from 'lucide-react'
import { cn } from '@/lib/utils'

const options = [
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
  { value: 'system', label: 'Sistema', icon: MonitorSmartphone },
] as const

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  // Evita mismatch de hidratação: o tema real só é conhecido no cliente.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  return (
    <div className="flex gap-1 rounded-2xl bg-muted p-1">
      {options.map(({ value, label, icon: Icon }) => {
        const active = mounted && theme === value
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={cn(
              'flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition-colors',
              active
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </button>
        )
      })}
    </div>
  )
}
