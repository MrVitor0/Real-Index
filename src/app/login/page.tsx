import type { Metadata } from "next";

import { AuthScreen } from "@/features/auth/components/auth-screen";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Acesse sua conta para acompanhar forecasts, reputacao e sinais da comunidade no REAL Severity Index.",
  alternates: {
    canonical: "/login",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `Entrar | ${siteConfig.shortName}`,
    description:
      "Acesso privado para forecasts, rankings e historico de atividade da comunidade.",
    url: "/login",
  },
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  return <AuthScreen view="sign-in" />;
}
