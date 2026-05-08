"use client";

import type { Route } from "next";
import { useRouter } from "next/navigation";
import { startTransition, useEffect, useEffectEvent, useState } from "react";

import { dispatchNavbarBalanceSync } from "@/features/account/lib/navbar-balance-sync";
import type {
  RadarForecastAccountState,
  RadarForecastExecutionResponse,
  RadarForecastPreviewResponse,
  RadarMarketDetail,
} from "@/features/market-detail/contracts/radar-market-detail";
import {
  RADAR_FORECAST_CLOSE_ALL_CREDITS_INPUT,
  radarForecastAccountStateSchema,
  radarForecastExecutionResponseSchema,
  radarForecastPreviewResponseSchema,
} from "@/features/market-detail/contracts/radar-market-detail";
import {
  formatCredits,
  formatCreditsInput,
  parseCreditsInput,
} from "@/features/market-detail/lib/forecast";

type UseRadarForecastOrderOptions = {
  market: RadarMarketDetail;
  initialAccountState: RadarForecastAccountState;
  accountStateSyncMode?: RadarForecastAccountSyncMode;
  initialMode?: "entry" | "exit";
  initialPosition?: "yes" | "no";
  executionRedirectRoute?: Route | null;
  onAccountStateChange?: (state: RadarForecastAccountState) => void;
  onMarketUpdate?: (market: RadarMarketDetail) => void;
  onExecutionSuccess?: (result: RadarForecastExecutionResponse) => void;
};

export type RadarForecastAccountSyncMode = "poll" | "external";

type ForecastAccountStateStatus = "loading" | "success" | "error";

const ACCOUNT_REFRESH_MS = 15_000;

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

  const rawText = await response.text();

  return {
    error:
      response.status === 404 || rawText.includes("<!DOCTYPE html")
        ? FORECAST_ROUTE_UNAVAILABLE_MESSAGE
        : "O servidor respondeu em um formato inesperado para esse forecast.",
    rawText,
  };
}

function buildInitialCreditsInput(minimumCredits: number) {
  return formatCreditsInput(Math.max(minimumCredits, 250));
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

export function useRadarForecastOrder({
  market,
  initialAccountState,
  accountStateSyncMode = "poll",
  initialMode = "entry",
  initialPosition = "yes",
  executionRedirectRoute = null,
  onAccountStateChange,
  onMarketUpdate,
  onExecutionSuccess,
}: UseRadarForecastOrderOptions) {
  const router = useRouter();
  const [position, setPositionState] = useState<"yes" | "no">(initialPosition);
  const [mode, setModeState] = useState<"entry" | "exit">(initialMode);
  const [creditsInput, setCreditsInputState] = useState(() =>
    buildInitialCreditsInput(market.participationConfig.minimumCredits),
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
  const [sellAll, setSellAll] = useState(false);

  const credits = parseCreditsInput(creditsInput);
  const currentPosition = accountState?.openPosition ?? null;
  const effectiveMode = mode === "exit" && !currentPosition ? "entry" : mode;
  const resolvedPosition =
    effectiveMode === "exit" && currentPosition
      ? currentPosition.side
      : position;
  const minimumCredits =
    effectiveMode === "entry" ? market.participationConfig.minimumCredits : 1;
  const maxSellableCredits = currentPosition?.marketValueCredits ?? 0;
  const maxSellableCreditsLabel =
    currentPosition?.marketValueCreditsLabel ?? formatCredits(0);
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
      : Boolean(currentPosition) && (sellAll || credits > 0));
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

  const resolveRequestCreditsInput = () => {
    if (effectiveMode === "exit" && sellAll) {
      return RADAR_FORECAST_CLOSE_ALL_CREDITS_INPUT;
    }

    return creditsInput;
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
    if (accountStateSyncMode === "external") {
      return;
    }

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
  }, [accountStateSyncMode, market.id]);

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
            creditsInput: resolveRequestCreditsInput(),
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
            creditsInput: resolveRequestCreditsInput(),
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
      onExecutionSuccess?.(result);

      if (result.viewerState.openPosition?.side) {
        setPositionState(result.viewerState.openPosition.side);
      }

      if (executionRedirectRoute) {
        startTransition(() => {
          router.push(executionRedirectRoute);
          router.refresh();
        });
      }
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
      setSellAll(false);
      const nextCredits = parseCreditsInput(creditsInput) + quickCredits;
      resetActionState();
      setCreditsInputState(formatCreditsInput(nextCredits));
    });
  };

  const applySellAllCredits = () => {
    if (!currentPosition) {
      return;
    }

    startTransition(() => {
      setSellAll(true);
      resetActionState();
      setCreditsInputState(formatCreditsInput(maxSellableCredits));
    });
  };

  return {
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
    market,
    maxSellableCreditsLabel,
    minimumCredits,
    preview,
    previewStatus,
    resolvedPosition,
    reviewActionLabel,
    scenarioLocked,
    sellAll,
    serverError,
    setCreditsInput: (value: string) => {
      resetActionState();
      setSellAll(false);
      setCreditsInputState(formatCreditsInput(value));
    },
    setIsPreviewDialogOpen,
    setMode: (nextMode: "entry" | "exit") => {
      resetActionState();
      setSellAll(false);
      setModeState(nextMode);
    },
    setPosition: (nextPosition: "yes" | "no") => {
      resetActionState();
      setPositionState(nextPosition);
    },
  };
}
