"use client";

import { useEffect, useEffectEvent, useState } from "react";

import {
  navbarBalanceSchema,
  type NavbarBalance,
} from "@/features/account/contracts/navbar-balance";
import { NAVBAR_BALANCE_SYNC_EVENT } from "@/features/account/lib/navbar-balance-sync";

type NavbarBalanceState = {
  status: "loading" | "success" | "error";
  data: NavbarBalance | null;
  error: string | null;
};

const NAVBAR_BALANCE_REFRESH_MS = 15_000;

async function fetchNavbarBalance(signal: AbortSignal) {
  const response = await fetch("/api/v1/account/balance", {
    method: "GET",
    cache: "no-store",
    credentials: "include",
    signal,
    headers: {
      Accept: "application/json",
    },
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof payload?.error === "string"
        ? payload.error
        : "Nao foi possivel atualizar o saldo da navbar.",
    );
  }

  return navbarBalanceSchema.parse(payload);
}

export function useNavbarBalance(initialBalance: NavbarBalance | null) {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<NavbarBalanceState>({
    status: initialBalance ? "success" : "loading",
    data: initialBalance,
    error: null,
  });

  const loadNavbarBalance = useEffectEvent(async (signal: AbortSignal) => {
    setState((currentState) => ({
      ...currentState,
      status: currentState.data ? currentState.status : "loading",
      error: null,
    }));

    try {
      const nextBalance = await fetchNavbarBalance(signal);

      if (signal.aborted) {
        return;
      }

      setState({
        status: "success",
        data: nextBalance,
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
            : "Nao foi possivel atualizar o saldo da navbar.",
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

      await loadNavbarBalance(activeAbortController.signal);

      if (isCancelled) {
        return;
      }

      timeoutId = window.setTimeout(() => {
        void loadAndSchedule();
      }, NAVBAR_BALANCE_REFRESH_MS);
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

  useEffect(() => {
    const handleBalanceSync = (event: Event) => {
      if (!(event instanceof CustomEvent)) {
        return;
      }

      const parsedEvent = navbarBalanceSchema.safeParse(event.detail);

      if (!parsedEvent.success) {
        return;
      }

      setState({
        status: "success",
        data: parsedEvent.data,
        error: null,
      });
    };

    const requestFreshBalance = () => {
      setReloadKey((currentKey) => currentKey + 1);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        requestFreshBalance();
      }
    };

    window.addEventListener(NAVBAR_BALANCE_SYNC_EVENT, handleBalanceSync);
    window.addEventListener("focus", requestFreshBalance);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener(NAVBAR_BALANCE_SYNC_EVENT, handleBalanceSync);
      window.removeEventListener("focus", requestFreshBalance);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return state;
}
