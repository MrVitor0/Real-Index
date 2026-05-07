import { z } from "zod";

import {
  homeToneSchema,
  routeAuthSchema,
} from "@/features/home/contracts/home-feed";

export const communityMetricItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.number().nonnegative(),
  valueLabel: z.string(),
  tone: homeToneSchema,
});

export const communityMetricsDataSchema = z.object({
  title: z.string(),
  items: z.array(communityMetricItemSchema).length(3),
});

export const communityMetricsResponseSchema = z.object({
  meta: z.object({
    requestId: z.string(),
    generatedAt: z.string().datetime(),
    auth: routeAuthSchema,
  }),
  data: communityMetricsDataSchema,
});

export type CommunityMetricItem = z.infer<typeof communityMetricItemSchema>;
export type CommunityMetricsData = z.infer<typeof communityMetricsDataSchema>;
export type CommunityMetricsResponse = z.infer<
  typeof communityMetricsResponseSchema
>;
