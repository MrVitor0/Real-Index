import { z } from "zod";

import { marketCardSchema, routeAuthSchema } from "./home-feed";

export const homeSearchesDataSchema = z.object({
  query: z.string(),
  items: z.array(marketCardSchema),
});

export const homeSearchesResponseSchema = z.object({
  meta: z.object({
    requestId: z.string(),
    generatedAt: z.string().datetime(),
    auth: routeAuthSchema,
  }),
  data: homeSearchesDataSchema,
});

export type HomeSearchesData = z.infer<typeof homeSearchesDataSchema>;
export type HomeSearchesResponse = z.infer<typeof homeSearchesResponseSchema>;
