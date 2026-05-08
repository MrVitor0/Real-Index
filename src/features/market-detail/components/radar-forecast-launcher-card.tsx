"use client";

import { ArrowLeftRight, Wallet } from "lucide-react";

import { useForecastOrderDialog } from "@/components/providers/forecast-order-dialog-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  RadarForecastAccountState,
  RadarMarketDetail,
} from "@/features/market-detail/contracts/radar-market-detail";
import type { RadarForecastAccountSyncMode } from "@/features/market-detail/hooks/use-radar-forecast-order";
import {
  formatCredits,
  formatSignalScore,
} from "@/features/market-detail/lib/forecast";

type RadarForecastLauncherCardProps = {
  market: RadarMarketDetail;
  accountState: RadarForecastAccountState;
  accountStateSyncMode?: RadarForecastAccountSyncMode;
  onAccountStateChange?: (state: RadarForecastAccountState) => void;
  onMarketUpdate?: (market: RadarMarketDetail) => void;
};

export function RadarForecastLauncherCard({
  market,
  accountState,
  accountStateSyncMode = "poll",
  onAccountStateChange,
  onMarketUpdate,
}: RadarForecastLauncherCardProps) {
  const { openForecastOrder } = useForecastOrderDialog();
  const currentPosition = accountState.openPosition;

  const openTicket = (input: {
    initialMode?: "entry" | "exit";
    initialPosition?: "yes" | "no";
  }) => {
    openForecastOrder({
      marketId: market.id,
      market,
      initialAccountState: accountState,
      accountStateSyncMode,
      initialMode: input.initialMode,
      initialPosition: input.initialPosition,
      onAccountStateChange,
      onMarketUpdate,
    });
  };

  return (
    <Card className="code-surface border-white/7 bg-market-surface/96 shadow-[0_28px_86px_-40px_rgba(0,0,0,0.96)] xl:sticky xl:top-24">
      <CardContent className="space-y-5 px-5 pb-5 pt-0">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[20px] border border-white/8 bg-white/3 p-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/38">
              <Wallet className="h-3.5 w-3.5" />
              Saldo livre
            </div>
            <p className="mt-2 text-sm font-semibold text-white">
              {accountState.availableCreditsLabel ?? formatCredits(0)}
            </p>
          </div>

          <div className="rounded-[20px] border border-white/8 bg-white/3 p-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/38">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Equity total
            </div>
            <p className="mt-2 text-sm font-semibold text-white">
              {accountState.totalEquityLabel ?? formatCredits(0)}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          <p className="text-xs uppercase tracking-[0.16em] text-white/38">
            Abrir ticket global
          </p>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
            <button
              type="button"
              onClick={() =>
                openTicket({
                  initialMode: "entry",
                  initialPosition: "yes",
                })
              }
              className="flex items-center justify-between gap-3 rounded-[22px] border border-(--market-positive)/24 bg-(--market-positive)/12 px-4 py-3 text-left transition-colors hover:bg-(--market-positive)/18"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">
                  {market.yesLabel}
                </span>
                <span className="mt-1 block text-xs text-white/54">
                  Compra inicial com lado preselecionado
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-white/72">
                {formatSignalScore(market.yesScore)}
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                openTicket({
                  initialMode: "entry",
                  initialPosition: "no",
                })
              }
              className="flex items-center justify-between gap-3 rounded-[22px] border border-(--market-negative)/24 bg-(--market-negative)/12 px-4 py-3 text-left transition-colors hover:bg-(--market-negative)/18"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-white">
                  {market.noLabel}
                </span>
                <span className="mt-1 block text-xs text-white/54">
                  Compra inicial com lado preselecionado
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-white/72">
                {formatSignalScore(market.noScore)}
              </span>
            </button>
          </div>
        </div>

        <div className="rounded-[22px] border border-white/8 bg-white/3 p-4 text-xs leading-6 text-white/50">
          {currentPosition ? (
            <>
              <p className="text-white/72">
                Posicao atual em {currentPosition.sideLabel} com{" "}
                {currentPosition.marketValueCreditsLabel} de valor de mercado.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  openTicket({
                    initialMode: "exit",
                    initialPosition: currentPosition.side,
                  })
                }
                className="mt-3 w-full rounded-2xl border-white/10 bg-white/4 text-white hover:bg-white/8 hover:text-white"
              >
                Vender ou reduzir posicao
              </Button>
            </>
          ) : (
            <p>
              O ticket global reaproveita as mesmas validacoes de preview e
              execucao do radar, incluindo minimo, flip de lado e revalidacao no
              servidor.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
