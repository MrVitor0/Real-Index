import "server-only";

import { and, asc, desc, eq, inArray } from "drizzle-orm";

import type {
  RadarForecastAccountState,
  RadarForecastExecutionRequest,
  RadarForecastPreviewRequest,
  RadarForecastPreviewResponse,
} from "@/features/market-detail/contracts/radar-market-detail";
import { RADAR_FORECAST_CLOSE_ALL_CREDITS_INPUT } from "@/features/market-detail/contracts/radar-market-detail";
import type { NavbarBalance } from "@/features/account/contracts/navbar-balance";
import {
  formatCredits,
  parseCreditsInput,
} from "@/features/market-detail/lib/forecast";
import {
  buildForecastPortfolioSummary,
  executeForecastEntry,
  executeForecastExit,
  executeForecastFlip,
  getForecastPosition,
  previewForecastEntry,
  previewForecastExit,
  previewForecastFlip,
  type ForecastEntryPreview,
  type ForecastExitPreview,
  type ForecastFlipPreview,
  type ForecastMarket,
  type ForecastPortfolio,
} from "@/features/market-detail/lib/forecast-engine";
import { recordPlatformActivity } from "@/server/activity/log";
import { getDb } from "@/server/db/client";
import {
  forecastLedgerEntries,
  predictionEvents,
  predictionEventSnapshots,
  predictionPositions,
  profiles,
  type PredictionEvent,
  type PredictionEventSnapshot,
  type PredictionPosition,
  type Profile,
} from "@/server/db/schema";
import {
  getRadarMarketDetailBySlug,
  syncViewerProfile,
} from "@/server/markets/catalog";

type ViewerIdentity = {
  id: string;
  email: string;
  name: string;
  image: string | null;
};

type TradingEventRow = {
  event: PredictionEvent;
  snapshots: PredictionEventSnapshot[];
};

type PortfolioContext = {
  profile: Profile;
  portfolio: ForecastPortfolio;
  marketsById: Map<string, ForecastMarket>;
  eventRowsById: Map<string, TradingEventRow>;
};

const shareFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundValue(value: number) {
  return Number(value.toFixed(6));
}

function formatSignedCredits(value: number) {
  const absoluteValue = Math.abs(value);
  const prefix = value > 0 ? "+" : value < 0 ? "-" : "";

  return prefix
    ? `${prefix} ${formatCredits(absoluteValue)}`
    : formatCredits(absoluteValue);
}

function formatShares(value: number) {
  return `${shareFormatter.format(roundValue(value))} cotas`;
}

function getCurrentProbability(row: TradingEventRow) {
  return row.snapshots.at(-1)?.probability ?? row.event.communityProbability;
}

function getCurrentWatcherCount(row: TradingEventRow) {
  return row.snapshots.at(-1)?.watcherCount ?? row.event.watcherCount;
}

function getCurrentVolumeCredits(row: TradingEventRow) {
  return row.snapshots.at(-1)?.volumeCredits ?? row.event.volumeCredits;
}

function toForecastMarket(row: TradingEventRow): ForecastMarket {
  return {
    id: row.event.id,
    probability: getCurrentProbability(row),
    minimumCredits: row.event.minimumCredits,
    status: row.event.status === "resolved" ? "resolved" : "open",
    resolvedOutcome: row.event.resolvedOutcome ?? undefined,
  };
}

function assertActiveEvent(row: TradingEventRow) {
  if (row.event.status !== "active") {
    throw new Error("Esse radar nao aceita novas operacoes agora.");
  }
}

async function getTradingEventRowBySlug(
  marketSlug: string,
): Promise<TradingEventRow | null> {
  const db = getDb();
  const [event] = await db
    .select()
    .from(predictionEvents)
    .where(eq(predictionEvents.slug, marketSlug))
    .limit(1);

  if (!event) {
    return null;
  }

  const snapshots = await db
    .select()
    .from(predictionEventSnapshots)
    .where(eq(predictionEventSnapshots.predictionEventId, event.id))
    .orderBy(asc(predictionEventSnapshots.createdAt));

  return {
    event,
    snapshots,
  };
}

