import { z } from "zod";

export const navbarBalanceSchema = z.object({
  authStatus: z.enum(["anonymous", "authenticated"]),
  availableCredits: z.number().nonnegative(),
  availableCreditsLabel: z.string(),
});

export type NavbarBalance = z.infer<typeof navbarBalanceSchema>;
