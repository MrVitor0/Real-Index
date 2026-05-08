"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadarForecastPanel } from "@/features/market-detail/components/radar-forecast-panel";
import type {
  RadarForecastAccountState,
  RadarForecastExecutionResponse,
  RadarMarketDetail,
} from "@/features/market-detail/contracts/radar-market-detail";
import type { RadarForecastAccountSyncMode } from "@/features/market-detail/hooks/use-radar-forecast-order";
import {
  radarForecastAccountStateSchema,
  radarMarketDetailSchema,
} from "@/features/market-detail/contracts/radar-market-detail";

type ForecastOrderDialogRequest = {
  marketId: string;
  initialMode?: "entry" | "exit";
  initialPosition?: "yes" | "no";
  accountStateSyncMode?: RadarForecastAccountSyncMode;
  executionRedirectRoute?: Route | null;
  market?: RadarMarketDetail;
  initialAccountState?: RadarForecastAccountState;
  onAccountStateChange?: (state: RadarForecastAccountState) => void;
  onMarketUpdate?: (market: RadarMarketDetail) => void;
  onExecutionSuccess?: (result: RadarForecastExecutionResponse) => void;
};

type ForecastOrderDialogContextValue = {
  openForecastOrder: (request: ForecastOrderDialogRequest) => void;
  closeForecastOrder: () => void;
};

type DialogResourceState = {
  status: "idle" | "loading" | "ready" | "error";
  market: RadarMarketDetail | null;
  initialAccountState: RadarForecastAccountState | null;
  error: string | null;
};

type ForecastOrderSuccessState = {
  kind: RadarForecastExecutionResponse["kind"];
  marketTitle: string;
  message: string;
  availableCreditsLabel: string;
  totalEquityLabel: string;
  positionLabel: string | null;
};

type ForecastOrderDisclaimerState = "idle" | "required" | "accepted";

const FORECAST_ORDER_DISCLAIMER_STORAGE_KEY =
  "real:forecast-order-disclaimer-accepted:v1";

const ForecastOrderDialogContext =
  createContext<ForecastOrderDialogContextValue | null>(null);

function hasAcceptedForecastOrderDisclaimer() {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(FORECAST_ORDER_DISCLAIMER_STORAGE_KEY) ===
      "true"
    );
  } catch {
    return false;
  }
}

function persistForecastOrderDisclaimerAcceptance() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(FORECAST_ORDER_DISCLAIMER_STORAGE_KEY, "true");
  } catch {
    // Ignora falhas de persistencia e libera o fluxo apenas na sessao atual.
  }
}

function buildForecastLoginRoute(marketId: string) {
  return `/auth/sign-up?next=${encodeURIComponent(`/radar/${marketId}`)}` as Route;
}

function getSuccessBadgeLabel(kind: RadarForecastExecutionResponse["kind"]) {
  switch (kind) {
    case "entry":
      return "Entrada confirmada";
    case "exit":
      return "Saida confirmada";
    case "flip":
      return "Virada confirmada";
  }
}

function buildSuccessState(
  result: RadarForecastExecutionResponse,
): ForecastOrderSuccessState {
  return {
    kind: result.kind,
    marketTitle: result.market.title,
    message: result.message,
    availableCreditsLabel: result.viewerState.availableCreditsLabel,
    totalEquityLabel: result.viewerState.totalEquityLabel,
    positionLabel: result.viewerState.openPosition?.sideLabel ?? null,
  };
}

