"use client";

import { useEffect, useEffectEvent, useState } from "react";

import {
  recentActivityResponseSchema,
  type RecentActivityResponse,
} from "@/features/home/contracts/recent-activity";

type RecentActivityState = {
  status: "loading" | "success" | "error";
  data: RecentActivityResponse | null;
  error: string | null;
};

const BACKGROUND_REFRESH_MS = 5_000;

async function fetchRecentActivity(limit: number, signal: AbortSignal) {
  const response = await fetch(`/api/v1/recent-events?limit=${limit}`, {
    method: "GET",
    cache: "no-store",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o feed live da plataforma.");
  }

  const payload = await response.json();

  return recentActivityResponseSchema.parse(payload);
}

export function useRecentActivity(limit = 3) {
  const [state, setState] = useState<RecentActivityState>({
    status: "loading",
    data: null,
    error: null,
  });

  const loadRecentActivity = useEffectEvent(async (signal: AbortSignal) => {
    setState((currentState) => ({
      ...currentState,
      status: currentState.data ? currentState.status : "loading",
      error: null,
    }));

    try {
      const nextData = await fetchRecentActivity(limit, signal);

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
            : "Nao foi possivel carregar o feed live da plataforma.",
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

      await loadRecentActivity(activeAbortController.signal);

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
  }, [limit]);

  return state;
}
