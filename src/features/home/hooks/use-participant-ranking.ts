"use client";

import { useEffect, useEffectEvent, useState } from "react";

import {
  participantRankingResponseSchema,
  type ParticipantRankingResponse,
} from "@/features/home/contracts/participant-ranking";

type ParticipantRankingState = {
  status: "loading" | "success" | "error";
  data: ParticipantRankingResponse | null;
  error: string | null;
};

const BACKGROUND_REFRESH_MS = 12_000;

async function fetchParticipantRanking(limit: number, signal: AbortSignal) {
  const response = await fetch(`/api/v1/ranking?limit=${limit}`, {
    method: "GET",
    cache: "no-store",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Nao foi possivel carregar o ranking da comunidade.");
  }

  const payload = await response.json();

  return participantRankingResponseSchema.parse(payload);
}

export function useParticipantRanking(limit = 3) {
  const [state, setState] = useState<ParticipantRankingState>({
    status: "loading",
    data: null,
    error: null,
  });

  const loadParticipantRanking = useEffectEvent(async (signal: AbortSignal) => {
    setState((currentState) => ({
      ...currentState,
      status: currentState.data ? currentState.status : "loading",
      error: null,
    }));

    try {
      const nextData = await fetchParticipantRanking(limit, signal);

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
            : "Nao foi possivel carregar o ranking da comunidade.",
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

      await loadParticipantRanking(activeAbortController.signal);

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
