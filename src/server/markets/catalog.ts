import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { asc, desc, eq, inArray } from "drizzle-orm";

import type {
  FeaturedChartPoint,
  FeaturedMarket,
  HomeFeedData,
  HomeNavigation,
  HomeSidebar,
  HomeTone,
  MarketCard,
} from "@/features/home/contracts/home-feed";
import {
  featuredMarketSchema,
  homeFeedDataSchema,
  homeNavigationSchema,
  homeSidebarSchema,
  openMarketsSchema,
} from "@/features/home/contracts/home-feed";
import type { CreatePredictionMarketInput } from "@/features/markets/contracts/create-market";
import { createPredictionMarketInputSchema } from "@/features/markets/contracts/create-market";
import {
  radarMarketContentSchema,
  radarMarketDetailSchema,
  type RadarMarketChartPoint,
  type RadarMarketDetail,
} from "@/features/market-detail/contracts/radar-market-detail";
import {
  formatCompactCredits,
  invertSignalScore,
  probabilityToSignalScore,
} from "@/features/market-detail/lib/forecast";
import { siteConfig } from "@/config/site";
import { getDb } from "@/server/db/client";
import {
  predictionEvents,
  predictionEventSnapshots,
  profiles,
  type PredictionEvent,
  type PredictionEventSnapshot,
  type Profile,
} from "@/server/db/schema";

type ViewerIdentity = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

type EventWithCreatorRow = {
  event: PredictionEvent;
  creator: Pick<
    Profile,
    "id" | "username" | "displayName" | "avatarUrl"
  > | null;
  snapshots: PredictionEventSnapshot[];
};

type BootstrapMarketItem = {
  id: string;
  title: string;
  subtitle: string;
  probability: number;
  volumeLabel: string;
  movementLabel: string;
  tone: HomeTone;
  iconLabel: string;
  tags: string[];
  yesPriceLabel: string;
  noPriceLabel: string;
};

const homeDataDirectory = path.join(process.cwd(), "data", "home");
const chartTicks = [0, 20, 40, 60, 80, 100];
const sidebarTitles = {
  breakingTitle: "Notícias",
  hotTopicsTitle: "Em Alta",
  exploreLabel: "Abrir feed completo",
} as const;
const topLinks = [
  {
    id: "documentacao",
    label: "Documentação",
    href: siteConfig.docsUrl,
  },
] as const;
const systemBootstrapProfileId = "system-bootstrap";

const globalForBootstrap = globalThis as typeof globalThis & {
  __realSeverityBootstrapPromise?: Promise<void>;
};

function roundValue(value: number) {
  return Number(value.toFixed(1));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value);
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map(
      (segment) => segment[0]?.toUpperCase() + segment.slice(1).toLowerCase(),
    )
    .join(" ");
}

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

function normalizeList(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, items) => items.indexOf(value) === index);
}

function normalizeTags(tags: string[], category: string) {
  return normalizeList([category, ...tags]).slice(0, 6);
}

function getCounterTone(tone: HomeTone): HomeTone {
  if (tone === "coral") {
    return "mint";
  }

  if (tone === "slate") {
    return "gold";
  }

  return "coral";
}

function formatWatcherCountLabel(watcherCount: number) {
  if (watcherCount <= 1) {
    return "1 acompanhando";
  }

  return `${compactNumber(watcherCount)}`;
}

function formatProbabilityChange(
  currentProbability: number,
  previousProbability: number,
) {
  const delta = roundValue(currentProbability - previousProbability);

  if (Math.abs(delta) < 0.1) {
    return {
      direction: "flat" as const,
      delta,
      movementLabel: "Estavel hoje",
    };
  }

  return {
    direction: delta > 0 ? ("up" as const) : ("down" as const),
    delta,
    movementLabel: `${delta > 0 ? "↗" : "↘"} ${Math.abs(delta).toLocaleString(
      "pt-BR",
      {
        maximumFractionDigits: 1,
      },
    )}% hoje`,
  };
}

