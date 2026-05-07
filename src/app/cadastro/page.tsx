import type { Metadata } from "next";

import { AuthScreen } from "@/features/auth/components/auth-screen";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Criar conta",
  description:
    "Crie sua conta para registrar conviccoes, subir no ranking e acompanhar o pulso da comunidade tech no REAL Severity Index.",
  alternates: {
    canonical: "/cadastro",
  },
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: `Criar conta | ${siteConfig.shortName}`,
    description:
      "Entre para a comunidade gamificada com REAL Credits virtuais, sem saque e sem compra de dinheiro.",
    url: "/cadastro",
  },
};

export const dynamic = "force-dynamic";

export default async function CadastroPage() {
  return <AuthScreen view="sign-up" />;
}
