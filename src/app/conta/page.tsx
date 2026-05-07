import type { Metadata } from "next";
import type { Route } from "next";
import Link from "next/link";
import {
  ChartColumnIncreasing,
  Home,
  Layers3,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { UserButton } from "@neondatabase/auth/react/ui";
import { redirect } from "next/navigation";

import { RealLogoLockup } from "@/components/branding/real-logo";
import { AppNavbar } from "@/components/navigation/app-navbar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { getServerSession } from "@/lib/auth/server";
import { getEnvironmentStatus } from "@/lib/env";
import { cn } from "@/lib/utils";
import { listMarketsCreatedByViewer } from "@/server/markets/catalog";
import { getViewerForecastAccountSummary } from "@/server/markets/trading";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Conta",
  description:
    "Area privada da conta para acompanhar seu historico, reputacao e atividade dentro do REAL Severity Index.",
  alternates: {
    canonical: "/conta",
  },
  robots: {
    index: false,
    follow: false,
  },
};

const loginRoute = "/login" as Route;
const loginWithNextRoute = "/login?next=%2Fconta" as Route;
const createMarketRoute = "/conta/mercados/novo" as Route;

export default async function ContaPage() {
  const environment = getEnvironmentStatus();

  if (!environment.hasNeonAuth) {
    redirect(loginRoute);
  }

  const session = await getServerSession();

  if (!session?.user) {
    redirect(loginWithNextRoute);
  }

  const createdMarkets = await listMarketsCreatedByViewer({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image ?? null,
  });
  const forecastSummary = await getViewerForecastAccountSummary({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    image: session.user.image ?? null,
  });

  const sessionExpiration = new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(session.session.expiresAt);

  return (
    <>
      <AppNavbar />

      <main className="min-h-screen bg-background px-4 py-10 text-foreground md:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "w-fit rounded-full border border-white/8 bg-white/4 px-4 text-white/76 hover:bg-white/8 hover:text-white",
            )}
          >
            <Home className="mr-2 h-4 w-4" />
            Voltar ao dashboard
          </Link>

          <section className="surface-noise flex flex-col justify-between gap-6 rounded-[32px] border border-white/8 bg-(--market-surface)/94 p-8 shadow-[0_30px_90px_-40px_rgba(0,0,0,0.9)] md:flex-row md:items-center">
            <div className="space-y-4">
              <RealLogoLockup
                eyebrow="perfil da comunidade"
                subtitle={siteConfig.tagline}
                markClassName="h-12 w-12"
                titleClassName="text-xl md:text-2xl"
                subtitleClassName="whitespace-normal leading-6"
              />
              <Badge className="w-fit rounded-full border border-primary/20 bg-primary/12 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.22em] text-primary hover:bg-primary/12">
                Conta
              </Badge>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-white md:text-4xl">
                  Sua conta esta conectada ao radar.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-white/58 md:text-base">
                  Seu perfil acompanha forecasts, reputacao e REAL Credits
                  virtuais dentro da comunidade, sem dinheiro real, saque ou
                  payout.
                </p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={createMarketRoute}
                    className={buttonVariants({
                      size: "sm",
                      className: "h-11 rounded-xl px-4",
                    })}
                  >
                    Criar novo radar
                  </Link>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-white/8 bg-white/4 p-2">
              <UserButton />
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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
              <Layers3 className="h-5 w-5 text-primary" />
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
                Equity total
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {forecastSummary.totalEquityLabel}
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

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[28px] border border-white/8 bg-(--market-surface)/92 p-6 shadow-[0_24px_64px_-48px_rgba(0,0,0,0.9)]">
              <UserRound className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm font-medium text-white/72">Nome</p>
              <p className="mt-2 text-lg font-semibold text-white">
                {session.user.name}
              </p>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-(--market-surface)/92 p-6 shadow-[0_24px_64px_-48px_rgba(0,0,0,0.9)]">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm font-medium text-white/72">E-mail</p>
              <p className="mt-2 break-all text-lg font-semibold text-white">
                {session.user.email}
              </p>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-(--market-surface)/92 p-6 shadow-[0_24px_64px_-48px_rgba(0,0,0,0.9)]">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm font-medium text-white/72">
                Verificacao
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {session.user.emailVerified
                  ? "Email verificado"
                  : "Email pendente"}
              </p>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-(--market-surface)/92 p-6 shadow-[0_24px_64px_-48px_rgba(0,0,0,0.9)]">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <p className="mt-4 text-sm font-medium text-white/72">
                Sessao expira em
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {sessionExpiration}
              </p>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/8 bg-(--market-surface)/92 p-6 shadow-[0_24px_64px_-48px_rgba(0,0,0,0.9)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                  Suas posicoes
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Leituras abertas pela sua conta.
                </h2>
              </div>

              <Badge className="rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs font-medium text-white/72 hover:bg-white/4">
                {forecastSummary.openPositions} abertas
              </Badge>
            </div>

            {forecastSummary.positions.length > 0 ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {forecastSummary.positions.map((position) => (
                  <Link
                    key={position.id}
                    href={`/radar/${position.slug}` as Route}
                    className="rounded-[24px] border border-white/8 bg-white/3 p-4 transition-colors hover:bg-white/6"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.16em] text-white/34">
                          {position.sideLabel}
                        </p>
                        <h3 className="mt-2 text-lg font-semibold text-white">
                          {position.title}
                        </h3>
                      </div>

                      <span className="text-lg font-semibold text-white">
                        {position.probability}%
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/56">
                      <div>
                        <p>Cotas</p>
                        <p className="mt-1 font-semibold text-white/84">
                          {position.sharesLabel}
                        </p>
                      </div>
                      <div>
                        <p>Em jogo</p>
                        <p className="mt-1 font-semibold text-white/84">
                          {position.investedCreditsLabel}
                        </p>
                      </div>
                      <div>
                        <p>Valor atual</p>
                        <p className="mt-1 font-semibold text-white/84">
                          {position.marketValueCreditsLabel}
                        </p>
                      </div>
                      <div>
                        <p>Delta</p>
                        <p className="mt-1 font-semibold text-white/84">
                          {position.unrealizedDeltaLabel}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-white/46">
                      Fecha em {position.closeLabel}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-7 text-white/52">
                Sua conta ainda nao abriu leituras. Entre em um radar para usar
                seus REAL Credits e mover o grafico da comunidade.
              </p>
            )}
          </section>

          <section className="rounded-[32px] border border-white/8 bg-(--market-surface)/92 p-6 shadow-[0_24px_64px_-48px_rgba(0,0,0,0.9)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-primary">
                  Seus mercados
                </p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Mercados publicados pela sua conta.
                </h2>
              </div>

              <Link
                href={createMarketRoute}
                className={buttonVariants({
                  variant: "outline",
                  className:
                    "h-11 rounded-xl border-white/8 bg-white/4 px-4 text-white/76 hover:bg-white/8 hover:text-white",
                })}
              >
                Novo mercado
              </Link>
            </div>

            {createdMarkets.length > 0 ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {createdMarkets.map((market) => (
                  <Link
                    key={market.id}
                    href={`/radar/${market.slug}` as Route}
                    className="rounded-[24px] border border-white/8 bg-white/3 p-4 transition-colors hover:bg-white/6"
                  >
                    <p className="text-xs uppercase tracking-[0.16em] text-white/34">
                      {market.status}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {market.title}
                    </h3>
                    <div className="mt-4 flex items-center justify-between gap-3 text-sm text-white/60">
                      <span>{market.probability}%</span>
                      <span>{market.closeLabel}</span>
                    </div>
                    <p className="mt-2 text-sm text-white/46">
                      {market.movementLabel}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="mt-5 text-sm leading-7 text-white/52">
                Sua conta ainda nao publicou mercados. Use o botao acima para
                criar o primeiro item e coloca-lo no radar da home.
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
