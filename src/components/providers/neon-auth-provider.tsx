"use client";

import type { ReactNode } from "react";
import { NeonAuthUIProvider } from "@neondatabase/auth/react/ui";

import { authClient } from "@/lib/auth/client";

type NeonAuthProviderProps = {
  children: ReactNode;
};

export function NeonAuthProvider({ children }: NeonAuthProviderProps) {
  return (
    <NeonAuthUIProvider
      authClient={authClient}
      className="real-auth-ui"
      redirectTo="/conta"
      credentials={{ forgotPassword: true }}
      social={{ providers: ["google"] }}
    >
      {children}
    </NeonAuthUIProvider>
  );
}
