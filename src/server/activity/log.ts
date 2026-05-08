import "server-only";

import { desc, eq, inArray } from "drizzle-orm";

import type {
  RecentActivityData,
  RecentActivityEventType,
  RecentActivityGroup,
  RecentActivityItem,
} from "@/features/home/contracts/recent-activity";
import { formatCredits } from "@/features/market-detail/lib/forecast";
import { getDb } from "@/server/db/client";
import {
  forecastLedgerEntries,
  platformActivityLogs,
  predictionEvents,
  profiles,
  type PlatformActivityType,
} from "@/server/db/schema";

type ActivityMarketRecord = {
  id: string;
  slug: string;
  title: string;
  yesLabel: string;
  noLabel: string;
};

export type RecentActivityRecord = {
  id: string;
  type: RecentActivityEventType;
  createdAt: Date;
  actor: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
  };
  market: ActivityMarketRecord | null;
  fromSide: "yes" | "no" | null;
  toSide: "yes" | "no" | null;
  creditsAmount: number;
  sharesAmount: number;
};

type FallbackLedgerRow = {
  id: string;
  type: "grant" | "entry" | "exit" | "flip-exit" | "flip-entry" | "settlement";
  createdAt: Date;
  side: "yes" | "no" | null;
  creditsDelta: number;
  sharesDelta: number;
  actor: RecentActivityRecord["actor"];
  market: ActivityMarketRecord | null;
};

type FallbackProfileRow = {
  id: string;
  createdAt: Date;
  actor: RecentActivityRecord["actor"];
};

type FallbackMarketRow = {
  id: string;
  createdAt: Date;
  actor: RecentActivityRecord["actor"];
  market: ActivityMarketRecord;
};

export type RecordPlatformActivityInput = {
  actorProfileId: string;
  type: PlatformActivityType;
  predictionEventId?: string | null;
  fromSide?: "yes" | "no" | null;
  toSide?: "yes" | "no" | null;
  creditsAmount?: number;
  sharesAmount?: number;
  createdAt?: Date;
};

const shareFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

const globalForActivityLog = globalThis as typeof globalThis & {
  __realSeverityActivityStorageWarningShown?: boolean;
};

function roundValue(value: number) {
  return Number(value.toFixed(6));
}

function clampLimit(limit: number) {
  return Math.min(100, Math.max(1, Math.floor(limit)));
}

function formatShares(value: number) {
  return `${shareFormatter.format(roundValue(value))} cotas`;
}

function isMissingPlatformActivityStorageError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const errorWithCode = error as Error & {
    code?: string;
    cause?: {
      code?: string;
    };
  };
  const errorCode = errorWithCode.code ?? errorWithCode.cause?.code;

  if (errorCode === "42P01" || errorCode === "42704") {
    return true;
  }

  const normalizedMessage = error.message.toLowerCase();

  return (
    normalizedMessage.includes("platform_activity_logs") ||
    normalizedMessage.includes("platform_activity_type")
  );
}

function warnMissingPlatformActivityStorageOnce() {
  if (globalForActivityLog.__realSeverityActivityStorageWarningShown) {
    return;
  }

  globalForActivityLog.__realSeverityActivityStorageWarningShown = true;
  console.warn(
    "Platform activity storage is unavailable. Apply migration 0002 before enabling live activity persistence.",
  );
}

function getRecentActivityIdentityKey(record: RecentActivityRecord) {
  return [
    record.type,
    record.actor.id,
    record.market?.id ?? "-",
    record.createdAt.toISOString(),
    record.toSide ?? "-",
    record.fromSide ?? "-",
    roundValue(record.creditsAmount),
    roundValue(record.sharesAmount),
  ].join("::");
}

