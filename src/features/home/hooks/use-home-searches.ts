"use client";

import { useDeferredValue, useEffect, useEffectEvent, useState } from "react";

import {
  homeSearchesResponseSchema,
  type HomeSearchesData,
} from "@/features/home/contracts/searches";

type HomeSearchesState = {
  status: "idle" | "loading" | "success" | "error";
  data: HomeSearchesData | null;
  error: string | null;
};

export const MIN_HOME_SEARCH_QUERY_LENGTH = 2;

async function fetchHomeSearches(query: string, signal: AbortSignal) {
  const response = await fetch(
    `/api/v1/searches?q=${encodeURIComponent(query)}`,
    {
      method: "GET",
      cache: "no-store",
      signal,
      headers: {
        Accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Nao foi possivel pesquisar os mercados agora.");
  }

  const payload = await response.json();

  return homeSearchesResponseSchema.parse(payload);
}

export function useHomeSearches(query: string) {
  const deferredQuery = useDeferredValue(query.trim());
  const [state, setState] = useState<HomeSearchesState>({
    status: "idle",
    data: null,
    error: null,
  });

  const loadHomeSearches = useEffectEvent(
    async (signal: AbortSignal, normalizedQuery: string) => {
      if (normalizedQuery.length < MIN_HOME_SEARCH_QUERY_LENGTH) {
        setState({
          status: "idle",
          data: null,
          error: null,
        });

        return;
      }

      setState((currentState) => ({
        ...currentState,
        status: "loading",
        error: null,
      }));

      try {
        const nextData = await fetchHomeSearches(normalizedQuery, signal);

        if (signal.aborted) {
          return;
        }

        setState({
          status: "success",
          data: nextData.data,
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
              : "Nao foi possivel pesquisar os mercados agora.",
        }));
      }
    },
  );

  useEffect(() => {
    const abortController = new AbortController();
    const normalizedQuery = deferredQuery.trim();

    void loadHomeSearches(abortController.signal, normalizedQuery);

    return () => {
      abortController.abort();
    };
  }, [deferredQuery]);

  return {
    ...state,
    query: deferredQuery.trim(),
    hasActiveQuery: deferredQuery.trim().length >= MIN_HOME_SEARCH_QUERY_LENGTH,
  };
}
