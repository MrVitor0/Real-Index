"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import {
  BarChart3,
  CircleHelp,
  Gift,
  LockKeyhole,
  Menu,
  Settings,
} from "lucide-react";
import {
  SignedIn,
  SignedOut,
  UserButton,
  authLocalization,
} from "@neondatabase/auth/react/ui";

import { RealLogoLockup } from "@/components/branding/real-logo";
import { Button, buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavbarBalanceChip } from "@/features/account/components/navbar-balance-chip";
import type { NavbarBalance } from "@/features/account/contracts/navbar-balance";
import { HomeSearches } from "@/features/home/components/home-searches";
import { cn } from "@/lib/utils";
import type { HomeNavigation } from "@/features/home/contracts/home-feed";
import type { NavbarBalanceChipLiveState } from "@/features/account/components/navbar-balance-chip";

type DashboardHeaderProps = {
  navigation: HomeNavigation;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  authEnabled: boolean;
  authStatus: "anonymous" | "authenticated";
  initialBalance: NavbarBalance | null;
  liveBalanceState?: NavbarBalanceChipLiveState;
};

const loginRoute = "/login" as Route;
const signUpRoute = "/cadastro" as Route;
const accountRoute = "/conta" as Route;
const createMarketRoute = "/conta/mercados/novo" as Route;
const createMarketSignUpRoute =
  "/cadastro?next=%2Fconta%2Fmercados%2Fnovo" as Route;
const marketplaceRoute = "/marketplace" as Route;
const positionsRoute = "/conta/posicoes" as Route;
const userButtonLocalization = {
  ...authLocalization,
  SIGN_OUT: "Desconectar",
};

