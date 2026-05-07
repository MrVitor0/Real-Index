import { Skeleton } from "@/components/ui/skeleton";

export function HomeDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="border-b border-white/6 bg-[color:var(--market-panel)]/88 px-4 py-4 backdrop-blur-xl md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1360px] flex-col gap-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-40 rounded-2xl bg-white/6" />
            <Skeleton className="hidden h-12 flex-1 rounded-2xl bg-white/6 md:block" />
            <Skeleton className="h-10 w-28 rounded-2xl bg-white/6" />
            <Skeleton className="h-10 w-10 rounded-2xl bg-white/6" />
          </div>
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-8 w-20 rounded-full bg-white/6"
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-8 px-4 pb-10 pt-6 md:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-[520px] rounded-[32px] bg-white/6" />
          <div className="grid gap-6">
            <Skeleton className="h-[240px] rounded-[32px] bg-white/6" />
            <Skeleton className="h-[240px] rounded-[32px] bg-white/6" />
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-10 w-52 rounded-2xl bg-white/6" />
            <Skeleton className="h-10 w-36 rounded-2xl bg-white/6" />
          </div>

          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-10 w-24 rounded-full bg-white/6"
              />
            ))}
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-[244px] rounded-[28px] bg-white/6"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