function formatCloseLabel(expiresAt: Date | null) {
  if (!expiresAt) {
    return "Sem janela definida";
  }

  const now = new Date();
  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const startOfTarget = new Date(
    expiresAt.getFullYear(),
    expiresAt.getMonth(),
    expiresAt.getDate(),
  );
  const diffInDays = Math.round(
    (startOfTarget.getTime() - startOfToday.getTime()) / 86_400_000,
  );
  const timeLabel = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(expiresAt);

  if (diffInDays === 0) {
    return `Hoje ${timeLabel}`;
  }

  if (diffInDays === 1) {
    return `Amanha ${timeLabel}`;
  }

  if (diffInDays > 1 && diffInDays <= 6) {
    const weekday = new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
    }).format(expiresAt);

    return `${titleCase(weekday)} ${timeLabel}`;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(expiresAt);
}

function formatSnapshotLabel(date: Date) {
  const now = new Date();
  const diffInHours = Math.abs(now.getTime() - date.getTime()) / 3_600_000;

  if (diffInHours <= 24) {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function parseCompactLabel(label: string) {
  const match = label
    .toLowerCase()
    .replace(/\s+/g, " ")
    .match(/(\d+(?:[.,]\d+)?)\s*(mil|m)?/);

  if (!match) {
    return 0;
  }

  const numericValue = Number(match[1]?.replace(",", ".") ?? 0);

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  return Math.round(numericValue * (match[2] ? 1000 : 1));
}

function parseMovementDelta(label: string) {
  const match = label.match(/([↗↘])\s*(\d+(?:[.,]\d+)?)%/u);

  if (!match) {
    return 0;
  }

  const value = Number(match[2]?.replace(",", ".") ?? 0);

  if (!Number.isFinite(value)) {
    return 0;
  }

  return match[1] === "↘" ? -value : value;
}

function nextWeekday(
  baseDate: Date,
  targetWeekday: number,
  hours = 9,
  minutes = 0,
) {
  const date = new Date(baseDate);
  const currentWeekday = date.getDay();
  const normalizedCurrent = currentWeekday === 0 ? 7 : currentWeekday;
  const diff = (targetWeekday - normalizedCurrent + 7) % 7 || 7;

  date.setDate(date.getDate() + diff);
  date.setHours(hours, minutes, 0, 0);

  return date;
}

function deriveBootstrapExpiryDate(subtitle: string, now = new Date()) {
  const normalized = subtitle.trim();
  const clockMatch = normalized.match(/(\d{2}):(\d{2})$/);
  const hours = Number(clockMatch?.[1] ?? 9);
  const minutes = Number(clockMatch?.[2] ?? 0);

  if (normalized.startsWith("Hoje")) {
    const date = new Date(now);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  if (normalized.startsWith("Amanha")) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  if (normalized.startsWith("Segunda"))
    return nextWeekday(now, 1, hours, minutes);
  if (normalized.startsWith("Terca"))
    return nextWeekday(now, 2, hours, minutes);
  if (normalized.startsWith("Quarta"))
    return nextWeekday(now, 3, hours, minutes);
  if (normalized.startsWith("Quinta"))
    return nextWeekday(now, 4, hours, minutes);
  if (normalized.startsWith("Sexta"))
    return nextWeekday(now, 5, hours, minutes);
  if (normalized.startsWith("Sabado"))
    return nextWeekday(now, 6, hours, minutes);
  if (normalized.startsWith("Domingo"))
    return nextWeekday(now, 7, hours, minutes);

  if (normalized === "Fim de semana") {
    return nextWeekday(now, 6, 12, 0);
  }

  if (normalized === "Esta semana") {
    return nextWeekday(now, 5, 18, 0);
  }

  if (normalized === "Proximo lancamento") {
    const date = new Date(now);
    date.setDate(date.getDate() + 14);
    date.setHours(10, 0, 0, 0);
    return date;
  }

  const fallback = new Date(now);
  fallback.setDate(fallback.getDate() + 3);
  fallback.setHours(18, 0, 0, 0);
  return fallback;
}

async function readBootstrapSections() {
  const [marketsFileContent, detailsFileContent] = await Promise.all([
    readFile(path.join(homeDataDirectory, "open-markets.json"), "utf8"),
    readFile(path.join(homeDataDirectory, "radar-market-details.json"), "utf8"),
  ]);

  const markets = openMarketsSchema.parse(JSON.parse(marketsFileContent));
  const details = radarMarketContentSchema
    .array()
    .parse(JSON.parse(detailsFileContent));

  return {
    markets: markets.items as BootstrapMarketItem[],
    detailsById: new Map(details.map((item) => [item.id, item])),
  };
}

async function ensureSystemProfile() {
  const db = getDb();
  const existingProfile = await db
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, systemBootstrapProfileId))
    .limit(1);

  if (existingProfile[0]) {
    return existingProfile[0];
  }

  const [createdProfile] = await db
    .insert(profiles)
    .values({
      authUserId: systemBootstrapProfileId,
      username: "real-index",
      displayName: "REAL Index",
      bio: "Perfil de bootstrap do catalogo inicial do REAL Severity Index.",
    })
    .returning();

  return createdProfile;
}

async function ensureBootstrapSeed() {
  const db = getDb();
  const existingEvent = await db
    .select({ id: predictionEvents.id })
    .from(predictionEvents)
    .limit(1);

  if (existingEvent[0]) {
    return;
  }

  const systemProfile = await ensureSystemProfile();
  const { markets, detailsById } = await readBootstrapSections();
  const now = new Date();

  const createdEvents = await db
    .insert(predictionEvents)
    .values(
      markets.map((market, index) => {
        const details = detailsById.get(market.id);

        return {
          createdByProfileId: systemProfile.id,
          slug: market.id,
          title: market.title,
          description: details?.overview ?? market.title,
          overview: details?.overview ?? market.title,
          category:
            market.tags.find((tag) => tag !== "Tudo") ??
            market.tags[0] ??
            "Radar",
          subCategory: market.subtitle,
          iconLabel: market.iconLabel,
          tone: market.tone,
          yesLabel: market.yesPriceLabel,
          noLabel: market.noPriceLabel,
          tags: market.tags.filter((tag) => tag !== "Tudo"),
          rules: details?.rules.length
            ? details.rules
            : ["Sem regras cadastradas ainda."],
          contextNotes: details?.context.length
            ? details.context
            : ["Sem contexto adicional cadastrado ainda."],
          status: "active" as const,
          communityProbability: market.probability,
          severityScore: market.probability,
          featured: index === 0,
          watcherCount: Math.max(parseCompactLabel(market.volumeLabel), 1),
          volumeCredits: 0,
          minimumCredits: 50,
          initialCredits: 1000,
          expiresAt: deriveBootstrapExpiryDate(market.subtitle, now),
        };
      }),
    )
    .returning({
      id: predictionEvents.id,
      slug: predictionEvents.slug,
      communityProbability: predictionEvents.communityProbability,
      watcherCount: predictionEvents.watcherCount,
      volumeCredits: predictionEvents.volumeCredits,
    });

  if (!createdEvents.length) {
    return;
  }

  const bootstrapSnapshots = createdEvents.flatMap((eventRow, index) => {
    const seedMarket = markets.find((market) => market.id === eventRow.slug);

    if (!seedMarket) {
      return [];
    }

    const delta = parseMovementDelta(seedMarket.movementLabel);
    const previousProbability = clamp(
      eventRow.communityProbability - delta,
      1,
      99,
    );
    const latestSnapshotAt = new Date(
      now.getTime() - (createdEvents.length - index) * 90_000,
    );
    const previousSnapshotAt = new Date(
      latestSnapshotAt.getTime() - 6 * 3_600_000,
    );

    return [
      {
        predictionEventId: eventRow.id,
        probability: Math.round(previousProbability),
        watcherCount: Math.max(Math.round(eventRow.watcherCount * 0.92), 1),
        volumeCredits: 0,
        createdAt: previousSnapshotAt,
      },
      {
        predictionEventId: eventRow.id,
        probability: eventRow.communityProbability,
        watcherCount: eventRow.watcherCount,
        volumeCredits: eventRow.volumeCredits,
        createdAt: latestSnapshotAt,
      },
    ];
  });

  if (bootstrapSnapshots.length) {
    await db.insert(predictionEventSnapshots).values(bootstrapSnapshots);
  }
}

async function ensurePredictionCatalogBootstrapped() {
  if (!globalForBootstrap.__realSeverityBootstrapPromise) {
    globalForBootstrap.__realSeverityBootstrapPromise =
      ensureBootstrapSeed().finally(() => {
        globalForBootstrap.__realSeverityBootstrapPromise = undefined;
      });
  }

  await globalForBootstrap.__realSeverityBootstrapPromise;
}

function mapCreator(row: {
  creatorId: string | null;
  creatorUsername: string | null;
  creatorDisplayName: string | null;
  creatorAvatarUrl: string | null;
}) {
  if (!row.creatorId || !row.creatorUsername || !row.creatorDisplayName) {
    return null;
  }

  return {
    id: row.creatorId,
    username: row.creatorUsername,
    displayName: row.creatorDisplayName,
    avatarUrl: row.creatorAvatarUrl,
  };
}

async function listEventRows(where?: ReturnType<typeof eq>) {
  await ensurePredictionCatalogBootstrapped();

  const db = getDb();
  const query = db
    .select({
      event: predictionEvents,
      creatorId: profiles.id,
      creatorUsername: profiles.username,
      creatorDisplayName: profiles.displayName,
      creatorAvatarUrl: profiles.avatarUrl,
    })
    .from(predictionEvents)
    .leftJoin(profiles, eq(predictionEvents.createdByProfileId, profiles.id));

  const joinedRows = where
    ? await query
        .where(where)
        .orderBy(
          desc(predictionEvents.featured),
          desc(predictionEvents.updatedAt),
        )
    : await query.orderBy(
        desc(predictionEvents.featured),
        desc(predictionEvents.updatedAt),
      );
  const eventIds = joinedRows.map((row) => row.event.id);
  const snapshots = eventIds.length
    ? await db
        .select()
        .from(predictionEventSnapshots)
        .where(inArray(predictionEventSnapshots.predictionEventId, eventIds))
        .orderBy(asc(predictionEventSnapshots.createdAt))
    : [];
  const snapshotsByEventId = new Map<string, PredictionEventSnapshot[]>();

  for (const snapshot of snapshots) {
    const currentSnapshots =
      snapshotsByEventId.get(snapshot.predictionEventId) ?? [];
    currentSnapshots.push(snapshot);
    snapshotsByEventId.set(snapshot.predictionEventId, currentSnapshots);
  }

  return joinedRows.map<EventWithCreatorRow>((row) => ({
    event: row.event,
    creator: mapCreator(row),
    snapshots: snapshotsByEventId.get(row.event.id) ?? [],
  }));
}

function getEventMarketState(row: EventWithCreatorRow) {
  const latestSnapshot = row.snapshots.at(-1);
  const previousSnapshot = row.snapshots.at(-2) ?? latestSnapshot;
  const currentProbability =
    latestSnapshot?.probability ?? row.event.communityProbability;
  const previousProbability =
    previousSnapshot?.probability ?? currentProbability;
  const watcherCount = latestSnapshot?.watcherCount ?? row.event.watcherCount;
  const volumeCredits =
    latestSnapshot?.volumeCredits ?? row.event.volumeCredits;
  const deltaState = formatProbabilityChange(
    currentProbability,
    previousProbability,
  );

  return {
    latestSnapshot,
    previousSnapshot,
    currentProbability,
    previousProbability,
    watcherCount,
    volumeCredits,
    ...deltaState,
  };
}

function buildMarketTags(row: EventWithCreatorRow) {
  return normalizeList(["Tudo", row.event.category, ...row.event.tags]);
}

function buildMarketCard(row: EventWithCreatorRow): MarketCard {
  const state = getEventMarketState(row);

  return {
    id: row.event.slug,
    title: row.event.title,
    subtitle: formatCloseLabel(row.event.expiresAt),
    probability: state.currentProbability,
    volumeLabel: formatWatcherCountLabel(state.watcherCount),
    movementLabel: state.movementLabel,
    direction: state.direction,
    tone: row.event.tone,
    iconLabel: row.event.iconLabel,
    tags: buildMarketTags(row),
    yesPriceLabel: row.event.yesLabel,
    noPriceLabel: row.event.noLabel,
  };
}

function buildChartPoints(row: EventWithCreatorRow): RadarMarketChartPoint[] {
  if (!row.snapshots.length) {
    return [
      {
        label: "Agora",
        probability: row.event.communityProbability,
      },
    ];
  }

  return row.snapshots.map((snapshot) => ({
    label: formatSnapshotLabel(snapshot.createdAt),
    probability: snapshot.probability,
  }));
}

function buildFeaturedChartPoints(
  row: EventWithCreatorRow,
): FeaturedChartPoint[] {
  const chartPoints = buildChartPoints(row);

  return chartPoints.map(
    (point) =>
      ({
        label: point.label,
        yes: point.probability,
        no: roundValue(100 - point.probability),
      }) as unknown as FeaturedChartPoint,
  );
}

function buildRelatedMarkets(
  referenceRow: EventWithCreatorRow,
  rows: EventWithCreatorRow[],
) {
  const referenceTags = new Set(referenceRow.event.tags);

  return rows
    .filter((row) => row.event.id !== referenceRow.event.id)
    .sort((leftRow, rightRow) => {
      const leftScore = leftRow.event.tags.filter((tag) =>
        referenceTags.has(tag),
      ).length;
      const rightScore = rightRow.event.tags.filter((tag) =>
        referenceTags.has(tag),
      ).length;

      return rightScore - leftScore;
    })
    .slice(0, 3);
}

function buildFeaturedMarket(
  row: EventWithCreatorRow,
  rows: EventWithCreatorRow[],
): FeaturedMarket {
  const state = getEventMarketState(row);
  const yesProbability = state.currentProbability;
  const noProbability = roundValue(100 - yesProbability);
  const delta = roundValue(yesProbability - state.previousProbability);

  return featuredMarketSchema.parse({
    id: row.event.slug,
    title: row.event.title,
    category: row.event.category,
    subCategory: row.event.subCategory,
    iconLabel: row.event.iconLabel,
    headlineOutcomeId: "yes",
    volumeLabel: formatWatcherCountLabel(state.watcherCount),
    resolutionLabel: formatCloseLabel(row.event.expiresAt),
    outcomes: [
      {
        id: "yes",
        label: row.event.yesLabel,
        probability: yesProbability,
        change: delta,
        tone: row.event.tone,
      },
      {
        id: "no",
        label: row.event.noLabel,
        probability: noProbability,
        change: -delta,
        tone: getCounterTone(row.event.tone),
      },
    ],
    comments: row.creator
      ? [
          {
            id: `creator-${row.event.id}`,
            name: row.creator.displayName,
            message: `Criado por @${row.creator.username} e aguardando novas leituras da comunidade.`,
            tone: row.event.tone,
          },
        ]
      : [],
    chart: {
      yAxisTicks: chartTicks,
      points: buildFeaturedChartPoints(row),
    },
    relatedMarkets: buildRelatedMarkets(row, rows).map((relatedRow) => ({
      id: relatedRow.event.slug,
      label: relatedRow.event.title,
    })),
  });
}

function buildSidebar(rows: EventWithCreatorRow[]): HomeSidebar {
  const breakingNews = rows
    .map((row) => {
      const state = getEventMarketState(row);

      return {
        id: row.event.slug,
        title: row.event.title,
        probability: state.currentProbability,
        delta: state.delta,
        tone: row.event.tone,
        relevance: Math.abs(state.delta) * 10 + state.watcherCount / 100,
      };
    })
    .sort((leftItem, rightItem) => rightItem.relevance - leftItem.relevance)
    .slice(0, 3)
    .map((item) => ({
      id: item.id,
      title: item.title,
      probability: item.probability,
      delta: item.delta,
      tone: item.tone,
    }));

  const hotTopicMap = new Map<
    string,
    { count: number; watcherCount: number; tone: HomeTone }
  >();

  for (const row of rows) {
    const state = getEventMarketState(row);

    for (const tag of row.event.tags) {
      const currentTopic = hotTopicMap.get(tag) ?? {
        count: 0,
        watcherCount: 0,
        tone: row.event.tone,
      };

      hotTopicMap.set(tag, {
        count: currentTopic.count + 1,
        watcherCount: currentTopic.watcherCount + state.watcherCount,
        tone: currentTopic.tone,
      });
    }
  }

  const hotTopics = [...hotTopicMap.entries()]
    .sort(
      (leftEntry, rightEntry) =>
        rightEntry[1].watcherCount - leftEntry[1].watcherCount,
    )
    .slice(0, 3)
    .map(([label, value], index) => ({
      id: `${label}-${index}`,
      label,
      valueLabel: `${compactNumber(value.watcherCount)}`,
      tone: value.tone,
    }));

  return homeSidebarSchema.parse({
    ...sidebarTitles,
    breakingNews,
    hotTopics,
  });
}

function buildHomeNavigation(markets: MarketCard[]): HomeNavigation {
  const categories = normalizeList(
    markets.flatMap((market) => market.tags.filter((tag) => tag !== "Tudo")),
  ).slice(0, 10);

  return homeNavigationSchema.parse({
    brandLabel: siteConfig.shortName,
    brandBadge: "PT-BR",
    searchPlaceholder:
      "Buscar previsoes, incidentes, lancamentos ou sinais da comunidade...",
    topLinks: [...topLinks],
    categories: [
      {
        id: "em-alta",
        label: "Em alta",
        href: "#markets",
      },
      ...categories.map((category) => ({
        id: slugify(category),
        label: category,
        href: "#markets",
      })),
    ],
  });
}

export async function getHomeNavigation() {
  const data = await getHomeFeedData();

  return data.navigation;
}

export async function getHomeFeedData(): Promise<HomeFeedData> {
  const rows = await listEventRows(eq(predictionEvents.status, "active"));
  const marketCards = rows.map(buildMarketCard);
  const featuredRow = rows[0];

  if (!featuredRow) {
    throw new Error("Nenhum mercado ativo disponivel para montar a home.");
  }

  return homeFeedDataSchema.parse({
    navigation: buildHomeNavigation(marketCards),
    featuredMarket: buildFeaturedMarket(featuredRow, rows),
    sidebar: buildSidebar(rows),
    openMarkets: {
      title: "Radar da comunidade",
      tabs: [
        { id: "tudo", label: "Tudo" },
        ...normalizeList(
          marketCards.flatMap((market) =>
            market.tags.filter((tag) => tag !== "Tudo"),
          ),
        ).map((tag) => ({
          id: slugify(tag),
          label: tag,
        })),
      ],
      items: marketCards,
    },
  });
}

export async function getRadarMarketDetailBySlug(
  marketSlug: string,
): Promise<RadarMarketDetail | null> {
  const [selectedRow] = await listEventRows(
    eq(predictionEvents.slug, marketSlug),
  );

  if (!selectedRow) {
    return null;
  }

  const rowsForRelated = await listEventRows(
    eq(predictionEvents.status, "active"),
  );
  const state = getEventMarketState(selectedRow);
  const yesScore = probabilityToSignalScore(state.currentProbability);
  const noScore = invertSignalScore(yesScore);
  const baseIntensity = Math.max(state.watcherCount, 1);

  return radarMarketDetailSchema.parse({
    id: selectedRow.event.slug,
    title: selectedRow.event.title,
    subtitle: selectedRow.event.subCategory,
    category: selectedRow.event.category,
    iconLabel: selectedRow.event.iconLabel,
    tags: buildMarketTags(selectedRow),
    probability: state.currentProbability,
    movementLabel: state.movementLabel,
    direction: state.direction,
    tone: selectedRow.event.tone,
    volumeLabel: formatWatcherCountLabel(state.watcherCount),
    closeLabel: formatCloseLabel(selectedRow.event.expiresAt),
    yesLabel: selectedRow.event.yesLabel,
    noLabel: selectedRow.event.noLabel,
    yesScore,
    noScore,
    overview: selectedRow.event.overview,
    rules: selectedRow.event.rules.length
      ? selectedRow.event.rules
      : [selectedRow.event.description],
    context: selectedRow.event.contextNotes.length
      ? selectedRow.event.contextNotes
      : [selectedRow.event.description],
    chart: {
      yAxisTicks: chartTicks,
      points: buildChartPoints(selectedRow),
    },
    communityPulse: [
      {
        id: "support-1",
        sentiment: "support",
        score: clamp(yesScore - 2, 1, 99),
        intensityLabel: formatCompactCredits(baseIntensity * 12),
      },
      {
        id: "support-2",
        sentiment: "support",
        score: clamp(yesScore - 1, 1, 99),
        intensityLabel: formatCompactCredits(baseIntensity * 18),
      },
      {
        id: "counter-1",
        sentiment: "counter",
        score: clamp(noScore - 1, 1, 99),
        intensityLabel: formatCompactCredits(baseIntensity * 10),
      },
      {
        id: "counter-2",
        sentiment: "counter",
        score: noScore,
        intensityLabel: formatCompactCredits(baseIntensity * 15),
      },
    ],
    relatedMarkets: buildRelatedMarkets(selectedRow, rowsForRelated)
      .filter((row) => row.event.id !== selectedRow.event.id)
      .map((row) => ({
        id: row.event.slug,
        title: row.event.title,
        probability: getEventMarketState(row).currentProbability,
        iconLabel: row.event.iconLabel,
        tone: row.event.tone,
      })),
    participationConfig: {
      initialCredits: selectedRow.event.initialCredits,
      minimumCredits: selectedRow.event.minimumCredits,
      quickCredits: normalizeList([
        `${selectedRow.event.minimumCredits}`,
        `${selectedRow.event.minimumCredits * 2}`,
        "250",
        "500",
      ]).map((value) => Number(value)),
    },
  });
}

function buildUsernameSeed(viewer: ViewerIdentity) {
  const base = slugify(
    viewer.name || viewer.email.split("@")[0] || "usuario",
  ).replace(/-/g, "");

  return `${base.slice(0, 28) || "usuario"}${viewer.id
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 6)
    .toLowerCase()}`.slice(0, 40);
}

export async function syncViewerProfile(viewer: ViewerIdentity) {
  await ensurePredictionCatalogBootstrapped();

  const db = getDb();
  const [existingProfile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.authUserId, viewer.id))
    .limit(1);
  const nextDisplayName =
    viewer.name.trim() || viewer.email.split("@")[0] || "Usuario";

  if (existingProfile) {
    const [updatedProfile] = await db
      .update(profiles)
      .set({
        displayName: nextDisplayName,
        avatarUrl: viewer.image,
        updatedAt: new Date(),
      })
      .where(eq(profiles.id, existingProfile.id))
      .returning();

    return updatedProfile;
  }

  const [createdProfile] = await db
    .insert(profiles)
    .values({
      authUserId: viewer.id,
      username: buildUsernameSeed(viewer),
      displayName: nextDisplayName,
      avatarUrl: viewer.image,
    })
    .returning();

  return createdProfile;
}

