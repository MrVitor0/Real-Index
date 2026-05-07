import { Bookmark, ChevronLeft, ChevronRight, Link2 } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { FeaturedMarket } from "@/features/home/contracts/home-feed";
import {
  formatProbability,
  formatSignedDelta,
  getInitials,
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
    <section className="space-y-4">
      <Card className="surface-noise overflow-hidden border-white/7 bg-[color:var(--market-surface)]/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
        <CardContent className="p-5 md:p-6 xl:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
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
                <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-balance text-white md:text-[2.15rem]">
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

          <div className="mt-8 grid gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/7 bg-[color:var(--market-panel)]/74 p-5 shadow-xl shadow-black/20">
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-white/38">
                  Headline probability
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
                        <span className="text-sm font-medium text-white/82">
                          {outcome.label}
                        </span>
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

              <Separator className="bg-white/8" />

              <div className="space-y-4">
                {market.comments.map((comment) => {
                  const toneUi = getToneUi(comment.tone);

                  return (
                    <div key={comment.id} className="flex items-start gap-3">
                      <Avatar size="sm" className="ring-1 ring-white/8">
                        <AvatarFallback
                          className={`${toneUi.avatar} text-xs font-semibold`}
                        >
                          {getInitials(comment.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-white/82">
                          {comment.name}
                        </p>
                        <p className="text-sm leading-6 text-white/46">
                          {comment.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-sm font-medium text-white/36">
                {market.volumeLabel}
              </p>
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
                <FeaturedMarketChart
                  outcomes={market.outcomes}
                  points={market.chart.points}
                  yAxisTicks={market.chart.yAxisTicks}
                  headlineOutcomeId={market.headlineOutcomeId}
                />

                <div className="mt-4 flex items-center justify-between gap-3 text-sm text-white/38">
                  <span>{market.resolutionLabel}</span>
                  <span>REAL Index</span>
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
              className="h-11 rounded-full border border-white/8 bg-white/4 px-4 text-sm font-medium text-white/72 hover:bg-white/8 hover:text-white"
            >
              {relatedMarket.label}
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
