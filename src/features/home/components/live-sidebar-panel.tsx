"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import type { Route } from "next";
import { Activity, Trophy } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ParticipantRankingItem } from "@/features/home/contracts/participant-ranking";
import type { RecentActivityItem } from "@/features/home/contracts/recent-activity";
import { useParticipantRanking } from "@/features/home/hooks/use-participant-ranking";
import { useRecentActivity } from "@/features/home/hooks/use-recent-activity";
import { getInitials, getToneUi } from "@/features/home/lib/presentation";
import { cn } from "@/lib/utils";

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

function RankingCard({
  items,
  status,
}: {
  items: ParticipantRankingItem[];
  status: "loading" | "success" | "error";
}) {
  const statusLabel =
    status === "success" ? "live" : status === "error" ? "offline" : "sync";
  const champion = items[0] ?? null;
  const contenders = items.slice(1, 3);
  const championScore = champion?.totalEquityCredits ?? 0;

  return (
    <Card className="code-surface surface-noise border-white/7 bg-market-surface/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
      <CardHeader className="px-4 pb-2.5 pt-3.5">
        <CardTitle className="flex items-center justify-between gap-3 text-white">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[color:var(--market-warning)]/20 bg-[color:var(--market-warning)]/12 text-[color:var(--market-warning)]">
              <Trophy className="h-4.5 w-4.5" />
            </span>
            <div>
              <p className="text-base font-semibold">Ranking live</p>
              <p className="text-xs font-normal tracking-[0.16em] text-white/34 uppercase">
                top 3 da rodada
              </p>
            </div>
          </div>

          <span className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">
            {statusLabel}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-3 px-4 pb-4 pt-0">
        {champion ? (
          <div className="rounded-[24px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.03))] p-4 shadow-[0_20px_60px_-40px_rgba(255,205,82,0.45)]">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[color:var(--market-warning)]/22 bg-[color:var(--market-warning)]/14 text-lg font-semibold text-[color:var(--market-warning)]">
                  1
                </div>

                <Avatar
                  size="lg"
                  className="border border-white/8 bg-white/6 shadow-lg shadow-black/20"
                >
                  <AvatarImage
                    src={champion.avatarUrl ?? undefined}
                    alt={champion.displayName}
                  />
                  <AvatarFallback className="bg-white/10 font-semibold text-white">
                    {getInitials(champion.displayName)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-white">
                    {champion.displayName}
                  </p>
                  <p className="truncate text-xs uppercase tracking-[0.16em] text-white/34">
                    @{champion.username}
                  </p>
                </div>
              </div>

              <span className="rounded-full border border-[color:var(--market-warning)]/22 bg-[color:var(--market-warning)]/12 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--market-warning)]">
                lider
              </span>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">
                  patrimonio total
                </p>
                <p className="mt-1 text-[1.9rem] font-semibold tracking-tight text-white">
                  {champion.totalEquityLabel}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-white/54">
                <div className="rounded-[18px] border border-white/8 bg-white/4 px-3 py-2.5">
                  <p className="uppercase tracking-[0.16em] text-white/28">
                    delta
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {champion.realizedDeltaLabel}
                  </p>
                </div>
                <div className="rounded-[18px] border border-white/8 bg-white/4 px-3 py-2.5">
                  <p className="uppercase tracking-[0.16em] text-white/28">
                    posicoes
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {champion.openPositions}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : status === "loading" ? (
          <div className="space-y-3">
            <Skeleton className="h-40 rounded-[24px] bg-white/6" />
          </div>
        ) : (
          <div className="rounded-[24px] border border-white/8 bg-white/4 px-4 py-8 text-center text-sm text-white/54">
            Ainda nao existe um top 3 para exibir.
          </div>
        )}

        <div className="grid gap-2.5">
          {contenders.length > 0
            ? contenders.map((item) => {
                const toneUi = getToneUi(getLeaderboardTone(item.rank));
                const progressWidth =
                  championScore > 0
                    ? `${Math.max((item.totalEquityCredits / championScore) * 100, 14)}%`
                    : "0%";

                return (
                  <div
                    key={item.profileId}
                    className="rounded-[20px] border border-white/8 bg-white/4 px-3.5 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-[16px] border text-sm font-semibold",
                          toneUi.soft,
                        )}
                      >
                        {item.rank}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-white">
                              {item.displayName}
                            </p>
                            <p className="truncate text-[11px] uppercase tracking-[0.16em] text-white/30">
                              @{item.username}
                            </p>
                          </div>

                          <p className="text-sm font-semibold text-white">
                            {item.totalEquityLabel}
                          </p>
                        </div>

                        <div className="mt-2 h-1.5 rounded-full bg-white/6">
                          <div
                            className={cn("h-full rounded-full", toneUi.dot)}
                            style={{ width: progressWidth }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
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

function ActivityFeedCard({
  items,
  status,
}: {
  items: RecentActivityItem[];
  status: "loading" | "success" | "error";
}) {
  const statusLabel =
    status === "success" ? "live" : status === "error" ? "offline" : "sync";
  const hasLoop = items.length > 1;
  const trackItems = hasLoop ? [...items, ...items] : items;

  return (
    <Card className="code-surface border-white/7 bg-market-surface/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
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

      <CardContent className="px-4 pb-4 pt-0">
        {trackItems.length > 0 ? (
          <div className="live-activity-shell relative h-[22rem] overflow-hidden rounded-[24px] border border-white/8 bg-white/3 p-3">
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-[color:var(--market-surface)] via-[color:var(--market-surface)]/84 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-[color:var(--market-surface)] via-[color:var(--market-surface)]/84 to-transparent" />

            <div
              className={cn(
                "flex flex-col gap-3",
                hasLoop ? "live-activity-track" : null,
              )}
              style={{ "--activity-gap": "0.75rem" } as CSSProperties}
            >
              {trackItems.map((item, index) => {
                const toneUi = getToneUi(getActivityTone(item.group));
                const marketHref = item.market
                  ? (`/radar/${item.market.slug}` as Route)
                  : null;

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
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton
                key={index}
                className="h-28 rounded-[20px] bg-white/6"
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[24px] border border-white/8 bg-white/4 px-4 py-8 text-center text-sm text-white/54">
            O feed live ainda nao recebeu os primeiros eventos.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function LiveSidebarPanel() {
  const rankingState = useParticipantRanking(3);
  const activityState = useRecentActivity(3);
  const rankingItems = rankingState.data?.data.items.slice(0, 3) ?? [];
  const activityItems = activityState.data?.data.items.slice(0, 3) ?? [];

  return (
    <aside className="grid gap-3.5">
      <RankingCard items={rankingItems} status={rankingState.status} />
      <ActivityFeedCard items={activityItems} status={activityState.status} />
    </aside>
  );
}
