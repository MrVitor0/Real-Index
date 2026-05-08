import { z } from "zod";

export const homeToneSchema = z.enum([
  "primary",
  "sky",
  "mint",
  "gold",
  "coral",
  "slate",
]);

export const marketDirectionSchema = z.enum(["up", "down", "flat"]);

const navigationItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string(),
});

export const homeNavigationSchema = z.object({
  brandLabel: z.string(),
  brandBadge: z.string(),
  searchPlaceholder: z.string(),
  topLinks: z.array(navigationItemSchema),
  categories: z.array(navigationItemSchema),
});

export const featuredOutcomeSchema = z.object({
  id: z.string(),
  label: z.string(),
  probability: z.number().min(0).max(100),
  change: z.number(),
  tone: homeToneSchema,
});

export const featuredCommentSchema = z.object({
  id: z.string(),
  name: z.string(),
  message: z.string(),
  tone: homeToneSchema,
});

export const featuredChartPointSchema = z
  .object({
    label: z.string(),
  })
  .catchall(z.number().min(0).max(100));

export const featuredChartSchema = z.object({
  yAxisTicks: z.array(z.number().min(0).max(100)),
  points: z.array(featuredChartPointSchema),
});

export const relatedMarketSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const featuredMarketSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.string(),
  subCategory: z.string(),
  iconLabel: z.string(),
  headlineOutcomeId: z.string(),
  volumeLabel: z.string(),
  resolutionLabel: z.string(),
  participantCount: z.number().int().nonnegative(),
  outcomes: z.array(featuredOutcomeSchema),
  comments: z.array(featuredCommentSchema),
  chart: featuredChartSchema,
  relatedMarkets: z.array(relatedMarketSchema),
});

export const breakingNewsItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  probability: z.number().min(0).max(100),
  delta: z.number(),
  tone: homeToneSchema,
});

export const hotTopicItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  valueLabel: z.string(),
  tone: homeToneSchema,
});

export const homeSidebarSchema = z.object({
  breakingTitle: z.string(),
  hotTopicsTitle: z.string(),
  exploreLabel: z.string(),
  breakingNews: z.array(breakingNewsItemSchema),
  hotTopics: z.array(hotTopicItemSchema),
});

export const marketTabSchema = z.object({
  id: z.string(),
  label: z.string(),
});

export const marketCardSchema = z.object({
  id: z.string(),
  title: z.string(),
  subtitle: z.string(),
  probability: z.number().min(0).max(100),
  volumeLabel: z.string(),
  movementLabel: z.string(),
  direction: marketDirectionSchema,
  tone: homeToneSchema,
  iconLabel: z.string(),
  tags: z.array(z.string()),
  yesPriceLabel: z.string(),
  noPriceLabel: z.string(),
});

export const openMarketsSchema = z.object({
  title: z.string(),
  tabs: z.array(marketTabSchema),
  items: z.array(marketCardSchema),
});

export const homeFeedDataSchema = z.object({
  navigation: homeNavigationSchema,
  featuredMarket: featuredMarketSchema,
  featuredMarkets: z.array(featuredMarketSchema).min(1),
  sidebar: homeSidebarSchema,
  openMarkets: openMarketsSchema,
});

export const routeAuthSchema = z.object({
  status: z.enum(["anonymous", "authenticated"]),
  required: z.boolean(),
  hasCredentials: z.boolean(),
  upgradePath: z.string(),
});

export const homeFeedResponseSchema = z.object({
  meta: z.object({
    requestId: z.string(),
    generatedAt: z.string().datetime(),
    auth: routeAuthSchema,
  }),
  data: homeFeedDataSchema,
});

export type HomeTone = z.infer<typeof homeToneSchema>;
export type FeaturedOutcome = z.infer<typeof featuredOutcomeSchema>;
export type FeaturedChartPoint = z.infer<typeof featuredChartPointSchema>;
export type FeaturedMarket = z.infer<typeof featuredMarketSchema>;
export type HomeSidebar = z.infer<typeof homeSidebarSchema>;
export type MarketTab = z.infer<typeof marketTabSchema>;
export type MarketCard = z.infer<typeof marketCardSchema>;
export type HomeNavigation = z.infer<typeof homeNavigationSchema>;
export type HomeFeedData = z.infer<typeof homeFeedDataSchema>;
export type HomeFeedResponse = z.infer<typeof homeFeedResponseSchema>;