async function getTradingEventRowsByIds(eventIds: string[]) {
  if (!eventIds.length) {
    return [] as TradingEventRow[];
  }

  const db = getDb();
  const [events, snapshots] = await Promise.all([
    db
      .select()
      .from(predictionEvents)
      .where(inArray(predictionEvents.id, eventIds)),
    db
      .select()
      .from(predictionEventSnapshots)
      .where(inArray(predictionEventSnapshots.predictionEventId, eventIds))
      .orderBy(asc(predictionEventSnapshots.createdAt)),
  ]);
  const snapshotsByEventId = new Map<string, PredictionEventSnapshot[]>();

  for (const snapshot of snapshots) {
    const items = snapshotsByEventId.get(snapshot.predictionEventId) ?? [];
    items.push(snapshot);
    snapshotsByEventId.set(snapshot.predictionEventId, items);
  }

  return events.map<TradingEventRow>((event) => ({
    event,
    snapshots: snapshotsByEventId.get(event.id) ?? [],
  }));
}

function toForecastPortfolio(
  profile: Profile,
  positions: PredictionPosition[],
) {
  return {
    participantId: profile.id,
    availableCredits: profile.availableCredits,
    realizedDeltaCredits: profile.realizedDeltaCredits,
    positions: positions.map((position) => ({
      marketId: position.predictionEventId,
      side: position.side,
      shares: position.shares,
      investedCredits: position.investedCredits,
      averageEntryPrice: position.averageEntryPrice,
    })),
    ledger: [],
  } satisfies ForecastPortfolio;
}

async function getPortfolioContext(
  viewer: ViewerIdentity,
): Promise<PortfolioContext> {
  const profile = await syncViewerProfile(viewer);
  const db = getDb();
  const positionRows = await db
    .select()
    .from(predictionPositions)
    .where(eq(predictionPositions.profileId, profile.id))
    .orderBy(desc(predictionPositions.updatedAt));
  const portfolio = toForecastPortfolio(profile, positionRows);
  const eventRows = await getTradingEventRowsByIds(
    positionRows.map((position) => position.predictionEventId),
  );
  const marketsById = new Map(
    eventRows.map((row) => [row.event.id, toForecastMarket(row)]),
  );
  const eventRowsById = new Map(eventRows.map((row) => [row.event.id, row]));

  return {
    profile,
    portfolio,
    marketsById,
    eventRowsById,
  };
}

function buildAnonymousForecastAccountState(): RadarForecastAccountState {
  return {
    authStatus: "anonymous",
    availableCredits: 0,
    availableCreditsLabel: formatCredits(0),
    realizedDeltaCredits: 0,
    realizedDeltaLabel: formatSignedCredits(0),
    investedCredits: 0,
    investedCreditsLabel: formatCredits(0),
    totalEquityCredits: 0,
    totalEquityLabel: formatCredits(0),
    openPositions: 0,
    openPosition: null,
  };
}

function buildAnonymousNavbarBalance(): NavbarBalance {
  return {
    authStatus: "anonymous",
    availableCredits: 0,
    availableCreditsLabel: formatCredits(0),
  };
}

