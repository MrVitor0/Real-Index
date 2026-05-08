export type ForecastSide = "yes" | "no";

export type ForecastMarketStatus = "open" | "resolved";

export type ForecastMarket = {
  id: string;
  probability: number;
  minimumCredits: number;
  status?: ForecastMarketStatus;
  resolvedOutcome?: ForecastSide;
};

export type ForecastPosition = {
  marketId: string;
  side: ForecastSide;
  shares: number;
  investedCredits: number;
  averageEntryPrice: number;
};

export type ForecastLedgerEntryType =
  | "grant"
  | "entry"
  | "exit"
  | "flip-exit"
  | "flip-entry"
  | "settlement";

export type ForecastLedgerEntry = {
  type: ForecastLedgerEntryType;
  marketId?: string;
  side?: ForecastSide;
  creditsDelta: number;
  sharesDelta: number;
  executionPrice?: number;
  realizedDeltaCredits: number;
};

export type ForecastPortfolio = {
  participantId: string;
  availableCredits: number;
  realizedDeltaCredits: number;
  positions: ForecastPosition[];
  ledger: ForecastLedgerEntry[];
};

export type ForecastQuote = {
  yesPriceCredits: number;
  noPriceCredits: number;
};

export type ForecastPositionSnapshot = {
  marketId: string;
  side: ForecastSide;
  shares: number;
  investedCredits: number;
  averageEntryPrice: number;
  currentPriceCredits: number;
  currentMarketValueCredits: number;
  unrealizedDeltaCredits: number;
  potentialSettlementCredits: number;
};

export type ForecastPortfolioSummary = {
  availableCredits: number;
  investedCredits: number;
  marketValueCredits: number;
  totalEquityCredits: number;
  realizedDeltaCredits: number;
  unrealizedDeltaCredits: number;
  openPositions: number;
  positionSnapshots: ForecastPositionSnapshot[];
};

export type ForecastEntryPreview = {
  kind: "entry";
  side: ForecastSide;
  spendCredits: number;
  shares: number;
  pricePerShareCredits: number;
  potentialSettlementCredits: number;
  maxGainCredits: number;
  maxLossCredits: number;
  availableCreditsAfter: number;
  positionAfter: ForecastPositionSnapshot;
};

export type ForecastExitPreview = {
  kind: "exit";
  side: ForecastSide;
  sharesToExit: number;
  pricePerShareCredits: number;
  creditsReleased: number;
  costBasisReleasedCredits: number;
  realizedDeltaCredits: number;
  availableCreditsAfter: number;
  positionAfter: ForecastPositionSnapshot | null;
};

export type ForecastFlipPreview = {
  kind: "flip";
  fromSide: ForecastSide;
  toSide: ForecastSide;
  closedPosition: ForecastExitPreview;
  openedPosition: ForecastEntryPreview;
  availableCreditsAfter: number;
  realizedDeltaCredits: number;
};

export type ForecastSettlementPreview = {
  kind: "settlement";
  participantId: string;
  side: ForecastSide;
  resolvedOutcome: ForecastSide;
  shares: number;
  didResolveInFavor: boolean;
  creditsReturned: number;
  realizedDeltaCredits: number;
  availableCreditsAfter: number;
};

export type ForecastExecutionResult<TPreview> = {
  portfolio: ForecastPortfolio;
  preview: TPreview;
};

type ForecastExitPlan =
  | {
      closeAll: true;
    }
  | {
      sharesToExit: number;
    }
  | {
      creditsToRelease: number;
    };

const MIN_PRICE = 0.01;
const MAX_PRICE = 0.99;
const PRECISION = 6;
const EPSILON = 1e-6;

export class ForecastEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForecastEngineError";
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function roundValue(value: number) {
  return Number(value.toFixed(PRECISION));
}

function assertForecast(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) {
    throw new ForecastEngineError(message);
  }
}

function assertNonNegativeFinite(value: number, label: string) {
  assertForecast(
    Number.isFinite(value) && value >= 0,
    `${label} precisa ser zero ou maior.`,
  );
}

function assertPositiveFinite(value: number, label: string) {
  assertForecast(
    Number.isFinite(value) && value > 0,
    `${label} precisa ser maior que zero.`,
  );
}

function normalizeCredits(value: number, label: string) {
  assertPositiveFinite(value, label);

  return roundValue(value);
}

function getMarketStatus(market: ForecastMarket): ForecastMarketStatus {
  return market.status ?? "open";
}

function assertMarketOpen(market: ForecastMarket) {
  assertForecast(
    getMarketStatus(market) === "open",
    "Mercado encerrado. So e possivel operar antes da resolucao.",
  );
}

