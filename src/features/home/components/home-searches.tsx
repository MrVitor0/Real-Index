"use client";

import { useState } from "react";
import type { FocusEvent, KeyboardEvent } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import type { MarketCard } from "@/features/home/contracts/home-feed";
import {
  MIN_HOME_SEARCH_QUERY_LENGTH,
  useHomeSearches,
} from "@/features/home/hooks/use-home-searches";
import { formatProbability, getToneUi } from "@/features/home/lib/presentation";
import { cn } from "@/lib/utils";

type HomeSearchesProps = {
  query: string;
  onQueryChange: (value: string) => void;
  placeholder: string;
};

function SearchResultItem({
  market,
  onSelect,
}: {
  market: MarketCard;
  onSelect: () => void;
}) {
  const toneUi = getToneUi(market.tone);
  const marketHref = `/radar/${market.id}` as Route;
  const visibleTags = market.tags.filter((tag) => tag !== "Tudo").slice(0, 3);

  return (
    <Link
      href={marketHref}
      onClick={onSelect}
      className="block rounded-2xl border border-white/8 bg-white/4 px-4 py-3 transition-colors hover:border-white/12 hover:bg-white/8"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border text-sm font-semibold tracking-[0.16em]",
                toneUi.soft,
              )}
            >
              {market.iconLabel}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {market.title}
              </p>
              <p className="truncate text-xs text-white/48">
                {market.subtitle}
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold text-white">
            {formatProbability(market.probability)}
          </p>
          <p className={cn("text-[11px] font-medium", toneUi.text)}>
            {market.movementLabel}
          </p>
        </div>
      </div>

      {visibleTags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visibleTags.map((tag) => (
            <Badge
              key={`${market.id}-${tag}`}
              variant="outline"
              className="border-white/10 bg-white/4 text-[11px] text-white/56"
            >
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </Link>
  );
}

function SearchResultSkeleton() {
  return (
    <div className="rounded-2xl border border-white/8 bg-white/4 px-4 py-3">
      <div className="flex items-start gap-3">
        <Skeleton className="h-10 w-10 rounded-2xl bg-white/8" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3 bg-white/8" />
          <Skeleton className="h-3 w-1/2 bg-white/6" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-12 bg-white/8" />
          <Skeleton className="h-3 w-16 bg-white/6" />
        </div>
      </div>
    </div>
  );
}

export function HomeSearches({
  query,
  onQueryChange,
  placeholder,
}: HomeSearchesProps) {
  const router = useRouter();
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const normalizedQuery = query.trim();
  const { data, error, status } = useHomeSearches(query);
  const results = data?.items ?? [];
  const firstResult = results[0] ?? null;
  const shouldShowPanel = isPanelOpen && normalizedQuery.length > 0;
  const shouldShowHint =
    normalizedQuery.length > 0 &&
    normalizedQuery.length < MIN_HOME_SEARCH_QUERY_LENGTH;

  const handleBlurCapture = (event: FocusEvent<HTMLDivElement>) => {
    const nextTarget = event.relatedTarget;

    if (
      nextTarget instanceof Node &&
      event.currentTarget.contains(nextTarget)
    ) {
      return;
    }

    setIsPanelOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setIsPanelOpen(false);
      event.currentTarget.blur();
      return;
    }

    if (event.key === "Enter" && firstResult) {
      event.preventDefault();
      setIsPanelOpen(false);
      router.push(`/radar/${firstResult.id}` as Route);
    }
  };

  return (
    <div
      className="relative"
      onFocusCapture={() => setIsPanelOpen(true)}
      onBlurCapture={handleBlurCapture}
    >
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />

      <Input
        id="home-search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
        className="h-11 rounded-xl border-white/8 bg-white/5 pl-11 pr-12 text-sm text-white placeholder:text-white/45 focus-visible:border-primary/50 focus-visible:ring-primary/20"
      />

      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium tracking-[0.2em] text-white/28">
        /
      </span>

      {shouldShowPanel ? (
        <div className="absolute inset-x-0 top-[calc(100%+0.75rem)] z-50">
          <Card className="surface-noise border border-white/8 bg-market-panel/98 py-0 text-white shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)] ring-0 backdrop-blur-xl">
            <CardContent className="p-3">
              <div className="mb-3 flex items-center justify-between gap-3 border-b border-white/8 pb-3">
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/40">
                  Searches
                </p>

                {firstResult ? (
                  <p className="inline-flex items-center gap-1 text-[11px] text-white/36">
                    <CornerDownLeft className="h-3.5 w-3.5" />
                    abrir primeiro resultado
                  </p>
                ) : null}
              </div>

              {shouldShowHint ? (
                <p className="px-1 py-2 text-sm leading-6 text-white/52">
                  Digite pelo menos 2 caracteres para buscar mercados, tags ou
                  contexto.
                </p>
              ) : null}

              {status === "loading" && results.length === 0 ? (
                <div className="grid gap-2">
                  <SearchResultSkeleton />
                  <SearchResultSkeleton />
                  <SearchResultSkeleton />
                </div>
              ) : null}

              {status === "loading" && results.length > 0 ? (
                <p className="mb-3 px-1 text-xs text-white/34">
                  Atualizando resultados...
                </p>
              ) : null}

              {status === "error" ? (
                <p className="px-1 py-2 text-sm leading-6 text-market-warning">
                  {error}
                </p>
              ) : null}

              {status !== "loading" &&
              status !== "error" &&
              normalizedQuery.length >= MIN_HOME_SEARCH_QUERY_LENGTH &&
              results.length === 0 ? (
                <p className="px-1 py-2 text-sm leading-6 text-white/52">
                  Nenhum mercado bateu com &quot;{normalizedQuery}&quot;.
                </p>
              ) : null}

              {results.length > 0 ? (
                <div className="grid max-h-96 gap-2 overflow-y-auto">
                  {results.map((market) => (
                    <SearchResultItem
                      key={market.id}
                      market={market}
                      onSelect={() => setIsPanelOpen(false)}
                    />
                  ))}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