function buildForecastAccountState(input: {
  portfolio: ForecastPortfolio;
  markets: ForecastMarket[];
  targetMarketId: string;
  targetMarketLabels: {
    yesLabel: string;
    noLabel: string;
  };
}): RadarForecastAccountState {
  const summary = buildForecastPortfolioSummary(input.portfolio, input.markets);
  const currentPosition = summary.positionSnapshots.find(
    (position) => position.marketId === input.targetMarketId,
  );

  return {
    authStatus: "authenticated",
    availableCredits: summary.availableCredits,
    availableCreditsLabel: formatCredits(summary.availableCredits),
    realizedDeltaCredits: summary.realizedDeltaCredits,
    realizedDeltaLabel: formatSignedCredits(summary.realizedDeltaCredits),
    investedCredits: summary.investedCredits,
    investedCreditsLabel: formatCredits(summary.investedCredits),
    totalEquityCredits: summary.totalEquityCredits,
    totalEquityLabel: formatCredits(summary.totalEquityCredits),
    openPositions: summary.openPositions,
    openPosition: currentPosition
      ? {
          side: currentPosition.side,
          sideLabel:
            currentPosition.side === "yes"
              ? input.targetMarketLabels.yesLabel
              : input.targetMarketLabels.noLabel,
          shares: currentPosition.shares,
          sharesLabel: formatShares(currentPosition.shares),
          investedCredits: currentPosition.investedCredits,
          investedCreditsLabel: formatCredits(currentPosition.investedCredits),
          marketValueCredits: currentPosition.currentMarketValueCredits,
          marketValueCreditsLabel: formatCredits(
            currentPosition.currentMarketValueCredits,
          ),
          unrealizedDeltaCredits: currentPosition.unrealizedDeltaCredits,
          unrealizedDeltaLabel: formatSignedCredits(
            currentPosition.unrealizedDeltaCredits,
          ),
          averageEntryPrice: currentPosition.averageEntryPrice,
          averageEntryPriceLabel: `${currentPosition.averageEntryPrice.toLocaleString(
            "pt-BR",
            {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            },
          )} por cota`,
        }
      : null,
  };
}

export async function getViewerForecastMarketState(
  viewer: ViewerIdentity | null,
  marketSlug: string,
): Promise<RadarForecastAccountState> {
  if (!viewer) {
    return buildAnonymousForecastAccountState();
  }

  const [portfolioContext, marketRow] = await Promise.all([
    getPortfolioContext(viewer),
    getTradingEventRowBySlug(marketSlug),
  ]);

  if (!marketRow) {
    throw new Error("Mercado nao encontrado.");
  }

  const market = toForecastMarket(marketRow);
  const markets = [...portfolioContext.marketsById.values()];

  if (!portfolioContext.marketsById.has(market.id)) {
    markets.push(market);
  }

  return buildForecastAccountState({
    portfolio: portfolioContext.portfolio,
    markets,
    targetMarketId: market.id,
    targetMarketLabels: {
      yesLabel: marketRow.event.yesLabel,
      noLabel: marketRow.event.noLabel,
    },
  });
}

