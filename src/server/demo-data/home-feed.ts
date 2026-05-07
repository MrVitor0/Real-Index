import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import { z } from "zod";

import {
  featuredMarketSchema,
  homeFeedDataSchema,
  homeNavigationSchema,
  homeSidebarSchema,
  openMarketsSchema,
} from "@/features/home/contracts/home-feed";
import { createFeaturedMarketServerSnapshot } from "@/server/demo-data/featured-market-snapshot";

const homeDataDirectory = path.join(process.cwd(), "data", "home");

async function readHomeSection<T>(
  fileName: string,
  schema: z.ZodType<T>,
): Promise<T> {
  const filePath = path.join(homeDataDirectory, fileName);
  const fileContent = await readFile(filePath, "utf8");

  return schema.parse(JSON.parse(fileContent));
}

const getBaseHomeFeedData = cache(async () => {
  const [navigation, featuredMarket, sidebar, openMarkets] = await Promise.all([
    readHomeSection("navigation.json", homeNavigationSchema),
    readHomeSection("featured-market.json", featuredMarketSchema),
    readHomeSection("sidebar.json", homeSidebarSchema),
    readHomeSection("open-markets.json", openMarketsSchema),
  ]);

  return homeFeedDataSchema.parse({
    navigation,
    featuredMarket,
    sidebar,
    openMarkets,
  });
});

export async function getHomeFeedData(now = new Date()) {
  const baseData = await getBaseHomeFeedData();

  return homeFeedDataSchema.parse({
    ...baseData,
    featuredMarket: createFeaturedMarketServerSnapshot(
      baseData.featuredMarket,
      now,
    ),
  });
}

export async function getHomeNavigation() {
  const baseData = await getBaseHomeFeedData();

  return baseData.navigation;
}
