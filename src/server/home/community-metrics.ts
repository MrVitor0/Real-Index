import "server-only";

import { inArray, ne, sql } from "drizzle-orm";

import type { CommunityMetricsData } from "@/features/home/contracts/community-metrics";
import { getDb } from "@/server/db/client";
import { forecastLedgerEntries, profiles } from "@/server/db/schema";

const systemBootstrapProfileId = "system-bootstrap";
const forecastEntryTypes = ["entry", "flip-entry"] as const;
const forecastTransactionTypes = [
  "entry",
  "exit",
  "flip-entry",
  "flip-exit",
] as const;

const compactNumberFormatter = new Intl.NumberFormat("pt-BR", {
  notation: "compact",
  compactDisplay: "short",
  maximumFractionDigits: 1,
});

function formatMetricValue(value: number) {
  return compactNumberFormatter.format(value).replaceAll("\u00A0", " ");
}

export async function getCommunityMetrics(): Promise<CommunityMetricsData> {
  const db = getDb();
  const [communityUsersRow, forecastsRow, creditsRow] = await Promise.all([
    db
      .select({
        value: sql<number>`cast(count(*) as integer)`,
      })
      .from(profiles)
      .where(ne(profiles.authUserId, systemBootstrapProfileId)),
    db
      .select({
        value: sql<number>`cast(count(*) as integer)`,
      })
      .from(forecastLedgerEntries)
      .where(inArray(forecastLedgerEntries.type, [...forecastEntryTypes])),
    db
      .select({
        value: sql<number>`cast(coalesce(sum(abs(${forecastLedgerEntries.creditsDelta})), 0) as double precision)`,
      })
      .from(forecastLedgerEntries)
      .where(
        inArray(forecastLedgerEntries.type, [...forecastTransactionTypes]),
      ),
  ]);

  const communityUsers = communityUsersRow[0]?.value ?? 0;
  const forecastsCount = forecastsRow[0]?.value ?? 0;
  const creditsVolume = Math.round(creditsRow[0]?.value ?? 0);

  return {
    title: "Métricas",
    items: [
      {
        id: "community-users",
        label: "Membros",
        value: communityUsers,
        valueLabel: formatMetricValue(communityUsers),
        tone: "sky",
      },
      {
        id: "forecasts-made",
        label: "Palpites feitos",
        value: forecastsCount,
        valueLabel: formatMetricValue(forecastsCount),
        tone: "mint",
      },
      {
        id: "credits-volume",
        label: "Transacionados",
        value: creditsVolume,
        valueLabel: formatMetricValue(creditsVolume),
        tone: "gold",
      },
    ],
  } satisfies CommunityMetricsData;
}