export async function getViewerForecastBalance(
  viewer: ViewerIdentity | null,
): Promise<NavbarBalance> {
  if (!viewer) {
    return buildAnonymousNavbarBalance();
  }

  const profile = await syncViewerProfile(viewer);

  return {
    authStatus: "authenticated",
    availableCredits: profile.availableCredits,
    availableCreditsLabel: formatCredits(profile.availableCredits),
  };
}
function buildOperationPreviewLabels(input: {
  preview: ForecastEntryPreview | ForecastExitPreview | ForecastFlipPreview;
  yesLabel: string;
  noLabel: string;
}): RadarForecastPreviewResponse {
  const { preview, yesLabel, noLabel } = input;

  if (preview.kind === "entry") {
    return {
      kind: "entry",
      actionLabel: "Confirmar forecast",
      positionLabel: preview.side === "yes" ? yesLabel : noLabel,
      credits: preview.spendCredits,
      creditsLabel: formatCredits(preview.spendCredits),
      sharesLabel: formatShares(preview.shares),
      balanceAfterLabel: formatCredits(preview.availableCreditsAfter),
      deltaLabel: `Max ganho ${formatCredits(preview.maxGainCredits)}`,
      exposureLabel: `Liquidacao potencial ${formatCredits(preview.potentialSettlementCredits)}`,
      helperLabel: `Entrada a ${preview.pricePerShareCredits.toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      )} por cota.`,
    };
  }

  if (preview.kind === "exit") {
    return {
      kind: "exit",
      actionLabel: "Comprar credits",
      positionLabel: preview.side === "yes" ? yesLabel : noLabel,
      credits: preview.creditsReleased,
      creditsLabel: formatCredits(preview.creditsReleased),
      sharesLabel: formatShares(preview.sharesToExit),
      balanceAfterLabel: formatCredits(preview.availableCreditsAfter),
      deltaLabel: `Resultado ${formatSignedCredits(preview.realizedDeltaCredits)}`,
      exposureLabel: preview.positionAfter
        ? `Restam ${formatShares(preview.positionAfter.shares)}`
        : "Posicao encerrada.",
      helperLabel: `Saida a ${preview.pricePerShareCredits.toLocaleString(
        "pt-BR",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        },
      )} por cota.`,
    };
  }

  return {
    kind: "flip",
    actionLabel: "Virar leitura",
    positionLabel: `${preview.fromSide === "yes" ? yesLabel : noLabel} → ${preview.toSide === "yes" ? yesLabel : noLabel}`,
    credits: preview.openedPosition.spendCredits,
    creditsLabel: formatCredits(preview.openedPosition.spendCredits),
    sharesLabel: formatShares(preview.openedPosition.shares),
    balanceAfterLabel: formatCredits(preview.availableCreditsAfter),
    deltaLabel: `Resultado ${formatSignedCredits(preview.realizedDeltaCredits)}`,
    exposureLabel: `Nova liquidacao potencial ${formatCredits(preview.openedPosition.potentialSettlementCredits)}`,
    helperLabel: "A posicao atual sera encerrada antes da nova entrada.",
  };
}

function resolveOperationPreview(input: {
  portfolio: ForecastPortfolio;
  market: ForecastMarket;
  request: RadarForecastPreviewRequest | RadarForecastExecutionRequest;
}) {
  const credits = parseCreditsInput(input.request.creditsInput);
  const currentPosition = getForecastPosition(input.portfolio, input.market.id);
  const shouldCloseAll =
    input.request.mode === "exit" &&
    input.request.creditsInput === RADAR_FORECAST_CLOSE_ALL_CREDITS_INPUT;

  if (input.request.mode === "exit") {
    return previewForecastExit({
      portfolio: input.portfolio,
      market: input.market,
      plan: shouldCloseAll
        ? {
            closeAll: true,
          }
        : {
            creditsToRelease: credits,
          },
    });
  }

  if (currentPosition && currentPosition.side !== input.request.position) {
    return previewForecastFlip({
      portfolio: input.portfolio,
      market: input.market,
      nextSide: input.request.position,
      spendCredits: credits,
    });
  }

  return previewForecastEntry({
    portfolio: input.portfolio,
    market: input.market,
    side: input.request.position,
    spendCredits: credits,
  });
}

function resolveOperationExecution(input: {
  portfolio: ForecastPortfolio;
  market: ForecastMarket;
  request: RadarForecastExecutionRequest;
}) {
  const credits = parseCreditsInput(input.request.creditsInput);
  const currentPosition = getForecastPosition(input.portfolio, input.market.id);
  const shouldCloseAll =
    input.request.mode === "exit" &&
    input.request.creditsInput === RADAR_FORECAST_CLOSE_ALL_CREDITS_INPUT;

  if (input.request.mode === "exit") {
    return executeForecastExit({
      portfolio: input.portfolio,
      market: input.market,
      plan: shouldCloseAll
        ? {
            closeAll: true,
          }
        : {
            creditsToRelease: credits,
          },
    });
  }

  if (currentPosition && currentPosition.side !== input.request.position) {
    return executeForecastFlip({
      portfolio: input.portfolio,
      market: input.market,
      nextSide: input.request.position,
      spendCredits: credits,
    });
  }

  return executeForecastEntry({
    portfolio: input.portfolio,
    market: input.market,
    side: input.request.position,
    spendCredits: credits,
  });
}

