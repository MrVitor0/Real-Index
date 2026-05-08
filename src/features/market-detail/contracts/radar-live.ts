import { z } from "zod";

import { routeAuthSchema } from "@/features/home/contracts/home-feed";
import {
  radarForecastAccountStateSchema,
  radarMarketDetailSchema,
} from "@/features/market-detail/contracts/radar-market-detail";

export const radarLiveDataSchema = z.object({
  market: radarMarketDetailSchema,
  accountState: radarForecastAccountStateSchema,
});

export const radarLiveResponseSchema = z.object({
  meta: z.object({
    requestId: z.string(),
    generatedAt: z.string().datetime(),
    auth: routeAuthSchema,
  }),
  data: radarLiveDataSchema,
});

export type RadarLiveData = z.infer<typeof radarLiveDataSchema>;
export type RadarLiveResponse = z.infer<typeof radarLiveResponseSchema>;