export function DashboardHeader({
  navigation,
  searchQuery,
  onSearchQueryChange,
  authEnabled,
  authStatus,
  initialBalance,
  liveBalanceState,
}: DashboardHeaderProps) {
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const resolvedSearchQuery = searchQuery ?? internalSearchQuery;
  const handleSearchQueryChange = onSearchQueryChange ?? setInternalSearchQuery;
  const secondaryLinks = navigation.topLinks.filter(
    (link) => link.id !== "entrar" && link.id !== "beta",
  );
  const authStateLabel = !authEnabled
    ? "auth neon offline"
    : authStatus === "anonymous"
      ? "modo leitura"
      : "sessao ativa";
  const authStateClassName = !authEnabled
    ? "border border-white/10 bg-white/6 text-white/60"
    : authStatus === "anonymous"
      ? "border border-market-warning/20 bg-market-warning/12 text-market-warning"
      : "border border-primary/20 bg-primary/12 text-primary";
  const authStateDotClassName = !authEnabled
    ? "bg-white/40"
    : authStatus === "anonymous"
      ? "bg-market-warning"
      : "bg-primary";

  return (
    <header className="surface-noise sticky top-0 z-40 border-b border-white/6 bg-market-panel/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-470 flex-col gap-3 px-4 py-3 md:px-6 lg:px-8">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 lg:grid-cols-[auto_minmax(0,1fr)_auto]">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex min-w-0 items-center gap-3 rounded-2xl"
            >
              <RealLogoLockup
                eyebrow={navigation.brandBadge}
                subtitle={siteConfig.tagline}
                className="min-w-0"
                markClassName="h-10 w-10"
                titleClassName="text-lg sm:text-xl"
                subtitleClassName="hidden max-w-[34rem] sm:block"
              />
            </Link>
          </div>

          <div className="order-3 col-span-2 w-full lg:order-0 lg:col-span-1 lg:mx-auto lg:max-w-2xl">
            <HomeSearches
              query={resolvedSearchQuery}
              onQueryChange={handleSearchQueryChange}
              placeholder={navigation.searchPlaceholder}
            />
          </div>

          <div className="flex items-center justify-end gap-2 justify-self-end">
            {authEnabled ? (
              <>
                <SignedIn>
                  <Link
                    href={createMarketRoute}
                    className={buttonVariants({
                      size: "sm",
                      className: "hidden h-10 rounded-xl px-4 xl:inline-flex",
                    })}
                  >
                    Criar novo Mercado
                  </Link>
                </SignedIn>

                <SignedOut>
                  <Link
                    href={createMarketSignUpRoute}
                    className={buttonVariants({
                      variant: "outline",
                      className:
                        "hidden h-10 rounded-xl border-white/8 bg-white/4 px-4 text-white/72 hover:bg-white/8 hover:text-white xl:inline-flex",
                    })}
                  >
                    <LockKeyhole className="h-4 w-4" />
                    Criar novo Mercado
                  </Link>
                </SignedOut>
              </>
            ) : null}

            <Link
              href={marketplaceRoute}
              className={buttonVariants({
                variant: "outline",
                className:
                  "hidden h-10 rounded-xl border-white/8 bg-white/4 px-4 text-white/76 hover:bg-white/8 hover:text-white xl:inline-flex",
              })}
            >
              Marketplace
            </Link>

            {authEnabled ? (
              <>
                <SignedOut>
                  <Link
                    href={signUpRoute}
                    className={buttonVariants({
                      size: "sm",
                      className: "h-10 rounded-xl px-4",
                    })}
                  >
                    Criar Conta
                  </Link>
                </SignedOut>

                <SignedIn>
                  <NavbarBalanceChip
                    initialBalance={initialBalance}
                    liveState={liveBalanceState}
                  />
                  <UserButton
                    size="icon"
                    className="hidden cursor-pointer sm:flex"
                    disableDefaultLinks
                    localization={userButtonLocalization}
                    classNames={{ content: { menuItem: "cursor-pointer" } }}
                    additionalLinks={[
                      {
                        href: accountRoute,
                        icon: <Settings className="h-4 w-4" />,
                        label: "Minha conta",
                        signedIn: true,
                      },
                      {
                        href: positionsRoute,
                        icon: <BarChart3 className="h-4 w-4" />,
                        label: "Minhas Posições",
                        signedIn: true,
                      },
                      {
                        href: marketplaceRoute,
                        icon: <Gift className="h-4 w-4" />,
                        label: "Marketplace",
                        signedIn: true,
                      },
                    ]}
                  />
                </SignedIn>
              </>
            ) : (
              <>
                <Link
                  href={loginRoute}
                  className={buttonVariants({
                    variant: "outline",
                    className:
                      "h-10 rounded-xl border-white/8 bg-white/4 px-4 text-white/76 hover:bg-white/8 hover:text-white",
                  })}
                >
                  Entrar
                </Link>
              </>
            )}

            <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Abrir menu principal"
                    className="h-10 w-10 rounded-xl border border-white/8 bg-white/4 text-white/76 hover:bg-white/8 hover:text-white lg:hidden"
                  />
                }
              >
                <Menu className="h-4 w-4" />
              </SheetTrigger>

              <SheetContent
                side="right"
                className="w-full border-white/8 bg-market-panel/96 text-white sm:max-w-sm"
              >
                <SheetHeader className="border-b border-white/8 px-5 py-5">
                  <RealLogoLockup
                    eyebrow={navigation.brandBadge}
                    subtitle={siteConfig.legalDisclaimer}
                    markClassName="h-10 w-10"
                    titleClassName="text-base"
                    subtitleClassName="max-w-[16rem] whitespace-normal leading-5"
                  />
                  <SheetTitle className="sr-only">Navegacao</SheetTitle>
                  <SheetDescription className="text-white/55">
                    Atalhos, canais e acoes da conta em um painel unico.
                  </SheetDescription>
                  <div
                    className={cn(
                      "inline-flex w-fit items-center rounded-full px-3 py-1 text-[11px] font-medium",
                      authStateClassName,
                    )}
                  >
                    <span
                      className={cn(
                        "mr-2 h-1.5 w-1.5 rounded-full",
                        authStateDotClassName,
                      )}
                    />
                    {authStateLabel}
                  </div>
                </SheetHeader>

                <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
                  {secondaryLinks.length > 0 ? (
                    <div className="space-y-3">
                      <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/32">
                        Atalhos
                      </p>
                      <div className="grid gap-2">
                        {secondaryLinks.map((link) => (
                          <a
                            key={link.id}
                            href={link.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="inline-flex items-center gap-3 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-medium text-white/76 transition-colors hover:bg-white/8 hover:text-white"
                          >
                            {link.id === "documentacao" ? (
                              <CircleHelp className="h-4 w-4 text-market-info" />
                            ) : link.id === "marketplace" ? (
                              <Gift className="h-4 w-4 text-primary" />
                            ) : null}
                            <span>{link.label}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="space-y-3">
                    <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-white/32">
                      Canais
                    </p>
                    <div className="grid gap-2">
                      {navigation.categories.map((category, index) => (
                        <a
                          key={category.id}
                          href={category.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={cn(
                            "inline-flex items-center justify-between rounded-2xl border px-4 py-3 text-sm font-medium transition-colors",
                            index === 0
                              ? "border-primary/25 bg-primary/10 text-primary"
                              : "border-white/8 bg-white/4 text-white/72 hover:bg-white/8 hover:text-white",
                          )}
                        >
                          <span>{category.label}</span>
                          <span className="font-mono text-[11px] text-white/28">
                            /
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                <SheetFooter className="border-t border-white/8 px-5 py-5">
                  {authEnabled ? (
                    <>
                      <SignedOut>
                        <Link
                          href={createMarketSignUpRoute}
                          onClick={() => setIsMenuOpen(false)}
                          className={buttonVariants({
                            variant: "outline",
                            className:
                              "h-11 rounded-xl border-white/8 bg-white/4 px-4 text-white/76 hover:bg-white/8 hover:text-white",
                          })}
                        >
                          <LockKeyhole className="h-4 w-4" />
                          Criar novo Mercado
                        </Link>
                        <Link
                          href={signUpRoute}
                          onClick={() => setIsMenuOpen(false)}
                          className={buttonVariants({
                            size: "sm",
                            className: "h-11 rounded-xl px-4",
                          })}
                        >
                          Criar Conta
                        </Link>
                        <Link
                          href={loginRoute}
                          onClick={() => setIsMenuOpen(false)}
                          className={buttonVariants({
                            variant: "outline",
                            className:
                              "h-11 rounded-xl border-white/8 bg-white/4 px-4 text-white/76 hover:bg-white/8 hover:text-white",
                          })}
                        >
                          Entrar
                        </Link>
                      </SignedOut>

                      <SignedIn>
                        <Link
                          href={createMarketRoute}
                          onClick={() => setIsMenuOpen(false)}
                          className={buttonVariants({
                            size: "sm",
                            className: "h-11 rounded-xl px-4",
                          })}
                        >
                          Criar radar
                        </Link>
                        <Link
                          href={accountRoute}
                          onClick={() => setIsMenuOpen(false)}
                          className={buttonVariants({
                            variant: "outline",
                            className:
                              "h-11 rounded-xl border-white/8 bg-white/4 px-4 text-white/76 hover:bg-white/8 hover:text-white",
                          })}
                        >
                          Abrir conta
                        </Link>
                      </SignedIn>
                    </>
                  ) : (
                    <>
                      <Link
                        href={signUpRoute}
                        onClick={() => setIsMenuOpen(false)}
                        className={buttonVariants({
                          size: "sm",
                          className: "h-11 rounded-xl px-4",
                        })}
                      >
                        Criar Conta
                      </Link>
                      <Link
                        href={loginRoute}
                        onClick={() => setIsMenuOpen(false)}
                        className={buttonVariants({
                          variant: "outline",
                          className:
                            "h-11 rounded-xl border-white/8 bg-white/4 px-4 text-white/76 hover:bg-white/8 hover:text-white",
                        })}
                      >
                        Entrar
                      </Link>
                    </>
                  )}
                </SheetFooter>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
