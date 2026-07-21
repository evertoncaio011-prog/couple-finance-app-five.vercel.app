import { cn } from '@/lib/utils'

export function BrandMark({
  className,
  showWordmark = true,
  showIcon = true,
}: {
  className?: string
  showWordmark?: boolean
  // No dashboard o botão fixo do menu (NavDrawer) ocupa o mesmo canto
  // superior esquerdo, então a página evita duplicar o ícone e mostra
  // só o nome ao lado do botão.
  showIcon?: boolean
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {showIcon && (
        <span
          aria-hidden
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 20.5S3.5 15.4 3.5 9.4C3.5 6.6 5.7 4.5 8.3 4.5c1.6 0 3 .8 3.7 2 .7-1.2 2.1-2 3.7-2 2.6 0 4.8 2.1 4.8 4.9 0 6-8.5 11.1-8.5 11.1Z"
              fill="currentColor"
            />
          </svg>
        </span>
      )}
      {showWordmark && (
        <span className="font-heading text-xl font-extrabold tracking-tight text-foreground">
          Twogether
        </span>
      )}
    </div>
  )
}
