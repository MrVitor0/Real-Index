"use client";

import { useEffect, useEffectEvent, useState } from "react";

import {
  communityMetricsResponseSchema,
  type CommunityMetricsResponse,
} from "@/features/home/contracts/community-metrics";

type CommunityMetricsState = {
  status: "loading" | "success" | "error";
  data: CommunityMetricsResponse | null;
  error: string | null;
};

const BACKGROUND_REFRESH_MS = 30_000;

async function fetchCommunityMetrics(signal: AbortSignal) {
  const response = await fetch("/api/v1/community-metrics", {
    method: "GET",
    cache: "no-store",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar as metricas da comunidade.");
  }

  const payload = await response.json();

  return communityMetricsResponseSchema.parse(payload);
}

export function useCommunityMetrics() {
  const [state, setState] = useState<CommunityMetricsState>({
    status: "loading",
    data: null,
    error: null,
  });

  const loadCommunityMetrics = useEffectEvent(async (signal: AbortSignal) => {
    setState((currentState) => ({
      ...currentState,
      status: currentState.data ? currentState.status : "loading",
      error: null,
    }));

    try {
      const nextData = await fetchCommunityMetrics(signal);

      if (signal.aborted) {
        return;
      }

      setState({
        status: "success",
        data: nextData,
        error: null,
      });
    } catch (error) {
      if (signal.aborted) {
        return;
      }

      setState((currentState) => ({
        status: "error",
        data: currentState.data,
        error:
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar as metricas da comunidade.",
      }));
    }
  });

  useEffect(() => {
    let isCancelled = false;
    let timeoutId: number | null = null;
    let activeAbortController: AbortController | null = null;

    const loadAndSchedule = async () => {
      activeAbortController?.abort();
      activeAbortController = new AbortController();

      await loadCommunityMetrics(activeAbortController.signal);

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
  }, []);

  return state;
}