function calculateProbabilityShift(input: {
  currentProbability: number;
  currentVolumeCredits: number;
  watcherCount: number;
  preview: ForecastEntryPreview | ForecastExitPreview | ForecastFlipPreview;
}) {
  const currentProbability = input.currentProbability;
  const baseCredits =
    input.preview.kind === "entry"
      ? input.preview.spendCredits
      : input.preview.kind === "exit"
        ? input.preview.creditsReleased
        : input.preview.closedPosition.creditsReleased +
          input.preview.openedPosition.spendCredits;
  const attentionFactor = Math.log10(Math.max(input.watcherCount, 10));
  const volumeFactor = Math.log10(
    Math.max(input.currentVolumeCredits + baseCredits, 10),
  );
  const magnitude = clamp(
    Math.round(
      Math.log10(Math.max(baseCredits, 1) + 10) * 3.2 -
        attentionFactor * 0.9 -
        volumeFactor * 0.45,
    ),
    1,
    7,
  );

  let signedShift = 0;

  if (input.preview.kind === "entry") {
    signedShift = input.preview.side === "yes" ? magnitude : -magnitude;
  } else if (input.preview.kind === "exit") {
    signedShift = input.preview.side === "yes" ? -magnitude : magnitude;
  } else {
    signedShift +=
      input.preview.fromSide === "yes"
        ? -Math.max(1, Math.floor(magnitude / 2))
        : Math.max(1, Math.floor(magnitude / 2));
    signedShift += input.preview.toSide === "yes" ? magnitude : -magnitude;
  }

  return clamp(Math.round(currentProbability + signedShift), 1, 99);
}

function buildExecutionMessage(input: {
  preview: ForecastEntryPreview | ForecastExitPreview | ForecastFlipPreview;
  yesLabel: string;
  noLabel: string;
}) {
  const { preview, yesLabel, noLabel } = input;

  if (preview.kind === "entry") {
    return `Forecast reforcado em ${preview.side === "yes" ? yesLabel : noLabel}.`;
  }

  if (preview.kind === "exit") {
    return `Credits liberados da leitura ${preview.side === "yes" ? yesLabel : noLabel}.`;
  }

  return `Leitura virou para ${preview.toSide === "yes" ? yesLabel : noLabel}.`;
}

function resolveForecastActivity(
  preview: ForecastEntryPreview | ForecastExitPreview | ForecastFlipPreview,
) {
  if (preview.kind === "entry") {
    return {
      type: "forecast_entry" as const,
      fromSide: null,
      toSide: preview.side,
      creditsAmount: preview.spendCredits,
      sharesAmount: preview.shares,
    };
  }

  if (preview.kind === "exit") {
    return {
      type: "forecast_exit" as const,
      fromSide: null,
      toSide: preview.side,
      creditsAmount: preview.creditsReleased,
      sharesAmount: preview.sharesToExit,
    };
  }

  return {
    type: "forecast_flip" as const,
    fromSide: preview.fromSide,
    toSide: preview.toSide,
    creditsAmount: preview.openedPosition.spendCredits,
    sharesAmount: preview.openedPosition.shares,
  };
}