function buildPlatformActivityRecords(
  rows: Array<{
    id: string;
    type: RecentActivityEventType;
    createdAt: Date;
    fromSide: "yes" | "no" | null;
    toSide: "yes" | "no" | null;
    creditsAmount: number;
    sharesAmount: number;
    actorId: string;
    actorUsername: string;
    actorDisplayName: string;
    actorAvatarUrl: string | null;
    marketId: string | null;
    marketSlug: string | null;
    marketTitle: string | null;
    marketYesLabel: string | null;
    marketNoLabel: string | null;
  }>,
) {
  return rows.map<RecentActivityRecord>((row) => ({
    id: row.id,
    type: row.type,
    createdAt: row.createdAt,
    actor: {
      id: row.actorId,
      username: row.actorUsername,
      displayName: row.actorDisplayName,
      avatarUrl: row.actorAvatarUrl,
    },
    market:
      row.marketId &&
      row.marketSlug &&
      row.marketTitle &&
      row.marketYesLabel &&
      row.marketNoLabel
        ? {
            id: row.marketId,
            slug: row.marketSlug,
            title: row.marketTitle,
            yesLabel: row.marketYesLabel,
            noLabel: row.marketNoLabel,
          }
        : null,
    fromSide: row.fromSide,
    toSide: row.toSide,
    creditsAmount: row.creditsAmount,
    sharesAmount: row.sharesAmount,
  }));
}

function mapFallbackLedgerEventType(type: FallbackLedgerRow["type"]) {
  if (type === "entry") {
    return "forecast_entry" as const;
  }

  if (type === "exit") {
    return "forecast_exit" as const;
  }

  if (type === "flip-entry") {
    return "forecast_flip" as const;
  }

  return null;
}

export function buildRecentActivityFallbackRecords(input: {
  ledgerRows?: FallbackLedgerRow[];
  profileRows?: FallbackProfileRow[];
  marketRows?: FallbackMarketRow[];
  limit: number;
  types?: PlatformActivityType[];
}) {
  const records: RecentActivityRecord[] = [];
  const flipExitByCompositeKey = new Map<string, FallbackLedgerRow>();
  const allowedTypes = input.types ? new Set(input.types) : null;

  for (const row of input.ledgerRows ?? []) {
    if (row.type !== "flip-exit") {
      continue;
    }

    flipExitByCompositeKey.set(
      `${row.actor.id}:${row.market?.id ?? "-"}:${row.createdAt.toISOString()}`,
      row,
    );
  }

  for (const row of input.ledgerRows ?? []) {
    const nextType = mapFallbackLedgerEventType(row.type);

    if (!nextType || (allowedTypes && !allowedTypes.has(nextType))) {
      continue;
    }

    const compositeKey = `${row.actor.id}:${row.market?.id ?? "-"}:${row.createdAt.toISOString()}`;
    const relatedFlipExit = flipExitByCompositeKey.get(compositeKey);

    records.push({
      id: `ledger:${row.id}`,
      type: nextType,
      createdAt: row.createdAt,
      actor: row.actor,
      market: row.market,
      fromSide:
        nextType === "forecast_flip" ? (relatedFlipExit?.side ?? null) : null,
      toSide: row.side,
      creditsAmount: Math.abs(row.creditsDelta),
      sharesAmount: Math.abs(row.sharesDelta),
    });
  }

  if (!allowedTypes || allowedTypes.has("user_joined")) {
    for (const row of input.profileRows ?? []) {
      records.push({
        id: `profile:${row.id}`,
        type: "user_joined",
        createdAt: row.createdAt,
        actor: row.actor,
        market: null,
        fromSide: null,
        toSide: null,
        creditsAmount: 0,
        sharesAmount: 0,
      });
    }
  }

  if (!allowedTypes || allowedTypes.has("market_created")) {
    for (const row of input.marketRows ?? []) {
      records.push({
        id: `market:${row.id}`,
        type: "market_created",
        createdAt: row.createdAt,
        actor: row.actor,
        market: row.market,
        fromSide: null,
        toSide: null,
        creditsAmount: 0,
        sharesAmount: 0,
      });
    }
  }

  return records
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, input.limit);
}