function assertMarketResolved(market: ForecastMarket) {
  assertForecast(
    getMarketStatus(market) === "resolved" && market.resolvedOutcome,
    "Mercado ainda nao foi resolvido pelo oraculo.",
  );
}

function normalizeProbability(probability: number) {
  assertForecast(
    Number.isFinite(probability),
    "Probabilidade invalida para esse mercado.",
  );

  return roundValue(clamp(probability / 100, MIN_PRICE, MAX_PRICE));
}

function getPositionIndex(positions: ForecastPosition[], marketId: string) {
  return positions.findIndex((position) => position.marketId === marketId);
}

function replacePosition(
  positions: ForecastPosition[],
  marketId: string,
  nextPosition: ForecastPosition | null,
) {
  const nextPositions = [...positions];
  const currentPositionIndex = getPositionIndex(nextPositions, marketId);

  if (currentPositionIndex === -1) {
    if (nextPosition) {
      nextPositions.push(nextPosition);
    }

    return nextPositions;
  }

  if (!nextPosition) {
    nextPositions.splice(currentPositionIndex, 1);
    return nextPositions;
  }

  nextPositions[currentPositionIndex] = nextPosition;
  return nextPositions;
}

export function createForecastPortfolio(input: {
  participantId: string;
  initialCredits?: number;
}): ForecastPortfolio {
  const initialCredits = roundValue(input.initialCredits ?? 0);

  assertNonNegativeFinite(initialCredits, "Credits iniciais");

  const ledger =
    initialCredits > 0
      ? [
          {
            type: "grant" as const,
            creditsDelta: initialCredits,
            sharesDelta: 0,
            realizedDeltaCredits: 0,
          },
        ]
      : [];

  return {
    participantId: input.participantId,
    availableCredits: initialCredits,
    realizedDeltaCredits: 0,
    positions: [],
    ledger,
  };
}

export function grantForecastCredits(
  portfolio: ForecastPortfolio,
  credits: number,
): ForecastPortfolio {
  const normalizedCredits = normalizeCredits(credits, "Credits concedidos");

  return {
    ...portfolio,
    availableCredits: roundValue(
      portfolio.availableCredits + normalizedCredits,
    ),
    ledger: [
      ...portfolio.ledger,
      {
        type: "grant",
        creditsDelta: normalizedCredits,
        sharesDelta: 0,
        realizedDeltaCredits: 0,
      },
    ],
  };
}

export function getForecastQuote(market: ForecastMarket): ForecastQuote {
  const yesPriceCredits = normalizeProbability(market.probability);
  const noPriceCredits = roundValue(1 - yesPriceCredits);

  return {
    yesPriceCredits,
    noPriceCredits,
  };
}

export function getForecastPosition(
  portfolio: ForecastPortfolio,
  marketId: string,
): ForecastPosition | null {
  return (
    portfolio.positions.find((position) => position.marketId === marketId) ??
    null
  );
}

function getPriceForSide(market: ForecastMarket, side: ForecastSide) {
  const quote = getForecastQuote(market);

  return side === "yes" ? quote.yesPriceCredits : quote.noPriceCredits;
}

export function buildForecastPositionSnapshot(
  position: ForecastPosition,
  market: ForecastMarket,
): ForecastPositionSnapshot {
  const currentPriceCredits = getPriceForSide(market, position.side);
  const currentMarketValueCredits = roundValue(
    position.shares * currentPriceCredits,
  );

  return {
    marketId: position.marketId,
    side: position.side,
    shares: roundValue(position.shares),
    investedCredits: roundValue(position.investedCredits),
    averageEntryPrice: roundValue(position.averageEntryPrice),
    currentPriceCredits,
    currentMarketValueCredits,
    unrealizedDeltaCredits: roundValue(
      currentMarketValueCredits - position.investedCredits,
    ),
    potentialSettlementCredits: roundValue(position.shares),
  };
}

