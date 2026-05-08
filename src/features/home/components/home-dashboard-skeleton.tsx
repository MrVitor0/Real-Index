import { Skeleton } from "@/components/ui/skeleton";

import { HomeFooter } from "./home-footer";

function HomeMarketCardSkeleton() {
  return (
    <div className="rounded-[28px] border border-white/7 bg-market-surface/94 p-4 shadow-[0_24px_80px_-42px_rgba(0,0,0,0.95)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-2xl bg-white/6" />
          <Skeleton className="h-6 w-20 rounded-full bg-white/6" />
        </div>

        <div className="space-y-2 text-right">
          <Skeleton className="ml-auto h-7 w-16 rounded-xl bg-white/6" />
          <Skeleton className="ml-auto h-4 w-12 rounded-lg bg-white/6" />
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        <Skeleton className="h-5 w-[88%] rounded-lg bg-white/6" />
        <Skeleton className="h-5 w-[72%] rounded-lg bg-white/6" />
        <Skeleton className="h-4 w-28 rounded-lg bg-white/6" />
      </div>

      <div className="mt-5 space-y-2.5">
        <Skeleton className="h-1.5 w-full rounded-full bg-white/6" />

        <div className="grid grid-cols-2 gap-2">
          <Skeleton className="h-11 rounded-2xl bg-white/6" />
          <Skeleton className="h-11 rounded-2xl bg-white/6" />
        </div>
      </div>
    </div>
  );
}

