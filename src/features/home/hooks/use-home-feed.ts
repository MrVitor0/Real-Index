"use client";

import { startTransition, useEffect, useEffectEvent, useState } from "react";

import {
  homeFeedResponseSchema,
  type HomeFeedResponse,
} from "@/features/home/contracts/home-feed";

type HomeFeedState = {
  status: "loading" | "success" | "error";
  data: HomeFeedResponse | null;
  error: string | null;
};

const BACKGROUND_REFRESH_MS = 5_000;

async function fetchHomeFeed(signal: AbortSignal) {
  const response = await fetch("/api/v1/home-feed", {
    method: "GET",
    cache: "no-store",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o painel inicial do sistema.");
  }

  const payload = await response.json();

  return homeFeedResponseSchema.parse(payload);
}

export function useHomeFeed() {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<HomeFeedState>({
    status: "loading",
    data: null,
    error: null,
  });

  const loadHomeFeed = useEffectEvent(async (signal: AbortSignal) => {
    setState((currentState) => ({
      ...currentState,
      status: currentState.data ? currentState.status : "loading",
      error: null,
    }));

    try {
      const nextData = await fetchHomeFeed(signal);

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
            : "Nao foi possivel carregar o painel inicial do sistema.",
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

      await loadHomeFeed(activeAbortController.signal);

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
  }, [reloadKey]);

  return {
    ...state,
    reload: () => {
      startTransition(() => {
        setReloadKey((currentKey) => currentKey + 1);
      });
    },
  };
}
