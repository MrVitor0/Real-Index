import { describe, expect, it } from "vitest";

import {
  buildMarketplaceCatalog,
  previewMarketplaceRedemption,
} from "@/features/marketplace/lib/marketplace";

describe("marketplace", () => {
  it("ordena itens ativos apenas por sortOrder e aplica o limite por conta", () => {
    const catalog = buildMarketplaceCatalog({
      balance: {
        authStatus: "authenticated",
        availableCredits: 900,
      },
      rewards: [
        {
          id: "reward-b",
          slug: "nova-palheta",
          title: "Nova palheta da home",
          subtitle: "Sugira uma variacao de cores para a landing.",
          backgroundImageUrl: "/brand/reward-b.png",
          creditCost: 700,
          sortOrder: 2,
          createdAt: new Date("2026-05-08T12:00:00.000Z"),
        },
        {
          id: "reward-a",
          slug: "novo-mercado",
          title: "Criar novo mercado",
          subtitle: "Abra um novo radar com curadoria do time.",
          backgroundImageUrl: "/brand/reward-a.png",
          creditCost: 1_200,
          sortOrder: 1,
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
        },
        {
          id: "reward-c",
          slug: "desativado",
          title: "Item oculto",
          subtitle: "Nao deveria aparecer.",
          backgroundImageUrl: "/brand/reward-c.png",
          creditCost: 100,
          isActive: false,
        },
        {
          id: "reward-d",
          slug: "novo-badge",
          title: "Badge de curadoria",
          subtitle: "Ganhe um selo visual no seu perfil publico.",
          backgroundImageUrl: "/brand/reward-d.png",
          creditCost: 500,
          sortOrder: 3,
          createdAt: new Date("2026-05-09T12:00:00.000Z"),
        },
      ],
      redemptions: [
        {
          id: "redemption-1",
          rewardId: "reward-b",
          rewardTitle: "Nova palheta da home",
          creditsSpent: 700,
          status: "pending",
          createdAt: new Date("2026-05-08T12:00:00.000Z"),
        },
        {
          id: "redemption-2",
          rewardId: "reward-d",
          rewardTitle: "Badge de curadoria",
          creditsSpent: 500,
          status: "pending",
          createdAt: new Date("2026-05-08T12:10:00.000Z"),
        },
        {
          id: "redemption-3",
          rewardId: "reward-d",
          rewardTitle: "Badge de curadoria",
          creditsSpent: 500,
          status: "pending",
          createdAt: new Date("2026-05-08T12:20:00.000Z"),
        },
        {
          id: "redemption-4",
          rewardId: "reward-d",
          rewardTitle: "Badge de curadoria",
          creditsSpent: 500,
          status: "pending",
          createdAt: new Date("2026-05-08T12:30:00.000Z"),
        },
      ],
    });

    expect(catalog.rewards).toHaveLength(3);
    expect(catalog.rewards.map((reward) => reward.id)).toEqual([
      "reward-a",
      "reward-b",
      "reward-d",
    ]);
    expect(catalog.rewards[0]).toMatchObject({
      canRedeem: false,
      creditCostLabel: "1.200 REAL Credits",
      isRedeemed: false,
      redemptionCount: 0,
      redemptionLimit: 3,
    });
    expect(catalog.rewards[1]).toMatchObject({
      canRedeem: true,
      creditCostLabel: "700 REAL Credits",
      isRedeemed: false,
      redemptionCount: 1,
      redemptionLimit: 3,
    });
    expect(catalog.rewards[2]).toMatchObject({
      canRedeem: false,
      isRedeemed: true,
      redemptionCount: 3,
      redemptionLimit: 3,
    });
  });

  it("gera o saldo restante ao validar um resgate", () => {
    const preview = previewMarketplaceRedemption({
      availableCredits: 2_400,
      reward: {
        title: "Criar novo mercado",
        creditCost: 750,
      },
      redemptionCount: 2,
    });

    expect(preview).toMatchObject({
      availableCreditsAfter: 1650,
      availableCreditsAfterLabel: "1.650 REAL Credits",
      creditsSpentLabel: "750 REAL Credits",
      successMessage: "Criar novo mercado entrou na sua fila de resgate.",
    });
  });

  it("bloqueia resgate quando o saldo atual nao cobre o valor", () => {
    expect(() =>
      previewMarketplaceRedemption({
        availableCredits: 180,
        reward: {
          title: "Palheta premium",
          creditCost: 300,
        },
      }),
    ).toThrowError("Saldo insuficiente para resgatar Palheta premium.");
  });

  it("bloqueia resgate quando a conta atinge o limite do item", () => {
    expect(() =>
      previewMarketplaceRedemption({
        availableCredits: 4_000,
        reward: {
          title: "Palheta premium",
          creditCost: 300,
        },
        redemptionCount: 3,
      }),
    ).toThrowError(
      "Esse item do marketplace atingiu o limite de 3 resgates por conta.",
    );
  });
});
