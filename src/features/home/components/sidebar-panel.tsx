"use client";

import Link from "next/link";
import type { Route } from "next";
import { ChevronRight } from "lucide-react";

import type { CommunityMetricItem } from "@/features/home/contracts/community-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HomeSidebar } from "@/features/home/contracts/home-feed";
import {
  formatProbability,
  formatSignedDelta,
  getToneUi,
} from "@/features/home/lib/presentation";
import { useCommunityMetrics } from "@/features/home/hooks/use-community-metrics";

type SidebarPanelProps = {
  sidebar: HomeSidebar;
};

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

export function SidebarPanel({ sidebar }: SidebarPanelProps) {
  const { data: metricsData, status: metricsStatus } = useCommunityMetrics();
  const metricItems = metricsData?.data.items ?? fallbackMetrics;
  const metricsTitle = metricsData?.data.title ?? "Metricas";
  const metricsStatusLabel =
    metricsStatus === "success"
      ? "live"
      : metricsStatus === "error"
        ? "offline"
        : "sync";

  return (
    <aside className="grid gap-3.5 xl:h-full xl:self-stretch xl:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card className="code-surface flex h-full min-h-0 flex-col border-white/7 bg-market-surface/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
        <CardHeader className="px-4 pb-2 pt-3.5">
          <CardTitle className="flex items-center justify-between text-lg text-white">
            <span>{sidebar.breakingTitle}</span>
            <ChevronRight className="h-4 w-4 text-white/36" />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 px-4 pb-3.5 pt-0">
          <div className="divide-y divide-white/6">
            {sidebar.breakingNews.map((item, index) => {
              const toneUi = getToneUi(item.tone);

              return (
                <Link
                  key={item.id}
                  href={`/radar/${item.id}` as Route}
                  className="grid grid-cols-[1fr_auto] gap-3 py-3 transition-colors hover:text-white"
                >
                  <div className="flex min-w-0 gap-3">
                    <span className="pt-0.5 text-sm font-medium text-white/28">
                      {index + 1}
                    </span>
                    <div className="flex min-w-0 gap-1.5">
                      <p className="line-clamp-2 min-w-0 text-sm leading-5 text-white/82">
                        {item.title}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-semibold tracking-tight text-white">
                      {formatProbability(item.probability)}
                    </p>
                    <p className={`text-xs font-medium ${toneUi.text}`}>
                      {formatSignedDelta(item.delta)}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="code-surface flex h-full min-h-0 flex-col border-white/7 bg-market-surface/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
        <CardHeader className="px-4 pb-2 pt-3.5">
          <CardTitle className="flex items-center justify-between text-lg text-white">
            <span>{metricsTitle}</span>
            <span className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-white/34">
              {metricsStatusLabel}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 px-4 pb-3.5 pt-0">
          <div className="grid h-full auto-rows-fr gap-2.5">
            {metricItems.map((metric) => {
              const toneUi = getToneUi(metric.tone);

              return (
                <div
                  key={metric.id}
                  className="flex h-full items-center justify-between gap-4 rounded-[20px] border border-white/8 bg-white/4 px-4 py-3"
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
