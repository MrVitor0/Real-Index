import { Bookmark, ChevronLeft, ChevronRight, Link2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { FeaturedMarket } from "@/features/home/contracts/home-feed";
import {
  formatProbability,
  formatSignedDelta,
  getToneUi,
} from "@/features/home/lib/presentation";

import { FeaturedMarketChart } from "./featured-market-chart";

type FeaturedMarketPanelProps = {
  market: FeaturedMarket;
};

export function FeaturedMarketPanel({ market }: FeaturedMarketPanelProps) {
  const headlineOutcome =
    market.outcomes.find(
      (outcome) => outcome.id === market.headlineOutcomeId,
    ) ?? market.outcomes[0];

  return (
    <section className="space-y-5">
      <Card className="code-surface surface-noise overflow-hidden border-white/7 bg-market-surface/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
        <CardContent className="p-5 md:p-6 xl:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--market-positive)]/20 bg-[color:var(--market-positive)]/12 text-sm font-semibold tracking-[0.18em] text-[color:var(--market-positive)] shadow-lg shadow-[color:var(--market-positive)]/8">
                {market.iconLabel}
              </div>

              <div className="space-y-3">
                <Badge className="rounded-full border-white/10 bg-white/[0.04] px-3 py-1 font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-white/62 hover:bg-white/[0.04]">
                  radar-em-destaque.ts
                </Badge>

                <div className="flex items-center gap-2 text-sm text-white/48">
                  <span>{market.category}</span>
                  <span>•</span>
                  <span>{market.subCategory}</span>
                </div>
                <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-balance text-white md:text-[2.15rem]">
                  <span className="mr-2 font-mono text-primary/68">&#123;</span>
                  {market.title}
                  <span className="ml-2 font-mono text-primary/68">&#125;</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-2xl border border-white/8 bg-white/4 text-white/72 hover:bg-white/8 hover:text-white"
              >
                <Link2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-2xl border border-white/8 bg-white/4 text-white/72 hover:bg-white/8 hover:text-white"
              >
                <Bookmark className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-8 grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/7 bg-[color:var(--market-panel)]/74 p-5 shadow-xl shadow-black/20">
                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-white/38">
                  probabilidadePrincipal()
                </p>
                <div className="mt-4 flex items-end gap-3">
                  <p className="text-5xl font-semibold tracking-tight text-white">
                    {formatProbability(headlineOutcome.probability)}
                  </p>
                  <Badge
                    className={`${getToneUi(headlineOutcome.tone).soft} mb-1 rounded-full px-3 py-1 text-xs font-semibold`}
                  >
                    {headlineOutcome.label}
                  </Badge>
                </div>
                <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.24em] text-white/32">
                  {'retorna "'}
                  {headlineOutcome.id}
                  {'";'}
                </p>
              </div>

              <div className="space-y-3">
                {market.outcomes.map((outcome) => {
                  const toneUi = getToneUi(outcome.tone);

                  return (
                    <div
                      key={outcome.id}
                      className="flex items-center justify-between gap-4 rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${toneUi.dot}`}
                        />
                        <div>
                          <span className="text-sm font-medium text-white/82">
                            {outcome.label}
                          </span>
                          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/30">
                            estado::{outcome.id}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold tracking-tight text-white">
                          {formatProbability(outcome.probability)}
                        </p>
                        <p className={`text-xs font-medium ${toneUi.text}`}>
                          {formatSignedDelta(outcome.change)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-[24px] border border-white/6 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] font-medium uppercase tracking-[0.24em] text-white/36">
                    {market.volumeLabel}
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/30">
                    {market.resolutionLabel}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                {market.outcomes.map((outcome) => {
                  const toneUi = getToneUi(outcome.tone);

                  return (
                    <div
                      key={outcome.id}
                      className="flex items-center gap-2 text-sm text-white/62"
                    >
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${toneUi.dot}`}
                      />
                      <span>{outcome.label}</span>
                      <span className={toneUi.text}>
                        {formatProbability(outcome.probability)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="rounded-[28px] border border-white/7 bg-[color:var(--market-panel)]/74 p-4 shadow-xl shadow-black/20 md:p-5">
                <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/6 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-market-negative/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-market-warning/80" />
                    <span className="h-2.5 w-2.5 rounded-full bg-market-positive/80" />
                  </div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/34">
                    esteira-de-lancamento.tsx
                  </p>
                </div>

                <FeaturedMarketChart
                  outcomes={market.outcomes}
                  points={market.chart.points}
                  yAxisTicks={market.chart.yAxisTicks}
                  headlineOutcomeId={market.headlineOutcomeId}
                />

                <div className="mt-4 flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-white/38">
                  <span>{market.resolutionLabel}</span>
                  <span>real-index.sinal</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all ${
                index === 0 ? "w-7 bg-white" : "w-1.5 bg-white/18"
              }`}
            />
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-11 w-11 rounded-full border border-white/8 bg-white/4 text-white/72 hover:bg-white/8 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {market.relatedMarkets.map((relatedMarket) => (
            <Button
              key={relatedMarket.id}
              variant="ghost"
              className="h-11 rounded-full border border-white/8 bg-white/4 px-4 font-mono text-[12px] font-medium uppercase tracking-[0.16em] text-white/72 hover:bg-white/8 hover:text-white"
            >
              [{relatedMarket.label}]
            </Button>
          ))}
          <Button
            variant="ghost"
            size="icon-sm"
            className="h-11 w-11 rounded-full border border-white/8 bg-white/4 text-white/72 hover:bg-white/8 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
