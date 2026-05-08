import type { Metadata } from "next";

import { AppNavbar } from "@/components/navigation/app-navbar";
import { MarketplaceCatalog } from "@/features/marketplace/components/marketplace-catalog";
import { getServerSession } from "@/lib/auth/server";
import { getMarketplaceCatalog } from "@/server/marketplace/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Marketplace",
  description:
    "Troque seus REAL Credits por perks de comunidade, pedidos internos e experiencias sem valor monetario dentro da plataforma.",
  alternates: {
    canonical: "/marketplace",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function MarketplacePage() {
  const session = await getServerSession();
  const catalog = await getMarketplaceCatalog(
    session?.user
      ? {
          id: session.user.id,
          email: session.user.email,
          name: session.user.name,
          image: session.user.image ?? null,
        }
      : null,
  );

  return (
    <>
      <AppNavbar />

      <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-7xl">
          <MarketplaceCatalog initialCatalog={catalog} />
        </div>
      </main>
    </>
  );
}
