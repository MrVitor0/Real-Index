"use client";

import type { Route } from "next";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useEffectEvent, useState } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  LoaderCircle,
  Wallet,
} from "lucide-react";

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
  RadarForecastPreviewResponse,
  RadarMarketDetail,
} from "@/features/market-detail/contracts/radar-market-detail";
import {
  radarForecastAccountStateSchema,
  radarForecastExecutionResponseSchema,
  radarForecastPreviewResponseSchema,
} from "@/features/market-detail/contracts/radar-market-detail";
import {
  formatCredits,
  formatCreditsInput,
  formatQuickCreditsLabel,
  formatSignalScore,
  parseCreditsInput,
} from "@/features/market-detail/lib/forecast";
import { dispatchNavbarBalanceSync } from "@/features/account/lib/navbar-balance-sync";
import { cn } from "@/lib/utils";

type RadarForecastPanelProps = {
  market: RadarMarketDetail;
  initialAccountState: RadarForecastAccountState;
  onAccountStateChange?: (state: RadarForecastAccountState) => void;
  onMarketUpdate?: (market: RadarMarketDetail) => void;
};

type ForecastAccountStateStatus = "loading" | "success" | "error";

const SCENARIO_BUTTON_BASE_CLASS =
  "flex min-w-0 flex-1 items-center justify-between gap-2 rounded-[18px] px-3 py-3 text-left transition-colors";

const PREVIEW_ROW_CLASS =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3";

const PREVIEW_LABEL_CLASS =
  "min-w-0 truncate text-[clamp(0.8rem,2.25vw,0.92rem)] leading-none text-white/54";

const PREVIEW_VALUE_CLASS =
  "shrink-0 whitespace-nowrap text-right text-[clamp(0.88rem,2.8vw,1rem)] font-semibold leading-none text-white";

const ACCOUNT_REFRESH_MS = 15_000;
const accountPositionsRoute = "/conta/posicoes" as Route;

const FORECAST_ROUTE_UNAVAILABLE_MESSAGE =
  "As rotas de forecast ainda nao estao ativas neste servidor local. Reinicie o Next para carregar os endpoints novos.";

function formatForecastRequestError(error: unknown, fallbackMessage: string) {
  if (error instanceof Error && error.message === "Failed to fetch") {
    return "Nao foi possivel falar com a API dessa operacao agora. Recarregue o radar e tente novamente.";
  }

  return error instanceof Error ? error.message : fallbackMessage;
}

async function readRoutePayload(response: Response) {
  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();

  return {
    error:
      response.status === 404 || text.includes("<!DOCTYPE html")
        ? FORECAST_ROUTE_UNAVAILABLE_MESSAGE
        : "O servidor respondeu em um formato inesperado para esse forecast.",
    rawText: text,
  };
}

function getEntryActionLabel(input: {
  preview: RadarForecastPreviewResponse | null;
  openPosition: RadarForecastAccountState["openPosition"];
  position: "yes" | "no";
}) {
  if (input.preview) {
    return input.preview.actionLabel;
  }

  if (!input.openPosition) {
    return "Abrir forecast";
  }

  return input.openPosition.side === input.position
    ? "Reforcar leitura"
    : "Virar leitura";
}

