"use client";

import { useMemo } from "react";

import type { FeaturedMarket } from "@/features/home/contracts/home-feed";
import { createFeaturedMarketLiveState } from "@/features/home/lib/featured-market-live";

export function useFeaturedMarketLive(market: FeaturedMarket) {
  return useMemo(() => createFeaturedMarketLiveState(market), [market]);
}