export function buildForecastPortfolioSummary(
  portfolio: ForecastPortfolio,
  markets: ForecastMarket[],
): ForecastPortfolioSummary {
  const marketsById = new Map(markets.map((market) => [market.id, market]));
  const positionSnapshots = portfolio.positions.map((position) => {
    const market = marketsById.get(position.marketId);

    assertForecast(
      market,
      `Mercado ${position.marketId} ausente para resumir a carteira.`,
    );

    return buildForecastPositionSnapshot(position, market);
  });
  const investedCredits = roundValue(
    positionSnapshots.reduce(
      (totalCredits, snapshot) => totalCredits + snapshot.investedCredits,
      0,
    ),
  );
  const marketValueCredits = roundValue(
    positionSnapshots.reduce(
      (totalCredits, snapshot) =>
        totalCredits + snapshot.currentMarketValueCredits,
      0,
    ),
  );
  const unrealizedDeltaCredits = roundValue(
    marketValueCredits - investedCredits,
  );

  return {
    availableCredits: roundValue(portfolio.availableCredits),
    investedCredits,
    marketValueCredits,
    totalEquityCredits: roundValue(
      portfolio.availableCredits + marketValueCredits,
    ),
    realizedDeltaCredits: roundValue(portfolio.realizedDeltaCredits),
    unrealizedDeltaCredits,
    openPositions: positionSnapshots.length,
    positionSnapshots,
  };
}

export function previewForecastEntry(input: {
  portfolio: ForecastPortfolio;
  market: ForecastMarket;
  side: ForecastSide;
  spendCredits: number;
}): ForecastEntryPreview {
  const { portfolio, market, side } = input;
  const spendCredits = normalizeCredits(
    input.spendCredits,
    "Credits da entrada",
  );

  assertMarketOpen(market);
  assertForecast(
    spendCredits >= market.minimumCredits,
    `O minimo para abrir conviccao e ${roundValue(market.minimumCredits)} credits.`,
  );
  assertForecast(
    portfolio.availableCredits + EPSILON >= spendCredits,
    "Saldo insuficiente para abrir essa posicao.",
  );

  const currentPosition = getForecastPosition(portfolio, market.id);

  assertForecast(
    !currentPosition || currentPosition.side === side,
    "Ja existe uma posicao no lado oposto. Encerre ou inverta antes de seguir.",
  );

  const pricePerShareCredits = getPriceForSide(market, side);
  const shares = roundValue(spendCredits / pricePerShareCredits);

  assertForecast(
    shares > 0,
    "Nao foi possivel calcular a quantidade dessa entrada.",
  );

  const sharesAfter = roundValue((currentPosition?.shares ?? 0) + shares);
  const investedCreditsAfter = roundValue(
    (currentPosition?.investedCredits ?? 0) + spendCredits,
  );
  const averageEntryPrice = roundValue(investedCreditsAfter / sharesAfter);
  const positionAfter = buildForecastPositionSnapshot(
    {
      marketId: market.id,
      side,
      shares: sharesAfter,
      investedCredits: investedCreditsAfter,
      averageEntryPrice,
    },
    market,
  );

  return {
    kind: "entry",
    side,
    spendCredits,
    shares,
    pricePerShareCredits,
    potentialSettlementCredits: roundValue(shares),
    maxGainCredits: roundValue(shares - spendCredits),
    maxLossCredits: spendCredits,
    availableCreditsAfter: roundValue(
      portfolio.availableCredits - spendCredits,
    ),
    positionAfter,
  };
}

function applyEntryPreview(
  portfolio: ForecastPortfolio,
  market: ForecastMarket,
  preview: ForecastEntryPreview,
  type: Extract<ForecastLedgerEntryType, "entry" | "flip-entry">,
): ForecastPortfolio {
  const nextPosition: ForecastPosition = {
    marketId: market.id,
    side: preview.side,
    shares: preview.positionAfter.shares,
    investedCredits: preview.positionAfter.investedCredits,
    averageEntryPrice: preview.positionAfter.averageEntryPrice,
  };

  return {
    ...portfolio,
    availableCredits: preview.availableCreditsAfter,
    positions: replacePosition(portfolio.positions, market.id, nextPosition),
    ledger: [
      ...portfolio.ledger,
      {
        type,
        marketId: market.id,
        side: preview.side,
        creditsDelta: roundValue(-preview.spendCredits),
        sharesDelta: preview.shares,
        executionPrice: preview.pricePerShareCredits,
        realizedDeltaCredits: 0,
      },
    ],
  };
}

export function executeForecastEntry(input: {
  portfolio: ForecastPortfolio;
  market: ForecastMarket;
  side: ForecastSide;
  spendCredits: number;
}): ForecastExecutionResult<ForecastEntryPreview> {
  const preview = previewForecastEntry(input);

  return {
    preview,
    portfolio: applyEntryPreview(
      input.portfolio,
      input.market,
      preview,
      "entry",
    ),
  };
}

