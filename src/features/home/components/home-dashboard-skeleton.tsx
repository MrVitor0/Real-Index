import { Skeleton } from "@/components/ui/skeleton";

import { HomeFooter } from "./home-footer";

export function HomeDashboardSkeleton() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="texture-grid pointer-events-none absolute inset-0 opacity-25" />

      <div className="relative border-b border-white/6 bg-(--market-panel)/88 px-4 py-4 backdrop-blur-xl md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-[1760px] flex-col gap-4">
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

      <div className="relative mx-auto grid w-full max-w-[1760px] flex-1 gap-6 px-4 pb-10 pt-6 md:px-6 lg:px-8 xl:grid-cols-[320px_minmax(0,1fr)_300px] xl:items-start 2xl:grid-cols-[340px_minmax(0,1fr)_320px]">
        <div className="order-2 grid gap-3.5 xl:order-1">
          <Skeleton className="h-88 rounded-[32px] bg-white/6" />
          <Skeleton className="h-96 rounded-[32px] bg-white/6" />
        </div>

        <div className="order-1 space-y-6 xl:order-2">
          <Skeleton className="h-130 rounded-[32px] bg-white/6" />

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

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-61 rounded-[28px] bg-white/6"
                />
              ))}
            </div>
          </div>
        </div>

        <div className="order-3 grid gap-3.5">
          <Skeleton className="h-74 rounded-[32px] bg-white/6" />
          <Skeleton className="h-74 rounded-[32px] bg-white/6" />
        </div>
      </div>

      <HomeFooter />
    </div>
  );
}
