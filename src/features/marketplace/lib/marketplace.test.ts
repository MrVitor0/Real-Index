import { describe, expect, it } from "vitest";

import {
  buildMarketplaceCatalog,
  previewMarketplaceRedemption,
} from "@/features/marketplace/lib/marketplace";

describe("marketplace", () => {
  it("ordena itens ativos por prioridade e sinaliza disponibilidade", () => {
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
        },
        {
          id: "reward-a",
          slug: "novo-mercado",
          title: "Criar novo mercado",
          subtitle: "Abra um novo radar com curadoria do time.",
          backgroundImageUrl: "/brand/reward-a.png",
          creditCost: 1_200,
          sortOrder: 1,
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
    });
    expect(catalog.rewards[1]).toMatchObject({
      canRedeem: false,
      creditCostLabel: "700 REAL Credits",
      isRedeemed: true,
    });
    expect(catalog.rewards[2]).toMatchObject({
      canRedeem: true,
      isRedeemed: false,
    });
  });

  it("gera o saldo restante ao validar um resgate", () => {
    const preview = previewMarketplaceRedemption({
      availableCredits: 2_400,
      reward: {
        title: "Criar novo mercado",
        creditCost: 750,
      },
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

  it("bloqueia resgate duplicado quando a conta ja consumiu o item", () => {
    expect(() =>
      previewMarketplaceRedemption({
        availableCredits: 4_000,
        reward: {
          title: "Palheta premium",
          creditCost: 300,
        },
        alreadyRedeemed: true,
      }),
    ).toThrowError("Esse item do marketplace ja foi resgatado pela sua conta.");
  });
});
