"use client";

import { useDeferredValue, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useHomeFeed } from "@/features/home/hooks/use-home-feed";

import { DashboardHeader } from "./dashboard-header";
import { FeaturedMarketPanel } from "./featured-market-panel";
import { HomeDashboardSkeleton } from "./home-dashboard-skeleton";
import { MarketsGrid } from "./markets-grid";
import { SidebarPanel } from "./sidebar-panel";

export function HomeDashboard() {
  const { data, error, reload, status } = useHomeFeed();
  const [activeTab, setActiveTab] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  if (!data && status === "loading") {
    return <HomeDashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background px-6 py-20 text-foreground">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-4 rounded-[32px] border border-white/7 bg-[color:var(--market-surface)]/94 p-8 text-center shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
          <Badge className="rounded-full border-[color:var(--market-negative)]/20 bg-[color:var(--market-negative)]/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-[color:var(--market-negative)] hover:bg-[color:var(--market-negative)]/12">
            Home feed unavailable
          </Badge>
          <AlertTriangle className="h-10 w-10 text-[color:var(--market-negative)]" />
          <h1 className="text-3xl font-semibold tracking-tight text-white">
            A primeira home do sistema nao conseguiu carregar.
          </h1>
          <p className="text-sm leading-7 text-white/48">
            {error ??
              "O endpoint interno nao respondeu com um snapshot valido do feed demo."}
          </p>
          <Button onClick={reload} className="rounded-full px-6">
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const { navigation, featuredMarket, sidebar, openMarkets } = data.data;
  const resolvedActiveTab =
    openMarkets.tabs.find((tab) => tab.label === activeTab)?.label ??
    openMarkets.tabs[0]?.label ??
    "All";
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredMarkets = openMarkets.items.filter((market) => {
    const matchesTab =
      resolvedActiveTab === "All" || market.tags.includes(resolvedActiveTab);
    const searchTarget = [
      market.title,
      market.subtitle,
      market.volumeLabel,
      market.movementLabel,
      ...market.tags,
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch =
      normalizedSearch.length === 0 || searchTarget.includes(normalizedSearch);

    return matchesTab && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <DashboardHeader
        navigation={navigation}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        authStatus={data.meta.auth.status}
      />

      <main className="relative mx-auto flex w-full max-w-[1360px] flex-col gap-8 px-4 pb-10 pt-6 md:px-6 lg:px-8">
        <div className="texture-grid pointer-events-none absolute inset-x-4 top-0 h-72 opacity-30 md:inset-x-6 lg:inset-x-8" />

        <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <FeaturedMarketPanel market={featuredMarket} />
          <SidebarPanel sidebar={sidebar} />
        </div>

        <MarketsGrid
          title={openMarkets.title}
          tabs={openMarkets.tabs}
          markets={filteredMarkets}
          activeTab={resolvedActiveTab}
          onTabChange={setActiveTab}
          searchQuery={searchQuery}
          hasActiveSearch={normalizedSearch.length > 0}
        />

        {status === "error" && error ? (
          <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--market-warning)]/18 bg-[color:var(--market-warning)]/10 px-4 py-3 text-sm text-[color:var(--market-warning)]">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Mostrando o ultimo snapshot valido enquanto o endpoint se
              recupera.
            </span>
          </div>
        ) : null}
      </main>
    </div>
  );
}
