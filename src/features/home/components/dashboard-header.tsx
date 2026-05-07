import Link from "next/link";
import { CircleHelp, Menu, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { HomeNavigation } from "@/features/home/contracts/home-feed";

type DashboardHeaderProps = {
  navigation: HomeNavigation;
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  authStatus: "anonymous" | "authenticated";
};

export function DashboardHeader({
  navigation,
  searchQuery,
  onSearchQueryChange,
  authStatus,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-[color:var(--market-panel)]/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1360px] flex-col gap-4 px-4 py-4 md:px-6 lg:px-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 rounded-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-primary/12 text-sm font-semibold text-primary shadow-lg shadow-primary/10">
                RI
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-semibold tracking-tight text-white">
                  {navigation.brandLabel}
                </span>
                <Badge className="rounded-full border-white/10 bg-white/6 px-2.5 py-1 text-[11px] font-semibold tracking-[0.18em] text-white/70 hover:bg-white/6">
                  {navigation.brandBadge}
                </Badge>
              </div>
            </Link>

            <Badge
              id="auth-preview"
              className="hidden rounded-full border-[color:var(--market-warning)]/20 bg-[color:var(--market-warning)]/12 px-3 py-1 text-[11px] font-medium text-[color:var(--market-warning)] lg:inline-flex"
            >
              {authStatus === "anonymous"
                ? "Anonymous preview"
                : "Authenticated"}
            </Badge>
          </div>

          <div className="relative flex-1 lg:max-w-2xl">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.target.value)}
              placeholder={navigation.searchPlaceholder}
              className="h-12 rounded-2xl border-white/8 bg-white/5 pl-11 pr-12 text-sm text-white placeholder:text-white/45 focus-visible:border-primary/50 focus-visible:ring-primary/20"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium tracking-[0.2em] text-white/28">
              /
            </span>
          </div>

          <div className="flex items-center gap-2 self-end lg:self-auto">
            {navigation.topLinks.map((link) => {
              if (link.id === "sign-up") {
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    className={buttonVariants({
                      size: "sm",
                      className: "h-10 rounded-2xl px-4",
                    })}
                  >
                    {link.label}
                  </a>
                );
              }

              return (
                <a
                  key={link.id}
                  href={link.href}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-2xl px-3 text-sm font-medium text-white/76 transition-colors hover:bg-white/6 hover:text-white",
                    link.id === "how-it-works" &&
                      "hidden text-[color:var(--market-info)] hover:text-[color:var(--market-info)] sm:inline-flex",
                  )}
                >
                  {link.id === "how-it-works" ? (
                    <CircleHelp className="h-4 w-4" />
                  ) : null}
                  {link.label}
                </a>
              );
            })}

            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-2xl border border-white/8 bg-white/4 text-white/76 hover:bg-white/8 hover:text-white"
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <nav className="flex items-center gap-4 overflow-x-auto pb-1">
          {navigation.categories.map((category, index) => (
            <a
              key={category.id}
              href={category.href}
              className={cn(
                "shrink-0 text-sm font-medium text-white/45 transition-colors hover:text-white",
                index === 0 && "text-white",
              )}
            >
              {category.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
