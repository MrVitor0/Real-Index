import { describe, expect, it } from "vitest";

import {
  ForecastEngineError,
  buildForecastPortfolioSummary,
  createForecastPortfolio,
  executeForecastEntry,
  executeForecastExit,
  executeForecastFlip,
  getForecastQuote,
  grantForecastCredits,
  previewForecastEntry,
  previewForecastExit,
  previewForecastFlip,
  previewForecastSettlement,
  resolveForecastMarket,
  settleForecastPortfolio,
  settleResolvedForecastMarket,
  type ForecastMarket,
} from "./forecast-engine";

function createMarket(overrides: Partial<ForecastMarket> = {}): ForecastMarket {
  return {
    id: "fila-actions-europa",
    probability: 61,
    minimumCredits: 50,
    status: "open",
    ...overrides,
  };
}

function createPortfolio(initialCredits = 1_000, participantId = "u-1") {
  return createForecastPortfolio({
    participantId,
    initialCredits,
  });
}

describe("forecast-engine", () => {
  it("cria carteira inicial e registra o grant no ledger", () => {
    const portfolio = createPortfolio(750, "oracle-user");

    expect(portfolio.availableCredits).toBe(750);
    expect(portfolio.positions).toHaveLength(0);
    expect(portfolio.ledger).toEqual([
      {
        type: "grant",
        creditsDelta: 750,
        sharesDelta: 0,
        realizedDeltaCredits: 0,
      },
    ]);
  });

  it("permite conceder credits adicionais sem perder o historico", () => {
    const portfolio = grantForecastCredits(createPortfolio(500), 125);

    expect(portfolio.availableCredits).toBe(625);
    expect(portfolio.ledger.at(-1)).toEqual({
      type: "grant",
      creditsDelta: 125,
      sharesDelta: 0,
      realizedDeltaCredits: 0,
    });
  });

  it("gera quote com clamp de protecao para probabilidades extremas", () => {
    expect(getForecastQuote(createMarket({ probability: 0 }))).toEqual({
      yesPriceCredits: 0.01,
      noPriceCredits: 0.99,
    });
    expect(getForecastQuote(createMarket({ probability: 100 }))).toEqual({
      yesPriceCredits: 0.99,
      noPriceCredits: 0.01,
    });
  });

  it("abre uma conviccao e converte credits em shares do lado escolhido", () => {
    const result = executeForecastEntry({
      portfolio: createPortfolio(),
      market: createMarket(),
      side: "yes",
      spendCredits: 250,
    });

    expect(result.preview).toMatchObject({
      kind: "entry",
      side: "yes",
      spendCredits: 250,
      pricePerShareCredits: 0.61,
      availableCreditsAfter: 750,
      maxLossCredits: 250,
    });
    expect(result.preview.shares).toBeCloseTo(409.836066, 6);
    expect(result.preview.maxGainCredits).toBeCloseTo(159.836066, 6);
    expect(result.portfolio.availableCredits).toBe(750);
    expect(result.portfolio.positions).toHaveLength(1);
    expect(result.portfolio.positions[0]).toMatchObject({
      marketId: "fila-actions-europa",
      side: "yes",
      investedCredits: 250,
      averageEntryPrice: 0.61,
    });
    expect(result.portfolio.positions[0].shares).toBeCloseTo(409.836066, 6);
  });

  it("recalcula custo medio ao reforcar a mesma narrativa com outro preco", () => {
    const firstEntry = executeForecastEntry({
      portfolio: createPortfolio(),
      market: createMarket({ probability: 61 }),
      side: "yes",
      spendCredits: 250,
    });
    const secondEntry = executeForecastEntry({
      portfolio: firstEntry.portfolio,
      market: createMarket({ probability: 70 }),
      side: "yes",
      spendCredits: 140,
    });

    expect(secondEntry.portfolio.availableCredits).toBe(610);
    expect(secondEntry.portfolio.positions[0].shares).toBeCloseTo(
      609.836066,
      6,
    );
    expect(secondEntry.portfolio.positions[0].averageEntryPrice).toBeCloseTo(
      0.639516,
      6,
    );
    expect(secondEntry.portfolio.positions[0].investedCredits).toBe(390);
  });

  it("bloqueia entrada abaixo do minimo ou no lado oposto sem flip", () => {
    expect(() =>
      previewForecastEntry({
        portfolio: createPortfolio(),
        market: createMarket(),
        side: "yes",
        spendCredits: 20,
      }),
    ).toThrowError(
      new ForecastEngineError("O minimo para abrir conviccao e 50 credits."),
    );

    const position = executeForecastEntry({
      portfolio: createPortfolio(),
      market: createMarket(),
      side: "yes",
      spendCredits: 250,
    }).portfolio;

    expect(() =>
      previewForecastEntry({
        portfolio: position,
        market: createMarket(),
        side: "no",
        spendCredits: 100,
      }),
    ).toThrowError(
      new ForecastEngineError(
        "Ja existe uma posicao no lado oposto. Encerre ou inverta antes de seguir.",
      ),
    );
  });

  it("encerra parcialmente por quantidade de shares e realiza delta", () => {
    const opened = executeForecastEntry({
      portfolio: createPortfolio(),
      market: createMarket({ probability: 61 }),
      side: "yes",
      spendCredits: 250,
    }).portfolio;

    const result = executeForecastExit({
      portfolio: opened,
      market: createMarket({ probability: 70 }),
      plan: { sharesToExit: 200 },
    });

    expect(result.preview.creditsReleased).toBe(140);
    expect(result.preview.costBasisReleasedCredits).toBe(122);
    expect(result.preview.realizedDeltaCredits).toBe(18);
    expect(result.portfolio.availableCredits).toBe(890);
    expect(result.portfolio.realizedDeltaCredits).toBe(18);
    expect(result.portfolio.positions[0].shares).toBeCloseTo(209.836066, 6);
    expect(result.portfolio.positions[0].investedCredits).toBe(128);
  });

  it("encerra parcialmente por valor alvo de credits", () => {
    const opened = executeForecastEntry({
      portfolio: createPortfolio(),
      market: createMarket(),
      side: "yes",
      spendCredits: 250,
    }).portfolio;

    const preview = previewForecastExit({
      portfolio: opened,
      market: createMarket({ probability: 70 }),
      plan: { creditsToRelease: 70 },
    });

    expect(preview.sharesToExit).toBeCloseTo(100, 6);
    expect(preview.creditsReleased).toBeCloseTo(70, 6);
    expect(preview.realizedDeltaCredits).toBeCloseTo(9, 6);
    expect(preview.positionAfter?.shares).toBeCloseTo(309.836066, 6);
  });

  it("inverte a posicao inteira, realiza o delta anterior e abre o lado oposto", () => {
    const opened = executeForecastEntry({
      portfolio: createPortfolio(),
      market: createMarket({ probability: 61 }),
      side: "yes",
      spendCredits: 250,
    }).portfolio;

    const preview = previewForecastFlip({
      portfolio: opened,
      market: createMarket({ probability: 40 }),
      nextSide: "no",
      spendCredits: 150,
    });

    expect(preview.closedPosition.creditsReleased).toBeCloseTo(163.934426, 6);
    expect(preview.realizedDeltaCredits).toBeCloseTo(-86.065574, 6);
    expect(preview.openedPosition.shares).toBe(250);

    const result = executeForecastFlip({
      portfolio: opened,
      market: createMarket({ probability: 40 }),
      nextSide: "no",
      spendCredits: 150,
    });

    expect(result.portfolio.availableCredits).toBeCloseTo(763.934426, 6);
    expect(result.portfolio.realizedDeltaCredits).toBeCloseTo(-86.065574, 6);
    expect(result.portfolio.positions).toEqual([
      {
        marketId: "fila-actions-europa",
        side: "no",
        shares: 250,
        investedCredits: 150,
        averageEntryPrice: 0.6,
      },
    ]);
  });

  it("resume carteira com valor de mercado e delta nao realizado", () => {
    const opened = executeForecastEntry({
      portfolio: createPortfolio(),
      market: createMarket({ probability: 61 }),
      side: "yes",
      spendCredits: 250,
    }).portfolio;
    const summary = buildForecastPortfolioSummary(opened, [
      createMarket({ probability: 70 }),
    ]);

    expect(summary.availableCredits).toBe(750);
    expect(summary.investedCredits).toBe(250);
    expect(summary.marketValueCredits).toBeCloseTo(286.885246, 6);
    expect(summary.unrealizedDeltaCredits).toBeCloseTo(36.885246, 6);
    expect(summary.totalEquityCredits).toBeCloseTo(1036.885246, 6);
    expect(summary.positionSnapshots[0].potentialSettlementCredits).toBeCloseTo(
      409.836066,
      6,
    );
  });

  it("gera settlement vencedor e remove a posicao apos a resolucao manual", () => {
    const opened = executeForecastEntry({
      portfolio: createPortfolio(),
      market: createMarket(),
      side: "yes",
      spendCredits: 250,
    }).portfolio;
    const resolvedMarket = resolveForecastMarket(createMarket(), "yes");
    const preview = previewForecastSettlement({
      portfolio: opened,
      market: resolvedMarket,
    });

    expect(preview).toMatchObject({
      participantId: "u-1",
      side: "yes",
      resolvedOutcome: "yes",
      didResolveInFavor: true,
    });
    expect(preview?.creditsReturned).toBeCloseTo(409.836066, 6);
    expect(preview?.realizedDeltaCredits).toBeCloseTo(159.836066, 6);

    const settled = settleForecastPortfolio({
      portfolio: opened,
      market: resolvedMarket,
    });

    expect(settled?.portfolio.availableCredits).toBeCloseTo(1159.836066, 6);
    expect(settled?.portfolio.positions).toHaveLength(0);
    expect(settled?.portfolio.realizedDeltaCredits).toBeCloseTo(159.836066, 6);
  });

  it("gera settlement perdedor com retorno zero quando o oraculo fecha no lado oposto", () => {
    const opened = executeForecastEntry({
      portfolio: createPortfolio(),
      market: createMarket(),
      side: "yes",
      spendCredits: 250,
    }).portfolio;
    const settled = settleForecastPortfolio({
      portfolio: opened,
      market: resolveForecastMarket(createMarket(), "no"),
    });

    expect(settled?.preview.creditsReturned).toBe(0);
    expect(settled?.preview.didResolveInFavor).toBe(false);
    expect(settled?.portfolio.availableCredits).toBe(750);
    expect(settled?.portfolio.realizedDeltaCredits).toBe(-250);
  });

  it("liquida em lote todos os participantes ativos do mercado resolvido", () => {
    const first = executeForecastEntry({
      portfolio: createPortfolio(1_000, "yes-user"),
      market: createMarket(),
      side: "yes",
      spendCredits: 200,
    }).portfolio;
    const second = executeForecastEntry({
      portfolio: createPortfolio(1_000, "no-user"),
      market: createMarket(),
      side: "no",
      spendCredits: 180,
    }).portfolio;
    const third = createPortfolio(600, "spectator");

    const batch = settleResolvedForecastMarket({
      portfolios: [first, second, third],
      market: createMarket(),
      outcome: "yes",
    });

    expect(batch.market.status).toBe("resolved");
    expect(batch.settlements).toHaveLength(2);
    expect(batch.settlements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          participantId: "yes-user",
          didResolveInFavor: true,
        }),
        expect.objectContaining({
          participantId: "no-user",
          didResolveInFavor: false,
          creditsReturned: 0,
        }),
      ]),
    );
    expect(batch.portfolios[0].positions).toHaveLength(0);
    expect(batch.portfolios[1].positions).toHaveLength(0);
    expect(batch.portfolios[2]).toEqual(third);
  });

  it("recusa encerrar ou inverter quando nao existe posicao ativa", () => {
    expect(() =>
      previewForecastExit({
        portfolio: createPortfolio(),
        market: createMarket(),
        plan: { closeAll: true },
      }),
    ).toThrowError(
      new ForecastEngineError(
        "Nao existe posicao ativa para encerrar nesse mercado.",
      ),
    );

    expect(() =>
      previewForecastFlip({
        portfolio: createPortfolio(),
        market: createMarket(),
        nextSide: "no",
        spendCredits: 120,
      }),
    ).toThrowError(
      new ForecastEngineError(
        "Nao existe posicao ativa para inverter nesse mercado.",
      ),
    );
  });
});
