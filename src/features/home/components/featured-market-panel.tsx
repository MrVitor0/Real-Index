import { Bookmark, Link2 } from "lucide-react";

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
  const contrastingOutcome =
    market.outcomes[market.outcomes.length - 1] ?? market.outcomes[1];
  const voteOptions = [headlineOutcome, contrastingOutcome].filter(
    (outcome, index, outcomes) =>
      outcome &&
      outcomes.findIndex((item) => item?.id === outcome.id) === index,
  );

  return (
    <section className="h-full">
      <Card className="code-surface surface-noise h-full overflow-hidden border-white/7 bg-market-surface/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
        <CardContent className="flex h-full flex-col p-4 md:p-4 xl:p-4.5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[color:var(--market-positive)]/20 bg-[color:var(--market-positive)]/12 text-sm font-semibold tracking-[0.18em] text-[color:var(--market-positive)] shadow-lg shadow-[color:var(--market-positive)]/8">
                {market.iconLabel}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-white/48">
                  <span>{market.category}</span>
                  <span>•</span>
                  <span>{market.subCategory}</span>
                </div>
                <h1 className="max-w-3xl text-[1.72rem] font-semibold leading-tight tracking-tight text-balance text-white md:text-[1.95rem]">
                  {market.title}
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

          <div className="mt-4 grid flex-1 gap-4 xl:grid-cols-[270px_minmax(0,1fr)] xl:items-stretch">
            <div className="flex h-full flex-col gap-2.5">
              {market.outcomes.map((outcome) => {
                const toneUi = getToneUi(outcome.tone);
                const isHeadlineOutcome = outcome.id === headlineOutcome.id;

                return (
                  <div
                    key={outcome.id}
                    className={`flex items-center justify-between gap-4 rounded-[20px] border px-4 py-3 ${
                      isHeadlineOutcome
                        ? "border-white/10 bg-white/[0.05]"
                        : "border-white/6 bg-white/[0.03]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-2.5 w-2.5 rounded-full ${toneUi.dot}`}
                      />
                      <div>
                        <span className="text-sm font-medium text-white/82">
                          {outcome.label}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`font-semibold tracking-tight text-white ${
                          isHeadlineOutcome ? "text-2xl" : "text-xl"
                        }`}
                      >
                        {formatProbability(outcome.probability)}
                      </p>
                      <p className={`text-xs font-medium ${toneUi.text}`}>
                        {formatSignedDelta(outcome.change)}
                      </p>
                    </div>
                  </div>
                );
              })}

              <div className="rounded-[20px] border border-white/6 bg-white/[0.03] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      Em qual cenario voce votaria?
                    </p>
                    <p className="mt-1 text-xs text-white/46">
                      Use os cenarios do snapshot atual para registrar seu
                      palpite.
                    </p>
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/30">
                    CTA
                  </span>
                </div>

                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  {voteOptions.map((outcome) => {
                    const toneUi = getToneUi(outcome.tone);

                    return (
                      <Button
                        key={outcome.id}
                        className={`h-10 min-w-0 justify-start gap-2 overflow-hidden rounded-2xl border px-2.5 text-[13px] font-semibold ${toneUi.soft}`}
                      >
                        <span
                          className={`h-2 w-2 shrink-0 rounded-full ${toneUi.dot}`}
                        />
                        <span className="truncate">{outcome.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-auto flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.2em] text-white/34">
                <span>{market.volumeLabel}</span>
                <span>{market.resolutionLabel}</span>
              </div>
            </div>

            <div className="flex h-full flex-col gap-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
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

              <div className="flex min-h-[100%] flex-1 flex-col rounded-[22px] border border-white/7 bg-[color:var(--market-panel)]/74 p-3.5 shadow-xl shadow-black/20 md:p-4">
                <div className="mb-2.5 flex items-center justify-end gap-3">
                  <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/34">
                    esteira-de-lancamento.tsx
                  </p>
                </div>

                <div className="min-h-[276px] flex-1">
                  <FeaturedMarketChart
                    outcomes={market.outcomes}
                    points={market.chart.points}
                    yAxisTicks={market.chart.yAxisTicks}
                    headlineOutcomeId={market.headlineOutcomeId}
                    height="100%"
                  />
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 font-mono text-[11px] uppercase tracking-[0.22em] text-white/38">
                  <span>{headlineOutcome.label}</span>
                  <span>real-index.sinal</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
