import { ChevronRight, Flame } from "lucide-react";

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
  const hotTopics = sidebar.hotTopics.slice(0, 3);

  return (
    <aside className="grid gap-4 xl:h-full xl:self-stretch xl:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]">
      <Card className="code-surface flex h-full min-h-0 flex-col border-white/7 bg-market-surface/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
        <CardHeader className="px-4 pb-2 pt-4">
          <CardTitle className="flex items-center justify-between text-lg text-white">
            <span>[{sidebar.breakingTitle}]</span>
            <ChevronRight className="h-4 w-4 text-white/36" />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 px-4 pb-4 pt-0">
          <div className="divide-y divide-white/6">
            {sidebar.breakingNews.map((item, index) => {
              const toneUi = getToneUi(item.tone);

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-[1fr_auto] gap-3 py-3.5"
                >
                  <div className="flex min-w-0 gap-3">
                    <span className="pt-0.5 text-sm font-medium text-white/28">
                      {index + 1}
                    </span>
                    <div className="flex min-w-0 gap-1.5">
                      <span className="mr-2 font-mono text-primary/42">
                        {"//"}
                      </span>
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
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="code-surface flex h-full min-h-0 flex-col border-white/7 bg-market-surface/94 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)]">
        <CardHeader className="px-4 pb-2 pt-4">
          <CardTitle className="flex items-center justify-between text-lg text-white">
            <span>[{sidebar.hotTopicsTitle}]</span>
            <ChevronRight className="h-4 w-4 text-white/36" />
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 space-y-3 px-4 pb-4 pt-0">
          <div className="divide-y divide-white/6">
            {hotTopics.map((topic, index) => {
              const toneUi = getToneUi(topic.tone);

              return (
                <div
                  key={topic.id}
                  className="grid grid-cols-[1fr_auto] gap-3 py-3.5"
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
                    <span className="font-mono text-white/46">
                      {topic.valueLabel}
                    </span>
                    <Flame className={`h-4 w-4 ${toneUi.text}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </aside>
  );
}
