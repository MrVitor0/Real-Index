"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { useForecastOrderDialog } from "@/components/providers/forecast-order-dialog-provider";
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
  markets: [FeaturedMarket, ...FeaturedMarket[]];
  viewerAuthStatus: "anonymous" | "authenticated";
};

const AUTO_ROTATE_INTERVAL_MS = 5_000;

function formatParticipantCount(value: number) {
  const countLabel = new Intl.NumberFormat("pt-BR").format(value);

  return `${countLabel} ${value === 1 ? "pessoa" : "pessoas"}`;
}

function resolveMarketIndex(
  markets: FeaturedMarket[],
  marketId: string | null,
) {
  if (!marketId) {
    return 0;
  }

  const marketIndex = markets.findIndex((market) => market.id === marketId);

  return marketIndex === -1 ? 0 : marketIndex;
}

function getAdjacentMarketId(
  markets: FeaturedMarket[],
  marketId: string | null,
  offset: -1 | 1,
) {
  if (markets.length === 0) {
    return null;
  }

  const currentIndex = resolveMarketIndex(markets, marketId);
  const nextIndex = (currentIndex + offset + markets.length) % markets.length;

  return markets[nextIndex]?.id ?? markets[0]?.id ?? null;
}

function resolveDecisionLabelClassName(label: string) {
  if (label.length >= 16) {
    return "text-[0.78rem] md:text-[0.84rem] xl:text-[0.9rem]";
  }

  if (label.length >= 12) {
    return "text-[0.9rem] md:text-[0.96rem] xl:text-[1.02rem]";
  }

  return "text-[1.08rem] md:text-[1.14rem] xl:text-[1.2rem]";
}

