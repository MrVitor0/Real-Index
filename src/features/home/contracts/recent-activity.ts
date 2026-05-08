import { z } from "zod";

import { routeAuthSchema } from "@/features/home/contracts/home-feed";
import { radarForecastPositionSchema } from "@/features/market-detail/contracts/radar-market-detail";

export const recentActivityGroupSchema = z.enum(["user", "market", "forecast"]);

export const recentActivityEventTypeSchema = z.enum([
  "user_joined",
  "market_created",
  "market_viewed",
  "forecast_entry",
  "forecast_exit",
  "forecast_flip",
]);

export const recentActivityActorSchema = z.object({
  id: z.string(),
  username: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
});

export const recentActivityMarketSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
});

export const recentActivityItemSchema = z.object({
  id: z.string(),
  group: recentActivityGroupSchema,
  type: recentActivityEventTypeSchema,
  typeLabel: z.string(),
  headline: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
  actor: recentActivityActorSchema,
  market: recentActivityMarketSchema.nullable(),
  fromSide: radarForecastPositionSchema.nullable(),
  toSide: radarForecastPositionSchema.nullable(),
  creditsAmount: z.number().nonnegative(),
  creditsAmountLabel: z.string().nullable(),
  sharesAmount: z.number().nonnegative(),
  sharesAmountLabel: z.string().nullable(),
});

export const recentActivityDataSchema = z.object({
  title: z.string(),
  items: z.array(recentActivityItemSchema),
});

export const recentActivityResponseSchema = z.object({
  meta: z.object({
    requestId: z.string(),
    generatedAt: z.string().datetime(),
    auth: routeAuthSchema,
  }),
  data: recentActivityDataSchema,
});

export type RecentActivityGroup = z.infer<typeof recentActivityGroupSchema>;
export type RecentActivityEventType = z.infer<
  typeof recentActivityEventTypeSchema
>;
export type RecentActivityItem = z.infer<typeof recentActivityItemSchema>;
export type RecentActivityData = z.infer<typeof recentActivityDataSchema>;
export type RecentActivityResponse = z.infer<
  typeof recentActivityResponseSchema
>;
