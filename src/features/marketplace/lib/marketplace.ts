import type {
  MarketplaceCatalog,
  MarketplaceRedemption,
  MarketplaceReward,
} from "@/features/marketplace/contracts/marketplace";
import {
  marketplaceCatalogSchema,
  marketplaceRedemptionSchema,
  marketplaceRewardSchema,
} from "@/features/marketplace/contracts/marketplace";
import { formatCredits } from "@/features/market-detail/lib/forecast";

type MarketplaceRewardSeed = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  backgroundImageUrl: string;
  creditCost: number;
  isRedeemed?: boolean;
  isActive?: boolean;
  sortOrder?: number;
};

type MarketplaceRedemptionSeed = {
  id: string;
  rewardId: string;
  rewardTitle: string;
  creditsSpent: number;
  status: MarketplaceRedemption["status"];
  createdAt: Date;
};

type MarketplaceBalanceSeed = {
  authStatus: "anonymous" | "authenticated";
  availableCredits: number;
};

const redemptionDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

function roundCredits(value: number) {
  return Math.max(0, Math.round(value));
}

export function buildMarketplaceReward(
  reward: MarketplaceRewardSeed,
  availableCredits: number,
): MarketplaceReward {
  const isRedeemed = reward.isRedeemed ?? false;

  return marketplaceRewardSchema.parse({
    id: reward.id,
    slug: reward.slug,
    title: reward.title,
    subtitle: reward.subtitle,
    backgroundImageUrl: reward.backgroundImageUrl,
    creditCost: roundCredits(reward.creditCost),
    creditCostLabel: formatCredits(reward.creditCost),
    canRedeem: !isRedeemed && availableCredits >= reward.creditCost,
    isRedeemed,
    isActive: reward.isActive ?? true,
    sortOrder: reward.sortOrder ?? 0,
  });
}

export function buildMarketplaceRedemption(
  redemption: MarketplaceRedemptionSeed,
): MarketplaceRedemption {
  return marketplaceRedemptionSchema.parse({
    id: redemption.id,
    rewardId: redemption.rewardId,
    rewardTitle: redemption.rewardTitle,
    creditsSpent: roundCredits(redemption.creditsSpent),
    creditsSpentLabel: formatCredits(redemption.creditsSpent),
    status: redemption.status,
    createdAtLabel: redemptionDateFormatter.format(redemption.createdAt),
  });
}

export function buildMarketplaceCatalog(input: {
  balance: MarketplaceBalanceSeed;
  rewards: MarketplaceRewardSeed[];
  redemptions?: MarketplaceRedemptionSeed[];
}): MarketplaceCatalog {
  const redemptions = (input.redemptions ?? []).sort(
    (left, right) => right.createdAt.getTime() - left.createdAt.getTime(),
  );
  const redeemedRewardIds = new Set(
    redemptions.map((redemption) => redemption.rewardId),
  );
  const rewards = input.rewards
    .filter((reward) => reward.isActive ?? true)
    .sort((left, right) => {
      const orderDelta = (left.sortOrder ?? 0) - (right.sortOrder ?? 0);

      if (orderDelta !== 0) {
        return orderDelta;
      }

      return left.title.localeCompare(right.title, "pt-BR");
    })
    .map((reward) =>
      buildMarketplaceReward(
        {
          ...reward,
          isRedeemed: redeemedRewardIds.has(reward.id),
        },
        input.balance.availableCredits,
      ),
    );

  const recentRedemptions = redemptions
    .slice(0, 8)
    .map(buildMarketplaceRedemption);

  return marketplaceCatalogSchema.parse({
    balance: {
      authStatus: input.balance.authStatus,
      availableCredits: input.balance.availableCredits,
      availableCreditsLabel: formatCredits(input.balance.availableCredits),
    },
    rewards,
    redemptions: recentRedemptions,
    helperTitle: "Premios de comunidade",
    helperDescription:
      "Os itens do marketplace usam apenas REAL Credits virtuais. Nao existe compra de dinheiro, saque ou recompensa financeira.",
  });
}

export function previewMarketplaceRedemption(input: {
  availableCredits: number;
  reward: Pick<MarketplaceRewardSeed, "title" | "creditCost">;
  alreadyRedeemed?: boolean;
}) {
  const availableCredits = roundCredits(input.availableCredits);
  const rewardCost = roundCredits(input.reward.creditCost);

  if (rewardCost <= 0) {
    throw new Error("Esse item do marketplace esta com valor invalido.");
  }

  if (input.alreadyRedeemed) {
    throw new Error(
      "Esse item do marketplace ja foi resgatado pela sua conta.",
    );
  }

  if (availableCredits < rewardCost) {
    throw new Error(`Saldo insuficiente para resgatar ${input.reward.title}.`);
  }

  const availableCreditsAfter = availableCredits - rewardCost;

  return {
    availableCreditsAfter,
    availableCreditsAfterLabel: formatCredits(availableCreditsAfter),
    creditsSpent: rewardCost,
    creditsSpentLabel: formatCredits(rewardCost),
    successMessage: `${input.reward.title} entrou na sua fila de resgate.`,
  };
}
