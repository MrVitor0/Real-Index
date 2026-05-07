import { z } from "zod";

import {
  homeToneSchema,
  marketDirectionSchema,
} from "@/features/home/contracts/home-feed";

export const radarMarketContentSchema = z.object({
  id: z.string(),
  overview: z.string(),
  rules: z.array(z.string()).min(1),
  context: z.array(z.string()).min(1),
});

export const radarMarketChartPointSchema = z.object({
  label: z.string(),
  probability: z.number().min(0).max(100),
});

export const radarMarketDetailChartSchema = z.object({
  yAxisTicks: z.array(z.number().min(0).max(100)),
  points: z.array(radarMarketChartPointSchema).min(1),
});

export const radarMarketCommunityPulseLevelSchema = z.object({
  id: z.string(),
  sentiment: z.enum(["support", "counter"]),
  score: z.number().int().min(1).max(99),
  intensityLabel: z.string(),
});

export const radarMarketRelatedSchema = z.object({
  id: z.string(),
  title: z.string(),
  probability: z.number().min(0).max(100),
  iconLabel: z.string(),
  tone: homeToneSchema,
});

export const radarParticipationConfigSchema = z.object({
  initialCredits: z.number().int().positive(),
  minimumCredits: z.number().int().positive(),
  quickCredits: z.array(z.number().int().positive()).min(1),
});

export const radarMarketDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  category: z.string(),
  iconLabel: z.string(),
  tags: z.array(z.string()).min(1),
  probability: z.number().min(0).max(100),
  movementLabel: z.string(),
  direction: marketDirectionSchema,
  tone: homeToneSchema,
  volumeLabel: z.string(),
  closeLabel: z.string(),
  yesLabel: z.string(),
  noLabel: z.string(),
  yesScore: z.number().int().min(1).max(99),
  noScore: z.number().int().min(1).max(99),
  overview: z.string(),
  rules: z.array(z.string()).min(1),
  context: z.array(z.string()).min(1),
  chart: radarMarketDetailChartSchema,
  communityPulse: z.array(radarMarketCommunityPulseLevelSchema).min(2),
  relatedMarkets: z.array(radarMarketRelatedSchema),
  participationConfig: radarParticipationConfigSchema,
});

export const radarForecastPositionSchema = z.enum(["yes", "no"]);

export const radarForecastActionModeSchema = z.enum(["entry", "exit"]);

export const radarForecastAccountPositionSchema = z.object({
  side: radarForecastPositionSchema,
  sideLabel: z.string(),
  shares: z.number().positive(),
  sharesLabel: z.string(),
  investedCredits: z.number().nonnegative(),
  investedCreditsLabel: z.string(),
  marketValueCredits: z.number().nonnegative(),
  marketValueCreditsLabel: z.string(),
  unrealizedDeltaCredits: z.number(),
  unrealizedDeltaLabel: z.string(),
  averageEntryPrice: z.number().nonnegative(),
  averageEntryPriceLabel: z.string(),
});

export const radarForecastAccountStateSchema = z.object({
  authStatus: z.enum(["anonymous", "authenticated"]),
  availableCredits: z.number().nonnegative(),
  availableCreditsLabel: z.string(),
  realizedDeltaCredits: z.number(),
  realizedDeltaLabel: z.string(),
  investedCredits: z.number().nonnegative(),
  investedCreditsLabel: z.string(),
  totalEquityCredits: z.number().nonnegative(),
  totalEquityLabel: z.string(),
  openPositions: z.number().int().nonnegative(),
  openPosition: radarForecastAccountPositionSchema.nullable(),
});

export const radarForecastPreviewRequestSchema = z.object({
  creditsInput: z.string().trim().min(1),
  position: radarForecastPositionSchema,
  mode: radarForecastActionModeSchema,
});

export const radarForecastPreviewResponseSchema = z.object({
  kind: z.enum(["entry", "exit", "flip"]),
  actionLabel: z.string(),
  positionLabel: z.string(),
  credits: z.number().positive(),
  creditsLabel: z.string(),
  sharesLabel: z.string(),
  balanceAfterLabel: z.string(),
  deltaLabel: z.string(),
  exposureLabel: z.string(),
  helperLabel: z.string(),
});

export const radarForecastExecutionRequestSchema =
  radarForecastPreviewRequestSchema;

export const radarForecastExecutionResponseSchema = z.object({
  kind: z.enum(["entry", "exit", "flip"]),
  message: z.string(),
  market: radarMarketDetailSchema,
  viewerState: radarForecastAccountStateSchema,
});

export type RadarMarketContent = z.infer<typeof radarMarketContentSchema>;
export type RadarMarketDetail = z.infer<typeof radarMarketDetailSchema>;
export type RadarMarketChartPoint = z.infer<typeof radarMarketChartPointSchema>;
export type RadarForecastPreviewRequest = z.infer<
  typeof radarForecastPreviewRequestSchema
>;
export type RadarForecastPreviewResponse = z.infer<
  typeof radarForecastPreviewResponseSchema
>;
export type RadarForecastAccountState = z.infer<
  typeof radarForecastAccountStateSchema
>;
export type RadarForecastExecutionRequest = z.infer<
  typeof radarForecastExecutionRequestSchema
>;
export type RadarForecastExecutionResponse = z.infer<
  typeof radarForecastExecutionResponseSchema
>;
