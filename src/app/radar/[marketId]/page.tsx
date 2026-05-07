import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AppNavbar } from "@/components/navigation/app-navbar";
import { siteConfig } from "@/config/site";
import { RadarMarketDetailPage } from "@/features/market-detail/components/radar-market-detail-page";
import { getRadarMarketDetailBySlug } from "@/server/markets/catalog";

export const dynamic = "force-dynamic";

type RadarMarketDetailRouteProps = {
  params: Promise<{
    marketId: string;
  }>;
};

export async function generateMetadata({
  params,
}: RadarMarketDetailRouteProps): Promise<Metadata> {
  const { marketId } = await params;
  const market = await getRadarMarketDetailBySlug(marketId);

  if (!market) {
    return {
      title: "Mercado nao encontrado",
      description:
        "O radar solicitado nao foi encontrado no REAL Severity Index.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: market.title,
    description: `${market.overview} ${siteConfig.legalDisclaimer}`,
    keywords: market.tags,
    alternates: {
      canonical: `/radar/${marketId}`,
    },
    openGraph: {
      title: `${market.title} | ${siteConfig.shortName}`,
      description: market.overview,
      url: `/radar/${marketId}`,
      type: "website",
    },
    twitter: {
      title: `${market.title} | ${siteConfig.shortName}`,
      description: market.overview,
    },
  };
}

export default async function RadarMarketDetailRoute({
  params,
}: RadarMarketDetailRouteProps) {
  const { marketId } = await params;
  const market = await getRadarMarketDetailBySlug(marketId);

  if (!market) {
    notFound();
  }

  return (
    <>
      <AppNavbar />
      <RadarMarketDetailPage market={market} />
    </>
  );
}
