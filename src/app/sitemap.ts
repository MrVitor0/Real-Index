import type { MetadataRoute } from "next";

import { siteConfig } from "@/config/site";
import { getHomeFeedData } from "@/server/markets/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const homeFeed = await getHomeFeedData();
  const lastModified = new Date();

  return [
    {
      url: siteConfig.url,
      lastModified,
      changeFrequency: "hourly",
      priority: 1,
    },
    ...homeFeed.openMarkets.items.map((market) => ({
      url: `${siteConfig.url}/radar/${market.id}`,
      lastModified,
      changeFrequency: "hourly" as const,
      priority: 0.8,
    })),
  ];
}
