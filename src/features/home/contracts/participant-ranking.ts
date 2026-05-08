import { z } from "zod";

import { routeAuthSchema } from "@/features/home/contracts/home-feed";

export const participantRankingItemSchema = z.object({
  rank: z.number().int().positive(),
  profileId: z.string(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  availableCredits: z.number().nonnegative(),
  availableCreditsLabel: z.string(),
  investedCredits: z.number().nonnegative(),
  investedCreditsLabel: z.string(),
  totalEquityCredits: z.number().nonnegative(),
  totalEquityLabel: z.string(),
  realizedDeltaCredits: z.number(),
  realizedDeltaLabel: z.string(),
  unrealizedDeltaCredits: z.number(),
  unrealizedDeltaLabel: z.string(),
  openPositions: z.number().int().nonnegative(),
});

export const participantRankingDataSchema = z.object({
  title: z.string(),
  totalParticipants: z.number().int().nonnegative(),
  items: z.array(participantRankingItemSchema),
});

export const participantRankingResponseSchema = z.object({
  meta: z.object({
    requestId: z.string(),
    generatedAt: z.string().datetime(),
    auth: routeAuthSchema,
  }),
  data: participantRankingDataSchema,
});

export type ParticipantRankingItem = z.infer<
  typeof participantRankingItemSchema
>;
export type ParticipantRankingData = z.infer<
  typeof participantRankingDataSchema
>;
export type ParticipantRankingResponse = z.infer<
  typeof participantRankingResponseSchema
>;