function resolveExitShares(
  position: ForecastPosition,
  market: ForecastMarket,
  plan: ForecastExitPlan,
) {
  const pricePerShareCredits = getPriceForSide(market, position.side);

  if ("closeAll" in plan) {
    return roundValue(position.shares);
  }

  if ("sharesToExit" in plan) {
    const sharesToExit = normalizeCredits(
      plan.sharesToExit,
      "Quantidade para encerrar",
    );

    assertForecast(
      sharesToExit <= position.shares + EPSILON,
      "Nao existe quantidade suficiente para encerrar esse volume.",
    );

    return roundValue(Math.min(sharesToExit, position.shares));
  }

  const creditsToRelease = normalizeCredits(
    plan.creditsToRelease,
    "Credits para comprar",
  );
  const maxCreditsToRelease = roundValue(
    position.shares * pricePerShareCredits,
  );

  assertForecast(
    creditsToRelease <= maxCreditsToRelease + EPSILON,
    "Nao existe valor suficiente para comprar essa quantia de credits.",
  );

  return roundValue(
    Math.min(creditsToRelease / pricePerShareCredits, position.shares),
  );
}

export function previewForecastExit(input: {
  portfolio: ForecastPortfolio;
  market: ForecastMarket;
  plan: ForecastExitPlan;
}): ForecastExitPreview {
  const { portfolio, market, plan } = input;

  assertMarketOpen(market);

  const currentPosition = getForecastPosition(portfolio, market.id);

  assertForecast(
    currentPosition,
    "Nao existe posicao ativa para encerrar nesse mercado.",
  );

  const sharesToExit = resolveExitShares(currentPosition, market, plan);
  const pricePerShareCredits = getPriceForSide(market, currentPosition.side);
  const creditsReleased = roundValue(sharesToExit * pricePerShareCredits);
  const costBasisReleasedCredits = roundValue(
    sharesToExit * currentPosition.averageEntryPrice,
  );
  const realizedDeltaCredits = roundValue(
    creditsReleased - costBasisReleasedCredits,
  );
  const remainingShares = roundValue(currentPosition.shares - sharesToExit);
  const remainingInvestedCredits = roundValue(
    currentPosition.investedCredits - costBasisReleasedCredits,
  );
  const positionAfter =
    remainingShares <= EPSILON
      ? null
      : buildForecastPositionSnapshot(
          {
            marketId: market.id,
            side: currentPosition.side,
            shares: remainingShares,
            investedCredits: remainingInvestedCredits,
            averageEntryPrice: roundValue(
              remainingInvestedCredits / remainingShares,
            ),
          },
          market,
        );

  return {
    kind: "exit",
    side: currentPosition.side,
    sharesToExit,
    pricePerShareCredits,
    creditsReleased,
    costBasisReleasedCredits,
    realizedDeltaCredits,
    availableCreditsAfter: roundValue(
      portfolio.availableCredits + creditsReleased,
    ),
    positionAfter,
  };
}

function applyExitPreview(
  portfolio: ForecastPortfolio,
  market: ForecastMarket,
  preview: ForecastExitPreview,
  type: Extract<ForecastLedgerEntryType, "exit" | "flip-exit">,
): ForecastPortfolio {
  const nextPosition =
    preview.positionAfter === null
      ? null
      : {
          marketId: market.id,
          side: preview.side,
          shares: preview.positionAfter.shares,
          investedCredits: preview.positionAfter.investedCredits,
          averageEntryPrice: preview.positionAfter.averageEntryPrice,
        };

  return {
    ...portfolio,
    availableCredits: preview.availableCreditsAfter,
    realizedDeltaCredits: roundValue(
      portfolio.realizedDeltaCredits + preview.realizedDeltaCredits,
    ),
    positions: replacePosition(portfolio.positions, market.id, nextPosition),
    ledger: [
      ...portfolio.ledger,
      {
        type,
        marketId: market.id,
        side: preview.side,
        creditsDelta: preview.creditsReleased,
        sharesDelta: roundValue(-preview.sharesToExit),
        executionPrice: preview.pricePerShareCredits,
        realizedDeltaCredits: preview.realizedDeltaCredits,
      },
    ],
  };
}

export function executeForecastExit(input: {
  portfolio: ForecastPortfolio;
  market: ForecastMarket;
  plan: ForecastExitPlan;
}): ForecastExecutionResult<ForecastExitPreview> {
  const preview = previewForecastExit(input);

  return {
    preview,
    portfolio: applyExitPreview(input.portfolio, input.market, preview, "exit"),
  };
}

