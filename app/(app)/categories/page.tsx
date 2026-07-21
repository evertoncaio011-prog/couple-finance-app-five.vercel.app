import { requireAccount, getCategories } from '@/lib/data'
import { PageHeader } from '@/components/page-header'
import { CategoryForm } from '@/components/category-form'
import { DeleteButton } from '@/components/delete-button'
import { Badge } from '@/components/ui/badge'
import { deleteCategory } from '@/app/actions'

const typeLabel: Record<string, string> = {
  income: 'Receita',
  expense: 'Despesa',
  both: 'Ambos',
}

export default async function CategoriesPage() {
  const { account } = await requireAccount()
  const categories = await getCategories(account.id)

  return (
    <div className="flex flex-col gap-6 pb-10">
      <PageHeader
        title="Categorias"
        subtitle="Organize suas receitas e despesas compartilhadas."
      />

      <section className="px-5">
        <CategoryForm />
      </section>

      <section className="px-1">
        <div className="mx-4 overflow-hidden rounded-2xl border border-border bg-card">
          {categories.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">
              Nenhuma categoria ainda.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {categories.map((c, i) => (
                <li
                  key={c.id}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50 animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both"
                  style={{ animationDelay: `${i * 30}ms`, animationDuration: '300ms' }}
                >
                  <span
                    aria-hidden
                    className="h-8 w-8 shrink-0 rounded-full"
                    style={{ backgroundColor: `${c.color}22`, border: `1px solid ${c.color}` }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.name}</p>
                    <Badge variant="outline" className="mt-0.5">
                      {typeLabel[c.type] ?? c.type}
                    </Badge>
                  </div>
                  {!c.is_default && (
                    <DeleteButton
                      onDelete={deleteCategory.bind(null, c.id)}
                      label="Excluir categoria"
                      confirmMessage="Excluir esta categoria? As transações existentes mantêm os valores, mas perdem essa categoria."
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
