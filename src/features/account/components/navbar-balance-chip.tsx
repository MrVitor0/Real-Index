"use client";

import type { Route } from "next";
import Link from "next/link";
import { LoaderCircle, WalletCards } from "lucide-react";

import type { NavbarBalance } from "@/features/account/contracts/navbar-balance";
import { useNavbarBalance } from "@/features/account/hooks/use-navbar-balance";
import { cn } from "@/lib/utils";

type NavbarBalanceChipProps = {
  initialBalance: NavbarBalance | null;
  className?: string;
};

const positionsRoute = "/conta/posicoes" as Route;

export function NavbarBalanceChip({
  initialBalance,
  className,
}: NavbarBalanceChipProps) {
  const { data, status } = useNavbarBalance(initialBalance);
  const resolvedBalance = data ?? initialBalance;

  return (
    <Link
      href={positionsRoute}
      className={cn(
        "hidden h-12 min-w-[11rem] items-center gap-3 rounded-2xl border border-primary/18 bg-primary/10 px-4 text-white transition-colors hover:bg-primary/14 sm:flex",
        className,
      )}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/14 text-primary">
        <WalletCards className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-primary/72">
          Saldo livre
        </p>
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-white">
            {resolvedBalance?.availableCreditsLabel ?? "Carregando..."}
          </p>
          {status === "loading" ? (
            <LoaderCircle className="h-3.5 w-3.5 shrink-0 animate-spin text-primary/72" />
          ) : null}
        </div>
      </div>
    </Link>
  );
}
