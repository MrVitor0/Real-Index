"use client";

import { useDeferredValue, useState } from "react";
import { AlertTriangle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import type { FeaturedMarket } from "@/features/home/contracts/home-feed";
import { useHomeLiveSnapshot } from "@/features/home/hooks/use-home-live-snapshot";

import { DashboardHeader } from "./dashboard-header";
import { FeaturedMarketPanel } from "./featured-market-panel";
import { HomeFooter } from "./home-footer";
import { HomeDashboardSkeleton } from "./home-dashboard-skeleton";
import { LiveSidebarPanel } from "./live-sidebar-panel";
import { MarketsGrid } from "./markets-grid";
import { SidebarPanel } from "./sidebar-panel";

type HomeDashboardProps = {
  authEnabled: boolean;
};

export function HomeDashboard({ authEnabled }: HomeDashboardProps) {
  const { data, error, reload, status } = useHomeLiveSnapshot();
  const [activeTab, setActiveTab] = useState("Tudo");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);

  if (!data && status === "loading") {
    return <HomeDashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
        <div className="texture-grid pointer-events-none absolute inset-0 opacity-25" />

        <main className="relative flex flex-1 items-center px-6 py-20">
          <div className="surface-noise mx-auto flex max-w-xl flex-col items-center gap-4 rounded-[32px] border border-white/7 bg-market-surface/94 p-8 text-center shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
            <Badge className="rounded-full border-(--market-negative)/20 bg-(--market-negative)/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-market-negative hover:bg-(--market-negative)/12">
              Painel inicial indisponivel
            </Badge>
            <AlertTriangle className="h-10 w-10 text-market-negative" />
            <h1 className="text-3xl font-semibold tracking-tight text-white">
              O Real Index não conseguiu carregar.
            </h1>
            <p className="text-sm leading-7 text-white/48">
              {error ??
                "O endpoint interno não respondeu com um estado válido do painel de exemplo."}
            </p>
            <Button onClick={reload} className="rounded-full px-6">
              Tentar novamente
            </Button>
          </div>
        </main>

        <HomeFooter />
      </div>
    );
  }

  const {
    homeFeed,
    ranking,
    recentActivity,
    communityMetrics,
    navbarBalance,
    marketplaceRewards,
  } = data.data;
  const viewerAuthStatus = data.meta.auth.status;
  const { navigation, featuredMarket, featuredMarkets, openMarkets } = homeFeed;
  const heroMarkets = (
    featuredMarkets.length > 0 ? featuredMarkets : [featuredMarket]
  ) as [FeaturedMarket, ...FeaturedMarket[]];
  const baseTabLabel = openMarkets.tabs[0]?.label ?? "Tudo";
  const resolvedActiveTab =
    openMarkets.tabs.find((tab) => tab.label === activeTab)?.label ??
    openMarkets.tabs[0]?.label ??
    baseTabLabel;
  const normalizedSearch = deferredSearch.trim().toLowerCase();
  const filteredMarkets = openMarkets.items.filter((market) => {
    const matchesTab =
      resolvedActiveTab === baseTabLabel ||
      market.tags.includes(resolvedActiveTab);
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
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
      <div className="texture-grid pointer-events-none absolute inset-0 opacity-25" />

      <DashboardHeader
        navigation={navigation}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        authEnabled={authEnabled}
        authStatus={viewerAuthStatus}
        initialBalance={null}
        liveBalanceState={{
          balance: navbarBalance,
          status,
        }}
      />

      <main className="relative mx-auto flex w-full max-w-470 flex-1 flex-col gap-6 px-4 pb-10 pt-5 md:px-6 lg:px-8">
        <section className="grid gap-6 xl:grid-cols-[minmax(270px,0.66fr)_minmax(0,2.24fr)_19rem] xl:items-stretch">
          <div className="order-2 min-w-0 xl:order-1 xl:self-stretch">
            <div className="h-full min-w-0 xl:sticky xl:top-24">
              <LiveSidebarPanel
                showActivity={false}
                className="h-full"
                rankingClassName="max-w-none"
                liveData={{
                  rankingItems: ranking.items.slice(0, 3),
                  rankingStatus: status,
                  activityItems: recentActivity.items.slice(0, 3),
                  activityStatus: status,
                  marketplaceRewards,
                }}
              />
            </div>
          </div>

          <div className="order-1 min-w-0 xl:order-2 xl:self-stretch">
            <FeaturedMarketPanel
              markets={heroMarkets}
              viewerAuthStatus={viewerAuthStatus}
            />
          </div>

          <div className="order-3 min-w-0 xl:self-stretch">
            <div className="h-full min-w-0 xl:sticky xl:top-24">
              <SidebarPanel
                liveData={{
                  activityItems: recentActivity.items.slice(0, 3),
                  activityStatus: status,
                  metricItems: communityMetrics.items,
                  metricsStatus: status,
                  metricsTitle: communityMetrics.title,
                }}
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <MarketsGrid
            tabs={openMarkets.tabs}
            markets={filteredMarkets}
            activeTab={resolvedActiveTab}
            viewerAuthStatus={viewerAuthStatus}
            onTabChange={setActiveTab}
          />

          {status === "error" && error ? (
            <div className="flex items-center gap-3 rounded-2xl border border-market-warning/18 bg-market-warning/10 px-4 py-3 text-sm text-market-warning">
              <AlertTriangle className="h-4 w-4" />
              <span>
                Mostrando o ultimo snapshot valido enquanto o endpoint se
                recupera.
              </span>
            </div>
          ) : null}
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
