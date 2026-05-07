import { z } from "zod";

import { homeToneSchema } from "@/features/home/contracts/home-feed";

export const createPredictionMarketInputSchema = z.object({
  title: z.string().trim().min(12).max(180),
  description: z.string().trim().min(24).max(2_000),
  overview: z.string().trim().min(24).max(2_000),
  category: z.string().trim().min(2).max(48),
  subCategory: z.string().trim().min(2).max(80),
  iconLabel: z.string().trim().min(1).max(12),
  tone: homeToneSchema.default("primary"),
  yesLabel: z.string().trim().min(2).max(60),
  noLabel: z.string().trim().min(2).max(60),
  tags: z.array(z.string().trim().min(1).max(32)).min(1).max(6),
  rules: z.array(z.string().trim().min(1).max(240)).min(1).max(6),
  context: z.array(z.string().trim().min(1).max(240)).min(1).max(6),
  initialProbability: z.number().int().min(1).max(99),
  closesAt: z.string().datetime(),
});

export const createPredictionMarketResponseSchema = z.object({
  market: z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
  }),
});

export type CreatePredictionMarketInput = z.infer<
  typeof createPredictionMarketInputSchema
>;
export type CreatePredictionMarketResponse = z.infer<
  typeof createPredictionMarketResponseSchema
>;