export function previewForecastFlip(input: {
  portfolio: ForecastPortfolio;
  market: ForecastMarket;
  nextSide: ForecastSide;
  spendCredits: number;
}): ForecastFlipPreview {
  const { portfolio, market, nextSide, spendCredits } = input;

  assertMarketOpen(market);

  const currentPosition = getForecastPosition(portfolio, market.id);

  assertForecast(
    currentPosition,
    "Nao existe posicao ativa para inverter nesse mercado.",
  );
  assertForecast(
    currentPosition.side !== nextSide,
    "A inversao precisa apontar para o lado oposto da posicao atual.",
  );

  const closedPosition = previewForecastExit({
    portfolio,
    market,
    plan: { closeAll: true },
  });
  const portfolioAfterExit = applyExitPreview(
    portfolio,
    market,
    closedPosition,
    "flip-exit",
  );
  const openedPosition = previewForecastEntry({
    portfolio: portfolioAfterExit,
    market,
    side: nextSide,
    spendCredits,
  });

  return {
    kind: "flip",
    fromSide: currentPosition.side,
    toSide: nextSide,
    closedPosition,
    openedPosition,
    availableCreditsAfter: openedPosition.availableCreditsAfter,
    realizedDeltaCredits: closedPosition.realizedDeltaCredits,
  };
}

export function executeForecastFlip(input: {
  portfolio: ForecastPortfolio;
  market: ForecastMarket;
  nextSide: ForecastSide;
  spendCredits: number;
}): ForecastExecutionResult<ForecastFlipPreview> {
  const preview = previewForecastFlip(input);
  const portfolioAfterExit = applyExitPreview(
    input.portfolio,
    input.market,
    preview.closedPosition,
    "flip-exit",
  );

  return {
    preview,
    portfolio: applyEntryPreview(
      portfolioAfterExit,
      input.market,
      preview.openedPosition,
      "flip-entry",
    ),
  };
}

export function resolveForecastMarket(
  market: ForecastMarket,
  outcome: ForecastSide,
): ForecastMarket {
  return {
    ...market,
    status: "resolved",
    resolvedOutcome: outcome,
  };
}

export function previewForecastSettlement(input: {
  portfolio: ForecastPortfolio;
  market: ForecastMarket;
}): ForecastSettlementPreview | null {
  const { portfolio, market } = input;

  assertMarketResolved(market);

  const resolvedOutcome = market.resolvedOutcome;

  assertForecast(
    resolvedOutcome,
    "Mercado ainda nao foi resolvido pelo oraculo.",
  );

  const currentPosition = getForecastPosition(portfolio, market.id);

  if (!currentPosition) {
    return null;
  }

  const didResolveInFavor = currentPosition.side === resolvedOutcome;
  const creditsReturned = didResolveInFavor
    ? roundValue(currentPosition.shares)
    : 0;
  const realizedDeltaCredits = roundValue(
    creditsReturned - currentPosition.investedCredits,
  );

  return {
    kind: "settlement",
    participantId: portfolio.participantId,
    side: currentPosition.side,
    resolvedOutcome,
    shares: roundValue(currentPosition.shares),
    didResolveInFavor,
    creditsReturned,
    realizedDeltaCredits,
    availableCreditsAfter: roundValue(
      portfolio.availableCredits + creditsReturned,
    ),
  };
}

export function settleForecastPortfolio(input: {
  portfolio: ForecastPortfolio;
  market: ForecastMarket;
}): ForecastExecutionResult<ForecastSettlementPreview> | null {
  const preview = previewForecastSettlement(input);

  if (!preview) {
    return null;
  }

  return {
    preview,
    portfolio: {
      ...input.portfolio,
      availableCredits: preview.availableCreditsAfter,
      realizedDeltaCredits: roundValue(
        input.portfolio.realizedDeltaCredits + preview.realizedDeltaCredits,
      ),
      positions: replacePosition(
        input.portfolio.positions,
        input.market.id,
        null,
      ),
      ledger: [
        ...input.portfolio.ledger,
        {
          type: "settlement",
          marketId: input.market.id,
          side: preview.side,
          creditsDelta: preview.creditsReturned,
          sharesDelta: roundValue(-preview.shares),
          executionPrice: preview.didResolveInFavor ? 1 : 0,
          realizedDeltaCredits: preview.realizedDeltaCredits,
        },
      ],
    },
  };
}

export function settleResolvedForecastMarket(input: {
  portfolios: ForecastPortfolio[];
  market: ForecastMarket;
  outcome: ForecastSide;
}) {
  const market = resolveForecastMarket(input.market, input.outcome);
  const settlements: ForecastSettlementPreview[] = [];
  const portfolios = input.portfolios.map((portfolio) => {
    const result = settleForecastPortfolio({
      portfolio,
      market,
    });

    if (!result) {
      return portfolio;
    }

    settlements.push(result.preview);
    return result.portfolio;
  });

  return {
    market,
    portfolios,
    settlements,
  };
}
