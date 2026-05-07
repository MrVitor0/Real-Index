import { ChevronRight, Flame } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HomeSidebar } from "@/features/home/contracts/home-feed";
import {
  formatProbability,
  formatSignedDelta,
  getToneUi,
} from "@/features/home/lib/presentation";

type SidebarPanelProps = {
  sidebar: HomeSidebar;
};

export function SidebarPanel({ sidebar }: SidebarPanelProps) {
  return (
    <aside className="grid gap-6">
      <Card className="border-white/7 bg-[color:var(--market-surface)]/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="flex items-center justify-between text-xl text-white">
            <span>{sidebar.breakingTitle}</span>
            <ChevronRight className="h-4 w-4 text-white/36" />
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-2">
          <div className="divide-y divide-white/6">
            {sidebar.breakingNews.map((item, index) => {
              const toneUi = getToneUi(item.tone);

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto] gap-4 py-4"
                >
                  <div className="flex gap-3">
                    <span className="pt-0.5 text-sm font-medium text-white/28">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-white/82">
                      {item.title}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-semibold tracking-tight text-white">
                      {formatProbability(item.probability)}
                    </p>
                    <p className={`text-xs font-medium ${toneUi.text}`}>
                      {formatSignedDelta(item.delta)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/7 bg-[color:var(--market-surface)]/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
        <CardHeader className="px-5 pt-5">
          <CardTitle className="flex items-center justify-between text-xl text-white">
            <span>{sidebar.hotTopicsTitle}</span>
            <ChevronRight className="h-4 w-4 text-white/36" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-5 pb-5 pt-2">
          <div className="divide-y divide-white/6">
            {sidebar.hotTopics.map((topic, index) => {
              const toneUi = getToneUi(topic.tone);

              return (
                <div
                  key={topic.id}
                  className="grid grid-cols-[1fr_auto] gap-4 py-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-white/28">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-white/84">
                      {topic.label}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white/46">{topic.valueLabel}</span>
                    <Flame className={`h-4 w-4 ${toneUi.text}`} />
                  </div>
                </div>
              );
            })}
          </div>

          <Button
            variant="outline"
            className="h-11 w-full rounded-full border-white/8 bg-white/[0.03] text-white hover:bg-white/8 hover:text-white"
          >
            {sidebar.exploreLabel}
          </Button>
        </CardContent>
      </Card>
    </aside>
  );
}