async function getFallbackRecentActivityRecords(input: {
  limit: number;
  types?: PlatformActivityType[];
}) {
  const db = getDb();
  const sourceLimit = Math.max(input.limit * 3, 12);
  const wantsForecast =
    !input.types ||
    input.types.some((type) =>
      ["forecast_entry", "forecast_exit", "forecast_flip"].includes(type),
    );
  const wantsUserJoined = !input.types || input.types.includes("user_joined");
  const wantsMarketCreated =
    !input.types || input.types.includes("market_created");

  const [ledgerRows, profileRows, marketRows] = await Promise.all([
    wantsForecast
      ? db
          .select({
            id: forecastLedgerEntries.id,
            type: forecastLedgerEntries.type,
            createdAt: forecastLedgerEntries.createdAt,
            side: forecastLedgerEntries.side,
            creditsDelta: forecastLedgerEntries.creditsDelta,
            sharesDelta: forecastLedgerEntries.sharesDelta,
            actorId: profiles.id,
            actorUsername: profiles.username,
            actorDisplayName: profiles.displayName,
            actorAvatarUrl: profiles.avatarUrl,
            marketId: predictionEvents.id,
            marketSlug: predictionEvents.slug,
            marketTitle: predictionEvents.title,
            marketYesLabel: predictionEvents.yesLabel,
            marketNoLabel: predictionEvents.noLabel,
          })
          .from(forecastLedgerEntries)
          .innerJoin(profiles, eq(forecastLedgerEntries.profileId, profiles.id))
          .leftJoin(
            predictionEvents,
            eq(forecastLedgerEntries.predictionEventId, predictionEvents.id),
          )
          .orderBy(desc(forecastLedgerEntries.createdAt))
          .limit(sourceLimit * 2)
      : Promise.resolve([]),
    wantsUserJoined
      ? db
          .select({
            id: profiles.id,
            createdAt: profiles.createdAt,
            actorId: profiles.id,
            actorUsername: profiles.username,
            actorDisplayName: profiles.displayName,
            actorAvatarUrl: profiles.avatarUrl,
          })
          .from(profiles)
          .orderBy(desc(profiles.createdAt))
          .limit(sourceLimit)
      : Promise.resolve([]),
    wantsMarketCreated
      ? db
          .select({
            id: predictionEvents.id,
            createdAt: predictionEvents.createdAt,
            creatorId: profiles.id,
            creatorUsername: profiles.username,
            creatorDisplayName: profiles.displayName,
            creatorAvatarUrl: profiles.avatarUrl,
            marketId: predictionEvents.id,
            marketSlug: predictionEvents.slug,
            marketTitle: predictionEvents.title,
            marketYesLabel: predictionEvents.yesLabel,
            marketNoLabel: predictionEvents.noLabel,
          })
          .from(predictionEvents)
          .innerJoin(
            profiles,
            eq(predictionEvents.createdByProfileId, profiles.id),
          )
          .orderBy(desc(predictionEvents.createdAt))
          .limit(sourceLimit)
      : Promise.resolve([]),
  ]);

  return buildRecentActivityFallbackRecords({
    limit: input.limit,
    types: input.types,
    ledgerRows: ledgerRows.map((row) => ({
      id: row.id,
      type: row.type,
      createdAt: row.createdAt,
      side: row.side,
      creditsDelta: row.creditsDelta,
      sharesDelta: row.sharesDelta,
      actor: {
        id: row.actorId,
        username: row.actorUsername,
        displayName: row.actorDisplayName,
        avatarUrl: row.actorAvatarUrl,
      },
      market:
        row.marketId &&
        row.marketSlug &&
        row.marketTitle &&
        row.marketYesLabel &&
        row.marketNoLabel
          ? {
              id: row.marketId,
              slug: row.marketSlug,
              title: row.marketTitle,
              yesLabel: row.marketYesLabel,
              noLabel: row.marketNoLabel,
            }
          : null,
    })),
    profileRows: profileRows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      actor: {
        id: row.actorId,
        username: row.actorUsername,
        displayName: row.actorDisplayName,
        avatarUrl: row.actorAvatarUrl,
      },
    })),
    marketRows: marketRows.map((row) => ({
      id: row.id,
      createdAt: row.createdAt,
      actor: {
        id: row.creatorId,
        username: row.creatorUsername,
        displayName: row.creatorDisplayName,
        avatarUrl: row.creatorAvatarUrl,
      },
      market: {
        id: row.marketId,
        slug: row.marketSlug,
        title: row.marketTitle,
        yesLabel: row.marketYesLabel,
        noLabel: row.marketNoLabel,
      },
    })),
  });
}