async function persistOperationResult(input: {
  profile: Profile;
  eventRow: TradingEventRow;
  portfolioBefore: ForecastPortfolio;
  portfolioAfter: ForecastPortfolio;
  preview: ForecastEntryPreview | ForecastExitPreview | ForecastFlipPreview;
}) {
  const db = getDb();
  const persistenceTimestamp = new Date();
  const nextPosition = getForecastPosition(
    input.portfolioAfter,
    input.eventRow.event.id,
  );
  const currentPosition = getForecastPosition(
    input.portfolioBefore,
    input.eventRow.event.id,
  );
  const nextProbability = calculateProbabilityShift({
    currentProbability: getCurrentProbability(input.eventRow),
    currentVolumeCredits: getCurrentVolumeCredits(input.eventRow),
    watcherCount: getCurrentWatcherCount(input.eventRow),
    preview: input.preview,
  });
  const nextVolumeCredits = Math.round(
    getCurrentVolumeCredits(input.eventRow) +
      (input.preview.kind === "entry"
        ? input.preview.spendCredits
        : input.preview.kind === "exit"
          ? input.preview.creditsReleased
          : input.preview.closedPosition.creditsReleased +
            input.preview.openedPosition.spendCredits),
  );
  const nextWatcherCount = Math.max(
    getCurrentWatcherCount(input.eventRow) +
      (currentPosition ? 0 : nextPosition ? 1 : 0),
    1,
  );
  const newLedgerEntries = input.portfolioAfter.ledger;

  await db
    .update(profiles)
    .set({
      availableCredits: input.portfolioAfter.availableCredits,
      realizedDeltaCredits: input.portfolioAfter.realizedDeltaCredits,
      updatedAt: persistenceTimestamp,
    })
    .where(eq(profiles.id, input.profile.id));

  if (!nextPosition) {
    await db
      .delete(predictionPositions)
      .where(
        and(
          eq(predictionPositions.profileId, input.profile.id),
          eq(predictionPositions.predictionEventId, input.eventRow.event.id),
        ),
      );
  }

  if (currentPosition && nextPosition) {
    await db
      .update(predictionPositions)
      .set({
        side: nextPosition.side,
        shares: nextPosition.shares,
        investedCredits: nextPosition.investedCredits,
        averageEntryPrice: nextPosition.averageEntryPrice,
        updatedAt: persistenceTimestamp,
      })
      .where(
        and(
          eq(predictionPositions.profileId, input.profile.id),
          eq(predictionPositions.predictionEventId, input.eventRow.event.id),
        ),
      );
  }

  if (!currentPosition && nextPosition) {
    await db.insert(predictionPositions).values({
      profileId: input.profile.id,
      predictionEventId: input.eventRow.event.id,
      side: nextPosition.side,
      shares: nextPosition.shares,
      investedCredits: nextPosition.investedCredits,
      averageEntryPrice: nextPosition.averageEntryPrice,
    });
  }

  if (newLedgerEntries.length) {
    await db.insert(forecastLedgerEntries).values(
      newLedgerEntries.map((entry) => ({
        profileId: input.profile.id,
        predictionEventId: entry.marketId ?? null,
        type: entry.type,
        side: entry.side ?? null,
        creditsDelta: entry.creditsDelta,
        sharesDelta: entry.sharesDelta,
        executionPrice: entry.executionPrice ?? null,
        realizedDeltaCredits: entry.realizedDeltaCredits,
      })),
    );
  }

  await db
    .update(predictionEvents)
    .set({
      communityProbability: nextProbability,
      severityScore: nextProbability,
      watcherCount: nextWatcherCount,
      volumeCredits: nextVolumeCredits,
      updatedAt: persistenceTimestamp,
    })
    .where(eq(predictionEvents.id, input.eventRow.event.id));

  await db.insert(predictionEventSnapshots).values({
    predictionEventId: input.eventRow.event.id,
    probability: nextProbability,
    watcherCount: nextWatcherCount,
    volumeCredits: nextVolumeCredits,
    createdAt: persistenceTimestamp,
  });

  await recordPlatformActivity({
    actorProfileId: input.profile.id,
    predictionEventId: input.eventRow.event.id,
    createdAt: persistenceTimestamp,
    ...resolveForecastActivity(input.preview),
  });
}

export async function previewViewerForecastOperation(input: {
  viewer: ViewerIdentity;
  marketSlug: string;
  request: RadarForecastPreviewRequest;
}) {
  const [portfolioContext, eventRow] = await Promise.all([
    getPortfolioContext(input.viewer),
    getTradingEventRowBySlug(input.marketSlug),
  ]);

  if (!eventRow) {
    throw new Error("Mercado nao encontrado.");
  }

  assertActiveEvent(eventRow);

  const preview = resolveOperationPreview({
    portfolio: portfolioContext.portfolio,
    market: toForecastMarket(eventRow),
    request: input.request,
  });

  return buildOperationPreviewLabels({
    preview,
    yesLabel: eventRow.event.yesLabel,
    noLabel: eventRow.event.noLabel,
  });
}

