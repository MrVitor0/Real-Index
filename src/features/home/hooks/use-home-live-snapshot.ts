"use client";

import { startTransition, useEffect, useState } from "react";

import { navbarBalanceSchema } from "@/features/account/contracts/navbar-balance";
import { NAVBAR_BALANCE_SYNC_EVENT } from "@/features/account/lib/navbar-balance-sync";
import {
  homeLiveResponseSchema,
  type HomeLiveResponse,
} from "@/features/home/contracts/home-live";

type HomeLiveSnapshotState = {
  status: "loading" | "success" | "error";
  data: HomeLiveResponse | null;
  error: string | null;
};

function patchNavbarBalance(
  currentData: HomeLiveResponse | null,
  nextBalance: HomeLiveResponse["data"]["navbarBalance"],
) {
  if (!currentData) {
    return currentData;
  }

  return {
    ...currentData,
    data: {
      ...currentData.data,
      navbarBalance: nextBalance,
    },
  } satisfies HomeLiveResponse;
}

export function useHomeLiveSnapshot() {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<HomeLiveSnapshotState>({
    status: "loading",
    data: null,
    error: null,
  });

  useEffect(() => {
    let isDisposed = false;
    const eventSource = new EventSource("/api/v1/home-live");

    const handleSnapshot = (event: Event) => {
      if (!(event instanceof MessageEvent)) {
        return;
      }

      try {
        const nextData = homeLiveResponseSchema.parse(JSON.parse(event.data));

        if (isDisposed) {
          return;
        }

        setState({
          status: "success",
          data: nextData,
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
              : "Nao foi possivel interpretar o stream live da home.",
        }));
      }
    };

    const handleFailure = (event: Event) => {
      if (isDisposed) {
        return;
      }

      let errorMessage = "Nao foi possivel atualizar o stream live da home.";

      if (event instanceof MessageEvent) {
        try {
          const payload = JSON.parse(event.data) as {
            error?: unknown;
          };

          if (typeof payload.error === "string") {
            errorMessage = payload.error;
          }
        } catch {
          errorMessage = "Nao foi possivel atualizar o stream live da home.";
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

      setState((currentState) =>
        currentState.data
          ? {
              status: "success",
              data: currentState.data,
              error: null,
            }
          : currentState,
      );
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
          "Nao foi possivel manter a conexao live da home.",
      }));
    };

    const handleBalanceSync = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const parsedBalance = navbarBalanceSchema.safeParse(event.detail);

      if (!parsedBalance.success) {
        return;
      }

      setState((currentState) => ({
        status: currentState.data ? "success" : currentState.status,
        data: patchNavbarBalance(currentState.data, parsedBalance.data),
        error: currentState.data ? null : currentState.error,
      }));
    };

    eventSource.addEventListener("snapshot", handleSnapshot as EventListener);
    eventSource.addEventListener("failure", handleFailure as EventListener);
    eventSource.addEventListener("open", handleConnectionOpen as EventListener);
    eventSource.addEventListener(
      "error",
      handleConnectionError as EventListener,
    );
    window.addEventListener(NAVBAR_BALANCE_SYNC_EVENT, handleBalanceSync);

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
      window.removeEventListener(NAVBAR_BALANCE_SYNC_EVENT, handleBalanceSync);
      eventSource.close();
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
