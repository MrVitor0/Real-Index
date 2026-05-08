"use client";

import type { Route } from "next";
import Link from "next/link";
import { ArrowLeftRight, LoaderCircle, Wallet } from "lucide-react";

import { buttonVariants, Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  RadarForecastAccountState,
  RadarForecastExecutionResponse,
  RadarMarketDetail,
} from "@/features/market-detail/contracts/radar-market-detail";
import {
  formatCredits,
  formatCreditsInput,
  formatQuickCreditsLabel,
  formatSignalScore,
} from "@/features/market-detail/lib/forecast";
import {
  useRadarForecastOrder,
  type RadarForecastAccountSyncMode,
} from "@/features/market-detail/hooks/use-radar-forecast-order";
import { cn } from "@/lib/utils";

type RadarForecastPanelProps = {
  market: RadarMarketDetail;
  initialAccountState: RadarForecastAccountState;
  display?: "card" | "dialog";
  initialMode?: "entry" | "exit";
  initialPosition?: "yes" | "no";
  accountStateSyncMode?: RadarForecastAccountSyncMode;
  executionRedirectRoute?: Route | null;
  onAccountStateChange?: (state: RadarForecastAccountState) => void;
  onMarketUpdate?: (market: RadarMarketDetail) => void;
  onExecutionSuccess?: (result: RadarForecastExecutionResponse) => void;
};

const SCENARIO_BUTTON_BASE_CLASS =
  "flex min-w-0 flex-1 items-center justify-between gap-2 rounded-[18px] px-3 py-3 text-left transition-colors";

const PREVIEW_ROW_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3";

const PREVIEW_LABEL_CLASS =
  "min-w-0 truncate text-[clamp(0.8rem,2.25vw,0.92rem)] leading-none text-white/54";

const PREVIEW_VALUE_CLASS =
  "shrink-0 whitespace-nowrap text-right text-[clamp(0.88rem,2.8vw,1rem)] font-semibold leading-none text-white";

const accountPositionsRoute = "/conta/posicoes" as Route;

