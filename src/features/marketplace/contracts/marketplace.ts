import { z } from "zod";

import { navbarBalanceSchema } from "@/features/account/contracts/navbar-balance";

export const marketplaceRedemptionStatusSchema = z.enum([
  "pending",
  "fulfilled",
  "cancelled",
]);

export const marketplaceRewardSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().min(1),
  backgroundImageUrl: z.string().trim().min(1),
  creditCost: z.number().int().positive(),
  creditCostLabel: z.string().min(1),
  canRedeem: z.boolean(),
  isRedeemed: z.boolean(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});

export const marketplaceRedemptionSchema = z.object({
  id: z.string().min(1),
  rewardId: z.string().min(1),
  rewardTitle: z.string().min(1),
  creditsSpent: z.number().int().positive(),
  creditsSpentLabel: z.string().min(1),
  status: marketplaceRedemptionStatusSchema,
  createdAtLabel: z.string().min(1),
});

export const marketplaceCatalogSchema = z.object({
  balance: navbarBalanceSchema,
  rewards: z.array(marketplaceRewardSchema),
  redemptions: z.array(marketplaceRedemptionSchema),
  helperTitle: z.string().min(1),
  helperDescription: z.string().min(1),
});

export const marketplaceRedeemRequestSchema = z.object({
  rewardId: z.string().min(1),
});

export const marketplaceRedeemResponseSchema = z.object({
  balance: navbarBalanceSchema,
  redemption: marketplaceRedemptionSchema,
  message: z.string().min(1),
});

export type MarketplaceReward = z.infer<typeof marketplaceRewardSchema>;
export type MarketplaceRedemption = z.infer<typeof marketplaceRedemptionSchema>;
export type MarketplaceCatalog = z.infer<typeof marketplaceCatalogSchema>;
export type MarketplaceRedeemRequest = z.infer<
  typeof marketplaceRedeemRequestSchema
>;
export type MarketplaceRedeemResponse = z.infer<
  typeof marketplaceRedeemResponseSchema
>;