function mergeRecentActivityRecords(
  primaryRecords: RecentActivityRecord[],
  secondaryRecords: RecentActivityRecord[],
  limit: number,
) {
  const mergedRecords: RecentActivityRecord[] = [];
  const seenKeys = new Set<string>();

  for (const record of [...primaryRecords, ...secondaryRecords]) {
    const nextKey = getRecentActivityIdentityKey(record);

    if (seenKeys.has(nextKey)) {
      continue;
    }

    seenKeys.add(nextKey);
    mergedRecords.push(record);
  }

  return mergedRecords
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, limit);
}

function resolveActivityGroup(
  type: RecentActivityEventType,
): RecentActivityGroup {
  if (type === "user_joined") {
    return "user";
  }

  if (type === "market_created" || type === "market_viewed") {
    return "market";
  }

  return "forecast";
}

function getSideLabel(
  market: ActivityMarketRecord | null,
  side: "yes" | "no" | null,
) {
  if (!market || !side) {
    return null;
  }

  return side === "yes" ? market.yesLabel : market.noLabel;
}

function buildActivityCopy(record: RecentActivityRecord) {
  const marketTitle = record.market?.title ?? "Radar da comunidade";
  const activeSideLabel = getSideLabel(record.market, record.toSide);
  const previousSideLabel = getSideLabel(record.market, record.fromSide);

  switch (record.type) {
    case "user_joined":
      return {
        group: resolveActivityGroup(record.type),
        typeLabel: "Novo participante",
        headline: `${record.actor.displayName} entrou na plataforma`,
        description: "Perfil sincronizado com a comunidade REAL.",
      };
    case "market_created":
      return {
        group: resolveActivityGroup(record.type),
        typeLabel: "Radar criado",
        headline: `${record.actor.displayName} abriu um radar`,
        description: marketTitle,
      };
    case "market_viewed":
      return {
        group: resolveActivityGroup(record.type),
        typeLabel: "Radar aberto",
        headline: `${record.actor.displayName} abriu um radar`,
        description: marketTitle,
      };
    case "forecast_entry":
      return {
        group: resolveActivityGroup(record.type),
        typeLabel: "Forecast",
        headline: `${record.actor.displayName} reforcou uma leitura`,
        description: [
          marketTitle,
          activeSideLabel,
          formatCredits(record.creditsAmount),
        ]
          .filter(Boolean)
          .join(" • "),
      };
    case "forecast_exit":
      return {
        group: resolveActivityGroup(record.type),
        typeLabel: "Saida",
        headline: `${record.actor.displayName} liberou credits de uma leitura`,
        description: [
          marketTitle,
          activeSideLabel,
          formatCredits(record.creditsAmount),
        ]
          .filter(Boolean)
          .join(" • "),
      };
    case "forecast_flip":
      return {
        group: resolveActivityGroup(record.type),
        typeLabel: "Virada",
        headline: `${record.actor.displayName} virou a leitura`,
        description: [
          marketTitle,
          previousSideLabel && activeSideLabel
            ? `${previousSideLabel} → ${activeSideLabel}`
            : activeSideLabel,
          formatCredits(record.creditsAmount),
        ]
          .filter(Boolean)
          .join(" • "),
      };
  }
}