export function RadarForecastPanel({
  market,
  initialAccountState,
  display = "card",
  initialMode = "entry",
  initialPosition = "yes",
  accountStateSyncMode = "poll",
  executionRedirectRoute = accountPositionsRoute,
  onAccountStateChange,
  onMarketUpdate,
  onExecutionSuccess,
}: RadarForecastPanelProps) {
  const {
    accountError,
    accountState,
    accountStatus,
    applyQuickCredits,
    applySellAllCredits,
    canExecute,
    canPreview,
    creditsInput,
    currentPosition,
    effectiveMode,
    executeActionLabel,
    executionMessage,
    handleExecute,
    handlePreviewRequest,
    isAuthenticated,
    isExecuting,
    isPreviewDialogOpen,
    loginRoute,
    maxSellableCreditsLabel,
    minimumCredits,
    preview,
    previewStatus,
    resolvedPosition,
    reviewActionLabel,
    scenarioLocked,
    sellAll,
    serverError,
    setCreditsInput,
    setIsPreviewDialogOpen,
    setMode,
    setPosition,
  } = useRadarForecastOrder({
    market,
    initialAccountState,
    accountStateSyncMode,
    initialMode,
    initialPosition,
    executionRedirectRoute,
    onAccountStateChange,
    onMarketUpdate,
    onExecutionSuccess,
  });
  const isInlinePreview = display === "dialog" && isPreviewDialogOpen;
  const previewSurfaceClassName = isInlinePreview
    ? "space-y-3"
    : "rounded-[22px] border border-white/8 bg-white/3 p-4";
  const previewLoadingClassName = isInlinePreview
    ? "flex min-h-48 items-center justify-center rounded-[22px] bg-white/[0.02] px-4 py-6 text-sm text-white/56"
    : "flex min-h-48 items-center justify-center rounded-[22px] border border-white/8 bg-white/3 px-4 py-6 text-sm text-white/56";
  const previewErrorClassName = isInlinePreview
    ? "rounded-[22px] bg-market-warning/10 px-4 py-3 text-sm text-market-warning"
    : "rounded-[22px] border border-market-warning/18 bg-market-warning/10 px-4 py-3 text-sm text-market-warning";

  const previewContent = (
    <div className="space-y-5">
      <DialogHeader className="space-y-2">
        <DialogTitle className="text-balance text-lg font-semibold text-white md:text-[1.35rem]">
          Preview da operacao
        </DialogTitle>
        <DialogDescription className="leading-6 text-white/52">
          Revise saldo, cotas e impacto antes de confirmar no mercado.
        </DialogDescription>
      </DialogHeader>

      {previewStatus === "loading" ? (
        <div className={previewLoadingClassName}>
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          Validando a preview da operacao
        </div>
      ) : preview ? (
        <div className={previewSurfaceClassName}>
          <div className="space-y-3">
            <div className={PREVIEW_ROW_CLASS}>
              <span className={PREVIEW_LABEL_CLASS}>Operacao</span>
              <span className={PREVIEW_VALUE_CLASS}>{preview.actionLabel}</span>
            </div>
            <div className={PREVIEW_ROW_CLASS}>
              <span className={PREVIEW_LABEL_CLASS}>Posicao</span>
              <span className={PREVIEW_VALUE_CLASS}>
                {preview.positionLabel}
              </span>
            </div>
            <div className={PREVIEW_ROW_CLASS}>
              <span className={PREVIEW_LABEL_CLASS}>Cotas</span>
              <span className={PREVIEW_VALUE_CLASS}>{preview.sharesLabel}</span>
            </div>
            <div className={PREVIEW_ROW_CLASS}>
              <span className={PREVIEW_LABEL_CLASS}>Credits</span>
              <span className={PREVIEW_VALUE_CLASS}>
                {preview.creditsLabel}
              </span>
            </div>
            <div className={PREVIEW_ROW_CLASS}>
              <span className={PREVIEW_LABEL_CLASS}>Saldo apos</span>
              <span className={PREVIEW_VALUE_CLASS}>
                {preview.balanceAfterLabel}
              </span>
            </div>
            <div
              className={`${PREVIEW_ROW_CLASS} border-t border-white/8 pt-3`}
            >
              <span className={PREVIEW_LABEL_CLASS}>Leitura</span>
              <span className="shrink-0 whitespace-nowrap text-right text-[clamp(1rem,3vw,1.12rem)] font-semibold leading-none text-primary">
                {preview.deltaLabel}
              </span>
            </div>
          </div>

          <p className="mt-3 text-xs leading-5 text-white/44">
            {preview.exposureLabel} {preview.helperLabel}
          </p>
        </div>
      ) : (
        <div className={previewErrorClassName}>
          Nao foi possivel montar a preview dessa operacao agora.
        </div>
      )}

      {serverError ? (
        <p className="text-xs leading-5 text-market-warning">{serverError}</p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-white/8 pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => setIsPreviewDialogOpen(false)}
          disabled={isExecuting}
          className="rounded-2xl border-white/10 bg-white/3 text-white hover:bg-white/6 hover:text-white"
        >
          Voltar
        </Button>
        <Button
          type="button"
          disabled={!canExecute || previewStatus !== "success"}
          onClick={() => {
            void handleExecute();
          }}
          className="rounded-2xl text-sm font-semibold"
        >
          {isExecuting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Confirmando
            </>
          ) : (
            executeActionLabel
          )}
        </Button>
      </div>
    </div>
  );

  const content = (
    <>
      <div className="space-y-2.5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[20px] border border-white/8 bg-white/3 p-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/38">
              <Wallet className="h-3.5 w-3.5" />
              Saldo livre
            </div>
            <p className="mt-2 text-sm font-semibold text-white">
              {accountState?.availableCreditsLabel ?? formatCredits(0)}
            </p>
          </div>

          <div className="rounded-[20px] border border-white/8 bg-white/3 p-3">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/38">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              Equity total
            </div>
            <p className="mt-2 text-sm font-semibold text-white">
              {accountState?.totalEquityLabel ?? formatCredits(0)}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          <Label className="text-xs uppercase tracking-[0.16em] text-white/38">
            Operacao
          </Label>
          <div className="flex items-center gap-1 rounded-[22px] border border-white/8 bg-white/3 p-1">
            <button
              type="button"
              aria-pressed={effectiveMode === "entry"}
              onClick={() => setMode("entry")}
              className={`${SCENARIO_BUTTON_BASE_CLASS} ${
                effectiveMode === "entry"
                  ? "border border-primary/24 bg-primary/12 text-white"
                  : "border border-transparent bg-transparent text-white/60 hover:bg-white/6 hover:text-white/78"
              }`}
            >
              <span className="min-w-0 truncate text-[clamp(0.82rem,2.25vw,0.95rem)] font-semibold leading-none">
                Comprar
              </span>
            </button>
            <button
              type="button"
              aria-pressed={effectiveMode === "exit"}
              onClick={() => setMode("exit")}
              disabled={!currentPosition}
              className={`${SCENARIO_BUTTON_BASE_CLASS} ${
                effectiveMode === "exit"
                  ? "border border-(--market-negative)/24 bg-(--market-negative)/12 text-white"
                  : "border border-transparent bg-transparent text-white/60 hover:bg-white/6 hover:text-white/78"
              } ${!currentPosition ? "cursor-not-allowed opacity-45" : ""}`}
            >
              <span className="min-w-0 truncate text-[clamp(0.82rem,2.25vw,0.95rem)] font-semibold leading-none">
                Vender
              </span>
            </button>
          </div>
        </div>

        <Label className="text-xs uppercase tracking-[0.16em] text-white/38">
          Cenario
        </Label>
        <div className="flex items-center gap-1 rounded-[22px] border border-white/8 bg-white/3 p-1">
          <button
            type="button"
            aria-pressed={resolvedPosition === "yes"}
            onClick={() => {
              if (scenarioLocked) {
                return;
              }

              setPosition("yes");
            }}
            disabled={scenarioLocked}
            className={`${SCENARIO_BUTTON_BASE_CLASS} ${
              resolvedPosition === "yes"
                ? "border border-(--market-positive)/24 bg-(--market-positive)/12 text-white"
                : "border border-transparent bg-transparent text-white/60 hover:bg-white/6 hover:text-white/78"
            } ${scenarioLocked ? "cursor-not-allowed opacity-70" : ""}`}
          >
            <span className="min-w-0 truncate text-[clamp(0.82rem,2.25vw,0.95rem)] font-semibold leading-none">
              {market.yesLabel}
            </span>
            <span className="shrink-0 whitespace-nowrap text-[clamp(0.74rem,2vw,0.84rem)] leading-none text-white/46">
              {formatSignalScore(market.yesScore)}
            </span>
          </button>
          <button
            type="button"
            aria-pressed={resolvedPosition === "no"}
            onClick={() => {
              if (scenarioLocked) {
                return;
              }

              setPosition("no");
            }}
            disabled={scenarioLocked}
            className={`${SCENARIO_BUTTON_BASE_CLASS} ${
              resolvedPosition === "no"
                ? "border border-(--market-negative)/24 bg-(--market-negative)/12 text-white"
                : "border border-transparent bg-transparent text-white/60 hover:bg-white/6 hover:text-white/78"
            } ${scenarioLocked ? "cursor-not-allowed opacity-70" : ""}`}
          >
            <span className="min-w-0 truncate text-[clamp(0.82rem,2.25vw,0.95rem)] font-semibold leading-none">
              {market.noLabel}
            </span>
            <span className="shrink-0 whitespace-nowrap text-[clamp(0.74rem,2vw,0.84rem)] leading-none text-white/46">
              {formatSignalScore(market.noScore)}
            </span>
          </button>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <Label
            htmlFor="forecast-credits"
            className="text-xs uppercase tracking-[0.16em] text-white/38"
          >
            {effectiveMode === "entry" ? "REAL Credits" : "Credits para Vender"}
          </Label>
          <span className="shrink-0 whitespace-nowrap text-[11px] text-white/38">
            {effectiveMode === "entry"
              ? `Minimo ${formatCredits(minimumCredits)}`
              : `Disponivel ${maxSellableCreditsLabel}`}
          </span>
        </div>

        <div className="relative">
          <Input
            id="forecast-credits"
            inputMode="numeric"
            autoComplete="off"
            spellCheck={false}
            placeholder={formatCreditsInput(250)}
            value={creditsInput}
            onChange={(event) => setCreditsInput(event.target.value)}
            className="h-14 rounded-2xl border-white/8 bg-white/3 px-4 pr-15 text-[clamp(1rem,4.4vw,1.25rem)] font-semibold tracking-tight text-white"
          />
          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.2em] text-white/34">
            RC
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {market.participationConfig.quickCredits.map(
            (quickCredits, index) => {
              const isExitAllButton =
                effectiveMode === "exit" &&
                index === market.participationConfig.quickCredits.length - 1;

              return (
                <button
                  key={isExitAllButton ? "sell-all" : quickCredits}
                  type="button"
                  onClick={() => {
                    if (isExitAllButton) {
                      applySellAllCredits();
                      return;
                    }

                    applyQuickCredits(quickCredits);
                  }}
                  disabled={isExitAllButton && !currentPosition}
                  className={cn(
                    "rounded-xl border border-white/8 bg-white/3 px-2 py-2 text-[clamp(0.72rem,2.3vw,0.82rem)] font-semibold whitespace-nowrap text-white/62 transition-colors hover:bg-white/6 hover:text-white/82",
                    isExitAllButton && sellAll
                      ? "border-(--market-negative)/24 bg-(--market-negative)/12 text-white"
                      : null,
                    isExitAllButton && !currentPosition
                      ? "cursor-not-allowed opacity-45"
                      : null,
                  )}
                >
                  {isExitAllButton
                    ? "Tudo"
                    : formatQuickCreditsLabel(quickCredits)}
                </button>
              );
            },
          )}
        </div>
      </div>

      {executionMessage ? (
        <p className="text-xs leading-5 text-primary">{executionMessage}</p>
      ) : null}

      {serverError ? (
        <p className="text-xs leading-5 text-market-warning">{serverError}</p>
      ) : accountStatus === "error" && accountError ? (
        <p className="text-xs leading-5 text-market-warning">{accountError}</p>
      ) : (
        <p className="text-xs leading-5 text-white/40">
          {isAuthenticated
            ? `Saldo livre ${accountState?.availableCreditsLabel ?? formatCredits(0)}. O servidor revalida a operacao antes de aplicar o novo snapshot do radar.`
            : "Entre para ganhar saldo inicial, abrir leituras, vender credits e ver o grafico responder as operacoes da comunidade."}
        </p>
      )}

      {accountStatus === "loading" ? (
        <Button
          disabled
          className="h-11 w-full rounded-2xl text-sm font-semibold"
        >
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Sincronizando conta
        </Button>
      ) : isAuthenticated ? (
        <Button
          type="button"
          disabled={!canPreview || previewStatus === "loading" || isExecuting}
          onClick={() => {
            void handlePreviewRequest();
          }}
          className="h-11 w-full rounded-2xl text-sm font-semibold"
        >
          {previewStatus === "loading" ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              Carregando preview
            </>
          ) : (
            reviewActionLabel
          )}
        </Button>
      ) : (
        <Link
          href={loginRoute}
          className={cn(
            buttonVariants({
              className: "h-11 w-full rounded-2xl text-sm font-semibold",
            }),
          )}
        >
          Entrar para operar
        </Link>
      )}
    </>
  );

  return (
    <>
      {display === "card" ? (
        <Card className="code-surface border-white/7 bg-market-surface/96 shadow-[0_28px_86px_-40px_rgba(0,0,0,0.96)] xl:sticky xl:top-24">
          <CardContent className="space-y-5 px-5 pb-5 pt-0">
            {content}
          </CardContent>
        </Card>
      ) : isInlinePreview ? (
        <div className="space-y-5">{previewContent}</div>
      ) : (
        <div className="space-y-5">{content}</div>
      )}

      {display === "card" ? (
        <Dialog
          open={isPreviewDialogOpen}
          onOpenChange={setIsPreviewDialogOpen}
        >
          <DialogContent
            showCloseButton={!isExecuting}
            className="code-surface w-full max-w-[calc(100vw-1rem)] rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(95,167,255,0.16),transparent_36%),linear-gradient(180deg,rgba(16,22,30,0.98),rgba(9,13,19,0.98))] p-0 text-white shadow-[0_34px_120px_-50px_rgba(0,0,0,0.96)] ring-white/10 sm:max-w-[min(44rem,calc(100vw-2rem))] lg:max-w-[min(52rem,calc(100vw-3rem))]"
          >
            <div className="space-y-5 px-4 pb-4 pt-4 sm:px-5 md:px-6 md:pb-6 md:pt-6">
              {previewContent}
            </div>
          </DialogContent>
        </Dialog>
      ) : null}
    </>
  );
}
