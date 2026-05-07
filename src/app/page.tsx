import type { Metadata } from "next";

import { HomeDashboard } from "@/features/home/components/home-dashboard";
import { siteConfig } from "@/config/site";
import { getEnvironmentStatus } from "@/lib/env";

export const metadata: Metadata = {
  title: "Forecasts gamificados para comunidade tech",
  description: siteConfig.longDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: `${siteConfig.shortName} | Radar comunitario tech`,
    description: siteConfig.longDescription,
    url: "/",
  },
  twitter: {
    title: `${siteConfig.shortName} | Radar comunitario tech`,
    description: siteConfig.description,
  },
};

export default function Home() {
  const { hasNeonAuth } = getEnvironmentStatus();

  return <HomeDashboard authEnabled={hasNeonAuth} />;
}
