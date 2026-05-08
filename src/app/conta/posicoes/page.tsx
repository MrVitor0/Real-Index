import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowLeftRight,
  ChartColumnIncreasing,
  Layers3,
  WalletCards,
} from "lucide-react";
import { redirect } from "next/navigation";

import { AppNavbar } from "@/components/navigation/app-navbar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ForecastPositionsGrid } from "@/features/account/components/forecast-positions-grid";
import { getServerSession } from "@/lib/auth/server";
import { getEnvironmentStatus } from "@/lib/env";
import { cn } from "@/lib/utils";
import { getViewerForecastAccountSummary } from "@/server/markets/trading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Minhas Posições",
  description:
    "Tela dedicada para acompanhar as leituras abertas, delta e alocacao de REAL Credits da sua conta.",
  alternates: {
    canonical: "/conta/posicoes",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const loginRoute = "/login" as Route;
const loginWithNextRoute = "/login?next=%2Fconta%2Fposicoes" as Route;
const accountRoute = "/conta" as Route;

export default async function ContaPosicoesPage() {
  const environment = getEnvironmentStatus();

  if (!environment.hasNeonAuth) {
    redirect(loginRoute);
  }

  const session = await getServerSession();

  if (!session?.user) {
    redirect(loginWithNextRoute);
  }

  const forecastSummary = await getViewerForecastAccountSummary({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image ?? null,
  });

  return (
    <>
      <AppNavbar />

      <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[28px] border border-white/8 bg-(--market-surface)/92 p-6 shadow-[0_24px_64px_-48px_rgba(0,0,0,0.9)]">
              <Layers3 className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm font-medium text-white/72">
                Posicoes abertas
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {forecastSummary.openPositions}
              </p>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-(--market-surface)/92 p-6 shadow-[0_24px_64px_-48px_rgba(0,0,0,0.9)]">
              <WalletCards className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm font-medium text-white/72">
                Saldo livre
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {forecastSummary.availableCreditsLabel}
              </p>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-(--market-surface)/92 p-6 shadow-[0_24px_64px_-48px_rgba(0,0,0,0.9)]">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm font-medium text-white/72">
                Credits em leitura
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {forecastSummary.investedCreditsLabel}
              </p>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-(--market-surface)/92 p-6 shadow-[0_24px_64px_-48px_rgba(0,0,0,0.9)]">
              <ChartColumnIncreasing className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm font-medium text-white/72">
                Delta aberto
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {forecastSummary.unrealizedDeltaLabel}
              </p>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/8 bg-(--market-surface)/92 p-6 shadow-[0_24px_64px_-48px_rgba(0,0,0,0.9)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                  Carteira ativa
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Todas as leituras abertas da sua conta.
                </h2>
              </div>

              <Badge className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs font-medium text-white/72 hover:bg-white/4">
                {forecastSummary.openPositions} abertas
              </Badge>
            </div>

            <div className="mt-5">
              <ForecastPositionsGrid
                positions={forecastSummary.positions}
                emptyMessage="Sua conta ainda nao abriu leituras. Entre em um radar para usar seus REAL Credits e mover o grafico da comunidade."
              />
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
