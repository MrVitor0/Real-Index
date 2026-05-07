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
    throw new Error("Nao foi possivel carregar a home do sistema.");
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
      status: "loading",
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
            : "Nao foi possivel carregar a home do sistema.",
      }));
    }
  });

  useEffect(() => {
    const abortController = new AbortController();

    void loadHomeFeed(abortController.signal);

    return () => {
      abortController.abort();
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
