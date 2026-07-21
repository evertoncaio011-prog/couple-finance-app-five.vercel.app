import { Skeleton } from '@/components/ui/skeleton'

export default function AppLoading() {
  return (
    <div className="flex flex-col gap-6 pb-24">
      <div className="flex items-center justify-between px-5 pt-6">
        <Skeleton className="h-6 w-28" />
      </div>
      <div className="mx-5">
        <Skeleton className="h-40 rounded-3xl" />
      </div>
      <div className="px-5">
        <Skeleton className="h-48 rounded-2xl" />
      </div>
      <div className="px-5">
        <Skeleton className="h-56 rounded-2xl" />
      </div>
    </div>
  )
}
