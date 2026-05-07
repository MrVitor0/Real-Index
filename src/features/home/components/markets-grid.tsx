"use client";

import Link from "next/link";
import type { Route } from "next";
import { Bookmark, Search, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useHorizontalDragScroll } from "@/features/home/hooks/use-horizontal-drag-scroll";
import type {
  MarketCard,
  MarketTab,
} from "@/features/home/contracts/home-feed";
import { formatProbability, getToneUi } from "@/features/home/lib/presentation";
import { cn } from "@/lib/utils";

type MarketsGridProps = {
  title: string;
  tabs: MarketTab[];
  markets: MarketCard[];
  activeTab: string;
  onTabChange: (nextTab: string) => void;
  searchQuery: string;
  hasActiveSearch: boolean;
};

function MarketCardItem({ market }: { market: MarketCard }) {
  const toneUi = getToneUi(market.tone);
  const baseTagLabel = "Tudo";
  const primaryTag =
    market.tags.find((tag) => tag !== baseTagLabel) ??
    market.tags[0] ??
    "Mercado";
  const progressWidth = `${Math.max(market.probability, 6)}%`;
  const marketDetailHref = `/radar/${market.id}` as Route;

  return (
    <Link href={marketDetailHref} className="block h-full">
      <Card className="code-surface group h-full border-white/7 bg-market-surface/94 shadow-[0_24px_80px_-42px_rgba(0,0,0,0.95)] transition-all duration-200 hover:-translate-y-1 hover:border-white/12 hover:shadow-[0_30px_85px_-40px_rgba(0,0,0,0.98)]">
        <CardContent className="flex h-full flex-col gap-4 p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-2xl border text-sm font-semibold tracking-[0.16em] ${toneUi.soft}`}
              >
                {market.iconLabel}
              </div>
              <span className="rounded-full border border-white/8 bg-white/3 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-white/46">
                [{primaryTag}]
              </span>
            </div>

            <div className="text-right">
              <p className="text-2xl font-semibold tracking-tight text-white">
                {formatProbability(market.probability)}
              </p>
              <p className={`text-xs font-medium ${toneUi.text}`}>
                {market.movementLabel}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-base font-semibold leading-6 text-white">
              {market.title}
            </h3>
            <p className="text-sm text-white/45">{market.subtitle}</p>
          </div>

          <div className="mt-auto space-y-2.5">
            <div className="h-1.5 rounded-full bg-white/6">
              <div
                className={`h-full rounded-full ${toneUi.dot}`}
                style={{ width: progressWidth }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div
                className={`rounded-2xl border px-3 py-2 text-center text-sm font-medium ${toneUi.soft}`}
              >
                {market.yesPriceLabel}
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/3 px-3 py-2 text-center text-sm font-medium text-white/76">
                {market.noPriceLabel}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function MarketsGrid({
  title,
  tabs,
  markets,
  activeTab,
  onTabChange,
  searchQuery,
  hasActiveSearch,
}: MarketsGridProps) {
  const { ref: tabsRef, dragScrollProps: tabsDragScrollProps } =
    useHorizontalDragScroll<HTMLDivElement>();
  const accountRoute = "/conta" as Route;

  const focusSearchInput = () => {
    const searchInput = document.getElementById("home-search");

    if (searchInput instanceof HTMLInputElement) {
      searchInput.focus();
      searchInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const focusFilters = () => {
    tabsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <section id="markets" className="space-y-5">
      <div
        ref={tabsRef}
        className="scrollbar-hidden flex gap-2 overflow-x-auto pb-1 select-none"
        {...tabsDragScrollProps}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.label)}
            className={cn(
              "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
              activeTab === tab.label
                ? "border-primary/30 bg-primary/15 text-primary"
                : "border-white/8 bg-white/3 text-white/56 hover:bg-white/6 hover:text-white",
            )}
          >
            <span className="font-mono text-[11px] text-white/34">[</span>
            {tab.label}
            <span className="font-mono text-[11px] text-white/34">]</span>
          </button>
        ))}
      </div>

      {markets.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {markets.map((market) => (
            <MarketCardItem key={market.id} market={market} />
          ))}
        </div>
      ) : (
        <Card className="code-surface border-white/7 bg-market-surface/94">
          <CardContent className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
            <p className="text-lg font-semibold text-white">
              grep retornou 0 linhas.
            </p>
            <p className="max-w-xl text-sm leading-6 text-white/46">
              Tente outra busca ou volte para [Tudo] para inspecionar o recorte
              completo da comunidade dev.
            </p>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
