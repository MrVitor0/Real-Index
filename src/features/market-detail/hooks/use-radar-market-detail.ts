"use client";

import { startTransition, useEffect, useState } from "react";

import {
  radarMarketDetailSchema,
  type RadarMarketDetail,
} from "@/features/market-detail/contracts/radar-market-detail";

type RadarMarketDetailState = {
  status: "loading" | "success" | "error";
  data: RadarMarketDetail;
  error: string | null;
};

const BACKGROUND_REFRESH_MS = 5_000;

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
    throw new Error("Nao foi possivel sincronizar os dados desse mercado.");
  }

  const payload = await response.json();

  return radarMarketDetailSchema.parse(payload);
}

export function useRadarMarketDetail(initialMarket: RadarMarketDetail) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<RadarMarketDetailState>({
    status: "success",
    data: initialMarket,
    error: null,
  });

  useEffect(() => {
    setState({
      status: "success",
      data: initialMarket,
      error: null,
    });
  }, [initialMarket]);

  useEffect(() => {
    let isCancelled = false;
    let timeoutId: number | null = null;
    let activeAbortController: AbortController | null = null;

    const loadAndSchedule = async () => {
      activeAbortController?.abort();
      activeAbortController = new AbortController();

      try {
        const nextMarket = await fetchRadarMarketDetail(
          initialMarket.id,
          activeAbortController.signal,
        );

        if (!isCancelled && !activeAbortController.signal.aborted) {
          setState({
            status: "success",
            data: nextMarket,
            error: null,
          });
        }
      } catch (error) {
        if (!isCancelled && !activeAbortController.signal.aborted) {
          setState((currentState) => ({
            status: "error",
            data: currentState.data,
            error:
              error instanceof Error
                ? error.message
                : "Nao foi possivel sincronizar os dados desse mercado.",
          }));
        }
      }

      if (isCancelled) {
        return;
      }

      timeoutId = window.setTimeout(() => {
        void loadAndSchedule();
      }, BACKGROUND_REFRESH_MS);
    };

    void loadAndSchedule();

    return () => {
      isCancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }

      activeAbortController?.abort();
    };
  }, [initialMarket.id, reloadKey]);

  return {
    ...state,
    reload: () => {
      startTransition(() => {
        setReloadKey((currentKey) => currentKey + 1);
      });
    },
    replace: (nextMarket: RadarMarketDetail) => {
      startTransition(() => {
        setState({
          status: "success",
          data: nextMarket,
          error: null,
        });
      });
    },
  };
}