export async function executeViewerForecastOperation(input: {
  viewer: ViewerIdentity;
  marketSlug: string;
  request: RadarForecastExecutionRequest;
}) {
  const [portfolioContext, eventRow] = await Promise.all([
    getPortfolioContext(input.viewer),
    getTradingEventRowBySlug(input.marketSlug),
  ]);

  if (!eventRow) {
    throw new Error("Mercado nao encontrado.");
  }

  assertActiveEvent(eventRow);

  const execution = resolveOperationExecution({
    portfolio: portfolioContext.portfolio,
    market: toForecastMarket(eventRow),
    request: input.request,
  });

  await persistOperationResult({
    profile: portfolioContext.profile,
    eventRow,
    portfolioBefore: portfolioContext.portfolio,
    portfolioAfter: execution.portfolio,
    preview: execution.preview,
  });

  const [market, viewerState] = await Promise.all([
    getRadarMarketDetailBySlug(input.marketSlug),
    getViewerForecastMarketState(input.viewer, input.marketSlug),
  ]);

  if (!market) {
    throw new Error("Mercado nao encontrado apos a operacao.");
  }

  return {
    kind: execution.preview.kind,
    message: buildExecutionMessage({
      preview: execution.preview,
      yesLabel: eventRow.event.yesLabel,
      noLabel: eventRow.event.noLabel,
    }),
    market,
    viewerState,
  };
}

export async function getViewerForecastAccountSummary(viewer: ViewerIdentity) {
  const portfolioContext = await getPortfolioContext(viewer);
  const summary = buildForecastPortfolioSummary(portfolioContext.portfolio, [
    ...portfolioContext.marketsById.values(),
  ]);
  const positions = summary.positionSnapshots
    .map((positionSnapshot) => {
      const eventRow = portfolioContext.eventRowsById.get(
        positionSnapshot.marketId,
      );

      if (!eventRow) {
        return null;
      }

      return {
        id: eventRow.event.id,
        slug: eventRow.event.slug,
        title: eventRow.event.title,
        probability: getCurrentProbability(eventRow),
        side: positionSnapshot.side,
        sideLabel:
          positionSnapshot.side === "yes"
            ? eventRow.event.yesLabel
            : eventRow.event.noLabel,
        sharesLabel: formatShares(positionSnapshot.shares),
        investedCreditsLabel: formatCredits(positionSnapshot.investedCredits),
        marketValueCreditsLabel: formatCredits(
          positionSnapshot.currentMarketValueCredits,
        ),
        unrealizedDeltaLabel: formatSignedCredits(
          positionSnapshot.unrealizedDeltaCredits,
        ),
        closeLabel: eventRow.event.expiresAt
          ? new Intl.DateTimeFormat("pt-BR", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(eventRow.event.expiresAt)
          : "Sem janela definida",
      };
    })
    .filter((position) => position !== null);

  return {
    availableCredits: summary.availableCredits,
    availableCreditsLabel: formatCredits(summary.availableCredits),
    investedCredits: summary.investedCredits,
    investedCreditsLabel: formatCredits(summary.investedCredits),
    marketValueCredits: summary.marketValueCredits,
    marketValueCreditsLabel: formatCredits(summary.marketValueCredits),
    totalEquityCredits: summary.totalEquityCredits,
    totalEquityLabel: formatCredits(summary.totalEquityCredits),
    realizedDeltaCredits: summary.realizedDeltaCredits,
    realizedDeltaLabel: formatSignedCredits(summary.realizedDeltaCredits),
    unrealizedDeltaCredits: summary.unrealizedDeltaCredits,
    unrealizedDeltaLabel: formatSignedCredits(summary.unrealizedDeltaCredits),
    openPositions: summary.openPositions,
    positions,
  };
}
