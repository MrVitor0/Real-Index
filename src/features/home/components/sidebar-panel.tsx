"use client";

import type { CommunityMetricItem } from "@/features/home/contracts/community-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getToneUi } from "@/features/home/lib/presentation";
import { useCommunityMetrics } from "@/features/home/hooks/use-community-metrics";
import { useRecentActivity } from "@/features/home/hooks/use-recent-activity";

import { ActivityFeedCard } from "./live-sidebar-panel";

const fallbackMetrics: CommunityMetricItem[] = [
  {
    id: "community-users",
    label: "Usuarios na comunidade",
    value: 0,
    valueLabel: "--",
    tone: "sky",
  },
  {
    id: "forecasts-made",
    label: "Palpites feitos",
    value: 0,
    valueLabel: "--",
    tone: "mint",
  },
  {
    id: "credits-volume",
    label: "Creditos transacionados",
    value: 0,
    valueLabel: "--",
    tone: "gold",
  },
];

export function SidebarPanel() {
  const { data: metricsData, status: metricsStatus } = useCommunityMetrics();
  const activityState = useRecentActivity(3);
  const activityItems = activityState.data?.data.items.slice(0, 3) ?? [];
  const metricItems = metricsData?.data.items ?? fallbackMetrics;
  const metricsTitle = metricsData?.data.title ?? "Metricas";
  const metricsStatusLabel =
    metricsStatus === "success"
      ? "live"
      : metricsStatus === "error"
        ? "offline"
        : "sync";

  return (
    <aside className="grid w-full gap-3.5 xl:h-full xl:grid-rows-[auto_minmax(0,1fr)]">
      <ActivityFeedCard
        items={activityItems}
        status={activityState.status}
        variant="stream"
      />

      <Card className="code-surface flex flex-col border-white/7 bg-market-surface/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)] xl:h-full xl:min-h-0">
        <CardHeader className="px-4 pb-2 pt-3.5">
          <CardTitle className="flex items-center justify-between text-lg text-white">
            <span>{metricsTitle}</span>
            <span className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">
              {metricsStatusLabel}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-3.5 pt-0 xl:flex-1 xl:min-h-0">
          <div className="grid gap-2.5 xl:h-full xl:auto-rows-fr">
            {metricItems.map((metric) => {
              const toneUi = getToneUi(metric.tone);

              return (
                <div
                  key={metric.id}
                  className="flex items-center justify-between gap-4 rounded-[20px] border border-white/8 bg-white/4 px-4 py-3 xl:h-full"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-white/34">
                      {metric.label}
                    </p>
                  </div>

                  <p
                    className={`text-2xl font-semibold tracking-tight ${toneUi.text}`}
                  >
                    {metric.valueLabel}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
