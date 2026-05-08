import { describe, expect, it } from "vitest";

import {
  buildRecentActivityFallbackRecords,
  buildRecentActivityItem,
} from "./log";

describe("recent-activity", () => {
  it("serializa virada de leitura com labels do radar", () => {
    const item = buildRecentActivityItem({
      id: "activity-1",
      type: "forecast_flip",
      createdAt: new Date("2026-05-07T19:10:00.000Z"),
      actor: {
        id: "profile-1",
        username: "oracle",
        displayName: "Oracle",
        avatarUrl: null,
      },
      market: {
        id: "market-1",
        slug: "falha-cloud-europa",
        title: "Falha cloud na Europa",
        yesLabel: "Escala",
        noLabel: "Normaliza",
      },
      fromSide: "yes",
      toSide: "no",
      creditsAmount: 180,
      sharesAmount: 300,
    });

    expect(item).toMatchObject({
      group: "forecast",
      type: "forecast_flip",
      typeLabel: "Virada",
      headline: "Oracle virou a leitura",
      description:
        "Falha cloud na Europa • Escala → Normaliza • 180 REAL Credits",
      creditsAmountLabel: "180 REAL Credits",
      sharesAmountLabel: "300 cotas",
    });
  });

  it("serializa entrada de participante sem radar associado", () => {
    const item = buildRecentActivityItem({
      id: "activity-2",
      type: "user_joined",
      createdAt: new Date("2026-05-07T19:11:00.000Z"),
      actor: {
        id: "profile-2",
        username: "nova",
        displayName: "Nova",
        avatarUrl: null,
      },
      market: null,
      fromSide: null,
      toSide: null,
      creditsAmount: 0,
      sharesAmount: 0,
    });

    expect(item).toMatchObject({
      group: "user",
      type: "user_joined",
      typeLabel: "Novo participante",
      headline: "Nova entrou na plataforma",
      description: "Perfil sincronizado com a comunidade REAL.",
      creditsAmountLabel: null,
      sharesAmountLabel: null,
    });
  });

  it("deriva forecast do ledger quando o storage dedicado ainda nao existe", () => {
    const items = buildRecentActivityFallbackRecords({
      limit: 3,
      ledgerRows: [
        {
          id: "flip-exit-1",
          type: "flip-exit",
          createdAt: new Date("2026-05-07T19:11:00.000Z"),
          side: "yes",
          creditsDelta: 140,
          sharesDelta: -200,
          actor: {
            id: "profile-1",
            username: "oracle",
            displayName: "Oracle",
            avatarUrl: null,
          },
          market: {
            id: "market-1",
            slug: "falha-cloud-europa",
            title: "Falha cloud na Europa",
            yesLabel: "Escala",
            noLabel: "Normaliza",
          },
        },
        {
          id: "flip-entry-1",
          type: "flip-entry",
          createdAt: new Date("2026-05-07T19:11:00.000Z"),
          side: "no",
          creditsDelta: -180,
          sharesDelta: 300,
          actor: {
            id: "profile-1",
            username: "oracle",
            displayName: "Oracle",
            avatarUrl: null,
          },
          market: {
            id: "market-1",
            slug: "falha-cloud-europa",
            title: "Falha cloud na Europa",
            yesLabel: "Escala",
            noLabel: "Normaliza",
          },
        },
      ],
      profileRows: [
        {
          id: "profile-2",
          createdAt: new Date("2026-05-07T18:00:00.000Z"),
          actor: {
            id: "profile-2",
            username: "nova",
            displayName: "Nova",
            avatarUrl: null,
          },
        },
      ],
    });

    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      type: "forecast_flip",
      fromSide: "yes",
      toSide: "no",
      creditsAmount: 180,
      sharesAmount: 300,
    });
    expect(items[1]).toMatchObject({
      type: "user_joined",
      actor: {
        displayName: "Nova",
      },
    });
  });

  it("filtra os tipos derivados do fallback", () => {
    const items = buildRecentActivityFallbackRecords({
      limit: 3,
      types: ["market_created"],
      ledgerRows: [
        {
          id: "entry-1",
          type: "entry",
          createdAt: new Date("2026-05-07T19:11:00.000Z"),
          side: "yes",
          creditsDelta: -220,
          sharesDelta: 360,
          actor: {
            id: "profile-1",
            username: "oracle",
            displayName: "Oracle",
            avatarUrl: null,
          },
          market: {
            id: "market-1",
            slug: "falha-cloud-europa",
            title: "Falha cloud na Europa",
            yesLabel: "Escala",
            noLabel: "Normaliza",
          },
        },
      ],
      marketRows: [
        {
          id: "market-1",
          createdAt: new Date("2026-05-07T18:00:00.000Z"),
          actor: {
            id: "profile-1",
            username: "oracle",
            displayName: "Oracle",
            avatarUrl: null,
          },
          market: {
            id: "market-1",
            slug: "falha-cloud-europa",
            title: "Falha cloud na Europa",
            yesLabel: "Escala",
            noLabel: "Normaliza",
          },
        },
      ],
    });

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      type: "market_created",
      market: {
        title: "Falha cloud na Europa",
      },
    });
  });
});