async function fetchRadarMarketDetail(marketId: string, signal: AbortSignal) {
  const response = await fetch(`/api/v1/radar/${marketId}`, {
    method: "GET",
    cache: "no-store",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar esse mercado agora.");
  }

  const payload = await response.json();

  return radarMarketDetailSchema.parse(payload);
}

async function fetchForecastAccountState(
  marketId: string,
  signal: AbortSignal,
) {
  const response = await fetch(`/api/v1/radar/${marketId}/forecast-state`, {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      "Nao foi possivel sincronizar sua conta para esse mercado.",
    );
  }

  const payload = await response.json();

  return radarForecastAccountStateSchema.parse(payload);
}

export function ForecastOrderDialogProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const [request, setRequest] = useState<ForecastOrderDialogRequest | null>(
    null,
  );
  const [requestKey, setRequestKey] = useState(0);
  const [resource, setResource] = useState<DialogResourceState>({
    status: "idle",
    market: null,
    initialAccountState: null,
    error: null,
  });
  const [disclaimerState, setDisclaimerState] =
    useState<ForecastOrderDisclaimerState>("idle");
  const [successState, setSuccessState] =
    useState<ForecastOrderSuccessState | null>(null);

  const beginForecastOrder = (
    nextRequest: ForecastOrderDialogRequest,
    resolvedAccountState?: RadarForecastAccountState,
  ) => {
    const initialAccountState =
      resolvedAccountState ?? nextRequest.initialAccountState ?? null;

    setSuccessState(null);
    setDisclaimerState(
      hasAcceptedForecastOrderDisclaimer() ? "accepted" : "required",
    );
    setRequest({
      ...nextRequest,
      initialAccountState: initialAccountState ?? undefined,
    });
    setRequestKey((currentKey) => currentKey + 1);
    setResource({
      status: nextRequest.market && initialAccountState ? "ready" : "loading",
      market: nextRequest.market ?? null,
      initialAccountState,
      error: null,
    });
  };

  const openForecastOrder = (nextRequest: ForecastOrderDialogRequest) => {
    void (async () => {
      try {
        const resolvedAccountState = nextRequest.initialAccountState
          ? nextRequest.initialAccountState
          : await fetchForecastAccountState(
              nextRequest.marketId,
              new AbortController().signal,
            );

        if (resolvedAccountState.authStatus !== "authenticated") {
          router.push(buildForecastLoginRoute(nextRequest.marketId));
          return;
        }

        beginForecastOrder(nextRequest, resolvedAccountState);
      } catch {
        beginForecastOrder(nextRequest);
      }
    })();
  };

  const closeForecastOrder = () => {
    setRequest(null);
    setDisclaimerState("idle");
    setResource({
      status: "idle",
      market: null,
      initialAccountState: null,
      error: null,
    });
  };

  const closeSuccessDialog = () => {
    setSuccessState(null);
  };

  const acknowledgeDisclaimer = () => {
    persistForecastOrderDisclaimerAcceptance();
    setDisclaimerState("accepted");
  };

  const retryCurrentRequest = () => {
    if (!request) {
      return;
    }

    setRequestKey((currentKey) => currentKey + 1);
    setResource((currentResource) => ({
      ...currentResource,
      status: "loading",
      error: null,
    }));
  };

  useEffect(() => {
    if (!request) {
      return;
    }

    if (request.market && request.initialAccountState) {
      return;
    }

    let isCancelled = false;
    const abortController = new AbortController();

    const loadRequestResources = async () => {
      try {
        const [market, initialAccountState] = await Promise.all([
          request.market
            ? Promise.resolve(request.market)
            : fetchRadarMarketDetail(request.marketId, abortController.signal),
          request.initialAccountState
            ? Promise.resolve(request.initialAccountState)
            : fetchForecastAccountState(
                request.marketId,
                abortController.signal,
              ),
        ]);

        if (isCancelled || abortController.signal.aborted) {
          return;
        }

        setResource({
          status: "ready",
          market,
          initialAccountState,
          error: null,
        });
      } catch (error) {
        if (isCancelled || abortController.signal.aborted) {
          return;
        }

        setResource((currentResource) => ({
          ...currentResource,
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Nao foi possivel abrir esse ticket agora.",
        }));
      }
    };

    void loadRequestResources();

    return () => {
      isCancelled = true;
      abortController.abort();
    };
  }, [request, requestKey]);

  const isDisclaimerRequired = disclaimerState === "required";
  const isDisclaimerDialogOpen = Boolean(request) && isDisclaimerRequired;
  const isOrderDialogOpen = Boolean(request) && !isDisclaimerRequired;
  const disclaimerContent = (
    <div className="space-y-6 px-5 pb-5 pt-6 md:px-6 md:pb-6 md:pt-7">
      <DialogHeader className="space-y-3 text-left">
        <div className="inline-flex w-fit rounded-full border border-primary/18 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
          Primeiro acesso
        </div>
        <DialogTitle className="max-w-2xl text-balance text-[1.35rem] font-semibold leading-tight text-white md:text-[1.7rem]">
          Antes de votar, pode ficar tranquilo: aqui nao entra dinheiro de
          verdade.
        </DialogTitle>
        <DialogDescription className="max-w-2xl text-sm leading-7 text-white/62 md:text-[0.98rem]">
          Todas as operacoes desse mercado usam REAL Credits, uma moeda virtual
          que todo mundo recebe ao criar a conta. Ela serve para testar
          estrategias, montar posicoes e acompanhar seu desempenho dentro da
          plataforma.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 rounded-[26px] border border-white/8 bg-white/[0.035] p-4 md:p-5">
        <p className="text-sm leading-7 text-white/56 md:text-[0.98rem]">
          Quando voce concordar, esse aviso nao volta mais neste navegador.
        </p>
        <p className="text-sm leading-7 text-white/56 md:text-[0.98rem]">
          Seu saldo inicial e todas as trades aqui dentro sao simuladas. O
          objetivo e deixar a experiencia clara e sem risco financeiro real.
        </p>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-white/8 pt-4 sm:flex-row sm:items-center sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={closeForecastOrder}
          className="rounded-2xl border-white/10 bg-white/4 text-white hover:bg-white/8 hover:text-white"
        >
          Agora nao
        </Button>
        <Button
          type="button"
          onClick={acknowledgeDisclaimer}
          className="rounded-2xl text-sm font-semibold"
        >
          Eu concordo
        </Button>
      </div>
    </div>
  );

  return (
    <ForecastOrderDialogContext.Provider
      value={{
        openForecastOrder,
        closeForecastOrder,
      }}
    >
      {children}

      <Dialog
        open={isDisclaimerDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeForecastOrder();
          }
        }}
      >
        <DialogContent className="code-surface w-full max-w-[calc(100vw-1rem)] rounded-[32px] border border-white/10 bg-market-surface/98 p-0 text-white shadow-[0_38px_120px_-50px_rgba(0,0,0,0.96)] ring-1 ring-white/10 sm:max-w-[min(40rem,calc(100vw-2rem))]">
          {disclaimerContent}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isOrderDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeForecastOrder();
          }
        }}
      >
        <DialogContent
          showCloseButton={resource.status !== "loading"}
          className="code-surface z-60 max-h-[calc(100dvh-1rem)] w-full max-w-[calc(100vw-1rem)] overflow-hidden rounded-[34px] border border-white/10 bg-market-surface/98 p-0 text-white shadow-[0_42px_140px_-48px_rgba(0,0,0,0.96)] ring-1 ring-white/10 sm:max-h-[calc(100dvh-2rem)] sm:max-w-[min(52rem,calc(100vw-2rem))] lg:max-w-[min(66rem,calc(100vw-3rem))] xl:rounded-[40px]"
        >
          <div className="max-h-[calc(100dvh-1rem)] overflow-x-hidden overflow-y-auto overscroll-contain px-4 pb-4 pt-4 sm:max-h-[calc(100dvh-2rem)] sm:px-5 md:px-8 md:pb-8 md:pt-7 lg:px-10">
            <div className="space-y-6 md:space-y-7">
              <DialogHeader className="gap-3 rounded-[28px] border border-white/10 bg-white/[0.035] px-4 py-4 pr-12 sm:px-5 md:px-6 md:py-5 md:pr-14">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-white/40">
                  <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary">
                    Ordem global
                  </span>
                  {resource.market ? (
                    <>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-white/56">
                        {resource.market.category}
                      </span>
                      <span className="text-white/24">•</span>
                      <span>{resource.market.closeLabel}</span>
                    </>
                  ) : null}
                </div>
                <DialogTitle className="max-w-5xl text-balance text-[1.48rem] font-semibold leading-[1.04] text-white md:text-[1.92rem] lg:text-[2.15rem]">
                  {resource.market?.title ?? "Carregando ordem"}
                </DialogTitle>
                <DialogDescription className="max-w-3xl text-[0.95rem] leading-7 text-white/58 md:text-base">
                  Revise saldo, direcao e credits antes de confirmar a operacao.
                </DialogDescription>
              </DialogHeader>

              {resource.status === "loading" ? (
                <div className="flex min-h-72 items-center justify-center rounded-[28px] border border-white/8 bg-white/4 px-6 py-8 text-sm text-white/58">
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Sincronizando mercado e conta
                </div>
              ) : null}

              {resource.status === "error" ? (
                <div className="space-y-4 rounded-[28px] border border-market-warning/18 bg-market-warning/10 px-5 py-5 text-sm text-market-warning">
                  <p>
                    {resource.error ??
                      "Nao foi possivel abrir esse ticket agora."}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={retryCurrentRequest}
                    className="rounded-2xl border-white/10 bg-white/6 text-white hover:bg-white/10 hover:text-white"
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : null}

              {resource.status === "ready" &&
              resource.market &&
              resource.initialAccountState &&
              request ? (
                <div className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.018))] p-4 md:p-5 lg:p-6">
                  <RadarForecastPanel
                    key={`${request.marketId}:${request.initialMode ?? "entry"}:${request.initialPosition ?? "yes"}:${requestKey}`}
                    display="dialog"
                    market={resource.market}
                    initialAccountState={resource.initialAccountState}
                    initialMode={request.initialMode}
                    initialPosition={request.initialPosition}
                    accountStateSyncMode={
                      request.accountStateSyncMode ?? "poll"
                    }
                    executionRedirectRoute={
                      request.executionRedirectRoute ?? null
                    }
                    onAccountStateChange={request.onAccountStateChange}
                    onMarketUpdate={request.onMarketUpdate}
                    onExecutionSuccess={(result) => {
                      request.onExecutionSuccess?.(result);
                      queueMicrotask(() => {
                        closeForecastOrder();
                        setSuccessState(buildSuccessState(result));
                      });
                    }}
                  />
                </div>
              ) : null}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(successState)}
        onOpenChange={(open) => {
          if (!open) {
            closeSuccessDialog();
          }
        }}
      >
        <DialogContent className="code-surface w-full max-w-[calc(100vw-1rem)] rounded-[32px] border border-white/10 bg-market-surface/98 p-0 text-white shadow-[0_38px_120px_-50px_rgba(0,0,0,0.96)] ring-1 ring-white/10 sm:max-w-[min(32rem,calc(100vw-2rem))]">
          {successState ? (
            <div className="space-y-5 px-5 pb-5 pt-6 md:px-6 md:pb-6">
              <div className="mx-auto flex h-15 w-15 items-center justify-center rounded-full border border-primary/18 bg-primary/12 text-primary shadow-[0_20px_55px_-28px_rgba(95,167,255,0.7)]">
                <CheckCircle2 className="h-7 w-7" />
              </div>

              <DialogHeader className="items-center space-y-2 text-center">
                <div className="rounded-full border border-primary/16 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
                  {getSuccessBadgeLabel(successState.kind)}
                </div>
                <DialogTitle className="text-balance text-[1.55rem] font-semibold leading-tight text-white md:text-[1.8rem]">
                  Operacao concluida
                </DialogTitle>
                <DialogDescription className="max-w-md text-sm leading-6 text-white/58 md:text-[0.95rem]">
                  {successState.message}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-[26px] border border-white/8 bg-white/[0.035] p-4">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/38">
                  Mercado
                </p>
                <p className="mt-2 text-base font-semibold leading-6 text-white">
                  {successState.marketTitle}
                </p>
                <p className="mt-2 text-sm text-white/52">
                  {successState.positionLabel
                    ? `Posicao atual: ${successState.positionLabel}`
                    : "Sem posicao aberta depois dessa operacao."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[22px] border border-white/8 bg-white/[0.035] p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/38">
                    Saldo livre
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {successState.availableCreditsLabel}
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/8 bg-white/[0.035] p-4">
                  <p className="text-[11px] uppercase tracking-[0.2em] text-white/38">
                    Equity total
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {successState.totalEquityLabel}
                  </p>
                </div>
              </div>

              <Button
                type="button"
                onClick={closeSuccessDialog}
                className="h-11 w-full rounded-2xl text-sm font-semibold"
              >
                Fechar
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </ForecastOrderDialogContext.Provider>
  );
}

export function useForecastOrderDialog() {
  const context = useContext(ForecastOrderDialogContext);

  if (!context) {
    throw new Error(
      "useForecastOrderDialog deve ser usado dentro de ForecastOrderDialogProvider.",
    );
  }

  return context;
}

export type { ForecastOrderDialogRequest };
