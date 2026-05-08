import { z } from "zod";

import { navbarBalanceSchema } from "@/features/account/contracts/navbar-balance";
import { communityMetricsDataSchema } from "@/features/home/contracts/community-metrics";
import {
  homeFeedDataSchema,
  routeAuthSchema,
} from "@/features/home/contracts/home-feed";
import { participantRankingDataSchema } from "@/features/home/contracts/participant-ranking";
import { recentActivityDataSchema } from "@/features/home/contracts/recent-activity";

export const homeLiveDataSchema = z.object({
  homeFeed: homeFeedDataSchema,
  ranking: participantRankingDataSchema,
  recentActivity: recentActivityDataSchema,
  communityMetrics: communityMetricsDataSchema,
  navbarBalance: navbarBalanceSchema,
});

export const homeLiveResponseSchema = z.object({
  meta: z.object({
    requestId: z.string(),
    generatedAt: z.string().datetime(),
    auth: routeAuthSchema,
  }),
  data: homeLiveDataSchema,
});

export type HomeLiveData = z.infer<typeof homeLiveDataSchema>;
export type HomeLiveResponse = z.infer<typeof homeLiveResponseSchema>;
