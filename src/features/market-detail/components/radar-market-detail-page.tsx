"use client";

import { AlertTriangle } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type {
  RadarForecastAccountState,
  RadarMarketDetail,
} from "@/features/market-detail/contracts/radar-market-detail";
import { getToneUi } from "@/features/home/lib/presentation";
import { formatSignalScore } from "@/features/market-detail/lib/forecast";
import { useRadarLiveSnapshot } from "@/features/market-detail/hooks/use-radar-live-snapshot";

import { RadarActivePositionCard } from "./radar-active-position-card";
import { RadarForecastLauncherCard } from "./radar-forecast-launcher-card";
import { RadarMarketDetailChart } from "./radar-market-detail-chart";

type RadarMarketDetailPageProps = {
  market: RadarMarketDetail;
  initialAccountState: RadarForecastAccountState;
};

export function RadarMarketDetailPage({
  market,
  initialAccountState,
}: RadarMarketDetailPageProps) {
  const {
    data: liveSnapshot,
    error,
    status,
    replaceAccountState,
    replaceMarket,
  } = useRadarLiveSnapshot({
    initialMarket: market,
    initialAccountState,
  });
  const liveMarket = liveSnapshot.market;
  const viewerState = liveSnapshot.accountState;
  const toneUi = getToneUi(liveMarket.tone);

  return (
    <main className="mx-auto flex w-full max-w-370 flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="space-y-6">
          <Card className="code-surface surface-noise border-white/7 bg-market-surface/96 shadow-[0_32px_90px_-42px_rgba(0,0,0,0.98)]">
            <CardContent className="space-y-6 p-5 md:p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div className="flex min-w-0 items-start gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-sm font-semibold tracking-[0.16em] ${toneUi.soft}`}
                  >
                    {liveMarket.iconLabel}
                  </div>

                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2 text-sm text-white/46">
                      <span>{liveMarket.category}</span>
                      <span>•</span>
                      <span>{liveMarket.subtitle}</span>
                    </div>
                    <h1 className="max-w-4xl text-3xl font-semibold leading-tight tracking-tight text-white md:text-[2.3rem]">
                      {liveMarket.title}
                    </h1>
                  </div>
                </div>
              </div>

              <div className="rounded-[26px] border border-white/7 bg-(--market-panel)/74 p-4 md:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/36">
                      Mercado em foco
                    </p>
                    <div className="flex items-center gap-2 text-sm text-white/58">
                      <span>{liveMarket.yesLabel}</span>
                      <span className={toneUi.text}>
                        {formatSignalScore(liveMarket.yesScore)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-white/38">
                    <span>{liveMarket.volumeLabel}</span>
                    <span>•</span>
                    <span>{liveMarket.closeLabel}</span>
                  </div>
                </div>

                <RadarMarketDetailChart
                  chart={liveMarket.chart}
                  tone={liveMarket.tone}
                />
              </div>

              {viewerState.openPosition ? (
                <RadarActivePositionCard position={viewerState.openPosition} />
              ) : null}

              {status === "error" && error ? (
                <div className="flex items-center gap-3 rounded-2xl border border-(--market-warning)/18 bg-(--market-warning)/10 px-4 py-3 text-sm text-market-warning">
                  <AlertTriangle className="h-4 w-4" />
                  <span>
                    Mostrando o ultimo estado valido enquanto o radar sincroniza
                    novamente.
                  </span>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <RadarForecastLauncherCard
            market={liveMarket}
            accountState={viewerState}
            accountStateSyncMode="external"
            onAccountStateChange={replaceAccountState}
            onMarketUpdate={replaceMarket}
          />
        </div>
      </section>
    </main>
  );
}