export function buildRecentActivityItem(
  record: RecentActivityRecord,
): RecentActivityItem {
  const copy = buildActivityCopy(record);

  return {
    id: record.id,
    group: copy.group,
    type: record.type,
    typeLabel: copy.typeLabel,
    headline: copy.headline,
    description: copy.description,
    createdAt: record.createdAt.toISOString(),
    actor: record.actor,
    market: record.market
      ? {
          id: record.market.id,
          slug: record.market.slug,
          title: record.market.title,
        }
      : null,
    fromSide: record.fromSide,
    toSide: record.toSide,
    creditsAmount: roundValue(record.creditsAmount),
    creditsAmountLabel:
      record.creditsAmount > 0 ? formatCredits(record.creditsAmount) : null,
    sharesAmount: roundValue(record.sharesAmount),
    sharesAmountLabel:
      record.sharesAmount > 0 ? formatShares(record.sharesAmount) : null,
  };
}

export function buildRecentActivityFeed(
  records: RecentActivityRecord[],
): RecentActivityData {
  return {
    title: "Atividade recente",
    items: records.map(buildRecentActivityItem),
  };
}

export async function recordPlatformActivity(
  input: RecordPlatformActivityInput,
) {
  const db = getDb();

  try {
    await db.insert(platformActivityLogs).values({
      actorProfileId: input.actorProfileId,
      predictionEventId: input.predictionEventId ?? null,
      type: input.type,
      fromSide: input.fromSide ?? null,
      toSide: input.toSide ?? null,
      creditsAmount: roundValue(input.creditsAmount ?? 0),
      sharesAmount: roundValue(input.sharesAmount ?? 0),
      createdAt: input.createdAt ?? new Date(),
    });
  } catch (error) {
    if (isMissingPlatformActivityStorageError(error)) {
      warnMissingPlatformActivityStorageOnce();
      return;
    }

    throw error;
  }
}

export async function getRecentActivityFeed(input?: {
  limit?: number;
  types?: PlatformActivityType[];
}) {
  const db = getDb();
  const limit = clampLimit(input?.limit ?? 25);
  let fallbackRecordsPromise: Promise<RecentActivityRecord[]> | null = null;

  const getFallbackRecords = () => {
    if (!fallbackRecordsPromise) {
      fallbackRecordsPromise = getFallbackRecentActivityRecords({
        limit,
        types: input?.types,
      });
    }

    return fallbackRecordsPromise;
  };

  try {
    const baseQuery = db
      .select({
        id: platformActivityLogs.id,
        type: platformActivityLogs.type,
        createdAt: platformActivityLogs.createdAt,
        fromSide: platformActivityLogs.fromSide,
        toSide: platformActivityLogs.toSide,
        creditsAmount: platformActivityLogs.creditsAmount,
        sharesAmount: platformActivityLogs.sharesAmount,
        actorId: profiles.id,
        actorUsername: profiles.username,
        actorDisplayName: profiles.displayName,
        actorAvatarUrl: profiles.avatarUrl,
        marketId: predictionEvents.id,
        marketSlug: predictionEvents.slug,
        marketTitle: predictionEvents.title,
        marketYesLabel: predictionEvents.yesLabel,
        marketNoLabel: predictionEvents.noLabel,
      })
      .from(platformActivityLogs)
      .innerJoin(profiles, eq(platformActivityLogs.actorProfileId, profiles.id))
      .leftJoin(
        predictionEvents,
        eq(platformActivityLogs.predictionEventId, predictionEvents.id),
      );
    const rows = input?.types?.length
      ? await baseQuery
          .where(inArray(platformActivityLogs.type, input.types))
          .orderBy(desc(platformActivityLogs.createdAt))
          .limit(limit)
      : await baseQuery
          .orderBy(desc(platformActivityLogs.createdAt))
          .limit(limit);
    const platformRecords = buildPlatformActivityRecords(rows);

    if (platformRecords.length >= limit) {
      return buildRecentActivityFeed(platformRecords.slice(0, limit));
    }

    const fallbackRecords = await getFallbackRecords();

    return buildRecentActivityFeed(
      mergeRecentActivityRecords(platformRecords, fallbackRecords, limit),
    );
  } catch (error) {
    if (isMissingPlatformActivityStorageError(error)) {
      warnMissingPlatformActivityStorageOnce();
      return buildRecentActivityFeed(await getFallbackRecords());
    }

    throw error;
  }
}