async function buildUniqueSlug(title: string) {
  const db = getDb();
  const baseSlug = slugify(title) || crypto.randomUUID();
  let suffix = 0;

  while (suffix < 20) {
    const nextSlug = suffix === 0 ? baseSlug : `${baseSlug}-${suffix + 1}`;
    const [existingEvent] = await db
      .select({ id: predictionEvents.id })
      .from(predictionEvents)
      .where(eq(predictionEvents.slug, nextSlug))
      .limit(1);

    if (!existingEvent) {
      return nextSlug;
    }

    suffix += 1;
  }

  return `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;
}

export async function createPredictionMarket(
  viewer: ViewerIdentity,
  input: CreatePredictionMarketInput,
) {
  await ensurePredictionCatalogBootstrapped();

  const payload = createPredictionMarketInputSchema.parse(input);
  const profile = await syncViewerProfile(viewer);
  const db = getDb();
  const slug = await buildUniqueSlug(payload.title);
  const normalizedTags = normalizeTags(payload.tags, payload.category);
  const [createdEvent] = await db
    .insert(predictionEvents)
    .values({
      createdByProfileId: profile.id,
      slug,
      title: payload.title,
      description: payload.description,
      overview: payload.overview,
      category: payload.category,
      subCategory: payload.subCategory,
      iconLabel: payload.iconLabel.toUpperCase(),
      tone: payload.tone,
      yesLabel: payload.yesLabel,
      noLabel: payload.noLabel,
      tags: normalizedTags,
      rules: normalizeList(payload.rules),
      contextNotes: normalizeList(payload.context),
      status: "active",
      communityProbability: payload.initialProbability,
      severityScore: payload.initialProbability,
      featured: false,
      watcherCount: 1,
      volumeCredits: 0,
      minimumCredits: 50,
      initialCredits: 1000,
      expiresAt: new Date(payload.closesAt),
    })
    .returning();

  await db.insert(predictionEventSnapshots).values({
    predictionEventId: createdEvent.id,
    probability: payload.initialProbability,
    watcherCount: 1,
    volumeCredits: 0,
  });

  return {
    market: {
      id: createdEvent.id,
      slug: createdEvent.slug,
      title: createdEvent.title,
    },
  };
}

export async function listMarketsCreatedByViewer(viewer: ViewerIdentity) {
  const profile = await syncViewerProfile(viewer);
  const rows = await listEventRows(
    eq(predictionEvents.createdByProfileId, profile.id),
  );

  return rows.map((row) => ({
    id: row.event.id,
    slug: row.event.slug,
    title: row.event.title,
    status: row.event.status,
    probability: getEventMarketState(row).currentProbability,
    movementLabel: getEventMarketState(row).movementLabel,
    closeLabel: formatCloseLabel(row.event.expiresAt),
    tone: row.event.tone,
  }));
}