export function RadarForecastPanel({
  market,
  initialAccountState,
  onAccountStateChange,
  onMarketUpdate,
}: RadarForecastPanelProps) {
  const router = useRouter();
  const [position, setPosition] = useState<"yes" | "no">("yes");
  const [mode, setMode] = useState<"entry" | "exit">("entry");
  const [creditsInput, setCreditsInput] = useState(() =>
    formatCreditsInput(
      Math.max(market.participationConfig.minimumCredits, 250),
    ),
  );
  const [accountState, setAccountState] =
    useState<RadarForecastAccountState>(initialAccountState);
  const [accountStatus, setAccountStatus] =
    useState<ForecastAccountStateStatus>("success");
  const [accountError, setAccountError] = useState<string | null>(null);
  const [preview, setPreview] = useState<RadarForecastPreviewResponse | null>(
    null,
  );
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [previewStatus, setPreviewStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [executionMessage, setExecutionMessage] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const credits = parseCreditsInput(creditsInput);
  const currentPosition = accountState?.openPosition ?? null;
  const effectiveMode = mode === "exit" && !currentPosition ? "entry" : mode;
  const resolvedPosition =
    effectiveMode === "exit" && currentPosition
      ? currentPosition.side
      : position;
  const minimumCredits =
    effectiveMode === "entry" ? market.participationConfig.minimumCredits : 1;
  const isAuthenticated = accountState?.authStatus === "authenticated";
  const loginRoute =
    `/login?next=${encodeURIComponent(`/radar/${market.id}`)}` as Route;
  const executeActionLabel =
    effectiveMode === "exit"
      ? (preview?.actionLabel ?? "Vender credits")
      : getEntryActionLabel({
          preview,
          openPosition: currentPosition,
          position: resolvedPosition,
        });
  const canPreview =
    isAuthenticated &&
    (effectiveMode === "entry"
      ? credits >= minimumCredits
      : Boolean(currentPosition) && credits > 0);
  const canExecute = Boolean(preview) && !isExecuting;
  const scenarioLocked = effectiveMode === "exit" && Boolean(currentPosition);
  const reviewActionLabel =
    effectiveMode === "entry" ? "Fazer palpite" : "Revisar operacao";

  const resetActionState = () => {
    setPreview(null);
    setPreviewStatus("idle");
    setIsPreviewDialogOpen(false);
    setServerError(null);
  };

  const loadAccountState = useEffectEvent(async (signal: AbortSignal) => {
    setAccountStatus((currentStatus) =>
      accountState ? currentStatus : "loading",
    );

    try {
      const response = await fetch(
        `/api/v1/radar/${market.id}/forecast-state`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          signal,
          headers: {
            Accept: "application/json",
          },
        },
      );

      const payload = await readRoutePayload(response);

      if (!response.ok) {
        if (
          response.status === 404 &&
          payload &&
          typeof payload === "object" &&
          "error" in payload &&
          payload.error === FORECAST_ROUTE_UNAVAILABLE_MESSAGE
        ) {
          setAccountStatus("success");
          setAccountError(null);
          return;
        }

        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "Nao foi possivel carregar seu estado nesse radar.",
        );
      }

      if (signal.aborted) {
        return;
      }

      const nextAccountState = radarForecastAccountStateSchema.parse(payload);

      setAccountState(nextAccountState);
      dispatchNavbarBalanceSync({
        authStatus: nextAccountState.authStatus,
        availableCredits: nextAccountState.availableCredits,
        availableCreditsLabel: nextAccountState.availableCreditsLabel,
      });
      onAccountStateChange?.(nextAccountState);
      setAccountStatus("success");
      setAccountError(null);
    } catch (error) {
      if (signal.aborted) {
        return;
      }

      setAccountStatus("error");
      setAccountError(
        error instanceof Error
          ? error.message
          : "Nao foi possivel carregar seu estado nesse radar.",
      );
    }
  });

  useEffect(() => {
    let isCancelled = false;
    let timeoutId: number | null = null;
    let activeAbortController: AbortController | null = null;

    const loadAndSchedule = async () => {
      activeAbortController?.abort();
      activeAbortController = new AbortController();

      await loadAccountState(activeAbortController.signal);

      if (isCancelled) {
        return;
      }

      timeoutId = window.setTimeout(() => {
        void loadAndSchedule();
      }, ACCOUNT_REFRESH_MS);
    };

    void loadAndSchedule();

    return () => {
      isCancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      activeAbortController?.abort();
    };
  }, [market.id]);

  const handlePreviewRequest = async () => {
    if (!canPreview) {
      resetActionState();
      return;
    }

    setIsPreviewDialogOpen(true);
    setPreviewStatus("loading");
    setServerError(null);
    setExecutionMessage(null);
    setPreview(null);

    try {
      const response = await fetch(
        `/api/v1/radar/${market.id}/forecast-preview`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            creditsInput,
            mode: effectiveMode,
            position: resolvedPosition,
          }),
        },
      );

      const payload = await readRoutePayload(response);

      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "Nao foi possivel validar esse forecast.",
        );
      }

      setPreview(radarForecastPreviewResponseSchema.parse(payload));
      setPreviewStatus("success");
    } catch (error) {
      setPreviewStatus("error");
      setServerError(
        formatForecastRequestError(
          error,
          "Nao foi possivel validar esse forecast.",
        ),
      );
    }
  };

  const handleExecute = async () => {
    if (!preview || isExecuting) {
      return;
    }

    setIsExecuting(true);
    setServerError(null);
    setExecutionMessage(null);

    try {
      const response = await fetch(
        `/api/v1/radar/${market.id}/forecast-execution`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            creditsInput,
            mode: effectiveMode,
            position: resolvedPosition,
          }),
        },
      );
      const payload = await readRoutePayload(response);

      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "Nao foi possivel confirmar essa operacao.",
        );
      }

      const result = radarForecastExecutionResponseSchema.parse(
        payload,
      ) as RadarForecastExecutionResponse;

      setExecutionMessage(result.message);
      setAccountState(result.viewerState);
      dispatchNavbarBalanceSync({
        authStatus: result.viewerState.authStatus,
        availableCredits: result.viewerState.availableCredits,
        availableCreditsLabel: result.viewerState.availableCreditsLabel,
      });
      onAccountStateChange?.(result.viewerState);
      setPreview(null);
      setPreviewStatus("idle");
      setIsPreviewDialogOpen(false);
      onMarketUpdate?.(result.market);

      if (result.viewerState.openPosition?.side) {
        setPosition(result.viewerState.openPosition.side);
      }

      startTransition(() => {
        router.push(accountPositionsRoute);
        router.refresh();
      });
    } catch (error) {
      setServerError(
        formatForecastRequestError(
          error,
          "Nao foi possivel confirmar essa operacao.",
        ),
      );
    } finally {
      setIsExecuting(false);
    }
  };

  const applyQuickCredits = (quickCredits: number) => {
    startTransition(() => {
      const nextCredits = parseCreditsInput(creditsInput) + quickCredits;
      resetActionState();
      setCreditsInput(formatCreditsInput(nextCredits));
    });
  };

  return (
    <>
      <Card className="code-surface border-white/7 bg-market-surface/96 shadow-[0_28px_86px_-40px_rgba(0,0,0,0.96)] xl:sticky xl:top-24">
        <CardContent className="space-y-5 px-5 pb-5 pt-0">
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
                  onClick={() => {
                    resetActionState();
                    setMode("entry");
                  }}
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
                  onClick={() => {
                    resetActionState();
                    setMode("exit");
                  }}
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

                  resetActionState();
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

                  resetActionState();
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
                {effectiveMode === "entry"
                  ? "REAL Credits"
                  : "Credits para Vender"}
              </Label>
              <span className="shrink-0 whitespace-nowrap text-[11px] text-white/38">
                Minimo {formatCredits(minimumCredits)}
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
                onChange={(event) => {
                  resetActionState();
                  setCreditsInput(formatCreditsInput(event.target.value));
                }}
                className="h-14 rounded-2xl border-white/8 bg-white/3 px-4 pr-15 text-[clamp(1rem,4.4vw,1.25rem)] font-semibold tracking-tight text-white"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.2em] text-white/34">
                RC
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {market.participationConfig.quickCredits.map((quickCredits) => (
                <button
                  key={quickCredits}
                  type="button"
                  onClick={() => applyQuickCredits(quickCredits)}
                  className="rounded-xl border border-white/8 bg-white/3 px-2 py-2 text-[clamp(0.72rem,2.3vw,0.82rem)] font-semibold whitespace-nowrap text-white/62 transition-colors hover:bg-white/6 hover:text-white/82"
                >
                  {formatQuickCreditsLabel(quickCredits)}
                </button>
              ))}
            </div>
          </div>

          {executionMessage ? (
            <p className="text-xs leading-5 text-primary">{executionMessage}</p>
          ) : null}

          {serverError ? (
            <p className="text-xs leading-5 text-market-warning">
              {serverError}
            </p>
          ) : accountStatus === "error" && accountError ? (
            <p className="text-xs leading-5 text-market-warning">
              {accountError}
            </p>
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
              disabled={
                !canPreview || previewStatus === "loading" || isExecuting
              }
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

          {accountState?.authStatus === "authenticated" && currentPosition ? (
            <div className="rounded-[22px] border border-white/8 bg-white/3 p-4 text-xs leading-6 text-white/50">
              <div className="flex items-center gap-2 text-white/70">
                <AlertTriangle className="h-3.5 w-3.5" />
                Saida parcial usa sua posicao atual; reforco no lado oposto
                fecha a leitura aberta antes de entrar na nova.
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent
          showCloseButton={!isExecuting}
          className="code-surface w-full max-w-lg rounded-[28px] border border-white/8 bg-market-surface/98 p-0 text-white ring-white/10"
        >
          <div className="space-y-5 px-5 pb-5 pt-5">
            <DialogHeader className="space-y-2">
              <DialogTitle className="text-lg font-semibold text-white">
                Preview da operacao
              </DialogTitle>
              <DialogDescription className="leading-6 text-white/52">
                Revise saldo, cotas e impacto antes de confirmar no mercado.
              </DialogDescription>
            </DialogHeader>

            {previewStatus === "loading" ? (
              <div className="flex min-h-48 items-center justify-center rounded-[22px] border border-white/8 bg-white/3 px-4 py-6 text-sm text-white/56">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Validando a preview da operacao
              </div>
            ) : preview ? (
              <div className="rounded-[22px] border border-white/8 bg-white/3 p-4">
                <div className="space-y-3">
                  <div className={PREVIEW_ROW_CLASS}>
                    <span className={PREVIEW_LABEL_CLASS}>Operacao</span>
                    <span className={PREVIEW_VALUE_CLASS}>
                      {preview.actionLabel}
                    </span>
                  </div>
                  <div className={PREVIEW_ROW_CLASS}>
                    <span className={PREVIEW_LABEL_CLASS}>Posicao</span>
                    <span className={PREVIEW_VALUE_CLASS}>
                      {preview.positionLabel}
                    </span>
                  </div>
                  <div className={PREVIEW_ROW_CLASS}>
                    <span className={PREVIEW_LABEL_CLASS}>Cotas</span>
                    <span className={PREVIEW_VALUE_CLASS}>
                      {preview.sharesLabel}
                    </span>
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
              <div className="rounded-[22px] border border-market-warning/18 bg-market-warning/10 px-4 py-3 text-sm text-market-warning">
                Nao foi possivel montar a preview dessa operacao agora.
              </div>
            )}

            {serverError ? (
              <p className="text-xs leading-5 text-market-warning">
                {serverError}
              </p>
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
        </DialogContent>
      </Dialog>
    </>
  );
}
