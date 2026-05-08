"use client";

import { startTransition, useEffect, useState } from "react";

import {
  type RadarForecastAccountState,
  type RadarMarketDetail,
} from "@/features/market-detail/contracts/radar-market-detail";
import {
  type RadarLiveData,
  radarLiveResponseSchema,
} from "@/features/market-detail/contracts/radar-live";

type RadarLiveSnapshotState = {
  status: "success" | "error";
  data: RadarLiveData;
  error: string | null;
};

function buildInitialData(
  initialMarket: RadarMarketDetail,
  initialAccountState: RadarForecastAccountState,
) {
  return {
    market: initialMarket,
    accountState: initialAccountState,
  } satisfies RadarLiveData;
}

function patchMarket(currentData: RadarLiveData, market: RadarMarketDetail) {
  return {
    ...currentData,
    market,
  } satisfies RadarLiveData;
}

function patchAccountState(
  currentData: RadarLiveData,
  accountState: RadarForecastAccountState,
) {
  return {
    ...currentData,
    accountState,
  } satisfies RadarLiveData;
}

export function useRadarLiveSnapshot(input: {
  initialMarket: RadarMarketDetail;
  initialAccountState: RadarForecastAccountState;
}) {
  const { initialMarket, initialAccountState } = input;
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<RadarLiveSnapshotState>({
    status: "success",
    data: buildInitialData(initialMarket, initialAccountState),
    error: null,
  });

  useEffect(() => {
    setState({
      status: "success",
      data: buildInitialData(initialMarket, initialAccountState),
      error: null,
    });
  }, [initialAccountState, initialMarket]);

  useEffect(() => {
    let isDisposed = false;
    const eventSource = new EventSource(
      `/api/v1/radar/${initialMarket.id}/live`,
    );

    const handleSnapshot = (event: Event) => {
      if (!(event instanceof MessageEvent)) {
        return;
      }

      try {
        const nextData = radarLiveResponseSchema.parse(JSON.parse(event.data));

        if (isDisposed) {
          return;
        }

        setState({
          status: "success",
          data: nextData.data,
          error: null,
        });
      } catch (error) {
        if (isDisposed) {
          return;
        }

        setState((currentState) => ({
          status: "error",
          data: currentState.data,
          error:
            error instanceof Error
              ? error.message
              : "Nao foi possivel interpretar o stream live do radar.",
        }));
      }
    };

    const handleFailure = (event: Event) => {
      if (isDisposed) {
        return;
      }

      let errorMessage = "Nao foi possivel atualizar o stream live do radar.";

      if (event instanceof MessageEvent) {
        try {
          const payload = JSON.parse(event.data) as {
            error?: unknown;
          };

          if (typeof payload.error === "string") {
            errorMessage = payload.error;
          }
        } catch {
          errorMessage = "Nao foi possivel atualizar o stream live do radar.";
        }
      }

      setState((currentState) => ({
        status: "error",
        data: currentState.data,
        error: errorMessage,
      }));
    };

    const handleConnectionOpen = () => {
      if (isDisposed) {
        return;
      }

      setState((currentState) => ({
        status: "success",
        data: currentState.data,
        error: null,
      }));
    };

    const handleConnectionError = () => {
      if (isDisposed) {
        return;
      }

      setState((currentState) => ({
        status: "error",
        data: currentState.data,
        error:
          currentState.error ??
          "Nao foi possivel manter a conexao live do radar.",
      }));
    };

    eventSource.addEventListener("snapshot", handleSnapshot as EventListener);
    eventSource.addEventListener("failure", handleFailure as EventListener);
    eventSource.addEventListener("open", handleConnectionOpen as EventListener);
    eventSource.addEventListener(
      "error",
      handleConnectionError as EventListener,
    );

    return () => {
      isDisposed = true;
      eventSource.removeEventListener(
        "snapshot",
        handleSnapshot as EventListener,
      );
      eventSource.removeEventListener(
        "failure",
        handleFailure as EventListener,
      );
      eventSource.removeEventListener(
        "open",
        handleConnectionOpen as EventListener,
      );
      eventSource.removeEventListener(
        "error",
        handleConnectionError as EventListener,
      );
      eventSource.close();
    };
  }, [initialMarket.id, reloadKey]);

  return {
    ...state,
    reload: () => {
      startTransition(() => {
        setReloadKey((currentKey) => currentKey + 1);
      });
    },
    replaceAccountState: (accountState: RadarForecastAccountState) => {
      startTransition(() => {
        setState((currentState) => ({
          status: "success",
          data: patchAccountState(currentState.data, accountState),
          error: null,
        }));
      });
    },
    replaceMarket: (market: RadarMarketDetail) => {
      startTransition(() => {
        setState((currentState) => ({
          status: "success",
          data: patchMarket(currentState.data, market),
          error: null,
        }));
      });
    },
  };
}
