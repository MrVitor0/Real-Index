"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useState, type CSSProperties } from "react";
import type { Route } from "next";
import {
  Activity,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Gift,
  Trophy,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ParticipantRankingItem } from "@/features/home/contracts/participant-ranking";
import type { RecentActivityItem } from "@/features/home/contracts/recent-activity";
import { useParticipantRanking } from "@/features/home/hooks/use-participant-ranking";
import { useRecentActivity } from "@/features/home/hooks/use-recent-activity";
import { getToneUi } from "@/features/home/lib/presentation";
import type { MarketplaceReward } from "@/features/marketplace/contracts/marketplace";
import { cn } from "@/lib/utils";

type CardStatus = "loading" | "success" | "error";

type LiveSidebarPanelProps = {
  showActivity?: boolean;
  className?: string;
  rankingClassName?: string;
  activityClassName?: string;
  liveData?: {
    rankingItems: ParticipantRankingItem[];
    rankingStatus: CardStatus;
    activityItems: RecentActivityItem[];
    activityStatus: CardStatus;
    marketplaceRewards?: MarketplaceReward[];
  };
};

type ActivityFeedVariant = "default" | "stream";

const compactChampionCreditsThreshold = 9_999;
const marketplaceRoute = "/marketplace" as Route;
const marketplaceCarouselIntervalMs = 4_500;

function getLeaderboardTone(rank: number) {
  if (rank === 1) {
    return "gold" as const;
  }

  if (rank === 2) {
    return "sky" as const;
  }

  return "mint" as const;
}

function getActivityTone(group: RecentActivityItem["group"]) {
  if (group === "user") {
    return "mint" as const;
  }

  if (group === "market") {
    return "sky" as const;
  }

  return "primary" as const;
}

function formatRelativeTime(value: string) {
  const timestamp = new Date(value);
  const diffInSeconds = Math.round((timestamp.getTime() - Date.now()) / 1000);
  const absoluteSeconds = Math.abs(diffInSeconds);
  const formatter = new Intl.RelativeTimeFormat("pt-BR", {
    numeric: "auto",
  });

  if (absoluteSeconds < 45) {
    return "agora";
  }

  if (absoluteSeconds < 3_600) {
    return formatter.format(Math.round(diffInSeconds / 60), "minute");
  }

  if (absoluteSeconds < 86_400) {
    return formatter.format(Math.round(diffInSeconds / 3_600), "hour");
  }

  return formatter.format(Math.round(diffInSeconds / 86_400), "day");
}

function formatCompactRankingCredits(value: string) {
  return value.replace(/REAL Credits?/i, "R.C");
}

function formatChampionRankingCredits(item: ParticipantRankingItem) {
  if (item.totalEquityCredits <= compactChampionCreditsThreshold) {
    return item.totalEquityLabel;
  }

  return formatCompactRankingCredits(item.totalEquityLabel);
}

function resolveMarketplaceSpotlight(input: {
  leaderAvailableCredits: number;
  rewards: MarketplaceReward[];
}) {
  const activeRewards = input.rewards.filter((reward) => reward.isActive);
  const redeemableRewards = activeRewards.filter(
    (reward) =>
      !reward.isRedeemed && reward.creditCost <= input.leaderAvailableCredits,
  );
  const remainingRewards = activeRewards.filter(
    (reward) =>
      !redeemableRewards.some((candidate) => candidate.id === reward.id),
  );
  const items = [...redeemableRewards, ...remainingRewards];

  return {
    items,
  };
}

