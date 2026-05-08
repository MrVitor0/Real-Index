import type { NavbarBalance } from "@/features/account/contracts/navbar-balance";

export const NAVBAR_BALANCE_SYNC_EVENT = "real:index:navbar-balance-sync";

export function dispatchNavbarBalanceSync(balance: NavbarBalance) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<NavbarBalance>(NAVBAR_BALANCE_SYNC_EVENT, {
      detail: balance,
    }),
  );
}