export function HomeDashboardSkeleton() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="texture-grid pointer-events-none absolute inset-0 opacity-25" />

      <div className="surface-noise relative border-b border-white/6 bg-market-panel/90 px-4 py-3 backdrop-blur-xl md:px-6 lg:px-8">
        <div className="mx-auto grid max-w-470 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="flex min-w-0 items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-2xl bg-white/6" />
            <div className="min-w-0 space-y-2">
              <Skeleton className="h-4 w-28 rounded-lg bg-white/6" />
              <Skeleton className="h-3 w-36 rounded-lg bg-white/6" />
            </div>
          </div>

          <div className="order-3 col-span-2 w-full lg:order-0 lg:col-span-1 lg:mx-auto lg:max-w-2xl">
            <Skeleton className="h-11 w-full rounded-2xl bg-white/6" />
          </div>

          <div className="flex items-center justify-end gap-2 justify-self-end">
            <Skeleton className="hidden h-10 w-36 rounded-xl bg-white/6 sm:block" />
            <Skeleton className="h-10 w-10 rounded-xl bg-white/6" />
            <Skeleton className="h-10 w-10 rounded-xl bg-white/6 lg:hidden" />
          </div>
        </div>
      </div>

      <div className="relative mx-auto flex w-full max-w-470 flex-1 flex-col gap-6 px-4 pb-10 pt-5 md:px-6 lg:px-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(270px,0.66fr)_minmax(0,2.24fr)_19rem] xl:items-stretch">
          <div className="order-2 xl:order-1 xl:self-stretch">
            <div className="flex h-full flex-col rounded-[30px] border border-white/7 bg-market-surface/94 p-4 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-2xl bg-white/6" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24 rounded-lg bg-white/6" />
                    <Skeleton className="h-3 w-18 rounded-lg bg-white/6" />
                  </div>
                </div>
                <Skeleton className="h-6 w-12 rounded-full bg-white/6" />
              </div>

              <div className="mt-4 rounded-[24px] border border-white/8 bg-white/4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-[18px] bg-white/6" />
                    <Skeleton className="h-11 w-11 rounded-full bg-white/6" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24 rounded-lg bg-white/6" />
                      <Skeleton className="h-3 w-18 rounded-lg bg-white/6" />
                    </div>
                  </div>

                  <Skeleton className="h-6 w-14 rounded-full bg-white/6" />
                </div>

                <div className="mt-4 space-y-3">
                  <div className="space-y-2">
                    <Skeleton className="h-3 w-24 rounded-lg bg-white/6" />
                    <Skeleton className="h-9 w-40 rounded-xl bg-white/6" />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-16 rounded-[18px] bg-white/6" />
                    <Skeleton className="h-16 rounded-[18px] bg-white/6" />
                  </div>
                </div>
              </div>

              <div className="mt-auto grid gap-2.5 pt-3">
                <Skeleton className="h-21 rounded-[20px] bg-white/6" />
                <Skeleton className="h-21 rounded-[20px] bg-white/6" />
              </div>
            </div>
          </div>

          <div className="order-1 min-w-0 xl:order-2 xl:self-stretch">
            <div className="h-full rounded-[32px] p-px">
              <div className="flex h-full flex-col rounded-[31px] border border-white/7 bg-market-surface/94 p-3.5 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)] md:p-3.5 xl:p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-2xl bg-white/6" />
                    <div className="space-y-2.5">
                      <Skeleton className="h-8 w-[min(42rem,58vw)] max-w-full rounded-xl bg-white/6" />
                      <Skeleton className="h-8 w-[min(34rem,46vw)] max-w-full rounded-xl bg-white/6" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-10 rounded-2xl bg-white/6" />
                    <Skeleton className="h-10 w-10 rounded-2xl bg-white/6" />
                  </div>
                </div>

                <div className="mt-3.5 grid gap-3.5 xl:min-h-0 xl:flex-1 xl:grid-cols-[248px_minmax(0,1fr)] xl:items-start">
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-[4.6rem] rounded-[20px] bg-white/6" />
                    <Skeleton className="h-[4.6rem] rounded-[20px] bg-white/6" />

                    <div className="rounded-[20px] border border-white/8 bg-white/4 p-3.5">
                      <Skeleton className="h-6 w-28 rounded-full bg-white/6" />

                      <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
                        <Skeleton className="h-24 rounded-[22px] bg-white/6" />
                        <Skeleton className="h-24 rounded-[22px] bg-white/6" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col rounded-[22px] border border-white/7 bg-(--market-panel)/74 p-2.5 shadow-xl shadow-black/20 md:p-3 xl:h-full xl:min-h-0">
                    <div className="mb-2.5 flex flex-wrap gap-1.5">
                      <Skeleton className="h-7 w-40 rounded-full bg-white/6" />
                      <Skeleton className="h-7 w-32 rounded-full bg-white/6" />
                    </div>

                    <Skeleton className="h-64 rounded-[20px] bg-white/6 sm:h-72 xl:h-full xl:min-h-0" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-3 xl:self-stretch">
            <div className="grid gap-3.5 xl:h-full xl:grid-rows-[auto_minmax(0,1fr)]">
              <div className="rounded-[28px] border border-white/7 bg-market-surface/94 p-4 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
                <div className="space-y-3">
                  <Skeleton className="h-24 rounded-[20px] bg-white/6" />
                  <Skeleton className="h-24 rounded-[20px] bg-white/6" />
                  <Skeleton className="h-24 rounded-[20px] bg-white/6" />
                </div>
              </div>

              <div className="rounded-[28px] border border-white/7 bg-market-surface/94 p-4 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)] xl:min-h-0">
                <div className="flex items-center justify-between gap-3">
                  <Skeleton className="h-6 w-24 rounded-lg bg-white/6" />
                  <Skeleton className="h-6 w-12 rounded-full bg-white/6" />
                </div>

                <div className="mt-3 grid gap-2.5 xl:h-[calc(100%-2.25rem)] xl:auto-rows-fr">
                  <Skeleton className="h-18 rounded-[20px] bg-white/6" />
                  <Skeleton className="h-18 rounded-[20px] bg-white/6" />
                  <Skeleton className="h-18 rounded-[20px] bg-white/6" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="flex gap-2 overflow-hidden pb-1">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-9 w-24 shrink-0 rounded-full bg-white/6"
              />
            ))}
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, index) => (
              <HomeMarketCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </div>

      <HomeFooter />
    </div>
  );
}