function RankingListItem({
  item,
  championScore,
  highlightLeader = false,
}: {
  item: ParticipantRankingItem;
  championScore: number;
  highlightLeader?: boolean;
}) {
  const toneUi = getToneUi(getLeaderboardTone(item.rank));
  const progressWidth =
    championScore > 0
      ? `${Math.max(
          (item.totalEquityCredits / championScore) * 100,
          highlightLeader ? 100 : 14,
        )}%`
      : highlightLeader
        ? "100%"
        : "0%";
  const valueLabel = highlightLeader
    ? formatChampionRankingCredits(item)
    : formatCompactRankingCredits(item.totalEquityLabel);

  return (
    <div
      className={cn(
        "rounded-[20px] border px-3.5 py-3",
        highlightLeader
          ? "border-market-warning/18 bg-[linear-gradient(180deg,rgba(255,214,102,0.10),rgba(255,255,255,0.03))]"
          : "border-white/8 bg-white/4",
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] border text-sm font-semibold",
            highlightLeader
              ? "border-market-warning/22 bg-market-warning/14 text-market-warning"
              : toneUi.soft,
          )}
        >
          {item.rank}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-white">
                  {item.displayName}
                </p>
                {highlightLeader ? (
                  <span className="shrink-0 rounded-full border border-market-warning/20 bg-market-warning/12 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-market-warning">
                    lider
                  </span>
                ) : null}
              </div>
              <p className="truncate text-[11px] uppercase tracking-[0.16em] text-white/30">
                @{item.username}
              </p>
            </div>

            <p
              className={cn(
                "shrink-0 whitespace-nowrap font-semibold text-white",
                highlightLeader ? "text-[0.82rem]" : "text-sm",
              )}
            >
              {valueLabel}
            </p>
          </div>

          <div className="mt-2 h-1.5 rounded-full bg-white/6">
            <div
              className={cn(
                "h-full rounded-full",
                highlightLeader ? "bg-market-warning" : toneUi.dot,
              )}
              style={{ width: progressWidth }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function MarketplaceSpotlightCard({
  leader,
  rewards,
}: {
  leader: ParticipantRankingItem;
  rewards: MarketplaceReward[];
}) {
  const spotlight = resolveMarketplaceSpotlight({
    leaderAvailableCredits: leader.availableCredits,
    rewards,
  });
  const spotlightItems = spotlight.items;
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const resolvedActiveItemIndex =
    spotlightItems.length > 0 ? activeItemIndex % spotlightItems.length : 0;
  const activeItem = spotlightItems[resolvedActiveItemIndex] ?? null;

  const moveToItem = (direction: -1 | 1) => {
    if (spotlightItems.length < 2) {
      return;
    }

    setActiveItemIndex((currentIndex) => {
      const nextIndex =
        (currentIndex + direction + spotlightItems.length) %
        spotlightItems.length;

      return nextIndex;
    });
  };

  const rotateItems = useEffectEvent(() => {
    moveToItem(1);
  });

  useEffect(() => {
    if (spotlightItems.length < 2) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      rotateItems();
    }, marketplaceCarouselIntervalMs);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [resolvedActiveItemIndex, spotlightItems.length]);

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-sky-400/16 bg-[linear-gradient(180deg,rgba(56,189,248,0.14),rgba(255,255,255,0.04))] shadow-[0_26px_70px_-46px_rgba(56,189,248,0.45)]">
      {activeItem ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-24"
          style={{ backgroundImage: `url("${activeItem.backgroundImageUrl}")` }}
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,10,19,0.18),rgba(6,10,19,0.92)_48%,rgba(6,10,19,0.98)_100%)]" />

      <div className="relative space-y-3 p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-100">
              <Gift className="h-3.5 w-3.5" />
              marketplace
            </span>
            {activeItem ? (
              <p className="mt-3 text-sm font-semibold text-white">
                {activeItem.title}
              </p>
            ) : null}
            <p className="mt-1 truncate font-mono text-[10px] uppercase tracking-[0.18em] text-white/34">
              Visite o marketplace
            </p>
          </div>

          {spotlightItems.length > 1 ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => moveToItem(-1)}
                aria-label="Mostrar item anterior do marketplace"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => moveToItem(1)}
                aria-label="Mostrar proximo item do marketplace"
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ) : null}
        </div>

        {activeItem ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <p className="line-clamp-2 min-w-0 text-sm leading-5 text-white/62">
                {activeItem.subtitle}
              </p>

              <span className="shrink-0 rounded-full border border-white/10 bg-white/8 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
                {formatCompactRankingCredits(activeItem.creditCostLabel)}
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-[18px] border border-dashed border-white/12 bg-white/3 px-3 py-4 text-sm leading-6 text-white/54">
            O marketplace ainda nao tem perks suficientes para montar esta
            vitrine.
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            {spotlightItems.length > 1 ? (
              spotlightItems.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveItemIndex(index)}
                  aria-label={`Mostrar item ${index + 1} do marketplace`}
                  className={cn(
                    "h-2 rounded-full transition-all",
                    index === resolvedActiveItemIndex
                      ? "w-6 bg-sky-300"
                      : "w-2 bg-white/22 hover:bg-white/40",
                  )}
                />
              ))
            ) : (
              <span className="text-[10px] uppercase tracking-[0.16em] text-white/28">
                cta live
              </span>
            )}
          </div>

          <Link
            href={marketplaceRoute}
            className="inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/12 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100 transition-colors hover:bg-sky-400/18"
          >
            abrir marketplace
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function RankingCard({
  items,
  status,
  className,
}: {
  items: ParticipantRankingItem[];
  status: CardStatus;
  className?: string;
}) {
  const statusLabel =
    status === "success" ? "live" : status === "error" ? "offline" : "sync";
  const champion = items[0] ?? null;
  const contenders = items.slice(1, 3);
  const championScore = champion?.totalEquityCredits ?? 0;

  return (
    <Card
      className={cn(
        "code-surface surface-noise flex h-full flex-col border-white/7 bg-market-surface/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]",
        className,
      )}
    >
      <CardHeader className="px-4 pb-2.5 pt-3.5">
        <CardTitle className="flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-market-warning/20 bg-market-warning/12 text-market-warning">
              <Trophy className="h-4.5 w-4.5" />
            </span>
            <p className="text-base font-semibold">Ranking live</p>
          </div>

          <span className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">
            {statusLabel}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 px-4 pb-4 pt-0">
        {champion ? (
          <RankingListItem
            item={champion}
            championScore={championScore}
            highlightLeader
          />
        ) : status === "loading" ? (
          <div className="space-y-3">
            <Skeleton className="h-21 rounded-[20px] bg-white/6" />
          </div>
        ) : (
          <div className="rounded-[24px] border border-white/8 bg-white/4 px-4 py-8 text-center text-sm text-white/54">
            Ainda nao existe um top 3 para exibir.
          </div>
        )}

        <div className="mt-auto grid gap-2.5">
          {contenders.length > 0
            ? contenders.map((item) => (
                <RankingListItem
                  key={item.profileId}
                  item={item}
                  championScore={championScore}
                />
              ))
            : champion && status !== "loading"
              ? null
              : status === "loading"
                ? Array.from({ length: 2 }).map((_, index) => (
                    <Skeleton
                      key={index}
                      className="h-21 rounded-[20px] bg-white/6"
                    />
                  ))
                : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function ActivityFeedCard({
  items,
  status,
  className,
  variant = "default",
}: {
  items: RecentActivityItem[];
  status: CardStatus;
  className?: string;
  variant?: ActivityFeedVariant;
}) {
  const statusLabel =
    status === "success" ? "live" : status === "error" ? "offline" : "sync";
  const hasLoop = items.length > 1;
  const trackItems = hasLoop ? [...items, ...items] : items;
  const isStreamVariant = variant === "stream";
  const viewportClassName = cn(
    "live-activity-shell relative overflow-hidden rounded-[24px] border border-white/8 bg-white/3",
    isStreamVariant ? "h-[13.25rem] p-2.5" : "h-[17.5rem] p-3",
    className,
  );

  const activityViewport =
    trackItems.length > 0 ? (
      <div className={viewportClassName}>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-10 bg-linear-to-b from-market-surface via-(--market-surface)/84 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-linear-to-t from-market-surface via-(--market-surface)/84 to-transparent" />

        <div
          className={cn(
            "flex flex-col",
            hasLoop ? "live-activity-track" : null,
            isStreamVariant ? "gap-2.5" : "gap-3",
          )}
          style={
            {
              "--activity-gap": isStreamVariant ? "0.625rem" : "0.75rem",
            } as CSSProperties
          }
        >
          {trackItems.map((item, index) => {
            const toneUi = getToneUi(getActivityTone(item.group));
            const marketHref = item.market
              ? (`/radar/${item.market.slug}` as Route)
              : null;

            if (isStreamVariant) {
              return (
                <div
                  key={`${item.id}-${index}`}
                  className="rounded-[18px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/30">
                        <span
                          className={cn("h-1.5 w-1.5 rounded-full", toneUi.dot)}
                        />
                        <span className="truncate">{item.typeLabel}</span>
                      </div>

                      <p className="mt-2 line-clamp-2 text-sm font-semibold leading-5 text-white">
                        {item.headline}
                      </p>

                      <div className="mt-2 flex items-center gap-2 text-[11px] text-white/42">
                        <span className="truncate">
                          {item.actor.displayName}
                        </span>
                        {item.market ? (
                          <>
                            <span className="h-1 w-1 rounded-full bg-white/18" />
                            <span className="truncate">
                              {item.market.title}
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <span className="shrink-0 pt-0.5 text-[10px] uppercase tracking-[0.18em] text-white/28">
                      {formatRelativeTime(item.createdAt)}
                    </span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={`${item.id}-${index}`}
                className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-3.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]",
                      toneUi.soft,
                    )}
                  >
                    <span
                      className={cn("h-1.5 w-1.5 rounded-full", toneUi.dot)}
                    />
                    {item.typeLabel}
                  </span>

                  <span className="text-[11px] uppercase tracking-[0.16em] text-white/30">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                <p className="mt-3 text-sm font-semibold leading-5 text-white">
                  {item.headline}
                </p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/50">
                  {item.description}
                </p>

                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-white/42">
                  <span className="truncate">{item.actor.displayName}</span>

                  {marketHref ? (
                    <Link
                      href={marketHref}
                      className="shrink-0 rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/62 transition-colors hover:bg-white/8 hover:text-white"
                    >
                      abrir radar
                    </Link>
                  ) : (
                    <span className="shrink-0 rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
                      comunidade
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    ) : status === "loading" ? (
      <div className={viewportClassName}>
        <div className="grid gap-2.5">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={index}
              className={cn(
                "rounded-[20px] bg-white/6",
                isStreamVariant ? "h-20" : "h-28",
              )}
            />
          ))}
        </div>
      </div>
    ) : (
      <div className={viewportClassName}>
        <div className="flex h-full items-center justify-center rounded-[20px] border border-white/8 bg-white/4 px-4 text-center text-sm text-white/54">
          O feed live ainda nao recebeu os primeiros eventos.
        </div>
      </div>
    );

  if (isStreamVariant) {
    return activityViewport;
  }

  return (
    <Card
      className={cn(
        "code-surface border-white/7 bg-market-surface/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]",
        className,
      )}
    >
      <CardHeader className="px-4 pb-2.5 pt-3.5">
        <CardTitle className="flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-primary/20 bg-primary/12 text-primary">
              <Activity className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-base font-semibold">Pulso live</p>
              <p className="text-xs font-normal tracking-[0.16em] text-white/34 uppercase">
                eventos recentes
              </p>
            </div>
          </div>

          <span className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">
            {statusLabel}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">{activityViewport}</CardContent>
    </Card>
  );
}

function LiveSidebarPanelContent({
  showActivity = true,
  className,
  rankingClassName,
  activityClassName,
  rankingItems,
  rankingStatus,
  activityItems,
  activityStatus,
  marketplaceRewards = [],
}: {
  showActivity: boolean;
  className?: string;
  rankingClassName?: string;
  activityClassName?: string;
  rankingItems: ParticipantRankingItem[];
  rankingStatus: CardStatus;
  activityItems: RecentActivityItem[];
  activityStatus: CardStatus;
  marketplaceRewards?: MarketplaceReward[];
}) {
  const leader = rankingItems[0] ?? null;

  return (
    <aside
      className={cn(
        "grid min-w-0 w-full gap-3.5",
        !showActivity && "xl:h-full xl:grid-rows-[minmax(0,1fr)_auto]",
        className,
      )}
    >
      <div className={cn("min-w-0", !showActivity && "xl:min-h-0")}>
        <RankingCard
          items={rankingItems}
          status={rankingStatus}
          className={cn(!showActivity && "xl:h-full", rankingClassName)}
        />
      </div>
      {leader ? (
        <MarketplaceSpotlightCard
          leader={leader}
          rewards={marketplaceRewards}
        />
      ) : rankingStatus === "loading" ? (
        <Skeleton className="h-47 rounded-[22px] bg-white/6" />
      ) : null}
      {showActivity ? (
        <ActivityFeedCard
          items={activityItems}
          status={activityStatus}
          className={activityClassName}
        />
      ) : null}
    </aside>
  );
}

function PolledLiveSidebarPanel(
  props: Omit<LiveSidebarPanelProps, "liveData">,
) {
  const rankingState = useParticipantRanking(3);
  const activityState = useRecentActivity(3);

  return (
    <LiveSidebarPanelContent
      {...props}
      showActivity={props.showActivity ?? true}
      rankingItems={rankingState.data?.data.items.slice(0, 3) ?? []}
      rankingStatus={rankingState.status}
      activityItems={activityState.data?.data.items.slice(0, 3) ?? []}
      activityStatus={activityState.status}
      marketplaceRewards={[]}
    />
  );
}

export function LiveSidebarPanel({
  liveData,
  ...props
}: LiveSidebarPanelProps) {
  if (!liveData) {
    return <PolledLiveSidebarPanel {...props} />;
  }

  return (
    <LiveSidebarPanelContent
      {...props}
      showActivity={props.showActivity ?? true}
      rankingItems={liveData.rankingItems}
      rankingStatus={liveData.rankingStatus}
      activityItems={liveData.activityItems}
      activityStatus={liveData.activityStatus}
      marketplaceRewards={liveData.marketplaceRewards ?? []}
    />
  );
}
