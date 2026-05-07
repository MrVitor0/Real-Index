"use client";

import type { Route } from "next";
import Link from "next/link";
import { Bookmark, Link2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { FeaturedMarket } from "@/features/home/contracts/home-feed";
import {
  formatProbability,
  formatSignedDelta,
  getToneUi,
} from "@/features/home/lib/presentation";
import { useFeaturedMarketLive } from "@/features/home/hooks/use-featured-market-live";

import { FeaturedMarketChart } from "./featured-market-chart";

type FeaturedMarketPanelProps = {
  market: FeaturedMarket;
};

export function FeaturedMarketPanel({ market }: FeaturedMarketPanelProps) {
  const liveMarket = useFeaturedMarketLive(market);
  const detailRoute = `/radar/${market.id}` as Route;
  const accountRoute = "/conta" as Route;
  const liveOutcomes = liveMarket.outcomes;
  const headlineOutcome =
    liveOutcomes.find((outcome) => outcome.id === market.headlineOutcomeId) ??
    liveOutcomes[0];
  const contrastingOutcome =
    liveOutcomes[liveOutcomes.length - 1] ?? liveOutcomes[1];
  const voteOptions = [headlineOutcome, contrastingOutcome].filter(
    (outcome, index, outcomes) =>
      outcome &&
      outcomes.findIndex((item) => item?.id === outcome.id) === index,
  );

  return (
    <section className="h-full">
      <Card className="code-surface surface-noise h-full overflow-hidden border-white/7 bg-market-surface/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
        <CardContent className="flex h-full flex-col p-3.5 md:p-3.5 xl:p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-(--market-positive)/20 bg-(--market-positive)/12 text-market-positive shadow-lg shadow-(color:--market-positive)/8 text-sm font-semibold tracking-[0.18em]">
                {market.iconLabel}
              </div>

              <div className="space-y-2">
                <h1 className="max-w-3xl text-[1.62rem] font-semibold leading-tight tracking-tight text-balance text-white md:text-[1.82rem]">
                  {market.title}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={detailRoute}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/4 text-white/72 transition-colors hover:bg-white/8 hover:text-white"
              >
                <Link2 className="h-4 w-4" />
              </Link>
              <Link
                href={accountRoute}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/4 text-white/72 transition-colors hover:bg-white/8 hover:text-white"
              >
                <Bookmark className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-3.5 grid flex-1 gap-3.5 xl:grid-cols-[264px_minmax(0,1fr)] xl:items-stretch">
            <div className="flex h-full flex-col gap-2">
              {liveOutcomes.map((outcome) => {
                const toneUi = getToneUi(outcome.tone);
                const isHeadlineOutcome = outcome.id === headlineOutcome.id;

                return (
                  <div
                    key={outcome.id}
                    className={`flex items-center justify-between gap-4 rounded-[20px] border px-4 py-2.5 ${
                      isHeadlineOutcome
                        ? "border-white/10 bg-white/5"
                        : "border-white/6 bg-white/3"
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

              <div className="relative flex flex-1 flex-col overflow-hidden rounded-[20px] border border-primary/18 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-3.5 shadow-[0_22px_44px_-34px_rgba(95,167,255,0.45)]">
                <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-primary/6 blur-2xl" />

                <div className="relative flex items-start gap-3">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/18 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      Momento de decidir
                    </div>

                    <div>
                      <p className="text-base font-semibold leading-tight text-white">
                        O que vai acontecer?
                      </p>
                    </div>
                  </div>
                </div>

                <div className="relative mt-3.5 grid auto-rows-fr gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
                  {voteOptions.map((outcome, index) => {
                    const toneUi = getToneUi(outcome.tone);
                    const isPrimaryOption =
                      outcome.id === headlineOutcome.id || index === 0;
                    const voteOptionClassName =
                      outcome.tone === "mint"
                        ? "border-(--market-positive)/24 bg-(--market-positive)/16 hover:bg-(--market-positive)/20"
                        : outcome.tone === "coral"
                          ? "border-(--market-negative)/24 bg-(--market-negative)/14 hover:bg-(--market-negative)/18"
                          : isPrimaryOption
                            ? "border-white/14 bg-white/9 hover:border-white/20 hover:bg-white/11"
                            : "border-white/8 bg-white/4 hover:border-white/14 hover:bg-white/8";

                    return (
                      <Link
                        key={outcome.id}
                        href={detailRoute}
                        className={`group relative flex min-h-28 min-w-0 items-center overflow-hidden rounded-[22px] border px-6 py-4 transition-all duration-200 hover:-translate-y-px focus-visible:border-primary/35 focus-visible:ring-primary/25 ${voteOptionClassName}`}
                      >
                        <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/10" />

                        <div className="relative flex w-full items-center justify-between gap-6">
                          <span
                            className={`min-w-0 flex-1 text-center text-[1.35rem] font-semibold tracking-tight ${toneUi.text}`}
                          >
                            {outcome.label}
                          </span>

                          <span
                            className={`shrink-0 text-[2.15rem] font-semibold tracking-tight ${toneUi.text}`}
                          >
                            {formatProbability(outcome.probability)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex h-full flex-col gap-2.5">
              <div className="flex h-full flex-col rounded-[22px] border border-white/7 bg-(--market-panel)/74 p-2.5 shadow-xl shadow-black/20 md:p-3">
                <div className="mb-2.5 flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex flex-wrap gap-1.5">
                      {liveMarket.activities.slice(0, 2).map((activity) => {
                        const toneUi = getToneUi(activity.tone);

                        return (
                          <div
                            key={activity.id}
                            className="animate-in fade-in slide-in-from-top-2 duration-500 flex min-w-0 items-center gap-2 rounded-full border border-white/8 bg-white/4 px-2.5 py-1"
                          >
                            <span
                              className={`h-1.5 w-1.5 shrink-0 rounded-full ${toneUi.dot}`}
                            />
                            <span className="truncate text-[11px] text-white/70">
                              {activity.headline}
                            </span>
                            <span
                              className={`shrink-0 text-[11px] font-semibold ${toneUi.text}`}
                            >
                              {activity.contextLabel}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="h-77.5 sm:h-85 xl:h-full xl:min-h-105">
                  <FeaturedMarketChart
                    outcomes={liveOutcomes}
                    points={liveMarket.points}
                    yAxisTicks={market.chart.yAxisTicks}
                    headlineOutcomeId={market.headlineOutcomeId}
                    height="100%"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
