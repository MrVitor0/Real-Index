import type {
  MarketplaceCatalog,
  MarketplaceRedemption,
  MarketplaceReward,
} from "@/features/marketplace/contracts/marketplace";
import {
  marketplaceCatalogSchema,
  marketplaceRedemptionResultSchema,
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
  redemptionCount?: number;
  redemptionLimit?: number;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
};

type MarketplaceRedemptionSeed = {
  id: string;
  rewardId: string;
  rewardTitle: string;
  creditsSpent: number;
  status: MarketplaceRedemption["status"];
  createdAt: Date;
  result?: unknown;
};

type MarketplaceBalanceSeed = {
  authStatus: "anonymous" | "authenticated";
  availableCredits: number;
};

const redemptionDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const maxMarketplaceRewardRedemptionsPerAccount = 3;

function roundCredits(value: number) {
  return Math.max(0, Math.round(value));
}

export function getMarketplaceRedemptionLimitMessage(
  redemptionLimit = maxMarketplaceRewardRedemptionsPerAccount,
) {
  return `Esse item do marketplace atingiu o limite de ${redemptionLimit} resgates por conta.`;
}

export function parseMarketplaceRedemptionResult(result: unknown) {
  if (result == null) {
    return null;
  }

  const parsedResult = marketplaceRedemptionResultSchema.safeParse(result);

  return parsedResult.success ? parsedResult.data : null;
}

export function buildMarketplaceReward(
  reward: MarketplaceRewardSeed,
  availableCredits: number,
): MarketplaceReward {
  const redemptionCount = Math.max(0, Math.trunc(reward.redemptionCount ?? 0));
  const redemptionLimit = Math.max(
    1,
    Math.trunc(
      reward.redemptionLimit ?? maxMarketplaceRewardRedemptionsPerAccount,
    ),
  );
  const isRedeemed = redemptionCount >= redemptionLimit;

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
    redemptionCount,
    redemptionLimit,
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
    result: parseMarketplaceRedemptionResult(redemption.result),
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
  const redemptionCountByRewardId = redemptions.reduce((counts, redemption) => {
    counts.set(redemption.rewardId, (counts.get(redemption.rewardId) ?? 0) + 1);

    return counts;
  }, new Map<string, number>());
  const rewards = input.rewards
    .filter((reward) => reward.isActive ?? true)
    .sort((left, right) => (left.sortOrder ?? 0) - (right.sortOrder ?? 0))
    .map((reward) =>
      buildMarketplaceReward(
        {
          ...reward,
          redemptionCount: redemptionCountByRewardId.get(reward.id) ?? 0,
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
      "Os itens do marketplace usam apenas REAL Credits virtuais. Não existe compra de dinheiro, saque ou recompensa financeira.",
  });
}

export function previewMarketplaceRedemption(input: {
  availableCredits: number;
  reward: Pick<MarketplaceRewardSeed, "title" | "creditCost">;
  redemptionCount?: number;
  redemptionLimit?: number;
}) {
  const availableCredits = roundCredits(input.availableCredits);
  const rewardCost = roundCredits(input.reward.creditCost);
  const redemptionCount = Math.max(0, Math.trunc(input.redemptionCount ?? 0));
  const redemptionLimit = Math.max(
    1,
    Math.trunc(
      input.redemptionLimit ?? maxMarketplaceRewardRedemptionsPerAccount,
    ),
  );

  if (rewardCost <= 0) {
    throw new Error("Esse item do marketplace esta com valor invalido.");
  }

  if (redemptionCount >= redemptionLimit) {
    throw new Error(getMarketplaceRedemptionLimitMessage(redemptionLimit));
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