export function FeaturedMarketPanel({
  markets,
  viewerAuthStatus,
}: FeaturedMarketPanelProps) {
  const { openForecastOrder } = useForecastOrderDialog();
  const [activeMarketId, setActiveMarketId] = useState(markets[0].id);
  const [isPointerInteracting, setIsPointerInteracting] = useState(false);
  const [isFocusInteracting, setIsFocusInteracting] = useState(false);

  const isPaused = isPointerInteracting || isFocusInteracting;
  const activeIndex = resolveMarketIndex(markets, activeMarketId);
  const activeMarket = markets[activeIndex] ?? markets[0];

  const showAdjacentMarket = (direction: -1 | 1) => {
    if (markets.length < 2) {
      return;
    }

    setActiveMarketId(
      (currentMarketId) =>
        getAdjacentMarketId(markets, currentMarketId, direction) ??
        markets[0].id,
    );
  };

  const rotateMarkets = useEffectEvent(() => {
    showAdjacentMarket(1);
  });

  useEffect(() => {
    if (isPaused || markets.length < 2) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      rotateMarkets();
    }, AUTO_ROTATE_INTERVAL_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [activeMarketId, isPaused, markets.length]);

  const liveMarket = useFeaturedMarketLive(activeMarket);
  const liveOutcomes = liveMarket.outcomes;
  const headlineOutcome =
    liveOutcomes.find(
      (outcome) => outcome.id === activeMarket.headlineOutcomeId,
    ) ?? liveOutcomes[0];
  const contrastingOutcome =
    liveOutcomes[liveOutcomes.length - 1] ?? liveOutcomes[1];
  const voteOptions = [headlineOutcome, contrastingOutcome].filter(
    (outcome, index, outcomes) =>
      outcome &&
      outcomes.findIndex((item) => item?.id === outcome.id) === index,
  );
  const shouldShowContextCards = voteOptions.length === liveOutcomes.length;
  const marketOverviewCards = [
    {
      id: "market-participants",
      label: "Participantes",
      value: formatParticipantCount(activeMarket.participantCount),
      detail: activeMarket.resolutionLabel,
    },
    {
      id: "market-volume",
      label: "Volume",
      value: activeMarket.volumeLabel,
    },
  ];

  return (
    <section
      className="relative h-full"
      onMouseEnter={() => setIsPointerInteracting(true)}
      onMouseLeave={() => setIsPointerInteracting(false)}
      onTouchStart={() => setIsPointerInteracting(true)}
      onTouchEnd={() => setIsPointerInteracting(false)}
      onTouchCancel={() => setIsPointerInteracting(false)}
      onFocusCapture={() => setIsFocusInteracting(true)}
      onBlurCapture={(event) => {
        const nextFocusedElement = event.relatedTarget;

        if (
          nextFocusedElement instanceof Node &&
          event.currentTarget.contains(nextFocusedElement)
        ) {
          return;
        }

        setIsFocusInteracting(false);
      }}
    >
      <div className="pointer-events-none absolute inset-x-10 -top-5 h-28 rounded-full bg-primary/12 blur-3xl" />

      <div className="h-full rounded-[32px] bg-[linear-gradient(135deg,rgba(95,167,255,0.34),rgba(255,255,255,0.08)_34%,rgba(255,255,255,0.04)_66%,rgba(95,167,255,0.18))] p-px shadow-[0_34px_90px_-42px_rgba(95,167,255,0.24)]">
        <Card className="code-surface surface-noise relative h-full overflow-hidden rounded-[31px] border-transparent bg-market-surface/96 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-[linear-gradient(180deg,rgba(95,167,255,0.10),transparent)]" />

          <CardContent className="relative flex h-full flex-col p-3.5 md:p-3.5 xl:p-4">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
              <div className="flex min-w-0 items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-(--market-positive)/20 bg-(--market-positive)/12 text-market-positive shadow-lg shadow-(color:--market-positive)/8 text-sm font-semibold tracking-[0.18em]">
                  {activeMarket.iconLabel}
                </div>

                <div className="min-w-0">
                  <h1 className="line-clamp-2 min-h-[3.4rem] max-w-3xl text-[1.34rem] font-semibold leading-[1.18] tracking-tight text-balance text-white md:min-h-[3.9rem] md:text-[1.56rem] xl:text-[1.68rem]">
                    {activeMarket.title}
                  </h1>
                </div>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-2">
                {markets.length > 1 ? (
                  <div className="flex items-center justify-end gap-2">
                    <span className="inline-flex min-w-16 items-center justify-center rounded-full border border-white/8 bg-white/4 px-3 py-1 text-[11px] font-medium tracking-[0.18em] text-white/54">
                      {String(activeIndex + 1).padStart(2, "0")}/
                      {String(markets.length).padStart(2, "0")}
                    </span>
                    <button
                      type="button"
                      onClick={() => showAdjacentMarket(-1)}
                      aria-label="Mostrar mercado anterior"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/4 text-white/72 transition-colors hover:bg-white/8 hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => showAdjacentMarket(1)}
                      aria-label="Mostrar proximo mercado"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/4 text-white/72 transition-colors hover:bg-white/8 hover:text-white"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-3.5 grid gap-3.5 xl:min-h-0 xl:flex-1 xl:grid-cols-[248px_minmax(0,1fr)] xl:items-stretch">
              <div className="flex h-full flex-col gap-2">
                {shouldShowContextCards
                  ? marketOverviewCards.map((card) => (
                      <div
                        key={card.id}
                        className="rounded-[20px] border border-white/8 bg-white/4 px-4 py-3"
                      >
                        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/38">
                          {card.label}
                        </p>
                        <p className="mt-2 text-sm font-semibold leading-5 text-white">
                          {card.value}
                        </p>
                      </div>
                    ))
                  : liveOutcomes.map((outcome) => {
                      const toneUi = getToneUi(outcome.tone);
                      const isHeadlineOutcome =
                        outcome.id === headlineOutcome.id;

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
                    </div>
                  </div>

                  <div className="relative mt-3.5 grid flex-1 auto-rows-fr gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
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
                        <button
                          key={outcome.id}
                          type="button"
                          onClick={() => {
                            openForecastOrder({
                              marketId: activeMarket.id,
                              viewerAuthStatus,
                              initialMode: "entry",
                              initialPosition: outcome.id as "yes" | "no",
                              executionRedirectRoute: null,
                            });
                          }}
                          className={`group relative flex min-h-24 min-w-0 cursor-pointer items-center overflow-hidden rounded-[22px] border px-5 py-3 transition-all duration-200 hover:-translate-y-px focus-visible:border-primary/35 focus-visible:ring-primary/25 ${voteOptionClassName}`}
                        >
                          <span className="pointer-events-none absolute inset-x-3 top-0 h-px bg-white/10" />

                          <div className="relative flex w-full items-center justify-between gap-4">
                            <span
                              className={`block min-w-0 flex-1 whitespace-nowrap text-center font-semibold leading-tight tracking-tight ${resolveDecisionLabelClassName(outcome.label)} ${toneUi.text}`}
                            >
                              {outcome.label}
                            </span>

                            <span
                              className={`shrink-0 text-[2.15rem] font-semibold tracking-tight ${toneUi.text}`}
                            >
                              {formatProbability(outcome.probability)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex h-full min-h-0 flex-col gap-2.5">
                <div className="flex h-full min-h-72 flex-1 flex-col rounded-[22px] border border-white/7 bg-(--market-panel)/74 p-2.5 shadow-xl shadow-black/20 md:min-h-80 md:p-3 xl:min-h-0">
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

                  <div className="flex-1 min-h-64 sm:min-h-72 xl:min-h-0">
                    <FeaturedMarketChart
                      outcomes={liveOutcomes}
                      points={liveMarket.points}
                      yAxisTicks={activeMarket.chart.yAxisTicks}
                      headlineOutcomeId={activeMarket.headlineOutcomeId}
                      height="100%"
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
